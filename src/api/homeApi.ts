// src/api/homeApi.js
//
// Talks to GET /api/home (mounted in app.js via:
//   app.use("/api/home", require("./routes/home.route"));
// )

// Adjust this if your project already has a shared axios instance /
// base URL config elsewhere — point it at the same backend origin.
const API_BASE_URL =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_URL) ||
  process.env.REACT_APP_API_URL ||
  "";

export async function fetchHomeData(lang = 'EN') {
  const response = await fetch(`${API_BASE_URL}/api/home?lang=${lang}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch home data (status ${response.status})`);
  }

  const json = await response.json();

  if (!json.success) {
    throw new Error(json.message || "Failed to fetch home data");
  }

  return json.data;
}