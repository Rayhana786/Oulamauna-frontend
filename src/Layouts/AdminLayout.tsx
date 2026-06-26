// src/components/admin/AdminLayout.tsx
import { Outlet } from "react-router-dom";
import Sidebar from "../components/admin/AdminSidebar";
import AdminNavbar from "../components/admin/AdminNavbar";
import { useLocation } from "react-router-dom";
import { useLang } from "../context/LanguageContext";

const PAGE_KEYS: Record<string, string> = {
  "/admin":                       "navbar.dashboard",
  "/admin/scholars":              "sidebar.allScholars",
  "/admin/scholars/new":          "sidebar.addScholar",
  "/admin/pending/scholars":      "sidebar.pendingProfiles",
  "/admin/pending/edits":         "sidebar.workEdits",
  "/admin/pending/works":         "sidebar.pendingWorks",
  "/admin/pending/media":         "sidebar.mediaVerification",
  "/admin/rejected":              "sidebar.rejected",
  "/admin/disciplines":           "sidebar.disciplines",
  "/admin/blog":                  "sidebar.allPosts",
  "/admin/blog/reported":         "sidebar.reported",
  "/admin/users/contributors":    "sidebar.contributors",
  "/admin/users/banned":          "sidebar.bannedUsers",
  "/admin/reports":               "sidebar.reports",
  "/admin/notifications":         "sidebar.notifications",
  "/admin/settings/translation":  "sidebar.translation",
  "/admin/settings/regions":      "sidebar.regions",
  "/admin/settings/backups":      "sidebar.backups",
};

export default function AdminLayout() {
  const { pathname } = useLocation();
  const { lang } = useLang();
  const isRTL = lang === "AR";

  const titleKey = PAGE_KEYS[pathname] ?? "navbar.dashboard";

  return (
    <div
      dir={isRTL ? "rtl" : "ltr"}
      style={{
        display: "flex",
        height: "100vh",
        overflow: "hidden",
       
      }}
    >
      <Sidebar />
      <div
        style={{
          marginLeft: isRTL ? 0 : 248,
          marginRight: isRTL ? 248 : 0,
          flex: 1,
          display: "flex",
          flexDirection: "column",
          height: "100vh",
          overflow: "hidden",
        }}
      >
        <AdminNavbar pageTitleKey={titleKey} />
        <main style={{ flex: 1, overflowY: "auto", padding: "32px" }}>
          <Outlet />  {/* ← renders the matched child route */}
        </main>
      </div>
    </div>
  );
}