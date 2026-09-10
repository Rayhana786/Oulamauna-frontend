import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useLang } from "../../context/LanguageContext";
import { useAuth } from "../../context/AuthContext";
import { forumApi, ForumPost, ForumCategory } from "../../api/forumApi";

type Language = "EN" | "AR" | "FR";

const colors = {
  creamLight: "#fcfaf5",
  creamMid: "#f6efdc",
  creamDark: "#e5d5a8",
  forestGreen: "#0b4335",
  amber: "#b8860b",
  red: "#8b2c2c",
};

const colorPalette = [colors.forestGreen, colors.amber, colors.red, "#5a7a6f", "#d4b87a", "#8b5a2b"];
const getCategoryColor = (id: number) => colorPalette[(id - 1) % colorPalette.length];
const getUserColor = (id: number | undefined) => colorPalette[(id || 0) % colorPalette.length];

const getInitials = (name: string | null | undefined) => {
  if (!name) return "?";
  const parts = name.trim().split(" ");
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return parts[0][0].toUpperCase();
};

const UserAvatar: React.FC<{ user: any; size?: "sm" | "md" | "lg" }> = ({ user, size = "md" }) => {
  const displayName = user?.name || user?.username || "Anonymous";
  const initials = getInitials(displayName);
  const bgColor = getUserColor(user?.id);
  
  const sizeClasses = {
    sm: "w-8 h-8 text-[11px]",
    md: "w-10 h-10 md:w-12 md:h-12 text-[14px]",
    lg: "w-12 h-12 md:w-14 md:h-14 text-[16px]",
  };

  const avatarContent = user?.profile_picture ? (
    <img src={user.profile_picture} alt={displayName} className="w-full h-full rounded-full object-cover border-2" style={{ borderColor: colors.creamDark }} />
  ) : (
    <div className="w-full h-full rounded-full border-2 flex items-center justify-center font-bold text-white font-['Hanken_Grotesk']" style={{ backgroundColor: bgColor, borderColor: colors.creamDark }}>
      {initials}
    </div>
  );

  return (
    <Link to={`/profile/${user?.id || '#'}`} className="flex-shrink-0 hover:opacity-80 transition-opacity cursor-pointer" title={`View ${displayName}'s profile`}>
      <div className={sizeClasses[size]}>{avatarContent}</div>
    </Link>
  );
};

interface ForumContent {
  pageTitle: string; searchPlaceholder: string; newPostButton: string; allDiscussions: string;
  categoriesLabel: string; sortRecent: string; sortPopular: string; sortUnanswered: string;
  loadMore: string; noResults: string; composerTitle: string; composerCategoryLabel: string;
  composerCategoryPlaceholder: string; composerTitleLabel: string; composerTitlePlaceholder: string;
  composerContentLabel: string; composerContentPlaceholder: string; composerCancel: string;
  composerPublish: string; comments: string; posts: string; report: string; reportPost: string;
  confirmReport: string; reportReason: string; cancel: string; submit: string;
  deletePost: string; confirmDeletePost: string;
}

