import React, { useEffect, useMemo, useRef, useState } from "react";
import { loadNotesFeedCache, saveNotesFeedCache } from "../utils/storage";
import Masonry from "react-masonry-css";
import { StickyNote, Calendar as CalendarIcon, Code2, Pin, PinOff, Plus, Loader2 } from "lucide-react";
import { parseISO, format } from "date-fns";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

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

  function applyFilter(list, mode) {
    if (!Array.isArray(list)) return [];
    if (mode === 'pinned') return list.filter((it) => !!it?.data?.pinned);
    if (mode === 'notes') return list.filter((it) => it.type === 'note');
    if (mode === 'snippets') return list.filter((it) => it.type === 'snippet');
    return list;
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
        const filtered = applyFilter(itemsRef.current, filterMode);
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
        setItems(applyFilter(itemsRef.current, filterMode));
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
        // Build fresh snippet items
        const snippetItems = list.map(s => ({ type: 'snippet', data: s }));
        // Keep existing notes as-is; replace all snippets with new snapshot
        const noteItems = itemsRef.current.filter(it => it.type === 'note');
        const combined = [...noteItems, ...snippetItems];
        // Sort: pinned first, then updated desc
        itemsRef.current = sortItems(combined);
        setItems(applyFilter(itemsRef.current, filterMode));
        try { saveNotesFeedCache(itemsRef.current); } catch {}
      } catch {}
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
        
        setItems(applyFilter(itemsRef.current, filterMode));
        
        // Persist fresh feed to cache
        try { saveNotesFeedCache(itemsRef.current); } catch {}
      } catch (e) {
        console.error('Failed to load merged feed', e);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; window.removeEventListener('daynote:saved', onDayNoteSaved); window.removeEventListener('snippets:updated', onSnippetsUpdated); };
  }, [repo, snippetRepo, user]);

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
    setItems(applyFilter(itemsRef.current, filterMode));
    
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
      setItems(applyFilter(itemsRef.current, filterMode));
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
    setItems(applyFilter(itemsRef.current, filterMode));
    
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
      setItems(applyFilter(itemsRef.current, filterMode));
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
          setItems(applyFilter(itemsRef.current, filterMode));
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
    setItems(applyFilter(itemsRef.current, filterMode));
  }, [filterMode]);

  return (
    <main className="grid grid-cols-1 gap-4 sm:gap-6">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow p-4 border border-transparent dark:border-slate-800">
        <div className="flex items-center justify-between mb-3">
          <div className="font-semibold flex items-center gap-2">{loading ? <Loader2 size={18} className="animate-spin" /> : <StickyNote size={18} />} Notes & Snippets</div>
          <div className="flex items-center gap-2">
            <div className="inline-flex rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
              <button type="button" onClick={() => setFilterMode('all')} className={`px-3 py-1.5 text-xs ${filterMode==='all' ? 'bg-slate-200 dark:bg-slate-800' : 'bg-white dark:bg-slate-900'}`}>All</button>
              <button type="button" onClick={() => setFilterMode('pinned')} className={`px-3 py-1.5 text-xs border-l border-slate-200 dark:border-slate-700 ${filterMode==='pinned' ? 'bg-slate-200 dark:bg-slate-800' : 'bg-white dark:bg-slate-900'}`}>Pinned</button>
              <button type="button" onClick={() => setFilterMode('notes')} className={`px-3 py-1.5 text-xs border-l border-slate-200 dark:border-slate-700 ${filterMode==='notes' ? 'bg-slate-200 dark:bg-slate-800' : 'bg-white dark:bg-slate-900'}`}>Notes</button>
              <button type="button" onClick={() => setFilterMode('snippets')} className={`px-3 py-1.5 text-xs border-l border-slate-200 dark:border-slate-700 ${filterMode==='snippets' ? 'bg-slate-200 dark:bg-slate-800' : 'bg-white dark:bg-slate-900'}`}>Snippets</button>
            </div>
            <button type="button" onClick={() => onOpenSnippetEditor && onOpenSnippetEditor('__new__')} disabled={!user} className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs rounded bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-60">
              <Plus size={12} /> Snippet
            </button>
          </div>
        </div>
        {items.length === 0 && !loading && (
          <div className="p-3 text-sm text-slate-500">No notes or snippets yet.</div>
        )}
        {/** items are derived from itemsRef via applyFilter; nothing to compute here */}
        <Masonry
          breakpointCols={{ default: 3, 1024: 3, 768: 2, 0: 1 }}
          className="-ml-4 flex w-auto"
          columnClassName="pl-4 bg-clip-padding"
        >
          {items.map((it, idx) => {
            if (it.type === 'note') {
              const n = it.data;
              const updated = new Date(n.updatedAt?.toDate?.() || n.updatedAt || 0);
              return (
                <div key={`n_${n.id}_${idx}`} onClick={() => onOpenDayNotes && onOpenDayNotes(n)} className="mb-4 text-left rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm hover:shadow-lg dark:hover:ring-1 dark:hover:ring-slate-600 transition-all cursor-pointer group">
                  <div className="text-xs text-slate-500 flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-2">
                      <CalendarIcon size={14} />
                      {n.dateKey ? format(parseISO(n.dateKey), 'EEE, MMM d, yyyy') : 'Unknown date'}
                    </span>
                    <span className="shrink-0 flex items-center gap-2">
                      <button type="button" onClick={(e) => { e.stopPropagation?.(); handleToggleNotePin(n); }} className={`w-6 h-6 inline-flex items-center justify-center rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-opacity ${n.pinned ? '' : 'opacity-0 group-hover:opacity-100'}`} title={n.pinned ? 'Unpin' : 'Pin'}>
                        {n.pinned ? <Pin size={14} className="text-amber-600" /> : <PinOff size={14} className="text-slate-400" />}
                      </button>
                      <span className="shrink-0 px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300">Day Note</span>
                    </span>
                  </div>
                  <div className="mt-2 text-sm line-clamp-6">
                    {String(n.content || '').trim().length === 0 ? (
                      <div className="text-slate-400 italic">No content</div>
                    ) : (
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          p: ({node, ...props}) => <p className="my-2 leading-relaxed" {...props} />,
                          ul: ({node, className, ...props}) => <ul className={`list-disc ml-5 my-2 space-y-1 ${className || ''}`} {...props} />,
                          ol: ({node, className, ...props}) => <ol className={`list-decimal ml-5 my-2 space-y-1 ${className || ''}`} {...props} />,
                          li: ({node, className, ...props}) => <li className={`my-1 ${className || ''} ${className?.includes?.('task-list-item') ? 'list-none' : ''}`} {...props} />,
                          strong: ({node, ...props}) => <strong className="font-semibold" {...props} />,
                          em: ({node, ...props}) => <em className="italic" {...props} />,
                          blockquote: ({node, className, ...props}) => <blockquote className="border-l-4 border-slate-300 dark:border-slate-700 pl-3 italic text-slate-700 dark:text-slate-300 my-3" {...props} />,
                          hr: (props) => <hr className="my-4 border-slate-200 dark:border-slate-700" {...props} />,
                          code({node, inline, className, children, ...props}) {
                            if (inline) {
                              return <code className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800" {...props}>{children}</code>;
                            }
                            return (
                              <pre className="p-3 rounded bg-slate-950 text-slate-100 overflow-auto">
                                <code {...props}>{children}</code>
                              </pre>
                            );
                          },
                          a: ({node, ...props}) => <a className="text-indigo-600 dark:text-indigo-400 underline" target="_blank" rel="noreferrer" {...props} />,
                          table: ({node, ...props}) => <table className="my-3 w-full border-collapse text-sm" {...props} />,
                          th: ({node, ...props}) => <th className="border border-slate-200 dark:border-slate-700 px-2 py-1 text-left" {...props} />,
                          td: ({node, className, ...props}) => <td className="border border-slate-200 dark:border-slate-700 px-2 py-1" {...props} />,
                          input: ({node, ...props}) => <input {...props} disabled className="align-middle mr-2 accent-indigo-600" />,
                        }}
                      >
                        {String(n.content || '')}
                      </ReactMarkdown>
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
              <div key={`s_${sn.id}_${idx}`} onClick={() => onOpenSnippetEditor && onOpenSnippetEditor(sn.id)} className="mb-4 text-left rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm hover:shadow-lg dark:hover:ring-1 dark:hover:ring-slate-600 transition-all cursor-pointer group">
                <div className="text-xs text-slate-500 flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-2">
                    <Code2 size={14} />
                    {isNaN(updated.getTime()) ? '—' : format(updated, 'PPp')}
                  </span>
                  <span className="shrink-0 flex items-center gap-2">
                    <button type="button" onClick={(e) => { e.stopPropagation?.(); onOpenSnippetEditor && onOpenSnippetEditor(sn.id); }} className="w-6 h-6 inline-flex items-center justify-center rounded hover:bg-slate-100 dark:hover:bg-slate-800 opacity-0 group-hover:opacity-100 transition-opacity" title="Edit">
                      <span className="sr-only">Edit</span>
                    </button>
                    <button type="button" onClick={(e) => { e.stopPropagation?.(); handleToggleSnippetPin(sn); }} className={`w-6 h-6 inline-flex items-center justify-center rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-opacity ${sn.pinned ? '' : 'opacity-0 group-hover:opacity-100'}`} title={sn.pinned ? 'Unpin' : 'Pin'}>
                      {sn.pinned ? <Pin size={14} className="text-indigo-600" /> : <PinOff size={14} className="text-indigo-400" />}
                    </button>
                    <span className="shrink-0 inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300">Snippet</span>
                  </span>
                </div>
                <div className="mt-2 whitespace-pre-wrap text-sm line-clamp-6">
                  <div className="font-medium truncate">{sn.title || 'Untitled snippet'}</div>
                  {sn.content ? <div className="mt-1 text-slate-600 dark:text-slate-400">{sn.content}</div> : null}
                </div>
                <div className="mt-2 text-[11px] text-slate-500" title={updated.toString()}>
                  Updated {isNaN(updated.getTime()) ? '—' : format(updated, 'PPp')}
                </div>
              </div>
            );
          })}
        </Masonry>
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


