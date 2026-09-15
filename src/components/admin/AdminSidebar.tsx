import React, { useState, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useLang } from "../../context/LanguageContext";
import { useAuth } from "../../context/AuthContext";

// ✅ IMPORT THE LOGO (Adjust the path if your folder structure is different)
import logoImg from "../../assets/logo.png"; 

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

type NavLink = { icon: string; labelKey: string; to: string };
type NavGroup = { sectionKey?: string; links: NavLink[] };

const navGroups: NavGroup[] = [
  { links: [{ icon: "grid_view", labelKey: "navbar.dashboard", to: "/admin/dashboard" }] },
  {
    sectionKey: "sidebar.section.scholars",
    links: [{ icon: "school", labelKey: "sidebar.allScholars", to: "/admin/scholars" }],
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
    sectionKey: "sidebar.section.discussions",
    links: [
      { icon: "forum", labelKey: "sidebar.allDiscussions", to: "/admin/discussions" },
      { icon: "category", labelKey: "sidebar.discussionCategories", to: "/admin/discussions/categories" },
    ],
  },
  {
    sectionKey: "sidebar.section.community",
    links: [{ icon: "manage_accounts", labelKey: "sidebar.userManagement", to: "/admin/users" }],
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

interface AdminSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({ collapsed, onToggle }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t, lang } = useLang();
  const { user, logout } = useAuth();
  const isRTL = lang === "AR";

  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const currentUser = {
    username: user?.username || "User",
    role: "Administrator",
    // ✅ Fixed TypeScript error: safely access 'name' or fallback to 'username'
    initial: ((user as any)?.name || user?.username || "U").charAt(0).toUpperCase(),
    profile_picture: (user as any)?.profile_picture || (user as any)?.avatar,
  };

  return (
    <nav
      style={{
        width: collapsed ? 72 : 248,
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
        paddingTop: 18,
        paddingBottom: 12,
        transition: "width 0.3s ease",
        overflow: "hidden",
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

      {/* ✅ Collapse/Expand Arrow Button */}
      <button
        onClick={onToggle}
        style={{
          position: "absolute",
          top: 18,
          [isRTL ? "left" : "right"]: 8,
          width: 24,
          height: 24,
          borderRadius: "50%",
          border: `1px solid ${colors.forestGreen}`,
          backgroundColor: colors.creamLight,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "all 0.2s",
          zIndex: 60,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = colors.forestGreen;
          e.currentTarget.style.color = colors.creamLight;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = colors.creamLight;
          e.currentTarget.style.color = colors.forestGreen;
        }}
        title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        <Icon 
          name={collapsed ? (isRTL ? "arrow_back" : "arrow_forward") : (isRTL ? "arrow_forward" : "arrow_back")} 
          size={16} 
        />
      </button>

      {/* ✅ Logo / header using imported image + Text */}
      <div style={{ padding: "0 18px", marginBottom: 20 }}>
        <Link
          to="/admin/dashboard"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: collapsed ? "center" : "flex-start",
            textDecoration: "none",
            gap: 10, // ✅ Adds space between the logo and the text
          }}
        >
          <img 
            src={logoImg} 
            alt="Oulamnauna Logo" 
            style={{ 
              height: collapsed ? 32 : 44, // Scales down smoothly when collapsed
              width: "auto", 
              maxWidth: "100%",
              objectFit: "contain",
              transition: "height 0.3s ease",
            }} 
          />
          
          {/* ✅ Text that hides when collapsed */}
          {!collapsed && (
            <span
              style={{
                fontFamily: fonts.headline,
                fontSize: 18,
                lineHeight: "24px",
                fontWeight: 700,
                color: colors.forestGreen,
                whiteSpace: "nowrap",
                overflow: "hidden",
              }}
            >
              Oulamnauna
            </span>
          )}
        </Link>
      </div>

      {/* Nav groups - SCROLLABLE AREA */}
      <div className="admin-sidebar-scroll" style={{ flex: 1, overflowY: "auto", padding: "0 8px", marginBottom: 12 }}>
        {navGroups.map((group, idx) => (
          <div key={group.sectionKey ?? `group-${idx}`} style={{ marginBottom: 16 }}>
            {!collapsed && group.sectionKey && (
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
                      title={collapsed ? t(item.labelKey) : ""}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 9,
                        padding: collapsed ? "7px" : "7px 9px",
                        borderRadius: 7,
                        fontFamily: fonts.body,
                        fontSize: 13,
                        textDecoration: "none",
                        transition: "background-color 0.15s, color 0.15s",
                        ...(active
                          ? { backgroundColor: colors.forestGreen, color: colors.creamLight }
                          : { color: colors.forestGreen }),
                        justifyContent: collapsed ? "center" : "flex-start",
                        whiteSpace: "nowrap",
                      }}
                      onMouseEnter={(e) => {
                        if (!active) e.currentTarget.style.backgroundColor = colors.creamMid;
                      }}
                      onMouseLeave={(e) => {
                        if (!active) e.currentTarget.style.backgroundColor = "transparent";
                      }}
                    >
                      <Icon name={item.icon} size={16} filled={active} />
                      {!collapsed && (
                        <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
                          {t(item.labelKey)}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      {/* User Profile & Dropdown Menu - STICKY AT BOTTOM */}
      <div 
        ref={profileRef}
        style={{ 
          padding: "12px 18px 0", 
          borderTop: `1px solid ${colors.forestGreen}`,
          backgroundColor: colors.creamLight,
          zIndex: 10,
          position: "relative",
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
            justifyContent: collapsed ? "center" : "flex-start",
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
            {currentUser.profile_picture ? (
              <img src={currentUser.profile_picture} alt="Avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              currentUser.initial
            )}
          </div>
          {!collapsed && (
            <>
              <div style={{ display: "flex", flexDirection: "column", flex: 1, minWidth: 0 }}>
                <span style={{ fontFamily: fonts.body, fontSize: 12, fontWeight: 600, color: colors.forestGreen }}>
                  Hello {currentUser.username}
                </span>
                <span style={{ fontFamily: fonts.label, fontSize: 10, color: colors.forestGreen, opacity: 0.7 }}>
                  {currentUser.role}
                </span>
              </div>
              <Icon name={profileOpen ? "expand_less" : "expand_more"} size={16} />
            </>
          )}
        </button>

        {/* ✅ Dropdown Menu - Fixed position so it NEVER gets cut off */}
        {profileOpen && (
          <div
            style={{
              position: "fixed",
              bottom: 80,
              [isRTL ? "right" : "left"]: collapsed ? 80 : 18,
              width: 212,
              backgroundColor: colors.creamLight,
              border: `1px solid ${colors.forestGreen}`,
              borderRadius: 8,
              boxShadow: "0px -4px 20px rgba(11, 67, 53, 0.12)",
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