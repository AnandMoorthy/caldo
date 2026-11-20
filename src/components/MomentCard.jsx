import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Edit2, Trash2, Clock, Tag, ChevronDown } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

const MOOD_EMOJIS = {
  happy: '😊',
  sad: '😢',
  tired: '😴',
  frustrated: '😤',
  excited: '🎉',
  calm: '😌',
  anxious: '😰',
  motivated: '💪',
  thoughtful: '🤔',
  grateful: '😍',
};

const MOOD_NAMES = {
  happy: 'Happy',
  sad: 'Sad',
  tired: 'Tired',
  frustrated: 'Frustrated',
  excited: 'Excited',
  calm: 'Calm',
  anxious: 'Anxious',
  motivated: 'Motivated',
  thoughtful: 'Thoughtful',
  grateful: 'Grateful',
};

const MOMENT_CARD_STYLE = 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800';

function MoodPicker({ value, onChange }) {
  return (
    <div className="grid w-full grid-cols-5 gap-1.5">
      {Object.entries(MOOD_EMOJIS).map(([mood, emoji]) => (
        <button
          key={mood}
          type="button"
          onClick={() => onChange(mood)}
          aria-label={MOOD_NAMES[mood]}
          aria-pressed={value === mood}
          className={`h-9 w-full inline-flex items-center justify-center rounded-lg border transition-colors touch-manipulation ${
            value === mood
              ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30'
              : 'border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500'
          }`}
        >
          <span className="text-lg leading-none select-none" style={{ lineHeight: 1 }}>{emoji}</span>
        </button>
      ))}
    </div>
  );
}

