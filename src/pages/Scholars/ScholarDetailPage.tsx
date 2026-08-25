import React, { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useLang } from "../../context/LanguageContext"; 
import { scholarsApi } from "../../api/scholarsApi";
import DOMPurify from 'dompurify';

/* ─────────────────────────────────────────────
   BACKEND TYPES (Matches your Prisma JSON)
───────────────────────────────────────────── */
interface BackendAlias { alias_id: number; alias_name: string; }
interface BackendLanguage { language_id: number; code: string; name: string; }
interface BackendRegion { region_id: number; name: string; }
interface BackendScholarDate {
  date_id: number; version_id: number;
  date_type: "birth" | "death"; calendar: "hijri" | "gregorian";
  year: number | null; is_approximate?: boolean; raw_text?: string | null;
}
interface BackendMedia {
  media_id: number; version_id: number;
  file_name: string; file_path: string | null; media_url: string | null;
  source_type: string; file_type: string;
  status: string; uploaded_by: number | null; uploaded_at: string;
  view_count: number; like_count: number;
  title: string; year: number | null; description: string | null;
  users?: { id: number; username: string } | null;
}
interface BackendWork {
  work_id: number; version_id: number; title: string; year: number | null;
  format: string; description: string | null;
  media_url: string | null; file_name: string | null; file_path: string | null;
  source_type: string | null; status: string;
  created_by?: number | null;
  users?: { id: number; username: string } | null;
}
interface BackendVersion {  version_id: number; scholar_id: number; language_id: number;
  canonical_name: string;
  region_id: number | null;
  century_hijri_start: number | null; century_hijri_end: number | null;
  century_gregorian_start: number | null; century_gregorian_end: number | null;
  biography: string;
  image_url: string | null; image_status: string | null;
  status: string; created_by: number | null; created_at: string;
  version_type: "creation" | "edition";
  languages: BackendLanguage;
  regions?: BackendRegion | null;
  scholar_aliases: BackendAlias[];
  scholar_dates?: BackendScholarDate[];
  media?: BackendMedia[];
  internal_links: any[];
  scholar_disciplines?: { discipline_id: number; disciplines: { discipline_id: number; name: string; language_id: number } }[];
  comments?: { comment_id: number; content: string; created_at: string; users: { id: number; username: string } }[];
  
  // ✅ ADDED: Relationships now belong to the version
  scholar_relationships_as_source?: BackendRelation[];
}
interface BackendDiscipline {
  scholar_id: number;
  discipline_id: number;
  disciplines: { discipline_id: number; name: string; language_id: number; created_at: string };
}
interface BackendBibliography { bibliography_id: number; title: string; citation: string; url: string | null; }
interface BackendComment {
  comment_id: number; content: string; created_at: string;
  users: { id: number; username: string };
}
interface BackendContributor { users: { id: number; username: string }; }

interface BackendRelation {
  relation_id: number;
  relation_type: string;
  related_scholar_version: {
    scholar_id: number;
    version_id: number;
    canonical_name: string;
    languages: { code: string };
  };
}
interface BackendReference { reference_id: number; title: string; citation: string; url: string | null; }
interface BackendHistory {
  version_id: number; status: string; created_at: string;
  users: { id: number; username: string } | null;
}

interface BackendScholarResponse {
  success: boolean;
  data: {
    scholar_id: number; created_by: number | null; created_at: string;
    scholar_versions: BackendVersion[];
    bibliography: BackendBibliography[];
    works: BackendWork[];
    scholar_contributors: BackendContributor[];
        scholar_relationships_as_source: BackendRelation[];
        references: BackendReference[];
    history: BackendHistory[];
    available_languages: BackendLanguage[];
  };
}

/* ─────────────────────────────────────────────
   UI TYPES
───────────────────────────────────────────── */
type Language = "EN" | "AR" | "FR";
type TabId = "works" | "media" | "relations" | "more";

interface Contributor { name: string; contributions: number; profileUrl?: string; }
interface Work {
  title: string; year: number; format: "BOOK" | "ARTICLE" | "TREATISE" | "MANUSCRIPT" | "LECTURE" | "SERMON" | "FATWA" | "POEM" | "LETTER" | "COMMENTARY" | "TRANSLATION" | "RESEARCH" | "COURSE" | "DEVICE" | "INVENTION" | "SOFTWARE" | "MAP" | "OTHER";
  digitalAccess?: "pdf" | "audio" | "file" | null;
  accessUrl?: string; accessFileName?: string; accessSource?: "upload" | "link";
  uploadedBy?: string; uploadedByUrl?: string;
}
interface MediaItem {
  type: "pdf" | "audio" | "video"; title: string; description: string;
  viewCount: number; likeCount: number; action: string; actionIcon: string;
  accessUrl?: string; accessSource?: "upload" | "link"; accessFileName?: string;
  uploadedBy?: string; uploadedByUrl?: string;
}
interface RelatedPerson {
  initials: string; color: string; textColor: string; name: string; role: string; profileUrl?: string;
}
interface RelatedScholar { labelColor: string; label: string; name: string; description: string; }
interface Reference { 
  title: string; citation: string; url: string | null;
}
interface RecentRevision { date: string; author: string; action: string; authorUrl?: string; }
interface RevisionEntry { author: string; date: string; description: string; isPrimary: boolean; }

interface LangContent<T> { EN?: T; AR?: T; FR?: T; }

interface ScholarDetail {
  id: number; 
  versionId: number;
  name: LangContent<string>; subtitle: LangContent<string>;
  createdBy: string; createdByUrl: string; createdDate: string;
  lastUpdatedBy?: string; lastUpdatedByUrl?: string; lastUpdatedDate?: string;
  image: string;
  overviewText: LangContent<string>;
  body: LangContent<string[]>;
  atAGlance: { fullName: string; born: string; died: string; century: string; region: string; discipline: string; };
  contributors: Contributor[]; works: Work[]; media: MediaItem[];
  intellectualLineage: RelatedPerson[]; notableDisciples: RelatedPerson[];
  relatedScholars: RelatedScholar[]; academicReferences: Reference[];
  revisionHistory: RevisionEntry[]; recentRevisions: RecentRevision[];
  comments: Comment[];
}

interface Comment {
  id: number; author: string; role: string | null; text: string;
  time: string; votes: number; replies?: Comment[];
}
type CommentsByLang = Record<Language, Comment[]>;
type DraftByLang = Record<Language, string>;
type VotedIds = Record<number, boolean>;

interface UITranslation {
  overview: string; atAGlance: string; fullName: string; born: string; died: string;
  century: string; region: string; discipline: string;
  allContributors: string; contributor: string; contributions: string; contributors: string;
  tabs: string[]; editBtn: string; bibliographyTitle: string;
  colTitle: string; colYear: string; colFormat: string; colAccess: string;
  mediaTitle: string; addMedia: string; intellectualLineage: string;
  notableDisciples: string; relatedByField: string; academicReferences: string;
  recentRevisions: string; viewAllEdits: string; academicDiscussion: string;
  joinDialogue: string; reply: string; vote: string; report: string;
  noContent: string; noDiscussion: string; startDiscussion: string;
  contribute: string; createdBy: string; lastUpdated: string; sharedNote: string; addWork: string;
  addNewWork: string; addMediaModal: string; title: string; year: string; format: string;
  digitalAccess: string; none: string; uploadFile: string; pasteLink: string;
  noFileAttached: string; cancel: string; addWorkBtn: string; addMediaBtn: string;
  description: string; fileLink: string; noFile: string;
  workTitlePlaceholder: string; yearPlaceholder: string; mediaTitlePlaceholder: string;
  descriptionPlaceholder: string; urlPlaceholder: string;
  book: string; manuscript: string; article: string;
  titleRequired: string; validYear: string; urlRequired: string; fileRequired: string;
}

/* ─────────────────────────────────────────────
   UI TRANSLATIONS
───────────────────────────────────────────── */
const T: Record<Language, UITranslation> = {
  EN: {
    overview: "OVERVIEW", atAGlance: "AT A GLANCE", fullName: "Full Name", born: "Born", died: "Died",
    century: "Century", region: "Region", discipline: "Discipline",
    allContributors: "ALL CONTRIBUTORS", contributor: "CONTRIBUTOR", contributions: "CONTRIBUTIONS",
    contributors: "Contributors", 
    tabs: ["WORKS", "MEDIA", "RELATIONS", "REFERENCES"], editBtn: "EDIT ENGLISH",
    bibliographyTitle: "Bibliography", colTitle: "TITLE", colYear: "YEAR", colFormat: "FORMAT", colAccess: "DIGITAL ACCESS",
    mediaTitle: "Integrated Media Library", addMedia: "ADD MEDIA", intellectualLineage: "Intellectual Lineage",
    notableDisciples: "Notable Disciples", relatedByField: "Related Scholars by Field",
    academicReferences: "Academic References", recentRevisions: "Recent Revisions",
    viewAllEdits: "View all edits", academicDiscussion: "Academic Discussion",
    joinDialogue: "Join the scholarly dialogue in English...", reply: "REPLY", vote: "VOTE", report: "REPORT",
    noContent: "This page has not yet been contributed in", noDiscussion: "No discussion yet in English.",
    startDiscussion: "Start the conversation →", contribute: "Contribute now →",
    createdBy: "CREATED BY", lastUpdated: "LAST UPDATED BY", sharedNote: "Shared across all languages", addWork: "ADD WORK",
    addNewWork: "Add New Work", addMediaModal: "Add Media", title: "TITLE", year: "YEAR", format: "FORMAT",
    digitalAccess: "DIGITAL ACCESS", none: "None", uploadFile: "Upload File", pasteLink: "Paste Link",
    noFileAttached: "No digital file will be attached.", cancel: "Cancel", addWorkBtn: "ADD WORK", addMediaBtn: "ADD MEDIA",
    description: "DESCRIPTION", fileLink: "FILE / LINK", noFile: "No file will be attached.",
    workTitlePlaceholder: "e.g. The Problem of Culture", yearPlaceholder: "e.g. 1959",
    mediaTitlePlaceholder: "e.g. 1972 Lecture on Colonizability", descriptionPlaceholder: "Brief description",
    urlPlaceholder: "https://archive.org/details/…",
    book: "Book", manuscript: "Manuscript", article: "Article",
    titleRequired: "Title is required.", validYear: "Please enter a valid year.",
    urlRequired: "Please enter a URL.", fileRequired: "Please upload a file.",
  },
  AR: {
    overview: "نظرة عامة", atAGlance: "لمحة سريعة", fullName: "الاسم الكامل", born: "الميلاد", died: "الوفاة",
    century: "القرن", region: "المنطقة", discipline: "التخصص",
    allContributors: "جميع المساهمين", contributor: "المساهم", contributions: "المساهمات",
    contributors: "مساهمون", 
    tabs: ["الأعمال", "الوسائط", "العلاقات", "المراجع"], editBtn: "تعديل العربية",
    bibliographyTitle: "قائمة المؤلفات", colTitle: "العنوان", colYear: "السنة", colFormat: "الصيغة", colAccess: "الوصول الرقمي",
    mediaTitle: "مكتبة الوسائط المتكاملة", addMedia: "إضافة وسائط", intellectualLineage: "السلسلة الفكرية",
    notableDisciples: "أبرز التلامذة", relatedByField: "علماء ذوو صلة بالمجال",
    academicReferences: "المراجع الأكاديمية", recentRevisions: "أحدث المراجعات",
    viewAllEdits: "عرض كل التعديلات", academicDiscussion: "النقاش الأكاديمي",
    joinDialogue: "انضم إلى الحوار العلمي بالعربية...", reply: "ردّ", vote: "تصويت", report: "إبلاغ",
    noContent: "لم يتم المساهمة في هذه الصفحة بعد باللغة", noDiscussion: "لا توجد نقاشات بالعربية بعد.",
    startDiscussion: "ابدأ المحادثة →", contribute: "ساهم الآن →",
    createdBy: "أنشأه", lastUpdated: "آخر تحديث بواسطة", sharedNote: "مشترك بين جميع اللغات", addWork: "إضافة عمل",
    addNewWork: "إضافة عمل جديد", addMediaModal: "إضافة وسائط", title: "العنوان", year: "السنة", format: "الصيغة",
    digitalAccess: "الوصول الرقمي", none: "بدون", uploadFile: "رفع ملف", pasteLink: "لصق رابط",
    noFileAttached: "لن يتم إرفاق أي ملف رقمي.", cancel: "إلغاء", addWorkBtn: "إضافة عمل", addMediaBtn: "إضافة وسائط",
    description: "الوصف", fileLink: "ملف / رابط", noFile: "لن يتم إرفاق أي ملف.",
    workTitlePlaceholder: "مثال: مشكلة الثقافة", yearPlaceholder: "مثال: 1959",
    mediaTitlePlaceholder: "مثال: محاضرة 1972 عن القابلية للاستعمار", descriptionPlaceholder: "وصف موجز",
    urlPlaceholder: "https://archive.org/details/…",
    book: "كتاب", manuscript: "مخطوطة", article: "مقالة",
    titleRequired: "العنوان مطلوب.", validYear: "الرجاء إدخال سنة صحيحة.",
    urlRequired: "الرجاء إدخال رابط.", fileRequired: "الرجاء رفع ملف.",
  },
  FR: {
    overview: "APERÇU", atAGlance: "EN UN COUP D'ŒIL", fullName: "Nom complet", born: "Né", died: "Décédé",
    century: "Siècle", region: "Région", discipline: "Discipline",
    allContributors: "TOUS LES CONTRIBUTEURS", contributor: "CONTRIBUTEUR", contributions: "CONTRIBUTIONS",
    contributors: "Contributeurs",
    tabs: ["ŒUVRES", "MÉDIAS", "RELATIONS", "RÉFÉRENCES"], editBtn: "MODIFIER FRANÇAIS",
    bibliographyTitle: "Bibliographie", colTitle: "TITRE", colYear: "ANNÉE", colFormat: "FORMAT", colAccess: "ACCÈS NUMÉRIQUE",
    mediaTitle: "Médiathèque Intégrée", addMedia: "AJOUTER MÉDIA", intellectualLineage: "LIGNÉE INTELLECTUELLE",
    notableDisciples: "DISCIPLES NOTABLES", relatedByField: "SAVANTS LIÉS PAR DOMAINE",
    academicReferences: "RÉFÉRENCES ACADÉMIQUES", recentRevisions: "RÉVISIONS RÉCENTES",
    viewAllEdits: "VOIR TOUTES LES MODIFICATIONS", academicDiscussion: "Discussion Académique",
    joinDialogue: "Rejoindre le dialogue savant en français...", reply: "RÉPONDRE", vote: "VOTER", report: "SIGNALER",
    noContent: "Cette page n'a pas encore été contribuée en", noDiscussion: "Aucune discussion en français pour l'instant.",
    startDiscussion: "Démarrer la conversation →", contribute: "Contribuer maintenant →",
    createdBy: "CRÉÉ PAR", lastUpdated: "MIS À JOUR PAR", sharedNote: "Partagé entre toutes les langues", addWork: "AJOUTER ŒUVRE",
    addNewWork: "Ajouter une nouvelle œuvre", addMediaModal: "Ajouter un média", title: "TITRE", year: "ANNÉE", format: "FORMAT",
    digitalAccess: "ACCÈS NUMÉRIQUE", none: "Aucun", uploadFile: "Télécharger un fichier", pasteLink: "Coller un lien",
    noFileAttached: "Aucun fichier numérique ne sera joint.", cancel: "Annuler", addWorkBtn: "AJOUTER ŒUVRE", addMediaBtn: "AJOUTER MÉDIA",
    description: "DESCRIPTION", fileLink: "FICHIER / LIEN", noFile: "Aucun fichier ne sera joint.",
    workTitlePlaceholder: "p. ex. Le Problème de la culture", yearPlaceholder: "p. ex. 1959",
    mediaTitlePlaceholder: "p. ex. Conférence de 1972 sur la colonisabilité", descriptionPlaceholder: "Brève description",
    urlPlaceholder: "https://archive.org/details/…",
    book: "Livre", manuscript: "Manuscrit", article: "Article",
    titleRequired: "Le titre est requis.", validYear: "Veuillez entrer une année valide.",
    urlRequired: "Veuillez entrer une URL.", fileRequired: "Veuillez télécharger un fichier.",
  },
};

