import React, { useState, useEffect } from "react";

/* ------------------------------------------------------------------ */
/*  Design tokens — Oulamnauna admin palette                          */
/* ------------------------------------------------------------------ */
const colors = {
  creamLight: "#fcfaf5",
  creamMid: "#f3ebd6",
  creamDark: "#e5d5a8",
  forestGreen: "#0b4335",
  danger: "#8a1c1c",
};

const fonts = {
  headline: "'Hanken Grotesk', sans-serif",
  body: "'Inter', sans-serif",
  label: "'JetBrains Mono', monospace",
};

const Icon: React.FC<{ name: string; size?: number; filled?: boolean }> = ({
  name, size = 18, filled = false,
}) => (
  <span className="material-symbols-outlined" style={{ fontSize: size, lineHeight: 1, fontVariationSettings: `'FILL' ${filled ? 1 : 0}, 'wght' 400, 'GRAD' 0, 'opsz' 24` }}>
    {name}
  </span>
);

const cardStyle: React.CSSProperties = {
  backgroundColor: colors.creamLight, borderRadius: 12, boxShadow: "0px 4px 20px rgba(11, 67, 53, 0.08)",
  border: `1px solid ${colors.forestGreen}`, padding: 24,
};

const inputStyle: React.CSSProperties = {
  fontFamily: fonts.body, fontSize: 14, padding: "8px 12px", borderRadius: 6,
  border: `1px solid ${colors.forestGreen}`, backgroundColor: colors.creamLight,
  color: colors.forestGreen, outline: "none", width: "100%", boxSizing: "border-box",
};

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5444";

interface Language {
  language_id: number;
  code: string;
  name: string;
}

interface Discipline {
  discipline_id: number;
  name: string;
  language_id: number;
  created_at: string;
  langCode?: string;
  langName?: string;
}

