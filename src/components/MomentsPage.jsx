import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
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
      console.log('No user UID, skipping load');
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

  if (!user) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <p className="text-slate-600 dark:text-slate-400">Please sign in to view moments.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Loading moments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 px-4 sm:px-0">
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4"
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

      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
          Moments
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          Capture your thoughts and feelings throughout the day
        </p>
      </div>

      <div className="space-y-4">
        {/* Add new moment - always at the top */}
        <AddMoment
          onSave={handleSaveMoment}
          onCancel={() => {}}
          categories={categories}
          onCategoriesChange={handleCategoriesChange}
          maxLength={280}
        />

        {/* Existing moments */}
        {moments.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <div className="text-4xl mb-4">📝</div>
            <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">
              No moments yet
            </h3>
            <p className="text-slate-600 dark:text-slate-400">
              Start by adding your first moment above
            </p>
          </motion.div>
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

      {saving && (
        <div className="fixed bottom-4 right-4 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 px-4 py-2 rounded-lg shadow-lg">
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
            <span className="text-sm">Saving...</span>
          </div>
        </div>
      )}

    </div>
  );
}
