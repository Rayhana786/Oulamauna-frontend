import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "../components/admin/AdminSidebar";
import AdminNavbar from "../components/admin/AdminNavbar";
import { useLang } from "../context/LanguageContext";

// ✅ PERFECTLY MATCHES YOUR ADMIN SIDEBAR STRUCTURE
const PAGE_KEYS: Record<string, string> = {
  "/admin/dashboard":              "admin.sidebar.dashboard",
  "/admin/scholars":               "admin.sidebar.allScholars",
  "/admin/works":                  "admin.sidebar.allWorks",
  "/admin/media":                  "admin.sidebar.allMedia",
  "/admin/pending/scholars":       "admin.sidebar.pendingNewScholars",
  "/admin/pending/edits":          "admin.sidebar.pendingScholarEdits",
  "/admin/pending/works":          "admin.sidebar.pendingWorks",
  "/admin/pending/media":          "admin.sidebar.mediaVerification",
  "/admin/disciplines":            "admin.sidebar.disciplines",
  "/admin/regions":                "admin.sidebar.regions",
  "/admin/discussions":            "admin.sidebar.allDiscussions",
  "/admin/discussions/categories": "admin.sidebar.discussionCategories",
  "/admin/users":                  "admin.sidebar.userManagement",
  "/admin/reports":                "admin.sidebar.reports",
  "/admin/contactus":              "admin.sidebar.contactUs",
};

export default function AdminLayout() {
  const { pathname } = useLocation();
  const { lang } = useLang();
  const isRTL = lang === "AR";

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // ✅ Falls back to dashboard title if the exact path isn't in the list
  const titleKey = PAGE_KEYS[pathname] ?? "admin.sidebar.dashboard";

  return (
    <div
      dir={isRTL ? "rtl" : "ltr"}
      style={{
        display: "flex",
        height: "100vh",
        width: "100vw",
        overflow: "hidden",
        backgroundColor: "#fbf9f4",
      }}
    >
      {/* Sidebar */}
      <Sidebar 
        collapsed={sidebarCollapsed} 
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} 
      />
      
      {/* Main Content Area */}
      <div
        style={{
          marginLeft: isRTL ? 0 : (sidebarCollapsed ? 72 : 248),
          marginRight: isRTL ? (sidebarCollapsed ? 72 : 248) : 0,
          flex: 1,
          display: "flex",
          flexDirection: "column",
          height: "100vh",
          width: "100%",
          overflow: "hidden",
          transition: "margin-left 0.3s ease, margin-right 0.3s ease", 
        }}
      >
        <AdminNavbar pageTitleKey={titleKey} />
        
        <main style={{ flex: 1, overflowY: "auto", padding: 0, margin: 0, width: "100%" }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}