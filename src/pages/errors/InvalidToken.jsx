import React from "react";
import { Link } from "react-router-dom";
import { useLang } from "../../context/LanguageContext";
const InvalidToken = () => {
  const { lang } = useLang();
  const content = {
    EN: {
      title: "Link Expired",
      desc: "This verification link is no longer valid. It may have expired or already been used.",
      login: "LOG IN AGAIN",
      help: "NEED HELP?",
    },
    AR: {
      title: "انتهت صلاحية الرابط",
      desc: "رابط التحقق هذا لم يعد صالحاً. ربما انتهت صلاحيته أو تم استخدامه بالفعل.",
      login: "تسجيل الدخول مرة أخرى",
      help: "تحتاج مساعدة؟",
    },
    FR: {
      title: "Lien Expiré",
      desc: "Ce lien de vérification n'est plus valide. Il a peut-être expiré ou a déjà été utilisé.",
      login: "SE CONNECTER À NOUVEAU",
      help: "BESOIN D'AIDE ?",
    }
  };

  const t = content[lang] || content.EN;
  const isRTL = lang === "AR";

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center bg-[#faf9f6] text-center px-6 ${isRTL ? "font-arabic" : ""}`} dir={isRTL ? "rtl" : "ltr"}>
      {/* Clock icon – exactly as shown in the screenshot */}
      <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-sm border border-[#f1ede6]">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-9 w-9 text-[#285B4B]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="1.75"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 01-18 0 9 9 0 0118 0z" />
        </svg>
      </div>

      {/* Title – matches the green serif style of the screenshot and login page */}
      <h1 className="text-4xl font-medium text-[#285B4B] tracking-tight mb-4">
        {t.title}
      </h1>

      {/* Description – subtle beige text, same as other error pages */}
      <p className="text-[#B8B09A] text-base max-w-xs mx-auto leading-relaxed">
        {t.desc}
      </p>

      {/* Button – dark green, rounded, uppercase, exactly like the screenshot and login "SIGN IN" button */}
      <div className="mt-12 w-full max-w-[280px]">
        <Link
          to="/login"
          className="block w-full bg-[#285B4B] hover:bg-[#1e4639] active:scale-[0.98] transition-all text-white py-4 px-8 rounded-[6px] text-sm font-bold tracking-[0.8px] uppercase shadow-md"
        >
          {t.login}
        </Link>
      </div>

      {/* NEED HELP? link – small, subtle, exactly as in the screenshot */}
      <Link
        to="/contact"
        className="mt-7 text-[#9C9270] hover:text-[#285B4B] text-xs font-semibold tracking-widest uppercase transition-colors"
      >
        {t.help}
      </Link>
    </div>
  );
};

export default InvalidToken;