import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useLang } from "../../context/LanguageContext";

// Logo
import logoImg from "../../assets/tlogo2.png";

// Exact Islamic decorative pattern
import islamicPattern from "../../assets/islamic-pattern.png";

/* ------------------------------------------------------------------ */
/* Design tokens                                                       */
/* ------------------------------------------------------------------ */

const colors = {
  creamLight: "#fcfaf5",
  creamMid: "#f6efdc",
  creamDark: "#e5d5a8",

  forestGreen: "#0b4335",
  forestDark: "#07382d",

  amber: "#b8860b",
  red: "#8b2c2c",

  sidebarText: "#f4f3eb",
  sidebarMuted: "rgba(244, 243, 235, 0.62)",
  sidebarHover: "rgba(126, 139, 82, 0.20)",
  sidebarHoverText: "#d9d0ad",
  sidebarActive: "rgba(112, 128, 73, 0.48)",
  sidebarActiveText: "#e3dcc0",
  sectionText: "rgba(216, 191, 134, 0.78)",
};

const fonts = {
  headline: "'Hanken Grotesk', sans-serif",
  body: "'Inter', sans-serif",
  label: "'JetBrains Mono', monospace",
};

/* ------------------------------------------------------------------ */
/* Icon                                                                */
/* ------------------------------------------------------------------ */

const Icon: React.FC<{
  name: string;
  size?: number;
  filled?: boolean;
}> = ({ name, size = 23, filled = false }) => (
  <span
    className="material-symbols-outlined"
    style={{
      fontSize: size,
      lineHeight: 1,
      fontVariationSettings: `'FILL' ${filled ? 1 : 0}, 'wght' 400, 'GRAD' 0, 'opsz' 24`,
      fontWeight: 400,
    }}
  >
    {name}
  </span>
);

/* ------------------------------------------------------------------ */
/* Navigation types                                                    */
/* ------------------------------------------------------------------ */

type NavLink = {
  icon: string;
  labelKey: string;
  to: string;
};

type NavGroup = {
  sectionKey?: string;
  links: NavLink[];
};

/* ------------------------------------------------------------------ */
/* Navigation Groups                                                   */
/* ------------------------------------------------------------------ */

const navGroups: NavGroup[] = [
  {
    links: [
      {
        icon: "dashboard",
        labelKey: "admin.sidebar.dashboard",
        to: "/admin/dashboard",
      },
    ],
  },
  {
    sectionKey: "admin.sidebar.section.content",
    links: [
      {
        icon: "history_edu",
        labelKey: "admin.sidebar.allScholars",
        to: "/admin/scholars",
      },
      {
        icon: "menu_book",
        labelKey: "admin.sidebar.allWorks",
        to: "/admin/works",
      },
      {
        icon: "perm_media",
        labelKey: "admin.sidebar.allMedia",
        to: "/admin/media",
      },
    ],
  },
  {
    sectionKey: "admin.sidebar.section.review",
    links: [
      {
        icon: "person_add",
        labelKey: "admin.sidebar.pendingNewScholars",
        to: "/admin/pending/scholars",
      },
      {
        icon: "edit_document",
        labelKey: "admin.sidebar.pendingScholarEdits",
        to: "/admin/pending/edits",
      },
      {
        icon: "post_add",
        labelKey: "admin.sidebar.pendingWorks",
        to: "/admin/pending/works",
      },
      {
        icon: "image_search",
        labelKey: "admin.sidebar.mediaVerification",
        to: "/admin/pending/media",
      },
    ],
  },
  {
    sectionKey: "admin.sidebar.section.classification",
    links: [
      {
        icon: "category",
        labelKey: "admin.sidebar.disciplines",
        to: "/admin/disciplines",
      },
      {
        icon: "travel_explore",
        labelKey: "admin.sidebar.regions",
        to: "/admin/regions",
      },
    ],
  },
  {
    sectionKey: "admin.sidebar.section.discussions",
    links: [
      {
        icon: "forum",
        labelKey: "admin.sidebar.allDiscussions",
        to: "/admin/discussions",
      },
      {
        icon: "sell",
        labelKey: "admin.sidebar.discussionCategories",
        to: "/admin/discussions/categories",
      },
    ],
  },
  {
    sectionKey: "admin.sidebar.section.community",
    links: [
      {
        icon: "manage_accounts",
        labelKey: "admin.sidebar.userManagement",
        to: "/admin/users",
      },
    ],
  },
  {
    sectionKey: "admin.sidebar.section.support",
    links: [
      {
        icon: "assessment",
        labelKey: "admin.sidebar.reports",
        to: "/admin/reports",
      },
      {
        icon: "contact_mail",
        labelKey: "admin.sidebar.contactUs",
        to: "/admin/contactus",
      },
    ],
  },
];

