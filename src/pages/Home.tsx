import React from "react";
import Hero from "../components/Hero";
import { useLang } from "../context/LanguageContext";
const Home: React.FC = () => {
  const { lang } = useLang();

  return (
    <div className="relative w-full bg-[#fcfaf7]">
      {/* Pass the lang prop down to the Hero */}
      <Hero />

      {/* Main Content Area */}
      <main className="relative z-30 -mt-20 px-6 md:px-24">
        {/* Your content will go here */}
      </main>
    </div>
  );
};

export default Home;