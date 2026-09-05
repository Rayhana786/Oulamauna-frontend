import React, { useState, useEffect } from "react";
import { useLang } from "../../context/LanguageContext";
import ProfileSidebar from "../../components/ProfileSidebar";

/* ─────────────────────────────────────────────
   Oulamauna — Edit Profile (Interactive Version)
   Styled with Dashboard.tsx palette
───────────────────────────────────────────── */

type Role = "user" | "contributor";
interface LinkRow {
  id: number;
  url: string;
}
let idCounter = 1;

// ─ FORUM.TSX / DASHBOARD.TSX COLOR PALETTE ─
const colors = {
  creamLight: "#fcfaf5",
  creamMid: "#f6efdc",
  creamDark: "#e5d5a8",
  forestGreen: "#0b4335",
  amber: "#b8860b",
  red: "#8b2c2c",
};

const GREEN = colors.forestGreen;
const GOLD = colors.amber;
const BG = colors.creamLight;
const CARD_BG = colors.creamLight;
const BORDER = colors.creamMid;
const MUTED = "rgba(11, 67, 53, 0.6)";
const RED = colors.red;

const MONO: React.CSSProperties = { fontFamily: "'JetBrains Mono', monospace" };
const SERIF: React.CSSProperties = { fontFamily: "'Hanken Grotesk', sans-serif" };
const SANS: React.CSSProperties = { fontFamily: "'Inter', sans-serif" };

