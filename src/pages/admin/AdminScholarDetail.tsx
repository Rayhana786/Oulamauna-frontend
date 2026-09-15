import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useLang } from "../../context/LanguageContext";
import { adminApi } from "../../api/adminApi";

/* ------------------------------------------------------------------ */
/*  Design tokens — same as PendingEditReview / AllScholarsAdmin      */
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

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
interface WorkRow { 
  id: number; 
  title: string; 
  year: string; 
  format: string; 
  access: string | null; 
  accessSource: "upload" | "link";
  fileName: string | null; // ✅ Added to preserve original file extension
}

interface MediaRow { 
  id: number; 
  title: string; 
  meta: string; 
  type: "Upload" | "Link"; 
  description: string; 
  access: string | null; 
  accessSource: "upload" | "link";
  fileName: string | null; // ✅ Added to preserve original file extension
}

interface ReferenceRow { id: number; title: string; citation: string; url: string | null; }
interface RelationshipRow { type: string; name: string; relatedScholarId: number | null; }

interface VersionDetail {
  scholarId: number;
  name: string;
  bio: string;
  image: string | null;
  region: string;
  century: string;
  aliases: string[];
  birth: string;
  death: string;
  disciplines: string[];
  works: WorkRow[];
  media: MediaRow[];
  references: ReferenceRow[];
  relationships: RelationshipRow[];
  editor: string;
  createdAt: string;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */
const formatScholarDate = (d: any) => {
  if (!d) return "";
  return d.raw_text || (d.year ? `${d.year} ${d.calendar}`.trim() : "");
};

const getMediaIcon = (type: string) =>
  type?.includes("video") ? "movie" : type?.includes("audio") ? "graphic_eq" : "article";

const getAccessType = (url: string | null | undefined): "pdf" | "audio" | "video" => {
  if (!url) return "pdf";
  const ext = url.split(".").pop()?.toLowerCase() ?? "";
  if (["mp3", "wav", "ogg", "m4a"].includes(ext)) return "audio";
  if (["mp4", "webm", "avi", "mov"].includes(ext)) return "video";
  return "pdf";
};

/* ------------------------------------------------------------------ */
/*  Unified File Actions (Handles Upload vs Link perfectly)            */
/* ------------------------------------------------------------------ */
function FileActions({ 
  url, 
  filename, 
  mediaType, 
  accessSource 
}: { 
  url: string; 
  filename: string; 
  mediaType: "pdf" | "audio" | "video"; 
  accessSource: "upload" | "link"; 
}) {
  const [isViewing, setIsViewing] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const contentType = mediaType === "video" ? "video/mp4" : mediaType === "audio" ? "audio/mpeg" : "application/pdf";

  const handleView = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (accessSource === "link") {
      window.open(url, "_blank");
      return;
    }

    setIsViewing(true);
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const typedBlob = new Blob([blob], { type: contentType });
      const blobUrl = URL.createObjectURL(typedBlob);
      window.open(blobUrl, "_blank");
      setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
    } catch (err) {
      console.error("View failed:", err);
      window.open(url, "_blank");
    } finally {
      setIsViewing(false);
    }
  };

  const handleDownload = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (accessSource === "link") {
      window.open(url, "_blank");
      return;
    }

    setIsDownloading(true);
    try {
      // 1. Fetch the file as a Blob to bypass cross-origin download restrictions
      const response = await fetch(url);
      if (!response.ok) throw new Error('Network response was not ok');
      const blob = await response.blob();
      
      // 2. Create a local object URL (same-origin, so 'download' attribute WORKS!)
      const blobUrl = window.URL.createObjectURL(blob);
      
      // 3. Trigger the download with the correct filename
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = filename; 
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // 4. Clean up memory
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error("Download failed:", err);
      window.open(url, "_blank");
    } finally {
      setIsDownloading(false);
    }
  };

  if (accessSource === "link") {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        style={{ 
          display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          padding: "6px 12px", borderRadius: 6, border: `1.5px solid ${colors.forestGreen}`, 
          backgroundColor: "transparent", color: colors.forestGreen, 
          textDecoration: "none", fontFamily: fonts.body, fontSize: 11, fontWeight: 600, cursor: "pointer",
          transition: "all 0.2s ease"
        }}
        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = colors.forestGreen; e.currentTarget.style.color = colors.creamLight; }}
        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = colors.forestGreen; }}
      >
        <Icon name="open_in_new" size={14} /> Open Link
      </a>
    );
  }

  return (
    <div style={{ display: "flex", gap: 6 }}>
      <button
        onClick={handleView}
        disabled={isViewing}
        title="View File"
        style={{ 
          width: 32, height: 32, borderRadius: 6, border: `1.5px solid ${colors.forestGreen}`, 
          backgroundColor: "transparent", color: colors.forestGreen, 
          cursor: isViewing ? "wait" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", 
          transition: "all 0.2s ease" 
        }}
        onMouseEnter={(e) => { if (!isViewing) e.currentTarget.style.backgroundColor = "rgba(11,67,53,0.05)"; }}
        onMouseLeave={(e) => { if (!isViewing) e.currentTarget.style.backgroundColor = "transparent"; }}
      >
        <Icon name={isViewing ? "hourglass_empty" : "visibility"} size={16} />
      </button>
      <button
        onClick={handleDownload}
        disabled={isDownloading}
        title="Download File"
        style={{ 
          width: 32, height: 32, borderRadius: 6, border: `1.5px solid ${colors.forestGreen}`, 
          backgroundColor: isDownloading ? colors.forestGreen : "transparent", 
          color: isDownloading ? colors.creamLight : colors.forestGreen, 
          cursor: isDownloading ? "wait" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", 
          transition: "all 0.2s ease" 
        }}
        onMouseEnter={(e) => { if (!isDownloading) { e.currentTarget.style.backgroundColor = colors.forestGreen; e.currentTarget.style.color = colors.creamLight; } }}
        onMouseLeave={(e) => { if (!isDownloading) { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = colors.forestGreen; } }}
      >
        <Icon name={isDownloading ? "hourglass_empty" : "download"} size={16} />
      </button>
    </div>
  );
}

