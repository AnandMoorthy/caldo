import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit2, Trash2, X, Save } from 'lucide-react';
import { generateId } from '../utils/uid';

export default function CategoryManager({ 
  categories = [], 
  onCategoriesChange, 
  isOpen, 
  onClose 
}) {
  const [editingCategory, setEditingCategory] = useState(null);
  const [newCategory, setNewCategory] = useState({ name: '' });
  const [showAddForm, setShowAddForm] = useState(false);

  const handleAddCategory = () => {
    if (!newCategory.name.trim()) return;
    
    const category = {
      id: generateId(),
      name: newCategory.name.trim(),
    };
    
    onCategoriesChange([...categories, category]);
    setNewCategory({ name: '' });
    setShowAddForm(false);
  };

  const handleEditCategory = (categoryId) => {
    const category = categories.find(c => c.id === categoryId);
    if (category) {
      setEditingCategory({ ...category });
    }
  };

  const handleSaveEdit = () => {
    if (!editingCategory.name.trim()) return;
    
    const updatedCategories = categories.map(cat => 
      cat.id === editingCategory.id ? editingCategory : cat
    );
    
    onCategoriesChange(updatedCategories);
    setEditingCategory(null);
  };

  const handleDeleteCategory = (categoryId) => {
    if (window.confirm('Are you sure you want to delete this category? Moments using this category will have their category removed.')) {
      const updatedCategories = categories.filter(cat => cat.id !== categoryId);
      onCategoriesChange(updatedCategories);
    }
  };

  const handleCancelEdit = () => {
    setEditingCategory(null);
  };

  const handleCancelAdd = () => {
    setNewCategory({ name: '' });
    setShowAddForm(false);
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white dark:bg-slate-800 rounded-lg p-6 max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
            Manage Categories
          </h2>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          {/* Existing Categories */}
          {categories.map((category) => (
            <div key={category.id} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
              {editingCategory?.id === category.id ? (
                <div className="flex-1 flex items-center gap-2">
                  <input
                    type="text"
                    value={editingCategory.name}
                    onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                    placeholder="Category name"
                    className="flex-1 px-2 py-1 text-sm border border-slate-300 dark:border-slate-600 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-600 dark:text-slate-100"
                  />
                  <button
                    onClick={handleSaveEdit}
                    className="p-1 text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300"
                    data-tip="Save"
                    data-tip-pos="top"
                  >
                    <Save size={16} />
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                    data-tip="Cancel"
                    data-tip-pos="top"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <>
                  <span className="flex-1 text-slate-900 dark:text-slate-100">{category.name}</span>
                  <button
                    onClick={() => handleEditCategory(category.id)}
                    className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                    data-tip="Edit"
                    data-tip-pos="top"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => handleDeleteCategory(category.id)}
                    className="p-1 text-red-400 hover:text-red-600 dark:hover:text-red-300"
                    data-tip="Delete"
                    data-tip-pos="top"
                  >
                    <Trash2 size={16} />
                  </button>
                </>
              )}
            </div>
          ))}

          {/* Add New Category */}
          {showAddForm ? (
            <div className="p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newCategory.name}
                  onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                  placeholder="Category name"
                  className="flex-1 px-2 py-1 text-sm border border-slate-300 dark:border-slate-600 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-600 dark:text-slate-100"
                />
                <button
                  onClick={handleAddCategory}
                  className="p-1 text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300"
                  title="Add"
                >
                  <Save size={16} />
                </button>
                <button
                  onClick={handleCancelAdd}
                  className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                  title="Cancel"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowAddForm(true)}
              className="w-full p-3 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg text-slate-600 dark:text-slate-400 hover:border-slate-400 dark:hover:border-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors flex items-center justify-center gap-2"
            >
              <Plus size={16} />
              Add New Category
            </button>
          )}
        </div>

        <div className="mt-6 text-xs text-slate-500 dark:text-slate-400">
          <p>• Categories help organize your moments</p>
          <p>• Deleting a category will remove it from existing moments</p>
          <p>• You can edit category names and emojis anytime</p>
        </div>
      </motion.div>
    </motion.div>
  );
}
