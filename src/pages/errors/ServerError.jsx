import React from "react";

const ServerError = ({ lang = "EN" }) => {
  const content = {
    EN: {
      title: "Patience is Key",
      desc: "Our library is currently undergoing a brief restoration. Please try again in a few moments.",
      button: "REFRESH PAGE",
    },
    AR: {
      title: "إِنَّ مَعَ الْعُسْرِ يُسْرًا",
      desc: "نحن نقوم بعملية صيانة سريعة للمكتبة حالياً. يرجى المحاولة مرة أخرى بعد قليل.",
      button: "تحديث الصفحة",
    },
    FR: {
      title: "La Patience est une Vertu",
      desc: "Notre bibliothèque est en cours de restauration. Veuillez réessayer dans quelques instants.",
      button: "RAFRAÎCHIR",
    }
  };

  const t = content[lang] || content.EN;
  const isRTL = lang === "AR";

  return (
    <div className={`h-screen flex flex-col items-center justify-center bg-[#fcfaf7] text-center px-6 overflow-hidden relative ${isRTL ? "font-arabic" : ""}`} dir={isRTL ? "rtl" : "ltr"}>
      
      {/* HIGH-END UI ELEMENT: The "500" Background Watermark */}
      <div className="absolute inset-0 flex items-center justify-center select-none pointer-events-none z-0">
        <h1 className="text-[25vw] font-black leading-none text-[#285B4B] opacity-[0.04] tracking-tighter">
          500
        </h1>
      </div>

      <div className="relative z-10 max-w-md flex flex-col items-center">
        {/* Subtle top accent line */}
        <div className="w-px h-12 bg-gradient-to-b from-transparent via-[#D8BF86] to-transparent mb-8" />

        <h2 className="text-3xl md:text-4xl font-serif text-[#285B4B] mb-4 tracking-tight">
          {t.title}
        </h2>
        
        {/* Decorative separator */}
        <div className="w-12 h-px bg-[#D8BF86] mx-auto mb-6 opacity-80" />
        
        <p className="text-[#B8B09A] text-sm md:text-base leading-relaxed mb-10 max-w-[320px]">
          {t.desc}
        </p>

        <button 
          onClick={() => window.location.reload()} 
          className="group relative inline-flex items-center gap-4 bg-[#285B4B] text-white px-12 py-4 rounded-[1px] text-[10px] tracking-[0.3em] font-black uppercase hover:bg-[#1e4539] transition-all shadow-xl shadow-[#285B4B]/10 active:scale-95"
        >
          {t.button}
          <span className="text-[#D8BF86] group-hover:translate-x-1 transition-transform duration-300">→</span>
        </button>
      </div>

      {/* Humble Footer Note */}
      <div className="absolute bottom-10 flex items-center gap-4 opacity-30">
        <div className="w-8 h-px bg-[#285B4B]" />
        <p className="text-[9px] text-[#285B4B] tracking-[0.5em] font-bold uppercase">
          Oulamauna
        </p>
        <div className="w-8 h-px bg-[#285B4B]" />
      </div>
    </div>
  );
};

export default ServerError;