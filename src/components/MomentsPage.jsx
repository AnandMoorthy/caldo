import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Plus, Sparkles } from 'lucide-react';
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
  const [adding, setAdding] = useState(false);
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
    <main className="max-w-2xl mx-auto w-full">
      <div className="sticky top-0 z-20 -mx-1 px-1 pb-2 mb-2 bg-slate-50/95 dark:bg-slate-950/95 backdrop-blur-md border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center justify-between gap-2 min-w-0">
          <div className="font-semibold flex items-center gap-2 text-base sm:text-lg min-w-0 truncate text-slate-900 dark:text-slate-100">
            {loading ? <Loader2 size={18} className="animate-spin shrink-0" /> : <Sparkles size={18} className="shrink-0" />}
            <span className="truncate">Moments</span>
          </div>
          <button
            type="button"
            onClick={() => setAdding(true)}
            disabled={!user || loading}
            className="shrink-0 inline-flex items-center justify-center gap-1 h-9 px-3 text-xs rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-60 touch-manipulation"
          >
            <Plus size={14} />
            <span>New</span>
          </button>
        </div>
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-2.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-2.5"
        >
          <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
          <button
            type="button"
            onClick={() => setError(null)}
            className="mt-1.5 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 text-sm underline"
          >
            Dismiss
          </button>
        </motion.div>
      )}

      {!user ? (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 text-sm text-slate-500 dark:text-slate-400">
          Sign in to view moments.
        </div>
      ) : loading ? (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
          <Loader2 size={16} className="animate-spin" />
          Loading moments...
        </div>
      ) : (
        <div className="space-y-2.5 sm:space-y-3">
          <AddMoment
            expanded={adding}
            onSave={(data) => {
              handleSaveMoment(data);
              setAdding(false);
            }}
            onCancel={() => setAdding(false)}
            categories={categories}
            onCategoriesChange={handleCategoriesChange}
            maxLength={280}
          />

          {moments.length === 0 && !adding ? (
            <div className="px-1 py-1 text-sm text-slate-500 dark:text-slate-400">
              No moments yet. Tap New to add your first moment.
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

      {saving && (
        <div className="fixed right-3 z-[55] bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 px-3 py-2 rounded-lg shadow-lg" style={{ bottom: 'calc(var(--content-pb) + 0.5rem)' }}>
          <div className="flex items-center gap-2">
            <Loader2 size={16} className="animate-spin" />
            <span className="text-sm">Saving...</span>
          </div>
        </div>
      )}
    </main>
  );
}
