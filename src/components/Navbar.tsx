import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom"; // ✅ Added useNavigate
import ProfileMenu from "./ProfileMenu";
import { useAuth } from "../context/AuthContext";
import { useLang } from "../context/LanguageContext";

import oulamaunaLogo from '../assets/OOLOGO.png';
type Language = "EN" | "AR" | "FR";

const NAV_IDS = ["HOME", "SCHOLARS", "BLOGS", "ABOUT", "CONTACT"] as const;
const PATHS: Record<string, string> = {
  HOME: "/",
  SCHOLARS: "/scholars",
  BLOGS: "/blogs",
  ABOUT: "/about",
  CONTACT: "/contact",
};

const T: Record<
  Language,
  { links: string[]; login: string; register: string; placeholder: string }
> = {
  EN: {
    links: ["Home", "Scholars", "Blogs", "About", "Contact"],
    login: "Login",
    register: "Register",
    placeholder: "Search scholars, topics…",
  },
  AR: {
    links: ["الرئيسية", "العلماء", "المدونة", "عنا", "اتصل"],
    login: "دخول",
    register: "تسجيل",
    placeholder: "ابحث عن علماء…",
  },
  FR: {
    links: ["Accueil", "Savants", "Blogs", "À propos", "Contact"],
    login: "Connexion",
    register: "S'inscrire",
    placeholder: "Chercher…",
  },
};

const LANG_FULL: Record<Language, string> = {
  EN: "English",
  AR: "العربية",
  FR: "Français",
};

/* ── Icons ─ */
const IcoSearch = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/>
    <path d="M21 21l-4.3-4.3"/>
  </svg>
);

const IcoX = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6L6 18M6 6l12 12"/>
  </svg>
);

const IcoGlobe = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9"/>
    <path d="M3.6 9h16.8M3.6 15h16.8M12 3a15 15 0 010 18M12 3a15 15 0 000 18"/>
  </svg>
);

const IcoBell = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 8a6 6 0 0112 0c0 7 3 9 3 9H3s3-2 3-9"/>
    <path d="M10.3 21a2 2 0 003.4 0"/>
  </svg>
);

const IcoChev = ({ open }: { open: boolean }) => (
  <svg
    width="12" height="12" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}
  >
    <path d="M6 9l6 6 6-6"/>
  </svg>
);

