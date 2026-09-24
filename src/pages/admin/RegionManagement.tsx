import React, { useState, useEffect, useMemo } from "react";
import { useLang } from "../../context/LanguageContext";

const Icon: React.FC<{ name: string; size?: number; filled?: boolean; style?: React.CSSProperties }> = ({ name, size = 18, filled = false, style }) => (
  <span className="material-symbols-outlined" style={{ fontSize: size, lineHeight: 1, fontVariationSettings: `'FILL' ${filled ? 1 : 0}, 'wght' 400, 'GRAD' 0, 'opsz' 24`, ...style }}>{name}</span>
);

const API_URL = (import.meta as any).env?.VITE_API_URL || "http://localhost:5444";

interface Language { language_id: number; code: string; name: string; }
interface Region { region_id: number; translations: Record<string, string>; created_at: string; }

export default function RegionManagement() {
  const { lang, t } = useLang();
  const isRTL = lang === "AR";
  const currentLangCode = lang.toLowerCase();

  const [languages, setLanguages] = useState<Language[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editData, setEditData] = useState<Record<string, string>>({});

  const ITEMS_PER_PAGE = 10;

  useEffect(() => { fetchLanguages(); }, []);
  useEffect(() => { if (languages.length > 0) fetchRegions(); }, [languages]);

  const fetchLanguages = async () => {
    try {
      const res = await fetch(`${API_URL}/api/languages`, { credentials: "include" });
      const data = await res.json();
      if (data.success) setLanguages(data.data);
    } catch (err) { console.error("Failed to fetch languages", err); }
  };

  const fetchRegions = async () => {
    try {
      const res = await fetch(`${API_URL}/api/region`, { credentials: "include" });
      const data = await res.json();
      if (data.success) {
        const parsed = data.data.map((r: any) => ({
          ...r,
          translations: typeof r.translations === 'string' ? JSON.parse(r.translations) : (r.translations || {})
        }));
        setRegions(parsed);
        setCurrentPage(1);
      }
    } catch (err) { console.error("Failed to fetch regions", err); }
  };

  const resetForm = () => { setFormData({}); setIsFormOpen(false); };

  const handleCreate = async () => {
    // ✅ Only save non-empty translations
    const validTranslations = Object.fromEntries(Object.entries(formData).filter(([_, v]) => v.trim() !== ""));
    if (Object.keys(validTranslations).length === 0) { 
      alert(t("admin.regionManagement.fillAtLeastOne") || "Please fill at least one language."); 
      return; 
    }
    
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/region`, {
        method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
        body: JSON.stringify({ translations: validTranslations })
      });
      if (res.ok) { resetForm(); fetchRegions(); } 
      else { const err = await res.json(); alert(`Error: ${err.message}`); }
    } catch (err) { console.error("Create error:", err); alert(t("admin.regionManagement.errorCreating") || "Error creating region."); } 
    finally { setLoading(false); }
  };

  const startEdit = (item: Region) => { 
    setEditingId(item.region_id); 
    setExpandedId(item.region_id); 
    const fullEditData: Record<string, string> = {};
    languages.forEach(l => { fullEditData[l.code] = item.translations[l.code] || ""; });
    setEditData(fullEditData); 
  };
  
  const cancelEdit = () => { setEditingId(null); setEditData({}); };

  const saveEdit = async (id: number) => {
    const validTranslations = Object.fromEntries(Object.entries(editData).filter(([_, v]) => v.trim() !== ""));
    if (Object.keys(validTranslations).length === 0) { 
      alert(t("admin.regionManagement.nameCannotBeEmpty") || "Name cannot be empty."); 
      return; 
    }
    try {
      const res = await fetch(`${API_URL}/api/admin/region/${id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" }, credentials: "include",
        body: JSON.stringify({ translations: validTranslations })
      });
      if (res.ok) { setEditingId(null); fetchRegions(); } 
      else { const err = await res.json(); alert(`Failed: ${err.message}`); }
    } catch (err) { console.error("Update error:", err); }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm(t("admin.regionManagement.confirmDelete") || "⚠️ WARNING: Deleting this will remove it from assigned scholars. Proceed?")) return;
    try {
      const res = await fetch(`${API_URL}/api/admin/region/${id}`, { method: "DELETE", credentials: "include" });
      if (res.ok) fetchRegions();
      else { const err = await res.json(); alert(`Failed: ${err.message}`); }
    } catch (err) { console.error("Delete error:", err); }
  };

  const getDisplayName = (translations: Record<string, string>) => {
    return translations[currentLangCode] || translations["en"] || translations["ar"] || translations["fr"] || Object.values(translations)[0] || t("common.unnamed") || "Unnamed";
  };

  const filteredRegions = useMemo(() => {
    if (!searchQuery.trim()) return regions;
    const q = searchQuery.toLowerCase();
    return regions.filter(item => Object.values(item.translations).some(val => val.toLowerCase().includes(q)));
  }, [regions, searchQuery]);

  const totalPages = Math.ceil(filteredRegions.length / ITEMS_PER_PAGE) || 1;
  useEffect(() => { if (currentPage > totalPages && totalPages > 0) setCurrentPage(totalPages); }, [totalPages, currentPage]);
  const paginatedRegions = useMemo(() => filteredRegions.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE), [filteredRegions, currentPage]);

  const renderPagination = () => {
    if (totalPages <= 1) return null;
    const pages: (number | string)[] = [];
    let start = Math.max(1, currentPage - 2);
    let end = Math.min(totalPages, start + 4);
    if (end - start + 1 < 5) start = Math.max(1, end - 4);
    if (start > 1) { pages.push(1); if (start > 2) pages.push("..."); }
    for (let i = start; i <= end; i++) pages.push(i);
    if (end < totalPages) { if (end < totalPages - 1) pages.push("..."); pages.push(totalPages); }

    return (
      <div className="flex items-center justify-center gap-2 mt-8">
        <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} className="w-9 h-9 flex items-center justify-center rounded-lg border border-[#1e4d3a]/20 text-[#1e4d3a] disabled:opacity-30 hover:bg-[#1e4d3a]/5 transition-colors cursor-pointer"><Icon name={isRTL ? "arrow_forward" : "arrow_back"} size={18} /></button>
        {pages.map((page, idx) => page === "..." ? <span key={`e-${idx}`} className="text-[#1e4d3a]/40 text-[12px] px-1">...</span> : (
          <button key={page} onClick={() => setCurrentPage(page as number)} className={`w-9 h-9 flex items-center justify-center rounded-lg text-[12px] font-bold transition-all cursor-pointer ${currentPage === page ? "bg-[#1e4d3a] text-white shadow-md" : "bg-white text-[#1e4d3a] border border-[#1e4d3a]/10 hover:bg-[#1e4d3a]/5"}`}>{page}</button>
        ))}
        <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="w-9 h-9 flex items-center justify-center rounded-lg border border-[#1e4d3a]/20 text-[#1e4d3a] disabled:opacity-30 hover:bg-[#1e4d3a]/5 transition-colors cursor-pointer"><Icon name={isRTL ? "arrow_back" : "arrow_forward"} size={18} /></button>
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
            <div className="mono-label text-[9px] uppercase font-bold text-[#C9A84C] mb-1">{t("admin.sidebar.regions") || "Regions"}</div>
            <h1 className="serif-title text-[27px] md:text-[32px] leading-tight font-semibold text-[#082f27]">{t("admin.regionManagement.title") || "Region Management"}</h1>
          </div>
          <button onClick={() => setIsFormOpen(!isFormOpen)} className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#1e4d3a] text-white hover:bg-[#082f27] transition-all cursor-pointer shadow-sm">
            <Icon name={isFormOpen ? "close" : "add"} size={18} filled /> 
            <span className="text-[12px] font-bold uppercase tracking-wide">{isFormOpen ? (t("admin.regionManagement.closeForm") || "Close Form") : (t("admin.regionManagement.addNew") || "Add Region")}</span>
          </button>
        </header>

        {isFormOpen && (
          <section className="dashboard-card p-6 mb-6">
            <h2 className="serif-title text-[20px] font-semibold text-[#082f27] mb-6">{t("admin.regionManagement.formTitle") || "Add New Region"}</h2>
            
            {/* ✅ Show ALL language fields immediately */}
            <div className="space-y-4 mb-6">
              {languages.map((l) => {
                const isRtl = l.code.toLowerCase() === "ar";
                return (
                  <div key={l.language_id} className="flex items-center gap-4">
                    <span className="w-32 mono-label text-[11px] font-bold text-[#1e4d3a]/70 flex-shrink-0">
                      {l.name} {l.code.toLowerCase() === 'en' ? '*' : ''}
                    </span>
                    <input 
                      type="text" 
                      dir={isRtl ? "rtl" : "ltr"} 
                      value={formData[l.code] || ""} 
                      onChange={(e) => setFormData({ ...formData, [l.code]: e.target.value })} 
                      placeholder={t(`admin.regionManagement.placeholder.${l.code}`) || `Enter ${l.name} name`}
                      className="flex-1 px-3 py-2 rounded-lg border border-[#1e4d3a]/20 bg-white text-[#082f27] outline-none focus:border-[#1e4d3a] text-[13px]" 
                      style={{ textAlign: isRtl ? "right" : "left" }} 
                    />
                  </div>
                );
              })}
            </div>

            <div className="flex items-center gap-3">
              <button onClick={handleCreate} disabled={loading} className="px-6 py-2.5 rounded-lg bg-[#1e4d3a] text-white font-bold text-[12px] uppercase tracking-wide hover:bg-[#082f27] transition-all disabled:opacity-50 cursor-pointer">
                {loading ? (t("admin.regionManagement.creating") || "Creating...") : (t("admin.regionManagement.create") || "Create Region")}
              </button>
              <button onClick={resetForm} className="px-6 py-2.5 rounded-lg bg-transparent border border-[#1e4d3a]/30 text-[#1e4d3a] font-bold text-[12px] uppercase tracking-wide hover:bg-[#1e4d3a]/5 transition-all cursor-pointer">
                {t("admin.regionManagement.cancel") || "Cancel"}
              </button>
            </div>
          </section>
        )}

        <section className="dashboard-card p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <h2 className="serif-title text-[20px] font-semibold text-[#082f27]">{t("admin.regionManagement.allTitle") || "All Regions"} ({filteredRegions.length})</h2>
            <div className="dashboard-card flex items-center gap-3 px-4 py-2.5 w-full md:w-80 flex-shrink-0">
              <Icon name="search" size={20} style={{ color: "rgba(30,77,58,0.5)" }} />
              <input 
                value={searchQuery} 
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }} 
                placeholder={t("admin.regionManagement.searchPlaceholder") || "Search regions..."} 
                className="flex-1 bg-transparent border-none outline-none text-[13px] text-[#1e4d3a] placeholder-[#1e4d3a]/40" 
                dir={isRTL ? "rtl" : "ltr"} 
              />
            </div>
          </div>
          
          {paginatedRegions.length === 0 && (
            <div className="text-center py-12">
              <Icon name="search_off" size={40} style={{ color: "rgba(30,77,58,0.2)", marginBottom: "12px" }} />
              <p className="text-[14px] text-[#1e4d3a]/60">{searchQuery ? (t("common.noResults") || "No results found.") : (t("admin.regionManagement.noFound") || "No regions found.")}</p>
            </div>
          )}

          <div className="space-y-3">
            {paginatedRegions.map((item) => {
              const isEditing = editingId === item.region_id;
              const isExpanded = expandedId === item.region_id;
              const primaryName = getDisplayName(item.translations);
              const langCount = Object.keys(item.translations).length;
              const extraLangs = langCount - 1;

              return (
                <div key={item.region_id} className={`dashboard-card p-5 ${isEditing ? "border-[#1e4d3a]" : ""}`}>
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <h3 className="serif-title text-[18px] md:text-[20px] font-semibold text-[#082f27] truncate">
                        {isEditing ? (
                          <input 
                            autoFocus 
                            value={editData[currentLangCode] || editData["en"] || Object.values(editData)[0] || ""} 
                            onChange={(e) => setEditData({ ...editData, [currentLangCode]: e.target.value })} 
                            className="w-full md:w-96 px-3 py-1.5 rounded border border-[#1e4d3a]/30 bg-white outline-none focus:border-[#1e4d3a]" 
                          />
                        ) : primaryName}
                      </h3>
                      {extraLangs > 0 && !isEditing && (
                        <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider text-white bg-[#C9A84C] flex-shrink-0">
                          +{extraLangs} {t("admin.regionManagement.more") || "more"}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
                      {!isEditing && langCount > 1 && (
                        <button onClick={() => setExpandedId(isExpanded ? null : item.region_id)} className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#1e4d3a]/5 text-[#1e4d3a] border border-[#1e4d3a]/10 hover:bg-[#1e4d3a] hover:text-white transition-all cursor-pointer">
                          <Icon name={isExpanded ? "expand_less" : "expand_more"} size={18} />
                          <span className="text-[11px] font-bold uppercase tracking-wide">{isExpanded ? (t("admin.regionManagement.hide") || "Hide") : (t("admin.regionManagement.show") || "Show")}</span>
                        </button>
                      )}
                      {isEditing ? (
                        <>
                          <button onClick={() => saveEdit(item.region_id)} className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#1e4d3a] text-white hover:bg-[#082f27] transition-all cursor-pointer">
                            <Icon name="check" size={18} filled />
                            <span className="text-[11px] font-bold uppercase tracking-wide">{t("admin.regionManagement.save") || "Save"}</span>
                          </button>
                          <button onClick={cancelEdit} className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-transparent border border-[#1e4d3a]/30 text-[#1e4d3a] hover:bg-[#1e4d3a]/5 transition-all cursor-pointer">
                            <span className="text-[11px] font-bold uppercase tracking-wide">{t("admin.regionManagement.cancel") || "Cancel"}</span>
                          </button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => startEdit(item)} className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#1e4d3a]/5 text-[#1e4d3a] border border-[#1e4d3a]/10 hover:bg-[#1e4d3a] hover:text-white transition-all cursor-pointer">
                            <Icon name="edit" size={18} />
                            <span className="text-[11px] font-bold uppercase tracking-wide">{t("admin.regionManagement.edit") || "Edit"}</span>
                          </button>
                          <button onClick={() => handleDelete(item.region_id)} className="w-10 h-10 rounded-full flex items-center justify-center border border-[#e96d5c]/30 text-[#e96d5c] hover:bg-[#e96d5c]/10 transition-all cursor-pointer">
                            <Icon name="delete" size={18} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="mt-5 pt-5 border-t border-dashed border-[#1e4d3a]/15">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {languages.map((l) => {
                          const hasTranslation = item.translations[l.code];
                          if (!isEditing && !hasTranslation) return null;

                          const isRtl = l.code.toLowerCase() === "ar";
                          return (
                            <div key={l.code} className="flex flex-col gap-2">
                              <span className="mono-label text-[10px] uppercase font-bold text-[#1e4d3a]/60">
                                {l.name} {!hasTranslation && isEditing && <span className="text-[#e96d5c] ml-1">({t("admin.regionManagement.missing") || "Missing"})</span>}
                              </span>
                              {isEditing ? (
                                <input 
                                  type="text" 
                                  dir={isRtl ? "rtl" : "ltr"} 
                                  value={editData[l.code] || ""} 
                                  onChange={(e) => setEditData({ ...editData, [l.code]: e.target.value })} 
                                  className="w-full px-3 py-2.5 rounded-lg border border-[#1e4d3a]/20 bg-white text-[#082f27] outline-none focus:border-[#1e4d3a] focus:ring-1 focus:ring-[#1e4d3a]/10 transition-all text-[13px] placeholder-[#1e4d3a]/30" 
                                  style={{ textAlign: isRtl ? "right" : "left" }} 
                                  placeholder={`Add ${l.name} translation...`}
                                />
                              ) : (
                                <div className="px-3 py-2.5 rounded-lg bg-[#1e4d3a]/5 text-[#082f27] text-[13px] truncate" dir={isRtl ? "rtl" : "ltr"}>
                                  {item.translations[l.code]}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
        {renderPagination()}
      </main>
    </div>
  );
}