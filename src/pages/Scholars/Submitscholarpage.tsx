import React, { useState, useRef, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useLang } from "../../context/LanguageContext";
import { scholarsApi } from "../../api/scholarsApi";

/* ─────────────────────────────────────────────
   TYPES
───────────────────────────────────────────── */
type Language = "EN" | "AR" | "FR";
type AccessMode = "none" | "upload" | "link";

interface MockScholar { id: number; name: string; initials: string; discipline: string; born: string; }
interface LinkedScholar { id: number; name: string; initials: string; discipline: string; }

interface PersonEntry {
  scholar_id: number | null;
  scholar_name: string;
}

interface WorkEntry {
  title: string;
  year: string;
  type: string;
  desc: string;
  accessMode: AccessMode;
  file: File | null;
  url: string;
}

interface MediaEntry {
  title: string;
  type: string;
  year: string;
  desc: string;
  accessMode: AccessMode;
  file: File | null;
  url: string;
}

interface RefEntry { title: string; citation: string; url: string; }

interface FormState {
  canonical_name: string;
  region_id: number | null;
  birth_date_gregorian: string;
  birth_date_hijri: string;
  death_date_gregorian: string;
  death_date_hijri: string;
  century_hijri_start: number | null;
  century_hijri_end: number | null;
  century_gregorian_start: number | null;
  century_gregorian_end: number | null;
  biography: string;
  aliases: string[];
  discipline_ids: number[];
  portraitUrl: string | null;
  portraitFile: File | null;
  pageTitle: string;
  summary: string;
  quote: string;
  teachers: PersonEntry[];
  students: PersonEntry[];
  works: WorkEntry[];
  media: MediaEntry[];
  refs: RefEntry[];
  confirmed: boolean;
}

/* ─────────────────────────────────────────────
   CONSTANTS & HELPERS
───────────────────────────────────────────── */
const LANGUAGES = [
  { language_id: 1, code: 'en', name: 'English' },
  { language_id: 3, code: 'ar', name: 'Arabic' },
  { language_id: 2, code: 'fr', name: 'French' },
];

const NATIVE_LANG_NAMES: Record<Language, string> = { EN: "English", AR: "العربية", FR: "Français" };

const MONO = "'JetBrains Mono', monospace";
const SERIF = "'Source Serif 4', 'Georgia', serif";
const SANS = "'Source Sans 3', system-ui, sans-serif";
const GREEN = "#0b4335";
const GREEN_DARK = "#285b4b";
const GREEN_LIGHT = "rgba(11,67,53,0.07)";
const GREEN_BORDER = "rgba(11,67,53,0.18)";
const BORDER = "rgba(192,201,195,0.5)";
const MUTED = "#707974";
const DANGER = "#b3261e";
const DANGER_BG = "rgba(179,38,30,0.06)";
const DANGER_BORDER = "rgba(179,38,30,0.35)";
const GOLD = "#735c00";

const WORK_FORMATS = [
  "BOOK", "ARTICLE", "TREATISE", "MANUSCRIPT", "LECTURE", "SERMON",
  "FATWA", "POEM", "LETTER", "COMMENTARY", "TRANSLATION", "RESEARCH",
  "COURSE", "DEVICE", "INVENTION", "SOFTWARE", "MAP", "OTHER"
];

const MEDIA_FILE_TYPES = ["pdf", "audio", "video"];

function emptyPerson(): PersonEntry { return { scholar_id: null, scholar_name: "" }; }
function emptyWork(): WorkEntry { return { title: "", type: "BOOK", year: "", desc: "", accessMode: "none", file: null, url: "" }; }
function emptyMedia(): MediaEntry { return { title: "", type: "pdf", year: "", desc: "", accessMode: "upload", file: null, url: "" }; }
function emptyRef(): RefEntry { return { title: "", citation: "", url: "" }; }

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").replace(/\u200B/g, "").trim();
}

function extractErrorMessage(error: any, fallback: string): string {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    (Array.isArray(error?.response?.data?.errors) ? error.response.data.errors.join(" ") : null) ||
    error?.message ||
    fallback
  );
}

/* ─────────────────────────────────────────────
   DRAFT PERSISTENCE (FIXED: Uses versionId to prevent overwriting)
───────────────────────────────────────────── */
const DRAFT_STORAGE_PREFIX = "oulamauna_scholar_draft_";
const SESSION_KEY = "oulamauna_draft_session";

// ✅ FIX: Add language to the key to prevent cross-language/scholar contamination
function draftKey(scholarId?: string, versionId?: number | null, lang?: string) {
  if (versionId) return `${DRAFT_STORAGE_PREFIX}v_${versionId}`; // Version is already unique to scholar+lang
  const langSuffix = lang ? `_${lang.toLowerCase()}` : '_default';
  if (scholarId) return `${DRAFT_STORAGE_PREFIX}s_${scholarId}${langSuffix}`;
  return `${DRAFT_STORAGE_PREFIX}new${langSuffix}`;
}

function saveDraft(scholarId: string | undefined, form: FormState, step: number, draftVersionId?: number | null, lang?: string) {
  try {
    const { portraitFile, portraitUrl, works, media, ...rest } = form;
    const serializable = {
      ...rest,
      works: works.map(({ file, ...w }) => w),
      media: media.map(({ file, ...m }) => m),
    };
    localStorage.setItem(draftKey(scholarId, draftVersionId, lang), JSON.stringify({ step, form: serializable, draftVersionId: draftVersionId ?? null, savedAt: Date.now() }));
    saveSession(scholarId, draftVersionId, lang); // ✅ Auto-save session too
  } catch (e) {
    console.warn("Could not save draft:", e);
  }
}

function loadDraft(scholarId: string | undefined, versionId?: number | null, lang?: string): { step: number; form: Partial<FormState>; draftVersionId: number | null } | null {
  try {
    const raw = localStorage.getItem(draftKey(scholarId, versionId, lang));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.form) return null;
    return { step: parsed.step ?? 0, form: parsed.form, draftVersionId: parsed.draftVersionId ?? null };
  } catch (e) {
    console.warn("Could not load draft:", e);
    return null;
  }
}

function saveSession(scholarId?: string, versionId?: number | null, lang?: string) {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify({ scholarId, versionId, lang }));
  } catch (e) { /* ignore */ }
}

function loadSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) { return null; }
}

function clearDraft(scholarId?: string, versionId?: number | null, lang?: string) {
  try { 
    localStorage.removeItem(draftKey(scholarId, versionId, lang)); 
    localStorage.removeItem(SESSION_KEY); 
  } catch (e) { /* ignore */ }
}

/* ─────────────────────────────────────────────
   SHARED STYLE HELPERS
───────────────────────────────────────────── */
const inputStyle: React.CSSProperties = { width: "100%", padding: "10px 14px", border: `1.5px solid ${BORDER}`, borderRadius: "8px", fontSize: "13px", color: "#191c1b", backgroundColor: "#fafbf8", fontFamily: SANS, outline: "none", transition: "border-color 0.15s" };
const labelStyle: React.CSSProperties = { fontFamily: MONO, fontSize: "9px", color: MUTED, letterSpacing: "0.12em", display: "block", marginBottom: "7px", textTransform: "uppercase" as const };
const sectionLabelStyle: React.CSSProperties = { fontFamily: MONO, fontSize: "9px", color: GREEN, letterSpacing: "0.18em", display: "block", marginBottom: "4px", textTransform: "uppercase" as const };

function FocusInput({ style, hasError, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { hasError?: boolean }) {
  const [focused, setFocused] = useState(false);
  return <input {...props} style={{ ...inputStyle, borderColor: focused ? GREEN : hasError ? DANGER : BORDER, ...style }} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} />;
}
function FocusSelect({ style, hasError, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { hasError?: boolean }) {
  const [focused, setFocused] = useState(false);
  return <select {...props} style={{ ...inputStyle, cursor: "pointer", borderColor: focused ? GREEN : hasError ? DANGER : BORDER, ...style }} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} />;
}
function FocusTextarea({ style, hasError, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { hasError?: boolean }) {
  const [focused, setFocused] = useState(false);
  return <textarea {...props} style={{ ...inputStyle, resize: "vertical", minHeight: "80px", borderColor: focused ? GREEN : hasError ? DANGER : BORDER, ...style }} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} />;
}
function Icon({ name, size = 20 }: { name: string; size?: number }) {
  return <span className="material-symbols-outlined" style={{ fontSize: `${size}px`, lineHeight: 1, verticalAlign: "middle", userSelect: "none" }}>{name}</span>;
}

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "4px", marginTop: "6px", fontSize: "11px", color: DANGER, fontWeight: 600, animation: "fade-in-up 0.25s ease-out" }}>
      <Icon name="error" size={12} /> {msg}
    </div>
  );
}

function ErrorBanner({ errors, title }: { errors: Record<string, string>; title: string }) {
  const messages = Object.values(errors);
  if (messages.length === 0) return null;
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", padding: "14px 16px", background: DANGER_BG, border: `1.5px solid ${DANGER_BORDER}`, borderRadius: "10px", marginBottom: "24px", animation: "fade-in-up 0.3s ease-out" }}>
      <span style={{ color: DANGER, flexShrink: 0, marginTop: "1px" }}><Icon name="error" size={18} /></span>
      <div>
        <div style={{ fontFamily: MONO, fontSize: "10px", color: DANGER, fontWeight: 700, letterSpacing: "0.08em", marginBottom: "6px" }}>{title}</div>
        <ul style={{ margin: 0, paddingLeft: "18px" }}>
          {messages.map((m, i) => (
            <li key={i} style={{ fontSize: "12px", color: "#7a231d", lineHeight: 1.6, animation: `fade-in-up 0.3s ease-out ${i * 0.05}s both` }}>
              {m}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function ChipInput({ items, onAdd, onRemove, placeholder }: { items: string[]; onAdd: (v: string) => void; onRemove: (i: number) => void; placeholder?: string; }) {
  const [val, setVal] = useState("");
  const submit = () => { const v = val.trim(); if (v && !items.includes(v)) { onAdd(v); setVal(""); } };
  return (
    <div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: items.length ? "10px" : "0" }}>
        {items.map((item, i) => (
          <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: "5px", padding: "4px 10px 4px 12px", background: GREEN, color: "#fff", borderRadius: "20px", fontFamily: MONO, fontSize: "10px", fontWeight: 700 }}>
            {item}
            <button onClick={() => onRemove(i)} style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", opacity: 0.7, fontSize: "14px", lineHeight: 1, display: "flex", alignItems: "center", padding: 0 }}>×</button>
          </span>
        ))}
      </div>
      <div style={{ display: "flex", gap: "8px" }}>
        <FocusInput type="text" value={val} onChange={e => setVal(e.target.value)} onKeyDown={e => e.key === "Enter" && (e.preventDefault(), submit())} placeholder={placeholder} />
        <button onClick={submit} style={{ padding: "8px 16px", border: `1.5px solid ${GREEN}`, borderRadius: "8px", background: "transparent", color: GREEN, fontFamily: MONO, fontSize: "10px", fontWeight: 700, letterSpacing: "0.08em", cursor: "pointer", whiteSpace: "nowrap", transition: "all 0.15s", flexShrink: 0 }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = GREEN; (e.currentTarget as HTMLButtonElement).style.color = "#fff"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; (e.currentTarget as HTMLButtonElement).style.color = GREEN; }}>+ ADD</button>
      </div>
    </div>
  );
}

