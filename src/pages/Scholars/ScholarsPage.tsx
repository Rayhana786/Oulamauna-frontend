import React, { useEffect, useMemo, useState } from "react";
import { useLang } from "../../context/LanguageContext";
import { Link } from "react-router-dom";
import { scholarsApi, ApiScholar } from "../../api/scholarsApi";

// ── Types ──────────────────────────────────────────────────────────────────
type Language = "EN" | "AR" | "FR";

interface ScholarCardData {
  id: number;
  name: string;

  isFallback: boolean;
  displayedLanguage: string;
  requestedLanguage: string;        // single string now — API only returns ONE language per fetch
  nameAr?: string;      // only present if the fetched language IS arabic
  years: string;
  region: string;
  excerpt: string;
  disciplines: string[];
  status: "deceased" | "living";
  image: string | null;
}

// ⚠️ CONFIRM these against your real `languages` table — this is a guess
// based on typical seed order. If wrong, discipline names won't match.
const LANGUAGE_ID_BY_CODE: Record<Language, number> = {
  AR: 1,
  EN: 2,
  FR: 3,
};
const LANG_CODE_BY_UI: Record<Language, string> = {
  EN: "en",
  AR: "ar",
  FR: "fr",
};

// ── Translations (unchanged) ────────────────────────────────────────────────
const T = {
  EN: {
    breadcrumb: "HOME › SCHOLAR ENCYCLOPEDIA",
    heroTitle: "Explore the Intellectual Heritage",
    heroSub: "A comprehensive directory of polymaths, theologians, and scientists who shaped the global landscape of knowledge.",
    searchPlaceholder: "Search by name, discipline, or region...",
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
    regions: ["Andalusia", "Maghreb", "Khorasan", "Hijaz"],
    centuries: ["1st – 3rd Century", "4th – 6th Century", "7th – 9th Century"],
       disciplines: ["Tafsir", "Hadith", "Fiqh", "Astronomy", "Philosophy"],
    sortOptions: ["Name (A-Z)", "Name (Z-A)", "Century (Oldest)", "Century (Newest)"],
    noScholars: "No scholars available in this language yet.",
    noResults: "No scholars match your search or filters.",
    tryChanging: "Try changing your search terms or clearing the filters.",
  },
  AR: {
    breadcrumb: "الرئيسية › موسوعة العلماء",
    heroTitle: "استكشف الإرث الفكري الإسلامي",
    heroSub: "دليل شامل للعلماء والمفكرين والعلماء الذين شكّلوا الحضارة الإنسانية.",
    searchPlaceholder: "ابحث باسم العالم أو التخصص أو المنطقة...",
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
    regions: ["الأندلس", "المغرب", "خراسان", "الحجاز"],
    centuries: ["القرن 1-3", "القرن 4-6", "القرن 7-9"],
       disciplines: ["تفسير", "حديث", "فقه", "فلك", "فلسفة"],
    sortOptions: ["الاسم (أ-ي)", "الاسم (ي-أ)", "الأقدم", "الأحدث"],
    noScholars: "لا يوجد علماء متاحون بهذه اللغة حتى الآن.",
    noResults: "لا يوجد علماء يطابقون بحثك أو التصفية.",
    tryChanging: "حاول تغيير كلمات البحث أو مسح التصفية.",
  },
  FR: {
    breadcrumb: "ACCUEIL › ENCYCLOPÉDIE DES SAVANTS",
    heroTitle: "Explorer le Patrimoine Intellectuel",
    heroSub: "Un répertoire complet de polymathes, théologiens et scientifiques qui ont façonné le savoir universel.",
    searchPlaceholder: "Rechercher par nom, discipline ou région...",
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
    regions: ["Andalousie", "Maghreb", "Khorasan", "Hijaz"],
    centuries: ["1er – 3e Siècle", "4e – 6e Siècle", "7e – 9e Siècle"],
      disciplines: ["Tafsir", "Hadith", "Fiqh", "Astronomie", "Philosophie"],
    sortOptions: ["Nom (A-Z)", "Nom (Z-A)", "Le plus ancien", "Le plus récent"],
    noScholars: "Aucun savant disponible dans cette langue pour le moment.",
    noResults: "Aucun savant ne correspond à votre recherche ou vos filtres.",
    tryChanging: "Essayez de modifier votre recherche ou d'effacer les filtres.",
  },
};