const LANG_LABELS: Record<Language, string> = { EN: "English", AR: "العربية", FR: "Français" };
const WORK_FORMATS: Work["format"][] = ["BOOK", "ARTICLE", "TREATISE", "MANUSCRIPT", "LECTURE", "SERMON", "FATWA", "POEM", "LETTER", "COMMENTARY", "TRANSLATION", "RESEARCH", "COURSE", "DEVICE", "INVENTION", "SOFTWARE", "MAP", "OTHER"];

const FORMAT_LABELS: Record<Language, Record<Work["format"], string>> = {
  EN: { BOOK: "Book", ARTICLE: "Article", TREATISE: "Treatise", MANUSCRIPT: "Manuscript", LECTURE: "Lecture", SERMON: "Sermon", FATWA: "Fatwa", POEM: "Poem", LETTER: "Letter", COMMENTARY: "Commentary", TRANSLATION: "Translation", RESEARCH: "Research", COURSE: "Course", DEVICE: "Device", INVENTION: "Invention", SOFTWARE: "Software", MAP: "Map", OTHER: "Other" },
  AR: { BOOK: "كتاب", ARTICLE: "مقالة", TREATISE: "رسالة علمية", MANUSCRIPT: "مخطوطة", LECTURE: "محاضرة", SERMON: "خطبة", FATWA: "فتوى", POEM: "قصيدة", LETTER: "خطاب", COMMENTARY: "شرح", TRANSLATION: "ترجمة", RESEARCH: "بحث", COURSE: "دورة", DEVICE: "جهاز", INVENTION: "اختراع", SOFTWARE: "برمجية", MAP: "خريطة", OTHER: "أخرى" },
  FR: { BOOK: "Livre", ARTICLE: "Article", TREATISE: "Traité", MANUSCRIPT: "Manuscrit", LECTURE: "Conférence", SERMON: "Sermon", FATWA: "Fatwa", POEM: "Poème", LETTER: "Lettre", COMMENTARY: "Commentaire", TRANSLATION: "Traduction", RESEARCH: "Recherche", COURSE: "Cours", DEVICE: "Appareil", INVENTION: "Invention", SOFTWARE: "Logiciel", MAP: "Carte", OTHER: "Autre" },
};

/* ─────────────────────────────────────────────
   DATE / CENTURY HELPERS
───────────────────────────────────────────── */
function formatDate(dates: BackendScholarDate[] | undefined, type: "birth" | "death"): string {
  if (!dates || dates.length === 0) return "";
  const greg = dates.find((d) => d.date_type === type && d.calendar === "gregorian");
  const hijri = dates.find((d) => d.date_type === type && d.calendar === "hijri");
  const gregLabel = greg?.raw_text || (greg?.year != null ? `${greg.year}${greg.is_approximate ? " (approx.)" : ""}` : "");
  const hijriLabel = hijri?.raw_text || (hijri?.year != null ? `${hijri.year} AH` : "");
  return [gregLabel, hijriLabel].filter(Boolean).join(" / ");
}

function formatCentury(start: number | null | undefined, end: number | null | undefined): string {
  if (!start && !end) return "";
  if (start && end && start !== end) return `${start}th–${end}th century`;
  const c = start || end;
  return c ? `${c}th century` : "";
}

/* ─────────────────────────────────────────────
   DATA TRANSFORMER (Backend -> UI)
───────────────────────────────────────────── */
const transformBackendToUI = (data: BackendScholarResponse["data"], lang: Language): ScholarDetail => {
  const versions = data.scholar_versions || [];
  const getVersion = (code: string) => versions.find((v) => v.languages?.code?.toLowerCase() === code.toLowerCase());
  
  const enVersion = getVersion("en");
  const arVersion = getVersion("ar");
  const frVersion = getVersion("fr");
  const activeVersion = getVersion(lang.toLowerCase());
  const fallbackVersion = enVersion || arVersion || frVersion || versions[0];
  
  const splitBio = (bio: string) => {
    if (!bio) return { overview: "", body: [] };
    const parts = bio.split("\n\n");
    return { overview: parts[0], body: parts.slice(1) };
  };

  const enBio = splitBio(enVersion?.biography || "");
  const arBio = splitBio(arVersion?.biography || "");
  const frBio = splitBio(frVersion?.biography || "");

  const history = data.history || [];
  const creator = history.length > 0 ? (history[history.length - 1].users?.username ?? "Unknown") : "Unknown";
  const creatorId = history.length > 0 ? (history[history.length - 1].users?.id ?? 0) : 0;
  const lastUpdater = history.length > 0 ? (history[0].users?.username ?? creator) : creator;
  const lastUpdaterId = history.length > 0 ? (history[0].users?.id ?? creatorId) : creatorId;
  const hasBeenEdited = lastUpdater !== creator || history.length > 1;

  const disciplines = (activeVersion?.scholar_disciplines || [])
    .map((d: any) => d.disciplines?.name)
    .filter(Boolean)
    .join(", ");

    const mapRelations = (rels: any[], color1: string, color2: string) => rels.map((r, i) => {
    const target = r.related_scholar_version;
    const name = target?.canonical_name || `Scholar #${target?.scholar_id}`;
    return {
      initials: name.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase(),
      color: i % 2 === 0 ? color1 : color2, textColor: "#fff", name,
      role: (r.relation_type || "Related").replace("_", " ").toUpperCase(),
      profileUrl: `/scholars/${target?.scholar_id}`
    };
  });

  return {
    id: data.scholar_id,
    versionId: activeVersion?.version_id || fallbackVersion?.version_id || 0,
    name: { EN: enVersion?.canonical_name, AR: arVersion?.canonical_name, FR: frVersion?.canonical_name },
    subtitle: {
      EN: enVersion?.scholar_aliases?.length ? enVersion.scholar_aliases.map((a) => a.alias_name).join(" • ") : undefined,
      AR: arVersion?.scholar_aliases?.length ? arVersion.scholar_aliases.map((a) => a.alias_name).join(" • ") : undefined,
      FR: frVersion?.scholar_aliases?.length ? frVersion.scholar_aliases.map((a) => a.alias_name).join(" • ") : undefined,
    },
    createdBy: creator, createdByUrl: `/profile/${creatorId}`, createdDate: new Date(data.created_at).toLocaleDateString(),
    lastUpdatedBy: hasBeenEdited ? lastUpdater : undefined,
    lastUpdatedByUrl: hasBeenEdited ? `/profile/${lastUpdaterId}` : undefined,
    lastUpdatedDate: hasBeenEdited ? new Date(history[0].created_at).toLocaleDateString() : undefined,
    image: activeVersion?.image_url || fallbackVersion?.image_url || "",
    overviewText: { EN: enBio.overview, AR: arBio.overview, FR: frBio.overview },
    body: { EN: enBio.body, AR: arBio.body, FR: frBio.body },
    atAGlance: {
      fullName: activeVersion?.canonical_name || "",
      born: formatDate(activeVersion?.scholar_dates, "birth"),
      died: formatDate(activeVersion?.scholar_dates, "death"),
      century: formatCentury(activeVersion?.century_gregorian_start, activeVersion?.century_gregorian_end),
      region: activeVersion?.regions?.name || "",
      discipline: disciplines || ""
    },
    contributors: (data.scholar_contributors || []).map((c) => ({ name: c.users?.username || "Unknown", contributions: 1, profileUrl: `/profile/${c.users?.id}` })),
    works: (data.works && data.works.length > 0 ? data.works : (data.bibliography as any[]) || []).map((w: any): Work => {
  const url: string | null = w.media_url || w.file_path || w.url || null;
  const format: Work["format"] = (WORK_FORMATS.includes(w.format) ? w.format : "OTHER");
  return {
    title: w.title, 
    year: w.year || 0, 
    format,
    digitalAccess: url ? getAccessType(url) : null,
    accessUrl: url || undefined,
    accessSource: url ? (w.source_type === "upload" ? "upload" : "link") : undefined,
    
    accessFileName: w.file_name || undefined,
    uploadedBy: w.users?.username,
    uploadedByUrl: w.users?.id ? `/profile/${w.users.id}` : undefined,
  };
}),
    media: versions.flatMap((v) => v.media || []).map((m): MediaItem => {
      const fileType = (m.file_type || "pdf") as MediaItem["type"];
      return {
        type: fileType,
        title: m.title && m.title.trim() !== "" ? m.title : (m.file_name || "Untitled Media"),
        description: m.description || `${(m.file_type || "pdf").toUpperCase()} file`,
        viewCount: m.view_count || 0,
        likeCount: m.like_count || 0,
        action: m.source_type === "upload" ? "DOWNLOAD FILE" : "OPEN LINK",
        actionIcon: m.source_type === "upload" ? "download" : "open_in_new",
        accessUrl: m.media_url || m.file_path || undefined,
        accessSource: m.source_type === "upload" ? "upload" : "link",
        accessFileName: m.file_name || undefined, 
        uploadedBy: m.users?.username,
        uploadedByUrl: m.users?.id ? `/profile/${m.users.id}` : undefined,
      };
    }),
        // ✅ CHANGED: Read relationships from the activeVersion, not the root data object
    intellectualLineage: mapRelations((activeVersion?.scholar_relationships_as_source || []).filter((r: any) => r.relation_type === 'teacher' || r.relation_type === 'historical_influence'), "#0b4335", "#d9dad8"),
    notableDisciples: mapRelations((activeVersion?.scholar_relationships_as_source || []).filter((r: any) => r.relation_type === 'student' || r.relation_type === 'disciple'), "#735c00", "#5c2e29"),
    relatedScholars: [],
    academicReferences: (data.references || []).map((r) => ({ title: r.title, citation: r.citation, url: r.url })),
    revisionHistory: [],
    recentRevisions: history.slice(0, 5).map((h) => ({ date: new Date(h.created_at).toLocaleDateString(), author: h.users?.username || "Unknown", action: `Version ${h.version_id} - ${h.status}`, authorUrl: `/profile/${h.users?.id}` })),
    comments: (activeVersion?.comments || []).map((c: any) => ({
      id: c.comment_id, author: c.users?.username || "Unknown", role: null,
      text: c.content || "", time: new Date(c.created_at).toLocaleDateString(), votes: 0, replies: []
    }))
  };
};

