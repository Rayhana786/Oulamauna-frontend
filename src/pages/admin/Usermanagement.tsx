import React, { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useLang } from "../../context/LanguageContext";
import { adminApi, User } from "../../api/adminApi";

/* ------------------------------------------------------------------ */
/*  Profile-like User Details Modal                                    */
/* ------------------------------------------------------------------ */
function UserDetailsModal({ user, onClose }: { user: User; onClose: () => void }) {
  const navigate = useNavigate();
  const { t } = useLang();
  const [activity, setActivity] = useState<{ contributions: any[]; posts: any[]; loading: boolean }>({ 
    contributions: [], posts: [], loading: true 
  });

  useEffect(() => {
    const fetchActivity = async () => {
      try {
        const [contribRes, postsRes] = await Promise.all([
          adminApi.users.getContributions(user.id).catch(() => ({ data: { data: [] } })),
          adminApi.users.getForumPosts(user.id).catch(() => ({ data: { data: [] } }))
        ]);
        
        setActivity({
          contributions: contribRes.data?.data || contribRes.data || [],
          posts: postsRes.data?.data || postsRes.data || [],
          loading: false
        });
      } catch (err) {
        console.error("Failed to fetch user activity:", err);
        setActivity(prev => ({ ...prev, loading: false }));
      }
    };
    fetchActivity();
  }, [user.id]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#082f27]/40 backdrop-blur-sm" onClick={onClose}>
      <div className="dashboard-card w-full max-w-3xl max-h-[90vh] overflow-y-auto relative rounded-2xl shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="p-1.5 rounded-full hover:bg-[#1e4d3a]/10 transition-colors cursor-pointer absolute top-4 right-4 text-[#1e4d3a]">
          <span className="material-symbols-outlined text-[24px]">close</span>
        </button>

        <div className="p-8 border-b border-[#1e4d3a]/10 flex flex-col items-center text-center gap-4">
          {user.profile_picture ? (
            <img src={user.profile_picture} alt={user.username} className="w-24 h-24 rounded-full object-cover border-2 border-[#1e4d3a]/10" />
          ) : (
            <div className="w-24 h-24 rounded-full bg-[#f6efdc] text-[#1e4d3a] border-2 border-[#1e4d3a]/10 flex items-center justify-center font-['Source_Serif_4'] font-bold text-3xl flex-shrink-0">
              {(user.name || user.username || "?").split(" ").map((p: string) => p[0]).slice(0, 2).join("").toUpperCase()}
            </div>
          )}
          
          <div>
            <h2 className="font-['Source_Serif_4'] text-2xl font-bold text-[#082f27]">
              {user.name || user.username}
            </h2>
            <p className="text-[14px] text-[#1e4d3a]/60 mt-1">@{user.username}</p>
          </div>

          <div className="flex gap-2 flex-wrap justify-center">
            {user.role?.toLowerCase() === "admin" && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#C9A84C] border border-[#C9A84C] text-white mono-label text-[11px] font-bold">
                <span className="material-symbols-outlined text-[14px]">shield_person</span> {t("userManagement.roles.admin") || "Admin"}
              </span>
            )}
            {user.contributorBadge && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1e4d3a]/5 border border-[#1e4d3a]/10 text-[#1e4d3a] mono-label text-[11px] font-semibold">
                <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>how_to_reg</span> {t("userManagement.roles.contributor") || "Contributor"}
              </span>
            )}
            {user.is_banned && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#e96d5c] border border-[#e96d5c] text-white mono-label text-[11px] font-bold">
                <span className="material-symbols-outlined text-[14px]">block</span> {t("userManagement.table.banned") || "Banned"}
              </span>
            )}
            {user.role?.toLowerCase() !== "admin" && !user.contributorBadge && !user.is_banned && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1e4d3a]/5 border border-[#1e4d3a]/10 text-[#1e4d3a] mono-label text-[11px] font-semibold">
                {t("userManagement.roles.user") || "User"}
              </span>
            )}
          </div>
        </div>

        <div className="p-8 flex flex-col gap-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-[#f6efdc] p-4 rounded-[8px]">
              <p className="mono-label text-[10px] text-[#1e4d3a]/60 mb-1 uppercase">{t("userManagement.modal.details.email") || "Email"}</p>
              <p className="text-[14px] text-[#082f27] font-semibold break-all">{user.email}</p>
            </div>
            <div className="bg-[#f6efdc] p-4 rounded-[8px]">
              <p className="mono-label text-[10px] text-[#1e4d3a]/60 mb-1 uppercase">{t("userManagement.modal.details.userId") || "User ID"}</p>
              <p className="text-[14px] text-[#082f27] font-semibold">#{user.id}</p>
            </div>
            <div className="bg-[#f6efdc] p-4 rounded-[8px]">
              <p className="mono-label text-[10px] text-[#1e4d3a]/60 mb-1 uppercase">{t("userManagement.modal.details.accountStatus") || "Account Status"}</p>
              {user.is_banned ? (
                <p className="text-[14px] font-semibold flex items-center gap-2 text-[#e96d5c]">
                  <span className="w-2 h-2 rounded-full bg-[#e96d5c]" />
                  {t("userManagement.table.banned") || "Banned"}
                </p>
              ) : !user.is_active ? (
                <p className="text-[14px] font-semibold flex items-center gap-2 text-gray-600">
                  <span className="w-2 h-2 rounded-full bg-gray-400" />
                  {t("userManagement.table.inactive") || "Inactive"}
                </p>
              ) : (
                <p className="text-[14px] font-semibold flex items-center gap-2 text-[#082f27]">
                  <span className="w-2 h-2 rounded-full bg-[#1e4d3a]" />
                  {t("userManagement.table.active") || "Active"}
                </p>
              )}
            </div>
            <div className="bg-[#f6efdc] p-4 rounded-[8px]">
              <p className="mono-label text-[10px] text-[#1e4d3a]/60 mb-1 uppercase">{t("userManagement.modal.details.joined") || "Joined"}</p>
              <p className="text-[14px] text-[#082f27] font-semibold">
                {new Date(user.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
              </p>
            </div>
          </div>

          {user.bio && (
            <div>
              <h3 className="mono-label text-[11px] tracking-wider text-[#1e4d3a]/60 mb-2 uppercase flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[14px]">person</span> {t("userManagement.modal.details.about") || "About"}
              </h3>
              <p className="text-[14px] text-[#1e4d3a] leading-relaxed whitespace-pre-wrap bg-[#f6efdc] p-4 rounded-[8px]">
                {user.bio}
              </p>
            </div>
          )}

          <div>
            <h3 className="mono-label text-[11px] tracking-wider text-[#1e4d3a]/60 mb-3 uppercase flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[14px]">history_edu</span> {t("userManagement.modal.details.contributions") || "Contributions"} ({activity.loading ? "..." : activity.contributions.length})
            </h3>
            {activity.loading ? (
              <div className="text-center py-5 opacity-50"><span className="material-symbols-outlined text-[24px] animate-pulse text-[#1e4d3a]/40">hourglass_empty</span></div>
            ) : activity.contributions.length === 0 ? (
              <p className="text-[13px] text-[#1e4d3a]/60 italic">{t("userManagement.modal.details.noContributions") || "No contributions yet."}</p>
            ) : (
              <div className="flex flex-col gap-2">
                {activity.contributions.map((c: any, i: number) => {
                  console.log("Contribution Data:", c);

                  let link = "#";
                  
                  // 1. Get the ID and Language
                  const itemId = c.version_id || c.versionId || c.work_id || c.workId || c.media_id || c.mediaId || c.id;
                  const langCode = c.lang || c.language;
                  
                  // 2. Get the type
                  const itemType = (c.type || "").toLowerCase();

                  // 3. Build the link based on type
                  if (itemId) {
                    if (itemType.includes("work")) {
                      link = `/admin/works?workId=${itemId}`;
                    } else if (itemType.includes("media")) {
                      link = `/admin/media?mediaId=${itemId}`;
                    } else {
                      // Scholar keeps the old correct route with language
                      link = langCode ? `/admin/scholars/${itemId}/${langCode}` : `/admin/scholars/${itemId}`;
                    }
                  }

                  return (
                    <div 
                      key={i} 
                      onClick={() => {
                        if (link !== "#") {
                          console.log("Navigating to:", link);
                          navigate(link);
                        }
                      }}
                      className={`p-3.5 bg-[#fbf9f4] rounded-xl border border-[#1e4d3a]/10 flex justify-between items-center transition-colors ${
                        link !== "#" ? "cursor-pointer hover:bg-[#f6efdc]" : "cursor-default opacity-50"
                      }`}
                    >
                      <div>
                        <p className="mono-label text-[9px] text-[#1e4d3a]/60 uppercase mb-1">{c.type || "Item"}</p>
                        <p className="font-['Source_Serif_4'] text-[13px] font-semibold text-[#082f27]">{c.title}</p>
                      </div>
                      {link !== "#" && <span className="material-symbols-outlined text-[16px] text-[#1e4d3a]/50">arrow_forward</span>}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div>
            <h3 className="mono-label text-[11px] tracking-wider text-[#1e4d3a]/60 mb-3 uppercase flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[14px]">forum</span> {t("userManagement.modal.details.forumPosts") || "Forum Posts"} ({activity.loading ? "..." : activity.posts.length})
            </h3>
            {activity.loading ? (
              <div className="text-center py-5 opacity-50"><span className="material-symbols-outlined text-[24px] animate-pulse text-[#1e4d3a]/40">hourglass_empty</span></div>
            ) : activity.posts.length === 0 ? (
              <p className="text-[13px] text-[#1e4d3a]/60 italic">{t("userManagement.modal.details.noForumPosts") || "No forum posts yet."}</p>
            ) : (
              <div className="flex flex-col gap-2">
                {activity.posts.map((p: any, i: number) => {
                  const link = `/admin/discussions?postId=${p.post_id}`;
                  return (
                    <div 
                      key={i} 
                      onClick={() => navigate(link)}
                      className="p-3.5 bg-[#fbf9f4] rounded-xl border border-[#1e4d3a]/10 flex justify-between items-center cursor-pointer transition-colors hover:bg-[#f6efdc]"
                    >
                      <div>
                        <p className="font-['Source_Serif_4'] text-[13px] font-semibold text-[#082f27] mb-1">{p.title}</p>
                        <p className="text-[11px] text-[#1e4d3a]/60">{p.category || "General"} • {new Date(p.created_at).toLocaleDateString()}</p>
                      </div>
                      <span className="material-symbols-outlined text-[16px] text-[#1e4d3a]/50">arrow_forward</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */
type FilterTab = "all" | "contributors" | "banned";

export default function UserManagement() {
  const { t, lang } = useLang();
  const isRTL = lang === "AR";

  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [busyId, setBusyId] = useState<number | null>(null);

  // ✅ Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 15;

  const [banTarget, setBanTarget] = useState<User | null>(null);
  const [viewTarget, setViewTarget] = useState<User | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoading(true);
      try {
        const res = await adminApi.users.getAll();
        if (res.data?.success && Array.isArray(res.data.users)) {
          setUsers(res.data.users);
        } else {
          console.warn("Unexpected API response format:", res.data);
        }
      } catch (error) {
        console.error("Failed to fetch users:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchUsers();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, roleFilter, search]);

  const roles = useMemo(() => {
    const set = new Set(users.map((u) => u.role).filter(Boolean));
    return Array.from(set);
  }, [users]);

  const filtered = useMemo(() => {
    let result = [...users];
    if (activeTab === "contributors") result = result.filter((u) => u.contributorBadge); // ✅ Now uses contributorBadge
    if (activeTab === "banned") result = result.filter((u) => u.is_banned);
    if (roleFilter !== "all") result = result.filter((u) => u.role === roleFilter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(
        (u) => u.username?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q) || (u.name && u.name.toLowerCase().includes(q))
      );
    }
    return result;
  }, [users, activeTab, roleFilter, search]);

  const stats = useMemo(
    () => ({
      total: users.length,
      contributors: users.filter((u) => u.contributorBadge).length, // ✅ Now uses contributorBadge
      banned: users.filter((u) => u.is_banned).length,
      admins: users.filter((u) => u.role?.toLowerCase() === "admin").length,
    }),
    [users]
  );

  const clearFilters = () => {
    setActiveTab("all");
    setRoleFilter("all");
    setSearch("");
  };

  const hasActiveFilters = activeTab !== "all" || roleFilter !== "all" || search.trim() !== "";

  const handleToggleContribute = async (user: User) => {
    setBusyId(user.id);
    try {
      await adminApi.users.toggleContribute(user.id);
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, contributorBadge: !u.contributorBadge } : u)) // ✅ Now toggles contributorBadge
      );
    } catch (error) {
      console.error("Failed to update contributor status:", error);
      alert("Failed to update contributor status. Please try again.");
    } finally {
      setBusyId(null);
    }
  };

  const handleUnban = async (user: User) => {
    setBusyId(user.id);
    try {
      await adminApi.users.unban(user.id);
      setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, is_banned: false } : u)));
    } catch (error) {
      console.error("Failed to unban user:", error);
      alert("Failed to unban user. Please try again.");
    } finally {
      setBusyId(null);
    }
  };

  const confirmBan = async () => {
    if (!banTarget) return;
    setBusyId(banTarget.id);
    try {
      await adminApi.users.ban(banTarget.id);
      setUsers((prev) => prev.map((u) => (u.id === banTarget.id ? { ...u, is_banned: true } : u)));
      setBanTarget(null);
    } catch (error) {
      console.error("Failed to ban user:", error);
      alert("Failed to ban user. Please try again.");
    } finally {
      setBusyId(null);
    }
  };

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginatedUsers = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const tabs: { key: FilterTab; icon: string; label: string; count: number }[] = [
    { key: "all", icon: "group", label: t("userManagement.tabs.all") || "All Users", count: stats.total },
    { key: "contributors", icon: "how_to_reg", label: t("userManagement.tabs.contributors") || "Contributors", count: stats.contributors },
    { key: "banned", icon: "block", label: t("userManagement.tabs.banned") || "Banned", count: stats.banned },
  ];

  const statItems = [
    { icon: "group", label: t("userManagement.stats.totalUsers") || "Total Users", value: stats.total.toString(), delta: t("userManagement.stats.totalUsersDesc") || "All registered accounts" },
    { icon: "how_to_reg", label: t("userManagement.stats.contributors") || "Contributors", value: stats.contributors.toString(), delta: t("userManagement.stats.contributorsDesc") || "Allowed to contribute" },
    { icon: "block", label: t("userManagement.stats.bannedUsers") || "Banned Users", value: stats.banned.toString(), delta: t("userManagement.stats.bannedUsersDesc") || "Restricted accounts", isOverdue: true },
    { icon: "shield_person", label: t("userManagement.stats.admins") || "Admins", value: stats.admins.toString(), delta: t("userManagement.stats.adminsDesc") || "Administrator role" },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fbf9f4]">
        <span className="material-symbols-outlined text-[40px] text-[#1e4d3a]/40 animate-pulse">hourglass_empty</span>
      </div>
    );
  }

  return (
    <div className="oulamauna-dashboard min-h-screen text-[#1e4d3a] antialiased font-['Inter']" dir={isRTL ? "rtl" : "ltr"}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&family=Source+Serif+4:wght@400;500;600;700&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap');
        .oulamauna-dashboard { background: radial-gradient(circle at 8% 10%, rgba(201,168,76,0.055), transparent 24%), radial-gradient(circle at 92% 16%, rgba(79,145,132,0.06), transparent 25%), #fbf9f4; }
        .oulamauna-dashboard * { box-sizing: border-box; }
        .oulamauna-dashboard .serif-title { font-family: 'Source Serif 4', Georgia, serif; letter-spacing: -0.025em; }
        .oulamauna-dashboard .mono-label { font-family: 'JetBrains Mono', monospace; letter-spacing: 0.06em; }
        .oulamauna-dashboard .dashboard-card { background: rgba(251,249,244,0.96); border: 1px solid rgba(30,77,58,0.10); border-radius: 10px; box-shadow: 0 5px 18px rgba(30,77,58,0.055); transition: box-shadow 180ms ease; }
        .oulamauna-dashboard .dashboard-card:hover { box-shadow: 0 9px 26px rgba(30,77,58,0.08); }
        .oulamauna-dashboard ::selection { background: #C9A84C; color: #1e4d3a; }
      `}</style>

      <main className="max-w-[1450px] mx-auto px-3 md:px-5 xl:px-7 py-6 md:py-8">
        <div className="mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="mono-label text-[9px] uppercase font-bold text-[#1e4d3a]/60">ADMIN / USER MANAGEMENT</span>
              </div>
              <h1 className="serif-title text-[27px] md:text-[32px] leading-tight font-semibold text-[#082f27]">
                {t("userManagement.title") || "User Management"}
              </h1>
              <p className="text-[12px] text-[#1e4d3a]/60 mt-1">
                {t("userManagement.subtitle") || "View every account, manage contributor access, and handle bans in one place."}
              </p>
            </div>
          </div>

          <div className="dashboard-card p-3 mb-6 flex flex-col md:flex-row justify-between items-center gap-3">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 w-full md:w-auto">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-[8px] border border-[#1e4d3a] transition-colors flex-shrink-0 ${
                      isActive ? "bg-[#1e4d3a] text-white" : "bg-transparent text-[#1e4d3a] hover:bg-[#1e4d3a]/5"
                    }`}
                  >
                    <span className="material-symbols-outlined text-[15px]" style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}>{tab.icon}</span>
                    <span className="text-[13px] font-semibold">{tab.label}</span>
                    <span className={`mono-label text-[10px] px-1.5 py-0.5 rounded-full ${isActive ? "bg-white text-[#1e4d3a]" : "bg-[#f6efdc] text-[#1e4d3a]"}`}>
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-2.5 flex-wrap w-full md:w-auto justify-end">
              <div className="flex items-center gap-2 px-3 py-2 bg-[#f6efdc] border border-[#1e4d3a]/15 rounded-[8px] flex-1 md:flex-none">
                <span className="material-symbols-outlined text-[15px] text-[#1e4d3a]">search</span>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t("userManagement.searchPlaceholder") || "Search name or email"}
                  className="border-none outline-none bg-transparent font-['Inter'] text-[13px] text-[#1e4d3a] w-full md:w-40"
                />
              </div>

              {roles.length > 0 && (
                <div className="flex items-center gap-2 px-3 py-2 bg-[#f6efdc] border border-[#1e4d3a]/15 rounded-[8px] cursor-pointer">
                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="border-none outline-none bg-transparent font-['Inter'] text-[13px] text-[#1e4d3a] cursor-pointer min-w-[100px]"
                  >
                    <option value="all">{t("userManagement.roles.all") || "All Roles"}</option>
                    {roles.map((r) => {
                      const roleKey = r.toLowerCase();
                      return (
                        <option key={r} value={r}>
                          {t(`userManagement.roles.${roleKey}`) || r}
                        </option>
                      );
                    })}
                  </select>
                </div>
              )}

              {hasActiveFilters && (
                <button onClick={clearFilters} className="flex items-center gap-1 px-2.5 py-2 bg-transparent border border-[#e96d5c] rounded-[8px] text-[#e96d5c] text-[12px] font-semibold hover:bg-[#e96d5c]/5 transition-colors cursor-pointer">
                  <span className="material-symbols-outlined text-[14px]">close</span> {t("userManagement.clear") || "Clear"}
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {statItems.map((s) => (
            <div key={s.label} className="dashboard-card p-4">
              <div className="flex justify-between items-start mb-3">
                <div className="w-7 h-7 rounded-[6px] bg-[#f6efdc] text-[#1e4d3a] border border-[#1e4d3a]/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[16px]">{s.icon}</span>
                </div>
              </div>
              <p className="mono-label text-[11px] text-[#1e4d3a]/60 mb-1">{s.label}</p>
              <p className={`font-['Source_Serif_4'] text-2xl font-bold leading-none mb-1 ${(s as any).isOverdue ? "text-[#e96d5c]" : "text-[#082f27]"}`}>{s.value}</p>
              <p className="text-[11px] text-[#1e4d3a]/60">{s.delta}</p>
            </div>
          ))}
        </div>

        <div className="dashboard-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#1e4d3a]/10 bg-[#1e4d3a]/[0.02]">
                  <th className="mono-label text-[9px] uppercase font-bold text-[#1e4d3a]/60 px-5 py-3.5">{t("userManagement.table.user") || "User"}</th>
                  <th className="mono-label text-[9px] uppercase font-bold text-[#1e4d3a]/60 px-5 py-3.5">{t("userManagement.table.role") || "Role"}</th>
                  <th className="mono-label text-[9px] uppercase font-bold text-[#1e4d3a]/60 px-5 py-3.5">{t("userManagement.table.contributor") || "Contributor"}</th>
                  <th className="mono-label text-[9px] uppercase font-bold text-[#1e4d3a]/60 px-5 py-3.5">{t("userManagement.table.strikes") || "Strikes"}</th>
                  <th className="mono-label text-[9px] uppercase font-bold text-[#1e4d3a]/60 px-5 py-3.5">{t("userManagement.table.status") || "Status"}</th>
                  <th className="mono-label text-[9px] uppercase font-bold text-[#1e4d3a]/60 px-5 py-3.5 text-right">{t("userManagement.table.actions") || "Actions"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e4d3a]/[0.06]">
                {paginatedUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center text-[#1e4d3a]/50">
                      <span className="material-symbols-outlined text-[40px] mb-2 block mx-auto">person_search</span>
                      <p className="text-[14px]">{t("userManagement.table.noUsers") || "No users found matching your filters."}</p>
                    </td>
                  </tr>
                ) : (
                  paginatedUsers.map((u) => {
                    const busy = busyId === u.id;
                    return (
                      <tr key={u.id} className="hover:bg-[#1e4d3a]/[0.015] transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            {u.profile_picture ? (
                              <img src={u.profile_picture} alt={u.username} className="w-9 h-9 rounded-full object-cover border-2 border-[#1e4d3a]/10 flex-shrink-0" />
                            ) : (
                              <div className="w-9 h-9 rounded-full bg-[#f6efdc] text-[#1e4d3a] border-2 border-[#1e4d3a]/10 flex items-center justify-center font-['Source_Serif_4'] font-bold text-[14px] flex-shrink-0">
                                {(u.name || u.username || "?").split(" ").map((p: string) => p[0]).slice(0, 2).join("").toUpperCase()}
                              </div>
                            )}
                            <div>
                              <p className="font-['Source_Serif_4'] text-[13px] font-semibold text-[#082f27]">{u.name || u.username}</p>
                              <p className="text-[12px] text-[#1e4d3a]/60">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          {u.role?.toLowerCase() === "admin" ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#C9A84C] border border-[#C9A84C] text-white mono-label text-[10px] font-bold">
                              <span className="material-symbols-outlined text-[12px]">shield_person</span> {t("userManagement.roles.admin") || "Admin"}
                            </span>
                          ) : u.contributorBadge ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#1e4d3a]/5 border border-[#1e4d3a]/10 text-[#1e4d3a] mono-label text-[10px] font-semibold">
                              <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>how_to_reg</span> {t("userManagement.roles.contributor") || "Contributor"}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#1e4d3a]/5 border border-[#1e4d3a]/10 text-[#1e4d3a] mono-label text-[10px] font-semibold">
                              {t("userManagement.roles.user") || "User"}
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3.5">
                          <button
                            onClick={() => handleToggleContribute(u)}
                            disabled={busy}
                            title={u.allowed_to_contribute ? (t("userManagement.table.revokeContributor") || "Click to revoke contributor access") : (t("userManagement.table.grantContributor") || "Click to grant contributor access")}
                            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border transition-colors text-[11px] font-semibold ${
                              u.allowed_to_contribute 
                                ? "bg-[#1e4d3a] border-[#1e4d3a] text-white" 
                                : "bg-transparent border-[#1e4d3a]/15 text-[#1e4d3a] hover:bg-[#1e4d3a]/5"
                            } ${busy ? "opacity-60 cursor-wait" : "cursor-pointer"}`}
                          >
                            <span className="material-symbols-outlined text-[15px]" style={{ fontVariationSettings: u.allowed_to_contribute ? "'FILL' 1" : "'FILL' 0" }}>
                              {u.allowed_to_contribute ? "toggle_on" : "toggle_off"}
                            </span>
                            {u.allowed_to_contribute ? (t("userManagement.table.allowed") || "Allowed") : (t("userManagement.table.notAllowed") || "Not allowed")}
                          </button>
                        </td>
                        <td className="px-5 py-3.5">
                          {(() => {
                            const strikes = u.strike_count || 0;
                            const isHighRisk = strikes >= 3;
                            const isWarning = strikes > 0 && strikes < 3;
                            return (
                              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border mono-label text-[10px] font-bold ${
                                isHighRisk ? "bg-[#e96d5c]/10 border-[#e96d5c] text-[#e96d5c]" : 
                                isWarning ? "bg-[#C9A84C]/10 border-[#C9A84C] text-[#C9A84C]" : 
                                "bg-[#1e4d3a]/5 border-[#1e4d3a]/10 text-[#1e4d3a]"
                              }`}>
                                {isHighRisk && <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>}
                                {strikes} {strikes === 1 ? (t("userManagement.table.strike") || "Strike") : (t("userManagement.table.strikes") || "Strikes")}
                              </span>
                            );
                          })()}
                        </td>
                        <td className="px-5 py-3.5">
                          {u.is_banned ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border mono-label text-[10px] font-semibold bg-[#e96d5c]/10 border-[#e96d5c] text-[#e96d5c]">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#e96d5c]" />
                              {t("userManagement.table.banned") || "Banned"}
                            </span>
                          ) : !u.is_active ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border mono-label text-[10px] font-semibold bg-gray-100 border-gray-300 text-gray-600">
                              <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                              {t("userManagement.table.inactive") || "Inactive"}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border mono-label text-[10px] font-semibold bg-[#1e4d3a]/5 border-[#1e4d3a]/10 text-[#1e4d3a]">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#1e4d3a]" />
                              {t("userManagement.table.active") || "Active"}
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setViewTarget(u)}
                              title={t("userManagement.table.viewDetails") || "View details"}
                              className="w-8 h-8 flex items-center justify-center rounded-[6px] border border-[#1e4d3a]/20 text-[#1e4d3a] hover:bg-[#1e4d3a] hover:text-white transition-colors cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-[18px]">visibility</span>
                            </button>

                            {u.is_banned ? (
                              <button
                                onClick={() => handleUnban(u)}
                                disabled={busy}
                                title={t("userManagement.table.unbanUser") || "Unban user"}
                                className="w-8 h-8 flex items-center justify-center rounded-[6px] bg-[#1e4d3a] border border-[#1e4d3a] text-white hover:bg-[#1e4d3a]/90 transition-colors disabled:opacity-60 disabled:cursor-wait cursor-pointer"
                              >
                                <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>lock_open</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => setBanTarget(u)}
                                disabled={busy}
                                title={t("userManagement.table.banUser") || "Ban user"}
                                className="w-8 h-8 flex items-center justify-center rounded-[6px] border border-[#e96d5c] text-[#e96d5c] hover:bg-[#e96d5c] hover:text-white transition-colors disabled:opacity-60 disabled:cursor-wait cursor-pointer"
                              >
                                <span className="material-symbols-outlined text-[18px]">block</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-5 py-4 border-t border-[#1e4d3a]/10 bg-[#1e4d3a]/[0.01]">
              <div className="text-[11px] text-[#1e4d3a]/60 mono-label">
                {t("admin.common.showing") || "Showing"} {(currentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)} {t("admin.common.of") || "of"} {filtered.length}
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1} className="flex items-center justify-center w-8 h-8 rounded-[6px] border border-[#1e4d3a]/20 text-[#1e4d3a] disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#1e4d3a] hover:text-white transition-colors cursor-pointer">
                  <span className="material-symbols-outlined text-[18px]">{isRTL ? 'arrow_forward' : 'arrow_back'}</span>
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) pageNum = i + 1;
                  else if (currentPage <= 3) pageNum = i + 1;
                  else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                  else pageNum = currentPage - 2 + i;
                  return (
                    <button key={pageNum} onClick={() => setCurrentPage(pageNum)} className={`w-8 h-8 rounded-[6px] text-[11px] font-bold mono-label transition-colors cursor-pointer ${currentPage === pageNum ? 'bg-[#1e4d3a] text-white' : 'border border-[#1e4d3a]/20 text-[#1e4d3a] hover:bg-[#1e4d3a]/10'}`}>
                      {pageNum}
                    </button>
                  );
                })}
                <button onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages} className="flex items-center justify-center w-8 h-8 rounded-[6px] border border-[#1e4d3a]/20 text-[#1e4d3a] disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#1e4d3a] hover:text-white transition-colors cursor-pointer">
                  <span className="material-symbols-outlined text-[18px]">{isRTL ? 'arrow_back' : 'arrow_forward'}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {banTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#082f27]/40 backdrop-blur-sm" onClick={() => setBanTarget(null)}>
            <div className="dashboard-card w-full max-w-md p-6 relative" onClick={(e) => e.stopPropagation()}>
              <button onClick={() => setBanTarget(null)} className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-[#1e4d3a]/10 transition-colors cursor-pointer text-[#1e4d3a]">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
              <div className="w-14 h-14 rounded-full bg-[#e96d5c] text-white flex items-center justify-center mb-5">
                <span className="material-symbols-outlined text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>block</span>
              </div>
              <h2 className="serif-title text-[20px] font-semibold text-[#082f27] mb-3">{t("userManagement.modal.banTitle") || "Ban User"}</h2>
              <p className="text-[13px] text-[#1e4d3a]/80 leading-relaxed mb-6">
                {(t("userManagement.modal.banMessage") || "Are you sure you want to ban {username} ({email})? They will lose access to their account.")
                  .replace("{username}", banTarget.username)
                  .replace("{email}", banTarget.email)}
                <br /><br />
                <strong className="text-[#e96d5c]">{t("userManagement.modal.banWarning") || "You can unban them later from this page."}</strong>
              </p>
              <div className="flex gap-3 justify-end">
                <button onClick={() => setBanTarget(null)} className="px-5 py-2 rounded-[6px] border border-[#1e4d3a]/20 text-[#1e4d3a] text-[12px] font-bold uppercase tracking-wide hover:bg-[#1e4d3a]/5 transition-colors cursor-pointer">
                  {t("userManagement.modal.cancel") || "Cancel"}
                </button>
                <button onClick={confirmBan} className="px-5 py-2 rounded-[6px] bg-[#e96d5c] border border-[#e96d5c] text-white text-[12px] font-bold uppercase tracking-wide hover:bg-[#e96d5c]/90 transition-colors cursor-pointer">
                  {t("userManagement.modal.confirmBan") || "Confirm Ban"}
                </button>
              </div>
            </div>
          </div>
        )}

        {viewTarget && (
          <UserDetailsModal user={viewTarget} onClose={() => setViewTarget(null)} />
        )}

      </main>
    </div>
  );
}