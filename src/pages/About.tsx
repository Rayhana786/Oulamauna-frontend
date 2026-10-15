// src/pages/AboutPage.tsx
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useLang } from "../context/LanguageContext";
import heroImage from "../assets/library-2.jpg";
import archiveImage from "../assets/library-2.jpg";

const MONO: React.CSSProperties = { fontFamily: "'JetBrains Mono', monospace" };
const GROTESK: React.CSSProperties = { fontFamily: "'Hanken Grotesk', sans-serif" };
const INTER: React.CSSProperties = { fontFamily: "'Inter', sans-serif" };

function Icon({ name, size = 16 }: { name: string; size?: number }) {
  return (
    <span className="material-symbols-outlined" style={{ fontSize: `${size}px`, lineHeight: 1 }}>
      {name}
    </span>
  );
}

function TextLink({ children, isRTL, to = "#" }: { children: React.ReactNode; isRTL: boolean; to?: string }) {
  const [hov, setHov] = useState(false);
  return (
    <Link to={to} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ ...MONO, fontSize: "11px", fontWeight: 700, letterSpacing: "0.05em", color: "#1e4d3a", display: "inline-flex", alignItems: "center", gap: "6px", textDecoration: "none", borderBottom: hov ? "2px solid #C9A84C" : "2px solid transparent", paddingBottom: "2px", transition: "border-color 0.3s", marginTop: "8px" }}>
      {children}
      <Icon name={isRTL ? "arrow_back" : "arrow_forward"} size={16} />
    </Link>
  );
}

