import { useState, useMemo } from "react";
import { useLang } from "../../context/LanguageContext";

/* ─────────────────────── Types ─────────────────────── */
type WorkFormat = "Book" | "Article" | "Manuscript" | "Lecture" | "Letter" | "Other";
type AccessType = "none" | "upload" | "link";
type SortOption = "newest" | "oldest" | "title";

interface PendingWork {
  id: string;
  title: string;
  year: string;
  format: WorkFormat;
  accessType: AccessType;
  accessUrl?: string;
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
  stripped?: boolean;
}

/* ─────────────────────── Mock data ─────────────────────── */
const WORKS: PendingWork[] = [
  {
    id: "work_001",
    title: "The Problem of Culture",
    year: "1959",
    format: "Book",
    accessType: "upload",
    fileName: "problem-of-culture.pdf",
    fileSize: "12.4 MB",
    scholarName: "Malek Bennabi",
    scholarId: "sch_001",
    submittedBy: "Zaid Al-Hassan",
    contributorId: "user_zaid",
    date: "June 18, 2026",
    submittedAt: new Date("2026-06-18"),
    flagged: false,
  },
  {
    id: "work_002",
    title: "Vocation of Islam",
    year: "1954",
    format: "Book",
    accessType: "link",
    accessUrl: "https://archive.org/details/vocation-islam",
    scholarName: "Malek Bennabi",
    scholarId: "sch_001",
    submittedBy: "Zaid Al-Hassan",
    contributorId: "user_zaid",
    date: "June 17, 2026",
    submittedAt: new Date("2026-06-17"),
    flagged: true,
    flagReason: "Link needs verification",
  },
  {
    id: "work_003",
    title: "Colonizability: The Tragic Vision",
    year: "1968",
    format: "Lecture",
    accessType: "none",
    scholarName: "Malek Bennabi",
    scholarId: "sch_001",
    submittedBy: "Karim Mansouri",
    contributorId: "user_karim",
    date: "June 15, 2026",
    submittedAt: new Date("2026-06-15"),
    flagged: false,
  },
  {
    id: "work_004",
    title: "Book of Healing",
    year: "1027",
    format: "Manuscript",
    accessType: "upload",
    fileName: "book-of-healing-ms.pdf",
    fileSize: "89.2 MB",
    scholarName: "Ibn Sina",
    scholarId: "sch_002",
    submittedBy: "Sara Al-Rashid",
    contributorId: "user_sara",
    date: "June 13, 2026",
    submittedAt: new Date("2026-06-13"),
    flagged: true,
    flagReason: "Large file needs review",
  },
  {
    id: "work_005",
    title: "Muqaddimah",
    year: "1377",
    format: "Book",
    accessType: "link",
    accessUrl: "https://example.com/muqaddimah",
    scholarName: "Ibn Khaldun",
    scholarId: "sch_003",
    submittedBy: "Pedro Alves",
    contributorId: "user_pedro",
    date: "June 11, 2026",
    submittedAt: new Date("2026-06-11"),
    flagged: false,
  },
  {
    id: "work_006",
    title: "Letter to Al-Mu'azzam",
    year: "1215",
    format: "Letter",
    accessType: "none",
    scholarName: "Ibn Arabi",
    scholarId: "sch_004",
    submittedBy: "Karim Mansouri",
    contributorId: "user_karim",
    date: "June 9, 2026",
    submittedAt: new Date("2026-06-09"),
    flagged: true,
    flagReason: "Overdue 4 days",
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

const FORMAT_META: Record<WorkFormat, { icon: string; color: string }> = {
  Book: { icon: "menu_book", color: "rgba(11,67,53,0.10)" },
  Article: { icon: "article", color: "rgba(254,214,91,0.22)" },
  Manuscript: { icon: "history_edu", color: "rgba(74,127,203,0.14)" },
  Lecture: { icon: "record_voice_over", color: "rgba(11,67,53,0.08)" },
  Letter: { icon: "mail", color: "rgba(186,26,26,0.10)" },
  Other: { icon: "description", color: "rgba(112,121,116,0.12)" },
};

/* ─────────────────────── Stats helper ─────────────────────── */
function getStats(rows: PendingWork[]) {
  const total = rows.length;
  const priority = rows.filter((r) => r.flagged).length;
  return { total, priority, avgTime: "1h 55m" };
}

/* ─────────────────────── Component ─────────────────────── */
export default function WorksPendingQueue() {
  const { t, lang } = useLang();
  const isRTL = lang === "AR";

  const [filterFormat, setFilterFormat] = useState<WorkFormat | "all">("all");
  const [filterScholar, setFilterScholar] = useState<string>("all");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [stripedRows, setStripedRows] = useState<boolean>(true);
  
  const [rows, setRows] = useState<PendingWork[]>(WORKS);
  
  const [reviewTarget, setReviewTarget] = useState<PendingWork | null>(null);
  const [checks, setChecks] = useState({
    accurate: false,
    complete: false,
    rights: false,
    guidelines: false,
  });
  const [reviewNotes, setReviewNotes] = useState("");
  const [approvalError, setApprovalError] = useState("");

  const [rejectTarget, setRejectTarget] = useState<PendingWork | null>(null);
  const [rejectNote, setRejectNote] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<PendingWork | null>(null);
  const [deleteNote, setDeleteNote] = useState("");
  const [stripTarget, setStripTarget] = useState<PendingWork | null>(null);

  const stats = getStats(rows);

  const scholars = useMemo(() => {
    const unique = [...new Set(rows.map((r) => r.scholarName))];
    return unique.sort();
  }, [rows]);

  const filtered = useMemo(() => {
    let result = [...rows];
    if (filterFormat !== "all") result = result.filter((w) => w.format === filterFormat);
    if (filterScholar !== "all") result = result.filter((w) => w.scholarName === filterScholar);
    result.sort((a, b) => {
      switch (sortBy) {
        case "newest": return b.submittedAt.getTime() - a.submittedAt.getTime();
        case "oldest": return a.submittedAt.getTime() - b.submittedAt.getTime();
        case "title":  return a.title.localeCompare(b.title);
        default:       return 0;
      }
    });
    return result;
  }, [rows, filterFormat, filterScholar, sortBy]);

  const clearFilters = () => { setFilterFormat("all"); setFilterScholar("all"); setSortBy("newest"); };
  const hasActiveFilters = filterFormat !== "all" || filterScholar !== "all";

  const openReview = (w: PendingWork) => {
    setReviewTarget(w);
    setChecks({ accurate: false, complete: false, rights: false, guidelines: false });
    setReviewNotes("");
    setApprovalError("");
  };

  const closeReview = () => {
    setReviewTarget(null);
    setApprovalError("");
  };

  const handleApprove = (id: string) => {
    console.log("Quick Approved work:", id);
    setRows(prev => prev.filter(w => w.id !== id));
  };

  const handleApproveFromReview = () => {
    const allChecked = Object.values(checks).every(v => v);
    if (!allChecked) {
      setApprovalError(t("worksQueue.review.errorChecks"));
      return;
    }
    if (!reviewTarget) return;
    
    console.log("Approved work:", reviewTarget.id, "Notes:", reviewNotes);
    setRows(prev => prev.filter(w => w.id !== reviewTarget.id));
    closeReview();
  };

  const handleRejectFromReview = () => {
    if (!reviewTarget) return;
    if (!reviewNotes.trim()) {
      setApprovalError(t("worksQueue.review.errorReject"));
      return;
    }
    
    console.log("Rejected work:", reviewTarget.id, "Notes:", reviewNotes);
    setRows(prev => prev.filter(w => w.id !== reviewTarget.id));
    closeReview();
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    console.log("Deleted work:", deleteTarget.id, "note:", deleteNote);
    setRows(prev => prev.filter(w => w.id !== deleteTarget.id));
    setDeleteTarget(null);
    setDeleteNote("");
    if (reviewTarget?.id === deleteTarget.id) closeReview();
  };

  const confirmReject = () => { 
    if (!rejectTarget) return; 
    console.log("Rejected work:", rejectTarget.id, "note:", rejectNote); 
    setRows(prev => prev.filter(w => w.id !== rejectTarget.id));
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
    console.log(`Stripped contributor from work "${stripTarget.title}"`);
    setStripTarget(null);
  };

  return (
    <div
      dir={isRTL ? "rtl" : "ltr"}
      style={{ fontFamily: "'Inter', sans-serif", color: C.text, background: C.pageBg, minHeight: "100vh" }}
    >
      <style>{`
        .wpq-wrap { padding: 40px; max-width: 1400px; margin: 0 auto; }

        .wpq-header { margin-bottom: 32px; }
        .wpq-header h2 { font-size: 32px; font-weight: 700; color: ${C.primary}; margin-bottom: 8px; }
        .wpq-subtitle { font-size: 14px; color: ${C.muted}; max-width: 800px; line-height: 1.6; }

        .wpq-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin-bottom: 20px; }
        .wpq-stat-card {
          background: ${C.cardBg}; border: 1px solid ${C.border}; border-radius: 12px;
          padding: 22px 20px; min-height: 90px; display: flex; align-items: center; gap: 14px;
          overflow: hidden; transition: transform 0.15s, box-shadow 0.15s;
        }
        .wpq-stat-card:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(11,67,53,0.08); }
        .wpq-stat-icon { width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .wpq-stat-icon .ms { font-size: 22px; }
        .wpq-stat-icon.default { background: ${C.defaultIconBg}; color: ${C.primary}; }
        .wpq-stat-icon.priority { background: ${C.overdueIconBg}; color: ${C.rejectText}; }
        .wpq-stat-icon.time { background: ${C.timeIconBg}; color: ${C.primary}; }
        .wpq-stat-content { display: flex; flex-direction: column; gap: 5px; min-width: 0; }
        .wpq-stat-label { font-size: 10px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: ${C.subtle}; line-height: 1.3; }
        .wpq-stat-value { font-size: 28px; font-weight: 800; color: ${C.primary}; line-height: 1; letter-spacing: -0.02em; white-space: nowrap; }
        .wpq-stat-card.priority .wpq-stat-value { color: ${C.rejectText}; }

        .wpq-filters { background: ${C.cardBg}; border: 1px solid ${C.border}; border-radius: 10px; padding: 16px 20px; margin-bottom: 20px; }
        .wpq-filters-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
        .wpq-filters-title { font-size: 13px; font-weight: 700; color: ${C.primary}; display: flex; align-items: center; gap: 6px; }
        .wpq-filters-title .ms { font-size: 16px; }
        .wpq-clear-link { font-size: 11px; font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase; color: ${C.rejectText}; background: none; border: none; cursor: pointer; padding: 0; }
        .wpq-clear-link:hover { text-decoration: underline; }
        .wpq-filters-row { display: flex; gap: 20px; align-items: flex-start; flex-wrap: wrap; }
        .wpq-filter-group { display: flex; flex-direction: column; gap: 5px; }
        .wpq-filter-label { font-size: 10px; font-weight: 700; color: ${C.subtle}; text-transform: uppercase; letter-spacing: 0.06em; }
        .wpq-filter-select {
          padding: 10px 12px; border: 1px solid ${C.border}; border-radius: 8px; font-size: 13.5px;
          background: ${C.white}; color: ${C.text}; cursor: pointer; outline: none; transition: border-color 0.2s;
          min-width: 170px; height: 42px; font-family: 'Inter', sans-serif;
        }
        .wpq-filter-select:hover { border-color: ${C.primary}; }
        .wpq-filter-select:focus { border-color: ${C.primary}; box-shadow: 0 0 0 3px rgba(11,67,53,0.1); }

        .wpq-table-card { background: ${C.tableSectionBg}; border: 1px solid ${C.border}; border-radius: 12px; overflow: hidden; }
        .wpq-table-header { padding: 16px 24px; border-bottom: 1px solid ${C.border}; display: flex; justify-content: space-between; align-items: center; background: ${C.tableSectionBg}; }
        .wpq-table-title { font-size: 16px; font-weight: 600; color: ${C.primary}; display: flex; align-items: center; gap: 8px; }
        .wpq-table-title .ms { font-size: 20px; }
        .wpq-updated-badge { font-size: 12px; padding: 5px 14px; background: ${C.cardBg}; color: ${C.subtle}; border-radius: 99px; font-weight: 600; border: 1px solid ${C.border}; }
        .wpq-table-scroll { overflow-x: auto; }

        .wpq-stripe-btn {
          display: flex; align-items: center; justify-content: center;
          width: 28px; height: 28px;
          border-radius: 6px; cursor: pointer;
          border: 1.5px solid ${C.border}; background: ${C.white};
          transition: all 0.18s; flex-shrink: 0;
        }
        .wpq-stripe-btn:hover { border-color: ${C.primary}; color: ${C.primary}; background: ${C.cardBg}; }
        .wpq-stripe-btn.active {
          background: ${C.activeBg}; border-color: ${C.primary}; color: ${C.primary};
        }
        .wpq-stripe-btn .ms { font-size: 16px; }

        table.wpq-table.striped tbody tr:nth-child(even) td {
          background: ${C.cardBg} !important;
        }
        table.wpq-table.striped tbody tr:hover td {
          background: rgba(11,67,53,0.06) !important;
        }

        table.wpq-table { width: 100%; border-collapse: collapse; min-width: 900px; }
        table.wpq-table th {
          text-align: ${isRTL ? "right" : "left"}; font-size: 11px; font-weight: 700; letter-spacing: 0.08em;
          text-transform: uppercase; color: ${C.subtle}; padding: 10px 20px; background: ${C.pageBg};
          border-bottom: 1px solid ${C.border}; white-space: nowrap;
        }
        table.wpq-table td { padding: 10px 20px; font-size: 13.5px; color: ${C.text}; border-bottom: 1px solid ${C.border}; vertical-align: middle; background: ${C.pageBg}; transition: background 0.15s; }
        table.wpq-table tr:last-child td { border-bottom: none; }
        table.wpq-table tr:hover td { background: rgba(11,67,53,0.04); }
        table.wpq-table tr.stripped td { background: #f5f5f5 !important; color: #999999; }
        table.wpq-table tr.stripped .wpq-work-title,
        table.wpq-table tr.stripped .wpq-contributor-cell span { color: #999999; text-decoration: line-through; }
        table.wpq-table tr.stripped .wpq-contributor-avatar { background: #ddd !important; color: #999 !important; }

        .wpq-work-cell { display: flex; align-items: flex-start; gap: 10px; min-width: 240px; }
        .wpq-work-icon { width: 36px; height: 36px; border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .wpq-work-icon .ms { font-size: 18px; color: ${C.forest}; }
        .wpq-work-title { font-weight: 600; color: ${C.text}; font-size: 13.5px; margin-bottom: 2px; }
        .wpq-work-year { font-size: 11.5px; color: ${C.subtle}; }
        .wpq-flag-row { display: flex; align-items: center; gap: 4px; font-size: 10.5px; color: ${C.rejectText}; font-weight: 600; margin-top: 3px; }
        .wpq-flag-row .ms { font-size: 12px; }

        .wpq-format-chip { 
          font-size: 10.5px; 
          font-weight: 700; 
          letter-spacing: 0.04em; 
          padding: 4px 10px; 
          border-radius: 99px; 
          white-space: nowrap; 
        }
        .wpq-format-chip.book { background: rgba(11,67,53,0.10); color: #0b4335; }
        .wpq-format-chip.article { background: rgba(254,214,91,0.25); color: #7c5e12; }
        .wpq-format-chip.manuscript { background: rgba(74,127,203,0.15); color: #1e4d8b; }
        .wpq-format-chip.lecture { background: rgba(11,67,53,0.08); color: #0b4335; }
        .wpq-format-chip.letter { background: rgba(186,26,26,0.12); color: #ba1a1a; }
        .wpq-format-chip.other { background: rgba(112,121,116,0.14); color: #404945; }

        .wpq-access-cell { display: flex; flex-direction: column; gap: 2px; }
        .wpq-access-link { display: inline-flex; align-items: center; gap: 5px; font-size: 12.5px; color: ${C.primary}; text-decoration: none; font-weight: 600; }
        .wpq-access-link:hover { text-decoration: underline; }
        .wpq-access-link .ms { font-size: 14px; }
        .wpq-access-file { display: inline-flex; align-items: center; gap: 5px; font-size: 12.5px; color: ${C.muted}; font-weight: 600; }
        .wpq-access-file .ms { font-size: 14px; color: ${C.subtle}; }
        .wpq-access-size { font-size: 10.5px; color: ${C.subtle}; }
        .wpq-access-none { font-size: 12.5px; color: ${C.subtle}; font-style: italic; }

        .wpq-scholar-link { font-size: 13px; color: ${C.text}; font-weight: 500; }

        .wpq-contributor-cell { display: flex; align-items: center; gap: 8px; }
        .wpq-contributor-avatar { width: 28px; height: 28px; border-radius: 50%; background: ${C.avatarBg}; color: ${C.avatarText}; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 700; flex-shrink: 0; }

        .wpq-actions { display: flex; gap: 8px; align-items: center; }
        .wpq-action-btn { width: 36px; height: 36px; border-radius: 8px; cursor: pointer; border: 1.5px solid ${C.border}; background: ${C.white}; display: flex; align-items: center; justify-content: center; transition: all 0.18s; flex-shrink: 0; }
        .wpq-action-btn .ms { font-size: 18px; }
        .wpq-action-btn.preview { color: ${C.subtle}; }
        .wpq-action-btn.preview:hover { background: ${C.cardBg}; border-color: ${C.primary}; color: ${C.primary}; }
        .wpq-action-btn.approve { color: ${C.forest}; border-color: ${C.approveBorder}; }
        .wpq-action-btn.approve:hover { background: ${C.activeBg}; border-color: ${C.forest}; }
        .wpq-action-btn.reject { color: ${C.rejectText}; border-color: ${C.rejectBorder}; }
        .wpq-action-btn.reject:hover { background: ${C.rejectBg}; border-color: ${C.rejectText}; }
        .wpq-action-btn.strip { color: ${C.muted}; }
        .wpq-action-btn.strip:hover { background: ${C.rejectText}; color: white; border-color: ${C.rejectText}; }
        .wpq-action-btn.strip.disabled { opacity: 0.35; cursor: not-allowed; pointer-events: none; }

        .wpq-empty { padding: 80px 20px; text-align: center; color: ${C.muted}; font-size: 14px; background: ${C.white}; }
        .wpq-empty .ms { font-size: 48px; display: block; margin-bottom: 16px; opacity: 0.3; }

        .wpq-modal-overlay { position: fixed; inset: 0; background: rgba(11,20,17,0.5); z-index: 100; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(4px); }
        .wpq-modal { background: ${C.white}; border-radius: 16px; width: 440px; max-width: 90vw; padding: 32px; box-shadow: 0 20px 60px rgba(0,0,0,0.18); }
        .wpq-modal-icon { width: 56px; height: 56px; border-radius: 50%; background: ${C.rejectBg}; color: ${C.rejectText}; display: flex; align-items: center; justify-content: center; margin-bottom: 20px; }
        .wpq-modal-title { font-size: 20px; font-weight: 700; margin-bottom: 12px; }
        .wpq-modal-body { font-size: 14px; color: ${C.muted}; line-height: 1.6; margin-bottom: 16px; }
        .wpq-modal-textarea { width: 100%; min-height: 90px; border: 1px solid ${C.border}; border-radius: 7px; padding: 10px 12px; font-size: 13px; font-family: 'Inter', sans-serif; color: ${C.text}; resize: vertical; box-sizing: border-box; background: ${C.cardBg}; margin-bottom: 20px; }
        .wpq-modal-textarea:focus { outline: none; border-color: ${C.forest}; }
        .wpq-modal-actions { display: flex; gap: 12px; justify-content: flex-end; }
        .wpq-modal-cancel { padding: 10px 24px; border-radius: 8px; cursor: pointer; border: 1px solid ${C.border}; background: ${C.white}; font-weight: 600; transition: all 0.18s; color: ${C.text}; }
        .wpq-modal-cancel:hover { background: ${C.cardBg}; }
        .wpq-modal-confirm { padding: 10px 24px; border-radius: 8px; cursor: pointer; border: none; color: white; background: ${C.rejectText}; font-weight: 700; transition: all 0.18s; }
        .wpq-modal-confirm:hover { background: #9e1717; }

        .wpq-review-overlay { position: fixed; inset: 0; background: rgba(11,20,17,0.6); z-index: 100; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(4px); }
        .wpq-review-modal { background: ${C.white}; border-radius: 16px; width: 90vw; max-width: 1200px; height: 85vh; display: flex; flex-direction: column; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.2); }
        .wpq-review-header { padding: 20px 24px; border-bottom: 1px solid ${C.border}; display: flex; justify-content: space-between; align-items: center; background: ${C.cardBg}; flex-shrink: 0; }
        .wpq-review-header h3 { font-size: 18px; font-weight: 700; color: ${C.primary}; margin: 0; display: flex; align-items: center; gap: 10px; }
        .wpq-review-close { background: none; border: none; cursor: pointer; color: ${C.subtle}; font-size: 24px; padding: 4px; border-radius: 6px; transition: all 0.18s; display: flex; align-items: center; justify-content: center; }
        .wpq-review-close:hover { background: ${C.pageBg}; color: ${C.text}; }

        .wpq-review-body { flex: 1; display: flex; overflow: hidden; }
        .wpq-review-preview { flex: 1.2; background: ${C.pageBg}; display: flex; align-items: center; justify-content: center; position: relative; min-width: 0; padding: 40px; }
        .wpq-preview-card { background: ${C.white}; border: 1px solid ${C.border}; border-radius: 12px; padding: 40px; max-width: 500px; width: 100%; text-align: center; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
        .wpq-preview-icon { width: 80px; height: 80px; border-radius: 12px; background: ${C.cardBg}; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; }
        .wpq-preview-icon .ms { font-size: 48px; color: ${C.primary}; }
        .wpq-preview-title { font-size: 20px; font-weight: 700; color: ${C.text}; margin-bottom: 8px; }
        .wpq-preview-meta { font-size: 13px; color: ${C.muted}; line-height: 1.6; }

        .wpq-review-panel { flex: 1; padding: 24px; overflow-y: auto; display: flex; flex-direction: column; gap: 24px; border-left: 1px solid ${C.border}; background: ${C.white}; }
        .wpq-review-panel h4 { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: ${C.subtle}; margin: 0 0 12px 0; }

        .wpq-review-details { display: flex; flex-direction: column; gap: 10px; padding-bottom: 20px; border-bottom: 1px solid ${C.border}; }
        .wpq-review-detail-row { display: flex; gap: 8px; font-size: 13.5px; }
        .wpq-review-detail-label { font-weight: 600; color: ${C.muted}; min-width: 90px; }
        .wpq-review-detail-value { color: ${C.text}; }

        .wpq-checklist { display: flex; flex-direction: column; gap: 14px; }
        .wpq-check-item { display: flex; align-items: flex-start; gap: 10px; font-size: 13.5px; color: ${C.text}; cursor: pointer; line-height: 1.4; }
        .wpq-check-item input[type="checkbox"] { margin-top: 2px; width: 16px; height: 16px; accent-color: ${C.primary}; cursor: pointer; flex-shrink: 0; }

        .wpq-review-actions { display: flex; gap: 12px; align-items: center; margin-top: auto; padding-top: 20px; border-top: 1px solid ${C.border}; flex-shrink: 0; }
        .wpq-btn-delete { padding: 10px 16px; border-radius: 8px; cursor: pointer; border: 1px solid ${C.rejectBorder}; background: ${C.white}; color: ${C.rejectText}; font-weight: 600; display: flex; align-items: center; gap: 6px; transition: all 0.18s; font-size: 13px; }
        .wpq-btn-delete:hover { background: ${C.rejectBg}; }
        .wpq-btn-reject { padding: 10px 20px; border-radius: 8px; cursor: pointer; border: 1px solid ${C.border}; background: ${C.white}; color: ${C.muted}; font-weight: 600; display: flex; align-items: center; gap: 6px; transition: all 0.18s; font-size: 13px; }
        .wpq-btn-reject:hover { background: ${C.cardBg}; color: ${C.text}; }
        .wpq-btn-approve { padding: 10px 24px; border-radius: 8px; cursor: pointer; border: none; background: ${C.primary}; color: white; font-weight: 700; display: flex; align-items: center; gap: 6px; transition: all 0.18s; font-size: 13px; }
        .wpq-btn-approve:hover { background: ${C.forest}; }

        .wpq-error-msg { font-size: 12.5px; color: ${C.rejectText}; font-weight: 600; margin-top: -12px; display: flex; align-items: center; gap: 6px; }
        .wpq-error-msg .ms { font-size: 16px; }

        .wpq-stripped-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 2px 8px;
          border-radius: 99px;
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          background: ${C.rejectBg};
          color: ${C.rejectText};
          border: 1px solid ${C.rejectBorder};
          margin-left: 8px;
        }

        .ms { font-family: 'Material Symbols Outlined'; font-style: normal; font-size: 18px; display: inline-flex; align-items: center; user-select: none; line-height: 1; }
      `}</style>

      <link
        href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20,700,0..1,0&display=swap"
        rel="stylesheet"
      />

      <div className="wpq-wrap">

        <div className="wpq-header">
          <h2>{t("worksQueue.title")}</h2>
          <div className="wpq-subtitle">{t("worksQueue.subtitle")}</div>
        </div>

        <div className="wpq-stats">
          <div className="wpq-stat-card">
            <div className="wpq-stat-icon default"><span className="ms">library_books</span></div>
            <div className="wpq-stat-content">
              <span className="wpq-stat-label">{t("worksQueue.stats.totalPending")}</span>
              <span className="wpq-stat-value">{stats.total}</span>
            </div>
          </div>

          <div className="wpq-stat-card priority">
            <div className="wpq-stat-icon priority"><span className="ms">flag</span></div>
            <div className="wpq-stat-content">
              <span className="wpq-stat-label">{t("worksQueue.stats.priorityReviews")}</span>
              <span className="wpq-stat-value">{stats.priority}</span>
            </div>
          </div>

          <div className="wpq-stat-card">
            <div className="wpq-stat-icon time"><span className="ms">schedule</span></div>
            <div className="wpq-stat-content">
              <span className="wpq-stat-label">{t("worksQueue.stats.avgTime")}</span>
              <span className="wpq-stat-value" style={{ fontSize: 22 }}>{stats.avgTime}</span>
            </div>
          </div>
        </div>

        <div className="wpq-filters">
          <div className="wpq-filters-head">
            <div className="wpq-filters-title"><span className="ms">tune</span>{t("worksQueue.filters.title")}</div>
            {hasActiveFilters && <button className="wpq-clear-link" onClick={clearFilters}>{t("worksQueue.filters.clearAll")}</button>}
          </div>
          <div className="wpq-filters-row">
            <div className="wpq-filter-group">
              <span className="wpq-filter-label">{t("worksQueue.filters.format")}</span>
              <select className="wpq-filter-select" value={filterFormat} onChange={(e) => setFilterFormat(e.target.value as WorkFormat | "all")}>
                <option value="all">{t("worksQueue.filters.allFormats")}</option>
                <option value="Book">{t("worksQueue.format.book")}</option>
                <option value="Article">{t("worksQueue.format.article")}</option>
                <option value="Manuscript">{t("worksQueue.format.manuscript")}</option>
                <option value="Lecture">{t("worksQueue.format.lecture")}</option>
                <option value="Letter">{t("worksQueue.format.letter")}</option>
                <option value="Other">{t("worksQueue.format.other")}</option>
              </select>
            </div>

            <div className="wpq-filter-group">
              <span className="wpq-filter-label">{t("worksQueue.filters.scholar")}</span>
              <select className="wpq-filter-select" value={filterScholar} onChange={(e) => setFilterScholar(e.target.value)}>
                <option value="all">{t("worksQueue.filters.allScholars")}</option>
                {scholars.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div className="wpq-filter-group">
              <span className="wpq-filter-label">{t("worksQueue.filters.sort")}</span>
              <select className="wpq-filter-select" value={sortBy} onChange={(e) => setSortBy(e.target.value as SortOption)}>
                <option value="newest">{t("worksQueue.sort.newest")}</option>
                <option value="oldest">{t("worksQueue.sort.oldest")}</option>
                <option value="title">{t("worksQueue.sort.titleAZ")}</option>
              </select>
            </div>
          </div>
        </div>

        <div className="wpq-table-card">
          <div className="wpq-table-header">
            <h3 className="wpq-table-title">{t("worksQueue.table.title")}</h3>
            <span className="wpq-updated-badge">{t("worksQueue.table.updated")}</span>
          </div>

          <div className="wpq-table-scroll">
            <table className={`wpq-table ${stripedRows ? 'striped' : ''}`}>
              <thead>
                <tr>
                  <th>{t("worksQueue.table.work")}</th>
                  <th>{t("worksQueue.table.format")}</th>
                  <th>{t("worksQueue.table.access")}</th>
                  <th>{t("worksQueue.table.scholar")}</th>
                  <th>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>{t("worksQueue.table.submitter")}</span>
                     
                    </div>
                  </th>
                  <th>{t("worksQueue.table.submitted")}</th>
                  <th style={{ textAlign: isRTL ? "left" : "right" }}>{t("worksQueue.table.actions")}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7}>
                      <div className="wpq-empty"><span className="ms">inbox</span>{t("worksQueue.table.empty")}</div>
                    </td>
                  </tr>
                ) : (
                  filtered.map((w) => {
                    const meta = FORMAT_META[w.format];
                    const initials = w.submittedBy.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase();
                    return (
                      <tr key={w.id} className={w.stripped ? 'stripped' : ''}>
                        <td>
                          <div className="wpq-work-cell">
                            <div className="wpq-work-icon" style={{ background: meta.color }}>
                              <span className="ms">{meta.icon}</span>
                            </div>
                            <div>
                              <div className="wpq-work-title">
                                {w.title}
                                {w.stripped && (
                                  <span className="wpq-stripped-badge">
                                    <span className="ms" style={{ fontSize: 12 }}>block</span>
                                    Stripped
                                  </span>
                                )}
                              </div>
                              <div className="wpq-work-year">{t("worksQueue.yearLabel")} {w.year}</div>
                              {w.flagged && (
                                <div className="wpq-flag-row"><span className="ms">flag</span>{w.flagReason}</div>
                              )}
                            </div>
                          </div>
                        </td>

                        <td><span className={`wpq-format-chip ${w.format.toLowerCase()}`}>{w.format}</span></td>

                        <td>
                          <div className="wpq-access-cell">
                            {w.accessType === "link" && w.accessUrl && (
                              <a href={w.accessUrl} target="_blank" rel="noopener noreferrer" className="wpq-access-link">
                                <span className="ms">link</span>{t("worksQueue.access.link")}
                              </a>
                            )}
                            {w.accessType === "upload" && w.fileName && (
                              <>
                                <span className="wpq-access-file"><span className="ms">upload_file</span>{w.fileName}</span>
                                <span className="wpq-access-size">{w.fileSize}</span>
                              </>
                            )}
                            {w.accessType === "none" && (
                              <span className="wpq-access-none">{t("worksQueue.access.none")}</span>
                            )}
                          </div>
                        </td>

                        <td><span className="wpq-scholar-link">{w.scholarName}</span></td>

                        <td>
                          <div className="wpq-contributor-cell">
                            <div className="wpq-contributor-avatar">{initials}</div>
                            <span style={{ fontSize: 13 }}>{w.submittedBy}</span>
                          </div>
                        </td>

                        <td style={{ color: C.subtle, fontSize: 13 }}>{w.date}</td>

                        <td>
                          <div className="wpq-actions" style={{ justifyContent: isRTL ? "flex-start" : "flex-end" }}>
                            <button className="wpq-action-btn preview" onClick={() => openReview(w)} title={t("worksQueue.actions.review")}>
                              <span className="ms">visibility</span>
                            </button>
                            <button className="wpq-action-btn approve" onClick={() => handleApprove(w.id)} title={t("worksQueue.actions.approve")}>
                              <span className="ms">check_circle</span>
                            </button>
                            <button className="wpq-action-btn reject" onClick={() => setRejectTarget(w)} title={t("worksQueue.actions.reject")}>
                              <span className="ms">cancel</span>
                            </button>
                            <button 
                              className={`wpq-action-btn strip ${w.stripped ? 'disabled' : ''}`} 
                              onClick={() => !w.stripped && setStripTarget(w)} 
                              title={w.stripped ? t("worksQueue.strip.alreadyStripped") : t("worksQueue.actions.strip")}
                              disabled={w.stripped}
                            >
                              <span className="ms">{w.stripped ? "check_circle" : "person_remove"}</span>
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
        <div className="wpq-review-overlay" onClick={closeReview}>
          <div className="wpq-review-modal" onClick={(e) => e.stopPropagation()}>
            <div className="wpq-review-header">
              <h3><span className="ms">fact_check</span> {t("worksQueue.review.title")}</h3>
              <button className="wpq-review-close" onClick={closeReview}><span className="ms">close</span></button>
            </div>
            <div className="wpq-review-body">
              <div className="wpq-review-preview">
                <div className="wpq-preview-card">
                  <div className="wpq-preview-icon">
                    <span className="ms">{FORMAT_META[reviewTarget.format].icon}</span>
                  </div>
                  <div className="wpq-preview-title">{reviewTarget.title}</div>
                  <div className="wpq-preview-meta">
                    <div>{t("worksQueue.yearLabel")} {reviewTarget.year} • {reviewTarget.format}</div>
                    <div style={{ marginTop: 8 }}>{reviewTarget.scholarName}</div>
                  </div>
                </div>
              </div>
              <div className="wpq-review-panel">
                <div className="wpq-review-details">
                  <h4>{t("worksQueue.review.detailsTitle")}</h4>
                  <div className="wpq-review-detail-row">
                    <span className="wpq-review-detail-label">{t("worksQueue.review.label.title")}</span>
                    <span className="wpq-review-detail-value" style={{fontWeight: 600}}>{reviewTarget.title}</span>
                  </div>
                  <div className="wpq-review-detail-row">
                    <span className="wpq-review-detail-label">{t("worksQueue.review.label.year")}</span>
                    <span className="wpq-review-detail-value">{reviewTarget.year}</span>
                  </div>
                  <div className="wpq-review-detail-row">
                    <span className="wpq-review-detail-label">{t("worksQueue.review.label.format")}</span>
                    <span className="wpq-review-detail-value">{reviewTarget.format}</span>
                  </div>
                  <div className="wpq-review-detail-row">
                    <span className="wpq-review-detail-label">{t("worksQueue.review.label.scholar")}</span>
                    <span className="wpq-review-detail-value">{reviewTarget.scholarName}</span>
                  </div>
                  <div className="wpq-review-detail-row">
                    <span className="wpq-review-detail-label">{t("worksQueue.review.label.submittedBy")}</span>
                    <span className="wpq-review-detail-value">{reviewTarget.submittedBy} ({reviewTarget.date})</span>
                  </div>
                </div>

                <div>
                  <h4>{t("worksQueue.review.checksTitle")}</h4>
                  <div className="wpq-checklist">
                    <label className="wpq-check-item">
                      <input type="checkbox" checked={checks.accurate} onChange={e => setChecks({...checks, accurate: e.target.checked})} />
                      <span>{t("worksQueue.review.check1")}</span>
                    </label>
                    <label className="wpq-check-item">
                      <input type="checkbox" checked={checks.complete} onChange={e => setChecks({...checks, complete: e.target.checked})} />
                      <span>{t("worksQueue.review.check2")}</span>
                    </label>
                    <label className="wpq-check-item">
                      <input type="checkbox" checked={checks.rights} onChange={e => setChecks({...checks, rights: e.target.checked})} />
                      <span>{t("worksQueue.review.check3")}</span>
                    </label>
                    <label className="wpq-check-item">
                      <input type="checkbox" checked={checks.guidelines} onChange={e => setChecks({...checks, guidelines: e.target.checked})} />
                      <span>{t("worksQueue.review.check4")}</span>
                    </label>
                  </div>
                </div>

                <div>
                  <h4>{t("worksQueue.review.notesTitle")}</h4>
                  <textarea
                    className="wpq-modal-textarea"
                    placeholder={t("worksQueue.review.notesPlaceholder")}
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                  />
                </div>

                {approvalError && (
                  <div className="wpq-error-msg">
                    <span className="ms">error</span>
                    {approvalError}
                  </div>
                )}

                <div className="wpq-review-actions">
                  <button className="wpq-btn-delete" onClick={() => { setDeleteTarget(reviewTarget); closeReview(); }}>
                    <span className="ms">delete</span> {t("worksQueue.actions.delete")}
                  </button>
                  <div style={{flex: 1}} />
                  <button className="wpq-btn-reject" onClick={handleRejectFromReview}>
                    <span className="ms">cancel</span> {t("worksQueue.actions.reject")}
                  </button>
                  <button className="wpq-btn-approve" onClick={handleApproveFromReview}>
                    <span className="ms">check_circle</span> {t("worksQueue.actions.approve")}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {rejectTarget && (
        <div className="wpq-modal-overlay" onClick={() => { setRejectTarget(null); setRejectNote(""); }}>
          <div className="wpq-modal" onClick={(e) => e.stopPropagation()}>
            <div className="wpq-modal-icon"><span className="ms">cancel</span></div>
            <div className="wpq-modal-title">{t("worksQueue.modal.rejectTitle")}</div>
            <div className="wpq-modal-body">{t("worksQueue.modal.rejectBody").replace("{title}", rejectTarget.title)}</div>
            <textarea
              className="wpq-modal-textarea"
              placeholder={t("worksQueue.modal.rejectPlaceholder")}
              value={rejectNote}
              onChange={(e) => setRejectNote(e.target.value)}
            />
            <div className="wpq-modal-actions">
              <button className="wpq-modal-cancel" onClick={() => { setRejectTarget(null); setRejectNote(""); }}>{t("worksQueue.modal.cancel")}</button>
              <button className="wpq-modal-confirm" onClick={confirmReject}>{t("worksQueue.modal.confirm")}</button>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="wpq-modal-overlay" onClick={() => { setDeleteTarget(null); setDeleteNote(""); }}>
          <div className="wpq-modal" onClick={(e) => e.stopPropagation()}>
            <div className="wpq-modal-icon" style={{background: "#ffdad6", color: "#ba1a1a"}}><span className="ms">delete_forever</span></div>
            <div className="wpq-modal-title">{t("worksQueue.modal.deleteTitle")}</div>
            <div className="wpq-modal-body">{t("worksQueue.modal.deleteBody").replace("{title}", deleteTarget.title)}</div>
            <textarea
              className="wpq-modal-textarea"
              placeholder={t("worksQueue.modal.deletePlaceholder")}
              value={deleteNote}
              onChange={(e) => setDeleteNote(e.target.value)}
            />
            <div className="wpq-modal-actions">
              <button className="wpq-modal-cancel" onClick={() => { setDeleteTarget(null); setDeleteNote(""); }}>{t("worksQueue.modal.cancel")}</button>
              <button className="wpq-modal-confirm" onClick={confirmDelete}>{t("worksQueue.modal.deleteConfirm")}</button>
            </div>
          </div>
        </div>
      )}

      {stripTarget && (
        <div className="wpq-modal-overlay" onClick={() => setStripTarget(null)}>
          <div className="wpq-modal" onClick={(e) => e.stopPropagation()}>
            <div className="wpq-modal-icon"><span className="ms">person_remove</span></div>
            <div className="wpq-modal-title">{t("worksQueue.strip.title")}</div>
            <div className="wpq-modal-body">
              <span dangerouslySetInnerHTML={{ __html: t("worksQueue.strip.body")
                .replace("{name}", stripTarget.submittedBy)
                .replace("{title}", stripTarget.title) }} />
              <br /><br />
              <b>{t("worksQueue.strip.warning")}</b>
            </div>
            <div className="wpq-modal-actions">
              <button className="wpq-modal-cancel" onClick={() => setStripTarget(null)}>{t("worksQueue.strip.cancel")}</button>
              <button className="wpq-modal-confirm" onClick={confirmStrip}>{t("worksQueue.strip.confirm")}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}