function PersonLinkSection({ person, onChange, t, lang, selectedScholarIds }: { person: PersonEntry; onChange: (p: PersonEntry) => void; t: (k: string) => string; lang: string; selectedScholarIds: number[]; }) {
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
        discipline: v.scholar_disciplines?.[0]?.disciplines?.name || "Unknown",
        born: v.scholar_dates?.find((d: any) => d.date_type === "birth")?.year || "Unknown"
      })) || [];
      
      // ✅ FILTER OUT ALREADY SELECTED SCHOLARS
      scholars = scholars.filter(s => !selectedScholarIds.includes(s.id));
      
      setResults(scholars);
      setOpen(true);
    } catch (error) { console.error("Search error:", error); setResults([]); } finally { setLoading(false); }
  };

  if (person.scholar_id) {
    return (
      <div ref={ref} style={{ position: "relative" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 14px", background: GREEN_LIGHT, border: `1.5px solid ${GREEN_BORDER}`, borderRadius: "8px", animation: "fade-in 0.2s ease-out" }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "13px", fontWeight: 700, color: GREEN }}>{person.scholar_name}</div>
          </div>
          <button onClick={() => onChange({ scholar_id: null, scholar_name: "" })} style={{ background: "none", border: "none", cursor: "pointer", color: DANGER, fontSize: "18px", display: "flex", alignItems: "center" }}>×</button>
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
        <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, background: "#fff", border: `1.5px solid ${GREEN_BORDER}`, borderRadius: "8px", boxShadow: "0 8px 32px rgba(11,67,53,0.12)", zIndex: 100, maxHeight: "200px", overflowY: "auto", animation: "fade-in-up 0.15s ease-out" }}>
          {results.length === 0 ? (
            <div style={{ padding: "12px 14px", fontSize: "12px", color: MUTED, fontStyle: "italic" }}>{loading ? "Searching..." : "No scholars found"}</div>
          ) : results.map((s) => {
            const isAlreadySelected = selectedScholarIds.includes(s.id);
            return (
              <div 
                key={s.id} 
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
                <div style={{ fontFamily: MONO, fontSize: "10px", color: MUTED }}>{s.discipline} · b.{s.born}</div>
                {isAlreadySelected && <div style={{ fontSize: "11px", color: DANGER, marginTop: "2px" }}>Already added</div>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function UploadZone({ file, onFile, onRemove, accept, hint }: { file: File | null; onFile: (f: File) => void; onRemove: () => void; accept?: string; hint?: string; }) {
  const ref = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  if (file) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "12px 16px", background: GREEN_LIGHT, border: `1.5px solid ${GREEN_BORDER}`, borderRadius: "8px", animation: "fade-in 0.2s ease-out" }}>
        <Icon name="attach_file" size={18} />
        <span style={{ fontSize: "13px", fontWeight: 600, color: GREEN, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{file.name}</span>
        <span style={{ fontFamily: MONO, fontSize: "9px", color: MUTED }}>{(file.size / 1024 / 1024).toFixed(1)} MB</span>
        <button onClick={onRemove} style={{ background: "none", border: "none", cursor: "pointer", color: MUTED, display: "flex", alignItems: "center" }}><Icon name="close" size={16} /></button>
      </div>
    );
  }
  return (
    <>
      <input ref={ref} type="file" accept={accept} style={{ display: "none" }} onChange={e => { const f = e.target.files?.[0]; if (f) onFile(f); }} />
      <div onClick={() => ref.current?.click()} onDragOver={e => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)}
        onDrop={e => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files?.[0]; if (f) onFile(f); }}
        style={{ border: `2px dashed ${drag ? GREEN : BORDER}`, borderRadius: "10px", padding: "24px", textAlign: "center", cursor: "pointer", background: drag ? GREEN_LIGHT : "#fafbf8", transition: "all 0.15s" }}>
        <Icon name="cloud_upload" size={28} />
        <p style={{ fontSize: "13px", color: "#404945", margin: "8px 0 4px", fontWeight: 600 }}>Drop file here, or <span style={{ color: GREEN, textDecoration: "underline" }}>browse</span></p>
        <p style={{ fontFamily: MONO, fontSize: "9px", color: "#c0c9c3", margin: 0 }}>{hint}</p>
      </div>
    </>
  );
}

function Divider() { return <div style={{ height: "1px", background: "rgba(192,201,195,0.35)", margin: "28px 0" }} />; }

function AccessModeTabs({ mode, onChange, children, t }: { mode: AccessMode; onChange: (m: AccessMode) => void; children: React.ReactNode; t: (k: string) => string; }) {
  const tabStyle = (active: boolean): React.CSSProperties => ({ flex: 1, padding: "8px 0", textAlign: "center" as const, fontFamily: MONO, fontSize: "10px", fontWeight: 700, letterSpacing: "0.08em", border: "none", cursor: "pointer", transition: "all 0.15s", background: active ? GREEN : "transparent", color: active ? "#fff" : MUTED, display: "flex", alignItems: "center", justifyContent: "center", gap: "5px" });
  return (
    <div>
      <div style={{ display: "flex", border: `1.5px solid ${BORDER}`, borderRadius: "8px", overflow: "hidden", marginBottom: "12px" }}>
        <button style={tabStyle(mode === "none")} onClick={() => onChange("none")}><Icon name="block" size={13} /> {t("submitScholar.step4.none")}</button>
        <button style={{ ...tabStyle(mode === "upload"), borderLeft: `1px solid ${BORDER}`, borderRight: `1px solid ${BORDER}` }} onClick={() => onChange("upload")}><Icon name="upload_file" size={13} /> {t("submitScholar.step4.upload")}</button>
        <button style={tabStyle(mode === "link")} onClick={() => onChange("link")}><Icon name="link" size={13} /> {t("submitScholar.step4.link")}</button>
      </div>
      {children}
    </div>
  );
}

function DisciplineBtn({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return <button onClick={onClick} style={{ padding: "6px 14px", border: `1.5px solid ${active ? GREEN : BORDER}`, borderRadius: "20px", background: active ? GREEN : "transparent", color: active ? "#fff" : MUTED, fontFamily: MONO, fontSize: "10px", fontWeight: 700, cursor: "pointer", transition: "all 0.15s", letterSpacing: "0.06em" }}>{label}</button>;
}

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <div style={{ background: "#fff", border: "1px solid rgba(192,201,195,0.4)", borderRadius: "16px", padding: "40px", marginBottom: "20px", boxShadow: "0 2px 8px rgba(0,0,0,0.04)", ...style }}>{children}</div>;
}

function CardTitle({ num, title }: { num: string; title: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "32px", paddingBottom: "20px", borderBottom: "1px solid rgba(192,201,195,0.3)" }}>
      <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: GREEN, color: "#fff", fontFamily: MONO, fontSize: "12px", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{num}</div>
      <h2 style={{ fontFamily: SERIF, fontSize: "20px", fontWeight: 700, color: GREEN, margin: 0 }}>{title}</h2>
    </div>
  );
}

function ItemCard({ index, label, onRemove, children }: { index: number; label: string; onRemove: () => void; children: React.ReactNode }) {
  return (
    <div style={{ border: `1.5px solid ${BORDER}`, borderRadius: "12px", padding: "24px", marginBottom: "14px", background: "#fafbf8", transition: "all 0.2s ease" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
        <span style={{ fontFamily: MONO, fontSize: "10px", color: GREEN, fontWeight: 700, letterSpacing: "0.1em" }}>{label} {index + 1}</span>
        <button onClick={onRemove} style={{ background: "none", border: "none", cursor: "pointer", color: MUTED, fontSize: "20px", lineHeight: 1, display: "flex", alignItems: "center", padding: "2px", borderRadius: "4px", transition: "color 0.15s" }}
          onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.color = DANGER}
          onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.color = MUTED}>×</button>
      </div>
      {children}
    </div>
  );
}

function AddBtn({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} style={{ width: "100%", padding: "12px", border: `1.5px dashed ${BORDER}`, borderRadius: "10px", background: "transparent", color: MUTED, fontFamily: MONO, fontSize: "10px", fontWeight: 700, letterSpacing: "0.1em", cursor: "pointer", transition: "all 0.15s", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", marginTop: "4px" }}
      onMouseEnter={e => { const b = e.currentTarget as HTMLButtonElement; b.style.borderColor = GREEN; b.style.color = GREEN; b.style.background = GREEN_LIGHT; }}
      onMouseLeave={e => { const b = e.currentTarget as HTMLButtonElement; b.style.borderColor = BORDER; b.style.color = MUTED; b.style.background = "transparent"; }}>
      <Icon name="add_circle" size={15} /> {children}
    </button>
  );
}

function Spinner({ size = 14, color = "#fff" }: { size?: number; color?: string }) {
  return (
    <span style={{ width: size, height: size, border: `2px solid ${color}44`, borderTopColor: color, borderRadius: "50%", display: "inline-block", animation: "submit-spin 0.7s linear infinite" }} />
  );
}

const RichTextEditor = ({ value, onChange, placeholder }: { value: string; onChange: (val: string) => void; placeholder: string }) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [activeCmds, setActiveCmds] = useState<Record<string, boolean>>({});
  useEffect(() => { if (editorRef.current && editorRef.current.innerHTML !== value) { editorRef.current.innerHTML = value; } }, []);
  const updateActiveState = () => {
    if (!editorRef.current || !document.contains(editorRef.current)) return;
    const cmds = ['bold', 'italic', 'underline', 'insertUnorderedList', 'insertOrderedList'];
    const newState: Record<string, boolean> = {};
    cmds.forEach(cmd => { try { newState[cmd] = document.queryCommandState(cmd); } catch (e) {} });
    try { const block = document.queryCommandValue('formatBlock').toLowerCase(); newState['h2'] = block.includes('h2') || block.includes('heading'); newState['blockquote'] = block.includes('blockquote'); } catch (e) {}
    setActiveCmds(newState);
  };
  const exec = (command: string, val: string | undefined = undefined) => {
    editorRef.current?.focus();
    document.execCommand(command, false, val);
    updateActiveState();
    if (editorRef.current) onChange(editorRef.current.innerHTML);
  };
  const handleInput = () => { if (editorRef.current) { onChange(editorRef.current.innerHTML); } updateActiveState(); };
  const btnStyle = (isActive: boolean): React.CSSProperties => ({ background: isActive ? GREEN_LIGHT : "transparent", border: "none", cursor: "pointer", padding: "6px 10px", borderRadius: "4px", color: isActive ? GREEN : "#404945", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s", fontWeight: isActive ? 700 : 400 });
  return (
    <div style={{ border: `1.5px solid ${BORDER}`, borderRadius: "8px", overflow: "hidden", background: "#fff" }}>
      <div style={{ display: "flex", gap: "2px", padding: "6px 10px", background: "#f3f4f1", borderBottom: `1px solid ${BORDER}`, flexWrap: "wrap" }}>
        <button title="Bold" style={btnStyle(activeCmds['bold'])} onMouseDown={e => { e.preventDefault(); exec('bold'); }}><Icon name="format_bold" size={18} /></button>
        <button title="Italic" style={btnStyle(activeCmds['italic'])} onMouseDown={e => { e.preventDefault(); exec('italic'); }}><Icon name="format_italic" size={18} /></button>
        <div style={{ width: "1px", background: BORDER, margin: "0 4px" }} />
        <button title="Heading" style={btnStyle(activeCmds['h2'])} onMouseDown={e => { e.preventDefault(); exec('formatBlock', 'h2'); }}><span style={{ fontFamily: SERIF, fontSize: "16px", fontWeight: 700 }}>T</span></button>
        <button title="Quote" style={btnStyle(activeCmds['blockquote'])} onMouseDown={e => { e.preventDefault(); exec('formatBlock', 'blockquote'); }}><span style={{ fontFamily: SERIF, fontSize: "16px", fontWeight: 700, lineHeight: 1 }}>&ldquo;</span></button>
        <button title="List" style={btnStyle(activeCmds['insertUnorderedList'])} onMouseDown={e => { e.preventDefault(); exec('insertUnorderedList'); }}><Icon name="format_list_bulleted" size={18} /></button>
        <div style={{ width: "1px", background: BORDER, margin: "0 4px" }} />
        <button title="Link" style={btnStyle(false)} onMouseDown={e => { e.preventDefault(); const url = prompt("Enter URL:"); if (url) exec('createLink', url); }}><Icon name="link" size={18} /></button>
        <button title="Image" style={btnStyle(false)} onMouseDown={e => { e.preventDefault(); const url = prompt("Enter Image URL:"); if (url) exec('insertImage', url); }}><Icon name="image" size={18} /></button>
      </div>
      <div ref={editorRef} contentEditable suppressContentEditableWarning onInput={handleInput} onKeyUp={updateActiveState} onMouseUp={updateActiveState} onFocus={updateActiveState} data-placeholder={placeholder}
        style={{ minHeight: "400px", padding: "16px", fontFamily: SANS, fontSize: "14px", lineHeight: "1.8", color: "#191c1b", outline: "none", whiteSpace: "pre-wrap", wordBreak: "break-word" }} />
      <style>{`[contenteditable]:empty:before { content: attr(data-placeholder); color: ${MUTED}; pointer-events: none; display: block; } [contenteditable] blockquote { border-left: 3px solid ${GREEN}; margin: 10px 0; padding-left: 16px; color: #404945; font-style: italic; } [contenteditable] h2 { font-family: ${SERIF}; font-size: 20px; color: ${GREEN}; margin: 16px 0 8px 0; } [contenteditable] ul { padding-left: 24px; margin: 8px 0; } [contenteditable] a { color: ${GREEN}; text-decoration: underline; }`}</style>
    </div>
  );
};

/* ─────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────── */
const SubmitScholarPage: React.FC = () => {
  const { t, setLang } = useLang();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const urlDraftId = searchParams.get("draftId"); 
  const urlRejectedId = searchParams.get("rejectedId"); // ✅ NEW: Get rejectedId from URL

  const tt = (key: string, fallback: string) => {
    const val = t(key);
    return !val || val === key ? fallback : val;
  };

  const STEPS = [
    { id: "identity", num: "01", label: t("submitScholar.steps.identity") },
    { id: "relations", num: "02", label: t("submitScholar.steps.relations") },
    { id: "narrative", num: "03", label: t("submitScholar.steps.narrative") },
    { id: "works", num: "04", label: t("submitScholar.steps.works") },
    { id: "media", num: "05", label: t("submitScholar.steps.media") },
    { id: "refs", num: "06", label: t("submitScholar.steps.refs") },
    { id: "review", num: "07", label: t("submitScholar.steps.review") },
  ];

  const { scholarId, lang: routeLang } = useParams<{ scholarId?: string; lang?: string }>();
  
  const validRouteLang: Language | null = routeLang && (["en", "ar", "fr"] as string[]).includes(routeLang.toLowerCase()) 
    ? (routeLang.toUpperCase() as Language) 
    : null;

  const hasDraft = !!loadDraft(scholarId);
  const initialPhase: "lang" | "form" | "success" = validRouteLang ? "form" : "lang";

  const [phase, setPhase] = useState<"lang" | "form" | "success">(initialPhase);
  const [pickedLang, setPickedLang] = useState<Language>("EN");
  const lang: Language = validRouteLang ?? pickedLang;
  const [step, setStep] = useState(0);
  const topRef = useRef<HTMLDivElement>(null);
  const [successMessage, setSuccessMessage] = useState("");

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [draftRestored, setDraftRestored] = useState(false);
  const [draftSavedPulse, setDraftSavedPulse] = useState(false);
  const [draftVersionId, setDraftVersionId] = useState<number | null>(null);
  const [draftSaveError, setDraftSaveError] = useState<string | null>(null);

  const [form, setForm] = useState<FormState>({
    canonical_name: "", region_id: null, birth_date_gregorian: "", birth_date_hijri: "", death_date_gregorian: "", death_date_hijri: "",
    century_hijri_start: null, century_hijri_end: null, century_gregorian_start: null, century_gregorian_end: null,
    biography: "", aliases: [], discipline_ids: [], portraitUrl: null, portraitFile: null, pageTitle: "", summary: "", quote: "",
    teachers: [], students: [], works: [], media: [], refs: [], confirmed: false,
  });

  // ✅ Calculate selected IDs to pass down and prevent duplicates
  const selectedScholarIds = [
    ...form.teachers.map(t => t.scholar_id).filter((id): id is number => id !== null),
    ...form.students.map(s => s.scholar_id).filter((id): id is number => id !== null),
  ];

  const [disciplines, setDisciplines] = useState<{ discipline_id: number; name: string }[]>([]);
  const [regions, setRegions] = useState<{ region_id: number; name: string }[]>([]);
  const [isLoadingMeta, setIsLoadingMeta] = useState(true);
  const portraitInputRef = useRef<HTMLInputElement>(null);
  const loadedMetaLangRef = useRef<Language | null>(null);

    const draftLoadAttempted = useRef(false);

  // ✅ UNIFIED DRAFT LOADING LOGIC (Strictly isolated by versionId OR lang)
    // ✅ UNIFIED VERSION LOADING LOGIC (Handles both Drafts AND Rejected)
  useEffect(() => {
    if (phase !== "form" || draftLoadAttempted.current) return;
    draftLoadAttempted.current = true;

    const fetchAndMapVersion = async (idToFetch: number) => {
      try {
        // ✅ Use getVersionById which works for BOTH drafts and rejected versions!
        const response = await scholarsApi.getVersionById(idToFetch);
        const version = response.data;
        
        const mappedForm: Partial<FormState> = {
          canonical_name: version.canonical_name || "",
          region_id: version.region_id,
          birth_date_gregorian: version.scholar_dates?.find((d: any) => d.date_type === "birth" && d.calendar === "gregorian")?.year?.toString() || "",
          birth_date_hijri: version.scholar_dates?.find((d: any) => d.date_type === "birth" && d.calendar === "hijri")?.year?.toString() || "",
          death_date_gregorian: version.scholar_dates?.find((d: any) => d.date_type === "death" && d.calendar === "gregorian")?.year?.toString() || "",
          death_date_hijri: version.scholar_dates?.find((d: any) => d.date_type === "death" && d.calendar === "hijri")?.year?.toString() || "",
          century_hijri_start: version.century_hijri_start,
          century_hijri_end: version.century_hijri_end,
          century_gregorian_start: version.century_gregorian_start,
          century_gregorian_end: version.century_gregorian_end,
          biography: version.biography || "",
          aliases: version.scholar_aliases?.map((a: any) => a.alias_name) || [],
          discipline_ids: version.scholar_disciplines?.map((d: any) => d.discipline_id) || [],
          teachers: version.scholar_relationships_as_source?.filter((r: any) => r.relation_type === "teacher").map((r: any) => ({
            scholar_id: r.related_version_id,
            scholar_name: r.related_scholar_version?.canonical_name || ""
          })) || [],
          students: version.scholar_relationships_as_source?.filter((r: any) => r.relation_type === "student").map((r: any) => ({
            scholar_id: r.related_version_id,
            scholar_name: r.related_scholar_version?.canonical_name || ""
          })) || [],
          works: version.scholar_works?.map((w: any) => ({
            title: w.title || "", year: w.year?.toString() || "", type: w.format || "BOOK",
            desc: w.description || "", accessMode: w.media_url ? "link" : "none", file: null, url: w.media_url || "",
          })) || [],
          media: version.media?.map((m: any) => ({
            title: m.title || "", type: m.file_type || "pdf", year: m.year?.toString() || "",
            desc: m.description || "", accessMode: m.media_url ? "link" : "upload", file: null, url: m.media_url || "",
          })) || [],
          refs: version.scholar_references?.map((r: any) => ({ title: r.title || "", citation: r.citation || "", url: r.url || "" })) || [],
        };

        setForm(f => ({ ...f, ...mappedForm }));
        setDraftVersionId(version.version_id);
        setDraftRestored(true);
        saveSession(scholarId, version.version_id, lang);

        if (routeLang && (["en", "ar", "fr"] as string[]).includes(routeLang.toLowerCase())) {
           setPickedLang(routeLang.toUpperCase() as Language);
        }
      } catch (error) {
        console.error("Version not found or deleted:", error);
        setForm({
          canonical_name: "", region_id: null, birth_date_gregorian: "", birth_date_hijri: "", 
          death_date_gregorian: "", death_date_hijri: "", century_hijri_start: null, century_hijri_end: null, 
          century_gregorian_start: null, century_gregorian_end: null, biography: "", aliases: [], 
          discipline_ids: [], portraitUrl: null, portraitFile: null, pageTitle: "", summary: "", quote: "",
          teachers: [], students: [], works: [], media: [], refs: [], confirmed: false,
        });
        setDraftVersionId(null);
        setDraftRestored(false);
        navigate(`/scholars/submit/${lang.toLowerCase()}`, { replace: true });
      }
    };

    const loadLocalVersion = (versionId: number) => {
      const localDraft = loadDraft(scholarId, versionId, lang);
      if (localDraft && localDraft.form) {
        setForm(f => ({ ...f, ...localDraft.form }));
        setStep(localDraft.step || 0);
        setDraftVersionId(versionId);
        setDraftRestored(true);
        saveSession(scholarId, versionId, lang);
        return true;
      }
      return false;
    };

    // 1. Priority: URL param (from Dashboard "Continue" OR "Edit Rejected")
    if (urlDraftId || urlRejectedId) {
      const versionId = parseInt(urlDraftId || urlRejectedId!, 10);
      if (!loadLocalVersion(versionId)) {
        fetchAndMapVersion(versionId);
      }
      return; 
    }

    // 2. Fallback: Check Session Marker (for Page Refresh)
    const session = loadSession();
    if (session?.versionId) {
      if (!loadLocalVersion(session.versionId)) {
        fetchAndMapVersion(session.versionId);
      }
      return;
    }

    // 3. Last Resort: Local Storage (for brand new unsaved drafts)
    const draft = loadDraft(session?.scholarId || scholarId, null, lang);
    if (draft) {
      const isStaleUnsavedNewDraft = !session?.scholarId && !draft.draftVersionId;
      if (isStaleUnsavedNewDraft) {
        clearDraft(session?.scholarId || scholarId, null, lang);
      } else {
        setForm(f => ({ ...f, ...draft.form }));
        setStep(draft.step || 0);
        setDraftVersionId(draft.draftVersionId);
        setDraftRestored(true);
        saveSession(session?.scholarId || scholarId, draft.draftVersionId, lang);
      }
    }
  }, [phase, urlDraftId, urlRejectedId, scholarId, navigate, routeLang, lang]); // ✅ Added urlRejectedId


  const buildDraftPayload = () => {
    const selectedLang = LANGUAGES.find(l => l.code === lang.toLowerCase());

    const relationships = [
      ...form.teachers.filter(t => t.scholar_id !== null).map(t => ({ related_version_id: t.scholar_id, relation_type: "teacher" })),
      ...form.students.filter(s => s.scholar_id !== null).map(s => ({ related_version_id: s.scholar_id, relation_type: "student" })),
    ];

    const payload: any = {
      draft_version_id: draftVersionId,
      canonical_name: form.canonical_name || null,
      region_id: form.region_id,
      century_hijri_start: form.century_hijri_start,
      century_hijri_end: form.century_hijri_end,
      century_gregorian_start: form.century_gregorian_start,
      century_gregorian_end: form.century_gregorian_end,
      biography: form.biography || null,
      language_id: selectedLang?.language_id || null,
      aliases: form.aliases,
      discipline_ids: form.discipline_ids,
      dates: [
        form.birth_date_gregorian ? { date_type: "birth", calendar: "gregorian", year: parseInt(form.birth_date_gregorian), raw_text: form.birth_date_gregorian, is_approximate: false } : null,
        form.birth_date_hijri ? { date_type: "birth", calendar: "hijri", year: parseInt(form.birth_date_hijri), raw_text: form.birth_date_hijri, is_approximate: false } : null,
        form.death_date_gregorian ? { date_type: "death", calendar: "gregorian", year: parseInt(form.death_date_gregorian), raw_text: form.death_date_gregorian, is_approximate: false } : null,
        form.death_date_hijri ? { date_type: "death", calendar: "hijri", year: parseInt(form.death_date_hijri), raw_text: form.death_date_hijri, is_approximate: false } : null,
      ].filter(Boolean),
      references: form.refs.filter(r => r.title || r.citation).map(r => ({ title: r.title, citation: r.citation, url: r.url || null })),
      works: form.works.filter(w => w.title).map(w => ({
        title: w.title,
        year: w.year ? parseInt(w.year) : null,
        format: w.type,
        description: w.desc || null,
        media_url: w.accessMode === "link" ? w.url : null,
      })),
      media: form.media.filter(m => m.title).map(m => ({
        title: m.title,
        year: m.year ? parseInt(m.year) : null,
        description: m.desc || null,
        media_url: m.accessMode === "link" ? m.url : null,
      })),
      relationships: relationships.length > 0 ? relationships : undefined,
    };

    if (scholarId) payload.scholar_id = parseInt(scholarId, 10);

    return payload;
  };

    const manualSaveDraft = async () => {
    // 1. Handle Rejected Version
    if (urlRejectedId) {
      try {
        const payload = { ...buildDraftPayload(), target_status: "draft" };
        await scholarsApi.updateRejected(parseInt(urlRejectedId), payload);
        
        // ✅ Clear local storage immediately so it doesn't linger
        clearDraft(scholarId, parseInt(urlRejectedId), lang);
        
        alert("Saved as draft successfully!");
        navigate('/dashboard'); // ✅ Redirect to dashboard
        return;
      } catch (error: any) {
        console.error("Failed to save rejected as draft:", error);
        setDraftSaveError(extractErrorMessage(error, "Could not save."));
        return;
      }
    }

    // 2. Handle Normal Draft
    try {
      setDraftSaveError(null);
      const payload = buildDraftPayload();
      const response = await scholarsApi.saveDraft(payload);
      const newDraftVersionId = response?.data?.draft_version_id;
      
      if (newDraftVersionId) {
        setDraftVersionId(newDraftVersionId);
      }

      // ✅ Clear localStorage and session immediately after successful backend save
      clearDraft(scholarId, newDraftVersionId || draftVersionId, lang);

      alert("Saved as draft successfully!");
      
      // ✅ Navigate to dashboard immediately, preventing localStorage restore confusion
      navigate('/dashboard');
      
    } catch (error: any) {
      console.error("Failed to save draft to server:", error);
      setDraftSaveError(extractErrorMessage(error, "Could not save draft to server."));
    }
  };

    useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Only warn if we are in the form phase and there is actual data typed
      if (phase === "form" && (form.canonical_name.trim() !== "" || form.biography.trim() !== "")) {
        e.preventDefault();
        e.returnValue = ""; // Required for Chrome to show the warning
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [phase, form.canonical_name, form.biography]);


  useEffect(() => {
    const fetchMeta = async () => {
      if (phase !== "form") return;
      setIsLoadingMeta(true);
      try {
        const [discRes, regRes] = await Promise.all([scholarsApi.getDisciplines(lang.toLowerCase()), scholarsApi.getRegions(lang.toLowerCase())]);
        setDisciplines(discRes.data || discRes || []);
        setRegions(regRes.data || regRes || []);
        if (loadedMetaLangRef.current !== null && loadedMetaLangRef.current !== lang) {
          upd("region_id", null);
          upd("discipline_ids", []);
        }
        loadedMetaLangRef.current = lang;
      } catch (error) { console.error("Failed to fetch meta data:", error); } finally { setIsLoadingMeta(false); }
    };
    fetchMeta();
  }, [lang, phase]);

  const scrollTop = () => { setTimeout(() => topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50); };

  const validateStep = (stepIndex: number): Record<string, string> => {
    const errs: Record<string, string> = {};
    switch (stepIndex) {
      case 0:
        if (!form.canonical_name.trim()) errs.canonical_name = tt("submitScholar.errors.canonicalName", "Canonical name is required.");
        if (!form.region_id) errs.region_id = tt("submitScholar.errors.region", "Please select a region.");
        if (form.discipline_ids.length === 0) errs.discipline_ids = tt("submitScholar.errors.disciplines", "Select at least one discipline.");
        break;
      case 2:
        if (!stripHtml(form.biography)) errs.biography = tt("submitScholar.errors.biography", "Biography is required.");
        break;
      case 3:
        form.works.forEach((w, i) => {
          if (!w.title.trim()) errs[`work_${i}_title`] = t("submitScholar.errors.workTitle") || `Work ${i + 1}: title is required.`;
          if (!w.year.trim()) errs[`work_${i}_year`] = t("submitScholar.errors.workYear") || `Work ${i + 1}: year is required.`;
        });
        break;
      case 4:
        form.media.forEach((m, i) => {
          if (!m.title.trim()) errs[`media_${i}_title`] = t("submitScholar.errors.mediaTitle") || `Media ${i + 1}: title is required.`;
        });
        break;
      case 5:
        if (form.refs.length === 0) errs.refs = tt("submitScholar.errors.refsRequired", "Add at least one reference.");
        form.refs.forEach((r, i) => {
          if (!r.title.trim()) errs[`ref_${i}_title`] = t("submitScholar.errors.refTitle") || `Reference ${i + 1}: title is required.`;
          if (!r.citation.trim()) errs[`ref_${i}_citation`] = t("submitScholar.errors.refCitation") || `Reference ${i + 1}: citation is required.`;
        });
        break;
      case 6:
        if (form.refs.length === 0) errs.refs = tt("submitScholar.errors.refsRequired", "Add at least one reference.");
        if (!form.confirmed) errs.confirmed = tt("submitScholar.errors.confirm", "Please confirm before submitting.");
        break;
    }
    return errs;
  };

  const goNext = () => {
    const stepErrors = validateStep(step);
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      scrollTop();
      return;
    }
    setErrors({});
    if (step < STEPS.length - 1) { setStep(s => s + 1); scrollTop(); }
  };
  
  const goPrev = () => { setErrors({}); if (step > 0) { setStep(s => s - 1); scrollTop(); } };
  
  const jumpTo = (i: number) => { if (i !== step) { setErrors({}); setStep(i); scrollTop(); } };
  const upd = <K extends keyof FormState>(key: K, val: FormState[K]) => setForm(f => ({ ...f, [key]: val }));

  const langLabel = NATIVE_LANG_NAMES[lang];

  useEffect(() => { if (validRouteLang) setLang(validRouteLang); }, [validRouteLang, setLang]);
  useEffect(() => { if (!validRouteLang) setLang(pickedLang); }, [pickedLang, validRouteLang, setLang]);

     const handleSubmit = async () => {
    const stepErrors = validateStep(6);
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      scrollTop();
      return;
    }

    // ✅ NEW: If editing a rejected version, resubmit it to "pending"
    if (urlRejectedId) {
      try {
        setIsSubmitting(true);
        setSubmitError(null);
        
        const payload = { ...buildDraftPayload(), target_status: "pending" };
        await scholarsApi.updateRejected(parseInt(urlRejectedId), payload);
        
        clearDraft(scholarId, parseInt(urlRejectedId), lang);
        setPhase("success");
        return; // Exit early, don't run normal submit logic
      } catch (error: any) {
        console.error("Failed to resubmit rejected version:", error);
        setSubmitError(extractErrorMessage(error, "Failed to resubmit."));
        setIsSubmitting(false);
        return; // ✅ FIX: Just return and show the error, do NOT navigate away
      }
    }

    // Normal submit logic
    setErrors({});
    setSubmitError(null);
    setIsSubmitting(true);

    try {
      const selectedLang = LANGUAGES.find(l => l.code === lang.toLowerCase());

      const relationships = [
        ...form.teachers.filter(t => t.scholar_id !== null).map(t => ({ related_version_id: t.scholar_id, relation_type: "teacher" })),
        ...form.students.filter(s => s.scholar_id !== null).map(s => ({ related_version_id: s.scholar_id, relation_type: "student" })),
      ];

      const payload: any = {
        canonical_name: form.canonical_name,
        region_id: form.region_id,
        century_hijri_start: form.century_hijri_start,
        century_hijri_end: form.century_hijri_end,
        century_gregorian_start: form.century_gregorian_start,
        century_gregorian_end: form.century_gregorian_end,
        biography: form.biography,
        language_id: selectedLang?.language_id,
        aliases: form.aliases,
        discipline_ids: form.discipline_ids,
        dates: [
          form.birth_date_gregorian ? { date_type: "birth", calendar: "gregorian", year: parseInt(form.birth_date_gregorian), raw_text: form.birth_date_gregorian, is_approximate: false } : null,
          form.birth_date_hijri ? { date_type: "birth", calendar: "hijri", year: parseInt(form.birth_date_hijri), raw_text: form.birth_date_hijri, is_approximate: false } : null,
          form.death_date_gregorian ? { date_type: "death", calendar: "gregorian", year: parseInt(form.death_date_gregorian), raw_text: form.death_date_gregorian, is_approximate: false } : null,
          form.death_date_hijri ? { date_type: "death", calendar: "hijri", year: parseInt(form.death_date_hijri), raw_text: form.death_date_hijri, is_approximate: false } : null,
        ].filter(Boolean),
        references: form.refs.map(r => ({ title: r.title, citation: r.citation, url: r.url || null })),
        works: form.works.map(w => ({
          title: w.title,
          year: w.year ? parseInt(w.year) : null,
          format: w.type,
          description: w.desc || null,
          media_url: w.accessMode === "link" ? w.url : null,
          source_type: w.accessMode === "upload" ? "upload" : w.accessMode === "none" ? "none" : "external",
          file_ref: w.accessMode === "upload" ? `work_file_${form.works.indexOf(w)}` : null,
        })),
        media: form.media.map((m, index) => ({
          title: m.title,
          year: m.year ? parseInt(m.year) : null,
          description: m.desc || null,
          media_url: m.accessMode === "link" ? m.url : null,
          file_type: m.type,
          source_type: m.accessMode === "upload" ? "upload" : "external",
          file_ref: m.accessMode === "upload" ? `media_file_${index}` : null,
        })),
        relationships: relationships.length > 0 ? relationships : undefined,
      };

      if (scholarId) {
        payload.scholar_id = parseInt(scholarId, 10);
      }

      const formData = new FormData();
      formData.append("data", JSON.stringify(payload));

      form.works.forEach((w, i) => { if (w.accessMode === "upload" && w.file) formData.append(`work_file_${i}`, w.file); });
      form.media.forEach((m, i) => { if (m.accessMode === "upload" && m.file) formData.append(`media_file_${i}`, m.file); });
      if (form.portraitFile) formData.append("image", form.portraitFile);

      const response = await scholarsApi.create(formData);
      
      if (response.warnings && response.warnings.length > 0) {
        const warningMsg = response.warnings.map((w: any) => `${w.type.toUpperCase()}: ${w.message}`).join("\n");
        alert(`⚠️ Scholar submitted, but the following issues occurred:\n\n${warningMsg}\n\nPlease check the console for details.`);
        console.warn("Submission warnings:", response.warnings);
        return; 
      }

      setSuccessMessage(response.message || "Submission successful!");
      clearDraft(scholarId, draftVersionId);
      setPhase("success");
    } catch (error: any) {
      console.error("Failed to submit scholar:", error);
      setSubmitError(extractErrorMessage(error, tt("submitScholar.errors.submitFailed", "Failed to submit. Please check your entries and try again.")));
      scrollTop();
    } finally {
      setIsSubmitting(false);
    }
  };

  const startNewSubmission = () => {
    clearDraft(scholarId, draftVersionId);
    window.location.href = "/scholars/submit";
  };

  const startFreshDraft = () => {
    const confirmed = window.confirm(
      tt("submitScholar.draft.confirmNew", "Start a new scholar? Any unsaved progress on this form will be lost (saved drafts are safe).")
    );
    if (!confirmed) return;
    clearDraft(scholarId, draftVersionId,lang);
    clearDraft(undefined, null,lang);
    window.location.href = "/scholars/submit";
  };

  if (phase === "lang") {
    return (
      <div className="submit-scholar-page" style={{ fontFamily: SANS, minHeight: "100vh", background: "#faf9f6", backgroundImage: "radial-gradient(circle at 50% 0%, rgba(201,168,76,0.06) 0%, transparent 60%)", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 24px" }}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Source+Serif+4:ital,opsz,wght@0,8..60,400..900;1,8..60,400..900&family=Source+Sans+3:wght@300..700&family=JetBrains+Mono:wght@400..700&display=swap'); 
          @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap'); 
          .material-symbols-outlined { font-variation-settings: 'FILL' 0,'wght' 400,'GRAD' 0,'opsz' 24; font-family: 'Material Symbols Outlined'; display: inline-block; vertical-align: middle; } 
          .submit-scholar-page * { box-sizing: border-box; margin: 0; padding: 0; } 
          .submit-scholar-page a { text-decoration: none; }
          @keyframes fade-in-up { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
          @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        `}</style>
        <div style={{ maxWidth: "540px", width: "100%", textAlign: "center", animation: "fade-in-up 0.4s ease-out" }}>
          <div style={{ fontFamily: MONO, fontSize: "10px", color: GREEN, letterSpacing: "0.25em", marginBottom: "8px", opacity: 0.7 }}>OULAMAUNA</div>
          <h1 style={{ fontFamily: SERIF, fontSize: "36px", fontWeight: 700, color: GREEN, marginBottom: "10px", lineHeight: 1.2 }}>{t("submitScholar.portal.title")}</h1>
          <p style={{ fontSize: "14px", color: MUTED, marginBottom: "40px", lineHeight: 1.6, maxWidth: "400px", margin: "0 auto 40px" }}>{t("submitScholar.portal.subtitle")}</p>
          <div style={{ background: "#fff", border: "1px solid rgba(192,201,195,0.4)", borderRadius: "20px", padding: "40px", boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}>
            <label style={{ ...labelStyle, textAlign: "center", display: "block", marginBottom: "16px" }}>{t("submitScholar.portal.selectLang")}</label>
            <p style={{ fontSize: "13px", color: MUTED, marginBottom: "24px", lineHeight: 1.5 }}>{t("submitScholar.portal.langDesc")}</p>
            <div style={{ display: "flex", gap: "10px", justifyContent: "center", marginBottom: "32px" }}>
              {(["EN", "AR", "FR"] as Language[]).map(l => (
                <button
                  key={l}
                  onClick={() => { 
                    setPickedLang(l); 
                    setLang(l); 
                    navigate(`/scholars/submit/${l.toLowerCase()}`);
                  }}
                  style={{ padding: "12px 24px", borderRadius: "999px", border: `1.5px solid ${pickedLang === l ? GREEN : BORDER}`, background: pickedLang === l ? GREEN : "transparent", color: pickedLang === l ? "#fff" : MUTED, fontFamily: MONO, fontSize: "11px", fontWeight: 700, letterSpacing: "0.1em", cursor: "pointer", transition: "all 0.2s" }}>
                  {l === "AR" ? "ARABIC" : l === "EN" ? "ENGLISH" : "FRANÇAIS"}
                </button>
              ))}
            </div>
            <button onClick={() => setPhase("form")} style={{ padding: "14px 36px", background: GREEN, color: "#fff", border: "none", borderRadius: "10px", fontFamily: MONO, fontSize: "12px", fontWeight: 700, letterSpacing: "0.1em", cursor: "pointer", transition: "background 0.15s", display: "inline-flex", alignItems: "center", gap: "8px" }}
              onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = GREEN_DARK}
              onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = GREEN}>
              {t("submitScholar.portal.begin")} <Icon name="arrow_forward" size={16} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (phase === "success") {
    return (
      <div className="submit-scholar-page" dir={lang === "AR" ? "rtl" : "ltr"} style={{ fontFamily: SANS, minHeight: "100vh", background: "#f9faf7", backgroundImage: "radial-gradient(#e1e3e0 0.5px, transparent 0.5px)", backgroundSize: "24px 24px", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 24px" }}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Source+Serif+4:ital,opsz,wght@0,8..60,400..900;1,8..60,400..900&family=Source+Sans+3:wght@300..700&family=JetBrains+Mono:wght@400..700&display=swap');
          @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap');
          .material-symbols-outlined { font-variation-settings: 'FILL' 0,'wght' 400,'GRAD' 0,'opsz' 24; font-family: 'Material Symbols Outlined'; display: inline-block; vertical-align: middle; }
          .submit-scholar-page * { box-sizing: border-box; margin: 0; padding: 0; }
          .submit-scholar-page a { text-decoration: none; }
          .submit-scholar-page button { transition: all 0.15s ease; }
          @keyframes success-pop { 0% { transform: scale(0.6); opacity: 0; } 60% { transform: scale(1.08); opacity: 1; } 100% { transform: scale(1); } }
          @keyframes success-fade-up { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
          @keyframes fade-in-up { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        `}</style>
        <div style={{ maxWidth: "560px", width: "100%", textAlign: "center", animation: "fade-in-up 0.4s ease-out" }}>
          <Card style={{ padding: "56px 40px" }}>
            <div style={{ width: "96px", height: "96px", borderRadius: "50%", background: `radial-gradient(circle, ${GREEN_LIGHT} 0%, rgba(11,67,53,0) 72%)`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto" }}>
              <div style={{ width: "72px", height: "72px", borderRadius: "50%", background: GREEN, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", boxShadow: "0 10px 28px rgba(11,67,53,0.28)", animation: "success-pop 0.5s cubic-bezier(0.34,1.56,0.64,1) both" }}>
                <Icon name="check" size={38} />
              </div>
            </div>

            <h2 style={{ fontFamily: SERIF, fontSize: "28px", fontWeight: 700, color: GREEN, margin: "24px 0 14px", animation: "success-fade-up 0.5s 0.15s both" }}>{t("submitScholar.success.title")}</h2>

            {successMessage && (
              <div style={{ display: "inline-block", padding: "10px 20px", background: GREEN_LIGHT, border: `1px solid ${GREEN_BORDER}`, borderRadius: "999px", marginBottom: "20px", fontSize: "13px", color: GREEN, fontWeight: 600, animation: "success-fade-up 0.5s 0.22s both" }}>
                {successMessage}
              </div>
            )}

            <p style={{ fontSize: "14px", color: MUTED, lineHeight: 1.7, maxWidth: "380px", margin: "0 auto 28px", animation: "success-fade-up 0.5s 0.3s both" }}>{t("submitScholar.success.desc")}</p>

            <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "9px 22px", borderRadius: "20px", background: "rgba(115,92,0,0.08)", color: GOLD, fontFamily: MONO, fontSize: "10px", fontWeight: 700, letterSpacing: "0.1em", border: `1px solid rgba(115,92,0,0.2)`, marginBottom: "28px", animation: "success-fade-up 0.5s 0.36s both" }}>
              <Icon name="schedule" size={14} /> {t("submitScholar.success.pending")}
            </div>

            <div style={{ padding: "18px 20px", background: "#f9faf7", border: `1px solid ${BORDER}`, borderRadius: "12px", fontSize: "12px", color: MUTED, lineHeight: 1.7, textAlign: "left", display: "flex", gap: "10px", alignItems: "flex-start", marginBottom: "28px", animation: "success-fade-up 0.5s 0.42s both" }}>
              <span style={{ color: GREEN, flexShrink: 0, marginTop: "1px" }}><Icon name="info" size={16} /></span>
              <span>{t("submitScholar.success.note")}</span>
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", justifyContent: "center", animation: "success-fade-up 0.5s 0.48s both" }}>
              <button
                onClick={() => navigate("/")}
                style={{ padding: "12px 26px", background: GREEN, color: "#fff", border: "none", borderRadius: "8px", fontFamily: MONO, fontSize: "10px", fontWeight: 700, letterSpacing: "0.1em", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "8px" }}
                onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = GREEN_DARK}
                onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = GREEN}>
                <Icon name="home" size={15} /> {tt("submitScholar.success.goHome", "Back to Home")}
              </button>
              <button
                onClick={() => navigate("/dashboard")}
                style={{ padding: "12px 26px", background: "transparent", color: GREEN, border: `1.5px solid ${GREEN}`, borderRadius: "8px", fontFamily: MONO, fontSize: "10px", fontWeight: 700, letterSpacing: "0.1em", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "8px" }}
                onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = GREEN_LIGHT}
                onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = "transparent"}>
                <Icon name="dashboard" size={15} /> {tt("submitScholar.success.goDashboard", "View Dashboard")}
              </button>
              <button
                onClick={startNewSubmission}
                style={{ padding: "12px 20px", background: "transparent", color: MUTED, border: `1.5px solid ${BORDER}`, borderRadius: "8px", fontFamily: MONO, fontSize: "10px", fontWeight: 700, letterSpacing: "0.1em", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "8px" }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = GREEN; (e.currentTarget as HTMLButtonElement).style.color = GREEN; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = BORDER; (e.currentTarget as HTMLButtonElement).style.color = MUTED; }}>
                <Icon name="add" size={15} /> {tt("submitScholar.success.submitAnother", "Submit Another Scholar")}
              </button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  const renderStep = () => {
    switch (step) {
      case 0: return (
        <Card>
          <CardTitle num="01" title={tt("submitScholar.step1.title", "Identity & Metadata")} />
          <ErrorBanner errors={errors} title={tt("submitScholar.errors.bannerTitle", "PLEASE FIX THE FOLLOWING")} />
          <div style={{ display: "grid", gridTemplateColumns: "160px 1fr", gap: "32px", marginBottom: "28px" }}>
            <div>
              <label style={labelStyle}>{tt("submitScholar.step1.portrait", "Portrait")}</label>
              {form.portraitUrl ? (
                <div style={{ position: "relative", borderRadius: "10px", overflow: "hidden", aspectRatio: "3/4", background: "#e7e8e6" }}>
                  <img src={form.portraitUrl} alt="Portrait" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  <button onClick={() => upd("portraitUrl", null)} style={{ position: "absolute", top: "6px", right: "6px", background: "rgba(25,28,27,0.6)", border: "none", borderRadius: "50%", width: "24px", height: "24px", cursor: "pointer", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px" }}>×</button>
                </div>
              ) : (
                <div onClick={() => portraitInputRef.current?.click()} style={{ border: `2px dashed ${BORDER}`, borderRadius: "10px", padding: "24px 12px", textAlign: "center", cursor: "pointer", background: "#fafbf8", transition: "all 0.15s", aspectRatio: "3/4", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "8px" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = GREEN; (e.currentTarget as HTMLDivElement).style.background = GREEN_LIGHT; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = BORDER; (e.currentTarget as HTMLDivElement).style.background = "#fafbf8"; }}>
                  <Icon name="add_photo_alternate" size={28} />
                  <span style={{ fontSize: "11px", color: MUTED, fontFamily: MONO }}>{tt("submitScholar.step1.uploadImage", "Upload Image")}</span>
                </div>
              )}
              <input ref={portraitInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={e => { const f = e.target.files?.[0]; if (f) { upd("portraitUrl", URL.createObjectURL(f)); upd("portraitFile", f); } }} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
              <div>
                <label style={labelStyle}>{tt("submitScholar.step1.canonicalName", "Canonical Name")} <span style={{ color: DANGER }}>*</span></label>
                <FocusInput type="text" value={form.canonical_name} onChange={e => upd("canonical_name", e.target.value)} placeholder="e.g. Malek Bennabi" hasError={!!errors.canonical_name} />
                <FieldError msg={errors.canonical_name} />
              </div>
              <div><label style={labelStyle}>{tt("submitScholar.step1.aliases", "Aliases")}</label><ChipInput items={form.aliases} onAdd={v => upd("aliases", [...form.aliases, v])} onRemove={i => upd("aliases", form.aliases.filter((_, idx) => idx !== i))} placeholder="e.g. Malik Bin Nabi" /></div>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "24px" }}>
            <div><label style={labelStyle}>{tt("submitScholar.step1.birthDateGregorian", "Birth Date (Gregorian)")}</label><FocusInput type="number" value={form.birth_date_gregorian} onChange={e => upd("birth_date_gregorian", e.target.value)} placeholder="e.g. 1905" /></div>
            <div><label style={labelStyle}>{tt("submitScholar.step1.birthDateHijri", "Birth Date (Hijri)")}</label><FocusInput type="number" value={form.birth_date_hijri} onChange={e => upd("birth_date_hijri", e.target.value)} placeholder="e.g. 1323" /></div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "24px" }}>
            <div><label style={labelStyle}>{tt("submitScholar.step1.deathDateGregorian", "Death Date (Gregorian)")}</label><FocusInput type="number" value={form.death_date_gregorian} onChange={e => upd("death_date_gregorian", e.target.value)} placeholder="e.g. 1973" /></div>
            <div><label style={labelStyle}>{tt("submitScholar.step1.deathDateHijri", "Death Date (Hijri)")}</label><FocusInput type="number" value={form.death_date_hijri} onChange={e => upd("death_date_hijri", e.target.value)} placeholder="e.g. 1393" /></div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "24px", marginBottom: "24px" }}>
            <div>
              <label style={labelStyle}>{tt("submitScholar.step1.region", "Region")} <span style={{ color: DANGER }}>*</span></label>
              <FocusSelect value={form.region_id ? String(form.region_id) : ""} onChange={e => upd("region_id", e.target.value ? parseInt(e.target.value, 10) : null)} disabled={isLoadingMeta} hasError={!!errors.region_id}>
                <option value="">{isLoadingMeta ? "Loading regions..." : "Select Region"}</option>
                {regions.map(r => (<option key={r.region_id} value={r.region_id}>{r.name}</option>))}
              </FocusSelect>
              <FieldError msg={errors.region_id} />
            </div>
            <div><label style={labelStyle}>{tt("submitScholar.step1.centuryGregorianStart", "Century Gregorian Start")}</label><FocusInput type="number" value={form.century_gregorian_start ?? ""} onChange={e => upd("century_gregorian_start", e.target.value ? parseInt(e.target.value, 10) : null)} placeholder="e.g. 20" /></div>
            <div><label style={labelStyle}>{tt("submitScholar.step1.centuryGregorianEnd", "Century Gregorian End")}</label><FocusInput type="number" value={form.century_gregorian_end ?? ""} onChange={e => upd("century_gregorian_end", e.target.value ? parseInt(e.target.value, 10) : null)} placeholder="e.g. 21" /></div>
            <div><label style={labelStyle}>{tt("submitScholar.step1.centuryHijriStart", "Century Hijri Start")}</label><FocusInput type="number" value={form.century_hijri_start ?? ""} onChange={e => upd("century_hijri_start", e.target.value ? parseInt(e.target.value, 10) : null)} placeholder="e.g. 14" /></div>
            <div><label style={labelStyle}>{tt("submitScholar.step1.centuryHijriEnd", "Century Hijri End")}</label><FocusInput type="number" value={form.century_hijri_end ?? ""} onChange={e => upd("century_hijri_end", e.target.value ? parseInt(e.target.value, 10) : null)} placeholder="e.g. 15" /></div>
          </div>
          <Divider />
          <div style={{ marginBottom: "24px" }}>
            <label style={labelStyle}>{tt("submitScholar.step1.disciplines", "Disciplines")} <span style={{ color: DANGER }}>*</span></label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "8px" }}>
              {isLoadingMeta ? (<span style={{ fontFamily: MONO, fontSize: "10px", color: MUTED }}>Loading disciplines...</span>) : disciplines.length === 0 ? (<span style={{ fontFamily: MONO, fontSize: "10px", color: DANGER }}>No disciplines available.</span>) : (
                disciplines.map(d => (<DisciplineBtn key={d.discipline_id} label={d.name} active={form.discipline_ids.includes(d.discipline_id)} onClick={() => { const newIds = form.discipline_ids.includes(d.discipline_id) ? form.discipline_ids.filter(x => x !== d.discipline_id) : [...form.discipline_ids, d.discipline_id]; upd("discipline_ids", newIds); }} />))
              )}
            </div>
            <FieldError msg={errors.discipline_ids} />
          </div>
        </Card>
      );

      case 1: return (
        <Card>
          <CardTitle num="02" title={t("submitScholar.step2.title")} />
          <div style={{ marginBottom: "28px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
              <label style={sectionLabelStyle}>{t("submitScholar.step2.teachers")}</label>
              <button onClick={() => upd("teachers", [...form.teachers, emptyPerson()])} style={{ padding: "6px 14px", border: `1.5px solid ${GREEN}`, borderRadius: "6px", background: "transparent", color: GREEN, fontFamily: MONO, fontSize: "9px", fontWeight: 700, letterSpacing: "0.1em", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "5px", transition: "all 0.15s" }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = GREEN; (e.currentTarget as HTMLButtonElement).style.color = "#fff"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; (e.currentTarget as HTMLButtonElement).style.color = GREEN; }}><Icon name="add" size={13} /> {t("submitScholar.step2.addTeacher")}</button>
            </div>
            {form.teachers.length === 0 && <p style={{ fontSize: "13px", color: MUTED, fontStyle: "italic", padding: "16px 0" }}>{t("submitScholar.step2.noTeachers")}</p>}
            {form.teachers.map((p, i) => (
              <ItemCard key={i} index={i} label="Teacher" onRemove={() => upd("teachers", form.teachers.filter((_, idx) => idx !== i))}>
                <PersonLinkSection 
                  person={p} 
                  onChange={np => { const t2 = [...form.teachers]; t2[i] = np; upd("teachers", t2); }} 
                  t={t} 
                  lang={lang.toLowerCase()} 
                  selectedScholarIds={selectedScholarIds} 
                />
              </ItemCard>
            ))}
          </div>
          <Divider />
          <div style={{ marginBottom: "28px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
              <label style={sectionLabelStyle}>{t("submitScholar.step2.students")}</label>
              <button onClick={() => upd("students", [...form.students, emptyPerson()])} style={{ padding: "6px 14px", border: `1.5px solid ${GREEN}`, borderRadius: "6px", background: "transparent", color: GREEN, fontFamily: MONO, fontSize: "9px", fontWeight: 700, letterSpacing: "0.1em", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "5px", transition: "all 0.15s" }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = GREEN; (e.currentTarget as HTMLButtonElement).style.color = "#fff"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; (e.currentTarget as HTMLButtonElement).style.color = GREEN; }}><Icon name="add" size={13} /> {t("submitScholar.step2.addStudent")}</button>
            </div>
            {form.students.length === 0 && <p style={{ fontSize: "13px", color: MUTED, fontStyle: "italic", padding: "16px 0" }}>{t("submitScholar.step2.noStudents")}</p>}
            {form.students.map((p, i) => (
              <ItemCard key={i} index={i} label="Student" onRemove={() => upd("students", form.students.filter((_, idx) => idx !== i))}>
                <PersonLinkSection 
                  person={p} 
                  onChange={np => { const t2 = [...form.students]; t2[i] = np; upd("students", t2); }} 
                  t={t} 
                  lang={lang.toLowerCase()} 
                  selectedScholarIds={selectedScholarIds} 
                />
              </ItemCard>
            ))}
          </div>
        </Card>
      );

      case 2: return (
        <Card>
          <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "32px", paddingBottom: "20px", borderBottom: "1px solid rgba(192,201,195,0.3)" }}>
            <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: GREEN, color: "#fff", fontFamily: MONO, fontSize: "12px", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>03</div>
            <h2 style={{ fontFamily: SERIF, fontSize: "20px", fontWeight: 700, color: GREEN, margin: 0 }}>{t("submitScholar.step3.title")}</h2>
            <span style={{ marginLeft: "auto", fontFamily: MONO, fontSize: "9px", fontWeight: 700, padding: "4px 12px", borderRadius: "4px", background: GREEN_LIGHT, color: GREEN, border: `1px solid ${GREEN_BORDER}`, letterSpacing: "0.1em" }}>{langLabel.toUpperCase()}</span>
          </div>
          <ErrorBanner errors={errors} title={tt("submitScholar.errors.bannerTitle", "PLEASE FIX THE FOLLOWING")} />
          <div style={{ marginBottom: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "6px" }}>
              <label style={labelStyle}>{t("submitScholar.step3.biography")} <span style={{ color: DANGER }}>*</span></label>
              <span style={{ fontFamily: MONO, fontSize: "9px", color: MUTED }}>Rich Text Editor</span>
            </div>
            <RichTextEditor value={form.biography} onChange={(html) => upd("biography", html)} placeholder="Write biography here... Select text and click buttons to format." />
            <FieldError msg={errors.biography} />
            <p style={{ fontFamily: MONO, fontSize: "9px", color: MUTED, marginTop: "8px", fontStyle: "italic" }}>Tip: Click a button to toggle formatting on. Click it again to turn it off.</p>
          </div>
        </Card>
      );

      case 3: return (
        <Card>
          <CardTitle num="04" title={t("submitScholar.step4.title")} />
          <ErrorBanner errors={errors} title={tt("submitScholar.errors.bannerTitle", "PLEASE FIX THE FOLLOWING")} />
          {form.works.length === 0 && (<div style={{ textAlign: "center", padding: "48px 0", border: `2px dashed ${BORDER}`, borderRadius: "12px", marginBottom: "16px" }}><Icon name="menu_book" size={40} /><p style={{ color: MUTED, fontSize: "14px", marginTop: "12px" }}>{t("submitScholar.step4.noWorks")}</p></div>)}
          {form.works.map((w, i) => (
            <ItemCard key={i} index={i} label={t("submitScholar.step4.work")} onRemove={() => upd("works", form.works.filter((_, idx) => idx !== i))}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                <div>
                  <label style={labelStyle}>TITLE <span style={{ color: DANGER }}>*</span></label>
                  <FocusInput type="text" value={w.title} onChange={e => { const t2 = [...form.works]; t2[i] = { ...t2[i], title: e.target.value }; upd("works", t2); }} placeholder="e.g. The Problem of Culture" hasError={!!errors[`work_${i}_title`]} />
                  <FieldError msg={errors[`work_${i}_title`]} />
                </div>
                <div>
                  <label style={labelStyle}>YEAR <span style={{ color: DANGER }}>*</span></label>
                  <FocusInput type="number" value={w.year} onChange={e => { const t2 = [...form.works]; t2[i] = { ...t2[i], year: e.target.value }; upd("works", t2); }} placeholder="e.g. 1959" hasError={!!errors[`work_${i}_year`]} />
                  <FieldError msg={errors[`work_${i}_year`]} />
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "14px", marginBottom: "16px" }}>
                <div>
                  <label style={labelStyle}>FORMAT</label>
                  <FocusSelect value={w.type} onChange={e => { const t2 = [...form.works]; t2[i] = { ...t2[i], type: e.target.value }; upd("works", t2); }}>
                    {WORK_FORMATS.map(x => (<option key={x} value={x}>{x.charAt(0) + x.slice(1).toLowerCase()}</option>))}
                  </FocusSelect>
                </div>
              </div>
              <div style={{ marginBottom: "16px" }}>
                <label style={labelStyle}>DESCRIPTION</label>
                <FocusTextarea value={w.desc} onChange={e => { const t2 = [...form.works]; t2[i] = { ...t2[i], desc: e.target.value }; upd("works", t2); }} rows={2} placeholder="Brief description of the work" />
              </div>
              <div>
                <label style={labelStyle}>DIGITAL ACCESS</label>
                <AccessModeTabs mode={w.accessMode} onChange={m => { const t2 = [...form.works]; t2[i] = { ...t2[i], accessMode: m }; upd("works", t2); }} t={t}>
                  {w.accessMode === "upload" && <UploadZone file={w.file} onFile={f => { const t2 = [...form.works]; t2[i] = { ...t2[i], file: f }; upd("works", t2); }} onRemove={() => { const t2 = [...form.works]; t2[i] = { ...t2[i], file: null }; upd("works", t2); }} accept=".pdf,.mp3,.wav,.epub,.doc,.docx" />}
                  {w.accessMode === "link" && <FocusInput type="url" value={w.url} onChange={e => { const t2 = [...form.works]; t2[i] = { ...t2[i], url: e.target.value }; upd("works", t2); }} placeholder="https://archive.org/details/…" />}
                  {w.accessMode === "none" && <p style={{ fontFamily: MONO, fontSize: "9px", color: MUTED, fontStyle: "italic" }}>{t("submitScholar.step4.noneHint")}</p>}
                </AccessModeTabs>
              </div>
            </ItemCard>
          ))}
          <AddBtn onClick={() => upd("works", [...form.works, emptyWork()])}>{t("submitScholar.step4.addWork")}</AddBtn>
        </Card>
      );

      case 4: return (
        <Card>
          <CardTitle num="05" title={t("submitScholar.step5.title")} />
          <ErrorBanner errors={errors} title={tt("submitScholar.errors.bannerTitle", "PLEASE FIX THE FOLLOWING")} />
          <p style={{ fontSize: "13px", color: MUTED, marginBottom: "24px", lineHeight: 1.6 }}>{t("submitScholar.step5.desc")}</p>
          {form.media.length === 0 && (<div style={{ textAlign: "center", padding: "48px 0", border: `2px dashed ${BORDER}`, borderRadius: "12px", marginBottom: "16px" }}><Icon name="perm_media" size={40} /><p style={{ color: MUTED, fontSize: "14px", marginTop: "12px" }}>{t("submitScholar.step5.noMedia")}</p></div>)}
          {form.media.map((m, i) => (
            <ItemCard key={i} index={i} label={t("submitScholar.step5.media")} onRemove={() => upd("media", form.media.filter((_, idx) => idx !== i))}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                <div>
                  <label style={labelStyle}>TITLE <span style={{ color: DANGER }}>*</span></label>
                  <FocusInput type="text" value={m.title} onChange={e => { const t2 = [...form.media]; t2[i] = { ...t2[i], title: e.target.value }; upd("media", t2); }} placeholder="e.g. 1972 Lecture" hasError={!!errors[`media_${i}_title`]} />
                  <FieldError msg={errors[`media_${i}_title`]} />
                </div>
                <div><label style={labelStyle}>YEAR</label><FocusInput type="number" value={m.year} onChange={e => { const t2 = [...form.media]; t2[i] = { ...t2[i], year: e.target.value }; upd("media", t2); }} placeholder="e.g. 1959" /></div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "14px", marginBottom: "16px" }}>
                <div>
                  <label style={labelStyle}>FILE TYPE</label>
                  <FocusSelect value={m.type} onChange={e => { const t2 = [...form.media]; t2[i] = { ...t2[i], type: e.target.value }; upd("media", t2); }}>
                    {MEDIA_FILE_TYPES.map(x => (<option key={x} value={x}>{x.toUpperCase()}</option>))}
                  </FocusSelect>
                </div>
              </div>
              <div style={{ marginBottom: "16px" }}>
                <label style={labelStyle}>DESCRIPTION</label>
                <FocusTextarea value={m.desc} onChange={e => { const t2 = [...form.media]; t2[i] = { ...t2[i], desc: e.target.value }; upd("media", t2); }} rows={2} placeholder="Brief description of the media" />
              </div>
              <div>
                <label style={labelStyle}>FILE / LINK</label>
                <div>
                  <div style={{ display: "flex", border: `1.5px solid ${BORDER}`, borderRadius: "8px", overflow: "hidden", marginBottom: "12px" }}>
                    <button 
                      style={{ flex: 1, padding: "8px 0", textAlign: "center", fontFamily: MONO, fontSize: "10px", fontWeight: 700, letterSpacing: "0.08em", border: "none", cursor: "pointer", transition: "all 0.15s", background: m.accessMode === "upload" ? GREEN : "transparent", color: m.accessMode === "upload" ? "#fff" : MUTED, display: "flex", alignItems: "center", justifyContent: "center", gap: "5px", borderRight: `1px solid ${BORDER}` }} 
                      onClick={() => { const t2 = [...form.media]; t2[i] = { ...t2[i], accessMode: "upload" }; upd("media", t2); }}>
                      <Icon name="upload_file" size={13} /> {t("submitScholar.step4.upload")}
                    </button>
                    <button 
                      style={{ flex: 1, padding: "8px 0", textAlign: "center", fontFamily: MONO, fontSize: "10px", fontWeight: 700, letterSpacing: "0.08em", border: "none", cursor: "pointer", transition: "all 0.15s", background: m.accessMode === "link" ? GREEN : "transparent", color: m.accessMode === "link" ? "#fff" : MUTED, display: "flex", alignItems: "center", justifyContent: "center", gap: "5px" }} 
                      onClick={() => { const t2 = [...form.media]; t2[i] = { ...t2[i], accessMode: "link" }; upd("media", t2); }}>
                      <Icon name="link" size={13} /> {t("submitScholar.step4.link")}
                    </button>
                  </div>
                  {m.accessMode === "upload" && <UploadZone file={m.file} onFile={f => { const t2 = [...form.media]; t2[i] = { ...t2[i], file: f }; upd("media", t2); }} onRemove={() => { const t2 = [...form.media]; t2[i] = { ...t2[i], file: null }; upd("media", t2); }} accept=".pdf,.mp3,.wav,.mp4,.webm" hint="PDF, Audio (MP3/WAV), Video (MP4) — up to 100 MB" />}
                  {m.accessMode === "link" && <FocusInput type="url" value={m.url} onChange={e => { const t2 = [...form.media]; t2[i] = { ...t2[i], url: e.target.value }; upd("media", t2); }} placeholder="https://youtube.com/… or direct file URL" />}
                </div>
              </div>
            </ItemCard>
          ))}
          <AddBtn onClick={() => upd("media", [...form.media, emptyMedia()])}>{t("submitScholar.step5.addMedia")}</AddBtn>
        </Card>
      );

      case 5: return (
        <Card>
          <CardTitle num="06" title={t("submitScholar.step6.title")} />
          <ErrorBanner errors={errors} title={tt("submitScholar.errors.bannerTitle", "PLEASE FIX THE FOLLOWING")} />
          <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "12px 16px", background: "rgba(179,38,30,0.05)", border: "1px solid rgba(179,38,30,0.2)", borderRadius: "8px", marginBottom: "24px" }}>
            <Icon name="warning" size={16} />
            <span style={{ fontFamily: MONO, fontSize: "10px", color: DANGER, fontWeight: 700, letterSpacing: "0.08em" }}>{t("submitScholar.step6.warning")}</span>
          </div>
          {form.refs.length === 0 && (<div style={{ textAlign: "center", padding: "48px 0", border: `2px dashed ${BORDER}`, borderRadius: "12px", marginBottom: "16px" }}><Icon name="auto_stories" size={40} /><p style={{ color: MUTED, fontSize: "14px", marginTop: "12px" }}>{t("submitScholar.step6.noRefs")}</p></div>)}
          {form.refs.map((r, i) => (
            <ItemCard key={i} index={i} label={t("submitScholar.step6.reference")} onRemove={() => upd("refs", form.refs.filter((_, idx) => idx !== i))}>
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div>
                  <label style={labelStyle}>Title *</label>
                  <FocusInput type="text" value={r.title} onChange={e => { const t2 = [...form.refs]; t2[i] = { ...t2[i], title: e.target.value }; upd("refs", t2); }} placeholder="e.g. Wikipedia" hasError={!!errors[`ref_${i}_title`]} />
                  <FieldError msg={errors[`ref_${i}_title`]} />
                </div>
                <div>
                  <label style={labelStyle}>Citation *</label>
                  <FocusInput type="text" value={r.citation} onChange={e => { const t2 = [...form.refs]; t2[i] = { ...t2[i], citation: e.target.value }; upd("refs", t2); }} placeholder="e.g. Malek Bennabi" hasError={!!errors[`ref_${i}_citation`]} />
                  <FieldError msg={errors[`ref_${i}_citation`]} />
                </div>
                <div><label style={labelStyle}>URL</label><FocusInput type="url" value={r.url} onChange={e => { const t2 = [...form.refs]; t2[i] = { ...t2[i], url: e.target.value }; upd("refs", t2); }} placeholder="https://en.wikipedia.org/wiki/Malek_Bennabi" /></div>
              </div>
            </ItemCard>
          ))}
          <AddBtn onClick={() => upd("refs", [...form.refs, emptyRef()])}>{t("submitScholar.step6.addRef")}</AddBtn>
        </Card>
      );

      case 6: return (
        <Card>
          <CardTitle num="07" title={t("submitScholar.step7.title")} />
          <ErrorBanner errors={errors} title={tt("submitScholar.errors.bannerTitle", "PLEASE FIX THE FOLLOWING")} />
          {submitError && (
            <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", padding: "14px 16px", background: DANGER_BG, border: `1.5px solid ${DANGER_BORDER}`, borderRadius: "10px", marginBottom: "24px", animation: "fade-in-up 0.3s ease-out" }}>
              <span style={{ color: DANGER, flexShrink: 0, marginTop: "1px" }}><Icon name="cloud_off" size={18} /></span>
              <div>
                <div style={{ fontFamily: MONO, fontSize: "10px", color: DANGER, fontWeight: 700, letterSpacing: "0.08em", marginBottom: "4px" }}>{tt("submitScholar.errors.serverTitle", "SUBMISSION FAILED")}</div>
                <div style={{ fontSize: "12px", color: "#7a231d", lineHeight: 1.6 }}>{submitError}</div>
              </div>
            </div>
          )}
          <p style={{ fontSize: "13px", color: MUTED, marginBottom: "28px", lineHeight: 1.6 }}>{t("submitScholar.step7.desc")}</p>
          <div style={{ marginBottom: "24px", padding: "20px", background: "#f9faf7", border: `1px solid ${BORDER}`, borderRadius: "12px" }}>
            <div style={{ fontFamily: MONO, fontSize: "9px", color: GREEN, letterSpacing: "0.18em", marginBottom: "14px" }}>{t("submitScholar.step7.identitySection")}</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
              {[[t("submitScholar.step1.canonicalName"), form.canonical_name], [t("submitScholar.step1.region"), regions.find(r => r.region_id === form.region_id)?.name || "—"], [t("submitScholar.step1.century"), `${form.century_gregorian_start || ''}-${form.century_gregorian_end || ''} / ${form.century_hijri_start || ''}-${form.century_hijri_end || ''}`]].map(([lbl, val]) => (
                <div key={lbl}><div style={{ fontFamily: MONO, fontSize: "9px", color: MUTED, marginBottom: "3px" }}>{lbl.toUpperCase()}</div><div style={{ fontSize: "13px", fontWeight: 600, color: val ? "#191c1b" : "#c0c9c3" }}>{val || "—"}</div></div>
              ))}
            </div>
          </div>
          <div style={{ marginBottom: "24px", padding: "20px", background: "#f9faf7", border: `1px solid ${BORDER}`, borderRadius: "12px" }}>
            <div style={{ fontFamily: MONO, fontSize: "9px", color: GREEN, letterSpacing: "0.18em", marginBottom: "14px" }}>{t("submitScholar.step7.narrativeSection")} ({langLabel.toUpperCase()})</div>
            <div style={{ marginBottom: "10px" }}><div style={{ fontFamily: MONO, fontSize: "9px", color: MUTED, marginBottom: "3px" }}>{t("submitScholar.step3.pageTitle")}</div><div style={{ fontSize: "14px", fontWeight: 700, color: form.pageTitle ? "#191c1b" : "#c0c9c3", fontFamily: SERIF }}>{form.pageTitle || "—"}</div></div>
            {form.summary && <div style={{ fontSize: "13px", color: "#404945", lineHeight: 1.65 }}>{form.summary}</div>}
          </div>
          <div style={{ marginBottom: "28px", padding: "20px", background: "#f9faf7", border: `1px solid ${form.refs.length === 0 ? "rgba(179,38,30,0.3)" : BORDER}`, borderRadius: "12px" }}>
            <div style={{ fontFamily: MONO, fontSize: "9px", color: GREEN, letterSpacing: "0.18em", marginBottom: "14px" }}>{t("submitScholar.step7.refsSection")} ({form.refs.length})</div>
            {form.refs.length === 0 ? (<p style={{ fontFamily: MONO, fontSize: "10px", color: DANGER, display: "flex", alignItems: "center", gap: "6px" }}><Icon name="warning" size={14} /> {t("submitScholar.step7.refsRequired")}</p>) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {form.refs.map((r, i) => <div key={i} style={{ fontSize: "13px", color: "#404945", padding: "8px 0", borderBottom: "1px solid #f0f1ee" }}><span style={{ fontWeight: 700 }}>{r.title}</span>{r.citation ? ` — ${r.citation}` : ""}</div>)}
              </div>
            )}
          </div>
          <label style={{ display: "flex", alignItems: "flex-start", gap: "12px", padding: "18px", background: GREEN_LIGHT, border: `1px solid ${errors.confirmed ? DANGER : GREEN_BORDER}`, borderRadius: "10px", cursor: "pointer", marginBottom: "8px", transition: "border-color 0.2s ease" }}>
            <input type="checkbox" checked={form.confirmed} onChange={e => upd("confirmed", e.target.checked)} style={{ width: "16px", height: "16px", accentColor: GREEN, flexShrink: 0, marginTop: "2px" }} />
            <span style={{ fontSize: "13px", color: "#404945", lineHeight: 1.6 }}>{t("submitScholar.step7.confirmText")}</span>
          </label>
          <FieldError msg={errors.confirmed} />
          <p style={{ fontFamily: MONO, fontSize: "9px", color: MUTED, letterSpacing: "0.06em", marginTop: "8px" }}>{t("submitScholar.step7.confirmNote")}</p>
        </Card>
      );

      default: return null;
    }
  };

  const canSubmit = form.confirmed && form.refs.length > 0 && !isSubmitting;

  return (
    <div className="submit-scholar-page" dir={lang === "AR" ? "rtl" : "ltr"} style={{ fontFamily: SANS, minHeight: "100vh", background: "#f9faf7", backgroundImage: "radial-gradient(#e1e3e0 0.5px, transparent 0.5px)", backgroundSize: "24px 24px", color: "#191c1b" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Source+Serif+4:ital,opsz,wght@0,8..60,400..900;1,8..60,400..900&family=Source+Sans+3:wght@300..700&family=JetBrains+Mono:wght@400..700&display=swap'); 
        @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap'); 
        .material-symbols-outlined { font-variation-settings: 'FILL' 0,'wght' 400,'GRAD' 0,'opsz' 24; font-family: 'Material Symbols Outlined'; display: inline-block; vertical-align: middle; } 
        .submit-scholar-page * { box-sizing: border-box; margin: 0; padding: 0; } 
        .submit-scholar-page a { text-decoration: none; } 
        .submit-scholar-page input[type=number]::-webkit-inner-spin-button { opacity: 1; } 
        @keyframes submit-spin { to { transform: rotate(360deg); } } 
        @keyframes step-fade-in { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fade-in-up { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        .submit-scholar-page button, .submit-scholar-page input, .submit-scholar-page select, .submit-scholar-page textarea { transition: border-color 0.15s ease, background-color 0.15s ease, color 0.15s ease, box-shadow 0.15s ease; }
      `}</style>
      <header style={{ position: "sticky", top: 0, zIndex: 50, background: "rgba(249,250,247,0.96)", backdropFilter: "blur(8px)", borderBottom: "1px solid rgba(192,201,195,0.3)", padding: "14px 0" }}>
        <div style={{ maxWidth: "900px", margin: "0 auto", padding: "0 40px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div><div style={{ fontFamily: MONO, fontSize: "10px", color: GREEN, letterSpacing: "0.2em", opacity: 0.7 }}>OULAMAUNA</div><div style={{ fontSize: "13px", color: MUTED }}>{t("submitScholar.portal.title")}</div></div>
          <button
            onClick={startFreshDraft}
            style={{ padding: "8px 16px", border: `1.5px solid ${BORDER}`, borderRadius: "8px", background: "transparent", color: MUTED, fontFamily: MONO, fontSize: "10px", fontWeight: 700, letterSpacing: "0.06em", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "6px", transition: "all 0.15s" }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = GREEN; (e.currentTarget as HTMLButtonElement).style.color = GREEN; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = BORDER; (e.currentTarget as HTMLButtonElement).style.color = MUTED; }}>
            <Icon name="add_circle" size={14} /> {tt("submitScholar.header.newScholar", "New Scholar")}
          </button>
        </div>
      </header>
      <main style={{ maxWidth: "900px", margin: "0 auto", padding: "40px 40px 80px" }}>
        <div ref={topRef} />
        {draftRestored && (
          <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "12px 16px", background: "rgba(115,92,0,0.06)", border: "1px solid rgba(115,92,0,0.22)", borderRadius: "10px", marginBottom: "20px", animation: "step-fade-in 0.3s ease" }}>
            <span style={{ color: GOLD, flexShrink: 0 }}><Icon name="history" size={16} /></span>
            <span style={{ fontSize: "12px", color: "#5c4a00", lineHeight: 1.6, flex: 1 }}>{tt("submitScholar.draft.restored", "A saved draft was restored. Files (portrait, works, media) need to be re-attached.")}</span>
            <button onClick={() => setDraftRestored(false)} style={{ background: "none", border: "none", cursor: "pointer", color: GOLD, display: "flex", alignItems: "center", flexShrink: 0 }}><Icon name="close" size={16} /></button>
          </div>
        )}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px", marginBottom: "32px" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "6px 16px", background: GREEN_LIGHT, border: `1px solid ${GREEN_BORDER}`, borderRadius: "999px", width: "fit-content" }}>
            <Icon name="lock" size={12} />
            <span style={{ fontFamily: MONO, fontSize: "10px", fontWeight: 700, letterSpacing: "0.08em", color: GREEN }}>{NATIVE_LANG_NAMES[lang]}</span>
          </div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontFamily: MONO, fontSize: "9px", color: MUTED, letterSpacing: "0.06em" }}>
            <Icon name="cloud_done" size={13} /> {tt("submitScholar.draft.autosaved", "Progress is saved automatically on this device")}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "flex-start", marginBottom: "36px", overflowX: "auto", paddingBottom: "4px" }}>
          {STEPS.map((s, i) => (
            <div key={s.id} style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, minWidth: "90px", position: "relative", cursor: "pointer" }} onClick={() => jumpTo(i)}>
              {i < STEPS.length - 1 && (<div style={{ position: "absolute", top: "16px", left: "calc(50% + 18px)", width: "calc(100% - 36px)", height: "2px", background: i < step ? GREEN : BORDER, transition: "background 0.3s", zIndex: 0 }} />)}
              <div style={{ width: "32px", height: "32px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: MONO, fontSize: "11px", fontWeight: 700, zIndex: 1, flexShrink: 0, border: `2px solid ${i < step ? GREEN : i === step ? GREEN : BORDER}`, background: i < step ? GREEN : i === step ? GREEN_LIGHT : "#fff", color: i < step ? "#fff" : i === step ? GREEN : MUTED, transition: "all 0.2s" }}>
                {i < step ? <Icon name="check" size={16} /> : s.num}
              </div>
              <div style={{ fontFamily: MONO, fontSize: "9px", color: i === step ? GREEN : MUTED, marginTop: "6px", textAlign: "center", lineHeight: 1.3, letterSpacing: "0.04em", fontWeight: i === step ? 700 : 400, transition: "color 0.2s" }}>{s.label}</div>
            </div>
          ))}
        </div>
        <div key={step} style={{ animation: "step-fade-in 0.32s ease" }}>{renderStep()}</div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "8px" }}>
          <div>{step > 0 && (<button onClick={goPrev} style={{ padding: "10px 22px", border: `1.5px solid ${BORDER}`, borderRadius: "8px", background: "transparent", color: MUTED, fontFamily: MONO, fontSize: "10px", fontWeight: 700, letterSpacing: "0.08em", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "6px", transition: "all 0.15s" }} onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = GREEN; (e.currentTarget as HTMLButtonElement).style.color = GREEN; }} onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = BORDER; (e.currentTarget as HTMLButtonElement).style.color = MUTED; }}><Icon name="arrow_back" size={14} /> {t("submitScholar.footer.back")}</button>)}</div>
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <div style={{ position: "relative" }}>
              <button onClick={manualSaveDraft} style={{ padding: "10px 20px", border: `1.5px solid ${draftSaveError ? DANGER : GREEN}`, borderRadius: "8px", background: draftSavedPulse ? GREEN_LIGHT : "transparent", color: draftSaveError ? DANGER : GREEN, fontFamily: MONO, fontSize: "10px", fontWeight: 700, letterSpacing: "0.08em", cursor: "pointer", transition: "all 0.15s", display: "inline-flex", alignItems: "center", gap: "6px" }} onMouseEnter={e => { if (!draftSavedPulse) (e.currentTarget as HTMLButtonElement).style.background = GREEN_LIGHT; }} onMouseLeave={e => { if (!draftSavedPulse) (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}>
                {draftSaveError ? (<><Icon name="error" size={13} /> {tt("submitScholar.footer.draftSaveFailed", "Save failed")}</>) : draftSavedPulse ? (<><Icon name="check" size={13} /> {tt("submitScholar.footer.draftSaved", "Saved")}</>) : t("submitScholar.footer.saveDraft")}
              </button>
              {draftSaveError && (
                <div style={{ position: "absolute", bottom: "calc(100% + 8px)", right: 0, width: "220px", padding: "8px 12px", background: "#fff", border: `1.5px solid ${DANGER_BORDER}`, borderRadius: "8px", fontSize: "11px", color: "#7a231d", boxShadow: "0 4px 16px rgba(0,0,0,0.08)" }}>
                  {draftSaveError}
                </div>
              )}
            </div>
            {step < STEPS.length - 1 ? (
              <button onClick={goNext} style={{ padding: "10px 28px", background: GREEN, color: "#fff", border: "none", borderRadius: "8px", fontFamily: MONO, fontSize: "10px", fontWeight: 700, letterSpacing: "0.1em", cursor: "pointer", transition: "background 0.15s", display: "inline-flex", alignItems: "center", gap: "8px" }} onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = GREEN_DARK} onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = GREEN}>{t("submitScholar.footer.next")} <Icon name="arrow_forward" size={14} /></button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={!canSubmit}
                style={{ padding: "10px 28px", minWidth: "150px", justifyContent: "center", background: canSubmit ? GREEN : "#c0c9c3", color: "#fff", border: "none", borderRadius: "8px", fontFamily: MONO, fontSize: "10px", fontWeight: 700, letterSpacing: "0.1em", cursor: canSubmit ? "pointer" : "not-allowed", transition: "background 0.15s", display: "inline-flex", alignItems: "center", gap: "8px" }}
                onMouseEnter={e => { if (canSubmit) (e.currentTarget as HTMLButtonElement).style.background = GREEN_DARK; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = canSubmit ? GREEN : "#c0c9c3"; }}>
                {isSubmitting ? (
                  <>{tt("submitScholar.footer.submitting", "Submitting...")} <Spinner /></>
                ) : (
                  <>{t("submitScholar.footer.submit")} <Icon name="send" size={14} /></>
                )}
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default SubmitScholarPage;