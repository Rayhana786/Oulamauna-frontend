import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useLang } from "../../context/LanguageContext";

/* ─────────────────────── Types ─────────────────────── */
type LangCode = "EN" | "AR" | "FR";
type SortOption = "newest" | "oldest" | "name";
type EditType = "bio_modified" | "work_added" | "work_modified" | "media_added" | "media_modified" | "vitals_updated" | "discipline_added";

interface ScholarSubmission {
  id: string;
  name: string;
  language: LangCode;
  editor: string;
  editorId: string;
  originalContributor: string;
  date: string;
  discipline: string;
  submittedAt: Date;
  editType: EditType;
  editDescription: string;
}

/* ─────────────────────── Mock data ─────────────────────── */
const SUBMISSIONS: ScholarSubmission[] = [
  {
    id: "sch_001_en",
    name: "Ibn al-Haytham",
    language: "EN",
    editor: "Dr. Fatima Al-Zahra",
    editorId: "user_fatima",
    originalContributor: "Karim Mansouri",
    date: "June 14, 2026",
    discipline: "Optics & Mathematics",
    submittedAt: new Date("2026-06-14"),
    editType: "bio_modified",
    editDescription: "Biography updated",
  },
  {
    id: "sch_001_ar",
    name: "ابن الهيثم",
    language: "AR",
    editor: "Ahmed Khalil",
    editorId: "user_ahmed",
    originalContributor: "Karim Mansouri",
    date: "June 14, 2026",
    discipline: "Optics & Mathematics",
    submittedAt: new Date("2026-06-14"),
    editType: "work_added",
    editDescription: "New work added",
  },
  {
    id: "sch_002_en",
    name: "Fatima al-Fihriya",
    language: "EN",
    editor: "Sara Al-Rashid",
    editorId: "user_sara",
    originalContributor: "Prof. Hassan",
    date: "June 13, 2026",
    discipline: "Education & Theology",
    submittedAt: new Date("2026-06-13"),
    editType: "media_added",
    editDescription: "Media files added",
  },
  {
    id: "sch_002_ar",
    name: "فاطمة الفهرية",
    language: "AR",
    editor: "Layla Hassan",
    editorId: "user_layla",
    originalContributor: "Prof. Hassan",
    date: "June 13, 2026",
    discipline: "Education & Theology",
    submittedAt: new Date("2026-06-13"),
    editType: "vitals_updated",
    editDescription: "Vital stats updated",
  },
  {
    id: "sch_002_fr",
    name: "Fatima al-Fihriya",
    language: "FR",
    editor: "Pierre Dubois",
    editorId: "user_pierre",
    originalContributor: "Marie Laurent",
    date: "June 12, 2026",
    discipline: "Education & Theology",
    submittedAt: new Date("2026-06-12"),
    editType: "work_modified",
    editDescription: "Work details modified",
  },
  {
    id: "sch_003_en",
    name: "Al-Zahrawi",
    language: "EN",
    editor: "Pedro Alves",
    editorId: "user_pedro",
    originalContributor: "Dr. Sarah",
    date: "June 11, 2026",
    discipline: "Medicine & Surgery",
    submittedAt: new Date("2026-06-11"),
    editType: "discipline_added",
    editDescription: "New discipline added",
  },
  {
    id: "sch_003_fr",
    name: "Abulcasis",
    language: "FR",
    editor: "Jean-Pierre Martin",
    editorId: "user_jean",
    originalContributor: "Dr. Sarah",
    date: "June 11, 2026",
    discipline: "Medicine & Surgery",
    submittedAt: new Date("2026-06-11"),
    editType: "bio_modified",
    editDescription: "Biography updated",
  },
  {
    id: "sch_004_en",
    name: "Maryam al-Asturlabiya",
    language: "EN",
    editor: "Karim Mansouri",
    editorId: "user_karim",
    originalContributor: "Dr. Fatima Al-Zahra",
    date: "June 9, 2026",
    discipline: "Astronomy",
    submittedAt: new Date("2026-06-09"),
    editType: "media_modified",
    editDescription: "Media files updated",
  },
  {
    id: "sch_004_ar",
    name: "مريم الأسطرلابية",
    language: "AR",
    editor: "Omar Ibn al-Khattab",
    editorId: "user_omar",
    originalContributor: "Dr. Fatima Al-Zahra",
    date: "June 9, 2026",
    discipline: "Astronomy",
    submittedAt: new Date("2026-06-09"),
    editType: "work_added",
    editDescription: "New work added",
  },
];

