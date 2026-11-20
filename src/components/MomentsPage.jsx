import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Sparkles } from 'lucide-react';
import { createMomentRepository } from '../services/repositories/momentRepository';
import { generateId } from '../utils/uid';
import MomentCard from './MomentCard';
import AddMoment from './AddMoment';

export default function MomentsPage({ user, onMomentsChanged }) {
  const [moments, setMoments] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState(null);

  const momentRepoRef = useRef(null);

  // Load moments and categories
  const loadData = useCallback(async () => {
    if (!user?.uid) {
      setLoading(false);
      setMoments([]);
      setCategories([]);
      return;
    }

    // Create repository if not exists
    if (!momentRepoRef.current) {
      momentRepoRef.current = createMomentRepository(user.uid);
    }
    
    console.log('Loading moments data for user:', user.uid);
    
    try {
      setLoading(true);
      setError(null);
      
      // Load moments first (main data)
      console.log('Fetching moments...');
      const momentsData = await momentRepoRef.current.fetchMoments({ limit: 100 });
      console.log('Moments loaded:', momentsData.length);
      setMoments(momentsData);
      
      // Load categories separately (non-blocking)
      try {
        console.log('Fetching categories...');
        const categoriesData = await momentRepoRef.current.getCategories();
        console.log('Categories loaded:', categoriesData.length);
        setCategories(categoriesData);
      } catch (categoryErr) {
        console.warn('Error loading categories:', categoryErr);
        // Set default categories if loading fails
        const defaultCategories = [
          { id: 'personal', name: 'Personal' },
          { id: 'work', name: 'Work' },
          { id: 'health', name: 'Health' },
          { id: 'learning', name: 'Learning' },
          { id: 'social', name: 'Social' },
          { id: 'creative', name: 'Creative' },
        ];
        setCategories(defaultCategories);
      }
    } catch (err) {
      console.error('Error loading moments:', err);
      setError('Failed to load moments. Please try again.');
    } finally {
      console.log('Loading complete, setting loading to false');
      setLoading(false);
    }
  }, [user?.uid]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Cleanup effect
  useEffect(() => {
    return () => {
      // Reset repository when component unmounts or user changes
      momentRepoRef.current = null;
    };
  }, [user?.uid]);

  const handleSaveMoment = async (momentData) => {
    if (!user?.uid || !momentRepoRef.current) return;
    
    const newMoment = {
      id: generateId(),
      ...momentData,
      createdAt: new Date(), // Add local timestamp for immediate display
      editCount: 0,
    };
    
    // Optimistic update - add to UI immediately
    const updatedMoments = [newMoment, ...moments];
    setMoments(updatedMoments);
    onMomentsChanged?.(updatedMoments);
    
    try {
      setSaving(true);
      setError(null);
      
      // Save to Firestore in background
      await momentRepoRef.current.saveMoment(newMoment);
    } catch (err) {
      console.error('Error saving moment:', err);
      setError('Failed to save moment. Please try again.');
      
      // Remove the moment from the list if save failed
      const rollbackMoments = moments.filter(moment => moment.id !== newMoment.id);
      setMoments(rollbackMoments);
      onMomentsChanged?.(rollbackMoments);
    } finally {
      setSaving(false);
    }
  };

  const handleEditMoment = (momentId) => {
    setEditingId(momentId);
  };

  const handleSaveEdit = async (momentId, updates) => {
    if (!momentRepoRef.current) return;
    
    // Find the original moment for rollback
    const originalMoment = moments.find(m => m.id === momentId);
    if (!originalMoment) return;
    
    const updatedMoment = { 
      ...originalMoment, 
      ...updates, 
      editCount: (originalMoment.editCount || 0) + 1 
    };
    
    // Optimistic update - update UI immediately
    const updatedMoments = moments.map(moment => 
      moment.id === momentId ? updatedMoment : moment
    );
    setMoments(updatedMoments);
    onMomentsChanged?.(updatedMoments);
    setEditingId(null);
    
    try {
      setSaving(true);
      setError(null);
      
      // Save to Firestore in background
      await momentRepoRef.current.updateMoment(momentId, updates);
    } catch (err) {
      console.error('Error updating moment:', err);
      
      // Rollback the optimistic update
      setMoments(moments);
      onMomentsChanged?.(moments);
      setEditingId(momentId); // Re-open edit mode
      
      if (err.message.includes('already been edited')) {
        setError('This moment has already been edited and cannot be modified again.');
      } else {
        setError('Failed to update moment. Please try again.');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
  };

  const handleDeleteMoment = async (momentId) => {
    if (!momentRepoRef.current) return;
    
    // Find the moment to delete for rollback
    const momentToDelete = moments.find(m => m.id === momentId);
    if (!momentToDelete) return;
    
    // Optimistic update - remove from UI immediately
    const updatedMoments = moments.filter(moment => moment.id !== momentId);
    setMoments(updatedMoments);
    onMomentsChanged?.(updatedMoments);
    
    try {
      setSaving(true);
      setError(null);
      
      // Delete from Firestore in background
      await momentRepoRef.current.deleteMoment(momentId);
    } catch (err) {
      console.error('Error deleting moment:', err);
      setError('Failed to delete moment. Please try again.');
      
      // Rollback the optimistic update
      const rollbackMoments = [...moments, momentToDelete];
      setMoments(rollbackMoments);
      onMomentsChanged?.(rollbackMoments);
    } finally {
      setSaving(false);
    }
  };

  const handleCategoriesChange = async (newCategories) => {
    if (!momentRepoRef.current) return;
    
    try {
      setSaving(true);
      setError(null);
      
      await momentRepoRef.current.saveCategories(newCategories);
      setCategories(newCategories);
    } catch (err) {
      console.error('Error saving categories:', err);
      setError('Failed to save categories. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="grid grid-cols-1 gap-4 sm:gap-6">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow p-3 sm:p-4 border border-transparent dark:border-slate-800">
        <div className="sticky top-0 z-20 -mx-3 px-3 sm:-mx-4 sm:px-4 -mt-3 pt-3 sm:-mt-4 sm:pt-4 pb-3 mb-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between gap-2 min-w-0">
            <div className="font-semibold flex items-center gap-2 text-base sm:text-lg min-w-0 truncate text-slate-900 dark:text-slate-100">
              {loading ? <Loader2 size={18} className="animate-spin shrink-0" /> : <Sparkles size={18} className="shrink-0" />}
              <span className="truncate">Moments</span>
            </div>
          </div>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3"
          >
            <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
            <button
              onClick={() => setError(null)}
              className="mt-2 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 text-sm underline"
            >
              Dismiss
            </button>
          </motion.div>
        )}

        {!user ? (
          <div className="p-3 text-sm text-slate-500 dark:text-slate-400">
            Sign in to view moments.
          </div>
        ) : loading ? (
          <div className="p-3 flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
            <Loader2 size={16} className="animate-spin" />
            Loading moments...
          </div>
        ) : (
          <div className="space-y-4">
            <AddMoment
              onSave={handleSaveMoment}
              onCancel={() => {}}
              categories={categories}
              onCategoriesChange={handleCategoriesChange}
              maxLength={280}
            />

            {moments.length === 0 ? (
              <div className="p-3 text-sm text-slate-500 dark:text-slate-400">
                No moments yet. Start by adding your first moment above.
              </div>
            ) : (
              moments.map((moment) => (
                <MomentCard
                  key={moment.id}
                  moment={moment}
                  categories={categories}
                  isEditing={editingId === moment.id}
                  onEdit={handleEditMoment}
                  onDelete={handleDeleteMoment}
                  onSaveEdit={(updates) => handleSaveEdit(moment.id, updates)}
                  onCancelEdit={handleCancelEdit}
                />
              ))
            )}
          </div>
        )}
      </div>

      {saving && (
        <div className="fixed right-4 z-[55] bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 px-4 py-2 rounded-lg shadow-lg" style={{ bottom: 'calc(var(--content-pb) + 0.5rem)' }}>
          <div className="flex items-center gap-2">
            <Loader2 size={16} className="animate-spin" />
            <span className="text-sm">Saving...</span>
          </div>
        </div>
      )}
    </main>
  );
}
