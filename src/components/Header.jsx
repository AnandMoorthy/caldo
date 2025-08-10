import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ChevronDown, FileUp as ImportIcon, FileDown as ExportIcon, User as UserIcon, Download as InstallIcon, Flame as StreakIcon } from "lucide-react";

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

export default function Header({ user, onSignInWithGoogle, onSignOut, onExportJSON, onImportJSON, currentStreak = 0 }) {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileMenuRef = useRef(null);
  const [canInstall, setCanInstall] = useState(false);
  const deferredPromptRef = useRef(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    function onDocClick(e) {
      if (!profileMenuRef.current) return;
      if (!profileMenuRef.current.contains(e.target)) setShowProfileMenu(false);
    }
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  useEffect(() => {
    // Pick up any deferred prompt captured before React mounted
    if (window.__deferredPWAInstallPrompt) {
      deferredPromptRef.current = window.__deferredPWAInstallPrompt;
      setCanInstall(true);
    }

    function handleBeforeInstallPrompt(e) {
      e.preventDefault();
      deferredPromptRef.current = e;
      setCanInstall(true);
    }

    function handleAppInstalled() {
      deferredPromptRef.current = null;
      setCanInstall(false);
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    // Also listen to custom relayed events from early-capture script
    window.addEventListener('pwa:beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('pwa:appinstalled', handleAppInstalled);

    const media = typeof window !== 'undefined' && typeof window.matchMedia === 'function'
      ? window.matchMedia('(display-mode: standalone)')
      : { matches: false, addEventListener: undefined, removeEventListener: undefined };
    const alreadyStandalone = !!(media && media.matches) || window.navigator.standalone === true;
    setIsStandalone(alreadyStandalone);
    function onChange(e) { setIsStandalone(!!(e && e.matches)); }
    media && media.addEventListener?.('change', onChange);

    // Detect iOS devices (no programmatic install prompt)
    try {
      const ua = (navigator.userAgent || navigator.vendor || window.opera || '').toLowerCase();
      setIsIOS(/iphone|ipad|ipod/.test(ua));
    } catch {}

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('pwa:beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('pwa:appinstalled', handleAppInstalled);
      media && media.removeEventListener?.('change', onChange);
    };
  }, []);

  async function onClickInstall() {
    const dp = deferredPromptRef.current;
    if (!dp) {
      // iOS/Safari: guide to Add to Home Screen
      if (isIOS && !isStandalone) {
        alert('To install CalDo on iPhone/iPad: tap the Share button, then choose "Add to Home Screen".');
      }
      return;
    }
    try {
      dp.prompt();
      const choice = await dp.userChoice;
      if (choice && choice.outcome === 'accepted') {
        setCanInstall(false);
        deferredPromptRef.current = null;
      }
    } catch {}
  }

  return (
    <header className="flex items-center justify-between mb-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">CalDo</h1>
        <p className="text-sm text-slate-500 mt-1">Minimalist calendar & todo.</p>
      </div>
      <div className="flex items-center gap-2">
        {!isStandalone && (canInstall || isIOS) && (
          <button onClick={onClickInstall} className="bg-indigo-600 text-white px-3 py-2 rounded-lg inline-flex items-center gap-2">
            <InstallIcon size={16} /> Install
          </button>
        )}
        <motion.div
          key={Number(currentStreak) || 0}
          initial={{ scale: 0.9, opacity: 0.8 }}
          animate={{ scale: [1, 1.08, 1], opacity: 1 }}
          transition={{ duration: 0.6, type: 'spring', stiffness: 250, damping: 18 }}
          className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-orange-50 text-orange-700 border border-orange-200"
          title="Current streak"
          aria-live="polite"
        >
          <motion.span
            initial={{ rotate: 0 }}
            animate={{ rotate: [0, -12, 12, -6, 0] }}
            transition={{ duration: 0.6 }}
            className="inline-flex"
          >
            <StreakIcon size={14} className="text-orange-600" />
          </motion.span>
          <span className="font-semibold tabular-nums">{Number(currentStreak) || 0}</span>
        </motion.div>
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