/* ------------------------------------------------------------------ */
/* Sidebar props                                                       */
/* ------------------------------------------------------------------ */

interface AdminSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

/* ------------------------------------------------------------------ */
/* Admin Sidebar                                                       */
/* ------------------------------------------------------------------ */

const AdminSidebar: React.FC<AdminSidebarProps> = ({ collapsed, onToggle }) => {
  const location = useLocation();
  const { t, lang } = useLang();
  const isRTL = lang === "AR";

  return (
    <nav
      style={{
        width: collapsed ? 72 : 248,
        height: "100vh",
        position: "fixed",
        top: 0,
        left: isRTL ? "auto" : 0,
        right: isRTL ? 0 : "auto",
        background: "linear-gradient(180deg, #0b4335 0%, #07382d 100%)",
        borderRight: isRTL ? "none" : "1px solid rgba(255,255,255,0.05)",
        borderLeft: isRTL ? "1px solid rgba(255,255,255,0.05)" : "none",
        boxShadow: "4px 0 24px rgba(4, 38, 30, 0.18)",
        zIndex: 50,
        display: "flex",
        flexDirection: "column",
        paddingTop: 18,
        paddingBottom: 16,
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
          text-rendering: optimizeLegibility;
        }

        .admin-sidebar-scroll::-webkit-scrollbar { width: 4px; }
        .admin-sidebar-scroll::-webkit-scrollbar-track { background: transparent; }
        .admin-sidebar-scroll::-webkit-scrollbar-thumb {
          background: rgba(126, 139, 82, 0.28);
          border-radius: 10px;
        }
        .admin-sidebar-scroll {
          scrollbar-width: thin;
          scrollbar-color: rgba(126, 139, 82, 0.28) transparent;
        }
      `}</style>

      {/* Collapse / Expand Button */}
      <button
        onClick={onToggle}
        style={{
          position: "absolute",
          top: 18,
          [isRTL ? "left" : "right"]: 10,
          width: 28,
          height: 28,
          borderRadius: "50%",
          border: "1px solid rgba(216, 191, 134, 0.40)",
          backgroundColor: "rgba(255,255,255,0.05)",
          color: colors.creamDark,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "background-color 0.2s ease, border-color 0.2s ease",
          zIndex: 60,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = "rgba(126, 139, 82, 0.22)";
          e.currentTarget.style.borderColor = "rgba(216, 191, 134, 0.55)";
          e.currentTarget.style.color = colors.sidebarHoverText;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.05)";
          e.currentTarget.style.borderColor = "rgba(216, 191, 134, 0.40)";
          e.currentTarget.style.color = colors.creamDark;
        }}
        title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        <Icon 
          name={collapsed ? (isRTL ? "arrow_back" : "arrow_forward") : (isRTL ? "arrow_forward" : "arrow_back")} 
          size={16} 
        />
      </button>

      {/* Logo */}
      <div style={{ padding: "0 16px", marginBottom: 24 }}>
        <Link
          to="/admin/dashboard"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: collapsed ? "center" : "flex-start",
            textDecoration: "none",
            gap: 10,
            minHeight: 44,
          }}
        >
          <img
            src={logoImg}
            alt="Oulamnauna Logo"
            style={{
              height: collapsed ? 32 : 42,
              width: "auto",
              maxWidth: "100%",
              objectFit: "contain",
              transition: "height 0.3s ease",
              filter: "none",
              opacity: 0.95,
            }}
          />
          {!collapsed && (
            <span
              style={{
                fontFamily: fonts.headline,
                fontSize: 18,
                lineHeight: "24px",
                fontWeight: 700,
                color: colors.sidebarText,
                whiteSpace: "nowrap",
                overflow: "hidden",
              }}
            >
              Oulamnauna
            </span>
          )}
        </Link>
      </div>

      {/* Scrollable Navigation */}
      <div
        className="admin-sidebar-scroll"
        style={{
          flex: 1,
          overflowY: "auto",
          paddingTop: 0,
          paddingLeft: collapsed ? 8 : 10,
          paddingRight: collapsed ? 8 : 10,
          paddingBottom: 185,
          marginBottom: 8,
          position: "relative",
          zIndex: 2,
        }}
      >
        {navGroups.map((group, idx) => {
          // Skip rendering empty groups (e.g., if a section has no links)
          if (group.links.length === 0) return null;

          return (
            <div key={group.sectionKey ?? `group-${idx}`} style={{ marginBottom: 18 }}>
              {!collapsed && group.sectionKey && (
                <p
                  style={{
                    fontFamily: fonts.label,
                    fontSize: 10,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: colors.sectionText,
                    opacity: 0.82,
                    margin: "0 0 8px",
                    padding: "0 10px",
                    lineHeight: "16px",
                  }}
                >
                  {t(group.sectionKey)}
                </p>
              )}

              <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 3, margin: 0, padding: 0 }}>
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
                          gap: 14,
                          padding: collapsed ? "10px 8px" : "10px 14px",
                          minHeight: 44,
                          borderRadius: 10,
                          fontFamily: fonts.body,
                          fontSize: 14,
                          fontWeight: active ? 600 : 500,
                          textDecoration: "none",
                          color: active ? colors.sidebarActiveText : colors.sidebarText,
                          backgroundColor: active ? colors.sidebarActive : "transparent",
                          justifyContent: collapsed ? "center" : "flex-start",
                          whiteSpace: "nowrap",
                          position: "relative",
                          overflow: "hidden",
                          transition: "background-color 0.18s ease, color 0.18s ease",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = colors.sidebarHover;
                          e.currentTarget.style.color = colors.sidebarHoverText;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = active ? colors.sidebarActive : "transparent";
                          e.currentTarget.style.color = active ? colors.sidebarActiveText : colors.sidebarText;
                        }}
                      >
                        <span
                          style={{
                            width: 26,
                            height: 26,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                            color: active ? colors.sidebarActiveText : colors.sidebarText,
                            transition: "color 0.18s ease",
                          }}
                        >
                          <Icon name={item.icon} size={23} filled={active && item.icon === "dashboard"} />
                        </span>

                        {!collapsed && (
                          <span
                            style={{
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              flex: 1,
                              lineHeight: "20px",
                              transition: "color 0.18s ease",
                            }}
                          >
                            {t(item.labelKey)}
                          </span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>

      {/* Islamic Decorative Pattern */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          width: "100%",
          height: collapsed ? 150 : 205,
          pointerEvents: "none",
          zIndex: 1,
          overflow: "hidden",
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "center",
          transition: "height 0.3s ease",
        }}
      >
        <img
          src={islamicPattern}
          alt=""
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "center bottom",
            display: "block",
            opacity: 0.48,
          }}
        />
      </div>

      {/* Bottom separator */}
      {!collapsed && (
        <div
          style={{
            height: 1,
            margin: "0 18px",
            backgroundColor: "rgba(216, 191, 134, 0.14)",
            position: "relative",
            zIndex: 5,
          }}
        />
      )}
    </nav>
  );
};

export default AdminSidebar;