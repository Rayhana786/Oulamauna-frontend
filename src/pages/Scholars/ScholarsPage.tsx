import React, { useEffect, useMemo, useState } from "react";
import { useLang } from "../../context/LanguageContext";
import { Link, useSearchParams } from "react-router-dom";
import { scholarsApi, ApiScholar, ApiScholarVersion } from "../../api/scholarsApi";
import scholarFallbackImg from "../../assets/scholar.png";

// ── Types ──────────────────────────────────────────────────────────────────
type Language = "EN" | "AR" | "FR";

interface ScholarCardData {
  id: number;
  name: string;
  isFallback: boolean;
  displayedLanguage: string;
  requestedLanguage: string;
  nameAr?: string;
  years: string;
  region: string;
  excerpt: string;
  disciplines: string[];
  status: "deceased" | "living";
  image: string | null;
}

const LANG_CODE_BY_UI: Record<Language, string> = {
  EN: "en",
  AR: "ar",
  FR: "fr",
};

// ── Translations ───────────────────────────────────────────────────────────
const T = {
  EN: {
    breadcrumb: "HOME › SCHOLAR ENCYCLOPEDIA",
    breadcrumbHome: "HOME",
    breadcrumbCurrent: "SCHOLAR ENCYCLOPEDIA",
    heroTitle: "Explore the Intellectual Heritage",
    heroSub: "A comprehensive directory of polymaths, theologians, and scientists who shaped the global landscape of knowledge.",
    searchPlaceholder: "Search by name...",
    searchBtn: "SEARCH",
    filters: "FILTERS",
    clearAll: "Clear all",
    regionLabel: "REGION",
    centuryLabel: "CENTURY (AH)",
    disciplineLabel: "DISCIPLINE",
    statusLabel: "STATUS",
    statusAll: "ALL",
    statusDeceased: "DECEASED",
    showing: "Showing",
    of: "of",
    scholars: "Scholars",
    sortBy: "SORT BY:",
    biography: "BIOGRAPHY",
    addScholar: "ADD SCHOLAR",
    centuries: ["1st – 3rd Century", "4th – 6th Century", "7th – 9th Century"],
    sortOptions: ["Name (A-Z)", "Name (Z-A)", "Century (Oldest)", "Century (Newest)"],
    noScholars: "No scholars available in this language yet.",
    noResults: "No scholars match your search or filters.",
    tryChanging: "Try changing your search terms or clearing the filters.",
  },
  AR: {
    breadcrumb: "الرئيسية › موسوعة العلماء",
    breadcrumbHome: "الرئيسية",
    breadcrumbCurrent: "موسوعة العلماء",
    heroTitle: "استكشف الإرث الفكري الإسلامي",
    heroSub: "دليل شامل للعلماء والمفكرين والعلماء الذين شكّلوا الحضارة الإنسانية.",
    searchPlaceholder: "ابحث باسم العالم...",
    searchBtn: "بحث",
    filters: "التصفية",
    clearAll: "مسح الكل",
    regionLabel: "المنطقة",
    centuryLabel: "القرن (هـ)",
    disciplineLabel: "التخصص",
    statusLabel: "الحالة",
    statusAll: "الكل",
    statusDeceased: "متوفى",
    showing: "عرض",
    of: "من",
    scholars: "عالم",
    sortBy: "ترتيب:",
    biography: "السيرة الذاتية",
    addScholar: "إضافة عالِم",
    centuries: ["القرن 1-3", "القرن 4-6", "القرن 7-9"],
    sortOptions: ["الاسم (أ-ي)", "الاسم (ي-أ)", "الأقدم", "الأحدث"],
    noScholars: "لا يوجد علماء متاحون بهذه اللغة حتى الآن.",
    noResults: "لا يوجد علماء يطابقون بحثك أو التصفية.",
    tryChanging: "حاول تغيير كلمات البحث أو مسح التصفية.",
  },
  FR: {
    breadcrumb: "ACCUEIL › ENCYCLOPÉDIE DES SAVANTS",
    breadcrumbHome: "ACCUEIL",
    breadcrumbCurrent: "ENCYCLOPÉDIE DES SAVANTS",
    heroTitle: "Explorer le Patrimoine Intellectuel",
    heroSub: "Un répertoire complet de polymathes, théologiens et scientifiques qui ont façonné le savoir universel.",
    searchPlaceholder: "Rechercher par nom...",
    searchBtn: "RECHERCHER",
    filters: "FILTRES",
    clearAll: "Tout effacer",
    regionLabel: "RÉGION",
    centuryLabel: "SIÈCLE (AH)",
    disciplineLabel: "DISCIPLINE",
    statusLabel: "STATUT",
    statusAll: "TOUS",
    statusDeceased: "DÉCÉDÉ",
    showing: "Affichage de",
    of: "sur",
    scholars: "Savants",
    sortBy: "TRIER PAR :",
    biography: "BIOGRAPHIE",
    addScholar: "AJOUTER UN SAVANT",
    centuries: ["1er – 3e Siècle", "4e – 6e Siècle", "7e – 9e Siècle"],
    sortOptions: ["Nom (A-Z)", "Nom (Z-A)", "Le plus ancien", "Le plus récent"],
    noScholars: "Aucun savant disponible dans cette langue pour le moment.",
    noResults: "Aucun savant ne correspond à votre recherche ou aux filtres.",
    tryChanging: "Essayez de modifier votre recherche ou d'effacer les filtres.",
  },
};

