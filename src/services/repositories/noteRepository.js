import { db, firebase } from '../../firebase';
import { parseISO } from 'date-fns';

export class DayNoteRepository {
  constructor(userId) {
    this.userId = userId;
  }

  notesRef() {
    return db.collection('users').doc(this.userId).collection('dayNotes');
  }

  // Upsert day note by dateKey
  async saveDayNote(dateKey, content) {
    await this.notesRef().doc(dateKey).set({
      ownerUid: this.userId,
      dateKey,
      content,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
  }

  async deleteDayNote(dateKey) {
    await this.notesRef().doc(dateKey).delete();
  }

  async getDayNote(dateKey) {
    const doc = await this.notesRef().doc(dateKey).get();
    return doc.exists ? doc.data() : null;
  }

  // Fetch notes within a month via range on dateKey string
  async fetchMonthNotes(monthKey) {
    const start = `${monthKey}-01`;
    // naive month end increment; caller will typically use task repo range instead
    const [y, m] = monthKey.split('-');
    const next = new Date(Number(y), Number(m), 1);
    const nextMonthKey = `${String(next.getFullYear()).padStart(4,'0')}-${String(next.getMonth()+1).padStart(2,'0')}`;
    const end = `${nextMonthKey}-01`;
    const snap = await this.notesRef().where('ownerUid', '==', this.userId).where('dateKey', '>=', start).where('dateKey', '<', end).get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  }
}

export const createDayNoteRepository = (userId) => new DayNoteRepository(userId);


