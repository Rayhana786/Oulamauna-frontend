import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { adminApi } from "../../api/adminApi";
import { useLang } from "../../context/LanguageContext";

export default function AdminDiscussions() {
  const navigate = useNavigate();
  const location = useLocation();
  const { lang, t, dbLanguages } = useLang();
  const isRTL = lang === "AR";

  // ✅ Helper to get translated category name, falling back to default name
  const getCategoryName = (category: any) => {
    if (!category) return t("admin.discussions.uncategorized") || "Uncategorized";
    
    let translations = category.translations;
    if (typeof translations === 'string') {
      try { translations = JSON.parse(translations); } catch (e) { translations = {}; }
    }
    
    const currentLang = lang.toLowerCase();
    // 1. Current Lang -> 2. English fallback -> 3. Proper default name -> 4. Uncategorized fallback
    return translations?.[currentLang] || translations?.['en'] || category.name || (t("admin.discussions.uncategorized") || "Uncategorized");
  };

  const [posts, setPosts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const [viewingPostId, setViewingPostId] = useState<number | null>(null);
  const [modalData, setModalData] = useState<any>(null);
  const [isModalLoading, setIsModalLoading] = useState(false);
  const [revealedComments, setRevealedComments] = useState<Set<number>>(new Set());

  // ✅ Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const postIdParam = queryParams.get("postId");
    if (postIdParam) {
      const postId = parseInt(postIdParam, 10);
      if (!isNaN(postId)) setViewingPostId(postId);
    }
  }, [location.search]);

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

  const handleCloseModal = () => {
    setViewingPostId(null);
    navigate("/admin/discussions", { replace: true });
  };

  const handleHide = async (id: number) => {
    if (!window.confirm(t("admin.discussions.confirm.hide") || "Hide this post from the public site?")) return;
    try {
      await adminApi.forum.hidePost(id);
      fetchData();
      if (viewingPostId === id) refreshModal(id);
    } catch (error) { alert(t("admin.discussions.errors.hideFailed") || "Failed to hide post"); }
  };

  const handleRestore = async (id: number) => {
    try {
      await adminApi.forum.restorePost(id);
      fetchData();
      if (viewingPostId === id) refreshModal(id);
    } catch (error) { alert(t("admin.discussions.errors.restoreFailed") || "Failed to restore post"); }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm(t("admin.discussions.confirm.deletePermanent") || "PERMANENTLY delete this post and all its comments? This cannot be undone.")) return;
    try {
      await adminApi.forum.deletePostPermanently(id);
      fetchData();
      if (viewingPostId === id) handleCloseModal();
    } catch (error) { alert(t("admin.discussions.errors.deleteFailed") || "Failed to delete post"); }
  };

  const handleBanUser = async (userId: number, username: string) => {
    if (!window.confirm((t("admin.discussions.confirm.banUser") || "Ban user {username}?").replace("{username}", username))) return;
    try {
      await adminApi.users.ban(userId);
      alert((t("admin.discussions.success.userBanned") || "User {username} has been banned.").replace("{username}", username));
      fetchData();
    } catch (error) { alert(t("admin.discussions.errors.banFailed") || "Failed to ban user"); }
  };

  const handleHideComment = async (commentId: number) => {
    if (!viewingPostId) return;
    try {
      await adminApi.forum.hideComment(commentId);
      refreshModal(viewingPostId);
    } catch (error) { alert(t("admin.discussions.errors.hideCommentFailed") || "Failed to hide comment"); }
  };

  const handleRestoreComment = async (commentId: number) => {
    if (!viewingPostId) return;
    try {
      await adminApi.forum.restoreComment(commentId);
      refreshModal(viewingPostId);
    } catch (error) { alert(t("admin.discussions.errors.restoreCommentFailed") || "Failed to restore comment"); }
  };

  const handleDeleteComment = async (commentId: number) => {
    if (!viewingPostId) return;
    if (!window.confirm(t("admin.discussions.confirm.deleteCommentPermanent") || "PERMANENTLY delete this comment and all its replies? This cannot be undone.")) return;
    try {
      await adminApi.forum.deleteCommentPermanently(commentId);
      refreshModal(viewingPostId);
      fetchData();
    } catch (error) { alert(t("admin.discussions.errors.deleteCommentFailed") || "Failed to delete comment"); }
  };

  useEffect(() => {
    if (!viewingPostId) return;
    setRevealedComments(new Set());
    refreshModal(viewingPostId);
  }, [viewingPostId]);

  // ✅ Pagination Logic
  const totalPages = Math.ceil(posts.length / ITEMS_PER_PAGE);
  const paginatedPosts = posts.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffDays < 1) return t("admin.discussions.time.today") || "Today";
    if (diffDays < 7) return `${diffDays} ${t("admin.discussions.time.daysAgo") || "days ago"}`;
    return date.toLocaleDateString(lang === "AR" ? "ar-SA" : lang === "FR" ? "fr-FR" : "en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const getInitials = (name: string) => {
    if (!name) return "?";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return parts[0][0].toUpperCase();
  };

  const colorPalette = ["#0b4335", "#b8860b", "#8b2c2c", "#5a7a6f", "#d4b87a", "#8b5a2b"];
  const getUserColor = (id: number | undefined) => colorPalette[(id || 0) % colorPalette.length];
  const getCategoryColor = (id: number) => colorPalette[(id - 1) % colorPalette.length];

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#fbf9f4]">
      <span className="material-symbols-outlined text-[40px] text-[#1e4d3a]/40 animate-pulse">hourglass_empty</span>
    </div>
  );

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
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="serif-title text-[27px] md:text-[32px] leading-tight font-semibold text-[#082f27]">{t("admin.discussions.title") || "Discussions Management"}</h1>
            <p className="text-[12px] text-[#1e4d3a]/60 mt-1">{t("admin.discussions.subtitle") || "Moderate community posts."}</p>
          </div>
          <button onClick={() => navigate("/admin/discussions/categories")} className="flex items-center gap-2 px-5 py-2.5 rounded-[8px] bg-[#1e4d3a] text-white border-2 border-[#1e4d3a] text-[12px] font-bold uppercase tracking-wide hover:bg-transparent hover:text-[#1e4d3a] transition-all duration-300 cursor-pointer">
            <span className="material-symbols-outlined text-[18px]">category</span> {t("admin.discussions.manageCategories") || "Manage Categories"}
          </button>
        </div>

        <div className="dashboard-card p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-3">
            <input
              type="text"
              placeholder={t("admin.discussions.searchPlaceholder") || "Search by title or content..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchData()}
              className="flex-1 min-w-[200px] bg-[#fbf9f4] border border-[#1e4d3a]/15 rounded-[6px] px-3 py-2 text-[13px] font-medium text-[#1e4d3a] focus:outline-none focus:ring-2 focus:ring-[#1e4d3a]/20"
            />
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="bg-[#fbf9f4] border border-[#1e4d3a]/15 rounded-[6px] px-3 py-2 text-[13px] font-medium text-[#1e4d3a] focus:outline-none focus:ring-2 focus:ring-[#1e4d3a]/20 cursor-pointer">
              <option value="all">{t("admin.discussions.filter.allPosts") || "All Posts"}</option>
              <option value="active">{t("admin.discussions.filter.activeOnly") || "Active Only"}</option>
              <option value="hidden">{t("admin.discussions.filter.hiddenOnly") || "Hidden Only"}</option>
            </select>
            <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="bg-[#fbf9f4] border border-[#1e4d3a]/15 rounded-[6px] px-3 py-2 text-[13px] font-medium text-[#1e4d3a] focus:outline-none focus:ring-2 focus:ring-[#1e4d3a]/20 cursor-pointer">
              <option value="all">{t("admin.discussions.filter.allCategories") || "All Categories"}</option>
              {categories.map((c: any) => <option key={c.category_id} value={c.category_id}>{getCategoryName(c)}</option>)}
            </select>
            <button onClick={fetchData} className="flex items-center gap-2 px-4 py-2 rounded-[6px] bg-[#1e4d3a] text-white text-[12px] font-bold uppercase tracking-wide hover:bg-[#1e4d3a]/90 transition-colors cursor-pointer">
              <span className="material-symbols-outlined text-[16px]">search</span> {t("admin.discussions.filterLabel") || "Filter"}
            </button>
          </div>
        </div>

        <div className="dashboard-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#1e4d3a]/10 bg-[#1e4d3a]/[0.02]">
                  <th className="mono-label text-[9px] uppercase font-bold text-[#1e4d3a]/60 px-5 py-3.5">{t("admin.discussions.table.postDetails") || "Post Details"}</th>
                  <th className="mono-label text-[9px] uppercase font-bold text-[#1e4d3a]/60 px-5 py-3.5">{t("admin.discussions.table.author") || "Author"}</th>
                  <th className="mono-label text-[9px] uppercase font-bold text-[#1e4d3a]/60 px-5 py-3.5">{t("admin.discussions.table.category") || "Category"}</th>
                  <th className="mono-label text-[9px] uppercase font-bold text-[#1e4d3a]/60 px-5 py-3.5 text-center">{t("admin.discussions.table.reports") || "Reports"}</th>
                  <th className="mono-label text-[9px] uppercase font-bold text-[#1e4d3a]/60 px-5 py-3.5 text-right">{t("admin.discussions.table.actions") || "Actions"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e4d3a]/[0.06]">
                {paginatedPosts.length === 0 ? (
                  <tr><td colSpan={5} className="px-5 py-12 text-center text-[12px] text-[#1e4d3a]/50">{t("admin.discussions.noPosts") || "No discussions found matching your filters."}</td></tr>
                ) : (
                  paginatedPosts.map((post: any) => (
                    <tr key={post.post_id} className={`hover:bg-[#1e4d3a]/[0.015] transition-colors ${post.status === "hidden" ? "bg-[#e96d5c]/[0.04]" : ""}`}>
                      <td className="px-5 py-3.5">
                        <p className={`font-['Source_Serif_4'] text-[14px] font-semibold mb-1 ${post.status === "hidden" ? "text-[#e96d5c]" : "text-[#082f27]"}`}>{post.title}</p>
                        <p className="text-[12px] text-[#1e4d3a]/70">{formatDate(post.created_at)}{typeof post.comment_count === "number" && ` · ${post.comment_count} ${t("admin.discussions.comments") || "comments"}`}</p>
                        {post.status === "hidden" && <span className="inline-block mt-1.5 px-2 py-0.5 rounded-[4px] mono-label text-[10px] font-bold bg-[#e96d5c] text-white">{t("admin.discussions.status.hidden") || "HIDDEN"}</span>}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full overflow-hidden border-2 border-[#1e4d3a]/10 flex-shrink-0" style={{ backgroundColor: getUserColor(post.users?.id) }}>
                            {post.users?.profile_picture ? (
                              <img src={post.users.profile_picture} alt={post.users?.username} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-white font-['Source_Serif_4'] font-bold text-[10px]">
                                {getInitials(post.users?.username || "")}
                              </div>
                            )}
                          </div>
                          <span className="text-[13px] font-semibold text-[#1e4d3a]">{post.users?.username || t("common.unknown") || "Unknown"}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#1e4d3a]/5 border border-[#1e4d3a]/10 text-[12px] font-medium text-[#1e4d3a]">
                          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: post.forum_categories ? getCategoryColor(post.forum_categories.category_id) : "#e5d5a8" }} />
                          {getCategoryName(post.forum_categories)}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        {post.report_count > 0 ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#e96d5c]/10 text-[#e96d5c] mono-label text-[11px] font-bold">
                            <span className="material-symbols-outlined text-[13px]" style={{ fontVariationSettings: "'FILL' 1" }}>flag</span> {post.report_count}
                          </span>
                        ) : (
                          <span className="text-[#1e4d3a]/30">0</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => setViewingPostId(post.post_id)} title={t("admin.discussions.actions.viewDetails") || "View Details"} className="w-8 h-8 flex items-center justify-center rounded-[6px] border border-[#1e4d3a]/20 text-[#1e4d3a] hover:bg-[#1e4d3a] hover:text-white transition-colors cursor-pointer">
                            <span className="material-symbols-outlined text-[18px]">visibility</span>
                          </button>
                          {post.status === "active" ? (
                            <button onClick={() => handleHide(post.post_id)} title={t("admin.discussions.actions.hide") || "Hide Post"} className="w-8 h-8 flex items-center justify-center rounded-[6px] border border-[#C9A84C] text-[#C9A84C] hover:bg-[#C9A84C] hover:text-white transition-colors cursor-pointer">
                              <span className="material-symbols-outlined text-[18px]">visibility_off</span>
                            </button>
                          ) : (
                            <button onClick={() => handleRestore(post.post_id)} title={t("admin.discussions.actions.restore") || "Restore Post"} className="w-8 h-8 flex items-center justify-center rounded-[6px] border border-[#1e4d3a] text-[#1e4d3a] hover:bg-[#1e4d3a] hover:text-white transition-colors cursor-pointer">
                              <span className="material-symbols-outlined text-[18px]">restore</span>
                            </button>
                          )}
                          <button onClick={() => handleDelete(post.post_id)} title={t("admin.discussions.actions.delete") || "Delete Permanently"} className="w-8 h-8 flex items-center justify-center rounded-[6px] border border-[#e96d5c] text-[#e96d5c] hover:bg-[#e96d5c] hover:text-white transition-colors cursor-pointer">
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                          {!post.users?.is_banned && (
                            <button onClick={() => handleBanUser(post.users.id, post.users.username)} title={t("admin.discussions.actions.banUser") || "Ban User"} className="w-8 h-8 flex items-center justify-center rounded-[6px] bg-[#1e4d3a] border border-[#1e4d3a] text-white hover:bg-[#1e4d3a]/90 transition-colors cursor-pointer">
                              <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>block</span>
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

          {/* ✅ PAGINATION FOOTER */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-5 py-4 border-t border-[#1e4d3a]/10 bg-[#1e4d3a]/[0.01]">
              <div className="text-[11px] text-[#1e4d3a]/60 mono-label">
                {t("admin.common.showing") || "Showing"} {(currentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, posts.length)} {t("admin.common.of") || "of"} {posts.length}
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

        {/* ✅ MODAL */}
        {viewingPostId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#082f27]/40 backdrop-blur-sm" onClick={handleCloseModal}>
            <div className="dashboard-card w-full max-w-3xl max-h-[88vh] flex flex-col shadow-2xl rounded-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center p-5 border-b border-[#1e4d3a]/10 bg-[#fbf9f4] flex-shrink-0">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#1e4d3a]" />
                  <h2 className="serif-title text-[19px] font-semibold text-[#082f27]">{t("admin.discussions.modal.postDetails") || "Post Details"}</h2>
                </div>
                <button onClick={handleCloseModal} className="p-1.5 rounded-full hover:bg-[#1e4d3a]/10 transition-colors cursor-pointer">
                  <span className="material-symbols-outlined text-[22px] text-[#1e4d3a]">close</span>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                {isModalLoading ? (
                  <div className="flex justify-center p-10"><span className="material-symbols-outlined text-[32px] text-[#1e4d3a]/40 animate-pulse">hourglass_empty</span></div>
                ) : modalData ? (
                  <>
                    <div className="pb-5 mb-5 border-b border-[#1e4d3a]/10">
                      <div className={`flex items-start gap-3.5 mb-4 ${isRTL ? "flex-row-reverse" : ""}`}>
                        <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-[#1e4d3a]/10 flex-shrink-0" style={{ backgroundColor: getUserColor(modalData.post.users?.id) }}>
                          {modalData.post.users?.profile_picture ? (
                            <img src={modalData.post.users.profile_picture} alt={modalData.post.users?.username} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-white font-['Source_Serif_4'] font-bold text-[16px]">
                              {getInitials(modalData.post.users?.username || "")}
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-['Source_Serif_4'] text-[15px] font-bold text-[#082f27]">{modalData.post.users?.username || t("common.unknown") || "Unknown"}</p>
                          <p className="text-[12px] text-[#1e4d3a]/60 mt-0.5">{t("admin.discussions.modal.postedOn") || "Posted on"} {formatDate(modalData.post.created_at)}</p>
                        </div>
                        {modalData.post.deleted_at && (
                          <span className="mono-label text-[10px] font-bold px-2.5 py-1 rounded-full bg-[#e96d5c] text-white flex-shrink-0">{t("admin.discussions.status.hidden") || "HIDDEN"}</span>
                        )}
                      </div>
                      <p className="font-['Source_Serif_4'] text-[17px] font-bold text-[#082f27] mb-2.5">{modalData.post.title}</p>
                      <div className="text-[14px] leading-relaxed text-[#1e4d3a]/85 whitespace-pre-wrap mb-4">{modalData.post.content}</div>
                      <div className={`flex justify-between items-center ${isRTL ? "flex-row-reverse" : ""}`}>
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#1e4d3a]/5 border border-[#1e4d3a]/10 mono-label text-[11px] text-[#1e4d3a]/80">
                          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: modalData.post.forum_categories ? getCategoryColor(modalData.post.forum_categories.category_id) : "#e5d5a8" }} />
                          {getCategoryName(modalData.post.forum_categories)}
                        </span>
                        <div className="flex gap-4">
                          <span className="flex items-center gap-1.5 text-[12px] text-[#1e4d3a]/70"><span className="material-symbols-outlined text-[15px]">thumb_up</span> {modalData.post.like_count || 0}</span>
                          <span className="flex items-center gap-1.5 text-[12px] text-[#1e4d3a]/70"><span className="material-symbols-outlined text-[15px]">chat_bubble_outline</span> {modalData.comments?.length || 0}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="serif-title text-[16px] font-bold text-[#082f27] mb-3.5 flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[18px]">chat</span> {t("admin.discussions.modal.comments") || "Comments"} ({modalData.comments?.length || 0})
                      </h3>
                      {modalData.comments?.length === 0 ? (
                        <div className="text-center py-8">
                          <span className="material-symbols-outlined text-[40px] text-[#1e4d3a]/30">chat_bubble_outline</span>
                          <p className="text-[13px] text-[#1e4d3a]/60 mt-2.5">{t("admin.discussions.modal.noComments") || "No comments yet."}</p>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-3">
                          {modalData.comments.map((comment: any) => {
                            const isHidden = comment.status === "hidden" || !!comment.deleted_at;
                            const isReply = !!comment.parent_comment_id;
                            return (
                              <div key={comment.comment_id} className={`flex gap-3 p-3.5 rounded-xl border transition-colors hover:bg-[#f6efdc] ${isRTL ? "flex-row-reverse" : ""} ${isHidden ? "border-[#e96d5c] bg-[#e96d5c]/[0.04]" : "border-[#1e4d3a]/10 bg-[#fbf9f4]"}`} style={{ marginLeft: !isRTL && isReply ? 28 : undefined, marginRight: isRTL && isReply ? 28 : undefined }}>
                                <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-[#1e4d3a]/10 flex-shrink-0" style={{ backgroundColor: getUserColor(comment.users?.id) }}>
                                  {comment.users?.profile_picture ? (
                                    <img src={comment.users.profile_picture} alt={comment.users?.username} className="w-full h-full object-cover" />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-white font-['Source_Serif_4'] font-bold text-[12px]">
                                      {getInitials(comment.users?.username || "")}
                                    </div>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className={`flex items-center gap-2 mb-1.5 ${isRTL ? "flex-row-reverse" : ""} flex-wrap`}>
                                    {isReply && <span className="material-symbols-outlined text-[13px] text-[#1e4d3a]/60">reply</span>}
                                    <span className="font-['Source_Serif_4'] text-[13px] font-bold text-[#082f27]">{comment.users?.username || t("common.unknown") || "Unknown"}</span>
                                    <span className="text-[#1e4d3a]/30">•</span>
                                    <span className="text-[11px] text-[#1e4d3a]/60">{formatDate(comment.created_at)}</span>
                                    {isHidden && <span className="mono-label text-[9px] font-bold px-2 py-0.5 rounded-full bg-[#e96d5c] text-white">{t("admin.discussions.status.hidden") || "HIDDEN"}</span>}
                                    {comment.report_count > 0 && (
                                      <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-[#e96d5c]/10 text-[#e96d5c] mono-label text-[9px] font-bold">
                                        <span className="material-symbols-outlined text-[11px]" style={{ fontVariationSettings: "'FILL' 1" }}>flag</span> {comment.report_count}
                                      </span>
                                    )}
                                  </div>
                                  <p className={`text-[13px] leading-relaxed whitespace-pre-wrap ${isHidden && !revealedComments.has(comment.comment_id) ? "text-[#1e4d3a]/55 italic" : "text-[#1e4d3a]/85"}`}>
                                    {isHidden && !revealedComments.has(comment.comment_id) ? (
                                      <>{t("admin.discussions.modal.commentHidden") || "This comment has been hidden by a moderator."} <span onClick={() => setRevealedComments((prev) => new Set(prev).add(comment.comment_id))} className="underline cursor-pointer not-italic opacity-100">{t("admin.discussions.modal.viewOriginal") || "View original"}</span></>
                                    ) : (comment.content)}
                                  </p>
                                </div>
                                <div className="flex gap-1.5 flex-shrink-0 items-start">
                                  {isHidden ? (
                                    <button onClick={() => handleRestoreComment(comment.comment_id)} title={t("admin.discussions.actions.restoreComment") || "Restore comment"} className="w-6 h-6 flex items-center justify-center rounded-[4px] border border-[#1e4d3a] text-[#1e4d3a] hover:bg-[#1e4d3a] hover:text-white transition-colors cursor-pointer">
                                      <span className="material-symbols-outlined text-[14px]">restore</span>
                                    </button>
                                  ) : (
                                    <button onClick={() => handleHideComment(comment.comment_id)} title={t("admin.discussions.actions.hideComment") || "Hide comment"} className="w-6 h-6 flex items-center justify-center rounded-[4px] border border-[#C9A84C] text-[#C9A84C] hover:bg-[#C9A84C] hover:text-white transition-colors cursor-pointer">
                                      <span className="material-symbols-outlined text-[14px]">visibility_off</span>
                                    </button>
                                  )}
                                  <button onClick={() => handleDeleteComment(comment.comment_id)} title={t("admin.discussions.actions.deleteComment") || "Delete permanently"} className="w-6 h-6 flex items-center justify-center rounded-[4px] border border-[#e96d5c] text-[#e96d5c] hover:bg-[#e96d5c] hover:text-white transition-colors cursor-pointer">
                                    <span className="material-symbols-outlined text-[14px]">delete</span>
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <p className="text-center text-[#e96d5c]">{t("admin.discussions.modal.loadFailed") || "Failed to load post details."}</p>
                )}
              </div>

              {modalData && (
                <div className="p-4 border-t border-[#1e4d3a]/10 flex justify-end gap-2.5 bg-[#f6efdc] flex-shrink-0">
                  <button onClick={handleCloseModal} className="px-4 py-2 rounded-[6px] border border-[#1e4d3a]/20 text-[#1e4d3a] text-[12px] font-bold uppercase tracking-wide hover:bg-[#1e4d3a]/5 transition-colors cursor-pointer">
                    {t("admin.discussions.modal.close") || "Close"}
                  </button>
                  <button onClick={() => handleBanUser(modalData.post.users.id, modalData.post.users.username)} className="flex items-center gap-1.5 px-4 py-2 rounded-[6px] bg-[#e96d5c] border border-[#e96d5c] text-white text-[12px] font-bold uppercase tracking-wide hover:bg-[#e96d5c]/90 transition-colors cursor-pointer">
                    <span className="material-symbols-outlined text-[15px]" style={{ fontVariationSettings: "'FILL' 1" }}>block</span> {t("admin.discussions.actions.banUser") || "Ban User"}
                  </button>
                  {modalData.post.deleted_at ? (
                    <button onClick={() => handleRestore(modalData.post.post_id)} className="flex items-center gap-1.5 px-4 py-2 rounded-[6px] border border-[#1e4d3a] text-[#1e4d3a] text-[12px] font-bold uppercase tracking-wide hover:bg-[#1e4d3a] hover:text-white transition-colors cursor-pointer">
                      <span className="material-symbols-outlined text-[15px]">restore</span> {t("admin.discussions.actions.restore") || "Restore"}
                    </button>
                  ) : (
                    <button onClick={() => handleHide(modalData.post.post_id)} className="flex items-center gap-1.5 px-4 py-2 rounded-[6px] border border-[#C9A84C] text-[#C9A84C] text-[12px] font-bold uppercase tracking-wide hover:bg-[#C9A84C] hover:text-white transition-colors cursor-pointer">
                      <span className="material-symbols-outlined text-[15px]">visibility_off</span> {t("admin.discussions.actions.hide") || "Hide"}
                    </button>
                  )}
                  <button onClick={() => handleDelete(modalData.post.post_id)} className="flex items-center gap-1.5 px-4 py-2 rounded-[6px] border border-[#e96d5c] text-[#e96d5c] text-[12px] font-bold uppercase tracking-wide hover:bg-[#e96d5c] hover:text-white transition-colors cursor-pointer">
                    <span className="material-symbols-outlined text-[15px]">delete</span> {t("admin.discussions.actions.delete") || "Delete"}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}