import React, { useState, useMemo, useEffect } from "react";
import { useLang } from "../../context/LanguageContext";
import { useAuth } from "../../context/AuthContext";
import { scholarsApi } from "../../api/scholarsApi";
import ProfileSidebar from "../../components/ProfileSidebar";
import { useNavigate, Link } from "react-router-dom";
import DOMPurify from 'dompurify';

/* ─────────────────────────────────────────────
   Oulamauna — Dashboard (User / Contributor)
   Styled with Forum.tsx palette
───────────────────────────────────────────── */

type Status = "DRAFT" | "PENDING" | "APPROVED" | "REJECTED" | "SUPERSEDED";
type SubmissionKind = "new" | "edit";
type UserTab = "overview" | "notifications";
type ContributorTab = UserTab | "submissions" | "media" | "works";
type StatusFilter = "ALL" | Status;

// ─ FORUM.TSX COLOR PALETTE ─
const colors = {
  creamLight: "#fcfaf5",
  creamMid: "#f6efdc",
  creamDark: "#e5d5a8",
  forestGreen: "#0b4335",
  amber: "#b8860b",
  red: "#8b2c2c",
};

const GREEN = colors.forestGreen;
const GOLD = colors.amber;
const BG = colors.creamLight;
const CARD_BG = colors.creamLight;
const BORDER = colors.creamMid;
const MUTED = "rgba(11, 67, 53, 0.6)";
const RED = colors.red;

const MONO: React.CSSProperties = { fontFamily: "'JetBrains Mono', monospace" };
const SERIF: React.CSSProperties = { fontFamily: "'Hanken Grotesk', sans-serif" };
const SANS: React.CSSProperties = { fontFamily: "'Inter', sans-serif" };

function Icon({ name, size = 18 }: { name: string; size?: number }) {
  return (
    <span className="material-symbols-outlined" style={{ fontSize: `${size}px`, lineHeight: 1, userSelect: "none" }}>
      {name}
    </span>
  );
}

/* ── Shared hooks ───── */
function useLockBodyScroll() {
  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = original; };
  }, []);
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => (typeof window !== "undefined" ? window.innerWidth < 768 : false));
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return isMobile;
}

/* ── Types ───── */
interface Submission {
  id: number;
  scholarId: number;
  kind: SubmissionKind;
  scholarName: string;
  lang: string;
  version: number;
  date: string;
  status: Status;
}

interface TableRow {
  id?: number;
  primary: string;
  secondary: React.ReactNode;
  tertiary?: string;
  date: string;
  status: Status;
  scholarId?: number;
  link?: string;
  mediaUrl?: string;
  filePath?: string;
  fileType?: string;
  fileName?: string;
  sourceType?: string;
  description?: string;
}

/* ── Shared scholar-detail pieces (used by both Preview and Superseded modals) ───── */
function ScholarImage({ url, name, style }: { url?: string; name?: string; style?: React.CSSProperties }) {
  return (
    <div style={{ width: "100%", backgroundColor: "rgba(11, 67, 53, 0.1)", ...style }}>
      {url ? (
        <img src={url} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      ) : (
        <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: MUTED }}>
          <Icon name="account_circle" size={80} />
        </div>
      )}
    </div>
  );
}

function ScholarInfoBlocks({ versionData }: { versionData: any }) {
  return (
    <>
      {versionData?.regions && (
        <div>
          <h4 style={{ ...MONO, fontSize: "10px", color: MUTED, letterSpacing: "0.12em", marginBottom: "8px", textTransform: "uppercase" }}>Region</h4>
          <p style={{ fontSize: "15px", fontWeight: 600, color: GREEN, margin: 0 }}>{versionData.regions.name}</p>
        </div>
      )}

      {versionData?.scholar_dates && versionData.scholar_dates.length > 0 && (
        <div>
          <h4 style={{ ...MONO, fontSize: "10px", color: MUTED, letterSpacing: "0.12em", marginBottom: "8px", textTransform: "uppercase" }}>Dates</h4>
          {versionData.scholar_dates.map((d: any, i: number) => (
            <div key={i} style={{ fontSize: "14px", color: "rgba(11, 67, 53, 0.8)", marginBottom: "4px" }}>
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
                padding: "4px 10px", backgroundColor: GREEN, color: BG,
                borderRadius: "6px", fontSize: "11px", fontWeight: 600
              }}>{alias.alias_name}</span>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

function StatusBanner({ variant }: { variant: "pending" | "superseded" }) {
  const isPending = variant === "pending";
  const color = isPending ? colors.amber : MUTED;
  const bg = isPending ? "rgba(184, 134, 11, 0.1)" : "rgba(112, 121, 116, 0.1)";
  const border = isPending ? "rgba(184, 134, 11, 0.3)" : "rgba(112, 121, 116, 0.3)";
  const iconBg = isPending ? "rgba(184, 134, 11, 0.15)" : "rgba(112, 121, 116, 0.15)";
  return (
    <div style={{ padding: "16px", backgroundColor: bg, borderRadius: "12px", border: `1px solid ${border}`, display: "flex", alignItems: "center", gap: "12px" }}>
      <div style={{ width: "36px", height: "36px", borderRadius: "50%", backgroundColor: iconBg, display: "flex", alignItems: "center", justifyContent: "center", color }}>
        <Icon name={isPending ? "pending" : "history"} size={20} />
      </div>
      <div>
        <p style={{ ...MONO, fontSize: "10px", fontWeight: 700, color, margin: 0, letterSpacing: "0.1em" }}>
          {isPending ? "WAITING FOR REVIEW" : "SUPERSEDED"}
        </p>
        <p style={{ fontSize: "12px", color, margin: "4px 0 0", lineHeight: 1.4, opacity: 0.8 }}>
          {isPending ? "An admin is currently reviewing this submission." : "This version was replaced by a newer approved version."}
        </p>
      </div>
    </div>
  );
}

function BiographySection({ loading, versionData }: { loading: boolean; versionData: any }) {
  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "60px 20px", color: MUTED }}>
        <Icon name="hourglass_empty" size={48} />
        <p style={{ fontSize: "16px", fontWeight: 600, marginTop: "16px" }}>Loading details...</p>
      </div>
    );
  }
  if (!versionData) {
    return (
      <div style={{ textAlign: "center", padding: "60px 20px", color: RED }}>
        <Icon name="warning" size={48} />
        <p style={{ fontSize: "16px", fontWeight: 600, marginTop: "16px" }}>Failed to load data.</p>
      </div>
    );
  }
  if (!versionData.biography) return null;
  return (
    <section>
      <h3 style={{
        ...MONO, fontSize: "11px", color: GREEN, letterSpacing: "0.15em",
        marginBottom: "16px", paddingBottom: "12px", borderBottom: `2px solid ${GREEN}`, textTransform: "uppercase"
      }}>Biography</h3>
      <div
        style={{
          fontSize: "15px", lineHeight: "1.8", color: GREEN,
          fontFamily: SERIF.fontFamily, padding: "24px",
          backgroundColor: "rgba(11, 67, 53, 0.04)", borderRadius: "12px", border: `1px solid ${BORDER}`
        }}
        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(versionData.biography) }}
      />
    </section>
  );
}

