import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useLang } from "../context/LanguageContext";
import { notificationApi } from "../api/notificationApi";
import NotificationsPanel from "./NotificationsPanel"; // ⚠️ adjust this path to wherever NotificationsPanel.tsx actually lives relative to Navbar.tsx (was wrongly pointing at the full page before)

import oulamaunaLogo from '../assets/bgt1.png';

type Language = "EN" | "AR" | "FR";

const NAV_IDS = ["HOME", "SCHOLARS", "FORUM", "ABOUT", "CONTACT"] as const;
const PATHS: Record<string, string> = {
  HOME: "/",
  SCHOLARS: "/scholars",
  FORUM: "/forum",
  ABOUT: "/about",
  CONTACT: "/contact",
};

const T: Record<
  Language,
  { links: string[]; login: string; register: string; placeholder: string; profileMenu: string; profile: string; dashboard: string; settings: string; signOut: string; search: string; notifications: string }
> = {
  EN: {
    links: ["Home", "Scholars", "Forum", "About", "Contact"],
    login: "Log in",
    register: "Sign up",
    placeholder: "Search scholars, topics…",
    profileMenu: "Profile Menu",
    profile: "Profile",
    dashboard: "Dashboard",
    settings: "Settings",
    signOut: "Sign out",
    search: "Search",
    notifications: "Notifications",
  },
  AR: {
    links: ["الرئيسية", "العلماء", "المنتدى", "عنا", "اتصل"],
    login: "تسجيل الدخول",
    register: "إنشاء حساب",
    placeholder: "ابحث عن علماء، مواضيع…",
    profileMenu: "قائمة الملف الشخصي",
    profile: "الملف الشخصي",
    dashboard: "لوحة التحكم",
    settings: "الإعدادات",
    signOut: "تسجيل الخروج",
    search: "بحث",
    notifications: "الإشعارات",
  },
  FR: {
    links: ["Accueil", "Savants", "Forum", "À propos", "Contact"],
    login: "Connexion",
    register: "S'inscrire",
    placeholder: "Chercher des savants, sujets…",
    profileMenu: "Menu Profil",
    profile: "Profil",
    dashboard: "Tableau de bord",
    settings: "Paramètres",
    signOut: "Déconnexion",
    search: "Rechercher",
    notifications: "Notifications",
  },
};

const LANG_FULL: Record<Language, string> = {
  EN: "English",
  AR: "العربية",
  FR: "Français",
};

