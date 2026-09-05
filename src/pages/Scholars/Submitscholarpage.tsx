import React, { useState, useRef, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useLang } from "../../context/LanguageContext";
import { scholarsApi } from "../../api/scholarsApi";

/* ─────────────────────────────────────────────
   TYPES
───────────────────────────────────────────── */
type Language = "EN" | "AR" | "FR";
type AccessMode = "none" | "upload" | "link";

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

// ✅ NEW: fixes "Parameter 's' implicitly has an 'any' type"
interface ScholarSearchResult {
  id: number;
  name: string;
  discipline: string;
  born: string | number;
}

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
const SANS = "'Inter', system-ui, sans-serif";
const HANKEN = "'Hanken Grotesk', sans-serif";
const GREEN = "#1e4d3a";
const GREEN_DARK = "#285b4b";
const GREEN_LIGHT = "rgba(30,77,58,0.08)";
const GREEN_BORDER = "rgba(30,77,58,0.25)";
const BORDER = "rgba(192,201,195,0.5)";
const MUTED = "#707974";
const DANGER = "#b3261e";
const DANGER_BG = "rgba(179,38,30,0.06)";
const DANGER_BORDER = "rgba(179,38,30,0.35)";
const GOLD = "#C9A84C";
const GOLD_LIGHT = "rgba(201,168,76,0.1)";

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
   DRAFT PERSISTENCE
───────────────────────────────────────────── */
const DRAFT_STORAGE_PREFIX = "oulamauna_scholar_draft_";
const SESSION_KEY = "oulamauna_draft_session";

function draftKey(scholarId?: string, versionId?: number | null, lang?: string) {
  if (versionId) return `${DRAFT_STORAGE_PREFIX}v_${versionId}`;
  const langSuffix = lang ? `_${lang.toLowerCase()}` : '_default';
  if (scholarId) return `${DRAFT_STORAGE_PREFIX}s_${scholarId}${langSuffix}`;
  return `${DRAFT_STORAGE_PREFIX}new${langSuffix}`;
}

function saveDraft(scholarId: string | undefined, form: FormState, step: number, draftVersionId?: number | null, lang?: string) {
  try {
    const { portraitFile, portraitUrl, works, media, ...rest } = form;
    const serializable = { ...rest, works: works.map(({ file, ...w }) => w), media: media.map(({ file, ...m }) => m) };
    localStorage.setItem(draftKey(scholarId, draftVersionId, lang), JSON.stringify({ step, form: serializable, draftVersionId: draftVersionId ?? null, savedAt: Date.now() }));
    saveSession(scholarId, draftVersionId, lang);
  } catch (e) { console.warn("Could not save draft:", e); }
}

function loadDraft(scholarId: string | undefined, versionId?: number | null, lang?: string): { step: number; form: Partial<FormState>; draftVersionId: number | null } | null {
  try {
    const raw = localStorage.getItem(draftKey(scholarId, versionId, lang));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.form) return null;
    return { step: parsed.step ?? 0, form: parsed.form, draftVersionId: parsed.draftVersionId ?? null };
  } catch (e) { console.warn("Could not load draft:", e); return null; }
}

function saveSession(scholarId?: string, versionId?: number | null, lang?: string) {
  try { localStorage.setItem(SESSION_KEY, JSON.stringify({ scholarId, versionId, lang })); } catch (e) { /* ignore */ }
}

function loadSession() {
  try { const raw = localStorage.getItem(SESSION_KEY); return raw ? JSON.parse(raw) : null; } catch (e) { return null; }
}

function clearDraft(scholarId?: string, versionId?: number | null, lang?: string) {
  try { localStorage.removeItem(draftKey(scholarId, versionId, lang)); localStorage.removeItem(SESSION_KEY); } catch (e) { /* ignore */ }
}

/* ─────────────────────────────────────────────
   SHARED STYLE HELPERS
───────────────────────────────────────────── */
const inputStyle: React.CSSProperties = { 
  width: "100%", padding: "14px 16px", border: `1.5px solid ${BORDER}`, borderRadius: "10px", fontSize: "14px", color: "#191c1b", backgroundColor: "#fff", fontFamily: SANS, outline: "none", transition: "all 0.2s ease" 
};

const labelStyle: React.CSSProperties = { fontFamily: MONO, fontSize: "10px", color: MUTED, letterSpacing: "0.08em", display: "block", marginBottom: "8px", textTransform: "uppercase" as const, fontWeight: 600 };
const sectionLabelStyle: React.CSSProperties = { fontFamily: MONO, fontSize: "10px", color: GREEN, letterSpacing: "0.12em", display: "block", marginBottom: "6px", textTransform: "uppercase" as const, fontWeight: 700 };

function FocusInput({ style, hasError, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { hasError?: boolean }) {
  const [focused, setFocused] = useState(false);
  return <input {...props} style={{ ...inputStyle, borderColor: focused ? GREEN : hasError ? DANGER : BORDER, boxShadow: focused ? `0 0 0 3px ${GREEN_LIGHT}` : 'none', ...style }} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} />;
}

function FocusSelect({ style, hasError, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { hasError?: boolean }) {
  const [focused, setFocused] = useState(false);
  return <select {...props} style={{ ...inputStyle, cursor: "pointer", borderColor: focused ? GREEN : hasError ? DANGER : BORDER, boxShadow: focused ? `0 0 0 3px ${GREEN_LIGHT}` : 'none', ...style }} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} />;
}

function FocusTextarea({ style, hasError, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { hasError?: boolean }) {
  const [focused, setFocused] = useState(false);
  return <textarea {...props} style={{ ...inputStyle, resize: "vertical", minHeight: "100px", borderColor: focused ? GREEN : hasError ? DANGER : BORDER, boxShadow: focused ? `0 0 0 3px ${GREEN_LIGHT}` : 'none', ...style }} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} />;
}

function Icon({ name, size = 20 }: { name: string; size?: number }) {
  return <span className="material-symbols-outlined" style={{ fontSize: `${size}px`, lineHeight: 1, verticalAlign: "middle", userSelect: "none" }}>{name}</span>;
}

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "6px", fontSize: "12px", color: DANGER, fontWeight: 600, animation: "fade-in-up 0.25s ease-out" }}>
      <Icon name="error" size={14} /> {msg}
    </div>
  );
}

function ErrorBanner({ errors, title }: { errors: Record<string, string>; title: string }) {
  const messages = Object.values(errors);
  if (messages.length === 0) return null;
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: "12px", padding: "16px 18px", background: DANGER_BG, border: `1.5px solid ${DANGER_BORDER}`, borderRadius: "12px", marginBottom: "28px", animation: "fade-in-up 0.3s ease-out" }}>
      <span style={{ color: DANGER, flexShrink: 0, marginTop: "2px" }}><Icon name="error" size={20} /></span>
      <div>
        <div style={{ fontFamily: HANKEN, fontSize: "14px", color: DANGER, fontWeight: 700, letterSpacing: "0.02em", marginBottom: "8px" }}>{title}</div>
        <ul style={{ margin: 0, paddingLeft: "18px" }}>
          {messages.map((m, i) => (<li key={i} style={{ fontSize: "13px", color: "#7a231d", lineHeight: 1.7, animation: `fade-in-up 0.3s ease-out ${i * 0.05}s both` }}>{m}</li>))}
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
      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: items.length ? "12px" : "0" }}>
        {items.map((item, i) => (
          <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "6px 12px", background: GREEN, color: "#fff", borderRadius: "20px", fontFamily: MONO, fontSize: "11px", fontWeight: 600 }}>
            {item}
            <button onClick={() => onRemove(i)} style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", opacity: 0.8, fontSize: "16px", lineHeight: 1, display: "flex", alignItems: "center", padding: 0 }}>×</button>
          </span>
        ))}
      </div>
      <div style={{ display: "flex", gap: "10px" }}>
        <FocusInput type="text" value={val} onChange={e => setVal(e.target.value)} onKeyDown={e => e.key === "Enter" && (e.preventDefault(), submit())} placeholder={placeholder} />
        <button onClick={submit} style={{ padding: "12px 20px", border: `2px solid ${GREEN}`, borderRadius: "10px", background: "transparent", color: GREEN, fontFamily: HANKEN, fontSize: "11px", fontWeight: 700, letterSpacing: "0.05em", cursor: "pointer", whiteSpace: "nowrap", transition: "all 0.2s", flexShrink: 0 }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = GREEN; (e.currentTarget as HTMLButtonElement).style.color = "#fff"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; (e.currentTarget as HTMLButtonElement).style.color = GREEN; }}>+ ADD</button>
      </div>
    </div>
  );
}

function PersonLinkSection({ person, onChange, t, lang, selectedScholarIds }: { person: PersonEntry; onChange: (p: PersonEntry) => void; t: (k: string) => string; lang: string; selectedScholarIds: number[]; }) {
  const [query, setQuery] = useState("");
  // ✅ FIXED: typed state instead of any[]
  const [results, setResults] = useState<ScholarSearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ✅ FIXED: explicit ScholarSearchResult[] typing removes the implicit-any on the filter callback
  const onInput = async (q: string) => {
    setQuery(q);
    if (q.length < 2) { setResults([]); setOpen(false); return; }
    setLoading(true);
    try {
      const res = await scholarsApi.searchByName(q, lang);
      const mapped: ScholarSearchResult[] = (res.data?.scholar_versions?.map((v: any) => ({
        id: v.version_id,
        name: v.canonical_name,
        discipline: v.scholar_disciplines?.[0]?.disciplines?.name || "Unknown",
        born: v.scholar_dates?.find((d: any) => d.date_type === "birth")?.year || "Unknown",
      })) || []) as ScholarSearchResult[];
      const filtered = mapped.filter((s: ScholarSearchResult) => !selectedScholarIds.includes(s.id));
      setResults(filtered);
      setOpen(true);
    } catch (error) { console.error("Search error:", error); setResults([]); } finally { setLoading(false); }
  };

  if (person.scholar_id) {
    return (
      <div ref={ref} style={{ position: "relative" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 16px", background: GREEN_LIGHT, border: `1.5px solid ${GREEN_BORDER}`, borderRadius: "10px", animation: "fade-in 0.2s ease-out" }}>
          <div style={{ flex: 1 }}><div style={{ fontSize: "14px", fontWeight: 700, color: GREEN }}>{person.scholar_name}</div></div>
          <button onClick={() => onChange({ scholar_id: null, scholar_name: "" })} style={{ background: "none", border: "none", cursor: "pointer", color: DANGER, fontSize: "20px", display: "flex", alignItems: "center" }}>×</button>
        </div>
      </div>
    );
  }

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <div style={{ position: "relative" }}>
        <span style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: MUTED, display: "flex", alignItems: "center" }}><Icon name="search" size={18} /></span>
        <FocusInput type="text" value={query} onChange={e => onInput(e.target.value)} placeholder={loading ? "Searching..." : "Search scholar by name..."} style={{ paddingLeft: "40px" }} />
      </div>
      {open && (
        <div style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0, background: "#fff", border: `1.5px solid ${GREEN_BORDER}`, borderRadius: "10px", boxShadow: "0 8px 32px rgba(11,67,53,0.12)", zIndex: 100, maxHeight: "220px", overflowY: "auto", animation: "fade-in-up 0.15s ease-out" }}>
          {results.length === 0 ? (
            <div style={{ padding: "14px 16px", fontSize: "13px", color: MUTED, fontStyle: "italic" }}>{loading ? "Searching..." : "No scholars found"}</div>
          ) : results.map((s: ScholarSearchResult) => {
            const isAlreadySelected = selectedScholarIds.includes(s.id);
            return (
              <div key={s.id} onClick={() => { if (isAlreadySelected) return; onChange({ scholar_id: s.id, scholar_name: s.name }); setOpen(false); setQuery(""); }}
                style={{ padding: "12px 16px", cursor: isAlreadySelected ? "not-allowed" : "pointer", borderBottom: `1px solid rgba(192,201,195,0.2)`, transition: "background 0.15s", opacity: isAlreadySelected ? 0.5 : 1, backgroundColor: isAlreadySelected ? "#f5f5f5" : "transparent" }}
                onMouseEnter={e => { if (!isAlreadySelected) (e.currentTarget as HTMLDivElement).style.background = GREEN_LIGHT; }}
                onMouseLeave={e => { if (!isAlreadySelected) (e.currentTarget as HTMLDivElement).style.background = "transparent"; }}>
                <div style={{ fontSize: "14px", fontWeight: 700, color: "#191c1b" }}>{s.name}</div>
                <div style={{ fontFamily: MONO, fontSize: "11px", color: MUTED }}>{s.discipline} · b.{s.born}</div>
                {isAlreadySelected && <div style={{ fontSize: "11px", color: DANGER, marginTop: "4px" }}>Already added</div>}
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
      <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "14px 18px", background: GREEN_LIGHT, border: `1.5px solid ${GREEN_BORDER}`, borderRadius: "10px", animation: "fade-in 0.2s ease-out" }}>
        <Icon name="attach_file" size={20} />
        <span style={{ fontSize: "14px", fontWeight: 600, color: GREEN, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{file.name}</span>
        <span style={{ fontFamily: MONO, fontSize: "10px", color: MUTED }}>{(file.size / 1024 / 1024).toFixed(1)} MB</span>
        <button onClick={onRemove} style={{ background: "none", border: "none", cursor: "pointer", color: MUTED, display: "flex", alignItems: "center" }}><Icon name="close" size={18} /></button>
      </div>
    );
  }
  return (
    <>
      <input ref={ref} type="file" accept={accept} style={{ display: "none" }} onChange={e => { const f = e.target.files?.[0]; if (f) onFile(f); }} />
      <div onClick={() => ref.current?.click()} onDragOver={e => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)} onDrop={e => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files?.[0]; if (f) onFile(f); }}
        style={{ border: `2px dashed ${drag ? GREEN : BORDER}`, borderRadius: "12px", padding: "28px", textAlign: "center", cursor: "pointer", background: drag ? GREEN_LIGHT : "#fafbf8", transition: "all 0.2s" }}>
        <Icon name="cloud_upload" size={32} />
        <p style={{ fontSize: "14px", color: "#404945", margin: "10px 0 6px", fontWeight: 600 }}>Drop file here, or <span style={{ color: GREEN, textDecoration: "underline" }}>browse</span></p>
        <p style={{ fontFamily: MONO, fontSize: "10px", color: "#c0c9c3", margin: 0 }}>{hint}</p>
      </div>
    </>
  );
}

