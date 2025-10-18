import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Edit2, Trash2, Clock, Tag } from 'lucide-react';
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

const MOOD_COLORS = {
  happy: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
  sad: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
  tired: 'bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800',
  frustrated: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
  excited: 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800',
  calm: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
  anxious: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800',
  motivated: 'bg-pink-50 dark:bg-pink-900/20 border-pink-200 dark:border-pink-800',
  thoughtful: 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800',
  grateful: 'bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800',
};

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
        className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 shadow-sm"
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
              <select
                value={editCategory}
                onChange={(e) => setEditCategory(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-slate-100"
              >
                <option value="">No category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
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
      className={`rounded-xl border p-4 shadow-sm transition-all duration-300 ${
        MOOD_COLORS[moment.mood] || 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <span className="text-2xl flex-shrink-0">{MOOD_EMOJIS[moment.mood] || '😊'}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
              <Clock size={14} />
              <span title={timeInfo.absolute} className="truncate">{timeInfo.relative}</span>
            </div>
            {categoryInfo && (
              <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-500 mt-1">
                <Tag size={12} />
                <span className="truncate">{categoryInfo.name}</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-1 flex-shrink-0 ml-2">
          {moment.editCount < 1 && (
            <button
              onClick={() => onEdit(moment.id)}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              data-tip="Edit moment (one-time only)"
              data-tip-pos="top"
            >
              <Edit2 size={16} />
            </button>
          )}
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            data-tip="Delete moment"
            data-tip-pos="top"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      <div className="text-slate-800 dark:text-slate-200 whitespace-pre-wrap">
        {moment.content}
      </div>

      {moment.editCount >= 1 && (
        <div className="mt-3 text-xs text-slate-500 dark:text-slate-400 italic">
          This moment has been edited and cannot be modified further.
        </div>
      )}

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
