import { db, firebase } from '../firebase';

// New schema: users/{userId}/todos/{dateKey}/taskList/{taskId} and notes/{noteId}
export class FirebaseService {
  constructor(userId) {
    this.userId = userId;
  }

  // Get reference to all dates (todos) for the user
  getTodosCollectionRef() {
    return db.collection('users').doc(this.userId).collection('todos');
  }

  // Parse dateKey 'YYYY-MM-DD' -> { year:'YYYY', month:'MM', day:'DD' }
  parseDateKey(dateKey) {
    const [y, m, d] = (dateKey || '').split('-');
    return { year: y, month: m, day: d };
  }

  // Get reference to a specific date's document at: todos/{YYYY}/{MM}/{DD}
  getDateRef(dateKey) {
    const { year, month, day } = this.parseDateKey(dateKey);
    return this.getTodosCollectionRef().doc(year).collection(month).doc(day);
  }

  // Ensure the day document exists to make month enumeration possible
  async ensureDateDoc(dateKey) {
    const { year, month, day } = this.parseDateKey(dateKey);
    await this.getDateRef(dateKey).set({ year, month, day, updatedAt: new Date() }, { merge: true });
  }

  // Get reference to task list collection (per-task documents)
  getTaskListRef(dateKey) {
    return this.getDateRef(dateKey).collection('taskList');
  }

  // Get reference to notes document that stores the note object
  getNotesDocRef(dateKey) {
    return this.getDateRef(dateKey).collection('notes').doc('day');
  }

  // Save a single task
  async saveTask(dateKey, task) {
    await this.ensureDateDoc(dateKey);
    const docRef = this.getTaskListRef(dateKey).doc(task.id);
    await docRef.set({
      ...task,
      ownerUid: this.userId,
      updatedAt: new Date(),
      createdAt: task.createdAt || new Date()
    }, { merge: true });
    return docRef.id;
  }

  // Save multiple tasks for a date
  async saveTasks(dateKey, tasks) {
    await this.ensureDateDoc(dateKey);
    const listRef = this.getTaskListRef(dateKey);
    const existingSnap = await listRef.get();
    const existingIds = new Set(existingSnap.docs.map(d => d.id));
    const incomingIds = new Set((tasks || []).map(t => t.id));
    const batch = db.batch();
    // Upsert provided tasks
    (tasks || []).forEach(t => {
      const ref = listRef.doc(t.id);
      batch.set(ref, { ...t, ownerUid: this.userId, updatedAt: new Date(), createdAt: t.createdAt || new Date() }, { merge: true });
    });
    // Delete tasks not present in incoming set
    existingSnap.docs.forEach(doc => {
      if (!incomingIds.has(doc.id)) batch.delete(doc.ref);
    });
    await batch.commit();
  }

  // Save a day note
  async saveDayNote(dateKey, noteText) {
    await this.ensureDateDoc(dateKey);
    const noteRef = this.getNotesDocRef(dateKey);
    const payload = {
      id: 'day_note',
      type: 'day_note',
      content: noteText,
      updatedAt: new Date(),
      createdAt: new Date(),
    };
    await noteRef.set(payload, { merge: true });
    // Also mirror note on the day document for efficient month fetch
    await this.getDateRef(dateKey).set({ dayNote: noteText, ownerUid: this.userId, dateKey, updatedAt: new Date() }, { merge: true });
    return 'day_note';
  }

  // Save custom notes
  async saveNote(dateKey, note) {
    const noteRef = this.getNotesDocRef(dateKey);
    await noteRef.set({ ...note, updatedAt: new Date(), createdAt: note.createdAt || new Date() }, { merge: true });
    return 'day_note';
  }

