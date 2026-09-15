import React, { useState, useEffect } from "react";
import { adminApi } from "../../api/adminApi";
import { useLang } from "../../context/LanguageContext";

/* ------------------------------------------------------------------ */
/*  Design Tokens                                                      */
/* ------------------------------------------------------------------ */
const colors = {
  creamLight: "#fcfaf5", creamMid: "#f6efdc", creamDark: "#e5d5a8",
  forestGreen: "#0b4335", amber: "#b8860b", red: "#8b2c2c", blue: "#4a7fcb",
};
const fonts = { headline: "'Hanken Grotesk', sans-serif", body: "'Inter', sans-serif", label: "'JetBrains Mono', monospace" };
const cardStyle: React.CSSProperties = { backgroundColor: colors.creamLight, borderRadius: 12, boxShadow: "0px 4px 20px rgba(11, 67, 53, 0.08)", border: `1px solid ${colors.forestGreen}` };

const Icon: React.FC<{ name: string; size?: number; filled?: boolean }> = ({ name, size = 18, filled = false }) => (
  <span className="material-symbols-outlined" style={{ fontSize: size, lineHeight: 1, fontVariationSettings: `'FILL' ${filled ? 1 : 0}, 'wght' 400, 'GRAD' 0, 'opsz' 24` }}>{name}</span>
);

interface Category {
  category_id: number;
  name: string;
  translations: any;
  description: string | null;
  display_order: number;
  post_count: number;
}

