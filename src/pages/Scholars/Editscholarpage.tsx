import React, { useState, useEffect, useRef } from "react";
import { useParams, Link, useNavigate, useSearchParams } from "react-router-dom";
import { useLang } from "../../context/LanguageContext";
import { scholarsApi } from "../../api/scholarsApi";

/* ─────────────────────────────────────────────
   TYPES
───────────────────────────────────────────── */
type Language = "EN" | "AR" | "FR";

interface PersonEntry {
  scholar_id: number | null;
  scholar_name: string;
}

interface RefEntry {
  title: string;
  citation: string;
  url: string;
}

interface LocalScholarVersion {
  version_id: number;
  language_id: number;
  canonical_name: string;
  biography: string;
  region_id: number | null;
  century_hijri_start: number | null;
  century_hijri_end: number | null;
  century_gregorian_start: number | null;
  century_gregorian_end: number | null;
  image_url: string | null;
  image_status: string | null;
  image_uploaded_by: number | null;
  regions?: { region_id: number; name: string } | null;
  scholar_aliases?: { alias_name: string }[];
  scholar_dates?: { date_type: string; calendar: string; year: number | null; raw_text: string | null }[];
  scholar_disciplines?: { discipline_id: number; disciplines: { discipline_id: number; name: string } }[];
  media?: { media_id: number; title: string; description: string | null; media_url: string; status: string }[];
  scholar_relationships_as_source?: { 
    relation_type: string; 
    related_scholar_version: { canonical_name: string; languages?: { code: string; name: string } } 
  }[];
}

interface LocalScholarData {
  scholar_id: number;
  scholar_versions: LocalScholarVersion[];
  works?: { title: string; year: number | null; format: string; description?: string }[];
  references?: { title: string; citation: string }[];
}

interface RegionOption { region_id: number; name: string }
interface DisciplineOption { discipline_id: number; name: string }

/* ────────────────────────────────────────────
   STYLE CONSTANTS
───────────────────────────────────────────── */
const MONO: React.CSSProperties = { fontFamily: "'JetBrains Mono', monospace" };
const SERIF: React.CSSProperties = { fontFamily: "'Source Serif 4', serif" };
const SANS: React.CSSProperties = { fontFamily: "'Source Sans 3', sans-serif" };

const GREEN = "#0b4335";
const GREEN_LIGHT = "rgba(11,67,53,0.07)";
const GREEN_BORDER = "rgba(11,67,53,0.18)";
const BORDER = "rgba(192,201,195,0.5)";
const MUTED = "#707974";
const DANGER = "#b3261e";
const GOLD = "#735c00";

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "10px 14px", border: `1.5px solid ${BORDER}`,
  borderRadius: "8px", fontSize: "13px", color: "#191c1b", backgroundColor: "#fafbf8",
  fontFamily: SANS.fontFamily, outline: "none", transition: "border-color 0.15s", boxSizing: "border-box",
};

const labelStyle: React.CSSProperties = {
  ...MONO, fontSize: "9px", color: MUTED, letterSpacing: "0.12em", display: "block", marginBottom: "6px", fontWeight: 600, textTransform: "uppercase" as const,
};

/* ─────────────────────────────────────────────
   DRAFT PERSISTENCE HELPERS
───────────────────────────────────────────── */
const DRAFT_STORAGE_PREFIX = "oulamauna_edit_draft_";

function draftKey(scholarId: string, lang: string) {
  return `${DRAFT_STORAGE_PREFIX}${scholarId}_${lang}`;
}

function saveLocalDraft(scholarId: string, lang: string, formData: any, draftVersionId: number | null) {
  try {
    localStorage.setItem(draftKey(scholarId, lang), JSON.stringify({ formData, draftVersionId, savedAt: Date.now() }));
  } catch (e) {
    console.warn("Could not save local draft:", e);
  }
}

function loadLocalDraft(scholarId: string, lang: string) {
  try {
    const raw = localStorage.getItem(draftKey(scholarId, lang));
    if (!raw) return null;
    
    const parsed = JSON.parse(raw);
    const twentyFourHoursInMs = 24 * 60 * 60 * 1000; 
    const isExpired = Date.now() - parsed.savedAt > twentyFourHoursInMs;
    
    if (isExpired) {
      clearLocalDraft(scholarId, lang);
      return null;
    }
    
    return parsed;
  } catch (e) {
    console.warn("Could not load local draft:", e);
    return null;
  }
}

function clearLocalDraft(scholarId: string, lang: string) {
  try {
    localStorage.removeItem(draftKey(scholarId, lang));
  } catch (e) { /* ignore */ }
}

/* ─────────────────────────────────────────────
   SMALL REUSABLE COMPONENTS
───────────────────────────────────────────── */
function Icon({ name, size = 20, style }: { name: string; size?: number; style?: React.CSSProperties }) {
  return <span className="material-symbols-outlined" style={{ fontSize: `${size}px`, lineHeight: 1, userSelect: "none", ...style }}>{name}</span>;
}

function FocusInput({ style, hasError, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { hasError?: boolean }) {
  const [focused, setFocused] = useState(false);
  return <input {...props} style={{ ...inputStyle, borderColor: focused ? GREEN : hasError ? DANGER : BORDER, ...style }} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} />;
}

function FocusTextarea({ style, hasError, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { hasError?: boolean }) {
  const [focused, setFocused] = useState(false);
  return <textarea {...props} style={{ ...inputStyle, resize: "vertical", minHeight: "80px", borderColor: focused ? GREEN : hasError ? DANGER : BORDER, ...style }} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} />;
}

function PreservedBadge() {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "3px 8px", borderRadius: "4px", backgroundColor: "rgba(112, 121, 116, 0.1)", color: MUTED, fontSize: "9px", fontWeight: 700, letterSpacing: "0.1em", ...MONO }}>
      <Icon name="lock" size={12} /> PRESERVED
    </span>
  );
}

function PreservedNote() {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", padding: "12px 16px", marginBottom: "24px", backgroundColor: "rgba(11,67,53,0.04)", border: "1px solid rgba(11,67,53,0.12)", borderRadius: "8px" }}>
      <Icon name="info" size={18} style={{ color: GREEN, marginTop: "1px", flexShrink: 0 }} />
      <p style={{ margin: 0, fontSize: "12px", color: "#404945", lineHeight: 1.5 }}>
        <strong style={{ color: GREEN }}>Note:</strong> Works and media are preserved from the approved version and cannot be modified in this edit form.
      </p>
    </div>
  );
}

function SectionCard({ icon, eyebrow, title, children }: { icon: string; eyebrow: string; title: string; children: React.ReactNode }) {
  return (
    <section className="edit-responsive-card" style={{ backgroundColor: "#fff", border: "1.5px solid rgba(192,201,195,0.4)", borderRadius: "16px", padding: "32px", marginBottom: "28px", minWidth: 0, overflow: "hidden" }}>
      <div style={{ marginBottom: "20px" }}>
        <p style={{ ...MONO, fontSize: "9px", color: GREEN, letterSpacing: "0.2em", marginBottom: "10px", display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ width: "16px", height: "1px", backgroundColor: GREEN, display: "inline-block", flexShrink: 0 }} />
          {eyebrow}
        </p>
        <h2 style={{ ...SERIF, fontSize: "20px", fontWeight: 700, color: "#191c1b", margin: 0, display: "flex", alignItems: "center", gap: "10px" }}>
          <Icon name={icon} size={20} />{title}
        </h2>
      </div>
      {children}
    </section>
  );
}

function TagInput({ tags, onChange, placeholder }: { tags: string[]; onChange: (t: string[]) => void; placeholder?: string }) {
  const [val, setVal] = useState("");
  const add = () => { if (!val.trim()) return; onChange([...tags, val.trim()]); setVal(""); };
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", padding: "9px 10px", border: `1.5px solid ${BORDER}`, borderRadius: "8px", backgroundColor: "#fafbf8" }}>
      {tags.map((tag, i) => (
        <span key={i} style={{ display: "flex", alignItems: "center", gap: "4px", backgroundColor: GREEN, color: "#fff", fontSize: "11px", fontWeight: 600, padding: "3px 6px 3px 10px", borderRadius: "999px" }}>
          {tag}
          {/* ✅ FIX: onMouseDown prevents input blur (which was causing errors while tapping) */}
          <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => onChange(tags.filter((_, idx) => idx !== i))} style={{ background: "none", border: "none", cursor: "pointer", color: "#fff", display: "flex", padding: 0, opacity: 0.7 }}>×</button>
        </span>
      ))}
      <input value={val} onChange={(e) => setVal(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }} onBlur={add} placeholder={placeholder ?? "Type and press Enter…"} style={{ flex: 1, minWidth: "120px", border: "none", outline: "none", fontSize: "12px", backgroundColor: "transparent", padding: "3px 4px" }} />
    </div>
  );
}

