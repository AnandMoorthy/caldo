import { db, firebase } from "../../firebase";

export class JournalRepository {
  constructor(userId) {
    this.userId = userId;
  }

  journalsRef() {
    return db.collection("users").doc(this.userId).collection("journals");
  }

  templatesMetaRef() {
    return db.collection("users").doc(this.userId).collection("meta").doc("journalTemplates");
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
        blocks: Array.isArray(journal?.blocks) ? journal.blocks : undefined,
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

  async listJournalTemplates({ limit = 100 } = {}) {
    const doc = await this.templatesMetaRef().get();
    if (!doc.exists) return [];
    const data = doc.data() || {};
    const items = Array.isArray(data.templates) ? data.templates : [];
    return items
      .map((item) => ({
        id: String(item?.id || ""),
        name: String(item?.name || "Journal Template"),
        structure: Array.isArray(item?.structure) ? item.structure : [],
        createdAt: item?.createdAt || null,
        updatedAt: item?.updatedAt || null,
      }))
      .filter((item) => !!item.id)
      .sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime())
      .slice(0, limit);
  }

  async saveJournalTemplate({ templateId = null, name, structure }) {
    const docRef = this.templatesMetaRef();
    const doc = await docRef.get();
    const data = doc.exists ? doc.data() || {} : {};
    const existing = Array.isArray(data.templates) ? [...data.templates] : [];
    const now = new Date().toISOString();
    const id = templateId || `tpl_${Date.now()}_${Math.random().toString(16).slice(2)}`;

    const idx = existing.findIndex((item) => item?.id === id);
    const nextItem = {
      id,
      name: String(name || "Journal Template").trim() || "Journal Template",
      structure: Array.isArray(structure) ? structure : [],
      createdAt: idx >= 0 ? existing[idx]?.createdAt || now : now,
      updatedAt: now,
    };
    if (idx >= 0) existing[idx] = nextItem;
    else existing.push(nextItem);

    await docRef.set(
      {
        ownerUid: this.userId,
        templates: existing,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
    return nextItem;
  }
}

export const createJournalRepository = (userId) => new JournalRepository(userId);
