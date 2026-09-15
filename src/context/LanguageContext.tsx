// src/context/LanguageContext.tsx
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useTranslation } from "react-i18next";
import "../i18n"; 

// Changed to string to allow dynamic languages from DB
export type Lang = string; 

export interface DBLanguage {
  language_id: number;
  code: string; // e.g., "en", "ar", "fr", "es"
  name: string; // e.g., "English", "العربية", "Español"
}

interface LangCtx {
  lang: Lang;
  setLang: (l: string) => void;
  t: (key: string) => string;
  dbLanguages: DBLanguage[];
  isLoading: boolean;
}

const LanguageContext = createContext<LangCtx>({
  lang: "EN",
  setLang: () => {},
  t: (k) => k,
  dbLanguages: [],
  isLoading: true,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const { i18n } = useTranslation();
  const [dbLanguages, setDbLanguages] = useState<DBLanguage[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const apiUrl = import.meta.env?.VITE_API_URL || "http://localhost:5444";
    
    fetch(`${apiUrl}/api/languages`)
      .then((res) => res.json())
      .then((result) => {
        if (result.success) {
          // 🛡️ SMART FILTER: Only keep languages that exist in DB AND have a JSON file loaded in i18n
          const availableLangCodes = Object.keys(i18n.store.data || {});
          const validLangs = result.data.filter((dbLang: DBLanguage) => 
            availableLangCodes.includes(dbLang.code.toLowerCase())
          );
          setDbLanguages(validLangs);
        }
      })
      .catch((err) => console.error("Failed to load languages from backend:", err))
      .finally(() => setIsLoading(false));
  }, []); // Runs once on mount

  const setLang = (newLangCode: string) => {
    const lowerLang = newLangCode.toLowerCase();
    i18n.changeLanguage(lowerLang);
    localStorage.setItem("oulamauna-language", lowerLang);
  };

  const t = i18n.t;
  const currentLang = (i18n.language?.split('-')[0]?.toUpperCase() as Lang) || "EN";

  return (
    <LanguageContext.Provider value={{ lang: currentLang, setLang, t, dbLanguages, isLoading }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLang() {
  return useContext(LanguageContext);
}

// Helper: Safely converts DB code to uppercase UI format
export function getUILangFromDBCode(code: string): Lang {
  return code.toUpperCase();
}