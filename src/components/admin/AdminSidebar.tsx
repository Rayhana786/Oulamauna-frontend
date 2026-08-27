import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useLang } from "../../context/LanguageContext";

/* ------------------------------------------------------------------ */
/*  Design tokens — Oulamnauna admin palette                          */
/* ------------------------------------------------------------------ */
const colors = {
  creamLight: "#fcfaf5",
  creamMid: "#f3ebd6",
  creamDark: "#e5d5a8",
  forestGreen: "#0b4335",
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
      { icon: "person_add", labelKey: "sidebar.addScholar", to: "/admin/scholars/new" },
    ],
  },
  {
    sectionKey: "sidebar.section.review",
    links: [
      // ✅ UPDATED: Clearly separated "New" vs "Edits" to match backend
      { icon: "how_to_reg", labelKey: "sidebar.pendingNewScholars", to: "/admin/pending/scholars" },
      { icon: "edit_document", labelKey: "sidebar.pendingScholarEdits", to: "/admin/pending/edits" },
      { icon: "menu_book", labelKey: "sidebar.pendingWorks", to: "/admin/pending/works" },
      { icon: "perm_media", labelKey: "sidebar.mediaVerification", to: "/admin/pending/media" },
      { icon: "block", labelKey: "sidebar.rejected", to: "/admin/rejected" },
    ],
  },
  {
    links: [{ icon: "category", labelKey: "sidebar.disciplines", to: "/admin/disciplines" }],
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
      { icon: "public", labelKey: "sidebar.regions", to: "/admin/settings/regions" },
      { icon: "backup", labelKey: "sidebar.backups", to: "/admin/settings/backups" },
    ],
  },
];

/* ------------------------------------------------------------------ */
/*  Sidebar                                                             */
/* ------------------------------------------------------------------ */
const AdminSidebar: React.FC = () => {
  const location = useLocation();
  const { t, lang } = useLang();
  const isRTL = lang === "AR";

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
            <div key={group.sectionKey ?? `group-${idx}`}>
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
                  // ✅ FIX: Use startsWith so the link stays active when viewing a specific scholar (e.g., /admin/pending/scholars/123)
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
                          if (!active) {
                            e.currentTarget.style.backgroundColor = colors.creamMid;
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!active) {
                            e.currentTarget.style.backgroundColor = "transparent";
                          }
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

      {/* User profile */}
      <div style={{ padding: "12px 18px 0", borderTop: `1px solid ${colors.forestGreen}`, display: "flex", alignItems: "center", gap: 9, cursor: "pointer" }}>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            border: `1px solid ${colors.forestGreen}`,
            backgroundColor: colors.creamDark,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: fonts.headline,
            fontWeight: 600,
            color: colors.forestGreen,
            flexShrink: 0,
            fontSize: 13,
          }}
        >
          A
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ fontFamily: fonts.body, fontSize: 12, fontWeight: 600, color: colors.forestGreen }}>
            Hello Aarav
          </span>
          <span style={{ fontFamily: fonts.label, fontSize: 10, color: colors.forestGreen }}>
            Director of Research
          </span>
        </div>
      </div>
    </nav>
  );
};

export default AdminSidebar;