import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { notificationApi, Notification } from "../api/notificationApi";
import { useLang } from "../context/LanguageContext";

const formatTimeAgo = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();

  const seconds = Math.floor(
    (now.getTime() - date.getTime()) / 1000
  );

  if (seconds < 60) return "Just now";

  const minutes = Math.floor(seconds / 60);

  if (minutes < 60) return `${minutes}m`;

  const hours = Math.floor(minutes / 60);

  if (hours < 24) return `${hours}h`;

  const days = Math.floor(hours / 24);

  if (days < 7) return `${days}d`;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
};

const getTimeGroup = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();

  const diffDays = Math.floor(
    (now.getTime() - date.getTime()) /
      (1000 * 60 * 60 * 24)
  );

  if (diffDays === 0) return "new";

  if (diffDays <= 7) return "week";

  return "earlier";
};

const getNotificationIcon = (type?: string) => {
  const t = type?.toUpperCase() || "";

  if (t.includes("APPROVED")) {
    return {
      icon: "check_circle",
      color: "#10b981",
    };
  }

  if (t.includes("REJECTED")) {
    return {
      icon: "cancel",
      color: "#ef4444",
    };
  }

  if (t.includes("SCHOLAR")) {
    return {
      icon: "school",
      color: "#1e4d3a",
    };
  }

  if (t.includes("WORK") || t.includes("BOOK")) {
    return {
      icon: "menu_book",
      color: "#C9A84C",
    };
  }

  if (t.includes("COMMENT")) {
    return {
      icon: "chat_bubble",
      color: "#8b5cf6",
    };
  }

  if (t.includes("REPORT")) {
    return {
      icon: "flag",
      color: "#f97316",
    };
  }

  if (
    t.includes("SUBMISSION") ||
    t.includes("DISCIPLINE")
  ) {
    return {
      icon: "post_add",
      color: "#8b5cf6",
    };
  }

  if (
    t.includes("MEDIA") ||
    t.includes("IMAGE")
  ) {
    return {
      icon: "image",
      color: "#06b6d4",
    };
  }

  return {
    icon: "notifications",
    color: "#6b7280",
  };
};

