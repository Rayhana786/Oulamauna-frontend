import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useLang } from "../context/LanguageContext";
import { notificationApi } from "../api/notificationApi";
import NotificationsPanel from "./NotificationsPanel";
import { searchGlobal, type SearchResult, type SearchResponse } from "../api/searchApi";

import logoEn from "../assets/logot_en.png";
import logoAr from "../assets/tlogo_ar.png";
import logoFr from "../assets/logot_fr.png";
import logoMobile from "../assets/tlogo2.png";

type Language = string; // Now accepts ANY language code from the DB

// Safe fallback logo logic: prevents crashes if lang is momentarily undefined
const getLogo = (currentLang: string | undefined) => {
  const upper = (currentLang || "EN").toUpperCase();
  if (upper === "AR") return logoAr;
  if (upper === "FR") return logoFr;
  return logoEn; 
};

const NAV_ITEMS = [
  { id: "HOME", path: "/", key: "navbar.home" },
  { id: "SCHOLARS", path: "/scholars", key: "navbar.scholars" },
  { id: "FORUM", path: "/forum", key: "navbar.forum" },
  { id: "ABOUT", path: "/about", key: "navbar.about" },
  { id: "CONTACT", path: "/contact", key: "navbar.contact" },
] as const;

const LANG_NAMES: Record<Language, string> = {
  EN: "English",
  AR: "العربية",
  FR: "Français",
};