function DisciplineSelector({ selected, options, onChange }: { selected: number[]; options: DisciplineOption[]; onChange: (ids: number[]) => void }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
      {options.map(opt => {
        const isSelected = selected.includes(opt.discipline_id);
        return (
          <button 
            key={opt.discipline_id} 
            type="button" 
            onMouseDown={(e) => e.preventDefault()} 
            onClick={() => isSelected ? onChange(selected.filter(id => id !== opt.discipline_id)) : onChange([...selected, opt.discipline_id])}
            onMouseEnter={e => { 
              if (!isSelected) { 
                (e.currentTarget as HTMLButtonElement).style.borderColor = GREEN; 
                (e.currentTarget as HTMLButtonElement).style.color = GREEN; 
              } 
            }}
            onMouseLeave={e => { 
              if (!isSelected) { 
                (e.currentTarget as HTMLButtonElement).style.borderColor = BORDER; 
                (e.currentTarget as HTMLButtonElement).style.color = MUTED; 
              } 
            }}
            style={{ 
              padding: "6px 14px", 
              border: `1.5px solid ${isSelected ? GREEN : BORDER}`, 
              borderRadius: "20px", 
              background: isSelected ? GREEN : "transparent", 
              color: isSelected ? "#fff" : MUTED, 
              fontFamily: MONO.fontFamily, 
              fontSize: "10px", 
              fontWeight: 700, 
              cursor: "pointer", 
              transition: "all 0.15s", 
              letterSpacing: "0.06em" 
            }}
          >
            {opt.name}
          </button>
        );
      })}
    </div>
  );
}

function ItemCard({ index, label, onRemove, children }: { index: number; label: string; onRemove: () => void; children: React.ReactNode }) {
  return (
    <div style={{ border: `1.5px solid ${BORDER}`, borderRadius: "12px", padding: "24px", marginBottom: "14px", background: "#fafbf8", transition: "all 0.2s ease" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
        <span style={{ ...MONO, fontSize: "10px", color: GREEN, fontWeight: 700, letterSpacing: "0.1em" }}>{label} {index + 1}</span>
        {/* ✅ FIX: onMouseDown prevents input blur */}
        <button onMouseDown={(e) => e.preventDefault()} onClick={onRemove} style={{ background: "none", border: "none", cursor: "pointer", color: MUTED, fontSize: "20px", lineHeight: 1, display: "flex", alignItems: "center", padding: "2px", borderRadius: "4px", transition: "color 0.15s" }}
          onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.color = DANGER}
          onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.color = MUTED}>×</button>
      </div>
      {children}
    </div>
  );
}

function AddBtn({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button 
      type="button" 
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick} 
      style={{ 
        width: "100%", 
        padding: "12px", 
        border: `1.5px dashed ${BORDER}`, 
        borderRadius: "10px", 
        background: "transparent", 
        color: MUTED, 
        fontFamily: MONO.fontFamily, 
        fontSize: "10px", 
        fontWeight: 700, 
        letterSpacing: "0.1em", 
        cursor: "pointer", 
        transition: "all 0.15s", 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center", 
        gap: "6px", 
        marginTop: "4px" 
      }}
      onMouseEnter={e => { 
        const b = e.currentTarget as HTMLButtonElement; 
        b.style.borderColor = GREEN; 
        b.style.color = GREEN; 
        b.style.background = GREEN_LIGHT; 
      }}
      onMouseLeave={e => { 
        const b = e.currentTarget as HTMLButtonElement; 
        b.style.borderColor = BORDER; 
        b.style.color = MUTED; 
        b.style.background = "transparent"; 
      }}>
      <Icon name="add_circle" size={15} /> {children}
    </button>
  );
}

/* ────────────────────────────────────────────
   PERSON LINK SECTION
───────────────────────────────────────────── */
function PersonLinkSection({ 
  person, 
  onChange, 
  lang,
  selectedScholarIds 
}: { 
  person: PersonEntry; 
  onChange: (p: PersonEntry) => void; 
  lang: string;
  selectedScholarIds: number[];
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const onInput = async (q: string) => {
    setQuery(q);
    if (q.length < 2) { setResults([]); setOpen(false); return; }
    setLoading(true);
    try {
      const res = await scholarsApi.searchByName(q, lang);
      let scholars = res.data?.scholar_versions?.map((v: any) => ({
        id: v.version_id,
        name: v.canonical_name,
      })) || [];
      
      scholars = scholars.filter(s => !selectedScholarIds.includes(s.id));
      
      setResults(scholars);
      setOpen(true);
    } catch (error) { 
      console.error("Search error:", error); 
      setResults([]); 
    } finally { 
      setLoading(false); 
    }
  };

  if (person.scholar_id) {
    return (
      <div ref={ref} style={{ position: "relative" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 14px", background: GREEN_LIGHT, border: `1.5px solid ${GREEN_BORDER}`, borderRadius: "8px" }}>
          <div style={{ flex: 1 }}><div style={{ fontSize: "13px", fontWeight: 700, color: GREEN }}>{person.scholar_name}</div></div>
          {/* ✅ FIX: onMouseDown prevents input blur */}
          <button onMouseDown={(e) => e.preventDefault()} onClick={() => onChange({ scholar_id: null, scholar_name: "" })} style={{ background: "none", border: "none", cursor: "pointer", color: DANGER, fontSize: "18px", display: "flex", alignItems: "center" }}>×</button>
        </div>
      </div>
    );
  }

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <div style={{ position: "relative" }}>
        <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: MUTED, display: "flex", alignItems: "center" }}><Icon name="search" size={16} /></span>
        <FocusInput type="text" value={query} onChange={e => onInput(e.target.value)} placeholder={loading ? "Searching..." : "Search scholar by name..."} style={{ paddingLeft: "36px" }} />
      </div>
      {open && (
        <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, background: "#fff", border: `1.5px solid ${GREEN_BORDER}`, borderRadius: "8px", boxShadow: "0 8px 32px rgba(11,67,53,0.12)", zIndex: 100, maxHeight: "200px", overflowY: "auto" }}>
          {results.length === 0 ? (
            <div style={{ padding: "12px 14px", fontSize: "12px", color: MUTED, fontStyle: "italic" }}>{loading ? "Searching..." : "No scholars found"}</div>
          ) : results.map((s) => {
            const isAlreadySelected = selectedScholarIds.includes(s.id);
            return (
              <div 
                key={s.id} 
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  if (isAlreadySelected) return;
                  onChange({ scholar_id: s.id, scholar_name: s.name }); 
                  setOpen(false); 
                  setQuery(""); 
                }}
                style={{ 
                  padding: "10px 14px", 
                  cursor: isAlreadySelected ? "not-allowed" : "pointer", 
                  borderBottom: `1px solid rgba(192,201,195,0.2)`, 
                  transition: "background 0.12s",
                  opacity: isAlreadySelected ? 0.5 : 1,
                  backgroundColor: isAlreadySelected ? "#f5f5f5" : "transparent"
                }}
                onMouseEnter={e => {
                  if (!isAlreadySelected) (e.currentTarget as HTMLDivElement).style.background = GREEN_LIGHT;
                }}
                onMouseLeave={e => {
                  if (!isAlreadySelected) (e.currentTarget as HTMLDivElement).style.background = "transparent";
                }}
              >
                <div style={{ fontSize: "13px", fontWeight: 700, color: "#191c1b" }}>{s.name}</div>
                {isAlreadySelected && <div style={{ fontSize: "11px", color: DANGER, marginTop: "2px" }}>Already added</div>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   FOOTER BUTTONS (with hover, like Submit page)
───────────────────────────────────────────── */
function FooterCancelButton({ onClick, label }: { onClick: () => void; label: string }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "inline-flex", alignItems: "center", gap: "6px",
        padding: "8px 20px", border: `1.5px solid ${hovered ? MUTED : BORDER}`, borderRadius: "6px",
        backgroundColor: hovered ? "rgba(112, 121, 116, 0.08)" : "transparent", color: MUTED, fontSize: "11px", fontWeight: 700,
        letterSpacing: "0.05em", cursor: "pointer", transition: "all 0.15s", ...MONO,
      }}
    >
      {label}
    </button>
  );
}

function FooterSubmitButton({ onClick, label, disabled, submitting }: { onClick: (e: React.FormEvent) => void; label: string; disabled?: boolean; submitting?: boolean }) {
  const [hovered, setHovered] = useState(false);
  const active = hovered && !disabled && !submitting;
  return (
    <button
      type="submit"
      onClick={onClick}
      disabled={disabled || submitting}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "inline-flex", alignItems: "center", gap: "6px",
        padding: "8px 20px", border: `1.5px solid ${disabled || submitting ? "#c0c9c3" : GREEN}`, borderRadius: "6px",
        backgroundColor: disabled || submitting ? "#c0c9c3" : (active ? "#fbf9f4" : GREEN), 
        color: disabled || submitting ? "#fff" : (active ? GREEN : "#fff"), 
        fontSize: "11px", fontWeight: 700,
        letterSpacing: "0.05em", cursor: disabled || submitting ? "not-allowed" : "pointer", 
        transition: "all 0.15s", ...MONO,
        opacity: submitting ? 0.8 : 1
      }}
    >
      {submitting ? (
        <>
          <span style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", display: "inline-block", animation: "submit-spin 0.7s linear infinite" }} />
          Submitting...
        </>
      ) : (
        <><Icon name="send" size={14} /> {label}</>
      )}
    </button>
  );
}

