import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useLang } from "../../context/LanguageContext";

/* ------------------------------------------------------------------ */
/*  Design tokens — Oulamnauna admin palette                          */
/* ------------------------------------------------------------------ */
const colors = {
  creamLight: "#fcfaf5",
  creamMid: "#f8f1de",
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

const Avatar: React.FC<{ name: string; size?: number; filled?: boolean }> = ({
  name,
  size = 36,
  filled = false,
}) => {
  const initials = name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        backgroundColor: filled ? colors.forestGreen : colors.creamMid,
        color: filled ? colors.creamLight : colors.forestGreen,
        border: `1px solid ${colors.forestGreen}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: fonts.headline,
        fontWeight: 700,
        fontSize: size * 0.4,
        letterSpacing: "0.02em",
        flexShrink: 0,
      }}
    >
      {initials}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Types & Mock data                                                  */
/* ------------------------------------------------------------------ */
type LangCode = "EN" | "AR" | "FR";
type SortOption = "newest" | "oldest" | "name";
type EditType = "bio_modified" | "work_added" | "work_modified" | "media_added" | "media_modified" | "vitals_updated" | "discipline_added";

interface ScholarSubmission {
  id: string;
  name: string;
  language: LangCode;
  editor: string;
  editorId: string;
  originalContributor: string;
  date: string;
  discipline: string;
  submittedAt: Date;
  editType: EditType;
  editDescription: string;
}

const SUBMISSIONS: ScholarSubmission[] = [
  { id: "sch_001_en", name: "Ibn al-Haytham", language: "EN", editor: "Dr. Fatima Al-Zahra", editorId: "user_fatima", originalContributor: "Karim Mansouri", date: "June 14, 2026", discipline: "Optics & Mathematics", submittedAt: new Date("2026-06-14"), editType: "bio_modified", editDescription: "Biography updated" },
  { id: "sch_001_ar", name: "ابن الهيثم", language: "AR", editor: "Ahmed Khalil", editorId: "user_ahmed", originalContributor: "Karim Mansouri", date: "June 14, 2026", discipline: "Optics & Mathematics", submittedAt: new Date("2026-06-14"), editType: "work_added", editDescription: "New work added" },
  { id: "sch_002_en", name: "Fatima al-Fihriya", language: "EN", editor: "Sara Al-Rashid", editorId: "user_sara", originalContributor: "Prof. Hassan", date: "June 13, 2026", discipline: "Education & Theology", submittedAt: new Date("2026-06-13"), editType: "media_added", editDescription: "Media files added" },
  { id: "sch_002_ar", name: "فاطمة الفهرية", language: "AR", editor: "Layla Hassan", editorId: "user_layla", originalContributor: "Prof. Hassan", date: "June 13, 2026", discipline: "Education & Theology", submittedAt: new Date("2026-06-13"), editType: "vitals_updated", editDescription: "Vital stats updated" },
  { id: "sch_002_fr", name: "Fatima al-Fihriya", language: "FR", editor: "Pierre Dubois", editorId: "user_pierre", originalContributor: "Marie Laurent", date: "June 12, 2026", discipline: "Education & Theology", submittedAt: new Date("2026-06-12"), editType: "work_modified", editDescription: "Work details modified" },
  { id: "sch_003_en", name: "Al-Zahrawi", language: "EN", editor: "Pedro Alves", editorId: "user_pedro", originalContributor: "Dr. Sarah", date: "June 11, 2026", discipline: "Medicine & Surgery", submittedAt: new Date("2026-06-11"), editType: "discipline_added", editDescription: "New discipline added" },
  { id: "sch_003_fr", name: "Abulcasis", language: "FR", editor: "Jean-Pierre Martin", editorId: "user_jean", originalContributor: "Dr. Sarah", date: "June 11, 2026", discipline: "Medicine & Surgery", submittedAt: new Date("2026-06-11"), editType: "bio_modified", editDescription: "Biography updated" },
  { id: "sch_004_en", name: "Maryam al-Asturlabiya", language: "EN", editor: "Karim Mansouri", editorId: "user_karim", originalContributor: "Dr. Fatima Al-Zahra", date: "June 9, 2026", discipline: "Astronomy", submittedAt: new Date("2026-06-09"), editType: "media_modified", editDescription: "Media files updated" },
  { id: "sch_004_ar", name: "مريم الأسطرلابية", language: "AR", editor: "Omar Ibn al-Khattab", editorId: "user_omar", originalContributor: "Dr. Fatima Al-Zahra", date: "June 9, 2026", discipline: "Astronomy", submittedAt: new Date("2026-06-09"), editType: "work_added", editDescription: "New work added" },
];

/* ------------------------------------------------------------------ */
/*  Stats helper                                                       */
/* ------------------------------------------------------------------ */
function getStats(rows: ScholarSubmission[]) {
  const now = new Date();
  const total = rows.length;
  const overdue = rows.filter((r) => {
    const daysOld = Math.floor((now.getTime() - r.submittedAt.getTime()) / (1000 * 60 * 60 * 24));
    return daysOld > 3;
  }).length;
  const newToday = rows.filter((r) => {
    const today = new Date();
    return r.submittedAt.toDateString() === today.toDateString();
  }).length;
  const thisWeek = rows.filter((r) => {
    const daysOld = Math.floor((now.getTime() - r.submittedAt.getTime()) / (1000 * 60 * 60 * 24));
    return daysOld <= 7;
  }).length;
  return { total, overdue, newToday, thisWeek, avgTime: "2h 15m" };
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */
export default function PendingEditsQueue() {
  const navigate = useNavigate();
  const { t, lang } = useLang();
  const isRTL = lang === "AR";

  const [filterLanguage, setFilterLanguage] = useState<LangCode | "all">("all");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [filterDiscipline, setFilterDiscipline] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [rows] = useState(SUBMISSIONS);
  const [stripTarget, setStripTarget] = useState<ScholarSubmission | null>(null);

  const stats = getStats(rows);

  const disciplines = useMemo(() => {
    const unique = [...new Set(rows.map((r) => r.discipline))];
    return unique.sort();
  }, [rows]);

  const filtered = useMemo(() => {
    let result = [...rows];
    if (filterLanguage !== "all") result = result.filter((s) => s.language === filterLanguage);
    if (filterDiscipline !== "all") result = result.filter((s) => s.discipline === filterDiscipline);
    result.sort((a, b) => {
      switch (sortBy) {
        case "newest": return b.submittedAt.getTime() - a.submittedAt.getTime();
        case "oldest": return a.submittedAt.getTime() - b.submittedAt.getTime();
        case "name":   return a.name.localeCompare(b.name);
        default:       return 0;
      }
    });
    return result;
  }, [rows, filterLanguage, sortBy, filterDiscipline, filterType]);

  const goToReview = (s: ScholarSubmission) => navigate(`/admin/pending/edits/${s.id}?lang=${s.language}`);
  const handleApprove = (id: string) => console.log("Approved:", id);
  const handleReject  = (id: string) => console.log("Rejected:", id);
  const confirmStrip  = () => { if (!stripTarget) return; setStripTarget(null); };

  const clearFilters = () => {
    setFilterLanguage("all");
    setSortBy("newest");
    setFilterDiscipline("all");
    setFilterType("all");
  };

  const hasActiveFilters = filterLanguage !== "all" || filterDiscipline !== "all" || filterType !== "all";

  const getLangName = (code: LangCode) => {
    switch (code) {
      case "EN": return t("reviewQueue.lang.en") || "English";
      case "AR": return t("reviewQueue.lang.ar") || "Arabic";
      case "FR": return t("reviewQueue.lang.fr") || "French";
    }
  };

  const getEditTypeStyle = (editType: EditType) => {
    const styles: Record<EditType, { bg: string; color: string; icon: string }> = {
      bio_modified: { bg: colors.creamMid, color: colors.forestGreen, icon: "auto_stories" },
      work_added: { bg: colors.creamMid, color: "#4a7fcb", icon: "add" },
      work_modified: { bg: colors.creamMid, color: "#4a7fcb", icon: "edit" },
      media_added: { bg: colors.creamMid, color: "#7c5e9e", icon: "add_photo_alternate" },
      media_modified: { bg: colors.creamMid, color: "#7c5e9e", icon: "photo_library" },
      vitals_updated: { bg: colors.creamMid, color: colors.amber, icon: "info" },
      discipline_added: { bg: colors.creamMid, color: colors.forestGreen, icon: "category" },
    };
    return styles[editType];
  };

  const getEditTypeLabel = (editType: EditType) => {
    const labels: Record<EditType, string> = {
      bio_modified: "reviewQueue.editTypes.bioModified",
      work_added: "reviewQueue.editTypes.workAdded",
      work_modified: "reviewQueue.editTypes.workModified",
      media_added: "reviewQueue.editTypes.mediaAdded",
      media_modified: "reviewQueue.editTypes.mediaModified",
      vitals_updated: "reviewQueue.editTypes.vitalsUpdated",
      discipline_added: "reviewQueue.editTypes.disciplineAdded",
    };
    return t(labels[editType]) || editType;
  };

  const thStyle: React.CSSProperties = {
    fontFamily: fonts.label,
    fontSize: 11,
    letterSpacing: "0.06em",
    fontWeight: 600,
    color: colors.forestGreen,
    textAlign: isRTL ? "right" : "left",
    padding: "12px 14px",
    borderBottom: `1px solid ${colors.forestGreen}`,
    textTransform: "uppercase",
    opacity: 0.8,
  };

  const tdStyle: React.CSSProperties = {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.forestGreen,
    padding: "14px",
    borderBottom: `1px solid ${colors.creamDark}`,
    textAlign: isRTL ? "right" : "left",
  };

  const statItems = [
    { icon: "pending_actions", label: t("reviewQueue.stats.totalPending") || "Total Pending", value: stats.total.toString(), delta: "Awaiting action", filled: true },
    { icon: "priority_high", label: t("reviewQueue.stats.overdue") || "Overdue", value: stats.overdue.toString(), delta: "Requires attention", filled: false, isOverdue: true },
    { icon: "schedule", label: t("reviewQueue.stats.avgTime") || "Avg Time", value: stats.avgTime, delta: "Target: < 24h", filled: false },
    { icon: "calendar_today", label: t("reviewQueue.stats.thisWeek") || "This Week", value: stats.thisWeek.toString(), delta: "Last 7 days", filled: false },
  ];

  return (
    <div dir={isRTL ? "rtl" : "ltr"} style={{ fontFamily: fonts.body, color: colors.forestGreen, backgroundColor: colors.creamLight, minHeight: "100vh", padding: 24 }}>
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>
        
        {/* ── Page Header ── */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18, flexWrap: "wrap", gap: 12 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <span style={{ fontFamily: fonts.label, fontSize: 11, letterSpacing: "0.08em", color: colors.forestGreen, opacity: 0.7 }}>
                  ADMIN / PENDING EDITS
                </span>
              </div>
              <h1 style={{ fontFamily: fonts.headline, fontSize: 28, fontWeight: 700, color: colors.forestGreen, margin: 0, lineHeight: 1.1 }}>
                {t("reviewQueue.title") || "Pending Edits Queue"}
              </h1>
              <p style={{ fontFamily: fonts.body, fontSize: 13, color: colors.forestGreen, opacity: 0.75, margin: "6px 0 0" }}>
                {t("reviewQueue.subtitle") || "Review and approve scholar edit submissions."}
              </p>
            </div>
          </div>

          {/* ── Filter Bar ── */}
          <div style={{ ...cardStyle, padding: 12, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 240, flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 10px", backgroundColor: colors.creamMid, border: `1px solid ${colors.forestGreen}`, borderRadius: 8, cursor: "pointer" }}>
                <select value={filterLanguage} onChange={(e) => setFilterLanguage(e.target.value as any)} style={{ border: "none", outline: "none", background: "transparent", fontFamily: fonts.body, fontSize: 13, color: colors.forestGreen, cursor: "pointer", minWidth: 120 }}>
                  <option value="all">{t("reviewQueue.filters.allLanguages") || "All Languages"}</option>
                  <option value="EN">English</option>
                  <option value="AR">Arabic</option>
                  <option value="FR">French</option>
                </select>
                <Icon name="expand_more" size={16} />
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 10px", backgroundColor: colors.creamMid, border: `1px solid ${colors.forestGreen}`, borderRadius: 8, cursor: "pointer" }}>
                <select value={filterDiscipline} onChange={(e) => setFilterDiscipline(e.target.value)} style={{ border: "none", outline: "none", background: "transparent", fontFamily: fonts.body, fontSize: 13, color: colors.forestGreen, cursor: "pointer", minWidth: 140 }}>
                  <option value="all">{t("reviewQueue.filters.allDisciplines") || "All Disciplines"}</option>
                  {disciplines.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
                <Icon name="expand_more" size={16} />
              </div>

              {hasActiveFilters && (
                <button onClick={clearFilters} style={{ display: "flex", alignItems: "center", gap: 4, padding: "6px 10px", backgroundColor: "transparent", border: `1px solid ${colors.red}`, borderRadius: 8, fontFamily: fonts.body, fontSize: 12, fontWeight: 500, color: colors.red, cursor: "pointer" }}>
                  <Icon name="close" size={14} /> Clear
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── Stat Cards ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14, marginBottom: 18 }}>
          {statItems.map((s) => (
            <div key={s.label} style={{ ...cardStyle, padding: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <div style={{ width: 28, height: 28, borderRadius: 6, backgroundColor: colors.creamMid, color: colors.forestGreen, border: `1px solid ${colors.forestGreen}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon name={s.icon} size={16} />
                </div>
              </div>
              <p style={{ fontFamily: fonts.label, fontSize: 11, letterSpacing: "0.05em", color: colors.forestGreen, margin: "0 0 4px", opacity: 0.7 }}>{s.label}</p>
              <p style={{ fontFamily: fonts.headline, fontSize: 24, fontWeight: 700, color: s.isOverdue ? colors.red : colors.forestGreen, margin: "0 0 4px", lineHeight: 1 }}>{s.value}</p>
              <p style={{ fontFamily: fonts.body, fontSize: 11, color: colors.forestGreen, margin: 0, opacity: 0.7 }}>{s.delta}</p>
            </div>
          ))}
        </div>

        {/* ── Table View ── */}
        <section style={{ ...cardStyle, overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead style={{ backgroundColor: colors.creamMid }}>
                <tr>
                  <th style={thStyle}>Scholar</th>
                  <th style={thStyle}>Editor</th>
                  <th style={thStyle}>Edit Type</th>
                  <th style={thStyle}>Submitted</th>
                  <th style={{ ...thStyle, textAlign: isRTL ? "left" : "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: 40, textAlign: "center", color: colors.forestGreen, opacity: 0.7 }}>
                      <Icon name="inbox" size={48} />
                      <p style={{ fontFamily: fonts.body, fontSize: 14, marginTop: 12 }}>{t("reviewQueue.table.empty") || "No edits found matching your filters."}</p>
                    </td>
                  </tr>
                ) : (
                  filtered.map((s) => {
                    const editorInitials = s.editor.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
                    const editTypeStyle = getEditTypeStyle(s.editType);

                    return (
                      <tr key={s.id} style={{ cursor: "pointer", transition: "background-color 0.15s" }} onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = colors.creamMid)} onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}>
                        <td style={tdStyle}>
                          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            <div style={{ width: 36, height: 36, borderRadius: "50%", backgroundColor: colors.creamMid, border: `1px solid ${colors.forestGreen}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: fonts.headline, fontWeight: 700, fontSize: 14, color: colors.forestGreen, flexShrink: 0 }}>
                              {s.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p style={{ margin: 0, fontWeight: 600, fontFamily: fonts.headline, fontSize: 13, color: colors.forestGreen }}>{s.name}</p>
                              <div style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 8px", borderRadius: 9999, backgroundColor: colors.creamLight, border: `1px solid ${colors.creamDark}`, marginTop: 4 }}>
                                <Icon name="person" size={12} />
                                <span style={{ fontFamily: fonts.label, fontSize: 10, color: colors.forestGreen, opacity: 0.8 }}>{s.originalContributor}</span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td style={tdStyle}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <Avatar name={s.editor} size={28} />
                            <span style={{ fontFamily: fonts.body, fontSize: 13, color: colors.forestGreen }}>{s.editor}</span>
                          </div>
                        </td>
                        <td style={tdStyle}>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 10px", borderRadius: 9999, backgroundColor: editTypeStyle.bg, color: editTypeStyle.color, fontFamily: fonts.label, fontSize: 11, fontWeight: 600, border: `1px solid ${colors.creamDark}` }}>
                            <Icon name={editTypeStyle.icon} size={14} />
                            {getEditTypeLabel(s.editType)}
                          </span>
                        </td>
                        <td style={{ ...tdStyle, fontFamily: fonts.label, fontSize: 12, color: colors.forestGreen }}>{s.date}</td>
                        <td style={{ ...tdStyle, textAlign: isRTL ? "left" : "right" }}>
                          <div style={{ display: "flex", justifyContent: isRTL ? "flex-start" : "flex-end", gap: 6 }}>
                            <button onClick={(e) => { e.stopPropagation(); goToReview(s); }} title="Review" style={{ width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "transparent", border: `1px solid ${colors.forestGreen}`, borderRadius: 6, color: colors.forestGreen, cursor: "pointer" }}>
                              <Icon name="visibility" size={18} />
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); handleApprove(s.id); }} title="Approve" style={{ width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: colors.forestGreen, border: `1px solid ${colors.forestGreen}`, borderRadius: 6, color: colors.creamLight, cursor: "pointer" }}>
                              <Icon name="check" size={18} filled />
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); handleReject(s.id); }} title="Reject" style={{ width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "transparent", border: `1px solid ${colors.red}`, borderRadius: 6, color: colors.red, cursor: "pointer" }}>
                              <Icon name="close" size={18} />
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); setStripTarget(s); }} title="Strip" style={{ width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "transparent", border: `1px solid ${colors.forestGreen}`, borderRadius: 6, color: colors.forestGreen, cursor: "pointer" }}>
                              <Icon name="person_remove" size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* ── Pagination ── */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 14px", borderTop: `1px solid ${colors.forestGreen}`, backgroundColor: colors.creamMid }}>
            <span style={{ fontFamily: fonts.label, fontSize: 11, color: colors.forestGreen, opacity: 0.8 }}>
              {t("reviewQueue.pagination.showing") ? t("reviewQueue.pagination.showing").replace("{start}", "1").replace("{end}", String(Math.min(10, filtered.length))).replace("{total}", String(filtered.length)) : `Showing 1-${Math.min(10, filtered.length)} of ${filtered.length}`}
            </span>
            <div style={{ display: "flex", gap: 4 }}>
              <button style={{ padding: "4px 10px", border: `1px solid ${colors.forestGreen}`, borderRadius: 6, backgroundColor: colors.creamLight, color: colors.forestGreen, fontFamily: fonts.body, fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center" }}>
                <Icon name="chevron_left" size={16} />
              </button>
              <button style={{ padding: "4px 10px", border: `1px solid ${colors.forestGreen}`, borderRadius: 6, backgroundColor: colors.forestGreen, color: colors.creamLight, fontFamily: fonts.body, fontSize: 12, cursor: "pointer" }}>1</button>
              {filtered.length > 10 && <button style={{ padding: "4px 10px", border: `1px solid ${colors.forestGreen}`, borderRadius: 6, backgroundColor: colors.creamLight, color: colors.forestGreen, fontFamily: fonts.body, fontSize: 12, cursor: "pointer" }}>2</button>}
              <button style={{ padding: "4px 10px", border: `1px solid ${colors.forestGreen}`, borderRadius: 6, backgroundColor: colors.creamLight, color: colors.forestGreen, fontFamily: fonts.body, fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center" }}>
                <Icon name="chevron_right" size={16} />
              </button>
            </div>
          </div>
        </section>

        {/* ── Strip Modal ── */}
        {stripTarget && (
          <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(11, 67, 53, 0.5)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }} onClick={() => setStripTarget(null)}>
            <div style={{ ...cardStyle, backgroundColor: colors.creamLight, width: 440, maxWidth: "90vw", padding: 32, boxShadow: "0 20px 60px rgba(0,0,0,0.18)" }} onClick={(e) => e.stopPropagation()}>
              <div style={{ width: 56, height: 56, borderRadius: "50%", backgroundColor: colors.red, color: colors.creamLight, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20, border: `1px solid ${colors.red}` }}>
                <Icon name="person_remove" size={28} filled />
              </div>
              <h2 style={{ fontFamily: fonts.headline, fontSize: 20, fontWeight: 700, color: colors.forestGreen, marginBottom: 12 }}>{t("reviewQueue.modal.title") || "Strip Editor"}</h2>
              <p style={{ fontFamily: fonts.body, fontSize: 14, color: colors.forestGreen, lineHeight: 1.6, marginBottom: 28, opacity: 0.8 }}>
                {t("reviewQueue.modal.body")?.replace("{name}", stripTarget.editor) || `Are you sure you want to strip ${stripTarget.editor} of this edit?`}
                <br />
                <b style={{ color: colors.red }}>{t("reviewQueue.modal.warning") || "This action cannot be undone."}</b>
              </p>
              <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
                <button onClick={() => setStripTarget(null)} style={{ padding: "10px 24px", borderRadius: 8, cursor: "pointer", border: `1px solid ${colors.forestGreen}`, backgroundColor: colors.creamLight, fontFamily: fonts.body, fontSize: 13, fontWeight: 600, color: colors.forestGreen }}>
                  {t("reviewQueue.modal.cancel") || "Cancel"}
                </button>
                <button onClick={confirmStrip} style={{ padding: "10px 24px", borderRadius: 8, cursor: "pointer", border: `1px solid ${colors.red}`, backgroundColor: colors.red, fontFamily: fonts.body, fontSize: 13, fontWeight: 700, color: colors.creamLight }}>
                  {t("reviewQueue.modal.confirm") || "Confirm"}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}