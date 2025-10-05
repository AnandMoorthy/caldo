import React from "react";
import { createSnippetRepository } from "../services/repositories/snippetRepository";
import { auth } from "../firebase";
import RichTextEditor from "./RichTextEditor";
import FocusedContentView from "./FocusedContentView.jsx";

export default function FocusedSnippetView({ id }) {
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [title, setTitle] = React.useState("");
  const [content, setContent] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [hasUserModified, setHasUserModified] = React.useState(false);
  const saveTimerRef = React.useRef(null);
  const [user, setUser] = React.useState(null);
  const [authReady, setAuthReady] = React.useState(false);

  const repoRef = React.useRef(null);

  React.useEffect(() => {
    const unsub = auth.onAuthStateChanged((u) => {
      setUser(u);
      setAuthReady(true);
    });
    return () => unsub();
  }, []);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      if (!authReady) return;
      try {
        setLoading(true);
        if (!user) {
          setError("Sign in required");
          return;
        }
        if (!repoRef.current) repoRef.current = createSnippetRepository(user.uid);
        const sn = await repoRef.current.getSnippet(String(id));
        if (!mounted) return;
        if (!sn) {
          setError("Not found");
          return;
        }
        setError(null);
        setTitle(sn.title || "Untitled snippet");
        setContent(String(sn.content || ""));
        setHasUserModified(false);
      } catch (e) {
        if (!mounted) return;
        setError("Failed to load");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [id, user, authReady]);

  // Debounced autosave when user modifies title/content
  React.useEffect(() => {
    if (!repoRef.current) return;
    if (!hasUserModified) return;
    if (!user) return;
    if (!id) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      try {
        setSaving(true);
        await repoRef.current.updateSnippet(String(id), { title: (title || 'Untitled snippet').trim(), content: String(content || '') });
        setHasUserModified(false);
      } catch (e) {
        // ignore
      } finally {
        setSaving(false);
      }
    }, 1200);
    return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current); };
  }, [title, content]);

  if (!authReady || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-500">
        Loading…
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-500">
        {error}
      </div>
    );
  }

  return (
    <FocusedContentView
      user={user}
      headerTab={'notes'}
      headerTitle={'Snippet'}
      onClose={() => { try { localStorage.setItem('caldo_v2_active_tab', 'notes'); } catch {}; try { window.location.hash = ''; } catch {}; }}
      title={title}
      onChangeTitle={(t) => { setTitle(t); setHasUserModified(true); }}
      renderEditor={() => (
        <RichTextEditor
          content={content}
          onChange={(v) => { setContent(v); setHasUserModified(true); }}
          readOnly={false}
          showToolbar={true}
          borderless={true}
        />
      )}
      saving={saving}
      canSave={hasUserModified}
      onSave={async () => {
        if (!repoRef.current || saving) return;
        try {
          setSaving(true);
          await repoRef.current.updateSnippet(String(id), { title: (title || 'Untitled snippet').trim(), content: String(content || '') });
          setHasUserModified(false);
        } catch (e) {
        } finally {
          setSaving(false);
        }
      }}
    />
  );
}

