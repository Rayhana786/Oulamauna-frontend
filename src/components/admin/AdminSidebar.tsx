import React, { useState, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useLang } from "../../context/LanguageContext";
import { useAuth } from "../../context/AuthContext"; // ✅ ADDED

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

/* ------------------------------------------------------------------ */
/*  Icon                                                                */
/* ------------------------------------------------------------------ */
const Icon: React.FC<{ name: string; size?: number; filled?: boolean }> = ({
  name,
  size = 18,
  filled = false,
}) => (
  <span
    className="material-symbols-outlined"
    style={{
      fontSize: size,
      lineHeight: 1,
      fontVariationSettings: `'FILL' ${filled ? 1 : 0}, 'wght' 400, 'GRAD' 0, 'opsz' 24`,
    }}
  >
    {name}
  </span>
);

/* ------------------------------------------------------------------ */
/*  Nav structure                                                       */
/* ------------------------------------------------------------------ */
type NavLink = { icon: string; labelKey: string; to: string };
type NavGroup = { sectionKey?: string; links: NavLink[] };

const navGroups: NavGroup[] = [
  {
    links: [{ icon: "grid_view", labelKey: "navbar.dashboard", to: "/admin/dashboard" }],
  },
  {
    sectionKey: "sidebar.section.scholars",
    links: [
      { icon: "school", labelKey: "sidebar.allScholars", to: "/admin/scholars" },
    ],
  },
  {
    sectionKey: "sidebar.section.review",
    links: [
      { icon: "how_to_reg", labelKey: "sidebar.pendingNewScholars", to: "/admin/pending/scholars" },
      { icon: "edit_document", labelKey: "sidebar.pendingScholarEdits", to: "/admin/pending/edits" },
      { icon: "menu_book", labelKey: "sidebar.pendingWorks", to: "/admin/pending/works" },
      { icon: "perm_media", labelKey: "sidebar.mediaVerification", to: "/admin/pending/media" },
      { icon: "block", labelKey: "sidebar.rejected", to: "/admin/rejected" },
    ],
  },
  {
    sectionKey: "sidebar.section.classification",
    links: [
      { icon: "category", labelKey: "sidebar.disciplines", to: "/admin/disciplines" },
      { icon: "public", labelKey: "sidebar.regions", to: "/admin/regions" }, 
    ],
  },
  {
    sectionKey: "sidebar.section.blog",
    links: [
      { icon: "article", labelKey: "sidebar.allPosts", to: "/admin/blog" },
      { icon: "flag", labelKey: "sidebar.reported", to: "/admin/blog/reported" },
    ],
  },
  {
    sectionKey: "sidebar.section.community",
    links: [
      { icon: "group", labelKey: "sidebar.contributors", to: "/admin/users/contributors" },
      { icon: "person_off", labelKey: "sidebar.bannedUsers", to: "/admin/users/banned" },
    ],
  },
  {
    links: [
      { icon: "summarize", labelKey: "sidebar.reports", to: "/admin/reports" },
      { icon: "notifications", labelKey: "sidebar.notifications", to: "/admin/notifications" },
    ],
  },
  {
    sectionKey: "sidebar.section.system",
    links: [
      { icon: "translate", labelKey: "sidebar.translation", to: "/admin/settings/translation" },
      { icon: "backup", labelKey: "sidebar.backups", to: "/admin/settings/backups" },
    ],
  },
];