/* ── RESPONSIVE: shared mobile-detection hook (same pattern as Dashboard / Profile) ───── */
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => (typeof window !== "undefined" ? window.innerWidth < 768 : false));
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return isMobile;
}

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
  danger = false,
  style,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  variant?: "outline" | "primary";
  danger?: boolean;
  style?: React.CSSProperties;
}) {
  const [hov, setHov] = useState(false);
  const baseColor = danger ? RED : GREEN;
  
  let bg = "transparent";
  let color = baseColor;
  let border = `2px solid ${baseColor}`;

  if (variant === "primary") {
    bg = baseColor;
    color = BG;
    if (hov) { bg = BG; color = baseColor; }
  } else {
    if (hov) { bg = baseColor; color = BG; }
  }

  return (
    <button
      type={type}
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{ 
        display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "6px", 
        padding: "8px 16px", border, borderRadius: "8px", backgroundColor: bg, color,
        fontSize: "12px", fontWeight: 600, letterSpacing: "0.03em", cursor: "pointer",
        transition: "all 0.3s", fontFamily: "'Hanken Grotesk', sans-serif",
        ...style 
      }}
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
        border: `1px solid rgba(11, 67, 53, 0.1)`,
        boxShadow: hov ? "0px 6px 24px rgba(11, 67, 53, 0.12)" : "0px 4px 20px rgba(11, 67, 53, 0.08)",
        transform: hov ? "translateY(-2px)" : "translateY(0)",
        transition: "all 0.3s ease",
        backgroundColor: CARD_BG,
        borderRadius: "12px",
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
        backgroundColor: "rgba(11, 67, 53, 0.04)",
        border: `1.5px solid ${rowHov ? GREEN : BORDER}`,
        borderRadius: "8px",
        padding: "10px 12px",
        transition: "all 0.15s",
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
          minWidth: 0,
          background: "transparent",
          border: "none",
          padding: 0,
          fontSize: "13px",
          ...SANS,
          color: GREEN,
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
          color: removeHov ? RED : MUTED,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "all 0.15s",
          padding: "2px",
          flexShrink: 0,
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
      <label style={{ ...MONO, fontSize: "10px", color: MUTED, letterSpacing: "0.12em", textTransform: "uppercase" }}>
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        required={required}
        className="op-input"
        style={{
          backgroundColor: "rgba(11, 67, 53, 0.04)",
          border: `1.5px solid ${BORDER}`,
          padding: "10px 14px",
          borderRadius: "8px",
          fontSize: "13px",
          color: GREEN,
          ...SANS,
          outline: "none",
          transition: "all 0.15s",
          width: "100%",
          boxSizing: "border-box",
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
  const isMobile = useIsMobile();
  const [links, setLinks] = useState<LinkRow[]>([{ id: idCounter++, url: "https://facebook.com/ahmed.alfarsi" }]);
  const [saved, setSaved] = useState(false);
  const [avatarHov, setAvatarHov] = useState(false);

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
    backgroundColor: CARD_BG,
    borderRadius: "12px",
    padding: isMobile ? "18px" : "24px 28px",
  };

  return (
    <div
      dir={isRTL ? "rtl" : "ltr"}
      style={{
        ...SANS,
        backgroundColor: BG,
        backgroundImage: "radial-gradient(circle at 50% 0%, rgba(184, 134, 11, 0.06) 0%, transparent 60%)",
        minHeight: "100vh",
        color: GREEN,
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;700&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap');
        .material-symbols-outlined { font-variation-settings: 'FILL' 0,'wght' 400,'GRAD' 0,'opsz' 24; font-family: 'Material Symbols Outlined'; display: inline-block; vertical-align: middle; }
        .op-input:focus { border-color: ${GREEN} !important; box-shadow: inset 0 0 0 1px rgba(11,67,53,0.12); background-color: ${BG} !important; }
        .op-field-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        @media (max-width: 768px) {
          .op-field-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      {/* Extra top/bottom breathing room under the navbar and above the footer */}
      <div style={{
        maxWidth: "1100px", margin: "0 auto",
        padding: isMobile ? "32px 16px 48px" : "64px 32px 80px",
        display: "flex", flexDirection: isMobile ? "column" : "row",
        gap: isMobile ? "14px" : "32px"
      }}>
        {/* ✅ RESPONSIVE: sidebar hidden on mobile, same as Dashboard / Profile */}
        {!isMobile && <ProfileSidebar role={role} active="editProfile" />}

        <div style={{ flex: 1, maxWidth: isMobile ? "100%" : "640px", display: "flex", flexDirection: "column", gap: isMobile ? "14px" : "20px" }}>
          {isMobile && (
            <p style={{ ...MONO, fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.08em", opacity: 0.7, margin: 0 }}>EDIT PROFILE</p>
          )}

          <HoverCard style={bodyCardStyle}>
            <div style={{ display: "flex", alignItems: "center", gap: isMobile ? "12px" : "16px" }}>
              <div style={{ position: "relative", flexShrink: 0 }}>
                <div style={{
                  width: isMobile ? "56px" : "64px", height: isMobile ? "56px" : "64px", borderRadius: "50%",
                  backgroundColor: GREEN, display: "flex", alignItems: "center", justifyContent: "center",
                  color: BG, ...SERIF, fontSize: isMobile ? "24px" : "28px", fontWeight: 700, border: `1.5px solid ${BORDER}`
                }}>
                  {username ? username[0].toUpperCase() : "?"}
                </div>
                <button
                  onMouseEnter={() => setAvatarHov(true)}
                  onMouseLeave={() => setAvatarHov(false)}
                  style={{
                    position: "absolute", bottom: 0, right: isRTL ? "auto" : 0, left: isRTL ? 0 : "auto",
                    backgroundColor: GREEN, color: BG, borderRadius: "50%", padding: "4px", border: "2px solid BG",
                    display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
                    transform: avatarHov ? "scale(1.1)" : "scale(1)", transition: "all 0.15s",
                  }}
                >
                  <Icon name="edit" size={12} />
                </button>
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "2px", flexWrap: "wrap" }}>
                  <h1 style={{ ...SERIF, fontSize: isMobile ? "18px" : "22px", fontWeight: 700, color: GREEN, margin: 0 }}>{username}</h1>
                  <span style={{ ...MONO, fontSize: "10px", padding: "4px 10px", borderRadius: "6px", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", color: isUser ? GREEN : BG, backgroundColor: isUser ? "rgba(11, 67, 53, 0.08)" : GREEN, border: isUser ? `1px solid rgba(11, 67, 53, 0.2)` : "none", whiteSpace: "nowrap" }}>
                    {isUser ? (t("editProfile.user") || "User") : (t("editProfile.contributor") || "Contributor")}
                  </span>
                </div>
                <p style={{ fontSize: "13px", color: MUTED, margin: 0 }}>{isUser ? (t("editProfile.browsing") || "Browsing") : (t("editProfile.contributing") || "Contributing")}</p>
              </div>
            </div>
          </HoverCard>

          <form id="op-edit-profile-form" onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: isMobile ? "14px" : "20px" }}>
            <HoverCard style={bodyCardStyle}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", color: GREEN, marginBottom: "18px" }}>
                <Icon name="person" size={18} />
                <h2 style={{ ...SERIF, fontSize: isMobile ? "16px" : "18px", fontWeight: 700, margin: 0 }}>{t("editProfile.personalInfo") || "Personal Information"}</h2>
              </div>
              <div className="op-field-grid">
                <Field label={t("editProfile.displayName") || "Display Name"} value="Ahmed" onChange={() => {}} />
                <Field label={t("editProfile.username") || "Username"} value={username} onChange={(e) => setUsername(e.target.value)} required />
                <Field label={t("editProfile.fullName") || "Full Name"} value="Ahmed Al-Farsi" onChange={() => {}} />
                <Field label={t("editProfile.email") || "Email"} value="user@email.com" onChange={() => {}} type="email" required />
                
                <div style={{ gridColumn: "1 / -1", display: "flex", flexDirection: "column", gap: "6px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <label style={{ ...MONO, fontSize: "10px", color: MUTED, letterSpacing: "0.12em", textTransform: "uppercase" }}>{t("editProfile.bio") || "Bio"}</label>
                    <span style={{ ...MONO, fontSize: "10px", color: bioText.length > 500 ? RED : MUTED }}>
                      {bioText.length}/500
                    </span>
                  </div>
                  <textarea
                    rows={3}
                    value={bioText}
                    onChange={(e) => setBioText(e.target.value)}
                    className="op-input"
                    style={{ backgroundColor: "rgba(11, 67, 53, 0.04)", border: `1.5px solid ${BORDER}`, padding: "10px 14px", borderRadius: "8px", fontSize: "13px", resize: "none", ...SANS, color: GREEN, height: "72px", outline: "none", transition: "all 0.15s", width: "100%", boxSizing: "border-box" }}
                  />
                </div>
                
                <div style={{ gridColumn: "1 / -1", display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ ...MONO, fontSize: "10px", color: MUTED, letterSpacing: "0.12em", textTransform: "uppercase" }}>{t("editProfile.country") || "Country"}</label>
                  <select defaultValue="Algeria" className="op-input" style={{ backgroundColor: "rgba(11, 67, 53, 0.04)", border: `1.5px solid ${BORDER}`, padding: "10px 14px", borderRadius: "8px", fontSize: "13px", ...SANS, color: GREEN, appearance: "none", outline: "none", transition: "all 0.15s", width: "100%", boxSizing: "border-box" }}>
                    <option value="Algeria">Algeria</option>
                    <option value="Morocco">Morocco</option>
                    <option value="Tunisia">Tunisia</option>
                    <option value="Egypt">Egypt</option>
                  </select>
                </div>
              </div>
            </HoverCard>

            <HoverCard style={bodyCardStyle}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", color: GREEN, marginBottom: "6px" }}>
                <Icon name="link" size={18} />
                <h2 style={{ ...SERIF, fontSize: isMobile ? "16px" : "18px", fontWeight: 700, margin: 0 }}>{t("editProfile.links") || "Links"}</h2>
              </div>
              <p style={{ ...MONO, fontSize: "10px", color: MUTED, letterSpacing: "0.06em", marginBottom: "18px" }}>{t("editProfile.linksHint") || "Add your social media or personal website links."}</p>

              <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "18px" }}>
                {links.map((link) => (
                  <LinkRowItem
                    key={link.id}
                    link={link}
                    onChange={(url) => updateLink(link.id, url)}
                    onRemove={() => removeLink(link.id)}
                    placeholder={t("editProfile.linkPlaceholder") || "https://..."}
                  />
                ))}
              </div>

              <HoverBtn onClick={addLink} variant="outline" style={isMobile ? { width: "100%" } : undefined}>
                <Icon name="add_circle" size={14} /> {t("editProfile.addLink") || "Add Link"}
              </HoverBtn>
            </HoverCard>

            {/* ✅ RESPONSIVE: Save/Discard stack full-width on mobile instead of a
                right-aligned row, so they're easy to tap and never crowd together */}
            <HoverCard style={{
              ...bodyCardStyle,
              display: "flex",
              flexDirection: isMobile ? "column" : "row",
              justifyContent: isMobile ? "stretch" : "flex-end",
              gap: "10px"
            }}>
              <HoverBtn type="button" variant="outline" style={isMobile ? { width: "100%" } : undefined}>{t("editProfile.discard") || "Discard"}</HoverBtn>
              <HoverBtn type="submit" variant="primary" style={isMobile ? { width: "100%" } : undefined}>
                <Icon name={saved ? "check" : "save"} size={14} />
                {saved ? (t("editProfile.profileUpdated") || "Profile Updated") : (t("editProfile.saveProfile") || "Save Profile")}
              </HoverBtn>
            </HoverCard>
          </form>
        </div>
      </div>
    </div>
  );
}