
import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useLang } from "../../context/LanguageContext";

import logoImg from "../../assets/tlogo2.png";
import islamicPattern from "../../assets/islamic-pattern.png";

const colors = {
  forestGreen: "#0b4335",
  forestDark: "#07382d",
  creamDark: "#e5d5a8",
  sidebarText: "#f4f3eb",
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

type NavLink = {
  icon: string;
  labelKey: string;
  to: string;
};

type NavGroup = {
  sectionKey?: string;
  links: NavLink[];
};

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
      { icon: "history_edu", labelKey: "admin.sidebar.allScholars", to: "/admin/scholars" },
      { icon: "menu_book", labelKey: "admin.sidebar.allWorks", to: "/admin/works" },
      { icon: "perm_media", labelKey: "admin.sidebar.allMedia", to: "/admin/media" },
    ],
  },
  {
    sectionKey: "admin.sidebar.section.review",
    links: [
      { icon: "person_add", labelKey: "admin.sidebar.pendingNewScholars", to: "/admin/pending/scholars" },
      { icon: "edit_document", labelKey: "admin.sidebar.pendingScholarEdits", to: "/admin/pending/edits" },
      { icon: "post_add", labelKey: "admin.sidebar.pendingWorks", to: "/admin/pending/works" },
      { icon: "image_search", labelKey: "admin.sidebar.mediaVerification", to: "/admin/pending/media" },
    ],
  },
  {
    sectionKey: "admin.sidebar.section.classification",
    links: [
      { icon: "category", labelKey: "admin.sidebar.disciplines", to: "/admin/disciplines" },
      { icon: "travel_explore", labelKey: "admin.sidebar.regions", to: "/admin/regions" },
    ],
  },
  {
    sectionKey: "admin.sidebar.section.discussions",
    links: [
      { icon: "forum", labelKey: "admin.sidebar.allDiscussions", to: "/admin/discussions" },
      { icon: "sell", labelKey: "admin.sidebar.discussionCategories", to: "/admin/discussions/categories" },
    ],
  },
  {
    sectionKey: "admin.sidebar.section.community",
    links: [
      { icon: "manage_accounts", labelKey: "admin.sidebar.userManagement", to: "/admin/users" },
    ],
  },
  {
    sectionKey: "admin.sidebar.section.support",
    links: [
      { icon: "assessment", labelKey: "admin.sidebar.reports", to: "/admin/reports" },
      { icon: "contact_mail", labelKey: "admin.sidebar.contactUs", to: "/admin/contactus" },
    ],
  },
];

