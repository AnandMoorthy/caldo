import React from "react";
import { Check, Moon, Sun } from "lucide-react";
import { PALETTES } from "../../themes";
import { useTheme } from "../../theme.jsx";

function PreviewPane({ page, surface, ink, muted, accent }) {
  return (
    <div className="h-full p-2 flex flex-col justify-between" style={{ backgroundColor: page }}>
      <div className="h-1.5 w-8 rounded-full" style={{ backgroundColor: muted }} />
      <div className="rounded-md px-1.5 py-1 flex items-center gap-1" style={{ backgroundColor: surface }}>
        <div className="h-1.5 flex-1 rounded-full" style={{ backgroundColor: ink, opacity: 0.8 }} />
        <div className="h-3 w-3 rounded-sm shrink-0" style={{ backgroundColor: accent }} />
      </div>
    </div>
  );
}

function PaletteCard({ palette, selected, onSelect }) {
  const { preview } = palette;
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onSelect}
      className={`text-left rounded-xl border p-3 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
        selected
          ? "border-indigo-500 ring-2 ring-indigo-500/40 bg-white dark:bg-slate-900"
          : "border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-950/40 hover:border-slate-300 dark:hover:border-slate-600"
      }`}
    >
      <div className="grid grid-cols-2 h-16 rounded-lg overflow-hidden border border-black/5 dark:border-white/10">
        <PreviewPane
          page={preview.page}
          surface={preview.surface}
          ink={preview.ink}
          muted={preview.muted}
          accent={preview.accent}
        />
        <PreviewPane
          page={preview.darkPage}
          surface={preview.darkSurface}
          ink={preview.darkInk}
          muted={preview.darkMuted}
          accent={preview.accent}
        />
      </div>
      <div className="mt-3 flex items-start justify-between gap-2">
        <div>
          <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{palette.name}</div>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{palette.description}</p>
        </div>
        {selected && (
          <span className="inline-flex items-center gap-1 shrink-0 text-xs font-medium text-indigo-600 dark:text-indigo-300">
            <Check size={14} />
            Selected
          </span>
        )}
      </div>
    </button>
  );
}

export default function AppearanceSection() {
  const { mode, setMode, palette, setPalette } = useTheme();

  return (
    <div className="space-y-5">
      <div>
        <div className="text-sm font-medium text-slate-800 dark:text-slate-200 mb-2">Mode</div>
        <div
          className="inline-flex rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 p-1"
          role="group"
          aria-label="Color mode"
        >
          <button
            type="button"
            aria-pressed={mode === "light"}
            onClick={() => setMode("light")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              mode === "light"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100"
            }`}
          >
            <Sun size={15} /> Light
          </button>
          <button
            type="button"
            aria-pressed={mode === "dark"}
            onClick={() => setMode("dark")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              mode === "dark"
                ? "bg-white dark:bg-slate-100 text-slate-900 shadow-sm"
                : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100"
            }`}
          >
            <Moon size={15} /> Dark
          </button>
        </div>
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
          The profile menu can still switch light and dark for the theme you pick.
        </p>
      </div>

      <div>
        <div className="text-sm font-medium text-slate-800 dark:text-slate-200 mb-2">Theme</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {PALETTES.map((item) => (
            <PaletteCard
              key={item.id}
              palette={item}
              selected={palette === item.id}
              onSelect={() => setPalette(item.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
