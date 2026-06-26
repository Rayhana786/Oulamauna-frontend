import React, { useState, useRef } from "react";

/* ─────────────────────────────────────────────
   TYPES
───────────────────────────────────────────── */
type Language = "EN" | "AR" | "FR";

interface LangContent<T> {
  EN?: T;
  AR?: T;
  FR?: T;
}

interface Work {
  id: string;
  title: string;
  year: number;
  format: "BOOK" | "MANUSCRIPT" | "ARTICLE";
  digitalAccess?: "pdf" | "audio" | "file" | null;
  accessUrl?: string;
  accessFileName?: string;
  accessSource?: "upload" | "link";
}

interface MediaItem {
  id: string;
  type: "pdf" | "audio" | "video";
  title: string;
  description: string;
  meta: string;
  accessUrl?: string;
  accessSource?: "upload" | "link";
  accessFileName?: string;
}

interface LinkedPerson {
  id: string;
  initials: string;
  color: string;
  textColor: string;
  name: string;
  role: string;
  profileUrl?: string;
}

interface ReferenceItem {
  id: string;
  text: string;
}

interface RevisionEntry {
  author: string;
  date: string;
  description: string;
}

interface AtAGlance {
  fullName: string;
  aliases: string[];
  born: string;
  died: string;
  region: string;
  discipline: string[];
  expertise: string[];
  status: "active" | "draft" | "review";
}

interface EditableScholar {
  id: number;
  image: string;
  atAGlance: AtAGlance;
  name: LangContent<string>;
  subtitle: LangContent<string>;
  quote: LangContent<string>;
  overviewText: LangContent<string>;
  /* biography stored as a single string per language */
  body: LangContent<string>;
  works: Work[];
  media: MediaItem[];
  intellectualLineage: LinkedPerson[];
  notableDisciples: LinkedPerson[];
  academicReferences: ReferenceItem[];
  revisionHistory: RevisionEntry[];
  lastUpdatedBy: string;
  lastUpdatedDate: string;
}

/* ─────────────────────────────────────────────
   UI TRANSLATIONS
───────────────────────────────────────────── */
interface UIStrings {
  editing: string;
  basicInfo: string;
  fullName: string;
  aliases: string;
  born: string;
  died: string;
  region: string;
  discipline: string;
  expertise: string;
  status: string;
  statusActive: string;
  statusDraft: string;
  statusReview: string;
  narrativeContent: string;
  subtitle: string;
  quote: string;
  overview: string;
  improveAI: string;
  previewFormatting: string;
  biography: string;
  biographyHint: string;
  startTranslation: string;
  notStarted: string;
  academicContext: string;
  teachers: string;
  disciples: string;
  addPersonPlaceholder: string;
  bibliography: string;
  addWork: string;
  mediaLibrary: string;
  addMedia: string;
  references: string;
  addReference: string;
  revisionHistory: string;
  cancel: string;
  saveChanges: string;
  lastUpdated: string;
  unsavedChanges: string;
  saved: string;
}

const UI: Record<Language, UIStrings> = {
  EN: {
    editing: "EDITING ENGLISH VERSION",
    basicInfo: "Basic Information",
    fullName: "Full Name (as it appears in publications)",
    aliases: "Aliases / Alternative Spellings",
    born: "Birth Year", died: "Death Year", region: "Region",
    discipline: "Discipline & Fields", expertise: "Areas of Expertise",
    status: "Record Status", statusActive: "Active", statusDraft: "Draft", statusReview: "Under Review",
    narrativeContent: "Narrative Content", subtitle: "Subtitle / Honorific Title",
    quote: "Signature Quote", overview: "Overview", improveAI: "Improve with AI",
    previewFormatting: "Preview Formatting", biography: "Biography",
    biographyHint: "Use [[Scholar Name]] to link mentions to other profiles. Separate paragraphs with a blank line.",
    startTranslation: "Start English translation →", notStarted: "Not yet contributed in English.",
    academicContext: "Academic Context", teachers: "Primary Teachers / Intellectual Lineage",
    disciples: "Notable Disciples", addPersonPlaceholder: "Link a person from the archive…",
    bibliography: "Bibliography", addWork: "ADD WORK",
    mediaLibrary: "Integrated Media Library", addMedia: "ADD MEDIA",
    references: "Academic References", addReference: "ADD REFERENCE",
    revisionHistory: "Revision History", cancel: "Cancel", saveChanges: "Save Changes",
    lastUpdated: "Last updated by", unsavedChanges: "Unsaved changes", saved: "All changes saved",
  },
  AR: {
    editing: "تعديل النسخة العربية",
    basicInfo: "المعلومات الأساسية",
    fullName: "الاسم الكامل (كما يظهر في المنشورات)",
    aliases: "الألقاب / الصيغ البديلة",
    born: "سنة الميلاد", died: "سنة الوفاة", region: "المنطقة",
    discipline: "التخصصات والمجالات", expertise: "مجالات الخبرة",
    status: "حالة السجل", statusActive: "نشط", statusDraft: "مسودة", statusReview: "قيد المراجعة",
    narrativeContent: "المحتوى السردي", subtitle: "العنوان الفرعي / اللقب التشريفي",
    quote: "الاقتباس الرئيسي", overview: "نظرة عامة", improveAI: "تحسين بالذكاء الاصطناعي",
    previewFormatting: "معاينة التنسيق", biography: "السيرة الذاتية",
    biographyHint: "استخدم [[اسم العالم]] لربط الإشارات بملفات تعريف أخرى. افصل الفقرات بسطر فارغ.",
    startTranslation: "← بدء الترجمة العربية", notStarted: "لم تتم المساهمة في هذه الصفحة بعد باللغة العربية.",
    academicContext: "السياق الأكاديمي", teachers: "الأساتذة / السلسلة الفكرية",
    disciples: "أبرز التلامذة", addPersonPlaceholder: "ربط شخص من الأرشيف…",
    bibliography: "قائمة المؤلفات", addWork: "إضافة عمل",
    mediaLibrary: "مكتبة الوسائط المتكاملة", addMedia: "إضافة وسائط",
    references: "المراجع الأكاديمية", addReference: "إضافة مرجع",
    revisionHistory: "تاريخ المراجعات", cancel: "إلغاء", saveChanges: "حفظ التعديلات",
    lastUpdated: "آخر تحديث بواسطة", unsavedChanges: "تعديلات غير محفوظة", saved: "تم حفظ جميع التعديلات",
  },
  FR: {
    editing: "MODIFICATION DE LA VERSION FRANÇAISE",
    basicInfo: "Informations de base",
    fullName: "Nom complet (tel qu'il apparaît dans les publications)",
    aliases: "Alias / Orthographes alternatives",
    born: "Année de naissance", died: "Année de décès", region: "Région",
    discipline: "Discipline et domaines", expertise: "Domaines d'expertise",
    status: "Statut de la fiche", statusActive: "Actif", statusDraft: "Brouillon", statusReview: "En révision",
    narrativeContent: "Contenu narratif", subtitle: "Sous-titre / Titre honorifique",
    quote: "Citation signature", overview: "Aperçu", improveAI: "Améliorer avec l'IA",
    previewFormatting: "Aperçu de la mise en forme", biography: "Biographie",
    biographyHint: "Utilisez [[Nom du savant]] pour lier les mentions à d'autres profils. Séparez les paragraphes par une ligne vide.",
    startTranslation: "Démarrer la traduction française →", notStarted: "Cette page n'a pas encore été contribuée en français.",
    academicContext: "Contexte académique", teachers: "Professeurs / Lignée intellectuelle",
    disciples: "Disciples notables", addPersonPlaceholder: "Lier une personne depuis l'archive…",
    bibliography: "Bibliographie", addWork: "AJOUTER UNE ŒUVRE",
    mediaLibrary: "Médiathèque intégrée", addMedia: "AJOUTER UN MÉDIA",
    references: "Références académiques", addReference: "AJOUTER UNE RÉFÉRENCE",
    revisionHistory: "Historique des révisions", cancel: "Annuler", saveChanges: "Enregistrer",
    lastUpdated: "Mis à jour par", unsavedChanges: "Modifications non enregistrées", saved: "Toutes les modifications sont enregistrées",
  },
};