const Navbar: React.FC = () => {
  const { lang, setLang } = useLang();
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

  const [unreadCount, setUnreadCount] = useState(0);
  // ✅ NEW: controls the floating dropdown panel. The bell no longer navigates directly —
  // it opens this panel first; the panel itself has the "See all notifications" action
  // that pushes to /notifications.
  const [notifPanelOpen, setNotifPanelOpen] = useState(false);

  const langRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const location = useLocation();
  const isHome = location.pathname === "/";
  // ✅ When we're already on the full notifications page, the bell shouldn't
  // pop the floating panel back on top of it — that's just noise since the
  // user is already looking at the same list.
  const isNotificationsPage = location.pathname === "/notifications";
  const isRTL = lang === "AR";
  const t = T[lang];

  const userRole = (user as any)?.role || (user as any)?.role_name;
  const isAdmin = userRole && String(userRole).toLowerCase() === 'admin';

  // ✅ Extracted so we can also refresh it right after the panel closes
  // (e.g. after marking something as read inside the dropdown).
  const fetchUnreadCount = async () => {
    if (!isLoggedIn) {
      setUnreadCount(0);
      return;
    }
    try {
      const response = await notificationApi.getNotifications({ unread_only: true, limit: 1 });
      if (response.data.success) {
        setUnreadCount(response.data.unread_count || 0);
      }
    } catch (error) {
      console.error("Failed to fetch notification count:", error);
    }
  };

  useEffect(() => {
    fetchUnreadCount();
  }, [isLoggedIn]);

  // Active link sync
  useEffect(() => {
    const m = NAV_IDS.find((id) => PATHS[id] === location.pathname);
    if (m) setActive(m);
  }, [location.pathname]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [mobileMenuOpen]);

  // Scroll behavior - hide/show navbar (MOBILE ONLY)
  useEffect(() => {
    const fn = () => {
      const currentScrollY = window.scrollY;
      setScrolled(currentScrollY > 50);

      if (window.innerWidth < 768) {
        if (currentScrollY > lastScrollY && currentScrollY > 100) {
          setShowNavbar(false);
        } else {
          setShowNavbar(true);
        }
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

  // Close dropdowns on outside click
  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) setLangOpen(false);
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setSearchOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  // Auto-focus search when opened
  useEffect(() => {
    if (searchOpen) setTimeout(() => inputRef.current?.focus(), 100);
  }, [searchOpen]);

  // Search navigation
  useEffect(() => {
    const query = searchQuery.trim();
    if (query.length > 0) {
      const timer = setTimeout(() => {
        navigate(`/scholars?q=${encodeURIComponent(query)}`);
        setSearchOpen(false);
        setMobileMenuOpen(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [searchQuery, navigate]);

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

  // ✅ Single handler for both the desktop and mobile bell.
  // On any other page: toggles the floating panel.
  // On /notifications itself: just scrolls the already-open list back to top —
  // no floating panel, since we're already "in" notifications.
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
          display: inline-block;
          vertical-align: middle;
          line-height: 1;
        }
        .arabic-text {
          font-family: 'Amiri', serif;
          font-size: 16px;
        }
        .mobile-link {
          display: block;
          padding: 1rem 0;
        }
        .mobile-link-text {
          display: inline-block;
          position: relative;
          transition: all 0.3s ease;
        }
        .mobile-link-text::after {
          content: '';
          position: absolute;
          bottom: -2px;
          left: 0;
          width: 0;
          height: 2px;
          background-color: #1e4d3a;
          transition: width 0.3s ease;
        }
        .mobile-link:hover .mobile-link-text::after {
          width: 100%;
        }
        .mobile-link:hover .mobile-link-text {
          transform: translateX(4px);
          color: #1e4d3a;
        }
        .navbar-animate {
          transition: transform 0.3s ease, opacity 0.3s ease, background-color 0.3s ease;
        }
        .navbar-animate.hide {
          transform: translateY(-100%);
          opacity: 0;
        }
        .navbar-animate.show-transparent {
          background-color: rgba(30, 77, 58, 0.85) !important;
        }
      `}</style>

      <nav
        dir={isRTL ? "rtl" : "ltr"}
        className={`
          fixed left-0 right-0 z-50
          flex items-center justify-between
          md:grid md:grid-cols-[1fr_auto_1fr] md:justify-normal
          px-6 py-3
          navbar-animate
          ${!showNavbar ? 'hide' : ''}
          ${isTransparent ? 'top-4 md:top-6' : 'top-0'}
          ${isTransparent
            ? 'bg-transparent backdrop-blur-none border-b-0 shadow-none'
            : 'bg-[#1e4d3a]/85 backdrop-blur-md border-b border-[#C9A84C]/20 shadow-md'
          }
          ${isTransparent
            ? 'md:mx-auto md:max-w-[1280px] md:w-[95%] md:bg-transparent md:backdrop-blur-none md:rounded-full md:shadow-none md:border-none'
            : 'md:w-full md:max-w-none md:bg-[#1e4d3a]/95 md:backdrop-blur-md md:border-b md:border-[#C9A84C]/20 md:shadow-md'
          }
        `}
      >
        {/* Logo */}
        <Link to="/" className="flex items-center group order-1 md:order-none md:col-start-1 md:justify-self-start flex-shrink-0">
          <img
            alt="Oulamauna Logo"
            className="h-10 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
            src={oulamaunaLogo}
            style={{ filter: isTransparent ? 'brightness(0) invert(1)' : 'none' }}
          />
        </Link>

        {/* Desktop Nav Links */}
        <ul className="hidden md:flex items-center justify-center gap-1 md:col-start-2 md:justify-self-center">
          {NAV_IDS.map((id, i) => {
            const isActive = active === id;
            return (
              <li key={id}>
                <Link
                  to={PATHS[id]}
                  onClick={() => setActive(id)}
                  className={`font-['Inter'] text-[14px] transition-all duration-300 px-4 py-2 rounded-full ${
                    isRTL ? 'arabic-text' : ''
                  } ${
                    isTransparent
                      ? 'text-white hover:bg-white/10 hover:text-[#C9A84C]'
                      : 'text-white hover:bg-[#C9A84C]/10 hover:text-[#C9A84C]'
                  } ${isActive ? (isTransparent ? 'bg-white/20 text-[#C9A84C]' : 'bg-[#C9A84C]/20 text-[#C9A84C]') : ''}`}
                >
                  {t.links[i]}
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Desktop Utilities */}
        <div className="hidden md:flex items-center gap-1 md:col-start-3 md:justify-self-end flex-shrink-0">
          {/* Language Selector */}
          <div className="relative" ref={langRef}>
            <button
              onClick={() => setLangOpen(!langOpen)}
              className={`p-2 transition-all duration-300 rounded-full flex items-center justify-center hover:scale-105 ${
                isTransparent ? 'text-white hover:bg-white/10 hover:text-[#C9A84C]' : 'text-white hover:bg-[#C9A84C]/10 hover:text-[#C9A84C]'
              }`}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>language</span>
            </button>

            {langOpen && (
              <div className="absolute top-[calc(100%+8px)] right-0 z-[110] w-[140px] rounded-xl overflow-hidden bg-[#fbf9f4] border border-[#c0c9c3]/50 shadow-lg animate-in fade-in slide-in-from-top-2 duration-200">
                {(["EN", "AR", "FR"] as Language[]).map((l) => (
                  <button
                    key={l}
                    onClick={() => { setLang(l); setLangOpen(false); }}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-start transition-colors ${
                      lang === l ? "text-[#C9A84C] bg-[#f5f3ee]" : "text-[#404945] hover:text-[#C9A84C] hover:bg-[#f5f3ee]/50"
                    } ${l === "AR" ? 'arabic-text' : 'font-["Inter"] text-[14px]'}`}
                  >
                    <span className={`w-[2px] h-4 rounded-full ${lang === l ? "bg-[#C9A84C]" : "bg-transparent"}`} />
                    {LANG_FULL[l]}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Search */}
          <button
            onClick={() => setSearchOpen(!searchOpen)}
            className={`p-2 transition-all duration-300 rounded-full flex items-center justify-center hover:scale-105 ${
              isTransparent ? 'text-white hover:bg-white/10 hover:text-[#C9A84C]' : 'text-white hover:bg-[#C9A84C]/10 hover:text-[#C9A84C]'
            }`}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>search</span>
          </button>

          {isLoggedIn && <div className={`w-px h-5 mx-1 ${isTransparent ? 'bg-white/30' : 'bg-white/20'}`} />}

          {/* ✅ Notifications Bell (Desktop) — opens the floating panel, does NOT navigate */}
          {isLoggedIn && (
            <button
              onClick={handleBellClick}
              className={`relative p-2 transition-all duration-300 rounded-full flex items-center justify-center hover:scale-105 ${
                isNotificationsPage
                  ? (isTransparent ? 'bg-white/20 text-[#C9A84C]' : 'bg-[#C9A84C]/20 text-[#C9A84C]')
                  : (isTransparent ? 'text-white hover:bg-white/10 hover:text-[#C9A84C]' : 'text-white hover:bg-[#C9A84C]/10 hover:text-[#C9A84C]')
              }`}
              title={t.notifications}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>notifications</span>
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-[#C9A84C] text-[10px] font-bold text-[#1e4d3a] ring-2 ring-white/80">
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
                <Link
                  to="/login"
                  className={`font-['Inter'] text-[13px] transition-all duration-300 px-3 py-1.5 rounded-full ${
                    isRTL ? 'arabic-text !text-[13px]' : ''
                  } ${
                    isTransparent ? 'text-white hover:text-[#C9A84C] hover:bg-white/10' : 'text-white hover:text-[#C9A84C] hover:bg-[#C9A84C]/10'
                  }`}
                >
                  {t.login}
                </Link>
                <Link
                  to="/register"
                  className={`font-['Inter'] text-[13px] px-3 py-1.5 font-medium rounded-full transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#C9A84C]/30 bg-[#C9A84C] text-[#1e4d3a] hover:bg-[#C9A84C]/90 ${
                    isRTL ? 'arabic-text !text-[13px]' : ''
                  }`}
                >
                  {t.register}
                </Link>
              </div>
            ) : (
              <>
               <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="w-9 h-9 rounded-full border-2 flex items-center justify-center transition-all duration-300 overflow-hidden hover:scale-105 bg-white/10 border-white/30 hover:bg-[#C9A84C]/20 hover:border-[#C9A84C]"
                >
                  {(user as any)?.avatar || (user as any)?.profile_picture ? (
                    <img
                      src={(user as any).avatar || (user as any).profile_picture}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="material-symbols-outlined text-white" style={{ fontSize: '20px', fontVariationSettings: "'FILL' 1" }}>person</span>
                  )}
                </button>

                {/* Profile Dropdown */}
                {profileOpen && (
                  <div className={`absolute top-[calc(100%+8px)] ${isRTL ? 'left-0' : 'right-0'} z-[110] w-[280px] bg-[#F5F3EC] rounded-2xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 border border-[#C9A84C]/20`}>
                    <Link
                      to="/profile"
                      onClick={() => setProfileOpen(false)}
                      className="block p-4 border-b border-[#1e4d3a]/10 hover:bg-[#1e4d3a]/5 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#C9A84C] flex items-center justify-center flex-shrink-0 overflow-hidden">
                          {(user as any)?.avatar || (user as any)?.profile_picture ? (
                            <img
                              src={(user as any).avatar || (user as any).profile_picture}
                              alt="Profile"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="material-symbols-outlined text-[#1e4d3a]" style={{ fontSize: '24px', fontVariationSettings: "'FILL' 1" }}>
                              person
                            </span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-[#1e4d3a] font-medium text-sm truncate ${isRTL ? 'arabic-text' : ''}`}>
                            {(user as any)?.username || (isRTL ? 'مستخدم' : lang === 'FR' ? 'Utilisateur' : 'User')}
                          </p>
                          <p className="text-gray-600 text-xs truncate">
                            {(user as any)?.email || ''}
                          </p>
                        </div>
                        <span className="material-symbols-outlined text-gray-400" style={{ fontSize: '18px' }}>
                          {isRTL ? 'arrow_back' : 'arrow_forward'}
                        </span>
                      </div>
                    </Link>

                    <div className="p-2">
                      <Link to="/dashboard" onClick={() => setProfileOpen(false)} className="flex items-center gap-3 px-3 py-2.5 text-[#1e4d3a]/80 hover:text-[#C9A84C] hover:bg-[#1e4d3a]/5 rounded-lg transition-colors">
                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>dashboard</span>
                        <span className={`text-sm ${isRTL ? 'arabic-text' : ''}`}>
                          {isRTL ? 'لوحة التحكم' : lang === 'FR' ? 'Tableau de bord' : 'Dashboard'}
                        </span>
                      </Link>
                      <Link to="/edit-profile" onClick={() => setProfileOpen(false)} className="flex items-center gap-3 px-3 py-2.5 text-[#1e4d3a]/80 hover:text-[#C9A84C] hover:bg-[#1e4d3a]/5 rounded-lg transition-colors">
                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>edit</span>
                        <span className={`text-sm ${isRTL ? 'arabic-text' : ''}`}>
                          {isRTL ? 'الملف الشخصي' : lang === 'FR' ? 'Modifier le profil' : 'Edit Profile'}
                        </span>
                      </Link>
                      <Link to="/settings" onClick={() => setProfileOpen(false)} className="flex items-center gap-3 px-3 py-2.5 text-[#1e4d3a]/80 hover:text-[#C9A84C] hover:bg-[#1e4d3a]/5 rounded-lg transition-colors">
                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>settings</span>
                        <span className={`text-sm ${isRTL ? 'arabic-text' : ''}`}>
                          {isRTL ? 'الإعدادات' : lang === 'FR' ? 'Paramètres' : 'Settings'}
                        </span>
                      </Link>

                      {isAdmin && (
                        <Link
                          to="/admin/dashboard"
                          onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-3 px-3 py-2.5 text-[#1e4d3a] font-semibold hover:text-[#C9A84C] hover:bg-[#1e4d3a]/5 rounded-lg transition-colors border-t border-[#1e4d3a]/10 mt-2 pt-2"
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>admin_panel_settings</span>
                          <span className={`text-sm ${isRTL ? 'arabic-text' : ''}`}>
                            {isRTL ? 'لوحة إدارة الموقع' : lang === 'FR' ? "Panneau d'administration" : 'Site Admin Panel'}
                          </span>
                        </Link>
                      )}
                    </div>

                    <div className="p-2 border-t border-[#1e4d3a]/10">
                      <button onClick={() => { logout(); setProfileOpen(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 text-red-600 hover:text-red-700 hover:bg-[#1e4d3a]/5 rounded-lg transition-colors">
                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>logout</span>
                        <span className={`text-sm ${isRTL ? 'arabic-text' : ''}`}>
                          {isRTL ? 'تسجيل الخروج' : lang === 'FR' ? 'Déconnexion' : 'Sign out'}
                        </span>
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
          {/* ✅ Notifications Bell (Mobile Top Bar) — opens the floating panel too */}
          {isLoggedIn && (
            <button
              onClick={handleBellClick}
              className={`relative p-2 text-white rounded-full transition-colors ${isNotificationsPage ? 'bg-white/20' : 'hover:bg-white/10'}`}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>notifications</span>
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-[#C9A84C] text-[10px] font-bold text-[#1e4d3a]">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>
          )}

          <button
            onClick={() => setSearchOpen(!searchOpen)}
            className="p-2 text-white rounded-full hover:bg-white/10 transition-colors"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>search</span>
          </button>

          <button
            className="p-2 text-white rounded-full hover:bg-white/10 transition-colors"
            onClick={() => setMobileMenuOpen(true)}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '28px' }}>menu</span>
          </button>
        </div>
      </nav>

      {/* ✅ Floating notifications panel — lives outside <nav> so it overlays everything */}
      <NotificationsPanel isOpen={notifPanelOpen} onClose={handleCloseNotifPanel} />

      {/* Full-Page Mobile Menu */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-[100] md:hidden bg-white overflow-y-auto"
          dir={isRTL ? 'rtl' : 'ltr'}
        >
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center z-10">
            <Link to="/" onClick={() => setMobileMenuOpen(false)} className="flex items-center">
              <img alt="Oulamauna Logo" className="h-8 w-auto object-contain" src={oulamaunaLogo} />
            </Link>
            <button
              onClick={() => { setMobileMenuOpen(false); setMobileProfileExpanded(false); }}
              className="p-2 text-gray-700 hover:text-gray-900 transition-colors"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>close</span>
            </button>
          </div>

          <div className="px-6 py-4">
            {isLoggedIn && (
              <div className="border-b border-gray-200">
                <button
                  onClick={() => setMobileProfileExpanded(!mobileProfileExpanded)}
                  className="w-full flex items-center justify-between py-4 text-gray-900 hover:text-[#1e4d3a] transition-colors"
                >
                  <span className={`font-['Inter'] text-[16px] font-medium ${isRTL ? 'arabic-text' : ''}`}>
                    {t.profileMenu}
                  </span>
                  <span
                    className={`material-symbols-outlined text-gray-500 transition-transform duration-300 ${mobileProfileExpanded ? 'rotate-180' : ''}`}
                    style={{ fontSize: '20px' }}
                  >
                    expand_more
                  </span>
                </button>

                {mobileProfileExpanded && (
                  <div className={`pb-4 ${isRTL ? 'pr-4' : 'pl-4'} space-y-1 animate-in slide-in-from-top-2 duration-200`}>
                    <Link to="/profile" onClick={() => handleMobileNavClick('HOME')} className="mobile-link text-gray-600">
                      <span className={`mobile-link-text font-['Inter'] text-[15px] ${isRTL ? 'arabic-text' : ''}`}>{t.profile}</span>
                    </Link>
                    <Link to="/dashboard" onClick={() => handleMobileNavClick('HOME')} className="mobile-link text-gray-600">
                      <span className={`mobile-link-text font-['Inter'] text-[15px] ${isRTL ? 'arabic-text' : ''}`}>{t.dashboard}</span>
                    </Link>
                    <Link to="/settings" onClick={() => handleMobileNavClick('HOME')} className="mobile-link text-gray-600">
                      <span className={`mobile-link-text font-['Inter'] text-[15px] ${isRTL ? 'arabic-text' : ''}`}>{t.settings}</span>
                    </Link>

                    {isAdmin && (
                      <Link to="/admin/dashboard" onClick={() => handleMobileNavClick('HOME')} className="mobile-link text-[#1e4d3a] font-semibold border-t border-gray-200 mt-2 pt-2">
                        <span className={`mobile-link-text font-['Inter'] text-[15px] ${isRTL ? 'arabic-text' : ''}`}>
                          {isRTL ? 'لوحة إدارة الموقع' : lang === 'FR' ? "Panneau d'administration" : 'Site Admin Panel'}
                        </span>
                      </Link>
                    )}

                    <button onClick={() => { logout(); handleMobileNavClick('HOME'); }} className="mobile-link text-red-500 w-full text-start">
                      <span className={`mobile-link-text font-['Inter'] text-[15px] ${isRTL ? 'arabic-text' : ''}`}>{t.signOut}</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {NAV_IDS.map((id, i) => (
              <Link
                key={id}
                to={PATHS[id]}
                onClick={() => handleMobileNavClick(id)}
                className={`mobile-link border-b border-gray-200 ${
                  active === id ? 'text-[#1e4d3a] font-medium' : 'text-gray-900'
                }`}
              >
                <span className={`mobile-link-text font-['Inter'] text-[16px] ${isRTL ? 'arabic-text' : ''}`}>
                  {t.links[i]}
                </span>
              </Link>
            ))}

            {!isLoggedIn && (
              <div className="mt-6 space-y-1 border-t border-gray-200 pt-4">
                <Link to="/register" onClick={() => handleMobileNavClick('HOME')} className="mobile-link text-gray-900">
                  <span className={`mobile-link-text font-['Inter'] text-[16px] font-medium ${isRTL ? 'arabic-text' : ''}`}>
                    {t.register}
                  </span>
                </Link>
                <Link to="/login" onClick={() => handleMobileNavClick('HOME')} className="mobile-link text-gray-900">
                  <span className={`mobile-link-text font-['Inter'] text-[16px] ${isRTL ? 'arabic-text' : ''}`}>
                    {t.login}
                  </span>
                </Link>
              </div>
            )}
            <div className="h-16" />
          </div>

          {/* Language Selector at Bottom */}
          <div className="sticky bottom-0 bg-white border-t border-gray-200">
            <div className="relative" ref={langRef}>
              <button
                onClick={() => setLangOpen(!langOpen)}
                className="w-full flex items-center justify-between px-6 py-4 text-gray-900 hover:text-[#1e4d3a] transition-colors"
              >
                <span className={`font-['Inter'] text-[16px] font-medium ${isRTL ? 'arabic-text' : ''}`}>
                  {LANG_FULL[lang]}
                </span>
                <span
                  className={`material-symbols-outlined text-gray-500 transition-transform duration-300 ${langOpen ? 'rotate-180' : ''}`}
                  style={{ fontSize: '20px' }}
                >
                  expand_more
                </span>
              </button>

              {langOpen && (
                <div className={`absolute bottom-full ${isRTL ? 'right-0' : 'left-0'} w-1/2 bg-[#F5F3EC] border-t border-[#e5e0d5] shadow-lg animate-in slide-in-from-bottom-2 duration-200`}>
                  {(["EN", "AR", "FR"] as Language[]).map((l) => (
                    <button
                      key={l}
                      onClick={() => { setLang(l); setLangOpen(false); }}
                      className={`w-full flex items-center justify-between px-6 py-3.5 transition-colors ${
                        lang === l ? "text-[#1e4d3a] bg-[#e5e0d5]" : "text-gray-900 hover:bg-[#e5e0d5]/50"
                      } ${l === "AR" ? 'arabic-text' : 'font-["Inter"] text-[15px]'}`}
                    >
                      <span>{LANG_FULL[l]}</span>
                      {lang === l && (
                        <span className="material-symbols-outlined text-[#1e4d3a]" style={{ fontSize: '18px' }}>check</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Desktop Search Dropdown */}
      {searchOpen && (
        <div className="fixed z-[99] left-1/2 -translate-x-1/2 w-[90%] max-w-[600px] bg-[#1e4d3a]/95 backdrop-blur-md border border-white/10 rounded-2xl shadow-lg p-4 top-[80px] animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="relative">
            <input
              ref={inputRef}
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.placeholder}
              dir={isRTL ? "rtl" : "ltr"}
              className="w-full h-12 pl-5 pr-12 rounded-xl text-base bg-white/10 border border-white/20 placeholder-white/40 text-white outline-none focus:border-[#C9A84C]/50 focus:bg-white/15 transition-all"
            />
            <button className="absolute top-1/2 -translate-y-1/2 p-1.5 text-white/60 hover:text-[#C9A84C] transition-colors right-3">
              <span className="material-symbols-outlined">search</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;