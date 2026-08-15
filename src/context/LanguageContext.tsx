import { createContext, useContext, useState, ReactNode } from "react";
import en from "../locales/en.json";
import ar from "../locales/ar.json";
import fr from "../locales/fr.json";

export type Lang = "EN" | "AR" | "FR";

const locales: Record<Lang, Record<string, unknown>> = {
  EN: en,
  AR: ar,
  FR: fr,
};

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
}

const LanguageContext = createContext<LangCtx>({
  lang: "EN",
  setLang: () => {},
  t: (k) => k,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  // Load the saved language when the application starts
  const [lang, setLangState] = useState<Lang>(() => {
    const savedLang = localStorage.getItem("oulamauna-language");

    if (savedLang === "EN" || savedLang === "AR" || savedLang === "FR") {
      return savedLang;
    }

    return "EN";
  });

  // Keep the same setLang logic, but also save the language
  const setLang = (newLang: Lang) => {
    setLangState(newLang);
    localStorage.setItem("oulamauna-language", newLang);
  };

  const t = (key: string) =>
    resolve(locales[lang] as Record<string, unknown>, key);

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLang() {
  return useContext(LanguageContext);
}