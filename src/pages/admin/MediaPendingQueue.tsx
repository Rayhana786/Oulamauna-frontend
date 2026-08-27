import React, { useState, useMemo } from "react";
import { useLang } from "../../context/LanguageContext";

/* ------------------------------------------------------------------ */
/*  Design tokens — Oulamnauna admin palette                          */
/* ------------------------------------------------------------------ */
const colors = {
  creamLight: "#fcfaf5",
  creamMid: "#f6efdc",
  creamDark: "#e5d5a8",
  forestGreen: "#0b4335",
  amber: "#b8860b",
  red: "#8b2c2c",
};

const fonts = {
  headline: "'Hanken Grotesk', sans-serif",
  body: "'Inter', sans-serif",
  label: "'JetBrains Mono', monospace",
};

const cardStyle: React.CSSProperties = {
  backgroundColor: colors.creamLight,
  borderRadius: 12,
  boxShadow: "0px 4px 20px rgba(11, 67, 53, 0.08)",
  border: `1px solid ${colors.forestGreen}`,
};

/* ------------------------------------------------------------------ */
/*  Reusable UI Components                                             */
/* ------------------------------------------------------------------ */
const Icon: React.FC<{ name: string; size?: number; filled?: boolean }> = ({
  name,
  size = 18,
  filled = false,
}) => (
  <span
    className="material-symbols-outlined"
    style={{
      fontSize: size,
      lineHeight: 1,
      fontVariationSettings: `'FILL' ${filled ? 1 : 0}, 'wght' 400, 'GRAD' 0, 'opsz' 24`,
    }}
  >
    {name}
  </span>
);

