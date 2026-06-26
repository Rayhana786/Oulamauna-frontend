import React, { useState } from "react";
import { useLang } from "../../context/LanguageContext";
import { Link } from "react-router-dom";

// ── Types ──────────────────────────────────────────────────────────────────
type Language = "EN" | "AR" | "FR";

interface Scholar {
  id: number;
  name: { EN: string; AR: string; FR: string };
  nameAr: string;
  years: string;
  region: { EN: string; AR: string; FR: string };
  excerpt: { EN: string; AR: string; FR: string };
  disciplines: string[];
  status: "deceased" | "living";
  image: string;
}

type SortOption = "Name (A-Z)" | "Name (Z-A)" | "Century (Oldest)" | "Century (Newest)";

// ── Translations ───────────────────────────────────────────────────────────
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
  },
};

// ── Mock Data ──────────────────────────────────────────────────────────────
const MOCK_SCHOLARS: Scholar[] = [
  {
    id: 1,
    name: { EN: "Ibn Rushd (Averroes)", AR: "ابن رشد (أفيروس)", FR: "Ibn Rushd (Averroès)" },
    nameAr: "ابن رشد",
    years: "1126 – 1198 CE",
    region: { EN: "ANDALUSIA", AR: "الأندلس", FR: "ANDALOUSIE" },
    excerpt: {
      EN: "A bridge between the Islamic world and European scholasticism.",
      AR: "جسر بين العالم الإسلامي والمدرسية الأوروبية.",
      FR: "Un pont entre le monde islamique et la scolastique européenne.",
    },
    disciplines: ["PHILOSOPHY", "FIQH", "MEDICINE"],
    status: "deceased",
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop&auto=format",
  },
  {
    id: 2,
    name: { EN: "Imam Al-Bukhari", AR: "الإمام البُخاري", FR: "Imam Al-Bukhari" },
    nameAr: "الإمام البُخاري",
    years: "810 – 870 CE",
    region: { EN: "KHORASAN", AR: "خراسان", FR: "KHORASAN" },
    excerpt: {
      EN: "The most rigorous compiler of prophetic traditions in Islamic history.",
      AR: "أكثر جامعي الأحاديث النبوية دقةً في التاريخ الإسلامي.",
      FR: "Le compilateur le plus rigoureux des traditions prophétiques.",
    },
    disciplines: ["HADITH"],
    status: "deceased",
    image: "https://images.unsplash.com/photo-1585585490949-15a3d7e93a43?w=400&h=300&fit=crop&auto=format",
  },
  {
    id: 3,
    name: { EN: "Fatima al-Fihri", AR: "فاطمة الفِهرية", FR: "Fatima al-Fihri" },
    nameAr: "فاطمة الفِهرية",
    years: "800 – 880 CE",
    region: { EN: "MAGHREB", AR: "المغرب", FR: "MAGHREB" },
    excerpt: {
      EN: "Founder of the world's oldest continuously operating university.",
      AR: "مؤسِّسة أقدم جامعة لا تزال تعمل حتى اليوم في العالم.",
      FR: "Fondatrice de la plus ancienne université encore en activité.",
    },
    disciplines: ["INSTITUTION"],
    status: "deceased",
    image: "https://images.unsplash.com/photo-1564604001-6d4a0f2aaeec?w=400&h=300&fit=crop&auto=format",
  },
  {
    id: 4,
    name: { EN: "Al-Ghazali", AR: "أبو حامد الغزالي", FR: "Al-Ghazali" },
    nameAr: "أبو حامد الغزالي",
    years: "1058 – 1111 CE",
    region: { EN: "KHORASAN", AR: "خراسان", FR: "KHORASAN" },
    excerpt: {
      EN: "The proof of Islam and revitalizer of the spiritual sciences.",
      AR: "حجة الإسلام ومجدد العلوم الروحانية.",
      FR: "La preuve de l'Islam et rénovateur des sciences spirituelles.",
    },
    disciplines: ["THEOLOGY", "FIQH"],
    status: "deceased",
    image: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=400&h=300&fit=crop&auto=format",
  },
  {
    id: 5,
    name: { EN: "Ibn Khaldun", AR: "ابن خلدون", FR: "Ibn Khaldoun" },
    nameAr: "ابن خلدون",
    years: "1332 – 1406 CE",
    region: { EN: "MAGHREB", AR: "المغرب", FR: "MAGHREB" },
    excerpt: {
      EN: "Father of modern sociology and pioneer of historiography.",
      AR: "أبو علم الاجتماع الحديث ورائد علم التاريخ.",
      FR: "Père de la sociologie moderne et pionnier de l'historiographie.",
    },
    disciplines: ["SOCIOLOGY", "HISTORY"],
    status: "deceased",
    image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop&auto=format",
  },
  {
    id: 6,
    name: { EN: "Ibn Sina (Avicenna)", AR: "ابن سينا", FR: "Ibn Sina (Avicenne)" },
    nameAr: "ابن سينا",
    years: "980 – 1037 CE",
    region: { EN: "CENTRAL ASIA", AR: "آسيا الوسطى", FR: "ASIE CENTRALE" },
    excerpt: {
      EN: "Author of the Canon of Medicine, the most influential medical text for centuries.",
      AR: "مؤلف القانون في الطب، أكثر النصوص الطبية تأثيراً لقرون.",
      FR: "Auteur du Canon de la médecine, ouvrage médical le plus influent.",
    },
    disciplines: ["MEDICINE", "PHILOSOPHY"],
    status: "deceased",
    image: "https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?w=400&h=300&fit=crop&auto=format",
  },
  {
    id: 7,
    name: { EN: "Al-Khwarizmi", AR: "الخوارزمي", FR: "Al-Khwarizmi" },
    nameAr: "الخوارزمي",
    years: "780 – 850 CE",
    region: { EN: "KHOREZM", AR: "خوارزم", FR: "KHOREZM" },
    excerpt: {
      EN: "The father of Algebra and pioneer of Algorithms and decimal notation.",
      AR: "أبو الجبر ورائد الخوارزميات والترقيم العشري.",
      FR: "Le père de l'algèbre et pionnier des algorithmes.",
    },
    disciplines: ["MATHEMATICS", "ASTRONOMY"],
    status: "deceased",
    image: "https://images.unsplash.com/photo-1509228468518-180dd4864904?w=400&h=300&fit=crop&auto=format",
  },
  {
    id: 8,
    name: { EN: "Rabi'a al-Adawiyya", AR: "رابعة العدوية", FR: "Rabi'a al-Adawiyya" },
    nameAr: "رابعة العدوية",
    years: "714 – 801 CE",
    region: { EN: "BASRA", AR: "البصرة", FR: "BASSORA" },
    excerpt: {
      EN: "Influential mystic and ascetic who shaped the language of Islamic spirituality.",
      AR: "صوفية زاهدة أثّرت في لغة الروحانيات الإسلامية.",
      FR: "Mystique influente qui a façonné le langage de la spiritualité islamique.",
    },
    disciplines: ["SPIRITUALITY"],
    status: "deceased",
    image: "https://images.unsplash.com/photo-1542361345-89e58247f2d5?w=400&h=300&fit=crop&auto=format",
  },
];

