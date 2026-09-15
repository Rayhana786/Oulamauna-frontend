import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { adminApi } from "../../api/adminApi";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart, 
  PieChart, Pie, Cell, BarChart, Bar, Legend 
} from "recharts";

/* ------------------------------------------------------------------ */
/*  Design Tokens & Helpers                                            */
/* ------------------------------------------------------------------ */
const colors = {
  creamLight: "#fcfaf5", creamMid: "#f6efdc", creamDark: "#e5d5a8",
  forestGreen: "#0b4335", amber: "#b8860b", red: "#8b2c2c", blue: "#4a7fcb",
};
const fonts = { headline: "'Hanken Grotesk', sans-serif", body: "'Inter', sans-serif", label: "'JetBrains Mono', monospace" };
const cardStyle: React.CSSProperties = { backgroundColor: colors.creamLight, borderRadius: 12, boxShadow: "0px 4px 20px rgba(11, 67, 53, 0.08)", border: `1px solid ${colors.forestGreen}` };

const Icon: React.FC<{ name: string; size?: number; filled?: boolean }> = ({ name, size = 20, filled = false }) => (
  <span className="material-symbols-outlined" style={{ fontSize: size, lineHeight: 1, fontVariationSettings: `'FILL' ${filled ? 1 : 0}, 'wght' 400, 'GRAD' 0, 'opsz' 24` }}>{name}</span>
);

const DonutChart: React.FC<{ percentage: number; color: string; size?: number }> = ({ percentage, color, size = 80 }) => {
  const radius = 30; const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" style={{ transform: "rotate(-90deg)" }}>
      <circle cx="40" cy="40" r={radius} stroke={colors.creamDark} strokeWidth="8" fill="none" />
      <circle cx="40" cy="40" r={radius} stroke={color} strokeWidth="8" fill="none" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} strokeLinecap="round" style={{ transition: "stroke-dashoffset 1s ease" }} />
    </svg>
  );
};

