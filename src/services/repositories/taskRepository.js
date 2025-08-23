import { db, firebase } from '../../firebase';
import { format, parseISO } from 'date-fns';

function toMonthKey(date) {
  return format(date, 'yyyy-MM');
}

function toDateKey(date) {
  return format(date, 'yyyy-MM-dd');
}

function dateKeyToDate(dateKey) {
  try { return parseISO(dateKey); } catch { return new Date(dateKey); }
}

export class TaskRepository {
  constructor(userId) {
    this.userId = userId;
  }

  tasksRef() {
    return db.collection('users').doc(this.userId).collection('tasks');
  }

  // Convert dateKey to dueDate (start of day)
  getDueDateFromKey(dateKey) {
    return dateKeyToDate(dateKey);
  }

  // Upsert a task for a given dateKey. Populates denormalized keys and timestamps.
  async saveTask(dateKey, task) {
    const dueDate = this.getDueDateFromKey(dateKey);
    const monthKey = toMonthKey(dueDate);
    const data = {
      ...task,
      ownerUid: this.userId,
      dateKey,
      monthKey,
      dueDate,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      createdAt: task?.createdAt || firebase.firestore.FieldValue.serverTimestamp(),
    };
    // Strip undefined values to satisfy Firestore constraints
    const sanitized = Object.fromEntries(Object.entries(data).filter(([, v]) => v !== undefined));
    await this.tasksRef().doc(task.id).set(sanitized, { merge: true });
    return task.id;
  }

  async updateTask(taskId, partial) {
    await this.tasksRef().doc(taskId).set({ ...partial, updatedAt: firebase.firestore.FieldValue.serverTimestamp() }, { merge: true });
  }

  async updateTaskDueDate(taskId, newDateKey) {
    const dueDate = this.getDueDateFromKey(newDateKey);
    await this.tasksRef().doc(taskId).set({ dateKey: newDateKey, monthKey: toMonthKey(dueDate), dueDate, updatedAt: firebase.firestore.FieldValue.serverTimestamp() }, { merge: true });
  }

  async setTaskDone(taskId, done) {
    await this.tasksRef().doc(taskId).set({ done: !!done, updatedAt: firebase.firestore.FieldValue.serverTimestamp() }, { merge: true });
  }

  async deleteTask(taskId) {
    await this.tasksRef().doc(taskId).delete();
  }

  // Fetch tasks in [start, end)
  async fetchTasksInRange(start, end) {
    const snap = await this.tasksRef()
      .where('ownerUid', '==', this.userId)
      .where('dueDate', '>=', start)
      .where('dueDate', '<', end)
      .get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  }

  async fetchTasksForDate(dateKey) {
    // Use equality on dateKey to avoid constructing day range repeatedly
    const snap = await this.tasksRef().where('ownerUid', '==', this.userId).where('dateKey', '==', dateKey).get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  }

  // Delete all tasks in a range (used for clear-all or bulk ops)
  async deleteTasksInRange(start, end) {
    const tasks = await this.fetchTasksInRange(start, end);
    const batch = db.batch();
    tasks.forEach(t => batch.delete(this.tasksRef().doc(t.id)));
    await batch.commit();
  }

  // Recurring task methods
  getRecurringTasksDocRef() {
    return db.collection('users').doc(this.userId).collection('meta').doc('recurringTasks');
  }

  async saveRecurringSeries(series) {
    const docRef = this.getRecurringTasksDocRef();
    const doc = await docRef.get();
    
    if (!doc.exists) {
      // Create new document with first series
      await docRef.set({
        series: [series],
        ownerUid: this.userId,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      });
    } else {
      // Update existing document by adding/updating series
      const data = doc.data();
      const seriesList = data.series || [];
      const existingIndex = seriesList.findIndex(s => s.id === series.id);
      
      if (existingIndex >= 0) {
        // Update existing series
        seriesList[existingIndex] = series;
      } else {
        // Add new series
        seriesList.push(series);
      }
      
      await docRef.update({
        series: seriesList,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      });
    }
    
    return series.id;
  }

  async saveRecurringSeriesBatch(seriesList) {
    if (!seriesList || seriesList.length === 0) return [];
    
    const docRef = this.getRecurringTasksDocRef();
    await docRef.set({
      series: seriesList,
      ownerUid: this.userId,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
    
    return seriesList.map(s => s.id);
  }

  async loadRecurringSeries() {
    try {
      const doc = await this.getRecurringTasksDocRef().get();
      if (!doc.exists) return [];
      
      const data = doc.data();
      return data.series || [];
    } catch (error) {
      // If the document doesn't exist yet, return empty array
      if (error.code === 'permission-denied' || error.code === 'not-found') {
        return [];
      }
      throw error;
    }
  }

  async deleteRecurringSeries(seriesId) {
    const docRef = this.getRecurringTasksDocRef();
    const doc = await docRef.get();
    
    if (doc.exists) {
      const data = doc.data();
      const seriesList = data.series || [];
      const filteredSeries = seriesList.filter(s => s.id !== seriesId);
      
      await docRef.update({
        series: filteredSeries,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      });
    }
  }

  async deleteRecurringSeriesBatch(seriesIds) {
    if (!seriesIds || seriesIds.length === 0) return;
    
    const docRef = this.getRecurringTasksDocRef();
    const doc = await docRef.get();
    
    if (doc.exists) {
      const data = doc.data();
      const seriesList = data.series || [];
      const filteredSeries = seriesList.filter(s => !seriesIds.includes(s.id));
      
      await docRef.update({
        series: filteredSeries,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      });
    }
  }
}

export const createTaskRepository = (userId) => new TaskRepository(userId);


