import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Trash2, Copy, Pin, PinOff } from "lucide-react";

export default function SnippetsDrawer({ open, onClose, repo, user, snippetId = null, onSnippetsChanged }) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selectedId, setSelectedId] = useState(snippetId);
  const [pinned, setPinned] = useState(false);
  const textareaRef = useRef(null);
  const [originalTitle, setOriginalTitle] = useState(""); // Track original title to detect changes
  const [originalContent, setOriginalContent] = useState(""); // Track original content to detect changes
  const [hasUserModified, setHasUserModified] = useState(false); // Track if user has actually modified content
  const [isInitialized, setIsInitialized] = useState(false); // Track if component has fully initialized

  useEffect(() => {
    setSelectedId(snippetId);
  }, [snippetId]);

  useEffect(() => {
    if (!open) return;
    if (!repo || !user) return;
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        if (!selectedId || selectedId === '__new__') {
          if (!mounted) return;
          setTitle('Untitled snippet');
          setContent('');
          setPinned(false);
          setOriginalTitle('Untitled snippet');
          setOriginalContent('');
          setHasUserModified(false);
          setIsInitialized(false);
          setTimeout(() => { try { textareaRef.current?.focus(); } catch {} }, 0);
          // Set initialized after a short delay
          setTimeout(() => setIsInitialized(true), 100);
        } else {
          // Load single snippet by id via list then find; repo lacks get-by-id helper
          const list = await repo.listSnippets({ includeArchived: false, limit: 500 });
          const sn = (list || []).find(s => s.id === selectedId) || null;
          if (!mounted) return;
          setTitle(sn?.title || '');
          setContent(sn?.content || '');
          setPinned(!!sn?.pinned);
          setOriginalTitle(sn?.title || '');
          setOriginalContent(sn?.content || '');
          setHasUserModified(false);
          setIsInitialized(false);
          setTimeout(() => { try { textareaRef.current?.focus(); } catch {} }, 0);
          // Set initialized after a short delay
          setTimeout(() => setIsInitialized(true), 100);
        }
      } catch (e) {
        console.error('Failed to load snippet', e);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [open, repo, user, selectedId]);

  // Auto-save snippet: debounce when user has modified content
  useEffect(() => {
    if (!open) return;
    if (!hasUserModified) return; // Only auto-save if user has actually modified content
    
    console.log('🔄 Snippet auto-save triggered:', { open, hasUserModified, title, content: content?.substring(0, 50) });
    
    const handle = setTimeout(async () => {
      try {
        console.log('💾 Executing snippet auto-save...');
        if (!repo || !user) return;
        setSaving(true);
        
        if (!selectedId || selectedId === '__new__') {
          // Create snippet in background (non-blocking)
          repo.createSnippet({ title: (title || 'Untitled snippet').trim(), content: String(content || '') })
            .then((created) => {
              try { onSnippetsChanged && onSnippetsChanged(); } catch {}
            })
            .catch((err) => {
              console.error('Failed to save snippet to cloud', err);
            });
        } else {
          // Update snippet in background (non-blocking)
          repo.updateSnippet(selectedId, { title: (title || 'Untitled snippet').trim(), content: String(content || '') })
            .then(() => {
              try { onSnippetsChanged && onSnippetsChanged(); } catch {}
            })
            .catch((err) => {
              console.error('Failed to update snippet in cloud', err);
            });
        }
        
        // Reset modification flag after successful save
        setHasUserModified(false);
        setOriginalTitle(title);
        setOriginalContent(content);
        console.log('✅ Snippet auto-save completed');
      } catch (e) {
        console.error('❌ Snippet auto-save failed:', e);
      } finally {
        setSaving(false);
      }
    }, 1200);
    
    return () => clearTimeout(handle);
  }, [title, content, open, hasUserModified, repo, user, selectedId, onSnippetsChanged]);

  // Track title changes - only after component is initialized
  useEffect(() => {
    if (!isInitialized) return; // Don't track changes until fully initialized
    
    if (title !== originalTitle) {
      setHasUserModified(true);
    }
  }, [title, originalTitle, isInitialized]);

  // Track content changes - only after component is initialized
  useEffect(() => {
    if (!isInitialized) return; // Don't track changes until fully initialized
    
    if (content !== originalContent) {
      setHasUserModified(true);
    }
  }, [content, originalContent, isInitialized]);

  // Helper functions for consistent modification tracking
  function updateTitle(newTitle) {
    setTitle(newTitle);
  }

  function updateContent(newContent) {
    setContent(newContent);
  }

  async function onSave() {
    if (!repo || !user) return;
    setSaving(true);
    try {
      if (!selectedId || selectedId === '__new__') {
        // Create snippet in background (non-blocking)
        repo.createSnippet({ title: (title || 'Untitled snippet').trim(), content: String(content || '') })
          .then((created) => {
            try { onSnippetsChanged && onSnippetsChanged(); } catch {}
          })
          .catch((err) => {
            console.error('Failed to save snippet to cloud', err);
          });
      } else {
        // Update snippet in background (non-blocking)
        repo.updateSnippet(selectedId, { title: (title || 'Untitled snippet').trim(), content: String(content || '') })
          .then(() => {
            try { onSnippetsChanged && onSnippetsChanged(); } catch {}
          })
          .catch((err) => {
            console.error('Failed to update snippet in cloud', err);
          });
      }
      
      // Reset modification flag after successful save
      setHasUserModified(false);
      setOriginalTitle(title);
      setOriginalContent(content);
      
      // Clear fields and close sidebar immediately after showing saved message
      setTimeout(() => {
        setTitle('');
        setContent('');
        setSelectedId(null);
        onClose && onClose();
      }, 950); // Close immediately after "Saved" message disappears
    } catch (e) {
      console.error('Save snippet failed', e);
    } finally {
      setSaving(false);
    }
  }

  async function onDelete() {
    if (!repo || !user) return;
    if (!selectedId || selectedId === '__new__') { onClose && onClose(); return; }
    const ok = confirm('Delete this snippet?');
    if (!ok) return;
    
    // Close immediately and delete in background
    onClose && onClose();
    
    // Delete snippet in background (non-blocking)
    repo.deleteSnippet(selectedId)
      .then(() => {
        try { onSnippetsChanged && onSnippetsChanged(null); } catch {}
      })
      .catch((err) => {
        console.error('Delete snippet failed', err);
        // Could show a toast notification here if needed
      });
  }

  // Handle close with unsaved changes warning
  function handleClose() {
    if (hasUserModified) {
      const ok = confirm('You have unsaved changes. Are you sure you want to close?');
      if (!ok) return;
    }
    // Reset modification flags when closing
    setHasUserModified(false);
    setOriginalTitle('');
    setOriginalContent('');
    onClose && onClose();
  }

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(String(content || ''));
      if (repo && user && selectedId && selectedId !== '__new__') {
        repo.incrementCopyCount(selectedId).catch(() => {});
      }
    } catch (e) {
      console.error('Copy failed', e);
    }
  }

  async function onTogglePin() {
    if (!repo || !user) return;
    if (!selectedId || selectedId === '__new__') return;
    const next = !pinned;
    
    // Update UI immediately
    setPinned(next);
    
    // Update snippet in background (non-blocking)
    repo.updateSnippet(selectedId, { pinned: next })
      .then(() => {
        try { onSnippetsChanged && onSnippetsChanged(null); } catch {}
      })
      .catch((err) => {
        console.error('Toggle pin failed', err);
        // Revert UI state on error
        setPinned(!next);
      });
  }

  const headerTitle = useMemo(() => (selectedId && selectedId !== '__new__' ? 'Edit Snippet' : 'New Snippet'), [selectedId]);

  return (
    <AnimatePresence>
      {open && (
        <motion.aside
          initial={{ x: 420, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 420, opacity: 0 }}
          transition={{ type: "spring", stiffness: 280, damping: 28 }}
          className="fixed right-0 top-0 h-full z-[70] w-full max-w-md bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-xl flex flex-col"
          aria-label="Snippets panel"
        >
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="text-lg font-semibold text-slate-900 dark:text-slate-100">{headerTitle}</div>
            <div className="flex items-center gap-3">
              {/* Auto-save indicator */}
              {hasUserModified && (
                <div className="inline-flex items-center gap-2 px-2 py-1 text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 rounded">
                  <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
                  Auto-saving...
                </div>
              )}
              <button
                type="button"
                onClick={handleClose}
                className="w-8 h-8 inline-flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                aria-label="Close snippets"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          <div className="p-4 flex-1 min-h-0 flex flex-col">
            <div className="flex items-center gap-2 mb-2">
              <input
                type="text"
                value={title}
                onChange={(e) => updateTitle(e.target.value)}
                placeholder="Title"
                className="flex-1 px-3 py-2 rounded bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              />
            </div>
            <div className="flex items-center gap-2 mb-2">
              <button type="button" onClick={onCopy} className="px-2 py-1 text-xs rounded bg-slate-100 dark:bg-slate-800 inline-flex items-center gap-1">
                <Copy size={14} /> Copy
              </button>
              {selectedId && selectedId !== '__new__' && (
                <button type="button" onClick={onTogglePin} className="px-2 py-1 text-xs rounded bg-slate-100 dark:bg-slate-800 inline-flex items-center gap-1">
                  {pinned ? (<><Pin size={14} /> Unpin</>) : (<><PinOff size={14} /> Pin</>)}
                </button>
              )}
              <button type="button" onClick={onDelete} className="ml-auto px-2 py-1 text-xs rounded bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 inline-flex items-center gap-1">
                <Trash2 size={14} /> Delete
              </button>
            </div>
            <div className="flex-1 min-h-0">
              <textarea
                ref={textareaRef}
                rows={14}
                value={content}
                onChange={(e) => updateContent(e.target.value)}
                placeholder="Start typing your snippet…"
                className="input w-full h-full resize-none overflow-auto"
              />
            </div>
          </div>

          <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
            <button type="button" onClick={handleClose} className="px-4 py-2 rounded bg-slate-50 dark:bg-slate-800 dark:text-slate-200">
              Close
            </button>
            <motion.button
              type="button"
              onClick={onSave}
              className={`px-4 py-2 rounded text-white inline-flex items-center gap-2 ${saving ? 'bg-indigo-500' : 'bg-indigo-600'}`}
              animate={saving ? { scale: [1, 0.98, 1], opacity: [1, 0.8, 1] } : {}}
              transition={{ duration: 0.6, type: 'spring', stiffness: 250, damping: 20 }}
              disabled={saving}
            >
              {saving ? 'Saving…' : 'Save'}
            </motion.button>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}