// ── Mapping: Prisma API shape → what the UI needs ──────────────────────────
function computeYears(v: ApiScholarVersion): string {
  const dates = v.scholar_dates ?? [];
  const birth = dates.find((d) => d.date_type === "birth" && d.calendar === "gregorian")?.year;
  const death = dates.find((d) => d.date_type === "death" && d.calendar === "gregorian")?.year;
  if (birth && death) return `${birth} – ${death} CE`;
  if (birth) return `b. ${birth} CE`;
  return "";
}

// ✅ UPDATED: Now takes `version` instead of `scholar`, because disciplines are version-scoped
function getDisciplineNames(version: ApiScholarVersion): string[] {
  return (version.scholar_disciplines ?? [])
    .map((sd) => sd.disciplines?.name?.toUpperCase())
    .filter((x): x is string => Boolean(x));
}

function mapApiScholar(apiScholar: ApiScholar, lang: Language): ScholarCardData | null {
  const version = apiScholar.scholar_versions[0];
  if (!version) return null;

  const hasDeath = (version.scholar_dates ?? []).some((d) => d.date_type === "death");

  // ✅ UPDATED: Strip HTML tags from biography for the card excerpt so it doesn't show "<p><strong>..."
  const rawExcerpt = version.biography ?? "";
  const cleanExcerpt = rawExcerpt.replace(/<[^>]+>/g, '').trim();
  const shortExcerpt = cleanExcerpt.length > 150 ? cleanExcerpt.substring(0, 150) + "..." : cleanExcerpt;

  return {
    id: apiScholar.scholar_id,
    name: version.canonical_name,
    isFallback: false,
    displayedLanguage: version.languages?.code ?? "",
    requestedLanguage: lang.toLowerCase(),
    nameAr: version.scholar_aliases?.[0]?.alias_name,
    years: computeYears(version),
    region: version.regions?.name ?? "",
    excerpt: shortExcerpt, // Use the cleaned, shortened excerpt
    disciplines: getDisciplineNames(version), // ✅ Pass `version` here, not `apiScholar`
    status: hasDeath ? "deceased" : "living",
    image: version.image_url ?? null,
  };
}

// ── Discipline Tags with +N badge ──────────────────────────────────────────
const DisciplineTags: React.FC<{ disciplines: string[] }> = ({ disciplines }) => {
  const MAX_SHOW = 2;
  const visible = disciplines.slice(0, MAX_SHOW);
  const extra = disciplines.length - MAX_SHOW;

  const tagStyle: React.CSSProperties = {
    backgroundColor: "#1e4d3a", color: "#fff", fontSize: "9px", fontWeight: 700,
    letterSpacing: "0.1em", padding: "4px 9px", borderRadius: "6px",
    fontFamily: "'JetBrains Mono', monospace", border: "1px solid rgba(255,255,255,0.15)",
    backdropFilter: "blur(4px)", whiteSpace: "nowrap" as const,
  };
  const plusStyle: React.CSSProperties = {
    backgroundColor: "#C9A84C", color: "#fff", fontSize: "9px", fontWeight: 700,
    letterSpacing: "0.08em", padding: "4px 8px", borderRadius: "6px",
    fontFamily: "'JetBrains Mono', monospace", border: "1px solid rgba(255,255,255,0.2)",
    backdropFilter: "blur(4px)", whiteSpace: "nowrap" as const,
  };

  return (
    <div style={{ display: "flex", gap: "5px", flexWrap: "wrap" }}>
      {visible.map((d) => <span key={d} style={tagStyle}>{d}</span>)}
      {extra > 0 && <span style={plusStyle}>+{extra}</span>}
    </div>
  );
};

