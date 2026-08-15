// src/pages/Authentication/DashboardPage.tsx

import React, { useState, useMemo } from "react";
import { useLang } from "../../context/LanguageContext";
import { useAuth } from "../../context/AuthContext";
import ProfileSidebar from "../../components/ProfileSidebar";
import { useNavigate } from "react-router-dom";

/* ─────────────────────────────────────────────
   Oulamauna — Dashboard (User / Contributor)
───────────────────────────────────────────── */

type Status = "DRAFT" | "PENDING" | "APPROVED" | "REJECTED";
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

/* ── Mock data (clearly marked, until backend endpoints exist) ───── */
interface Submission {
  id: number;
  kind: SubmissionKind;
  scholarName: string;      // for "new" this is the scholar being created; for "edit" the scholar being edited
  lang: string;
  version: number;
  date: string;
  status: Status;
}

const MOCK = {
  stats: { scholars: 2, versions: 5, media: 3, works: 4 },
  recentActivity: [
    { text: "Scholar version submitted for review", detail: "Malek Bennabi — French", date: "2 days ago" },
    { text: "Media uploaded", detail: "Lecture.mp3 — Malek Bennabi", date: "4 days ago" },
    { text: "Contribution approved", detail: "Abdelhamid Ben Badis — English", date: "1 week ago" },
  ],
  submissions: [
    { id: 1, kind: "new", scholarName: "Abdelhamid Ben Badis", lang: "English", version: 1, date: "7/27/2026", status: "PENDING" },
    { id: 2, kind: "new", scholarName: "Malek Bennabi", lang: "English", version: 1, date: "6/12/2026", status: "APPROVED" },
    { id: 3, kind: "edit", scholarName: "Malek Bennabi", lang: "French", version: 2, date: "7/2/2026", status: "APPROVED" },
    { id: 4, kind: "edit", scholarName: "Malek Bennabi", lang: "Arabic", version: 3, date: "7/29/2026", status: "PENDING" },
    { id: 5, kind: "new", scholarName: "Ibn Badis Draft Notes", lang: "Arabic", version: 1, date: "8/10/2026", status: "DRAFT" },
    { id: 6, kind: "edit", scholarName: "Abdelhamid Ben Badis", lang: "French", version: 2, date: "8/12/2026", status: "DRAFT" },
    { id: 7, kind: "edit", scholarName: "Malek Bennabi", lang: "English", version: 1, date: "5/2/2026", status: "REJECTED" },
  ] as Submission[],
  works: [
    { title: "Conditions of the Renaissance", scholar: "Malek Bennabi", type: "Reference", date: "7/18/2026", status: "PENDING" as Status },
  ],
  media: [
    { file: "Lecture.mp3", scholar: "Malek Bennabi", type: "Audio", date: "7/22/2026", status: "PENDING" as Status },
  ],
};

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

/* ── Generic status table (used by Works & Media) ─────────── */
interface TableRow { primary: string; secondary: string; tertiary?: string; date: string; status: Status; }

