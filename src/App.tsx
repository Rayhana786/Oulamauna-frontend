// src/App.tsx
import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from "react-router-dom";

import Home from "./pages/Home";
import Navbar from "./components/Navbar";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import VerifyEmail from "./pages/VerifyEmail";


// NEW
import VerifyEmailPending from "./pages/VerifyEmailPending";
import LanguageSwitcher from "./components/LanguageSwitcher";

// ERROR PAGES
import NotFound from "./pages/errors/NotFound";
import ServerError from "./pages/errors/ServerError";
import Forbidden from "./pages/errors/Forbidden";
import InvalidToken from "./pages/errors/InvalidToken";
//context
import { AuthProvider } from "./context/AuthContext";
type Language = "EN" | "AR" | "FR";

function AppContent() {
  
  const navigate = useNavigate();
  const [currentLang, setCurrentLang] = useState<Language>("EN");
  const location = useLocation();

  

  const hideNavbar = [
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
    "/verify-email",
    "/verify-email-pending",
    "/500",           // Added to hide navbar
    "/403",           // Added to hide navbar
    "/invalid-token", // Added to hide navbar
  ].includes(location.pathname) || !["/", "/contact", "/about", "/login", "/forgot-password", "/reset-password", "/register", "/verify-email", "/verify-email-pending", "/dashboard"].includes(location.pathname); 
  // The line above ensures Navbar is hidden for 404 (any route not defined)

  

  return (
    <div className="min-h-screen bg-[#fcfaf7]">
      {!hideNavbar && (
        <Navbar
          
          lang={currentLang}
          setLang={setCurrentLang}
          
        />
      )}

      <LanguageSwitcher
        currentLang={currentLang}
        setCurrentLang={setCurrentLang}
      />

      <main>
        <Routes>
          <Route path="/" element={<Home lang={currentLang} />} />
          <Route path="/contact" element={<Contact lang={currentLang} />} />
          <Route path="/about" element={<About />} />
          <Route path="/login" element={<Login lang={currentLang} />} />
          <Route path="/forgot-password" element={<ForgotPassword lang={currentLang} />} />
          <Route path="/reset-password" element={<ResetPassword lang={currentLang} />} />
          <Route path="/register" element={<Register lang={currentLang} />} />
          <Route path="/verify-email" element={<VerifyEmail lang={currentLang} />} />
          <Route path="/verify-email-pending" element={<VerifyEmailPending lang={currentLang} />} />
          
          {/* ERROR ROUTES */}
         <Route path="/500" element={<ServerError lang={currentLang} />} />
<Route path="/403" element={<Forbidden lang={currentLang} />} />
<Route path="/invalid-token" element={<InvalidToken lang={currentLang} />} />
<Route path="*" element={<NotFound lang={currentLang} />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider> {/* Now Auth is available everywhere */}
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;