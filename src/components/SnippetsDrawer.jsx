import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Trash2, Copy, Pin, PinOff } from "lucide-react";

export default function SnippetsDrawer({ open, onClose, repo, user, snippetId = null, onSnippetsChanged }) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selectedId, setSelectedId] = useState(snippetId);
  const [pinned, setPinned] = useState(false);
  const textareaRef = useRef(null);

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
          setTimeout(() => { try { textareaRef.current?.focus(); } catch {} }, 0);
        } else {
          // Load single snippet by id via list then find; repo lacks get-by-id helper
          const list = await repo.listSnippets({ includeArchived: false, limit: 500 });
          const sn = (list || []).find(s => s.id === selectedId) || null;
          if (!mounted) return;
          setTitle(sn?.title || '');
          setContent(sn?.content || '');
          setPinned(!!sn?.pinned);
          setTimeout(() => { try { textareaRef.current?.focus(); } catch {} }, 0);
        }
      } catch (e) {
        console.error('Failed to load snippet', e);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [open, repo, user, selectedId]);

  async function onSave() {
    if (!repo || !user) return;
    setSaving(true);
    try {
      if (!selectedId || selectedId === '__new__') {
        const created = await repo.createSnippet({ title: (title || 'Untitled snippet').trim(), content: String(content || '') });
        try { onSnippetsChanged && onSnippetsChanged(); } catch {}
      } else {
        await repo.updateSnippet(selectedId, { title: (title || 'Untitled snippet').trim(), content: String(content || '') });
        try { onSnippetsChanged && onSnippetsChanged(); } catch {}
      }
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 900);
      
      // Clear fields and close sidebar after successful save
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
    try {
      await repo.deleteSnippet(selectedId);
      try { onSnippetsChanged && onSnippetsChanged(null); } catch {}
      onClose && onClose();
    } catch (e) {
      console.error('Delete snippet failed', e);
    }
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
    setPinned(next);
    try {
      await repo.updateSnippet(selectedId, { pinned: next });
      try { onSnippetsChanged && onSnippetsChanged(null); } catch {}
    } catch (e) {
      setPinned(!next);
      console.error('Toggle pin failed', e);
    }
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
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 inline-flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="Close snippets"
            >
              <X size={18} />
            </button>
          </div>

          <div className="p-4 flex-1 min-h-0 flex flex-col">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Title"
              className="mb-2 px-3 py-2 rounded bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            />
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
                onChange={(e) => setContent(e.target.value)}
                placeholder="Start typing your snippet…"
                className="input w-full h-full resize-none overflow-auto"
              />
            </div>
          </div>

          <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded bg-slate-50 dark:bg-slate-800 dark:text-slate-200">
              Close
            </button>
            <motion.button
              type="button"
              onClick={onSave}
              className={`px-4 py-2 rounded text-white inline-flex items-center gap-2 ${saving ? 'bg-indigo-500' : 'bg-indigo-600'}`}
              animate={saving ? { scale: [1, 0.98, 1], opacity: [1, 0.8, 1] } : justSaved ? { scale: [1, 1.06, 1] } : {}}
              transition={{ duration: 0.6, type: 'spring', stiffness: 250, damping: 20 }}
              disabled={saving}
            >
              {saving ? 'Saving…' : justSaved ? 'Saved' : 'Save'}
            </motion.button>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}


