import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useLang } from "../../context/LanguageContext";

// ⚠️ IMPORTANT: Ensure this path matches your actual adminApi file location!
import { adminApi } from "../../api/adminApi"; 

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

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const map: Record<string, { bg: string; color: string; dot: string }> = {
    pending: { bg: colors.creamMid, color: colors.amber, dot: colors.amber },
    "Pending Review": { bg: colors.creamMid, color: colors.amber, dot: colors.amber },
    approved: { bg: colors.forestGreen, color: colors.creamLight, dot: colors.creamLight },
    Approved: { bg: colors.forestGreen, color: colors.creamLight, dot: colors.creamLight },
    rejected: { bg: colors.red, color: colors.creamLight, dot: colors.creamLight },
    Rejected: { bg: colors.red, color: colors.creamLight, dot: colors.creamLight },
    superseded: { bg: colors.creamDark, color: colors.forestGreen, dot: colors.forestGreen },
  };
  const s = map[status] || map["Pending Review"];
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 10px", borderRadius: 9999, backgroundColor: s.bg, color: s.color, fontFamily: fonts.label, fontSize: 11, fontWeight: 600, letterSpacing: "0.03em", border: `1px solid ${colors.forestGreen}` }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: s.dot }} />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

const Avatar: React.FC<{ name: string; size?: number }> = ({ name, size = 28 }) => {
  const initials = name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        backgroundColor: colors.creamMid,
        color: colors.forestGreen,
        border: `1px solid ${colors.forestGreen}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: fonts.headline,
        fontWeight: 700,
        fontSize: size * 0.4,
        flexShrink: 0,
      }}
    >
      {initials}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
type Language = "EN" | "AR" | "FR";

interface Work { 
  id?: number; 
  work_id?: number; 
  title: string; 
  year: number; 
  format: string; 
  digitalAccess?: "pdf" | "audio" | "file" | null; 
  accessUrl?: string; 
  accessFileName?: string; 
  accessSource?: "upload" | "link"; 
  uploadedBy?: string; 
  uploadedByUrl?: string; 
}

interface MediaItem { 
  id?: number; 
  media_id?: number; 
  type: "pdf" | "audio" | "video"; 
  title: string; 
  description: string; 
  viewCount: number; 
  likeCount: number; 
  action: string; 
  actionIcon: string; 
  accessUrl?: string; 
  accessSource?: "upload" | "link"; 
  accessFileName?: string; 
  uploadedBy?: string; 
  uploadedByUrl?: string; 
}

interface RelatedPerson { initials: string; color: string; textColor: string; name: string; role: string; profileUrl?: string; }
interface Reference { id?: number; reference_id?: number; title: string; citation: string; url: string | null; }
interface RecentRevision { date: string; author: string; action: string; authorUrl?: string; }

interface ScholarDetail {
  id: number; versionId: number; status?: string; imageId?: number | null;
  createdById?: number | null; // ✅ ADDED: To support Ban/Restrict
  name: Record<Language, string>; subtitle: Record<Language, string>;
  createdBy: string; createdByUrl: string; createdDate: string;
  image: string;
  overviewText: Record<Language, string>;
  body: Record<Language, string[]>;
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
  if (lowerType.includes("video") || ["mp4", "webm", "avi", "mov", "mkv"].some(ext => lowerType.includes(ext))) {
    return "video";
  }
  if (lowerType.includes("audio") || ["mp3", "wav", "ogg", "m4a", "flac"].some(ext => lowerType.includes(ext))) {
    return "audio";
  }
  return "pdf";
}

/* ------------------------------------------------------------------ */
/*  WORK ACTIONS COMPONENT (View & Download)                           */
/* ------------------------------------------------------------------ */
function WorkActions({ work }: { work: Work }) {
  const [isViewing, setIsViewing] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleView = async (e: React.MouseEvent) => {
    if (!work.accessUrl) return;
    e.preventDefault();
    e.stopPropagation();
    setIsViewing(true);
    try {
      const response = await fetch(work.accessUrl);
      const blob = await response.blob();
      const correctType = work.digitalAccess === 'audio' ? 'audio/mpeg' : 
                          work.digitalAccess === 'file' ? 'video/mp4' : 
                          'application/pdf';
      const typedBlob = new Blob([blob], { type: correctType });
      const blobUrl = URL.createObjectURL(typedBlob);
      window.open(blobUrl, '_blank');
      setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
    } catch (error) {
      console.error('View failed:', error);
      window.open(work.accessUrl, '_blank');
    } finally {
      setIsViewing(false);
    }
  };

  const handleDownload = async (e: React.MouseEvent) => {
    if (!work.accessUrl) return;
    e.preventDefault();
    e.stopPropagation();
    
    setIsDownloading(true);
    try {
      const response = await fetch(work.accessUrl);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      const filename = work.accessFileName || work.title || 'file.pdf';
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Download failed:', error);
      window.open(work.accessUrl, '_blank');
    } finally {
      setIsDownloading(false);
    }
  };

  if (!work.accessUrl) {
    return <span style={{ fontSize: "13px", color: "#c0c9c3", fontWeight: 400 }}>—</span>;
  }

  return (
    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
      <button 
        onClick={handleView}
        disabled={isViewing}
        title="View"
        style={{ 
          display: "flex", alignItems: "center", justifyContent: "center",
          width: "32px", height: "32px", borderRadius: "6px",
          border: "1.5px solid #0b4335", backgroundColor: "transparent", color: "#0b4335",
          cursor: isViewing ? "wait" : "pointer", transition: "all 0.15s"
        }}
        onMouseEnter={(e) => { if (!isViewing) e.currentTarget.style.backgroundColor = "rgba(11,67,53,0.05)"; }}
        onMouseLeave={(e) => { if (!isViewing) e.currentTarget.style.backgroundColor = "transparent"; }}
      >
        {isViewing ? <Icon name="hourglass_empty" size={16} /> : <Icon name="visibility" size={18} />}
      </button>

      <button 
        onClick={handleDownload}
        disabled={isDownloading}
        title="Download"
        style={{ 
          display: "flex", alignItems: "center", justifyContent: "center",
          width: "32px", height: "32px", borderRadius: "6px",
          border: "1.5px solid #0b4335", backgroundColor: isDownloading ? "#0b4335" : "transparent", color: isDownloading ? "#fff" : "#0b4335",
          cursor: isDownloading ? "wait" : "pointer", transition: "all 0.15s"
        }}
        onMouseEnter={(e) => { if (!isDownloading) { e.currentTarget.style.backgroundColor = "#0b4335"; e.currentTarget.style.color = "#fff"; } }}
        onMouseLeave={(e) => { if (!isDownloading) { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = "#0b4335"; } }}
      >
        {isDownloading ? <Icon name="hourglass_empty" size={16} /> : <Icon name="download" size={18} />}
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  MEDIA CARD COMPONENT (View & Download)                             */
/* ------------------------------------------------------------------ */
function MediaCard({ 
  item, 
  isRejected, 
  onToggleReject 
}: { 
  item: MediaItem; 
  isRejected: boolean; 
  onToggleReject: () => void;
}) {
  const [isViewing, setIsViewing] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleView = async (e: React.MouseEvent) => {
    if (!item.accessUrl) return;
    e.preventDefault();
    e.stopPropagation();
    setIsViewing(true);
    try {
      const response = await fetch(item.accessUrl);
      const blob = await response.blob();
      const correctType = item.type === 'audio' ? 'audio/mpeg' : 
                          item.type === 'video' ? 'video/mp4' : 
                          'application/pdf';
      const typedBlob = new Blob([blob], { type: correctType });
      const blobUrl = URL.createObjectURL(typedBlob);
      window.open(blobUrl, '_blank');
      setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
    } catch (error) {
      console.error('View failed:', error);
      window.open(item.accessUrl, '_blank');
    } finally {
      setIsViewing(false);
    }
  };

  const handleDownload = async (e: React.MouseEvent) => {
    if (!item.accessUrl) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDownloading(true);
    try {
      const response = await fetch(item.accessUrl);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      const filename = item.accessFileName || item.title || 'file.pdf';
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Download failed:', error);
      window.open(item.accessUrl, '_blank');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div style={{ 
      ...cardStyle, 
      padding: 16, 
      display: "flex", 
      flexDirection: "column", 
      gap: 10, 
      backgroundColor: isRejected ? "rgba(139, 44, 44, 0.1)" : colors.creamMid, 
      border: `1px solid ${isRejected ? colors.red : colors.creamDark}`, 
      opacity: isRejected ? 0.7 : 1 
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <Icon name={item.type === "video" ? "movie" : item.type === "audio" ? "graphic_eq" : "article"} size={24} />
        <button 
          onClick={onToggleReject}
          title={isRejected ? "Click to Approve this media" : "Click to Reject this media"}
          style={{ 
            padding: "6px 12px", 
            borderRadius: 6, 
            border: `1.5px solid ${isRejected ? colors.red : colors.creamDark}`, 
            backgroundColor: isRejected ? colors.red : "transparent", 
            color: isRejected ? colors.creamLight : colors.red, 
            cursor: "pointer", 
            fontFamily: fonts.label, 
            fontSize: 11, 
            fontWeight: 700,
            display: "flex", 
            alignItems: "center", 
            gap: 6,
            transition: "all 0.2s"
          }}
          onMouseEnter={(e) => {
            if (!isRejected) {
              e.currentTarget.style.backgroundColor = colors.red;
              e.currentTarget.style.color = colors.creamLight;
              e.currentTarget.style.borderColor = colors.red;
            }
          }}
          onMouseLeave={(e) => {
            if (!isRejected) {
              e.currentTarget.style.backgroundColor = "transparent";
              e.currentTarget.style.color = colors.red;
              e.currentTarget.style.borderColor = colors.creamDark;
            }
          }}
        >
          <Icon name={isRejected ? "cancel" : "block"} size={16} /> 
          {isRejected ? "Rejected" : "Reject"}
        </button>
      </div>
      <p style={{ fontFamily: fonts.headline, fontSize: 14, fontWeight: 600, margin: 0, lineHeight: 1.3 }}>{item.title}</p>
      <p style={{ fontFamily: fonts.body, fontSize: 12, color: colors.forestGreen, opacity: 0.8, margin: 0, lineHeight: 1.4 }}>{item.description}</p>
      
      {item.accessUrl && (
        <div style={{ display: "flex", gap: "8px", marginTop: "auto" }}>
          <button 
            onClick={handleView}
            disabled={isViewing}
            style={{ 
              flex: 1,
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center", 
              gap: 6, 
              padding: "8px", 
              backgroundColor: "transparent", 
              border: `1.5px solid ${colors.forestGreen}`, 
              borderRadius: 6, 
              fontFamily: fonts.body, 
              fontSize: 11, 
              fontWeight: 600, 
              color: colors.forestGreen, 
              cursor: isViewing ? "wait" : "pointer",
              opacity: isViewing ? 0.6 : 1,
              transition: "all 0.15s"
            }}
            onMouseEnter={(e) => { if (!isViewing) e.currentTarget.style.backgroundColor = "rgba(11,67,53,0.05)"; }}
            onMouseLeave={(e) => { if (!isViewing) e.currentTarget.style.backgroundColor = "transparent"; }}
          >
            {isViewing ? <Icon name="hourglass_empty" size={14} /> : <Icon name="visibility" size={14} />}
            {isViewing ? "LOADING..." : "VIEW"}
          </button>
          
          <button 
            onClick={handleDownload}
            disabled={isDownloading}
            style={{ 
              flex: 1,
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center", 
              gap: 6, 
              padding: "8px", 
              backgroundColor: isDownloading ? colors.forestGreen : "transparent", 
              border: `1.5px solid ${colors.forestGreen}`, 
              borderRadius: 6, 
              fontFamily: fonts.body, 
              fontSize: 11, 
              fontWeight: 600, 
              color: isDownloading ? colors.creamLight : colors.forestGreen, 
              cursor: isDownloading ? "wait" : "pointer",
              opacity: isDownloading ? 0.6 : 1,
              transition: "all 0.15s"
            }}
            onMouseEnter={(e) => { if (!isDownloading) { e.currentTarget.style.backgroundColor = colors.forestGreen; e.currentTarget.style.color = colors.creamLight; } }}
            onMouseLeave={(e) => { if (!isDownloading) { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = colors.forestGreen; } }}
          >
            {isDownloading ? <Icon name="hourglass_empty" size={14} /> : <Icon name="download" size={14} />}
            {isDownloading ? "DL..." : "DOWNLOAD"}
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
  const { lang: siteLang } = useLang();
  const initialLang = (siteLang === "EN" || siteLang === "AR" || siteLang === "FR") ? siteLang : "EN";

  const [lang, setLang] = useState<Language>(initialLang);
  const [data, setData] = useState<ScholarDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showApproveConfirm, setShowApproveConfirm] = useState(false);
  const [showRejectConfirm, setShowRejectConfirm] = useState(false);
  const [imgGray, setImgGray] = useState(true);

  // ✅ NEW: Reason states for Approve and Reject
  const [approveReason, setApproveReason] = useState("");
  const [rejectReason, setRejectReason] = useState("");

  // ✅ NEW: Restrict User Modal States
  const [showRestrictModal, setShowRestrictModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{ type: 'revoke' | 'ban' } | null>(null);

  // ✅ STATE: Track individually rejected items before final approval
  const [rejectedItems, setRejectedItems] = useState<{
    works: number[];
    references: number[];
    media: number[];
    images: number[];
  }>({ works: [], references: [], media: [], images: [] });

  const toggleReject = (type: 'works' | 'references' | 'media' | 'images', itemId: number) => {
    setRejectedItems(prev => {
      const current = prev[type];
      if (current.includes(itemId)) {
        return { ...prev, [type]: current.filter(i => i !== itemId) };
      } else {
        return { ...prev, [type]: [...current, itemId] };
      }
    });
  };

  // ✅ ROUTE 1: GET ALL SCHOLAR INFO
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const searchId = parseInt(id || "0");
        const createdResponse = await adminApi.scholars.getPendingCreated();
        let found = createdResponse.data.data?.find(
          (v: any) => v.scholar_id === searchId || v.version_id === searchId
        );

        if (!found) {
          const editedResponse = await adminApi.scholars.getPendingEdited();
          const editedItem = editedResponse.data.data?.find(
            (item: any) => item.proposed.scholar_id === searchId || item.proposed.version_id === searchId
          );
          if (editedItem) found = editedItem.proposed;
        }
        
        if (found) {
          const disciplines = (found.scholar_disciplines || [])
            .map((d: any) => d.disciplines?.name)
            .filter(Boolean)
            .join(", ");

          const birthDate = (found.scholar_dates || []).find((d: any) => d.date_type === "birth");
          const deathDate = (found.scholar_dates || []).find((d: any) => d.date_type === "death");
          const bornStr = birthDate ? (birthDate.raw_text || (birthDate.year ? `${birthDate.year} ${birthDate.calendar}` : "")) : "";
          const diedStr = deathDate ? (deathDate.raw_text || (deathDate.year ? `${deathDate.year} ${deathDate.calendar}` : "")) : "";

          let centuryStr = "";
          if (found.century_gregorian_start || found.century_gregorian_end) {
            centuryStr = `${found.century_gregorian_start || ""} - ${found.century_gregorian_end || ""} (Gregorian)`;
          } else if (found.century_hijri_start || found.century_hijri_end) {
            centuryStr = `${found.century_hijri_start || ""} - ${found.century_hijri_end || ""} (Hijri)`;
          }

          const lineage = (found.scholar_relationships_as_source || [])
            .filter((r: any) => r.relation_type === "teacher" || r.relation_type === "historical_influence")
            .map((r: any, i: number) => ({
              initials: r.related_scholar_version?.canonical_name?.substring(0, 2).toUpperCase() || "?",
              color: i % 2 === 0 ? colors.forestGreen : colors.amber,
              textColor: colors.creamLight,
              name: r.related_scholar_version?.canonical_name || "Unknown",
              role: r.relation_type.replace("_", " ").toUpperCase(),
              profileUrl: `/scholars/${r.related_scholar_version?.scholar_id}`
            }));

          const disciples = (found.scholar_relationships_as_source || [])
            .filter((r: any) => r.relation_type === "student" || r.relation_type === "disciple")
            .map((r: any, i: number) => ({
              initials: r.related_scholar_version?.canonical_name?.substring(0, 2).toUpperCase() || "?",
              color: i % 2 === 0 ? colors.amber : colors.red,
              textColor: colors.creamLight,
              name: r.related_scholar_version?.canonical_name || "Unknown",
              role: r.relation_type.replace("_", " ").toUpperCase(),
              profileUrl: `/scholars/${r.related_scholar_version?.scholar_id}`
            }));

          const bioText = found.biography || "";
          const bioParts = bioText.split(/\n\n+/);

          const mappedWorks = (found.scholar_works || []).map((w: any) => ({
            id: w.work_id || w.id,
            work_id: w.work_id,
            title: w.title || "Untitled",
            year: w.year || 0,
            format: w.format || "OTHER",
            digitalAccess: (w.media_url || w.file_path) ? getAccessType(w.file_name || w.media_url || "") : null,
            accessUrl: w.media_url || w.file_path || null,
            accessFileName: w.file_name || w.title || "file.pdf",
            accessSource: w.source_type || (w.media_url ? "link" : "upload"),
            uploadedBy: w.users?.username || found.users?.username,
            uploadedByUrl: w.users?.id ? `/profile/${w.users.id}` : undefined,
          }));

          const mappedMedia = (found.media || []).map((m: any): MediaItem => ({
            id: m.media_id || m.id,
            media_id: m.media_id,
            type: getMediaType(m.file_type),
            title: m.title || m.file_name || "Untitled Media",
            description: m.description || `${(m.file_type || "pdf").toUpperCase()} file`,
            viewCount: m.view_count || 0,
            likeCount: m.like_count || 0,
            action: m.source_type === "upload" ? "DOWNLOAD FILE" : "OPEN LINK",
            actionIcon: m.source_type === "upload" ? "download" : "open_in_new",
            accessUrl: m.media_url || m.file_path || null,
            accessSource: m.source_type || (m.media_url ? "link" : "upload"),
            accessFileName: m.file_name || m.title || "file.pdf",
            uploadedBy: m.users?.username || found.users?.username,
            uploadedByUrl: m.users?.id ? `/profile/${m.users.id}` : undefined,
          }));

          const mappedRefs = (found.scholar_references || []).map((r: any) => ({
            id: r.reference_id || r.id,
            reference_id: r.reference_id,
            title: r.title || "Untitled Reference",
            citation: r.citation || "",
            url: r.url || null,
          }));

          setData({
            id: found.scholar_id,
            versionId: found.version_id,
            status: found.status,
            createdById: found.users?.id || null, // ✅ ADDED: For Ban/Restrict
            imageId: found.img_versions?.[0]?.img_version_id || null,
            name: { 
              EN: found.canonical_name || "Unknown", 
              AR: found.canonical_name || "Unknown", 
              FR: found.canonical_name || "Unknown" 
            },
            subtitle: { 
              EN: (found.scholar_aliases || []).map((a: any) => a.alias_name).join(", "), 
              AR: (found.scholar_aliases || []).map((a: any) => a.alias_name).join(", "), 
              FR: (found.scholar_aliases || []).map((a: any) => a.alias_name).join(", ") 
            },
            createdBy: found.users?.username || "Unknown",
            createdByUrl: "#",
            createdDate: new Date(found.created_at).toLocaleDateString(),
            image: found.image_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(found.canonical_name || "S")}&background=0b4335&color=fff&size=128`,
            overviewText: { EN: bioParts[0], AR: bioParts[0], FR: bioParts[0] },
            body: { EN: bioParts.slice(1), AR: bioParts.slice(1), FR: bioParts.slice(1) },
            atAGlance: { 
              fullName: found.canonical_name || "", 
              born: bornStr, 
              died: diedStr, 
              century: centuryStr, 
              region: found.regions?.name || "", 
              discipline: disciplines || "" 
            },
            contributors: [],
            works: mappedWorks,
            media: mappedMedia,
            intellectualLineage: lineage,
            notableDisciples: disciples,
            academicReferences: mappedRefs,
            recentRevisions: []
          });
        } else {
          setData(MOCK_SCHOLAR);
        }
      } catch (error) {
        console.error("Failed to fetch scholar, using mock data:", error);
        setData(MOCK_SCHOLAR);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [id]);

  // ✅ UPDATED: Approve Handler (Sends reason)
  const handleApprove = async () => {
    try {
      const payload = {
        reason: approveReason || "Approved", // ✅ Send internal notes
        reject_works: rejectedItems.works,
        reject_references: rejectedItems.references,
        reject_media: rejectedItems.media,
        reject_images: rejectedItems.images,
      };
      await adminApi.scholars.approve(data!.versionId, payload);
      navigate("/admin/pending/scholars");
    } catch (error) {
      console.error("Approval failed", error);
      alert("Failed to approve scholar. Please try again.");
    }
    setShowApproveConfirm(false);
  };

  // ✅ UPDATED: Reject Handler (Sends reason)
  const handleReject = async () => {
    if (!rejectReason.trim()) {
      alert("Please provide a rejection reason");
      return;
    }
    try {
      await adminApi.scholars.reject(data!.versionId, rejectReason);
      navigate("/admin/pending/scholars");
    } catch (error) {
      console.error("Rejection failed", error);
      alert("Failed to reject scholar. Please try again.");
    }
    setShowRejectConfirm(false);
  };

  // ✅ NEW: Restrict User + Auto-Reject Handler
  const executeRestrictionAndReject = async () => {
    if (!confirmAction || !data) return;
    try {
      const userId = data.createdById;
      const scholarId = data.versionId;

      if (!userId) {
        alert("Cannot restrict system-generated submissions.");
        setConfirmAction(null);
        setShowRestrictModal(false);
        return;
      }

      // 1. Restrict the User
      if (confirmAction.type === 'revoke') {
        await adminApi.users.toggleContribute(userId);
      } else {
        await adminApi.users.ban(userId);
      }

      // 2. Automatically Reject the Scholar Submission
      const defaultReason = confirmAction.type === 'ban' ? "Contributor banned" : "Contribution access revoked";
      await adminApi.scholars.reject(scholarId, defaultReason);

      // 3. Navigate away and close modals
      navigate("/admin/pending/scholars");
      setConfirmAction(null);
      setShowRestrictModal(false);
    } catch (err) {
      console.error("Action failed:", err);
      alert("Failed to process action. Please try again.");
    }
  };

  if (isLoading || !data) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: colors.creamLight, color: colors.forestGreen }}>
        <Icon name="hourglass_empty" size={32} />
      </div>
    );
  }

  const isRTL = lang === "AR";
  const t = {
    atAGlance: isRTL ? "لمحة سريعة" : lang === "FR" ? "EN UN COUP D'ŒIL" : "AT A GLANCE",
    fullName: isRTL ? "الاسم الكامل" : lang === "FR" ? "Nom complet" : "Full Name",
    born: isRTL ? "الميلاد" : lang === "FR" ? "Né" : "Born",
    died: isRTL ? "الوفاة" : lang === "FR" ? "Décédé" : "Died",
    century: isRTL ? "القرن" : lang === "FR" ? "Siècle" : "Century",
    region: isRTL ? "المنطقة" : lang === "FR" ? "Région" : "Region",
    discipline: isRTL ? "التخصص" : lang === "FR" ? "Discipline" : "Discipline",
  };

  const thStyle: React.CSSProperties = { fontFamily: fonts.label, fontSize: 11, letterSpacing: "0.06em", fontWeight: 600, color: colors.forestGreen, textAlign: isRTL ? "right" : "left", padding: "12px 14px", borderBottom: `1px solid ${colors.forestGreen}`, textTransform: "uppercase", opacity: 0.8 };
  const tdStyle: React.CSSProperties = { fontFamily: fonts.body, fontSize: 13, color: colors.forestGreen, padding: "14px", borderBottom: `1px solid ${colors.creamDark}`, textAlign: isRTL ? "right" : "left" };

  return (
    <div dir={isRTL ? "rtl" : "ltr"} style={{ fontFamily: fonts.body, color: colors.forestGreen, backgroundColor: colors.creamLight, minHeight: "100vh", padding: 24 }}>
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>

        <button
          onClick={() => navigate("/admin/pending/scholars")}
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", backgroundColor: "transparent", border: `1px solid ${colors.forestGreen}`, borderRadius: 8, fontFamily: fonts.body, fontSize: 12, color: colors.forestGreen, cursor: "pointer", marginBottom: 16 }}
        >
          <Icon name={isRTL ? "arrow_forward" : "arrow_back"} size={14} /> {isRTL ? "العودة إلى قائمة العلماء" : "Back to Pending Scholars"}
        </button>

        <section style={{ ...cardStyle, padding: 24, marginBottom: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 20, flexWrap: "wrap" }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6, flexWrap: "wrap" }}>
                <h1 style={{ fontFamily: fonts.headline, fontSize: 28, fontWeight: 700, color: colors.forestGreen, margin: 0 }}>
                  {data.name[lang]}
                </h1>
                <StatusBadge status={data.status || "Pending Review"} />
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 10px", borderRadius: 9999, backgroundColor: colors.creamMid, color: colors.forestGreen, fontFamily: fonts.label, fontSize: 11, fontWeight: 600, border: `1px solid ${colors.forestGreen}` }}>
                  {lang} {isRTL ? "نسخة" : "Version"}
                </span>
              </div>
              {data.subtitle[lang] && (
                <p style={{ fontFamily: fonts.body, fontSize: 14, color: colors.forestGreen, margin: "4px 0 12px", fontStyle: "italic", opacity: 0.8 }}>
                  {data.subtitle[lang]}
                </p>
              )}
              <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                <span style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: fonts.label, fontSize: 11, color: colors.forestGreen, opacity: 0.8 }}>
                  <Icon name="location_on" size={14} /> {data.atAGlance.region || "No region"}
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: fonts.label, fontSize: 11, color: colors.forestGreen, opacity: 0.8 }}>
                  <Icon name="event" size={14} /> {isRTL ? "أرسلت" : "Submitted"}: {data.createdDate} {isRTL ? "بواسطة" : "by"} {data.createdBy}
                </span>
              </div>
            </div>

            {/* ✅ UPDATED: Action Buttons (Added Restrict) */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button onClick={() => setShowRejectConfirm(true)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 18px", backgroundColor: "transparent", border: `1px solid ${colors.red}`, borderRadius: 8, fontFamily: fonts.body, fontSize: 13, fontWeight: 500, color: colors.red, cursor: "pointer" }}>
                <Icon name="close" size={16} /> {isRTL ? "رفض" : "Reject"}
              </button>
              <button onClick={() => setShowRestrictModal(true)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 18px", backgroundColor: "transparent", border: `1px solid ${colors.amber}`, borderRadius: 8, fontFamily: fonts.body, fontSize: 13, fontWeight: 500, color: colors.amber, cursor: "pointer" }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = colors.amber; e.currentTarget.style.color = colors.creamLight; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = colors.amber; }}>
                <Icon name="shield_person" size={16} /> {isRTL ? "تقييد المستخدم" : "Restrict User"}
              </button>
              
              <button onClick={() => setShowApproveConfirm(true)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 18px", backgroundColor: colors.forestGreen, border: `1px solid ${colors.forestGreen}`, borderRadius: 8, fontFamily: fonts.body, fontSize: 13, fontWeight: 600, color: colors.creamLight, cursor: "pointer" }}>
                <Icon name="check" size={16} filled /> {isRTL ? "موافقة على العالم" : "Approve Scholar"}
              </button>
            </div>
          </div>
        </section>

        <div style={{ display: "grid", gridTemplateColumns: isRTL ? "1fr 320px" : "320px 1fr", gap: 24, alignItems: "start" }}>
          
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div style={{ backgroundColor: "#fff", border: "1px solid rgba(192,201,195,0.4)", borderRadius: "12px", overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", position: "sticky", top: "24px" }}>
              <div style={{ position: "relative", aspectRatio: "1/1", overflow: "hidden", backgroundColor: colors.creamMid }}>
                {data.image ? (
                  <>
                    <img 
                      alt="Scholar portrait" 
                      src={data.image} 
                      style={{ 
                        width: "100%", 
                        height: "100%", 
                        objectFit: "cover", 
                        filter: imgGray ? "grayscale(100%)" : "grayscale(0%)", 
                        transition: "filter 0.6s ease", 
                        display: "block" 
                      }} 
                      onMouseEnter={() => setImgGray(false)} 
                      onMouseLeave={() => setImgGray(true)} 
                    />
                   <button 
                      onClick={() => toggleReject('images', data.imageId ?? 0)} 
                      title={rejectedItems.images.includes(data.imageId ?? 0) ? "Click to Approve this image" : "Click to Reject this image"}
                      style={{ 
                        position: "absolute", 
                        bottom: 12, 
                        right: 12, 
                        padding: "8px 14px",
                        borderRadius: 8, 
                        border: `2px solid ${rejectedItems.images.includes(data.imageId ?? 0) ? colors.red : colors.creamDark}`, 
                        backgroundColor: rejectedItems.images.includes(data.imageId ?? 0) ? colors.red : "rgba(255,255,255,0.95)", 
                        color: rejectedItems.images.includes(data.imageId ?? 0) ? colors.creamLight : colors.red, 
                        cursor: "pointer", 
                        display: "flex", 
                        alignItems: "center", 
                        gap: 6,
                        fontFamily: fonts.label,
                        fontSize: 11,
                        fontWeight: 700,
                        boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                        transition: "all 0.2s"
                      }}
                      onMouseEnter={(e) => {
                        if (!rejectedItems.images.includes(data.imageId ?? 0)) {
                          e.currentTarget.style.backgroundColor = colors.red;
                          e.currentTarget.style.color = colors.creamLight;
                          e.currentTarget.style.borderColor = colors.red;
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!rejectedItems.images.includes(data.imageId ?? 0)) {
                          e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.95)";
                          e.currentTarget.style.color = colors.red;
                          e.currentTarget.style.borderColor = colors.creamDark;
                        }
                      }}
                    >
                      <Icon name={rejectedItems.images.includes(data.imageId ?? 0) ? "cancel" : "block"} size={18} />
                      {rejectedItems.images.includes(data.imageId ?? 0) ? (isRTL ? "مرفوض" : "Rejected") : (isRTL ? "رفض" : "Reject")}
                    </button>
                  </>
                ) : (
                  <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#c0c9c3" }}>
                    <Icon name="account_circle" size={80} />
                  </div>
                )}
              </div>
              
              <div style={{ padding: "20px" }}>
                <p style={{ fontFamily: fonts.label, fontSize: "9px", color: colors.forestGreen, letterSpacing: "0.2em", marginBottom: "12px", borderBottom: "1px solid rgba(11,67,53,0.1)", paddingBottom: "8px", textTransform: "uppercase" }}>{t.atAGlance}</p>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <tbody>
                    <tr style={{ borderBottom: "1px solid #f0f1ee" }}>
                      <td style={{ fontFamily: fonts.label, padding: "8px 0", fontSize: "10px", color: "#707974", fontWeight: 400, verticalAlign: "top" }}>{t.fullName}</td>
                      <td style={{ padding: "8px 0", fontSize: "11px", fontWeight: 700, textAlign: "right", color: "#191c1b", verticalAlign: "top", paddingLeft: "8px" }}>{data.atAGlance.fullName || "—"}</td>
                    </tr>
                    <tr style={{ borderBottom: "1px solid #f0f1ee" }}>
                      <td style={{ fontFamily: fonts.label, padding: "8px 0", fontSize: "10px", color: "#707974", fontWeight: 400, verticalAlign: "top" }}>{t.born}</td>
                      <td style={{ padding: "8px 0", fontSize: "11px", fontWeight: 700, textAlign: "right", color: "#191c1b", verticalAlign: "top", paddingLeft: "8px" }}>{data.atAGlance.born || "—"}</td>
                    </tr>
                    <tr style={{ borderBottom: "1px solid #f0f1ee" }}>
                      <td style={{ fontFamily: fonts.label, padding: "8px 0", fontSize: "10px", color: "#707974", fontWeight: 400, verticalAlign: "top" }}>{t.died}</td>
                      <td style={{ padding: "8px 0", fontSize: "11px", fontWeight: 700, textAlign: "right", color: "#191c1b", verticalAlign: "top", paddingLeft: "8px" }}>{data.atAGlance.died || "—"}</td>
                    </tr>
                    <tr style={{ borderBottom: "1px solid #f0f1ee" }}>
                      <td style={{ fontFamily: fonts.label, padding: "8px 0", fontSize: "10px", color: "#707974", fontWeight: 400, verticalAlign: "top" }}>{t.century}</td>
                      <td style={{ padding: "8px 0", fontSize: "11px", fontWeight: 700, textAlign: "right", color: "#191c1b", verticalAlign: "top", paddingLeft: "8px" }}>{data.atAGlance.century || "—"}</td>
                    </tr>
                    <tr style={{ borderBottom: "1px solid #f0f1ee" }}>
                      <td style={{ fontFamily: fonts.label, padding: "8px 0", fontSize: "10px", color: "#707974", fontWeight: 400, verticalAlign: "top" }}>{t.region}</td>
                      <td style={{ padding: "8px 0", fontSize: "11px", fontWeight: 700, textAlign: "right", color: "#191c1b", verticalAlign: "top", paddingLeft: "8px" }}>{data.atAGlance.region || "—"}</td>
                    </tr>
                    <tr>
                      <td style={{ fontFamily: fonts.label, padding: "8px 0", fontSize: "10px", color: "#707974", fontWeight: 400, verticalAlign: "top" }}>{t.discipline}</td>
                      <td style={{ padding: "8px 0", fontSize: "11px", fontWeight: 700, textAlign: "right", color: "#191c1b", verticalAlign: "top", paddingLeft: "8px" }}>{data.atAGlance.discipline || "—"}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            
            <section style={{ ...cardStyle, padding: 20 }}>
              <h2 style={{ fontFamily: fonts.headline, fontSize: 16, fontWeight: 600, color: colors.forestGreen, margin: "0 0 12px", display: "flex", alignItems: "center", gap: 8 }}>
                <Icon name="person" size={18} filled /> {isRTL ? "السيرة الذاتية" : "Biography"}
              </h2>
              <p style={{ fontFamily: fonts.body, fontSize: 13, lineHeight: 1.6, color: colors.forestGreen, margin: "0 0 16px", fontWeight: 500 }}>
                {data.overviewText[lang]}
              </p>
              {(data.body[lang] || []).map((para, i) => (
                <p key={i} style={{ fontFamily: isRTL ? "'Amiri', serif" : fonts.body, fontSize: isRTL ? 15 : 13, lineHeight: 1.8, color: colors.forestGreen, margin: "0 0 12px", opacity: 0.85 }}>
                  {para}
                </p>
              ))}
            </section>

            <section style={{ ...cardStyle, padding: 20, overflow: "hidden" }}>
              <h2 style={{ fontFamily: fonts.headline, fontSize: 16, fontWeight: 600, color: colors.forestGreen, margin: "0 0 14px", display: "flex", alignItems: "center", gap: 8 }}>
                <Icon name="library_books" size={18} filled /> {isRTL ? "الأعمال والمؤلفات" : "Works & Bibliography"}
              </h2>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead style={{ backgroundColor: colors.creamMid }}>
                    <tr>
                      <th style={thStyle}>{isRTL ? "العنوان" : "Title"}</th>
                      <th style={thStyle}>{isRTL ? "السنة" : "Year"}</th>
                      <th style={thStyle}>{isRTL ? "الصيغة" : "Format"}</th>
                      <th style={thStyle}>{isRTL ? "الوصول" : "Access"}</th>
                      <th style={{ ...thStyle, textAlign: "center" }}>{isRTL ? "الحالة" : "Status"}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.works.map((w: any, i) => {
                      const itemId = w.id || w.work_id || i;
                      const isRejected = rejectedItems.works.includes(itemId);
                      return (
                        <tr key={i} style={{ transition: "background-color 0.15s", backgroundColor: isRejected ? "rgba(139, 44, 44, 0.1)" : "transparent" }} onMouseEnter={(e) => { if (!isRejected) e.currentTarget.style.backgroundColor = colors.creamMid }} onMouseLeave={(e) => { if (!isRejected) e.currentTarget.style.backgroundColor = "transparent" }}>
                          <td style={tdStyle}>
                            <div>
                              <p style={{ margin: 0, fontWeight: 600, fontFamily: fonts.headline, fontSize: 13 }}>{w.title || "Untitled"}</p>
                              {w.uploadedBy && <p style={{ margin: "2px 0 0", fontFamily: fonts.label, fontSize: 10, opacity: 0.7 }}>{isRTL ? "بواسطة" : "by"} {w.uploadedBy}</p>}
                            </div>
                          </td>
                          <td style={{ ...tdStyle, fontFamily: fonts.label, fontSize: 12 }}>{w.year || "-"}</td>
                          <td style={tdStyle}>
                            <span style={{ padding: "3px 8px", borderRadius: 6, backgroundColor: colors.creamMid, border: `1px solid ${colors.creamDark}`, fontFamily: fonts.label, fontSize: 11 }}>
                              {w.format || "UNKNOWN"}
                            </span>
                          </td>
                          <td style={tdStyle}>
                            <WorkActions work={w} />
                          </td>
                          <td style={{ ...tdStyle, textAlign: "center" }}>
                            <button 
                              onClick={() => toggleReject('works', itemId)}
                              title={isRejected ? "Click to Approve this work" : "Click to Reject this work"}
                              style={{ 
                                padding: "6px 12px", 
                                borderRadius: 6, 
                                border: `1.5px solid ${isRejected ? colors.red : colors.creamDark}`, 
                                backgroundColor: isRejected ? colors.red : "transparent", 
                                color: isRejected ? colors.creamLight : colors.red, 
                                cursor: "pointer", 
                                fontFamily: fonts.label, 
                                fontSize: 11, 
                                fontWeight: 700,
                                display: "flex", 
                                alignItems: "center", 
                                gap: 6, 
                                flexShrink: 0,
                                transition: "all 0.2s",
                                marginLeft: "auto",
                                marginRight: "auto"
                              }}
                              onMouseEnter={(e) => {
                                if (!isRejected) {
                                  e.currentTarget.style.backgroundColor = colors.red;
                                  e.currentTarget.style.color = colors.creamLight;
                                  e.currentTarget.style.borderColor = colors.red;
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (!isRejected) {
                                  e.currentTarget.style.backgroundColor = "transparent";
                                  e.currentTarget.style.color = colors.red;
                                  e.currentTarget.style.borderColor = colors.creamDark;
                                }
                              }}
                            >
                              <Icon name={isRejected ? "cancel" : "block"} size={16} /> 
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

            <section style={{ ...cardStyle, padding: 20 }}>
              <h2 style={{ fontFamily: fonts.headline, fontSize: 16, fontWeight: 600, color: colors.forestGreen, margin: "0 0 14px", display: "flex", alignItems: "center", gap: 8 }}>
                <Icon name="media_link" size={18} filled /> {isRTL ? "الوسائط المتكاملة" : "Integrated Media"}
              </h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
                {data.media.map((m: any, i) => {
                  const itemId = m.id || m.media_id || i;
                  const isRejected = rejectedItems.media.includes(itemId);
                  return (
                    <MediaCard 
                      key={i} 
                      item={m} 
                      isRejected={isRejected}
                      onToggleReject={() => toggleReject('media', itemId)}
                    />
                  );
                })}
              </div>
            </section>

            <section style={{ ...cardStyle, padding: 20 }}>
              <h2 style={{ fontFamily: fonts.headline, fontSize: 16, fontWeight: 600, color: colors.forestGreen, margin: "0 0 14px", display: "flex", alignItems: "center", gap: 8 }}>
                <Icon name="account_tree" size={18} filled /> {isRTL ? "العلاقات" : "Relationships"}
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                  <p style={{ fontFamily: fonts.label, fontSize: 10, letterSpacing: "0.06em", color: colors.forestGreen, margin: "0 0 8px", opacity: 0.7 }}>{isRTL ? "السلسلة الفكرية" : "INTELLECTUAL LINEAGE"}</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {data.intellectualLineage.map((p, i) => (
                      <a key={i} href={p.profileUrl} style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", padding: 8, borderRadius: 8, transition: "background 0.15s" }} onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = colors.creamMid)} onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}>
                        <div style={{ width: 32, height: 32, borderRadius: "50%", backgroundColor: p.color, color: p.textColor, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: fonts.headline, fontWeight: 700, fontSize: 12, flexShrink: 0 }}>{p.initials}</div>
                        <div>
                          <p style={{ fontFamily: fonts.body, fontSize: 13, fontWeight: 600, color: colors.forestGreen, margin: 0 }}>{p.name}</p>
                          <p style={{ fontFamily: fonts.label, fontSize: 10, color: colors.forestGreen, opacity: 0.7, margin: 0 }}>{p.role}</p>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
                <div style={{ borderTop: `1px dashed ${colors.creamDark}`, paddingTop: 16 }}>
                  <p style={{ fontFamily: fonts.label, fontSize: 10, letterSpacing: "0.06em", color: colors.forestGreen, margin: "0 0 8px", opacity: 0.7 }}>{isRTL ? "أبرز التلامذة" : "NOTABLE DISCIPLES"}</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {data.notableDisciples.map((p, i) => (
                      <a key={i} href={p.profileUrl} style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", padding: 8, borderRadius: 8, transition: "background 0.15s" }} onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = colors.creamMid)} onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}>
                        <div style={{ width: 32, height: 32, borderRadius: "50%", backgroundColor: p.color, color: p.textColor, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: fonts.headline, fontWeight: 700, fontSize: 12, flexShrink: 0 }}>{p.initials}</div>
                        <div>
                          <p style={{ fontFamily: fonts.body, fontSize: 13, fontWeight: 600, color: colors.forestGreen, margin: 0 }}>{p.name}</p>
                          <p style={{ fontFamily: fonts.label, fontSize: 10, color: colors.forestGreen, opacity: 0.7, margin: 0 }}>{p.role}</p>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            <section style={{ ...cardStyle, padding: 20 }}>
              <h2 style={{ fontFamily: fonts.headline, fontSize: 16, fontWeight: 600, color: colors.forestGreen, margin: "0 0 14px", display: "flex", alignItems: "center", gap: 8 }}>
                <Icon name="menu_book" size={18} filled /> {isRTL ? "المراجع" : "References"}
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {data.academicReferences.map((r: any, i) => {
                  const itemId = r.id || r.reference_id || i;
                  const isRejected = rejectedItems.references.includes(itemId);
                  return (
                    <div key={i} style={{ padding: 12, backgroundColor: isRejected ? "rgba(139, 44, 44, 0.1)" : colors.creamMid, border: `1px solid ${isRejected ? colors.red : colors.creamDark}`, borderRadius: 8, opacity: isRejected ? 0.7 : 1 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                        <div style={{ flex: 1 }}>
                          <p style={{ fontFamily: fonts.headline, fontSize: 13, fontWeight: 600, color: colors.forestGreen, margin: "0 0 4px" }}>{r.title || "Untitled Reference"}</p>
                          <p style={{ fontFamily: fonts.body, fontSize: 12, color: colors.forestGreen, opacity: 0.8, margin: "0 0 6px", lineHeight: 1.5 }}>{r.citation || ""}</p>
                          {r.url && (
                            <a href={r.url} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 4, fontFamily: fonts.label, fontSize: 11, color: colors.forestGreen, textDecoration: "underline" }}>
                              <Icon name="link" size={12} /> {isRTL ? "عرض المصدر" : "View Source"}
                            </a>
                          )}
                        </div>
                        <button 
                          onClick={() => toggleReject('references', itemId)}
                          title={isRejected ? "Click to Approve this reference" : "Click to Reject this reference"}
                          style={{ 
                            padding: "6px 12px", 
                            borderRadius: 6, 
                            border: `1.5px solid ${isRejected ? colors.red : colors.creamDark}`, 
                            backgroundColor: isRejected ? colors.red : "transparent", 
                            color: isRejected ? colors.creamLight : colors.red, 
                            cursor: "pointer", 
                            fontFamily: fonts.label, 
                            fontSize: 11, 
                            fontWeight: 700,
                            display: "flex", 
                            alignItems: "center", 
                            gap: 6, 
                            flexShrink: 0,
                            transition: "all 0.2s"
                          }}
                          onMouseEnter={(e) => {
                            if (!isRejected) {
                              e.currentTarget.style.backgroundColor = colors.red;
                              e.currentTarget.style.color = colors.creamLight;
                              e.currentTarget.style.borderColor = colors.red;
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!isRejected) {
                              e.currentTarget.style.backgroundColor = "transparent";
                              e.currentTarget.style.color = colors.red;
                              e.currentTarget.style.borderColor = colors.creamDark;
                            }
                          }}
                        >
                          <Icon name={isRejected ? "cancel" : "block"} size={16} /> 
                          {isRejected ? (isRTL ? "مرفوض" : "Rejected") : (isRTL ? "رفض" : "Reject")}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            <section style={{ ...cardStyle, padding: 20 }}>
              <h2 style={{ fontFamily: fonts.headline, fontSize: 16, fontWeight: 600, color: colors.forestGreen, margin: "0 0 14px", display: "flex", alignItems: "center", gap: 8 }}>
                <Icon name="history" size={18} filled /> {isRTL ? "النشاط" : "Activity"}
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {data.recentRevisions.map((a, i) => (
                  <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                    <div style={{ width: 24, height: 24, borderRadius: "50%", backgroundColor: colors.creamMid, color: colors.forestGreen, border: `1px solid ${colors.forestGreen}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Icon name="upload" size={13} />
                    </div>
                    <div>
                      <p style={{ fontFamily: fonts.body, fontSize: 12, fontWeight: 500, color: colors.forestGreen, margin: 0 }}>{a.action}</p>
                      <p style={{ fontFamily: fonts.label, fontSize: 10, color: colors.forestGreen, margin: "2px 0 0", opacity: 0.7 }}>
                        {a.date} {isRTL ? "بواسطة" : "by"} {a.author}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>

        {/* ── Step 1: Choose Restrict Action Modal ── */}
        {showRestrictModal && !confirmAction && (
          <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(11, 67, 53, 0.6)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)", padding: 20 }} onClick={() => setShowRestrictModal(false)}>
            <div style={{ ...cardStyle, backgroundColor: colors.creamLight, width: 520, maxWidth: "90vw", padding: 32, boxShadow: "0 20px 60px rgba(0,0,0,0.25)" }} onClick={(e) => e.stopPropagation()}>
              
              <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
                <Avatar name={data.createdBy} size={56} />
                <div>
                  <h2 style={{ fontFamily: fonts.headline, fontSize: 20, fontWeight: 700, color: colors.forestGreen, margin: 0 }}>{isRTL ? "تقييد المستخدم" : "Restrict User"}</h2>
                  <p style={{ fontFamily: fonts.body, fontSize: 13, color: colors.forestGreen, opacity: 0.7, margin: "4px 0 0" }}>{data.createdBy} {isRTL ? "أرسل" : "submitted"} "{data.name[lang]}"</p>
                </div>
              </div>

              <p style={{ fontFamily: fonts.body, fontSize: 14, color: colors.forestGreen, lineHeight: 1.6, marginBottom: 24 }}>
                {isRTL ? "اختر إجراءً. سيتم أيضًا " : "Choose an action. This will automatically "}
                <b>{isRTL ? "رفض" : "reject"}</b> {isRTL ? "هذا العالم تلقائيًا." : "this scholar submission as well."}
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>
                <button 
                  onClick={() => setConfirmAction({ type: 'revoke' })}
                  style={{ display: "flex", alignItems: "flex-start", gap: 16, padding: 16, borderRadius: 8, border: `1px solid ${colors.amber}`, backgroundColor: "rgba(184, 134, 11, 0.05)", cursor: "pointer", textAlign: "left", transition: "background 0.2s" }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "rgba(184, 134, 11, 0.1)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "rgba(184, 134, 11, 0.05)"; }}
                >
                  <div style={{ width: 32, height: 32, borderRadius: "50%", backgroundColor: colors.amber, color: colors.creamLight, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Icon name="person_off" size={18} />
                  </div>
                  <div>
                    <p style={{ fontFamily: fonts.headline, fontSize: 14, fontWeight: 700, color: colors.forestGreen, margin: "0 0 4px" }}>{isRTL ? "إلغاء صلاحية المساهمة" : "Revoke Contribution Access"}</p>
                    <p style={{ fontFamily: fonts.body, fontSize: 12, color: colors.forestGreen, opacity: 0.7, margin: 0, lineHeight: 1.5 }}>{isRTL ? "يمكنه تسجيل الدخول ولكن لا يمكنه إضافة محتوى جديد." : "They can still log in, but cannot submit new content. (Recommended for low-quality submissions)"}</p>
                  </div>
                </button>

                <button 
                  onClick={() => setConfirmAction({ type: 'ban' })}
                  style={{ display: "flex", alignItems: "flex-start", gap: 16, padding: 16, borderRadius: 8, border: `1px solid ${colors.red}`, backgroundColor: "rgba(139, 44, 44, 0.05)", cursor: "pointer", textAlign: "left", transition: "background 0.2s" }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "rgba(139, 44, 44, 0.1)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "rgba(139, 44, 44, 0.05)"; }}
                >
                  <div style={{ width: 32, height: 32, borderRadius: "50%", backgroundColor: colors.red, color: colors.creamLight, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Icon name="block" size={18} />
                  </div>
                  <div>
                    <p style={{ fontFamily: fonts.headline, fontSize: 14, fontWeight: 700, color: colors.forestGreen, margin: "0 0 4px" }}>{isRTL ? "حظر الحساب تمامًا" : "Ban Account Completely"}</p>
                    <p style={{ fontFamily: fonts.body, fontSize: 12, color: colors.forestGreen, opacity: 0.7, margin: 0, lineHeight: 1.5 }}>{isRTL ? "سيتم قفل حسابه تمامًا." : "They will be completely locked out of the platform. (Use for spam, abuse, or severe violations)"}</p>
                  </div>
                </button>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button onClick={() => setShowRestrictModal(false)} style={{ padding: "10px 24px", borderRadius: 8, cursor: "pointer", border: `1px solid ${colors.forestGreen}`, backgroundColor: colors.creamLight, fontFamily: fonts.body, fontSize: 13, fontWeight: 600, color: colors.forestGreen }}>
                  {isRTL ? "إلغاء" : "Cancel"}
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
                {isRTL ? (confirmAction.type === 'ban' ? 'تأكيد الحظر' : 'تأكيد الإلغاء') : `Confirm ${confirmAction.type === 'ban' ? 'Ban' : 'Revocation'}`}
              </h2>
              
              <p style={{ fontFamily: fonts.body, fontSize: 14, color: colors.forestGreen, lineHeight: 1.6, marginBottom: 24, opacity: 0.8 }}>
                {isRTL ? (
                  <>سيتم <b>{confirmAction.type === 'ban' ? 'حظر' : 'إلغاء صلاحية المساهمة لـ'} {data.createdBy}</b> <br/>و<b>رفض</b> العالم "{data.name[lang]}" تلقائيًا.<br/><br/><b style={{ color: colors.red }}>لا يمكن التراجع عن هذا الإجراء من هذه الشاشة.</b></>
                ) : (
                  <>This will <b>{confirmAction.type === 'ban' ? 'BAN' : 'REVOKE CONTRIBUTION ACCESS FOR'} {data.createdBy}</b> <br/>and automatically <b>REJECT</b> the scholar "{data.name[lang]}".<br/><br/><b style={{ color: colors.red }}>This action cannot be undone from this screen.</b></>
                )}
              </p>
              
              <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
                <button onClick={() => setConfirmAction(null)} style={{ padding: "10px 24px", borderRadius: 8, cursor: "pointer", border: `1px solid ${colors.forestGreen}`, backgroundColor: colors.creamLight, fontFamily: fonts.body, fontSize: 13, fontWeight: 600, color: colors.forestGreen }}>
                  {isRTL ? "العودة" : "Go Back"}
                </button>
                <button onClick={executeRestrictionAndReject} style={{ padding: "10px 24px", borderRadius: 8, cursor: "pointer", border: "none", backgroundColor: confirmAction.type === 'ban' ? colors.red : colors.amber, color: colors.creamLight, fontFamily: fonts.body, fontSize: 13, fontWeight: 700 }}>
                  {isRTL ? "تأكيد ورفض" : "Confirm & Reject"}
                </button>
              </div>

            </div>
          </div>
        )}

        {/* ── Approve Confirmation Modal ─ */}
        {showApproveConfirm && (
          <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(11, 67, 53, 0.5)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }} onClick={() => setShowApproveConfirm(false)}>
            <div style={{ ...cardStyle, backgroundColor: colors.creamLight, width: 500, maxWidth: "90vw", padding: 32, boxShadow: "0 20px 60px rgba(0,0,0,0.18)" }} onClick={(e) => e.stopPropagation()}>
              <div style={{ width: 56, height: 56, borderRadius: "50%", backgroundColor: colors.forestGreen, color: colors.creamLight, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20, border: `1px solid ${colors.forestGreen}` }}>
                <Icon name="check_circle" size={28} filled />
              </div>
              <h2 style={{ fontFamily: fonts.headline, fontSize: 20, fontWeight: 700, color: colors.forestGreen, marginBottom: 16 }}>{isRTL ? "موافقة على العالم" : "Approve Scholar?"}</h2>
              
              <div style={{ backgroundColor: colors.creamMid, padding: 16, borderRadius: 8, marginBottom: 20 }}>
                <p style={{ margin: "0 0 8px", fontFamily: fonts.headline, fontSize: 16, fontWeight: 600, color: colors.forestGreen }}>{data.name[lang]}</p>
                <p style={{ margin: "0 0 4px", fontFamily: fonts.body, fontSize: 13, color: colors.forestGreen }}><strong>{isRTL ? "اللغة:" : "Language:"}</strong> {lang}</p>
                <p style={{ margin: "0 0 4px", fontFamily: fonts.body, fontSize: 13, color: colors.forestGreen }}><strong>{isRTL ? "أرسلت بواسطة:" : "Submitted by:"}</strong> {data.createdBy}</p>
                <p style={{ margin: "0 0 4px", fontFamily: fonts.body, fontSize: 13, color: colors.forestGreen }}><strong>{isRTL ? "التاريخ:" : "Date:"}</strong> {data.createdDate}</p>
                <p style={{ margin: 0, fontFamily: fonts.body, fontSize: 13, color: colors.forestGreen }}><strong>{isRTL ? "التخصص:" : "Discipline:"}</strong> {data.atAGlance.discipline}</p>
              </div>

              {/* ✅ ADDED: Approval Notes Field */}
              <div style={{ marginBottom: 24 }}>
                <label style={{ fontFamily: fonts.label, fontSize: 11, letterSpacing: "0.06em", fontWeight: 600, color: colors.forestGreen, display: "block", marginBottom: 6 }}>
                  {isRTL ? "ملاحظات الموافقة (اختياري)" : "APPROVAL NOTES (Optional)"}
                </label>
                <textarea 
                  value={approveReason} 
                  onChange={(e) => setApproveReason(e.target.value)}
                  placeholder={isRTL ? "أضف أي ملاحظات حول هذه الموافقة..." : "Add any notes about this approval..."}
                  style={{ width: "100%", padding: 12, borderRadius: 8, border: `1px solid ${colors.forestGreen}`, fontFamily: fonts.body, fontSize: 13, color: colors.forestGreen, backgroundColor: colors.creamLight, outline: "none", resize: "vertical", minHeight: 80 }}
                />
              </div>
              
              <p style={{ fontFamily: fonts.body, fontSize: 14, color: colors.forestGreen, marginBottom: 24, lineHeight: 1.6 }}>
                {isRTL ? "سيتم نشر ملف العالم على البوابة. لا يمكن التراجع عن هذا الإجراء." : "This will publish the scholar to the portal. This action cannot be undone."}
                {Object.values(rejectedItems).flat().length > 0 && (
                  <span style={{ display: "block", marginTop: 12, color: colors.red, fontWeight: 600 }}>
                    {isRTL ? `ملاحظة: سيتم رفض ${Object.values(rejectedItems).flat().length} عنصر محدد.` : `Note: ${Object.values(rejectedItems).flat().length} specific item(s) will be rejected.`}
                  </span>
                )}
              </p>
              
              <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
                <button onClick={() => { setShowApproveConfirm(false); setApproveReason(""); }} style={{ padding: "10px 24px", borderRadius: 8, cursor: "pointer", border: `1px solid ${colors.forestGreen}`, backgroundColor: colors.creamLight, fontFamily: fonts.body, fontSize: 13, fontWeight: 600, color: colors.forestGreen }}>
                  {isRTL ? "إلغاء" : "Cancel"}
                </button>
                <button onClick={handleApprove} style={{ padding: "10px 24px", borderRadius: 8, cursor: "pointer", border: "none", backgroundColor: colors.forestGreen, color: colors.creamLight, fontFamily: fonts.body, fontSize: 13, fontWeight: 700 }}>
                  {isRTL ? "تأكيد الموافقة" : "Confirm Approval"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Reject Confirmation Modal ── */}
        {showRejectConfirm && (
          <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(11, 67, 53, 0.5)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }} onClick={() => { setShowRejectConfirm(false); setRejectReason(""); }}>
            <div style={{ ...cardStyle, backgroundColor: colors.creamLight, width: 500, maxWidth: "90vw", padding: 32, boxShadow: "0 20px 60px rgba(0,0,0,0.18)" }} onClick={(e) => e.stopPropagation()}>
              <div style={{ width: 56, height: 56, borderRadius: "50%", backgroundColor: colors.red, color: colors.creamLight, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20, border: `1px solid ${colors.red}` }}>
                <Icon name="cancel" size={28} filled />
              </div>
              <h2 style={{ fontFamily: fonts.headline, fontSize: 20, fontWeight: 700, color: colors.forestGreen, marginBottom: 16 }}>{isRTL ? "رفض العالم؟" : "Reject Scholar?"}</h2>
              
              <div style={{ backgroundColor: colors.creamMid, padding: 16, borderRadius: 8, marginBottom: 24 }}>
                <p style={{ margin: "0 0 8px", fontFamily: fonts.headline, fontSize: 16, fontWeight: 600, color: colors.forestGreen }}>{data.name[lang]}</p>
                <p style={{ margin: "0 0 4px", fontFamily: fonts.body, fontSize: 13, color: colors.forestGreen }}><strong>{isRTL ? "اللغة:" : "Language:"}</strong> {lang}</p>
                <p style={{ margin: "0 0 4px", fontFamily: fonts.body, fontSize: 13, color: colors.forestGreen }}><strong>{isRTL ? "أرسلت بواسطة:" : "Submitted by:"}</strong> {data.createdBy}</p>
                <p style={{ margin: "0 0 4px", fontFamily: fonts.body, fontSize: 13, color: colors.forestGreen }}><strong>{isRTL ? "التاريخ:" : "Date:"}</strong> {data.createdDate}</p>
                <p style={{ margin: 0, fontFamily: fonts.body, fontSize: 13, color: colors.forestGreen }}><strong>{isRTL ? "التخصص:" : "Discipline:"}</strong> {data.atAGlance.discipline}</p>
              </div>
              
              <div style={{ marginBottom: 24 }}>
                <label style={{ fontFamily: fonts.label, fontSize: 11, letterSpacing: "0.06em", fontWeight: 600, color: colors.forestGreen, display: "block", marginBottom: 6 }}>
                  {isRTL ? "سبب الرفض *" : "REJECTION REASON *"}
                </label>
                <textarea 
                  value={rejectReason} 
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder={isRTL ? "يرجى شرح سبب رفض هذا الطلب..." : "Please explain why this submission is being rejected..."}
                  style={{ width: "100%", padding: 12, borderRadius: 8, border: `1px solid ${colors.forestGreen}`, fontFamily: fonts.body, fontSize: 13, color: colors.forestGreen, backgroundColor: colors.creamLight, outline: "none", resize: "vertical", minHeight: 80 }}
                />
              </div>
              
              <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
                <button onClick={() => { setShowRejectConfirm(false); setRejectReason(""); }} style={{ padding: "10px 24px", borderRadius: 8, cursor: "pointer", border: `1px solid ${colors.forestGreen}`, backgroundColor: colors.creamLight, fontFamily: fonts.body, fontSize: 13, fontWeight: 600, color: colors.forestGreen }}>
                  {isRTL ? "إلغاء" : "Cancel"}
                </button>
                <button onClick={handleReject} style={{ padding: "10px 24px", borderRadius: 8, cursor: "pointer", border: "none", backgroundColor: colors.red, color: colors.creamLight, fontFamily: fonts.body, fontSize: 13, fontWeight: 700 }}>
                  {isRTL ? "تأكيد الرفض" : "Confirm Rejection"}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}