// ── Scholar Card ───────────────────────────────────────────────────────────
const ScholarCard: React.FC<{ scholar: ScholarCardData; lang: Language; biographyLabel: string }> = ({
  scholar, lang, biographyLabel,
}) => {
  const [hovered, setHovered] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);
  const isRTL = lang === "AR";
  const showFallback = !scholar.image || imgFailed;

  return (
    <Link to={`/scholars/${scholar.id}`} style={{ textDecoration: "none", display: "block", height: "100%" }}>
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        dir={isRTL ? "rtl" : "ltr"}
        style={{
          backgroundColor: "#F5F3EC", borderRadius: "16px", overflow: "hidden",
          boxShadow: hovered
            ? "0 20px 25px -5px rgba(30,77,58,0.15), 0 8px 10px -6px rgba(30,77,58,0.08)"
            : "0 2px 12px rgba(30,77,58,0.06)",
          transform: hovered ? "translateY(-4px)" : "translateY(0)",
          border: "1px solid rgba(30,77,58,0.1)",
          transition: "box-shadow 0.3s ease, transform 0.3s ease",
          display: "flex", flexDirection: "column", cursor: "pointer",
          height: "100%",
        }}
      >
        <div style={{ position: "relative", height: "200px", overflow: "hidden", flexShrink: 0 }}>
          <img
            src={showFallback ? scholarFallbackImg : (scholar.image as string)}
            alt={scholar.name}
            style={{
              width: "100%", height: "100%", objectFit: "cover",
              filter: hovered ? "grayscale(0%) brightness(1)" : "grayscale(100%) brightness(0.85)",
              transform: hovered ? "scale(1.05)" : "scale(1)",
              transition: "transform 0.4s ease, filter 0.45s ease",
            }}
            onError={() => setImgFailed(true)}
          />
          <div style={{ position: "absolute", top: "10px", left: isRTL ? "auto" : "10px", right: isRTL ? "10px" : "auto" }}>
            <DisciplineTags disciplines={scholar.disciplines} />
          </div>
        </div>

        <div style={{ padding: "20px 20px 0 20px", flex: 1 }}>
          <h3 style={{
            fontFamily: lang === "AR" ? "'Amiri', serif" : "'Hanken Grotesk', sans-serif",
            fontSize: "18px", fontWeight: 700, color: hovered ? "#C9A84C" : "#1e4d3a",
            margin: "0 0 4px 0", lineHeight: 1.3, transition: "color 0.2s ease",
            display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
            overflow: "hidden", minHeight: "44px",
          }}>
            {scholar.name}
          </h3>

          <p style={{
            fontFamily: "'Amiri', serif", fontSize: "13px", color: "#C9A84C",
            margin: "0 0 14px 0", direction: "rtl", textAlign: isRTL ? "left" : "right",
            minHeight: "20px",
          }}>
            {scholar.nameAr ?? ""}
          </p>

          <p style={{
            fontFamily: "'JetBrains Mono', monospace", fontSize: "11px", color: "#1e4d3a99",
            letterSpacing: "0.05em", fontWeight: 500, margin: "0 0 6px 0",
            minHeight: "16px", textTransform: "uppercase",
          }}>
            {scholar.years}
            {scholar.years && scholar.region && " • "}
            <span style={{ color: "#1e4d3a" }}>{scholar.region}</span>
          </p>

          <p style={{
            fontFamily: lang === "AR" ? "'Amiri', serif" : "'Inter', sans-serif",
            fontSize: "13px", color: "#1e4d3acc", lineHeight: 1.6, margin: 0,
            display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}>
            {scholar.excerpt}
          </p>
        </div>

        <div style={{
          padding: "16px 20px", marginTop: "16px",
          borderTop: hovered ? "1px solid #1e4d3a" : "1px solid rgba(30,77,58,0.1)",
          backgroundColor: hovered ? "#1e4d3a" : "transparent",
          transition: "background-color 0.25s ease, border-color 0.25s ease",
        }}>
          <span style={{
            fontFamily: "'JetBrains Mono', monospace", fontSize: "11px", fontWeight: 700,
            letterSpacing: "0.1em", color: hovered ? "#fbf9f4" : "#1e4d3a",
            display: "flex", alignItems: "center", gap: "8px",
            transition: "color 0.2s ease",
          }}>
            {biographyLabel}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
              style={{ transform: isRTL ? "rotate(180deg)" : "none" }}>
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </span>
        </div>
      </div>
    </Link>
  );
};

