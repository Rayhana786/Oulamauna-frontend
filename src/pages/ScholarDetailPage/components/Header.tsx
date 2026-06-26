import React from "react";
import { MONO, SERIF } from "../constants";
import type { Language, ScholarDetail, UITranslation } from "../types";
import { Icon, ProfileLink, HoverBtn } from "./Icon";

interface Props {
  scholar: ScholarDetail; lang: Language; collapsed: boolean;
  t: UITranslation; onLangChange: (l: Language) => void;
}

export function Header({ scholar: s, lang, collapsed, t, onLangChange }: Props) {
  const [shareHov, setShareHov] = React.useState(false);
  const [linkHov,  setLinkHov]  = React.useState(false);
  const isRTL = lang === "AR";
  const name = s.name[lang] ?? s.name.EN ?? "";
  const homeLabel     = lang === "AR" ? "الرئيسية" : lang === "FR" ? "Accueil"  : "Home";
  const scholarsLabel = lang === "AR" ? "العلماء"  : lang === "FR" ? "Érudits"  : "Scholars";
  const iconBtn = (hov: boolean): React.CSSProperties => ({ width: "36px", height: "36px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: hov ? "#edeeeb" : "transparent", color: "#707974", border: "none", cursor: "pointer", transition: "background 0.15s" });

  return (
    <header style={{ position: "sticky", top: 0, zIndex: 50, backgroundColor: "rgba(249,250,247,0.97)", backdropFilter: "blur(8px)", borderBottom: "1px solid rgba(192,201,195,0.3)", padding: "16px 0" }}>
      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 64px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div style={{ marginBottom: collapsed ? 0 : "12px", flex: 1 }}>
            <div style={{ overflow: "hidden", maxHeight: collapsed ? "0px" : "24px", opacity: collapsed ? 0 : 1, transition: "max-height 0.35s cubic-bezier(0.4,0,0.2,1), opacity 0.25s ease", marginBottom: collapsed ? 0 : "8px" }}>
              <button onClick={() => window.history.back()} style={{ background: "none", border: "none", padding: 0, cursor: "pointer", color: "#707974", fontSize: "14px", lineHeight: 1, transition: "color 0.15s" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#0b4335")} onMouseLeave={(e) => (e.currentTarget.style.color = "#707974")}>←</button>
            </div>
            <div style={{ ...MONO, fontSize: "11px", color: "#707974", letterSpacing: "0.05em", marginBottom: collapsed ? "4px" : "8px", direction: isRTL ? "rtl" : "ltr", transition: "margin-bottom 0.25s ease" }}>
              {isRTL ? (<><span style={{ color: "#0b4335", fontWeight: 700 }}>{name}</span>{" < "}<a href="/scholars" style={{ color: "#707974", textDecoration: "none" }}>{scholarsLabel}</a>{" < "}<a href="/" style={{ color: "#707974", textDecoration: "none" }}>{homeLabel}</a></>) : (<><a href="/" style={{ color: "#707974", textDecoration: "none" }}>{homeLabel}</a>{" > "}<a href="/scholars" style={{ color: "#707974", textDecoration: "none" }}>{scholarsLabel}</a>{" > "}<span style={{ color: "#0b4335", fontWeight: 700 }}>{name}</span></>)}
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: "12px", flexWrap: "wrap", marginBottom: "2px" }}>
              <h1 style={{ ...SERIF, fontWeight: 700, color: "#0b4335", margin: 0, fontSize: collapsed ? "20px" : "32px", transition: "font-size 0.25s ease" }}>{name}</h1>
              <div style={{ ...MONO, fontSize: "9px", color: "#707974", letterSpacing: "0.18em", opacity: 0.8, display: collapsed ? "none" : "block" }}>
                Created by <ProfileLink name={s.createdBy} url={s.createdByUrl} />{"  •  "}{s.createdDate}
              </div>
            </div>
            <div style={{ overflow: "hidden", maxHeight: collapsed ? "0px" : "70px", opacity: collapsed ? 0 : 1, transition: "max-height 0.35s cubic-bezier(0.4,0,0.2,1), opacity 0.25s ease" }}>
              <p style={{ ...SERIF, fontSize: "13px", color: "#707974", fontStyle: "italic", margin: "2px 0 4px", lineHeight: 1.4 }}>{s.subtitle[lang] ?? s.subtitle.EN}</p>
              <div style={{ ...MONO, fontSize: "9px", color: "#707974", letterSpacing: "0.18em", opacity: 0.8 }}>
                Last updated by <ProfileLink name={s.lastUpdatedBy} url={s.lastUpdatedByUrl} />{"  •  "}{s.lastUpdatedDate}
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: "4px", paddingTop: "4px" }}>
            <button title="Share" onMouseEnter={() => setShareHov(true)} onMouseLeave={() => setShareHov(false)} style={iconBtn(shareHov)}><Icon name="share" size={18} /></button>
            <button title="Copy link" onMouseEnter={() => setLinkHov(true)} onMouseLeave={() => setLinkHov(false)} style={iconBtn(linkHov)}><Icon name="link" size={18} /></button>
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: collapsed ? "6px" : "8px", paddingTop: collapsed ? "6px" : "8px", borderTop: "1px solid rgba(192,201,195,0.15)", transition: "margin-top 0.35s cubic-bezier(0.4,0,0.2,1)" }}>
          <div style={{ display: "flex", gap: "4px", padding: "4px 8px", backgroundColor: "rgba(11,67,53,0.04)", border: "1px solid rgba(11,67,53,0.1)", borderRadius: "999px" }}>
            {(["AR", "EN", "FR"] as Language[]).map((l) => (
              <button key={l} onClick={() => onLangChange(l)} style={{ ...MONO, fontSize: "10px", fontWeight: 700, letterSpacing: "0.08em", padding: "4px 12px", borderRadius: "999px", border: "1px solid", borderColor: lang === l ? "#0b4335" : "rgba(192,201,195,0.5)", backgroundColor: lang === l ? "#0b4335" : "transparent", color: lang === l ? "#fff" : "#707974", cursor: "pointer", transition: "all 0.15s" }}>
                {l === "AR" ? "ARABIC" : l === "EN" ? "ENGLISH" : "FRENCH"}
              </button>
            ))}
          </div>
          <HoverBtn><Icon name="edit_note" size={14} />{t.editBtn}</HoverBtn>
        </div>
      </div>
    </header>
  );
}