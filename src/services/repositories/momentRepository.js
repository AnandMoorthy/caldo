import { db, firebase } from '../../firebase';

export class MomentRepository {
  constructor(userId) {
    this.userId = userId;
  }

  momentsRef() {
    return db.collection('users').doc(this.userId).collection('moments');
  }

  categoriesRef() {
    return db.collection('users').doc(this.userId).collection('meta').doc('momentCategories');
  }

  // Save a new moment
  async saveMoment(moment) {
    const data = {
      ...moment,
      ownerUid: this.userId,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      editCount: 0, // Track edit count for one-time edit limitation
    };
    
    // Strip undefined values to satisfy Firestore constraints
    const sanitized = Object.fromEntries(Object.entries(data).filter(([, v]) => v !== undefined));
    await this.momentsRef().doc(moment.id).set(sanitized, { merge: true });
    return moment.id;
  }

  // Update a moment (with edit count tracking)
  async updateMoment(momentId, updates) {
    const momentRef = this.momentsRef().doc(momentId);
    const momentDoc = await momentRef.get();
    
    if (!momentDoc.exists) {
      throw new Error('Moment not found');
    }
    
    const currentData = momentDoc.data();
    const currentEditCount = currentData.editCount || 0;
    
    if (currentEditCount >= 1) {
      throw new Error('This moment has already been edited and cannot be edited again');
    }
    
    const data = {
      ...updates,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      editCount: currentEditCount + 1,
    };
    
    const sanitized = Object.fromEntries(Object.entries(data).filter(([, v]) => v !== undefined));
    await momentRef.update(sanitized);
    return momentId;
  }

  // Delete a moment
  async deleteMoment(momentId) {
    await this.momentsRef().doc(momentId).delete();
  }

  // Fetch moments ordered by creation time (newest first)
  async fetchMoments({ limit = 50, startAfter = null } = {}) {
    let q = this.momentsRef()
      .where('ownerUid', '==', this.userId)
      .orderBy('createdAt', 'desc')
      .limit(limit);
    
    if (startAfter) {
      q = q.startAfter(startAfter);
    }
    
    const snap = await q.get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  }

  // Get a single moment by ID
  async getMoment(momentId) {
    const doc = await this.momentsRef().doc(momentId).get();
    return doc.exists ? { id: doc.id, ...doc.data() } : null;
  }

  // Search moments by text content
  async searchMoments(searchText, { limit = 20 } = {}) {
    // Note: This is a simple client-side search. For better performance with large datasets,
    // consider using Algolia or similar search service
    const allMoments = await this.fetchMoments({ limit: 1000 }); // Get more for search
    const searchLower = searchText.toLowerCase();
    
    return allMoments
      .filter(moment => 
        moment.content?.toLowerCase().includes(searchLower) ||
        moment.category?.toLowerCase().includes(searchLower)
      )
      .slice(0, limit);
  }

  // Category management
  async saveCategories(categories) {
    await this.categoriesRef().set({
      categories,
      ownerUid: this.userId,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
  }

  async getCategories() {
    try {
      const doc = await this.categoriesRef().get();
      if (!doc.exists) {
        // Return default categories without saving them yet
        return [
          { id: 'personal', name: 'Personal' },
          { id: 'work', name: 'Work' },
          { id: 'health', name: 'Health' },
          { id: 'learning', name: 'Learning' },
          { id: 'social', name: 'Social' },
          { id: 'creative', name: 'Creative' },
        ];
      }
      
      const data = doc.data();
      return data.categories || [];
    } catch (error) {
      console.error('Error fetching categories:', error);
      // Return default categories as fallback
      return [
        { id: 'personal', name: 'Personal' },
        { id: 'work', name: 'Work' },
        { id: 'health', name: 'Health' },
        { id: 'learning', name: 'Learning' },
        { id: 'social', name: 'Social' },
        { id: 'creative', name: 'Creative' },
      ];
    }
  }

  // Get moments by category
  async getMomentsByCategory(categoryId, { limit = 50 } = {}) {
    const q = this.momentsRef()
      .where('ownerUid', '==', this.userId)
      .where('category', '==', categoryId)
      .orderBy('createdAt', 'desc')
      .limit(limit);
    
    const snap = await q.get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  }

  // Get moments by mood
  async getMomentsByMood(mood, { limit = 50 } = {}) {
    const q = this.momentsRef()
      .where('ownerUid', '==', this.userId)
      .where('mood', '==', mood)
      .orderBy('createdAt', 'desc')
      .limit(limit);
    
    const snap = await q.get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  }
}

export const createMomentRepository = (userId) => new MomentRepository(userId);
