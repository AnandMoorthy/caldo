import React, { useMemo, useRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Bold, Italic, List, ListOrdered, Square, Strikethrough } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { loadNotesModePreference, saveNotesModePreference } from "../utils/storage";

export default function DayNotesDrawer({ open, dateLabel = "", value = "", onChange, onSave, onClose, onGoToDay, saving = false }) {
  const textareaRef = useRef(null);
  const [mode, setMode] = useState(() => loadNotesModePreference()); // 'edit' | 'preview'
  const safeText = useMemo(() => String(value || ""), [value]);
  const [autoJustSaved, setAutoJustSaved] = useState(false);
  const [originalValue, setOriginalValue] = useState(""); // Track original value to detect changes
  const [hasUserModified, setHasUserModified] = useState(false); // Track if user has actually modified content
  const [isInitialized, setIsInitialized] = useState(false); // Track if component has fully initialized

  // Set original value when opening drawer
  useEffect(() => {
    if (open) {
      console.log('📝 DayNotesDrawer opened:', { value: value?.substring(0, 50) });
      setOriginalValue(value || "");
      setHasUserModified(false);
      setIsInitialized(false);
      // Set initialized after a short delay to ensure value is stable
      setTimeout(() => setIsInitialized(true), 100);
    }
  }, [open, value]);

  // Track value changes - only after component is initialized
  useEffect(() => {
    if (!isInitialized) return; // Don't track changes until fully initialized
    
    if (value !== originalValue) {
      console.log('✏️ Day note content modified:', { 
        value: value?.substring(0, 50), 
        originalValue: originalValue?.substring(0, 50),
        hasUserModified: true 
      });
      setHasUserModified(true);
    }
  }, [value, originalValue, isInitialized]);

  function goEdit() {
    setMode('edit');
    saveNotesModePreference('edit');
    setTimeout(() => {
      try { textareaRef.current && textareaRef.current.focus(); } catch {}
    }, 0);
  }

  function goPreview() {
    setMode('preview');
    saveNotesModePreference('preview');
  }

  function getSelection() {
    const ta = textareaRef.current;
    if (!ta) return { start: value?.length || 0, end: value?.length || 0 };
    return { start: ta.selectionStart, end: ta.selectionEnd };
  }

  function setSelection(start, end) {
    const ta = textareaRef.current;
    if (!ta) return;
    try {
      ta.focus();
      requestAnimationFrame(() => {
        ta.setSelectionRange(start, end);
      });
    } catch {}
  }

  function updateValue(nextValue, nextSelStart, nextSelEnd) {
    onChange && onChange(nextValue);
    if (typeof nextSelStart === 'number' && typeof nextSelEnd === 'number') {
      setTimeout(() => setSelection(nextSelStart, nextSelEnd), 0);
    }
  }

  function wrapSelection(prefix, suffix = prefix) {
    const text = String(value || "");
    const { start, end } = getSelection();
    const before = text.slice(0, start);
    const selected = text.slice(start, end) || "";
    const after = text.slice(end);
    const wrapped = `${prefix}${selected}${suffix}`;
    const next = before + wrapped + after;
    const selStart = before.length + prefix.length;
    const selEnd = selStart + selected.length;
    updateValue(next, selStart, selEnd);
  }

  function formatLines(linePrefixFactory) {
    const text = String(value || "");
    const { start, end } = getSelection();
    const selStart = start;
    const selEnd = end;
    // Expand to full lines
    const lineStart = text.lastIndexOf('\n', Math.max(0, selStart - 1)) + 1;
    const lineEndIdx = text.indexOf('\n', selEnd);
    const lineEnd = lineEndIdx === -1 ? text.length : lineEndIdx;
    const before = text.slice(0, lineStart);
    const middle = text.slice(lineStart, lineEnd);
    const after = text.slice(lineEnd);
    const lines = middle.split('\n');
    const formatted = lines
      .map((ln, i) => {
        const prefix = linePrefixFactory(i);
        // Avoid duplicating prefix if already there
        if (ln.trim().length === 0) return ln; // leave blank lines alone
        const trimmed = ln.replace(/^\s*/, '');
        const leadingSpaces = ln.slice(0, ln.length - trimmed.length);
        if (trimmed.startsWith(prefix)) return ln; // already formatted
        return `${leadingSpaces}${prefix}${trimmed}`;
      })
      .join('\n');
    const next = before + formatted + after;
    // Keep selection over the same block
    const nextSelStart = lineStart;
    const nextSelEnd = lineStart + formatted.length;
    updateValue(next, nextSelStart, nextSelEnd);
  }

  function onBold() { wrapSelection('**'); }
  function onItalic() { wrapSelection('*'); }
  function onStrike() { wrapSelection('~~'); }
  function onUl() { formatLines(() => '- '); }
  function onOl() { formatLines((i) => `${i + 1}. `); }
  function onChecklist() { formatLines(() => '- [ ] '); }

  // Handle close with unsaved changes warning
  function handleClose() {
    if (hasUserModified) {
      const ok = confirm('You have unsaved changes. Are you sure you want to close?');
      if (!ok) return;
    }
    // Reset modification flags when closing
    setHasUserModified(false);
    setOriginalValue('');
    onClose && onClose();
  }

  // Autosave day note: debounce when in edit mode AND user has modified content
  useEffect(() => {
    if (!open) return;
    if (mode !== 'edit') return;
    if (!hasUserModified) return; // Only auto-save if user has actually modified content
    
    console.log('🔄 Auto-save triggered:', { open, mode, hasUserModified, value: value?.substring(0, 50) });
    
    const text = String(value || '');
    const handle = setTimeout(() => {
      try {
        console.log('💾 Executing auto-save...');
        if (onSave) {
          // Call onSave without await to prevent blocking
          onSave().then(() => {
            setAutoJustSaved(true);
            setTimeout(() => setAutoJustSaved(false), 900);
            // Reset modification flag after successful save
            setHasUserModified(false);
            setOriginalValue(text);
            console.log('✅ Auto-save completed');
          }).catch((e) => {
            console.error('❌ Auto-save failed:', e);
          });
        } else {
          // If no onSave function, just reset the modification flag
          setHasUserModified(false);
          setOriginalValue(text);
          console.log('✅ Auto-save completed (no onSave function)');
        }
      } catch (e) {
        console.error('❌ Auto-save failed:', e);
      }
    }, 1200);
    return () => clearTimeout(handle);
  }, [value, mode, open, hasUserModified, onSave]);

  return (
    <AnimatePresence>
      {open && (
        <motion.aside
          initial={{ x: 420, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 420, opacity: 0 }}
          transition={{ type: "spring", stiffness: 280, damping: 28 }}
          className="fixed right-0 top-0 h-full z-[70] w-full max-w-md bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-xl flex flex-col"
          aria-label="Day notes panel"
        >
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div>
              <div className="text-sm text-slate-500 dark:text-slate-400">Notes for</div>
              <div className="text-lg font-semibold text-slate-900 dark:text-slate-100">{dateLabel}</div>
            </div>
            <div className="flex items-center gap-3">
              {/* Auto-save indicator */}
              {hasUserModified && mode === 'edit' && (
                <div className="inline-flex items-center gap-2 px-2 py-1 text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 rounded">
                  <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
                  Auto-saving...
                </div>
              )}
              <a
                href={`#/x/n/${dateLabel?.slice?.(0,10) || ''}`}
                target="_blank"
                rel="noreferrer"
                className="w-auto px-2 py-1 text-xs inline-flex items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800"
              >
                Open in new tab
              </a>
              <button
                type="button"
                onClick={handleClose}
                className="w-8 h-8 inline-flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                aria-label="Close notes"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          <div className="p-4 flex-1 min-h-0 flex flex-col">
            <div className="flex justify-center mb-2">
              <div className="inline-flex rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                <button type="button" onClick={goEdit} className={`px-3 py-1.5 text-xs ${mode==='edit' ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>Edit</button>
                <button type="button" onClick={goPreview} className={`px-3 py-1.5 text-xs border-l border-slate-200 dark:border-slate-700 ${mode==='preview' ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>Preview</button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-1 mb-2">
              <button type="button" disabled={mode==='preview'} onClick={onBold} className={`px-2 py-1 text-xs rounded inline-flex items-center gap-1 ${mode==='preview' ? 'opacity-60 cursor-not-allowed bg-slate-100 dark:bg-slate-800' : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700'}`} data-tip="Bold (wrap with **)">
                <Bold size={14} /> Bold
              </button>
              <button type="button" disabled={mode==='preview'} onClick={onItalic} className={`px-2 py-1 text-xs rounded inline-flex items-center gap-1 ${mode==='preview' ? 'opacity-60 cursor-not-allowed bg-slate-100 dark:bg-slate-800' : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700'}`} data-tip="Italic (wrap with *)">
                <Italic size={14} /> Italic
              </button>
              <button type="button" disabled={mode==='preview'} onClick={onStrike} className={`px-2 py-1 text-xs rounded inline-flex items-center gap-1 ${mode==='preview' ? 'opacity-60 cursor-not-allowed bg-slate-100 dark:bg-slate-800' : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700'}`} data-tip="Strikethrough (wrap with ~~)">
                <Strikethrough size={14} /> Strike
              </button>
              <span className="inline-block w-px h-4 bg-slate-200 dark:border-slate-700 mx-1" />
              <button type="button" disabled={mode==='preview'} onClick={onUl} className={`px-2 py-1 text-xs rounded inline-flex items-center gap-1 ${mode==='preview' ? 'opacity-60 cursor-not-allowed bg-slate-100 dark:bg-slate-800' : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700'}`} data-tip="Bullet list (-)">
                <List size={14} /> Bullets
              </button>
              <button type="button" disabled={mode==='preview'} onClick={onOl} className={`px-2 py-1 text-xs rounded inline-flex items-center gap-1 ${mode==='preview' ? 'opacity-60 cursor-not-allowed bg-slate-100 dark:bg-slate-800' : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700'}`} data-tip="Numbered list (1.)">
                <ListOrdered size={14} /> Numbers
              </button>
              <button type="button" disabled={mode==='preview'} onClick={onChecklist} className={`px-2 py-1 text-xs rounded inline-flex items-center gap-1 ${mode==='preview' ? 'opacity-60 cursor-not-allowed bg-slate-100 dark:bg-slate-800' : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700'}`} data-tip="Checklist (- [ ] )">
                <Square size={14} /> Checklist
              </button>
            </div>
            <div className="flex-1 min-h-0">
              {mode === 'edit' ? (
                <textarea
                  ref={textareaRef}
                  rows={14}
                  value={value}
                  onChange={(e) => updateValue(e.target.value)}
                  placeholder="Write anything about your day..."
                  className="input w-full h-full resize-none overflow-auto"
                />
              ) : (
                <div className="max-w-none h-full overflow-auto rounded-lg border border-slate-200 dark:border-slate-800 p-3 bg-white dark:bg-slate-900">
                  {safeText.trim().length === 0 ? (
                    <div className="text-slate-400 dark:text-slate-500 text-sm">Nothing to preview</div>
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
                        del: ({node, ...props}) => <del className="line-through" {...props} />,
                        blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-slate-300 dark:border-slate-700 pl-3 italic text-slate-700 dark:text-slate-300 my-3" {...props} />,
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
                        td: ({node, ...props}) => <td className="border border-slate-200 dark:border-slate-700 px-2 py-1" {...props} />,
                        input: ({node, ...props}) => <input {...props} disabled className="align-middle mr-2 accent-indigo-600" />,
                      }}
                    >
                      {safeText}
                    </ReactMarkdown>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
            <div>
              {typeof onGoToDay === 'function' && (
                <button type="button" onClick={onGoToDay} className="px-3 py-2 rounded bg-slate-50 dark:bg-slate-800 dark:text-slate-200">
                  Go to day
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
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
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}


