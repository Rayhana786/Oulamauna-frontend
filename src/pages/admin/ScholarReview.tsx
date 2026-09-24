import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useLang } from "../../context/LanguageContext";
import { adminApi } from "../../api/adminApi";
import BiographyRenderer from "../../components/BiographyRenderer";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
interface Work { 
  id?: number; work_id?: number; title: string; year: number; format: string; 
  digitalAccess?: "pdf" | "audio" | "file" | null; accessUrl?: string; 
  accessFileName?: string; accessSource?: "upload" | "link"; 
  uploadedBy?: string; uploadedByUrl?: string; 
}

interface MediaItem { 
  id?: number; media_id?: number; type: "pdf" | "audio" | "video"; 
  title: string; description: string; viewCount: number; likeCount: number; 
  action: string; actionIcon: string; accessUrl?: string; 
  accessSource?: "upload" | "link"; accessFileName?: string; 
  uploadedBy?: string; uploadedByUrl?: string; 
}

interface RelatedPerson { initials: string; color: string; textColor: string; name: string; role: string; profileUrl?: string; }
interface Reference { id?: number; reference_id?: number; title: string; citation: string; url: string | null; }
interface RecentRevision { date: string; author: string; action: string; authorUrl?: string; }

interface ScholarDetail {
  id: number; versionId: number; status?: string; imageId?: number | null;
  createdById?: number | null;
  langCode: string;   // ✅ DYNAMIC: Language code (e.g., "en", "fr", "ar")
  langName: string;   // ✅ DYNAMIC: Display name from dbLanguages
  name: string;       // ✅ DYNAMIC: Single string for the current version
  subtitle: string;   // ✅ DYNAMIC: Single string for the current version
  createdBy: string; createdByUrl: string; createdDate: string;
  image: string; biography: string;
  atAGlance: { fullName: string; born: string; died: string; century: string; region: string; discipline: string; };
  contributors: { name: string; contributions: number; profileUrl?: string; }[]; 
  works: Work[]; media: MediaItem[];
  intellectualLineage: RelatedPerson[]; notableDisciples: RelatedPerson[];
  academicReferences: Reference[]; recentRevisions: RecentRevision[];
}

/* ------------------------------------------------------------------ */
/*  FILE UTILS & HELPERS                                               */
/* ------------------------------------------------------------------ */
function getFileIcon(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  if (["mp3", "wav", "ogg", "m4a"].includes(ext)) return "graphic_eq";
  if (["mp4", "webm", "avi", "mov"].includes(ext)) return "movie";
  if (["epub"].includes(ext)) return "menu_book";
  if (["doc", "docx"].includes(ext)) return "description";
  return "article";
}

function getAccessType(filename: string): Work["digitalAccess"] {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  if (["mp3", "wav", "ogg", "m4a"].includes(ext)) return "audio";
  if (["mp4", "webm", "avi", "mov"].includes(ext)) return "file";
  return "pdf";
}

function getMediaType(fileType: string | undefined): MediaItem["type"] {
  if (!fileType) return "pdf";
  const lowerType = fileType.toLowerCase();
  if (lowerType.includes("video") || ["mp4", "webm", "avi", "mov", "mkv"].some(ext => lowerType.includes(ext))) return "video";
  if (lowerType.includes("audio") || ["mp3", "wav", "ogg", "m4a", "flac"].some(ext => lowerType.includes(ext))) return "audio";
  return "pdf";
}

