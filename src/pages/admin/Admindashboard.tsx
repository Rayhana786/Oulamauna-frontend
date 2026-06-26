import { useLang } from "../../context/LanguageContext";
import { Link } from "react-router-dom";
import bgImage from "../../assets/bg.png";
/* ─── Color tokens (match existing sidebar/navbar) ─── */
const C = {
  bg:        "#FAF9F6",
  border:    "#D9DAD8",
  primary:   "#0b4335",
  forest:    "#285B4B",
  gold:      "#C9A84C",
  goldLight: "rgba(201,168,76,0.12)",
  text:      "#191c1b",
  muted:     "#404945",
  subtle:    "#6b7775",
  surface:   "#F2F1ED",
  red:       "#ba1a1a",
  redLight:  "rgba(186,26,26,0.08)",
  blue:      "#1565C0",
  blueLight: "rgba(21,101,192,0.08)",
};

/* ─── Types ─── */
interface StatCardProps {
  icon: string;
  value: string | number;
  label: string;
  sub?: string;
  accent?: boolean;
  delta?: string;
  deltaPositive?: boolean;
}

interface ActivityItem {
  iconType: "edit" | "translate" | "person_add" | "flag";
  titleKey: string;
  subKey: string;
  timeKey: string;
  badgeKey: string;
  badgeColor: string;
  badgeTextColor: string;
}

/* ─── Static data ─── */
const ACTIVITY_ITEMS: ActivityItem[] = [
  {
    iconType:       "edit",
    titleKey:       "dashboard.activity.duplicateBio",
    subKey:         "dashboard.activity.duplicateBioSub",
    timeKey:        "dashboard.activity.time2m",
    badgeKey:       "dashboard.badge.urgent",
    badgeColor:     C.redLight,
    badgeTextColor: C.red,
  },
  {
    iconType:       "translate",
    titleKey:       "dashboard.activity.newTranslation",
    subKey:         "dashboard.activity.newTranslationSub",
    timeKey:        "dashboard.activity.time8h",
    badgeKey:       "dashboard.badge.pending",
    badgeColor:     C.goldLight,
    badgeTextColor: "#9a7d30",
  },
  {
    iconType:       "person_add",
    titleKey:       "dashboard.activity.newContributor",
    subKey:         "dashboard.activity.newContributorSub",
    timeKey:        "dashboard.activity.timeYesterday",
    badgeKey:       "dashboard.badge.requestAccess",
    badgeColor:     C.blueLight,
    badgeTextColor: C.blue,
  },
  {
    iconType:       "flag",
    titleKey:       "dashboard.activity.contentReported",
    subKey:         "dashboard.activity.contentReportedSub",
    timeKey:        "dashboard.activity.time3h",
    badgeKey:       "dashboard.badge.review",
    badgeColor:     "rgba(201,168,76,0.12)",
    badgeTextColor: "#9a7d30",
  },
];

const QUICK_LINKS = [
  { icon: "history_edu",    labelKey: "dashboard.quick.addScholar",      to: "/admin/scholars/new"        },
  { icon: "contract_edit",  labelKey: "dashboard.quick.reviewPending",   to: "/admin/pending/scholars"    },
  { icon: "forum",          labelKey: "dashboard.quick.moderateForum",   to: "/admin/blog/reported"       },
  { icon: "group",          labelKey: "dashboard.quick.manageUsers",     to: "/admin/users/contributors"  },
  { icon: "flag",           labelKey: "dashboard.quick.viewReports",     to: "/admin/reports"             },
  { icon: "settings",       labelKey: "dashboard.quick.systemSettings",  to: "/admin/settings/backups"    },
];