// ── Mapping: Prisma API shape → what the UI needs ───────────────────────────
function computeYears(v: ApiScholar["scholar_versions"][0]): string {
  const birth = v.birth_date_gerogean;
  const death = v.death_date_gerogean;
  const by = birth ? new Date(birth).getFullYear() : null;
  const dy = death ? new Date(death).getFullYear() : null;
  if (by && dy) return `${by} – ${dy} CE`;
  if (by) return `b. ${by} CE`;
  return "";
}

function computeExcerpt(bio: string, max = 80): string {
  if (!bio) return "";
  return bio.length > max ? bio.slice(0, max) + "…" : bio;
}

function getDisciplineNames(scholar: ApiScholar, languageId: number): string[] {
  return scholar.scholar_disciplines
    .map((sd) => {
      const t = sd.disciplines?.discipline_translations?.find(
        (tr) => tr.language_id === languageId
      );
      return t?.name?.toUpperCase();
    })
    .filter((x): x is string => Boolean(x));
}

function mapApiScholar(apiScholar: ApiScholar, lang: Language): ScholarCardData | null {
  const version = apiScholar.scholar_versions[0];
  if (!version) return null; // shouldn't happen since GET / only returns scholars WITH an approved version

  return {
  id: apiScholar.scholar_id,
  name: version.canonical_name,

  isFallback: false,

displayedLanguage: version.languages?.code ?? "",

requestedLanguage: lang.toLowerCase(),
    nameAr: lang === "AR" ? version.canonical_name : undefined,
    years: computeYears(version),
    region: version.region ?? "",
    excerpt: computeExcerpt(version.biography),
    disciplines: getDisciplineNames(apiScholar, LANGUAGE_ID_BY_CODE[lang]),
    status: version.death_date_gerogean ? "deceased" : "living",
    image: null, // GET / has no media include — list page always uses the avatar fallback
  };
}

// ── Discipline Tags with +N badge (unchanged) ───────────────────────────────
const DisciplineTags: React.FC<{ disciplines: string[] }> = ({ disciplines }) => {
  const MAX_SHOW = 2;
  const visible = disciplines.slice(0, MAX_SHOW);
  const extra = disciplines.length - MAX_SHOW;

  const tagStyle: React.CSSProperties = {
    backgroundColor: "#0b4335", color: "#fff", fontSize: "9px", fontWeight: 700,
    letterSpacing: "0.1em", padding: "3px 8px", borderRadius: "2px",
    fontFamily: "'Inter', sans-serif", border: "1px solid rgba(255,255,255,0.15)",
    backdropFilter: "blur(4px)", whiteSpace: "nowrap" as const,
  };
  const plusStyle: React.CSSProperties = {
    backgroundColor: "#C9A84C", color: "#fff", fontSize: "9px", fontWeight: 700,
    letterSpacing: "0.08em", padding: "3px 7px", borderRadius: "2px",
    fontFamily: "'Inter', sans-serif", border: "1px solid rgba(255,255,255,0.2)",
    backdropFilter: "blur(4px)", whiteSpace: "nowrap" as const,
  };

  return (
    <div style={{ display: "flex", gap: "5px", flexWrap: "wrap" }}>
      {visible.map((d) => <span key={d} style={tagStyle}>{d}</span>)}
      {extra > 0 && <span style={plusStyle}>+{extra}</span>}
    </div>
  );
};

