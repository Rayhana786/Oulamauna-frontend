import React, { useState, useRef } from "react";

/* ─────────────────────────────────────────────
   TYPES
───────────────────────────────────────────── */
type Language = "EN" | "AR" | "FR";
type TabId = "works" | "media" | "relations" | "more";

interface Contributor {
  name: string;
  contributions: number;
  profileUrl?: string;
}

interface Work {
  title: string;
  year: number;
  format: "BOOK" | "MANUSCRIPT" | "ARTICLE";
  digitalAccess?: "pdf" | "audio" | "file" | null;
  accessUrl?: string;
  accessFileName?: string;
  accessSource?: "upload" | "link";
}

interface MediaItem {
  type: "pdf" | "audio" | "video";
  title: string;
  description: string;
  meta: string;
  action: string;
  actionIcon: string;
  accessUrl?: string;
  accessSource?: "upload" | "link";
  accessFileName?: string;
}

interface RelatedPerson {
  initials: string;
  color: string;
  textColor: string;
  name: string;
  role: string;
  profileUrl?: string;
}

interface RelatedScholar {
  labelColor: string;
  label: string;
  name: string;
  description: string;
}

interface Reference { text: string }

interface RevisionEntry {
  author: string;
  date: string;
  description: string;
  isPrimary: boolean;
}

interface RecentRevision {
  date: string;
  author: string;
  action: string;
  authorUrl?: string;
}

interface LangContent<T> {
  EN?: T;
  AR?: T;
  FR?: T;
}

interface ScholarDetail {
  id: number;
  name: LangContent<string>;
  subtitle: LangContent<string>;
  createdBy: string;
  createdByUrl: string;
  createdDate: string;
  lastUpdatedBy: string;
  lastUpdatedByUrl: string;
  lastUpdatedDate: string;
  image: string;
  quote: LangContent<string>;
  overviewText: LangContent<string>;
  body: LangContent<string[]>;
  atAGlance: {
    fullName: string;
    born: string;
    died: string;
    century: string;
    region: string;
    discipline: string;
    expertise: string;
  };
  contributors: Contributor[];
  works: Work[];
  media: MediaItem[];
  intellectualLineage: RelatedPerson[];
  notableDisciples: RelatedPerson[];
  relatedScholars: RelatedScholar[];
  academicReferences: Reference[];
  revisionHistory: RevisionEntry[];
  recentRevisions: RecentRevision[];
}

interface Comment {
  id: number;
  author: string;
  role: string | null;
  text: string;
  time: string;
  votes: number;
  replies?: Comment[];
}

type CommentsByLang = Record<Language, Comment[]>;
type DraftByLang = Record<Language, string>;
type VotedIds = Record<number, boolean>;

interface UITranslation {
  overview: string;
  atAGlance: string;
  fullName: string;
  born: string;
  died: string;
  century: string;
  region: string;
  discipline: string;
  expertise: string;
  allContributors: string;
  contributor: string;
  contributions: string;
  contributors: string;
  citePage: string;
  tabs: string[];
  editBtn: string;
  bibliographyTitle: string;
  colTitle: string;
  colYear: string;
  colFormat: string;
  colAccess: string;
  downloadPdf: string;
  listenAudio: string;
  awaitingDigitization: string;
  mediaTitle: string;
  addMedia: string;
  intellectualLineage: string;
  notableDisciples: string;
  relatedByField: string;
  academicReferences: string;
  revisionHistory: string;
  recentRevisions: string;
  viewAllEdits: string;
  academicDiscussion: string;
  joinDialogue: string;
  reply: string;
  vote: string;
  report: string;
  noContent: string;
  noDiscussion: string;
  startDiscussion: string;
  contribute: string;
  createdBy: string;
  lastUpdated: string;
  sharedNote: string;
  addWork: string;
}

/* ─────────────────────────────────────────────
   UI TRANSLATIONS
───────────────────────────────────────────── */
const T: Record<Language, UITranslation> = {
  EN: {
    overview: "OVERVIEW",
    atAGlance: "AT A GLANCE",
    fullName: "Full Name", born: "Born", died: "Died",
    century: "Century", region: "Region", discipline: "Discipline", expertise: "Expertise",
    allContributors: "ALL CONTRIBUTORS",
    contributor: "CONTRIBUTOR", contributions: "CONTRIBUTIONS",
    contributors: "Contributors",
    citePage: "CITE THIS PAGE",
    tabs: ["WORKS", "MEDIA", "RELATIONS", "REFERENCES "],
    editBtn: "EDIT ENGLISH",
    bibliographyTitle: "Bibliography",
    colTitle: "TITLE", colYear: "YEAR", colFormat: "FORMAT", colAccess: "DIGITAL ACCESS",
    downloadPdf: "DOWNLOAD PDF", listenAudio: "LISTEN AUDIO",
    awaitingDigitization: "Awaiting Digitization",
    mediaTitle: "Integrated Media Library", addMedia: "ADD MEDIA",
    intellectualLineage: "Intellectual Lineage",
    notableDisciples: "Notable Disciples",
    relatedByField: "Related Scholars by Field",
    academicReferences: "Academic References",
    revisionHistory: "Revision History",
    recentRevisions: "Recent Revisions",
    viewAllEdits: "View all edits",
    academicDiscussion: "Academic Discussion",
    joinDialogue: "Join the scholarly dialogue in English...",
    reply: "REPLY", vote: "VOTE", report: "REPORT",
    noContent: "This page has not yet been contributed in",
    noDiscussion: "No discussion yet in English.",
    startDiscussion: "Start the conversation →",
    contribute: "Contribute now →",
    createdBy: "CREATED BY", lastUpdated: "LAST UPDATED BY",
    sharedNote: "Shared across all languages",
    addWork: "ADD WORK",
  },
  AR: {
    overview: "نظرة عامة",
    atAGlance: "لمحة سريعة",
    fullName: "الاسم الكامل", born: "الميلاد", died: "الوفاة",
    century: "القرن", region: "المنطقة", discipline: "التخصص", expertise: "التخصص",
    allContributors: "جميع المساهمين",
    contributor: "المساهم", contributions: "المساهمات",
    contributors: "مساهمون",
    citePage: "استشهد بهذه الصفحة",
    tabs: ["الأعمال", "الوسائط", "العلاقات", "المراجع"],
    editBtn: "تعديل العربية",
    bibliographyTitle: "قائمة المؤلفات",
    colTitle: "العنوان", colYear: "السنة", colFormat: "الصيغة", colAccess: "الوصول الرقمي",
    downloadPdf: "تحميل PDF", listenAudio: "الاستماع",
    awaitingDigitization: "في انتظار الرقمنة",
    mediaTitle: "مكتبة الوسائط المتكاملة", addMedia: "إضافة وسائط",
    intellectualLineage: "السلسلة الفكرية",
    notableDisciples: "أبرز التلامذة",
    relatedByField: "علماء ذوو صلة بالمجال",
    academicReferences: "المراجع الأكاديمية",
    revisionHistory: "تاريخ المراجعات",
    recentRevisions: "أحدث المراجعات",
    viewAllEdits: "عرض كل التعديلات",
    academicDiscussion: "النقاش الأكاديمي",
    joinDialogue: "انضم إلى الحوار العلمي بالعربية...",
    reply: "ردّ", vote: "تصويت", report: "إبلاغ",
    noContent: "لم يتم المساهمة في هذه الصفحة بعد باللغة",
    noDiscussion: "لا توجد نقاشات بالعربية بعد.",
    startDiscussion: "ابدأ المحادثة →",
    contribute: "ساهم الآن →",
    createdBy: "أنشأه", lastUpdated: "آخر تحديث بواسطة",
    sharedNote: "مشترك بين جميع اللغات",
    addWork: "إضافة عمل",
  },
  FR: {
    overview: "APERÇU",
    atAGlance: "EN UN COUP D'ŒIL",
    fullName: "Nom complet", born: "Né", died: "Décédé",
    century: "Siècle", region: "Région", discipline: "Discipline", expertise: "Expertise",
    allContributors: "TOUS LES CONTRIBUTEURS",
    contributor: "CONTRIBUTEUR", contributions: "CONTRIBUTIONS",
    contributors: "Contributeurs",
    citePage: "CITER CETTE PAGE",
    tabs: ["ŒUVRES", "MÉDIAS", "RELATIONS", "RÉFÉRENCES"],
    editBtn: "MODIFIER FRANÇAIS",
    bibliographyTitle: "Bibliographie",
    colTitle: "TITRE", colYear: "ANNÉE", colFormat: "FORMAT", colAccess: "ACCÈS NUMÉRIQUE",
    downloadPdf: "TÉLÉCHARGER PDF", listenAudio: "ÉCOUTER AUDIO",
    awaitingDigitization: "En attente de numérisation",
    mediaTitle: "Médiathèque Intégrée", addMedia: "AJOUTER MÉDIA",
    intellectualLineage: "LIGNÉE INTELLECTUELLE",
    notableDisciples: "DISCIPLES NOTABLES",
    relatedByField: "SAVANTS LIÉS PAR DOMAINE",
    academicReferences: "RÉFÉRENCES ACADÉMIQUES",
    revisionHistory: "HISTORIQUE DES RÉVISIONS",
    recentRevisions: "RÉVISIONS RÉCENTES",
    viewAllEdits: "VOIR TOUTES LES MODIFICATIONS",
    academicDiscussion: "Discussion Académique",
    joinDialogue: "Rejoindre le dialogue savant en français...",
    reply: "RÉPONDRE", vote: "VOTER", report: "SIGNALER",
    noContent: "Cette page n'a pas encore été contribuée en",
    noDiscussion: "Aucune discussion en français pour l'instant.",
    startDiscussion: "Démarrer la conversation →",
    contribute: "Contribuer maintenant →",
    createdBy: "CRÉÉ PAR", lastUpdated: "MIS À JOUR PAR",
    sharedNote: "Partagé entre toutes les langues",
    addWork: "AJOUTER ŒUVRE",
  },
};

const LANG_LABELS: Record<Language, string> = { EN: "English", AR: "العربية", FR: "Français" };