function Divider() { return <div style={{ height: "1px", background: "rgba(192,201,195,0.35)", margin: "32px 0" }} />; }

function AccessModeTabs({ mode, onChange, children, t }: { mode: AccessMode; onChange: (m: AccessMode) => void; children: React.ReactNode; t: (k: string) => string; }) {
  const tabStyle = (active: boolean): React.CSSProperties => ({ flex: 1, padding: "10px 0", textAlign: "center" as const, fontFamily: MONO, fontSize: "10px", fontWeight: 700, letterSpacing: "0.05em", border: "none", cursor: "pointer", transition: "all 0.2s", background: active ? GREEN : "transparent", color: active ? "#fff" : MUTED, display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" });
  return (
    <div>
      <div style={{ display: "flex", border: `1.5px solid ${BORDER}`, borderRadius: "10px", overflow: "hidden", marginBottom: "14px" }}>
        <button style={tabStyle(mode === "none")} onClick={() => onChange("none")}><Icon name="block" size={14} /> {t("submitScholar.step4.none")}</button>
        <button style={{ ...tabStyle(mode === "upload"), borderLeft: `1px solid ${BORDER}`, borderRight: `1px solid ${BORDER}` }} onClick={() => onChange("upload")}><Icon name="upload_file" size={14} /> {t("submitScholar.step4.upload")}</button>
        <button style={tabStyle(mode === "link")} onClick={() => onChange("link")}><Icon name="link" size={14} /> {t("submitScholar.step4.link")}</button>
      </div>
      {children}
    </div>
  );
}

function DisciplineBtn({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return <button onClick={onClick} style={{ padding: "8px 16px", border: `2px solid ${active ? GREEN : BORDER}`, borderRadius: "24px", background: active ? GREEN : "transparent", color: active ? "#fff" : MUTED, fontFamily: HANKEN, fontSize: "11px", fontWeight: 700, cursor: "pointer", transition: "all 0.2s", letterSpacing: "0.03em" }}>{label}</button>;
}

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <div style={{ background: "#fff", border: `1px solid rgba(192,201,195,0.4)`, borderRadius: "20px", padding: "24px", marginBottom: "24px", boxShadow: "0 4px 16px rgba(0,0,0,0.06)", ...style }} className="responsive-card-padding">{children}</div>;
}

function CardTitle({ num, title }: { num: string; title: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "36px", paddingBottom: "24px", borderBottom: "1px solid rgba(192,201,195,0.3)" }}>
      <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: GREEN, color: "#fff", fontFamily: HANKEN, fontSize: "14px", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 4px 12px rgba(30,77,58,0.3)" }}>{num}</div>
      <h2 style={{ fontFamily: HANKEN, fontSize: "24px", fontWeight: 700, color: GREEN, margin: 0 }}>{title}</h2>
    </div>
  );
}

function ItemCard({ index, label, onRemove, children }: { index: number; label: string; onRemove: () => void; children: React.ReactNode }) {
  return (
    <div style={{ border: `1.5px solid ${BORDER}`, borderRadius: "14px", padding: "28px", marginBottom: "16px", background: "#fafbf8", transition: "all 0.2s ease" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <span style={{ fontFamily: MONO, fontSize: "11px", color: GREEN, fontWeight: 700, letterSpacing: "0.08em" }}>{label} {index + 1}</span>
        <button onClick={onRemove} style={{ background: "none", border: "none", cursor: "pointer", color: MUTED, fontSize: "24px", lineHeight: 1, display: "flex", alignItems: "center", padding: "4px", borderRadius: "6px", transition: "all 0.15s" }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = DANGER; (e.currentTarget as HTMLButtonElement).style.background = DANGER_BG; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = MUTED; (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}>×</button>
      </div>
      {children}
    </div>
  );
}

function AddBtn({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} style={{ width: "100%", padding: "14px", border: `2px dashed ${BORDER}`, borderRadius: "12px", background: "transparent", color: MUTED, fontFamily: HANKEN, fontSize: "11px", fontWeight: 700, letterSpacing: "0.05em", cursor: "pointer", transition: "all 0.2s", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginTop: "6px" }}
      onMouseEnter={e => { const b = e.currentTarget as HTMLButtonElement; b.style.borderColor = GREEN; b.style.color = GREEN; b.style.background = GREEN_LIGHT; }}
      onMouseLeave={e => { const b = e.currentTarget as HTMLButtonElement; b.style.borderColor = BORDER; b.style.color = MUTED; b.style.background = "transparent"; }}>
      <Icon name="add_circle" size={18} /> {children}
    </button>
  );
}

function Spinner({ size = 16, color = "#fff" }: { size?: number; color?: string }) {
  return <span style={{ width: size, height: size, border: `2px solid ${color}44`, borderTopColor: color, borderRadius: "50%", display: "inline-block", animation: "submit-spin 0.7s linear infinite" }} />;
}

/* ─────────────────────────────────────────────
   FOOTER BUTTONS (with hover, like Home page)
───────────────────────────────────────────── */
function FooterBackButton({ onClick, label }: { onClick: () => void; label: string }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="footer-btn"
      style={{
        padding: "8px 16px", border: `2px solid ${hovered ? GREEN : BORDER}`, borderRadius: "8px",
        background: "transparent", color: hovered ? GREEN : MUTED, fontFamily: HANKEN, fontSize: "10px",
        fontWeight: 700, letterSpacing: "0.05em", cursor: "pointer", display: "inline-flex",
        alignItems: "center", gap: "6px", transition: "all 0.2s",
      }}
    >
      <Icon name="arrow_back" size={14} /> {label}
    </button>
  );
}

function FooterSaveDraftButton({ onClick, error, saved, labelDefault, labelSaved, labelError }: {
  onClick: () => void; error: boolean; saved: boolean; labelDefault: string; labelSaved: string; labelError: string;
}) {
  const [hovered, setHovered] = useState(false);
  const accent = error ? DANGER : GREEN;
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="footer-btn"
      style={{
        padding: "8px 14px", border: `2px solid ${accent}`, borderRadius: "8px",
        background: hovered || saved ? GREEN_LIGHT : "transparent", color: accent, fontFamily: HANKEN,
        fontSize: "10px", fontWeight: 700, letterSpacing: "0.05em", cursor: "pointer", transition: "all 0.2s",
        display: "inline-flex", alignItems: "center", gap: "6px",
      }}
    >
      {error ? (<><Icon name="error" size={12} /> {labelError}</>) : saved ? (<><Icon name="check" size={12} /> {labelSaved}</>) : labelDefault}
    </button>
  );
}

function FooterNextButton({ onClick, label }: { onClick: () => void; label: string }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="footer-btn footer-btn-fill"
      style={{
        padding: "8px 18px", background: hovered ? "#fbf9f4" : GREEN, color: hovered ? GREEN : "#fff",
        border: `2px solid ${GREEN}`, borderRadius: "8px", fontFamily: HANKEN, fontSize: "10px",
        fontWeight: 700, letterSpacing: "0.05em", cursor: "pointer", transition: "all 0.2s",
        display: "inline-flex", alignItems: "center", gap: "6px",
      }}
    >
      {label} <Icon name="arrow_forward" size={14} />
    </button>
  );
}

function FooterSubmitButton({ onClick, disabled, submitting, label, submittingLabel }: {
  onClick: () => void; disabled: boolean; submitting: boolean; label: string; submittingLabel: string;
}) {
  const [hovered, setHovered] = useState(false);
  const active = hovered && !disabled;
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="footer-btn footer-btn-fill"
      style={{
        padding: "8px 18px", minWidth: "140px", justifyContent: "center",
        background: disabled ? "#c0c9c3" : active ? "#fbf9f4" : GREEN,
        color: disabled ? "#fff" : active ? GREEN : "#fff",
        border: `2px solid ${disabled ? "#c0c9c3" : GREEN}`, borderRadius: "8px", fontFamily: HANKEN,
        fontSize: "10px", fontWeight: 700, letterSpacing: "0.05em", cursor: disabled ? "not-allowed" : "pointer",
        transition: "all 0.2s", display: "inline-flex", alignItems: "center", gap: "6px",
      }}
    >
      {submitting ? (<>{submittingLabel} <Spinner size={14} /></>) : (<>{label} <Icon name="send" size={14} /></>)}
    </button>
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
  const btnStyle = (isActive: boolean): React.CSSProperties => ({ background: isActive ? GREEN_LIGHT : "transparent", border: "none", cursor: "pointer", padding: "8px 12px", borderRadius: "6px", color: isActive ? GREEN : "#404945", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s", fontWeight: isActive ? 700 : 400 });
  return (
    <div style={{ border: `1.5px solid ${BORDER}`, borderRadius: "10px", overflow: "hidden", background: "#fff" }}>
      <div style={{ display: "flex", gap: "2px", padding: "8px 12px", background: "#f3f4f1", borderBottom: `1px solid ${BORDER}`, flexWrap: "wrap" }}>
        <button title="Bold" style={btnStyle(activeCmds['bold'])} onMouseDown={e => { e.preventDefault(); exec('bold'); }}><Icon name="format_bold" size={18} /></button>
        <button title="Italic" style={btnStyle(activeCmds['italic'])} onMouseDown={e => { e.preventDefault(); exec('italic'); }}><Icon name="format_italic" size={18} /></button>
        <div style={{ width: "1px", background: BORDER, margin: "0 6px" }} />
        <button title="Heading" style={btnStyle(activeCmds['h2'])} onMouseDown={e => { e.preventDefault(); exec('formatBlock', 'h2'); }}><span style={{ fontFamily: SERIF, fontSize: "16px", fontWeight: 700 }}>T</span></button>
        <button title="Quote" style={btnStyle(activeCmds['blockquote'])} onMouseDown={e => { e.preventDefault(); exec('formatBlock', 'blockquote'); }}><span style={{ fontFamily: SERIF, fontSize: "16px", fontWeight: 700, lineHeight: 1 }}>&ldquo;</span></button>
        <button title="List" style={btnStyle(activeCmds['insertUnorderedList'])} onMouseDown={e => { e.preventDefault(); exec('insertUnorderedList'); }}><Icon name="format_list_bulleted" size={18} /></button>
        <div style={{ width: "1px", background: BORDER, margin: "0 6px" }} />
        <button title="Link" style={btnStyle(false)} onMouseDown={e => { e.preventDefault(); const url = prompt("Enter URL:"); if (url) exec('createLink', url); }}><Icon name="link" size={18} /></button>
        <button title="Image" style={btnStyle(false)} onMouseDown={e => { e.preventDefault(); const url = prompt("Enter Image URL:"); if (url) exec('insertImage', url); }}><Icon name="image" size={18} /></button>
      </div>
      <div ref={editorRef} contentEditable suppressContentEditableWarning onInput={handleInput} onKeyUp={updateActiveState} onMouseUp={updateActiveState} onFocus={updateActiveState} data-placeholder={placeholder}
        style={{ minHeight: "450px", padding: "18px", fontFamily: SANS, fontSize: "15px", lineHeight: "1.8", color: "#191c1b", outline: "none", whiteSpace: "pre-wrap", wordBreak: "break-word" }} />
      <style>{`[contenteditable]:empty:before { content: attr(data-placeholder); color: ${MUTED}; pointer-events: none; display: block; } [contenteditable] blockquote { border-left: 3px solid ${GREEN}; margin: 12px 0; padding-left: 18px; color: #404945; font-style: italic; } [contenteditable] h2 { font-family: ${SERIF}; font-size: 22px; color: ${GREEN}; margin: 18px 0 10px 0; } [contenteditable] ul { padding-left: 24px; margin: 10px 0; } [contenteditable] a { color: ${GREEN}; text-decoration: underline; }`}</style>
    </div>
  );
};

/* ─────────────────────────────────────────────
   REVIEW HELPERS
───────────────────────────────────────────── */
function ReviewSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: "28px", padding: "24px", background: "#f9faf7", border: `1.5px solid ${BORDER}`, borderRadius: "14px" }}>
      <div style={{ fontFamily: MONO, fontSize: "11px", color: GREEN, letterSpacing: "0.12em", marginBottom: "20px", fontWeight: 700, textTransform: "uppercase" }}>{title}</div>
      {children}
    </div>
  );
}

function ReviewField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontFamily: MONO, fontSize: "10px", color: MUTED, marginBottom: "4px", fontWeight: 600, textTransform: "uppercase" }}>{label}</div>
      <div style={{ fontSize: "14px", fontWeight: 600, color: value && value !== "—" ? "#191c1b" : "#c0c9c3", wordBreak: "break-word" }}>{value}</div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────── */
