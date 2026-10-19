import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Hero from "../components/Hero";
import ScholarImage from "../components/ScholarImage";
import { useLang } from "../context/LanguageContext";
import { useAuth } from "../context/AuthContext";
import { fetchHomeData } from "../api/homeApi";
import { searchGlobal, SearchResponse } from "../api/searchApi";

/* ------------------------------------------------------------------ */
/*  API DATA SHAPES                                                   */
/* ------------------------------------------------------------------ */
interface ApiScholar {
  scholar_id: number;
  version_id: number;
  canonical_name: string | null;
  century_gregorian_start: number | null;
  century_gregorian_end: number | null;
  region_name: string | null;
  discipline_name: string | null;
  image_url: string | null;
  biography: string | null;
  language_code: string;
  isFallback?: boolean;
}

interface ApiRecentScholar {
  scholar_id: number;
  version_id: number;
  canonical_name: string | null;
  century_gregorian_start: number | null;
  image_url: string | null;
  created_at: string;
  language_code: string;
  isFallback?: boolean;
}

interface ApiDiscipline {
  discipline_id: number;
  name: string;
  image_url: string | null;
  count: number;
}

interface ApiWork {
  work_id: number;
  scholar_id: number;
  work_lang: string;
  title: string;
  year: number | null;
  format: string;
  media_url: string | null;
  description: string | null;
}

interface ApiStats {
  scholars: number;
  manuscripts: number;
  disciplines: number;
  centuries: number;
}

interface ApiPopularPost {
  post_id: number;
  title: string;
  excerpt: string;
  like_count: number;
  comment_count: number;
  author: {
    id: number;
    username: string;
    name: string | null;
    profile_picture: string | null;
  };
  category: {
    category_id: number;
    name: string;
  } | null;
  created_at: string;
}

// "eras" is intentionally not listed here anymore (section removed).
// If the backend still sends it, it is simply ignored.
interface HomeApiData {
  featuredScholars: ApiScholar[];
  recentScholars: ApiRecentScholar[];
  disciplines: ApiDiscipline[];
  featuredWorks: ApiWork[];
  stats: ApiStats;
  popularForumPosts: ApiPopularPost[];
}

/* ------------------------------------------------------------------ */
/*  Discipline & Work Icons                                           */
/* ------------------------------------------------------------------ */
const DISCIPLINE_ICONS: Record<string, string> = {
  theolog: "auto_stories",
  jurisprudence: "gavel",
  philosoph: "psychology",
  histor: "history",
  medic: "medical_services",
  literature: "menu_book",
};

const getDisciplineIcon = (name: string): string => {
  const lower = name.toLowerCase();
  const key = Object.keys(DISCIPLINE_ICONS).find((k) => lower.includes(k));
  return key ? DISCIPLINE_ICONS[key] : "school";
};

