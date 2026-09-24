import React, { useState, useRef, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useLang } from "../../context/LanguageContext"; 
import { useAuth } from "../../context/AuthContext";
import { scholarsApi } from "../../api/scholarsApi";
import BiographyRenderer from "../../components/BiographyRenderer";

/* ─────────────────────────────────────────────
   BACKEND TYPES (Matches your Prisma JSON)
───────────────────────────────────────────── */
interface BackendAlias { alias_id: number; alias_name: string; }
interface BackendLanguage { language_id: number; code: string; name: string; }
interface BackendRegion { 
  region_id: number; 
  name: string; 
  translations?: Record<string, string>; // ✅ Added to match backend response
}
interface BackendScholarDate {
  date_id: number; version_id: number;
  date_type: "birth" | "death"; calendar: "hijri" | "gregorian";
  year: number | null; is_approximate?: boolean; raw_text?: string | null;
}
interface BackendMedia {
  media_id: number; version_id: number;
  file_name: string; file_path: string | null; media_url: string | null;
  source_type: string; file_type: string;
  status: string; uploaded_by: number | null; uploaded_at: string;
  view_count: number; like_count: number;
  title: string; year: number | null; description: string | null;
  users?: { id: number; username: string } | null;
}
interface BackendWork {
  work_id: number; version_id: number; title: string; year: number | null;
  format: string; description: string | null;
  media_url: string | null; file_name: string | null; file_path: string | null;
  source_type: string | null; status: string;
  created_by?: number | null;
  users?: { id: number; username: string } | null;
}
interface BackendVersion {  version_id: number; scholar_id: number; language_id: number;
  canonical_name: string;
  region_id: number | null;
  century_hijri_start: number | null; century_hijri_end: number | null;
  century_gregorian_start: number | null; century_gregorian_end: number | null;
  biography: string;
  image_url: string | null; image_status: string | null;
  status: string; created_by: number | null; created_at: string;
  version_type: "creation" | "edition";
  languages: BackendLanguage;
  regions?: BackendRegion | null;
  scholar_aliases: BackendAlias[];
  scholar_dates?: BackendScholarDate[];
  media?: BackendMedia[];
  scholar_disciplines?: { 
    discipline_id: number; 
    disciplines: { 
      discipline_id: number; 
      name: string; 
      language_id: number;
      translations?: Record<string, string>; // ✅ Added to match backend response
    } 
  }[];
  scholar_relationships_as_source?: BackendRelation[];
}
interface BackendRelation {
  relation_id: number;
  relation_type: string;
  related_scholar_version: {
    scholar_id: number;
    version_id: number;
    canonical_name: string;
    languages: { code: string };
  };
}
interface BackendReference { reference_id: number; title: string; citation: string; url: string | null; }
interface BackendHistory {
  version_id: number; status: string; created_at: string;
  users: { id: number; username: string } | null;
}

interface BackendScholarResponse {
  success: boolean;
  data: {
    scholar_id: number; created_by: number | null; created_at: string;
    scholar_versions: BackendVersion[];
    bibliography: BackendBibliography[];
    works: BackendWork[];
    scholar_contributors: { users: { id: number; username: string } }[];
    scholar_relationships_as_source: BackendRelation[];
    references: BackendReference[];
    history: BackendHistory[];
    available_languages: BackendLanguage[];
  };
}
interface BackendBibliography { bibliography_id: number; title: string; citation: string; url: string | null; }

/* ─────────────────────────────────────────────
   UI TYPES
───────────────────────────────────────────── */
type Language = string;
type TabId = "works" | "media" | "relations" | "more";

interface Contributor { name: string; contributions: number; profileUrl?: string; }
interface Work {
  work_id?: number;
  title: string; year: number; format: "BOOK" | "ARTICLE" | "TREATISE" | "MANUSCRIPT" | "LECTURE" | "SERMON" | "FATWA" | "POEM" | "LETTER" | "COMMENTARY" | "TRANSLATION" | "RESEARCH" | "COURSE" | "DEVICE" | "INVENTION" | "SOFTWARE" | "MAP" | "OTHER";
  digitalAccess?: "pdf" | "audio" | "file" | null;
  accessUrl?: string; accessFileName?: string; accessSource?: "upload" | "link";
  uploadedBy?: string; uploadedByUrl?: string;
}
interface MediaItem {
   media_id?: number;
  type: "pdf" | "audio" | "video"; title: string; description: string;
  viewCount: number; likeCount: number; isLikedByUser?: boolean; 
  action: string; actionIcon: string;
  accessUrl?: string; accessSource?: "upload" | "link"; accessFileName?: string;
  uploadedBy?: string; uploadedByUrl?: string;
}
interface RelatedPerson {
  initials: string; color: string; textColor: string; name: string; role: string; profileUrl?: string;
}
interface RelatedScholar { labelColor: string; label: string; name: string; description: string; }
interface Reference { 
  title: string; citation: string; url: string | null;
}
interface RecentRevision { date: string; author: string; action: string; authorUrl?: string; }
interface RevisionEntry { author: string; date: string; description: string; isPrimary: boolean; }

/* ─────────────────────────────────────────────
   DATE / CENTURY HELPERS
───────────────────────────────────────────── */
function formatDate(dates: BackendScholarDate[] | undefined, type: "birth" | "death"): string {
  if (!dates || dates.length === 0) return "";
  const greg = dates.find((d) => d.date_type === type && d.calendar === "gregorian");
  const hijri = dates.find((d) => d.date_type === type && d.calendar === "hijri");
  const gregLabel = greg?.raw_text || (greg?.year != null ? `${greg.year}${greg.is_approximate ? " (approx.)" : ""}` : "");
  const hijriLabel = hijri?.raw_text || (hijri?.year != null ? `${hijri.year} AH` : "");
  return [gregLabel, hijriLabel].filter(Boolean).join(" / ");
}

function formatCentury(start: number | null | undefined, end: number | null | undefined): string {
  if (!start && !end) return "";
  if (start && end && start !== end) return `${start}th–${end}th century`;
  const c = start || end;
  return c ? `${c}th century` : "";
}

/* ─────────────────────────────────────────────
   DATA TRANSFORMER (Backend -> UI)
───────────────────────────────────────────── */
const transformBackendToUI = (data: BackendScholarResponse["data"], lang: Language, currentUserId?: number, t?: (key: string) => string): any => {
  const unknown = t ? t('scholar.unknown') : "Unknown";
  const versions = data.scholar_versions || [];
  
  // ✅ 1. Build a dynamic map of ALL available languages from the backend
  const langMap: Record<string, BackendVersion> = {};
  versions.forEach((v) => {
    if (v.languages?.code) {
      langMap[v.languages.code.toUpperCase()] = v;
    }
  });

  // ✅ 2. Get the active version for the requested language, fallback to the first available
  const activeVersion = langMap[lang.toUpperCase()] || versions[0];

  // ✅ 3. Dynamically build name, subtitle, and biography objects for ALL languages
  const nameObj: Record<string, string> = {};
  const subtitleObj: Record<string, string | undefined> = {};
  const biographyObj: Record<string, string> = {};

  Object.keys(langMap).forEach((code) => {
    const v = langMap[code];
    nameObj[code] = v.canonical_name || "";
    subtitleObj[code] = v.scholar_aliases?.length ? v.scholar_aliases.map((a) => a.alias_name).join(" • ") : undefined;
    biographyObj[code] = v.biography || "";
  });

  const history = data.history || [];
  const creator = history.length > 0 ? (history[history.length - 1].users?.username ?? unknown) : unknown;
  const creatorId = history.length > 0 ? (history[history.length - 1].users?.id ?? 0) : 0;
  const lastUpdater = history.length > 0 ? (history[0].users?.username ?? creator) : creator;
  const lastUpdaterId = history.length > 0 ? (history[0].users?.id ?? creatorId) : creatorId;
  const hasBeenEdited = lastUpdater !== creator || history.length > 1;

  const disciplines = (activeVersion?.scholar_disciplines || [])
    .map((d: any) => {
      const trans = d.disciplines?.translations;
      return trans?.[lang.toLowerCase()] || trans?.["en"] || d.disciplines?.name || "";
    })
    .filter(Boolean)
    .join(", ");

  const mapRelations = (rels: any[], color1: string, color2: string) => rels.map((r, i) => {
    const target = r.related_scholar_version;
    const name = target?.canonical_name || `${unknown} #${target?.scholar_id}`;
    return {
      initials: name.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase(),
      color: i % 2 === 0 ? color1 : color2, textColor: "#fff", name,
      role: (r.relation_type || "Related").replace("_", " ").toUpperCase(),
      profileUrl: `/scholars/${target?.scholar_id}`
    };
  });

  const getAccessType = (filename: string): Work["digitalAccess"] => {
    const ext = filename.split(".").pop()?.toLowerCase() ?? "";
    if (["mp3", "wav", "ogg", "m4a"].includes(ext)) return "audio";
    if (["mp4", "webm", "avi", "mov"].includes(ext)) return "file";
    return "pdf";
  };

  const WORK_FORMATS: Work["format"][] = ["BOOK", "ARTICLE", "TREATISE", "MANUSCRIPT", "LECTURE", "SERMON", "FATWA", "POEM", "LETTER", "COMMENTARY", "TRANSLATION", "RESEARCH", "COURSE", "DEVICE", "INVENTION", "SOFTWARE", "MAP", "OTHER"];

  return {
    id: data.scholar_id,
    versionId: activeVersion?.version_id || versions[0]?.version_id || 0,
    name: nameObj, // ✅ Now dynamic
    subtitle: subtitleObj, // ✅ Now dynamic
    createdBy: creator, createdByUrl: `/profile/${creatorId}`, createdDate: new Date(data.created_at).toLocaleDateString(),
    lastUpdatedBy: hasBeenEdited ? lastUpdater : undefined,
    lastUpdatedByUrl: hasBeenEdited ? `/profile/${lastUpdaterId}` : undefined,
    lastUpdatedDate: hasBeenEdited ? new Date(history[0].created_at).toLocaleDateString() : undefined,
    image: activeVersion?.image_url || versions[0]?.image_url || "",
    biography: biographyObj, // ✅ Now dynamic
    atAGlance: {
      fullName: activeVersion?.canonical_name || "",
      born: formatDate(activeVersion?.scholar_dates, "birth"),
      died: formatDate(activeVersion?.scholar_dates, "death"),
      century: formatCentury(activeVersion?.century_gregorian_start, activeVersion?.century_gregorian_end),
      region: activeVersion?.regions?.translations?.[lang.toLowerCase()] || activeVersion?.regions?.translations?.["en"] || activeVersion?.regions?.name || "",
      discipline: disciplines || ""
    },
    contributors: (data.scholar_contributors || []).map((c) => ({ name: c.users?.username || unknown, contributions: 1, profileUrl: `/profile/${c.users?.id}` })),
    
    // ✅ FIX: Check root works, active version works, AND bibliography
    works: (data.works || activeVersion?.scholar_works || data.bibliography || []).map((w: any): Work => {
      const url: string | null = w.media_url || w.file_path || w.url || null;
      const format: Work["format"] = (WORK_FORMATS.includes(w.format) ? w.format : "OTHER");
      return {
        work_id: w.work_id,
        title: w.title, 
        year: w.year || 0, 
        format,
        digitalAccess: url ? getAccessType(url) : null,
        accessUrl: url || undefined,
        accessSource: url ? (w.source_type === "upload" ? "upload" : "link") : undefined,
        accessFileName: w.file_name || undefined,
        uploadedBy: w.users?.username,
        uploadedByUrl: w.users?.id ? `/profile/${w.users.id}` : undefined,
      };
    }),
    media: versions.flatMap((v) => v.media || []).map((m): MediaItem => {
      const fileType = (m.file_type || "pdf") as MediaItem["type"];
      const isLiked = currentUserId ? (m as any).media_likes?.some((like: any) => like.user_id === currentUserId) : false;

      return {
        media_id: m.media_id,
        type: fileType,
        title: m.title && m.title.trim() !== "" ? m.title : (m.file_name || "Untitled Media"),
        description: m.description || `${(m.file_type || "pdf").toUpperCase()} file`,
        viewCount: m.view_count || 0,
        likeCount: m.like_count || 0,
        isLikedByUser: isLiked,
        action: m.source_type === "upload" ? "DOWNLOAD FILE" : "OPEN LINK",
        actionIcon: m.source_type === "upload" ? "download" : "open_in_new",
        accessUrl: m.media_url || m.file_path || undefined,
        accessSource: m.source_type === "upload" ? "upload" : "link",
        accessFileName: m.file_name || undefined, 
        uploadedBy: m.users?.username,
        uploadedByUrl: m.users?.id ? `/profile/${m.users.id}` : undefined,
      };
    }),
    intellectualLineage: mapRelations((activeVersion?.scholar_relationships_as_source || []).filter((r: any) => r.relation_type === 'teacher' || r.relation_type === 'historical_influence'), "#1e4d3a", "#C9A84C"),
    notableDisciples: mapRelations((activeVersion?.scholar_relationships_as_source || []).filter((r: any) => r.relation_type === 'student' || r.relation_type === 'disciple'), "#C9A84C", "#1e4d3a"),
    relatedScholars: [],
    // ✅ FIX: Check root references AND active version references
    academicReferences: (data.references || activeVersion?.scholar_references || []).map((r: any) => ({ 
      title: r.title || "Unknown Title", 
      citation: r.citation || "", 
      url: r.url || null 
    })),
    revisionHistory: [],
    recentRevisions: history.map((h) => ({ date: new Date(h.created_at).toLocaleDateString(), author: h.users?.username || unknown, action: `Version ${h.version_id} - ${h.status}`, authorUrl: `/profile/${h.users?.id}` })),
  };
};

