import { db, firebase } from '../../firebase';

export class SnippetRepository {
  constructor(userId) {
    this.userId = userId;
  }

  snippetsRef() {
    return db.collection('users').doc(this.userId).collection('snippets');
  }

  publicSnippetsRef() {
    return db.collection('publicSnippets');
  }

  // Simple helpers to generate public slug and edit token
  generateSlug(length = 8) {
    const alphabet = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let out = '';
    for (let i = 0; i < length; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)];
    return out;
  }

  generateToken(length = 24) {
    const alphabet = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let out = '';
    for (let i = 0; i < length; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)];
    return out;
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

    // Mirror to public doc if snippet is public and we changed public fields
    try {
      const snap = await this.snippetsRef().doc(snippetId).get();
      const data = snap.exists ? snap.data() : null;
      if (data && data.isPublic && data.publicSlug) {
        const cu = firebase.auth && firebase.auth().currentUser;
        const ownerName = cu?.displayName || data.ownerName || null;
        const ownerPhotoURL = cu?.photoURL || data.ownerPhotoURL || null;
        const mirror = {
          ownerUid: data.ownerUid,
          snippetId,
          title: data.title,
          content: data.content,
          updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
          createdAt: data.createdAt || firebase.firestore.FieldValue.serverTimestamp(),
          allowWrite: !!data.allowWrite,
          editToken: data.editToken || null,
          ownerName,
          ownerPhotoURL,
        };
        await this.publicSnippetsRef().doc(String(data.publicSlug)).set(mirror, { merge: true });
      }
    } catch {}
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

  async getSnippet(snippetId) {
    const doc = await this.snippetsRef().doc(snippetId).get();
    return doc.exists ? { id: doc.id, ...doc.data() } : null;
  }

  async getPublicSnippet(publicSlug) {
    const doc = await this.publicSnippetsRef().doc(String(publicSlug)).get();
    return doc.exists ? { id: doc.id, ...doc.data() } : null;
  }

  async publishSnippet(snippetId) {
    const snap = await this.snippetsRef().doc(snippetId).get();
    if (!snap.exists) throw new Error('Snippet not found');
    const data = snap.data();
    const slug = data.publicSlug || this.generateSlug(8);
    const ownerUid = this.userId;
    const cu = firebase.auth && firebase.auth().currentUser;
    const ownerName = cu?.displayName || null;
    const ownerPhotoURL = cu?.photoURL || null;

    // Update private doc
    await this.snippetsRef().doc(snippetId).set({
      isPublic: true,
      publicSlug: slug,
      publicAt: firebase.firestore.FieldValue.serverTimestamp(),
      allowWrite: !!data.allowWrite || false,
      editToken: data.editToken || null,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });

    // Create/Update mirror
    const mirror = {
      ownerUid,
      snippetId,
      title: data.title || 'Untitled snippet',
      content: String(data.content || ''),
      createdAt: data.createdAt || firebase.firestore.FieldValue.serverTimestamp(),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      allowWrite: !!data.allowWrite || false,
      editToken: data.editToken || null,
      ownerName,
      ownerPhotoURL,
    };
    await this.publicSnippetsRef().doc(String(slug)).set(mirror, { merge: true });

    return { publicSlug: slug };
  }

  async unpublishSnippet(snippetId) {
    const snap = await this.snippetsRef().doc(snippetId).get();
    if (!snap.exists) return;
    const data = snap.data();
    const slug = data.publicSlug;
    // Update private
    await this.snippetsRef().doc(snippetId).set({
      isPublic: false,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
    // Delete mirror if present
    if (slug) {
      try { await this.publicSnippetsRef().doc(String(slug)).delete(); } catch {}
    }
  }

  async enablePublicWrite(snippetId) {
    const snap = await this.snippetsRef().doc(snippetId).get();
    if (!snap.exists) throw new Error('Snippet not found');
    const data = snap.data();
    const slug = data.publicSlug || this.generateSlug(8);
    const token = data.editToken || this.generateToken(24);
    const cu = firebase.auth && firebase.auth().currentUser;
    const ownerName = cu?.displayName || data.ownerName || null;
    const ownerPhotoURL = cu?.photoURL || data.ownerPhotoURL || null;

    // Ensure snippet is public
    await this.snippetsRef().doc(snippetId).set({
      isPublic: true,
      publicSlug: slug,
      allowWrite: true,
      editToken: token,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });

    // Mirror update
    const mirror = {
      ownerUid: this.userId,
      snippetId,
      title: data.title || 'Untitled snippet',
      content: String(data.content || ''),
      createdAt: data.createdAt || firebase.firestore.FieldValue.serverTimestamp(),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      allowWrite: true,
      editToken: token,
      ownerName,
      ownerPhotoURL,
    };
    await this.publicSnippetsRef().doc(String(slug)).set(mirror, { merge: true });

    return { publicSlug: slug, editToken: token };
  }

  async disablePublicWrite(snippetId) {
    const snap = await this.snippetsRef().doc(snippetId).get();
    if (!snap.exists) return;
    const data = snap.data();
    const slug = data.publicSlug;
    await this.snippetsRef().doc(snippetId).set({
      allowWrite: false,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
    if (slug) {
      await this.publicSnippetsRef().doc(String(slug)).set({ allowWrite: false, updatedAt: firebase.firestore.FieldValue.serverTimestamp() }, { merge: true });
    }
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


