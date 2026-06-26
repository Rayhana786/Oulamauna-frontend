import { useState, useMemo } from "react";
import { useLang } from "../../context/LanguageContext";

/* ─────────────────────── Types ─────────────────────── */
type MediaType = "PDF" | "AUDIO" | "VIDEO";
type SourceType = "link" | "upload";
type SortOption = "newest" | "oldest" | "title";

interface PendingMedia {
  id: string;
  title: string;
  description: string;
  type: MediaType;
  sourceType: SourceType;
  sourceUrl?: string;
  fileName?: string;
  fileSize?: string;
  scholarName: string;
  scholarId: string;
  submittedBy: string;
  contributorId: string;
  date: string;
  submittedAt: Date;
  flagged: boolean;
  flagReason?: string;
  previewUrl?: string;
  stripped?: boolean;
}

/* ─────────────────────── Mock data ─────────────────────── */
const MEDIA: PendingMedia[] = [
  {
    id: "med_001",
    title: "1972 Lecture on Colonizability",
    description: "Recorded lecture given at the University of Algiers.",
    type: "AUDIO",
    sourceType: "upload",
    fileName: "lecture-1972-colonizability.mp3",
    fileSize: "38.2 MB",
    scholarName: "Malek Bennabi",
    scholarId: "sch_001",
    submittedBy: "Zaid Al-Hassan",
    contributorId: "user_zaid",
    date: "June 18, 2026",
    submittedAt: new Date("2026-06-18"),
    flagged: false,
    previewUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
  },
  {
    id: "med_002",
    title: "Original Manuscript — Question of Culture",
    description: "",
    type: "PDF",
    sourceType: "upload",
    fileName: "question-of-culture-ms.pdf",
    fileSize: "112 MB",
    scholarName: "Malek Bennabi",
    scholarId: "sch_001",
    submittedBy: "Zaid Al-Hassan",
    contributorId: "user_zaid",
    date: "June 17, 2026",
    submittedAt: new Date("2026-06-17"),
    flagged: true,
    flagReason: "Missing description",
    previewUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf"
  },
  {
    id: "med_003",
    title: "Cairo Seminar, 1965",
    description: "Audio recording of a public seminar at Al-Azhar University.",
    type: "AUDIO",
    sourceType: "link",
    sourceUrl: "https://archive.org/details/example-cairo-seminar",
    scholarName: "Malek Bennabi",
    scholarId: "sch_001",
    submittedBy: "Karim Mansouri",
    contributorId: "user_karim",
    date: "June 15, 2026",
    submittedAt: new Date("2026-06-15"),
    flagged: false,
    previewUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3"
  },
  {
    id: "med_004",
    title: "Documentary — The Idea and Thought",
    description: "Documentary series exploring the scholar's intellectual legacy.",
    type: "VIDEO",
    sourceType: "link",
    sourceUrl: "https://broken-host-example.tv/idea-and-thought",
    scholarName: "Ibn al-Haytham",
    scholarId: "sch_002",
    submittedBy: "Sara Al-Rashid",
    contributorId: "user_sara",
    date: "June 13, 2026",
    submittedAt: new Date("2026-06-13"),
    flagged: true,
    flagReason: "Link unreachable",
    previewUrl: "https://www.w3schools.com/html/mov_bbb.mp4"
  },
  {
    id: "med_005",
    title: "Portrait Collection (1960s)",
    description: "Photographic archive donated by the family.",
    type: "PDF",
    sourceType: "upload",
    fileName: "portraits-1960s.pdf",
    fileSize: "24.5 MB",
    scholarName: "Fatima al-Fihriya",
    scholarId: "sch_003",
    submittedBy: "Pedro Alves",
    contributorId: "user_pedro",
    date: "June 11, 2026",
    submittedAt: new Date("2026-06-11"),
    flagged: false,
    previewUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf"
  },
  {
    id: "med_006",
    title: "Interview on Astronomy and Faith",
    description: "Audio interview recorded for a regional radio program.",
    type: "AUDIO",
    sourceType: "link",
    sourceUrl: "https://archive.org/details/example-astronomy-faith",
    scholarName: "Maryam al-Asturlabiya",
    scholarId: "sch_004",
    submittedBy: "Karim Mansouri",
    contributorId: "user_karim",
    date: "June 9, 2026",
    submittedAt: new Date("2026-06-09"),
    flagged: true,
    flagReason: "Overdue 4 days",
    previewUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3"
  },
  {
    id: "med_007",
    title: "Surgical Technique Demonstration (Recreated)",
    description: "Short documentary recreating historical surgical methods.",
    type: "VIDEO",
    sourceType: "upload",
    fileName: "surgical-technique-demo.mp4",
    fileSize: "340 MB",
    scholarName: "Al-Zahrawi",
    scholarId: "sch_005",
    submittedBy: "Pedro Alves",
    contributorId: "user_pedro",
    date: "June 8, 2026",
    submittedAt: new Date("2026-06-08"),
    flagged: false,
    previewUrl: "https://www.w3schools.com/html/mov_bbb.mp4"
  },
];

/* ─────────────────────── Colors ─────────────────────── */
const C = {
  pageBg: "#f9faf7",
  cardBg: "#f3f4f1",
  white: "#ffffff",
  tableSectionBg: "#f3f4f1",
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
  defaultIconBg: "rgba(11,67,53,0.10)",
  overdueIconBg: "#fce8e8",
  timeIconBg: "#e8e9e6",
  avatarBg: "#fed65b",
  avatarText: "#3a2c00",
};

