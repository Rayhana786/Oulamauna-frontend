import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import oulamaunaLogo from "../../assets/OOLOGO.png";
import { useLang } from "../../context/LanguageContext";
import bgImage from "../../assets/bg4.png";

/* ─────────────────────── Types ─────────────────────── */
interface Child {
  label: string;
  to: string;
  badge?: number;
}

interface ChildGroup {
  groupLabelKey: string;
  groupIcon: string;
  children: Child[];
}

interface NavItem {
  type: "link" | "expandable" | "expandable-grouped" | "section";
  icon?: string;
  label?: string;
  labelKey?: string;
  to?: string;
  badge?: number;
  children?: Child[];
  groups?: ChildGroup[];
}

/* ─────────────────────── Nav data ─────────────────────── */
const NAV: NavItem[] = [
  { type: "link", icon: "grid_view", labelKey: "sidebar.dashboard", to: "/admin/dashboard" },

  { type: "section", labelKey: "sidebar.section.archives" },
  {
    type: "expandable", icon: "history_edu", labelKey: "sidebar.scholars",
    children: [
      { label: "sidebar.allScholars", to: "/admin/scholars" },
      { label: "sidebar.addScholar",  to: "/admin/scholars/new" },
    ],
  },
  {
    type: "expandable-grouped", icon: "contract_edit", labelKey: "sidebar.reviewDesk", badge: 48,
    groups: [
      {
        groupLabelKey: "sidebar.activeReview",
        groupIcon: "pending_actions",
        children: [
          { label: "sidebar.newScholars",       to: "/admin/pending/scholars", badge: 12 },
          { label: "sidebar.pendingEdits",      to: "/admin/pending/edits",    badge: 20 },
          { label: "sidebar.mediaVerification", to: "/admin/pending/media",    badge: 7  },
          { label: "sidebar.worksVerification", to: "/admin/pending/works",    badge: 9  },
        ],
      },
      {
        groupLabelKey: "sidebar.archive",
        groupIcon: "inventory_2",
        children: [
          { label: "sidebar.changesRequested", to: "/admin/pending/changes" },
          { label: "sidebar.rejected",         to: "/admin/pending/rejected" },
        ],
      },
    ],
  },
  { type: "link", icon: "menu_book", labelKey: "sidebar.disciplines", to: "/admin/disciplines" },

  { type: "section", labelKey: "sidebar.section.engagement" },
  {
    type: "expandable", icon: "forum", labelKey: "sidebar.communityHub",
    children: [
      { label: "sidebar.allPosts", to: "/admin/blog" },
      { label: "sidebar.reported", to: "/admin/blog/reported", badge: 3 },
    ],
  },

  { type: "section", labelKey: "sidebar.section.administration" },
  {
    type: "expandable", icon: "group", labelKey: "sidebar.userManagement",
    children: [
      { label: "sidebar.contributors", to: "/admin/users/contributors" },
      { label: "sidebar.bannedUsers",  to: "/admin/users/banned" },
    ],
  },
  { type: "link", icon: "flag",          labelKey: "sidebar.reports",       to: "/admin/reports",       badge: 5 },
  { type: "link", icon: "notifications", labelKey: "sidebar.notifications", to: "/admin/notifications", badge: 7 },
  {
    type: "expandable", icon: "settings", labelKey: "sidebar.settings",
    children: [
      { label: "sidebar.translation", to: "/admin/settings/translation" },
      { label: "sidebar.regions",     to: "/admin/settings/regions" },
      { label: "sidebar.backups",     to: "/admin/settings/backups" },
    ],
  },
];

/* ─────────────────────── Colors ─────────────────────── */
const C = {
  bg:       "#FAF9F6",
  border:   "#D9DAD8",
  primary:  "#0b4335",
  forest:   "#285B4B",
  gold:     "#C9A84C",
  text:     "#191c1b",
  muted:    "#404945",
  subtle:   "#c0c9c3",
  activeBg: "rgba(40,91,75,0.08)",
  hoverBg:  "rgba(11,67,53,0.06)",
};

