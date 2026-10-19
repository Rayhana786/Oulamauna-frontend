// src/components/Hero.tsx
import React from "react";
import { Link } from "react-router-dom";
import { useLang } from "../context/LanguageContext";

// Import the video directly from your assets folder
import heroVideo from "../assets/hero4.webm"; 
import heroPoster from "../assets/screen.png";

const Hero: React.FC = () => {
  const { lang, t } = useLang();
  const isRTL = lang === "AR";

  return (
    <section className="relative h-screen min-h-[700px] w-full overflow-hidden" dir={isRTL ? "rtl" : "ltr"}>
    {/* Video Background */}
<div className="absolute inset-0 w-full h-full bg-black">
  {/* Image appears immediately while the video loads */}
  <img
    src={heroPoster}
    alt=""
    fetchPriority="high"
    className="absolute inset-0 w-full h-full object-cover"
  />

  {/* Background Video */}
  <video
    autoPlay
    muted
    loop
    playsInline
    preload="auto"
    poster={heroPoster}
    className="absolute inset-0 w-full h-full object-cover"
  >
    <source src={heroVideo} type="video/webm" />
  </video>

  {/* Brighter neutral overlay */}
  <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/10 to-black/40" />
</div>

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col items-center justify-center px-[20px] md:px-[64px] text-center">
        <div className="max-w-4xl mx-auto">
          <p className="font-['JetBrains_Mono'] text-[11px] md:text-[13px] leading-[16px] text-[#C9A84C] uppercase tracking-[0.2em] font-bold mb-6 animate-fade-in">
            {t('hero.tagline')}
          </p>
          
          <h1 className="font-['Hanken_Grotesk'] text-4xl md:text-5xl lg:text-6xl leading-tight text-[#fbf9f4] font-bold mb-6 animate-fade-in-up">
            {t('hero.title')}
          </h1>
          
          <p className="font-['Inter'] text-lg md:text-xl leading-relaxed text-[#fbf9f4]/90 mb-10 max-w-2xl mx-auto animate-fade-in-up animation-delay-200">
            {t('hero.subtitle')}
          </p>
          
          <div className="flex justify-center items-center animate-fade-in-up animation-delay-400">
            <Link
              to="/scholars"
              className="px-8 py-4 bg-[#1e4d3a] text-[#fbf9f4] border-2 border-[#1e4d3a] rounded-lg text-[13px] font-bold tracking-[0.05em] font-['Hanken_Grotesk'] hover:bg-[#fbf9f4] hover:text-[#1e4d3a] transition-all duration-300"
            >
              {t('hero.exploreButton')}
            </Link>
          </div>
        </div>
      </div>

      {/* Custom Animations */}
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes fade-in-up {
          from { 
            opacity: 0;
            transform: translateY(30px);
          }
          to { 
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 1s ease-out forwards;
        }
        .animate-fade-in-up {
          animation: fade-in-up 1s ease-out forwards;
          opacity: 0;
        }
        .animation-delay-200 {
          animation-delay: 0.2s;
        }
        .animation-delay-400 {
          animation-delay: 0.4s;
        }
      `}</style>
    </section>
  );
};

export default Hero;