// ── Filter Checkbox ────────────────────────────────────────────────────────
const FilterCheckbox: React.FC<{
  label: string; count?: number; checked: boolean; onChange: () => void; isRTL?: boolean;
}> = ({ label, count, checked, onChange, isRTL }) => {
  const [hovered, setHovered] = useState(false);
  return (
    <label
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", padding: "4px 0" }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "9px" }}>
        <div onClick={onChange} style={{
          width: "16px", height: "16px",
          border: checked ? "none" : `1.5px solid ${hovered ? "#1e4d3a" : "rgba(30,77,58,0.3)"}`,
          borderRadius: "5px",
          backgroundColor: checked ? "#1e4d3a" : hovered ? "rgba(30,77,58,0.14)" : "transparent",
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, cursor: "pointer",
          transition: "background-color 0.2s ease, border-color 0.2s ease",
        }}>
          {checked && (
            <svg width="9" height="9" viewBox="0 0 12 12" fill="none">
              <path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </div>
        <span style={{
          fontFamily: "'Inter', sans-serif", fontSize: "13px",
          color: checked ? "#1e4d3a" : hovered ? "#1e4d3a" : "#1e4d3a99",
          fontWeight: checked ? 600 : 400, transition: "color 0.2s ease",
        }}>
          {label}
        </span>
      </div>
      {count !== undefined && <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "11px", color: "#1e4d3a66" }}>{count}</span>}
    </label>
  );
};

// ── Breadcrumb Home Link (text-link idiom: color shifts to green on hover) ─
const BreadcrumbHomeLink: React.FC<{ label: string }> = ({ label }) => {
  const [hovered, setHovered] = useState(false);
  return (
    <Link
      to="/"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        color: hovered ? "#1e4d3a" : "#C9A84C",
        textDecoration: "none",
        transition: "color 0.2s ease",
      }}
    >
      {label}
    </Link>
  );
};

// ── Hero Search Button (invert style, matching Home's primary CTAs) ────────
const HeroSearchButton: React.FC<{ label: string }> = ({ label }) => {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        backgroundColor: hovered ? "#fff" : "#1e4d3a",
        color: hovered ? "#1e4d3a" : "#fff",
        border: "none", borderInlineStart: "2px solid #1e4d3a", padding: "14px 28px",
        fontFamily: "'Hanken Grotesk', sans-serif", fontSize: "12px", fontWeight: 700,
        letterSpacing: "0.05em", cursor: "pointer", transition: "all 0.3s ease",
      }}
    >
      {label}
    </button>
  );
};

// ── Add Scholar Button (invert style, matching Home's primary CTAs) ────────
const AddScholarButton: React.FC<{ label: string }> = ({ label }) => {
  const [hovered, setHovered] = useState(false);
  return (
    <Link to="/scholars/submit" style={{ textDecoration: "none" }}>
      <button
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          display: "flex", alignItems: "center", gap: "9px", padding: "11px 22px",
          backgroundColor: hovered ? "#fbf9f4" : "#1e4d3a",
          color: hovered ? "#1e4d3a" : "#fff",
          border: "2px solid #1e4d3a",
          borderRadius: "8px", fontFamily: "'Hanken Grotesk', sans-serif", fontSize: "12px",
          fontWeight: 700, letterSpacing: "0.05em", cursor: "pointer",
          boxShadow: hovered ? "none" : "0 2px 10px rgba(30,77,58,0.18)",
          transition: "all 0.3s ease",
        }}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
          style={{ transform: hovered ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.3s ease" }}>
          <path d="M12 5v14M5 12h14" />
        </svg>
        {label}
      </button>
    </Link>
  );
};

// ── Sort Trigger Button (subtle border-only hover, matching Home's small
//    outlined chrome — no full fill) ─────────────────────────────────────
const SortTriggerButton: React.FC<{
  sortByLabel: string; sortValue: string; open: boolean; onClick: () => void;
}> = ({ sortByLabel, sortValue, open, onClick }) => {
  const [hovered, setHovered] = useState(false);
  const active = hovered || open;
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex", alignItems: "center", gap: "8px", padding: "9px 16px",
        border: `1.5px solid ${active ? "#1e4d3a" : "rgba(30,77,58,0.25)"}`,
        borderRadius: "8px", backgroundColor: "#fff",
        fontFamily: "'Inter', sans-serif", fontSize: "12px", color: "#1e4d3a", cursor: "pointer",
        boxShadow: "0 1px 4px rgba(30,77,58,0.06)", transition: "border-color 0.2s ease",
      }}
    >
      <span style={{
        fontFamily: "'JetBrains Mono', monospace", fontSize: "10px",
        color: "#1e4d3a66", letterSpacing: "0.08em", fontWeight: 600,
      }}>
        {sortByLabel}
      </span>
      {sortValue}
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
        style={{ transform: open ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s" }}>
        <path d="M6 9l6 6 6-6" />
      </svg>
    </button>
  );
};

