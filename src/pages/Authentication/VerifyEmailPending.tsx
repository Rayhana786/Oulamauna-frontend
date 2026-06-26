import React, { useState, useEffect } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { Mail, RefreshCw, LogIn, ExternalLink, Check, BadgeCheck, ArrowLeft, AlertCircle } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
// @ts-ignore
import libraryImg from "../../assets/library-1.jpg";
import { useLang } from "../../context/LanguageContext";
type Language = "EN" | "AR" | "FR";

const VerifyEmailPending: React.FC = () => {
  const { lang } = useLang();
  const { user, checkUserStatus } = useAuth();
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [resent, setResent] = useState(false);
  const [checking, setChecking] = useState(true);
  const [isVerified, setIsVerified] = useState(false);
  const [error, setError] = useState<string | null>(null); // New error state

  const email = (searchParams.get("email") || user?.email || "").toLowerCase();

  const content: Record<Language, any> = {
    EN: {
      category: "ACCOUNT SECURITY",
      title: "Verify your email",
      subtitle: "A confirmation link has been sent to your inbox.",
      alreadyVerifiedTitle: "Email Already Verified",
      alreadyVerifiedSub: "Your email is already confirmed. You're all set.",
      alreadyVerifiedBack: "Go back",
      alreadyVerifiedHome: "or go Home",
      cta: "OPEN GMAIL",
      resend: "RESEND LINK",
      resentSuccess: "SENT",
      backToLogin: "BACK TO LOGIN",
      checking: "Checking your status...",
      errorMessage: "Something went wrong. Please try again.",
    },
    AR: {
      category: "أمان الحساب",
      title: "تأكيد البريد الإلكتروني",
      subtitle: "تم إرسال رابط تأكيد إلى بريدك الإلكتروني.",
      alreadyVerifiedTitle: "تم التأكيد مسبقاً",
      alreadyVerifiedSub: "بريدك الإلكتروني مؤكد بالفعل. كل شيء جاهز.",
      alreadyVerifiedBack: "العودة للصفحة السابقة",
      alreadyVerifiedHome: "أو الصفحة الرئيسية",
      cta: "افتح GMAIL",
      resend: "إعادة إرسال",
      resentSuccess: "تم الإرسال",
      backToLogin: "العودة",
      checking: "جاري التحقق...",
      errorMessage: "حدث خطأ ما. يرجى المحاولة مرة أخرى.",
    },
    FR: {
      category: "SÉCURITÉ DU COMPTE",
      title: "Vérifiez votre e-mail",
      subtitle: "Un lien de confirmation a été envoyé à votre boîte.",
      alreadyVerifiedTitle: "E-mail déjà vérifié",
      alreadyVerifiedSub: "Votre e-mail est déjà confirmé. Vous êtes prêt.",
      alreadyVerifiedBack: "Retour",
      alreadyVerifiedHome: "ou aller à l'accueil",
      cta: "OUVRIR GMAIL",
      resend: "RENVOYER",
      resentSuccess: "ENVOYÉ",
      backToLogin: "RETOUR",
      checking: "Vérification en cours...",
      errorMessage: "Une erreur est survenue. Veuillez réessayer.",
    },
  };

  const t = content[lang] || content.EN;

  useEffect(() => {
    setVisible(true);
    const initialCheck = async () => {
      setChecking(true);
      await checkUserStatus();
      setChecking(false);
    };
    initialCheck();
  }, []);

  useEffect(() => {
    const pollInterval = setInterval(async () => {
      await checkUserStatus();
    }, 3000);

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "auth_event") {
        checkUserStatus();
      }
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      clearInterval(pollInterval);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  useEffect(() => {
    if (user && (user as any).isVerified) {
      setIsVerified(true);
    }
  }, [user]);

  const handleResend = async () => {
    if (loading || resent) return;
    setLoading(true);
    setError(null); // Clear previous errors
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/resend-verification`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      
      const data = await response.json();

      if (response.ok) {
        setResent(true);
      } else {
        if (response.status === 400 && (data.message === "Email is already verified" || data.message === "User is already verified")) {
          setIsVerified(true);
        } else {
          setError(data.message || t.errorMessage);
        }
      }
    } catch (error) {
      console.error("Resend failed:", error);
      setError(t.errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative h-screen w-full flex flex-col items-center bg-[#FDFCFB] overflow-hidden font-sans">
      <div className="relative w-full h-[35vh] overflow-hidden flex flex-col items-center justify-center pt-6">
        <img src={libraryImg} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-[#285B4B]/85 mix-blend-multiply" />
        <h1 className="relative z-10 text-white text-lg font-serif tracking-[0.4em] uppercase">OULAMAUNA</h1>
      </div>

      <div
        className={`relative z-20 -mt-12 w-full max-w-[360px] mx-4 p-6 bg-white rounded shadow-xl border border-gray-50 flex flex-col items-center text-center transition-all duration-700 ${
          visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
        }`}
        dir={lang === "AR" ? "rtl" : "ltr"}
      >
        <span className="text-[#B59A5B] text-[8px] font-bold tracking-[0.2em] uppercase block mb-4">
          {t.category}
        </span>

        {checking ? (
          <div className="flex flex-col items-center py-4 gap-3">
            <RefreshCw className="w-5 h-5 text-[#B59A5B] animate-spin" />
            <p className="text-[#7D8471] text-[11px]">{t.checking}</p>
          </div>
        ) : isVerified ? (
          <div className="flex flex-col items-center animate-in fade-in zoom-in duration-500">
            <div className="mb-4 w-12 h-12 bg-[#F4F7F6] rounded-full flex items-center justify-center text-green-600 shadow-inner">
              <BadgeCheck className="w-6 h-6 stroke-[1.5px]" />
            </div>
            <h2 className="text-[#285B4B] text-xl font-serif mb-2">{t.alreadyVerifiedTitle}</h2>
            <p className="text-[#7D8471] text-[11px] leading-relaxed mb-2">{t.alreadyVerifiedSub}</p>
            {email && (
              <p className="text-[#285B4B] font-bold text-[10px] tracking-wider break-all mb-4">{email}</p>
            )}
            <div className="flex flex-col items-center space-y-3 w-full border-t border-gray-50 pt-4">
              <button
                onClick={() => (window.history.length > 1 ? window.history.back() : navigate("/"))}
                className="flex items-center gap-2 text-[9px] text-[#285B4B] hover:text-[#B59A5B] font-bold uppercase tracking-widest transition-colors"
              >
                <ArrowLeft className="w-3 h-3" />
                <span>{t.alreadyVerifiedBack}</span>
              </button>
              <Link
                to="/"
                className="text-[8px] text-[#B8B09A] hover:text-[#285B4B] uppercase tracking-widest font-medium transition-colors"
              >
                {t.alreadyVerifiedHome}
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-4 w-10 h-10 bg-[#F4F7F6] rounded flex items-center justify-center text-[#285B4B]">
              <Mail className="w-4 h-4 stroke-[1.5px]" />
            </div>
            <h2 className="text-[#285B4B] text-xl font-serif mb-2">{t.title}</h2>
            <div className="mb-6">
              <p className="text-[#7D8471] text-[11px] leading-relaxed mb-2">{t.subtitle}</p>
              {email && (
                <p className="text-[#285B4B] font-bold text-[10px] tracking-wider break-all">{email}</p>
              )}
            </div>

            {/* ERROR MESSAGE DISPLAY */}
            {error && (
              <div className="mb-4 flex items-center gap-2 text-red-600 bg-red-50 p-2 rounded w-full justify-center animate-in fade-in slide-in-from-top-1">
                <AlertCircle className="w-3 h-3" />
                <span className="text-[10px] font-medium">{error}</span>
              </div>
            )}

            <button
              onClick={() => window.open("https://mail.google.com/mail/u/0/#search/OULAMAUNA", "_blank")}
              className="w-full max-w-[200px] bg-[#1f4539] hover:bg-[#C9A84C] text-white py-3 rounded-sm text-[9px] font-bold tracking-[0.2em] transition-all flex items-center justify-center gap-2 mb-4"
            >
              <span>{t.cta}</span>
              <ExternalLink className="w-3 h-3 opacity-60" />
            </button>
            <div className="flex flex-col items-center space-y-3 w-full border-t border-gray-50 pt-4">
              <button
                onClick={handleResend}
                disabled={loading || resent}
                className={`flex items-center gap-2 text-[8px] font-bold uppercase tracking-widest transition-colors ${
                  resent ? "text-[#285B4B]" : "text-[#B59A5B] hover:text-[#285B4B]"
                }`}
              >
                {loading ? (
                  <RefreshCw className="w-3 h-3 animate-spin" />
                ) : resent ? (
                  <Check className="w-3 h-3" />
                ) : (
                  <RefreshCw className="w-3 h-3" />
                )}
                <span>{loading ? "..." : resent ? t.resentSuccess : t.resend}</span>
              </button>
              <Link
                to="/login"
                className="flex items-center gap-2 text-[8px] text-[#B8B09A] hover:text-[#285B4B] uppercase tracking-widest font-medium transition-colors"
              >
                <LogIn className="w-3 h-3" />
                <span>{t.backToLogin}</span>
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default VerifyEmailPending;