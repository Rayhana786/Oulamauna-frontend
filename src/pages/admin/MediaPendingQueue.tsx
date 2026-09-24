import React, { useState, useMemo, useEffect } from "react";
import { useLang } from "../../context/LanguageContext";
import adminApi from "../../api/adminApi";

type MediaType = "PDF" | "AUDIO" | "VIDEO" | "LINK";
type SourceType = "link" | "upload";
type SortOption = "newest" | "oldest" | "title";

interface PendingMedia {
  id: string; title: string; description: string; type: MediaType; sourceType: SourceType;
  sourceUrl?: string; fileName?: string; fileSize?: string; scholarName: string; scholarId: string; languageCode: string;
  submittedBy: string; contributorId: string; date: string; submittedAt: Date;
  flagged: boolean; flagReason?: string; previewUrl?: string; stripped?: boolean;
}

const TYPE_META: Record<MediaType, { icon: string }> = {
  PDF:   { icon: "picture_as_pdf" },
  AUDIO: { icon: "headphones" },
  VIDEO: { icon: "movie" },
  LINK:  { icon: "link" },
};

export default function MediaPendingQueue() {
  const { t, lang, dbLanguages } = useLang();
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
  const [approveReason, setApproveReason] = useState("");
  const [rejectTarget, setRejectTarget] = useState<PendingMedia | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const [restrictTarget, setRestrictTarget] = useState<PendingMedia | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ type: 'revoke' | 'ban', media: PendingMedia } | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 15;

  const scholars = useMemo(() => [...new Set(rows.map((r) => r.scholarName))].sort(), [rows]);

  const filtered = useMemo(() => {
    let result = [...rows];
    if (filterType !== "all") result = result.filter((m) => m.type === filterType);
    if (filterScholar !== "all") result = result.filter((m) => m.scholarName === filterScholar);
    result.sort((a, b) => {
      if (sortBy === "newest") return b.submittedAt.getTime() - a.submittedAt.getTime();
      if (sortBy === "oldest") return a.submittedAt.getTime() - b.submittedAt.getTime();
      return a.title.localeCompare(b.title);
    });
    return result;
  }, [rows, filterType, filterScholar, sortBy]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginatedMedia = useMemo(() => 
    filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE),
  [filtered, currentPage]);

  useEffect(() => { setCurrentPage(1); }, [filterType, filterScholar, sortBy]);

  const clearFilters = () => { setFilterType("all"); setFilterScholar("all"); setSortBy("newest"); };
  const hasActiveFilters = filterType !== "all" || filterScholar !== "all";

  const getLangName = (code: string) => {
    const found = dbLanguages.find((l: any) => l.code.toLowerCase() === code.toLowerCase());
    return found ? found.name : code.toUpperCase();
  };

  useEffect(() => { fetchPendingMedia(); }, []);

  const fetchPendingMedia = async () => {
    setIsLoading(true); setError(null);
    try {
      const response = await adminApi.media.getPending();
      if (response.data.success && response.data.data) {
        const mappedData = response.data.data.map((item: any) => {
          const previewUrl = item.media_url || item.source_url || item.file_path || item.preview_url || item.url;
          const isExternal = item.source_type === 'external' || item.sourceType === 'external' || item.source_type === 'link';
          const sourceType: SourceType = isExternal ? 'link' : 'upload';
          let type: MediaType = "PDF";
          if (isExternal) {
            if (previewUrl && (previewUrl.includes('youtube') || previewUrl.includes('vimeo') || previewUrl.includes('.mp4'))) type = "VIDEO";
            else if (previewUrl && previewUrl.includes('.mp3')) type = "AUDIO";
            else type = "LINK";
          } else {
            const fileType = (item.file_type || item.fileType || "pdf").toLowerCase();
            if (fileType === 'audio') type = "AUDIO";
            else if (fileType === 'video') type = "VIDEO";
            else type = "PDF";
          }
          return {
            id: String(item.media_id ?? item.id), title: item.title || "Untitled", description: item.description || "",
            type, sourceType, sourceUrl: previewUrl, fileName: item.file_name || item.fileName, fileSize: item.file_size || item.fileSize,
            scholarName: item.scholar_versions?.canonical_name || "Unknown Scholar",
            scholarId: String(item.scholar_versions?.scholar_id ?? "unknown"),
            languageCode: item.scholar_versions?.languages?.code || "unknown",
            submittedBy: item.users?.username || "Unknown",
            contributorId: String(item.users?.id ?? item.uploaded_by ?? "unknown"),
            date: new Date(item.created_at || item.uploaded_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
            submittedAt: new Date(item.created_at || item.uploaded_at),
            flagged: !!item.flagged || !!item.is_flagged, flagReason: item.flag_reason || item.notes, previewUrl, stripped: !!item.stripped,
          };
        });
        setRows(mappedData);
      } else setError(response.data.message || "Failed to fetch media");
    } catch (err) {
      console.error("Error fetching pending media:", err);
      setError("An error occurred while fetching pending media.");
    } finally { setIsLoading(false); }
  };

  const openReview = (m: PendingMedia) => { setReviewTarget(m); setApprovalError(""); };
  const closeReview = () => { setReviewTarget(null); setApprovalError(""); };

  const confirmApprove = async () => {
    if (!approveTarget) return;
    try {
      await adminApi.media.approve(Number(approveTarget.id), approveReason || "Approved");
      setRows(prev => prev.filter(m => m.id !== approveTarget.id));
      if (reviewTarget?.id === approveTarget.id) closeReview();
      setApproveTarget(null); setApproveReason("");
    } catch (err) {
      console.error("Approve failed:", err);
      alert(t("mediaQueue.errors.approve") || "Failed to approve media.");
      setApproveTarget(null);
    }
  };

  const confirmReject = async () => {
    if (!rejectTarget) return;
    if (!rejectReason.trim()) { alert(t("mediaQueue.modal.rejectReasonPlaceholder") || "Please provide a rejection reason"); return; }
    try {
      await adminApi.media.reject(Number(rejectTarget.id), rejectReason);
      setRows(prev => prev.filter(m => m.id !== rejectTarget.id));
      setRejectTarget(null); setRejectReason("");
    } catch (err) {
      console.error("Reject failed:", err);
      alert(t("mediaQueue.errors.reject") || "Failed to reject media.");
    }
  };

  const executeRestrictionAndReject = async () => {
    if (!confirmAction) return;
    try {
      const { type, media } = confirmAction;
      const userId = parseInt(media.contributorId, 10);
      if (isNaN(userId)) { alert("Cannot restrict system-generated submissions."); setConfirmAction(null); setRestrictTarget(null); return; }
      if (type === 'revoke') await adminApi.users.toggleContribute(userId); else await adminApi.users.ban(userId);
      const defaultReason = type === 'ban' ? "Contributor banned" : "Contribution access revoked";
      await adminApi.media.reject(Number(media.id), defaultReason);
      setRows((prev) => prev.filter((row) => row.id !== media.id));
      setConfirmAction(null); setRestrictTarget(null);
    } catch (err) {
      console.error("Action failed:", err);
      alert("Failed to process action. Please try again.");
    }
  };

  const handleModalView = async () => {
    if (!reviewTarget || !(reviewTarget.previewUrl || reviewTarget.sourceUrl)) return;
    const url = reviewTarget.previewUrl || reviewTarget.sourceUrl;
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const correctType = reviewTarget.type === 'AUDIO' ? 'audio/mpeg' : reviewTarget.type === 'VIDEO' ? 'video/mp4' : 'application/pdf';
      const blobUrl = URL.createObjectURL(new Blob([blob], { type: correctType }));
      window.open(blobUrl, '_blank');
      setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
    } catch { window.open(url, '_blank'); }
  };

  const handleModalDownload = async () => {
    if (!reviewTarget || reviewTarget.sourceType !== "upload" || !(reviewTarget.previewUrl || reviewTarget.sourceUrl)) return;
    const url = reviewTarget.previewUrl || reviewTarget.sourceUrl;
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = reviewTarget.fileName || reviewTarget.title || 'file.pdf';
      document.body.appendChild(link); link.click(); document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch { window.open(url, '_blank'); }
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-[#fbf9f4]"><span className="material-symbols-outlined text-[40px] text-[#1e4d3a]/40 animate-pulse">hourglass_empty</span></div>;

  return (
    <div className="oulamauna-dashboard min-h-screen text-[#1e4d3a] antialiased font-['Inter']" dir={isRTL ? "rtl" : "ltr"}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&family=Source+Serif+4:wght@400;500;600;700&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap');
        .oulamauna-dashboard { background: radial-gradient(circle at 8% 10%, rgba(201,168,76,0.055), transparent 24%), radial-gradient(circle at 92% 16%, rgba(79,145,132,0.06), transparent 25%), #fbf9f4; }
        .oulamauna-dashboard * { box-sizing: border-box; }
        .oulamauna-dashboard .serif-title { font-family: 'Source Serif 4', Georgia, serif; letter-spacing: -0.025em; }
        .oulamauna-dashboard .mono-label { font-family: 'JetBrains Mono', monospace; letter-spacing: 0.06em; }
        .oulamauna-dashboard .dashboard-card { background: rgba(251,249,244,0.96); border: 1px solid rgba(30,77,58,0.10); border-radius: 10px; box-shadow: 0 5px 18px rgba(30,77,58,0.055); transition: box-shadow 180ms ease; }
        .oulamauna-dashboard .dashboard-card:hover { box-shadow: 0 9px 26px rgba(30,77,58,0.08); }
        .oulamauna-dashboard ::selection { background: #C9A84C; color: #1e4d3a; }
      `}</style>

      <main className="max-w-[1450px] mx-auto px-3 md:px-5 xl:px-7 py-6 md:py-8">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <span className="mono-label text-[9px] uppercase font-bold text-[#1e4d3a]/60">ADMIN / MEDIA QUEUE</span>
          </div>
          <h1 className="serif-title text-[27px] md:text-[32px] leading-tight font-semibold text-[#082f27]">{t("mediaQueue.title") || "Media Pending Queue"}</h1>
          <p className="text-[12px] text-[#1e4d3a]/60 mt-1">{t("mediaQueue.subtitle") || "Review and approve pending media submissions."}</p>
        </div>

        <div className="dashboard-card p-4 mb-6">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="flex flex-1 flex-wrap gap-4">
              <div className="flex-1 min-w-[150px]">
                <label className="mono-label text-[9px] uppercase font-bold text-[#1e4d3a]/60 mb-1.5 block">{t("mediaQueue.filters.type") || "Media Type"}</label>
                <select value={filterType} onChange={(e) => setFilterType(e.target.value as any)} className="w-full bg-[#fbf9f4] border border-[#1e4d3a]/15 rounded-[6px] px-3 py-2 text-[12px] font-medium text-[#1e4d3a] focus:outline-none focus:ring-2 focus:ring-[#1e4d3a]/20">
                  <option value="all">{t("mediaQueue.filters.allTypes") || "All Types"}</option>
                  <option value="PDF">{t("mediaQueue.type.pdf") || "PDF"}</option>
                  <option value="AUDIO">{t("mediaQueue.type.audio") || "Audio"}</option>
                  <option value="VIDEO">{t("mediaQueue.type.video") || "Video"}</option>
                  <option value="LINK">{t("mediaQueue.type.link") || "Link"}</option>
                </select>
              </div>
              <div className="flex-1 min-w-[150px]">
                <label className="mono-label text-[9px] uppercase font-bold text-[#1e4d3a]/60 mb-1.5 block">{t("admin.common.scholar") || "Scholar"}</label>
                <select value={filterScholar} onChange={(e) => setFilterScholar(e.target.value)} className="w-full bg-[#fbf9f4] border border-[#1e4d3a]/15 rounded-[6px] px-3 py-2 text-[12px] font-medium text-[#1e4d3a] focus:outline-none focus:ring-2 focus:ring-[#1e4d3a]/20">
                  <option value="all">{t("mediaQueue.filters.allScholars") || "All Scholars"}</option>
                  {scholars.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="flex-1 min-w-[150px]">
                <label className="mono-label text-[9px] uppercase font-bold text-[#1e4d3a]/60 mb-1.5 block">{t("admin.common.sortBy") || "Sort By"}</label>
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)} className="w-full bg-[#fbf9f4] border border-[#1e4d3a]/15 rounded-[6px] px-3 py-2 text-[12px] font-medium text-[#1e4d3a] focus:outline-none focus:ring-2 focus:ring-[#1e4d3a]/20">
                  <option value="newest">{t("mediaQueue.sort.newest") || "Newest"}</option>
                  <option value="oldest">{t("mediaQueue.sort.oldest") || "Oldest"}</option>
                  <option value="title">{t("mediaQueue.sort.titleAZ") || "Title A-Z"}</option>
                </select>
              </div>
            </div>
            {hasActiveFilters && (
              <button onClick={clearFilters} className="flex items-center gap-1.5 px-3 py-2 rounded-[6px] border border-[#e96d5c] text-[#e96d5c] text-[11px] font-bold uppercase tracking-wide hover:bg-[#e96d5c]/5 transition-colors mt-5 md:mt-0 self-end md:self-auto cursor-pointer">
                <span className="material-symbols-outlined text-[14px]">close</span> {t("admin.common.clear") || "Clear"}
              </button>
            )}
          </div>
        </div>

        <div className="dashboard-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#1e4d3a]/10 bg-[#1e4d3a]/[0.02]">
                  <th className="mono-label text-[9px] uppercase font-bold text-[#1e4d3a]/60 px-5 py-3.5">{t("mediaQueue.table.media") || "Media"}</th>
                  <th className="mono-label text-[9px] uppercase font-bold text-[#1e4d3a]/60 px-5 py-3.5">{t("mediaQueue.table.type") || "Type"}</th>
                  <th className="mono-label text-[9px] uppercase font-bold text-[#1e4d3a]/60 px-5 py-3.5">{t("mediaQueue.table.source") || "Source"}</th>
                  <th className="mono-label text-[9px] uppercase font-bold text-[#1e4d3a]/60 px-5 py-3.5">{t("mediaQueue.table.language") || "Language"}</th>
                  <th className="mono-label text-[9px] uppercase font-bold text-[#1e4d3a]/60 px-5 py-3.5">{t("mediaQueue.table.scholar") || "Scholar"}</th>
                  <th className="mono-label text-[9px] uppercase font-bold text-[#1e4d3a]/60 px-5 py-3.5">{t("mediaQueue.table.submitter") || "Submitter"}</th>
                  <th className="mono-label text-[9px] uppercase font-bold text-[#1e4d3a]/60 px-5 py-3.5">{t("mediaQueue.table.submitted") || "Submitted"}</th>
                  <th className="mono-label text-[9px] uppercase font-bold text-[#1e4d3a]/60 px-5 py-3.5 text-right">{t("mediaQueue.table.actions") || "Actions"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e4d3a]/[0.06]">
                {error ? (
                  <tr><td colSpan={8} className="px-5 py-12 text-center text-[#e96d5c]"><span className="material-symbols-outlined text-[40px] mb-2 block mx-auto">error</span><p className="mt-2">{error}</p><button onClick={fetchPendingMedia} className="mt-4 px-4 py-2 rounded-[6px] border border-[#1e4d3a]/20 text-[#1e4d3a] text-[12px] font-bold uppercase tracking-wide hover:bg-[#1e4d3a]/5 transition-colors cursor-pointer">{t("common.retry") || "Retry"}</button></td></tr>
                ) : paginatedMedia.length === 0 ? (
                  <tr><td colSpan={8} className="px-5 py-12 text-center text-[12px] text-[#1e4d3a]/50"><span className="material-symbols-outlined text-[40px] mb-2 block mx-auto">inbox</span>{t("mediaQueue.table.empty") || "No media found."}</td></tr>
                ) : (
                  paginatedMedia.map((m) => {
                    const meta = TYPE_META[m.type];
                    return (
                      <tr key={m.id} className="hover:bg-[#1e4d3a]/[0.015] transition-colors" style={{ opacity: m.stripped ? 0.5 : 1 }}>
                        <td className="px-5 py-3.5">
                          <div className="flex items-start gap-3">
                            <div className="w-9 h-9 rounded-[8px] bg-[#1e4d3a]/5 border border-[#1e4d3a]/10 flex items-center justify-center flex-shrink-0"><span className="material-symbols-outlined text-[18px] text-[#1e4d3a]">{meta.icon}</span></div>
                            <div>
                              <p className="text-[13px] font-semibold text-[#082f27]" style={{ textDecoration: m.stripped ? "line-through" : "none" }}>{m.title}</p>
                              {m.flagged && <p className="mono-label text-[10px] text-[#e96d5c] font-bold flex items-center gap-1 mt-1"><span className="material-symbols-outlined text-[12px]">flag</span> {m.flagReason}</p>}
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5"><span className="inline-flex items-center px-2 py-0.5 rounded-full bg-[#1e4d3a]/5 border border-[#1e4d3a]/10 mono-label text-[10px] font-bold text-[#1e4d3a]/70 uppercase tracking-wide">{m.type}</span></td>
                        <td className="px-5 py-3.5">
                          {m.sourceType === "link" ? (
                            <a href={m.sourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#1e4d3a] hover:text-[#C9A84C] transition-colors"><span className="material-symbols-outlined text-[14px]">link</span> {t("mediaQueue.source.link") || "View Link"}</a>
                          ) : (
                            <div className="flex items-center gap-1 text-[12px] font-semibold text-[#1e4d3a]"><span className="material-symbols-outlined text-[14px]">upload_file</span> {m.fileName || "No file"}</div>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-[13px] font-medium text-[#1e4d3a]">{getLangName(m.languageCode)}</td>
                        <td className="px-5 py-3.5 text-[13px] font-medium text-[#1e4d3a]">{m.scholarName}</td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-[#C9A84C]/10 border border-[#C9A84C]/20 flex items-center justify-center text-[#C9A84C] font-['Source_Serif_4'] font-bold text-[10px] flex-shrink-0">{m.submittedBy.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase()}</div>
                            <span className="text-[12px] font-medium text-[#1e4d3a]" style={{ textDecoration: m.stripped ? "line-through" : "none" }}>{m.submittedBy}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 mono-label text-[11px] text-[#1e4d3a]/70">{m.date}</td>
                        <td className="px-5 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button onClick={() => openReview(m)} title="View Details" className="w-8 h-8 flex items-center justify-center rounded-[6px] border border-[#1e4d3a]/20 text-[#1e4d3a] hover:bg-[#1e4d3a] hover:text-white transition-colors cursor-pointer"><span className="material-symbols-outlined text-[18px]">visibility</span></button>
                            <button onClick={() => { setApproveTarget(m); setApproveReason(""); }} title="Approve" className="w-8 h-8 flex items-center justify-center rounded-[6px] bg-[#1e4d3a] border border-[#1e4d3a] text-white hover:bg-[#1e4d3a]/90 transition-colors cursor-pointer"><span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1, 'wght' 400" }}>check</span></button>
                            <button onClick={() => { setRejectTarget(m); setRejectReason(""); }} title="Reject" className="w-8 h-8 flex items-center justify-center rounded-[6px] border border-[#e96d5c] text-[#e96d5c] hover:bg-[#e96d5c] hover:text-white transition-colors cursor-pointer"><span className="material-symbols-outlined text-[18px]">close</span></button>
                            <button onClick={() => setRestrictTarget(m)} title="Restrict User & Reject" className="w-8 h-8 flex items-center justify-center rounded-[6px] border border-[#C9A84C] text-[#C9A84C] hover:bg-[#C9A84C] hover:text-white transition-colors cursor-pointer"><span className="material-symbols-outlined text-[18px]">shield_person</span></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-5 py-4 border-t border-[#1e4d3a]/10 bg-[#1e4d3a]/[0.01]">
              <div className="text-[11px] text-[#1e4d3a]/60 mono-label">
                {t("admin.common.showing") || "Showing"} {(currentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)} {t("admin.common.of") || "of"} {filtered.length}
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1} className="flex items-center justify-center w-8 h-8 rounded-[6px] border border-[#1e4d3a]/20 text-[#1e4d3a] disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#1e4d3a] hover:text-white transition-colors cursor-pointer">
                  <span className="material-symbols-outlined text-[18px]">{isRTL ? 'arrow_forward' : 'arrow_back'}</span>
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) pageNum = i + 1;
                  else if (currentPage <= 3) pageNum = i + 1;
                  else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                  else pageNum = currentPage - 2 + i;
                  return (
                    <button key={pageNum} onClick={() => setCurrentPage(pageNum)} className={`w-8 h-8 rounded-[6px] text-[11px] font-bold mono-label transition-colors cursor-pointer ${currentPage === pageNum ? 'bg-[#1e4d3a] text-white' : 'border border-[#1e4d3a]/20 text-[#1e4d3a] hover:bg-[#1e4d3a]/10'}`}>
                      {pageNum}
                    </button>
                  );
                })}
                <button onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages} className="flex items-center justify-center w-8 h-8 rounded-[6px] border border-[#1e4d3a]/20 text-[#1e4d3a] disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#1e4d3a] hover:text-white transition-colors cursor-pointer">
                  <span className="material-symbols-outlined text-[18px]">{isRTL ? 'arrow_back' : 'arrow_forward'}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Review Modal */}
        {reviewTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#082f27]/40 backdrop-blur-sm" onClick={closeReview}>
            <div className="dashboard-card w-full max-w-lg p-6 relative" onClick={(e) => e.stopPropagation()}>
              <button onClick={closeReview} className={`absolute top-4 ${isRTL ? 'left-4' : 'right-4'} p-1.5 rounded-full hover:bg-[#1e4d3a]/10 transition-colors cursor-pointer`}><span className="material-symbols-outlined text-[20px] text-[#1e4d3a]">close</span></button>
              <h3 className="serif-title text-[20px] font-semibold text-[#082f27] mb-4 flex items-center gap-2"><span className="material-symbols-outlined text-[22px]">fact_check</span> {t("mediaQueue.review.title") || "Review Media"}</h3>
              <div className="space-y-4 mb-6">
                <div><p className="mono-label text-[9px] uppercase font-bold text-[#1e4d3a]/60 mb-1">{t("mediaQueue.review.label.title") || "Title"}</p><p className="text-[14px] font-semibold text-[#082f27]">{reviewTarget.title}</p></div>
                {reviewTarget.description && <div><p className="mono-label text-[9px] uppercase font-bold text-[#1e4d3a]/60 mb-1">{t("mediaQueue.review.label.description") || "Description"}</p><p className="text-[13px] text-[#1e4d3a]/80 leading-relaxed">{reviewTarget.description}</p></div>}
                <div className="grid grid-cols-2 gap-4">
                  <div><p className="mono-label text-[9px] uppercase font-bold text-[#1e4d3a]/60 mb-1">{t("mediaQueue.review.label.scholar") || "Scholar"}</p><p className="text-[13px] font-medium text-[#1e4d3a]">{reviewTarget.scholarName}</p></div>
                  <div><p className="mono-label text-[9px] uppercase font-bold text-[#1e4d3a]/60 mb-1">{t("mediaQueue.review.label.type") || "Type"}</p><p className="text-[13px] font-medium text-[#1e4d3a]">{reviewTarget.type}</p></div>
                  <div><p className="mono-label text-[9px] uppercase font-bold text-[#1e4d3a]/60 mb-1">{t("mediaQueue.review.label.submittedBy") || "Submitted By"}</p><p className="text-[13px] font-medium text-[#1e4d3a]">{reviewTarget.submittedBy} ({reviewTarget.date})</p></div>
                  {reviewTarget.fileName && <div><p className="mono-label text-[9px] uppercase font-bold text-[#1e4d3a]/60 mb-1">{t("mediaQueue.review.label.fileName") || "File Name"}</p><p className="text-[13px] font-medium text-[#1e4d3a]">{reviewTarget.fileName}</p></div>}
                </div>
              </div>
              <div className="mb-6 p-4 bg-[#1e4d3a]/[0.02] rounded-[8px]">
                <p className="mono-label text-[9px] uppercase font-bold text-[#1e4d3a]/60 mb-3">{t("mediaQueue.review.fileActions") || "File Actions"}</p>
                {reviewTarget.sourceType === "upload" ? (
                  <div className="flex gap-3">
                    <button onClick={handleModalView} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-[6px] border border-[#1e4d3a]/20 text-[#1e4d3a] text-[11px] font-bold uppercase tracking-wide hover:bg-[#1e4d3a] hover:text-white transition-colors cursor-pointer"><span className="material-symbols-outlined text-[16px]">visibility</span> {t("mediaQueue.review.viewFile") || "VIEW FILE"}</button>
                    <button onClick={handleModalDownload} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-[6px] bg-[#1e4d3a] text-white text-[11px] font-bold uppercase tracking-wide hover:bg-[#1e4d3a]/90 transition-colors cursor-pointer"><span className="material-symbols-outlined text-[16px]">download</span> {t("mediaQueue.review.download") || "DOWNLOAD"}</button>
                  </div>
                ) : (
                  <a href={reviewTarget.sourceUrl || reviewTarget.previewUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 w-full py-2.5 rounded-[6px] bg-[#1e4d3a] text-white text-[11px] font-bold uppercase tracking-wide hover:bg-[#1e4d3a]/90 transition-colors cursor-pointer"><span className="material-symbols-outlined text-[16px]">open_in_new</span> {t("mediaQueue.review.openLink") || "OPEN LINK"}</a>
                )}
              </div>
              {approvalError && <div className="flex items-center gap-2 p-3 rounded-[6px] bg-[#e96d5c]/10 text-[#e96d5c] text-[12px] font-semibold mb-4"><span className="material-symbols-outlined text-[16px]">error</span> {approvalError}</div>}
              <div className="flex gap-3 justify-end">
                <button onClick={() => { setRejectTarget(reviewTarget); setRejectReason(""); closeReview(); }} className="px-5 py-2 rounded-[6px] border border-[#e96d5c] text-[#e96d5c] text-[12px] font-bold uppercase tracking-wide hover:bg-[#e96d5c] hover:text-white transition-colors cursor-pointer">{t("mediaQueue.actions.reject") || "Reject"}</button>
                <button onClick={() => { setApproveTarget(reviewTarget); setApproveReason(""); closeReview(); }} className="px-5 py-2 rounded-[6px] bg-[#1e4d3a] text-white text-[12px] font-bold uppercase tracking-wide hover:bg-[#1e4d3a]/90 transition-colors cursor-pointer">{t("mediaQueue.actions.approve") || "Approve"}</button>
              </div>
            </div>
          </div>
        )}

        {/* Approve Modal */}
        {approveTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#082f27]/40 backdrop-blur-sm" onClick={() => { setApproveTarget(null); setApproveReason(""); }}>
            <div className="dashboard-card w-full max-w-md p-6 relative" onClick={(e) => e.stopPropagation()}>
              <button onClick={() => { setApproveTarget(null); setApproveReason(""); }} className={`absolute top-4 ${isRTL ? 'left-4' : 'right-4'} p-1.5 rounded-full hover:bg-[#1e4d3a]/10 transition-colors cursor-pointer`}><span className="material-symbols-outlined text-[20px] text-[#1e4d3a]">close</span></button>
              <div className="w-14 h-14 rounded-full bg-[#1e4d3a] text-white flex items-center justify-center mb-5"><span className="material-symbols-outlined text-[28px]" style={{ fontVariationSettings: "'FILL' 1, 'wght' 400" }}>check_circle</span></div>
              <h3 className="serif-title text-[20px] font-semibold text-[#082f27] mb-2">{t("mediaQueue.modal.approveTitle") || "Approve Submission"}</h3>
              <p className="text-[13px] text-[#1e4d3a]/80 leading-relaxed mb-6">{(t("mediaQueue.modal.approveBody") || "Are you sure you want to approve \"{title}\"?").replace("{title}", approveTarget.title)}</p>
              <div className="mb-6">
                <label className="mono-label text-[9px] uppercase font-bold text-[#1e4d3a]/60 mb-1.5 block">{t("mediaQueue.modal.approveNotesLabel") || "APPROVAL NOTES (Optional)"}</label>
                <textarea value={approveReason} onChange={(e) => setApproveReason(e.target.value)} placeholder={t("mediaQueue.modal.approveNotesPlaceholder") || "Add any notes about this approval..."} className="w-full bg-[#fbf9f4] border border-[#1e4d3a]/15 rounded-[6px] px-3 py-2 text-[12px] font-medium text-[#1e4d3a] focus:outline-none focus:ring-2 focus:ring-[#1e4d3a]/20 min-h-[80px] resize-y" />
              </div>
              <div className="flex gap-3 justify-end">
                <button onClick={() => { setApproveTarget(null); setApproveReason(""); }} className="px-5 py-2 rounded-[6px] border border-[#1e4d3a]/20 text-[#1e4d3a] text-[12px] font-bold uppercase tracking-wide hover:bg-[#1e4d3a]/5 transition-colors cursor-pointer">{t("mediaQueue.modal.cancel") || "Cancel"}</button>
                <button onClick={confirmApprove} className="px-5 py-2 rounded-[6px] bg-[#1e4d3a] text-white text-[12px] font-bold uppercase tracking-wide hover:bg-[#1e4d3a]/90 transition-colors cursor-pointer">{t("mediaQueue.modal.confirmApprove") || "Confirm Approve"}</button>
              </div>
            </div>
          </div>
        )}

        {/* Reject Modal */}
        {rejectTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#082f27]/40 backdrop-blur-sm" onClick={() => { setRejectTarget(null); setRejectReason(""); }}>
            <div className="dashboard-card w-full max-w-md p-6 relative" onClick={(e) => e.stopPropagation()}>
              <button onClick={() => { setRejectTarget(null); setRejectReason(""); }} className={`absolute top-4 ${isRTL ? 'left-4' : 'right-4'} p-1.5 rounded-full hover:bg-[#1e4d3a]/10 transition-colors cursor-pointer`}><span className="material-symbols-outlined text-[20px] text-[#1e4d3a]">close</span></button>
              <div className="w-14 h-14 rounded-full bg-[#e96d5c] text-white flex items-center justify-center mb-5"><span className="material-symbols-outlined text-[28px]" style={{ fontVariationSettings: "'FILL' 1, 'wght' 400" }}>cancel</span></div>
              <h3 className="serif-title text-[20px] font-semibold text-[#082f27] mb-2">{t("mediaQueue.modal.rejectTitle") || "Reject Submission"}</h3>
              <p className="text-[13px] text-[#1e4d3a]/80 leading-relaxed mb-6">{(t("mediaQueue.modal.rejectBody") || "Are you sure you want to reject \"{title}\"?").replace("{title}", rejectTarget.title)}</p>
              <div className="mb-6">
                <label className="mono-label text-[9px] uppercase font-bold text-[#1e4d3a]/60 mb-1.5 block">{t("mediaQueue.modal.rejectReasonLabel") || "REJECTION REASON *"}</label>
                <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder={t("mediaQueue.modal.rejectReasonPlaceholder") || "Please explain why this submission is being rejected..."} className="w-full bg-[#fbf9f4] border border-[#1e4d3a]/15 rounded-[6px] px-3 py-2 text-[12px] font-medium text-[#1e4d3a] focus:outline-none focus:ring-2 focus:ring-[#1e4d3a]/20 min-h-[80px] resize-y" />
              </div>
              <div className="flex gap-3 justify-end">
                <button onClick={() => { setRejectTarget(null); setRejectReason(""); }} className="px-5 py-2 rounded-[6px] border border-[#1e4d3a]/20 text-[#1e4d3a] text-[12px] font-bold uppercase tracking-wide hover:bg-[#1e4d3a]/5 transition-colors cursor-pointer">{t("mediaQueue.modal.cancel") || "Cancel"}</button>
                <button onClick={confirmReject} className="px-5 py-2 rounded-[6px] bg-[#e96d5c] text-white text-[12px] font-bold uppercase tracking-wide hover:bg-[#e96d5c]/90 transition-colors cursor-pointer">{t("mediaQueue.modal.confirm") || "Confirm Reject"}</button>
              </div>
            </div>
          </div>
        )}

        {/* Restrict Modal Step 1 */}
        {restrictTarget && !confirmAction && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#082f27]/40 backdrop-blur-sm" onClick={() => setRestrictTarget(null)}>
            <div className="dashboard-card w-full max-w-lg p-6 relative" onClick={(e) => e.stopPropagation()}>
              <button onClick={() => setRestrictTarget(null)} className={`absolute top-4 ${isRTL ? 'left-4' : 'right-4'} p-1.5 rounded-full hover:bg-[#1e4d3a]/10 transition-colors cursor-pointer`}><span className="material-symbols-outlined text-[20px] text-[#1e4d3a]">close</span></button>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-full bg-[#C9A84C]/10 border border-[#C9A84C]/20 flex items-center justify-center text-[#C9A84C] font-['Source_Serif_4'] font-bold text-[20px] flex-shrink-0">{restrictTarget.submittedBy.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase()}</div>
                <div>
                  <h3 className="serif-title text-[20px] font-semibold text-[#082f27]">{t("mediaQueue.restrict.title") || "Restrict User"}</h3>
                  <p className="text-[12px] text-[#1e4d3a]/60 mt-1">{restrictTarget.submittedBy} {t("mediaQueue.restrict.submitted") || "submitted"} "{restrictTarget.title}"</p>
                </div>
              </div>
              <p className="text-[13px] text-[#1e4d3a]/80 leading-relaxed mb-6">{t("mediaQueue.restrict.desc") || "Choose an action. This will automatically reject this media submission as well."}</p>
              <div className="space-y-3 mb-6">
                <button onClick={() => setConfirmAction({ type: 'revoke', media: restrictTarget })} className="w-full flex items-start gap-4 p-4 rounded-[8px] border border-[#C9A84C]/30 bg-[#C9A84C]/[0.05] hover:bg-[#C9A84C]/10 transition-colors cursor-pointer text-left">
                  <div className="w-8 h-8 rounded-full bg-[#C9A84C] text-white flex items-center justify-center flex-shrink-0 mt-0.5"><span className="material-symbols-outlined text-[18px]">person_off</span></div>
                  <div><p className="text-[13px] font-semibold text-[#082f27] mb-1">{t("mediaQueue.restrict.revoke") || "Revoke Contribution Access"}</p><p className="text-[11px] text-[#1e4d3a]/60 leading-relaxed">{t("mediaQueue.restrict.revokeDesc") || "They can still log in, but cannot submit new content. (Recommended for low-quality submissions)"}</p></div>
                </button>
                <button onClick={() => setConfirmAction({ type: 'ban', media: restrictTarget })} className="w-full flex items-start gap-4 p-4 rounded-[8px] border border-[#e96d5c]/30 bg-[#e96d5c]/[0.05] hover:bg-[#e96d5c]/10 transition-colors cursor-pointer text-left">
                  <div className="w-8 h-8 rounded-full bg-[#e96d5c] text-white flex items-center justify-center flex-shrink-0 mt-0.5"><span className="material-symbols-outlined text-[18px]">block</span></div>
                  <div><p className="text-[13px] font-semibold text-[#082f27] mb-1">{t("mediaQueue.restrict.ban") || "Ban Account Completely"}</p><p className="text-[11px] text-[#1e4d3a]/60 leading-relaxed">{t("mediaQueue.restrict.banDesc") || "They will be completely locked out of the platform. (Use for spam, abuse, or severe violations)"}</p></div>
                </button>
              </div>
              <div className="flex justify-end"><button onClick={() => setRestrictTarget(null)} className="px-5 py-2 rounded-[6px] border border-[#1e4d3a]/20 text-[#1e4d3a] text-[12px] font-bold uppercase tracking-wide hover:bg-[#1e4d3a]/5 transition-colors cursor-pointer">{t("mediaQueue.modal.cancel") || "Cancel"}</button></div>
            </div>
          </div>
        )}

        {/* Restrict Modal Step 2 */}
        {confirmAction && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#082f27]/40 backdrop-blur-sm" onClick={() => setConfirmAction(null)}>
            <div className="dashboard-card w-full max-w-md p-6 relative" onClick={(e) => e.stopPropagation()}>
              <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-5 ${confirmAction.type === 'ban' ? 'bg-[#e96d5c] text-white' : 'bg-[#C9A84C] text-white'}`}><span className="material-symbols-outlined text-[28px]" style={{ fontVariationSettings: "'FILL' 1, 'wght' 400" }}>{confirmAction.type === 'ban' ? "block" : "person_off"}</span></div>
              <h3 className="serif-title text-[20px] font-semibold text-[#082f27] mb-3">{confirmAction.type === 'ban' ? (t("mediaQueue.restrict.confirmBanTitle") || "Confirm Ban") : (t("mediaQueue.restrict.confirmRevokeTitle") || "Confirm Revocation")}</h3>
              <p className="text-[13px] text-[#1e4d3a]/80 leading-relaxed mb-6">
                {t("mediaQueue.restrict.confirmDescPrefix") || "This will"} <strong>{confirmAction.type === 'ban' ? (t("mediaQueue.restrict.banAction") || "BAN") : (t("mediaQueue.restrict.revokeAction") || "REVOKE CONTRIBUTION ACCESS FOR")}</strong> {confirmAction.media.submittedBy}
                <br/>{t("mediaQueue.restrict.confirmDescAndReject") || "and automatically REJECT the media"} "{confirmAction.media.title}".
                <br/><br/><strong className="text-[#e96d5c]">{t("mediaQueue.restrict.confirmDescWarning") || "This action cannot be undone from this screen."}</strong>
              </p>
              <div className="flex gap-3 justify-end">
                <button onClick={() => setConfirmAction(null)} className="px-5 py-2 rounded-[6px] border border-[#1e4d3a]/20 text-[#1e4d3a] text-[12px] font-bold uppercase tracking-wide hover:bg-[#1e4d3a]/5 transition-colors cursor-pointer">{t("mediaQueue.restrict.goBack") || "Go Back"}</button>
                <button onClick={executeRestrictionAndReject} className={`px-5 py-2 rounded-[6px] text-white text-[12px] font-bold uppercase tracking-wide transition-colors cursor-pointer ${confirmAction.type === 'ban' ? 'bg-[#e96d5c] hover:bg-[#e96d5c]/90' : 'bg-[#C9A84C] hover:bg-[#C9A84C]/90'}`}>{t("mediaQueue.restrict.confirmButton") || "Confirm & Reject"}</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}