/* ─────────────────────────────────────────────
   RESPONSIVE HELPER
───────────────────────────────────────────── */
function useIsMobile(breakpoint = 768): boolean {
  const [isMobile, setIsMobile] = useState<boolean>(() =>
    typeof window !== "undefined" ? window.innerWidth <= breakpoint : false
  );
  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleResize = () => setIsMobile(window.innerWidth <= breakpoint);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [breakpoint]);
  return isMobile;
}

/* ─────────────────────────────────────────────
   SHARED STYLE CONSTANTS & SMALL COMPONENTS
───────────────────────────────────────────── */
const MONO: React.CSSProperties = { fontFamily: "'JetBrains Mono', monospace" };
const SERIF: React.CSSProperties = { fontFamily: "'Amiri', serif" };
const SANS: React.CSSProperties = { fontFamily: "'Inter', sans-serif" };
const HEADING: React.CSSProperties = { fontFamily: "'Hanken Grotesk', sans-serif" };

function Icon({ name, size = 20, style }: { name: string; size?: number; style?: React.CSSProperties }) {
  return <span className="material-symbols-outlined" style={{ fontSize: `${size}px`, lineHeight: 1, userSelect: "none", ...style }}>{name}</span>;
}

function ProfileLink({ name, url, color = "#1e4d3a" }: { name: string; url: string; color?: string }) {
  const [hover, setHover] = useState(false);
  return (
    <a href={url} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{ color: hover ? "#C9A84C" : color, fontWeight: 600, textDecoration: hover ? "underline" : "none", textUnderlineOffset: "2px", transition: "color 0.2s ease", cursor: "pointer" }}>
      {name}
    </a>
  );
}

function HoverBtn({ children, onClick, style }: { children: React.ReactNode; onClick?: () => void; style?: React.CSSProperties }) {
  const [hov, setHov] = useState(false);
  return (
    <button onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ 
        display: "inline-flex", alignItems: "center", gap: "8px", padding: "10px 20px",
        border: "2px solid #1e4d3a", borderRadius: "8px", 
        backgroundColor: hov ? "#fbf9f4" : "#1e4d3a", 
        color: hov ? "#1e4d3a" : "#fff",
        fontFamily: "'Hanken Grotesk', sans-serif", fontSize: "12px", fontWeight: 700, letterSpacing: "0.05em", cursor: "pointer", 
        boxShadow: hov ? "none" : "0 2px 10px rgba(30,77,58,0.18)",
        transition: "all 0.3s ease", ...style 
      }}>
      {children}
    </button>
  );
}

function EmptyLangState({ langName, t, onContribute }: { langName: string; t: (key: string) => string; onContribute: () => void }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "16px", padding: "64px 32px", textAlign: "center", border: "2px dashed rgba(30,77,58,0.25)", borderRadius: "16px", margin: "32px 0", backgroundColor: "#F5F3EC" }}>
      <Icon name="translate" size={40} style={{ color: "#1e4d3a66" }} />
      <p style={{ color: "#1e4d3a99", fontSize: "15px", lineHeight: 1.6, ...SANS }}>{t('scholar.noContent')} <strong style={{ color: "#1e4d3a" }}>{langName}</strong>.</p>
      <button onClick={onContribute} style={{ background: "none", border: "none", padding: 0, color: "#1e4d3a", fontWeight: 700, fontSize: "13px", textDecoration: "underline", textUnderlineOffset: "3px", cursor: "pointer", transition: "color 0.2s ease" }} onMouseEnter={(e) => (e.currentTarget.style.color = "#C9A84C")} onMouseLeave={(e) => (e.currentTarget.style.color = "#1e4d3a")}>{t('scholar.contribute')}</button>
    </div>
  );
}

/* ─────────────────────────────────────────────
   MODERN TOAST NOTIFICATION
───────────────────────────────────────────── */
interface ToastProps {
  message: string;
  type: "success" | "error";
  onClose: () => void;
}

function Toast({ message, type, onClose }: ToastProps) {
  const isMobile = useIsMobile();
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div style={{
      position: "fixed",
      bottom: isMobile ? "84px" : "24px",
      right: isMobile ? "12px" : "24px",
      left: isMobile ? "12px" : "auto",
      backgroundColor: type === "success" ? "#1e4d3a" : "#b23b3b",
      color: "#fff",
      padding: "12px 20px",
      borderRadius: "8px",
      boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
      display: "flex",
      alignItems: "center",
      gap: "10px",
      zIndex: 1000,
      animation: "slideUp 0.3s ease-out",
      minWidth: "250px",
      maxWidth: "400px"
    }}>
      <Icon name={type === "success" ? "check_circle" : "error"} size={20} />
      <span style={{ fontSize: "13px", fontWeight: 500, flex: 1, ...SANS }}>{message}</span>
      <button 
        onClick={onClose} 
        style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", padding: "4px", display: "flex", alignItems: "center" }}
      >
        <Icon name="close" size={16} />
      </button>
      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

/* ─────────────────────────────────────────────
   TAB EMPTY STATE COMPONENT
───────────────────────────────────────────── */
function TabEmptyState({ 
  icon, message, actionLabel, onAction, canAct, isRTL 
}: { 
  icon: string; message: string; actionLabel?: string; onAction?: () => void; canAct?: boolean; isRTL: boolean 
}) {
  return (
    <div style={{ 
      padding: "64px 32px", textAlign: "center", 
      backgroundColor: "#F5F3EC", borderRadius: "16px", 
      border: "1px dashed rgba(30,77,58,0.25)",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "16px",
      marginTop: "8px"
    }}>
      <Icon name={icon} size={40} style={{ color: "#1e4d3a66" }} />
      <p style={{ color: "#1e4d3a99", fontSize: "14px", margin: 0, lineHeight: 1.6, ...SANS }}>{message}</p>
      {canAct && actionLabel && onAction && (
        <button 
          onClick={onAction} 
          style={{ 
            background: "none", border: "none", padding: 0, 
            color: "#1e4d3a", fontWeight: 700, fontSize: "13px", 
            textDecoration: "underline", textUnderlineOffset: "3px", 
            cursor: "pointer", transition: "color 0.2s ease", ...MONO, letterSpacing: "0.05em"
          }} 
          onMouseEnter={(e) => (e.currentTarget.style.color = "#C9A84C")} 
          onMouseLeave={(e) => (e.currentTarget.style.color = "#1e4d3a")}
        >
          {actionLabel} {isRTL ? "←" : "→"}
        </button>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   FILE UTILS & MODALS
───────────────────────────────────────────── */
function getFileIcon(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  if (["mp3", "wav", "ogg", "m4a"].includes(ext)) return "graphic_eq";
  if (["mp4", "webm", "avi", "mov"].includes(ext)) return "movie";
  if (["epub"].includes(ext)) return "menu_book";
  if (["doc", "docx"].includes(ext)) return "description";
  return "article";
}

interface UploadZoneProps { file: File | null; onFile: (f: File) => void; onRemove: () => void; accept?: string; hint?: string; }
function UploadZone({ file, onFile, onRemove, accept, hint }: UploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const handleDrop = (e: React.DragEvent) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files?.[0]; if (f) onFile(f); };
  if (file) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", backgroundColor: "rgba(30,77,58,0.05)", border: "1.5px solid rgba(30,77,58,0.25)", borderRadius: "8px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
          <Icon name={getFileIcon(file.name)} size={20} />
          <span style={{ fontSize: "13px", color: "#1e4d3a", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", ...SANS }}>{file.name}</span>
          <span style={{ ...MONO, fontSize: "9px", color: "#1e4d3a66", whiteSpace: "nowrap" }}>{(file.size / 1024 / 1024).toFixed(1)} MB</span>
        </div>
        <button onClick={onRemove} style={{ background: "none", border: "none", cursor: "pointer", color: "#1e4d3a66", flexShrink: 0, display: "flex", alignItems: "center" }} title="Remove file"><Icon name="close" size={16} /></button>
      </div>
    );
  }
  return (
    <>
      <input ref={inputRef} type="file" accept={accept} style={{ display: "none" }} onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); }} />
      <div onClick={() => inputRef.current?.click()} onDragOver={(e) => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)} onDrop={handleDrop}
        style={{ border: `2px dashed ${dragOver ? "#1e4d3a" : "rgba(30,77,58,0.25)"}`, borderRadius: "10px", padding: "28px 20px", textAlign: "center", cursor: "pointer", backgroundColor: dragOver ? "rgba(30,77,58,0.05)" : "#F5F3EC", transition: "all 0.2s ease" }}>
        <Icon name="cloud_upload" size={32} style={{ color: dragOver ? "#1e4d3a" : "#1e4d3a66" }} />
        <p style={{ fontSize: "13px", color: "#1e4d3acc", margin: "10px 0 4px", fontWeight: 600, ...SANS }}>Drop a file here, or <span style={{ color: "#1e4d3a", textDecoration: "underline" }}>browse</span></p>
        <p style={{ ...MONO, fontSize: "9px", color: "#1e4d3a66", margin: 0 }}>{hint ?? "PDF, Audio, Video, ePub, Word — up to 100 MB"}</p>
      </div>
    </>
  );
}

type AccessMode = "none" | "upload" | "link";