function ModalHeader({ title, meta, onClose, sticky = false }: { title: string; meta: string; onClose: () => void; sticky?: boolean }) {
  return (
    <div style={{
      padding: "18px 20px", borderBottom: `1px solid ${BORDER}`,
      display: "flex", justifyContent: "space-between", alignItems: "center",
      backgroundColor: CARD_BG, flexShrink: 0,
      ...(sticky ? { position: "sticky" as const, top: 0, zIndex: 5 } : {})
    }}>
      <div style={{ minWidth: 0 }}>
        <h2 style={{ ...SERIF, fontSize: "20px", fontWeight: 700, color: GREEN, margin: 0 }}>{title}</h2>
        <p style={{ ...MONO, fontSize: "11px", color: MUTED, marginTop: "6px", letterSpacing: "0.05em" }}>{meta}</p>
      </div>
      <button
        onClick={onClose}
        style={{
          background: "none", border: "none", cursor: "pointer",
          color: MUTED, fontSize: "24px", padding: "8px", borderRadius: "50%",
          display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s",
          flexShrink: 0
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "rgba(139, 44, 44, 0.1)"; (e.currentTarget as HTMLButtonElement).style.color = RED; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent"; (e.currentTarget as HTMLButtonElement).style.color = MUTED; }}
      >
        <Icon name="close" size={24} />
      </button>
    </div>
  );
}

/* ── Mobile: single continuous full-page scroll, sticky close button at top ───── */
function MobileScholarModal({
  title, meta, versionData, loading, variant, onClose,
}: {
  title: string; meta: string; versionData: any; loading: boolean; variant: "pending" | "superseded"; onClose: () => void;
}) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, backgroundColor: BG, display: "flex", flexDirection: "column" }}>
      <ModalHeader title={title} meta={meta} onClose={onClose} sticky />
      <div style={{ flex: 1, overflowY: "auto" }}>
        <ScholarImage url={versionData?.image_url} name={versionData?.canonical_name} style={{ height: "220px", flexShrink: 0 }} />
        <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "20px" }}>
          <ScholarInfoBlocks versionData={versionData} />
          <StatusBanner variant={variant} />
          <BiographySection loading={loading} versionData={versionData} />
        </div>
      </div>
    </div>
  );
}