// ── Pagination buttons (border-only hover; active page keeps its fill) ─────
const PageArrowButton: React.FC<{ onClick: () => void; path: string }> = ({ onClick, path }) => {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: "36px", height: "36px", borderRadius: "8px",
        border: `1.5px solid ${hovered ? "#1e4d3a" : "rgba(30,77,58,0.25)"}`,
        backgroundColor: "#fff", cursor: "pointer", display: "flex", alignItems: "center",
        justifyContent: "center", color: "#1e4d3a", transition: "border-color 0.2s ease",
      }}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d={path} />
      </svg>
    </button>
  );
};

const PageNumberButton: React.FC<{ page: number; active: boolean; onClick: () => void }> = ({ page, active, onClick }) => {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: "36px", height: "36px", borderRadius: "8px",
        border: `1.5px solid ${active || hovered ? "#1e4d3a" : "rgba(30,77,58,0.25)"}`,
        backgroundColor: active ? "#1e4d3a" : "#fff",
        color: active ? "#fff" : "#1e4d3a",
        fontFamily: "'Hanken Grotesk', sans-serif", fontSize: "13px",
        fontWeight: active ? 700 : 400, cursor: "pointer", transition: "border-color 0.2s ease, background-color 0.2s ease",
      }}
    >
      {page}
    </button>
  );
};

const PAGE_SIZE = 12;

