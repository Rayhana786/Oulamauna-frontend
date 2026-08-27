import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import en from "../locales/en.json";
import ar from "../locales/ar.json";
import fr from "../locales/fr.json";

// 1. Define the locales object FIRST, and freeze it with "as const"
const locales = {
  EN: en,
  AR: ar,
  FR: fr,
} as const;

// 2. MAGIC: Automatically generate the Lang type from the keys above!
// Right now, this equals "EN" | "AR" | "FR". 
// If you add "TR: tr" below, it AUTOMATICALLY becomes "EN" | "AR" | "FR" | "TR"
export type Lang = keyof typeof locales;

// 3. Database Languages (Fetched dynamically from backend)
export interface DBLanguage {
  language_id: number;
  code: string;
  name: string;
}

// Resolves "a.b.c" dot-notation keys
function resolve(obj: Record<string, unknown>, key: string): string {
  return (
    (key.split(".").reduce<unknown>((cur, k) => {
      if (cur && typeof cur === "object") {
        return (cur as Record<string, unknown>)[k];
      }
      return undefined;
    }, obj) as string) ?? key
  );
}

interface LangCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string) => string;
  dbLanguages: DBLanguage[];
}

const LanguageContext = createContext<LangCtx>({
  lang: "EN",
  setLang: () => {},
  t: (k) => k,
  dbLanguages: [],
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    const savedLang = localStorage.getItem("oulamauna-language");
    // TypeScript now knows savedLang must be one of the keys in `locales`
    if (savedLang && savedLang in locales) {
      return savedLang as Lang;
    }
    return "EN";
  });

  const [dbLanguages, setDbLanguages] = useState<DBLanguage[]>([]);

  useEffect(() => {
    const apiUrl = import.meta.env?.VITE_API_URL || "http://localhost:5444";
    fetch(`${apiUrl}/api/languages`)
      .then((res) => res.json())
      .then((result) => {
        if (result.success) setDbLanguages(result.data);
      })
      .catch((err) => console.error("Failed to load languages from backend:", err));
  }, []);

  const setLang = (newLang: Lang) => {
    setLangState(newLang);
    localStorage.setItem("oulamauna-language", newLang);
  };

  const t = (key: string) => resolve(locales[lang] as Record<string, unknown>, key);

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, dbLanguages }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLang() {
  return useContext(LanguageContext);
}

// Helper: Safely converts DB code to UI Lang
export function getUILangFromDBCode(code: string): Lang {
  const upperCode = code.toUpperCase() as Lang;
  // Check if the uppercase code actually exists in our locales
  if (upperCode in locales) {
    return upperCode;
  }
  return "EN"; // Safe fallback
}