import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { adminApi } from "../../api/adminApi";
import { useLang } from "../../context/LanguageContext";

/* ------------------------------------------------------------------ */
/*  Design Tokens                                                      */
/* ------------------------------------------------------------------ */
const colors = {
  creamLight: "#fcfaf5", creamMid: "#f6efdc", creamDark: "#e5d5a8",
  forestGreen: "#0b4335", amber: "#b8860b", red: "#8b2c2c", blue: "#4a7fcb",
};
const fonts = { headline: "'Hanken Grotesk', sans-serif", body: "'Inter', sans-serif", label: "'JetBrains Mono', monospace" };
const cardStyle: React.CSSProperties = { backgroundColor: colors.creamLight, borderRadius: 12, boxShadow: "0px 4px 20px rgba(11, 67, 53, 0.08)", border: `1px solid ${colors.forestGreen}` };

// ✅ Same avatar palette logic as ForumPost, so a given user gets the same color everywhere
const colorPalette = [colors.forestGreen, colors.amber, colors.red, "#5a7a6f", "#d4b87a", "#8b5a2b"];
const getUserColor = (id: number | undefined) => colorPalette[(id || 0) % colorPalette.length];
const getCategoryColor = (id: number) => colorPalette[(id - 1) % colorPalette.length];

const Icon: React.FC<{ name: string; size?: number; filled?: boolean }> = ({ name, size = 18, filled = false }) => (
  <span className="material-symbols-outlined" style={{ fontSize: size, lineHeight: 1, fontVariationSettings: `'FILL' ${filled ? 1 : 0}, 'wght' 400, 'GRAD' 0, 'opsz' 24` }}>{name}</span>
);

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffDays < 1) return "Today";
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

const getInitials = (name: string) => {
  if (!name) return "?";
  const parts = name.trim().split(" ");
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return parts[0][0].toUpperCase();
};

// ✅ Avatar — shows the real profile_picture when the user has one, otherwise
// falls back to colored initials (same logic as ForumPost's UserAvatar).
const Avatar: React.FC<{ name: string; id?: number; size?: number; profilePicture?: string | null }> = ({ name, id, size = 36, profilePicture }) => (
  <div
    style={{
      width: size, height: size, borderRadius: "50%", flexShrink: 0,
      border: `2px solid ${colors.creamDark}`,
      overflow: "hidden",
    }}
  >
    {profilePicture ? (
      <img
        src={profilePicture}
        alt={name || "User"}
        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
      />
    ) : (
      <div
        style={{
          width: "100%", height: "100%",
          backgroundColor: getUserColor(id),
          display: "flex", alignItems: "center", justifyContent: "center",
          color: colors.creamLight, fontWeight: 700, fontFamily: fonts.headline,
          fontSize: size * 0.38,
        }}
      >
        {getInitials(name)}
      </div>
    )}
  </div>
);

// ✅ Small icon-only action button used on comment rows (hide/restore/delete)
const MiniActionBtn: React.FC<{ icon: string; title: string; color: string; onClick: () => void; filled?: boolean }> = ({ icon, title, color, onClick, filled }) => (
  <button
    onClick={onClick}
    title={title}
    style={{
      width: 26, height: 26, display: "flex", alignItems: "center", justifyContent: "center",
      borderRadius: 6, border: `1px solid ${color}`, backgroundColor: "transparent", color,
      cursor: "pointer", flexShrink: 0,
    }}
  >
    <Icon name={icon} size={14} filled={filled} />
  </button>
);