  // Load all tasks for a date
  async loadTasks(dateKey) {
    const snapshot = await this.getTaskListRef(dateKey).get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  // Load day note
  async loadDayNote(dateKey) {
    const noteDoc = await this.getNotesDocRef(dateKey).get();
    return noteDoc.exists ? noteDoc.data() : null;
  }

  // Load all notes for a date
  async loadNotes(dateKey) {
    const note = await this.loadDayNote(dateKey);
    return note ? [note] : [];
  }

  // Load all data for a date (tasks + notes)
  async loadDateData(dateKey) {
    const [tasks, notes] = await Promise.all([
      this.loadTasks(dateKey),
      this.loadNotes(dateKey)
    ]);
    
    return {
      tasks,
      notes,
      dayNote: notes.find(note => note.id === 'day_note')?.content || ''
    };
  }

  // Load all data for a month (multiple dates)
  async loadMonthData(monthKey) {
    // Efficient monthly fetch using two queries (no per-day loops):
    // 1) CG tasks by ownerUid + due range
    // 2) Month day docs for dayNote (mirrored on day doc)
    const [year, month] = monthKey.split('-');
    const start = `${year}-${month}-01`;
    const nextMonthDate = new Date(Number(year), Number(month), 1);
    const nextYear = String(nextMonthDate.getFullYear()).padStart(4, '0');
    const nextMonth = String(nextMonthDate.getMonth() + 1).padStart(2, '0');
    const end = `${nextYear}-${nextMonth}-01`;

    // Query tasks for this user and month
    const tasksQ = db.collectionGroup('taskList')
      .where('ownerUid', '==', this.userId)
      .where('due', '>=', start)
      .where('due', '<', end);

    // Query day docs for the month to pick up mirrored dayNote
    const daysQ = this.getTodosCollectionRef().doc(year).collection(month);

    const [tasksSnap, daysSnap] = await Promise.all([tasksQ.get(), daysQ.get()]);

    const byDate = new Map();
    tasksSnap.docs.forEach(doc => {
      const t = { id: doc.id, ...doc.data() };
      if (!t?.due) return;
      if (!byDate.has(t.due)) byDate.set(t.due, []);
      byDate.get(t.due).push(t);
    });

    const dayNotes = new Map();
    daysSnap.docs.forEach(doc => {
      const day = doc.id.padStart(2, '0');
      const dateKey = `${year}-${month}-${day}`;
      const data = doc.data() || {};
      if (typeof data.dayNote === 'string' && data.dayNote.trim().length) {
        dayNotes.set(dateKey, data.dayNote);
      }
    });

    // Merge
    const monthData = {};
    const allDates = new Set([...byDate.keys(), ...dayNotes.keys()]);
    allDates.forEach(dateKey => {
      const tasks = byDate.get(dateKey) || [];
      const note = dayNotes.get(dateKey);
      const list = [...tasks];
      if (note) list.push({ id: 'day_note', due: dateKey, dayNote: note, createdAt: new Date().toISOString() });
      if (list.length) monthData[dateKey] = list;
    });

    return monthData;
  }

  // Delete a task
  async deleteTask(dateKey, taskId) {
    await this.getTaskListRef(dateKey).doc(taskId).delete();
  }

  // Delete a note
  async deleteNote(dateKey) {
    await this.getNotesDocRef(dateKey).delete();
  }

  // Delete all data for a date
  async deleteDateData(dateKey) {
    const batch = db.batch();
    // Delete all task docs
    const tasksSnap = await this.getTaskListRef(dateKey).get();
    tasksSnap.docs.forEach(doc => batch.delete(doc.ref));
    // Delete note doc
    batch.delete(this.getNotesDocRef(dateKey));
    // Delete date doc
    batch.delete(this.getDateRef(dateKey));
    await batch.commit();
  }

  // Update task completion status
  async updateTaskCompletion(dateKey, taskId, completed) {
    await this.getTaskListRef(dateKey).doc(taskId).set({ done: completed, updatedAt: new Date() }, { merge: true });
  }

  // Search across all dates
  async searchAllData(query) {
    const results = [];
    
    // Traverse: todos/{year}/{month}/{day}
    const yearsSnap = await this.getTodosCollectionRef().get();
    for (const yearDoc of yearsSnap.docs) {
      const year = yearDoc.id;
      // Iterate known months 01-12 under the year
      for (let m = 1; m <= 12; m++) {
        const month = String(m).padStart(2, '0');
        const daysSnap = await this.getTodosCollectionRef().doc(year).collection(month).get();
        for (const dayDoc of daysSnap.docs) {
          const day = dayDoc.id.padStart(2, '0');
          const dateKey = `${year}-${month}-${day}`;
          const dateData = await this.loadDateData(dateKey);
          // Search in tasks
          dateData.tasks.forEach(task => {
            if (this.matchesSearch(task, query)) {
              results.push({ ...task, dateKey, type: 'task' });
            }
          });
          // Search in notes
          dateData.notes.forEach(note => {
            if (this.matchesSearch(note, query)) {
              results.push({ ...note, dateKey, type: 'note' });
            }
          });
        }
      }
    }
    
    return results;
  }

  // Helper method to check if item matches search query
  matchesSearch(item, query) {
    const searchTerm = query.toLowerCase();
    return (
      (item.title && item.title.toLowerCase().includes(searchTerm)) ||
      (item.content && item.content.toLowerCase().includes(searchTerm)) ||
      (item.dayNote && item.dayNote.toLowerCase().includes(searchTerm))
    );
  }

  // Get metadata for a date
  async getDateMetadata(dateKey) {
    const dateDoc = await this.getDateRef(dateKey).get();
    if (!dateDoc.exists) return null;
    
    const data = dateDoc.data();
    return {
      updatedAt: data.updatedAt,
      taskCount: data.taskCount || 0,
      noteCount: data.noteCount || 0
    };
  }

  // Update date metadata
  async updateDateMetadata(dateKey, metadata) {
    await this.getDateRef(dateKey).set({
      ...metadata,
      updatedAt: new Date()
    }, { merge: true });
  }

  // Get reference to recurring tasks collection
  getRecurringTasksRef() {
    return db.collection('users').doc(this.userId).collection('meta').collection('recurringTasks');
  }

  // Save a recurring task series
  async saveRecurringSeries(series) {
    const docRef = this.getRecurringTasksRef().doc(series.id);
    await docRef.set({
      ...series,
      ownerUid: this.userId,
      updatedAt: new Date(),
      createdAt: series.createdAt || new Date()
    }, { merge: true });
    return docRef.id;
  }

  // Save multiple recurring task series
  async saveRecurringSeriesBatch(seriesList) {
    if (!seriesList || seriesList.length === 0) return;
    
    const batch = db.batch();
    seriesList.forEach(series => {
      const docRef = this.getRecurringTasksRef().doc(series.id);
      batch.set(docRef, {
        ...series,
        ownerUid: this.userId,
        updatedAt: new Date(),
        createdAt: series.createdAt || new Date()
      }, { merge: true });
    });
    await batch.commit();
  }

  // Load all recurring task series for the user
  async loadRecurringSeries() {
    const snapshot = await this.getRecurringTasksRef().get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  // Delete a recurring task series
  async deleteRecurringSeries(seriesId) {
    await this.getRecurringTasksRef().doc(seriesId).delete();
  }

  // Delete multiple recurring task series
  async deleteRecurringSeriesBatch(seriesIds) {
    if (!seriesIds || seriesIds.length === 0) return;
    
    const batch = db.batch();
    seriesIds.forEach(seriesId => {
      const docRef = this.getRecurringTasksRef().doc(seriesId);
      batch.delete(docRef);
    });
    await batch.commit();
  }
}

// Export a factory function for easy usage
export const createFirebaseService = (userId) => new FirebaseService(userId);
