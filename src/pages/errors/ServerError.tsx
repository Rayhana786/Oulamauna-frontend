// src/pages/errors/ServerError.tsx
import React, { useState } from "react";
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
  children, onClick, style,
}: {
  children: React.ReactNode; onClick?: () => void; style?: React.CSSProperties;
}) {
  const [hov, setHov] = React.useState(false);
  
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{ 
        display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "8px", 
        padding: "12px 28px", border: `2px solid ${GREEN}`, borderRadius: "8px", 
        backgroundColor: hov ? GREEN : "transparent", color: hov ? BG : GREEN,
        fontSize: "11px", fontWeight: 700, letterSpacing: "0.15em", 
        cursor: "pointer", transition: "all 0.3s", fontFamily: "'Hanken Grotesk', sans-serif",
        textTransform: "uppercase", ...style 
      }}
    >
      {children}
    </button>
  );
}

const ServerError = () => {
  const { lang, t } = useLang();
  const isRTL = lang === "AR";

  // 1. Get translations
  const rawTitle = t("errors.server.title");
  const rawDesc = t("errors.server.desc");
  const rawBtn = t("errors.server.button");

  // 2. Fallback to hardcoded English if the context is broken (t returns the key itself)
  const title = rawTitle === "errors.server.title" ? "Patience is Key" : rawTitle;
  const desc = rawDesc === "errors.server.desc" ? "Our library is currently undergoing a brief restoration. Please try again in a few moments." : rawDesc;
  const btnText = rawBtn === "errors.server.button" ? "REFRESH PAGE" : rawBtn;

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
          500
        </h1>

        <div style={{ position: "relative", marginTop: "-40px" }}>
          <div style={{ 
            width: "64px", height: "64px", borderRadius: "50%", 
            backgroundColor: BG,
            boxShadow: "0 4px 20px rgba(11, 67, 53, 0.08)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 16px"
          }}>
            <Icon name="error" size={32} style={{ color: GREEN }} />
          </div>

          <h2 style={{ ...SERIF, fontSize: "28px", fontWeight: 700, color: GREEN, margin: "0 0 12px" }}>
            {title}
          </h2>

          <div style={{ 
            width: "40px", height: "2px", backgroundColor: GOLD, 
            margin: "0 auto 16px", opacity: 0.6 
          }} />

          <p style={{ fontSize: "14px", color: MUTED, margin: "0 0 32px", lineHeight: 1.6, maxWidth: "320px", marginLeft: "auto", marginRight: "auto" }}>
            {desc}
          </p>

          <HoverBtn onClick={() => window.location.reload()}>
            <Icon name="refresh" size={16} />
            {btnText}
          </HoverBtn>
        </div>
      </div>
    </div>
  );
};

export default ServerError;