const LANG_LABELS: Record<Language, string> = { EN: "English", AR: "العربية", FR: "Français" };

/* ─────────────────────────────────────────────
   STYLE CONSTANTS
───────────────────────────────────────────── */
const MONO: React.CSSProperties = { fontFamily: "'JetBrains Mono', monospace" };
const SERIF: React.CSSProperties = { fontFamily: "'Source Serif 4', serif" };

const BTN_PRIMARY: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: "6px",
  padding: "6px 16px",
  border: "1.5px solid #0b4335", borderRadius: "6px",
  backgroundColor: "transparent", color: "#0b4335",
  fontSize: "10px", fontWeight: 700, letterSpacing: "0.1em", cursor: "pointer",
  transition: "background 0.15s, color 0.15s",
  ...MONO,
};

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "10px 14px",
  border: "1.5px solid rgba(192,201,195,0.6)", borderRadius: "8px",
  fontSize: "13px", color: "#191c1b", backgroundColor: "#fafbf8",
  fontFamily: "'Source Sans 3', sans-serif", outline: "none",
  transition: "border-color 0.15s", boxSizing: "border-box",
};

const labelStyle: React.CSSProperties = {
  ...MONO, fontSize: "9px", color: "#707974",
  letterSpacing: "0.12em", display: "block", marginBottom: "6px",
};

function focusBorder(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
  e.currentTarget.style.borderColor = "#0b4335";
}
function blurBorder(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
  e.currentTarget.style.borderColor = "rgba(192,201,195,0.6)";
}

/* ─────────────────────────────────────────────
   ID HELPER
───────────────────────────────────────────── */
let idCounter = 1000;
const uid = () => `id_${idCounter++}_${Math.random().toString(36).slice(2, 6)}`;

function initialsOf(name: string): string {
  return name.trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase();
}
const PERSON_PALETTE: [string, string][] = [
  ["#0b4335", "#fff"], ["#735c00", "#fff"], ["#5c2e29", "#fff"], ["#d9dad8", "#404945"],
];
function colorFor(seed: string): [string, string] {
  let h = 0;
  for (const ch of seed) h += ch.charCodeAt(0);
  return PERSON_PALETTE[h % PERSON_PALETTE.length];
}

/* helper: convert old string[] body to single string */
function joinBody(b: string | string[] | undefined): string {
  if (!b) return "";
  if (Array.isArray(b)) return b.join("\n\n");
  return b;
}

/* ─────────────────────────────────────────────
   MOCK INITIAL DATA
───────────────────────────────────────────── */
const INITIAL_SCHOLAR: EditableScholar = {
  id: 1,
  image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBYo9_bcR7fmJOfz7nDYlP7a3T1KpuJVFUT3Bn4kf9VHOSr9pj8KvDqtnmloDja-vHVNoPoXEaGQf8hjA3c6zJ8oR54lDyhMb6R6genD073t3jrAj-oxsGBWjICwWnjvI6jLyD89lpMYBy0f1aPL413vHWqaUSlV8Srdgn0umfRAsmCC_c3ZGwYzmcMI-mmNjU6R2PuQ02B-VbHshC_L6fcA5lH8Nrx85bBdxzWr6cbpn_9AhQ283C6SvlKAutkKIsqwuTMDYDeseMl",
  atAGlance: {
    fullName: "Malek Bennabi",
    aliases: ["Malik ibn al-Nabi", "Bennabi Al-Jazairi"],
    born: "1905", died: "1973", region: "North Africa",
    discipline: ["Social Sciences", "Philosophy"],
    expertise: ["Social Theory", "Philosophy of History"],
    status: "active",
  },
  name: { EN: "Malek Bennabi", AR: "مالك بن نبي" },
  subtitle: { EN: "Engineer, philosopher, theorist of civilization", AR: "مهندس، فيلسوف، منظّر الحضارة" },
  quote: {
    EN: "Civilization is the result of a vital spark… and it is the product of the interaction between three fundamental elements: Man, Soil, and Time.",
    AR: "الحضارة هي نتاج شرارة حيوية… وهي ثمرة التفاعل بين ثلاثة عناصر أساسية: الإنسان والتراب والوقت.",
  },
  overviewText: {
    EN: 'Malek Bennabi was one of the most prominent thinkers of the 20th century Algerian intellectual renaissance. An engineer by training and a philosopher by calling, he dedicated his life to analyzing the conditions of civilizational decline and rebirth, coining the influential concept of "colonizability."',
    AR: "كان مالك بن نبي من أبرز مفكري النهضة الفكرية الجزائرية في القرن العشرين. مهندس بالتكوين وفيلسوف بالدعوة، كرّس حياته لتحليل شروط الانحطاط الحضاري والنهوض.",
  },
  body: {
    EN: "Malek Bennabi was born in Constantine, Algeria, in 1905 during the height of French colonial occupation. Educated in both the traditional Algerian circles and later as an engineer in Paris, he developed a unique socio-philosophical lens that combined technical precision with historical depth.\n\nHis seminal contribution, the concept of \"colonizability\", argued that external colonization was only possible where internal psychological and social structures had already deteriorated.",
    AR: "وُلد مالك بن نبي في قسنطينة، الجزائر، عام 1905 في ذروة الاحتلال الاستعماري الفرنسي.",
  },
  works: [
    { id: uid(), title: "The Quranic Phenomenon", year: 1946, format: "BOOK", digitalAccess: "pdf" },
    { id: uid(), title: "Conditions of the Renaissance", year: 1948, format: "BOOK", digitalAccess: "audio" },
    { id: uid(), title: "The Problem of Ideas in the Muslim World", year: 1970, format: "MANUSCRIPT", digitalAccess: null },
  ],
  media: [
    { id: uid(), type: "pdf", title: "The Quranic Phenomenon", description: "Full text including original foreword by Mahmoud Shaker and Sayyid Qutb.", meta: "PDF • 2.4 MB" },
    { id: uid(), type: "audio", title: "1968 Cairo Lecture", description: "Historic seminar on civilizational crisis recorded at Al-Azhar University.", meta: "Audio • 45:00" },
  ],
  intellectualLineage: [
    { id: uid(), initials: "AB", color: "#0b4335", textColor: "#fff", name: "Ben Badis", role: "Teacher" },
    { id: uid(), initials: "IK", color: "#d9dad8", textColor: "#404945", name: "Ibn Khaldun", role: "Historical Influence" },
  ],
  notableDisciples: [
    { id: uid(), initials: "AM", color: "#735c00", textColor: "#fff", name: "El-Messiri", role: "Egypt / Modernity" },
  ],
  academicReferences: [
    { id: uid(), text: "Bennabi, M. (1948). Les Conditions de la Renaissance. Alger: Éditions de la Renaissance d'Algérie." },
    { id: uid(), text: "Naylor, P. C. (2000). France and Algeria: A History of Decolonization and Transformation. Univ. Press of Florida." },
  ],
  revisionHistory: [
    { author: "Fatima Zahra", date: "June 12, 2026", description: "Corrected death date and expanded bibliography" },
    { author: "Ahmed Benali", date: "March 1, 2026", description: "Initial profile creation" },
  ],
  lastUpdatedBy: "Fatima Zahra",
  lastUpdatedDate: "June 12, 2026",
};

/* ─────────────────────────────────────────────
   SMALL REUSABLE COMPONENTS
───────────────────────────────────────────── */
function Icon({ name, size = 20 }: { name: string; size?: number }) {
  return (
    <span className="material-symbols-outlined" style={{ fontSize: `${size}px`, lineHeight: 1, userSelect: "none" }}>
      {name}
    </span>
  );
}

function HoverBtn({ children, onClick, style, disabled }: { children: React.ReactNode; onClick?: () => void; style?: React.CSSProperties; disabled?: boolean }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        ...BTN_PRIMARY,
        backgroundColor: hov && !disabled ? "#0b4335" : "transparent",
        color: hov && !disabled ? "#fff" : "#0b4335",
        opacity: disabled ? 0.5 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
        ...style,
      }}
    >
      {children}
    </button>
  );
}