const AboutPage: React.FC = () => {
  const { lang, t } = useLang();
  const isRTL = lang === "AR";

  return (
    <div dir={isRTL ? "rtl" : "ltr"} style={{ fontFamily: "'Inter', sans-serif", minHeight: "100vh", backgroundColor: "#fbf9f4", backgroundImage: "radial-gradient(circle at 50% 0%, rgba(201,168,76,0.08) 0%, transparent 60%)", color: "#1e4d3a" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&family=Source+Serif+4:wght@400;600;700&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap');
        .material-symbols-outlined { font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24; font-family: 'Material Symbols Outlined'; display: inline-block; vertical-align: middle; }
        * { box-sizing: border-box; }
        @media (max-width: 900px) {
  .about-grid { grid-template-columns: 1fr !important; }
  .about-grid > * { grid-column: 1 !important; grid-row: auto !important; }
  .about-image { grid-row: auto !important; margin-top: 20px; }
  .about-intro { grid-template-columns: 1fr !important; gap: 24px !important; }
}
      `}</style>

      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "64px 40px 0" }}>
        <div style={{ position: "relative", overflow: "hidden", borderRadius: "16px", padding: "64px 48px", marginBottom: "56px", border: "1px solid rgba(201,168,76,0.25)", backgroundImage: `url(${heroImage})`, backgroundSize: "cover", backgroundPosition: "center" }}>
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(120deg, rgba(30,77,58,0.92) 0%, rgba(30,77,58,0.85) 45%, rgba(30,77,58,0.6) 100%)" }} />
          <div style={{ position: "relative", zIndex: 1 }}>
            <p style={{ ...MONO, fontSize: "11px", color: "#C9A84C", letterSpacing: "0.2em", marginBottom: "16px", fontWeight: 700 }}>
              {t("about.breadcrumb")}
            </p>
            <h1 style={{ ...GROTESK, fontSize: "40px", fontWeight: 700, color: "#fbf9f4", margin: "0 0 20px 0", lineHeight: 1.2 }}>
              {t("about.title")}
            </h1>
            <p style={{ ...INTER, fontSize: "18px", color: "rgba(251,249,244,0.85)", lineHeight: 1.7, maxWidth: "640px", margin: 0 }}>
              {t("about.heroDescription")}
            </p>
          </div>
        </div>

        <div className="about-intro" style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: "48px", marginBottom: "72px" }}>
          <p style={{ ...INTER, fontSize: "18px", color: "#1e4d3a", lineHeight: 1.7, margin: 0 }}>
            {t("about.introLeft")}
          </p>
          <p style={{ ...INTER, fontSize: "15px", color: "rgba(30,77,58,0.7)", lineHeight: 1.75, margin: 0 }}>
            {t("about.introRight")}
          </p>
        </div>

        <div className="about-grid" style={{ display: "grid", gridTemplateColumns: "220px 1fr 320px", columnGap: "48px", rowGap: "56px", marginBottom: "72px" }}>
          <div style={{ gridColumn: 1, gridRow: 1 }}>
            <p style={{ ...MONO, fontSize: "11px", color: "#C9A84C", letterSpacing: "0.15em", margin: "0 0 12px 0", fontWeight: 700 }}>
              {t("about.whatLabel")}
            </p>
            <p style={{ ...INTER, fontSize: "15px", color: "#1e4d3a", lineHeight: 1.6, margin: 0, fontWeight: 600 }}>
              {t("about.whatBody")}
            </p>
          </div>

          <div style={{ gridColumn: 2, gridRow: 1 }}>
            <p style={{ ...MONO, fontSize: "11px", color: "#1e4d3a", letterSpacing: "0.15em", fontWeight: 700, margin: "0 0 16px 0", textTransform: "uppercase" }}>
              {t("about.archiveLabel")}
            </p>
            <p style={{ ...INTER, fontSize: "15px", color: "rgba(30,77,58,0.8)", lineHeight: 1.75, margin: "0 0 16px 0" }}>
              {t("about.archiveP1")}
            </p>
            <p style={{ ...INTER, fontSize: "15px", color: "rgba(30,77,58,0.8)", lineHeight: 1.75, margin: 0 }}>
              {t("about.archiveP2")}
            </p>
          </div>

          <div className="about-image" style={{ gridColumn: 3, gridRow: "1 / span 2", borderRadius: "16px", overflow: "hidden", border: "1px solid rgba(30,77,58,0.1)", minHeight: "280px", backgroundColor: "#F5F3EC" }}>
            <img src={archiveImage} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
          </div>

          <div style={{ gridColumn: 1, gridRow: 2 }}>
            <p style={{ ...MONO, fontSize: "11px", color: "#C9A84C", letterSpacing: "0.15em", margin: "0 0 12px 0", fontWeight: 700 }}>
              {t("about.accessLabel")}
            </p>
            <p style={{ ...INTER, fontSize: "15px", color: "#1e4d3a", lineHeight: 1.6, margin: 0, fontWeight: 600 }}>
              {t("about.accessBody")}
            </p>
          </div>

          <div style={{ gridColumn: 2, gridRow: 2 }}>
            <p style={{ ...MONO, fontSize: "11px", color: "#1e4d3a", letterSpacing: "0.15em", fontWeight: 700, margin: "0 0 16px 0", textTransform: "uppercase" }}>
              {t("about.teamLabel")}
            </p>
            <p style={{ ...INTER, fontSize: "15px", color: "rgba(30,77,58,0.7)", lineHeight: 1.7, margin: "0 0 8px 0" }}>
              {t("about.accessSub")}
            </p>
            <p style={{ ...INTER, fontSize: "15px", color: "rgba(30,77,58,0.8)", lineHeight: 1.75, margin: "0 0 20px 0" }}>
              {t("about.teamBody")}
            </p>
            <TextLink isRTL={isRTL} to="/scholars">{t("about.exploreLink")}</TextLink>
          </div>
        </div>
      </div>

      <div style={{ backgroundColor: "#F2F1ED", padding: "80px 40px 120px", borderTop: "1px solid rgba(30,77,58,0.1)" }}>
        <div style={{ maxWidth: "520px", margin: "0 auto", textAlign: "center" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", marginBottom: "24px", color: "#C9A84C" }}>
            <Icon name="alternate_email" size={16} />
            <span style={{ ...MONO, fontSize: "11px", letterSpacing: "0.15em", fontWeight: 700 }}>
              {t("about.ctaLabel")}
            </span>
          </div>
          <p style={{ ...GROTESK, fontSize: "30px", fontWeight: 700, color: "#1e4d3a", lineHeight: 1.4, margin: "0 0 28px 0" }}>
            {t("about.ctaTitle")}
          </p>
          <Link to="/contact" style={{ display: "inline-flex", alignItems: "center", gap: "8px", backgroundColor: "#1e4d3a", color: "#fbf9f4", border: "2px solid #1e4d3a", borderRadius: "8px", padding: "14px 28px", cursor: "pointer", fontSize: "11px", fontWeight: 700, letterSpacing: "0.05em", textDecoration: "none", transition: "all 0.3s", ...GROTESK }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#fbf9f4"; e.currentTarget.style.color = "#1e4d3a"; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "#1e4d3a"; e.currentTarget.style.color = "#fbf9f4"; }}>
            {t("about.ctaButton")}
            <Icon name={isRTL ? "arrow_back" : "arrow_forward"} size={16} />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;