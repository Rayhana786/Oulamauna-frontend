
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useLang } from "../../context/LanguageContext";

/* ─────────────────────── Types ─────────────────────── */
type DisciplineStatus = "existing" | "new_pending" | "new_kept" | "new_removed";

interface DisciplineTag {
  id: string;
  label: string;
  isNew: boolean;
  status: DisciplineStatus;
  dbUrl?: string;
}

interface Teacher {
  id: string;
  name: string;
  subtitle: string;
}

interface Work {
  id: string;
  title: string;
  year: string;
  format: "BOOK" | "MANUSCRIPT" | "ARTICLE";
  access: string | null;
  accessLabel: string | null;
}

interface MediaItem {
  id: string;
  title: string;
  meta: string;
  type: string;
  icon: string;
  color: string;
  description: string;
  access?: string | null;
}

interface AcademicRef {
  id: string;
  text: string;
}

interface ScholarDetail {
  id: string;
  submittedBy: string;
  submitterAvatar: string;
  date: string;
  submittedLang: "EN" | "AR" | "FR";
  isHighImpact: boolean;
  fullName: string;
  fullNameAr: string;
  bio: string;
  wordCount: number;
  readingTime: number;
  birthYear: string;
  birthPlace: string;
  deathYear: string;
  deathPlace: string;
  lifespan: string;
  region: string;
  century: string;
  discipline: string;
  teachers: Teacher[];
  disciples: Teacher[];
  works: Work[];
  media: MediaItem[];
  references: AcademicRef[];
  disciplineTags: DisciplineTag[];
  submitterNote: string;
}

/* ─────────────────────── Mock data ─────────────────────── */
const DETAIL: ScholarDetail = {
  id: "sch_001",
  submittedBy: "Zaid Al-Hassan",
  submitterAvatar: "ZA",
  date: "24 OCT 2023",
  submittedLang: "AR",
  isHighImpact: true,
  fullName: "Malek Bennabi",
  fullNameAr: "مالك بن نبي",
  bio: `يعدّ مالك بن نبي من أبرز المفكرين الإسلاميين في القرن العشرين، إذ أسهم إسهاماً بالغ الأثر في تشكيل الفكر الإصلاحي العربي والإسلامي المعاصر. وُلد في قسنطينة عام 1905، وتوفي في الجزائر عام 1973، بعد أن أمضى معظم حياته في التأمل والكتابة والنضال الفكري في مواجهة إشكاليات التخلف الحضاري.

طوّر بن نبي رؤية نقدية شاملة حول ظاهرة "القابلية للاستعمار"، مؤكداً أن ضعف المجتمعات الإسلامية ليس نتيجةً خارجية حتمية، بل هو في جوهره أزمة داخلية ثقافية وحضارية. وقد عالج في كتاباته إشكالية النهضة من منظور حضاري متكامل، يربط بين الدين والإنسان والتراب باعتبارها عناصر تكوينية لأي نهضة حقيقية.`,
  wordCount: 142,
  readingTime: 2,
  birthYear: "1905",
  birthPlace: "Constantine",
  deathYear: "1973",
  deathPlace: "Algiers",
  lifespan: "1905 · 1973 (Algeria)",
  region: "North Africa (Algeria)",
  century: "20th Century / 14th AH",
  discipline: "Social Sciences, Philosophy",
  teachers: [
    { id: "t1", name: "Ibn Badis", subtitle: "Early Influence" },
    { id: "t2", name: "Ibn Khaldun", subtitle: "Theoretical Foundation" },
  ],
  disciples: [
    { id: "d1", name: "Al-Mesawi", subtitle: "Direct Student" },
    { id: "d2", name: "Ghannoushi", subtitle: "Intellectual Heir" },
  ],
  works: [
    { id: "w1", title: "The Quranic Phenomenon",                   year: "1946", format: "BOOK",       access: null,                  accessLabel: null },
    { id: "w2", title: "Conditions of the Renaissance",            year: "1948", format: "BOOK",       access: "https://archive.org", accessLabel: "VIEW PDF" },
    { id: "w3", title: "The Problem of Ideas in the Muslim World", year: "1970", format: "MANUSCRIPT", access: null,                  accessLabel: null },
    { id: "w4", title: "Vocation de l'Islam",                      year: "1954", format: "BOOK",       access: "https://archive.org", accessLabel: "VIEW PDF" },
  ],
  media: [
    { id: "m1", title: "The Question of Culture",  meta: "2.4 MB · Primary Source",  type: "Primary Source",   icon: "description",   color: "#E8F0FE", description: "Original manuscript with annotations.", access: "https://archive.org/details/example-manuscript" },
    { id: "m2", title: "Original Portraits",        meta: "1.1 MB · Media",           type: "Media",            icon: "photo_library", color: "#FCE8E6", description: "Photographic archive from the 1960s.",   access: "https://archive.org/details/example-portraits" },
    { id: "m3", title: "1965 Cairo Lecture",         meta: "Audio · 45:00",            type: "Historic Seminar", icon: "mic",           color: "#E6F4EA", description: "Recorded lecture at Al-Azhar University.", access: "https://archive.org/details/example-lecture-audio" },
    { id: "m4", title: "The Idea and Thought",       meta: "Video · HD",               type: "Documentary",      icon: "play_circle",   color: "#FEF3E2", description: "Documentary series on his legacy.",      access: "https://archive.org/details/example-documentary" },
  ],
  references: [
    { id: "r1", text: "Bennabi, M. (1948). Les Conditions de la Renaissance. Alger: Éditions de la Renaissance d'Algérie." },
    { id: "r2", text: "Stenberg, L. (1996). The Islamization of Science: Four Muslim Positions. Lund Studies in African and Asian Religions." },
    { id: "r3", text: "Naylor, P. C. (2000). France and Algeria: A History of Decolonization and Transformation. University Press of Florida." },
  ],
  disciplineTags: [
    { id: "dt1", label: "Philosophy of History",  isNew: false, status: "existing",    dbUrl: "/disciplines/philosophy-of-history" },
    { id: "dt2", label: "Civilizational Studies", isNew: true,  status: "new_pending" },
    { id: "dt3", label: "Sociology",              isNew: false, status: "existing",    dbUrl: "/disciplines/sociology" },
    { id: "dt4", label: "Political Economy",      isNew: true,  status: "new_pending" },
    { id: "dt5", label: "Islamic Reform",         isNew: false, status: "existing",    dbUrl: "/disciplines/islamic-reform" },
  ],
  submitterNote: `"This is a high-quality summary based on original French and Arabic texts. She verified the dates against the Algerian National Library records. Please note the specific spelling of 'Bennabi' in Arabic as it often gets mistranscribed."`,
};

