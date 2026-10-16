
import { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "../components/admin/AdminSidebar";
import AdminNavbar from "../components/admin/AdminNavbar";
import { useLang } from "../context/LanguageContext";

// Page title translations
const PAGE_KEYS: Record<string, string> = {
  "/admin/dashboard": "admin.sidebar.dashboard",
  "/admin/scholars": "admin.sidebar.allScholars",
  "/admin/works": "admin.sidebar.allWorks",
  "/admin/media": "admin.sidebar.allMedia",
  "/admin/pending/scholars": "admin.sidebar.pendingNewScholars",
  "/admin/pending/edits": "admin.sidebar.pendingScholarEdits",
  "/admin/pending/works": "admin.sidebar.pendingWorks",
  "/admin/pending/media": "admin.sidebar.mediaVerification",
  "/admin/disciplines": "admin.sidebar.disciplines",
  "/admin/regions": "admin.sidebar.regions",
  "/admin/discussions": "admin.sidebar.allDiscussions",
  "/admin/discussions/categories": "admin.sidebar.discussionCategories",
  "/admin/users": "admin.sidebar.userManagement",
  "/admin/reports": "admin.sidebar.reports",
  "/admin/contactus": "admin.sidebar.contactUs",
};

export default function AdminLayout() {
  const { pathname } = useLocation();
  const { lang } = useLang();
  const isRTL = lang === "AR";

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(
    () => window.innerWidth <= 1024
  );

  // Detect mobile/tablet screen sizes
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 1024;

      setIsMobile(mobile);

      if (!mobile) {
        setMobileOpen(false);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  // Close the mobile sidebar when navigating to another page
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const titleKey =
    PAGE_KEYS[pathname] ?? "admin.sidebar.dashboard";

  const sidebarWidth = sidebarCollapsed ? 72 : 248;

  return (
    <div
      dir={isRTL ? "rtl" : "ltr"}
      style={{
        display: "flex",
        position: "relative",
        height: "100dvh",
       
        width: "100%",
        maxWidth: "100%",
        overflow: "hidden",
        backgroundColor: "#fbf9f4",
      }}
    >
      {/* Sidebar */}
      <Sidebar
        collapsed={isMobile ? false : sidebarCollapsed}
        onToggle={() => setSidebarCollapsed((prev) => !prev)}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      {/* Main content */}
      <div
        style={{
          flex: 1,
          minWidth: 0,
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          marginLeft: !isRTL && !isMobile ? sidebarWidth : 0,
          marginRight: isRTL && !isMobile ? sidebarWidth : 0,
          transition: "margin-left 0.3s ease, margin-right 0.3s ease",
        }}
      >
        <AdminNavbar
          pageTitleKey={titleKey}
          onMenuClick={() => setMobileOpen(true)}
        />

        <main
          style={{
            flex: 1,
            minHeight: 0,
            minWidth: 0,
            overflowY: "auto",
            overflowX: "hidden",
            padding: 0,
            margin: 0,
            width: "100%",
            boxSizing: "border-box",
          }}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}
