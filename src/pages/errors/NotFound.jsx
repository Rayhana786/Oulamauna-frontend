import React from "react";
import { Link } from "react-router-dom";

const NotFound = ({ lang = "EN" }) => {
  const content = {
    EN: {
      title: "404",
      subtitle: "Page Missing",
      desc: "The knowledge you seek is not in this section of the library.",
      button: "RETURN TO HOME",
    },
    AR: {
      title: "404",
      subtitle: "الصفحة غير موجودة",
      desc: "المعرفة التي تبحث عنها ليست في هذا القسم من المكتبة.",
      button: "العودة للرئيسية",
    },
    FR: {
      title: "404",
      subtitle: "Page introuvable",
      desc: "Les connaissances que vous recherchez ne se trouvent pas dans cette section.",
      button: "RETOUR À L'ACCUEIL",
    }
  };

  const t = content[lang] || content.EN;
  const isRTL = lang === "AR";

  return (
    <div className={`h-screen flex flex-col items-center justify-center bg-[#faf9f6] text-center px-6 ${isRTL ? "font-arabic" : ""}`} dir={isRTL ? "rtl" : "ltr"}>
      <h1 className="text-9xl font-black text-[#D8BF86] opacity-20 tracking-tighter">{t.title}</h1>
      <div className="relative -mt-12">
        <h2 className="text-3xl font-serif text-[#285B4B]">{t.subtitle}</h2>
        <p className="text-[#B8B09A] text-sm mt-3 max-w-sm mx-auto">{t.desc}</p>
        <Link to="/" className="mt-10 inline-block bg-[#285B4B] text-white px-10 py-3 rounded-[5px] text-[10px] tracking-[0.3em] font-black uppercase hover:bg-[#C9A84C] transition-all shadow-lg shadow-[#285B4B]/20">
          {t.button}
        </Link>
      </div>
    </div>
  );
};

export default NotFound;