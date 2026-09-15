// src/pages/ContactPage.tsx
import React, { useState } from "react";
import { useLang } from "../context/LanguageContext";
import heroImage from "../assets/library-1.jpg";

const MONO: React.CSSProperties = { fontFamily: "'JetBrains Mono', monospace" };
const GROTESK: React.CSSProperties = { fontFamily: "'Hanken Grotesk', sans-serif" };
const INTER: React.CSSProperties = { fontFamily: "'Inter', sans-serif" };

const BTN_PRIMARY: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: "8px", padding: "12px 24px",
  border: "2px solid #1e4d3a", borderRadius: "8px", backgroundColor: "#1e4d3a", color: "#fbf9f4",
  fontSize: "11px", fontWeight: 700, letterSpacing: "0.05em", cursor: "pointer",
  transition: "all 0.3s", ...GROTESK,
};

function Icon({ name, size = 20 }: { name: string; size?: number }) {
  return (
    <span className="material-symbols-outlined" style={{ fontSize: `${size}px`, lineHeight: 1 }}>
      {name}
    </span>
  );
}

function HoverBtn({ children, onClick, type = "button", style, disabled }: {
  children: React.ReactNode; onClick?: () => void; type?: "button" | "submit"; style?: React.CSSProperties; disabled?: boolean;
}) {
  const [hov, setHov] = useState(false);
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        ...BTN_PRIMARY,
        backgroundColor: disabled ? "#c0c9c3" : hov ? "#fbf9f4" : "#1e4d3a",
        color: disabled ? "#fff" : hov ? "#1e4d3a" : "#fbf9f4",
        cursor: disabled ? "not-allowed" : "pointer",
        ...style,
      }}
    >
      {children}
    </button>
  );
}

