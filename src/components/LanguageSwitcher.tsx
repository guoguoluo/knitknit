"use client";

import { useLanguage } from "@/lib/language";

export default function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="languageSwitch" aria-label="Language switcher">
      <button
        type="button"
        className={language === "zh" ? "is-active" : ""}
        onClick={() => setLanguage("zh")}
        aria-pressed={language === "zh"}
      >
        {"\u4E2D"}
      </button>
      <button
        type="button"
        className={language === "en" ? "is-active" : ""}
        onClick={() => setLanguage("en")}
        aria-pressed={language === "en"}
      >
        EN
      </button>
    </div>
  );
}
