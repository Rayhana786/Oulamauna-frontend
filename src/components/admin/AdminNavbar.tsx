import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPortal } from "react-dom"; // ✅ ADDED: Renders outside parent stacking contexts
import { useLang } from "../../context/LanguageContext";

/* ------------------------------------------------------------------ */
/*  Design tokens — Oulamnauna admin palette                          */
/* ------------------------------------------------------------------ */
const colors = {
  creamLight: "#fcfaf5",
  forestGreen: "#0b4335",
  red: "#b3261e", 
};

const fonts = {
  headline: "'Hanken Grotesk', sans-serif",
  body: "'Inter', sans-serif",
};

/* ------------------------------------------------------------------ */
/*  Icon                                                                */
/* ------------------------------------------------------------------ */
const Icon: React.FC<{ name: string; size?: number }> = ({ name, size = 16 }) => (
  <span
    className="material-symbols-outlined"
    style={{ fontSize: size, lineHeight: 1, fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}
  >
    {name}
  </span>
);

/* ------------------------------------------------------------------ */
/*  Navbar                                                              */
/* ------------------------------------------------------------------ */
type AdminNavbarProps = {
  pageTitleKey: string;
  actions?: React.ReactNode;
};

const AdminNavbar: React.FC<AdminNavbarProps> = ({ pageTitleKey, actions }) => {
  const { t, lang, setLang, dbLanguages, isLoading } = useLang();
  const isRTL = lang === "AR";

  const [isLangOpen, setIsLangOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // ✅ Track exact screen position for the portal dropdown
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left?: number; right?: number }>({ top: 0 });

  useEffect(() => {
    if (isLangOpen && dropdownRef.current) {
      const rect = dropdownRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 8,
        left: rect.left,
        right: window.innerWidth - rect.right,
      });
    }
  }, [isLangOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsLangOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header
      dir={isRTL ? "rtl" : "ltr"}
      style={{
        width: "100%",
        flexShrink: 0,
        backgroundColor: "rgba(252, 250, 245, 0.9)",
        backdropFilter: "blur(8px)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "16px 24px",
        borderBottom: `1px solid ${colors.forestGreen}`,
        gap: 16,
      }}
    >
      <h1
        style={{
          fontFamily: fonts.headline,
          fontSize: 19,
          lineHeight: "24px",
          fontWeight: 600,
          color: colors.forestGreen,
          margin: 0,
          whiteSpace: "nowrap",
        }}
      >
        {t(pageTitleKey)}
      </h1>

      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {actions}

                {/* ✅ Language Switcher - Simple Circle Button */}
        <div style={{ position: "relative" }} ref={dropdownRef}>
          <button
            onClick={() => setIsLangOpen(!isLangOpen)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: colors.forestGreen,
              padding: 8,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "background 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(11, 67, 53, 0.08)")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
            title="Change Language"
          >
            <Icon name="language" size={22} />
          </button>

          {/* ✅ PORTAL: Renders directly to document.body to bypass ALL parent z-index/overflow issues */}
          {isLangOpen &&
            createPortal(
              <div
                style={{
                  position: "fixed",
                  top: dropdownPosition.top,
                  ...(isRTL ? { left: dropdownPosition.left } : { right: dropdownPosition.right }),
                  backgroundColor: colors.creamLight, // ✅ 100% SOLID COLOR
                  border: `1px solid ${colors.forestGreen}`,
                  borderRadius: 8,
                  boxShadow: "0 4px 12px rgba(11, 67, 53, 0.15)",
                  zIndex: 99999, // ✅ EXTREMELY HIGH Z-INDEX
                  overflow: "hidden",
                  minWidth: 140,
                  opacity: 1, // ✅ FORCE OPAQUE
                }}
              >
                {isLoading ? (
                  <div style={{ padding: "8px 12px", fontSize: 12, color: colors.forestGreen, backgroundColor: colors.creamLight }}>
                    {isRTL ? "جاري التحميل..." : "Loading..."}
                  </div>
                ) : dbLanguages.length === 0 ? (
                  <div style={{ padding: "8px 12px", fontSize: 12, color: colors.forestGreen, backgroundColor: colors.creamLight }}>
                    {isRTL ? "لا توجد لغات" : "No languages"}
                  </div>
                ) : (
                  dbLanguages.map((dbLang) => {
                    const isActive = lang.toLowerCase() === dbLang.code.toLowerCase();
                    return (
                      <button
                        key={dbLang.language_id}
                        onClick={() => {
                          setLang(dbLang.code);
                          setIsLangOpen(false);
                        }}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          width: "100%",
                          padding: "10px 16px",
                          border: "none",
                          backgroundColor: isActive ? "rgba(11, 67, 53, 0.15)" : colors.creamLight, // ✅ SOLID BACKGROUND
                          color: colors.forestGreen,
                          fontFamily: fonts.body,
                          fontSize: 14,
                          fontWeight: isActive ? 600 : 400,
                          cursor: "pointer",
                          transition: "background 0.15s",
                          gap: 8,
                          flexDirection: isRTL ? "row-reverse" : "row",
                        }}
                        onMouseEnter={(e) => {
                          if (!isActive) e.currentTarget.style.backgroundColor = "rgba(11, 67, 53, 0.08)";
                        }}
                        onMouseLeave={(e) => {
                          if (!isActive) e.currentTarget.style.backgroundColor = colors.creamLight;
                        }}
                      >
                        {isActive && <Icon name="check" size={16} />}
                        <span>{dbLang.name}</span>
                      </button>
                    );
                  })
                )}
              </div>,
              document.body // ✅ This is the magic: renders outside the header/chart hierarchy
            )}
        </div>

        {/* ✅ Notification Bell */}
        <button
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: colors.forestGreen,
            padding: 8,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
            transition: "background 0.2s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(11, 67, 53, 0.08)")}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
          title="Notifications"
        >
          <Icon name="notifications" size={22} />
          <span
            style={{
              position: "absolute",
              top: 6,
              [isRTL ? "left" : "right"]: 6,
              width: 8,
              height: 8,
              backgroundColor: colors.red,
              borderRadius: "50%",
              border: `2px solid ${colors.creamLight}`,
            }}
          />
        </button>

        {/* View Public Site Button */}
        <Link
          to="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "7px 14px",
            backgroundColor: colors.forestGreen,
            border: `1px solid ${colors.forestGreen}`,
            borderRadius: 8,
            fontFamily: fonts.body,
            fontSize: 13,
            fontWeight: 500,
            color: colors.creamLight,
            textDecoration: "none",
            whiteSpace: "nowrap",
            transition: "opacity 0.15s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
        >
          <Icon name="public" size={16} />
          {isRTL ? "عرض الموقع العام" : lang === "FR" ? "Voir le site public" : "View Public Site"}
        </Link>
      </div>
    </header>
  );
};

export default AdminNavbar;