import React, { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom"; // ✅ Add useNavigate here
import { useLang } from "../../context/LanguageContext";
import { adminApi, User } from "../../api/adminApi";

/* ------------------------------------------------------------------ */
/*  Design tokens — Oulamnauna admin palette                          */
/* ------------------------------------------------------------------ */
const colors = {
  creamLight: "#fcfaf5",
  creamMid: "#f6efdc",
  creamDark: "#e5d5a8",
  forestGreen: "#0b4335",
  amber: "#b8860b",
  red: "#8b2c2c",
};

const fonts = {
  headline: "'Hanken Grotesk', sans-serif",
  body: "'Inter', sans-serif",
  label: "'JetBrains Mono', monospace",
};

const cardStyle: React.CSSProperties = {
  backgroundColor: colors.creamLight,
  borderRadius: 12,
  boxShadow: "0px 4px 20px rgba(11, 67, 53, 0.08)",
  border: `1px solid ${colors.forestGreen}`,
};

/* ------------------------------------------------------------------ */
/*  Reusable UI Components                                             */
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

const Avatar: React.FC<{ name: string; size?: number }> = ({ name, size = 28 }) => {
  const initials = (name || "?")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        backgroundColor: colors.creamMid,
        color: colors.forestGreen,
        border: `1px solid ${colors.forestGreen}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: fonts.headline,
        fontWeight: 700,
        fontSize: size * 0.4,
        flexShrink: 0,
      }}
    >
      {initials}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Profile-like User Details Modal with Contributions & Posts         */
/* ------------------------------------------------------------------ */
function UserDetailsModal({ user, onClose }: { user: User; onClose: () => void }) {
  const navigate = useNavigate();
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
    <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(11, 67, 53, 0.6)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)", padding: 20 }} onClick={onClose}>
      <div style={{ ...cardStyle, backgroundColor: colors.creamLight, width: 650, maxWidth: "95vw", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.25)", position: "relative" }} onClick={(e) => e.stopPropagation()}>
        
        {/* Close Button */}
        <button onClick={onClose} style={{ position: "absolute", top: 16, right: 16, background: "none", border: "none", cursor: "pointer", color: colors.forestGreen, opacity: 0.6, zIndex: 10 }}>
          <Icon name="close" size={24} />
        </button>

        {/* Profile Header */}
        <div style={{ padding: 32, borderBottom: `1px solid ${colors.creamDark}`, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 16 }}>
          {user.profile_picture ? (
            <img src={user.profile_picture} alt={user.username} style={{ width: 96, height: 96, borderRadius: "50%", objectFit: "cover", border: `3px solid ${colors.forestGreen}` }} />
          ) : (
            <Avatar name={user.name || user.username} size={96} />
          )}
          
          <div>
            <h2 style={{ fontFamily: fonts.headline, fontSize: 24, fontWeight: 700, color: colors.forestGreen, margin: 0 }}>
              {user.name || user.username}
            </h2>
            <p style={{ fontFamily: fonts.body, fontSize: 14, color: colors.forestGreen, opacity: 0.7, margin: "4px 0 0" }}>@{user.username}</p>
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
            {user.role?.toLowerCase() === "admin" && (
              <span style={{ padding: "4px 12px", borderRadius: 9999, backgroundColor: colors.amber, border: `1px solid ${colors.amber}`, color: colors.creamLight, fontFamily: fonts.label, fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}>
                <Icon name="shield_person" size={14} /> Admin
              </span>
            )}
            {(user.contributorBadge || user.allowed_to_contribute) && (
              <span style={{ padding: "4px 12px", borderRadius: 9999, backgroundColor: colors.creamMid, border: `1px solid ${colors.forestGreen}`, color: colors.forestGreen, fontFamily: fonts.label, fontSize: 11, fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
                <Icon name="how_to_reg" size={14} filled /> Contributor
              </span>
            )}
            {user.is_banned && (
              <span style={{ padding: "4px 12px", borderRadius: 9999, backgroundColor: colors.red, border: `1px solid ${colors.red}`, color: colors.creamLight, fontFamily: fonts.label, fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}>
                <Icon name="block" size={14} /> Banned
              </span>
            )}
            {user.role?.toLowerCase() !== "admin" && !user.contributorBadge && !user.allowed_to_contribute && !user.is_banned && (
              <span style={{ padding: "4px 12px", borderRadius: 9999, backgroundColor: colors.creamMid, border: `1px solid ${colors.forestGreen}`, color: colors.forestGreen, fontFamily: fonts.label, fontSize: 11, fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
                User
              </span>
            )}
          </div>
        </div>

        {/* Profile Info & Activity */}
        <div style={{ padding: 32, display: "flex", flexDirection: "column", gap: 32 }}>
          
          {/* Details Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div style={{ backgroundColor: colors.creamMid, padding: 16, borderRadius: 8 }}>
              <p style={{ fontFamily: fonts.label, fontSize: 10, color: colors.forestGreen, opacity: 0.7, margin: "0 0 4px", textTransform: "uppercase" }}>Email</p>
              <p style={{ fontFamily: fonts.body, fontSize: 14, color: colors.forestGreen, fontWeight: 600, margin: 0, wordBreak: "break-all" }}>{user.email}</p>
            </div>
            <div style={{ backgroundColor: colors.creamMid, padding: 16, borderRadius: 8 }}>
              <p style={{ fontFamily: fonts.label, fontSize: 10, color: colors.forestGreen, opacity: 0.7, margin: "0 0 4px", textTransform: "uppercase" }}>User ID</p>
              <p style={{ fontFamily: fonts.body, fontSize: 14, color: colors.forestGreen, fontWeight: 600, margin: 0 }}>#{user.id}</p>
            </div>
            <div style={{ backgroundColor: colors.creamMid, padding: 16, borderRadius: 8 }}>
              <p style={{ fontFamily: fonts.label, fontSize: 10, color: colors.forestGreen, opacity: 0.7, margin: "0 0 4px", textTransform: "uppercase" }}>Account Status</p>
              <p style={{ fontFamily: fonts.body, fontSize: 14, color: user.is_banned ? colors.red : colors.forestGreen, fontWeight: 600, margin: 0, display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: user.is_banned ? colors.red : colors.forestGreen }} />
                {user.is_banned ? "Banned" : "Active"}
              </p>
            </div>
            <div style={{ backgroundColor: colors.creamMid, padding: 16, borderRadius: 8 }}>
              <p style={{ fontFamily: fonts.label, fontSize: 10, color: colors.forestGreen, opacity: 0.7, margin: "0 0 4px", textTransform: "uppercase" }}>Joined</p>
              <p style={{ fontFamily: fonts.body, fontSize: 14, color: colors.forestGreen, fontWeight: 600, margin: 0 }}>
                {new Date(user.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
              </p>
            </div>
          </div>

          {/* Bio Section */}
          {user.bio && (
            <div>
              <h3 style={{ fontFamily: fonts.label, fontSize: 11, letterSpacing: "0.08em", color: colors.forestGreen, opacity: 0.7, marginBottom: 8, textTransform: "uppercase", display: "flex", alignItems: "center", gap: 6 }}>
                <Icon name="person" size={14} /> About
              </h3>
              <p style={{ fontFamily: fonts.body, fontSize: 14, color: colors.forestGreen, lineHeight: 1.6, margin: 0, whiteSpace: "pre-wrap", backgroundColor: colors.creamMid, padding: 16, borderRadius: 8 }}>
                {user.bio}
              </p>
            </div>
          )}

          {/* Contributions Section */}
          <div>
            <h3 style={{ fontFamily: fonts.label, fontSize: 11, letterSpacing: "0.08em", color: colors.forestGreen, opacity: 0.7, marginBottom: 12, textTransform: "uppercase", display: "flex", alignItems: "center", gap: 6 }}>
              <Icon name="history_edu" size={14} /> Contributions ({activity.loading ? "..." : activity.contributions.length})
            </h3>
            {activity.loading ? (
              <div style={{ textAlign: "center", padding: 20, opacity: 0.5 }}><Icon name="hourglass_empty" size={24} /></div>
            ) : activity.contributions.length === 0 ? (
              <p style={{ fontFamily: fonts.body, fontSize: 13, color: colors.forestGreen, opacity: 0.6, fontStyle: "italic" }}>No contributions yet.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {activity.contributions.map((c: any, i: number) => {
                  // Determine navigation link based on contribution type
                  let link = "#";
                  if (c.scholar_id && c.lang) {
                    link = `/admin/scholars/${c.scholar_id}/${c.lang}`;
                  }
                  
                  return (
                    <div 
                      key={i} 
                      onClick={() => link !== "#" && navigate(link)}
                      style={{ 
                        padding: 12, 
                        backgroundColor: colors.creamMid, 
                        borderRadius: 8, 
                        border: `1px solid ${colors.creamDark}`,
                        cursor: link !== "#" ? "pointer" : "default",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        transition: "background-color 0.2s ease"
                      }}
                      onMouseEnter={(e) => { if(link !== "#") e.currentTarget.style.backgroundColor = colors.creamDark; }}
                      onMouseLeave={(e) => { if(link !== "#") e.currentTarget.style.backgroundColor = colors.creamMid; }}
                    >
                      <div>
                        <p style={{ fontFamily: fonts.label, fontSize: 9, color: colors.forestGreen, opacity: 0.7, textTransform: "uppercase", margin: "0 0 4px" }}>{c.type || "Item"}</p>
                        <p style={{ fontFamily: fonts.headline, fontSize: 13, fontWeight: 600, color: colors.forestGreen, margin: 0 }}>{c.title}</p>
                      </div>
                      {link !== "#" && <Icon name="arrow_forward" size={16} style={{ opacity: 0.5 }} />}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Forum Posts Section */}
          <div>
            <h3 style={{ fontFamily: fonts.label, fontSize: 11, letterSpacing: "0.08em", color: colors.forestGreen, opacity: 0.7, marginBottom: 12, textTransform: "uppercase", display: "flex", alignItems: "center", gap: 6 }}>
              <Icon name="forum" size={14} /> Forum Posts ({activity.loading ? "..." : activity.posts.length})
            </h3>
            {activity.loading ? (
              <div style={{ textAlign: "center", padding: 20, opacity: 0.5 }}><Icon name="hourglass_empty" size={24} /></div>
            ) : activity.posts.length === 0 ? (
              <p style={{ fontFamily: fonts.body, fontSize: 13, color: colors.forestGreen, opacity: 0.6, fontStyle: "italic" }}>No forum posts yet.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {activity.posts.map((p: any, i: number) => {
                  const link = `/admin/post/${p.post_id}`;
                  return (
                    <div 
                      key={i} 
                      onClick={() => navigate(link)}
                      style={{ 
                        padding: 12, 
                        backgroundColor: colors.creamMid, 
                        borderRadius: 8, 
                        border: `1px solid ${colors.creamDark}`,
                        cursor: "pointer",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        transition: "background-color 0.2s ease"
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = colors.creamDark; }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = colors.creamMid; }}
                    >
                      <div>
                        <p style={{ fontFamily: fonts.headline, fontSize: 13, fontWeight: 600, color: colors.forestGreen, margin: "0 0 4px" }}>{p.title}</p>
                        <p style={{ fontFamily: fonts.body, fontSize: 11, color: colors.forestGreen, opacity: 0.7, margin: 0 }}>{p.category || "General"} • {new Date(p.created_at).toLocaleDateString()}</p>
                      </div>
                      <Icon name="arrow_forward" size={16} style={{ opacity: 0.5 }} />
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
/*  Types                                                              */
/* ------------------------------------------------------------------ */
type FilterTab = "all" | "contributors" | "banned";

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */
export default function UserManagement() {
  const { t, lang } = useLang();
  const isRTL = lang === "AR";

  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [busyId, setBusyId] = useState<number | null>(null);

  // ✅ Modal states
  const [banTarget, setBanTarget] = useState<User | null>(null);
  const [viewTarget, setViewTarget] = useState<User | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoading(true);
      try {
        const res = await adminApi.users.getAll();
        
        // ✅ FIX: Read 'users' array and ensure it's actually an array
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

  const roles = useMemo(() => {
    const set = new Set(users.map((u) => u.role).filter(Boolean));
    return Array.from(set);
  }, [users]);

  const filtered = useMemo(() => {
    let result = [...users];
    if (activeTab === "contributors") result = result.filter((u) => u.allowed_to_contribute);
    if (activeTab === "banned") result = result.filter((u) => u.is_banned);
    if (roleFilter !== "all") result = result.filter((u) => u.role === roleFilter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(
        (u) => u.username?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [users, activeTab, roleFilter, search]);

  const stats = useMemo(
    () => ({
      total: users.length,
      contributors: users.filter((u) => u.allowed_to_contribute).length,
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

  // ✅ Handlers
  const handleToggleContribute = async (user: User) => {
    setBusyId(user.id);
    try {
      await adminApi.users.toggleContribute(user.id);
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, allowed_to_contribute: !u.allowed_to_contribute } : u))
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

  const thStyle: React.CSSProperties = {
    fontFamily: fonts.label,
    fontSize: 11,
    letterSpacing: "0.06em",
    fontWeight: 600,
    color: colors.forestGreen,
    textAlign: isRTL ? "right" : "left",
    padding: "12px 14px",
    borderBottom: `1px solid ${colors.forestGreen}`,
    textTransform: "uppercase",
    opacity: 0.8,
  };

  const tdStyle: React.CSSProperties = {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.forestGreen,
    padding: "14px",
    borderBottom: `1px solid ${colors.creamDark}`,
    textAlign: isRTL ? "right" : "left",
  };

  const tabs: { key: FilterTab; icon: string; label: string; count: number }[] = [
    { key: "all", icon: "group", label: "All Users", count: stats.total },
    { key: "contributors", icon: "how_to_reg", label: "Contributors", count: stats.contributors },
    { key: "banned", icon: "block", label: "Banned", count: stats.banned },
  ];

  const statItems = [
    { icon: "group", label: "Total Users", value: stats.total.toString(), delta: "All registered accounts" },
    { icon: "how_to_reg", label: "Contributors", value: stats.contributors.toString(), delta: "Allowed to contribute" },
    { icon: "block", label: "Banned Users", value: stats.banned.toString(), delta: "Restricted accounts", isOverdue: true },
    { icon: "shield_person", label: "Admins", value: stats.admins.toString(), delta: "Administrator role" },
  ];

  if (isLoading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: colors.creamLight, color: colors.forestGreen }}>
        <Icon name="hourglass_empty" size={32} />
      </div>
    );
  }

  return (
    <div dir={isRTL ? "rtl" : "ltr"} style={{ fontFamily: fonts.body, color: colors.forestGreen, backgroundColor: colors.creamLight, minHeight: "100vh", padding: 24 }}>
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>

        {/* ─ Page Header ── */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18, flexWrap: "wrap", gap: 12 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <span style={{ fontFamily: fonts.label, fontSize: 11, letterSpacing: "0.08em", color: colors.forestGreen, opacity: 0.7 }}>
                  ADMIN / USER MANAGEMENT
                </span>
              </div>
              <h1 style={{ fontFamily: fonts.headline, fontSize: 28, fontWeight: 700, color: colors.forestGreen, margin: 0, lineHeight: 1.1 }}>
                {t("userManagement.title") || "User Management"}
              </h1>
              <p style={{ fontFamily: fonts.body, fontSize: 13, color: colors.forestGreen, opacity: 0.75, margin: "6px 0 0" }}>
                {t("userManagement.subtitle") || "View every account, manage contributor access, and handle bans in one place."}
              </p>
            </div>
          </div>

          {/* ── Filter Tabs + Search Bar ── */}
          <div style={{ ...cardStyle, padding: 12, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              {tabs.map((tab) => {
                const isActive = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "7px 12px",
                      borderRadius: 8,
                      border: `1px solid ${colors.forestGreen}`,
                      backgroundColor: isActive ? colors.forestGreen : "transparent",
                      color: isActive ? colors.creamLight : colors.forestGreen,
                      fontFamily: fonts.body,
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    <Icon name={tab.icon} size={15} filled={isActive} />
                    {tab.label}
                    <span
                      style={{
                        fontFamily: fonts.label,
                        fontSize: 10,
                        padding: "1px 6px",
                        borderRadius: 9999,
                        backgroundColor: isActive ? colors.creamLight : colors.creamMid,
                        color: colors.forestGreen,
                      }}
                    >
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 10px", backgroundColor: colors.creamMid, border: `1px solid ${colors.forestGreen}`, borderRadius: 8 }}>
                <Icon name="search" size={15} />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search name or email"
                  style={{ border: "none", outline: "none", background: "transparent", fontFamily: fonts.body, fontSize: 13, color: colors.forestGreen, width: 170 }}
                />
              </div>

              {roles.length > 0 && (
                <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 10px", backgroundColor: colors.creamMid, border: `1px solid ${colors.forestGreen}`, borderRadius: 8, cursor: "pointer" }}>
                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    style={{ border: "none", outline: "none", background: "transparent", fontFamily: fonts.body, fontSize: 13, color: colors.forestGreen, cursor: "pointer", minWidth: 110 }}
                  >
                    <option value="all">All Roles</option>
                    {roles.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
              )}

              {hasActiveFilters && (
                <button onClick={clearFilters} style={{ display: "flex", alignItems: "center", gap: 4, padding: "6px 10px", backgroundColor: "transparent", border: `1px solid ${colors.red}`, borderRadius: 8, fontFamily: fonts.body, fontSize: 12, fontWeight: 500, color: colors.red, cursor: "pointer" }}>
                  <Icon name="close" size={14} /> Clear
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── Stat Cards ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14, marginBottom: 18 }}>
          {statItems.map((s) => (
            <div key={s.label} style={{ ...cardStyle, padding: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <div style={{ width: 28, height: 28, borderRadius: 6, backgroundColor: colors.creamMid, color: colors.forestGreen, border: `1px solid ${colors.forestGreen}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon name={s.icon} size={16} />
                </div>
              </div>
              <p style={{ fontFamily: fonts.label, fontSize: 11, letterSpacing: "0.05em", color: colors.forestGreen, margin: "0 0 4px", opacity: 0.7 }}>{s.label}</p>
              <p style={{ fontFamily: fonts.headline, fontSize: 24, fontWeight: 700, color: (s as any).isOverdue ? colors.red : colors.forestGreen, margin: "0 0 4px", lineHeight: 1 }}>{s.value}</p>
              <p style={{ fontFamily: fonts.body, fontSize: 11, color: colors.forestGreen, margin: 0, opacity: 0.7 }}>{s.delta}</p>
            </div>
          ))}
        </div>

        {/* ── Table View ── */}
        <section style={{ ...cardStyle, overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead style={{ backgroundColor: colors.creamMid }}>
                <tr>
                  <th style={thStyle}>User</th>
                  <th style={thStyle}>Role</th>
                  <th style={thStyle}>Contributor</th>
                  <th style={thStyle}>Status</th>
                  <th style={{ ...thStyle, textAlign: isRTL ? "left" : "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: 40, textAlign: "center", color: colors.forestGreen, opacity: 0.7 }}>
                      <Icon name="person_search" size={48} />
                      <p style={{ fontFamily: fonts.body, fontSize: 14, marginTop: 12 }}>No users found matching your filters.</p>
                    </td>
                  </tr>
                ) : (
                  filtered.map((u) => {
                    const busy = busyId === u.id;
                    return (
                      <tr
                        key={u.id}
                        style={{ cursor: "default", transition: "background-color 0.15s" }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = colors.creamMid)}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                      >
                        <td style={tdStyle}>
                          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            {/* ✅ UPDATED: Show real profile picture if it exists */}
                            {u.profile_picture ? (
                              <img src={u.profile_picture} alt={u.username} style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover", border: `1px solid ${colors.forestGreen}`, flexShrink: 0 }} />
                            ) : (
                              <Avatar name={u.name || u.username} size={36} />
                            )}
                            <div>
                              <p style={{ margin: 0, fontWeight: 600, fontFamily: fonts.headline, fontSize: 13, color: colors.forestGreen }}>{u.name || u.username}</p>
                              <p style={{ margin: "2px 0 0", fontFamily: fonts.body, fontSize: 12, color: colors.forestGreen, opacity: 0.7 }}>{u.email}</p>
                            </div>
                          </div>
                        </td>
                                                <td style={tdStyle}>
                          {u.contributorBadge || u.allowed_to_contribute ? (
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 12px", borderRadius: 9999, backgroundColor: colors.creamMid, border: `1px solid ${colors.forestGreen}`, color: colors.forestGreen, fontFamily: fonts.label, fontSize: 11, fontWeight: 600 }}>
                              <Icon name="how_to_reg" size={14} filled /> Contributor
                            </span>
                          ) : u.role?.toLowerCase() === "admin" ? (
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 12px", borderRadius: 9999, backgroundColor: colors.amber, border: `1px solid ${colors.amber}`, color: colors.creamLight, fontFamily: fonts.label, fontSize: 11, fontWeight: 700 }}>
                              <Icon name="shield_person" size={14} /> Admin
                            </span>
                          ) : (
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 12px", borderRadius: 9999, backgroundColor: colors.creamMid, border: `1px solid ${colors.forestGreen}`, color: colors.forestGreen, fontFamily: fonts.label, fontSize: 11, fontWeight: 600 }}>
                              User
                            </span>
                          )}
                        </td>
                        <td style={tdStyle}>
                          <button
                            onClick={() => handleToggleContribute(u)}
                            disabled={busy}
                            title={u.allowed_to_contribute ? "Click to revoke contributor access" : "Click to grant contributor access"}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 6,
                              padding: "4px 10px",
                              borderRadius: 9999,
                              border: `1px solid ${u.allowed_to_contribute ? colors.forestGreen : colors.creamDark}`,
                              backgroundColor: u.allowed_to_contribute ? colors.forestGreen : "transparent",
                              color: u.allowed_to_contribute ? colors.creamLight : colors.forestGreen,
                              fontFamily: fonts.body,
                              fontSize: 12,
                              fontWeight: 600,
                              cursor: busy ? "wait" : "pointer",
                              opacity: busy ? 0.6 : 1,
                            }}
                          >
                            <Icon name={u.allowed_to_contribute ? "toggle_on" : "toggle_off"} size={17} filled={u.allowed_to_contribute} />
                            {u.allowed_to_contribute ? "Allowed" : "Not allowed"}
                          </button>
                        </td>
                        <td style={tdStyle}>
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 4,
                              padding: "3px 10px",
                              borderRadius: 9999,
                              backgroundColor: u.is_banned ? "rgba(139, 44, 44, 0.1)" : "rgba(11, 67, 53, 0.08)",
                              border: `1px solid ${u.is_banned ? colors.red : colors.forestGreen}`,
                              color: u.is_banned ? colors.red : colors.forestGreen,
                              fontFamily: fonts.label,
                              fontSize: 11,
                            }}
                          >
                            <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: u.is_banned ? colors.red : colors.forestGreen }} />
                            {u.is_banned ? "Banned" : "Active"}
                          </span>
                        </td>
                        <td style={{ ...tdStyle, textAlign: isRTL ? "left" : "right" }}>
                          <div style={{ display: "flex", justifyContent: isRTL ? "flex-start" : "flex-end", gap: 6 }}>
                            <button
                              onClick={() => setViewTarget(u)}
                              title="View details"
                              style={{ width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "transparent", border: `1px solid ${colors.forestGreen}`, borderRadius: 6, color: colors.forestGreen, cursor: "pointer" }}
                            >
                              <Icon name="visibility" size={18} />
                            </button>

                            {u.is_banned ? (
                              <button
                                onClick={() => handleUnban(u)}
                                disabled={busy}
                                title="Unban user"
                                style={{ width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: colors.forestGreen, border: `1px solid ${colors.forestGreen}`, borderRadius: 6, color: colors.creamLight, cursor: busy ? "wait" : "pointer", opacity: busy ? 0.6 : 1 }}
                              >
                                <Icon name="lock_open" size={18} filled />
                              </button>
                            ) : (
                              <button
                                onClick={() => setBanTarget(u)}
                                disabled={busy}
                                title="Ban user"
                                style={{ width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "transparent", border: `1px solid ${colors.red}`, borderRadius: 6, color: colors.red, cursor: busy ? "wait" : "pointer", opacity: busy ? 0.6 : 1 }}
                              >
                                <Icon name="block" size={18} />
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

          {/* ── Pagination ─ */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 14px", borderTop: `1px solid ${colors.forestGreen}`, backgroundColor: colors.creamMid }}>
            <span style={{ fontFamily: fonts.label, fontSize: 11, color: colors.forestGreen, opacity: 0.8 }}>
              Showing 1-{Math.min(10, filtered.length)} of {filtered.length}
            </span>
            <div style={{ display: "flex", gap: 4 }}>
              <button style={{ padding: "4px 10px", border: `1px solid ${colors.forestGreen}`, borderRadius: 6, backgroundColor: colors.creamLight, color: colors.forestGreen, fontFamily: fonts.body, fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center" }}>
                <Icon name="chevron_left" size={16} />
              </button>
              <button style={{ padding: "4px 10px", border: `1px solid ${colors.forestGreen}`, borderRadius: 6, backgroundColor: colors.forestGreen, color: colors.creamLight, fontFamily: fonts.body, fontSize: 12, cursor: "pointer" }}>1</button>
              {filtered.length > 10 && <button style={{ padding: "4px 10px", border: `1px solid ${colors.forestGreen}`, borderRadius: 6, backgroundColor: colors.creamLight, color: colors.forestGreen, fontFamily: fonts.body, fontSize: 12, cursor: "pointer" }}>2</button>}
              <button style={{ padding: "4px 10px", border: `1px solid ${colors.forestGreen}`, borderRadius: 6, backgroundColor: colors.creamLight, color: colors.forestGreen, fontFamily: fonts.body, fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center" }}>
                <Icon name="chevron_right" size={16} />
              </button>
            </div>
          </div>
        </section>

        {/* ── Ban Confirmation Modal ── */}
        {banTarget && (
          <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(11, 67, 53, 0.5)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }} onClick={() => setBanTarget(null)}>
            <div style={{ ...cardStyle, backgroundColor: colors.creamLight, width: 440, maxWidth: "90vw", padding: 32, boxShadow: "0 20px 60px rgba(0,0,0,0.18)" }} onClick={(e) => e.stopPropagation()}>
              <div style={{ width: 56, height: 56, borderRadius: "50%", backgroundColor: colors.red, color: colors.creamLight, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20, border: `1px solid ${colors.red}` }}>
                <Icon name="block" size={28} filled />
              </div>
              <h2 style={{ fontFamily: fonts.headline, fontSize: 20, fontWeight: 700, color: colors.forestGreen, marginBottom: 12 }}>Ban User</h2>
              <p style={{ fontFamily: fonts.body, fontSize: 14, color: colors.forestGreen, lineHeight: 1.6, marginBottom: 28, opacity: 0.8 }}>
                Are you sure you want to ban <b>{banTarget.username}</b> ({banTarget.email})? They will lose access to their account.
                <br /><b style={{ color: colors.red }}>You can unban them later from this page.</b>
              </p>
              <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
                <button onClick={() => setBanTarget(null)} style={{ padding: "10px 24px", borderRadius: 8, cursor: "pointer", border: `1px solid ${colors.forestGreen}`, backgroundColor: colors.creamLight, fontFamily: fonts.body, fontSize: 13, fontWeight: 600, color: colors.forestGreen }}>Cancel</button>
                <button onClick={confirmBan} style={{ padding: "10px 24px", borderRadius: 8, cursor: "pointer", border: `1px solid ${colors.red}`, backgroundColor: colors.red, fontFamily: fonts.body, fontSize: 13, fontWeight: 700, color: colors.creamLight }}>Confirm Ban</button>
              </div>
            </div>
          </div>
        )}

        {/* ── Comprehensive View Details Modal ── */}
        {viewTarget && (
          <UserDetailsModal user={viewTarget} onClose={() => setViewTarget(null)} />
        )}

      </div>
    </div>
  );
}