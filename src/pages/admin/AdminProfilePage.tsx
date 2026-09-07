import React, { useState } from "react";
import { useLang } from "../../context/LanguageContext";

/* ------------------------------------------------------------------ */
/*  Design tokens — Oulamnauna admin palette                          */
/* ------------------------------------------------------------------ */
const colors = {
  creamLight: "#fcfaf5",
  creamMid: "#f6efdc",
  creamDark: "#e5d5a8",
  forestGreen: "#0b4335",
  amber: "#b8860b",
  red: "#8b2c2c",
};

const fonts = {
  headline: "'Hanken Grotesk', sans-serif",
  body: "'Inter', sans-serif",
  label: "'JetBrains Mono', monospace",
};

const cardStyle: React.CSSProperties = {
  backgroundColor: colors.creamLight,
  borderRadius: 12,
  boxShadow: "0px 4px 20px rgba(11, 67, 53, 0.08)",
  border: `1px solid ${colors.forestGreen}`,
};

const Icon: React.FC<{ name: string; size?: number; filled?: boolean }> = ({ name, size = 18, filled = false }) => (
  <span className="material-symbols-outlined" style={{ fontSize: size, lineHeight: 1, fontVariationSettings: `'FILL' ${filled ? 1 : 0}, 'wght' 400, 'GRAD' 0, 'opsz' 24` }}>
    {name}
  </span>
);

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */
export default function AdminProfilePage() {
  const { lang } = useLang();
  const isRTL = lang === "AR";

  // ✅ Static Mock Data
  const [profileData, setProfileData] = useState({
    username: "riri",
    email: "r.khelifati@esi-sba.dz",
    bio: "Director of Research at Oulamauna. Passionate about preserving Islamic scholarly heritage.",
    joinDate: "September 2024",
    lastLogin: "Just now",
  });

  const [passwordData, setPasswordData] = useState({
    current: "",
    newPass: "",
    confirm: "",
  });

  const [saved, setSaved] = useState(false);

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setProfileData({ ...profileData, [e.target.name]: e.target.value });
    setSaved(false);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    // Static simulation
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  // Shared Input Style
  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 8,
    border: `1px solid ${colors.creamDark}`,
    backgroundColor: "#fff",
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.forestGreen,
    outline: "none",
    transition: "border-color 0.2s",
    boxSizing: "border-box",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontFamily: fonts.label,
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    color: colors.forestGreen,
    marginBottom: 8,
    opacity: 0.8,
  };

  return (
    <div dir={isRTL ? "rtl" : "ltr"} style={{ fontFamily: fonts.body, color: colors.forestGreen, backgroundColor: colors.creamLight, minHeight: "100vh", padding: 24 }}>
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>

        {/* ─ Page Header ── */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <span style={{ fontFamily: fonts.label, fontSize: 11, letterSpacing: "0.08em", color: colors.forestGreen, opacity: 0.7 }}>ADMIN / PROFILE</span>
          </div>
          <h1 style={{ fontFamily: fonts.headline, fontSize: 28, fontWeight: 700, color: colors.forestGreen, margin: "0 0 6px" }}>My Profile</h1>
          <p style={{ fontFamily: fonts.body, fontSize: 13, color: colors.forestGreen, opacity: 0.75, margin: 0 }}>Manage your personal account information and security.</p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 24, alignItems: "start" }}>
          
          {/* ── Left Column: Profile Summary Card ── */}
          <div style={{ ...cardStyle, padding: 24, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
            <div style={{ 
              width: 80, height: 80, borderRadius: "50%", 
              backgroundColor: colors.creamMid, color: colors.forestGreen, 
              border: `2px solid ${colors.forestGreen}`, 
              display: "flex", alignItems: "center", justifyContent: "center", 
              fontFamily: fonts.headline, fontWeight: 700, fontSize: 32, marginBottom: 16 
            }}>
              R
            </div>
            <h2 style={{ fontFamily: fonts.headline, fontSize: 18, fontWeight: 700, margin: "0 0 4px" }}>{profileData.username}</h2>
            <span style={{ 
              fontFamily: fonts.label, fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", 
              padding: "4px 10px", borderRadius: 9999, backgroundColor: colors.forestGreen, color: colors.creamLight, marginBottom: 16 
            }}>
              ADMINISTRATOR
            </span>
            
            <div style={{ width: "100%", borderTop: `1px solid ${colors.creamDark}`, paddingTop: 16, marginTop: 8, textAlign: isRTL ? "right" : "left" }}>
              <div style={{ marginBottom: 12 }}>
                <p style={{ ...labelStyle, marginBottom: 4, fontSize: 9 }}>Email</p>
                <p style={{ fontFamily: fonts.body, fontSize: 12, margin: 0, wordBreak: "break-all" }}>{profileData.email}</p>
              </div>
              <div style={{ marginBottom: 12 }}>
                <p style={{ ...labelStyle, marginBottom: 4, fontSize: 9 }}>Member Since</p>
                <p style={{ fontFamily: fonts.body, fontSize: 12, margin: 0 }}>{profileData.joinDate}</p>
              </div>
              <div>
                <p style={{ ...labelStyle, marginBottom: 4, fontSize: 9 }}>Last Login</p>
                <p style={{ fontFamily: fonts.body, fontSize: 12, margin: 0, display: "flex", alignItems: "center", gap: 4 }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "#22c55e", display: "inline-block" }}></span>
                  {profileData.lastLogin}
                </p>
              </div>
            </div>
          </div>

          {/* ── Right Column: Forms ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            
            {/* Form 1: Personal Information */}
            <div style={{ ...cardStyle, padding: 24 }}>
              <h3 style={{ fontFamily: fonts.headline, fontSize: 16, fontWeight: 600, margin: "0 0 20px", display: "flex", alignItems: "center", gap: 8 }}>
                <Icon name="person" size={20} /> Personal Information
              </h3>
              
              <form onSubmit={handleSaveProfile} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                  <label style={labelStyle}>Username</label>
                  <input 
                    type="text" name="username" value={profileData.username} onChange={handleProfileChange} 
                    style={inputStyle} 
                  />
                </div>
                <div>
                  <label style={labelStyle}>Email Address</label>
                  <input 
                    type="email" name="email" value={profileData.email} onChange={handleProfileChange} 
                    style={inputStyle} 
                  />
                </div>
                <div>
                  <label style={labelStyle}>Bio / Description</label>
                  <textarea 
                    name="bio" value={profileData.bio} onChange={handleProfileChange} rows={4}
                    style={{ ...inputStyle, resize: "vertical", minHeight: 80 }} 
                  />
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
                  <button 
                    type="submit" 
                    style={{ 
                      padding: "10px 24px", borderRadius: 8, cursor: "pointer", border: "none", 
                      backgroundColor: saved ? "#22c55e" : colors.forestGreen, color: colors.creamLight, 
                      fontFamily: fonts.body, fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", gap: 6,
                      transition: "background 0.2s"
                    }}
                  >
                    <Icon name={saved ? "check_circle" : "save"} size={16} filled={saved} />
                    {saved ? "Saved Successfully" : "Save Changes"}
                  </button>
                </div>
              </form>
            </div>

            {/* Form 2: Security */}
            <div style={{ ...cardStyle, padding: 24 }}>
              <h3 style={{ fontFamily: fonts.headline, fontSize: 16, fontWeight: 600, margin: "0 0 20px", display: "flex", alignItems: "center", gap: 8 }}>
                <Icon name="lock" size={20} /> Security & Password
              </h3>
              
              <form style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                  <label style={labelStyle}>Current Password</label>
                  <input 
                    type="password" name="current" value={passwordData.current} onChange={handlePasswordChange} 
                    style={inputStyle} placeholder="••••••••"
                  />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <div>
                    <label style={labelStyle}>New Password</label>
                    <input 
                      type="password" name="newPass" value={passwordData.newPass} onChange={handlePasswordChange} 
                      style={inputStyle} placeholder="••••••••"
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Confirm New Password</label>
                    <input 
                      type="password" name="confirm" value={passwordData.confirm} onChange={handlePasswordChange} 
                      style={inputStyle} placeholder="••••••••"
                    />
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
                  <button 
                    type="button"
                    style={{ 
                      padding: "10px 24px", borderRadius: 8, cursor: "pointer", 
                      border: `1px solid ${colors.forestGreen}`, backgroundColor: "transparent", 
                      color: colors.forestGreen, fontFamily: fonts.body, fontSize: 13, fontWeight: 700 
                    }}
                  >
                    Update Password
                  </button>
                </div>
              </form>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}