/* ─────────────────────────────────────────────
   SHARED STYLE CONSTANTS & SMALL COMPONENTS
───────────────────────────────────────────── */
const MONO: React.CSSProperties = { fontFamily: "'JetBrains Mono', monospace" };
const SERIF: React.CSSProperties = { fontFamily: "'Source Serif 4', serif" };
const BTN_PRIMARY: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: "6px", padding: "6px 16px",
  border: "1.5px solid #0b4335", borderRadius: "6px", backgroundColor: "transparent", color: "#0b4335",
  fontSize: "10px", fontWeight: 700, letterSpacing: "0.1em", cursor: "pointer", transition: "background 0.15s, color 0.15s", ...MONO,
};

function Icon({ name, size = 20 }: { name: string; size?: number }) {
  return <span className="material-symbols-outlined" style={{ fontSize: `${size}px`, lineHeight: 1, userSelect: "none" }}>{name}</span>;
}

function ProfileLink({ name, url, color = "#0b4335" }: { name: string; url: string; color?: string }) {
  const [hover, setHover] = useState(false);
  return (
    <a href={url} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{ color: hover ? "#285b4b" : color, fontWeight: 600, textDecoration: hover ? "underline" : "none", textUnderlineOffset: "2px", transition: "color 0.15s", cursor: "pointer" }}>
      {name}
    </a>
  );
}

function HoverBtn({ children, onClick, style }: { children: React.ReactNode; onClick?: () => void; style?: React.CSSProperties }) {
  const [hov, setHov] = useState(false);
  return (
    <button onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ ...BTN_PRIMARY, backgroundColor: hov ? "#0b4335" : "transparent", color: hov ? "#fff" : "#0b4335", ...style }}>
      {children}
    </button>
  );
}

function EmptyLangState({ lang, t, onContribute }: { lang: Language; t: UITranslation; onContribute: () => void }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "16px", padding: "64px 32px", textAlign: "center", border: "2px dashed #c0c9c3", borderRadius: "12px", margin: "32px 0" }}>
      <Icon name="translate" size={40} />
      <p style={{ color: "#707974", fontSize: "15px", lineHeight: 1.6 }}>{t.noContent} <strong>{LANG_LABELS[lang]}</strong>.</p>
      <button onClick={onContribute} style={{ background: "none", border: "none", padding: 0, color: "#0b4335", fontWeight: 700, fontSize: "13px", textDecoration: "underline", textUnderlineOffset: "3px", cursor: "pointer" }}>{t.contribute}</button>
    </div>
  );
}

/* ─────────────────────────────────────────────
   MODERN TOAST NOTIFICATION
───────────────────────────────────────────── */
interface ToastProps {
  message: string;
  type: "success" | "error";
  onClose: () => void;
}

