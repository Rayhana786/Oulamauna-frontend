// src/App.tsx
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// Layouts
import PublicLayout from "./Layouts/PublicLayout";
import NoNavLayout from "./Layouts/NoNavLayout";
import AdminLayout from "./Layouts/AdminLayout";

// Route guard
import ProtectedRoute from "./components/ProtectedRoute";

// Contexts
import { AuthProvider } from "./context/AuthContext";
import { LanguageProvider } from "./context/LanguageContext";

// Public pages (with navbar)
import Home from "./pages/Home";
import About from "./pages/About";
import Contact from "./pages/Contact";
import ForumPage from "./pages/Forum/ForumPage";
import ForumPost from "./pages/Forum/ForumPost";
import FAQ from "./pages/FAQ";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import Terms from "./pages/Terms";
import ScholarsPage from "./pages/Scholars/ScholarsPage";
import Editscholarpage from "./pages/Scholars/Editscholarpage";

// Auth pages (no navbar)
import Login from "./pages/Authentication/Login";
import Register from "./pages/Authentication/Register";
import ForgotPassword from "./pages/Authentication/ForgotPassword";
import ResetPassword from "./pages/Authentication/ResetPassword";
import VerifyEmail from "./pages/Authentication/VerifyEmail";
import VerifyEmailPending from "./pages/Authentication/VerifyEmailPending";
// Account pages
import ProfilePage from "./pages/Account/ProfilePage";
import Editprofilepage from "./pages/Account/Editprofilepage";
import DashboardPage from "./pages/Account/DashboardPage";
import SettingsPage from "./pages/Account/Settingspage";

//scholars pages
import ScholarsPageDetails from "./pages/Scholars/ScholarDetailPage";
import EditScholarPage from "./pages/Scholars/Editscholarpage";
import Submitscholarpage from "./pages/Scholars/Submitscholarpage";

// Error pages (no navbar)
import NotFound from "./pages/errors/NotFound";
import ServerError from "./pages/errors/ServerError";
import Forbidden from "./pages/errors/Forbidden";
import InvalidToken from "./pages/errors/InvalidToken";

// Admin pages
import AdminProfilePage from "./pages/admin/AdminProfilePage";
import AdminDashboard from "./pages/admin/Admindashboard";
import NewScholarsQueue from "./pages/admin/NewScholarsQueue";
import ScholarReview from "./pages/admin/ScholarReview";
import PendingEditsQueue from "./pages/admin/PendingEditsQueue";
import PendingEditReview from "./pages/admin/PendingEditReview";
import MediaPendingQueue from "./pages/admin/MediaPendingQueue";
import WorksPendingQueue from "./pages/admin/WorksPendingQueue";
import DisciplineManagement from "./pages/admin/DisciplineManagement"; 
import RegionManagement from "./pages/admin/RegionManagement";
// import AdminScholars from "./pages/admin/AdminScholars"; // add as you build them

function App() {
   const testLoggedInUserId = "21";
  return (
    
    <Router>
      <LanguageProvider>
        <AuthProvider>
          <Routes>

            {/* ── PUBLIC ROUTES (with public Navbar) ── */}
            <Route element={<PublicLayout />}>
              <Route path="/" element={<Home />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/faq" element={<FAQ />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/scholars" element={<ScholarsPage />} />
              <Route path="/forum" element={<ForumPage />} />
              <Route path="/forum/:id" element={<ForumPost />} />
              <Route path="/edit-profile" element={<Editprofilepage />} />
              <Route path="/profile" element={<ProfilePage />} />
<Route path="/profile/:id" element={<ProfilePage />} />
<Route path="/dashboard" element={<DashboardPage />} />
<Route path="/settings" element={<SettingsPage />} />
</Route>
 <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

            {/* ── AUTH + ERROR ROUTES (no navbar at all) ── */}
            <Route element={<NoNavLayout />}>
             
              
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/verify-email" element={<VerifyEmail />} />
              <Route path="/verify-email-pending" element={<VerifyEmailPending />} />
              <Route path="/500" element={<ServerError />} />
              <Route path="/403" element={<Forbidden />} />
              <Route path="/invalid-token" element={<InvalidToken />} />
              <Route path="*" element={<NotFound />} />

              {/* ── SCHOLARS ROUTES (with public Navbar) ── */}

              <Route path="/scholars/:id" element={<ScholarsPageDetails />} />
              <Route path="/scholars/:id/edit/:lang" element={<Editscholarpage />} />
              
              <Route path="/scholars/submit" element={<Submitscholarpage />} />
              <Route path="/scholars/submit/:lang" element={<Submitscholarpage />} /> {/* ✅ ADDED: Handles /scholars/submit/ar perfectly */}
              
              <Route path="/scholars/:scholarId/submit/:lang" element={<Submitscholarpage />} />
            </Route>

            {/* ── ADMIN ROUTES (sidebar + admin navbar, protected) ── */}
            <Route element={<NoNavLayout />}>
              <Route element={<AdminLayout />}>
              <Route path="/admin/profile" element={<AdminProfilePage />} />
                <Route path="/admin/dashboard" element={<AdminDashboard />} />
                <Route path="/admin/pending/scholars" element={<NewScholarsQueue />} />
                <Route path="/admin/pending/scholars/:id" element={<ScholarReview />} />
                <Route path="/admin/pending/edits" element={<PendingEditsQueue />} />
                <Route path="/admin/pending/edits/:id" element={<PendingEditReview />} />
                <Route path="/admin/pending/media" element={<MediaPendingQueue />} />
                <Route path="/admin/pending/works" element={<WorksPendingQueue />} />
                <Route path="/admin/disciplines" element={<DisciplineManagement />} /> {/* ✅ ADDED: Discipline Management page */}
                <Route path="/admin/regions" element={<RegionManagement />} /> {/* ✅ ADDED: Region Management page */}
                {/* Add more admin routes here as you build them: */}
                {/* <Route path="scholars" element={<AdminScholars />} /> */}
                {/* <Route path="scholars/new" element={<AdminAddScholar />} /> */}
              </Route>
            </Route>

          </Routes>
        </AuthProvider>
      </LanguageProvider>
    </Router>
  );
}

export default App;