interface AdminSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({
  collapsed,
  onToggle,
  mobileOpen,
  onCloseMobile,
}) => {
  const location = useLocation();
  const { t, lang } = useLang();
  const isRTL = lang === "AR";

  const [isMobile, setIsMobile] = useState(
    () => typeof window !== "undefined" && window.innerWidth <= 1024
  );

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 1024;
      setIsMobile(mobile);

      if (!mobile) {
        onCloseMobile();
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, [onCloseMobile]);

  // Close the drawer using Escape
  useEffect(() => {
    if (!mobileOpen || !isMobile) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCloseMobile();
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [mobileOpen, isMobile, onCloseMobile]);

  // Prevent background scrolling while the mobile drawer is open
  useEffect(() => {
    if (!isMobile || !mobileOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isMobile, mobileOpen]);

  const isCollapsed = isMobile ? false : collapsed;

  const sidebarWidth = isMobile
    ? "min(300px, calc(100vw - 48px))"
    : isCollapsed
      ? "72px"
      : "248px";

  const isActive = (path: string) =>
    location.pathname === path ||
    location.pathname.startsWith(path + "/");

  return (
    <>
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

        .admin-sidebar-scroll {
          scrollbar-width: thin;
          scrollbar-color: rgba(126,139,82,.4) transparent;
          overscroll-behavior: contain;
        }

        .admin-sidebar-scroll::-webkit-scrollbar {
          width: 4px;
        }

        .admin-sidebar-scroll::-webkit-scrollbar-track {
          background: transparent;
        }

        .admin-sidebar-scroll::-webkit-scrollbar-thumb {
          background: rgba(126,139,82,.4);
          border-radius: 10px;
        }

        .admin-sidebar-link:focus-visible,
        .admin-sidebar-control:focus-visible {
          outline: 2px solid #e5d5a8;
          outline-offset: 2px;
        }
      `}</style>

      {/* Mobile backdrop */}
      {isMobile && mobileOpen && (
        <button
          type="button"
          aria-label="Close navigation menu"
          onClick={onCloseMobile}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 998,
            width: "100%",
            height: "100%",
            border: 0,
            padding: 0,
            background: "rgba(0, 0, 0, 0.48)",
            cursor: "pointer",
            WebkitTapHighlightColor: "transparent",
          }}
        />
      )}

      {/* Sidebar drawer */}
      <nav
        id="admin-sidebar"
        aria-label="Admin navigation"
        aria-hidden={isMobile && !mobileOpen}
        style={{
          position: "fixed",
          top: 0,
          bottom: 0,
          [isRTL ? "right" : "left"]: 0,
          width: sidebarWidth,
          height: "100vh",
          height: "100dvh",
          boxSizing: "border-box",
          background: "linear-gradient(180deg, #0b4335 0%, #07382d 100%)",
          borderRight: isRTL ? "none" : "1px solid rgba(255,255,255,0.05)",
          borderLeft: isRTL ? "1px solid rgba(255,255,255,0.05)" : "none",
          boxShadow: "4px 0 24px rgba(4,38,30,0.18)",
          zIndex: 999,
          display: "flex",
          flexDirection: "column",
          paddingTop: "max(18px, env(safe-area-inset-top))",
          paddingBottom: "max(12px, env(safe-area-inset-bottom))",
          overflow: "hidden",
          visibility: isMobile && !mobileOpen ? "hidden" : "visible",
          transform: isMobile
            ? mobileOpen
              ? "translateX(0)"
              : `translateX(${isRTL ? "100%" : "-100%"})`
            : "translateX(0)",
          transition:
            "transform 0.28s ease, width 0.28s ease, visibility 0.28s ease",
        }}
      >
        {/* Header controls */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: isCollapsed ? "center" : "space-between",
            minHeight: 38,
            padding: isCollapsed ? "0 10px" : "0 14px",
            flexShrink: 0,
          }}
        >
          {!isMobile && (
            <button
              type="button"
              className="admin-sidebar-control"
              onClick={onToggle}
              aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              style={{
                width: 30,
                height: 30,
                flexShrink: 0,
                borderRadius: "50%",
                border: "1px solid rgba(216,191,134,.4)",
                background: "rgba(255,255,255,.05)",
                color: colors.creamDark,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Icon
                name={
                  isCollapsed
                    ? isRTL
                      ? "arrow_back"
                      : "arrow_forward"
                    : isRTL
                      ? "arrow_forward"
                      : "arrow_back"
                }
                size={16}
              />
            </button>
          )}

          {isMobile && (
            <span
              style={{
                color: colors.creamDark,
                fontFamily: fonts.label,
                fontSize: 11,
                letterSpacing: "0.1em",
              }}
            >
              {t("admin.sidebar.mobileMenu")}
            </span>
          )}

          {isMobile && (
            <button
              type="button"
              className="admin-sidebar-control"
              onClick={onCloseMobile}
              aria-label="Close navigation menu"
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                border: "1px solid rgba(216,191,134,.35)",
                background: "rgba(255,255,255,.06)",
                color: colors.sidebarText,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Icon name="close" size={22} />
            </button>
          )}
        </div>

        {/* Logo */}
        <div
          style={{
            padding: isCollapsed ? "8px 10px 18px" : "8px 16px 22px",
            flexShrink: 0,
          }}
        >
          <Link
            to="/admin/dashboard"
            onClick={isMobile ? onCloseMobile : undefined}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: isCollapsed ? "center" : "flex-start",
              textDecoration: "none",
              gap: 10,
              minHeight: 44,
              minWidth: 0,
            }}
          >
            <img
              src={logoImg}
              alt="Oulamnauna Logo"
              style={{
                height: isCollapsed ? 32 : 42,
                width: "auto",
                maxWidth: "100%",
                objectFit: "contain",
                flexShrink: 0,
                opacity: 0.95,
              }}
            />

            {!isCollapsed && (
              <span
                style={{
                  fontFamily: fonts.headline,
                  fontSize: 18,
                  lineHeight: "24px",
                  fontWeight: 700,
                  color: colors.sidebarText,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                Oulamnauna
              </span>
            )}
          </Link>
        </div>

        {/* Scrollable navigation */}
        <div
          className="admin-sidebar-scroll"
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: "auto",
            overflowX: "hidden",
            paddingLeft: isCollapsed ? 8 : 10,
            paddingRight: isCollapsed ? 8 : 10,
            paddingBottom: 20,
            position: "relative",
            zIndex: 2,
          }}
        >
          {navGroups.map((group, idx) => (
            <div
              key={group.sectionKey ?? `group-${idx}`}
              style={{ marginBottom: 18 }}
            >
              {!isCollapsed && group.sectionKey && (
                <p
                  style={{
                    fontFamily: fonts.label,
                    fontSize: 10,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: colors.sectionText,
                    opacity: 0.9,
                    margin: "0 0 8px",
                    padding: "0 10px",
                    lineHeight: "16px",
                  }}
                >
                  {t(group.sectionKey)}
                </p>
              )}

              <ul
                style={{
                  listStyle: "none",
                  display: "flex",
                  flexDirection: "column",
                  gap: 3,
                  margin: 0,
                  padding: 0,
                }}
              >
                {group.links.map((item) => {
                  const active = isActive(item.to);

                  return (
                    <li key={item.to}>
                      <Link
                        className="admin-sidebar-link"
                        to={item.to}
                        onClick={isMobile ? onCloseMobile : undefined}
                        title={isCollapsed ? t(item.labelKey) : undefined}
                        aria-current={active ? "page" : undefined}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 14,
                          padding: isCollapsed ? "10px 8px" : "10px 14px",
                          minHeight: 44,
                          boxSizing: "border-box",
                          borderRadius: 10,
                          fontFamily: fonts.body,
                          fontSize: 14,
                          fontWeight: active ? 600 : 500,
                          textDecoration: "none",
                          color: active
                            ? colors.sidebarActiveText
                            : colors.sidebarText,
                          backgroundColor: active
                            ? colors.sidebarActive
                            : "transparent",
                          justifyContent: isCollapsed
                            ? "center"
                            : "flex-start",
                          whiteSpace: "nowrap",
                          position: "relative",
                          overflow: "hidden",
                          transition:
                            "background-color .18s ease, color .18s ease",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor =
                            colors.sidebarHover;
                          e.currentTarget.style.color =
                            colors.sidebarHoverText;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = active
                            ? colors.sidebarActive
                            : "transparent";
                          e.currentTarget.style.color = active
                            ? colors.sidebarActiveText
                            : colors.sidebarText;
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
                            color: active
                              ? colors.sidebarActiveText
                              : colors.sidebarText,
                          }}
                        >
                          <Icon
                            name={item.icon}
                            size={23}
                            filled={active && item.icon === "dashboard"}
                          />
                        </span>

                        {!isCollapsed && (
                          <span
                            style={{
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              flex: 1,
                              minWidth: 0,
                              lineHeight: "20px",
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
          ))}
        </div>

        {/* Bottom decoration */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            width: "100%",
            height: isCollapsed ? 125 : 165,
            pointerEvents: "none",
            zIndex: 1,
            overflow: "hidden",
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
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
              opacity: 0.25,
            }}
          />
        </div>

        {/* Bottom separator */}
        {!isCollapsed && (
          <div
            style={{
              height: 1,
              margin: "0 18px",
              backgroundColor: "rgba(216,191,134,.14)",
              position: "relative",
              zIndex: 5,
              flexShrink: 0,
            }}
          />
        )}
      </nav>
    </>
  );
};

export default AdminSidebar;
