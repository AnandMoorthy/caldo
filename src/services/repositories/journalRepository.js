import { db, firebase } from "../../firebase";

export class JournalRepository {
  constructor(userId) {
    this.userId = userId;
  }

  journalsRef() {
    return db.collection("users").doc(this.userId).collection("journals");
  }

  async upsertJournalByDate(dateKey, journal, sourceJournalId = null) {
    if (!dateKey) throw new Error("dateKey is required");
    const targetId = String(dateKey);
    const targetRef = this.journalsRef().doc(targetId);
    const targetSnap = await targetRef.get();
    const payload = Object.fromEntries(
      Object.entries({
        ownerUid: this.userId,
        title: String(journal?.title || "Journal Entry").trim(),
        content: String(journal?.content || ""),
        mood: journal?.mood || null,
        energyLevel: Number(journal?.energyLevel) || 3,
        dateKey: targetId,
        pinned: !!journal?.pinned,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        createdAt: targetSnap.exists ? undefined : firebase.firestore.FieldValue.serverTimestamp(),
      }).filter(([, value]) => value !== undefined)
    );
    await targetRef.set(payload, { merge: true });

    if (sourceJournalId && sourceJournalId !== targetId) {
      try {
        await this.journalsRef().doc(sourceJournalId).delete();
      } catch {}
    }

    return { id: targetId, ...payload };
  }

  async createJournal(journal) {
    const dateKey = String(journal?.dateKey || "");
    if (!dateKey) throw new Error("dateKey is required");
    return this.upsertJournalByDate(dateKey, journal, journal?.id || null);
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

  // Paginate through every journal entry for full data export.
  // Equality-only query (no orderBy) so we only need the automatic single-field index.
  async listAllJournals({ pageSize = 200 } = {}) {
    const items = [];
    let lastDoc = null;
    while (true) {
      let q = this.journalsRef().where("ownerUid", "==", this.userId).limit(pageSize);
      if (lastDoc) q = q.startAfter(lastDoc);
      const snap = await q.get();
      if (snap.empty) break;
      items.push(...snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      lastDoc = snap.docs[snap.docs.length - 1];
      if (snap.docs.length < pageSize) break;
    }
    return items;
  }
}

export const createJournalRepository = (userId) => new JournalRepository(userId);