const REGION_COUNTS = [143, 89, 215, 104];

// ── Discipline Tags with +N badge ──────────────────────────────────────────
const DisciplineTags: React.FC<{ disciplines: string[] }> = ({ disciplines }) => {
  const MAX_SHOW = 2;
  const visible = disciplines.slice(0, MAX_SHOW);
  const extra = disciplines.length - MAX_SHOW;

  const tagStyle: React.CSSProperties = {
    backgroundColor: "#0b4335",
    color: "#fff",
    fontSize: "9px",
    fontWeight: 700,
    letterSpacing: "0.1em",
    padding: "3px 8px",
    borderRadius: "2px",
    fontFamily: "'Inter', sans-serif",
    border: "1px solid rgba(255,255,255,0.15)",
    backdropFilter: "blur(4px)",
    whiteSpace: "nowrap" as const,
  };

  const plusStyle: React.CSSProperties = {
    backgroundColor: "#C9A84C",
    color: "#fff",
    fontSize: "9px",
    fontWeight: 700,
    letterSpacing: "0.08em",
    padding: "3px 7px",
    borderRadius: "2px",
    fontFamily: "'Inter', sans-serif",
    border: "1px solid rgba(255,255,255,0.2)",
    backdropFilter: "blur(4px)",
    whiteSpace: "nowrap" as const,
  };

  return (
    <div style={{ display: "flex", gap: "5px", flexWrap: "wrap" }}>
      {visible.map((d) => (
        <span key={d} style={tagStyle}>{d}</span>
      ))}
      {extra > 0 && <span style={plusStyle}>+{extra}</span>}
    </div>
  );
};

