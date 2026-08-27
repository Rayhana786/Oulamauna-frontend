import React from "react";

/* ------------------------------------------------------------------ */
/*  Design tokens — Oulamnauna admin palette                          */
/* ------------------------------------------------------------------ */
const colors = {
  creamLight: "#fcfaf5",
  creamMid: "#f3ebd6",
  creamDark: "#e5d5a8",
  forestGreen: "#0b4335",
};

const fonts = {
  headline: "'Hanken Grotesk', sans-serif",
  body: "'Inter', sans-serif",
  label: "'JetBrains Mono', monospace",
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

const cardStyle: React.CSSProperties = {
  backgroundColor: colors.creamLight,
  borderRadius: 12,
  boxShadow: "0px 4px 20px rgba(11, 67, 53, 0.08)",
  border: `1px solid ${colors.forestGreen}`,
};

/* ------------------------------------------------------------------ */
/*  Portal Overview — stat cards                                       */
/* ------------------------------------------------------------------ */
const overviewStats = [
  { icon: "school", label: "Active Scholars", value: "1,240", delta: "12% vs last year", trend: "trending_up", filled: true },
  { icon: "library_books", label: "Published Works", value: "3,750", delta: "8% vs last year", trend: "trending_up", filled: false },
  { icon: "category", label: "Research Disciplines", value: "42", delta: "3 new this year", trend: "add", filled: false },
  { icon: "format_quote", label: "Total Citations", value: "12.4k", delta: "15% vs last year", trend: "trending_up", filled: false },
];

const PortalOverview: React.FC = () => (
  <section style={{ ...cardStyle, padding: 20 }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
      <h2 style={{ fontFamily: fonts.headline, fontSize: 18, lineHeight: "24px", fontWeight: 600, color: colors.forestGreen, margin: 0 }}>
        Portal Overview
      </h2>
      <button
        style={{
          display: "flex",
          alignItems: "center",
          gap: 4,
          fontFamily: fonts.body,
          fontSize: 13,
          color: colors.forestGreen,
          border: `1px solid ${colors.forestGreen}`,
          borderRadius: 6,
          padding: "4px 10px",
          backgroundColor: "transparent",
          cursor: "pointer",
        }}
      >
        View Detailed Reports <Icon name="chevron_right" size={14} />
      </button>
    </div>

    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
      {overviewStats.map((stat) => (
        <div
          key={stat.label}
          style={{
            border: `1px solid ${colors.forestGreen}`,
            borderRadius: 10,
            padding: 14,
            backgroundColor: colors.creamLight,
          }}
        >
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 6,
              backgroundColor: stat.filled ? colors.forestGreen : colors.creamMid,
              color: stat.filled ? colors.creamLight : colors.forestGreen,
              border: `1px solid ${colors.forestGreen}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 12,
            }}
          >
            <Icon name={stat.icon} size={16} />
          </div>
          <h3 style={{ fontFamily: fonts.label, fontSize: 12, letterSpacing: "0.02em", fontWeight: 500, color: colors.forestGreen, margin: "0 0 4px" }}>
            {stat.label}
          </h3>
          <p style={{ fontFamily: fonts.headline, fontSize: 21, fontWeight: 700, color: colors.forestGreen, margin: "0 0 6px" }}>
            {stat.value}
          </p>
          <p style={{ fontFamily: fonts.headline, fontSize: 11, letterSpacing: "0.05em", fontWeight: 700, color: colors.forestGreen, display: "flex", alignItems: "center", gap: 4, margin: 0 }}>
            <Icon name={stat.trend} size={11} />
            {stat.delta}
          </p>
        </div>
      ))}
    </div>
  </section>
);

/* ------------------------------------------------------------------ */
/*  Disciplinary Distribution                                          */
/* ------------------------------------------------------------------ */
const disciplines = [
  { label: "Theology", pct: 40, count: "1,500", opacity: 1 },
  { label: "Philosophy", pct: 30, count: "1,125", opacity: 0.8 },
  { label: "History", pct: 20, count: "750", opacity: 0.6 },
  { label: "Literature", pct: 10, count: "375", opacity: 0.4 },
];

const DisciplinaryDistribution: React.FC = () => (
  <section style={{ ...cardStyle, padding: 20 }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
      <h2 style={{ fontFamily: fonts.headline, fontSize: 18, lineHeight: "24px", fontWeight: 600, color: colors.forestGreen, margin: 0 }}>
        Disciplinary Distribution
      </h2>
      <button
        style={{
          display: "flex",
          alignItems: "center",
          gap: 4,
          fontFamily: fonts.body,
          fontSize: 13,
          color: colors.forestGreen,
          border: `1px solid ${colors.forestGreen}`,
          borderRadius: 6,
          padding: "4px 10px",
          backgroundColor: "transparent",
          cursor: "pointer",
        }}
      >
        See All <Icon name="chevron_right" size={14} />
      </button>
    </div>

    <div style={{ marginBottom: 18 }}>
      <p style={{ fontFamily: fonts.label, fontSize: 12, color: colors.forestGreen, margin: "0 0 4px" }}>Total Publications</p>
      <span style={{ fontFamily: fonts.headline, fontSize: 30, lineHeight: "36px", letterSpacing: "-0.02em", fontWeight: 700, color: colors.forestGreen }}>
        3,750
      </span>
    </div>

    {/* Stacked bar */}
    <div
      style={{
        display: "flex",
        height: 10,
        borderRadius: 9999,
        overflow: "hidden",
        marginBottom: 14,
        backgroundColor: colors.creamDark,
        gap: 2,
        border: `1px solid ${colors.forestGreen}`,
      }}
    >
      {disciplines.map((d) => (
        <div key={d.label} style={{ width: `${d.pct}%`, backgroundColor: colors.forestGreen, opacity: d.opacity }} />
      ))}
    </div>

    {/* Legend */}
    <div style={{ display: "flex", flexWrap: "wrap", gap: 16, marginBottom: 18, borderBottom: `1px solid ${colors.forestGreen}`, paddingBottom: 18 }}>
      {disciplines.map((d) => (
        <div key={d.label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 7, height: 7, borderRadius: "50%", backgroundColor: colors.forestGreen, opacity: d.opacity }} />
          <span style={{ fontFamily: fonts.label, fontSize: 12, color: colors.forestGreen }}>{d.label}</span>
        </div>
      ))}
    </div>

    {/* Breakdown list — includes all 4 disciplines shown in the legend/bar */}
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {disciplines.map((d) => (
        <div key={d.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontFamily: fonts.body, fontSize: 13, fontWeight: 500, color: colors.forestGreen }}>{d.label}</span>
          <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
            <span style={{ fontFamily: fonts.body, fontSize: 13, color: colors.forestGreen }}>{d.pct.toFixed(1)}%</span>
            <span style={{ fontFamily: fonts.body, fontSize: 13, fontWeight: 500, color: colors.forestGreen, width: 64, textAlign: "right" }}>
              {d.count}
            </span>
          </div>
        </div>
      ))}
    </div>
  </section>
);

/* ------------------------------------------------------------------ */
/*  Global Impact Factor — gauge                                       */
/* ------------------------------------------------------------------ */
const GlobalImpactFactor: React.FC = () => (
  <section style={{ ...cardStyle, padding: 20, display: "flex", flexDirection: "column", justifyContent: "space-between", height: 360 }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
      <h2 style={{ fontFamily: fonts.headline, fontSize: 18, lineHeight: "24px", fontWeight: 600, color: colors.forestGreen, margin: 0 }}>
        Global Impact Factor
      </h2>
      <button
        style={{
          display: "flex",
          alignItems: "center",
          gap: 4,
          fontFamily: fonts.body,
          fontSize: 13,
          color: colors.forestGreen,
          border: `1px solid ${colors.forestGreen}`,
          borderRadius: 6,
          padding: "4px 10px",
          backgroundColor: colors.creamLight,
          cursor: "pointer",
        }}
      >
        2026 <Icon name="expand_more" size={14} />
      </button>
    </div>

    <div style={{ display: "flex", justifyContent: "center", gap: 20, marginBottom: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <div style={{ width: 7, height: 7, borderRadius: "50%", backgroundColor: colors.forestGreen, border: `1px solid ${colors.forestGreen}` }} />
        <span style={{ fontFamily: fonts.label, fontSize: 12, color: colors.forestGreen }}>Current Index</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <div style={{ width: 7, height: 7, borderRadius: "50%", backgroundColor: colors.creamDark, border: `1px solid ${colors.forestGreen}` }} />
        <span style={{ fontFamily: fonts.label, fontSize: 12, color: colors.forestGreen }}>Target</span>
      </div>
    </div>

    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", position: "relative", paddingBottom: 12 }}>
      <div style={{ position: "relative", width: "100%", maxWidth: 260, aspectRatio: "2 / 1", overflow: "hidden" }}>
        <svg viewBox="0 0 200 100" style={{ width: "100%", height: "100%" }}>
          <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke={colors.creamDark} strokeWidth={22} />
          <path d="M 20 100 A 80 80 0 0 1 165 50" fill="none" stroke={colors.forestGreen} strokeWidth={22} />
        </svg>
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", paddingBottom: 6 }}>
          <span style={{ fontFamily: fonts.label, fontSize: 12, color: colors.forestGreen, marginBottom: 3 }}>Q1 Index</span>
          <span style={{ fontFamily: fonts.headline, fontSize: 21, fontWeight: 700, color: colors.forestGreen }}>7.8</span>
          <span style={{ fontFamily: fonts.headline, fontSize: 11, letterSpacing: "0.05em", fontWeight: 700, color: colors.forestGreen, marginTop: 3 }}>
            Top 10% Globally
          </span>
        </div>
      </div>
    </div>
  </section>
);

/* ------------------------------------------------------------------ */
/*  Recent Media Works                                                 */
/* ------------------------------------------------------------------ */
const mediaWorks = [
  { title: "The Golden Age", type: "Book", date: "Oct 12" },
  { title: "Classical Logic", type: "Lecture", date: "Oct 10" },
  { title: "Ethical Frameworks", type: "Paper", date: "Oct 05" },
];

const RecentMediaWorks: React.FC = () => (
  <section style={{ ...cardStyle, padding: 20, flex: 1 }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 16, borderBottom: `1px solid ${colors.forestGreen}`, paddingBottom: 12 }}>
      <h2 style={{ fontFamily: fonts.headline, fontSize: 18, lineHeight: "24px", fontWeight: 600, color: colors.forestGreen, margin: 0 }}>
        Recent Media Works
      </h2>
    </div>

    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {mediaWorks.map((work) => (
        <div
          key={work.title}
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "6px 8px",
            margin: "0 -8px",
            borderRadius: 8,
            border: "1px solid transparent",
            cursor: "pointer",
            transition: "background-color 0.15s, border-color 0.15s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = colors.creamMid;
            e.currentTarget.style.borderColor = colors.forestGreen;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "transparent";
            e.currentTarget.style.borderColor = "transparent";
          }}
        >
          <div>
            <p style={{ fontFamily: fonts.body, fontSize: 13, fontWeight: 500, color: colors.forestGreen, margin: 0 }}>{work.title}</p>
            <p style={{ fontFamily: fonts.headline, fontSize: 11, letterSpacing: "0.05em", fontWeight: 700, color: colors.forestGreen, margin: 0 }}>
              {work.type}
            </p>
          </div>
          <div style={{ textAlign: "right" }}>
            <p style={{ fontFamily: fonts.headline, fontSize: 11, letterSpacing: "0.05em", fontWeight: 700, color: colors.forestGreen, margin: 0 }}>
              {work.date}
            </p>
          </div>
        </div>
      ))}
    </div>
  </section>
);

/* ------------------------------------------------------------------ */
/*  Page — pure content, rendered inside <AdminLayout><Outlet/></...>  */
/* ------------------------------------------------------------------ */
const AdminDashboard: React.FC = () => {
  return (
    <div style={{ maxWidth: 1200, margin: "0 auto" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <PortalOverview />
          <DisciplinaryDistribution />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <GlobalImpactFactor />
          <RecentMediaWorks />
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;