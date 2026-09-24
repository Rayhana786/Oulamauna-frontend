import React, { useEffect, useMemo, useState } from "react";
import { useLang } from "../../context/LanguageContext";
import { Link, useSearchParams } from "react-router-dom";
import { scholarsApi, ApiScholar, ApiScholarVersion } from "../../api/scholarsApi";
import scholarFallbackImg from "../../assets/scholar.png";

// ── Types ──────────────────────────────────────────────────────────────────
type Language = string; // Now accepts ANY language code dynamically

interface ScholarCardData {
  id: number;
  name: string;
  isFallback: boolean;
  displayedLanguage: string;
  requestedLanguage: string;
  nameAr?: string;
  years: string;
  region: string;
  regionId: string;
  excerpt: string;
  disciplines: string[];
  disciplineIds: string[];
  status: "deceased" | "living";
  image: string | null;
}

// We no longer need LANG_CODE_BY_UI. We will just use lang.toLowerCase() directly.

// ── Mapping: Prisma API shape → what the UI needs ──────────────────────────
function computeYears(v: ApiScholarVersion): string {
  const dates = v.scholar_dates ?? [];
  const birth = dates.find((d) => d.date_type === "birth" && d.calendar === "gregorian")?.year;
  const death = dates.find((d) => d.date_type === "death" && d.calendar === "gregorian")?.year;
  if (birth && death) return `${birth} – ${death} CE`;
  if (birth) return `b. ${birth} CE`;
  return "";
}

// ✅ Reads discipline ONLY if translated in the current language
function getDisciplineNames(version: ApiScholarVersion, currentLang: string): string[] {
  return (version.scholar_disciplines ?? [])
    .map((sd) => sd.disciplines?.translations?.[currentLang] || "")
    .map((name) => name.toUpperCase())
    .filter((x): x is string => Boolean(x)); // Removes untranslated disciplines
}