const TYPE_META: Record<MediaType, { icon: string; color: string }> = {
  PDF:   { icon: "picture_as_pdf", color: "rgba(11,67,53,0.10)" },
  AUDIO: { icon: "headphones",     color: "rgba(254,214,91,0.22)" },
  VIDEO: { icon: "movie",          color: "rgba(74,127,203,0.14)" },
};

/* ─────────────────────── Stats helper ─────────────────────── */
function getStats(rows: PendingMedia[]) {
  const total = rows.length;
  const priority = rows.filter((r) => r.flagged).length;
  return { total, priority, avgTime: "1h 40m" };
}

/* ─────────────────────── Component ─────────────────────── */
export default function MediaPendingQueue() {
  const { t, lang } = useLang();
  const isRTL = lang === "AR";

  const [filterType, setFilterType] = useState<MediaType | "all">("all");
  const [filterScholar, setFilterScholar] = useState<string>("all");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [stripedRows, setStripedRows] = useState<boolean>(true);
  
  const [rows, setRows] = useState<PendingMedia[]>(MEDIA);
  
  const [reviewTarget, setReviewTarget] = useState<PendingMedia | null>(null);
  const [checks, setChecks] = useState({
    accessible: false,
    matches: false,
    legal: false,
    guidelines: false,
  });
  const [reviewNotes, setReviewNotes] = useState("");
  const [approvalError, setApprovalError] = useState("");

  const [rejectTarget, setRejectTarget] = useState<PendingMedia | null>(null);
  const [rejectNote, setRejectNote] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<PendingMedia | null>(null);
  const [deleteNote, setDeleteNote] = useState("");
    const [stripTarget, setStripTarget] = useState<PendingMedia | null>(null);

  const stats = getStats(rows);

  const scholars = useMemo(() => {
    const unique = [...new Set(rows.map((r) => r.scholarName))];
    return unique.sort();
  }, [rows]);

  const filtered = useMemo(() => {
    let result = [...rows];
    if (filterType !== "all") result = result.filter((m) => m.type === filterType);
    if (filterScholar !== "all") result = result.filter((m) => m.scholarName === filterScholar);
    result.sort((a, b) => {
      switch (sortBy) {
        case "newest": return b.submittedAt.getTime() - a.submittedAt.getTime();
        case "oldest": return a.submittedAt.getTime() - b.submittedAt.getTime();
        case "title":  return a.title.localeCompare(b.title);
        default:       return 0;
      }
    });
    return result;
  }, [rows, filterType, filterScholar, sortBy]);

  const clearFilters = () => { setFilterType("all"); setFilterScholar("all"); setSortBy("newest"); };
  const hasActiveFilters = filterType !== "all" || filterScholar !== "all";

  const openReview = (m: PendingMedia) => {
    setReviewTarget(m);
    setChecks({ accessible: false, matches: false, legal: false, guidelines: false });
    setReviewNotes("");
    setApprovalError("");
  };

  const closeReview = () => {
    setReviewTarget(null);
    setApprovalError("");
  };

  const handleApprove = (id: string) => {
    console.log("Quick Approved media:", id);
    setRows(prev => prev.filter(m => m.id !== id));
  };

  const handleApproveFromReview = () => {
    const allChecked = Object.values(checks).every(v => v);
    if (!allChecked) {
      setApprovalError(t("mediaQueue.review.errorChecks")); // <-- UPDATED
      return;
    }
    if (!reviewTarget) return;
    
    console.log("Approved media:", reviewTarget.id, "Notes:", reviewNotes);
    setRows(prev => prev.filter(m => m.id !== reviewTarget.id));
    closeReview();
  };

  const handleRejectFromReview = () => {
    if (!reviewTarget) return;
    if (!reviewNotes.trim()) {
       setApprovalError(t("mediaQueue.review.errorReject"));
       return;
    }
    
    console.log("Rejected media:", reviewTarget.id, "Notes:", reviewNotes);
    setRows(prev => prev.filter(m => m.id !== reviewTarget.id));
    closeReview();
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    console.log("Deleted media:", deleteTarget.id, "note:", deleteNote);
    setRows(prev => prev.filter(m => m.id !== deleteTarget.id));
    setDeleteTarget(null);
    setDeleteNote("");
    if (reviewTarget?.id === deleteTarget.id) closeReview();
  };

  const confirmReject = () => { 
    if (!rejectTarget) return; 
    console.log("Rejected media:", rejectTarget.id, "note:", rejectNote); 
    setRows(prev => prev.filter(m => m.id !== rejectTarget.id));
    setRejectTarget(null); 
    setRejectNote(""); 
  };
  const confirmStrip = () => {
    if (!stripTarget) return;
    setRows((prev) =>
      prev.map((row) =>
        row.id === stripTarget.id
          ? { ...row, submittedBy: "System (stripped)", contributorId: "system", stripped: true }
          : row
      )
    );
    console.log(`Stripped contributor from media "${stripTarget.title}"`);
    setStripTarget(null);
  };
  const renderMedia = () => {
    if (!reviewTarget) return null;
    if (!reviewTarget.previewUrl) {
      return (
        <div className="mvq-media-placeholder">
          <span className="ms">broken_image</span>
          <p>Preview not available for this uploaded file. Please download the file to review its contents.</p>
        </div>
      );
    }
    
    switch (reviewTarget.type) {
      case "PDF":
        return <iframe src={reviewTarget.previewUrl} title="PDF Preview" />;
      case "AUDIO":
        return <audio controls src={reviewTarget.previewUrl} />;
      case "VIDEO":
        return <video controls src={reviewTarget.previewUrl} />;
      default:
        return <div className="mvq-media-placeholder"><span className="ms">error</span><p>Unsupported media type.</p></div>;
    }
  };

  return (
    <div
      dir={isRTL ? "rtl" : "ltr"}
      style={{ fontFamily: "'Inter', sans-serif", color: C.text, background: C.pageBg, minHeight: "100vh" }}
    >
      <style>{`
        .mvq-wrap { padding: 40px; max-width: 1400px; margin: 0 auto; }

        .mvq-header { margin-bottom: 32px; }
        .mvq-header h2 { font-size: 32px; font-weight: 700; color: ${C.primary}; margin-bottom: 8px; }
        .mvq-subtitle { font-size: 14px; color: ${C.muted}; max-width: 800px; line-height: 1.6; }

        .mvq-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin-bottom: 20px; }
        .mvq-stat-card {
          background: ${C.cardBg}; border: 1px solid ${C.border}; border-radius: 12px;
          padding: 22px 20px; min-height: 90px; display: flex; align-items: center; gap: 14px;
          overflow: hidden; transition: transform 0.15s, box-shadow 0.15s;
        }
        .mvq-stat-card:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(11,67,53,0.08); }
        .mvq-stat-icon { width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .mvq-stat-icon .ms { font-size: 22px; }
        .mvq-stat-icon.default { background: ${C.defaultIconBg}; color: ${C.primary}; }
        .mvq-stat-icon.priority { background: ${C.overdueIconBg}; color: ${C.rejectText}; }
        .mvq-stat-icon.time { background: ${C.timeIconBg}; color: ${C.primary}; }
        .mvq-stat-content { display: flex; flex-direction: column; gap: 5px; min-width: 0; }
        .mvq-stat-label { font-size: 10px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: ${C.subtle}; line-height: 1.3; }
        .mvq-stat-value { font-size: 28px; font-weight: 800; color: ${C.primary}; line-height: 1; letter-spacing: -0.02em; white-space: nowrap; }
        .mvq-stat-card.priority .mvq-stat-value { color: ${C.rejectText}; }

        .mvq-filters { background: ${C.cardBg}; border: 1px solid ${C.border}; border-radius: 10px; padding: 16px 20px; margin-bottom: 20px; }
        .mvq-filters-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
        .mvq-filters-title { font-size: 13px; font-weight: 700; color: ${C.primary}; display: flex; align-items: center; gap: 6px; }
        .mvq-filters-title .ms { font-size: 16px; }
        .mvq-clear-link { font-size: 11px; font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase; color: ${C.rejectText}; background: none; border: none; cursor: pointer; padding: 0; }
        .mvq-clear-link:hover { text-decoration: underline; }
        .mvq-filters-row { display: flex; gap: 20px; align-items: flex-start; flex-wrap: wrap; }
        .mvq-filter-group { display: flex; flex-direction: column; gap: 5px; }
        .mvq-filter-label { font-size: 10px; font-weight: 700; color: ${C.subtle}; text-transform: uppercase; letter-spacing: 0.06em; }
        .mvq-filter-select {
          padding: 10px 12px; border: 1px solid ${C.border}; border-radius: 8px; font-size: 13.5px;
          background: ${C.white}; color: ${C.text}; cursor: pointer; outline: none; transition: border-color 0.2s;
          min-width: 170px; height: 42px; font-family: 'Inter', sans-serif;
        }
        .mvq-filter-select:hover { border-color: ${C.primary}; }
        .mvq-filter-select:focus { border-color: ${C.primary}; box-shadow: 0 0 0 3px rgba(11,67,53,0.1); }

        .mvq-table-card { background: ${C.tableSectionBg}; border: 1px solid ${C.border}; border-radius: 12px; overflow: hidden; }
        .mvq-table-header { padding: 16px 24px; border-bottom: 1px solid ${C.border}; display: flex; justify-content: space-between; align-items: center; background: ${C.tableSectionBg}; }
        .mvq-table-title { font-size: 16px; font-weight: 600; color: ${C.primary}; display: flex; align-items: center; gap: 8px; }
        .mvq-table-title .ms { font-size: 20px; }
        .mvq-updated-badge { font-size: 12px; padding: 5px 14px; background: ${C.cardBg}; color: ${C.subtle}; border-radius: 99px; font-weight: 600; border: 1px solid ${C.border}; }
        .mvq-table-scroll { overflow-x: auto; }

        .mvq-stripe-btn {
          display: flex; align-items: center; justify-content: center;
          width: 28px; height: 28px;
          border-radius: 6px; cursor: pointer;
          border: 1.5px solid ${C.border}; background: ${C.white};
          transition: all 0.18s; flex-shrink: 0;
        }
        .mvq-stripe-btn:hover { border-color: ${C.primary}; color: ${C.primary}; background: ${C.cardBg}; }
        .mvq-stripe-btn.active {
          background: ${C.activeBg}; border-color: ${C.primary}; color: ${C.primary};
        }
        .mvq-stripe-btn .ms { font-size: 16px; }

        table.mvq-table.striped tbody tr:nth-child(even) td {
          background: ${C.cardBg} !important;
        }
        table.mvq-table.striped tbody tr:hover td {
          background: rgba(11,67,53,0.06) !important;
        }

        table.mvq-table { width: 100%; border-collapse: collapse; min-width: 900px; }
        table.mvq-table th {
          text-align: ${isRTL ? "right" : "left"}; font-size: 11px; font-weight: 700; letter-spacing: 0.08em;
          text-transform: uppercase; color: ${C.subtle}; padding: 10px 20px; background: ${C.pageBg};
          border-bottom: 1px solid ${C.border}; white-space: nowrap;
        }
        table.mvq-table td { padding: 10px 20px; font-size: 13.5px; color: ${C.text}; border-bottom: 1px solid ${C.border}; vertical-align: middle; background: ${C.pageBg}; transition: background 0.15s; }
        table.mvq-table tr:last-child td { border-bottom: none; }
        table.mvq-table tr:hover td { background: rgba(11,67,53,0.04); }

        .mvq-media-cell { display: flex; align-items: flex-start; gap: 10px; min-width: 240px; }
        .mvq-media-icon { width: 36px; height: 36px; border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .mvq-media-icon .ms { font-size: 18px; color: ${C.forest}; }
        .mvq-media-title { font-weight: 600; color: ${C.text}; font-size: 13.5px; margin-bottom: 2px; }
        .mvq-media-desc { font-size: 11.5px; color: ${C.subtle}; max-width: 260px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .mvq-flag-row { display: flex; align-items: center; gap: 4px; font-size: 10.5px; color: ${C.rejectText}; font-weight: 600; margin-top: 3px; }
        .mvq-flag-row .ms { font-size: 12px; }

        .mvq-type-chip { 
          font-size: 10.5px; 
          font-weight: 700; 
          letter-spacing: 0.04em; 
          padding: 4px 10px; 
          border-radius: 99px; 
          white-space: nowrap; 
        }
        .mvq-type-chip.pdf { 
          background: rgba(11,67,53,0.10); 
          color: #0b4335; 
        }
        .mvq-type-chip.audio { 
          background: rgba(254,214,91,0.25); 
          color: #7c5e12; 
        }
        .mvq-type-chip.video { 
          background: rgba(74,127,203,0.15); 
          color: #1e4d8b; 
        }

        .mvq-source-cell { display: flex; flex-direction: column; gap: 2px; }
        .mvq-source-link { display: inline-flex; align-items: center; gap: 5px; font-size: 12.5px; color: ${C.primary}; text-decoration: none; font-weight: 600; }
        .mvq-source-link:hover { text-decoration: underline; }
        .mvq-source-link .ms { font-size: 14px; }
        .mvq-source-file { display: inline-flex; align-items: center; gap: 5px; font-size: 12.5px; color: ${C.muted}; font-weight: 600; }
        .mvq-source-file .ms { font-size: 14px; color: ${C.subtle}; }
        .mvq-source-size { font-size: 10.5px; color: ${C.subtle}; }

        .mvq-scholar-link { font-size: 13px; color: ${C.text}; font-weight: 500; }

        .mvq-contributor-cell { display: flex; align-items: center; gap: 8px; }
        .mvq-contributor-avatar { width: 28px; height: 28px; border-radius: 50%; background: ${C.avatarBg}; color: ${C.avatarText}; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 700; flex-shrink: 0; }

        .mvq-actions { display: flex; gap: 8px; align-items: center; }
        .mvq-action-btn { width: 36px; height: 36px; border-radius: 8px; cursor: pointer; border: 1.5px solid ${C.border}; background: ${C.white}; display: flex; align-items: center; justify-content: center; transition: all 0.18s; flex-shrink: 0; }
        .mvq-action-btn .ms { font-size: 18px; }
        .mvq-action-btn.preview { color: ${C.subtle}; }
        .mvq-action-btn.preview:hover { background: ${C.cardBg}; border-color: ${C.primary}; color: ${C.primary}; }
        .mvq-action-btn.approve { color: ${C.forest}; border-color: ${C.approveBorder}; }
        .mvq-action-btn.approve:hover { background: ${C.activeBg}; border-color: ${C.forest}; }
        .mvq-action-btn.reject { color: ${C.rejectText}; border-color: ${C.rejectBorder}; }
                .mvq-action-btn.strip { color: ${C.muted}; }
        .mvq-action-btn.strip:hover { background: ${C.rejectText}; color: white; border-color: ${C.rejectText}; }
        .mvq-action-btn.strip.disabled { opacity: 0.35; cursor: not-allowed; pointer-events: none; }

        table.mvq-table tr.stripped td { background: #f5f5f5 !important; color: #999999; }
        table.mvq-table tr.stripped .mvq-media-title,
        table.mvq-table tr.stripped .mvq-contributor-cell span { color: #999999; text-decoration: line-through; }
        table.mvq-table tr.stripped .mvq-contributor-avatar { background: #ddd !important; color: #999 !important; }
        .mvq-empty { padding: 80px 20px; text-align: center; color: ${C.muted}; font-size: 14px; background: ${C.white}; }
        .mvq-empty .ms { font-size: 48px; display: block; margin-bottom: 16px; opacity: 0.3; }

        .mvq-modal-overlay { position: fixed; inset: 0; background: rgba(11,20,17,0.5); z-index: 100; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(4px); }
        .mvq-modal { background: ${C.white}; border-radius: 16px; width: 440px; max-width: 90vw; padding: 32px; box-shadow: 0 20px 60px rgba(0,0,0,0.18); }
        .mvq-modal-icon { width: 56px; height: 56px; border-radius: 50%; background: ${C.rejectBg}; color: ${C.rejectText}; display: flex; align-items: center; justify-content: center; margin-bottom: 20px; }
        .mvq-modal-title { font-size: 20px; font-weight: 700; margin-bottom: 12px; }
        .mvq-modal-body { font-size: 14px; color: ${C.muted}; line-height: 1.6; margin-bottom: 16px; }
        .mvq-modal-textarea { width: 100%; min-height: 90px; border: 1px solid ${C.border}; border-radius: 7px; padding: 10px 12px; font-size: 13px; font-family: 'Inter', sans-serif; color: ${C.text}; resize: vertical; box-sizing: border-box; background: ${C.cardBg}; margin-bottom: 20px; }
        .mvq-modal-textarea:focus { outline: none; border-color: ${C.forest}; }
        .mvq-modal-actions { display: flex; gap: 12px; justify-content: flex-end; }
        .mvq-modal-cancel { padding: 10px 24px; border-radius: 8px; cursor: pointer; border: 1px solid ${C.border}; background: ${C.white}; font-weight: 600; transition: all 0.18s; color: ${C.text}; }
        .mvq-modal-cancel:hover { background: ${C.cardBg}; }
        .mvq-modal-confirm { padding: 10px 24px; border-radius: 8px; cursor: pointer; border: none; color: white; background: ${C.rejectText}; font-weight: 700; transition: all 0.18s; }
        .mvq-modal-confirm:hover { background: #9e1717; }

        .mvq-review-overlay { position: fixed; inset: 0; background: rgba(11,20,17,0.6); z-index: 100; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(4px); }
        .mvq-review-modal { background: ${C.white}; border-radius: 16px; width: 90vw; max-width: 1200px; height: 85vh; display: flex; flex-direction: column; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.2); }
        .mvq-review-header { padding: 20px 24px; border-bottom: 1px solid ${C.border}; display: flex; justify-content: space-between; align-items: center; background: ${C.cardBg}; flex-shrink: 0; }
        .mvq-review-header h3 { font-size: 18px; font-weight: 700; color: ${C.primary}; margin: 0; display: flex; align-items: center; gap: 10px; }
        .mvq-review-close { background: none; border: none; cursor: pointer; color: ${C.subtle}; font-size: 24px; padding: 4px; border-radius: 6px; transition: all 0.18s; display: flex; align-items: center; justify-content: center; }
        .mvq-review-close:hover { background: ${C.pageBg}; color: ${C.text}; }

        .mvq-review-body { flex: 1; display: flex; overflow: hidden; }
        .mvq-review-media { flex: 1.2; background: #191c1b; display: flex; align-items: center; justify-content: center; position: relative; min-width: 0; }
        .mvq-review-media iframe { width: 100%; height: 100%; border: none; background: white; }
        .mvq-review-media video { width: 100%; height: 100%; object-fit: contain; }
        .mvq-review-media audio { width: 80%; }

        .mvq-review-panel { flex: 1; padding: 24px; overflow-y: auto; display: flex; flex-direction: column; gap: 24px; border-left: 1px solid ${C.border}; background: ${C.white}; }
        .mvq-review-panel h4 { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: ${C.subtle}; margin: 0 0 12px 0; }

        .mvq-review-details { display: flex; flex-direction: column; gap: 10px; padding-bottom: 20px; border-bottom: 1px solid ${C.border}; }
        .mvq-review-detail-row { display: flex; gap: 8px; font-size: 13.5px; }
        .mvq-review-detail-label { font-weight: 600; color: ${C.muted}; min-width: 90px; }
        .mvq-review-detail-value { color: ${C.text}; }

        .mvq-checklist { display: flex; flex-direction: column; gap: 14px; }
        .mvq-check-item { display: flex; align-items: flex-start; gap: 10px; font-size: 13.5px; color: ${C.text}; cursor: pointer; line-height: 1.4; }
        .mvq-check-item input[type="checkbox"] { margin-top: 2px; width: 16px; height: 16px; accent-color: ${C.primary}; cursor: pointer; flex-shrink: 0; }

        .mvq-review-actions { display: flex; gap: 12px; align-items: center; margin-top: auto; padding-top: 20px; border-top: 1px solid ${C.border}; flex-shrink: 0; }
        .mvq-btn-delete { padding: 10px 16px; border-radius: 8px; cursor: pointer; border: 1px solid ${C.rejectBorder}; background: ${C.white}; color: ${C.rejectText}; font-weight: 600; display: flex; align-items: center; gap: 6px; transition: all 0.18s; font-size: 13px; }
        .mvq-btn-delete:hover { background: ${C.rejectBg}; }
        .mvq-btn-reject { padding: 10px 20px; border-radius: 8px; cursor: pointer; border: 1px solid ${C.border}; background: ${C.white}; color: ${C.muted}; font-weight: 600; display: flex; align-items: center; gap: 6px; transition: all 0.18s; font-size: 13px; }
        .mvq-btn-reject:hover { background: ${C.cardBg}; color: ${C.text}; }
        .mvq-btn-approve { padding: 10px 24px; border-radius: 8px; cursor: pointer; border: none; background: ${C.primary}; color: white; font-weight: 700; display: flex; align-items: center; gap: 6px; transition: all 0.18s; font-size: 13px; }
        .mvq-btn-approve:hover { background: ${C.forest}; }

        .mvq-error-msg { font-size: 12.5px; color: ${C.rejectText}; font-weight: 600; margin-top: -12px; display: flex; align-items: center; gap: 6px; }
        .mvq-error-msg .ms { font-size: 16px; }

        .mvq-media-placeholder { color: #707974; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 40px; }
        .mvq-media-placeholder .ms { font-size: 64px; opacity: 0.5; }
        .mvq-media-placeholder p { font-size: 14px; margin: 0; max-width: 300px; line-height: 1.5; }

        .ms { font-family: 'Material Symbols Outlined'; font-style: normal; font-size: 18px; display: inline-flex; align-items: center; user-select: none; line-height: 1; }
      `}</style>

      <link
        href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20,700,0..1,0&display=swap"
        rel="stylesheet"
      />

      <div className="mvq-wrap">

        <div className="mvq-header">
          <h2>{t("mediaQueue.title")}</h2>
          <div className="mvq-subtitle">{t("mediaQueue.subtitle")}</div>
        </div>

        <div className="mvq-stats">
          <div className="mvq-stat-card">
            <div className="mvq-stat-icon default"><span className="ms">perm_media</span></div>
            <div className="mvq-stat-content">
              <span className="mvq-stat-label">{t("mediaQueue.stats.totalPending")}</span>
              <span className="mvq-stat-value">{stats.total}</span>
            </div>
          </div>

          <div className="mvq-stat-card priority">
            <div className="mvq-stat-icon priority"><span className="ms">flag</span></div>
            <div className="mvq-stat-content">
              <span className="mvq-stat-label">{t("mediaQueue.stats.priorityReviews")}</span>
              <span className="mvq-stat-value">{stats.priority}</span>
            </div>
          </div>

          <div className="mvq-stat-card">
            <div className="mvq-stat-icon time"><span className="ms">schedule</span></div>
            <div className="mvq-stat-content">
              <span className="mvq-stat-label">{t("mediaQueue.stats.avgTime")}</span>
              <span className="mvq-stat-value" style={{ fontSize: 22 }}>{stats.avgTime}</span>
            </div>
          </div>
        </div>

        <div className="mvq-filters">
          <div className="mvq-filters-head">
            <div className="mvq-filters-title"><span className="ms">tune</span>{t("mediaQueue.filters.title")}</div>
            {hasActiveFilters && <button className="mvq-clear-link" onClick={clearFilters}>{t("mediaQueue.filters.clearAll")}</button>}
          </div>
          <div className="mvq-filters-row">
            <div className="mvq-filter-group">
              <span className="mvq-filter-label">{t("mediaQueue.filters.type")}</span>
              <select className="mvq-filter-select" value={filterType} onChange={(e) => setFilterType(e.target.value as MediaType | "all")}>
                <option value="all">{t("mediaQueue.filters.allTypes")}</option>
                <option value="PDF">{t("mediaQueue.type.pdf")}</option>
                <option value="AUDIO">{t("mediaQueue.type.audio")}</option>
                <option value="VIDEO">{t("mediaQueue.type.video")}</option>
              </select>
            </div>

            <div className="mvq-filter-group">
              <span className="mvq-filter-label">{t("mediaQueue.filters.scholar")}</span>
              <select className="mvq-filter-select" value={filterScholar} onChange={(e) => setFilterScholar(e.target.value)}>
                <option value="all">{t("mediaQueue.filters.allScholars")}</option>
                {scholars.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div className="mvq-filter-group">
              <span className="mvq-filter-label">{t("mediaQueue.filters.sort")}</span>
              <select className="mvq-filter-select" value={sortBy} onChange={(e) => setSortBy(e.target.value as SortOption)}>
                <option value="newest">{t("mediaQueue.sort.newest")}</option>
                <option value="oldest">{t("mediaQueue.sort.oldest")}</option>
                <option value="title">{t("mediaQueue.sort.titleAZ")}</option>
              </select>
            </div>
          </div>
        </div>

        <div className="mvq-table-card">
          <div className="mvq-table-header">
            <h3 className="mvq-table-title">{t("mediaQueue.table.title")}</h3>
            <span className="mvq-updated-badge">{t("mediaQueue.table.updated")}</span>
          </div>

          <div className="mvq-table-scroll">
            <table className={`mvq-table ${stripedRows ? 'striped' : ''}`}>
              <thead>
                <tr>
                  <th>{t("mediaQueue.table.media")}</th>
                  <th>{t("mediaQueue.table.type")}</th>
                  <th>{t("mediaQueue.table.source")}</th>
                  <th>{t("mediaQueue.table.scholar")}</th>
                  <th>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>{t("mediaQueue.table.submitter")}</span>
                      
                    </div>
                  </th>
                  <th>{t("mediaQueue.table.submitted")}</th>
                  <th style={{ textAlign: isRTL ? "left" : "right" }}>{t("mediaQueue.table.actions")}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7}>
                      <div className="mvq-empty"><span className="ms">inbox</span>{t("mediaQueue.table.empty")}</div>
                    </td>
                  </tr>
                ) : (
                  filtered.map((m) => {
                    const meta = TYPE_META[m.type];
                    const initials = m.submittedBy.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
                    return (
                                            <tr key={m.id} className={m.stripped ? 'stripped' : ''}>
                        <td>
                          <div className="mvq-media-cell">
                            <div className="mvq-media-icon" style={{ background: meta.color }}>
                              <span className="ms">{meta.icon}</span>
                            </div>
                            <div>
                              <div className="mvq-media-title">{m.title}</div>
                              {m.description && <div className="mvq-media-desc">{m.description}</div>}
                              {m.flagged && (
                                <div className="mvq-flag-row"><span className="ms">flag</span>{m.flagReason}</div>
                              )}
                            </div>
                          </div>
                        </td>

                        <td><span className={`mvq-type-chip ${m.type.toLowerCase()}`}>{m.type}</span></td>

                        <td>
                          <div className="mvq-source-cell">
                            {m.sourceType === "link" ? (
                              <a href={m.sourceUrl} target="_blank" rel="noopener noreferrer" className="mvq-source-link">
                                <span className="ms">link</span>{t("mediaQueue.source.link")}
                              </a>
                            ) : (
                              <>
                                <span className="mvq-source-file"><span className="ms">upload_file</span>{m.fileName}</span>
                                <span className="mvq-source-size">{m.fileSize}</span>
                              </>
                            )}
                          </div>
                        </td>

                        <td><span className="mvq-scholar-link">{m.scholarName}</span></td>

                        <td>
                          <div className="mvq-contributor-cell">
                            <div className="mvq-contributor-avatar">{initials}</div>
                            <span style={{ fontSize: 13 }}>{m.submittedBy}</span>
                          </div>
                        </td>

                        <td style={{ color: C.subtle, fontSize: 13 }}>{m.date}</td>

                        <td>
                          <div className="mvq-actions" style={{ justifyContent: isRTL ? "flex-start" : "flex-end" }}>
                            <button className="mvq-action-btn preview" onClick={() => openReview(m)} title="Review Media">
                              <span className="ms">visibility</span>
                            </button>
                            <button className="mvq-action-btn approve" onClick={() => handleApprove(m.id)} title={t("mediaQueue.actions.approve")}>
                              <span className="ms">check_circle</span>
                            </button>
                                                       <button className="mvq-action-btn reject" onClick={() => setRejectTarget(m)} title={t("mediaQueue.actions.reject")}>
                              <span className="ms">cancel</span>
                            </button>
                            <button 
                              className={`mvq-action-btn strip ${m.stripped ? 'disabled' : ''}`} 
                              onClick={() => !m.stripped && setStripTarget(m)} 
                              title={m.stripped ? t("mediaQueue.strip.alreadyStripped") : t("mediaQueue.actions.strip")}
                              disabled={m.stripped}
                            >
                              <span className="ms">{m.stripped ? "check_circle" : "person_remove"}</span>
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
        </div>
      </div>

           {reviewTarget && (
        <div className="mvq-review-overlay" onClick={closeReview}>
          <div className="mvq-review-modal" onClick={(e) => e.stopPropagation()}>
            <div className="mvq-review-header">
              {/* UPDATED HEADER */}
              <h3><span className="ms">fact_check</span> {t("mediaQueue.review.title")}</h3>
              <button className="mvq-review-close" onClick={closeReview}><span className="ms">close</span></button>
            </div>
            <div className="mvq-review-body">
              <div className="mvq-review-media">
                {renderMedia()}
              </div>
              <div className="mvq-review-panel">
                <div className="mvq-review-details">
                  {/* UPDATED DETAILS TITLE */}
                  <h4>{t("mediaQueue.review.detailsTitle")}</h4>
                  <div className="mvq-review-detail-row">
                    <span className="mvq-review-detail-label">{t("mediaQueue.review.label.title")}</span>
                    <span className="mvq-review-detail-value" style={{fontWeight: 600}}>{reviewTarget.title}</span>
                  </div>
                  {reviewTarget.description && (
                    <div className="mvq-review-detail-row">
                      <span className="mvq-review-detail-label">{t("mediaQueue.review.label.description")}</span>
                      <span className="mvq-review-detail-value">{reviewTarget.description}</span>
                    </div>
                  )}
                  <div className="mvq-review-detail-row">
                    <span className="mvq-review-detail-label">{t("mediaQueue.review.label.scholar")}</span>
                    <span className="mvq-review-detail-value">{reviewTarget.scholarName}</span>
                  </div>
                  <div className="mvq-review-detail-row">
                    <span className="mvq-review-detail-label">{t("mediaQueue.review.label.submittedBy")}</span>
                    <span className="mvq-review-detail-value">{reviewTarget.submittedBy} ({reviewTarget.date})</span>
                  </div>
                </div>

                <div>
                  {/* UPDATED CHECKS TITLE & ITEMS */}
                  <h4>{t("mediaQueue.review.checksTitle")}</h4>
                  <div className="mvq-checklist">
                    <label className="mvq-check-item">
                      <input type="checkbox" checked={checks.accessible} onChange={e => setChecks({...checks, accessible: e.target.checked})} />
                      <span>{t("mediaQueue.review.check1")}</span>
                    </label>
                    <label className="mvq-check-item">
                      <input type="checkbox" checked={checks.matches} onChange={e => setChecks({...checks, matches: e.target.checked})} />
                      <span>{t("mediaQueue.review.check2")}</span>
                    </label>
                    <label className="mvq-check-item">
                      <input type="checkbox" checked={checks.legal} onChange={e => setChecks({...checks, legal: e.target.checked})} />
                      <span>{t("mediaQueue.review.check3")}</span>
                    </label>
                    <label className="mvq-check-item">
                      <input type="checkbox" checked={checks.guidelines} onChange={e => setChecks({...checks, guidelines: e.target.checked})} />
                      <span>{t("mediaQueue.review.check4")}</span>
                    </label>
                  </div>
                </div>

                <div>
                  {/* UPDATED NOTES TITLE & PLACEHOLDER */}
                  <h4>{t("mediaQueue.review.notesTitle")}</h4>
                  <textarea
                    className="mvq-modal-textarea"
                    placeholder={t("mediaQueue.review.notesPlaceholder")}
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                  />
                </div>

                {approvalError && (
                  <div className="mvq-error-msg">
                    <span className="ms">error</span>
                    {approvalError}
                  </div>
                )}

                <div className="mvq-review-actions">
                  {/* UPDATED BUTTONS */}
                  <button className="mvq-btn-delete" onClick={() => { setDeleteTarget(reviewTarget); closeReview(); }}>
                    <span className="ms">delete</span> {t("mediaQueue.actions.delete")}
                  </button>
                  <div style={{flex: 1}} />
                  <button className="mvq-btn-reject" onClick={handleRejectFromReview}>
                    <span className="ms">cancel</span> {t("mediaQueue.actions.reject")}
                  </button>
                  <button className="mvq-btn-approve" onClick={handleApproveFromReview}>
                    <span className="ms">check_circle</span> {t("mediaQueue.actions.approve")}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {rejectTarget && (
        <div className="mvq-modal-overlay" onClick={() => { setRejectTarget(null); setRejectNote(""); }}>
          <div className="mvq-modal" onClick={(e) => e.stopPropagation()}>
            <div className="mvq-modal-icon"><span className="ms">cancel</span></div>
            <div className="mvq-modal-title">{t("mediaQueue.modal.rejectTitle")}</div>
            <div className="mvq-modal-body">{t("mediaQueue.modal.rejectBody").replace("{title}", rejectTarget.title)}</div>
            <textarea
              className="mvq-modal-textarea"
              placeholder={t("mediaQueue.modal.rejectPlaceholder")}
              value={rejectNote}
              onChange={(e) => setRejectNote(e.target.value)}
            />
            <div className="mvq-modal-actions">
              <button className="mvq-modal-cancel" onClick={() => { setRejectTarget(null); setRejectNote(""); }}>{t("mediaQueue.modal.cancel")}</button>
              <button className="mvq-modal-confirm" onClick={confirmReject}>{t("mediaQueue.modal.confirm")}</button>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="mvq-modal-overlay" onClick={() => { setDeleteTarget(null); setDeleteNote(""); }}>
          <div className="mvq-modal" onClick={(e) => e.stopPropagation()}>
            <div className="mvq-modal-icon" style={{background: "#ffdad6", color: "#ba1a1a"}}><span className="ms">delete_forever</span></div>
            <div className="mvq-modal-title">Delete Submission?</div>
            <div className="mvq-modal-body">Are you sure you want to permanently delete "{deleteTarget.title}"? This action cannot be undone.</div>
            <textarea
              className="mvq-modal-textarea"
              placeholder="Reason for deletion (optional)..."
              value={deleteNote}
              onChange={(e) => setDeleteNote(e.target.value)}
            />
            <div className="mvq-modal-actions">
              <button className="mvq-modal-cancel" onClick={() => { setDeleteTarget(null); setDeleteNote(""); }}>Cancel</button>
              <button className="mvq-modal-confirm" onClick={confirmDelete}>Delete</button>
            </div>
          </div>
          
        </div>
      )}

{stripTarget && (
  <div className="mvq-modal-overlay" onClick={() => setStripTarget(null)}>
    <div className="mvq-modal" onClick={(e) => e.stopPropagation()}>
      <div className="mvq-modal-icon"><span className="ms">person_remove</span></div>
      <div className="mvq-modal-title">{t("mediaQueue.strip.title")}</div>
      <div className="mvq-modal-body">
        <span dangerouslySetInnerHTML={{ __html: t("mediaQueue.strip.body")
          .replace("{name}", stripTarget.submittedBy)
          .replace("{title}", stripTarget.title) }} />
        <br /><br />
        <b>{t("mediaQueue.strip.warning")}</b>
      </div>
      <div className="mvq-modal-actions">
        <button className="mvq-modal-cancel" onClick={() => setStripTarget(null)}>
          {t("mediaQueue.strip.cancel")}
        </button>
        <button className="mvq-modal-confirm" onClick={confirmStrip}>
          {t("mediaQueue.strip.confirm")}
        </button>
      </div>
    </div>
  </div>
)}
    </div>
  );
}