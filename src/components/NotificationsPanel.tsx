// src/components/NotificationsPanel.tsx
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { notificationApi, Notification } from "../api/notificationApi";
import { useAuth } from "../context/AuthContext";
import { useLang } from "../context/LanguageContext";

const formatTimeAgo = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

const getTimeGroup = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  return diffDays === 0 ? "new" : "earlier";
};

const getNotificationIcon = (type?: string) => {
  const t = type?.toUpperCase() || "";
  if (t.includes("APPROVED")) return { icon: "check_circle", color: "#10b981" };
  if (t.includes("REJECTED")) return { icon: "cancel", color: "#ef4444" };
  if (t.includes("SCHOLAR")) return { icon: "school", color: "#1e4d3a" };
  if (t.includes("WORK") || t.includes("BOOK")) return { icon: "menu_book", color: "#C9A84C" };
  if (t.includes("COMMENT")) return { icon: "chat_bubble", color: "#8b5cf6" };
  if (t.includes("REPORT")) return { icon: "flag", color: "#f97316" };
  if (t.includes("SUBMISSION") || t.includes("DISCIPLINE")) return { icon: "post_add", color: "#8b5cf6" };
  if (t.includes("MEDIA") || t.includes("IMAGE")) return { icon: "image", color: "#06b6d4" };
  return { icon: "notifications", color: "#6b7280" };
};

