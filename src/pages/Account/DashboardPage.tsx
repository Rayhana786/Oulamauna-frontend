// src/pages/Authentication/DashboardPage.tsx

import React, { useState, useMemo, useEffect } from "react";
import { useLang } from "../../context/LanguageContext";
import { useAuth } from "../../context/AuthContext";
import { scholarsApi } from "../../api/scholarsApi";
import ProfileSidebar from "../../components/ProfileSidebar";
import { useNavigate, Link } from "react-router-dom";
import DOMPurify from 'dompurify';
/* ─────────────────────────────────────────────
   Oulamauna — Dashboard (User / Contributor)
───────────────────────────────────────────── */

type Status = "DRAFT" | "PENDING" | "APPROVED" | "REJECTED" | "SUPERSEDED";
type SubmissionKind = "new" | "edit";
type UserTab = "overview" | "notifications";
type ContributorTab = UserTab | "submissions" | "media" | "works";
type StatusFilter = "ALL" | Status;

const MONO: React.CSSProperties = { fontFamily: "'JetBrains Mono', monospace" };
const SERIF: React.CSSProperties = { fontFamily: "'Source Serif 4', serif" };
const SANS: React.CSSProperties = { fontFamily: "'Source Sans 3', sans-serif" };

const GREEN = "#0b4335";
const GREEN_LIGHT = "rgba(11,67,53,0.06)";
const GREEN_BORDER = "rgba(11,67,53,0.15)";
const BORDER = "rgba(192,201,195,0.4)";
const MUTED = "#707974";
const RED = "#b3261e";

const BTN_PRIMARY: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: "6px", padding: "8px 18px",
  border: `1.5px solid ${GREEN}`, borderRadius: "6px", backgroundColor: "transparent", color: GREEN,
  fontSize: "10px", fontWeight: 700, letterSpacing: "0.1em", cursor: "pointer",
  transition: "background 0.15s, color 0.15s", ...MONO,
};

/* ── Types ───── */
interface Submission {
  id: number; // version_id
  scholarId: number;
  kind: SubmissionKind;
  scholarName: string;
  lang: string;
  version: number;
  date: string;
  status: Status;
}

// ✅ FIX: TableRow now carries the item's OWN file/id info, so a
// media/work item can be viewed using its own status — independent
// of whatever status the parent scholar version happens to be in.
interface TableRow {
  id?: number;             // work_id or media_id
  primary: string;
  secondary: React.ReactNode;
  tertiary?: string;
  date: string;
  status: Status;
  scholarId?: number;
  link?: string;           // live scholar page link (only meaningful when APPROVED)
  mediaUrl?: string;
  filePath?: string;
  fileType?: string;
  fileName?: string;
  sourceType?: string;     // "upload" | "link" etc.
  description?: string;
}

