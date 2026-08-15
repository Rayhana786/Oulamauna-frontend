import React, { useState } from "react";
import { useLang } from "../context/LanguageContext";
// Drop your own Islamic-pattern image at src/assets/contact-hero.jpg
// (free sources: unsplash.com, pexels.com — search "islamic geometric pattern")
import heroImage from "../assets/library-1.jpg";

type Language = "EN" | "AR" | "FR";

/* ─────────────────────────────────────────────
   SHARED STYLE CONSTANTS (matches ScholarDetailPage)
───────────────────────────────────────────── */
const MONO: React.CSSProperties = { fontFamily: "'JetBrains Mono', monospace" };
const SERIF: React.CSSProperties = { fontFamily: "'Source Serif 4', serif" };
const BTN_PRIMARY: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: "6px", padding: "10px 20px",
  border: "1.5px solid #0b4335", borderRadius: "6px", backgroundColor: "transparent", color: "#0b4335",
  fontSize: "10px", fontWeight: 700, letterSpacing: "0.1em", cursor: "pointer",
  transition: "background 0.15s, color 0.15s", ...MONO,
};

function Icon({ name, size = 20 }: { name: string; size?: number }) {
  return (
    <span className="material-symbols-outlined" style={{ fontSize: `${size}px`, lineHeight: 1, userSelect: "none" }}>
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
        backgroundColor: disabled ? "#c0c9c3" : hov ? "#0b4335" : "transparent",
        borderColor: disabled ? "#c0c9c3" : "#0b4335",
        color: disabled ? "#fff" : hov ? "#fff" : "#0b4335",
        cursor: disabled ? "not-allowed" : "pointer",
        ...style,
      }}
    >
      {children}
    </button>
  );
}

