import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useLang } from "../context/LanguageContext";

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
    <a
      href="#"
      onClick={(e) => { e.preventDefault(); onClick?.(); }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={commonStyle}
    >
      <Icon name={icon} size={17} />
      {label}
    </a>
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
}

export default function ProfileSidebar({ 
  role = "user", 
  active, 
  links, 
  currentUserId 
}: ProfileSidebarProps) {
  const { t } = useLang();
  const isUser = role === "user";

  // ✅ REMOVED "My Profile" from this array as requested
  const navItems: { key: SidebarActive; icon: string; label: string; to?: string }[] = [
    { key: "dashboard", icon: "dashboard", label: t("editProfile.dashboard"), to: "/dashboard" },
    { key: "editProfile", icon: "edit_square", label: t("editProfile.editProfile"), to: "/edit-profile" },
    { key: "settings", icon: "settings", label: t("editProfile.settings"), to: "/settings" },
  ];

  return (
    <aside style={{ width: "216px", flexShrink: 0, display: "flex", flexDirection: "column", gap: "20px", height: "fit-content", alignSelf: "flex-start", position: "sticky", top: "16px" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
        {navItems.map(({ key, icon, label, to }) => (
          <NavRow key={key} icon={icon} label={label} active={active === key} to={to} />
        ))}
        <NavRow icon="logout" label={t("editProfile.signOut")} danger onClick={() => console.log("Logout clicked")} />
      </div>

      {/* ✅ ONLY show completion card on Edit Profile page */}
      {isUser && active === "editProfile" && (
        <HoverCard style={{ padding: "16px", backgroundColor: "#fff", borderRadius: "12px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px", ...MONO, fontSize: "9px", letterSpacing: "0.1em", textTransform: "uppercase", color: "#707974" }}>
            <span>{t("editProfile.profileCompletion")}</span>
            <span style={{ fontWeight: 700, color: "#191c1b" }}>40%</span>
          </div>
          <div style={{ width: "100%", height: "6px", backgroundColor: "#f0f1ee", borderRadius: "999px", marginBottom: "10px", overflow: "hidden" }}>
            <div style={{ width: "40%", height: "100%", backgroundColor: "#0b4335", borderRadius: "999px" }} />
          </div>
          <p style={{ fontSize: "11px", color: "#707974", margin: 0, lineHeight: 1.5 }}>{t("editProfile.completeHint")}</p>
        </HoverCard>
      )}

      {links && links.length > 0 && (
        <HoverCard style={{ padding: "16px", backgroundColor: "#fff", borderRadius: "12px" }}>
          <p style={{ ...MONO, fontSize: "9px", letterSpacing: "0.1em", textTransform: "uppercase", color: "#707974", margin: "0 0 12px" }}>
            Links
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
  );
}