/* ─────────────────────── Colors ─────────────────────── */
const C = {
  pageBg: "#f9faf7",
  cardBg: "#f3f4f1",
  white: "#ffffff",
  tableSectionBg: "#f3f4f1",
  tableHeaderBg: "#eaebe8",
  border: "#c0c9c3",
  text: "#191c1b",
  muted: "#404945",
  subtle: "#707974",
  primary: "#0b4335",
  forest: "#285B4B",
  gold: "#fed65b",
  goldIconColor: "#7c5e12",
  rejectText: "#ba1a1a",
  rejectBorder: "rgba(186,26,26,0.3)",
  rejectBg: "#ffdad6",
  approveBorder: "rgba(40,91,75,0.3)",
  activeBg: "rgba(11,67,53,0.08)",
  hoverBg: "rgba(11,67,53,0.04)",
  overdueIconBg: "#fce8e8",
  todayIconBg: "rgba(254,214,91,0.22)",
  defaultIconBg: "rgba(11,67,53,0.10)",
  timeIconBg: "#e8e9e6",
  avatarBg: "#fed65b",
  avatarText: "#3a2c00",
  editorAvatarBg: "#0b4335",
  editorAvatarText: "#ffffff",
  editTypeBio: "rgba(11,67,53,0.08)",
  editTypeWork: "rgba(74,127,203,0.10)",
  editTypeMedia: "rgba(124,94,158,0.10)",
  editTypeVitals: "rgba(254,214,91,0.18)",
  editTypeDiscipline: "rgba(40,91,75,0.08)",
};

const LANG_VERSION_LABEL: Record<LangCode, string> = {
  EN: "English version",
  AR: "Arabic version",
  FR: "French version",
};

/* ─────────────────────── Stats helper ─────────────────────── */
function getStats(rows: ScholarSubmission[]) {
  const now = new Date();
  const total = rows.length;
  const overdue = rows.filter((r) => {
    const daysOld = Math.floor((now.getTime() - r.submittedAt.getTime()) / (1000 * 60 * 60 * 24));
    return daysOld > 3;
  }).length;
  const newToday = rows.filter((r) => {
    const today = new Date();
    return r.submittedAt.toDateString() === today.toDateString();
  }).length;
  const thisWeek = rows.filter((r) => {
    const daysOld = Math.floor((now.getTime() - r.submittedAt.getTime()) / (1000 * 60 * 60 * 24));
    return daysOld <= 7;
  }).length;
  return { total, overdue, newToday, thisWeek, avgTime: "2h 15m" };
}