/* ─────────────────────── Colors ─────────────────────── */
const C = {
  bg: "#FAF9F6",
  border: "#E0E2DF",
  primary: "#0b4335",
  forest: "#285B4B",
  gold: "#C9A84C",
  text: "#191c1b",
  muted: "#5C6360",
  subtle: "#9EAAA6",
  white: "#ffffff",
  hoverBg: "rgba(11,67,53,0.05)",
  newChipBg: "#0b4335",
  newChipText: "#ffffff",
  existingChipBg: "rgba(11,67,53,0.07)",
  existingChipBorder: "rgba(11,67,53,0.18)",
  existingChipText: "#0b4335",
  keptChipBg: "rgba(11,67,53,0.12)",
  keptChipBorder: "rgba(11,67,53,0.35)",
  keptChipText: "#0b4335",
  removedChipBg: "rgba(186,26,26,0.06)",
  removedChipBorder: "rgba(186,26,26,0.25)",
  removedChipText: "#ba1a1a",
  approveBtn: "#0b4335",
  rejectBtn: "#ba1a1a",
  rejectBorder: "rgba(186,26,26,0.35)",
  rejectBg: "rgba(186,26,26,0.05)",
  stripBg: "#fff",
  stripText: "#5C6360",
  editBtn: "#9a6f1a",
  editBg: "rgba(201,168,76,0.12)",
  editBorder: "rgba(201,168,76,0.4)",
};

type DecisionMode = null | "approve" | "reject" | "strip";

/* ─────────────────────── helpers ─────────────────────── */
// Returns translated label + icon for a media item's action button.
// tKey is used with the t() function from your i18n context.
function getMediaViewInfo(m: MediaItem): { tKey: string; icon: string } {
  if (m.icon === "mic" || m.meta.toLowerCase().includes("audio"))
    return { tKey: "scholarReview.media.listen",     icon: "headphones" };
  if (m.icon === "play_circle" || m.meta.toLowerCase().includes("video"))
    return { tKey: "scholarReview.media.watch",      icon: "play_circle" };
  if (
    m.icon === "description" ||
    m.meta.toLowerCase().includes("pdf") ||
    m.type.toLowerCase().includes("primary source")
  )
    return { tKey: "scholarReview.media.viewPdf",    icon: "picture_as_pdf" };
  if (m.icon === "photo_library")
    return { tKey: "scholarReview.media.viewPhotos", icon: "image" };
  return { tKey: "scholarReview.media.open",         icon: "open_in_new" };
}

