// src/pages/EditProfilePage.tsx
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useLang } from "../../context/LanguageContext";
import { useAuth } from "../../context/AuthContext";
import { userApi } from "../../api/userApi";
import ProfileSidebar from "../../components/ProfileSidebar";

type Role = "user" | "contributor" | "admin";

interface LinkRow {
  id: number;
  url: string;
}
let idCounter = 1;

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

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => (typeof window !== "undefined" ? window.innerWidth < 768 : false));
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return isMobile;
}

function Icon({ name, size = 18, style }: { name: string; size?: number; style?: React.CSSProperties }) {
  return (
    <span className="material-symbols-outlined" style={{ fontSize: `${size}px`, lineHeight: 1, userSelect: "none", ...style }}>
      {name}
    </span>
  );
}

function HoverBtn({
  children, onClick, type = "button", variant = "outline", danger = false, disabled = false, style,
}: {
  children: React.ReactNode; onClick?: () => void; type?: "button" | "submit"; variant?: "outline" | "primary"; danger?: boolean; disabled?: boolean; style?: React.CSSProperties;
}) {
  const [hov, setHov] = useState(false);
  const baseColor = danger ? RED : GREEN;
  let bg = "transparent";
  let color = baseColor;
  let border = `2px solid ${baseColor}`;

  if (variant === "primary") {
    bg = baseColor; color = BG;
    if (hov && !disabled) { bg = BG; color = baseColor; }
  } else {
    if (hov && !disabled) { bg = baseColor; color = BG; }
  }

  return (
    <button
      type={type} onClick={onClick} disabled={disabled}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ 
        display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "6px", 
        padding: "8px 16px", border, borderRadius: "8px", backgroundColor: bg, color,
        fontSize: "12px", fontWeight: 600, letterSpacing: "0.03em", 
        cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.6 : 1,
        transition: "all 0.3s", fontFamily: "'Hanken Grotesk', sans-serif", ...style 
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
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
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

function LinkRowItem({ link, onChange, onRemove, placeholder }: { link: LinkRow; onChange: (url: string) => void; onRemove: () => void; placeholder: string }) {
  const [rowHov, setRowHov] = useState(false);
  const [removeHov, setRemoveHov] = useState(false);
  return (
    <div
      onMouseEnter={() => setRowHov(true)} onMouseLeave={() => setRowHov(false)}
      style={{
        display: "flex", alignItems: "center", gap: "10px",
        backgroundColor: "rgba(11, 67, 53, 0.04)",
        border: `1.5px solid ${rowHov ? GREEN : BORDER}`,
        borderRadius: "8px", padding: "10px 12px", transition: "all 0.15s",
      }}
    >
      <Icon name="link" size={16} />
      <input
        type="url" value={link.url} onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          flex: 1, minWidth: 0, background: "transparent", border: "none", padding: 0,
          fontSize: "13px", ...SANS, color: GREEN, outline: "none",
        }}
      />
      <button
        type="button" onClick={onRemove}
        onMouseEnter={() => setRemoveHov(true)} onMouseLeave={() => setRemoveHov(false)}
        style={{
          border: "none", background: "none", color: removeHov ? RED : MUTED,
          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
          transition: "all 0.15s", padding: "2px", flexShrink: 0,
        }}
      >
        <Icon name="close" size={16} />
      </button>
    </div>
  );
}

function Field({ label, value, onChange, type = "text", required = false, readOnly = false }: {
  label: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string; required?: boolean; readOnly?: boolean;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      <label style={{ ...MONO, fontSize: "10px", color: MUTED, letterSpacing: "0.12em", textTransform: "uppercase" }}>
        {label}
      </label>
      <input
        type={type} value={value} onChange={onChange} required={required} readOnly={readOnly}
        className="op-input"
        style={{
          backgroundColor: readOnly ? "rgba(11, 67, 53, 0.02)" : "rgba(11, 67, 53, 0.04)",
          border: `1.5px solid ${BORDER}`, padding: "10px 14px", borderRadius: "8px",
          fontSize: "13px", color: readOnly ? MUTED : GREEN, ...SANS, outline: "none",
          transition: "all 0.15s", width: "100%", boxSizing: "border-box",
          cursor: readOnly ? "default" : "text",
        }}
      />
    </div>
  );
}