export default function AdminDiscussions() {
  const navigate = useNavigate();
  const { lang } = useLang();
  const isRTL = lang === "AR";

  const [posts, setPosts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all"); // 'all', 'active', 'hidden'
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const [viewingPostId, setViewingPostId] = useState<number | null>(null);
  const [modalData, setModalData] = useState<any>(null);
  const [isModalLoading, setIsModalLoading] = useState(false);
  const [revealedComments, setRevealedComments] = useState<Set<number>>(new Set()); // hidden comments the admin chose to peek at

  useEffect(() => {
    fetchData();
  }, [filterStatus, selectedCategory]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [postsRes, catsRes] = await Promise.all([
        adminApi.forum.getAdminPosts({
          status: filterStatus,
          category_id: selectedCategory !== "all" ? selectedCategory : undefined,
          search: searchQuery || undefined
        }),
        adminApi.forum.getCategories()
      ]);
      if (postsRes.data?.success) setPosts(postsRes.data.data);
      if (catsRes.data?.success) setCategories(catsRes.data.data);
    } catch (error) {
      console.error("Failed to fetch discussions:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ re-fetch just the modal content (used after any comment/post moderation action while the modal is open)
  const refreshModal = async (postId: number) => {
    setIsModalLoading(true);
    try {
      const res = await adminApi.forum.getPostDetails(postId);
      if (res.data?.success) setModalData(res.data.data);
    } catch (error) {
      console.error("Failed to refresh post details:", error);
    } finally {
      setIsModalLoading(false);
    }
  };

  const handleHide = async (id: number) => {
    if (!window.confirm("Hide this post from the public site?")) return;
    try {
      await adminApi.forum.hidePost(id);
      fetchData();
      if (viewingPostId === id) refreshModal(id);
    } catch (error) { alert("Failed to hide post"); }
  };

  // ✅ new — undo a hide
  const handleRestore = async (id: number) => {
    try {
      await adminApi.forum.restorePost(id);
      fetchData();
      if (viewingPostId === id) refreshModal(id);
    } catch (error) { alert("Failed to restore post"); }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("PERMANENTLY delete this post and all its comments? This cannot be undone.")) return;
    try {
      await adminApi.forum.deletePostPermanently(id);
      fetchData();
      if (viewingPostId === id) setViewingPostId(null);
    } catch (error) { alert("Failed to delete post"); }
  };

  const handleBanUser = async (userId: number, username: string) => {
    if (!window.confirm(`Ban user ${username}?`)) return;
    try {
      await adminApi.users.ban(userId);
      alert(`User ${username} has been banned.`);
      fetchData();
    } catch (error) { alert("Failed to ban user"); }
  };

  // ✅ new — per-comment moderation
  const handleHideComment = async (commentId: number) => {
    if (!viewingPostId) return;
    try {
      await adminApi.forum.hideComment(commentId);
      refreshModal(viewingPostId);
    } catch (error) { alert("Failed to hide comment"); }
  };

  const handleRestoreComment = async (commentId: number) => {
    if (!viewingPostId) return;
    try {
      await adminApi.forum.restoreComment(commentId);
      refreshModal(viewingPostId);
    } catch (error) { alert("Failed to restore comment"); }
  };

  const handleDeleteComment = async (commentId: number) => {
    if (!viewingPostId) return;
    if (!window.confirm("PERMANENTLY delete this comment and all its replies? This cannot be undone.")) return;
    try {
      await adminApi.forum.deleteCommentPermanently(commentId);
      refreshModal(viewingPostId);
      fetchData(); // comment_count on the table changed
    } catch (error) { alert("Failed to delete comment"); }
  };

  useEffect(() => {
    if (!viewingPostId) return;
    setRevealedComments(new Set());
    refreshModal(viewingPostId);
  }, [viewingPostId]);

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
    opacity: 0.8
  };

  const tdStyle: React.CSSProperties = {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.forestGreen,
    padding: "14px",
    borderBottom: `1px solid ${colors.creamDark}`,
    textAlign: isRTL ? "right" : "left",
    verticalAlign: "top"
  };

  if (isLoading) return <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name="hourglass_empty" size={40} /></div>;

  return (
    <div style={{ padding: 24, maxWidth: 1400, margin: "0 auto", fontFamily: fonts.body, color: colors.forestGreen }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: fonts.headline, fontSize: 28, fontWeight: 700, margin: 0 }}>Discussions Management</h1>
          <p style={{ fontFamily: fonts.body, fontSize: 14, color: colors.forestGreen, opacity: 0.7, margin: "4px 0 0" }}>Moderate community posts.</p>
        </div>
        <button onClick={() => navigate("/admin/discussions/categories")} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 20px", backgroundColor: colors.creamMid, color: colors.forestGreen, border: `1px solid ${colors.forestGreen}`, borderRadius: 8, fontFamily: fonts.body, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
          <Icon name="category" size={18} /> Manage Categories
        </button>
      </div>

      {/* Filters */}
      <div style={{ ...cardStyle, padding: 16, marginBottom: 24, display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
        <input
          type="text"
          placeholder="Search by title or content..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && fetchData()}
          style={{ flex: 1, minWidth: 200, padding: "8px 12px", borderRadius: 6, border: `1px solid ${colors.creamDark}`, fontFamily: fonts.body, fontSize: 13, outline: "none" }}
        />
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          style={{ padding: "8px 12px", borderRadius: 6, border: `1px solid ${colors.creamDark}`, fontFamily: fonts.body, fontSize: 13, backgroundColor: colors.creamLight, cursor: "pointer" }}
        >
          <option value="all">All Posts</option>
          <option value="active">Active Only</option>
          <option value="hidden">Hidden Only</option>
        </select>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          style={{ padding: "8px 12px", borderRadius: 6, border: `1px solid ${colors.creamDark}`, fontFamily: fonts.body, fontSize: 13, backgroundColor: colors.creamLight, cursor: "pointer" }}
        >
          <option value="all">All Categories</option>
          {categories.map((c: any) => <option key={c.category_id} value={c.category_id}>{c.name}</option>)}
        </select>
        <button
          onClick={fetchData}
          style={{ padding: "8px 16px", borderRadius: 6, border: "none", backgroundColor: colors.forestGreen, color: colors.creamLight, fontFamily: fonts.body, fontSize: 13, fontWeight: 600, cursor: "pointer" }}
        >
          <Icon name="search" size={16} style={{ verticalAlign: "middle" }} /> Filter
        </button>
      </div>

      {/* Table */}
      <div style={{ ...cardStyle, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead style={{ backgroundColor: colors.creamMid }}>
              <tr>
                <th style={thStyle}>Post Details</th>
                <th style={thStyle}>Author</th>
                <th style={thStyle}>Category</th>
                <th style={{ ...thStyle, textAlign: "center" }}>Reports</th>
                <th style={{ ...thStyle, textAlign: isRTL ? "left" : "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {posts.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ ...tdStyle, textAlign: "center", padding: 40, opacity: 0.6 }}>
                    No discussions found matching your filters.
                  </td>
                </tr>
              ) : (
                posts.map((post: any) => (
                  <tr key={post.post_id} style={{ backgroundColor: post.status === "hidden" ? "rgba(139, 44, 44, 0.04)" : "transparent" }}>
                    <td style={tdStyle}>
                      <p style={{ fontFamily: fonts.headline, fontSize: 14, fontWeight: 600, margin: "0 0 4px", color: post.status === "hidden" ? colors.red : colors.forestGreen }}>
                        {post.title}
                      </p>
                      <p style={{ fontSize: 12, opacity: 0.7, margin: 0 }}>
                        {formatDate(post.created_at)}
                        {typeof post.comment_count === "number" && ` · ${post.comment_count} comments`}
                      </p>
                      {post.status === "hidden" && (
                        <span style={{ display: "inline-block", marginTop: 6, padding: "2px 8px", borderRadius: 4, fontSize: 10, fontFamily: fonts.label, fontWeight: 700, backgroundColor: colors.red, color: colors.creamLight }}>
                          HIDDEN
                        </span>
                      )}
                    </td>
                    <td style={tdStyle}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <Avatar name={post.users?.username} id={post.users?.id} profilePicture={post.users?.profile_picture} size={28} />
                        <p style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>{post.users?.username || "Unknown"}</p>
                      </div>
                    </td>
                    <td style={tdStyle}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 10px", borderRadius: 9999, backgroundColor: colors.creamMid, border: `1px solid ${colors.creamDark}`, fontSize: 12 }}>
                        <span style={{ width: 7, height: 7, borderRadius: "50%", backgroundColor: post.forum_categories ? getCategoryColor(post.forum_categories.category_id) : colors.creamDark }} />
                        {post.forum_categories?.name || "Uncategorized"}
                      </span>
                    </td>
                    <td style={{ ...tdStyle, textAlign: "center" }}>
                      {post.report_count > 0 ? (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 9999, backgroundColor: "rgba(139, 44, 44, 0.1)", color: colors.red, fontFamily: fonts.label, fontSize: 12, fontWeight: 700 }}>
                          <Icon name="flag" size={14} filled /> {post.report_count}
                        </span>
                      ) : (
                        <span style={{ opacity: 0.3 }}>0</span>
                      )}
                    </td>
                    <td style={{ ...tdStyle, textAlign: isRTL ? "left" : "right" }}>
                      <div style={{ display: "flex", gap: 6, justifyContent: isRTL ? "flex-start" : "flex-end" }}>
                        <button
                          onClick={() => setViewingPostId(post.post_id)}
                          title="View Details"
                          style={{ width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 6, border: `1px solid ${colors.forestGreen}`, backgroundColor: "transparent", color: colors.forestGreen, cursor: "pointer" }}
                        >
                          <Icon name="visibility" size={18} />
                        </button>
                        {post.status === "active" ? (
                          <button
                            onClick={() => handleHide(post.post_id)}
                            title="Hide Post"
                            style={{ width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 6, border: `1px solid ${colors.amber}`, backgroundColor: "transparent", color: colors.amber, cursor: "pointer" }}
                          >
                            <Icon name="visibility_off" size={18} />
                          </button>
                        ) : (
                          // ✅ new — Restore button, only shown for hidden posts
                          <button
                            onClick={() => handleRestore(post.post_id)}
                            title="Restore Post"
                            style={{ width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 6, border: `1px solid ${colors.forestGreen}`, backgroundColor: "transparent", color: colors.forestGreen, cursor: "pointer" }}
                          >
                            <Icon name="restore" size={18} />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(post.post_id)}
                          title="Delete Permanently"
                          style={{ width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 6, border: `1px solid ${colors.red}`, backgroundColor: "transparent", color: colors.red, cursor: "pointer" }}
                        >
                          <Icon name="delete" size={18} />
                        </button>
                        {!post.users?.is_banned && (
                          <button
                            onClick={() => handleBanUser(post.users.id, post.users.username)}
                            title="Ban User"
                            style={{ width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 6, border: `1px solid ${colors.forestGreen}`, backgroundColor: colors.forestGreen, color: colors.creamLight, cursor: "pointer" }}
                          >
                            <Icon name="block" size={18} filled />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ✅ MODAL — matches ForumPost.tsx's look, now with per-comment moderation actions */}
      {viewingPostId && (
        <div
          style={{ position: "fixed", inset: 0, backgroundColor: "rgba(11, 67, 53, 0.6)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, backdropFilter: "blur(4px)" }}
          onClick={() => setViewingPostId(null)}
        >
          <style>{`
            @import url('https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');
            .admin-comment-card { transition: background-color 0.2s ease; }
            .admin-comment-card:hover { background-color: ${colors.creamMid}; }
          `}</style>
          <div
            style={{ ...cardStyle, backgroundColor: colors.creamLight, width: "100%", maxWidth: 800, maxHeight: "88vh", display: "flex", flexDirection: "column", boxShadow: "0 20px 60px rgba(0,0,0,0.2)", borderRadius: 16, overflow: "hidden" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 24px", borderBottom: `1px solid ${colors.creamDark}`, flexShrink: 0, backgroundColor: colors.creamLight }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: colors.forestGreen, flexShrink: 0 }} />
                <h2 style={{ fontFamily: fonts.headline, fontSize: 19, fontWeight: 700, color: colors.forestGreen, margin: 0 }}>
                  Post Details
                </h2>
              </div>
              <button
                onClick={() => setViewingPostId(null)}
                style={{ width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", background: "none", border: "none", cursor: "pointer", color: colors.forestGreen, borderRadius: 8 }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(11, 67, 53, 0.1)")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
              >
                <Icon name="close" size={22} />
              </button>
            </div>

            {/* Content */}
            <div style={{ flex: 1, overflowY: "auto", padding: 24 }}>
              {isModalLoading ? (
                <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
                  <Icon name="hourglass_empty" size={32} />
                </div>
              ) : modalData ? (
                <>
                  {/* Post block — mirrors ForumPost's header row + body + bottom stat row */}
                  <div style={{ paddingBottom: 20, marginBottom: 20, borderBottom: `1px solid ${colors.creamDark}` }}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 16, flexDirection: isRTL ? "row-reverse" : "row" }}>
                      <Avatar name={modalData.post.users?.username} id={modalData.post.users?.id} profilePicture={modalData.post.users?.profile_picture} size={48} />
                      <div style={{ flex: 1 }}>
                        <p style={{ fontFamily: fonts.headline, fontSize: 15, fontWeight: 700, margin: 0, color: colors.forestGreen }}>
                          {modalData.post.users?.username || "Unknown"}
                        </p>
                        <p style={{ fontFamily: fonts.body, fontSize: 12, opacity: 0.6, margin: "3px 0 0", color: colors.forestGreen }}>
                          Posted on {formatDate(modalData.post.created_at)}
                        </p>
                      </div>
                      {modalData.post.deleted_at && (
                        <span style={{ padding: "3px 10px", borderRadius: 9999, fontSize: 10, fontFamily: fonts.label, fontWeight: 700, backgroundColor: colors.red, color: colors.creamLight, flexShrink: 0 }}>
                          HIDDEN
                        </span>
                      )}
                    </div>

                    <p style={{ fontFamily: fonts.headline, fontSize: 17, fontWeight: 700, margin: "0 0 10px", color: colors.forestGreen }}>
                      {modalData.post.title}
                    </p>

                    <div style={{
                      fontFamily: fonts.body, fontSize: 14, lineHeight: 1.6, color: colors.forestGreen,
                      opacity: 0.85, whiteSpace: "pre-wrap", marginBottom: 16,
                    }}>
                      {modalData.post.content}
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexDirection: isRTL ? "row-reverse" : "row" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 10px", borderRadius: 9999, backgroundColor: colors.creamMid, border: `1px solid ${colors.creamDark}`, fontFamily: fonts.label, fontSize: 11, opacity: 0.8 }}>
                        <span style={{ width: 7, height: 7, borderRadius: "50%", backgroundColor: modalData.post.forum_categories ? getCategoryColor(modalData.post.forum_categories.category_id) : colors.creamDark }} />
                        {modalData.post.forum_categories?.name || "Uncategorized"}
                      </span>
                      <div style={{ display: "flex", gap: 18 }}>
                        <span style={{ display: "flex", alignItems: "center", gap: 5, fontFamily: fonts.body, fontSize: 12, color: colors.forestGreen, opacity: 0.7 }}>
                          <Icon name="thumb_up" size={15} /> {modalData.post.like_count || 0}
                        </span>
                        <span style={{ display: "flex", alignItems: "center", gap: 5, fontFamily: fonts.body, fontSize: 12, color: colors.forestGreen, opacity: 0.7 }}>
                          <Icon name="chat_bubble_outline" size={15} /> {modalData.comments?.length || 0}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Comments — bordered, hoverable cards, each with its own hide/restore/delete */}
                  <div>
                    <h3 style={{
                      fontFamily: fonts.headline, fontSize: 16, fontWeight: 700, color: colors.forestGreen,
                      margin: "0 0 14px", display: "flex", alignItems: "center", gap: 6,
                    }}>
                      Comments ({modalData.comments?.length || 0})
                    </h3>

                    {modalData.comments?.length === 0 ? (
                      <div style={{ textAlign: "center", padding: "32px 0" }}>
                        <Icon name="chat_bubble_outline" size={40} />
                        <p style={{ fontFamily: fonts.body, fontSize: 13, opacity: 0.6, marginTop: 10 }}>No comments yet.</p>
                      </div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        {modalData.comments.map((comment: any) => {
                          const isHidden = comment.status === "hidden" || !!comment.deleted_at;
                          const isReply = !!comment.parent_comment_id;
                          return (
                            <div
                              key={comment.comment_id}
                              className="admin-comment-card"
                              style={{
                                display: "flex", gap: 12, padding: 14, borderRadius: 12,
                                border: `1px solid ${isHidden ? colors.red : colors.creamDark}`,
                                backgroundColor: isHidden ? "rgba(139, 44, 44, 0.04)" : colors.creamLight,
                                flexDirection: isRTL ? "row-reverse" : "row",
                                marginLeft: !isRTL && isReply ? 28 : undefined,
                                marginRight: isRTL && isReply ? 28 : undefined,
                              }}
                            >
                              <Avatar name={comment.users?.username} id={comment.users?.id} profilePicture={comment.users?.profile_picture} size={36} />
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexDirection: isRTL ? "row-reverse" : "row", flexWrap: "wrap" }}>
                                  {isReply && <Icon name="reply" size={13} />}
                                  <span style={{ fontFamily: fonts.headline, fontSize: 13, fontWeight: 700, color: colors.forestGreen }}>
                                    {comment.users?.username || "Unknown"}
                                  </span>
                                  <span style={{ opacity: 0.3, color: colors.forestGreen }}>•</span>
                                  <span style={{ fontFamily: fonts.body, fontSize: 11, opacity: 0.6, color: colors.forestGreen }}>
                                    {formatDate(comment.created_at)}
                                  </span>
                                  {isHidden && (
                                    <span style={{ padding: "1px 8px", borderRadius: 9999, fontSize: 9, fontFamily: fonts.label, fontWeight: 700, backgroundColor: colors.red, color: colors.creamLight }}>
                                      HIDDEN
                                    </span>
                                  )}
                                  {comment.report_count > 0 && (
                                    <span style={{ display: "inline-flex", alignItems: "center", gap: 3, padding: "1px 8px", borderRadius: 9999, backgroundColor: "rgba(139, 44, 44, 0.1)", color: colors.red, fontFamily: fonts.label, fontSize: 9, fontWeight: 700 }}>
                                      <Icon name="flag" size={11} filled /> {comment.report_count}
                                    </span>
                                  )}
                                </div>
                                <p style={{ fontFamily: fonts.body, fontSize: 13, lineHeight: 1.55, color: colors.forestGreen, opacity: isHidden && !revealedComments.has(comment.comment_id) ? 0.55 : 0.85, margin: 0, whiteSpace: "pre-wrap", fontStyle: isHidden && !revealedComments.has(comment.comment_id) ? "italic" : "normal" }}>
                                  {isHidden && !revealedComments.has(comment.comment_id) ? (
                                    <>
                                      This comment has been hidden by a moderator.{" "}
                                      <span
                                        onClick={() => setRevealedComments((prev) => new Set(prev).add(comment.comment_id))}
                                        style={{ textDecoration: "underline", cursor: "pointer", fontStyle: "normal", opacity: 1 }}
                                      >
                                        View original
                                      </span>
                                    </>
                                  ) : (
                                    comment.content
                                  )}
                                </p>
                              </div>

                              {/* ✅ per-comment moderation actions — restore is ALWAYS shown when isHidden is true */}
                              <div style={{ display: "flex", gap: 6, flexShrink: 0, alignItems: "flex-start" }}>
                                {isHidden ? (
                                  <MiniActionBtn icon="restore" title="Restore comment" color={colors.forestGreen} onClick={() => handleRestoreComment(comment.comment_id)} />
                                ) : (
                                  <MiniActionBtn icon="visibility_off" title="Hide comment" color={colors.amber} onClick={() => handleHideComment(comment.comment_id)} />
                                )}
                                <MiniActionBtn icon="delete" title="Delete permanently" color={colors.red} onClick={() => handleDeleteComment(comment.comment_id)} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <p style={{ textAlign: "center", color: colors.red }}>Failed to load post details.</p>
              )}
            </div>

            {/* Footer - Admin Actions */}
            {modalData && (
              <div style={{
                padding: "16px 24px", borderTop: `1px solid ${colors.creamDark}`, display: "flex",
                justifyContent: "flex-end", gap: 10, backgroundColor: colors.creamMid, flexShrink: 0,
              }}>
                <button
                  onClick={() => setViewingPostId(null)}
                  style={{ padding: "9px 18px", borderRadius: 8, border: `1px solid ${colors.forestGreen}`, backgroundColor: "transparent", color: colors.forestGreen, fontFamily: fonts.headline, fontSize: 12, fontWeight: 700, letterSpacing: "0.03em", cursor: "pointer" }}
                >
                  Close
                </button>
                <button
                  onClick={() => handleBanUser(modalData.post.users.id, modalData.post.users.username)}
                  style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "9px 18px", borderRadius: 8, border: `1px solid ${colors.red}`, backgroundColor: colors.red, color: colors.creamLight, fontFamily: fonts.headline, fontSize: 12, fontWeight: 700, letterSpacing: "0.03em", cursor: "pointer" }}
                >
                  <Icon name="block" size={15} filled /> Ban User
                </button>
                {modalData.post.deleted_at ? (
                  // ✅ new — Restore button in the footer for hidden posts
                  <button
                    onClick={() => handleRestore(modalData.post.post_id)}
                    style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "9px 18px", borderRadius: 8, border: `1px solid ${colors.forestGreen}`, backgroundColor: "transparent", color: colors.forestGreen, fontFamily: fonts.headline, fontSize: 12, fontWeight: 700, letterSpacing: "0.03em", cursor: "pointer" }}
                  >
                    <Icon name="restore" size={15} /> Restore
                  </button>
                ) : (
                  <button
                    onClick={() => handleHide(modalData.post.post_id)}
                    style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "9px 18px", borderRadius: 8, border: `1px solid ${colors.amber}`, backgroundColor: "transparent", color: colors.amber, fontFamily: fonts.headline, fontSize: 12, fontWeight: 700, letterSpacing: "0.03em", cursor: "pointer" }}
                  >
                    <Icon name="visibility_off" size={15} /> Hide
                  </button>
                )}
                <button
                  onClick={() => handleDelete(modalData.post.post_id)}
                  style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "9px 18px", borderRadius: 8, border: `1px solid ${colors.red}`, backgroundColor: "transparent", color: colors.red, fontFamily: fonts.headline, fontSize: 12, fontWeight: 700, letterSpacing: "0.03em", cursor: "pointer" }}
                >
                  <Icon name="delete" size={15} /> Delete
                </button>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}