/* ── Modals ─────────────────────────────────────── */
function PreviewModal({ item, onClose }: { item: any; onClose: () => void }) {
  useLockBodyScroll();
  const isMobile = useIsMobile();
  const [versionData, setVersionData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    scholarsApi.getVersionById(item.id)
      .then((res) => { setVersionData(res.data); setLoading(false); })
      .catch((err) => { console.error("Failed to load preview:", err); setLoading(false); });
  }, [item.id]);

  const title = versionData?.canonical_name || item.scholarName || "Untitled Submission";
  const meta = `${item.kind === 'new' ? 'New Scholar Submission' : 'Edit Proposal'} • ${item.lang.toUpperCase()} • Submitted ${item.date}`;

  if (isMobile) {
    return <MobileScholarModal title={title} meta={meta} versionData={versionData} loading={loading} variant="pending" onClose={onClose} />;
  }

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 200,
        backgroundColor: "rgba(11, 67, 53, 0.6)",
        display: "flex", alignItems: "center", justifyContent: "center",
        backdropFilter: "blur(4px)"
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          backgroundColor: BG, borderRadius: "20px",
          width: "95%", maxWidth: "1200px", height: "90vh", maxHeight: "95vh",
          display: "flex", flexDirection: "row",
          boxShadow: "0 25px 80px rgba(0,0,0,0.15)", border: `1px solid ${BORDER}`,
          overflow: "hidden"
        }}
      >
        <div style={{
          width: "320px", flexShrink: 0,
          borderRight: `1px solid ${BORDER}`,
          backgroundColor: CARD_BG,
          display: "flex", flexDirection: "column",
          overflowY: "auto"
        }}>
          <ScholarImage url={versionData?.image_url} name={versionData?.canonical_name} style={{ aspectRatio: "3/4", borderBottom: `1px solid ${BORDER}`, flexShrink: 0 }} />

          <div style={{ padding: "24px", flex: 1, display: "flex", flexDirection: "column", gap: "24px" }}>
            <ScholarInfoBlocks versionData={versionData} />
            <div style={{ marginTop: "auto", paddingTop: "24px", borderTop: `1px solid ${BORDER}` }}>
              <StatusBanner variant="pending" />
            </div>
          </div>
        </div>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <ModalHeader title={title} meta={meta} onClose={onClose} />
          <div style={{ flex: 1, overflowY: "auto", padding: "32px" }}>
            <div style={{ maxWidth: "800px", margin: "0 auto" }}>
              <BiographySection loading={loading} versionData={versionData} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SupersededModal({ item, onClose }: { item: Submission; onClose: () => void }) {
  useLockBodyScroll();
  const isMobile = useIsMobile();
  const [versionData, setVersionData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    scholarsApi.getVersionById(item.id)
      .then((res) => { setVersionData(res.data); setLoading(false); })
      .catch((err) => { console.error("Failed to load version:", err); setLoading(false); });
  }, [item.id]);

  const title = versionData?.canonical_name || item.scholarName || "Untitled Submission";
  const meta = `${item.kind === 'new' ? 'New Scholar Submission' : 'Edit Proposal'} • ${item.lang.toUpperCase()} • Submitted ${item.date}`;

  if (isMobile) {
    return <MobileScholarModal title={title} meta={meta} versionData={versionData} loading={loading} variant="superseded" onClose={onClose} />;
  }

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 200,
        backgroundColor: "rgba(11, 67, 53, 0.6)",
        display: "flex", alignItems: "center", justifyContent: "center",
        backdropFilter: "blur(4px)"
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          backgroundColor: BG, borderRadius: "20px",
          width: "95%", maxWidth: "1200px", height: "90vh", maxHeight: "95vh",
          display: "flex", flexDirection: "row",
          boxShadow: "0 25px 80px rgba(0,0,0,0.15)", border: `1px solid ${BORDER}`,
          overflow: "hidden"
        }}
      >
        <div style={{
          width: "320px", flexShrink: 0,
          borderRight: `1px solid ${BORDER}`,
          backgroundColor: CARD_BG,
          display: "flex", flexDirection: "column",
          overflowY: "auto"
        }}>
          <ScholarImage url={versionData?.image_url} name={versionData?.canonical_name} style={{ aspectRatio: "3/4", borderBottom: `1px solid ${BORDER}`, flexShrink: 0 }} />

          <div style={{ padding: "24px", flex: 1, display: "flex", flexDirection: "column", gap: "24px" }}>
            <ScholarInfoBlocks versionData={versionData} />
            <div style={{ marginTop: "auto", paddingTop: "24px", borderTop: `1px solid ${BORDER}` }}>
              <StatusBanner variant="superseded" />
            </div>
          </div>
        </div>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <ModalHeader title={title} meta={meta} onClose={onClose} />
          <div style={{ flex: 1, overflowY: "auto", padding: "32px" }}>
            <div style={{ maxWidth: "800px", margin: "0 auto" }}>
              <BiographySection loading={loading} versionData={versionData} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FileDetailModal({ item, onClose }: { item: TableRow; onClose: () => void }) {
  useLockBodyScroll();
  const [viewingFile, setViewingFile] = useState(false);
  const [downloadingFile, setDownloadingFile] = useState(false);

  const hasFile = !!(item.mediaUrl || item.filePath);
  const isUpload = item.sourceType === "upload";
  const fileUrl = item.mediaUrl || item.filePath || "";

  const statusCopy: Record<Status, { title: string; desc: string; bg: string; color: string; border: string }> = {
    DRAFT: { title: "DRAFT", desc: "This item hasn't been submitted for review yet.", bg: "rgba(11, 67, 53, 0.08)", color: GREEN, border: "rgba(11, 67, 53, 0.2)" },
    PENDING: { title: "WAITING FOR REVIEW", desc: "An admin is currently reviewing this item.", bg: "rgba(184, 134, 11, 0.1)", color: colors.amber, border: "rgba(184, 134, 11, 0.3)" },
    APPROVED: { title: "APPROVED", desc: "This item is live on the scholar's page.", bg: "rgba(11, 67, 53, 0.08)", color: GREEN, border: "rgba(11, 67, 53, 0.2)" },
    REJECTED: { title: "REJECTED", desc: "This item was not approved.", bg: "rgba(139, 44, 44, 0.08)", color: RED, border: "rgba(139, 44, 44, 0.2)" },
    SUPERSEDED: { title: "SUPERSEDED", desc: "This item was replaced by a newer version.", bg: "rgba(112, 121, 116, 0.08)", color: MUTED, border: "rgba(112, 121, 116, 0.2)" },
  };
  const sc = statusCopy[item.status];

  const handleViewFile = async () => {
    setViewingFile(true);
    try {
      const response = await fetch(fileUrl);
      const blob = await response.blob();
      const correctType = item.fileType?.includes("audio") ? "audio/mpeg" : item.fileType?.includes("video") ? "video/mp4" : "application/pdf";
      const typedBlob = new Blob([blob], { type: correctType });
      const blobUrl = URL.createObjectURL(typedBlob);
      window.open(blobUrl, "_blank");
      setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
    } catch (error) {
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
      window.open(fileUrl, "_blank");
    } finally {
      setDownloadingFile(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 200,
        backgroundColor: "rgba(11, 67, 53, 0.6)",
        display: "flex", alignItems: "center", justifyContent: "center",
        backdropFilter: "blur(4px)"
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="file-detail-modal-content"
        style={{
          backgroundColor: BG, borderRadius: "12px",
          width: "95%", maxWidth: "560px",
          boxShadow: "0 25px 80px rgba(0,0,0,0.15)", border: `1px solid ${BORDER}`,
          overflow: "hidden"
        }}
      >
        <div style={{
          padding: "20px 24px", borderBottom: `1px solid ${BORDER}`,
          display: "flex", justifyContent: "space-between", alignItems: "flex-start",
          backgroundColor: CARD_BG
        }}>
          <div>
            <h2 style={{ ...SERIF, fontSize: "20px", fontWeight: 700, color: GREEN, margin: 0 }}>{item.primary}</h2>
            <p style={{ ...MONO, fontSize: "11px", color: MUTED, marginTop: "6px", letterSpacing: "0.05em" }}>
              {item.secondary} {item.tertiary ? `• ${item.tertiary}` : ""} • {item.date}
            </p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: MUTED, display: "flex" }}>
            <Icon name="close" size={24} />
          </button>
        </div>

        <div style={{ padding: "24px" }}>
          {item.description && <p style={{ fontSize: "14px", color: "rgba(11, 67, 53, 0.8)", lineHeight: 1.6, margin: "0 0 20px" }}>{item.description}</p>}

          <div style={{ padding: "14px 16px", backgroundColor: sc.bg, borderRadius: "10px", border: `1px solid ${sc.border}`, marginBottom: "20px" }}>
            <p style={{ ...MONO, fontSize: "10px", fontWeight: 700, color: sc.color, margin: 0, letterSpacing: "0.1em" }}>{sc.title}</p>
            <p style={{ fontSize: "12px", color: sc.color, margin: "4px 0 0", lineHeight: 1.4, opacity: 0.8 }}>{sc.desc}</p>
          </div>

          {hasFile ? (
            <div style={{ display: "flex", gap: "10px", flexDirection: "column" }}>
              {isUpload ? (
                <>
                  <button onClick={handleViewFile} disabled={viewingFile} style={{
                    width: "100%", padding: "10px", border: `2px solid ${GREEN}`,
                    backgroundColor: viewingFile ? "rgba(11, 67, 53, 0.2)" : "transparent",
                    color: viewingFile ? BG : GREEN, borderRadius: "8px",
                    fontSize: "12px", fontWeight: 600, fontFamily: "'Hanken Grotesk', sans-serif", cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", transition: "all 0.3s"
                  }}>
                    <Icon name={viewingFile ? "hourglass_empty" : "visibility"} size={16} /> VIEW FILE
                  </button>
                  <button onClick={handleDownloadFile} disabled={downloadingFile} style={{
                    width: "100%", padding: "10px", border: `2px solid ${GREEN}`,
                    backgroundColor: downloadingFile ? "rgba(11, 67, 53, 0.2)" : GREEN, 
                    color: downloadingFile ? BG : BG, borderRadius: "8px",
                    fontSize: "12px", fontWeight: 600, fontFamily: "'Hanken Grotesk', sans-serif", cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", transition: "all 0.3s"
                  }}>
                    <Icon name={downloadingFile ? "hourglass_empty" : "download"} size={16} /> DOWNLOAD
                  </button>
                </>
              ) : (
                <a href={fileUrl} target="_blank" rel="noopener noreferrer" style={{
                  width: "100%", padding: "10px", backgroundColor: GREEN, color: BG,
                  borderRadius: "8px", fontSize: "12px", fontWeight: 600, fontFamily: "'Hanken Grotesk', sans-serif", textDecoration: "none",
                  textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", transition: "all 0.3s"
                }}>
                  <Icon name="open_in_new" size={16} /> OPEN LINK
                </a>
              )}
            </div>
          ) : (
            <p style={{ fontSize: "13px", color: MUTED, fontStyle: "italic", margin: 0, textAlign: "center" }}>No file attached.</p>
          )}

          {item.status === "APPROVED" && item.link && (
            <button onClick={() => { onClose(); window.location.href = item.link as string; }} style={{
              marginTop: "14px", width: "100%", padding: "10px",
              border: `2px solid ${GREEN}`, backgroundColor: "transparent", color: GREEN,
              borderRadius: "8px", fontSize: "12px", fontWeight: 600, fontFamily: "'Hanken Grotesk', sans-serif", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", transition: "all 0.3s"
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = GREEN; e.currentTarget.style.color = BG; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = GREEN; }}
            >
              <Icon name="check_circle" size={16} /> VIEW ON SCHOLAR PAGE
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Small components ─────────────────────────────────────── */
function HoverCard({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        border: `1px solid rgba(11, 67, 53, 0.1)`,
        boxShadow: hov ? "0px 6px 24px rgba(11, 67, 53, 0.12)" : "0px 4px 20px rgba(11, 67, 53, 0.08)",
        transform: hov ? "translateY(-2px)" : "translateY(0)",
        transition: "all 0.3s ease",
        backgroundColor: CARD_BG,
        borderRadius: "12px",
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
  const baseColor = danger ? RED : GREEN;
  
  let bg = "transparent";
  let color = baseColor;
  let border = `2px solid ${baseColor}`;

  if (variant === "primary") {
    bg = baseColor;
    color = BG;
    if (hov) { bg = BG; color = baseColor; }
  } else {
    if (hov) { bg = baseColor; color = BG; }
  }

  return (
    <button onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ 
        display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "6px", 
        padding: "8px 16px", border, borderRadius: "8px", backgroundColor: bg, color,
        fontSize: "12px", fontWeight: 600, letterSpacing: "0.03em", cursor: "pointer",
        transition: "all 0.3s", fontFamily: "'Hanken Grotesk', sans-serif",
        ...style 
      }}>
      {children}
    </button>
  );
}

function StatusBadge({ status, t }: { status: Status; t: (k: string) => string }) {
  const map: Record<Status, { bg: string; color: string; border: string }> = {
    DRAFT: { bg: "rgba(11, 67, 53, 0.08)", color: GREEN, border: "rgba(11, 67, 53, 0.2)" },
    PENDING: { bg: "rgba(184, 134, 11, 0.1)", color: colors.amber, border: "rgba(184, 134, 11, 0.3)" },
    APPROVED: { bg: "rgba(11, 67, 53, 0.08)", color: GREEN, border: "rgba(11, 67, 53, 0.2)" },
    REJECTED: { bg: "rgba(139, 44, 44, 0.08)", color: RED, border: "rgba(139, 44, 44, 0.2)" },
    SUPERSEDED: { bg: "rgba(112, 121, 116, 0.08)", color: MUTED, border: "rgba(112, 121, 116, 0.2)" },
  };
  const s = map[status];
  return (
    <span style={{ 
      ...MONO, fontSize: "10px", fontWeight: 700, letterSpacing: "0.08em", padding: "4px 10px", 
      borderRadius: "6px", backgroundColor: s.bg, color: s.color, border: `1px solid ${s.border}`, whiteSpace: "nowrap" 
    }}>
      {t(`dashboard.status.${status.toLowerCase()}`)}
    </span>
  );
}

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        ...MONO, fontSize: "11px", fontWeight: 600, letterSpacing: "0.08em", padding: "10px 16px",
        border: "none", borderBottom: `2px solid ${active ? GREEN : "transparent"}`,
        backgroundColor: active ? "rgba(11, 67, 53, 0.08)" : (hov ? "rgba(11, 67, 53, 0.05)" : "transparent"), 
        color: active ? GREEN : (hov ? GREEN : MUTED),
        cursor: "pointer", whiteSpace: "nowrap", transition: "all 0.2s",
        borderRadius: "8px 8px 0 0"
      }}
    >
      <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
        {children}
      </span>
    </button>
  );
}