/* ─────────────────────────────────────────────
   TRANSLATIONS
───────────────────────────────────────────── */
const content: Record<Language, any> = {
  EN: {
    breadcrumb: "HOME › CONTACT",
    title: "Contact Us",
    description: "Have questions, suggestions, or want to contribute? We'd love to hear from you.",
    info: [
      { icon: "mail", label: "EMAIL", val: "contact@oulamauna.org" },
      { icon: "location_on", label: "LOCATION", val: "Algeria" },
      { icon: "call", label: "PHONE", val: "+213 (0) 000 000 000" },
    ],
    directContact: "Direct Contact",
    formTitle: "Send a Message",
    labels: { name: "NAME", email: "EMAIL", subject: "SUBJECT", message: "MESSAGE", btn: "SEND MESSAGE" },
    placeholders: { name: "Full name", email: "example@mail.com", message: "How can we help?" },
    subjects: ["General Inquiry", "Manuscript Access", "Scholarly Contribution", "Technical Issue"],
    errors: {
      nameEmpty: "Please enter your name.",
      emailEmpty: "Please enter your email address.",
      emailInvalid: "Please enter a valid email address.",
      messageEmpty: "Please write your message.",
      messageshort: "Message must be at least 10 characters.",
    },
    sentTitle: "Message Sent!",
    sentSubtitle: "Thank you for reaching out. We'll get back to you as soon as possible.",
    sentBack: "SEND ANOTHER MESSAGE",
  },
  AR: {
    breadcrumb: "الرئيسية › تواصل معنا",
    title: "تواصل معنا",
    description: "هل لديك أسئلة أو اقتراحات أو ترغب في المساهمة؟ يسعدنا التواصل معك.",
    info: [
      { icon: "mail", label: "البريد الإلكتروني", val: "contact@oulamauna.org" },
      { icon: "location_on", label: "الموقع", val: "الجزائر" },
      { icon: "call", label: "الهاتف", val: "000 000 000 (0) 213+" },
    ],
    directContact: "التواصل المباشر",
    formTitle: "أرسل رسالة",
    labels: { name: "الاسم", email: "البريد الإلكتروني", subject: "الموضوع", message: "الرسالة", btn: "إرسال الرسالة" },
    placeholders: { name: "الاسم الكامل", email: "example@mail.com", message: "كيف يمكننا مساعدتك؟" },
    subjects: ["استفسار عام", "الوصول إلى المخطوطات", "مساهمة علمية", "مشكلة تقنية"],
    errors: {
      nameEmpty: "الرجاء إدخال اسمك.",
      emailEmpty: "الرجاء إدخال عنوان بريدك الإلكتروني.",
      emailInvalid: "الرجاء إدخال عنوان بريد صحيح.",
      messageEmpty: "الرجاء كتابة رسالتك.",
      messageshort: "يجب أن تحتوي الرسالة على 10 أحرف على الأقل.",
    },
    sentTitle: "تم إرسال رسالتك!",
    sentSubtitle: "شكراً للتواصل معنا. سنرد عليك في أقرب وقت ممكن.",
    sentBack: "إرسال رسالة أخرى",
  },
  FR: {
    breadcrumb: "ACCUEIL › CONTACT",
    title: "Contactez-nous",
    description: "Des questions, des suggestions ou vous souhaitez contribuer ? Nous serions ravis de vous entendre.",
    info: [
      { icon: "mail", label: "E-MAIL", val: "contact@oulamauna.org" },
      { icon: "location_on", label: "LIEU", val: "Algérie" },
      { icon: "call", label: "TÉLÉPHONE", val: "+213 (0) 000 000 000" },
    ],
    directContact: "Contact direct",
    formTitle: "Envoyer un message",
    labels: { name: "NOM", email: "E-MAIL", subject: "SUJET", message: "MESSAGE", btn: "ENVOYER" },
    placeholders: { name: "Nom complet", email: "exemple@mail.com", message: "Comment pouvons-nous vous aider ?" },
    subjects: ["Demande générale", "Accès aux manuscrits", "Contribution scientifique", "Problème technique"],
    errors: {
      nameEmpty: "Veuillez entrer votre nom.",
      emailEmpty: "Veuillez entrer votre adresse e-mail.",
      emailInvalid: "Veuillez entrer une adresse e-mail valide.",
      messageEmpty: "Veuillez écrire votre message.",
      messageshort: "Le message doit contenir au moins 10 caractères.",
    },
    sentTitle: "Message envoyé !",
    sentSubtitle: "Merci de nous avoir contactés. Nous vous répondrons dans les plus brefs délais.",
    sentBack: "ENVOYER UN AUTRE MESSAGE",
  },
};

