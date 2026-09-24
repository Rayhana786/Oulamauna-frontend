import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useLang } from "../../context/LanguageContext";
import { adminApi, ScholarSummary } from "../../api/adminApi";

export default function AllScholars() {
  const { lang, t } = useLang();
  const navigate = useNavigate();
  const isRTL = lang === "AR";
  const [searchParams, setSearchParams] = useSearchParams();

  const initialTab = (searchParams.get("tab") as "all" | "approved" | "rejected") || "all";
  const initialSearch = searchParams.get("q") || "";
  const initialPage = parseInt(searchParams.get("page") || "1", 10);
  const initialSort = (searchParams.get("sort") as "name_asc" | "name_desc" | "date_desc" | "date_asc") || "date_desc";

  const [scholars, setScholars] = useState<ScholarSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [activeTab, setActiveTab] = useState<"all" | "approved" | "rejected">(initialTab);
  const [search, setSearch] = useState(initialSearch);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [sortBy, setSortBy] = useState<"name_asc" | "name_desc" | "date_desc" | "date_asc">(initialSort);
  
  const [modalScholar, setModalScholar] = useState<ScholarSummary | null>(null);
  const [modalLangFilter, setModalLangFilter] = useState<string>("ALL");
  const [modalStatusFilter, setModalStatusFilter] = useState<"ALL" | "approved" | "rejected" | "superseded">("ALL");

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    if (activeTab !== "all") params.set("tab", activeTab);
    if (search) params.set("q", search);
    if (currentPage > 1) params.set("page", currentPage.toString());
    if (sortBy !== "date_desc") params.set("sort", sortBy);
    
    const currentParams = new URLSearchParams(searchParams);
    if (params.toString() !== currentParams.toString()) {
      setSearchParams(params, { replace: true });
    }
  }, [activeTab, search, currentPage, sortBy, searchParams, setSearchParams]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const response = await adminApi.scholars.getAllSummary();
      if (response.data?.success && response.data.data) {
        setScholars(response.data.data as ScholarSummary[]);
      }
    } catch (error) { 
      console.error("Failed to fetch scholars:", error); 
    } finally { 
      setIsLoading(false); 
    }
  };

  const handleToggleFeature = async (scholarId: string, currentStatus: boolean) => {
    setScholars(prev => prev.map(s => s.scholarId === scholarId ? { ...s, isFeatured: !currentStatus } : s));
    try {
      const res = await adminApi.scholars.toggleFeature(parseInt(scholarId));
      if (!res.data?.success) {
        setScholars(prev => prev.map(s => s.scholarId === scholarId ? { ...s, isFeatured: currentStatus } : s));
      }
    } catch (e) {
      setScholars(prev => prev.map(s => s.scholarId === scholarId ? { ...s, isFeatured: currentStatus } : s));
    }
  };

  // ✅ COMBINED FILTERING & SORTING LOGIC
  const filteredAndSortedScholars = useMemo(() => {
    let result = [...scholars]; // Create a copy to sort
    
    // 1. Filter by Tab
    if (activeTab === "approved") result = result.filter(s => s.counts.approved > 0);
    else if (activeTab === "rejected") result = result.filter(s => s.counts.approved === 0 && s.counts.rejected > 0);
    
    // 2. Filter by Search
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(s => 
        s.primaryVersion?.canonical_name?.toLowerCase().includes(q) || 
        s.scholarId.includes(q)
      );
    }

    // 3. Sort
    result.sort((a, b) => {
      const nameA = a.primaryVersion?.canonical_name || "";
      const nameB = b.primaryVersion?.canonical_name || "";
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();

      if (sortBy === "name_asc") return nameA.localeCompare(nameB);
      if (sortBy === "name_desc") return nameB.localeCompare(nameA);
      if (sortBy === "date_desc") return dateB - dateA; // Newest first
      if (sortBy === "date_asc") return dateA - dateB;  // Oldest first
      return 0;
    });

    return result;
  }, [scholars, activeTab, search, sortBy]);

  const ITEMS_PER_PAGE = 10;
  const totalPages = Math.ceil(filteredAndSortedScholars.length / ITEMS_PER_PAGE) || 1;

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) setCurrentPage(totalPages);
  }, [totalPages, currentPage]);

  const paginatedScholars = useMemo(() => {
    return filteredAndSortedScholars.slice(
      (currentPage - 1) * ITEMS_PER_PAGE,
      currentPage * ITEMS_PER_PAGE
    );
  }, [filteredAndSortedScholars, currentPage]);

  // ✅ DYNAMIC LANGUAGE FILTER: Extracts ONLY the languages that exist for this scholar
  const availableLangs = useMemo(() => {
    if (!modalScholar) return ["ALL"];
    const langs = new Set(modalScholar.versions.map(v => v.language_code.toUpperCase()));
    return ["ALL", ...Array.from(langs)];
  }, [modalScholar]);

  const modalVersions = useMemo(() => {
    if (!modalScholar) return [];
    let filtered = modalScholar.versions;
    if (modalLangFilter !== "ALL") filtered = filtered.filter(v => v.language_code.toUpperCase() === modalLangFilter);
    if (modalStatusFilter !== "ALL") filtered = filtered.filter(v => v.status === modalStatusFilter);
    return filtered.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
  }, [modalScholar, modalLangFilter, modalStatusFilter]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fbf9f4]">
        <span className="material-symbols-outlined text-[40px] text-[#1e4d3a]/40 animate-pulse">hourglass_empty</span>
      </div>
    );
  }

  const renderPagination = () => {
    if (totalPages <= 1) return null;
    const pages: (number | string)[] = [];
    const maxVisible = 5;
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);
    if (end - start + 1 < maxVisible) start = Math.max(1, end - maxVisible + 1);

    if (start > 1) {
      pages.push(1);
      if (start > 2) pages.push("...");
    }
    for (let i = start; i <= end; i++) pages.push(i);
    if (end < totalPages) {
      if (end < totalPages - 1) pages.push("...");
      pages.push(totalPages);
    }

    return (
      <div className="flex items-center justify-center gap-2 mt-8">
        <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}
          className="w-9 h-9 flex items-center justify-center rounded-lg border border-[#1e4d3a]/20 text-[#1e4d3a] disabled:opacity-30 hover:bg-[#1e4d3a]/5 transition-colors cursor-pointer">
          <span className="material-symbols-outlined text-[18px]">{isRTL ? "arrow_forward" : "arrow_back"}</span>
        </button>
        {pages.map((page, idx) =>
          page === "..." ? (
            <span key={`ellipsis-${idx}`} className="text-[#1e4d3a]/40 text-[12px] px-1">...</span>
          ) : (
            <button key={page} onClick={() => setCurrentPage(page as number)}
              className={`w-9 h-9 flex items-center justify-center rounded-lg text-[12px] font-bold transition-all cursor-pointer ${
                currentPage === page ? "bg-[#1e4d3a] text-white shadow-md" : "bg-white text-[#1e4d3a] border border-[#1e4d3a]/10 hover:bg-[#1e4d3a]/5"
              }`}>
              {page}
            </button>
          )
        )}
        <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
          className="w-9 h-9 flex items-center justify-center rounded-lg border border-[#1e4d3a]/20 text-[#1e4d3a] disabled:opacity-30 hover:bg-[#1e4d3a]/5 transition-colors cursor-pointer">
          <span className="material-symbols-outlined text-[18px]">{isRTL ? "arrow_back" : "arrow_forward"}</span>
        </button>
      </div>
    );
  };

  return (
    <div className="oulamauna-dashboard min-h-screen text-[#1e4d3a] antialiased font-['Inter']" dir={isRTL ? "rtl" : "ltr"}>
      <style>{`
        .oulamauna-dashboard { background: radial-gradient(circle at 8% 10%, rgba(201,168,76,0.055), transparent 24%), radial-gradient(circle at 92% 16%, rgba(79,145,132,0.06), transparent 25%), #fbf9f4; }
        .oulamauna-dashboard .dashboard-card { background: rgba(251,249,244,0.96); border: 1px solid rgba(30,77,58,0.10); border-radius: 10px; box-shadow: 0 5px 18px rgba(30,77,58,0.055); transition: all 180ms ease; }
        .oulamauna-dashboard .dashboard-card:hover { box-shadow: 0 9px 26px rgba(30,77,58,0.08); }
        .oulamauna-dashboard .serif-title { font-family: 'Source Serif 4', Georgia, serif; letter-spacing: -0.025em; }
        .oulamauna-dashboard .mono-label { font-family: 'JetBrains Mono', monospace; letter-spacing: 0.06em; }
      `}</style>

      <main className="max-w-[1450px] mx-auto px-3 md:px-5 xl:px-7 py-6 md:py-8">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <div className="mono-label text-[9px] uppercase font-bold text-[#C9A84C] mb-1">{t("admin.sidebar.allScholars")}</div>
            <h1 className="serif-title text-[27px] md:text-[32px] leading-tight font-semibold text-[#082f27]">{t("admin.allScholars.title")}</h1>
          </div>
        </header>

        {/* Tabs, Search & Sort */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 flex-1">
            <div className="flex items-center gap-1 bg-[#1e4d3a]/[0.05] border border-[#1e4d3a]/10 rounded-full p-1">
              {(["all", "approved", "rejected"] as const).map((tab) => (
                <button key={tab} onClick={() => { setActiveTab(tab); setCurrentPage(1); }}
                  className={`px-4 py-2 rounded-full text-[11px] font-bold uppercase tracking-wide transition-all duration-300 cursor-pointer ${
                    activeTab === tab ? "bg-[#1e4d3a] text-white shadow-md" : "bg-white text-[#1e4d3a] hover:bg-[#1e4d3a]/5"
                  }`}>
                  {t(`admin.allScholars.tabs.${tab}`)}
                </button>
              ))}
            </div>
            
            <select 
  value={sortBy} 
  onChange={(e) => { setSortBy(e.target.value as any); setCurrentPage(1); }}
  className="px-4 py-2 rounded-lg bg-white border border-[#1e4d3a]/10 text-[#1e4d3a] text-[12px] font-bold outline-none cursor-pointer hover:bg-[#1e4d3a]/5 transition-colors"
>
  <option value="date_desc">{t("admin.allScholars.sort.newestToOldest")}</option>
  <option value="date_asc">{t("admin.allScholars.sort.oldestToNewest")}</option>
  <option value="name_asc">{t("admin.allScholars.sort.nameAZ")}</option>
  <option value="name_desc">{t("admin.allScholars.sort.nameZA")}</option>
</select>
          </div>

          <div className="dashboard-card flex items-center gap-3 px-4 py-2.5 w-full sm:w-80">
            <span className="material-symbols-outlined text-[#1e4d3a]/50 text-[20px]">search</span>
            <input 
              value={search} 
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }} 
              placeholder={t("admin.allScholars.searchPlaceholder")} 
              className="flex-1 bg-transparent border-none outline-none text-[13px] text-[#1e4d3a] placeholder-[#1e4d3a]/40" 
            />
          </div>
        </div>

        {/* Scholars List */}
        <div className="space-y-4">
          {paginatedScholars.map((scholar) => {
            const isLive = scholar.counts.approved > 0;
            const badgeColor = isLive ? "#1e4d3a" : (scholar.counts.pending > 0 ? "#C9A84C" : "#e96d5c");
            const badgeText = isLive ? t("admin.allScholars.badges.live") : (scholar.counts.pending > 0 ? t("admin.allScholars.badges.pendingOnly") : t("admin.allScholars.badges.rejectedOnly"));

            return (
              <div key={scholar.scholarId} className="dashboard-card p-4 md:p-5 flex flex-col md:flex-row md:items-center gap-4 md:gap-6">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="w-14 h-14 rounded-full overflow-hidden bg-[#f6efdc] border-2 border-[#1e4d3a]/20 flex-shrink-0 flex items-center justify-center">
                    {scholar.primaryVersion?.image_url ? (
                      <img src={scholar.primaryVersion.image_url} alt={scholar.primaryVersion.canonical_name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="material-symbols-outlined text-[28px] text-[#1e4d3a]/40">account_circle</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h3 className="serif-title text-[18px] md:text-[20px] font-semibold text-[#082f27] truncate">
                        {scholar.primaryVersion?.canonical_name || t("common.unknown")}
                      </h3>
                      <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider text-white" style={{ backgroundColor: badgeColor }}>
                        {badgeText}
                      </span>
                      {isLive && scholar.isFeatured && <span className="material-symbols-outlined text-[#C9A84C] text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>}
                    </div>
                    <div className="mono-label text-[10px] text-[#1e4d3a]/60">
                      ID: {scholar.scholarId} • {t("common.user")}: {scholar.createdBy} • {new Date(scholar.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                  <button
                    onClick={() => {
                      if (scholar.counts.total === 1) {
                        const singleVersion = scholar.versions[0];
                        navigate(`/admin/scholars/${singleVersion.version_id}/${singleVersion.language_code.toLowerCase()}`);
                      } else {
                        setModalScholar(scholar);
                        setModalLangFilter("ALL");
                        setModalStatusFilter("ALL");
                      }
                    }}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#1e4d3a]/5 text-[#1e4d3a] border border-[#1e4d3a]/10 hover:bg-[#1e4d3a] hover:text-white transition-all cursor-pointer"
                  >
                    {scholar.counts.total === 1 ? (
                      <><span className="material-symbols-outlined text-[18px]">visibility</span><span className="text-[11px] font-bold uppercase tracking-wide">{t("admin.allScholars.actions.viewDetails")}</span></>
                    ) : (
                      <><span className="material-symbols-outlined text-[18px]">history</span><span className="text-[11px] font-bold uppercase tracking-wide">{t("admin.allScholars.actions.versions")}</span><span className="mono-label text-[10px] bg-white/20 px-1.5 py-0.5 rounded-full">{scholar.counts.total}</span></>
                    )}
                  </button>
                  {isLive && (
                    <button onClick={() => handleToggleFeature(scholar.scholarId, scholar.isFeatured)}
                      className={`w-12 h-12 rounded-full flex items-center justify-center border transition-all duration-200 cursor-pointer flex-shrink-0 ${
                        scholar.isFeatured ? "bg-[#C9A84C]/10 border-[#C9A84C] text-[#C9A84C]" : "bg-transparent border-[#1e4d3a]/20 text-[#1e4d3a]/40 hover:bg-[#C9A84C]/10 hover:border-[#C9A84C] hover:text-[#C9A84C]"
                      }`}>
                      <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: `'FILL' ${scholar.isFeatured ? 1 : 0}` }}>
                        {scholar.isFeatured ? "star" : "star_border"}
                      </span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {paginatedScholars.length === 0 && (
            <div className="dashboard-card p-12 text-center">
              <span className="material-symbols-outlined text-[40px] text-[#1e4d3a]/20 mb-3">search_off</span>
              <p className="text-[14px] text-[#1e4d3a]/60">{t("admin.allScholars.empty")}</p>
            </div>
          )}
        </div>

        {renderPagination()}
      </main>

      {/* VERSIONS MODAL */}
      {modalScholar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#082f27]/60 backdrop-blur-sm" onClick={() => setModalScholar(null)}>
          <div className="bg-[#fbf9f4] rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col border border-[#1e4d3a]/10" onClick={(e) => e.stopPropagation()} dir={isRTL ? "rtl" : "ltr"}>
            <div className="flex items-center justify-between p-5 border-b border-[#1e4d3a]/10 bg-white">
              <div>
                <h2 className="serif-title text-[20px] font-semibold text-[#082f27]">{modalScholar.primaryVersion?.canonical_name}</h2>
                <p className="mono-label text-[10px] text-[#1e4d3a]/60 mt-1">{t("admin.allScholars.modal.subtitle")}</p>
              </div>
              <button onClick={() => setModalScholar(null)} className="w-8 h-8 rounded-full hover:bg-[#1e4d3a]/10 flex items-center justify-center transition-colors cursor-pointer">
                <span className="material-symbols-outlined text-[#1e4d3a]">close</span>
              </button>
            </div>

            <div className="px-5 pt-4 pb-3 bg-white border-b border-[#1e4d3a]/5 space-y-3">
              {/* ✅ DYNAMIC LANGUAGE FILTER */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="mono-label text-[9px] uppercase font-bold text-[#1e4d3a]/50 w-16">Lang:</span>
                {availableLangs.map((code) => (
                  <button key={code} onClick={() => setModalLangFilter(code)}
                    className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase transition-all cursor-pointer ${
                      modalLangFilter === code ? "bg-[#1e4d3a] text-white" : "bg-[#1e4d3a]/5 text-[#1e4d3a] hover:bg-[#1e4d3a]/10"
                    }`}>
                    {code}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="mono-label text-[9px] uppercase font-bold text-[#1e4d3a]/50 w-16">Status:</span>
                {(["ALL", "approved", "rejected", "superseded"] as const).map((status) => (
                  <button key={status} onClick={() => setModalStatusFilter(status)}
                    className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase transition-all cursor-pointer ${
                      modalStatusFilter === status ? "bg-[#C9A84C] text-white" : "bg-[#1e4d3a]/5 text-[#1e4d3a] hover:bg-[#1e4d3a]/10"
                    }`}>
                    {status === "ALL" ? "ALL" : t(`dashboard.status.${status}`)}
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-y-auto p-5 space-y-3">
              {modalVersions.length > 0 ? modalVersions.map((version) => {
                const statusColor = version.status === "approved" ? "bg-[#1e4d3a] text-white" : version.status === "rejected" ? "bg-[#e96d5c] text-white" : "bg-gray-400 text-white";
                const statusLabel = t(`dashboard.status.${version.status}`) || version.status;

                return (
                  <div key={version.version_id} className="flex items-center justify-between p-4 rounded-lg bg-white border border-[#1e4d3a]/10 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-[#f6efdc] flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {version.image_url ? <img src={version.image_url} alt="" className="w-full h-full object-cover" /> : <span className="material-symbols-outlined text-[#1e4d3a]/40 text-[20px]">account_circle</span>}
                      </div>
                      <div className="min-w-0">
                        <div className="text-[14px] font-semibold text-[#082f27] truncate">{version.canonical_name}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="mono-label text-[10px] text-[#1e4d3a]/60">v{version.version_id}</span>
                          <span className="mono-label text-[10px] text-[#1e4d3a]/60">•</span>
                          <span className="mono-label text-[10px] text-[#1e4d3a]/60 font-bold">{version.language_code.toUpperCase()}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${statusColor}`}>{statusLabel}</span>
                        </div>
                      </div>
                    </div>
                    <button onClick={() => { setModalScholar(null); navigate(`/admin/scholars/${version.version_id}/${version.language_code.toLowerCase()}`); }}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-md bg-[#1e4d3a]/5 text-[#1e4d3a] text-[11px] font-bold hover:bg-[#1e4d3a] hover:text-white transition-all flex-shrink-0 cursor-pointer">
                      <span className="material-symbols-outlined text-[14px]">visibility</span>
                      {t("admin.allScholars.modal.viewDetails")}
                    </button>
                  </div>
                );
              }) : (
                <div className="text-center py-8 text-[#1e4d3a]/50 text-[13px]">{t("admin.allScholars.modal.noVersionsForLang")}</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}