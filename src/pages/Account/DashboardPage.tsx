// src/pages/Authentication/DashboardPage.tsx

import React, { useState, useMemo, useEffect } from "react";
import { useLang } from "../../context/LanguageContext";
import { useAuth } from "../../context/AuthContext";
import { scholarsApi } from "../../api/scholarsApi";
import ProfileSidebar from "../../components/ProfileSidebar";
import { useNavigate, Link } from "react-router-dom";

/* ─────────────────────────────────────────────
   Oulamauna — Dashboard (User / Contributor)
───────────────────────────────────────────── */

type Status = "DRAFT" | "PENDING" | "APPROVED" | "REJECTED" | "SUPERSEDED";
type SubmissionKind = "new" | "edit";
type UserTab = "overview" | "notifications" | "watchlist";
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

interface TableRow { 
  primary: string; 
  secondary: React.ReactNode;
  tertiary?: string; 
  date: string; 
  status: Status; 
  scholarId?: number;
  link?: string;
}

/* ── Modals ─────────────────────────────────────── */
function PreviewModal({ item, onClose }: { item: any; onClose: () => void }) {
  const isSubmission = 'kind' in item;
  const title = isSubmission ? item.scholarName : item.primary;
  const detail = isSubmission ? `${item.kind === 'new' ? 'New Scholar' : 'Edit Proposal'} • ${item.lang}` : `${item.secondary} • ${item.tertiary || 'Unknown'}`;
  
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, backgroundColor: "rgba(25,28,27,0.6)", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ backgroundColor: "#fff", borderRadius: "16px", padding: "32px", width: "480px", maxWidth: "calc(100vw - 32px)", boxShadow: "0 20px 60px rgba(0,0,0,0.2)", border: "1px solid rgba(192,201,195,0.3)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
          <h2 style={{ ...SERIF, fontSize: "20px", fontWeight: 700, color: "#0b4335", margin: 0 }}>Submission Details</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#707974", fontSize: "20px" }}>✕</button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <p style={{ ...MONO, fontSize: "9px", color: "#707974", letterSpacing: "0.1em", marginBottom: "4px" }}>TITLE / NAME</p>
            <p style={{ fontSize: "15px", fontWeight: 700, color: "#191c1b", margin: 0 }}>{title}</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <div>
              <p style={{ ...MONO, fontSize: "9px", color: "#707974", letterSpacing: "0.1em", marginBottom: "4px" }}>DETAILS</p>
              <p style={{ fontSize: "13px", color: "#404945", margin: 0 }}>{detail}</p>
            </div>
            <div>
              <p style={{ ...MONO, fontSize: "9px", color: "#707974", letterSpacing: "0.1em", marginBottom: "4px" }}>DATE</p>
              <p style={{ fontSize: "13px", color: "#404945", margin: 0 }}>{item.date}</p>
            </div>
          </div>
          <div style={{ padding: "16px", backgroundColor: "rgba(115,92,0,0.08)", border: "1px solid rgba(115,92,0,0.2)", borderRadius: "8px", display: "flex", alignItems: "center", gap: "12px" }}>
            <span style={{ fontSize: "20px" }}>⏳</span>
            <div>
              <p style={{ ...MONO, fontSize: "10px", fontWeight: 700, color: "#735c00", margin: 0, letterSpacing: "0.05em" }}>WAITING FOR REVIEW</p>
              <p style={{ fontSize: "12px", color: "#735c00", margin: "4px 0 0", lineHeight: 1.4 }}>An admin is currently reviewing this submission. You will be notified once a decision is made.</p>
            </div>
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "28px" }}>
          <button onClick={onClose} style={{ padding: "8px 20px", borderRadius: "6px", border: "1.5px solid #0b4335", backgroundColor: "#0b4335", color: "#fff", ...MONO, fontSize: "10px", fontWeight: 700, letterSpacing: "0.1em", cursor: "pointer" }}>CLOSE</button>
        </div>
      </div>
    </div>
  );
}

