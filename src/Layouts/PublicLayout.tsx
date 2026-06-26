// src/layouts/PublicLayout.tsx
import Navbar from "../components/Navbar";
import LanguageSwitcher from "../components/LanguageSwitcher";
import { Outlet } from "react-router-dom";

export default function PublicLayout() {
  return (
    <div className="min-h-screen bg-[#fcfaf7]">
      <Navbar />
      <LanguageSwitcher />
      <main>
        <Outlet />
      </main>
    </div>
  );
}