/* ------------------------------------------------------------------ */
/*  REUSABLE UI COMPONENTS                                             */
/* ------------------------------------------------------------------ */
const Icon: React.FC<{ name: string; size?: number; filled?: boolean }> = ({ name, size = 18, filled = false }) => (
  <span className="material-symbols-outlined" style={{ fontSize: size, lineHeight: 1, fontVariationSettings: `'FILL' ${filled ? 1 : 0}, 'wght' 400, 'GRAD' 0, 'opsz' 24` }}>
    {name}
  </span>
);

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const isApproved = status.toLowerCase().includes("approved");
  const isRejected = status.toLowerCase().includes("rejected");
  const isSuperseded = status.toLowerCase().includes("superseded");
  
  const bgClass = isApproved ? "bg-[#2f7d74]/10 text-[#2f7d74]" : isRejected ? "bg-[#e96d5c]/10 text-[#e96d5c]" : isSuperseded ? "bg-[#1e4d3a]/10 text-[#1e4d3a]" : "bg-[#C9A84C]/10 text-[#C9A84C]";
  const dotColor = isApproved ? "#2f7d74" : isRejected ? "#e96d5c" : isSuperseded ? "#1e4d3a" : "#C9A84C";

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-[#1e4d3a]/10 mono-label text-[10px] font-bold uppercase tracking-wide ${bgClass}`}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: dotColor }} />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

const Avatar: React.FC<{ name: string; size?: number }> = ({ name, size = 28 }) => {
  const initials = name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
  return (
    <div className="rounded-full bg-[#C9A84C]/10 border border-[#C9A84C]/20 flex items-center justify-center text-[#C9A84C] font-['Source_Serif_4'] font-bold flex-shrink-0" style={{ width: size, height: size, fontSize: size * 0.4 }}>
      {initials}
    </div>
  );
};

function WorkActions({ work }: { work: Work }) {
  const [isViewing, setIsViewing] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleView = async (e: React.MouseEvent) => {
    if (!work.accessUrl) return;
    e.preventDefault(); e.stopPropagation(); setIsViewing(true);
    try {
      const response = await fetch(work.accessUrl);
      const blob = await response.blob();
      const correctType = work.digitalAccess === 'audio' ? 'audio/mpeg' : work.digitalAccess === 'file' ? 'video/mp4' : 'application/pdf';
      const blobUrl = URL.createObjectURL(new Blob([blob], { type: correctType }));
      window.open(blobUrl, '_blank');
      setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
    } catch (error) {
      window.open(work.accessUrl, '_blank');
    } finally { setIsViewing(false); }
  };

  const handleDownload = async (e: React.MouseEvent) => {
    if (!work.accessUrl) return;
    e.preventDefault(); e.stopPropagation(); setIsDownloading(true);
    try {
      const response = await fetch(work.accessUrl);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = work.accessFileName || work.title || 'file.pdf';
      document.body.appendChild(link); link.click(); document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      window.open(work.accessUrl, '_blank');
    } finally { setIsDownloading(false); }
  };

  if (!work.accessUrl) return <span className="text-[13px] text-[#1e4d3a]/40">—</span>;

  return (
    <div className="flex gap-2 items-center">
      <button onClick={handleView} disabled={isViewing} title="View"
        className="w-8 h-8 flex items-center justify-center rounded-[6px] border border-[#1e4d3a]/20 text-[#1e4d3a] hover:bg-[#1e4d3a] hover:text-white transition-colors cursor-pointer disabled:opacity-50">
        {isViewing ? <Icon name="hourglass_empty" size={16} /> : <Icon name="visibility" size={18} />}
      </button>
      <button onClick={handleDownload} disabled={isDownloading} title="Download"
        className="w-8 h-8 flex items-center justify-center rounded-[6px] border border-[#1e4d3a]/20 text-[#1e4d3a] hover:bg-[#1e4d3a] hover:text-white transition-colors cursor-pointer disabled:opacity-50">
        {isDownloading ? <Icon name="hourglass_empty" size={16} /> : <Icon name="download" size={18} />}
      </button>
    </div>
  );
}

function MediaCard({ item, isRejected, onToggleReject, isRTL }: { item: MediaItem; isRejected: boolean; onToggleReject: () => void; isRTL: boolean }) {
  const [isViewing, setIsViewing] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleView = async (e: React.MouseEvent) => {
    if (!item.accessUrl) return;
    e.preventDefault(); e.stopPropagation(); setIsViewing(true);
    try {
      const response = await fetch(item.accessUrl);
      const blob = await response.blob();
      const correctType = item.type === 'audio' ? 'audio/mpeg' : item.type === 'video' ? 'video/mp4' : 'application/pdf';
      const blobUrl = URL.createObjectURL(new Blob([blob], { type: correctType }));
      window.open(blobUrl, '_blank');
      setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
    } catch (error) {
      window.open(item.accessUrl, '_blank');
    } finally { setIsViewing(false); }
  };

  const handleDownload = async (e: React.MouseEvent) => {
    if (!item.accessUrl) return;
    e.preventDefault(); e.stopPropagation(); setIsDownloading(true);
    try {
      const response = await fetch(item.accessUrl);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = item.accessFileName || item.title || 'file.pdf';
      document.body.appendChild(link); link.click(); document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      window.open(item.accessUrl, '_blank');
    } finally { setIsDownloading(false); }
  };

  return (
    <div className={`p-4 rounded-[10px] border flex flex-col gap-3 transition-all ${isRejected ? 'bg-[#e96d5c]/5 border-[#e96d5c]/30 opacity-70' : 'bg-[#fbf9f4] border-[#1e4d3a]/10 hover:shadow-md'}`}>
      <div className="flex justify-between items-start">
        <Icon name={item.type === "video" ? "movie" : item.type === "audio" ? "graphic_eq" : "article"} size={24} />
        <button onClick={onToggleReject} title={isRejected ? "Approve" : "Reject"}
          className={`px-3 py-1.5 rounded-[6px] border text-[10px] font-bold mono-label uppercase tracking-wide flex items-center gap-1.5 transition-colors cursor-pointer ${isRejected ? 'bg-[#e96d5c] border-[#e96d5c] text-white' : 'border-[#e96d5c] text-[#e96d5c] hover:bg-[#e96d5c] hover:text-white'}`}>
          <Icon name={isRejected ? "cancel" : "block"} size={14} /> 
          {isRejected ? (isRTL ? "مرفوض" : "Rejected") : (isRTL ? "رفض" : "Reject")}
        </button>
      </div>
      <p className="font-['Source_Serif_4'] text-[14px] font-semibold text-[#082f27] leading-tight">{item.title}</p>
      <p className="text-[12px] text-[#1e4d3a]/70 leading-relaxed">{item.description}</p>
      
      {item.accessUrl && (
        <div className="flex gap-2 mt-auto pt-2">
          <button onClick={handleView} disabled={isViewing}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-[6px] border border-[#1e4d3a]/20 text-[#1e4d3a] text-[10px] font-bold uppercase tracking-wide hover:bg-[#1e4d3a] hover:text-white transition-colors cursor-pointer disabled:opacity-50">
            {isViewing ? <Icon name="hourglass_empty" size={14} /> : <Icon name="visibility" size={14} />}
            {isViewing ? "..." : (isRTL ? "عرض" : "VIEW")}
          </button>
          <button onClick={handleDownload} disabled={isDownloading}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-[6px] border border-[#1e4d3a]/20 text-[#1e4d3a] text-[10px] font-bold uppercase tracking-wide hover:bg-[#1e4d3a] hover:text-white transition-colors cursor-pointer disabled:opacity-50">
            {isDownloading ? <Icon name="hourglass_empty" size={14} /> : <Icon name="download" size={14} />}
            {isDownloading ? "..." : (isRTL ? "تنزيل" : "DL")}
          </button>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */
export default function ScholarReview() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { lang, t, dbLanguages } = useLang(); // ✅ dbLanguages used for dynamic resolution
  const isRTL = lang === "AR" || lang === "ar";

  const [data, setData] = useState<ScholarDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  
  const [showApproveConfirm, setShowApproveConfirm] = useState(false);
  const [showRejectConfirm, setShowRejectConfirm] = useState(false);
  const [imgGray, setImgGray] = useState(true);
  const [approveReason, setApproveReason] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [showRestrictModal, setShowRestrictModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{ type: 'revoke' | 'ban' } | null>(null);

  const [rejectedItems, setRejectedItems] = useState<{ works: number[]; references: number[]; media: number[]; images: number[] }>({ works: [], references: [], media: [], images: [] });

  const toggleReject = (type: 'works' | 'references' | 'media' | 'images', itemId: number) => {
    setRejectedItems(prev => {
      const current = prev[type];
      return { ...prev, [type]: current.includes(itemId) ? current.filter(i => i !== itemId) : [...current, itemId] };
    });
  };

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true); setLoadError(null);
      try {
        const searchId = parseInt(id || "0");
        const createdResponse = await adminApi.scholars.getPendingCreated();
        let found = createdResponse.data.data?.find((v: any) => v.scholar_id === searchId || v.version_id === searchId);

        if (!found) {
          const editedResponse = await adminApi.scholars.getPendingEdited();
          const editedItem = editedResponse.data.data?.find((item: any) => item.proposed.scholar_id === searchId || item.proposed.version_id === searchId);
          if (editedItem) found = editedItem.proposed;
        }
        
        if (found) {
          const disciplines = (found.scholar_disciplines || []).map((d: any) => d.disciplines?.name).filter(Boolean).join(", ");
          const birthDate = (found.scholar_dates || []).find((d: any) => d.date_type === "birth");
          const deathDate = (found.scholar_dates || []).find((d: any) => d.date_type === "death");
          const bornStr = birthDate ? (birthDate.raw_text || (birthDate.year ? `${birthDate.year} ${birthDate.calendar}` : "")) : "";
          const diedStr = deathDate ? (deathDate.raw_text || (deathDate.year ? `${deathDate.year} ${deathDate.calendar}` : "")) : "";
          let centuryStr = "";
          if (found.century_gregorian_start || found.century_gregorian_end) centuryStr = `${found.century_gregorian_start || ""} - ${found.century_gregorian_end || ""} (Gregorian)`;
          else if (found.century_hijri_start || found.century_hijri_end) centuryStr = `${found.century_hijri_start || ""} - ${found.century_hijri_end || ""} (Hijri)`;

          const lineage = (found.scholar_relationships_as_source || []).filter((r: any) => r.relation_type === "teacher" || r.relation_type === "historical_influence").map((r: any, i: number) => ({
            initials: r.related_scholar_version?.canonical_name?.substring(0, 2).toUpperCase() || "?",
            color: i % 2 === 0 ? "#1e4d3a" : "#C9A84C", textColor: "#fff",
            name: r.related_scholar_version?.canonical_name || "Unknown",
            role: r.relation_type.replace("_", " ").toUpperCase(),
            profileUrl: `/scholars/${r.related_scholar_version?.scholar_id}`
          }));

          const disciples = (found.scholar_relationships_as_source || []).filter((r: any) => r.relation_type === "student" || r.relation_type === "disciple").map((r: any, i: number) => ({
            initials: r.related_scholar_version?.canonical_name?.substring(0, 2).toUpperCase() || "?",
            color: i % 2 === 0 ? "#C9A84C" : "#e96d5c", textColor: "#fff",
            name: r.related_scholar_version?.canonical_name || "Unknown",
            role: r.relation_type.replace("_", " ").toUpperCase(),
            profileUrl: `/scholars/${r.related_scholar_version?.scholar_id}`
          }));

          // ✅ DYNAMIC LANGUAGE RESOLUTION
          const langCode = found.languages?.code || "unknown";
          const langObj = dbLanguages.find((l: any) => l.code.toLowerCase() === langCode.toLowerCase());
          const langName = langObj ? langObj.name : langCode.toUpperCase();

          setData({
            id: found.scholar_id, versionId: found.version_id, status: found.status,
            createdById: found.users?.id || null, imageId: found.img_versions?.[0]?.img_version_id || null,
            langCode: langCode,       // ✅ DYNAMIC
            langName: langName,       // ✅ DYNAMIC
            name: found.canonical_name || "Unknown", // ✅ DYNAMIC (Single string for this version)
            subtitle: (found.scholar_aliases || []).map((a: any) => a.alias_name).join(", "), // ✅ DYNAMIC
            createdBy: found.users?.username || "Unknown", createdByUrl: "#", createdDate: new Date(found.created_at).toLocaleDateString(),
            image: found.image_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(found.canonical_name || "S")}&background=0b4335&color=fff&size=128`,
            biography: found.biography || "",
            atAGlance: { fullName: found.canonical_name || "", born: bornStr, died: diedStr, century: centuryStr, region: found.regions?.name || "", discipline: disciplines || "" },
            contributors: [],
            works: (found.scholar_works || []).map((w: any) => ({
              id: w.work_id || w.id, work_id: w.work_id, title: w.title || "Untitled", year: w.year || 0, format: w.format || "OTHER",
              digitalAccess: (w.media_url || w.file_path) ? getAccessType(w.file_name || w.media_url || "") : null,
              accessUrl: w.media_url || w.file_path || null, accessFileName: w.file_name || w.title || "file.pdf",
              accessSource: w.source_type || (w.media_url ? "link" : "upload"),
              uploadedBy: w.users?.username || found.users?.username, uploadedByUrl: w.users?.id ? `/profile/${w.users.id}` : undefined,
            })),
            media: (found.media || []).map((m: any): MediaItem => ({
              id: m.media_id || m.id, media_id: m.media_id, type: getMediaType(m.file_type),
              title: m.title || m.file_name || "Untitled Media", description: m.description || `${(m.file_type || "pdf").toUpperCase()} file`,
              viewCount: m.view_count || 0, likeCount: m.like_count || 0, action: m.source_type === "upload" ? "DOWNLOAD FILE" : "OPEN LINK",
              actionIcon: m.source_type === "upload" ? "download" : "open_in_new", accessUrl: m.media_url || m.file_path || null,
              accessSource: m.source_type || (m.media_url ? "link" : "upload"), accessFileName: m.file_name || m.title || "file.pdf",
              uploadedBy: m.users?.username || found.users?.username, uploadedByUrl: m.users?.id ? `/profile/${m.users.id}` : undefined,
            })),
            academicReferences: (found.scholar_references || []).map((r: any) => ({ id: r.reference_id || r.id, reference_id: r.reference_id, title: r.title || "Untitled Reference", citation: r.citation || "", url: r.url || null })),
            intellectualLineage: lineage, notableDisciples: disciples, recentRevisions: []
          });
        } else {
          setLoadError(t("admin.scholarReview.error.notFound") || "This scholar submission could not be found.");
        }
      } catch (error) {
        console.error("Failed to fetch scholar:", error);
        setLoadError(t("admin.scholarReview.error.failed") || "Failed to load this scholar submission.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [id, t, dbLanguages]); // ✅ Added dbLanguages to dependency array

  const handleApprove = async () => {
    try {
      await adminApi.scholars.approve(data!.versionId, {
        reason: approveReason || "Approved",
        reject_works: rejectedItems.works, reject_references: rejectedItems.references,
        reject_media: rejectedItems.media, reject_images: rejectedItems.images,
      });
      navigate("/admin/pending/scholars");
    } catch (error) {
      console.error("Approval failed", error);
      alert("Failed to approve scholar. Please try again.");
    }
    setShowApproveConfirm(false);
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) { alert("Please provide a rejection reason"); return; }
    try {
      await adminApi.scholars.reject(data!.versionId, rejectReason);
      navigate("/admin/pending/scholars");
    } catch (error) {
      console.error("Rejection failed", error);
      alert("Failed to reject scholar. Please try again.");
    }
    setShowRejectConfirm(false);
  };

  const executeRestrictionAndReject = async () => {
    if (!confirmAction || !data) return;
    try {
      const userId = data.createdById;
      if (!userId) { alert("Cannot restrict system-generated submissions."); setConfirmAction(null); setShowRestrictModal(false); return; }
      if (confirmAction.type === 'revoke') await adminApi.users.toggleContribute(userId);
      else await adminApi.users.ban(userId);
      await adminApi.scholars.reject(data.versionId, confirmAction.type === 'ban' ? "Contributor banned" : "Contribution access revoked");
      navigate("/admin/pending/scholars");
      setConfirmAction(null); setShowRestrictModal(false);
    } catch (err) {
      console.error("Action failed:", err);
      alert("Failed to process action. Please try again.");
    }
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-[#fbf9f4]"><span className="material-symbols-outlined text-[40px] text-[#1e4d3a]/40 animate-pulse">hourglass_empty</span></div>;
  if (loadError || !data) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-[#fbf9f4] text-[#1e4d3a] p-6 text-center">
      <span className="material-symbols-outlined text-[40px] text-[#e96d5c]">error</span>
      <p className="font-['Inter'] text-[15px] max-w-[400px]">{loadError}</p>
      <button onClick={() => navigate("/admin/pending/scholars")} className="flex items-center gap-2 px-5 py-2.5 rounded-[8px] bg-[#1e4d3a] text-white font-['Inter'] text-[13px] font-semibold hover:bg-[#1e4d3a]/90 transition-colors cursor-pointer">
        <span className="material-symbols-outlined text-[16px]">{isRTL ? "arrow_forward" : "arrow_back"}</span> {isRTL ? "العودة إلى قائمة العلماء" : "Back to Pending Scholars"}
      </button>
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
        <button onClick={() => navigate("/admin/pending/scholars")} className="flex items-center gap-2 px-4 py-2 rounded-[8px] border border-[#1e4d3a]/20 text-[#1e4d3a] text-[12px] font-semibold hover:bg-[#1e4d3a]/5 transition-colors mb-6 cursor-pointer">
          <span className="material-symbols-outlined text-[16px]">{isRTL ? "arrow_forward" : "arrow_back"}</span> {isRTL ? "العودة إلى قائمة العلماء" : "Back to Pending Scholars"}
        </button>

        <section className="dashboard-card p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <h1 className="serif-title text-[28px] font-semibold text-[#082f27]">{data.name}</h1>
                <StatusBadge status={data.status || "Pending Review"} />
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#1e4d3a]/5 border border-[#1e4d3a]/10 mono-label text-[10px] font-bold text-[#1e4d3a]/70 uppercase tracking-wide">
                  {data.langName} {isRTL ? "نسخة" : "Version"}
                </span>
              </div>
              {data.subtitle && <p className="font-['Inter'] text-[14px] text-[#1e4d3a]/70 italic mb-3">{data.subtitle}</p>}
              <div className="flex flex-wrap gap-4">
                <span className="flex items-center gap-1.5 mono-label text-[11px] text-[#1e4d3a]/60">
                  <span className="material-symbols-outlined text-[14px]">location_on</span> {data.atAGlance.region || "No region"}
                </span>
                <span className="flex items-center gap-1.5 mono-label text-[11px] text-[#1e4d3a]/60">
                  <span className="material-symbols-outlined text-[14px]">event</span> {isRTL ? "أرسلت" : "Submitted"}: {data.createdDate} {isRTL ? "بواسطة" : "by"} {data.createdBy}
                </span>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <button onClick={() => setShowRejectConfirm(true)} className="flex items-center gap-2 px-5 py-2.5 rounded-[8px] border border-[#e96d5c] text-[#e96d5c] text-[12px] font-bold uppercase tracking-wide hover:bg-[#e96d5c] hover:text-white transition-colors cursor-pointer">
                <span className="material-symbols-outlined text-[16px]">close</span> {isRTL ? "رفض" : "Reject"}
              </button>
              <button onClick={() => setShowRestrictModal(true)} className="flex items-center gap-2 px-5 py-2.5 rounded-[8px] border border-[#C9A84C] text-[#C9A84C] text-[12px] font-bold uppercase tracking-wide hover:bg-[#C9A84C] hover:text-white transition-colors cursor-pointer">
                <span className="material-symbols-outlined text-[16px]">shield_person</span> {isRTL ? "تقييد المستخدم" : "Restrict User"}
              </button>
              <button onClick={() => setShowApproveConfirm(true)} className="flex items-center gap-2 px-5 py-2.5 rounded-[8px] bg-[#1e4d3a] border border-[#1e4d3a] text-white text-[12px] font-bold uppercase tracking-wide hover:bg-[#1e4d3a]/90 transition-colors cursor-pointer">
                <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1, 'wght' 400" }}>check</span> {isRTL ? "موافقة" : "Approve"}
              </button>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6 items-start">
          {/* LEFT COLUMN */}
          <div className="space-y-6">
            <div className="dashboard-card overflow-hidden sticky top-6">
              <div className="relative aspect-square bg-[#1e4d3a]/5 group">
                {data.image ? (
                  <>
                    <img alt="Scholar portrait" src={data.image} className="w-full h-full object-cover transition-all duration-500" style={{ filter: imgGray ? "grayscale(100%)" : "grayscale(0%)" }} onMouseEnter={() => setImgGray(false)} onMouseLeave={() => setImgGray(true)} />
                    <button onClick={() => toggleReject('images', data.imageId ?? 0)} title={rejectedItems.images.includes(data.imageId ?? 0) ? "Approve" : "Reject"}
                      className={`absolute bottom-3 ${isRTL ? 'left-3' : 'right-3'} px-3 py-2 rounded-[8px] border-2 shadow-md mono-label text-[10px] font-bold uppercase tracking-wide flex items-center gap-1.5 transition-all cursor-pointer ${rejectedItems.images.includes(data.imageId ?? 0) ? 'bg-[#e96d5c] border-[#e96d5c] text-white' : 'bg-white/95 border-[#1e4d3a]/10 text-[#e96d5c] hover:bg-[#e96d5c] hover:text-white hover:border-[#e96d5c]'}`}>
                      <span className="material-symbols-outlined text-[16px]">{rejectedItems.images.includes(data.imageId ?? 0) ? "cancel" : "block"}</span>
                      {rejectedItems.images.includes(data.imageId ?? 0) ? (isRTL ? "مرفوض" : "Rejected") : (isRTL ? "رفض" : "Reject")}
                    </button>
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[#1e4d3a]/30">
                    <span className="material-symbols-outlined text-[80px]">account_circle</span>
                  </div>
                )}
              </div>
              <div className="p-5">
                <p className="mono-label text-[9px] uppercase font-bold text-[#1e4d3a]/60 mb-3 pb-2 border-b border-[#1e4d3a]/10">{t("admin.scholarReview.atAGlance") || "AT A GLANCE"}</p>
                <table className="w-full border-collapse">
                  <tbody>
                    {[
                      { label: t("admin.scholarReview.fullName") || "Full Name", value: data.atAGlance.fullName },
                      { label: t("admin.scholarReview.born") || "Born", value: data.atAGlance.born },
                      { label: t("admin.scholarReview.died") || "Died", value: data.atAGlance.died },
                      { label: t("admin.scholarReview.century") || "Century", value: data.atAGlance.century },
                      { label: t("admin.scholarReview.region") || "Region", value: data.atAGlance.region },
                      { label: t("admin.scholarReview.discipline") || "Discipline", value: data.atAGlance.discipline },
                    ].map((row, i) => (
                      <tr key={i} className="border-b border-[#1e4d3a]/5 last:border-0">
                        <td className="py-2 mono-label text-[10px] text-[#1e4d3a]/60 align-top">{row.label}</td>
                        <td className={`py-2 text-[12px] font-semibold text-[#082f27] align-top ${isRTL ? 'pr-3 text-left' : 'pl-3 text-right'}`}>{row.value || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="space-y-6">
            <section className="dashboard-card p-6">
              <h2 className="serif-title text-[18px] font-semibold text-[#082f27] mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px]">person</span> {t("admin.scholarReview.biography") || "Biography"}
              </h2>
              <BiographyRenderer content={data.biography} lang={data.langCode.toLowerCase()} />
            </section>

            <section className="dashboard-card p-6 overflow-hidden">
              <h2 className="serif-title text-[18px] font-semibold text-[#082f27] mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px]">library_books</span> {t("admin.scholarReview.works") || "Works & Bibliography"}
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#1e4d3a]/10 bg-[#1e4d3a]/[0.02]">
                      <th className="mono-label text-[9px] uppercase font-bold text-[#1e4d3a]/60 px-4 py-3">{t("admin.scholarReview.title") || "Title"}</th>
                      <th className="mono-label text-[9px] uppercase font-bold text-[#1e4d3a]/60 px-4 py-3">{t("admin.scholarReview.year") || "Year"}</th>
                      <th className="mono-label text-[9px] uppercase font-bold text-[#1e4d3a]/60 px-4 py-3">{t("admin.scholarReview.format") || "Format"}</th>
                      <th className="mono-label text-[9px] uppercase font-bold text-[#1e4d3a]/60 px-4 py-3">{t("admin.scholarReview.access") || "Access"}</th>
                      <th className="mono-label text-[9px] uppercase font-bold text-[#1e4d3a]/60 px-4 py-3 text-center">{t("admin.scholarReview.status") || "Status"}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1e4d3a]/[0.06]">
                    {data.works.map((w, i) => {
                      const itemId = w.id || w.work_id || i;
                      const isRejected = rejectedItems.works.includes(itemId);
                      return (
                        <tr key={i} className={`transition-colors ${isRejected ? 'bg-[#e96d5c]/5' : 'hover:bg-[#1e4d3a]/[0.015]'}`}>
                          <td className="px-4 py-3">
                            <p className="text-[13px] font-semibold text-[#082f27]">{w.title || "Untitled"}</p>
                            {w.uploadedBy && <p className="mono-label text-[10px] text-[#1e4d3a]/50 mt-1">{isRTL ? "بواسطة" : "by"} {w.uploadedBy}</p>}
                          </td>
                          <td className="px-4 py-3 mono-label text-[12px] text-[#1e4d3a]/70">{w.year || "-"}</td>
                          <td className="px-4 py-3"><span className="inline-block px-2 py-0.5 rounded-[4px] bg-[#1e4d3a]/5 border border-[#1e4d3a]/10 mono-label text-[10px] text-[#1e4d3a]/70">{w.format || "UNKNOWN"}</span></td>
                          <td className="px-4 py-3"><WorkActions work={w} /></td>
                          <td className="px-4 py-3 text-center">
                            <button onClick={() => toggleReject('works', itemId)} title={isRejected ? "Approve" : "Reject"}
                              className={`px-3 py-1.5 rounded-[6px] border text-[10px] font-bold mono-label uppercase tracking-wide flex items-center gap-1.5 mx-auto transition-colors cursor-pointer ${isRejected ? 'bg-[#e96d5c] border-[#e96d5c] text-white' : 'border-[#e96d5c] text-[#e96d5c] hover:bg-[#e96d5c] hover:text-white'}`}>
                              <span className="material-symbols-outlined text-[14px]">{isRejected ? "cancel" : "block"}</span> 
                              {isRejected ? (isRTL ? "مرفوض" : "Rejected") : (isRTL ? "رفض" : "Reject")}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="dashboard-card p-6">
              <h2 className="serif-title text-[18px] font-semibold text-[#082f27] mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px]">media_link</span> {t("admin.scholarReview.media") || "Integrated Media"}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.media.map((m, i) => {
                  const itemId = m.id || m.media_id || i;
                  return <MediaCard key={i} item={m} isRejected={rejectedItems.media.includes(itemId)} onToggleReject={() => toggleReject('media', itemId)} isRTL={isRTL} />;
                })}
              </div>
            </section>

            <section className="dashboard-card p-6">
              <h2 className="serif-title text-[18px] font-semibold text-[#082f27] mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px]">account_tree</span> {t("admin.scholarReview.relationships") || "Relationships"}
              </h2>
              <div className="space-y-6">
                <div>
                  <p className="mono-label text-[9px] uppercase font-bold text-[#1e4d3a]/60 mb-3">{t("admin.scholarReview.intellectualLineage") || "INTELLECTUAL LINEAGE"}</p>
                  <div className="space-y-2">
                    {data.intellectualLineage.map((p, i) => (
                      <a key={i} href={p.profileUrl} className="flex items-center gap-3 p-3 rounded-[8px] hover:bg-[#1e4d3a]/[0.03] transition-colors no-underline">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center font-['Source_Serif_4'] font-bold text-[12px] text-white flex-shrink-0" style={{ backgroundColor: p.color }}>{p.initials}</div>
                        <div><p className="text-[13px] font-semibold text-[#082f27]">{p.name}</p><p className="mono-label text-[10px] text-[#1e4d3a]/60">{p.role}</p></div>
                      </a>
                    ))}
                  </div>
                </div>
                <div className="border-t border-[#1e4d3a]/10 pt-6">
                  <p className="mono-label text-[9px] uppercase font-bold text-[#1e4d3a]/60 mb-3">{t("admin.scholarReview.notableDisciples") || "NOTABLE DISCIPLES"}</p>
                  <div className="space-y-2">
                    {data.notableDisciples.map((p, i) => (
                      <a key={i} href={p.profileUrl} className="flex items-center gap-3 p-3 rounded-[8px] hover:bg-[#1e4d3a]/[0.03] transition-colors no-underline">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center font-['Source_Serif_4'] font-bold text-[12px] text-white flex-shrink-0" style={{ backgroundColor: p.color }}>{p.initials}</div>
                        <div><p className="text-[13px] font-semibold text-[#082f27]">{p.name}</p><p className="mono-label text-[10px] text-[#1e4d3a]/60">{p.role}</p></div>
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            <section className="dashboard-card p-6">
              <h2 className="serif-title text-[18px] font-semibold text-[#082f27] mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px]">menu_book</span> {t("admin.scholarReview.references") || "References"}
              </h2>
              <div className="space-y-3">
                {data.academicReferences.map((r, i) => {
                  const itemId = r.id || r.reference_id || i;
                  const isRejected = rejectedItems.references.includes(itemId);
                  return (
                    <div key={i} className={`p-4 rounded-[8px] border flex justify-between items-start gap-4 transition-all ${isRejected ? 'bg-[#e96d5c]/5 border-[#e96d5c]/30 opacity-70' : 'bg-[#fbf9f4] border-[#1e4d3a]/10'}`}>
                      <div className="flex-1 min-w-0">
                        <p className="font-['Source_Serif_4'] text-[14px] font-semibold text-[#082f27] mb-1">{r.title || "Untitled Reference"}</p>
                        <p className="text-[12px] text-[#1e4d3a]/70 leading-relaxed mb-2">{r.citation || ""}</p>
                        {r.url && (
                          <a href={r.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 mono-label text-[10px] text-[#1e4d3a] hover:text-[#C9A84C] transition-colors underline decoration-dotted underline-offset-2">
                            <span className="material-symbols-outlined text-[12px]">link</span> {t("admin.scholarReview.viewSource") || "View Source"}
                          </a>
                        )}
                      </div>
                      <button onClick={() => toggleReject('references', itemId)} title={isRejected ? "Approve" : "Reject"}
                        className={`px-3 py-1.5 rounded-[6px] border text-[10px] font-bold mono-label uppercase tracking-wide flex items-center gap-1.5 flex-shrink-0 transition-colors cursor-pointer ${isRejected ? 'bg-[#e96d5c] border-[#e96d5c] text-white' : 'border-[#e96d5c] text-[#e96d5c] hover:bg-[#e96d5c] hover:text-white'}`}>
                        <span className="material-symbols-outlined text-[14px]">{isRejected ? "cancel" : "block"}</span> 
                        {isRejected ? (isRTL ? "مرفوض" : "Rejected") : (isRTL ? "رفض" : "Reject")}
                      </button>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        </div>

        {/* ── Modals (Restrict, Confirm, Approve, Reject) ── */}
        {/* (Keep the exact same modal code from the previous response, but replace `data.name[currentLang]` with `data.name` and `getLangName(currentLang)` with `data.langName`) */}
        
        {showRestrictModal && !confirmAction && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#082f27]/40 backdrop-blur-sm" onClick={() => setShowRestrictModal(false)}>
            <div className="dashboard-card w-full max-w-lg p-6 relative" onClick={(e) => e.stopPropagation()}>
              <button onClick={() => setShowRestrictModal(false)} className={`absolute top-4 ${isRTL ? 'left-4' : 'right-4'} p-1.5 rounded-full hover:bg-[#1e4d3a]/10 transition-colors cursor-pointer`}>
                <span className="material-symbols-outlined text-[20px] text-[#1e4d3a]">close</span>
              </button>
              <div className="flex items-center gap-4 mb-6">
                <Avatar name={data.createdBy} size={56} />
                <div>
                  <h3 className="serif-title text-[20px] font-semibold text-[#082f27]">{t("admin.scholarReview.modal.restrict.title") || "Restrict User"}</h3>
                  <p className="text-[12px] text-[#1e4d3a]/60 mt-1">{data.createdBy} {isRTL ? "أرسل" : "submitted"} "{data.name}"</p>
                </div>
              </div>
              <p className="text-[13px] text-[#1e4d3a]/80 leading-relaxed mb-6">
                {t("admin.scholarReview.modal.restrict.desc") || "Choose an action. This will automatically reject this scholar submission as well."}
              </p>
              <div className="space-y-3 mb-6">
                <button onClick={() => setConfirmAction({ type: 'revoke' })} className="w-full flex items-start gap-4 p-4 rounded-[8px] border border-[#C9A84C]/30 bg-[#C9A84C]/[0.05] hover:bg-[#C9A84C]/10 transition-colors cursor-pointer text-left">
                  <div className="w-8 h-8 rounded-full bg-[#C9A84C] text-white flex items-center justify-center flex-shrink-0 mt-0.5"><span className="material-symbols-outlined text-[18px]">person_off</span></div>
                  <div>
                    <p className="text-[13px] font-semibold text-[#082f27] mb-1">{t("admin.scholarReview.modal.restrict.revoke") || "Revoke Contribution Access"}</p>
                    <p className="text-[11px] text-[#1e4d3a]/60 leading-relaxed">{t("admin.scholarReview.modal.restrict.revokeDesc") || "They can still log in, but cannot submit new content. (Recommended for low-quality submissions)"}</p>
                  </div>
                </button>
                <button onClick={() => setConfirmAction({ type: 'ban' })} className="w-full flex items-start gap-4 p-4 rounded-[8px] border border-[#e96d5c]/30 bg-[#e96d5c]/[0.05] hover:bg-[#e96d5c]/10 transition-colors cursor-pointer text-left">
                  <div className="w-8 h-8 rounded-full bg-[#e96d5c] text-white flex items-center justify-center flex-shrink-0 mt-0.5"><span className="material-symbols-outlined text-[18px]">block</span></div>
                  <div>
                    <p className="text-[13px] font-semibold text-[#082f27] mb-1">{t("admin.scholarReview.modal.restrict.ban") || "Ban Account Completely"}</p>
                    <p className="text-[11px] text-[#1e4d3a]/60 leading-relaxed">{t("admin.scholarReview.modal.restrict.banDesc") || "They will be completely locked out of the platform. (Use for spam, abuse, or severe violations)"}</p>
                  </div>
                </button>
              </div>
              <div className="flex justify-end">
                <button onClick={() => setShowRestrictModal(false)} className="px-5 py-2 rounded-[6px] border border-[#1e4d3a]/20 text-[#1e4d3a] text-[12px] font-bold uppercase tracking-wide hover:bg-[#1e4d3a]/5 transition-colors cursor-pointer">
                  {t("admin.common.cancel") || "Cancel"}
                </button>
              </div>
            </div>
          </div>
        )}

        {confirmAction && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#082f27]/40 backdrop-blur-sm" onClick={() => setConfirmAction(null)}>
            <div className="dashboard-card w-full max-w-md p-6 relative" onClick={(e) => e.stopPropagation()}>
              <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-5 ${confirmAction.type === 'ban' ? 'bg-[#e96d5c] text-white' : 'bg-[#C9A84C] text-white'}`}>
                <span className="material-symbols-outlined text-[28px]" style={{ fontVariationSettings: "'FILL' 1, 'wght' 400" }}>{confirmAction.type === 'ban' ? "block" : "person_off"}</span>
              </div>
              <h3 className="serif-title text-[20px] font-semibold text-[#082f27] mb-3">{t("admin.scholarReview.modal.confirm.title") || "Confirm Action"}</h3>
              <p className="text-[13px] text-[#1e4d3a]/80 leading-relaxed mb-6">
                {t("admin.scholarReview.modal.confirm.desc") || "This will"} <strong>{confirmAction.type === 'ban' ? (t("admin.scholarReview.modal.confirm.ban") || "BAN") : (t("admin.scholarReview.modal.confirm.revoke") || "REVOKE CONTRIBUTION ACCESS FOR")}</strong> {data.createdBy} {t("admin.scholarReview.modal.confirm.andReject") || "and automatically REJECT the scholar"} "{data.name}".
                <br/><br/><strong className="text-[#e96d5c]">{t("admin.scholarReview.modal.confirm.warning") || "This action cannot be undone from this screen."}</strong>
              </p>
              <div className="flex gap-3 justify-end">
                <button onClick={() => setConfirmAction(null)} className="px-5 py-2 rounded-[6px] border border-[#1e4d3a]/20 text-[#1e4d3a] text-[12px] font-bold uppercase tracking-wide hover:bg-[#1e4d3a]/5 transition-colors cursor-pointer">
                  {t("admin.common.goBack") || "Go Back"}
                </button>
                <button onClick={executeRestrictionAndReject} className={`px-5 py-2 rounded-[6px] text-white text-[12px] font-bold uppercase tracking-wide transition-colors cursor-pointer ${confirmAction.type === 'ban' ? 'bg-[#e96d5c] hover:bg-[#e96d5c]/90' : 'bg-[#C9A84C] hover:bg-[#C9A84C]/90'}`}>
                  {t("admin.scholarReview.modal.confirm.button") || "Confirm & Reject"}
                </button>
              </div>
            </div>
          </div>
        )}

        {showApproveConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#082f27]/40 backdrop-blur-sm" onClick={() => setShowApproveConfirm(false)}>
            <div className="dashboard-card w-full max-w-lg p-6 relative" onClick={(e) => e.stopPropagation()}>
              <button onClick={() => setShowApproveConfirm(false)} className={`absolute top-4 ${isRTL ? 'left-4' : 'right-4'} p-1.5 rounded-full hover:bg-[#1e4d3a]/10 transition-colors cursor-pointer`}>
                <span className="material-symbols-outlined text-[20px] text-[#1e4d3a]">close</span>
              </button>
              <div className="w-14 h-14 rounded-full bg-[#1e4d3a] text-white flex items-center justify-center mb-5">
                <span className="material-symbols-outlined text-[28px]" style={{ fontVariationSettings: "'FILL' 1, 'wght' 400" }}>check_circle</span>
              </div>
              <h3 className="serif-title text-[20px] font-semibold text-[#082f27] mb-4">{t("admin.scholarReview.modal.approve.title") || "Approve Scholar?"}</h3>
              <div className="bg-[#1e4d3a]/[0.03] p-4 rounded-[8px] mb-5 space-y-2">
                <p className="text-[14px] font-semibold text-[#082f27]">{data.name}</p>
                <p className="text-[12px] text-[#1e4d3a]/70"><strong>{t("admin.common.language") || "Language"}:</strong> {data.langName}</p>
                <p className="text-[12px] text-[#1e4d3a]/70"><strong>{isRTL ? "أرسلت بواسطة:" : "Submitted by:"}</strong> {data.createdBy}</p>
                <p className="text-[12px] text-[#1e4d3a]/70"><strong>{isRTL ? "التاريخ:" : "Date:"}</strong> {data.createdDate}</p>
                <p className="text-[12px] text-[#1e4d3a]/70"><strong>{isRTL ? "التخصص:" : "Discipline:"}</strong> {data.atAGlance.discipline}</p>
              </div>
              <div className="mb-6">
                <label className="mono-label text-[9px] uppercase font-bold text-[#1e4d3a]/60 mb-1.5 block">{t("admin.scholarReview.modal.approve.notes") || "APPROVAL NOTES (Optional)"}</label>
                <textarea value={approveReason} onChange={(e) => setApproveReason(e.target.value)} placeholder={t("admin.scholarReview.modal.approve.notesPlaceholder") || "Add any notes about this approval..."} className="w-full bg-[#fbf9f4] border border-[#1e4d3a]/15 rounded-[6px] px-3 py-2 text-[12px] font-medium text-[#1e4d3a] focus:outline-none focus:ring-2 focus:ring-[#1e4d3a]/20 min-h-[80px] resize-y" />
              </div>
              <p className="text-[13px] text-[#1e4d3a]/80 leading-relaxed mb-6">
                {isRTL ? "سيتم نشر ملف العالم على البوابة. لا يمكن التراجع عن هذا الإجراء." : "This will publish the scholar to the portal. This action cannot be undone."}
                {Object.values(rejectedItems).flat().length > 0 && (
                  <span className="block mt-3 text-[#e96d5c] font-semibold text-[12px]">
                    {isRTL ? `ملاحظة: سيتم رفض ${Object.values(rejectedItems).flat().length} عنصر محدد.` : `Note: ${Object.values(rejectedItems).flat().length} specific item(s) will be rejected.`}
                  </span>
                )}
              </p>
              <div className="flex gap-3 justify-end">
                <button onClick={() => { setShowApproveConfirm(false); setApproveReason(""); }} className="px-5 py-2 rounded-[6px] border border-[#1e4d3a]/20 text-[#1e4d3a] text-[12px] font-bold uppercase tracking-wide hover:bg-[#1e4d3a]/5 transition-colors cursor-pointer">
                  {t("admin.common.cancel") || "Cancel"}
                </button>
                <button onClick={handleApprove} className="px-5 py-2 rounded-[6px] bg-[#1e4d3a] text-white text-[12px] font-bold uppercase tracking-wide hover:bg-[#1e4d3a]/90 transition-colors cursor-pointer">
                  {t("admin.scholarReview.modal.approve.confirm") || "Confirm Approval"}
                </button>
              </div>
            </div>
          </div>
        )}

        {showRejectConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#082f27]/40 backdrop-blur-sm" onClick={() => { setShowRejectConfirm(false); setRejectReason(""); }}>
            <div className="dashboard-card w-full max-w-lg p-6 relative" onClick={(e) => e.stopPropagation()}>
              <button onClick={() => { setShowRejectConfirm(false); setRejectReason(""); }} className={`absolute top-4 ${isRTL ? 'left-4' : 'right-4'} p-1.5 rounded-full hover:bg-[#1e4d3a]/10 transition-colors cursor-pointer`}>
                <span className="material-symbols-outlined text-[20px] text-[#1e4d3a]">close</span>
              </button>
              <div className="w-14 h-14 rounded-full bg-[#e96d5c] text-white flex items-center justify-center mb-5">
                <span className="material-symbols-outlined text-[28px]" style={{ fontVariationSettings: "'FILL' 1, 'wght' 400" }}>cancel</span>
              </div>
              <h3 className="serif-title text-[20px] font-semibold text-[#082f27] mb-4">{t("admin.scholarReview.modal.reject.title") || "Reject Scholar?"}</h3>
              <div className="bg-[#1e4d3a]/[0.03] p-4 rounded-[8px] mb-5 space-y-2">
                <p className="text-[14px] font-semibold text-[#082f27]">{data.name}</p>
                <p className="text-[12px] text-[#1e4d3a]/70"><strong>{t("admin.common.language") || "Language"}:</strong> {data.langName}</p>
                <p className="text-[12px] text-[#1e4d3a]/70"><strong>{isRTL ? "أرسلت بواسطة:" : "Submitted by:"}</strong> {data.createdBy}</p>
                <p className="text-[12px] text-[#1e4d3a]/70"><strong>{isRTL ? "التاريخ:" : "Date:"}</strong> {data.createdDate}</p>
                <p className="text-[12px] text-[#1e4d3a]/70"><strong>{isRTL ? "التخصص:" : "Discipline:"}</strong> {data.atAGlance.discipline}</p>
              </div>
              <div className="mb-6">
                <label className="mono-label text-[9px] uppercase font-bold text-[#1e4d3a]/60 mb-1.5 block">{t("admin.scholarReview.modal.reject.reason") || "REJECTION REASON *"}</label>
                <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder={t("admin.scholarReview.modal.reject.reasonPlaceholder") || "Please explain why this submission is being rejected..."} className="w-full bg-[#fbf9f4] border border-[#1e4d3a]/15 rounded-[6px] px-3 py-2 text-[12px] font-medium text-[#1e4d3a] focus:outline-none focus:ring-2 focus:ring-[#1e4d3a]/20 min-h-[80px] resize-y" />
              </div>
              <div className="flex gap-3 justify-end">
                <button onClick={() => { setShowRejectConfirm(false); setRejectReason(""); }} className="px-5 py-2 rounded-[6px] border border-[#1e4d3a]/20 text-[#1e4d3a] text-[12px] font-bold uppercase tracking-wide hover:bg-[#1e4d3a]/5 transition-colors cursor-pointer">
                  {t("admin.common.cancel") || "Cancel"}
                </button>
                <button onClick={handleReject} className="px-5 py-2 rounded-[6px] bg-[#e96d5c] text-white text-[12px] font-bold uppercase tracking-wide hover:bg-[#e96d5c]/90 transition-colors cursor-pointer">
                  {t("admin.scholarReview.modal.reject.confirm") || "Confirm Rejection"}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}