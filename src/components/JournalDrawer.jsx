import React, { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Calendar, ChevronDown, ChevronRight, Loader2, Plus, Save, Trash2, X } from "lucide-react";
import {
  JOURNAL_BLOCK_LIBRARY,
  composeJournalContentFromBlocks,
  createBlockStructureFromBlocks,
  createBlocksFromStructure,
  createJournalBlock,
  normalizeJournalBlocks,
} from "../utils/journalTemplates";
import { keyFor } from "../utils/date";

const MOOD_OPTIONS = [
  { id: "happy", label: "Happy", emoji: "😊" },
  { id: "calm", label: "Calm", emoji: "😌" },
  { id: "grateful", label: "Grateful", emoji: "😍" },
  { id: "tired", label: "Tired", emoji: "😴" },
  { id: "anxious", label: "Anxious", emoji: "😰" },
  { id: "frustrated", label: "Frustrated", emoji: "😤" },
];

function hasMeaningfulContent(blocks) {
  return normalizeJournalBlocks(blocks).some((block) => {
    if (block.type === "text") return String(block.text || "").trim().length > 0;
    return (block.items || []).some((item) => String(item.text || "").trim().length > 0);
  });
}

function createDefaultExpanded(blocks) {
  const map = {};
  (blocks || []).forEach((block, index) => {
    map[block.id] = index === 0;
  });
  return map;
}

function trimEmptyTrailingItems(block) {
  if (!block || !Array.isArray(block.items)) return block;
  const items = [...block.items];
  while (items.length > 1 && !String(items[items.length - 1].text || "").trim()) {
    items.pop();
  }
  return { ...block, items };
}

