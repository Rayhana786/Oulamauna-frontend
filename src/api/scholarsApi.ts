// src/api/scholarsApi.ts
// Single consolidated API layer for the Scholar Page endpoints.

const API_URL = import.meta.env.VITE_API_URL;

function getToken(): string | null {
  return localStorage.getItem("token"); // adjust key if you store it elsewhere
}

async function request(path: string, options: RequestInit = {}) {
  const token = getToken();

  const res = await fetch(`${API_URL}/api/scholars${path}`, {
    ...options,
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

// ── Types matching the ACTUAL Prisma response (note the typo'd field names) ──

export interface ApiDisciplineTranslation {
  language_id: number;
  name: string; // ⚠️ confirm this is the actual column name
}

export interface ApiDiscipline {
  discipline_id: number;
  discipline_translations: ApiDisciplineTranslation[];
}

export interface ApiScholarDiscipline {
  discipline_id: number;
  disciplines: ApiDiscipline;
}

export interface ApiLanguage {
  language_id: number;
  code: string;
}

export interface ApiScholarVersion {
  version_id: number;
  scholar_id: number;
  language_id: number;
  canonical_name: string;
  region: string | null;
  // ⚠️ typo preserved on purpose — matches the real DB column from the controller
  birth_date_gerogean: string | null;
  birth_date_hijri: string | null;
  death_date_gerogean: string | null;
  death_date_hijri: string | null;
  century_hijri: string | null;
  century_gregorian: string | null;
  biography: string;
  status: "pending" | "approved" | "rejected";
  version_type: "creation" | "edition";
  created_at: string;
  scholar_aliases?: { alias_name: string }[];
  languages?: ApiLanguage;
}

export interface ApiScholar {
  scholar_id: number;
  created_at: string;
  scholar_versions: ApiScholarVersion[];
  scholar_disciplines: ApiScholarDiscipline[];

  // from backend
  is_fallback?: boolean;
  displayed_language?: string;
  requested_language?: string;
}
export interface ApiListResponse {
  success: boolean;
  data: ApiScholar[];
}

export const scholarsApi = {
  list: (lang: string): Promise<ApiListResponse> =>
    request(`?lang=${encodeURIComponent(lang)}`),

  getById: (id: number, lang?: string) =>
    request(`/${id}${lang ? `?lang=${encodeURIComponent(lang)}` : ""}`),

  create: (payload: Record<string, unknown>) =>
    request(`/`, { method: "POST", body: JSON.stringify(payload) }),

  update: (id: number, payload: Record<string, unknown>) =>
    request(`/${id}`, { method: "PUT", body: JSON.stringify(payload) }),

  mySubmissions: () => request(`/my-submissions`),
};