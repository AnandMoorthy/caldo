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
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-slate-900 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600 p-6 text-center hover:border-slate-400 dark:hover:border-slate-500 transition-colors cursor-pointer"
        onClick={() => setIsExpanded(true)}
      >
        <div className="flex items-center justify-center gap-2 text-slate-500 dark:text-slate-400">
          <Plus size={20} />
          <span className="text-sm font-medium">Add a moment</span>
        </div>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
          Share what's on your mind
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm"
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300">
            What's on your mind?
          </h3>
          <button
            onClick={handleCancel}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
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
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-slate-100 resize-none"
            rows={3}
            maxLength={maxLength}
            autoFocus
          />
          <div className="flex justify-between items-center mt-1">
            <div className="text-xs text-slate-500 dark:text-slate-400">
              {content.length}/{maxLength}
            </div>
            <div className="text-xs text-slate-400 dark:text-slate-500">
              Cmd+Enter to save, Esc to cancel
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              How are you feeling? *
            </label>
            <div className="grid grid-cols-5 gap-1 sm:gap-2">
              {Object.entries(MOOD_EMOJIS).map(([moodKey, emoji]) => (
                <button
                  key={moodKey}
                  onClick={() => setMood(moodKey)}
                  className={`p-1.5 sm:p-2 rounded-lg border-2 transition-colors ${
                    mood === moodKey
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                      : 'border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500'
                  }`}
                  data-tip={MOOD_NAMES[moodKey]}
                  data-tip-pos="top"
                >
                  <span className="text-lg">{emoji}</span>
                </button>
              ))}
            </div>
            {mood && (
              <div className="mt-2 text-xs text-slate-600 dark:text-slate-400">
                {MOOD_EMOJIS[mood]} {MOOD_NAMES[mood]}
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Category
              </label>
              <button
                type="button"
                onClick={() => setShowCategoryManager(!showCategoryManager)}
                className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
              >
                {showCategoryManager ? 'Hide' : 'Manage'} Categories
              </button>
            </div>
            
            {showCategoryManager ? (
              <div className="space-y-3 p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                {/* Add new category */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="New category name"
                    className="flex-1 px-2 py-1 text-sm border border-slate-300 dark:border-slate-600 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-600 dark:text-slate-100"
                    onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
                  />
                  <button
                    onClick={handleAddCategory}
                    className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Add
                  </button>
                </div>
                
                {/* Existing categories */}
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {categories.map((cat) => (
                    <div key={cat.id} className="flex items-center gap-2">
                      {editingCategory?.id === cat.id ? (
                        <div className="flex-1 flex gap-2">
                          <input
                            type="text"
                            value={editingCategory.name}
                            onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                            className="flex-1 px-2 py-1 text-sm border border-slate-300 dark:border-slate-600 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-600 dark:text-slate-100"
                            onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit()}
                          />
                          <button
                            onClick={handleSaveEdit}
                            className="p-1 text-green-600 hover:text-green-700"
                            data-tip="Save"
                            data-tip-pos="top"
                          >
                            <Save size={14} />
                          </button>
                          <button
                            onClick={() => setEditingCategory(null)}
                            className="p-1 text-slate-400 hover:text-slate-600"
                            data-tip="Cancel"
                            data-tip-pos="top"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <>
                          <span className="flex-1 text-sm text-slate-900 dark:text-slate-100">{cat.name}</span>
                          <button
                            onClick={() => handleEditCategory(cat.id)}
                            className="p-1 text-slate-400 hover:text-slate-600"
                            data-tip="Edit"
                            data-tip-pos="top"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => handleDeleteCategory(cat.id)}
                            className="p-1 text-red-400 hover:text-red-600"
                            data-tip="Delete"
                            data-tip-pos="top"
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
                  className="w-full bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 p-2 rounded-lg inline-flex items-center justify-between"
                  aria-label="Select category"
                >
                  <span className="text-sm">
                    {category ? categories.find(cat => cat.id === category)?.name || 'Select category' : 'No category'}
                  </span>
                  <ChevronDown size={16} className={`transition-transform ${showCategoryDropdown ? 'rotate-180' : ''}`} />
                </button>
                {showCategoryDropdown && (
                  <div className="absolute right-0 z-10 mt-2 w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg p-1">
                    <button
                      type="button"
                      onClick={() => { setCategory(''); setShowCategoryDropdown(false); }}
                      className={`w-full flex items-center justify-start gap-2 p-2 rounded ${!category ? 'bg-slate-100 dark:bg-slate-800' : 'hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                      aria-label="No category"
                    >
                      <span className="text-sm">No category</span>
                    </button>
                    {categories.map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => { setCategory(cat.id); setShowCategoryDropdown(false); }}
                        className={`w-full flex items-center justify-start gap-2 p-2 rounded ${category === cat.id ? 'bg-slate-100 dark:bg-slate-800' : 'hover:bg-slate-50 dark:hover:bg-slate-800'}`}
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

        <div className="flex justify-end gap-2">
          <button
            onClick={handleCancel}
            className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!content.trim() || !mood}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-slate-600 rounded-lg transition-colors"
          >
            Save Moment
          </button>
        </div>
      </div>
    </motion.div>
  );
}
