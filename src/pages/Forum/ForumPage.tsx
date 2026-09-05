// Forum.tsx
import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useLang } from "../../context/LanguageContext";

type Language = "EN" | "AR" | "FR";

/* ------------------------------------------------------------------ */
/*  DESIGN TOKENS — Oulamnauna Admin Palette                          */
/* ------------------------------------------------------------------ */
const colors = {
  creamLight: "#fcfaf5",
  creamMid: "#f6efdc",
  creamDark: "#e5d5a8",
  forestGreen: "#0b4335",
  amber: "#b8860b",
  red: "#8b2c2c",
};

/* ------------------------------------------------------------------ */
/*  MOCK DATA — Colors harmonized with Admin Palette                  */
/* ------------------------------------------------------------------ */
interface ForumCategory {
  category_id: number;
  name: string;
  color: string;
  post_count: number;
}

export const forumCategories: ForumCategory[] = [
  { category_id: 1, name: "General Discussion", color: colors.forestGreen, post_count: 128 },
  { category_id: 2, name: "Scholar Research", color: colors.amber, post_count: 245 },
  { category_id: 3, name: "Manuscripts & Sources", color: colors.red, post_count: 97 },
  { category_id: 4, name: "Translation Help", color: "#5a7a6f", post_count: 63 }, // Lighter forest
  { category_id: 5, name: "Site Feedback", color: "#d4b87a", post_count: 41 },   // Lighter amber
  { category_id: 6, name: "Announcements", color: colors.forestGreen, post_count: 15 },
];

export interface ForumPost {
  post_id: number;
  category_id: number;
  title: string;
  excerpt: string;
  author_name: string;
  latest_reply_from: string | null;
  latest_reply_at: string | null;
  views_count: number;
  comments_count: number;
  reactions_count: number;
  created_at: string;
  is_pinned?: boolean;
  participants?: string[];
}

const forumPostsSeed: ForumPost[] = [
  {
    post_id: 1,
    category_id: 2,
    title: "Was Ibn Khaldun influenced by earlier Andalusian historians?",
    excerpt: "Reading the Muqaddimah again and I keep noticing parallels with earlier Andalusian chroniclers. Curious if there's documented influence or if this is coincidental.",
    author_name: "Yacine B.",
    latest_reply_from: "Karim D.",
    latest_reply_at: "1 hour ago",
    views_count: 342,
    comments_count: 18,
    reactions_count: 47,
    created_at: "2024-01-16T09:00:00Z",
    is_pinned: true,
    participants: ["Yacine B.", "Karim D.", "Sarah K.", "Imane Z."],
  },
  {
    post_id: 2,
    category_id: 3,
    title: "New manuscript scan added — Ibn Sina's Canon of Medicine, Book II",
    excerpt: "Just uploaded a high-resolution scan of Book II with page-level annotations. Feedback on the transcription is welcome.",
    author_name: "Oulamauna Team",
    latest_reply_from: "Sarah K.",
    latest_reply_at: "3 hours ago",
    views_count: 501,
    comments_count: 5,
    reactions_count: 63,
    created_at: "2024-01-15T12:00:00Z",
    participants: ["Oulamauna Team", "Sarah K.", "Mounir T."],
  },
  {
    post_id: 3,
    category_id: 4,
    title: "Looking for a reliable English translation of Ihya Ulum al-Din",
    excerpt: "Most translations I've found online are heavily abridged. Does anyone know of a complete, well-reviewed English edition?",
    author_name: "Sarah K.",
    latest_reply_from: "Imane Z.",
    latest_reply_at: "5 hours ago",
    views_count: 210,
    comments_count: 9,
    reactions_count: 22,
    created_at: "2024-01-14T08:20:00Z",
    participants: ["Sarah K.", "Imane Z.", "Karim D."],
  },
  {
    post_id: 4,
    category_id: 2,
    title: "Comparing Al-Ghazali's and Ibn Rushd's views on causality",
    excerpt: "The Tahafut exchange between the two is fascinating. Sharing a short breakdown of where they actually disagree versus where it's just terminology.",
    author_name: "Karim D.",
    latest_reply_from: "Yacine B.",
    latest_reply_at: "12 hours ago",
    views_count: 275,
    comments_count: 21,
    reactions_count: 38,
    created_at: "2024-01-13T18:40:00Z",
    participants: ["Karim D.", "Yacine B.", "Sarah K."],
  },
  {
    post_id: 5,
    category_id: 1,
    title: "Emir Abdelkader's writings on chivalry — where to start?",
    excerpt: "New to his work outside the historical/military context. Looking for recommendations on his philosophical and spiritual writings.",
    author_name: "Imane Z.",
    latest_reply_from: null,
    latest_reply_at: null,
    views_count: 156,
    comments_count: 0,
    reactions_count: 19,
    created_at: "2024-01-12T11:10:00Z",
    participants: ["Imane Z."],
  },
  {
    post_id: 6,
    category_id: 5,
    title: "RTL layout breaks on mobile when switching to Arabic",
    excerpt: "On the scholar profile page, the biography text overflows its container in RTL mode on small screens. Screenshots attached.",
    author_name: "Mounir T.",
    latest_reply_from: "Mounir T.",
    latest_reply_at: "1 day ago",
    views_count: 88,
    comments_count: 12,
    reactions_count: 6,
    created_at: "2024-01-11T15:30:00Z",
    participants: ["Mounir T.", "Yacine B."],
  },
];