/* ── Modals ─────────────────────────────────────── */
function PreviewModal({ item, onClose }: { item: any; onClose: () => void }) {
  const [versionData, setVersionData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [viewingFile, setViewingFile] = useState<string | null>(null);
  const [downloadingFile, setDownloadingFile] = useState<string | null>(null);

  useEffect(() => {
    scholarsApi.getVersionById(item.id)
      .then((res) => {
        setVersionData(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load preview:", err);
        setLoading(false);
      });
  }, [item.id]);

  const MONO = { fontFamily: "'JetBrains Mono', monospace" };
  const SERIF = { fontFamily: "'Source Serif 4', serif" };
  const GREEN = "#0b4335";
  const BORDER = "rgba(192,201,195,0.4)";
  const MUTED = "#707974";

  const handleViewFile = async (url: string, fileType: string, id: string) => {
    setViewingFile(id);
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const correctType = fileType?.includes("audio") ? "audio/mpeg" : 
                        fileType?.includes("video") ? "video/mp4" : 
                        "application/pdf";
      const typedBlob = new Blob([blob], { type: correctType });
      const blobUrl = URL.createObjectURL(typedBlob);
      window.open(blobUrl, "_blank");
      setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
    } catch (error) {
      console.error("View failed:", error);
      window.open(url, "_blank");
    } finally {
      setViewingFile(null);
    }
  };

  const handleDownloadFile = async (url: string, filename: string, id: string) => {
    setDownloadingFile(id);
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = filename || "file.pdf";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Download failed:", error);
      window.open(url, "_blank");
    } finally {
      setDownloadingFile(null);
    }
  };

  return (
    <div 
      style={{ 
        position: "fixed", inset: 0, zIndex: 200, 
        backgroundColor: "rgba(25,28,27,0.85)", 
        display: "flex", alignItems: "center", justifyContent: "center", 
        backdropFilter: "blur(6px)" 
      }} 
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div 
        style={{ 
          backgroundColor: "#fff", borderRadius: "20px", 
          width: "95%", maxWidth: "1200px", height: "90vh", 
          display: "flex", flexDirection: "row", // Split view
          boxShadow: "0 25px 80px rgba(0,0,0,0.4)", border: `1px solid ${BORDER}`,
          overflow: "hidden"
        }}
      >
        {/* ─────────────────────────────────────────────
            LEFT SIDEBAR (Sticky Profile Info)
        ───────────────────────────────────────────── */}
        <div style={{ 
          width: "320px", flexShrink: 0, 
          borderRight: `1px solid ${BORDER}`, 
          backgroundColor: "#fafbf8",
          display: "flex", flexDirection: "column",
          overflowY: "auto"
        }}>
          {/* Portrait */}
          <div style={{ 
            width: "100%", aspectRatio: "3/4", 
            backgroundColor: "#e7e8e6", borderBottom: `1px solid ${BORDER}`
          }}>
            {versionData?.image_url ? (
              <img 
                src={versionData.image_url} 
                alt={versionData.canonical_name} 
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#c0c9c3" }}>
                <span className="material-symbols-outlined" style={{ fontSize: "80px" }}>account_circle</span>
              </div>
            )}
          </div>

          {/* Sidebar Content */}
          <div style={{ padding: "24px", flex: 1, display: "flex", flexDirection: "column", gap: "24px" }}>
            
            {/* Basic Info */}
            {versionData?.regions && (
              <div>
                <h4 style={{ ...MONO, fontSize: "10px", color: MUTED, letterSpacing: "0.12em", marginBottom: "8px", textTransform: "uppercase" }}>Region</h4>
                <p style={{ fontSize: "15px", fontWeight: 600, color: "#191c1b", margin: 0 }}>{versionData.regions.name}</p>
              </div>
            )}
            
            {versionData?.scholar_dates && versionData.scholar_dates.length > 0 && (
              <div>
                <h4 style={{ ...MONO, fontSize: "10px", color: MUTED, letterSpacing: "0.12em", marginBottom: "8px", textTransform: "uppercase" }}>Dates</h4>
                {versionData.scholar_dates.map((d: any, i: number) => (
                  <div key={i} style={{ fontSize: "14px", color: "#404945", marginBottom: "4px" }}>
                    <span style={{ textTransform: "capitalize", fontWeight: 600 }}>{d.date_type}</span>: {d.year} ({d.calendar})
                  </div>
                ))}
              </div>
            )}

            {versionData?.scholar_aliases && versionData.scholar_aliases.length > 0 && (
              <div>
                <h4 style={{ ...MONO, fontSize: "10px", color: MUTED, letterSpacing: "0.12em", marginBottom: "8px", textTransform: "uppercase" }}>Also Known As</h4>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  {versionData.scholar_aliases.map((alias: any, i: number) => (
                    <span key={i} style={{ 
                      padding: "4px 10px", backgroundColor: GREEN, color: "#fff", 
                      borderRadius: "12px", fontSize: "11px", fontWeight: 600
                    }}>{alias.alias_name}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Status Badge (Pushed to bottom) */}
            <div style={{ marginTop: "auto", paddingTop: "24px", borderTop: `1px solid ${BORDER}` }}>
              <div style={{ 
                padding: "16px", backgroundColor: "rgba(115,92,0,0.05)", 
                borderRadius: "12px", border: "1px solid rgba(115,92,0,0.2)",
                display: "flex", alignItems: "center", gap: "12px"
              }}>
                <div style={{ 
                  width: "36px", height: "36px", borderRadius: "50%", 
                  backgroundColor: "rgba(115,92,0,0.15)", 
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px"
                }}></div>
                <div>
                  <p style={{ ...MONO, fontSize: "9px", fontWeight: 700, color: "#735c00", margin: 0, letterSpacing: "0.1em" }}>WAITING FOR REVIEW</p>
                  <p style={{ fontSize: "11px", color: "#735c00", margin: "4px 0 0", lineHeight: 1.4 }}>An admin is currently reviewing this submission.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ─────────────────────────────────────────────
            RIGHT MAIN AREA (Scrollable Content)
        ───────────────────────────────────────────── */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          
          {/* Header */}
          <div style={{ 
            padding: "24px 32px", 
            borderBottom: `1px solid ${BORDER}`, 
            display: "flex", justifyContent: "space-between", alignItems: "center",
            backgroundColor: "#fff"
          }}>
            <div>
              <h2 style={{ ...SERIF, fontSize: "28px", fontWeight: 700, color: GREEN, margin: 0 }}>
                {versionData?.canonical_name || item.scholarName || "Untitled Submission"}
              </h2>
              <p style={{ ...MONO, fontSize: "11px", color: MUTED, marginTop: "6px", letterSpacing: "0.05em" }}>
                {item.kind === 'new' ? 'New Scholar Submission' : 'Edit Proposal'} • {item.lang.toUpperCase()} • Submitted {item.date}
              </p>
            </div>
            <button 
              onClick={onClose} 
              style={{ 
                background: "none", border: "none", cursor: "pointer", 
                color: MUTED, fontSize: "24px", padding: "8px", borderRadius: "50%",
                display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s"
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "rgba(179,38,30,0.1)"; (e.currentTarget as HTMLButtonElement).style.color = "#b3261e"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent"; (e.currentTarget as HTMLButtonElement).style.color = MUTED; }}
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          {/* Scrollable Content */}
          <div style={{ flex: 1, overflowY: "auto", padding: "32px" }}>
            {loading ? (
              <div style={{ textAlign: "center", padding: "80px 40px", color: MUTED }}>
                <div style={{ fontSize: "48px", marginBottom: "20px" }}></div>
                <p style={{ fontSize: "16px", fontWeight: 600 }}>Loading submission details...</p>
              </div>
            ) : versionData ? (
              <div style={{ maxWidth: "800px", margin: "0 auto" }}>
                
                {/* Biography Section */}
                {versionData.biography && (
                  <section style={{ marginBottom: "48px" }}>
                    <h3 style={{ 
                      ...MONO, fontSize: "11px", color: GREEN, letterSpacing: "0.15em", 
                      marginBottom: "16px", paddingBottom: "12px", 
                      borderBottom: `2px solid ${GREEN}`, textTransform: "uppercase" 
                    }}>Biography</h3>
                    <div 
                      style={{ 
                        fontSize: "15px", lineHeight: "1.8", color: "#191c1b", 
                        fontFamily: SERIF.fontFamily,
                        padding: "24px", backgroundColor: "rgba(11,67,53,0.02)",
                        borderRadius: "12px", border: `1px solid ${BORDER}`
                      }}
                      dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(versionData.biography) }} 
                    />
                  </section>
                )}

                {/* Works Section */}
                {versionData.scholar_works && versionData.scholar_works.length > 0 && (
                  <section style={{ marginBottom: "48px" }}>
                    <h3 style={{ 
                      ...MONO, fontSize: "11px", color: GREEN, letterSpacing: "0.15em", 
                      marginBottom: "16px", paddingBottom: "12px", 
                      borderBottom: `2px solid ${GREEN}`, textTransform: "uppercase" 
                    }}>Works & Publications ({versionData.scholar_works.length})</h3>
                    <div style={{ border: `1px solid ${BORDER}`, borderRadius: "12px", overflow: "hidden", backgroundColor: "#fff" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead>
                          <tr style={{ backgroundColor: "#f3f4f1", borderBottom: "1.5px solid rgba(192,201,195,0.4)" }}>
                            <th style={{ ...MONO, padding: "12px 16px", textAlign: "left", fontSize: "9px", color: MUTED, letterSpacing: "0.1em", fontWeight: 700 }}>TITLE</th>
                            <th style={{ ...MONO, padding: "12px 16px", textAlign: "left", fontSize: "9px", color: MUTED, letterSpacing: "0.1em", fontWeight: 700, width: "80px" }}>YEAR</th>
                            <th style={{ ...MONO, padding: "12px 16px", textAlign: "left", fontSize: "9px", color: MUTED, letterSpacing: "0.1em", fontWeight: 700, width: "120px" }}>FORMAT</th>
                            <th style={{ ...MONO, padding: "12px 16px", textAlign: "left", fontSize: "9px", color: MUTED, letterSpacing: "0.1em", fontWeight: 700, width: "140px" }}>ACCESS</th>
                          </tr>
                        </thead>
                        <tbody>
                          {versionData.scholar_works.map((w: any, i: number) => {
                            const hasFile = w.media_url || w.file_path;
                            const isUpload = w.source_type === "upload";
                            const fileId = `work-${i}`;
                            
                            return (
                              <tr key={i} style={{ borderBottom: i === versionData.scholar_works.length - 1 ? "none" : "1px solid #f0f1ee" }}>
                                <td style={{ ...SERIF, padding: "14px 16px", fontSize: "14px", fontWeight: 700, fontStyle: "italic", color: "#191c1b" }}>
                                  {w.title}
                                  {w.description && <div style={{ ...MONO, fontSize: "11px", fontStyle: "normal", fontWeight: 400, color: MUTED, marginTop: "4px" }}>{w.description}</div>}
                                </td>
                                <td style={{ padding: "14px 16px", fontSize: "13px", color: MUTED }}>{w.year || "—"}</td>
                                <td style={{ padding: "14px 16px" }}>
                                  <span style={{ ...MONO, fontSize: "9px", fontWeight: 700, padding: "3px 10px", borderRadius: "4px", backgroundColor: "rgba(11,67,53,0.08)", color: GREEN }}>
                                    {w.format}
                                  </span>
                                </td>
                                <td style={{ padding: "14px 16px" }}>
                                  {hasFile ? (
                                    <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                                      {isUpload ? (
                                        <>
                                          <button 
                                            title="View" disabled={viewingFile === fileId}
                                            onClick={() => handleViewFile(w.media_url || w.file_path, w.file_type, fileId)}
                                            style={{ 
                                              display: "flex", alignItems: "center", justifyContent: "center",
                                              width: "32px", height: "32px", borderRadius: "6px",
                                              border: `1.5px solid ${GREEN}`, backgroundColor: viewingFile === fileId ? "#c0c9c3" : "transparent", 
                                              color: viewingFile === fileId ? "#fff" : GREEN, cursor: "pointer", transition: "all 0.15s"
                                            }}
                                          >
                                            <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>{viewingFile === fileId ? "hourglass_empty" : "visibility"}</span>
                                          </button>
                                          <button 
                                            title="Download" disabled={downloadingFile === fileId}
                                            onClick={() => handleDownloadFile(w.media_url || w.file_path, w.file_name || w.title, fileId)}
                                            style={{ 
                                              display: "flex", alignItems: "center", justifyContent: "center",
                                              width: "32px", height: "32px", borderRadius: "6px",
                                              border: `1.5px solid ${GREEN}`, backgroundColor: downloadingFile === fileId ? "#c0c9c3" : GREEN, 
                                              color: "#fff", cursor: "pointer", transition: "all 0.15s"
                                            }}
                                          >
                                            <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>{downloadingFile === fileId ? "hourglass_empty" : "download"}</span>
                                          </button>
                                        </>
                                      ) : (
                                        <a href={w.media_url} target="_blank" rel="noopener noreferrer"
                                          style={{ display: "inline-flex", alignItems: "center", gap: "4px", ...MONO, fontSize: "9px", fontWeight: 700, color: GREEN, textDecoration: "none", padding: "6px 10px", border: `1.5px solid ${GREEN}`, borderRadius: "6px" }}>
                                          <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>open_in_new</span> VIEW
                                        </a>
                                      )}
                                    </div>
                                  ) : <span style={{ fontSize: "13px", color: "#c0c9c3" }}>—</span>}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </section>
                )}

                {/* Media Section */}
                {versionData.media && versionData.media.length > 0 && (
                  <section style={{ marginBottom: "48px" }}>
                    <h3 style={{ 
                      ...MONO, fontSize: "11px", color: GREEN, letterSpacing: "0.15em", 
                      marginBottom: "16px", paddingBottom: "12px", 
                      borderBottom: `2px solid ${GREEN}`, textTransform: "uppercase" 
                    }}>Media Library ({versionData.media.length})</h3>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "16px" }}>
                      {versionData.media.map((m: any, i: number) => {
                        const hasFile = m.media_url || m.file_path;
                        const isUpload = m.source_type === "upload";
                        const mediaType = m.file_type || "pdf";
                        const icon = mediaType.includes("audio") ? "graphic_eq" : mediaType.includes("video") ? "movie" : "article";
                        const fileId = `media-${i}`;
                        
                        return (
                          <div key={i} style={{ padding: "20px", backgroundColor: "#fafbf8", borderRadius: "12px", border: `1px solid ${BORDER}`, display: "flex", flexDirection: "column", gap: "12px" }}>
                            <span className="material-symbols-outlined" style={{ fontSize: "32px", color: GREEN }}>{icon}</span>
                            <div>
                              <p style={{ margin: "0 0 4px", fontWeight: 700, fontSize: "15px", color: "#191c1b" }}>{m.title}</p>
                              {m.description && <p style={{ margin: "0 0 8px", fontSize: "13px", color: MUTED, lineHeight: "1.5" }}>{m.description}</p>}
                              <p style={{ margin: 0, fontSize: "11px", color: MUTED, ...MONO }}>{m.year && <span>{m.year} • </span>}{mediaType.toUpperCase()}</p>
                            </div>
                            {hasFile && (
                              <div style={{ display: "flex", gap: "8px", marginTop: "auto" }}>
                                {isUpload ? (
                                  <>
                                    <button onClick={() => handleViewFile(m.media_url || m.file_path, m.file_type, fileId)} disabled={viewingFile === fileId}
                                      style={{ flex: 1, padding: "8px", border: `1.5px solid ${GREEN}`, backgroundColor: viewingFile === fileId ? "#c0c9c3" : "transparent", color: viewingFile === fileId ? "#fff" : GREEN, borderRadius: "6px", fontSize: "9px", fontWeight: 700, ...MONO, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}>
                                      <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>{viewingFile === fileId ? "hourglass_empty" : "visibility"}</span> VIEW
                                    </button>
                                    <button onClick={() => handleDownloadFile(m.media_url || m.file_path, m.file_name || m.title, fileId)} disabled={downloadingFile === fileId}
                                      style={{ flex: 1, padding: "8px", border: `1.5px solid ${GREEN}`, backgroundColor: downloadingFile === fileId ? "#c0c9c3" : GREEN, color: "#fff", borderRadius: "6px", fontSize: "9px", fontWeight: 700, ...MONO, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}>
                                      <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>{downloadingFile === fileId ? "hourglass_empty" : "download"}</span> DL
                                    </button>
                                  </>
                                ) : (
                                  <a href={m.media_url} target="_blank" rel="noopener noreferrer"
                                    style={{ flex: 1, padding: "8px", backgroundColor: GREEN, color: "#fff", borderRadius: "6px", fontSize: "9px", fontWeight: 700, ...MONO, textDecoration: "none", textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}>
                                    <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>open_in_new</span> OPEN
                                  </a>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </section>
                )}

                {/* References Section */}
                {versionData.scholar_references && versionData.scholar_references.length > 0 && (
                  <section style={{ marginBottom: "48px" }}>
                    <h3 style={{ ...MONO, fontSize: "11px", color: GREEN, letterSpacing: "0.15em", marginBottom: "16px", paddingBottom: "12px", borderBottom: `2px solid ${GREEN}`, textTransform: "uppercase" }}>References ({versionData.scholar_references.length})</h3>
                    <div style={{ display: "grid", gap: "12px" }}>
                      {versionData.scholar_references.map((r: any, i: number) => (
                        <div key={i} style={{ padding: "16px 20px", backgroundColor: "#fafbf8", borderRadius: "8px", border: `1px solid ${BORDER}`, borderLeft: `4px solid ${GREEN}` }}>
                          <strong style={{ fontSize: "14px", color: "#191c1b" }}>{r.title}</strong>
                          {r.citation && <p style={{ margin: "4px 0 0", fontSize: "13px", color: MUTED, fontStyle: "italic" }}>{r.citation}</p>}
                          {r.url && <p style={{ margin: "8px 0 0", fontSize: "12px", color: GREEN }}>{r.url}</p>}
                        </div>
                      ))}
                    </div>
                  </section>
                )}

              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "80px 40px", color: "#b3261e" }}>
                <div style={{ fontSize: "48px", marginBottom: "20px" }}>⚠️</div>
                <p style={{ fontSize: "16px", fontWeight: 600 }}>Failed to load submission data.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function SupersededModal({ item, onClose }: { item: Submission; onClose: () => void }) {
  const [versionData, setVersionData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [viewingFile, setViewingFile] = useState<string | null>(null);
  const [downloadingFile, setDownloadingFile] = useState<string | null>(null);

  useEffect(() => {
    // ✅ Fetch the superseded version data
    scholarsApi.getVersionById(item.id)
      .then((res) => {
        setVersionData(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load superseded version:", err);
        setLoading(false);
      });
  }, [item.id]);

  const MONO = { fontFamily: "'JetBrains Mono', monospace" };
  const SERIF = { fontFamily: "'Source Serif 4', serif" };
  const GREEN = "#0b4335";
  const BORDER = "rgba(192,201,195,0.4)";
  const MUTED = "#707974";

  const handleViewFile = async (url: string, fileType: string, id: string) => {
    setViewingFile(id);
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const correctType = fileType?.includes("audio") ? "audio/mpeg" : 
                        fileType?.includes("video") ? "video/mp4" : 
                        "application/pdf";
      const typedBlob = new Blob([blob], { type: correctType });
      const blobUrl = URL.createObjectURL(typedBlob);
      window.open(blobUrl, "_blank");
      setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
    } catch (error) {
      console.error("View failed:", error);
      window.open(url, "_blank");
    } finally {
      setViewingFile(null);
    }
  };

  const handleDownloadFile = async (url: string, filename: string, id: string) => {
    setDownloadingFile(id);
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = filename || "file.pdf";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Download failed:", error);
      window.open(url, "_blank");
    } finally {
      setDownloadingFile(null);
    }
  };

  return (
    <div 
      style={{ 
        position: "fixed", inset: 0, zIndex: 200, 
        backgroundColor: "rgba(25,28,27,0.85)", 
        display: "flex", alignItems: "center", justifyContent: "center", 
        backdropFilter: "blur(6px)" 
      }} 
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div 
        style={{ 
          backgroundColor: "#fff", borderRadius: "20px", 
          width: "95%", maxWidth: "1200px", height: "90vh", 
          display: "flex", flexDirection: "row",
          boxShadow: "0 25px 80px rgba(0,0,0,0.4)", border: `1px solid ${BORDER}`,
          overflow: "hidden"
        }}
      >
        {/* ─────────────────────────────────────────────
            LEFT SIDEBAR (Sticky Profile Info)
        ───────────────────────────────────────────── */}
        <div style={{ 
          width: "320px", flexShrink: 0, 
          borderRight: `1px solid ${BORDER}`, 
          backgroundColor: "#fafbf8",
          display: "flex", flexDirection: "column",
          overflowY: "auto"
        }}>
          {/* Portrait */}
          <div style={{ 
            width: "100%", aspectRatio: "3/4", 
            backgroundColor: "#e7e8e6", borderBottom: `1px solid ${BORDER}`
          }}>
            {versionData?.image_url ? (
              <img 
                src={versionData.image_url} 
                alt={versionData.canonical_name} 
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#c0c9c3" }}>
                <span className="material-symbols-outlined" style={{ fontSize: "80px" }}>account_circle</span>
              </div>
            )}
          </div>

          {/* Sidebar Content */}
          <div style={{ padding: "24px", flex: 1, display: "flex", flexDirection: "column", gap: "24px" }}>
            
            {/* Basic Info */}
            {versionData?.regions && (
              <div>
                <h4 style={{ ...MONO, fontSize: "10px", color: MUTED, letterSpacing: "0.12em", marginBottom: "8px", textTransform: "uppercase" }}>Region</h4>
                <p style={{ fontSize: "15px", fontWeight: 600, color: "#191c1b", margin: 0 }}>{versionData.regions.name}</p>
              </div>
            )}
            
            {versionData?.scholar_dates && versionData.scholar_dates.length > 0 && (
              <div>
                <h4 style={{ ...MONO, fontSize: "10px", color: MUTED, letterSpacing: "0.12em", marginBottom: "8px", textTransform: "uppercase" }}>Dates</h4>
                {versionData.scholar_dates.map((d: any, i: number) => (
                  <div key={i} style={{ fontSize: "14px", color: "#404945", marginBottom: "4px" }}>
                    <span style={{ textTransform: "capitalize", fontWeight: 600 }}>{d.date_type}</span>: {d.year} ({d.calendar})
                  </div>
                ))}
              </div>
            )}

            {versionData?.scholar_aliases && versionData.scholar_aliases.length > 0 && (
              <div>
                <h4 style={{ ...MONO, fontSize: "10px", color: MUTED, letterSpacing: "0.12em", marginBottom: "8px", textTransform: "uppercase" }}>Also Known As</h4>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  {versionData.scholar_aliases.map((alias: any, i: number) => (
                    <span key={i} style={{ 
                      padding: "4px 10px", backgroundColor: MUTED, color: "#fff", 
                      borderRadius: "12px", fontSize: "11px", fontWeight: 600
                    }}>{alias.alias_name}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Status Badge (Pushed to bottom) */}
            <div style={{ marginTop: "auto", paddingTop: "24px", borderTop: `1px solid ${BORDER}` }}>
              <div style={{ 
                padding: "16px", backgroundColor: "rgba(112,121,116,0.08)", 
                borderRadius: "12px", border: "1px solid rgba(112,121,116,0.2)",
                display: "flex", alignItems: "center", gap: "12px"
              }}>
                <div style={{ 
                  width: "36px", height: "36px", borderRadius: "50%", 
                  backgroundColor: "rgba(112,121,116,0.15)", 
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px"
                }}>⚠️</div>
                <div>
                  <p style={{ ...MONO, fontSize: "9px", fontWeight: 700, color: MUTED, margin: 0, letterSpacing: "0.1em" }}>SUPERSEDED</p>
                  <p style={{ fontSize: "11px", color: MUTED, margin: "4px 0 0", lineHeight: 1.4 }}>This version was replaced by a newer approved version.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ────────────────────────────────────────────
            RIGHT MAIN AREA (Scrollable Content)
        ───────────────────────────────────────────── */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          
          {/* Header */}
          <div style={{ 
            padding: "24px 32px", 
            borderBottom: `1px solid ${BORDER}`, 
            display: "flex", justifyContent: "space-between", alignItems: "center",
            backgroundColor: "#fff"
          }}>
            <div>
              <h2 style={{ ...SERIF, fontSize: "28px", fontWeight: 700, color: MUTED, margin: 0 }}>
                {versionData?.canonical_name || item.scholarName || "Untitled Submission"}
              </h2>
              <p style={{ ...MONO, fontSize: "11px", color: MUTED, marginTop: "6px", letterSpacing: "0.05em" }}>
                {item.kind === 'new' ? 'New Scholar Submission' : 'Edit Proposal'} • {item.lang.toUpperCase()} • Submitted {item.date}
              </p>
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <button 
                onClick={() => { onClose(); window.location.href = `/scholars/${item.scholarId}?lang=${item.lang}`; }}
                style={{ 
                  padding: "8px 16px", borderRadius: "6px", border: `1.5px solid ${GREEN}`, 
                  backgroundColor: GREEN, color: "#fff", ...MONO, fontSize: "10px", 
                  fontWeight: 700, letterSpacing: "0.1em", cursor: "pointer",
                  display: "flex", alignItems: "center", gap: "6px"
                }}
              >
                <Icon name="check_circle" size={14} /> VIEW LIVE VERSION
              </button>
              <button 
                onClick={onClose} 
                style={{ 
                  background: "none", border: "none", cursor: "pointer", 
                  color: MUTED, fontSize: "24px", padding: "8px", borderRadius: "50%",
                  display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s"
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "rgba(179,38,30,0.1)"; (e.currentTarget as HTMLButtonElement).style.color = "#b3261e"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent"; (e.currentTarget as HTMLButtonElement).style.color = MUTED; }}
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
          </div>

          {/* Scrollable Content */}
          <div style={{ flex: 1, overflowY: "auto", padding: "32px" }}>
            {loading ? (
              <div style={{ textAlign: "center", padding: "80px 40px", color: MUTED }}>
                <div style={{ fontSize: "48px", marginBottom: "20px" }}></div>
                <p style={{ fontSize: "16px", fontWeight: 600 }}>Loading superseded version...</p>
              </div>
            ) : versionData ? (
              <div style={{ maxWidth: "800px", margin: "0 auto" }}>
                
                {/* Biography Section */}
                {versionData.biography && (
                  <section style={{ marginBottom: "48px" }}>
                    <h3 style={{ 
                      ...MONO, fontSize: "11px", color: MUTED, letterSpacing: "0.15em", 
                      marginBottom: "16px", paddingBottom: "12px", 
                      borderBottom: `2px solid ${MUTED}`, textTransform: "uppercase" 
                    }}>Biography (Archived)</h3>
                    <div 
                      style={{ 
                        fontSize: "15px", lineHeight: "1.8", color: "#191c1b", 
                        fontFamily: SERIF.fontFamily,
                        padding: "24px", backgroundColor: "rgba(112,121,116,0.04)",
                        borderRadius: "12px", border: `1px solid ${BORDER}`,
                        opacity: 0.8
                      }}
                      dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(versionData.biography) }} 
                    />
                  </section>
                )}

                {/* Works Section */}
                {versionData.scholar_works && versionData.scholar_works.length > 0 && (
                  <section style={{ marginBottom: "48px" }}>
                    <h3 style={{ 
                      ...MONO, fontSize: "11px", color: MUTED, letterSpacing: "0.15em", 
                      marginBottom: "16px", paddingBottom: "12px", 
                      borderBottom: `2px solid ${MUTED}`, textTransform: "uppercase" 
                    }}>Works & Publications ({versionData.scholar_works.length})</h3>
                    <div style={{ border: `1px solid ${BORDER}`, borderRadius: "12px", overflow: "hidden", backgroundColor: "#fff", opacity: 0.8 }}>
                      <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead>
                          <tr style={{ backgroundColor: "#f3f4f1", borderBottom: "1.5px solid rgba(192,201,195,0.4)" }}>
                            <th style={{ ...MONO, padding: "12px 16px", textAlign: "left", fontSize: "9px", color: MUTED, letterSpacing: "0.1em", fontWeight: 700 }}>TITLE</th>
                            <th style={{ ...MONO, padding: "12px 16px", textAlign: "left", fontSize: "9px", color: MUTED, letterSpacing: "0.1em", fontWeight: 700, width: "80px" }}>YEAR</th>
                            <th style={{ ...MONO, padding: "12px 16px", textAlign: "left", fontSize: "9px", color: MUTED, letterSpacing: "0.1em", fontWeight: 700, width: "120px" }}>FORMAT</th>
                          </tr>
                        </thead>
                        <tbody>
                          {versionData.scholar_works.map((w: any, i: number) => (
                            <tr key={i} style={{ borderBottom: i === versionData.scholar_works.length - 1 ? "none" : "1px solid #f0f1ee" }}>
                              <td style={{ ...SERIF, padding: "14px 16px", fontSize: "14px", fontWeight: 700, fontStyle: "italic", color: "#191c1b" }}>
                                {w.title}
                              </td>
                              <td style={{ padding: "14px 16px", fontSize: "13px", color: MUTED }}>{w.year || "—"}</td>
                              <td style={{ padding: "14px 16px" }}>
                                <span style={{ ...MONO, fontSize: "9px", fontWeight: 700, padding: "3px 10px", borderRadius: "4px", backgroundColor: "rgba(112,121,116,0.08)", color: MUTED }}>
                                  {w.format}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </section>
                )}

                {/* Media Section */}
                {versionData.media && versionData.media.length > 0 && (
                  <section style={{ marginBottom: "48px" }}>
                    <h3 style={{ 
                      ...MONO, fontSize: "11px", color: MUTED, letterSpacing: "0.15em", 
                      marginBottom: "16px", paddingBottom: "12px", 
                      borderBottom: `2px solid ${MUTED}`, textTransform: "uppercase" 
                    }}>Media Library ({versionData.media.length})</h3>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "16px" }}>
                      {versionData.media.map((m: any, i: number) => {
                        const mediaType = m.file_type || "pdf";
                        const icon = mediaType.includes("audio") ? "graphic_eq" : mediaType.includes("video") ? "movie" : "article";
                        
                        return (
                          <div key={i} style={{ padding: "20px", backgroundColor: "#fafbf8", borderRadius: "12px", border: `1px solid ${BORDER}`, display: "flex", flexDirection: "column", gap: "12px", opacity: 0.8 }}>
                            <span className="material-symbols-outlined" style={{ fontSize: "32px", color: MUTED }}>{icon}</span>
                            <div>
                              <p style={{ margin: "0 0 4px", fontWeight: 700, fontSize: "15px", color: "#191c1b" }}>{m.title}</p>
                              {m.description && <p style={{ margin: "0 0 8px", fontSize: "13px", color: MUTED, lineHeight: "1.5" }}>{m.description}</p>}
                              <p style={{ margin: 0, fontSize: "11px", color: MUTED, ...MONO }}>{m.year && <span>{m.year} • </span>}{mediaType.toUpperCase()}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                )}

                {/* References Section */}
                {versionData.scholar_references && versionData.scholar_references.length > 0 && (
                  <section style={{ marginBottom: "48px" }}>
                    <h3 style={{ ...MONO, fontSize: "11px", color: MUTED, letterSpacing: "0.15em", marginBottom: "16px", paddingBottom: "12px", borderBottom: `2px solid ${MUTED}`, textTransform: "uppercase" }}>References ({versionData.scholar_references.length})</h3>
                    <div style={{ display: "grid", gap: "12px" }}>
                      {versionData.scholar_references.map((r: any, i: number) => (
                        <div key={i} style={{ padding: "16px 20px", backgroundColor: "#fafbf8", borderRadius: "8px", border: `1px solid ${BORDER}`, borderLeft: `4px solid ${MUTED}`, opacity: 0.8 }}>
                          <strong style={{ fontSize: "14px", color: "#191c1b" }}>{r.title}</strong>
                          {r.citation && <p style={{ margin: "4px 0 0", fontSize: "13px", color: MUTED, fontStyle: "italic" }}>{r.citation}</p>}
                          {r.url && <p style={{ margin: "8px 0 0", fontSize: "12px", color: MUTED }}>{r.url}</p>}
                        </div>
                      ))}
                    </div>
                  </section>
                )}

              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "80px 40px", color: "#b3261e" }}>
                <div style={{ fontSize: "48px", marginBottom: "20px" }}>⚠️</div>
                <p style={{ fontSize: "16px", fontWeight: 600 }}>Failed to load superseded version.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ✅ NEW: Lightweight modal for a single Work/Media row.
// No API call — it uses the file fields that mySubmissions() already
// returned. Shows View/Download when a file exists, and only shows
// the "View Live Page" link when THIS item's own status is APPROVED
// (independent of whatever the parent scholar version's status is).
function FileDetailModal({ item, onClose }: { item: TableRow; onClose: () => void }) {
  const [viewingFile, setViewingFile] = useState(false);
  const [downloadingFile, setDownloadingFile] = useState(false);

  const hasFile = !!(item.mediaUrl || item.filePath);
  const isUpload = item.sourceType === "upload";
  const fileUrl = item.mediaUrl || item.filePath || "";

  const statusCopy: Record<Status, { title: string; desc: string; bg: string; color: string; border: string }> = {
    DRAFT: { title: "DRAFT", desc: "This item hasn't been submitted for review yet.", bg: "rgba(112,121,116,0.08)", color: MUTED, border: "rgba(112,121,116,0.2)" },
    PENDING: { title: "WAITING FOR REVIEW", desc: "An admin is currently reviewing this item.", bg: "rgba(115,92,0,0.05)", color: "#735c00", border: "rgba(115,92,0,0.2)" },
    APPROVED: { title: "APPROVED", desc: "This item is live on the scholar's page.", bg: GREEN_LIGHT, color: GREEN, border: GREEN_BORDER },
    REJECTED: { title: "REJECTED", desc: "This item was not approved.", bg: "rgba(179,38,30,0.06)", color: RED, border: "rgba(179,38,30,0.18)" },
    SUPERSEDED: { title: "SUPERSEDED", desc: "This item was replaced by a newer version.", bg: "rgba(112,121,116,0.08)", color: MUTED, border: "rgba(112,121,116,0.2)" },
  };
  const sc = statusCopy[item.status];

  const handleViewFile = async () => {
    setViewingFile(true);
    try {
      const response = await fetch(fileUrl);
      const blob = await response.blob();
      const correctType = item.fileType?.includes("audio") ? "audio/mpeg" :
                        item.fileType?.includes("video") ? "video/mp4" :
                        "application/pdf";
      const typedBlob = new Blob([blob], { type: correctType });
      const blobUrl = URL.createObjectURL(typedBlob);
      window.open(blobUrl, "_blank");
      setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
    } catch (error) {
      console.error("View failed:", error);
      window.open(fileUrl, "_blank");
    } finally {
      setViewingFile(false);
    }
  };

  const handleDownloadFile = async () => {
    setDownloadingFile(true);
    try {
      const response = await fetch(fileUrl);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = item.fileName || item.primary || "file.pdf";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Download failed:", error);
      window.open(fileUrl, "_blank");
    } finally {
      setDownloadingFile(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 200,
        backgroundColor: "rgba(25,28,27,0.85)",
        display: "flex", alignItems: "center", justifyContent: "center",
        backdropFilter: "blur(6px)"
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          backgroundColor: "#fff", borderRadius: "20px",
          width: "95%", maxWidth: "560px",
          boxShadow: "0 25px 80px rgba(0,0,0,0.4)", border: `1px solid ${BORDER}`,
          overflow: "hidden"
        }}
      >
        {/* Header */}
        <div style={{
          padding: "24px 28px",
          borderBottom: `1px solid ${BORDER}`,
          display: "flex", justifyContent: "space-between", alignItems: "flex-start",
        }}>
          <div>
            <h2 style={{ ...SERIF, fontSize: "22px", fontWeight: 700, color: GREEN, margin: 0 }}>
              {item.primary}
            </h2>
            <p style={{ ...MONO, fontSize: "11px", color: MUTED, marginTop: "6px", letterSpacing: "0.05em" }}>
              {item.secondary} {item.tertiary ? `• ${item.tertiary}` : ""} • {item.date}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none", border: "none", cursor: "pointer",
              color: MUTED, fontSize: "22px", padding: "6px", borderRadius: "50%",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: "28px" }}>
          {item.description && (
            <p style={{ fontSize: "13px", color: "#404945", lineHeight: 1.6, margin: "0 0 20px" }}>
              {item.description}
            </p>
          )}

          {/* Status banner */}
          <div style={{
            padding: "14px 16px", backgroundColor: sc.bg,
            borderRadius: "10px", border: `1px solid ${sc.border}`,
            marginBottom: "20px",
          }}>
            <p style={{ ...MONO, fontSize: "9px", fontWeight: 700, color: sc.color, margin: 0, letterSpacing: "0.1em" }}>{sc.title}</p>
            <p style={{ fontSize: "11px", color: sc.color, margin: "4px 0 0", lineHeight: 1.4 }}>{sc.desc}</p>
          </div>

          {/* File actions */}
          {hasFile ? (
            <div style={{ display: "flex", gap: "10px" }}>
              {isUpload ? (
                <>
                  <button
                    onClick={handleViewFile}
                    disabled={viewingFile}
                    style={{
                      flex: 1, padding: "10px", border: `1.5px solid ${GREEN}`,
                      backgroundColor: viewingFile ? "#c0c9c3" : "transparent",
                      color: viewingFile ? "#fff" : GREEN, borderRadius: "6px",
                      fontSize: "10px", fontWeight: 700, ...MONO, cursor: "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>{viewingFile ? "hourglass_empty" : "visibility"}</span>
                    VIEW FILE
                  </button>
                  <button
                    onClick={handleDownloadFile}
                    disabled={downloadingFile}
                    style={{
                      flex: 1, padding: "10px", border: `1.5px solid ${GREEN}`,
                      backgroundColor: downloadingFile ? "#c0c9c3" : GREEN, color: "#fff",
                      borderRadius: "6px", fontSize: "10px", fontWeight: 700, ...MONO, cursor: "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>{downloadingFile ? "hourglass_empty" : "download"}</span>
                    DOWNLOAD
                  </button>
                </>
              ) : (
                <a
                  href={fileUrl} target="_blank" rel="noopener noreferrer"
                  style={{
                    flex: 1, padding: "10px", backgroundColor: GREEN, color: "#fff",
                    borderRadius: "6px", fontSize: "10px", fontWeight: 700, ...MONO,
                    textDecoration: "none", textAlign: "center",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>open_in_new</span>
                  OPEN LINK
                </a>
              )}
            </div>
          ) : (
            <p style={{ fontSize: "13px", color: "#c0c9c3", fontStyle: "italic", margin: 0 }}>No file attached.</p>
          )}

          {/* Live link — only when THIS item is approved */}
          {item.status === "APPROVED" && item.link && (
            <button
              onClick={() => { onClose(); window.location.href = item.link as string; }}
              style={{
                marginTop: "14px", width: "100%", padding: "10px",
                border: `1.5px solid ${GREEN}`, backgroundColor: "transparent", color: GREEN,
                borderRadius: "6px", fontSize: "10px", fontWeight: 700, ...MONO, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>check_circle</span>
              VIEW ON SCHOLAR PAGE
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Small components ─────────────────────────────────────── */
function Icon({ name, size = 18 }: { name: string; size?: number }) {
  return (
    <span className="material-symbols-outlined" style={{ fontSize: `${size}px`, lineHeight: 1, userSelect: "none" }}>
      {name}
    </span>
  );
}

function HoverCard({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        border: `1.5px solid ${BORDER}`,
        boxShadow: hov ? "0 4px 16px rgba(11,67,53,0.1)" : "0 1px 3px rgba(0,0,0,0.04)",
        transition: "box-shadow 0.2s, border-color 0.2s",
        backgroundColor: "#fff",
        borderRadius: "14px",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function HoverBtn({ children, onClick, variant = "outline", danger = false, style }: {
  children: React.ReactNode; onClick?: () => void; variant?: "outline" | "primary"; danger?: boolean; style?: React.CSSProperties;
}) {
  const [hov, setHov] = useState(false);
  const color = danger ? RED : GREEN;
  const outline: React.CSSProperties = { ...BTN_PRIMARY, border: `1.5px solid ${color}`, backgroundColor: hov ? color : "transparent", color: hov ? "#fff" : color };
  const primary: React.CSSProperties = { ...BTN_PRIMARY, border: `1.5px solid ${color}`, backgroundColor: hov ? "#285b4b" : color, color: "#fff" };
  return (
    <button onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ ...(variant === "outline" ? outline : primary), padding: "6px 14px", fontSize: "9px", ...style }}>
      {children}
    </button>
  );
}

function StatusBadge({ status, t }: { status: Status; t: (k: string) => string }) {
  const map: Record<Status, { bg: string; color: string; border: string }> = {
    DRAFT: { bg: "rgba(112,121,116,0.08)", color: MUTED, border: "rgba(112,121,116,0.2)" },
    PENDING: { bg: "rgba(115,92,0,0.08)", color: "#735c00", border: "rgba(115,92,0,0.2)" },
    APPROVED: { bg: GREEN_LIGHT, color: GREEN, border: GREEN_BORDER },
    REJECTED: { bg: "rgba(179,38,30,0.06)", color: RED, border: "rgba(179,38,30,0.18)" },
    SUPERSEDED: { bg: "rgba(112,121,116,0.08)", color: MUTED, border: "rgba(112,121,116,0.2)" },
  };
  const s = map[status];
  return (
    <span style={{ ...MONO, fontSize: "9px", fontWeight: 700, letterSpacing: "0.08em", padding: "3px 10px", borderRadius: "5px", backgroundColor: s.bg, color: s.color, border: `1px solid ${s.border}`, whiteSpace: "nowrap" }}>
      {t(`dashboard.status.${status.toLowerCase()}`)}
    </span>
  );
}

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      style={{
        ...MONO, fontSize: "10px", fontWeight: 700, letterSpacing: "0.08em", padding: "9px 16px",
        border: "none", borderBottom: `2px solid ${active ? GREEN : "transparent"}`,
        backgroundColor: active ? GREEN_LIGHT : "transparent", color: active ? GREEN : MUTED,
        cursor: "pointer", whiteSpace: "nowrap", transition: "all 0.15s",
      }}
    >
      {children}
    </button>
  );
}

function SectionTitle({ icon, title, action }: { icon: string; title: string; action?: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", color: GREEN }}>
        <Icon name={icon} size={18} />
        <h2 style={{ ...SERIF, fontSize: "17px", fontWeight: 700, margin: 0 }}>{title}</h2>
      </div>
      {action}
    </div>
  );
}

function EmptyRow({ text }: { text: string }) {
  return <p style={{ fontSize: "13px", color: MUTED, fontStyle: "italic", padding: "20px 0", textAlign: "center" }}>{text}</p>;
}

function FilterChip({ active, onClick, children, count }: { active: boolean; onClick: () => void; children: React.ReactNode; count: number }) {
  return (
    <button onClick={onClick} style={{
      ...MONO, fontSize: "9px", fontWeight: 700, letterSpacing: "0.06em", padding: "6px 14px",
      borderRadius: "20px", border: `1.5px solid ${active ? GREEN : BORDER}`,
      backgroundColor: active ? GREEN : "transparent", color: active ? "#fff" : MUTED,
      cursor: "pointer", transition: "all 0.15s", display: "inline-flex", alignItems: "center", gap: "6px",
    }}>
      {children}
      <span style={{ opacity: 0.75 }}>{count}</span>
    </button>
  );
}

function StatusTable({
  rows, emptyText, t, colPrimary, colSecondary, colTertiary, isRTL, onView,
}: {
  rows: TableRow[]; emptyText: string; t: (k: string) => string;
  colPrimary: string; colSecondary: string; colTertiary?: string; isRTL: boolean;
  onView: (item: TableRow) => void;
}) {
  if (rows.length === 0) return <EmptyRow text={emptyText} />;
  const th: React.CSSProperties = { ...MONO, fontSize: "9px", fontWeight: 700, letterSpacing: "0.08em", color: MUTED, textAlign: isRTL ? "right" : "left", padding: "0 0 10px", borderBottom: `1.5px solid ${BORDER}`, textTransform: "uppercase" };
  const td: React.CSSProperties = { padding: "12px 0", fontSize: "13px", color: "#191c1b", verticalAlign: "middle" };

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={th}>{colPrimary}</th>
            <th style={th}>{colSecondary}</th>
            {colTertiary && <th style={th}>{colTertiary}</th>}
            <th style={th}>{t("dashboard.table.date")}</th>
            <th style={th}>{t("dashboard.table.status")}</th>
            <th style={{ ...th, textAlign: isRTL ? "left" : "right" }}>{t("dashboard.table.actions")}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} style={{ borderBottom: i === rows.length - 1 ? "none" : "1px solid #f0f1ee" }}>
              <td style={{ ...td, ...SERIF, fontWeight: 700 }}>{r.primary}</td>
              <td style={{ ...td, ...MONO, fontSize: "11px", color: MUTED }}>{r.secondary}</td>
              {colTertiary && <td style={{ ...td, ...MONO, fontSize: "11px", color: MUTED }}>{r.tertiary ?? "—"}</td>}
              <td style={{ ...td, ...MONO, fontSize: "11px", color: MUTED, whiteSpace: "nowrap" }}>{r.date}</td>
              <td style={td}><StatusBadge status={r.status} t={t} /></td>
              <td style={{ ...td, textAlign: isRTL ? "left" : "right" }}>
                <button 
                  onClick={() => onView(r)}
                  style={{ background: "none", border: "none", color: GREEN, fontWeight: 600, fontSize: "11px", cursor: "pointer", ...MONO, padding: 0 }}
                >
                  {t("dashboard.actions.view")} →
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SubmissionsTable({ rows, t, isRTL, onAction }: {
  rows: Submission[]; t: (k: string) => string; isRTL: boolean;
  onAction: (action: "continue" | "delete" | "view" | "history" | "resubmit" | "editRejected" | "deleteRejected", row: Submission) => void;
}) {
  if (rows.length === 0) return <EmptyRow text={t("dashboard.empty.submissions")} />;

  const th: React.CSSProperties = { ...MONO, fontSize: "9px", fontWeight: 700, letterSpacing: "0.08em", color: MUTED, textAlign: isRTL ? "right" : "left", padding: "0 0 10px", borderBottom: `1.5px solid ${BORDER}`, textTransform: "uppercase" };
  const td: React.CSSProperties = { padding: "12px 0", fontSize: "13px", color: "#191c1b", verticalAlign: "middle" };

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={th}>{t("dashboard.table.type")}</th>
            <th style={th}>{t("dashboard.table.scholar")}</th>
            <th style={th}>{t("dashboard.table.language")}</th>
            <th style={th}>{t("dashboard.table.version")}</th>
            <th style={th}>{t("dashboard.table.date")}</th>
            <th style={th}>{t("dashboard.table.status")}</th>
            <th style={{ ...th, textAlign: isRTL ? "left" : "right" }}>{t("dashboard.table.actions")}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} style={{ borderBottom: "1px solid #f0f1ee" }}>
              <td style={{ ...td, ...MONO, fontSize: "10px", fontWeight: 700, color: r.kind === "new" ? GREEN : "#8a6d00" }}>
                {r.kind === "new" ? t("dashboard.kind.new") : t("dashboard.kind.edit")}
              </td>
              <td style={{ ...td, ...SERIF, fontWeight: 700 }}>
                <Link to={`/scholars/${r.scholarId}?lang=${r.lang}&focus=version-${r.id}`} style={{ color: "inherit", textDecoration: "none" }}>
                  {r.scholarName}
                </Link>
              </td>
              <td style={{ ...td, ...MONO, fontSize: "11px", color: MUTED }}>{r.lang}</td>
              <td style={{ ...td, ...MONO, fontSize: "11px", color: MUTED }}>v{r.version}</td>
              <td style={{ ...td, ...MONO, fontSize: "11px", color: MUTED, whiteSpace: "nowrap" }}>{r.date}</td>
              <td style={td}><StatusBadge status={r.status} t={t} /></td>
              <td style={{ ...td, textAlign: isRTL ? "left" : "right" }}>
                <div style={{ display: "inline-flex", gap: "6px", flexWrap: "wrap", justifyContent: isRTL ? "flex-start" : "flex-end" }}>
                  {r.status === "DRAFT" && (
                    <>
                      <HoverBtn variant="primary" onClick={() => onAction("continue", r)}>{t("dashboard.actions.continue")}</HoverBtn>
                      <HoverBtn danger onClick={() => onAction("delete", r)}>{t("dashboard.actions.delete")}</HoverBtn>
                    </>
                  )}
                  {/* ✅ NEW: Dedicated buttons for REJECTED */}
                  {r.status === "REJECTED" && (
                    <>
                      <HoverBtn variant="primary" onClick={() => onAction("editRejected", r)}>Edit</HoverBtn>
                      <HoverBtn danger onClick={() => onAction("deleteRejected", r)}>{t("dashboard.actions.delete")}</HoverBtn>
                    </>
                  )}
                  {r.status === "PENDING" && (
                    <HoverBtn onClick={() => onAction("view", r)}>{t("dashboard.actions.view")}</HoverBtn>
                  )}
                  {r.status === "APPROVED" && (
                    <HoverBtn onClick={() => onAction("view", r)}>{t("dashboard.actions.view")}</HoverBtn>
                  )}
                  {r.status === "SUPERSEDED" && (
                    <HoverBtn onClick={() => onAction("view", r)}>{t("dashboard.actions.view")}</HoverBtn>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ─────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────── */
export default function DashboardPage() {
  const { lang, t } = useLang();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isRTL = lang === "AR";

  const isContributor = user?.role_name === "contributor" || user?.role_name === "admin";
  const username = (user as any)?.username ?? (user as any)?.displayName ?? "there";

  const [tab, setTab] = useState<ContributorTab>("overview");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");

  // ✅ REAL DATA STATES
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [works, setWorks] = useState<TableRow[]>([]);
  const [media, setMedia] = useState<TableRow[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);

  // ✅ MODAL STATES
  const [previewItem, setPreviewItem] = useState<any>(null);
  const [supersededItem, setSupersededItem] = useState<Submission | null>(null);
  const [fileItem, setFileItem] = useState<TableRow | null>(null); // ✅ NEW: works/media detail modal

  // ✅ FETCH DATA FROM BACKEND
  useEffect(() => {
    // ✅ FIX: fetch for every user now, not just contributors — a normal
    // user can submit via the Contribute button and should see their own data.
    if (tab === "submissions" || tab === "media" || tab === "works" || tab === "overview") {
      const fetchData = async () => {
        setIsLoadingData(true);
        try {
          const result = await scholarsApi.mySubmissions();
          const data = result.data;

                   const mappedSubmissions: Submission[] = data.scholar_versions.map((v: any) => {
            // ✅ DEBUG: Check exactly what language the backend is returning for this draft
            const langCode = v.languages?.code || "en";
            console.log("🔍 DRAFT CHECK -> ID:", v.version_id, "| Lang:", langCode, "| Full Lang Object:", v.languages);
            
            return {
              id: v.version_id,
              scholarId: v.scholar_id,
              kind: v.version_type === "creation" ? "new" : "edit",
              scholarName: v.canonical_name || "Unknown Scholar",
              lang: langCode, // ⚠️ THIS is what builds the URL route!
              version: 1,
              date: new Date(v.created_at).toLocaleDateString(),
              status: v.status.toUpperCase() as Status,
            };
          });

 const mappedWorks: TableRow[] = data.works.map((w: any) => {
  // ✅ scholar_versions IS the version object directly
  const version = w.scholar_versions;
  
  // ✅ Map language_id to language code
  const langCode = version?.language_id === 1 ? 'en' : 
                   version?.language_id === 3 ? 'ar' : 
                   version?.language_id === 2 ? 'fr' : 'en';
  
  return {
    id: w.work_id, // ✅ FIX: item's own id, used for its own status/file — not the version's
    primary: w.title,
    secondary: version?.canonical_name || "Unknown",
    tertiary: w.format,
    date: new Date(w.created_at || Date.now()).toLocaleDateString(),
    status: w.status.toUpperCase() as Status,
    scholarId: version?.scholar_id, // ✅ Use scholar_id from version
    link: `/scholars/${version?.scholar_id}?lang=${langCode}&focus=work-${w.work_id}`,
    // ✅ FIX: carry the file fields already returned by mySubmissions()
    mediaUrl: w.media_url,
    filePath: w.file_path,
    fileType: w.file_type,
    fileName: w.file_name,
    sourceType: w.source_type,
    description: w.description,
  };
});

const mappedMedia: TableRow[] = data.media.map((m: any) => {
  // ✅ scholar_versions IS the version object directly
  const version = m.scholar_versions;
  
  // ✅ Map language_id to language code
  const langCode = version?.language_id === 1 ? 'en' : 
                   version?.language_id === 3 ? 'ar' : 
                   version?.language_id === 2 ? 'fr' : 'en';
  
  return {
    id: m.media_id, // ✅ FIX: item's own id
    primary: m.title || m.file_name || "Untitled",
    secondary: version?.canonical_name || "Unknown",
    tertiary: m.file_type || "Media",
    date: new Date(m.uploaded_at || m.created_at || Date.now()).toLocaleDateString(),
    status: m.status.toUpperCase() as Status,
    scholarId: version?.scholar_id, // ✅ Use scholar_id from version
    link: `/scholars/${version?.scholar_id}?lang=${langCode}&focus=media-${m.media_id}`,
    // ✅ FIX: carry the file fields already returned by mySubmissions()
    mediaUrl: m.media_url,
    filePath: m.file_path,
    fileType: m.file_type,
    fileName: m.file_name,
    sourceType: m.source_type,
    description: m.description,
  };
});

          setSubmissions(mappedSubmissions);
          setWorks(mappedWorks);
          setMedia(mappedMedia);
        } catch (error) {
          console.error("Failed to fetch dashboard data:", error);
        } finally {
          setIsLoadingData(false);
        }
      };

      fetchData();
    }
  }, [tab]);

  // ✅ FILTER & COUNT LOGIC
  const filteredSubmissions = useMemo(() => {
    if (statusFilter === "ALL") return submissions;
    return submissions.filter((s) => s.status === statusFilter);
  }, [statusFilter, submissions]);

  const counts = useMemo(() => {
    const c: Record<StatusFilter, number> = { ALL: submissions.length, DRAFT: 0, PENDING: 0, APPROVED: 0, REJECTED: 0, SUPERSEDED: 0 };
    submissions.forEach((s) => { if (c[s.status] !== undefined) c[s.status]++; });
    return c;
  }, [submissions]);
    const handleSubmissionAction = async (action: "continue" | "delete" | "view" | "history" | "resubmit" | "editRejected" | "deleteRejected", row: Submission) => {
    
    // ✅ DETERMINE THE EXACT ROUTE BASED ON YOUR 3 CASES (Using UPPERCASE lang)
    let targetRoute = "";
    const langUpper = row.lang.toUpperCase(); // ✅ FORCE UPPERCASE TO MATCH ROUTE TYPE
    
    if (row.kind === "new" && !row.scholarId) {
      targetRoute = `/scholars/submit/${langUpper}?draftId=${row.id}`;
    } else if (row.kind === "new" && row.scholarId) {
      targetRoute = `/scholars/${row.scholarId}/submit/${langUpper}?draftId=${row.id}`;
    } else if (row.kind === "edit") {
      targetRoute = `/scholars/${row.scholarId}/edit/${langUpper}?draftId=${row.id}`;
    } else {
      targetRoute = `/scholars/submit/${langUpper}?draftId=${row.id}`;
    }

    // ✅ EXECUTE THE ACTION
    if (action === "continue" || action === "resubmit") {
      navigate(targetRoute);
    } 
    else if (action === "editRejected") {
      // ✅ Handle REJECTED Edit: Routes to submit/edit with rejectedId
      if (row.kind === "new") {
        navigate(`/scholars/submit/${langUpper}?rejectedId=${row.id}`);
      } else {
        navigate(`/scholars/${row.scholarId}/edit/${langUpper}?rejectedId=${row.id}`);
      }
    }
    else if (action === "delete") {
      if (window.confirm(`Are you sure you want to permanently delete this draft?`)) {
        try {
          await scholarsApi.deleteDraft(row.id);
          setSubmissions((prev) => prev.filter((s) => s.id !== row.id));
          
          const langLower = row.lang.toLowerCase();
          localStorage.removeItem(`oulamauna_edit_draft_${row.scholarId}_${langLower}`);
          localStorage.removeItem(`oulamauna_scholar_draft_v_${row.id}`);
          localStorage.removeItem("oulamauna_draft_session");
          
          alert("Draft deleted successfully!"); 
        } catch (error) {
          console.error("Failed to delete draft:", error);
          alert("Failed to delete draft. Please try again.");
        }
      }
    }
    else if (action === "deleteRejected") {
      // ✅ Handle REJECTED Delete: Uses the new dedicated backend endpoint
      if (window.confirm(`Are you sure you want to permanently delete this rejected submission?`)) {
        try {
          await scholarsApi.deleteRejected(row.id);
          setSubmissions((prev) => prev.filter((s) => s.id !== row.id));
          alert("Rejected submission deleted successfully!"); 
        } catch (error) {
          console.error("Failed to delete rejected submission:", error);
          alert("Failed to delete. Please try again.");
        }
      }
    } 
    else if (action === "view") {
      if (row.status === "APPROVED") {
        navigate(`/scholars/${row.scholarId}?lang=${row.lang.toLowerCase()}&focus=version-${row.id}`);
      } else if (row.status === "PENDING") {
        setPreviewItem(row);
      } else if (row.status === "SUPERSEDED") {
        setSupersededItem(row);
      } else if (row.status === "DRAFT") {
        navigate(targetRoute); 
      }
      // Note: REJECTED is now handled by editRejected, so it's removed from here
    } 
    else if (action === "history") {
      navigate(`/scholars/${row.scholarId}/history`);
    }
  };

  // ✅ FIX: works/media rows now always open FileDetailModal, which
  // reads the item's OWN status and file fields — no more depending
  // on getVersionById / the parent scholar version's status.
  // REJECTED still routes straight to edit, since there's nothing to "view" there.
  const handleViewItem = (item: TableRow) => {
    if (item.status === "REJECTED") {
      if (item.scholarId) navigate(`/scholars/edit/${item.scholarId}`);
      return;
    }
    setFileItem(item);
  };

  // ✅ FIX: same tab set for everyone now — normal users see
  // Submissions/Media/Works too, they just start out empty.
  const tabs: { id: ContributorTab; label: string; icon: string }[] = [
    { id: "overview", label: t("dashboard.tabs.overview"), icon: "grid_view" },
    { id: "submissions", label: t("dashboard.tabs.submissions"), icon: "outbox" },
    { id: "media", label: t("dashboard.tabs.media"), icon: "perm_media" },
    { id: "works", label: t("dashboard.tabs.works"), icon: "menu_book" },
    { id: "notifications", label: t("dashboard.tabs.notifications"), icon: "notifications" },
   
  ];
  const cardStyle: React.CSSProperties = { padding: "24px 28px" };

  return (
    <div
      dir={isRTL ? "rtl" : "ltr"}
      style={{
        ...SANS,
        backgroundColor: "#faf9f6",
        backgroundImage: "radial-gradient(circle at 50% 0%, rgba(201,168,76,0.06) 0%, transparent 60%)",
        minHeight: "100vh",
        color: "#191c1b",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Source+Serif+4:ital,opsz,wght@0,8..60,200..900;1,8..60,200..900&family=Source+Sans+3:ital,wght@0,200..900;1,200..900&family=JetBrains+Mono:ital,wght@0,100..800;1,100..800&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap');
        .material-symbols-outlined { font-variation-settings: 'FILL' 0,'wght' 400,'GRAD' 0,'opsz' 24; font-family: 'Material Symbols Outlined'; display: inline-block; vertical-align: middle; }
        .op-tabs { display: flex; gap: 2px; overflow-x: auto; border-bottom: 1.5px solid rgba(192,201,195,0.4); }
        .op-tabs::-webkit-scrollbar { display: none; }
        @keyframes highlightPulse {
          0% { box-shadow: 0 0 0 0 rgba(201, 168, 76, 0.7); background-color: rgba(201, 168, 76, 0.15); transform: scale(1); }
          50% { box-shadow: 0 0 0 12px rgba(201, 168, 76, 0); background-color: rgba(201, 168, 76, 0.25); transform: scale(1.01); }
          100% { box-shadow: 0 0 0 0 rgba(201, 168, 76, 0); background-color: transparent; transform: scale(1); }
        }
        .highlight-focus { animation: highlightPulse 2.5s ease-out; border-radius: 8px; position: relative; z-index: 10; }
      `}</style>

      {/* ✅ MODALS */}
      {previewItem && <PreviewModal item={previewItem} onClose={() => setPreviewItem(null)} />}
      {supersededItem && <SupersededModal item={supersededItem} onClose={() => setSupersededItem(null)} />}
      {fileItem && <FileDetailModal item={fileItem} onClose={() => setFileItem(null)} />}

      <div style={{ maxWidth: "1150px", margin: "0 auto", padding: "24px 32px 40px", display: "flex", gap: "32px" }}>
        <ProfileSidebar role={isContributor ? "contributor" : "user"} active="dashboard" />

        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Header */}
          <div>
            <h1 style={{ ...SERIF, fontSize: "24px", fontWeight: 700, color: GREEN, margin: "0 0 4px" }}>
              {t("dashboard.welcome")}, {username}
            </h1>
            <p style={{ fontSize: "13px", color: MUTED, margin: 0 }}>
              {isContributor ? (
                <>{t("dashboard.roleLabel")}: <strong style={{ color: GREEN }}>{t("dashboard.roleContributor")}</strong></>
              ) : (
                t("dashboard.welcomeUser")
              )}
            </p>
          </div>

          {/* ✅ FIX: persistent Contribute banner — shown on every tab, not just Overview */}
          {!isContributor && (
            <HoverCard style={{
              padding: "14px 20px", backgroundColor: GREEN, border: "none",
              display: "flex", alignItems: "center", justifyContent: "space-between",
              gap: "16px", flexWrap: "wrap",
            }}>
              <div>
                <p style={{ ...SERIF, fontSize: "15px", fontWeight: 700, color: "#fff", margin: 0 }}>{t("dashboard.cta.title")}</p>
                <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.85)", margin: "2px 0 0" }}>{t("dashboard.cta.desc")}</p>
              </div>
              <button
                onClick={() => navigate("/scholars/submit/")}
                style={{ ...BTN_PRIMARY, backgroundColor: "#fff", color: GREEN, border: "1.5px solid #fff", whiteSpace: "nowrap" }}
              >
                <Icon name="add_circle" size={14} /> {t("dashboard.cta.button")}
              </button>
            </HoverCard>
          )}

          {/* Tabs */}
          <div className="op-tabs">
            {tabs.map((tb) => (
              <TabBtn key={tb.id} active={tab === tb.id} onClick={() => setTab(tb.id as ContributorTab)}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                  <Icon name={tb.icon} size={14} /> {tb.label}
                </span>
              </TabBtn>
            ))}
          </div>

          {/* ── OVERVIEW ─────────────────────────────── */}
          {/* ✅ FIX: same overview for everyone now — stats + recent activity.
              A normal user with 0 submissions just sees zeros and an empty
              activity list, same shape as a contributor mid-way through their first submission. */}
          {tab === "overview" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px" }}>
                {[
                  [t("dashboard.stats.scholars"), submissions.length],
                  [t("dashboard.stats.versions"), submissions.length],
                  [t("dashboard.stats.media"), media.length],
                  [t("dashboard.stats.works"), works.length],
                ].map(([label, val]) => (
                  <HoverCard key={label as string} style={{ padding: "18px 20px" }}>
                    <p style={{ ...MONO, fontSize: "9px", color: MUTED, letterSpacing: "0.1em", margin: "0 0 6px" }}>{(label as string).toUpperCase()}</p>
                    <p style={{ ...SERIF, fontSize: "26px", fontWeight: 700, color: GREEN, margin: 0 }}>{val}</p>
                  </HoverCard>
                ))}
              </div>

              <HoverCard style={cardStyle}>
                <SectionTitle icon="history" title={t("dashboard.overview.recentActivity")} />
                <div>
                  {submissions.slice(0, 3).map((a, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: i === 2 ? "none" : "1px solid #f0f1ee" }}>
                      <div>
                        <p style={{ fontSize: "13px", color: "#191c1b", margin: "0 0 2px", fontWeight: 600 }}>
                          {a.kind === "new" ? "New scholar submitted" : "Edit proposed"}
                        </p>
                        <p style={{ ...MONO, fontSize: "10px", color: MUTED, margin: 0 }}>{a.scholarName} — {a.lang}</p>
                      </div>
                      <span style={{ ...MONO, fontSize: "10px", color: "#c0c9c3", whiteSpace: "nowrap" }}>{a.date}</span>
                    </div>
                  ))}
                  {submissions.length === 0 && <EmptyRow text="No recent activity" />}
                </div>
              </HoverCard>
            </div>
          )}

          {/* ── MY SUBMISSIONS ── */}
          {tab === "submissions" && (
            <HoverCard style={cardStyle}>
              <SectionTitle
                icon="outbox"
                title={t("dashboard.tabs.submissions")}
                action={
                  <div style={{ display: "flex", gap: "8px" }}>
                    <HoverBtn onClick={() => navigate("/scholars/submit/")}>
                      <Icon name="add_circle" size={12} /> {t("dashboard.actions.newScholar")}
                    </HoverBtn>
                  
                  </div>
                }
              />

              <div style={{ display: "flex", gap: "6px", marginBottom: "18px", flexWrap: "wrap" }}>
                <FilterChip active={statusFilter === "ALL"} onClick={() => setStatusFilter("ALL")} count={counts.ALL}>{t("dashboard.filter.all")}</FilterChip>
                <FilterChip active={statusFilter === "DRAFT"} onClick={() => setStatusFilter("DRAFT")} count={counts.DRAFT}>{t("dashboard.status.draft")}</FilterChip>
                <FilterChip active={statusFilter === "PENDING"} onClick={() => setStatusFilter("PENDING")} count={counts.PENDING}>{t("dashboard.status.pending")}</FilterChip>
                <FilterChip active={statusFilter === "APPROVED"} onClick={() => setStatusFilter("APPROVED")} count={counts.APPROVED}>{t("dashboard.status.approved")}</FilterChip>
                <FilterChip active={statusFilter === "REJECTED"} onClick={() => setStatusFilter("REJECTED")} count={counts.REJECTED}>{t("dashboard.status.rejected")}</FilterChip>
                {/* ✅ ADDED: SUPERSEDED Filter Chip */}
                <FilterChip active={statusFilter === "SUPERSEDED"} onClick={() => setStatusFilter("SUPERSEDED")} count={counts.SUPERSEDED}>{t("dashboard.status.superseded")}</FilterChip>
              </div>

              {isLoadingData ? (
                <EmptyRow text="Loading submissions..." />
              ) : (
                <SubmissionsTable rows={filteredSubmissions} t={t} isRTL={isRTL} onAction={handleSubmissionAction} />
              )}
            </HoverCard>
          )}

          {/* ── MEDIA WORKSPACE ── */}
          {tab === "media" && (
            <HoverCard style={cardStyle}>
              <SectionTitle icon="perm_media" title={t("dashboard.tabs.media")} />
              <p style={{ ...MONO, fontSize: "9px", color: "#c0c9c3", letterSpacing: "0.06em", marginBottom: "12px", fontStyle: "italic" }}>
                {t("dashboard.media.tempNote")}
              </p>
              {isLoadingData ? (
                <EmptyRow text="Loading media..." />
              ) : (
                <StatusTable
                  t={t} isRTL={isRTL}
                  colPrimary={t("dashboard.table.file")}
                  colSecondary={t("dashboard.table.scholar")}
                  colTertiary={t("dashboard.table.type")}
                  emptyText={t("dashboard.empty.media")}
                  rows={media}
                  onView={handleViewItem}
                />
              )}
            </HoverCard>
          )}

          {/* ── WORKS & REFERENCES WORKSPACE ── */}
          {tab === "works" && (
            <HoverCard style={cardStyle}>
              <SectionTitle icon="menu_book" title={t("dashboard.tabs.works")} />
              {isLoadingData ? (
                <EmptyRow text="Loading works..." />
              ) : (
                <StatusTable
                  t={t} isRTL={isRTL}
                  colPrimary={t("dashboard.table.title")}
                  colSecondary={t("dashboard.table.scholar")}
                  colTertiary={t("dashboard.table.type")}
                  emptyText={t("dashboard.empty.works")}
                  rows={works}
                  onView={handleViewItem}
                />
              )}
            </HoverCard>
          )}

          {/* ── NOTIFICATIONS ── */}
          {tab === "notifications" && (
            <HoverCard style={cardStyle}>
              <SectionTitle icon="notifications" title={t("dashboard.tabs.notifications")} />
              <EmptyRow text={t("dashboard.empty.notifications")} />
            </HoverCard>
          )}

        
        </div>
      </div>
    </div>
  );
}