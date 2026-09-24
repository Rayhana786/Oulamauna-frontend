// src/layouts/PublicLayout.tsx
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

import { Outlet, useLocation } from "react-router-dom";

export default function PublicLayout() {
  const { pathname } = useLocation();
  const isHomePage = pathname === "/";

  return (
    <div className="min-h-screen bg-[#fcfaf7]">
      <Navbar />
      
      
      {/* ✅ Reduced spacing - adjust based on your navbar height */}
      <main className={isHomePage ? "" : "pt-12 md:pt-16"}>
        <Outlet />
      </main>
      
      <Footer />
    </div>
  );
}