export default function JournalDrawer({
  open,
  onClose,
  repo,
  user,
  journalId = null,
  initialDateKey = null,
  onJournalsChanged,
  onBindClose,
}) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [selectedId, setSelectedId] = useState(journalId);
  const [title, setTitle] = useState("");
  const [blocks, setBlocks] = useState([createJournalBlock("text", "Notes")]);
  const [mood, setMood] = useState("");
  const [energyLevel, setEnergyLevel] = useState(3);
  const [dateKey, setDateKey] = useState(() => initialDateKey || keyFor(new Date()));
  const [hasChanges, setHasChanges] = useState(false);
  const [expandedBlocks, setExpandedBlocks] = useState({});
  const [templates, setTemplates] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [templateNameInput, setTemplateNameInput] = useState("");
  const [applyingTemplateId, setApplyingTemplateId] = useState(null);
  const [applyTemplateWarningOpen, setApplyTemplateWarningOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [discardConfirmOpen, setDiscardConfirmOpen] = useState(false);
  const [emptySaveOpen, setEmptySaveOpen] = useState(false);
  const closeImplRef = useRef(() => {});

  const hasAnyContent = useMemo(() => hasMeaningfulContent(blocks), [blocks]);

  useEffect(() => {
    if (!open || !repo || !user) return;
    let mounted = true;
    async function loadTemplates() {
      try {
        const data = await repo.listJournalTemplates({ limit: 100 });
        if (!mounted) return;
        setTemplates(data);
      } catch (error) {
        console.error("Failed to load journal templates", error);
      }
    }
    loadTemplates();
    return () => {
      mounted = false;
    };
  }, [open, repo, user]);

  useEffect(() => {
    if (!open || !repo || !user) return;
    setSelectedId(journalId || "__new__");
    let mounted = true;

    async function loadJournal() {
      setLoading(true);
      try {
        if (!journalId || journalId === "__new__") {
          const initialBlocks = [createJournalBlock("text", "Notes")];
          if (!mounted) return;
          setTitle("Journal Entry");
          setBlocks(initialBlocks);
          setMood("");
          setEnergyLevel(3);
          setDateKey(initialDateKey || keyFor(new Date()));
          setExpandedBlocks(createDefaultExpanded(initialBlocks));
          setHasChanges(false);
          return;
        }

        const record = await repo.getJournal(journalId);
        if (!mounted) return;
        const normalizedBlocks = normalizeJournalBlocks(record?.blocks, record?.content || "", record?.sections);
        setTitle(record?.title || "Journal Entry");
        setBlocks(normalizedBlocks);
        setMood(record?.mood || "");
        setEnergyLevel(Number(record?.energyLevel) || 3);
        setDateKey(record?.dateKey || initialDateKey || keyFor(new Date()));
        setExpandedBlocks(createDefaultExpanded(normalizedBlocks));
        setHasChanges(false);
      } catch (error) {
        console.error("Failed to load journal", error);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadJournal();
    return () => {
      mounted = false;
    };
  }, [open, repo, user, journalId, initialDateKey]);

  function markChanged(setter) {
    return (value) => {
      setHasChanges(true);
      setter(value);
    };
  }

  function toggleBlock(blockId) {
    setExpandedBlocks((prev) => ({ ...prev, [blockId]: !prev[blockId] }));
  }

  function addBlock(type) {
    const block = createJournalBlock(type);
    setHasChanges(true);
    setBlocks((prev) => [...prev, block]);
    setExpandedBlocks((prev) => ({ ...prev, [block.id]: true }));
  }

  function removeBlock(blockId) {
    setHasChanges(true);
    setBlocks((prev) => {
      const next = prev.filter((block) => block.id !== blockId);
      return next.length ? next : [createJournalBlock("text", "Notes")];
    });
    setExpandedBlocks((prev) => {
      const next = { ...prev };
      delete next[blockId];
      return next;
    });
  }

  function moveBlock(blockId, direction) {
    setHasChanges(true);
    setBlocks((prev) => {
      const idx = prev.findIndex((block) => block.id === blockId);
      if (idx < 0) return prev;
      const targetIdx = direction === "up" ? idx - 1 : idx + 1;
      if (targetIdx < 0 || targetIdx >= prev.length) return prev;
      const next = [...prev];
      const [item] = next.splice(idx, 1);
      next.splice(targetIdx, 0, item);
      return next;
    });
  }

  function updateBlockHeading(blockId, heading) {
    setHasChanges(true);
    setBlocks((prev) =>
      prev.map((block) => (block.id === blockId ? { ...block, heading } : block))
    );
  }

  function updateTextBlock(blockId, text) {
    setHasChanges(true);
    setBlocks((prev) =>
      prev.map((block) => (block.id === blockId ? { ...block, text } : block))
    );
  }

  function addListItem(blockId) {
    setHasChanges(true);
    setBlocks((prev) =>
      prev.map((block) => {
        if (block.id !== blockId) return block;
        const isTodo = block.type === "todo";
        const item = isTodo
          ? { id: `${blockId}_${Date.now()}_${Math.random().toString(16).slice(2)}`, text: "", checked: false }
          : { id: `${blockId}_${Date.now()}_${Math.random().toString(16).slice(2)}`, text: "" };
        return { ...block, items: [...(block.items || []), item] };
      })
    );
  }

  function updateListItem(blockId, itemId, value) {
    setHasChanges(true);
    setBlocks((prev) =>
      prev.map((block) => {
        if (block.id !== blockId) return block;
        return {
          ...block,
          items: (block.items || []).map((item) => (item.id === itemId ? { ...item, text: value } : item)),
        };
      })
    );
  }

  function toggleTodoItem(blockId, itemId) {
    setHasChanges(true);
    setBlocks((prev) =>
      prev.map((block) => {
        if (block.id !== blockId || block.type !== "todo") return block;
        return {
          ...block,
          items: (block.items || []).map((item) =>
            item.id === itemId ? { ...item, checked: !item.checked } : item
          ),
        };
      })
    );
  }

  function removeListItem(blockId, itemId) {
    setHasChanges(true);
    setBlocks((prev) =>
      prev.map((block) => {
        if (block.id !== blockId) return block;
        const items = (block.items || []).filter((item) => item.id !== itemId);
        if (!items.length) {
          return block.type === "todo"
            ? { ...block, items: [{ id: `${blockId}_new`, text: "", checked: false }] }
            : { ...block, items: [{ id: `${blockId}_new`, text: "" }] };
        }
        return { ...block, items };
      })
    );
  }

  function openTemplateSaveDialog() {
    setTemplateNameInput(title?.trim() || "Journal Template");
    setTemplateDialogOpen(true);
  }

  async function saveCurrentAsTemplate() {
    if (!repo || !user) return;
    const name = String(templateNameInput || "").trim();
    if (!name) {
      alert("Please enter a template name.");
      return;
    }
    const structure = createBlockStructureFromBlocks(blocks);
    try {
      await repo.saveJournalTemplate({ name, structure });
      const updated = await repo.listJournalTemplates({ limit: 100 });
      setTemplates(updated);
      setTemplateDialogOpen(false);
    } catch (error) {
      console.error("Failed to save journal template", error);
      alert("Failed to save template. Please try again.");
    }
  }

  function requestApplyTemplate(templateId) {
    if (!templateId) return;
    if (hasAnyContent) {
      setApplyingTemplateId(templateId);
      setApplyTemplateWarningOpen(true);
      return;
    }
    applyTemplate(templateId);
  }

  function applyTemplate(templateId) {
    const template = templates.find((item) => item.id === templateId);
    if (!template) return;
    const nextBlocks = createBlocksFromStructure(template.structure);
    setBlocks(nextBlocks);
    setExpandedBlocks(createDefaultExpanded(nextBlocks));
    setSelectedTemplateId(template.id);
    setHasChanges(true);
    setApplyTemplateWarningOpen(false);
    setApplyingTemplateId(null);
  }

  async function handleSave() {
    if (!repo || !user) return;
    if (!hasAnyContent) {
      setEmptySaveOpen(true);
      return;
    }

    const normalizedBlocks = normalizeJournalBlocks(blocks).map(trimEmptyTrailingItems);
    const normalizedDate = String(dateKey || keyFor(new Date()));
    const payload = {
      title: (title || "Journal Entry").trim(),
      blocks: normalizedBlocks,
      content: composeJournalContentFromBlocks(normalizedBlocks),
      mood: mood || null,
      energyLevel: Number(energyLevel) || 3,
      dateKey: normalizedDate,
    };

    setSaving(true);
    try {
      const sourceId = selectedId && selectedId !== "__new__" ? selectedId : null;
      const saved = await repo.upsertJournalByDate(normalizedDate, payload, sourceId);
      setSelectedId(saved?.id || normalizedDate);
      try {
        onJournalsChanged && (await onJournalsChanged());
      } catch {}
      setHasChanges(false);
      onClose && onClose();
    } catch (error) {
      console.error("Failed to save journal", error);
      alert("Failed to save journal. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  function requestDelete() {
    if (!repo || !selectedId || selectedId === "__new__" || deleting || saving) return;
    setDeleteConfirmOpen(true);
  }

  async function confirmDelete() {
    if (!repo || !selectedId || selectedId === "__new__") return;
    setDeleting(true);
    try {
      await repo.deleteJournal(selectedId);
      try {
        onJournalsChanged && (await onJournalsChanged());
      } catch {}
      setHasChanges(false);
      setDeleteConfirmOpen(false);
      onClose && onClose();
    } catch (error) {
      console.error("Failed to delete journal", error);
      alert("Failed to delete journal. Please try again.");
    } finally {
      setDeleting(false);
    }
  }

  function requestClose() {
    if (deleteConfirmOpen || discardConfirmOpen || templateDialogOpen || applyTemplateWarningOpen || emptySaveOpen) return;
    if (hasChanges) {
      setDiscardConfirmOpen(true);
      return;
    }
    onClose && onClose();
  }

  function confirmDiscard() {
    setDiscardConfirmOpen(false);
    setHasChanges(false);
    onClose && onClose();
  }

  closeImplRef.current = requestClose;

  useEffect(() => {
    onBindClose?.(() => closeImplRef.current());
    return () => onBindClose?.(null);
  }, [onBindClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.aside
            key="journal-drawer"
            initial={{ x: 896 }}
            animate={{ x: 0 }}
            exit={{ x: 896 }}
            transition={{ type: "spring", stiffness: 280, damping: 28 }}
            className="fixed right-0 top-0 h-full z-[70] w-full max-w-4xl bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-xl flex flex-col"
            aria-label="Journal editor"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800">
              <div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Journal</div>
                <div className="font-semibold text-slate-900 dark:text-slate-100">
                  {selectedId && selectedId !== "__new__" ? "Edit entry" : "New entry"}
                </div>
              </div>
              <button
                type="button"
                onClick={requestClose}
                className="w-8 h-8 inline-flex items-center justify-center rounded hover:bg-slate-100 dark:hover:bg-slate-800"
                aria-label="Close journal editor"
              >
                <X size={18} />
              </button>
            </div>

            {loading ? (
              <div className="flex-1 flex items-center justify-center text-slate-500 dark:text-slate-400 gap-2">
                <Loader2 size={18} className="animate-spin" />
                Loading journal...
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Date</label>
                    <div className="mt-1 relative">
                      <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="date"
                        value={dateKey}
                        onChange={(e) => markChanged(setDateKey)(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Title</label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => markChanged(setTitle)(e.target.value)}
                      placeholder="Journal Entry"
                      className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-end gap-2">
                  <div className="min-w-[220px]">
                    <label className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Apply saved template</label>
                    <select
                      value={selectedTemplateId}
                      onChange={(e) => setSelectedTemplateId(e.target.value)}
                      className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                    >
                      <option value="">Select template</option>
                      {templates.map((template) => (
                        <option key={template.id} value={template.id}>
                          {template.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    type="button"
                    onClick={() => requestApplyTemplate(selectedTemplateId)}
                    disabled={!selectedTemplateId}
                    className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-sm disabled:opacity-60"
                  >
                    Apply template
                  </button>
                  <button
                    type="button"
                    onClick={openTemplateSaveDialog}
                    className="px-3 py-2 rounded-lg border border-indigo-300 text-indigo-700 dark:border-indigo-700 dark:text-indigo-300 text-sm"
                  >
                    Save as template
                  </button>
                </div>

                <div>
                  <label className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">How do you feel?</label>
                  <div className="mt-2 grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {MOOD_OPTIONS.map((option) => (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => markChanged(setMood)(option.id)}
                        className={`rounded-xl border px-2 py-2 text-sm transition-colors ${
                          mood === option.id
                            ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30"
                            : "border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                        }`}
                      >
                        <span className="mr-1">{option.emoji}</span>
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Energy level ({energyLevel}/5)
                  </label>
                  <div className="mt-2 flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((value) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => markChanged(setEnergyLevel)(value)}
                        className={`h-9 w-9 rounded-full border text-sm font-semibold ${
                          value <= energyLevel
                            ? "border-emerald-500 bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200"
                            : "border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400"
                        }`}
                      >
                        {value}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Blocks</label>
                  <div className="flex flex-wrap gap-2">
                    {JOURNAL_BLOCK_LIBRARY.map((preset) => (
                      <button
                        key={preset.type}
                        type="button"
                        onClick={() => addBlock(preset.type)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700"
                      >
                        <Plus size={12} />
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  {blocks.map((block, index) => {
                    const isExpanded = !!expandedBlocks[block.id];
                    const typeLabel =
                      JOURNAL_BLOCK_LIBRARY.find((preset) => preset.type === block.type)?.label || "Block";
                    return (
                      <div key={block.id} className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                        <div className="px-3 py-2.5 flex items-center gap-2 bg-slate-50 dark:bg-slate-800/50">
                          <button
                            type="button"
                            onClick={() => toggleBlock(block.id)}
                            className="shrink-0 w-7 h-7 inline-flex items-center justify-center rounded hover:bg-slate-200/70 dark:hover:bg-slate-700"
                            aria-label={isExpanded ? "Collapse block" : "Expand block"}
                          >
                            {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                          </button>
                          <input
                            type="text"
                            value={block.heading || ""}
                            onChange={(e) => updateBlockHeading(block.id, e.target.value)}
                            placeholder="Heading"
                            aria-label="Block heading"
                            className="min-w-0 flex-1 bg-transparent border-0 p-0 font-medium text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-0"
                          />
                          {!isExpanded ? (
                            <span className="text-xs text-slate-500 dark:text-slate-400 shrink-0">{typeLabel}</span>
                          ) : null}
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => moveBlock(block.id, "up")}
                              disabled={index === 0}
                              className="px-2 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs disabled:opacity-50"
                              aria-label="Move block up"
                            >
                              ↑
                            </button>
                            <button
                              type="button"
                              onClick={() => moveBlock(block.id, "down")}
                              disabled={index === blocks.length - 1}
                              className="px-2 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs disabled:opacity-50"
                              aria-label="Move block down"
                            >
                              ↓
                            </button>
                            <button
                              type="button"
                              onClick={() => removeBlock(block.id)}
                              disabled={blocks.length <= 1}
                              title={blocks.length <= 1 ? "A journal needs at least one block" : "Remove block"}
                              className="px-2 py-1.5 rounded-lg border border-red-300 text-red-700 dark:border-red-800 dark:text-red-300 text-xs disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                        {isExpanded ? (
                          <div className="p-3">
                            {block.type === "text" ? (
                              <textarea
                                value={block.text || ""}
                                onChange={(e) => updateTextBlock(block.id, e.target.value)}
                                placeholder="Write text..."
                                rows={5}
                                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 resize-y leading-relaxed"
                              />
                            ) : (
                              <div className="space-y-2">
                                {(block.items || []).map((item, itemIndex) => (
                                  <div key={item.id} className="flex items-center gap-2">
                                    {block.type === "todo" ? (
                                      <button
                                        type="button"
                                        onClick={() => toggleTodoItem(block.id, item.id)}
                                        className={`h-5 w-5 rounded border ${
                                          item.checked
                                            ? "bg-indigo-600 border-indigo-600"
                                            : "border-slate-300 dark:border-slate-600"
                                        }`}
                                      />
                                    ) : (
                                      <div className="w-5 text-xs text-slate-500 text-center">{itemIndex + 1}.</div>
                                    )}
                                    <input
                                      type="text"
                                      value={item.text || ""}
                                      onChange={(e) => updateListItem(block.id, item.id, e.target.value)}
                                      placeholder={block.type === "todo" ? "To-do item" : "Numbered item"}
                                      className="flex-1 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => removeListItem(block.id, item.id)}
                                      className="px-2 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-xs"
                                    >
                                      ✕
                                    </button>
                                  </div>
                                ))}
                                <button
                                  type="button"
                                  onClick={() => addListItem(block.id)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700"
                                >
                                  <Plus size={12} />
                                  Add item
                                </button>
                              </div>
                            )}
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
              <div>
                {selectedId && selectedId !== "__new__" ? (
                  <button
                    type="button"
                    onClick={requestDelete}
                    disabled={deleting || saving}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-red-200 text-red-700 hover:bg-red-50 disabled:opacity-60 dark:border-red-900/50 dark:text-red-300 dark:hover:bg-red-900/20"
                  >
                    {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                    Delete
                  </button>
                ) : null}
              </div>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving || loading || !user}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-60"
              >
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                Save journal
              </button>
            </div>
          </motion.aside>

          {templateDialogOpen && (
            <div className="fixed inset-0 z-[80] flex items-center justify-center">
              <div className="absolute inset-0 bg-black/40" onClick={() => setTemplateDialogOpen(false)} />
              <div className="relative w-full max-w-md mx-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg p-4">
                <div className="text-lg font-semibold mb-2 text-slate-900 dark:text-slate-100">Save template</div>
                <div className="text-sm text-slate-600 dark:text-slate-300 mb-3">
                  Save the current block structure as a private template for future journals.
                </div>
                <input
                  type="text"
                  value={templateNameInput}
                  onChange={(e) => setTemplateNameInput(e.target.value)}
                  placeholder="Template name"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 mb-3"
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setTemplateDialogOpen(false)}
                    className="px-3 py-2 rounded bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={saveCurrentAsTemplate}
                    className="px-3 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-500"
                  >
                    Save template
                  </button>
                </div>
              </div>
            </div>
          )}

          {emptySaveOpen && (
            <div className="fixed inset-0 z-[80] flex items-center justify-center">
              <div className="absolute inset-0 bg-black/40" onClick={() => setEmptySaveOpen(false)} />
              <div className="relative w-full max-w-md mx-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg p-4">
                <div className="text-lg font-semibold mb-2 text-slate-900 dark:text-slate-100">Add a block first</div>
                <div className="text-sm text-slate-600 dark:text-slate-300 mb-4">
                  Please add at least one block before saving your journal.
                </div>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setEmptySaveOpen(false)}
                    className="px-3 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-500"
                  >
                    OK
                  </button>
                </div>
              </div>
            </div>
          )}

          {deleteConfirmOpen && (
            <div className="fixed inset-0 z-[80] flex items-center justify-center">
              <div className="absolute inset-0 bg-black/40" onClick={() => !deleting && setDeleteConfirmOpen(false)} />
              <div className="relative w-full max-w-md mx-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg p-4">
                <div className="text-lg font-semibold mb-2 text-slate-900 dark:text-slate-100">Delete journal?</div>
                <div className="text-sm text-slate-600 dark:text-slate-300 mb-4">
                  Delete this journal entry? This cannot be undone.
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setDeleteConfirmOpen(false)}
                    disabled={deleting}
                    className="px-3 py-2 rounded bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 disabled:opacity-60"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={confirmDelete}
                    disabled={deleting}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded bg-red-600 text-white hover:bg-red-500 disabled:opacity-60"
                  >
                    {deleting ? <Loader2 size={14} className="animate-spin" /> : null}
                    Delete
                  </button>
                </div>
              </div>
            </div>
          )}

          {discardConfirmOpen && (
            <div className="fixed inset-0 z-[80] flex items-center justify-center">
              <div className="absolute inset-0 bg-black/40" onClick={() => setDiscardConfirmOpen(false)} />
              <div className="relative w-full max-w-md mx-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg p-4">
                <div className="text-lg font-semibold mb-2 text-slate-900 dark:text-slate-100">Discard changes?</div>
                <div className="text-sm text-slate-600 dark:text-slate-300 mb-4">
                  You have unsaved changes in this journal. Closing now will discard them.
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setDiscardConfirmOpen(false)}
                    className="px-3 py-2 rounded bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                  >
                    Keep editing
                  </button>
                  <button
                    type="button"
                    onClick={confirmDiscard}
                    className="px-3 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-500"
                  >
                    Discard changes
                  </button>
                </div>
              </div>
            </div>
          )}

          {applyTemplateWarningOpen && (
            <div className="fixed inset-0 z-[80] flex items-center justify-center">
              <div className="absolute inset-0 bg-black/40" onClick={() => setApplyTemplateWarningOpen(false)} />
              <div className="relative w-full max-w-md mx-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg p-4">
                <div className="text-lg font-semibold mb-2 text-slate-900 dark:text-slate-100">Apply template?</div>
                <div className="text-sm text-slate-600 dark:text-slate-300 mb-3">
                  Applying a template will replace the current blocks in this journal.
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setApplyTemplateWarningOpen(false);
                      setApplyingTemplateId(null);
                    }}
                    className="px-3 py-2 rounded bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                  >
                    Keep current
                  </button>
                  <button
                    type="button"
                    onClick={() => applyTemplate(applyingTemplateId)}
                    className="px-3 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-500"
                  >
                    Apply template
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </AnimatePresence>
  );
}