/* ------------------------------------------------------------------ */
/*  TRANSLATIONS                                                      */
/* ------------------------------------------------------------------ */
interface ForumContent {
  pageTitle: string;
  searchPlaceholder: string;
  newPostButton: string;
  allDiscussions: string;
  categoriesLabel: string;
  sortRecent: string;
  sortPopular: string;
  sortUnanswered: string;
  latestReplyFrom: string;
  pinnedLabel: string;
  loadMore: string;
  noResults: string;
  composerTitle: string;
  composerCategoryLabel: string;
  composerCategoryPlaceholder: string;
  composerTitleLabel: string;
  composerTitlePlaceholder: string;
  composerContentLabel: string;
  composerContentPlaceholder: string;
  composerCancel: string;
  composerPublish: string;
  comments: string;
}

const content: Record<Language, ForumContent> = {
  EN: {
    pageTitle: "Discussions",
    searchPlaceholder: "Search discussions...",
    newPostButton: "Start New Discussion",
    allDiscussions: "All Discussions",
    categoriesLabel: "Categories",
    sortRecent: "Latest first",
    sortPopular: "Popular first",
    sortUnanswered: "Unanswered",
    latestReplyFrom: "Latest reply from",
    pinnedLabel: "Pinned",
    loadMore: "Load More",
    noResults: "No discussions match your filters.",
    composerTitle: "Start a Discussion",
    composerCategoryLabel: "Category",
    composerCategoryPlaceholder: "Choose a category",
    composerTitleLabel: "Title",
    composerTitlePlaceholder: "What's your question or topic?",
    composerContentLabel: "Content",
    composerContentPlaceholder: "Share details, context, or sources...",
    composerCancel: "Cancel",
    composerPublish: "Publish",
    comments: "Comments",
  },
  AR: {
    pageTitle: "النقاشات",
    searchPlaceholder: "ابحث في النقاشات...",
    newPostButton: "ابدأ نقاشاً جديداً",
    allDiscussions: "جميع النقاشات",
    categoriesLabel: "الأقسام",
    sortRecent: "الأحدث أولاً",
    sortPopular: "الأكثر تفاعلاً",
    sortUnanswered: "بدون ردود",
    latestReplyFrom: "آخر رد من",
    pinnedLabel: "مثبّت",
    loadMore: "عرض المزيد",
    noResults: "لا توجد نقاشات مطابقة.",
    composerTitle: "ابدأ نقاشاً",
    composerCategoryLabel: "القسم",
    composerCategoryPlaceholder: "اختر قسماً",
    composerTitleLabel: "العنوان",
    composerTitlePlaceholder: "ما هو سؤالك أو موضوعك؟",
    composerContentLabel: "المحتوى",
    composerContentPlaceholder: "شارك التفاصيل أو السياق أو المصادر...",
    composerCancel: "إلغاء",
    composerPublish: "نشر",
    comments: "تعليقات",
  },
  FR: {
    pageTitle: "Discussions",
    searchPlaceholder: "Rechercher des discussions...",
    newPostButton: "Nouvelle Discussion",
    allDiscussions: "Toutes les Discussions",
    categoriesLabel: "Catégories",
    sortRecent: "Plus récent",
    sortPopular: "Plus populaire",
    sortUnanswered: "Sans réponse",
    latestReplyFrom: "Dernière réponse de",
    pinnedLabel: "Épinglé",
    loadMore: "Charger Plus",
    noResults: "Aucune discussion ne correspond à vos filtres.",
    composerTitle: "Lancer une Discussion",
    composerCategoryLabel: "Catégorie",
    composerCategoryPlaceholder: "Choisissez une catégorie",
    composerTitleLabel: "Titre",
    composerTitlePlaceholder: "Quelle est votre question ou votre sujet?",
    composerContentLabel: "Contenu",
    composerContentPlaceholder: "Partagez des détails, du contexte ou des sources...",
    composerCancel: "Annuler",
    composerPublish: "Publier",
    comments: "Commentaires",
  },
};

