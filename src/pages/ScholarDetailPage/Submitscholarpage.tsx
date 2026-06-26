import React, { useState, useRef, useEffect } from "react";

/* ─────────────────────────────────────────────
   TYPES
───────────────────────────────────────────── */
type Language = "EN" | "AR" | "FR";
type AccessMode = "none" | "upload" | "link";
type PersonLinkMode = "internal" | "external" | "none";

interface MockScholar {
  id: number;
  name: string;
  initials: string;
  discipline: string;
  born: string;
}

interface ChipField {
  value: string;
  items: string[];
}

interface LinkedScholar {
  id: number;
  name: string;
  initials: string;
  discipline: string;
}

interface PersonEntry {
  name: string;
  desc: string;
  linkMode: PersonLinkMode;
  linked: LinkedScholar | null;
  externalUrl: string;
}

interface WorkEntry {
  title: string;
  origTitle: string;
  type: string;
  year: string;
  lang: string;
  desc: string;
  accessMode: AccessMode;
  file: File | null;
  url: string;
}

interface MediaEntry {
  title: string;
  type: string;
  desc: string;
  accessMode: AccessMode;
  file: File | null;
  url: string;
}

interface RefEntry {
  title: string;
  author: string;
  year: string;
  publisher: string;
  type: string;
  url: string;
  notes: string;
}

interface FormState {
  fullName: string;
  canonicalName: string;
  aliases: string[];
  birthYear: string;
  birthMonth: string;
  deathYear: string;
  deathMonth: string;
  region: string;
  country: string;
  century: string;
  era: string;
  disciplines: string[];
  expertise: string[];
  keywords: string[];
  teachers: PersonEntry[];
  students: PersonEntry[];
  relatedScholars: Array<PersonEntry & { relationType: string }>;
  pageTitle: string;
  summary: string;
  biography: string;
  quote: string;
  works: WorkEntry[];
  media: MediaEntry[];
  refs: RefEntry[];
  confirmed: boolean;
  portraitFile: File | null;
  portraitUrl: string | null;
}

/* ─────────────────────────────────────────────
   CONSTANTS
───────────────────────────────────────────── */
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
const GOLD = "#735c00";

const REGIONS = ["North Africa", "Middle East", "Central Asia", "South Asia", "Sub-Saharan Africa", "Andalusia", "Ottoman Empire", "Other"];
const CENTURIES = ["9th", "10th", "11th", "12th", "13th", "14th", "15th", "16th", "17th", "18th", "19th", "20th", "21st"];
const ERAS = ["Classical", "Medieval", "Early Modern", "Modern"];
const DISCIPLINES = [
  "Theology (Kalam)", "Jurisprudence (Fiqh)", "Sufism", "Philosophy",
  "Hadith Sciences", "Tafsir", "History", "Medicine",
  "Mathematics", "Astronomy", "Social Sciences", "Literature",
];
const WORK_TYPES = ["Book", "Article", "Manuscript", "Research Paper", "Lecture", "Other"];
const MEDIA_TYPES = ["PDF", "Audio", "Video", "Image"];
const REF_TYPES = ["Book", "Article", "Journal", "Website", "Archive", "Thesis"];
const RELATION_TYPES = ["Influence", "Contemporary", "Correspondence", "Debate", "Similar School", "Other"];

const MOCK_SCHOLARS: MockScholar[] = [
  { id: 1, name: "Ibn Khaldun", initials: "IK", discipline: "Philosophy, History", born: "1332" },
  { id: 2, name: "Al-Ghazali", initials: "AG", discipline: "Theology, Sufism", born: "1058" },
  { id: 3, name: "Ibn Rushd", initials: "IR", discipline: "Philosophy, Medicine", born: "1126" },
  { id: 4, name: "Al-Farabi", initials: "AF", discipline: "Philosophy, Logic", born: "872" },
  { id: 5, name: "Ibn Sina", initials: "IS", discipline: "Medicine, Philosophy", born: "980" },
  { id: 6, name: "Malek Bennabi", initials: "MB", discipline: "Social Sciences, Philosophy", born: "1905" },
  { id: 7, name: "Al-Shafi'i", initials: "AS", discipline: "Jurisprudence (Fiqh)", born: "767" },
  { id: 8, name: "Ibn Taymiyya", initials: "IT", discipline: "Theology (Kalam)", born: "1263" },
];

const STEPS = [
  { id: "identity",   num: "01", label: "Identity & Metadata" },
  { id: "relations",  num: "02", label: "Academic Relations" },
  { id: "narrative",  num: "03", label: "Narrative Content" },
  { id: "works",      num: "04", label: "Academic Works" },
  { id: "media",      num: "05", label: "Media Library" },
  { id: "refs",       num: "06", label: "References" },
  { id: "review",     num: "07", label: "Review & Submit" },
];

function emptyPerson(): PersonEntry {
  return { name: "", desc: "", linkMode: "none", linked: null, externalUrl: "" };
}
function emptyWork(): WorkEntry {
  return { title: "", origTitle: "", type: "Book", year: "", lang: "", desc: "", accessMode: "none", file: null, url: "" };
}
function emptyMedia(): MediaEntry {
  return { title: "", type: "PDF", desc: "", accessMode: "none", file: null, url: "" };
}
function emptyRef(): RefEntry {
  return { title: "", author: "", year: "", publisher: "", type: "Book", url: "", notes: "" };
}

/* ─────────────────────────────────────────────
   SHARED STYLE HELPERS
───────────────────────────────────────────── */
const inputStyle: React.CSSProperties = {
  width: "100%", padding: "10px 14px",
  border: `1.5px solid ${BORDER}`, borderRadius: "8px",
  fontSize: "13px", color: "#191c1b", backgroundColor: "#fafbf8",
  fontFamily: SANS, outline: "none", transition: "border-color 0.15s",
};
const labelStyle: React.CSSProperties = {
  fontFamily: MONO, fontSize: "9px", color: MUTED,
  letterSpacing: "0.12em", display: "block", marginBottom: "7px", textTransform: "uppercase" as const,
};
const sectionLabelStyle: React.CSSProperties = {
  fontFamily: MONO, fontSize: "9px", color: GREEN,
  letterSpacing: "0.18em", display: "block", marginBottom: "4px", textTransform: "uppercase" as const,
};

