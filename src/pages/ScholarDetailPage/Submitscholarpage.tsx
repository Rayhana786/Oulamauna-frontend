import React, { useState, useRef, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useLang } from "../../context/LanguageContext";
import { scholarsApi } from "../../api/scholarsApi";

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

// UPDATED: Only 3 fields as requested
interface RefEntry {
  title: string;
  citation: string;
  url: string;
}

interface FormState {
  // EXACT Backend Fields (matching scholar_versions columns)
  canonical_name: string;
  region: string;
  birth_date_gerogean: string; // Matching backend spelling exactly
  birth_date_hijri: string;
  death_date_gerogean: string; // Matching backend spelling exactly
  death_date_hijri: string;
  century_hijri: string;
  century_gregorian: string;
  biography: string;
  aliases: string[];
  discipline_ids: number[];
  
  // UI-only fields (kept for other steps)
  portraitUrl: string | null;
  pageTitle: string;
  summary: string;
  quote: string;
  teachers: any[];
  students: any[];
  relatedScholars: any[];
  works: any[];
  media: any[];
  refs: { title: string; citation: string; url: string }[];
  confirmed: boolean;
}

/* ─────────────────────────────────────────────
   CONSTANTS
───────────────────────────────────────────── */
const LANGUAGES = [
  { language_id: 1, code: 'en', name: 'English' },
  { language_id: 2, code: 'ar', name: 'Arabic' },
  { language_id: 3, code: 'fr', name: 'French' },
];
export const DISCIPLINES = [
  { id: 1, name: { ar: "الفقه", en: "Fiqh", fr: "Fiqh" } },
  { id: 2, name: { ar: "الحديث", en: "Hadith", fr: "Hadith" } },
  { id: 3, name: { ar: "التفسير", en: "Tafsir", fr: "Tafsir" } },
  { id: 4, name: { ar: "العقيدة", en: "Aqidah", fr: "Aqida" } },
  { id: 5, name: { ar: "السيرة النبوية", en: "Seerah", fr: "Sîra" } },
  { id: 6, name: { ar: "اللغة العربية", en: "Arabic Language", fr: "Langue arabe" } },
  { id: 7, name: { ar: "علوم القرآن", en: "Quranic Sciences", fr: "Sciences du Coran" } },
  { id: 8, name: { ar: "أصول الفقه", en: "Usul al-Fiqh", fr: "Fondements du Fiqh" } },
  { id: 9, name: { ar: "التاريخ الإسلامي", en: "Islamic History", fr: "Histoire islamique" } },
  { id: 10, name: { ar: "علم الكلام", en: "Theology", fr: "Théologie" } },
];
const NATIVE_LANG_NAMES: Record<Language, string> = {
  EN: "English",
  AR: "العربية",
  FR: "Français",
};
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

