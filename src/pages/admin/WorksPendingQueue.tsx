import React, { useState, useMemo, useEffect } from "react";
import { useLang } from "../../context/LanguageContext";
import adminApi from "../../api/adminApi";

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
/*  Types — matches scholar_works table                                */
/* ------------------------------------------------------------------ */
type WorkFormat =
  | "BOOK" | "ARTICLE" | "TREATISE" | "MANUSCRIPT" | "LECTURE" | "SERMON"
  | "FATWA" | "POEM" | "LETTER" | "COMMENTARY" | "TRANSLATION" | "RESEARCH"
  | "COURSE" | "DEVICE" | "INVENTION" | "SOFTWARE" | "MAP" | "OTHER";

type AccessType = "none" | "upload" | "link";
type SortOption = "newest" | "oldest" | "title";

interface PendingWork {
  id: string; title: string; year: string; format: WorkFormat; description: string;
  accessType: AccessType; accessUrl?: string; fileName?: string;
  scholarName: string; scholarId: string;
  submittedBy: string; contributorId: string; date: string; submittedAt: Date;
  flagged: boolean; flagReason?: string; stripped?: boolean;
}

const FORMAT_META: Record<WorkFormat, { icon: string; color: string }> = {
  BOOK:        { icon: "menu_book",            color: colors.creamMid },
  ARTICLE:     { icon: "article",              color: colors.creamMid },
  TREATISE:    { icon: "gavel",                color: colors.creamMid },
  MANUSCRIPT:  { icon: "history_edu",          color: colors.creamMid },
  LECTURE:     { icon: "record_voice_over",    color: colors.creamMid },
  SERMON:      { icon: "campaign",             color: colors.creamMid },
  FATWA:       { icon: "balance",              color: colors.creamMid },
  POEM:        { icon: "auto_stories",         color: colors.creamMid },
  LETTER:      { icon: "mail",                 color: colors.creamMid },
  COMMENTARY:  { icon: "rate_review",          color: colors.creamMid },
  TRANSLATION: { icon: "translate",            color: colors.creamMid },
  RESEARCH:    { icon: "science",              color: colors.creamMid },
  COURSE:      { icon: "school",               color: colors.creamMid },
  DEVICE:      { icon: "precision_manufacturing", color: colors.creamMid },
  INVENTION:   { icon: "lightbulb",            color: colors.creamMid },
  SOFTWARE:    { icon: "terminal",             color: colors.creamMid },
  MAP:         { icon: "map",                  color: colors.creamMid },
  OTHER:       { icon: "description",          color: colors.creamMid },
};

