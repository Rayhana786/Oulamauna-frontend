import React from "react";
import type { Language, UITranslation } from "./types";

export const MONO: React.CSSProperties = { fontFamily: "'JetBrains Mono', monospace" };
export const SERIF: React.CSSProperties = { fontFamily: "'Source Serif 4', serif" };
export const BTN_PRIMARY: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: "6px",
  padding: "6px 16px", border: "1.5px solid #0b4335", borderRadius: "6px",
  backgroundColor: "transparent", color: "#0b4335",
  fontSize: "10px", fontWeight: 700, letterSpacing: "0.1em", cursor: "pointer",
  transition: "background 0.15s, color 0.15s", fontFamily: "'JetBrains Mono', monospace",
};

export const LANG_LABELS: Record<Language, string> = { EN: "English", AR: "العربية", FR: "Français" };

export const T: Record<Language, UITranslation> = {
  EN: {
    overview: "OVERVIEW", atAGlance: "AT A GLANCE",
    fullName: "Full Name", born: "Born", died: "Died",
    century: "Century", region: "Region", discipline: "Discipline", expertise: "Expertise",
    allContributors: "ALL CONTRIBUTORS", contributor: "CONTRIBUTOR",
    contributions: "CONTRIBUTIONS", contributors: "Contributors",
    citePage: "CITE THIS PAGE", tabs: ["WORKS", "MEDIA", "RELATIONS", "REFERENCES & HISTORY"],
    editBtn: "EDIT ENGLISH", bibliographyTitle: "Bibliography",
    colTitle: "TITLE", colYear: "YEAR", colFormat: "FORMAT", colAccess: "DIGITAL ACCESS",
    downloadPdf: "DOWNLOAD PDF", listenAudio: "LISTEN AUDIO", awaitingDigitization: "Awaiting Digitization",
    mediaTitle: "Integrated Media Library", addMedia: "ADD MEDIA",
    intellectualLineage: "Intellectual Lineage", notableDisciples: "Notable Disciples",
    relatedByField: "Related Scholars by Field", academicReferences: "Academic References",
    revisionHistory: "Revision History", recentRevisions: "Recent Revisions", viewAllEdits: "View all edits",
    academicDiscussion: "Academic Discussion", joinDialogue: "Join the scholarly dialogue in English...",
    reply: "REPLY", vote: "VOTE", report: "REPORT",
    noContent: "This page has not yet been contributed in",
    noDiscussion: "No discussion yet in English.", startDiscussion: "Start the conversation →",
    contribute: "Contribute now →", createdBy: "CREATED BY", lastUpdated: "LAST UPDATED BY",
    sharedNote: "Shared across all languages", addWork: "ADD WORK",
  },
  AR: {
    overview: "نظرة عامة", atAGlance: "لمحة سريعة",
    fullName: "الاسم الكامل", born: "الميلاد", died: "الوفاة",
    century: "القرن", region: "المنطقة", discipline: "التخصص", expertise: "التخصص",
    allContributors: "جميع المساهمين", contributor: "المساهم",
    contributions: "المساهمات", contributors: "مساهمون",
    citePage: "استشهد بهذه الصفحة", tabs: ["الأعمال", "الوسائط", "العلاقات", "المراجع والتاريخ"],
    editBtn: "تعديل العربية", bibliographyTitle: "قائمة المؤلفات",
    colTitle: "العنوان", colYear: "السنة", colFormat: "الصيغة", colAccess: "الوصول الرقمي",
    downloadPdf: "تحميل PDF", listenAudio: "الاستماع", awaitingDigitization: "في انتظار الرقمنة",
    mediaTitle: "مكتبة الوسائط المتكاملة", addMedia: "إضافة وسائط",
    intellectualLineage: "السلسلة الفكرية", notableDisciples: "أبرز التلامذة",
    relatedByField: "علماء ذوو صلة بالمجال", academicReferences: "المراجع الأكاديمية",
    revisionHistory: "تاريخ المراجعات", recentRevisions: "أحدث المراجعات", viewAllEdits: "عرض كل التعديلات",
    academicDiscussion: "النقاش الأكاديمي", joinDialogue: "انضم إلى الحوار العلمي بالعربية...",
    reply: "ردّ", vote: "تصويت", report: "إبلاغ",
    noContent: "لم يتم المساهمة في هذه الصفحة بعد باللغة",
    noDiscussion: "لا توجد نقاشات بالعربية بعد.", startDiscussion: "ابدأ المحادثة →",
    contribute: "ساهم الآن →", createdBy: "أنشأه", lastUpdated: "آخر تحديث بواسطة",
    sharedNote: "مشترك بين جميع اللغات", addWork: "إضافة عمل",
  },
  FR: {
    overview: "APERÇU", atAGlance: "EN UN COUP D'ŒIL",
    fullName: "Nom complet", born: "Né", died: "Décédé",
    century: "Siècle", region: "Région", discipline: "Discipline", expertise: "Expertise",
    allContributors: "TOUS LES CONTRIBUTEURS", contributor: "CONTRIBUTEUR",
    contributions: "CONTRIBUTIONS", contributors: "Contributeurs",
    citePage: "CITER CETTE PAGE", tabs: ["ŒUVRES", "MÉDIAS", "RELATIONS", "RÉFÉRENCES & HISTORIQUE"],
    editBtn: "MODIFIER FRANÇAIS", bibliographyTitle: "Bibliographie",
    colTitle: "TITRE", colYear: "ANNÉE", colFormat: "FORMAT", colAccess: "ACCÈS NUMÉRIQUE",
    downloadPdf: "TÉLÉCHARGER PDF", listenAudio: "ÉCOUTER AUDIO", awaitingDigitization: "En attente de numérisation",
    mediaTitle: "Médiathèque Intégrée", addMedia: "AJOUTER MÉDIA",
    intellectualLineage: "LIGNÉE INTELLECTUELLE", notableDisciples: "DISCIPLES NOTABLES",
    relatedByField: "SAVANTS LIÉS PAR DOMAINE", academicReferences: "RÉFÉRENCES ACADÉMIQUES",
    revisionHistory: "HISTORIQUE DES RÉVISIONS", recentRevisions: "RÉVISIONS RÉCENTES",
    viewAllEdits: "VOIR TOUTES LES MODIFICATIONS",
    academicDiscussion: "Discussion Académique", joinDialogue: "Rejoindre le dialogue savant en français...",
    reply: "RÉPONDRE", vote: "VOTER", report: "SIGNALER",
    noContent: "Cette page n'a pas encore été contribuée en",
    noDiscussion: "Aucune discussion en français pour l'instant.", startDiscussion: "Démarrer la conversation →",
    contribute: "Contribuer maintenant →", createdBy: "CRÉÉ PAR", lastUpdated: "MIS À JOUR PAR",
    sharedNote: "Partagé entre toutes les langues", addWork: "AJOUTER ŒUVRE",
  },
};