export default function AdminCategories() {
  const { lang } = useLang();
  const isRTL = lang === "AR";
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    translations: { en: "", ar: "", fr: "" },
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
      
      // ✅ Safely parse translations for the form
      let parsedTranslations = category.translations;
      if (typeof parsedTranslations === 'string') {
        try { parsedTranslations = JSON.parse(parsedTranslations); } catch (e) { parsedTranslations = {}; }
      }
      const safeTranslations = parsedTranslations || {};

      setFormData({
        name: category.name,
        translations: {
          en: safeTranslations.en || "",
          ar: safeTranslations.ar || "",
          fr: safeTranslations.fr || ""
        },
        description: category.description || ""
      });
    } else {
      setEditingCategory(null);
      setFormData({ name: "", translations: { en: "", ar: "", fr: "" }, description: "" });
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
    if (!window.confirm("Delete this category? Posts must be moved or deleted first.")) return;
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

  const thStyle: React.CSSProperties = { fontFamily: fonts.label, fontSize: 11, letterSpacing: "0.06em", fontWeight: 600, color: colors.forestGreen, textAlign: isRTL ? "right" : "left", padding: "12px 14px", borderBottom: `1px solid ${colors.forestGreen}`, textTransform: "uppercase", opacity: 0.8 };
  const tdStyle: React.CSSProperties = { fontFamily: fonts.body, fontSize: 13, color: colors.forestGreen, padding: "14px", borderBottom: `1px solid ${colors.creamDark}`, textAlign: isRTL ? "right" : "left", verticalAlign: "top" };

  if (isLoading) return <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name="hourglass_empty" size={40} /></div>;

  return (
    <div style={{ padding: 24, maxWidth: 1400, margin: "0 auto", fontFamily: fonts.body, color: colors.forestGreen }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: fonts.headline, fontSize: 28, fontWeight: 700, margin: 0 }}>Forum Categories</h1>
          <p style={{ fontFamily: fonts.body, fontSize: 14, color: colors.forestGreen, opacity: 0.7, margin: "4px 0 0" }}>Manage discussion categories and translations.</p>
        </div>
        <button onClick={() => openModal()} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 20px", backgroundColor: colors.forestGreen, color: colors.creamLight, border: "none", borderRadius: 8, fontFamily: fonts.body, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
          <Icon name="add" size={18} /> Add Category
        </button>
      </div>

      <div style={{ ...cardStyle, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead style={{ backgroundColor: colors.creamMid }}>
              <tr>
                <th style={thStyle}>Order</th>
                <th style={thStyle}>Category Name</th>
                <th style={thStyle}>Translations</th>
                <th style={thStyle}>Description</th>
                <th style={{ ...thStyle, textAlign: "center" }}>Posts</th>
                <th style={{ ...thStyle, textAlign: isRTL ? "left" : "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.length === 0 ? (
                <tr><td colSpan={6} style={{ ...tdStyle, textAlign: "center", padding: 40, opacity: 0.6 }}>No categories yet.</td></tr>
              ) : (
                categories.map((category, index) => {
                  // ✅ Safely parse for table display
                  const tableTranslations = typeof category.translations === 'string' 
                    ? JSON.parse(category.translations || '{}') 
                    : (category.translations || {});

                  return (
                    <tr key={category.category_id}>
                      <td style={tdStyle}>
                        <div style={{ display: "flex", gap: 4, justifyContent: "center" }}>
                          <button onClick={() => handleReorder(index, "up")} disabled={index === 0} style={{ width: 28, height: 28, border: `1px solid ${colors.creamDark}`, backgroundColor: index === 0 ? colors.creamMid : "transparent", borderRadius: 4, cursor: index === 0 ? "not-allowed" : "pointer", opacity: index === 0 ? 0.4 : 1 }}>
                            <Icon name="arrow_upward" size={16} />
                          </button>
                          <button onClick={() => handleReorder(index, "down")} disabled={index === categories.length - 1} style={{ width: 28, height: 28, border: `1px solid ${colors.creamDark}`, backgroundColor: index === categories.length - 1 ? colors.creamMid : "transparent", borderRadius: 4, cursor: index === categories.length - 1 ? "not-allowed" : "pointer", opacity: index === categories.length - 1 ? 0.4 : 1 }}>
                            <Icon name="arrow_downward" size={16} />
                          </button>
                        </div>
                      </td>
                      <td style={tdStyle}><span style={{ fontFamily: fonts.headline, fontSize: 14, fontWeight: 600 }}>{category.name}</span></td>
                      <td style={tdStyle}>
                        <div style={{ display: "flex", flexDirection: "column", gap: 2, fontSize: 11 }}>
                          {tableTranslations.en && <span>🇬🇧 EN: {tableTranslations.en}</span>}
                          {tableTranslations.ar && <span>🇸🇦 AR: {tableTranslations.ar}</span>}
                          {tableTranslations.fr && <span>🇫🇷 FR: {tableTranslations.fr}</span>}
                          {!tableTranslations.en && !tableTranslations.ar && !tableTranslations.fr && <span style={{opacity: 0.5}}>None</span>}
                        </div>
                      </td>
                      <td style={{ ...tdStyle, maxWidth: 300, opacity: 0.8 }}>{category.description || "-"}</td>
                      <td style={{ ...tdStyle, textAlign: "center" }}>
                        <span style={{ padding: "4px 12px", borderRadius: 9999, backgroundColor: colors.creamMid, border: `1px solid ${colors.creamDark}`, fontSize: 12, fontWeight: 600 }}>{category.post_count}</span>
                      </td>
                      <td style={{ ...tdStyle, textAlign: isRTL ? "left" : "right" }}>
                        <div style={{ display: "flex", gap: 6, justifyContent: isRTL ? "flex-start" : "flex-end" }}>
                          <button onClick={() => openModal(category)} title="Edit" style={{ width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 6, border: `1px solid ${colors.blue}`, backgroundColor: "transparent", color: colors.blue, cursor: "pointer" }}>
                            <Icon name="edit" size={18} />
                          </button>
                          <button onClick={() => handleDelete(category.category_id)} title="Delete" style={{ width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 6, border: `1px solid ${colors.red}`, backgroundColor: "transparent", color: colors.red, cursor: "pointer" }}>
                            <Icon name="delete" size={18} />
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
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(11, 67, 53, 0.5)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, backdropFilter: "blur(4px)" }} onClick={closeModal}>
          <div style={{ ...cardStyle, backgroundColor: colors.creamLight, width: "100%", maxWidth: 600, maxHeight: "90vh", overflowY: "auto" }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 24px", borderBottom: `1px solid ${colors.creamDark}` }}>
              <h2 style={{ fontFamily: fonts.headline, fontSize: 20, fontWeight: 700, color: colors.forestGreen, margin: 0 }}>{editingCategory ? "Edit Category" : "Add New Category"}</h2>
              <button onClick={closeModal} style={{ background: "none", border: "none", cursor: "pointer", color: colors.forestGreen }}><Icon name="close" size={24} /></button>
            </div>

            <form onSubmit={handleSubmit} style={{ padding: 24 }}>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: "block", fontFamily: fonts.label, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6, color: colors.forestGreen }}>Primary Name *</label>
                <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g., Manuscripts" required style={{ width: "100%", padding: "10px 12px", borderRadius: 6, border: `1px solid ${colors.creamDark}`, fontFamily: fonts.body, fontSize: 14, outline: "none" }} />
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: "block", fontFamily: fonts.label, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 12, color: colors.forestGreen }}>Translations</label>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 12, marginBottom: 4, opacity: 0.8 }}>🇬🇧 English</label>
                    <input type="text" value={formData.translations.en} onChange={(e) => setFormData({ ...formData, translations: { ...formData.translations, en: e.target.value } })} placeholder="English translation" style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: `1px solid ${colors.creamDark}`, fontFamily: fonts.body, fontSize: 13 }} />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 12, marginBottom: 4, opacity: 0.8 }}>🇸🇦 Arabic</label>
                    <input type="text" value={formData.translations.ar} onChange={(e) => setFormData({ ...formData, translations: { ...formData.translations, ar: e.target.value } })} placeholder="الترجمة العربية" dir="rtl" style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: `1px solid ${colors.creamDark}`, fontFamily: fonts.body, fontSize: 13 }} />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 12, marginBottom: 4, opacity: 0.8 }}>🇫🇷 French</label>
                    <input type="text" value={formData.translations.fr} onChange={(e) => setFormData({ ...formData, translations: { ...formData.translations, fr: e.target.value } })} placeholder="Traduction française" style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: `1px solid ${colors.creamDark}`, fontFamily: fonts.body, fontSize: 13 }} />
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: 24 }}>
                <label style={{ display: "block", fontFamily: fonts.label, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6, color: colors.forestGreen }}>Description</label>
                <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Brief description of this category..." rows={3} style={{ width: "100%", padding: "10px 12px", borderRadius: 6, border: `1px solid ${colors.creamDark}`, fontFamily: fonts.body, fontSize: 14, resize: "vertical", outline: "none" }} />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
                <button type="button" onClick={closeModal} style={{ padding: "10px 20px", borderRadius: 6, border: `1px solid ${colors.forestGreen}`, backgroundColor: "transparent", color: colors.forestGreen, fontFamily: fonts.body, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
                <button type="submit" style={{ padding: "10px 20px", borderRadius: 6, border: "none", backgroundColor: colors.forestGreen, color: colors.creamLight, fontFamily: fonts.body, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>{editingCategory ? "Update Category" : "Create Category"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}