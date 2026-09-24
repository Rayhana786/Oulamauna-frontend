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
};

/* ------------------------------------------------------------------ */
/* Navbar                                                              */
/* ------------------------------------------------------------------ */

const AdminNavbar: React.FC<AdminNavbarProps> = ({ pageTitleKey, actions }) => {
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
  
  // ✅ NEW: State for logout confirmation modal
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const currentUser = {
    username: (user as any)?.name || user?.username || t("admin.common.user"),
    role: t("admin.roles.administrator"),
    profile_picture: (user as any)?.profile_picture || (user as any)?.avatar || null,
    initial: ((user as any)?.name || user?.username || "U").charAt(0).toUpperCase(),
  };

  useEffect(() => {
    let isMounted = true;

    const fetchUnreadCount = async () => {
      try {
        const res = await notificationApi.getNotifications({ 
          scope: "admin",
          _t: Date.now() 
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
    window.addEventListener("notifications-updated", handleNotificationUpdate);

    return () => {
      isMounted = false;
      clearInterval(interval);
      window.removeEventListener("notifications-updated", handleNotificationUpdate);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      if (
        langRef.current &&
        !langRef.current.contains(target) &&
        langDropdownRef.current &&
        !langDropdownRef.current.contains(target)
      ) {
        setIsLangOpen(false);
      }

      if (profileRef.current && !profileRef.current.contains(target)) {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // ✅ NEW: Show modal instead of logging out immediately
  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
    setIsProfileOpen(false); // Close profile dropdown if open
  };

  // ✅ NEW: Actually perform the logout
  const confirmLogout = () => {
    logout();
    navigate("/login");
    setShowLogoutConfirm(false);
  };

  // ✅ NEW: Cancel the logout
  const cancelLogout = () => {
    setShowLogoutConfirm(false);
  };

  const [languageDropdownPosition, setLanguageDropdownPosition] = useState<{
    top: number;
    left?: number;
    right?: number;
  }>({ top: 0 });

  useEffect(() => {
    if (isLangOpen && langRef.current) {
      const rect = langRef.current.getBoundingClientRect();
      setLanguageDropdownPosition({
        top: rect.bottom + 8,
        left: isRTL ? rect.left : undefined,
        right: isRTL ? undefined : window.innerWidth - rect.right,
      });
    }
  }, [isLangOpen, isRTL]);

  return (
    <>
      <header
        dir={isRTL ? "rtl" : "ltr"}
        style={{
          width: "100%",
          height: 72,
          flexShrink: 0,
          backgroundColor: "#fbf9f4",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 24px 0 28px",
          borderBottom: `1px solid ${colors.border}`,
          boxShadow: "0 5px 18px rgba(30,77,58,0.055)",
          boxSizing: "border-box",
          position: "relative",
          zIndex: 40,
          fontFamily: fonts.body,
        }}
      >
        {/* LEFT SIDE */}
        <div style={{ display: "flex", alignItems: "center", gap: 18, minWidth: 0 }}>
          <h1
            style={{
              fontFamily: fonts.headline,
              fontSize: 18,
              lineHeight: "24px",
              fontWeight: 600,
              color: colors.forestGreen,
              margin: 0,
              whiteSpace: "nowrap",
            }}
          >
            {t(pageTitleKey)}
          </h1>
        </div>

        {/* RIGHT SIDE */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
          {actions}

          {/* NOTIFICATIONS */}
          <div style={{ position: "relative", width: 42, height: 42, display: "flex", alignItems: "center", justifyContent: "center" }}>
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
                  boxShadow: "0 0 0 2px #fbf9f4",
                }}
              >
                {unreadNotificationCount > 99 ? "99+" : unreadNotificationCount}
              </span>
            )}
          </div>

          {/* LANGUAGE */}
          <div ref={langRef} style={{ position: "relative" }}>
            <button
              onClick={() => {
                setIsLangOpen(!isLangOpen);
                setIsProfileOpen(false);
              }}
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
                e.currentTarget.style.backgroundColor = "rgba(11, 67, 53, 0.07)";
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
                    ...(isRTL ? { left: languageDropdownPosition.left } : { right: languageDropdownPosition.right }),
                    width: 150,
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
                    <div style={{ padding: "12px 14px", fontSize: 12, color: colors.forestGreen }}>
                      {t("admin.navbar.loading")}
                    </div>
                  ) : dbLanguages.length === 0 ? (
                    <div style={{ padding: "12px 14px", fontSize: 12, color: colors.forestGreen }}>
                      {t("admin.navbar.noLanguages")}
                    </div>
                  ) : (
                    dbLanguages.map((dbLang) => {
                      const isActive = lang.toLowerCase() === dbLang.code.toLowerCase();
                      return (
                        <button
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
                            backgroundColor: isActive ? "rgba(11,67,53,0.10)" : "transparent",
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
                              e.currentTarget.style.backgroundColor = "rgba(11,67,53,0.06)";
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!isActive) {
                              e.currentTarget.style.backgroundColor = "transparent";
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
          <div ref={profileRef} style={{ position: "relative", marginLeft: 2 }}>
            <button
              onClick={() => {
                setIsProfileOpen(!isProfileOpen);
                setIsLangOpen(false);
              }}
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
                e.currentTarget.style.backgroundColor = "rgba(11,67,53,0.06)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
              }}
            >
              <div
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
                  <img src={currentUser.profile_picture} alt="Avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <Icon name="person" size={22} filled />
                )}
              </div>
              <Icon name={isProfileOpen ? "expand_less" : "expand_more"} size={18} />
            </button>

            {isProfileOpen && (
              <div
                style={{
                  position: "absolute",
                  top: 50,
                  right: isRTL ? "auto" : 0,
                  left: isRTL ? 0 : "auto",
                  width: 230,
                  backgroundColor: colors.creamLight,
                  border: `1px solid ${colors.border}`,
                  borderRadius: 12,
                  boxShadow: "0 12px 35px rgba(11,67,53,0.16)",
                  overflow: "hidden",
                  zIndex: 9999,
                }}
              >
                {/* User information */}
                <div style={{ padding: "14px 15px", borderBottom: `1px solid ${colors.border}`, display: "flex", alignItems: "center", gap: 10 }}>
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
                      <img src={currentUser.profile_picture} alt="Avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <Icon name="person" size={20} filled />
                    )}
                  </div>
                  <div style={{ minWidth: 0, display: "flex", flexDirection: "column", gap: 2 }}>
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
                    <span style={{ fontFamily: fonts.label, fontSize: 9, color: colors.forestGreen, opacity: 0.6 }}>
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

                {/* Separator */}
                <div style={{ height: 1, backgroundColor: colors.border, margin: "4px 0" }} />

                {/* Logout */}
                <button
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
                    e.currentTarget.style.backgroundColor = "rgba(240,90,71,0.07)";
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

      {/* ✅ NEW: Logout Confirmation Modal */}
      {showLogoutConfirm &&
        createPortal(
          <div
            style={{
              position: "fixed",
              inset: 0,
              backgroundColor: "rgba(11, 67, 53, 0.4)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 99999,
              padding: 20,
            }}
            onClick={cancelLogout}
          >
            <div
              style={{
                backgroundColor: colors.creamLight,
                borderRadius: 12,
                boxShadow: "0 12px 35px rgba(11,67,53,0.25)",
                width: "100%",
                maxWidth: 380,
                padding: 24,
                border: `1px solid ${colors.border}`,
              }}
              onClick={(e) => e.stopPropagation()}
              dir={isRTL ? "rtl" : "ltr"}
            >
              <h3
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
                  gap: 12,
                  justifyContent: isRTL ? "flex-start" : "flex-end",
                }}
              >
                <button
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
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "rgba(11, 67, 53, 0.06)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  {t("admin.navbar.cancel")}
                </button>
                <button
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
                    transition: "background 0.15s",
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