/* ─────────────────────── Component ─────────────────────── */
export default function NewScholarsQueue() {
  const navigate = useNavigate();
  const { t, lang } = useLang();
  const isRTL = lang === "AR";

  const [filterLanguage, setFilterLanguage] = useState<LangCode | "all">("all");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [filterDiscipline, setFilterDiscipline] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [rows] = useState(SUBMISSIONS);
  const [stripTarget, setStripTarget] = useState<ScholarSubmission | null>(null);

  const stats = getStats(rows);

  const disciplines = useMemo(() => {
    const unique = [...new Set(rows.map((r) => r.discipline))];
    return unique.sort();
  }, [rows]);

  const filtered = useMemo(() => {
    let result = [...rows];
    if (filterLanguage !== "all") result = result.filter((s) => s.language === filterLanguage);
    if (filterDiscipline !== "all") result = result.filter((s) => s.discipline === filterDiscipline);
    result.sort((a, b) => {
      switch (sortBy) {
        case "newest": return b.submittedAt.getTime() - a.submittedAt.getTime();
        case "oldest": return a.submittedAt.getTime() - b.submittedAt.getTime();
        case "name":   return a.name.localeCompare(b.name);
        default:       return 0;
      }
    });
    return result;
  }, [rows, filterLanguage, sortBy, filterDiscipline, filterType]);

  const goToReview = (s: ScholarSubmission) => navigate(`/admin/pending/edits/${s.id}?lang=${s.language}`);
  const handleApprove = (id: string) => console.log("Approved:", id);
  const handleReject  = (id: string) => console.log("Rejected:", id);
  const confirmStrip  = () => { if (!stripTarget) return; setStripTarget(null); };

  const clearFilters = () => {
    setFilterLanguage("all");
    setSortBy("newest");
    setFilterDiscipline("all");
    setFilterType("all");
  };

  const hasActiveFilters = filterLanguage !== "all" || filterDiscipline !== "all" || filterType !== "all";

  const getLangName = (code: LangCode) => {
    switch (code) {
      case "EN": return t("reviewQueue.lang.en");
      case "AR": return t("reviewQueue.lang.ar");
      case "FR": return t("reviewQueue.lang.fr");
    }
  };

  const getEditTypeStyle = (editType: EditType) => {
    const styles: Record<EditType, { bg: string; color: string; icon: string }> = {
      bio_modified: { bg: C.editTypeBio, color: C.primary, icon: "auto_stories" },
      work_added: { bg: C.editTypeWork, color: "#4a7fcb", icon: "add" },
      work_modified: { bg: C.editTypeWork, color: "#4a7fcb", icon: "edit" },
      media_added: { bg: C.editTypeMedia, color: "#7c5e9e", icon: "add_photo_alternate" },
      media_modified: { bg: C.editTypeMedia, color: "#7c5e9e", icon: "photo_library" },
      vitals_updated: { bg: C.editTypeVitals, color: C.goldIconColor, icon: "info" },
      discipline_added: { bg: C.editTypeDiscipline, color: C.forest, icon: "category" },
    };
    return styles[editType];
  };

  const getEditTypeLabel = (editType: EditType) => {
    const labels: Record<EditType, string> = {
      bio_modified: "reviewQueue.editTypes.bioModified",
      work_added: "reviewQueue.editTypes.workAdded",
      work_modified: "reviewQueue.editTypes.workModified",
      media_added: "reviewQueue.editTypes.mediaAdded",
      media_modified: "reviewQueue.editTypes.mediaModified",
      vitals_updated: "reviewQueue.editTypes.vitalsUpdated",
      discipline_added: "reviewQueue.editTypes.disciplineAdded",
    };
    return t(labels[editType]);
  };

  return (
    <div
      dir={isRTL ? "rtl" : "ltr"}
      style={{ fontFamily: "'Inter', sans-serif", color: C.text, background: C.pageBg, minHeight: "100vh" }}
    >
      <style>{`
        .nsq-wrap {
          padding: 40px;
          max-width: 1400px;
          margin: 0 auto;
        }

        .nsq-header { margin-bottom: 32px; }
        .nsq-header h2 {
          font-size: 32px;
          font-weight: 700;
          color: ${C.primary};
          margin-bottom: 8px;
        }
        .nsq-subtitle {
          font-size: 14px;
          color: ${C.muted};
          max-width: 800px;
          line-height: 1.6;
        }

        .nsq-stats {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 14px;
          margin-bottom: 20px;
        }
        .nsq-stat-card {
          background: ${C.cardBg};
          border: 1px solid ${C.border};
          border-radius: 12px;
          padding: 22px 20px;
          min-height: 90px;
          display: flex;
          align-items: center;
          gap: 14px;
          overflow: hidden;
          transition: transform 0.15s, box-shadow 0.15s;
        }
        .nsq-stat-card:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(11,67,53,0.08);
        }
        .nsq-stat-icon {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .nsq-stat-icon .ms { font-size: 22px; }
        .nsq-stat-icon.default  { background: ${C.defaultIconBg}; color: ${C.primary}; }
        .nsq-stat-icon.overdue  { background: ${C.overdueIconBg}; color: ${C.rejectText}; }
        .nsq-stat-icon.today    { background: ${C.todayIconBg};   color: ${C.goldIconColor}; }
        .nsq-stat-icon.time     { background: ${C.timeIconBg};    color: ${C.primary}; }
        .nsq-stat-icon.week     { background: ${C.defaultIconBg}; color: ${C.primary}; }

        .nsq-stat-content {
          display: flex;
          flex-direction: column;
          gap: 5px;
          min-width: 0;
        }
        .nsq-stat-label {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: ${C.subtle};
          white-space: normal;
          line-height: 1.3;
        }
        .nsq-stat-value {
          font-size: 28px;
          font-weight: 800;
          color: ${C.primary};
          line-height: 1;
          letter-spacing: -0.02em;
          white-space: nowrap;
        }
        .nsq-stat-card.overdue .nsq-stat-value { color: ${C.rejectText}; }

        .nsq-filters {
          background: ${C.cardBg};
          border: 1px solid ${C.border};
          border-radius: 10px;
          padding: 16px 20px;
          margin-bottom: 20px;
        }
        .nsq-filters-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 12px;
        }
        .nsq-filters-title {
          font-size: 13px;
          font-weight: 700;
          color: ${C.primary};
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .nsq-filters-title .ms { font-size: 16px; }
        .nsq-clear-link {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          color: ${C.rejectText};
          background: none;
          border: none;
          cursor: pointer;
          padding: 0;
        }
        .nsq-clear-link:hover { text-decoration: underline; }
        .nsq-filters-row {
          display: flex;
          gap: 20px;
          align-items: flex-start;
          flex-wrap: wrap;
        }
        .nsq-filter-group {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }
        .nsq-filter-label {
          font-size: 10px;
          font-weight: 700;
          color: ${C.subtle};
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }
        .nsq-filter-select {
          padding: 10px 12px;
          border: 1px solid ${C.border};
          border-radius: 8px;
          font-size: 13.5px;
          background: ${C.white};
          color: ${C.text};
          cursor: pointer;
          outline: none;
          transition: border-color 0.2s;
          min-width: 150px;
          height: 42px;
          font-family: 'Inter', sans-serif;
        }
        .nsq-filter-select:hover { border-color: ${C.primary}; }
        .nsq-filter-select:focus {
          border-color: ${C.primary};
          box-shadow: 0 0 0 3px rgba(11,67,53,0.1);
        }

        .nsq-table-card {
          background: ${C.tableSectionBg};
          border: 1px solid ${C.border};
          border-radius: 12px;
          overflow: hidden;
        }
        .nsq-table-header {
          padding: 16px 24px;
          border-bottom: 1px solid ${C.border};
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: ${C.tableSectionBg};
        }
        .nsq-table-title {
          font-size: 16px;
          font-weight: 600;
          color: ${C.primary};
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .nsq-table-title .ms { font-size: 20px; }
        .nsq-updated-badge {
          font-size: 12px;
          padding: 5px 14px;
          background: ${C.cardBg};
          color: ${C.subtle};
          border-radius: 99px;
          font-weight: 600;
          border: 1px solid ${C.border};
        }
        .nsq-table-scroll { overflow-x: auto; }

        table.nsq-table {
          width: 100%;
          border-collapse: collapse;
          min-width: 1000px;
        }
        table.nsq-table th {
          text-align: ${isRTL ? "right" : "left"};
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: ${C.subtle};
          padding: 10px 20px;
          background: ${C.pageBg};
          border-bottom: 1px solid ${C.border};
          white-space: nowrap;
        }
        table.nsq-table td {
          padding: 10px 20px;
          font-size: 13.5px;
          color: ${C.text};
          border-bottom: 1px solid ${C.border};
          vertical-align: middle;
          background: ${C.pageBg};
          white-space: nowrap;
        }
        table.nsq-table tr:last-child td { border-bottom: none; }
        table.nsq-table tr:hover td { background: rgba(11,67,53,0.04); }

        .nsq-scholar-cell {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .nsq-scholar-avatar {
          width: 36px;
          height: 36px;
          border-radius: 8px;
          overflow: hidden;
          flex-shrink: 0;
          border: 1.5px solid ${C.border};
        }
        .nsq-scholar-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .nsq-scholar-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .nsq-name {
          font-weight: 600;
          color: ${C.text};
          font-size: 13.5px;
          white-space: nowrap;
        }
        .nsq-original-contributor {
          font-size: 11px;
          color: ${C.muted};
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .nsq-original-contributor .ms {
          font-size: 12px;
          color: ${C.subtle};
        }
        .nsq-meta-row {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 11px;
          color: ${C.subtle};
          font-weight: 500;
          white-space: nowrap;
        }

        .nsq-editor-cell {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .nsq-editor-avatar {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: ${C.editorAvatarBg};
          color: ${C.editorAvatarText};
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          font-weight: 700;
          flex-shrink: 0;
        }

        .nsq-edit-type-chip {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 5px 12px;
          border-radius: 99px;
          font-size: 11px;
          font-weight: 600;
          white-space: nowrap;
        }
        .nsq-edit-type-chip .ms {
          font-size: 14px;
        }

        .nsq-actions {
          display: flex;
          gap: 8px;
          align-items: center;
        }
        .nsq-action-btn {
          width: 36px;
          height: 36px;
          border-radius: 8px;
          cursor: pointer;
          border: 1.5px solid ${C.border};
          background: ${C.white};
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.18s;
          flex-shrink: 0;
        }
        .nsq-action-btn .ms { font-size: 18px; }
        .nsq-action-btn.view   { color: ${C.subtle}; }
        .nsq-action-btn.view:hover {
          background: ${C.cardBg};
          border-color: ${C.primary};
          color: ${C.primary};
        }
        .nsq-action-btn.approve {
          color: ${C.forest};
          border-color: ${C.approveBorder};
        }
        .nsq-action-btn.approve:hover {
          background: ${C.activeBg};
          border-color: ${C.forest};
        }
        .nsq-action-btn.reject {
          color: ${C.rejectText};
          border-color: ${C.rejectBorder};
        }
        .nsq-action-btn.reject:hover {
          background: ${C.rejectBg};
          border-color: ${C.rejectText};
        }
        .nsq-action-btn.strip { color: ${C.muted}; }
        .nsq-action-btn.strip:hover {
          background: ${C.rejectText};
          color: white;
          border-color: ${C.rejectText};
        }

        .nsq-pagination {
          padding: 14px 24px;
          background: ${C.tableSectionBg};
          border-top: 1px solid ${C.border};
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .nsq-pagination-info { font-size: 12px; color: ${C.muted}; }
        .nsq-pagination-buttons { display: flex; gap: 6px; }
        .nsq-page-btn {
          min-width: 36px;
          height: 36px;
          padding: 0 12px;
          border-radius: 8px;
          border: 1px solid ${C.border};
          background: ${C.white};
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.18s;
          color: ${C.text};
        }
        .nsq-page-btn.active {
          background: ${C.primary};
          color: white;
          border-color: ${C.primary};
        }
        .nsq-page-btn:hover:not(.active) { background: ${C.cardBg}; }
        .nsq-page-btn:disabled { opacity: 0.4; cursor: default; }

        .nsq-empty {
          padding: 80px 20px;
          text-align: center;
          color: ${C.muted};
          font-size: 14px;
          background: ${C.white};
        }
        .nsq-empty .ms {
          font-size: 48px;
          display: block;
          margin-bottom: 16px;
          opacity: 0.3;
        }

        .nsq-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(11,20,17,0.5);
          z-index: 100;
          display: flex;
          align-items: center;
          justify-content: center;
          backdrop-filter: blur(4px);
        }
        .nsq-modal {
          background: ${C.white};
          border-radius: 16px;
          width: 440px;
          max-width: 90vw;
          padding: 32px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.18);
        }
        .nsq-modal-icon {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: ${C.rejectBg};
          color: ${C.rejectText};
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 20px;
        }
        .nsq-modal-title  { font-size: 20px; font-weight: 700; margin-bottom: 12px; }
        .nsq-modal-body   { font-size: 14px; color: ${C.muted}; line-height: 1.6; margin-bottom: 28px; }
        .nsq-modal-actions { display: flex; gap: 12px; justify-content: flex-end; }
        .nsq-modal-cancel {
          padding: 10px 24px;
          border-radius: 8px;
          cursor: pointer;
          border: 1px solid ${C.border};
          background: ${C.white};
          font-weight: 600;
          transition: all 0.18s;
          color: ${C.text};
        }
        .nsq-modal-cancel:hover { background: ${C.cardBg}; }
        .nsq-modal-confirm {
          padding: 10px 24px;
          border-radius: 8px;
          cursor: pointer;
          border: none;
          color: white;
          background: ${C.rejectText};
          font-weight: 700;
          transition: all 0.18s;
        }
        .nsq-modal-confirm:hover { background: #9e1717; }

        .ms {
          font-family: 'Material Symbols Outlined';
          font-style: normal;
          font-size: 18px;
          display: inline-flex;
          align-items: center;
          user-select: none;
          line-height: 1;
        }
      `}</style>

      <link
        href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20,700,0..1,0&display=swap"
        rel="stylesheet"
      />

      <div className="nsq-wrap">

        <div className="nsq-header">
          <h2>{t("reviewQueue.title")}</h2>
          <div className="nsq-subtitle">
            {t("reviewQueue.subtitle")}
          </div>
        </div>

        <div className="nsq-stats">
          <div className="nsq-stat-card">
            <div className="nsq-stat-icon default">
              <span className="ms">pending_actions</span>
            </div>
            <div className="nsq-stat-content">
              <span className="nsq-stat-label">{t("reviewQueue.stats.totalPending")}</span>
              <span className="nsq-stat-value">{stats.total}</span>
            </div>
          </div>

          <div className="nsq-stat-card overdue">
            <div className="nsq-stat-icon overdue">
              <span className="ms">priority_high</span>
            </div>
            <div className="nsq-stat-content">
              <span className="nsq-stat-label">{t("reviewQueue.stats.overdue")}</span>
              <span className="nsq-stat-value">{stats.overdue}</span>
            </div>
          </div>

          <div className="nsq-stat-card">
            <div className="nsq-stat-icon today">
              <span className="ms">new_releases</span>
            </div>
            <div className="nsq-stat-content">
              <span className="nsq-stat-label">{t("reviewQueue.stats.newToday")}</span>
              <span className="nsq-stat-value">{stats.newToday}</span>
            </div>
          </div>

          <div className="nsq-stat-card">
            <div className="nsq-stat-icon time">
              <span className="ms">schedule</span>
            </div>
            <div className="nsq-stat-content">
              <span className="nsq-stat-label">{t("reviewQueue.stats.avgTime")}</span>
              <span className="nsq-stat-value" style={{ fontSize: 22 }}>{stats.avgTime}</span>
            </div>
          </div>

          <div className="nsq-stat-card">
            <div className="nsq-stat-icon week">
              <span className="ms">calendar_today</span>
            </div>
            <div className="nsq-stat-content">
              <span className="nsq-stat-label">{t("reviewQueue.stats.thisWeek")}</span>
              <span className="nsq-stat-value">{stats.thisWeek}</span>
            </div>
          </div>
        </div>

        <div className="nsq-filters">
          <div className="nsq-filters-head">
            <div className="nsq-filters-title">
              <span className="ms">tune</span>
              {t("reviewQueue.filters.title")}
            </div>
            {hasActiveFilters && (
              <button className="nsq-clear-link" onClick={clearFilters}>{t("reviewQueue.filters.clearAll")}</button>
            )}
          </div>
          <div className="nsq-filters-row">
            <div className="nsq-filter-group">
              <span className="nsq-filter-label">{t("reviewQueue.filters.language")}</span>
              <select
                className="nsq-filter-select"
                value={filterLanguage}
                onChange={(e) => setFilterLanguage(e.target.value as LangCode | "all")}
              >
                <option value="all">{t("reviewQueue.filters.allLanguages")}</option>
                <option value="EN">{t("reviewQueue.lang.en")}</option>
                <option value="AR">{t("reviewQueue.lang.ar")}</option>
                <option value="FR">{t("reviewQueue.lang.fr")}</option>
              </select>
            </div>

            <div className="nsq-filter-group">
              <span className="nsq-filter-label">{t("reviewQueue.filters.discipline")}</span>
              <select
                className="nsq-filter-select"
                value={filterDiscipline}
                onChange={(e) => setFilterDiscipline(e.target.value)}
              >
                <option value="all">{t("reviewQueue.filters.allDisciplines")}</option>
                {disciplines.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <div className="nsq-filter-group">
              <span className="nsq-filter-label">{t("reviewQueue.filters.type")}</span>
              <select
                className="nsq-filter-select"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
              >
                <option value="all">{t("reviewQueue.filters.allTypes")}</option>
                <option value="new">{t("reviewQueue.filters.newProfile")}</option>
                <option value="edit">{t("reviewQueue.filters.contentEdit")}</option>
              </select>
            </div>

            <div className="nsq-filter-group">
              <span className="nsq-filter-label">{t("reviewQueue.filters.sort")}</span>
              <select
                className="nsq-filter-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
              >
                <option value="newest">{t("reviewQueue.sort.newest")}</option>
                <option value="oldest">{t("reviewQueue.sort.oldest")}</option>
                <option value="name">{t("reviewQueue.sort.nameAZ")}</option>
              </select>
            </div>
          </div>
        </div>

        <div className="nsq-table-card">
          <div className="nsq-table-header">
            <h3 className="nsq-table-title">
              {t("reviewQueue.table.title")}
            </h3>
            <span className="nsq-updated-badge">{t("reviewQueue.table.updated")}</span>
          </div>

          <div className="nsq-table-scroll">
            <table className="nsq-table">
              <thead>
                <tr>
                  <th>{t("reviewQueue.table.scholar")}</th>
                  <th>{t("reviewQueue.table.editor")}</th>
                  <th>{t("reviewQueue.table.editType")}</th>
                  <th>{t("reviewQueue.table.submitted")}</th>
                  <th style={{ textAlign: isRTL ? "left" : "right" }}>{t("reviewQueue.table.actions")}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5}>
                      <div className="nsq-empty">
                        <span className="ms">inbox</span>
                        {t("reviewQueue.table.empty")}
                      </div>
                    </td>
                  </tr>
                ) : (
                  filtered.map((s) => {
                    const editorInitials = s.editor
                      .split(" ")
                      .slice(0, 2)
                      .map((w) => w[0])
                      .join("")
                      .toUpperCase();

                    const scholarImage = `https://ui-avatars.com/api/?name=${encodeURIComponent(s.name)}&background=285B4B&color=fff&size=44`;
                    const editTypeStyle = getEditTypeStyle(s.editType);

                    return (
                      <tr key={s.id}>
                        <td>
                          <div className="nsq-scholar-cell">
                            <div className="nsq-scholar-avatar">
                              <img src={scholarImage} alt={s.name} />
                            </div>
                            <div className="nsq-scholar-info">
                              <div className="nsq-name">{s.name}</div>
                              <div className="nsq-original-contributor">
                                <span className="ms">person</span>
                                {s.originalContributor}
                              </div>
                              <div className="nsq-meta-row">
                                <span style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "5px",
                                  padding: "2px 8px",
                                  borderRadius: "99px",
                                  fontSize: "11px",
                                  fontWeight: 600,
                                  background: C.cardBg,
                                  color: C.muted,
                                  border: `1px solid ${C.border}`,
                                }}>
                                  <span style={{
                                    width: "6px",
                                    height: "6px",
                                    borderRadius: "50%",
                                    background: s.language === "AR" ? C.gold : s.language === "FR" ? "#4a7fcb" : C.primary,
                                    flexShrink: 0,
                                  }} />
                                  {getLangName(s.language)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>

                        <td>
                          <div className="nsq-editor-cell">
                            <div className="nsq-editor-avatar">
                              {editorInitials}
                            </div>
                            <span style={{ fontSize: 13 }}>{s.editor}</span>
                          </div>
                        </td>

                        <td>
                          <span 
                            className="nsq-edit-type-chip"
                            style={{
                              background: editTypeStyle.bg,
                              color: editTypeStyle.color,
                            }}
                          >
                            <span className="ms">{editTypeStyle.icon}</span>
                            {getEditTypeLabel(s.editType)}
                          </span>
                        </td>

                        <td style={{ color: C.subtle, fontSize: 13 }}>{s.date}</td>

                        <td>
                          <div
                            className="nsq-actions"
                            style={{ justifyContent: isRTL ? "flex-start" : "flex-end" }}
                          >
                            <button className="nsq-action-btn view" onClick={() => goToReview(s)} title={t("reviewQueue.actions.review")}>
                              <span className="ms">visibility</span>
                            </button>
                            <button className="nsq-action-btn approve" onClick={() => handleApprove(s.id)} title={t("reviewQueue.actions.approve")}>
                              <span className="ms">check_circle</span>
                            </button>
                            <button className="nsq-action-btn reject" onClick={() => handleReject(s.id)} title={t("reviewQueue.actions.reject")}>
                              <span className="ms">cancel</span>
                            </button>
                            <button className="nsq-action-btn strip" onClick={() => setStripTarget(s)} title={t("reviewQueue.actions.strip")}>
                              <span className="ms">person_remove</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="nsq-pagination">
            <span className="nsq-pagination-info">
              {t("reviewQueue.pagination.showing")
                .replace("{start}", "1")
                .replace("{end}", String(Math.min(10, filtered.length)))
                .replace("{total}", String(filtered.length))}
            </span>
            <div className="nsq-pagination-buttons">
              <button className="nsq-page-btn" disabled>
                <span className="ms" style={{ fontSize: 16 }}>chevron_left</span>
              </button>
              <button className="nsq-page-btn active">1</button>
              {filtered.length > 10 && <button className="nsq-page-btn">2</button>}
              {filtered.length > 20 && <button className="nsq-page-btn">3</button>}
              <button className="nsq-page-btn">
                <span className="ms" style={{ fontSize: 16 }}>chevron_right</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {stripTarget && (
        <div className="nsq-modal-overlay" onClick={() => setStripTarget(null)}>
          <div className="nsq-modal" onClick={(e) => e.stopPropagation()}>
            <div className="nsq-modal-icon">
              <span className="ms">person_remove</span>
            </div>
            <div className="nsq-modal-title">{t("reviewQueue.modal.title")}</div>
            <div className="nsq-modal-body">
              {t("reviewQueue.modal.body").replace("{name}", stripTarget.editor)}
              <br />
              <b>{t("reviewQueue.modal.warning")}</b>
            </div>
            <div className="nsq-modal-actions">
              <button className="nsq-modal-cancel" onClick={() => setStripTarget(null)}>{t("reviewQueue.modal.cancel")}</button>
              <button className="nsq-modal-confirm" onClick={confirmStrip}>{t("reviewQueue.modal.confirm")}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}