export default function MomentCard({
  moment,
  onEdit,
  onDelete,
  categories = [],
  isEditing = false,
  onSaveEdit,
  onCancelEdit,
}) {
  const [editContent, setEditContent] = useState(moment.content || '');
  const [editMood, setEditMood] = useState(moment.mood || '');
  const [editCategory, setEditCategory] = useState(moment.category || '');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showEditCategoryDropdown, setShowEditCategoryDropdown] = useState(false);
  const editCategoryDropdownRef = useRef(null);

  useEffect(() => {
    if (!isEditing) return;
    setEditContent(moment.content || '');
    setEditMood(moment.mood || '');
    setEditCategory(moment.category || '');
  }, [isEditing, moment.content, moment.mood, moment.category]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (editCategoryDropdownRef.current && !editCategoryDropdownRef.current.contains(event.target)) {
        setShowEditCategoryDropdown(false);
      }
    };

    if (showEditCategoryDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showEditCategoryDropdown]);

  const handleSave = () => {
    if (editContent.trim() && editMood) {
      onSaveEdit({
        content: editContent.trim(),
        mood: editMood,
        category: editCategory,
      });
    }
  };

  const handleCancel = () => {
    setEditContent(moment.content || '');
    setEditMood(moment.mood || '');
    setEditCategory(moment.category || '');
    onCancelEdit();
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return {
      absolute: format(date, "MMM d, yyyy 'at' h:mm a"),
      relative: formatDistanceToNow(date, { addSuffix: true }),
    };
  };

  const timeInfo = formatTime(moment.createdAt);
  const categoryInfo = categories.find((cat) => cat.id === moment.category);

  if (isEditing) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-3 sm:p-4 shadow-sm"
      >
        <div className="space-y-2.5">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              What's on your mind?
            </label>
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              placeholder="Share your moment..."
              className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-slate-800 dark:text-slate-100 resize-none"
              rows={3}
              maxLength={280}
            />
            <div className="text-right text-xs text-slate-500 dark:text-slate-400 mt-1">
              {editContent.length}/280
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Mood
            </label>
            <MoodPicker value={editMood} onChange={setEditMood} />
            {editMood ? (
              <div className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                {MOOD_EMOJIS[editMood]} {MOOD_NAMES[editMood]}
              </div>
            ) : null}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Category
            </label>
            <div className="relative" ref={editCategoryDropdownRef}>
              <button
                type="button"
                onClick={() => setShowEditCategoryDropdown(!showEditCategoryDropdown)}
                className="w-full bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-3 py-2 rounded-lg inline-flex items-center justify-between"
                aria-label="Select category"
              >
                <span className="text-sm truncate">
                  {editCategory
                    ? categories.find((cat) => cat.id === editCategory)?.name || 'Select category'
                    : 'No category'}
                </span>
                <ChevronDown
                  size={16}
                  className={`shrink-0 transition-transform ${showEditCategoryDropdown ? 'rotate-180' : ''}`}
                />
              </button>
              {showEditCategoryDropdown && (
                <div className="absolute left-0 right-0 z-10 mt-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg p-1 max-h-48 overflow-y-auto">
                  <button
                    type="button"
                    onClick={() => {
                      setEditCategory('');
                      setShowEditCategoryDropdown(false);
                    }}
                    className={`w-full flex items-center justify-start gap-2 px-2.5 py-2 rounded ${
                      !editCategory ? 'bg-slate-100 dark:bg-slate-800' : 'hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                    aria-label="No category"
                  >
                    <span className="text-sm">No category</span>
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        setEditCategory(cat.id);
                        setShowEditCategoryDropdown(false);
                      }}
                      className={`w-full flex items-center justify-start gap-2 px-2.5 py-2 rounded ${
                        editCategory === cat.id
                          ? 'bg-slate-100 dark:bg-slate-800'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                      aria-label={cat.name}
                    >
                      <span className="text-sm">{cat.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={handleCancel}
              className="h-9 px-3 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 rounded-lg touch-manipulation"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={!editContent.trim() || !editMood}
              className="h-9 px-3 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-300 dark:disabled:bg-slate-600 rounded-lg transition-colors touch-manipulation"
            >
              Save
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      id={`moment-${moment.id}`}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={`group rounded-xl border p-3 sm:p-4 shadow-sm transition-all duration-300 ${MOMENT_CARD_STYLE}`}
    >
      <div className="mb-2">
        <div className="text-slate-800 dark:text-slate-200 whitespace-pre-wrap text-sm sm:text-base leading-snug">
          {moment.content}
        </div>
      </div>

      <div className="flex items-center justify-between gap-1.5">
        <div className="flex items-center gap-1.5 sm:gap-2 text-xs text-slate-500 dark:text-slate-400 min-w-0 flex-wrap">
          <span className="inline-flex h-4 w-4 items-center justify-center text-[15px] leading-none opacity-80 shrink-0">
            {MOOD_EMOJIS[moment.mood] || '😊'}
          </span>

          <div className="inline-flex items-center gap-1 shrink-0 leading-none">
            <Clock size={12} className="shrink-0" />
            <span title={timeInfo.absolute}>{timeInfo.relative}</span>
          </div>

          {categoryInfo && (
            <div className="inline-flex items-center gap-1 min-w-0 leading-none">
              <Tag size={12} className="shrink-0" />
              <span className="truncate">{categoryInfo.name}</span>
            </div>
          )}

          {moment.editCount >= 1 && (
            <div className="inline-flex items-center gap-1 shrink-0 leading-none">
              <span className="opacity-60">•</span>
              <span className="opacity-60">edited</span>
            </div>
          )}
        </div>

        <div className="flex items-center shrink-0 opacity-100 sm:opacity-60 sm:group-hover:opacity-100 transition-opacity">
          {moment.editCount < 1 && (
            <button
              type="button"
              onClick={() => onEdit(moment.id)}
              className="h-8 w-8 inline-flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors touch-manipulation"
              data-tip="Edit moment (one-time only)"
              data-tip-pos="top"
              aria-label="Edit moment"
            >
              <Edit2 size={14} />
            </button>
          )}
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            className="h-8 w-8 inline-flex items-center justify-center text-slate-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors touch-manipulation"
            data-tip="Delete moment"
            data-tip-pos="top"
            aria-label="Delete moment"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {showDeleteConfirm && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setShowDeleteConfirm(false)}
        >
          <div
            className="bg-white dark:bg-slate-800 rounded-lg p-4 sm:p-5 max-w-sm mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-1.5">
              Delete Moment
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
              Are you sure you want to delete this moment? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="h-9 px-3 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onDelete(moment.id);
                  setShowDeleteConfirm(false);
                }}
                className="h-9 px-3 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