const content: Record<Language, ForumContent> = {
  EN: {
    pageTitle: "Discussions", searchPlaceholder: "Search by title, content, or author...", newPostButton: "Start New Discussion",
    allDiscussions: "All Discussions", categoriesLabel: "Categories", sortRecent: "Latest first", sortPopular: "Popular first",
    sortUnanswered: "Unanswered", loadMore: "Load More", noResults: "No discussions match your filters.",
    composerTitle: "Start a Discussion", composerCategoryLabel: "Category", composerCategoryPlaceholder: "Choose a category",
    composerTitleLabel: "Title", composerTitlePlaceholder: "What's your question or topic?", composerContentLabel: "Content",
    composerContentPlaceholder: "Share details, context, or sources...", composerCancel: "Cancel", composerPublish: "Publish",
    comments: "Comments", posts: "posts", report: "Report", reportPost: "Report Post",
    confirmReport: "Are you sure you want to report this post?", reportReason: "Reason for reporting (optional)",
    cancel: "Cancel", submit: "Submit",
    deletePost: "Delete", confirmDeletePost: "Are you sure you want to delete this post? This cannot be undone.",
  },
  AR: {
    pageTitle: "النقاشات", searchPlaceholder: "ابحث بالعنوان أو المحتوى أو المؤلف...", newPostButton: "ابدأ نقاشاً جديداً",
    allDiscussions: "جميع النقاشات", categoriesLabel: "الأقسام", sortRecent: "الأحدث أولاً", sortPopular: "الأكثر تفاعلاً",
    sortUnanswered: "بدون ردود", loadMore: "عرض المزيد", noResults: "لا توجد نقاشات مطابقة.",
    composerTitle: "ابدأ نقاشاً", composerCategoryLabel: "القسم", composerCategoryPlaceholder: "اختر قسماً",
    composerTitleLabel: "العنوان", composerTitlePlaceholder: "ما هو سؤالك أو موضوعك؟", composerContentLabel: "المحتوى",
    composerContentPlaceholder: "شارك التفاصيل أو السياق أو المصادر...", composerCancel: "إلغاء", composerPublish: "نشر",
    comments: "تعليقات", posts: "منشورات", report: "إبلاغ", reportPost: "الإبلاغ عن المنشور",
    confirmReport: "هل أنت متأكد من رغبتك في الإبلاغ عن هذا المنشور؟", reportReason: "سبب الإبلاغ (اختياري)",
    cancel: "إلغاء", submit: "إرسال",
    deletePost: "حذف", confirmDeletePost: "هل أنت متأكد من رغبتك في حذف هذا المنشور؟ لا يمكن التراجع عن هذا.",
  },
  FR: {
    pageTitle: "Discussions", searchPlaceholder: "Rechercher par titre, contenu ou auteur...", newPostButton: "Nouvelle Discussion",
    allDiscussions: "Toutes les Discussions", categoriesLabel: "Catégories", sortRecent: "Plus récent", sortPopular: "Plus populaire",
    sortUnanswered: "Sans réponse", loadMore: "Charger Plus", noResults: "Aucune discussion ne correspond à vos filtres.",
    composerTitle: "Lancer une Discussion", composerCategoryLabel: "Catégorie", composerCategoryPlaceholder: "Choisissez une catégorie",
    composerTitleLabel: "Titre", composerTitlePlaceholder: "Quelle est votre question ou votre sujet?", composerContentLabel: "Contenu",
    composerContentPlaceholder: "Partagez des détails, du contexte ou des sources...", composerCancel: "Annuler", composerPublish: "Publier",
    comments: "Commentaires", posts: "publications", report: "Signaler", reportPost: "Signaler le Post",
    confirmReport: "Êtes-vous sûr de vouloir signaler ce post?", reportReason: "Raison du signalement (optionnel)",
    cancel: "Annuler", submit: "Soumettre",
    deletePost: "Supprimer", confirmDeletePost: "Es-tu sûr(e) de vouloir supprimer ce post ? Cette action est irréversible.",
  },
};

const Icon: React.FC<{ name: string; size?: number; filled?: boolean }> = ({ name, size = 18, filled = false }) => (
  <span className="material-symbols-outlined" style={{ fontSize: size, lineHeight: 1, fontVariationSettings: `'FILL' ${filled ? 1 : 0}, 'wght' 400, 'GRAD' 0, 'opsz' 24` }}>{name}</span>
);

type SortMode = "recent" | "popular" | "unanswered";
type FilterMode = { type: "all" } | { type: "category"; id: number };

