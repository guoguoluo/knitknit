"use client";

import { useRef } from "react";
import { exportData, importData } from "@/lib/store";
import { useTexts } from "@/lib/language";

export default function DataActions() {
  const texts = useTexts();
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
    <div className="flex gap-0.5 items-center shrink-0" aria-label="Data actions">
      <button
        onClick={handleExport}
        className="text-sm text-[#6B6B6B] hover:text-[#2B2B2B] transition px-1.5 leading-none"
        title={texts.exportData}
        aria-label={texts.exportData}
      >
        {"\u2B07"}
      </button>
      <button
        onClick={() => fileRef.current?.click()}
        className="text-sm text-[#6B6B6B] hover:text-[#2B2B2B] transition px-1.5 leading-none"
        title={texts.importData}
        aria-label={texts.importData}
      >
        {"\u2B06"}
      </button>
      <input ref={fileRef} type="file" accept=".json" onChange={handleImport} className="hidden" style={{ display: "none" }} />
    </div>
  );
}
