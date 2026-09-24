import React, { useState, useEffect, useMemo, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { adminApi, Report } from "../../api/adminApi";
import { useLang } from "../../context/LanguageContext";

export default function AdminReports() {
  const { lang, t } = useLang();
  const isRTL = lang === "AR";
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const highlightId = searchParams.get("highlight");

  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  // ✅ Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const response = await adminApi.reports.getPending();
      setReports(response.data?.data || []);
    } catch (error) {
      console.error("Failed to fetch reports:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (reportId: number, action: "dismiss" | "delete_and_strike") => {
    const msg = action === "dismiss" 
      ? (t("admin.reports.confirm.dismiss") || "Are you sure you want to dismiss this report?")
      : (t("admin.reports.confirm.deleteStrike") || "Are you sure you want to delete this content and add a strike?");
      
    if (!window.confirm(msg)) return;

    try {
      setActionLoading(reportId);
      await adminApi.reports.resolve(reportId, action);
      await fetchReports();
    } catch (error) {
      console.error("Failed to resolve report:", error);
      alert(t("admin.reports.errors.processFailed") || "Failed to process report. Please try again.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleBanUser = async (userId: number, username: string) => {
    const msg = (t("admin.reports.confirm.banUser") || "WARNING: Are you sure you want to BAN user {username}?").replace("{username}", username);
    if (!window.confirm(msg)) return;

    try {
      await adminApi.users.ban(userId);
      alert((t("admin.reports.success.userBanned") || "User {username} has been banned successfully.").replace("{username}", username));
      await fetchReports();
    } catch (error) {
      console.error("Failed to ban user:", error);
      alert(t("admin.reports.errors.banFailed") || "Failed to ban user. Please try again.");
    }
  };

  // Group reports by content
  const groupedReports = useMemo(() => {
    const groups: Record<string, any> = {};
    reports.forEach(report => {
      const key = `${report.content_type}_${report.content_id}`;
      if (!groups[key]) {
        groups[key] = {
          ...report,
          reporters: [report.users],
          reasons: [report.reason],
          report_ids: [report.report_id]
        };
      } else {
        groups[key].reporters.push(report.users);
        groups[key].reasons.push(report.reason);
        groups[key].report_ids.push(report.report_id);
      }
    });
    return Object.values(groups);
  }, [reports]);

  // ✅ Pagination Logic
  const totalPages = Math.ceil(groupedReports.length / ITEMS_PER_PAGE);
  const paginatedReports = groupedReports.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fbf9f4]">
        <span className="material-symbols-outlined text-[40px] text-[#1e4d3a]/40 animate-pulse">hourglass_empty</span>
      </div>
    );
  }

  return (
    <div className="oulamauna-dashboard min-h-screen text-[#1e4d3a] antialiased font-['Inter']" dir={isRTL ? "rtl" : "ltr"}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&family=Source+Serif+4:wght@400;500;600;700&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap');
        .oulamauna-dashboard { background: radial-gradient(circle at 8% 10%, rgba(201,168,76,0.055), transparent 24%), radial-gradient(circle at 92% 16%, rgba(79,145,132,0.06), transparent 25%), #fbf9f4; }
        .oulamauna-dashboard * { box-sizing: border-box; }
        .oulamauna-dashboard .serif-title { font-family: 'Source Serif 4', Georgia, serif; letter-spacing: -0.025em; }
        .oulamauna-dashboard .mono-label { font-family: 'JetBrains Mono', monospace; letter-spacing: 0.06em; }
        .oulamauna-dashboard .dashboard-card { background: rgba(251,249,244,0.96); border: 1px solid rgba(30,77,58,0.10); border-radius: 10px; box-shadow: 0 5px 18px rgba(30,77,58,0.055); transition: all 250ms ease; }
        .oulamauna-dashboard .dashboard-card:hover { box-shadow: 0 9px 26px rgba(30,77,58,0.08); }
        .oulamauna-dashboard ::selection { background: #C9A84C; color: #1e4d3a; }
      `}</style>

      <main className="max-w-[1450px] mx-auto px-3 md:px-5 xl:px-7 py-6 md:py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="serif-title text-[27px] md:text-[32px] leading-tight font-semibold text-[#082f27] flex items-center gap-3">
            <span className="material-symbols-outlined text-[32px] text-[#e96d5c]" style={{ fontVariationSettings: "'FILL' 1" }}>flag</span>
            {t("admin.reports.title") || "Moderation Queue"}
          </h1>
          <p className="text-[12px] text-[#1e4d3a]/60 mt-1 ms-11">
            {t("admin.reports.subtitle") || "Review and resolve community reports"}
          </p>
        </div>

        {/* Empty State */}
        {groupedReports.length === 0 ? (
          <div className="dashboard-card p-12 text-center border-2 border-dashed border-[#C9A84C]/30 bg-[#f6efdc]/30">
            <span className="material-symbols-outlined text-[56px] text-[#1e4d3a]/30 mb-4 block" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
            <h2 className="serif-title text-[22px] font-bold text-[#082f27] mb-2">
              {t("admin.reports.allClear") || "All Clear!"}
            </h2>
            <p className="text-[14px] text-[#1e4d3a]/70">
              {t("admin.reports.allClearDesc") || "No pending reports to review."}
            </p>
          </div>
        ) : (
          <>
            {/* Reports List */}
            <div className="flex flex-col gap-5 mb-8">
              {paginatedReports.map((group: any) => (
                <GroupedReportCard 
                  key={group.report_ids[0]} 
                  group={group} 
                  highlightId={highlightId}
                  onResolve={handleResolve}
                  onBanUser={handleBanUser}
                  actionLoading={actionLoading}
                  isRTL={isRTL}
                  t={t}
                />
              ))}
            </div>

            {/* ✅ PAGINATION FOOTER */}
            {totalPages > 1 && (
              <div className="dashboard-card flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-5 py-4">
                <div className="text-[11px] text-[#1e4d3a]/60 mono-label">
                  {t("admin.common.showing") || "Showing"} {(currentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, groupedReports.length)} {t("admin.common.of") || "of"} {groupedReports.length}
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1} className="flex items-center justify-center w-8 h-8 rounded-[6px] border border-[#1e4d3a]/20 text-[#1e4d3a] disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#1e4d3a] hover:text-white transition-colors cursor-pointer">
                    <span className="material-symbols-outlined text-[18px]">{isRTL ? 'arrow_forward' : 'arrow_back'}</span>
                  </button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) pageNum = i + 1;
                    else if (currentPage <= 3) pageNum = i + 1;
                    else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                    else pageNum = currentPage - 2 + i;
                    return (
                      <button key={pageNum} onClick={() => setCurrentPage(pageNum)} className={`w-8 h-8 rounded-[6px] text-[11px] font-bold mono-label transition-colors cursor-pointer ${currentPage === pageNum ? 'bg-[#1e4d3a] text-white' : 'border border-[#1e4d3a]/20 text-[#1e4d3a] hover:bg-[#1e4d3a]/10'}`}>
                        {pageNum}
                      </button>
                    );
                  })}
                  <button onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages} className="flex items-center justify-center w-8 h-8 rounded-[6px] border border-[#1e4d3a]/20 text-[#1e4d3a] disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#1e4d3a] hover:text-white transition-colors cursor-pointer">
                    <span className="material-symbols-outlined text-[18px]">{isRTL ? 'arrow_back' : 'arrow_forward'}</span>
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Grouped Report Card Component                                     */
/* ------------------------------------------------------------------ */

interface GroupedReportCardProps {
  group: any;
  highlightId: string | null;
  onResolve: (reportId: number, action: "dismiss" | "delete_and_strike") => void;
  onBanUser: (userId: number, username: string) => void;
  actionLoading: number | null;
  isRTL: boolean;
  t: (key: string) => string;
}

const GroupedReportCard: React.FC<GroupedReportCardProps> = ({ group, highlightId, onResolve, onBanUser, actionLoading, isRTL, t }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const isHighlighted = String(group.content_id) === highlightId;

  useEffect(() => {
    if (isHighlighted && cardRef.current) {
      setTimeout(() => {
        cardRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 100);
    }
  }, [isHighlighted]);

  const isPost = group.content_type === "forum_post" || group.content_type === "post";
  const contentText = isPost 
    ? group.content?.title || "Untitled Post"
    : group.content?.content?.substring(0, 150) + (group.content?.content?.length > 150 ? "..." : "") || "No content";

  const strikeCount = group.author?.strike_count || 0;
  const isHighRisk = strikeCount >= 3;

  const uniqueReasons = [...new Set(group.reasons.filter(Boolean))].join(", ");
  const reporterNames = group.reporters.map((r: any) => r?.username || "Anonymous").join(", ");
  
  const isActionLoading = actionLoading !== null;

  return (
    <div 
      ref={cardRef}
      className={`dashboard-card p-6 transition-all duration-300 ${
        isHighlighted ? "border-2 border-[#C9A84C] bg-[#C9A84C]/[0.03] shadow-[0_0_25px_rgba(201,168,76,0.15)]" : "hover:border-[#1e4d3a]/20"
      }`}
    >
      {/* Header */}
      <div className={`flex justify-between items-start mb-5 gap-4 ${isRTL ? "flex-row-reverse" : ""}`}>
        <div className="flex items-center gap-3 flex-wrap">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full mono-label text-[10px] font-bold ${
            isPost ? "bg-[#1e4d3a]/10 text-[#1e4d3a]" : "bg-[#C9A84C]/10 text-[#C9A84C]"
          }`}>
            <span className="material-symbols-outlined text-[13px]">{isPost ? 'article' : 'chat_bubble'}</span>
            {isPost ? (t("admin.reports.type.post") || "Post") : (t("admin.reports.type.comment") || "Comment")} • {(t("admin.reports.reportedTimes") || "Reported {count} time(s)").replace("{count}", group.report_ids.length)}
          </span>
          <span className="text-[12px] text-[#1e4d3a]/70">
            <span className="font-semibold">{t("admin.reports.reportedBy") || "By:"}</span> {reporterNames}
          </span>
        </div>
        <span className="text-[11px] text-[#1e4d3a]/50 mono-label whitespace-nowrap">
          {new Date(group.created_at).toLocaleDateString()}
        </span>
      </div>

      {/* Reason & Content */}
      <div className={`bg-[#f6efdc]/50 p-4 rounded-lg mb-5 border-l-4 border-[#C9A84C] ${isRTL ? "border-l-0 border-r-4" : ""}`}>
        <p className="mono-label text-[10px] font-bold text-[#C9A84C] uppercase mb-2">
          {t("admin.reports.reasons") || "Reasons:"} <span className="text-[#1e4d3a]/80 normal-case tracking-normal font-medium">{uniqueReasons || (t("admin.reports.notSpecified") || "Not specified")}</span>
        </p>
        <p className="text-[13px] text-[#1e4d3a]/85 leading-relaxed">
          <span className="font-semibold text-[#082f27]">{t("admin.reports.content") || "Content:"}</span> "{contentText}"
        </p>
      </div>

      {/* Author Info */}
      <div className={`flex items-center gap-4 mb-6 p-3 bg-[#1e4d3a]/[0.02] rounded-lg border border-[#1e4d3a]/5 flex-wrap ${isRTL ? "flex-row-reverse" : ""}`}>
        <span className="text-[13px] font-semibold text-[#1e4d3a] flex items-center gap-2">
          <span className="material-symbols-outlined text-[16px]">person</span>
          {t("admin.reports.author") || "Author:"} <span className="text-[#082f27]">{group.author?.username || (t("admin.reports.deletedUser") || "Deleted User")}</span>
        </span>
        
        <span className={`px-2.5 py-1 rounded-full mono-label text-[10px] font-bold border ${
          isHighRisk 
            ? "bg-[#e96d5c]/10 text-[#e96d5c] border-[#e96d5c]/20" 
            : "bg-[#1e4d3a]/5 text-[#1e4d3a] border-[#1e4d3a]/10"
        }`}>
          {isHighRisk && <span className="material-symbols-outlined text-[11px] align-middle mr-1" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>}
          {t("admin.reports.strikes") || "Strikes:"} {strikeCount}
        </span>

        {group.author?.is_banned && (
          <span className="px-2.5 py-1 rounded-full mono-label text-[10px] font-bold bg-[#e96d5c] text-white flex items-center gap-1">
             <span className="material-symbols-outlined text-[11px]" style={{ fontVariationSettings: "'FILL' 1" }}>block</span>
             {t("admin.reports.status.banned") || "BANNED"}
          </span>
        )}
      </div>

      {/* Actions */}
      <div className={`flex gap-3 flex-wrap items-center ${isRTL ? "flex-row-reverse" : ""}`}>
        <Link
          to={`/admin/discussions?postId=${isPost ? group.content_id : group.content?.post_id}`}
          className="flex items-center gap-2 px-4 py-2 rounded-[6px] bg-[#1e4d3a] text-white text-[12px] font-bold uppercase tracking-wide hover:bg-[#1e4d3a]/90 transition-colors"
        >
          <span className="material-symbols-outlined text-[15px]">visibility</span>
          {t("admin.reports.actions.viewContext") || "View Context"}
        </Link>

        <div className={`w-px h-6 bg-[#1e4d3a]/10 mx-1 ${isRTL ? "order-last" : ""}`} />

        <button
          onClick={() => onResolve(group.report_ids[0], "dismiss")}
          disabled={isActionLoading}
          className="flex items-center gap-2 px-4 py-2 rounded-[6px] border border-[#1e4d3a] text-[#1e4d3a] text-[12px] font-bold uppercase tracking-wide hover:bg-[#1e4d3a] hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          <span className="material-symbols-outlined text-[15px]">check_circle</span>
          {t("admin.reports.actions.dismiss") || "Dismiss"}
        </button>

        <button
          onClick={() => onResolve(group.report_ids[0], "delete_and_strike")}
          disabled={isActionLoading}
          className="flex items-center gap-2 px-4 py-2 rounded-[6px] border border-[#e96d5c] text-[#e96d5c] text-[12px] font-bold uppercase tracking-wide hover:bg-[#e96d5c] hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          <span className="material-symbols-outlined text-[15px]">delete</span>
          {t("admin.reports.actions.deleteStrike") || "Delete & Strike"}
        </button>

        {group.author?.id && !group.author?.is_banned && (
          <button
            onClick={() => onBanUser(group.author.id, group.author.username || "User")}
            disabled={isActionLoading}
            className={`flex items-center gap-2 px-4 py-2 rounded-[6px] bg-[#e96d5c] border border-[#e96d5c] text-white text-[12px] font-bold uppercase tracking-wide hover:bg-[#e96d5c]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${isRTL ? "mr-auto" : "ml-auto"}`}
          >
             <span className="material-symbols-outlined text-[15px]" style={{ fontVariationSettings: "'FILL' 1" }}>block</span>
             {t("admin.reports.actions.banUser") || "Ban User"}
          </button>
        )}
      </div>
    </div>
  );
};