/* ------------------------------------------------------------------ */
/*  Sidebar                                                             */
/* ------------------------------------------------------------------ */
const AdminSidebar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate(); // ✅ ADDED
  const { t, lang } = useLang();
  const { user, logout } = useAuth(); // ✅ ADDED: Get real user and logout function
  const isRTL = lang === "AR";

  // ✅ REAL User Data from Auth Context
  const currentUser = {
    username: user?.username || "User",
    role: "Administrator",
    initial: (user?.name || user?.username || "U").charAt(0).toUpperCase(),
    profile_picture: (user as any)?.profile_picture || (user as any)?.avatar,
  };

  // ✅ Dropdown State
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <nav
      style={{
        width: 248,
        height: "100vh",
        position: "fixed",
        top: 0,
        left: isRTL ? "auto" : 0,
        right: isRTL ? 0 : "auto",
        borderRight: isRTL ? "none" : `1px solid ${colors.forestGreen}`,
        borderLeft: isRTL ? `1px solid ${colors.forestGreen}` : "none",
        backgroundColor: colors.creamLight,
        boxShadow: "0px 4px 20px rgba(11, 67, 53, 0.08)",
        zIndex: 50,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        paddingTop: 18,
        paddingBottom: 12,
        overflowY: "auto",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');
        .material-symbols-outlined {
          font-family: 'Material Symbols Outlined';
          font-weight: normal;
          font-style: normal;
          display: inline-block;
          white-space: nowrap;
          word-wrap: normal;
          direction: ltr;
          -webkit-font-smoothing: antialiased;
        }
        .admin-sidebar-scroll::-webkit-scrollbar { width: 5px; }
        .admin-sidebar-scroll::-webkit-scrollbar-thumb { background: ${colors.creamDark}; border-radius: 10px; }
      `}</style>

      <div>
        {/* Logo / header */}
        <Link
          to="/admin/dashboard"
          style={{
            padding: "0 18px",
            marginBottom: 20,
            display: "flex",
            alignItems: "center",
            gap: 9,
            textDecoration: "none",
          }}
        >
          <div
            style={{
              width: 26,
              height: 26,
              borderRadius: "50%",
              border: `1px solid ${colors.forestGreen}`,
              backgroundColor: colors.forestGreen,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: colors.creamLight,
              fontFamily: fonts.headline,
              fontWeight: 700,
              fontSize: 12,
              flexShrink: 0,
            }}
          >
            ع
          </div>
          <span
            style={{
              fontFamily: fonts.headline,
              fontSize: 18,
              lineHeight: "24px",
              fontWeight: 700,
              color: colors.forestGreen,
            }}
          >
            Oulamnauna
          </span>
        </Link>

        {/* Nav groups */}
        <div className="admin-sidebar-scroll" style={{ display: "flex", flexDirection: "column", gap: 12, padding: "0 8px" }}>
          {navGroups.map((group, idx) => (
            <div key={group.sectionKey ?? `group-${idx}`} style={{ marginBottom: idx === navGroups.length - 1 ? "100px" : "0" }}>
              {group.sectionKey && (
                <p
                  style={{
                    fontFamily: fonts.label,
                    fontSize: 10,
                    letterSpacing: "0.05em",
                    textTransform: "uppercase",
                    color: colors.forestGreen,
                    opacity: 0.55,
                    margin: "0 0 4px",
                    padding: "0 8px",
                  }}
                >
                  {t(group.sectionKey)}
                </p>
              )}
              <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 1, margin: 0, padding: 0 }}>
                {group.links.map((item) => {
                  const active = location.pathname === item.to || location.pathname.startsWith(item.to + "/");
                  return (
                    <li key={item.to}>
                      <Link
                        to={item.to}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 9,
                          padding: "7px 9px",
                          borderRadius: 7,
                          fontFamily: fonts.body,
                          fontSize: 13,
                          textDecoration: "none",
                          transition: "background-color 0.15s, color 0.15s",
                          ...(active
                            ? { backgroundColor: colors.forestGreen, color: colors.creamLight }
                            : { color: colors.forestGreen }),
                        }}
                        onMouseEnter={(e) => {
                          if (!active) e.currentTarget.style.backgroundColor = colors.creamMid;
                        }}
                        onMouseLeave={(e) => {
                          if (!active) e.currentTarget.style.backgroundColor = "transparent";
                        }}
                      >
                        <Icon name={item.icon} size={16} filled={active} />
                        <span>{t(item.labelKey)}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* ✅ User Profile & Dropdown Menu */}
      <div 
        ref={profileRef}
        style={{ 
          padding: "12px 18px 0", 
          borderTop: `1px solid ${colors.forestGreen}`, 
          position: "relative" 
        }}
      >
        <button
          onClick={() => setProfileOpen(!profileOpen)}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            gap: 9,
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 0,
            textAlign: isRTL ? "right" : "left",
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              border: `1px solid ${colors.forestGreen}`,
              backgroundColor: colors.creamMid,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: fonts.headline,
              fontWeight: 600,
              color: colors.forestGreen,
              flexShrink: 0,
              fontSize: 13,
              overflow: "hidden"
            }}
          >
            {/* ✅ Show real avatar or initial */}
            {currentUser.profile_picture ? (
              <img src={currentUser.profile_picture} alt="Avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              currentUser.initial
            )}
          </div>
          <div style={{ display: "flex", flexDirection: "column", flex: 1, minWidth: 0 }}>
            <span style={{ fontFamily: fonts.body, fontSize: 12, fontWeight: 600, color: colors.forestGreen }}>
              Hello {currentUser.username}
            </span>
            <span style={{ fontFamily: fonts.label, fontSize: 10, color: colors.forestGreen, opacity: 0.7 }}>
              {currentUser.role}
            </span>
          </div>
          <Icon name={profileOpen ? "expand_less" : "expand_more"} size={16} />
        </button>

        {profileOpen && (
          <div
            style={{
              position: "absolute",
              bottom: "100%",
              [isRTL ? "right" : "left"]: 18,
              width: 212,
              backgroundColor: colors.creamLight,
              border: `1px solid ${colors.forestGreen}`,
              borderRadius: 8,
              boxShadow: "0px -4px 20px rgba(11, 67, 53, 0.12)",
              marginBottom: 8,
              overflow: "hidden",
              zIndex: 100,
            }}
          >
            <Link
              to="/admin/profile"
              onClick={() => setProfileOpen(false)}
              style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", textDecoration: "none", color: colors.forestGreen, fontSize: 13, fontFamily: fonts.body, transition: "background 0.15s" }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = colors.creamMid)}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
            >
              <Icon name="person" size={16} />
              My Profile
            </Link>
            
            <Link
              to="/"
              onClick={() => setProfileOpen(false)}
              style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", textDecoration: "none", color: colors.forestGreen, fontSize: 13, fontFamily: fonts.body, transition: "background 0.15s" }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = colors.creamMid)}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
            >
              <Icon name="public" size={16} />
              View Public Site
            </Link>

            <div style={{ height: 1, backgroundColor: colors.forestGreen, opacity: 0.1, margin: "4px 0" }} />

            {/* ✅ REAL LOGOUT ACTION */}
            <button
              onClick={() => { 
                logout(); 
                navigate("/login"); 
                setProfileOpen(false); 
              }}
              style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", background: "none", border: "none", cursor: "pointer", color: colors.red, fontSize: 13, fontFamily: fonts.body, transition: "background 0.15s", textAlign: isRTL ? "right" : "left" }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(139, 44, 44, 0.08)")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
            >
              <Icon name="logout" size={16} />
              Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};

export default AdminSidebar;