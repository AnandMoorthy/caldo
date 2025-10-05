import React from "react";
import { Loader2 } from "lucide-react";
import RichTextEditor from "./RichTextEditor";
import { createSnippetRepository } from "../services/repositories/snippetRepository";
import { auth, db, firebase } from "../firebase";

export default function PublicSnippetView({ slug, token = null }) {
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [doc, setDoc] = React.useState(null);
  const [content, setContent] = React.useState("");
  const [title, setTitle] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [hasUserModified, setHasUserModified] = React.useState(false);
  const [isInitialized, setIsInitialized] = React.useState(false);

  // No user context needed for public repo methods; use a dummy uid for constructor
  const repoRef = React.useRef(createSnippetRepository("__public__"));

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const d = await repoRef.current.getPublicSnippet(slug);
        if (!mounted) return;
        if (!d) {
          setError("Not found");
          setDoc(null);
        } else {
          setDoc(d);
          setTitle(d.title || "Untitled snippet");
          setContent(String(d.content || ""));
          // Defer marking initialized to avoid treating initial state as user edit
          setTimeout(() => { if (mounted) setIsInitialized(true); }, 100);
        }
      } catch (e) {
        if (!mounted) return;
        setError("Failed to load");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [slug]);

  const canEdit = Boolean(doc?.allowWrite && token && token === doc?.editToken);

  // Debounced auto-save similar to SnippetsDrawer
  React.useEffect(() => {
    if (!canEdit) return;
    if (!isInitialized) return;
    if (!hasUserModified) return;
    const handle = setTimeout(async () => {
      try {
        setSaving(true);
        await repoRef.current.publicSnippetsRef().doc(String(slug)).set({
          // Include immutable identity/permission fields to satisfy rules
          ownerUid: doc?.ownerUid,
          snippetId: doc?.snippetId,
          allowWrite: true,
          editToken: doc?.editToken,
          // Editable fields
          title: (title || "Untitled snippet").trim(),
          content: String(content || ""),
        }, { merge: true });
        setHasUserModified(false);
      } catch (e) {
        console.error('Public auto-save failed', e);
      } finally {
        setSaving(false);
      }
    }, 1500);
    return () => clearTimeout(handle);
  }, [title, content, canEdit, isInitialized, hasUserModified, slug, doc]);

  async function onSaveEdit() {
    if (!canEdit) return;
    try {
      setSaving(true);
      await repoRef.current.publicSnippetsRef().doc(String(slug)).set({
        ownerUid: doc?.ownerUid,
        snippetId: doc?.snippetId,
        allowWrite: true,
        editToken: doc?.editToken,
        title: (title || "Untitled snippet").trim(),
        content: String(content || ""),
      }, { merge: true });
      // If the viewer is the owner, also sync the private snippet doc
      try {
        const u = auth.currentUser;
        if (u && doc?.ownerUid && u.uid === doc.ownerUid && doc?.snippetId) {
          await db.collection('users').doc(doc.ownerUid).collection('snippets').doc(doc.snippetId).set({
            title: (title || "Untitled snippet").trim(),
            content: String(content || ""),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
          }, { merge: true });
        }
      } catch {}
      setHasUserModified(false);
    } catch (e) {
      console.error("Failed to save public edit", e);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-500">
        Loading…
      </div>
    );
  }

  if (error || !doc) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-500">
        {error || "Not found"}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-4 sm:p-6 md:p-10">
      <div className="max-w-3xl mx-auto">
        {canEdit ? (
          <>
            <div className="mb-3 flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
              {doc?.ownerPhotoURL ? (
                <img src={doc.ownerPhotoURL} alt="" className="w-7 h-7 rounded-full" />
              ) : (
                <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-800" />
              )}
              <div>
                <div className="font-medium">{doc?.ownerName || 'Anonymous'}</div>
                <div className="text-[11px] opacity-80">Owner</div>
              </div>
            </div>
            <div className="mb-4">
              <input
                className="w-full px-3 py-2 rounded bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
                value={title}
                onChange={(e) => { setTitle(e.target.value); setHasUserModified(true); }}
                placeholder="Title"
              />
            </div>
          </>
        ) : (
          <div className="mb-4 flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-semibold truncate">{title || "Untitled snippet"}</h1>
            </div>
            <div className="shrink-0 flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
              {doc?.ownerPhotoURL ? (
                <img src={doc.ownerPhotoURL} alt="" className="w-7 h-7 rounded-full" />
              ) : (
                <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-800" />
              )}
              <div className="text-right">
                <div className="font-medium leading-4">{doc?.ownerName || 'Anonymous'}</div>
                <div className="text-[11px] opacity-80 leading-3">Owner</div>
              </div>
            </div>
          </div>
        )}
        <div className="rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 min-h-[300px]">
          {canEdit ? (
            <RichTextEditor content={content} onChange={(v) => { setContent(v); setHasUserModified(true); }} borderless={true} />
          ) : (
            <RichTextEditor content={content} onChange={() => {}} readOnly={true} showToolbar={false} borderless={true} />
          )}
        </div>
        {canEdit ? (
          <div className="mt-4 flex items-center justify-end gap-3">
            {saving || hasUserModified ? (
              <div className="inline-flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                {saving ? <Loader2 size={14} className="animate-spin" /> : <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>}
                {saving ? 'Saving…' : 'Unsaved changes'}
              </div>
            ) : null}
            <button
              type="button"
              onClick={onSaveEdit}
              disabled={saving}
              className={`px-4 py-2 rounded text-white ${saving ? 'bg-indigo-500' : 'bg-indigo-600'}`}
            >
              Save
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}


