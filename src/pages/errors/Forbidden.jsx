import React from "react";
import { Link } from "react-router-dom";

const Forbidden = ({ lang = "EN" }) => {
  const content = {
    EN: {
      title: "Access Restricted",
      desc: "You do not have the necessary permissions to view this page.",
      button: "Go Back Home",
    },
    AR: {
      title: "دخول مقيد",
      desc: "ليس لديك الصلاحيات اللازمة لعرض هذه الصفحة.",
      button: "العودة للرئيسية",
    },
    FR: {
      title: "Accès Restreint",
      desc: "Vous n'avez pas les autorisations nécessaires pour voir cette page.",
      button: "Retour à l'accueil",
    }
  };

  const t = content[lang] || content.EN;
  const isRTL = lang === "AR";

  return (
    <div className={`h-screen flex flex-col items-center justify-center bg-[#faf9f6] text-center px-6 ${isRTL ? "font-arabic" : ""}`} dir={isRTL ? "rtl" : "ltr"}>
      <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-6">
        <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      </div>
      <h2 className="text-2xl font-serif text-[#285B4B]">{t.title}</h2>
      <p className="text-[#B8B09A] text-sm mt-2">{t.desc}</p>
      <Link to="/" className="mt-8 text-[#285B4B] text-[10px] font-bold tracking-widest uppercase border-b border-[#285B4B] pb-1 hover:text-[#C9A84C] hover:border-[#C9A84C]">
        {t.button}
      </Link>
    </div>
  );
};

export default Forbidden;