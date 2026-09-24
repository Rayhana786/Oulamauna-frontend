// src/layouts/NoNavLayout.tsx

import { Outlet } from "react-router-dom";
import Footer from "../components/Footer";
export default function NoNavLayout() {
  return (
    <div className="min-h-screen bg-[#fcfaf7]">
      
      <main>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}