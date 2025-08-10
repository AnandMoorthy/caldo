import React, { useEffect, useRef, useState } from "react";
import { ChevronDown, FileUp as ImportIcon, FileDown as ExportIcon, User as UserIcon } from "lucide-react";

function Avatar({ user }) {
  function getInitials() {
    const name = user?.displayName?.trim();
    if (name) {
      const parts = name.split(/\s+/).filter(Boolean);
      if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
      if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    }
    const email = user?.email || "";
    const local = email.split("@")[0] || "";
    if (local.length >= 2) return local.slice(0, 2).toUpperCase();
    if (local.length === 1) return (local[0] + local[0]).toUpperCase();
    return "?";
  }

  return <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-xs font-semibold">{getInitials()}</div>;
}

export default function Header({ user, onSignInWithGoogle, onSignOut, onExportJSON, onImportJSON }) {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileMenuRef = useRef(null);

  useEffect(() => {
    function onDocClick(e) {
      if (!profileMenuRef.current) return;
      if (!profileMenuRef.current.contains(e.target)) setShowProfileMenu(false);
    }
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  return (
    <header className="flex items-center justify-between mb-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">CalDo</h1>
        <p className="text-sm text-slate-500 mt-1">Minimalist calendar & todo.</p>
      </div>
      <div className="flex items-center gap-2">
        <div className="relative" ref={profileMenuRef}>
          <button onClick={() => setShowProfileMenu((v) => !v)} className="btn inline-flex items-center gap-2">
            <Avatar user={user} />
            <ChevronDown size={16} />
          </button>
          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white border shadow-lg rounded-lg p-2 z-50">
              <div className="px-2 py-1.5 text-xs text-slate-500">
                {user ? (
                  <span>
                    Signed in as <span className="font-medium text-slate-700">{user.displayName || user.email}</span>
                  </span>
                ) : (
                  <span>Not signed in</span>
                )}
              </div>
              <div className="h-px bg-slate-100 my-1" />
              {!user && (
                <button onClick={onSignInWithGoogle} className="w-full text-left px-3 py-2 rounded hover:bg-slate-50 inline-flex items-center gap-2">
                  <UserIcon size={16} /> Sign in with Google
                </button>
              )}
              <button onClick={onExportJSON} className="w-full text-left px-3 py-2 rounded hover:bg-slate-50 inline-flex items-center gap-2">
                <ExportIcon size={16} /> Export
              </button>
              <label className="w-full text-left px-3 py-2 rounded hover:bg-slate-50 inline-flex items-center gap-2 cursor-pointer">
                <ImportIcon size={16} /> Import
                <input type="file" accept="application/json" className="hidden" onChange={(e) => e.target.files?.[0] && onImportJSON(e.target.files[0])} />
              </label>
              {user && (
                <>
                  <div className="h-px bg-slate-100 my-1" />
                  <button onClick={onSignOut} className="w-full text-left px-3 py-2 rounded hover:bg-slate-50">Sign out</button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}


