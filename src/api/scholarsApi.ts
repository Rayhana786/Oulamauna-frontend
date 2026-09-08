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

// Separate helper for multipart/form-data requests (file uploads).
// Must NOT set Content-Type manually — the browser sets it with the
// correct multipart boundary when you pass a FormData body.
// Replace your existing requestForm function with this:
async function requestForm(
  path: string, 
  formData: FormData, 
  method: string = "POST",
  isScholarEndpoint: boolean = true
) {
  const token = getToken();
  const baseUrl = isScholarEndpoint ? `${API_URL}/api/scholars` : `${API_URL}/api`;

  console.log("🚀 Sending request to:", `${baseUrl}${path}`);
  console.log("📦 FormData keys being sent:", Array.from(formData.keys()));

  const res = await fetch(`${baseUrl}${path}`, {
    method,
    credentials: "include",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      // DO NOT set 'Content-Type': 'multipart/form-data' here. 
      // The browser sets it automatically with the correct boundary.
    },
    body: formData,
  });

  console.log("📡 Response status:", res.status);

  let data;
  try {
    data = await res.json();
  } catch (e) {
    // If the backend returns an HTML error page (like a 500 crash), res.json() fails.
    // This catches it and prints the raw HTML/text so you can see the actual backend error.
    const rawText = await res.text();
    console.error("❌ Backend did not return JSON. Raw response:", rawText);
    data = { message: `Server returned ${res.status} (Non-JSON response)` };
  }

  if (!res.ok) {
    const errorMsg = data?.message || data?.error || `Request failed with status ${res.status}`;
    console.error("❌ API Error Details:", errorMsg, data);
    throw new Error(errorMsg);
  }

  return data;
}

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
  status: "draft" | "pending" | "approved" | "rejected" | "superseded";
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

// Add this below your existing types
export interface EditScholarResponse {
  success: boolean;
  message: string;
  data: {
    newVersion: ApiScholarVersion;
    carriedOverContent: {
      works: any[];
      media: any[];
      references: any[];
      dates: ApiScholarDate[];
      relationships: {
        relationship_id: number;
        relation_type: "teacher" | "student";
        related_version_id: number;
        related_scholar_version?: {
          scholar_id: number;
          canonical_name: string;
          languages?: { code: string; name: string };
        };
      }[];
    };
  };
}

// ─────────────────────────────────────────────
// API
// ─────────────────────────────────────────────

export const scholarsApi = {
  list: (lang: string): Promise<ApiListResponse> =>
    request(`?lang=${encodeURIComponent(lang)}`),

  getById: (id: number, lang?: string): Promise<any> =>
    request(`/${id}${lang ? `?lang=${encodeURIComponent(lang)}` : ""}`),

   create: (payload: Record<string, unknown> | FormData): Promise<any> => {
    if (payload instanceof FormData) {
      // ✅ Pass 'true' so it hits /api/scholars/
      return requestForm("/", payload, "POST", true); 
    }
    return request("/", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

      update: (id: number, payload: Record<string, unknown> | FormData): Promise<EditScholarResponse> => {
    if (payload instanceof FormData) {
      // ✅ Changed to "PATCH" to match standard REST and most Express routers
      return requestForm(`/${id}`, payload, "PATCH", true); 
    }
    return request(`/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  },

    mySubmissions: (): Promise<any> => request("/my-submissions"),

  saveDraft: (payload: Record<string, unknown>): Promise<any> =>
    request("/draft", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

    getMyDrafts: (): Promise<any> =>
    request("/drafts"),

  getDraftById: (versionId: number): Promise<any> =>
    request(`/draft/${versionId}`),

  deleteDraft: (versionId: number): Promise<any> =>
    request(`/draft/${versionId}`, { method: "DELETE" }),

  submitDraft: (versionId: number): Promise<any> =>
    request(`/draft/${versionId}/submit`, { method: "POST" }),

  getVersionById: (versionId: number): Promise<any> =>
    request(`/version/${versionId}`),
    // ✅ Dedicated Rejected Endpoints
  updateRejected: (versionId: number, payload: any): Promise<any> =>
    request(`/rejected/${versionId}`, { 
      method: "PUT", 
      body: JSON.stringify(payload) 
    }),

  deleteRejected: (versionId: number): Promise<any> =>
    request(`/rejected/${versionId}`, { method: "DELETE" }),

  addRelationship: (payload: { version_id: number; related_version_id: number; relation_type: string }): Promise<any> =>
    request("/relationships", { method: "POST", body: JSON.stringify(payload) }),  

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
    
  addMedia: (versionId: number, formData: FormData): Promise<any> =>
    requestForm(`/media`, formData, "POST", false), // ✅ Added false
  
  // Alternative for external URL (JSON)
  addMediaUrl: (versionId: number, mediaData: {
    version_id: number;
    title: string;
    year?: number;
    description?: string;
    media_url: string;
  }): Promise<any> =>
    request(`/media`, {
      method: "POST",
      body: JSON.stringify(mediaData),
    }, false), // ✅ Added false
      
  addWork: (versionId: number, formData: FormData): Promise<any> =>
    requestForm(`/work`, formData, "POST", false), // ✅ Added false
  
  addWorkUrl: (versionId: number, workData: {
    version_id: number;
    title: string;
    year?: number;
    format: string;
    description?: string;
    media_url?: string;
  }): Promise<any> =>
    request(`/work`, {
      method: "POST",
      body: JSON.stringify(workData),
    }, false), // ✅ Already had false, kept it

      // View Media (increments view_count, no auth required)
  viewMedia: (mediaId: number): Promise<any> =>
    request(`/media/view/${mediaId}`, { method: "POST" }, false),

  // Toggle Like/Unlike Media (requires auth, token is attached automatically)
  toggleMediaLike: (mediaId: number): Promise<any> =>
    request(`/media/like/${mediaId}`, { method: "POST" }, false),
};