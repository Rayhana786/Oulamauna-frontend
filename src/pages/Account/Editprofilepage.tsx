import React, { useState } from "react";
import { useLang } from "../../context/LanguageContext";
import ProfileSidebar from "../../components/ProfileSidebar";

/* ─────────────────────────────────────────────
   Oulamauna — Edit Profile (Interactive Version)
───────────────────────────────────────────── */

type Role = "user" | "contributor";
interface LinkRow {
  id: number;
  url: string;
}
let idCounter = 1;

const MONO: React.CSSProperties = { fontFamily: "'JetBrains Mono', monospace" };
const SERIF: React.CSSProperties = { fontFamily: "'Source Serif 4', serif" };
const SANS: React.CSSProperties = { fontFamily: "'Source Sans 3', sans-serif" };

const BTN_PRIMARY: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "6px",
  padding: "7px 16px",
  border: "1.5px solid #0b4335",
  borderRadius: "6px",
  backgroundColor: "transparent",
  color: "#0b4335",
  fontSize: "10px",
  fontWeight: 700,
  letterSpacing: "0.1em",
  cursor: "pointer",
  transition: "background 0.15s, color 0.15s",
  ...MONO,
};

function Icon({ name, size = 18 }: { name: string; size?: number }) {
  return (
    <span className="material-symbols-outlined" style={{ fontSize: `${size}px`, lineHeight: 1, userSelect: "none" }}>
      {name}
    </span>
  );
}

function HoverBtn({
  children,
  onClick,
  type = "button",
  variant = "outline",
  style,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  variant?: "outline" | "primary";
  style?: React.CSSProperties;
}) {
  const [hov, setHov] = useState(false);
  const outline: React.CSSProperties = {
    ...BTN_PRIMARY,
    backgroundColor: hov ? "#0b4335" : "transparent",
    color: hov ? "#fff" : "#0b4335",
  };
  const primary: React.CSSProperties = {
    ...BTN_PRIMARY,
    backgroundColor: hov ? "#285b4b" : "#0b4335",
    color: "#fff",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
  };
  return (
    <button
      type={type}
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{ ...(variant === "outline" ? outline : primary), ...style }}
    >
      {children}
    </button>
  );
}

function HoverCard({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        border: "1.5px solid rgba(192,201,195,0.4)",
        boxShadow: hov ? "0 4px 16px rgba(11,67,53,0.1)" : "0 1px 3px rgba(0,0,0,0.04)",
        transition: "box-shadow 0.2s, border-color 0.2s",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function LinkRowItem({
  link,
  onChange,
  onRemove,
  placeholder,
}: {
  link: LinkRow;
  onChange: (url: string) => void;
  onRemove: () => void;
  placeholder: string;
}) {
  const [rowHov, setRowHov] = useState(false);
  const [removeHov, setRemoveHov] = useState(false);
  return (
    <div
      onMouseEnter={() => setRowHov(true)}
      onMouseLeave={() => setRowHov(false)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        backgroundColor: "#fafbf8",
        border: `1.5px solid ${rowHov ? "#0b4335" : "rgba(192,201,195,0.5)"}`,
        borderRadius: "8px",
        padding: "10px 12px",
        transition: "border-color 0.15s",
      }}
    >
      <Icon name="link" size={16} />
      <input
        type="url"
        value={link.url}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          flex: 1,
          background: "transparent",
          border: "none",
          padding: 0,
          fontSize: "13px",
          ...SANS,
          color: "#191c1b",
          outline: "none",
        }}
      />
      <button
        type="button"
        onClick={onRemove}
        onMouseEnter={() => setRemoveHov(true)}
        onMouseLeave={() => setRemoveHov(false)}
        style={{
          border: "none",
          background: "none",
          color: removeHov ? "#b3261e" : "#707974",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "color 0.15s",
          padding: "2px",
        }}
      >
        <Icon name="close" size={16} />
      </button>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required = false,
}: {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      <label style={{ ...MONO, fontSize: "9px", color: "#707974", letterSpacing: "0.12em", textTransform: "uppercase" }}>
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        required={required}
        className="op-input"
        style={{
          backgroundColor: "#fafbf8",
          border: "1.5px solid rgba(192,201,195,0.6)",
          padding: "10px 14px",
          borderRadius: "8px",
          fontSize: "13px",
          color: "#191c1b",
          ...SANS,
          outline: "none",
          transition: "border-color 0.15s",
        }}
      />
    </div>
  );
}