/* ─────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────── */
const EditScholarPage: React.FC = () => {
  const { lang, id } = useParams<{ lang: Language; id: string }>();
  const [searchParams] = useSearchParams();
  const urlDraftId = searchParams.get("draftId"); 
  const urlRejectedId = searchParams.get("rejectedId"); 
  const navigate = useNavigate();
  const { t, setLang } = useLang();
  
  const activeLang: Language = (lang === "AR" || lang === "FR" || lang === "EN") ? lang : "EN";
  const isRTL = activeLang === "AR";
  const isUIRTL = activeLang === "AR";
  const crumbSep = isUIRTL ? " < " : " > ";

  const [data, setData] = useState<LocalScholarData | null>(null);
  const [loading, setLoading] = useState(true);
  const [regions, setRegions] = useState<RegionOption[]>([]);
  const [disciplines, setDisciplines] = useState<DisciplineOption[]>([]);
  
  const [draftVersionId, setDraftVersionId] = useState<number | null>(null);
  const [draftSavedPulse, setDraftSavedPulse] = useState(false);
  const [draftRestored, setDraftRestored] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    canonical_name: "",
    aliases: [] as string[],
    region_id: null as number | null,
    discipline_ids: [] as number[],
    century_hijri_start: "" as string | number,
    century_hijri_end: "" as string | number,
    century_gregorian_start: "" as string | number,
    century_gregorian_end: "" as string | number,
    biography: "",
    birth_date_gregorian: "",
    birth_date_hijri: "",
    death_date_gregorian: "",
    death_date_hijri: "",
    new_refs: [] as RefEntry[],
    new_teachers: [] as PersonEntry[],
    new_students: [] as PersonEntry[],
    portraitFile: null as File | null,
    currentImageUrl: null as string | null,
  });

  const selectedScholarIds = [
    ...formData.new_teachers.map(t => t.scholar_id).filter((id): id is number => id !== null),
    ...formData.new_students.map(s => s.scholar_id).filter((id): id is number => id !== null),
  ];

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (formData.canonical_name.trim() !== "" || formData.biography.trim() !== "") {
        e.preventDefault();
        e.returnValue = ""; 
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [formData.canonical_name, formData.biography]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [scholarRes, disciplinesRes, regionsRes] = await Promise.all([
          scholarsApi.getById(Number(id), activeLang),
          scholarsApi.getDisciplines(activeLang),
          scholarsApi.getRegions(activeLang),
        ]);

        const scholarData: LocalScholarData = scholarRes.data;
        const version = scholarData.scholar_versions[0] || {};

        const formattedDisciplines = (disciplinesRes.data || []).map((d: any) => ({
          discipline_id: d.discipline_id,
          name: d.name || d.discipline_translations?.[0]?.name || "Unknown",
        }));

        const formattedRegions = (regionsRes.data || []).map((r: any) => ({
          region_id: r.region_id,
          name: r.name,
        }));

        setRegions(formattedRegions);
        setDisciplines(formattedDisciplines);
        
        const currentRegionId = version.regions?.region_id || version.region_id || null;
        const birthGreg = version.scholar_dates?.find(d => d.date_type === "birth" && d.calendar === "gregorian");
        const birthHijri = version.scholar_dates?.find(d => d.date_type === "birth" && d.calendar === "hijri");
        const deathGreg = version.scholar_dates?.find(d => d.date_type === "death" && d.calendar === "gregorian");
        const deathHijri = version.scholar_dates?.find(d => d.date_type === "death" && d.calendar === "hijri");

        const initialFormData = {
          canonical_name: version.canonical_name || "",
          aliases: version.scholar_aliases?.map((a: any) => a.alias_name) || [],
          region_id: currentRegionId,
          discipline_ids: version.scholar_disciplines?.map((d: any) => d.discipline_id) || [],
          century_hijri_start: version.century_hijri_start ?? "",
          century_hijri_end: version.century_hijri_end ?? "",
          century_gregorian_start: version.century_gregorian_start ?? "",
          century_gregorian_end: version.century_gregorian_end ?? "",
          biography: version.biography || "",
          birth_date_gregorian: birthGreg?.year?.toString() || "",
          birth_date_hijri: birthHijri?.year?.toString() || "",
          death_date_gregorian: deathGreg?.year?.toString() || "",
          death_date_hijri: deathHijri?.year?.toString() || "",
          new_refs: [],
          new_teachers: [],
          new_students: [],
          portraitFile: null,
          currentImageUrl: version.image_url || null,
        };

        let finalFormData = initialFormData;
        let finalDraftVersionId: number | null = null;

        if (urlDraftId || urlRejectedId) {
          try {
            const versionIdToFetch = Number(urlDraftId || urlRejectedId);
            const draftRes = await scholarsApi.getVersionById(versionIdToFetch);
            const draft = draftRes.data;
            
            const birthGregDraft = draft.scholar_dates?.find((d: any) => d.date_type === "birth" && d.calendar === "gregorian");
            const birthHijriDraft = draft.scholar_dates?.find((d: any) => d.date_type === "birth" && d.calendar === "hijri");
            const deathGregDraft = draft.scholar_dates?.find((d: any) => d.date_type === "death" && d.calendar === "gregorian");
            const deathHijriDraft = draft.scholar_dates?.find((d: any) => d.date_type === "death" && d.calendar === "hijri");

            finalFormData = {
              canonical_name: draft.canonical_name || initialFormData.canonical_name,
              aliases: draft.scholar_aliases?.map((a: any) => a.alias_name) || initialFormData.aliases,
              region_id: draft.region_id ?? initialFormData.region_id,
              discipline_ids: draft.scholar_disciplines?.map((d: any) => d.discipline_id) || initialFormData.discipline_ids,
              century_hijri_start: draft.century_hijri_start ?? initialFormData.century_hijri_start,
              century_hijri_end: draft.century_hijri_end ?? initialFormData.century_hijri_end,
              century_gregorian_start: draft.century_gregorian_start ?? initialFormData.century_gregorian_start,
              century_gregorian_end: draft.century_gregorian_end ?? initialFormData.century_gregorian_end,
              biography: draft.biography || initialFormData.biography,
              birth_date_gregorian: birthGregDraft?.year?.toString() || initialFormData.birth_date_gregorian,
              birth_date_hijri: birthHijriDraft?.year?.toString() || initialFormData.birth_date_hijri,
              death_date_gregorian: deathGregDraft?.year?.toString() || initialFormData.death_date_gregorian,
              death_date_hijri: deathHijriDraft?.year?.toString() || initialFormData.death_date_hijri,
              new_refs: draft.scholar_references?.map((r: any) => ({ title: r.title, citation: r.citation, url: r.url || "" })) || [],
              new_teachers: draft.scholar_relationships_as_source?.filter((r: any) => r.relation_type === "teacher").map((r: any) => ({
                scholar_id: r.related_version_id,
                scholar_name: r.related_scholar_version?.canonical_name || ""
              })) || [],
              new_students: draft.scholar_relationships_as_source?.filter((r: any) => r.relation_type === "student").map((r: any) => ({
                scholar_id: r.related_version_id,
                scholar_name: r.related_scholar_version?.canonical_name || ""
              })) || [],
              portraitFile: null,
              currentImageUrl: draft.image_url || version.image_url || null,
            };
            finalDraftVersionId = draft.version_id;
            setDraftRestored(true);
          } catch (err) {
            console.error("Version was deleted or not found:", err);
            finalFormData = initialFormData;
            finalDraftVersionId = null;
            setDraftRestored(false);
            navigate(`/scholars/${id}/edit/${activeLang.toLowerCase()}`, { replace: true });
          }
        }

        setFormData(finalFormData);
        setDraftVersionId(finalDraftVersionId);
        setData(scholarData);
      } catch (err) {
        console.error("Failed to fetch scholar data", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
    if (activeLang) setLang(activeLang);
  }, [id, activeLang, setLang, urlDraftId]); 

  const handleSaveDraft = async () => {
    try {
      const version = data!.scholar_versions[0];
      
      const datesPayload = [];
      if (formData.birth_date_gregorian) datesPayload.push({ date_type: "birth", calendar: "gregorian", year: parseInt(formData.birth_date_gregorian), raw_text: formData.birth_date_gregorian, is_approximate: false });
      if (formData.birth_date_hijri) datesPayload.push({ date_type: "birth", calendar: "hijri", year: parseInt(formData.birth_date_hijri), raw_text: formData.birth_date_hijri, is_approximate: false });
      if (formData.death_date_gregorian) datesPayload.push({ date_type: "death", calendar: "gregorian", year: parseInt(formData.death_date_gregorian), raw_text: formData.death_date_gregorian, is_approximate: false });
      if (formData.death_date_hijri) datesPayload.push({ date_type: "death", calendar: "hijri", year: parseInt(formData.death_date_hijri), raw_text: formData.death_date_hijri, is_approximate: false });

      const relationshipsPayload = [
        ...formData.new_teachers.filter(t => t.scholar_id !== null).map(t => ({ related_version_id: t.scholar_id, relation_type: "teacher" })),
        ...formData.new_students.filter(s => s.scholar_id !== null).map(s => ({ related_version_id: s.scholar_id, relation_type: "student" })),
      ];

      if (urlRejectedId) {
        const payload = {
          draft_version_id: draftVersionId,
          scholar_id: Number(id),
          language_id: version.language_id,
          canonical_name: formData.canonical_name || null,
          region_id: formData.region_id,
          century_hijri_start: formData.century_hijri_start ? Number(formData.century_hijri_start) : null,
          century_hijri_end: formData.century_hijri_end ? Number(formData.century_hijri_end) : null,
          century_gregorian_start: formData.century_gregorian_start ? Number(formData.century_gregorian_start) : null,
          century_gregorian_end: formData.century_gregorian_end ? Number(formData.century_gregorian_end) : null,
          biography: formData.biography || null,
          aliases: formData.aliases,
          discipline_ids: formData.discipline_ids,
          dates: datesPayload.length > 0 ? datesPayload : undefined,
          references: formData.new_refs.filter(r => r.title || r.citation).map(r => ({ title: r.title, citation: r.citation, url: r.url || null })),
          relationships: relationshipsPayload.length > 0 ? relationshipsPayload : undefined,
          target_status: "draft"
        };

        await scholarsApi.updateRejected(Number(urlRejectedId), payload);
        clearLocalDraft(id!, activeLang);
        alert("Saved as draft successfully!");
        navigate('/dashboard');
        return;
      }

      const payload = {
        draft_version_id: draftVersionId,
        scholar_id: Number(id),
        language_id: version.language_id,
        canonical_name: formData.canonical_name || null,
        region_id: formData.region_id,
        century_hijri_start: formData.century_hijri_start ? Number(formData.century_hijri_start) : null,
        century_hijri_end: formData.century_hijri_end ? Number(formData.century_hijri_end) : null,
        century_gregorian_start: formData.century_gregorian_start ? Number(formData.century_gregorian_start) : null,
        century_gregorian_end: formData.century_gregorian_end ? Number(formData.century_gregorian_end) : null,
        biography: formData.biography || null,
        aliases: formData.aliases,
        discipline_ids: formData.discipline_ids,
        dates: datesPayload.length > 0 ? datesPayload : undefined,
        references: formData.new_refs.filter(r => r.title || r.citation).map(r => ({ title: r.title, citation: r.citation, url: r.url || null })),
        relationships: relationshipsPayload.length > 0 ? relationshipsPayload : undefined,
      };

      const response = await scholarsApi.saveDraft(payload);
      const newDraftId = response?.data?.draft_version_id;
      if (newDraftId) setDraftVersionId(newDraftId);
      clearLocalDraft(id!, activeLang);
      alert("Saved as draft successfully!");
      navigate('/dashboard');

    } catch (error: any) {
      console.error("Failed to save draft:", error);
      alert(error.message || "Could not save draft.");
    }
  };

    const handleDateChange = (field: string, value: string) => {
    const cleaned = value.replace(/[^0-9\-]/g, '');
    const currentGregorianYear = new Date().getFullYear();
    const currentHijriYear = parseInt(new Intl.DateTimeFormat('en-US-u-ca-islamic-umalqura', { year: 'numeric' }).format(new Date()));
    const MIN_YEAR = 1;
    const MAX_YEAR = 9999;
    
    setFormData(prevForm => {
      const newFormValues = { ...prevForm, [field]: cleaned };
      const birthG = newFormValues.birth_date_gregorian;
      const deathG = newFormValues.death_date_gregorian;
      const birthH = newFormValues.birth_date_hijri;
      const deathH = newFormValues.death_date_hijri;
      const newErrors: Record<string, string> = {};
      
      if (birthG) {
        const num = Number(birthG);
        if (isNaN(num) || birthG.endsWith('-') || birthG === '-') newErrors.birth_date_gregorian = "Invalid year";
        else if (num < MIN_YEAR || num > MAX_YEAR) newErrors.birth_date_gregorian = "Invalid year";
        else if (num > currentGregorianYear) newErrors.birth_date_gregorian = "Year cannot be in the future";
      }
      if (deathG) {
        const num = Number(deathG);
        if (isNaN(num) || deathG.endsWith('-') || deathG === '-') newErrors.death_date_gregorian = "Invalid year";
        else if (num < MIN_YEAR || num > MAX_YEAR) newErrors.death_date_gregorian = "Invalid year";
        else if (num > currentGregorianYear) newErrors.death_date_gregorian = "Year cannot be in the future";
      }
      if (birthG && deathG && !birthG.endsWith('-') && !deathG.endsWith('-') && birthG !== '-' && deathG !== '-') {
        const numB = Number(birthG), numD = Number(deathG);
        if (!isNaN(numB) && !isNaN(numD) && numB >= MIN_YEAR && numB <= MAX_YEAR && numD >= MIN_YEAR && numD <= MAX_YEAR) {
          if (numD < numB) newErrors.death_date_gregorian = "Death date cannot be before birth date";
        }
      }
      if (birthH) {
        const num = Number(birthH);
        if (isNaN(num) || birthH.endsWith('-') || birthH === '-') newErrors.birth_date_hijri = "Invalid year";
        else if (num < MIN_YEAR || num > MAX_YEAR) newErrors.birth_date_hijri = "Invalid year";
        else if (num > currentHijriYear) newErrors.birth_date_hijri = "Year cannot be in the future";
      }
      if (deathH) {
        const num = Number(deathH);
        if (isNaN(num) || deathH.endsWith('-') || deathH === '-') newErrors.death_date_hijri = "Invalid year";
        else if (num < MIN_YEAR || num > MAX_YEAR) newErrors.death_date_hijri = "Invalid year";
        else if (num > currentHijriYear) newErrors.death_date_hijri = "Year cannot be in the future";
      }
      if (birthH && deathH && !birthH.endsWith('-') && !deathH.endsWith('-') && birthH !== '-' && deathH !== '-') {
        const numB = Number(birthH), numD = Number(deathH);
        if (!isNaN(numB) && !isNaN(numD) && numB >= MIN_YEAR && numB <= MAX_YEAR && numD >= MIN_YEAR && numD <= MAX_YEAR) {
          if (numD < numB) newErrors.death_date_hijri = "Death date cannot be before birth date";
        }
      }
      
      setErrors(prev => {
        const updated = { ...prev };
        if (!newErrors.birth_date_gregorian) delete updated.birth_date_gregorian;
        if (!newErrors.death_date_gregorian) delete updated.death_date_gregorian;
        if (!newErrors.birth_date_hijri) delete updated.birth_date_hijri;
        if (!newErrors.death_date_hijri) delete updated.death_date_hijri;
        return { ...updated, ...newErrors };
      });
      return newFormValues;
    });
  };

  const handleCenturyChange = (field: string, value: string) => {
    const numValue = value === '' ? null : parseInt(value, 10);
    const currentGregorianCentury = Math.ceil(new Date().getFullYear() / 100);
    const currentHijriCentury = Math.ceil(parseInt(new Intl.DateTimeFormat('en-US-u-ca-islamic-umalqura', { year: 'numeric' }).format(new Date())) / 100);
    const MIN_CENTURY = 1;
    
    setFormData(prevForm => {
      const newFormValues = { ...prevForm, [field]: numValue };
      const gregStart = newFormValues.century_gregorian_start;
      const gregEnd = newFormValues.century_gregorian_end;
      const hijriStart = newFormValues.century_hijri_start;
      const hijriEnd = newFormValues.century_hijri_end;
      const newErrors: Record<string, string> = {};
      
      if (gregStart !== null && (isNaN(gregStart) || gregStart < MIN_CENTURY || gregStart > currentGregorianCentury)) {
        newErrors.century_gregorian_start = `Invalid century (must be 1-${currentGregorianCentury})`;
      }
      if (gregEnd !== null && (isNaN(gregEnd) || gregEnd < MIN_CENTURY || gregEnd > currentGregorianCentury)) {
        newErrors.century_gregorian_end = `Invalid century (must be 1-${currentGregorianCentury})`;
      }
      if (gregStart !== null && gregEnd !== null && !isNaN(gregStart) && !isNaN(gregEnd) && gregStart >= MIN_CENTURY && gregStart <= currentGregorianCentury && gregEnd >= MIN_CENTURY && gregEnd <= currentGregorianCentury) {
        if (gregEnd < gregStart) newErrors.century_gregorian_end = "End century cannot be before start century";
      }
      if (hijriStart !== null && (isNaN(hijriStart) || hijriStart < MIN_CENTURY || hijriStart > currentHijriCentury)) {
        newErrors.century_hijri_start = `Invalid century (must be 1-${currentHijriCentury})`;
      }
      if (hijriEnd !== null && (isNaN(hijriEnd) || hijriEnd < MIN_CENTURY || hijriEnd > currentHijriCentury)) {
        newErrors.century_hijri_end = `Invalid century (must be 1-${currentHijriCentury})`;
      }
      if (hijriStart !== null && hijriEnd !== null && !isNaN(hijriStart) && !isNaN(hijriEnd) && hijriStart >= MIN_CENTURY && hijriStart <= currentHijriCentury && hijriEnd >= MIN_CENTURY && hijriEnd <= currentHijriCentury) {
        if (hijriEnd < hijriStart) newErrors.century_hijri_end = "End century cannot be before start century";
      }
      
      setErrors(prev => {
        const updated = { ...prev };
        if (!newErrors.century_gregorian_start) delete updated.century_gregorian_start;
        if (!newErrors.century_gregorian_end) delete updated.century_gregorian_end;
        if (!newErrors.century_hijri_start) delete updated.century_hijri_start;
        if (!newErrors.century_hijri_end) delete updated.century_hijri_end;
        return { ...updated, ...newErrors };
      });
      return newFormValues;
    });
  };



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data) return;

    setIsSubmitting(true);

    const version = data.scholar_versions[0];

    const datesPayload = [];
    if (formData.birth_date_gregorian) datesPayload.push({ date_type: "birth", calendar: "gregorian", year: parseInt(formData.birth_date_gregorian), raw_text: formData.birth_date_gregorian, is_approximate: false });
    if (formData.birth_date_hijri) datesPayload.push({ date_type: "birth", calendar: "hijri", year: parseInt(formData.birth_date_hijri), raw_text: formData.birth_date_hijri, is_approximate: false });
    if (formData.death_date_gregorian) datesPayload.push({ date_type: "death", calendar: "gregorian", year: parseInt(formData.death_date_gregorian), raw_text: formData.death_date_gregorian, is_approximate: false });
    if (formData.death_date_hijri) datesPayload.push({ date_type: "death", calendar: "hijri", year: parseInt(formData.death_date_hijri), raw_text: formData.death_date_hijri, is_approximate: false });

    const relationshipsPayload = [
      ...formData.new_teachers.filter(t => t.scholar_id !== null).map(t => ({ related_version_id: t.scholar_id, relation_type: "teacher" })),
      ...formData.new_students.filter(s => s.scholar_id !== null).map(s => ({ related_version_id: s.scholar_id, relation_type: "student" })),
    ];

    const payload = {
      canonical_name: formData.canonical_name,
      biography: formData.biography,
      language_id: version.language_id,
      region_id: formData.region_id,
      century_hijri_start: formData.century_hijri_start ? Number(formData.century_hijri_start) : null,
      century_hijri_end: formData.century_hijri_end ? Number(formData.century_hijri_end) : null,
      century_gregorian_start: formData.century_gregorian_start ? Number(formData.century_gregorian_start) : null,
      century_gregorian_end: formData.century_gregorian_end ? Number(formData.century_gregorian_end) : null,
      aliases: formData.aliases,
      discipline_ids: formData.discipline_ids,
      dates: datesPayload.length > 0 ? datesPayload : undefined,
      new_references: formData.new_refs.filter(r => r.title || r.citation).map(r => ({ title: r.title, citation: r.citation, url: r.url || null })),
      new_relationships: relationshipsPayload.length > 0 ? relationshipsPayload : undefined,
    };

    try {
      const formDataObj = new FormData();
      formDataObj.append("data", JSON.stringify(payload));
      if (formData.portraitFile) formDataObj.append("image", formData.portraitFile);

      await scholarsApi.update(Number(id), formDataObj);
      console.log("✅ Edit submitted successfully");
      clearLocalDraft(id!, activeLang);
      
      // ✅ Show success message BEFORE routing
      alert("✅ Edit submitted successfully! Redirecting...");
      navigate(`/scholars/${id}`);
    } catch (error: any) {
      console.error("❌ Failed to submit edit:", error);
      // ✅ Show error message and keep user on page (reset loading state)
      alert("❌ Failed to submit edit proposal: " + (error.message || "Unknown error"));
      setIsSubmitting(false);
    }
  };

  if (loading || !data) {
    return <div style={{ padding: 40, textAlign: "center", ...MONO, color: MUTED }}>Loading scholar data...</div>;
  }

  const version = data.scholar_versions[0];

  return (
    <div dir={isUIRTL ? "rtl" : "ltr"} style={{ fontFamily: SANS.fontFamily, minHeight: "100vh", backgroundColor: "#f9faf7", color: "#191c1b" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Source+Serif+4:ital,opsz,wght@0,8..60,200..900;1,8..60,200..900&family=Source+Sans+3:ital,wght@0,200..900;1,200..900&family=JetBrains+Mono:ital,wght@0,100..800;1,100..800&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap');
        .material-symbols-outlined { font-variation-settings:'FILL' 0,'wght' 400,'GRAD' 0,'opsz' 24; font-family:'Material Symbols Outlined'; display:inline-block; vertical-align:middle; }
        * { box-sizing: border-box; }
        @keyframes step-fade-in { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes submit-spin { to { transform: rotate(360deg); } }
        
        /* ✅ RESPONSIVE LAYOUT */
        @media (max-width: 767px) {
          .edit-responsive-main-grid { grid-template-columns: 1fr !important; }
          .edit-responsive-img-grid { grid-template-columns: 1fr !important; }
          .edit-responsive-date-grid { grid-template-columns: 1fr !important; }
          .edit-responsive-rel-grid { grid-template-columns: 1fr !important; }
          .edit-responsive-header { padding: 0 16px !important; }
          .edit-responsive-main { padding: 24px 8px 80px 8px !important; }
          .edit-responsive-card { padding: 20px 16px !important; }
          .edit-responsive-img-box { width: 100% !important; max-width: 200px !important; }
        }
      `}</style>

      <header style={{ position: "sticky", top: 0, zIndex: 50, backgroundColor: "rgba(249,250,247,0.97)", backdropFilter: "blur(8px)", borderBottom: "1px solid rgba(192,201,195,0.3)", padding: "16px 0" }}>
        <div className="edit-responsive-header" style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 32px" }}>
          <div style={{ ...MONO, fontSize: "11px", color: MUTED, letterSpacing: "0.05em", marginBottom: "8px", display: "flex", alignItems: "center", gap: "4px" }}>
            <Link to="/" style={{ color: MUTED, textDecoration: "none" }}>{t("editScholar.breadcrumbHome") || "Home"}</Link>
            <span>{crumbSep}</span>
            <Link to="/scholars" style={{ color: MUTED, textDecoration: "none" }}>{t("editScholar.breadcrumbScholars") || "Scholars"}</Link>
            <span>{crumbSep}</span>
            <span style={{ color: GREEN, fontWeight: 700 }}>{t("editScholar.breadcrumbEdit") || "Edit Proposal"}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h1 style={{ ...SERIF, fontSize: "24px", fontWeight: 700, color: GREEN, margin: "0 0 4px" }}>{version.canonical_name}</h1>
              <p style={{ ...MONO, fontSize: "10px", color: GREEN, letterSpacing: "0.15em", margin: 0, fontWeight: 700 }}>
                {activeLang === "AR" ? "تعديل النسخة العربية" : activeLang === "FR" ? "Modification de la version française" : "Editing English Version"}
              </p>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button 
                type="button" 
                onClick={handleSaveDraft}
                onMouseEnter={e => { 
                  if (!draftSavedPulse) {
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor = GREEN;
                    (e.currentTarget as HTMLButtonElement).style.color = "#fff";
                  }
                }}
                onMouseLeave={e => { 
                  if (!draftSavedPulse) {
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent";
                    (e.currentTarget as HTMLButtonElement).style.color = GREEN;
                  }
                }}
                style={{ 
                  display: "inline-flex", alignItems: "center", gap: "6px",
                  padding: "8px 20px", border: `1.5px solid ${GREEN}`, borderRadius: "6px",
                  backgroundColor: draftSavedPulse ? GREEN : "transparent",
                  color: draftSavedPulse ? "#fff" : GREEN, fontSize: "11px", fontWeight: 700,
                  letterSpacing: "0.05em", cursor: "pointer", transition: "all 0.15s", ...MONO,
                }}
              >
                <Icon name={draftSavedPulse ? "check" : "draft"} size={14} /> 
                {draftSavedPulse ? "Saved!" : "Save as Draft"}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="edit-responsive-main" style={{ maxWidth: "1280px", margin: "0 auto", padding: "40px 32px 80px" }}>
        {draftRestored && (
          <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "12px 16px", background: "rgba(115,92,0,0.06)", border: "1px solid rgba(115,92,0,0.22)", borderRadius: "10px", marginBottom: "20px", animation: "step-fade-in 0.3s ease" }}>
            <span style={{ color: GOLD, flexShrink: 0 }}><Icon name="history" size={16} /></span>
            <span style={{ fontSize: "12px", color: "#5c4a00", lineHeight: 1.6, flex: 1 }}>A saved draft was restored. Your previous progress has been loaded.</span>
            <button onMouseDown={(e) => e.preventDefault()} onClick={() => setDraftRestored(false)} style={{ background: "none", border: "none", cursor: "pointer", color: GOLD, display: "flex", alignItems: "center", flexShrink: 0 }}><Icon name="close" size={16} /></button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="edit-responsive-main-grid" style={{ display: "grid", gridTemplateColumns: "340px 1fr", gap: "32px", alignItems: "start" }}>
          <aside style={{ minWidth: 0, display: "flex", flexDirection: "column", gap: "24px" }}>
            <SectionCard icon="edit" eyebrow="EDITABLE FIELDS" title={t("editScholar.basicInfo") || "Core Information"}>
              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                <div>
                  <label style={labelStyle}>{t("editScholar.fullName") || "Canonical Name"} *</label>
                  <FocusInput value={formData.canonical_name} onChange={(e) => setFormData({ ...formData, canonical_name: e.target.value })} required dir={isRTL ? "rtl" : "ltr"} />
                </div>
                <div>
                  <label style={labelStyle}>{t("editScholar.aliases") || "Aliases"}</label>
                  <TagInput tags={formData.aliases} onChange={(v) => setFormData({ ...formData, aliases: v })} placeholder={t("editScholar.addPersonPlaceholder") || "Add alias & press Enter"} />
                </div>
                <div>
                  <label style={labelStyle}>{t("editScholar.region") || "Region"}</label>
                  <select value={formData.region_id || ""} onChange={(e) => setFormData({ ...formData, region_id: e.target.value ? Number(e.target.value) : null })} style={{ ...inputStyle, cursor: "pointer" }} dir={isRTL ? "rtl" : "ltr"}>
                    <option value="">{activeLang === "AR" ? "اختر منطقة..." : activeLang === "FR" ? "Sélectionner une région..." : "Select a region..."}</option>
                    {regions.map(r => <option key={r.region_id} value={r.region_id}>{r.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>{t("editScholar.discipline") || "Disciplines"}</label>
                  <DisciplineSelector selected={formData.discipline_ids} options={disciplines} onChange={(ids) => setFormData({ ...formData, discipline_ids: ids })} />
                </div>
                <div style={{ borderTop: "1px solid rgba(192,201,195,0.3)", paddingTop: "20px" }}>
                  <label style={{ ...labelStyle, marginBottom: "12px" }}>{t("editScholar.centuryRanges") || "Century Ranges"}</label>
                  <div className="edit-responsive-date-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                    <div>
                      <label style={{ ...labelStyle, fontSize: "10px", color: "#404945" }}>Hijri Start</label>
                      <FocusInput type="number" value={formData.century_hijri_start} onChange={(e) => handleCenturyChange("century_hijri_start", e.target.value)} hasError={!!errors.century_hijri_start} />
                      {errors.century_hijri_start && <p style={{ fontSize: "10px", color: DANGER, marginTop: "4px", ...MONO }}>{errors.century_hijri_start}</p>}
                    </div>
                    <div>
                      <label style={{ ...labelStyle, fontSize: "10px", color: "#404945" }}>Hijri End</label>
                      <FocusInput type="number" value={formData.century_hijri_end} onChange={(e) => handleCenturyChange("century_hijri_end", e.target.value)} hasError={!!errors.century_hijri_end} />
                      {errors.century_hijri_end && <p style={{ fontSize: "10px", color: DANGER, marginTop: "4px", ...MONO }}>{errors.century_hijri_end}</p>}
                    </div>
                    <div>
                      <label style={{ ...labelStyle, fontSize: "10px", color: "#404945" }}>Gregorian Start</label>
                      <FocusInput type="number" value={formData.century_gregorian_start} onChange={(e) => handleCenturyChange("century_gregorian_start", e.target.value)} hasError={!!errors.century_gregorian_start} />
                      {errors.century_gregorian_start && <p style={{ fontSize: "10px", color: DANGER, marginTop: "4px", ...MONO }}>{errors.century_gregorian_start}</p>}
                    </div>
                    <div>
                      <label style={{ ...labelStyle, fontSize: "10px", color: "#404945" }}>Gregorian End</label>
                      <FocusInput type="number" value={formData.century_gregorian_end} onChange={(e) => handleCenturyChange("century_gregorian_end", e.target.value)} hasError={!!errors.century_gregorian_end} />
                      {errors.century_gregorian_end && <p style={{ fontSize: "10px", color: DANGER, marginTop: "4px", ...MONO }}>{errors.century_gregorian_end}</p>}
                    </div>
                  </div>
                </div>
                <div style={{ borderTop: "1px solid rgba(192,201,195,0.3)", paddingTop: "20px" }}>
                  <label style={{ ...labelStyle, marginBottom: "12px" }}>{t("editScholar.dates") || "Birth & Death Dates"}</label>
                  <div className="edit-responsive-date-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                    <div>
                      <label style={{ ...labelStyle, fontSize: "10px", color: "#404945" }}>Birth (Gregorian)</label>
                      <FocusInput type="number" value={formData.birth_date_gregorian} onChange={(e) => handleDateChange("birth_date_gregorian", e.target.value)} placeholder="e.g. 1905" hasError={!!errors.birth_date_gregorian} />
                      {errors.birth_date_gregorian && <p style={{ fontSize: "10px", color: DANGER, marginTop: "4px", ...MONO }}>{errors.birth_date_gregorian}</p>}
                    </div>
                    <div>
                      <label style={{ ...labelStyle, fontSize: "10px", color: "#404945" }}>Birth (Hijri)</label>
                      <FocusInput type="number" value={formData.birth_date_hijri} onChange={(e) => handleDateChange("birth_date_hijri", e.target.value)} placeholder="e.g. 1323" hasError={!!errors.birth_date_hijri} />
                      {errors.birth_date_hijri && <p style={{ fontSize: "10px", color: DANGER, marginTop: "4px", ...MONO }}>{errors.birth_date_hijri}</p>}
                    </div>
                    <div>
                      <label style={{ ...labelStyle, fontSize: "10px", color: "#404945" }}>Death (Gregorian)</label>
                      <FocusInput type="number" value={formData.death_date_gregorian} onChange={(e) => handleDateChange("death_date_gregorian", e.target.value)} placeholder="e.g. 1973" hasError={!!errors.death_date_gregorian} />
                      {errors.death_date_gregorian && <p style={{ fontSize: "10px", color: DANGER, marginTop: "4px", ...MONO }}>{errors.death_date_gregorian}</p>}
                    </div>
                    <div>
                      <label style={{ ...labelStyle, fontSize: "10px", color: "#404945" }}>Death (Hijri)</label>
                      <FocusInput type="number" value={formData.death_date_hijri} onChange={(e) => handleDateChange("death_date_hijri", e.target.value)} placeholder="e.g. 1393" hasError={!!errors.death_date_hijri} />
                      {errors.death_date_hijri && <p style={{ fontSize: "10px", color: DANGER, marginTop: "4px", ...MONO }}>{errors.death_date_hijri}</p>}
                    </div>
                  </div>
                </div>
              </div>
            </SectionCard>
          </aside>

          <div style={{ minWidth: 0 }}>
            <SectionCard icon="image" eyebrow="EDITABLE" title="Scholar Portrait">
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}>
                {/* Hidden file input */}
                <input
                  type="file"
                  accept="image/*"
                  id="portrait-upload"
                  style={{ display: "none" }}
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    setFormData(prev => ({
                      ...prev,
                      portraitFile: file,
                      currentImageUrl: file ? URL.createObjectURL(file) : prev.currentImageUrl
                    }));
                    // Reset input so the same file can be selected again if removed
                    (e.target as HTMLInputElement).value = "";
                  }}
                />
                
                {/* Clickable Image Box */}
                <div 
                  className="edit-responsive-img-box" 
                  style={{ 
                    width: "200px", 
                    height: "267px", 
                    borderRadius: "12px", 
                    overflow: "hidden", 
                    background: "#f3f4f1",
                    border: `1.5px dashed ${formData.portraitFile ? GREEN : BORDER}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    position: "relative",
                    cursor: "pointer",
                    transition: "all 0.2s"
                  }}
                  onClick={() => document.getElementById('portrait-upload')?.click()}
                  onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.borderColor = GREEN}
                  onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.borderColor = formData.portraitFile ? GREEN : BORDER}
                >
                  {formData.currentImageUrl ? (
                    <img 
                      src={formData.currentImageUrl} 
                      alt="Scholar portrait" 
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  ) : (
                    <div style={{ textAlign: "center", color: MUTED }}>
                      <Icon name="add_photo_alternate" size={48} />
                      <p style={{ fontSize: "12px", marginTop: "8px", fontWeight: 600 }}>Click to upload</p>
                    </div>
                  )}
                  
                  {/* Hover Overlay */}
                  <div 
                    style={{
                      position: "absolute", inset: 0, background: "rgba(11,67,53,0.6)", 
                      display: "flex", alignItems: "center", justifyContent: "center",
                      opacity: 0, transition: "opacity 0.2s"
                    }}
                    onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.opacity = "1"}
                    onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.opacity = "0"}
                  >
                    <span style={{ color: "#fff", fontSize: "12px", fontWeight: 700, ...MONO }}>MODIFY IMAGE</span>
                  </div>
                </div>

                {/* ✅ FIXED ORDER: File Name Display moved ABOVE buttons for better visual flow */}
                {formData.portraitFile && (
                  <p style={{ fontSize: "11px", color: MUTED, textAlign: "center", ...MONO, wordBreak: "break-all" }}>
                    Selected: {formData.portraitFile.name}
                  </p>
                )}

                {/* Action Buttons with Hover Effects */}
                <div style={{ display: "flex", gap: "12px" }}>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => document.getElementById('portrait-upload')?.click()}
                    onMouseEnter={e => { 
                      (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#fbf9f4"; 
                      (e.currentTarget as HTMLButtonElement).style.color = GREEN; 
                      (e.currentTarget as HTMLButtonElement).style.border = `1.5px solid ${GREEN}`;
                    }}
                    onMouseLeave={e => { 
                      (e.currentTarget as HTMLButtonElement).style.backgroundColor = GREEN; 
                      (e.currentTarget as HTMLButtonElement).style.color = "#fff"; 
                      (e.currentTarget as HTMLButtonElement).style.border = `1.5px solid transparent`;
                    }}
                    style={{
                      padding: "8px 16px",
                      background: GREEN,
                      border: `1.5px solid transparent`,
                      color: "#fff",
                      borderRadius: "6px",
                      fontFamily: MONO.fontFamily,
                      fontSize: "10px",
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      transition: "all 0.15s"
                    }}
                  >
                    <Icon name="edit" size={14} /> Modify
                  </button>
                  
                  {formData.currentImageUrl && (
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        setFormData(prev => ({ ...prev, portraitFile: null, currentImageUrl: version.image_url || null }));
                        const input = document.getElementById('portrait-upload') as HTMLInputElement;
                        if (input) input.value = "";
                      }}
                      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "rgba(179,38,30,0.08)"; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent"; }}
                      style={{
                        padding: "8px 16px",
                        background: "transparent",
                        border: `1.5px solid ${DANGER}`,
                        color: DANGER,
                        borderRadius: "6px",
                        fontFamily: MONO.fontFamily,
                        fontSize: "10px",
                        fontWeight: 700,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        transition: "background 0.15s"
                      }}
                    >
                      <Icon name="delete" size={14} /> Remove
                    </button>
                  )}
                </div>
              </div>
            </SectionCard>

            <SectionCard icon="description" eyebrow="EDITABLE FIELD" title={t("editScholar.biography") || "Biography"}>
              <label style={labelStyle}>{t("editScholar.biography") || "Biography Content"} *</label>
              <FocusTextarea value={formData.biography} onChange={(e) => setFormData({ ...formData, biography: e.target.value })} rows={12} dir={isRTL ? "rtl" : "ltr"} required />
              <p style={{ fontSize: "11px", color: "#c0c9c3", fontStyle: "italic", margin: "8px 0 0" }}>
                {t("editScholar.biographyHint") || "Supports rich text formatting. This content will be submitted for admin review."}
              </p>
            </SectionCard>

            <div style={{ opacity: 0.9 }}>
              <PreservedNote />

              <SectionCard icon="menu_book" eyebrow="PRESERVED DATA" title="Works & Publications">
                <div style={{ border: "1px solid rgba(192,201,195,0.4)", borderRadius: "12px", overflow: "hidden" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ backgroundColor: "#f3f4f1", borderBottom: "1.5px solid rgba(192,201,195,0.4)" }}>
                        {["TITLE", "YEAR", "FORMAT"].map((c) => (
                          <th key={c} style={{ ...MONO, padding: "10px 14px", textAlign: isRTL ? "right" : "left", fontSize: "9px", color: MUTED, letterSpacing: "0.1em", fontWeight: 700 }}>{c}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {(data.works || []).map((w, i) => (
                        <tr key={i} style={{ borderBottom: "1px solid #f0f1ee" }}>
                          <td style={{ ...SERIF, padding: "12px 14px", fontSize: "13px", fontWeight: 700, fontStyle: "italic" }}>{w.title}</td>
                          <td style={{ padding: "12px 14px", fontSize: "12px", color: MUTED }}>{w.year || "—"}</td>
                          <td style={{ padding: "12px 14px" }}>
                            <span style={{ ...MONO, fontSize: "9px", fontWeight: 700, padding: "3px 8px", borderRadius: "4px", backgroundColor: "rgba(11,67,53,0.08)", color: GREEN }}>{w.format}</span>
                          </td>
                        </tr>
                      ))}
                      {(data.works || []).length === 0 && (
                        <tr><td colSpan={3} style={{ padding: "24px", textAlign: "center", color: MUTED, fontSize: "13px" }}>No works recorded.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </SectionCard>

              <SectionCard icon="perm_media" eyebrow="PRESERVED DATA" title="Media Library">
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "14px" }}>
                  {(version.media || []).map((m, i) => {
                    const ext = m.media_url?.split(".").pop()?.toLowerCase() || "";
                    const iconName = ["mp3", "wav", "ogg", "m4a"].includes(ext) ? "mic" : ["mp4", "webm"].includes(ext) ? "movie" : "article";
                    return (
                      <div key={i} style={{ backgroundColor: "#f9faf7", padding: "18px", border: "1.5px solid rgba(192,201,195,0.4)", borderRadius: "12px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
                          <Icon name={iconName} size={26} style={{ color: MUTED }} />
                          <PreservedBadge />
                        </div>
                        <p style={{ fontSize: "13px", fontWeight: 700, margin: "0 0 4px", wordBreak: "break-word" }}>{m.title}</p>
                        <p style={{ fontSize: "11px", color: MUTED, margin: "0 0 8px", lineHeight: 1.5 }}>{m.description || "No description"}</p>
                      </div>
                    );
                  })}
                  {(version.media || []).length === 0 && <p style={{ fontSize: "12px", color: "#c0c9c3", fontStyle: "italic", margin: 0 }}>No media recorded.</p>}
                </div>
              </SectionCard>

              <SectionCard icon="format_quote" eyebrow="ADD NEW REFERENCES" title="Academic References">
                <p style={{ fontSize: "12px", color: MUTED, marginBottom: "16px", fontStyle: "italic" }}>Existing approved references are preserved. You may add new ones below for review.</p>
                
                {(data.references || []).length > 0 && (
                  <div style={{ marginBottom: "24px", padding: "16px", backgroundColor: "#f3f4f1", borderRadius: "8px", border: "1px solid rgba(192,201,195,0.3)" }}>
                    <p style={{ ...MONO, fontSize: "9px", color: GREEN, marginBottom: "12px", letterSpacing: "0.1em" }}>EXISTING APPROVED REFERENCES</p>
                    {(data.references || []).map((r, i) => (
                      <div key={i} style={{ display: "flex", gap: "12px", alignItems: "flex-start", padding: "8px 0", borderBottom: i < (data.references?.length || 0) - 1 ? "1px solid rgba(192,201,195,0.3)" : "none" }}>
                        <span style={{ ...MONO, fontSize: "10px", color: GREEN, fontWeight: 700, paddingTop: "2px", flexShrink: 0 }}>{i + 1}.</span>
                        <div>
                          <p style={{ ...SERIF, fontSize: "13px", fontWeight: 700, margin: "0 0 4px" }}>{r.title}</p>
                          <p style={{ fontSize: "12px", color: MUTED, margin: 0, lineHeight: 1.5 }}>{r.citation}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {formData.new_refs.map((r, i) => (
                  <ItemCard key={i} index={i} label="New Reference" onRemove={() => setFormData(prev => ({ ...prev, new_refs: prev.new_refs.filter((_, idx) => idx !== i) }))}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                      <div>
                        <label style={labelStyle}>Title *</label>
                        <FocusInput type="text" value={r.title} onChange={e => { const next = [...formData.new_refs]; next[i] = { ...next[i], title: e.target.value }; setFormData(prev => ({ ...prev, new_refs: next })); }} placeholder="e.g. Book Title" />
                      </div>
                      <div>
                        <label style={labelStyle}>Citation *</label>
                        <FocusInput type="text" value={r.citation} onChange={e => { const next = [...formData.new_refs]; next[i] = { ...next[i], citation: e.target.value }; setFormData(prev => ({ ...prev, new_refs: next })); }} placeholder="e.g. Author, Year, Publisher" />
                      </div>
                      <div>
                        <label style={labelStyle}>URL (Optional)</label>
                        <FocusInput type="url" value={r.url} onChange={e => { const next = [...formData.new_refs]; next[i] = { ...next[i], url: e.target.value }; setFormData(prev => ({ ...prev, new_refs: next })); }} placeholder="https://..." />
                      </div>
                    </div>
                  </ItemCard>
                ))}
                <AddBtn onClick={() => setFormData(prev => ({ ...prev, new_refs: [...prev.new_refs, { title: "", citation: "", url: "" }] }))}>Add New Reference</AddBtn>
              </SectionCard>

              <SectionCard icon="account_tree" eyebrow="ADD NEW RELATIONSHIPS" title="Teachers & Students">
                <p style={{ fontSize: "12px", color: MUTED, marginBottom: "16px", fontStyle: "italic" }}>Existing relationships are preserved. You may add new ones below for review.</p>

                {(version.scholar_relationships_as_source || []).length > 0 && (
                  <div style={{ marginBottom: "24px", padding: "16px", backgroundColor: "#f3f4f1", borderRadius: "8px", border: "1px solid rgba(192,201,195,0.3)" }}>
                    <p style={{ ...MONO, fontSize: "9px", color: GREEN, marginBottom: "12px", letterSpacing: "0.1em" }}>EXISTING APPROVED RELATIONSHIPS</p>
                    <div className="edit-responsive-rel-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                      {(version.scholar_relationships_as_source || []).map((rel, i) => (
                        <div key={i} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px", backgroundColor: "#fff", borderRadius: "8px", border: "1px solid rgba(192,201,195,0.3)" }}>
                          <div style={{ width: 32, height: 32, borderRadius: "50%", backgroundColor: GREEN, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                            {(rel.related_scholar_version?.canonical_name || "?").substring(0, 2).toUpperCase()}
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <p style={{ fontSize: "12px", fontWeight: 700, margin: "0 0 2px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                              {rel.related_scholar_version?.canonical_name || "Unknown"}
                            </p>
                            <span style={{ ...MONO, fontSize: "9px", color: MUTED, textTransform: "uppercase" }}>{rel.relation_type}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div style={{ marginBottom: "24px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                    <label style={{ ...MONO, fontSize: "9px", color: GREEN, letterSpacing: "0.18em", textTransform: "uppercase" }}>Add Teachers</label>
                    <button 
                      type="button" 
                      onMouseDown={(e) => e.preventDefault()} 
                      onClick={() => setFormData(prev => ({ ...prev, new_teachers: [...prev.new_teachers, { scholar_id: null, scholar_name: "" }] }))} 
                      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = GREEN; (e.currentTarget as HTMLButtonElement).style.color = "#fff"; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; (e.currentTarget as HTMLButtonElement).style.color = GREEN; }}
                      style={{ padding: "6px 14px", border: `1.5px solid ${GREEN}`, borderRadius: "6px", background: "transparent", color: GREEN, fontFamily: MONO.fontFamily, fontSize: "9px", fontWeight: 700, letterSpacing: "0.1em", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "5px", transition: "all 0.15s" }}
                    >
                      <Icon name="add" size={13} /> Add Teacher
                    </button>
                  </div>
                  {formData.new_teachers.map((p, i) => (
                    <ItemCard key={i} index={i} label="Teacher" onRemove={() => setFormData(prev => ({ ...prev, new_teachers: prev.new_teachers.filter((_, idx) => idx !== i) }))}>
                      <PersonLinkSection 
                        person={p} 
                        onChange={np => { const next = [...formData.new_teachers]; next[i] = np; setFormData(prev => ({ ...prev, new_teachers: next })); }} 
                        lang={activeLang.toLowerCase()} 
                        selectedScholarIds={selectedScholarIds}
                      />
                    </ItemCard>
                  ))}
                </div>

                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                    <label style={{ ...MONO, fontSize: "9px", color: GREEN, letterSpacing: "0.18em", textTransform: "uppercase" }}>Add Students</label>
                    <button 
                      type="button" 
                      onMouseDown={(e) => e.preventDefault()} 
                      onClick={() => setFormData(prev => ({ ...prev, new_students: [...prev.new_students, { scholar_id: null, scholar_name: "" }] }))} 
                      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = GREEN; (e.currentTarget as HTMLButtonElement).style.color = "#fff"; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; (e.currentTarget as HTMLButtonElement).style.color = GREEN; }}
                      style={{ 
                        padding: "6px 14px", 
                        border: `1.5px solid ${GREEN}`, 
                        borderRadius: "6px", 
                        background: "transparent", 
                        color: GREEN, 
                        fontFamily: MONO.fontFamily, 
                        fontSize: "9px", 
                        fontWeight: 700, 
                        letterSpacing: "0.1em", 
                        cursor: "pointer", 
                        display: "inline-flex", 
                        alignItems: "center", 
                        gap: "5px",
                        transition: "all 0.15s" 
                      }}
                    >
                      <Icon name="add" size={13} /> Add Student
                    </button>
                  </div>
                  {formData.new_students.map((p, i) => (
                    <ItemCard key={i} index={i} label="Student" onRemove={() => setFormData(prev => ({ ...prev, new_students: prev.new_students.filter((_, idx) => idx !== i) }))}>
                      <PersonLinkSection 
                        person={p} 
                        onChange={np => { const next = [...formData.new_students]; next[i] = np; setFormData(prev => ({ ...prev, new_students: next })); }} 
                        lang={activeLang.toLowerCase()} 
                        selectedScholarIds={selectedScholarIds}
                      />
                    </ItemCard>
                  ))}
                </div>
              </SectionCard>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "32px", paddingTop: "24px", borderTop: "1px solid rgba(192,201,195,0.3)" }}>
              <FooterCancelButton 
                onClick={() => {
                  if (id) {
                    try {
                      localStorage.removeItem(`oulamauna_edit_draft_${id}_${activeLang}`);
                      console.log("✅ Draft cleared from localStorage");
                    } catch (e) {
                      console.error("Failed to clear draft:", e);
                    }
                  }
                  navigate(-1);
                }} 
                label="Cancel" 
              />
              <FooterSubmitButton 
                onClick={handleSubmit} 
                label={t("editScholar.saveChanges") || "Submit Edit Proposal"} 
                disabled={isSubmitting}
                submitting={isSubmitting}
              />
            </div>
          </div>
        </form>
      </main>
    </div>
  );
};

export default EditScholarPage;