/* ─────────────────────────────────────────────
   MOCK DATA
───────────────────────────────────────────── */
const SCHOLAR: ScholarDetail = {
  id: 1,
  name:     { EN: "Malek Bennabi", AR: "مالك بن نبي", FR: "Malek Bennabi" },
  subtitle: { EN: "Malik ibn al-Nabi • Bennabi Al-Jazairi", AR: "مالك بن نبي • بن نبي الجزائري" },
  createdBy: "Ahmed Benali", createdByUrl: "/profile/ahmed-benali",
  createdDate: "March 1, 2026",
  lastUpdatedBy: "Fatima Zahra", lastUpdatedByUrl: "/profile/fatima-zahra",
  lastUpdatedDate: "June 12, 2026",
  image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBYo9_bcR7fmJOfz7nDYlP7a3T1KpuJVFUT3Bn4kf9VHOSr9pj8KvDqtnmloDja-vHVNoPoXEaGQf8hjA3c6zJ8oR54lDyhMb6R6genD073t3jrAj-oxsGBWjICwWnjvI6jLyD89lpMYBy0f1aPL413vHWqaUSlV8Srdgn0umfRAsmCC_c3ZGwYzmcMI-mmNjU6R2PuQ02B-VbHshC_L6fcA5lH8Nrx85bBdxzWr6cbpn_9AhQ283C6SvlKAutkKIsqwuTMDYDeseMl",
  quote: {
    EN: '"Civilization is the result of a vital spark… and it is the product of the interaction between three fundamental elements: Man, Soil, and Time."',
    AR: '"الحضارة هي نتاج شرارة حيوية… وهي ثمرة التفاعل بين ثلاثة عناصر أساسية: الإنسان والتراب والوقت."',
  },
  overviewText: {
    EN: 'Malek Bennabi was one of the most prominent thinkers of the 20th century Algerian intellectual renaissance. An engineer by training and a philosopher by calling, he dedicated his life to analyzing the conditions of civilizational decline and rebirth, coining the influential concept of "colonizability."',
    AR: 'كان مالك بن نبي من أبرز مفكري النهضة الفكرية الجزائرية في القرن العشرين. مهندس بالتكوين وفيلسوف بالدعوة، كرّس حياته لتحليل شروط الانحطاط الحضاري والنهوض.',
  },
  body: {
    EN: [
      "Malek Bennabi was born in Constantine, Algeria, in 1905 during the height of French colonial occupation. Educated in both the traditional Algerian circles and later as an engineer in Paris, he developed a unique socio-philosophical lens that combined technical precision with historical depth.",
      'His seminal contribution, the concept of "colonizability", argued that external colonization was only possible where internal psychological and social structures had already deteriorated. This shifted the focus of decolonization efforts from purely political liberation to a fundamental civilizational renewal.',
    ],
    AR: [
      "وُلد مالك بن نبي في قسنطينة، الجزائر، عام 1905 في ذروة الاحتلال الاستعماري الفرنسي.",
      'أسهامه الجوهرية تتمثل في مفهوم "القابلية للاستعمار".',
    ],
  },
  atAGlance: {
    fullName: "Malek Bennabi", born: "1905, Constantine", died: "1973, Algiers",
    century: "20th Century", region: "North Africa", discipline: "Social Sciences, Philosophy",
    expertise: "Social Theory, Philosophy of History",
  },
  contributors: [
    { name: "Ahmed Benali",  contributions: 12, profileUrl: "/profile/ahmed-benali" },
    { name: "Fatima Zahra", contributions: 8,  profileUrl: "/profile/fatima-zahra" },
    { name: "Yacine",       contributions: 3,  profileUrl: "/profile/yacine"        },
  ],
  works: [
    { title: "The Quranic Phenomenon",                   year: 1946, format: "BOOK",       digitalAccess: "pdf"   },
    { title: "Conditions of the Renaissance",            year: 1948, format: "BOOK",       digitalAccess: "audio" },
    { title: "The Problem of Ideas in the Muslim World", year: 1970, format: "MANUSCRIPT", digitalAccess: null    },
  ],
  media: [
    { type: "pdf",   title: "The Quranic Phenomenon", description: "Full text including original foreword by Mahmoud Shaker and Sayyid Qutb.", meta: "PDF • 2.4 MB",  action: "OPEN DOCUMENT",  actionIcon: "arrow_forward" },
    { type: "audio", title: "1968 Cairo Lecture",      description: "Historic seminar on civilizational crisis recorded at Al-Azhar University.", meta: "Audio • 45:00", action: "PLAY RECORDING", actionIcon: "play_circle"   },
    { type: "video", title: "The Life and Thought",    description: "Documentary series exploring his legacy in modern Algiers and Paris.",        meta: "Video • HD",    action: "WATCH NOW",      actionIcon: "open_in_new"   },
  ],
  intellectualLineage: [
    { initials: "AB", color: "#0b4335", textColor: "#fff",    name: "Ben Badis",   role: "Teacher",             profileUrl: "/scholar/ben-badis"   },
    { initials: "IK", color: "#d9dad8", textColor: "#404945", name: "Ibn Khaldun", role: "Historical Influence", profileUrl: "/scholar/ibn-khaldun" },
  ],
  notableDisciples: [
    { initials: "AM", color: "#735c00", textColor: "#fff", name: "El-Messiri", role: "Egypt / Modernity", profileUrl: "/scholar/el-messiri" },
    { initials: "RG", color: "#5c2e29", textColor: "#fff", name: "Ghannushi",  role: "Social Activism",   profileUrl: "/scholar/ghannushi"  },
  ],
  relatedScholars: [
    { labelColor: "#0b4335", label: "Specialty: Socio-politics", name: "Sayyid Qutb",  description: "Mutual Correspondent"         },
    { labelColor: "#735c00", label: "Region: North Africa",      name: "Frantz Fanon", description: "Contemporary Dialectic"       },
    { labelColor: "#5c2e29", label: "Era: 20th Century",         name: "Ali Shariati", description: "Sociology of Islamic Thought" },
  ],
  academicReferences: [
    { text: "Bennabi, M. (1948). Les Conditions de la Renaissance. Alger: Éditions de la Renaissance d'Algérie." },
    { text: "Stenberg, L. (1996). The Islamization of Science: Four Muslim Positions Developing an Islamic Modernity. Lund Studies." },
    { text: "Naylor, P. C. (2000). France and Algeria: A History of Decolonization and Transformation. Univ. Press of Florida." },
  ],
  revisionHistory: [
    { author: "Dr. Yusuf Al-Masri", date: "Mar 14, 2024", description: "Bibliography expansion",  isPrimary: true  },
    { author: "Omar Benali",        date: "Jan 20, 2024", description: "Initial profile creation", isPrimary: false },
  ],
  recentRevisions: [
    { date: "12/06/2026", author: "Ahmed Benali",  action: "Added new book",           authorUrl: "/profile/ahmed-benali"  },
    { date: "08/06/2026", author: "Fatima Zahra",  action: "Corrected death date",     authorUrl: "/profile/fatima-zahra"  },
    { date: "01/06/2026", author: "Yacine",        action: "Added academic reference", authorUrl: "/profile/yacine"        },
  ],
};

/* ─────────────────────────────────────────────
   SEED COMMENTS
───────────────────────────────────────────── */
const SEED_COMMENTS: CommentsByLang = {
  EN: [
    {
      id: 1,
      author: "Prof. Sarah Jenkins",
      role: "Peer Reviewer",
      text: "The distinction between Bennabi's concept of 'Colonizability' and Fanon's 'Colonized Mind' is often blurred. I suggest adding a comparative sidebar in the next revision.",
      time: "2 days ago",
      votes: 12,
      replies: [],
    },
  ],
  AR: [
    {
      id: 1,
      author: "د. خالد العمري",
      role: "أكاديمي",
      text: "مفهوم القابلية للاستعمار عند بن نبي يختلف جذريًا عن مفهوم الوعي الاستعماري عند فانون. أقترح إضافة مقارنة موسّعة في المراجعة القادمة.",
      time: "منذ 3 أيام",
      votes: 7,
      replies: [],
    },
  ],
  FR: [],
};

/* ─────────────────────────────────────────────
   SHARED STYLE CONSTANTS
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

/* ─────────────────────────────────────────────
   SMALL REUSABLE COMPONENTS
───────────────────────────────────────────── */
function Icon({ name, size = 20 }: { name: string; size?: number }) {
  return (
    <span
      className="material-symbols-outlined"
      style={{ fontSize: `${size}px`, lineHeight: 1, userSelect: "none" }}
    >
      {name}
    </span>
  );
}

function ProfileLink({ name, url, color = "#0b4335" }: { name: string; url: string; color?: string }) {
  const [hover, setHover] = useState(false);
  return (
    <a
      href={url}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        color: hover ? "#285b4b" : color,
        fontWeight: 600,
        textDecoration: hover ? "underline" : "none",
        textUnderlineOffset: "2px",
        transition: "color 0.15s",
        cursor: "pointer",
      }}
    >
      {name}
    </a>
  );
}

function HoverBtn({ children, onClick, style }: { children: React.ReactNode; onClick?: () => void; style?: React.CSSProperties }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        ...BTN_PRIMARY,
        backgroundColor: hov ? "#0b4335" : "transparent",
        color: hov ? "#fff" : "#0b4335",
        ...style,
      }}
    >
      {children}
    </button>
  );
}

function EmptyLangState({ lang, t }: { lang: Language; t: UITranslation }) {
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", gap: "16px",
      padding: "64px 32px", textAlign: "center",
      border: "2px dashed #c0c9c3", borderRadius: "12px",
      margin: "32px 0",
    }}>
      <Icon name="translate" size={40} />
      <p style={{ color: "#707974", fontSize: "15px", lineHeight: 1.6 }}>
        {t.noContent} <strong>{LANG_LABELS[lang]}</strong>.
      </p>
      <a href="#contribute" style={{ color: "#0b4335", fontWeight: 700, fontSize: "13px", textDecoration: "underline", textUnderlineOffset: "3px" }}>
        {t.contribute}
      </a>
    </div>
  );
}

function SharedBanner({ t }: { t: UITranslation }) {
  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: "6px",
      marginBottom: "20px", padding: "5px 12px",
      backgroundColor: "rgba(11,67,53,0.05)",
      border: "1px solid rgba(11,67,53,0.12)",
      borderRadius: "6px",
    }}>
      <Icon name="public" size={13} />
      <span style={{ ...MONO, fontSize: "9px", color: "#707974", letterSpacing: "0.1em" }}>
        {t.sharedNote}
      </span>
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

