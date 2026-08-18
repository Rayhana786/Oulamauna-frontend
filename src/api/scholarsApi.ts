// src/api/scholarsApi.ts

// ✅ FIX 1: Safe access to prevent TypeScript "Property 'env' does not exist" error
const API_URL = (import.meta as any).env?.VITE_API_URL || "http://localhost:5000";

// ─────────────────────────────────────────────
// Authentication
// ─────────────────────────────────────────────

function getToken(): string | null {
  return localStorage.getItem("token");
}

// ─────────────────────────────────────────────
// Generic request helper
// ─────────────────────────────────────────────

async function request(
  path: string,
  options: RequestInit = {},
  isScholarEndpoint = true
) {
  const token = getToken();

  const baseUrl = isScholarEndpoint
    ? `${API_URL}/api/scholars`
    : `${API_URL}/api`;

  const res = await fetch(`${baseUrl}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(data?.message || `Request failed (${res.status})`);
  }

  return data;
}

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export interface ApiDisciplineTranslation {
  language_id: number;
  name: string;
}

export interface ApiDiscipline {
  discipline_id: number;
  name: string;
  language_id?: number;
  discipline_translations?: ApiDisciplineTranslation[];
}

export interface ApiScholarDiscipline {
  discipline_id: number;
  disciplines: ApiDiscipline;
}

export interface ApiLanguage {
  language_id: number;
  code: string;
  name: string;
}

export interface ApiScholarDate {
  date_type: "birth" | "death";
  calendar: "hijri" | "gregorian";
  year: number | null;
  is_approximate?: boolean;
  raw_text?: string | null;
}

export interface ApiRegion {
  region_id: number;
  name: string;
  language_id: number;
}

export interface ApiScholarVersion {
  version_id: number;
  scholar_id: number;
  language_id: number;
  canonical_name: string;
  biography: string;
  status: "pending" | "approved" | "rejected";
  version_type: "creation" | "edition";
  image_url: string | null;
  image_status: string | null;
  created_at: string;
  scholar_aliases?: { alias_id: number; alias_name: string }[];
  languages?: ApiLanguage;
  regions?: ApiRegion | null;
  scholar_dates?: ApiScholarDate[];
  media?: { media_id: number; title: string; description: string | null; media_url: string; status: string }[];
  
  // ✅ FIX 2: Added these because your backend now includes them inside the version
  scholar_disciplines?: ApiScholarDiscipline[];
  comments?: { comment_id: number; content: string; created_at: string; users: { id: number; username: string } }[];
}

export interface ApiScholar {
  scholar_id: number;
  created_at: string;
  scholar_versions: ApiScholarVersion[];
  is_fallback?: boolean;
  displayed_language?: string;
  requested_language?: string;
}

export interface ApiListResponse {
  success: boolean;
  count?: number;
  data: ApiScholar[];
}

// ─────────────────────────────────────────────
// API
// ─────────────────────────────────────────────

export const scholarsApi = {
  list: (lang: string): Promise<ApiListResponse> =>
    request(`?lang=${encodeURIComponent(lang)}`),

  getById: (id: number, lang?: string): Promise<any> =>
    request(`/${id}${lang ? `?lang=${encodeURIComponent(lang)}` : ""}`),

  create: (payload: Record<string, unknown>): Promise<any> =>
    request("/", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  update: (id: number, payload: Record<string, unknown>): Promise<any> =>
    request(`/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),

  mySubmissions: (): Promise<any> => request("/my-submissions"),

  searchByName: (q: string, lang: string): Promise<any> =>
    request(`/name?q=${encodeURIComponent(q)}&lang=${encodeURIComponent(lang)}`),

  getLanguages: (): Promise<any> => request("/languages", {}, false),

  getDisciplines: (lang: string): Promise<any> =>
    request(`/discipline?lang=${encodeURIComponent(lang)}`, {}, false),

  getRegions: (lang: string): Promise<any> =>
    request(`/region?lang=${encodeURIComponent(lang)}`, {}, false),

  // ✅ ADDED: Post a new comment to a scholar
  addComment: (scholarId: number, text: string): Promise<any> =>
    request(`/${scholarId}/comments`, {
      method: "POST",
      body: JSON.stringify({ text }),
    }),
};