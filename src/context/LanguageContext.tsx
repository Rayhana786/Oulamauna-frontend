// src/context/LanguageContext.tsx
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useTranslation } from "react-i18next";
import "../i18n"; // استيراد ملف الإعدادات لتهيئة المحرك

// الحفاظ على سحرك في توليد الأنواع تلقائياً (Type Safety)
import en from "../locales/en.json";
import ar from "../locales/ar.json";
import fr from "../locales/fr.json";

const locales = {
  EN: en,
  AR: ar,
  FR: fr,
} as const;

export type Lang = keyof typeof locales;

export interface DBLanguage {
  language_id: number;
  code: string;
  name: string;
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
  // استخدام react-i18next في الخلفية
  const { i18n } = useTranslation();
  
  const [dbLanguages, setDbLanguages] = useState<DBLanguage[]>([]);

  // جلب اللغات من قاعدة البيانات (نفس الكود الخاص بك تماماً)
  useEffect(() => {
    const apiUrl = import.meta.env?.VITE_API_URL || "http://localhost:5444";
    fetch(`${apiUrl}/api/languages`)
      .then((res) => res.json())
      .then((result) => {
        if (result.success) setDbLanguages(result.data);
      })
      .catch((err) => console.error("Failed to load languages from backend:", err));
  }, []);

  // دالة تغيير اللغة: تحدث المحرك وتخزن في localStorage
  const setLang = (newLang: Lang) => {
    const lowerLang = newLang.toLowerCase(); // i18next يفضل الأحرف الصغيرة (en, ar, fr)
    i18n.changeLanguage(lowerLang);
    localStorage.setItem("oulamauna-language", lowerLang);
  };

  // دالة t من react-i18next تدعم الـ Dot Notation تلقائياً! 
  // لذا t("tabs.works") ستعمل بدون أي تعديل
  const t = i18n.t;

  // تحويل لغة المحرك (الصغيرة) إلى النوع الخاص بك (الكبيرة EN, AR, FR)
  const currentLang = (i18n.language?.toUpperCase() as Lang) || "EN";

  return (
    <LanguageContext.Provider value={{ lang: currentLang, setLang, t, dbLanguages }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLang() {
  return useContext(LanguageContext);
}

// Helper: Safely converts DB code to UI Lang (نفس دالتك تماماً)
export function getUILangFromDBCode(code: string): Lang {
  const upperCode = code.toUpperCase() as Lang;
  if (upperCode in locales) {
    return upperCode;
  }
  return "EN";
}