// ── Scholar Card ───────────────────────────────────────────────────────────
const ScholarCard: React.FC<{ scholar: Scholar; lang: Language; biographyLabel: string }> = ({
  scholar,
  lang,
  biographyLabel,
}) => {
  const [hovered, setHovered] = useState(false);
  const isRTL = lang === "AR";

  return (
    <Link
  to={`/scholars/${scholar.id}`}
  style={{
    textDecoration: "none",
  }}
>
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        backgroundColor: "#fff",
        borderRadius: "2px",
        overflow: "hidden",
        boxShadow: hovered ? "0 12px 40px rgba(0,0,0,0.15)" : "0 2px 12px rgba(0,0,0,0.06)",
        transform: hovered ? "translateY(-4px)" : "translateY(0)",
        transition: "box-shadow 0.25s ease, transform 0.25s ease",
        display: "flex",
        flexDirection: "column",
        cursor: "pointer",
        direction: isRTL ? "rtl" : "ltr",
      }}
    >
      {/* Image */}
      <div style={{ position: "relative", height: "200px", overflow: "hidden" }}>
        <img
          src={scholar.image}
          alt={scholar.name[lang]}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            filter: hovered ? "grayscale(0%) brightness(1)" : "grayscale(100%) brightness(0.85)",
            transform: hovered ? "scale(1.05)" : "scale(1)",
            transition: "transform 0.4s ease, filter 0.45s ease",
          }}
          onError={(e) => {
            (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(scholar.name.EN)}&background=285B4B&color=C9A84C&size=400`;
          }}
        />
        <div
          style={{
            position: "absolute",
            top: "10px",
            left: isRTL ? "auto" : "10px",
            right: isRTL ? "10px" : "auto",
          }}
        >
          <DisciplineTags disciplines={scholar.disciplines} />
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: "20px 20px 0 20px", flex: 1 }}>
        <h3
          style={{
            fontFamily: lang === "AR" ? "'Amiri', serif" : "'Playfair Display', 'Georgia', serif",
            fontSize: "17px",
            fontWeight: 600,
            color: hovered ? "#C9A84C" : "#191c1b",
            margin: "0 0 4px 0",
            lineHeight: 1.3,
            transition: "color 0.2s ease",
          }}
        >
          {scholar.name[lang]}
        </h3>
        <p
          style={{
            fontFamily: "'Amiri', serif",
            fontSize: "13px",
            color: "#C9A84C",
            margin: "0 0 14px 0",
            direction: "rtl",
            textAlign: isRTL ? "left" : "right",
          }}
        >
          {scholar.nameAr}
        </p>
        <p
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: "11px",
            color: "#6b7775",
            letterSpacing: "0.06em",
            fontWeight: 500,
            margin: "0 0 6px 0",
          }}
        >
          {scholar.years} • <span style={{ color: "#404945" }}>{scholar.region[lang]}</span>
        </p>
        <p
          style={{
            fontFamily: lang === "AR" ? "'Amiri', serif" : "'Inter', sans-serif",
            fontSize: "13px",
            color: "#404945",
            lineHeight: 1.6,
            margin: 0,
          }}
        >
          {scholar.excerpt[lang].length > 80
            ? scholar.excerpt[lang].slice(0, 80) + "…"
            : scholar.excerpt[lang]}
        </p>
      </div>

      {/* Biography footer */}
      <div
        style={{
          padding: "16px 20px",
          marginTop: "16px",
          borderTop: hovered ? "1px solid #0b4335" : "1px solid #e8ede9",
          backgroundColor: hovered ? "#0b4335" : "transparent",
          transition: "background-color 0.2s ease, border-color 0.2s ease",
        }}
      >
        <span
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: "11px",
            fontWeight: 700,
            letterSpacing: "0.12em",
            color: hovered ? "#fff" : "#0b4335",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            flexDirection: isRTL ? "row-reverse" : "row",
            transition: "color 0.2s ease",
          }}
        >
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
  label: string;
  count?: number;
  checked: boolean;
  onChange: () => void;
  isRTL?: boolean;
}> = ({ label, count, checked, onChange, isRTL }) => (
  <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", padding: "4px 0" }}>
    <div style={{ display: "flex", alignItems: "center", gap: "9px", flexDirection: isRTL ? "row-reverse" : "row" }}>
      <div
        onClick={onChange}
        style={{
          width: "15px", height: "15px",
          border: checked ? "none" : "1.5px solid #ccc",
          borderRadius: "2px",
          backgroundColor: checked ? "#0b4335" : "transparent",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0, cursor: "pointer",
          transition: "background-color 0.15s ease",
        }}
      >
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
    {count !== undefined && (
      <span style={{ fontFamily: "'Inter', sans-serif", fontSize: "11px", color: "#c0c9c3" }}>{count}</span>
    )}
  </label>
);

// ── Main Page ──────────────────────────────────────────────────────────────
const ScholarsPage: React.FC = () => {
  const { lang } = useLang();
  const t = T[lang];
  const isRTL = lang === "AR";

  const [search, setSearch] = useState("");
  const [selectedRegions, setSelectedRegions] = useState<string[]>([t.regions[0]]);
  const [selectedCenturies, setSelectedCenturies] = useState<string[]>([t.centuries[1]]);
  const [selectedDisciplines, setSelectedDisciplines] = useState<string[]>([t.disciplines[0]]);
  const [statusFilter, setStatusFilter] = useState<"all" | "deceased">("all");
  const [sort, setSort] = useState(t.sortOptions[0]);
  const [sortOpen, setSortOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const toggle = (arr: string[], setArr: (v: string[]) => void, val: string) => {
    setArr(arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val]);
  };

  const clearAll = () => {
    setSelectedRegions([]);
    setSelectedCenturies([]);
    setSelectedDisciplines([]);
    setStatusFilter("all");
    setSearch("");
  };

  return (
    <div dir={isRTL ? "rtl" : "ltr"} style={{ minHeight: "100vh", backgroundColor: "#faf9f6", fontFamily: "'Inter', sans-serif" }}>

      {/* ── Hero ── cream background, dark green text, gold breadcrumb accent */}
      <section style={{
        backgroundColor: "#faf9f6",
        padding: "48px 40px 56px",
        textAlign: "center",
        position: "relative",
        overflow: "hidden",
        borderBottom: "1px solid #E8E6E0",
      }}>
        {/* subtle decorative radial — very faint, keeps it from being flat */}
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: "radial-gradient(circle at 50% 0%, rgba(201,168,76,0.06) 0%, transparent 60%)",
          pointerEvents: "none",
        }} />

        
        
          

        {/* Title — dark green, large serif */}
        <h1 style={{
          fontFamily: lang === "AR" ? "'Amiri', serif" : "'Playfair Display', 'Georgia', serif",
          fontSize: "clamp(32px, 5vw, 56px)",
          fontWeight: 700,
          color: "#0b4335",
          margin: "0 0 18px 0",
          lineHeight: 1.15,
          maxWidth: "600px",
          marginLeft: "auto",
          marginRight: "auto",
        }}>
          {t.heroTitle}
        </h1>

        {/* Subtitle — muted dark, readable on cream */}
        <p style={{
          fontFamily: lang === "AR" ? "'Amiri', serif" : "'Inter', sans-serif",
          fontSize: "15px",
          color: "#666",
          maxWidth: "480px",
          margin: "0 auto 40px",
          lineHeight: 1.7,
        }}>
          {t.heroSub}
        </p>

        {/* Search bar — white card on cream, same shadow */}
        <div style={{
          maxWidth: "560px", margin: "0 auto",
          display: "flex", alignItems: "center",
          backgroundColor: "#fff", borderRadius: "4px",
          overflow: "hidden", boxShadow: "0 4px 24px rgba(0,0,0,0.10)",
          flexDirection: isRTL ? "row-reverse" : "row",
        }}>
          <div style={{ padding: "0 16px", color: "#c0c9c3", display: "flex", alignItems: "center" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.3-4.3" />
            </svg>
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t.searchPlaceholder}
            style={{
              flex: 1, border: "none", outline: "none",
              fontFamily: lang === "AR" ? "'Amiri', serif" : "'Inter', sans-serif",
              fontSize: "13px", color: "#191c1b",
              padding: "14px 0", backgroundColor: "transparent",
              textAlign: isRTL ? "right" : "left",
            }}
          />
          <button
            style={{
              backgroundColor: "#0b4335", color: "#fff", border: "none",
              padding: "14px 28px",
              fontFamily: "'Inter', sans-serif", fontSize: "12px",
              fontWeight: 700, letterSpacing: "0.1em", cursor: "pointer",
            }}
            onMouseEnter={(e) => ((e.currentTarget).style.backgroundColor = "#C9A84C")}
            onMouseLeave={(e) => ((e.currentTarget).style.backgroundColor = "#0b4335")}
          >
            {t.searchBtn}
          </button>
        </div>
      </section>

      {/* ── Body ── */}
      <div style={{
        maxWidth: "1280px", margin: "0 auto", padding: "40px 24px",
        display: "flex", gap: "40px", alignItems: "flex-start",
        flexDirection: isRTL ? "row-reverse" : "row",
      }}>

        {/* ── Sidebar ── */}
        <aside style={{ width: "200px", flexShrink: 0, position: "sticky", top: "100px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px", flexDirection: isRTL ? "row-reverse" : "row" }}>
            <span style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.12em", color: "#191c1b" }}>{t.filters}</span>
            <button onClick={clearAll} style={{ fontSize: "12px", color: "#C9A84C", background: "none", border: "none", cursor: "pointer", fontFamily: "'Inter', sans-serif" }}>
              {t.clearAll}
            </button>
          </div>

          {/* Region */}
          <div style={{ marginBottom: "24px" }}>
            <p style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.1em", color: "#c0c9c3", marginBottom: "10px" }}>{t.regionLabel}</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              {t.regions.map((r, i) => (
                <FilterCheckbox key={r} label={r} count={REGION_COUNTS[i]} isRTL={isRTL}
                  checked={selectedRegions.includes(r)}
                  onChange={() => toggle(selectedRegions, setSelectedRegions, r)} />
              ))}
            </div>
          </div>

          {/* Century */}
          <div style={{ marginBottom: "24px" }}>
            <p style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.1em", color: "#c0c9c3", marginBottom: "10px" }}>{t.centuryLabel}</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              {t.centuries.map((c) => (
                <FilterCheckbox key={c} label={c} isRTL={isRTL}
                  checked={selectedCenturies.includes(c)}
                  onChange={() => toggle(selectedCenturies, setSelectedCenturies, c)} />
              ))}
            </div>
          </div>

          {/* Discipline */}
          <div style={{ marginBottom: "24px" }}>
            <p style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.1em", color: "#c0c9c3", marginBottom: "10px" }}>{t.disciplineLabel}</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              {t.disciplines.map((d) => (
                <FilterCheckbox key={d} label={d} isRTL={isRTL}
                  checked={selectedDisciplines.includes(d)}
                  onChange={() => toggle(selectedDisciplines, setSelectedDisciplines, d)} />
              ))}
            </div>
          </div>

          {/* Status */}
          <div>
            <p style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.1em", color: "#c0c9c3", marginBottom: "10px" }}>{t.statusLabel}</p>
            <div style={{ display: "flex", gap: "8px", flexDirection: isRTL ? "row-reverse" : "row" }}>
              {(["all", "deceased"] as const).map((s) => (
                <button key={s} onClick={() => setStatusFilter(s)} style={{
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

        {/* ── Main Content ── */}
        <main style={{ flex: 1, minWidth: 0 }}>
          {/* Toolbar */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "28px", flexDirection: isRTL ? "row-reverse" : "row" }}>
            <p style={{ fontSize: "13px", color: "#6b7775", fontFamily: "'Inter', sans-serif" }}>
              {t.showing} <strong style={{ color: "#191c1b" }}>12</strong> {t.of}{" "}
              <strong style={{ color: "#191c1b" }}>1,248</strong> {t.scholars}
            </p>

            {/* Sort */}
            <div style={{ position: "relative" }}>
              <button onClick={() => setSortOpen((v) => !v)} style={{
                display: "flex", alignItems: "center", gap: "8px",
                padding: "8px 16px", border: "1.5px solid #c0c9c3",
                borderRadius: "2px", backgroundColor: "#fff",
                fontFamily: "'Inter', sans-serif", fontSize: "12px",
                color: "#404945", cursor: "pointer",
                boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                flexDirection: isRTL ? "row-reverse" : "row",
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
                  position: "absolute",
                  top: "calc(100% + 4px)",
                  right: isRTL ? "auto" : 0,
                  left: isRTL ? 0 : "auto",
                  zIndex: 50,
                  backgroundColor: "#fff", border: "1.5px solid #e8ede9",
                  borderRadius: "2px", boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                  overflow: "hidden", minWidth: "180px",
                }}>
                  {t.sortOptions.map((o) => (
                    <button key={o} onClick={() => { setSort(o); setSortOpen(false); }} style={{
                      width: "100%", padding: "10px 16px",
                      textAlign: isRTL ? "right" : "left",
                      border: "none",
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

          {/* Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "20px" }}>
            {MOCK_SCHOLARS.map((s) => (
              <ScholarCard key={s.id} scholar={s} lang={lang} biographyLabel={t.biography} />
            ))}
          </div>

          {/* Pagination */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", marginTop: "48px", paddingBottom: "24px", flexDirection: isRTL ? "row-reverse" : "row" }}>
            <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} style={{
              width: "36px", height: "36px", borderRadius: "2px",
              border: "1.5px solid #c0c9c3", backgroundColor: "#fff",
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#404945",
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d={isRTL ? "M9 18l6-6-6-6" : "M15 18l-6-6 6-6"} />
              </svg>
            </button>

            {[1, 2, 3].map((p) => (
              <button key={p} onClick={() => setCurrentPage(p)} style={{
                width: "36px", height: "36px", borderRadius: "2px",
                border: "1.5px solid",
                borderColor: currentPage === p ? "#0b4335" : "#c0c9c3",
                backgroundColor: currentPage === p ? "#0b4335" : "#fff",
                color: currentPage === p ? "#fff" : "#404945",
                fontFamily: "'Inter', sans-serif", fontSize: "13px",
                fontWeight: currentPage === p ? 700 : 400, cursor: "pointer",
                transition: "all 0.15s ease",
              }}>{p}</button>
            ))}

            <span style={{ color: "#c0c9c3", fontSize: "13px", padding: "0 4px" }}>…</span>

            <button onClick={() => setCurrentPage(156)} style={{
              width: "36px", height: "36px", borderRadius: "2px", border: "1.5px solid",
              borderColor: currentPage === 156 ? "#0b4335" : "#c0c9c3",
              backgroundColor: currentPage === 156 ? "#0b4335" : "#fff",
              color: currentPage === 156 ? "#fff" : "#404945",
              fontFamily: "'Inter', sans-serif", fontSize: "13px", cursor: "pointer",
            }}>156</button>

            <button onClick={() => setCurrentPage((p) => Math.min(156, p + 1))} style={{
              width: "36px", height: "36px", borderRadius: "2px",
              border: "1.5px solid #c0c9c3", backgroundColor: "#fff",
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#404945",
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d={isRTL ? "M15 18l-6-6 6-6" : "M9 18l6-6-6-6"} />
              </svg>
            </button>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ScholarsPage;