// src/components/LanguageSwitcher.tsx
import React, { useState } from "react";

type Language = "EN" | "AR" | "FR";

interface LanguageSwitcherProps {
  currentLang: Language;
  setCurrentLang: (lang: Language) => void;
}

const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  currentLang,
  setCurrentLang,
}) => {
  const [langOpen, setLangOpen] = useState(false);

  const languages = [
    { code: "EN" as Language, label: "English" },
    { code: "AR" as Language, label: "العربية" },
    { code: "FR" as Language, label: "Français" },
  ];

  return (
    <div
      className={`fixed bottom-8 z-50 ${
        currentLang === "AR" ? "left-6" : "right-6"
      }`}
    >
      {/* Small Dropdown */}
      {langOpen && (
        <div className="mb-2 w-36 bg-white rounded-2xl shadow-xl border border-[#D8BF86]/30 overflow-hidden">
          {languages
            .sort((a, b) =>
              a.code === currentLang ? 1 : b.code === currentLang ? -1 : 0
            )
            .map((l) => (
              <button
                key={l.code}
                onClick={() => {
                  setCurrentLang(l.code);
                  setLangOpen(false);
                }}
                className={`w-full px-4 py-2.5 text-left text-xs transition-all
                  ${l.code === currentLang 
                    ? "bg-[#C9A84C] text-[#285B4B] font-semibold" 
                    : "text-[#285B4B] hover:bg-[#F8F1E3]"
                  }`}
              >
                {l.label}
              </button>
            ))}
        </div>
      )}

      {/* Very Small Gold Button */}
      <button
        onClick={() => setLangOpen(!langOpen)}
        className="flex items-center gap-1.5 bg-[#C9A84C] hover:bg-[#D8BF86] 
                   text-[#285B4B] px-4 py-2 rounded-2xl 
                   text-[10px] font-black tracking-[0.08em] 
                   shadow-md hover:shadow-lg active:scale-95 
                   transition-all duration-200"
      >
        {currentLang}

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