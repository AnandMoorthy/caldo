import React from "react";
import { auth } from "../firebase";
import { createDayNoteRepository } from "../services/repositories/noteRepository";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import FocusedContentView from "./FocusedContentView.jsx";
import RichTextEditor from "./RichTextEditor";

export default function FocusedDayNoteView({ dateKey }) {
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [content, setContent] = React.useState("");
  const [user, setUser] = React.useState(null);
  const [authReady, setAuthReady] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const saveTimerRef = React.useRef(null);

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
        if (!repoRef.current) repoRef.current = createDayNoteRepository(user.uid);
        const note = await repoRef.current.getDayNote(String(dateKey));
        if (!mounted) return;
        if (!note) {
          setError("Not found");
          return;
        }
        setError(null);
        setContent(String(note.content || ""));
      } catch (e) {
        if (!mounted) return;
        setError("Failed to load");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [dateKey, user, authReady]);

  // Debounced autosave when editing
  React.useEffect(() => {
    if (!repoRef.current) return;
    if (!user) return;
    if (!dateKey) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      try {
        setSaving(true);
        await repoRef.current.saveDayNote(String(dateKey), String(content || ''));
      } catch (e) {
      } finally {
        setSaving(false);
      }
    }, 1200);
    return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current); };
  }, [content]);

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
      headerTitle={'Day Note'}
      onClose={() => { try { localStorage.setItem('caldo_v2_active_tab', 'notes'); } catch {}; try { window.location.hash = ''; } catch {}; }}
      renderEditor={() => (
        <RichTextEditor
          content={content}
          onChange={(v) => setContent(v)}
          readOnly={false}
          showToolbar={true}
          borderless={true}
        />
      )}
      saving={saving}
      canSave={true}
      onSave={async () => {
        if (!repoRef.current || saving) return;
        try {
          setSaving(true);
          await repoRef.current.saveDayNote(String(dateKey), String(content || ''));
        } catch (e) {
        } finally {
          setSaving(false);
        }
      }}
    />
  );
}