function getAccessLabel(work: Work): { label: string; icon: string; color?: string } {
  if (!work.accessUrl) return { label: "—", icon: "" };
  const isUpload = work.accessSource === "upload";
  if (work.digitalAccess === "audio") {
    return {
      label: isUpload ? "DOWNLOAD AUDIO" : "LISTEN AUDIO",
      icon: isUpload ? "download" : "play_circle",
      color: "#735c00",
    };
  }
  if (work.digitalAccess === "file") {
    return { label: "DOWNLOAD FILE", icon: "download", color: "#735c00" };
  }
  return {
    label: isUpload ? "DOWNLOAD PDF" : "VIEW PDF",
    icon: isUpload ? "download" : "open_in_new",
  };
}

/* ─────────────────────────────────────────────
   UPLOAD DROP ZONE (reusable)
───────────────────────────────────────────── */
interface UploadZoneProps {
  file: File | null;
  onFile: (f: File) => void;
  onRemove: () => void;
  accept?: string;
  hint?: string;
}

function UploadZone({ file, onFile, onRemove, accept, hint }: UploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) onFile(f);
  };

  if (file) {
    return (
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "12px 16px",
        backgroundColor: "rgba(11,67,53,0.05)",
        border: "1.5px solid rgba(11,67,53,0.2)",
        borderRadius: "8px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
          <Icon name={getFileIcon(file.name)} size={20} />
          <span style={{ fontSize: "13px", color: "#191c1b", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {file.name}
          </span>
          <span style={{ ...MONO, fontSize: "9px", color: "#707974", whiteSpace: "nowrap" }}>
            {(file.size / 1024 / 1024).toFixed(1)} MB
          </span>
        </div>
        <button
          onClick={onRemove}
          style={{ background: "none", border: "none", cursor: "pointer", color: "#707974", flexShrink: 0, display: "flex", alignItems: "center" }}
          title="Remove file"
        >
          <Icon name="close" size={16} />
        </button>
      </div>
    );
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        style={{ display: "none" }}
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); }}
      />
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        style={{
          border: `2px dashed ${dragOver ? "#0b4335" : "rgba(192,201,195,0.7)"}`,
          borderRadius: "10px",
          padding: "28px 20px",
          textAlign: "center",
          cursor: "pointer",
          backgroundColor: dragOver ? "rgba(11,67,53,0.04)" : "#fafbf8",
          transition: "all 0.15s",
        }}
      >
        <Icon name="cloud_upload" size={32} />
        <p style={{ fontSize: "13px", color: "#404945", margin: "10px 0 4px", fontWeight: 600 }}>
          Drop a file here, or{" "}
          <span style={{ color: "#0b4335", textDecoration: "underline" }}>browse</span>
        </p>
        <p style={{ ...MONO, fontSize: "9px", color: "#c0c9c3", margin: 0 }}>
          {hint ?? "PDF, Audio, Video, ePub, Word — up to 50 MB"}
        </p>
      </div>
    </>
  );
}

/* ─────────────────────────────────────────────
   ADD WORK MODAL
───────────────────────────────────────────── */
type AccessMode = "none" | "upload" | "link";

interface AddWorkModalProps {
  onClose: () => void;
  onAdd: (work: Work) => void;
  t: UITranslation;
}