const DisciplineManagement: React.FC = () => {
  const [languages, setLanguages] = useState<Language[]>([]);
  const [disciplines, setDisciplines] = useState<Discipline[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [languageFilter, setLanguageFilter] = useState<string>("all");
  
  const [formData, setFormData] = useState({ nameEn: "", nameAr: "", nameFr: "" });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");

  useEffect(() => { fetchLanguages(); }, []);

  const fetchLanguages = async () => {
    try {
      const res = await fetch(`${API_URL}/api/languages`, { credentials: "include" });
      const data = await res.json();
      if (data.success) setLanguages(data.data);
    } catch (err) { console.error("Failed to fetch languages", err); }
  };

  useEffect(() => {
    if (languages.length > 0) fetchDisciplines();
  }, [languages]);

  const fetchDisciplines = async () => {
    try {
      const promises = languages.map(async (lang) => {
        const res = await fetch(`${API_URL}/api/discipline?lang=${lang.code}`, { credentials: "include" });
        const data = await res.json();
        if (data.success) {
          return data.data.map((d: any) => ({ ...d, langCode: lang.code, langName: lang.name }));
        }
        return [];
      });
      const results = await Promise.all(promises);
      setDisciplines(results.flat());
    } catch (err) { console.error("Failed to fetch disciplines", err); }
  };

  const resetForm = () => {
    setFormData({ nameEn: "", nameAr: "", nameFr: "" });
    setIsFormOpen(false);
  };

  // ✅ CREATE: 3 separate rows, one for each language
  const handleCreate = async () => {
    if (!formData.nameEn.trim() || !formData.nameAr.trim() || !formData.nameFr.trim()) {
      alert("Please fill in all 3 languages.");
      return;
    }
    setLoading(true);
    try {
      const enLang = languages.find(l => l.code.toLowerCase() === 'en');
      const arLang = languages.find(l => l.code.toLowerCase() === 'ar');
      const frLang = languages.find(l => l.code.toLowerCase() === 'fr');

      const promises = [];
      if (enLang) promises.push(fetch(`${API_URL}/api/discipline`, { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ name: formData.nameEn.trim(), language_id: enLang.language_id }) }));
      if (arLang) promises.push(fetch(`${API_URL}/api/discipline`, { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ name: formData.nameAr.trim(), language_id: arLang.language_id }) }));
      if (frLang) promises.push(fetch(`${API_URL}/api/discipline`, { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ name: formData.nameFr.trim(), language_id: frLang.language_id }) }));

      const responses = await Promise.all(promises);
      if (responses.some(res => !res.ok)) throw new Error("One or more creations failed.");
      
      resetForm();
      fetchDisciplines();
    } catch (err) { console.error("Create error:", err); alert("Error creating discipline."); } 
    finally { setLoading(false); }
  };

  // ✅ INLINE EDIT LOGIC
  const startEdit = (item: Discipline) => { setEditingId(item.discipline_id); setEditName(item.name); };
  const cancelEdit = () => { setEditingId(null); setEditName(""); };

  const saveEdit = async (id: number) => {
    if (!editName.trim()) { alert("Name cannot be empty."); return; }
    try {
      const res = await fetch(`${API_URL}/api/admin/discipline/${id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ name: editName.trim() }),
      });
      if (res.ok) { setEditingId(null); fetchDisciplines(); } 
      else { const errData = await res.json(); alert(`Failed to update: ${errData.message || "Unknown error"}`); }
    } catch (err) { console.error("Update error:", err); }
  };

  // ✅ SAFE DELETE: Only deletes the specific row clicked
  const handleDelete = async (id: number, langName: string, itemName: string) => {
    const warningMessage = `⚠️ WARNING: Deleting this ${langName} discipline ("${itemName}") will permanently remove it from any scholars currently assigned to it.\n\nAre you sure you want to proceed?`;
    
    if (!window.confirm(warningMessage)) return;
    
    try {
      const res = await fetch(`${API_URL}/api/admin/discipline/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      
      if (res.ok) {
        fetchDisciplines();
      } else {
        const errData = await res.json();
        console.error("Delete failed:", errData);
        alert(`Failed to delete: ${errData.message || "Unknown error"}`);
      }
    } catch (err) { console.error("Delete error:", err); }
  };

  const filteredDisciplines = disciplines.filter((d) => languageFilter === "all" || d.langCode === languageFilter);
  const sortedDisciplines = [...filteredDisciplines].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h1 style={{ fontFamily: fonts.headline, fontSize: 24, fontWeight: 700, color: colors.forestGreen, margin: 0 }}>Discipline Management</h1>
        <button onClick={() => setIsFormOpen(!isFormOpen)} style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: fonts.body, fontSize: 14, fontWeight: 600, color: colors.creamLight, backgroundColor: colors.forestGreen, border: "none", borderRadius: 8, padding: "10px 18px", cursor: "pointer" }}>
          <Icon name={isFormOpen ? "close" : "add"} size={18} filled /> {isFormOpen ? "Close Form" : "Add Discipline"}
        </button>
      </div>

      {isFormOpen && (
        <section style={{ ...cardStyle, marginBottom: 24, backgroundColor: colors.creamLight }}>
          <h2 style={{ fontFamily: fonts.headline, fontSize: 18, fontWeight: 600, color: colors.forestGreen, margin: "0 0 20px 0" }}>Add New Discipline (All 3 Languages)</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20, marginBottom: 24 }}>
            <div><label style={{ fontFamily: fonts.label, fontSize: 12, color: colors.forestGreen, display: "block", marginBottom: 8 }}>English *</label><input type="text" value={formData.nameEn} onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })} placeholder="e.g., Theology" style={inputStyle} /></div>
            <div><label style={{ fontFamily: fonts.label, fontSize: 12, color: colors.forestGreen, display: "block", marginBottom: 8 }}>Arabic *</label><input type="text" dir="rtl" value={formData.nameAr} onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })} placeholder="مثال: علم اللاهوت" style={{ ...inputStyle, textAlign: "right", fontSize: 16 }} /></div>
            <div><label style={{ fontFamily: fonts.label, fontSize: 12, color: colors.forestGreen, display: "block", marginBottom: 8 }}>French *</label><input type="text" value={formData.nameFr} onChange={(e) => setFormData({ ...formData, nameFr: e.target.value })} placeholder="ex: Théologie" style={inputStyle} /></div>
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <button onClick={handleCreate} disabled={loading} style={{ fontFamily: fonts.body, fontSize: 14, fontWeight: 600, color: colors.creamLight, backgroundColor: colors.forestGreen, border: "none", borderRadius: 6, padding: "10px 20px", cursor: "pointer", opacity: loading ? 0.6 : 1 }}>{loading ? "Creating..." : "Create"}</button>
            <button onClick={resetForm} style={{ fontFamily: fonts.body, fontSize: 14, color: colors.forestGreen, backgroundColor: "transparent", border: `1px solid ${colors.forestGreen}`, borderRadius: 6, padding: "10px 20px", cursor: "pointer" }}>Cancel</button>
          </div>
        </section>
      )}

      <section style={cardStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ fontFamily: fonts.headline, fontSize: 18, fontWeight: 600, color: colors.forestGreen, margin: 0 }}>All Disciplines ({sortedDisciplines.length})</h2>
          <select value={languageFilter} onChange={(e) => setLanguageFilter(e.target.value)} style={{ fontFamily: fonts.body, fontSize: 14, padding: "8px 14px", borderRadius: 6, border: `1px solid ${colors.forestGreen}`, backgroundColor: colors.creamLight, color: colors.forestGreen, cursor: "pointer", outline: "none" }}>
            <option value="all">All Languages</option>
            {languages.map(lang => (<option key={lang.code} value={lang.code}>{lang.name} Only</option>))}
          </select>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {sortedDisciplines.length === 0 && <p style={{ fontFamily: fonts.body, fontSize: 14, color: colors.forestGreen }}>No disciplines found.</p>}
          
          {sortedDisciplines.map((item) => {
            const isEditing = editingId === item.discipline_id;
            const isRtl = item.langCode === "ar";
            const langName = item.langName || "this language";
            
            return (
              <div key={item.discipline_id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", border: `1px solid ${isEditing ? colors.forestGreen : colors.creamDark}`, borderRadius: 8, backgroundColor: isEditing ? colors.creamLight : "transparent", transition: "all 0.2s" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 16, flex: 1 }}>
                  <span style={{ fontFamily: fonts.label, fontSize: 10, color: colors.forestGreen, backgroundColor: colors.creamDark, padding: "4px 10px", borderRadius: 4, fontWeight: 600, minWidth: 60, textAlign: "center" }}>{langName.toUpperCase()}</span>
                  {isEditing ? (
                    <input autoFocus dir={isRtl ? "rtl" : "ltr"} value={editName} onChange={(e) => setEditName(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") saveEdit(item.discipline_id); if (e.key === "Escape") cancelEdit(); }} style={{ ...inputStyle, flex: 1, maxWidth: 400, fontSize: isRtl ? 16 : 14 }} />
                  ) : (
                    <span style={{ fontFamily: fonts.body, fontSize: isRtl ? 16 : 14, fontWeight: 500, color: colors.forestGreen, direction: isRtl ? "rtl" : "ltr" }}>{item.name}</span>
                  )}
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  {isEditing ? (
                    <>
                      <button onClick={() => saveEdit(item.discipline_id)} style={{ display: "flex", alignItems: "center", gap: 4, fontFamily: fonts.body, fontSize: 13, color: colors.creamLight, backgroundColor: colors.forestGreen, border: "none", borderRadius: 6, padding: "6px 12px", cursor: "pointer" }}><Icon name="check" size={14} filled /> Save</button>
                      <button onClick={cancelEdit} style={{ display: "flex", alignItems: "center", gap: 4, fontFamily: fonts.body, fontSize: 13, color: colors.forestGreen, border: `1px solid ${colors.forestGreen}`, borderRadius: 6, padding: "6px 12px", backgroundColor: "transparent", cursor: "pointer" }}>Cancel</button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => startEdit(item)} style={{ display: "flex", alignItems: "center", gap: 4, fontFamily: fonts.body, fontSize: 13, color: colors.forestGreen, border: `1px solid ${colors.forestGreen}`, borderRadius: 6, padding: "6px 12px", backgroundColor: "transparent", cursor: "pointer" }}><Icon name="edit" size={14} /> Edit</button>
                      
                      {/* ✅ SAFE DELETE: Passes specific ID and Name */}
                      <button onClick={() => handleDelete(item.discipline_id, langName, item.name)} style={{ display: "flex", alignItems: "center", gap: 4, fontFamily: fonts.body, fontSize: 13, color: colors.danger, border: `1px solid ${colors.danger}`, borderRadius: 6, padding: "6px 12px", backgroundColor: "transparent", cursor: "pointer" }}>
                        <Icon name="delete" size={14} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};

export default DisciplineManagement;