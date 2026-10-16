
import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";

import { useLang } from "../../context/LanguageContext";
import { useAuth } from "../../context/AuthContext";

import AdminNotificationsPanel from "./AdminNotificationsPanel";
import { notificationApi } from "../../api/notificationApi";

/* ------------------------------------------------------------------ */
/* Design tokens                                                       */
/* ------------------------------------------------------------------ */

const colors = {
  creamLight: "#fbf9f4",
  creamMid: "#f6efdc",
  creamDark: "#e5d5a8",
  forestGreen: "#0b4335",
  forestDark: "#07382d",
  amber: "#b8860b",
  red: "#f05a47",
  border: "rgba(30, 77, 58, 0.10)",
};

/* ------------------------------------------------------------------ */
/* Fonts                                                              */
/* ------------------------------------------------------------------ */

const fonts = {
  headline: "'Hanken Grotesk', sans-serif",
  body: "'Inter', sans-serif",
  label: "'JetBrains Mono', monospace",
};

/* ------------------------------------------------------------------ */
/* Icon                                                               */
/* ------------------------------------------------------------------ */

const Icon: React.FC<{
  name: string;
  size?: number;
  filled?: boolean;
}> = ({ name, size = 18, filled = false }) => (
  <span
    className="material-symbols-outlined"
    aria-hidden="true"
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
/* Props                                                              */
/* ------------------------------------------------------------------ */

type AdminNavbarProps = {
  pageTitleKey: string;
  actions?: React.ReactNode;
  onMenuClick?: () => void;
};

/* ------------------------------------------------------------------ */
/* Navbar                                                              */
/* ------------------------------------------------------------------ */

const AdminNavbar: React.FC<AdminNavbarProps> = ({
  pageTitleKey,
  actions,
  onMenuClick,
}) => {
  const { t, lang, setLang, dbLanguages, isLoading } = useLang();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const isRTL = lang === "AR";

  const [isLangOpen, setIsLangOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);
  const langDropdownRef = useRef<HTMLDivElement>(null);

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const currentUser = {
    username:
      (user as any)?.name ||
      user?.username ||
      t("admin.common.user"),
    role: t("admin.roles.administrator"),
    profile_picture:
      (user as any)?.profile_picture ||
      (user as any)?.avatar ||
      null,
    initial: (
      (user as any)?.name ||
      user?.username ||
      "U"
    )
      .charAt(0)
      .toUpperCase(),
  };

  /* ---------------------------------------------------------------- */
  /* Notifications                                                     */
  /* ---------------------------------------------------------------- */

  useEffect(() => {
    let isMounted = true;

    const fetchUnreadCount = async () => {
      try {
        const res = await notificationApi.getNotifications({
          scope: "admin",
          _t: Date.now(),
        });

        if (isMounted) {
          setUnreadNotificationCount(res.data.unread_count);
        }
      } catch (err) {
        console.error("Failed to fetch unread notification count", err);
      }
    };

    fetchUnreadCount();

    const interval = setInterval(fetchUnreadCount, 30000);

    const handleNotificationUpdate = () => {
      fetchUnreadCount();
    };

    window.addEventListener(
      "notifications-updated",
      handleNotificationUpdate
    );

    return () => {
      isMounted = false;
      clearInterval(interval);

      window.removeEventListener(
        "notifications-updated",
        handleNotificationUpdate
      );
    };
  }, []);

  /* ---------------------------------------------------------------- */
  /* Close dropdowns when clicking outside                             */
  /* ---------------------------------------------------------------- */

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      if (
        langRef.current &&
        !langRef.current.contains(target) &&
        !langDropdownRef.current?.contains(target)
      ) {
        setIsLangOpen(false);
      }

      if (
        profileRef.current &&
        !profileRef.current.contains(target)
      ) {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
    };
  }, []);

  /* ---------------------------------------------------------------- */
  /* Logout                                                            */
  /* ---------------------------------------------------------------- */

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
    setIsProfileOpen(false);
  };

  const confirmLogout = () => {
    logout();
    navigate("/login");
    setShowLogoutConfirm(false);
  };

  const cancelLogout = () => {
    setShowLogoutConfirm(false);
  };

  /* ---------------------------------------------------------------- */
  /* Language dropdown position                                        */
  /* ---------------------------------------------------------------- */

  const [languageDropdownPosition, setLanguageDropdownPosition] =
    useState<{
      top: number;
      left?: number;
      right?: number;
    }>({ top: 0 });

  useEffect(() => {
    if (!isLangOpen || !langRef.current) return;

    const updatePosition = () => {
      if (!langRef.current) return;

      const rect = langRef.current.getBoundingClientRect();

      setLanguageDropdownPosition({
        top: rect.bottom + 8,
        left: isRTL ? rect.left : undefined,
        right: isRTL
          ? undefined
          : window.innerWidth - rect.right,
      });
    };

    updatePosition();

    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [isLangOpen, isRTL]);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');

        .admin-navbar-header {
          width: 100%;
          min-height: 72px;
          flex-shrink: 0;
          box-sizing: border-box;
          padding: 0 24px 0 28px;
          gap: 16px;
        }

        .admin-navbar-menu-button {
          display: none;
          flex-shrink: 0;
        }

        .admin-navbar-left {
          display: flex;
          align-items: center;
          gap: 12px;
          flex: 1;
          min-width: 0;
          overflow: hidden;
        }

        .admin-navbar-title {
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          font-family: ${fonts.headline};
          font-size: 18px;
          line-height: 24px;
          font-weight: 600;
          color: ${colors.forestGreen};
          margin: 0;
        }

        .admin-navbar-right {
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 0;
          flex-shrink: 0;
        }

        .admin-navbar-menu-button:focus-visible {
          outline: 2px solid ${colors.forestGreen};
          outline-offset: 2px;
        }

        @media (max-width: 1024px) {
          .admin-navbar-menu-button {
            display: inline-flex !important;
            align-items: center;
            justify-content: center;
          }
        }

        @media (max-width: 600px) {
          .admin-navbar-header {
            min-height: 60px;
            padding: 8px 12px;
            gap: 8px;
          }

          .admin-navbar-left {
            gap: 8px;
          }

          .admin-navbar-title {
            font-size: 15px;
            line-height: 20px;
          }

          .admin-navbar-right {
            gap: 2px;
          }

          .admin-navbar-menu-button {
            width: 36px !important;
            height: 36px !important;
          }

          .admin-navbar-icon-wrapper {
            width: 36px !important;
            height: 36px !important;
          }

          .admin-navbar-profile-button {
            gap: 2px !important;
            padding: 2px !important;
          }

          .admin-navbar-avatar {
            width: 32px !important;
            height: 32px !important;
          }
        }

        @media (max-width: 380px) {
          .admin-navbar-header {
            padding-left: 8px;
            padding-right: 8px;
          }

          .admin-navbar-right {
            gap: 0;
          }

          .admin-navbar-title {
            font-size: 14px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .admin-navbar-header *,
          .admin-navbar-header *::before,
          .admin-navbar-header *::after {
            transition-duration: 0.01ms !important;
          }
        }

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
      `}</style>

      <header
        className="admin-navbar-header"
        dir={isRTL ? "rtl" : "ltr"}
        style={{
          backgroundColor: colors.creamLight,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: `1px solid ${colors.border}`,
          boxShadow: "0 5px 18px rgba(30,77,58,0.055)",
          position: "relative",
          zIndex: 40,
          fontFamily: fonts.body,
        }}
      >
        {/* LEFT SIDE */}
        <div className="admin-navbar-left">
          <button
            type="button"
            onClick={onMenuClick}
            aria-label="Open navigation menu"
            aria-controls="admin-sidebar"
            className="admin-navbar-menu-button"
            style={{
              width: 40,
              height: 40,
              border: `1px solid ${colors.border}`,
              background: "transparent",
              color: colors.forestGreen,
              borderRadius: 10,
              cursor: "pointer",
              padding: 0,
            }}
          >
            <Icon name="menu" size={24} />
          </button>

          <h1 className="admin-navbar-title">
            {t(pageTitleKey)}
          </h1>
        </div>

        {/* RIGHT SIDE */}
        <div className="admin-navbar-right">
          {actions}

          {/* NOTIFICATIONS */}
          <div
            className="admin-navbar-icon-wrapper"
            style={{
              position: "relative",
              width: 42,
              height: 42,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <AdminNotificationsPanel />

            {unreadNotificationCount > 0 && (
              <span
                style={{
                  position: "absolute",
                  top: 3,
                  right: 3,
                  minWidth: 17,
                  height: 17,
                  padding: "0 4px",
                  boxSizing: "border-box",
                  borderRadius: 10,
                  backgroundColor: colors.red,
                  color: "#ffffff",
                  fontFamily: fonts.body,
                  fontSize: 9,
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  pointerEvents: "none",
                  boxShadow: `0 0 0 2px ${colors.creamLight}`,
                }}
              >
                {unreadNotificationCount > 99
                  ? "99+"
                  : unreadNotificationCount}
              </span>
            )}
          </div>

          {/* LANGUAGE */}
          <div
            ref={langRef}
            style={{ position: "relative", flexShrink: 0 }}
          >
            <button
              type="button"
              onClick={() => {
                setIsLangOpen((prev) => !prev);
                setIsProfileOpen(false);
              }}
              aria-label={t("admin.navbar.changeLanguage")}
              aria-expanded={isLangOpen}
              className="admin-navbar-icon-wrapper"
              style={{
                width: 42,
                height: 42,
                border: "none",
                background: "transparent",
                borderRadius: "50%",
                cursor: "pointer",
                color: colors.forestGreen,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "background 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor =
                  "rgba(11,67,53,0.07)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
              }}
              title={t("admin.navbar.changeLanguage")}
            >
              <Icon name="language" size={21} />
            </button>

            {isLangOpen &&
              createPortal(
                <div
                  ref={langDropdownRef}
                  style={{
                    position: "fixed",
                    top: languageDropdownPosition.top,
                    ...(isRTL
                      ? { left: languageDropdownPosition.left }
                      : { right: languageDropdownPosition.right }),
                    width: 150,
                    maxWidth: "calc(100vw - 24px)",
                    backgroundColor: colors.creamLight,
                    border: `1px solid ${colors.border}`,
                    borderRadius: 10,
                    boxShadow: "0 10px 30px rgba(11,67,53,0.14)",
                    zIndex: 99999,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      padding: "10px 14px",
                      borderBottom: `1px solid ${colors.border}`,
                      fontFamily: fonts.label,
                      fontSize: 9,
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      color: colors.forestGreen,
                      opacity: 0.6,
                    }}
                  >
                    {t("admin.navbar.language")}
                  </div>

                  {isLoading ? (
                    <div
                      style={{
                        padding: "12px 14px",
                        fontSize: 12,
                        color: colors.forestGreen,
                      }}
                    >
                      {t("admin.navbar.loading")}
                    </div>
                  ) : dbLanguages.length === 0 ? (
                    <div
                      style={{
                        padding: "12px 14px",
                        fontSize: 12,
                        color: colors.forestGreen,
                      }}
                    >
                      {t("admin.navbar.noLanguages")}
                    </div>
                  ) : (
                    dbLanguages.map((dbLang) => {
                      const isActive =
                        lang.toLowerCase() ===
                        dbLang.code.toLowerCase();

                      return (
                        <button
                          type="button"
                          key={dbLang.language_id}
                          onClick={() => {
                            setLang(dbLang.code);
                            setIsLangOpen(false);
                          }}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            width: "100%",
                            padding: "10px 14px",
                            border: "none",
                            backgroundColor: isActive
                              ? "rgba(11,67,53,0.10)"
                              : "transparent",
                            color: colors.forestGreen,
                            fontFamily: fonts.body,
                            fontSize: 13,
                            fontWeight: isActive ? 600 : 400,
                            cursor: "pointer",
                            transition: "background 0.15s",
                            direction: isRTL ? "rtl" : "ltr",
                          }}
                          onMouseEnter={(e) => {
                            if (!isActive) {
                              e.currentTarget.style.backgroundColor =
                                "rgba(11,67,53,0.06)";
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!isActive) {
                              e.currentTarget.style.backgroundColor =
                                "transparent";
                            }
                          }}
                        >
                          <span>{dbLang.name}</span>
                          {isActive && <Icon name="check" size={16} />}
                        </button>
                      );
                    })
                  )}
                </div>,
                document.body
              )}
          </div>

          {/* PROFILE */}
          <div
            ref={profileRef}
            style={{ position: "relative", flexShrink: 0 }}
          >
            <button
              type="button"
              onClick={() => {
                setIsProfileOpen((prev) => !prev);
                setIsLangOpen(false);
              }}
              aria-label={currentUser.username}
              aria-expanded={isProfileOpen}
              className="admin-navbar-profile-button"
              style={{
                border: "none",
                background: "transparent",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "3px 4px",
                borderRadius: 22,
                transition: "background 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor =
                  "rgba(11,67,53,0.06)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
              }}
            >
              <div
                className="admin-navbar-avatar"
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: "50%",
                  backgroundColor: "#e5ece8",
                  border: `1px solid ${colors.border}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                  color: colors.forestGreen,
                  flexShrink: 0,
                }}
              >
                {currentUser.profile_picture ? (
                  <img
                    src={currentUser.profile_picture}
                    alt="Avatar"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                ) : (
                  <Icon name="person" size={22} filled />
                )}
              </div>

              <Icon
                name={isProfileOpen ? "expand_less" : "expand_more"}
                size={18}
              />
            </button>

            {isProfileOpen && (
              <div
                style={{
                  position: "absolute",
                  top: 50,
                  [isRTL ? "left" : "right"]: 0,
                  width: 230,
                  maxWidth: "calc(100vw - 24px)",
                  backgroundColor: colors.creamLight,
                  border: `1px solid ${colors.border}`,
                  borderRadius: 12,
                  boxShadow: "0 12px 35px rgba(11,67,53,0.16)",
                  overflow: "hidden",
                  zIndex: 9999,
                }}
              >
                {/* User information */}
                <div
                  style={{
                    padding: "14px 15px",
                    borderBottom: `1px solid ${colors.border}`,
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  <div
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: "50%",
                      backgroundColor: "#e5ece8",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: colors.forestGreen,
                      overflow: "hidden",
                      flexShrink: 0,
                    }}
                  >
                    {currentUser.profile_picture ? (
                      <img
                        src={currentUser.profile_picture}
                        alt="Avatar"
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                    ) : (
                      <Icon name="person" size={20} filled />
                    )}
                  </div>

                  <div
                    style={{
                      minWidth: 0,
                      display: "flex",
                      flexDirection: "column",
                      gap: 2,
                    }}
                  >
                    <span
                      style={{
                        fontFamily: fonts.body,
                        fontSize: 13,
                        fontWeight: 600,
                        color: colors.forestGreen,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {currentUser.username}
                    </span>

                    <span
                      style={{
                        fontFamily: fonts.label,
                        fontSize: 9,
                        color: colors.forestGreen,
                        opacity: 0.6,
                      }}
                    >
                      {currentUser.role}
                    </span>
                  </div>
                </div>

                {/* My Profile */}
                <Link
                  to="/admin/profile"
                  onClick={() => setIsProfileOpen(false)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "11px 15px",
                    textDecoration: "none",
                    color: colors.forestGreen,
                    fontFamily: fonts.body,
                    fontSize: 13,
                    transition: "background 0.15s",
                    direction: isRTL ? "rtl" : "ltr",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = colors.creamMid;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  <Icon name="person" size={17} />
                  <span>{t("admin.navbar.myProfile")}</span>
                </Link>

                {/* View public site */}
                <Link
                  to="/"
                  onClick={() => setIsProfileOpen(false)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "11px 15px",
                    textDecoration: "none",
                    color: colors.forestGreen,
                    fontFamily: fonts.body,
                    fontSize: 13,
                    transition: "background 0.15s",
                    direction: isRTL ? "rtl" : "ltr",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = colors.creamMid;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  <Icon name="public" size={17} />
                  <span>{t("admin.navbar.viewPublicSite")}</span>
                </Link>

                <div
                  style={{
                    height: 1,
                    backgroundColor: colors.border,
                    margin: "4px 0",
                  }}
                />

                {/* Logout */}
                <button
                  type="button"
                  onClick={handleLogoutClick}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "11px 15px",
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    color: colors.red,
                    fontFamily: fonts.body,
                    fontSize: 13,
                    transition: "background 0.15s",
                    direction: isRTL ? "rtl" : "ltr",
                    textAlign: isRTL ? "right" : "left",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor =
                      "rgba(240,90,71,0.07)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  <Icon name="logout" size={17} />
                  <span>{t("admin.navbar.logout")}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Logout confirmation modal */}
      {showLogoutConfirm &&
        createPortal(
          <div
            style={{
              position: "fixed",
              inset: 0,
              backgroundColor: "rgba(11,67,53,0.4)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 99999,
              padding: 20,
              boxSizing: "border-box",
            }}
            onClick={cancelLogout}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="admin-logout-title"
              style={{
                backgroundColor: colors.creamLight,
                borderRadius: 12,
                boxShadow: "0 12px 35px rgba(11,67,53,0.25)",
                width: "100%",
                maxWidth: 380,
                boxSizing: "border-box",
                padding: 24,
                border: `1px solid ${colors.border}`,
              }}
              onClick={(e) => e.stopPropagation()}
              dir={isRTL ? "rtl" : "ltr"}
            >
              <h3
                id="admin-logout-title"
                style={{
                  fontFamily: fonts.headline,
                  fontSize: 18,
                  fontWeight: 600,
                  color: colors.forestGreen,
                  margin: "0 0 12px",
                }}
              >
                {t("admin.navbar.logoutConfirmTitle")}
              </h3>

              <p
                style={{
                  fontFamily: fonts.body,
                  fontSize: 14,
                  color: colors.forestGreen,
                  margin: "0 0 24px",
                  lineHeight: 1.5,
                }}
              >
                {t("admin.navbar.logoutConfirmMessage")}
              </p>

              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 12,
                  justifyContent: isRTL ? "flex-start" : "flex-end",
                }}
              >
                <button
                  type="button"
                  onClick={cancelLogout}
                  style={{
                    padding: "10px 20px",
                    borderRadius: 8,
                    border: `1px solid ${colors.border}`,
                    backgroundColor: "transparent",
                    color: colors.forestGreen,
                    fontFamily: fonts.body,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  {t("admin.navbar.cancel")}
                </button>

                <button
                  type="button"
                  onClick={confirmLogout}
                  style={{
                    padding: "10px 20px",
                    borderRadius: 8,
                    border: "none",
                    backgroundColor: colors.red,
                    color: "#ffffff",
                    fontFamily: fonts.body,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#d94d3b";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = colors.red;
                  }}
                >
                  {t("admin.navbar.confirmLogout")}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
};

export default AdminNavbar;
