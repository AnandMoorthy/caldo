import React, { useState } from "react";
import { Download, Loader2 } from "lucide-react";

export default function DataSection({ onExportAllData }) {
  const [status, setStatus] = useState("idle"); // idle | loading | success | error
  const [errorMessage, setErrorMessage] = useState("");

  async function handleExport() {
    if (typeof onExportAllData !== "function" || status === "loading") return;
    setStatus("loading");
    setErrorMessage("");
    try {
      await onExportAllData();
      setStatus("success");
    } catch (err) {
      console.error("Export failed", err);
      setErrorMessage(err?.message || "Export failed. Please try again.");
      setStatus("error");
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600 dark:text-slate-300">
        Download a JSON backup of your tasks, day notes, notes, journals, moments, habits, and
        recurring series. When you are signed in, the export reads from the cloud so nothing
        cached-only is missed.
      </p>
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <button
          type="button"
          onClick={handleExport}
          disabled={status === "loading" || typeof onExportAllData !== "function"}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 px-4 py-2.5 text-sm font-medium hover:bg-slate-800 dark:hover:bg-white disabled:opacity-60 disabled:cursor-not-allowed transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
        >
          {status === "loading" ? (
            <Loader2 size={16} className="animate-spin" aria-hidden />
          ) : (
            <Download size={16} aria-hidden />
          )}
          {status === "loading" ? "Preparing export…" : "Export all data"}
        </button>
        {status === "success" && (
          <p className="text-sm text-emerald-600 dark:text-emerald-400" role="status">
            Download started.
          </p>
        )}
        {status === "error" && (
          <p className="text-sm text-rose-600 dark:text-rose-400" role="alert">
            {errorMessage}
          </p>
        )}
      </div>
    </div>
  );
}