function IconBtn({ name, onClick, danger, title }: { name: string; onClick?: () => void; danger?: boolean; title?: string }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      title={title}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        width: "28px", height: "28px", borderRadius: "6px",
        display: "flex", alignItems: "center", justifyContent: "center",
        backgroundColor: hov ? (danger ? "rgba(179,38,30,0.1)" : "rgba(11,67,53,0.08)") : "transparent",
        color: hov ? (danger ? "#b3261e" : "#0b4335") : "#707974",
        border: "none", cursor: "pointer", transition: "all 0.15s", flexShrink: 0,
      }}
    >
      <Icon name={name} size={15} />
    </button>
  );
}

function SharedBanner({ note }: { note: string }) {
  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: "6px",
      marginBottom: "20px", padding: "5px 12px",
      backgroundColor: "rgba(11,67,53,0.05)",
      border: "1px solid rgba(11,67,53,0.12)",
      borderRadius: "6px",
    }}>
      <Icon name="public" size={13} />
      <span style={{ ...MONO, fontSize: "9px", color: "#707974", letterSpacing: "0.1em" }}>{note}</span>
    </div>
  );
}

function SectionCard({ icon, eyebrow, title, action, children }: {
  icon: string; eyebrow: string; title: string; action?: React.ReactNode; children: React.ReactNode;
}) {
  return (
    <section style={{
      backgroundColor: "#fff", border: "1.5px solid rgba(192,201,195,0.4)",
      borderRadius: "16px", padding: "32px", marginBottom: "28px",
      /* prevent section from overflowing its column */
      minWidth: 0, overflow: "hidden",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px", gap: "16px", flexWrap: "wrap" }}>
        <div style={{ minWidth: 0 }}>
          <p style={{ ...MONO, fontSize: "9px", color: "#0b4335", letterSpacing: "0.2em", marginBottom: "10px", display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ width: "16px", height: "1px", backgroundColor: "#0b4335", display: "inline-block", flexShrink: 0 }} />
            {eyebrow}
          </p>
          <h2 style={{ ...SERIF, fontSize: "20px", fontWeight: 700, color: "#191c1b", margin: 0, display: "flex", alignItems: "center", gap: "10px" }}>
            <Icon name={icon} size={20} />{title}
          </h2>
        </div>
        {action && <div style={{ flexShrink: 0 }}>{action}</div>}
      </div>
      <div style={{ marginTop: "20px" }}>{children}</div>
    </section>
  );
}

function TagInput({ tags, onChange, placeholder }: { tags: string[]; onChange: (t: string[]) => void; placeholder?: string }) {
  const [val, setVal] = useState("");
  const add = () => {
    if (!val.trim()) return;
    onChange([...tags, val.trim()]);
    setVal("");
  };
  return (
    <div style={{
      display: "flex", flexWrap: "wrap", gap: "6px", padding: "9px 10px",
      border: "1.5px solid rgba(192,201,195,0.6)", borderRadius: "8px", backgroundColor: "#fafbf8",
    }}>
      {tags.map((tag, i) => (
        <span key={i} style={{
          display: "flex", alignItems: "center", gap: "4px",
          backgroundColor: "rgba(11,67,53,0.08)", color: "#0b4335",
          fontSize: "11px", fontWeight: 600, padding: "3px 6px 3px 10px", borderRadius: "999px",
        }}>
          {tag}
          <button onClick={() => onChange(tags.filter((_, idx) => idx !== i))} style={{ background: "none", border: "none", cursor: "pointer", color: "#0b4335", display: "flex" }}>
            <Icon name="close" size={12} />
          </button>
        </span>
      ))}
      <input
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
        onBlur={add}
        placeholder={placeholder ?? "Type and press Enter…"}
        style={{ flex: 1, minWidth: "120px", border: "none", outline: "none", fontSize: "12px", backgroundColor: "transparent", padding: "3px 4px" }}
      />
    </div>
  );
}

/* ─────────────────────────────────────────────
   FILE UTILS
───────────────────────────────────────────── */
function getFileIcon(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  if (["mp3", "wav", "ogg", "m4a"].includes(ext)) return "graphic_eq";
  if (["mp4", "webm", "avi", "mov"].includes(ext)) return "movie";
  if (["epub"].includes(ext)) return "menu_book";
  if (["doc", "docx"].includes(ext)) return "description";
  return "article";
}
function getAccessType(filename: string): Work["digitalAccess"] {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  if (["mp3", "wav", "ogg", "m4a"].includes(ext)) return "audio";
  if (["mp4", "webm", "avi", "mov"].includes(ext)) return "file";
  return "pdf";
}

interface UploadZoneProps {
  file: File | null;
  existingName?: string;
  onFile: (f: File) => void;
  onRemove: () => void;
  accept?: string;
  hint?: string;
}
function UploadZone({ file, existingName, onFile, onRemove, accept, hint }: UploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) onFile(f);
  };

  const displayName = file?.name ?? existingName;

  if (displayName) {
    return (
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "12px 16px", backgroundColor: "rgba(11,67,53,0.05)",
        border: "1.5px solid rgba(11,67,53,0.2)", borderRadius: "8px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
          <Icon name={getFileIcon(displayName)} size={20} />
          <span style={{ fontSize: "13px", color: "#191c1b", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {displayName}
          </span>
          {file && <span style={{ ...MONO, fontSize: "9px", color: "#707974", whiteSpace: "nowrap" }}>{(file.size / 1024 / 1024).toFixed(1)} MB</span>}
        </div>
        <button onClick={onRemove} style={{ background: "none", border: "none", cursor: "pointer", color: "#707974", flexShrink: 0, display: "flex" }} title="Remove file">
          <Icon name="close" size={16} />
        </button>
      </div>
    );
  }

  return (
    <>
      <input ref={inputRef} type="file" accept={accept} style={{ display: "none" }}
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); }} />
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        style={{
          border: `2px dashed ${dragOver ? "#0b4335" : "rgba(192,201,195,0.7)"}`,
          borderRadius: "10px", padding: "28px 20px", textAlign: "center", cursor: "pointer",
          backgroundColor: dragOver ? "rgba(11,67,53,0.04)" : "#fafbf8", transition: "all 0.15s",
        }}
      >
        <Icon name="cloud_upload" size={32} />
        <p style={{ fontSize: "13px", color: "#404945", margin: "10px 0 4px", fontWeight: 600 }}>
          Drop a file here, or <span style={{ color: "#0b4335", textDecoration: "underline" }}>browse</span>
        </p>
        <p style={{ ...MONO, fontSize: "9px", color: "#c0c9c3", margin: 0 }}>{hint ?? "PDF, Audio, Video, ePub, Word — up to 50 MB"}</p>
      </div>
    </>
  );
}

/* ─────────────────────────────────────────────
   MODAL SHELL
───────────────────────────────────────────── */
type AccessMode = "none" | "upload" | "link";

function modeTabStyle(active: boolean): React.CSSProperties {
  return {
    flex: 1, padding: "9px 0", textAlign: "center" as const,
    ...MONO, fontSize: "10px", fontWeight: 700, letterSpacing: "0.08em",
    border: "1.5px solid",
    borderColor: active ? "#0b4335" : "rgba(192,201,195,0.5)",
    backgroundColor: active ? "#0b4335" : "transparent",
    color: active ? "#fff" : "#707974",
    cursor: "pointer", transition: "all 0.15s",
    display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
  };
}