const SubmitScholarPage: React.FC = () => {
  const { t, setLang } = useLang();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const urlDraftId = searchParams.get("draftId"); 
  const urlRejectedId = searchParams.get("rejectedId");

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
  const validRouteLang: Language | null = routeLang && (["en", "ar", "fr"] as string[]).includes(routeLang.toLowerCase()) ? (routeLang.toUpperCase() as Language) : null;

  const initialPhase: "lang" | "form" | "success" = validRouteLang ? "form" : "lang";
  const [phase, setPhase] = useState<"lang" | "form" | "success">(initialPhase);
  const [pickedLang, setPickedLang] = useState<Language | null>(null);
  const lang: Language = validRouteLang ?? (pickedLang || "EN");
  const [step, setStep] = useState(0);
  const topRef = useRef<HTMLDivElement>(null);
  const [successMessage, setSuccessMessage] = useState("");

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showValidationErrors, setShowValidationErrors] = useState(false);
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

  const selectedScholarIds = [...form.teachers.map(t => t.scholar_id).filter((id): id is number => id !== null), ...form.students.map(s => s.scholar_id).filter((id): id is number => id !== null)];

  const [disciplines, setDisciplines] = useState<{ discipline_id: number; name: string }[]>([]);
  const [regions, setRegions] = useState<{ region_id: number; name: string }[]>([]);
  const [isLoadingMeta, setIsLoadingMeta] = useState(true);
  const [metaError, setMetaError] = useState<string | null>(null);
  const portraitInputRef = useRef<HTMLInputElement>(null);
  const loadedMetaLangRef = useRef<Language | null>(null);
  const draftLoadAttempted = useRef(false);

  const upd = <K extends keyof FormState>(key: K, val: FormState[K]) => setForm(f => ({ ...f, [key]: val }));

