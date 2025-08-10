import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { FileUp as ImportIcon, FileDown as ExportIcon, User as UserIcon, Download as InstallIcon, Flame as StreakIcon, Moon, Sun } from "lucide-react";
import { loadThemePreference, saveThemePreference } from "../utils/storage";

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

  return <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200 flex items-center justify-center text-s font-semibold">{getInitials()}</div>;
}

export default function Header({ user, onSignInWithGoogle, onSignOut, onExportJSON, onImportJSON, currentStreak = 0 }) {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileMenuRef = useRef(null);
  const [canInstall, setCanInstall] = useState(false);
  const deferredPromptRef = useRef(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [theme, setTheme] = useState(() => (typeof window === 'undefined' ? 'light' : loadThemePreference()));

  useEffect(() => {
    function onDocClick(e) {
      if (!profileMenuRef.current) return;
      if (!profileMenuRef.current.contains(e.target)) setShowProfileMenu(false);
    }
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  // Theme mount + persistence
  useEffect(() => {
    try {
      const root = document.documentElement;
      if (theme === 'dark') root.classList.add('dark');
      else root.classList.remove('dark');
      saveThemePreference(theme);
    } catch {}
  }, [theme]);

  function toggleTheme() {
    setTheme((t) => (t === 'dark' ? 'light' : 'dark'));
  }

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
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">CalDo</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Minimalist calendar & todo.</p>
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
          className="inline-flex items-center gap-1.5 h-7 px-2 rounded-full text-s bg-orange-50 text-orange-700 border border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-900/50"
          title="Current streak"
          aria-live="polite"
        >
          <motion.span
            initial={{ rotate: 0 }}
            animate={{ rotate: [0, -12, 12, -6, 0] }}
            transition={{ duration: 0.6 }}
            className="inline-flex"
          >
            <StreakIcon size={16} className="text-orange-600" />
          </motion.span>
          <span className="font-semibold tabular-nums">{Number(currentStreak) || 0}</span>
        </motion.div>
        <div className="relative" ref={profileMenuRef}>
          <button
            onClick={() => setShowProfileMenu((v) => !v)}
            className="inline-flex items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-slate-400/50 dark:focus:ring-slate-500/40"
            aria-haspopup="menu"
            aria-expanded={showProfileMenu}
          >
            <Avatar user={user} />
          </button>
          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-lg rounded-lg p-2 z-50">
              <div className="px-2 py-1.5 text-xs text-slate-500 dark:text-slate-400">
                {user ? (
                  <span>
                    Signed in as <span className="font-medium text-slate-700 dark:text-slate-200">{user.displayName || user.email}</span>
                  </span>
                ) : (
                  <span>Not signed in</span>
                )}
              </div>
              <div className="h-px bg-slate-100 dark:bg-slate-800 my-1" />
              <button onClick={toggleTheme} className="w-full text-left px-3 py-2 rounded hover:bg-slate-50 dark:hover:bg-slate-800 inline-flex items-center gap-2">
                {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
                {theme === 'dark' ? 'Light' : 'Dark'} Mode
              </button>
              {!user && (
                <button onClick={onSignInWithGoogle} className="w-full text-left px-3 py-2 rounded hover:bg-slate-50 dark:hover:bg-slate-800 inline-flex items-center gap-2">
                  <UserIcon size={16} /> Sign in with Google
                </button>
              )}
              <button onClick={onExportJSON} className="w-full text-left px-3 py-2 rounded hover:bg-slate-50 dark:hover:bg-slate-800 inline-flex items-center gap-2">
                <ExportIcon size={16} /> Export
              </button>
              <label className="w-full text-left px-3 py-2 rounded hover:bg-slate-50 dark:hover:bg-slate-800 inline-flex items-center gap-2 cursor-pointer">
                <ImportIcon size={16} /> Import
                <input type="file" accept="application/json" className="hidden" onChange={(e) => e.target.files?.[0] && onImportJSON(e.target.files[0])} />
              </label>
              {user && (
                <>
                  <div className="h-px bg-slate-100 dark:bg-slate-800 my-1" />
                  <button onClick={onSignOut} className="w-full text-left px-3 py-2 rounded hover:bg-slate-50 dark:hover:bg-slate-800">Sign out</button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}