function Toast({ message, type, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div style={{
      position: "fixed",
      bottom: "24px",
      right: "24px",
      backgroundColor: type === "success" ? "#0b4335" : "#b3261e",
      color: "#fff",
      padding: "12px 20px",
      borderRadius: "8px",
      boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
      display: "flex",
      alignItems: "center",
      gap: "10px",
      zIndex: 1000,
      animation: "slideUp 0.3s ease-out",
      minWidth: "250px",
      maxWidth: "400px"
    }}>
      <Icon name={type === "success" ? "check_circle" : "error"} size={20} />
      <span style={{ fontSize: "13px", fontWeight: 500, flex: 1 }}>{message}</span>
      <button 
        onClick={onClose} 
        style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", padding: "4px", display: "flex", alignItems: "center" }}
      >
        <Icon name="close" size={16} />
      </button>
      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

/* ─────────────────────────────────────────────
   FILE UTILS & MODALS
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
  if (work.digitalAccess === "audio") return { label: isUpload ? "DOWNLOAD AUDIO" : "LISTEN AUDIO", icon: isUpload ? "download" : "play_circle", color: "#735c00" };
  if (work.digitalAccess === "file") return { label: "DOWNLOAD FILE", icon: "download", color: "#735c00" };
  return { label: isUpload ? "DOWNLOAD PDF" : "VIEW PDF", icon: isUpload ? "download" : "open_in_new" };
}

interface UploadZoneProps { file: File | null; onFile: (f: File) => void; onRemove: () => void; accept?: string; hint?: string; }
function UploadZone({ file, onFile, onRemove, accept, hint }: UploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const handleDrop = (e: React.DragEvent) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files?.[0]; if (f) onFile(f); };
  if (file) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", backgroundColor: "rgba(11,67,53,0.05)", border: "1.5px solid rgba(11,67,53,0.2)", borderRadius: "8px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
          <Icon name={getFileIcon(file.name)} size={20} />
          <span style={{ fontSize: "13px", color: "#191c1b", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{file.name}</span>
          <span style={{ ...MONO, fontSize: "9px", color: "#707974", whiteSpace: "nowrap" }}>{(file.size / 1024 / 1024).toFixed(1)} MB</span>
        </div>
        <button onClick={onRemove} style={{ background: "none", border: "none", cursor: "pointer", color: "#707974", flexShrink: 0, display: "flex", alignItems: "center" }} title="Remove file"><Icon name="close" size={16} /></button>
      </div>
    );
  }
  return (
    <>
      <input ref={inputRef} type="file" accept={accept} style={{ display: "none" }} onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); }} />
      <div onClick={() => inputRef.current?.click()} onDragOver={(e) => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)} onDrop={handleDrop}
        style={{ border: `2px dashed ${dragOver ? "#0b4335" : "rgba(192,201,195,0.7)"}`, borderRadius: "10px", padding: "28px 20px", textAlign: "center", cursor: "pointer", backgroundColor: dragOver ? "rgba(11,67,53,0.04)" : "#fafbf8", transition: "all 0.15s" }}>
        <Icon name="cloud_upload" size={32} />
        <p style={{ fontSize: "13px", color: "#404945", margin: "10px 0 4px", fontWeight: 600 }}>Drop a file here, or <span style={{ color: "#0b4335", textDecoration: "underline" }}>browse</span></p>
        <p style={{ ...MONO, fontSize: "9px", color: "#c0c9c3", margin: 0 }}>{hint ?? "PDF, Audio, Video, ePub, Word — up to 100 MB"}</p>
      </div>
    </>
  );
}

type AccessMode = "none" | "upload" | "link";

/* ─────────────────────────────────────────────
   WORK ACTIONS (View & Download Icons for Table)
───────────────────────────────────────────── */
function WorkActions({ work }: { work: Work }) {
  const [isViewing, setIsViewing] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleView = async (e: React.MouseEvent) => {
    if (!work.accessUrl) return;
    e.preventDefault();
    e.stopPropagation();
    setIsViewing(true);
    try {
      const response = await fetch(work.accessUrl);
      const blob = await response.blob();
      const correctType = work.digitalAccess === 'audio' ? 'audio/mpeg' : 
                          work.digitalAccess === 'file' ? 'video/mp4' : 
                          'application/pdf';
      const typedBlob = new Blob([blob], { type: correctType });
      const blobUrl = URL.createObjectURL(typedBlob);
      window.open(blobUrl, '_blank');
      setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
    } catch (error) {
      console.error('View failed:', error);
      window.open(work.accessUrl, '_blank');
    } finally {
      setIsViewing(false);
    }
  };

  const handleDownload = async (e: React.MouseEvent) => {
    if (!work.accessUrl) return;
    e.preventDefault();
    e.stopPropagation();
    
    setIsDownloading(true);
    try {
      const response = await fetch(work.accessUrl);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      
      // ✅ EXACTLY LIKE MEDIA - Use accessFileName first
      const filename = work.accessFileName || work.title || 'file.pdf';
      link.download = filename;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Download failed:', error);
      window.open(work.accessUrl, '_blank');
    } finally {
      setIsDownloading(false);
    }
  };

  if (!work.accessUrl) {
    return <span style={{ fontSize: "13px", color: "#c0c9c3", fontWeight: 400 }}>—</span>;
  }

  return (
    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
      <button 
        onClick={handleView}
        disabled={isViewing}
        title="View"
        style={{ 
          display: "flex", alignItems: "center", justifyContent: "center",
          width: "32px", height: "32px", borderRadius: "6px",
          border: "1.5px solid #0b4335", backgroundColor: "transparent", color: "#0b4335",
          cursor: isViewing ? "wait" : "pointer", transition: "all 0.15s"
        }}
        onMouseEnter={(e) => { if (!isViewing) e.currentTarget.style.backgroundColor = "rgba(11,67,53,0.05)"; }}
        onMouseLeave={(e) => { if (!isViewing) e.currentTarget.style.backgroundColor = "transparent"; }}
      >
        {isViewing ? <Icon name="hourglass_empty" size={16} /> : <Icon name="visibility" size={18} />}
      </button>

      <button 
        onClick={handleDownload}
        disabled={isDownloading}
        title="Download"
        style={{ 
          display: "flex", alignItems: "center", justifyContent: "center",
          width: "32px", height: "32px", borderRadius: "6px",
          border: "1.5px solid #0b4335", backgroundColor: isDownloading ? "#0b4335" : "transparent", color: isDownloading ? "#fff" : "#0b4335",
          cursor: isDownloading ? "wait" : "pointer", transition: "all 0.15s"
        }}
        onMouseEnter={(e) => { if (!isDownloading) { e.currentTarget.style.backgroundColor = "#0b4335"; e.currentTarget.style.color = "#fff"; } }}
        onMouseLeave={(e) => { if (!isDownloading) { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = "#0b4335"; } }}
      >
        {isDownloading ? <Icon name="hourglass_empty" size={16} /> : <Icon name="download" size={18} />}
      </button>
    </div>
  );
}

/* ─────────────────────────────────────────────
   ADD WORK MODAL
───────────────────────────────────────────── */
interface AddWorkModalProps { 
  onClose: () => void; 
  onAdd: (work: Work) => void; 
  t: UITranslation; 
  lang: Language;
  versionId: number;
  onSuccess: (message: string) => void;
}

function AddWorkModal({ onClose, onAdd, t, lang, versionId, onSuccess }: AddWorkModalProps) {
  const [title, setTitle] = useState(""); 
  const [year, setYear] = useState<string>(""); 
  const [format, setFormat] = useState<Work["format"]>("BOOK");
  const [accessMode, setAccessMode] = useState<AccessMode>("none"); 
  const [linkUrl, setLinkUrl] = useState("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null); 
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const inputStyle: React.CSSProperties = { width: "100%", padding: "10px 14px", border: "1.5px solid rgba(192,201,195,0.6)", borderRadius: "8px", fontSize: "13px", color: "#191c1b", backgroundColor: "#fafbf8", fontFamily: "'Source Sans 3', sans-serif", outline: "none", transition: "border-color 0.15s" };
  const labelStyle: React.CSSProperties = { ...MONO, fontSize: "9px", color: "#707974", letterSpacing: "0.12em", display: "block", marginBottom: "6px" };
  const modeTabStyle = (active: boolean): React.CSSProperties => ({ flex: 1, padding: "9px 0", textAlign: "center" as const, ...MONO, fontSize: "10px", fontWeight: 700, letterSpacing: "0.08em", borderTop: "1.5px solid", borderBottom: "1.5px solid", borderColor: active ? "#0b4335" : "rgba(192,201,195,0.5)", backgroundColor: active ? "#0b4335" : "transparent", color: active ? "#fff" : "#707974", cursor: "pointer", transition: "all 0.15s", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" });
  
  const handleSubmit = async () => {
    if (!title.trim()) { setError(t.titleRequired); return; }
    const yr = parseInt(year, 10);
    if (!year || isNaN(yr) || yr < 600 || yr > new Date().getFullYear()) { setError(t.validYear); return; }
    if (accessMode === "link" && !linkUrl.trim()) { setError(t.urlRequired); return; }
    if (accessMode === "upload" && !uploadedFile) { setError(t.fileRequired); return; }

    setIsSubmitting(true);
    setError("");

        try {
      if (accessMode === "upload" && uploadedFile) {
        const MAX_FILE_SIZE_MB = 100;
        const fileSizeInMB = uploadedFile.size / (1024 * 1024);
        if (fileSizeInMB > MAX_FILE_SIZE_MB) {
          setError(`File is too large (${fileSizeInMB.toFixed(1)} MB). Maximum allowed is ${MAX_FILE_SIZE_MB} MB.`);
          setIsSubmitting(false);
          return;
        }

        const formData = new FormData();
        formData.append("file", uploadedFile);
        formData.append("version_id", versionId.toString());
        formData.append("title", title.trim());
        formData.append("year", year.toString());
        formData.append("format", format);
        
        const response = await scholarsApi.addWork(versionId, formData);
        
        const newWork: Work = {
          title: response.data.title || title.trim(),
          year: yr,
          format,
          digitalAccess: getAccessType(uploadedFile.name),
          accessUrl: response.data.file_path,
          accessFileName: uploadedFile.name,
          accessSource: "upload",
          uploadedBy: response.data.users?.username,
          uploadedByUrl: response.data.users?.id ? `/profile/${response.data.users.id}` : undefined,
        };

        onSuccess("Work added successfully!");
        onClose();

      } else if (accessMode === "link") {
        const workData = {
          version_id: versionId,
          title: title.trim(),
          year: yr,
          format,
          media_url: linkUrl.trim(),
        };

        const response = await scholarsApi.addWorkUrl(versionId, workData);
        
        const newWork: Work = {
          title: response.data.title || title.trim(),
          year: yr,
          format,
          digitalAccess: getAccessType(linkUrl.trim()),
          accessUrl: linkUrl.trim(),
          accessSource: "link",
          uploadedBy: response.data.users?.username,
          uploadedByUrl: response.data.users?.id ? `/profile/${response.data.users.id}` : undefined,
        };

        onSuccess("Work added successfully!");
        onClose();

      } else if (accessMode === "none") {
        // ✅ NEW: Handle the "None" case for Works
        const workData = {
          version_id: versionId,
          title: title.trim(),
          year: yr,
          format,
          // No media_url or file needed
        };

        const response = await scholarsApi.addWorkUrl(versionId, workData);
        
        const newWork: Work = {
          title: response.data.title || title.trim(),
          year: yr,
          format,
          digitalAccess: null,
          accessUrl: undefined,
          accessSource: undefined,
          uploadedBy: response.data.users?.username,
          uploadedByUrl: response.data.users?.id ? `/profile/${response.data.users.id}` : undefined,
        };

        onSuccess("Work added successfully!");
        onClose();
      }
    } catch (err: any) {
      console.error("Failed to add work:", err);
      setError(err.message || "Failed to add work. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };
 
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, backgroundColor: "rgba(25,28,27,0.45)", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ backgroundColor: "#fff", borderRadius: "16px", padding: "36px", width: "520px", maxWidth: "calc(100vw - 32px)", boxShadow: "0 20px 60px rgba(0,0,0,0.18)", border: "1px solid rgba(192,201,195,0.3)", maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px" }}>
          <h2 style={{ ...SERIF, fontSize: "20px", fontWeight: 700, color: "#0b4335", margin: 0, display: "flex", alignItems: "center", gap: "10px" }}><Icon name="add_circle" size={20} /> {t.addNewWork}</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#707974", padding: "4px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }} onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f0f1ee")} onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}><Icon name="close" size={20} /></button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div><label style={labelStyle}>{t.title} *</label><input type="text" value={title} onChange={(e) => { setTitle(e.target.value); setError(""); }} placeholder={t.workTitlePlaceholder} style={inputStyle} onFocus={(e) => (e.currentTarget.style.borderColor = "#0b4335")} onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(192,201,195,0.6)")} /></div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <div><label style={labelStyle}>{t.year} *</label><input type="number" value={year} onChange={(e) => { setYear(e.target.value); setError(""); }} placeholder={t.yearPlaceholder} min={600} max={new Date().getFullYear()} style={inputStyle} onFocus={(e) => (e.currentTarget.style.borderColor = "#0b4335")} onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(192,201,195,0.6)")} /></div>
            <div><label style={labelStyle}>{t.format}</label><select value={format} onChange={(e) => setFormat(e.target.value as Work["format"])} style={{ ...inputStyle, cursor: "pointer" }} onFocus={(e) => (e.currentTarget.style.borderColor = "#0b4335")} onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(192,201,195,0.6)")}>{WORK_FORMATS.map((f) => (<option key={f} value={f}>{FORMAT_LABELS[lang][f]}</option>))}</select></div>
          </div>
          <div>
            <label style={labelStyle}>{t.digitalAccess}</label>
            <div style={{ display: "flex", borderRadius: "8px", overflow: "hidden", border: "1.5px solid rgba(192,201,195,0.5)", marginBottom: "16px" }}>
              <button style={modeTabStyle(accessMode === "none")} onClick={() => { setAccessMode("none"); setError(""); }}><Icon name="block" size={13} /> {t.none}</button>
              <button style={{ ...modeTabStyle(accessMode === "upload"), borderLeft: "1px solid rgba(192,201,195,0.5)", borderRight: "1px solid rgba(192,201,195,0.5)" }} onClick={() => { setAccessMode("upload"); setError(""); }}><Icon name="upload_file" size={13} /> {t.uploadFile}</button>
              <button style={modeTabStyle(accessMode === "link")} onClick={() => { setAccessMode("link"); setError(""); }}><Icon name="link" size={13} /> {t.pasteLink}</button>
            </div>
            {accessMode === "upload" && <UploadZone file={uploadedFile} onFile={(f) => { setUploadedFile(f); setError(""); }} onRemove={() => setUploadedFile(null)} accept=".pdf,.mp3,.wav,.ogg,.m4a,.mp4,.webm,.epub,.doc,.docx,application/pdf,audio/*,video/*" hint="PDF, Audio, Video, ePub, Word — up to 100 MB" />}
            {accessMode === "link" && <div style={{ position: "relative" }}><span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#c0c9c3", display: "flex", alignItems: "center" }}><Icon name="link" size={16} /></span><input type="url" value={linkUrl} onChange={(e) => { setLinkUrl(e.target.value); setError(""); }} placeholder={t.urlPlaceholder} style={{ ...inputStyle, paddingLeft: "36px" }} onFocus={(e) => (e.currentTarget.style.borderColor = "#0b4335")} onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(192,201,195,0.6)")} /></div>}
            {accessMode === "none" && <p style={{ fontSize: "12px", color: "#c0c9c3", fontStyle: "italic", margin: 0 }}>{t.noFileAttached}</p>}
          </div>
          {error && <p style={{ ...MONO, fontSize: "10px", color: "#b3261e", margin: 0, display: "flex", alignItems: "center", gap: "6px" }}><Icon name="error" size={13} /> {error}</p>}
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "32px", paddingTop: "24px", borderTop: "1px solid rgba(192,201,195,0.3)" }}>
          <HoverBtn onClick={onClose} style={{ borderColor: "#c0c9c3", color: "#707974" }}>{t.cancel}</HoverBtn>
          <button 
            onClick={handleSubmit} 
            disabled={isSubmitting}
            style={{ ...BTN_PRIMARY, backgroundColor: isSubmitting ? "#c0c9c3" : "#0b4335", color: "#fff", padding: "8px 20px", fontSize: "11px", cursor: isSubmitting ? "not-allowed" : "pointer", opacity: isSubmitting ? 0.7 : 1 }} 
            onMouseEnter={(e) => { if (!isSubmitting) e.currentTarget.style.backgroundColor = "#285b4b"; }} 
            onMouseLeave={(e) => { if (!isSubmitting) e.currentTarget.style.backgroundColor = "#0b4335"; }}
          >
            {isSubmitting ? <Icon name="hourglass_empty" size={14} /> : <Icon name="check" size={14} />} 
            {isSubmitting ? "SAVING..." : t.addWorkBtn}
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
  t: UITranslation; 
  versionId: number; 
  scholarId: number; 
  onSuccess: (message: string) => void; 
}

function AddMediaModal({ onClose, onAdd, t, versionId, scholarId, onSuccess }: AddMediaModalProps) {
  const [title, setTitle] = useState(""); 
  const [year, setYear] = useState<string>("");
  const [desc, setDesc] = useState(""); 
  const [accessMode, setAccessMode] = useState<AccessMode>("upload");
  const [linkUrl, setLinkUrl] = useState(""); 
  const [uploadedFile, setUploadedFile] = useState<File | null>(null); 
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const inputStyle: React.CSSProperties = { width: "100%", padding: "10px 14px", border: "1.5px solid rgba(192,201,195,0.6)", borderRadius: "8px", fontSize: "13px", color: "#191c1b", backgroundColor: "#fafbf8", fontFamily: "'Source Sans 3', sans-serif", outline: "none", transition: "border-color 0.15s" };
  const labelStyle: React.CSSProperties = { ...MONO, fontSize: "9px", color: "#707974", letterSpacing: "0.12em", display: "block", marginBottom: "6px" };
  const modeTabStyle = (active: boolean): React.CSSProperties => ({ flex: 1, padding: "9px 0", textAlign: "center" as const, ...MONO, fontSize: "10px", fontWeight: 700, letterSpacing: "0.08em", border: "1.5px solid", borderColor: active ? "#0b4335" : "rgba(192,201,195,0.5)", backgroundColor: active ? "#0b4335" : "transparent", color: active ? "#fff" : "#707974", cursor: "pointer", transition: "all 0.15s", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" });

  const handleSubmit = async () => {
    if (!title.trim()) { setError(t.titleRequired); return; }
if (accessMode === "link" && !linkUrl.trim()) { setError(t.urlRequired); return; }
if (accessMode === "upload" && !uploadedFile) { setError(t.fileRequired); return; }

    setIsSubmitting(true);
    setError("");

    const parsedYear = year.trim() ? parseInt(year, 10) : null;

        try {
      if (accessMode === "upload" && uploadedFile) {
        const formData = new FormData();
        formData.append("file", uploadedFile);
        formData.append("version_id", versionId.toString());
        formData.append("title", title.trim());
        formData.append("description", desc.trim());
        if (parsedYear !== null) formData.append("year", parsedYear.toString());

        const response = await scholarsApi.addMedia(versionId, formData);
        
        const mediaItem: MediaItem = {
          type: (uploadedFile.type.includes("audio") ? "audio" : uploadedFile.type.includes("video") ? "video" : "pdf") as MediaItem["type"],
          title: response.data.title || uploadedFile.name,
          description: response.data.description || `${(uploadedFile.size / 1024 / 1024).toFixed(1)} MB`,
          viewCount: response.data.view_count || 0,
          likeCount: response.data.like_count || 0,
          action: uploadedFile.type.includes("audio") ? "PLAY RECORDING" : uploadedFile.type.includes("video") ? "WATCH NOW" : "OPEN DOCUMENT",
          actionIcon: uploadedFile.type.includes("audio") ? "play_circle" : uploadedFile.type.includes("video") ? "open_in_new" : "arrow_forward",
          accessUrl: response.data.media_url || response.data.file_path,
          accessSource: "upload",
          accessFileName: uploadedFile.name,
          uploadedBy: response.data.users?.username,
          uploadedByUrl: response.data.users?.id ? `/profile/${response.data.users.id}` : undefined,
        };
        
        onSuccess("Media added successfully!");
        onClose();

      } else if (accessMode === "link") {
        const mediaData: any = {
          version_id: versionId,
          title: title.trim(),
          description: desc.trim(),
          media_url: linkUrl.trim(),
        };
        if (parsedYear !== null) mediaData.year = parsedYear;

        const response = await scholarsApi.addMediaUrl(versionId, mediaData);
        
        const ext = linkUrl.split(".").pop()?.toLowerCase() ?? "";
        const type: MediaItem["type"] = 
          ["mp3", "wav", "ogg", "m4a"].includes(ext) ? "audio" :
          ["mp4", "webm", "avi", "mov"].includes(ext) || linkUrl.includes("youtube") || linkUrl.includes("vimeo") ? "video" : "pdf";

        const mediaItem: MediaItem = {
          type,
          title: title.trim(),
          description: desc.trim() || "External media",
          viewCount: response.data.view_count || 0,
          likeCount: response.data.like_count || 0,
          action: type === "audio" ? "PLAY RECORDING" : type === "video" ? "WATCH NOW" : "OPEN DOCUMENT",
          actionIcon: type === "audio" ? "play_circle" : type === "video" ? "open_in_new" : "arrow_forward",
          accessUrl: linkUrl.trim(),
          accessSource: "link",
          uploadedBy: response.data.users?.username,
          uploadedByUrl: response.data.users?.id ? `/profile/${response.data.users.id}` : undefined,
        };
        
        onSuccess("Media added successfully!");
        onClose();

      }
    } catch (err: any) {
      console.error("Failed to add media:", err);
      setError(err.message || "Failed to add media. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, backgroundColor: "rgba(25,28,27,0.45)", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ backgroundColor: "#fff", borderRadius: "16px", padding: "36px", width: "520px", maxWidth: "calc(100vw - 32px)", boxShadow: "0 20px 60px rgba(0,0,0,0.18)", border: "1px solid rgba(192,201,195,0.3)", maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px" }}>
          <h2 style={{ ...SERIF, fontSize: "20px", fontWeight: 700, color: "#0b4335", margin: 0, display: "flex", alignItems: "center", gap: "10px" }}><Icon name="add_circle" size={20} /> {t.addMediaModal}</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#707974", padding: "4px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }} onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f0f1ee")} onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}><Icon name="close" size={20} /></button>
        </div>
        
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div><label style={labelStyle}>{t.title} *</label><input type="text" value={title} onChange={(e) => { setTitle(e.target.value); setError(""); }} placeholder={t.mediaTitlePlaceholder} style={inputStyle} onFocus={(e) => (e.currentTarget.style.borderColor = "#0b4335")} onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(192,201,195,0.6)")} /></div>
          <div><label style={labelStyle}>{t.year}</label><input type="number" value={year} onChange={(e) => { setYear(e.target.value); setError(""); }} placeholder={t.yearPlaceholder} min={600} max={new Date().getFullYear()} style={inputStyle} onFocus={(e) => (e.currentTarget.style.borderColor = "#0b4335")} onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(192,201,195,0.6)")} /></div>
          <div><label style={labelStyle}>{t.description}</label><textarea value={desc} onChange={(e) => setDesc(e.target.value)} placeholder={t.descriptionPlaceholder} rows={2} style={{ ...inputStyle, resize: "vertical" }} onFocus={(e) => (e.currentTarget.style.borderColor = "#0b4335")} onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(192,201,195,0.6)")} /></div>
          <div>
            <label style={labelStyle}>{t.fileLink}</label>
                        <div style={{ display: "flex", borderRadius: "8px", overflow: "hidden", border: "1.5px solid rgba(192,201,195,0.5)", marginBottom: "16px" }}>
              <button style={modeTabStyle(accessMode === "upload")} onClick={() => { setAccessMode("upload"); setError(""); }}><Icon name="upload_file" size={13} /> {t.uploadFile}</button>
              <button style={{ ...modeTabStyle(accessMode === "link"), borderLeft: "1px solid rgba(192,201,195,0.5)" }} onClick={() => { setAccessMode("link"); setError(""); }}><Icon name="link" size={13} /> {t.pasteLink}</button>
            </div>
            {accessMode === "upload" && <UploadZone file={uploadedFile} onFile={(f) => { setUploadedFile(f); setError(""); }} onRemove={() => setUploadedFile(null)} accept=".pdf,.mp3,.wav,.ogg,.m4a,.mp4,.webm,.avi,audio/*,video/*,application/pdf" hint="PDF, Audio, Video — up to 100 MB" />}
            {accessMode === "link" && <div style={{ position: "relative" }}><span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#c0c9c3", display: "flex", alignItems: "center" }}><Icon name="link" size={16} /></span><input type="url" value={linkUrl} onChange={(e) => { setLinkUrl(e.target.value); setError(""); }} placeholder={t.urlPlaceholder} style={{ ...inputStyle, paddingLeft: "36px" }} onFocus={(e) => (e.currentTarget.style.borderColor = "#0b4335")} onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(192,201,195,0.6)")} /></div>}
            </div>
          {error && <p style={{ ...MONO, fontSize: "10px", color: "#b3261e", margin: 0, display: "flex", alignItems: "center", gap: "6px" }}><Icon name="error" size={13} /> {error}</p>}
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "32px", paddingTop: "24px", borderTop: "1px solid rgba(192,201,195,0.3)" }}>
          <HoverBtn onClick={onClose} style={{ borderColor: "#c0c9c3", color: "#707974" }}>{t.cancel}</HoverBtn>
          <button 
            onClick={handleSubmit} 
            disabled={isSubmitting}
            style={{ ...BTN_PRIMARY, backgroundColor: isSubmitting ? "#c0c9c3" : "#0b4335", color: "#fff", padding: "8px 20px", fontSize: "11px", cursor: isSubmitting ? "not-allowed" : "pointer", opacity: isSubmitting ? 0.7 : 1 }} 
            onMouseEnter={(e) => { if (!isSubmitting) e.currentTarget.style.backgroundColor = "#285b4b"; }} 
            onMouseLeave={(e) => { if (!isSubmitting) e.currentTarget.style.backgroundColor = "#0b4335"; }}
          >
            {isSubmitting ? <Icon name="hourglass_empty" size={14} /> : <Icon name="check" size={14} />} 
            {isSubmitting ? "UPLOADING..." : t.addMediaBtn}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   REPORT DROPDOWN & COMMENT CARD
───────────────────────────────────────────── */
interface ReportDropdownProps { onReport: (reason: string) => void; onClose: () => void; }
function ReportDropdown({ onReport, onClose }: ReportDropdownProps) {
  const reasons = ["Spam", "Misinformation", "Off-topic", "Harassment", "Other"];
  return (
    <div style={{ position: "absolute", top: "calc(100% + 6px)", right: 0, zIndex: 100, backgroundColor: "#fff", border: "1px solid rgba(192,201,195,0.5)", borderRadius: "8px", boxShadow: "0 4px 20px rgba(0,0,0,0.12)", minWidth: "160px", overflow: "hidden" }}>
      <div style={{ padding: "8px 12px 6px", borderBottom: "1px solid #f0f1ee" }}><span style={{ ...MONO, fontSize: "9px", color: "#707974", letterSpacing: "0.1em" }}>REPORT REASON</span></div>
      {reasons.map((r) => (
        <button key={r} onClick={() => { onReport(r); onClose(); }} style={{ display: "block", width: "100%", textAlign: "left", padding: "8px 14px", fontSize: "12px", color: r === "Harassment" ? "#b3261e" : "#404945", background: "none", border: "none", cursor: "pointer", transition: "background 0.12s" }} onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f3f4f1")} onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}>{r}</button>
      ))}
    </div>
  );
}

interface CommentCardProps { comment: Comment; lang: Language; t: UITranslation; votedIds: VotedIds; onVote: (id: number) => void; onAddReply: (parentId: number, text: string) => void; isReply?: boolean; }
function CommentCard({ comment: c, lang, t, votedIds, onVote, onAddReply, isReply = false }: CommentCardProps) {
  const [replyOpen, setReplyOpen] = useState(false);
  const [replyDraft, setReplyDraft] = useState("");
  const [reportOpen, setReportOpen] = useState(false);
  const [reported, setReported] = useState(false);
  const sendLabel = lang === "AR" ? "إرسال" : lang === "FR" ? "ENVOYER" : "SEND";
  const handleReport = (reason: string) => { setReported(true); console.info(`Comment ${c.id} reported as: ${reason}`); };
  const reportRef = useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    if (!reportOpen) return;
    const handler = (e: MouseEvent) => { if (reportRef.current && !reportRef.current.contains(e.target as Node)) setReportOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [reportOpen]);

  return (
    <div style={{ backgroundColor: "#fff", border: "1.5px solid rgba(192,201,195,0.4)", borderRadius: "12px", padding: isReply ? "14px 18px" : "20px 24px", marginLeft: isReply ? "40px" : 0 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          <div style={{ width: isReply ? "28px" : "32px", height: isReply ? "28px" : "32px", borderRadius: "50%", backgroundColor: "#e7e8e6", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Icon name="person" size={isReply ? 14 : 16} /></div>
          <span style={{ fontSize: "13px", fontWeight: 700, color: "#191c1b" }}>{c.author}</span>
          {c.role && <span style={{ ...MONO, fontSize: "9px", backgroundColor: "rgba(11,67,53,0.08)", color: "#0b4335", padding: "2px 8px", borderRadius: "4px", fontWeight: 700 }}>{c.role}</span>}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ ...MONO, fontSize: "10px", color: "#c0c9c3", whiteSpace: "nowrap" }}>{c.time}</span>
          {!reported ? (
            <div ref={reportRef} style={{ position: "relative" }}>
              <button onClick={() => setReportOpen((v) => !v)} title={t.report} style={{ background: "none", border: "none", cursor: "pointer", color: "#c0c9c3", display: "flex", alignItems: "center", padding: "2px", borderRadius: "4px", transition: "color 0.15s" }} onMouseEnter={(e) => (e.currentTarget.style.color = "#b3261e")} onMouseLeave={(e) => (e.currentTarget.style.color = "#c0c9c3")}><Icon name="flag" size={14} /></button>
              {reportOpen && <ReportDropdown onReport={handleReport} onClose={() => setReportOpen(false)} />}
            </div>
          ) : <span style={{ ...MONO, fontSize: "9px", color: "#b3261e", opacity: 0.7 }}>Reported</span>}
        </div>
      </div>
      <p style={{ fontSize: "13px", color: "#404945", lineHeight: 1.65, margin: "0 0 12px" }}>{c.text}</p>
      <div style={{ display: "flex", gap: "20px", alignItems: "center" }}>
        {!isReply && <button className="action-link" onClick={() => setReplyOpen((v) => !v)}><Icon name="reply" size={14} /> {t.reply}</button>}
        <button className="action-link" onClick={() => onVote(c.id)} style={{ color: votedIds[c.id] ? "#0b4335" : "#707974", fontWeight: votedIds[c.id] ? 700 : 400 }}><Icon name="thumb_up" size={13} /> {t.vote} ({c.votes})</button>
      </div>
      {replyOpen && !isReply && (
        <div style={{ marginTop: "14px", paddingTop: "14px", borderTop: "1px solid #f0f1ee" }}>
          <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
            <div style={{ width: "28px", height: "28px", borderRadius: "50%", flexShrink: 0, backgroundColor: "#e7e8e6", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name="person" size={14} /></div>
            <div style={{ flex: 1, border: "1.5px solid rgba(192,201,195,0.5)", borderRadius: "10px", backgroundColor: "#f9faf7", overflow: "hidden" }}>
              <textarea autoFocus value={replyDraft} onChange={(e) => setReplyDraft(e.target.value)} placeholder={`${t.reply.toLowerCase() === "reply" ? "Reply to" : "رد على"} ${c.author}…`} rows={2} style={{ width: "100%", border: "none", outline: "none", resize: "none", padding: "10px 14px", fontSize: "13px", color: "#191c1b", fontFamily: "'Source Sans 3', sans-serif", backgroundColor: "transparent" }} />
              <div style={{ display: "flex", justifyContent: "flex-end", padding: "6px 10px", borderTop: "1px solid #f0f1ee", gap: "8px" }}>
                <button onClick={() => { setReplyOpen(false); setReplyDraft(""); }} style={{ ...MONO, fontSize: "10px", color: "#707974", background: "none", border: "none", cursor: "pointer" }}>CANCEL</button>
                <button onClick={() => { if (!replyDraft.trim()) return; onAddReply(c.id, replyDraft.trim()); setReplyDraft(""); setReplyOpen(false); }} style={{ display: "flex", alignItems: "center", gap: "5px", backgroundColor: "#0b4335", color: "#fff", border: "none", borderRadius: "6px", padding: "6px 14px", cursor: "pointer", fontSize: "10px", fontWeight: 700, letterSpacing: "0.06em", fontFamily: "'JetBrains Mono', monospace" }} onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#285b4b")} onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#0b4335")}><Icon name="send" size={12} /> {sendLabel}</button>
              </div>
            </div>
          </div>
        </div>
      )}
      {!isReply && c.replies && c.replies.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "14px" }}>
          {c.replies.map((r) => (<CommentCard key={r.id} comment={r} lang={lang} t={t} votedIds={votedIds} onVote={onVote} onAddReply={onAddReply} isReply />))}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   DISCUSSION SECTION (Linked to Backend API)
───────────────────────────────────────────── */
function DiscussionSection({ lang, t, scholarId, backendComments }: { lang: Language; t: UITranslation; scholarId: number; backendComments: Comment[] }) {
  const [commentsByLang, setCommentsByLang] = useState<CommentsByLang>({
    EN: lang === "EN" ? backendComments : [],
    AR: lang === "AR" ? backendComments : [],
    FR: lang === "FR" ? backendComments : [],
  });
  const [draftByLang, setDraftByLang] = useState<DraftByLang>({ EN: "", AR: "", FR: "" });
  const [votedIds, setVotedIds] = useState<VotedIds>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const isRTL = lang === "AR";
  const comments = commentsByLang[lang];
  const draft = draftByLang[lang];
  const setDraft = (val: string) => { setDraftByLang((prev) => ({ ...prev, [lang]: val })); if (submitError) setSubmitError(null); };
  const sendLabel = lang === "AR" ? "إرسال" : lang === "FR" ? "ENVOYER" : "SEND";

  const submitComment = async () => {
    if (!draft.trim()) return;
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const response = await scholarsApi.addComment(scholarId, draft.trim());
      const newComment: Comment = {
        id: response.data?.comment_id || Date.now(),
        author: response.data?.users?.username || "You",
        role: null,
        text: draft.trim(),
        time: new Date(response.data?.created_at || Date.now()).toLocaleDateString(),
        votes: 0,
        replies: []
      };
      setCommentsByLang((prev) => ({ ...prev, [lang]: [...prev[lang], newComment] }));
      setDraft("");
    } catch (err: any) {
      console.error("Failed to post comment:", err);
      setSubmitError(err.message || "Failed to post comment. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVote = (id: number) => {
    if (votedIds[id]) return;
    setVotedIds((prev) => ({ ...prev, [id]: true }));
    setCommentsByLang((prev) => ({
      ...prev,
      [lang]: prev[lang].map((c) => {
        if (c.id === id) return { ...c, votes: c.votes + 1 };
        return { ...c, replies: (c.replies ?? []).map((r) => r.id === id ? { ...r, votes: r.votes + 1 } : r) };
      }),
    }));
  };

  const handleAddReply = (parentId: number, text: string) => {
    const reply: Comment = { id: Date.now(), author: "You", role: null, text, time: "just now", votes: 0, replies: [] };
    setCommentsByLang((prev) => ({ ...prev, [lang]: prev[lang].map((c) => c.id === parentId ? { ...c, replies: [...(c.replies ?? []), reply] } : c) }));
  };

  return (
    <section style={{ marginTop: "80px", paddingTop: "40px", borderTop: "1px solid rgba(192,201,195,0.4)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px" }}>
        <h2 style={{ ...SERIF, fontSize: "22px", fontWeight: 700, color: "#0b4335", margin: 0, display: "flex", alignItems: "center", gap: "10px" }}><Icon name="forum" size={22} /> {t.academicDiscussion}</h2>
        <span style={{ ...MONO, fontSize: "9px", fontWeight: 700, letterSpacing: "0.12em", padding: "4px 10px", borderRadius: "6px", backgroundColor: "rgba(11,67,53,0.08)", color: "#0b4335", border: "1px solid rgba(11,67,53,0.15)" }}>{LANG_LABELS[lang].toUpperCase()}</span>
      </div>
      <div style={{ maxWidth: "800px", display: "flex", flexDirection: "column", gap: "14px" }} dir={isRTL ? "rtl" : "ltr"}>
        {comments.length === 0 && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px", padding: "48px 32px", textAlign: "center", border: "2px dashed #c0c9c3", borderRadius: "12px" }}>
            <Icon name="chat_bubble_outline" size={36} />
            <p style={{ color: "#707974", fontSize: "14px", margin: 0 }}>{t.noDiscussion}</p>
            <span style={{ ...MONO, fontSize: "10px", color: "#0b4335", fontWeight: 700, cursor: "pointer", textDecoration: "underline", textUnderlineOffset: "3px" }}>{t.startDiscussion}</span>
          </div>
        )}
        {comments.map((c) => (
          <CommentCard key={c.id} comment={c} lang={lang} t={t} votedIds={votedIds} onVote={handleVote} onAddReply={handleAddReply} />
        ))}
        <div style={{ display: "flex", gap: "14px", alignItems: "flex-start", marginTop: "4px" }}>
          <div style={{ width: "40px", height: "40px", borderRadius: "50%", flexShrink: 0, backgroundColor: "#e7e8e6", display: "flex", alignItems: "center", justifyContent: "center", color: "#707974", marginTop: "2px" }}><Icon name="person" size={20} /></div>
          <div style={{ flex: 1, border: "1.5px solid rgba(192,201,195,0.5)", borderRadius: "12px", backgroundColor: "#fff", overflow: "hidden" }}>
            <textarea value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={t.joinDialogue} rows={3} disabled={isSubmitting} style={{ width: "100%", border: "none", outline: "none", resize: "none", padding: "14px 16px", fontSize: "13px", color: "#191c1b", fontFamily: "'Source Sans 3', sans-serif", backgroundColor: "transparent", opacity: isSubmitting ? 0.6 : 1 }} />
            {submitError && (<div style={{ padding: "0 16px 8px", display: "flex", alignItems: "center", gap: "6px" }}><Icon name="error" size={14} /><span style={{ fontSize: "11px", color: "#b3261e", fontFamily: "'JetBrains Mono', monospace" }}>{submitError}</span></div>)}
            <div style={{ display: "flex", justifyContent: "flex-end", padding: "8px 12px", borderTop: "1px solid #f0f1ee" }}>
              <button onClick={submitComment} disabled={isSubmitting || !draft.trim()} style={{ display: "flex", alignItems: "center", gap: "6px", backgroundColor: (isSubmitting || !draft.trim()) ? "#c0c9c3" : "#0b4335", color: "#fff", border: "none", borderRadius: "8px", padding: "8px 16px", cursor: (isSubmitting || !draft.trim()) ? "not-allowed" : "pointer", fontSize: "11px", fontWeight: 700, letterSpacing: "0.06em", fontFamily: "'JetBrains Mono', monospace", transition: "background 0.15s" }}>
                {isSubmitting ? <Icon name="hourglass_empty" size={14} /> : <Icon name="send" size={14} />} 
                {isSubmitting ? (lang === "AR" ? "جاري الإرسال..." : "SENDING...") : sendLabel}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   MEDIA CARD
───────────────────────────────────────────── */
interface MediaCardProps { 
  item: MediaItem; 
  mediaIconName: (type: "pdf" | "audio" | "video") => string; 
}

function MediaCard({ item: m, mediaIconName }: MediaCardProps) {
  const [liked, setLiked] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isViewing, setIsViewing] = useState(false);
  const displayLikes = m.likeCount + (liked ? 1 : 0);

  const handleDownload = async (e: React.MouseEvent) => {
    if (m.accessSource !== "upload" || !m.accessUrl) return;
    
    e.preventDefault();
    e.stopPropagation();
    setIsDownloading(true);
    
    try {
      const response = await fetch(m.accessUrl);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      const filename = m.accessFileName || m.title || 'file.pdf';
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Download failed:', error);
      window.open(m.accessUrl, '_blank');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleView = async (e: React.MouseEvent) => {
    if (!m.accessUrl) return;
    e.preventDefault();
    e.stopPropagation();
    setIsViewing(true);
    
    try {
      const response = await fetch(m.accessUrl);
      const blob = await response.blob();
      
      const correctType = m.type === 'audio' ? 'audio/mpeg' : 
                          m.type === 'video' ? 'video/mp4' : 
                          'application/pdf';
      
      const typedBlob = new Blob([blob], { type: correctType });
      const blobUrl = URL.createObjectURL(typedBlob);
      
      window.open(blobUrl, '_blank');
      
      setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
      
    } catch (error) {
      console.error('View failed:', error);
      window.open(m.accessUrl, '_blank');
    } finally {
      setIsViewing(false);
    }
  };

  return (
    <div className="card-hover" style={{ 
      backgroundColor: "#fff", 
      padding: "24px", 
      border: "1.5px solid rgba(192,201,195,0.4)", 
      borderRadius: "12px", 
      display: "flex", 
      flexDirection: "column", 
      cursor: "pointer" 
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
        <span className="material-symbols-outlined" style={{ fontSize: "32px", color: "#0b4335" }}>
          {mediaIconName(m.type)}
        </span>
      </div>
      
      <p style={{ fontSize: "14px", fontWeight: 700, color: "#191c1b", margin: "0 0 8px" }}>
        {m.title}
      </p>
      
      <p style={{ fontSize: "12px", color: "#707974", lineHeight: 1.55, flex: 1, margin: "0 0 12px" }}>
        {m.description}
      </p>
      
      {m.uploadedBy && (
        <p style={{ ...MONO, fontSize: "9px", color: "#c0c9c3", letterSpacing: "0.04em", margin: "0 0 12px" }}>
          uploaded by <ProfileLink name={m.uploadedBy} url={m.uploadedByUrl ?? "#"} />
        </p>
      )}
      
      <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "14px" }}>
        <span style={{ display: "flex", alignItems: "center", gap: "4px", ...MONO, fontSize: "10px", color: "#707974" }}>
          <Icon name="visibility" size={15} /> {m.viewCount}
        </span>
        <button
          onClick={(e) => { e.stopPropagation(); setLiked((v) => !v); }}
          title="Like (not saved yet)"
          style={{ display: "flex", alignItems: "center", gap: "4px", background: "none", border: "none", cursor: "pointer", padding: 0, ...MONO, fontSize: "10px", color: liked ? "#b3261e" : "#707974" }}
        >
          <Icon name={liked ? "favorite" : "favorite_border"} size={15} /> {displayLikes}
        </button>
      </div>
      
      {m.accessUrl ? (
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          {m.accessSource === "upload" ? (
            <>
              <button 
                onClick={handleView}
                disabled={isViewing}
                className="action-link"
                style={{ 
                  backgroundColor: "transparent",
                  border: "1.5px solid #0b4335",
                  color: "#0b4335",
                  padding: "6px 14px",
                  borderRadius: "6px",
                  fontSize: "10px",
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  fontFamily: "'JetBrains Mono', monospace",
                  cursor: isViewing ? 'wait' : 'pointer',
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  opacity: isViewing ? 0.6 : 1,
                  transition: "all 0.15s"
                }}
                onMouseEnter={(e) => { if (!isViewing) e.currentTarget.style.backgroundColor = "rgba(11,67,53,0.05)"; }}
                onMouseLeave={(e) => { if (!isViewing) e.currentTarget.style.backgroundColor = "transparent"; }}
              >
                {isViewing ? (
                  <><Icon name="hourglass_empty" size={14} /> LOADING...</>
                ) : (
                  <><Icon name="visibility" size={14} /> VIEW</>
                )}
              </button>
              
              <button 
                onClick={handleDownload}
                disabled={isDownloading}
                className="action-link"
                style={{ 
                  backgroundColor: "#0b4335",
                  border: "1.5px solid #0b4335",
                  color: "#fff",
                  padding: "6px 14px",
                  borderRadius: "6px",
                  fontSize: "10px",
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  fontFamily: "'JetBrains Mono', monospace",
                  cursor: isDownloading ? 'wait' : 'pointer',
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  opacity: isDownloading ? 0.6 : 1,
                  transition: "all 0.15s"
                }}
                onMouseEnter={(e) => { if (!isDownloading) e.currentTarget.style.backgroundColor = "#285b4b"; }}
                onMouseLeave={(e) => { if (!isDownloading) e.currentTarget.style.backgroundColor = "#0b4335"; }}
              >
                {isDownloading ? (
                  <><Icon name="hourglass_empty" size={14} /> DOWNLOADING...</>
                ) : (
                  <><Icon name="download" size={14} /> DOWNLOAD</>
                )}
              </button>
            </>
          ) : (
            <a 
              href={m.accessUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ textDecoration: "none" }}
            >
              <button 
                className="action-link"
                style={{ 
                  backgroundColor: "#0b4335",
                  border: "1.5px solid #0b4335",
                  color: "#fff",
                  padding: "6px 14px",
                  borderRadius: "6px",
                  fontSize: "10px",
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  fontFamily: "'JetBrains Mono', monospace",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  transition: "all 0.15s"
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#285b4b"; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "#0b4335"; }}
              >
                OPEN LINK <Icon name="open_in_new" size={14} />
              </button>
            </a>
          )}
        </div>
      ) : (
        <button className="action-link">
          {m.action} <Icon name={m.actionIcon} size={15} />
        </button>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────── */
const ScholarDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const { lang: siteLang } = useLang();
  const { id: scholarIdStr } = useParams<{ id: string }>();
  const scholarId = scholarIdStr ? parseInt(scholarIdStr, 10) : 1;
  
  const [lang, setLang] = useState<Language>(siteLang as Language);
  const [activeTab, setActiveTab] = useState<TabId>("works");
  const [contributorsOpen, setContributorsOpen] = useState(true);
  const [imgGray, setImgGray] = useState(true);
  const [shareHov, setShareHov] = useState(false);
  const [linkHov, setLinkHov] = useState(false);
  const [showAddWork, setShowAddWork] = useState(false);
  const [showAddMedia, setShowAddMedia] = useState(false);
  const headerRef = useRef<HTMLDivElement>(null);
  const [collapsed, setCollapsed] = useState(false);
  
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const [s, setS] = useState<ScholarDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        let response = await scholarsApi.getById(scholarId, lang.toLowerCase());
        setS(transformBackendToUI(response.data, lang));
      } catch (err: any) {
        try {
          let response = await scholarsApi.getById(scholarId, "en");
          setS(transformBackendToUI(response.data, lang));
        } catch (enErr: any) {
          try {
            let response = await scholarsApi.getById(scholarId, "ar");
            setS(transformBackendToUI(response.data, lang));
          } catch (arErr: any) {
            try {
              let response = await scholarsApi.getById(scholarId, "fr");
              setS(transformBackendToUI(response.data, lang));
            } catch (finalErr: any) {
              setError("Scholar not found");
            }
          }
        }
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [scholarId, lang]);

  if (isLoading) {
    return <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#f9faf7" }}><Icon name="hourglass_empty" size={32} /></div>;
  }
  if (error) {
    return <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#f9faf7", color: "#b3261e" }}>{error}</div>;
  }
  if (!s) return null;

  const t = T[lang];
  const isRTL = lang === "AR";
  
  const getName = (): string => s.name[lang] ?? s.name.EN ?? "";
  const getSubtitle = (): string | undefined => s.subtitle[lang] ?? s.subtitle.EN;
  const getOverview = (): string | null => s.overviewText[lang] ?? null;
  const getBody = (): string[] | null => s.body[lang] ?? null;

  const hasLangContent = !!(s.name[lang] || s.overviewText[lang] || (s.body[lang]?.length ?? 0) > 0);
  const hasBeenEdited = !!(s.lastUpdatedBy && s.lastUpdatedBy !== s.createdBy);

  const tabIds: TabId[] = ["works", "media", "relations", "more"];
  const homeLabel: string = isRTL ? "الرئيسية" : lang === "FR" ? "Accueil" : "Home";
  const scholarsLabel: string = isRTL ? "العلماء" : lang === "FR" ? "Érudits" : "Scholars";
  const mediaIconName = (type: "pdf" | "audio" | "video"): string => ({ pdf: "article", audio: "mic", video: "movie" }[type]);
  const iconBtnStyle = (hov: boolean): React.CSSProperties => ({ width: "36px", height: "36px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: hov ? "#edeeeb" : "transparent", color: "#707974", border: "none", cursor: "pointer", transition: "background 0.15s" });

  return (
    <div dir={isRTL ? "rtl" : "ltr"} style={{ fontFamily: "'Source Sans 3', sans-serif", minHeight: "100vh", backgroundColor: "#f9faf7", backgroundImage: "radial-gradient(#e1e3e0 0.5px, transparent 0.5px)", backgroundSize: "24px 24px", color: "#191c1b" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Source+Serif+4:ital,opsz,wght@0,8..60,200..900;1,8..60,200..900&family=Source+Sans+3:ital,wght@0,200..900;1,200..900&family=JetBrains+Mono:ital,wght@0,100..800;1,100..800&family=Amiri:ital,wght@0,400;0,700;1,400&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap');
        .material-symbols-outlined { font-variation-settings: 'FILL' 0,'wght' 400,'GRAD' 0,'opsz' 24; font-family: 'Material Symbols Outlined'; display: inline-block; vertical-align: middle; }
        * { box-sizing: border-box; } a { text-decoration: none; } button { font-family: inherit; background: none; border: none; cursor: pointer; }
        .row-hover:hover { background: #f3f4f1; } .card-hover { transition: box-shadow 0.18s, border-color 0.18s; }
        .card-hover:hover { box-shadow: 0 4px 20px rgba(11,67,53,0.1); border-color: rgba(11,67,53,0.3) !important; }
        .tab-btn { padding: 14px 20px; border: none; border-bottom: 2px solid transparent; background: transparent; cursor: pointer; white-space: nowrap; font-family: 'JetBrains Mono', monospace; font-size: 11px; letter-spacing: 0.1em; color: #707974; transition: color 0.15s; }
        .tab-btn:hover { color: #0b4335; } .tab-btn.active { border-bottom-color: #0b4335; color: #0b4335; background: rgba(11,67,53,0.04); }
        .person-card:hover .person-name { color: #0b4335; } .action-link { background: none; border: none; padding: 0; cursor: pointer; font-family: 'JetBrains Mono', monospace; font-size: 10px; font-weight: 700; letter-spacing: 0.1em; color: #0b4335; display: inline-flex; align-items: center; gap: 4px; }
        .action-link:hover { text-decoration: underline; }
      `}</style>

      {/* ✅ WORK MODAL: onAdd is empty so it doesn't add statically */}
      {showAddWork && (
        <AddWorkModal 
          onClose={() => setShowAddWork(false)} 
          onAdd={() => {}} 
          t={t} 
          lang={lang}
          versionId={s.versionId}
          onSuccess={(message) => setToast({ message, type: "success" })}
        />
      )}

      {/* ✅ MEDIA MODAL: onAdd is empty so it doesn't add statically */}
      {showAddMedia && (
        <AddMediaModal 
          onClose={() => setShowAddMedia(false)} 
          onAdd={() => {}} 
          t={t} 
          versionId={s.versionId} 
          scholarId={s.id} 
          onSuccess={(message) => setToast({ message, type: "success" })} 
        />
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <header ref={headerRef} style={{ position: "sticky", top: 0, zIndex: 50, backgroundColor: collapsed ? "rgba(249,250,247,0.85)" : "rgba(249,250,247,0.97)", backdropFilter: collapsed ? "blur(16px)" : "none", borderBottom: "1px solid rgba(192,201,195,0.3)", boxShadow: collapsed ? "0 2px 12px rgba(11,67,53,0.08)" : "none", transition: "all 0.3s ease", padding: "16px 0" }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 64px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div style={{ marginBottom: collapsed ? 0 : "12px", flex: 1 }}>
              <div style={{ overflow: "hidden", maxHeight: collapsed ? "0px" : "24px", opacity: collapsed ? 0 : 1, transition: "max-height 0.35s cubic-bezier(0.4,0,0.2,1), opacity 0.25s ease, margin-bottom 0.35s cubic-bezier(0.4,0,0.2,1)", marginBottom: collapsed ? 0 : "8px" }}>
                <button onClick={() => window.history.back()} style={{ background: "none", border: "none", padding: 0, cursor: "pointer", color: "#707974", fontSize: "14px", lineHeight: 1, transition: "color 0.15s" }} onMouseEnter={(e) => (e.currentTarget.style.color = "#0b4335")} onMouseLeave={(e) => (e.currentTarget.style.color = "#707974")}>←</button>
              </div>
              <div style={{ ...MONO, fontSize: "11px", color: "#707974", letterSpacing: "0.05em", marginBottom: collapsed ? "4px" : "8px", direction: isRTL ? "rtl" : "ltr", transition: "margin-bottom 0.25s ease" }}>
                {isRTL ? (
                  <><span style={{ color: "#0b4335", fontWeight: 700 }}>{getName()}</span> {" < "}<a href="/scholars" style={{ color: "#707974", textDecoration: "none", transition: "color 0.15s" }} onMouseEnter={(e) => (e.currentTarget.style.color = "#0b4335")} onMouseLeave={(e) => (e.currentTarget.style.color = "#707974")}>{scholarsLabel}</a> {" < "}<a href="/" style={{ color: "#707974", textDecoration: "none", transition: "color 0.15s" }} onMouseEnter={(e) => (e.currentTarget.style.color = "#0b4335")} onMouseLeave={(e) => (e.currentTarget.style.color = "#707974")}>{homeLabel}</a></>
                ) : (
                  <><a href="/" style={{ color: "#707974", textDecoration: "none", transition: "color 0.15s" }} onMouseEnter={(e) => (e.currentTarget.style.color = "#0b4335")} onMouseLeave={(e) => (e.currentTarget.style.color = "#707974")}>{homeLabel}</a> {" > "}<a href="/scholars" style={{ color: "#707974", textDecoration: "none", transition: "color 0.15s" }} onMouseEnter={(e) => (e.currentTarget.style.color = "#0b4335")} onMouseLeave={(e) => (e.currentTarget.style.color = "#707974")}>{scholarsLabel}</a>{hasLangContent && <> {" > "}<span style={{ color: "#0b4335", fontWeight: 700 }}>{getName()}</span></>}</>
                )}
              </div>
              
              {hasLangContent && (
                <>
                  <div style={{ display: "flex", alignItems: "baseline", gap: "12px", flexWrap: "wrap", marginBottom: "2px" }}>
                    <h1 style={{ ...SERIF, fontWeight: 700, color: "#0b4335", margin: 0, fontSize: collapsed ? "20px" : "32px", transition: "font-size 0.25s ease" }}>{getName()}</h1>
                    <div style={{ ...MONO, fontSize: "9px", color: "#707974", letterSpacing: "0.18em", opacity: 0.8, display: collapsed ? "none" : "block" }}>
                      {t.createdBy} <ProfileLink name={s.createdBy} url={s.createdByUrl} /> • {s.createdDate}
                    </div>
                  </div>
                  <div style={{ overflow: "hidden", maxHeight: collapsed ? "0px" : (hasBeenEdited ? "70px" : "40px"), opacity: collapsed ? 0 : 1, transition: "max-height 0.35s cubic-bezier(0.4,0,0.2,1), opacity 0.25s ease" }}>
                    {getSubtitle() && (
                      <p style={{ ...SERIF, fontSize: "13px", color: "#707974", fontStyle: "italic", margin: "2px 0 4px", lineHeight: 1.4 }}>{getSubtitle()}</p>
                    )}
                    {hasBeenEdited && (
                      <div style={{ ...MONO, fontSize: "9px", color: "#707974", letterSpacing: "0.18em", opacity: 0.8 }}>
                        {t.lastUpdated} <ProfileLink name={s.lastUpdatedBy!} url={s.lastUpdatedByUrl!} /> • {s.lastUpdatedDate}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
            
            {hasLangContent && (
              <div style={{ display: "flex", gap: "4px", paddingTop: "4px" }}>
                <button 
                  onClick={async () => {
                    const shareData = { title: getName(), text: `Check out ${getName()} on Islamic Scholars Database`, url: window.location.href };
                    try {
                      if (navigator.share) { await navigator.share(shareData); } 
                      else { await navigator.clipboard.writeText(window.location.href); alert('Link copied to clipboard!'); }
                    } catch (err:any) { if (err.name !== 'AbortError') console.error('Share failed:', err); }
                  }} 
                  title="Share" onMouseEnter={() => setShareHov(true)} onMouseLeave={() => setShareHov(false)} style={iconBtnStyle(shareHov)}
                >
                  <Icon name="share" size={18} />
                </button>
                <button 
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(window.location.href);
                      const btn = document.getElementById('copy-link-btn');
                      if (btn) {
                        const originalHTML = btn.innerHTML;
                        btn.innerHTML = '<span class="material-symbols-outlined" style="font-size: 18px;">check</span>';
                        setTimeout(() => { btn.innerHTML = originalHTML; }, 2000);
                      }
                    } catch (err) {
                      const input = document.createElement('input');
                      input.value = window.location.href;
                      document.body.appendChild(input);
                      input.select();
                      document.execCommand('copy');
                      document.body.removeChild(input);
                      alert('Link copied to clipboard!');
                    }
                  }} 
                  id="copy-link-btn" title="Copy link" onMouseEnter={() => setLinkHov(true)} onMouseLeave={() => setLinkHov(false)} style={iconBtnStyle(linkHov)}
                >
                  <Icon name="link" size={18} />
                </button>
              </div>
            )}
          </div>
          
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: collapsed ? "6px" : "8px", paddingTop: collapsed ? "6px" : "8px", borderTop: "1px solid rgba(192,201,195,0.15)", transition: "margin-top 0.35s cubic-bezier(0.4,0,0.2,1), padding-top 0.35s cubic-bezier(0.4,0,0.2,1)" }}>
            <div style={{ display: "flex", gap: "4px", padding: "4px 8px", backgroundColor: "rgba(11,67,53,0.04)", border: "1px solid rgba(11,67,53,0.1)", borderRadius: "999px" }}>
              {(["AR", "EN", "FR"] as Language[]).map((l) => {
                const active = lang === l;
                return (<button key={l} onClick={() => setLang(l)} style={{ ...MONO, fontSize: "10px", fontWeight: 700, letterSpacing: "0.08em", padding: "4px 12px", borderRadius: "999px", border: "1px solid", borderColor: active ? "#0b4335" : "rgba(192,201,195,0.5)", backgroundColor: active ? "#0b4335" : "transparent", color: active ? "#fff" : "#707974", cursor: "pointer", transition: "all 0.15s" }}>{l === "AR" ? "ARABIC" : l === "EN" ? "ENGLISH" : "FRENCH"}</button>);
              })}
            </div>
            <HoverBtn onClick={() => navigate(hasLangContent ? `/scholars/${s.id}/edit/${lang}` : `/scholars/${s.id}/submit/${lang}`)} style={{ borderColor: hasLangContent ? "#0b4335" : "#735c00", color: hasLangContent ? "#0b4335" : "#735c00" }}>
              <Icon name={hasLangContent ? "edit_note" : "add_circle"} size={14} />
              {hasLangContent ? (lang === "EN" ? "EDIT ENGLISH" : lang === "AR" ? "تعديل العربية" : "MODIFIER FRANÇAIS") : (lang === "EN" ? "ADD ENGLISH VERSION" : lang === "AR" ? "إضافة نسخة عربية" : "AJOUTER VERSION FRANÇAISE")}
            </HoverBtn>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: "1280px", margin: "0 auto", padding: "40px 64px 80px" }}>
        <div style={{ display: "grid", gridTemplateColumns: hasLangContent ? "300px 1fr" : "1fr", gap: "48px", marginBottom: "48px" }}> 
          <aside>
            {hasLangContent ? (
              <div style={{ backgroundColor: "#fff", border: "1px solid rgba(192,201,195,0.4)", borderRadius: "12px", overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", position: "sticky", top: "140px" }}>
                <div style={{ position: "relative", aspectRatio: "3/4", overflow: "hidden" }}>
                  {s.image ? (
                    <img alt="Scholar portrait" src={s.image} style={{ width: "100%", height: "100%", objectFit: "cover", filter: imgGray ? "grayscale(100%)" : "grayscale(0%)", transition: "filter 0.6s ease", display: "block" }} onMouseEnter={() => setImgGray(false)} onMouseLeave={() => setImgGray(true)} />
                  ) : (
                    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#c0c9c3" }}>
                      <Icon name="account_circle" size={100} />
                    </div>
                  )}
                  <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "16px", background: "linear-gradient(to top, rgba(0,0,0,0.65), transparent)" }}>
                    <p style={{ ...MONO, fontSize: "9px", color: "#fff", letterSpacing: "0.18em", margin: 0, opacity: 0.9 }}>{s.image ? "OFFICIAL SCHOLAR PORTRAIT" : "NO IMAGE AVAILABLE"}</p>
                  </div>
                </div>

                <div style={{ padding: "20px 20px 24px" }}>
                  <p style={{ ...MONO, fontSize: "9px", color: "#0b4335", letterSpacing: "0.2em", marginBottom: "12px", borderBottom: "1px solid rgba(11,67,53,0.1)", paddingBottom: "8px" }}>{t.atAGlance}</p>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <tbody>
                      {([
                        [t.fullName, s.atAGlance.fullName],
                        [t.born, s.atAGlance.born],
                        [t.died, s.atAGlance.died],
                        [t.century, s.atAGlance.century],
                        [t.region, s.atAGlance.region],
                        [t.discipline, s.atAGlance.discipline],
                      ] as [string, string][]).map(([label, value]) => (
                        <tr key={label} style={{ borderBottom: "1px solid #f0f1ee" }}>
                          <td style={{ ...MONO, padding: "8px 0", fontSize: "10px", color: "#707974", fontWeight: 400, verticalAlign: "top" }}>{label}</td>
                          <td style={{ padding: "8px 0", fontSize: "11px", fontWeight: 700, textAlign: "right", color: "#191c1b", verticalAlign: "top", paddingLeft: "8px" }}>{value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {s.contributors.length > 0 && (
                    <div style={{ marginTop: "20px", paddingTop: "16px", borderTop: "1px solid rgba(11,67,53,0.1)" }}>
                      <button onClick={() => setContributorsOpen(!contributorsOpen)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                        <span style={{ ...MONO, fontSize: "9px", color: "#0b4335", letterSpacing: "0.2em", display: "flex", alignItems: "center", gap: "4px" }}>{t.allContributors}<Icon name="expand_more" size={14} /></span>
                        <span style={{ ...MONO, fontSize: "9px", color: "#0b4335", fontWeight: 700, backgroundColor: "rgba(11,67,53,0.05)", padding: "2px 8px", borderRadius: "4px" }}>{s.contributors.length} {t.contributors}</span>
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
                  )}
                </div>
              </div>
            ) : null}
          </aside>

          <div>
            {!hasLangContent ? (
              <EmptyLangState lang={lang} t={t} onContribute={() => navigate(`/scholars/${s.id}/submit/${lang}`)} />
            ) : (
              <>
                <section style={{ backgroundColor: "rgba(11,67,53,0.05)", border: "1px solid rgba(11,67,53,0.1)", borderRadius: "16px", padding: "32px", marginBottom: "32px" }}>
                  <p style={{ ...MONO, fontSize: "9px", color: "#0b4335", letterSpacing: "0.2em", marginBottom: "14px", display: "flex", alignItems: "center", gap: "8px" }}><span style={{ width: "16px", height: "1px", backgroundColor: "#0b4335", display: "inline-block" }} />{t.overview}</p>
                  {getOverview() && (
                    <div style={{ fontSize: "14px", color: "#404945", lineHeight: 1.75, marginBottom: "16px" }} dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(getOverview() || "") }} />
                  )}
                  {(getBody() ?? []).map((para, i) => (
                    <div key={i} style={{ fontSize: lang === "AR" ? "16px" : "15px", fontFamily: lang === "AR" ? "'Amiri', serif" : undefined, color: "#404945", lineHeight: 1.8, marginBottom: i === (getBody()?.length ?? 0) - 1 ? 0 : "20px" }} dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(para) }} />
                  ))}
                </section>
              </>
            )}
          </div>
        </div>

        {hasLangContent && (
          <div style={{ borderTop: "1px solid rgba(192,201,195,0.4)", paddingTop: "48px" }}>
            <div style={{ display: "flex", borderBottom: "1.5px solid rgba(192,201,195,0.4)", marginBottom: "32px", position: "sticky", top: "var(--header-h, 130px)", zIndex: 40, willChange: "transform", backgroundColor: "#f9faf7", overflowX: "auto" }}>
              {tabIds.map((id, i) => (<button key={id} onClick={() => setActiveTab(id)} className={`tab-btn${activeTab === id ? " active" : ""}`}>{t.tabs[i]}</button>))}
            </div>

            {/* ✅ WORKS TAB: Kept the exact same table design, but replaced the single button with two icon buttons */}
            {activeTab === "works" && (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                  <h2 style={{ ...SERIF, fontSize: "24px", fontWeight: 700, color: "#0b4335", margin: 0 }}>{t.bibliographyTitle}</h2>
                  <HoverBtn onClick={() => setShowAddWork(true)}><Icon name="add_circle" size={14} />{t.addWork}</HoverBtn>
                </div>
                <div style={{ border: "1px solid rgba(192,201,195,0.4)", borderRadius: "12px", overflow: "hidden", backgroundColor: "#fff" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead><tr style={{ backgroundColor: "#f3f4f1", borderBottom: "1.5px solid rgba(192,201,195,0.4)" }}>{[t.colTitle, t.colYear, t.colFormat, t.colAccess].map((col) => (<th key={col} style={{ ...MONO, padding: "12px 16px", textAlign: "left", fontSize: "9px", color: "#707974", letterSpacing: "0.1em", fontWeight: 700 }}>{col}</th>))}</tr></thead>
                    <tbody>
                      {s.works.map((w, i) => {
                        return (
                          <tr key={i} className="row-hover" style={{ borderBottom: "1px solid #f0f1ee", transition: "background 0.12s" }}>
                            <td style={{ ...SERIF, padding: "14px 16px", fontSize: "14px", fontWeight: 700, fontStyle: "italic", color: "#191c1b" }}>
                              {w.title}
                              {w.uploadedBy && (<div style={{ ...MONO, fontSize: "9px", fontStyle: "normal", fontWeight: 400, color: "#c0c9c3", marginTop: "3px" }}>added by <ProfileLink name={w.uploadedBy} url={w.uploadedByUrl ?? "#"} /></div>)}
                            </td>
                            <td style={{ padding: "14px 16px", fontSize: "13px", color: "#707974" }}>{w.year}</td>
                            <td style={{ padding: "14px 16px" }}><span style={{ ...MONO, fontSize: "9px", fontWeight: 700, padding: "3px 10px", borderRadius: "4px", backgroundColor: w.format === "BOOK" ? "rgba(11,67,53,0.08)" : "#f3f4f1", color: w.format === "BOOK" ? "#0b4335" : "#404945" }}>{FORMAT_LABELS[lang][w.format].toUpperCase()}</span></td>
                            
                            {/* ✅ REPLACED: Single button with two icon buttons (View & Download) */}
                            <td style={{ padding: "14px 16px" }}>
                              <WorkActions work={w} />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {s.works.length === 0 && (
                    <div style={{ padding: "48px 32px", textAlign: "center" }}>
                      <Icon name="menu_book" size={36} />
                      <p style={{ color: "#707974", fontSize: "14px", marginTop: "12px" }}>No works added yet.</p>
                      <button className="action-link" onClick={() => setShowAddWork(true)} style={{ marginTop: "8px" }}>Add the first work →</button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === "media" && (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px" }}>
                  <h2 style={{ ...SERIF, fontSize: "24px", fontWeight: 700, color: "#0b4335", margin: 0 }}>{t.mediaTitle}</h2>
                  <HoverBtn onClick={() => setShowAddMedia(true)}><Icon name="add_circle" size={14} />{t.addMedia}</HoverBtn>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "20px" }}>
                  {s.media.map((m, i) => (<MediaCard key={i} item={m} mediaIconName={mediaIconName} />))}
                </div>
              </div>
            )}

            {activeTab === "relations" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                  {[ 
                    { data: s.intellectualLineage, label: t.intellectualLineage, icon: "school", color: "#0b4335" }, 
                    { data: s.notableDisciples, label: t.notableDisciples, icon: "groups", color: "#735c00" } 
                  ].map(({ data, label, icon, color }) => (
                    <div key={label} style={{ backgroundColor: "#f3f4f1", padding: "28px", borderRadius: "16px", border: "1px solid rgba(192,201,195,0.4)" }}>
                      <h3 style={{ ...MONO, fontSize: "9px", color, letterSpacing: "0.15em", marginBottom: "24px", display: "flex", alignItems: "center", gap: "8px" }}><Icon name={icon} size={15} />{label}</h3>
                      <div style={{ display: "flex", gap: "24px" }}>
                        {data.map((p) => (<a key={p.name} href={p.profileUrl ?? "#"} className="person-card" style={{ display: "flex", alignItems: "center", gap: "12px", textDecoration: "none" }}><div style={{ width: "44px", height: "44px", borderRadius: "50%", backgroundColor: p.color, display: "flex", alignItems: "center", justifyContent: "center", color: p.textColor, fontSize: "13px", fontWeight: 700, flexShrink: 0 }}>{p.initials}</div><div><p className="person-name" style={{ fontSize: "13px", fontWeight: 700, color: "#191c1b", margin: "0 0 2px", transition: "color 0.15s" }}>{p.name}</p><p style={{ ...MONO, fontSize: "9px", color: "#c0c9c3", letterSpacing: "0.08em", margin: 0 }}>{p.role}</p></div></a>))}
                      </div>
                    </div>
                  ))}
                </div>
                {s.relatedScholars.length > 0 && (
                  <div>
                    <h3 style={{ ...MONO, fontSize: "9px", color: "#707974", letterSpacing: "0.12em", marginBottom: "16px" }}>{t.relatedByField}</h3>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "14px" }}>
                      {s.relatedScholars.map((rs, i) => (<div key={i} className="card-hover" style={{ backgroundColor: "#fff", padding: "16px", borderRadius: "8px", border: "1.5px solid rgba(192,201,195,0.4)" }}><p style={{ ...MONO, fontSize: "9px", color: rs.labelColor, letterSpacing: "0.08em", marginBottom: "6px" }}>{rs.label}</p><p style={{ fontSize: "14px", fontWeight: 700, color: "#191c1b", marginBottom: "4px" }}>{rs.name}</p><p style={{ fontSize: "12px", color: "#707974", fontStyle: "italic", margin: 0 }}>{rs.description}</p></div>))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === "more" && (
              <div style={{ display: "grid" }}>
                {s.academicReferences.length > 0 && (
                  <div>
                    <h3 style={{ ...MONO, fontSize: "9px", color: "#707974", letterSpacing: "0.12em", marginBottom: "20px" }}>{t.academicReferences}</h3>
                    <ol style={{ paddingLeft: "0", margin: 0, display: "flex", flexDirection: "column", gap: "16px", listStyle: "none" }}>
                      {s.academicReferences.map((r, i) => (
                        <li key={i} style={{ padding: "16px 20px", backgroundColor: "#fff", border: "1.5px solid rgba(192,201,195,0.4)", borderRadius: "10px", display: "flex", flexDirection: "column", gap: "6px" }}>
                          <p style={{ ...SERIF, fontSize: "14px", fontWeight: 600, color: "#0b4335", margin: 0 }}>{r.title}</p>
                          <p style={{ ...SERIF, fontSize: "13px", color: "#404945", lineHeight: 1.6, margin: 0 }}>{r.citation}</p>
                          {r.url && (
                            <a href={r.url} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "#735c00", fontSize: "12px", fontWeight: 600, textDecoration: "none", marginTop: "4px" }} onMouseEnter={(e) => { e.currentTarget.style.color = "#0b4335"; e.currentTarget.style.textDecoration = "underline"; }} onMouseLeave={(e) => { e.currentTarget.style.color = "#735c00"; e.currentTarget.style.textDecoration = "none"; }}>
                              <Icon name="link" size={14} />{r.url.replace(/^https?:\/\//, '')}
                            </a>
                          )}
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
              </div>
            )}

            {s.recentRevisions.length > 0 && (
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
            )}
            <DiscussionSection lang={lang} t={t} scholarId={s.id} backendComments={s.comments} />
          </div>
        )}
      </main>
    </div>
  );
};

export default ScholarDetailPage;