/* ────────────────────────────────── */
const Navbar: React.FC = () => {
  const { lang, setLang } = useLang();
  const { isLoggedIn, logout, user } = useAuth();
  
  // ✅ Added useNavigate and searchQuery state
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  const [active, setActive] = useState("HOME");
  const [searchOpen, setSearchOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);

  const lastY = useRef(0);
  const langRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const location = useLocation();
  const isHome = location.pathname === "/";
  const isRTL = lang === "AR";
  const t = T[lang];
  const isSolid = !isHome || scrolled;
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // Active link sync
  useEffect(() => {
    const m = NAV_IDS.find((id) => PATHS[id] === location.pathname);
    if (m) setActive(m);
  }, [location.pathname]);

  // Scroll behavior
  useEffect(() => {
    const fn = () => {
      const y = window.scrollY;
      setScrolled(y > 30);
      if (y > 80) {
        const d = y - lastY.current;
        if (d > 10) {
          setHidden(true);
          setLangOpen(false);
          setSearchOpen(false);
          setProfileOpen(false);
        }
        if (d < -10) setHidden(false);
      } else setHidden(false);
      lastY.current = y;
    };
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node))
        setLangOpen(false);
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  // Auto-focus search
  useEffect(() => {
    if (searchOpen) setTimeout(() => inputRef.current?.focus(), 80);
  }, [searchOpen]);
   useEffect(() => {
    const query = searchQuery.trim();
    
    // If user is typing, wait 0.5 seconds then redirect to list page
    if (query.length > 0) {
      const timer = setTimeout(() => {
        navigate(`/scholars?q=${encodeURIComponent(query)}`);
      }, 500); 
      return () => clearTimeout(timer);
    } 
    // If user cleared the search bar, go back to normal list
    else if (location.pathname === "/scholars" && location.search !== "") {
      navigate("/scholars");
    }
  }, [searchQuery, navigate, location.pathname, location.search]);

  /* ── Icon Button Class ── */
  const iconCls = (on: boolean) =>
  `w-10 h-10 flex items-center justify-center rounded-xl transition-colors duration-200 focus:outline-none
   ${on ? "text-[#C9A84C] hover:text-[#B8B09A]" : "text-[#B8B09A] hover:text-[#C9A84C]"}`;

  return (
    <>
      <nav
        dir={isRTL ? "rtl" : "ltr"}
        className={`
          fixed inset-x-0 top-0 z-[100]
          transition-all duration-300
          ${hidden ? "-translate-y-full" : "translate-y-0"}
          ${
            isSolid
              ? "bg-[#285B4B] shadow-[0_4px_24px_rgba(28,70,55,0.4)]"
              : "bg-transparent"
          }
          /* This logic makes the height bigger and adds top padding ONLY on home */
          ${isHome ? "h-[96px] pt-3" : "h-[80px]"}
        `}
      >
        <div className="h-full flex items-center px-5 md:px-8 lg:px-14">

          {/* ── BRAND ─ */}
          <Link to="/" className="shrink-0 flex items-center gap-3 group" style={{ width: 'auto', minWidth: '200px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginLeft: '-30px' }}>
              <img
                src={oulamaunaLogo}
                alt="Oulamauna Logo"
                style={{
                  height: isHome && !scrolled ? '150px' : '150px',
                  width: isHome && !scrolled ? '150px' : '150px',
                  objectFit: 'contain',
                  marginBottom: isHome && !scrolled ? '-0px' : '-10px',
                  display: 'block',
                  transition: 'height 0.3s ease, width 0.3s ease, margin-bottom 0.3s ease',
                  mixBlendMode: 'lighten',
                }}
              />
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '2px',
                opacity: isHome && !scrolled ? 1 : 0,
                transition: 'opacity 0.3s ease',
                pointerEvents: 'none',
              }}>
              </div>
            </div>
          </Link>

          {/* ── NAV LINKS ── */}
          <ul className={`hidden lg:flex items-center h-full flex-1 ${isRTL ? "justify-center translate-x-16" : "justify-center -translate-x-16"}`}>
            {NAV_IDS.map((id, i) => {
              const on = active === id;
              return (
                <li key={id} className="h-full flex items-center ">
                  <Link
                    to={PATHS[id]}
                    onClick={() => setActive(id)}
                    onMouseEnter={() => setHoveredId(id)}
                    onMouseLeave={() => setHoveredId(null)}
                    className={`
                      relative h-full px-4 flex items-center 
                      transition-colors duration-200 focus:outline-none
                      ${isRTL ? "text-[15px]" : "text-[13px] tracking-[0.06em]"}
                      ${
                        hoveredId
                          ? hoveredId === id
                            ? "text-[#C9A84C]"
                            : "text-[#ffff]"
                          : on
                          ? "text-[#C9A84C]"
                          : "text-[#ffff]"
                      }
                    `}
                  >
                    {t.links[i]}
                  </Link>
                </li>
              );
            })}
          </ul>

          {/* ── UTILITIES ── */}
          <div className="shrink-0 flex items-center gap-0.5 justify-end w-[260px]">

            {/* Search - ✅ MODIFIED */}
            <div className="flex items-center justify-end">
              <div className={`
                overflow-hidden transition-all duration-200
                ${searchOpen ? "w-52 me-1 opacity-100" : "w-0 opacity-0"}
              `}>
                <input
                  ref={inputRef}
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                 
                  placeholder={t.placeholder}
                  className={`
                    w-full h-9 px-3.5 rounded-full text-[12px] text-white
                    bg-white/10 border border-white/15 placeholder-[#B8B09A]
                    outline-none focus:border-[#C9A84C]/50 focus:bg-white/[0.13]
                    transition-all duration-200
                    ${isRTL ? "text-right" : ""}
                  `}
                  style={isRTL ? { fontFamily: "'Amiri', serif" } : {}}
                />
              </div>
              <button onClick={() => setSearchOpen((v) => !v)} aria-label="Search" className={iconCls(searchOpen)}>
                {searchOpen ? <IcoX /> : <IcoSearch />}
              </button>
            </div>

            {/* Language */}
            <div className="relative" ref={langRef}>
              <button
                onClick={() => { setLangOpen((v) => !v); setSearchOpen(false); }}
                aria-label="Language"
                className={iconCls(langOpen)}
              >
                <IcoGlobe />
                <IcoChev open={langOpen} />
              </button>

              <div className={`
                absolute top-[calc(100%+8px)] end-0 z-[110] w-[140px]
                rounded-xl overflow-hidden
                bg-[#285B4B] border border-white/10
                shadow-[0_12px_32px_rgba(0,0,0,0.3)]
                transition-all duration-200
                ${langOpen
                  ? "opacity-100 scale-100 translate-y-0 pointer-events-auto"
                  : "opacity-0 scale-95 -translate-y-1 pointer-events-none"
                }
              `}>
                {(["EN", "AR", "FR"] as Language[]).map((l) => {
                  const isSelected = lang === l;
                  return (
                    <button
                      key={l}
                      onClick={() => { setLang(l); setLangOpen(false); }}
                      className={`
                        w-full flex items-center gap-3 px-4 py-2.5 text-start
                        transition-colors duration-150
                        ${l === "AR" ? "text-[13px]" : "text-[12px]"}
                        ${isSelected
                          ? "text-[#C9A84C] bg-white/5"
                          : "text-[#B8B09A] hover:text-[#C9A84C] hover:bg-white/5"
                        }
                      `}
                      style={l === "AR" ? { fontFamily: "'Amiri', serif" } : {}}
                    >
                      <span className={`w-[2px] h-4 rounded-full transition-all duration-150 ${isSelected ? "bg-[#C9A84C]" : "bg-transparent"}`} />
                      {LANG_FULL[l]}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="w-px h-4 bg-[#B8B09A]/30 mx-1.5" aria-hidden="true" />

            {!isLoggedIn ? (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className={`
                    h-9 px-3 flex items-center rounded-xl 
                    text-[#ffff] hover:text-[#C9A84C]
                    transition-colors duration-200 focus:outline-none
                    ${isRTL ? "text-[15px]" : "text-[13px] tracking-[0.04em]"}
                  `}
                >
                  {t.login}
                </Link>
                <Link
                  to="/register"
                  className={`
                    h-9 px-5 flex items-center rounded-full 
                    bg-[#B78726] text-[#ffff]
                    hover:bg-[#B8B09A] hover:text-[#285B4B]
                    active:scale-[0.98] transition-all duration-200
                    whitespace-nowrap focus:outline-none
                    ${isRTL ? "text-[14px]" : "text-[12px] tracking-[0.08em]"}
                  `}
                >
                  {t.register}
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-0.5">
                <button
                  aria-label="Notifications"
                  className="relative w-10 h-10 flex items-center justify-center rounded-xl
                    text-[#B8B09A] hover:text-[#C9A84C] transition-colors duration-200 focus:outline-none"
                >
                  <IcoBell />
                  <span className="absolute top-2 end-2 w-[6px] h-[6px] rounded-full bg-[#C9A84C] ring-1 ring-[#285B4B]" />
                </button>

                <ProfileMenu
                  lang={lang}
                  logout={logout}
                  isOpen={profileOpen}
                  onToggle={() => setProfileOpen((p) => !p)}
                  onClose={() => setProfileOpen(false)}
                  userName={user?.username}
                  userEmail={user?.email}  
                  userImage={user?.avatar}
                />
              </div>
            )}
          </div>
        </div>
      </nav>

      {!isHome && <div className="h-[80px]" aria-hidden="true" />}
    </>
  );
};

export default Navbar;