const NotificationsPage: React.FC = () => {
  const { lang } = useLang();
  const navigate = useNavigate();

  const [notifications, setNotifications] =
    useState<Notification[]>([]);

  const [unreadCount, setUnreadCount] =
    useState(0);

  const [filter, setFilter] =
    useState<"all" | "unread">("all");

  const [isLoading, setIsLoading] =
    useState(true);

  const [isLoadingMore, setIsLoadingMore] =
    useState(false);

  const [page, setPage] = useState(1);

  const [hasMore, setHasMore] =
    useState(true);

  const [selectedId, setSelectedId] =
    useState<number | null>(null);

  /* ============================================================= */
  /* NEW: EXPANDED NOTIFICATIONS                                   */
  /* Each notification can be expanded independently               */
  /* ============================================================= */

  const [expandedIds, setExpandedIds] =
    useState<Set<number>>(new Set());

  const LIMIT = 12;

  /* ============================================================= */
  /* FETCH NOTIFICATIONS                                           */
  /* ============================================================= */

  const fetchNotifications = async (
    currentPage: number,
    currentFilter: "all" | "unread",
    isAppending: boolean
  ) => {
    if (isAppending) {
      setIsLoadingMore(true);
    } else {
      setIsLoading(true);
    }

    try {
      const response =
        await notificationApi.getNotifications({
          unread_only:
            currentFilter === "unread",
          page: currentPage,
          limit: LIMIT,
        });

      if (response.data.success) {
        const newNotifications =
          response.data.data || [];

        setNotifications((prev) =>
          isAppending
            ? [
                ...prev,
                ...newNotifications,
              ]
            : newNotifications
        );

        setUnreadCount(
          response.data.unread_count || 0
        );

        setHasMore(
          newNotifications.length === LIMIT
        );
      }
    } catch (error) {
      console.error(
        "Failed to fetch notifications:",
        error
      );
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  /* ============================================================= */
  /* FILTER CHANGE                                                 */
  /* ============================================================= */

  useEffect(() => {
    setPage(1);
    setSelectedId(null);
    setExpandedIds(new Set());

    fetchNotifications(
      1,
      filter,
      false
    );

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }, [filter]);

  /* ============================================================= */
  /* TOGGLE READ MORE                                              */
  /* ============================================================= */

  const toggleExpanded = (
    id: number,
    event: React.MouseEvent
  ) => {
    // Important:
    // Prevent clicking "Read more" from
    // triggering the notification navigation.
    event.stopPropagation();

    setExpandedIds((prev) => {
      const next = new Set(prev);

      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }

      return next;
    });
  };

  /* ============================================================= */
  /* MARK AS READ                                                  */
  /* ============================================================= */

  const handleMarkAsRead = async (
    id: number
  ) => {
    try {
      await notificationApi.markAsRead(id);

      setNotifications((prev) =>
        prev.map((n) =>
          n.notification_id === id
            ? {
                ...n,
                is_read: true,
              }
            : n
        )
      );

      setUnreadCount((prev) =>
        Math.max(0, prev - 1)
      );
    } catch (error) {
      console.error(
        "Failed to mark as read:",
        error
      );
    }
  };

  /* ============================================================= */
  /* MARK ALL AS READ                                              */
  /* ============================================================= */

  const handleMarkAllAsRead = async () => {
    try {
      await notificationApi.markAllAsRead();

      setNotifications((prev) =>
        prev.map((n) => ({
          ...n,
          is_read: true,
        }))
      );

      setUnreadCount(0);
    } catch (error) {
      console.error(
        "Failed to mark all as read:",
        error
      );
    }
  };

  /* ============================================================= */
  /* NOTIFICATION CLICK                                            */
  /* ============================================================= */

  const handleNotificationClick = (
    notification: Notification
  ) => {
    setSelectedId(
      notification.notification_id
    );

    if (!notification.is_read) {
      handleMarkAsRead(
        notification.notification_id
      );
    }

    if (
      notification.type?.includes("REJECTED")
    ) {
      navigate(
        "/dashboard/submissions?status=rejected"
      );
      return;
    }

    const entity =
      notification.related_entity;

    if (!entity) return;

    let baseUrl = "";
    let focusValue = "";

    if (entity.startsWith("scholar_")) {
      const parts = entity.split("_");

      baseUrl = `/scholars/${parts[1]}`;

      if (
        parts[2] === "media" ||
        parts[2] === "image"
      ) {
        focusValue = `media-${parts[3]}`;
      } else if (
        parts[2] === "work" ||
        parts[2] === "book"
      ) {
        focusValue = `work-${parts[3]}`;
      } else if (
        parts[2] === "reference"
      ) {
        focusValue =
          `reference-${parts[3]}`;
      }
    } else if (
      entity.startsWith("submission_")
    ) {
      baseUrl =
        `/admin/submissions/${entity.split("_")[1]}`;
    } else if (
      entity.startsWith("report_")
    ) {
      baseUrl =
        `/admin/reports/${entity.split("_")[1]}`;
    } else {
      const parts = entity.split("_");

      baseUrl =
        `/${parts[0]}s/${parts[1]}`;
    }

    const currentSearchParams =
      new URLSearchParams(
        window.location.search
      );

    const currentLang =
      currentSearchParams.get("lang") ||
      "en";

    const finalUrl = new URL(
      baseUrl,
      window.location.origin
    );

    finalUrl.searchParams.set(
      "lang",
      currentLang
    );

    if (focusValue) {
      finalUrl.searchParams.set(
        "focus",
        focusValue
      );
    }

    navigate(
      finalUrl.pathname +
        finalUrl.search
    );
  };

  /* ============================================================= */
  /* LOAD MORE                                                     */
  /* ============================================================= */

  const handleLoadMore = () => {
    const nextPage = page + 1;

    setPage(nextPage);

    fetchNotifications(
      nextPage,
      filter,
      true
    );
  };

  /* ============================================================= */
  /* GROUP NOTIFICATIONS                                           */
  /* ============================================================= */

  const groupedNotifications =
    notifications.reduce(
      (acc, notif) => {
        const group = getTimeGroup(
          notif.created_at
        );

        if (!acc[group]) {
          acc[group] = [];
        }

        acc[group].push(notif);

        return acc;
      },
      {} as Record<
        string,
        Notification[]
      >
    );

  const groupOrder = [
    "new",
    "week",
    "earlier",
  ];

  /* ============================================================= */
  /* TRANSLATIONS                                                  */
  /* ============================================================= */

  const t = {
    EN: {
      title: "Notifications",
      all: "All",
      unread: "Unread",
      markAllRead:
        "Mark all as read",
      noNotifications:
        "No notifications",
      caughtUp:
        "You're all caught up!",
      willNotify:
        "We'll notify you when something happens.",
      new: "New",
      week: "This week",
      earlier: "Earlier",
      loadMore:
        "See previous notifications",
      readMore: "Read more",
      readLess: "Read less",
    },

    AR: {
      title: "الإشعارات",
      all: "الكل",
      unread: "غير المقروء",
      markAllRead:
        "تحديد الكل كمقروء",
      noNotifications:
        "لا توجد إشعارات",
      caughtUp:
        "لقد قرأت كل شيء!",
      willNotify:
        "سنخطرك عند حدوث شيء.",
      new: "جديد",
      week: "هذا الأسبوع",
      earlier: "سابقاً",
      loadMore:
        "عرض الإشعارات السابقة",
      readMore: "عرض المزيد",
      readLess: "عرض أقل",
    },

    FR: {
      title: "Notifications",
      all: "Tout",
      unread: "Non lu",
      markAllRead:
        "Marquer tout comme lu",
      noNotifications:
        "Aucune notification",
      caughtUp:
        "Vous êtes à jour !",
      willNotify:
        "Nous vous informerons quand quelque chose se passera.",
      new: "Nouveau",
      week: "Cette semaine",
      earlier: "Plus tôt",
      loadMore:
        "Voir les notifications précédentes",
      readMore: "Lire plus",
      readLess: "Lire moins",
    },
  }[lang];

  const getTimeLabel = (
    key: string
  ) => {
    switch (key) {
      case "new":
        return t.new;

      case "week":
        return t.week;

      case "earlier":
        return t.earlier;

      default:
        return key;
    }
  };

  /* ============================================================= */
  /* PAGE                                                           */
  /* ============================================================= */

  return (
    <div
      className="
        min-h-screen
        bg-[#fbf9f4]
        px-5
        sm:px-8
        md:px-12
        lg:px-16
        xl:px-20
        py-10
        md:py-14
        pb-20
      "
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap');

        .material-symbols-outlined {
          font-variation-settings:
            'FILL' 0,
            'wght' 400,
            'GRAD' 0,
            'opsz' 24;

          font-family:
            'Material Symbols Outlined';
        }
      `}</style>

      {/* ========================================================= */}
      {/* SMALLER CENTERED CONTAINER                                */}
      {/* ========================================================= */}

      <div
        className="
          w-full
          max-w-[700px]
          mx-auto
          bg-white
          rounded-sm
          overflow-hidden
          border
          border-[#1e4d3a]/10
          shadow-sm
        "
      >

        {/* ======================================================= */}
        {/* HEADER                                                  */}
        {/* ======================================================= */}

        <div
          className="
            bg-white
            px-6
            sm:px-8
            md:px-9
            pt-8
            pb-6
            border-b
            border-[#1e4d3a]/10
          "
        >
          {/* TITLE + MARK ALL */}

          <div
            className="
              flex
              flex-col
              sm:flex-row
              sm:items-center
              sm:justify-between
              gap-4
              mb-6
            "
          >
            <h1
              className="
                text-2xl
                sm:text-3xl
                font-bold
                text-[#1e4d3a]
              "
            >
              {t.title}
            </h1>

            {/* MARK ALL AS READ */}

            <button
              onClick={handleMarkAllAsRead}
              disabled={unreadCount === 0}
              className="
                px-4
                py-2
                rounded-full
                border
                border-[#1e4d3a]/20
                text-[#1e4d3a]
                text-sm
                font-semibold
                bg-white
                hover:bg-[#1e4d3a]/5
                transition-all
                duration-200
                flex
                items-center
                justify-center
                gap-2
                whitespace-nowrap
                disabled:opacity-40
                disabled:cursor-not-allowed
                w-fit
              "
            >
              <span
                className="material-symbols-outlined"
                style={{
                  fontSize: "18px",
                }}
              >
                done_all
              </span>

              {t.markAllRead}
            </button>
          </div>

          {/* FILTER TABS */}

          <div
            className="
              flex
              w-fit
              gap-1
              bg-[#1e4d3a]/8
              p-1
              rounded-full
            "
          >
            <button
              onClick={() =>
                setFilter("all")
              }
              className={`
                px-6
                py-2
                rounded-full
                text-sm
                font-semibold
                transition-all
                duration-200

                ${
                  filter === "all"
                    ? "bg-[#1e4d3a] text-white shadow-sm"
                    : "text-[#1e4d3a]/70 hover:text-[#1e4d3a]"
                }
              `}
            >
              {t.all}
            </button>

            <button
              onClick={() =>
                setFilter("unread")
              }
              className={`
                px-6
                py-2
                rounded-full
                text-sm
                font-semibold
                transition-all
                duration-200
                flex
                items-center
                gap-2

                ${
                  filter === "unread"
                    ? "bg-[#1e4d3a] text-white shadow-sm"
                    : "text-[#1e4d3a]/70 hover:text-[#1e4d3a]"
                }
              `}
            >
              {t.unread}

              {unreadCount > 0 && (
                <span
                  className="
                    bg-[#C9A84C]
                    text-[#1e4d3a]
                    text-[10px]
                    font-bold
                    px-2
                    py-0.5
                    rounded-full
                  "
                >
                  {unreadCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* ======================================================= */}
        {/* NOTIFICATIONS                                            */}
        {/* ======================================================= */}

        <div className="bg-white">

          {isLoading ? (

            <div>
              {Array.from({
                length: 6,
              }).map((_, i) => (
                <div
                  key={i}
                  className="
                    px-6
                    sm:px-8
                    md:px-9
                    py-5
                    animate-pulse
                    flex
                    gap-4
                    border-b
                    border-[#C9A84C]/10
                  "
                >
                  <div
                    className="
                      w-12
                      h-12
                      bg-gray-200
                      rounded-full
                      flex-shrink-0
                    "
                  />

                  <div
                    className="
                      flex-1
                      space-y-3
                    "
                  >
                    <div
                      className="
                        h-4
                        bg-gray-200
                        rounded
                        w-3/4
                      "
                    />

                    <div
                      className="
                        h-3
                        bg-gray-200
                        rounded
                        w-1/2
                      "
                    />
                  </div>
                </div>
              ))}
            </div>

          ) : notifications.length === 0 ? (

            <div
              className="
                text-center
                py-24
                px-6
              "
            >
              <span
                className="
                  material-symbols-outlined
                  text-6xl
                  text-gray-300
                  mb-4
                "
              >
                notifications_off
              </span>

              <h3
                className="
                  text-lg
                  font-semibold
                  text-gray-700
                  mb-1
                "
              >
                {t.noNotifications}
              </h3>

              <p
                className="
                  text-gray-500
                  text-sm
                "
              >
                {filter === "unread"
                  ? t.caughtUp
                  : t.willNotify}
              </p>
            </div>

          ) : (

            <>
              {groupOrder
                .filter(
                  (g) =>
                    groupedNotifications[
                      g
                    ]?.length
                )
                .map(
                  (
                    timeGroup,
                    groupIdx
                  ) => (
                    <React.Fragment
                      key={timeGroup}
                    >

                      {/* GROUP TITLE */}

                      <div
                        className={`
                          px-6
                          sm:px-8
                          md:px-9
                          pt-5
                          pb-2

                          ${
                            groupIdx > 0
                              ? "border-t border-[#C9A84C]/10"
                              : ""
                          }
                        `}
                      >
                        <h3
                          className="
                            text-[11px]
                            font-bold
                            text-[#1e4d3a]/55
                            uppercase
                            tracking-wider
                          "
                        >
                          {getTimeLabel(
                            timeGroup
                          )}
                        </h3>
                      </div>

                      {/* NOTIFICATIONS */}

                      {groupedNotifications[
                        timeGroup
                      ].map(
                        (notif) => {

                          const iconStyle =
                            getNotificationIcon(
                              notif.type
                            );

                          const isSelected =
                            selectedId ===
                            notif.notification_id;

                          const isExpanded =
                            expandedIds.has(
                              notif.notification_id
                            );

                          /*
                           * We only show Read more
                           * when the notification is
                           * reasonably long.
                           */
                          const shouldShowReadMore =
                            notif.message.length >
                            120;

                          return (
                            <div
                              key={
                                notif.notification_id
                              }
                              onClick={() =>
                                handleNotificationClick(
                                  notif
                                )
                              }
                              className={`
                                px-6
                                sm:px-8
                                md:px-9
                                py-5
                                flex
                                gap-4
                                cursor-pointer
                                transition-colors
                                duration-150
                                border-b
                                border-[#C9A84C]/10

                                ${
                                  isSelected
                                    ? "bg-[#1e4d3a]/5"
                                    : !notif.is_read
                                    ? "bg-[#C9A84C]/8 hover:bg-[#C9A84C]/14"
                                    : "bg-white hover:bg-[#F5F3EC]"
                                }
                              `}
                            >

                              {/* ICON */}

                              <div className="flex-shrink-0">
                                <div
                                  className="
                                    w-11
                                    h-11
                                    rounded-full
                                    flex
                                    items-center
                                    justify-center
                                  "
                                  style={{
                                    backgroundColor:
                                      `${iconStyle.color}18`,
                                  }}
                                >
                                  <span
                                    className="
                                      material-symbols-outlined
                                    "
                                    style={{
                                      color:
                                        iconStyle.color,
                                      fontSize:
                                        "23px",
                                    }}
                                  >
                                    {
                                      iconStyle.icon
                                    }
                                  </span>
                                </div>
                              </div>

                              {/* CONTENT */}

                              <div
                                className="
                                  flex-1
                                  min-w-0
                                "
                              >
                                <div
                                  className="
                                    flex
                                    items-start
                                    justify-between
                                    gap-3
                                  "
                                >

                                  {/* MESSAGE */}

                                  <div className="min-w-0">

                                    <p
                                      className={`
                                        text-sm
                                        md:text-[15px]
                                        leading-relaxed

                                        ${
                                          !notif.is_read
                                            ? "text-[#1e4d3a] font-semibold"
                                            : "text-gray-700"
                                        }

                                        ${
                                          shouldShowReadMore &&
                                          !isExpanded
                                            ? "line-clamp-2"
                                            : ""
                                        }
                                      `}
                                    >
                                      {
                                        notif.message
                                      }
                                    </p>

                                    {/* ================================================= */}
                                    {/* READ MORE / READ LESS                           */}
                                    {/* ================================================= */}

                                    {shouldShowReadMore && (
                                      <button
                                        onClick={(
                                          event
                                        ) =>
                                          toggleExpanded(
                                            notif.notification_id,
                                            event
                                          )
                                        }
                                        className="
                                          mt-1.5
                                          text-[#1e4d3a]
                                          text-xs
                                          font-bold
                                          hover:underline
                                          transition-all
                                        "
                                      >
                                        {isExpanded
                                          ? t.readLess
                                          : t.readMore}
                                      </button>
                                    )}

                                    {/* TIME */}

                                    <span
                                      className="
                                        text-xs
                                        text-[#1e4d3a]/60
                                        mt-1.5
                                        block
                                        font-medium
                                      "
                                    >
                                      {formatTimeAgo(
                                        notif.created_at
                                      )}
                                    </span>

                                  </div>

                                  {/* UNREAD DOT */}

                                  {!notif.is_read && (
                                    <div
                                      className="
                                        w-2.5
                                        h-2.5
                                        bg-[#C9A84C]
                                        rounded-full
                                        flex-shrink-0
                                        mt-1.5
                                      "
                                    />
                                  )}

                                </div>
                              </div>
                            </div>
                          );
                        }
                      )}
                    </React.Fragment>
                  )
                )}

              {/* ================================================= */}
              {/* LOAD PREVIOUS NOTIFICATIONS                       */}
              {/* ================================================= */}

              {hasMore && (
                <div
                  className="
                    flex
                    justify-center
                    py-7
                    bg-white
                  "
                >
                  <button
                    onClick={
                      handleLoadMore
                    }
                    disabled={
                      isLoadingMore
                    }
                    className="
                      px-6
                      py-2.5
                      text-sm
                      font-semibold
                      text-[#1e4d3a]
                      bg-white
                      border
                      border-[#1e4d3a]/15
                      rounded-full
                      hover:bg-[#1e4d3a]/5
                      transition-all
                      duration-300
                      shadow-sm
                      disabled:opacity-60
                      flex
                      items-center
                      gap-2
                    "
                  >
                    {isLoadingMore && (
                      <span
                        className="
                          material-symbols-outlined
                          animate-spin
                        "
                        style={{
                          fontSize:
                            "16px",
                        }}
                      >
                        progress_activity
                      </span>
                    )}

                    {t.loadMore}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationsPage;