import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { adminApi } from "../../api/adminApi";
import { useLang } from "../../context/LanguageContext";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts";

const ACCENT_CYCLE = [
  "#1e4d3a",
  "#C9A84C",
  "#3d6b96",
  "#c1622d",
  "#2f7d74",
  "#7a5c8e",
  "#a8425a",
];

const ACTIVITY_PAGE_SIZE = 6;

type LangKey = "English" | "Arabic" | "French" | "en" | "ar" | "fr";

type DashboardSummary = {
  totalScholars?: number;
  totalSubmissions?: number;
  totalPending?: number;
  activeContributors?: number;
  totalMedia?: number;
  totalUsers?: number;
  openReports?: number;
  totalForumPosts?: number;
  hiddenForumPosts?: number;
  totalDisciplines?: number;
};

type QueueBreakdown = {
  scholars?: number;
  edits?: number;
  media?: number;
  works?: number;
  images?: number;
};

type QueueStats = {
  total_pending?: number;
  overdue?: number;
  new_today?: number;
  this_week?: number;
  avg_review_time?: number | string;
};

type ActivityItem = {
  type?: string;
  text?: string;
  user?: string;
  date?: string;
};

type Contributor = {
  name?: string;
  count?: number;
};

type LanguageItem = {
  name?: string;
  value?: number;
};

type DisciplineItem = {
  name?: string;
  count?: number;
};

type DailyContribution = {
  date?: string;
  contributions?: number;
};

type DashboardData = {
  summary: DashboardSummary;
  queueBreakdown?: QueueBreakdown;
  dailyContributions?: DailyContribution[];
  activityFeed?: ActivityItem[];
  topContributors?: Contributor[];
  languageDistribution?: LanguageItem[];
  topDisciplines?: DisciplineItem[];
  urgentMetrics?: {
    pendingReports: number;
    highStrikeUsers: number;
  };
  forumGrowth?: { name: string; posts: number }[];
  reportsGrowth?: { name: string; reports: number }[];
};



const getMonthTranslation = (t: (key: string) => string, monthString: string): string => {
  const monthMap: Record<string, string> = {
    'jan': t('months.jan'), 'feb': t('months.feb'), 'mar': t('months.mar'),
    'apr': t('months.apr'), 'may': t('months.may'), 'jun': t('months.jun'),
    'jul': t('months.jul'), 'aug': t('months.aug'), 'sep': t('months.sep'),
    'oct': t('months.oct'), 'nov': t('months.nov'), 'dec': t('months.dec'),
    'Jan': t('months.jan'), 'Feb': t('months.feb'), 'Mar': t('months.mar'),
    'Apr': t('months.apr'), 'May': t('months.may'), 'Jun': t('months.jun'),
    'Jul': t('months.jul'), 'Aug': t('months.aug'), 'Sep': t('months.sep'),
    'Oct': t('months.oct'), 'Nov': t('months.nov'), 'Dec': t('months.dec'),
  };
  
  // Handle case where backend sends "months.sep 16"
  if (monthString.startsWith('months.')) {
    const parts = monthString.split(' ');
    const translatedMonth = t(parts[0]);
    return parts.length > 1 ? `${translatedMonth} ${parts[1]}` : translatedMonth;
  }
  
  // Handle normal case like "Sep 16"
  const monthPart = monthString.split(' ')[0];
  const translatedMonth = monthMap[monthPart];
  if (translatedMonth && translatedMonth !== monthPart) {
    const parts = monthString.split(' ');
    return parts.length > 1 ? `${translatedMonth} ${parts[1]}` : translatedMonth;
  }
  return monthString;
};

const renderDisciplineTick = ({ x, y, payload }: { x?: number; y?: number; payload?: { value?: string } }) => {
  const label = String(payload?.value ?? "");
  const truncated = label.length > 16 ? `${label.slice(0, 16)}…` : label;
  return (
    <g transform={`translate(${x ?? 0},${y ?? 0})`}>
      <title>{label}</title>
      <text x={-6} y={0} dy={4} textAnchor="end" fontFamily="'Inter', sans-serif" fontSize={11} fill="#1e4d3a">
        {truncated}
      </text>
    </g>
  );
};

const ChartTooltipStyle = {
  backgroundColor: "#fbf9f4",
  border: "1px solid rgba(30,77,58,0.18)",
  borderRadius: "10px",
  boxShadow: "0 8px 24px rgba(30,77,58,0.10)",
  fontFamily: "'Inter', sans-serif",
  fontSize: "12px",
  color: "#1e4d3a",
  padding: "10px 12px",
};

export default function AdminDashboard() {
  const { lang, t, dbLanguages } = useLang(); // ✅ Added dbLanguages here
  const navigate = useNavigate();
  const isRTL = lang === "AR";

    // ✅ 100% DYNAMIC: Placed INSIDE the component so it can access dbLanguages
  const getLanguageName = (backendNameOrCode: string): string => {
    const found = dbLanguages.find(
      (l) => l.code.toLowerCase() === backendNameOrCode.toLowerCase() || 
             l.name.toLowerCase() === backendNameOrCode.toLowerCase()
    );
    
    if (found) {
      return found.name; 
    }
    return backendNameOrCode || t('languages.unknown');
  };

  const [graphView, setGraphView] = useState<'30days' | 'yearly' | 'all'>('30days');
  const [data, setData] = useState<DashboardData | null>(null);
  const [queueStats, setQueueStats] = useState<QueueStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activityPage, setActivityPage] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dashboardRes, queueRes] = await Promise.all([
          adminApi.scholars.getDashboardData({ graphView }),
          adminApi.scholars.getDashboardStats(),
        ]);
        if (dashboardRes.data?.success) setData(dashboardRes.data.data as DashboardData);
        if (queueRes.data?.success) setQueueStats(queueRes.data.data as QueueStats);
      } catch (error) {
        console.error("Dashboard fetch failed:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [graphView]);

  if (isLoading || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fbf9f4]">
        <span className="material-symbols-outlined text-[40px] text-[#1e4d3a]/40 animate-pulse" style={{ fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}>
          hourglass_empty
        </span>
      </div>
    );
  }

  const {
    summary, queueBreakdown, dailyContributions = [], activityFeed = [],
    topContributors = [], languageDistribution = [], topDisciplines = [],
    urgentMetrics, forumGrowth,
  } = data;

  // ✅ DYNAMIC TRANSLATION MAPPING FOR CHARTS
  const translatedChartData = dailyContributions.map(item => ({
    ...item,
    date: getMonthTranslation(t, item.date || '')
  }));

  const translatedForumGrowth = (forumGrowth || []).map(item => ({
    ...item,
    name: getMonthTranslation(t, item.name || '')
  }));

  const approvalRate = (summary.totalScholars ?? 0) > 0
    ? Math.round(((summary.totalScholars ?? 0) / ((summary.totalScholars ?? 0) + (summary.totalPending ?? 0))) * 100)
    : 0;

  const queueTypes = [
    { name: t("adminDashboard.stats.scholars"), value: queueBreakdown?.scholars ?? 0, color: "#1e4d3a" },
    { name: t("adminDashboard.stats.edits"), value: queueBreakdown?.edits ?? 0, color: "#e96d5c" },
    { name: t("adminDashboard.stats.media"), value: queueBreakdown?.media ?? 0, color: "#4f9184" },
    { name: t("adminDashboard.stats.works"), value: queueBreakdown?.works ?? 0, color: "#C9A84C" },
  ];

  const totalQueue = queueTypes.reduce((sum, item) => sum + item.value, 0);
  const languageBreakdown = languageDistribution;
  const totalLangCount = languageBreakdown.reduce((sum, item) => sum + (item.value ?? 0), 0);

  const totalActivityPages = Math.max(1, Math.ceil(activityFeed.length / ACTIVITY_PAGE_SIZE));
  const currentPage = Math.min(activityPage, totalActivityPages - 1);
  const pagedActivity = activityFeed.slice(currentPage * ACTIVITY_PAGE_SIZE, currentPage * ACTIVITY_PAGE_SIZE + ACTIVITY_PAGE_SIZE);

  const metricCards = [
    { label: t("adminDashboard.metrics.scholars"), value: summary.totalScholars ?? 0, note: t("adminDashboard.metrics.allTime"), icon: "menu_book", color: "#1e4d3a" },
    { label: t("adminDashboard.metrics.pending"), value: summary.totalPending ?? 0, note: t("adminDashboard.metrics.requiresAttention"), icon: "schedule", color: "#3d6b96", alert: true },
    { label: t("adminDashboard.metrics.activeUsers"), value: summary.activeContributors ?? 0, note: t("adminDashboard.metrics.canContribute"), icon: "person", color: "#7a5c8e" },
    { label: t("adminDashboard.metrics.reports"), value: summary.openReports ?? 0, note: t("adminDashboard.metrics.moderationQueue"), icon: "flag", color: "#e96d5c" },
    { label: t("adminDashboard.metrics.forumPosts"), value: summary.totalForumPosts ?? 0, note: t("adminDashboard.metrics.totalPosts"), icon: "forum", color: "#C9A84C" },
  ];

  return (
    <div className="oulamauna-dashboard min-h-screen text-[#1e4d3a] antialiased font-['Inter']" dir={isRTL ? "rtl" : "ltr"}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&family=Source+Serif+4:wght@400;500;600;700&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap');

        .oulamauna-dashboard {
          background: radial-gradient(circle at 8% 10%, rgba(201,168,76,0.055), transparent 24%), radial-gradient(circle at 92% 16%, rgba(79,145,132,0.06), transparent 25%), #fbf9f4;
        }
        .oulamauna-dashboard * { box-sizing: border-box; }
        .oulamauna-dashboard .serif-title { font-family: 'Source Serif 4', Georgia, serif; letter-spacing: -0.025em; }
        .oulamauna-dashboard .mono-label { font-family: 'JetBrains Mono', monospace; letter-spacing: 0.06em; }
        
        /* ✅ ORIGINAL CARD HOVER STYLE (Only shadow changes, NO background change) */
        .oulamauna-dashboard .dashboard-card {
          background: rgba(251,249,244,0.96);
          border: 1px solid rgba(30,77,58,0.10);
          border-radius: 10px;
          box-shadow: 0 5px 18px rgba(30,77,58,0.055);
          transition: box-shadow 180ms ease, transform 180ms ease;
        }
        .oulamauna-dashboard .dashboard-card:hover {
          box-shadow: 0 9px 26px rgba(30,77,58,0.08);
        }
        
        .oulamauna-dashboard .metric-card {
          background: radial-gradient(circle at 90% 8%, rgba(255,255,255,0.85), transparent 32%), #fbf9f4;
        }
        .oulamauna-dashboard .metric-number { font-family: 'Source Serif 4', Georgia, serif; letter-spacing: -0.035em; }
        .oulamauna-dashboard ::selection { background: #C9A84C; color: #1e4d3a; }
      `}</style>

      <main className="max-w-[1450px] mx-auto px-3 md:px-5 xl:px-7 py-6 md:py-8">
        {/* HEADER */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <div className="mono-label text-[9px] uppercase font-bold text-[#C9A84C] mb-1">{t("adminDashboard.title")}</div>
            <h1 className="serif-title text-[27px] md:text-[32px] leading-tight font-semibold text-[#082f27]">{t("adminDashboard.welcomeUser")}</h1>
          </div>

          {/* ✅ SPECIFIC BUTTON HOVER: Green default, White bg + Green text on hover, pointer cursor */}
          <button
            type="button"
            onClick={() => navigate("/admin/pending/scholars")}
            className="inline-flex items-center justify-center gap-2 rounded-[8px] bg-[#1e4d3a] text-white border-2 border-[#1e4d3a] px-5 py-3 text-[10px] font-bold uppercase tracking-[0.06em] hover:bg-white hover:text-[#1e4d3a] transition-all duration-300 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[17px]" style={{ fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}>
              pending_actions
            </span>
            {t("reviewQueue.title")} ({summary.totalPending ?? 0})
          </button>
        </header>

      

{/* TOP METRICS */}
<section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4 mb-6">
  {metricCards.map((card) => (
    <div
      key={card.label}
      className="dashboard-card metric-card relative overflow-hidden p-3 md:p-5"
      style={{ borderLeft: isRTL ? 'none' : `4px solid ${card.color}`, borderRight: isRTL ? `4px solid ${card.color}` : 'none' }}
    >
      <div className="flex items-center gap-2 md:gap-3">
        <div className="w-9 h-9 md:w-11 md:h-11 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: `${card.color}16`, border: `1px solid ${card.color}32` }}>
          <span className="material-symbols-outlined text-[18px] md:text-[22px]" style={{ color: card.color, fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}>{card.icon}</span>
        </div>
        <span className="mono-label text-[8px] md:text-[9px] uppercase font-semibold text-[#1e4d3a]/70 leading-[1.35]">{card.label}</span>
      </div>
      <div className="flex items-end justify-between gap-2 md:gap-3 mt-3 md:mt-4">
        <div>
          <div className="metric-number text-[24px] md:text-[28px] font-semibold leading-none text-[#082f27]">{card.value.toLocaleString()}</div>
          <div className="mt-1 md:mt-2 text-[9px] md:text-[10px] text-[#66837d]">{card.note}</div>
        </div>
        {card.alert && (
          <div className="text-[9px] md:text-[10px] font-semibold whitespace-nowrap text-[#e96d5c]">
            <span className="text-[13px] md:text-[15px] mr-1">!</span>
          </div>
        )}
      </div>
    </div>
  ))}
</section>

        {/* MAIN CHARTS */}
        <section className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-5 mb-6">
          {/* Activity Chart */}
          <div className="dashboard-card p-5 md:p-6">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
              <div>
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-[20px]">monitoring</span>
                  <h2 className="serif-title text-[21px] font-semibold">
                    {graphView === 'yearly' ? t("adminDashboard.charts.monthly") : graphView === 'all' ? t("adminDashboard.charts.yearly") : t("adminDashboard.charts.daily")}
                  </h2>
                </div>
                <p className="text-[11px] text-[#1e4d3a]/55 mt-1">
                  {graphView === 'yearly' ? t("adminDashboard.charts.thisYearDesc") : graphView === 'all' ? t("adminDashboard.charts.allTimeDesc") : t("adminDashboard.charts.last30DaysDesc")}
                </p>
              </div>

              {/* Graph View Toggle */}
              <div className="flex items-center gap-1 bg-[#1e4d3a]/[0.05] border border-[#1e4d3a]/10 rounded-full p-1 shrink-0">
                {(['30days', 'yearly', 'all'] as const).map((view) => (
                  <button
                    key={view}
                    onClick={() => setGraphView(view)}
                    className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wide transition-all duration-300 cursor-pointer ${
                      graphView === view 
                        ? 'bg-[#1e4d3a] text-white border-2 border-[#1e4d3a] shadow-md' 
                        : 'bg-white text-[#1e4d3a] border-2 border-[#1e4d3a]/30 hover:bg-[#1e4d3a]/5'
                    }`}
                  >
                    {t(`adminDashboard.charts.toggle.${view}`)}
                  </button>
                ))}
              </div>
            </div>

            <ResponsiveContainer width="100%" height={270}>
              <AreaChart data={translatedChartData} margin={{ top: 8, right: 10, left: -8, bottom: 0 }}>
                <defs>
                  <linearGradient id="adminActivityFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1e4d3a" stopOpacity={0.20} />
                    <stop offset="95%" stopColor="#1e4d3a" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="2 3" stroke="rgba(30,77,58,0.10)" vertical={false} />
                <XAxis dataKey="date" tick={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fill: "#1e4d3a99" }} axisLine={false} tickLine={false} dy={8} />
                <YAxis tick={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fill: "#1e4d3a99" }} axisLine={false} tickLine={false} dx={-5} />
                <Tooltip contentStyle={ChartTooltipStyle} cursor={{ fill: "rgba(30,77,58,0.035)" }} />
                <Area type="monotone" dataKey="contributions" stroke="#1e4d3a" strokeWidth={2.3} fill="url(#adminActivityFill)" fillOpacity={1} dot={{ r: 2.5, fill: "#1e4d3a", strokeWidth: 0 }} activeDot={{ r: 5, fill: "#C9A84C", stroke: "#fff", strokeWidth: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Review Queue Pie Chart */}
          <div className="dashboard-card p-5 md:p-6">
            <div className="flex items-center justify-between gap-3 mb-3">
              <div>
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-[20px]">bar_chart</span>
                  <h2 className="serif-title text-[21px] font-semibold">{t("adminDashboard.charts.queue")}</h2>
                </div>
                <p className="text-[11px] text-[#1e4d3a]/55 mt-1">{t("adminDashboard.charts.currentQueue")}</p>
              </div>
            </div>

            <div className="relative h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={queueTypes} dataKey="value" nameKey="name" innerRadius={51} outerRadius={73} paddingAngle={totalQueue ? 3 : 0} strokeWidth={0}>
                    {queueTypes.map((item) => <Cell key={item.name} fill={item.color} className="transition-all duration-300 hover:opacity-80" />)}
                  </Pie>
                  <Tooltip contentStyle={ChartTooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center">
                  <div className="metric-number text-[25px] font-semibold">{totalQueue.toLocaleString()}</div>
                  <div className="mono-label text-[7px] uppercase text-[#1e4d3a]/45">{t("adminDashboard.charts.total")}</div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-x-5 gap-y-3 mt-2">
              {queueTypes.map((item) => (
                <div key={item.name} className="flex items-center gap-2 group cursor-default">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0 group-hover:scale-125 transition-transform" style={{ backgroundColor: item.color }} />
                  <span className="text-[10px] text-[#1e4d3a]/70 truncate group-hover:text-[#1e4d3a] transition-colors">{item.name}</span>
                  <span className="ml-auto font-['JetBrains_Mono'] text-[10px] font-semibold">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

       {/* SECOND ROW - NOW 3 COLUMNS */}
<section className="grid grid-cols-1 lg:grid-cols-[1fr_1fr_1fr] gap-5 mb-6">
  {/* Top Disciplines */}
  <div className="dashboard-card p-5 md:p-6">
    <div className="flex items-center gap-2.5 mb-4">
      <span className="material-symbols-outlined text-[20px]">category</span>
      <div>
        <h2 className="serif-title text-[21px] font-semibold">{t("adminDashboard.charts.topDisciplines")}</h2>
        <p className="text-[11px] text-[#1e4d3a]/55 mt-0.5">{t("adminDashboard.charts.rankedByVolume")}</p>
      </div>
    </div>

    {topDisciplines.length === 0 ? (
      <p className="text-[12px] text-[#1e4d3a]/55 text-center py-8">{t("adminDashboard.empty.data")}</p>
    ) : (
      <div dir="ltr">
        <ResponsiveContainer width="100%" height={230}>
          <BarChart layout="vertical" data={topDisciplines} margin={{ left: 8, right: 12, top: 5, bottom: 5 }}>
            <CartesianGrid strokeDasharray="2 3" stroke="rgba(30,77,58,0.10)" horizontal={false} />
            <XAxis type="number" tick={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fill: "#1e4d3a99" }} axisLine={false} tickLine={false} allowDecimals={false} />
            <YAxis type="category" dataKey="name" tick={renderDisciplineTick} axisLine={false} tickLine={false} width={125} interval={0} />
            <Tooltip cursor={{ fill: "rgba(30,77,58,0.035)" }} contentStyle={ChartTooltipStyle} />
            <Bar dataKey="count" radius={[0, 5, 5, 0]} barSize={17} activeBar={{ fill: '#C9A84C' }}>
              {topDisciplines.map((item, index) => (
                <Cell key={`${item.name ?? "discipline"}-${index}`} fill={ACCENT_CYCLE[index % ACCENT_CYCLE.length]} className="hover:opacity-80 transition-opacity" />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    )}
  </div>

  {/* Moderation & Progress */}
  <div className="dashboard-card p-5 md:p-6">
    <div className="flex items-center gap-2.5 mb-5">
      <span className="material-symbols-outlined text-[20px] text-[#e96d5c]">shield</span>
      <div>
        <h2 className="serif-title text-[21px] font-semibold">{t("adminDashboard.moderation.title")}</h2>
        <p className="text-[11px] text-[#1e4d3a]/55 mt-0.5">{t("adminDashboard.moderation.subtitle")}</p>
      </div>
    </div>

    <div className="grid grid-cols-2 gap-3 mb-6">
      <div className="p-3 rounded-lg bg-[#e96d5c]/[0.08] border border-[#e96d5c]/20">
        <div className="flex items-center gap-2 mb-1">
          <span className="material-symbols-outlined text-[16px] text-[#e96d5c]">flag</span>
          <span className="text-[10px] uppercase font-bold text-[#e96d5c] mono-label">{t("adminDashboard.moderation.urgentReports")}</span>
        </div>
        <div className="metric-number text-[24px] font-semibold text-[#082f27]">{urgentMetrics?.pendingReports ?? 0}</div>
      </div>

      <div className="p-3 rounded-lg bg-[#7a5c8e]/[0.08] border border-[#7a5c8e]/20">
        <div className="flex items-center gap-2 mb-1">
          <span className="material-symbols-outlined text-[16px] text-[#7a5c8e]">gavel</span>
          <span className="text-[10px] uppercase font-bold text-[#7a5c8e] mono-label">{t("adminDashboard.moderation.highStrike")}</span>
        </div>
        <div className="metric-number text-[24px] font-semibold text-[#082f27]">{urgentMetrics?.highStrikeUsers ?? 0}</div>
      </div>
    </div>

    <div className="border-t border-[#1e4d3a]/10 pt-4">
      <p className="text-[10px] uppercase font-semibold text-[#1e4d3a]/60 mono-label mb-3">{t("adminDashboard.moderation.sixMonthTrend")}</p>
      
      <ResponsiveContainer width="100%" height={160}>
        <BarChart data={translatedForumGrowth.length > 0 ? translatedForumGrowth : [{ name: t('common.noData'), posts: 0 }]} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="2 3" stroke="rgba(30,77,58,0.10)" vertical={false} />
          <XAxis dataKey="name" tick={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fill: "#1e4d3a99" }} axisLine={false} tickLine={false} dy={5} />
          <YAxis tick={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fill: "#1e4d3a99" }} axisLine={false} tickLine={false} dx={-5} />
          <Tooltip contentStyle={ChartTooltipStyle} cursor={{ fill: "rgba(30,77,58,0.035)" }} />
          <Bar dataKey="posts" fill="#C9A84C" radius={[4, 4, 0, 0]} barSize={20} activeBar={{ fill: '#1e4d3a' }} />
        </BarChart>
      </ResponsiveContainer>
      
      <div className="flex items-center justify-center gap-4 mt-3">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#C9A84C]" />
          <span className="text-[9px] text-[#1e4d3a]/60 font-semibold">{t("adminDashboard.moderation.legend.forum")}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#e96d5c]" />
          <span className="text-[9px] text-[#1e4d3a]/60 font-semibold">{t("adminDashboard.moderation.legend.reports")}</span>
        </div>
      </div>
    </div>
  </div>

  {/* ✅ NEW: Performance Overview (Platform Health) */}
  <div className="dashboard-card p-5 md:p-6">
    <div className="flex items-center gap-2.5 mb-5">
      <span className="material-symbols-outlined text-[20px]">target</span>
      <div>
        <h2 className="serif-title text-[21px] font-semibold">{t("adminDashboard.performance.title")}</h2>
        <p className="text-[11px] text-[#1e4d3a]/55 mt-0.5">{t("adminDashboard.performance.subtitle")}</p>
      </div>
    </div>

    <div className="space-y-6">
      {[
        { label: t("adminDashboard.performance.totalUsers"), val: summary.totalUsers ?? 0, pct: 100, color: "#1e4d3a" },
        { label: t("adminDashboard.performance.approvalRate"), val: `${approvalRate}%`, pct: approvalRate, color: "#C9A84C" },
        { label: t("adminDashboard.performance.openReports"), val: summary.openReports ?? 0, pct: Math.min((summary.openReports ?? 0) * 10, 100), color: "#e96d5c" },
        { label: t("adminDashboard.performance.hiddenPosts"), val: summary.hiddenForumPosts ?? 0, pct: Math.min(((summary.hiddenForumPosts ?? 0) / (summary.totalForumPosts ?? 1)) * 100, 100), color: "#7a5c8e" },
      ].map((item) => (
        <div key={item.label}>
          <div className="flex justify-between items-center mb-2">
            <span className="text-[11px] text-[#1e4d3a]/75">{item.label}</span>
            <span className="font-['JetBrains_Mono'] text-[11px] font-semibold" style={{ color: item.color }}>
              {item.val}
            </span>
          </div>

          <div className="w-full h-2 bg-[#1e4d3a]/[0.08] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${item.pct}%`, backgroundColor: item.color }}
            />
          </div>
        </div>
      ))}
    </div>

    <div className="mt-7 pt-4 border-t border-[#1e4d3a]/10 flex items-center justify-between">
      <span className="mono-label text-[8px] uppercase text-[#1e4d3a]/45">{t("adminDashboard.performance.systemStatus")}</span>
      <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-[#2f7d74]">
        <span className="w-1.5 h-1.5 rounded-full bg-[#2f7d74]" />
        {t("adminDashboard.performance.operational")}
      </span>
    </div>
  </div>
</section>
        {/* BOTTOM DATA */}
        <section className="grid grid-cols-1 lg:grid-cols-[1.35fr_1fr_0.95fr] gap-5">
          {/* Latest Events */}
          <div className="dashboard-card p-5 md:p-6 min-h-[330px]">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-[20px]">history</span>
                <div>
                  <h2 className="serif-title text-[20px] font-semibold">{t("adminDashboard.events.latest")}</h2>
                  <p className="text-[10px] text-[#1e4d3a]/55 mt-0.5">{t("adminDashboard.events.recent")}</p>
                </div>
              </div>

              {totalActivityPages > 1 && (
                <div className="flex items-center gap-2">
                  <button type="button" disabled={currentPage === 0} onClick={() => setActivityPage((page) => Math.max(0, page - 1))} className="w-7 h-7 rounded-full border border-[#1e4d3a]/10 text-[#1e4d3a]/55 disabled:opacity-30 hover:bg-[#1e4d3a]/10 hover:text-[#1e4d3a] transition-colors cursor-pointer">{isRTL ? '›' : '‹'}</button>
                  <span className="font-['JetBrains_Mono'] text-[9px] text-[#1e4d3a]/55">{currentPage + 1}/{totalActivityPages}</span>
                  <button type="button" disabled={currentPage === totalActivityPages - 1} onClick={() => setActivityPage((page) => Math.min(totalActivityPages - 1, page + 1))} className="w-7 h-7 rounded-full border border-[#1e4d3a]/10 text-[#1e4d3a]/55 disabled:opacity-30 hover:bg-[#1e4d3a]/10 hover:text-[#1e4d3a] transition-colors cursor-pointer">{isRTL ? '‹' : '›'}</button>
                </div>
              )}
            </div>

            <div className="divide-y divide-[#1e4d3a]/[0.08]">
              {pagedActivity.slice(0, 5).length > 0 ? (
                pagedActivity.slice(0, 5).map((event, index) => {
                  const dateLocale = isRTL ? "ar-SA" : lang === "French" || lang === "fr" ? "fr-FR" : "en-US";
                  return (
                    <div key={`${event.date ?? "event"}-${index}`} className="flex items-center gap-3 py-3">
                      <div className="w-8 h-8 rounded-full bg-[#1e4d3a]/[0.07] flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-[16px] text-[#1e4d3a]">
                          {event.type === "scholar" ? "school" : event.type === "user" ? "person" : event.type === "forum" ? "forum" : event.type === "report" ? "flag" : "folder_open"}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-semibold truncate">{event.text}</p>
                        <p className="text-[9px] text-[#1e4d3a]/50 mt-0.5">
                          by {event.user} • {event.date ? new Date(event.date).toLocaleDateString(dateLocale) : "—"}
                        </p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-[12px] text-[#1e4d3a]/55 text-center py-8">{t("adminDashboard.empty.recent")}</p>
              )}
            </div>
          </div>

          {/* Top Contributors */}
          <div className="dashboard-card p-5 md:p-6 min-h-[330px]">
            <div className="flex items-center gap-2.5 mb-4">
              <span className="material-symbols-outlined text-[20px] text-[#C9A84C]" style={{ fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}>emoji_events</span>
              <div>
                <h2 className="serif-title text-[20px] font-semibold">{t("adminDashboard.contributors.top")}</h2>
                <p className="text-[10px] text-[#1e4d3a]/55 mt-0.5">{t("adminDashboard.contributors.mostActive")}</p>
              </div>
            </div>

            <div className="divide-y divide-[#1e4d3a]/[0.08]">
              {topContributors.length > 0 ? (
                topContributors.slice(0, 5).map((user, index) => {
                  const medalColors = ["#C9A84C", "#9AA5B1", "#B08D57", "#2f7d74", "#1e4d3a"];
                  const rankColor = medalColors[index] ?? "#1e4d3a";
                  return (
                    <div key={`${user.name ?? "user"}-${index}`} className="flex items-center justify-between py-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="w-7 h-7 rounded-full flex items-center justify-center text-[#fbf9f4] font-['JetBrains_Mono'] text-[9px] font-bold shrink-0" style={{ backgroundColor: rankColor }}>{index + 1}</span>
                        <span className="text-[11px] font-semibold truncate">{user.name ?? "—"}</span>
                      </div>
                      <span className="font-['JetBrains_Mono'] text-[10px] font-bold ml-3" style={{ color: rankColor }}>{user.count ?? 0}</span>
                    </div>
                  );
                })
              ) : (
                <p className="text-[12px] text-[#1e4d3a]/55 text-center py-8">{t("adminDashboard.empty.data")}</p>
              )}
            </div>
          </div>

          {/* Languages */}
          <div className="dashboard-card p-5 md:p-6 min-h-[330px]">
            <div className="flex items-center gap-2.5 mb-4">
              <span className="material-symbols-outlined text-[20px]">translate</span>
              <div>
                <h2 className="serif-title text-[20px] font-semibold">{t("adminDashboard.languages.title")}</h2>
                <p className="text-[10px] text-[#1e4d3a]/55 mt-0.5">{t("adminDashboard.languages.distribution")}</p>
              </div>
            </div>

            {languageBreakdown.length === 0 ? (
              <p className="text-[12px] text-[#1e4d3a]/55 text-center py-8">{t("adminDashboard.empty.languages")}</p>
            ) : (
              <div className="space-y-5 pt-2">
                {[...languageBreakdown].sort((a, b) => (b.value ?? 0) - (a.value ?? 0)).map((langItem, index) => {
                  const pct = totalLangCount ? Math.round(((langItem.value ?? 0) / totalLangCount) * 100) : 0;
                  const color = index === 0 ? "#1e4d3a" : ACCENT_CYCLE[index % ACCENT_CYCLE.length];
                  const name = getLanguageName(langItem.name || '');

                  return (
                    <div key={`${langItem.name ?? "language"}-${index}`} className="group cursor-default">
                      <div className="flex justify-between items-center mb-1.5 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform">
                        <span className="text-[11px] font-semibold">{name}</span>
                        <span className="font-['JetBrains_Mono'] text-[10px] font-bold" style={{ color }}>
                          {langItem.value ?? 0} <span className="text-[#1e4d3a]/40 font-normal">({pct}%)</span>
                        </span>
                      </div>
                      <div className="w-full h-2 bg-[#1e4d3a]/[0.08] rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-700 group-hover:brightness-110" style={{ width: `${pct}%`, backgroundColor: color }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}