/* ------------------------------------------------------------------ */
/*  ENHANCED WORK COVER COMPONENT                                     */
/* ------------------------------------------------------------------ */
const WorkCover: React.FC<{ work: ApiWork; className?: string }> = ({ work, className = "" }) => {
  const [broken, setBroken] = useState(false);

  if (work.media_url && !broken) {
    return (
      <img
        src={work.media_url}
        alt={work.title ?? ""}
        className={className}
        loading="lazy"
        decoding="async"
        onError={() => setBroken(true)}
      />
    );
  }

  const getGradientColors = () => {
    const format = work.format.toUpperCase();
    if (['BOOK', 'MANUSCRIPT', 'COMMENTARY'].includes(format)) return 'from-[#8B6914] to-[#5C4D0F]';
    if (['ARTICLE', 'RESEARCH', 'TREATISE'].includes(format)) return 'from-[#1e3a5f] to-[#0f1f33]';
    if (['FATWA', 'SERMON', 'LECTURE'].includes(format)) return 'from-[#1e4d3a] to-[#0f291f]';
    if (['POEM', 'LETTER'].includes(format)) return 'from-[#4a1942] to-[#2a0f26]';
    if (['SOFTWARE', 'DEVICE', 'INVENTION'].includes(format)) return 'from-[#374151] to-[#1f2937]';
    return 'from-[#1e4d3a] to-[#173a2c]';
  };

  const getIcon = () => {
    const format = work.format.toUpperCase();
    if (['MANUSCRIPT', 'BOOK'].includes(format)) return 'history_edu';
    if (format === 'POEM') return 'auto_stories';
    if (format === 'LETTER') return 'mail';
    if (format === 'FATWA') return 'gavel';
    if (format === 'LECTURE') return 'record_voice_over';
    if (format === 'SOFTWARE') return 'code';
    if (format === 'MAP') return 'map';
    if (['ARTICLE', 'RESEARCH', 'TREATISE'].includes(format)) return 'description';
    return 'menu_book';
  };

  return (
    <div
      className={`${className} flex flex-col items-center justify-center gap-3 bg-gradient-to-br ${getGradientColors()} px-6 text-center group-hover:scale-105 transition-transform duration-500`}
    >
      <span className="material-symbols-outlined text-[48px] text-[#e5d5a8] opacity-90">
        {getIcon()}
      </span>
      <span className="font-['JetBrains_Mono'] text-[11px] uppercase tracking-widest text-[#e5d5a8]/80 line-clamp-2 max-w-[80%]">
        {work.title}
      </span>
      {work.year && (
        <span className="font-['Inter'] text-[10px] text-[#e5d5a8]/60">
          {work.year}
        </span>
      )}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  UI COMPONENTS                                                     */
/* ------------------------------------------------------------------ */
const FadeIn: React.FC<{ children: React.ReactNode; delay?: number; className?: string }> = ({
  children,
  delay = 0,
  className = "",
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const currentRef = ref.current;
    if (!currentRef) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(currentRef);
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -50px 0px" }
    );

    observer.observe(currentRef);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      } ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
};

const Skeleton: React.FC<{ className?: string }> = ({ className = "" }) => (
  <div className={`animate-pulse bg-[#1e4d3a]/10 rounded ${className}`} />
);

/* ------------------------------------------------------------------ */
/*  MAIN COMPONENT                                                    */
/* ------------------------------------------------------------------ */
const Home: React.FC = () => {
  const { lang, t } = useLang();
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const isRTL = lang === "AR";

  const [homeData, setHomeData] = useState<HomeApiData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResponse | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const [dropdownRect, setDropdownRect] = useState<{ top: number; left: number; width: number } | null>(null);
  const [showAllDisciplines, setShowAllDisciplines] = useState(false);

  useEffect(() => {
    if (!showDropdown || !searchRef.current) return;
    const updateRect = () => {
      const rect = searchRef.current!.getBoundingClientRect();
      setDropdownRect({
        top: rect.bottom + 8,
        left: rect.left,
        width: rect.width,
      });
    };
    updateRect();
    window.addEventListener("scroll", updateRect, true);
    window.addEventListener("resize", updateRect);
    return () => {
      window.removeEventListener("scroll", updateRect, true);
      window.removeEventListener("resize", updateRect);
    };
  }, [showDropdown]);

  const loadHomeData = () => {
    setLoading(true);
    setError(null);
    fetchHomeData(lang)
      .then((data: HomeApiData) => setHomeData(data))
      .catch((err: Error) => setError(err.message || "Something went wrong."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadHomeData();
  }, [lang]);

  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults(null);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const data = await searchGlobal(searchQuery, lang);
        setSearchResults(data);
      } catch (err) {
        console.error("Search failed:", err);
      } finally {
        setIsSearching(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery, lang]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const insideInput = searchRef.current?.contains(target);
      const insideDropdown = dropdownRef.current?.contains(target);
      if (!insideInput && !insideDropdown) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (location.hash) {
      const element = document.getElementById(location.hash.substring(1));
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: "smooth" });
        }, 100);
      }
    }
  }, [location]);

 const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const diffTime = Date.now() - date.getTime();
  const diffDays = Math.floor(diffTime / 86400000);
  const ago = (key: string, n: number) => t(key).replace("{n}", String(n));

  if (diffDays < 1) {
    const diffHours = Math.floor(diffTime / 3600000);
    if (diffHours < 1) return ago("home.minutesAgo", Math.max(0, Math.floor(diffTime / 60000)));
    return ago("home.hoursAgo", diffHours);
  }
  if (diffDays === 1) return t("home.yesterday");
  if (diffDays < 7) return ago("home.daysAgo", diffDays);
  if (diffDays < 30) return ago("home.weeksAgo", Math.floor(diffDays / 7));

  try {
    return date.toLocaleDateString(lang.toLowerCase());
  } catch {
    return date.toLocaleDateString();
  }
};

  const archiveStats = homeData ? [
    { icon: "groups", value: `${homeData.stats.scholars}+`, labelKey: "home.statScholars" },
    { icon: "menu_book", value: `${homeData.stats.manuscripts}+`, labelKey: "home.statManuscripts" },
    { icon: "category", value: `${homeData.stats.disciplines}`, labelKey: "home.statDisciplines" },
    { icon: "history_edu", value: `${homeData.stats.centuries}+`, labelKey: "home.statCenturies" },
  ] : [];

  const featuredScholars = homeData?.featuredScholars ?? [];
  const recentScholars = homeData?.recentScholars ?? [];
  const disciplines = homeData?.disciplines ?? [];
  const featuredWorks = homeData?.featuredWorks ?? [];
  const popularForumPosts = homeData?.popularForumPosts ?? [];

  const dropdownContent =
    showDropdown && searchQuery.trim().length >= 2 && searchResults && dropdownRect
      ? createPortal(
          <>
            <div className="fixed inset-0 z-[999998]" onClick={() => setShowDropdown(false)} />
            <div
              ref={dropdownRef}
              className="fixed bg-[#fbf9f4] border-2 border-[#1e4d3a] rounded-xl shadow-2xl z-[999999] overflow-y-auto text-left"
              dir="ltr"
              style={{
                top: dropdownRect.top,
                left: dropdownRect.left,
                width: dropdownRect.width,
                maxHeight: "min(350px, calc(100vh - 300px))",
              }}
            >
              {isSearching ? (
                <div className="p-6 text-center text-[#1e4d3a]/60 font-['Inter']">{t("home.searching")}</div>
              ) : (
                <div className="p-2">
                  {searchResults.scholars && searchResults.scholars.length > 0 && (
                    <div className="mb-2">
                      <div className="px-3 py-1.5 text-[10px] font-['JetBrains_Mono'] uppercase tracking-widest text-[#C9A84C] font-bold">{t("home.searchScholars")}</div>
                      {searchResults.scholars.map((item, idx) => (
                        <Link
                          key={`s-${idx}`}
                          to={item.scholar_id ? `/scholars/${item.scholar_id}?lang=${item.lang}` : '#'}
                          onClick={(e) => {
                            if (!item.scholar_id) e.preventDefault();
                            setShowDropdown(false);
                            setSearchQuery('');
                          }}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-[#1e4d3a]/5 transition-colors group cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[#1e4d3a] text-[18px]">person</span>
                          <div>
                            <div className="font-['Hanken_Grotesk'] text-[14px] font-semibold text-[#1e4d3a] group-hover:text-[#C9A84C]">{item.title}</div>
                            <div className="font-['Inter'] text-[11px] text-[#1e4d3a]/60">{item.subtitle}</div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                  {searchResults.works && searchResults.works.length > 0 && (
                    <div className="mb-2 border-t border-[#1e4d3a]/10 pt-2">
                      <div className="px-3 py-1.5 text-[10px] font-['JetBrains_Mono'] uppercase tracking-widest text-[#C9A84C] font-bold">{t("home.searchWorks")}</div>
                      {searchResults.works.map((item, idx) => (
                        <Link
                          key={`w-${idx}`}
                          to={item.scholar_id ? `/scholars/${item.scholar_id}?lang=${item.lang}&focus=${item.focus_type}-${item.focus_id}` : '#'}
                          onClick={(e) => {
                            if (!item.scholar_id) e.preventDefault();
                            setShowDropdown(false);
                            setSearchQuery('');
                          }}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-[#1e4d3a]/5 transition-colors group cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[#1e4d3a] text-[18px]">menu_book</span>
                          <div>
                            <div className="font-['Hanken_Grotesk'] text-[14px] font-semibold text-[#1e4d3a] group-hover:text-[#C9A84C]">{item.title}</div>
                            <div className="font-['Inter'] text-[11px] text-[#1e4d3a]/60">{item.subtitle}</div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                  {searchResults.media && searchResults.media.length > 0 && (
                    <div className="mb-2 border-t border-[#1e4d3a]/10 pt-2">
                      <div className="px-3 py-1.5 text-[10px] font-['JetBrains_Mono'] uppercase tracking-widest text-[#C9A84C] font-bold">{t("home.searchMedia")}</div>
                      {searchResults.media.map((item, idx) => (
                        <Link
                          key={`m-${idx}`}
                          to={item.scholar_id ? `/scholars/${item.scholar_id}?lang=${item.lang}&focus=${item.focus_type}-${item.focus_id}` : '#'}
                          onClick={(e) => {
                            if (!item.scholar_id) e.preventDefault();
                            setShowDropdown(false);
                            setSearchQuery('');
                          }}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-[#1e4d3a]/5 transition-colors group cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[#1e4d3a] text-[18px]">image</span>
                          <div>
                            <div className="font-['Hanken_Grotesk'] text-[14px] font-semibold text-[#1e4d3a] group-hover:text-[#C9A84C]">{item.title}</div>
                            <div className="font-['Inter'] text-[11px] text-[#1e4d3a]/60">{item.subtitle}</div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                  {searchResults.posts && searchResults.posts.length > 0 && (
                    <div className="mb-2 border-t border-[#1e4d3a]/10 pt-2">
                      <div className="px-3 py-1.5 text-[10px] font-['JetBrains_Mono'] uppercase tracking-widest text-[#C9A84C] font-bold">{t("home.searchDiscussions")}</div>
                      {searchResults.posts.map((item, idx) => (
                        <Link
                          key={`p-${idx}`}
                          to={item.post_id ? `/forum/${item.post_id}` : '#'}
                          onClick={(e) => {
                            if (!item.post_id) e.preventDefault();
                            setShowDropdown(false);
                            setSearchQuery('');
                          }}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-[#1e4d3a]/5 transition-colors group cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[#1e4d3a] text-[18px]">forum</span>
                          <div className="min-w-0">
                            <div className="font-['Hanken_Grotesk'] text-[14px] font-semibold text-[#1e4d3a] group-hover:text-[#C9A84C] truncate">{item.title}</div>
                            <div className="font-['Inter'] text-[11px] text-[#1e4d3a]/60 truncate">{item.subtitle}</div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                  {(!searchResults.scholars || searchResults.scholars.length === 0) &&
                    (!searchResults.works || searchResults.works.length === 0) &&
                    (!searchResults.media || searchResults.media.length === 0) &&
                    (!searchResults.posts || searchResults.posts.length === 0) && (
                      <div className="p-6 text-center text-[#1e4d3a]/60 font-['Inter'] text-sm">
                        {t("home.noResultsPrefix")} "{searchQuery}"
                      </div>
                    )}
                </div>
              )}
            </div>
          </>,
          document.body
        )
      : null;

  return (
    <div className="antialiased min-h-screen selection:bg-[#C9A84C] selection:text-[#1e4d3a] flex flex-col bg-[#fbf9f4]">
      {/* Fonts are now loaded from index.html (see instructions). Only local CSS stays here. */}
      <style>{`
        .material-symbols-outlined { font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24; font-family: 'Material Symbols Outlined'; display: inline-block; vertical-align: middle; }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in { animation: fade-in 0.6s ease-out; }
      `}</style>

      <Hero />

      {error && (
        <div className="max-w-[1280px] mx-auto px-[20px] md:px-[64px] pt-6 w-full">
          <div className="flex items-center justify-between gap-4 bg-[#fdecea] border border-[#b3261e]/30 text-[#7a1f1f] rounded-lg px-4 py-3 text-sm font-['Inter']">
            <span>{t("home.loadError")}</span>
<button onClick={loadHomeData} className="shrink-0 font-semibold underline hover:no-underline">{t("home.retry")}</button>
          </div>
        </div>
      )}

      <main className="flex-grow pt-16 md:pt-0" dir={isRTL ? "rtl" : "ltr"}>
        {/* 1. Feature Pillars */}
        <FadeIn>
          <section className="px-[20px] md:px-[64px] max-w-[1040px] mx-auto py-14 md:py-16">
            <div className="flex flex-col md:flex-row justify-between gap-10 md:gap-6 text-center">
              {[
                { icon: "library_books", titleKey: "home.pillar1Title", descKey: "home.pillar1Desc" },
                { icon: "auto_stories", titleKey: "home.pillar2Title", descKey: "home.pillar2Desc" },
                { icon: "verified", titleKey: "home.pillar3Title", descKey: "home.pillar3Desc" },
                { icon: "explore", titleKey: "home.pillar4Title", descKey: "home.pillar4Desc" },
              ].map((card, i) => (
                <FadeIn key={i} delay={100 + i * 100} className="flex-1 flex flex-col items-center gap-3 group cursor-pointer">
                  <div className="mb-0.5 transition-transform duration-300 group-hover:-translate-y-1">
                    <span className="material-symbols-outlined text-[22px] text-[#1e4d3a]" style={{ fontVariationSettings: "'FILL' 0, 'wght' 100" }}>{card.icon}</span>
                  </div>
                  <div>
                    <h4 className="font-['Inter'] text-[11px] leading-[16px] text-[#1e4d3a] uppercase tracking-[0.12em] mb-1.5 font-semibold">{t(card.titleKey)}</h4>
                    <p className="font-['Inter'] text-[13px] leading-[20px] text-[#1e4d3a]/60">{t(card.descKey)}</p>
                  </div>
                </FadeIn>
              ))}
            </div>
          </section>
        </FadeIn>

        {/* 2. Welcome & Search Section */}
        <FadeIn>
          <section className="py-16 px-[20px] md:px-[64px] bg-[#fbf9f4] max-w-[1280px] mx-auto text-center flex flex-col items-center">
            {user ? (
              <div className="mb-6 animate-fade-in">
                <div className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-[#C9A84C]/20 to-[#C9A84C]/10 border-2 border-[#C9A84C]/40 rounded-2xl mb-6">
                  <span className="material-symbols-outlined text-[28px] text-[#C9A84C]">waving_hand</span>
                  <span className="font-['JetBrains_Mono'] text-[13px] uppercase tracking-[0.15em] font-bold text-[#C9A84C]">
                    {t("home.welcomeBack")}
                  </span>
                </div>
                <h2 className="font-['Hanken_Grotesk'] text-4xl md:text-5xl font-bold text-[#1e4d3a] mb-2">
                  {user.name || user.username?.split(' ')[0]}
                  <span className="text-[#C9A84C]">!</span>
                </h2>
                <p className="font-['Inter'] text-[16px] text-[#1e4d3a]/70">
                  {t("home.readyToContinue")}
                </p>
              </div>
            ) : (
              <>
                <h2 className="font-['JetBrains_Mono'] text-[11px] leading-[16px] text-[#C9A84C] uppercase tracking-[0.2em] font-bold mb-4">{t("home.tagline")}</h2>
                <h3 className="font-['Hanken_Grotesk'] text-4xl md:text-5xl leading-tight text-[#1e4d3a] font-bold mb-6 max-w-4xl">{t("home.title")}</h3>
              </>
            )}

            <p className="font-['Inter'] text-[18px] leading-[1.7] text-[#1e4d3a]/80 mb-10 max-w-3xl">
              {user && isRTL ? t("home.subtitleLoggedIn") : t("home.subtitle")}
            </p>

            <div ref={searchRef} className="w-full max-w-2xl relative mb-10">
              <input
                className="w-full px-6 py-4 rounded-xl border-2 border-[#1e4d3a] bg-[#fbf9f4] focus:border-[#C9A84C] focus:ring-1 focus:ring-[#C9A84C] transition-all font-['Inter'] text-[15px] shadow-sm outline-none text-[#1e4d3a]"
                placeholder={t("home.searchPlaceholder")}
                type="text"
                dir={isRTL ? "rtl" : "ltr"}
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setShowDropdown(true); }}
                onFocus={() => searchQuery.trim().length >= 2 && setShowDropdown(true)}
              />
              <button className={`absolute ${isRTL ? "left-5" : "right-5"} top-1/2 -translate-y-1/2 text-[#1e4d3a] hover:text-[#C9A84C] transition-colors`}>
                <span className={`material-symbols-outlined text-[22px] ${isSearching ? "animate-spin" : ""}`}>
                  {isSearching ? "hourglass_empty" : "search"}
                </span>
              </button>
            </div>

            <Link to="/scholars" className="inline-flex items-center gap-2 px-8 py-3.5 bg-[#1e4d3a] text-[#fbf9f4] border-2 border-[#1e4d3a] rounded-lg text-[13px] font-bold tracking-[0.05em] font-['Hanken_Grotesk'] hover:bg-[#fbf9f4] hover:text-[#1e4d3a] transition-all duration-300">
              {t("home.exploreButton")}
              <span className="material-symbols-outlined text-[18px]">{isRTL ? "arrow_back" : "arrow_forward"}</span>
            </Link>
          </section>
        </FadeIn>

        {/* 3. Featured Scholars */}
        <FadeIn>
          <section className="py-20 px-[20px] md:px-[64px] max-w-[1280px] mx-auto">
            <div className="flex justify-between items-end mb-12 pb-4 border-b-2 border-[#1e4d3a]">
              <div>
                <p className="font-['JetBrains_Mono'] text-[10px] uppercase tracking-[0.15em] font-bold text-[#C9A84C] mb-2">{t("home.featuredLabel")}</p>
                <h2 className="font-['Hanken_Grotesk'] text-3xl font-bold text-[#1e4d3a]">{t("home.meetTheGiants")}</h2>
              </div>
              <Link to="/scholars" className="font-['JetBrains_Mono'] text-[12px] font-semibold text-[#1e4d3a] hover:text-[#C9A84C] flex items-center gap-1.5 transition-colors">
                {t("home.viewAll")}
                <span className="material-symbols-outlined text-[16px]">{isRTL ? "arrow_back" : "arrow_forward"}</span>
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {loading ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-[#F5F3EC] rounded-2xl overflow-hidden border border-[#1e4d3a]/10">
                  <Skeleton className="h-64 w-full rounded-none" />
                  <div className="p-6 space-y-3"><Skeleton className="h-5 w-3/4" /><Skeleton className="h-3 w-1/2" /><Skeleton className="h-3 w-full" /><Skeleton className="h-3 w-full" /></div>
                </div>
              )) : featuredScholars.map((scholar, index) => (
                <FadeIn key={scholar.version_id} delay={100 + index * 100} className="h-full">
                  <Link to={`/scholars/${scholar.scholar_id}?lang=${scholar.language_code}`} className="group flex flex-col h-full bg-[#F5F3EC] rounded-2xl overflow-hidden border border-[#1e4d3a]/10 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                    <div className="relative h-64 shrink-0 bg-[#e5d5a8]">
                      <ScholarImage src={scholar.image_url} alt={scholar.canonical_name ?? ""} className="w-full h-full object-cover" />
                      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#1e4d3a]/90 to-transparent">
                        <span className="font-['JetBrains_Mono'] text-[10px] text-[#C9A84C] tracking-widest uppercase">{scholar.region_name}</span>
                      </div>
                    </div>
                    <div className="p-6 flex flex-col flex-1">
                      <h3 className="font-['Hanken_Grotesk'] text-xl font-bold text-[#1e4d3a] mb-2">{scholar.canonical_name}</h3>
                      <p className="font-['JetBrains_Mono'] text-[11px] text-[#C9A84C] font-semibold mb-3">{scholar.century_gregorian_start}-{scholar.century_gregorian_end} • {scholar.discipline_name}</p>
                      <p className="font-['Inter'] text-sm text-[#1e4d3a]/80 leading-relaxed line-clamp-3">{scholar.biography}</p>
                    </div>
                  </Link>
                </FadeIn>
              ))}
            </div>
          </section>
        </FadeIn>

        {/* 4. Recently Added */}
        <FadeIn>
          <section className="py-20 px-[20px] md:px-[64px] bg-[#F5F3EC] border-y-2 border-[#1e4d3a]/10">
            <div className="max-w-[1280px] mx-auto">
              <div className="flex justify-between items-center mb-12">
                <h2 className="font-['Hanken_Grotesk'] text-2xl md:text-3xl font-bold text-[#1e4d3a]">{t("home.recentLabel")}</h2>
                <Link to="/scholars" className="font-['JetBrains_Mono'] text-[12px] font-semibold text-[#1e4d3a] hover:text-[#C9A84C] flex items-center gap-1.5 transition-colors">
                  {t("home.viewAll")}
                  <span className="material-symbols-outlined text-[16px]">{isRTL ? "arrow_back" : "arrow_forward"}</span>
                </Link>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                {loading ? Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="text-center">
                    <Skeleton className="w-28 h-28 md:w-32 md:h-32 mx-auto rounded-full mb-4" />
                    <Skeleton className="h-4 w-24 mx-auto mb-2" />
                    <Skeleton className="h-3 w-16 mx-auto" />
                  </div>
                )) : recentScholars.map((scholar, index) => (
                  <FadeIn key={scholar.version_id} delay={100 + index * 100} className="group text-center">
                    <Link to={`/scholars/${scholar.scholar_id}?lang=${scholar.language_code}`}>
                      <div className="w-28 h-28 md:w-32 md:h-32 mx-auto rounded-full overflow-hidden border-2 border-[#1e4d3a] mb-4 bg-[#fbf9f4]">
                        <ScholarImage src={scholar.image_url} alt={scholar.canonical_name ?? ""} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                      </div>
                      <h3 className="font-['Hanken_Grotesk'] text-base font-semibold text-[#1e4d3a] mb-1">{scholar.canonical_name}</h3>
                      <p className="font-['JetBrains_Mono'] text-[10px] text-[#C9A84C] font-semibold mb-1">
                        {scholar.century_gregorian_start
  ? t("home.centuryCE").replace("{n}", String(scholar.century_gregorian_start))
  : t("home.unknownCentury")}
                      </p>
                      <p className="font-['Inter'] text-xs text-[#1e4d3a]/60">{formatDate(scholar.created_at)}</p>
                    </Link>
                  </FadeIn>
                ))}
              </div>
            </div>
          </section>
        </FadeIn>

        {/* 5. Why Oulamauna */}
        <FadeIn>
          <section className="py-20 px-[20px] md:px-[64px] max-w-[1280px] mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.3fr_auto] gap-12 lg:gap-10 items-center">
              <FadeIn delay={100} className={isRTL ? "text-right" : "text-left"}>
                <p className="font-['JetBrains_Mono'] text-[10px] uppercase tracking-[0.15em] font-bold text-[#C9A84C] mb-4">{t("home.whyTagline")}</p>
                <h2 className="font-['Hanken_Grotesk'] text-3xl md:text-[34px] leading-tight font-bold text-[#1e4d3a] mb-5">
                  {t("home.whyTitleLine1")}<br />{t("home.whyTitleLine2")}
                </h2>
                <p className="font-['Inter'] text-[14px] leading-[1.7] text-[#1e4d3a]/70 mb-6">{t("home.whyDescription")}</p>
                <ul className="flex flex-col gap-3 mb-8">
                  {[1, 2, 3, 4].map((i) => (
                    <li key={i} className={`flex items-center gap-2.5 font-['Inter'] text-[13px] text-[#1e4d3a]/80 ${isRTL ? "flex-row-reverse" : ""}`}>
                      <span className="material-symbols-outlined text-[16px] text-[#C9A84C] flex-shrink-0">check_circle</span>
                      {t(`home.whyBullet${i}`)}
                    </li>
                  ))}
                </ul>
                <Link to="/about" className="inline-flex items-center gap-2 px-6 py-3 border-2 border-[#1e4d3a] rounded-lg text-[12px] font-bold tracking-[0.05em] font-['Hanken_Grotesk'] text-[#1e4d3a] hover:bg-[#1e4d3a] hover:text-[#fbf9f4] transition-all duration-300">
                  {t("home.whyCtaButton")}
                  <span className="material-symbols-outlined text-[16px]">{isRTL ? "arrow_back" : "arrow_forward"}</span>
                </Link>
              </FadeIn>
              <FadeIn delay={200} className="rounded-2xl overflow-hidden h-[360px] md:h-[420px] bg-[#F5F3EC]">
                <img
                  src="https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=800&h=1000&fit=crop&auto=format&q=70"
                  alt="Why Oulamauna"
                  className="w-full h-full object-cover"
                  loading="lazy"
                  decoding="async"
                />
              </FadeIn>
              <FadeIn delay={300} className="flex flex-col gap-7 lg:pl-4">
                {(loading ? Array.from({ length: 4 }) : archiveStats).map((stat: any, i) => (
                  <div key={i} className={`flex items-center gap-4 group ${isRTL ? "flex-row-reverse" : ""}`}>
                    <div className="w-11 h-11 flex-shrink-0 rounded-full border border-[#C9A84C]/50 flex items-center justify-center group-hover:border-[#C9A84C] group-hover:bg-[#f6efdc] transition-colors duration-300">
                      {loading ? <Skeleton className="w-5 h-5 rounded-full" /> : (
                        <span className="material-symbols-outlined text-[18px] text-[#C9A84C]" style={{ fontVariationSettings: "'FILL' 0, 'wght' 200" }}>{stat.icon}</span>
                      )}
                    </div>
                    <div className={isRTL ? "text-right" : "text-left"}>
                      {loading ? (<><Skeleton className="h-6 w-14 mb-1" /><Skeleton className="h-3 w-20" /></>) : (<>
                        <div className="font-['Hanken_Grotesk'] text-2xl md:text-[26px] font-bold text-[#1e4d3a] leading-tight whitespace-nowrap">{stat.value}</div>
                        <div className="font-['Inter'] text-[13px] text-[#1e4d3a]/60 whitespace-nowrap">{t(stat.labelKey)}</div>
                      </>)}
                    </div>
                  </div>
                ))}
              </FadeIn>
            </div>
          </section>
        </FadeIn>

        {/* 6. Featured Works & Manuscripts */}
        <FadeIn>
          <section id="works" className="scroll-mt-32 py-20 px-[20px] md:px-[64px] max-w-[1280px] mx-auto">
            <h2 className="font-['Hanken_Grotesk'] text-3xl font-bold text-[#1e4d3a] text-center mb-12">{t("home.worksLabel")}</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {loading ? Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-[#F5F3EC] rounded-2xl overflow-hidden border border-[#1e4d3a]/10">
                  <Skeleton className="w-full h-56 rounded-none" />
                  <div className="p-6 space-y-3"><Skeleton className="h-4 w-16" /><Skeleton className="h-5 w-2/3" /><Skeleton className="h-3 w-1/3" /><Skeleton className="h-3 w-full" /></div>
                </div>
              )) : featuredWorks.map((work, index) => (
                <FadeIn key={work.work_id} delay={100 + index * 150} className="h-full">
                  <Link
                    to={`/scholars/${work.scholar_id}?lang=${work.work_lang}&focus=work-${work.work_id}`}
                    className="h-full flex flex-col bg-[#F5F3EC] rounded-2xl overflow-hidden border border-[#1e4d3a]/10 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group"
                  >
                    <WorkCover work={work} className="w-full h-56 object-cover shrink-0" />
                    <div className="p-6 flex flex-col flex-1">
                      <span className="inline-block w-fit px-3 py-1 bg-[#e5d5a8]/30 border border-[#1e4d3a]/20 rounded text-[10px] font-['JetBrains_Mono'] font-bold text-[#1e4d3a] mb-3">{work.format}</span>
                      <h3 className="font-['Hanken_Grotesk'] text-xl font-bold text-[#1e4d3a] mb-1">{work.title}</h3>
                      <p className="font-['JetBrains_Mono'] text-[11px] text-[#C9A84C] font-semibold mb-3">{work.year}</p>
                      <p className="font-['Inter'] text-sm text-[#1e4d3a]/80 leading-relaxed line-clamp-3">{work.description}</p>
                    </div>
                  </Link>
                </FadeIn>
              ))}
            </div>
          </section>
        </FadeIn>

        {/* 7. Disciplines Grid (Eras section removed) */}
        <FadeIn>
          <section id="disciplines" className="scroll-mt-32 py-20 px-[20px] md:px-[64px] max-w-[1280px] mx-auto">
            <h2 className="font-['Hanken_Grotesk'] text-3xl font-bold text-[#1e4d3a] text-center mb-4">{t("home.disciplinesLabel")}</h2>
            <p className="font-['Inter'] text-[15px] text-[#1e4d3a]/60 text-center mb-12 max-w-2xl mx-auto">
              {t("home.disciplinesSubtitle")}
            </p>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {loading ? Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="p-6 bg-[#fcfaf5] rounded-[12px] border border-[#1e4d3a]/20">
                  <Skeleton className="w-7 h-7 rounded-[6px] mb-4" /><Skeleton className="h-4 w-20 mb-2" /><Skeleton className="h-4 w-12" />
                </div>
              )) : (
                disciplines.slice(0, showAllDisciplines ? disciplines.length : 6).map((disc, index) => (
                  <FadeIn key={disc.discipline_id} delay={50 + index * 50}>
                    <Link
                      to={`/scholars?discipline=${disc.name}`}
                      className="group block p-6 bg-[#fcfaf5] rounded-[12px] border border-[#1e4d3a] shadow-[0px_4px_20px_rgba(30,77,58,0.08)] hover:shadow-[0px_6px_24px_rgba(30,77,58,0.12)] hover:-translate-y-1 transition-all duration-300 h-full flex flex-col"
                      style={{ backgroundColor: '#fcfaf5', minHeight: '280px' }}
                    >
                      <div className="w-full h-24 mb-4 rounded-[6px] overflow-hidden bg-[#f6efdc] border border-[#1e4d3a]/10 group-hover:border-[#1e4d3a] transition-colors duration-300 flex-shrink-0">
                        {disc.image_url ? (
                          <img
                            src={disc.image_url}
                            alt={disc.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                            decoding="async"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="material-symbols-outlined text-[32px] text-[#1e4d3a]/40">{getDisciplineIcon(disc.name)}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col flex-grow">
                        <div className="font-['Hanken_Grotesk'] text-[15px] font-semibold text-[#1e4d3a] mb-2 group-hover:text-[#1e4d3a] transition-colors line-clamp-2 min-h-[40px]">
                          {disc.name}
                        </div>
                        <div className="inline-flex items-baseline gap-1.5 mt-auto">
                          <span className="font-['Hanken_Grotesk'] text-xl font-bold text-[#1e4d3a] group-hover:text-[#1e4d3a] transition-colors">{disc.count}</span>
                          <span className="font-['Inter'] text-[11px] text-[#1e4d3a]/70 group-hover:text-[#1e4d3a] transition-colors">{t("home.scholarsCount")}</span>
                        </div>
                      </div>
                    </Link>
                  </FadeIn>
                ))
              )}
            </div>

            {disciplines.length > 6 && (
              <div className="flex justify-center mt-12">
                <button
                  onClick={() => setShowAllDisciplines(!showAllDisciplines)}
                  className="inline-flex items-center gap-2 px-8 py-3 bg-transparent border-2 border-[#1e4d3a] text-[#1e4d3a] rounded-lg text-[13px] font-bold tracking-[0.05em] font-['Hanken_Grotesk'] hover:bg-[#1e4d3a] hover:text-[#fbf9f4] transition-all duration-300"
                >
                  {showAllDisciplines ? (
                    <>
                      <span className="material-symbols-outlined text-[18px]">expand_less</span>
                      {t("home.showLess")}
                    </>
                  ) : (
                    <>
                      {t("home.showMore")}
                      <span className="material-symbols-outlined text-[18px]">expand_more</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </section>
        </FadeIn>

        {/* 8. Popular Forum Posts */}
        {popularForumPosts.length > 0 && (
          <FadeIn>
            <section className="py-20 px-[20px] md:px-[64px] bg-[#F5F3EC] border-y-2 border-[#1e4d3a]/10">
              <div className="max-w-[1280px] mx-auto">
                <div className="flex justify-between items-end mb-12 pb-4 border-b-2 border-[#1e4d3a]">
                  <div>
                    <p className="font-['JetBrains_Mono'] text-[10px] uppercase tracking-[0.15em] font-bold text-[#C9A84C] mb-2">{t("home.popularLabel")}</p>
                    <h2 className="font-['Hanken_Grotesk'] text-3xl font-bold text-[#1e4d3a]">
                      {t("home.popularDiscussionsTitle")}
                    </h2>
                  </div>
                  <Link to="/forum" className="font-['JetBrains_Mono'] text-[12px] font-semibold text-[#1e4d3a] hover:text-[#C9A84C] flex items-center gap-1.5 transition-colors">
                    {t("home.viewAllDiscussions")}
                    <span className="material-symbols-outlined text-[16px]">{isRTL ? "arrow_back" : "arrow_forward"}</span>
                  </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {popularForumPosts.map((post, index) => (
                    <FadeIn key={post.post_id} delay={100 + index * 100}>
                      <Link
                        to={`/forum/${post.post_id}`}
                        className="group flex flex-col h-full bg-[#fbf9f4] rounded-xl p-6 border border-[#1e4d3a]/10 hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
                      >
                        <h3 className="font-['Hanken_Grotesk'] text-xl font-bold text-[#1e4d3a] mb-3 group-hover:text-[#C9A84C] transition-colors line-clamp-2">
                          {post.title}
                        </h3>
                        <p className="font-['Inter'] text-sm text-[#1e4d3a]/70 leading-relaxed line-clamp-3 mb-4 flex-grow">
                          {post.excerpt}
                        </p>
                        <div className="flex items-center justify-between mt-auto pt-4 border-t border-[#1e4d3a]/10">
                          <div className="flex items-center gap-2">
                            {post.author?.profile_picture ? (
                              <img
                                src={post.author.profile_picture}
                                alt={post.author.name || post.author.username}
                                className="w-6 h-6 rounded-full object-cover"
                                loading="lazy"
                                decoding="async"
                              />
                            ) : (
                              <div className="w-6 h-6 rounded-full bg-[#1e4d3a]/10 flex items-center justify-center">
                                <span className="material-symbols-outlined text-[14px] text-[#1e4d3a]/60">person</span>
                              </div>
                            )}
                            <span className="font-['Inter'] text-xs text-[#1e4d3a]/80 font-medium">
                              {post.author?.name || post.author?.username}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-[#1e4d3a]/60">
                            <div className="flex items-center gap-1">
                              <span className="material-symbols-outlined text-[16px]">thumb_up</span>
                              <span className="font-['Inter'] text-xs font-semibold">{post.like_count}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="material-symbols-outlined text-[16px]">chat_bubble</span>
                              <span className="font-['Inter'] text-xs font-semibold">{post.comment_count}</span>
                            </div>
                          </div>
                        </div>
                      </Link>
                    </FadeIn>
                  ))}
                </div>
              </div>
            </section>
          </FadeIn>
        )}

        {/* 9. CTA Section */}
        <FadeIn>
          <section className="py-24 px-[20px] md:px-[64px] text-center bg-[#1e4d3a] relative overflow-hidden">
            <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full border-2 border-[#C9A84C] opacity-20" />
            <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full border-2 border-[#C9A84C] opacity-10" />
            <div className="relative z-10 max-w-2xl mx-auto">
              <h2 className="font-['Hanken_Grotesk'] text-3xl md:text-4xl font-bold text-[#fbf9f4] mb-4">{t("home.ctaTitle")}</h2>
              <p className="font-['Inter'] text-base text-[#fbf9f4]/80 mb-8 leading-relaxed">{t("home.ctaText")}</p>
              <button
                onClick={() => user ? navigate("/scholars") : navigate("/register")}
                className="inline-flex items-center gap-2 px-10 py-4 bg-[#C9A84C] text-[#1e4d3a] border-2 border-[#C9A84C] rounded-lg text-xs font-bold tracking-[0.1em] font-['JetBrains_Mono'] uppercase hover:bg-[#fbf9f4] transition-colors duration-300 cursor-pointer"
              >
                {t("home.ctaButton")}
                <span className="material-symbols-outlined text-[18px]">{isRTL ? "arrow_back" : "arrow_forward"}</span>
              </button>
            </div>
          </section>
        </FadeIn>
      </main>

      {dropdownContent}
    </div>
  );
};

export default Home;