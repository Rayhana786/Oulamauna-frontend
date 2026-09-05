// src/i18n.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector'; // 1. Import the language detector plugin

// Import your current locale files
import en from './locales/en.json';
import ar from './locales/ar.json';
import fr from './locales/fr.json';

const resources = {
  en: { translation: en },
  ar: { translation: ar },
  fr: { translation: fr },
};

i18n
  .use(LanguageDetector) // 2. Use the language detector
  .use(initReactI18next)
  .init({
    resources,
    lng: 'ar', // Set Arabic as the default language for new visitors
    fallbackLng: 'ar', // Fallback to Arabic if a translation key is missing
    
    interpolation: {
      escapeValue: false, // React already handles XSS protection, so we disable i18next's escaping
    },
    
    // 3. Language detection settings
    detection: {
      // Priority order: check localStorage first, then browser language, then HTML tag, etc.
      order: ['localStorage', 'navigator', 'htmlTag', 'path', 'subdomain'],
      
      // Link it to your specific localStorage key to respect the user's previous manual choice
      lookupLocalStorage: 'oulamauna-language', 
      
      // Automatically cache the chosen language in localStorage
      caches: ['localStorage'], 
    },
  });

export default i18n;