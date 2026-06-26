// src/pages/Welcome.tsx
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { BadgeCheck, ArrowRight, Home } from "lucide-react";
// @ts-ignore
import libraryImg from "../assets/library-1.jpg";
import { useLang } from "../context/LanguageContext";
type Language = "EN" | "AR" | "FR";

const Welcome: React.FC = () => {
  const { lang } = useLang();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(5);

  const content: Record<Language, any> = {
    EN: {
      category: "WELCOME",
      title: "Welcome to Oulamauna!",
      subtitle: "Your email has been verified successfully.",
      message: "You're now part of our community of scholars and learners.",
      redirect: "Redirecting to home",
      goToHome: "Go to Home",
      explore: "Explore Scholars",
      counting: "in",
    },
    AR: {
      category: "مرحباً",
      title: "مرحباً بك في علماءنا!",
      subtitle: "تم تأكيد بريدك الإلكتروني بنجاح.",
      message: "أنت الآن جزء من مجتمعنا من العلماء والمتعلمين.",
      redirect: "جاري التوجيه للرئيسية",
      goToHome: "الذهاب للرئيسية",
      explore: "استكشف العلماء",
      counting: "خلال",
    },
    FR: {
      category: "BIENVENUE",
      title: "Bienvenue sur Oulamauna !",
      subtitle: "Votre e-mail a été vérifié avec succès.",
      message: "Vous faites maintenant partie de notre communauté de savants et d'apprenants.",
      redirect: "Redirection vers l'accueil",
      goToHome: "Aller à l'accueil",
      explore: "Explorer les savants",
      counting: "dans",
    },
  };

  const t = content[lang || "EN"];
  const isRTL = lang === "AR";

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate("/");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [navigate]);

  return (
    <div className="relative h-screen w-full flex flex-col items-center bg-[#FDFCFB] overflow-hidden font-sans">
      {/* Hero Header */}
      <div className="relative w-full h-[35vh] overflow-hidden flex flex-col items-center justify-center pt-6">
        <img src={libraryImg} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-[#285B4B]/85 mix-blend-multiply" />
        <h1 className="relative z-10 text-white text-lg font-serif tracking-[0.4em] uppercase">OULAMAUNA</h1>
      </div>

      {/* Welcome Card */}
      <div
        className="relative z-20 -mt-12 w-full max-w-[400px] mx-4 p-8 bg-white rounded-2xl shadow-2xl border border-gray-50 flex flex-col items-center text-center"
        dir={isRTL ? "rtl" : "ltr"}
      >
        <span className="text-[#B59A5B] text-[8px] font-bold tracking-[0.2em] uppercase block mb-6">
          {t.category}
        </span>

        {/* Success Icon */}
        <div className="mb-6 w-20 h-20 bg-[#E8F5E9] rounded-full flex items-center justify-center text-green-700 shadow-inner border-4 border-green-200">
          <BadgeCheck className="w-10 h-10 stroke-[2px]" />
        </div>

        <h2 className="text-[#285B4B] text-2xl font-serif mb-3">{t.title}</h2>
        <p className="text-[#7D8471] text-[12px] leading-relaxed mb-2">{t.subtitle}</p>
        <p className="text-[#285B4B] font-medium text-[11px] mb-6">{t.message}</p>

        {/* User Info (if available) */}
        {user && (
          <div className="w-full bg-[#F4F7F6] rounded-lg p-4 mb-6">
            <p className="text-[#285B4B] font-bold text-[12px] mb-1">{user.username}</p>
            <p className="text-[#7D8471] text-[10px]">{user.email}</p>
          </div>
        )}

        {/* Countdown */}
        <div className="flex items-center gap-2 text-[10px] text-[#B59A5B] font-medium mb-6">
          <span className="w-2 h-2 bg-[#C9A84C] rounded-full animate-pulse" />
          <span>{t.redirect} <span className="font-bold text-[#285B4B] text-[12px]">{countdown}</span> {t.counting}...</span>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3 w-full">
          <Link
            to="/scholars"
            className="flex items-center justify-center gap-2 w-full py-3 bg-[#285B4B] hover:bg-[#1f4539] text-white rounded-lg text-[11px] font-bold tracking-[0.1em] transition-colors"
          >
            <span>{t.explore}</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
          
          <Link
            to="/"
            className="flex items-center justify-center gap-2 w-full py-3 bg-[#F4F7F6] hover:bg-[#E8EDEA] text-[#285B4B] rounded-lg text-[11px] font-bold tracking-[0.1em] transition-colors"
          >
            <Home className="w-3 h-3" />
            <span>{t.goToHome}</span>
          </Link>
        </div>
      </div>

      {/* Decorative bottom accent */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-[#B59A5B] via-[#285B4B] to-[#B59A5B]" />
    </div>
  );
};

export default Welcome;