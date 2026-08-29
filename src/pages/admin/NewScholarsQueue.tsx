import React, { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useLang } from "../../context/LanguageContext";
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
type LangCode = "EN" | "AR" | "FR";
type SortOption = "newest" | "oldest" | "name";

interface ScholarSubmission {
  id: string;
  name: string;
  language: LangCode;
  submittedBy: string;
  contributorId: string;
  date: string;
  discipline: string;
  submittedAt: Date;
}

interface BackendScholarVersion {
  version_id: number;
  canonical_name: string;
  created_at: string;
  created_by: number | null;
  users?: { id: number; username: string; email: string } | null;
  languages?: { code: string; name: string } | null;
  scholar_disciplines?: Array<{
    disciplines?: { name: string };
  }>;
}

/* ------------------------------------------------------------------ */
/*  Helper: Transform Backend Data                                     */
/* ------------------------------------------------------------------ */
const transformVersions = (versions: BackendScholarVersion[]): ScholarSubmission[] => {
  return versions.map((v) => {
    const langCode = (v.languages?.code?.toUpperCase() || "EN") as LangCode;

    let disciplineNames: string[] = [];
    if (v.scholar_disciplines) {
      disciplineNames = v.scholar_disciplines
        .map((sd) => sd.disciplines?.name)
        .filter(Boolean) as string[];
    }

    const discipline = disciplineNames.length > 0 
      ? disciplineNames.join(", ") 
      : "Pending Review";

    return {
      id: v.version_id.toString(),
      name: v.canonical_name,
      language: langCode,
      submittedBy: v.users?.username || "Unknown",
      contributorId: v.created_by ? `user_${v.created_by}` : "system",
      date: new Date(v.created_at).toLocaleDateString("en-US", {
        month: "short", day: "numeric", year: "numeric",
      }),
      discipline: discipline,
      submittedAt: new Date(v.created_at),
    };
  });
};

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */
export default function NewScholarsQueue() {
  const navigate = useNavigate();
  const { t, lang } = useLang();
  const isRTL = lang === "AR";

  const [filterLanguage, setFilterLanguage] = useState<LangCode | "all">("all");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [rows, setRows] = useState<ScholarSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0, overdue: 0, newToday: 0, thisWeek: 0, avgTime: "0h 0m",
  });
  
  // ✅ Modal States
  const [stripTarget, setStripTarget] = useState<ScholarSubmission | null>(null);
  const [approveTarget, setApproveTarget] = useState<ScholarSubmission | null>(null);
  const [rejectTarget, setRejectTarget] = useState<ScholarSubmission | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [submissionsRes, statsRes] = await Promise.all([
          adminApi.scholars.getPendingCreated(),
          adminApi.scholars.getDashboardStats(),
        ]);

        if (submissionsRes.data?.success && submissionsRes.data.data) {
          setRows(transformVersions(submissionsRes.data.data));
        }
        if (statsRes.data?.success && statsRes.data.data) {
          setStats({
            total: statsRes.data.data.total_pending,
            overdue: statsRes.data.data.overdue,
            newToday: statsRes.data.data.new_today,
            thisWeek: statsRes.data.data.this_week,
            avgTime: statsRes.data.data.avg_review_time || "0h 0m",
          });
        }
      } catch (error) {
        console.error("Failed to fetch pending scholars:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const filtered = useMemo(() => {
    let result = [...rows];
    if (filterLanguage !== "all") result = result.filter((s) => s.language === filterLanguage);
    
    result.sort((a, b) => {
      switch (sortBy) {
        case "newest": return b.submittedAt.getTime() - a.submittedAt.getTime();
        case "oldest": return a.submittedAt.getTime() - b.submittedAt.getTime();
        case "name":   return a.name.localeCompare(b.name);
        default:       return 0;
      }
    });
    return result;
  }, [rows, filterLanguage, sortBy]);

  const goToReview = (s: ScholarSubmission) => {
    navigate(`/admin/pending/scholars/${s.id}?lang=${s.language}`);
  };

  // ✅ Updated Handlers with Modals
  const handleApprove = async (id: string) => {
    try {
      await adminApi.scholars.approve(Number(id));
      setRows((prev) => prev.filter((r) => r.id !== id));
      setApproveTarget(null);
    } catch (error) {
      console.error("Failed to approve:", error);
      alert("Failed to approve scholar. Please try again.");
    }
  };

  const handleReject = async (id: string) => {
    if (!rejectReason.trim()) {
      alert("Please provide a rejection reason");
      return;
    }
    try {
      await adminApi.scholars.reject(Number(id), rejectReason);
      setRows((prev) => prev.filter((r) => r.id !== id));
      setRejectTarget(null);
      setRejectReason("");
    } catch (error) {
      console.error("Failed to reject:", error);
      alert("Failed to reject scholar. Please try again.");
    }
  };

  const confirmStrip = () => {
    if (!stripTarget) return;
    setRows((prev) => prev.map((row) =>
      row.id === stripTarget.id
        ? { ...row, submittedBy: "System (stripped)", contributorId: "system" }
        : row
    ));
    setStripTarget(null);
  };

  const clearFilters = () => {
    setFilterLanguage("all");
    setSortBy("newest");
  };

  const hasActiveFilters = filterLanguage !== "all";

  const getLangName = (code: LangCode) => {
    switch (code) {
      case "EN": return t("reviewQueue.lang.en") || "English";
      case "AR": return t("reviewQueue.lang.ar") || "Arabic";
      case "FR": return t("reviewQueue.lang.fr") || "French";
    }
  };

  const thStyle: React.CSSProperties = {
    fontFamily: fonts.label, fontSize: 11, letterSpacing: "0.06em", fontWeight: 600,
    color: colors.forestGreen, textAlign: isRTL ? "right" : "left",
    padding: "12px 14px", borderBottom: `1px solid ${colors.forestGreen}`,
    textTransform: "uppercase", opacity: 0.8,
  };

  const tdStyle: React.CSSProperties = {
    fontFamily: fonts.body, fontSize: 13, color: colors.forestGreen,
    padding: "14px", borderBottom: `1px solid ${colors.creamDark}`,
    textAlign: isRTL ? "right" : "left",
  };

  const statItems = [
    { icon: "pending_actions", label: "Total Pending", value: stats.total.toString(), delta: "Awaiting action", filled: true },
    { icon: "priority_high", label: "Overdue (>3 days)", value: stats.overdue.toString(), delta: "Requires attention", filled: false, isOverdue: true },
    { icon: "schedule", label: "Avg. Review Time", value: stats.avgTime, delta: "Target: < 24h", filled: false },
    { icon: "calendar_today", label: "This Week", value: stats.thisWeek.toString(), delta: "Last 7 days", filled: false },
  ];

  if (isLoading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: colors.creamLight, color: colors.forestGreen }}>
        <Icon name="hourglass_empty" size={32} />
      </div>
    );
  }

  return (
    <div dir={isRTL ? "rtl" : "ltr"} style={{ fontFamily: fonts.body, color: colors.forestGreen, backgroundColor: colors.creamLight, minHeight: "100vh", padding: 24 }}>
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>

        {/* ─ Page Header ── */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18, flexWrap: "wrap", gap: 12 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <span style={{ fontFamily: fonts.label, fontSize: 11, letterSpacing: "0.08em", color: colors.forestGreen, opacity: 0.7 }}>
                  ADMIN / NEW SCHOLARS QUEUE
                </span>
              </div>
              <h1 style={{ fontFamily: fonts.headline, fontSize: 28, fontWeight: 700, color: colors.forestGreen, margin: 0, lineHeight: 1.1 }}>
                {t("reviewQueue.title") || "New Scholars Queue"}
              </h1>
              <p style={{ fontFamily: fonts.body, fontSize: 13, color: colors.forestGreen, opacity: 0.75, margin: "6px 0 0" }}>
                {t("reviewQueue.subtitle") || "Review and approve new scholar submissions for the portal."}
              </p>
            </div>
          </div>

          {/* ── Filter Bar ── */}
          <div style={{ ...cardStyle, padding: 12, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 240, flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 10px", backgroundColor: colors.creamMid, border: `1px solid ${colors.forestGreen}`, borderRadius: 8, cursor: "pointer" }}>
                <select value={filterLanguage} onChange={(e) => setFilterLanguage(e.target.value as any)} style={{ border: "none", outline: "none", background: "transparent", fontFamily: fonts.body, fontSize: 13, color: colors.forestGreen, cursor: "pointer", minWidth: 120 }}>
                  <option value="all">All Languages</option>
                  <option value="EN">English</option>
                  <option value="AR">Arabic</option>
                  <option value="FR">French</option>
                </select>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 10px", backgroundColor: colors.creamMid, border: `1px solid ${colors.forestGreen}`, borderRadius: 8, cursor: "pointer" }}>
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)} style={{ border: "none", outline: "none", background: "transparent", fontFamily: fonts.body, fontSize: 13, color: colors.forestGreen, cursor: "pointer", minWidth: 120 }}>
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="name">Name A-Z</option>
                </select>
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
                <Icon name="more_horiz" size={16} />
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
                  <th style={thStyle}>Submitter</th>
                  <th style={thStyle}>Submitted</th>
                  <th style={{ ...thStyle, textAlign: isRTL ? "left" : "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ padding: 40, textAlign: "center", color: colors.forestGreen, opacity: 0.7 }}>
                      <Icon name="inbox" size={48} />
                      <p style={{ fontFamily: fonts.body, fontSize: 14, marginTop: 12 }}>No submissions found matching your filters.</p>
                    </td>
                  </tr>
                ) : (
                  filtered.map((s) => {
                    const langColor = s.language === "AR" ? colors.amber : s.language === "FR" ? "#4a7fcb" : colors.forestGreen;
                    return (
                      <tr key={s.id} style={{ cursor: "pointer", transition: "background-color 0.15s" }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = colors.creamMid)}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}>
                        <td style={tdStyle}>
                          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            <div style={{ width: 36, height: 36, borderRadius: "50%", backgroundColor: colors.creamMid, border: `1px solid ${colors.forestGreen}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: fonts.headline, fontWeight: 700, fontSize: 14, color: colors.forestGreen, flexShrink: 0 }}>
                              {s.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p style={{ margin: 0, fontWeight: 600, fontFamily: fonts.headline, fontSize: 13, color: colors.forestGreen }}>{s.name}</p>
                              <div style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 8px", borderRadius: 9999, backgroundColor: colors.creamLight, border: `1px solid ${colors.creamDark}`, marginTop: 4 }}>
                                <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: langColor }} />
                                <span style={{ fontFamily: fonts.label, fontSize: 10, color: colors.forestGreen, opacity: 0.8 }}>{getLangName(s.language)}</span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td style={tdStyle}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <Avatar name={s.submittedBy} size={28} />
                            <span style={{ fontFamily: fonts.body, fontSize: 13, color: colors.forestGreen }}>{s.submittedBy}</span>
                          </div>
                        </td>
                        <td style={{ ...tdStyle, fontFamily: fonts.label, fontSize: 12, color: colors.forestGreen }}>{s.date}</td>
                        <td style={{ ...tdStyle, textAlign: isRTL ? "left" : "right" }}>
                          <div style={{ display: "flex", justifyContent: isRTL ? "flex-start" : "flex-end", gap: 6 }}>
                            <button onClick={(e) => { e.stopPropagation(); goToReview(s); }} title="Review"
                              style={{ width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "transparent", border: `1px solid ${colors.forestGreen}`, borderRadius: 6, color: colors.forestGreen, cursor: "pointer" }}>
                              <Icon name="visibility" size={18} />
                            </button>
                            
                            {/* ✅ UPDATED: Opens Approve Modal */}
                            <button onClick={(e) => { e.stopPropagation(); setApproveTarget(s); }} title="Approve"
                              style={{ width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: colors.forestGreen, border: `1px solid ${colors.forestGreen}`, borderRadius: 6, color: colors.creamLight, cursor: "pointer" }}>
                              <Icon name="check" size={18} filled />
                            </button>
                            
                            {/* ✅ UPDATED: Opens Reject Modal */}
                            <button onClick={(e) => { e.stopPropagation(); setRejectTarget(s); }} title="Reject"
                              style={{ width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "transparent", border: `1px solid ${colors.red}`, borderRadius: 6, color: colors.red, cursor: "pointer" }}>
                              <Icon name="close" size={18} />
                            </button>
                            
                            <button onClick={(e) => { e.stopPropagation(); setStripTarget(s); }} title="Strip"
                              style={{ width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "transparent", border: `1px solid ${colors.forestGreen}`, borderRadius: 6, color: colors.forestGreen, cursor: "pointer" }}>
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

          {/* ── Pagination ─ */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 14px", borderTop: `1px solid ${colors.forestGreen}`, backgroundColor: colors.creamMid }}>
            <span style={{ fontFamily: fonts.label, fontSize: 11, color: colors.forestGreen, opacity: 0.8 }}>
              Showing 1-{Math.min(10, filtered.length)} of {filtered.length}
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
              <h2 style={{ fontFamily: fonts.headline, fontSize: 20, fontWeight: 700, color: colors.forestGreen, marginBottom: 12 }}>Strip Contributor</h2>
              <p style={{ fontFamily: fonts.body, fontSize: 14, color: colors.forestGreen, lineHeight: 1.6, marginBottom: 28, opacity: 0.8 }}>
                Are you sure you want to strip <b>{stripTarget.submittedBy}</b> of this contribution?
                <br /><b style={{ color: colors.red }}>This action cannot be undone.</b>
              </p>
              <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
                <button onClick={() => setStripTarget(null)} style={{ padding: "10px 24px", borderRadius: 8, cursor: "pointer", border: `1px solid ${colors.forestGreen}`, backgroundColor: colors.creamLight, fontFamily: fonts.body, fontSize: 13, fontWeight: 600, color: colors.forestGreen }}>Cancel</button>
                <button onClick={confirmStrip} style={{ padding: "10px 24px", borderRadius: 8, cursor: "pointer", border: `1px solid ${colors.red}`, backgroundColor: colors.red, fontFamily: fonts.body, fontSize: 13, fontWeight: 700, color: colors.creamLight }}>Confirm</button>
              </div>
            </div>
          </div>
        )}

        {/* ── Approve Confirmation Modal ── */}
        {approveTarget && (
          <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(11, 67, 53, 0.5)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }} onClick={() => setApproveTarget(null)}>
            <div style={{ ...cardStyle, backgroundColor: colors.creamLight, width: 500, maxWidth: "90vw", padding: 32, boxShadow: "0 20px 60px rgba(0,0,0,0.18)" }} onClick={(e) => e.stopPropagation()}>
              <div style={{ width: 56, height: 56, borderRadius: "50%", backgroundColor: colors.forestGreen, color: colors.creamLight, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20, border: `1px solid ${colors.forestGreen}` }}>
                <Icon name="check_circle" size={28} filled />
              </div>
              <h2 style={{ fontFamily: fonts.headline, fontSize: 20, fontWeight: 700, color: colors.forestGreen, marginBottom: 16 }}>Approve Scholar?</h2>
              
              <div style={{ backgroundColor: colors.creamMid, padding: 16, borderRadius: 8, marginBottom: 20 }}>
                <p style={{ margin: "0 0 8px", fontFamily: fonts.headline, fontSize: 16, fontWeight: 600, color: colors.forestGreen }}>{approveTarget.name}</p>
                <p style={{ margin: "0 0 4px", fontFamily: fonts.body, fontSize: 13, color: colors.forestGreen }}><strong>Language:</strong> {getLangName(approveTarget.language)}</p>
                <p style={{ margin: "0 0 4px", fontFamily: fonts.body, fontSize: 13, color: colors.forestGreen }}><strong>Submitted by:</strong> {approveTarget.submittedBy}</p>
                <p style={{ margin: "0 0 4px", fontFamily: fonts.body, fontSize: 13, color: colors.forestGreen }}><strong>Date:</strong> {approveTarget.date}</p>
                <p style={{ margin: 0, fontFamily: fonts.body, fontSize: 13, color: colors.forestGreen }}><strong>Discipline:</strong> {approveTarget.discipline}</p>
              </div>
              
              <p style={{ fontFamily: fonts.body, fontSize: 14, color: colors.forestGreen, marginBottom: 24, lineHeight: 1.6 }}>
                This will publish the scholar to the portal. This action cannot be undone.
              </p>
              
              <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
                <button onClick={() => setApproveTarget(null)} style={{ padding: "10px 24px", borderRadius: 8, cursor: "pointer", border: `1px solid ${colors.forestGreen}`, backgroundColor: colors.creamLight, fontFamily: fonts.body, fontSize: 13, fontWeight: 600, color: colors.forestGreen }}>
                  Cancel
                </button>
                <button onClick={() => handleApprove(approveTarget.id)} style={{ padding: "10px 24px", borderRadius: 8, cursor: "pointer", border: "none", backgroundColor: colors.forestGreen, color: colors.creamLight, fontFamily: fonts.body, fontSize: 13, fontWeight: 700 }}>
                  Confirm Approval
                </button>
              </div>
            </div>
          </div>
        )}

                {/* ── Reject Confirmation Modal ── */}
        {rejectTarget && (
          <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(11, 67, 53, 0.5)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }} onClick={() => { setRejectTarget(null); setRejectReason(""); }}>
            <div style={{ ...cardStyle, backgroundColor: colors.creamLight, width: 500, maxWidth: "90vw", padding: 32, boxShadow: "0 20px 60px rgba(0,0,0,0.18)" }} onClick={(e) => e.stopPropagation()}>
              <div style={{ width: 56, height: 56, borderRadius: "50%", backgroundColor: colors.red, color: colors.creamLight, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20, border: `1px solid ${colors.red}` }}>
                <Icon name="cancel" size={28} filled />
              </div>
              <h2 style={{ fontFamily: fonts.headline, fontSize: 20, fontWeight: 700, color: colors.forestGreen, marginBottom: 16 }}>Reject Scholar?</h2>
              
              <div style={{ backgroundColor: colors.creamMid, padding: 16, borderRadius: 8, marginBottom: 24 }}>
                <p style={{ margin: "0 0 8px", fontFamily: fonts.headline, fontSize: 16, fontWeight: 600, color: colors.forestGreen }}>{rejectTarget.name}</p>
                <p style={{ margin: "0 0 4px", fontFamily: fonts.body, fontSize: 13, color: colors.forestGreen }}><strong>Language:</strong> {getLangName(rejectTarget.language)}</p>
                <p style={{ margin: "0 0 4px", fontFamily: fonts.body, fontSize: 13, color: colors.forestGreen }}><strong>Submitted by:</strong> {rejectTarget.submittedBy}</p>
                <p style={{ margin: "0 0 4px", fontFamily: fonts.body, fontSize: 13, color: colors.forestGreen }}><strong>Date:</strong> {rejectTarget.date}</p>
                <p style={{ margin: 0, fontFamily: fonts.body, fontSize: 13, color: colors.forestGreen }}><strong>Discipline:</strong> {rejectTarget.discipline}</p>
              </div>
              
              <p style={{ fontFamily: fonts.body, fontSize: 14, color: colors.forestGreen, marginBottom: 24, lineHeight: 1.6 }}>
                Are you sure you want to reject this scholar? This action cannot be undone.
              </p>
              
              <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
                <button onClick={() => { setRejectTarget(null); setRejectReason(""); }} style={{ padding: "10px 24px", borderRadius: 8, cursor: "pointer", border: `1px solid ${colors.forestGreen}`, backgroundColor: colors.creamLight, fontFamily: fonts.body, fontSize: 13, fontWeight: 600, color: colors.forestGreen }}>
                  Cancel
                </button>
                <button onClick={() => handleReject(rejectTarget.id)} style={{ padding: "10px 24px", borderRadius: 8, cursor: "pointer", border: "none", backgroundColor: colors.red, color: colors.creamLight, fontFamily: fonts.body, fontSize: 13, fontWeight: 700 }}>
                  Confirm Rejection
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}