const ContactPage: React.FC = () => {
  const { lang, t } = useLang();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<{ name?: string; email?: string; message?: string }>({});
  const [submitted, setSubmitted] = useState(false);
  const [sent, setSent] = useState(false);

  const isRTL = lang === "AR";

  const validate = () => {
    const newErrors: { name?: string; email?: string; message?: string } = {};
    if (!name.trim()) newErrors.name = t("contact.errors.nameEmpty");
    if (!email.trim()) newErrors.email = t("contact.errors.emailEmpty");
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = t("contact.errors.emailInvalid");
    if (!message.trim()) newErrors.message = t("contact.errors.messageEmpty");
    else if (message.trim().length < 10) newErrors.message = t("contact.errors.messageShort");
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    if (validate()) {
      setSent(true);
    }
  };

  const handleReset = () => {
    setName(""); setEmail(""); setMessage("");
    setErrors({}); setSubmitted(false); setSent(false);
  };

  const inputStyle = (hasError: boolean): React.CSSProperties => ({
    width: "100%", padding: "14px 16px",
    border: `2px solid ${hasError ? "#b3261e" : "rgba(30,77,58,0.2)"}`,
    borderRadius: "12px", fontSize: "14px", color: "#1e4d3a",
    backgroundColor: hasError ? "rgba(179,38,30,0.03)" : "#fbf9f4",
    fontFamily: "'Inter', sans-serif", outline: "none", transition: "all 0.3s",
  });

  const labelStyle: React.CSSProperties = { ...MONO, fontSize: "10px", color: "#C9A84C", letterSpacing: "0.15em", display: "block", marginBottom: "8px", fontWeight: 700 };

  const ErrorMsg = ({ msg }: { msg: string }) => (
    <p style={{ ...MONO, fontSize: "11px", color: "#b3261e", margin: "6px 0 0", display: "flex", alignItems: "center", gap: "5px" }}>
      <Icon name="error" size={14} /> {msg}
    </p>
  );

  const contactInfo = [
    { icon: "mail", label: t("contact.info.emailLabel"), val: t("contact.info.emailValue") },
    { icon: "location_on", label: t("contact.info.locationLabel"), val: t("contact.info.locationValue") },
    { icon: "call", label: t("contact.info.phoneLabel"), val: t("contact.info.phoneValue") },
  ];

  return (
    <div dir={isRTL ? "rtl" : "ltr"} style={{ fontFamily: "'Inter', sans-serif", minHeight: "100vh", backgroundColor: "#fbf9f4", backgroundImage: "radial-gradient(circle at 50% 0%, rgba(201,168,76,0.08) 0%, transparent 60%)", color: "#1e4d3a" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&family=Source+Serif+4:wght@400;600;700&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap');
        .material-symbols-outlined { font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24; font-family: 'Material Symbols Outlined'; display: inline-block; vertical-align: middle; }
        * { box-sizing: border-box; }
        input::placeholder, textarea::placeholder { color: rgba(30,77,58,0.4); }
        input:focus, textarea:focus, select:focus { border-color: #C9A84C !important; outline: none; box-shadow: 0 0 0 3px rgba(201,168,76,0.1); }
        .contact-info-row:hover .contact-icon-badge { background-color: rgba(30,77,58,0.08); }
      `}</style>

      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "64px 40px 120px" }}>
        <div style={{ position: "relative", overflow: "hidden", borderRadius: "16px", padding: "64px 48px", marginBottom: "48px", border: "1px solid rgba(201,168,76,0.25)", backgroundImage: `url(${heroImage})`, backgroundSize: "cover", backgroundPosition: "center" }}>
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(120deg, rgba(30,77,58,0.92) 0%, rgba(30,77,58,0.85) 45%, rgba(30,77,58,0.6) 100%)" }} />
          <div style={{ position: "relative", zIndex: 1 }}>
            <p style={{ ...MONO, fontSize: "11px", color: "#C9A84C", letterSpacing: "0.2em", marginBottom: "16px", fontWeight: 700 }}>
              {t("contact.breadcrumb")}
            </p>
            <h1 style={{ ...GROTESK, fontSize: "40px", fontWeight: 700, color: "#fbf9f4", margin: "0 0 20px 0", lineHeight: 1.2 }}>
              {t("contact.title")}
            </h1>
            <p style={{ ...INTER, fontSize: "16px", color: "rgba(251,249,244,0.85)", lineHeight: 1.7, maxWidth: "640px", margin: 0 }}>
              {t("contact.description")}
            </p>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: "48px", alignItems: "start" }}>
          <div style={{ backgroundColor: "#F5F3EC", borderRadius: "16px", padding: "40px", border: "1px solid rgba(30,77,58,0.1)" }}>
            {sent ? (
              <div style={{ padding: "20px 0", textAlign: "center" }}>
                <div style={{ width: "64px", height: "64px", borderRadius: "16px", backgroundColor: "rgba(30,77,58,0.1)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "24px", margin: "0 auto 24px" }}>
                  <Icon name="check_circle" size={32} />
                </div>
                <h3 style={{ ...GROTESK, fontSize: "24px", fontWeight: 700, color: "#1e4d3a", margin: "0 0 12px" }}>{t("contact.sentTitle")}</h3>
                <p style={{ ...INTER, fontSize: "14px", color: "rgba(30,77,58,0.7)", lineHeight: 1.6, maxWidth: "420px", marginBottom: "32px", margin: "0 auto 32px" }}>{t("contact.sentSubtitle")}</p>
                <HoverBtn onClick={handleReset}>
                  <Icon name="refresh" size={16} /> {t("contact.sentBack")}
                </HoverBtn>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate>
                <h3 style={{ ...GROTESK, fontSize: "20px", fontWeight: 700, color: "#1e4d3a", margin: "0 0 24px" }}>{t("contact.formTitle")}</h3>
                
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "20px" }}>
                  <div>
                    <label style={labelStyle}>{t("contact.labels.name")}</label>
                    <input type="text" value={name} onChange={e => { setName(e.target.value); if (submitted) setErrors(prev => ({ ...prev, name: undefined })); }} placeholder={t("contact.placeholders.name")} style={inputStyle(!!errors.name)} />
                    {errors.name && <ErrorMsg msg={errors.name} />}
                  </div>
                  <div>
                    <label style={labelStyle}>{t("contact.labels.email")}</label>
                    <input type="email" value={email} onChange={e => { setEmail(e.target.value); if (submitted) setErrors(prev => ({ ...prev, email: undefined })); }} placeholder={t("contact.placeholders.email")} style={inputStyle(!!errors.email)} />
                    {errors.email && <ErrorMsg msg={errors.email} />}
                  </div>
                </div>

                <div style={{ marginBottom: "28px" }}>
                  <label style={labelStyle}>{t("contact.labels.message")}</label>
                  <textarea rows={6} value={message} onChange={e => { setMessage(e.target.value); if (submitted) setErrors(prev => ({ ...prev, message: undefined })); }} placeholder={t("contact.placeholders.message")} style={{ ...inputStyle(!!errors.message), resize: "vertical", minHeight: "140px" }} />
                  {errors.message && <ErrorMsg msg={errors.message} />}
                </div>

                <button type="submit" style={{ ...BTN_PRIMARY, width: "100%", justifyContent: "center" }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#fbf9f4"; e.currentTarget.style.color = "#1e4d3a"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "#1e4d3a"; e.currentTarget.style.color = "#fbf9f4"; }}>
                  <Icon name="send" size={16} /> {t("contact.labels.btn")}
                </button>
              </form>
            )}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            <div style={{ backgroundColor: "#F5F3EC", border: "1px solid rgba(30,77,58,0.1)", borderRadius: "16px", padding: "32px" }}>
              <h3 style={{ ...GROTESK, fontSize: "18px", fontWeight: 700, color: "#1e4d3a", margin: "0 0 24px", paddingBottom: "16px", borderBottom: "2px solid rgba(201,168,76,0.3)" }}>
                {t("contact.directContact")}
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                {contactInfo.map((item, i) => (
                  <div key={i} className="contact-info-row" style={{ display: "flex", alignItems: "center", gap: "16px", padding: "8px", borderRadius: "8px", transition: "background-color 0.3s" }}>
                    <div className="contact-icon-badge" style={{ width: "44px", height: "44px", borderRadius: "10px", backgroundColor: "rgba(30,77,58,0.08)", border: "1px solid rgba(30,77,58,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.3s" }}>
                      <span className="contact-icon" style={{ color: "#1e4d3a", transition: "color 0.3s" }}>
                        <Icon name={item.icon} size={20} />
                      </span>
                    </div>
                    <div>
                      <p style={{ ...MONO, fontSize: "9px", color: "#C9A84C", letterSpacing: "0.15em", margin: "0 0 4px", fontWeight: 700 }}>{item.label}</p>
                      <p style={{ ...INTER, fontSize: "14px", fontWeight: 600, color: "#1e4d3a", margin: 0 }}>{item.val}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;