const Forum: React.FC = () => {
  const { lang } = useLang();
  const { user } = useAuth();
  const isAdmin = user?.role_name === "admin";
  const location = useLocation();
  const t = content[lang as Language] || content.EN;
  const isRTL = lang === "AR";
  const currentLangCode = lang.toLowerCase();

  const [categories, setCategories] = useState<ForumCategory[]>([]);
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const limit = 6;

  const [filter, setFilter] = useState<FilterMode>({ type: "all" });
  const [sortMode, setSortMode] = useState<SortMode>("recent");
  const [searchQuery, setSearchQuery] = useState("");

  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [composerCategoryId, setComposerCategoryId] = useState<number | "">("");
  const [composerTitle, setComposerTitle] = useState("");
  const [composerContent, setComposerContent] = useState("");

  const [reportModal, setReportModal] = useState<{ isOpen: boolean; postId: number | null; reason: string }>({
    isOpen: false, postId: null, reason: "",
  });

  // ✅ ADDED: track which post's "..." menu is open (click-based, not hover)
  const [openMenuPostId, setOpenMenuPostId] = useState<number | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await forumApi.categories.getAll();
        if (res.data.success && res.data.data) setCategories(res.data.data);
      } catch (err) { console.error("Failed to fetch categories", err); }
    };
    fetchCategories();
  }, []);

  const fetchPosts = async (pageNum: number, append: boolean = false) => {
    try {
      setLoading(true);
      const params: any = { page: pageNum, limit };
      if (filter.type === "category") params.category_id = filter.id;
      const res = await forumApi.posts.getAll(params);
      if (res.data.success && res.data.data) {
        const newPosts = res.data.data;
        setPosts((prev) => (append ? [...prev, ...newPosts] : newPosts));
        setHasMore(newPosts.length === limit);
      }
    } catch (err) { console.error("Failed to fetch posts", err); }
    finally { setLoading(false); }
  };

  useEffect(() => { setPage(1); fetchPosts(1, false); }, [filter]);

  useEffect(() => {
    if (!isComposerOpen) return;
    document.body.style.overflow = "hidden";
    const onKeyDown = (e: KeyboardEvent) => { if (e.key === "Escape") setIsComposerOpen(false); };
    window.addEventListener("keydown", onKeyDown);
    return () => { document.body.style.overflow = ""; window.removeEventListener("keydown", onKeyDown); };
  }, [isComposerOpen]);

  // ✅ ADDED: close the "..." dropdown when clicking anywhere else on the page
  useEffect(() => {
    if (openMenuPostId === null) return;
    const handleClickOutside = () => setOpenMenuPostId(null);
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [openMenuPostId]);

  const openComposer = () => {
    setComposerCategoryId(filter.type === "category" ? filter.id : "");
    setComposerTitle(""); setComposerContent(""); setIsComposerOpen(true);
  };
  const closeComposer = () => setIsComposerOpen(false);
  const canPublish = composerCategoryId !== "" && composerTitle.trim().length > 0 && composerContent.trim().length > 0;

  const handlePublish = async () => {
    if (!canPublish) return;
    try {
      const res = await forumApi.posts.create({ title: composerTitle.trim(), content: composerContent.trim(), category_id: composerCategoryId as number });
      if (res.data.success && res.data.data) { setPosts((prev) => [res.data.data!, ...prev]); setIsComposerOpen(false); }
    } catch (err) { console.error("Failed to publish post", err); alert("Failed to publish post."); }
  };

  const handleLoadMore = () => { const nextPage = page + 1; setPage(nextPage); fetchPosts(nextPage, true); };

  const getCategoryName = (cat: ForumCategory | null | undefined) => {
    if (!cat) return "Uncategorized";
    const translations = cat.translations;
    if (translations) {
      if (translations[currentLangCode]) return translations[currentLangCode];
      if (translations[currentLangCode.toUpperCase()]) return translations[currentLangCode.toUpperCase()];
    }
    return cat.name;
  };

  const getCategoryPostCount = (categoryId: number) => {
    const category = categories.find(c => c.category_id === categoryId);
    return category?.post_count || 0;
  };

  const totalPostsCount = useMemo(() => {
    return categories.reduce((sum, cat) => sum + (cat.post_count || 0), 0);
  }, [categories]);

  const categoryOf = (categoryId: number | null) => categories.find((c) => c.category_id === categoryId);

  const handleLike = async (e: React.MouseEvent, postId: number) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const res = await forumApi.posts.toggleLike(postId);
      if (res.data.success) {
        const like_count = res.data.like_count;
        const liked = res.data.liked;
        setPosts(prev => prev.map(p => 
          p.post_id === postId ? { ...p, like_count, liked } : p
        ));
      }
    } catch (err) {
      console.error("❌ Failed to toggle like", err);
    }
  };

  const visiblePosts = useMemo(() => {
    let list = [...posts];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((p) => {
        const titleMatch = p.title.toLowerCase().includes(q);
        const contentMatch = p.content.toLowerCase().includes(q);
        const authorMatch = (p.users?.name || p.users?.username || "").toLowerCase().includes(q);
        return titleMatch || contentMatch || authorMatch;
      });
    }
    if (sortMode === "popular") {
      list.sort((a, b) => (b.like_count || 0) + (b._count?.forum_comments || 0) - ((a.like_count || 0) + (a._count?.forum_comments || 0)));
    } else if (sortMode === "unanswered") {
      list = list.filter((p) => (p._count?.forum_comments || 0) === 0);
    } else {
      list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
    return list;
  }, [posts, sortMode, searchQuery]);

  const openReportModal = (postId: number) => setReportModal({ isOpen: true, postId, reason: "" });
  const closeReportModal = () => setReportModal({ isOpen: false, postId: null, reason: "" });

  const handleReportSubmit = async () => {
    if (!reportModal.postId) return;
    try {
      await forumApi.posts.report(reportModal.postId, reportModal.reason || "");
      alert("Report submitted successfully.");
      closeReportModal();
    } catch (err) { console.error("Failed to submit report", err); alert("Failed to submit report."); }
  };

  const handleDeletePost = async (postId: number) => {
    if (!window.confirm(t.confirmDeletePost)) return;
    try {
      await forumApi.posts.delete(postId);
      setPosts((prev) => prev.filter((p) => p.post_id !== postId));
    } catch (err) {
      console.error("Failed to delete post", err);
      alert("Failed to delete post.");
    }
  };

  return (
    <div className="antialiased min-h-screen selection:bg-[#b8860b] selection:text-[#fcfaf5]" style={{ backgroundColor: colors.creamLight, color: colors.forestGreen }} dir={isRTL ? "rtl" : "ltr"}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap');
        .material-symbols-outlined { font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24; font-family: 'Material Symbols Outlined'; display: inline-block; vertical-align: middle; }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; } .custom-scrollbar::-webkit-scrollbar-track { background: transparent; } .custom-scrollbar::-webkit-scrollbar-thumb { background-color: rgba(11, 67, 53, 0.2); border-radius: 20px; }
        .custom-scrollbar-x::-webkit-scrollbar { height: 4px; } .custom-scrollbar-x::-webkit-scrollbar-track { background: transparent; } .custom-scrollbar-x::-webkit-scrollbar-thumb { background-color: rgba(11, 67, 53, 0.2); border-radius: 20px; }
      `}</style>

      <main className="pt-24 md:pt-28 pb-20 px-[20px] md:px-[64px] max-w-[1240px] mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 md:mb-8">
          <div>
            <p className="font-['JetBrains_Mono'] text-[11px] uppercase tracking-[0.08em] opacity-70 mb-1">FORUM / DISCUSSIONS</p>
            <h1 className="font-['Hanken_Grotesk'] text-3xl font-bold">{t.pageTitle}</h1>
          </div>
          <div className="relative w-full md:w-80">
            <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder={t.searchPlaceholder}
              className="w-full px-4 py-2.5 rounded-lg border bg-[#fcfaf5] focus:ring-1 transition-all font-['Inter'] text-[14px] outline-none cursor-text"
              style={{ borderColor: colors.creamDark }}
              onFocus={(e) => { e.currentTarget.style.borderColor = colors.amber; e.currentTarget.style.boxShadow = `0 0 0 1px ${colors.amber}`; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = colors.creamDark; e.currentTarget.style.boxShadow = "none"; }}
              dir={isRTL ? "rtl" : "ltr"}
            />
            <span className={`absolute ${isRTL ? "left-3" : "right-3"} top-1/2 -translate-y-1/2 opacity-60 pointer-events-none`}><Icon name="search" size={19} /></span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6 md:gap-8 items-start">
          <aside className="flex flex-col gap-4 md:gap-6 lg:sticky lg:top-28">
            <button onClick={openComposer}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 md:px-5 md:py-3 rounded-lg text-[12px] md:text-[13px] font-bold tracking-[0.03em] font-['Hanken_Grotesk'] transition-all duration-200 border cursor-pointer"
              style={{ backgroundColor: colors.forestGreen, color: colors.creamLight, borderColor: colors.forestGreen }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = colors.creamLight; e.currentTarget.style.color = colors.forestGreen; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = colors.forestGreen; e.currentTarget.style.color = colors.creamLight; }}
            >
              <Icon name="add" size={18} /> {t.newPostButton}
            </button>

            <div className="hidden md:flex flex-col gap-1 max-h-48 overflow-y-auto custom-scrollbar pr-2">
              <p className="font-['JetBrains_Mono'] text-[10px] uppercase tracking-[0.15em] font-bold opacity-50 px-3 mb-1">{t.categoriesLabel}</p>
              <button onClick={() => setFilter({ type: "all" })}
                className={`flex items-center justify-between px-3 py-2 rounded-lg font-['Inter'] text-[14px] transition-colors cursor-pointer ${filter.type === "all" ? "font-semibold" : ""}`}
                style={{ backgroundColor: filter.type === "all" ? colors.creamMid : "transparent", color: colors.forestGreen }}
                onMouseEnter={(e) => { if (filter.type !== "all") e.currentTarget.style.backgroundColor = colors.creamMid; }}
                onMouseLeave={(e) => { if (filter.type !== "all") e.currentTarget.style.backgroundColor = "transparent"; }}
              >
                <span className="flex items-center gap-2.5"><span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: colors.forestGreen }} />{t.allDiscussions}</span>
                <span className="font-['JetBrains_Mono'] text-[11px] opacity-40">{totalPostsCount}</span>
              </button>
              {categories.map((cat) => {
                const isActive = filter.type === "category" && filter.id === cat.category_id;
                return (
                  <button key={cat.category_id} onClick={() => setFilter(isActive ? { type: "all" } : { type: "category", id: cat.category_id })}
                    className="flex items-center justify-between px-3 py-2 rounded-lg font-['Inter'] text-[14px] transition-colors cursor-pointer"
                    style={{ backgroundColor: isActive ? colors.creamMid : "transparent", color: colors.forestGreen, fontWeight: isActive ? 600 : 400 }}
                    onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.backgroundColor = colors.creamMid; }}
                    onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.backgroundColor = "transparent"; }}
                  >
                    <span className="flex items-center gap-2.5"><span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: getCategoryColor(cat.category_id) }} />{getCategoryName(cat)}</span>
                    <span className="font-['JetBrains_Mono'] text-[11px] opacity-40">{getCategoryPostCount(cat.category_id)}</span>
                  </button>
                );
              })}
            </div>

            <div className="md:hidden flex flex-col gap-2">
              <p className="font-['JetBrains_Mono'] text-[10px] uppercase tracking-[0.15em] font-bold opacity-50 px-1">{t.categoriesLabel}</p>
              <div className="flex overflow-x-auto gap-2 pb-3 custom-scrollbar-x -mx-[20px] px-[20px]">
                <button onClick={() => setFilter({ type: "all" })}
                  className="flex-shrink-0 inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-[12px] font-medium transition-colors cursor-pointer"
                  style={{ backgroundColor: filter.type === "all" ? colors.forestGreen : colors.creamLight, color: filter.type === "all" ? colors.creamLight : colors.forestGreen, borderColor: colors.forestGreen }}
                >
                  {t.allDiscussions} <span className="font-['JetBrains_Mono'] text-[10px] opacity-60">({totalPostsCount})</span>
                </button>
                {categories.map((cat) => {
                  const isActive = filter.type === "category" && filter.id === cat.category_id;
                  return (
                    <button key={cat.category_id} onClick={() => setFilter(isActive ? { type: "all" } : { type: "category", id: cat.category_id })}
                      className="flex-shrink-0 inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-[12px] font-medium transition-colors cursor-pointer"
                      style={{ backgroundColor: isActive ? colors.forestGreen : colors.creamLight, color: isActive ? colors.creamLight : colors.forestGreen, borderColor: colors.forestGreen }}
                    >
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: getCategoryColor(cat.category_id) }} />
                      {getCategoryName(cat)} <span className="font-['JetBrains_Mono'] text-[10px] opacity-60">({getCategoryPostCount(cat.category_id)})</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </aside>

          <div>
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2">
                <button onClick={() => setFilter({ type: "all" })}
                  className="hidden md:inline-flex items-center gap-2 px-4 py-2 rounded-lg font-['Inter'] text-[13px] font-medium transition-all cursor-pointer"
                  style={{ color: filter.type === "all" ? colors.forestGreen : `${colors.forestGreen}99` }}
                  onMouseEnter={(e) => { if (filter.type !== "all") e.currentTarget.style.color = colors.forestGreen; }}
                  onMouseLeave={(e) => { if (filter.type !== "all") e.currentTarget.style.color = `${colors.forestGreen}99`; }}
                >
                  <Icon name="forum" size={18} /> {t.allDiscussions}
                </button>
                {filter.type === "category" && (
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-lg font-['Inter'] text-[12px] md:text-[13px] font-medium" style={{ backgroundColor: colors.creamMid, color: colors.forestGreen }}>
                    <span className="w-2 h-2 md:w-2.5 md:h-2.5 rounded-full" style={{ backgroundColor: getCategoryColor(filter.id) }} />
                    <span className="truncate max-w-[150px] md:max-w-none">{getCategoryName(categoryOf(filter.id))}</span>
                    <button onClick={() => setFilter({ type: "all" })} className="ml-1 opacity-50 hover:opacity-100 transition-opacity cursor-pointer"><Icon name="close" size={16} /></button>
                  </div>
                )}
              </div>
              <select value={sortMode} onChange={(e) => setSortMode(e.target.value as SortMode)}
                className="px-3 py-2 md:px-4 md:py-2 rounded-lg border bg-[#fcfaf5] font-['Inter'] text-[12px] md:text-[13px] outline-none transition-colors cursor-pointer"
                style={{ borderColor: colors.creamDark }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = colors.amber)}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = colors.creamDark)}
              >
                <option value="recent">{t.sortRecent}</option>
                <option value="popular">{t.sortPopular}</option>
                <option value="unanswered">{t.sortUnanswered}</option>
              </select>
            </div>

            {loading && posts.length === 0 ? (
              <div className="text-center py-16 rounded-xl border" style={{ backgroundColor: colors.creamLight, borderColor: colors.creamDark }}>
                <Icon name="hourglass_empty" size={48} />
                <p className="font-['Inter'] text-[14px] mt-3 opacity-70">Loading discussions...</p>
              </div>
            ) : visiblePosts.length === 0 ? (
              <div className="text-center py-16 rounded-xl border" style={{ backgroundColor: colors.creamLight, borderColor: colors.creamDark }}>
                <Icon name="inbox" size={48} />
                <p className="font-['Inter'] text-[14px] mt-3 opacity-70">{t.noResults}</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3 md:gap-4">
                {visiblePosts.map((post) => {
                  const cat = categoryOf(post.category_id);
                  const authorName = post.users?.name || post.users?.username || "Anonymous";
                  const commentsCount = post._count?.forum_comments || 0;
                  const isLiked = post.liked === true;

                  return (
                    <div key={post.post_id}
                      className="group rounded-xl p-4 md:p-6 border transition-all duration-200 cursor-pointer"
                      style={{ backgroundColor: colors.creamLight, borderColor: colors.creamDark, boxShadow: "0px 4px 20px rgba(11, 67, 53, 0.08)" }}
                      onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0px 8px 30px rgba(11, 67, 53, 0.12)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0px 4px 20px rgba(11, 67, 53, 0.08)"; }}
                    >
                      <div className="flex items-start gap-3 md:gap-5">
                        <UserAvatar user={post.users} size="md" />

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Link to={`/profile/${post.users?.id || '#'}`} onClick={(e) => e.stopPropagation()} className="font-['Hanken_Grotesk'] text-[15px] md:text-[16px] font-bold hover:underline cursor-pointer" style={{ color: colors.forestGreen }}>
                              {authorName}
                            </Link>
                          </div>
                          <Link to={`/forum/${post.post_id}`} onClick={(e) => e.stopPropagation()} className="block cursor-pointer">
                            <h3 className="font-['Hanken_Grotesk'] text-[15px] md:text-[17px] font-bold group-hover:text-[#b8860b] transition-colors mb-1" style={{ color: colors.forestGreen }}>
                              {post.title}
                            </h3>
                          </Link>
                          <Link to={`/forum/${post.post_id}`} onClick={(e) => e.stopPropagation()} className="block cursor-pointer">
                            <p className="font-['Inter'] text-[12px] md:text-[13px] leading-relaxed line-clamp-2 mb-3 opacity-70 group-hover:opacity-100 transition-opacity">
                              {post.content}
                            </p>
                          </Link>

                          <div className={`flex items-center justify-between pt-3 border-t ${isRTL ? "flex-row-reverse" : ""}`} style={{ borderColor: colors.creamDark }}>
                            <div className={`flex items-center gap-1.5 ${isRTL ? "flex-row-reverse" : ""}`}>
                              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cat ? getCategoryColor(cat.category_id) : colors.creamDark }} />
                              <span className="font-['Inter'] text-[10px] font-medium opacity-70">{getCategoryName(cat)}</span>
                            </div>
                            
                            <div className={`flex items-center gap-4 md:gap-6 ${isRTL ? "flex-row-reverse" : ""}`}>
                              
                              {/* 1. LIKE BUTTON */}
                              <button
                                onClick={(e) => handleLike(e, post.post_id)}
                                className={`flex items-center gap-1.5 font-['Inter'] text-[11px] md:text-[12px] transition-all duration-300 cursor-pointer group/btn ${isRTL ? "flex-row-reverse" : ""} ${isLiked ? "opacity-100" : "opacity-60 hover:opacity-100"}`}
                                style={{ color: isLiked ? colors.red : colors.forestGreen }}
                                title={isLiked ? "Unlike" : "Like"}
                              >
                                <Icon name="thumb_up" size={16} filled={isLiked} />
                                <span className={`${isLiked ? "font-bold" : ""} transition-all`}>{post.like_count || 0}</span>
                              </button>

                              {/* 2. COMMENTS BUTTON */}
                              <Link
                                to={`/forum/${post.post_id}`}
                                onClick={(e) => e.stopPropagation()}
                                className={`flex items-center gap-1.5 font-['Inter'] text-[11px] md:text-[12px] opacity-60 hover:opacity-100 transition-all duration-300 cursor-pointer group/btn ${isRTL ? "flex-row-reverse" : ""}`}
                                style={{ color: colors.forestGreen }}
                              >
                                <Icon name="chat_bubble_outline" size={16} className="group-hover/btn:text-[#b8860b] transition-colors" />
                                <span className="group-hover/btn:text-[#b8860b] transition-colors">{commentsCount} {t.comments}</span>
                              </Link>
                              
                              {/* 3. POST MENU (Delete for owner/admin) — ✅ now click-based, not hover-based */}
                              {user && (user.id === post.user_id || isAdmin) && (
                                <div className="relative">
                                  <button
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      setOpenMenuPostId(openMenuPostId === post.post_id ? null : post.post_id);
                                    }}
                                    className="flex items-center gap-1.5 font-['Inter'] text-[11px] md:text-[12px] opacity-30 hover:opacity-100 transition-all duration-300 cursor-pointer"
                                    style={{ color: colors.forestGreen }}
                                    title="More options"
                                  >
                                    <Icon name="more_vert" size={16} />
                                  </button>

                                  {/* Dropdown Menu — only rendered when this post's menu is open */}
                                  {openMenuPostId === post.post_id && (
                                    <div
                                      onClick={(e) => e.stopPropagation()}
                                      className={`absolute bottom-full ${isRTL ? "left-0" : "right-0"} mb-2 min-w-[160px] rounded-xl border overflow-hidden z-20`}
                                      style={{ backgroundColor: colors.creamLight, borderColor: colors.creamDark, boxShadow: "0 10px 30px rgba(0,0,0,0.12)" }}
                                    >
                                      <button
                                        onClick={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          setOpenMenuPostId(null);
                                          handleDeletePost(post.post_id);
                                        }}
                                        className={`w-full flex items-center gap-2 font-['Inter'] text-[13px] font-semibold px-4 py-2.5 transition-colors cursor-pointer ${isRTL ? "flex-row-reverse text-right" : "text-left"}`}
                                        style={{ color: colors.red }}
                                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(139, 44, 44, 0.08)")}
                                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                                      >
                                        <Icon name="delete" size={17} />
                                        {t.deletePost}
                                      </button>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* 4. REPORT BUTTON (Hidden if user is the author) */}
                              {user && user.id !== post.user_id && (
                                <button
                                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); openReportModal(post.post_id); }}
                                  className={`flex items-center gap-1.5 font-['Inter'] text-[11px] md:text-[12px] opacity-30 hover:opacity-100 transition-all duration-300 cursor-pointer ${isRTL ? "flex-row-reverse" : ""}`}
                                  style={{ color: colors.red }}
                                  title={t.report}
                                >
                                  <Icon name="flag" size={16} />
                                  <span className="hidden md:inline">{t.report}</span>
                                </button>
                              )}

                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {hasMore && visiblePosts.length > 0 && (
              <div className="flex justify-center mt-6 md:mt-8">
                <button onClick={handleLoadMore} disabled={loading}
                  className="inline-flex items-center gap-2 px-5 py-2 md:px-6 md:py-2.5 rounded-lg text-[11px] md:text-[12px] font-bold tracking-[0.03em] font-['Hanken_Grotesk'] transition-all duration-200 border disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  style={{ color: colors.forestGreen, borderColor: colors.forestGreen, backgroundColor: "transparent" }}
                  onMouseEnter={(e) => { if(!loading) { e.currentTarget.style.backgroundColor = colors.forestGreen; e.currentTarget.style.color = colors.creamLight; } }}
                  onMouseLeave={(e) => { if(!loading) { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = colors.forestGreen; } }}
                >
                  <Icon name={loading ? "hourglass_empty" : "expand_more"} size={16} />
                  {loading ? "Loading..." : t.loadMore}
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Report Modal */}
      {reportModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(11, 67, 53, 0.6)", backdropFilter: "blur(4px)" }} onClick={closeReportModal}>
          <div className="w-full max-w-md rounded-xl border p-6" style={{ backgroundColor: colors.creamLight, borderColor: colors.creamDark, boxShadow: "0 20px 60px rgba(0,0,0,0.18)" }} onClick={(e) => e.stopPropagation()} dir={isRTL ? "rtl" : "ltr"}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: colors.red + "20" }}>
                <Icon name="flag" size={24} />
              </div>
              <h3 className="font-['Hanken_Grotesk'] text-xl font-bold" style={{ color: colors.forestGreen }}>{t.reportPost}</h3>
            </div>
            <p className="font-['Inter'] text-[14px] mb-4 opacity-80" style={{ color: colors.forestGreen }}>{t.confirmReport}</p>
            <div className="mb-6">
              <label className="block font-['JetBrains_Mono'] text-[10px] uppercase tracking-[0.1em] font-bold mb-2 opacity-70">{t.reportReason}</label>
              <textarea value={reportModal.reason} onChange={(e) => setReportModal({ ...reportModal, reason: e.target.value })} placeholder={t.reportReason} rows={3}
                className="w-full px-4 py-3 rounded-lg border bg-[#fcfaf5] font-['Inter'] text-[14px] outline-none transition-all resize-none cursor-text"
                style={{ borderColor: colors.creamDark }}
                onFocus={(e) => { e.currentTarget.style.borderColor = colors.amber; e.currentTarget.style.boxShadow = `0 0 0 1px ${colors.amber}`; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = colors.creamDark; e.currentTarget.style.boxShadow = "none"; }}
              />
            </div>
            <div className={`flex items-center justify-end gap-3 ${isRTL ? "flex-row-reverse" : ""}`}>
              <button onClick={closeReportModal} className="px-4 py-2.5 rounded-lg text-[13px] font-bold font-['Hanken_Grotesk'] transition-colors border cursor-pointer" style={{ color: colors.forestGreen, borderColor: colors.forestGreen }} onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = colors.creamMid)} onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}>
                {t.cancel}
              </button>
              <button onClick={handleReportSubmit} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-[13px] font-bold tracking-[0.05em] font-['Hanken_Grotesk'] transition-all duration-200 border cursor-pointer"
                style={{ backgroundColor: colors.red, color: colors.creamLight, borderColor: colors.red }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = colors.creamLight; e.currentTarget.style.color = colors.red; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = colors.red; e.currentTarget.style.color = colors.creamLight; }}
              >
                <Icon name="flag" size={16} filled /> {t.submit}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Composer Modal */}
      {isComposerOpen && (
        <div className="fixed inset-0 z-50 flex items-start md:items-center justify-center p-0 md:p-6 overflow-y-auto" style={{ backgroundColor: "rgba(11, 67, 53, 0.6)", backdropFilter: "blur(4px)" }} onClick={closeComposer}>
          <div className="w-full md:max-w-xl rounded-none md:rounded-xl border flex flex-col overflow-hidden" style={{ backgroundColor: colors.creamLight, borderColor: colors.creamDark, boxShadow: "0 20px 60px rgba(0,0,0,0.18)", minHeight: "100vh" }} onClick={(e) => e.stopPropagation()} dir={isRTL ? "rtl" : "ltr"}>
            <div className="flex items-center justify-between px-4 md:px-6 py-4 md:py-5 border-b flex-shrink-0" style={{ backgroundColor: colors.creamMid, borderColor: colors.creamDark }}>
              <h3 className="font-['Hanken_Grotesk'] text-lg md:text-xl font-bold flex items-center gap-2"><Icon name="edit_note" size={22} /> {t.composerTitle}</h3>
              <button onClick={closeComposer} aria-label="Close" className="w-9 h-9 flex items-center justify-center rounded-lg transition-colors cursor-pointer" onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(11, 67, 53, 0.1)")} onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}><Icon name="close" size={22} /></button>
            </div>
            <div className="px-4 md:px-6 py-4 md:py-6 flex flex-col gap-4 md:gap-5 flex-1">
              <div>
                <label className="block font-['JetBrains_Mono'] text-[10px] uppercase tracking-[0.1em] font-bold mb-2 opacity-70">{t.composerCategoryLabel}</label>
                <select value={composerCategoryId} onChange={(e) => setComposerCategoryId(e.target.value ? Number(e.target.value) : "")} className="w-full px-4 py-3 rounded-lg border bg-[#fcfaf5] font-['Inter'] text-[14px] outline-none transition-all cursor-pointer" style={{ borderColor: colors.creamDark }} onFocus={(e) => { e.currentTarget.style.borderColor = colors.amber; e.currentTarget.style.boxShadow = `0 0 0 1px ${colors.amber}`; }} onBlur={(e) => { e.currentTarget.style.borderColor = colors.creamDark; e.currentTarget.style.boxShadow = "none"; }}>
                  <option value="">{t.composerCategoryPlaceholder}</option>
                  {categories.map((cat) => (<option key={cat.category_id} value={cat.category_id}>{getCategoryName(cat)}</option>))}
                </select>
              </div>
              <div>
                <label className="block font-['JetBrains_Mono'] text-[10px] uppercase tracking-[0.1em] font-bold mb-2 opacity-70">{t.composerTitleLabel}</label>
                <input value={composerTitle} onChange={(e) => setComposerTitle(e.target.value)} placeholder={t.composerTitlePlaceholder} className="w-full px-4 py-3 rounded-lg border bg-[#fcfaf5] font-['Inter'] text-[14px] outline-none transition-all cursor-text" style={{ borderColor: colors.creamDark }} onFocus={(e) => { e.currentTarget.style.borderColor = colors.amber; e.currentTarget.style.boxShadow = `0 0 0 1px ${colors.amber}`; }} onBlur={(e) => { e.currentTarget.style.borderColor = colors.creamDark; e.currentTarget.style.boxShadow = "none"; }} />
              </div>
              <div className="flex-1 flex flex-col">
                <label className="block font-['JetBrains_Mono'] text-[10px] uppercase tracking-[0.1em] font-bold mb-2 opacity-70">{t.composerContentLabel}</label>
                <textarea value={composerContent} onChange={(e) => setComposerContent(e.target.value)} placeholder={t.composerContentPlaceholder} rows={6} className="w-full flex-1 px-4 py-3 rounded-lg border bg-[#fcfaf5] font-['Inter'] text-[14px] outline-none transition-all resize-none cursor-text" style={{ borderColor: colors.creamDark }} onFocus={(e) => { e.currentTarget.style.borderColor = colors.amber; e.currentTarget.style.boxShadow = `0 0 0 1px ${colors.amber}`; }} onBlur={(e) => { e.currentTarget.style.borderColor = colors.creamDark; e.currentTarget.style.boxShadow = "none"; }} />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-4 md:px-6 py-4 md:py-5 border-t flex-shrink-0" style={{ borderColor: colors.creamDark }}>
              <button onClick={closeComposer} className="px-4 py-2.5 md:px-5 md:py-2.5 rounded-lg text-[13px] font-bold font-['Hanken_Grotesk'] transition-colors border cursor-pointer" style={{ color: colors.forestGreen, borderColor: colors.forestGreen }} onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = colors.creamMid)} onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}>{t.composerCancel}</button>
              <button onClick={handlePublish} disabled={!canPublish} className="inline-flex items-center gap-2 px-5 py-2.5 md:px-6 md:py-2.5 rounded-lg text-[13px] font-bold tracking-[0.05em] font-['Hanken_Grotesk'] transition-all duration-200 border disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer" style={{ backgroundColor: colors.forestGreen, color: colors.creamLight, borderColor: colors.forestGreen }} onMouseEnter={(e) => { if (canPublish) { e.currentTarget.style.backgroundColor = colors.creamLight; e.currentTarget.style.color = colors.forestGreen; } }} onMouseLeave={(e) => { if (canPublish) { e.currentTarget.style.backgroundColor = colors.forestGreen; e.currentTarget.style.color = colors.creamLight; } }}>
                <Icon name="send" size={16} filled /> {t.composerPublish}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Forum;