const WORK_TYPES = ["Book", "Article", "Manuscript", "Research Paper", "Lecture", "Other"];
const MEDIA_TYPES = ["PDF", "Audio", "Video", "Image"];
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
  return { title: "", citation: "", url: "" };
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
          placeholder={placeholder}
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
function ScholarSearch({ value, onSelect, onClear, t }: {
  value: LinkedScholar | null; onSelect: (s: LinkedScholar) => void; onClear: () => void; t: (k: string) => string;
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
          placeholder={t("submitScholar.step2.searchPlaceholder")}
          style={{ paddingLeft: "36px" }}
        />
      </div>
      {open && (
        <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, background: "#fff", border: `1.5px solid ${GREEN_BORDER}`, borderRadius: "8px", boxShadow: "0 8px 32px rgba(11,67,53,0.12)", zIndex: 100, maxHeight: "200px", overflowY: "auto" }}>
          {results.length === 0 ? (
            <div style={{ padding: "12px 14px", fontSize: "12px", color: MUTED, fontStyle: "italic" }}>{t("submitScholar.step2.noScholarFound")}</div>
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
        <p style={{ fontFamily: MONO, fontSize: "9px", color: "#c0c9c3", margin: 0 }}>{hint}</p>
      </div>
    </>
  );
}

/* ─────────────────────────────────────────────
   PERSON LINK CARD
───────────────────────────────────────────── */
function PersonLinkSection({ person, onChange, t }: {
  person: PersonEntry; onChange: (p: PersonEntry) => void; t: (k: string) => string;
}) {
  const tabStyle = (active: boolean): React.CSSProperties => ({
    flex: 1, padding: "8px 0", textAlign: "center", fontFamily: MONO, fontSize: "10px", fontWeight: 700,
    letterSpacing: "0.08em", border: "none", cursor: "pointer", transition: "all 0.15s",
    background: active ? GREEN : "transparent", color: active ? "#fff" : MUTED,
    display: "flex", alignItems: "center", justifyContent: "center", gap: "5px",
  });

  return (
    <div style={{ marginTop: "14px" }}>
      <label style={labelStyle}>{t("submitScholar.step2.linkToScholar")}</label>
      <div style={{ display: "flex", border: `1.5px solid ${BORDER}`, borderRadius: "8px", overflow: "hidden", marginBottom: "12px" }}>
        <button style={tabStyle(person.linkMode === "internal")} onClick={() => onChange({ ...person, linkMode: "internal" })}>
          <Icon name="search" size={13} /> {t("submitScholar.step2.database")}
        </button>
        <button style={{ ...tabStyle(person.linkMode === "external"), borderLeft: `1px solid ${BORDER}`, borderRight: `1px solid ${BORDER}` }} onClick={() => onChange({ ...person, linkMode: "external" })}>
          <Icon name="link" size={13} /> {t("submitScholar.step2.externalLink")}
        </button>
        <button style={tabStyle(person.linkMode === "none")} onClick={() => onChange({ ...person, linkMode: "none" })}>
          <Icon name="block" size={13} /> {t("submitScholar.step2.noLink")}
        </button>
      </div>

      {person.linkMode === "internal" && (
        <div>
          <ScholarSearch
            value={person.linked}
            onSelect={s => onChange({ ...person, linked: s })}
            onClear={() => onChange({ ...person, linked: null })}
            t={t}
          />
          <p style={{ fontFamily: MONO, fontSize: "9px", color: MUTED, marginTop: "6px", fontStyle: "italic" }}>
            {t("submitScholar.step2.dbHint")}
          </p>
        </div>
      )}
      {person.linkMode === "external" && (
        <div>
          <FocusInput type="url" value={person.externalUrl} onChange={e => onChange({ ...person, externalUrl: e.target.value })} placeholder={t("submitScholar.step2.externalUrlPh")} />
          <p style={{ fontFamily: MONO, fontSize: "9px", color: MUTED, marginTop: "6px", fontStyle: "italic" }}>{t("submitScholar.step2.externalUrlHint")}</p>
        </div>
      )}
      {person.linkMode === "none" && (
        <p style={{ fontFamily: MONO, fontSize: "9px", color: MUTED, fontStyle: "italic" }}>{t("submitScholar.step2.noLinkHint")}</p>
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
function AccessModeTabs({ mode, onChange, children, t }: {
  mode: AccessMode; onChange: (m: AccessMode) => void; children: React.ReactNode; t: (k: string) => string;
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
        <button style={tabStyle(mode === "none")} onClick={() => onChange("none")}><Icon name="block" size={13} /> {t("submitScholar.step4.none")}</button>
        <button style={{ ...tabStyle(mode === "upload"), borderLeft: `1px solid ${BORDER}`, borderRight: `1px solid ${BORDER}` }} onClick={() => onChange("upload")}><Icon name="upload_file" size={13} /> {t("submitScholar.step4.upload")}</button>
        <button style={tabStyle(mode === "link")} onClick={() => onChange("link")}><Icon name="link" size={13} /> {t("submitScholar.step4.link")}</button>
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
   RICH TEXT EDITOR (WYSIWYG TOGGLE)
───────────────────────────────────────────── */
const RichTextEditor = ({ value, onChange, placeholder }: { 
  value: string; 
  onChange: (val: string) => void; 
  placeholder: string 
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [activeCmds, setActiveCmds] = useState<Record<string, boolean>>({});

  // Sync initial value only on mount to prevent cursor jumping
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
    }
  }, []);

  // Check which formatting is currently active at the cursor position
  const updateActiveState = () => {
    if (!editorRef.current || !document.contains(editorRef.current)) return;
    
    const cmds = ['bold', 'italic', 'underline', 'insertUnorderedList', 'insertOrderedList'];
    const newState: Record<string, boolean> = {};
    
    cmds.forEach(cmd => {
      try { newState[cmd] = document.queryCommandState(cmd); } catch (e) {}
    });
    
    // Check block formats (Heading, Quote)
    try {
      const block = document.queryCommandValue('formatBlock').toLowerCase();
      newState['h2'] = block.includes('h2') || block.includes('heading');
      newState['blockquote'] = block.includes('blockquote');
    } catch (e) {}
    
    setActiveCmds(newState);
  };

  // Execute a formatting command
  const exec = (command: string, val: string | undefined = undefined) => {
    editorRef.current?.focus();
    document.execCommand(command, false, val);
    updateActiveState();
    if (editorRef.current) onChange(editorRef.current.innerHTML);
  };

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
    updateActiveState();
  };

  // Toolbar button style
  const btnStyle = (isActive: boolean): React.CSSProperties => ({
    background: isActive ? GREEN_LIGHT : "transparent",
    border: "none",
    cursor: "pointer",
    padding: "6px 10px",
    borderRadius: "4px",
    color: isActive ? GREEN : "#404945",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.15s",
    fontWeight: isActive ? 700 : 400,
  });

  return (
    <div style={{ border: `1.5px solid ${BORDER}`, borderRadius: "8px", overflow: "hidden", background: "#fff" }}>
      {/* Toolbar */}
      <div style={{ display: "flex", gap: "2px", padding: "6px 10px", background: "#f3f4f1", borderBottom: `1px solid ${BORDER}`, flexWrap: "wrap" }}>
        <button title="Bold" style={btnStyle(activeCmds['bold'])} onMouseDown={e => { e.preventDefault(); exec('bold'); }}>
          <Icon name="format_bold" size={18} />
        </button>
        <button title="Italic" style={btnStyle(activeCmds['italic'])} onMouseDown={e => { e.preventDefault(); exec('italic'); }}>
          <Icon name="format_italic" size={18} />
        </button>
        
        <div style={{ width: "1px", background: BORDER, margin: "0 4px" }} />
        
        <button title="Heading" style={btnStyle(activeCmds['h2'])} onMouseDown={e => { e.preventDefault(); exec('formatBlock', 'h2'); }}>
          <span style={{ fontFamily: SERIF, fontSize: "16px", fontWeight: 700 }}>T</span>
        </button>
        <button title="Quote" style={btnStyle(activeCmds['blockquote'])} onMouseDown={e => { e.preventDefault(); exec('formatBlock', 'blockquote'); }}>
          <span style={{ fontFamily: SERIF, fontSize: "16px", fontWeight: 700, lineHeight: 1 }}>&ldquo;</span>
        </button>
        <button title="List" style={btnStyle(activeCmds['insertUnorderedList'])} onMouseDown={e => { e.preventDefault(); exec('insertUnorderedList'); }}>
          <Icon name="format_list_bulleted" size={18} />
        </button>
        
        <div style={{ width: "1px", background: BORDER, margin: "0 4px" }} />

        <button title="Link" style={btnStyle(false)} onMouseDown={e => { 
          e.preventDefault(); 
          const url = prompt("Enter URL:"); 
          if (url) exec('createLink', url); 
        }}>
          <Icon name="link" size={18} />
        </button>
        <button title="Image" style={btnStyle(false)} onMouseDown={e => { 
          e.preventDefault(); 
          const url = prompt("Enter Image URL:"); 
          if (url) exec('insertImage', url); 
        }}>
          <Icon name="image" size={18} />
        </button>
      </div>

      {/* Editable Area */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onKeyUp={updateActiveState}
        onMouseUp={updateActiveState}
        onFocus={updateActiveState}
        data-placeholder={placeholder}
        style={{
          minHeight: "400px",
          padding: "16px",
          fontFamily: SANS,
          fontSize: "14px",
          lineHeight: "1.8",
          color: "#191c1b",
          outline: "none",
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
        }}
      />
      
      {/* CSS for placeholder and internal editor styles */}
      <style>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: ${MUTED};
          pointer-events: none;
          display: block;
        }
        [contenteditable] blockquote {
          border-left: 3px solid ${GREEN};
          margin: 10px 0;
          padding-left: 16px;
          color: #404945;
          font-style: italic;
        }
        [contenteditable] h2 {
          font-family: ${SERIF};
          font-size: 20px;
          color: ${GREEN};
          margin: 16px 0 8px 0;
        }
        [contenteditable] ul {
          padding-left: 24px;
          margin: 8px 0;
        }
        [contenteditable] a {
          color: ${GREEN};
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
};

/* ─────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────── */
const SubmitScholarPage: React.FC = () => {
  const { t, setLang } = useLang();

  const STEPS = [
    { id: "identity",  num: "01", label: t("submitScholar.steps.identity") },
    { id: "relations", num: "02", label: t("submitScholar.steps.relations") },
    { id: "narrative", num: "03", label: t("submitScholar.steps.narrative") },
    { id: "works",     num: "04", label: t("submitScholar.steps.works") },
    { id: "media",     num: "05", label: t("submitScholar.steps.media") },
    { id: "refs",      num: "06", label: t("submitScholar.steps.refs") },
    { id: "review",    num: "07", label: t("submitScholar.steps.review") },
  ];

  const { scholarId, lang: routeLang } = useParams<{ scholarId?: string; lang?: string }>();
  const validRouteLang: Language | null =
    routeLang && (["EN", "AR", "FR"] as string[]).includes(routeLang)
      ? (routeLang as Language)
      : null;

  const [phase, setPhase] = useState<"lang" | "form" | "success">(
    validRouteLang ? "form" : "lang"
  );
  const [pickedLang, setPickedLang] = useState<Language>("EN");
  const lang: Language = validRouteLang ?? pickedLang;
  const [step, setStep] = useState(0);
  const topRef = useRef<HTMLDivElement>(null);

    const [form, setForm] = useState<FormState>({
    canonical_name: "",
    region: "",
    birth_date_gerogean: "",
    birth_date_hijri: "",
    death_date_gerogean: "",
    death_date_hijri: "",
    century_hijri: "",
    century_gregorian: "",
    biography: "",
    aliases: [],
    discipline_ids: [],
    portraitUrl: null,
    pageTitle: "",
    summary: "",
    quote: "",
    teachers: [],
    students: [],
    relatedScholars: [],
    works: [],
    media: [],
    refs: [],
    confirmed: false,
  });

  const [isLoadingMeta, setIsLoadingMeta] = useState(true);

    // Meta data state (Using static data since API is not built yet)
  const languages = LANGUAGES;
  const disciplines = DISCIPLINES.map(d => ({ discipline_id: d.id, name: d.name.en }));
  const portraitInputRef = useRef<HTMLInputElement>(null);

  const scrollTop = () => { setTimeout(() => topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50); };

  const goNext = () => { if (step < STEPS.length - 1) { setStep(s => s + 1); scrollTop(); } };
  const goPrev = () => { if (step > 0) { setStep(s => s - 1); scrollTop(); } };
  const jumpTo = (i: number) => { if (i < step) { setStep(i); scrollTop(); } };

  const upd = <K extends keyof FormState>(key: K, val: FormState[K]) => setForm(f => ({ ...f, [key]: val }));

     const langLabel = NATIVE_LANG_NAMES[lang];
    useEffect(() => {
    if (validRouteLang) {
      setLang(validRouteLang);
    }
  }, [validRouteLang, setLang]);;

  /* ── LANGUAGE SELECTION ── */
  if (phase === "lang") {
    return (
      <div className="submit-scholar-page" style={{ fontFamily: SANS, minHeight: "100vh", background: "#faf9f6", backgroundImage: "radial-gradient(circle at 50% 0%, rgba(201,168,76,0.06) 0%, transparent 60%)", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 24px" }}> <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Source+Serif+4:ital,opsz,wght@0,8..60,400..900;1,8..60,400..900&family=Source+Sans+3:wght@300..700&family=JetBrains+Mono:wght@400..700&display=swap');
          @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap');
          .material-symbols-outlined { font-variation-settings: 'FILL' 0,'wght' 400,'GRAD' 0,'opsz' 24; font-family: 'Material Symbols Outlined'; display: inline-block; vertical-align: middle; }
          .submit-scholar-page * { box-sizing: border-box; margin: 0; padding: 0; }
          .submit-scholar-page a { text-decoration: none; }
        `}</style>
        <div style={{ maxWidth: "540px", width: "100%", textAlign: "center" }}>
          <div style={{ fontFamily: MONO, fontSize: "10px", color: GREEN, letterSpacing: "0.25em", marginBottom: "8px", opacity: 0.7 }}>OULAMAUNA</div>
          <h1 style={{ fontFamily: SERIF, fontSize: "36px", fontWeight: 700, color: GREEN, marginBottom: "10px", lineHeight: 1.2 }}>{t("submitScholar.portal.title")}</h1>
          <p style={{ fontSize: "14px", color: MUTED, marginBottom: "40px", lineHeight: 1.6, maxWidth: "400px", margin: "0 auto 40px" }}>
            {t("submitScholar.portal.subtitle")}
          </p>

          <div style={{ background: "#fff", border: "1px solid rgba(192,201,195,0.4)", borderRadius: "20px", padding: "40px", boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}>
            <label style={{ ...labelStyle, textAlign: "center", display: "block", marginBottom: "16px" }}>{t("submitScholar.portal.selectLang")}</label>
            <p style={{ fontSize: "13px", color: MUTED, marginBottom: "24px", lineHeight: 1.5 }}>
              {t("submitScholar.portal.langDesc")}
            </p>
          <div style={{ display: "flex", gap: "10px", justifyContent: "center", marginBottom: "32px" }}>
              {(["EN", "AR", "FR"] as Language[]).map(l => (
                <button key={l} onClick={() => setPickedLang(l)} style={{
                  padding: "12px 24px", borderRadius: "999px", border: `1.5px solid ${pickedLang === l ? GREEN : BORDER}`,
                  background: pickedLang === l ? GREEN : "transparent", color: pickedLang === l ? "#fff" : MUTED,
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
              {t("submitScholar.portal.begin")} <Icon name="arrow_forward" size={16} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ── SUCCESS ── */
  if (phase === "success") {
    return (
      <div className="submit-scholar-page" style={{ fontFamily: SANS, minHeight: "100vh", background: "#f9faf7", backgroundImage: "radial-gradient(#e1e3e0 0.5px, transparent 0.5px)", backgroundSize: "24px 24px", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 24px" }}>
        <div style={{ maxWidth: "560px", width: "100%", textAlign: "center" }}>
          <Card>
            <div style={{ padding: "24px 0" }}>
              <div style={{ width: "72px", height: "72px", borderRadius: "50%", background: GREEN_LIGHT, border: `2px solid ${GREEN_BORDER}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px", color: GREEN }}>
                <Icon name="check_circle" size={36} />
              </div>
              <h2 style={{ fontFamily: SERIF, fontSize: "26px", fontWeight: 700, color: GREEN, marginBottom: "12px" }}>{t("submitScholar.success.title")}</h2>
              <p style={{ fontSize: "14px", color: MUTED, lineHeight: 1.7, maxWidth: "380px", margin: "0 auto 28px" }}>
                {t("submitScholar.success.desc")}
              </p>
              <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "8px 20px", borderRadius: "20px", background: "rgba(115,92,0,0.08)", color: GOLD, fontFamily: MONO, fontSize: "10px", fontWeight: 700, letterSpacing: "0.1em", border: `1px solid rgba(115,92,0,0.2)`, marginBottom: "24px" }}>
                <Icon name="schedule" size={14} /> {t("submitScholar.success.pending")}
              </div>
              <div style={{ padding: "16px", background: "#f9faf7", border: `1px solid ${BORDER}`, borderRadius: "10px", fontSize: "12px", color: MUTED, lineHeight: 1.6 }}>
                {t("submitScholar.success.note")}
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
          
           /* ════ STEP 1: IDENTITY & METADATA ════ */
                 /* ════ STEP 1: IDENTITY & METADATA ════ */
      case 0: return (
        <Card>
          <CardTitle num="01" title={t("submitScholar.step1.title") || "Identity & Metadata"} />
          
          <div style={{ display: "grid", gridTemplateColumns: "160px 1fr", gap: "32px", marginBottom: "28px" }}>
            {/* Portrait (UI Only, NOT sent to backend yet) */}
            <div>
              <label style={labelStyle}>{t("submitScholar.step1.portrait") || "Portrait"}</label>
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
                  <span style={{ fontSize: "11px", color: MUTED, fontFamily: MONO }}>{t("submitScholar.step1.uploadImage") || "Upload Image"}</span>
                </div>
              )}
              <input ref={portraitInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={e => { const f = e.target.files?.[0]; if (f) upd("portraitUrl", URL.createObjectURL(f)); }} />
            </div>

            {/* Backend Fields Only */}
            <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
              <div>
                <label style={labelStyle}>{t("submitScholar.step1.canonicalName") || "Canonical Name"} <span style={{ color: DANGER }}>*</span></label>
                <FocusInput type="text" value={form.canonical_name} onChange={e => upd("canonical_name", e.target.value)} placeholder="e.g. Malek Bennabi" />
              </div>
              <div>
                <label style={labelStyle}>{t("submitScholar.step1.aliases") || "Aliases"}</label>
                <ChipInput items={form.aliases} onAdd={v => upd("aliases", [...form.aliases, v])} onRemove={i => upd("aliases", form.aliases.filter((_, idx) => idx !== i))} placeholder="e.g. Malik Bin Nabi" />
              </div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "24px" }}>
            <div>
              <label style={labelStyle}>{t("submitScholar.step1.birthDateGregorian") || "Birth Date (Gregorian)"}</label>
              <FocusInput type="text" value={form.birth_date_gerogean} onChange={e => upd("birth_date_gerogean", e.target.value)} placeholder="e.g. 1905" />
            </div>
            <div>
              <label style={labelStyle}>{t("submitScholar.step1.birthDateHijri") || "Birth Date (Hijri)"}</label>
              <FocusInput type="text" value={form.birth_date_hijri} onChange={e => upd("birth_date_hijri", e.target.value)} placeholder="e.g. 1323 AH" />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "24px" }}>
            <div>
              <label style={labelStyle}>{t("submitScholar.step1.deathDateGregorian") || "Death Date (Gregorian)"}</label>
              <FocusInput type="text" value={form.death_date_gerogean} onChange={e => upd("death_date_gerogean", e.target.value)} placeholder="e.g. 1973" />
            </div>
            <div>
              <label style={labelStyle}>{t("submitScholar.step1.deathDateHijri") || "Death Date (Hijri)"}</label>
              <FocusInput type="text" value={form.death_date_hijri} onChange={e => upd("death_date_hijri", e.target.value)} placeholder="e.g. 1393 AH" />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "24px", marginBottom: "24px" }}>
            <div>
              <label style={labelStyle}>{t("submitScholar.step1.region") || "Region"} <span style={{ color: DANGER }}>*</span></label>
              <FocusInput type="text" value={form.region} onChange={e => upd("region", e.target.value)} placeholder="e.g. Algeria" />
            </div>
            <div>
              <label style={labelStyle}>{t("submitScholar.step1.centuryGregorian") || "Century (Gregorian)"}</label>
              <FocusInput type="text" value={form.century_gregorian} onChange={e => upd("century_gregorian", e.target.value)} placeholder="e.g. 20" />
            </div>
            <div>
              <label style={labelStyle}>{t("submitScholar.step1.centuryHijri") || "Century (Hijri)"}</label>
              <FocusInput type="text" value={form.century_hijri} onChange={e => upd("century_hijri", e.target.value)} placeholder="e.g. 14" />
            </div>
          </div>

          <Divider />

          <div style={{ marginBottom: "24px" }}>
            <label style={labelStyle}>{t("submitScholar.step1.disciplines") || "Disciplines"} <span style={{ color: DANGER }}>*</span></label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "8px" }}>
              {DISCIPLINES.map(d => (
                <DisciplineBtn 
                  key={d.id} 
                  label={d.name[lang === "AR" ? "ar" : lang === "FR" ? "fr" : "en"]} 
                  active={form.discipline_ids.includes(d.id)}
                  onClick={() => upd("discipline_ids", form.discipline_ids.includes(d.id) ? form.discipline_ids.filter(x => x !== d.id) : [...form.discipline_ids, d.id])}
                />
              ))}
            </div>
          </div>
        </Card>
      );
      case 1: return (
        <Card>
          <CardTitle num="02" title={t("submitScholar.step2.title")} />
          {/* Teachers */}
          <div style={{ marginBottom: "28px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
              <label style={sectionLabelStyle}>{t("submitScholar.step2.teachers")}</label>
              <button onClick={() => upd("teachers", [...form.teachers, emptyPerson()])} style={{ padding: "6px 14px", border: `1.5px solid ${GREEN}`, borderRadius: "6px", background: "transparent", color: GREEN, fontFamily: MONO, fontSize: "9px", fontWeight: 700, letterSpacing: "0.1em", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "5px", transition: "all 0.15s" }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = GREEN; (e.currentTarget as HTMLButtonElement).style.color = "#fff"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; (e.currentTarget as HTMLButtonElement).style.color = GREEN; }}
              ><Icon name="add" size={13} /> {t("submitScholar.step2.addTeacher")}</button>
            </div>
            {form.teachers.length === 0 && <p style={{ fontSize: "13px", color: MUTED, fontStyle: "italic", padding: "16px 0" }}>{t("submitScholar.step2.noTeachers")}</p>}
            {form.teachers.map((p, i) => (
              <ItemCard key={i} index={i} label={t("submitScholar.step2.teachers")} onRemove={() => upd("teachers", form.teachers.filter((_, idx) => idx !== i))}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div><label style={labelStyle}>{t("submitScholar.step2.name")} <span style={{ color: DANGER }}>*</span></label>
                    <FocusInput type="text" value={p.name} onChange={e => { const t2 = [...form.teachers]; t2[i] = { ...t2[i], name: e.target.value }; upd("teachers", t2); }} placeholder={t("submitScholar.step2.scholarName")} /></div>
                  <div><label style={labelStyle}>{t("submitScholar.step2.relationDesc")}</label>
                    <FocusInput type="text" value={p.desc} onChange={e => { const t2 = [...form.teachers]; t2[i] = { ...t2[i], desc: e.target.value }; upd("teachers", t2); }} placeholder="e.g. Primary teacher in Fiqh" /></div>
                </div>
                <PersonLinkSection person={p} onChange={np => { const t2 = [...form.teachers]; t2[i] = np; upd("teachers", t2); }} t={t} />
              </ItemCard>
            ))}
          </div>
          <Divider />
          {/* Students */}
          <div style={{ marginBottom: "28px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
              <label style={sectionLabelStyle}>{t("submitScholar.step2.students")}</label>
              <button onClick={() => upd("students", [...form.students, emptyPerson()])} style={{ padding: "6px 14px", border: `1.5px solid ${GREEN}`, borderRadius: "6px", background: "transparent", color: GREEN, fontFamily: MONO, fontSize: "9px", fontWeight: 700, letterSpacing: "0.1em", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "5px", transition: "all 0.15s" }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = GREEN; (e.currentTarget as HTMLButtonElement).style.color = "#fff"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; (e.currentTarget as HTMLButtonElement).style.color = GREEN; }}
              ><Icon name="add" size={13} /> {t("submitScholar.step2.addStudent")}</button>
            </div>
            {form.students.length === 0 && <p style={{ fontSize: "13px", color: MUTED, fontStyle: "italic", padding: "16px 0" }}>{t("submitScholar.step2.noStudents")}</p>}
            {form.students.map((p, i) => (
              <ItemCard key={i} index={i} label={t("submitScholar.step2.students")} onRemove={() => upd("students", form.students.filter((_, idx) => idx !== i))}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div><label style={labelStyle}>{t("submitScholar.step2.name")} <span style={{ color: DANGER }}>*</span></label>
                    <FocusInput type="text" value={p.name} onChange={e => { const t2 = [...form.students]; t2[i] = { ...t2[i], name: e.target.value }; upd("students", t2); }} placeholder={t("submitScholar.step2.scholarName")} /></div>
                  <div><label style={labelStyle}>{t("submitScholar.step2.relationDesc")}</label>
                    <FocusInput type="text" value={p.desc} onChange={e => { const t2 = [...form.students]; t2[i] = { ...t2[i], desc: e.target.value }; upd("students", t2); }} placeholder="e.g. Studied Hadith sciences" /></div>
                </div>
                <PersonLinkSection person={p} onChange={np => { const t2 = [...form.students]; t2[i] = np; upd("students", t2); }} t={t} />
              </ItemCard>
            ))}
          </div>
          <Divider />
          {/* Related Scholars */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
              <label style={sectionLabelStyle}>{t("submitScholar.step2.related")}</label>
              <button onClick={() => upd("relatedScholars", [...form.relatedScholars, { ...emptyPerson(), relationType: "Influence" }])} style={{ padding: "6px 14px", border: `1.5px solid ${GREEN}`, borderRadius: "6px", background: "transparent", color: GREEN, fontFamily: MONO, fontSize: "9px", fontWeight: 700, letterSpacing: "0.1em", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "5px", transition: "all 0.15s" }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = GREEN; (e.currentTarget as HTMLButtonElement).style.color = "#fff"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; (e.currentTarget as HTMLButtonElement).style.color = GREEN; }}
              ><Icon name="add" size={13} /> {t("submitScholar.step2.addRelation")}</button>
            </div>
            {form.relatedScholars.length === 0 && <p style={{ fontSize: "13px", color: MUTED, fontStyle: "italic", padding: "16px 0" }}>{t("submitScholar.step2.noRelated")}</p>}
            {form.relatedScholars.map((p, i) => (
              <ItemCard key={i} index={i} label={t("submitScholar.step2.related")} onRemove={() => upd("relatedScholars", form.relatedScholars.filter((_, idx) => idx !== i))}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "12px" }}>
                  <div><label style={labelStyle}>{t("submitScholar.step2.scholarName")} <span style={{ color: DANGER }}>*</span></label>
                    <FocusInput type="text" value={p.name} onChange={e => { const t2 = [...form.relatedScholars]; t2[i] = { ...t2[i], name: e.target.value }; upd("relatedScholars", t2); }} placeholder={t("submitScholar.step2.name")} /></div>
                  <div><label style={labelStyle}>{t("submitScholar.step2.relationType")} <span style={{ color: DANGER }}>*</span></label>
                    <FocusSelect value={p.relationType} onChange={e => { const t2 = [...form.relatedScholars]; t2[i] = { ...t2[i], relationType: e.target.value }; upd("relatedScholars", t2); }}>
                      {RELATION_TYPES.map(r => <option key={r}>{r}</option>)}
                    </FocusSelect>
                  </div>
                </div>
                <div style={{ marginBottom: "12px" }}>
                  <label style={labelStyle}>{t("submitScholar.step2.description")}</label>
                  <FocusInput type="text" value={p.desc} onChange={e => { const t2 = [...form.relatedScholars]; t2[i] = { ...t2[i], desc: e.target.value }; upd("relatedScholars", t2); }} placeholder="e.g. Mutual correspondent on reform ideas" />
                </div>
                <PersonLinkSection person={p} onChange={np => { const t2 = [...form.relatedScholars]; t2[i] = { ...np, relationType: p.relationType }; upd("relatedScholars", t2); }} t={t} />
              </ItemCard>
            ))}
          </div>
        </Card>
      );

      
            /* ════ STEP 3: BIOGRAPHY ════ */
           /* ════ STEP 3: BIOGRAPHY ════ */
      case 2: return (
        <Card>
          <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "32px", paddingBottom: "20px", borderBottom: "1px solid rgba(192,201,195,0.3)" }}>
            <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: GREEN, color: "#fff", fontFamily: MONO, fontSize: "12px", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>03</div>
            <h2 style={{ fontFamily: SERIF, fontSize: "20px", fontWeight: 700, color: GREEN, margin: 0 }}>{t("submitScholar.step3.title")}</h2>
            <span style={{ marginLeft: "auto", fontFamily: MONO, fontSize: "9px", fontWeight: 700, padding: "4px 12px", borderRadius: "4px", background: GREEN_LIGHT, color: GREEN, border: `1px solid ${GREEN_BORDER}`, letterSpacing: "0.1em" }}>{langLabel.toUpperCase()}</span>
          </div>

          <div style={{ marginBottom: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "6px" }}>
              <label style={labelStyle}>{t("submitScholar.step3.biography")} <span style={{ color: DANGER }}>*</span></label>
              <span style={{ fontFamily: MONO, fontSize: "9px", color: MUTED }}>Rich Text Editor</span>
            </div>
            
            {/* The new toggleable Rich Text Editor */}
            <RichTextEditor 
              value={form.biography} 
              onChange={(html) => upd("biography", html)} 
              placeholder="Write biography here... Select text and click buttons to format." 
            />
            
            <p style={{ fontFamily: MONO, fontSize: "9px", color: MUTED, marginTop: "8px", fontStyle: "italic" }}>
              Tip: Click a button to toggle formatting on. Click it again to turn it off.
            </p>
          </div>
        </Card>
      );
       /* ════ STEP 4: WORKS (Kept in UI, not sent to backend yet) ════ */
      case 3: return (
        <Card>
          <CardTitle num="04" title={t("submitScholar.step4.title")} />
          {form.works.length === 0 && (
            <div style={{ textAlign: "center", padding: "48px 0", border: `2px dashed ${BORDER}`, borderRadius: "12px", marginBottom: "16px" }}>
              <Icon name="menu_book" size={40} />
              <p style={{ color: MUTED, fontSize: "14px", marginTop: "12px" }}>{t("submitScholar.step4.noWorks")}</p>
            </div>
          )}
          {form.works.map((w, i) => (
            <ItemCard key={i} index={i} label={t("submitScholar.step4.work")} onRemove={() => upd("works", form.works.filter((_, idx) => idx !== i))}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                <div><label style={labelStyle}>{t("submitScholar.step4.titleField")} <span style={{ color: DANGER }}>*</span></label><FocusInput type="text" value={w.title} onChange={e => { const t2 = [...form.works]; t2[i] = { ...t2[i], title: e.target.value }; upd("works", t2); }} placeholder={t("submitScholar.step4.titlePh")} /></div>
                <div><label style={labelStyle}>{t("submitScholar.step4.origTitle")}</label><FocusInput type="text" value={w.origTitle} onChange={e => { const t2 = [...form.works]; t2[i] = { ...t2[i], origTitle: e.target.value }; upd("works", t2); }} placeholder={t("submitScholar.step4.origTitlePh")} /></div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "14px", marginBottom: "16px" }}>
                <div><label style={labelStyle}>{t("submitScholar.step4.workType")} <span style={{ color: DANGER }}>*</span></label><FocusSelect value={w.type} onChange={e => { const t2 = [...form.works]; t2[i] = { ...t2[i], type: e.target.value }; upd("works", t2); }}>{WORK_TYPES.map(x => <option key={x}>{x}</option>)}</FocusSelect></div>
                <div><label style={labelStyle}>{t("submitScholar.step4.pubYear")}</label><FocusInput type="number" value={w.year} onChange={e => { const t2 = [...form.works]; t2[i] = { ...t2[i], year: e.target.value }; upd("works", t2); }} placeholder="e.g. 1946" min={600} max={2025} /></div>
                <div><label style={labelStyle}>{t("submitScholar.step4.language")}</label><FocusInput type="text" value={w.lang} onChange={e => { const t2 = [...form.works]; t2[i] = { ...t2[i], lang: e.target.value }; upd("works", t2); }} placeholder={t("submitScholar.step4.languagePh")} /></div>
              </div>
              <div style={{ marginBottom: "16px" }}>
                <label style={labelStyle}>{t("submitScholar.step4.description")} <span style={{ color: DANGER }}>*</span></label>
                <FocusTextarea value={w.desc} onChange={e => { const t2 = [...form.works]; t2[i] = { ...t2[i], desc: e.target.value }; upd("works", t2); }} rows={2} placeholder={t("submitScholar.step4.descPh")} />
              </div>
              <div>
                <label style={labelStyle}>{t("submitScholar.step4.digitalAccess")}</label>
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

      /* ════ STEP 5: MEDIA (Kept in UI, not sent to backend yet) ════ */
      case 4: return (
        <Card>
          <CardTitle num="05" title={t("submitScholar.step5.title")} />
          <p style={{ fontSize: "13px", color: MUTED, marginBottom: "24px", lineHeight: 1.6 }}>{t("submitScholar.step5.desc")}</p>
          {form.media.length === 0 && (
            <div style={{ textAlign: "center", padding: "48px 0", border: `2px dashed ${BORDER}`, borderRadius: "12px", marginBottom: "16px" }}>
              <Icon name="perm_media" size={40} />
              <p style={{ color: MUTED, fontSize: "14px", marginTop: "12px" }}>{t("submitScholar.step5.noMedia")}</p>
            </div>
          )}
          {form.media.map((m, i) => (
            <ItemCard key={i} index={i} label={t("submitScholar.step5.media")} onRemove={() => upd("media", form.media.filter((_, idx) => idx !== i))}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                <div><label style={labelStyle}>{t("submitScholar.step5.titleField")} <span style={{ color: DANGER }}>*</span></label><FocusInput type="text" value={m.title} onChange={e => { const t2 = [...form.media]; t2[i] = { ...t2[i], title: e.target.value }; upd("media", t2); }} placeholder={t("submitScholar.step5.titlePh")} /></div>
                <div><label style={labelStyle}>{t("submitScholar.step5.mediaType")} <span style={{ color: DANGER }}>*</span></label><FocusSelect value={m.type} onChange={e => { const t2 = [...form.media]; t2[i] = { ...t2[i], type: e.target.value }; upd("media", t2); }}>{MEDIA_TYPES.map(x => <option key={x}>{x}</option>)}</FocusSelect></div>
              </div>
              <div style={{ marginBottom: "16px" }}>
                <label style={labelStyle}>{t("submitScholar.step5.description")}</label>
                <FocusTextarea value={m.desc} onChange={e => { const t2 = [...form.media]; t2[i] = { ...t2[i], desc: e.target.value }; upd("media", t2); }} rows={2} placeholder={t("submitScholar.step5.descPh")} />
              </div>
              <div>
                <label style={labelStyle}>{t("submitScholar.step5.fileLink")}</label>
                <AccessModeTabs mode={m.accessMode} onChange={mode => { const t2 = [...form.media]; t2[i] = { ...t2[i], accessMode: mode }; upd("media", t2); }} t={t}>
                  {m.accessMode === "upload" && <UploadZone file={m.file} onFile={f => { const t2 = [...form.media]; t2[i] = { ...t2[i], file: f }; upd("media", t2); }} onRemove={() => { const t2 = [...form.media]; t2[i] = { ...t2[i], file: null }; upd("media", t2); }} accept=".pdf,.mp3,.wav,.mp4,.webm" hint="PDF, Audio (MP3/WAV), Video (MP4) — up to 100 MB" />}
                  {m.accessMode === "link" && <FocusInput type="url" value={m.url} onChange={e => { const t2 = [...form.media]; t2[i] = { ...t2[i], url: e.target.value }; upd("media", t2); }} placeholder="https://youtube.com/… or direct file URL" />}
                  {m.accessMode === "none" && <p style={{ fontFamily: MONO, fontSize: "9px", color: MUTED, fontStyle: "italic" }}>{t("submitScholar.step5.noneHint")}</p>}
                </AccessModeTabs>
              </div>
            </ItemCard>
          ))}
          <AddBtn onClick={() => upd("media", [...form.media, emptyMedia()])}>{t("submitScholar.step5.addMedia")}</AddBtn>
        </Card>
      );

      /* ════ STEP 6: REFERENCES (Simplified to 3 fields) ════ */
      case 5: return (
        <Card>
          <CardTitle num="06" title={t("submitScholar.step6.title")} />
          <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "12px 16px", background: "rgba(179,38,30,0.05)", border: "1px solid rgba(179,38,30,0.2)", borderRadius: "8px", marginBottom: "24px" }}>
            <Icon name="warning" size={16} />
            <span style={{ fontFamily: MONO, fontSize: "10px", color: DANGER, fontWeight: 700, letterSpacing: "0.08em" }}>{t("submitScholar.step6.warning")}</span>
          </div>
          {form.refs.length === 0 && (
            <div style={{ textAlign: "center", padding: "48px 0", border: `2px dashed ${BORDER}`, borderRadius: "12px", marginBottom: "16px" }}>
              <Icon name="auto_stories" size={40} />
              <p style={{ color: MUTED, fontSize: "14px", marginTop: "12px" }}>{t("submitScholar.step6.noRefs")}</p>
            </div>
          )}
          {form.refs.map((r, i) => (
            <ItemCard key={i} index={i} label={t("submitScholar.step6.reference")} onRemove={() => upd("refs", form.refs.filter((_, idx) => idx !== i))}>
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div>
                  <label style={labelStyle}>Title *</label>
                  <FocusInput type="text" value={r.title} onChange={e => { const t2 = [...form.refs]; t2[i] = { ...t2[i], title: e.target.value }; upd("refs", t2); }} placeholder="e.g. Wikipedia" />
                </div>
                <div>
                  <label style={labelStyle}>Citation *</label>
                  <FocusInput type="text" value={r.citation} onChange={e => { const t2 = [...form.refs]; t2[i] = { ...t2[i], citation: e.target.value }; upd("refs", t2); }} placeholder="e.g. Malek Bennabi" />
                </div>
                <div>
                  <label style={labelStyle}>URL</label>
                  <FocusInput type="url" value={r.url} onChange={e => { const t2 = [...form.refs]; t2[i] = { ...t2[i], url: e.target.value }; upd("refs", t2); }} placeholder="https://en.wikipedia.org/wiki/Malek_Bennabi" />
                </div>
              </div>
            </ItemCard>
          ))}
          <AddBtn onClick={() => upd("refs", [...form.refs, emptyRef()])}>{t("submitScholar.step6.addRef")}</AddBtn>
        </Card>
      );

      /* ════ STEP 7: REVIEW ════ */
      case 6: return (
        <Card>
          <CardTitle num="07" title={t("submitScholar.step7.title")} />
          <p style={{ fontSize: "13px", color: MUTED, marginBottom: "28px", lineHeight: 1.6 }}>
            {t("submitScholar.step7.desc")}
          </p>

          {/* Identity summary */}
          <div style={{ marginBottom: "24px", padding: "20px", background: "#f9faf7", border: `1px solid ${BORDER}`, borderRadius: "12px" }}>
            <div style={{ fontFamily: MONO, fontSize: "9px", color: GREEN, letterSpacing: "0.18em", marginBottom: "14px" }}>{t("submitScholar.step7.identitySection")}</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
             {[
  [t("submitScholar.step1.canonicalName"), form.canonical_name],
  [t("submitScholar.step1.region"), form.region],
  [t("submitScholar.step1.century"), `${form.century_gregorian} / ${form.century_hijri}`],
].map(([lbl, val]) => (
                <div key={lbl}><div style={{ fontFamily: MONO, fontSize: "9px", color: MUTED, marginBottom: "3px" }}>{lbl.toUpperCase()}</div><div style={{ fontSize: "13px", fontWeight: 600, color: val ? "#191c1b" : "#c0c9c3" }}>{val || "—"}</div></div>
              ))}
            </div>
          </div>

          {/* Narrative summary */}
          <div style={{ marginBottom: "24px", padding: "20px", background: "#f9faf7", border: `1px solid ${BORDER}`, borderRadius: "12px" }}>
            <div style={{ fontFamily: MONO, fontSize: "9px", color: GREEN, letterSpacing: "0.18em", marginBottom: "14px" }}>{t("submitScholar.step7.narrativeSection")} ({langLabel.toUpperCase()})</div>
            <div style={{ marginBottom: "10px" }}><div style={{ fontFamily: MONO, fontSize: "9px", color: MUTED, marginBottom: "3px" }}>{t("submitScholar.step3.pageTitle")}</div><div style={{ fontSize: "14px", fontWeight: 700, color: form.pageTitle ? "#191c1b" : "#c0c9c3", fontFamily: SERIF }}>{form.pageTitle || "—"}</div></div>
            {form.summary && <div style={{ fontSize: "13px", color: "#404945", lineHeight: 1.65 }}>{form.summary}</div>}
          </div>

          {/* References */}
          <div style={{ marginBottom: "28px", padding: "20px", background: "#f9faf7", border: `1px solid ${form.refs.length === 0 ? "rgba(179,38,30,0.3)" : BORDER}`, borderRadius: "12px" }}>
            <div style={{ fontFamily: MONO, fontSize: "9px", color: GREEN, letterSpacing: "0.18em", marginBottom: "14px" }}>{t("submitScholar.step7.refsSection")} ({form.refs.length})</div>
            {form.refs.length === 0 ? (
              <p style={{ fontFamily: MONO, fontSize: "10px", color: DANGER, display: "flex", alignItems: "center", gap: "6px" }}><Icon name="warning" size={14} /> {t("submitScholar.step7.refsRequired")}</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {form.refs.map((r, i) => <div key={i} style={{ fontSize: "13px", color: "#404945", padding: "8px 0", borderBottom: "1px solid #f0f1ee" }}>
                  <span style={{ fontWeight: 700 }}>{r.title}</span>{r.citation ? ` — ${r.citation}` : ""}
                </div>)}
              </div>
            )}
          </div>

          {/* Confirmation */}
          <label style={{ display: "flex", alignItems: "flex-start", gap: "12px", padding: "18px", background: GREEN_LIGHT, border: `1px solid ${GREEN_BORDER}`, borderRadius: "10px", cursor: "pointer", marginBottom: "16px" }}>
            <input type="checkbox" checked={form.confirmed} onChange={e => upd("confirmed", e.target.checked)} style={{ width: "16px", height: "16px", accentColor: GREEN, flexShrink: 0, marginTop: "2px" }} />
            <span style={{ fontSize: "13px", color: "#404945", lineHeight: 1.6 }}>
              {t("submitScholar.step7.confirmText")}
            </span>
          </label>
          <p style={{ fontFamily: MONO, fontSize: "9px", color: MUTED, letterSpacing: "0.06em" }}>
            {t("submitScholar.step7.confirmNote")}
          </p>
        </Card>
      );

      default: return null;
    }
  };

  return (
    <div className="submit-scholar-page" dir={lang === "AR" ? "rtl" : "ltr"} style={{ fontFamily: SANS, minHeight: "100vh", background: "#f9faf7", backgroundImage: "radial-gradient(#e1e3e0 0.5px, transparent 0.5px)", backgroundSize: "24px 24px", color: "#191c1b" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Source+Serif+4:ital,opsz,wght@0,8..60,400..900;1,8..60,400..900&family=Source+Sans+3:wght@300..700&family=JetBrains+Mono:wght@400..700&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap');
        .material-symbols-outlined { font-variation-settings: 'FILL' 0,'wght' 400,'GRAD' 0,'opsz' 24; font-family: 'Material Symbols Outlined'; display: inline-block; vertical-align: middle; }
        .submit-scholar-page * { box-sizing: border-box; margin: 0; padding: 0; }
        .submit-scholar-page a { text-decoration: none; }
        .submit-scholar-page input[type=number]::-webkit-inner-spin-button { opacity: 1; }
      `}</style>

      {/* HEADER */}
      <header style={{ position: "sticky", top: 0, zIndex: 50, background: "rgba(249,250,247,0.96)", backdropFilter: "blur(8px)", borderBottom: "1px solid rgba(192,201,195,0.3)", padding: "14px 0" }}>
        <div style={{ maxWidth: "900px", margin: "0 auto", padding: "0 40px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontFamily: MONO, fontSize: "10px", color: GREEN, letterSpacing: "0.2em", opacity: 0.7 }}>OULAMAUNA</div>
            <div style={{ fontSize: "13px", color: MUTED }}>{t("submitScholar.portal.title")}</div>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: "900px", margin: "0 auto", padding: "40px 40px 80px" }}>
        <div ref={topRef} />

        {/* LANGUAGE (locked) */}
        <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "6px 16px", background: GREEN_LIGHT, border: `1px solid ${GREEN_BORDER}`, borderRadius: "999px", width: "fit-content", marginBottom: "32px" }}>
          <Icon name="lock" size={12} />
          <span style={{ fontFamily: MONO, fontSize: "10px", fontWeight: 700, letterSpacing: "0.08em", color: GREEN }}>
            {/* This will now dynamically show "English", "العربية", or "Français" */}
            {NATIVE_LANG_NAMES[lang]}
          </span>
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
                <Icon name="arrow_back" size={14} /> {t("submitScholar.footer.back")}
              </button>
            )}
          </div>
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <button style={{ padding: "10px 20px", border: `1.5px solid ${GREEN}`, borderRadius: "8px", background: "transparent", color: GREEN, fontFamily: MONO, fontSize: "10px", fontWeight: 700, letterSpacing: "0.08em", cursor: "pointer", transition: "all 0.15s" }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = GREEN_LIGHT; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
            >{t("submitScholar.footer.saveDraft")}</button>
            {step < STEPS.length - 1 ? (
              <button onClick={goNext} style={{ padding: "10px 28px", background: GREEN, color: "#fff", border: "none", borderRadius: "8px", fontFamily: MONO, fontSize: "10px", fontWeight: 700, letterSpacing: "0.1em", cursor: "pointer", transition: "background 0.15s", display: "inline-flex", alignItems: "center", gap: "8px" }}
                onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = GREEN_DARK}
                onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = GREEN}
              >
                {t("submitScholar.footer.next")} <Icon name="arrow_forward" size={14} />
              </button>
            ) : (
                                 <button 
                onClick={async () => { 
                  if (!form.confirmed || form.refs.length === 0) { 
                    alert(t("submitScholar.step7.submitAlert") || "Please confirm and add at least one reference"); 
                    return; 
                  } 
                  
                  try {
                    const selectedLang = languages.find(l => l.code === lang.toLowerCase());
                    
                    // EXACT PAYLOAD MATCHING YOUR BACKEND scholar_versions COLUMNS
                    const payload: any = {
                      canonical_name: form.canonical_name,
                      region: form.region,
                      birth_date_gerogean: form.birth_date_gerogean || null,
                      birth_date_hijri: form.birth_date_hijri || null,
                      death_date_gerogean: form.death_date_gerogean || null,
                      death_date_hijri: form.death_date_hijri || null,
                      century_hijri: form.century_hijri || null,
                      century_gregorian: form.century_gregorian || null,
                      biography: form.biography,
                      aliases: form.aliases,
                      language_id: selectedLang?.language_id,
                      references: form.refs.map(r => ({
                        title: r.title,
                        citation: r.citation,
                        url: r.url || null
                      }))
                    };

                    // If scholarId exists, we are adding a language version. DO NOT send discipline_ids.
                    if (scholarId) {
                      payload.scholar_id = parseInt(scholarId, 10);
                    } else {
                      // New scholar: send discipline_ids directly (already numeric IDs from static DISCIPLINES)
                      payload.discipline_ids = form.discipline_ids;
                    }

                    // TODO: Connect Works, Media, Relations, Portrait, Expertise, and Keywords APIs once available.
                    // Currently managed locally in React state but not sent to backend.

                    await scholarsApi.create(payload);
                    setPhase("success");
                  } catch (error) {
                    console.error("Failed to submit scholar:", error);
                    alert("Failed to submit. Please try again.");
                  }
                }} 
                style={{ padding: "10px 28px", background: form.confirmed && form.refs.length > 0 ? GREEN : "#c0c9c3", color: "#fff", border: "none", borderRadius: "8px", fontFamily: MONO, fontSize: "10px", fontWeight: 700, letterSpacing: "0.1em", cursor: form.confirmed && form.refs.length > 0 ? "pointer" : "not-allowed", transition: "background 0.15s", display: "inline-flex", alignItems: "center", gap: "8px" }}
                onMouseEnter={e => { if (form.confirmed && form.refs.length > 0) (e.currentTarget as HTMLButtonElement).style.background = GREEN_DARK; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = form.confirmed && form.refs.length > 0 ? GREEN : "#c0c9c3"; }}
              >
                {t("submitScholar.footer.submit")} <Icon name="send" size={14} />
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default SubmitScholarPage;