function SectionTitle({ icon, title, action }: { icon: string; title: string; action?: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", color: GREEN }}>
        <Icon name={icon} size={18} />
        <h2 style={{ ...SERIF, fontSize: "18px", fontWeight: 700, margin: 0, letterSpacing: "-0.02em" }}>{title}</h2>
      </div>
      {action}
    </div>
  );
}

function EmptyRow({ text }: { text: string }) {
  return (
    <div style={{ textAlign: "center", padding: "40px 20px" }}>
      <Icon name="inbox" size={40} style={{ color: "rgba(11, 67, 53, 0.2)", marginBottom: "12px", display: "block" }} />
      <p style={{ fontSize: "14px", color: MUTED, fontStyle: "italic", margin: 0 }}>{text}</p>
    </div>
  );
}

function FilterChip({ active, onClick, children, count }: { active: boolean; onClick: () => void; children: React.ReactNode; count: number }) {
  const [hov, setHov] = useState(false);
  return (
    <button onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} style={{
      ...MONO, fontSize: "11px", fontWeight: 600, letterSpacing: "0.05em", padding: "6px 14px",
      borderRadius: "20px", 
      border: `1.5px solid ${active ? GREEN : "rgba(11, 67, 53, 0.2)"}`,
      backgroundColor: active ? GREEN : (hov ? "rgba(11, 67, 53, 0.05)" : "transparent"), 
      color: active ? BG : GREEN,
      cursor: "pointer", transition: "all 0.2s", display: "inline-flex", alignItems: "center", gap: "6px",
    }}>
      {children}
      <span style={{ opacity: 0.7 }}>{count}</span>
    </button>
  );
}