function FocusInput({ style, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  const [focused, setFocused] = useState(false);
  return (
    <input
      {...props}
      style={{ ...inputStyle, borderColor: focused ? GREEN : BORDER, ...style }}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    />
  );
}

function FocusSelect({ style, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  const [focused, setFocused] = useState(false);
  return (
    <select
      {...props}
      style={{ ...inputStyle, cursor: "pointer", borderColor: focused ? GREEN : BORDER, ...style }}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    />
  );
}

function FocusTextarea({ style, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const [focused, setFocused] = useState(false);
  return (
    <textarea
      {...props}
      style={{ ...inputStyle, resize: "vertical", minHeight: "80px", borderColor: focused ? GREEN : BORDER, ...style }}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    />
  );
}

function Icon({ name, size = 20 }: { name: string; size?: number }) {
  return (
    <span className="material-symbols-outlined" style={{ fontSize: `${size}px`, lineHeight: 1, verticalAlign: "middle", userSelect: "none" }}>
      {name}
    </span>
  );
}

/* ─────────────────────────────────────────────
   CHIP INPUT
───────────────────────────────────────────── */
function ChipInput({ items, onAdd, onRemove, placeholder }: {
  items: string[]; onAdd: (v: string) => void; onRemove: (i: number) => void; placeholder?: string;
}) {
  const [val, setVal] = useState("");
  const submit = () => { const v = val.trim(); if (v && !items.includes(v)) { onAdd(v); setVal(""); } };
  return (
    <div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: items.length ? "10px" : "0" }}>
        {items.map((item, i) => (
          <span key={i} style={{
            display: "inline-flex", alignItems: "center", gap: "5px",
            padding: "4px 10px 4px 12px", background: GREEN, color: "#fff",
            borderRadius: "20px", fontFamily: MONO, fontSize: "10px", fontWeight: 700,
          }}>
            {item}
            <button onClick={() => onRemove(i)} style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", opacity: 0.7, fontSize: "14px", lineHeight: 1, display: "flex", alignItems: "center", padding: 0 }}>×</button>
          </span>
        ))}
      </div>
      <div style={{ display: "flex", gap: "8px" }}>
        <FocusInput
          type="text" value={val} onChange={e => setVal(e.target.value)}
          onKeyDown={e => e.key === "Enter" && (e.preventDefault(), submit())}
          placeholder={placeholder || "Type and press Enter or Add"}
        />
        <button onClick={submit} style={{
          padding: "8px 16px", border: `1.5px solid ${GREEN}`, borderRadius: "8px",
          background: "transparent", color: GREEN, fontFamily: MONO, fontSize: "10px",
          fontWeight: 700, letterSpacing: "0.08em", cursor: "pointer", whiteSpace: "nowrap",
          transition: "all 0.15s", flexShrink: 0,
        }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = GREEN; (e.currentTarget as HTMLButtonElement).style.color = "#fff"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; (e.currentTarget as HTMLButtonElement).style.color = GREEN; }}
        >
          + ADD
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   SCHOLAR SEARCH
───────────────────────────────────────────── */
function ScholarSearch({ value, onSelect, onClear }: {
  value: LinkedScholar | null; onSelect: (s: LinkedScholar) => void; onClear: () => void;
}) {
  const [query, setQuery] = useState(value?.name ?? "");
  const [results, setResults] = useState<MockScholar[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const onInput = (q: string) => {
    setQuery(q);
    if (!q.trim()) { setResults([]); setOpen(false); return; }
    const matches = MOCK_SCHOLARS.filter(s => s.name.toLowerCase().includes(q.toLowerCase()));
    setResults(matches);
    setOpen(true);
  };

  if (value) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 14px", background: GREEN_LIGHT, border: `1.5px solid ${GREEN_BORDER}`, borderRadius: "8px" }}>
        <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: GREEN, color: "#fff", fontFamily: MONO, fontSize: "11px", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          {value.initials}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: "13px", fontWeight: 700, color: GREEN }}>{value.name}</div>
          <div style={{ fontFamily: MONO, fontSize: "10px", color: MUTED }}>{value.discipline}</div>
        </div>
        <button onClick={() => { onClear(); setQuery(""); }} style={{ background: "none", border: "none", cursor: "pointer", color: MUTED, fontSize: "18px", display: "flex", alignItems: "center" }}>×</button>
      </div>
    );
  }

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <div style={{ position: "relative" }}>
        <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: MUTED, display: "flex", alignItems: "center" }}>
          <Icon name="search" size={16} />
        </span>
        <FocusInput
          type="text" value={query} onChange={e => onInput(e.target.value)}
          placeholder="Search scholar by name…"
          style={{ paddingLeft: "36px" }}
        />
      </div>
      {open && (
        <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, background: "#fff", border: `1.5px solid ${GREEN_BORDER}`, borderRadius: "8px", boxShadow: "0 8px 32px rgba(11,67,53,0.12)", zIndex: 100, maxHeight: "200px", overflowY: "auto" }}>
          {results.length === 0 ? (
            <div style={{ padding: "12px 14px", fontSize: "12px", color: MUTED, fontStyle: "italic" }}>No scholar found in database</div>
          ) : results.map(s => (
            <div key={s.id}
              onClick={() => { onSelect({ id: s.id, name: s.name, initials: s.initials, discipline: s.discipline }); setOpen(false); }}
              style={{ padding: "10px 14px", cursor: "pointer", borderBottom: `1px solid rgba(192,201,195,0.2)`, transition: "background 0.12s" }}
              onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = GREEN_LIGHT}
              onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = "transparent"}
            >
              <div style={{ fontSize: "13px", fontWeight: 700, color: "#191c1b" }}>{s.name}</div>
              <div style={{ fontFamily: MONO, fontSize: "10px", color: MUTED }}>{s.discipline} · b.{s.born}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   UPLOAD ZONE
───────────────────────────────────────────── */
function UploadZone({ file, onFile, onRemove, accept, hint }: {
  file: File | null; onFile: (f: File) => void; onRemove: () => void; accept?: string; hint?: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  if (file) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "12px 16px", background: GREEN_LIGHT, border: `1.5px solid ${GREEN_BORDER}`, borderRadius: "8px" }}>
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
      <div
        onClick={() => ref.current?.click()}
        onDragOver={e => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={e => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files?.[0]; if (f) onFile(f); }}
        style={{ border: `2px dashed ${drag ? GREEN : BORDER}`, borderRadius: "10px", padding: "24px", textAlign: "center", cursor: "pointer", background: drag ? GREEN_LIGHT : "#fafbf8", transition: "all 0.15s" }}
      >
        <Icon name="cloud_upload" size={28} />
        <p style={{ fontSize: "13px", color: "#404945", margin: "8px 0 4px", fontWeight: 600 }}>Drop file here, or <span style={{ color: GREEN, textDecoration: "underline" }}>browse</span></p>
        <p style={{ fontFamily: MONO, fontSize: "9px", color: "#c0c9c3", margin: 0 }}>{hint ?? "PDF, Audio, Video, ePub — up to 50 MB"}</p>
      </div>
    </>
  );
}

/* ─────────────────────────────────────────────
   PERSON LINK CARD
───────────────────────────────────────────── */
function PersonLinkSection({ person, onChange }: {
  person: PersonEntry; onChange: (p: PersonEntry) => void;
}) {
  const tabStyle = (active: boolean): React.CSSProperties => ({
    flex: 1, padding: "8px 0", textAlign: "center", fontFamily: MONO, fontSize: "10px", fontWeight: 700,
    letterSpacing: "0.08em", border: "none", cursor: "pointer", transition: "all 0.15s",
    background: active ? GREEN : "transparent", color: active ? "#fff" : MUTED,
    display: "flex", alignItems: "center", justifyContent: "center", gap: "5px",
  });

  return (
    <div style={{ marginTop: "14px" }}>
      <label style={labelStyle}>LINK TO SCHOLAR</label>
      <div style={{ display: "flex", border: `1.5px solid ${BORDER}`, borderRadius: "8px", overflow: "hidden", marginBottom: "12px" }}>
        <button style={tabStyle(person.linkMode === "internal")} onClick={() => onChange({ ...person, linkMode: "internal" })}>
          <Icon name="search" size={13} /> Database
        </button>
        <button style={{ ...tabStyle(person.linkMode === "external"), borderLeft: `1px solid ${BORDER}`, borderRight: `1px solid ${BORDER}` }} onClick={() => onChange({ ...person, linkMode: "external" })}>
          <Icon name="link" size={13} /> External Link
        </button>
        <button style={tabStyle(person.linkMode === "none")} onClick={() => onChange({ ...person, linkMode: "none" })}>
          <Icon name="block" size={13} /> No Link
        </button>
      </div>

      {person.linkMode === "internal" && (
        <div>
          <ScholarSearch
            value={person.linked}
            onSelect={s => onChange({ ...person, linked: s })}
            onClear={() => onChange({ ...person, linked: null })}
          />
          <p style={{ fontFamily: MONO, fontSize: "9px", color: MUTED, marginTop: "6px", fontStyle: "italic" }}>
            If the scholar exists in Oulamauna, linking by ID ensures their profile stays connected.
          </p>
        </div>
      )}
      {person.linkMode === "external" && (
        <div>
          <FocusInput type="url" value={person.externalUrl} onChange={e => onChange({ ...person, externalUrl: e.target.value })} placeholder="https://en.wikipedia.org/wiki/…" />
          <p style={{ fontFamily: MONO, fontSize: "9px", color: MUTED, marginTop: "6px", fontStyle: "italic" }}>External URL — encyclopedia entry, university page, or archive record.</p>
        </div>
      )}
      {person.linkMode === "none" && (
        <p style={{ fontFamily: MONO, fontSize: "9px", color: MUTED, fontStyle: "italic" }}>Name will appear as plain text without any link.</p>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   SECTION DIVIDER
───────────────────────────────────────────── */
function Divider() {
  return <div style={{ height: "1px", background: "rgba(192,201,195,0.35)", margin: "28px 0" }} />;
}

/* ─────────────────────────────────────────────
   ACCESS MODE TABS
───────────────────────────────────────────── */
function AccessModeTabs({ mode, onChange, children }: {
  mode: AccessMode; onChange: (m: AccessMode) => void; children: React.ReactNode;
}) {
  const tabStyle = (active: boolean): React.CSSProperties => ({
    flex: 1, padding: "8px 0", textAlign: "center" as const, fontFamily: MONO, fontSize: "10px", fontWeight: 700,
    letterSpacing: "0.08em", border: "none", cursor: "pointer", transition: "all 0.15s",
    background: active ? GREEN : "transparent", color: active ? "#fff" : MUTED,
    display: "flex", alignItems: "center", justifyContent: "center", gap: "5px",
  });
  return (
    <div>
      <div style={{ display: "flex", border: `1.5px solid ${BORDER}`, borderRadius: "8px", overflow: "hidden", marginBottom: "12px" }}>
        <button style={tabStyle(mode === "none")} onClick={() => onChange("none")}><Icon name="block" size={13} /> None</button>
        <button style={{ ...tabStyle(mode === "upload"), borderLeft: `1px solid ${BORDER}`, borderRight: `1px solid ${BORDER}` }} onClick={() => onChange("upload")}><Icon name="upload_file" size={13} /> Upload</button>
        <button style={tabStyle(mode === "link")} onClick={() => onChange("link")}><Icon name="link" size={13} /> Paste Link</button>
      </div>
      {children}
    </div>
  );
}

/* ─────────────────────────────────────────────
   DISCIPLINE TOGGLE BUTTON
───────────────────────────────────────────── */
function DisciplineBtn({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      padding: "6px 14px", border: `1.5px solid ${active ? GREEN : BORDER}`,
      borderRadius: "20px", background: active ? GREEN : "transparent",
      color: active ? "#fff" : MUTED, fontFamily: MONO, fontSize: "10px",
      fontWeight: 700, cursor: "pointer", transition: "all 0.15s", letterSpacing: "0.06em",
    }}>
      {label}
    </button>
  );
}

/* ─────────────────────────────────────────────
   CARD WRAPPER
───────────────────────────────────────────── */
function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background: "#fff", border: "1px solid rgba(192,201,195,0.4)", borderRadius: "16px", padding: "40px", marginBottom: "20px", boxShadow: "0 2px 8px rgba(0,0,0,0.04)", ...style }}>
      {children}
    </div>
  );
}

