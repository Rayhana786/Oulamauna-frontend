import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { adminApi, MediaSummary } from "../../api/adminApi";
import { useLang } from "../../context/LanguageContext";

export default function AllMedia() {
  const { lang, t } = useLang();
  const navigate = useNavigate();
  const isRTL = lang === "AR" || lang === "ar";

  const [mediaItems, setMediaItems] = useState<MediaSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterLanguage, setFilterLanguage] = useState<string>("all");
  const [filterScholar, setFilterScholar] = useState<string>("all");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const [selectedMedia, setSelectedMedia] = useState<MediaSummary | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await adminApi.media.getAllSummary();
        if (res.data?.success) setMediaItems(res.data.data as MediaSummary[]);
      } catch (error) { console.error("Failed to fetch media:", error); } 
      finally { setIsLoading(false); }
    };
    fetchData();
  }, []);

  // ✅ Auto-open modal if mediaId is in the URL query parameters
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const mediaIdFromUrl = params.get('mediaId');
    
    if (mediaIdFromUrl && mediaItems.length > 0) {
      const mediaToOpen = mediaItems.find(m => m.mediaId === mediaIdFromUrl);
      if (mediaToOpen) {
        setSelectedMedia(mediaToOpen);
        setIsModalOpen(true);
        // Clean up the URL so it doesn't reopen the modal on page refresh
        window.history.replaceState({}, '', '/admin/media');
      }
    }
  }, [mediaItems]);

  const uniqueLanguages = useMemo(() => Array.from(new Set(mediaItems.map(m => m.languageCode).filter(Boolean))), [mediaItems]);
  const uniqueScholars = useMemo(() => Array.from(new Set(mediaItems.map(m => m.scholarName).filter(Boolean))), [mediaItems]);

  const filteredMedia = useMemo(() => {
    let result = mediaItems.filter(item => {
      if (filterStatus !== "all" && item.status !== filterStatus) return false;
      if (filterLanguage !== "all" && item.languageCode !== filterLanguage) return false;
      if (filterScholar !== "all" && item.scholarName !== filterScholar) return false;
      return true;
    });

    result = result.sort((a, b) => {
      const dateA = new Date(a.uploadedAt || 0).getTime();
      const dateB = new Date(b.uploadedAt || 0).getTime();
      return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
    });

    return result;
  }, [mediaItems, filterStatus, filterLanguage, filterScholar, sortOrder]);

  const totalPages = Math.ceil(filteredMedia.length / ITEMS_PER_PAGE);
  const paginatedMedia = filteredMedia.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [filterStatus, filterLanguage, filterScholar, sortOrder]);

  const getMimeType = (url: string, fileType?: string | null): string => {
    if (fileType === 'audio') return 'audio/mpeg';
    if (fileType === 'video') return 'video/mp4';
    const ext = url.split('.').pop()?.toLowerCase().split('?')[0];
    if (['mp3', 'wav', 'ogg', 'm4a'].includes(ext || '')) return 'audio/mpeg';
    if (['mp4', 'webm', 'avi', 'mov'].includes(ext || '')) return 'video/mp4';
    return 'application/pdf';
  };

  const handleViewFile = async (url: string, fileType?: string | null) => {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error('Network response was not ok');
      const blob = await response.blob();
      const typedBlob = new Blob([blob], { type: getMimeType(url, fileType) });
      const blobUrl = URL.createObjectURL(typedBlob);
      window.open(blobUrl, '_blank');
      setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
    } catch (error) {
      console.error('View failed, falling back to direct link:', error);
      window.open(url, '_blank');
    }
  };

  const handleDownloadFile = async (url: string, fileName: string | null | undefined, title: string, fileType?: string | null) => {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error('Network response was not ok');
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      
      let ext = url.split('.').pop()?.toLowerCase().split('?')[0] || 'pdf';
      if (fileType === 'audio') ext = 'mp3';
      if (fileType === 'video') ext = 'mp4';
      
      const safeFileName = fileName || `${title}.${ext}`; 
      
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = safeFileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Download failed, falling back to direct link:', error);
      window.open(url, '_blank');
    }
  };

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#fbf9f4]">
      <span className="material-symbols-outlined text-[40px] text-[#1e4d3a]/40 animate-pulse">hourglass_empty</span>
    </div>
  );

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
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <div className="mono-label text-[9px] uppercase font-bold text-[#C9A84C] mb-1">{t("adminDashboard.title")}</div>
            <h1 className="serif-title text-[27px] md:text-[32px] leading-tight font-semibold text-[#082f27]">{t("admin.media.title")}</h1>
          </div>
          <button onClick={() => navigate("/admin/pending/media")} className="inline-flex items-center justify-center gap-2 rounded-[8px] bg-[#1e4d3a] text-white border-2 border-[#1e4d3a] px-5 py-3 text-[10px] font-bold uppercase tracking-[0.06em] hover:bg-white hover:text-[#1e4d3a] transition-all duration-300 cursor-pointer">
            <span className="material-symbols-outlined text-[17px]" style={{ fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}>pending_actions</span>
            {t("reviewQueue.title")}
          </button>
        </header>

        <div className="dashboard-card p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="mono-label text-[9px] uppercase font-bold text-[#1e4d3a]/60 mb-1.5 block">{t("admin.common.status")}</label>
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="w-full bg-[#fbf9f4] border border-[#1e4d3a]/15 rounded-[6px] px-3 py-2 text-[12px] font-medium text-[#1e4d3a] focus:outline-none focus:ring-2 focus:ring-[#1e4d3a]/20">
                <option value="all">{t("admin.common.all")}</option>
                <option value="approved">{t("admin.common.approved")}</option>
                <option value="pending">{t("admin.common.pending")}</option>
                <option value="rejected">{t("admin.common.rejected")}</option>
              </select>
            </div>
            <div>
              <label className="mono-label text-[9px] uppercase font-bold text-[#1e4d3a]/60 mb-1.5 block">{t("admin.common.language")}</label>
              <select value={filterLanguage} onChange={(e) => setFilterLanguage(e.target.value)} className="w-full bg-[#fbf9f4] border border-[#1e4d3a]/15 rounded-[6px] px-3 py-2 text-[12px] font-medium text-[#1e4d3a] focus:outline-none focus:ring-2 focus:ring-[#1e4d3a]/20">
                <option value="all">{t("admin.common.all")}</option>
                {uniqueLanguages.map(code => <option key={code} value={code}>{code.toUpperCase()}</option>)}
              </select>
            </div>
            <div>
              <label className="mono-label text-[9px] uppercase font-bold text-[#1e4d3a]/60 mb-1.5 block">{t("admin.common.scholar")}</label>
              <select value={filterScholar} onChange={(e) => setFilterScholar(e.target.value)} className="w-full bg-[#fbf9f4] border border-[#1e4d3a]/15 rounded-[6px] px-3 py-2 text-[12px] font-medium text-[#1e4d3a] focus:outline-none focus:ring-2 focus:ring-[#1e4d3a]/20">
                <option value="all">{t("admin.common.all")}</option>
                {uniqueScholars.map(scholar => <option key={scholar} value={scholar}>{scholar}</option>)}
              </select>
            </div>
            <div>
              <label className="mono-label text-[9px] uppercase font-bold text-[#1e4d3a]/60 mb-1.5 block">{t("admin.common.sortBy") || "Sort By"}</label>
              <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value as "newest" | "oldest")} className="w-full bg-[#fbf9f4] border border-[#1e4d3a]/15 rounded-[6px] px-3 py-2 text-[12px] font-medium text-[#1e4d3a] focus:outline-none focus:ring-2 focus:ring-[#1e4d3a]/20">
                <option value="newest">{t("admin.common.newestFirst") || "Newest First"}</option>
                <option value="oldest">{t("admin.common.oldestFirst") || "Oldest First"}</option>
              </select>
            </div>
          </div>
        </div>

        <div className="dashboard-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#1e4d3a]/10 bg-[#1e4d3a]/[0.02]">
                  <th className="mono-label text-[9px] uppercase font-bold text-[#1e4d3a]/60 px-5 py-3.5">{t("admin.common.title")}</th>
                  <th className="mono-label text-[9px] uppercase font-bold text-[#1e4d3a]/60 px-5 py-3.5">{t("admin.common.scholar")}</th>
                  <th className="mono-label text-[9px] uppercase font-bold text-[#1e4d3a]/60 px-5 py-3.5">{t("admin.common.language")}</th>
                  <th className="mono-label text-[9px] uppercase font-bold text-[#1e4d3a]/60 px-5 py-3.5">{t("admin.common.type")}</th>
                  <th className="mono-label text-[9px] uppercase font-bold text-[#1e4d3a]/60 px-5 py-3.5">{t("admin.common.status")}</th>
                  <th className="mono-label text-[9px] uppercase font-bold text-[#1e4d3a]/60 px-5 py-3.5 text-right">{t("admin.common.actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e4d3a]/[0.06]">
                {paginatedMedia.length === 0 ? (
                  <tr><td colSpan={6} className="px-5 py-12 text-center text-[12px] text-[#1e4d3a]/50">{t("admin.media.noData")}</td></tr>
                ) : (
                  paginatedMedia.map((item) => (
                    <tr key={item.mediaId} className="hover:bg-[#1e4d3a]/[0.015] transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="text-[12px] font-semibold text-[#082f27] truncate max-w-[200px]" title={item.title}>{item.title}</div>
                        {item.year && <div className="text-[10px] text-[#1e4d3a]/50 mt-0.5">{item.year}</div>}
                      </td>
                      <td className="px-5 py-3.5"><div className="text-[12px] font-medium text-[#1e4d3a] truncate max-w-[150px]" title={item.scholarName}>{item.scholarName}</div></td>
                      <td className="px-5 py-3.5"><span className="inline-flex items-center px-2 py-0.5 rounded-full bg-[#3d6b96]/10 text-[#3d6b96] text-[10px] font-bold mono-label">{item.languageCode.toUpperCase()}</span></td>
                      <td className="px-5 py-3.5"><span className="text-[11px] text-[#1e4d3a]/70 capitalize">{item.fileType || "File"}</span></td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold mono-label ${item.status === 'approved' ? 'bg-[#2f7d74]/10 text-[#2f7d74]' : item.status === 'pending' ? 'bg-[#C9A84C]/10 text-[#C9A84C]' : 'bg-[#e96d5c]/10 text-[#e96d5c]'}`}>
                          {t(`admin.common.${item.status}`)}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <button onClick={() => { setSelectedMedia(item); setIsModalOpen(true); }} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] bg-[#1e4d3a] text-white text-[10px] font-bold uppercase tracking-wide hover:bg-[#1e4d3a]/90 transition-colors cursor-pointer">
                          {t("admin.common.details")}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* ✅ PAGINATION FOOTER */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-4 border-t border-[#1e4d3a]/10 bg-[#1e4d3a]/[0.01]">
              <div className="text-[11px] text-[#1e4d3a]/60 mono-label">
                {t("admin.common.showing") || "Showing"} {(currentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, filteredMedia.length)} {t("admin.common.of") || "of"} {filteredMedia.length}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="flex items-center justify-center w-8 h-8 rounded-[6px] border border-[#1e4d3a]/20 text-[#1e4d3a] disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#1e4d3a] hover:text-white transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">{isRTL ? 'arrow_forward' : 'arrow_back'}</span>
                </button>
                
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) pageNum = i + 1;
                  else if (currentPage <= 3) pageNum = i + 1;
                  else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                  else pageNum = currentPage - 2 + i;
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-8 h-8 rounded-[6px] text-[11px] font-bold mono-label transition-colors cursor-pointer ${
                        currentPage === pageNum 
                          ? 'bg-[#1e4d3a] text-white' 
                          : 'border border-[#1e4d3a]/20 text-[#1e4d3a] hover:bg-[#1e4d3a]/10'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="flex items-center justify-center w-8 h-8 rounded-[6px] border border-[#1e4d3a]/20 text-[#1e4d3a] disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#1e4d3a] hover:text-white transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">{isRTL ? 'arrow_back' : 'arrow_forward'}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {isModalOpen && selectedMedia && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#082f27]/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}>
            <div className="dashboard-card w-full max-w-lg p-6 relative" onClick={(e) => e.stopPropagation()}>
              <button onClick={() => setIsModalOpen(false)} className={`absolute top-4 ${isRTL ? 'left-4' : 'right-4'} p-1.5 rounded-full hover:bg-[#1e4d3a]/10 transition-colors cursor-pointer`}>
                <span className="material-symbols-outlined text-[20px] text-[#1e4d3a]">close</span>
              </button>

              <div className="mb-4">
                <h3 className="serif-title text-[22px] font-semibold text-[#082f27] mb-1">{selectedMedia.title}</h3>
                <p className="text-[12px] text-[#1e4d3a]/60">{selectedMedia.scholarName} • {selectedMedia.languageCode.toUpperCase()}</p>
              </div>

              <div className="space-y-3 mb-6 bg-[#1e4d3a]/[0.02] p-4 rounded-[8px]">
                <div className="flex justify-between text-[12px]">
                  <span className="text-[#1e4d3a]/60 mono-label uppercase text-[9px]">{t("admin.common.type")}</span>
                  <span className="font-medium text-[#082f27] capitalize">{selectedMedia.fileType || "File"}</span>
                </div>
                <div className="flex justify-between text-[12px]">
                  <span className="text-[#1e4d3a]/60 mono-label uppercase text-[9px]">{t("admin.common.year")}</span>
                  <span className="font-medium text-[#082f27]">{selectedMedia.year || "—"}</span>
                </div>
                <div className="flex justify-between text-[12px]">
                  <span className="text-[#1e4d3a]/60 mono-label uppercase text-[9px]">{t("admin.common.status")}</span>
                  <span className={`font-bold mono-label ${selectedMedia.status === 'approved' ? 'text-[#2f7d74]' : selectedMedia.status === 'pending' ? 'text-[#C9A84C]' : 'text-[#e96d5c]'}`}>{t(`admin.common.${selectedMedia.status}`)}</span>
                </div>
                <div className="flex justify-between text-[12px]">
                  <span className="text-[#1e4d3a]/60 mono-label uppercase text-[9px]">{t("admin.media.uploader")}</span>
                  <span className="font-medium text-[#082f27]">{selectedMedia.uploader?.name || selectedMedia.uploader?.username || t("admin.common.unknown")}</span>
                </div>
                <div className="flex justify-between text-[12px]">
                  <span className="text-[#1e4d3a]/60 mono-label uppercase text-[9px]">{t("admin.media.views")} / {t("admin.media.likes")}</span>
                  <span className="font-medium text-[#082f27]">{selectedMedia.viewCount} / {selectedMedia.likeCount}</span>
                </div>
                {selectedMedia.description && (
                  <div className="pt-3 border-t border-[#1e4d3a]/10">
                    <span className="text-[#1e4d3a]/60 mono-label uppercase text-[9px] block mb-1">{t("admin.media.description")}</span>
                    <p className="text-[12px] text-[#1e4d3a]/80 leading-relaxed">{selectedMedia.description}</p>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-3">
                {selectedMedia.sourceType === 'external' && selectedMedia.mediaUrl ? (
                  <a href={selectedMedia.mediaUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 w-full py-2.5 rounded-[8px] bg-[#3d6b96] text-white text-[11px] font-bold uppercase tracking-wide hover:bg-[#3d6b96]/90 transition-colors cursor-pointer">
                    <span className="material-symbols-outlined text-[16px]">open_in_new</span>{t("admin.common.openLink")}
                  </a>
                ) : selectedMedia.filePath || selectedMedia.mediaUrl ? (
                  <>
                    <button onClick={() => handleViewFile(selectedMedia.mediaUrl || selectedMedia.filePath || "", selectedMedia.fileType)} className="flex items-center justify-center gap-2 w-full py-2.5 rounded-[8px] bg-[#1e4d3a] text-white text-[11px] font-bold uppercase tracking-wide hover:bg-[#1e4d3a]/90 transition-colors cursor-pointer">
                      <span className="material-symbols-outlined text-[16px]">visibility</span>{t("admin.common.view")}
                    </button>
                    <button onClick={() => handleDownloadFile(selectedMedia.mediaUrl || selectedMedia.filePath || "", selectedMedia.fileName, selectedMedia.title, selectedMedia.fileType)} className="flex items-center justify-center gap-2 w-full py-2.5 rounded-[8px] border border-[#1e4d3a]/20 text-[#1e4d3a] text-[11px] font-bold uppercase tracking-wide hover:bg-[#1e4d3a]/5 transition-colors cursor-pointer">
                      <span className="material-symbols-outlined text-[16px]">download</span>{t("admin.common.download")}
                    </button>
                  </>
                ) : (
                  <div className="text-center py-4 text-[12px] text-[#1e4d3a]/50 bg-[#1e4d3a]/[0.03] rounded-[8px]">{t("admin.common.noFileAttached")}</div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}