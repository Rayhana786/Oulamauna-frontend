export type Language = "EN" | "AR" | "FR";
export type TabId = "works" | "media" | "relations" | "more";
export type AccessMode = "none" | "upload" | "link";
export type CommentsByLang = Record<Language, Comment[]>;
export type DraftByLang = Record<Language, string>;
export type VotedIds = Record<number, boolean>;

export interface Contributor { name: string; contributions: number; profileUrl?: string; }
export interface Work {
  title: string; year: number; format: "BOOK" | "MANUSCRIPT" | "ARTICLE";
  digitalAccess?: "pdf" | "audio" | "file" | null;
  accessUrl?: string; accessFileName?: string; accessSource?: "upload" | "link";
}
export interface MediaItem {
  type: "pdf" | "audio" | "video"; title: string; description: string;
  meta: string; action: string; actionIcon: string;
  accessUrl?: string; accessSource?: "upload" | "link"; accessFileName?: string;
}
export interface RelatedPerson {
  initials: string; color: string; textColor: string;
  name: string; role: string; profileUrl?: string;
}
export interface RelatedScholar { labelColor: string; label: string; name: string; description: string; }
export interface Reference { text: string; }
export interface RevisionEntry { author: string; date: string; description: string; isPrimary: boolean; }
export interface RecentRevision { date: string; author: string; action: string; authorUrl?: string; }
export interface LangContent<T> { EN?: T; AR?: T; FR?: T; }
export interface Comment {
  id: number; author: string; role: string | null;
  text: string; time: string; votes: number; replies?: Comment[];
}
export interface ScholarDetail {
  id: number;
  name: LangContent<string>; subtitle: LangContent<string>;
  createdBy: string; createdByUrl: string; createdDate: string;
  lastUpdatedBy: string; lastUpdatedByUrl: string; lastUpdatedDate: string;
  image: string;
  quote: LangContent<string>; overviewText: LangContent<string>; body: LangContent<string[]>;
  atAGlance: { fullName: string; born: string; died: string; century: string; region: string; discipline: string; expertise: string; };
  contributors: Contributor[];
  works: Work[]; media: MediaItem[];
  intellectualLineage: RelatedPerson[]; notableDisciples: RelatedPerson[];
  relatedScholars: RelatedScholar[];
  academicReferences: Reference[]; revisionHistory: RevisionEntry[]; recentRevisions: RecentRevision[];
}
export interface UITranslation {
  overview: string; atAGlance: string; fullName: string; born: string; died: string;
  century: string; region: string; discipline: string; expertise: string;
  allContributors: string; contributor: string; contributions: string; contributors: string;
  citePage: string; tabs: string[]; editBtn: string; bibliographyTitle: string;
  colTitle: string; colYear: string; colFormat: string; colAccess: string;
  downloadPdf: string; listenAudio: string; awaitingDigitization: string;
  mediaTitle: string; addMedia: string;
  intellectualLineage: string; notableDisciples: string; relatedByField: string;
  academicReferences: string; revisionHistory: string; recentRevisions: string; viewAllEdits: string;
  academicDiscussion: string; joinDialogue: string;
  reply: string; vote: string; report: string;
  noContent: string; noDiscussion: string; startDiscussion: string; contribute: string;
  createdBy: string; lastUpdated: string; sharedNote: string; addWork: string;
}