/* ────────────────────────────────────────────
   WORK ACTIONS (View & Download Icons for Table)
───────────────────────────────────────────── */
function WorkActions({ work, t }: { work: Work; t: (key: string) => string }) {
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
      if (!response.ok) throw new Error('Network response was not ok');
      const blob = await response.blob();
      
      const blobUrl = window.URL.createObjectURL(blob);
      const filename = work.accessFileName || `${work.title}.pdf`;
      
      const link = document.createElement('a');
      link.href = blobUrl;
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
    return <span style={{ fontSize: "13px", color: "#1e4d3a66", fontWeight: 400, ...SANS }}>—</span>;
  }

  return (
    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
      <button 
        onClick={handleView}
        disabled={isViewing}
        title={t('scholar.view')}
        style={{ 
          display: "flex", alignItems: "center", justifyContent: "center",
          width: "32px", height: "32px", borderRadius: "6px",
          border: "1.5px solid #1e4d3a", backgroundColor: "transparent", color: "#1e4d3a",
          cursor: isViewing ? "wait" : "pointer", transition: "all 0.2s ease"
        }}
        onMouseEnter={(e) => { if (!isViewing) e.currentTarget.style.backgroundColor = "rgba(30,77,58,0.05)"; }}
        onMouseLeave={(e) => { if (!isViewing) e.currentTarget.style.backgroundColor = "transparent"; }}
      >
        {isViewing ? <Icon name="hourglass_empty" size={16} /> : <Icon name="visibility" size={18} />}
      </button>

      <button 
        onClick={handleDownload}
        disabled={isDownloading}
        title={t('scholar.download')}
        style={{ 
          display: "flex", alignItems: "center", justifyContent: "center",
          width: "32px", height: "32px", borderRadius: "6px",
          border: "1.5px solid #1e4d3a", backgroundColor: isDownloading ? "#1e4d3a" : "transparent", color: isDownloading ? "#fff" : "#1e4d3a",
          cursor: isDownloading ? "wait" : "pointer", transition: "all 0.2s ease"
        }}
        onMouseEnter={(e) => { if (!isDownloading) { e.currentTarget.style.backgroundColor = "#1e4d3a"; e.currentTarget.style.color = "#fff"; } }}
        onMouseLeave={(e) => { if (!isDownloading) { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = "#1e4d3a"; } }}
      >
        {isDownloading ? <Icon name="hourglass_empty" size={16} /> : <Icon name="download" size={18} />}
      </button>
    </div>
  );
}

/* ─────────────────────────────────────────────
   ADD WORK MODAL
───────────────────────────────────────────── */
interface AddWorkModalProps { 
  onClose: () => void; 
  onAdd: (work: Work) => void; 
  t: (key: string) => string; 
  lang: Language;
  versionId: number;
  onSuccess: (message: string) => void;
}

