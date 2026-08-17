// src/api/scholarsApi.ts

const API_URL = import.meta.env.VITE_API_URL;

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

    // Send authentication cookies
    credentials: "include",

    headers: {
      "Content-Type": "application/json",

      ...(token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : {}),

      ...(options.headers || {}),
    },
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(
      data?.message || `Request failed (${res.status})`
    );
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
  name: string; // ✅ flat table now — the name lives HERE
  discipline_translations?: ApiDisciplineTranslation[]; // legacy, no longer returned by the API
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
}

export interface ApiScholarVersion {
  version_id: number;
  scholar_id: number;
  language_id: number;

  canonical_name: string;

  biography: string;

  status: "pending" | "approved" | "rejected";

  version_type: "creation" | "edition";

  image_url: string | null;   // ✅ the photo (null when not approved)
  image_status: string | null;

  created_at: string;

  scholar_aliases?: {
    alias_name: string;
  }[];

  languages?: ApiLanguage;

  regions?: ApiRegion | null;      // ✅ the region object
  scholar_dates?: ApiScholarDate[]; // ✅ birth/death years
}

// ─────────────────────────────────────────────
// Scholar
// ─────────────────────────────────────────────

export interface ApiScholar {
  scholar_id: number;

  created_at: string;

  scholar_versions: ApiScholarVersion[];

  scholar_disciplines: ApiScholarDiscipline[];

  is_fallback?: boolean;

  displayed_language?: string;

  requested_language?: string;
}

// ─────────────────────────────────────────────
// List response
// ─────────────────────────────────────────────

export interface ApiListResponse {
  success: boolean;

  count?: number;

  data: ApiScholar[];
}

// ─────────────────────────────────────────────
// API
// ─────────────────────────────────────────────

export const scholarsApi = {
  // GET /api/scholars?lang=1
  list: (lang: string): Promise<ApiListResponse> =>
    request(`?lang=${encodeURIComponent(lang)}`),

  // GET /api/scholars/:id
  getById: (id: number, lang?: string) =>
    request(
      `/${id}${lang ? `?lang=${encodeURIComponent(lang)}` : ""}`
    ),

  // POST /api/scholars
  create: (payload: Record<string, unknown>) =>
    request("/", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  // PATCH /api/scholars/:id
  update: (
    id: number,
    payload: Record<string, unknown>
  ) =>
    request(`/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),

  // GET /api/scholars/my-submissions
  mySubmissions: () =>
    request("/my-submissions"),

  // GET /api/scholars/name?q=...&lang=...
  searchByName: (q: string, lang: string): Promise<{ success: boolean; data: ApiScholar }> =>
    request(`/name?q=${encodeURIComponent(q)}&lang=${encodeURIComponent(lang)}`),

  // Metadata
  getLanguages: () =>
    request("/languages", {}, false),

  getDisciplines: () =>
    request("/disciplines", {}, false),
};