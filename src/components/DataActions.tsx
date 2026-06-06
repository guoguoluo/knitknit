"use client";
import { exportData, importData } from "@/lib/store";
import { texts } from "@/lib/texts";
import { useRef } from "react";

export default function DataActions() {
  const fileRef = useRef<HTMLInputElement>(null);

  const handleExport = async () => {
    try {
      await exportData();
    } catch {
      alert(texts.exportFail);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!confirm(texts.importConfirm)) return;
    try {
      await importData(file);
      alert(texts.importSuccess);
      window.location.reload();
    } catch {
      alert(texts.importFail);
    }
  };

  return (
    <div className="flex gap-2 items-center">
      <button
        onClick={handleExport}
        className="text-xs text-gray-500 hover:text-purple-600 transition font-medium"
        title={texts.exportData}
      >
        ⬇ {texts.exportData}
      </button>
      <button
        onClick={() => fileRef.current?.click()}
        className="text-xs text-gray-500 hover:text-purple-600 transition font-medium"
        title={texts.importData}
      >
        ⬆ {texts.importData}
      </button>
      <input ref={fileRef} type="file" accept=".json" onChange={handleImport} className="hidden" />
    </div>
  );
}
