import React, { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Plus, Search, Trash2, Copy, Pin, PinOff, RotateCcw } from "lucide-react";

export default function SnippetsModal({ open, onClose, repo, user, onSnippetsChanged, initialSnippets = [] }) {
  const [loading, setLoading] = useState(false);
  const [snippets, setSnippets] = useState(initialSnippets);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [justCopied, setJustCopied] = useState(false);

  // Helper function for consistent sorting logic
  const sortSnippets = (snippetsList) => {
    return [...snippetsList].sort((a, b) => {
      const aPinned = Number(a.pinned);
      const bPinned = Number(b.pinned);
      
      // If pinned status is different, pinned items go first
      if (aPinned !== bPinned) {
        return bPinned - aPinned;
      }
      
      // If both have same pinned status, sort by last updated (most recent first)
      const aTime = new Date(a.updatedAt?.toDate?.() || a.updatedAt || 0);
      const bTime = new Date(b.updatedAt?.toDate?.() || b.updatedAt || 0);
      return bTime - aTime;
    });
  };

  const textareaRef = useRef(null);
  const lastSavedRef = useRef({ id: null, title: '', content: '' });
  const deletedSnippetsRef = useRef(new Set()); // Track recently deleted snippets
  const isDeletingRef = useRef(false); // Track if we're in the middle of a delete operation

  useEffect(() => {
    if (!open) return;
    // Initialize from existing cache if available, only refresh if empty
    if (snippets.length === 0 && repo && user) {
      refreshList();
    }
    // Default to a new draft on open
    setSelectedId('__new__');
    setTitle('Untitled snippet');
    setContent('');
    setQuery("");
    setTimeout(() => { try { textareaRef.current?.focus(); } catch {} }, 0);
    lastSavedRef.current = { id: '__new__', title: 'Untitled snippet', content: '' };
  }, [open, repo, user]);

  // Update local snippets when initialSnippets changes
  useEffect(() => {
    if (initialSnippets.length > 0) {
      setSnippets(initialSnippets);
    }
  }, [initialSnippets]);

  // Allow external selection via custom event (from global search)
  useEffect(() => {
    function onSelectEvent(e) {
      const id = e?.detail?.id;
      if (!id) return;
      
      // Don't try to find recently deleted snippets
      if (deletedSnippetsRef.current.has(id)) {
        console.log('Snippet was recently deleted, ignoring selection event:', id);
        return;
      }
      
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
      console.log('Fetched snippets from Firestore:', items.length, 'items');
      // Filter out recently deleted snippets
      let filteredItems = items.filter(item => !deletedSnippetsRef.current.has(item.id));
      console.log('After filtering deleted snippets:', filteredItems.length, 'items');
      // Sort: pinned first (sorted by last updated), then unpinned (sorted by last updated)
      filteredItems = sortSnippets(filteredItems);
      setSnippets(filteredItems);
      // Only update App.jsx cache when refreshing from server, not when updating local state
      try { onSnippetsChanged && onSnippetsChanged(filteredItems); } catch {}
    } catch (e) {
      console.error('Failed to load snippets', e);
    } finally {
      setLoading(false);
    }
  }

  // Optimized update function that doesn't reload the entire list
  function updateSnippetInList(id, updates) {
    setSnippets(prev => {
      const updated = prev.map(s => s.id === id ? { ...s, ...updates } : s);
      // Re-sort to maintain pinned order and last updated sorting
      const sortedList = sortSnippets(updated);
      // Update the App.jsx cache with the properly sorted list
      try { onSnippetsChanged && onSnippetsChanged(sortedList); } catch {}
      return sortedList;
    });
  }

  // Add snippet to list without reloading
  function addSnippetToList(snippet) {
    setSnippets(prev => {
      const newList = [...prev, snippet];
      // Re-sort to maintain pinned order and last updated sorting
      const sortedList = sortSnippets(newList);
      // Update the App.jsx cache with the properly sorted list
      try { onSnippetsChanged && onSnippetsChanged(sortedList); } catch {}
      return sortedList;
    });
  }

  // Remove snippet from list without reloading
  function removeSnippetFromList(id) {
    setSnippets(prev => {
      const filteredList = prev.filter(s => s.id !== id);
      // Update the App.jsx cache with the filtered list
      try { onSnippetsChanged && onSnippetsChanged(filteredList); } catch {}
      return filteredList;
    });
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
    // Update last saved reference first to prevent autosave from triggering
    lastSavedRef.current = { id: snippet.id, title: snippet.title || '', content: snippet.content || '' };
    
    setSelectedId(snippet.id);
    setTitle(snippet.title || '');
    setContent(snippet.content || '');
    setTimeout(() => { try { textareaRef.current?.focus(); } catch {} }, 0);
  }

  async function onTogglePin(snippet) {
    if (!repo || !user) return;
    const id = snippet?.id || selectedId;
    if (!id || id === '__new__') return;
    const current = snippet || snippets.find(s => s.id === id) || {};
    const nextPinned = !current.pinned;
    
    // Calculate the updated and sorted list
    const updatedSnippets = sortSnippets(
      snippets.map(s => s.id === id ? { ...s, pinned: nextPinned } : s)
    );
    
    // Optimistically update the UI immediately
    setSnippets(updatedSnippets);
    
    // Update the App.jsx cache with the properly sorted list
    try { onSnippetsChanged && onSnippetsChanged(updatedSnippets); } catch {}
    
    // Make the API call in parallel
    repo.updateSnippet(id, { pinned: nextPinned }).catch((e) => {
      console.error('Toggle pin failed', e);
      // Revert the optimistic update on error
      const revertedSnippets = sortSnippets(
        snippets.map(s => s.id === id ? { ...s, pinned: current.pinned } : s)
      );
      setSnippets(revertedSnippets);
      try { onSnippetsChanged && onSnippetsChanged(revertedSnippets); } catch {}
    });
  }

  async function onCreateSnippet() {
    // Create a local draft; persist only on Save
    // Update last saved reference first to prevent autosave from triggering
    lastSavedRef.current = { id: '__new__', title: 'Untitled snippet', content: '' };
    
    setSelectedId('__new__');
    setTitle('Untitled snippet');
    setContent('');
    setTimeout(() => { try { textareaRef.current?.focus(); } catch {} }, 0);
  }

  async function onSaveSnippet() {
    if (!repo || !user) return;
    
    // Don't save during delete operations
    if (isDeletingRef.current) {
      console.log('Save skipped - delete operation in progress');
      return;
    }
    
    // Don't save if there's no valid selectedId
    if (!selectedId) {
      console.log('Save skipped - no valid selectedId');
      return;
    }
    
    setSaving(true);
    try {
      const payload = { title: (title || 'Untitled snippet').trim(), content: String(content || '') };
      if (selectedId === '__new__' || !snippets.find(s => s.id === selectedId)) {
        const created = await repo.createSnippet(payload);
        // Add to list without reloading
        addSnippetToList(created);
        setSelectedId(created?.id || null);
        lastSavedRef.current = { id: created?.id || null, title: payload.title, content: payload.content };
      } else {
        await repo.updateSnippet(selectedId, payload);
        // Update in list without reloading
        updateSnippetInList(selectedId, { 
          title: payload.title, 
          content: payload.content,
          updatedAt: new Date()
        });
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
    
    // Set deleting flag to prevent autosave
    isDeletingRef.current = true;
    setSaving(true);
    
    try {
      console.log('Deleting snippet:', id);
      
      // Track this snippet as deleted BEFORE the delete operation
      // This prevents any race conditions
      deletedSnippetsRef.current.add(id);
      
      await repo.deleteSnippet(id);
      console.log('Snippet deleted successfully:', id);
      
      // Wait a bit for Firestore to propagate the deletion
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Clean up deleted snippets tracking after 30 seconds
      setTimeout(() => {
        deletedSnippetsRef.current.delete(id);
      }, 30000);
      
      // Clear form state without triggering autosave
      const wasSelected = selectedId === id;
      if (wasSelected) {
        console.log('Clearing form state after deletion');
        // Update last saved reference first to prevent autosave
        lastSavedRef.current = { id: null, title: '', content: '' };
        setSelectedId(null);
        setTitle('');
        setContent('');
      }
      
      // Remove from list without reloading
      removeSnippetFromList(id);
    } catch (e) {
      console.error('Delete snippet failed', e);
      // Remove from tracking if delete failed
      deletedSnippetsRef.current.delete(id);
      alert('Failed to delete snippet. Please try again.');
    } finally {
      setSaving(false);
      // Clear deleting flag after a short delay to allow state updates to complete
      setTimeout(() => {
        isDeletingRef.current = false;
      }, 100);
    }
  }

  async function onCopySnippet(snippet) {
    try {
      const text = (snippet?.content ?? content ?? '') || '';
      await navigator.clipboard.writeText(text);
      if (repo && user && snippet?.id && snippet?.id !== '__new__') {
        repo.incrementCopyCount(snippet.id).then(() => {
          // Update the copy count in the local list
          updateSnippetInList(snippet.id, { 
            copyCount: (snippets.find(s => s.id === snippet.id)?.copyCount || 0) + 1, 
            lastCopiedAt: new Date() 
          });
        }).catch(() => {});
      }
      setJustCopied(true);
      setTimeout(() => setJustCopied(false), 900);
    } catch (e) {
      console.error('Copy failed', e);
    }
  }

  // Autosave: debounce on title/content changes
  useEffect(() => {
    if (!open || !repo || !user) return;
    
    // Don't autosave during delete operations
    if (isDeletingRef.current) {
      console.log('Autosave skipped - delete operation in progress');
      return;
    }
    
    const trimmedTitle = (title || '').trim();
    const trimmedContent = String(content || '');
    
    // Avoid creating empty snippets automatically
    if (selectedId === '__new__' && trimmedTitle.length === 0 && trimmedContent.trim().length === 0) return;
    
    // Skip if no change since last save
    if (lastSavedRef.current.id === selectedId && lastSavedRef.current.title === trimmedTitle && lastSavedRef.current.content === trimmedContent) {
      console.log('Autosave skipped - no changes detected');
      return;
    }
    
    // Only autosave for actual user edits, not programmatic state changes
    if (selectedId && (selectedId === '__new__' || snippets.find(s => s.id === selectedId))) {
      console.log('Autosave scheduled for snippet:', selectedId, 'in 800ms');
      const handle = setTimeout(() => {
        console.log('Autosave triggered for snippet:', selectedId);
        onSaveSnippet();
      }, 800);
      return () => clearTimeout(handle);
    } else {
      console.log('Autosave skipped - invalid selectedId:', selectedId);
    }
  }, [title, content, selectedId, open, snippets]);

  // Handle escape key to close modal
  useEffect(() => {
    if (!open) return;
    
    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        onClose();
      }
    }
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

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
                  <button type="button" onClick={onCreateSnippet} className="w-8 h-8 bg-indigo-600 text-white rounded inline-flex items-center justify-center" disabled={saving || !repo} data-tip="New Snippet">
                    <Plus size={16} />
                  </button>
                  <button type="button" onClick={refreshList} className="w-8 h-8 rounded border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 inline-flex items-center justify-center" disabled={loading || !repo} data-tip="Refresh">
                    <RotateCcw size={16} />
                  </button>
                  <button type="button" onClick={onClose} className="w-8 h-8 inline-flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Close">
                    <X size={18} />
                  </button>
                </div>
              </div>

              <div className="flex-1 min-h-0 grid grid-cols-12">
                {/* Left pane: list */}
                <div className="col-span-4 border-r border-slate-200 dark:border-slate-800 flex flex-col min-h-0">
                  <div className="p-3 flex-shrink-0">
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
                  <div className="flex-1 min-h-0 overflow-y-auto">
                    {loading ? (
                      <div className="p-4 text-sm text-slate-500">Loading…</div>
                    ) : filtered.length === 0 ? (
                      <div className="p-4 text-sm text-slate-500">No snippets</div>
                    ) : (
                      <ul className="space-y-0">
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