const Avatar: React.FC<{ name: string; size?: number }> = ({ name, size = 28 }) => {
  const initials = name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", backgroundColor: colors.creamMid, color: colors.forestGreen, border: `1px solid ${colors.forestGreen}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: fonts.headline, fontWeight: 700, fontSize: size * 0.4, flexShrink: 0 }}>
      {initials}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Types & Mock data                                                  */
/* ------------------------------------------------------------------ */
type MediaType = "PDF" | "AUDIO" | "VIDEO";
type SourceType = "link" | "upload";
type SortOption = "newest" | "oldest" | "title";

interface PendingMedia {
  id: string; title: string; description: string; type: MediaType; sourceType: SourceType;
  sourceUrl?: string; fileName?: string; fileSize?: string; scholarName: string; scholarId: string;
  submittedBy: string; contributorId: string; date: string; submittedAt: Date;
  flagged: boolean; flagReason?: string; previewUrl?: string; stripped?: boolean;
}

const MEDIA: PendingMedia[] = [
  { id: "med_001", title: "1972 Lecture on Colonizability", description: "Recorded lecture given at the University of Algiers.", type: "AUDIO", sourceType: "upload", fileName: "lecture-1972-colonizability.mp3", fileSize: "38.2 MB", scholarName: "Malek Bennabi", scholarId: "sch_001", submittedBy: "Zaid Al-Hassan", contributorId: "user_zaid", date: "June 18, 2026", submittedAt: new Date("2026-06-18"), flagged: false, previewUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" },
  { id: "med_002", title: "Original Manuscript — Question of Culture", description: "", type: "PDF", sourceType: "upload", fileName: "question-of-culture-ms.pdf", fileSize: "112 MB", scholarName: "Malek Bennabi", scholarId: "sch_001", submittedBy: "Zaid Al-Hassan", contributorId: "user_zaid", date: "June 17, 2026", submittedAt: new Date("2026-06-17"), flagged: true, flagReason: "Missing description", previewUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf" },
  { id: "med_003", title: "Cairo Seminar, 1965", description: "Audio recording of a public seminar at Al-Azhar University.", type: "AUDIO", sourceType: "link", sourceUrl: "https://archive.org/details/example-cairo-seminar", scholarName: "Malek Bennabi", scholarId: "sch_001", submittedBy: "Karim Mansouri", contributorId: "user_karim", date: "June 15, 2026", submittedAt: new Date("2026-06-15"), flagged: false, previewUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3" },
  { id: "med_004", title: "Documentary — The Idea and Thought", description: "Documentary series exploring the scholar's intellectual legacy.", type: "VIDEO", sourceType: "link", sourceUrl: "https://broken-host-example.tv/idea-and-thought", scholarName: "Ibn al-Haytham", scholarId: "sch_002", submittedBy: "Sara Al-Rashid", contributorId: "user_sara", date: "June 13, 2026", submittedAt: new Date("2026-06-13"), flagged: true, flagReason: "Link unreachable", previewUrl: "https://www.w3schools.com/html/mov_bbb.mp4" },
  { id: "med_005", title: "Portrait Collection (1960s)", description: "Photographic archive donated by the family.", type: "PDF", sourceType: "upload", fileName: "portraits-1960s.pdf", fileSize: "24.5 MB", scholarName: "Fatima al-Fihriya", scholarId: "sch_003", submittedBy: "Pedro Alves", contributorId: "user_pedro", date: "June 11, 2026", submittedAt: new Date("2026-06-11"), flagged: false, previewUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf" },
  { id: "med_006", title: "Interview on Astronomy and Faith", description: "Audio interview recorded for a regional radio program.", type: "AUDIO", sourceType: "link", sourceUrl: "https://archive.org/details/example-astronomy-faith", scholarName: "Maryam al-Asturlabiya", scholarId: "sch_004", submittedBy: "Karim Mansouri", contributorId: "user_karim", date: "June 9, 2026", submittedAt: new Date("2026-06-09"), flagged: true, flagReason: "Overdue 4 days", previewUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3" },
  { id: "med_007", title: "Surgical Technique Demonstration (Recreated)", description: "Short documentary recreating historical surgical methods.", type: "VIDEO", sourceType: "upload", fileName: "surgical-technique-demo.mp4", fileSize: "340 MB", scholarName: "Al-Zahrawi", scholarId: "sch_005", submittedBy: "Pedro Alves", contributorId: "user_pedro", date: "June 8, 2026", submittedAt: new Date("2026-06-08"), flagged: false, previewUrl: "https://www.w3schools.com/html/mov_bbb.mp4" },
];

const TYPE_META: Record<MediaType, { icon: string; color: string }> = {
  PDF:   { icon: "picture_as_pdf", color: colors.creamMid },
  AUDIO: { icon: "headphones",     color: colors.creamMid },
  VIDEO: { icon: "movie",          color: colors.creamMid },
};

/* ------------------------------------------------------------------ */
/*  Stats helper                                                       */
/* ------------------------------------------------------------------ */
function getStats(rows: PendingMedia[]) {
  const total = rows.length;
  const priority = rows.filter((r) => r.flagged).length;
  return { total, priority, avgTime: "1h 40m" };
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */
export default function MediaPendingQueue() {
  const { t, lang } = useLang();
  const isRTL = lang === "AR";

  const [filterType, setFilterType] = useState<MediaType | "all">("all");
  const [filterScholar, setFilterScholar] = useState<string>("all");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [rows, setRows] = useState<PendingMedia[]>(MEDIA);
  const [reviewTarget, setReviewTarget] = useState<PendingMedia | null>(null);
  const [checks, setChecks] = useState({ accessible: false, matches: false, legal: false, guidelines: false });
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
  const closeReview = () => { setReviewTarget(null); setApprovalError(""); };

  const handleApprove = (id: string) => { console.log("Quick Approved media:", id); setRows(prev => prev.filter(m => m.id !== id)); };
  const handleApproveFromReview = () => {
    if (!Object.values(checks).every(v => v)) { setApprovalError(t("mediaQueue.review.errorChecks") || "All checks must be completed"); return; }
    if (!reviewTarget) return;
    console.log("Approved media:", reviewTarget.id, "Notes:", reviewNotes);
    setRows(prev => prev.filter(m => m.id !== reviewTarget.id));
    closeReview();
  };
  const handleRejectFromReview = () => {
    if (!reviewTarget) return;
    if (!reviewNotes.trim()) { setApprovalError(t("mediaQueue.review.errorReject") || "Rejection reason required"); return; }
    console.log("Rejected media:", reviewTarget.id, "Notes:", reviewNotes);
    setRows(prev => prev.filter(m => m.id !== reviewTarget.id));
    closeReview();
  };
  const confirmDelete = () => {
    if (!deleteTarget) return;
    console.log("Deleted media:", deleteTarget.id, "note:", deleteNote);
    setRows(prev => prev.filter(m => m.id !== deleteTarget.id));
    setDeleteTarget(null); setDeleteNote("");
    if (reviewTarget?.id === deleteTarget.id) closeReview();
  };
  const confirmReject = () => {
    if (!rejectTarget) return;
    console.log("Rejected media:", rejectTarget.id, "note:", rejectNote);
    setRows(prev => prev.filter(m => m.id !== rejectTarget.id));
    setRejectTarget(null); setRejectNote("");
  };
  const confirmStrip = () => {
    if (!stripTarget) return;
    setRows((prev) => prev.map((row) => row.id === stripTarget.id ? { ...row, submittedBy: "System (stripped)", contributorId: "system", stripped: true } : row));
    console.log(`Stripped contributor from media "${stripTarget.title}"`);
    setStripTarget(null);
  };

  const renderMedia = () => {
    if (!reviewTarget) return null;
    if (!reviewTarget.previewUrl) {
      return (
        <div style={{ color: colors.forestGreen, textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 12, padding: 40 }}>
          <Icon name="broken_image" size={64} />
          <p style={{ fontSize: 14, margin: 0, maxWidth: 300, lineHeight: 1.5 }}>Preview not available. Please download the file to review.</p>
        </div>
      );
    }
    switch (reviewTarget.type) {
      case "PDF": return <iframe src={reviewTarget.previewUrl} title="PDF Preview" style={{ width: "100%", height: "100%", border: "none", background: "white" }} />;
      case "AUDIO": return <audio controls src={reviewTarget.previewUrl} style={{ width: "80%" }} />;
      case "VIDEO": return <video controls src={reviewTarget.previewUrl} style={{ width: "100%", height: "100%", objectFit: "contain" }} />;
      default: return <div style={{ color: colors.forestGreen, textAlign: "center" }}><Icon name="error" size={64} /><p>Unsupported media type.</p></div>;
    }
  };

  const thStyle: React.CSSProperties = { fontFamily: fonts.label, fontSize: 11, letterSpacing: "0.06em", fontWeight: 600, color: colors.forestGreen, textAlign: isRTL ? "right" : "left", padding: "12px 14px", borderBottom: `1px solid ${colors.forestGreen}`, textTransform: "uppercase", opacity: 0.8 };
  const tdStyle: React.CSSProperties = { fontFamily: fonts.body, fontSize: 13, color: colors.forestGreen, padding: "14px", borderBottom: `1px solid ${colors.creamDark}`, textAlign: isRTL ? "right" : "left" };

  const statItems = [
    { icon: "perm_media", label: t("mediaQueue.stats.totalPending") || "Total Pending", value: stats.total.toString(), color: colors.forestGreen, filled: true },
    { icon: "flag", label: t("mediaQueue.stats.priorityReviews") || "Priority Reviews", value: stats.priority.toString(), color: colors.red, filled: false, isPriority: true },
    { icon: "schedule", label: t("mediaQueue.stats.avgTime") || "Avg Time", value: stats.avgTime, color: colors.forestGreen, filled: false },
  ];

  const selectStyle: React.CSSProperties = { border: "none", outline: "none", background: "transparent", fontFamily: fonts.body, fontSize: 13, color: colors.forestGreen, cursor: "pointer", minWidth: 140 };

  return (
    <div dir={isRTL ? "rtl" : "ltr"} style={{ fontFamily: fonts.body, color: colors.forestGreen, backgroundColor: colors.creamLight, minHeight: "100vh", padding: 24 }}>
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>

        {/* ── Page Header ── */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <span style={{ fontFamily: fonts.label, fontSize: 11, letterSpacing: "0.08em", color: colors.forestGreen, opacity: 0.7 }}>ADMIN / MEDIA QUEUE</span>
          </div>
          <h1 style={{ fontFamily: fonts.headline, fontSize: 28, fontWeight: 700, color: colors.forestGreen, margin: "0 0 6px" }}>{t("mediaQueue.title") || "Media Pending Queue"}</h1>
          <p style={{ fontFamily: fonts.body, fontSize: 13, color: colors.forestGreen, opacity: 0.75, margin: 0 }}>{t("mediaQueue.subtitle") || "Review and approve pending media submissions."}</p>
        </div>

        {/* ── Stat Cards ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14, marginBottom: 18 }}>
          {statItems.map((s) => (
            <div key={s.label} style={{ ...cardStyle, padding: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
  <div style={{ width: 28, height: 28, borderRadius: 6, backgroundColor: colors.creamMid, color: colors.forestGreen, border: `1px solid ${colors.forestGreen}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
    <Icon name={s.icon} size={16} />
  </div>
</div>
              <p style={{ fontFamily: fonts.label, fontSize: 11, letterSpacing: "0.05em", color: colors.forestGreen, margin: "0 0 4px", opacity: 0.7 }}>{s.label}</p>
              <p style={{ fontFamily: fonts.headline, fontSize: 24, fontWeight: 700, color: s.isPriority ? colors.red : colors.forestGreen, margin: "0 0 4px", lineHeight: 1 }}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* ── Filter Bar ── */}
        <div style={{ ...cardStyle, padding: 12, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 240, flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 10px", backgroundColor: colors.creamMid, border: `1px solid ${colors.forestGreen}`, borderRadius: 8 }}>
              <select value={filterType} onChange={(e) => setFilterType(e.target.value as any)} style={selectStyle}>
                <option value="all">{t("mediaQueue.filters.allTypes") || "All Types"}</option>
                <option value="PDF">PDF</option>
                <option value="AUDIO">Audio</option>
                <option value="VIDEO">Video</option>
              </select>
              <Icon name="expand_more" size={16} />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 10px", backgroundColor: colors.creamMid, border: `1px solid ${colors.forestGreen}`, borderRadius: 8 }}>
              <select value={filterScholar} onChange={(e) => setFilterScholar(e.target.value)} style={selectStyle}>
                <option value="all">{t("mediaQueue.filters.allScholars") || "All Scholars"}</option>
                {scholars.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <Icon name="expand_more" size={16} />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 10px", backgroundColor: colors.creamMid, border: `1px solid ${colors.forestGreen}`, borderRadius: 8 }}>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)} style={selectStyle}>
                <option value="newest">{t("mediaQueue.sort.newest") || "Newest"}</option>
                <option value="oldest">{t("mediaQueue.sort.oldest") || "Oldest"}</option>
                <option value="title">{t("mediaQueue.sort.titleAZ") || "Title A-Z"}</option>
              </select>
              <Icon name="expand_more" size={16} />
            </div>
            {hasActiveFilters && (
              <button onClick={clearFilters} style={{ display: "flex", alignItems: "center", gap: 4, padding: "6px 10px", backgroundColor: "transparent", border: `1px solid ${colors.red}`, borderRadius: 8, fontFamily: fonts.body, fontSize: 12, fontWeight: 500, color: colors.red, cursor: "pointer" }}>
                <Icon name="close" size={14} /> Clear
              </button>
            )}
          </div>
        </div>

        {/* ── Table ── */}
        <section style={{ ...cardStyle, overflow: "hidden" }}>
          <div style={{ padding: "14px 20px", borderBottom: `1px solid ${colors.forestGreen}`, display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: colors.creamMid }}>
            <h3 style={{ fontFamily: fonts.headline, fontSize: 16, fontWeight: 600, color: colors.forestGreen, margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
              <Icon name="perm_media" size={20} /> {t("mediaQueue.table.title") || "Pending Media"}
            </h3>
            <span style={{ fontFamily: fonts.label, fontSize: 11, padding: "4px 10px", borderRadius: 9999, backgroundColor: colors.creamLight, color: colors.forestGreen, border: `1px solid ${colors.forestGreen}` }}>
              {t("mediaQueue.table.updated") || "Updated just now"}
            </span>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 900 }}>
              <thead style={{ backgroundColor: colors.creamMid }}>
                <tr>
                  <th style={thStyle}>{t("mediaQueue.table.media") || "Media"}</th>
                  <th style={thStyle}>{t("mediaQueue.table.type") || "Type"}</th>
                  <th style={thStyle}>{t("mediaQueue.table.source") || "Source"}</th>
                  <th style={thStyle}>{t("mediaQueue.table.scholar") || "Scholar"}</th>
                  <th style={thStyle}>{t("mediaQueue.table.submitter") || "Submitter"}</th>
                  <th style={thStyle}>{t("mediaQueue.table.submitted") || "Submitted"}</th>
                  <th style={{ ...thStyle, textAlign: isRTL ? "left" : "right" }}>{t("mediaQueue.table.actions") || "Actions"}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: 40, textAlign: "center", color: colors.forestGreen, opacity: 0.7 }}>
                      <Icon name="inbox" size={48} />
                      <p style={{ fontFamily: fonts.body, fontSize: 14, marginTop: 12 }}>{t("mediaQueue.table.empty") || "No media found."}</p>
                    </td>
                  </tr>
                ) : (
                  filtered.map((m) => {
                    const meta = TYPE_META[m.type];
                    return (
                      <tr key={m.id} style={{ transition: "background-color 0.15s", opacity: m.stripped ? 0.5 : 1 }} onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = colors.creamMid)} onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}>
                        <td style={tdStyle}>
                          <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                            <div style={{ width: 36, height: 36, borderRadius: 8, backgroundColor: meta.color, border: `1px solid ${colors.forestGreen}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                              <Icon name={meta.icon} size={18} />
                            </div>
                            <div>
                              <p style={{ margin: 0, fontWeight: 600, fontFamily: fonts.headline, fontSize: 13, color: colors.forestGreen, textDecoration: m.stripped ? "line-through" : "none" }}>
                                {m.title}
                                {m.stripped && (
                                  <span style={{ marginLeft: 6, padding: "2px 6px", borderRadius: 9999, backgroundColor: colors.red, color: colors.creamLight, fontFamily: fonts.label, fontSize: 9, fontWeight: 700, letterSpacing: "0.04em" }}>STRIPPED</span>
                                )}
                              </p>
                              {m.description && <p style={{ margin: "2px 0 0", fontFamily: fonts.body, fontSize: 11, color: colors.forestGreen, opacity: 0.7, maxWidth: 260, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.description}</p>}
                              {m.flagged && (
                                <p style={{ margin: "3px 0 0", fontFamily: fonts.label, fontSize: 10, color: colors.red, fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
                                  <Icon name="flag" size={12} /> {m.flagReason}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td style={tdStyle}>
                          <span style={{ fontFamily: fonts.label, fontSize: 10, fontWeight: 700, padding: "4px 10px", borderRadius: 9999, backgroundColor: colors.creamMid, color: colors.forestGreen, border: `1px solid ${colors.creamDark}`, letterSpacing: "0.04em" }}>
                            {m.type}
                          </span>
                        </td>
                        <td style={tdStyle}>
                          {m.sourceType === "link" ? (
                            <a href={m.sourceUrl} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 4, fontFamily: fonts.body, fontSize: 12, color: colors.forestGreen, textDecoration: "none", fontWeight: 600 }}>
                              <Icon name="link" size={14} /> {t("mediaQueue.source.link") || "View Link"}
                            </a>
                          ) : (
                            <div>
                              <p style={{ margin: 0, display: "flex", alignItems: "center", gap: 4, fontFamily: fonts.body, fontSize: 12, color: colors.forestGreen, fontWeight: 600 }}>
                                <Icon name="upload_file" size={14} /> {m.fileName}
                              </p>
                              <p style={{ margin: "2px 0 0", fontFamily: fonts.label, fontSize: 10, color: colors.forestGreen, opacity: 0.7 }}>{m.fileSize}</p>
                            </div>
                          )}
                        </td>
                        <td style={tdStyle}><span style={{ fontFamily: fonts.body, fontSize: 13, fontWeight: 500 }}>{m.scholarName}</span></td>
                        <td style={tdStyle}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <Avatar name={m.submittedBy} size={28} />
                            <span style={{ fontFamily: fonts.body, fontSize: 13, textDecoration: m.stripped ? "line-through" : "none" }}>{m.submittedBy}</span>
                          </div>
                        </td>
                        <td style={{ ...tdStyle, fontFamily: fonts.label, fontSize: 12 }}>{m.date}</td>
                        <td style={{ ...tdStyle, textAlign: isRTL ? "left" : "right" }}>
                          <div style={{ display: "flex", justifyContent: isRTL ? "flex-start" : "flex-end", gap: 6 }}>
                            <button onClick={() => openReview(m)} title="Review" style={{ width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "transparent", border: `1px solid ${colors.forestGreen}`, borderRadius: 6, color: colors.forestGreen, cursor: "pointer" }}>
                              <Icon name="visibility" size={18} />
                            </button>
                            <button onClick={() => handleApprove(m.id)} title="Approve" style={{ width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: colors.forestGreen, border: `1px solid ${colors.forestGreen}`, borderRadius: 6, color: colors.creamLight, cursor: "pointer" }}>
                              <Icon name="check" size={18} filled />
                            </button>
                            <button onClick={() => setRejectTarget(m)} title="Reject" style={{ width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "transparent", border: `1px solid ${colors.red}`, borderRadius: 6, color: colors.red, cursor: "pointer" }}>
                              <Icon name="close" size={18} />
                            </button>
                            <button onClick={() => !m.stripped && setStripTarget(m)} title={m.stripped ? "Already stripped" : "Strip"} disabled={m.stripped} style={{ width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "transparent", border: `1px solid ${colors.forestGreen}`, borderRadius: 6, color: colors.forestGreen, cursor: m.stripped ? "not-allowed" : "pointer", opacity: m.stripped ? 0.4 : 1 }}>
                              <Icon name={m.stripped ? "check_circle" : "person_remove"} size={18} />
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
        </section>

        {/* ── Review Modal ── */}
        {reviewTarget && (
          <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(11, 67, 53, 0.6)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)", padding: 20 }} onClick={closeReview}>
            <div style={{ ...cardStyle, backgroundColor: colors.creamLight, width: "90vw", maxWidth: 1100, height: "85vh", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }} onClick={(e) => e.stopPropagation()}>
              <div style={{ padding: "16px 24px", borderBottom: `1px solid ${colors.forestGreen}`, display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: colors.creamMid }}>
                <h3 style={{ fontFamily: fonts.headline, fontSize: 18, fontWeight: 700, color: colors.forestGreen, margin: 0, display: "flex", alignItems: "center", gap: 10 }}>
                  <Icon name="fact_check" size={22} /> {t("mediaQueue.review.title") || "Review Media"}
                </h3>
                <button onClick={closeReview} style={{ background: "none", border: "none", cursor: "pointer", color: colors.forestGreen, padding: 4, borderRadius: 6, display: "flex", alignItems: "center" }}>
                  <Icon name="close" size={22} />
                </button>
              </div>
              <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
                <div style={{ flex: 1.2, backgroundColor: "#191c1b", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
                  {renderMedia()}
                </div>
                <div style={{ flex: 1, padding: 24, overflowY: "auto", display: "flex", flexDirection: "column", gap: 20, borderLeft: `1px solid ${colors.forestGreen}`, backgroundColor: colors.creamLight }}>
                  <div style={{ paddingBottom: 16, borderBottom: `1px solid ${colors.creamDark}` }}>
                    <h4 style={{ fontFamily: fonts.label, fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: colors.forestGreen, margin: "0 0 12px", opacity: 0.8 }}>{t("mediaQueue.review.detailsTitle") || "Details"}</h4>
                    {[
                      { label: t("mediaQueue.review.label.title") || "Title", value: reviewTarget.title, bold: true },
                      ...(reviewTarget.description ? [{ label: t("mediaQueue.review.label.description") || "Description", value: reviewTarget.description }] : []),
                      { label: t("mediaQueue.review.label.scholar") || "Scholar", value: reviewTarget.scholarName },
                      { label: t("mediaQueue.review.label.submittedBy") || "Submitted By", value: `${reviewTarget.submittedBy} (${reviewTarget.date})` },
                    ].map((row, i) => (
                      <div key={i} style={{ display: "flex", gap: 8, fontSize: 13, marginBottom: 6 }}>
                        <span style={{ fontWeight: 600, color: colors.forestGreen, opacity: 0.7, minWidth: 90 }}>{row.label}:</span>
                        <span style={{ color: colors.forestGreen, fontWeight: row.bold ? 600 : 400 }}>{row.value}</span>
                      </div>
                    ))}
                  </div>
                  <div>
                    <h4 style={{ fontFamily: fonts.label, fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: colors.forestGreen, margin: "0 0 12px", opacity: 0.8 }}>{t("mediaQueue.review.checksTitle") || "Checklist"}</h4>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {[
                        { key: "accessible", label: t("mediaQueue.review.check1") || "Media is accessible" },
                        { key: "matches", label: t("mediaQueue.review.check2") || "Content matches scholar" },
                        { key: "legal", label: t("mediaQueue.review.check3") || "Legal rights cleared" },
                        { key: "guidelines", label: t("mediaQueue.review.check4") || "Follows guidelines" },
                      ].map((item) => (
                        <label key={item.key} style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 13, color: colors.forestGreen, cursor: "pointer" }}>
                          <input type="checkbox" checked={(checks as any)[item.key]} onChange={(e) => setChecks({ ...checks, [item.key]: e.target.checked })} style={{ marginTop: 2, width: 16, height: 16, accentColor: colors.forestGreen, cursor: "pointer" }} />
                          <span>{item.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 style={{ fontFamily: fonts.label, fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: colors.forestGreen, margin: "0 0 12px", opacity: 0.8 }}>{t("mediaQueue.review.notesTitle") || "Notes"}</h4>
                    <textarea value={reviewNotes} onChange={(e) => setReviewNotes(e.target.value)} placeholder={t("mediaQueue.review.notesPlaceholder") || "Add review notes..."} style={{ width: "100%", minHeight: 90, border: `1px solid ${colors.creamDark}`, borderRadius: 7, padding: "10px 12px", fontFamily: fonts.body, fontSize: 13, color: colors.forestGreen, resize: "vertical", outline: "none", boxSizing: "border-box", backgroundColor: colors.creamMid }} />
                  </div>
                  {approvalError && (
                    <div style={{ fontSize: 12, color: colors.red, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
                      <Icon name="error" size={16} /> {approvalError}
                    </div>
                  )}
                  <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: "auto", paddingTop: 16, borderTop: `1px solid ${colors.creamDark}` }}>
                    <button onClick={() => { setDeleteTarget(reviewTarget); closeReview(); }} style={{ padding: "10px 16px", borderRadius: 8, cursor: "pointer", border: `1px solid ${colors.red}`, backgroundColor: "transparent", color: colors.red, fontFamily: fonts.body, fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
                      <Icon name="delete" size={16} /> {t("mediaQueue.actions.delete") || "Delete"}
                    </button>
                    <div style={{ flex: 1 }} />
                    <button onClick={handleRejectFromReview} style={{ padding: "10px 20px", borderRadius: 8, cursor: "pointer", border: `1px solid ${colors.forestGreen}`, backgroundColor: "transparent", color: colors.forestGreen, fontFamily: fonts.body, fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
                      <Icon name="cancel" size={16} /> {t("mediaQueue.actions.reject") || "Reject"}
                    </button>
                    <button onClick={handleApproveFromReview} style={{ padding: "10px 24px", borderRadius: 8, cursor: "pointer", border: "none", backgroundColor: colors.forestGreen, color: colors.creamLight, fontFamily: fonts.body, fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
                      <Icon name="check_circle" size={16} filled /> {t("mediaQueue.actions.approve") || "Approve"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Reject Modal ── */}
        {rejectTarget && (
          <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(11, 67, 53, 0.5)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }} onClick={() => { setRejectTarget(null); setRejectNote(""); }}>
            <div style={{ ...cardStyle, backgroundColor: colors.creamLight, width: 440, maxWidth: "90vw", padding: 32, boxShadow: "0 20px 60px rgba(0,0,0,0.18)" }} onClick={(e) => e.stopPropagation()}>
              <div style={{ width: 56, height: 56, borderRadius: "50%", backgroundColor: colors.red, color: colors.creamLight, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20, border: `1px solid ${colors.red}` }}>
                <Icon name="cancel" size={28} filled />
              </div>
              <h2 style={{ fontFamily: fonts.headline, fontSize: 20, fontWeight: 700, color: colors.forestGreen, marginBottom: 12 }}>{t("mediaQueue.modal.rejectTitle") || "Reject Submission"}</h2>
              <p style={{ fontFamily: fonts.body, fontSize: 14, color: colors.forestGreen, lineHeight: 1.6, marginBottom: 16, opacity: 0.8 }}>
                {(t("mediaQueue.modal.rejectBody") || `Reject "${rejectTarget.title}"?`).replace("{title}", rejectTarget.title)}
              </p>
              <textarea value={rejectNote} onChange={(e) => setRejectNote(e.target.value)} placeholder={t("mediaQueue.modal.rejectPlaceholder") || "Reason for rejection..."} style={{ width: "100%", minHeight: 90, border: `1px solid ${colors.creamDark}`, borderRadius: 7, padding: "10px 12px", fontFamily: fonts.body, fontSize: 13, color: colors.forestGreen, resize: "vertical", outline: "none", boxSizing: "border-box", backgroundColor: colors.creamMid, marginBottom: 20 }} />
              <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
                <button onClick={() => { setRejectTarget(null); setRejectNote(""); }} style={{ padding: "10px 24px", borderRadius: 8, cursor: "pointer", border: `1px solid ${colors.forestGreen}`, backgroundColor: colors.creamLight, fontFamily: fonts.body, fontSize: 13, fontWeight: 600, color: colors.forestGreen }}>{t("mediaQueue.modal.cancel") || "Cancel"}</button>
                <button onClick={confirmReject} style={{ padding: "10px 24px", borderRadius: 8, cursor: "pointer", border: "none", backgroundColor: colors.red, color: colors.creamLight, fontFamily: fonts.body, fontSize: 13, fontWeight: 700 }}>{t("mediaQueue.modal.confirm") || "Confirm Reject"}</button>
              </div>
            </div>
          </div>
        )}

        {/* ── Delete Modal ── */}
        {deleteTarget && (
          <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(11, 67, 53, 0.5)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }} onClick={() => { setDeleteTarget(null); setDeleteNote(""); }}>
            <div style={{ ...cardStyle, backgroundColor: colors.creamLight, width: 440, maxWidth: "90vw", padding: 32, boxShadow: "0 20px 60px rgba(0,0,0,0.18)" }} onClick={(e) => e.stopPropagation()}>
              <div style={{ width: 56, height: 56, borderRadius: "50%", backgroundColor: colors.red, color: colors.creamLight, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20, border: `1px solid ${colors.red}` }}>
                <Icon name="delete_forever" size={28} filled />
              </div>
              <h2 style={{ fontFamily: fonts.headline, fontSize: 20, fontWeight: 700, color: colors.forestGreen, marginBottom: 12 }}>Delete Submission?</h2>
              <p style={{ fontFamily: fonts.body, fontSize: 14, color: colors.forestGreen, lineHeight: 1.6, marginBottom: 16, opacity: 0.8 }}>
                Are you sure you want to permanently delete "{deleteTarget.title}"? This action cannot be undone.
              </p>
              <textarea value={deleteNote} onChange={(e) => setDeleteNote(e.target.value)} placeholder="Reason for deletion (optional)..." style={{ width: "100%", minHeight: 90, border: `1px solid ${colors.creamDark}`, borderRadius: 7, padding: "10px 12px", fontFamily: fonts.body, fontSize: 13, color: colors.forestGreen, resize: "vertical", outline: "none", boxSizing: "border-box", backgroundColor: colors.creamMid, marginBottom: 20 }} />
              <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
                <button onClick={() => { setDeleteTarget(null); setDeleteNote(""); }} style={{ padding: "10px 24px", borderRadius: 8, cursor: "pointer", border: `1px solid ${colors.forestGreen}`, backgroundColor: colors.creamLight, fontFamily: fonts.body, fontSize: 13, fontWeight: 600, color: colors.forestGreen }}>Cancel</button>
                <button onClick={confirmDelete} style={{ padding: "10px 24px", borderRadius: 8, cursor: "pointer", border: "none", backgroundColor: colors.red, color: colors.creamLight, fontFamily: fonts.body, fontSize: 13, fontWeight: 700 }}>Delete</button>
              </div>
            </div>
          </div>
        )}

        {/* ── Strip Modal ── */}
        {stripTarget && (
          <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(11, 67, 53, 0.5)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }} onClick={() => setStripTarget(null)}>
            <div style={{ ...cardStyle, backgroundColor: colors.creamLight, width: 440, maxWidth: "90vw", padding: 32, boxShadow: "0 20px 60px rgba(0,0,0,0.18)" }} onClick={(e) => e.stopPropagation()}>
              <div style={{ width: 56, height: 56, borderRadius: "50%", backgroundColor: colors.red, color: colors.creamLight, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20, border: `1px solid ${colors.red}` }}>
                <Icon name="person_remove" size={28} filled />
              </div>
              <h2 style={{ fontFamily: fonts.headline, fontSize: 20, fontWeight: 700, color: colors.forestGreen, marginBottom: 12 }}>{t("mediaQueue.strip.title") || "Strip Contributor"}</h2>
              <p style={{ fontFamily: fonts.body, fontSize: 14, color: colors.forestGreen, lineHeight: 1.6, marginBottom: 28, opacity: 0.8 }}>
                <span dangerouslySetInnerHTML={{ __html: (t("mediaQueue.strip.body") || `Strip ${stripTarget.submittedBy} from "${stripTarget.title}"?`).replace("{name}", stripTarget.submittedBy).replace("{title}", stripTarget.title) }} />
                <br /><br />
                <b style={{ color: colors.red }}>{t("mediaQueue.strip.warning") || "This action cannot be undone."}</b>
              </p>
              <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
                <button onClick={() => setStripTarget(null)} style={{ padding: "10px 24px", borderRadius: 8, cursor: "pointer", border: `1px solid ${colors.forestGreen}`, backgroundColor: colors.creamLight, fontFamily: fonts.body, fontSize: 13, fontWeight: 600, color: colors.forestGreen }}>{t("mediaQueue.strip.cancel") || "Cancel"}</button>
                <button onClick={confirmStrip} style={{ padding: "10px 24px", borderRadius: 8, cursor: "pointer", border: "none", backgroundColor: colors.red, color: colors.creamLight, fontFamily: fonts.body, fontSize: 13, fontWeight: 700 }}>{t("mediaQueue.strip.confirm") || "Confirm"}</button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}