function SupersededModal({ item, onClose }: { item: Submission; onClose: () => void }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, backgroundColor: "rgba(25,28,27,0.6)", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ backgroundColor: "#fff", borderRadius: "16px", padding: "32px", width: "480px", maxWidth: "calc(100vw - 32px)", boxShadow: "0 20px 60px rgba(0,0,0,0.2)", border: "1px solid rgba(192,201,195,0.3)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
          <h2 style={{ ...SERIF, fontSize: "20px", fontWeight: 700, color: "#0b4335", margin: 0 }}>Version Superseded</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#707974", fontSize: "20px" }}>✕</button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <p style={{ ...MONO, fontSize: "9px", color: "#707974", letterSpacing: "0.1em", marginBottom: "4px" }}>SCHOLAR NAME</p>
            <p style={{ fontSize: "15px", fontWeight: 700, color: "#191c1b", margin: 0 }}>{item.scholarName}</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <div>
              <p style={{ ...MONO, fontSize: "9px", color: "#707974", letterSpacing: "0.1em", marginBottom: "4px" }}>LANGUAGE</p>
              <p style={{ fontSize: "13px", color: "#404945", margin: 0 }}>{item.lang}</p>
            </div>
            <div>
              <p style={{ ...MONO, fontSize: "9px", color: "#707974", letterSpacing: "0.1em", marginBottom: "4px" }}>DATE</p>
              <p style={{ fontSize: "13px", color: "#404945", margin: 0 }}>{item.date}</p>
            </div>
          </div>
          <div style={{ padding: "16px", backgroundColor: "rgba(112,121,116,0.08)", border: "1px solid rgba(112,121,116,0.2)", borderRadius: "8px", display: "flex", alignItems: "center", gap: "12px" }}>
            <span style={{ fontSize: "20px" }}>⚠️</span>
            <div>
              <p style={{ ...MONO, fontSize: "10px", fontWeight: 700, color: "#707974", margin: 0, letterSpacing: "0.05em" }}>SUPERSEDED BY NEWER VERSION</p>
              <p style={{ fontSize: "12px", color: "#707974", margin: "4px 0 0", lineHeight: 1.4 }}>This version has been replaced by a newer, approved version. It is kept here for your historical records.</p>
            </div>
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "28px" }}>
          <button onClick={onClose} style={{ padding: "8px 20px", borderRadius: "6px", border: "1.5px solid #c0c9c3", backgroundColor: "transparent", color: "#707974", ...MONO, fontSize: "10px", fontWeight: 700, letterSpacing: "0.1em", cursor: "pointer" }}>CLOSE</button>
          <button onClick={() => { onClose(); window.location.href = `/scholars/${item.scholarId}?lang=${item.lang}`; }} style={{ padding: "8px 20px", borderRadius: "6px", border: "1.5px solid #0b4335", backgroundColor: "#0b4335", color: "#fff", ...MONO, fontSize: "10px", fontWeight: 700, letterSpacing: "0.1em", cursor: "pointer" }}>VIEW LIVE VERSION</button>
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
  onAction: (action: "continue" | "delete" | "view" | "history" | "resubmit", row: Submission) => void;
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
                  {(r.status === "DRAFT" || r.status === "REJECTED") && (
                    <>
                      <HoverBtn variant="primary" onClick={() => onAction("continue", r)}>{t("dashboard.actions.continue")}</HoverBtn>
                      <HoverBtn danger onClick={() => onAction("delete", r)}>{t("dashboard.actions.delete")}</HoverBtn>
                    </>
                  )}
                  {r.status === "PENDING" && (
                    <HoverBtn onClick={() => onAction("view", r)}>{t("dashboard.actions.view")}</HoverBtn>
                  )}
                  {r.status === "APPROVED" && (
                    <>
                      <HoverBtn onClick={() => onAction("view", r)}>{t("dashboard.actions.view")}</HoverBtn>
                      <HoverBtn onClick={() => onAction("history", r)}>{t("dashboard.actions.history")}</HoverBtn>
                    </>
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

  // ✅ FETCH DATA FROM BACKEND
  useEffect(() => {
    if (isContributor && (tab === "submissions" || tab === "media" || tab === "works" || tab === "overview")) {
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
            const langCode = w.scholar_versions?.languages?.code || "en";
            return {
              primary: w.title,
              secondary: w.scholar_versions?.canonical_name || "Unknown",
              tertiary: w.format,
              date: new Date(w.created_at || Date.now()).toLocaleDateString(),
              status: w.status.toUpperCase() as Status,
              scholarId: w.scholar_versions?.scholar_id,
              link: `/scholars/${w.scholar_versions?.scholar_id}?lang=${langCode}&focus=work-${w.work_id}`,
            };
          });

          const mappedMedia: TableRow[] = data.media.map((m: any) => {
            const langCode = m.scholar_versions?.languages?.code || "en";
            return {
              primary: m.title || m.file_name || "Untitled",
              secondary: m.scholar_versions?.canonical_name || "Unknown",
              tertiary: m.file_type || "Media",
              date: new Date(m.uploaded_at || m.created_at || Date.now()).toLocaleDateString(),
              status: m.status.toUpperCase() as Status,
              scholarId: m.scholar_versions?.scholar_id,
              link: `/scholars/${m.scholar_versions?.scholar_id}?lang=${langCode}&focus=media-${m.media_id}`,
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
  }, [isContributor, tab]);

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
    const handleSubmissionAction = async (action: "continue" | "delete" | "view" | "history" | "resubmit", row: Submission) => {
    
    // ✅ DETERMINE THE EXACT ROUTE BASED ON YOUR 3 CASES (Using UPPERCASE lang)
    let targetRoute = "";
    const langUpper = row.lang.toUpperCase(); // ✅ FORCE UPPERCASE TO MATCH ROUTE TYPE
    
    if (row.kind === "new" && !row.scholarId) {
      // CASE 1: Brand New Scholar
      targetRoute = `/scholars/submit/${langUpper}?draftId=${row.id}`;
    } else if (row.kind === "new" && row.scholarId) {
      // CASE 2: Creating a New Version for an Existing Scholar
      targetRoute = `/scholars/${row.scholarId}/submit/${langUpper}?draftId=${row.id}`;
    } else if (row.kind === "edit") {
      // CASE 3: Editing an Existing Version
      targetRoute = `/scholars/${row.scholarId}/edit/${langUpper}?draftId=${row.id}`;
    } else {
      // Fallback
      targetRoute = `/scholars/submit/${langUpper}?draftId=${row.id}`;
    }

    // ✅ EXECUTE THE ACTION
    if (action === "continue" || action === "resubmit") {
      navigate(targetRoute);
    } 
    else if (action === "delete") {
      if (window.confirm(`Are you sure you want to permanently delete this draft?`)) {
        try {
          await scholarsApi.deleteDraft(row.id);
          setSubmissions((prev) => prev.filter((s) => s.id !== row.id));
          
          // ✅ Clear localStorage so the "ghost" draft doesn't reappear!
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
    else if (action === "view") {
      if (row.status === "APPROVED") {
        navigate(`/scholars/${row.scholarId}?lang=${row.lang.toLowerCase()}&focus=version-${row.id}`);
      } else if (row.status === "PENDING") {
        setPreviewItem(row);
      } else if (row.status === "SUPERSEDED") {
        setSupersededItem(row);
      } else if (row.status === "REJECTED" || row.status === "DRAFT") {
        navigate(targetRoute); // ✅ Goes to the exact correct route with UPPERCASE lang
      }
    } 
    else if (action === "history") {
      navigate(`/scholars/${row.scholarId}/history`);
    }
  };
  const handleViewItem = (item: TableRow) => {
    if (item.status === "APPROVED") {
      if (item.link) navigate(item.link);
    } else if (item.status === "PENDING") {
      setPreviewItem(item);
    } else if (item.status === "REJECTED") {
      if (item.scholarId) navigate(`/scholars/edit/${item.scholarId}`);
    }
  };

  const userTabs: { id: UserTab; label: string; icon: string }[] = [
    { id: "overview", label: t("dashboard.tabs.overview"), icon: "grid_view" },
    { id: "notifications", label: t("dashboard.tabs.notifications"), icon: "notifications" },
    { id: "watchlist", label: t("dashboard.tabs.watchlist"), icon: "bookmark" },
  ];
  
  const contributorTabs: { id: ContributorTab; label: string; icon: string }[] = [
    { id: "overview", label: t("dashboard.tabs.overview"), icon: "grid_view" },
    { id: "submissions", label: t("dashboard.tabs.submissions"), icon: "outbox" },
    { id: "media", label: t("dashboard.tabs.media"), icon: "perm_media" },
    { id: "works", label: t("dashboard.tabs.works"), icon: "menu_book" },
    { id: "notifications", label: t("dashboard.tabs.notifications"), icon: "notifications" },
    { id: "watchlist", label: t("dashboard.tabs.watchlist"), icon: "bookmark" },
  ];
  
  const tabs = isContributor ? contributorTabs : userTabs;
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
          {tab === "overview" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {isContributor && (
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
              )}

              {!isContributor && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }}>
                  <HoverCard style={cardStyle}>
                    <SectionTitle icon="person" title={t("dashboard.overview.profileTitle")} />
                    <p style={{ fontSize: "12px", color: MUTED, margin: 0 }}>{t("dashboard.overview.profileDesc")}</p>
                  </HoverCard>
                  <HoverCard style={cardStyle}>
                    <SectionTitle icon="bookmark" title={t("dashboard.overview.watchlistTitle")} />
                    <p style={{ fontSize: "12px", color: MUTED, margin: 0 }}>{t("dashboard.overview.watchlistDesc")}</p>
                  </HoverCard>
                  <HoverCard style={cardStyle}>
                    <SectionTitle icon="notifications" title={t("dashboard.overview.notificationsTitle")} />
                    <p style={{ fontSize: "12px", color: MUTED, margin: 0 }}>{t("dashboard.overview.notificationsDesc")}</p>
                  </HoverCard>
                </div>
              )}

              {isContributor && (
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
              )}

              {!isContributor && (
                <HoverCard style={{ ...cardStyle, backgroundColor: GREEN, border: "none" }}>
                  <h2 style={{ ...SERIF, fontSize: "18px", fontWeight: 700, color: "#fff", margin: "0 0 6px" }}>{t("dashboard.cta.title")}</h2>
                  <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.85)", margin: "0 0 18px", lineHeight: 1.6 }}>
                    {t("dashboard.cta.desc")}
                  </p>
                  <button
                    onClick={() => navigate("/scholars/submit/")}
                    style={{ ...BTN_PRIMARY, backgroundColor: "#fff", color: GREEN, border: "1.5px solid #fff" }}
                  >
                    <Icon name="add_circle" size={14} /> {t("dashboard.cta.button")}
                  </button>
                </HoverCard>
              )}
            </div>
          )}

          {/* ── MY SUBMISSIONS ── */}
          {tab === "submissions" && isContributor && (
            <HoverCard style={cardStyle}>
              <SectionTitle
                icon="outbox"
                title={t("dashboard.tabs.submissions")}
                action={
                  <div style={{ display: "flex", gap: "8px" }}>
                    <HoverBtn onClick={() => navigate("/scholars/submit/")}>
                      <Icon name="add_circle" size={12} /> {t("dashboard.actions.newScholar")}
                    </HoverBtn>
                    <HoverBtn onClick={() => navigate("/scholars/search?mode=edit")}>
                      <Icon name="edit" size={12} /> {t("dashboard.actions.editExisting")}
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
          {tab === "media" && isContributor && (
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
          {tab === "works" && isContributor && (
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

          {/* ── WATCHLIST ── */}
          {tab === "watchlist" && (
            <HoverCard style={cardStyle}>
              <SectionTitle icon="bookmark" title={t("dashboard.tabs.watchlist")} />
              <EmptyRow text={t("dashboard.empty.watchlist")} />
            </HoverCard>
          )}
        </div>
      </div>
    </div>
  );
}