function ModalShell({ title, icon, onClose, children, footer }: {
  title: string; icon: string; onClose: () => void; children: React.ReactNode; footer: React.ReactNode;
}) {
  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 200,
        backgroundColor: "rgba(25,28,27,0.45)", backdropFilter: "blur(4px)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        backgroundColor: "#fff", borderRadius: "16px", padding: "36px",
        width: "520px", maxWidth: "calc(100vw - 32px)",
        boxShadow: "0 20px 60px rgba(0,0,0,0.18)", border: "1px solid rgba(192,201,195,0.3)",
        maxHeight: "90vh", overflowY: "auto",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px" }}>
          <h2 style={{ ...SERIF, fontSize: "20px", fontWeight: 700, color: "#0b4335", margin: 0, display: "flex", alignItems: "center", gap: "10px" }}>
            <Icon name={icon} size={20} />{title}
          </h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#707974", padding: "4px", borderRadius: "50%", display: "flex" }}>
            <Icon name="close" size={20} />
          </button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>{children}</div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "32px", paddingTop: "24px", borderTop: "1px solid rgba(192,201,195,0.3)" }}>
          {footer}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   WORK MODAL
───────────────────────────────────────────── */
function WorkModal({ initial, onClose, onSave }: { initial: Work | null; onClose: () => void; onSave: (w: Work) => void }) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [year, setYear] = useState<string>(initial ? String(initial.year) : "");
  const [format, setFormat] = useState<Work["format"]>(initial?.format ?? "BOOK");
  const [accessMode, setAccessMode] = useState<AccessMode>(initial?.accessUrl ? (initial.accessSource ?? "link") : "none");
  const [linkUrl, setLinkUrl] = useState(initial?.accessSource === "link" ? (initial.accessUrl ?? "") : "");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [error, setError] = useState("");

  const handleSubmit = () => {
    if (!title.trim()) { setError("Title is required."); return; }
    const yr = parseInt(year, 10);
    if (!year || isNaN(yr) || yr < 600 || yr > new Date().getFullYear()) { setError("Please enter a valid year."); return; }
    if (accessMode === "link" && !linkUrl.trim()) { setError("Please enter a URL or switch to No Access."); return; }
    if (accessMode === "upload" && !uploadedFile && !initial?.accessFileName) { setError("Please upload a file or switch to No Access."); return; }

    let accessUrl: string | undefined;
    let accessFileName: string | undefined;
    let accessSource: Work["accessSource"];
    let digitalAccess: Work["digitalAccess"] = null;

    if (accessMode === "link") {
      accessUrl = linkUrl.trim(); accessSource = "link";
      const ext = accessUrl.split(".").pop()?.toLowerCase() ?? "";
      digitalAccess = ["mp3", "wav", "ogg", "m4a"].includes(ext) ? "audio" : "pdf";
    } else if (accessMode === "upload") {
      if (uploadedFile) {
        accessUrl = URL.createObjectURL(uploadedFile);
        accessFileName = uploadedFile.name;
        digitalAccess = getAccessType(uploadedFile.name);
      } else {
        accessUrl = initial?.accessUrl; accessFileName = initial?.accessFileName;
        digitalAccess = initial?.digitalAccess ?? "pdf";
      }
      accessSource = "upload";
    }

    onSave({ id: initial?.id ?? uid(), title: title.trim(), year: yr, format, digitalAccess, accessUrl, accessFileName, accessSource });
  };

  return (
    <ModalShell
      title={initial ? "Edit Work" : "Add New Work"}
      icon={initial ? "edit_note" : "add_circle"}
      onClose={onClose}
      footer={<>
        <HoverBtn onClick={onClose} style={{ borderColor: "#c0c9c3", color: "#707974" }}>Cancel</HoverBtn>
        <button onClick={handleSubmit} style={{ ...BTN_PRIMARY, backgroundColor: "#0b4335", color: "#fff", padding: "8px 20px", fontSize: "11px" }}>
          <Icon name="check" size={14} />{initial ? "SAVE CHANGES" : "ADD WORK"}
        </button>
      </>}
    >
      <div>
        <label style={labelStyle}>TITLE *</label>
        <input type="text" value={title} onChange={(e) => { setTitle(e.target.value); setError(""); }}
          placeholder="e.g. The Problem of Culture" style={inputStyle} onFocus={focusBorder} onBlur={blurBorder} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
        <div>
          <label style={labelStyle}>YEAR *</label>
          <input type="number" value={year} onChange={(e) => { setYear(e.target.value); setError(""); }}
            placeholder="e.g. 1959" min={600} max={new Date().getFullYear()} style={inputStyle} onFocus={focusBorder} onBlur={blurBorder} />
        </div>
        <div>
          <label style={labelStyle}>FORMAT</label>
          <select value={format} onChange={(e) => setFormat(e.target.value as Work["format"])} style={{ ...inputStyle, cursor: "pointer" }} onFocus={focusBorder} onBlur={blurBorder}>
            <option value="BOOK">Book</option>
            <option value="MANUSCRIPT">Manuscript</option>
            <option value="ARTICLE">Article</option>
          </select>
        </div>
      </div>
      <div>
        <label style={labelStyle}>DIGITAL ACCESS</label>
        <div style={{ display: "flex", borderRadius: "8px", overflow: "hidden", border: "1.5px solid rgba(192,201,195,0.5)", marginBottom: "16px" }}>
          <button style={modeTabStyle(accessMode === "none")} onClick={() => { setAccessMode("none"); setError(""); }}><Icon name="block" size={13} /> None</button>
          <button style={{ ...modeTabStyle(accessMode === "upload"), borderLeft: "1px solid rgba(192,201,195,0.5)", borderRight: "1px solid rgba(192,201,195,0.5)" }} onClick={() => { setAccessMode("upload"); setError(""); }}><Icon name="upload_file" size={13} /> Upload</button>
          <button style={modeTabStyle(accessMode === "link")} onClick={() => { setAccessMode("link"); setError(""); }}><Icon name="link" size={13} /> Link</button>
        </div>
        {accessMode === "upload" && (
          <UploadZone file={uploadedFile} existingName={initial?.accessFileName} onFile={(f) => { setUploadedFile(f); setError(""); }} onRemove={() => setUploadedFile(null)}
            accept=".pdf,.mp3,.wav,.ogg,.m4a,.mp4,.webm,.epub,.doc,.docx,application/pdf,audio/*,video/*"
            hint="PDF, Audio (MP3/WAV), Video, ePub, Word — up to 50 MB" />
        )}
        {accessMode === "link" && (
          <div style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#c0c9c3", display: "flex" }}><Icon name="link" size={16} /></span>
            <input type="url" value={linkUrl} onChange={(e) => { setLinkUrl(e.target.value); setError(""); }} placeholder="https://archive.org/details/…"
              style={{ ...inputStyle, paddingLeft: "36px" }} onFocus={focusBorder} onBlur={blurBorder} />
          </div>
        )}
        {accessMode === "none" && <p style={{ fontSize: "12px", color: "#c0c9c3", fontStyle: "italic", margin: 0 }}>No digital file attached. Shown as "—" in the bibliography.</p>}
      </div>
      {error && <p style={{ ...MONO, fontSize: "10px", color: "#b3261e", margin: 0, display: "flex", alignItems: "center", gap: "6px" }}><Icon name="error" size={13} /> {error}</p>}
    </ModalShell>
  );
}