/* ─────────────────────── Component ─────────────────────── */
export default function AdminSidebar() {
  const location = useLocation();
  const { t, lang } = useLang();
  const isRTL = lang === "AR";

  const [open, setOpen] = useState<Record<string, boolean>>({
    "sidebar.reviewDesk": true,
    "sidebar.activeReview": true,
  });

  const toggle = (key: string) => setOpen((o) => ({ ...o, [key]: !o[key] }));

  const isActive = (to: string) =>
    location.pathname === to || location.pathname.startsWith(to + "/");

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@500;600&family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20,300,0,0&display=swap" rel="stylesheet" />

      <style>{`
        .ms {
          font-family: 'Material Symbols Outlined';
          font-style: normal; font-size: 19px;
          display: inline-flex; align-items: center;
          user-select: none; line-height: 1;
        }

        .sb-item {
          display: flex; align-items: center; gap: 12px;
          padding: 11px 16px; margin: 3px 10px;
          border-radius: 4px;
          color: ${C.forest}; font-size: 13.5px; font-weight: 400;
          font-family: 'Inter', sans-serif;
          cursor: pointer; text-decoration: none;
          transition: background 0.15s, color 0.15s;
          border-left: 3px solid transparent;
          box-sizing: border-box;
        }
        [dir="rtl"] .sb-item {
          border-left: none; border-right: 3px solid transparent;
        }
        .sb-item:hover { background: ${C.hoverBg}; color: ${C.primary}; }
        .sb-item:hover .sb-icon { color: ${C.primary}; opacity: 1; }
        .sb-item.active {
          background: ${C.activeBg}; color: ${C.primary};
          font-weight: 600; border-left: 3px solid ${C.gold};
        }
        [dir="rtl"] .sb-item.active {
          border-left: none; border-right: 3px solid ${C.gold};
        }
        .sb-item.active .sb-icon { color: ${C.primary}; opacity: 1; }

        .sb-icon { color: ${C.forest}; opacity: 0.5; flex-shrink: 0; transition: color .15s, opacity .15s; }
        .sb-chev { font-size: 16px; color: ${C.forest}; opacity: 0.32; flex-shrink: 0; transition: transform .2s; }
        .sb-chev.open { transform: rotate(180deg); }

        /* ── Level 1 children (direct under expandable) ── */
        .sb-sub {
          display: flex; align-items: center; justify-content: space-between;
          padding: 9px 16px 9px 48px; margin: 2px 10px;
          border-radius: 4px; font-size: 13px;
          font-family: 'Inter', sans-serif; color: ${C.muted};
          cursor: pointer; text-decoration: none;
          transition: color .15s, background .15s;
          border-left: 3px solid transparent;
        }
        [dir="rtl"] .sb-sub {
          padding: 9px 48px 9px 16px;
          border-left: none; border-right: 3px solid transparent;
        }
        .sb-sub:hover { color: ${C.primary}; background: ${C.hoverBg}; }
        .sb-sub.active {
          background: ${C.activeBg}; color: ${C.primary};
          font-weight: 600; border-left: 3px solid ${C.gold};
        }
        [dir="rtl"] .sb-sub.active { border-left: none; border-right: 3px solid ${C.gold}; }

        /* ── Group header row (level 1.5) ── */
        .sb-group-header {
          display: flex; align-items: center; gap: 8px;
          padding: 8px 16px 8px 32px; margin: 2px 10px;
          border-radius: 4px; font-size: 11.5px; font-weight: 600;
          font-family: 'Inter', sans-serif;
          color: ${C.forest}; opacity: 0.75;
          cursor: pointer;
          transition: background .15s, opacity .15s;
          letter-spacing: 0.01em;
        }
        [dir="rtl"] .sb-group-header {
          padding: 8px 32px 8px 16px;
        }
        .sb-group-header:hover { background: ${C.hoverBg}; opacity: 1; }
        .sb-group-icon { font-size: 15px; opacity: 0.6; }
        .sb-group-chev { font-size: 14px; opacity: 0.4; margin-left: auto; transition: transform .2s; flex-shrink: 0; }
        [dir="rtl"] .sb-group-chev { margin-left: 0; margin-right: auto; }
        .sb-group-chev.open { transform: rotate(180deg); }

        /* ── Level 2 children (under group) ── */
        .sb-sub2 {
          display: flex; align-items: center; justify-content: space-between;
          padding: 8px 16px 8px 60px; margin: 2px 10px;
          border-radius: 4px; font-size: 12.5px;
          font-family: 'Inter', sans-serif; color: ${C.muted};
          cursor: pointer; text-decoration: none;
          transition: color .15s, background .15s;
          border-left: 3px solid transparent;
        }
        [dir="rtl"] .sb-sub2 {
          padding: 8px 60px 8px 16px;
          border-left: none; border-right: 3px solid transparent;
        }
        .sb-sub2:hover { color: ${C.primary}; background: ${C.hoverBg}; }
        .sb-sub2.active {
          background: ${C.activeBg}; color: ${C.primary};
          font-weight: 600; border-left: 3px solid ${C.gold};
        }
        [dir="rtl"] .sb-sub2.active { border-left: none; border-right: 3px solid ${C.gold}; }

        .badge { font-size: 10px; font-weight: 700; background: ${C.gold}; color: #fff;
                 border-radius: 99px; padding: 2px 8px; flex-shrink: 0;
                 font-family: 'Inter', sans-serif; line-height: 1.5; }
        .badge-sm { font-size: 10px; font-weight: 600;
                    background: rgba(201,168,76,0.18); color: #9a7d30;
                    border-radius: 99px; padding: 2px 8px; font-family: 'Inter', sans-serif; }

        .sb-section {
          padding: 22px 18px 6px; font-size: 9px; font-weight: 600;
          letter-spacing: 0.2em; text-transform: uppercase;
          color: rgba(40,91,75,0.42); font-family: 'JetBrains Mono', monospace;
        }

        .sb-signout {
          display: flex; align-items: center; gap: 12px;
          padding: 13px 18px; margin: 8px 10px;
          border-radius: 4px; border: 1.5px solid rgba(186,26,26,0.2);
          background: rgba(186,26,26,0.04);
          color: #ba1a1a; font-size: 13px; font-weight: 600;
          font-family: 'Inter', sans-serif;
          cursor: pointer; text-decoration: none;
          transition: background .15s, border-color .15s;
        }
        .sb-signout:hover { background: rgba(186,26,26,0.08); border-color: rgba(186,26,26,0.35); }

        .sb-inner { overflow-y: auto; flex: 1; padding: 4px 0 100px 0; }
        .sb-inner::-webkit-scrollbar { width: 3px; }
        .sb-inner::-webkit-scrollbar-thumb { background: rgba(11,67,53,0.12); border-radius: 99px; }
      `}</style>

      <aside
        dir={isRTL ? "rtl" : "ltr"}
        style={{
          width: 272,
          height: "100vh",
          position: "fixed",
          top: 0,
          left: isRTL ? "auto" : 0,
          right: isRTL ? 0 : "auto",
          zIndex: 40,
          backgroundImage: `url(${bgImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          backgroundColor: C.bg,
          borderRight: isRTL ? "none" : `1px solid ${C.border}`,
          borderLeft: isRTL ? `1px solid ${C.border}` : "none",
          display: "flex",
          flexDirection: "column",
          fontFamily: "'Inter', sans-serif",
        }}
      >
        {/* ── Header ── */}
        <div style={{
          padding: "24px 20px 18px",
          borderBottom: `1px solid ${C.border}`,
          flexShrink: 0,
        }}>
          <img
            src={oulamaunaLogo}
            alt="Oulamauna"
            style={{
              height: 48,
              width: "auto",
              objectFit: "contain",
              objectPosition: isRTL ? "right center" : "left center",
              display: "block",
              marginBottom: 14,
            }}
          />
          <div style={{
            fontSize: 17, fontWeight: 700, color: C.text,
            letterSpacing: "-0.01em", marginBottom: 3,
            fontFamily: "'Inter', sans-serif",
          }}>
            {t("sidebar.brandName")}
          </div>
          <div style={{
            fontSize: 9, fontWeight: 600, letterSpacing: "0.22em",
            textTransform: "uppercase", color: "rgba(40,91,75,0.42)",
            fontFamily: "'JetBrains Mono', monospace",
          }}>
            {t("sidebar.role")}
          </div>
        </div>

        {/* ── Scrollable nav ── */}
        <div className="sb-inner">
          <nav style={{ paddingTop: 8 }}>
            {NAV.map((item: NavItem, i: number) => {

              /* ── Section header ── */
              if (item.type === "section" && item.labelKey) {
                return <div key={i} className="sb-section">{t(item.labelKey)}</div>;
              }

              /* ── Plain link ── */
              if (item.type === "link" && item.to && item.labelKey) {
                return (
                  <Link
                    key={i}
                    to={item.to}
                    className={`sb-item${isActive(item.to) ? " active" : ""}`}
                  >
                    <span className="ms sb-icon">{item.icon}</span>
                    <span style={{ flex: 1 }}>{t(item.labelKey)}</span>
                    {item.badge !== undefined && <span className="badge">{item.badge}</span>}
                  </Link>
                );
              }

              /* ── Expandable flat ── */
              if (item.type === "expandable" && item.labelKey) {
                const isOpen = !!open[item.labelKey];
                const anyChildActive = item.children?.some((c) => isActive(c.to)) ?? false;

                return (
                  <div key={i}>
                    <div
                      className={`sb-item${anyChildActive ? " active" : ""}`}
                      onClick={() => toggle(item.labelKey!)}
                    >
                      <span className="ms sb-icon">{item.icon}</span>
                      <span style={{ flex: 1 }}>{t(item.labelKey)}</span>
                      {item.badge !== undefined && (
                        <span className="badge" style={{ marginRight: 6 }}>{item.badge}</span>
                      )}
                      <span className={`ms sb-chev${isOpen ? " open" : ""}`}>expand_more</span>
                    </div>

                    {isOpen && item.children?.map((c: Child, j: number) => (
                      <Link
                        key={j}
                        to={c.to}
                        className={`sb-sub${isActive(c.to) ? " active" : ""}`}
                      >
                        <span>{t(c.label)}</span>
                        {c.badge !== undefined && <span className="badge-sm">{c.badge}</span>}
                      </Link>
                    ))}
                  </div>
                );
              }

              /* ── Expandable grouped (nested) ── */
              if (item.type === "expandable-grouped" && item.labelKey) {
                const isOpen = !!open[item.labelKey];
                const anyChildActive = item.groups?.some(
                  (g) => g.children.some((c) => isActive(c.to))
                ) ?? false;

                return (
                  <div key={i}>
                    {/* Top-level row */}
                    <div
                      className={`sb-item${anyChildActive ? " active" : ""}`}
                      onClick={() => toggle(item.labelKey!)}
                    >
                      <span className="ms sb-icon">{item.icon}</span>
                      <span style={{ flex: 1 }}>{t(item.labelKey)}</span>
                      {item.badge !== undefined && (
                        <span className="badge" style={{ marginRight: 6 }}>{item.badge}</span>
                      )}
                      <span className={`ms sb-chev${isOpen ? " open" : ""}`}>expand_more</span>
                    </div>

                    {/* Groups */}
                    {isOpen && item.groups?.map((group: ChildGroup, gi: number) => {
                      const groupKey = group.groupLabelKey;
                      const isGroupOpen = open[groupKey] !== false; // default open
                      const anyGroupChildActive = group.children.some((c) => isActive(c.to));

                      return (
                        <div key={gi}>
                          {/* Group header */}
                          <div
                            className="sb-group-header"
                            style={{ color: anyGroupChildActive ? C.primary : undefined }}
                            onClick={() => toggle(groupKey)}
                          >
                            <span className="ms sb-group-icon">{group.groupIcon}</span>
                            <span>{t(group.groupLabelKey)}</span>
                            <span className={`ms sb-group-chev${isGroupOpen ? " open" : ""}`}>
                              expand_more
                            </span>
                          </div>

                          {/* Group children */}
                          {isGroupOpen && group.children.map((c: Child, ci: number) => (
                            <Link
                              key={ci}
                              to={c.to}
                              className={`sb-sub2${isActive(c.to) ? " active" : ""}`}
                            >
                              <span>{t(c.label)}</span>
                              {c.badge !== undefined && <span className="badge-sm">{c.badge}</span>}
                            </Link>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                );
              }

              return null;
            })}
          </nav>
        </div>
      </aside>
    </>
  );
}