const Navbar: React.FC = () => {
  const { lang, setLang, t, dbLanguages } = useLang();
  
  // Create a safe, lowercase version of the current language to prevent .toLowerCase() crashes
  const safeLang = (lang || "en").toLowerCase();
  const { isLoggedIn, logout, user } = useAuth();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState("");
  const [active, setActive] = useState("HOME");
  const [searchOpen, setSearchOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileProfileExpanded, setMobileProfileExpanded] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [showNavbar, setShowNavbar] = useState(true);
  
  // ✅ State for floating logout confirmation modal
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const [unreadCount, setUnreadCount] = useState(0);
  const [notifPanelOpen, setNotifPanelOpen] = useState(false);

  const [searchResults, setSearchResults] = useState<SearchResponse | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const langRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const location = useLocation();
  const isHome = location.pathname === "/";
  const isNotificationsPage = location.pathname === "/notifications";
  const isRTL = lang === "AR";

  const userRole = (user as any)?.role || (user as any)?.role_name;
  const isAdmin = userRole && String(userRole).toLowerCase() === 'admin';

  const fetchUnreadCount = async () => {
    if (!isLoggedIn) {
      setUnreadCount(0);
      return;
    }
    try {
      const response = await notificationApi.getNotifications({ unread_only: true, limit: 1, scope: "public" });
      if (response.data.success) {
        setUnreadCount(response.data.unread_count || 0);
      }
    } catch (error) {
      console.error("Failed to fetch notification count:", error);
    }
  };

  useEffect(() => { fetchUnreadCount(); }, [isLoggedIn]);

  useEffect(() => {
    const m = NAV_ITEMS.find((item) => item.path === location.pathname);
    if (m) setActive(m.id);
  }, [location.pathname]);

  // ✅ Handle body scroll lock for mobile menu AND floating modal
  useEffect(() => {
    const isLocked = mobileMenuOpen || showLogoutConfirm;
    document.body.style.overflow = isLocked ? 'hidden' : 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [mobileMenuOpen, showLogoutConfirm]);

  // ✅ Close modal on Escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowLogoutConfirm(false);
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, []);

  useEffect(() => {
    const fn = () => {
      const currentScrollY = window.scrollY;
      setScrolled(currentScrollY > 50);
      if (window.innerWidth < 768) {
        setShowNavbar(currentScrollY <= lastScrollY || currentScrollY <= 100);
      } else {
        setShowNavbar(true);
      }
      setLastScrollY(currentScrollY);
    };
    window.addEventListener("scroll", fn, { passive: true });
    window.addEventListener("resize", fn);
    return () => {
      window.removeEventListener("scroll", fn);
      window.removeEventListener("resize", fn);
    };
  }, [lastScrollY]);

  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) setLangOpen(false);
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setSearchOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  useEffect(() => {
    if (searchOpen) setTimeout(() => inputRef.current?.focus(), 100);
  }, [searchOpen]);

  useEffect(() => {
    const query = searchQuery.trim();
    if (query.length >= 2) {
      setIsSearching(true);
      const timer = setTimeout(async () => {
        try {
          const results = await searchGlobal(query, lang);
          setSearchResults(results);
        } catch (error) {
          console.error("Search failed:", error);
          setSearchResults({ scholars: [], works: [], media: [], posts: [] });
        } finally {
          setIsSearching(false);
        }
      }, 400);
      return () => clearTimeout(timer);
    } else {
      setSearchResults(null);
      setIsSearching(false);
    }
  }, [searchQuery, lang]);

  const handleResultClick = (result: SearchResult) => {
    setSearchOpen(false);
    setSearchQuery("");
    setSearchResults(null);
    const targetLang = result.lang ? result.lang.toLowerCase() : lang.toLowerCase();
    
    if (result.type === "scholar" && result.scholar_id) {
      navigate(`/scholars/${result.scholar_id}?lang=${targetLang}`);
    } else if (result.type === "work" && result.scholar_id && result.focus_id) {
      navigate(`/scholars/${result.scholar_id}?lang=${targetLang}&focus=work-${result.focus_id}`);
    } else if (result.type === "media" && result.scholar_id && result.focus_id) {
      navigate(`/scholars/${result.scholar_id}?lang=${targetLang}&focus=media-${result.focus_id}`);
    } else if (result.type === "post" && result.post_id) {
      navigate(`/forum/${result.post_id}`);
    }
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const query = searchQuery.trim();
      if (query.length > 0) {
        setSearchOpen(false);
        navigate(`/scholars?q=${encodeURIComponent(query)}`);
      }
    }
  };

  const handleLogout = () => {
    logout();
    setProfileOpen(false);
    setMobileMenuOpen(false);
    setShowLogoutConfirm(false);
    setToast({ 
      message: t("navbar.logoutSuccess") || (isRTL ? "تم تسجيل الخروج بنجاح" : "Logged out successfully"), 
      type: "success" 
    });
    setTimeout(() => setToast(null), 3000);
  };

  const isTransparent = isHome && !scrolled;

  const handleMobileNavClick = (id: string) => {
    setActive(id);
    setMobileMenuOpen(false);
    setMobileProfileExpanded(false);
  };

  const handleCloseNotifPanel = () => {
    setNotifPanelOpen(false);
    fetchUnreadCount();
  };

  const handleBellClick = () => {
    if (isNotificationsPage) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    setNotifPanelOpen((prev) => !prev);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&display=swap');
        .material-symbols-outlined {
          font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
          font-family: 'Material Symbols Outlined';
          display: inline-block; vertical-align: middle; line-height: 1;
        }
        .arabic-text { font-family: 'Amiri', serif; font-size: 16px; }
        .mobile-link { display: block; padding: 1rem 0; }
        .mobile-link-text { display: inline-block; position: relative; transition: all 0.3s ease; }
        .mobile-link-text::after {
          content: ''; position: absolute; bottom: -2px; left: 0; width: 0; height: 2px;
          background-color: #1e4d3a; transition: width 0.3s ease;
        }
        .mobile-link:hover .mobile-link-text::after { width: 100%; }
        .mobile-link:hover .mobile-link-text { transform: translateX(4px); color: #1e4d3a; }
        .navbar-animate { transition: transform 0.3s ease, opacity 0.3s ease, background-color 0.3s ease; }
        .navbar-animate.hide { transform: translateY(-100%); opacity: 0; }
        .navbar-animate.show-transparent { background-color: rgba(30, 77, 58, 0.85) !important; }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(255, 255, 255, 0.05); border-radius: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(201, 168, 76, 0.3); border-radius: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(201, 168, 76, 0.5); }
        @keyframes slide-up { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        .animate-slide-up { animation: slide-up 0.3s ease-out; }
        [dir="rtl"] .mobile-link:hover .mobile-link-text { transform: translateX(-4px); }
        [dir="rtl"] .mobile-link-text::after { left: auto; right: 0; }
      `}</style>

      <nav
        dir={isRTL ? "rtl" : "ltr"}
        className={`fixed left-0 right-0 z-50 flex items-center justify-between md:grid md:grid-cols-[1fr_auto_1fr] md:justify-normal px-6 py-3 navbar-animate ${!showNavbar ? 'hide' : ''} ${isTransparent ? 'top-4 md:top-6 bg-transparent backdrop-blur-none border-b-0 shadow-none md:mx-auto md:max-w-[1280px] md:w-[95%] md:rounded-full' : 'top-0 bg-[#1e4d3a]/85 backdrop-blur-md border-b border-[#C9A84C]/20 shadow-md md:w-full md:max-w-none md:bg-[#1e4d3a]/95'}`}
      >
        {/* Logo */}
        <Link to="/" className="flex items-center group order-1 md:order-none md:col-start-1 md:justify-self-start flex-shrink-0">
          <img alt={t("navbar.logoAlt")} className="h-10 w-auto object-contain transition-transform duration-300 group-hover:scale-105" src={getLogo(lang)}  style={{ filter: isTransparent ? 'brightness(0) invert(1)' : 'none' }} />
        </Link>

        {/* Desktop Nav Links */}
        <ul className="hidden md:flex items-center justify-center gap-1 md:col-start-2 md:justify-self-center">
          {NAV_ITEMS.map((item) => {
            const isActive = active === item.id;
            return (
              <li key={item.id}>
                <Link
                  to={item.path}
                  onClick={() => setActive(item.id)}
                  className={`font-['Inter'] text-[14px] transition-all duration-300 px-4 py-2 rounded-full ${isRTL ? 'arabic-text' : ''} ${isTransparent ? 'text-white hover:bg-white/10 hover:text-[#C9A84C]' : 'text-white hover:bg-[#C9A84C]/10 hover:text-[#C9A84C]'} ${isActive ? (isTransparent ? 'bg-white/20 text-[#C9A84C]' : 'bg-[#C9A84C]/20 text-[#C9A84C]') : ''}`}
                >
                  {t(item.key)}
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Desktop Utilities */}
        <div className="hidden md:flex items-center gap-1 md:col-start-3 md:justify-self-end flex-shrink-0">
          {/* Language Selector */}
          <div className="relative" ref={langRef}>
            <button onClick={() => setLangOpen(!langOpen)} className={`p-2 transition-all duration-300 rounded-full flex items-center justify-center hover:scale-105 ${isTransparent ? 'text-white hover:bg-white/10 hover:text-[#C9A84C]' : 'text-white hover:bg-[#C9A84C]/10 hover:text-[#C9A84C]'}`}>
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>language</span>
            </button>
                        {langOpen && (
              <div className={`absolute top-[calc(100%+8px)] ${isRTL ? 'left-0' : 'right-0'} z-[110] w-[140px] rounded-xl overflow-hidden bg-[#fbf9f4] border border-[#c0c9c3]/50 shadow-lg animate-in fade-in slide-in-from-top-2 duration-200`}>
                {(dbLanguages || []).map((dbLang) => {
                  const isActive = safeLang === (dbLang.code || "").toLowerCase();
                  return (
                    <button 
                      key={dbLang.language_id} 
                      onClick={() => { setLang(dbLang.code); setLangOpen(false); }} 
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-start transition-colors ${isActive ? "text-[#C9A84C] bg-[#f5f3ee]" : "text-[#404945] hover:text-[#C9A84C] hover:bg-[#f5f3ee]/50"} ${(dbLang.code || "").toLowerCase() === "ar" ? 'arabic-text' : 'font-["Inter"] text-[14px]'}`}
                    >
                      <span className={`w-[2px] h-4 rounded-full ${isActive ? "bg-[#C9A84C]" : "bg-transparent"}`} />
                      {dbLang.name || dbLang.code}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Search */}
          <div className="relative" ref={searchRef}>
            <button onClick={() => setSearchOpen(!searchOpen)} className={`p-2 transition-all duration-300 rounded-full flex items-center justify-center hover:scale-105 ${isTransparent ? 'text-white hover:bg-white/10 hover:text-[#C9A84C]' : 'text-white hover:bg-[#C9A84C]/10 hover:text-[#C9A84C]'}`}>
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>search</span>
            </button>

            {searchOpen && (
              <div className={`absolute top-[calc(100%+8px)] ${isRTL ? 'left-0' : 'right-0'} z-[110] w-[90vw] max-w-[500px] bg-[#1e4d3a]/95 backdrop-blur-md border border-white/10 rounded-2xl shadow-lg p-4 animate-in fade-in slide-in-from-top-2 duration-200`} dir={isRTL ? "rtl" : "ltr"}>
                <div className="relative mb-3">
                  <input 
                    ref={inputRef} 
                    type="search" 
                    value={searchQuery} 
                    onChange={(e) => setSearchQuery(e.target.value)} 
                    onKeyDown={handleSearchKeyDown} 
                    placeholder={t("navbar.searchPlaceholder")} 
                    dir={isRTL ? "rtl" : "ltr"} 
                    className="w-full h-12 pl-5 pr-12 rounded-xl text-base bg-white/10 border border-white/20 placeholder-white/40 text-white outline-none focus:border-[#C9A84C]/50 focus:bg-white/15 transition-all" 
                    autoFocus 
                  />
                  <button 
                    onClick={() => { setSearchQuery(""); inputRef.current?.focus(); }} 
                    className={`absolute top-1/2 -translate-y-1/2 p-1.5 text-white/60 hover:text-[#C9A84C] transition-colors ${isRTL ? 'left-3' : 'right-3'}`}
                  >
                    <span className="material-symbols-outlined">{searchQuery ? 'close' : 'search'}</span>
                  </button>
                </div>

                {searchQuery.trim().length > 0 && (
                  <div className="max-h-[60vh] overflow-y-auto custom-scrollbar">
                    {isSearching ? (
                      <div className="flex items-center justify-center py-8 text-white/60">
                        <span className="material-symbols-outlined animate-spin mr-2">progress_activity</span>
                        {t("navbar.searching")}
                      </div>
                    ) : searchResults ? (
                      <div className="space-y-4">
                        {searchResults.scholars.length > 0 && (
                          <div>
                            <h3 className="text-[#C9A84C] text-xs font-bold uppercase tracking-wider mb-2 px-2">{t("navbar.scholars")}</h3>
                            <div className="space-y-1">
                              {searchResults.scholars.map((item, idx) => (
                                <button key={`scholar-${idx}`} onClick={() => handleResultClick(item)} className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/10 transition-colors group" dir={isRTL ? "rtl" : "ltr"}>
                                  <div className="text-white font-medium text-sm group-hover:text-[#C9A84C] transition-colors truncate">{item.title}</div>
                                  {item.subtitle && <div className="text-white/60 text-xs mt-0.5 truncate">{item.subtitle}</div>}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                        {searchResults.works.length > 0 && (
                          <div>
                            <h3 className="text-[#C9A84C] text-xs font-bold uppercase tracking-wider mb-2 px-2">{t("navbar.works")}</h3>
                            <div className="space-y-1">
                              {searchResults.works.map((item, idx) => (
                                <button key={`work-${idx}`} onClick={() => handleResultClick(item)} className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/10 transition-colors group" dir={isRTL ? "rtl" : "ltr"}>
                                  <div className="text-white font-medium text-sm group-hover:text-[#C9A84C] transition-colors truncate">{item.title}</div>
                                  {item.subtitle && <div className="text-white/60 text-xs mt-0.5 truncate">{item.subtitle}</div>}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                        {searchResults.media.length > 0 && (
                          <div>
                            <h3 className="text-[#C9A84C] text-xs font-bold uppercase tracking-wider mb-2 px-2">{t("navbar.media")}</h3>
                            <div className="space-y-1">
                              {searchResults.media.map((item, idx) => (
                                <button key={`media-${idx}`} onClick={() => handleResultClick(item)} className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/10 transition-colors group" dir={isRTL ? "rtl" : "ltr"}>
                                  <div className="text-white font-medium text-sm group-hover:text-[#C9A84C] transition-colors truncate">{item.title}</div>
                                  {item.subtitle && <div className="text-white/60 text-xs mt-0.5 truncate">{item.subtitle}</div>}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                        {searchResults.posts.length > 0 && (
                          <div>
                            <h3 className="text-[#C9A84C] text-xs font-bold uppercase tracking-wider mb-2 px-2">{t("navbar.forumPosts")}</h3>
                            <div className="space-y-1">
                              {searchResults.posts.map((item, idx) => (
                                <button key={`post-${idx}`} onClick={() => handleResultClick(item)} className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/10 transition-colors group" dir={isRTL ? "rtl" : "ltr"}>
                                  <div className="text-white font-medium text-sm group-hover:text-[#C9A84C] transition-colors truncate">{item.title}</div>
                                  {item.subtitle && <div className="text-white/60 text-xs mt-0.5 truncate">{item.subtitle}</div>}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                        {searchResults.scholars.length === 0 && searchResults.works.length === 0 && searchResults.media.length === 0 && searchResults.posts.length === 0 && (
                          <div className="text-center py-8 text-white/60 text-sm">
                            {t("navbar.noResults")} "{searchQuery}"
                          </div>
                        )}
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
            )}
          </div>

          {isLoggedIn && <div className={`w-px h-5 mx-1 ${isTransparent ? 'bg-white/30' : 'bg-white/20'}`} />}

          {/* Notifications Bell */}
          {isLoggedIn && (
            <button onClick={handleBellClick} className={`relative p-2 transition-all duration-300 rounded-full flex items-center justify-center hover:scale-105 ${isNotificationsPage ? (isTransparent ? 'bg-white/20 text-[#C9A84C]' : 'bg-[#C9A84C]/20 text-[#C9A84C]') : (isTransparent ? 'text-white hover:bg-white/10 hover:text-[#C9A84C]' : 'text-white hover:bg-[#C9A84C]/10 hover:text-[#C9A84C]')}`} title={t("navbar.notifications")}>
              <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>notifications</span>
              {unreadCount > 0 && (
                <span className={`absolute top-1 ${isRTL ? 'left-1' : 'right-1'} flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-[#C9A84C] text-[10px] font-bold text-[#1e4d3a] ring-2 ring-white/80`}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>
          )}

          <div className={`w-px h-5 mx-1 ${isTransparent ? 'bg-white/30' : 'bg-white/20'}`} />

          {/* Profile / Auth */}
          <div className="relative" ref={profileRef}>
            {!isLoggedIn ? (
              <div className="flex items-center gap-1">
                <Link to="/login" className={`font-['Inter'] text-[13px] transition-all duration-300 px-3 py-1.5 rounded-full ${isRTL ? 'arabic-text !text-[13px]' : ''} ${isTransparent ? 'text-white hover:text-[#C9A84C] hover:bg-white/10' : 'text-white hover:text-[#C9A84C] hover:bg-[#C9A84C]/10'}`}>
                  {t("navbar.login")}
                </Link>
                <Link to="/register" className={`font-['Inter'] text-[13px] px-3 py-1.5 font-medium rounded-full transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#C9A84C]/30 bg-[#C9A84C] text-[#1e4d3a] hover:bg-[#C9A84C]/90 ${isRTL ? 'arabic-text !text-[13px]' : ''}`}>
                  {t("navbar.register")}
                </Link>
              </div>
            ) : (
              <>
                <button onClick={() => setProfileOpen(!profileOpen)} className="w-9 h-9 rounded-full border-2 flex items-center justify-center transition-all duration-300 overflow-hidden hover:scale-105 bg-white/10 border-white/30 hover:bg-[#C9A84C]/20 hover:border-[#C9A84C]">
                  {(user as any)?.avatar || (user as any)?.profile_picture ? (
                    <img src={(user as any).avatar || (user as any).profile_picture} alt={t("navbar.profile")} className="w-full h-full object-cover" />
                  ) : (
                    <span className="material-symbols-outlined text-white" style={{ fontSize: '20px', fontVariationSettings: "'FILL' 1" }}>person</span>
                  )}
                </button>

                {profileOpen && (
                  <div className={`absolute top-[calc(100%+8px)] ${isRTL ? 'left-0' : 'right-0'} z-[110] w-[280px] bg-[#F5F3EC] rounded-2xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 border border-[#C9A84C]/20`} dir={isRTL ? "rtl" : "ltr"}>
                    <Link to="/profile" onClick={() => setProfileOpen(false)} className="block p-4 border-b border-[#1e4d3a]/10 hover:bg-[#1e4d3a]/5 transition-colors cursor-pointer">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#C9A84C] flex items-center justify-center flex-shrink-0 overflow-hidden">
                          {(user as any)?.avatar || (user as any)?.profile_picture ? (
                            <img src={(user as any).avatar || (user as any).profile_picture} alt={t("navbar.profile")} className="w-full h-full object-cover" />
                          ) : (
                            <span className="material-symbols-outlined text-[#1e4d3a]" style={{ fontSize: '24px', fontVariationSettings: "'FILL' 1" }}>person</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-[#1e4d3a] font-medium text-sm truncate ${isRTL ? 'arabic-text' : ''}`}>{(user as any)?.username || (isRTL ? 'مستخدم' : lang === 'FR' ? 'Utilisateur' : 'User')}</p>
                          <p className="text-gray-600 text-xs truncate">{(user as any)?.email || ''}</p>
                        </div>
                        <span className="material-symbols-outlined text-gray-400" style={{ fontSize: '18px' }}>{isRTL ? 'arrow_back' : 'arrow_forward'}</span>
                      </div>
                    </Link>

                    <div className="p-2">
                      <Link to="/dashboard" onClick={() => setProfileOpen(false)} className="flex items-center gap-3 px-3 py-2.5 text-[#1e4d3a]/80 hover:text-[#C9A84C] hover:bg-[#1e4d3a]/5 rounded-lg transition-colors">
                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>dashboard</span>
                        <span className={`text-sm ${isRTL ? 'arabic-text' : ''}`}>{t("navbar.dashboard")}</span>
                      </Link>
                      <Link to="/edit-profile" onClick={() => setProfileOpen(false)} className="flex items-center gap-3 px-3 py-2.5 text-[#1e4d3a]/80 hover:text-[#C9A84C] hover:bg-[#1e4d3a]/5 rounded-lg transition-colors">
                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>edit</span>
                        <span className={`text-sm ${isRTL ? 'arabic-text' : ''}`}>{t("navbar.profile")}</span>
                      </Link>
                      <Link to="/settings" onClick={() => setProfileOpen(false)} className="flex items-center gap-3 px-3 py-2.5 text-[#1e4d3a]/80 hover:text-[#C9A84C] hover:bg-[#1e4d3a]/5 rounded-lg transition-colors">
                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>settings</span>
                        <span className={`text-sm ${isRTL ? 'arabic-text' : ''}`}>{t("navbar.settings")}</span>
                      </Link>
                      {isAdmin && (
                        <Link to="/admin/dashboard" onClick={() => setProfileOpen(false)} className="flex items-center gap-3 px-3 py-2.5 text-[#1e4d3a] font-semibold hover:text-[#C9A84C] hover:bg-[#1e4d3a]/5 rounded-lg transition-colors border-t border-[#1e4d3a]/10 mt-2 pt-2">
                          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>admin_panel_settings</span>
                          <span className={`text-sm ${isRTL ? 'arabic-text' : ''}`}>{t("navbar.siteAdminPanel")}</span>
                        </Link>
                      )}
                    </div>

                    {/* ✅ Simple Logout Button triggers the floating modal */}
                    <div className="p-2 border-t border-[#1e4d3a]/10">
                      <button 
                        onClick={() => { setProfileOpen(false); setShowLogoutConfirm(true); }} 
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>logout</span>
                        <span className={`text-sm font-medium ${isRTL ? 'arabic-text' : ''}`}>{t("navbar.signOut")}</span>
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Mobile Utilities */}
        <div className="md:hidden flex items-center gap-2 order-2">
          {isLoggedIn && (
            <button onClick={handleBellClick} className={`relative p-2 text-white rounded-full transition-colors hover:scale-105 ${isNotificationsPage ? 'bg-white/20 hover:bg-white/30' : 'hover:bg-white/10'}`}>
              <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>notifications</span>
              {unreadCount > 0 && (
                <span className={`absolute top-1 ${isRTL ? 'left-1' : 'right-1'} flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-[#C9A84C] text-[10px] font-bold text-[#1e4d3a]`}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>
          )}
          <button onClick={() => setSearchOpen(!searchOpen)} className="p-2 text-white rounded-full hover:bg-white/10 transition-colors">
            <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>search</span>
          </button>
          <button className="p-2 text-white rounded-full hover:bg-white/10 transition-colors" onClick={() => setMobileMenuOpen(true)}>
            <span className="material-symbols-outlined" style={{ fontSize: '28px' }}>menu</span>
          </button>
        </div>
      </nav>

      <NotificationsPanel isOpen={notifPanelOpen} onClose={handleCloseNotifPanel} isRTL={isRTL} />

      {/* Full-Page Mobile Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[100] md:hidden bg-white overflow-y-auto" dir={isRTL ? 'rtl' : 'ltr'}>
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center z-10">
            <Link to="/" onClick={() => setMobileMenuOpen(false)} className="flex items-center">
              <img alt={t("navbar.logoAlt")} className="h-8 w-auto object-contain" src={logoMobile} />
            </Link>
            <button onClick={() => { setMobileMenuOpen(false); setMobileProfileExpanded(false); }} className="p-2 text-gray-700 hover:text-gray-900 transition-colors" aria-label={t("navbar.close")}>
              <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>close</span>
            </button>
          </div>

          <div className="px-6 py-4">
            {isLoggedIn && (
              <div className="border-b border-gray-200">
                <button onClick={() => setMobileProfileExpanded(!mobileProfileExpanded)} className="w-full flex items-center justify-between py-4 text-gray-900 hover:text-[#1e4d3a] transition-colors">
                  <span className={`font-['Inter'] text-[16px] font-medium ${isRTL ? 'arabic-text' : ''}`}>{t("navbar.profileMenu")}</span>
                  <span className={`material-symbols-outlined text-gray-500 transition-transform duration-300 ${mobileProfileExpanded ? 'rotate-180' : ''}`} style={{ fontSize: '20px' }}>expand_more</span>
                </button>

                {mobileProfileExpanded && (
                  <div className={`pb-4 space-y-1 animate-in slide-in-from-top-2 duration-200`}>
                    <Link to="/profile" onClick={() => handleMobileNavClick('HOME')} className="mobile-link text-gray-600">
                      <span className={`mobile-link-text font-['Inter'] text-[15px] ${isRTL ? 'arabic-text' : ''}`}>{t("navbar.profile")}</span>
                    </Link>
                    <Link to="/dashboard" onClick={() => handleMobileNavClick('HOME')} className="mobile-link text-gray-600">
                      <span className={`mobile-link-text font-['Inter'] text-[15px] ${isRTL ? 'arabic-text' : ''}`}>{t("navbar.dashboard")}</span>
                    </Link>
                    <Link to="/settings" onClick={() => handleMobileNavClick('HOME')} className="mobile-link text-gray-600">
                      <span className={`mobile-link-text font-['Inter'] text-[15px] ${isRTL ? 'arabic-text' : ''}`}>{t("navbar.settings")}</span>
                    </Link>
                    {isAdmin && (
                      <Link to="/admin/dashboard" onClick={() => handleMobileNavClick('HOME')} className="mobile-link text-[#1e4d3a] font-semibold border-t border-gray-200 mt-2 pt-2">
                        <span className={`mobile-link-text font-['Inter'] text-[15px] ${isRTL ? 'arabic-text' : ''}`}>{t("navbar.siteAdminPanel")}</span>
                      </Link>
                    )}
                    
                    {/* ✅ Simple Logout Button triggers the floating modal */}
                    <button 
                      onClick={() => { setMobileMenuOpen(false); setShowLogoutConfirm(true); }} 
                      className="mobile-link text-red-500 w-full text-start"
                    >
                      <span className={`mobile-link-text font-['Inter'] text-[15px] font-medium ${isRTL ? 'arabic-text' : ''}`}>{t("navbar.signOut")}</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {NAV_ITEMS.map((item) => (
              <Link key={item.id} to={item.path} onClick={() => handleMobileNavClick(item.id)} className={`mobile-link border-b border-gray-200 ${active === item.id ? 'text-[#1e4d3a] font-medium' : 'text-gray-900'}`}>
                <span className={`mobile-link-text font-['Inter'] text-[16px] ${isRTL ? 'arabic-text' : ''}`}>{t(item.key)}</span>
              </Link>
            ))}

            {!isLoggedIn && (
              <div className="mt-6 space-y-1 border-t border-gray-200 pt-4">
                <Link to="/register" onClick={() => handleMobileNavClick('HOME')} className="mobile-link text-gray-900">
                  <span className={`mobile-link-text font-['Inter'] text-[16px] font-medium ${isRTL ? 'arabic-text' : ''}`}>{t("navbar.register")}</span>
                </Link>
                <Link to="/login" onClick={() => handleMobileNavClick('HOME')} className="mobile-link text-gray-900">
                  <span className={`mobile-link-text font-['Inter'] text-[16px] ${isRTL ? 'arabic-text' : ''}`}>{t("navbar.login")}</span>
                </Link>
              </div>
            )}
            <div className="h-16" />
          </div>

          {/* Language Selector at Bottom */}
          <div className="sticky bottom-0 bg-white border-t border-gray-200">
            <div className="relative" ref={langRef}>
                            <button onClick={() => setLangOpen(!langOpen)} className="w-full flex items-center justify-between px-6 py-4 text-gray-900 hover:text-[#1e4d3a] transition-colors">
                <span className={`font-['Inter'] text-[16px] font-medium ${isRTL ? 'arabic-text' : ''}`}>
                  {(dbLanguages || []).find(l => (l.code || "").toLowerCase() === safeLang)?.name || (lang || "EN").toUpperCase()}
                </span>
                <span className={`material-symbols-outlined text-gray-500 transition-transform duration-300 ${langOpen ? 'rotate-180' : ''}`} style={{ fontSize: '20px' }}>expand_more</span>
              </button>

              {langOpen && (
                <div className={`absolute bottom-full ${isRTL ? 'left-0' : 'right-0'} w-1/2 bg-[#F5F3EC] border-t border-[#e5e0d5] shadow-lg animate-in slide-in-from-bottom-2 duration-200`}>
                  {(dbLanguages || []).map((dbLang) => {
                    const isActive = safeLang === (dbLang.code || "").toLowerCase();
                    return (
                      <button 
                        key={dbLang.language_id} 
                        onClick={() => { setLang(dbLang.code); setLangOpen(false); }} 
                        className={`w-full flex items-center justify-between px-6 py-3.5 transition-colors ${isActive ? "text-[#1e4d3a] bg-[#e5e0d5]" : "text-gray-900 hover:bg-[#e5e0d5]/50"} ${(dbLang.code || "").toLowerCase() === "ar" ? 'arabic-text' : 'font-["Inter"] text-[15px]'}`}
                      >
                        <span>{dbLang.name || dbLang.code}</span>
                        {isActive && <span className="material-symbols-outlined text-[#1e4d3a]" style={{ fontSize: '18px' }}>check</span>}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ✅ FLOATING LOGOUT CONFIRMATION MODAL */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" 
            onClick={() => setShowLogoutConfirm(false)} 
          />
          
          {/* Modal Card */}
          <div 
            className={`relative w-full max-w-sm bg-white rounded-2xl shadow-2xl p-6 animate-in zoom-in-95 fade-in duration-200 border border-gray-100`}
            dir={isRTL ? 'rtl' : 'ltr'}
          >
            {/* Icon */}
            <div className="mx-auto w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-red-600" style={{ fontSize: '32px' }}>logout</span>
            </div>
            
            {/* Content */}
            <h3 className={`text-xl font-bold text-gray-900 mb-2 text-center ${isRTL ? 'arabic-text' : 'font-["Inter"]'}`}>
              {t("navbar.logoutTitle") || (isRTL ? "تسجيل الخروج" : "Log Out")}
            </h3>
            <p className={`text-sm text-gray-600 mb-6 text-center leading-relaxed ${isRTL ? 'arabic-text' : 'font-["Inter"]'}`}>
              {t("navbar.logoutConfirm") || (isRTL ? "هل أنت متأكد من تسجيل الخروج؟" : "Are you sure you want to log out?")}
            </p>
            
            {/* Buttons */}
            <div className="flex gap-3">
              <button 
                onClick={() => setShowLogoutConfirm(false)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors ${isRTL ? 'arabic-text' : 'font-["Inter"]'}`}
              >
                {t("common.cancel") || (isRTL ? "إلغاء" : "Cancel")}
              </button>
              <button 
                onClick={handleLogout}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-red-600 hover:bg-red-700 transition-colors shadow-sm shadow-red-600/20 ${isRTL ? 'arabic-text' : 'font-["Inter"]'}`}
              >
                {t("common.confirm") || (isRTL ? "تأكيد" : "Confirm")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification UI */}
      {toast && (
        <div 
          className={`fixed bottom-6 ${isRTL ? 'left-6' : 'right-6'} z-[300] flex items-center gap-3 px-5 py-3 rounded-lg shadow-lg border animate-slide-up`} 
          style={{ 
            backgroundColor: toast.type === "success" ? "#0b4335" : "#8b2c2c", 
            borderColor: "transparent", 
            color: "#fcfaf5" 
          }}
          dir={isRTL ? "rtl" : "ltr"}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
            {toast.type === "success" ? "check_circle" : "error"}
          </span>
          <span className="font-['Inter'] text-[14px] font-medium">{toast.message}</span>
          <button onClick={() => setToast(null)} className={`${isRTL ? 'mr-2' : 'ml-2'} hover:opacity-70 transition-opacity`}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>close</span>
          </button>
        </div>
      )}
    </>
  );
};

export default Navbar;