// Pagination Component
function Pagination({ currentPage, totalPages, onPageChange }: { 
  currentPage: number; 
  totalPages: number; 
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  const pages = [];
  for (let i = 1; i <= totalPages; i++) {
    pages.push(i);
  }

  return (
    <div style={{ 
      display: "flex", 
      justifyContent: "center", 
      alignItems: "center", 
      gap: "8px", 
      flexWrap: "wrap"
    }}>
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        style={{
          padding: "6px 12px",
          border: `1px solid ${BORDER}`,
          backgroundColor: currentPage === 1 ? "rgba(11, 67, 53, 0.05)" : CARD_BG,
          color: currentPage === 1 ? MUTED : GREEN,
          borderRadius: "6px",
          cursor: currentPage === 1 ? "not-allowed" : "pointer",
          opacity: currentPage === 1 ? 0.5 : 1,
          fontSize: "12px",
          fontWeight: 600,
          transition: "all 0.2s"
        }}
      >
        Previous
      </button>
      
      {pages.map(page => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          style={{
            padding: "6px 12px",
            border: `1px solid ${page === currentPage ? GREEN : BORDER}`,
            backgroundColor: page === currentPage ? GREEN : CARD_BG,
            color: page === currentPage ? BG : GREEN,
            borderRadius: "6px",
            cursor: "pointer",
            fontSize: "12px",
            fontWeight: 600,
            minWidth: "36px",
            transition: "all 0.2s"
          }}
        >
          {page}
        </button>
      ))}
      
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        style={{
          padding: "6px 12px",
          border: `1px solid ${BORDER}`,
          backgroundColor: currentPage === totalPages ? "rgba(11, 67, 53, 0.05)" : CARD_BG,
          color: currentPage === totalPages ? MUTED : GREEN,
          borderRadius: "6px",
          cursor: currentPage === totalPages ? "not-allowed" : "pointer",
          opacity: currentPage === totalPages ? 0.5 : 1,
          fontSize: "12px",
          fontWeight: 600,
          transition: "all 0.2s"
        }}
      >
        Next
      </button>
    </div>
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
  const th: React.CSSProperties = { ...MONO, fontSize: "10px", fontWeight: 700, letterSpacing: "0.08em", color: MUTED, textAlign: isRTL ? "right" : "left", padding: "0 0 12px", borderBottom: `1.5px solid ${BORDER}`, textTransform: "uppercase" };
  
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "600px" }}>
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
            <tr key={i} style={{ borderBottom: i === rows.length - 1 ? "none" : `1px solid ${BORDER}`, transition: "background-color 0.2s" }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(11, 67, 53, 0.04)")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
            >
              <td style={{ padding: "14px 0", fontSize: "14px", color: GREEN, verticalAlign: "middle", ...SERIF, fontWeight: 700 }}>{r.primary}</td>
              <td style={{ padding: "14px 0", fontSize: "12px", color: MUTED, verticalAlign: "middle", ...MONO }}>{r.secondary}</td>
              {colTertiary && <td style={{ padding: "14px 0", fontSize: "12px", color: MUTED, verticalAlign: "middle", ...MONO }}>{r.tertiary ?? "—"}</td>}
              <td style={{ padding: "14px 0", fontSize: "12px", color: MUTED, verticalAlign: "middle", ...MONO, whiteSpace: "nowrap" }}>{r.date}</td>
              <td style={{ padding: "14px 0", verticalAlign: "middle" }}><StatusBadge status={r.status} t={t} /></td>
              <td style={{ padding: "14px 0", textAlign: isRTL ? "left" : "right", verticalAlign: "middle" }}>
                <button 
                  onClick={() => onView(r)}
                  style={{ background: "none", border: "none", color: GREEN, fontWeight: 600, fontSize: "12px", cursor: "pointer", ...MONO, padding: "4px 8px", borderRadius: "6px", transition: "all 0.2s" }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "rgba(11, 67, 53, 0.08)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
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

  const th: React.CSSProperties = { ...MONO, fontSize: "10px", fontWeight: 700, letterSpacing: "0.08em", color: MUTED, textAlign: isRTL ? "right" : "left", padding: "0 0 12px", borderBottom: `1.5px solid ${BORDER}`, textTransform: "uppercase" };
  
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "600px" }}>
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
            <tr key={r.id} style={{ borderBottom: `1px solid ${BORDER}`, transition: "background-color 0.2s" }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(11, 67, 53, 0.04)")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
            >
              <td style={{ padding: "14px 0", fontSize: "11px", fontWeight: 700, color: r.kind === "new" ? GREEN : colors.amber, ...MONO, verticalAlign: "middle" }}>
                {r.kind === "new" ? t("dashboard.kind.new") : t("dashboard.kind.edit")}
              </td>
              <td style={{ padding: "14px 0", fontSize: "14px", color: GREEN, verticalAlign: "middle", ...SERIF, fontWeight: 700 }}>
                <Link to={`/scholars/${r.scholarId}?lang=${r.lang}&focus=version-${r.id}`} style={{ color: "inherit", textDecoration: "none" }}>
                  {r.scholarName}
                </Link>
              </td>
              <td style={{ padding: "14px 0", fontSize: "12px", color: MUTED, verticalAlign: "middle", ...MONO }}>{r.lang}</td>
              <td style={{ padding: "14px 0", fontSize: "12px", color: MUTED, verticalAlign: "middle", ...MONO }}>v{r.version}</td>
              <td style={{ padding: "14px 0", fontSize: "12px", color: MUTED, verticalAlign: "middle", ...MONO, whiteSpace: "nowrap" }}>{r.date}</td>
              <td style={{ padding: "14px 0", verticalAlign: "middle" }}><StatusBadge status={r.status} t={t} /></td>
              <td style={{ padding: "14px 0", textAlign: isRTL ? "left" : "right", verticalAlign: "middle" }}>
                <div style={{ display: "inline-flex", gap: "8px", flexWrap: "wrap", justifyContent: isRTL ? "flex-start" : "flex-end" }}>
                  {r.status === "DRAFT" && (
                    <>
                      <HoverBtn variant="primary" onClick={() => onAction("continue", r)}>{t("dashboard.actions.continue")}</HoverBtn>
                      <HoverBtn danger onClick={() => onAction("delete", r)}>{t("dashboard.actions.delete")}</HoverBtn>
                    </>
                  )}
                  {r.status === "REJECTED" && (
                    <>
                      <HoverBtn variant="primary" onClick={() => onAction("editRejected", r)}>Edit</HoverBtn>
                      <HoverBtn danger onClick={() => onAction("deleteRejected", r)}>{t("dashboard.actions.delete")}</HoverBtn>
                    </>
                  )}
                  {r.status === "PENDING" && <HoverBtn onClick={() => onAction("view", r)}>{t("dashboard.actions.view")}</HoverBtn>}
                  {r.status === "APPROVED" && <HoverBtn onClick={() => onAction("view", r)}>{t("dashboard.actions.view")}</HoverBtn>}
                  {r.status === "SUPERSEDED" && <HoverBtn onClick={() => onAction("view", r)}>{t("dashboard.actions.view")}</HoverBtn>}
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

  // ✅ RESPONSIVE: Detect mobile screen size
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isContributor = user?.role_name === "contributor" || user?.role_name === "admin";
  const username = (user as any)?.username ?? (user as any)?.displayName ?? "there";

  const [tab, setTab] = useState<ContributorTab>("overview");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");

  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [works, setWorks] = useState<TableRow[]>([]);
  const [media, setMedia] = useState<TableRow[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);

  const [submissionsPage, setSubmissionsPage] = useState(1);
  const [worksPage, setWorksPage] = useState(1);
  const [mediaPage, setMediaPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  const [previewItem, setPreviewItem] = useState<any>(null);
  const [supersededItem, setSupersededItem] = useState<Submission | null>(null);
  const [fileItem, setFileItem] = useState<TableRow | null>(null);

  useEffect(() => {
    if (tab === "submissions" || tab === "media" || tab === "works" || tab === "overview") {
      const fetchData = async () => {
        setIsLoadingData(true);
        try {
          const result = await scholarsApi.mySubmissions();
          const data = result.data;

          const mappedSubmissions: Submission[] = data.scholar_versions.map((v: any) => {
            const langCode = v.languages?.code || "en";
            return {
              id: v.version_id,
              scholarId: v.scholar_id,
              kind: v.version_type === "creation" ? "new" : "edit",
              scholarName: v.canonical_name || "Unknown Scholar",
              lang: langCode,
              version: 1,
              date: new Date(v.created_at).toLocaleDateString(),
              status: v.status.toUpperCase() as Status,
            };
          });

          const mappedWorks: TableRow[] = data.works.map((w: any) => {
            const version = w.scholar_versions;
            const langCode = version?.language_id === 1 ? 'en' : version?.language_id === 3 ? 'ar' : version?.language_id === 2 ? 'fr' : 'en';
            return {
              id: w.work_id,
              primary: w.title,
              secondary: version?.canonical_name || "Unknown",
              tertiary: w.format,
              date: new Date(w.created_at || Date.now()).toLocaleDateString(),
              status: w.status.toUpperCase() as Status,
              scholarId: version?.scholar_id,
              link: `/scholars/${version?.scholar_id}?lang=${langCode}&focus=work-${w.work_id}`,
              mediaUrl: w.media_url,
              filePath: w.file_path,
              fileType: w.file_type,
              fileName: w.file_name,
              sourceType: w.source_type,
              description: w.description,
            };
          });

          const mappedMedia: TableRow[] = data.media.map((m: any) => {
            const version = m.scholar_versions;
            const langCode = version?.language_id === 1 ? 'en' : version?.language_id === 3 ? 'ar' : version?.language_id === 2 ? 'fr' : 'en';
            return {
              id: m.media_id,
              primary: m.title || m.file_name || "Untitled",
              secondary: version?.canonical_name || "Unknown",
              tertiary: m.file_type || "Media",
              date: new Date(m.uploaded_at || m.created_at || Date.now()).toLocaleDateString(),
              status: m.status.toUpperCase() as Status,
              scholarId: version?.scholar_id,
              link: `/scholars/${version?.scholar_id}?lang=${langCode}&focus=media-${m.media_id}`,
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

  const filteredSubmissions = useMemo(() => {
    if (statusFilter === "ALL") return submissions;
    return submissions.filter((s) => s.status === statusFilter);
  }, [statusFilter, submissions]);

  const submissionsTotalPages = Math.ceil(filteredSubmissions.length / ITEMS_PER_PAGE);
  const worksTotalPages = Math.ceil(works.length / ITEMS_PER_PAGE);
  const mediaTotalPages = Math.ceil(media.length / ITEMS_PER_PAGE);

  const paginatedSubmissions = filteredSubmissions.slice(
    (submissionsPage - 1) * ITEMS_PER_PAGE,
    submissionsPage * ITEMS_PER_PAGE
  );

  const paginatedWorks = works.slice(
    (worksPage - 1) * ITEMS_PER_PAGE,
    worksPage * ITEMS_PER_PAGE
  );

  const paginatedMedia = media.slice(
    (mediaPage - 1) * ITEMS_PER_PAGE,
    mediaPage * ITEMS_PER_PAGE
  );

  useEffect(() => {
    setSubmissionsPage(1);
  }, [statusFilter]);

  const counts = useMemo(() => {
    const c: Record<StatusFilter, number> = { ALL: submissions.length, DRAFT: 0, PENDING: 0, APPROVED: 0, REJECTED: 0, SUPERSEDED: 0 };
    submissions.forEach((s) => { if (c[s.status] !== undefined) c[s.status]++; });
    return c;
  }, [submissions]);

  const handleSubmissionAction = async (action: "continue" | "delete" | "view" | "history" | "resubmit" | "editRejected" | "deleteRejected", row: Submission) => {
    let targetRoute = "";
    const langUpper = row.lang.toUpperCase();
    
    if (row.kind === "new" && !row.scholarId) targetRoute = `/scholars/submit/${langUpper}?draftId=${row.id}`;
    else if (row.kind === "new" && row.scholarId) targetRoute = `/scholars/${row.scholarId}/submit/${langUpper}?draftId=${row.id}`;
    else if (row.kind === "edit") targetRoute = `/scholars/${row.scholarId}/edit/${langUpper}?draftId=${row.id}`;
    else targetRoute = `/scholars/submit/${langUpper}?draftId=${row.id}`;

    if (action === "continue" || action === "resubmit") navigate(targetRoute);
    else if (action === "editRejected") {
      if (row.kind === "new") navigate(`/scholars/submit/${langUpper}?rejectedId=${row.id}`);
      else navigate(`/scholars/${row.scholarId}/edit/${langUpper}?rejectedId=${row.id}`);
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
      if (row.status === "APPROVED") navigate(`/scholars/${row.scholarId}?lang=${row.lang.toLowerCase()}&focus=version-${row.id}`);
      else if (row.status === "PENDING") setPreviewItem(row);
      else if (row.status === "SUPERSEDED") setSupersededItem(row);
      else if (row.status === "DRAFT") navigate(targetRoute); 
    } 
    else if (action === "history") {
      navigate(`/scholars/${row.scholarId}/history`);
    }
  };

  const handleViewItem = (item: TableRow) => {
    setFileItem(item);
  };

  const tabs: { id: ContributorTab; label: string; icon: string }[] = [
    { id: "overview", label: t("dashboard.tabs.overview"), icon: "grid_view" },
    { id: "submissions", label: t("dashboard.tabs.submissions"), icon: "outbox" },
    { id: "media", label: t("dashboard.tabs.media"), icon: "perm_media" },
    { id: "works", label: t("dashboard.tabs.works"), icon: "menu_book" },
    { id: "notifications", label: t("dashboard.tabs.notifications"), icon: "notifications" },
  ];
  
  // ✅ RESPONSIVE: Adjust card padding for mobile, and use a flex gap (instead of
  // scattered margins on the title/filters/pagination) so spacing stays even top-to-bottom
  const cardStyle: React.CSSProperties = {
    padding: isMobile ? "16px" : "24px 28px",
    display: "flex",
    flexDirection: "column",
    gap: isMobile ? "14px" : "18px",
  };

  return (
    <div
      dir={isRTL ? "rtl" : "ltr"}
      style={{
        ...SANS,
        backgroundColor: BG,
        backgroundImage: "radial-gradient(circle at 50% 0%, rgba(184, 134, 11, 0.06) 0%, transparent 60%)",
        minHeight: "100vh",
        color: GREEN,
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;700&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap');
        .material-symbols-outlined { font-variation-settings: 'FILL' 0,'wght' 400,'GRAD' 0,'opsz' 24; font-family: 'Material Symbols Outlined'; display: inline-block; vertical-align: middle; }
        .op-tabs { display: flex; gap: 2px; overflow-x: auto; border-bottom: 1.5px solid rgba(11, 67, 53, 0.15); }
        .op-tabs::-webkit-scrollbar { display: none; }

        /* ✅ RESPONSIVE: Media queries for the small (non-split) modal */
        @media (max-width: 768px) {
          .file-detail-modal-content {
            width: 100% !important;
            max-width: 100% !important;
            border-radius: 0 !important;
            max-height: 100vh !important;
            overflow-y: auto !important;
          }
        }
      `}</style>

      {previewItem && <PreviewModal item={previewItem} onClose={() => setPreviewItem(null)} />}
      {supersededItem && <SupersededModal item={supersededItem} onClose={() => setSupersededItem(null)} />}
      {fileItem && <FileDetailModal item={fileItem} onClose={() => setFileItem(null)} />}

      {/* ✅ RESPONSIVE: Main container adapts to column layout on mobile, reduced padding.
          Extra top/bottom breathing room under the navbar and above the footer. */}
      <div style={{ 
        maxWidth: "1150px", 
        margin: "0 auto", 
        padding: isMobile ? "32px 16px 48px" : "64px 32px 80px", 
        display: "flex", 
        flexDirection: isMobile ? "column" : "row",
        gap: isMobile ? "16px" : "32px" 
      }}>
        
        {/* ✅ RESPONSIVE: Hide ProfileSidebar on mobile */}
        {!isMobile && <ProfileSidebar role={isContributor ? "contributor" : "user"} active="dashboard" />}

        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: "20px" }}>
          <div>
            <p style={{ ...MONO, fontSize: isMobile ? "10px" : "11px", textTransform: "uppercase", letterSpacing: "0.08em", opacity: 0.7, marginBottom: "4px" }}>DASHBOARD</p>
            {/* ✅ RESPONSIVE: Smaller heading on mobile */}
            <h1 style={{ ...SERIF, fontSize: isMobile ? "22px" : "28px", fontWeight: 700, color: GREEN, margin: "0 0 4px" }}>
              {t("dashboard.welcome")}, {username}
            </h1>
            <p style={{ fontSize: isMobile ? "12px" : "14px", color: MUTED, margin: 0 }}>
              {isContributor ? (
                <>{t("dashboard.roleLabel")}: <strong style={{ color: GREEN }}>{t("dashboard.roleContributor")}</strong></>
              ) : (
                t("dashboard.welcomeUser")
              )}
            </p>
          </div>

          {!isContributor && (
            <HoverCard style={{
              padding: isMobile ? "16px" : "20px 24px", 
              backgroundColor: GREEN, 
              border: `2px solid ${GREEN}`,
              display: "flex", 
              alignItems: "center", 
              justifyContent: "space-between", 
              gap: "16px", 
              flexWrap: "wrap",
            }}>
              <div>
                <p style={{ ...SERIF, fontSize: isMobile ? "14px" : "16px", fontWeight: 700, color: BG, margin: 0 }}>{t("dashboard.cta.title")}</p>
                <p style={{ fontSize: isMobile ? "11px" : "13px", color: "rgba(252, 250, 245, 0.8)", margin: "4px 0 0" }}>{t("dashboard.cta.desc")}</p>
              </div>
              <button
                onClick={() => navigate("/scholars/submit/")}
                style={{ 
                  display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "6px", 
                  padding: "10px 20px", border: `2px solid ${BG}`, borderRadius: "8px", 
                  backgroundColor: BG, color: GREEN,
                  fontSize: "12px", fontWeight: 600, letterSpacing: "0.03em", cursor: "pointer",
                  transition: "all 0.3s", fontFamily: "'Hanken Grotesk', sans-serif",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = BG; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = BG; e.currentTarget.style.color = GREEN; }}
              >
                <Icon name="add" size={16} /> {t("dashboard.cta.button")}
              </button>
            </HoverCard>
          )}

          <div className="op-tabs" style={{ overflowX: isMobile ? "scroll" : "visible" }}>
            {tabs.map((tb) => (
              <TabBtn key={tb.id} active={tab === tb.id} onClick={() => setTab(tb.id as ContributorTab)}>
                <Icon name={tb.icon} size={14} /> {tb.label}
              </TabBtn>
            ))}
          </div>

          {tab === "overview" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {/* ✅ RESPONSIVE: Stats grid becomes 2 columns on mobile */}
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(4, 1fr)", gap: isMobile ? "10px" : "12px" }}>
                {[
                  [t("dashboard.stats.scholars"), submissions.length],
                  [t("dashboard.stats.versions"), submissions.length],
                  [t("dashboard.stats.media"), media.length],
                  [t("dashboard.stats.works"), works.length],
                ].map(([label, val]) => (
                  <HoverCard key={label as string} style={{ padding: isMobile ? "10px 12px" : "12px 16px" }}>
                    <p style={{ ...MONO, fontSize: "9px", color: MUTED, letterSpacing: "0.05em", margin: "0 0 4px", textTransform: "uppercase" }}>{(label as string)}</p>
                    <p style={{ ...SERIF, fontSize: isMobile ? "20px" : "24px", fontWeight: 700, color: GREEN, margin: 0 }}>{val}</p>
                  </HoverCard>
                ))}
              </div>

              <HoverCard style={cardStyle}>
                <SectionTitle icon="history" title={t("dashboard.overview.recentActivity")} />
                <div>
                  {submissions.slice(0, 3).map((a, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: i === 2 ? "none" : `1px solid ${BORDER}`, flexWrap: isMobile ? "wrap" : "nowrap", gap: isMobile ? "8px" : 0 }}>
                      <div>
                        <p style={{ fontSize: isMobile ? "13px" : "14px", color: GREEN, margin: "0 0 4px", fontWeight: 600 }}>
                          {a.kind === "new" ? "New scholar submitted" : "Edit proposed"}
                        </p>
                        <p style={{ ...MONO, fontSize: "11px", color: MUTED, margin: 0 }}>{a.scholarName} — {a.lang}</p>
                      </div>
                      <span style={{ ...MONO, fontSize: "11px", color: "rgba(11, 67, 53, 0.4)", whiteSpace: "nowrap" }}>{a.date}</span>
                    </div>
                  ))}
                  {submissions.length === 0 && <EmptyRow text="No recent activity" />}
                </div>
              </HoverCard>
            </div>
          )}

          {tab === "submissions" && (
            <HoverCard style={cardStyle}>
              <SectionTitle
                icon="outbox"
                title={t("dashboard.tabs.submissions")}
                action={
                  <HoverBtn onClick={() => navigate("/scholars/submit/")}>
                    <Icon name="add" size={14} /> {t("dashboard.actions.newScholar")}
                  </HoverBtn>
                }
              />

              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                <FilterChip active={statusFilter === "ALL"} onClick={() => setStatusFilter("ALL")} count={counts.ALL}>{t("dashboard.filter.all")}</FilterChip>
                <FilterChip active={statusFilter === "DRAFT"} onClick={() => setStatusFilter("DRAFT")} count={counts.DRAFT}>{t("dashboard.status.draft")}</FilterChip>
                <FilterChip active={statusFilter === "PENDING"} onClick={() => setStatusFilter("PENDING")} count={counts.PENDING}>{t("dashboard.status.pending")}</FilterChip>
                <FilterChip active={statusFilter === "APPROVED"} onClick={() => setStatusFilter("APPROVED")} count={counts.APPROVED}>{t("dashboard.status.approved")}</FilterChip>
                <FilterChip active={statusFilter === "REJECTED"} onClick={() => setStatusFilter("REJECTED")} count={counts.REJECTED}>{t("dashboard.status.rejected")}</FilterChip>
                <FilterChip active={statusFilter === "SUPERSEDED"} onClick={() => setStatusFilter("SUPERSEDED")} count={counts.SUPERSEDED}>{t("dashboard.status.superseded")}</FilterChip>
              </div>

              {isLoadingData ? <EmptyRow text="Loading submissions..." /> : (
                <>
                  <SubmissionsTable rows={paginatedSubmissions} t={t} isRTL={isRTL} onAction={handleSubmissionAction} />
                  <Pagination 
                    currentPage={submissionsPage} 
                    totalPages={submissionsTotalPages} 
                    onPageChange={setSubmissionsPage} 
                  />
                </>
              )}
            </HoverCard>
          )}

          {tab === "media" && (
            <HoverCard style={cardStyle}>
              <SectionTitle icon="perm_media" title={t("dashboard.tabs.media")} />
              <p style={{ ...MONO, fontSize: "10px", color: "rgba(11, 67, 53, 0.4)", letterSpacing: "0.06em", fontStyle: "italic" }}>
                {t("dashboard.media.tempNote")}
              </p>
              {isLoadingData ? <EmptyRow text="Loading media..." /> : (
                <>
                  <StatusTable t={t} isRTL={isRTL} colPrimary={t("dashboard.table.file")} colSecondary={t("dashboard.table.scholar")} colTertiary={t("dashboard.table.type")} emptyText={t("dashboard.empty.media")} rows={paginatedMedia} onView={handleViewItem} />
                  <Pagination 
                    currentPage={mediaPage} 
                    totalPages={mediaTotalPages} 
                    onPageChange={setMediaPage} 
                  />
                </>
              )}
            </HoverCard>
          )}

          {tab === "works" && (
            <HoverCard style={cardStyle}>
              <SectionTitle icon="menu_book" title={t("dashboard.tabs.works")} />
              {isLoadingData ? <EmptyRow text="Loading works..." /> : (
                <>
                  <StatusTable t={t} isRTL={isRTL} colPrimary={t("dashboard.table.title")} colSecondary={t("dashboard.table.scholar")} colTertiary={t("dashboard.table.type")} emptyText={t("dashboard.empty.works")} rows={paginatedWorks} onView={handleViewItem} />
                  <Pagination 
                    currentPage={worksPage} 
                    totalPages={worksTotalPages} 
                    onPageChange={setWorksPage} 
                  />
                </>
              )}
            </HoverCard>
          )}

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