import React, { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Plus, Search, Trash2, Copy, Pin, PinOff } from "lucide-react";

export default function SnippetsModal({ open, onClose, repo, user, onSnippetsChanged }) {
  const [loading, setLoading] = useState(false);
  const [snippets, setSnippets] = useState([]);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [justCopied, setJustCopied] = useState(false);

  const textareaRef = useRef(null);
  const lastSavedRef = useRef({ id: null, title: '', content: '' });

  useEffect(() => {
    if (!open) return;
    refreshList();
    // Default to a new draft on open
    setSelectedId('__new__');
    setTitle('Untitled snippet');
    setContent('');
    setQuery("");
    setTimeout(() => { try { textareaRef.current?.focus(); } catch {} }, 0);
    lastSavedRef.current = { id: '__new__', title: 'Untitled snippet', content: '' };
  }, [open]);

  // Allow external selection via custom event (from global search)
  useEffect(() => {
    function onSelectEvent(e) {
      const id = e?.detail?.id;
      if (!id) return;
      const sn = snippets.find(s => s.id === id);
      if (sn) onSelectSnippet(sn);
      else {
        // If not in cache, try to refresh and then select
        (async () => {
          try {
            await refreshList();
            const next = (snippets || []).find(s => s.id === id);
            if (next) onSelectSnippet(next);
          } catch {}
        })();
      }
    }
    window.addEventListener('snippets:select', onSelectEvent);
    return () => window.removeEventListener('snippets:select', onSelectEvent);
  }, [snippets]);

  async function refreshList() {
    if (!repo || !user) return;
    setLoading(true);
    try {
      const items = await repo.listSnippets({ includeArchived: false });
      // Pinned first, then recent
      items.sort((a, b) => (Number(b.pinned) - Number(a.pinned)) || (new Date(b.updatedAt?.toDate?.() || b.updatedAt || 0) - new Date(a.updatedAt?.toDate?.() || a.updatedAt || 0)));
      setSnippets(items);
      try { onSnippetsChanged && onSnippetsChanged(items); } catch {}
    } catch (e) {
      console.error('Failed to load snippets', e);
    } finally {
      setLoading(false);
    }
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return snippets;
    return snippets.filter(s =>
      (s.title || '').toLowerCase().includes(q) ||
      (s.content || '').toLowerCase().includes(q)
    );
  }, [query, snippets]);

  function onSelectSnippet(snippet) {
    setSelectedId(snippet.id);
    setTitle(snippet.title || '');
    setContent(snippet.content || '');
    setTimeout(() => { try { textareaRef.current?.focus(); } catch {} }, 0);
    lastSavedRef.current = { id: snippet.id, title: snippet.title || '', content: snippet.content || '' };
  }

  async function onTogglePin(snippet) {
    if (!repo || !user) return;
    const id = snippet?.id || selectedId;
    if (!id || id === '__new__') return;
    const current = snippet || snippets.find(s => s.id === id) || {};
    const nextPinned = !current.pinned;
    setSaving(true);
    try {
      await repo.updateSnippet(id, { pinned: nextPinned });
      await refreshList();
    } catch (e) {
      console.error('Toggle pin failed', e);
    } finally {
      setSaving(false);
    }
  }

  async function onCreateSnippet() {
    // Create a local draft; persist only on Save
    setSelectedId('__new__');
    setTitle('Untitled snippet');
    setContent('');
    setTimeout(() => { try { textareaRef.current?.focus(); } catch {} }, 0);
  }

  async function onSaveSnippet() {
    if (!repo || !user) return;
    setSaving(true);
    try {
      const payload = { title: (title || 'Untitled snippet').trim(), content: String(content || '') };
      if (selectedId === '__new__' || !snippets.find(s => s.id === selectedId)) {
        const created = await repo.createSnippet(payload);
        await refreshList();
        setSelectedId(created?.id || null);
        lastSavedRef.current = { id: created?.id || null, title: payload.title, content: payload.content };
      } else {
        await repo.updateSnippet(selectedId, payload);
        await refreshList();
        lastSavedRef.current = { id: selectedId, title: payload.title, content: payload.content };
      }
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 900);
    } catch (e) {
      console.error('Save snippet failed', e);
    } finally {
      setSaving(false);
    }
  }

  async function onDeleteSnippet(id) {
    if (!repo || !user) return;
    if (id === '__new__' || !id) {
      setSelectedId(null);
      setTitle('');
      setContent('');
      return;
    }
    const ok = confirm('Delete this snippet?');
    if (!ok) return;
    setSaving(true);
    try {
      await repo.deleteSnippet(id);
      setSelectedId(prev => (prev === id ? null : prev));
      await refreshList();
    } catch (e) {
      console.error('Delete snippet failed', e);
    } finally {
      setSaving(false);
    }
  }

  async function onCopySnippet(snippet) {
    try {
      const text = (snippet?.content ?? content ?? '') || '';
      await navigator.clipboard.writeText(text);
      if (repo && user && snippet?.id && snippet?.id !== '__new__') repo.incrementCopyCount(snippet.id).catch(() => {});
      setJustCopied(true);
      setTimeout(() => setJustCopied(false), 900);
    } catch (e) {
      console.error('Copy failed', e);
    }
  }

  // Autosave: debounce on title/content changes
  useEffect(() => {
    if (!open || !repo || !user) return;
    const trimmedTitle = (title || '').trim();
    const trimmedContent = String(content || '');
    // Avoid creating empty snippets automatically
    if (selectedId === '__new__' && trimmedTitle.length === 0 && trimmedContent.trim().length === 0) return;
    // Skip if no change since last save
    if (lastSavedRef.current.id === selectedId && lastSavedRef.current.title === trimmedTitle && lastSavedRef.current.content === trimmedContent) return;
    const handle = setTimeout(() => {
      onSaveSnippet();
    }, 800);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, content, selectedId, open]);

  const selected = useMemo(() => snippets.find(s => s.id === selectedId) || null, [snippets, selectedId]);

  if (!open) return null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.98, y: -12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: -12 }}
            className="absolute top-16 left-0 right-0 mx-auto w-[1000px] max-w-[95vw] h-[70vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 h-full flex flex-col">
              <div className="flex items-center justify-between p-3 border-b border-slate-200 dark:border-slate-800">
                <div className="font-semibold">Snippets</div>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={onCreateSnippet} className="bg-indigo-600 text-white px-3 py-1.5 rounded inline-flex items-center gap-2" disabled={saving || !repo}>
                    <Plus size={16} /> New
                  </button>
                  <button type="button" onClick={onClose} className="w-8 h-8 inline-flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Close">
                    <X size={18} />
                  </button>
                </div>
              </div>

              <div className="flex-1 min-h-0 grid grid-cols-12">
                {/* Left pane: list */}
                <div className="col-span-4 border-r border-slate-200 dark:border-slate-800 flex flex-col">
                  <div className="p-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <input
                        type="text"
                        placeholder="Search snippets..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                      />
                    </div>
                  </div>
                  <div className="flex-1 min-h-0 overflow-auto">
                    {loading ? (
                      <div className="p-4 text-sm text-slate-500">Loading…</div>
                    ) : filtered.length === 0 ? (
                      <div className="p-4 text-sm text-slate-500">No snippets</div>
                    ) : (
                      <ul>
                        {filtered.map((sn) => (
                          <li key={sn.id} className={`px-3 py-2 border-b border-slate-100 dark:border-slate-800 cursor-pointer ${selectedId === sn.id ? 'bg-blue-50 dark:bg-blue-900/30' : 'hover:bg-slate-50 dark:hover:bg-slate-800'}`} onClick={() => onSelectSnippet(sn)}>
                            <div className="min-w-0 flex items-center gap-2">
                              <div className="text-sm font-medium truncate flex-1">{sn.title || 'Untitled'}</div>
                              <button
                                type="button"
                                className="shrink-0 w-6 h-6 inline-flex items-center justify-center rounded hover:bg-slate-100 dark:hover:bg-slate-700"
                                title={sn.pinned ? 'Unpin' : 'Pin'}
                                onClick={(e) => { e.stopPropagation(); onTogglePin(sn); }}
                              >
                                {sn.pinned ? <Pin size={14} className="text-indigo-600" /> : <PinOff size={14} className="text-slate-400" />}
                              </button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>

                {/* Right pane: editor */}
                <div className="col-span-8 flex flex-col min-h-0">
                  {!selected && selectedId !== '__new__' ? (
                    <div className="flex-1 grid place-items-center text-slate-500 text-sm">
                      {user ? 'Select a snippet or create a new one' : 'Sign in to create and manage snippets'}
                    </div>
                  ) : (
                    <div className="flex-1 min-h-0 flex flex-col">
                      <div className="p-3 border-b border-slate-200 dark:border-slate-800 grid grid-cols-12 gap-2">
                        <input
                          type="text"
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          placeholder="Title"
                          className="col-span-12 px-3 py-2 rounded bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                        />
                      </div>

                      <div className="p-3 flex items-center gap-2 border-b border-slate-200 dark:border-slate-800">
                        <motion.button
                          type="button"
                          onClick={() => onCopySnippet({ id: selectedId, content })}
                          className={`px-2 py-1 text-xs rounded inline-flex items-center gap-1 ${justCopied ? 'bg-green-600 text-white' : 'bg-slate-100 dark:bg-slate-800'}`}
                          animate={justCopied ? { scale: [1, 1.06, 1] } : {}}
                          transition={{ duration: 0.4, type: 'spring', stiffness: 250, damping: 20 }}
                        >
                          <Copy size={14} /> {justCopied ? 'Copied' : 'Copy'}
                        </motion.button>
                        {!!selectedId && selectedId !== '__new__' && (
                          <button
                            type="button"
                            onClick={() => onTogglePin()}
                            className="px-2 py-1 text-xs rounded bg-slate-100 dark:bg-slate-800 inline-flex items-center gap-1"
                          >
                            {selected?.pinned ? (<><Pin size={14} /> Unpin</>) : (<><PinOff size={14} /> Pin</>)}
                          </button>
                        )}
                        <button type="button" onClick={() => onDeleteSnippet(selectedId)} className="ml-auto px-2 py-1 text-xs rounded bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 inline-flex items-center gap-1">
                          <Trash2 size={14} /> Delete
                        </button>
                      </div>

                      <div className="flex-1 min-h-0 p-3">
                        <textarea
                          ref={textareaRef}
                          value={content}
                          onChange={(e) => setContent(e.target.value)}
                          placeholder={'Start typing your snippet…'}
                          className="input w-full h-full resize-none overflow-auto"
                        />
                      </div>

                      <div className="p-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
                        <motion.button
                          type="button"
                          onClick={onSaveSnippet}
                          className={`px-4 py-2 rounded text-white inline-flex items-center gap-2 ${saving ? 'bg-indigo-500' : 'bg-indigo-600'}`}
                          animate={saving ? { scale: [1, 0.98, 1], opacity: [1, 0.8, 1] } : justSaved ? { scale: [1, 1.06, 1] } : {}}
                          transition={{ duration: 0.6, type: 'spring', stiffness: 250, damping: 20 }}
                          disabled={saving}
                        >
                          {saving ? 'Saving…' : justSaved ? 'Saved' : 'Save'}
                        </motion.button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}


