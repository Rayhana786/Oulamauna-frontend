// src/layouts/NoNavLayout.tsx
import LanguageSwitcher from "../components/LanguageSwitcher";
import { Outlet } from "react-router-dom";
import Footer from "../components/Footer";
export default function NoNavLayout() {
  return (
    <div className="min-h-screen bg-[#fcfaf7]">
      <LanguageSwitcher />
      <main>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}