/* ─────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────── */
const ContactPage: React.FC = () => {
  const { lang } = useLang();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<{ name?: string; email?: string; message?: string }>({});
  const [submitted, setSubmitted] = useState(false);
  const [sent, setSent] = useState(false);

  const t = content[lang as Language];
  const isRTL = lang === "AR";

  const validate = () => {
    const newErrors: { name?: string; email?: string; message?: string } = {};
    if (!name.trim()) newErrors.name = t.errors.nameEmpty;
    if (!email.trim()) newErrors.email = t.errors.emailEmpty;
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = t.errors.emailInvalid;
    if (!message.trim()) newErrors.message = t.errors.messageEmpty;
    else if (message.trim().length < 10) newErrors.message = t.errors.messageshort;
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    if (validate()) {
      setSent(true);
      // TODO: call your API here
    }
  };

  const handleReset = () => {
    setName(""); setEmail(""); setSubject(""); setMessage("");
    setErrors({}); setSubmitted(false); setSent(false);
  };

  const inputStyle = (hasError: boolean): React.CSSProperties => ({
    width: "100%", padding: "12px 14px",
    border: `1.5px solid ${hasError ? "#b3261e" : "rgba(192,201,195,0.6)"}`,
    borderRadius: "8px", fontSize: "13px", color: "#191c1b",
    backgroundColor: hasError ? "rgba(179,38,30,0.03)" : "#fafbf8",
    fontFamily: "'Source Sans 3', sans-serif", outline: "none", transition: "border-color 0.15s",
  });
  const labelStyle: React.CSSProperties = { ...MONO, fontSize: "9px", color: "#707974", letterSpacing: "0.12em", display: "block", marginBottom: "6px" };

  const ErrorMsg = ({ msg }: { msg: string }) => (
    <p style={{ ...MONO, fontSize: "10px", color: "#b3261e", margin: "6px 0 0", display: "flex", alignItems: "center", gap: "5px" }}>
      <Icon name="error" size={13} /> {msg}
    </p>
  );

  return (
    <div
      dir={isRTL ? "rtl" : "ltr"}
     style={{
  fontFamily: "'Source Sans 3', sans-serif", minHeight: "100vh", backgroundColor: "#faf9f6",
  backgroundImage: "radial-gradient(circle at 50% 0%, rgba(201,168,76,0.06) 0%, transparent 60%)",
  color: "#191c1b",
}}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Source+Serif+4:ital,opsz,wght@0,8..60,200..900;1,8..60,200..900&family=Source+Sans+3:ital,wght@0,200..900;1,200..900&family=JetBrains+Mono:ital,wght@0,100..800;1,100..800&family=Amiri:ital,wght@0,400;0,700;1,400&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap');
        .material-symbols-outlined { font-variation-settings: 'FILL' 0,'wght' 400,'GRAD' 0,'opsz' 24; font-family: 'Material Symbols Outlined'; display: inline-block; vertical-align: middle; }
        * { box-sizing: border-box; }
        input::placeholder, textarea::placeholder { color: #c0c9c3; }
        input:focus, textarea:focus, select:focus { border-color: #0b4335 !important; }
        .contact-info-row:hover .contact-icon-badge { background-color: rgba(201,168,76,0.12); }
        .contact-info-row:hover .contact-icon { color: #C9A84C; }
      `}</style>

     <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "64px 40px 0" }}>
        {/* Hero banner — your Islamic pattern image + forest/gold overlay */}
        <div style={{
          position: "relative", overflow: "hidden", borderRadius: "16px",
          padding: "48px 40px", marginBottom: "40px",
          border: "1px solid rgba(201,168,76,0.25)",
          backgroundImage: `url(${heroImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}>
          {/* Overlay so text stays legible on top of the photo */}
          <div style={{
            position: "absolute", inset: 0,
            background: "linear-gradient(120deg, rgba(11,67,53,0.92) 0%, rgba(11,67,53,0.75) 45%, rgba(11,67,53,0.4) 100%)",
          }} />

          {/* Breadcrumb + header */}
          <div style={{ position: "relative", zIndex: 1 }}>
            <p style={{ ...MONO, fontSize: "11px", color: "rgba(255,255,255,0.6)", letterSpacing: "0.05em", marginBottom: "18px" }}>
              {t.breadcrumb}
            </p>
            <h1 style={{ ...SERIF, fontSize: "40px", fontWeight: 700, color: "#fff", margin: "0 0 16px 0" }}>
              {t.title}
            </h1>
            <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.8)", lineHeight: 1.75, maxWidth: "620px", margin: 0 }}>
              {t.description}
            </p>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "40px", alignItems: "start" }}>

          {/* Form */}
          <div>
            {sent ? (
              <div style={{ padding: "8px 0" }}>
                <div style={{ width: "56px", height: "56px", borderRadius: "12px", backgroundColor: "rgba(11,67,53,0.08)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "20px" }}>
                  <Icon name="check_circle" size={28} />
                </div>
                <h3 style={{ ...SERIF, fontSize: "22px", fontWeight: 700, color: "#0b4335", margin: "0 0 8px" }}>{t.sentTitle}</h3>
                <p style={{ fontSize: "13px", color: "#707974", lineHeight: 1.6, maxWidth: "420px", marginBottom: "28px" }}>{t.sentSubtitle}</p>
                <HoverBtn onClick={handleReset}>
                  <Icon name="refresh" size={14} /> {t.sentBack}
                </HoverBtn>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "20px" }}>
                  <div>
                    <label style={labelStyle}>{t.labels.name}</label>
                    <input
                      type="text"
                      value={name}
                      onChange={e => { setName(e.target.value); if (submitted) setErrors(prev => ({ ...prev, name: undefined })); }}
                      placeholder={t.placeholders.name}
                      style={inputStyle(!!errors.name)}
                    />
                    {errors.name && <ErrorMsg msg={errors.name} />}
                  </div>
                  <div>
                    <label style={labelStyle}>{t.labels.email}</label>
                    <input
                      type="email"
                      value={email}
                      onChange={e => { setEmail(e.target.value); if (submitted) setErrors(prev => ({ ...prev, email: undefined })); }}
                      placeholder={t.placeholders.email}
                      style={inputStyle(!!errors.email)}
                    />
                    {errors.email && <ErrorMsg msg={errors.email} />}
                  </div>
                </div>

                <div style={{ marginBottom: "20px" }}>
                  <label style={labelStyle}>{t.labels.subject}</label>
                  <select
                    value={subject}
                    onChange={e => setSubject(e.target.value)}
                    style={{ ...inputStyle(false), cursor: "pointer", appearance: "none" as const }}
                  >
                    {t.subjects.map((s: string) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                <div style={{ marginBottom: "24px" }}>
                  <label style={labelStyle}>{t.labels.message}</label>
                  <textarea
                    rows={6}
                    value={message}
                    onChange={e => { setMessage(e.target.value); if (submitted) setErrors(prev => ({ ...prev, message: undefined })); }}
                    placeholder={t.placeholders.message}
                    style={{ ...inputStyle(!!errors.message), resize: "vertical" }}
                  />
                  {errors.message && <ErrorMsg msg={errors.message} />}
                </div>

                <div style={{ height: "1px", width: "100%", backgroundColor: "rgba(192,201,195,0.4)", marginBottom: "24px" }} />

                <button
                  type="submit"
                  style={{
                    display: "inline-flex", alignItems: "center", gap: "8px",
                    backgroundColor: "#0b4335", color: "#fff", border: "none", borderRadius: "8px",
                    padding: "12px 26px", cursor: "pointer", fontSize: "11px", fontWeight: 700,
                    letterSpacing: "0.1em", transition: "background 0.15s", ...MONO,
                  }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#285b4b")}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = "#0b4335")}
                >
                  <Icon name="send" size={14} />
                  {t.labels.btn}
                </button>
              </form>
            )}
          </div>

          {/* Sidebar */}
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

            <div style={{ backgroundColor: "#fff", border: "1px solid rgba(192,201,195,0.4)", borderRadius: "12px", padding: "24px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
              <h3 style={{ ...SERIF, fontSize: "17px", fontWeight: 700, color: "#0b4335", margin: "0 0 16px", paddingBottom: "12px", borderBottom: "1px solid rgba(192,201,195,0.3)" }}>
                {t.directContact}
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {t.info.map((item: any, i: number) => (
                  <div key={i} className="contact-info-row" style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                    <div className="contact-icon-badge" style={{ width: "38px", height: "38px", borderRadius: "8px", backgroundColor: "rgba(11,67,53,0.06)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "background-color 0.15s" }}>
                      <span className="contact-icon" style={{ color: "#0b4335", transition: "color 0.15s" }}>
                        <Icon name={item.icon} size={18} />
                      </span>
                    </div>
                    <div>
                      <p style={{ ...MONO, fontSize: "9px", color: "#c0c9c3", letterSpacing: "0.15em", margin: "0 0 2px" }}>{item.label}</p>
                      <p style={{ fontSize: "13px", fontWeight: 700, color: "#191c1b", margin: 0 }}>{item.val}</p>
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