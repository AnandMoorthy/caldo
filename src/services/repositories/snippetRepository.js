import { db, firebase } from '../../firebase';

export class SnippetRepository {
  constructor(userId) {
    this.userId = userId;
  }

  snippetsRef() {
    return db.collection('users').doc(this.userId).collection('snippets');
  }

  async listSnippets({ includeArchived = false, tag = null, limit = 200 } = {}) {
    // Fetch and filter client-side; used for initial cache or small lists
    const q = this.snippetsRef().where('ownerUid', '==', this.userId).limit(limit);
    const snap = await q.get();
    const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    return items.filter(s => (includeArchived ? true : !s.archived) && (tag ? Array.isArray(s.tags) && s.tags.includes(tag) : true));
  }

  async createSnippet({ title, content = '', tags = [], language = null, pinned = false } = {}) {
    const docRef = this.snippetsRef().doc();
    const payload = {
      ownerUid: this.userId,
      title: (title || 'Untitled snippet').trim(),
      content: String(content || ''),
      tags: Array.isArray(tags) ? tags : [],
      language: language || null,
      pinned: !!pinned,
      archived: false,
      copyCount: 0,
      lastCopiedAt: null,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    };
    await docRef.set(payload);
    return { id: docRef.id, ...payload };
  }

  async updateSnippet(snippetId, partial) {
    const sanitized = { ...partial, updatedAt: firebase.firestore.FieldValue.serverTimestamp() };
    await this.snippetsRef().doc(snippetId).set(sanitized, { merge: true });
  }

  async deleteSnippet(snippetId) {
    console.log('Repository: Deleting snippet', snippetId);
    try {
      await this.snippetsRef().doc(snippetId).delete();
      console.log('Repository: Snippet deleted successfully', snippetId);
    } catch (error) {
      console.error('Repository: Failed to delete snippet', snippetId, error);
      throw error;
    }
  }

  async incrementCopyCount(snippetId) {
    const ref = this.snippetsRef().doc(snippetId);
    await ref.set({
      copyCount: firebase.firestore.FieldValue.increment(1),
      lastCopiedAt: firebase.firestore.FieldValue.serverTimestamp(),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
  }

  // Paginated listing with pinned-first ordering: we execute two queries for pinned/unpinned
  async listSnippetsPage({ limit = 20, startAfterPinnedCursor = null, startAfterUnpinnedCursor = null } = {}) {
    const pinnedQBase = this.snippetsRef()
      .where('ownerUid', '==', this.userId)
      .where('archived', '==', false)
      .where('pinned', '==', true)
      .orderBy('updatedAt', 'desc')
      .orderBy(firebase.firestore.FieldPath.documentId())
      .limit(limit);
    const unpinnedQBase = this.snippetsRef()
      .where('ownerUid', '==', this.userId)
      .where('archived', '==', false)
      .where('pinned', '==', false)
      .orderBy('updatedAt', 'desc')
      .orderBy(firebase.firestore.FieldPath.documentId())
      .limit(limit);

    const pinnedQ = startAfterPinnedCursor && startAfterPinnedCursor.updatedAt && startAfterPinnedCursor.id
      ? pinnedQBase.startAfter(startAfterPinnedCursor.updatedAt, startAfterPinnedCursor.id)
      : pinnedQBase;
    const unpinnedQ = startAfterUnpinnedCursor && startAfterUnpinnedCursor.updatedAt && startAfterUnpinnedCursor.id
      ? unpinnedQBase.startAfter(startAfterUnpinnedCursor.updatedAt, startAfterUnpinnedCursor.id)
      : unpinnedQBase;

    const [pSnap, uSnap] = await Promise.all([pinnedQ.get(), unpinnedQ.get()]);

    const pinnedItems = pSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    const unpinnedItems = uSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    const nextPinned = pSnap.docs.length ? { updatedAt: pSnap.docs[pSnap.docs.length - 1].get('updatedAt') || null, id: pSnap.docs[pSnap.docs.length - 1].id } : null;
    const nextUnpinned = uSnap.docs.length ? { updatedAt: uSnap.docs[uSnap.docs.length - 1].get('updatedAt') || null, id: uSnap.docs[uSnap.docs.length - 1].id } : null;

    // Merge maintaining pinned first ordering
    const items = [...pinnedItems, ...unpinnedItems];
    return { items, nextPinnedCursor: nextPinned, nextUnpinnedCursor: nextUnpinned };
  }
}

export const createSnippetRepository = (userId) => new SnippetRepository(userId);