const handleDateChange = (field: keyof FormState, value: string) => {
  const cleaned = value.replace(/[^0-9\-]/g, '');
  const currentGregorianYear = new Date().getFullYear();
  const currentHijriYear = parseInt(new Intl.DateTimeFormat('en-US-u-ca-islamic-umalqura', { year: 'numeric' }).format(new Date()));
  const MIN_YEAR = 1;
  const MAX_YEAR = 9999;
  
  setForm(prevForm => {
    const newFormValues = { ...prevForm, [field]: cleaned };
    
    const birthG = newFormValues.birth_date_gregorian;
    const deathG = newFormValues.death_date_gregorian;
    const birthH = newFormValues.birth_date_hijri;
    const deathH = newFormValues.death_date_hijri;
    
    const newErrors: Record<string, string> = {};
    
    if (birthG) {
      const num = Number(birthG);
      if (isNaN(num) || birthG.endsWith('-') || birthG === '-') {
        newErrors.birth_date_gregorian = "Invalid year";
      } else if (num < MIN_YEAR || num > MAX_YEAR) {
        newErrors.birth_date_gregorian = "Invalid year";
      } else if (num > currentGregorianYear) {
        newErrors.birth_date_gregorian = "Year cannot be in the future";
      }
    }
    
    if (deathG) {
      const num = Number(deathG);
      if (isNaN(num) || deathG.endsWith('-') || deathG === '-') {
        newErrors.death_date_gregorian = "Invalid year";
      } else if (num < MIN_YEAR || num > MAX_YEAR) {
        newErrors.death_date_gregorian = "Invalid year";
      } else if (num > currentGregorianYear) {
        newErrors.death_date_gregorian = "Year cannot be in the future";
      }
    }
    
    if (birthG && deathG && !birthG.endsWith('-') && !deathG.endsWith('-') && birthG !== '-' && deathG !== '-') {
      const numB = Number(birthG);
      const numD = Number(deathG);
      if (!isNaN(numB) && !isNaN(numD) && numB >= MIN_YEAR && numB <= MAX_YEAR && numD >= MIN_YEAR && numD <= MAX_YEAR) {
        if (numD < numB) newErrors.death_date_gregorian = "Death date cannot be before birth date";
      }
    }

    if (birthH) {
      const num = Number(birthH);
      if (isNaN(num) || birthH.endsWith('-') || birthH === '-') {
        newErrors.birth_date_hijri = "Invalid year";
      } else if (num < MIN_YEAR || num > MAX_YEAR) {
        newErrors.birth_date_hijri = "Invalid year";
      } else if (num > currentHijriYear) {
        newErrors.birth_date_hijri = "Year cannot be in the future";
      }
    }
    
    if (deathH) {
      const num = Number(deathH);
      if (isNaN(num) || deathH.endsWith('-') || deathH === '-') {
        newErrors.death_date_hijri = "Invalid year";
      } else if (num < MIN_YEAR || num > MAX_YEAR) {
        newErrors.death_date_hijri = "Invalid year";
      } else if (num > currentHijriYear) {
        newErrors.death_date_hijri = "Year cannot be in the future";
      }
    }

    if (birthH && deathH && !birthH.endsWith('-') && !deathH.endsWith('-') && birthH !== '-' && deathH !== '-') {
      const numB = Number(birthH);
      const numD = Number(deathH);
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

 const handleCenturyChange = (field: keyof FormState, value: string) => {
  const numValue = value === '' ? null : parseInt(value, 10);
  const currentGregorianYear = new Date().getFullYear();
  const currentHijriYear = parseInt(new Intl.DateTimeFormat('en-US-u-ca-islamic-umalqura', { year: 'numeric' }).format(new Date()));
  
  const currentGregorianCentury = Math.ceil(currentGregorianYear / 100);
  const currentHijriCentury = Math.ceil(currentHijriYear / 100);
  
  const MAX_GREGORIAN_CENTURY = currentGregorianCentury;
  const MAX_HIJRI_CENTURY = currentHijriCentury;
  const MIN_CENTURY = 1;
  
  setForm(prevForm => {
    const newFormValues = { ...prevForm, [field]: numValue };
    
    const gregStart = newFormValues.century_gregorian_start;
    const gregEnd = newFormValues.century_gregorian_end;
    const hijriStart = newFormValues.century_hijri_start;
    const hijriEnd = newFormValues.century_hijri_end;
    
    const newErrors: Record<string, string> = {};
    
    if (gregStart !== null) {
      if (isNaN(gregStart) || gregStart < MIN_CENTURY || gregStart > MAX_GREGORIAN_CENTURY) {
        newErrors.century_gregorian_start = `Invalid century (must be 1-${MAX_GREGORIAN_CENTURY})`;
      }
    }
    if (gregEnd !== null) {
      if (isNaN(gregEnd) || gregEnd < MIN_CENTURY || gregEnd > MAX_GREGORIAN_CENTURY) {
        newErrors.century_gregorian_end = `Invalid century (must be 1-${MAX_GREGORIAN_CENTURY})`;
      }
    }
    if (gregStart !== null && gregEnd !== null && !isNaN(gregStart) && !isNaN(gregEnd)) {
      if (gregStart >= MIN_CENTURY && gregStart <= MAX_GREGORIAN_CENTURY && gregEnd >= MIN_CENTURY && gregEnd <= MAX_GREGORIAN_CENTURY) {
        if (gregEnd < gregStart) newErrors.century_gregorian_end = "End century cannot be before start century";
      }
    }

    if (hijriStart !== null) {
      if (isNaN(hijriStart) || hijriStart < MIN_CENTURY || hijriStart > MAX_HIJRI_CENTURY) {
        newErrors.century_hijri_start = `Invalid century (must be 1-${MAX_HIJRI_CENTURY})`;
      }
    }
    if (hijriEnd !== null) {
      if (isNaN(hijriEnd) || hijriEnd < MIN_CENTURY || hijriEnd > MAX_HIJRI_CENTURY) {
        newErrors.century_hijri_end = `Invalid century (must be 1-${MAX_HIJRI_CENTURY})`;
      }
    }
    if (hijriStart !== null && hijriEnd !== null && !isNaN(hijriStart) && !isNaN(hijriEnd)) {
      if (hijriStart >= MIN_CENTURY && hijriStart <= MAX_HIJRI_CENTURY && hijriEnd >= MIN_CENTURY && hijriEnd <= MAX_HIJRI_CENTURY) {
        if (hijriEnd < hijriStart) newErrors.century_hijri_end = "End century cannot be before start century";
      }
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

  useEffect(() => {
    if (phase !== "form" || draftLoadAttempted.current) return;
    draftLoadAttempted.current = true;

    const fetchAndMapVersion = async (idToFetch: number) => {
      try {
        const response = await scholarsApi.getVersionById(idToFetch);
        const version = response.data;
        const mappedForm: Partial<FormState> = {
          canonical_name: version.canonical_name || "", region_id: version.region_id,
          birth_date_gregorian: version.scholar_dates?.find((d: any) => d.date_type === "birth" && d.calendar === "gregorian")?.year?.toString() || "",
          birth_date_hijri: version.scholar_dates?.find((d: any) => d.date_type === "birth" && d.calendar === "hijri")?.year?.toString() || "",
          death_date_gregorian: version.scholar_dates?.find((d: any) => d.date_type === "death" && d.calendar === "gregorian")?.year?.toString() || "",
          death_date_hijri: version.scholar_dates?.find((d: any) => d.date_type === "death" && d.calendar === "hijri")?.year?.toString() || "",
          century_hijri_start: version.century_hijri_start, century_hijri_end: version.century_hijri_end,
          century_gregorian_start: version.century_gregorian_start, century_gregorian_end: version.century_gregorian_end,
          biography: version.biography || "", aliases: version.scholar_aliases?.map((a: any) => a.alias_name) || [],
          discipline_ids: version.scholar_disciplines?.map((d: any) => d.discipline_id) || [],
          teachers: version.scholar_relationships_as_source?.filter((r: any) => r.relation_type === "teacher").map((r: any) => ({ scholar_id: r.related_version_id, scholar_name: r.related_scholar_version?.canonical_name || "" })) || [],
          students: version.scholar_relationships_as_source?.filter((r: any) => r.relation_type === "student").map((r: any) => ({ scholar_id: r.related_version_id, scholar_name: r.related_scholar_version?.canonical_name || "" })) || [],
          works: version.scholar_works?.map((w: any) => ({ title: w.title || "", year: w.year?.toString() || "", type: w.format || "BOOK", desc: w.description || "", accessMode: w.media_url ? "link" : "none", file: null, url: w.media_url || "" })) || [],
          media: version.media?.map((m: any) => ({ title: m.title || "", type: m.file_type || "pdf", year: m.year?.toString() || "", desc: m.description || "", accessMode: m.media_url ? "link" : "upload", file: null, url: m.media_url || "" })) || [],
          refs: version.scholar_references?.map((r: any) => ({ title: r.title || "", citation: r.citation || "", url: r.url || "" })) || [],
        };
        setForm(f => ({ ...f, ...mappedForm }));
        setDraftVersionId(version.version_id);
        setDraftRestored(true);
        saveSession(scholarId, version.version_id, lang);
        if (routeLang && (["en", "ar", "fr"] as string[]).includes(routeLang.toLowerCase())) setPickedLang(routeLang.toUpperCase() as Language);
      } catch (error) {
        setForm({ canonical_name: "", region_id: null, birth_date_gregorian: "", birth_date_hijri: "", death_date_gregorian: "", death_date_hijri: "", century_hijri_start: null, century_hijri_end: null, century_gregorian_start: null, century_gregorian_end: null, biography: "", aliases: [], discipline_ids: [], portraitUrl: null, portraitFile: null, pageTitle: "", summary: "", quote: "", teachers: [], students: [], works: [], media: [], refs: [], confirmed: false });
        setDraftVersionId(null); setDraftRestored(false);
        navigate(`/scholars/submit/${lang.toLowerCase()}`, { replace: true });
      }
    };

    const loadLocalVersion = (versionId: number) => {
      const localDraft = loadDraft(scholarId, versionId, lang);
      if (localDraft && localDraft.form) {
        setForm(f => ({ ...f, ...localDraft.form })); setStep(localDraft.step || 0); setDraftVersionId(versionId); setDraftRestored(true); saveSession(scholarId, versionId, lang); return true;
      }
      return false;
    };

    if (urlDraftId || urlRejectedId) {
      const versionId = parseInt(urlDraftId || urlRejectedId!, 10);
      if (!loadLocalVersion(versionId)) fetchAndMapVersion(versionId);
      return; 
    }
    const session = loadSession();
    if (session?.versionId) {
      if (!loadLocalVersion(session.versionId)) fetchAndMapVersion(session.versionId);
      return;
    }
    const draft = loadDraft(session?.scholarId || scholarId, null, lang);
    if (draft) {
      const isStaleUnsavedNewDraft = !session?.scholarId && !draft.draftVersionId;
      if (isStaleUnsavedNewDraft) clearDraft(session?.scholarId || scholarId, null, lang);
      else { setForm(f => ({ ...f, ...draft.form })); setStep(draft.step || 0); setDraftVersionId(draft.draftVersionId); setDraftRestored(true); saveSession(session?.scholarId || scholarId, draft.draftVersionId, lang); }
    }
  }, [phase, urlDraftId, urlRejectedId, scholarId, navigate, routeLang, lang]);

  const buildDraftPayload = () => {
    const selectedLang = LANGUAGES.find(l => l.code === lang.toLowerCase());
    const relationships = [...form.teachers.filter(t => t.scholar_id !== null).map(t => ({ related_version_id: t.scholar_id, relation_type: "teacher" })), ...form.students.filter(s => s.scholar_id !== null).map(s => ({ related_version_id: s.scholar_id, relation_type: "student" }))];
    const payload: any = {
      draft_version_id: draftVersionId, canonical_name: form.canonical_name || null, region_id: form.region_id,
      century_hijri_start: form.century_hijri_start, century_hijri_end: form.century_hijri_end, century_gregorian_start: form.century_gregorian_start, century_gregorian_end: form.century_gregorian_end,
      biography: form.biography || null, language_id: selectedLang?.language_id || null, aliases: form.aliases, discipline_ids: form.discipline_ids,
      dates: [form.birth_date_gregorian ? { date_type: "birth", calendar: "gregorian", year: parseInt(form.birth_date_gregorian), raw_text: form.birth_date_gregorian, is_approximate: false } : null,
              form.birth_date_hijri ? { date_type: "birth", calendar: "hijri", year: parseInt(form.birth_date_hijri), raw_text: form.birth_date_hijri, is_approximate: false } : null,
              form.death_date_gregorian ? { date_type: "death", calendar: "gregorian", year: parseInt(form.death_date_gregorian), raw_text: form.death_date_gregorian, is_approximate: false } : null,
              form.death_date_hijri ? { date_type: "death", calendar: "hijri", year: parseInt(form.death_date_hijri), raw_text: form.death_date_hijri, is_approximate: false } : null].filter(Boolean),
      references: form.refs.filter(r => r.title || r.citation).map(r => ({ title: r.title, citation: r.citation, url: r.url || null })),
      works: form.works.filter(w => w.title).map(w => ({ title: w.title, year: w.year ? parseInt(w.year) : null, format: w.type, description: w.desc || null, media_url: w.accessMode === "link" ? w.url : null })),
      media: form.media.filter(m => m.title).map(m => ({ title: m.title, year: m.year ? parseInt(m.year) : null, description: m.desc || null, media_url: m.accessMode === "link" ? m.url : null })),
      relationships: relationships.length > 0 ? relationships : undefined,
    };
    if (scholarId) payload.scholar_id = parseInt(scholarId, 10);
    return payload;
  };

  const manualSaveDraft = async () => {
    if (urlRejectedId) {
      try {
        await scholarsApi.updateRejected(parseInt(urlRejectedId), { ...buildDraftPayload(), target_status: "draft" });
        clearDraft(scholarId, parseInt(urlRejectedId), lang);
        setDraftSavedPulse(true); setTimeout(() => setDraftSavedPulse(false), 2000);
        alert("Saved as draft successfully!"); navigate('/dashboard'); return;
      } catch (error: any) { setDraftSaveError(extractErrorMessage(error, "Could not save.")); return; }
    }
    try {
      setDraftSaveError(null);
      const response = await scholarsApi.saveDraft(buildDraftPayload());
      const newDraftVersionId = response?.data?.draft_version_id;
      if (newDraftVersionId) setDraftVersionId(newDraftVersionId);
      clearDraft(scholarId, newDraftVersionId || draftVersionId, lang);
      setDraftSavedPulse(true); setTimeout(() => setDraftSavedPulse(false), 2000);
      alert("Saved as draft successfully!"); navigate('/dashboard');
    } catch (error: any) { setDraftSaveError(extractErrorMessage(error, "Could not save draft to server.")); }
  };

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (phase === "form" && (form.canonical_name.trim() !== "" || form.biography.trim() !== "")) { e.preventDefault(); e.returnValue = ""; }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [phase, form.canonical_name, form.biography]);

  useEffect(() => {
    const fetchMeta = async () => {
      if (phase !== "form") return;
      setIsLoadingMeta(true); setMetaError(null);
      try {
        const [discRes, regRes] = await Promise.all([scholarsApi.getDisciplines(lang.toLowerCase()), scholarsApi.getRegions(lang.toLowerCase())]);
        setDisciplines(discRes.data || discRes || []); setRegions(regRes.data || regRes || []);
        if (loadedMetaLangRef.current !== null && loadedMetaLangRef.current !== lang) { upd("region_id", null); upd("discipline_ids", []); }
        loadedMetaLangRef.current = lang;
      } catch (error) { console.error("Failed to fetch meta data:", error); setMetaError("Failed to load disciplines and regions. Please refresh the page."); } 
      finally { setIsLoadingMeta(false); }
    };
    fetchMeta();
  }, [lang, phase]);

  const scrollTop = () => { setTimeout(() => topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50); };

 const validateStep = (stepIndex: number): Record<string, string> => {
  const errs: Record<string, string> = {};
  const currentGregorianYear = new Date().getFullYear();
  const currentHijriYear = parseInt(new Intl.DateTimeFormat('en-US-u-ca-islamic-umalqura', { year: 'numeric' }).format(new Date()));
  
  const MIN_YEAR = 1;
  const MAX_YEAR = 9999;
  
  const currentGregorianCentury = Math.ceil(currentGregorianYear / 100);
  const currentHijriCentury = Math.ceil(currentHijriYear / 100);
  
  const MAX_GREGORIAN_CENTURY = currentGregorianCentury;
  const MAX_HIJRI_CENTURY = currentHijriCentury;
  const MIN_CENTURY = 1;

  switch (stepIndex) {
    case 0:
      if (!form.canonical_name.trim()) errs.canonical_name = tt("submitScholar.errors.canonicalName", "Canonical name is required.");
      if (!form.region_id) errs.region_id = tt("submitScholar.errors.region", "Please select a region.");
      if (form.discipline_ids.length === 0) errs.discipline_ids = tt("submitScholar.errors.disciplines", "Select at least one discipline.");
      
      const bG = Number(form.birth_date_gregorian);
      const dG = Number(form.death_date_gregorian);
      if (form.birth_date_gregorian && (isNaN(bG) || form.birth_date_gregorian.endsWith('-') || bG < MIN_YEAR || bG > MAX_YEAR)) {
        errs.birth_date_gregorian = "Invalid year";
      } else if (bG > currentGregorianYear) {
        errs.birth_date_gregorian = "Year cannot be in the future";
      }
      if (form.death_date_gregorian && (isNaN(dG) || form.death_date_gregorian.endsWith('-') || dG < MIN_YEAR || dG > MAX_YEAR)) {
        errs.death_date_gregorian = "Invalid year";
      } else if (dG > currentGregorianYear) {
        errs.death_date_gregorian = "Year cannot be in the future";
      }
      if (form.birth_date_gregorian && form.death_date_gregorian && !isNaN(bG) && !isNaN(dG) && !form.birth_date_gregorian.endsWith('-') && !form.death_date_gregorian.endsWith('-') && bG >= MIN_YEAR && bG <= MAX_YEAR && dG >= MIN_YEAR && dG <= MAX_YEAR) {
        if (dG < bG) errs.death_date_gregorian = "Death date cannot be before birth date";
      }

      const bH = Number(form.birth_date_hijri);
      const dH = Number(form.death_date_hijri);
      
      if (form.birth_date_hijri && (isNaN(bH) || form.birth_date_hijri.endsWith('-') || bH < MIN_YEAR || bH > MAX_YEAR)) {
        errs.birth_date_hijri = "Invalid year";
      } else if (bH > currentHijriYear) {
        errs.birth_date_hijri = "Year cannot be in the future";
      }
      if (form.death_date_hijri && (isNaN(dH) || form.death_date_hijri.endsWith('-') || dH < MIN_YEAR || dH > MAX_YEAR)) {
        errs.death_date_hijri = "Invalid year";
      } else if (dH > currentHijriYear) {
        errs.death_date_hijri = "Year cannot be in the future";
      }
      if (form.birth_date_hijri && form.death_date_hijri && !isNaN(bH) && !isNaN(dH) && !form.birth_date_hijri.endsWith('-') && !form.death_date_hijri.endsWith('-') && bH >= MIN_YEAR && bH <= MAX_YEAR && dH >= MIN_YEAR && dH <= MAX_YEAR) {
        if (dH < bH) errs.death_date_hijri = "Death date cannot be before birth date";
      }

      if (form.century_gregorian_start !== null && (isNaN(form.century_gregorian_start) || form.century_gregorian_start < MIN_CENTURY || form.century_gregorian_start > MAX_GREGORIAN_CENTURY)) {
        errs.century_gregorian_start = `Invalid century (must be 1-${MAX_GREGORIAN_CENTURY})`;
      }
      if (form.century_gregorian_end !== null && (isNaN(form.century_gregorian_end) || form.century_gregorian_end < MIN_CENTURY || form.century_gregorian_end > MAX_GREGORIAN_CENTURY)) {
        errs.century_gregorian_end = `Invalid century (must be 1-${MAX_GREGORIAN_CENTURY})`;
      }
      if (form.century_gregorian_start !== null && form.century_gregorian_end !== null && !isNaN(form.century_gregorian_start) && !isNaN(form.century_gregorian_end) && form.century_gregorian_start >= MIN_CENTURY && form.century_gregorian_start <= MAX_GREGORIAN_CENTURY && form.century_gregorian_end >= MIN_CENTURY && form.century_gregorian_end <= MAX_GREGORIAN_CENTURY) {
        if (form.century_gregorian_end < form.century_gregorian_start) {
          errs.century_gregorian_end = "End century cannot be before start century";
        }
      }
      
      if (form.century_hijri_start !== null && (isNaN(form.century_hijri_start) || form.century_hijri_start < MIN_CENTURY || form.century_hijri_start > MAX_HIJRI_CENTURY)) {
        errs.century_hijri_start = `Invalid century (must be 1-${MAX_HIJRI_CENTURY})`;
      }
      if (form.century_hijri_end !== null && (isNaN(form.century_hijri_end) || form.century_hijri_end < MIN_CENTURY || form.century_hijri_end > MAX_HIJRI_CENTURY)) {
        errs.century_hijri_end = `Invalid century (must be 1-${MAX_HIJRI_CENTURY})`;
      }
      if (form.century_hijri_start !== null && form.century_hijri_end !== null && !isNaN(form.century_hijri_start) && !isNaN(form.century_hijri_end) && form.century_hijri_start >= MIN_CENTURY && form.century_hijri_start <= MAX_HIJRI_CENTURY && form.century_hijri_end >= MIN_CENTURY && form.century_hijri_end <= MAX_HIJRI_CENTURY) {
        if (form.century_hijri_end < form.century_hijri_start) {
          errs.century_hijri_end = "End century cannot be before start century";
        }
      }
      break;
    case 2: if (!stripHtml(form.biography)) errs.biography = tt("submitScholar.errors.biography", "Biography is required."); break;
    case 3: form.works.forEach((w, i) => { if (!w.title.trim()) errs[`work_${i}_title`] = t("submitScholar.errors.workTitle") || `Work ${i + 1}: title is required.`; if (!w.year.trim()) errs[`work_${i}_year`] = t("submitScholar.errors.workYear") || `Work ${i + 1}: year is required.`; }); break;
    case 4: form.media.forEach((m, i) => { if (!m.title.trim()) errs[`media_${i}_title`] = t("submitScholar.errors.mediaTitle") || `Media ${i + 1}: title is required.`; }); break;
    case 5: if (form.refs.length === 0) errs.refs = tt("submitScholar.errors.refsRequired", "Add at least one reference."); form.refs.forEach((r, i) => { if (!r.title.trim()) errs[`ref_${i}_title`] = t("submitScholar.errors.refTitle") || `Reference ${i + 1}: title is required.`; if (!r.citation.trim()) errs[`ref_${i}_citation`] = t("submitScholar.errors.refCitation") || `Reference ${i + 1}: citation is required.`; }); break;
    case 6: if (form.refs.length === 0) errs.refs = tt("submitScholar.errors.refsRequired", "Add at least one reference."); if (!form.confirmed) errs.confirmed = tt("submitScholar.errors.confirm", "Please confirm before submitting."); break;
  }
  return errs;
};

  const goNext = () => {
    const stepErrors = validateStep(step);
    if (Object.keys(stepErrors).length > 0) { setErrors(stepErrors); setShowValidationErrors(true); scrollTop(); return; }
    setErrors({}); setShowValidationErrors(false);
    if (step < STEPS.length - 1) { setStep(s => s + 1); scrollTop(); }
  };
  
  const goPrev = () => { setErrors({}); setShowValidationErrors(false); if (step > 0) { setStep(s => s - 1); scrollTop(); } };
  const jumpTo = (i: number) => { if (i !== step) { setErrors({}); setShowValidationErrors(false); setStep(i); scrollTop(); } };

  const langLabel = NATIVE_LANG_NAMES[lang];
  useEffect(() => { if (validRouteLang) setLang(validRouteLang); }, [validRouteLang, setLang]);
  useEffect(() => { if (!validRouteLang && pickedLang) setLang(pickedLang); }, [pickedLang, validRouteLang, setLang]);

  const handleSubmit = async () => {
    const stepErrors = validateStep(6);
    if (Object.keys(stepErrors).length > 0) { setErrors(stepErrors); setShowValidationErrors(true); scrollTop(); return; }

    if (urlRejectedId) {
      try {
        setIsSubmitting(true); setSubmitError(null);
        await scholarsApi.updateRejected(parseInt(urlRejectedId), { ...buildDraftPayload(), target_status: "pending" });
        clearDraft(scholarId, parseInt(urlRejectedId), lang); setPhase("success"); return;
      } catch (error: any) { console.error("Failed to resubmit rejected version:", error); setSubmitError(extractErrorMessage(error, "Failed to resubmit.")); setIsSubmitting(false); return; }
    }

    setErrors({}); setSubmitError(null); setIsSubmitting(true);
    try {
      const selectedLang = LANGUAGES.find(l => l.code === lang.toLowerCase());
      const relationships = [...form.teachers.filter(t => t.scholar_id !== null).map(t => ({ related_version_id: t.scholar_id, relation_type: "teacher" })), ...form.students.filter(s => s.scholar_id !== null).map(s => ({ related_version_id: s.scholar_id, relation_type: "student" }))];
      const payload: any = {
        canonical_name: form.canonical_name, region_id: form.region_id, century_hijri_start: form.century_hijri_start, century_hijri_end: form.century_hijri_end, century_gregorian_start: form.century_gregorian_start, century_gregorian_end: form.century_gregorian_end,
        biography: form.biography, language_id: selectedLang?.language_id, aliases: form.aliases, discipline_ids: form.discipline_ids,
        dates: [form.birth_date_gregorian ? { date_type: "birth", calendar: "gregorian", year: parseInt(form.birth_date_gregorian), raw_text: form.birth_date_gregorian, is_approximate: false } : null, form.birth_date_hijri ? { date_type: "birth", calendar: "hijri", year: parseInt(form.birth_date_hijri), raw_text: form.birth_date_hijri, is_approximate: false } : null, form.death_date_gregorian ? { date_type: "death", calendar: "gregorian", year: parseInt(form.death_date_gregorian), raw_text: form.death_date_gregorian, is_approximate: false } : null, form.death_date_hijri ? { date_type: "death", calendar: "hijri", year: parseInt(form.death_date_hijri), raw_text: form.death_date_hijri, is_approximate: false } : null].filter(Boolean),
        references: form.refs.map(r => ({ title: r.title, citation: r.citation, url: r.url || null })),
        works: form.works.map(w => ({ title: w.title, year: w.year ? parseInt(w.year) : null, format: w.type, description: w.desc || null, media_url: w.accessMode === "link" ? w.url : null, source_type: w.accessMode === "upload" ? "upload" : w.accessMode === "none" ? "none" : "external", file_ref: w.accessMode === "upload" ? `work_file_${form.works.indexOf(w)}` : null })),
        media: form.media.map((m, index) => ({ title: m.title, year: m.year ? parseInt(m.year) : null, description: m.desc || null, media_url: m.accessMode === "link" ? m.url : null, file_type: m.type, source_type: m.accessMode === "upload" ? "upload" : "external", file_ref: m.accessMode === "upload" ? `media_file_${index}` : null })),
        relationships: relationships.length > 0 ? relationships : undefined,
      };
      if (scholarId) payload.scholar_id = parseInt(scholarId, 10);

      const formData = new FormData();
      formData.append("data", JSON.stringify(payload));
      form.works.forEach((w, i) => { if (w.accessMode === "upload" && w.file) formData.append(`work_file_${i}`, w.file); });
      form.media.forEach((m, i) => { if (m.accessMode === "upload" && m.file) formData.append(`media_file_${i}`, m.file); });
      if (form.portraitFile) formData.append("image", form.portraitFile);

      const response = await scholarsApi.create(formData);
      if (response.warnings && response.warnings.length > 0) {
        alert(`⚠️ Scholar submitted, but issues occurred:\n\n${response.warnings.map((w: any) => `${w.type.toUpperCase()}: ${w.message}`).join("\n")}`);
        return; 
      }
      setSuccessMessage(response.message || "Submission successful!");
      clearDraft(scholarId, draftVersionId); setPhase("success");
    } catch (error: any) {
      console.error("Failed to submit scholar:", error);
      setSubmitError(extractErrorMessage(error, tt("submitScholar.errors.submitFailed", "Failed to submit. Please check your entries and try again.")));
      scrollTop();
    } finally { setIsSubmitting(false); }
  };

  const startNewSubmission = () => { clearDraft(scholarId, draftVersionId); window.location.href = "/scholars/submit"; };
  const startFreshDraft = () => {
    if (!window.confirm(tt("submitScholar.draft.confirmNew", "Start a new scholar? Any unsaved progress on this form will be lost (saved drafts are safe)."))) return;
    clearDraft(scholarId, draftVersionId, lang); clearDraft(undefined, null, lang); window.location.href = "/scholars/submit";
  };

  if (phase === "lang") {
    return (
      <div className="submit-scholar-page" style={{ fontFamily: SANS, minHeight: "100vh", background: "#fbf9f4", backgroundImage: "radial-gradient(circle at 50% 0%, rgba(201,168,76,0.06) 0%, transparent 60%)", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 24px" }}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;600;700&family=Source+Serif+4:ital,opsz,wght@0,8..60,400..900;1,8..60,400..900&family=Inter:wght@300..700&family=JetBrains+Mono:wght@400..700&display=swap'); @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap'); .material-symbols-outlined { font-variation-settings: 'FILL' 0,'wght' 400,'GRAD' 0,'opsz' 24; font-family: 'Material Symbols Outlined'; display: inline-block; vertical-align: middle; } .submit-scholar-page * { box-sizing: border-box; margin: 0; padding: 0; } .submit-scholar-page a { text-decoration: none; } @keyframes fade-in-up { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }`}</style>
        <div style={{ maxWidth: "540px", width: "100%", textAlign: "center", animation: "fade-in-up 0.4s ease-out" }}>
          <div style={{ fontFamily: MONO, fontSize: "11px", color: GOLD, letterSpacing: "0.25em", marginBottom: "12px", opacity: 0.9 }}>OULAMAUNA</div>
          <h1 style={{ fontFamily: HANKEN, fontSize: "40px", fontWeight: 700, color: GREEN, marginBottom: "12px", lineHeight: 1.2 }}>{t("submitScholar.portal.title")}</h1>
          <p style={{ fontSize: "15px", color: MUTED, marginBottom: "48px", lineHeight: 1.6, maxWidth: "420px", margin: "0 auto 48px" }}>{t("submitScholar.portal.subtitle")}</p>
          <div style={{ background: "#fff", border: `1px solid rgba(192,201,195,0.4)`, borderRadius: "24px", padding: "48px", boxShadow: "0 8px 32px rgba(0,0,0,0.08)" }}>
            <label style={{ ...labelStyle, textAlign: "center", display: "block", marginBottom: "20px", fontSize: "11px" }}>{t("submitScholar.portal.selectLang")}</label>
            <p style={{ fontSize: "14px", color: MUTED, marginBottom: "28px", lineHeight: 1.5 }}>{t("submitScholar.portal.langDesc")}</p>
            <div style={{ display: "flex", gap: "12px", justifyContent: "center", marginBottom: "36px" }}>
              {(["EN", "AR", "FR"] as Language[]).map(l => (
                <button 
                  key={l} 
                  onClick={() => { 
                    setPickedLang(l); 
                    setLang(l); 
                    navigate(`/scholars/submit/${l.toLowerCase()}`); // ✅ Route changes IMMEDIATELY
                  }}
                  style={{ 
                    padding: "14px 28px", 
                    borderRadius: "12px", 
                    border: `2px solid ${pickedLang === l ? GREEN : BORDER}`, 
                    background: pickedLang === l ? GREEN : "transparent", 
                    color: pickedLang === l ? "#fff" : MUTED, 
                    fontFamily: HANKEN, 
                    fontSize: "12px", 
                    fontWeight: 700, 
                    letterSpacing: "0.05em", 
                    cursor: "pointer", 
                    transition: "all 0.2s" 
                  }}
                >
                  {l === "AR" ? "ARABIC" : l === "EN" ? "ENGLISH" : "FRANÇAIS"}
                </button>
              ))}
            </div>

            <button 
              onClick={() => setPhase("form")} 
              disabled={!pickedLang} // ✅ Prevents clicking until a language is chosen
              style={{ 
                padding: "16px 40px", 
                background: pickedLang ? GREEN : "#c0c9c3", // ✅ Gray when disabled, Green when active
                color: "#fff", 
                border: "none", 
                borderRadius: "12px", 
                fontFamily: HANKEN, 
                fontSize: "12px", 
                fontWeight: 700, 
                letterSpacing: "0.05em", 
                cursor: pickedLang ? "pointer" : "not-allowed", 
                transition: "all 0.2s", 
                display: "inline-flex", 
                alignItems: "center", 
                gap: "10px",
                opacity: pickedLang ? 1 : 0.6
              }}
              onMouseEnter={e => { if (pickedLang) (e.currentTarget as HTMLButtonElement).style.background = GREEN_DARK; }} 
              onMouseLeave={e => { if (pickedLang) (e.currentTarget as HTMLButtonElement).style.background = GREEN; }}
            >
              {t("submitScholar.portal.begin")} <Icon name="arrow_forward" size={18} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (phase === "success") {
    return (
      <div className="submit-scholar-page" dir={lang === "AR" ? "rtl" : "ltr"} style={{ fontFamily: SANS, minHeight: "100vh", background: "#f9faf7", backgroundImage: "radial-gradient(#e1e3e0 0.5px, transparent 0.5px)", backgroundSize: "24px 24px", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 24px" }}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;600;700&family=Source+Serif+4:ital,opsz,wght@0,8..60,400..900;1,8..60,400..900&family=Inter:wght@300..700&family=JetBrains+Mono:wght@400..700&display=swap'); @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap'); .material-symbols-outlined { font-variation-settings: 'FILL' 0,'wght' 400,'GRAD' 0,'opsz' 24; font-family: 'Material Symbols Outlined'; display: inline-block; vertical-align: middle; } .submit-scholar-page * { box-sizing: border-box; margin: 0; padding: 0; } .submit-scholar-page a { text-decoration: none; } .submit-scholar-page button { transition: all 0.2s ease; } @keyframes success-pop { 0% { transform: scale(0.6); opacity: 0; } 60% { transform: scale(1.08); opacity: 1; } 100% { transform: scale(1); } } @keyframes success-fade-up { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } } @keyframes fade-in-up { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }`}</style>
        <div style={{ maxWidth: "560px", width: "100%", textAlign: "center", animation: "fade-in-up 0.4s ease-out" }}>
          <Card style={{ padding: "64px 48px" }}>
            <div style={{ width: "104px", height: "104px", borderRadius: "50%", background: `radial-gradient(circle, ${GREEN_LIGHT} 0%, rgba(11,67,53,0) 72%)`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto" }}>
              <div style={{ width: "80px", height: "80px", borderRadius: "50%", background: GREEN, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", boxShadow: "0 12px 32px rgba(30,77,58,0.35)", animation: "success-pop 0.5s cubic-bezier(0.34,1.56,0.64,1) both" }}>
                <Icon name="check" size={42} />
              </div>
            </div>
            <h2 style={{ fontFamily: HANKEN, fontSize: "32px", fontWeight: 700, color: GREEN, margin: "28px 0 16px", animation: "success-fade-up 0.5s 0.15s both" }}>{t("submitScholar.success.title")}</h2>
            {successMessage && (<div style={{ display: "inline-block", padding: "12px 24px", background: GREEN_LIGHT, border: `1.5px solid ${GREEN_BORDER}`, borderRadius: "12px", marginBottom: "24px", fontSize: "14px", color: GREEN, fontWeight: 600, animation: "success-fade-up 0.5s 0.22s both" }}>{successMessage}</div>)}
            <p style={{ fontSize: "15px", color: MUTED, lineHeight: 1.7, maxWidth: "400px", margin: "0 auto 32px", animation: "success-fade-up 0.5s 0.3s both" }}>{t("submitScholar.success.desc")}</p>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "10px", padding: "10px 24px", borderRadius: "24px", background: GOLD_LIGHT, color: GOLD, fontFamily: MONO, fontSize: "11px", fontWeight: 700, letterSpacing: "0.05em", border: `1.5px solid rgba(201,168,76,0.3)`, marginBottom: "32px", animation: "success-fade-up 0.5s 0.36s both" }}>
              <Icon name="schedule" size={16} /> {t("submitScholar.success.pending")}
            </div>
            <div style={{ padding: "20px 24px", background: "#f9faf7", border: `1.5px solid ${BORDER}`, borderRadius: "14px", fontSize: "13px", color: MUTED, lineHeight: 1.7, textAlign: "left", display: "flex", gap: "12px", alignItems: "flex-start", marginBottom: "32px", animation: "success-fade-up 0.5s 0.42s both" }}>
              <span style={{ color: GREEN, flexShrink: 0, marginTop: "2px" }}><Icon name="info" size={18} /></span>
              <span>{t("submitScholar.success.note")}</span>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", justifyContent: "center", animation: "success-fade-up 0.5s 0.48s both" }}>
              <button onClick={() => navigate("/")} style={{ padding: "14px 30px", background: GREEN, color: "#fff", border: "none", borderRadius: "10px", fontFamily: HANKEN, fontSize: "11px", fontWeight: 700, letterSpacing: "0.05em", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "10px" }} onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = GREEN_DARK} onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = GREEN}>
                <Icon name="home" size={16} /> {tt("submitScholar.success.goHome", "Back to Home")}
              </button>
              <button onClick={() => navigate("/dashboard")} style={{ padding: "14px 30px", background: "transparent", color: GREEN, border: `2px solid ${GREEN}`, borderRadius: "10px", fontFamily: HANKEN, fontSize: "11px", fontWeight: 700, letterSpacing: "0.05em", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "10px" }} onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = GREEN_LIGHT} onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = "transparent"}>
                <Icon name="dashboard" size={16} /> {tt("submitScholar.success.goDashboard", "View Dashboard")}
              </button>
              <button onClick={startNewSubmission} style={{ padding: "14px 24px", background: "transparent", color: MUTED, border: `2px solid ${BORDER}`, borderRadius: "10px", fontFamily: HANKEN, fontSize: "11px", fontWeight: 700, letterSpacing: "0.05em", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "10px" }} onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = GREEN; (e.currentTarget as HTMLButtonElement).style.color = GREEN; }} onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = BORDER; (e.currentTarget as HTMLButtonElement).style.color = MUTED; }}>
                <Icon name="add" size={16} /> {tt("submitScholar.success.submitAnother", "Submit Another Scholar")}
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
          {showValidationErrors && <ErrorBanner errors={errors} title={tt("submitScholar.errors.bannerTitle", "PLEASE FIX THE FOLLOWING")} />}
          {metaError && (<div style={{ display: "flex", alignItems: "flex-start", gap: "12px", padding: "16px 18px", background: DANGER_BG, border: `1.5px solid ${DANGER_BORDER}`, borderRadius: "12px", marginBottom: "28px" }}>
            <span style={{ color: DANGER, flexShrink: 0 }}><Icon name="error" size={20} /></span>
            <div><div style={{ fontFamily: HANKEN, fontSize: "14px", color: DANGER, fontWeight: 700, marginBottom: "6px" }}>Failed to load data</div><div style={{ fontSize: "13px", color: "#7a231d", lineHeight: 1.6 }}>{metaError}</div></div>
          </div>)}
          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "24px", marginBottom: "32px" }} className="responsive-grid-portrait">
            <div>
              <label style={labelStyle}>{tt("submitScholar.step1.portrait", "Portrait")}</label>
              {form.portraitUrl ? (
                <div style={{ position: "relative", borderRadius: "12px", overflow: "hidden", aspectRatio: "3/4", background: "#e7e8e6" }}>
                  <img src={form.portraitUrl} alt="Portrait" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  <button onClick={() => upd("portraitUrl", null)} style={{ position: "absolute", top: "8px", right: "8px", background: "rgba(25,28,27,0.7)", border: "none", borderRadius: "50%", width: "28px", height: "28px", cursor: "pointer", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px", transition: "all 0.15s" }} onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = "rgba(179,38,30,0.9)"} onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = "rgba(25,28,27,0.7)"}>×</button>
                </div>
              ) : (
                <div onClick={() => portraitInputRef.current?.click()} style={{ border: `2px dashed ${BORDER}`, borderRadius: "12px", padding: "28px 16px", textAlign: "center", cursor: "pointer", background: "#fafbf8", transition: "all 0.2s", aspectRatio: "3/4", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "10px" }} onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = GREEN; (e.currentTarget as HTMLDivElement).style.background = GREEN_LIGHT; }} onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = BORDER; (e.currentTarget as HTMLDivElement).style.background = "#fafbf8"; }}>
                  <Icon name="add_photo_alternate" size={32} /><span style={{ fontSize: "12px", color: MUTED, fontFamily: MONO }}>{tt("submitScholar.step1.uploadImage", "Upload Image")}</span>
                </div>
              )}
              <input ref={portraitInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={e => { const f = e.target.files?.[0]; if (f) { upd("portraitUrl", URL.createObjectURL(f)); upd("portraitFile", f); } }} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div>
                <label style={labelStyle}>{tt("submitScholar.step1.canonicalName", "Canonical Name")} <span style={{ color: DANGER }}>*</span></label>
                <FocusInput type="text" value={form.canonical_name} onChange={e => upd("canonical_name", e.target.value)} placeholder="e.g. Malek Bennabi" hasError={showValidationErrors && !!errors.canonical_name} />
                {showValidationErrors && <FieldError msg={errors.canonical_name} />}
              </div>
              <div><label style={labelStyle}>{tt("submitScholar.step1.aliases", "Aliases")}</label><ChipInput items={form.aliases} onAdd={v => upd("aliases", [...form.aliases, v])} onRemove={i => upd("aliases", form.aliases.filter((_, idx) => idx !== i))} placeholder="e.g. Malik Bin Nabi" /></div>
            </div>
          </div>
          
          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "20px", marginBottom: "28px" }} className="responsive-grid-2">
            <div>
              <label style={labelStyle}>{tt("submitScholar.step1.birthDateGregorian", "Birth Date (Gregorian)")}</label>
              <FocusInput 
                type="text"
                inputMode="numeric"
                value={form.birth_date_gregorian} 
                onChange={e => handleDateChange("birth_date_gregorian", e.target.value)} 
                placeholder="e.g. 1905" 
                hasError={!!errors.birth_date_gregorian} 
              />
              {errors.birth_date_gregorian && <FieldError msg={errors.birth_date_gregorian} />}
            </div>
            <div>
              <label style={labelStyle}>{tt("submitScholar.step1.birthDateHijri", "Birth Date (Hijri)")}</label>
              <FocusInput 
                type="text"
                inputMode="numeric"
                value={form.birth_date_hijri} 
                onChange={e => handleDateChange("birth_date_hijri", e.target.value)} 
                placeholder="e.g. 1323" 
                hasError={!!errors.birth_date_hijri} 
              />
              {errors.birth_date_hijri && <FieldError msg={errors.birth_date_hijri} />}
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "20px", marginBottom: "28px" }} className="responsive-grid-2">
            <div>
              <label style={labelStyle}>{tt("submitScholar.step1.deathDateGregorian", "Death Date (Gregorian)")}</label>
              <FocusInput 
                type="text"
                inputMode="numeric"
                value={form.death_date_gregorian} 
                onChange={e => handleDateChange("death_date_gregorian", e.target.value)} 
                placeholder="e.g. 1973" 
                hasError={!!errors.death_date_gregorian} 
              />
              {errors.death_date_gregorian && <FieldError msg={errors.death_date_gregorian} />}
            </div>
            <div>
              <label style={labelStyle}>{tt("submitScholar.step1.deathDateHijri", "Death Date (Hijri)")}</label>
              <FocusInput 
                type="text"
                inputMode="numeric"
                value={form.death_date_hijri} 
                onChange={e => handleDateChange("death_date_hijri", e.target.value)} 
                placeholder="e.g. 1393" 
                hasError={!!errors.death_date_hijri} 
              />
              {errors.death_date_hijri && <FieldError msg={errors.death_date_hijri} />}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "20px", marginBottom: "28px" }} className="responsive-grid-3">
            <div>
              <label style={labelStyle}>{tt("submitScholar.step1.region", "Region")} <span style={{ color: DANGER }}>*</span></label>
              {isLoadingMeta ? (<div style={{ padding: "14px 16px", border: `1.5px solid ${BORDER}`, borderRadius: "10px", background: "#f5f5f5", color: MUTED, fontSize: "13px", display: "flex", alignItems: "center", gap: "10px" }}><Spinner size={14} color={MUTED} /> Loading regions...</div>) : (
                <FocusSelect value={form.region_id ? String(form.region_id) : ""} onChange={e => upd("region_id", e.target.value ? parseInt(e.target.value, 10) : null)} hasError={showValidationErrors && !!errors.region_id}>
                  <option value="">Select Region</option>
                  {regions.map(r => (<option key={r.region_id} value={r.region_id}>{r.name}</option>))}
                </FocusSelect>
              )}
              {showValidationErrors && <FieldError msg={errors.region_id} />}
            </div>
            <div>
              <label style={labelStyle}>{tt("submitScholar.step1.centuryGregorianStart", "Century Gregorian Start")}</label>
              <FocusInput type="number" value={form.century_gregorian_start ?? ""} onChange={e => handleCenturyChange("century_gregorian_start", e.target.value)} placeholder="e.g. 20" hasError={!!errors.century_gregorian_start} />
              {errors.century_gregorian_start && <FieldError msg={errors.century_gregorian_start} />}
            </div>
            <div>
              <label style={labelStyle}>{tt("submitScholar.step1.centuryGregorianEnd", "Century Gregorian End")}</label>
              <FocusInput type="number" value={form.century_gregorian_end ?? ""} onChange={e => handleCenturyChange("century_gregorian_end", e.target.value)} placeholder="e.g. 21" hasError={!!errors.century_gregorian_end} />
              {errors.century_gregorian_end && <FieldError msg={errors.century_gregorian_end} />}
            </div>
            <div>
              <label style={labelStyle}>{tt("submitScholar.step1.centuryHijriStart", "Century Hijri Start")}</label>
              <FocusInput type="number" value={form.century_hijri_start ?? ""} onChange={e => handleCenturyChange("century_hijri_start", e.target.value)} placeholder="e.g. 14" hasError={!!errors.century_hijri_start} />
              {errors.century_hijri_start && <FieldError msg={errors.century_hijri_start} />}
            </div>
            <div>
              <label style={labelStyle}>{tt("submitScholar.step1.centuryHijriEnd", "Century Hijri End")}</label>
              <FocusInput type="number" value={form.century_hijri_end ?? ""} onChange={e => handleCenturyChange("century_hijri_end", e.target.value)} placeholder="e.g. 15" hasError={!!errors.century_hijri_end} />
              {errors.century_hijri_end && <FieldError msg={errors.century_hijri_end} />}
            </div>
          </div>
          <Divider />
          <div style={{ marginBottom: "28px" }}>
            <label style={labelStyle}>{tt("submitScholar.step1.disciplines", "Disciplines")} <span style={{ color: DANGER }}>*</span></label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginTop: "10px" }}>
              {isLoadingMeta ? (<span style={{ fontFamily: MONO, fontSize: "11px", color: MUTED, display: "flex", alignItems: "center", gap: "8px" }}><Spinner size={12} color={MUTED} /> Loading disciplines...</span>) : disciplines.length === 0 ? (<span style={{ fontFamily: MONO, fontSize: "11px", color: DANGER }}>No disciplines available.</span>) : (
                disciplines.map(d => (<DisciplineBtn key={d.discipline_id} label={d.name} active={form.discipline_ids.includes(d.discipline_id)} onClick={() => { const newIds = form.discipline_ids.includes(d.discipline_id) ? form.discipline_ids.filter(x => x !== d.discipline_id) : [...form.discipline_ids, d.discipline_id]; upd("discipline_ids", newIds); }} />))
              )}
            </div>
            {showValidationErrors && <FieldError msg={errors.discipline_ids} />}
          </div>
        </Card>
      );

      case 1: return (
        <Card>
          <CardTitle num="02" title={t("submitScholar.step2.title")} />
          <div style={{ marginBottom: "32px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <label style={sectionLabelStyle}>{t("submitScholar.step2.teachers")}</label>
              <button onClick={() => upd("teachers", [...form.teachers, emptyPerson()])} style={{ padding: "8px 16px", border: `2px solid ${GREEN}`, borderRadius: "8px", background: "transparent", color: GREEN, fontFamily: HANKEN, fontSize: "10px", fontWeight: 700, letterSpacing: "0.05em", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "6px", transition: "all 0.2s" }} onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = GREEN; (e.currentTarget as HTMLButtonElement).style.color = "#fff"; }} onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; (e.currentTarget as HTMLButtonElement).style.color = GREEN; }}><Icon name="add" size={14} /> {t("submitScholar.step2.addTeacher")}</button>
            </div>
            {form.teachers.length === 0 && <p style={{ fontSize: "14px", color: MUTED, fontStyle: "italic", padding: "18px 0" }}>{t("submitScholar.step2.noTeachers")}</p>}
            {form.teachers.map((p, i) => (<ItemCard key={i} index={i} label="Teacher" onRemove={() => upd("teachers", form.teachers.filter((_, idx) => idx !== i))}><PersonLinkSection person={p} onChange={np => { const t2 = [...form.teachers]; t2[i] = np; upd("teachers", t2); }} t={t} lang={lang.toLowerCase()} selectedScholarIds={selectedScholarIds} /></ItemCard>))}
          </div>
          <Divider />
          <div style={{ marginBottom: "32px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <label style={sectionLabelStyle}>{t("submitScholar.step2.students")}</label>
              <button onClick={() => upd("students", [...form.students, emptyPerson()])} style={{ padding: "8px 16px", border: `2px solid ${GREEN}`, borderRadius: "8px", background: "transparent", color: GREEN, fontFamily: HANKEN, fontSize: "10px", fontWeight: 700, letterSpacing: "0.05em", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "6px", transition: "all 0.2s" }} onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = GREEN; (e.currentTarget as HTMLButtonElement).style.color = "#fff"; }} onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; (e.currentTarget as HTMLButtonElement).style.color = GREEN; }}><Icon name="add" size={14} /> {t("submitScholar.step2.addStudent")}</button>
            </div>
            {form.students.length === 0 && <p style={{ fontSize: "14px", color: MUTED, fontStyle: "italic", padding: "18px 0" }}>{t("submitScholar.step2.noStudents")}</p>}
            {form.students.map((p, i) => (<ItemCard key={i} index={i} label="Student" onRemove={() => upd("students", form.students.filter((_, idx) => idx !== i))}><PersonLinkSection person={p} onChange={np => { const t2 = [...form.students]; t2[i] = np; upd("students", t2); }} t={t} lang={lang.toLowerCase()} selectedScholarIds={selectedScholarIds} /></ItemCard>))}
          </div>
        </Card>
      );

      case 2: return (
        <Card>
          <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "36px", paddingBottom: "24px", borderBottom: "1px solid rgba(192,201,195,0.3)" }}>
            <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: GREEN, color: "#fff", fontFamily: HANKEN, fontSize: "14px", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>03</div>
            <h2 style={{ fontFamily: HANKEN, fontSize: "24px", fontWeight: 700, color: GREEN, margin: 0 }}>{t("submitScholar.step3.title")}</h2>
            <span style={{ marginLeft: "auto", fontFamily: MONO, fontSize: "10px", fontWeight: 700, padding: "6px 14px", borderRadius: "6px", background: GREEN_LIGHT, color: GREEN, border: `1.5px solid ${GREEN_BORDER}`, letterSpacing: "0.05em" }}>{langLabel.toUpperCase()}</span>
          </div>
          {showValidationErrors && <ErrorBanner errors={errors} title={tt("submitScholar.errors.bannerTitle", "PLEASE FIX THE FOLLOWING")} />}
          <div style={{ marginBottom: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "8px" }}>
              <label style={labelStyle}>{t("submitScholar.step3.biography")} <span style={{ color: DANGER }}>*</span></label>
              <span style={{ fontFamily: MONO, fontSize: "10px", color: MUTED }}>Rich Text Editor</span>
            </div>
            <RichTextEditor value={form.biography} onChange={(html) => upd("biography", html)} placeholder="Write biography here... Select text and click buttons to format." />
            {showValidationErrors && <FieldError msg={errors.biography} />}
            <p style={{ fontFamily: MONO, fontSize: "10px", color: MUTED, marginTop: "10px", fontStyle: "italic" }}>Tip: Click a button to toggle formatting on. Click it again to turn it off.</p>
          </div>
        </Card>
      );

      case 3: return (
        <Card>
          <CardTitle num="04" title={t("submitScholar.step4.title")} />
          {showValidationErrors && <ErrorBanner errors={errors} title={tt("submitScholar.errors.bannerTitle", "PLEASE FIX THE FOLLOWING")} />}
          {form.works.length === 0 && (<div style={{ textAlign: "center", padding: "56px 0", border: `2px dashed ${BORDER}`, borderRadius: "14px", marginBottom: "18px" }}><Icon name="menu_book" size={48} /><p style={{ color: MUTED, fontSize: "15px", marginTop: "14px" }}>{t("submitScholar.step4.noWorks")}</p></div>)}
          {form.works.map((w, i) => (
            <ItemCard key={i} index={i} label={t("submitScholar.step4.work")} onRemove={() => upd("works", form.works.filter((_, idx) => idx !== i))}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "18px", marginBottom: "18px" }}>
                <div><label style={labelStyle}>TITLE <span style={{ color: DANGER }}>*</span></label><FocusInput type="text" value={w.title} onChange={e => { const t2 = [...form.works]; t2[i] = { ...t2[i], title: e.target.value }; upd("works", t2); }} placeholder="e.g. The Problem of Culture" hasError={showValidationErrors && !!errors[`work_${i}_title`]} />{showValidationErrors && <FieldError msg={errors[`work_${i}_title`]} />}</div>
                <div><label style={labelStyle}>YEAR <span style={{ color: DANGER }}>*</span></label><FocusInput type="number" value={w.year} onChange={e => { const t2 = [...form.works]; t2[i] = { ...t2[i], year: e.target.value }; upd("works", t2); }} placeholder="e.g. 1959" hasError={showValidationErrors && !!errors[`work_${i}_year`]} />{showValidationErrors && <FieldError msg={errors[`work_${i}_year`]} />}</div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "16px", marginBottom: "18px" }}>
                <div><label style={labelStyle}>FORMAT</label><FocusSelect value={w.type} onChange={e => { const t2 = [...form.works]; t2[i] = { ...t2[i], type: e.target.value }; upd("works", t2); }}>{WORK_FORMATS.map(x => (<option key={x} value={x}>{x.charAt(0) + x.slice(1).toLowerCase()}</option>))}</FocusSelect></div>
              </div>
              <div style={{ marginBottom: "18px" }}><label style={labelStyle}>DESCRIPTION</label><FocusTextarea value={w.desc} onChange={e => { const t2 = [...form.works]; t2[i] = { ...t2[i], desc: e.target.value }; upd("works", t2); }} rows={3} placeholder="Brief description of the work" /></div>
              <div><label style={labelStyle}>DIGITAL ACCESS</label>
                <AccessModeTabs mode={w.accessMode} onChange={m => { const t2 = [...form.works]; t2[i] = { ...t2[i], accessMode: m }; upd("works", t2); }} t={t}>
                  {w.accessMode === "upload" && <UploadZone file={w.file} onFile={f => { const t2 = [...form.works]; t2[i] = { ...t2[i], file: f }; upd("works", t2); }} onRemove={() => { const t2 = [...form.works]; t2[i] = { ...t2[i], file: null }; upd("works", t2); }} accept=".pdf,.mp3,.wav,.epub,.doc,.docx" />}
                  {w.accessMode === "link" && <FocusInput type="url" value={w.url} onChange={e => { const t2 = [...form.works]; t2[i] = { ...t2[i], url: e.target.value }; upd("works", t2); }} placeholder="https://archive.org/details/…" />}
                  {w.accessMode === "none" && <p style={{ fontFamily: MONO, fontSize: "10px", color: MUTED, fontStyle: "italic" }}>{t("submitScholar.step4.noneHint")}</p>}
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
          {showValidationErrors && <ErrorBanner errors={errors} title={tt("submitScholar.errors.bannerTitle", "PLEASE FIX THE FOLLOWING")} />}
          <p style={{ fontSize: "14px", color: MUTED, marginBottom: "28px", lineHeight: 1.6 }}>{t("submitScholar.step5.desc")}</p>
          {form.media.length === 0 && (<div style={{ textAlign: "center", padding: "56px 0", border: `2px dashed ${BORDER}`, borderRadius: "14px", marginBottom: "18px" }}><Icon name="perm_media" size={48} /><p style={{ color: MUTED, fontSize: "15px", marginTop: "14px" }}>{t("submitScholar.step5.noMedia")}</p></div>)}
          {form.media.map((m, i) => (
            <ItemCard key={i} index={i} label={t("submitScholar.step5.media")} onRemove={() => upd("media", form.media.filter((_, idx) => idx !== i))}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "18px", marginBottom: "18px" }}>
                <div><label style={labelStyle}>TITLE <span style={{ color: DANGER }}>*</span></label><FocusInput type="text" value={m.title} onChange={e => { const t2 = [...form.media]; t2[i] = { ...t2[i], title: e.target.value }; upd("media", t2); }} placeholder="e.g. 1972 Lecture" hasError={showValidationErrors && !!errors[`media_${i}_title`]} />{showValidationErrors && <FieldError msg={errors[`media_${i}_title`]} />}</div>
                <div><label style={labelStyle}>YEAR</label><FocusInput type="number" value={m.year} onChange={e => { const t2 = [...form.media]; t2[i] = { ...t2[i], year: e.target.value }; upd("media", t2); }} placeholder="e.g. 1959" /></div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "16px", marginBottom: "18px" }}>
                <div><label style={labelStyle}>FILE TYPE</label><FocusSelect value={m.type} onChange={e => { const t2 = [...form.media]; t2[i] = { ...t2[i], type: e.target.value }; upd("media", t2); }}>{MEDIA_FILE_TYPES.map(x => (<option key={x} value={x}>{x.toUpperCase()}</option>))}</FocusSelect></div>
              </div>
              <div style={{ marginBottom: "18px" }}><label style={labelStyle}>DESCRIPTION</label><FocusTextarea value={m.desc} onChange={e => { const t2 = [...form.media]; t2[i] = { ...t2[i], desc: e.target.value }; upd("media", t2); }} rows={3} placeholder="Brief description of the media" /></div>
              <div><label style={labelStyle}>FILE / LINK</label>
                <div>
                  <div style={{ display: "flex", border: `1.5px solid ${BORDER}`, borderRadius: "10px", overflow: "hidden", marginBottom: "14px" }}>
                    <button style={{ flex: 1, padding: "10px 0", textAlign: "center", fontFamily: MONO, fontSize: "10px", fontWeight: 700, letterSpacing: "0.05em", border: "none", cursor: "pointer", transition: "all 0.2s", background: m.accessMode === "upload" ? GREEN : "transparent", color: m.accessMode === "upload" ? "#fff" : MUTED, display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", borderRight: `1px solid ${BORDER}` }} onClick={() => { const t2 = [...form.media]; t2[i] = { ...t2[i], accessMode: "upload" }; upd("media", t2); }}><Icon name="upload_file" size={14} /> {t("submitScholar.step4.upload")}</button>
                    <button style={{ flex: 1, padding: "10px 0", textAlign: "center", fontFamily: MONO, fontSize: "10px", fontWeight: 700, letterSpacing: "0.05em", border: "none", cursor: "pointer", transition: "all 0.2s", background: m.accessMode === "link" ? GREEN : "transparent", color: m.accessMode === "link" ? "#fff" : MUTED, display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }} onClick={() => { const t2 = [...form.media]; t2[i] = { ...t2[i], accessMode: "link" }; upd("media", t2); }}><Icon name="link" size={14} /> {t("submitScholar.step4.link")}</button>
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
          {showValidationErrors && <ErrorBanner errors={errors} title={tt("submitScholar.errors.bannerTitle", "PLEASE FIX THE FOLLOWING")} />}
          <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "14px 18px", background: "rgba(179,38,30,0.05)", border: "1.5px solid rgba(179,38,30,0.2)", borderRadius: "10px", marginBottom: "28px" }}>
            <Icon name="warning" size={18} /><span style={{ fontFamily: MONO, fontSize: "11px", color: DANGER, fontWeight: 700, letterSpacing: "0.05em" }}>{t("submitScholar.step6.warning")}</span>
          </div>
          {form.refs.length === 0 && (<div style={{ textAlign: "center", padding: "56px 0", border: `2px dashed ${BORDER}`, borderRadius: "14px", marginBottom: "18px" }}><Icon name="auto_stories" size={48} /><p style={{ color: MUTED, fontSize: "15px", marginTop: "14px" }}>{t("submitScholar.step6.noRefs")}</p></div>)}
          {form.refs.map((r, i) => (
            <ItemCard key={i} index={i} label={t("submitScholar.step6.reference")} onRemove={() => upd("refs", form.refs.filter((_, idx) => idx !== i))}>
              <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                <div><label style={labelStyle}>Title *</label><FocusInput type="text" value={r.title} onChange={e => { const t2 = [...form.refs]; t2[i] = { ...t2[i], title: e.target.value }; upd("refs", t2); }} placeholder="e.g. Wikipedia" hasError={showValidationErrors && !!errors[`ref_${i}_title`]} />{showValidationErrors && <FieldError msg={errors[`ref_${i}_title`]} />}</div>
                <div><label style={labelStyle}>Citation *</label><FocusInput type="text" value={r.citation} onChange={e => { const t2 = [...form.refs]; t2[i] = { ...t2[i], citation: e.target.value }; upd("refs", t2); }} placeholder="e.g. Malek Bennabi" hasError={showValidationErrors && !!errors[`ref_${i}_citation`]} />{showValidationErrors && <FieldError msg={errors[`ref_${i}_citation`]} />}</div>
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
          {showValidationErrors && <ErrorBanner errors={errors} title={tt("submitScholar.errors.bannerTitle", "PLEASE FIX THE FOLLOWING")} />}
          {submitError && (
            <div style={{ display: "flex", alignItems: "flex-start", gap: "12px", padding: "16px 18px", background: DANGER_BG, border: `1.5px solid ${DANGER_BORDER}`, borderRadius: "12px", marginBottom: "28px", animation: "fade-in-up 0.3s ease-out" }}>
              <span style={{ color: DANGER, flexShrink: 0, marginTop: "2px" }}><Icon name="cloud_off" size={20} /></span>
              <div><div style={{ fontFamily: HANKEN, fontSize: "14px", color: DANGER, fontWeight: 700, letterSpacing: "0.02em", marginBottom: "6px" }}>{tt("submitScholar.errors.serverTitle", "SUBMISSION FAILED")}</div><div style={{ fontSize: "13px", color: "#7a231d", lineHeight: 1.7 }}>{submitError}</div></div>
            </div>
          )}
          <p style={{ fontSize: "14px", color: MUTED, marginBottom: "32px", lineHeight: 1.6 }}>{t("submitScholar.step7.desc")}</p>
          
          <ReviewSection title={tt("submitScholar.step7.identitySection", "Identity & Metadata")}>
            <div style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: "24px", alignItems: "start" }}>
              {form.portraitUrl ? (
                <img src={form.portraitUrl} alt="Portrait" style={{ width: "100%", borderRadius: "10px", aspectRatio: "3/4", objectFit: "cover", background: "#e7e8e6", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }} />
              ) : (
                <div style={{ width: "100%", borderRadius: "10px", aspectRatio: "3/4", background: "#e7e8e6", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}>
                  <Icon name="person" size={48} />
                </div>
              )}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                <ReviewField label={t("submitScholar.step1.canonicalName")} value={form.canonical_name || "—"} />
                <ReviewField label={t("submitScholar.step1.region")} value={regions.find(r => r.region_id === form.region_id)?.name || "—"} />
                <ReviewField label={t("submitScholar.step1.birthDateGregorian")} value={form.birth_date_gregorian || "—"} />
                <ReviewField label={t("submitScholar.step1.birthDateHijri")} value={form.birth_date_hijri || "—"} />
                <ReviewField label={t("submitScholar.step1.deathDateGregorian")} value={form.death_date_gregorian || "—"} />
                <ReviewField label={t("submitScholar.step1.deathDateHijri")} value={form.death_date_hijri || "—"} />
                <ReviewField label={t("submitScholar.step1.centuryGregorianStart")} value={form.century_gregorian_start ? String(form.century_gregorian_start) : "—"} />
                <ReviewField label={t("submitScholar.step1.centuryHijriStart")} value={form.century_hijri_start ? String(form.century_hijri_start) : "—"} />
                <div style={{ gridColumn: "1 / -1" }}>
                  <ReviewField label={t("submitScholar.step1.disciplines")} value={form.discipline_ids.length > 0 ? form.discipline_ids.map(id => disciplines.find(d => d.discipline_id === id)?.name).filter(Boolean).join(", ") : "—"} />
                </div>
                {form.aliases.length > 0 && (<div style={{ gridColumn: "1 / -1" }}><ReviewField label={t("submitScholar.step1.aliases")} value={form.aliases.join(", ")} /></div>)}
              </div>
            </div>
          </ReviewSection>

          {(form.teachers.length > 0 || form.students.length > 0) && (
            <ReviewSection title={t("submitScholar.steps.relations")}>
              {form.teachers.length > 0 && (
                <div style={{ marginBottom: "20px" }}>
                  <div style={{ ...sectionLabelStyle, marginBottom: "10px" }}>{t("submitScholar.step2.teachers")}</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {form.teachers.map((t_item, i) => (<div key={i} style={{ padding: "12px 16px", background: "#fff", borderRadius: "8px", border: `1px solid ${BORDER}`, fontSize: "14px", fontWeight: 600 }}>{t_item.scholar_name || `Teacher ${i + 1}`}</div>))}
                  </div>
                </div>
              )}
              {form.students.length > 0 && (
                <div>
                  <div style={{ ...sectionLabelStyle, marginBottom: "10px" }}>{t("submitScholar.step2.students")}</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {form.students.map((s_item, i) => (<div key={i} style={{ padding: "12px 16px", background: "#fff", borderRadius: "8px", border: `1px solid ${BORDER}`, fontSize: "14px", fontWeight: 600 }}>{s_item.scholar_name || `Student ${i + 1}`}</div>))}
                  </div>
                </div>
              )}
            </ReviewSection>
          )}

          <ReviewSection title={tt("submitScholar.step7.narrativeSection", "Narrative") + ` (${langLabel.toUpperCase()})`}>
            {form.pageTitle && <ReviewField label={t("submitScholar.step3.pageTitle")} value={form.pageTitle} />}
            {form.summary && <ReviewField label={t("submitScholar.step3.summary")} value={form.summary} />}
            {form.quote && <ReviewField label={t("submitScholar.step3.quote")} value={form.quote} />}
            <div style={{ marginTop: "16px" }}>
              <div style={{ ...sectionLabelStyle, marginBottom: "10px" }}>{t("submitScholar.step3.biography")}</div>
              <div style={{ padding: "16px", background: "#fff", borderRadius: "8px", border: `1px solid ${BORDER}`, fontSize: "14px", lineHeight: "1.7" }} dangerouslySetInnerHTML={{ __html: form.biography || "—" }} />
            </div>
          </ReviewSection>

          {form.works.length > 0 && (
            <ReviewSection title={t("submitScholar.steps.works")}>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {form.works.map((w, i) => (
                  <div key={i} style={{ padding: "16px", background: "#fff", borderRadius: "10px", border: `1px solid ${BORDER}` }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                      <span style={{ fontWeight: 700, fontSize: "15px", color: GREEN }}>{w.title}</span>
                      <span style={{ fontFamily: MONO, fontSize: "10px", color: GREEN, background: GREEN_LIGHT, padding: "4px 10px", borderRadius: "6px", fontWeight: 700 }}>{w.type}</span>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", fontSize: "13px", color: "#404945", marginBottom: "8px" }}>
                      <div><span style={{ color: MUTED, fontWeight: 600 }}>Year:</span> {w.year || "—"}</div>
                      <div><span style={{ color: MUTED, fontWeight: 600 }}>Access:</span> {w.accessMode === "upload" ? (w.file ? w.file.name : "Uploaded") : w.accessMode === "link" ? w.url : "None"}</div>
                    </div>
                    {w.desc && <div style={{ fontSize: "13px", color: "#404945", lineHeight: 1.6, paddingTop: "8px", borderTop: `1px solid ${BORDER}` }}>{w.desc}</div>}
                  </div>
                ))}
              </div>
            </ReviewSection>
          )}

          {form.media.length > 0 && (
            <ReviewSection title={t("submitScholar.steps.media")}>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {form.media.map((m, i) => (
                  <div key={i} style={{ padding: "16px", background: "#fff", borderRadius: "10px", border: `1px solid ${BORDER}` }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                      <span style={{ fontWeight: 700, fontSize: "15px", color: GREEN }}>{m.title}</span>
                      <span style={{ fontFamily: MONO, fontSize: "10px", color: GREEN, background: GREEN_LIGHT, padding: "4px 10px", borderRadius: "6px", fontWeight: 700 }}>{m.type.toUpperCase()}</span>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", fontSize: "13px", color: "#404945", marginBottom: "8px" }}>
                      <div><span style={{ color: MUTED, fontWeight: 600 }}>Year:</span> {m.year || "—"}</div>
                      <div><span style={{ color: MUTED, fontWeight: 600 }}>Access:</span> {m.accessMode === "upload" ? (m.file ? m.file.name : "Uploaded") : m.accessMode === "link" ? m.url : "None"}</div>
                    </div>
                    {m.desc && <div style={{ fontSize: "13px", color: "#404945", lineHeight: 1.6, paddingTop: "8px", borderTop: `1px solid ${BORDER}` }}>{m.desc}</div>}
                  </div>
                ))}
              </div>
            </ReviewSection>
          )}

          {form.refs.length > 0 && (
            <ReviewSection title={t("submitScholar.steps.refs")}>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {form.refs.map((r, i) => (
                  <div key={i} style={{ padding: "14px 16px", background: "#fff", borderRadius: "8px", border: `1px solid ${BORDER}` }}>
                    <div style={{ fontWeight: 700, fontSize: "14px", marginBottom: "4px", color: "#191c1b" }}>{r.title}</div>
                    <div style={{ fontSize: "13px", color: "#404945", marginBottom: "6px" }}>{r.citation}</div>
                    {r.url && <a href={r.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: "12px", color: GREEN, textDecoration: "underline", wordBreak: "break-all" }}>{r.url}</a>}
                  </div>
                ))}
              </div>
            </ReviewSection>
          )}

          <div style={{ marginTop: "32px", padding: "24px", background: GREEN_LIGHT, border: `1.5px solid ${showValidationErrors && errors.confirmed ? DANGER : GREEN_BORDER}`, borderRadius: "12px" }}>
            <label style={{ display: "flex", alignItems: "flex-start", gap: "14px", cursor: "pointer" }}>
              <input type="checkbox" checked={form.confirmed} onChange={e => upd("confirmed", e.target.checked)} style={{ width: "18px", height: "18px", accentColor: GREEN, flexShrink: 0, marginTop: "2px" }} />
              <span style={{ fontSize: "14px", color: "#404945", lineHeight: 1.7 }}>{t("submitScholar.step7.confirmText")}</span>
            </label>
            {showValidationErrors && <FieldError msg={errors.confirmed} />}
          </div>
        </Card>
      );

      default: return null;
    }
  };

  const canSubmit = form.confirmed && form.refs.length > 0 && !isSubmitting;

  return (
    <div className="submit-scholar-page" dir={lang === "AR" ? "rtl" : "ltr"} style={{ fontFamily: SANS, minHeight: "100vh", background: "#fbf9f4", backgroundImage: "radial-gradient(#e1e3e0 0.5px, transparent 0.5px)", backgroundSize: "24px 24px", color: "#191c1b" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;600;700&family=Source+Serif+4:ital,opsz,wght@0,8..60,400..900;1,8..60,400..900&family=Inter:wght@300..700&family=JetBrains+Mono:wght@400..700&display=swap'); 
        @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap'); 
        .material-symbols-outlined { font-variation-settings: 'FILL' 0,'wght' 400,'GRAD' 0,'opsz' 24; font-family: 'Material Symbols Outlined'; display: inline-block; vertical-align: middle; } 
        .submit-scholar-page * { box-sizing: border-box; margin: 0; padding: 0; } 
        .submit-scholar-page a { text-decoration: none; } 
        .submit-scholar-page input[type=number]::-webkit-inner-spin-button { opacity: 1; } 
        @keyframes submit-spin { to { transform: rotate(360deg); } } 
        @keyframes step-fade-in { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } } 
        @keyframes fade-in-up { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } } 
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } } 
        .submit-scholar-page button, .submit-scholar-page input, .submit-scholar-page select, .submit-scholar-page textarea { transition: all 0.2s ease; }
        
        @media (min-width: 768px) {
          .responsive-grid-2 { grid-template-columns: 1fr 1fr !important; }
          .responsive-grid-3 { grid-template-columns: 1fr 1fr 1fr !important; }
          .responsive-grid-portrait { grid-template-columns: 180px 1fr !important; gap: 36px !important; }
          .responsive-padding { padding: 48px 48px 96px !important; }
          .responsive-header-padding { padding: 0 48px !important; }
          .responsive-card-padding { padding: 48px !important; }
        }

        /* ✅ FULL WIDTH ON MOBILE - No left/right padding */
        @media (max-width: 767px) {
          .responsive-padding { padding: 24px 0 96px 0 !important; }
          .responsive-card-padding { padding: 20px !important; }
        }

        /* ✅ UPDATED: Footer buttons reduced width on mobile */
        @media (max-width: 640px) {
          .footer-nav-row { flex-wrap: wrap; row-gap: 10px; }
          .footer-actions { width: 100%; justify-content: space-between !important; gap: 8px !important; }
          .footer-btn { 
            padding: 8px 12px !important; 
            font-size: 9px !important; 
            gap: 4px !important; 
            border-radius: 8px !important; 
            width: auto !important; 
            flex: 0 0 auto !important; 
          }
          .footer-btn-fill { 
            padding: 8px 14px !important; 
            min-width: 0 !important; 
            flex: 0 0 auto !important; 
            width: auto !important; 
            justify-content: center !important; 
          }
        }
      `}</style>
      
      <header style={{ position: "sticky", top: 0, zIndex: 50, background: "rgba(251,249,244,0.96)", backdropFilter: "blur(8px)", borderBottom: "1.5px solid rgba(192,201,195,0.3)", padding: "16px 0" }}>
        <div style={{ width: "100%", maxWidth: "100%", padding: "0 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }} className="responsive-header-padding">
          <div><div style={{ fontFamily: MONO, fontSize: "11px", color: GOLD, letterSpacing: "0.2em", opacity: 0.9, fontWeight: 700 }}>OULAMAUNA</div><div style={{ fontSize: "14px", color: MUTED, fontFamily: HANKEN, fontWeight: 600 }}>{t("submitScholar.portal.title")}</div></div>
          <button onClick={startFreshDraft} style={{ padding: "10px 20px", border: `2px solid ${BORDER}`, borderRadius: "10px", background: "transparent", color: MUTED, fontFamily: HANKEN, fontSize: "11px", fontWeight: 700, letterSpacing: "0.03em", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "8px", transition: "all 0.2s" }} onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = GREEN; (e.currentTarget as HTMLButtonElement).style.color = GREEN; }} onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = BORDER; (e.currentTarget as HTMLButtonElement).style.color = MUTED; }}>
            <Icon name="add_circle" size={16} /> {tt("submitScholar.header.newScholar", "New Scholar")}
          </button>
        </div>
      </header>
      
      <main style={{ width: "100%", maxWidth: "100%", margin: "0 auto", padding: "24px 16px 96px" }} className="responsive-padding">
        <div ref={topRef} />
        {draftRestored && (
          <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "14px 18px", background: GOLD_LIGHT, border: "1.5px solid rgba(201,168,76,0.3)", borderRadius: "12px", marginBottom: "24px", animation: "step-fade-in 0.3s ease" }}>
            <span style={{ color: GOLD, flexShrink: 0 }}><Icon name="history" size={18} /></span>
            <span style={{ fontSize: "13px", color: "#5c4a00", lineHeight: 1.6, flex: 1 }}>{tt("submitScholar.draft.restored", "A saved draft was restored. Files (portrait, works, media) need to be re-attached.")}</span>
            <button onClick={() => setDraftRestored(false)} style={{ background: "none", border: "none", cursor: "pointer", color: GOLD, display: "flex", alignItems: "center", flexShrink: 0 }}><Icon name="close" size={18} /></button>
          </div>
        )}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px", marginBottom: "36px" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "8px 18px", background: GREEN_LIGHT, border: `1.5px solid ${GREEN_BORDER}`, borderRadius: "12px", width: "fit-content" }}>
            <Icon name="lock" size={14} /><span style={{ fontFamily: MONO, fontSize: "11px", fontWeight: 700, letterSpacing: "0.03em", color: GREEN }}>{NATIVE_LANG_NAMES[lang]}</span>
          </div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", fontFamily: MONO, fontSize: "10px", color: MUTED, letterSpacing: "0.03em" }}>
            <Icon name="cloud_done" size={15} /> {tt("submitScholar.draft.autosaved", "Progress is saved automatically on this device")}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "flex-start", marginBottom: "40px", overflowX: "auto", paddingBottom: "6px" }}>
          {STEPS.map((s, i) => (
            <div key={s.id} style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, minWidth: "100px", position: "relative", cursor: "pointer" }} onClick={() => jumpTo(i)}>
              {i < STEPS.length - 1 && (<div style={{ position: "absolute", top: "20px", left: "calc(50% + 20px)", width: "calc(100% - 40px)", height: "2px", background: i < step ? GREEN : BORDER, transition: "background 0.3s", zIndex: 0 }} />)}
              <div style={{ width: "40px", height: "40px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: HANKEN, fontSize: "12px", fontWeight: 700, zIndex: 1, flexShrink: 0, border: `2.5px solid ${i < step ? GREEN : i === step ? GREEN : BORDER}`, background: i < step ? GREEN : i === step ? GREEN_LIGHT : "#fff", color: i < step ? "#fff" : i === step ? GREEN : MUTED, transition: "all 0.2s", boxShadow: i === step ? `0 4px 12px ${GREEN_LIGHT}` : 'none' }}>
                {i < step ? <Icon name="check" size={18} /> : s.num}
              </div>
              <div style={{ fontFamily: HANKEN, fontSize: "10px", color: i === step ? GREEN : MUTED, marginTop: "8px", textAlign: "center", lineHeight: 1.3, letterSpacing: "0.02em", fontWeight: i === step ? 700 : 600, transition: "color 0.2s" }}>{s.label}</div>
            </div>
          ))}
        </div>
        <div key={step} style={{ animation: "step-fade-in 0.32s ease" }}>{renderStep()}</div>

        {/* ✅ UPDATED FOOTER: uses hover-enabled components, compact on mobile */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "10px" }} className="footer-nav-row">
          <div>
            {step > 0 && <FooterBackButton onClick={goPrev} label={t("submitScholar.footer.back")} />}
          </div>
          <div style={{ display: "flex", gap: "12px", alignItems: "center" }} className="footer-actions">
            <div style={{ position: "relative" }}>
              <FooterSaveDraftButton
                onClick={manualSaveDraft}
                error={!!draftSaveError}
                saved={draftSavedPulse}
                labelDefault={t("submitScholar.footer.saveDraft")}
                labelSaved={tt("submitScholar.footer.draftSaved", "Saved")}
                labelError={tt("submitScholar.footer.draftSaveFailed", "Save failed")}
              />
              {draftSaveError && (<div style={{ position: "absolute", bottom: "calc(100% + 10px)", right: 0, width: "240px", padding: "10px 14px", background: "#fff", border: `1.5px solid ${DANGER_BORDER}`, borderRadius: "10px", fontSize: "12px", color: "#7a231d", boxShadow: "0 4px 16px rgba(0,0,0,0.1)" }}>{draftSaveError}</div>)}
            </div>
            {step < STEPS.length - 1 ? (
              <FooterNextButton onClick={goNext} label={t("submitScholar.footer.next")} />
            ) : (
              <FooterSubmitButton
                onClick={handleSubmit}
                disabled={!canSubmit}
                submitting={isSubmitting}
                label={t("submitScholar.footer.submit")}
                submittingLabel={tt("submitScholar.footer.submitting", "Submitting...")}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default SubmitScholarPage;