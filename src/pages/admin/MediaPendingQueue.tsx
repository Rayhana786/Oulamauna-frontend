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

const Icon: React.FC<{ name: string; size?: number; filled?: boolean }> = ({ name, size = 18, filled = false }) => (
  <span className="material-symbols-outlined" style={{ fontSize: size, lineHeight: 1, fontVariationSettings: `'FILL' ${filled ? 1 : 0}, 'wght' 400, 'GRAD' 0, 'opsz' 24` }}>
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
/*  Types                                                              */
/* ------------------------------------------------------------------ */
type MediaType = "PDF" | "AUDIO" | "VIDEO" | "LINK";
type SourceType = "link" | "upload";
type SortOption = "newest" | "oldest" | "title";

interface PendingMedia {
  id: string; title: string; description: string; type: MediaType; sourceType: SourceType;
  sourceUrl?: string; fileName?: string; fileSize?: string; scholarName: string; scholarId: string;
  submittedBy: string; contributorId: string; date: string; submittedAt: Date;
  flagged: boolean; flagReason?: string; previewUrl?: string; stripped?: boolean;
}

const TYPE_META: Record<MediaType, { icon: string; color: string }> = {
  PDF:   { icon: "picture_as_pdf", color: colors.creamMid },
  AUDIO: { icon: "headphones",     color: colors.creamMid },
  VIDEO: { icon: "movie",          color: colors.creamMid },
  LINK:  { icon: "link",           color: colors.creamMid },
};

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
  
  const [rows, setRows] = useState<PendingMedia[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [reviewTarget, setReviewTarget] = useState<PendingMedia | null>(null);
  const [approvalError, setApprovalError] = useState("");
  const [approveTarget, setApproveTarget] = useState<PendingMedia | null>(null);
  const [rejectTarget, setRejectTarget] = useState<PendingMedia | null>(null);
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

  useEffect(() => {
    fetchPendingMedia();
  }, []);

   const fetchPendingMedia = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await adminApi.media.getPending();
      
      if (response.data.success && response.data.data) {
        const mappedData = response.data.data.map((item: any) => {
          const previewUrl = item.media_url || item.source_url || item.file_path || item.preview_url || item.url;

          // ✅ 1. Force sourceType to 'link' if it's external, otherwise 'upload'
          const isExternal = item.source_type === 'external' || item.sourceType === 'external' || item.source_type === 'link';
          const sourceType: SourceType = isExternal ? 'link' : 'upload';

          // ✅ 2. Smart Type Detection: Don't blindly trust file_type for links
          let type: MediaType = "PDF";
          if (isExternal) {
            // For links, guess the type from the URL itself
            if (previewUrl && (previewUrl.includes('youtube') || previewUrl.includes('vimeo') || previewUrl.includes('.mp4'))) {
              type = "VIDEO";
            } else if (previewUrl && previewUrl.includes('.mp3')) {
              type = "AUDIO";
            } else {
              type = "LINK"; // Default for document/other links
            }
          } else {
            // For actual uploaded files, trust the database file_type
            const fileType = (item.file_type || item.fileType || "pdf").toLowerCase();
            if (fileType === 'audio') type = "AUDIO";
            else if (fileType === 'video') type = "VIDEO";
            else type = "PDF";
          }

          return {
            id: String(item.media_id ?? item.id),
            title: item.title || "Untitled",
            description: item.description || "",
            type: type, // ✅ FIXED: Correct type based on logic above
            sourceType: sourceType, // ✅ FIXED: Correct source type ('link' or 'upload')
            sourceUrl: previewUrl,
            fileName: item.file_name || item.fileName,
            fileSize: item.file_size || item.fileSize,
            
            // ✅ KEPT EXACTLY AS YOU HAD IT (since you confirmed it works perfectly!)
            scholarName: item.scholar_versions?.canonical_name || "Unknown Scholar",
            scholarId: String(item.scholar_versions?.scholar_id ?? "unknown"),
            
            submittedBy: item.users?.username || "Unknown",
            contributorId: String(item.users?.id ?? item.uploaded_by ?? "unknown"),
            date: new Date(item.created_at || item.uploaded_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
            submittedAt: new Date(item.created_at || item.uploaded_at),
            flagged: !!item.flagged || !!item.is_flagged,
            flagReason: item.flag_reason || item.notes,
            previewUrl: previewUrl,
            stripped: !!item.stripped,
          };
        });
        setRows(mappedData);
      } else {
        setError(response.data.message || "Failed to fetch media");
      }
    } catch (err) {
      console.error("Error fetching pending media:", err);
      setError("An error occurred while fetching pending media.");
    } finally {
      setIsLoading(false);
    }
  };

  const openReview = (m: PendingMedia) => {
    setReviewTarget(m);
    setApprovalError("");
  };
  
  const closeReview = () => { setReviewTarget(null); setApprovalError(""); };

  // ✅ Approve now goes through a confirmation modal instead of running instantly
  const confirmApprove = async () => {
    if (!approveTarget) return;
    try {
      await adminApi.media.approve(Number(approveTarget.id));
      setRows(prev => prev.filter(m => m.id !== approveTarget.id));
      if (reviewTarget?.id === approveTarget.id) closeReview();
      setApproveTarget(null);
    } catch (err) {
      console.error("Approve failed:", err);
      alert(t("mediaQueue.errors.approve") || "Failed to approve media.");
      setApproveTarget(null);
    }
  };

  // ✅ Reject no longer requires a written reason — just a confirmation
  const confirmReject = async () => {
    if (!rejectTarget) return;
    try {
      await adminApi.media.reject(Number(rejectTarget.id));
      setRows(prev => prev.filter(m => m.id !== rejectTarget.id));
      setRejectTarget(null);
    } catch (err) {
      console.error("Reject failed:", err);
      alert(t("mediaQueue.errors.reject") || "Failed to reject media.");
    }
  };

  const confirmStrip = () => {
    if (!stripTarget) return;
    setRows((prev) => prev.map((row) => 
      row.id === stripTarget.id ? { ...row, submittedBy: "System (stripped)", contributorId: "system", stripped: true } : row
    ));
    console.log(`Stripped contributor from media "${stripTarget.title}"`);
    setStripTarget(null);
  };

  // ✅ Handlers for the Modal File Actions
  const handleModalView = async () => {
    if (!reviewTarget) return;
    const url = reviewTarget.previewUrl || reviewTarget.sourceUrl;
    if (!url) return;
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const correctType = reviewTarget.type === 'AUDIO' ? 'audio/mpeg' : 
                          reviewTarget.type === 'VIDEO' ? 'video/mp4' : 
                          'application/pdf';
      const typedBlob = new Blob([blob], { type: correctType });
      const blobUrl = URL.createObjectURL(typedBlob);
      window.open(blobUrl, '_blank');
      setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
    } catch (error) {
      window.open(url, '_blank');
    }
  };

  const handleModalDownload = async () => {
    if (!reviewTarget || reviewTarget.sourceType !== "upload") return;
    const url = reviewTarget.previewUrl || reviewTarget.sourceUrl;
    if (!url) return;
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      const filename = reviewTarget.fileName || reviewTarget.title || 'file.pdf';
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      window.open(url, '_blank');
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

  // ✅ Table Action Button Styles
  const actionBtnBase: React.CSSProperties = { width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 6, cursor: "pointer", transition: "all 0.15s", border: `1px solid ${colors.forestGreen}` };
  const viewBtnStyle: React.CSSProperties = { ...actionBtnBase, backgroundColor: "transparent", color: colors.forestGreen };
  const approveBtnStyle: React.CSSProperties = { ...actionBtnBase, backgroundColor: colors.forestGreen, color: colors.creamLight };
  const rejectBtnStyle: React.CSSProperties = { ...actionBtnBase, backgroundColor: "transparent", color: colors.red, borderColor: colors.red };
  const stripBtnStyle: React.CSSProperties = { ...actionBtnBase, backgroundColor: "transparent", color: colors.forestGreen };

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
                <option value="LINK">Link</option>
              </select>
              
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 10px", backgroundColor: colors.creamMid, border: `1px solid ${colors.forestGreen}`, borderRadius: 8 }}>
              <select value={filterScholar} onChange={(e) => setFilterScholar(e.target.value)} style={selectStyle}>
                <option value="all">{t("mediaQueue.filters.allScholars") || "All Scholars"}</option>
                {scholars.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 10px", backgroundColor: colors.creamMid, border: `1px solid ${colors.forestGreen}`, borderRadius: 8 }}>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)} style={selectStyle}>
                <option value="newest">{t("mediaQueue.sort.newest") || "Newest"}</option>
                <option value="oldest">{t("mediaQueue.sort.oldest") || "Oldest"}</option>
                <option value="title">{t("mediaQueue.sort.titleAZ") || "Title A-Z"}</option>
              </select>
              
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
                {isLoading ? (
                  <tr><td colSpan={7} style={{ padding: 40, textAlign: "center", color: colors.forestGreen }}><Icon name="hourglass_empty" size={48} /><p style={{ marginTop: 12 }}>Loading...</p></td></tr>
                ) : error ? (
                  <tr><td colSpan={7} style={{ padding: 40, textAlign: "center", color: colors.red }}><Icon name="error" size={48} /><p style={{ marginTop: 12 }}>{error}</p><button onClick={fetchPendingMedia} style={{ marginTop: 12, padding: "8px 16px", borderRadius: 6, border: `1px solid ${colors.forestGreen}`, backgroundColor: colors.creamLight, color: colors.forestGreen, cursor: "pointer" }}>Retry</button></td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={7} style={{ padding: 40, textAlign: "center", color: colors.forestGreen, opacity: 0.7 }}><Icon name="inbox" size={48} /><p style={{ marginTop: 12 }}>No media found.</p></td></tr>
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
                              <p style={{ margin: 0, fontWeight: 600, fontFamily: fonts.headline, fontSize: 13, color: colors.forestGreen, textDecoration: m.stripped ? "line-through" : "none" }}>{m.title}</p>
                              {m.flagged && <p style={{ margin: "3px 0 0", fontFamily: fonts.label, fontSize: 10, color: colors.red, fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}><Icon name="flag" size={12} /> {m.flagReason}</p>}
                            </div>
                          </div>
                        </td>
                        <td style={tdStyle}><span style={{ fontFamily: fonts.label, fontSize: 10, fontWeight: 700, padding: "4px 10px", borderRadius: 9999, backgroundColor: colors.creamMid, color: colors.forestGreen, border: `1px solid ${colors.creamDark}` }}>{m.type}</span></td>
                        <td style={tdStyle}>
                          {m.sourceType === "link" ? (
                            <a href={m.sourceUrl} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 4, fontFamily: fonts.body, fontSize: 12, color: colors.forestGreen, textDecoration: "none", fontWeight: 600 }}><Icon name="link" size={14} /> View Link</a>
                          ) : (
                            <div><p style={{ margin: 0, display: "flex", alignItems: "center", gap: 4, fontFamily: fonts.body, fontSize: 12, color: colors.forestGreen, fontWeight: 600 }}><Icon name="upload_file" size={14} /> {m.fileName || "No file"}</p></div>
                          )}
                        </td>
                        <td style={tdStyle}><span style={{ fontFamily: fonts.body, fontSize: 13, fontWeight: 500 }}>{m.scholarName}</span></td>
                        <td style={tdStyle}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <Avatar name={m.submittedBy} size={28} />
                            <span style={{ fontFamily: fonts.body, fontSize: 13 }}>{m.submittedBy}</span>
                          </div>
                        </td>
                        <td style={{ ...tdStyle, fontFamily: fonts.label, fontSize: 12 }}>{m.date}</td>
                        
                        {/* ✅ 4 Buttons (View, Approve, Reject, Strip) — Approve/Reject now open confirmation modals */}
                        <td style={{ ...tdStyle, textAlign: isRTL ? "left" : "right" }}>
                          <div style={{ display: "flex", justifyContent: isRTL ? "flex-start" : "flex-end", gap: 6 }}>
                            <button onClick={() => openReview(m)} title="View Details" style={viewBtnStyle} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = colors.creamMid; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}>
                              <Icon name="visibility" size={18} />
                            </button>
                            <button onClick={() => setApproveTarget(m)} title="Approve" style={approveBtnStyle} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#285b4b"; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = colors.forestGreen; }}>
                              <Icon name="check" size={18} filled />
                            </button>
                            <button onClick={() => setRejectTarget(m)} title="Reject" style={rejectBtnStyle} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = colors.red; e.currentTarget.style.color = colors.creamLight; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = colors.red; }}>
                              <Icon name="close" size={18} />
                            </button>
                            <button onClick={() => !m.stripped && setStripTarget(m)} title={m.stripped ? "Already stripped" : "Strip"} disabled={m.stripped} style={{...stripBtnStyle, opacity: m.stripped ? 0.4 : 1, cursor: m.stripped ? "not-allowed" : "pointer"}} onMouseEnter={(e) => { if(!m.stripped) e.currentTarget.style.backgroundColor = colors.creamMid; }} onMouseLeave={(e) => { if(!m.stripped) e.currentTarget.style.backgroundColor = "transparent"; }}>
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

        {/* ─ Review Modal ── */}
        {reviewTarget && (
          <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(11, 67, 53, 0.6)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)", padding: 20 }} onClick={closeReview}>
            <div style={{ ...cardStyle, backgroundColor: colors.creamLight, width: "95vw", maxWidth: 560, maxHeight: "85vh", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }} onClick={(e) => e.stopPropagation()}>
              
              <div style={{ padding: "16px 24px", borderBottom: `1px solid ${colors.forestGreen}`, display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: colors.creamMid }}>
                <h3 style={{ fontFamily: fonts.headline, fontSize: 18, fontWeight: 700, color: colors.forestGreen, margin: 0, display: "flex", alignItems: "center", gap: 10 }}>
                  <Icon name="fact_check" size={22} /> {t("mediaQueue.review.title") || "Review Media"}
                </h3>
                <button onClick={closeReview} style={{ background: "none", border: "none", cursor: "pointer", color: colors.forestGreen, padding: 4, borderRadius: 6, display: "flex", alignItems: "center" }}>
                  <Icon name="close" size={22} />
                </button>
              </div>

              <div style={{ flex: 1, overflow: "hidden", display: "flex" }}>
                <div style={{ flex: 1, padding: 24, overflowY: "auto", display: "flex", flexDirection: "column", gap: 20, backgroundColor: colors.creamLight }}>

                  <div style={{ paddingBottom: 16, borderBottom: `1px solid ${colors.creamDark}` }}>
                    <h4 style={{ fontFamily: fonts.label, fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: colors.forestGreen, margin: "0 0 12px", opacity: 0.8 }}>Details</h4>
                    {[
                      { label: "Title", value: reviewTarget.title, bold: true },
                      ...(reviewTarget.description ? [{ label: "Description", value: reviewTarget.description }] : []),
                      { label: "Scholar", value: reviewTarget.scholarName },
                      { label: "Type", value: reviewTarget.type },
                      { label: "Submitted By", value: `${reviewTarget.submittedBy} (${reviewTarget.date})` },
                      ...(reviewTarget.fileName ? [{ label: "File Name", value: reviewTarget.fileName }] : []),
                    ].map((row, i) => (
                      <div key={i} style={{ display: "flex", gap: 8, fontSize: 13, marginBottom: 6, paddingBottom: 6, borderBottom: i < 4 ? `1px solid ${colors.creamMid}` : "none" }}>
                        <span style={{ fontWeight: 600, color: colors.forestGreen, opacity: 0.7, minWidth: 100, flexShrink: 0 }}>{row.label}:</span>
                        <span style={{ color: colors.forestGreen, fontWeight: row.bold ? 600 : 400 }}>{row.value}</span>
                      </div>
                    ))}
                  </div>

                  {/* ✅ File Actions Section inside Modal */}
                  <div style={{ paddingBottom: 16, borderBottom: `1px solid ${colors.creamDark}` }}>
                    <h4 style={{ fontFamily: fonts.label, fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: colors.forestGreen, margin: "0 0 12px", opacity: 0.8 }}>File Actions</h4>
                    <div style={{ display: "flex", gap: 10 }}>
                      {reviewTarget.sourceType === "upload" ? (
                        <>
                          <button onClick={handleModalView} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "10px", borderRadius: 6, border: `1px solid ${colors.forestGreen}`, backgroundColor: "transparent", color: colors.forestGreen, fontFamily: fonts.label, fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", cursor: "pointer" }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = colors.forestGreen; e.currentTarget.style.color = colors.creamLight; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = colors.forestGreen; }}>
                            <Icon name="visibility" size={16} /> VIEW FILE
                          </button>
                          <button onClick={handleModalDownload} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "10px", borderRadius: 6, border: "none", backgroundColor: colors.forestGreen, color: colors.creamLight, fontFamily: fonts.label, fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", cursor: "pointer" }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#285b4b"; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = colors.forestGreen; }}>
                            <Icon name="download" size={16} /> DOWNLOAD
                          </button>
                        </>
                      ) : (
                        <a href={reviewTarget.sourceUrl || reviewTarget.previewUrl} target="_blank" rel="noopener noreferrer" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "10px", borderRadius: 6, border: "none", backgroundColor: colors.forestGreen, color: colors.creamLight, fontFamily: fonts.label, fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", cursor: "pointer", textDecoration: "none" }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#285b4b"; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = colors.forestGreen; }}>
                          <Icon name="open_in_new" size={16} /> OPEN LINK
                        </a>
                      )}
                    </div>
                  </div>

                  {approvalError && (
                    <div style={{ fontSize: 12, color: colors.red, fontWeight: 600, display: "flex", alignItems: "center", gap: 6, padding: "10px", backgroundColor: "rgba(139,44,44,0.06)", borderRadius: 6 }}>
                      <Icon name="error" size={16} /> {approvalError}
                    </div>
                  )}

                  {/* ✅ Delete button removed — Reject / Approve are now the only actions here */}
                  <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: "auto", paddingTop: 16, borderTop: `1px solid ${colors.creamDark}` }}>
                    <button onClick={() => { setRejectTarget(reviewTarget); closeReview(); }} style={{ padding: "10px 20px", borderRadius: 8, cursor: "pointer", border: `1px solid ${colors.forestGreen}`, backgroundColor: "transparent", color: colors.forestGreen, fontFamily: fonts.body, fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
                      <Icon name="cancel" size={16} /> Reject
                    </button>
                    <div style={{ flex: 1 }} />
                    <button onClick={() => { setApproveTarget(reviewTarget); closeReview(); }} style={{ padding: "10px 24px", borderRadius: 8, cursor: "pointer", border: "none", backgroundColor: colors.forestGreen, color: colors.creamLight, fontFamily: fonts.body, fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
                      <Icon name="check_circle" size={16} filled /> Approve
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─ Approve Confirmation Modal ── */}
        {approveTarget && (
          <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(11, 67, 53, 0.5)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }} onClick={() => setApproveTarget(null)}>
            <div style={{ ...cardStyle, backgroundColor: colors.creamLight, width: 440, maxWidth: "90vw", padding: 32, boxShadow: "0 20px 60px rgba(0,0,0,0.18)" }} onClick={(e) => e.stopPropagation()}>
              <div style={{ width: 56, height: 56, borderRadius: "50%", backgroundColor: colors.forestGreen, color: colors.creamLight, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20, border: `1px solid ${colors.forestGreen}` }}><Icon name="check_circle" size={28} filled /></div>
              <h2 style={{ fontFamily: fonts.headline, fontSize: 20, fontWeight: 700, color: colors.forestGreen, marginBottom: 12 }}>Approve Submission</h2>
              <p style={{ fontFamily: fonts.body, fontSize: 14, color: colors.forestGreen, lineHeight: 1.6, marginBottom: 24, opacity: 0.8 }}>Are you sure you want to approve "{approveTarget.title}"?</p>
              <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
                <button onClick={() => setApproveTarget(null)} style={{ padding: "10px 24px", borderRadius: 8, cursor: "pointer", border: `1px solid ${colors.forestGreen}`, backgroundColor: colors.creamLight, fontFamily: fonts.body, fontSize: 13, fontWeight: 600, color: colors.forestGreen }}>Cancel</button>
                <button onClick={confirmApprove} style={{ padding: "10px 24px", borderRadius: 8, cursor: "pointer", border: "none", backgroundColor: colors.forestGreen, color: colors.creamLight, fontFamily: fonts.body, fontSize: 13, fontWeight: 700 }}>Confirm Approve</button>
              </div>
            </div>
          </div>
        )}

        {/* ─ Reject Confirmation Modal ── */}
        {rejectTarget && (
          <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(11, 67, 53, 0.5)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }} onClick={() => setRejectTarget(null)}>
            <div style={{ ...cardStyle, backgroundColor: colors.creamLight, width: 440, maxWidth: "90vw", padding: 32, boxShadow: "0 20px 60px rgba(0,0,0,0.18)" }} onClick={(e) => e.stopPropagation()}>
              <div style={{ width: 56, height: 56, borderRadius: "50%", backgroundColor: colors.red, color: colors.creamLight, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20, border: `1px solid ${colors.red}` }}><Icon name="cancel" size={28} filled /></div>
              <h2 style={{ fontFamily: fonts.headline, fontSize: 20, fontWeight: 700, color: colors.forestGreen, marginBottom: 12 }}>Reject Submission</h2>
              <p style={{ fontFamily: fonts.body, fontSize: 14, color: colors.forestGreen, lineHeight: 1.6, marginBottom: 24, opacity: 0.8 }}>Are you sure you want to reject "{rejectTarget.title}"?</p>
              <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
                <button onClick={() => setRejectTarget(null)} style={{ padding: "10px 24px", borderRadius: 8, cursor: "pointer", border: `1px solid ${colors.forestGreen}`, backgroundColor: colors.creamLight, fontFamily: fonts.body, fontSize: 13, fontWeight: 600, color: colors.forestGreen }}>Cancel</button>
                <button onClick={confirmReject} style={{ padding: "10px 24px", borderRadius: 8, cursor: "pointer", border: "none", backgroundColor: colors.red, color: colors.creamLight, fontFamily: fonts.body, fontSize: 13, fontWeight: 700 }}>Confirm Reject</button>
              </div>
            </div>
          </div>
        )}

        {/* ── Strip Modal ── */}
        {stripTarget && (
          <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(11, 67, 53, 0.5)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }} onClick={() => setStripTarget(null)}>
            <div style={{ ...cardStyle, backgroundColor: colors.creamLight, width: 440, maxWidth: "90vw", padding: 32, boxShadow: "0 20px 60px rgba(0,0,0,0.18)" }} onClick={(e) => e.stopPropagation()}>
              <div style={{ width: 56, height: 56, borderRadius: "50%", backgroundColor: colors.red, color: colors.creamLight, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20, border: `1px solid ${colors.red}` }}><Icon name="person_remove" size={28} filled /></div>
              <h2 style={{ fontFamily: fonts.headline, fontSize: 20, fontWeight: 700, color: colors.forestGreen, marginBottom: 12 }}>Strip Contributor</h2>
              <p style={{ fontFamily: fonts.body, fontSize: 14, color: colors.forestGreen, lineHeight: 1.6, marginBottom: 28, opacity: 0.8 }}>Strip {stripTarget.submittedBy} from "{stripTarget.title}"? <br/><b style={{ color: colors.red }}>This cannot be undone.</b></p>
              <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
                <button onClick={() => setStripTarget(null)} style={{ padding: "10px 24px", borderRadius: 8, cursor: "pointer", border: `1px solid ${colors.forestGreen}`, backgroundColor: colors.creamLight, fontFamily: fonts.body, fontSize: 13, fontWeight: 600, color: colors.forestGreen }}>Cancel</button>
                <button onClick={confirmStrip} style={{ padding: "10px 24px", borderRadius: 8, cursor: "pointer", border: "none", backgroundColor: colors.red, color: colors.creamLight, fontFamily: fonts.body, fontSize: 13, fontWeight: 700 }}>Confirm</button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}