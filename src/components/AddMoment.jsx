import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, X, Edit2, Trash2, Save, ChevronDown } from 'lucide-react';
import { generateId } from '../utils/uid';

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

export default function AddMoment({ 
  onSave, 
  onCancel, 
  categories = [],
  onCategoriesChange,
  maxLength = 280 
}) {
  const [content, setContent] = useState('');
  const [mood, setMood] = useState('');
  const [category, setCategory] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const categoryDropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target)) {
        setShowCategoryDropdown(false);
      }
    };

    if (showCategoryDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showCategoryDropdown]);

  const handleSave = () => {
    if (content.trim() && mood) {
      onSave({
        content: content.trim(),
        mood,
        category: category || undefined,
      });
      setContent('');
      setMood('');
      setCategory('');
      setIsExpanded(false);
    }
  };

  const handleCancel = () => {
    setContent('');
    setMood('');
    setCategory('');
    setIsExpanded(false);
    onCancel();
  };

  const handleAddCategory = () => {
    if (!newCategoryName.trim()) return;
    
    const newCategory = {
      id: generateId(),
      name: newCategoryName.trim(),
    };
    
    onCategoriesChange?.([...categories, newCategory]);
    setNewCategoryName('');
    setShowCategoryManager(false);
  };

  const handleEditCategory = (categoryId) => {
    const cat = categories.find(c => c.id === categoryId);
    if (cat) {
      setEditingCategory({ ...cat });
    }
  };

  const handleSaveEdit = () => {
    if (!editingCategory.name.trim()) return;
    
    const updatedCategories = categories.map(cat => 
      cat.id === editingCategory.id ? editingCategory : cat
    );
    
    onCategoriesChange?.(updatedCategories);
    setEditingCategory(null);
  };

  const handleDeleteCategory = (categoryId) => {
    if (window.confirm('Are you sure you want to delete this category? Moments using this category will have their category removed.')) {
      const updatedCategories = categories.filter(cat => cat.id !== categoryId);
      onCategoriesChange?.(updatedCategories);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  if (!isExpanded) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-slate-900 rounded-xl border border-dashed border-slate-300 dark:border-slate-600 px-3 py-2.5 text-center hover:border-slate-400 dark:hover:border-slate-500 transition-colors cursor-pointer touch-manipulation"
        onClick={() => setIsExpanded(true)}
      >
        <div className="flex items-center justify-center gap-1.5 text-slate-500 dark:text-slate-400">
          <Plus size={16} />
          <span className="text-sm font-medium">Add a moment</span>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-2.5 sm:p-3.5 shadow-sm"
    >
      <div className="space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300">
            What's on your mind?
          </h3>
          <button
            type="button"
            onClick={handleCancel}
            className="h-8 w-8 inline-flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors touch-manipulation"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        <div>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Share your moment..."
            className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-slate-800 dark:text-slate-100 resize-none"
            rows={3}
            maxLength={maxLength}
            autoFocus
          />
          <div className="flex justify-between items-center gap-2 mt-1">
            <div className="text-xs text-slate-500 dark:text-slate-400">
              {content.length}/{maxLength}
            </div>
            <div className="hidden sm:block text-xs text-slate-400 dark:text-slate-500">
              Cmd+Enter to save, Esc to cancel
            </div>
          </div>
        </div>

        <div className="space-y-2.5">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              How are you feeling? *
            </label>
            <div className="grid w-full grid-cols-5 gap-1.5">
              {Object.entries(MOOD_EMOJIS).map(([moodKey, emoji]) => (
                <button
                  key={moodKey}
                  type="button"
                  onClick={() => setMood(moodKey)}
                  aria-label={MOOD_NAMES[moodKey]}
                  aria-pressed={mood === moodKey}
                  className={`h-9 w-full inline-flex items-center justify-center rounded-lg border transition-colors touch-manipulation ${
                    mood === moodKey
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30'
                      : 'border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500'
                  }`}
                  data-tip={MOOD_NAMES[moodKey]}
                  data-tip-pos="top"
                >
                  <span className="text-lg leading-none select-none" style={{ lineHeight: 1 }}>{emoji}</span>
                </button>
              ))}
            </div>
            {mood && (
              <div className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                {MOOD_EMOJIS[mood]} {MOOD_NAMES[mood]}
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between gap-2 mb-1">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Category
              </label>
              <button
                type="button"
                onClick={() => setShowCategoryManager(!showCategoryManager)}
                className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300"
              >
                {showCategoryManager ? 'Hide' : 'Manage'}
              </button>
            </div>
            
            {showCategoryManager ? (
              <div className="space-y-2.5 p-2.5 sm:p-3 bg-slate-50 dark:bg-slate-800/80 rounded-lg">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="New category name"
                    className="flex-1 min-w-0 px-2.5 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-slate-700 dark:text-slate-100"
                    onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
                  />
                  <button
                    type="button"
                    onClick={handleAddCategory}
                    className="shrink-0 h-9 px-3 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 touch-manipulation"
                  >
                    Add
                  </button>
                </div>

                <div className="space-y-1.5 max-h-32 overflow-y-auto">
                  {categories.map((cat) => (
                    <div key={cat.id} className="flex items-center gap-1.5">
                      {editingCategory?.id === cat.id ? (
                        <div className="flex-1 flex gap-1.5 min-w-0">
                          <input
                            type="text"
                            value={editingCategory.name}
                            onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                            className="flex-1 min-w-0 px-2.5 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-slate-700 dark:text-slate-100"
                            onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit()}
                          />
                          <button
                            type="button"
                            onClick={handleSaveEdit}
                            className="h-8 w-8 inline-flex items-center justify-center text-green-600 hover:text-green-700"
                            data-tip="Save"
                            data-tip-pos="top"
                            aria-label="Save category"
                          >
                            <Save size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingCategory(null)}
                            className="h-8 w-8 inline-flex items-center justify-center text-slate-400 hover:text-slate-600"
                            data-tip="Cancel"
                            data-tip-pos="top"
                            aria-label="Cancel edit"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <>
                          <span className="flex-1 min-w-0 truncate text-sm text-slate-900 dark:text-slate-100">{cat.name}</span>
                          <button
                            type="button"
                            onClick={() => handleEditCategory(cat.id)}
                            className="h-8 w-8 inline-flex items-center justify-center text-slate-400 hover:text-slate-600"
                            data-tip="Edit"
                            data-tip-pos="top"
                            aria-label={`Edit ${cat.name}`}
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteCategory(cat.id)}
                            className="h-8 w-8 inline-flex items-center justify-center text-red-400 hover:text-red-600"
                            data-tip="Delete"
                            data-tip-pos="top"
                            aria-label={`Delete ${cat.name}`}
                          >
                            <Trash2 size={14} />
                          </button>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="relative" ref={categoryDropdownRef}>
                <button
                  type="button"
                  onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                  className="w-full bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-3 py-2 rounded-lg inline-flex items-center justify-between"
                  aria-label="Select category"
                >
                  <span className="text-sm truncate">
                    {category ? categories.find((cat) => cat.id === category)?.name || 'Select category' : 'No category'}
                  </span>
                  <ChevronDown size={16} className={`shrink-0 transition-transform ${showCategoryDropdown ? 'rotate-180' : ''}`} />
                </button>
                {showCategoryDropdown && (
                  <div className="absolute left-0 right-0 z-10 mt-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg p-1 max-h-48 overflow-y-auto">
                    <button
                      type="button"
                      onClick={() => { setCategory(''); setShowCategoryDropdown(false); }}
                      className={`w-full flex items-center justify-start gap-2 px-2.5 py-2 rounded ${!category ? 'bg-slate-100 dark:bg-slate-800' : 'hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                      aria-label="No category"
                    >
                      <span className="text-sm">No category</span>
                    </button>
                    {categories.map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => { setCategory(cat.id); setShowCategoryDropdown(false); }}
                        className={`w-full flex items-center justify-start gap-2 px-2.5 py-2 rounded ${category === cat.id ? 'bg-slate-100 dark:bg-slate-800' : 'hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                        aria-label={cat.name}
                      >
                        <span className="text-sm">{cat.name}</span>
                      </button>
                    ))}
                  </div>
                )}
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
            disabled={!content.trim() || !mood}
            className="h-9 px-3 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-300 dark:disabled:bg-slate-600 rounded-lg transition-colors touch-manipulation"
          >
            Save
          </button>
        </div>
      </div>
    </motion.div>
  );
}