// ── Main Page ──────────────────────────────────────────────────────────────
const ScholarsPage: React.FC = () => {
  const { lang } = useLang();
  const t = T[lang];
  const isRTL = lang === "AR";

  const [searchParams, setSearchParams] = useSearchParams();

  const [scholars, setScholars] = useState<ScholarCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState(searchParams.get("q") || "");
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [selectedDisciplines, setSelectedDisciplines] = useState<string[]>([]);
  const [sort, setSort] = useState(t.sortOptions[0]);
  const [sortOpen, setSortOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // ✅ NEW: Backend fetched filter options
  const [availableRegions, setAvailableRegions] = useState<string[]>([]);
  const [availableDisciplines, setAvailableDisciplines] = useState<string[]>([]);

  // ✅ 1. Extract ALL filters from the URL at the VERY TOP
  const minYear = searchParams.get("minYear") || undefined;
  const maxYear = searchParams.get("maxYear") || undefined;
  const urlDiscipline = searchParams.get("discipline") || undefined;

  const isSearchingOrFiltering =
    search.trim() !== "" ||
    selectedRegions.length > 0 ||
    selectedDisciplines.length > 0 ||
    !!urlDiscipline;

  // ✅ 2. Sync the UI checkbox with the URL discipline
  useEffect(() => {
    if (urlDiscipline) {
      setSelectedDisciplines([urlDiscipline]);
    } else {
      setSelectedDisciplines([]);
    }
  }, [urlDiscipline]);

  // ✅ 3. Updated useEffect to pass ALL filters to the API
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    scholarsApi
      .list(LANG_CODE_BY_UI[lang], { minYear, maxYear, discipline: urlDiscipline })
      .then((res) => {
        if (cancelled) return;
        const mapped = res.data
          .map((s) => mapApiScholar(s, lang))
          .filter((s): s is ScholarCardData => s !== null);
        setScholars(mapped);
        setCurrentPage(1);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || "Failed to load scholars");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [lang, minYear, maxYear, urlDiscipline]);

   // ✅ NEW: Fetch Regions and Disciplines from backend
  // Now passes the current language, and re-runs when language changes
  useEffect(() => {
    const langCode = LANG_CODE_BY_UI[lang]; // "en", "ar", or "fr"

    scholarsApi
      .getRegions(langCode)
      .then((res: any) => {
        const list = Array.isArray(res) ? res : res?.data ?? [];
        setAvailableRegions(list.map((r: any) => r.name).filter(Boolean));
      })
      .catch((err) => console.error("Failed to load regions:", err));

    scholarsApi
      .getDisciplines(langCode)
      .then((res: any) => {
        const list = Array.isArray(res) ? res : res?.data ?? [];
        setAvailableDisciplines(list.map((d: any) => d.name).filter(Boolean));
      })
      .catch((err) => console.error("Failed to load disciplines:", err));
  }, [lang]); // 👈 Re-fetch when language changes!
  useEffect(() => {
    const q = searchParams.get("q") || "";
    if (q !== search) {
      setSearch(q);
    }
  }, [searchParams]);

  const toggle = (arr: string[], setArr: (v: string[]) => void, val: string) => {
    setArr(arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val]);
  };

  const clearAll = () => {
    setSelectedRegions([]);
    setSelectedDisciplines([]);
    
    setSearch("");
    setSearchParams({});
  };

  const filtered = useMemo(() => {
    let list = [...scholars];

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((s) =>
        s.name.toLowerCase().includes(q) || s.region.toLowerCase().includes(q)
      );
    }
    if (selectedRegions.length > 0) {
      list = list.filter((s) => selectedRegions.some((r) => s.region.toLowerCase().includes(r.toLowerCase())));
    }
    if (selectedDisciplines.length > 0) {
      list = list.filter((s) =>
        s.disciplines.some((d) => selectedDisciplines.some((sd) => d.includes(sd.toUpperCase())))
      );
    }
   

    if (sort === t.sortOptions[0]) list.sort((a, b) => a.name.localeCompare(b.name));
    if (sort === t.sortOptions[1]) list.sort((a, b) => b.name.localeCompare(a.name));

    return list;
  }, [scholars, search, selectedRegions, selectedDisciplines, sort, t.sortOptions]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <div dir={isRTL ? "rtl" : "ltr"} style={{ minHeight: "100vh", backgroundColor: "#fbf9f4", fontFamily: "'Inter', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');

        @media (max-width: 900px) {
          .scholars-hero { padding: 36px 20px 40px !important; }
          .scholars-body { flex-direction: column !important; gap: 28px !important; padding: 28px 16px !important; }
          .scholars-sidebar { width: 100% !important; position: static !important; }
          .scholars-filter-groups { flex-direction: row !important; flex-wrap: wrap !important; gap: 24px !important; }
          .scholars-filter-groups > div { margin-bottom: 0 !important; min-width: 140px; flex: 1 1 140px; }
          .scholars-toolbar { flex-wrap: wrap !important; gap: 14px !important; }
          .scholars-actions { width: 100% !important; }
          .scholars-grid { grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)) !important; gap: 14px !important; }
        }

        @media (max-width: 520px) {
          .scholars-search-bar { flex-wrap: wrap !important; }
          .scholars-search-input { min-width: 0; }
          .scholars-actions { gap: 8px !important; }
          .scholars-actions button { padding: 7px 12px !important; font-size: 10.5px !important; gap: 6px !important; }
          .scholars-grid { grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)) !important; }
          .scholars-pagination { flex-wrap: wrap !important; }
          .scholars-pagination button { width: 30px !important; height: 30px !important; }
        }

        .scholars-filter-list { max-height: 210px; overflow-y: auto; padding-right: 8px; }
        .scholars-filter-list::-webkit-scrollbar { width: 5px; }
        .scholars-filter-list::-webkit-scrollbar-track { background: transparent; }
        .scholars-filter-list::-webkit-scrollbar-thumb { background: rgba(30,77,58,0.25); border-radius: 3px; }
        .scholars-filter-list::-webkit-scrollbar-thumb:hover { background: rgba(30,77,58,0.4); }
      `}</style>

      {/* Hero */}
      <section className="scholars-hero" style={{
        backgroundColor: "#fbf9f4", padding: "48px 40px 56px", textAlign: "center",
        position: "relative", overflow: "hidden", borderBottom: "1px solid rgba(30,77,58,0.1)",
      }}>
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: "radial-gradient(circle at 50% 0%, rgba(201,168,76,0.08) 0%, transparent 60%)",
          pointerEvents: "none",
        }} />

        <p style={{
          fontFamily: "'JetBrains Mono', monospace", fontSize: "11px", fontWeight: 700,
          letterSpacing: "0.2em", color: "#C9A84C", textTransform: "uppercase",
          margin: "0 0 14px 0", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
        }}>
          <BreadcrumbHomeLink label={t.breadcrumbHome} />
          <span style={{ color: "#1e4d3a66" }}>›</span>
          <span>{t.breadcrumbCurrent}</span>
        </p>

        <h1 style={{
          fontFamily: "'Hanken Grotesk', sans-serif",
          fontSize: "clamp(32px, 5vw, 52px)", fontWeight: 700, color: "#1e4d3a",
          margin: "0 0 18px 0", lineHeight: 1.15, maxWidth: "600px", marginLeft: "auto", marginRight: "auto",
        }}>
          {t.heroTitle}
        </h1>

        <p style={{
          fontFamily: lang === "AR" ? "'Amiri', serif" : "'Inter', sans-serif",
          fontSize: "15px", color: "#1e4d3a99", maxWidth: "480px", margin: "0 auto 40px", lineHeight: 1.7,
        }}>
          {t.heroSub}
        </p>

        <div className="scholars-search-bar" style={{
          maxWidth: "560px", margin: "0 auto", display: "flex", alignItems: "center",
          backgroundColor: "#fff", borderRadius: "12px", overflow: "hidden",
          border: "2px solid #1e4d3a", boxShadow: "0 4px 20px rgba(30,77,58,0.08)",
        }}>
          <div style={{ padding: "0 16px", color: "#1e4d3a66", display: "flex", alignItems: "center" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.3-4.3" />
            </svg>
          </div>
          <input
            type="text"
            className="scholars-search-input"
            value={search}
            onChange={(e) => { 
              const val = e.target.value;
              setSearch(val); 
              setCurrentPage(1); 
              if (val) setSearchParams({ q: val }); 
              else setSearchParams({});
            }}
            placeholder={t.searchPlaceholder}
            style={{
              flex: 1, border: "none", outline: "none",
              fontFamily: lang === "AR" ? "'Amiri', serif" : "'Inter', sans-serif",
              fontSize: "13px", color: "#1e4d3a", padding: "14px 0",
              backgroundColor: "transparent", textAlign: isRTL ? "right" : "left",
            }}
          />
          <HeroSearchButton label={t.searchBtn} />
        </div>
      </section>

      {/* Body */}
      <div className="scholars-body" style={{
        maxWidth: "1280px", margin: "0 auto", padding: "40px 24px",
        display: "flex", gap: "40px", alignItems: "flex-start",
      }}>

        {/* Sidebar */}
        <aside className="scholars-sidebar" style={{ width: "200px", flexShrink: 0, position: "sticky", top: "100px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "11px", fontWeight: 700, letterSpacing: "0.12em", color: "#1e4d3a" }}>{t.filters}</span>
            <button
              onClick={clearAll}
              style={{ fontSize: "12px", color: "#C9A84C", background: "none", border: "none", cursor: "pointer", fontFamily: "'Inter', sans-serif", fontWeight: 600, transition: "color 0.2s ease" }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "#1e4d3a")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "#C9A84C")}
            >
              {t.clearAll}
            </button>
          </div>

          <div className="scholars-filter-groups" style={{ display: "flex", flexDirection: "column" }}>
          {/* ✅ DYNAMIC REGIONS FROM BACKEND */}
          <div style={{ marginBottom: "24px" }}>
            <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10px", fontWeight: 700, letterSpacing: "0.1em", color: "#1e4d3a66", marginBottom: "10px" }}>{t.regionLabel}</p>
            <div className="scholars-filter-list" style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              {availableRegions.length > 0 ? (
                availableRegions.map((r) => (
                  <FilterCheckbox key={r} label={r} isRTL={isRTL}
                    checked={selectedRegions.includes(r)}
                    onChange={() => { toggle(selectedRegions, setSelectedRegions, r); setCurrentPage(1); }} />
                ))
              ) : (
                <span style={{ fontSize: "11px", color: "#1e4d3a66" }}>Loading...</span>
              )}
            </div>
          </div>

          {/* ✅ DYNAMIC DISCIPLINES FROM BACKEND */}
          <div style={{ marginBottom: "24px" }}>
            <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10px", fontWeight: 700, letterSpacing: "0.1em", color: "#1e4d3a66", marginBottom: "10px" }}>{t.disciplineLabel}</p>
            <div className="scholars-filter-list" style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              {availableDisciplines.length > 0 ? (
                availableDisciplines.map((d) => (
                  <FilterCheckbox key={d} label={d} isRTL={isRTL}
                    checked={selectedDisciplines.includes(d)}
                    onChange={() => { toggle(selectedDisciplines, setSelectedDisciplines, d); setCurrentPage(1); }} />
                ))
              ) : (
                <span style={{ fontSize: "11px", color: "#1e4d3a66" }}>Loading...</span>
              )}
            </div>
          </div>
          </div>
        </aside>

        {/* Main Content */}
        <main style={{ flex: 1, minWidth: 0 }}>
          <div className="scholars-toolbar" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "28px" }}>
            <p style={{ fontSize: "13px", color: "#1e4d3a99", fontFamily: "'Inter', sans-serif" }}>
              {t.showing} <strong style={{ color: "#1e4d3a" }}>{pageItems.length}</strong> {t.of}{" "}
              <strong style={{ color: "#1e4d3a" }}>{filtered.length}</strong> {t.scholars}
            </p>

            <div className="scholars-actions" style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <AddScholarButton label={t.addScholar} />
              

              <div style={{ position: "relative" }}>
                <SortTriggerButton sortByLabel={t.sortBy} sortValue={sort} open={sortOpen} onClick={() => setSortOpen((v) => !v)} />
                {sortOpen && (
                  <div style={{
                    position: "absolute", top: "calc(100% + 4px)", right: isRTL ? "auto" : 0, left: isRTL ? 0 : "auto",
                    zIndex: 50, backgroundColor: "#fff", border: "1px solid rgba(30,77,58,0.12)", borderRadius: "10px",
                    boxShadow: "0 8px 24px rgba(30,77,58,0.14)", overflow: "hidden", minWidth: "180px",
                  }}>
                    {t.sortOptions.map((o) => (
                      <button key={o} onClick={() => { setSort(o); setSortOpen(false); }} style={{
                        width: "100%", padding: "10px 16px", textAlign: isRTL ? "right" : "left", border: "none",
                        backgroundColor: sort === o ? "#F5F3EC" : "transparent",
                        color: sort === o ? "#1e4d3a" : "#1e4d3a99",
                        fontFamily: lang === "AR" ? "'Amiri', serif" : "'Inter', sans-serif",
                        fontSize: "12px", fontWeight: sort === o ? 600 : 400, cursor: "pointer",
                      }}
                        onMouseEnter={(e) => { if (sort !== o) (e.currentTarget as HTMLElement).style.backgroundColor = "#F5F3EC"; }}
                        onMouseLeave={(e) => { if (sort !== o) (e.currentTarget as HTMLElement).style.backgroundColor = "transparent"; }}
                      >
                        {o}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {loading && (
            <p style={{ textAlign: "center", padding: "60px 0", color: "#1e4d3a99", fontFamily: "'Inter', sans-serif" }}>
              Loading…
            </p>
          )}

          {!loading && error && (
            <p style={{ textAlign: "center", padding: "60px 0", color: "#b23b3b", fontFamily: "'Inter', sans-serif" }}>
              {error}
            </p>
          )}

          {!loading && !error && (
            <>
              <div className="scholars-grid" style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
                gap: "20px",
                alignItems: "stretch",
              }}>
                {pageItems.map((s) => (
                  <ScholarCard key={s.id} scholar={s} lang={lang} biographyLabel={t.biography} />
                ))}
              </div>

              {pageItems.length === 0 && (
                <div style={{
                  textAlign: "center",
                  padding: "60px 20px",
                  color: "#1e4d3a99",
                  fontFamily: lang === "AR" ? "'Amiri', serif" : "'Inter', sans-serif",
                  backgroundColor: "#F5F3EC",
                  borderRadius: "16px",
                  border: "1px dashed rgba(30,77,58,0.25)"
                }}>
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#1e4d3a66" strokeWidth="1.5" style={{ margin: "0 auto 16px", display: "block" }}>
                    <circle cx="11" cy="11" r="8" />
                    <path d="M21 21l-4.3-4.3" />
                    {isSearchingOrFiltering && <path d="M8 11h6" />}
                  </svg>

                  <p style={{ fontFamily: "'Hanken Grotesk', sans-serif", fontSize: "18px", fontWeight: 700, color: "#1e4d3a", margin: "0 0 8px 0" }}>
                    {isSearchingOrFiltering ? t.noResults : t.noScholars}
                  </p>

                  {isSearchingOrFiltering && (
                    <p style={{ fontSize: "14px", color: "#1e4d3a80", margin: 0 }}>
                      {t.tryChanging}
                    </p>
                  )}
                </div>
              )}

              <div className="scholars-pagination" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", marginTop: "48px", paddingBottom: "24px" }}>
                <PageArrowButton
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  path={isRTL ? "M9 18l6-6-6-6" : "M15 18l-6-6 6-6"}
                />

                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .slice(0, 5)
                  .map((p) => (
                    <PageNumberButton key={p} page={p} active={currentPage === p} onClick={() => setCurrentPage(p)} />
                  ))}

                <PageArrowButton
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  path={isRTL ? "M15 18l-6-6 6-6" : "M9 18l6-6-6-6"}
                />
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default ScholarsPage;