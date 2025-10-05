import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Trash2, Copy, Pin, PinOff, Loader2, Share2 } from "lucide-react";
import RichTextEditor from "./RichTextEditor";

export default function SnippetsDrawer({ open, onClose, repo, user, snippetId = null, onSnippetsChanged, type = 'snippet', dateLabel = '', onGoToDay, onNotesChanged }) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selectedId, setSelectedId] = useState(snippetId);
  const [pinned, setPinned] = useState(false);
  const [originalTitle, setOriginalTitle] = useState(""); // Track original title to detect changes
  const [originalContent, setOriginalContent] = useState(""); // Track original content to detect changes
  const [hasUserModified, setHasUserModified] = useState(false); // Track if user has actually modified content
  const [isInitialized, setIsInitialized] = useState(false); // Track if component has fully initialized
  const [autoSavedId, setAutoSavedId] = useState(null); // Track if auto-save already created a snippet
  const [userHasInteracted, setUserHasInteracted] = useState(false); // Track if user has actually interacted with the editor
  const [isPublic, setIsPublic] = useState(false);
  const [allowWrite, setAllowWrite] = useState(false);
  const [publicSlug, setPublicSlug] = useState(null);
  const [editToken, setEditToken] = useState(null);
  const [shareSaving, setShareSaving] = useState(false);
  const [copiedView, setCopiedView] = useState(false);
  const [copiedEdit, setCopiedEdit] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const shareBtnRef = useRef(null);
  const sharePanelRef = useRef(null);
  const [shareStyle, setShareStyle] = useState({ top: 0, left: 0 });

  useEffect(() => {
    function positionShare() {
      if (!showShare) return;
      const btn = shareBtnRef.current;
      if (!btn) return;
      const rect = btn.getBoundingClientRect();
      const gap = 8;
      const panelWidth = Math.min(560, Math.floor(window.innerWidth * 0.9));
      const left = Math.max(8, Math.min(rect.left, window.innerWidth - panelWidth - 8));
      const top = Math.min(window.innerHeight - 8, rect.bottom + gap);
      setShareStyle({ top, left });
    }
    positionShare();
    const onScroll = () => positionShare();
    const onResize = () => positionShare();
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onResize);
    };
  }, [showShare]);

  useEffect(() => {
    function onDocClick(e) {
      if (!showShare) return;
      const panel = sharePanelRef.current;
      const btn = shareBtnRef.current;
      if (panel && panel.contains(e.target)) return;
      if (btn && btn.contains(e.target)) return;
      setShowShare(false);
    }
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, [showShare]);

  // Debug content changes
  useEffect(() => {
    console.log('SnippetsDrawer: Content state changed to:', content);
    console.log('SnippetsDrawer: Current props:', { open, snippetId, type, selectedId });
  }, [content, open, snippetId, type, selectedId]);

  // Consolidated effect to handle both selectedId changes and content loading
  useEffect(() => {
    if (!open) return;
    if (!repo || !user) return;
    
    // Set selectedId immediately
    setSelectedId(snippetId);
    
    // Reset auto-saved ID when opening a new snippet
    if (snippetId === '__new__' || !snippetId) {
      setAutoSavedId(null);
    }
    
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        if (!snippetId || snippetId === '__new__') {
          if (!mounted) return;
          const defaultTitle = type === 'note' ? 'Day Note' : 'Untitled snippet';
          setTitle(defaultTitle);
          setContent('');
          setPinned(false);
          setOriginalTitle(defaultTitle);
          setOriginalContent('');
          setHasUserModified(false);
          setIsInitialized(false);
          setUserHasInteracted(false);
          // Set initialized after a short delay
          setTimeout(() => {
            if (mounted) setIsInitialized(true);
          }, 100);
        } else {
          if (type === 'note') {
            // Load day note
            const note = await repo.getDayNote(snippetId);
            if (!mounted) return;
            console.log('Loading day note:', snippetId, note);
            setTitle('Day Note');
            setContent(note?.content || '');
            setPinned(false); // Notes don't have pin functionality
            setOriginalTitle('Day Note');
            setOriginalContent(note?.content || '');
            setHasUserModified(false);
            setIsInitialized(false);
            setUserHasInteracted(false);
            // Set initialized after a short delay
            setTimeout(() => {
              if (mounted) setIsInitialized(true);
            }, 100);
          } else {
            // Load single snippet by id via list then find; repo lacks get-by-id helper
            const list = await repo.listSnippets({ includeArchived: false, limit: 500 });
            const sn = (list || []).find(s => s.id === snippetId) || null;
            if (!mounted) return;
            console.log('Loading snippet:', snippetId, sn);
            console.log('Snippet content:', sn?.content);
            console.log('Setting title to:', sn?.title || '');
            console.log('Setting content to:', sn?.content || '');
            setTitle(sn?.title || '');
            setContent(sn?.content || '');
            setPinned(!!sn?.pinned);
            setIsPublic(!!sn?.isPublic);
            setAllowWrite(!!sn?.allowWrite);
            setPublicSlug(sn?.publicSlug || null);
            setEditToken(sn?.editToken || null);
            setOriginalTitle(sn?.title || '');
            setOriginalContent(sn?.content || '');
            setHasUserModified(false);
            setIsInitialized(false);
            setUserHasInteracted(false);
            // Set initialized after a short delay
            setTimeout(() => {
              if (mounted) setIsInitialized(true);
            }, 100);
          }
        }
      } catch (e) {
        console.error('Failed to load content', e);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [open, repo, user, snippetId, type]);

  // Auto-save content: debounce when user has modified content
  useEffect(() => {
    if (!open) return;
    if (!hasUserModified) return; // Only auto-save if user has actually modified content
    
    
    const handle = setTimeout(() => {
      try {
        if (!repo || !user) return;
        
        if (type === 'note') {
          // Auto-save day note
          repo.saveDayNote(selectedId, String(content || ''))
            .then(() => {
              // Reset modification flag after successful save
              setHasUserModified(false);
              setOriginalTitle(title);
              setOriginalContent(content);
              // Update notes cache
              try { onNotesChanged && onNotesChanged(selectedId, String(content || '')); } catch {}
            })
            .catch((err) => {
              console.error('Failed to auto-save day note to cloud', err);
            });
        } else {
          // Handle snippet auto-save
          if (!selectedId || selectedId === '__new__') {
            // Only create if we haven't already auto-saved this content
            if (!autoSavedId) {
              // Create snippet in background (non-blocking)
              repo.createSnippet({ title: (title || 'Untitled snippet').trim(), content: String(content || '') })
                .then((created) => {
                  setAutoSavedId(created.id); // Track the created snippet ID
                  try { onSnippetsChanged && onSnippetsChanged(); } catch {}
                  // Reset modification flag after successful save
                  setHasUserModified(false);
                  setOriginalTitle(title);
                  setOriginalContent(content);
                })
                .catch((err) => {
                  console.error('Failed to auto-save snippet to cloud', err);
                });
            } else {
              // Update the existing auto-saved snippet in background (non-blocking)
              repo.updateSnippet(autoSavedId, { title: (title || 'Untitled snippet').trim(), content: String(content || '') })
                .then(() => {
                  try { onSnippetsChanged && onSnippetsChanged(); } catch {}
                  // Reset modification flag after successful save
                  setHasUserModified(false);
                  setOriginalTitle(title);
                  setOriginalContent(content);
                })
                .catch((err) => {
                  console.error('Failed to update snippet in cloud', err);
                });
            }
          } else {
            // Update snippet in background (non-blocking)
            repo.updateSnippet(selectedId, { title: (title || 'Untitled snippet').trim(), content: String(content || '') })
              .then(() => {
                try { onSnippetsChanged && onSnippetsChanged(); } catch {}
                // Reset modification flag after successful save
                setHasUserModified(false);
                setOriginalTitle(title);
                setOriginalContent(content);
                console.log('✅ Snippet auto-save completed');
              })
              .catch((err) => {
                console.error('Failed to update snippet in cloud', err);
              });
          }
        }
      } catch (e) {
        console.error('❌ Snippet auto-save failed:', e);
      }
    }, 5000);
    
    return () => clearTimeout(handle);
  }, [title, content, open, hasUserModified, repo, user, selectedId, onSnippetsChanged, autoSavedId]);

  // Track title changes - only after user has actually interacted
  useEffect(() => {
    if (!isInitialized || !userHasInteracted) return;
    
    if (title !== originalTitle) {
      setHasUserModified(true);
    }
  }, [title, originalTitle, isInitialized, userHasInteracted]);

  // Track content changes - only after user has actually interacted
  useEffect(() => {
    if (!isInitialized || !userHasInteracted) return;
    
    if (content !== originalContent) {
      setHasUserModified(true);
    }
  }, [content, originalContent, isInitialized, userHasInteracted]);

  // Helper functions for consistent modification tracking
  function updateTitle(newTitle) {
    setUserHasInteracted(true);
    setTitle(newTitle);
  }

  function updateContent(newContent) {
    console.log('updateContent called with:', newContent);
    setUserHasInteracted(true);
    setContent(newContent);
  }

  async function onSave() {
    if (!repo || !user) return;
    
    // Don't save if already saving
    if (saving) return;
    
    setSaving(true);
    try {
      if (type === 'note') {
        // Save day note
        await repo.saveDayNote(selectedId, String(content || ''));
        console.log('✅ Day note saved for:', selectedId);
        // Update notes cache
        try { onNotesChanged && onNotesChanged(selectedId, String(content || '')); } catch {}
      } else {
        // Handle snippet saving
        if (!selectedId || selectedId === '__new__') {
          // If auto-save already created a snippet, update it instead of creating a new one
          if (autoSavedId) {
            await repo.updateSnippet(autoSavedId, { title: (title || 'Untitled snippet').trim(), content: String(content || '') });
            console.log('✅ Manual save updated auto-saved snippet with ID:', autoSavedId);
          } else {
            // Create snippet only if auto-save hasn't created one yet
            const created = await repo.createSnippet({ title: (title || 'Untitled snippet').trim(), content: String(content || '') });
            setAutoSavedId(created.id);
            console.log('✅ Manual save created new snippet with ID:', created.id);
          }
          try { onSnippetsChanged && onSnippetsChanged(); } catch {}
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
        setAutoSavedId(null); // Reset auto-saved ID when closing
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
    setAutoSavedId(null); // Reset auto-saved ID when closing
    setUserHasInteracted(false);
    onClose && onClose();
  }

  async function onCopy() {
    try {
      // Strip HTML tags for copying
      const doc = new DOMParser().parseFromString(content || '', 'text/html');
      const plainText = doc.body.textContent || '';
      await navigator.clipboard.writeText(plainText);
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

  async function onTogglePublic() {
    if (!repo || !user) return;
    try {
      setShareSaving(true);
      let ensureId = selectedId;
      if (!ensureId || ensureId === '__new__') {
        const created = await repo.createSnippet({ title: (title || 'Untitled snippet').trim(), content: String(content || '') });
        ensureId = created?.id;
        setSelectedId(ensureId);
        setAutoSavedId(ensureId);
      }
      if (isPublic) {
        await repo.unpublishSnippet(ensureId);
        setIsPublic(false);
        setPublicSlug(null);
      } else {
        const { publicSlug: slug } = await repo.publishSnippet(ensureId);
        setIsPublic(true);
        setPublicSlug(slug);
      }
    } catch (e) {
      console.error('Toggle public failed', e);
    } finally {
      setShareSaving(false);
    }
  }

  async function onToggleAllowWrite() {
    if (!repo || !user) return;
    try {
      setShareSaving(true);
      let ensureId = selectedId;
      if (!ensureId || ensureId === '__new__') {
        const created = await repo.createSnippet({ title: (title || 'Untitled snippet').trim(), content: String(content || '') });
        ensureId = created?.id;
        setSelectedId(ensureId);
        setAutoSavedId(ensureId);
      }
      if (!isPublic) {
        const { publicSlug: slug } = await repo.publishSnippet(ensureId);
        setIsPublic(true);
        setPublicSlug(slug);
      }
      if (allowWrite) {
        await repo.disablePublicWrite(ensureId);
        setAllowWrite(false);
      } else {
        const { publicSlug: slug, editToken: tok } = await repo.enablePublicWrite(ensureId);
        setAllowWrite(true);
        setPublicSlug(slug);
        setEditToken(tok);
      }
    } catch (e) {
      console.error('Toggle allow write failed', e);
    } finally {
      setShareSaving(false);
    }
  }

  const headerTitle = useMemo(() => {
    if (type === 'note') {
      return 'Edit Note';
    }
    return selectedId && selectedId !== '__new__' ? 'Edit Snippet' : 'New Snippet';
  }, [selectedId, type]);

  return (
    <AnimatePresence>
      {open && (
        <motion.aside
          initial={{ x: 896, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 896, opacity: 0 }}
          transition={{ type: "spring", stiffness: 280, damping: 28 }}
          className="fixed right-0 top-0 h-full z-[70] w-full max-w-4xl bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-xl flex flex-col"
          aria-label={type === 'note' ? 'Notes panel' : 'Snippets panel'}
        >
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="text-lg font-semibold text-slate-900 dark:text-slate-100">{headerTitle}</div>
            <div className="flex items-center gap-3">
              {/* Auto-save indicator */}
              {hasUserModified && (
                <div className="inline-flex items-center gap-2 px-2 py-1 text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 rounded">
                  <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
                  {autoSavedId ? 'Auto-saved' : 'Auto-saving...'}
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
            {type === 'snippet' && (
              <div className="flex items-center gap-2 mb-2">
                <input
                  type="text"
                  value={title}
                  onChange={(e) => updateTitle(e.target.value)}
                  placeholder="Title"
                  className="flex-1 px-3 py-2 rounded bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </div>
            )}
            {type === 'note' && (
              <div className="mb-2">
                <div className="text-sm font-medium text-slate-700 dark:text-slate-300">{dateLabel}</div>
              </div>
            )}
            <div className="flex items-center gap-2 mb-2">
              <button type="button" onClick={onCopy} className="px-2 py-1 text-xs rounded bg-slate-100 dark:bg-slate-800 inline-flex items-center gap-1">
                <Copy size={14} /> Copy
              </button>
              {type === 'snippet' && selectedId && selectedId !== '__new__' && (
                <button type="button" onClick={onTogglePin} className="px-2 py-1 text-xs rounded bg-slate-100 dark:bg-slate-800 inline-flex items-center gap-1">
                  {pinned ? (<><Pin size={14} /> Unpin</>) : (<><PinOff size={14} /> Pin</>)}
                </button>
              )}
              {type === 'snippet' && (
                <button ref={shareBtnRef} type="button" onClick={() => setShowShare((v) => !v)} className="px-2 py-1 text-xs rounded bg-slate-100 dark:bg-slate-800 inline-flex items-center gap-1">
                  <Share2 size={14} /> Share
                </button>
              )}
              {type === 'snippet' && selectedId && selectedId !== '__new__' && (
                <a
                  href={`#/x/sn/${selectedId}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-2 py-1 text-xs rounded bg-slate-100 dark:bg-slate-800 inline-flex items-center gap-1"
                >
                  Open in new tab
                </a>
              )}
              <button type="button" onClick={onDelete} className="ml-auto px-2 py-1 text-xs rounded bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 inline-flex items-center gap-1">
                <Trash2 size={14} /> Delete
              </button>

              {type === 'snippet' && showShare && (
                <div ref={sharePanelRef} style={{ position: 'fixed', top: `${shareStyle.top}px`, left: `${shareStyle.left}px`, width: 'min(560px, 90vw)' }} className="z-[75] p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl">
                  <div className="text-xs font-medium text-slate-600 dark:text-slate-300 mb-2 flex items-center gap-2">
                    <span>Share snippet</span>
                    {shareSaving && <Loader2 size={14} className="animate-spin text-slate-500" />}
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <label className="inline-flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={isPublic} onChange={onTogglePublic} disabled={shareSaving} /> Make public (read-only)
                    </label>
                  </div>
                  {isPublic && (
                    <div className="flex items-center gap-2 mb-2">
                      <div className="text-[12px] text-slate-600 dark:text-slate-300 truncate">
                        {`${window.location.origin}${window.location.pathname}#/s/${publicSlug || ''}`}
                      </div>
                      <button
                        type="button"
                        className="ml-auto px-2 py-0.5 text-[11px] rounded bg-slate-100 dark:bg-slate-800"
                        onClick={() => {
                          const url = `${window.location.origin}${window.location.pathname}#/s/${publicSlug}`;
                          navigator.clipboard.writeText(url).then(() => {
                            setCopiedView(true);
                            setTimeout(() => setCopiedView(false), 1200);
                          }).catch(() => {});
                        }}
                      >
                        {copiedView ? 'Copied!' : 'Copy view link'}
                      </button>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <label className="inline-flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={allowWrite} onChange={onToggleAllowWrite} disabled={shareSaving} /> Allow edits via link
                    </label>
                  </div>
                  {isPublic && allowWrite && (
                    <div className="mt-2 flex items-center gap-2">
                      <div className="text-[12px] text-slate-600 dark:text-slate-300 truncate">
                        {`${window.location.origin}${window.location.pathname}#/s/${publicSlug || ''}${editToken ? `?t=${encodeURIComponent(editToken)}` : ''}`}
                      </div>
                      <button
                        type="button"
                        className="ml-auto px-2 py-0.5 text-[11px] rounded bg-slate-100 dark:bg-slate-800"
                        onClick={() => {
                          const params = editToken ? `?t=${encodeURIComponent(editToken)}` : '';
                          const url = `${window.location.origin}${window.location.pathname}#/s/${publicSlug}${params}`;
                          navigator.clipboard.writeText(url).then(() => {
                            setCopiedEdit(true);
                            setTimeout(() => setCopiedEdit(false), 1200);
                          }).catch(() => {});
                        }}
                      >
                        {copiedEdit ? 'Copied!' : 'Copy edit link'}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="flex-1 min-h-0">
              {loading ? (
                <div className="flex items-center justify-center h-full text-slate-500">
                  <div className="text-sm">Loading...</div>
                </div>
              ) : (
                <RichTextEditor
                  key={`${type}-${selectedId || 'new'}`}
                  content={content}
                  onChange={updateContent}
                  placeholder={type === 'note' ? "Start typing your day note…" : "Start typing your snippet…"}
                />
              )}
            </div>
            {/* Share panel moved to the toolbar popover above */}
          </div>

          <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
            <button type="button" onClick={handleClose} className="px-3 py-1.5 text-sm rounded bg-slate-50 dark:bg-slate-800 dark:text-slate-200">
              Close
            </button>
            <motion.button
              type="button"
              onClick={onSave}
              className={`px-3 py-1.5 text-sm rounded text-white inline-flex items-center gap-2 ${saving ? 'bg-indigo-500' : 'bg-indigo-600'}`}
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


