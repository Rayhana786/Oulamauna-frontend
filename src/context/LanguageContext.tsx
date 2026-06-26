import { createContext, useContext, useState, ReactNode } from "react";
import en from "../locales/en.json";
import ar from "../locales/ar.json";
import fr from "../locales/fr.json";

export type Lang = "EN" | "AR" | "FR";

const locales: Record<Lang, Record<string, unknown>> = { EN: en, AR: ar, FR: fr };

// Resolves "a.b.c" dot-notation keys
function resolve(obj: Record<string, unknown>, key: string): string {
  return key.split(".").reduce<unknown>((cur, k) => {
    if (cur && typeof cur === "object") return (cur as Record<string, unknown>)[k];
    return undefined;
  }, obj) as string ?? key;
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
  const [lang, setLang] = useState<Lang>("EN");
  const t = (key: string) => resolve(locales[lang] as Record<string, unknown>, key);
  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLang() {
  return useContext(LanguageContext);
}