/* ─────────────────────────────────────────────
   MEDIA MODAL
───────────────────────────────────────────── */
function MediaModal({ initial, onClose, onSave }: { initial: MediaItem | null; onClose: () => void; onSave: (m: MediaItem) => void }) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [desc, setDesc] = useState(initial?.description ?? "");
  const [accessMode, setAccessMode] = useState<AccessMode>(initial?.accessUrl ? (initial.accessSource ?? "link") : "none");
  const [linkUrl, setLinkUrl] = useState(initial?.accessSource === "link" ? (initial.accessUrl ?? "") : "");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [error, setError] = useState("");

  const handleSubmit = () => {
    if (!title.trim()) { setError("Title is required."); return; }
    if (accessMode === "link" && !linkUrl.trim()) { setError("Please enter a URL."); return; }
    if (accessMode === "upload" && !uploadedFile && !initial?.accessFileName) { setError("Please upload a file."); return; }

    let type: MediaItem["type"] = "pdf";
    let meta = "File";
    let accessUrl: string | undefined;
    let accessSource: MediaItem["accessSource"];
    let accessFileName: string | undefined;

    if (accessMode === "upload") {
      if (uploadedFile) {
        const ext = uploadedFile.name.split(".").pop()?.toLowerCase() ?? "";
        accessUrl = URL.createObjectURL(uploadedFile);
        accessFileName = uploadedFile.name;
        meta = `${(uploadedFile.size / 1024 / 1024).toFixed(1)} MB`;
        if (["mp3", "wav", "ogg", "m4a"].includes(ext)) { type = "audio"; meta = `Audio • ${meta}`; }
        else if (["mp4", "webm", "avi", "mov"].includes(ext)) { type = "video"; meta = `Video • ${meta}`; }
        else { meta = `PDF • ${meta}`; }
      } else {
        accessUrl = initial?.accessUrl; accessFileName = initial?.accessFileName;
        type = initial?.type ?? "pdf"; meta = initial?.meta ?? "File";
      }
      accessSource = "upload";
    } else if (accessMode === "link") {
      accessUrl = linkUrl.trim(); accessSource = "link";
      const ext = accessUrl.split(".").pop()?.toLowerCase() ?? "";
      if (["mp3", "wav", "ogg", "m4a"].includes(ext)) { type = "audio"; meta = "Audio"; }
      else if (["mp4", "webm"].includes(ext) || accessUrl.includes("youtube") || accessUrl.includes("vimeo")) { type = "video"; meta = "Video"; }
      else { meta = "PDF"; }
    }

    onSave({ id: initial?.id ?? uid(), type, title: title.trim(), description: desc.trim() || "No description.", meta, accessUrl, accessSource, accessFileName });
  };

  return (
    <ModalShell
      title={initial ? "Edit Media" : "Add Media"}
      icon={initial ? "edit_note" : "add_circle"}
      onClose={onClose}
      footer={<>
        <HoverBtn onClick={onClose} style={{ borderColor: "#c0c9c3", color: "#707974" }}>Cancel</HoverBtn>
        <button onClick={handleSubmit} style={{ ...BTN_PRIMARY, backgroundColor: "#0b4335", color: "#fff", padding: "8px 20px", fontSize: "11px" }}>
          <Icon name="check" size={14} />{initial ? "SAVE CHANGES" : "ADD MEDIA"}
        </button>
      </>}
    >
      <div>
        <label style={labelStyle}>TITLE *</label>
        <input type="text" value={title} onChange={(e) => { setTitle(e.target.value); setError(""); }}
          placeholder="e.g. 1972 Lecture on Colonizability" style={inputStyle} onFocus={focusBorder} onBlur={blurBorder} />
      </div>
      <div>
        <label style={labelStyle}>DESCRIPTION</label>
        <textarea value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Brief description of this media item" rows={2}
          style={{ ...inputStyle, resize: "vertical" }} onFocus={focusBorder} onBlur={blurBorder} />
      </div>
      <div>
        <label style={labelStyle}>FILE / LINK</label>
        <div style={{ display: "flex", borderRadius: "8px", overflow: "hidden", border: "1.5px solid rgba(192,201,195,0.5)", marginBottom: "16px" }}>
          <button style={modeTabStyle(accessMode === "none")} onClick={() => { setAccessMode("none"); setError(""); }}><Icon name="block" size={13} /> None</button>
          <button style={{ ...modeTabStyle(accessMode === "upload"), borderLeft: "1px solid rgba(192,201,195,0.5)", borderRight: "1px solid rgba(192,201,195,0.5)" }} onClick={() => { setAccessMode("upload"); setError(""); }}><Icon name="upload_file" size={13} /> Upload</button>
          <button style={modeTabStyle(accessMode === "link")} onClick={() => { setAccessMode("link"); setError(""); }}><Icon name="link" size={13} /> Link</button>
        </div>
        {accessMode === "upload" && (
          <UploadZone file={uploadedFile} existingName={initial?.accessFileName} onFile={(f) => { setUploadedFile(f); setError(""); }} onRemove={() => setUploadedFile(null)}
            accept=".pdf,.mp3,.wav,.ogg,.m4a,.mp4,.webm,.avi,audio/*,video/*,application/pdf"
            hint="PDF, Audio (MP3/WAV), Video (MP4/WebM) — up to 100 MB" />
        )}
        {accessMode === "link" && (
          <div style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#c0c9c3", display: "flex" }}><Icon name="link" size={16} /></span>
            <input type="url" value={linkUrl} onChange={(e) => { setLinkUrl(e.target.value); setError(""); }} placeholder="https://youtube.com/watch?v=… or direct file URL"
              style={{ ...inputStyle, paddingLeft: "36px" }} onFocus={focusBorder} onBlur={blurBorder} />
          </div>
        )}
        {accessMode === "none" && <p style={{ fontSize: "12px", color: "#c0c9c3", fontStyle: "italic", margin: 0 }}>No file attached. Scholars still see title and description.</p>}
      </div>
      {error && <p style={{ ...MONO, fontSize: "10px", color: "#b3261e", margin: 0, display: "flex", alignItems: "center", gap: "6px" }}><Icon name="error" size={13} /> {error}</p>}
    </ModalShell>
  );
}