interface NotificationsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const NotificationsPanel: React.FC<NotificationsPanelProps> = ({ isOpen, onClose }) => {
  const { lang, t } = useLang(); // Now using the dynamic t() function
  const navigate = useNavigate();
  const panelRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [isLoading, setIsLoading] = useState(true);
  const [showMenu, setShowMenu] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const LIMIT = 8;

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) onClose();
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setShowMenu(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  const fetchNotifications = async (currentPage: number, currentFilter: "all" | "unread", isAppending = false) => {
    setIsLoading(true);
    try {
      const response = await notificationApi.getNotifications({
        unread_only: currentFilter === "unread",
        page: currentPage,
        limit: LIMIT,
      });

      if (response.data.success) {
        const newNotifications = response.data.data || [];
        setNotifications((prev) => (isAppending ? [...prev, ...newNotifications] : newNotifications));
        setUnreadCount(response.data.unread_count || 0);
        setHasMore(newNotifications.length === LIMIT);
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setPage(1);
      fetchNotifications(1, filter, false);
    }
  }, [isOpen, filter]);

  const handleMarkAsRead = async (id: number) => {
    try {
      await notificationApi.markAsRead(id);
      setNotifications((prev) => prev.map((n) => (n.notification_id === id ? { ...n, is_read: true } : n)));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Failed to mark as read:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationApi.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
      setShowMenu(false);
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.is_read) handleMarkAsRead(notification.notification_id);
    onClose();

    if (notification.type?.includes("REJECTED")) {
      navigate("/dashboard/submissions?status=rejected");
      return;
    }

    // Fix: Use optional chaining for related_entity
    const entity = (notification as any).related_entity;
    if (!entity) return;

    let baseUrl = "";
    let focusValue = "";

    if (entity.startsWith("scholar_")) {
      const parts = entity.split("_");
      baseUrl = `/scholars/${parts[1]}`;
      if (parts[2] === "media" || parts[2] === "image") focusValue = `media-${parts[3]}`;
      else if (parts[2] === "work" || parts[2] === "book") focusValue = `work-${parts[3]}`;
      else if (parts[2] === "reference") focusValue = `reference-${parts[3]}`;
    } else if (entity.startsWith("submission_")) {
      baseUrl = `/admin/submissions/${entity.split("_")[1]}`;
    } else if (entity.startsWith("report_")) {
      baseUrl = `/admin/reports/${entity.split("_")[1]}`;
    } else {
      const parts = entity.split("_");
      baseUrl = `/${parts[0]}s/${parts[1]}`;
    }

    const currentSearchParams = new URLSearchParams(window.location.search);
    const currentLang = currentSearchParams.get("lang") || "en";
    const finalUrl = new URL(baseUrl, window.location.origin);
    finalUrl.searchParams.set("lang", currentLang);
    if (focusValue) finalUrl.searchParams.set("focus", focusValue);

    navigate(finalUrl.pathname + finalUrl.search);
  };

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchNotifications(nextPage, filter, true);
  };

  const handleViewAll = () => {
    onClose();
    navigate("/notifications");
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div
        ref={panelRef}
        className="fixed top-16 right-4 md:right-8 z-50 w-[92vw] max-w-[380px] bg-white rounded-2xl shadow-2xl border border-[#C9A84C]/20 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200"
        style={{ maxHeight: "calc(100vh - 90px)" }}
      >
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap');
          .material-symbols-outlined { font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24; font-family: 'Material Symbols Outlined'; }
          .no-scrollbar::-webkit-scrollbar { display: none; }
          .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        `}</style>

        {/* Header */}
        <div className="bg-[#1e4d3a] px-4 py-3.5 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">{t('notifications.title')}</h2>
          <div className="relative" ref={menuRef}>
            <button onClick={() => setShowMenu(!showMenu)} className="p-1.5 hover:bg-white/10 rounded-full transition-colors">
              <span className="material-symbols-outlined text-white" style={{ fontSize: '20px' }}>more_horiz</span>
            </button>

            {showMenu && (
              <div className="absolute right-0 mt-2 w-60 bg-white rounded-xl shadow-lg border border-[#C9A84C]/20 py-1.5 z-50">
                <button onClick={handleMarkAllAsRead} className="w-full px-4 py-2.5 text-left hover:bg-[#F5F3EC] flex items-center gap-3 transition-colors">
                  <span className="material-symbols-outlined text-[#1e4d3a]" style={{ fontSize: '18px' }}>done_all</span>
                  <span className="text-sm font-medium text-[#1e4d3a]">{t('notifications.markAllRead')}</span>
                </button>
                <div className="border-t border-[#C9A84C]/10 my-1"></div>
                <button onClick={handleViewAll} className="w-full px-4 py-2.5 text-left hover:bg-[#F5F3EC] flex items-center gap-3 transition-colors">
                  <span className="material-symbols-outlined text-[#1e4d3a]" style={{ fontSize: '18px' }}>open_in_new</span>
                  <span className="text-sm font-medium text-[#1e4d3a]">{t('notifications.viewAll')}</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Filter tabs */}
        <div className="px-3 py-2.5 flex gap-1.5 border-b border-[#C9A84C]/10 bg-white">
          <button onClick={() => setFilter("all")} className={`px-3.5 py-1.5 rounded-full text-[13px] font-semibold transition-all ${filter === "all" ? "bg-[#1e4d3a] text-white" : "text-gray-600 hover:bg-[#F5F3EC]"}`}>
            {t('notifications.all')}
          </button>
          <button onClick={() => setFilter("unread")} className={`px-3.5 py-1.5 rounded-full text-[13px] font-semibold transition-all flex items-center gap-1.5 ${filter === "unread" ? "bg-[#1e4d3a] text-white" : "text-gray-600 hover:bg-[#F5F3EC]"}`}>
            {t('notifications.unread')}
            {unreadCount > 0 && <span className="bg-[#C9A84C] text-[#1e4d3a] text-[10px] font-bold px-1.5 py-0.5 rounded-full">{unreadCount}</span>}
          </button>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto no-scrollbar" style={{ maxHeight: "calc(100vh - 240px)" }}>
          {isLoading && page === 1 ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="px-4 py-3 flex gap-3 animate-pulse">
                <div className="w-10 h-10 bg-gray-200 rounded-full flex-shrink-0"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))
          ) : notifications.length === 0 ? (
            <div className="text-center py-12 px-4">
              <span className="material-symbols-outlined text-5xl text-gray-300 mb-3">notifications_off</span>
              <h3 className="text-base font-semibold text-gray-700 mb-1">{t('notifications.noNotifications')}</h3>
              <p className="text-gray-500 text-sm">{filter === "unread" ? t('notifications.caughtUp') : t('notifications.willNotify')}</p>
            </div>
          ) : (
            <>
              {(() => {
                let lastGroup: string | null = null;
                return notifications.map((notif, idx) => {
                  const group = getTimeGroup(notif.created_at);
                  const showHeader = group !== lastGroup;
                  lastGroup = group;
                  const iconStyle = getNotificationIcon(notif.type);
                  const isLastRow = idx === notifications.length - 1;

                  return (
                    <React.Fragment key={notif.notification_id}>
                      {showHeader && (
                        <div className={`px-4 pt-3 pb-1 ${idx > 0 ? "border-t border-[#C9A84C]/10 mt-1" : ""}`}>
                          <h4 className="text-[10.5px] font-bold text-[#1e4d3a]/55 uppercase tracking-wider">
                            {group === "new" ? t('notifications.new') : t('notifications.earlier')}
                          </h4>
                        </div>
                      )}
                      <div
                        onClick={() => handleNotificationClick(notif)}
                        className={`px-4 py-3 flex gap-3 cursor-pointer transition-colors border-b ${isLastRow ? "border-transparent" : "border-[#C9A84C]/10"} ${
                          !notif.is_read ? "bg-[#C9A84C]/8" : "bg-white"
                        } hover:bg-[#F5F3EC]`}
                      >
                        <div className="flex-shrink-0 relative">
                          <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: `${iconStyle.color}18` }}>
                            <span className="material-symbols-outlined" style={{ color: iconStyle.color, fontSize: '22px' }}>{iconStyle.icon}</span>
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className={`text-sm leading-snug ${!notif.is_read ? "text-[#1e4d3a] font-semibold" : "text-gray-600"}`}>{notif.message}</p>
                            {!notif.is_read && <div className="w-2.5 h-2.5 bg-[#C9A84C] rounded-full flex-shrink-0 mt-1.5"></div>}
                          </div>
                          <span className="text-xs text-[#1e4d3a]/70 font-medium mt-1 block">{formatTimeAgo(notif.created_at)}</span>
                        </div>
                      </div>
                    </React.Fragment>
                  );
                });
              })()}

              {!isLoading && hasMore && (
                <div className="px-4 py-3 text-center">
                  <button onClick={handleLoadMore} className="w-full py-2 text-sm text-[#1e4d3a] hover:bg-[#F5F3EC] font-semibold rounded-lg transition-colors">
                    {t('notifications.loadMore')}
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer — always takes you to the full page */}
        <button
          onClick={handleViewAll}
          className="w-full py-3 text-sm font-semibold text-[#1e4d3a] border-t border-[#C9A84C]/15 hover:bg-[#F5F3EC] transition-colors"
        >
          {t('notifications.viewAll')}
        </button>
      </div>
    </>
  );
};

export default NotificationsPanel;