const transformDetail = (v: any): VersionDetail => {
  const century = `${v.century_gregorian_start || ""}-${v.century_gregorian_end || ""}`.replace(/^-+|-+$/g, "");
  const birth = formatScholarDate((v.scholar_dates || []).find((d: any) => d.date_type === "birth"));
  const death = formatScholarDate((v.scholar_dates || []).find((d: any) => d.date_type === "death"));

  return {
    scholarId: v.scholar_id,
    name: v.canonical_name || "Unknown",
    bio: v.biography || "",
    image: v.image_url || null,
    region: v.regions?.name || "",
    century: century || "Unknown",
    aliases: (v.scholar_aliases || []).map((a: any) => a.alias_name),
    birth: birth || "Unknown",
    death: death || "Unknown",
    disciplines: (v.scholar_disciplines || []).map((d: any) => d.disciplines?.name).filter(Boolean),
    
    works: (v.scholar_works || []).map((w: any) => ({
      id: w.work_id, 
      title: w.title, 
      year: w.year?.toString() || "", 
      format: w.format,
      access: w.media_url || w.file_path,
      accessSource: (w.source_type === "upload" ? "upload" : "link") as "upload" | "link",
      fileName: w.file_name || null, // ✅ Captures original filename with extension
    })),
    
    media: (v.media || []).map((m: any) => ({
      id: m.media_id, 
      title: m.title || "Untitled", 
      meta: m.file_type || "file",
      type: (m.source_type === "upload" ? "Upload" : "Link") as "Upload" | "Link",
      description: m.description || "",
      access: m.media_url || m.file_path || m.external_url,
      accessSource: (m.source_type === "upload" ? "upload" : "link") as "upload" | "link",
      fileName: m.file_name || null, // ✅ Captures original filename with extension
    })),
    references: (v.scholar_references || []).map((r: any) => ({
      id: r.reference_id, title: r.title, citation: r.citation, url: r.url,
    })),
    relationships: (v.scholar_relationships_as_source || []).map((r: any) => ({
      type: r.relation_type,
      name: r.related_scholar_version?.canonical_name || "Unknown",
      relatedScholarId: r.related_scholar_version?.scholar_id ?? null,
    })),
    editor: v.users?.username || "Unknown",
    createdAt: v.created_at ? new Date(v.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "",
  };
};

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */
export default function AdminScholarDetail() {
  const { id, lang: langParam } = useParams<{ id: string; lang: string }>();
  const navigate = useNavigate();
  const { lang: siteLang } = useLang();
  const isRTL = siteLang === "AR";

  const [detail, setDetail] = useState<VersionDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDetail = async () => {
      if (!id || !langParam) return;
      setIsLoading(true);
      setError(null);
      try {
        const response = await adminApi.scholars.getVersionDetail(Number(id), langParam);
        if (response.data?.success && response.data.data) {
          setDetail(transformDetail(response.data.data));
        } else {
          setError("Version not found");
        }
      } catch (err) {
        console.error("Failed to fetch scholar version detail:", err);
        setError("Failed to load this version");
      } finally {
        setIsLoading(false);
      }
    };
    fetchDetail();
  }, [id, langParam]);

  const thStyle: React.CSSProperties = { fontFamily: fonts.label, fontSize: 11, letterSpacing: "0.06em", fontWeight: 600, color: colors.forestGreen, textAlign: isRTL ? "right" : "left", padding: "12px 14px", borderBottom: `1px solid ${colors.forestGreen}`, textTransform: "uppercase", opacity: 0.8 };
  const tdStyle: React.CSSProperties = { fontFamily: fonts.body, fontSize: 13, color: colors.forestGreen, padding: "14px", borderBottom: `1px solid ${colors.creamDark}`, textAlign: isRTL ? "right" : "left" };

  if (isLoading) {
    return <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: colors.creamLight, color: colors.forestGreen }}><Icon name="hourglass_empty" size={32} /></div>;
  }

  if (error || !detail) {
    return (
      <div dir={isRTL ? "rtl" : "ltr"} style={{ fontFamily: fonts.body, color: colors.forestGreen, backgroundColor: colors.creamLight, minHeight: "100vh", padding: 24 }}>
        <div style={{ maxWidth: 600, margin: "80px auto", textAlign: "center" }}>
          <Icon name="person_off" size={40} />
          <p style={{ fontFamily: fonts.headline, fontSize: 18, fontWeight: 700, margin: "12px 0 20px" }}>{error || "Not found"}</p>
          <button onClick={() => navigate("/admin/scholars")} style={{ padding: "8px 16px", borderRadius: 8, border: `1px solid ${colors.forestGreen}`, backgroundColor: "transparent", color: colors.forestGreen, cursor: "pointer", fontFamily: fonts.body, fontSize: 13 }}>
            Back to All Scholars
          </button>
        </div>
      </div>
    );
  }

  return (
    <div dir={isRTL ? "rtl" : "ltr"} style={{ fontFamily: fonts.body, color: colors.forestGreen, backgroundColor: colors.creamLight, minHeight: "100vh", padding: 24 }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>

        <button
          onClick={() => navigate("/admin/scholars")}
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", backgroundColor: "transparent", border: `1px solid ${colors.forestGreen}`, borderRadius: 8, fontFamily: fonts.body, fontSize: 12, color: colors.forestGreen, cursor: "pointer", marginBottom: 16 }}
        >
          <Icon name={isRTL ? "arrow_forward" : "arrow_back"} size={14} /> Back to All Scholars
        </button>

        {/* ── HEADER: image + core facts ── */}
        <div style={{ ...cardStyle, padding: 24, marginBottom: 18, display: "flex", gap: 24, flexWrap: "wrap" }}>
          <div style={{ width: 140, height: 140, borderRadius: 12, overflow: "hidden", backgroundColor: colors.creamMid, border: `2px solid ${colors.forestGreen}`, flexShrink: 0 }}>
            {detail.image ? (
              <img src={detail.image} alt={detail.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: colors.forestGreen }}><Icon name="account_circle" size={64} /></div>
            )}
          </div>

          <div style={{ flex: 1, minWidth: 260 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 8 }}>
              <h1 style={{ fontFamily: fonts.headline, fontSize: 24, fontWeight: 700, margin: 0 }}>{detail.name}</h1>
              <span style={{ padding: "2px 9px", borderRadius: 4, backgroundColor: colors.creamMid, fontFamily: fonts.label, fontSize: 10, fontWeight: 700, letterSpacing: "0.06em", border: `1px solid ${colors.forestGreen}` }}>{langParam?.toUpperCase()}</span>
            </div>

            <div style={{ display: "flex", gap: 18, flexWrap: "wrap", marginBottom: 14 }}>
              <span style={{ fontFamily: fonts.label, fontSize: 11, opacity: 0.75, display: "flex", alignItems: "center", gap: 4 }}><Icon name="person" size={13} /> Editor: <strong>{detail.editor}</strong></span>
              <span style={{ fontFamily: fonts.label, fontSize: 11, opacity: 0.75, display: "flex", alignItems: "center", gap: 4 }}><Icon name="calendar_today" size={13} /> {detail.createdAt}</span>
              <span style={{ fontFamily: fonts.label, fontSize: 11, opacity: 0.75, display: "flex", alignItems: "center", gap: 4 }}><Icon name="fingerprint" size={13} /> Scholar ID: {detail.scholarId}</span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 14 }}>
              <div>
                <p style={{ fontFamily: fonts.label, fontSize: 10, opacity: 0.6, margin: "0 0 2px" }}>BORN</p>
                <p style={{ fontFamily: fonts.body, fontSize: 13, margin: 0 }}>{detail.birth}</p>
              </div>
              <div>
                <p style={{ fontFamily: fonts.label, fontSize: 10, opacity: 0.6, margin: "0 0 2px" }}>DIED</p>
                <p style={{ fontFamily: fonts.body, fontSize: 13, margin: 0 }}>{detail.death}</p>
              </div>
              <div>
                <p style={{ fontFamily: fonts.label, fontSize: 10, opacity: 0.6, margin: "0 0 2px" }}>CENTURY</p>
                <p style={{ fontFamily: fonts.body, fontSize: 13, margin: 0 }}>{detail.century}</p>
              </div>
              {detail.region && (
                <div>
                  <p style={{ fontFamily: fonts.label, fontSize: 10, opacity: 0.6, margin: "0 0 2px" }}>REGION</p>
                  <p style={{ fontFamily: fonts.body, fontSize: 13, margin: 0 }}>{detail.region}</p>
                </div>
              )}
              {detail.aliases.length > 0 && (
                <div style={{ gridColumn: "1 / -1" }}>
                  <p style={{ fontFamily: fonts.label, fontSize: 10, opacity: 0.6, margin: "0 0 2px" }}>ALIASES</p>
                  <p style={{ fontFamily: fonts.body, fontSize: 13, margin: 0 }}>{detail.aliases.join(", ")}</p>
                </div>
              )}
            </div>

            {detail.disciplines.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 16 }}>
                {detail.disciplines.map((d) => (
                  <span key={d} style={{ padding: "4px 10px", borderRadius: 20, backgroundColor: colors.creamMid, border: `1px solid ${colors.forestGreen}`, fontFamily: fonts.body, fontSize: 11, fontWeight: 600 }}>{d}</span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── BIOGRAPHY ── */}
        {detail.bio && (
          <div style={{ ...cardStyle, padding: 24, marginBottom: 18 }}>
            <h2 style={{ fontFamily: fonts.headline, fontSize: 15, fontWeight: 700, margin: "0 0 12px", display: "flex", alignItems: "center", gap: 8 }}><Icon name="menu_book" size={17} filled /> Biography</h2>
            <p style={{ fontFamily: fonts.body, fontSize: 14, lineHeight: 1.75, margin: 0, whiteSpace: "pre-line" }}>{detail.bio}</p>
          </div>
        )}

        {/* ── RELATIONSHIPS ── */}
        {detail.relationships.length > 0 && (
          <div style={{ ...cardStyle, padding: 20, marginBottom: 18 }}>
            <h2 style={{ fontFamily: fonts.headline, fontSize: 15, fontWeight: 700, margin: "0 0 12px", display: "flex", alignItems: "center", gap: 8 }}><Icon name="hub" size={17} filled /> Relationships ({detail.relationships.length})</h2>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {detail.relationships.map((r, i) => (
                <span
                  key={i}
                  onClick={() => r.relatedScholarId && navigate(`/admin/scholars/${r.relatedScholarId}/${langParam}`)}
                  style={{ fontFamily: fonts.body, fontSize: 12, padding: "5px 12px", borderRadius: 6, backgroundColor: "rgba(11,67,53,0.06)", cursor: r.relatedScholarId ? "pointer" : "default" }}
                >
                  {r.type}: <strong>{r.name}</strong>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* ── WORKS (Updated with fileName) ── */}
        {detail.works.length > 0 && (
          <div style={{ ...cardStyle, padding: 20, marginBottom: 18 }}>
            <h2 style={{ fontFamily: fonts.headline, fontSize: 15, fontWeight: 700, margin: "0 0 12px", display: "flex", alignItems: "center", gap: 8 }}><Icon name="menu_book" size={17} filled /> Works ({detail.works.length})</h2>
            <div style={{ overflowX: "auto", border: `1px solid ${colors.creamDark}`, borderRadius: 8 }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead style={{ backgroundColor: colors.creamMid }}>
                  <tr><th style={thStyle}>Title</th><th style={thStyle}>Year</th><th style={thStyle}>Format</th><th style={thStyle}>Access</th></tr>
                </thead>
                <tbody>
                  {detail.works.map((w) => (
                    <tr key={w.id}>
                      <td style={{ ...tdStyle, fontFamily: fonts.headline, fontStyle: "italic" }}>{w.title}</td>
                      <td style={tdStyle}>{w.year}</td>
                      <td style={tdStyle}><span style={{ fontFamily: fonts.label, fontSize: 9, fontWeight: 700, padding: "3px 9px", borderRadius: 4, backgroundColor: colors.creamMid }}>{w.format}</span></td>
                      <td style={tdStyle}>
                        {w.access ? (
                          <FileActions 
                            url={w.access} 
                            filename={w.fileName || w.title || "work"} 
                            mediaType={getAccessType(w.access)} 
                            accessSource={w.accessSource} 
                          />
                        ) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── MEDIA (Keep old design, add proper buttons with fileName) ── */}
        {detail.media.length > 0 && (
          <div style={{ ...cardStyle, padding: 20, marginBottom: 18 }}>
            <h2 style={{ fontFamily: fonts.headline, fontSize: 15, fontWeight: 700, margin: "0 0 12px", display: "flex", alignItems: "center", gap: 8 }}>
              <Icon name="folder_open" size={17} filled /> Media ({detail.media.length})
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {detail.media.map((m) => {
                // ✅ Extract filename from URL if fileName is not available from backend
                const downloadName = m.fileName || (m.access ? m.access.split('/').pop()?.split('?')[0] || "file.pdf" : "file.pdf");

                return (
                  <div key={m.id} style={{ display: "flex", gap: 10, padding: 10, border: `1px solid ${colors.creamDark}`, borderRadius: 8, alignItems: "center" }}>
                    <div style={{ width: 34, height: 34, borderRadius: 6, backgroundColor: colors.creamMid, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Icon name={getMediaIcon(m.meta)} size={18} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontFamily: fonts.headline, fontSize: 13, fontWeight: 600, margin: "0 0 2px" }}>{m.title}</p>
                      <p style={{ fontFamily: fonts.body, fontSize: 11, opacity: 0.8, margin: 0 }}>{m.meta} · {m.type}{m.description ? ` · ${m.description}` : ""}</p>
                    </div>
                    
                    {/* BUTTONS */}
                    {m.access && (
                      <div style={{ alignSelf: "center", display: "flex", gap: 6 }}>
                        {m.type === "Upload" ? (
                          <>
                            {/* VIEW Button for Uploads */}
                            <button
                              onClick={async (e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                try {
                                  const response = await fetch(m.access!);
                                  const blob = await response.blob();
                                  const typedBlob = new Blob([blob], { 
                                    type: m.meta?.includes("video") ? "video/mp4" : m.meta?.includes("audio") ? "audio/mpeg" : "application/pdf" 
                                  });
                                  const blobUrl = URL.createObjectURL(typedBlob);
                                  window.open(blobUrl, "_blank");
                                  setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
                                } catch (err) {
                                  console.error("View failed:", err);
                                  window.open(m.access, "_blank");
                                }
                              }}
                              style={{ 
                                padding: "6px 12px", 
                                borderRadius: 6, 
                                border: `1.5px solid ${colors.forestGreen}`, 
                                backgroundColor: "transparent", 
                                color: colors.forestGreen,
                                fontFamily: fonts.label,
                                fontSize: 10,
                                fontWeight: 700,
                                letterSpacing: "0.05em",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                gap: 4,
                                transition: "all 0.2s ease"
                              }}
                              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "rgba(11,67,53,0.05)"; }}
                              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
                            >
                              <Icon name="visibility" size={14} /> VIEW
                            </button>
                            
                            {/* DOWNLOAD Button for Uploads */}
                            <button
                              onClick={async (e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                try {
                                  // 1. Fetch the file as a Blob
                                  const response = await fetch(m.access!);
                                  if (!response.ok) throw new Error('Network response was not ok');
                                  const blob = await response.blob();
                                  
                                  // 2. Create a local object URL
                                  const blobUrl = window.URL.createObjectURL(blob);
                                  
                                  // 3. Trigger the download with the correct filename
                                  const link = document.createElement("a");
                                  link.href = blobUrl;
                                  link.download = downloadName;
                                  document.body.appendChild(link);
                                  link.click();
                                  document.body.removeChild(link);
                                  
                                  // 4. Clean up memory
                                  window.URL.revokeObjectURL(blobUrl);
                                } catch (err) {
                                  console.error("Download failed:", err);
                                  window.open(m.access, "_blank");
                                }
                              }}
                              style={{ 
                                padding: "6px 12px", 
                                borderRadius: 6, 
                                border: `1.5px solid ${colors.forestGreen}`, 
                                backgroundColor: colors.forestGreen, 
                                color: colors.creamLight,
                                fontFamily: fonts.label,
                                fontSize: 10,
                                fontWeight: 700,
                                letterSpacing: "0.05em",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                gap: 4,
                                transition: "all 0.2s ease"
                              }}
                              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#083328"; }}
                              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = colors.forestGreen; }}
                            >
                              <Icon name="download" size={14} /> DOWNLOAD
                            </button>
                          </>
                        ) : (
                          /* OPEN LINK Button for Links */
                          <a
                            href={m.access}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ textDecoration: "none" }}
                          >
                            <button
                              style={{ 
                                padding: "6px 12px", 
                                borderRadius: 6, 
                                border: `1.5px solid ${colors.forestGreen}`, 
                                backgroundColor: colors.forestGreen, 
                                color: colors.creamLight,
                                fontFamily: fonts.label,
                                fontSize: 10,
                                fontWeight: 700,
                                letterSpacing: "0.05em",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                gap: 4,
                                transition: "all 0.2s ease"
                              }}
                              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#083328"; }}
                              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = colors.forestGreen; }}
                            >
                              OPEN LINK <Icon name="open_in_new" size={14} />
                            </button>
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── REFERENCES ── */}
        {detail.references.length > 0 && (
          <div style={{ ...cardStyle, padding: 20, marginBottom: 18 }}>
            <h2 style={{ fontFamily: fonts.headline, fontSize: 15, fontWeight: 700, margin: "0 0 12px", display: "flex", alignItems: "center", gap: 8 }}><Icon name="link" size={17} filled /> References ({detail.references.length})</h2>
            <div style={{ overflowX: "auto", border: `1px solid ${colors.creamDark}`, borderRadius: 8 }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead style={{ backgroundColor: colors.creamMid }}>
                  <tr><th style={thStyle}>Title</th><th style={thStyle}>Citation</th><th style={thStyle}>URL</th></tr>
                </thead>
                <tbody>
                  {detail.references.map((r) => (
                    <tr key={r.id}>
                      <td style={{ ...tdStyle, fontFamily: fonts.headline, fontStyle: "italic" }}>{r.title}</td>
                      <td style={tdStyle}>{r.citation}</td>
                      <td style={tdStyle}>{r.url ? <a href={r.url} target="_blank" rel="noopener noreferrer" style={{ fontFamily: fonts.label, fontSize: 10, fontWeight: 700, color: colors.forestGreen, textDecoration: "underline" }}>View</a> : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}