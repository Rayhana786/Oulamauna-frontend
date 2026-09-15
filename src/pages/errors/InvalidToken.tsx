// src/pages/errors/InvalidToken.tsx
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useLang } from "../../context/LanguageContext";

const colors = {
  creamLight: "#fcfaf5",
  creamMid: "#f6efdc",
  forestGreen: "#0b4335",
  amber: "#b8860b",
};

const GREEN = colors.forestGreen;
const GOLD = colors.amber;
const BG = colors.creamLight;
const MUTED = "rgba(11, 67, 53, 0.6)";

const SERIF: React.CSSProperties = { fontFamily: "'Hanken Grotesk', sans-serif" };
const SANS: React.CSSProperties = { fontFamily: "'Inter', sans-serif" };

function Icon({ name, size = 24, style }: { name: string; size?: number; style?: React.CSSProperties }) {
  return (
    <span className="material-symbols-outlined" style={{ fontSize: `${size}px`, lineHeight: 1, userSelect: "none", ...style }}>
      {name}
    </span>
  );
}

function HoverBtn({
  children, to, variant = "primary", style,
}: {
  children: React.ReactNode; to: string; variant?: "primary" | "outline"; style?: React.CSSProperties;
}) {
  const [hov, setHov] = useState(false);
  
  const isPrimary = variant === "primary";
  
  return (
    <Link
      to={to}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{ 
        display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "8px", 
        padding: "12px 28px", border: isPrimary ? `2px solid ${GREEN}` : `2px solid ${MUTED}`, borderRadius: "8px", 
        backgroundColor: hov ? (isPrimary ? GREEN : MUTED) : isPrimary ? GREEN : "transparent", 
        color: hov ? BG : isPrimary ? BG : MUTED,
        fontSize: "11px", fontWeight: 700, letterSpacing: "0.15em", 
        cursor: "pointer", transition: "all 0.3s", fontFamily: "'Hanken Grotesk', sans-serif",
        textTransform: "uppercase", textDecoration: "none", ...style 
      }}
    >
      {children}
    </Link>
  );
}

const InvalidToken = () => {
  const { lang, t } = useLang();
  const isRTL = lang === "AR";

  return (
    <div dir={isRTL ? "rtl" : "ltr"} style={{ ...SANS, backgroundColor: BG, minHeight: "100vh", color: GREEN, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px", overflow: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;700&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap');
        .material-symbols-outlined { font-variation-settings: 'FILL' 0,'wght' 400,'GRAD' 0,'opsz' 24; font-family: 'Material Symbols Outlined'; display: inline-block; vertical-align: middle; }
      `}</style>

      <div style={{ textAlign: "center", maxWidth: "500px", width: "100%" }}>
        <h1 style={{ 
          fontSize: "clamp(80px, 15vw, 160px)", 
          fontWeight: 900, 
          color: colors.creamMid, 
          margin: 0, 
          lineHeight: 1, 
          letterSpacing: "-0.05em",
          fontFamily: "'Hanken Grotesk', sans-serif",
          userSelect: "none"
        }}>
          401
        </h1>

        <div style={{ position: "relative", marginTop: "-40px" }}>
          <div style={{ 
            width: "64px", height: "64px", borderRadius: "50%", 
            backgroundColor: BG,
            boxShadow: "0 4px 20px rgba(11, 67, 53, 0.08)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 16px"
          }}>
            <Icon name="schedule" size={32} style={{ color: GREEN }} />
          </div>

          <h2 style={{ ...SERIF, fontSize: "28px", fontWeight: 700, color: GREEN, margin: "0 0 12px" }}>
            {t("errors.invalidToken.title")}
          </h2>

          <div style={{ 
            width: "40px", height: "2px", backgroundColor: GOLD, 
            margin: "0 auto 16px", opacity: 0.6 
          }} />

          <p style={{ fontSize: "14px", color: MUTED, margin: "0 0 32px", lineHeight: 1.6, maxWidth: "320px", marginLeft: "auto", marginRight: "auto" }}>
            {t("errors.invalidToken.desc")}
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px", maxWidth: "280px", margin: "0 auto" }}>
            <HoverBtn to="/login" variant="primary">
              <Icon name="login" size={16} />
              {t("errors.invalidToken.login")}
            </HoverBtn>
            
            <HoverBtn to="/contact" variant="outline">
              {t("errors.invalidToken.help")}
            </HoverBtn>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvalidToken;