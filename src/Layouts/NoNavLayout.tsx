// src/layouts/NoNavLayout.tsx
import LanguageSwitcher from "../components/LanguageSwitcher";
import { Outlet } from "react-router-dom";

export default function NoNavLayout() {
  return (
    <div className="min-h-screen bg-[#fcfaf7]">
      <LanguageSwitcher />
      <main>
        <Outlet />
      </main>
    </div>
  );
}