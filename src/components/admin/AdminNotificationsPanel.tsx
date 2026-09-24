import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";
import { notificationApi, Notification } from "../../api/notificationApi";
import { useLang } from "../../context/LanguageContext";

const colors = {
  creamLight: "#fcfaf5",
  forestGreen: "#0b4335",
  red: "#b3261e",
};

const fonts = {
  headline: "'Hanken Grotesk', sans-serif",
  body: "'Inter', sans-serif",
};

const Icon: React.FC<{ name: string; size?: number }> = ({ name, size = 16 }) => (
  <span
    className="material-symbols-outlined"
    style={{ fontSize: size, lineHeight: 1, fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}
  >
    {name}
  </span>
);

const getNotificationIcon = (type?: string) => {
  const t = type?.toUpperCase() || "";
  if (t.includes("REPORT")) return { icon: "flag", color: "#f97316" };
  if (t.includes("EDIT_PROPOSAL")) return { icon: "edit_document", color: "#8b5cf6" };
  if (t.includes("SCHOLAR")) return { icon: "school", color: colors.forestGreen };
  if (t.includes("DISCIPLINE")) return { icon: "category", color: "#06b6d4" };
  if (t.includes("REGION")) return { icon: "map", color: "#06b6d4" };
  if (t.includes("FORUM_POST")) return { icon: "forum", color: "#8b5cf6" };
  return { icon: "notifications", color: "#6b7280" };
};

// Updated to accept the translation function `t`
const formatTimeAgo = (dateString: string, isRTL: boolean, t: (key: string) => string) => {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (seconds < 60) return t("admin.notifications.time.justNow");
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}${t("admin.notifications.time.minutes")}`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}${t("admin.notifications.time.hours")}`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}${t("admin.notifications.time.days")}`;
  return date.toLocaleDateString(isRTL ? "ar-EG" : "en-US", { month: "short", day: "numeric" });
};

const AdminNotificationsPanel: React.FC = () => {
  const { lang, t } = useLang(); // Added `t` here
  const navigate = useNavigate();
  const isRTL = lang === "AR";

  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const bellRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{ top: number; left?: number; right?: number }>({ top: 0 });

  const LIMIT = 10;

  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      const response = await notificationApi.getNotifications({ page: 1, limit: LIMIT, scope: "admin" });
      if (response.data.success) {
        setNotifications(response.data.data || []);
        setUnreadCount(response.data.unread_count || 0);
      }
    } catch (error) {
      console.error("Failed to fetch admin notifications:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  useEffect(() => {
    if (isOpen && bellRef.current) {
      const rect = bellRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + 8,
        left: isRTL ? rect.left : undefined,
        right: isRTL ? undefined : window.innerWidth - rect.right,
      });
      fetchNotifications();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const clickedBell = bellRef.current?.contains(target);
      const clickedPanel = panelRef.current?.contains(target);
      if (!clickedBell && !clickedPanel) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMarkAsRead = async (id: number) => {
    try {
      await notificationApi.markAsRead(id);
      window.dispatchEvent(new Event("notifications-updated"));
      setNotifications((prev) => prev.map((n) => (n.notification_id === id ? { ...n, is_read: true } : n)));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Failed to mark as read:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationApi.markAllAsRead();
      window.dispatchEvent(new Event("notifications-updated"));
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.is_read) handleMarkAsRead(notification.notification_id);
    setIsOpen(false);

    const entity = notification.related_entity || "";
    const parts = entity.split(",");

    const getFocus = () => {
      if (entity.includes("work:")) {
        const workId = parts.find((p) => p.startsWith("work:"))?.split(":")[1];
        return workId ? `work-${workId}` : "";
      }
      if (entity.includes("media:")) {
        const mediaId = parts.find((p) => p.startsWith("media:"))?.split(":")[1];
        return mediaId ? `media-${mediaId}` : "";
      }
      return "";
    };

    if (notification.type === "NEW_SCHOLAR_SUBMISSION" && entity.startsWith("scholar_version:")) {
      const scholarId = entity.split(":")[1].split(",")[0];
      const langCode = parts.find((p) => p.startsWith("lang:"))?.split(":")[1] || "EN";
      navigate(`/admin/pending/scholars/${scholarId}?lang=${langCode}`);
      return;
    }
    if (notification.type === "EDIT_PROPOSAL" && entity.startsWith("scholar_version:")) {
      const scholarId = entity.split(":")[1].split(",")[0];
      const focus = getFocus();
      navigate(`/admin/pending/edits/${scholarId}${focus ? `?focus=${focus}` : ""}`);
      return;
    }
    if (notification.type === "REPORT_SUBMITTED") {
      const contentId = entity.split(":")[1]?.split(",")[0];
      if (contentId) {
        navigate(`/admin/reports?highlight=${contentId}`);
      } else {
        navigate("/admin/reports");
      }
      return;
    }
    if (notification.type === "NEW_DISCIPLINE_SUBMISSION" && entity.startsWith("discipline:")) {
      const disciplineId = entity.split(":")[1];
      navigate(`/admin/disciplines?highlight=${disciplineId}`);
      return;
    }
    if (notification.type === "NEW_REGION_SUBMISSION" && entity.startsWith("region:")) {
      const regionId = entity.split(":")[1];
      navigate(`/admin/regions?highlight=${regionId}`);
      return;
    }
    if (notification.type === "NEW_FORUM_POST" && (entity.startsWith("post:") || entity.startsWith("forum_post:"))) {
      const postId = entity.split(":")[1];
      navigate(`/admin/discussions?postId=${postId}`);
      return;
    }

    navigate(`/admin`);
  };

  return (
    <div style={{ position: "relative" }} ref={bellRef}>
      <button
        onClick={() => setIsOpen((v) => !v)}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          color: colors.forestGreen,
          padding: 8,
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          transition: "background 0.2s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(11, 67, 53, 0.08)")}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
        title={t("admin.notifications.title")}
      >
        <Icon name="notifications" size={22} />
        {unreadCount > 0 && (
          <span
            style={{
              position: "absolute",
              top: 6,
              [isRTL ? "left" : "right"]: 6,
              minWidth: 8,
              height: 8,
              backgroundColor: colors.red,
              borderRadius: "50%",
              border: `2px solid ${colors.creamLight}`,
            }}
          />
        )}
      </button>

      {isOpen &&
        createPortal(
          <div
            ref={panelRef}
            style={{
              position: "fixed",
              top: position.top,
              ...(isRTL ? { left: position.left } : { right: position.right }),
              backgroundColor: colors.creamLight,
              border: `1px solid ${colors.forestGreen}`,
              borderRadius: 10,
              boxShadow: "0 4px 16px rgba(11, 67, 53, 0.18)",
              zIndex: 99999,
              width: 340,
              maxHeight: 420,
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "12px 16px",
                borderBottom: `1px solid rgba(11, 67, 53, 0.12)`,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <span style={{ fontFamily: fonts.headline, fontWeight: 600, fontSize: 15, color: colors.forestGreen }}>
                {t("admin.notifications.adminTitle")}
              </span>
              <button
                onClick={handleMarkAllAsRead}
                disabled={unreadCount === 0}
                style={{
                  background: "none",
                  border: "none",
                  cursor: unreadCount === 0 ? "default" : "pointer",
                  color: colors.forestGreen,
                  fontSize: 12,
                  fontFamily: fonts.body,
                  fontWeight: 600,
                  opacity: unreadCount === 0 ? 0.4 : 1,
                }}
              >
                {t("admin.notifications.markAllRead")}
              </button>
            </div>

            <div style={{ overflowY: "auto" }}>
              {isLoading ? (
                <div style={{ padding: 20, textAlign: "center", fontSize: 13, color: colors.forestGreen, fontFamily: fonts.body }}>
                  {t("admin.notifications.loading")}
                </div>
              ) : notifications.length === 0 ? (
                <div style={{ padding: 24, textAlign: "center" }}>
                  <Icon name="notifications_off" size={32} />
                  <p style={{ fontFamily: fonts.body, fontSize: 13, color: colors.forestGreen, marginTop: 8 }}>
                    {t("admin.notifications.empty")}
                  </p>
                </div>
              ) : (
                notifications.map((notif) => {
                  const iconStyle = getNotificationIcon(notif.type);
                  return (
                    <div
                      key={notif.notification_id}
                      onClick={() => handleNotificationClick(notif)}
                      style={{
                        padding: "12px 16px",
                        display: "flex",
                        gap: 10,
                        cursor: "pointer",
                        backgroundColor: !notif.is_read ? "rgba(179, 38, 30, 0.06)" : colors.creamLight,
                        borderBottom: `1px solid rgba(11, 67, 53, 0.08)`,
                      }}
                    >
                      <div
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: "50%",
                          flexShrink: 0,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          backgroundColor: `${iconStyle.color}18`,
                        }}
                      >
                        <Icon name={iconStyle.icon} size={18} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p
                          style={{
                            margin: 0,
                            fontFamily: fonts.body,
                            fontSize: 13,
                            lineHeight: 1.4,
                            color: colors.forestGreen,
                            fontWeight: !notif.is_read ? 600 : 400,
                          }}
                        >
                          {notif.message}
                        </p>
                        <span style={{ fontSize: 11, color: "rgba(11, 67, 53, 0.6)", fontFamily: fonts.body }}>
                          {formatTimeAgo(notif.created_at, isRTL, t)}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

export default AdminNotificationsPanel;