/* ─── Sub-components ─── */
function StatCard({ icon, value, label, sub, accent, delta, deltaPositive }: StatCardProps) {
  return (
    <div style={{
      background:   accent ? C.primary : "#fff",
      border:       `1px solid ${accent ? C.primary : C.border}`,
      borderRadius: 8,
      padding:      "20px 22px",
      display:      "flex",
      flexDirection:"column",
      gap:          10,
      position:     "relative",
      overflow:     "hidden",
      transition:   "box-shadow 0.2s",
    }}>
      {accent && (
        <div style={{
          position:   "absolute",
          inset:      0,
          background: "linear-gradient(135deg, #0b4335 60%, #285B4B 100%)",
          opacity:    1,
        }} />
      )}
      <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span
          className="ms"
          style={{ fontSize: 22, color: accent ? "rgba(201,168,76,0.85)" : C.forest, opacity: accent ? 1 : 0.55 }}
        >
          {icon}
        </span>
        {delta && (
          <span style={{
            fontSize:   11,
            fontWeight: 600,
            color:      accent
              ? (deltaPositive ? "#6ee8b4" : "#f7a6a6")
              : (deltaPositive ? "#1a6644" : C.red),
            background: accent
              ? "rgba(255,255,255,0.10)"
              : (deltaPositive ? "rgba(26,102,68,0.08)" : C.redLight),
            borderRadius: 99,
            padding:      "2px 8px",
            fontFamily:   "'Inter', sans-serif",
          }}>
            {deltaPositive ? "↑" : "↓"} {delta}
          </span>
        )}
      </div>
      <div style={{ position: "relative" }}>
        <div style={{
          fontSize:      30,
          fontWeight:    700,
          letterSpacing: "-0.02em",
          color:         accent ? "#fff" : C.text,
          fontFamily:    "'Inter', sans-serif",
          lineHeight:    1.1,
        }}>
          {value}
        </div>
        <div style={{
          fontSize:   13,
          fontWeight: 500,
          marginTop:  4,
          color:      accent ? "rgba(255,255,255,0.75)" : C.muted,
          fontFamily: "'Inter', sans-serif",
        }}>
          {label}
        </div>
        {sub && (
          <div style={{
            fontSize:   11,
            marginTop:  3,
            color:      accent ? "rgba(201,168,76,0.8)" : C.subtle,
            fontFamily: "'Inter', sans-serif",
          }}>
            {sub}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Inline sparkline chart (pure SVG, no deps) ─── */
function SparklineChart() {
  const DATA = [14, 22, 18, 30, 26, 19, 35, 42, 31, 28, 38, 44];
  const W = 480, H = 120;
  const max = Math.max(...DATA);
  const pts = DATA.map((v, i) => ({
    x: 32 + (i / (DATA.length - 1)) * (W - 48),
    y: H - 16 - ((v / max) * (H - 32)),
  }));
  const path = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  const area = `${path} L${pts[pts.length - 1].x},${H - 16} L${pts[0].x},${H - 16} Z`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: 120 }}>
      <defs>
        <linearGradient id="sgrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={C.forest} stopOpacity="0.15" />
          <stop offset="100%" stopColor={C.forest} stopOpacity="0"    />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#sgrad)" />
      <path d={path} fill="none" stroke={C.forest} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((p, i) => (
        <circle
          key={i}
          cx={p.x} cy={p.y}
          r={i === DATA.length - 1 ? 4 : 2.5}
          fill={i === DATA.length - 1 ? C.gold : C.forest}
          stroke="#fff" strokeWidth="1.5"
        />
      ))}
    </svg>
  );
}