/* ─────────────────────── Component ─────────────────────── */
export default function ScholarReview() {
  const { id: _scholarId } = useParams();
  const navigate = useNavigate();
  const { t, lang } = useLang();
  const isRTL = lang === "AR";

  const [mode, setMode] = useState<DecisionMode>(null);
  const [note, setNote] = useState("");

  const [disciplineTags, setDisciplineTags] = useState<DisciplineTag[]>(DETAIL.disciplineTags);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [scholar, setScholar] = useState<ScholarDetail>(DETAIL);
  const [draftSnapshot, setDraftSnapshot] = useState<ScholarDetail | null>(null);

  const startEditing = () => { setDraftSnapshot(scholar); setIsEditing(true); };
  const cancelEditing = () => { if (draftSnapshot) setScholar(draftSnapshot); setDraftSnapshot(null); setIsEditing(false); };
  const saveEditing = () => { setDraftSnapshot(null); setIsEditing(false); };

  const updateField = <K extends keyof ScholarDetail>(key: K, value: ScholarDetail[K]) =>
    setScholar((prev) => ({ ...prev, [key]: value }));

  const updateTeacher = (list: "teachers" | "disciples", id: string, field: keyof Teacher, value: string) =>
    setScholar((prev) => ({ ...prev, [list]: prev[list].map((p) => p.id === id ? { ...p, [field]: value } : p) }));

  const updateWork = (id: string, field: keyof Work, value: string) =>
    setScholar((prev) => ({ ...prev, works: prev.works.map((w) => w.id === id ? { ...w, [field]: value } : w) }));

  const updateMedia = (id: string, field: keyof MediaItem, value: string) =>
    setScholar((prev) => ({ ...prev, media: prev.media.map((m) => m.id === id ? { ...m, [field]: value } : m) }));

  const keepNewDiscipline  = (id: string) => setConfirmingId(id);
  const cancelKeep         = ()           => setConfirmingId(null);
  const confirmKeep        = (id: string) => { setDisciplineTags((prev) => prev.map((d) => d.id === id ? { ...d, status: "new_kept" } : d)); setConfirmingId(null); };
  const removeNewDiscipline = (id: string) => { setDisciplineTags((prev) => prev.map((d) => d.id === id ? { ...d, status: "new_removed" } : d)); setConfirmingId(null); };
  const undoRemove         = (id: string) => setDisciplineTags((prev) => prev.map((d) => d.id === id ? { ...d, status: "new_pending" } : d));

  const handleConfirm = () => {
    console.log("Review decision:", { scholarId: scholar.id, decision: mode, note, disciplines: disciplineTags.filter((d) => d.status !== "new_removed").map((d) => ({ label: d.label, isNew: d.isNew })) });
    navigate("/admin/pending/scholars");
  };

  // ── Submitted language label — keep these hardcoded to avoid missing-key issue ──
  const langLabel =
    scholar.submittedLang === "AR" ? "Arabic (Primary)" :
    scholar.submittedLang === "FR" ? "Français (Primary)" :
    "English (Primary)";

  const newKeptCount    = disciplineTags.filter((d) => d.isNew && d.status === "new_kept").length;
  const newRemovedCount = disciplineTags.filter((d) => d.isNew && d.status === "new_removed").length;
  const newPendingCount = disciplineTags.filter((d) => d.isNew && d.status === "new_pending").length;

  return (
    <div
      dir={isRTL ? "rtl" : "ltr"}
      style={{ fontFamily: "'Inter', sans-serif", color: C.text, background: C.bg, minHeight: "100vh" }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Source+Serif+4:ital,opsz,wght@0,8..60,400..700;1,8..60,400..700&family=JetBrains+Mono:wght@400;600;700&family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20,400,0,0&display=swap');

        .ms {
          font-family: 'Material Symbols Outlined';
          font-style: normal; font-size: 16px;
          display: inline-flex; align-items: center;
          user-select: none; line-height: 1; flex-shrink: 0;
        }

        .sr-wrap { padding: 20px 28px 56px; }

        .sr-crumbs {
          font-size: 12px; color: ${C.muted}; margin-bottom: 14px;
          display: flex; align-items: center; gap: 5px;
        }
        .sr-crumbs a { color: ${C.muted}; text-decoration: none; }
        .sr-crumbs a:hover { color: ${C.primary}; }
        .sr-crumbs .ms { font-size: 14px; opacity: 0.5; }
        .sr-crumbs b { color: ${C.text}; font-weight: 600; }

        /* ── Edit bar ── */
        .sr-editbar {
          display: flex; align-items: center; justify-content: space-between;
          background: ${C.editBg}; border: 1.5px solid ${C.editBorder};
          border-radius: 8px; padding: 10px 16px; margin-bottom: 16px;
        }
        .sr-editbar-label { font-size: 12.5px; font-weight: 600; color: ${C.editBtn}; display: flex; align-items: center; gap: 7px; }
        .sr-editbar-label .ms { font-size: 16px; }
        .sr-editbar-actions { display: flex; gap: 8px; }
        .sr-editbar-btn { font-size: 12.5px; font-weight: 700; padding: 7px 14px; border-radius: 6px; cursor: pointer; border: none; font-family: 'Inter', sans-serif; }
        .sr-editbar-cancel { background: ${C.white}; color: ${C.muted}; border: 1px solid ${C.border}; }
        .sr-editbar-cancel:hover { background: #F2F4F2; }
        .sr-editbar-confirm { background: ${C.primary}; color: #fff; }
        .sr-editbar-confirm:hover { background: #0e5443; }

        .sr-edit-toggle {
          display: inline-flex; align-items: center; gap: 6px;
          font-size: 12.5px; font-weight: 600; padding: 8px 14px;
          border-radius: 7px; cursor: pointer; border: 1.5px solid ${C.editBorder};
          background: ${C.white}; color: ${C.editBtn};
          font-family: 'Inter', sans-serif; white-space: nowrap; flex-shrink: 0;
        }
        .sr-edit-toggle:hover { background: ${C.editBg}; }
        .sr-edit-toggle .ms { font-size: 15px; }

        /* Inline edit inputs */
        .sr-inline-input {
          width: 100%; border: 1.5px dashed ${C.editBorder}; border-radius: 5px;
          padding: 4px 7px; font-family: inherit; font-size: inherit; color: inherit;
          background: rgba(201,168,76,0.06); box-sizing: border-box;
        }
        .sr-inline-input:focus { outline: none; border-color: ${C.editBtn}; border-style: solid; }
        .sr-inline-textarea {
          width: 100%; border: 1.5px dashed ${C.editBorder}; border-radius: 6px;
          padding: 10px 12px; font-family: inherit; font-size: 13.5px; line-height: 1.85;
          color: inherit; background: rgba(201,168,76,0.06); box-sizing: border-box;
          resize: vertical; min-height: 160px; direction: rtl; text-align: right;
        }
        .sr-inline-textarea:focus { outline: none; border-color: ${C.editBtn}; border-style: solid; }

        /* ── Hero ──
           Always LTR so layout never flips even when page is AR.
           Two rows: [avatar | info] on top, [action buttons] below on the same card.
        */
        .sr-hero {
          background: ${C.white}; border: 1px solid ${C.border};
          border-radius: 10px; padding: 18px 22px; margin-bottom: 20px;
          direction: ltr;
        }
        .sr-hero-top {
          display: flex; align-items: flex-start; gap: 16px;
        }
        .sr-avatar-initials {
          width: 56px; height: 56px; border-radius: 50%;
          background: ${C.hoverBg}; border: 2px solid rgba(11,67,53,0.12);
          display: flex; align-items: center; justify-content: center;
          font-size: 16px; font-weight: 700; color: ${C.forest}; flex-shrink: 0;
        }
        .sr-hero-info { flex: 1; min-width: 0; }

        /* Scholar name row — always LTR, Arabic name isolated */
        .sr-hero-name {
          font-size: 17px; font-weight: 700; color: ${C.text};
          margin-bottom: 6px;
          display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
          direction: ltr;
        }
        .sr-hero-name-latin { white-space: nowrap; }
        .sr-hero-name-ar {
          direction: rtl; unicode-bidi: isolate;
          font-weight: 400; color: ${C.muted}; font-size: 15px;
          white-space: nowrap;
        }
        .sr-badge-new {
          font-size: 10px; font-weight: 700; letter-spacing: 0.06em;
          padding: 2px 9px; border-radius: 4px;
          background: rgba(11,67,53,0.08); color: ${C.primary};
          text-transform: uppercase; white-space: nowrap; flex-shrink: 0;
        }

        /* Meta row — single flex row, items don't wrap individually */
        .sr-hero-meta {
          font-size: 12.5px; color: ${C.muted};
          display: flex; align-items: center; gap: 6px;
          flex-wrap: wrap; margin-bottom: 4px; direction: ltr;
        }
        .sr-hero-meta .ms { font-size: 14px; color: ${C.subtle}; flex-shrink: 0; }
        .sr-hero-meta strong { color: ${C.text}; white-space: nowrap; }
        .sr-hero-meta-item { display: inline-flex; align-items: center; gap: 4px; white-space: nowrap; }
        .sr-hero-meta-dot { color: ${C.subtle}; flex-shrink: 0; }

        .sr-hero-impact {
          display: inline-flex; align-items: center; gap: 4px;
          font-size: 11px; font-weight: 700; padding: 2px 9px; border-radius: 4px;
          background: rgba(201,168,76,0.12); color: #9a6f1a; margin-top: 4px;
        }
        .sr-hero-impact .ms { font-size: 13px; color: #C9A84C; }

        /* Action buttons — second row, flush right */
        .sr-hero-actions {
          display: flex; align-items: center; justify-content: flex-end;
          gap: 8px; flex-wrap: wrap; margin-top: 14px; direction: ltr;
        }
        .sr-hero-btn {
          display: inline-flex; align-items: center; gap: 6px;
          font-size: 12.5px; font-weight: 600; padding: 8px 14px;
          border-radius: 7px; cursor: pointer; border: 1.5px solid transparent;
          font-family: 'Inter', sans-serif; transition: opacity .15s, background .15s;
          white-space: nowrap; flex-shrink: 0;
        }
        .sr-hero-btn .ms { font-size: 15px; }
        .sr-hero-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .sr-btn-strip  { background: ${C.white}; color: ${C.stripText}; border-color: ${C.border}; }
        .sr-btn-strip:hover  { background: #F2F4F2; }
        .sr-btn-reject { background: ${C.rejectBg}; color: ${C.rejectBtn}; border-color: ${C.rejectBorder}; }
        .sr-btn-reject:hover { background: rgba(186,26,26,0.10); }
        .sr-btn-approve { background: ${C.approveBtn}; color: #fff; border-color: transparent; }
        .sr-btn-approve:hover { background: #0e5443; }
        .sr-hero-actions.has-mode .sr-hero-btn:not(.active-btn) { opacity: 0.35; }

        /* ── Modal ── */
        .sr-modal-overlay {
          position: fixed; inset: 0; background: rgba(15,20,18,0.45);
          display: flex; align-items: center; justify-content: center;
          z-index: 50; padding: 20px;
        }
        .sr-modal {
          background: #fff; border-radius: 12px; width: 100%; max-width: 420px;
          padding: 24px 26px; box-shadow: 0 12px 40px rgba(0,0,0,0.18); direction: ltr;
        }
        .sr-modal-icon { width: 44px; height: 44px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-bottom: 14px; }
        .sr-modal-icon .ms { font-size: 24px; }
        .sr-modal-title { font-size: 16px; font-weight: 700; margin-bottom: 6px; color: ${C.text}; }
        .sr-modal-sub { font-size: 13px; color: ${C.muted}; line-height: 1.55; margin-bottom: 16px; }
        .sr-modal-actions { display: flex; gap: 10px; margin-top: 18px; }
        .sr-modal-btn { flex: 1; font-size: 13px; font-weight: 700; padding: 10px; border-radius: 7px; cursor: pointer; border: none; font-family: 'Inter', sans-serif; }
        .sr-modal-cancel { background: #F2F4F2; color: ${C.muted}; }
        .sr-modal-cancel:hover { background: #E8EAE7; }

        /* ── Main grid ── */
        .sr-grid { display: flex; gap: 20px; align-items: flex-start; }
        .sr-main { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 16px; }
        .sr-sidebar { width: 272px; flex-shrink: 0; display: flex; flex-direction: column; gap: 14px; }

        /* ── Card ── */
        .sr-card { background: ${C.white}; border: 1px solid ${C.border}; border-radius: 10px; padding: 20px 22px; }
        .sr-card-title {
          font-size: 10.5px; font-weight: 700; letter-spacing: 0.1em;
          text-transform: uppercase; color: ${C.muted};
          display: flex; align-items: center; gap: 7px; margin-bottom: 16px;
        }
        .sr-card-title .ms { font-size: 15px; color: ${C.subtle}; }

        /* ── Bio ── */
        .sr-bio { font-size: 13.5px; line-height: 1.85; color: ${C.text}; margin-bottom: 14px; direction: rtl; text-align: right; }
        .sr-bio-meta { font-size: 11.5px; color: ${C.subtle}; display: flex; align-items: center; gap: 10px; }

        /* ── Lineage ── */
        .sr-lineage-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .sr-lineage-col-label { font-size: 10px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: ${C.muted}; margin-bottom: 10px; }
        .sr-person-card { background: ${C.bg}; border: 1px solid ${C.border}; border-radius: 8px; padding: 10px 12px; display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
        .sr-person-avatar { width: 36px; height: 36px; border-radius: 50%; background: rgba(11,67,53,0.08); flex-shrink: 0; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; color: ${C.forest}; border: 1.5px solid rgba(11,67,53,0.12); }
        .sr-person-fields { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 4px; }
        .sr-person-name { font-size: 13px; font-weight: 600; color: ${C.text}; }
        .sr-person-sub  { font-size: 11px; color: ${C.muted}; margin-top: 1px; }

        /* ── Works table ── */
        .sr-works-table { width: 100%; border-collapse: collapse; }
        .sr-works-table thead tr { background: #f3f4f1; border-bottom: 1.5px solid ${C.border}; }
        .sr-works-table th { font-family: 'JetBrains Mono', monospace; padding: 10px 14px; text-align: left; font-size: 9px; color: ${C.muted}; letter-spacing: 0.1em; font-weight: 700; }
        .sr-works-table td { padding: 12px 14px; border-bottom: 1px solid #f0f1ee; font-size: 13px; }
        .sr-works-table tr:last-child td { border-bottom: none; }
        .sr-works-table tr:hover td { background: #f9faf7; }
        .sr-works-title { font-style: italic; font-weight: 600; color: ${C.text}; font-family: 'Source Serif 4', serif; }
        .sr-works-year  { color: ${C.muted}; }
        .sr-format-chip { font-family: 'JetBrains Mono', monospace; font-size: 9px; font-weight: 700; padding: 3px 9px; border-radius: 4px; background: rgba(11,67,53,0.07); color: ${C.primary}; }
        .sr-format-chip.manu { background: #f3f4f1; color: ${C.muted}; }
        .sr-access-link { display: inline-flex; align-items: center; gap: 5px; font-family: 'JetBrains Mono', monospace; font-size: 10px; font-weight: 700; color: ${C.primary}; text-decoration: none; padding: 4px 10px; border: 1.5px solid rgba(11,67,53,0.25); border-radius: 5px; transition: background .12s; }
        .sr-access-link:hover { background: rgba(11,67,53,0.06); }
        .sr-access-link .ms { font-size: 12px; }

        /* ── Media grid ── */
        .sr-media-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .sr-media-card { background: ${C.bg}; border: 1px solid ${C.border}; border-radius: 8px; padding: 12px 14px; display: flex; align-items: flex-start; gap: 10px; direction: ltr; }
        .sr-media-icon { width: 38px; height: 38px; border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .sr-media-icon .ms { font-size: 20px; color: ${C.forest}; }
        .sr-media-body { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 4px; }
        .sr-media-title { font-size: 12.5px; font-weight: 600; color: ${C.text}; margin-bottom: 2px; }
        .sr-media-desc  { font-size: 11px; color: ${C.muted}; line-height: 1.5; margin-bottom: 3px; }
        .sr-media-meta  { font-size: 10px; color: ${C.subtle}; font-family: 'JetBrains Mono', monospace; }
        .sr-media-view-btn {
          display: inline-flex; align-items: center; gap: 5px; margin-top: 6px;
          font-size: 11px; font-weight: 700; color: ${C.primary}; text-decoration: none;
          padding: 5px 10px; border: 1.5px solid rgba(11,67,53,0.25); border-radius: 6px;
          transition: background .12s; align-self: flex-start; white-space: nowrap;
        }
        .sr-media-view-btn:hover { background: rgba(11,67,53,0.07); }
        .sr-media-view-btn .ms { font-size: 14px; }
        .sr-media-link { display: inline-flex; align-items: center; gap: 4px; margin-top: 2px; font-size: 10.5px; font-weight: 700; color: ${C.primary}; text-decoration: none; }
        .sr-media-link .ms { font-size: 12px; }
        .sr-media-link:hover { text-decoration: underline; }

        /* ── References ── */
        .sr-refs { margin: 0; padding: 0 0 0 18px; display: flex; flex-direction: column; gap: 12px; }
        .sr-refs li { font-size: 13px; color: ${C.muted}; line-height: 1.65; font-family: 'Source Serif 4', serif; }
        .sr-refs li span { color: ${C.text}; }

        /* ── Reject textarea ── */
        .sr-textarea { width: 100%; min-height: 80px; border: 1px solid ${C.border}; border-radius: 7px; padding: 10px 12px; font-size: 13px; font-family: 'Inter', sans-serif; color: ${C.text}; resize: vertical; box-sizing: border-box; background: ${C.bg}; }
        .sr-textarea:focus { outline: none; border-color: ${C.forest}; }

        /* ── Sidebar ── */
        .sr-side-card { background: ${C.white}; border: 1px solid ${C.border}; border-radius: 10px; padding: 18px 18px 12px; }
        .sr-side-title { font-size: 10px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: ${C.subtle}; margin-bottom: 14px; }
        .sr-vital-table { width: 100%; border-collapse: collapse; font-size: 12.5px; }
        .sr-vital-table td { padding: 6px 0; border-bottom: 1px solid #F0F1EE; vertical-align: top; }
        .sr-vital-table td:first-child { color: ${C.muted}; width: 38%; }
        .sr-vital-table td:last-child { font-weight: 600; color: ${C.text}; text-align: right; }
        .sr-vital-table tr:last-child td { border-bottom: none; }
        .sr-vital-input { width: 100%; text-align: right; border: 1.5px dashed ${C.editBorder}; border-radius: 5px; padding: 4px 7px; font-family: inherit; font-size: 12.5px; font-weight: 600; color: ${C.text}; background: rgba(201,168,76,0.06); box-sizing: border-box; }
        .sr-vital-input:focus { outline: none; border-color: ${C.editBtn}; border-style: solid; }

        /* ── Expertise chips ── */
        .sr-expertise-chips { display: flex; flex-wrap: wrap; gap: 7px; margin-bottom: 8px; }
        .sr-chip-base { display: inline-flex; align-items: center; gap: 5px; font-size: 12px; font-weight: 600; padding: 5px 10px; border-radius: 20px; border: 1.5px solid; white-space: nowrap; }
        .sr-chip-existing  { background: ${C.existingChipBg}; border-color: ${C.existingChipBorder}; color: ${C.existingChipText}; }
        .sr-chip-new-pending { background: ${C.newChipBg}; border-color: ${C.newChipBg}; color: ${C.newChipText}; padding: 5px 6px 5px 11px; }
        .sr-chip-kept      { background: ${C.keptChipBg}; border-color: ${C.keptChipBorder}; color: ${C.keptChipText}; }
        .sr-chip-removed   { background: ${C.removedChipBg}; border-color: ${C.removedChipBorder}; color: ${C.removedChipText}; text-decoration: line-through; opacity: 0.65; }
        .sr-chip-btn { background: none; border: none; cursor: pointer; padding: 1px; display: inline-flex; align-items: center; border-radius: 50%; transition: background .12s; font-family: 'Material Symbols Outlined'; font-style: normal; font-size: 15px; line-height: 1; user-select: none; color: rgba(255,255,255,0.85); }
        .sr-chip-btn:hover { background: rgba(255,255,255,0.15); }
        .sr-chip-btn.remove { color: rgba(255,255,255,0.7); }
        .sr-chip-btn.remove:hover { background: rgba(255,0,0,0.2); color: #fff; }
        .sr-chip-confirm { display: inline-flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 600; padding: 4px 10px; border-radius: 20px; background: rgba(201,168,76,0.15); border: 1.5px solid rgba(201,168,76,0.45); color: #9a7d30; white-space: nowrap; }
        .sr-chip-confirm-yes { font-size: 11px; font-weight: 700; color: ${C.primary}; background: rgba(11,67,53,0.08); border: 1px solid rgba(11,67,53,0.2); border-radius: 4px; padding: 1px 7px; cursor: pointer; font-family: 'Inter', sans-serif; }
        .sr-chip-confirm-yes:hover { background: rgba(11,67,53,0.15); }
        .sr-chip-confirm-no { font-size: 11px; font-weight: 600; color: ${C.muted}; background: none; border: none; cursor: pointer; font-family: 'Inter', sans-serif; padding: 1px 4px; }
        .sr-chip-confirm-no:hover { color: ${C.text}; }
        .sr-chip-undo { font-size: 10px; font-weight: 700; color: ${C.muted}; background: none; border: none; cursor: pointer; font-family: 'Inter', sans-serif; margin-left: 4px; text-decoration: underline; }
        .sr-expertise-summary { font-size: 11px; color: ${C.muted}; margin-bottom: 10px; display: flex; align-items: center; gap: 5px; flex-wrap: wrap; }
        .sr-expertise-summary b { color: ${C.text}; }

        /* ── Submitter note ── */
        .sr-submitter-note { background: ${C.primary}; border-radius: 8px; padding: 14px 16px; }
        .sr-submitter-note-title { font-size: 10px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: rgba(255,255,255,0.55); margin-bottom: 8px; display: flex; align-items: center; gap: 6px; }
        .sr-submitter-note-title .ms { font-size: 14px; color: ${C.gold}; }
        .sr-submitter-note-text { font-size: 12px; line-height: 1.7; color: rgba(255,255,255,0.85); font-style: italic; }

        @media (max-width: 860px) {
          .sr-grid { flex-direction: column; }
          .sr-sidebar { width: 100%; }
          .sr-lineage-grid { grid-template-columns: 1fr; }
          .sr-media-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="sr-wrap">

        {/* Breadcrumbs */}
        <div className="sr-crumbs">
          <a href="/admin">{t("navbar.dashboard")}</a>
          <span className="ms">chevron_right</span>
          <a href="/admin/pending/scholars">{t("scholars.newScholars.title")}</a>
          <span className="ms">chevron_right</span>
          <b>{scholar.fullName}</b>
        </div>

        {/* Edit bar */}
        {isEditing && (
          <div className="sr-editbar">
            <div className="sr-editbar-label">
              <span className="ms">edit_note</span>
              {t("scholarReview.editBar.label")}
            </div>
            <div className="sr-editbar-actions">
              <button className="sr-editbar-btn sr-editbar-cancel" onClick={cancelEditing}>{t("scholarReview.editBar.cancel")}</button>
              <button className="sr-editbar-btn sr-editbar-confirm" onClick={saveEditing}>{t("scholarReview.editBar.confirm")}</button>
            </div>
          </div>
        )}

        {/* ── Hero card ── */}
        <div className="sr-hero">

          {/* Row 1: avatar + info */}
          <div className="sr-hero-top">
            <div className="sr-avatar-initials">{scholar.submitterAvatar}</div>
            <div className="sr-hero-info">

              {/* Name line */}
              <div className="sr-hero-name">
                {isEditing ? (
                  <input
                    className="sr-inline-input"
                    style={{ maxWidth: 220, fontWeight: 700, fontSize: 17 }}
                    value={scholar.fullName}
                    onChange={(e) => updateField("fullName", e.target.value)}
                  />
                ) : (
                  <span className="sr-hero-name-latin">{scholar.fullName}</span>
                )}
                {isEditing ? (
                  <input
                    className="sr-inline-input"
                    style={{ maxWidth: 180, direction: "rtl", fontWeight: 400, color: C.muted, fontSize: 15 }}
                    value={scholar.fullNameAr}
                    onChange={(e) => updateField("fullNameAr", e.target.value)}
                  />
                ) : (
                  <span className="sr-hero-name-ar">· {scholar.fullNameAr}</span>
                )}
                <span className="sr-badge-new">NEW SUBMISSION</span>
              </div>

              {/* Meta line — each segment wrapped to prevent individual word wrapping */}
              <div className="sr-hero-meta">
                <span className="sr-hero-meta-item">
                  <span className="ms">person</span>
                  Submitter: <strong>{scholar.submittedBy}</strong>
                </span>
                <span className="sr-hero-meta-dot">·</span>
                <span className="sr-hero-meta-item">
                  <span className="ms">calendar_today</span>
                  {scholar.date}
                </span>
                <span className="sr-hero-meta-dot">·</span>
                <span className="sr-hero-meta-item">
                  <span className="ms">translate</span>
                  {langLabel}
                </span>
              </div>

             
            </div>
          </div>

          {/* Row 2: action buttons */}
          <div className={`sr-hero-actions${mode ? " has-mode" : ""}`}>
            {!isEditing && (
              <button className="sr-edit-toggle" onClick={startEditing}>
                <span className="ms">edit</span>
                {t("scholarReview.actions.editPage")}
              </button>
            )}
            <button
              className={`sr-hero-btn sr-btn-strip${mode === "strip" ? " active-btn" : ""}`}
              disabled={isEditing}
              onClick={() => setMode(mode === "strip" ? null : "strip")}
            >
              <span className="ms">person_remove</span>
              {t("scholars.actions.strip")}
            </button>
            <button
              className={`sr-hero-btn sr-btn-reject${mode === "reject" ? " active-btn" : ""}`}
              disabled={isEditing}
              onClick={() => setMode(mode === "reject" ? null : "reject")}
            >
              <span className="ms">cancel</span>
              {t("scholarReview.actions.reject")}
            </button>
            <button
              className={`sr-hero-btn sr-btn-approve${mode === "approve" ? " active-btn" : ""}`}
              disabled={isEditing}
              onClick={() => setMode(mode === "approve" ? null : "approve")}
            >
              <span className="ms">check_circle</span>
              {t("scholarReview.actions.approve")}
            </button>
          </div>
        </div>

        {/* Confirmation modal */}
        {mode && (
          <div className="sr-modal-overlay" onClick={() => { setMode(null); setNote(""); }}>
            <div className="sr-modal" onClick={(e) => e.stopPropagation()}>
              <div className="sr-modal-icon" style={{ background: mode === "approve" ? "rgba(11,67,53,0.1)" : "rgba(186,26,26,0.08)" }}>
                <span className="ms" style={{ color: mode === "approve" ? C.primary : C.rejectBtn }}>
                  {mode === "approve" ? "check_circle" : mode === "reject" ? "cancel" : "person_remove"}
                </span>
              </div>
              <div className="sr-modal-title">
                {mode === "approve" && t("scholarReview.modal.approveTitle")}
                {mode === "reject"  && t("scholarReview.modal.rejectTitle")}
                {mode === "strip"   && t("scholarReview.modal.stripTitle")}
              </div>
              <div className="sr-modal-sub">
                {mode === "approve" && <>{t("scholarReview.modal.approveSub").replace("{name}", scholar.fullName)}{newPendingCount > 0 && ` ${newPendingCount} ${t("scholarReview.modal.unreviewed")}`}</>}
                {mode === "reject"  && t("scholarReview.modal.rejectSub")}
                {mode === "strip"   && <>{t("scholarReview.modal.stripSub").replace("{name}", scholar.submittedBy)}</>}
              </div>
              {mode === "reject" && (
                <textarea className="sr-textarea" placeholder={t("scholarReview.modal.rejectPlaceholder")} value={note} onChange={(e) => setNote(e.target.value)} style={{ minHeight: 90 }} />
              )}
              <div className="sr-modal-actions">
                <button className="sr-modal-btn sr-modal-cancel" onClick={() => { setMode(null); setNote(""); }}>{t("scholars.review.cancel")}</button>
                <button className="sr-modal-btn" style={{ background: mode === "approve" ? C.approveBtn : C.rejectBtn, color: "#fff" }} onClick={handleConfirm}>
                  {mode === "approve" ? t("scholarReview.modal.confirmApprove") : mode === "reject" ? (note.trim() ? t("scholarReview.modal.confirmSendReject") : t("scholarReview.modal.confirmReject")) : t("scholarReview.modal.confirmStrip")}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main grid */}
        <div className="sr-grid">
          <div className="sr-main">

            {/* Biography */}
            <div className="sr-card">
              <div className="sr-card-title"><span className="ms">auto_stories</span>{t("scholarReview.sections.biography")}</div>
              {isEditing
                ? <textarea className="sr-inline-textarea" value={scholar.bio} onChange={(e) => updateField("bio", e.target.value)} />
                : <p className="sr-bio">{scholar.bio}</p>}
              <div className="sr-bio-meta" style={{ marginTop: 14 }}>
                <span className="ms" style={{ fontSize: 14 }}>text_fields</span>
                {t("scholarReview.bio.wordCount").replace("{n}", String(scholar.wordCount))}
                <span style={{ color: C.border }}>·</span>
                <span className="ms" style={{ fontSize: 14 }}>schedule</span>
                {t("scholarReview.bio.readingTime").replace("{n}", String(scholar.readingTime))}
              </div>
            </div>

            {/* Lineage */}
            <div className="sr-card">
              <div className="sr-card-title"><span className="ms">account_tree</span>{t("scholarReview.sections.lineage")}</div>
              <div className="sr-lineage-grid">
                {(["teachers", "disciples"] as const).map((listKey) => (
                  <div key={listKey}>
                    <div className="sr-lineage-col-label">
                      {listKey === "teachers" ? t("scholarReview.lineage.teachers") : t("scholarReview.lineage.disciples")}
                    </div>
                    {scholar[listKey].map((p) => (
                      <div key={p.id} className="sr-person-card">
                        <div className="sr-person-avatar">{p.name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)}</div>
                        {isEditing ? (
                          <div className="sr-person-fields">
                            <input className="sr-inline-input" value={p.name} onChange={(e) => updateTeacher(listKey, p.id, "name", e.target.value)} />
                            <input className="sr-inline-input" style={{ fontSize: 11, color: C.muted }} value={p.subtitle} onChange={(e) => updateTeacher(listKey, p.id, "subtitle", e.target.value)} />
                          </div>
                        ) : (
                          <div><div className="sr-person-name">{p.name}</div><div className="sr-person-sub">{p.subtitle}</div></div>
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            {/* Bibliography */}
            <div className="sr-card">
              <div className="sr-card-title"><span className="ms">menu_book</span>{t("scholarReview.sections.bibliography")}</div>
              <div style={{ border: `1px solid ${C.border}`, borderRadius: 8, overflow: "hidden" }}>
                <table className="sr-works-table">
                  <thead>
                    <tr>
                      <th>{t("scholarReview.works.title")}</th>
                      <th>{t("scholarReview.works.year")}</th>
                      <th>{t("scholarReview.works.format")}</th>
                      <th>{t("scholarReview.works.access")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scholar.works.map((w) => (
                      <tr key={w.id}>
                        <td className="sr-works-title">
                          {isEditing
                            ? <input className="sr-inline-input" style={{ fontStyle: "italic", fontWeight: 600, fontFamily: "'Source Serif 4', serif" }} value={w.title} onChange={(e) => updateWork(w.id, "title", e.target.value)} />
                            : w.title}
                        </td>
                        <td className="sr-works-year">
                          {isEditing
                            ? <input className="sr-inline-input" style={{ maxWidth: 70 }} value={w.year} onChange={(e) => updateWork(w.id, "year", e.target.value)} />
                            : w.year}
                        </td>
                        <td><span className={`sr-format-chip${w.format !== "BOOK" ? " manu" : ""}`}>{w.format}</span></td>
                        <td>
  {w.access
    ? <a href={w.access} target="_blank" rel="noopener noreferrer" className="sr-access-link">
        <span className="ms">open_in_new</span>
        {t("scholarReview.works.viewPdf")}
      </a>
    : <span style={{ fontSize: 13, color: C.subtle }}>—</span>}
</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Media */}
            <div className="sr-card">
              <div className="sr-card-title"><span className="ms">folder_open</span>{t("scholarReview.sections.media")}</div>
              <div className="sr-media-grid">
                {scholar.media.map((m) => {
                  const vi = getMediaViewInfo(m);
                  const btnLabel = t(vi.tKey);
                  return (
                    <div key={m.id} className="sr-media-card">
                      <div className="sr-media-icon" style={{ background: m.color }}>
                        <span className="ms">{m.icon}</span>
                      </div>
                      {isEditing ? (
                        <div className="sr-media-body">
                          <input className="sr-inline-input" style={{ fontWeight: 600, fontSize: 12.5 }} value={m.title} onChange={(e) => updateMedia(m.id, "title", e.target.value)} />
                          <input className="sr-inline-input" style={{ fontSize: 11, color: C.muted }} value={m.description} onChange={(e) => updateMedia(m.id, "description", e.target.value)} />
                          {m.access && (
                            <a href={m.access} target="_blank" rel="noopener noreferrer" className="sr-media-link">
                              <span className="ms">{vi.icon}</span>{btnLabel}
                            </a>
                          )}
                        </div>
                      ) : (
                        <div className="sr-media-body">
                          <div className="sr-media-title">{m.title}</div>
                          <div className="sr-media-desc">{m.description}</div>
                          <div className="sr-media-meta">{m.meta} · {m.type}</div>
                          {m.access && (
                            <a href={m.access} target="_blank" rel="noopener noreferrer" className="sr-media-view-btn">
                              <span className="ms">{vi.icon}</span>{btnLabel}
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* References */}
            <div className="sr-card">
              <div className="sr-card-title"><span className="ms">format_quote</span>{t("scholarReview.sections.references")}</div>
              <ol className="sr-refs">
                {scholar.references.map((r) => <li key={r.id}><span>{r.text}</span></li>)}
              </ol>
            </div>

          </div>

          {/* ── Sidebar ── */}
          <div className="sr-sidebar">

            {/* Vital Stats */}
            <div className="sr-side-card">
              <div className="sr-side-title">{t("scholarReview.sidebar.vitalStats")}</div>
              <table className="sr-vital-table">
                <tbody>
                  {(
                    [
                      ["name",       scholar.fullName,   "fullName"],
                      ["region",     scholar.region,     "region"],
                      ["century",    scholar.century,    "century"],
                      ["discipline", scholar.discipline, "discipline"],
                    ] as [string, string, keyof ScholarDetail][]
                  ).map(([labelKey, val, field]) => (
                    <tr key={field}>
                      <td>{t(`scholarReview.sidebar.${labelKey}`)}</td>
                      <td>{isEditing ? <input className="sr-vital-input" value={val} onChange={(e) => updateField(field, e.target.value)} /> : val}</td>
                    </tr>
                  ))}
                  <tr>
                    <td>{t("scholarReview.sidebar.born")}</td>
                    <td>
                      {isEditing ? (
                        <div style={{ display: "flex", gap: 4 }}>
                          <input className="sr-vital-input" style={{ maxWidth: 60 }} value={scholar.birthYear}  onChange={(e) => updateField("birthYear",  e.target.value)} />
                          <input className="sr-vital-input"                          value={scholar.birthPlace} onChange={(e) => updateField("birthPlace", e.target.value)} />
                        </div>
                      ) : `${scholar.birthYear}, ${scholar.birthPlace}`}
                    </td>
                  </tr>
                  <tr>
                    <td>{t("scholarReview.sidebar.died")}</td>
                    <td>
                      {isEditing ? (
                        <div style={{ display: "flex", gap: 4 }}>
                          <input className="sr-vital-input" style={{ maxWidth: 60 }} value={scholar.deathYear}  onChange={(e) => updateField("deathYear",  e.target.value)} />
                          <input className="sr-vital-input"                          value={scholar.deathPlace} onChange={(e) => updateField("deathPlace", e.target.value)} />
                        </div>
                      ) : `${scholar.deathYear}, ${scholar.deathPlace}`}
                    </td>
                  </tr>
                  <tr>
                    <td>{t("scholarReview.sidebar.lifespan")}</td>
                    <td style={{ fontSize: 11, fontWeight: 500, color: C.muted }}>
                      {isEditing
                        ? <input className="sr-vital-input" style={{ fontSize: 11, fontWeight: 500 }} value={scholar.lifespan} onChange={(e) => updateField("lifespan", e.target.value)} />
                        : scholar.lifespan}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Expertise Clusters */}
            <div className="sr-side-card">
              <div className="sr-side-title">{t("scholarReview.sidebar.expertiseClusters")}</div>
              {(newKeptCount > 0 || newRemovedCount > 0 || newPendingCount > 0) && (
                <div className="sr-expertise-summary">
                  {newKeptCount    > 0 && <><b style={{ color: C.primary  }}>{newKeptCount}</b>    {t("scholarReview.chips.kept")}</>}
                  {newRemovedCount > 0 && <><b style={{ color: C.rejectBtn }}>{newRemovedCount}</b> {t("scholarReview.chips.removed")}</>}
                  {newPendingCount > 0 && <><b>{newPendingCount}</b> {t("scholarReview.chips.pending")}</>}
                </div>
              )}
              <div className="sr-expertise-chips">
                {disciplineTags.map((d) => {
                  if (!d.isNew) return <span key={d.id} className="sr-chip-base sr-chip-existing">{d.label}</span>;
                  if (confirmingId === d.id) return (
                    <span key={d.id} className="sr-chip-confirm">
                      <span className="ms" style={{ fontSize: 13, color: C.gold }}>help</span>
                      {t("scholarReview.chips.keepPrompt").replace("{label}", d.label)}
                      <button className="sr-chip-confirm-yes" onClick={() => confirmKeep(d.id)}>{t("scholarReview.chips.yesAdd")}</button>
                      <button className="sr-chip-confirm-no"  onClick={cancelKeep}>{t("scholars.review.cancel")}</button>
                    </span>
                  );
                  if (d.status === "new_kept") return (
                    <span key={d.id} className="sr-chip-base sr-chip-kept">
                      <span className="ms" style={{ fontSize: 13 }}>check</span>{d.label}
                    </span>
                  );
                  if (d.status === "new_removed") return (
                    <span key={d.id} style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
                      <span className="sr-chip-base sr-chip-removed">{d.label}</span>
                      <button className="sr-chip-undo" onClick={() => undoRemove(d.id)}>{t("scholarReview.chips.undo")}</button>
                    </span>
                  );
                  return (
                    <span key={d.id} className="sr-chip-base sr-chip-new-pending">
                      <span className="ms" style={{ fontSize: 13, color: C.gold, marginRight: 2 }}>add</span>
                      {d.label}
                      <span style={{ display: "inline-flex", gap: 2, marginLeft: 4 }}>
                        <button className="sr-chip-btn"        title={t("scholarReview.chips.keepTitle")}   onClick={() => keepNewDiscipline(d.id)}>check</button>
                        <button className="sr-chip-btn remove" title={t("scholarReview.chips.removeTitle")} onClick={() => removeNewDiscipline(d.id)}>close</button>
                      </span>
                    </span>
                  );
                })}
              </div>
              <div style={{ fontSize: 11, color: C.subtle, marginTop: 6, lineHeight: 1.5 }}>
                <span style={{ color: C.gold, fontWeight: 700 }}>+</span> {t("scholarReview.chips.hint")}
              </div>
            </div>

            {/* Submitter Note */}
            <div className="sr-submitter-note">
              <div className="sr-submitter-note-title">
                <span className="ms">format_quote</span>
                {t("scholarReview.sidebar.submitterNote")}
              </div>
              <div className="sr-submitter-note-text">{scholar.submitterNote}</div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
