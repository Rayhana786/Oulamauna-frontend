// src/i18n.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// 🪄 MAGIC: Automatically import ALL .json files in the locales folder
const localeFiles = import.meta.glob('./locales/*.json', { eager: true }) as Record<string, { default: any }>;

const resources: Record<string, { translation: any }> = {};

// Build the resources object dynamically based on file names
for (const path in localeFiles) {
  // Extract language code from filename (e.g., './locales/es.json' -> 'es')
  const match = path.match(/\/locales\/([a-zA-Z0-9\-_]+)\.json$/);
  if (match) {
    const langCode = match[1].toLowerCase();
    resources[langCode] = {
      translation: localeFiles[path].default
    };
  }
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources, // Uses the dynamically generated resources
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      lookupLocalStorage: 'oulamauna-language',
      caches: ['localStorage'],
    },
    keySeparator: '.', // Enables dot notation like t('pages.home.title')
    nsSeparator: false,
  });

export default i18n;