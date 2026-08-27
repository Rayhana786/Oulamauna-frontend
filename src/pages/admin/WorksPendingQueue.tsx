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
type WorkFormat = "Book" | "Article" | "Manuscript" | "Lecture" | "Letter" | "Other";
type AccessType = "none" | "upload" | "link";
type SortOption = "newest" | "oldest" | "title";

interface PendingWork {
  id: string; title: string; year: string; format: WorkFormat; accessType: AccessType;
  accessUrl?: string; fileName?: string; fileSize?: string; scholarName: string; scholarId: string;
  submittedBy: string; contributorId: string; date: string; submittedAt: Date;
  flagged: boolean; flagReason?: string; stripped?: boolean;
}

const WORKS: PendingWork[] = [
  { id: "work_001", title: "The Problem of Culture", year: "1959", format: "Book", accessType: "upload", fileName: "problem-of-culture.pdf", fileSize: "12.4 MB", scholarName: "Malek Bennabi", scholarId: "sch_001", submittedBy: "Zaid Al-Hassan", contributorId: "user_zaid", date: "June 18, 2026", submittedAt: new Date("2026-06-18"), flagged: false },
  { id: "work_002", title: "Vocation of Islam", year: "1954", format: "Book", accessType: "link", accessUrl: "https://archive.org/details/vocation-islam", scholarName: "Malek Bennabi", scholarId: "sch_001", submittedBy: "Zaid Al-Hassan", contributorId: "user_zaid", date: "June 17, 2026", submittedAt: new Date("2026-06-17"), flagged: true, flagReason: "Link needs verification" },
  { id: "work_003", title: "Colonizability: The Tragic Vision", year: "1968", format: "Lecture", accessType: "none", scholarName: "Malek Bennabi", scholarId: "sch_001", submittedBy: "Karim Mansouri", contributorId: "user_karim", date: "June 15, 2026", submittedAt: new Date("2026-06-15"), flagged: false },
  { id: "work_004", title: "Book of Healing", year: "1027", format: "Manuscript", accessType: "upload", fileName: "book-of-healing-ms.pdf", fileSize: "89.2 MB", scholarName: "Ibn Sina", scholarId: "sch_002", submittedBy: "Sara Al-Rashid", contributorId: "user_sara", date: "June 13, 2026", submittedAt: new Date("2026-06-13"), flagged: true, flagReason: "Large file needs review" },
  { id: "work_005", title: "Muqaddimah", year: "1377", format: "Book", accessType: "link", accessUrl: "https://example.com/muqaddimah", scholarName: "Ibn Khaldun", scholarId: "sch_003", submittedBy: "Pedro Alves", contributorId: "user_pedro", date: "June 11, 2026", submittedAt: new Date("2026-06-11"), flagged: false },
  { id: "work_006", title: "Letter to Al-Mu'azzam", year: "1215", format: "Letter", accessType: "none", scholarName: "Ibn Arabi", scholarId: "sch_004", submittedBy: "Karim Mansouri", contributorId: "user_karim", date: "June 9, 2026", submittedAt: new Date("2026-06-09"), flagged: true, flagReason: "Overdue 4 days" },
];

const FORMAT_META: Record<WorkFormat, { icon: string; color: string }> = {
  Book: { icon: "menu_book", color: colors.creamMid },
  Article: { icon: "article", color: colors.creamMid },
  Manuscript: { icon: "history_edu", color: colors.creamMid },
  Lecture: { icon: "record_voice_over", color: colors.creamMid },
  Letter: { icon: "mail", color: colors.creamMid },
  Other: { icon: "description", color: colors.creamMid },
};

