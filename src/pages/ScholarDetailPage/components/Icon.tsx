import React, { useState } from "react";
import { MONO, BTN_PRIMARY, LANG_LABELS } from "../constants";
import type { Language, UITranslation } from "../types";

export function Icon({ name, size = 20 }: { name: string; size?: number }) {
  return <span className="material-symbols-outlined" style={{ fontSize: `${size}px`, lineHeight: 1, userSelect: "none" }}>{name}</span>;
}

export function ProfileLink({ name, url, color = "#0b4335" }: { name: string; url: string; color?: string }) {
  const [hover, setHover] = useState(false);
  return (
    <a href={url} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{ color: hover ? "#285b4b" : color, fontWeight: 600, textDecoration: hover ? "underline" : "none", textUnderlineOffset: "2px", transition: "color 0.15s", cursor: "pointer" }}>
      {name}
    </a>
  );
}

export function HoverBtn({ children, onClick, style }: { children: React.ReactNode; onClick?: () => void; style?: React.CSSProperties }) {
  const [hov, setHov] = useState(false);
  return (
    <button onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ ...BTN_PRIMARY, backgroundColor: hov ? "#0b4335" : "transparent", color: hov ? "#fff" : "#0b4335", ...style }}>
      {children}
    </button>
  );
}

export function SharedBanner({ t }: { t: UITranslation }) {
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", marginBottom: "20px", padding: "5px 12px", backgroundColor: "rgba(11,67,53,0.05)", border: "1px solid rgba(11,67,53,0.12)", borderRadius: "6px" }}>
      <Icon name="public" size={13} />
      <span style={{ ...MONO, fontSize: "9px", color: "#707974", letterSpacing: "0.1em" }}>{t.sharedNote}</span>
    </div>
  );
}

export function EmptyLangState({ lang, t }: { lang: Language; t: UITranslation }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "16px", padding: "64px 32px", textAlign: "center", border: "2px dashed #c0c9c3", borderRadius: "12px", margin: "32px 0" }}>
      <Icon name="translate" size={40} />
      <p style={{ color: "#707974", fontSize: "15px", lineHeight: 1.6 }}>{t.noContent} <strong>{LANG_LABELS[lang]}</strong>.</p>
      <a href="#contribute" style={{ color: "#0b4335", fontWeight: 700, fontSize: "13px", textDecoration: "underline", textUnderlineOffset: "3px" }}>{t.contribute}</a>
    </div>
  );
}