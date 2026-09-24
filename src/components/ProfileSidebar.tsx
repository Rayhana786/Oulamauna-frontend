// src/components/ProfileSidebar.tsx
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useLang } from "../context/LanguageContext";
import { useAuth } from "../context/AuthContext";

type Role = "user" | "contributor" | "admin";
export type SidebarActive = "profile" | "dashboard" | "editProfile" | "settings";

const MONO: React.CSSProperties = { fontFamily: "'JetBrains Mono', monospace" };
const SERIF: React.CSSProperties = { fontFamily: "'Source Serif 4', serif" };
const SANS: React.CSSProperties = { fontFamily: "'Source Sans 3', sans-serif" };

function Icon({ name, size = 18, style }: { name: string; size?: number; style?: React.CSSProperties }) {
  return (
    <span className="material-symbols-outlined" style={{ fontSize: `${size}px`, lineHeight: 1, userSelect: "none", ...style }}>
      {name}
    </span>
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

function NavRow({
  icon,
  label,
  active,
  danger,
  to,
  onClick,
}: {
  icon: string;
  label: string;
  active?: boolean;
  danger?: boolean;
  to?: string;
  onClick?: () => void;
}) {
  const [hov, setHov] = useState(false);
  const color = danger ? "#b3261e" : active ? "#0b4335" : "#404945";
  const bg = danger
    ? hov ? "rgba(179,38,30,0.08)" : "transparent"
    : active ? "rgba(11,67,53,0.08)" : hov ? "#f3f4f1" : "transparent";

  const commonStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "9px 12px",
    borderRadius: "8px",
    textDecoration: "none",
    ...MONO,
    fontSize: "10px",
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color,
    backgroundColor: bg,
    fontWeight: active ? 700 : 500,
    transition: "background 0.15s, color 0.15s",
    marginTop: danger ? "12px" : 0,
    cursor: "pointer",
    border: "none",
    width: "100%",
    textAlign: "left",
  };

  if (to && to !== "#") {
    return (
      <Link to={to} style={commonStyle}>
        <Icon name={icon} size={17} />
        {label}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={commonStyle}
    >
      <Icon name={icon} size={17} />
      {label}
    </button>
  );
}

function getLinkIcon(url: string): string {
  if (url.includes("facebook")) return "facebook";
  if (url.includes("twitter") || url.includes("x.com")) return "twitter";
  if (url.includes("linkedin")) return "linkedin";
  if (url.includes("orcid")) return "badge";
  if (url.includes("github")) return "github";
  return "link";
}

function getLinkDisplay(url: string): string {
  try {
    return new URL(url).hostname.replace("www.", "");
  } catch {
    return url;
  }
}

interface ProfileSidebarProps {
  role?: Role;
  active: SidebarActive;
  links?: string[];
  currentUserId?: string;
  profileCompletion?: number;
}

export default function ProfileSidebar({ 
  role = "user", 
  active, 
  links, 
  currentUserId,
  profileCompletion = 0,
}: ProfileSidebarProps) {
  const { t } = useLang();
  const { logout } = useAuth();
  const isUser = role === "user";
  
  // ✅ State for floating logout confirmation
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    setShowLogoutConfirm(false);
    logout();
  };

  const navItems: { key: SidebarActive; icon: string; label: string; to?: string }[] = [
    { key: "dashboard", icon: "dashboard", label: t("sidebar.dashboard"), to: "/dashboard" },
    { key: "editProfile", icon: "edit_square", label: t("sidebar.editProfile"), to: "/edit-profile" },
    { key: "settings", icon: "settings", label: t("sidebar.settings"), to: "/settings" },
  ];

  return (
    <>
      <aside style={{ width: "216px", flexShrink: 0, display: "flex", flexDirection: "column", gap: "20px", height: "fit-content", alignSelf: "flex-start", position: "sticky", top: "16px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          {navItems.map(({ key, icon, label, to }) => (
            <NavRow key={key} icon={icon} label={label} active={active === key} to={to} />
          ))}
          {/* ✅ Triggers the floating confirmation instead of logging out immediately */}
          <NavRow icon="logout" label={t("sidebar.signOut")} danger onClick={handleLogoutClick} />
        </div>

        {isUser && active === "editProfile" && (
          <HoverCard style={{ padding: "16px", backgroundColor: "#fff", borderRadius: "12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px", ...MONO, fontSize: "9px", letterSpacing: "0.1em", textTransform: "uppercase", color: "#707974" }}>
              <span>{t("sidebar.profileCompletion")}</span>
              <span style={{ fontWeight: 700, color: "#191c1b" }}>{profileCompletion}%</span>
            </div>
            <div style={{ width: "100%", height: "6px", backgroundColor: "#f0f1ee", borderRadius: "999px", marginBottom: "10px", overflow: "hidden" }}>
              <div style={{ width: `${profileCompletion}%`, height: "100%", backgroundColor: "#0b4335", borderRadius: "999px" }} />
            </div>
            <p style={{ fontSize: "11px", color: "#707974", margin: 0, lineHeight: 1.5 }}>{t("sidebar.completeHint")}</p>
          </HoverCard>
        )}

        {links && links.length > 0 && (
          <HoverCard style={{ padding: "16px", backgroundColor: "#fff", borderRadius: "12px" }}>
            <p style={{ ...MONO, fontSize: "9px", letterSpacing: "0.1em", textTransform: "uppercase", color: "#707974", margin: "0 0 12px" }}>
              {t("sidebar.links")}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {links.map((link, index) => (
                <a
                  key={index}
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "6px 8px",
                    borderRadius: "6px",
                    textDecoration: "none",
                    color: "#0b4335",
                    ...SANS,
                    fontSize: "12px",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f3f4f1")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                >
                  <Icon name={getLinkIcon(link)} size={16} />
                  <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {getLinkDisplay(link)}
                  </span>
                  <Icon name="open_in_new" size={14} style={{ color: "#707974" }} />
                </a>
              ))}
            </div>
          </HoverCard>
        )}
      </aside>

      {/* ✅ Floating Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div 
          style={{
            position: "fixed",
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: "rgba(25, 28, 27, 0.4)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowLogoutConfirm(false); }}
        >
          <HoverCard style={{ padding: "24px", backgroundColor: "#fff", borderRadius: "12px", width: "320px", maxWidth: "90vw" }}>
            <p style={{ ...MONO, fontSize: "12px", color: "#191c1b", marginBottom: "24px", lineHeight: 1.6, textAlign: "center" }}>
              {t("logout.confirmMessage")}
            </p>
            <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                style={{
                  ...MONO,
                  fontSize: "10px",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  padding: "9px 16px",
                  borderRadius: "8px",
                  border: "1.5px solid #d0d5d3",
                  backgroundColor: "transparent",
                  color: "#404945",
                  cursor: "pointer",
                  fontWeight: 600,
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#f3f4f1"; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
              >
                {t("logout.cancel")}
              </button>
              <button
                type="button"
                onClick={confirmLogout}
                style={{
                  ...MONO,
                  fontSize: "10px",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  padding: "9px 16px",
                  borderRadius: "8px",
                  border: "none",
                  backgroundColor: "#b3261e",
                  color: "#fff",
                  cursor: "pointer",
                  fontWeight: 700,
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#921f17"; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "#b3261e"; }}
              >
                {t("logout.confirm")}
              </button>
            </div>
          </HoverCard>
        </div>
      )}
    </>
  );
}