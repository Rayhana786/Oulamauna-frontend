// src/components/LanguageSwitcher.tsx
import React, { useState } from "react";
import { useLang } from "../context/LanguageContext";

const LanguageSwitcher: React.FC = () => {
  const { lang, setLang, dbLanguages, isLoading } = useLang();
  const [langOpen, setLangOpen] = useState(false);

  // Show a subtle loading state while fetching languages from the database
  if (isLoading) {
    return (
      <div className={`fixed bottom-8 z-50 ${lang === "AR" ? "left-6" : "right-6"}`}>
        <div className="flex items-center gap-1.5 bg-[#B78726]/50 text-[#285B4B] px-4 py-2 rounded-2xl text-[10px] font-black tracking-[0.08em] shadow-md">
          ...
        </div>
      </div>
    );
  }

  return (
    <div
      className={`fixed bottom-8 z-50 ${
        lang === "AR" ? "left-6" : "right-6"
      }`}
    >
      {/* Small Dropdown */}
      {langOpen && (
        <div className="mb-2 w-36 bg-white rounded-2xl shadow-xl border border-[#D8BF86]/30 overflow-hidden">
          {dbLanguages.map((l) => (
            <button
              key={l.language_id}
              onClick={() => {
                setLang(l.code); // l.code is already lowercase (e.g., "en", "ar", "es")
                setLangOpen(false);
              }}
              // Changed text-left to text-start for proper RTL alignment in Arabic
              className={`w-full px-4 py-2.5 text-start text-xs transition-all
                ${l.code.toUpperCase() === lang 
                  ? "bg-[#C9A84C] text-[#285B4B] font-semibold" 
                  : "text-[#285B4B] hover:bg-[#F8F1E3]"
                }`}
            >
              {l.name} {/* Displays the name directly from the database (e.g., "English", "العربية") */}
            </button>
          ))}
        </div>
      )}

      {/* Very Small Gold Button */}
      <button
        onClick={() => setLangOpen(!langOpen)}
        className="flex items-center gap-1.5 bg-[#B78726] hover:bg-[#D8BF86] 
                   text-[#285B4B] px-4 py-2 rounded-2xl 
                   text-[10px] font-black tracking-[0.08em] 
                   shadow-md hover:shadow-lg active:scale-95 
                   transition-all duration-200"
      >
        {lang}

        <svg 
          width="9" 
          height="9" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="4" 
          strokeLinecap="round" 
          strokeLinejoin="round"
          className={`transition-transform ${langOpen ? "rotate-180" : ""}`}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
    </div>
  );
};

export default LanguageSwitcher;