export const PAGE_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Source+Serif+4:ital,opsz,wght@0,8..60,200..900;1,8..60,200..900&family=Source+Sans+3:ital,wght@0,200..900;1,200..900&family=JetBrains+Mono:ital,wght@0,100..800;1,100..800&family=Amiri:ital,wght@0,400;0,700;1,400&display=swap');
  @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap');
  .material-symbols-outlined { font-variation-settings: 'FILL' 0,'wght' 400,'GRAD' 0,'opsz' 24; font-family: 'Material Symbols Outlined'; display: inline-block; vertical-align: middle; }
  * { box-sizing: border-box; }
  a { text-decoration: none; }
  button { font-family: inherit; background: none; border: none; cursor: pointer; }
  .row-hover:hover { background: #f3f4f1; }
  .card-hover { transition: box-shadow 0.18s, border-color 0.18s; }
  .card-hover:hover { box-shadow: 0 4px 20px rgba(11,67,53,0.1); border-color: rgba(11,67,53,0.3) !important; }
  .tab-btn { padding: 14px 20px; border: none; border-bottom: 2px solid transparent; background: transparent; cursor: pointer; white-space: nowrap; font-family: 'JetBrains Mono', monospace; font-size: 11px; letter-spacing: 0.1em; color: #707974; transition: color 0.15s; }
  .tab-btn:hover { color: #0b4335; }
  .tab-btn.active { border-bottom-color: #0b4335; color: #0b4335; background: rgba(11,67,53,0.04); }
  .person-card:hover .person-name { color: #0b4335; }
  .action-link { background: none; border: none; padding: 0; cursor: pointer; font-family: 'JetBrains Mono', monospace; font-size: 10px; font-weight: 700; letter-spacing: 0.1em; color: #0b4335; display: inline-flex; align-items: center; gap: 4px; }
  .action-link:hover { text-decoration: underline; }
`;