/* ─── Scholar category breakdown (mini horizontal bars) ─── */
function CategoryBreakdown({ t }: { t: (k: string) => string }) {
  const CATS = [
    { key: "dashboard.cat.fiqh",       value: 312, pct: 82 },
    { key: "dashboard.cat.hadith",      value: 245, pct: 64 },
    { key: "dashboard.cat.tafsir",      value: 198, pct: 52 },
    { key: "dashboard.cat.usul",        value: 164, pct: 43 },
    { key: "dashboard.cat.tasawwuf",    value: 89,  pct: 23 },
    { key: "dashboard.cat.nahw",        value: 73,  pct: 19 },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {CATS.map((cat) => (
        <div key={cat.key}>
          <div style={{
            display:        "flex",
            justifyContent: "space-between",
            marginBottom:   4,
            fontFamily:     "'Inter', sans-serif",
            fontSize:       12,
            color:          C.muted,
          }}>
            <span>{t(cat.key)}</span>
            <span style={{ fontWeight: 600, color: C.text }}>{cat.value}</span>
          </div>
          <div style={{
            height:       5,
            background:   C.surface,
            borderRadius: 99,
            overflow:     "hidden",
          }}>
            <div style={{
              height:       "100%",
              width:        `${cat.pct}%`,
              background:   `linear-gradient(90deg, ${C.primary}, ${C.forest})`,
              borderRadius: 99,
              transition:   "width 0.8s cubic-bezier(0.4,0,0.2,1)",
            }} />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── Century map (dot grid of scholars by century) ─── */
function CenturyGrid({ t }: { t: (k: string) => string }) {
  const CENTURIES = [
    { label: "I",   count: 42  },
    { label: "II",  count: 87  },
    { label: "III", count: 134 },
    { label: "IV",  count: 98  },
    { label: "V",   count: 156 },
    { label: "VI",  count: 112 },
    { label: "VII", count: 89  },
    { label: "VIII",count: 203 },
    { label: "IX",  count: 178 },
    { label: "X",   count: 91  },
  ];
  const max = Math.max(...CENTURIES.map(c => c.count));

  return (
    <div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 64 }}>
        {CENTURIES.map((c) => (
          <div key={c.label} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <div
              title={`${c.count} ${t("dashboard.century.scholars")}`}
              style={{
                width:        "100%",
                height:       `${Math.max(8, (c.count / max) * 52)}px`,
                background:   `linear-gradient(180deg, ${C.forest} 0%, ${C.primary} 100%)`,
                borderRadius: "3px 3px 0 0",
                opacity:      0.75 + (c.count / max) * 0.25,
                transition:   "opacity 0.2s",
                cursor:       "default",
              }}
            />
            <span style={{
              fontSize:   8,
              color:      C.subtle,
              fontFamily: "'JetBrains Mono', monospace",
              fontWeight: 600,
            }}>
              {c.label}
            </span>
          </div>
        ))}
      </div>
      <div style={{
        marginTop:  8,
        fontSize:   10,
        color:      C.subtle,
        fontFamily: "'Inter', sans-serif",
        fontStyle:  "italic",
      }}>
        {t("dashboard.century.label")}
      </div>
    </div>
  );
}

/* ─── Main Dashboard ─── */
export default function AdminDashboard() {
  const { t, lang } = useLang();
  const isRTL = lang === "AR";

  return (
    <>
      <link
        href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@500;600&family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20,300,0,0&display=swap"
        rel="stylesheet"
      />
      <style>{`
        /* ── Global reset to ensure 0 margin on the background ── */
        html, body, #root {
          margin: 0;
          padding: 0;
        }

        .ms {
          font-family: 'Material Symbols Outlined';
          font-style: normal; font-size: 20px;
          display: inline-flex; align-items: center;
          user-select: none; line-height: 1;
        }
        .dash-card {
          background: #ffffff;
          border: 1px solid ${C.border};
          border-radius: 8px;
          /* white cards on #FAF9F6 parchment — intentional subtle lift */
        }
        .quick-link {
          display: flex; align-items: center; gap: 10px;
          padding: 12px 14px; border-radius: 6px;
          color: ${C.forest}; font-size: 13px; font-weight: 500;
          font-family: 'Inter', sans-serif; text-decoration: none;
          transition: background 0.15s, color 0.15s, border-color 0.15s;
          border: 1px solid ${C.border};
        }
        .quick-link:hover {
          background: rgba(40,91,75,0.06);
          color: ${C.primary};
          border-color: rgba(40,91,75,0.25);
        }
        .quick-link:hover .ql-icon { opacity: 1; }
        .ql-icon { opacity: 0.5; transition: opacity 0.15s; color: ${C.forest}; }

        .activity-row {
          display: flex; align-items: flex-start; gap: 14px;
          padding: 14px 0; border-bottom: 1px solid ${C.border};
          font-family: 'Inter', sans-serif;
        }
        .activity-row:last-child { border-bottom: none; }
        .activity-icon {
          width: 36px; height: 36px; border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0; font-size: 17px;
        }
        .section-label {
          font-family: 'JetBrains Mono', monospace;
          font-size: 9px; font-weight: 700;
          letter-spacing: 0.2em; text-transform: uppercase;
          color: rgba(40,91,75,0.42);
        }

        /* ── Responsive grids ── */
        .stat-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
        }
        @media (max-width: 900px) {
          .stat-grid { grid-template-columns: repeat(2, 1fr); }
        }

        .charts-row {
          display: grid;
          grid-template-columns: 1.5fr 1fr;
          gap: 20px;
          margin-top: 20px;
        }
        @media (max-width: 860px) {
          .charts-row { grid-template-columns: 1fr; }
        }

        .mid-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-top: 20px;
        }
        @media (max-width: 860px) {
          .mid-row { grid-template-columns: 1fr; }
        }

        .bottom-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-top: 20px;
        }
        @media (max-width: 860px) {
          .bottom-row { grid-template-columns: 1fr; }
        }

        .quick-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
        }
        @media (max-width: 700px) {
          .quick-grid { grid-template-columns: repeat(2, 1fr); }
        }

        .review-item {
          display: flex; align-items: center; justify-content: space-between;
          padding: 11px 16px; border-bottom: 1px solid ${C.border};
          font-family: 'Inter', sans-serif; font-size: 13px;
          cursor: default; transition: background 0.12s;
          text-decoration: none; color: inherit;
        }
        .review-item:last-child { border-bottom: none; }
        .review-item:hover { background: rgba(11,67,53,0.03); }

        .badge-pill {
          font-size: 10px; font-weight: 700; border-radius: 99px;
          padding: 3px 10px; font-family: 'Inter', sans-serif; line-height: 1.5;
        }

        /* ── Transition for language switch ── */
        .dash-wrapper {
          transition: opacity 0.25s ease;
        }

        /* ── Full-bleed page background ── */
        .dash-page {
          background-image: url('assets/bg.png');
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
          background-color: #F2F1ED; /* Fallback color */
          margin: 0;
          min-height: 100vh;
          padding: 32px 40px 48px;
          box-sizing: border-box;
        }
      `}</style>

      {/* Outer full-bleed wrapper so bg fills the entire <main> content area */}
      <div className="dash-page">
      <div
        className="dash-wrapper"
        dir={isRTL ? "rtl" : "ltr"}
        style={{ maxWidth: 1100, margin: "0 auto" }}
      >

        {/* ══════════════════════════════════════════
            PAGE HEADER
        ══════════════════════════════════════════ */}
        <div style={{ marginBottom: 28 }}>
          <div className="section-label" style={{ marginBottom: 6 }}>
            {t("dashboard.header.eyebrow")}
          </div>
          <h1 style={{
            fontFamily:    "'Inter', sans-serif",
            fontSize:      22,
            fontWeight:    700,
            color:         C.text,
            margin:        0,
            letterSpacing: "-0.01em",
          }}>
            {t("dashboard.header.title")}
          </h1>
          <p style={{
            fontFamily: "'Inter', sans-serif",
            fontSize:   13,
            color:      C.subtle,
            margin:     "6px 0 0",
          }}>
            {t("dashboard.header.subtitle")}
          </p>
        </div>

        {/* ══════════════════════════════════════════
            STAT CARDS
        ══════════════════════════════════════════ */}
        <div className="stat-grid">
          <StatCard
            icon="history_edu"
            value="1,286"
            label={t("dashboard.stat.scholars")}
            sub={t("dashboard.stat.scholarsSub")}
            delta="12"
            deltaPositive
          />
          <StatCard
            icon="menu_book"
            value="8,421"
            label={t("dashboard.stat.works")}
            sub={t("dashboard.stat.worksSub")}
            delta="98%"
            deltaPositive
          />
          {/* REMOVED 'accent' prop below to match the white design */}
          <StatCard
            icon="contract_edit"
            value="48"
            label={t("dashboard.stat.pending")}
            sub={t("dashboard.stat.pendingSub")}
            delta="12"
            deltaPositive
          />
          <StatCard
            icon="group"
            value="156"
            label={t("dashboard.stat.contributors")}
            sub={t("dashboard.stat.contributorsSub")}
            delta="8"
            deltaPositive
          />
        </div>

        {/* ══════════════════════════════════════════
            CHARTS ROW  (activity sparkline + review queue)
        ══════════════════════════════════════════ */}
        <div className="charts-row">

          {/* Activity sparkline */}
          <div className="dash-card" style={{ padding: "20px 22px" }}>
            <div style={{
              display:        "flex",
              alignItems:     "center",
              justifyContent: "space-between",
              marginBottom:   16,
            }}>
              <div>
                <div className="section-label">{t("dashboard.chart.eyebrow")}</div>
                <div style={{
                  fontSize:   14,
                  fontWeight: 600,
                  color:      C.text,
                  marginTop:  3,
                  fontFamily: "'Inter', sans-serif",
                }}>
                  {t("dashboard.chart.title")}
                </div>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <button style={{
                  border:       `1px solid ${C.gold}`,
                  background:   C.goldLight,
                  color:        "#9a7d30",
                  fontFamily:   "'JetBrains Mono', monospace",
                  fontSize:     9,
                  fontWeight:   700,
                  letterSpacing:"0.15em",
                  textTransform:"uppercase",
                  borderRadius: 4,
                  padding:      "4px 12px",
                  cursor:       "pointer",
                }}>
                  {t("dashboard.chart.hijri")}
                </button>
                <button style={{
                  border:       `1px solid ${C.border}`,
                  background:   "transparent",
                  color:        C.subtle,
                  fontFamily:   "'JetBrains Mono', monospace",
                  fontSize:     9,
                  fontWeight:   700,
                  letterSpacing:"0.15em",
                  textTransform:"uppercase",
                  borderRadius: 4,
                  padding:      "4px 12px",
                  cursor:       "pointer",
                }}>
                  {t("dashboard.chart.gregorian")}
                </button>
              </div>
            </div>

            <SparklineChart />

            <div style={{
              display:        "flex",
              justifyContent: "space-between",
              marginTop:      4,
              paddingTop:     8,
              borderTop:      `1px solid ${C.border}`,
            }}>
              {[
                t("dashboard.month.muharram"),
                t("dashboard.month.safar"),
                t("dashboard.month.rabiI"),
                t("dashboard.month.rabiII"),
                t("dashboard.month.jumadaI"),
                t("dashboard.month.jumadaII"),
                t("dashboard.month.rajab"),
              ].map((m) => (
                <span key={m} style={{
                  fontSize:   9,
                  color:      C.subtle,
                  fontFamily: "'JetBrains Mono', monospace",
                  letterSpacing: "0.05em",
                }}>
                  {m}
                </span>
              ))}
            </div>
          </div>

          {/* Review queue */}
          <div className="dash-card" style={{ overflow: "hidden" }}>
            <div style={{
              padding:       "16px 18px",
              borderBottom:  `1px solid ${C.border}`,
              display:       "flex",
              alignItems:    "center",
              justifyContent:"space-between",
            }}>
              <div className="section-label">{t("dashboard.review.eyebrow")}</div>
              <span style={{
                fontSize:   10,
                fontWeight: 700,
                background: C.gold,
                color:      "#fff",
                borderRadius:99,
                padding:    "2px 8px",
                fontFamily: "'Inter', sans-serif",
              }}>48</span>
            </div>
            {[
              { labelKey: "sidebar.pendingProfiles",   count: 12, to: "/admin/pending/scholars",  color: C.red    },
              { labelKey: "sidebar.workEdits",         count: 20, to: "/admin/pending/edits",     color: C.gold   },
              { labelKey: "sidebar.mediaVerification", count: 7,  to: "/admin/pending/media",     color: C.forest },
              { labelKey: "dashboard.review.reports",  count: 5,  to: "/admin/reports",           color: C.red    },
              { labelKey: "dashboard.review.blogFlag", count: 3,  to: "/admin/blog/reported",     color: "#9a7d30"},
              { labelKey: "dashboard.review.notifs",   count: 7,  to: "/admin/notifications",     color: C.forest },
            ].map((row) => (
              <Link key={row.to} to={row.to} className="review-item">
                <span style={{ color: C.muted, fontFamily: "'Inter', sans-serif", fontSize: 13 }}>
                  {t(row.labelKey)}
                </span>
                <span style={{
                  minWidth:       26,
                  height:         20,
                  background:     row.color === C.red ? C.redLight : "rgba(40,91,75,0.09)",
                  color:          row.color,
                  borderRadius:   99,
                  padding:        "0 8px",
                  display:        "flex",
                  alignItems:     "center",
                  justifyContent: "center",
                  fontSize:       11,
                  fontWeight:     700,
                  fontFamily:     "'Inter', sans-serif",
                }}>
                  {row.count}
                </span>
              </Link>
            ))}
            <div style={{ padding: "12px 18px", borderTop: `1px solid ${C.border}` }}>
              <Link
                to="/admin/pending"
                style={{
                  display:       "block",
                  textAlign:     "center",
                  padding:       "9px 0",
                  border:        `1.5px solid ${C.border}`,
                  borderRadius:  4,
                  fontFamily:    "'JetBrains Mono', monospace",
                  fontSize:      10,
                  fontWeight:    700,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color:         C.primary,
                  textDecoration:"none",
                  transition:    "background 0.15s",
                }}
              >
                {t("dashboard.review.viewAll")}
              </Link>
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════
            MID ROW  (category breakdown + century map)
        ══════════════════════════════════════════ */}
        <div className="mid-row">

          {/* Scholar disciplines breakdown */}
          <div className="dash-card" style={{ padding: "20px 22px" }}>
            <div style={{ marginBottom: 16 }}>
              <div className="section-label">{t("dashboard.cat.eyebrow")}</div>
              <div style={{
                fontSize:   14,
                fontWeight: 600,
                color:      C.text,
                marginTop:  3,
                fontFamily: "'Inter', sans-serif",
              }}>
                {t("dashboard.cat.title")}
              </div>
            </div>
            <CategoryBreakdown t={t} />
          </div>

          {/* Scholars by century */}
          <div className="dash-card" style={{ padding: "20px 22px" }}>
            <div style={{ marginBottom: 16 }}>
              <div className="section-label">{t("dashboard.century.eyebrow")}</div>
              <div style={{
                fontSize:   14,
                fontWeight: 600,
                color:      C.text,
                marginTop:  3,
                fontFamily: "'Inter', sans-serif",
              }}>
                {t("dashboard.century.title")}
              </div>
            </div>
            <CenturyGrid t={t} />
            {/* Region pills */}
            <div style={{
              marginTop:  20,
              paddingTop: 14,
              borderTop:  `1px solid ${C.border}`,
            }}>
              <div className="section-label" style={{ marginBottom: 8 }}>
                {t("dashboard.region.eyebrow")}
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {[
                  { key: "dashboard.region.maghreb",    count: 487 },
                  { key: "dashboard.region.mashriq",    count: 312 },
                  { key: "dashboard.region.andalus",    count: 198 },
                  { key: "dashboard.region.other",      count: 289 },
                ].map((r) => (
                  <span key={r.key} style={{
                    fontSize:     11,
                    fontWeight:   600,
                    background:   C.surface,
                    color:        C.muted,
                    borderRadius: 99,
                    padding:      "4px 11px",
                    fontFamily:   "'Inter', sans-serif",
                    border:       `1px solid ${C.border}`,
                  }}>
                    {t(r.key)} · {r.count}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════
            BOTTOM ROW  (recent activity + quick actions)
        ══════════════════════════════════════════ */}
        <div className="bottom-row">

          {/* Recent activity */}
          <div className="dash-card" style={{ padding: "18px 20px" }}>
            <div style={{
              display:        "flex",
              alignItems:     "center",
              justifyContent: "space-between",
              marginBottom:   14,
            }}>
              <div className="section-label">{t("dashboard.activity.eyebrow")}</div>
              <Link
                to="/admin/notifications"
                style={{
                  fontSize:       11,
                  color:          C.forest,
                  fontFamily:     "'Inter', sans-serif",
                  fontWeight:     600,
                  textDecoration: "none",
                  letterSpacing:  "0.03em",
                }}
              >
                {t("dashboard.activity.viewAll")} →
              </Link>
            </div>
            {ACTIVITY_ITEMS.map((item, i) => (
              <div key={i} className="activity-row">
                <div
                  className="activity-icon"
                  style={{
                    background:
                      item.iconType === "edit"         ? C.redLight
                      : item.iconType === "translate"  ? C.goldLight
                      : item.iconType === "flag"       ? "rgba(201,168,76,0.12)"
                      : C.blueLight,
                    color:
                      item.iconType === "edit"         ? C.red
                      : item.iconType === "translate"  ? "#9a7d30"
                      : item.iconType === "flag"       ? "#9a7d30"
                      : C.blue,
                  }}
                >
                  <span className="ms" style={{ fontSize: 17 }}>{item.iconType}</span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 2 }}>
                    {t(item.titleKey)}
                  </div>
                  <div style={{ fontSize: 11.5, color: C.subtle, fontStyle: "italic" }}>
                    {t(item.subKey)}
                  </div>
                  <span style={{
                    display:      "inline-block",
                    marginTop:    6,
                    fontSize:     10,
                    fontWeight:   600,
                    background:   item.badgeColor,
                    color:        item.badgeTextColor,
                    borderRadius: 99,
                    padding:      "2px 9px",
                  }}>
                    {t(item.badgeKey)}
                  </span>
                </div>
                <div style={{
                  fontSize:   10,
                  color:      "#c0c9c3",
                  flexShrink: 0,
                  fontFamily: "'Inter', sans-serif",
                }}>
                  {t(item.timeKey)}
                </div>
              </div>
            ))}
          </div>

          {/* Quick actions + platform health */}
          <div className="dash-card" style={{ padding: "18px 20px" }}>
            <div className="section-label" style={{ marginBottom: 14 }}>
              {t("dashboard.quick.eyebrow")}
            </div>
            <div className="quick-grid">
              {QUICK_LINKS.map((ql) => (
                <Link key={ql.to} to={ql.to} className="quick-link">
                  <span className="ms ql-icon" style={{ fontSize: 18 }}>{ql.icon}</span>
                  <span>{t(ql.labelKey)}</span>
                </Link>
              ))}
            </div>

            {/* Platform health pills */}
            <div style={{
              marginTop:  20,
              paddingTop: 16,
              borderTop:  `1px solid ${C.border}`,
            }}>
              <div className="section-label" style={{ marginBottom: 10 }}>
                {t("dashboard.health.eyebrow")}
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {[
                  { key: "dashboard.health.backup", ok: true  },
                  { key: "dashboard.health.search", ok: true  },
                  { key: "dashboard.health.media",  ok: true  },
                  { key: "dashboard.health.email",  ok: false },
                ].map((h) => (
                  <span key={h.key} style={{
                    display:      "inline-flex",
                    alignItems:   "center",
                    gap:          5,
                    fontSize:     11,
                    fontWeight:   600,
                    background:   h.ok ? "rgba(26,102,68,0.09)" : C.redLight,
                    color:        h.ok ? "#1a6644" : C.red,
                    borderRadius: 99,
                    padding:      "4px 11px",
                    fontFamily:   "'Inter', sans-serif",
                  }}>
                    <span style={{
                      width:       6,
                      height:      6,
                      borderRadius:"50%",
                      background:  h.ok ? "#1a6644" : C.red,
                      flexShrink:  0,
                    }} />
                    {t(h.key)}
                  </span>
                ))}
              </div>
            </div>

            {/* Last backup info */}
            <div style={{
              marginTop:    16,
              paddingTop:   14,
              borderTop:    `1px solid ${C.border}`,
              fontFamily:   "'Inter', sans-serif",
              fontSize:     11,
              color:        C.subtle,
              fontStyle:    "italic",
            }}>
              {t("dashboard.health.lastBackup")}:&nbsp;
              <span style={{ fontWeight: 600, color: C.muted, fontStyle: "normal" }}>
                {t("dashboard.health.lastBackupValue")}
              </span>
            </div>
          </div>
        </div>

      </div>
      </div> {/* /dash-page */}
    </>
  );
}