function CardTitle({ num, title }: { num: string; title: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "32px", paddingBottom: "20px", borderBottom: "1px solid rgba(192,201,195,0.3)" }}>
      <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: GREEN, color: "#fff", fontFamily: MONO, fontSize: "12px", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{num}</div>
      <h2 style={{ fontFamily: SERIF, fontSize: "20px", fontWeight: 700, color: GREEN, margin: 0 }}>{title}</h2>
    </div>
  );
}

/* ─────────────────────────────────────────────
   ITEM CARD (works / media / refs)
───────────────────────────────────────────── */
function ItemCard({ index, label, onRemove, children }: { index: number; label: string; onRemove: () => void; children: React.ReactNode }) {
  return (
    <div style={{ border: `1.5px solid ${BORDER}`, borderRadius: "12px", padding: "24px", marginBottom: "14px", background: "#fafbf8" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
        <span style={{ fontFamily: MONO, fontSize: "10px", color: GREEN, fontWeight: 700, letterSpacing: "0.1em" }}>{label} {index + 1}</span>
        <button onClick={onRemove} style={{ background: "none", border: "none", cursor: "pointer", color: MUTED, fontSize: "20px", lineHeight: 1, display: "flex", alignItems: "center", padding: "2px", borderRadius: "4px", transition: "color 0.15s" }}
          onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.color = DANGER}
          onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.color = MUTED}
        >×</button>
      </div>
      {children}
    </div>
  );
}

function AddBtn({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} style={{
      width: "100%", padding: "12px", border: `1.5px dashed ${BORDER}`, borderRadius: "10px",
      background: "transparent", color: MUTED, fontFamily: MONO, fontSize: "10px",
      fontWeight: 700, letterSpacing: "0.1em", cursor: "pointer", transition: "all 0.15s",
      display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", marginTop: "4px",
    }}
      onMouseEnter={e => { const b = e.currentTarget as HTMLButtonElement; b.style.borderColor = GREEN; b.style.color = GREEN; b.style.background = GREEN_LIGHT; }}
      onMouseLeave={e => { const b = e.currentTarget as HTMLButtonElement; b.style.borderColor = BORDER; b.style.color = MUTED; b.style.background = "transparent"; }}
    >
      <Icon name="add_circle" size={15} /> {children}
    </button>
  );
}

