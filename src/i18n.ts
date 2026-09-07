// src/i18n.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector'; // 1. استيراد المكتبة الجديدة

// استيراد ملفاتك الحالية
import en from './locales/en.json';
import ar from './locales/ar.json';
import fr from './locales/fr.json';

const resources = {
  en: { translation: en },
  ar: { translation: ar },
  fr: { translation: fr },
};

i18n
  .use(LanguageDetector) // 2. استخدام كاشف اللغة
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
    // 3. إعدادات الكشف عن اللغة
    detection: {
      // ترتيب الأولوية: نتحقق من localStorage أولاً، ثم لغة المتصفح، ثم إعدادات HTML
      order: ['localStorage', 'navigator', 'htmlTag', 'path', 'subdomain'],
      
      // نربطها بمفتاح localStorage الخاص بك لكي تحترم اختيار المستخدم السابق
      lookupLocalStorage: 'oulamauna-language', 
      
      // نحفظ اللغة المختارة تلقائياً في localStorage
      caches: ['localStorage'], 
    },
  });

export default i18n;