// ── Scholar Card ─────────────────────────────────────────────────────────
const ScholarCard: React.FC<{ scholar: ScholarCardData; lang: Language; biographyLabel: string }> = ({
  scholar, lang, biographyLabel,
}) => {
  const [hovered, setHovered] = useState(false);
  const isRTL = lang === "AR";
  const avatarFallback = `https://ui-avatars.com/api/?name=${encodeURIComponent(scholar.name)}&background=285B4B&color=C9A84C&size=400`;

  return (
    <Link to={`/scholars/${scholar.id}`} style={{ textDecoration: "none" }}>
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          backgroundColor: "#fff", borderRadius: "2px", overflow: "hidden",
          boxShadow: hovered ? "0 12px 40px rgba(0,0,0,0.15)" : "0 2px 12px rgba(0,0,0,0.06)",
          transform: hovered ? "translateY(-4px)" : "translateY(0)",
          transition: "box-shadow 0.25s ease, transform 0.25s ease",
          display: "flex", flexDirection: "column", cursor: "pointer",
          direction: isRTL ? "rtl" : "ltr",
        }}
      >
        <div style={{ position: "relative", height: "200px", overflow: "hidden" }}>
          <img
            src={scholar.image ?? avatarFallback}
            alt={scholar.name}
            style={{
              width: "100%", height: "100%", objectFit: "cover",
              filter: hovered ? "grayscale(0%) brightness(1)" : "grayscale(100%) brightness(0.85)",
              transform: hovered ? "scale(1.05)" : "scale(1)",
              transition: "transform 0.4s ease, filter 0.45s ease",
            }}
            onError={(e) => { (e.target as HTMLImageElement).src = avatarFallback; }}
          />
          <div style={{ position: "absolute", top: "10px", left: isRTL ? "auto" : "10px", right: isRTL ? "10px" : "auto" }}>
            <DisciplineTags disciplines={scholar.disciplines} />
          </div>
        </div>

        <div style={{ padding: "20px 20px 0 20px", flex: 1 }}>
          <h3 style={{
            fontFamily: lang === "AR" ? "'Amiri', serif" : "'Playfair Display', 'Georgia', serif",
            fontSize: "17px", fontWeight: 600, color: hovered ? "#C9A84C" : "#191c1b",
            margin: "0 0 4px 0", lineHeight: 1.3, transition: "color 0.2s ease",
          }}>
            {scholar.name}
          </h3>
          {scholar.nameAr && (
            <p style={{
              fontFamily: "'Amiri', serif", fontSize: "13px", color: "#C9A84C",
              margin: "0 0 14px 0", direction: "rtl", textAlign: isRTL ? "left" : "right",
            }}>
              {scholar.nameAr}
            </p>
          )}
          <p style={{
            fontFamily: "'Inter', sans-serif", fontSize: "11px", color: "#6b7775",
            letterSpacing: "0.06em", fontWeight: 500, margin: "0 0 6px 0",
          }}>
            {scholar.years} {scholar.years && "• "}<span style={{ color: "#404945" }}>{scholar.region}</span>
          </p>
          <p style={{
            fontFamily: lang === "AR" ? "'Amiri', serif" : "'Inter', sans-serif",
            fontSize: "13px", color: "#404945", lineHeight: 1.6, margin: 0,
          }}>
            {scholar.excerpt}
          </p>
        </div>

        <div style={{
          padding: "16px 20px", marginTop: "16px",
          borderTop: hovered ? "1px solid #0b4335" : "1px solid #e8ede9",
          backgroundColor: hovered ? "#0b4335" : "transparent",
          transition: "background-color 0.2s ease, border-color 0.2s ease",
        }}>
          <span style={{
            fontFamily: "'Inter', sans-serif", fontSize: "11px", fontWeight: 700,
            letterSpacing: "0.12em", color: hovered ? "#fff" : "#0b4335",
            display: "flex", alignItems: "center", gap: "8px",
            flexDirection: isRTL ? "row-reverse" : "row", transition: "color 0.2s ease",
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

// ── Filter Checkbox (unchanged) ─────────────────────────────────────────────
const FilterCheckbox: React.FC<{
  label: string; count?: number; checked: boolean; onChange: () => void; isRTL?: boolean;
}> = ({ label, count, checked, onChange, isRTL }) => (
  <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", padding: "4px 0" }}>
    <div style={{ display: "flex", alignItems: "center", gap: "9px", flexDirection: isRTL ? "row-reverse" : "row" }}>
      <div onClick={onChange} style={{
        width: "15px", height: "15px", border: checked ? "none" : "1.5px solid #ccc",
        borderRadius: "2px", backgroundColor: checked ? "#0b4335" : "transparent",
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, cursor: "pointer",
        transition: "background-color 0.15s ease",
      }}>
        {checked && (
          <svg width="9" height="9" viewBox="0 0 12 12" fill="none">
            <path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>
      <span style={{ fontFamily: "'Inter', sans-serif", fontSize: "13px", color: checked ? "#0b4335" : "#404945", fontWeight: checked ? 600 : 400 }}>
        {label}
      </span>
    </div>
    {count !== undefined && <span style={{ fontFamily: "'Inter', sans-serif", fontSize: "11px", color: "#c0c9c3" }}>{count}</span>}
  </label>
);

const PAGE_SIZE = 12;

// ── Main Page ────────────────────────────────────────────────────────────
const ScholarsPage: React.FC = () => {
  const { lang } = useLang();
  const t = T[lang];
  const isRTL = lang === "AR";

  const [scholars, setScholars] = useState<ScholarCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [selectedDisciplines, setSelectedDisciplines] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<"all" | "deceased">("all");
  const [sort, setSort] = useState(t.sortOptions[0]);
    const [sortOpen, setSortOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Check if the user is actively searching or using filters
  const isSearchingOrFiltering =
    search.trim() !== "" ||
    selectedRegions.length > 0 ||
    selectedDisciplines.length > 0 ||
    statusFilter !== "all";

  // Refetch whenever the language changes — the API only returns one
  // language version per call, so switching EN/AR/FR must hit the server again.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    scholarsApi
      .list(LANG_CODE_BY_UI[lang])
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
  }, [lang]);

  const toggle = (arr: string[], setArr: (v: string[]) => void, val: string) => {
    setArr(arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val]);
  };

  const clearAll = () => {
    setSelectedRegions([]);
    setSelectedDisciplines([]);
    setStatusFilter("all");
    setSearch("");
  };

  // Client-side filter/search/sort — the backend has no query params for
  // these yet (no ?region=, ?discipline=, ?q=, ?page=). Fine at current
  // scale; move server-side once the scholar count grows.
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
    if (statusFilter === "deceased") {
      list = list.filter((s) => s.status === "deceased");
    }

    if (sort === t.sortOptions[0]) list.sort((a, b) => a.name.localeCompare(b.name));
    if (sort === t.sortOptions[1]) list.sort((a, b) => b.name.localeCompare(a.name));

    return list;
  }, [scholars, search, selectedRegions, selectedDisciplines, statusFilter, sort, t.sortOptions]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <div dir={isRTL ? "rtl" : "ltr"} style={{ minHeight: "100vh", backgroundColor: "#faf9f6", fontFamily: "'Inter', sans-serif" }}>

      {/* Hero */}
      <section style={{
        backgroundColor: "#faf9f6", padding: "48px 40px 56px", textAlign: "center",
        position: "relative", overflow: "hidden", borderBottom: "1px solid #E8E6E0",
      }}>
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: "radial-gradient(circle at 50% 0%, rgba(201,168,76,0.06) 0%, transparent 60%)",
          pointerEvents: "none",
        }} />

        <h1 style={{
          fontFamily: lang === "AR" ? "'Amiri', serif" : "'Playfair Display', 'Georgia', serif",
          fontSize: "clamp(32px, 5vw, 56px)", fontWeight: 700, color: "#0b4335",
          margin: "0 0 18px 0", lineHeight: 1.15, maxWidth: "600px", marginLeft: "auto", marginRight: "auto",
        }}>
          {t.heroTitle}
        </h1>

        <p style={{
          fontFamily: lang === "AR" ? "'Amiri', serif" : "'Inter', sans-serif",
          fontSize: "15px", color: "#666", maxWidth: "480px", margin: "0 auto 40px", lineHeight: 1.7,
        }}>
          {t.heroSub}
        </p>

        <div style={{
          maxWidth: "560px", margin: "0 auto", display: "flex", alignItems: "center",
          backgroundColor: "#fff", borderRadius: "4px", overflow: "hidden",
          boxShadow: "0 4px 24px rgba(0,0,0,0.10)", flexDirection: isRTL ? "row-reverse" : "row",
        }}>
          <div style={{ padding: "0 16px", color: "#c0c9c3", display: "flex", alignItems: "center" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.3-4.3" />
            </svg>
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
            placeholder={t.searchPlaceholder}
            style={{
              flex: 1, border: "none", outline: "none",
              fontFamily: lang === "AR" ? "'Amiri', serif" : "'Inter', sans-serif",
              fontSize: "13px", color: "#191c1b", padding: "14px 0",
              backgroundColor: "transparent", textAlign: isRTL ? "right" : "left",
            }}
          />
          <button style={{
            backgroundColor: "#0b4335", color: "#fff", border: "none", padding: "14px 28px",
            fontFamily: "'Inter', sans-serif", fontSize: "12px", fontWeight: 700,
            letterSpacing: "0.1em", cursor: "pointer",
          }}
            onMouseEnter={(e) => ((e.currentTarget).style.backgroundColor = "#C9A84C")}
            onMouseLeave={(e) => ((e.currentTarget).style.backgroundColor = "#0b4335")}
          >
            {t.searchBtn}
          </button>
        </div>
      </section>

      {/* Body */}
      <div style={{
        maxWidth: "1280px", margin: "0 auto", padding: "40px 24px",
        display: "flex", gap: "40px", alignItems: "flex-start",
        flexDirection: isRTL ? "row-reverse" : "row",
      }}>

        {/* Sidebar */}
        <aside style={{ width: "200px", flexShrink: 0, position: "sticky", top: "100px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px", flexDirection: isRTL ? "row-reverse" : "row" }}>
            <span style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.12em", color: "#191c1b" }}>{t.filters}</span>
            <button onClick={clearAll} style={{ fontSize: "12px", color: "#C9A84C", background: "none", border: "none", cursor: "pointer", fontFamily: "'Inter', sans-serif" }}>
              {t.clearAll}
            </button>
          </div>

          <div style={{ marginBottom: "24px" }}>
            <p style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.1em", color: "#c0c9c3", marginBottom: "10px" }}>{t.regionLabel}</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              {t.regions.map((r) => (
                <FilterCheckbox key={r} label={r} isRTL={isRTL}
                  checked={selectedRegions.includes(r)}
                  onChange={() => { toggle(selectedRegions, setSelectedRegions, r); setCurrentPage(1); }} />
              ))}
            </div>
          </div>

          <div style={{ marginBottom: "24px" }}>
            <p style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.1em", color: "#c0c9c3", marginBottom: "10px" }}>{t.disciplineLabel}</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              {t.disciplines.map((d) => (
                <FilterCheckbox key={d} label={d} isRTL={isRTL}
                  checked={selectedDisciplines.includes(d)}
                  onChange={() => { toggle(selectedDisciplines, setSelectedDisciplines, d); setCurrentPage(1); }} />
              ))}
            </div>
          </div>

          <div>
            <p style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.1em", color: "#c0c9c3", marginBottom: "10px" }}>{t.statusLabel}</p>
            <div style={{ display: "flex", gap: "8px", flexDirection: isRTL ? "row-reverse" : "row" }}>
              {(["all", "deceased"] as const).map((s) => (
                <button key={s} onClick={() => { setStatusFilter(s); setCurrentPage(1); }} style={{
                  padding: "6px 14px", borderRadius: "2px", border: "1.5px solid",
                  borderColor: statusFilter === s ? "#0b4335" : "#c0c9c3",
                  backgroundColor: statusFilter === s ? "#0b4335" : "transparent",
                  color: statusFilter === s ? "#fff" : "#6b7775",
                  fontSize: "11px", fontWeight: 600, letterSpacing: "0.06em",
                  fontFamily: "'Inter', sans-serif", cursor: "pointer",
                  transition: "all 0.15s ease", textTransform: "uppercase",
                }}>
                  {s === "all" ? t.statusAll : t.statusDeceased}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "28px", flexDirection: isRTL ? "row-reverse" : "row" }}>
            <p style={{ fontSize: "13px", color: "#6b7775", fontFamily: "'Inter', sans-serif" }}>
              {t.showing} <strong style={{ color: "#191c1b" }}>{pageItems.length}</strong> {t.of}{" "}
              <strong style={{ color: "#191c1b" }}>{filtered.length}</strong> {t.scholars}
            </p>

            <div style={{ position: "relative" }}>
              <button onClick={() => setSortOpen((v) => !v)} style={{
                display: "flex", alignItems: "center", gap: "8px", padding: "8px 16px",
                border: "1.5px solid #c0c9c3", borderRadius: "2px", backgroundColor: "#fff",
                fontFamily: "'Inter', sans-serif", fontSize: "12px", color: "#404945", cursor: "pointer",
                boxShadow: "0 1px 4px rgba(0,0,0,0.06)", flexDirection: isRTL ? "row-reverse" : "row",
              }}>
                <span style={{ fontSize: "10px", color: "#c0c9c3", letterSpacing: "0.08em", fontWeight: 600 }}>{t.sortBy}</span>
                {sort}
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                  style={{ transform: sortOpen ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s" }}>
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>
              {sortOpen && (
                <div style={{
                  position: "absolute", top: "calc(100% + 4px)", right: isRTL ? "auto" : 0, left: isRTL ? 0 : "auto",
                  zIndex: 50, backgroundColor: "#fff", border: "1.5px solid #e8ede9", borderRadius: "2px",
                  boxShadow: "0 8px 24px rgba(0,0,0,0.12)", overflow: "hidden", minWidth: "180px",
                }}>
                  {t.sortOptions.map((o) => (
                    <button key={o} onClick={() => { setSort(o); setSortOpen(false); }} style={{
                      width: "100%", padding: "10px 16px", textAlign: isRTL ? "right" : "left", border: "none",
                      backgroundColor: sort === o ? "#e8f2ee" : "transparent",
                      color: sort === o ? "#0b4335" : "#404945",
                      fontFamily: lang === "AR" ? "'Amiri', serif" : "'Inter', sans-serif",
                      fontSize: "12px", fontWeight: sort === o ? 600 : 400, cursor: "pointer",
                    }}
                      onMouseEnter={(e) => { if (sort !== o) (e.currentTarget as HTMLElement).style.backgroundColor = "#f7f7f7"; }}
                      onMouseLeave={(e) => { if (sort !== o) (e.currentTarget as HTMLElement).style.backgroundColor = "transparent"; }}
                    >
                      {o}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {loading && (
            <p style={{ textAlign: "center", padding: "60px 0", color: "#6b7775", fontFamily: "'Inter', sans-serif" }}>
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
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "20px" }}>
                {pageItems.map((s) => (
                  <ScholarCard key={s.id} scholar={s} lang={lang} biographyLabel={t.biography} />
                ))}
              </div>

                           {pageItems.length === 0 && (
                <div style={{ 
                  textAlign: "center", 
                  padding: "60px 20px", 
                  color: "#6b7775", 
                  fontFamily: lang === "AR" ? "'Amiri', serif" : "'Inter', sans-serif",
                  backgroundColor: "#fff",
                  borderRadius: "4px",
                  border: "1px dashed #c0c9c3"
                }}>
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#c0c9c3" strokeWidth="1.5" style={{ margin: "0 auto 16px", display: "block" }}>
                    <circle cx="11" cy="11" r="8" />
                    <path d="M21 21l-4.3-4.3" />
                    {isSearchingOrFiltering && <path d="M8 11h6" />}
                  </svg>
                  
                  <p style={{ fontSize: "18px", fontWeight: 600, color: "#404945", margin: "0 0 8px 0" }}>
                    {isSearchingOrFiltering ? t.noResults : t.noScholars}
                  </p>
                  
                  {isSearchingOrFiltering && (
                    <p style={{ fontSize: "14px", color: "#888", margin: 0 }}>
                      {t.tryChanging}
                    </p>
                  )}
                </div>
              )}

              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", marginTop: "48px", paddingBottom: "24px", flexDirection: isRTL ? "row-reverse" : "row" }}>
                <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} style={{
                  width: "36px", height: "36px", borderRadius: "2px", border: "1.5px solid #c0c9c3",
                  backgroundColor: "#fff", cursor: "pointer", display: "flex", alignItems: "center",
                  justifyContent: "center", color: "#404945",
                }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d={isRTL ? "M9 18l6-6-6-6" : "M15 18l-6-6 6-6"} />
                  </svg>
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .slice(0, 5)
                  .map((p) => (
                    <button key={p} onClick={() => setCurrentPage(p)} style={{
                      width: "36px", height: "36px", borderRadius: "2px", border: "1.5px solid",
                      borderColor: currentPage === p ? "#0b4335" : "#c0c9c3",
                      backgroundColor: currentPage === p ? "#0b4335" : "#fff",
                      color: currentPage === p ? "#fff" : "#404945",
                      fontFamily: "'Inter', sans-serif", fontSize: "13px",
                      fontWeight: currentPage === p ? 700 : 400, cursor: "pointer", transition: "all 0.15s ease",
                    }}>{p}</button>
                  ))}

                <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} style={{
                  width: "36px", height: "36px", borderRadius: "2px", border: "1.5px solid #c0c9c3",
                  backgroundColor: "#fff", cursor: "pointer", display: "flex", alignItems: "center",
                  justifyContent: "center", color: "#404945",
                }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d={isRTL ? "M15 18l-6-6 6-6" : "M9 18l6-6-6-6"} />
                  </svg>
                </button>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default ScholarsPage;