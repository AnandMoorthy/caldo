import React, { useEffect, useMemo, useRef, useState } from "react";
import { loadNotesFeedCache, saveNotesFeedCache } from "../utils/storage";
import Masonry from "react-masonry-css";
import { StickyNote, Calendar as CalendarIcon, Code2, Pin, PinOff, Plus, Loader2 } from "lucide-react";
import { parseISO, format } from "date-fns";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import StyledSnippetPreview from "./StyledSnippetPreview";

export default function NotesPage({ repo, user, onOpenDayNotes, snippetRepo, onOpenSnippetEditor }) {
  // Unified feed state (notes + snippets)
  const [items, setItems] = useState([]); // [{ type: 'note'|'snippet', data }]
  const [loading, setLoading] = useState(false);
  const sentinelRef = useRef(null);
  const loadingRef = useRef(false);
  const triggeredWhileVisibleRef = useRef(false);
  const [filterMode, setFilterMode] = useState('all'); // 'all' | 'pinned' | 'notes' | 'snippets'

  // Canonical list of all loaded items (notes + snippets)
  const itemsRef = useRef([]); // [{ type: 'note'|'snippet', data }]
  const notesCursorRef = useRef(null);
  const pinnedSnippetCursorRef = useRef(null);
  const unpinnedSnippetCursorRef = useRef(null);
  const filterModeRef = useRef(filterMode); // Track current filter mode

  // Update the ref whenever filterMode changes
  useEffect(() => {
    filterModeRef.current = filterMode;
  }, [filterMode]);

  function applyFilter(list, mode) {
    if (!Array.isArray(list)) return [];
    
    const filtered = (() => {
      if (mode === 'pinned') {
        return list.filter((it) => !!it?.data?.pinned);
      } else if (mode === 'notes') {
        return list.filter((it) => it.type === 'note');
      } else if (mode === 'snippets') {
        return list.filter((it) => it.type === 'snippet');
      } else {
        return list;
      }
    })();
    
    console.log('🔍 applyFilter called:', {
      mode,
      inputListLength: list.length,
      inputNotesCount: list.filter(it => it.type === 'note').length,
      inputSnippetsCount: list.filter(it => it.type === 'snippet').length,
      outputLength: filtered.length,
      outputNotesCount: filtered.filter(it => it.type === 'note').length,
      outputSnippetsCount: filtered.filter(it => it.type === 'snippet').length
    });
    
    return filtered;
  }

  // Consistent sorting function for notes and snippets
  function sortItems(items) {
    if (!Array.isArray(items)) return [];
    return [...items].sort((a, b) => {
      const ap = a?.data?.pinned ? 1 : 0;
      const bp = b?.data?.pinned ? 1 : 0;
      if (bp !== ap) return bp - ap;
      const am = new Date((a?.data?.updatedAt?.toDate?.() || a?.data?.updatedAt || 0)).getTime() || 0;
      const bm = new Date((b?.data?.updatedAt?.toDate?.() || b?.data?.updatedAt || 0)).getTime() || 0;
      return bm - am;
    });
  }


  useEffect(() => {
    // Hydrate instantly from cache
    try {
      const cached = loadNotesFeedCache();
      if (Array.isArray(cached) && cached.length > 0) {
        itemsRef.current = cached;
        const filtered = applyFilter(itemsRef.current, filterModeRef.current);
        setItems(filtered);
      }
    } catch (e) {
      console.error('Failed to load from cache:', e);
    }

    // Listen for immediate updates when a day note is saved elsewhere
    function onDayNoteSaved(e) {
      try {
        const { dateKey, content } = e?.detail || {};
        if (!dateKey) return;
        const now = new Date();
        // Update or insert note item
        const existsIdx = itemsRef.current.findIndex(it => it.type === 'note' && (it.data.id === dateKey || it.data.dateKey === dateKey));
        if (existsIdx >= 0) {
          const current = itemsRef.current[existsIdx];
          const updated = { ...current, data: { ...current.data, dateKey, id: dateKey, content, updatedAt: now } };
          const next = itemsRef.current.slice();
          next[existsIdx] = updated;
          itemsRef.current = sortItems(next);
        } else {
          const newItem = { type: 'note', data: { id: dateKey, dateKey, content, updatedAt: now, pinned: false } };
          itemsRef.current = sortItems([newItem, ...itemsRef.current]);
        }
        setItems(applyFilter(itemsRef.current, filterModeRef.current));
        try { saveNotesFeedCache(itemsRef.current); } catch {}
      } catch (e) {
        console.error('Error in day note saved handler:', e);
      }
    }
    window.addEventListener('daynote:saved', onDayNoteSaved);
    
    // Listen for snippet list updates from App.jsx
    function onSnippetsUpdated(e) {
      try {
        const list = (e?.detail?.items || []).filter(s => !s.archived);
        console.log('📝 onSnippetsUpdated event received:', {
          currentFilterMode: filterModeRef.current,
          incomingSnippetCount: list.length,
          currentTotalItems: itemsRef.current.length,
          currentNotesCount: itemsRef.current.filter(it => it.type === 'note').length,
          currentSnippetsCount: itemsRef.current.filter(it => it.type === 'snippet').length
        });
        
        // Build fresh snippet items
        const snippetItems = list.map(s => ({ type: 'snippet', data: s }));
        // Keep existing notes as-is; replace all snippets with new snapshot
        const noteItems = itemsRef.current.filter(it => it.type === 'note');
        const combined = [...noteItems, ...snippetItems];
        // Sort: pinned first, then updated desc
        itemsRef.current = sortItems(combined);
        
        console.log('🔄 After snippet update:', {
          newTotalItems: itemsRef.current.length,
          newNotesCount: itemsRef.current.filter(it => it.type === 'note').length,
          newSnippetsCount: itemsRef.current.filter(it => it.type === 'snippet').length
        });
        
        // Always update the cache to keep it in sync
        try { saveNotesFeedCache(itemsRef.current); } catch {}
        
        // Always reapply the current filter to ensure consistency
        // This prevents showing snippets when user is in "Notes" filter mode
        const newFilteredItems = applyFilter(itemsRef.current, filterModeRef.current);
        
        console.log('✅ Final filtered items:', {
          filterMode: filterModeRef.current,
          filteredCount: newFilteredItems.length,
          notesCount: newFilteredItems.filter(it => it.type === 'note').length,
          snippetsCount: newFilteredItems.filter(it => it.type === 'snippet').length
        });
        
        // Only update the display if the filtered items have actually changed
        // This prevents unnecessary re-renders while maintaining filter consistency
        setItems(newFilteredItems);
      } catch (e) {
        console.error('❌ Error in onSnippetsUpdated:', e);
      }
    }
    window.addEventListener('snippets:updated', onSnippetsUpdated);

    if (!repo || !user) return;
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        // Fetch first page for notes and snippets
        const [notesPage, snippetPage] = await Promise.all([
          repo.listNotesPage({ limit: 20 }),
          snippetRepo && user ? snippetRepo.listSnippetsPage({ limit: 20 }) : Promise.resolve({ items: [], nextPinnedCursor: null, nextUnpinnedCursor: null })
        ]);
        if (!mounted) return;
        const getMs = (x) => {
          const t = x?.updatedAt?.toDate?.() || x?.updatedAt || 0;
          return new Date(t).getTime() || 0;
        };
        const noteItems = (notesPage?.items || []);
        const notePinned = noteItems.filter(n => !!n.pinned).map(n => ({ type: 'note', data: n }));
        const noteUnpinned = noteItems.filter(n => !n.pinned).map(n => ({ type: 'note', data: n }));
        const snItems = (snippetPage?.items || []);
        const snPinned = snItems.filter(s => !!s.pinned).map(s => ({ type: 'snippet', data: s }));
        const snUnpinned = snItems.filter(s => !s.pinned).map(s => ({ type: 'snippet', data: s }));

        // Combine and sort: pinned first, then updated desc
        itemsRef.current = sortItems([ ...notePinned, ...snPinned, ...noteUnpinned, ...snUnpinned ]);
        
        notesCursorRef.current = notesPage?.nextCursor || null;
        pinnedSnippetCursorRef.current = snippetPage?.nextPinnedCursor || null;
        unpinnedSnippetCursorRef.current = snippetPage?.nextUnpinnedCursor || null;
        
        setItems(applyFilter(itemsRef.current, filterModeRef.current));
        
        // Persist fresh feed to cache
        try { saveNotesFeedCache(itemsRef.current); } catch {}
      } catch (e) {
        console.error('Failed to load merged feed', e);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; window.removeEventListener('daynote:saved', onDayNoteSaved); window.removeEventListener('snippets:updated', onSnippetsUpdated); };
  }, [repo, snippetRepo, user]); // Removed filterMode dependency

  async function handleToggleNotePin(note) {
    if (!repo || !user || !note) return;
    const newPinned = !note.pinned;
    
    // Optimistic update in itemsRef
    itemsRef.current = itemsRef.current.map((it) =>
      it.type === 'note' && (it.data.id === note.id || it.data.dateKey === note.dateKey)
        ? { ...it, data: { ...it.data, pinned: newPinned, updatedAt: new Date() } }
        : it
    );
    
    // Sort using consistent function
    itemsRef.current = sortItems(itemsRef.current);
    
    // Update localStorage immediately
    try { saveNotesFeedCache(itemsRef.current); } catch {}
    
    // Update filtered view
    setItems(applyFilter(itemsRef.current, filterModeRef.current));
    
    try {
      await repo.setDayNotePinned(note.dateKey || note.id, newPinned);
    } catch (e) {
      console.error('Failed to update note pin status in Firestore:', e);
      // Revert on failure
      itemsRef.current = itemsRef.current.map((it) =>
        it.type === 'note' && (it.data.id === note.id || it.data.dateKey === note.dateKey)
          ? { ...it, data: { ...it.data, pinned: !newPinned } }
          : it
      );
      // Resort after revert using consistent function
      itemsRef.current = sortItems(itemsRef.current);
      // Update localStorage and filtered view after revert
      try { saveNotesFeedCache(itemsRef.current); } catch {}
      setItems(applyFilter(itemsRef.current, filterModeRef.current));
    }
  }

  async function handleToggleSnippetPin(snippet) {
    if (!snippetRepo || !user || !snippet) return;
    const newPinned = !snippet.pinned;
    
    // Optimistic update in itemsRef
    itemsRef.current = itemsRef.current.map((it) =>
      it.type === 'snippet' && it.data.id === snippet.id
        ? { ...it, data: { ...it.data, pinned: newPinned, updatedAt: new Date() } }
        : it
    );
    
    // Sort using consistent function
    itemsRef.current = sortItems(itemsRef.current);
    
    // Update localStorage immediately
    try { saveNotesFeedCache(itemsRef.current); } catch {}
    
    // Update filtered view
    setItems(applyFilter(itemsRef.current, filterModeRef.current));
    
    try {
      await snippetRepo.updateSnippet(snippet.id, { pinned: newPinned });
    } catch (e) {
      console.error('Failed to update snippet pin status in Firestore:', e);
      // Revert on failure
      itemsRef.current = itemsRef.current.map((it) =>
        it.type === 'snippet' && it.data.id === snippet.id
          ? { ...it, data: { ...it.data, pinned: !newPinned } }
          : it
      );
      // Resort after revert using consistent function
      itemsRef.current = sortItems(itemsRef.current);
      // Update localStorage and filtered view after revert
      try { saveNotesFeedCache(itemsRef.current); } catch {}
      setItems(applyFilter(itemsRef.current, filterModeRef.current));
    }
  }

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
      // Only trigger once per continuous intersection until it leaves viewport
      if (triggeredWhileVisibleRef.current) return;
      triggeredWhileVisibleRef.current = true;

      // Avoid fetching when no cursors are available
      const noMoreNotes = !notesCursorRef.current;
      const noMoreSnippets = !(pinnedSnippetCursorRef.current || unpinnedSnippetCursorRef.current);
      if (noMoreNotes && noMoreSnippets) return;

      if (loadingRef.current) return;
      setLoading(true);
      loadingRef.current = true;
      try {
        // Fetch next pages for notes and snippets
        const promises = [];
        if (repo && user && notesCursorRef.current) {
          promises.push(repo.listNotesPage({ limit: 20, startAfterUpdatedAt: notesCursorRef.current.updatedAt, startAfterId: notesCursorRef.current.id }));
        } else {
          promises.push(Promise.resolve({ items: [], nextCursor: null }));
        }
        if (snippetRepo && user && (pinnedSnippetCursorRef.current || unpinnedSnippetCursorRef.current)) {
          promises.push(snippetRepo.listSnippetsPage({ limit: 20, startAfterPinnedCursor: pinnedSnippetCursorRef.current, startAfterUnpinnedCursor: unpinnedSnippetCursorRef.current }));
        } else {
          promises.push(Promise.resolve({ items: [], nextPinnedCursor: null, nextUnpinnedCursor: null }));
        }
        const [notePage, snPage] = await Promise.all(promises);
        // Update cursors
        notesCursorRef.current = notePage?.nextCursor || notesCursorRef.current;
        pinnedSnippetCursorRef.current = snPage?.nextPinnedCursor ?? pinnedSnippetCursorRef.current;
        unpinnedSnippetCursorRef.current = snPage?.nextUnpinnedCursor ?? unpinnedSnippetCursorRef.current;
        // Merge into itemsRef and resort
        const append = [];
        if (Array.isArray(notePage?.items)) append.push(...notePage.items.map(n => ({ type: 'note', data: n })));
        if (Array.isArray(snPage?.items)) append.push(...snPage.items.map(s => ({ type: 'snippet', data: s })));
        if (append.length) {
          itemsRef.current = sortItems([...itemsRef.current, ...append]);
          setItems(applyFilter(itemsRef.current, filterModeRef.current));
          try { saveNotesFeedCache(itemsRef.current); } catch {}
        }
      } catch (e) {
        console.error('Load more merged feed failed', e);
      } finally {
        setLoading(false);
        loadingRef.current = false;
      }
    }, { rootMargin: '200px' });
    io.observe(el);
    return () => io.disconnect();
  }, [repo, snippetRepo, user]);

  // (Removed legacy snippet-only effects; unified feed handles pagination for both)

  // Handle filter mode changes
  useEffect(() => {
    // Update filtered items when filter mode changes
    console.log('🎯 Filter mode changed to:', filterMode, 'Total items in cache:', itemsRef.current.length);
    const filtered = applyFilter(itemsRef.current, filterModeRef.current);
    console.log('🎯 Filter applied after mode change:', {
      filterMode,
      totalItems: itemsRef.current.length,
      filteredCount: filtered.length,
      notesCount: filtered.filter(it => it.type === 'note').length,
      snippetsCount: filtered.filter(it => it.type === 'snippet').length
    });
    setItems(filtered);
  }, [filterMode]);

  return (
    <main className="grid grid-cols-1 gap-4 sm:gap-6 pb-20 sm:pb-0">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow p-3 sm:p-4 border border-transparent dark:border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
          <div className="font-semibold flex items-center gap-2 text-base sm:text-lg">{loading ? <Loader2 size={18} className="animate-spin" /> : <StickyNote size={18} />} Notes & Snippets</div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="inline-flex rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden w-full sm:w-auto">
              <button type="button" onClick={() => setFilterMode('all')} className={`flex-1 sm:flex-none px-3 py-2 sm:py-1.5 text-xs sm:text-xs ${filterMode==='all' ? 'bg-slate-200 dark:bg-slate-800' : 'bg-white dark:bg-slate-900'}`}>All</button>
              <button type="button" onClick={() => setFilterMode('pinned')} className={`flex-1 sm:flex-none px-3 py-2 sm:py-1.5 text-xs border-l border-slate-200 dark:border-slate-700 ${filterMode==='pinned' ? 'bg-slate-200 dark:bg-slate-800' : 'bg-white dark:bg-slate-900'}`}>Pinned</button>
              <button type="button" onClick={() => setFilterMode('notes')} className={`flex-1 sm:flex-none px-3 py-2 sm:py-1.5 text-xs border-l border-slate-200 dark:border-slate-700 ${filterMode==='notes' ? 'bg-slate-200 dark:bg-slate-800' : 'bg-white dark:bg-slate-900'}`}>Notes</button>
              <button type="button" onClick={() => setFilterMode('snippets')} className={`flex-1 sm:flex-none px-3 py-2 sm:py-1.5 text-xs border-l border-slate-200 dark:border-slate-700 ${filterMode==='snippets' ? 'bg-slate-200 dark:bg-slate-800' : 'bg-white dark:bg-slate-900'}`}>Snippets</button>
            </div>
            <button type="button" onClick={() => onOpenSnippetEditor && onOpenSnippetEditor('__new__')} disabled={!user} className="inline-flex items-center justify-center gap-1 px-3 py-2 sm:px-2.5 sm:py-1.5 text-xs sm:text-xs rounded bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-60 touch-manipulation">
              <Plus size={14} className="sm:w-3 sm:h-3" /> <span>Snippet</span>
            </button>
          </div>
        </div>
        {items.length === 0 && !loading && (
          <div className="p-3 text-sm text-slate-500">No notes or snippets yet.</div>
        )}
        {/** items are derived from itemsRef via applyFilter; nothing to compute here */}
        <div className="overflow-x-hidden">
          <Masonry
            breakpointCols={{ default: 3, 1024: 3, 768: 2, 0: 1 }}
            className="-ml-2 sm:-ml-4 flex w-auto"
            columnClassName="pl-2 sm:pl-4 bg-clip-padding"
          >
          {(() => {
            console.log('🎨 Rendering items:', {
              filterMode,
              itemsLength: items.length,
              itemsNotesCount: items.filter(it => it.type === 'note').length,
              itemsSnippetsCount: items.filter(it => it.type === 'snippet').length,
              itemsTypes: items.map(it => it.type)
            });
            return items.map((it, idx) => {
              if (it.type === 'note') {
                const n = it.data;
                const updated = new Date(n.updatedAt?.toDate?.() || n.updatedAt || 0);
                return (
                  <div key={`n_${n.id}_${idx}`} onClick={() => onOpenDayNotes && onOpenDayNotes(n)} className="mb-4 text-left rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 sm:p-4 shadow-sm hover:shadow-lg dark:hover:ring-1 dark:hover:ring-slate-600 transition-all cursor-pointer group touch-manipulation">
                    <div className="text-xs text-slate-500 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <span className="inline-flex items-center gap-2">
                        <CalendarIcon size={14} />
                        <span className="truncate">{n.dateKey ? format(parseISO(n.dateKey), 'EEE, MMM d, yyyy') : 'Unknown date'}</span>
                      </span>
                      <span className="shrink-0 flex items-center gap-2">
                        <button type="button" onClick={(e) => { e.stopPropagation?.(); handleToggleNotePin(n); }} className={`w-8 h-8 sm:w-6 sm:h-6 inline-flex items-center justify-center rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-opacity touch-manipulation ${n.pinned ? '' : 'opacity-0 group-hover:opacity-100 sm:opacity-0'}`} title={n.pinned ? 'Unpin' : 'Pin'}>
                          {n.pinned ? <Pin size={16} className="sm:w-3.5 sm:h-3.5 text-amber-600" /> : <PinOff size={16} className="sm:w-3.5 sm:h-3.5 text-slate-400" />}
                        </button>
                        <a
                          href={`#/x/n/${n.dateKey || n.id}`}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation?.()}
                          title="Open in new tab"
                          className="w-8 h-8 sm:w-6 sm:h-6 inline-flex items-center justify-center rounded hover:bg-slate-100 dark:hover:bg-slate-800 opacity-0 group-hover:opacity-100 sm:opacity-0 transition-opacity touch-manipulation"
                        >
                          <span className="text-sm sm:text-xs">↗</span>
                        </a>
                        <span className="shrink-0 px-2 py-1 sm:px-1.5 sm:py-0.5 rounded bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 text-xs">Day Note</span>
                      </span>
                    </div>
                    <div className="mt-2 text-sm line-clamp-6">
                      {String(n.content || '').trim().length === 0 ? (
                        <div className="text-slate-400 italic">No content</div>
                      ) : (
                        <StyledSnippetPreview content={n.content} />
                      )}
                    </div>
                    <div className="mt-2 text-[11px] text-slate-500" title={updated.toString()}>
                      Updated {isNaN(updated.getTime()) ? '—' : format(updated, 'PPp')}
                    </div>
                  </div>
                );
              }
              const sn = it.data;
              const updated = new Date(sn.updatedAt?.toDate?.() || sn.updatedAt || 0);
              return (
                <div key={`s_${sn.id}_${idx}`} onClick={() => onOpenSnippetEditor && onOpenSnippetEditor(sn.id)} className="mb-4 text-left rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 sm:p-4 shadow-sm hover:shadow-lg dark:hover:ring-1 dark:hover:ring-slate-600 transition-all cursor-pointer group touch-manipulation">
                  <div className="text-xs text-slate-500 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <span className="inline-flex items-center gap-2">
                      <Code2 size={14} />
                      <span className="truncate">{isNaN(updated.getTime()) ? '—' : format(updated, 'PPp')}</span>
                    </span>
                    <span className="shrink-0 flex items-center gap-2">
                      <button type="button" onClick={(e) => { e.stopPropagation?.(); onOpenSnippetEditor && onOpenSnippetEditor(sn.id); }} className="w-8 h-8 sm:w-6 sm:h-6 inline-flex items-center justify-center rounded hover:bg-slate-100 dark:hover:bg-slate-800 opacity-0 group-hover:opacity-100 sm:opacity-0 transition-opacity touch-manipulation" title="Edit">
                        <span className="sr-only">Edit</span>
                      </button>
                      <button type="button" onClick={(e) => { e.stopPropagation?.(); handleToggleSnippetPin(sn); }} className={`w-8 h-8 sm:w-6 sm:h-6 inline-flex items-center justify-center rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-opacity touch-manipulation ${sn.pinned ? '' : 'opacity-0 group-hover:opacity-100 sm:opacity-0'}`} title={sn.pinned ? 'Unpin' : 'Pin'}>
                        {sn.pinned ? <Pin size={16} className="sm:w-3.5 sm:h-3.5 text-indigo-600" /> : <PinOff size={16} className="sm:w-3.5 sm:h-3.5 text-indigo-400" />}
                      </button>
                      <a
                        href={`#/x/sn/${sn.id}`}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation?.()}
                        title="Open in new tab"
                        className="w-8 h-8 sm:w-6 sm:h-6 inline-flex items-center justify-center rounded hover:bg-slate-100 dark:hover:bg-slate-800 opacity-0 group-hover:opacity-100 sm:opacity-0 transition-opacity touch-manipulation"
                      >
                        <span className="text-sm sm:text-xs">↗</span>
                      </a>
                      <span className="shrink-0 inline-flex items-center gap-1 px-2 py-1 sm:px-1.5 sm:py-0.5 rounded bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-xs">Snippet</span>
                    </span>
                  </div>
                  <div className="mt-2 whitespace-pre-wrap text-sm line-clamp-6">
                    <div className="font-medium truncate">{sn.title || 'Untitled snippet'}</div>
                    {sn.content ? <div className="mt-1 text-slate-600 dark:text-slate-400"><StyledSnippetPreview content={sn.content} /></div> : null}
                  </div>
                  <div className="mt-2 text-[11px] text-slate-500" title={updated.toString()}>
                    Updated {isNaN(updated.getTime()) ? '—' : format(updated, 'PPp')}
                  </div>
                </div>
              );
            });
          })()}
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


