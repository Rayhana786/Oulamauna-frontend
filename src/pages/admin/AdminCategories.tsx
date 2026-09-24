import React, { useState, useEffect } from "react";
import { adminApi } from "../../api/adminApi";
import { useLang } from "../../context/LanguageContext";

interface Category {
  category_id: number;
  name: string;
  translations: any;
  description: string | null;
  display_order: number;
  post_count: number;
}

export default function AdminCategories() {
  const { lang, t, dbLanguages } = useLang();
  const isRTL = lang === "AR";
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  
  // ✅ Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const initialTranslations = dbLanguages.reduce((acc: any, l: any) => ({ ...acc, [l.code]: "" }), {});
  
  const [formData, setFormData] = useState({
    name: "",
    translations: initialTranslations,
    description: ""
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setIsLoading(true);
    try {
      const res = await adminApi.forum.getCategories();
      if (res.data?.success) {
        setCategories(res.data.data.sort((a: Category, b: Category) => a.display_order - b.display_order));
      }
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const openModal = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      let parsedTranslations = category.translations;
      if (typeof parsedTranslations === 'string') {
        try { parsedTranslations = JSON.parse(parsedTranslations); } catch (e) { parsedTranslations = {}; }
      }
      const safeTranslations = parsedTranslations || {};
      const dynamicTranslations = dbLanguages.reduce((acc: any, l: any) => ({
        ...acc,
        [l.code]: safeTranslations[l.code] || ""
      }), {});

      setFormData({
        name: category.name,
        translations: dynamicTranslations,
        description: category.description || ""
      });
    } else {
      setEditingCategory(null);
      setFormData({ name: "", translations: initialTranslations, description: "" });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingCategory(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCategory) {
        await adminApi.forum.updateCategory(editingCategory.category_id, formData);
      } else {
        await adminApi.forum.createCategory(formData);
      }
      closeModal();
      fetchCategories();
    } catch (error) {
      console.error("Failed to save category:", error);
      alert("Failed to save category");
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm(t("admin.categories.deleteConfirm") || "Delete this category? Posts must be moved or deleted first.")) return;
    try {
      await adminApi.forum.deleteCategory(id);
      fetchCategories();
    } catch (error: any) {
      alert(error.response?.data?.message || "Failed to delete category");
    }
  };

  const handleReorder = async (index: number, direction: "up" | "down") => {
    const newCategories = [...categories];
    const temp = newCategories[index];
    
    if (direction === "up" && index > 0) {
      newCategories[index] = newCategories[index - 1];
      newCategories[index - 1] = temp;
    } else if (direction === "down" && index < newCategories.length - 1) {
      newCategories[index] = newCategories[index + 1];
      newCategories[index + 1] = temp;
    } else {
      return;
    }

    newCategories.forEach((cat, idx) => { cat.display_order = idx; });
    setCategories(newCategories);

    try {
      const idsToSend = newCategories.map(c => c.category_id).filter(id => id !== undefined && id !== null);
      await adminApi.forum.reorderCategories(idsToSend);
    } catch (error) {
      console.error("Failed to reorder:", error);
      fetchCategories();
    }
  };

  // ✅ Pagination Logic
  const totalPages = Math.ceil(categories.length / ITEMS_PER_PAGE);
  const paginatedCategories = categories.slice(
    (currentPage - 1) * ITEMS_PER_PAGE, 
    currentPage * ITEMS_PER_PAGE
  );

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#fbf9f4]">
      <span className="material-symbols-outlined text-[40px] text-[#1e4d3a]/40 animate-pulse">hourglass_empty</span>
    </div>
  );

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
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="serif-title text-[27px] md:text-[32px] leading-tight font-semibold text-[#082f27]">{t("admin.categories.title") || "Forum Categories"}</h1>
            <p className="text-[12px] text-[#1e4d3a]/60 mt-1">{t("admin.categories.subtitle") || "Manage discussion categories and translations."}</p>
          </div>
          <button onClick={() => openModal()} className="flex items-center gap-2 px-5 py-2.5 rounded-[8px] bg-[#1e4d3a] text-white border-2 border-[#1e4d3a] text-[12px] font-bold uppercase tracking-wide hover:bg-transparent hover:text-[#1e4d3a] transition-all duration-300 cursor-pointer">
  <span className="material-symbols-outlined text-[18px]">add</span> {t("admin.categories.addCategory") || "Add Category"}
</button>
        </div>

        <div className="dashboard-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#1e4d3a]/10 bg-[#1e4d3a]/[0.02]">
                  <th className="mono-label text-[9px] uppercase font-bold text-[#1e4d3a]/60 px-5 py-3.5 text-center">{t("admin.categories.order") || "Order"}</th>
                  <th className="mono-label text-[9px] uppercase font-bold text-[#1e4d3a]/60 px-5 py-3.5">{t("admin.categories.categoryName") || "Category Name"}</th>
                  <th className="mono-label text-[9px] uppercase font-bold text-[#1e4d3a]/60 px-5 py-3.5">{t("admin.categories.translations") || "Translations"}</th>
                  <th className="mono-label text-[9px] uppercase font-bold text-[#1e4d3a]/60 px-5 py-3.5">{t("admin.categories.description") || "Description"}</th>
                  <th className="mono-label text-[9px] uppercase font-bold text-[#1e4d3a]/60 px-5 py-3.5 text-center">{t("admin.categories.posts") || "Posts"}</th>
                  <th className="mono-label text-[9px] uppercase font-bold text-[#1e4d3a]/60 px-5 py-3.5 text-right">{t("admin.categories.actions") || "Actions"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e4d3a]/[0.06]">
                {paginatedCategories.length === 0 ? (
                  <tr><td colSpan={6} className="px-5 py-12 text-center text-[12px] text-[#1e4d3a]/50">{t("admin.categories.noCategories") || "No categories yet."}</td></tr>
                ) : (
                  paginatedCategories.map((category, index) => {
                    // Calculate the actual index in the full array for reordering
                    const actualIndex = (currentPage - 1) * ITEMS_PER_PAGE + index;
                    const tableTranslations = typeof category.translations === 'string' 
                      ? JSON.parse(category.translations || '{}') 
                      : (category.translations || {});

                    return (
                      <tr key={category.category_id} className="hover:bg-[#1e4d3a]/[0.015] transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="flex gap-1 justify-center">
                            <button onClick={() => handleReorder(actualIndex, "up")} disabled={actualIndex === 0} className="w-7 h-7 flex items-center justify-center rounded-[4px] border border-[#1e4d3a]/10 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#1e4d3a]/5 transition-colors cursor-pointer">
                              <span className="material-symbols-outlined text-[16px] text-[#1e4d3a]">arrow_upward</span>
                            </button>
                            <button onClick={() => handleReorder(actualIndex, "down")} disabled={actualIndex === categories.length - 1} className="w-7 h-7 flex items-center justify-center rounded-[4px] border border-[#1e4d3a]/10 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#1e4d3a]/5 transition-colors cursor-pointer">
                              <span className="material-symbols-outlined text-[16px] text-[#1e4d3a]">arrow_downward</span>
                            </button>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="font-['Source_Serif_4'] text-[14px] font-semibold text-[#082f27]">{category.name}</span>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex flex-col gap-1 text-[11px]">
                            {dbLanguages.map(l => (
                              tableTranslations[l.code] && (
                                <span key={l.code}>
                                  {l.code === 'ar' ? '🇸🇦' : l.code === 'fr' ? '🇫🇷' : '🇬🇧'} {l.code.toUpperCase()}: {tableTranslations[l.code]}
                                </span>
                              )
                            ))}
                            {dbLanguages.every(l => !tableTranslations[l.code]) && <span className="opacity-50">None</span>}
                          </div>
                        </td>
                        <td className="px-5 py-3.5 max-w-[300px] text-[#1e4d3a]/70 truncate">{category.description || "-"}</td>
                        <td className="px-5 py-3.5 text-center">
                          <span className="inline-flex items-center px-3 py-1 rounded-full bg-[#1e4d3a]/5 border border-[#1e4d3a]/10 text-[12px] font-semibold text-[#1e4d3a]">{category.post_count}</span>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button onClick={() => openModal(category)} title={t("admin.categories.edit") || "Edit"} className="w-8 h-8 flex items-center justify-center rounded-[6px] border border-[#3d6b96] text-[#3d6b96] hover:bg-[#3d6b96] hover:text-white transition-colors cursor-pointer">
                              <span className="material-symbols-outlined text-[18px]">edit</span>
                            </button>
                            <button onClick={() => handleDelete(category.category_id)} title={t("admin.categories.delete") || "Delete"} className="w-8 h-8 flex items-center justify-center rounded-[6px] border border-[#e96d5c] text-[#e96d5c] hover:bg-[#e96d5c] hover:text-white transition-colors cursor-pointer">
                              <span className="material-symbols-outlined text-[18px]">delete</span>
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

          {/* ✅ PAGINATION FOOTER */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-5 py-4 border-t border-[#1e4d3a]/10 bg-[#1e4d3a]/[0.01]">
              <div className="text-[11px] text-[#1e4d3a]/60 mono-label">
                {t("admin.common.showing") || "Showing"} {(currentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, categories.length)} {t("admin.common.of") || "of"} {categories.length}
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
        </div>

        {/* Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#082f27]/40 backdrop-blur-sm" onClick={closeModal}>
            <div className="dashboard-card w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center p-6 border-b border-[#1e4d3a]/10">
                <h2 className="serif-title text-[20px] font-semibold text-[#082f27]">{editingCategory ? (t("admin.categories.editCategory") || "Edit Category") : (t("admin.categories.createCategory") || "Create Category")}</h2>
                <button onClick={closeModal} className="p-1.5 rounded-full hover:bg-[#1e4d3a]/10 transition-colors cursor-pointer">
                  <span className="material-symbols-outlined text-[20px] text-[#1e4d3a]">close</span>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                <div>
                  <label className="mono-label text-[9px] uppercase font-bold text-[#1e4d3a]/60 mb-1.5 block">{t("admin.categories.primaryName") || "Primary Name *"}</label>
                  <input 
                    type="text" 
                    value={formData.name} 
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
                    placeholder={t("admin.categories.primaryNamePlaceholder") || "e.g., Manuscripts"} 
                    required 
                    className="w-full bg-[#fbf9f4] border border-[#1e4d3a]/15 rounded-[6px] px-3 py-2 text-[13px] font-medium text-[#1e4d3a] focus:outline-none focus:ring-2 focus:ring-[#1e4d3a]/20 focus:border-[#1e4d3a]" 
                  />
                </div>

                <div>
                  <label className="mono-label text-[9px] uppercase font-bold text-[#1e4d3a]/60 mb-3 block">{t("admin.categories.translations") || "Translations"}</label>
                  <div className="space-y-3">
                    {dbLanguages.map((l: any) => (
                      <div key={l.code}>
                        <label className="text-[12px] text-[#1e4d3a]/80 mb-1 block">
                          {l.code === 'ar' ? '🇸🇦' : l.code === 'fr' ? '🇫🇷' : '🇬🇧'} {l.name}
                        </label>
                        <input 
                          type="text" 
                          value={formData.translations[l.code] || ""} 
                          onChange={(e) => setFormData({ 
                            ...formData, 
                            translations: { ...formData.translations, [l.code]: e.target.value } 
                          })} 
                          placeholder={`${l.name} translation`} 
                          dir={l.code === 'ar' ? 'rtl' : 'ltr'}
                          className="w-full bg-[#fbf9f4] border border-[#1e4d3a]/15 rounded-[6px] px-3 py-2 text-[13px] font-medium text-[#1e4d3a] focus:outline-none focus:ring-2 focus:ring-[#1e4d3a]/20 focus:border-[#1e4d3a]" 
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="mono-label text-[9px] uppercase font-bold text-[#1e4d3a]/60 mb-1.5 block">{t("admin.categories.description") || "Description"}</label>
                  <textarea 
                    value={formData.description} 
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })} 
                    placeholder={t("admin.categories.descriptionPlaceholder") || "Brief description of this category..."} 
                    rows={3} 
                    className="w-full bg-[#fbf9f4] border border-[#1e4d3a]/15 rounded-[6px] px-3 py-2 text-[13px] font-medium text-[#1e4d3a] focus:outline-none focus:ring-2 focus:ring-[#1e4d3a]/20 focus:border-[#1e4d3a] resize-y" 
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-[#1e4d3a]/10">
                  <button type="button" onClick={closeModal} className="px-5 py-2 rounded-[6px] border border-[#1e4d3a]/20 text-[#1e4d3a] text-[12px] font-bold uppercase tracking-wide hover:bg-[#1e4d3a]/5 transition-colors cursor-pointer">
                    {t("admin.categories.cancel") || "Cancel"}
                  </button>
                 <button type="submit" className="px-5 py-2 rounded-[6px] bg-[#1e4d3a] text-white border-2 border-[#1e4d3a] text-[12px] font-bold uppercase tracking-wide hover:bg-transparent hover:text-[#1e4d3a] transition-all duration-300 cursor-pointer">
  {editingCategory ? (t("admin.categories.updateCategory") || "Update Category") : (t("admin.categories.createCategory") || "Create Category")}
</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}