/* ─────────────────────────────────────────────
   LINKED PEOPLE EDITOR
───────────────────────────────────────────── */
function LinkedPeopleEditor({ people, onChange, placeholder }: { people: LinkedPerson[]; onChange: (p: LinkedPerson[]) => void; placeholder: string }) {
  const [val, setVal] = useState("");
  const add = () => {
    if (!val.trim()) return;
    const [color, textColor] = colorFor(val);
    onChange([...people, { id: uid(), initials: initialsOf(val), color, textColor, name: val.trim(), role: "" }]);
    setVal("");
  };
  return (
    <div>
      {people.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "12px" }}>
          {people.map((p, i) => (
            <div key={p.id} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 10px", border: "1px solid rgba(192,201,195,0.4)", borderRadius: "8px", backgroundColor: "#fafbf8", minWidth: 0 }}>
              <div style={{ width: 32, height: 32, borderRadius: "50%", backgroundColor: p.color, color: p.textColor, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                {p.initials}
              </div>
              <input value={p.name} onChange={(e) => { const next = [...people]; next[i] = { ...p, name: e.target.value, initials: initialsOf(e.target.value || p.name) }; onChange(next); }}
                style={{ flex: 1, border: "none", outline: "none", fontSize: 13, fontWeight: 600, backgroundColor: "transparent", minWidth: 0 }} />
              <input value={p.role} onChange={(e) => { const next = [...people]; next[i] = { ...p, role: e.target.value }; onChange(next); }}
                placeholder="Role" style={{ flex: 1, border: "none", outline: "none", fontSize: 11, color: "#707974", backgroundColor: "transparent", ...MONO, minWidth: 0 }} />
              <IconBtn name="close" danger onClick={() => onChange(people.filter((_, idx) => idx !== i))} title="Remove" />
            </div>
          ))}
        </div>
      )}
      <div style={{ position: "relative" }}>
        <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#c0c9c3", display: "flex" }}><Icon name="search" size={15} /></span>
        <input value={val} onChange={(e) => setVal(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
          placeholder={placeholder} style={{ width: "100%", padding: "9px 12px 9px 36px", border: "1.5px solid rgba(192,201,195,0.6)", borderRadius: 8, fontSize: 12, backgroundColor: "#fafbf8", outline: "none", boxSizing: "border-box" }}
          onFocus={focusBorder} onBlur={blurBorder} />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   PROPS — accept initial language from outside
   (e.g. <EditScholarPage initialLang="AR" />)
───────────────────────────────────────────── */
interface EditScholarPageProps {
  initialLang?: Language;
}

/* ─────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────── */
const EditScholarPage: React.FC<EditScholarPageProps> = ({ initialLang = "EN" }) => {
  const [scholar, setScholar] = useState<EditableScholar>(() => ({
    ...INITIAL_SCHOLAR,
    /* normalise body: if source data had string[] convert to string */
    body: {
      EN: joinBody((INITIAL_SCHOLAR.body as any).EN),
      AR: joinBody((INITIAL_SCHOLAR.body as any).AR),
      FR: joinBody((INITIAL_SCHOLAR.body as any).FR),
    },
  }));
  const [activeLang, setActiveLang] = useState<Language>(initialLang);
  const [dirty, setDirty] = useState(false);
  const [portraitFile, setPortraitFile] = useState<File | null>(null);

  const [workModal, setWorkModal] = useState<{ open: boolean; index: number | null }>({ open: false, index: null });
  const [mediaModal, setMediaModal] = useState<{ open: boolean; index: number | null }>({ open: false, index: null });

  const t = UI[activeLang];
  const isRTL = activeLang === "AR";

  const mark = () => setDirty(true);

  function setLangField<K extends "name" | "subtitle" | "quote" | "overviewText" | "body">(field: K, value: string) {
    setScholar((prev) => ({ ...prev, [field]: { ...prev[field], [activeLang]: value } }));
    mark();
  }

  function startTranslation() {
    setScholar((prev) => ({
      ...prev,
      name: { ...prev.name, [activeLang]: prev.atAGlance.fullName },
      subtitle: { ...prev.subtitle, [activeLang]: "" },
      quote: { ...prev.quote, [activeLang]: "" },
      overviewText: { ...prev.overviewText, [activeLang]: "" },
      body: { ...prev.body, [activeLang]: "" },
    }));
    mark();
  }

  function updateAtAGlance<K extends keyof AtAGlance>(key: K, value: AtAGlance[K]) {
    setScholar((prev) => ({ ...prev, atAGlance: { ...prev.atAGlance, [key]: value } }));
    mark();
  }

  function saveWork(w: Work) {
    setScholar((prev) => {
      const next = [...prev.works];
      if (workModal.index !== null) next[workModal.index] = w; else next.push(w);
      return { ...prev, works: next };
    });
    setWorkModal({ open: false, index: null });
    mark();
  }
  function deleteWork(i: number) {
    if (!window.confirm("Remove this work? This cannot be undone.")) return;
    setScholar((prev) => ({ ...prev, works: prev.works.filter((_, idx) => idx !== i) }));
    mark();
  }

  function saveMedia(m: MediaItem) {
    setScholar((prev) => {
      const next = [...prev.media];
      if (mediaModal.index !== null) next[mediaModal.index] = m; else next.push(m);
      return { ...prev, media: next };
    });
    setMediaModal({ open: false, index: null });
    mark();
  }
  function deleteMedia(i: number) {
    if (!window.confirm("Remove this media item? This cannot be undone.")) return;
    setScholar((prev) => ({ ...prev, media: prev.media.filter((_, idx) => idx !== i) }));
    mark();
  }

  function addReference() {
    setScholar((prev) => ({ ...prev, academicReferences: [...prev.academicReferences, { id: uid(), text: "" }] }));
    mark();
  }
  function updateReference(i: number, text: string) {
    setScholar((prev) => {
      const next = [...prev.academicReferences]; next[i] = { ...next[i], text };
      return { ...prev, academicReferences: next };
    });
    mark();
  }
  function removeReference(i: number) {
    setScholar((prev) => ({ ...prev, academicReferences: prev.academicReferences.filter((_, idx) => idx !== i) }));
    mark();
  }

  function handleSave() {
    console.info("Saving scholar:", scholar);
    setDirty(false);
  }

  return (
    <div dir={isRTL ? "rtl" : "ltr"} style={{
      fontFamily: "'Source Sans 3', sans-serif", minHeight: "100vh",
      backgroundColor: "#f9faf7",
      backgroundImage: "radial-gradient(#e1e3e0 0.5px, transparent 0.5px)",
      backgroundSize: "24px 24px", color: "#191c1b",
      /* prevent any horizontal overflow at root */
      overflowX: "hidden",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Source+Serif+4:ital,opsz,wght@0,8..60,200..900;1,8..60,200..900&family=Source+Sans+3:ital,wght@0,200..900;1,200..900&family=JetBrains+Mono:ital,wght@0,100..800;1,100..800&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap');
        .material-symbols-outlined { font-variation-settings:'FILL' 0,'wght' 400,'GRAD' 0,'opsz' 24; font-family:'Material Symbols Outlined'; display:inline-block; vertical-align:middle; }
        * { box-sizing: border-box; }
        button { font-family: inherit; }
        textarea { font-family: inherit; }
        /* prevent any child from blowing out horizontal width */
        html, body { overflow-x: hidden; }
      `}</style>

      {workModal.open && (
        <WorkModal
          initial={workModal.index !== null ? scholar.works[workModal.index] : null}
          onClose={() => setWorkModal({ open: false, index: null })}
          onSave={saveWork}
        />
      )}
      {mediaModal.open && (
        <MediaModal
          initial={mediaModal.index !== null ? scholar.media[mediaModal.index] : null}
          onClose={() => setMediaModal({ open: false, index: null })}
          onSave={saveMedia}
        />
      )}

      {/* ════ HEADER ════ */}
      <header style={{
        position: "sticky", top: 0, zIndex: 50,
        backgroundColor: "rgba(249,250,247,0.97)", backdropFilter: "blur(8px)",
        borderBottom: "1px solid rgba(192,201,195,0.3)", padding: "16px 0",
      }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 32px" }}>
          <div style={{ ...MONO, fontSize: "11px", color: "#707974", letterSpacing: "0.05em", marginBottom: "8px" }}>
            <span>Home</span> {" > "} <span>Scholars</span> {" > "}
            <span>{scholar.atAGlance.fullName}</span> {" > "}
            <span style={{ color: "#0b4335", fontWeight: 700 }}>Edit</span>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
            <div style={{ minWidth: 0 }}>
              <h1 style={{ ...SERIF, fontSize: "24px", fontWeight: 700, color: "#0b4335", margin: "0 0 4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {scholar.name[activeLang] || scholar.atAGlance.fullName}
              </h1>
              <p style={{ ...MONO, fontSize: "10px", color: "#0b4335", letterSpacing: "0.15em", margin: 0, fontWeight: 700 }}>{t.editing}</p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
              <span style={{ ...MONO, fontSize: "9px", letterSpacing: "0.08em", color: dirty ? "#735c00" : "#0b4335", display: "flex", alignItems: "center", gap: "4px" }}>
                <Icon name={dirty ? "edit" : "check_circle"} size={13} />
                {dirty ? t.unsavedChanges : t.saved}
              </span>
              <HoverBtn style={{ borderColor: "#c0c9c3", color: "#707974" }}>{t.cancel}</HoverBtn>
              <button onClick={handleSave} style={{ ...BTN_PRIMARY, backgroundColor: "#0b4335", color: "#fff", padding: "8px 20px" }}>
                <Icon name="save" size={14} />{t.saveChanges}
              </button>
            </div>
          </div>

          {/* Language tabs */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "16px", paddingTop: "12px", borderTop: "1px solid rgba(192,201,195,0.2)", flexWrap: "wrap", gap: "8px" }}>
            <div style={{ display: "flex", gap: "4px", padding: "4px 8px", backgroundColor: "rgba(11,67,53,0.04)", border: "1px solid rgba(11,67,53,0.1)", borderRadius: "999px" }}>
              {(["AR", "EN", "FR"] as Language[]).map((l) => {
                const active = activeLang === l;
                const hasContent = !!scholar.name[l];
                return (
                  <button key={l} onClick={() => setActiveLang(l)} style={{
                    ...MONO, fontSize: "10px", fontWeight: 700, letterSpacing: "0.08em",
                    padding: "4px 12px", borderRadius: "999px", border: "1px solid",
                    borderColor: active ? "#0b4335" : "rgba(192,201,195,0.5)",
                    backgroundColor: active ? "#0b4335" : "transparent",
                    color: active ? "#fff" : hasContent ? "#707974" : "#c0c9c3",
                    cursor: "pointer", transition: "all 0.15s",
                    display: "flex", alignItems: "center", gap: "5px",
                  }}>
                    {l === "AR" ? "ARABIC" : l === "EN" ? "ENGLISH" : "FRENCH"}
                    {!hasContent && <Icon name="circle" size={6} />}
                  </button>
                );
              })}
            </div>
            <span style={{ ...MONO, fontSize: "9px", color: "#c0c9c3", letterSpacing: "0.06em", flexShrink: 0 }}>
              {t.lastUpdated} {scholar.lastUpdatedBy} • {scholar.lastUpdatedDate}
            </span>
          </div>
        </div>
      </header>

      {/* ════ MAIN ════ */}
      <main style={{ maxWidth: "1280px", margin: "0 auto", padding: "40px 32px 80px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: "32px", alignItems: "start" }}>

          {/* LEFT SIDEBAR */}
          <aside style={{ minWidth: 0 }}>
            <div style={{ position: "sticky", top: "180px", display: "flex", flexDirection: "column", gap: "20px" }}>

              {/* Portrait */}
              <div style={{ backgroundColor: "#fff", border: "1px solid rgba(192,201,195,0.4)", borderRadius: "12px", padding: "20px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
                <label style={labelStyle}>PORTRAIT</label>
                <div style={{ marginBottom: "16px", borderRadius: "8px", overflow: "hidden", aspectRatio: "3/4" }}>
                  <img alt="Scholar portrait" src={portraitFile ? URL.createObjectURL(portraitFile) : scholar.image}
                    style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                </div>
                <UploadZone file={portraitFile} onFile={(f) => { setPortraitFile(f); mark(); }} onRemove={() => { setPortraitFile(null); mark(); }}
                  accept="image/*" hint="JPG or PNG — at least 800×1000px" />
              </div>

              {/* Basic info */}
              <div style={{ backgroundColor: "#fff", border: "1px solid rgba(192,201,195,0.4)", borderRadius: "12px", padding: "20px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
                <p style={{ ...MONO, fontSize: "9px", color: "#0b4335", letterSpacing: "0.2em", marginBottom: "16px", borderBottom: "1px solid rgba(11,67,53,0.1)", paddingBottom: "8px" }}>{t.basicInfo}</p>

                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <div>
                    <label style={labelStyle}>{t.status}</label>
                    <select value={scholar.atAGlance.status} onChange={(e) => updateAtAGlance("status", e.target.value as AtAGlance["status"])}
                      style={{ ...inputStyle, cursor: "pointer" }} onFocus={focusBorder} onBlur={blurBorder}>
                      <option value="active">● {t.statusActive}</option>
                      <option value="draft">● {t.statusDraft}</option>
                      <option value="review">● {t.statusReview}</option>
                    </select>
                  </div>

                  <div>
                    <label style={labelStyle}>{t.fullName}</label>
                    <input value={scholar.atAGlance.fullName} onChange={(e) => updateAtAGlance("fullName", e.target.value)}
                      style={inputStyle} onFocus={focusBorder} onBlur={blurBorder} />
                  </div>

                  <div>
                    <label style={labelStyle}>{t.aliases}</label>
                    <TagInput tags={scholar.atAGlance.aliases} onChange={(v) => updateAtAGlance("aliases", v)} placeholder="e.g. Malik ibn al-Nabi" />
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                    <div>
                      <label style={labelStyle}>{t.born}</label>
                      <input value={scholar.atAGlance.born} onChange={(e) => updateAtAGlance("born", e.target.value)} style={inputStyle} onFocus={focusBorder} onBlur={blurBorder} />
                    </div>
                    <div>
                      <label style={labelStyle}>{t.died}</label>
                      <input value={scholar.atAGlance.died} onChange={(e) => updateAtAGlance("died", e.target.value)} style={inputStyle} onFocus={focusBorder} onBlur={blurBorder} />
                    </div>
                  </div>

                  <div>
                    <label style={labelStyle}>{t.region}</label>
                    <input value={scholar.atAGlance.region} onChange={(e) => updateAtAGlance("region", e.target.value)} style={inputStyle} onFocus={focusBorder} onBlur={blurBorder} />
                  </div>

                  <div>
                    <label style={labelStyle}>{t.discipline}</label>
                    <TagInput tags={scholar.atAGlance.discipline} onChange={(v) => updateAtAGlance("discipline", v)} placeholder="e.g. Philosophy" />
                  </div>

                  <div>
                    <label style={labelStyle}>{t.expertise}</label>
                    <TagInput tags={scholar.atAGlance.expertise} onChange={(v) => updateAtAGlance("expertise", v)} placeholder="e.g. Social Theory" />
                  </div>
                </div>
              </div>
            </div>
          </aside>

          {/* RIGHT — sections */}
          <div style={{ minWidth: 0 }}>

            {/* ── NARRATIVE CONTENT — per language ── */}
            <SectionCard
              icon="translate"
              eyebrow={`${t.narrativeContent} — ${LANG_LABELS[activeLang].toUpperCase()}`}
              title={t.narrativeContent}
            >
              {!scholar.name[activeLang] ? (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "14px", padding: "48px 24px", textAlign: "center", border: "2px dashed #c0c9c3", borderRadius: "12px" }}>
                  <Icon name="translate" size={36} />
                  <p style={{ color: "#707974", fontSize: "14px", margin: 0 }}>{t.notStarted}</p>
                  <button onClick={startTranslation} style={{ ...MONO, fontSize: "11px", color: "#0b4335", fontWeight: 700, background: "none", border: "none", cursor: "pointer", textDecoration: "underline", textUnderlineOffset: "3px" }}>
                    {t.startTranslation}
                  </button>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                  <div>
                    <label style={labelStyle}>{t.subtitle}</label>
                    <input value={scholar.subtitle[activeLang] ?? ""} onChange={(e) => setLangField("subtitle", e.target.value)}
                      style={inputStyle} onFocus={focusBorder} onBlur={blurBorder} dir={isRTL ? "rtl" : "ltr"} />
                  </div>

                  <div>
                    <label style={labelStyle}>{t.quote}</label>
                    <textarea value={scholar.quote[activeLang] ?? ""} onChange={(e) => setLangField("quote", e.target.value)} rows={2}
                      style={{ ...inputStyle, resize: "vertical", ...SERIF, fontStyle: "italic" }} onFocus={focusBorder} onBlur={blurBorder} dir={isRTL ? "rtl" : "ltr"} />
                  </div>

                  <div>
                    <label style={labelStyle}>{t.overview}</label>
                    <textarea value={scholar.overviewText[activeLang] ?? ""} onChange={(e) => setLangField("overviewText", e.target.value)} rows={4}
                      style={{ ...inputStyle, resize: "vertical" }} onFocus={focusBorder} onBlur={blurBorder} dir={isRTL ? "rtl" : "ltr"} />
                    <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
                      <button style={{ ...MONO, fontSize: "9px", color: "#707974", background: "none", border: "1px solid rgba(192,201,195,0.5)", borderRadius: "6px", padding: "5px 10px", cursor: "pointer", display: "flex", alignItems: "center", gap: "5px" }}>
                        <Icon name="auto_awesome" size={13} />{t.improveAI}
                      </button>
                      <button style={{ ...MONO, fontSize: "9px", color: "#707974", background: "none", border: "1px solid rgba(192,201,195,0.5)", borderRadius: "6px", padding: "5px 10px", cursor: "pointer", display: "flex", alignItems: "center", gap: "5px" }}>
                        <Icon name="visibility" size={13} />{t.previewFormatting}
                      </button>
                    </div>
                  </div>

                  {/* ── Biography — single textarea ── */}
                  <div>
                    <label style={labelStyle}>{t.biography}</label>
                    <textarea
                      value={scholar.body[activeLang] ?? ""}
                      onChange={(e) => setLangField("body", e.target.value)}
                      rows={12}
                      dir={isRTL ? "rtl" : "ltr"}
                      style={{
                        ...inputStyle,
                        resize: "vertical",
                        lineHeight: 1.75,
                        /* make sure textarea never forces horizontal scroll */
                        width: "100%",
                        maxWidth: "100%",
                      }}
                      onFocus={focusBorder}
                      onBlur={blurBorder}
                    />
                    <p style={{ fontSize: "11px", color: "#c0c9c3", fontStyle: "italic", margin: "6px 0 0" }}>
                      {t.biographyHint}
                    </p>
                  </div>
                </div>
              )}
            </SectionCard>

            {/* ── ACADEMIC CONTEXT — shared ── */}
            <SectionCard icon="school" eyebrow="SHARED ACROSS ALL LANGUAGES" title={t.academicContext}>
              <SharedBanner note={t.academicContext} />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
                <div style={{ minWidth: 0 }}>
                  <label style={labelStyle}>{t.teachers}</label>
                  <LinkedPeopleEditor people={scholar.intellectualLineage} onChange={(v) => { setScholar((p) => ({ ...p, intellectualLineage: v })); mark(); }} placeholder={t.addPersonPlaceholder} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <label style={labelStyle}>{t.disciples}</label>
                  <LinkedPeopleEditor people={scholar.notableDisciples} onChange={(v) => { setScholar((p) => ({ ...p, notableDisciples: v })); mark(); }} placeholder={t.addPersonPlaceholder} />
                </div>
              </div>
            </SectionCard>

            {/* ── BIBLIOGRAPHY — shared ── */}
            <SectionCard icon="menu_book" eyebrow="SHARED ACROSS ALL LANGUAGES" title={t.bibliography}
              action={<HoverBtn onClick={() => setWorkModal({ open: true, index: null })}><Icon name="add_circle" size={13} />{t.addWork}</HoverBtn>}>
              <SharedBanner note={t.bibliography} />
              {/* Wrap table to prevent x-overflow */}
              <div style={{ border: "1px solid rgba(192,201,195,0.4)", borderRadius: "12px", overflow: "hidden" }}>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "480px" }}>
                    <thead>
                      <tr style={{ backgroundColor: "#f3f4f1", borderBottom: "1.5px solid rgba(192,201,195,0.4)" }}>
                        {["TITLE", "YEAR", "FORMAT", "ACCESS", ""].map((c) => (
                          <th key={c} style={{ ...MONO, padding: "10px 14px", textAlign: "left", fontSize: "9px", color: "#707974", letterSpacing: "0.1em", fontWeight: 700, whiteSpace: "nowrap" }}>{c}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {scholar.works.map((w, i) => (
                        <tr key={w.id} style={{ borderBottom: "1px solid #f0f1ee" }}>
                          <td style={{ ...SERIF, padding: "12px 14px", fontSize: "13px", fontWeight: 700, fontStyle: "italic" }}>{w.title}</td>
                          <td style={{ padding: "12px 14px", fontSize: "12px", color: "#707974", whiteSpace: "nowrap" }}>{w.year}</td>
                          <td style={{ padding: "12px 14px", whiteSpace: "nowrap" }}>
                            <span style={{ ...MONO, fontSize: "9px", fontWeight: 700, padding: "3px 8px", borderRadius: "4px", backgroundColor: w.format === "BOOK" ? "rgba(11,67,53,0.08)" : "#f3f4f1", color: w.format === "BOOK" ? "#0b4335" : "#404945" }}>{w.format}</span>
                          </td>
                          <td style={{ padding: "12px 14px", fontSize: "12px", color: w.accessUrl ? "#0b4335" : "#c0c9c3", whiteSpace: "nowrap" }}>{w.accessUrl ? (w.digitalAccess ?? "file").toUpperCase() : "—"}</td>
                          <td style={{ padding: "12px 14px", whiteSpace: "nowrap" }}>
                            <div style={{ display: "flex", gap: "4px" }}>
                              <IconBtn name="edit" onClick={() => setWorkModal({ open: true, index: i })} title="Edit" />
                              <IconBtn name="delete" danger onClick={() => deleteWork(i)} title="Delete" />
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {scholar.works.length === 0 && (
                  <div style={{ padding: "32px", textAlign: "center" }}>
                    <p style={{ color: "#707974", fontSize: "13px", margin: 0 }}>No works added yet.</p>
                  </div>
                )}
              </div>
            </SectionCard>

            {/* ── MEDIA — shared ── */}
            <SectionCard icon="perm_media" eyebrow="SHARED ACROSS ALL LANGUAGES" title={t.mediaLibrary}
              action={<HoverBtn onClick={() => setMediaModal({ open: true, index: null })}><Icon name="add_circle" size={13} />{t.addMedia}</HoverBtn>}>
              <SharedBanner note={t.mediaLibrary} />
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "14px" }}>
                {scholar.media.map((m, i) => (
                  <div key={m.id} style={{ backgroundColor: "#fff", padding: "18px", border: "1.5px solid rgba(192,201,195,0.4)", borderRadius: "12px", minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
                      <span className="material-symbols-outlined" style={{ fontSize: "26px", color: "#0b4335" }}>
                        {m.type === "pdf" ? "article" : m.type === "audio" ? "mic" : "movie"}
                      </span>
                      <div style={{ display: "flex", gap: "2px" }}>
                        <IconBtn name="edit" onClick={() => setMediaModal({ open: true, index: i })} title="Edit" />
                        <IconBtn name="delete" danger onClick={() => deleteMedia(i)} title="Delete" />
                      </div>
                    </div>
                    <p style={{ fontSize: "13px", fontWeight: 700, margin: "0 0 4px", wordBreak: "break-word" }}>{m.title}</p>
                    <p style={{ fontSize: "11px", color: "#707974", margin: "0 0 8px", lineHeight: 1.5 }}>{m.description}</p>
                    <span style={{ ...MONO, fontSize: "9px", color: "#c0c9c3" }}>{m.meta}</span>
                  </div>
                ))}
                {scholar.media.length === 0 && <p style={{ fontSize: "12px", color: "#c0c9c3", fontStyle: "italic", margin: 0 }}>No media added yet.</p>}
              </div>
            </SectionCard>

            {/* ── REFERENCES — shared ── */}
            <SectionCard icon="format_quote" eyebrow="SHARED ACROSS ALL LANGUAGES" title={t.references}
              action={<HoverBtn onClick={addReference}><Icon name="add" size={13} />{t.addReference}</HoverBtn>}>
              <SharedBanner note={t.references} />
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {scholar.academicReferences.map((r, i) => (
                  <div key={r.id} style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
                    <span style={{ ...MONO, fontSize: "10px", color: "#c0c9c3", paddingTop: "12px", minWidth: "16px", flexShrink: 0 }}>{i + 1}</span>
                    <textarea value={r.text} onChange={(e) => updateReference(i, e.target.value)} rows={2}
                      style={{ ...inputStyle, ...SERIF, fontSize: "12px", resize: "vertical", flex: 1 }} onFocus={focusBorder} onBlur={blurBorder} />
                    <IconBtn name="delete" danger onClick={() => removeReference(i)} title="Remove" />
                  </div>
                ))}
                {scholar.academicReferences.length === 0 && <p style={{ fontSize: "12px", color: "#c0c9c3", fontStyle: "italic", margin: 0 }}>No references added yet.</p>}
              </div>
            </SectionCard>

            {/* ── REVISION HISTORY — read-only ── */}
            <SectionCard icon="history" eyebrow="READ ONLY — GENERATED AUTOMATICALLY" title={t.revisionHistory}>
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {scholar.revisionHistory.map((r, i) => (
                  <div key={i} style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                    <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: i === 0 ? "#0b4335" : "#c0c9c3", marginTop: "5px", flexShrink: 0 }} />
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontSize: "13px", fontWeight: 700, margin: "0 0 2px" }}>{r.description}</p>
                      <p style={{ ...MONO, fontSize: "10px", color: "#c0c9c3", margin: 0 }}>{r.author} • {r.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>

            {/* Bottom save bar */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "12px" }}>
              <HoverBtn style={{ borderColor: "#c0c9c3", color: "#707974" }}>{t.cancel}</HoverBtn>
              <button onClick={handleSave} style={{ ...BTN_PRIMARY, backgroundColor: "#0b4335", color: "#fff", padding: "10px 24px" }}>
                <Icon name="save" size={14} />{t.saveChanges}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default EditScholarPage;