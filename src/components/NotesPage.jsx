import React, { useEffect, useRef, useState } from "react";
import { loadNotesFeedCache, saveNotesFeedCache } from "../utils/storage";
import Masonry from "react-masonry-css";
import { StickyNote, Pin, PinOff, Plus, Loader2, SquareArrowOutUpRight } from "lucide-react";
import { format } from "date-fns";
import StyledSnippetPreview from "./StyledSnippetPreview";
import { useScrollChrome } from "../context/ScrollChromeContext.jsx";
import CollapsingChrome from "./CollapsingChrome.jsx";

export default function NotesPage({ user, snippetRepo, onOpenSnippetEditor }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const sentinelRef = useRef(null);
  const loadingRef = useRef(false);
  const triggeredWhileVisibleRef = useRef(false);
  const [filterMode, setFilterMode] = useState("all"); // 'all' | 'pinned'
  const { chromeHidden } = useScrollChrome();

  const itemsRef = useRef([]);
  const pinnedCursorRef = useRef(null);
  const unpinnedCursorRef = useRef(null);
  const filterModeRef = useRef(filterMode);

  useEffect(() => {
    filterModeRef.current = filterMode;
  }, [filterMode]);

  function applyFilter(list, mode) {
    if (!Array.isArray(list)) return [];
    if (mode === "pinned") return list.filter((it) => !!it?.pinned);
    return list;
  }

  function sortItems(list) {
    if (!Array.isArray(list)) return [];
    return [...list].sort((a, b) => {
      const ap = a?.pinned ? 1 : 0;
      const bp = b?.pinned ? 1 : 0;
      if (bp !== ap) return bp - ap;
      const am = new Date(a?.updatedAt?.toDate?.() || a?.updatedAt || 0).getTime() || 0;
      const bm = new Date(b?.updatedAt?.toDate?.() || b?.updatedAt || 0).getTime() || 0;
      return bm - am;
    });
  }

  function normalizeCached(cached) {
    if (!Array.isArray(cached)) return [];
    // Drop legacy day-note feed entries; keep freeform notes (former snippets)
    return cached
      .map((it) => {
        if (it && it.type === "snippet" && it.data) return it.data;
        if (it && it.type === "note") return null;
        if (it && it.id && (it.title != null || it.content != null) && !it.dateKey) return it;
        return null;
      })
      .filter(Boolean);
  }

  useEffect(() => {
    try {
      const cached = normalizeCached(loadNotesFeedCache());
      if (cached.length > 0) {
        itemsRef.current = sortItems(cached);
        setItems(applyFilter(itemsRef.current, filterModeRef.current));
        try { saveNotesFeedCache(itemsRef.current); } catch {}
      }
    } catch (e) {
      console.error("Failed to load from cache:", e);
    }

    function onSnippetsUpdated(e) {
      try {
        const list = (e?.detail?.items || []).filter((s) => !s.archived);
        itemsRef.current = sortItems(list);
        try { saveNotesFeedCache(itemsRef.current); } catch {}
        setItems(applyFilter(itemsRef.current, filterModeRef.current));
      } catch (err) {
        console.error("Error in onSnippetsUpdated:", err);
      }
    }
    window.addEventListener("snippets:updated", onSnippetsUpdated);

    if (!snippetRepo || !user) {
      return () => {
        window.removeEventListener("snippets:updated", onSnippetsUpdated);
      };
    }

    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const page = await snippetRepo.listSnippetsPage({ limit: 20 });
        if (!mounted) return;
        const list = page?.items || [];
        itemsRef.current = sortItems(list);
        pinnedCursorRef.current = page?.nextPinnedCursor || null;
        unpinnedCursorRef.current = page?.nextUnpinnedCursor || null;
        setItems(applyFilter(itemsRef.current, filterModeRef.current));
        try { saveNotesFeedCache(itemsRef.current); } catch {}
      } catch (e) {
        console.error("Failed to load notes feed", e);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
      window.removeEventListener("snippets:updated", onSnippetsUpdated);
    };
  }, [snippetRepo, user]);

  async function handleTogglePin(note) {
    if (!snippetRepo || !user || !note) return;
    const newPinned = !note.pinned;

    itemsRef.current = sortItems(
      itemsRef.current.map((it) =>
        it.id === note.id ? { ...it, pinned: newPinned, updatedAt: new Date() } : it
      )
    );
    try { saveNotesFeedCache(itemsRef.current); } catch {}
    setItems(applyFilter(itemsRef.current, filterModeRef.current));

    try {
      await snippetRepo.updateSnippet(note.id, { pinned: newPinned });
    } catch (e) {
      console.error("Failed to update note pin status in Firestore:", e);
      itemsRef.current = sortItems(
        itemsRef.current.map((it) =>
          it.id === note.id ? { ...it, pinned: !newPinned } : it
        )
      );
      try { saveNotesFeedCache(itemsRef.current); } catch {}
      setItems(applyFilter(itemsRef.current, filterModeRef.current));
    }
  }

  useEffect(() => {
    if (!sentinelRef.current) return;
    const el = sentinelRef.current;
    const io = new IntersectionObserver(async (entries) => {
      const first = entries[0];
      if (!first?.isIntersecting) {
        triggeredWhileVisibleRef.current = false;
        return;
      }
      if (triggeredWhileVisibleRef.current) return;
      triggeredWhileVisibleRef.current = true;

      const hasMore = !!(pinnedCursorRef.current || unpinnedCursorRef.current);
      if (!hasMore || !snippetRepo || !user) return;
      if (loadingRef.current) return;

      setLoading(true);
      loadingRef.current = true;
      try {
        const page = await snippetRepo.listSnippetsPage({
          limit: 20,
          startAfterPinnedCursor: pinnedCursorRef.current,
          startAfterUnpinnedCursor: unpinnedCursorRef.current,
        });
        pinnedCursorRef.current = page?.nextPinnedCursor ?? pinnedCursorRef.current;
        unpinnedCursorRef.current = page?.nextUnpinnedCursor ?? unpinnedCursorRef.current;
        const append = Array.isArray(page?.items) ? page.items : [];
        if (append.length) {
          const seen = new Set(itemsRef.current.map((n) => n.id));
          const fresh = append.filter((n) => n?.id && !seen.has(n.id));
          if (fresh.length) {
            itemsRef.current = sortItems([...itemsRef.current, ...fresh]);
            setItems(applyFilter(itemsRef.current, filterModeRef.current));
            try { saveNotesFeedCache(itemsRef.current); } catch {}
          }
        }
      } catch (e) {
        console.error("Load more notes failed", e);
      } finally {
        setLoading(false);
        loadingRef.current = false;
      }
    }, { rootMargin: "200px" });
    io.observe(el);
    return () => io.disconnect();
  }, [snippetRepo, user]);

  useEffect(() => {
    setItems(applyFilter(itemsRef.current, filterModeRef.current));
  }, [filterMode]);

  return (
    <main className="grid grid-cols-1 gap-4 sm:gap-6">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow p-3 sm:p-4 border border-transparent dark:border-slate-800">
        <div className="sticky top-0 z-20 -mx-3 px-3 sm:-mx-4 sm:px-4 -mt-3 sm:-mt-4 sm:pt-4 mb-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md">
          <CollapsingChrome hidden={chromeHidden}>
            <div className="pt-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between gap-2 min-w-0">
                <div className="font-semibold flex items-center gap-2 text-base sm:text-lg min-w-0 truncate">
                  {loading ? <Loader2 size={18} className="animate-spin shrink-0" /> : <StickyNote size={18} className="shrink-0" />}
                  <span className="truncate">Notes</span>
                </div>
                <button
                  type="button"
                  onClick={() => onOpenSnippetEditor && onOpenSnippetEditor("__new__")}
                  disabled={!user}
                  className="shrink-0 inline-flex items-center justify-center gap-1 h-9 px-3 text-xs rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-60 touch-manipulation"
                >
                  <Plus size={14} /> <span>Note</span>
                </button>
              </div>
              <div className="mt-2 inline-flex rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setFilterMode("all")}
                  className={`px-3 py-1.5 text-xs ${filterMode === "all" ? "bg-slate-200 dark:bg-slate-800" : "bg-white dark:bg-slate-900"}`}
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => setFilterMode("pinned")}
                  className={`px-3 py-1.5 text-xs border-l border-slate-200 dark:border-slate-700 ${filterMode === "pinned" ? "bg-slate-200 dark:bg-slate-800" : "bg-white dark:bg-slate-900"}`}
                >
                  Pinned
                </button>
              </div>
            </div>
          </CollapsingChrome>
        </div>
        {items.length === 0 && !loading && (
          <div className="p-3 text-sm text-slate-500">No notes yet.</div>
        )}
        <div className="overflow-x-hidden min-w-0">
          <Masonry
            breakpointCols={{ default: 3, 1024: 3, 768: 2, 640: 1 }}
            className="flex w-auto -ml-2 sm:-ml-3"
            columnClassName="pl-2 sm:pl-3 bg-clip-padding min-w-0"
          >
            {items.map((note, idx) => {
              const updated = new Date(note.updatedAt?.toDate?.() || note.updatedAt || 0);
              return (
                <div
                  key={`${note.id}_${idx}`}
                  onClick={() => onOpenSnippetEditor && onOpenSnippetEditor(note.id)}
                  className="mb-3 sm:mb-4 min-w-0 overflow-hidden text-left rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 sm:p-4 shadow-sm hover:shadow-lg dark:hover:ring-1 dark:hover:ring-slate-600 transition-all cursor-pointer group touch-manipulation"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="min-w-0 flex-1 inline-flex items-center gap-1.5 text-xs text-slate-500">
                      <StickyNote size={14} className="shrink-0" />
                      <span className="truncate">{isNaN(updated.getTime()) ? "—" : format(updated, "PPp")}</span>
                    </span>
                    <span className="shrink-0 inline-flex items-center gap-0.5">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation?.();
                          handleTogglePin(note);
                        }}
                        className={`h-8 w-8 inline-flex items-center justify-center rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-opacity touch-manipulation ${note.pinned ? "" : "sm:opacity-0 sm:group-hover:opacity-100"}`}
                        title={note.pinned ? "Unpin" : "Pin"}
                        aria-label={note.pinned ? "Unpin" : "Pin"}
                      >
                        {note.pinned ? <Pin size={15} className="text-indigo-600" /> : <PinOff size={15} className="text-slate-400" />}
                      </button>
                      <a
                        href={`#/x/sn/${note.id}`}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation?.()}
                        title="Open in new tab"
                        aria-label="Open in new tab"
                        className="h-8 w-8 inline-flex items-center justify-center rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity touch-manipulation text-slate-500"
                      >
                        <SquareArrowOutUpRight size={15} />
                      </a>
                    </span>
                  </div>
                  <div className="mt-2 min-w-0 overflow-hidden text-sm">
                    <div className="font-medium truncate">{note.title || "Untitled note"}</div>
                    {note.content ? (
                      <div className="mt-1 text-slate-600 dark:text-slate-400">
                        <StyledSnippetPreview content={note.content} />
                      </div>
                    ) : null}
                  </div>
                  <div className="mt-2 text-[11px] text-slate-500 truncate" title={updated.toString()}>
                    Updated {isNaN(updated.getTime()) ? "—" : format(updated, "PPp")}
                  </div>
                </div>
              );
            })}
          </Masonry>
        </div>
        <div ref={sentinelRef} className="h-8" />
        {loading && (
          <div className="p-3 text-sm text-slate-500 inline-flex items-center gap-2">
            <Loader2 size={16} className="animate-spin" /> Loading…
          </div>
        )}
      </div>
    </main>
  );
}
