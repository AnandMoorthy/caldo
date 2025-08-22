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

  // List all notes for the user (client-side sort by updatedAt desc)
  async listAllNotes({ limit = 500 } = {}) {
    const q = this.notesRef()
      .where('ownerUid', '==', this.userId)
      .limit(limit);
    const snap = await q.get();
    const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    return items.sort((a, b) => {
      const aTime = new Date(a.updatedAt?.toDate?.() || a.updatedAt || 0);
      const bTime = new Date(b.updatedAt?.toDate?.() || b.updatedAt || 0);
      return bTime - aTime;
    });
  }

  async setDayNotePinned(dateKey, pinned) {
    await this.notesRef().doc(dateKey).set({ pinned: !!pinned, updatedAt: firebase.firestore.FieldValue.serverTimestamp() }, { merge: true });
  }

  // Paginated listing ordered by updatedAt desc
  async listNotesPage({ limit = 20, startAfterUpdatedAt = null, startAfterId = null } = {}) {
    let q = this.notesRef()
      .where('ownerUid', '==', this.userId)
      .orderBy('updatedAt', 'desc')
      .orderBy(firebase.firestore.FieldPath.documentId())
      .limit(limit);
    if (startAfterUpdatedAt != null && startAfterId) {
      const saVal = startAfterUpdatedAt?.toDate?.() || startAfterUpdatedAt;
      q = q.startAfter(saVal, startAfterId);
    }
    const snap = await q.get();
    const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    const last = snap.docs[snap.docs.length - 1] || null;
    const nextCursor = last ? { updatedAt: last.get('updatedAt') || null, id: last.id } : null;
    return { items, nextCursor };
  }
}

export const createDayNoteRepository = (userId) => new DayNoteRepository(userId);


