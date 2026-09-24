import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useLang } from "../context/LanguageContext";

interface ContributorRouteProps {
  children: React.ReactNode;
}

const ContributorRoute: React.FC<ContributorRouteProps> = ({ children }) => {
  const { user, isLoggedIn, loading } = useAuth();
  const { lang, t } = useLang();
  const isRTL = lang === "AR";

  // 1. If still checking auth, show a simple loader
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fbf9f4]">
        <p className="text-[#1e4d3a] font-medium animate-pulse" style={{ fontFamily: "'Inter', sans-serif" }}>
          {t("contributorRoute.loading")}
        </p>
      </div>
    );
  }

  // 2. If not logged in, show a friendly message instead of forcing a redirect
  if (!isLoggedIn) {
    return (
      <div dir={isRTL ? "rtl" : "ltr"} className="min-h-screen bg-[#fbf9f4] flex items-center justify-center p-8">
        <div className="max-w-2xl w-full">
          <div className="bg-white rounded-2xl shadow-lg border border-[#1e4d3a]/20 p-8 text-center">
            <div className="w-16 h-16 bg-[#1e4d3a]/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-[#1e4d3a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
            </div>
            
            <h2 className="text-2xl font-bold text-[#1e4d3a] mb-3" style={{ fontFamily: "'Hanken Grotesk', sans-serif" }}>
              {t("contributorRoute.loginRequired.title")}
            </h2>
            
            <p className="text-[#1e4d3a]/70 mb-8" style={{ fontFamily: "'Inter', sans-serif" }}>
              {t("contributorRoute.loginRequired.message")}
            </p>
            
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <Link
                to="/login"
                className="px-6 py-3 bg-[#1e4d3a] text-white rounded-lg font-semibold hover:bg-[#1e4d3a]/90 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300 ease-in-out flex items-center gap-2"
                style={{ fontFamily: "'Hanken Grotesk', sans-serif" }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
                {t("contributorRoute.loginRequired.loginButton")}
              </Link>
              
              <button
                onClick={() => window.history.back()}
                className="px-6 py-3 bg-transparent border-2 border-[#1e4d3a] text-[#1e4d3a] rounded-lg font-semibold hover:bg-[#1e4d3a]/5 hover:-translate-y-0.5 hover:shadow-md transition-all duration-300 ease-in-out"
                style={{ fontFamily: "'Hanken Grotesk', sans-serif" }}
              >
                {t("contributorRoute.loginRequired.goBack")}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 3. Check restrictions
  const isBanned = user?.is_banned === true;
  // Admins are always allowed to contribute, regardless of the badge flag
  const canContribute = user?.role_name === "admin" || user?.allowed_to_contribute === true;
  const isRestricted = isBanned || !canContribute;

  // 4. If restricted, show the warning UI immediately
  if (isRestricted) {
    return (
      <div dir={isRTL ? "rtl" : "ltr"} className="min-h-screen bg-[#fbf9f4] flex items-center justify-center p-8">
        <div className="max-w-2xl w-full">
          <div className="bg-white rounded-2xl shadow-lg border border-[#b23b3b]/30 p-8 text-center">
            <div className="w-16 h-16 bg-[#b23b3b]/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-[#b23b3b]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            
            <h2 className="text-2xl font-bold text-[#1e4d3a] mb-3" style={{ fontFamily: "'Hanken Grotesk', sans-serif" }}>
              {isBanned ? t("contributorRoute.restricted.banned.title") : t("contributorRoute.restricted.revoked.title")}
            </h2>
            
            <p className="text-[#1e4d3a]/70 mb-6" style={{ fontFamily: "'Inter', sans-serif" }}>
              {isBanned 
                ? t("contributorRoute.restricted.banned.message")
                : t("contributorRoute.restricted.revoked.message")}
            </p>
            
            <button
              onClick={() => window.history.back()}
              className="px-6 py-3 bg-[#1e4d3a] text-white rounded-lg font-semibold hover:bg-[#1e4d3a]/90 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300 ease-in-out"
              style={{ fontFamily: "'Hanken Grotesk', sans-serif" }}
            >
              {t("contributorRoute.restricted.goBack")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 5. If all good, render the actual page
  return <>{children}</>;
};

export default ContributorRoute;