function StatusTable({
  rows, emptyText, t, colPrimary, colSecondary, colTertiary, isRTL,
}: {
  rows: TableRow[]; emptyText: string; t: (k: string) => string;
  colPrimary: string; colSecondary: string; colTertiary?: string; isRTL: boolean;
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
            <th style={{ ...th, textAlign: isRTL ? "left" : "right" }}>{t("dashboard.table.status")}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} style={{ borderBottom: i === rows.length - 1 ? "none" : "1px solid #f0f1ee" }}>
              <td style={{ ...td, ...SERIF, fontWeight: 700 }}>{r.primary}</td>
              <td style={{ ...td, ...MONO, fontSize: "11px", color: MUTED }}>{r.secondary}</td>
              {colTertiary && <td style={{ ...td, ...MONO, fontSize: "11px", color: MUTED }}>{r.tertiary ?? "—"}</td>}
              <td style={{ ...td, ...MONO, fontSize: "11px", color: MUTED, whiteSpace: "nowrap" }}>{r.date}</td>
              <td style={{ ...td, textAlign: isRTL ? "left" : "right" }}><StatusBadge status={r.status} t={t} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ── Submissions table: new + edit + drafts + versions, with row actions ── */
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
              <td style={{ ...td, ...SERIF, fontWeight: 700 }}>{r.scholarName}</td>
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
                  {r.status === "PENDING" && (
                    <HoverBtn onClick={() => onAction("view", r)}>{t("dashboard.actions.view")}</HoverBtn>
                  )}
                  {r.status === "APPROVED" && (
                    <>
                      <HoverBtn onClick={() => onAction("view", r)}>{t("dashboard.actions.view")}</HoverBtn>
                      <HoverBtn onClick={() => onAction("history", r)}>{t("dashboard.actions.history")}</HoverBtn>
                    </>
                  )}
                  {r.status === "REJECTED" && (
                    <>
                      <HoverBtn onClick={() => onAction("view", r)}>{t("dashboard.actions.view")}</HoverBtn>
                      <HoverBtn variant="primary" onClick={() => onAction("resubmit", r)}>{t("dashboard.actions.resubmit")}</HoverBtn>
                    </>
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
   MAIN
───────────────────────────────────────────── */
export default function DashboardPage() {
  const { lang, t } = useLang();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isRTL = lang === "AR";

  // ── TEMP TEST OVERRIDE ────────────────────────────────────────
  // ?asContributor=true / ?asContributor=false forces the view for testing.
  // DELETE once user.allowed_to_contribute is real.
  const forceContributor = new URLSearchParams(window.location.search).get("asContributor");
  const isContributor: boolean =
    forceContributor !== null
      ? forceContributor === "true"
      : !!(user as any)?.allowed_to_contribute || (user as any)?.role === "contributor";
  // ────────────────────────────────────────────────────────────

  const username = (user as any)?.username ?? (user as any)?.displayName ?? "there";

  const [tab, setTab] = useState<ContributorTab>("overview");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");

  const filteredSubmissions = useMemo(() => {
    if (statusFilter === "ALL") return MOCK.submissions;
    return MOCK.submissions.filter((s) => s.status === statusFilter);
  }, [statusFilter]);

  const counts = useMemo(() => {
    const c: Record<StatusFilter, number> = { ALL: MOCK.submissions.length, DRAFT: 0, PENDING: 0, APPROVED: 0, REJECTED: 0 };
    MOCK.submissions.forEach((s) => { c[s.status]++; });
    return c;
  }, []);

  // Mock-only handlers — wire these to real routes/API calls once the backend exists.
  const handleSubmissionAction = (action: "continue" | "delete" | "view" | "history" | "resubmit", row: Submission) => {
    if (action === "continue" || action === "resubmit") {
      navigate(row.kind === "new" ? "/scholars/submit/" : `/scholars/edit/${encodeURIComponent(row.scholarName)}`);
    } else if (action === "view") {
      navigate(`/scholars/${encodeURIComponent(row.scholarName)}`);
    } else if (action === "history") {
      navigate(`/scholars/${encodeURIComponent(row.scholarName)}/history`);
    } else if (action === "delete") {
      // TODO: confirm dialog + real delete call once backend exists
      console.log("delete draft", row.id);
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
      `}</style>

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
                    [t("dashboard.stats.scholars"), MOCK.stats.scholars],
                    [t("dashboard.stats.versions"), MOCK.stats.versions],
                    [t("dashboard.stats.media"), MOCK.stats.media],
                    [t("dashboard.stats.works"), MOCK.stats.works],
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
                    {MOCK.recentActivity.map((a, i) => (
                      <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: i === MOCK.recentActivity.length - 1 ? "none" : "1px solid #f0f1ee" }}>
                        <div>
                          <p style={{ fontSize: "13px", color: "#191c1b", margin: "0 0 2px", fontWeight: 600 }}>{a.text}</p>
                          <p style={{ ...MONO, fontSize: "10px", color: MUTED, margin: 0 }}>{a.detail}</p>
                        </div>
                        <span style={{ ...MONO, fontSize: "10px", color: "#c0c9c3", whiteSpace: "nowrap" }}>{a.date}</span>
                      </div>
                    ))}
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

          {/* ── MY SUBMISSIONS (unified: new + edit + drafts + versions) ── */}
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
              </div>

              <SubmissionsTable rows={filteredSubmissions} t={t} isRTL={isRTL} onAction={handleSubmissionAction} />
            </HoverCard>
          )}

          {/* ── MEDIA WORKSPACE ─────────────────────────────── */}
          {tab === "media" && isContributor && (
            <HoverCard style={cardStyle}>
              <SectionTitle icon="perm_media" title={t("dashboard.tabs.media")} action={<HoverBtn variant="primary"><Icon name="add_circle" size={13} /> {t("dashboard.media.addButton")}</HoverBtn>} />
              <p style={{ ...MONO, fontSize: "9px", color: "#c0c9c3", letterSpacing: "0.06em", marginBottom: "12px", fontStyle: "italic" }}>
                {t("dashboard.media.tempNote")}
              </p>
              <StatusTable
                t={t} isRTL={isRTL}
                colPrimary={t("dashboard.table.file")}
                colSecondary={t("dashboard.table.scholar")}
                colTertiary={t("dashboard.table.type")}
                emptyText={t("dashboard.empty.media")}
                rows={MOCK.media.map((m) => ({ primary: m.file, secondary: m.scholar, tertiary: m.type, date: m.date, status: m.status }))}
              />
            </HoverCard>
          )}

          {/* ── WORKS & REFERENCES WORKSPACE ─────────────────────────────── */}
          {tab === "works" && isContributor && (
            <HoverCard style={cardStyle}>
              <SectionTitle icon="menu_book" title={t("dashboard.tabs.works")} action={<HoverBtn variant="primary"><Icon name="add_circle" size={13} /> {t("dashboard.works.addButton")}</HoverBtn>} />
              <StatusTable
                t={t} isRTL={isRTL}
                colPrimary={t("dashboard.table.title")}
                colSecondary={t("dashboard.table.scholar")}
                colTertiary={t("dashboard.table.type")}
                emptyText={t("dashboard.empty.works")}
                rows={MOCK.works.map((w) => ({ primary: w.title, secondary: w.scholar, tertiary: w.type, date: w.date, status: w.status }))}
              />
            </HoverCard>
          )}

          {/* ── NOTIFICATIONS ─────────────────────────────── */}
          {tab === "notifications" && (
            <HoverCard style={cardStyle}>
              <SectionTitle icon="notifications" title={t("dashboard.tabs.notifications")} />
              <EmptyRow text={t("dashboard.empty.notifications")} />
            </HoverCard>
          )}

          {/* ── WATCHLIST ─────────────────────────────── */}
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