interface EditProfilePageProps {
  role?: Role;
}

export default function EditProfilePage({ role = "user" }: EditProfilePageProps) {
  const { lang, t } = useLang();
  const [links, setLinks] = useState<LinkRow[]>([{ id: idCounter++, url: "https://facebook.com/ahmed.alfarsi" }]);
  const [saved, setSaved] = useState(false);
  const [avatarHov, setAvatarHov] = useState(false);

  // ✅ INTEREST 1: State for Username and Bio to make them interactive
  const [username, setUsername] = useState("Ahmed_21");
  const [bioText, setBioText] = useState("Passionate academic focused on the intersection of ancient linguistics and modern digital preservation.");

  const isRTL = lang === "AR";
  const isUser = role === "user";

  const addLink = () => setLinks((prev) => [...prev, { id: idCounter++, url: "" }]);
  const removeLink = (id: number) => setLinks((prev) => prev.filter((l) => l.id !== id));
  const updateLink = (id: number, url: string) => setLinks((prev) => prev.map((l) => (l.id === id ? { ...l, url } : l)));

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const bodyCardStyle: React.CSSProperties = {
    backgroundColor: "#fff",
    borderRadius: "14px",
    padding: "24px 28px",
  };

  return (
   <div
  dir={isRTL ? "rtl" : "ltr"}
  style={{
    ...SANS,
    backgroundColor: "#faf9f6",
    backgroundImage: "radial-gradient(circle at 50% 0%, rgba(201,168,76,0.06) 0%, transparent 60%)",
    minHeight: "100%",
  }}
>
  <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Source+Serif+4:ital,opsz,wght@0,8..60,200..900;1,8..60,200..900&family=Source+Sans+3:ital,wght@0,200..900;1,200..900&family=JetBrains+Mono:ital,wght@0,100..800;1,100..800&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap');
        .material-symbols-outlined { font-variation-settings: 'FILL' 0,'wght' 400,'GRAD' 0,'opsz' 24; font-family: 'Material Symbols Outlined'; display: inline-block; vertical-align: middle; }
        .op-input:focus { border-color: #0b4335 !important; box-shadow: inset 0 0 0 1px rgba(11,67,53,0.12); }
      `}</style>

      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "24px 32px 40px", display: "flex", gap: "32px" }}>
        <ProfileSidebar role={role} active="editProfile" />

        {/* Body */}
        <div style={{ flex: 1, maxWidth: "640px", display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Profile header card */}
          <HoverCard style={bodyCardStyle}>
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <div style={{ position: "relative" }}>
                {/* ✅ INTEREST 2: Avatar updates automatically based on username */}
                <div style={{ width: "64px", height: "64px", borderRadius: "50%", backgroundColor: "#0b4335", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", ...SERIF, fontSize: "28px", fontWeight: 700, border: "1.5px solid rgba(192,201,195,0.4)" }}>
                  {username ? username[0].toUpperCase() : "?"}
                </div>
                <button
                  onMouseEnter={() => setAvatarHov(true)}
                  onMouseLeave={() => setAvatarHov(false)}
                  style={{
                    position: "absolute", bottom: 0, right: isRTL ? "auto" : 0, left: isRTL ? 0 : "auto",
                    backgroundColor: "#0b4335", color: "#fff", borderRadius: "50%", padding: "4px", border: "2px solid #fff",
                    display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
                    transform: avatarHov ? "scale(1.1)" : "scale(1)", transition: "transform 0.15s",
                  }}
                >
                  <Icon name="edit" size={12} />
                </button>
              </div>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "2px" }}>
                  <h1 style={{ ...SERIF, fontSize: "22px", fontWeight: 700, color: "#0b4335", margin: 0 }}>{username}</h1>
                  <span style={{ ...MONO, fontSize: "9px", padding: "3px 8px", borderRadius: "5px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: isUser ? "#0b4335" : "#fff", backgroundColor: isUser ? "rgba(11,67,53,0.08)" : "#0b4335", border: isUser ? "1px solid rgba(11,67,53,0.15)" : "none" }}>
                    {isUser ? t("editProfile.user") : t("editProfile.contributor")}
                  </span>
                </div>
                <p style={{ fontSize: "12px", color: "#707974", margin: 0 }}>{isUser ? t("editProfile.browsing") : t("editProfile.contributing")}</p>
              </div>
            </div>
          </HoverCard>

          <form id="op-edit-profile-form" onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {/* Personal information */}
            <HoverCard style={bodyCardStyle}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#0b4335", marginBottom: "18px" }}>
                <Icon name="person" size={18} />
                <h2 style={{ ...SERIF, fontSize: "18px", fontWeight: 700, margin: 0 }}>{t("editProfile.personalInfo")}</h2>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                {/* ✅ INTEREST 3: Real-time typing for Username */}
                <Field label={t("editProfile.displayName")} value="Ahmed" onChange={() => {}} />
                <Field label={t("editProfile.username")} value={username} onChange={(e) => setUsername(e.target.value)} required />
                <Field label={t("editProfile.fullName")} value="Ahmed Al-Farsi" onChange={() => {}} />
                <Field label={t("editProfile.email")} value="user@email.com" onChange={() => {}} type="email" required />
                
                <div style={{ gridColumn: "1 / -1", display: "flex", flexDirection: "column", gap: "6px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <label style={{ ...MONO, fontSize: "9px", color: "#707974", letterSpacing: "0.12em", textTransform: "uppercase" }}>{t("editProfile.bio")}</label>
                    {/* ✅ INTEREST 4: Live Character Counter */}
                    <span style={{ ...MONO, fontSize: "10px", color: bioText.length > 500 ? "#b3261e" : "#707974" }}>
                      {bioText.length}/500
                    </span>
                  </div>
                  <textarea
                    rows={3}
                    value={bioText}
                    onChange={(e) => setBioText(e.target.value)}
                    className="op-input"
                    style={{ backgroundColor: "#fafbf8", border: "1.5px solid rgba(192,201,195,0.6)", padding: "10px 14px", borderRadius: "8px", fontSize: "13px", resize: "none", ...SANS, height: "72px", outline: "none", transition: "border-color 0.15s" }}
                  />
                </div>
                
                <div style={{ gridColumn: "1 / -1", display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ ...MONO, fontSize: "9px", color: "#707974", letterSpacing: "0.12em", textTransform: "uppercase" }}>{t("editProfile.country")}</label>
                  <select defaultValue="Algeria" className="op-input" style={{ backgroundColor: "#fafbf8", border: "1.5px solid rgba(192,201,195,0.6)", padding: "10px 14px", borderRadius: "8px", fontSize: "13px", ...SANS, appearance: "none", outline: "none", transition: "border-color 0.15s" }}>
                    <option value="Algeria">Algeria</option>
                    <option value="Morocco">Morocco</option>
                    <option value="Tunisia">Tunisia</option>
                    <option value="Egypt">Egypt</option>
                  </select>
                </div>
              </div>
            </HoverCard>

            {/* Links */}
            <HoverCard style={bodyCardStyle}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#0b4335", marginBottom: "6px" }}>
                <Icon name="link" size={18} />
                <h2 style={{ ...SERIF, fontSize: "18px", fontWeight: 700, margin: 0 }}>{t("editProfile.links")}</h2>
              </div>
              <p style={{ ...MONO, fontSize: "9px", color: "#707974", letterSpacing: "0.06em", marginBottom: "18px" }}>{t("editProfile.linksHint")}</p>

              <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "18px" }}>
                {links.map((link) => (
                  <LinkRowItem
                    key={link.id}
                    link={link}
                    onChange={(url) => updateLink(link.id, url)}
                    onRemove={() => removeLink(link.id)}
                    placeholder={t("editProfile.linkPlaceholder")}
                  />
                ))}
              </div>

              <HoverBtn onClick={addLink} variant="outline">
                <Icon name="add_circle" size={14} /> {t("editProfile.addLink")}
              </HoverBtn>
            </HoverCard>

            {/* Footer actions */}
            <HoverCard style={{ ...bodyCardStyle, display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <HoverBtn type="button" variant="outline">{t("editProfile.discard")}</HoverBtn>
              <HoverBtn type="submit" variant="primary">
                <Icon name={saved ? "check" : "save"} size={14} />
                {saved ? t("editProfile.profileUpdated") : t("editProfile.saveProfile")}
              </HoverBtn>
            </HoverCard>
          </form>
        </div>
      </div>
    </div>
  );
}