interface EditProfilePageProps { role?: Role; }

export default function EditProfilePage({ role = "user" }: EditProfilePageProps) {
  const { lang, t } = useLang();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [bioText, setBioText] = useState("");
  const [links, setLinks] = useState<LinkRow[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [profilePicture, setProfilePicture] = useState<string>("");

  const isRTL = lang === "AR";
  const isUser = role === "user";

  // ✅ Calculate profile completion percentage dynamically
  const calculateProfileCompletion = () => {
    let completed = 0;
    const total = 5; // Total fields to check

    if (name && name.trim() !== "") completed++;
    if (bioText && bioText.trim() !== "") completed++;
    if (profilePicture || selectedFile) completed++;
    const validLinks = links.filter(l => l.url && l.url.trim() !== "");
    if (validLinks.length > 0) completed++;
    if (email && email.trim() !== "") completed++;

    return Math.round((completed / total) * 100);
  };
  const profileCompletion = calculateProfileCompletion();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await userApi.profile.getMyProfile();
        if (response.data.success && response.data.data) {
          const data = response.data.data;
          setName(data.name || "");
          setUsername(data.username || "");
          setEmail(data.email || "");
          setBioText(data.bio || "");
          setProfilePicture(data.profile_picture || ""); 
          
          let parsedLinks: string[] = [];
          if (data.links) {
            if (typeof data.links === "string") {
              try { 
                const parsed = JSON.parse(data.links);
                if (Array.isArray(parsed)) parsedLinks = parsed;
                else if (typeof parsed === 'object' && parsed !== null) parsedLinks = Object.values(parsed);
              } catch { parsedLinks = []; }
            } else if (Array.isArray(data.links)) {
              parsedLinks = data.links;
            } else if (typeof data.links === 'object' && data.links !== null) {
              parsedLinks = Object.values(data.links);
            }
          }
          
          const initialLinks = parsedLinks.length > 0 
            ? parsedLinks.map((url) => ({ id: idCounter++, url }))
            : [{ id: idCounter++, url: "" }];
            
          setLinks(initialLinks);
        }
      } catch (err) {
        console.error("Failed to fetch profile for editing:", err);
        setErrorMsg(t("editProfile.error.load"));
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, [t]);

  const addLink = () => setLinks((prev) => [...prev, { id: idCounter++, url: "" }]);
  const removeLink = (id: number) => setLinks((prev) => prev.filter((l) => l.id !== id));
  const updateLink = (id: number, url: string) => setLinks((prev) => prev.map((l) => (l.id === id ? { ...l, url } : l)));

  const handleAvatarClick = () => fileInputRef.current?.click();
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) setSelectedFile(e.target.files[0]);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const formData = new FormData();
      if (name) formData.append("name", name);
      if (bioText) formData.append("bio", bioText);
      
      const validUrls = links.map(l => l.url).filter(url => url.trim() !== "");
      const linksObject: Record<string, string> = {};
      validUrls.forEach((url, index) => { linksObject[`link_${index + 1}`] = url; });

      formData.append("links", JSON.stringify(linksObject));

      if (selectedFile) formData.append("profile_picture", selectedFile);

      const response = await userApi.profile.updateMyProfile(formData);
      
      if (response.data.success) {
        setSuccessMsg(t("editProfile.success"));
        setSelectedFile(null);
        setTimeout(() => setSuccessMsg(""), 3000);
      } else {
        setErrorMsg(response.data.message || t("editProfile.error.update"));
      }
    } catch (err: any) {
      console.error("Save error:", err);
      setErrorMsg(err.response?.data?.message || t("editProfile.error.general"));
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div dir={isRTL ? "rtl" : "ltr"} style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", ...SANS, color: GREEN }}>
        {t("editProfile.loading")}
      </div>
    );
  }

  const bodyCardStyle: React.CSSProperties = {
    backgroundColor: CARD_BG, borderRadius: "12px", padding: isMobile ? "18px" : "24px 28px",
  };

  return (
    <div dir={isRTL ? "rtl" : "ltr"} style={{ ...SANS, backgroundColor: BG, backgroundImage: "radial-gradient(circle at 50% 0%, rgba(184, 134, 11, 0.06) 0%, transparent 60%)", minHeight: "100vh", color: GREEN }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;700&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap');
        .material-symbols-outlined { font-variation-settings: 'FILL' 0,'wght' 400,'GRAD' 0,'opsz' 24; font-family: 'Material Symbols Outlined'; display: inline-block; vertical-align: middle; }
        .op-input:focus { border-color: ${GREEN} !important; box-shadow: inset 0 0 0 1px rgba(11,67,53,0.12); background-color: ${BG} !important; }
        .op-field-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        @media (max-width: 768px) { .op-field-grid { grid-template-columns: 1fr; } }
      `}</style>

      {successMsg && (
        <div style={{ position: "fixed", top: "20px", right: "20px", backgroundColor: GREEN, color: BG, padding: "12px 20px", borderRadius: "8px", boxShadow: "0 4px 12px rgba(0,0,0,0.15)", zIndex: 1000, ...SANS, fontSize: "14px", fontWeight: 600 }}>
          <Icon name="check_circle" size={16} /> {successMsg}
        </div>
      )}
      {errorMsg && (
        <div style={{ position: "fixed", top: "20px", right: "20px", backgroundColor: RED, color: BG, padding: "12px 20px", borderRadius: "8px", boxShadow: "0 4px 12px rgba(0,0,0,0.15)", zIndex: 1000, ...SANS, fontSize: "14px", fontWeight: 600 }}>
          <Icon name="error" size={16} /> {errorMsg}
        </div>
      )}

      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: isMobile ? "32px 16px 48px" : "64px 32px 80px", display: "flex", flexDirection: isMobile ? "column" : "row", gap: isMobile ? "14px" : "32px" }}>
        {!isMobile && <ProfileSidebar role={role} active="editProfile" profileCompletion={profileCompletion} />}

        <div style={{ flex: 1, maxWidth: isMobile ? "100%" : "640px", display: "flex", flexDirection: "column", gap: isMobile ? "14px" : "20px" }}>
          {isMobile && (
            <p style={{ ...MONO, fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.08em", opacity: 0.7, margin: 0 }}>{t("editProfile.title")}</p>
          )}

          <HoverCard style={bodyCardStyle}>
            <div style={{ display: "flex", alignItems: "center", gap: isMobile ? "12px" : "16px" }}>
              <div style={{ position: "relative", flexShrink: 0 }}>
                <div style={{ width: isMobile ? "56px" : "64px", height: isMobile ? "56px" : "64px", borderRadius: "50%", backgroundColor: GREEN, display: "flex", alignItems: "center", justifyContent: "center", color: BG, ...SERIF, fontSize: isMobile ? "24px" : "28px", fontWeight: 700, border: `1.5px solid ${BORDER}`, overflow: "hidden" }}>
                  {selectedFile ? (
                    <img src={URL.createObjectURL(selectedFile)} alt="Preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : profilePicture ? (
                    <img src={profilePicture} alt="Avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    name ? name[0].toUpperCase() : (username ? username[0].toUpperCase() : "?")
                  )}
                </div>
                
                <input type="file" ref={fileInputRef} style={{ display: "none" }} accept="image/*" onChange={handleFileChange} />
                
                <button
                  type="button" onClick={handleAvatarClick}
                  style={{
                    position: "absolute", bottom: 0, right: isRTL ? "auto" : 0, left: isRTL ? 0 : "auto",
                    backgroundColor: selectedFile ? GOLD : GREEN, color: BG, borderRadius: "50%", padding: "4px", border: `2px solid ${BG}`,
                    display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
                    transition: "all 0.15s", transform: "scale(1)",
                  }}
                  title={selectedFile ? t("editProfile.newImageSelected") : t("editProfile.changePicture")}
                >
                  <Icon name={selectedFile ? "check" : "edit"} size={12} />
                </button>
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "2px", flexWrap: "wrap" }}>
                  <h1 style={{ ...SERIF, fontSize: isMobile ? "18px" : "22px", fontWeight: 700, color: GREEN, margin: 0 }}>{name || username}</h1>
                  <span style={{ ...MONO, fontSize: "10px", padding: "4px 10px", borderRadius: "6px", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", color: isUser ? GREEN : BG, backgroundColor: isUser ? "rgba(11, 67, 53, 0.08)" : GREEN, border: isUser ? `1px solid rgba(11, 67, 53, 0.2)` : "none", whiteSpace: "nowrap" }}>
                    {role === "admin" ? t("editProfile.roleAdmin") : (isUser ? t("editProfile.roleUser") : t("editProfile.roleContributor"))}
                  </span>
                </div>
                <p style={{ fontSize: "13px", color: MUTED, margin: 0 }}>{username ? `@${username}` : (isUser ? t("editProfile.statusBrowsing") : t("editProfile.statusContributing"))}</p>
                {selectedFile && <p style={{ fontSize: "11px", color: GOLD, margin: "4px 0 0", fontWeight: 600 }}>{t("editProfile.newImageReady")}</p>}
              </div>
            </div>
          </HoverCard>

          <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: isMobile ? "14px" : "20px" }}>
            <HoverCard style={bodyCardStyle}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", color: GREEN, marginBottom: "18px" }}>
                <Icon name="person" size={18} />
                <h2 style={{ ...SERIF, fontSize: isMobile ? "16px" : "18px", fontWeight: 700, margin: 0 }}>{t("editProfile.personalInfo")}</h2>
              </div>
              <div className="op-field-grid">
                <Field label={t("editProfile.displayName")} value={name} onChange={(e) => setName(e.target.value)} />
                <Field label={t("editProfile.username")} value={username} onChange={() => {}} readOnly />
                <Field label={t("editProfile.email")} value={email} onChange={() => {}} type="email" readOnly />
                
                <div style={{ gridColumn: "1 / -1", display: "flex", flexDirection: "column", gap: "6px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <label style={{ ...MONO, fontSize: "10px", color: MUTED, letterSpacing: "0.12em", textTransform: "uppercase" }}>{t("editProfile.bio")}</label>
                    <span style={{ ...MONO, fontSize: "10px", color: bioText.length > 500 ? RED : MUTED }}>
                      {bioText.length}/500
                    </span>
                  </div>
                  <textarea
                    rows={3} value={bioText} onChange={(e) => setBioText(e.target.value)}
                    className="op-input"
                    style={{ backgroundColor: "rgba(11, 67, 53, 0.04)", border: `1.5px solid ${BORDER}`, padding: "10px 14px", borderRadius: "8px", fontSize: "13px", resize: "none", ...SANS, color: GREEN, height: "72px", outline: "none", transition: "all 0.15s", width: "100%", boxSizing: "border-box" }}
                  />
                </div>
              </div>
            </HoverCard>

            <HoverCard style={bodyCardStyle}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", color: GREEN, marginBottom: "6px" }}>
                <Icon name="link" size={18} />
                <h2 style={{ ...SERIF, fontSize: isMobile ? "16px" : "18px", fontWeight: 700, margin: 0 }}>{t("editProfile.links")}</h2>
              </div>
              <p style={{ ...MONO, fontSize: "10px", color: MUTED, letterSpacing: "0.06em", marginBottom: "18px" }}>{t("editProfile.linksHint")}</p>

              <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "18px" }}>
                {links.map((link) => (
                  <LinkRowItem
                    key={link.id} link={link} onChange={(url) => updateLink(link.id, url)}
                    onRemove={() => removeLink(link.id)} placeholder={t("editProfile.linkPlaceholder")}
                  />
                ))}
              </div>

              <HoverBtn onClick={addLink} variant="outline" style={isMobile ? { width: "100%" } : undefined} type="button">
                <Icon name="add_circle" size={14} /> {t("editProfile.addLink")}
              </HoverBtn>
            </HoverCard>

            <HoverCard style={{ ...bodyCardStyle, display: "flex", flexDirection: isMobile ? "column" : "row", justifyContent: isMobile ? "stretch" : "flex-end", gap: "10px" }}>
              <HoverBtn type="button" variant="outline" onClick={() => navigate("/profile")} style={isMobile ? { width: "100%" } : undefined}>
                {t("editProfile.cancel")}
              </HoverBtn>
              <HoverBtn type="submit" variant="primary" disabled={isSaving} style={isMobile ? { width: "100%" } : undefined}>
                <Icon name={isSaving ? "hourglass_empty" : "save"} size={14} />
                {isSaving ? t("editProfile.saving") : t("editProfile.saveProfile")}
              </HoverBtn>
            </HoverCard>
          </form>
        </div>
      </div>
    </div>
  );
}