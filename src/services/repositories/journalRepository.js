import { db, firebase } from "../../firebase";

export class JournalRepository {
  constructor(userId) {
    this.userId = userId;
  }

  journalsRef() {
    return db.collection("users").doc(this.userId).collection("journals");
  }

  async createJournal(journal) {
    const docRef = journal?.id ? this.journalsRef().doc(journal.id) : this.journalsRef().doc();
    const payload = Object.fromEntries(Object.entries({
      ownerUid: this.userId,
      title: String(journal?.title || "Journal Entry").trim(),
      sections: journal?.sections && typeof journal.sections === "object" ? journal.sections : undefined,
      content: String(journal?.content || ""),
      mood: journal?.mood || null,
      energyLevel: Number(journal?.energyLevel) || 3,
      dateKey: String(journal?.dateKey || ""),
      pinned: !!journal?.pinned,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    }).filter(([, value]) => value !== undefined));
    await docRef.set(payload, { merge: true });
    return { id: docRef.id, ...payload };
  }

  async updateJournal(journalId, partial) {
    if (!journalId) throw new Error("journalId is required");
    const sanitized = Object.fromEntries(
      Object.entries({
        ...partial,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      }).filter(([, value]) => value !== undefined)
    );
    await this.journalsRef().doc(journalId).set(sanitized, { merge: true });
  }

  async getJournal(journalId) {
    if (!journalId) return null;
    const doc = await this.journalsRef().doc(journalId).get();
    return doc.exists ? { id: doc.id, ...doc.data() } : null;
  }

  async deleteJournal(journalId) {
    if (!journalId) return;
    await this.journalsRef().doc(journalId).delete();
  }

  async listJournals({ limit = 200 } = {}) {
    const q = this.journalsRef()
      .where("ownerUid", "==", this.userId)
      .orderBy("updatedAt", "desc")
      .limit(limit);
    const snap = await q.get();
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  }

  async listJournalsPage({ limit = 20, startAfterUpdatedAt = null, startAfterId = null } = {}) {
    let q = this.journalsRef()
      .where("ownerUid", "==", this.userId)
      .orderBy("updatedAt", "desc")
      .orderBy(firebase.firestore.FieldPath.documentId())
      .limit(limit);

    if (startAfterUpdatedAt != null && startAfterId) {
      const startAfterValue = startAfterUpdatedAt?.toDate?.() || startAfterUpdatedAt;
      q = q.startAfter(startAfterValue, startAfterId);
    }

    const snap = await q.get();
    const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    const last = snap.docs[snap.docs.length - 1] || null;
    const nextCursor = last ? { updatedAt: last.get("updatedAt") || null, id: last.id } : null;
    return { items, nextCursor };
  }
}

export const createJournalRepository = (userId) => new JournalRepository(userId);