/* ─────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────── */
const SubmitScholarPage: React.FC = () => {
  const [phase, setPhase] = useState<"lang" | "form" | "success">("lang");
  const [lang, setLang] = useState<Language>("EN");
  const [step, setStep] = useState(0);
  const topRef = useRef<HTMLDivElement>(null);

  const [form, setForm] = useState<FormState>({
    fullName: "", canonicalName: "", aliases: [],
    birthYear: "", birthMonth: "", deathYear: "", deathMonth: "",
    region: "", country: "", century: "", era: "",
    disciplines: [], expertise: [], keywords: [],
    teachers: [], students: [], relatedScholars: [],
    pageTitle: "", summary: "", biography: "", quote: "",
    works: [], media: [], refs: [],
    confirmed: false, portraitFile: null, portraitUrl: null,
  });

  const portraitInputRef = useRef<HTMLInputElement>(null);

  const scrollTop = () => { setTimeout(() => topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50); };

  const goNext = () => { if (step < STEPS.length - 1) { setStep(s => s + 1); scrollTop(); } };
  const goPrev = () => { if (step > 0) { setStep(s => s - 1); scrollTop(); } };
  const jumpTo = (i: number) => { if (i < step) { setStep(i); scrollTop(); } };

  const upd = <K extends keyof FormState>(key: K, val: FormState[K]) => setForm(f => ({ ...f, [key]: val }));

  const langLabel = lang === "AR" ? "Arabic" : lang === "FR" ? "French" : "English";

  /* ── LANGUAGE SELECTION ── */
  if (phase === "lang") {
    return (
      <div style={{ fontFamily: SANS, minHeight: "100vh", background: "#f9faf7", backgroundImage: "radial-gradient(#e1e3e0 0.5px, transparent 0.5px)", backgroundSize: "24px 24px", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 24px" }}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Source+Serif+4:ital,opsz,wght@0,8..60,400..900;1,8..60,400..900&family=Source+Sans+3:wght@300..700&family=JetBrains+Mono:wght@400..700&display=swap');
          @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap');
          .material-symbols-outlined { font-variation-settings: 'FILL' 0,'wght' 400,'GRAD' 0,'opsz' 24; font-family: 'Material Symbols Outlined'; display: inline-block; vertical-align: middle; }
          * { box-sizing: border-box; margin: 0; padding: 0; }
          a { text-decoration: none; }
        `}</style>
        <div style={{ maxWidth: "540px", width: "100%", textAlign: "center" }}>
          <div style={{ fontFamily: MONO, fontSize: "10px", color: GREEN, letterSpacing: "0.25em", marginBottom: "8px", opacity: 0.7 }}>OULAMAUNA</div>
          <h1 style={{ fontFamily: SERIF, fontSize: "36px", fontWeight: 700, color: GREEN, marginBottom: "10px", lineHeight: 1.2 }}>Academic Submission Portal</h1>
          <p style={{ fontSize: "14px", color: MUTED, marginBottom: "40px", lineHeight: 1.6, maxWidth: "400px", margin: "0 auto 40px" }}>
            Contributing to the definitive digital record of Islamic intellectual heritage. Please ensure all data is cited and verified.
          </p>

          <div style={{ background: "#fff", border: "1px solid rgba(192,201,195,0.4)", borderRadius: "20px", padding: "40px", boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}>
            <label style={{ ...labelStyle, textAlign: "center", display: "block", marginBottom: "16px" }}>SELECT SUBMISSION LANGUAGE</label>
            <p style={{ fontSize: "13px", color: MUTED, marginBottom: "24px", lineHeight: 1.5 }}>
              Choose the language for your scholarly contribution. Additional languages can be submitted after the initial entry is reviewed.
            </p>
            <div style={{ display: "flex", gap: "10px", justifyContent: "center", marginBottom: "32px" }}>
              {(["EN", "AR", "FR"] as Language[]).map(l => (
                <button key={l} onClick={() => setLang(l)} style={{
                  padding: "12px 24px", borderRadius: "999px", border: `1.5px solid ${lang === l ? GREEN : BORDER}`,
                  background: lang === l ? GREEN : "transparent", color: lang === l ? "#fff" : MUTED,
                  fontFamily: MONO, fontSize: "11px", fontWeight: 700, letterSpacing: "0.1em", cursor: "pointer", transition: "all 0.2s",
                }}>
                  {l === "AR" ? "ARABIC" : l === "EN" ? "ENGLISH" : "FRANÇAIS"}
                </button>
              ))}
            </div>
            <button onClick={() => setPhase("form")} style={{
              padding: "14px 36px", background: GREEN, color: "#fff", border: "none",
              borderRadius: "10px", fontFamily: MONO, fontSize: "12px", fontWeight: 700,
              letterSpacing: "0.1em", cursor: "pointer", transition: "background 0.15s",
              display: "inline-flex", alignItems: "center", gap: "8px",
            }}
              onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = GREEN_DARK}
              onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = GREEN}
            >
              BEGIN SUBMISSION <Icon name="arrow_forward" size={16} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ── SUCCESS ── */
  if (phase === "success") {
    return (
      <div style={{ fontFamily: SANS, minHeight: "100vh", background: "#f9faf7", backgroundImage: "radial-gradient(#e1e3e0 0.5px, transparent 0.5px)", backgroundSize: "24px 24px", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 24px" }}>
        <div style={{ maxWidth: "560px", width: "100%", textAlign: "center" }}>
          <Card>
            <div style={{ padding: "24px 0" }}>
              <div style={{ width: "72px", height: "72px", borderRadius: "50%", background: GREEN_LIGHT, border: `2px solid ${GREEN_BORDER}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px", color: GREEN }}>
                <Icon name="check_circle" size={36} />
              </div>
              <h2 style={{ fontFamily: SERIF, fontSize: "26px", fontWeight: 700, color: GREEN, marginBottom: "12px" }}>Submission Received</h2>
              <p style={{ fontSize: "14px", color: MUTED, lineHeight: 1.7, maxWidth: "380px", margin: "0 auto 28px" }}>
                Your scholar entry has been submitted for editorial review. You will be notified once the review process is complete.
              </p>
              <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "8px 20px", borderRadius: "20px", background: "rgba(115,92,0,0.08)", color: GOLD, fontFamily: MONO, fontSize: "10px", fontWeight: 700, letterSpacing: "0.1em", border: `1px solid rgba(115,92,0,0.2)`, marginBottom: "24px" }}>
                <Icon name="schedule" size={14} /> PENDING REVIEW
              </div>
              <div style={{ padding: "16px", background: "#f9faf7", border: `1px solid ${BORDER}`, borderRadius: "10px", fontSize: "12px", color: MUTED, lineHeight: 1.6 }}>
                The editorial team will review your entry and may <strong>Approve</strong>, <strong>Reject</strong>, or <strong>Request Changes</strong>. You can track the status from your dashboard.
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  /* ── FORM ── */
  const renderStep = () => {
    switch (step) {
      /* ════ STEP 1: IDENTITY ════ */
      case 0: return (
        <Card>
          <CardTitle num="01" title="Identity & Core Metadata" />
          <div style={{ display: "grid", gridTemplateColumns: "160px 1fr", gap: "32px", marginBottom: "28px" }}>
            {/* Portrait */}
            <div>
              <label style={labelStyle}>SCHOLAR PORTRAIT</label>
              {form.portraitUrl ? (
                <div style={{ position: "relative", borderRadius: "10px", overflow: "hidden", aspectRatio: "3/4", background: "#e7e8e6" }}>
                  <img src={form.portraitUrl} alt="Portrait" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  <button onClick={() => upd("portraitUrl", null)} style={{ position: "absolute", top: "6px", right: "6px", background: "rgba(25,28,27,0.6)", border: "none", borderRadius: "50%", width: "24px", height: "24px", cursor: "pointer", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px" }}>×</button>
                </div>
              ) : (
                <div onClick={() => portraitInputRef.current?.click()} style={{ border: `2px dashed ${BORDER}`, borderRadius: "10px", padding: "24px 12px", textAlign: "center", cursor: "pointer", background: "#fafbf8", transition: "all 0.15s", aspectRatio: "3/4", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "8px" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = GREEN; (e.currentTarget as HTMLDivElement).style.background = GREEN_LIGHT; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = BORDER; (e.currentTarget as HTMLDivElement).style.background = "#fafbf8"; }}
                >
                  <Icon name="add_photo_alternate" size={28} />
                  <span style={{ fontSize: "11px", color: MUTED, fontFamily: MONO }}>Upload Image</span>
                </div>
              )}
              <input ref={portraitInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={e => { const f = e.target.files?.[0]; if (f) { upd("portraitFile", f); upd("portraitUrl", URL.createObjectURL(f)); } }} />
            </div>

            {/* Name fields */}
            <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
              <div>
                <label style={labelStyle}>FULL LEGAL / BIRTH NAME <span style={{ color: DANGER }}>*</span></label>
                <FocusInput type="text" value={form.fullName} onChange={e => upd("fullName", e.target.value)} placeholder="e.g. Abd al-Rahman b. Muhammad al-Tha'alibi" />
              </div>
              <div>
                <label style={labelStyle}>CANONICAL NAME (KNOWN AS) <span style={{ color: DANGER }}>*</span></label>
                <FocusInput type="text" value={form.canonicalName} onChange={e => upd("canonicalName", e.target.value)} placeholder="e.g. Al-Tha'alibi" />
              </div>
              <div>
                <label style={labelStyle}>ALIASES / ALTERNATIVE SPELLINGS</label>
                <ChipInput items={form.aliases} onAdd={v => upd("aliases", [...form.aliases, v])} onRemove={i => upd("aliases", form.aliases.filter((_, idx) => idx !== i))} placeholder="Add variation…" />
              </div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "24px" }}>
            <div>
              <label style={labelStyle}>BIRTH DATE</label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                <FocusInput type="number" value={form.birthYear} onChange={e => upd("birthYear", e.target.value)} placeholder="Year" min={600} max={2025} />
                <FocusInput type="number" value={form.birthMonth} onChange={e => upd("birthMonth", e.target.value)} placeholder="Month (opt.)" min={1} max={12} />
              </div>
            </div>
            <div>
              <label style={labelStyle}>DEATH DATE</label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                <FocusInput type="number" value={form.deathYear} onChange={e => upd("deathYear", e.target.value)} placeholder="Year" min={600} max={2025} />
                <FocusInput type="number" value={form.deathMonth} onChange={e => upd("deathMonth", e.target.value)} placeholder="Month (opt.)" min={1} max={12} />
              </div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px", marginBottom: "24px" }}>
            <div>
              <label style={labelStyle}>REGION <span style={{ color: DANGER }}>*</span></label>
              <FocusSelect value={form.region} onChange={e => upd("region", e.target.value)}>
                <option value="">Select Region</option>
                {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
              </FocusSelect>
            </div>
            <div>
              <label style={labelStyle}>CENTURY <span style={{ color: DANGER }}>*</span></label>
              <FocusSelect value={form.century} onChange={e => upd("century", e.target.value)}>
                <option value="">Select Century</option>
                {CENTURIES.map(c => <option key={c} value={c}>{c}</option>)}
              </FocusSelect>
            </div>
            <div>
              <label style={labelStyle}>COUNTRY</label>
              <FocusInput type="text" value={form.country} onChange={e => upd("country", e.target.value)} placeholder="e.g. Algeria" />
            </div>
          </div>

          <div style={{ marginBottom: "24px" }}>
            <label style={labelStyle}>ERA / HISTORICAL PERIOD</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "6px" }}>
              {ERAS.map(e => <DisciplineBtn key={e} label={e} active={form.era === e} onClick={() => upd("era", form.era === e ? "" : e)} />)}
            </div>
          </div>

          <Divider />

          <div style={{ marginBottom: "24px" }}>
            <label style={labelStyle}>DISCIPLINES (BROAD FIELDS) <span style={{ color: DANGER }}>*</span></label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "8px" }}>
              {DISCIPLINES.map(d => (
                <DisciplineBtn key={d} label={d} active={form.disciplines.includes(d)}
                  onClick={() => upd("disciplines", form.disciplines.includes(d) ? form.disciplines.filter(x => x !== d) : [...form.disciplines, d])}
                />
              ))}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
            <div>
              <label style={labelStyle}>AREAS OF EXPERTISE <span style={{ color: DANGER }}>*</span></label>
              <ChipInput items={form.expertise} onAdd={v => upd("expertise", [...form.expertise, v])} onRemove={i => upd("expertise", form.expertise.filter((_, idx) => idx !== i))} placeholder="e.g. Social Theory" />
            </div>
            <div>
              <label style={labelStyle}>KEYWORDS / TAGS</label>
              <ChipInput items={form.keywords} onAdd={v => upd("keywords", [...form.keywords, v])} onRemove={i => upd("keywords", form.keywords.filter((_, idx) => idx !== i))} placeholder="e.g. Reform, Resistance…" />
            </div>
          </div>
        </Card>
      );

      /* ════ STEP 2: RELATIONS ════ */
      case 1: return (
        <Card>
          <CardTitle num="02" title="Academic Relations & Taxonomy" />

          {/* Teachers */}
          <div style={{ marginBottom: "28px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
              <label style={sectionLabelStyle}>PRIMARY TEACHERS</label>
              <button onClick={() => upd("teachers", [...form.teachers, emptyPerson()])} style={{ padding: "6px 14px", border: `1.5px solid ${GREEN}`, borderRadius: "6px", background: "transparent", color: GREEN, fontFamily: MONO, fontSize: "9px", fontWeight: 700, letterSpacing: "0.1em", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "5px", transition: "all 0.15s" }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = GREEN; (e.currentTarget as HTMLButtonElement).style.color = "#fff"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; (e.currentTarget as HTMLButtonElement).style.color = GREEN; }}
              ><Icon name="add" size={13} /> ADD TEACHER</button>
            </div>
            {form.teachers.length === 0 && <p style={{ fontSize: "13px", color: MUTED, fontStyle: "italic", padding: "16px 0" }}>No teachers added yet.</p>}
            {form.teachers.map((p, i) => (
              <ItemCard key={i} index={i} label="TEACHER" onRemove={() => upd("teachers", form.teachers.filter((_, idx) => idx !== i))}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div><label style={labelStyle}>NAME <span style={{ color: DANGER }}>*</span></label>
                    <FocusInput type="text" value={p.name} onChange={e => { const t = [...form.teachers]; t[i] = { ...t[i], name: e.target.value }; upd("teachers", t); }} placeholder="Scholar name" /></div>
                  <div><label style={labelStyle}>RELATIONSHIP DESCRIPTION</label>
                    <FocusInput type="text" value={p.desc} onChange={e => { const t = [...form.teachers]; t[i] = { ...t[i], desc: e.target.value }; upd("teachers", t); }} placeholder="e.g. Primary teacher in Fiqh" /></div>
                </div>
                <PersonLinkSection person={p} onChange={np => { const t = [...form.teachers]; t[i] = np; upd("teachers", t); }} />
              </ItemCard>
            ))}
          </div>

          <Divider />

          {/* Students */}
          <div style={{ marginBottom: "28px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
              <label style={sectionLabelStyle}>NOTABLE STUDENTS</label>
              <button onClick={() => upd("students", [...form.students, emptyPerson()])} style={{ padding: "6px 14px", border: `1.5px solid ${GREEN}`, borderRadius: "6px", background: "transparent", color: GREEN, fontFamily: MONO, fontSize: "9px", fontWeight: 700, letterSpacing: "0.1em", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "5px", transition: "all 0.15s" }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = GREEN; (e.currentTarget as HTMLButtonElement).style.color = "#fff"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; (e.currentTarget as HTMLButtonElement).style.color = GREEN; }}
              ><Icon name="add" size={13} /> ADD STUDENT</button>
            </div>
            {form.students.length === 0 && <p style={{ fontSize: "13px", color: MUTED, fontStyle: "italic", padding: "16px 0" }}>No students added yet.</p>}
            {form.students.map((p, i) => (
              <ItemCard key={i} index={i} label="STUDENT" onRemove={() => upd("students", form.students.filter((_, idx) => idx !== i))}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div><label style={labelStyle}>NAME <span style={{ color: DANGER }}>*</span></label>
                    <FocusInput type="text" value={p.name} onChange={e => { const t = [...form.students]; t[i] = { ...t[i], name: e.target.value }; upd("students", t); }} placeholder="Scholar name" /></div>
                  <div><label style={labelStyle}>RELATIONSHIP DESCRIPTION</label>
                    <FocusInput type="text" value={p.desc} onChange={e => { const t = [...form.students]; t[i] = { ...t[i], desc: e.target.value }; upd("students", t); }} placeholder="e.g. Studied Hadith sciences" /></div>
                </div>
                <PersonLinkSection person={p} onChange={np => { const t = [...form.students]; t[i] = np; upd("students", t); }} />
              </ItemCard>
            ))}
          </div>

          <Divider />

          {/* Related Scholars */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
              <label style={sectionLabelStyle}>RELATED SCHOLARS</label>
              <button onClick={() => upd("relatedScholars", [...form.relatedScholars, { ...emptyPerson(), relationType: "Influence" }])} style={{ padding: "6px 14px", border: `1.5px solid ${GREEN}`, borderRadius: "6px", background: "transparent", color: GREEN, fontFamily: MONO, fontSize: "9px", fontWeight: 700, letterSpacing: "0.1em", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "5px", transition: "all 0.15s" }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = GREEN; (e.currentTarget as HTMLButtonElement).style.color = "#fff"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; (e.currentTarget as HTMLButtonElement).style.color = GREEN; }}
              ><Icon name="add" size={13} /> ADD RELATION</button>
            </div>
            {form.relatedScholars.length === 0 && <p style={{ fontSize: "13px", color: MUTED, fontStyle: "italic", padding: "16px 0" }}>No related scholars added yet.</p>}
            {form.relatedScholars.map((p, i) => (
              <ItemCard key={i} index={i} label="RELATION" onRemove={() => upd("relatedScholars", form.relatedScholars.filter((_, idx) => idx !== i))}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "12px" }}>
                  <div><label style={labelStyle}>SCHOLAR NAME <span style={{ color: DANGER }}>*</span></label>
                    <FocusInput type="text" value={p.name} onChange={e => { const t = [...form.relatedScholars]; t[i] = { ...t[i], name: e.target.value }; upd("relatedScholars", t); }} placeholder="Name" /></div>
                  <div><label style={labelStyle}>RELATION TYPE <span style={{ color: DANGER }}>*</span></label>
                    <FocusSelect value={p.relationType} onChange={e => { const t = [...form.relatedScholars]; t[i] = { ...t[i], relationType: e.target.value }; upd("relatedScholars", t); }}>
                      {RELATION_TYPES.map(r => <option key={r}>{r}</option>)}
                    </FocusSelect>
                  </div>
                </div>
                <div style={{ marginBottom: "12px" }}>
                  <label style={labelStyle}>DESCRIPTION</label>
                  <FocusInput type="text" value={p.desc} onChange={e => { const t = [...form.relatedScholars]; t[i] = { ...t[i], desc: e.target.value }; upd("relatedScholars", t); }} placeholder="e.g. Mutual correspondent on reform ideas" />
                </div>
                <PersonLinkSection person={p} onChange={np => { const t = [...form.relatedScholars]; t[i] = { ...np, relationType: p.relationType }; upd("relatedScholars", t); }} />
              </ItemCard>
            ))}
          </div>
        </Card>
      );

      /* ════ STEP 3: NARRATIVE ════ */
      case 2: return (
        <Card>
          <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "32px", paddingBottom: "20px", borderBottom: "1px solid rgba(192,201,195,0.3)" }}>
            <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: GREEN, color: "#fff", fontFamily: MONO, fontSize: "12px", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>03</div>
            <h2 style={{ fontFamily: SERIF, fontSize: "20px", fontWeight: 700, color: GREEN, margin: 0 }}>Narrative Content</h2>
            <span style={{ marginLeft: "auto", fontFamily: MONO, fontSize: "9px", fontWeight: 700, padding: "4px 12px", borderRadius: "4px", background: GREEN_LIGHT, color: GREEN, border: `1px solid ${GREEN_BORDER}`, letterSpacing: "0.1em" }}>{langLabel.toUpperCase()}</span>
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label style={labelStyle}>ENCYCLOPEDIA PAGE TITLE <span style={{ color: DANGER }}>*</span></label>
            <FocusInput type="text" value={form.pageTitle} onChange={e => upd("pageTitle", e.target.value)} placeholder="e.g. The Legacy of Abd al-Rahman al-Tha'alibi" />
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label style={labelStyle}>SHORT SUMMARY (70–280 characters) <span style={{ color: DANGER }}>*</span></label>
            <FocusTextarea value={form.summary} onChange={e => upd("summary", e.target.value)} rows={3} placeholder="Provide a concise 2–3 sentence overview for search previews and page headers…" />
          </div>

          <div style={{ marginBottom: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "6px" }}>
              <label style={labelStyle}>BIOGRAPHY <span style={{ color: DANGER }}>*</span></label>
              <span style={{ fontFamily: MONO, fontSize: "9px", color: MUTED }}>RICH TEXT EDITOR</span>
            </div>
            {/* Toolbar */}
            <div style={{ display: "flex", gap: "4px", padding: "8px 12px", background: "#f3f4f1", border: `1.5px solid ${BORDER}`, borderBottom: "none", borderRadius: "8px 8px 0 0" }}>
              {[["format_bold", "Bold"], ["format_italic", "Italic"], ["format_list_bulleted", "List"], ["format_quote", "Quote"]].map(([icon, label]) => (
                <button key={icon} title={label} style={{ background: "none", border: "none", cursor: "pointer", padding: "5px 8px", borderRadius: "4px", color: "#404945", display: "flex", alignItems: "center", transition: "background 0.12s" }}
                  onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = GREEN_LIGHT}
                  onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = "transparent"}
                ><Icon name={icon} size={16} /></button>
              ))}
            </div>
            <FocusTextarea value={form.biography} onChange={e => upd("biography", e.target.value)} rows={10} placeholder="Start writing the scholarly biography…&#10;&#10;Suggested sections:&#10;• Introduction&#10;• Education & Teachers&#10;• Career & Contributions&#10;• Major Ideas&#10;• Historical Context&#10;• Legacy" style={{ borderRadius: "0 0 8px 8px", minHeight: "240px" }} />
          </div>

          <div>
            <label style={labelStyle}>FAMOUS QUOTE <span style={{ color: MUTED, fontStyle: "italic", fontFamily: SANS, fontSize: "11px", letterSpacing: 0, fontWeight: 400 }}>(optional)</span></label>
            <FocusTextarea value={form.quote} onChange={e => upd("quote", e.target.value)} rows={3} placeholder={`"A civilization is born when…"`} style={{ fontFamily: SERIF, fontStyle: "italic" }} />
          </div>
        </Card>
      );

      /* ════ STEP 4: WORKS ════ */
      case 3: return (
        <Card>
          <CardTitle num="04" title="Academic Works" />
          {form.works.length === 0 && (
            <div style={{ textAlign: "center", padding: "48px 0", border: `2px dashed ${BORDER}`, borderRadius: "12px", marginBottom: "16px" }}>
              <Icon name="menu_book" size={40} />
              <p style={{ color: MUTED, fontSize: "14px", marginTop: "12px" }}>No works added yet.</p>
            </div>
          )}
          {form.works.map((w, i) => (
            <ItemCard key={i} index={i} label="WORK" onRemove={() => upd("works", form.works.filter((_, idx) => idx !== i))}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                <div><label style={labelStyle}>TITLE <span style={{ color: DANGER }}>*</span></label><FocusInput type="text" value={w.title} onChange={e => { const t = [...form.works]; t[i] = { ...t[i], title: e.target.value }; upd("works", t); }} placeholder="e.g. The Quranic Phenomenon" /></div>
                <div><label style={labelStyle}>ORIGINAL TITLE</label><FocusInput type="text" value={w.origTitle} onChange={e => { const t = [...form.works]; t[i] = { ...t[i], origTitle: e.target.value }; upd("works", t); }} placeholder="Title in original language" /></div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "14px", marginBottom: "16px" }}>
                <div><label style={labelStyle}>WORK TYPE <span style={{ color: DANGER }}>*</span></label><FocusSelect value={w.type} onChange={e => { const t = [...form.works]; t[i] = { ...t[i], type: e.target.value }; upd("works", t); }}>{WORK_TYPES.map(x => <option key={x}>{x}</option>)}</FocusSelect></div>
                <div><label style={labelStyle}>PUBLICATION YEAR</label><FocusInput type="number" value={w.year} onChange={e => { const t = [...form.works]; t[i] = { ...t[i], year: e.target.value }; upd("works", t); }} placeholder="e.g. 1946" min={600} max={2025} /></div>
                <div><label style={labelStyle}>LANGUAGE</label><FocusInput type="text" value={w.lang} onChange={e => { const t = [...form.works]; t[i] = { ...t[i], lang: e.target.value }; upd("works", t); }} placeholder="Arabic, French…" /></div>
              </div>
              <div style={{ marginBottom: "16px" }}>
                <label style={labelStyle}>DESCRIPTION <span style={{ color: DANGER }}>*</span></label>
                <FocusTextarea value={w.desc} onChange={e => { const t = [...form.works]; t[i] = { ...t[i], desc: e.target.value }; upd("works", t); }} rows={2} placeholder="Brief description of this work…" />
              </div>
              <div>
                <label style={labelStyle}>DIGITAL ACCESS</label>
                <AccessModeTabs mode={w.accessMode} onChange={m => { const t = [...form.works]; t[i] = { ...t[i], accessMode: m }; upd("works", t); }}>
                  {w.accessMode === "upload" && <UploadZone file={w.file} onFile={f => { const t = [...form.works]; t[i] = { ...t[i], file: f }; upd("works", t); }} onRemove={() => { const t = [...form.works]; t[i] = { ...t[i], file: null }; upd("works", t); }} accept=".pdf,.mp3,.wav,.epub,.doc,.docx" />}
                  {w.accessMode === "link" && <FocusInput type="url" value={w.url} onChange={e => { const t = [...form.works]; t[i] = { ...t[i], url: e.target.value }; upd("works", t); }} placeholder="https://archive.org/details/…" />}
                  {w.accessMode === "none" && <p style={{ fontFamily: MONO, fontSize: "9px", color: MUTED, fontStyle: "italic" }}>No digital file. Will appear as "—" in the bibliography.</p>}
                </AccessModeTabs>
              </div>
            </ItemCard>
          ))}
          <AddBtn onClick={() => upd("works", [...form.works, emptyWork()])}>ADD NEW WORK</AddBtn>
        </Card>
      );

      /* ════ STEP 5: MEDIA ════ */
      case 4: return (
        <Card>
          <CardTitle num="05" title="Global Media Library" />
          <p style={{ fontSize: "13px", color: MUTED, marginBottom: "24px", lineHeight: 1.6 }}>Attach PDFs, audio recordings, video documentaries, and images related to this scholar. This library is shared across all language versions.</p>
          {form.media.length === 0 && (
            <div style={{ textAlign: "center", padding: "48px 0", border: `2px dashed ${BORDER}`, borderRadius: "12px", marginBottom: "16px" }}>
              <Icon name="perm_media" size={40} />
              <p style={{ color: MUTED, fontSize: "14px", marginTop: "12px" }}>No media added yet.</p>
            </div>
          )}
          {form.media.map((m, i) => (
            <ItemCard key={i} index={i} label="MEDIA" onRemove={() => upd("media", form.media.filter((_, idx) => idx !== i))}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                <div><label style={labelStyle}>TITLE <span style={{ color: DANGER }}>*</span></label><FocusInput type="text" value={m.title} onChange={e => { const t = [...form.media]; t[i] = { ...t[i], title: e.target.value }; upd("media", t); }} placeholder="e.g. 1968 Cairo Lecture" /></div>
                <div><label style={labelStyle}>MEDIA TYPE <span style={{ color: DANGER }}>*</span></label><FocusSelect value={m.type} onChange={e => { const t = [...form.media]; t[i] = { ...t[i], type: e.target.value }; upd("media", t); }}>{MEDIA_TYPES.map(x => <option key={x}>{x}</option>)}</FocusSelect></div>
              </div>
              <div style={{ marginBottom: "16px" }}>
                <label style={labelStyle}>DESCRIPTION</label>
                <FocusTextarea value={m.desc} onChange={e => { const t = [...form.media]; t[i] = { ...t[i], desc: e.target.value }; upd("media", t); }} rows={2} placeholder="Brief description of this media item…" />
              </div>
              <div>
                <label style={labelStyle}>FILE / LINK</label>
                <AccessModeTabs mode={m.accessMode} onChange={mode => { const t = [...form.media]; t[i] = { ...t[i], accessMode: mode }; upd("media", t); }}>
                  {m.accessMode === "upload" && <UploadZone file={m.file} onFile={f => { const t = [...form.media]; t[i] = { ...t[i], file: f }; upd("media", t); }} onRemove={() => { const t = [...form.media]; t[i] = { ...t[i], file: null }; upd("media", t); }} accept=".pdf,.mp3,.wav,.mp4,.webm" hint="PDF, Audio (MP3/WAV), Video (MP4) — up to 100 MB" />}
                  {m.accessMode === "link" && <FocusInput type="url" value={m.url} onChange={e => { const t = [...form.media]; t[i] = { ...t[i], url: e.target.value }; upd("media", t); }} placeholder="https://youtube.com/… or direct file URL" />}
                  {m.accessMode === "none" && <p style={{ fontFamily: MONO, fontSize: "9px", color: MUTED, fontStyle: "italic" }}>No file. Title and description will still be visible to users.</p>}
                </AccessModeTabs>
              </div>
            </ItemCard>
          ))}
          <AddBtn onClick={() => upd("media", [...form.media, emptyMedia()])}>ADD MEDIA</AddBtn>
        </Card>
      );

      /* ════ STEP 6: REFERENCES ════ */
      case 5: return (
        <Card>
          <CardTitle num="06" title="References & Bibliography" />
          <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "12px 16px", background: "rgba(179,38,30,0.05)", border: "1px solid rgba(179,38,30,0.2)", borderRadius: "8px", marginBottom: "24px" }}>
            <Icon name="warning" size={16} />
            <span style={{ fontFamily: MONO, fontSize: "10px", color: DANGER, fontWeight: 700, letterSpacing: "0.08em" }}>At least ONE reference is required before submission.</span>
          </div>
          {form.refs.length === 0 && (
            <div style={{ textAlign: "center", padding: "48px 0", border: `2px dashed ${BORDER}`, borderRadius: "12px", marginBottom: "16px" }}>
              <Icon name="auto_stories" size={40} />
              <p style={{ color: MUTED, fontSize: "14px", marginTop: "12px" }}>No references added yet.</p>
            </div>
          )}
          {form.refs.map((r, i) => (
            <ItemCard key={i} index={i} label="REFERENCE" onRemove={() => upd("refs", form.refs.filter((_, idx) => idx !== i))}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "14px" }}>
                <div><label style={labelStyle}>TITLE <span style={{ color: DANGER }}>*</span></label><FocusInput type="text" value={r.title} onChange={e => { const t = [...form.refs]; t[i] = { ...t[i], title: e.target.value }; upd("refs", t); }} placeholder="e.g. Les Conditions de la Renaissance" /></div>
                <div><label style={labelStyle}>AUTHOR / EDITOR <span style={{ color: DANGER }}>*</span></label><FocusInput type="text" value={r.author} onChange={e => { const t = [...form.refs]; t[i] = { ...t[i], author: e.target.value }; upd("refs", t); }} placeholder="Last, First" /></div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "14px", marginBottom: "14px" }}>
                <div><label style={labelStyle}>YEAR</label><FocusInput type="number" value={r.year} onChange={e => { const t = [...form.refs]; t[i] = { ...t[i], year: e.target.value }; upd("refs", t); }} placeholder="e.g. 1948" /></div>
                <div><label style={labelStyle}>PUBLISHER</label><FocusInput type="text" value={r.publisher} onChange={e => { const t = [...form.refs]; t[i] = { ...t[i], publisher: e.target.value }; upd("refs", t); }} placeholder="Publisher name" /></div>
                <div><label style={labelStyle}>TYPE <span style={{ color: DANGER }}>*</span></label><FocusSelect value={r.type} onChange={e => { const t = [...form.refs]; t[i] = { ...t[i], type: e.target.value }; upd("refs", t); }}>{REF_TYPES.map(x => <option key={x}>{x}</option>)}</FocusSelect></div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                <div><label style={labelStyle}>URL (optional)</label><FocusInput type="url" value={r.url} onChange={e => { const t = [...form.refs]; t[i] = { ...t[i], url: e.target.value }; upd("refs", t); }} placeholder="https://…" /></div>
                <div><label style={labelStyle}>NOTES</label><FocusInput type="text" value={r.notes} onChange={e => { const t = [...form.refs]; t[i] = { ...t[i], notes: e.target.value }; upd("refs", t); }} placeholder="Additional notes" /></div>
              </div>
            </ItemCard>
          ))}
          <AddBtn onClick={() => upd("refs", [...form.refs, emptyRef()])}>ADD REFERENCE</AddBtn>
        </Card>
      );

      /* ════ STEP 7: REVIEW ════ */
      case 6: return (
        <Card>
          <CardTitle num="07" title="Review & Submit" />
          <p style={{ fontSize: "13px", color: MUTED, marginBottom: "28px", lineHeight: 1.6 }}>
            Review your submission below. Click on any step in the progress bar to go back and make edits.
          </p>

          {/* Identity summary */}
          <div style={{ marginBottom: "24px", padding: "20px", background: "#f9faf7", border: `1px solid ${BORDER}`, borderRadius: "12px" }}>
            <div style={{ fontFamily: MONO, fontSize: "9px", color: GREEN, letterSpacing: "0.18em", marginBottom: "14px" }}>01 — IDENTITY</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
              {[["Full Name", form.fullName], ["Canonical Name", form.canonicalName], ["Region", form.region], ["Century", form.century], ["Era", form.era], ["Country", form.country]].map(([lbl, val]) => (
                <div key={lbl}><div style={{ fontFamily: MONO, fontSize: "9px", color: MUTED, marginBottom: "3px" }}>{lbl.toUpperCase()}</div><div style={{ fontSize: "13px", fontWeight: 600, color: val ? "#191c1b" : "#c0c9c3" }}>{val || "—"}</div></div>
              ))}
            </div>
            {form.disciplines.length > 0 && (
              <div style={{ marginTop: "14px" }}>
                <div style={{ fontFamily: MONO, fontSize: "9px", color: MUTED, marginBottom: "8px" }}>DISCIPLINES</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  {form.disciplines.map(d => <span key={d} style={{ padding: "3px 10px", background: GREEN_LIGHT, color: GREEN, borderRadius: "20px", fontFamily: MONO, fontSize: "9px", fontWeight: 700, border: `1px solid ${GREEN_BORDER}` }}>{d}</span>)}
                </div>
              </div>
            )}
          </div>

          {/* Narrative summary */}
          <div style={{ marginBottom: "24px", padding: "20px", background: "#f9faf7", border: `1px solid ${BORDER}`, borderRadius: "12px" }}>
            <div style={{ fontFamily: MONO, fontSize: "9px", color: GREEN, letterSpacing: "0.18em", marginBottom: "14px" }}>03 — NARRATIVE ({langLabel.toUpperCase()})</div>
            <div style={{ marginBottom: "10px" }}><div style={{ fontFamily: MONO, fontSize: "9px", color: MUTED, marginBottom: "3px" }}>PAGE TITLE</div><div style={{ fontSize: "14px", fontWeight: 700, color: form.pageTitle ? "#191c1b" : "#c0c9c3", fontFamily: SERIF }}>{form.pageTitle || "—"}</div></div>
            {form.summary && <div style={{ fontSize: "13px", color: "#404945", lineHeight: 1.65 }}>{form.summary}</div>}
          </div>

          {/* Works */}
          <div style={{ marginBottom: "24px", padding: "20px", background: "#f9faf7", border: `1px solid ${BORDER}`, borderRadius: "12px" }}>
            <div style={{ fontFamily: MONO, fontSize: "9px", color: GREEN, letterSpacing: "0.18em", marginBottom: "14px" }}>04 — ACADEMIC WORKS ({form.works.length})</div>
            {form.works.length === 0 ? <p style={{ fontSize: "12px", color: MUTED, fontStyle: "italic" }}>None added.</p> :
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {form.works.map((w, i) => <div key={i} style={{ fontSize: "13px", color: "#404945", padding: "8px 0", borderBottom: "1px solid #f0f1ee", display: "flex", gap: "12px", alignItems: "center" }}>
                  <span style={{ fontFamily: MONO, fontSize: "9px", padding: "2px 8px", background: GREEN_LIGHT, color: GREEN, borderRadius: "4px" }}>{w.type}</span>
                  <span style={{ fontWeight: 700 }}>{w.title || "Untitled"}</span>
                  {w.year && <span style={{ color: MUTED, fontSize: "12px" }}>{w.year}</span>}
                </div>)}
              </div>
            }
          </div>

          {/* References */}
          <div style={{ marginBottom: "28px", padding: "20px", background: "#f9faf7", border: `1px solid ${form.refs.length === 0 ? "rgba(179,38,30,0.3)" : BORDER}`, borderRadius: "12px" }}>
            <div style={{ fontFamily: MONO, fontSize: "9px", color: GREEN, letterSpacing: "0.18em", marginBottom: "14px" }}>06 — REFERENCES ({form.refs.length})</div>
            {form.refs.length === 0 ? (
              <p style={{ fontFamily: MONO, fontSize: "10px", color: DANGER, display: "flex", alignItems: "center", gap: "6px" }}><Icon name="warning" size={14} /> No references — required before submission.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {form.refs.map((r, i) => <div key={i} style={{ fontSize: "13px", color: "#404945", padding: "8px 0", borderBottom: "1px solid #f0f1ee" }}>
                  <span style={{ fontWeight: 700 }}>{r.author}</span>{r.year ? ` (${r.year})` : ""} — {r.title || "Untitled"}
                </div>)}
              </div>
            )}
          </div>

          {/* Confirmation */}
          <label style={{ display: "flex", alignItems: "flex-start", gap: "12px", padding: "18px", background: GREEN_LIGHT, border: `1px solid ${GREEN_BORDER}`, borderRadius: "10px", cursor: "pointer", marginBottom: "16px" }}>
            <input type="checkbox" checked={form.confirmed} onChange={e => upd("confirmed", e.target.checked)} style={{ width: "16px", height: "16px", accentColor: GREEN, flexShrink: 0, marginTop: "2px" }} />
            <span style={{ fontSize: "13px", color: "#404945", lineHeight: 1.6 }}>
              I confirm that the information I have provided is accurate to the best of my knowledge, and complies with Oulamauna's submission guidelines and academic integrity standards.
            </span>
          </label>
          <p style={{ fontFamily: MONO, fontSize: "9px", color: MUTED, letterSpacing: "0.06em" }}>
            After submission, the editorial team may Approve, Reject, or Request Changes.
          </p>
        </Card>
      );

      default: return null;
    }
  };

  return (
    <div dir="ltr" style={{ fontFamily: SANS, minHeight: "100vh", background: "#f9faf7", backgroundImage: "radial-gradient(#e1e3e0 0.5px, transparent 0.5px)", backgroundSize: "24px 24px", color: "#191c1b" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Source+Serif+4:ital,opsz,wght@0,8..60,400..900;1,8..60,400..900&family=Source+Sans+3:wght@300..700&family=JetBrains+Mono:wght@400..700&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap');
        .material-symbols-outlined { font-variation-settings: 'FILL' 0,'wght' 400,'GRAD' 0,'opsz' 24; font-family: 'Material Symbols Outlined'; display: inline-block; vertical-align: middle; }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        a { text-decoration: none; }
        input[type=number]::-webkit-inner-spin-button { opacity: 1; }
      `}</style>

      {/* HEADER */}
      <header style={{ position: "sticky", top: 0, zIndex: 50, background: "rgba(249,250,247,0.96)", backdropFilter: "blur(8px)", borderBottom: "1px solid rgba(192,201,195,0.3)", padding: "14px 0" }}>
        <div style={{ maxWidth: "900px", margin: "0 auto", padding: "0 40px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontFamily: MONO, fontSize: "10px", color: GREEN, letterSpacing: "0.2em", opacity: 0.7 }}>OULAMAUNA</div>
            <div style={{ fontSize: "13px", color: MUTED }}>Academic Submission Portal</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span style={{ fontFamily: MONO, fontSize: "9px", padding: "4px 12px", borderRadius: "20px", background: "rgba(115,92,0,0.08)", color: GOLD, border: "1px solid rgba(115,92,0,0.2)", fontWeight: 700, letterSpacing: "0.1em" }}>STATUS: DRAFT</span>
            <button style={{ padding: "7px 16px", border: `1.5px solid ${BORDER}`, borderRadius: "6px", background: "transparent", color: MUTED, fontFamily: MONO, fontSize: "9px", fontWeight: 700, letterSpacing: "0.1em", cursor: "pointer" }}>SAVE DRAFT</button>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: "900px", margin: "0 auto", padding: "40px 40px 80px" }}>
        <div ref={topRef} />

        {/* LANGUAGE TAB */}
        <div style={{ display: "flex", gap: "4px", padding: "4px 8px", background: GREEN_LIGHT, border: `1px solid ${GREEN_BORDER}`, borderRadius: "999px", width: "fit-content", marginBottom: "32px" }}>
          {(["AR", "EN", "FR"] as Language[]).map(l => (
            <button key={l} onClick={() => setLang(l)} style={{
              padding: "5px 16px", borderRadius: "999px", border: `1px solid ${lang === l ? GREEN : "transparent"}`,
              background: lang === l ? GREEN : "transparent", color: lang === l ? "#fff" : MUTED,
              fontFamily: MONO, fontSize: "10px", fontWeight: 700, letterSpacing: "0.08em", cursor: "pointer", transition: "all 0.15s",
            }}>
              {l === "AR" ? "ARABIC" : l === "EN" ? "ENGLISH" : "FRANÇAIS"}
            </button>
          ))}
        </div>

        {/* STEPPER */}
        <div style={{ display: "flex", alignItems: "flex-start", marginBottom: "36px", overflowX: "auto", paddingBottom: "4px" }}>
          {STEPS.map((s, i) => (
            <div key={s.id} style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, minWidth: "90px", position: "relative", cursor: i < step ? "pointer" : "default" }} onClick={() => jumpTo(i)}>
              {i < STEPS.length - 1 && (
                <div style={{ position: "absolute", top: "16px", left: "calc(50% + 18px)", width: "calc(100% - 36px)", height: "2px", background: i < step ? GREEN : BORDER, transition: "background 0.3s", zIndex: 0 }} />
              )}
              <div style={{
                width: "32px", height: "32px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: MONO, fontSize: "11px", fontWeight: 700, zIndex: 1, flexShrink: 0,
                border: `2px solid ${i < step ? GREEN : i === step ? GREEN : BORDER}`,
                background: i < step ? GREEN : i === step ? GREEN_LIGHT : "#fff",
                color: i < step ? "#fff" : i === step ? GREEN : MUTED,
                transition: "all 0.2s",
              }}>
                {i < step ? <Icon name="check" size={16} /> : s.num}
              </div>
              <div style={{ fontFamily: MONO, fontSize: "9px", color: i === step ? GREEN : MUTED, marginTop: "6px", textAlign: "center", lineHeight: 1.3, letterSpacing: "0.04em", fontWeight: i === step ? 700 : 400, transition: "color 0.2s" }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>

        {/* STEP CONTENT */}
        {renderStep()}

        {/* FOOTER BUTTONS */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "8px" }}>
          <div>
            {step > 0 && (
              <button onClick={goPrev} style={{ padding: "10px 22px", border: `1.5px solid ${BORDER}`, borderRadius: "8px", background: "transparent", color: MUTED, fontFamily: MONO, fontSize: "10px", fontWeight: 700, letterSpacing: "0.08em", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "6px", transition: "all 0.15s" }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = GREEN; (e.currentTarget as HTMLButtonElement).style.color = GREEN; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = BORDER; (e.currentTarget as HTMLButtonElement).style.color = MUTED; }}
              >
                <Icon name="arrow_back" size={14} /> BACK
              </button>
            )}
          </div>
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <button style={{ padding: "10px 20px", border: `1.5px solid ${GREEN}`, borderRadius: "8px", background: "transparent", color: GREEN, fontFamily: MONO, fontSize: "10px", fontWeight: 700, letterSpacing: "0.08em", cursor: "pointer", transition: "all 0.15s" }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = GREEN_LIGHT; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
            >SAVE DRAFT</button>
            {step < STEPS.length - 1 ? (
              <button onClick={goNext} style={{ padding: "10px 28px", background: GREEN, color: "#fff", border: "none", borderRadius: "8px", fontFamily: MONO, fontSize: "10px", fontWeight: 700, letterSpacing: "0.1em", cursor: "pointer", transition: "background 0.15s", display: "inline-flex", alignItems: "center", gap: "8px" }}
                onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = GREEN_DARK}
                onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = GREEN}
              >
                NEXT <Icon name="arrow_forward" size={14} />
              </button>
            ) : (
              <button onClick={() => { if (!form.confirmed || form.refs.length === 0) { alert("Please add at least one reference and confirm accuracy before submitting."); return; } setPhase("success"); }} style={{ padding: "10px 28px", background: form.confirmed && form.refs.length > 0 ? GREEN : "#c0c9c3", color: "#fff", border: "none", borderRadius: "8px", fontFamily: MONO, fontSize: "10px", fontWeight: 700, letterSpacing: "0.1em", cursor: form.confirmed && form.refs.length > 0 ? "pointer" : "not-allowed", transition: "background 0.15s", display: "inline-flex", alignItems: "center", gap: "8px" }}
                onMouseEnter={e => { if (form.confirmed && form.refs.length > 0) (e.currentTarget as HTMLButtonElement).style.background = GREEN_DARK; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = form.confirmed && form.refs.length > 0 ? GREEN : "#c0c9c3"; }}
              >
                SUBMIT FOR REVIEW <Icon name="send" size={14} />
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default SubmitScholarPage;