import React, { createContext, useCallback, useContext, useLayoutEffect, useMemo, useState } from "react";
import { getPalette, isPaletteId } from "./themes";
import { loadPalettePreference, loadThemePreference, savePalettePreference, saveThemePreference } from "./utils/storage";

const ThemeContext = createContext(null);

export function applyAppearance(mode, paletteId) {
  if (typeof document === "undefined") return;
  const palette = getPalette(paletteId);
  const resolvedMode = mode === "dark" ? "dark" : "light";
  const root = document.documentElement;
  root.dataset.palette = palette.id;
  root.classList.toggle("dark", resolvedMode === "dark");
  root.style.colorScheme = resolvedMode;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", palette.themeColor[resolvedMode]);
}

export function ThemeProvider({ children }) {
  const [mode, setModeState] = useState(() => (typeof window === "undefined" ? "light" : loadThemePreference()));
  const [palette, setPaletteState] = useState(() => {
    if (typeof window === "undefined") return "classic";
    const stored = loadPalettePreference();
    return isPaletteId(stored) ? stored : "classic";
  });

  useLayoutEffect(() => {
    const resolvedPalette = isPaletteId(palette) ? palette : "classic";
    applyAppearance(mode, resolvedPalette);
    saveThemePreference(mode);
    savePalettePreference(resolvedPalette);
  }, [mode, palette]);

  const setMode = useCallback((next) => {
    setModeState(next === "dark" ? "dark" : "light");
  }, []);

  const toggleMode = useCallback(() => {
    setModeState((current) => (current === "dark" ? "light" : "dark"));
  }, []);

  const setPalette = useCallback((id) => {
    if (isPaletteId(id)) setPaletteState(id);
  }, []);

  const value = useMemo(
    () => ({ mode, palette, setMode, setPalette, toggleMode }),
    [mode, palette, setMode, setPalette, toggleMode]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within ThemeProvider");
  return context;
}
