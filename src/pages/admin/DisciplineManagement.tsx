import React, { useState, useEffect, useMemo } from "react";
import { useLang } from "../../context/LanguageContext";

const Icon: React.FC<{ name: string; size?: number; filled?: boolean; style?: React.CSSProperties }> = ({ name, size = 18, filled = false, style }) => (
  <span className="material-symbols-outlined" style={{ fontSize: size, lineHeight: 1, fontVariationSettings: `'FILL' ${filled ? 1 : 0}, 'wght' 400, 'GRAD' 0, 'opsz' 24`, ...style }}>{name}</span>
);

const API_URL = (import.meta as any).env?.VITE_API_URL || "http://localhost:5444";

interface Language { language_id: number; code: string; name: string; }
interface Discipline { discipline_id: number; translations: Record<string, string>; image_url?: string | null; created_at: string; }

export default function DisciplineManagement() {
  const { lang, t } = useLang();
  const isRTL = lang === "AR";
  const currentLangCode = lang.toLowerCase();

  const [languages, setLanguages] = useState<Language[]>([]);
  const [disciplines, setDisciplines] = useState<Discipline[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editData, setEditData] = useState<Record<string, string>>({});
  
  const [uploadingImage, setUploadingImage] = useState<number | null>(null);
  const [creationImage, setCreationImage] = useState<File | null>(null);
  const [creationImagePreview, setCreationImagePreview] = useState<string | null>(null);

  const ITEMS_PER_PAGE = 10;

  useEffect(() => { fetchLanguages(); }, []);
  useEffect(() => { if (languages.length > 0) fetchDisciplines(); }, [languages]);

  const fetchLanguages = async () => {
    try {
      const res = await fetch(`${API_URL}/api/languages`, { credentials: "include" });
      const data = await res.json();
      if (data.success) setLanguages(data.data);
    } catch (err) { console.error("Failed to fetch languages", err); }
  };

  const fetchDisciplines = async () => {
    try {
      const res = await fetch(`${API_URL}/api/discipline`, { credentials: "include" });
      const data = await res.json();
      if (data.success) {
        const parsed = data.data.map((d: any) => ({
          ...d,
          translations: typeof d.translations === 'string' ? JSON.parse(d.translations) : (d.translations || {})
        }));
        setDisciplines(parsed);
        setCurrentPage(1);
      }
    } catch (err) { console.error("Failed to fetch disciplines", err); }
  };

  const resetForm = () => { setFormData({}); setCreationImage(null); setCreationImagePreview(null); setIsFormOpen(false); };

  const handleCreate = async () => {
    const validTranslations = Object.fromEntries(Object.entries(formData).filter(([_, v]) => v.trim() !== ""));
    if (Object.keys(validTranslations).length === 0) { 
      alert(t("admin.disciplineManagement.fillAtLeastOne") || "Please fill at least one language."); 
      return; 
    }
    
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/discipline`, {
        method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
        body: JSON.stringify({ translations: validTranslations })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        const newId = data.data.discipline_id;
        if (creationImage) {
          const imgFormData = new FormData(); imgFormData.append("image", creationImage);
          const token = localStorage.getItem('token');
          await fetch(`${API_URL}/api/admin/discipline/${newId}/image`, { method: "PUT", credentials: "include", headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: imgFormData });
        }
        resetForm(); fetchDisciplines();
      } else { alert(`Error: ${data.message || "Creation failed"}`); }
    } catch (err) { console.error("Create error:", err); alert(t("admin.disciplineManagement.errorCreating") || "Error creating discipline."); } 
    finally { setLoading(false); }
  };

  const startEdit = (item: Discipline) => { 
    setEditingId(item.discipline_id); 
    setExpandedId(item.discipline_id); 
    const fullEditData: Record<string, string> = {};
    languages.forEach(l => { fullEditData[l.code] = item.translations[l.code] || ""; });
    setEditData(fullEditData); 
  };
  
  const cancelEdit = () => { setEditingId(null); setEditData({}); };

  const saveEdit = async (id: number) => {
    const validTranslations = Object.fromEntries(Object.entries(editData).filter(([_, v]) => v.trim() !== ""));
    if (Object.keys(validTranslations).length === 0) { 
      alert(t("admin.disciplineManagement.nameCannotBeEmpty") || "Name cannot be empty."); 
      return; 
    }
    try {
      const res = await fetch(`${API_URL}/api/admin/discipline/${id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" }, credentials: "include",
        body: JSON.stringify({ translations: validTranslations })
      });
      if (res.ok) { setEditingId(null); fetchDisciplines(); } 
      else { const err = await res.json(); alert(`Failed: ${err.message}`); }
    } catch (err) { console.error("Update error:", err); }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm(t("admin.disciplineManagement.confirmDelete") || "⚠️ WARNING: Deleting this will remove it from assigned scholars. Proceed?")) return;
    try {
      const res = await fetch(`${API_URL}/api/admin/discipline/${id}`, { method: "DELETE", credentials: "include" });
      if (res.ok) fetchDisciplines();
      else { const err = await res.json(); alert(`Failed: ${err.message}`); }
    } catch (err) { console.error("Delete error:", err); }
  };

  const handleImageUpload = async (disciplineId: number, file: File) => {
    setUploadingImage(disciplineId);
    try {
      const formData = new FormData(); formData.append("image", file);
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/admin/discipline/${disciplineId}/image`, { method: "PUT", credentials: "include", headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: formData });
      const data = await res.json();
      if (res.ok && data.success) fetchDisciplines();
      else alert(`Failed: ${data.message || "Unknown error"}`);
    } catch (err) { console.error("Image upload error:", err); alert("Failed to upload image"); } 
    finally { setUploadingImage(null); }
  };

  const getDisplayName = (translations: Record<string, string>) => {
    return translations[currentLangCode] || translations["en"] || translations["ar"] || translations["fr"] || Object.values(translations)[0] || t("common.unnamed") || "Unnamed";
  };

  const filteredDisciplines = useMemo(() => {
    if (!searchQuery.trim()) return disciplines;
    const q = searchQuery.toLowerCase();
    return disciplines.filter(item => Object.values(item.translations).some(val => val.toLowerCase().includes(q)));
  }, [disciplines, searchQuery]);

  const totalPages = Math.ceil(filteredDisciplines.length / ITEMS_PER_PAGE) || 1;
  useEffect(() => { if (currentPage > totalPages && totalPages > 0) setCurrentPage(totalPages); }, [totalPages, currentPage]);
  const paginatedDisciplines = useMemo(() => filteredDisciplines.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE), [filteredDisciplines, currentPage]);

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
            <div className="mono-label text-[9px] uppercase font-bold text-[#C9A84C] mb-1">{t("admin.sidebar.disciplines") || "Disciplines"}</div>
            <h1 className="serif-title text-[27px] md:text-[32px] leading-tight font-semibold text-[#082f27]">{t("admin.disciplineManagement.title") || "Discipline Management"}</h1>
          </div>
          <button onClick={() => setIsFormOpen(!isFormOpen)} className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#1e4d3a] text-white hover:bg-[#082f27] transition-all cursor-pointer shadow-sm">
            <Icon name={isFormOpen ? "close" : "add"} size={18} filled /> 
            <span className="text-[12px] font-bold uppercase tracking-wide">{isFormOpen ? (t("admin.disciplineManagement.closeForm") || "Close Form") : (t("admin.disciplineManagement.addNew") || "Add Discipline")}</span>
          </button>
        </header>

        {isFormOpen && (
          <section className="dashboard-card p-6 mb-6">
            <h2 className="serif-title text-[20px] font-semibold text-[#082f27] mb-6">{t("admin.disciplineManagement.formTitle") || "Add New Discipline"}</h2>
            
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
                      placeholder={t(`admin.disciplineManagement.placeholder.${l.code}`) || `Enter ${l.name} name`}
                      className="flex-1 px-3 py-2 rounded-lg border border-[#1e4d3a]/20 bg-white text-[#082f27] outline-none focus:border-[#1e4d3a] text-[13px]" 
                      style={{ textAlign: isRtl ? "right" : "left" }} 
                    />
                  </div>
                );
              })}
            </div>

            <div className="mb-6 p-4 border border-dashed border-[#1e4d3a]/30 rounded-lg bg-[#1e4d3a]/5">
              <label className="mono-label text-[10px] uppercase font-bold text-[#1e4d3a]/70 block mb-3">{t("admin.disciplineManagement.imageLabel") || "Discipline Image (Optional)"}</label>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-lg overflow-hidden border border-[#1e4d3a]/20 bg-white flex items-center justify-center flex-shrink-0">
                  {creationImagePreview ? <img src={creationImagePreview} alt="Preview" className="w-full h-full object-cover" /> : <Icon name="image" size={28} style={{ color: "#1e4d3a", opacity: 0.3 }} />}
                </div>
                <div className="flex-1">
                  <input type="file" accept="image/*" id="creation-image-upload" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) { setCreationImage(file); setCreationImagePreview(URL.createObjectURL(file)); } }} />
                  <label htmlFor="creation-image-upload" className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-transparent border border-[#1e4d3a]/30 text-[#1e4d3a] text-[12px] font-bold uppercase tracking-wide hover:bg-[#1e4d3a]/5 transition-all cursor-pointer">
                    <Icon name="upload_file" size={16} /> {creationImage ? (t("admin.disciplineManagement.changeImage") || "Change Image") : (t("admin.disciplineManagement.chooseImage") || "Choose Image")}
                  </label>
                  {creationImage && <button onClick={() => { setCreationImage(null); setCreationImagePreview(null); }} className="ml-3 text-[12px] text-[#e96d5c] hover:underline cursor-pointer">{t("admin.disciplineManagement.remove") || "Remove"}</button>}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button onClick={handleCreate} disabled={loading} className="px-6 py-2.5 rounded-lg bg-[#1e4d3a] text-white font-bold text-[12px] uppercase tracking-wide hover:bg-[#082f27] transition-all disabled:opacity-50 cursor-pointer">
                {loading ? (t("admin.disciplineManagement.creating") || "Creating...") : (t("admin.disciplineManagement.create") || "Create Discipline")}
              </button>
              <button onClick={resetForm} className="px-6 py-2.5 rounded-lg bg-transparent border border-[#1e4d3a]/30 text-[#1e4d3a] font-bold text-[12px] uppercase tracking-wide hover:bg-[#1e4d3a]/5 transition-all cursor-pointer">
                {t("admin.disciplineManagement.cancel") || "Cancel"}
              </button>
            </div>
          </section>
        )}

        <section className="dashboard-card p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <h2 className="serif-title text-[20px] font-semibold text-[#082f27]">{t("admin.disciplineManagement.allTitle") || "All Disciplines"} ({filteredDisciplines.length})</h2>
            <div className="dashboard-card flex items-center gap-3 px-4 py-2.5 w-full md:w-80 flex-shrink-0">
              <Icon name="search" size={20} style={{ color: "rgba(30,77,58,0.5)" }} />
              <input 
                value={searchQuery} 
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }} 
                placeholder={t("admin.disciplineManagement.searchPlaceholder") || "Search disciplines..."} 
                className="flex-1 bg-transparent border-none outline-none text-[13px] text-[#1e4d3a] placeholder-[#1e4d3a]/40" 
                dir={isRTL ? "rtl" : "ltr"} 
              />
            </div>
          </div>
          
          {paginatedDisciplines.length === 0 && (
            <div className="text-center py-12">
              <Icon name="search_off" size={40} style={{ color: "rgba(30,77,58,0.2)", marginBottom: "12px" }} />
              <p className="text-[14px] text-[#1e4d3a]/60">{searchQuery ? (t("common.noResults") || "No results found.") : (t("admin.disciplineManagement.noFound") || "No disciplines found.")}</p>
            </div>
          )}

          <div className="space-y-3">
            {paginatedDisciplines.map((item) => {
              const isEditing = editingId === item.discipline_id;
              const isExpanded = expandedId === item.discipline_id;
              const primaryName = getDisplayName(item.translations);
              const langCount = Object.keys(item.translations).length;
              const extraLangs = langCount - 1;

              return (
                <div key={item.discipline_id} className={`dashboard-card p-5 ${isEditing ? "border-[#1e4d3a]" : ""}`}>
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="relative w-14 h-14 rounded-full overflow-hidden bg-[#1e4d3a]/5 border-2 border-[#1e4d3a]/20 flex-shrink-0 flex items-center justify-center">
                        {item.image_url ? <img src={item.image_url} alt={primaryName} className="w-full h-full object-cover" /> : <Icon name="image" size={24} style={{ color: "#1e4d3a", opacity: 0.4 }} />}
                        <input type="file" accept="image/*" className="hidden" id={`img-${item.discipline_id}`} onChange={(e) => { const file = e.target.files?.[0]; if (file) handleImageUpload(item.discipline_id, file); }} />
                        <label htmlFor={`img-${item.discipline_id}`} className="absolute bottom-0 left-0 right-0 bg-[#1e4d3a]/85 text-white text-center text-[9px] font-bold uppercase py-1 cursor-pointer hover:bg-[#082f27] transition-colors flex items-center justify-center gap-1">
                          <Icon name={uploadingImage === item.discipline_id ? "hourglass_empty" : "add_a_photo"} size={12} /> {uploadingImage === item.discipline_id ? "..." : (t("admin.disciplineManagement.img") || "Img")}
                        </label>
                      </div>
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
                            +{extraLangs} {t("admin.disciplineManagement.more") || "more"}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
                      {!isEditing && langCount > 1 && (
                        <button onClick={() => setExpandedId(isExpanded ? null : item.discipline_id)} className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#1e4d3a]/5 text-[#1e4d3a] border border-[#1e4d3a]/10 hover:bg-[#1e4d3a] hover:text-white transition-all cursor-pointer">
                          <Icon name={isExpanded ? "expand_less" : "expand_more"} size={18} />
                          <span className="text-[11px] font-bold uppercase tracking-wide">{isExpanded ? (t("admin.disciplineManagement.hide") || "Hide") : (t("admin.disciplineManagement.show") || "Show")}</span>
                        </button>
                      )}
                      {isEditing ? (
                        <>
                          <button onClick={() => saveEdit(item.discipline_id)} className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#1e4d3a] text-white hover:bg-[#082f27] transition-all cursor-pointer">
                            <Icon name="check" size={18} filled />
                            <span className="text-[11px] font-bold uppercase tracking-wide">{t("admin.disciplineManagement.save") || "Save"}</span>
                          </button>
                          <button onClick={cancelEdit} className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-transparent border border-[#1e4d3a]/30 text-[#1e4d3a] hover:bg-[#1e4d3a]/5 transition-all cursor-pointer">
                            <span className="text-[11px] font-bold uppercase tracking-wide">{t("admin.disciplineManagement.cancel") || "Cancel"}</span>
                          </button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => startEdit(item)} className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#1e4d3a]/5 text-[#1e4d3a] border border-[#1e4d3a]/10 hover:bg-[#1e4d3a] hover:text-white transition-all cursor-pointer">
                            <Icon name="edit" size={18} />
                            <span className="text-[11px] font-bold uppercase tracking-wide">{t("admin.disciplineManagement.edit") || "Edit"}</span>
                          </button>
                          <button onClick={() => handleDelete(item.discipline_id)} className="w-10 h-10 rounded-full flex items-center justify-center border border-[#e96d5c]/30 text-[#e96d5c] hover:bg-[#e96d5c]/10 transition-all cursor-pointer">
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
                                {l.name} {!hasTranslation && isEditing && <span className="text-[#e96d5c] ml-1">({t("admin.disciplineManagement.missing") || "Missing"})</span>}
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