const API_BASE_URL =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_URL) ||
  process.env.REACT_APP_API_URL ||
  "/api";

export interface SearchResult {
  type: "scholar" | "work" | "media" | "post";
  scholar_id?: number | null;   // scholar + work + media
  focus_type?: "work" | "media"; // work + media only
  focus_id?: number;             // work_id or media_id
  post_id?: number;              // post only
  lang?: string;                 // scholar + work + media (language of the matched version)
  title: string;
  subtitle: string;
}

export interface SearchResponse {
  scholars: SearchResult[];
  works: SearchResult[];
  media: SearchResult[];
  posts: SearchResult[];
}

export async function searchGlobal(q: string, lang: string = "EN"): Promise<SearchResponse> {
  if (!q.trim()) return { scholars: [], works: [], media: [], posts: [] };

  const response = await fetch(
    `${API_BASE_URL}/api/search?q=${encodeURIComponent(q)}&lang=${lang}`
  );
  if (!response.ok) throw new Error("Search failed");

  const json = await response.json();
  return json.success ? json.data : { scholars: [], works: [], media: [], posts: [] };
}