function AddWorkModal({ onClose, onAdd, t, lang, versionId, onSuccess }: AddWorkModalProps) {
  const isMobile = useIsMobile();
  const [title, setTitle] = useState(""); 
  const [year, setYear] = useState<string>(""); 
  const [format, setFormat] = useState<Work["format"]>("BOOK");
  const [accessMode, setAccessMode] = useState<AccessMode>("none"); 
  const [linkUrl, setLinkUrl] = useState("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null); 
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const inputStyle: React.CSSProperties = { width: "100%", padding: "10px 14px", border: "1.5px solid rgba(30,77,58,0.25)", borderRadius: "8px", fontSize: "13px", color: "#1e4d3a", backgroundColor: "#fff", fontFamily: "'Inter', sans-serif", outline: "none", transition: "border-color 0.2s ease" };
  const labelStyle: React.CSSProperties = { ...MONO, fontSize: "10px", color: "#1e4d3a66", letterSpacing: "0.1em", display: "block", marginBottom: "6px", fontWeight: 600 };
  const modeTabStyle = (active: boolean): React.CSSProperties => ({ flex: 1, padding: "9px 0", textAlign: "center" as const, ...MONO, fontSize: "10px", fontWeight: 700, letterSpacing: "0.08em", borderTop: "1.5px solid", borderBottom: "1.5px solid", borderColor: active ? "#1e4d3a" : "rgba(30,77,58,0.25)", backgroundColor: active ? "#1e4d3a" : "transparent", color: active ? "#fff" : "#1e4d3a99", cursor: "pointer", transition: "all 0.2s ease", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" });
  
  const handleSubmit = async () => {
    if (!title.trim()) { setError(t('scholar.titleRequired')); return; }
    const yr = parseInt(year, 10);
    if (!year || isNaN(yr) || yr < 600 || yr > new Date().getFullYear()) { setError(t('scholar.validYear')); return; }
    if (accessMode === "link" && !linkUrl.trim()) { setError(t('scholar.urlRequired')); return; }
    if (accessMode === "upload" && !uploadedFile) { setError(t('scholar.fileRequired')); return; }

    setIsSubmitting(true);
    setError("");

    try {
      if (accessMode === "upload" && uploadedFile) {
        const MAX_FILE_SIZE_MB = 100;
        const fileSizeInMB = uploadedFile.size / (1024 * 1024);
        if (fileSizeInMB > MAX_FILE_SIZE_MB) {
          setError(`${t('scholar.fileTooLarge')} (${fileSizeInMB.toFixed(1)} MB).`);
          setIsSubmitting(false);
          return;
        }

        const formData = new FormData();
        formData.append("file", uploadedFile);
        formData.append("version_id", versionId.toString());
        formData.append("title", title.trim());
        formData.append("year", year.toString());
        formData.append("format", format);
        
        await scholarsApi.addWork(versionId, formData);
        onSuccess(t('scholar.workAddedSuccess'));
        onClose();

      } else if (accessMode === "link") {
        const workData = {
          version_id: versionId,
          title: title.trim(),
          year: parseInt(year, 10),
          format,
          media_url: linkUrl.trim(),
        };
        await scholarsApi.addWorkUrl(versionId, workData);
        onSuccess(t('scholar.workAddedSuccess'));
        onClose();

      } else if (accessMode === "none") {
        const workData = {
          version_id: versionId,
          title: title.trim(),
          year: parseInt(year, 10),
          format,
        };
        await scholarsApi.addWorkUrl(versionId, workData);
        onSuccess(t('scholar.workAddedSuccess'));
        onClose();
      }
    } catch (err: any) {
      console.error("Failed to add work:", err);
      setError(err.message || "Failed to add work. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };
 
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, backgroundColor: "rgba(30,77,58,0.4)", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ backgroundColor: "#fff", borderRadius: "16px", padding: isMobile ? "24px 18px" : "36px", width: "520px", maxWidth: "calc(100vw - 32px)", boxShadow: "0 20px 60px rgba(30,77,58,0.14)", border: "1px solid rgba(30,77,58,0.12)", maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px" }}>
          <h2 style={{ fontFamily: "'Hanken Grotesk', sans-serif", fontSize: isMobile ? "17px" : "20px", fontWeight: 700, color: "#1e4d3a", margin: 0, display: "flex", alignItems: "center", gap: "10px" }}><Icon name="add_circle" size={20} /> {t('scholar.addNewWork')}</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#1e4d3a66", padding: "4px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }} onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#F5F3EC")} onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}><Icon name="close" size={20} /></button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div><label style={labelStyle}>{t('scholar.title')} *</label><input type="text" value={title} onChange={(e) => { setTitle(e.target.value); setError(""); }} placeholder={t('scholar.workTitlePlaceholder')} style={inputStyle} onFocus={(e) => (e.currentTarget.style.borderColor = "#1e4d3a")} onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(30,77,58,0.25)")} /></div>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "16px" }}>
            <div><label style={labelStyle}>{t('scholar.year')} *</label><input type="number" value={year} onChange={(e) => { setYear(e.target.value); setError(""); }} placeholder={t('scholar.yearPlaceholder')} min={600} max={new Date().getFullYear()} style={inputStyle} onFocus={(e) => (e.currentTarget.style.borderColor = "#1e4d3a")} onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(30,77,58,0.25)")} /></div>
            <div><label style={labelStyle}>{t('scholar.formatLabel')}</label><select value={format} onChange={(e) => setFormat(e.target.value as Work["format"])} style={{ ...inputStyle, cursor: "pointer" }} onFocus={(e) => (e.currentTarget.style.borderColor = "#1e4d3a")} onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(30,77,58,0.25)")}>{["BOOK", "ARTICLE", "TREATISE", "MANUSCRIPT", "LECTURE", "SERMON", "FATWA", "POEM", "LETTER", "COMMENTARY", "TRANSLATION", "RESEARCH", "COURSE", "DEVICE", "INVENTION", "SOFTWARE", "MAP", "OTHER"].map((f) => (<option key={f} value={f}>{t(`scholar.format.${f}`)}</option>))}</select></div>
          </div>
          <div>
            <label style={labelStyle}>{t('scholar.digitalAccess')}</label>
            <div style={{ display: "flex", borderRadius: "8px", overflow: "hidden", border: "1.5px solid rgba(30,77,58,0.25)", marginBottom: "16px" }}>
              <button style={modeTabStyle(accessMode === "none")} onClick={() => { setAccessMode("none"); setError(""); }}><Icon name="block" size={13} /> {t('scholar.none')}</button>
              <button style={{ ...modeTabStyle(accessMode === "upload"), borderLeft: "1px solid rgba(30,77,58,0.25)", borderRight: "1px solid rgba(30,77,58,0.25)" }} onClick={() => { setAccessMode("upload"); setError(""); }}><Icon name="upload_file" size={13} /> {t('scholar.uploadFile')}</button>
              <button style={modeTabStyle(accessMode === "link")} onClick={() => { setAccessMode("link"); setError(""); }}><Icon name="link" size={13} /> {t('scholar.pasteLink')}</button>
            </div>
            {accessMode === "upload" && <UploadZone file={uploadedFile} onFile={(f) => { setUploadedFile(f); setError(""); }} onRemove={() => setUploadedFile(null)} accept=".pdf,.mp3,.wav,.ogg,.m4a,.mp4,.webm,.epub,.doc,.docx,application/pdf,audio/*,video/*" hint="PDF, Audio, Video, ePub, Word — up to 100 MB" />}
            {accessMode === "link" && <div style={{ position: "relative" }}><span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#1e4d3a66", display: "flex", alignItems: "center" }}><Icon name="link" size={16} /></span><input type="url" value={linkUrl} onChange={(e) => { setLinkUrl(e.target.value); setError(""); }} placeholder={t('scholar.urlPlaceholder')} style={{ ...inputStyle, paddingLeft: "36px" }} onFocus={(e) => (e.currentTarget.style.borderColor = "#1e4d3a")} onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(30,77,58,0.25)")} /></div>}
            {accessMode === "none" && <p style={{ fontSize: "12px", color: "#1e4d3a66", fontStyle: "italic", margin: 0, ...SANS }}>{t('scholar.noFileAttached')}</p>}
          </div>
          {error && <p style={{ ...MONO, fontSize: "10px", color: "#b23b3b", margin: 0, display: "flex", alignItems: "center", gap: "6px" }}><Icon name="error" size={13} /> {error}</p>}
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "32px", paddingTop: "24px", borderTop: "1px solid rgba(30,77,58,0.12)" }}>
          <button onClick={onClose} style={{ 
            display: "inline-flex", alignItems: "center", gap: "8px", padding: "10px 20px",
            border: "2px solid rgba(30,77,58,0.25)", borderRadius: "8px", 
            backgroundColor: "transparent", color: "#1e4d3a",
            fontFamily: "'Hanken Grotesk', sans-serif", fontSize: "12px", fontWeight: 700, letterSpacing: "0.05em", cursor: "pointer", 
            transition: "all 0.3s ease"
          }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#F5F3EC"; e.currentTarget.style.color = "#1e4d3a"; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = "#1e4d3a"; }}>
            {t('scholar.cancel')}
          </button>
          <button 
            onClick={handleSubmit} 
            disabled={isSubmitting}
            style={{ 
              display: "inline-flex", alignItems: "center", gap: "8px", padding: "10px 20px",
              border: "2px solid #1e4d3a", borderRadius: "8px", 
              backgroundColor: isSubmitting ? "rgba(30,77,58,0.25)" : "#1e4d3a", 
              color: "#fff",
              fontFamily: "'Hanken Grotesk', sans-serif", fontSize: "12px", fontWeight: 700, letterSpacing: "0.05em", cursor: isSubmitting ? "not-allowed" : "pointer", 
              opacity: isSubmitting ? 0.7 : 1,
              transition: "all 0.3s ease"
            }} 
            onMouseEnter={(e) => { if (!isSubmitting) { e.currentTarget.style.backgroundColor = "#fbf9f4"; e.currentTarget.style.color = "#1e4d3a"; } }} 
            onMouseLeave={(e) => { if (!isSubmitting) { e.currentTarget.style.backgroundColor = "#1e4d3a"; e.currentTarget.style.color = "#fff"; } }}
          >
            {isSubmitting ? <Icon name="hourglass_empty" size={14} /> : <Icon name="check" size={14} />} 
            {isSubmitting ? t('scholar.saving') : t('scholar.addWorkBtn')}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   ADD MEDIA MODAL
───────────────────────────────────────────── */
interface AddMediaModalProps { 
  onClose: () => void; 
  onAdd: (item: MediaItem) => void;
  t: (key: string) => string; 
  versionId: number; 
  scholarId: number; 
  onSuccess: (message: string) => void; 
}

function AddMediaModal({ onClose, onAdd, t, versionId, scholarId, onSuccess }: AddMediaModalProps) {
  const isMobile = useIsMobile();
  const [title, setTitle] = useState(""); 
  const [year, setYear] = useState<string>("");
  const [desc, setDesc] = useState(""); 
  const [accessMode, setAccessMode] = useState<AccessMode>("upload");
  const [linkUrl, setLinkUrl] = useState(""); 
  const [uploadedFile, setUploadedFile] = useState<File | null>(null); 
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const inputStyle: React.CSSProperties = { width: "100%", padding: "10px 14px", border: "1.5px solid rgba(30,77,58,0.25)", borderRadius: "8px", fontSize: "13px", color: "#1e4d3a", backgroundColor: "#fff", fontFamily: "'Inter', sans-serif", outline: "none", transition: "border-color 0.2s ease" };
  const labelStyle: React.CSSProperties = { ...MONO, fontSize: "10px", color: "#1e4d3a66", letterSpacing: "0.1em", display: "block", marginBottom: "6px", fontWeight: 600 };
  const modeTabStyle = (active: boolean): React.CSSProperties => ({ flex: 1, padding: "9px 0", textAlign: "center" as const, ...MONO, fontSize: "10px", fontWeight: 700, letterSpacing: "0.08em", border: "1.5px solid", borderColor: active ? "#1e4d3a" : "rgba(30,77,58,0.25)", backgroundColor: active ? "#1e4d3a" : "transparent", color: active ? "#fff" : "#1e4d3a99", cursor: "pointer", transition: "all 0.2s ease", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" });

  const handleSubmit = async () => {
    if (!title.trim()) { setError(t('scholar.titleRequired')); return; }
    if (accessMode === "link" && !linkUrl.trim()) { setError(t('scholar.urlRequired')); return; }
    if (accessMode === "upload" && !uploadedFile) { setError(t('scholar.fileRequired')); return; }

    setIsSubmitting(true);
    setError("");

    const parsedYear = year.trim() ? parseInt(year, 10) : null;

    try {
      if (accessMode === "upload" && uploadedFile) {
        const formData = new FormData();
        formData.append("file", uploadedFile);
        formData.append("version_id", versionId.toString());
        formData.append("title", title.trim());
        formData.append("description", desc.trim());
        if (parsedYear !== null) formData.append("year", parsedYear.toString());

        await scholarsApi.addMedia(versionId, formData);
        onSuccess(t('scholar.mediaAddedSuccess'));
        onClose();

      } else if (accessMode === "link") {
        const mediaData: any = {
          version_id: versionId,
          title: title.trim(),
          description: desc.trim(),
          media_url: linkUrl.trim(),
        };
        if (parsedYear !== null) mediaData.year = parsedYear;

        await scholarsApi.addMediaUrl(versionId, mediaData);
        onSuccess(t('scholar.mediaAddedSuccess'));
        onClose();
      }
    } catch (err: any) {
      console.error("Failed to add media:", err);
      setError(err.message || "Failed to add media. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, backgroundColor: "rgba(30,77,58,0.4)", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ backgroundColor: "#fff", borderRadius: "16px", padding: isMobile ? "24px 18px" : "36px", width: "520px", maxWidth: "calc(100vw - 32px)", boxShadow: "0 20px 60px rgba(30,77,58,0.14)", border: "1px solid rgba(30,77,58,0.12)", maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px" }}>
          <h2 style={{ fontFamily: "'Hanken Grotesk', sans-serif", fontSize: isMobile ? "17px" : "20px", fontWeight: 700, color: "#1e4d3a", margin: 0, display: "flex", alignItems: "center", gap: "10px" }}><Icon name="add_circle" size={20} /> {t('scholar.addMediaModal')}</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#1e4d3a66", padding: "4px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }} onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#F5F3EC")} onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}><Icon name="close" size={20} /></button>
        </div>
        
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div><label style={labelStyle}>{t('scholar.title')} *</label><input type="text" value={title} onChange={(e) => { setTitle(e.target.value); setError(""); }} placeholder={t('scholar.mediaTitlePlaceholder')} style={inputStyle} onFocus={(e) => (e.currentTarget.style.borderColor = "#1e4d3a")} onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(30,77,58,0.25)")} /></div>
          <div><label style={labelStyle}>{t('scholar.year')}</label><input type="number" value={year} onChange={(e) => { setYear(e.target.value); setError(""); }} placeholder={t('scholar.yearPlaceholder')} min={600} max={new Date().getFullYear()} style={inputStyle} onFocus={(e) => (e.currentTarget.style.borderColor = "#1e4d3a")} onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(30,77,58,0.25)")} /></div>
          <div><label style={labelStyle}>{t('scholar.description')}</label><textarea value={desc} onChange={(e) => setDesc(e.target.value)} placeholder={t('scholar.descriptionPlaceholder')} rows={2} style={{ ...inputStyle, resize: "vertical", ...SANS }} onFocus={(e) => (e.currentTarget.style.borderColor = "#1e4d3a")} onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(30,77,58,0.25)")} /></div>
          <div>
            <label style={labelStyle}>{t('scholar.fileLink')}</label>
            <div style={{ display: "flex", borderRadius: "8px", overflow: "hidden", border: "1.5px solid rgba(30,77,58,0.25)", marginBottom: "16px" }}>
              <button style={modeTabStyle(accessMode === "upload")} onClick={() => { setAccessMode("upload"); setError(""); }}><Icon name="upload_file" size={13} /> {t('scholar.uploadFile')}</button>
              <button style={{ ...modeTabStyle(accessMode === "link"), borderLeft: "1px solid rgba(30,77,58,0.25)" }} onClick={() => { setAccessMode("link"); setError(""); }}><Icon name="link" size={13} /> {t('scholar.pasteLink')}</button>
            </div>
            {accessMode === "upload" && <UploadZone file={uploadedFile} onFile={(f) => { setUploadedFile(f); setError(""); }} onRemove={() => setUploadedFile(null)} accept=".pdf,.mp3,.wav,.ogg,.m4a,.mp4,.webm,.avi,audio/*,video/*,application/pdf" hint="PDF, Audio, Video — up to 100 MB" />}
            {accessMode === "link" && <div style={{ position: "relative" }}><span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#1e4d3a66", display: "flex", alignItems: "center" }}><Icon name="link" size={16} /></span><input type="url" value={linkUrl} onChange={(e) => { setLinkUrl(e.target.value); setError(""); }} placeholder={t('scholar.urlPlaceholder')} style={{ ...inputStyle, paddingLeft: "36px" }} onFocus={(e) => (e.currentTarget.style.borderColor = "#1e4d3a")} onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(30,77,58,0.25)")} /></div>}
            </div>
          {error && <p style={{ ...MONO, fontSize: "10px", color: "#b23b3b", margin: 0, display: "flex", alignItems: "center", gap: "6px" }}><Icon name="error" size={13} /> {error}</p>}
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "32px", paddingTop: "24px", borderTop: "1px solid rgba(30,77,58,0.12)" }}>
          <button onClick={onClose} style={{ 
            display: "inline-flex", alignItems: "center", gap: "8px", padding: "10px 20px",
            border: "2px solid rgba(30,77,58,0.25)", borderRadius: "8px", 
            backgroundColor: "transparent", color: "#1e4d3a",
            fontFamily: "'Hanken Grotesk', sans-serif", fontSize: "12px", fontWeight: 700, letterSpacing: "0.05em", cursor: "pointer", 
            transition: "all 0.3s ease"
          }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#F5F3EC"; e.currentTarget.style.color = "#1e4d3a"; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = "#1e4d3a"; }}>
            {t('scholar.cancel')}
          </button>
          <button 
            onClick={handleSubmit} 
            disabled={isSubmitting}
            style={{ 
              display: "inline-flex", alignItems: "center", gap: "8px", padding: "10px 20px",
              border: "2px solid #1e4d3a", borderRadius: "8px", 
              backgroundColor: isSubmitting ? "rgba(30,77,58,0.25)" : "#1e4d3a", 
              color: "#fff",
              fontFamily: "'Hanken Grotesk', sans-serif", fontSize: "12px", fontWeight: 700, letterSpacing: "0.05em", cursor: isSubmitting ? "not-allowed" : "pointer", 
              opacity: isSubmitting ? 0.7 : 1,
              transition: "all 0.3s ease"
            }} 
            onMouseEnter={(e) => { if (!isSubmitting) { e.currentTarget.style.backgroundColor = "#fbf9f4"; e.currentTarget.style.color = "#1e4d3a"; } }} 
            onMouseLeave={(e) => { if (!isSubmitting) { e.currentTarget.style.backgroundColor = "#1e4d3a"; e.currentTarget.style.color = "#fff"; } }}
          >
            {isSubmitting ? <Icon name="hourglass_empty" size={14} /> : <Icon name="check" size={14} />} 
            {isSubmitting ? t('scholar.uploading') : t('scholar.addMediaBtn')}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   MEDIA CARD
───────────────────────────────────────────── */
interface MediaCardProps { 
  item: MediaItem; 
  mediaIconName: (type: "pdf" | "audio" | "video") => string; 
  t: (key: string) => string;
}

function MediaCard({ item: m, mediaIconName, t }: MediaCardProps) {
  const [liked, setLiked] = useState(m.isLikedByUser || false);
  const [likeCount, setLikeCount] = useState(m.likeCount || 0);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isViewing, setIsViewing] = useState(false);

  const handleDownload = async (e: React.MouseEvent) => {
    if (m.accessSource !== "upload" || !m.accessUrl) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDownloading(true);
    try {
      const response = await fetch(m.accessUrl);
      if (!response.ok) throw new Error('Network response was not ok');
      const blob = await response.blob();
      
      const blobUrl = window.URL.createObjectURL(blob);
      const filename = m.accessFileName || `${m.title}.pdf`;
      
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Download failed:', error);
      window.open(m.accessUrl, '_blank');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleView = async (e: React.MouseEvent) => {
    if (!m.accessUrl) return;
    e.preventDefault();
    e.stopPropagation();
    setIsViewing(true);

    if (m.media_id) {
      scholarsApi.viewMedia(m.media_id).catch((err) => 
        console.error("View track failed:", err)
      );
    }

    try {
      const response = await fetch(m.accessUrl);
      const blob = await response.blob();
      const correctType = m.type === 'audio' ? 'audio/mpeg' : m.type === 'video' ? 'video/mp4' : 'application/pdf';
      const typedBlob = new Blob([blob], { type: correctType });
      const blobUrl = URL.createObjectURL(typedBlob);
      window.open(blobUrl, '_blank');
      setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
    } catch (error) {
      console.error('View failed:', error);
      window.open(m.accessUrl, '_blank');
    } finally {
      setIsViewing(false);
    }
  };

  return (
    <div className="card-hover" style={{ 
      backgroundColor: "#fff", 
      padding: "24px", 
      border: "1px solid rgba(30,77,58,0.1)", 
      borderRadius: "16px", 
      display: "flex", 
      flexDirection: "column", 
      cursor: "pointer" 
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
        <span className="material-symbols-outlined" style={{ fontSize: "32px", color: "#1e4d3a" }}>
          {mediaIconName(m.type)}
        </span>
      </div>
      
      <p style={{ fontSize: "14px", fontWeight: 700, color: "#1e4d3a", margin: "0 0 8px", fontFamily: "'Hanken Grotesk', sans-serif" }}>
        {m.title}
      </p>
      
      <p style={{ fontSize: "12px", color: "#1e4d3a99", lineHeight: 1.55, flex: 1, margin: "0 0 12px", ...SANS }}>
        {m.description}
      </p>
      
      {m.uploadedBy && (
        <p style={{ ...MONO, fontSize: "9px", color: "#1e4d3a66", letterSpacing: "0.04em", margin: "0 0 12px" }}>
          {t('scholar.addedBy')} <ProfileLink name={m.uploadedBy} url={m.uploadedByUrl ?? "#"} />
        </p>
      )}
      
      <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "14px" }}>
        <span style={{ display: "flex", alignItems: "center", gap: "4px", ...MONO, fontSize: "10px", color: "#1e4d3a99" }}>
          <Icon name="visibility" size={15} /> {m.viewCount}
        </span>
        <button
          onClick={async (e) => { 
            e.stopPropagation(); 
            if (!m.media_id) {
              console.error("Cannot like: media_id is missing");
              return;
            }
            try {
              const response = await scholarsApi.toggleMediaLike(m.media_id);
              setLiked(response.liked);
              setLikeCount(response.like_count); 
            } catch (err) {
              console.error("Failed to toggle like:", err);
            }
          }}
          title="Like"
          style={{ display: "flex", alignItems: "center", gap: "4px", background: "none", border: "none", cursor: "pointer", padding: 0, ...MONO, fontSize: "10px", color: liked ? "#C9A84C" : "#1e4d3a99", transition: "color 0.2s ease" }}
        >
          <Icon name={liked ? "favorite" : "favorite_border"} size={15} /> {likeCount}
        </button>
      </div>
      
      {m.accessUrl ? (
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          {m.accessSource === "upload" ? (
            <>
              <button 
                onClick={handleView}
                disabled={isViewing}
                className="action-link"
                style={{ 
                  backgroundColor: "transparent",
                  border: "1.5px solid #1e4d3a",
                  color: "#1e4d3a",
                  padding: "6px 14px",
                  borderRadius: "6px",
                  fontSize: "10px",
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  fontFamily: "'JetBrains Mono', monospace",
                  cursor: isViewing ? 'wait' : 'pointer',
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  opacity: isViewing ? 0.6 : 1,
                  transition: "all 0.2s ease"
                }}
                onMouseEnter={(e) => { if (!isViewing) e.currentTarget.style.backgroundColor = "rgba(30,77,58,0.05)"; }}
                onMouseLeave={(e) => { if (!isViewing) e.currentTarget.style.backgroundColor = "transparent"; }}
              >
                {isViewing ? (
                  <><Icon name="hourglass_empty" size={14} /> {t('scholar.loading')}</>
                ) : (
                  <><Icon name="visibility" size={14} /> {t('scholar.view')}</>
                )}
              </button>
              
              <button 
                onClick={handleDownload}
                disabled={isDownloading}
                className="action-link"
                style={{ 
                  backgroundColor: "#1e4d3a",
                  border: "1.5px solid #1e4d3a",
                  color: "#fff",
                  padding: "6px 14px",
                  borderRadius: "6px",
                  fontSize: "10px",
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  fontFamily: "'JetBrains Mono', monospace",
                  cursor: isDownloading ? 'wait' : 'pointer',
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  opacity: isDownloading ? 0.6 : 1,
                  transition: "all 0.2s ease"
                }}
                onMouseEnter={(e) => { if (!isDownloading) e.currentTarget.style.backgroundColor = "#163a2c"; }}
                onMouseLeave={(e) => { if (!isDownloading) e.currentTarget.style.backgroundColor = "#1e4d3a"; }}
              >
                {isDownloading ? (
                  <><Icon name="hourglass_empty" size={14} /> {t('scholar.downloading')}</>
                ) : (
                  <><Icon name="download" size={14} /> {t('scholar.download')}</>
                )}
              </button>
            </>
          ) : (
            <a href={m.accessUrl} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
              <button 
                className="action-link"
                style={{ 
                  backgroundColor: "#1e4d3a",
                  border: "1.5px solid #1e4d3a",
                  color: "#fff",
                  padding: "6px 14px",
                  borderRadius: "6px",
                  fontSize: "10px",
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  fontFamily: "'JetBrains Mono', monospace",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  transition: "all 0.2s ease"
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#163a2c"; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "#1e4d3a"; }}
              >
                {t('scholar.openLink')} <Icon name="open_in_new" size={14} />
              </button>
            </a>
          )}
        </div>
      ) : (
        <button className="action-link">
          {m.action} <Icon name={m.actionIcon} size={15} />
        </button>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────── */
const ScholarDetailPage: React.FC = () => {
  const navigate = useNavigate();
    // We rename 'lang' to 'siteLang' and 'setLang' to 'setGlobalLang' to avoid crashing with the local state variables below
  const { lang: siteLang, setLang: setGlobalLang, t, dbLanguages } = useLang(); 
  const { id: scholarIdStr } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const focusParam = searchParams.get("focus");
  const langParam = searchParams.get("lang");
  const tabParam = searchParams.get("tab");

  const scholarId = scholarIdStr ? parseInt(scholarIdStr, 10) : 1;
  
  // Safely determine the initial language: URL param > siteLang > "EN"
  const urlLang = langParam?.toUpperCase();
  const validLangs = dbLanguages.map(l => l.code.toUpperCase());
  
  const initialLang = (urlLang && validLangs.includes(urlLang)) 
    ? urlLang 
    : (validLangs.includes(siteLang) ? siteLang : "EN");

  const VALID_TABS: TabId[] = ["works", "media", "relations", "more"];
  const initialTab: TabId = (tabParam && VALID_TABS.includes(tabParam as TabId))
    ? (tabParam as TabId)
    : "works";

  const [lang, setLang] = useState<Language>(initialLang);
  const [activeTab, setActiveTab] = useState<TabId>(initialTab);
  const [contributorsOpen, setContributorsOpen] = useState(true);
  const [shareHov, setShareHov] = useState(false);
  const [linkHov, setLinkHov] = useState(false);
  const [showAddWork, setShowAddWork] = useState(false);
  const [showAddMedia, setShowAddMedia] = useState(false);
  const [showAllRevisions, setShowAllRevisions] = useState(false);
  const [showLangDropdown, setShowLangDropdown] = useState(false); // 👈 NEW
  const headerRef = useRef<HTMLDivElement>(null);
  const langDropdownRef = useRef<HTMLDivElement>(null); // 👈 NEW
  const [collapsed, setCollapsed] = useState(false);
  const isMobile = useIsMobile();
  const { user, loading: authLoading } = useAuth();
  const currentUserId = user?.id; 
  
  const canContribute = user && !user.is_banned && user.allowed_to_contribute !== false;
  
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const checkContributionPermission = (): boolean => {
    if (!user) {
      setToast({ message: t("scholar.loginFirst"), type: "error" });
      return false;
    }
    if (user.is_banned) {
      setToast({ message: t("scholar.accountBanned"), type: "error" });
      return false;
    }
    if (user.allowed_to_contribute === false) {
      setToast({ message: t("scholar.privilegesRevoked"), type: "error" });
      return false;
    }
    return true;
  };

  const [s, setS] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

    useEffect(() => {
    if (langParam) {
      const upperLang = langParam.toUpperCase();
      // ✅ Check against the dynamic list of languages from the database, NOT hardcoded EN/AR/FR
      const validLangs = dbLanguages.map(l => l.code.toUpperCase());
      if (validLangs.includes(upperLang)) {
        setLang(upperLang as Language);
      }
    }
  }, [langParam, dbLanguages]);

  // 👇 NEW: Closes the language dropdown when clicking outside of it
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (langDropdownRef.current && !langDropdownRef.current.contains(event.target as Node)) {
        setShowLangDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

   useEffect(() => {
    if (authLoading) return;

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // ✅ Just ONE request! The backend now safely returns the scholar 
        // with a fallback version if the requested language doesn't exist.
        const response = await scholarsApi.getById(scholarId, lang.toLowerCase());
        setS(transformBackendToUI(response.data, lang, currentUserId, t));
      } catch (err: any) {
        console.error("Failed to fetch scholar:", err);
        setError(t("scholar.notFound"));
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [scholarId, lang, langParam, authLoading, currentUserId, t]);

  useEffect(() => {
    if (!focusParam || !s) return;

    const targetTab = focusParam.startsWith("work-") ? "works" : "media";

    if (activeTab !== targetTab) {
      setActiveTab(targetTab);
      return; 
    }

    const timer = setTimeout(() => {
      const element = document.getElementById(focusParam);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
        element.classList.add("highlight-focus");
        setTimeout(() => {
          element.classList.remove("highlight-focus");
        }, 2500);
      }

      const newParams = new URLSearchParams(searchParams);
      newParams.delete("focus");
      setSearchParams(newParams, { replace: true });
    }, 800);

    return () => clearTimeout(timer);
  }, [activeTab, s, focusParam, searchParams, setSearchParams]);

  // ✅ SMART URL CORRECTION: Placed safely BEFORE any early returns!
  useEffect(() => {
    if (!s) return; 
    
    const hasAnyContent = Object.values(s.name || {}).some(n => n) || Object.values(s.biography || {}).some(b => b);
    if (!hasAnyContent) return;

    const requestedUpper = lang.toUpperCase();
    if (!s.name[requestedUpper]) {
      const firstAvailable = Object.keys(s.name).find(key => s.name[key])?.toLowerCase();
      if (firstAvailable && firstAvailable !== langParam?.toLowerCase()) {
        setSearchParams({ lang: firstAvailable, tab: activeTab }, { replace: true });
        setLang(firstAvailable.toUpperCase());
        setGlobalLang(firstAvailable);
      }
    }
  }, [s, lang, langParam, activeTab, setSearchParams, setGlobalLang]);

  if (isLoading) {
    return <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#fbf9f4" }}><Icon name="hourglass_empty" size={32} style={{ color: "#1e4d3a66" }} /></div>;
  }
  if (error) {
    return <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#fbf9f4", color: "#b23b3b", ...SANS }}>{error}</div>;
  }
  if (!s) return null;

  const isRTL = lang === "AR";
  
  // ✅ 1. Get ALL system languages
  const allSystemLangs = [...dbLanguages];

  // ✅ 2. Sort them: Put the languages that ACTUALLY EXIST for this scholar at the VERY TOP
  const sortedAllLangs = allSystemLangs.sort((a, b) => {
    const aExists = !!s.name[a.code.toUpperCase()];
    const bExists = !!s.name[b.code.toUpperCase()];
    
    if (aExists && !bExists) return -1; // 'a' is available, 'b' is not -> 'a' goes first
    if (!aExists && bExists) return 1;  // 'b' is available, 'a' is not -> 'b' goes first
    return 0; // Keep original order for the rest
  });

  // ✅ 3. Get the name of the current language for display
  const currentLangName = sortedAllLangs.find(l => l.code.toLowerCase() === lang.toLowerCase())?.name || lang;
  
  // ✅ Bulletproof fallback: Try requested lang, then try ANY available language
  const getName = (): string => s.name[lang.toUpperCase()] || Object.values(s.name).find(n => n) || t('scholar.unknown');
  const getSubtitle = (): string | undefined => s.subtitle[lang.toUpperCase()] || Object.values(s.subtitle).find(n => n);
  const getBiography = (): string => s.biography[lang.toUpperCase()] || Object.values(s.biography).find(b => b) || "";

  const hasAnyContent = Object.values(s.name || {}).some(n => n) || Object.values(s.biography || {}).some(b => b);
  const hasLangContent = !!(s.name[lang.toUpperCase()] || s.biography[lang.toUpperCase()]);
  const hasBeenEdited = !!(s.lastUpdatedBy && s.lastUpdatedBy !== s.createdBy);

  const tabIds: TabId[] = ["works", "media", "relations", "more"];
  const homeLabel = t('scholar.home');
  const scholarsLabel = t('scholar.scholars');
  const mediaIconName = (type: "pdf" | "audio" | "video"): string => ({ pdf: "article", audio: "mic", video: "movie" }[type]);
  const iconBtnStyle = (hov: boolean): React.CSSProperties => ({ width: "36px", height: "36px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: hov ? "#F5F3EC" : "transparent", color: "#1e4d3a99", border: "none", cursor: "pointer", transition: "background 0.2s ease" });

  return (
    <div dir={isRTL ? "rtl" : "ltr"} style={{ fontFamily: "'Inter', sans-serif", minHeight: "100vh", backgroundColor: "#fbf9f4", backgroundImage: "radial-gradient(rgba(30,77,58,0.03) 0.5px, transparent 0.5px)", backgroundSize: "24px 24px", color: "#1e4d3a" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;700&family=Amiri:wght@400;700&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap');
        .material-symbols-outlined { font-variation-settings: 'FILL' 0,'wght' 400,'GRAD' 0,'opsz' 24; font-family: 'Material Symbols Outlined'; display: inline-block; vertical-align: middle; }
        * { box-sizing: border-box; } a { text-decoration: none; } button { font-family: inherit; background: none; border: none; cursor: pointer; }
        .row-hover:hover { background: #F5F3EC; } 
        .card-hover { transition: box-shadow 0.3s ease, transform 0.3s ease, border-color 0.25s ease; }
        .card-hover:hover { box-shadow: 0 20px 25px -5px rgba(30,77,58,0.15), 0 8px 10px -6px rgba(30,77,58,0.08); transform: translateY(-4px); border-color: rgba(30,77,58,0.1) !important; }
        .tab-btn { padding: 14px 20px; border: none; border-bottom: 2px solid transparent; background: transparent; cursor: pointer; white-space: nowrap; font-family: 'JetBrains Mono', monospace; font-size: 11px; letter-spacing: 0.1em; color: #1e4d3a99; transition: color 0.2s ease, background 0.2s ease; }
        .tab-btn:hover { color: #1e4d3a; background: rgba(30,77,58,0.05); } 
        .tab-btn.active { border-bottom-color: #1e4d3a; color: #1e4d3a; background: rgba(30,77,58,0.05); font-weight: 700; }
        .person-card:hover .person-name { color: #1e4d3a; } 
        .action-link { background: none; border: none; padding: 0; cursor: pointer; font-family: 'JetBrains Mono', monospace; font-size: 11px; font-weight: 700; letter-spacing: 0.1em; color: #1e4d3a; display: inline-flex; align-items: center; gap: 4px; transition: color 0.2s ease; }
        .action-link:hover { color: #C9A84C; }
        @keyframes highlightPulse {
          0% { box-shadow: 0 0 0 0 rgba(201, 168, 76, 0.7); background-color: rgba(201, 168, 76, 0.15); }
          50% { box-shadow: 0 0 0 8px rgba(201, 168, 76, 0); background-color: rgba(201, 168, 76, 0.25); }
          100% { box-shadow: 0 0 0 0 rgba(201, 168, 76, 0); background-color: transparent; }
        }
        .highlight-focus {
          animation: highlightPulse 2.5s ease-out;
          border-radius: 8px;
          position: relative;
          z-index: 10;
        }
        @media (max-width: 768px) {
          .tab-btn { padding: 10px 14px; font-size: 10px; }
        }
      `}</style>

      {showAddWork && (
        <AddWorkModal 
          onClose={() => setShowAddWork(false)} 
          onAdd={() => {}} 
          t={t} 
          lang={lang}
          versionId={s.versionId}
          onSuccess={(message) => setToast({ message, type: "success" })}
        />
      )}

      {showAddMedia && (
        <AddMediaModal 
          onClose={() => setShowAddMedia(false)} 
          onAdd={() => {}} 
          t={t} 
          versionId={s.versionId} 
          scholarId={s.id} 
          onSuccess={(message) => setToast({ message, type: "success" })} 
        />
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <header ref={headerRef} style={{ position: "sticky", top: 0, zIndex: 50, backgroundColor: collapsed ? "rgba(251,249,244,0.85)" : "rgba(251,249,244,0.97)", backdropFilter: collapsed ? "blur(16px)" : "none", borderBottom: "1px solid rgba(30,77,58,0.1)", boxShadow: collapsed ? "0 2px 12px rgba(30,77,58,0.08)" : "none", transition: "all 0.3s ease", padding: "10px 0" }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto", padding: isMobile ? "0 16px" : "0 64px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "8px" }}>
            <div style={{ marginBottom: collapsed ? 0 : "8px", flex: 1, minWidth: 0 }}>
              <div style={{ overflow: "hidden", maxHeight: collapsed ? "0px" : "20px", opacity: collapsed ? 0 : 1, transition: "max-height 0.35s cubic-bezier(0.4,0,0.2,1), opacity 0.25s ease, margin-bottom 0.35s cubic-bezier(0.4,0,0.2,1)", marginBottom: collapsed ? 0 : "6px" }}>
                <button onClick={() => window.history.back()} style={{ background: "none", border: "none", padding: 0, cursor: "pointer", color: "#1e4d3a99", fontSize: "14px", lineHeight: 1, transition: "color 0.2s ease" }} onMouseEnter={(e) => (e.currentTarget.style.color = "#1e4d3a")} onMouseLeave={(e) => (e.currentTarget.style.color = "#1e4d3a99")}>←</button>
              </div>
              <div style={{ ...MONO, fontSize: isMobile ? "9px" : "11px", color: "#1e4d3a99", letterSpacing: "0.05em", marginBottom: collapsed ? "2px" : "6px", direction: isRTL ? "rtl" : "ltr", transition: "margin-bottom 0.25s ease", whiteSpace: isMobile ? "normal" : "nowrap", overflow: isMobile ? "visible" : "hidden", textOverflow: isMobile ? "clip" : "ellipsis" }}>
                {isRTL ? (
                  <><span style={{ color: "#1e4d3a", fontWeight: 700 }}>{getName()}</span> {" < "}<a href="/scholars" style={{ color: "#1e4d3a99", textDecoration: "none", transition: "color 0.2s ease" }} onMouseEnter={(e) => (e.currentTarget.style.color = "#1e4d3a")} onMouseLeave={(e) => (e.currentTarget.style.color = "#1e4d3a99")}>{scholarsLabel}</a> {" < "}<a href="/" style={{ color: "#1e4d3a99", textDecoration: "none", transition: "color 0.2s ease" }} onMouseEnter={(e) => (e.currentTarget.style.color = "#1e4d3a")} onMouseLeave={(e) => (e.currentTarget.style.color = "#1e4d3a99")}>{homeLabel}</a></>
                ) : (
                  <><a href="/" style={{ color: "#1e4d3a99", textDecoration: "none", transition: "color 0.2s ease" }} onMouseEnter={(e) => (e.currentTarget.style.color = "#1e4d3a")} onMouseLeave={(e) => (e.currentTarget.style.color = "#1e4d3a99")}>{homeLabel}</a> {" > "}<a href="/scholars" style={{ color: "#1e4d3a99", textDecoration: "none", transition: "color 0.2s ease" }} onMouseEnter={(e) => (e.currentTarget.style.color = "#1e4d3a")} onMouseLeave={(e) => (e.currentTarget.style.color = "#1e4d3a99")}>{scholarsLabel}</a>{hasLangContent && <> {" > "}<span style={{ color: "#1e4d3a", fontWeight: 700 }}>{getName()}</span></>}</>
                )}
              </div>
              
              {hasLangContent && (
                <>
                  <div style={{ display: "flex", alignItems: "baseline", gap: "12px", flexWrap: "wrap", marginBottom: "2px" }}>
                    <h1 style={{ fontFamily: "'Hanken Grotesk', sans-serif", fontWeight: 700, color: "#1e4d3a", margin: 0, fontSize: isMobile ? (collapsed ? "16px" : "20px") : (collapsed ? "20px" : "28px"), transition: "font-size 0.25s ease" }}>{getName()}</h1>
                    <div style={{ ...MONO, fontSize: "9px", color: "#1e4d3a99", letterSpacing: "0.18em", opacity: 0.8, display: collapsed ? "none" : "block" }}>
                      {t('scholar.createdBy')} <ProfileLink name={s.createdBy} url={s.createdByUrl} /> • {s.createdDate}
                    </div>
                  </div>
                  <div style={{ overflow: "hidden", maxHeight: collapsed ? "0px" : (hasBeenEdited ? "60px" : "30px"), opacity: collapsed ? 0 : 1, transition: "max-height 0.35s cubic-bezier(0.4,0,0.2,1), opacity 0.25s ease" }}>
                    {getSubtitle() && (
                      <p style={{ fontFamily: "'Amiri', serif", fontSize: "13px", color: "#1e4d3a99", fontStyle: "italic", margin: "2px 0 4px", lineHeight: 1.4 }}>{getSubtitle()}</p>
                    )}
                    {hasBeenEdited && (
                      <div style={{ ...MONO, fontSize: "9px", color: "#1e4d3a99", letterSpacing: "0.18em", opacity: 0.8 }}>
                        {t('scholar.lastUpdated')} <ProfileLink name={s.lastUpdatedBy!} url={s.lastUpdatedByUrl!} /> • {s.lastUpdatedDate}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
            
            {hasLangContent && (
              <div style={{ display: "flex", gap: "4px", paddingTop: "4px", flexShrink: 0 }}>
                <button 
                  onClick={async () => {
                    const shareData = { title: getName(), text: t('scholar.shareText').replace('{name}', getName()), url: window.location.href };
                    try {
                      if (navigator.share) { await navigator.share(shareData); } 
                      else { 
                        await navigator.clipboard.writeText(window.location.href); 
                        setToast({ message: t('scholar.linkCopied'), type: 'success' });
                      }
                    } catch (err:any) { if (err.name !== 'AbortError') console.error('Share failed:', err); }
                  }} 
                  title="Share" onMouseEnter={() => setShareHov(true)} onMouseLeave={() => setShareHov(false)} style={iconBtnStyle(shareHov)}
                >
                  <Icon name="share" size={18} />
                </button>
                <button 
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(window.location.href);
                      setToast({ message: t('scholar.linkCopied'), type: 'success' });
                    } catch (err) {
                      const input = document.createElement('input');
                      input.value = window.location.href;
                      document.body.appendChild(input);
                      input.select();
                      document.execCommand('copy');
                      document.body.removeChild(input);
                      setToast({ message: t('scholar.linkCopied'), type: 'success' });
                    }
                  }} 
                  id="copy-link-btn" title="Copy link" onMouseEnter={() => setLinkHov(true)} onMouseLeave={() => setLinkHov(false)} style={iconBtnStyle(linkHov)}
                >
                  <Icon name="link" size={18} />
                </button>
              </div>
            )}
          </div>
          
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: collapsed ? "4px" : "6px", paddingTop: collapsed ? "4px" : "6px", borderTop: "1px solid rgba(30,77,58,0.1)", transition: "margin-top 0.35s cubic-bezier(0.4,0,0.2,1), padding-top 0.35s cubic-bezier(0.4,0,0.2,1)", flexWrap: "wrap", gap: "10px" }}>
                        <div 
              ref={langDropdownRef}
              style={{ display: "flex", gap: "4px", padding: "4px 8px", backgroundColor: "rgba(30,77,58,0.05)", border: "1px solid rgba(30,77,58,0.1)", borderRadius: "999px", flexWrap: "wrap", position: "relative" }}
            >
              {/* ✅ 1. Show the first 3 languages from the SORTED list (Available ones are at the top!) */}
              {sortedAllLangs.slice(0, 3).map((dbLang) => {
                const langCodeUpper = dbLang.code.toUpperCase() as Language;
                const active = lang === langCodeUpper;
                const isAvailable = !!s.name[langCodeUpper]; // Check if this lang actually has content
                
                return (
                  <button 
                    key={dbLang.language_id} 
                    onClick={() => {
                      setLang(langCodeUpper);
                      setGlobalLang(dbLang.code);
                      setSearchParams({ lang: dbLang.code, tab: activeTab }, { replace: true });
                    }} 
                    style={{ 
                      ...MONO, 
                      fontSize: "10px", 
                      fontWeight: 700, 
                      letterSpacing: "0.08em", 
                      padding: isMobile ? "4px 9px" : "4px 12px", 
                      borderRadius: "999px", 
                      border: "1px solid", 
                      // If it's not available, make it look slightly muted but still clickable
                      borderColor: active ? "#1e4d3a" : (isAvailable ? "rgba(30,77,58,0.25)" : "rgba(30,77,58,0.10)"), 
                      backgroundColor: active ? "#1e4d3a" : "transparent", 
                      color: active ? "#fff" : (isAvailable ? "#1e4d3a99" : "#1e4d3a40"), 
                      cursor: "pointer", 
                      transition: "all 0.2s ease" 
                    }}
                    title={!isAvailable ? `No content in ${dbLang.name} yet. Will show available language.` : ""}
                  >
                    {isMobile ? dbLang.code.toUpperCase() : dbLang.name}
                  </button>
                );
              })}

              {/* ✅ 2. If there are MORE than 3 languages in the system, show the "•••" button */}
              {sortedAllLangs.length > 3 && (
                <>
                  <button 
                    onClick={() => setShowLangDropdown(!showLangDropdown)}
                    style={{ 
                      ...MONO, 
                      fontSize: "14px", 
                      fontWeight: 700, 
                      letterSpacing: "0.08em", 
                      padding: isMobile ? "4px 9px" : "4px 12px", 
                      borderRadius: "999px", 
                      border: "1px solid rgba(30,77,58,0.25)", 
                      backgroundColor: "transparent", 
                      color: "#1e4d3a99", 
                      cursor: "pointer", 
                      transition: "all 0.2s ease",
                      display: "flex", 
                      alignItems: "center", 
                      justifyContent: "center"
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = "#1e4d3a"; e.currentTarget.style.backgroundColor = "rgba(30,77,58,0.05)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = "#1e4d3a99"; e.currentTarget.style.backgroundColor = "transparent"; }}
                    title="More languages"
                  >
                    •••
                  </button>

                  {/* ✅ 3. The Dropdown Menu (Shows ALL remaining languages, available ones still at the top) */}
                  {showLangDropdown && (
                    <div style={{
                      position: "absolute",
                      top: "calc(100% + 8px)",
                      right: isRTL ? "auto" : "0",
                      left: isRTL ? "0" : "auto",
                      backgroundColor: "#fff",
                      border: "1px solid rgba(30,77,58,0.1)",
                      borderRadius: "12px",
                      boxShadow: "0 10px 25px rgba(30,77,58,0.15)",
                      padding: "8px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "4px",
                      zIndex: 100,
                      minWidth: "140px"
                    }}>
                      {sortedAllLangs.slice(3).map((dbLang) => {
                        const langCodeUpper = dbLang.code.toUpperCase() as Language;
                        const active = lang === langCodeUpper;
                        const isAvailable = !!s.name[langCodeUpper];
                        
                        return (
                          <button 
                            key={dbLang.language_id} 
                            onClick={() => {
                              setLang(langCodeUpper);
                              setGlobalLang(dbLang.code);
                              setSearchParams({ lang: dbLang.code, tab: activeTab }, { replace: true });
                              setShowLangDropdown(false);
                            }} 
                            style={{ 
                              ...MONO, 
                              fontSize: "11px", 
                              fontWeight: 700, 
                              letterSpacing: "0.05em", 
                              padding: "8px 12px", 
                              borderRadius: "8px", 
                              border: "none", 
                              backgroundColor: active ? "#1e4d3a" : "transparent", 
                              color: active ? "#fff" : (isAvailable ? "#1e4d3a" : "#1e4d3a40"), 
                              cursor: "pointer", 
                              transition: "all 0.2s ease", 
                              textAlign: isRTL ? "right" : "left",
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center"
                            }}
                            onMouseEnter={(e) => { if (!active) e.currentTarget.style.backgroundColor = "#F5F3EC"; }}
                            onMouseLeave={(e) => { if (!active) e.currentTarget.style.backgroundColor = "transparent"; }}
                          >
                            <span>{dbLang.name}</span>
                            {/* Optional: Add a small dot to show it has content */}
                            {isAvailable && <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "#1e4d3a", marginLeft: 8 }} />}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </div>
            
            <button 
              onClick={() => {
                if (checkContributionPermission()) {
                  navigate(hasLangContent ? `/scholars/${s.id}/edit/${lang.toLowerCase()}` : `/scholars/${s.id}/submit/${lang.toLowerCase()}`);
                }
              }}
              style={{ 
                display: "inline-flex", alignItems: "center", gap: "8px", padding: isMobile ? "8px 14px" : "9px 18px",
                border: "2px solid #1e4d3a", borderRadius: "8px", 
                backgroundColor: "#1e4d3a", color: "#fbf9f4",
                fontFamily: "'Hanken Grotesk', sans-serif", fontSize: isMobile ? "10px" : "12px", fontWeight: 700, letterSpacing: "0.05em", cursor: "pointer", 
                boxShadow: "0 2px 10px rgba(30,77,58,0.18)",
                transition: "all 0.3s ease", whiteSpace: "nowrap"
              }}
              onMouseEnter={(e) => { 
                e.currentTarget.style.backgroundColor = "#fbf9f4"; 
                e.currentTarget.style.color = "#1e4d3a"; 
                e.currentTarget.style.boxShadow = "none";
              }}
              onMouseLeave={(e) => { 
                e.currentTarget.style.backgroundColor = "#1e4d3a"; 
                e.currentTarget.style.color = "#fbf9f4"; 
                e.currentTarget.style.boxShadow = "0 2px 10px rgba(30,77,58,0.18)";
              }}
            >
              <Icon name={hasLangContent ? "edit_note" : "add_circle"} size={14} />
              {hasLangContent ? t('scholar.editBtn') : t('scholar.addVersionBtn')}
            </button>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: "1280px", margin: "0 auto", padding: isMobile ? "16px 16px 40px" : "24px 64px 60px" }}>
        {/* ✅ Only show empty state if the scholar has NO content in ANY language */}
        {!hasAnyContent ? (
          <EmptyLangState langName={currentLangName} t={t} onContribute={() => navigate(`/scholars/${s.id}/submit/${lang.toLowerCase()}`)} />
        ) : (
          <>
            <div style={{ position: "relative", marginBottom: "64px" }}>
              <aside style={{ 
                float: isMobile ? "none" : (isRTL ? "right" : "left"), 
                width: isMobile ? "100%" : "300px", 
                marginBottom: "24px",
                marginRight: isMobile ? "0" : (isRTL ? "0" : "48px"),
                marginLeft: isMobile ? "0" : (isRTL ? "48px" : "0"),
              }}>
                <div style={{ backgroundColor: "#fff", border: "1px solid rgba(30,77,58,0.1)", borderRadius: "16px", overflow: "hidden", boxShadow: "0 1px 4px rgba(30,77,58,0.06)" }}>
                  <div style={{ position: "relative", aspectRatio: "3/4", overflow: "hidden" }}>
                    {s.image ? (
                      <img alt="Scholar portrait" src={s.image} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                    ) : (
                      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#1e4d3a66", backgroundColor: "#F5F3EC" }}>
                        <Icon name="account_circle" size={100} />
                      </div>
                    )}
                  </div>

                  <div style={{ padding: isMobile ? "18px 18px 20px" : "20px 20px 24px" }}>
                    <p style={{ ...MONO, fontSize: "9px", color: "#1e4d3a", letterSpacing: "0.2em", marginBottom: "12px", borderBottom: "1px solid rgba(30,77,58,0.1)", paddingBottom: "8px" }}>{t('scholar.atAGlance')}</p>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <tbody>
                        {([
                          [t('scholar.fullName'), s.atAGlance.fullName],
                          [t('scholar.born'), s.atAGlance.born],
                          [t('scholar.died'), s.atAGlance.died],
                          [t('scholar.century'), s.atAGlance.century],
                          [t('scholar.region'), s.atAGlance.region],
                          [t('scholar.discipline'), s.atAGlance.discipline],
                        ] as [string, string][]).map(([label, value]) => (
                          <tr key={label} style={{ borderBottom: "1px solid #F5F3EC" }}>
                            <td style={{ ...MONO, padding: "8px 0", fontSize: "10px", color: "#1e4d3a99", fontWeight: 500, verticalAlign: "top" }}>{label}</td>
                            <td style={{ padding: "8px 0", fontSize: "11px", fontWeight: 700, textAlign: "right", color: "#1e4d3a", verticalAlign: "top", paddingLeft: "8px", fontFamily: lang === "AR" ? "'Amiri', serif" : "'Hanken Grotesk', sans-serif" }}>{value}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {s.contributors.length > 0 && (
                      <div style={{ marginTop: "20px", paddingTop: "16px", borderTop: "1px solid rgba(30,77,58,0.1)" }}>
                        <button onClick={() => setContributorsOpen(!contributorsOpen)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                          <span style={{ ...MONO, fontSize: "9px", color: "#1e4d3a", letterSpacing: "0.2em", display: "flex", alignItems: "center", gap: "4px" }}>{t('scholar.allContributors')}<Icon name="expand_more" size={14} /></span>
                          <span style={{ ...MONO, fontSize: "9px", color: "#1e4d3a", fontWeight: 700, backgroundColor: "rgba(30,77,58,0.05)", padding: "2px 8px", borderRadius: "4px" }}>{s.contributors.length} {t('scholar.contributors')}</span>
                        </button>
                        {contributorsOpen && (
                          <div style={{ marginTop: "12px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                              <span style={{ ...MONO, fontSize: "9px", color: "#1e4d3a66", letterSpacing: "0.08em" }}>{t('scholar.contributor')}</span>
                              <span style={{ ...MONO, fontSize: "9px", color: "#1e4d3a66", letterSpacing: "0.08em" }}>{t('scholar.contributions')}</span>
                            </div>
                            {s.contributors.map((c: { name: string; profileUrl?: string; contributions: number }) => (
                              <div key={c.name} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px solid #F5F3EC" }}>
                                <ProfileLink name={c.name} url={c.profileUrl ?? "#"} />
                                <span style={{ ...MONO, fontSize: "10px", color: "#1e4d3a", fontWeight: 700 }}>{c.contributions}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </aside>

              <div>
                <BiographyRenderer content={getBiography()} lang={lang.toLowerCase()} />
              </div>

              <div style={{ clear: "both" }} />
            </div>

            <div style={{ borderTop: "1px solid rgba(30,77,58,0.1)", paddingTop: isMobile ? "28px" : "48px" }}>
              <div style={{ display: "flex", borderBottom: "1.5px solid rgba(30,77,58,0.1)", marginBottom: isMobile ? "20px" : "32px", position: "sticky", top: "var(--header-h, 130px)", zIndex: 40, willChange: "transform", backgroundColor: "#fbf9f4", overflowX: "auto" }}>
                {tabIds.map((id) => (
                  <button 
                    key={id} 
                    onClick={() => {
                      setActiveTab(id);
                      const newParams = new URLSearchParams(searchParams);
                      newParams.set("tab", id);
                      setSearchParams(newParams, { replace: true });
                    }} 
                    className={`tab-btn${activeTab === id ? " active" : ""}`}
                  >
                    {t(`scholar.tab.${id}`)}
                  </button>
                ))}
              </div>

              {/* ✅ WORKS TAB */}
              {activeTab === "works" && (
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: "12px" }}>
                    <h2 style={{ fontFamily: "'Hanken Grotesk', sans-serif", fontSize: isMobile ? "19px" : "24px", fontWeight: 700, color: "#1e4d3a", margin: 0 }}>{t('scholar.bibliographyTitle')}</h2>
                    <HoverBtn onClick={() => { if (checkContributionPermission()) setShowAddWork(true); }}>
                      <Icon name="add_circle" size={14} />{t('scholar.addWork')}
                    </HoverBtn>
                  </div>
                  
                  {/* ✅ SAFE CHECK: Prevents crashes if s.works is somehow undefined */}
                  {(s.works?.length ?? 0) === 0 ? (
                    <TabEmptyState 
                      icon="menu_book" 
                      message={t('scholar.emptyWorks')}
                      actionLabel={t('scholar.addFirstWork')}
                      onAction={() => setShowAddWork(true)}
                      canAct={canContribute ?? undefined}
                      isRTL={isRTL}
                    />
                  ) : (
                    <div style={{ border: "1px solid rgba(30,77,58,0.1)", borderRadius: "16px", overflow: "hidden", backgroundColor: "#fff" }}>
                      <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: isMobile ? "560px" : undefined }}>
                          <thead><tr style={{ backgroundColor: "#F5F3EC", borderBottom: "1.5px solid rgba(30,77,58,0.1)" }}>{[t('scholar.colTitle'), t('scholar.colYear'), t('scholar.colFormat'), t('scholar.colAccess')].map((col) => (<th key={col} style={{ ...MONO, padding: "12px 16px", textAlign: "left", fontSize: "9px", color: "#1e4d3a99", letterSpacing: "0.1em", fontWeight: 700 }}>{col}</th>))}</tr></thead>
                          <tbody>
                            {s.works?.map((w: Work, i: number) => (
                              <tr key={w.work_id || i} id={w.work_id ? `work-${w.work_id}` : undefined} className="row-hover" style={{ borderBottom: "1px solid #F5F3EC", transition: "background 0.2s ease" }}>
                                <td style={{ fontFamily: lang === "AR" ? "'Amiri', serif" : "'Hanken Grotesk', sans-serif", padding: "14px 16px", fontSize: "14px", fontWeight: 700, fontStyle: "italic", color: "#1e4d3a" }}>
                                  {w.title}
                                  {w.uploadedBy && (<div style={{ ...MONO, fontSize: "9px", fontStyle: "normal", fontWeight: 400, color: "#1e4d3a66", marginTop: "3px" }}>{t('scholar.addedBy')} <ProfileLink name={w.uploadedBy} url={w.uploadedByUrl ?? "#"} /></div>)}
                                </td>
                                <td style={{ padding: "14px 16px", fontSize: "13px", color: "#1e4d3a99", ...SANS }}>{w.year}</td>
                                <td style={{ padding: "14px 16px" }}><span style={{ ...MONO, fontSize: "9px", fontWeight: 700, padding: "3px 10px", borderRadius: "4px", backgroundColor: w.format === "BOOK" ? "rgba(30,77,58,0.08)" : "#F5F3EC", color: w.format === "BOOK" ? "#1e4d3a" : "#1e4d3a99" }}>{t(`scholar.format.${w.format}`)}</span></td>
                                <td style={{ padding: "14px 16px" }}><WorkActions work={w} t={t} /></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ✅ MEDIA TAB */}
              {activeTab === "media" && (
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px", flexWrap: "wrap", gap: "12px" }}>
                    <h2 style={{ fontFamily: "'Hanken Grotesk', sans-serif", fontSize: isMobile ? "19px" : "24px", fontWeight: 700, color: "#1e4d3a", margin: 0 }}>{t('scholar.mediaTitle')}</h2>
                    <HoverBtn onClick={() => { if (checkContributionPermission()) setShowAddMedia(true); }}>
                      <Icon name="add_circle" size={14} />{t('scholar.addMedia')}
                    </HoverBtn>
                  </div>
                  
                  {s.media.length === 0 ? (
                    <TabEmptyState 
                      icon="folder_open" 
                      message={t('scholar.emptyMedia')}
                      actionLabel={t('scholar.addFirstMedia')}
                      onAction={() => setShowAddMedia(true)}
                      canAct={canContribute ?? undefined}
                      isRTL={isRTL}
                    />
                  ) : (
                    <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3,1fr)", gap: isMobile ? "16px" : "20px" }}>
                      {s.media.map((m: MediaItem, i: number) => (
                        <div key={m.media_id || i} id={m.media_id ? `media-${m.media_id}` : undefined}>
                          <MediaCard item={m} mediaIconName={mediaIconName} t={t} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ✅ RELATIONS TAB */}
              {activeTab === "relations" && (
                <div>
                  {s.intellectualLineage.length === 0 && s.notableDisciples.length === 0 && s.relatedScholars.length === 0 ? (
                    <TabEmptyState 
                      icon="account_tree" 
                      message={t('scholar.emptyRelations')}
                      isRTL={isRTL}
                    />
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: isMobile ? "20px" : "32px" }}>
                      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: isMobile ? "16px" : "20px" }}>
                        {[ 
                          { data: s.intellectualLineage, label: t('scholar.intellectualLineage'), icon: "school", color: "#1e4d3a" }, 
                          { data: s.notableDisciples, label: t('scholar.notableDisciples'), icon: "groups", color: "#C9A84C" } 
                        ].map(({ data, label, icon, color }) => (
                          data.length > 0 && (
                            <div key={label} style={{ backgroundColor: "#F5F3EC", padding: isMobile ? "20px 18px" : "28px", borderRadius: "16px", border: "1px solid rgba(30,77,58,0.1)" }}>
                              <h3 style={{ ...MONO, fontSize: "9px", color, letterSpacing: "0.15em", marginBottom: "24px", display: "flex", alignItems: "center", gap: "8px" }}><Icon name={icon} size={15} />{label}</h3>
                              <div style={{ display: "flex", gap: "24px", flexWrap: "wrap" }}>
                                {data.map((p: RelatedPerson) => (
                                  <a key={p.name} href={p.profileUrl ?? "#"} className="person-card" style={{ display: "flex", alignItems: "center", gap: "12px", textDecoration: "none" }}>
                                    <div style={{ width: "44px", height: "44px", borderRadius: "50%", backgroundColor: p.color, display: "flex", alignItems: "center", justifyContent: "center", color: p.textColor, fontSize: "13px", fontWeight: 700, flexShrink: 0 }}>{p.initials}</div>
                                    <div>
                                      <p className="person-name" style={{ fontSize: "13px", fontWeight: 700, color: "#1e4d3a", margin: "0 0 2px", transition: "color 0.2s ease", ...SANS }}>{p.name}</p>
                                      <p style={{ ...MONO, fontSize: "9px", color: "#1e4d3a66", letterSpacing: "0.08em", margin: 0 }}>{p.role}</p>
                                    </div>
                                  </a>
                                ))}
                              </div>
                            </div>
                          )
                        ))}
                      </div>
                      {s.relatedScholars.length > 0 && (
                        <div>
                          <h3 style={{ ...MONO, fontSize: "9px", color: "#1e4d3a99", letterSpacing: "0.12em", marginBottom: "16px" }}>{t('scholar.relatedByField')}</h3>
                          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3,1fr)", gap: "14px" }}>
                            {s.relatedScholars.map((rs: RelatedScholar, i: number) => (
                              <div key={i} className="card-hover" style={{ backgroundColor: "#fff", padding: "16px", borderRadius: "16px", border: "1px solid rgba(30,77,58,0.1)" }}>
                                <p style={{ ...MONO, fontSize: "9px", color: rs.labelColor, letterSpacing: "0.08em", marginBottom: "6px" }}>{rs.label}</p>
                                <p style={{ fontSize: "14px", fontWeight: 700, color: "#1e4d3a", marginBottom: "4px", fontFamily: "'Hanken Grotesk', sans-serif" }}>{rs.name}</p>
                                <p style={{ fontSize: "12px", color: "#1e4d3a99", fontStyle: "italic", margin: 0, ...SANS }}>{rs.description}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* ✅ MORE / REFERENCES TAB */}
              {activeTab === "more" && (
                <div style={{ display: "grid" }}>
                  {/* ✅ SAFE CHECK: Prevents crashes if s.academicReferences is somehow undefined */}
                  {(s.academicReferences?.length ?? 0) === 0 ? (
                    <TabEmptyState 
                      icon="library_books" 
                      message={t('scholar.emptyReferences')}
                      isRTL={isRTL}
                    />
                  ) : (
                    <div>
                      <h3 style={{ ...MONO, fontSize: "9px", color: "#1e4d3a99", letterSpacing: "0.12em", marginBottom: "20px" }}>{t('scholar.academicReferences')}</h3>
                      <ol style={{ paddingLeft: "0", margin: 0, display: "flex", flexDirection: "column", gap: "16px", listStyle: "none" }}>
                        {s.academicReferences?.map((r: Reference, i: number) => (
                          <li key={i} style={{ padding: isMobile ? "14px 16px" : "16px 20px", backgroundColor: "#fff", border: "1px solid rgba(30,77,58,0.1)", borderRadius: "16px", display: "flex", flexDirection: "column", gap: "6px" }}>
                            <p style={{ fontFamily: "'Hanken Grotesk', sans-serif", fontSize: "14px", fontWeight: 600, color: "#1e4d3a", margin: 0 }}>{r.title}</p>
                            <p style={{ ...SANS, fontSize: "13px", color: "#1e4d3acc", lineHeight: 1.6, margin: 0 }}>{r.citation}</p>
                            {r.url && (
                              <a href={r.url} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "#C9A84C", fontSize: "12px", fontWeight: 600, textDecoration: "none", marginTop: "4px", ...SANS, wordBreak: "break-all" }} onMouseEnter={(e) => { e.currentTarget.style.color = "#1e4d3a"; e.currentTarget.style.textDecoration = "underline"; }} onMouseLeave={(e) => { e.currentTarget.style.color = "#C9A84C"; e.currentTarget.style.textDecoration = "none"; }}>
                                <Icon name="link" size={14} />{r.url.replace(/^https?:\/\//, '')}
                              </a>
                            )}
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}
                </div>
              )}

              {s.recentRevisions.length > 0 && (
                <section style={{ marginTop: isMobile ? "48px" : "80px", paddingTop: isMobile ? "28px" : "40px", borderTop: "1px solid rgba(30,77,58,0.1)" }}>
                  <h3 style={{ ...MONO, fontSize: "9px", color: "#1e4d3a99", letterSpacing: "0.12em", marginBottom: "20px" }}>{t('scholar.recentRevisions')}</h3>
                  <div style={{ maxWidth: "800px", display: "flex", flexDirection: "column", gap: "12px" }}>
                    {s.recentRevisions.slice(0, showAllRevisions ? s.recentRevisions.length : 3).map((r: RecentRevision, i: number) => (
                      <div key={i} style={{ display: "flex", gap: "16px", padding: "10px 0", borderBottom: "1px solid #F5F3EC", ...SANS, flexWrap: "wrap" }}>
                        <span style={{ ...MONO, fontSize: "10px", color: "#1e4d3a66", minWidth: "80px" }}>{r.date}</span>
                        <ProfileLink name={r.author} url={r.authorUrl ?? "#"} />
                        <span style={{ fontSize: "12px", color: "#1e4d3acc" }}>— {r.action}</span>
                      </div>
                    ))}
                    {s.recentRevisions.length > 3 && (
                      <button 
                        className="action-link" 
                        onClick={() => setShowAllRevisions(!showAllRevisions)} 
                        style={{ marginTop: "8px", alignSelf: "flex-start" }}
                      >
                        {showAllRevisions ? t('scholar.showLess') : `${t('scholar.viewMore')} (+${s.recentRevisions.length - 3})`}
                      </button>
                    )}
                  </div>
                </section>
              )}
              
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default ScholarDetailPage;