function AddWorkModal({ onClose, onAdd }: AddWorkModalProps) {
  const [title, setTitle]     = useState("");
  const [year, setYear]       = useState<string>("");
  const [format, setFormat]   = useState<Work["format"]>("BOOK");
  const [accessMode, setAccessMode] = useState<AccessMode>("none");
  const [linkUrl, setLinkUrl] = useState("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [error, setError]     = useState("");

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "10px 14px",
    border: "1.5px solid rgba(192,201,195,0.6)", borderRadius: "8px",
    fontSize: "13px", color: "#191c1b", backgroundColor: "#fafbf8",
    fontFamily: "'Source Sans 3', sans-serif", outline: "none",
    transition: "border-color 0.15s",
  };

  const labelStyle: React.CSSProperties = {
    ...MONO, fontSize: "9px", color: "#707974",
    letterSpacing: "0.12em", display: "block", marginBottom: "6px",
  };

  const modeTabStyle = (active: boolean): React.CSSProperties => ({
    flex: 1, padding: "9px 0", textAlign: "center" as const,
    ...MONO, fontSize: "10px", fontWeight: 700, letterSpacing: "0.08em",
    border: "1.5px solid",
    borderColor: active ? "#0b4335" : "rgba(192,201,195,0.5)",
    backgroundColor: active ? "#0b4335" : "transparent",
    color: active ? "#fff" : "#707974",
    cursor: "pointer", transition: "all 0.15s",
    display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
  });

  const handleSubmit = () => {
    if (!title.trim()) { setError("Title is required."); return; }
    const yr = parseInt(year, 10);
    if (!year || isNaN(yr) || yr < 600 || yr > new Date().getFullYear()) {
      setError("Please enter a valid year."); return;
    }
    if (accessMode === "link" && !linkUrl.trim()) {
      setError("Please enter a URL or switch to No Access."); return;
    }
    if (accessMode === "upload" && !uploadedFile) {
      setError("Please upload a file or switch to No Access."); return;
    }

    let accessUrl: string | undefined;
    let accessFileName: string | undefined;
    let accessSource: Work["accessSource"];
    let digitalAccess: Work["digitalAccess"] = null;

    if (accessMode === "link") {
      accessUrl = linkUrl.trim();
      accessSource = "link";
      // guess type from URL extension
      const ext = accessUrl.split(".").pop()?.toLowerCase() ?? "";
      digitalAccess = ["mp3", "wav", "ogg", "m4a"].includes(ext) ? "audio" : "pdf";
    } else if (accessMode === "upload" && uploadedFile) {
      accessUrl = URL.createObjectURL(uploadedFile);
      accessFileName = uploadedFile.name;
      accessSource = "upload";
      digitalAccess = getAccessType(uploadedFile.name);
    }

    onAdd({ title: title.trim(), year: yr, format, digitalAccess, accessUrl, accessFileName, accessSource });
    onClose();
  };

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 200,
        backgroundColor: "rgba(25,28,27,0.45)",
        display: "flex", alignItems: "center", justifyContent: "center",
        backdropFilter: "blur(4px)",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        backgroundColor: "#fff", borderRadius: "16px",
        padding: "36px", width: "520px", maxWidth: "calc(100vw - 32px)",
        boxShadow: "0 20px 60px rgba(0,0,0,0.18)",
        border: "1px solid rgba(192,201,195,0.3)",
        maxHeight: "90vh", overflowY: "auto",
      }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px" }}>
          <h2 style={{ ...SERIF, fontSize: "20px", fontWeight: 700, color: "#0b4335", margin: 0, display: "flex", alignItems: "center", gap: "10px" }}>
            <Icon name="add_circle" size={20} />
            Add New Work
          </h2>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer", color: "#707974", padding: "4px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f0f1ee")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
          >
            <Icon name="close" size={20} />
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Title */}
          <div>
            <label style={labelStyle}>TITLE *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => { setTitle(e.target.value); setError(""); }}
              placeholder="e.g. The Problem of Culture"
              style={inputStyle}
              onFocus={(e) => (e.currentTarget.style.borderColor = "#0b4335")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(192,201,195,0.6)")}
            />
          </div>

          {/* Year + Format */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <div>
              <label style={labelStyle}>YEAR *</label>
              <input
                type="number"
                value={year}
                onChange={(e) => { setYear(e.target.value); setError(""); }}
                placeholder="e.g. 1959"
                min={600}
                max={new Date().getFullYear()}
                style={inputStyle}
                onFocus={(e) => (e.currentTarget.style.borderColor = "#0b4335")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(192,201,195,0.6)")}
              />
            </div>
            <div>
              <label style={labelStyle}>FORMAT</label>
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value as Work["format"])}
                style={{ ...inputStyle, cursor: "pointer" }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "#0b4335")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(192,201,195,0.6)")}
              >
                <option value="BOOK">Book</option>
                <option value="MANUSCRIPT">Manuscript</option>
                <option value="ARTICLE">Article</option>
              </select>
            </div>
          </div>

          {/* Digital Access */}
          <div>
            <label style={labelStyle}>DIGITAL ACCESS</label>

            {/* Mode tabs: None / Upload / Link */}
            <div style={{ display: "flex", borderRadius: "8px", overflow: "hidden", border: "1.5px solid rgba(192,201,195,0.5)", marginBottom: "16px" }}>
              <button style={modeTabStyle(accessMode === "none")} onClick={() => { setAccessMode("none"); setError(""); }}>
                <Icon name="block" size={13} /> None
              </button>
              <button
                style={{ ...modeTabStyle(accessMode === "upload"), borderLeft: "1px solid rgba(192,201,195,0.5)", borderRight: "1px solid rgba(192,201,195,0.5)" }}
                onClick={() => { setAccessMode("upload"); setError(""); }}
              >
                <Icon name="upload_file" size={13} /> Upload File
              </button>
              <button style={modeTabStyle(accessMode === "link")} onClick={() => { setAccessMode("link"); setError(""); }}>
                <Icon name="link" size={13} /> Paste Link
              </button>
            </div>

            {/* Upload zone — generic, all file types */}
            {accessMode === "upload" && (
              <UploadZone
                file={uploadedFile}
                onFile={(f) => { setUploadedFile(f); setError(""); }}
                onRemove={() => setUploadedFile(null)}
                accept=".pdf,.mp3,.wav,.ogg,.m4a,.mp4,.webm,.epub,.doc,.docx,application/pdf,audio/*,video/*"
                hint="PDF, Audio (MP3/WAV), Video, ePub, Word — up to 50 MB"
              />
            )}

            {/* Link input */}
            {accessMode === "link" && (
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#c0c9c3", display: "flex", alignItems: "center" }}>
                  <Icon name="link" size={16} />
                </span>
                <input
                  type="url"
                  value={linkUrl}
                  onChange={(e) => { setLinkUrl(e.target.value); setError(""); }}
                  placeholder="https://archive.org/details/…"
                  style={{ ...inputStyle, paddingLeft: "36px" }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "#0b4335")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(192,201,195,0.6)")}
                />
              </div>
            )}

            {/* None hint */}
            {accessMode === "none" && (
              <p style={{ fontSize: "12px", color: "#c0c9c3", fontStyle: "italic", margin: 0 }}>
                No digital file will be attached. The work will appear as "—" in the bibliography.
              </p>
            )}
          </div>

          {/* Error */}
          {error && (
            <p style={{ ...MONO, fontSize: "10px", color: "#b3261e", margin: 0, display: "flex", alignItems: "center", gap: "6px" }}>
              <Icon name="error" size={13} /> {error}
            </p>
          )}
        </div>

        {/* Footer */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "32px", paddingTop: "24px", borderTop: "1px solid rgba(192,201,195,0.3)" }}>
          <HoverBtn onClick={onClose} style={{ borderColor: "#c0c9c3", color: "#707974" }}>
            Cancel
          </HoverBtn>
          <button
            onClick={handleSubmit}
            style={{ ...BTN_PRIMARY, backgroundColor: "#0b4335", color: "#fff", padding: "8px 20px", fontSize: "11px" }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#285b4b")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#0b4335")}
          >
            <Icon name="check" size={14} />
            ADD WORK
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   ADD MEDIA MODAL
───────────────────────────────────────────── */
interface AddMediaModalProps {
  onClose: () => void;
  onAdd: (item: MediaItem) => void;
}

function AddMediaModal({ onClose, onAdd }: AddMediaModalProps) {
  const [title, setTitle]   = useState("");
  const [desc, setDesc]     = useState("");
  const [accessMode, setAccessMode] = useState<AccessMode>("none");
  const [linkUrl, setLinkUrl] = useState("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [error, setError]   = useState("");

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "10px 14px",
    border: "1.5px solid rgba(192,201,195,0.6)", borderRadius: "8px",
    fontSize: "13px", color: "#191c1b", backgroundColor: "#fafbf8",
    fontFamily: "'Source Sans 3', sans-serif", outline: "none",
    transition: "border-color 0.15s",
  };

  const labelStyle: React.CSSProperties = {
    ...MONO, fontSize: "9px", color: "#707974",
    letterSpacing: "0.12em", display: "block", marginBottom: "6px",
  };

  const modeTabStyle = (active: boolean): React.CSSProperties => ({
    flex: 1, padding: "9px 0", textAlign: "center" as const,
    ...MONO, fontSize: "10px", fontWeight: 700, letterSpacing: "0.08em",
    border: "1.5px solid",
    borderColor: active ? "#0b4335" : "rgba(192,201,195,0.5)",
    backgroundColor: active ? "#0b4335" : "transparent",
    color: active ? "#fff" : "#707974",
    cursor: "pointer", transition: "all 0.15s",
    display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
  });

  const handleSubmit = () => {
    if (!title.trim()) { setError("Title is required."); return; }
    if (accessMode === "link" && !linkUrl.trim()) { setError("Please enter a URL."); return; }
    if (accessMode === "upload" && !uploadedFile) { setError("Please upload a file."); return; }

    let type: MediaItem["type"] = "pdf";
    let meta = "File";
    let action = "OPEN DOCUMENT";
    let actionIcon = "arrow_forward";
    let accessUrl: string | undefined;
    let accessSource: MediaItem["accessSource"];
    let accessFileName: string | undefined;

    if (accessMode === "upload" && uploadedFile) {
      const ext = uploadedFile.name.split(".").pop()?.toLowerCase() ?? "";
      accessUrl = URL.createObjectURL(uploadedFile);
      accessSource = "upload";
      accessFileName = uploadedFile.name;
      meta = `${(uploadedFile.size / 1024 / 1024).toFixed(1)} MB`;
      if (["mp3", "wav", "ogg", "m4a"].includes(ext)) {
        type = "audio"; action = "PLAY RECORDING"; actionIcon = "play_circle";
        meta = `Audio • ${meta}`;
      } else if (["mp4", "webm", "avi", "mov"].includes(ext)) {
        type = "video"; action = "WATCH NOW"; actionIcon = "open_in_new";
        meta = `Video • ${meta}`;
      } else {
        meta = `PDF • ${meta}`;
      }
    } else if (accessMode === "link") {
      accessUrl = linkUrl.trim();
      accessSource = "link";
      const ext = accessUrl.split(".").pop()?.toLowerCase() ?? "";
      if (["mp3", "wav", "ogg", "m4a"].includes(ext)) {
        type = "audio"; action = "PLAY RECORDING"; actionIcon = "play_circle"; meta = "Audio";
      } else if (["mp4", "webm"].includes(ext) || accessUrl.includes("youtube") || accessUrl.includes("vimeo")) {
        type = "video"; action = "WATCH NOW"; actionIcon = "open_in_new"; meta = "Video";
      } else {
        meta = "PDF";
      }
    }

    onAdd({ type, title: title.trim(), description: desc.trim() || "No description.", meta, action, actionIcon, accessUrl, accessSource, accessFileName });
    onClose();
  };

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 200,
        backgroundColor: "rgba(25,28,27,0.45)",
        display: "flex", alignItems: "center", justifyContent: "center",
        backdropFilter: "blur(4px)",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        backgroundColor: "#fff", borderRadius: "16px",
        padding: "36px", width: "520px", maxWidth: "calc(100vw - 32px)",
        boxShadow: "0 20px 60px rgba(0,0,0,0.18)",
        border: "1px solid rgba(192,201,195,0.3)",
        maxHeight: "90vh", overflowY: "auto",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px" }}>
          <h2 style={{ ...SERIF, fontSize: "20px", fontWeight: 700, color: "#0b4335", margin: 0, display: "flex", alignItems: "center", gap: "10px" }}>
            <Icon name="add_circle" size={20} />
            Add Media
          </h2>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer", color: "#707974", padding: "4px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f0f1ee")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
          >
            <Icon name="close" size={20} />
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div>
            <label style={labelStyle}>TITLE *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => { setTitle(e.target.value); setError(""); }}
              placeholder="e.g. 1972 Lecture on Colonizability"
              style={inputStyle}
              onFocus={(e) => (e.currentTarget.style.borderColor = "#0b4335")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(192,201,195,0.6)")}
            />
          </div>

          <div>
            <label style={labelStyle}>DESCRIPTION</label>
            <textarea
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="Brief description of this media item"
              rows={2}
              style={{ ...inputStyle, resize: "vertical" }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "#0b4335")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(192,201,195,0.6)")}
            />
          </div>

          <div>
            <label style={labelStyle}>FILE / LINK</label>
            <div style={{ display: "flex", borderRadius: "8px", overflow: "hidden", border: "1.5px solid rgba(192,201,195,0.5)", marginBottom: "16px" }}>
              <button style={modeTabStyle(accessMode === "none")} onClick={() => { setAccessMode("none"); setError(""); }}>
                <Icon name="block" size={13} /> None
              </button>
              <button
                style={{ ...modeTabStyle(accessMode === "upload"), borderLeft: "1px solid rgba(192,201,195,0.5)", borderRight: "1px solid rgba(192,201,195,0.5)" }}
                onClick={() => { setAccessMode("upload"); setError(""); }}
              >
                <Icon name="upload_file" size={13} /> Upload File
              </button>
              <button style={modeTabStyle(accessMode === "link")} onClick={() => { setAccessMode("link"); setError(""); }}>
                <Icon name="link" size={13} /> Paste Link
              </button>
            </div>

            {accessMode === "upload" && (
              <UploadZone
                file={uploadedFile}
                onFile={(f) => { setUploadedFile(f); setError(""); }}
                onRemove={() => setUploadedFile(null)}
                accept=".pdf,.mp3,.wav,.ogg,.m4a,.mp4,.webm,.avi,audio/*,video/*,application/pdf"
                hint="PDF, Audio (MP3/WAV), Video (MP4/WebM) — up to 100 MB"
              />
            )}

            {accessMode === "link" && (
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#c0c9c3", display: "flex", alignItems: "center" }}>
                  <Icon name="link" size={16} />
                </span>
                <input
                  type="url"
                  value={linkUrl}
                  onChange={(e) => { setLinkUrl(e.target.value); setError(""); }}
                  placeholder="https://youtube.com/watch?v=… or direct file URL"
                  style={{ ...inputStyle, paddingLeft: "36px" }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "#0b4335")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(192,201,195,0.6)")}
                />
              </div>
            )}

            {accessMode === "none" && (
              <p style={{ fontSize: "12px", color: "#c0c9c3", fontStyle: "italic", margin: 0 }}>
                No file will be attached. Scholars can still see the title and description.
              </p>
            )}
          </div>

          {error && (
            <p style={{ ...MONO, fontSize: "10px", color: "#b3261e", margin: 0, display: "flex", alignItems: "center", gap: "6px" }}>
              <Icon name="error" size={13} /> {error}
            </p>
          )}
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "32px", paddingTop: "24px", borderTop: "1px solid rgba(192,201,195,0.3)" }}>
          <HoverBtn onClick={onClose} style={{ borderColor: "#c0c9c3", color: "#707974" }}>Cancel</HoverBtn>
          <button
            onClick={handleSubmit}
            style={{ ...BTN_PRIMARY, backgroundColor: "#0b4335", color: "#fff", padding: "8px 20px", fontSize: "11px" }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#285b4b")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#0b4335")}
          >
            <Icon name="check" size={14} />
            ADD MEDIA
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   REPORT DROPDOWN
───────────────────────────────────────────── */
interface ReportDropdownProps {
  onReport: (reason: string) => void;
  onClose: () => void;
}

function ReportDropdown({ onReport, onClose }: ReportDropdownProps) {
  const reasons = ["Spam", "Misinformation", "Off-topic", "Harassment", "Other"];
  return (
    <div
      style={{
        position: "absolute", top: "calc(100% + 6px)", right: 0, zIndex: 100,
        backgroundColor: "#fff",
        border: "1px solid rgba(192,201,195,0.5)",
        borderRadius: "8px",
        boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
        minWidth: "160px",
        overflow: "hidden",
      }}
    >
      <div style={{ padding: "8px 12px 6px", borderBottom: "1px solid #f0f1ee" }}>
        <span style={{ ...MONO, fontSize: "9px", color: "#707974", letterSpacing: "0.1em" }}>REPORT REASON</span>
      </div>
      {reasons.map((r) => (
        <button
          key={r}
          onClick={() => { onReport(r); onClose(); }}
          style={{
            display: "block", width: "100%", textAlign: "left",
            padding: "8px 14px", fontSize: "12px",
            color: r === "Harassment" ? "#b3261e" : "#404945",
            background: "none", border: "none", cursor: "pointer",
            transition: "background 0.12s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f3f4f1")}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
        >
          {r}
        </button>
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────
   SINGLE COMMENT CARD
───────────────────────────────────────────── */
interface CommentCardProps {
  comment: Comment;
  lang: Language;
  t: UITranslation;
  votedIds: VotedIds;
  onVote: (id: number) => void;
  onAddReply: (parentId: number, text: string) => void;
  isReply?: boolean;
}

function CommentCard({ comment: c, lang, t, votedIds, onVote, onAddReply, isReply = false }: CommentCardProps) {
  const [replyOpen, setReplyOpen]     = useState(false);
  const [replyDraft, setReplyDraft]   = useState("");
  const [reportOpen, setReportOpen]   = useState(false);
  const [reported, setReported]       = useState(false);

  const sendLabel = lang === "AR" ? "إرسال" : lang === "FR" ? "ENVOYER" : "SEND";

  const handleReport = (reason: string) => {
    setReported(true);
    console.info(`Comment ${c.id} reported as: ${reason}`);
  };

  // close report dropdown on outside click
  const reportRef = useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    if (!reportOpen) return;
    const handler = (e: MouseEvent) => {
      if (reportRef.current && !reportRef.current.contains(e.target as Node)) {
        setReportOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [reportOpen]);

  return (
    <div style={{
      backgroundColor: "#fff",
      border: "1.5px solid rgba(192,201,195,0.4)",
      borderRadius: "12px",
      padding: isReply ? "14px 18px" : "20px 24px",
      marginLeft: isReply ? "40px" : 0,
    }}>
      {/* Header row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          {/* Avatar */}
          <div style={{
            width: isReply ? "28px" : "32px", height: isReply ? "28px" : "32px",
            borderRadius: "50%", backgroundColor: "#e7e8e6",
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            <Icon name="person" size={isReply ? 14 : 16} />
          </div>
          <span style={{ fontSize: "13px", fontWeight: 700, color: "#191c1b" }}>{c.author}</span>
          {c.role && (
            <span style={{ ...MONO, fontSize: "9px", backgroundColor: "rgba(11,67,53,0.08)", color: "#0b4335", padding: "2px 8px", borderRadius: "4px", fontWeight: 700 }}>
              {c.role}
            </span>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ ...MONO, fontSize: "10px", color: "#c0c9c3", whiteSpace: "nowrap" }}>{c.time}</span>

          {/* Report button + dropdown */}
          {!reported ? (
            <div ref={reportRef} style={{ position: "relative" }}>
              <button
                onClick={() => setReportOpen((v) => !v)}
                title={t.report}
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  color: "#c0c9c3", display: "flex", alignItems: "center",
                  padding: "2px", borderRadius: "4px",
                  transition: "color 0.15s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#b3261e")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#c0c9c3")}
              >
                <Icon name="flag" size={14} />
              </button>
              {reportOpen && (
                <ReportDropdown onReport={handleReport} onClose={() => setReportOpen(false)} />
              )}
            </div>
          ) : (
            <span style={{ ...MONO, fontSize: "9px", color: "#b3261e", opacity: 0.7 }}>Reported</span>
          )}
        </div>
      </div>

      {/* Text */}
      <p style={{ fontSize: "13px", color: "#404945", lineHeight: 1.65, margin: "0 0 12px" }}>
        {c.text}
      </p>

      {/* Actions */}
      <div style={{ display: "flex", gap: "20px", alignItems: "center" }}>
        {!isReply && (
          <button
            className="action-link"
            onClick={() => setReplyOpen((v) => !v)}
          >
            <Icon name="reply" size={14} /> {t.reply}
          </button>
        )}
        <button
          className="action-link"
          onClick={() => onVote(c.id)}
          style={{ color: votedIds[c.id] ? "#0b4335" : "#707974", fontWeight: votedIds[c.id] ? 700 : 400 }}
        >
          <Icon name="thumb_up" size={13} /> {t.vote} ({c.votes})
        </button>
      </div>

      {/* Inline reply composer */}
      {replyOpen && !isReply && (
        <div style={{ marginTop: "14px", paddingTop: "14px", borderTop: "1px solid #f0f1ee" }}>
          <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
            <div style={{ width: "28px", height: "28px", borderRadius: "50%", flexShrink: 0, backgroundColor: "#e7e8e6", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon name="person" size={14} />
            </div>
            <div style={{ flex: 1, border: "1.5px solid rgba(192,201,195,0.5)", borderRadius: "10px", backgroundColor: "#f9faf7", overflow: "hidden" }}>
              <textarea
                autoFocus
                value={replyDraft}
                onChange={(e) => setReplyDraft(e.target.value)}
                placeholder={`${t.reply.toLowerCase() === "reply" ? "Reply to" : "رد على"} ${c.author}…`}
                rows={2}
                style={{ width: "100%", border: "none", outline: "none", resize: "none", padding: "10px 14px", fontSize: "13px", color: "#191c1b", fontFamily: "'Source Sans 3', sans-serif", backgroundColor: "transparent" }}
              />
              <div style={{ display: "flex", justifyContent: "flex-end", padding: "6px 10px", borderTop: "1px solid #f0f1ee", gap: "8px" }}>
                <button
                  onClick={() => { setReplyOpen(false); setReplyDraft(""); }}
                  style={{ ...MONO, fontSize: "10px", color: "#707974", background: "none", border: "none", cursor: "pointer" }}
                >
                  CANCEL
                </button>
                <button
                  onClick={() => {
                    if (!replyDraft.trim()) return;
                    onAddReply(c.id, replyDraft.trim());
                    setReplyDraft("");
                    setReplyOpen(false);
                  }}
                  style={{ display: "flex", alignItems: "center", gap: "5px", backgroundColor: "#0b4335", color: "#fff", border: "none", borderRadius: "6px", padding: "6px 14px", cursor: "pointer", fontSize: "10px", fontWeight: 700, letterSpacing: "0.06em", fontFamily: "'JetBrains Mono', monospace" }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#285b4b")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#0b4335")}
                >
                  <Icon name="send" size={12} /> {sendLabel}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Nested replies */}
      {!isReply && c.replies && c.replies.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "14px" }}>
          {c.replies.map((r) => (
            <CommentCard
              key={r.id}
              comment={r}
              lang={lang}
              t={t}
              votedIds={votedIds}
              onVote={onVote}
              onAddReply={onAddReply}
              isReply
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   DISCUSSION SECTION
───────────────────────────────────────────── */
function DiscussionSection({ lang, t }: { lang: Language; t: UITranslation }) {
  const [commentsByLang, setCommentsByLang] = useState<CommentsByLang>({
    EN: SEED_COMMENTS.EN.map((c) => ({ ...c, replies: [] })),
    AR: SEED_COMMENTS.AR.map((c) => ({ ...c, replies: [] })),
    FR: [],
  });
  const [draftByLang, setDraftByLang] = useState<DraftByLang>({ EN: "", AR: "", FR: "" });
  const [votedIds, setVotedIds] = useState<VotedIds>({});

  const isRTL  = lang === "AR";
  const comments = commentsByLang[lang];
  const draft    = draftByLang[lang];
  const setDraft = (val: string) => setDraftByLang((prev) => ({ ...prev, [lang]: val }));

  const sendLabel = lang === "AR" ? "إرسال" : lang === "FR" ? "ENVOYER" : "SEND";

  const submitComment = () => {
    if (!draft.trim()) return;
    const newComment: Comment = {
      id: Date.now(),
      author: "You",
      role: null,
      text: draft.trim(),
      time: "just now",
      votes: 0,
      replies: [],
    };
    setCommentsByLang((prev) => ({ ...prev, [lang]: [...prev[lang], newComment] }));
    setDraft("");
  };

  const handleVote = (id: number) => {
    if (votedIds[id]) return;
    setVotedIds((prev) => ({ ...prev, [id]: true }));
    setCommentsByLang((prev) => ({
      ...prev,
      [lang]: prev[lang].map((c) => {
        if (c.id === id) return { ...c, votes: c.votes + 1 };
        // also check replies
        return {
          ...c,
          replies: (c.replies ?? []).map((r) => r.id === id ? { ...r, votes: r.votes + 1 } : r),
        };
      }),
    }));
  };

  const handleAddReply = (parentId: number, text: string) => {
    const reply: Comment = {
      id: Date.now(),
      author: "You",
      role: null,
      text,
      time: "just now",
      votes: 0,
      replies: [],
    };
    setCommentsByLang((prev) => ({
      ...prev,
      [lang]: prev[lang].map((c) =>
        c.id === parentId ? { ...c, replies: [...(c.replies ?? []), reply] } : c
      ),
    }));
  };

  return (
    <section style={{ marginTop: "80px", paddingTop: "40px", borderTop: "1px solid rgba(192,201,195,0.4)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px" }}>
        <h2 style={{ ...SERIF, fontSize: "22px", fontWeight: 700, color: "#0b4335", margin: 0, display: "flex", alignItems: "center", gap: "10px" }}>
          <Icon name="forum" size={22} />
          {t.academicDiscussion}
        </h2>
        <span style={{
          ...MONO, fontSize: "9px", fontWeight: 700, letterSpacing: "0.12em",
          padding: "4px 10px", borderRadius: "6px",
          backgroundColor: "rgba(11,67,53,0.08)", color: "#0b4335",
          border: "1px solid rgba(11,67,53,0.15)",
        }}>
          {LANG_LABELS[lang].toUpperCase()}
        </span>
      </div>

      <div style={{ maxWidth: "800px", display: "flex", flexDirection: "column", gap: "14px" }} dir={isRTL ? "rtl" : "ltr"}>
        {/* Empty state */}
        {comments.length === 0 && (
          <div style={{
            display: "flex", flexDirection: "column", alignItems: "center", gap: "12px",
            padding: "48px 32px", textAlign: "center",
            border: "2px dashed #c0c9c3", borderRadius: "12px",
          }}>
            <Icon name="chat_bubble_outline" size={36} />
            <p style={{ color: "#707974", fontSize: "14px", margin: 0 }}>{t.noDiscussion}</p>
            <span style={{ ...MONO, fontSize: "10px", color: "#0b4335", fontWeight: 700, cursor: "pointer", textDecoration: "underline", textUnderlineOffset: "3px" }}>
              {t.startDiscussion}
            </span>
          </div>
        )}

        {/* Comment cards */}
        {comments.map((c) => (
          <CommentCard
            key={c.id}
            comment={c}
            lang={lang}
            t={t}
            votedIds={votedIds}
            onVote={handleVote}
            onAddReply={handleAddReply}
          />
        ))}

        {/* New comment composer */}
        <div style={{ display: "flex", gap: "14px", alignItems: "flex-start", marginTop: "4px" }}>
          <div style={{ width: "40px", height: "40px", borderRadius: "50%", flexShrink: 0, backgroundColor: "#e7e8e6", display: "flex", alignItems: "center", justifyContent: "center", color: "#707974", marginTop: "2px" }}>
            <Icon name="person" size={20} />
          </div>
          <div style={{ flex: 1, border: "1.5px solid rgba(192,201,195,0.5)", borderRadius: "12px", backgroundColor: "#fff", overflow: "hidden" }}>
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={t.joinDialogue}
              rows={3}
              style={{ width: "100%", border: "none", outline: "none", resize: "none", padding: "14px 16px", fontSize: "13px", color: "#191c1b", fontFamily: "'Source Sans 3', sans-serif", backgroundColor: "transparent" }}
            />
            <div style={{ display: "flex", justifyContent: "flex-end", padding: "8px 12px", borderTop: "1px solid #f0f1ee" }}>
              <button
                onClick={submitComment}
                style={{ display: "flex", alignItems: "center", gap: "6px", backgroundColor: "#0b4335", color: "#fff", border: "none", borderRadius: "8px", padding: "8px 16px", cursor: "pointer", fontSize: "11px", fontWeight: 700, letterSpacing: "0.06em", fontFamily: "'JetBrains Mono', monospace", transition: "background 0.15s" }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#285b4b")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#0b4335")}
              >
                <Icon name="send" size={14} /> {sendLabel}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────── */
const ScholarDetailPage: React.FC = () => {
  const [lang, setLang]           = useState<Language>("EN");
  const [activeTab, setActiveTab] = useState<TabId>("works");
  const [contributorsOpen, setContributorsOpen] = useState(true);
  const [imgGray, setImgGray]     = useState(true);
  const [shareHov, setShareHov]   = useState(false);
  const [linkHov,  setLinkHov]    = useState(false);
  const [works, setWorks]         = useState<Work[]>(SCHOLAR.works);
  const [media, setMedia]         = useState<MediaItem[]>(SCHOLAR.media);
  const [showAddWork, setShowAddWork]   = useState(false);
  const [showAddMedia, setShowAddMedia] = useState(false);
const headerRef = useRef<HTMLDivElement>(null);
const [collapsed, setCollapsed] = useState(false);
const headerHeightRef = useRef(130);

React.useEffect(() => {
 const onScroll = () => {
  const y = window.scrollY;
  setCollapsed(prev => {
    if (prev && y < 10) return false;
    if (!prev && y > 120) return true;
    return prev;
  });
};
  window.addEventListener("scroll", onScroll, { passive: true });
  return () => window.removeEventListener("scroll", onScroll);
}, []);

React.useEffect(() => {
  if (!headerRef.current) return;
  const ro = new ResizeObserver(entries => {
    const h = entries[0].contentRect.height;
    document.documentElement.style.setProperty("--header-h", `${h}px`);
  });
  ro.observe(headerRef.current);
  return () => ro.disconnect();
}, []);
  const t     = T[lang];
  const isRTL = lang === "AR";
  const s     = SCHOLAR;

  const getName     = (): string       => s.name[lang]        ?? s.name.EN        ?? "";
  const getSubtitle = (): string       => s.subtitle[lang]    ?? s.subtitle.EN    ?? "";
  const getQuote    = (): string | null => s.quote[lang]      ?? null;
  const getOverview = (): string | null => s.overviewText[lang] ?? null;
  const getBody     = (): string[] | null => s.body[lang]     ?? null;

  const hasLangContent = !!(getQuote() || getOverview() || (getBody()?.length ?? 0) > 0);
  const tabIds: TabId[] = ["works", "media", "relations", "more"];

  const homeLabel: string     = lang === "AR" ? "الرئيسية" : lang === "FR" ? "Accueil"  : "Home";
  const scholarsLabel: string = lang === "AR" ? "العلماء"  : lang === "FR" ? "Érudits"  : "Scholars";

  const mediaIconName = (type: "pdf" | "audio" | "video"): string =>
    ({ pdf: "article", audio: "mic", video: "movie" }[type]);

  const iconBtnStyle = (hov: boolean): React.CSSProperties => ({
    width: "36px", height: "36px", borderRadius: "50%",
    display: "flex", alignItems: "center", justifyContent: "center",
    backgroundColor: hov ? "#edeeeb" : "transparent",
    color: "#707974", border: "none", cursor: "pointer",
    transition: "background 0.15s",
  });

  return (
    <div
      dir={isRTL ? "rtl" : "ltr"}
      style={{
        fontFamily: "'Source Sans 3', sans-serif",
        minHeight: "100vh",
        backgroundColor: "#f9faf7",
        backgroundImage: "radial-gradient(#e1e3e0 0.5px, transparent 0.5px)",
        backgroundSize: "24px 24px",
        color: "#191c1b",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Source+Serif+4:ital,opsz,wght@0,8..60,200..900;1,8..60,200..900&family=Source+Sans+3:ital,wght@0,200..900;1,200..900&family=JetBrains+Mono:ital,wght@0,100..800;1,100..800&family=Amiri:ital,wght@0,400;0,700;1,400&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap');
        .material-symbols-outlined {
          font-variation-settings: 'FILL' 0,'wght' 400,'GRAD' 0,'opsz' 24;
          font-family: 'Material Symbols Outlined';
          display: inline-block; vertical-align: middle;
        }
        * { box-sizing: border-box; }
        a { text-decoration: none; }
        button { font-family: inherit; background: none; border: none; cursor: pointer; }
        .row-hover:hover { background: #f3f4f1; }
        .card-hover { transition: box-shadow 0.18s, border-color 0.18s; }
        .card-hover:hover { box-shadow: 0 4px 20px rgba(11,67,53,0.1); border-color: rgba(11,67,53,0.3) !important; }
        .tab-btn { padding: 14px 20px; border: none; border-bottom: 2px solid transparent;
          background: transparent; cursor: pointer; white-space: nowrap;
          font-family: 'JetBrains Mono', monospace; font-size: 11px; letter-spacing: 0.1em;
          color: #707974; transition: color 0.15s; }
        .tab-btn:hover { color: #0b4335; }
        .tab-btn.active { border-bottom-color: #0b4335; color: #0b4335; background: rgba(11,67,53,0.04); }
        .person-card:hover .person-name { color: #0b4335; }
        .action-link { background: none; border: none; padding: 0; cursor: pointer;
          font-family: 'JetBrains Mono', monospace; font-size: 10px; font-weight: 700;
          letter-spacing: 0.1em; color: #0b4335; display: inline-flex; align-items: center; gap: 4px; }
        .action-link:hover { text-decoration: underline; }
      `}</style>

      {/* MODALS */}
      {showAddWork && (
        <AddWorkModal
          onClose={() => setShowAddWork(false)}
          onAdd={(work) => setWorks((prev) => [...prev, work])}
          t={t}
        />
      )}
      {showAddMedia && (
        <AddMediaModal
          onClose={() => setShowAddMedia(false)}
          onAdd={(item) => setMedia((prev) => [...prev, item])}
        />
      )}

      {/* ════ HEADER ════ */}
      <header ref={headerRef} style={{
        position: "sticky", top: 0, zIndex: 50,
       backgroundColor: collapsed ? "rgba(249,250,247,0.85)" : "rgba(249,250,247,0.97)",
backdropFilter: collapsed ? "blur(16px)" : "none",
borderBottom: "1px solid rgba(192,201,195,0.3)",
boxShadow: collapsed ? "0 2px 12px rgba(11,67,53,0.08)" : "none",
transition: "all 0.3s ease",
        padding: "16px 0",
      }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 64px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div style={{ marginBottom: collapsed ? 0 : "12px", flex: 1 }}>
              <div style={{
                overflow: "hidden",
                maxHeight: collapsed ? "0px" : "24px",
                opacity: collapsed ? 0 : 1,
                transition: "max-height 0.35s cubic-bezier(0.4,0,0.2,1), opacity 0.25s ease, margin-bottom 0.35s cubic-bezier(0.4,0,0.2,1)",
                
                marginBottom: collapsed ? 0 : "8px",
              }}>
                <button
                  onClick={() => window.history.back()}
                  style={{ background: "none", border: "none", padding: 0, cursor: "pointer", color: "#707974", fontSize: "14px", lineHeight: 1, transition: "color 0.15s" }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "#0b4335")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "#707974")}
                >
                  ←
                </button>
              </div>

              <div style={{ ...MONO, fontSize: "11px", color: "#707974", letterSpacing: "0.05em", marginBottom: collapsed ? "4px" : "8px", direction: isRTL ? "rtl" : "ltr", transition: "margin-bottom 0.25s ease" }}>
                {isRTL ? (
                  <>
                    <span style={{ color: "#0b4335", fontWeight: 700 }}>{getName()}</span>
                    {" < "}
                    <a href="/scholars" style={{ color: "#707974", textDecoration: "none", transition: "color 0.15s" }} onMouseEnter={(e) => (e.currentTarget.style.color = "#0b4335")} onMouseLeave={(e) => (e.currentTarget.style.color = "#707974")}>{scholarsLabel}</a>
                    {" < "}
                    <a href="/" style={{ color: "#707974", textDecoration: "none", transition: "color 0.15s" }} onMouseEnter={(e) => (e.currentTarget.style.color = "#0b4335")} onMouseLeave={(e) => (e.currentTarget.style.color = "#707974")}>{homeLabel}</a>
                  </>
                ) : (
                  <>
                    <a href="/" style={{ color: "#707974", textDecoration: "none", transition: "color 0.15s" }} onMouseEnter={(e) => (e.currentTarget.style.color = "#0b4335")} onMouseLeave={(e) => (e.currentTarget.style.color = "#707974")}>{homeLabel}</a>
                    {" > "}
                    <a href="/scholars" style={{ color: "#707974", textDecoration: "none", transition: "color 0.15s" }} onMouseEnter={(e) => (e.currentTarget.style.color = "#0b4335")} onMouseLeave={(e) => (e.currentTarget.style.color = "#707974")}>{scholarsLabel}</a>
                    {" > "}
                    <span style={{ color: "#0b4335", fontWeight: 700 }}>{getName()}</span>
                  </>
                )}
              </div>

              <div style={{ display: "flex", alignItems: "baseline", gap: "12px", flexWrap: "wrap", marginBottom: "2px" }}>
                <h1 style={{
                  ...SERIF, fontWeight: 700, color: "#0b4335", margin: 0,
                  fontSize: collapsed ? "20px" : "32px",
                  transition: "font-size 0.25s ease",
                }}>{getName()}</h1>
                <div style={{
                  ...MONO, fontSize: "9px", color: "#707974", letterSpacing: "0.18em", opacity: 0.8,
                  display: collapsed ? "none" : "block",
                }}>
                  Created by{" "}<ProfileLink name={s.createdBy} url={s.createdByUrl} />{"  •  "}{s.createdDate}
                </div>
              </div>
              <div style={{
                overflow: "hidden",
                maxHeight: collapsed ? "0px" : "70px",
                opacity: collapsed ? 0 : 1,
                transition: "max-height 0.35s cubic-bezier(0.4,0,0.2,1), opacity 0.25s ease",
              }}>
                <p style={{ ...SERIF, fontSize: "13px", color: "#707974", fontStyle: "italic", margin: "2px 0 4px", lineHeight: 1.4 }}>{getSubtitle()}</p>
                <div style={{ ...MONO, fontSize: "9px", color: "#707974", letterSpacing: "0.18em", opacity: 0.8 }}>
                  Last updated by{" "}<ProfileLink name={s.lastUpdatedBy} url={s.lastUpdatedByUrl} />{"  •  "}{s.lastUpdatedDate}
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: "4px", paddingTop: "4px" }}>
              <button title="Share" onMouseEnter={() => setShareHov(true)} onMouseLeave={() => setShareHov(false)} style={iconBtnStyle(shareHov)}><Icon name="share" size={18} /></button>
              <button title="Copy link" onMouseEnter={() => setLinkHov(true)} onMouseLeave={() => setLinkHov(false)} style={iconBtnStyle(linkHov)}><Icon name="link" size={18} /></button>
            </div>
          </div>

          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            marginTop: collapsed ? "6px" : "8px",
            paddingTop: collapsed ? "6px" : "8px",
            borderTop: "1px solid rgba(192,201,195,0.15)",
            transition: "margin-top 0.35s cubic-bezier(0.4,0,0.2,1), padding-top 0.35s cubic-bezier(0.4,0,0.2,1)",
          }}>
            <div style={{ display: "flex", gap: "4px", padding: "4px 8px", backgroundColor: "rgba(11,67,53,0.04)", border: "1px solid rgba(11,67,53,0.1)", borderRadius: "999px" }}>
              {(["AR", "EN", "FR"] as Language[]).map((l) => {
                const active = lang === l;
                return (
                  <button
                    key={l}
                    onClick={() => setLang(l)}
                    style={{
                      ...MONO, fontSize: "10px", fontWeight: 700, letterSpacing: "0.08em",
                      padding: "4px 12px", borderRadius: "999px", border: "1px solid",
                      borderColor: active ? "#0b4335" : "rgba(192,201,195,0.5)",
                      backgroundColor: active ? "#0b4335" : "transparent",
                      color: active ? "#fff" : "#707974",
                      cursor: "pointer", transition: "all 0.15s",
                    }}
                  >
                    {l === "AR" ? "ARABIC" : l === "EN" ? "ENGLISH" : "FRENCH"}
                  </button>
                );
              })}
            </div>
            <HoverBtn><Icon name="edit_note" size={14} />{t.editBtn}</HoverBtn>
          </div>
        </div>
      </header>

      {/* ════ MAIN ════ */}
      <main style={{ maxWidth: "1280px", margin: "0 auto", padding: "40px 64px 80px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: "48px", marginBottom: "48px" }}>

          {/* LEFT SIDEBAR */}
          <aside>
            <div style={{ backgroundColor: "#fff", border: "1px solid rgba(192,201,195,0.4)", borderRadius: "12px", overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", position: "sticky", top: "140px" }}>
              <div style={{ position: "relative", aspectRatio: "3/4", overflow: "hidden" }}>
                <img
                  alt="Scholar portrait"
                  src={s.image}
                  style={{ width: "100%", height: "100%", objectFit: "cover", filter: imgGray ? "grayscale(100%)" : "grayscale(0%)", transition: "filter 0.6s ease", display: "block" }}
                  onMouseEnter={() => setImgGray(false)}
                  onMouseLeave={() => setImgGray(true)}
                />
                <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "16px", background: "linear-gradient(to top, rgba(0,0,0,0.65), transparent)" }}>
                  <p style={{ ...MONO, fontSize: "9px", color: "#fff", letterSpacing: "0.18em", margin: 0, opacity: 0.9 }}>OFFICIAL SCHOLAR PORTRAIT</p>
                </div>
              </div>

              <div style={{ padding: "20px 20px 24px" }}>
                <p style={{ ...MONO, fontSize: "9px", color: "#0b4335", letterSpacing: "0.2em", marginBottom: "12px", borderBottom: "1px solid rgba(11,67,53,0.1)", paddingBottom: "8px" }}>{t.atAGlance}</p>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <tbody>
                    {([
                      [t.fullName,   s.atAGlance.fullName],
                      [t.born,       s.atAGlance.born],
                      [t.died,       s.atAGlance.died],
                      [t.century,    s.atAGlance.century],
                      [t.region,     s.atAGlance.region],
                      [t.discipline, s.atAGlance.discipline],
                      [t.expertise,  s.atAGlance.expertise],
                    ] as [string, string][]).map(([label, value]) => (
                      <tr key={label} style={{ borderBottom: "1px solid #f0f1ee" }}>
                        <td style={{ ...MONO, padding: "8px 0", fontSize: "10px", color: "#707974", fontWeight: 400, verticalAlign: "top" }}>{label}</td>
                        <td style={{ padding: "8px 0", fontSize: "11px", fontWeight: 700, textAlign: "right", color: "#191c1b", verticalAlign: "top", paddingLeft: "8px" }}>{value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div style={{ marginTop: "20px", paddingTop: "16px", borderTop: "1px solid rgba(11,67,53,0.1)" }}>
                  <button
                    onClick={() => setContributorsOpen(!contributorsOpen)}
                    style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", background: "none", border: "none", cursor: "pointer", padding: 0 }}
                  >
                    <span style={{ ...MONO, fontSize: "9px", color: "#0b4335", letterSpacing: "0.2em", display: "flex", alignItems: "center", gap: "4px" }}>
                      {t.allContributors}<Icon name="expand_more" size={14} />
                    </span>
                    <span style={{ ...MONO, fontSize: "9px", color: "#0b4335", fontWeight: 700, backgroundColor: "rgba(11,67,53,0.05)", padding: "2px 8px", borderRadius: "4px" }}>
                      {s.contributors.length} {t.contributors}
                    </span>
                  </button>
                  {contributorsOpen && (
                    <div style={{ marginTop: "12px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                        <span style={{ ...MONO, fontSize: "9px", color: "#c0c9c3", letterSpacing: "0.08em" }}>{t.contributor}</span>
                        <span style={{ ...MONO, fontSize: "9px", color: "#c0c9c3", letterSpacing: "0.08em" }}>{t.contributions}</span>
                      </div>
                      {s.contributors.map((c) => (
                        <div key={c.name} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px solid #f0f1ee" }}>
                          <ProfileLink name={c.name} url={c.profileUrl ?? "#"} />
                          <span style={{ ...MONO, fontSize: "10px", color: "#0b4335", fontWeight: 700 }}>{c.contributions}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <HoverBtn style={{ width: "100%", justifyContent: "center", marginTop: "20px", padding: "10px 16px" }}>
                  <Icon name="format_quote" size={15} />{t.citePage}
                </HoverBtn>
              </div>
            </div>
          </aside>

          {/* RIGHT: overview */}
          <div>
            {!hasLangContent ? (
              <EmptyLangState lang={lang} t={t} />
            ) : (
              <>
                <section style={{ backgroundColor: "rgba(11,67,53,0.05)", border: "1px solid rgba(11,67,53,0.1)", borderRadius: "16px", padding: "32px", marginBottom: "32px" }}>
                  <p style={{ ...MONO, fontSize: "9px", color: "#0b4335", letterSpacing: "0.2em", marginBottom: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ width: "16px", height: "1px", backgroundColor: "#0b4335", display: "inline-block" }} />
                    {t.overview}
                  </p>
                  {getQuote() && (
                    <blockquote style={{ ...SERIF, fontSize: "18px", fontStyle: "italic", color: "#0b4335", lineHeight: 1.55, margin: "0 0 16px 0" }}>
                      {getQuote()}
                    </blockquote>
                  )}
                  {getOverview() && (
                    <p style={{ fontSize: "14px", color: "#404945", lineHeight: 1.75, margin: 0 }}>{getOverview()}</p>
                  )}
                </section>
                {(getBody() ?? []).map((para, i) => (
                  <p key={i} style={{
                    fontSize: lang === "AR" ? "16px" : "15px",
                    fontFamily: lang === "AR" ? "'Amiri', serif" : undefined,
                    color: "#404945", lineHeight: 1.8, marginBottom: "20px",
                  }}>
                    {para}
                  </p>
                ))}
              </>
            )}
          </div>
        </div>

        {/* ════ TABBED SECTION ════ */}
        <div style={{ borderTop: "1px solid rgba(192,201,195,0.4)", paddingTop: "48px" }}>
          <div style={{ display: "flex", borderBottom: "1.5px solid rgba(192,201,195,0.4)", marginBottom: "32px", position: "sticky", top: "var(--header-h, 130px)", zIndex: 40, willChange: "transform", backgroundColor: "#f9faf7", overflowX: "auto" }}>
            {tabIds.map((id, i) => (
              <button key={id} onClick={() => setActiveTab(id)} className={`tab-btn${activeTab === id ? " active" : ""}`}>
                {t.tabs[i]}
              </button>
            ))}
          </div>

          {/* WORKS TAB */}
          {activeTab === "works" && (
            <div>
              <SharedBanner t={t} />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                <h2 style={{ ...SERIF, fontSize: "24px", fontWeight: 700, color: "#0b4335", margin: 0 }}>{t.bibliographyTitle}</h2>
                <HoverBtn onClick={() => setShowAddWork(true)}>
                  <Icon name="add_circle" size={14} />{t.addWork}
                </HoverBtn>
              </div>
              <div style={{ border: "1px solid rgba(192,201,195,0.4)", borderRadius: "12px", overflow: "hidden", backgroundColor: "#fff" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ backgroundColor: "#f3f4f1", borderBottom: "1.5px solid rgba(192,201,195,0.4)" }}>
                      {[t.colTitle, t.colYear, t.colFormat, t.colAccess].map((col) => (
                        <th key={col} style={{ ...MONO, padding: "12px 16px", textAlign: "left", fontSize: "9px", color: "#707974", letterSpacing: "0.1em", fontWeight: 700 }}>{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {works.map((w, i) => {
                      const { label, icon, color } = getAccessLabel(w);
                      return (
                        <tr key={i} className="row-hover" style={{ borderBottom: "1px solid #f0f1ee", transition: "background 0.12s" }}>
                          <td style={{ ...SERIF, padding: "14px 16px", fontSize: "14px", fontWeight: 700, fontStyle: "italic", color: "#191c1b" }}>{w.title}</td>
                          <td style={{ padding: "14px 16px", fontSize: "13px", color: "#707974" }}>{w.year}</td>
                          <td style={{ padding: "14px 16px" }}>
                            <span style={{
                              ...MONO, fontSize: "9px", fontWeight: 700, padding: "3px 10px", borderRadius: "4px",
                              backgroundColor: w.format === "BOOK" ? "rgba(11,67,53,0.08)" : "#f3f4f1",
                              color: w.format === "BOOK" ? "#0b4335" : "#404945",
                            }}>
                              {w.format}
                            </span>
                          </td>
                          <td style={{ padding: "14px 16px" }}>
                            {w.accessUrl ? (
                              <a href={w.accessUrl} target="_blank" rel="noopener noreferrer" download={w.accessSource === "upload" ? (w.accessFileName ?? true) : undefined} style={{ textDecoration: "none" }}>
                                <HoverBtn style={{ fontSize: "9px", padding: "5px 12px", borderColor: color ?? "#0b4335", color: color ?? "#0b4335" }}>
                                  {icon && <Icon name={icon} size={12} />}
                                  {label}
                                </HoverBtn>
                              </a>
                            ) : (
                              <span style={{ fontSize: "13px", color: "#c0c9c3", fontWeight: 400 }}>—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {works.length === 0 && (
                  <div style={{ padding: "48px 32px", textAlign: "center" }}>
                    <Icon name="menu_book" size={36} />
                    <p style={{ color: "#707974", fontSize: "14px", marginTop: "12px" }}>No works added yet.</p>
                    <button className="action-link" onClick={() => setShowAddWork(true)} style={{ marginTop: "8px" }}>Add the first work →</button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* MEDIA TAB */}
          {activeTab === "media" && (
            <div>
              <SharedBanner t={t} />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px" }}>
                <h2 style={{ ...SERIF, fontSize: "24px", fontWeight: 700, color: "#0b4335", margin: 0 }}>{t.mediaTitle}</h2>
                <HoverBtn onClick={() => setShowAddMedia(true)}>
                  <Icon name="add_circle" size={14} />{t.addMedia}
                </HoverBtn>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "20px" }}>
                {media.map((m, i) => (
                  <div key={i} className="card-hover" style={{ backgroundColor: "#fff", padding: "24px", border: "1.5px solid rgba(192,201,195,0.4)", borderRadius: "12px", display: "flex", flexDirection: "column", cursor: "pointer" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                      <span className="material-symbols-outlined" style={{ fontSize: "32px", color: "#0b4335" }}>{mediaIconName(m.type)}</span>
                      <span style={{ ...MONO, fontSize: "9px", color: "#c0c9c3", letterSpacing: "0.06em" }}>{m.meta}</span>
                    </div>
                    <p style={{ fontSize: "14px", fontWeight: 700, color: "#191c1b", margin: "0 0 8px" }}>{m.title}</p>
                    <p style={{ fontSize: "12px", color: "#707974", lineHeight: 1.55, flex: 1, margin: "0 0 20px" }}>{m.description}</p>
                    {m.accessUrl ? (
                      <a href={m.accessUrl} target="_blank" rel="noopener noreferrer" download={m.accessSource === "upload" ? (m.accessFileName ?? true) : undefined} style={{ textDecoration: "none" }}>
                        <button className="action-link">{m.action} <Icon name={m.actionIcon} size={15} /></button>
                      </a>
                    ) : (
                      <button className="action-link">{m.action} <Icon name={m.actionIcon} size={15} /></button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* RELATIONS TAB */}
          {activeTab === "relations" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                {[
                  { data: s.intellectualLineage, label: t.intellectualLineage, icon: "school", color: "#0b4335" },
                  { data: s.notableDisciples,    label: t.notableDisciples,    icon: "groups", color: "#735c00" },
                ].map(({ data, label, icon, color }) => (
                  <div key={label} style={{ backgroundColor: "#f3f4f1", padding: "28px", borderRadius: "16px", border: "1px solid rgba(192,201,195,0.4)" }}>
                    <h3 style={{ ...MONO, fontSize: "9px", color, letterSpacing: "0.15em", marginBottom: "24px", display: "flex", alignItems: "center", gap: "8px" }}>
                      <Icon name={icon} size={15} />{label}
                    </h3>
                    <div style={{ display: "flex", gap: "24px" }}>
                      {data.map((p) => (
                        <a key={p.name} href={p.profileUrl ?? "#"} className="person-card" style={{ display: "flex", alignItems: "center", gap: "12px", textDecoration: "none" }}>
                          <div style={{ width: "44px", height: "44px", borderRadius: "50%", backgroundColor: p.color, display: "flex", alignItems: "center", justifyContent: "center", color: p.textColor, fontSize: "13px", fontWeight: 700, flexShrink: 0 }}>
                            {p.initials}
                          </div>
                          <div>
                            <p className="person-name" style={{ fontSize: "13px", fontWeight: 700, color: "#191c1b", margin: "0 0 2px", transition: "color 0.15s" }}>{p.name}</p>
                            <p style={{ ...MONO, fontSize: "9px", color: "#c0c9c3", letterSpacing: "0.08em", margin: 0 }}>{p.role}</p>
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div>
                <h3 style={{ ...MONO, fontSize: "9px", color: "#707974", letterSpacing: "0.12em", marginBottom: "16px" }}>{t.relatedByField}</h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "14px" }}>
                  {s.relatedScholars.map((rs, i) => (
                    <div key={i} className="card-hover" style={{ backgroundColor: "#fff", padding: "16px", borderRadius: "8px", border: "1.5px solid rgba(192,201,195,0.4)" }}>
                      <p style={{ ...MONO, fontSize: "9px", color: rs.labelColor, letterSpacing: "0.08em", marginBottom: "6px" }}>{rs.label}</p>
                      <p style={{ fontSize: "14px", fontWeight: 700, color: "#191c1b", marginBottom: "4px" }}>{rs.name}</p>
                      <p style={{ fontSize: "12px", color: "#707974", fontStyle: "italic", margin: 0 }}>{rs.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* REFERENCES & HISTORY TAB */}
          {activeTab === "more" && (
            <div style={{ display: "grid" }}>
              <div>
                <h3 style={{ ...MONO, fontSize: "9px", color: "#707974", letterSpacing: "0.12em", marginBottom: "16px" }}>{t.academicReferences}</h3>
                <ol style={{ paddingLeft: "20px", margin: 0, display: "flex", flexDirection: "column", gap: "16px" }}>
                  {s.academicReferences.map((r, i) => (
                    <li key={i} style={{ ...SERIF, fontSize: "13px", color: "#404945", lineHeight: 1.65 }}>{r.text}</li>
                  ))}
                </ol>
              </div>
              
            </div>
          )}

          {/* RECENT REVISIONS (always visible below tabs) */}
          <section style={{ marginTop: "80px", paddingTop: "40px", borderTop: "1px solid rgba(192,201,195,0.4)" }}>
            <h3 style={{ ...MONO, fontSize: "9px", color: "#707974", letterSpacing: "0.12em", marginBottom: "20px" }}>{t.recentRevisions}</h3>
            <div style={{ maxWidth: "800px", display: "flex", flexDirection: "column", gap: "12px" }}>
              {s.recentRevisions.map((r, i) => (
                <div key={i} style={{ display: "flex", gap: "16px", padding: "10px 0", borderBottom: "1px solid #f0f1ee" }}>
                  <span style={{ ...MONO, fontSize: "10px", color: "#c0c9c3", minWidth: "80px" }}>{r.date}</span>
                  <ProfileLink name={r.author} url={r.authorUrl ?? "#"} />
                  <span style={{ fontSize: "12px", color: "#404945" }}>— {r.action}</span>
                </div>
              ))}
              <button className="action-link" style={{ marginTop: "8px", alignSelf: "flex-start" }}>{t.viewAllEdits}</button>
            </div>
          </section>

          <DiscussionSection lang={lang} t={t} />
        </div>
      </main>
    </div>
  );
};

export default ScholarDetailPage;