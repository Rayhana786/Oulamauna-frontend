import React, { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useLang } from "../../context/LanguageContext";
import { adminApi } from "../../api/adminApi";

type SortOption = "newest" | "oldest" | "name";

interface ScholarSubmission {
  id: string;
  name: string;
  language: string;
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

const transformVersions = (versions: BackendScholarVersion[], dbLanguages: any[]): ScholarSubmission[] => {
  return versions.map((v) => {
    const langCode = v.languages?.code || "unknown";
    let disciplineNames: string[] = [];
    if (v.scholar_disciplines) {
      disciplineNames = v.scholar_disciplines.map((sd) => sd.disciplines?.name).filter(Boolean) as string[];
    }
    const discipline = disciplineNames.length > 0 ? disciplineNames.join(", ") : "Pending Review";

    return {
      id: v.version_id.toString(),
      name: v.canonical_name,
      language: langCode,
      submittedBy: v.users?.username || "Unknown",
      contributorId: v.created_by ? `user_${v.created_by}` : "system",
      date: new Date(v.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      discipline: discipline,
      submittedAt: new Date(v.created_at),
    };
  });
};

export default function NewScholarsQueue() {
  const navigate = useNavigate();
  const { lang, t, dbLanguages } = useLang();
  const isRTL = lang === "AR" || lang === "ar";

  const [filterLanguage, setFilterLanguage] = useState<string>("all");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [rows, setRows] = useState<ScholarSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal States
  const [restrictTarget, setRestrictTarget] = useState<ScholarSubmission | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ type: 'revoke' | 'ban', scholar: ScholarSubmission } | null>(null);
  const [approveTarget, setApproveTarget] = useState<ScholarSubmission | null>(null);
  const [approveReason, setApproveReason] = useState("");
  const [rejectTarget, setRejectTarget] = useState<ScholarSubmission | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 15;

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [submissionsRes] = await Promise.all([adminApi.scholars.getPendingCreated()]);
        if (submissionsRes.data?.success && submissionsRes.data.data) {
          setRows(transformVersions(submissionsRes.data.data, dbLanguages));
        }
      } catch (error) {
        console.error("Failed to fetch pending scholars:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [dbLanguages]);

  const uniqueLanguages = useMemo(() => {
    const codes = Array.from(new Set(rows.map(r => r.language).filter(Boolean)));
    return codes.map(code => {
      const found = dbLanguages.find((l: any) => l.code.toLowerCase() === code.toLowerCase());
      return { code, name: found ? found.name : code.toUpperCase() };
    });
  }, [rows, dbLanguages]);

  const filtered = useMemo(() => {
    let result = [...rows];
    if (filterLanguage !== "all") {
      result = result.filter((s) => s.language.toLowerCase() === filterLanguage.toLowerCase());
    }
    
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

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginatedRows = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [filterLanguage, sortBy]);

  const goToReview = (s: ScholarSubmission) => {
    navigate(`/admin/pending/scholars/${s.id}?lang=${s.language}`);
  };

  const handleApprove = async (id: string) => {
    try {
      await adminApi.scholars.approve(Number(id), { reason: approveReason || "Approved" });
      setRows((prev) => prev.filter((r) => r.id !== id));
      setApproveTarget(null);
      setApproveReason("");
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

  const executeRestrictionAndReject = async () => {
    if (!confirmAction) return;
    try {
      const { type, scholar } = confirmAction;
      const userIdStr = scholar.contributorId.replace('user_', '');
      const userId = parseInt(userIdStr, 10);
      const scholarId = Number(scholar.id);

      if (isNaN(userId)) {
        alert("Cannot restrict system-generated submissions.");
        setConfirmAction(null);
        setRestrictTarget(null);
        return;
      }

      if (type === 'revoke') {
        await adminApi.users.toggleContribute(userId);
      } else {
        await adminApi.users.ban(userId);
      }

      const defaultReason = type === 'ban' ? "Contributor banned" : "Contribution access revoked";
      await adminApi.scholars.reject(scholarId, defaultReason);

      setRows((prev) => prev.filter((row) => row.id !== scholar.id));
      setConfirmAction(null);
      setRestrictTarget(null);
    } catch (err) {
      console.error("Action failed:", err);
      alert("Failed to process action. Please try again.");
    }
  };

  const clearFilters = () => {
    setFilterLanguage("all");
    setSortBy("newest");
  };

  const hasActiveFilters = filterLanguage !== "all" || sortBy !== "newest";

  const getLangName = (code: string) => {
    const found = dbLanguages.find((l: any) => l.code.toLowerCase() === code.toLowerCase());
    return found ? found.name : code.toUpperCase();
  };

  if (isLoading) {
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
        .oulamauna-dashboard .dashboard-card { background: rgba(251,249,244,0.96); border: 1px solid rgba(30,77,58,0.10); border-radius: 10px; box-shadow: 0 5px 18px rgba(30,77,58,0.055); transition: box-shadow 180ms ease; }
        .oulamauna-dashboard .dashboard-card:hover { box-shadow: 0 9px 26px rgba(30,77,58,0.08); }
        .oulamauna-dashboard ::selection { background: #C9A84C; color: #1e4d3a; }
      `}</style>

      <main className="max-w-[1450px] mx-auto px-3 md:px-5 xl:px-7 py-6 md:py-8">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <div className="mono-label text-[9px] uppercase font-bold text-[#C9A84C] mb-1">{t("adminDashboard.title")}</div>
            <h1 className="serif-title text-[27px] md:text-[32px] leading-tight font-semibold text-[#082f27]">{t("admin.scholars.new.title") || "New Scholars Queue"}</h1>
            <p className="text-[12px] text-[#1e4d3a]/60 mt-1">{t("admin.scholars.new.subtitle") || "Review newly submitted scholar profiles before they go live on the archive."}</p>
          </div>
        </header>

        <div className="dashboard-card p-4 mb-6">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="flex flex-1 flex-wrap gap-4">
              <div className="flex-1 min-w-[150px]">
                <label className="mono-label text-[9px] uppercase font-bold text-[#1e4d3a]/60 mb-1.5 block">{t("admin.common.language") || "Language"}</label>
                <select value={filterLanguage} onChange={(e) => setFilterLanguage(e.target.value)} className="w-full bg-[#fbf9f4] border border-[#1e4d3a]/15 rounded-[6px] px-3 py-2 text-[12px] font-medium text-[#1e4d3a] focus:outline-none focus:ring-2 focus:ring-[#1e4d3a]/20">
                  <option value="all">{t("admin.common.all") || "All"}</option>
                  {uniqueLanguages.map(l => <option key={l.code} value={l.code}>{l.name}</option>)}
                </select>
              </div>
              <div className="flex-1 min-w-[150px]">
                <label className="mono-label text-[9px] uppercase font-bold text-[#1e4d3a]/60 mb-1.5 block">{t("admin.common.sortBy") || "Sort By"}</label>
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value as SortOption)} className="w-full bg-[#fbf9f4] border border-[#1e4d3a]/15 rounded-[6px] px-3 py-2 text-[12px] font-medium text-[#1e4d3a] focus:outline-none focus:ring-2 focus:ring-[#1e4d3a]/20">
                  <option value="newest">{t("admin.common.newestFirst") || "Newest First"}</option>
                  <option value="oldest">{t("admin.common.oldestFirst") || "Oldest First"}</option>
                  <option value="name">{t("admin.common.nameAZ") || "Name (A-Z)"}</option>
                </select>
              </div>
            </div>
            {hasActiveFilters && (
              <button onClick={clearFilters} className="flex items-center gap-1.5 px-3 py-2 rounded-[6px] border border-[#e96d5c] text-[#e96d5c] text-[11px] font-bold uppercase tracking-wide hover:bg-[#e96d5c]/5 transition-colors mt-5 md:mt-0 self-end md:self-auto cursor-pointer">
                <span className="material-symbols-outlined text-[14px]">close</span>
                {t("admin.common.clear") || "Clear"}
              </button>
            )}
          </div>
        </div>

        <div className="dashboard-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#1e4d3a]/10 bg-[#1e4d3a]/[0.02]">
                  <th className="mono-label text-[9px] uppercase font-bold text-[#1e4d3a]/60 px-5 py-3.5">{t("admin.scholars.new.table.scholar") || "Scholar"}</th>
                  <th className="mono-label text-[9px] uppercase font-bold text-[#1e4d3a]/60 px-5 py-3.5">{t("admin.scholars.new.table.submitter") || "Submitter"}</th>
                  <th className="mono-label text-[9px] uppercase font-bold text-[#1e4d3a]/60 px-5 py-3.5">{t("admin.scholars.new.table.submitted") || "Submitted"}</th>
                  <th className="mono-label text-[9px] uppercase font-bold text-[#1e4d3a]/60 px-5 py-3.5 text-right">{t("admin.scholars.new.table.actions") || "Actions"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e4d3a]/[0.06]">
                {paginatedRows.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-5 py-12 text-center text-[12px] text-[#1e4d3a]/50">
                      <span className="material-symbols-outlined text-[40px] mb-2 block mx-auto">inbox</span>
                      {t("admin.scholars.new.empty") || "No submissions found matching your filters."}
                    </td>
                  </tr>
                ) : (
                  paginatedRows.map((s) => {
                    const langColor = s.language.toLowerCase() === 'ar' ? "#C9A84C" : s.language.toLowerCase() === 'fr' ? "#3d6b96" : "#1e4d3a";
                    return (
                      <tr key={s.id} className="hover:bg-[#1e4d3a]/[0.015] transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-[#1e4d3a]/[0.05] border border-[#1e4d3a]/10 flex items-center justify-center text-[#1e4d3a] font-['Source_Serif_4'] font-bold text-[14px] flex-shrink-0">
                              {s.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="text-[13px] font-semibold text-[#082f27]">{s.name}</p>
                              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#fbf9f4] border border-[#1e4d3a]/10 mt-1">
                                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: langColor }} />
                                <span className="mono-label text-[9px] text-[#1e4d3a]/70">{getLangName(s.language)}</span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-[#C9A84C]/10 border border-[#C9A84C]/20 flex items-center justify-center text-[#C9A84C] font-['Source_Serif_4'] font-bold text-[10px] flex-shrink-0">
                              {s.submittedBy.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase()}
                            </div>
                            <span className="text-[12px] font-medium text-[#1e4d3a]">{s.submittedBy}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 mono-label text-[11px] text-[#1e4d3a]/70">{s.date}</td>
                        <td className="px-5 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button onClick={(e) => { e.stopPropagation(); goToReview(s); }} title="Review"
                              className="w-8 h-8 flex items-center justify-center rounded-[6px] border border-[#1e4d3a]/20 text-[#1e4d3a] hover:bg-[#1e4d3a] hover:text-white transition-colors cursor-pointer">
                              <span className="material-symbols-outlined text-[18px]">visibility</span>
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); setApproveTarget(s); }} title="Approve"
                              className="w-8 h-8 flex items-center justify-center rounded-[6px] bg-[#1e4d3a] border border-[#1e4d3a] text-white hover:bg-[#1e4d3a]/90 transition-colors cursor-pointer">
                              <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1, 'wght' 400" }}>check</span>
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); setRejectTarget(s); }} title="Reject"
                              className="w-8 h-8 flex items-center justify-center rounded-[6px] border border-[#e96d5c] text-[#e96d5c] hover:bg-[#e96d5c] hover:text-white transition-colors cursor-pointer">
                              <span className="material-symbols-outlined text-[18px]">close</span>
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); setRestrictTarget(s); }} title="Restrict User & Reject"
                              className="w-8 h-8 flex items-center justify-center rounded-[6px] border border-[#C9A84C] text-[#C9A84C] hover:bg-[#C9A84C] hover:text-white transition-colors cursor-pointer">
                              <span className="material-symbols-outlined text-[18px]">shield_person</span>
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

          {/* Pagination Footer */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-4 border-t border-[#1e4d3a]/10 bg-[#1e4d3a]/[0.01]">
              <div className="text-[11px] text-[#1e4d3a]/60 mono-label">
                {t("admin.common.showing") || "Showing"} {(currentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)} {t("admin.common.of") || "of"} {filtered.length}
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1}
                  className="flex items-center justify-center w-8 h-8 rounded-[6px] border border-[#1e4d3a]/20 text-[#1e4d3a] disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#1e4d3a] hover:text-white transition-colors cursor-pointer">
                  <span className="material-symbols-outlined text-[18px]">{isRTL ? 'arrow_forward' : 'arrow_back'}</span>
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) pageNum = i + 1;
                  else if (currentPage <= 3) pageNum = i + 1;
                  else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                  else pageNum = currentPage - 2 + i;
                  return (
                    <button key={pageNum} onClick={() => setCurrentPage(pageNum)}
                      className={`w-8 h-8 rounded-[6px] text-[11px] font-bold mono-label transition-colors cursor-pointer ${currentPage === pageNum ? 'bg-[#1e4d3a] text-white' : 'border border-[#1e4d3a]/20 text-[#1e4d3a] hover:bg-[#1e4d3a]/10'}`}>
                      {pageNum}
                    </button>
                  );
                })}
                <button onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages}
                  className="flex items-center justify-center w-8 h-8 rounded-[6px] border border-[#1e4d3a]/20 text-[#1e4d3a] disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#1e4d3a] hover:text-white transition-colors cursor-pointer">
                  <span className="material-symbols-outlined text-[18px]">{isRTL ? 'arrow_back' : 'arrow_forward'}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── Modals ── */}
        {restrictTarget && !confirmAction && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#082f27]/40 backdrop-blur-sm" onClick={() => setRestrictTarget(null)}>
            <div className="dashboard-card w-full max-w-lg p-6 relative" onClick={(e) => e.stopPropagation()}>
              <button onClick={() => setRestrictTarget(null)} className={`absolute top-4 ${isRTL ? 'left-4' : 'right-4'} p-1.5 rounded-full hover:bg-[#1e4d3a]/10 transition-colors cursor-pointer`}>
                <span className="material-symbols-outlined text-[20px] text-[#1e4d3a]">close</span>
              </button>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-full bg-[#C9A84C]/10 border border-[#C9A84C]/20 flex items-center justify-center text-[#C9A84C] font-['Source_Serif_4'] font-bold text-[20px] flex-shrink-0">
                  {restrictTarget.submittedBy.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase()}
                </div>
                <div>
                  <h3 className="serif-title text-[20px] font-semibold text-[#082f27]">{t("admin.scholars.new.modal.restrict.title") || "Restrict User"}</h3>
                  <p className="text-[12px] text-[#1e4d3a]/60 mt-1">{restrictTarget.submittedBy} submitted "{restrictTarget.name}"</p>
                </div>
              </div>
              <p className="text-[13px] text-[#1e4d3a]/80 leading-relaxed mb-6">
                {t("admin.scholars.new.modal.restrict.desc") || "Choose an action. This will automatically reject this scholar submission as well."}
              </p>
              <div className="space-y-3 mb-6">
                <button onClick={() => setConfirmAction({ type: 'revoke', scholar: restrictTarget })}
                  className="w-full flex items-start gap-4 p-4 rounded-[8px] border border-[#C9A84C]/30 bg-[#C9A84C]/[0.05] hover:bg-[#C9A84C]/10 transition-colors cursor-pointer text-left">
                  <div className="w-8 h-8 rounded-full bg-[#C9A84C] text-white flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="material-symbols-outlined text-[18px]">person_off</span>
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold text-[#082f27] mb-1">{t("admin.scholars.new.modal.restrict.revoke") || "Revoke Contribution Access"}</p>
                    <p className="text-[11px] text-[#1e4d3a]/60 leading-relaxed">{t("admin.scholars.new.modal.restrict.revokeDesc") || "They can still log in, but cannot submit new content. (Recommended for low-quality submissions)"}</p>
                  </div>
                </button>
                <button onClick={() => setConfirmAction({ type: 'ban', scholar: restrictTarget })}
                  className="w-full flex items-start gap-4 p-4 rounded-[8px] border border-[#e96d5c]/30 bg-[#e96d5c]/[0.05] hover:bg-[#e96d5c]/10 transition-colors cursor-pointer text-left">
                  <div className="w-8 h-8 rounded-full bg-[#e96d5c] text-white flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="material-symbols-outlined text-[18px]">block</span>
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold text-[#082f27] mb-1">{t("admin.scholars.new.modal.restrict.ban") || "Ban Account Completely"}</p>
                    <p className="text-[11px] text-[#1e4d3a]/60 leading-relaxed">{t("admin.scholars.new.modal.restrict.banDesc") || "They will be completely locked out of the platform. (Use for spam, abuse, or severe violations)"}</p>
                  </div>
                </button>
              </div>
              <div className="flex justify-end">
                <button onClick={() => setRestrictTarget(null)} className="px-5 py-2 rounded-[6px] border border-[#1e4d3a]/20 text-[#1e4d3a] text-[12px] font-bold uppercase tracking-wide hover:bg-[#1e4d3a]/5 transition-colors cursor-pointer">
                  {t("admin.common.cancel") || "Cancel"}
                </button>
              </div>
            </div>
          </div>
        )}

        {confirmAction && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#082f27]/40 backdrop-blur-sm" onClick={() => setConfirmAction(null)}>
            <div className="dashboard-card w-full max-w-md p-6 relative" onClick={(e) => e.stopPropagation()}>
              <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-5 ${confirmAction.type === 'ban' ? 'bg-[#e96d5c] text-white' : 'bg-[#C9A84C] text-white'}`}>
                <span className="material-symbols-outlined text-[28px]" style={{ fontVariationSettings: "'FILL' 1, 'wght' 400" }}>
                  {confirmAction.type === 'ban' ? "block" : "person_off"}
                </span>
              </div>
              <h3 className="serif-title text-[20px] font-semibold text-[#082f27] mb-3">
                {t("admin.scholars.new.modal.confirm.title") || "Confirm Action"}
              </h3>
              <p className="text-[13px] text-[#1e4d3a]/80 leading-relaxed mb-6">
                {t("admin.scholars.new.modal.confirm.desc") || "This will"} <strong>{confirmAction.type === 'ban' ? (t("admin.scholars.new.modal.confirm.ban") || "BAN") : (t("admin.scholars.new.modal.confirm.revoke") || "REVOKE CONTRIBUTION ACCESS FOR")}</strong> {confirmAction.scholar.submittedBy} {t("admin.scholars.new.modal.confirm.andReject") || "and automatically REJECT the scholar"} "{confirmAction.scholar.name}".
                <br/><br/>
                <strong className="text-[#e96d5c]">{t("admin.scholars.new.modal.confirm.warning") || "This action cannot be undone from this screen."}</strong>
              </p>
              <div className="flex gap-3 justify-end">
                <button onClick={() => setConfirmAction(null)} className="px-5 py-2 rounded-[6px] border border-[#1e4d3a]/20 text-[#1e4d3a] text-[12px] font-bold uppercase tracking-wide hover:bg-[#1e4d3a]/5 transition-colors cursor-pointer">
                  {t("admin.common.goBack") || "Go Back"}
                </button>
                <button onClick={executeRestrictionAndReject} className={`px-5 py-2 rounded-[6px] text-white text-[12px] font-bold uppercase tracking-wide transition-colors cursor-pointer ${confirmAction.type === 'ban' ? 'bg-[#e96d5c] hover:bg-[#e96d5c]/90' : 'bg-[#C9A84C] hover:bg-[#C9A84C]/90'}`}>
                  {t("admin.scholars.new.modal.confirm.button") || "Confirm & Reject"}
                </button>
              </div>
            </div>
          </div>
        )}

        {approveTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#082f27]/40 backdrop-blur-sm" onClick={() => { setApproveTarget(null); setApproveReason(""); }}>
            <div className="dashboard-card w-full max-w-lg p-6 relative" onClick={(e) => e.stopPropagation()}>
              <button onClick={() => { setApproveTarget(null); setApproveReason(""); }} className={`absolute top-4 ${isRTL ? 'left-4' : 'right-4'} p-1.5 rounded-full hover:bg-[#1e4d3a]/10 transition-colors cursor-pointer`}>
                <span className="material-symbols-outlined text-[20px] text-[#1e4d3a]">close</span>
              </button>
              <div className="w-14 h-14 rounded-full bg-[#1e4d3a] text-white flex items-center justify-center mb-5">
                <span className="material-symbols-outlined text-[28px]" style={{ fontVariationSettings: "'FILL' 1, 'wght' 400" }}>check_circle</span>
              </div>
              <h3 className="serif-title text-[20px] font-semibold text-[#082f27] mb-4">{t("admin.scholars.new.modal.approve.title") || "Approve Scholar?"}</h3>
              <div className="bg-[#1e4d3a]/[0.03] p-4 rounded-[8px] mb-5 space-y-2">
                <p className="text-[14px] font-semibold text-[#082f27]">{approveTarget.name}</p>
                <p className="text-[12px] text-[#1e4d3a]/70"><strong>{t("admin.common.language") || "Language"}:</strong> {getLangName(approveTarget.language)}</p>
                <p className="text-[12px] text-[#1e4d3a]/70"><strong>{t("admin.scholars.new.table.submitter") || "Submitted by"}:</strong> {approveTarget.submittedBy}</p>
                <p className="text-[12px] text-[#1e4d3a]/70"><strong>{t("admin.scholars.new.table.submitted") || "Date"}:</strong> {approveTarget.date}</p>
                <p className="text-[12px] text-[#1e4d3a]/70"><strong>{t("admin.scholars.new.table.discipline") || "Discipline"}:</strong> {approveTarget.discipline}</p>
              </div>
              <div className="mb-6">
                <label className="mono-label text-[9px] uppercase font-bold text-[#1e4d3a]/60 mb-1.5 block">{t("admin.scholars.new.modal.approve.notes") || "Approval Notes (Optional)"}</label>
                <textarea 
                  value={approveReason} 
                  onChange={(e) => setApproveReason(e.target.value)}
                  placeholder={t("admin.scholars.new.modal.approve.notesPlaceholder") || "Add any notes about this approval..."}
                  className="w-full bg-[#fbf9f4] border border-[#1e4d3a]/15 rounded-[6px] px-3 py-2 text-[12px] font-medium text-[#1e4d3a] focus:outline-none focus:ring-2 focus:ring-[#1e4d3a]/20 min-h-[80px] resize-y"
                />
              </div>
              <div className="flex gap-3 justify-end">
                <button onClick={() => { setApproveTarget(null); setApproveReason(""); }} className="px-5 py-2 rounded-[6px] border border-[#1e4d3a]/20 text-[#1e4d3a] text-[12px] font-bold uppercase tracking-wide hover:bg-[#1e4d3a]/5 transition-colors cursor-pointer">
                  {t("admin.common.cancel") || "Cancel"}
                </button>
                <button onClick={() => handleApprove(approveTarget.id)} className="px-5 py-2 rounded-[6px] bg-[#1e4d3a] text-white text-[12px] font-bold uppercase tracking-wide hover:bg-[#1e4d3a]/90 transition-colors cursor-pointer">
                  {t("admin.scholars.new.modal.approve.confirm") || "Confirm Approval"}
                </button>
              </div>
            </div>
          </div>
        )}

        {rejectTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#082f27]/40 backdrop-blur-sm" onClick={() => { setRejectTarget(null); setRejectReason(""); }}>
            <div className="dashboard-card w-full max-w-lg p-6 relative" onClick={(e) => e.stopPropagation()}>
              <button onClick={() => { setRejectTarget(null); setRejectReason(""); }} className={`absolute top-4 ${isRTL ? 'left-4' : 'right-4'} p-1.5 rounded-full hover:bg-[#1e4d3a]/10 transition-colors cursor-pointer`}>
                <span className="material-symbols-outlined text-[20px] text-[#1e4d3a]">close</span>
              </button>
              <div className="w-14 h-14 rounded-full bg-[#e96d5c] text-white flex items-center justify-center mb-5">
                <span className="material-symbols-outlined text-[28px]" style={{ fontVariationSettings: "'FILL' 1, 'wght' 400" }}>cancel</span>
              </div>
              <h3 className="serif-title text-[20px] font-semibold text-[#082f27] mb-4">{t("admin.scholars.new.modal.reject.title") || "Reject Scholar?"}</h3>
              <div className="bg-[#1e4d3a]/[0.03] p-4 rounded-[8px] mb-5 space-y-2">
                <p className="text-[14px] font-semibold text-[#082f27]">{rejectTarget.name}</p>
                <p className="text-[12px] text-[#1e4d3a]/70"><strong>{t("admin.common.language") || "Language"}:</strong> {getLangName(rejectTarget.language)}</p>
                <p className="text-[12px] text-[#1e4d3a]/70"><strong>{t("admin.scholars.new.table.submitter") || "Submitted by"}:</strong> {rejectTarget.submittedBy}</p>
                <p className="text-[12px] text-[#1e4d3a]/70"><strong>{t("admin.scholars.new.table.submitted") || "Date"}:</strong> {rejectTarget.date}</p>
                <p className="text-[12px] text-[#1e4d3a]/70"><strong>{t("admin.scholars.new.table.discipline") || "Discipline"}:</strong> {rejectTarget.discipline}</p>
              </div>
              <div className="mb-6">
                <label className="mono-label text-[9px] uppercase font-bold text-[#1e4d3a]/60 mb-1.5 block">{t("admin.scholars.new.modal.reject.reason") || "Rejection Reason *"}</label>
                <textarea 
                  value={rejectReason} 
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder={t("admin.scholars.new.modal.reject.reasonPlaceholder") || "Please explain why this submission is being rejected..."}
                  className="w-full bg-[#fbf9f4] border border-[#1e4d3a]/15 rounded-[6px] px-3 py-2 text-[12px] font-medium text-[#1e4d3a] focus:outline-none focus:ring-2 focus:ring-[#1e4d3a]/20 min-h-[80px] resize-y"
                />
              </div>
              <div className="flex gap-3 justify-end">
                <button onClick={() => { setRejectTarget(null); setRejectReason(""); }} className="px-5 py-2 rounded-[6px] border border-[#1e4d3a]/20 text-[#1e4d3a] text-[12px] font-bold uppercase tracking-wide hover:bg-[#1e4d3a]/5 transition-colors cursor-pointer">
                  {t("admin.common.cancel") || "Cancel"}
                </button>
                <button onClick={() => handleReject(rejectTarget.id)} className="px-5 py-2 rounded-[6px] bg-[#e96d5c] text-white text-[12px] font-bold uppercase tracking-wide hover:bg-[#e96d5c]/90 transition-colors cursor-pointer">
                  {t("admin.scholars.new.modal.reject.confirm") || "Confirm Rejection"}
                </button>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}