const FORMAT_OPTIONS: WorkFormat[] = [
  "BOOK", "ARTICLE", "TREATISE", "MANUSCRIPT", "LECTURE", "SERMON", "FATWA",
  "POEM", "LETTER", "COMMENTARY", "TRANSLATION", "RESEARCH", "COURSE",
  "DEVICE", "INVENTION", "SOFTWARE", "MAP", "OTHER",
];

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

  const [rows, setRows] = useState<PendingWork[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [reviewTarget, setReviewTarget] = useState<PendingWork | null>(null);
  const [approvalError, setApprovalError] = useState("");
  const [approveTarget, setApproveTarget] = useState<PendingWork | null>(null);
  const [approveReason, setApproveReason] = useState("");
  const [rejectTarget, setRejectTarget] = useState<PendingWork | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  // ✅ Two-step Restrict flow (replaces the old single-step Strip modal)
  const [restrictTarget, setRestrictTarget] = useState<PendingWork | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ type: 'revoke' | 'ban', work: PendingWork } | null>(null);

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

  useEffect(() => {
    fetchPendingWorks();
  }, []);

  const fetchPendingWorks = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await adminApi.works.getPending();

      if (response.data.success && response.data.data) {
        const mappedData = response.data.data.map((item: any) => {
          const isExternal = item.source_type === "external";
          const accessUrl = item.media_url || item.file_path;

          let accessType: AccessType = "none";
          if (isExternal && accessUrl) accessType = "link";
          else if (!isExternal && (item.file_path || item.file_name)) accessType = "upload";

          const formatRaw = (item.format || "OTHER").toString().toUpperCase();
          const format: WorkFormat = (FORMAT_OPTIONS as string[]).includes(formatRaw)
            ? (formatRaw as WorkFormat)
            : "OTHER";

          return {
            id: String(item.work_id ?? item.id),
            title: item.title || "Untitled",
            year: item.year != null ? String(item.year) : "—",
            format,
            description: item.description || "",
            accessType,
            accessUrl,
            fileName: item.file_name,

            scholarName: item.scholar_versions?.canonical_name || "Unknown Scholar",
            scholarId: String(item.scholar_versions?.scholar_id ?? "unknown"),

            submittedBy: item.users?.username || "Unknown",
            contributorId: String(item.users?.id ?? item.created_by ?? "unknown"),
            date: new Date(item.created_at || Date.now()).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
            submittedAt: new Date(item.created_at || Date.now()),

            flagged: !!item.flagged || !!item.is_flagged,
            flagReason: item.flag_reason || item.notes,
            stripped: !!item.stripped,
          };
        });
        setRows(mappedData);
      } else {
        setError(response.data.message || "Failed to fetch works");
      }
    } catch (err) {
      console.error("Error fetching pending works:", err);
      setError("An error occurred while fetching pending works.");
    } finally {
      setIsLoading(false);
    }
  };

  const openReview = (w: PendingWork) => {
    setReviewTarget(w);
    setApprovalError("");
  };
  const closeReview = () => { setReviewTarget(null); setApprovalError(""); };

  // ✅ Approve now sends the optional notes as `reason`
  const confirmApprove = async () => {
    if (!approveTarget) return;
    try {
      await adminApi.works.approve(Number(approveTarget.id), approveReason || "Approved");
      setRows(prev => prev.filter(w => w.id !== approveTarget.id));
      if (reviewTarget?.id === approveTarget.id) closeReview();
      setApproveTarget(null);
      setApproveReason("");
    } catch (err) {
      console.error("Approve failed:", err);
      alert(t("worksQueue.errors.approve") || "Failed to approve work.");
      setApproveTarget(null);
    }
  };

  // ✅ Reject now requires a written reason
  const confirmReject = async () => {
    if (!rejectTarget) return;
    if (!rejectReason.trim()) {
      alert("Please provide a rejection reason");
      return;
    }
    try {
      await adminApi.works.reject(Number(rejectTarget.id), rejectReason);
      setRows(prev => prev.filter(w => w.id !== rejectTarget.id));
      setRejectTarget(null);
      setRejectReason("");
    } catch (err) {
      console.error("Reject failed:", err);
      alert(t("worksQueue.errors.reject") || "Failed to reject work.");
    }
  };

  // ✅ Same pattern as NewScholarsQueue / MediaPendingQueue: restrict the user + auto-reject the work
  const executeRestrictionAndReject = async () => {
    if (!confirmAction) return;
    try {
      const { type, work } = confirmAction;
      const userId = parseInt(work.contributorId, 10);

      if (isNaN(userId)) {
        alert("Cannot restrict system-generated submissions.");
        setConfirmAction(null);
        setRestrictTarget(null);
        return;
      }

      // 1. Restrict the user
      if (type === 'revoke') {
        await adminApi.users.toggleContribute(userId);
      } else {
        await adminApi.users.ban(userId);
      }

      // 2. Auto-reject the work submission
      const defaultReason = type === 'ban' ? "Contributor banned" : "Contribution access revoked";
      await adminApi.works.reject(Number(work.id), defaultReason);

      // 3. Remove from UI and close modals
      setRows((prev) => prev.filter((row) => row.id !== work.id));
      setConfirmAction(null);
      setRestrictTarget(null);
    } catch (err) {
      console.error("Action failed:", err);
      alert("Failed to process action. Please try again.");
    }
  };

  // ✅ Handlers for the Modal File Actions (mirrors Media queue behavior)
  const handleModalView = async () => {
    if (!reviewTarget) return;
    const url = reviewTarget.accessUrl;
    if (!url) return;
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      // Works don't carry a media "type" like Media does — default to PDF since
      // these are text-based scholarly works.
      const typedBlob = new Blob([blob], { type: "application/pdf" });
      const blobUrl = URL.createObjectURL(typedBlob);
      window.open(blobUrl, "_blank");
      setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
    } catch (error) {
      window.open(url, "_blank");
    }
  };

  const handleModalDownload = async () => {
    if (!reviewTarget || reviewTarget.accessType !== "upload") return;
    const url = reviewTarget.accessUrl;
    if (!url) return;
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      const filename = reviewTarget.fileName || reviewTarget.title || "file.pdf";
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      window.open(url, "_blank");
    }
  };

  const thStyle: React.CSSProperties = { fontFamily: fonts.label, fontSize: 11, letterSpacing: "0.06em", fontWeight: 600, color: colors.forestGreen, textAlign: isRTL ? "right" : "left", padding: "12px 14px", borderBottom: `1px solid ${colors.forestGreen}`, textTransform: "uppercase", opacity: 0.8 };
  const tdStyle: React.CSSProperties = { fontFamily: fonts.body, fontSize: 13, color: colors.forestGreen, padding: "14px", borderBottom: `1px solid ${colors.creamDark}`, textAlign: isRTL ? "right" : "left" };

  const statItems = [
    { icon: "library_books", label: t("worksQueue.stats.totalPending") || "Total Pending", value: stats.total.toString(), color: colors.forestGreen, filled: true },
    { icon: "flag", label: t("worksQueue.stats.priorityReviews") || "Priority Reviews", value: stats.priority.toString(), color: colors.red, filled: false, isPriority: true },
    { icon: "schedule", label: t("worksQueue.stats.avgTime") || "Avg Time", value: stats.avgTime, color: colors.forestGreen, filled: false },
  ];

  const selectStyle: React.CSSProperties = { border: "none", outline: "none", background: "transparent", fontFamily: fonts.body, fontSize: 13, color: colors.forestGreen, cursor: "pointer", minWidth: 140, appearance: "none", WebkitAppearance: "none", MozAppearance: "none" };

  const actionBtnBase: React.CSSProperties = { width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 6, cursor: "pointer", transition: "all 0.15s", border: `1px solid ${colors.forestGreen}` };
  const viewBtnStyle: React.CSSProperties = { ...actionBtnBase, backgroundColor: "transparent", color: colors.forestGreen };
  const approveBtnStyle: React.CSSProperties = { ...actionBtnBase, backgroundColor: colors.forestGreen, color: colors.creamLight };
  const rejectBtnStyle: React.CSSProperties = { ...actionBtnBase, backgroundColor: "transparent", color: colors.red, borderColor: colors.red };

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
                {FORMAT_OPTIONS.map((f) => <option key={f} value={f}>{f.charAt(0) + f.slice(1).toLowerCase()}</option>)}
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
                {isLoading ? (
                  <tr><td colSpan={7} style={{ padding: 40, textAlign: "center", color: colors.forestGreen }}><Icon name="hourglass_empty" size={48} /><p style={{ marginTop: 12 }}>Loading...</p></td></tr>
                ) : error ? (
                  <tr><td colSpan={7} style={{ padding: 40, textAlign: "center", color: colors.red }}><Icon name="error" size={48} /><p style={{ marginTop: 12 }}>{error}</p><button onClick={fetchPendingWorks} style={{ marginTop: 12, padding: "8px 16px", borderRadius: 6, border: `1px solid ${colors.forestGreen}`, backgroundColor: colors.creamLight, color: colors.forestGreen, cursor: "pointer" }}>Retry</button></td></tr>
                ) : filtered.length === 0 ? (
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
                          {w.accessType === "upload" && (
                            <div>
                              <p style={{ margin: 0, display: "flex", alignItems: "center", gap: 4, fontFamily: fonts.body, fontSize: 12, color: colors.forestGreen, fontWeight: 600 }}>
                                <Icon name="upload_file" size={14} /> {w.fileName || "No file name"}
                              </p>
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
                            <button onClick={() => openReview(w)} title="View Details" style={viewBtnStyle} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = colors.creamMid; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}>
                              <Icon name="visibility" size={18} />
                            </button>
                            <button onClick={() => { setApproveTarget(w); setApproveReason(""); }} title="Approve" style={approveBtnStyle} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#285b4b"; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = colors.forestGreen; }}>
                              <Icon name="check" size={18} filled />
                            </button>
                            <button onClick={() => { setRejectTarget(w); setRejectReason(""); }} title="Reject" style={rejectBtnStyle} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = colors.red; e.currentTarget.style.color = colors.creamLight; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = colors.red; }}>
                              <Icon name="close" size={18} />
                            </button>
                            <button onClick={() => setRestrictTarget(w)} title="Restrict User & Reject"
                              style={{ width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "transparent", border: `1px solid ${colors.amber}`, borderRadius: 6, color: colors.amber, cursor: "pointer" }}
                              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = colors.amber; e.currentTarget.style.color = colors.creamLight; }}
                              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = colors.amber; }}>
                              <Icon name="shield_person" size={18} />
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

        {/* ── Review Modal — details + file actions only ── */}
        {reviewTarget && (
          <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(11, 67, 53, 0.6)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)", padding: 20 }} onClick={closeReview}>
            <div style={{ ...cardStyle, backgroundColor: colors.creamLight, width: "95vw", maxWidth: 560, maxHeight: "85vh", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }} onClick={(e) => e.stopPropagation()}>

              <div style={{ padding: "16px 24px", borderBottom: `1px solid ${colors.forestGreen}`, display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: colors.creamMid }}>
                <h3 style={{ fontFamily: fonts.headline, fontSize: 18, fontWeight: 700, color: colors.forestGreen, margin: 0, display: "flex", alignItems: "center", gap: 10 }}>
                  <Icon name="fact_check" size={22} /> {t("worksQueue.review.title") || "Review Work"}
                </h3>
                <button onClick={closeReview} style={{ background: "none", border: "none", cursor: "pointer", color: colors.forestGreen, padding: 4, borderRadius: 6, display: "flex", alignItems: "center" }}>
                  <Icon name="close" size={22} />
                </button>
              </div>

              <div style={{ flex: 1, overflow: "hidden", display: "flex" }}>
                <div style={{ flex: 1, padding: 24, overflowY: "auto", display: "flex", flexDirection: "column", gap: 20, backgroundColor: colors.creamLight }}>

                  <div style={{ paddingBottom: 16, borderBottom: `1px solid ${colors.creamDark}` }}>
                    <h4 style={{ fontFamily: fonts.label, fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: colors.forestGreen, margin: "0 0 12px", opacity: 0.8 }}>{t("worksQueue.review.detailsTitle") || "Details"}</h4>
                    {[
                      { label: t("worksQueue.review.label.title") || "Title", value: reviewTarget.title, bold: true },
                      ...(reviewTarget.description ? [{ label: "Description", value: reviewTarget.description }] : []),
                      { label: t("worksQueue.review.label.year") || "Year", value: reviewTarget.year },
                      { label: t("worksQueue.review.label.format") || "Format", value: reviewTarget.format },
                      { label: t("worksQueue.review.label.scholar") || "Scholar", value: reviewTarget.scholarName },
                      { label: t("worksQueue.review.label.submittedBy") || "Submitted By", value: `${reviewTarget.submittedBy} (${reviewTarget.date})` },
                    ].map((row, i) => (
                      <div key={i} style={{ display: "flex", gap: 8, fontSize: 13, marginBottom: 6, paddingBottom: 6, borderBottom: i < 4 ? `1px solid ${colors.creamMid}` : "none" }}>
                        <span style={{ fontWeight: 600, color: colors.forestGreen, opacity: 0.7, minWidth: 100, flexShrink: 0 }}>{row.label}:</span>
                        <span style={{ color: colors.forestGreen, fontWeight: row.bold ? 600 : 400 }}>{row.value}</span>
                      </div>
                    ))}
                  </div>

                  <div style={{ paddingBottom: 16, borderBottom: `1px solid ${colors.creamDark}` }}>
                    <h4 style={{ fontFamily: fonts.label, fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: colors.forestGreen, margin: "0 0 12px", opacity: 0.8 }}>File Actions</h4>
                    {reviewTarget.accessType === "upload" ? (
                      <div style={{ display: "flex", gap: 10 }}>
                        <button onClick={handleModalView} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "10px", borderRadius: 6, border: `1px solid ${colors.forestGreen}`, backgroundColor: "transparent", color: colors.forestGreen, fontFamily: fonts.label, fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", cursor: "pointer" }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = colors.forestGreen; e.currentTarget.style.color = colors.creamLight; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = colors.forestGreen; }}>
                          <Icon name="visibility" size={16} /> VIEW FILE
                        </button>
                        <button onClick={handleModalDownload} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "10px", borderRadius: 6, border: "none", backgroundColor: colors.forestGreen, color: colors.creamLight, fontFamily: fonts.label, fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", cursor: "pointer" }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#285b4b"; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = colors.forestGreen; }}>
                          <Icon name="download" size={16} /> DOWNLOAD
                        </button>
                      </div>
                    ) : reviewTarget.accessType === "link" && reviewTarget.accessUrl ? (
                      <a href={reviewTarget.accessUrl} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "10px", borderRadius: 6, border: "none", backgroundColor: colors.forestGreen, color: colors.creamLight, fontFamily: fonts.label, fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", cursor: "pointer", textDecoration: "none" }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#285b4b"; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = colors.forestGreen; }}>
                        <Icon name="open_in_new" size={16} /> OPEN LINK
                      </a>
                    ) : (
                      <p style={{ margin: 0, fontFamily: fonts.body, fontSize: 12, color: colors.forestGreen, opacity: 0.5, fontStyle: "italic" }}>No file or link attached.</p>
                    )}
                  </div>

                  {approvalError && (
                    <div style={{ fontSize: 12, color: colors.red, fontWeight: 600, display: "flex", alignItems: "center", gap: 6, padding: "10px", backgroundColor: "rgba(139,44,44,0.06)", borderRadius: 6 }}>
                      <Icon name="error" size={16} /> {approvalError}
                    </div>
                  )}

                  <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: "auto", paddingTop: 16, borderTop: `1px solid ${colors.creamDark}` }}>
                    <button onClick={() => { setRejectTarget(reviewTarget); setRejectReason(""); closeReview(); }} style={{ padding: "10px 20px", borderRadius: 8, cursor: "pointer", border: `1px solid ${colors.forestGreen}`, backgroundColor: "transparent", color: colors.forestGreen, fontFamily: fonts.body, fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
                      <Icon name="cancel" size={16} /> {t("worksQueue.actions.reject") || "Reject"}
                    </button>
                    <div style={{ flex: 1 }} />
                    <button onClick={() => { setApproveTarget(reviewTarget); setApproveReason(""); closeReview(); }} style={{ padding: "10px 24px", borderRadius: 8, cursor: "pointer", border: "none", backgroundColor: colors.forestGreen, color: colors.creamLight, fontFamily: fonts.body, fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
                      <Icon name="check_circle" size={16} filled /> {t("worksQueue.actions.approve") || "Approve"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Approve Confirmation Modal ── */}
        {approveTarget && (
          <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(11, 67, 53, 0.5)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }} onClick={() => { setApproveTarget(null); setApproveReason(""); }}>
            <div style={{ ...cardStyle, backgroundColor: colors.creamLight, width: 440, maxWidth: "90vw", padding: 32, boxShadow: "0 20px 60px rgba(0,0,0,0.18)" }} onClick={(e) => e.stopPropagation()}>
              <div style={{ width: 56, height: 56, borderRadius: "50%", backgroundColor: colors.forestGreen, color: colors.creamLight, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20, border: `1px solid ${colors.forestGreen}` }}><Icon name="check_circle" size={28} filled /></div>
              <h2 style={{ fontFamily: fonts.headline, fontSize: 20, fontWeight: 700, color: colors.forestGreen, marginBottom: 12 }}>{t("worksQueue.modal.approveTitle") || "Approve Submission"}</h2>
              <p style={{ fontFamily: fonts.body, fontSize: 14, color: colors.forestGreen, lineHeight: 1.6, marginBottom: 16, opacity: 0.8 }}>Are you sure you want to approve "{approveTarget.title}"?</p>
              <div style={{ marginBottom: 24 }}>
                <label style={{ fontFamily: fonts.label, fontSize: 11, letterSpacing: "0.06em", fontWeight: 600, color: colors.forestGreen, display: "block", marginBottom: 6 }}>APPROVAL NOTES (Optional)</label>
                <textarea value={approveReason} onChange={(e) => setApproveReason(e.target.value)} placeholder="Add any notes about this approval..." style={{ width: "100%", padding: 12, borderRadius: 8, border: `1px solid ${colors.forestGreen}`, fontFamily: fonts.body, fontSize: 13, color: colors.forestGreen, backgroundColor: colors.creamLight, outline: "none", resize: "vertical", minHeight: 80 }} />
              </div>
              <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
                <button onClick={() => { setApproveTarget(null); setApproveReason(""); }} style={{ padding: "10px 24px", borderRadius: 8, cursor: "pointer", border: `1px solid ${colors.forestGreen}`, backgroundColor: colors.creamLight, fontFamily: fonts.body, fontSize: 13, fontWeight: 600, color: colors.forestGreen }}>{t("worksQueue.modal.cancel") || "Cancel"}</button>
                <button onClick={confirmApprove} style={{ padding: "10px 24px", borderRadius: 8, cursor: "pointer", border: "none", backgroundColor: colors.forestGreen, color: colors.creamLight, fontFamily: fonts.body, fontSize: 13, fontWeight: 700 }}>Confirm Approve</button>
              </div>
            </div>
          </div>
        )}

        {/* ── Reject Confirmation Modal — now requires a reason ── */}
        {rejectTarget && (
          <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(11, 67, 53, 0.5)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }} onClick={() => { setRejectTarget(null); setRejectReason(""); }}>
            <div style={{ ...cardStyle, backgroundColor: colors.creamLight, width: 440, maxWidth: "90vw", padding: 32, boxShadow: "0 20px 60px rgba(0,0,0,0.18)" }} onClick={(e) => e.stopPropagation()}>
              <div style={{ width: 56, height: 56, borderRadius: "50%", backgroundColor: colors.red, color: colors.creamLight, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20, border: `1px solid ${colors.red}` }}>
                <Icon name="cancel" size={28} filled />
              </div>
              <h2 style={{ fontFamily: fonts.headline, fontSize: 20, fontWeight: 700, color: colors.forestGreen, marginBottom: 12 }}>{t("worksQueue.modal.rejectTitle") || "Reject Submission"}</h2>
              <p style={{ fontFamily: fonts.body, fontSize: 14, color: colors.forestGreen, lineHeight: 1.6, marginBottom: 16, opacity: 0.8 }}>
                Are you sure you want to reject "{rejectTarget.title}"?
              </p>
              <div style={{ marginBottom: 24 }}>
                <label style={{ fontFamily: fonts.label, fontSize: 11, letterSpacing: "0.06em", fontWeight: 600, color: colors.forestGreen, display: "block", marginBottom: 6 }}>REJECTION REASON *</label>
                <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="Please explain why this submission is being rejected..." style={{ width: "100%", padding: 12, borderRadius: 8, border: `1px solid ${colors.forestGreen}`, fontFamily: fonts.body, fontSize: 13, color: colors.forestGreen, backgroundColor: colors.creamLight, outline: "none", resize: "vertical", minHeight: 80 }} />
              </div>
              <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
                <button onClick={() => { setRejectTarget(null); setRejectReason(""); }} style={{ padding: "10px 24px", borderRadius: 8, cursor: "pointer", border: `1px solid ${colors.forestGreen}`, backgroundColor: colors.creamLight, fontFamily: fonts.body, fontSize: 13, fontWeight: 600, color: colors.forestGreen }}>{t("worksQueue.modal.cancel") || "Cancel"}</button>
                <button onClick={confirmReject} style={{ padding: "10px 24px", borderRadius: 8, cursor: "pointer", border: "none", backgroundColor: colors.red, color: colors.creamLight, fontFamily: fonts.body, fontSize: 13, fontWeight: 700 }}>{t("worksQueue.modal.confirm") || "Confirm Reject"}</button>
              </div>
            </div>
          </div>
        )}

        {/* ── Step 1: Choose Action Modal ── */}
        {restrictTarget && !confirmAction && (
          <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(11, 67, 53, 0.6)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)", padding: 20 }} onClick={() => setRestrictTarget(null)}>
            <div style={{ ...cardStyle, backgroundColor: colors.creamLight, width: 520, maxWidth: "90vw", padding: 32, boxShadow: "0 20px 60px rgba(0,0,0,0.25)" }} onClick={(e) => e.stopPropagation()}>

              <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
                <Avatar name={restrictTarget.submittedBy} size={56} />
                <div>
                  <h2 style={{ fontFamily: fonts.headline, fontSize: 20, fontWeight: 700, color: colors.forestGreen, margin: 0 }}>Restrict User</h2>
                  <p style={{ fontFamily: fonts.body, fontSize: 13, color: colors.forestGreen, opacity: 0.7, margin: "4px 0 0" }}>{restrictTarget.submittedBy} submitted "{restrictTarget.title}"</p>
                </div>
              </div>

              <p style={{ fontFamily: fonts.body, fontSize: 14, color: colors.forestGreen, lineHeight: 1.6, marginBottom: 24 }}>
                Choose an action. This will automatically <b>reject</b> this work submission as well.
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>
                <button onClick={() => setConfirmAction({ type: 'revoke', work: restrictTarget })}
                  style={{ display: "flex", alignItems: "flex-start", gap: 16, padding: 16, borderRadius: 8, border: `1px solid ${colors.amber}`, backgroundColor: "rgba(184, 134, 11, 0.05)", cursor: "pointer", textAlign: "left", transition: "background 0.2s" }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "rgba(184, 134, 11, 0.1)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "rgba(184, 134, 11, 0.05)"; }}>
                  <div style={{ width: 32, height: 32, borderRadius: "50%", backgroundColor: colors.amber, color: colors.creamLight, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Icon name="person_off" size={18} />
                  </div>
                  <div>
                    <p style={{ fontFamily: fonts.headline, fontSize: 14, fontWeight: 700, color: colors.forestGreen, margin: "0 0 4px" }}>Revoke Contribution Access</p>
                    <p style={{ fontFamily: fonts.body, fontSize: 12, color: colors.forestGreen, opacity: 0.7, margin: 0, lineHeight: 1.5 }}>They can still log in, but cannot submit new content. (Recommended for low-quality submissions)</p>
                  </div>
                </button>

                <button onClick={() => setConfirmAction({ type: 'ban', work: restrictTarget })}
                  style={{ display: "flex", alignItems: "flex-start", gap: 16, padding: 16, borderRadius: 8, border: `1px solid ${colors.red}`, backgroundColor: "rgba(139, 44, 44, 0.05)", cursor: "pointer", textAlign: "left", transition: "background 0.2s" }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "rgba(139, 44, 44, 0.1)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "rgba(139, 44, 44, 0.05)"; }}>
                  <div style={{ width: 32, height: 32, borderRadius: "50%", backgroundColor: colors.red, color: colors.creamLight, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Icon name="block" size={18} />
                  </div>
                  <div>
                    <p style={{ fontFamily: fonts.headline, fontSize: 14, fontWeight: 700, color: colors.forestGreen, margin: "0 0 4px" }}>Ban Account Completely</p>
                    <p style={{ fontFamily: fonts.body, fontSize: 12, color: colors.forestGreen, opacity: 0.7, margin: 0, lineHeight: 1.5 }}>They will be completely locked out of the platform. (Use for spam, abuse, or severe violations)</p>
                  </div>
                </button>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button onClick={() => setRestrictTarget(null)} style={{ padding: "10px 24px", borderRadius: 8, cursor: "pointer", border: `1px solid ${colors.forestGreen}`, backgroundColor: colors.creamLight, fontFamily: fonts.body, fontSize: 13, fontWeight: 600, color: colors.forestGreen }}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Step 2: Final Confirmation Modal ── */}
        {confirmAction && (
          <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(11, 67, 53, 0.6)", zIndex: 101, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)", padding: 20 }} onClick={() => setConfirmAction(null)}>
            <div style={{ ...cardStyle, backgroundColor: colors.creamLight, width: 440, maxWidth: "90vw", padding: 32, boxShadow: "0 20px 60px rgba(0,0,0,0.25)" }} onClick={(e) => e.stopPropagation()}>

              <div style={{ width: 56, height: 56, borderRadius: "50%", backgroundColor: confirmAction.type === 'ban' ? colors.red : colors.amber, color: colors.creamLight, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20, border: `1px solid ${confirmAction.type === 'ban' ? colors.red : colors.amber}` }}>
                <Icon name={confirmAction.type === 'ban' ? "block" : "person_off"} size={28} filled />
              </div>

              <h2 style={{ fontFamily: fonts.headline, fontSize: 20, fontWeight: 700, color: colors.forestGreen, marginBottom: 12 }}>
                Confirm {confirmAction.type === 'ban' ? 'Ban' : 'Revocation'}
              </h2>

              <p style={{ fontFamily: fonts.body, fontSize: 14, color: colors.forestGreen, lineHeight: 1.6, marginBottom: 24, opacity: 0.8 }}>
                This will <b>{confirmAction.type === 'ban' ? 'BAN' : 'REVOKE CONTRIBUTION ACCESS FOR'} {confirmAction.work.submittedBy}</b>
                <br/>and automatically <b>REJECT</b> the work "{confirmAction.work.title}".
                <br/><br/>
                <b style={{ color: colors.red }}>This action cannot be undone from this screen.</b>
              </p>

              <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
                <button onClick={() => setConfirmAction(null)} style={{ padding: "10px 24px", borderRadius: 8, cursor: "pointer", border: `1px solid ${colors.forestGreen}`, backgroundColor: colors.creamLight, fontFamily: fonts.body, fontSize: 13, fontWeight: 600, color: colors.forestGreen }}>
                  Go Back
                </button>
                <button onClick={executeRestrictionAndReject} style={{ padding: "10px 24px", borderRadius: 8, cursor: "pointer", border: "none", backgroundColor: confirmAction.type === 'ban' ? colors.red : colors.amber, color: colors.creamLight, fontFamily: fonts.body, fontSize: 13, fontWeight: 700 }}>
                  Confirm & Reject
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}