/* ------------------------------------------------------------------ */
/*  HELPERS & UI COMPONENTS                                           */
/* ------------------------------------------------------------------ */
const getAvatarUrl = (name: string) =>
  `https://i.pravatar.cc/150?u=${encodeURIComponent(name)}`;

const Icon: React.FC<{ name: string; size?: number; filled?: boolean }> = ({ name, size = 18, filled = false }) => (
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
/*  MAIN COMPONENT                                                    */
/* ------------------------------------------------------------------ */
type SortMode = "recent" | "popular" | "unanswered";
type FilterMode = { type: "all" } | { type: "category"; id: number };

const Forum: React.FC = () => {
  const { lang } = useLang();
  const location = useLocation();
  const t = content[lang as Language] || content.EN;
  const isRTL = lang === "AR";

  const [posts, setPosts] = useState<ForumPost[]>(forumPostsSeed);
  const [filter, setFilter] = useState<FilterMode>({ type: "all" });
  const [sortMode, setSortMode] = useState<SortMode>("recent");
  const [searchQuery, setSearchQuery] = useState("");

  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [composerCategoryId, setComposerCategoryId] = useState<number | "">("");
  const [composerTitle, setComposerTitle] = useState("");
  const [composerContent, setComposerContent] = useState("");

  useEffect(() => {
    if (location.hash) {
      const element = document.getElementById(location.hash.substring(1));
      if (element) setTimeout(() => element.scrollIntoView({ behavior: "smooth" }), 100);
    }
  }, [location]);

  useEffect(() => {
    if (!isComposerOpen) return;
    document.body.style.overflow = "hidden";
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsComposerOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isComposerOpen]);

  const openComposer = () => {
    setComposerCategoryId(filter.type === "category" ? filter.id : "");
    setComposerTitle("");
    setComposerContent("");
    setIsComposerOpen(true);
  };
  const closeComposer = () => setIsComposerOpen(false);
  const canPublish = composerCategoryId !== "" && composerTitle.trim().length > 0 && composerContent.trim().length > 0;

  const handlePublish = () => {
    if (!canPublish) return;
    const newPost: ForumPost = {
      post_id: Math.max(0, ...posts.map((p) => p.post_id)) + 1,
      category_id: composerCategoryId as number,
      title: composerTitle.trim(),
      excerpt: composerContent.trim(),
      author_name: "You",
      latest_reply_from: null,
      latest_reply_at: null,
      views_count: 0,
      comments_count: 0,
      reactions_count: 0,
      created_at: new Date().toISOString(),
      participants: ["You"],
    };
    setPosts((prev) => [newPost, ...prev]);
    setIsComposerOpen(false);
  };

  const categoryOf = (categoryId: number) => forumCategories.find((c) => c.category_id === categoryId);

  const visiblePosts = useMemo(() => {
    let list = [...posts];

    if (filter.type === "category") list = list.filter((p) => p.category_id === filter.id);

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((p) => p.title.toLowerCase().includes(q) || p.excerpt.toLowerCase().includes(q));
    }

    if (sortMode === "popular") {
      list.sort((a, b) => b.reactions_count + b.comments_count - (a.reactions_count + a.comments_count));
    } else if (sortMode === "unanswered") {
      list = list.filter((p) => p.comments_count === 0);
    } else {
      list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    list.sort((a, b) => Number(!!b.is_pinned) - Number(!!a.is_pinned));
    return list;
  }, [posts, filter, sortMode, searchQuery]);

  return (
    <div className="antialiased min-h-screen selection:bg-[#b8860b] selection:text-[#fcfaf5]" style={{ backgroundColor: colors.creamLight, color: colors.forestGreen }} dir={isRTL ? "rtl" : "ltr"}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap');
        .material-symbols-outlined { font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24; font-family: 'Material Symbols Outlined'; display: inline-block; vertical-align: middle; }
        
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: rgba(11, 67, 53, 0.2); border-radius: 20px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: rgba(11, 67, 53, 0.4); }

        .custom-scrollbar-x::-webkit-scrollbar { height: 4px; }
        .custom-scrollbar-x::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar-x::-webkit-scrollbar-thumb { background-color: rgba(11, 67, 53, 0.2); border-radius: 20px; }
        .custom-scrollbar-x::-webkit-scrollbar-thumb:hover { background-color: rgba(11, 67, 53, 0.4); }
      `}</style>

      <main className="pt-24 md:pt-28 pb-20 px-[20px] md:px-[64px] max-w-[1240px] mx-auto">

        {/* Page header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 md:mb-8">
          <div>
            <p className="font-['JetBrains_Mono'] text-[11px] uppercase tracking-[0.08em] opacity-70 mb-1">FORUM / DISCUSSIONS</p>
            <h1 className="font-['Hanken_Grotesk'] text-3xl font-bold">{t.pageTitle}</h1>
          </div>
          <div className="relative w-full md:w-80">
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.searchPlaceholder}
              className="w-full px-4 py-2.5 rounded-lg border bg-[#fcfaf5] focus:ring-1 transition-all font-['Inter'] text-[14px] outline-none"
              style={{ borderColor: colors.creamDark }}
              onFocus={(e) => { e.currentTarget.style.borderColor = colors.amber; e.currentTarget.style.boxShadow = `0 0 0 1px ${colors.amber}`; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = colors.creamDark; e.currentTarget.style.boxShadow = "none"; }}
              dir={isRTL ? "rtl" : "ltr"}
            />
            <span className={`absolute ${isRTL ? "left-3" : "right-3"} top-1/2 -translate-y-1/2 opacity-60`}>
              <Icon name="search" size={19} />
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6 md:gap-8 items-start">

          {/* Sidebar */}
          <aside className="flex flex-col gap-4 md:gap-6 lg:sticky lg:top-28">
            <button
              onClick={openComposer}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 md:px-5 md:py-3 rounded-lg text-[12px] md:text-[13px] font-bold tracking-[0.03em] font-['Hanken_Grotesk'] transition-all duration-200 border"
              style={{
                backgroundColor: colors.forestGreen,
                color: colors.creamLight,
                borderColor: colors.forestGreen,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = colors.creamLight;
                e.currentTarget.style.color = colors.forestGreen;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = colors.forestGreen;
                e.currentTarget.style.color = colors.creamLight;
              }}
            >
              <Icon name="add" size={18} />
              {t.newPostButton}
            </button>

            {/* Mobile: Horizontal Scrollable Categories */}
            <div className="md:hidden flex flex-col gap-2">
              <p className="font-['JetBrains_Mono'] text-[10px] uppercase tracking-[0.15em] font-bold opacity-50 px-1">
                {t.categoriesLabel}
              </p>
              <div className="flex overflow-x-auto gap-2 pb-3 custom-scrollbar-x -mx-[20px] px-[20px]">
                <button
                  onClick={() => setFilter({ type: "all" })}
                  className="flex-shrink-0 inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-[12px] font-medium transition-colors"
                  style={{
                    backgroundColor: filter.type === "all" ? colors.forestGreen : colors.creamLight,
                    color: filter.type === "all" ? colors.creamLight : colors.forestGreen,
                    borderColor: colors.forestGreen,
                  }}
                >
                  {t.allDiscussions}
                </button>
                {forumCategories.map((cat) => {
                  const isActive = filter.type === "category" && filter.id === cat.category_id;
                  return (
                    <button
                      key={cat.category_id}
                      onClick={() => setFilter(isActive ? { type: "all" } : { type: "category", id: cat.category_id })}
                      className="flex-shrink-0 inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-[12px] font-medium transition-colors"
                      style={{
                        backgroundColor: isActive ? colors.forestGreen : colors.creamLight,
                        color: isActive ? colors.creamLight : colors.forestGreen,
                        borderColor: colors.forestGreen,
                      }}
                    >
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
                      {cat.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Desktop: Vertical Scrollable Categories */}
            <div className="hidden md:flex flex-col gap-1 max-h-48 overflow-y-auto custom-scrollbar pr-2">
              <p className="font-['JetBrains_Mono'] text-[10px] uppercase tracking-[0.15em] font-bold opacity-50 px-3 mb-1">
                {t.categoriesLabel}
              </p>
              {forumCategories.map((cat) => {
                const isActive = filter.type === "category" && filter.id === cat.category_id;
                return (
                  <button
                    key={cat.category_id}
                    onClick={() => setFilter(isActive ? { type: "all" } : { type: "category", id: cat.category_id })}
                    className="flex items-center justify-between px-3 py-2 rounded-lg font-['Inter'] text-[14px] transition-colors"
                    style={{
                      backgroundColor: isActive ? colors.creamMid : "transparent",
                      color: colors.forestGreen,
                      fontWeight: isActive ? 600 : 400,
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) e.currentTarget.style.backgroundColor = colors.creamMid;
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) e.currentTarget.style.backgroundColor = "transparent";
                    }}
                  >
                    <span className="flex items-center gap-2.5">
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
                      {cat.name}
                    </span>
                    <span className="font-['JetBrains_Mono'] text-[11px] opacity-40">{cat.post_count}</span>
                  </button>
                );
              })}
            </div>
          </aside>

          {/* Post list */}
          <div>
            {/* Combined Filter and Sort Controls */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setFilter({ type: "all" })}
                  className="hidden md:inline-flex items-center gap-2 px-4 py-2 rounded-lg font-['Inter'] text-[13px] font-medium transition-all"
                  style={{
                    color: filter.type === "all" ? colors.forestGreen : `${colors.forestGreen}99`,
                  }}
                >
                  <Icon name="forum" size={18} />
                  {t.allDiscussions}
                </button>
                
                {filter.type === "category" && (
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-lg font-['Inter'] text-[12px] md:text-[13px] font-medium"
                    style={{ backgroundColor: colors.creamMid, color: colors.forestGreen }}
                  >
                    <span className="w-2 h-2 md:w-2.5 md:h-2.5 rounded-full" style={{ backgroundColor: categoryOf(filter.id)?.color }} />
                    <span className="truncate max-w-[150px] md:max-w-none">{categoryOf(filter.id)?.name}</span>
                    <button
                      onClick={() => setFilter({ type: "all" })}
                      className="ml-1 opacity-50 hover:opacity-100 transition-opacity"
                    >
                      <Icon name="close" size={16} />
                    </button>
                  </div>
                )}
              </div>

              <select
                value={sortMode}
                onChange={(e) => setSortMode(e.target.value as SortMode)}
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

            {visiblePosts.length === 0 ? (
              <div className="text-center py-16 rounded-xl border" style={{ backgroundColor: colors.creamLight, borderColor: colors.creamDark }}>
                <Icon name="inbox" size={48} />
                <p className="font-['Inter'] text-[14px] mt-3 opacity-70">{t.noResults}</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3 md:gap-4">
                {visiblePosts.map((post) => {
                  const cat = categoryOf(post.category_id);
                  const participants = post.participants || [];

                  return (
                    <Link
                      key={post.post_id}
                      to={`/forum/${post.post_id}`}
                      className="group rounded-xl p-4 md:p-6 border transition-all duration-200"
                      style={{
                        backgroundColor: colors.creamLight,
                        borderColor: colors.creamDark,
                        boxShadow: "0px 4px 20px rgba(11, 67, 53, 0.08)",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "translateY(-2px)";
                        e.currentTarget.style.boxShadow = "0px 8px 30px rgba(11, 67, 53, 0.12)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.boxShadow = "0px 4px 20px rgba(11, 67, 53, 0.08)";
                      }}
                    >
                      <div className="flex items-start gap-3 md:gap-5">
                        {/* Author Avatar - Left (KEPT ORIGINAL IMAGE AVATAR) */}
                        <div className="flex-shrink-0 pt-1">
                          <img
                            src={getAvatarUrl(post.author_name)}
                            alt={post.author_name}
                            className="w-10 h-10 md:w-12 md:h-12 rounded-full object-cover border-2"
                            style={{ borderColor: colors.creamDark }}
                          />
                        </div>

                        {/* Content - Center */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-['Hanken_Grotesk'] text-[15px] md:text-[17px] font-bold group-hover:text-[#b8860b] transition-colors" style={{ color: colors.forestGreen }}>
                              {post.title}
                            </h3>
                            {post.is_pinned && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider font-['JetBrains_Mono']"
                                style={{ backgroundColor: colors.creamMid, color: colors.forestGreen }}
                              >
                                <Icon name="push_pin" size={12} filled /> {t.pinnedLabel}
                              </span>
                            )}
                          </div>

                          <p className="font-['Inter'] text-[12px] md:text-[13px] leading-relaxed line-clamp-2 mb-2 md:mb-3 opacity-70">
                            {post.excerpt}
                          </p>
                        </div>

                        {/* Right Side Column */}
                        <div className={`flex-shrink-0 flex flex-col items-end gap-2 md:gap-3 ${isRTL ? "items-start" : ""}`}>
                          {/* Category Badge */}
                          <div className={`flex items-center gap-1.5 ${isRTL ? "flex-row-reverse" : ""}`}>
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cat?.color }} />
                            <span className="font-['Inter'] text-[10px] font-medium opacity-70">{cat?.name}</span>
                          </div>

                          {/* Participant Avatars Stack + More Button (KEPT ORIGINAL STRUCTURE) */}
                          {participants.length > 0 && (
                            <div className="flex items-center">
                              {participants.slice(0, 4).map((participant, idx) => (
                                <img
                                  key={idx}
                                  src={getAvatarUrl(participant)}
                                  alt={participant}
                                  title={participant}
                                  className={`w-7 h-7 md:w-8 md:h-8 rounded-full object-cover border-2 flex-shrink-0 ${
                                    idx !== 0 ? (isRTL ? "-mr-2" : "-ml-2") : ""
                                  }`}
                                  style={{ borderColor: colors.creamLight }}
                                />
                              ))}

                              {/* Extra three-dots button */}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                }}
                                aria-label="More options"
                                className={`w-7 h-7 md:w-8 md:h-8 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                                  participants.length > 0 ? (isRTL ? "-mr-2" : "-ml-2") : ""
                                }`}
                                style={{
                                  borderColor: colors.creamLight,
                                  backgroundColor: colors.creamMid,
                                  color: colors.forestGreen,
                                }}
                                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = colors.creamDark)}
                                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = colors.creamMid)}
                              >
                                <Icon name="more_horiz" size={16} />
                              </button>
                            </div>
                          )}

                          {/* Comments Count */}
                          <div className={`flex items-center gap-1.5 font-['Inter'] text-[11px] md:text-[12px] opacity-60 ${isRTL ? "flex-row-reverse" : ""}`}>
                            <Icon name="chat_bubble_outline" size={15} />
                            <span>{post.comments_count} {t.comments}</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}

            {visiblePosts.length > 0 && (
              <div className="flex justify-center mt-6 md:mt-8">
                <button 
                  className="inline-flex items-center gap-2 px-5 py-2 md:px-6 md:py-2.5 rounded-lg text-[11px] md:text-[12px] font-bold tracking-[0.03em] font-['Hanken_Grotesk'] transition-all duration-200 border"
                  style={{
                    color: colors.forestGreen,
                    borderColor: colors.forestGreen,
                    backgroundColor: "transparent",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = colors.forestGreen;
                    e.currentTarget.style.color = colors.creamLight;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                    e.currentTarget.style.color = colors.forestGreen;
                  }}
                >
                  <Icon name="expand_more" size={16} />
                  {t.loadMore}
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Composer Modal */}
      {isComposerOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start md:items-center justify-center p-0 md:p-6 overflow-y-auto"
          style={{ backgroundColor: "rgba(11, 67, 53, 0.6)", backdropFilter: "blur(4px)" }}
          onClick={closeComposer}
        >
          <div
            className="w-full md:max-w-xl rounded-none md:rounded-xl border flex flex-col overflow-hidden"
            style={{
              backgroundColor: colors.creamLight,
              borderColor: colors.creamDark,
              boxShadow: "0 20px 60px rgba(0,0,0,0.18)",
              minHeight: "100vh",
            }}
            onClick={(e) => e.stopPropagation()}
            dir={isRTL ? "rtl" : "ltr"}
          >
            <div className="flex items-center justify-between px-4 md:px-6 py-4 md:py-5 border-b flex-shrink-0" style={{ backgroundColor: colors.creamMid, borderColor: colors.creamDark }}>
              <h3 className="font-['Hanken_Grotesk'] text-lg md:text-xl font-bold flex items-center gap-2">
                <Icon name="edit_note" size={22} /> {t.composerTitle}
              </h3>
              <button
                onClick={closeComposer}
                aria-label="Close"
                className="w-9 h-9 flex items-center justify-center rounded-lg transition-colors"
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(11, 67, 53, 0.1)")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
              >
                <Icon name="close" size={22} />
              </button>
            </div>

            <div className="px-4 md:px-6 py-4 md:py-6 flex flex-col gap-4 md:gap-5 flex-1">
              <div>
                <label className="block font-['JetBrains_Mono'] text-[10px] uppercase tracking-[0.1em] font-bold mb-2 opacity-70">
                  {t.composerCategoryLabel}
                </label>
                <select
                  value={composerCategoryId}
                  onChange={(e) => setComposerCategoryId(e.target.value ? Number(e.target.value) : "")}
                  className="w-full px-4 py-3 rounded-lg border bg-[#fcfaf5] font-['Inter'] text-[14px] outline-none transition-all"
                  style={{ borderColor: colors.creamDark }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = colors.amber; e.currentTarget.style.boxShadow = `0 0 0 1px ${colors.amber}`; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = colors.creamDark; e.currentTarget.style.boxShadow = "none"; }}
                >
                  <option value="">{t.composerCategoryPlaceholder}</option>
                  {forumCategories.map((cat) => (
                    <option key={cat.category_id} value={cat.category_id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-['JetBrains_Mono'] text-[10px] uppercase tracking-[0.1em] font-bold mb-2 opacity-70">
                  {t.composerTitleLabel}
                </label>
                <input
                  value={composerTitle}
                  onChange={(e) => setComposerTitle(e.target.value)}
                  placeholder={t.composerTitlePlaceholder}
                  className="w-full px-4 py-3 rounded-lg border bg-[#fcfaf5] font-['Inter'] text-[14px] outline-none transition-all"
                  style={{ borderColor: colors.creamDark }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = colors.amber; e.currentTarget.style.boxShadow = `0 0 0 1px ${colors.amber}`; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = colors.creamDark; e.currentTarget.style.boxShadow = "none"; }}
                />
              </div>

              <div className="flex-1 flex flex-col">
                <label className="block font-['JetBrains_Mono'] text-[10px] uppercase tracking-[0.1em] font-bold mb-2 opacity-70">
                  {t.composerContentLabel}
                </label>
                <textarea
                  value={composerContent}
                  onChange={(e) => setComposerContent(e.target.value)}
                  placeholder={t.composerContentPlaceholder}
                  rows={6}
                  className="w-full flex-1 px-4 py-3 rounded-lg border bg-[#fcfaf5] font-['Inter'] text-[14px] outline-none transition-all resize-none"
                  style={{ borderColor: colors.creamDark }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = colors.amber; e.currentTarget.style.boxShadow = `0 0 0 1px ${colors.amber}`; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = colors.creamDark; e.currentTarget.style.boxShadow = "none"; }}
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 px-4 md:px-6 py-4 md:py-5 border-t flex-shrink-0" style={{ borderColor: colors.creamDark }}>
              <button
                onClick={closeComposer}
                className="px-4 py-2.5 md:px-5 md:py-2.5 rounded-lg text-[13px] font-bold font-['Hanken_Grotesk'] transition-colors border"
                style={{ color: colors.forestGreen, borderColor: colors.forestGreen }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = colors.creamMid)}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
              >
                {t.composerCancel}
              </button>
              <button
                onClick={handlePublish}
                disabled={!canPublish}
                className="inline-flex items-center gap-2 px-5 py-2.5 md:px-6 md:py-2.5 rounded-lg text-[13px] font-bold tracking-[0.05em] font-['Hanken_Grotesk'] transition-all duration-200 border disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: colors.forestGreen,
                  color: colors.creamLight,
                  borderColor: colors.forestGreen,
                }}
                onMouseEnter={(e) => {
                  if (canPublish) {
                    e.currentTarget.style.backgroundColor = colors.creamLight;
                    e.currentTarget.style.color = colors.forestGreen;
                  }
                }}
                onMouseLeave={(e) => {
                  if (canPublish) {
                    e.currentTarget.style.backgroundColor = colors.forestGreen;
                    e.currentTarget.style.color = colors.creamLight;
                  }
                }}
              >
                <Icon name="send" size={16} filled />
                {t.composerPublish}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Forum;