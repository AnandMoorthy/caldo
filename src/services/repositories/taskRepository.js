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
    await this.tasksRef().doc(task.id).set(data, { merge: true });
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
}

export const createTaskRepository = (userId) => new TaskRepository(userId);


