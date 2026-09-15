import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "../components/admin/AdminSidebar"; // ✅ Fixed import path
import AdminNavbar from "../components/admin/AdminNavbar";
import { useLang } from "../context/LanguageContext"; // ✅ Adjust path if needed

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

  // ✅ 1. ADD STATE TO TRACK SIDEBAR COLLAPSE
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

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
      {/* ✅ 2. PASS PROPS TO SIDEBAR */}
      <Sidebar 
        collapsed={sidebarCollapsed} 
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} 
      />
      
      <div
        style={{
          // ✅ 3. DYNAMIC MARGIN BASED ON COLLAPSED STATE
          marginLeft: isRTL ? 0 : (sidebarCollapsed ? 72 : 248),
          marginRight: isRTL ? (sidebarCollapsed ? 72 : 248) : 0,
          flex: 1,
          display: "flex",
          flexDirection: "column",
          height: "100vh",
          overflow: "hidden",
          // ✅ 4. SMOOTH ANIMATION WHEN TOGGLING
          transition: "margin-left 0.3s ease, margin-right 0.3s ease", 
        }}
      >
        <AdminNavbar pageTitleKey={titleKey} />
        <main style={{ flex: 1, overflowY: "auto", padding: "32px" }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}