/* ------------------------------------------------------------------ */
/*  Main Dashboard Component                                           */
/* ------------------------------------------------------------------ */
const ACTIVITY_PAGE_SIZE = 6;

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [queueStats, setQueueStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activityPage, setActivityPage] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dashboardRes, queueRes] = await Promise.all([
          adminApi.scholars.getDashboardData(),
          adminApi.scholars.getDashboardStats(),
        ]);
        if (dashboardRes.data?.success) setData(dashboardRes.data.data);
        if (queueRes.data?.success) setQueueStats(queueRes.data.data);
      } catch (error) { console.error("Dashboard fetch failed:", error); }
      finally { setIsLoading(false); }
    };
    fetchData();
  }, []);

  if (isLoading || !data) return <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name="hourglass_empty" size={40} /></div>;

  const { 
    summary, queueBreakdown, dailyContributions, activityFeed, topContributors, 
    languageDistribution = [], urgentReviews = [], 
    approvalVsRejection = [], pendingAgeData = [], topDisciplines = [] 
  } = data;
  
  const approvalRate = summary.totalScholars > 0 ? Math.round((summary.totalScholars / (summary.totalScholars + summary.totalPending)) * 100) : 0;

  const queueTypes = [
    { name: "Scholars", value: queueBreakdown?.scholars || 0, color: colors.forestGreen },
    { name: "Edits", value: queueBreakdown?.edits || 0, color: colors.blue },
    { name: "Media", value: queueBreakdown?.media || 0, color: colors.amber },
    { name: "Works", value: queueBreakdown?.works || 0, color: colors.red },
  ];
  const totalQueue = queueTypes.reduce((sum, t) => sum + t.value, 0);

  const hasOverdue = queueStats?.overdue > 0;
  const queueMetrics = queueStats ? [
    { label: "Pending", value: queueStats.total_pending, icon: "inventory_2", color: colors.forestGreen },
    { label: "Overdue", value: queueStats.overdue, icon: "warning", color: hasOverdue ? colors.red : colors.forestGreen },
    { label: "New Today", value: queueStats.new_today, icon: "fiber_new", color: colors.blue },
    { label: "This Week", value: queueStats.this_week, icon: "task_alt", color: colors.amber },
    { label: "Avg. Review Time", value: queueStats.avg_review_time, icon: "schedule", color: colors.forestGreen, isText: true },
  ] : [];

  const LANG_LABELS: Record<string, string> = { English: "English", Arabic: "Arabic", French: "French" };
  const LANG_COLORS = [colors.forestGreen, colors.amber, colors.blue, colors.red, "#7A9E7E"];
  
  const languageBreakdown = languageDistribution;
  const totalLangCount = languageBreakdown.reduce((sum: number, l: any) => sum + (l.value || 0), 0);

  const totalActivityPages = Math.max(1, Math.ceil(activityFeed.length / ACTIVITY_PAGE_SIZE));
  const currentPage = Math.min(activityPage, totalActivityPages - 1);
  const pagedActivity = activityFeed.slice(currentPage * ACTIVITY_PAGE_SIZE, currentPage * ACTIVITY_PAGE_SIZE + ACTIVITY_PAGE_SIZE);

  return (
    <div style={{ padding: 24, maxWidth: 1600, margin: "0 auto", fontFamily: fonts.body, color: colors.forestGreen }}>
      
      {/* ── HEADER ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: fonts.headline, fontSize: 28, fontWeight: 700, margin: 0 }}>Dashboard Overview</h1>
          <p style={{ fontFamily: fonts.body, fontSize: 14, color: colors.forestGreen, opacity: 0.7, margin: "4px 0 0" }}>Welcome back, Admin. Here is how Oulamauna is progressing today.</p>
        </div>
        <button onClick={() => navigate("/admin/pending/scholars")} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 20px", backgroundColor: colors.forestGreen, color: colors.creamLight, border: "none", borderRadius: 8, fontFamily: fonts.body, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
          <Icon name="pending_actions" size={18} /> Review Queue ({summary.totalPending})
        </button>
      </div>

      {/* ── ROW 1: TOP DONUT CARDS ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20, marginBottom: 20 }}>
        {[
          { label: "Scholars Published", value: summary.totalScholars, pending: queueBreakdown.scholars + queueBreakdown.edits, color: colors.forestGreen, icon: "school" },
          { label: "Works & Media", value: "Pending", pending: queueBreakdown.media + queueBreakdown.works, color: colors.amber, icon: "folder_open", isPending: true },
          { label: "Active Contributors", value: summary.activeContributors, pending: summary.totalUsers - summary.activeContributors, color: colors.blue, icon: "how_to_reg" }
        ].map((card, i) => {
          const percentage = card.isPending ? 60 : Math.min(Math.round((card.value / (card.value + card.pending || 1)) * 100), 100);
          return (
            <div key={i} style={{ ...cardStyle, padding: 24, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: `${card.color}15`, color: card.color, display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name={card.icon} size={18} filled /></div>
                  <span style={{ fontFamily: fonts.label, fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: colors.forestGreen, opacity: 0.8 }}>{card.label}</span>
                </div>
                <p style={{ fontFamily: fonts.headline, fontSize: 32, fontWeight: 700, margin: 0, color: card.color }}>{card.isPending ? card.pending : card.value.toLocaleString()}</p>
                <p style={{ fontFamily: fonts.body, fontSize: 12, margin: "4px 0 0", opacity: 0.7 }}>{card.isPending ? "Awaiting review" : `${percentage}% Approval Rate`}</p>
              </div>
              <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <DonutChart percentage={percentage} color={card.color} size={90} />
                <span style={{ position: "absolute", fontFamily: fonts.headline, fontSize: 16, fontWeight: 700, color: card.color }}>{percentage}%</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── QUEUE BREAKDOWN ── */}
      <div style={{ ...cardStyle, padding: "18px 24px", marginBottom: 24, display: "flex", alignItems: "center", gap: 24 }}>
        <div style={{ minWidth: 150 }}>
          <h3 style={{ fontFamily: fonts.headline, fontSize: 15, fontWeight: 700, margin: 0 }}>Queue Breakdown</h3>
          <p style={{ fontFamily: fonts.body, fontSize: 11.5, opacity: 0.65, margin: "3px 0 0" }}>By content type</p>
        </div>
        <div style={{ position: "relative", width: 76, height: 76, flexShrink: 0 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={queueTypes} dataKey="value" nameKey="name" innerRadius={24} outerRadius={38} paddingAngle={totalQueue ? 3 : 0} strokeWidth={0}>
                {queueTypes.map((t, i) => <Cell key={i} fill={t.color} />)}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
            <span style={{ fontFamily: fonts.headline, fontSize: 16, fontWeight: 700, lineHeight: 1 }}>{totalQueue}</span>
          </div>
        </div>
        <div style={{ display: "flex", gap: 22, flexWrap: "wrap", flex: 1 }}>
          {queueTypes.map((t, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: t.color, flexShrink: 0 }} />
              <span style={{ fontFamily: fonts.body, fontSize: 12.5, opacity: 0.8 }}>{t.name}</span>
              <span style={{ fontFamily: fonts.label, fontSize: 12.5, fontWeight: 700 }}>{t.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── ROW 2: MAIN CHARTS ── */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 20, marginBottom: 24 }}>
        <div style={{ ...cardStyle, padding: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <h3 style={{ fontFamily: fonts.headline, fontSize: 18, fontWeight: 700, margin: 0 }}>Daily Contribution Velocity</h3>
            <span style={{ fontFamily: fonts.label, fontSize: 11, padding: "4px 10px", borderRadius: 9999, backgroundColor: colors.creamMid, border: `1px solid ${colors.forestGreen}` }}>Last 30 Days</span>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={dailyContributions}>
              <defs>
                <linearGradient id="colorContrib" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={colors.forestGreen} stopOpacity={0.3}/>
                  <stop offset="95%" stopColor={colors.forestGreen} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={colors.creamDark} vertical={false} />
              <XAxis dataKey="date" tick={{ fontFamily: fonts.label, fontSize: 10, fill: colors.forestGreen }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontFamily: fonts.label, fontSize: 10, fill: colors.forestGreen }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ backgroundColor: colors.creamLight, border: `1px solid ${colors.forestGreen}`, borderRadius: 8, fontFamily: fonts.body }} />
              <Area type="monotone" dataKey="contributions" stroke={colors.forestGreen} strokeWidth={3} fillOpacity={1} fill="url(#colorContrib)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ ...cardStyle, padding: 24, flex: 1 }}>
            <h3 style={{ fontFamily: fonts.headline, fontSize: 16, fontWeight: 700, margin: "0 0 16px" }}>Platform Health</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}><span style={{ fontSize: 13 }}>Total Users</span><span style={{ fontFamily: fonts.label, fontSize: 12, fontWeight: 700 }}>{summary.totalUsers}</span></div>
                <div style={{ width: "100%", height: 6, backgroundColor: colors.creamDark, borderRadius: 3 }}><div style={{ width: "100%", height: "100%", backgroundColor: colors.forestGreen, borderRadius: 3 }} /></div>
              </div>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}><span style={{ fontSize: 13 }}>Approval Rate</span><span style={{ fontFamily: fonts.label, fontSize: 12, fontWeight: 700 }}>{approvalRate}%</span></div>
                <div style={{ width: "100%", height: 6, backgroundColor: colors.creamDark, borderRadius: 3 }}><div style={{ width: `${approvalRate}%`, height: "100%", backgroundColor: colors.amber, borderRadius: 3 }} /></div>
              </div>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}><span style={{ fontSize: 13 }}>Open Reports</span><span style={{ fontFamily: fonts.label, fontSize: 12, fontWeight: 700, color: colors.red }}>{summary.openReports}</span></div>
                <div style={{ width: "100%", height: 6, backgroundColor: colors.creamDark, borderRadius: 3 }}><div style={{ width: `${Math.min(summary.openReports * 10, 100)}%`, height: "100%", backgroundColor: colors.red, borderRadius: 3 }} /></div>
              </div>
            </div>
          </div>

          <div style={{ ...cardStyle, padding: 24, flex: 1 }}>
            <h3 style={{ fontFamily: fonts.headline, fontSize: 16, fontWeight: 700, margin: "0 0 16px", display: "flex", alignItems: "center", gap: 8 }}><Icon name="emoji_events" size={18} style={{ color: colors.amber }} filled /> Top Contributors</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {topContributors.map((user: any, i: number) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", backgroundColor: colors.creamMid, borderRadius: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>#{i+1} {user.name}</span>
                  <span style={{ fontFamily: fonts.label, fontSize: 11, fontWeight: 700, color: colors.forestGreen }}>{user.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

{/* ── ROW 3 & 4 COMBINED: SMART LAYOUT ── */}
<div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 20, marginBottom: 24 }}>
  
  {/* LEFT COLUMN */}
  <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
    
    {/* Top Disciplines Chart */}
    <div style={{ ...cardStyle, padding: 24 }}>
      <h3 style={{ fontFamily: fonts.headline, fontSize: 15, fontWeight: 700, margin: "0 0 16px", display: "flex", alignItems: "center", gap: 8 }}>
        <Icon name="category" size={18} style={{ color: colors.blue }} /> Top Disciplines
      </h3>
      {topDisciplines.length === 0 ? (
        <p style={{ fontSize: 12, opacity: 0.6, textAlign: "center", padding: 20 }}>No disciplines yet.</p>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <BarChart layout="vertical" data={topDisciplines} margin={{ left: 10, right: 10, top: 10, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={colors.creamDark} horizontal={false} />
            <XAxis type="number" tick={{ fontFamily: fonts.label, fontSize: 10, fill: colors.forestGreen }} axisLine={false} tickLine={false} allowDecimals={false} />
            <YAxis type="category" dataKey="name" tick={{ fontFamily: fonts.body, fontSize: 11, fill: colors.forestGreen }} axisLine={false} tickLine={false} width={90} />
            <Tooltip cursor={{ fill: colors.creamMid }} contentStyle={{ backgroundColor: colors.creamLight, border: `1px solid ${colors.creamDark}`, borderRadius: 6, fontSize: 12 }} />
            <Bar dataKey="count" fill={colors.blue} radius={[0, 4, 4, 0]} barSize={20} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>

        {/* Latest Platform Events - COMPACT & CLEAN LINES */}
    <div style={{ ...cardStyle, padding: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h3 style={{ fontFamily: fonts.headline, fontSize: 15, fontWeight: 700, margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
          <Icon name="history" size={18} filled /> Latest Platform Events
        </h3>
        <span style={{ fontFamily: fonts.label, fontSize: 11, opacity: 0.55 }}>{activityFeed.length} total</span>
      </div>

      <div style={{ display: "flex", flexDirection: "column" }}>
        {pagedActivity.slice(0, 3).map((event: any, i: number) => (
          <div 
            key={i} 
            style={{ 
              display: "flex", 
              gap: 12, 
              padding: "12px 0", 
              borderBottom: i < 2 ? `1px solid ${colors.creamDark}` : "none" 
            }}
          >
            <div style={{ width: 32, height: 32, borderRadius: "50%", backgroundColor: event.type === 'scholar' ? colors.forestGreen : event.type === 'user' ? colors.blue : colors.amber, color: colors.creamLight, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Icon name={event.type === 'scholar' ? 'school' : event.type === 'user' ? 'person' : 'folder_open'} size={16} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontFamily: fonts.body, fontSize: 12, fontWeight: 600, margin: "0 0 2px", lineHeight: 1.3, color: colors.forestGreen }}>{event.text}</p>
              <p style={{ fontFamily: fonts.label, fontSize: 9, color: colors.forestGreen, opacity: 0.7, margin: 0 }}>by {event.user} • {new Date(event.date).toLocaleDateString()}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>

  {/* RIGHT COLUMN */}
  <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
    
    {/* Quality Control (Donut) */}
    <div style={{ ...cardStyle, padding: 24 }}>
      <h3 style={{ fontFamily: fonts.headline, fontSize: 15, fontWeight: 700, margin: "0 0 16px", display: "flex", alignItems: "center", gap: 8 }}>
        <Icon name="pie_chart" size={18} style={{ color: colors.forestGreen }} /> Quality Control
      </h3>
      {approvalVsRejection.length === 0 ? (
        <p style={{ fontSize: 12, opacity: 0.6, textAlign: "center", padding: 20 }}>No decisions yet.</p>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie data={approvalVsRejection} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={4} dataKey="value">
              {approvalVsRejection.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.name === "Approved" ? colors.forestGreen : colors.red} />
              ))}
            </Pie>
            <Tooltip contentStyle={{ backgroundColor: colors.creamLight, border: `1px solid ${colors.creamDark}`, borderRadius: 6, fontSize: 12 }} />
            <Legend verticalAlign="bottom" height={30} iconSize={8} wrapperStyle={{ fontSize: 11, fontFamily: fonts.label }} />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>

    {/* Queue Aging (Histogram) */}
    <div style={{ ...cardStyle, padding: 24, flex: 1 }}>
      <h3 style={{ fontFamily: fonts.headline, fontSize: 15, fontWeight: 700, margin: "0 0 16px", display: "flex", alignItems: "center", gap: 8 }}>
        <Icon name="hourglass_bottom" size={18} style={{ color: colors.amber }} /> Queue Aging
      </h3>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={pendingAgeData}>
          <CartesianGrid strokeDasharray="3 3" stroke={colors.creamDark} vertical={false} />
          <XAxis dataKey="name" tick={{ fontFamily: fonts.label, fontSize: 9, fill: colors.forestGreen }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontFamily: fonts.label, fontSize: 10, fill: colors.forestGreen }} axisLine={false} tickLine={false} allowDecimals={false} />
          <Tooltip cursor={{ fill: colors.creamMid }} contentStyle={{ backgroundColor: colors.creamLight, border: `1px solid ${colors.creamDark}`, borderRadius: 6, fontSize: 12 }} />
          <Bar dataKey="value" radius={[4, 4, 0, 0]}>
            {pendingAgeData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={index === 0 ? colors.forestGreen : index === 1 ? colors.amber : index === 2 ? colors.blue : colors.red} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>

  </div>
</div>
      {/* ── ROW 5: REVIEW QUEUE METRICS ── */}
      {queueStats && (
        <div style={{ ...cardStyle, padding: "20px 28px", marginTop: 24, marginBottom: 24 }}>
          <h3 style={{ fontFamily: fonts.headline, fontSize: 15, fontWeight: 700, margin: "0 0 18px" }}>Review Queue Metrics</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)" }}>
            {queueMetrics.map((m, i) => (
              <div key={m.label} style={{ display: "flex", alignItems: "center", gap: 12, padding: "0 18px", borderLeft: i === 0 ? "none" : `1px solid ${colors.creamDark}` }}>
                <div style={{ width: 36, height: 36, borderRadius: 9, backgroundColor: `${m.color}15`, color: m.color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Icon name={m.icon} size={18} />
                </div>
                <div>
                  <p style={{ fontFamily: fonts.label, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.04em", opacity: 0.6, margin: 0 }}>{m.label}</p>
                  <p style={{ fontFamily: m.isText ? fonts.label : fonts.headline, fontSize: m.isText ? 15 : 22, fontWeight: 700, margin: "2px 0 0", color: m.color, lineHeight: 1 }}>{m.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── ROW 6: CONTENT BY LANGUAGE + URGENT REVIEWS ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 20, marginBottom: 24 }}>
        <div style={{ ...cardStyle, padding: 24 }}>
          <h3 style={{ fontFamily: fonts.headline, fontSize: 16, fontWeight: 700, margin: "0 0 4px", display: "flex", alignItems: "center", gap: 8 }}>
            <Icon name="translate" size={18} filled /> Content by Language
          </h3>
          <p style={{ fontFamily: fonts.body, fontSize: 11.5, opacity: 0.6, margin: "0 0 18px" }}>Ranked by volume</p>
          {languageBreakdown.length === 0 ? (
            <p style={{ fontSize: 12.5, opacity: 0.6 }}>No language data yet.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {[...languageBreakdown]
                .sort((a: any, b: any) => b.value - a.value)
                .map((lang: any, i: number) => {
                  const pct = totalLangCount ? Math.round((lang.value / totalLangCount) * 100) : 0;
                  const isLeader = i === 0;
                  const color = LANG_COLORS[i % LANG_COLORS.length];
                  return (
                    <div key={lang.name || i}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                        <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: isLeader ? 700 : 600 }}>
                          {isLeader && <Icon name="emoji_events" size={15} filled style={{ color: colors.amber } as any} />}
                          {LANG_LABELS[lang.name] || lang.name}
                        </span>
                        <span style={{ fontFamily: fonts.label, fontSize: 12, fontWeight: 700, color: isLeader ? color : colors.forestGreen }}>
                          {lang.value} <span style={{ opacity: 0.5, fontWeight: 500 }}>({pct}%)</span>
                        </span>
                      </div>
                      <div style={{ width: "100%", height: isLeader ? 10 : 8, backgroundColor: colors.creamDark, borderRadius: 5 }}>
                        <div style={{ width: `${pct}%`, height: "100%", backgroundColor: color, borderRadius: 5, transition: "width 0.6s ease" }} />
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>

      </div>

    </div>
  );
}