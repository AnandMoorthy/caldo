import React, { useEffect, useRef, useState } from "react";
import { Plus, Pin, PinOff, Code2, Loader2 } from "lucide-react";

function sortSnippets(list) {
  return [...(list || [])].sort((a, b) => {
    const aPinned = Number(a.pinned);
    const bPinned = Number(b.pinned);
    if (aPinned !== bPinned) return bPinned - aPinned;
    const aTime = new Date(a.updatedAt?.toDate?.() || a.updatedAt || 0);
    const bTime = new Date(b.updatedAt?.toDate?.() || b.updatedAt || 0);
    return bTime - aTime;
  });
}

export default function SnippetsPage({ repo, user, initialSnippets = [], onOpenEditor, onSnippetsChanged }) {
  const [loading, setLoading] = useState(false);
  const [snippets, setSnippets] = useState(sortSnippets(initialSnippets));
  const [pinnedCursor, setPinnedCursor] = useState(null);
  const [unpinnedCursor, setUnpinnedCursor] = useState(null);
  const sentinelRef = useRef(null);
  const loadingRef = useRef(false);
  const triggeredWhileVisibleRef = useRef(false);

  useEffect(() => {
    setSnippets(sortSnippets(initialSnippets));
  }, [initialSnippets]);

  useEffect(() => {
    if (!repo || !user) return;
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const { items, nextPinnedCursor, nextUnpinnedCursor } = await repo.listSnippetsPage({ limit: 20 });
        if (!mounted) return;
        setSnippets(sortSnippets(items));
        setPinnedCursor(nextPinnedCursor || null);
        setUnpinnedCursor(nextUnpinnedCursor || null);
        try { onSnippetsChanged && onSnippetsChanged(sortSnippets(items)); } catch {}
      } catch (e) {
        console.error('Failed to load snippets', e);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [repo, user]);

  useEffect(() => {
    if (!sentinelRef.current) return;
    const el = sentinelRef.current;
    const io = new IntersectionObserver(async (entries) => {
      const first = entries[0];
      // Reset one-shot trigger when sentinel leaves viewport
      if (!first?.isIntersecting) {
        triggeredWhileVisibleRef.current = false;
        return;
      }
      // Only trigger once per intersection until it leaves viewport
      if (triggeredWhileVisibleRef.current) return;
      triggeredWhileVisibleRef.current = true;

      // Avoid fetching when both cursors are exhausted
      if (!pinnedCursor && !unpinnedCursor) return;

      if (loadingRef.current) return;
      try {
        setLoading(true);
        loadingRef.current = true;
        const { items, nextPinnedCursor, nextUnpinnedCursor } = await repo.listSnippetsPage({ limit: 20, startAfterPinnedCursor: pinnedCursor, startAfterUnpinnedCursor: unpinnedCursor });
        setSnippets(prev => sortSnippets([...(prev || []), ...(items || [])]));
        setPinnedCursor(nextPinnedCursor || null);
        setUnpinnedCursor(nextUnpinnedCursor || null);
        try { onSnippetsChanged && onSnippetsChanged(sortSnippets([...(snippets || []), ...(items || [])])); } catch {}
      } catch (e) {
        console.error('Load more snippets failed', e);
      } finally {
        setLoading(false);
        loadingRef.current = false;
      }
    }, { rootMargin: '200px' });
    io.observe(el);
    return () => io.disconnect();
  }, [pinnedCursor, unpinnedCursor, repo]);

  function onClickSnippet(snippet) {
    try {
      // Use drawer-based editor if provided via onOpenEditor
      onOpenEditor && onOpenEditor(snippet?.id || null);
    } catch {}
  }

  function onCreateSnippet() {
    try {
      onOpenEditor && onOpenEditor();
      // The modal will open with a new draft by default
    } catch {}
  }

  async function onTogglePin(snippet) {
    if (!repo || !user) return;
    const id = snippet?.id;
    if (!id) return;
    const nextPinned = !snippet.pinned;
    setSnippets(prev => sortSnippets(prev.map(s => s.id === id ? { ...s, pinned: nextPinned } : s)));
    try { onSnippetsChanged && onSnippetsChanged(sortSnippets(snippets.map(s => s.id === id ? { ...s, pinned: nextPinned } : s))); } catch {}
    try {
      await repo.updateSnippet(id, { pinned: nextPinned });
    } catch (e) {
      // revert
      setSnippets(prev => sortSnippets(prev.map(s => s.id === id ? { ...s, pinned: snippet.pinned } : s)));
    }
  }

  return (
    <main className="grid grid-cols-1 gap-4 sm:gap-6">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow p-4 border border-transparent dark:border-slate-800">
        <div className="flex items-center justify-between mb-3">
          <div className="font-semibold flex items-center gap-2">{loading ? <Loader2 size={18} className="animate-spin" /> : <Code2 size={18} />} Snippets</div>
          <button type="button" onClick={onCreateSnippet} className="w-9 h-9 bg-indigo-600 text-white rounded inline-flex items-center justify-center" disabled={!user} title="New snippet">
            <Plus size={16} />
          </button>
        </div>
        {snippets.length === 0 && !loading && (
          <div className="p-3 text-sm text-slate-500">No snippets yet.</div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {snippets.map(sn => (
            <div key={sn.id} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 p-3 flex flex-col">
              <div className="flex items-start gap-2">
                <button className="text-left flex-1 min-w-0" onClick={() => onClickSnippet(sn)}>
                  <div className="text-sm font-medium truncate">{sn.title || 'Untitled snippet'}</div>
                  <div className="mt-1 text-xs text-slate-500 line-clamp-5">{sn.content || ''}</div>
                </button>
                <button
                  type="button"
                  className="shrink-0 w-8 h-8 inline-flex items-center justify-center rounded hover:bg-slate-100 dark:hover:bg-slate-800"
                  title={sn.pinned ? 'Unpin' : 'Pin'}
                  onClick={() => onTogglePin(sn)}
                >
                  {sn.pinned ? <Pin size={16} className="text-indigo-600" /> : <PinOff size={16} className="text-slate-400" />}
                </button>
              </div>
            </div>
          ))}
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


