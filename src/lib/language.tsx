"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { enTexts, texts as zhTexts, type Texts } from "@/lib/texts";

export type Language = "zh" | "en";

interface LanguageContextValue {
  language: Language;
  setLanguage: (language: Language) => void;
  texts: Texts;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

function detectLanguage(): Language {
  if (typeof window === "undefined") return "zh";
  const stored = window.localStorage.getItem("knit-language");
  if (stored === "zh" || stored === "en") return stored;
  return window.navigator.language.toLowerCase().startsWith("zh") ? "zh" : "en";
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("zh");

  useEffect(() => {
    setLanguageState(detectLanguage());
  }, []);

  const setLanguage = (next: Language) => {
    setLanguageState(next);
    window.localStorage.setItem("knit-language", next);
  };

  useEffect(() => {
    document.documentElement.lang = language === "zh" ? "zh-CN" : "en";
  }, [language]);

  const value = useMemo<LanguageContextValue>(() => ({
    language,
    setLanguage,
    texts: language === "en"
      ? ({ ...zhTexts, ...enTexts } as unknown as Texts)
      : (zhTexts as unknown as Texts),
  }), [language]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const value = useContext(LanguageContext);
  if (!value) throw new Error("useLanguage must be used inside LanguageProvider");
  return value;
}

export function useTexts() {
  return useLanguage().texts;
}