function mapApiScholar(apiScholar: ApiScholar, lang: Language): ScholarCardData | null {
  const version = apiScholar.scholar_versions[0];
  if (!version) return null;

  const currentLang = lang.toLowerCase(); // Get current language code (e.g., "es", "ar", "fr")
  const hasDeath = (version.scholar_dates ?? []).some((d) => d.date_type === "death");
  const rawBiography = version.biography ?? "";
  
  const withoutTags = rawBiography.replace(/<[^>]*>/g, ' ');
  const decoded = withoutTags
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
  
  const firstParagraph = decoded.split(/\n\s*\n/)[0] || decoded;
  const cleanText = firstParagraph.replace(/\s+/g, ' ').trim();
  const shortExcerpt = cleanText.length > 150 ? cleanText.substring(0, 150) + "..." : cleanText;

  // ✅ Reads region ONLY if translated in the current language
  const regionName = version.regions?.translations?.[currentLang] || "";
  const regionId = version.regions?.region_id != null ? String(version.regions.region_id) : "";
  const disciplineIds = (version.scholar_disciplines ?? [])
    .map((sd) => sd.disciplines?.discipline_id)
    .filter((id): id is number => id != null)
    .map(String);

  return {
    id: apiScholar.scholar_id,
    name: version.canonical_name,
    isFallback: false,
    displayedLanguage: version.languages?.code ?? "",
    requestedLanguage: currentLang,
    nameAr: version.scholar_aliases?.[0]?.alias_name,
    years: computeYears(version),
    region: regionName, // Will be empty string if not translated
    regionId,
    excerpt: shortExcerpt,
    disciplines: getDisciplineNames(version, currentLang), // Passes currentLang
    disciplineIds,
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
  const isRTL = lang.toLowerCase() === "ar";
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
      onClick={onChange}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", padding: "4px 0" }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "9px" }}>
        <div style={{
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

// ── Breadcrumb Home Link ───────────────────────────────────────────────────
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

// ── Hero Search Button ─────────────────────────────────────────────────────
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

// ── Add Scholar Button ─────────────────────────────────────────────────────
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

// ── Sort Trigger Button ────────────────────────────────────────────────────
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

// ── Pagination buttons ─────────────────────────────────────────────────────
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
  const { lang, t } = useLang();
  const isRTL = lang.toLowerCase() === "ar"; // 👈 Dynamic RTL check

  const [searchParams, setSearchParams] = useSearchParams();
  
  // 👇 Helper to safely get the lowercase language code for API calls
  const apiLang = lang.toLowerCase();

  

  const [scholars, setScholars] = useState<ScholarCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState(searchParams.get("q") || "");
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [selectedDisciplines, setSelectedDisciplines] = useState<string[]>([]);
 
  // ✅ Splits the string from JSON into an Array
const rawSortOptions = t("scholarPage.sortOptions");
const sortOptions: string[] = rawSortOptions.includes('|') 
  ? rawSortOptions.split('|').map(item => item.trim()) 
  : ["Name (A-Z)", "Name (Z-A)", "Century (Oldest)", "Century (Newest)"];
    
  const [sort, setSort] = useState(sortOptions[0]);
  const [sortOpen, setSortOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const [availableRegions, setAvailableRegions] = useState<{ label: string; value: string }[]>([]);
  const [availableDisciplines, setAvailableDisciplines] = useState<{ label: string; value: string }[]>([]);

  const minYear = searchParams.get("minYear") || undefined;
  const maxYear = searchParams.get("maxYear") || undefined;
  const urlDiscipline = searchParams.get("discipline") || undefined;

  const isSearchingOrFiltering =
    search.trim() !== "" ||
    selectedRegions.length > 0 ||
    selectedDisciplines.length > 0 ||
    !!urlDiscipline;

  useEffect(() => {
    if (!urlDiscipline) {
      setSelectedDisciplines([]);
      return;
    }
    if (availableDisciplines.length === 0) return; // wait until the discipline list has loaded
    const match = availableDisciplines.find(
      (d) => d.label.trim().toLowerCase() === urlDiscipline.trim().toLowerCase()
    );
    setSelectedDisciplines(match ? [match.value] : []);
  }, [urlDiscipline, availableDisciplines]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const hasSearchQuery = search.trim() !== "";

        const fetchScholars = async () => {
      try {
        let res;
        if (hasSearchQuery) {
          res = await scholarsApi.searchScholars({
            q: search.trim(),
            lang: apiLang,
          });
          
          const mapped = res.data.scholars.map((s: any) => ({
            id: s.scholar_id,
            name: s.canonical_name,
            isFallback: false,
            displayedLanguage: s.lang,
            requestedLanguage: lang.toLowerCase(),
            nameAr: s.aliases?.[0] || "",
            years: s.birth_year && s.death_year ? `${s.birth_year} – ${s.death_year} CE` : (s.birth_year ? `b. ${s.birth_year} CE` : ""),
            region: s.region ?? "",
            regionId: s.region_id != null ? String(s.region_id) : "",
            excerpt: s.biography ?? "",
            disciplines: s.disciplines ?? [],
            disciplineIds: (s.discipline_ids ?? []).map(String),
            status: s.death_year ? "deceased" : "living",
            image: s.image_url ?? null,
          }));
          setScholars(mapped);
        } else {
          res = await scholarsApi.list(apiLang, { minYear, maxYear });
          const mapped = res.data
            .map((s: any) => mapApiScholar(s, lang as Language))
            .filter((s: ScholarCardData | null): s is ScholarCardData => s !== null);
          setScholars(mapped);
        }
        
        if (!cancelled) setCurrentPage(1);
      } catch (err: any) {
        if (!cancelled) setError(err.message || "Failed to load scholars");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchScholars();
    return () => { cancelled = true; };
  }, [lang, search, minYear, maxYear, urlDiscipline]);

    useEffect(() => {
    // ✅ FIX: Use LOWERCASE to match your database translations (e.g., "ar", "en", "fr")
    const currentLang = lang.toLowerCase(); 

    scholarsApi.getRegions().then((res: any) => {
      const list = Array.isArray(res) ? res : res?.data ?? [];
      setAvailableRegions(
        list
          .map((r: any) => ({
            label: r.translations?.[currentLang] || r.translations?.[lang.toUpperCase()] || r.name,
            value: String(r.region_id),
          }))
          .filter((r: any) => r.label)
      );
    }).catch((err) => console.error("Failed to load regions:", err));

    scholarsApi.getDisciplines().then((res: any) => {
      const list = Array.isArray(res) ? res : res?.data ?? [];
      setAvailableDisciplines(
        list
          .map((d: any) => ({
            label: d.translations?.[currentLang] || d.translations?.[lang.toUpperCase()] || d.name,
            value: String(d.discipline_id),
          }))
          .filter((d: any) => d.label)
      );
    }).catch((err) => console.error("Failed to load disciplines:", err));
  }, [lang]);

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

  // ✅ FIXED: Removed redundant frontend filtering. 
  // The backend API already filters by region and discipline when hasActiveFilters is true.
  // Keeping frontend filtering causes bugs because it tries to match translated UI names 
  // against backend data that might be in the original language.
  const filtered = useMemo(() => {
    let list = [...scholars];

    if (selectedRegions.length > 0) {
      list = list.filter((s) => selectedRegions.includes(s.regionId));
    }

    if (selectedDisciplines.length > 0) {
      list = list.filter((s) => s.disciplineIds.some((id) => selectedDisciplines.includes(id)));
    }

    // Sorting logic remains exactly the same
    if (sort === sortOptions[0]) {
      list.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sort === sortOptions[1]) {
      list.sort((a, b) => b.name.localeCompare(a.name));
    } else if (sort === sortOptions[2]) {
      list.sort((a, b) => {
        const getBirthYear = (yearsStr: string) => {
          if (!yearsStr) return Infinity;
          const match = yearsStr.match(/b\.?\s*(\d+)/) || yearsStr.match(/(\d+)\s*–/);
          return match ? parseInt(match[1]) : Infinity;
        };
        return getBirthYear(a.years) - getBirthYear(b.years);
      });
    } else if (sort === sortOptions[3]) {
      list.sort((a, b) => {
        const getBirthYear = (yearsStr: string) => {
          if (!yearsStr) return -Infinity;
          const match = yearsStr.match(/b\.?\s*(\d+)/) || yearsStr.match(/(\d+)\s*–/);
          return match ? parseInt(match[1]) : -Infinity;
        };
        return getBirthYear(b.years) - getBirthYear(a.years);
      });
    }

    return list;
  }, [scholars, sort, sortOptions, selectedRegions, selectedDisciplines]);

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
          <BreadcrumbHomeLink label={t("scholarPage.breadcrumbHome")} />
          <span style={{ color: "#1e4d3a66" }}>›</span>
          <span>{t("scholarPage.breadcrumbCurrent")}</span>
        </p>

        <h1 style={{
          fontFamily: "'Hanken Grotesk', sans-serif",
          fontSize: "clamp(32px, 5vw, 52px)", fontWeight: 700, color: "#1e4d3a",
          margin: "0 0 18px 0", lineHeight: 1.15, maxWidth: "600px", marginLeft: "auto", marginRight: "auto",
        }}>
          {t("scholarPage.heroTitle")}
        </h1>

        <p style={{
          fontFamily: lang === "AR" ? "'Amiri', serif" : "'Inter', sans-serif",
          fontSize: "15px", color: "#1e4d3a99", maxWidth: "480px", margin: "0 auto 40px", lineHeight: 1.7,
        }}>
          {t("scholarPage.heroSub")}
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
            placeholder={t("scholarPage.searchPlaceholder")}
            style={{
              flex: 1, border: "none", outline: "none",
              fontFamily: lang === "AR" ? "'Amiri', serif" : "'Inter', sans-serif",
              fontSize: "13px", color: "#1e4d3a", padding: "14px 0",
              backgroundColor: "transparent", textAlign: isRTL ? "right" : "left",
            }}
          />
          <HeroSearchButton label={t("scholarPage.searchBtn")} />
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
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "11px", fontWeight: 700, letterSpacing: "0.12em", color: "#1e4d3a" }}>{t("scholarPage.filters")}</span>
            <button
              onClick={clearAll}
              style={{ fontSize: "12px", color: "#C9A84C", background: "none", border: "none", cursor: "pointer", fontFamily: "'Inter', sans-serif", fontWeight: 600, transition: "color 0.2s ease" }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "#1e4d3a")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "#C9A84C")}
            >
              {t("scholarPage.clearAll")}
            </button>
          </div>

          <div className="scholars-filter-groups" style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ marginBottom: "24px" }}>
              <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10px", fontWeight: 700, letterSpacing: "0.1em", color: "#1e4d3a66", marginBottom: "10px" }}>{t("scholarPage.regionLabel")}</p>
              <div className="scholars-filter-list" style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                {availableRegions.length > 0 ? (
                  availableRegions.map((r) => (
                    <FilterCheckbox 
                      key={r.value} 
                      label={r.label} 
                      isRTL={isRTL}
                      checked={selectedRegions.includes(r.value)}
                      onChange={() => { toggle(selectedRegions, setSelectedRegions, r.value); setCurrentPage(1); }} 
                    />
                  ))
                ) : (
                  <span style={{ fontSize: "11px", color: "#1e4d3a66" }}>{t("scholarPage.loading")}</span>
                )}
              </div>
            </div>

            <div style={{ marginBottom: "24px" }}>
              <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10px", fontWeight: 700, letterSpacing: "0.1em", color: "#1e4d3a66", marginBottom: "10px" }}>{t("scholarPage.disciplineLabel")}</p>
              <div className="scholars-filter-list" style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                {availableDisciplines.length > 0 ? (
                  availableDisciplines.map((d) => (
                    <FilterCheckbox 
                      key={d.value} 
                      label={d.label} 
                      isRTL={isRTL}
                      checked={selectedDisciplines.includes(d.value)}
                      onChange={() => { toggle(selectedDisciplines, setSelectedDisciplines, d.value); setCurrentPage(1); }} 
                    />
                  ))
                ) : (
                  <span style={{ fontSize: "11px", color: "#1e4d3a66" }}>{t("scholarPage.loading")}</span>
                )}
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main style={{ flex: 1, minWidth: 0 }}>
          <div className="scholars-toolbar" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "28px" }}>
            <p style={{ fontSize: "13px", color: "#1e4d3a99", fontFamily: "'Inter', sans-serif" }}>
              {t("scholarPage.showing")} <strong style={{ color: "#1e4d3a" }}>{pageItems.length}</strong> {t("scholarPage.of")}{" "}
              <strong style={{ color: "#1e4d3a" }}>{filtered.length}</strong> {t("scholarPage.scholars")}
            </p>

            <div className="scholars-actions" style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <AddScholarButton label={t("scholarPage.addScholar")} />

              <div style={{ position: "relative" }}>
                <SortTriggerButton sortByLabel={t("scholarPage.sortBy")} sortValue={sort} open={sortOpen} onClick={() => setSortOpen((v) => !v)} />
                {sortOpen && (
                  <div style={{
                    position: "absolute", top: "calc(100% + 4px)", right: isRTL ? "auto" : 0, left: isRTL ? 0 : "auto",
                    zIndex: 50, backgroundColor: "#fff", border: "1px solid rgba(30,77,58,0.12)", borderRadius: "10px",
                    boxShadow: "0 8px 24px rgba(30,77,58,0.14)", overflow: "hidden", minWidth: "180px",
                  }}>
                    {sortOptions.map((o) => (
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
              {t("scholarPage.loading")}
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
                  <ScholarCard key={s.id} scholar={s} lang={lang as Language} biographyLabel={t("scholarPage.biography")} />
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
                    {isSearchingOrFiltering ? t("scholarPage.noResults") : t("scholarPage.noScholars")}
                  </p>

                  {isSearchingOrFiltering && (
                    <p style={{ fontSize: "14px", color: "#1e4d3a80", margin: 0 }}>
                      {t("scholarPage.tryChanging")}
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