/* ------------------------------------------------------------------ */
/*  Stats helper                                                       */
/* ------------------------------------------------------------------ */
function getStats(rows: PendingWork[]) {
  const total = rows.length;
  const priority = rows.filter((r) => r.flagged).length;
  return { total, priority, avgTime: "1h 55m" };
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */
export default function WorksPendingQueue() {
  const { t, lang } = useLang();
  const isRTL = lang === "AR";

  const [filterFormat, setFilterFormat] = useState<WorkFormat | "all">("all");
  const [filterScholar, setFilterScholar] = useState<string>("all");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [rows, setRows] = useState<PendingWork[]>(WORKS);
  const [reviewTarget, setReviewTarget] = useState<PendingWork | null>(null);
  const [checks, setChecks] = useState({ accurate: false, complete: false, rights: false, guidelines: false });
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
  const closeReview = () => { setReviewTarget(null); setApprovalError(""); };

  const handleApprove = (id: string) => { console.log("Quick Approved work:", id); setRows(prev => prev.filter(w => w.id !== id)); };
  const handleApproveFromReview = () => {
    if (!Object.values(checks).every(v => v)) { setApprovalError(t("worksQueue.review.errorChecks") || "All checks must be completed"); return; }
    if (!reviewTarget) return;
    console.log("Approved work:", reviewTarget.id, "Notes:", reviewNotes);
    setRows(prev => prev.filter(w => w.id !== reviewTarget.id));
    closeReview();
  };
  const handleRejectFromReview = () => {
    if (!reviewTarget) return;
    if (!reviewNotes.trim()) { setApprovalError(t("worksQueue.review.errorReject") || "Rejection reason required"); return; }
    console.log("Rejected work:", reviewTarget.id, "Notes:", reviewNotes);
    setRows(prev => prev.filter(w => w.id !== reviewTarget.id));
    closeReview();
  };
  const confirmDelete = () => {
    if (!deleteTarget) return;
    console.log("Deleted work:", deleteTarget.id, "note:", deleteNote);
    setRows(prev => prev.filter(w => w.id !== deleteTarget.id));
    setDeleteTarget(null); setDeleteNote("");
    if (reviewTarget?.id === deleteTarget.id) closeReview();
  };
  const confirmReject = () => {
    if (!rejectTarget) return;
    console.log("Rejected work:", rejectTarget.id, "note:", rejectNote);
    setRows(prev => prev.filter(w => w.id !== rejectTarget.id));
    setRejectTarget(null); setRejectNote("");
  };
  const confirmStrip = () => {
    if (!stripTarget) return;
    setRows((prev) => prev.map((row) => row.id === stripTarget.id ? { ...row, submittedBy: "System (stripped)", contributorId: "system", stripped: true } : row));
    console.log(`Stripped contributor from work "${stripTarget.title}"`);
    setStripTarget(null);
  };

  const thStyle: React.CSSProperties = { fontFamily: fonts.label, fontSize: 11, letterSpacing: "0.06em", fontWeight: 600, color: colors.forestGreen, textAlign: isRTL ? "right" : "left", padding: "12px 14px", borderBottom: `1px solid ${colors.forestGreen}`, textTransform: "uppercase", opacity: 0.8 };
  const tdStyle: React.CSSProperties = { fontFamily: fonts.body, fontSize: 13, color: colors.forestGreen, padding: "14px", borderBottom: `1px solid ${colors.creamDark}`, textAlign: isRTL ? "right" : "left" };

  const statItems = [
    { icon: "library_books", label: t("worksQueue.stats.totalPending") || "Total Pending", value: stats.total.toString(), color: colors.forestGreen, filled: true },
    { icon: "flag", label: t("worksQueue.stats.priorityReviews") || "Priority Reviews", value: stats.priority.toString(), color: colors.red, filled: false, isPriority: true },
    { icon: "schedule", label: t("worksQueue.stats.avgTime") || "Avg Time", value: stats.avgTime, color: colors.forestGreen, filled: false },
  ];

  const selectStyle: React.CSSProperties = { border: "none", outline: "none", background: "transparent", fontFamily: fonts.body, fontSize: 13, color: colors.forestGreen, cursor: "pointer", minWidth: 140 };

  return (
    <div dir={isRTL ? "rtl" : "ltr"} style={{ fontFamily: fonts.body, color: colors.forestGreen, backgroundColor: colors.creamLight, minHeight: "100vh", padding: 24 }}>
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>

        {/* ── Page Header ── */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <span style={{ fontFamily: fonts.label, fontSize: 11, letterSpacing: "0.08em", color: colors.forestGreen, opacity: 0.7 }}>ADMIN / WORKS QUEUE</span>
          </div>
          <h1 style={{ fontFamily: fonts.headline, fontSize: 28, fontWeight: 700, color: colors.forestGreen, margin: "0 0 6px" }}>{t("worksQueue.title") || "Works Pending Queue"}</h1>
          <p style={{ fontFamily: fonts.body, fontSize: 13, color: colors.forestGreen, opacity: 0.75, margin: 0 }}>{t("worksQueue.subtitle") || "Review and approve pending work submissions."}</p>
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
              <select value={filterFormat} onChange={(e) => setFilterFormat(e.target.value as any)} style={selectStyle}>
                <option value="all">{t("worksQueue.filters.allFormats") || "All Formats"}</option>
                <option value="Book">Book</option>
                <option value="Article">Article</option>
                <option value="Manuscript">Manuscript</option>
                <option value="Lecture">Lecture</option>
                <option value="Letter">Letter</option>
                <option value="Other">Other</option>
              </select>
              <Icon name="expand_more" size={16} />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 10px", backgroundColor: colors.creamMid, border: `1px solid ${colors.forestGreen}`, borderRadius: 8 }}>
              <select value={filterScholar} onChange={(e) => setFilterScholar(e.target.value)} style={selectStyle}>
                <option value="all">{t("worksQueue.filters.allScholars") || "All Scholars"}</option>
                {scholars.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <Icon name="expand_more" size={16} />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 10px", backgroundColor: colors.creamMid, border: `1px solid ${colors.forestGreen}`, borderRadius: 8 }}>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)} style={selectStyle}>
                <option value="newest">{t("worksQueue.sort.newest") || "Newest"}</option>
                <option value="oldest">{t("worksQueue.sort.oldest") || "Oldest"}</option>
                <option value="title">{t("worksQueue.sort.titleAZ") || "Title A-Z"}</option>
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
              <Icon name="library_books" size={20} /> {t("worksQueue.table.title") || "Pending Works"}
            </h3>
            <span style={{ fontFamily: fonts.label, fontSize: 11, padding: "4px 10px", borderRadius: 9999, backgroundColor: colors.creamLight, color: colors.forestGreen, border: `1px solid ${colors.forestGreen}` }}>
              {t("worksQueue.table.updated") || "Updated just now"}
            </span>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 900 }}>
              <thead style={{ backgroundColor: colors.creamMid }}>
                <tr>
                  <th style={thStyle}>{t("worksQueue.table.work") || "Work"}</th>
                  <th style={thStyle}>{t("worksQueue.table.format") || "Format"}</th>
                  <th style={thStyle}>{t("worksQueue.table.access") || "Access"}</th>
                  <th style={thStyle}>{t("worksQueue.table.scholar") || "Scholar"}</th>
                  <th style={thStyle}>{t("worksQueue.table.submitter") || "Submitter"}</th>
                  <th style={thStyle}>{t("worksQueue.table.submitted") || "Submitted"}</th>
                  <th style={{ ...thStyle, textAlign: isRTL ? "left" : "right" }}>{t("worksQueue.table.actions") || "Actions"}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: 40, textAlign: "center", color: colors.forestGreen, opacity: 0.7 }}>
                      <Icon name="inbox" size={48} />
                      <p style={{ fontFamily: fonts.body, fontSize: 14, marginTop: 12 }}>{t("worksQueue.table.empty") || "No works found."}</p>
                    </td>
                  </tr>
                ) : (
                  filtered.map((w) => {
                    const meta = FORMAT_META[w.format];
                    return (
                      <tr key={w.id} style={{ transition: "background-color 0.15s", opacity: w.stripped ? 0.5 : 1 }} onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = colors.creamMid)} onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}>
                        <td style={tdStyle}>
                          <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                            <div style={{ width: 36, height: 36, borderRadius: 8, backgroundColor: meta.color, border: `1px solid ${colors.forestGreen}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                              <Icon name={meta.icon} size={18} />
                            </div>
                            <div>
                              <p style={{ margin: 0, fontWeight: 600, fontFamily: fonts.headline, fontSize: 13, color: colors.forestGreen, textDecoration: w.stripped ? "line-through" : "none" }}>
                                {w.title}
                                {w.stripped && (
                                  <span style={{ marginLeft: 6, padding: "2px 6px", borderRadius: 9999, backgroundColor: colors.red, color: colors.creamLight, fontFamily: fonts.label, fontSize: 9, fontWeight: 700, letterSpacing: "0.04em" }}>STRIPPED</span>
                                )}
                              </p>
                              <p style={{ margin: "2px 0 0", fontFamily: fonts.label, fontSize: 11, color: colors.forestGreen, opacity: 0.7 }}>{t("worksQueue.yearLabel") || "Year"}: {w.year}</p>
                              {w.flagged && (
                                <p style={{ margin: "3px 0 0", fontFamily: fonts.label, fontSize: 10, color: colors.red, fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
                                  <Icon name="flag" size={12} /> {w.flagReason}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td style={tdStyle}>
                          <span style={{ fontFamily: fonts.label, fontSize: 10, fontWeight: 700, padding: "4px 10px", borderRadius: 9999, backgroundColor: colors.creamMid, color: colors.forestGreen, border: `1px solid ${colors.creamDark}`, letterSpacing: "0.04em" }}>
                            {w.format}
                          </span>
                        </td>
                        <td style={tdStyle}>
                          {w.accessType === "link" && w.accessUrl && (
                            <a href={w.accessUrl} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 4, fontFamily: fonts.body, fontSize: 12, color: colors.forestGreen, textDecoration: "none", fontWeight: 600 }}>
                              <Icon name="link" size={14} /> {t("worksQueue.access.link") || "View Link"}
                            </a>
                          )}
                          {w.accessType === "upload" && w.fileName && (
                            <div>
                              <p style={{ margin: 0, display: "flex", alignItems: "center", gap: 4, fontFamily: fonts.body, fontSize: 12, color: colors.forestGreen, fontWeight: 600 }}>
                                <Icon name="upload_file" size={14} /> {w.fileName}
                              </p>
                              <p style={{ margin: "2px 0 0", fontFamily: fonts.label, fontSize: 10, color: colors.forestGreen, opacity: 0.7 }}>{w.fileSize}</p>
                            </div>
                          )}
                          {w.accessType === "none" && <span style={{ fontFamily: fonts.body, fontSize: 12, color: colors.forestGreen, opacity: 0.5, fontStyle: "italic" }}>{t("worksQueue.access.none") || "None"}</span>}
                        </td>
                        <td style={tdStyle}><span style={{ fontFamily: fonts.body, fontSize: 13, fontWeight: 500 }}>{w.scholarName}</span></td>
                        <td style={tdStyle}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <Avatar name={w.submittedBy} size={28} />
                            <span style={{ fontFamily: fonts.body, fontSize: 13, textDecoration: w.stripped ? "line-through" : "none" }}>{w.submittedBy}</span>
                          </div>
                        </td>
                        <td style={{ ...tdStyle, fontFamily: fonts.label, fontSize: 12 }}>{w.date}</td>
                        <td style={{ ...tdStyle, textAlign: isRTL ? "left" : "right" }}>
                          <div style={{ display: "flex", justifyContent: isRTL ? "flex-start" : "flex-end", gap: 6 }}>
                            <button onClick={() => openReview(w)} title="Review" style={{ width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "transparent", border: `1px solid ${colors.forestGreen}`, borderRadius: 6, color: colors.forestGreen, cursor: "pointer" }}>
                              <Icon name="visibility" size={18} />
                            </button>
                            <button onClick={() => handleApprove(w.id)} title="Approve" style={{ width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: colors.forestGreen, border: `1px solid ${colors.forestGreen}`, borderRadius: 6, color: colors.creamLight, cursor: "pointer" }}>
                              <Icon name="check" size={18} filled />
                            </button>
                            <button onClick={() => setRejectTarget(w)} title="Reject" style={{ width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "transparent", border: `1px solid ${colors.red}`, borderRadius: 6, color: colors.red, cursor: "pointer" }}>
                              <Icon name="close" size={18} />
                            </button>
                            <button onClick={() => !w.stripped && setStripTarget(w)} title={w.stripped ? "Already stripped" : "Strip"} disabled={w.stripped} style={{ width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "transparent", border: `1px solid ${colors.forestGreen}`, borderRadius: 6, color: colors.forestGreen, cursor: w.stripped ? "not-allowed" : "pointer", opacity: w.stripped ? 0.4 : 1 }}>
                              <Icon name={w.stripped ? "check_circle" : "person_remove"} size={18} />
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
                  <Icon name="fact_check" size={22} /> {t("worksQueue.review.title") || "Review Work"}
                </h3>
                <button onClick={closeReview} style={{ background: "none", border: "none", cursor: "pointer", color: colors.forestGreen, padding: 4, borderRadius: 6, display: "flex", alignItems: "center" }}>
                  <Icon name="close" size={22} />
                </button>
              </div>
              <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
                <div style={{ flex: 1.2, backgroundColor: colors.creamMid, display: "flex", alignItems: "center", justifyContent: "center", padding: 40 }}>
                  <div style={{ ...cardStyle, padding: 40, maxWidth: 400, width: "100%", textAlign: "center", backgroundColor: colors.creamLight }}>
                    <div style={{ width: 80, height: 80, borderRadius: 12, backgroundColor: colors.creamMid, border: `1px solid ${colors.forestGreen}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
                      <Icon name={FORMAT_META[reviewTarget.format].icon} size={48} />
                    </div>
                    <p style={{ fontFamily: fonts.headline, fontSize: 20, fontWeight: 700, color: colors.forestGreen, margin: "0 0 8px" }}>{reviewTarget.title}</p>
                    <p style={{ fontFamily: fonts.body, fontSize: 13, color: colors.forestGreen, opacity: 0.8, margin: 0 }}>
                      {t("worksQueue.yearLabel") || "Year"} {reviewTarget.year} • {reviewTarget.format}
                    </p>
                    <p style={{ fontFamily: fonts.body, fontSize: 13, color: colors.forestGreen, opacity: 0.8, margin: "8px 0 0" }}>{reviewTarget.scholarName}</p>
                  </div>
                </div>
                <div style={{ flex: 1, padding: 24, overflowY: "auto", display: "flex", flexDirection: "column", gap: 20, borderLeft: `1px solid ${colors.forestGreen}`, backgroundColor: colors.creamLight }}>
                  <div style={{ paddingBottom: 16, borderBottom: `1px solid ${colors.creamDark}` }}>
                    <h4 style={{ fontFamily: fonts.label, fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: colors.forestGreen, margin: "0 0 12px", opacity: 0.8 }}>{t("worksQueue.review.detailsTitle") || "Details"}</h4>
                    {[
                      { label: t("worksQueue.review.label.title") || "Title", value: reviewTarget.title, bold: true },
                      { label: t("worksQueue.review.label.year") || "Year", value: reviewTarget.year },
                      { label: t("worksQueue.review.label.format") || "Format", value: reviewTarget.format },
                      { label: t("worksQueue.review.label.scholar") || "Scholar", value: reviewTarget.scholarName },
                      { label: t("worksQueue.review.label.submittedBy") || "Submitted By", value: `${reviewTarget.submittedBy} (${reviewTarget.date})` },
                    ].map((row, i) => (
                      <div key={i} style={{ display: "flex", gap: 8, fontSize: 13, marginBottom: 6 }}>
                        <span style={{ fontWeight: 600, color: colors.forestGreen, opacity: 0.7, minWidth: 90 }}>{row.label}:</span>
                        <span style={{ color: colors.forestGreen, fontWeight: row.bold ? 600 : 400 }}>{row.value}</span>
                      </div>
                    ))}
                  </div>
                  <div>
                    <h4 style={{ fontFamily: fonts.label, fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: colors.forestGreen, margin: "0 0 12px", opacity: 0.8 }}>{t("worksQueue.review.checksTitle") || "Checklist"}</h4>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {[
                        { key: "accurate", label: t("worksQueue.review.check1") || "Content is accurate" },
                        { key: "complete", label: t("worksQueue.review.check2") || "Information is complete" },
                        { key: "rights", label: t("worksQueue.review.check3") || "Rights cleared" },
                        { key: "guidelines", label: t("worksQueue.review.check4") || "Follows guidelines" },
                      ].map((item) => (
                        <label key={item.key} style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 13, color: colors.forestGreen, cursor: "pointer" }}>
                          <input type="checkbox" checked={(checks as any)[item.key]} onChange={(e) => setChecks({ ...checks, [item.key]: e.target.checked })} style={{ marginTop: 2, width: 16, height: 16, accentColor: colors.forestGreen, cursor: "pointer" }} />
                          <span>{item.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 style={{ fontFamily: fonts.label, fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: colors.forestGreen, margin: "0 0 12px", opacity: 0.8 }}>{t("worksQueue.review.notesTitle") || "Notes"}</h4>
                    <textarea value={reviewNotes} onChange={(e) => setReviewNotes(e.target.value)} placeholder={t("worksQueue.review.notesPlaceholder") || "Add review notes..."} style={{ width: "100%", minHeight: 90, border: `1px solid ${colors.creamDark}`, borderRadius: 7, padding: "10px 12px", fontFamily: fonts.body, fontSize: 13, color: colors.forestGreen, resize: "vertical", outline: "none", boxSizing: "border-box", backgroundColor: colors.creamMid }} />
                  </div>
                  {approvalError && (
                    <div style={{ fontSize: 12, color: colors.red, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
                      <Icon name="error" size={16} /> {approvalError}
                    </div>
                  )}
                  <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: "auto", paddingTop: 16, borderTop: `1px solid ${colors.creamDark}` }}>
                    <button onClick={() => { setDeleteTarget(reviewTarget); closeReview(); }} style={{ padding: "10px 16px", borderRadius: 8, cursor: "pointer", border: `1px solid ${colors.red}`, backgroundColor: "transparent", color: colors.red, fontFamily: fonts.body, fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
                      <Icon name="delete" size={16} /> {t("worksQueue.actions.delete") || "Delete"}
                    </button>
                    <div style={{ flex: 1 }} />
                    <button onClick={handleRejectFromReview} style={{ padding: "10px 20px", borderRadius: 8, cursor: "pointer", border: `1px solid ${colors.forestGreen}`, backgroundColor: "transparent", color: colors.forestGreen, fontFamily: fonts.body, fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
                      <Icon name="cancel" size={16} /> {t("worksQueue.actions.reject") || "Reject"}
                    </button>
                    <button onClick={handleApproveFromReview} style={{ padding: "10px 24px", borderRadius: 8, cursor: "pointer", border: "none", backgroundColor: colors.forestGreen, color: colors.creamLight, fontFamily: fonts.body, fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
                      <Icon name="check_circle" size={16} filled /> {t("worksQueue.actions.approve") || "Approve"}
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
              <h2 style={{ fontFamily: fonts.headline, fontSize: 20, fontWeight: 700, color: colors.forestGreen, marginBottom: 12 }}>{t("worksQueue.modal.rejectTitle") || "Reject Submission"}</h2>
              <p style={{ fontFamily: fonts.body, fontSize: 14, color: colors.forestGreen, lineHeight: 1.6, marginBottom: 16, opacity: 0.8 }}>
                {(t("worksQueue.modal.rejectBody") || `Reject "${rejectTarget.title}"?`).replace("{title}", rejectTarget.title)}
              </p>
              <textarea value={rejectNote} onChange={(e) => setRejectNote(e.target.value)} placeholder={t("worksQueue.modal.rejectPlaceholder") || "Reason for rejection..."} style={{ width: "100%", minHeight: 90, border: `1px solid ${colors.creamDark}`, borderRadius: 7, padding: "10px 12px", fontFamily: fonts.body, fontSize: 13, color: colors.forestGreen, resize: "vertical", outline: "none", boxSizing: "border-box", backgroundColor: colors.creamMid, marginBottom: 20 }} />
              <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
                <button onClick={() => { setRejectTarget(null); setRejectNote(""); }} style={{ padding: "10px 24px", borderRadius: 8, cursor: "pointer", border: `1px solid ${colors.forestGreen}`, backgroundColor: colors.creamLight, fontFamily: fonts.body, fontSize: 13, fontWeight: 600, color: colors.forestGreen }}>{t("worksQueue.modal.cancel") || "Cancel"}</button>
                <button onClick={confirmReject} style={{ padding: "10px 24px", borderRadius: 8, cursor: "pointer", border: "none", backgroundColor: colors.red, color: colors.creamLight, fontFamily: fonts.body, fontSize: 13, fontWeight: 700 }}>{t("worksQueue.modal.confirm") || "Confirm Reject"}</button>
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
              <h2 style={{ fontFamily: fonts.headline, fontSize: 20, fontWeight: 700, color: colors.forestGreen, marginBottom: 12 }}>{t("worksQueue.modal.deleteTitle") || "Delete Submission?"}</h2>
              <p style={{ fontFamily: fonts.body, fontSize: 14, color: colors.forestGreen, lineHeight: 1.6, marginBottom: 16, opacity: 0.8 }}>
                {(t("worksQueue.modal.deleteBody") || `Permanently delete "${deleteTarget.title}"?`).replace("{title}", deleteTarget.title)}
              </p>
              <textarea value={deleteNote} onChange={(e) => setDeleteNote(e.target.value)} placeholder={t("worksQueue.modal.deletePlaceholder") || "Reason for deletion..."} style={{ width: "100%", minHeight: 90, border: `1px solid ${colors.creamDark}`, borderRadius: 7, padding: "10px 12px", fontFamily: fonts.body, fontSize: 13, color: colors.forestGreen, resize: "vertical", outline: "none", boxSizing: "border-box", backgroundColor: colors.creamMid, marginBottom: 20 }} />
              <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
                <button onClick={() => { setDeleteTarget(null); setDeleteNote(""); }} style={{ padding: "10px 24px", borderRadius: 8, cursor: "pointer", border: `1px solid ${colors.forestGreen}`, backgroundColor: colors.creamLight, fontFamily: fonts.body, fontSize: 13, fontWeight: 600, color: colors.forestGreen }}>{t("worksQueue.modal.cancel") || "Cancel"}</button>
                <button onClick={confirmDelete} style={{ padding: "10px 24px", borderRadius: 8, cursor: "pointer", border: "none", backgroundColor: colors.red, color: colors.creamLight, fontFamily: fonts.body, fontSize: 13, fontWeight: 700 }}>{t("worksQueue.modal.deleteConfirm") || "Delete"}</button>
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
              <h2 style={{ fontFamily: fonts.headline, fontSize: 20, fontWeight: 700, color: colors.forestGreen, marginBottom: 12 }}>{t("worksQueue.strip.title") || "Strip Contributor"}</h2>
              <p style={{ fontFamily: fonts.body, fontSize: 14, color: colors.forestGreen, lineHeight: 1.6, marginBottom: 28, opacity: 0.8 }}>
                <span dangerouslySetInnerHTML={{ __html: (t("worksQueue.strip.body") || `Strip ${stripTarget.submittedBy} from "${stripTarget.title}"?`).replace("{name}", stripTarget.submittedBy).replace("{title}", stripTarget.title) }} />
                <br /><br />
                <b style={{ color: colors.red }}>{t("worksQueue.strip.warning") || "This action cannot be undone."}</b>
              </p>
              <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
                <button onClick={() => setStripTarget(null)} style={{ padding: "10px 24px", borderRadius: 8, cursor: "pointer", border: `1px solid ${colors.forestGreen}`, backgroundColor: colors.creamLight, fontFamily: fonts.body, fontSize: 13, fontWeight: 600, color: colors.forestGreen }}>{t("worksQueue.strip.cancel") || "Cancel"}</button>
                <button onClick={confirmStrip} style={{ padding: "10px 24px", borderRadius: 8, cursor: "pointer", border: "none", backgroundColor: colors.red, color: colors.creamLight, fontFamily: fonts.body, fontSize: 13, fontWeight: 700 }}>{t("worksQueue.strip.confirm") || "Confirm"}</button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}