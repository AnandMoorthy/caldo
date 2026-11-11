import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Calendar, Loader2, Save, Trash2, X } from "lucide-react";
import { JOURNAL_TEMPLATES, getJournalTemplateById } from "../utils/journalTemplates";
import { keyFor } from "../utils/date";

const MOOD_OPTIONS = [
  { id: "happy", label: "Happy", emoji: "😊" },
  { id: "calm", label: "Calm", emoji: "😌" },
  { id: "grateful", label: "Grateful", emoji: "😍" },
  { id: "tired", label: "Tired", emoji: "😴" },
  { id: "anxious", label: "Anxious", emoji: "😰" },
  { id: "frustrated", label: "Frustrated", emoji: "😤" },
];

export default function JournalDrawer({
  open,
  onClose,
  repo,
  user,
  journalId = null,
  initialTemplateId = "reflection",
  onJournalsChanged,
}) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [selectedId, setSelectedId] = useState(journalId);
  const [templateId, setTemplateId] = useState(initialTemplateId);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [mood, setMood] = useState("");
  const [energyLevel, setEnergyLevel] = useState(3);
  const [dateKey, setDateKey] = useState(() => keyFor(new Date()));
  const [hasChanges, setHasChanges] = useState(false);

  const selectedTemplate = useMemo(() => getJournalTemplateById(templateId), [templateId]);

  useEffect(() => {
    if (!open || !repo || !user) return;
    setSelectedId(journalId || "__new__");
    let mounted = true;

    async function loadJournal() {
      setLoading(true);
      try {
        if (!journalId || journalId === "__new__") {
          const template = getJournalTemplateById(initialTemplateId);
          if (!mounted) return;
          setTemplateId(template.id);
          setTitle(template.defaultTitle);
          setContent(template.prompt);
          setMood("");
          setEnergyLevel(3);
          setDateKey(keyFor(new Date()));
          setHasChanges(false);
          return;
        }

        const record = await repo.getJournal(journalId);
        if (!mounted) return;
        const template = getJournalTemplateById(record?.templateId || initialTemplateId);
        setTemplateId(template.id);
        setTitle(record?.title || template.defaultTitle);
        setContent(record?.content || "");
        setMood(record?.mood || "");
        setEnergyLevel(Number(record?.energyLevel) || 3);
        setDateKey(record?.dateKey || keyFor(new Date()));
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
  }, [open, repo, user, journalId, initialTemplateId]);

  function markChanged(setter) {
    return (value) => {
      setHasChanges(true);
      setter(value);
    };
  }

  function applyTemplate(nextTemplateId) {
    const template = getJournalTemplateById(nextTemplateId);
    setTemplateId(template.id);
    if (!title.trim()) setTitle(template.defaultTitle);
    if (!content.trim() || window.confirm("Replace current content with this template prompt?")) {
      setContent(template.prompt);
    }
    setHasChanges(true);
  }

  async function handleSave() {
    if (!repo || !user) return;
    if (!content.trim()) {
      alert("Please add a few lines before saving your journal.");
      return;
    }

    const payload = {
      templateId: selectedTemplate.id,
      templateName: selectedTemplate.name,
      title: (title || selectedTemplate.defaultTitle).trim(),
      content: String(content || ""),
      mood: mood || null,
      energyLevel: Number(energyLevel) || 3,
      dateKey: dateKey || keyFor(new Date()),
    };

    setSaving(true);
    try {
      if (!selectedId || selectedId === "__new__") {
        await repo.createJournal(payload);
      } else {
        await repo.updateJournal(selectedId, payload);
      }
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

  async function handleDelete() {
    if (!repo || !selectedId || selectedId === "__new__") return;
    if (!window.confirm("Delete this journal entry? This cannot be undone.")) return;
    setDeleting(true);
    try {
      await repo.deleteJournal(selectedId);
      try {
        onJournalsChanged && (await onJournalsChanged());
      } catch {}
      setHasChanges(false);
      onClose && onClose();
    } catch (error) {
      console.error("Failed to delete journal", error);
      alert("Failed to delete journal. Please try again.");
    } finally {
      setDeleting(false);
    }
  }

  function handleClose() {
    if (hasChanges && !window.confirm("Discard unsaved journal changes?")) return;
    onClose && onClose();
  }

  return (
    <AnimatePresence>
      {open && (
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
              onClick={handleClose}
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
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Template</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {JOURNAL_TEMPLATES.map((template) => (
                    <button
                      key={template.id}
                      type="button"
                      onClick={() => applyTemplate(template.id)}
                      className={`text-left border rounded-xl p-3 transition-colors ${
                        templateId === template.id
                          ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30"
                          : "border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                      }`}
                    >
                      <div className="font-medium text-slate-900 dark:text-slate-100">{template.name}</div>
                      <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">{template.description}</div>
                    </button>
                  ))}
                </div>
              </div>

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
                    placeholder={selectedTemplate.defaultTitle}
                    className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
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

              <div>
                <div className="flex items-center justify-between">
                  <label className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Journal details</label>
                  <button
                    type="button"
                    onClick={() => {
                      setContent(selectedTemplate.prompt);
                      setHasChanges(true);
                    }}
                    className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    Re-apply prompt
                  </button>
                </div>
                <textarea
                  value={content}
                  onChange={(e) => markChanged(setContent)(e.target.value)}
                  placeholder="Write your journal entry..."
                  rows={14}
                  className="mt-1 w-full px-3 py-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 resize-y leading-relaxed"
                />
              </div>
            </div>
          )}

          <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
            <div>
              {selectedId && selectedId !== "__new__" ? (
                <button
                  type="button"
                  onClick={handleDelete}
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
      )}
    </AnimatePresence>
  );
}
