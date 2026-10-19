import React from "react";
import { Link } from "react-router-dom";
import { useLang } from "../context/LanguageContext";

import heroVideo from "../assets/hero4.webm";

const Hero: React.FC = () => {
  const { lang, t } = useLang();
  const isRTL = lang === "AR";

  return (
    <section
      className="relative h-[100svh] min-h-[600px] w-full overflow-hidden md:min-h-[650px]"
      dir={isRTL ? "rtl" : "ltr"}
    >
      {/* Background: poster + video start loading together, like the original */}
      <div className="absolute inset-0 h-full w-full overflow-hidden bg-black">
        <img
          src="/screen.webp"
          alt=""
          fetchPriority="high"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover"
        />

        <video
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          poster="/screen.webp"
          onCanPlay={(e) => {
            
            e.currentTarget.style.opacity = "1";
          }}
          className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-500"
          aria-hidden="true"
        >
          <source src={heroVideo} type="video/webm" />
        </video>

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/30 via-black/10 to-black/40" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex h-full flex-col items-center justify-center px-5 py-16 text-center sm:px-8 md:px-16">
        <div className="mx-auto w-full max-w-4xl">
          {/* Tagline */}
          <p className="mb-4 font-['JetBrains_Mono'] text-[10px] font-bold uppercase leading-5 tracking-[0.15em] text-[#C9A84C] sm:mb-6 sm:text-xs sm:tracking-[0.2em] md:text-[13px]">
            {t("hero.tagline")}
          </p>

          {/* Main Heading */}
          <h1 className="mb-5 font-['Hanken_Grotesk'] text-3xl font-bold leading-tight text-[#fbf9f4] sm:text-4xl md:mb-6 md:text-5xl lg:text-6xl">
            {t("hero.title")}
          </h1>

          {/* Subtitle */}
          <p className="mx-auto mb-8 max-w-2xl font-['Inter'] text-base leading-relaxed text-[#fbf9f4]/90 sm:text-lg md:mb-10 md:text-xl">
            {t("hero.subtitle")}
          </p>

          {/* Explore Button */}
          <div className="flex justify-center">
            <Link
              to="/scholars"
              className="inline-flex min-h-12 items-center justify-center rounded-lg border-2 border-[#1e4d3a] bg-[#1e4d3a] px-6 py-3 text-center font-['Hanken_Grotesk'] text-xs font-bold tracking-wide text-[#fbf9f4] transition-colors duration-300 hover:bg-[#fbf9f4] hover:text-[#1e4d3a] sm:px-8 sm:py-4 sm:text-[13px]"
            >
              {t("hero.exploreButton")}
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
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .animate-fade-in {
          animation: fade-in 1s ease-out forwards;
        }

        .animate-fade-in-up {
          animation: fade-in-up 1s ease-out forwards;
          opacity: 0;
        }

        .animation-delay-200 { animation-delay: 0.2s; }
        .animation-delay-400 { animation-delay: 0.4s; }
      `}</style>
    </section>
  );
};

export default Hero;