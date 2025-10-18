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

// Use consistent colors like Notes & Snippets
const MOMENT_CARD_STYLE = 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800';

export default function MomentCard({ 
  moment, 
  onEdit, 
  onDelete, 
  categories = [],
  isEditing = false,
  onSaveEdit,
  onCancelEdit 
}) {
  const [editContent, setEditContent] = useState(moment.content || '');
  const [editMood, setEditMood] = useState(moment.mood || '');
  const [editCategory, setEditCategory] = useState(moment.category || '');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showEditCategoryDropdown, setShowEditCategoryDropdown] = useState(false);
  const editCategoryDropdownRef = useRef(null);

  // Close dropdown when clicking outside
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
      absolute: format(date, 'MMM d, yyyy \'at\' h:mm a'),
      relative: formatDistanceToNow(date, { addSuffix: true })
    };
  };

  const timeInfo = formatTime(moment.createdAt);
  const categoryInfo = categories.find(cat => cat.id === moment.category);

  if (isEditing) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              What's on your mind?
            </label>
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              placeholder="Share your moment..."
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-slate-100 resize-none"
              rows={3}
              maxLength={280}
            />
            <div className="text-right text-xs text-slate-500 dark:text-slate-400 mt-1">
              {editContent.length}/280
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Mood
              </label>
              <div className="grid grid-cols-5 gap-2">
                {Object.entries(MOOD_EMOJIS).map(([mood, emoji]) => (
                  <button
                    key={mood}
                    onClick={() => setEditMood(mood)}
                    className={`p-2 rounded-lg border-2 transition-colors ${
                      editMood === mood
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                        : 'border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500'
                    }`}
                  >
                    <span className="text-lg">{emoji}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Category
              </label>
              <div className="relative" ref={editCategoryDropdownRef}>
                <button
                  type="button"
                  onClick={() => setShowEditCategoryDropdown(!showEditCategoryDropdown)}
                  className="w-full bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 p-2 rounded-lg inline-flex items-center justify-between"
                  aria-label="Select category"
                >
                  <span className="text-sm">
                    {editCategory ? categories.find(cat => cat.id === editCategory)?.name || 'Select category' : 'No category'}
                  </span>
                  <ChevronDown size={16} className={`transition-transform ${showEditCategoryDropdown ? 'rotate-180' : ''}`} />
                </button>
                {showEditCategoryDropdown && (
                  <div className="absolute right-0 z-10 mt-2 w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg p-1">
                    <button
                      type="button"
                      onClick={() => { setEditCategory(''); setShowEditCategoryDropdown(false); }}
                      className={`w-full flex items-center justify-start gap-2 p-2 rounded ${!editCategory ? 'bg-slate-100 dark:bg-slate-800' : 'hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                      aria-label="No category"
                    >
                      <span className="text-sm">No category</span>
                    </button>
                    {categories.map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => { setEditCategory(cat.id); setShowEditCategoryDropdown(false); }}
                        className={`w-full flex items-center justify-start gap-2 p-2 rounded ${editCategory === cat.id ? 'bg-slate-100 dark:bg-slate-800' : 'hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                        aria-label={cat.name}
                      >
                        <span className="text-sm">{cat.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button
              onClick={handleCancel}
              className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!editContent.trim() || !editMood}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-slate-600 rounded-lg transition-colors"
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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`group rounded-xl border p-5 shadow-sm transition-all duration-300 ${MOMENT_CARD_STYLE}`}
    >
      {/* Main content - takes center stage */}
      <div className="mb-4">
        <div className="text-slate-800 dark:text-slate-200 whitespace-pre-wrap text-base leading-relaxed">
          {moment.content}
        </div>
      </div>

      {/* Metadata and actions - subtle bottom section */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
          {/* Mood emoji - subtle */}
          <span className="text-lg opacity-70">{MOOD_EMOJIS[moment.mood] || '😊'}</span>
          
          {/* Time - subtle */}
          <div className="flex items-center gap-1">
            <Clock size={12} />
            <span title={timeInfo.absolute}>{timeInfo.relative}</span>
          </div>
          
          {/* Category - subtle */}
          {categoryInfo && (
            <div className="flex items-center gap-1">
              <Tag size={12} />
              <span>{categoryInfo.name}</span>
            </div>
          )}
          
          {/* Edit status - very subtle */}
          {moment.editCount >= 1 && (
            <div className="flex items-center gap-1">
              <span className="opacity-60">•</span>
              <span className="opacity-60">edited</span>
            </div>
          )}
        </div>
        
        {/* Action buttons - subtle */}
        <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
          {moment.editCount < 1 && (
            <button
              onClick={() => onEdit(moment.id)}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              data-tip="Edit moment (one-time only)"
              data-tip-pos="top"
            >
              <Edit2 size={14} />
            </button>
          )}
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            data-tip="Delete moment"
            data-tip-pos="top"
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
            className="bg-white dark:bg-slate-800 rounded-lg p-6 max-w-sm mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
              Delete Moment
            </h3>
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              Are you sure you want to delete this moment? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onDelete(moment.id);
                  setShowDeleteConfirm(false);
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
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
