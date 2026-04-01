// src/pages/VerifyEmail.tsx
import React, { useState, useEffect, useRef } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { BadgeCheck, RefreshCw, ArrowLeft, AlertCircle, LogIn, MailX, Clock, Wifi, Check, Send } from "lucide-react";
// @ts-ignore
import libraryImg from "../assets/library-1.jpg";

type Language = "EN" | "AR" | "FR";
type ErrorType = "invalid_token" | "expired_token" | "no_token" | "network" | "server" | "unknown";

const VerifyEmail: React.FC<{ lang?: Language }> = ({ lang = "EN" }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [visible, setVisible] = useState(false);
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorType, setErrorType] = useState<ErrorType>("unknown");
  const [countdown, setCountdown] = useState(3);
  const hasCalled = useRef(false);

  // ── Resend form state ──
  const [resendEmail, setResendEmail] = useState("");
  const [resendLoading, setResendLoading] = useState(false);
  const [resendDone, setResendDone] = useState(false);
  const [resendError, setResendError] = useState("");

  const token = searchParams.get("token");

  const content: Record<Language, any> = {
    EN: {
      category: "ACCOUNT SECURITY",
      loadingTitle: "Verifying your email...",
      loadingSubtitle: "Please wait while we activate your account",
      successTitle: "Email Verified!",
      successSubtitle: "Your account is now active. You will be redirected to login shortly.",
      successRedirect: "Redirecting to login",
      successBack: "Go to Login Now",
      successHome: "or go Home",
      counting: "in",
      resendPlaceholder: "Enter your email address",
      resendButton: "Send New Link",
      resendSent: "Email sent! Check your inbox.",
      resendErrorEmpty: "Please enter your email.",
      resendErrorFailed: "Could not send. Please try again.",
      errors: {
        no_token: {
          title: "Missing Link",
          subtitle: "No verification token was found. Enter your email to get a new link.",
          icon: "mail",
          showResend: true,
          actions: [
            { label: "or go to Login", to: "/login", primary: false },
          ],
        },
        invalid_token: {
          title: "Invalid Link",
          subtitle: "This link has already been used or is not recognized.",
          icon: "mail",
          showResend: false,
          actions: [
            { label: "Try Logging In", to: "/login", primary: true },
            { label: "or create a new account", to: "/register", primary: false },
          ],
        },
        expired_token: {
          title: "Link Expired",
          subtitle: "This link has expired. Enter your email to receive a new one.",
          icon: "clock",
          showResend: true,
          actions: [
            { label: "or create a new account", to: "/register", primary: false },
          ],
        },
        network: {
          title: "Connection Error",
          subtitle: "Could not reach the server. Please check your internet connection.",
          icon: "wifi",
          showResend: false,
          actions: [
            { label: "Try Again", to: null, primary: true, reload: true },
            { label: "or go Home", to: "/", primary: false },
          ],
        },
        server: {
          title: "Server Error",
          subtitle: "Something went wrong on our end. Please try again in a few moments.",
          icon: "alert",
          showResend: false,
          actions: [
            { label: "Try Again", to: null, primary: true, reload: true },
            { label: "or go Home", to: "/", primary: false },
          ],
        },
        unknown: {
          title: "Verification Failed",
          subtitle: "An unexpected error occurred. Please try again or contact support.",
          icon: "alert",
          showResend: false,
          actions: [
            { label: "Create New Account", to: "/register", primary: true },
            { label: "or go to Login", to: "/login", primary: false },
          ],
        },
      },
    },
    AR: {
      category: "أمان الحساب",
      loadingTitle: "جاري التحقق من بريدك...",
      loadingSubtitle: "يرجى الانتظار بينما نقوم بتفعيل حسابك",
      successTitle: "تم تأكيد البريد!",
      successSubtitle: "حسابك الآن مفعل. سيتم توجيهك لتسجيل الدخول قريباً.",
      successRedirect: "جاري التوجيه لتسجيل الدخول",
      successBack: "تسجيل الدخول الآن",
      successHome: "أو الصفحة الرئيسية",
      counting: "خلال",
      resendPlaceholder: "أدخل بريدك الإلكتروني",
      resendButton: "إرسال رابط جديد",
      resendSent: "تم الإرسال! تحقق من بريدك.",
      resendErrorEmpty: "يرجى إدخال بريدك الإلكتروني.",
      resendErrorFailed: "فشل الإرسال. حاول مجدداً.",
      errors: {
        no_token: {
          title: "رابط مفقود",
          subtitle: "لم يتم العثور على رمز التحقق. أدخل بريدك للحصول على رابط جديد.",
          icon: "mail",
          showResend: true,
          actions: [{ label: "أو الذهاب لتسجيل الدخول", to: "/login", primary: false }],
        },
        invalid_token: {
          title: "رابط غير صالح",
          subtitle: "هذا الرابط مستخدم أو غير معروف.",
          icon: "mail",
          showResend: false,
          actions: [
            { label: "تسجيل الدخول", to: "/login", primary: true },
            { label: "أو إنشاء حساب جديد", to: "/register", primary: false },
          ],
        },
        expired_token: {
          title: "انتهت صلاحية الرابط",
          subtitle: "انتهت صلاحية الرابط. أدخل بريدك لاستلام رابط جديد.",
          icon: "clock",
          showResend: true,
          actions: [{ label: "أو إنشاء حساب جديد", to: "/register", primary: false }],
        },
        network: {
          title: "خطأ في الاتصال",
          subtitle: "تعذر الوصول إلى الخادم. يرجى التحقق من اتصالك.",
          icon: "wifi",
          showResend: false,
          actions: [
            { label: "حاول مجدداً", to: null, primary: true, reload: true },
            { label: "أو الصفحة الرئيسية", to: "/", primary: false },
          ],
        },
        server: {
          title: "خطأ في الخادم",
          subtitle: "حدث خطأ من جانبنا. يرجى المحاولة لاحقاً.",
          icon: "alert",
          showResend: false,
          actions: [
            { label: "حاول مجدداً", to: null, primary: true, reload: true },
            { label: "أو الصفحة الرئيسية", to: "/", primary: false },
          ],
        },
        unknown: {
          title: "فشل التأكيد",
          subtitle: "حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.",
          icon: "alert",
          showResend: false,
          actions: [
            { label: "إنشاء حساب جديد", to: "/register", primary: true },
            { label: "أو تسجيل الدخول", to: "/login", primary: false },
          ],
        },
      },
    },
    FR: {
      category: "SÉCURITÉ DU COMPTE",
      loadingTitle: "Vérification de votre e-mail...",
      loadingSubtitle: "Veuillez patienter pendant l'activation de votre compte",
      successTitle: "E-mail vérifié !",
      successSubtitle: "Votre compte est actif. Redirection vers la connexion dans un instant.",
      successRedirect: "Redirection vers la connexion",
      successBack: "Se connecter maintenant",
      successHome: "ou aller à l'accueil",
      counting: "dans",
      resendPlaceholder: "Entrez votre adresse e-mail",
      resendButton: "Envoyer un nouveau lien",
      resendSent: "E-mail envoyé ! Vérifiez votre boîte.",
      resendErrorEmpty: "Veuillez entrer votre e-mail.",
      resendErrorFailed: "Échec de l'envoi. Veuillez réessayer.",
      errors: {
        no_token: {
          title: "Lien manquant",
          subtitle: "Aucun jeton trouvé. Entrez votre e-mail pour recevoir un nouveau lien.",
          icon: "mail",
          showResend: true,
          actions: [{ label: "ou aller à la connexion", to: "/login", primary: false }],
        },
        invalid_token: {
          title: "Lien invalide",
          subtitle: "Ce lien a déjà été utilisé ou n'est pas reconnu.",
          icon: "mail",
          showResend: false,
          actions: [
            { label: "Essayer de se connecter", to: "/login", primary: true },
            { label: "ou créer un nouveau compte", to: "/register", primary: false },
          ],
        },
        expired_token: {
          title: "Lien expiré",
          subtitle: "Ce lien a expiré. Entrez votre e-mail pour en recevoir un nouveau.",
          icon: "clock",
          showResend: true,
          actions: [{ label: "ou créer un nouveau compte", to: "/register", primary: false }],
        },
        network: {
          title: "Erreur de connexion",
          subtitle: "Impossible de joindre le serveur. Vérifiez votre connexion.",
          icon: "wifi",
          showResend: false,
          actions: [
            { label: "Réessayer", to: null, primary: true, reload: true },
            { label: "ou aller à l'accueil", to: "/", primary: false },
          ],
        },
        server: {
          title: "Erreur serveur",
          subtitle: "Une erreur s'est produite. Veuillez réessayer dans un moment.",
          icon: "alert",
          showResend: false,
          actions: [
            { label: "Réessayer", to: null, primary: true, reload: true },
            { label: "ou aller à l'accueil", to: "/", primary: false },
          ],
        },
        unknown: {
          title: "Échec de la vérification",
          subtitle: "Une erreur inattendue s'est produite. Veuillez réessayer.",
          icon: "alert",
          showResend: false,
          actions: [
            { label: "Créer un nouveau compte", to: "/register", primary: true },
            { label: "ou aller à la connexion", to: "/login", primary: false },
          ],
        },
      },
    },
  };

  const t = content[lang] || content.EN;

  const detectErrorType = (message: string, httpStatus: number): ErrorType => {
    const msg = message.toLowerCase();
    if (httpStatus >= 500) return "server";
    if (msg.includes("expired")) return "expired_token";
    if (msg.includes("invalid") || msg.includes("not found") || msg.includes("no token")) return "invalid_token";
    return "unknown";
  };

  useEffect(() => {
    setVisible(true);
    if (hasCalled.current) return;
    hasCalled.current = true;

    const verifyToken = async () => {
      if (!token) {
        setErrorType("no_token");
        setStatus("error");
        return;
      }

      try {
        const response = await fetch(
          `http://localhost:5000/api/auth/verify-email?token=${token}`,
          { method: "GET", headers: { "Content-Type": "application/json" } }
        );
        const data = await response.json();

        if (response.ok) {
          setStatus("success");
          let count = 3;
          const timer = setInterval(() => {
            count -= 1;
            setCountdown(count);
            if (count <= 0) { clearInterval(timer); navigate("/login"); }
          }, 1000);
          return () => clearInterval(timer);
        } else {
          setErrorType(detectErrorType(data.message || "", response.status));
          setStatus("error");
        }
      } catch {
        setErrorType("network");
        setStatus("error");
      }
    };

    verifyToken();
  }, [token, navigate]);

  // ── Inline resend handler ──
  const handleResend = async () => {
    setResendError("");
    if (!resendEmail.trim()) {
      setResendError(t.resendErrorEmpty);
      return;
    }
    setResendLoading(true);
    try {
      const response = await fetch("http://localhost:5000/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resendEmail.trim() }),
      });
      if (response.ok) {
        setResendDone(true);
      } else {
        const data = await response.json();
        setResendError(data.message || t.resendErrorFailed);
      }
    } catch {
      setResendError(t.resendErrorFailed);
    } finally {
      setResendLoading(false);
    }
  };

  const ErrorIcon = ({ type }: { type: string }) => {
    if (type === "clock") return <Clock className="w-7 h-7 stroke-[2px]" />;
    if (type === "wifi") return <Wifi className="w-7 h-7 stroke-[2px]" />;
    if (type === "mail") return <MailX className="w-7 h-7 stroke-[2px]" />;
    return <AlertCircle className="w-7 h-7 stroke-[2px]" />;
  };

  const currentError = t.errors[errorType];

  return (
    <div className="relative h-screen w-full flex flex-col items-center bg-[#FDFCFB] overflow-hidden font-sans">

      {/* Hero Header */}
      <div className="relative w-full h-[35vh] overflow-hidden flex flex-col items-center justify-center pt-6">
        <img src={libraryImg} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-[#285B4B]/85 mix-blend-multiply" />
        <h1 className="relative z-10 text-white text-lg font-serif tracking-[0.4em] uppercase">
          OULAMAUNA
        </h1>
      </div>

      {/* Card */}
      <div
        className={`relative z-20 -mt-12 w-full max-w-[360px] mx-4 p-6 bg-white rounded shadow-xl border border-gray-50 flex flex-col items-center text-center transition-all duration-700 ${
          visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
        }`}
        dir={lang === "AR" ? "rtl" : "ltr"}
      >
        <span className="text-[#B59A5B] text-[8px] font-bold tracking-[0.2em] uppercase block mb-4">
          {t.category}
        </span>

        {/* ── Loading ── */}
        {status === "loading" && (
          <div className="flex flex-col items-center py-6 gap-4">
            <RefreshCw className="w-6 h-6 text-[#B59A5B] animate-spin" />
            <div className="space-y-2">
              <p className="text-[#285B4B] font-serif text-lg">{t.loadingTitle}</p>
              <p className="text-[#7D8471] text-[11px]">{t.loadingSubtitle}</p>
            </div>
          </div>
        )}

        {/* ── Success ── */}
        {status === "success" && (
          <div className="flex flex-col items-center animate-in fade-in zoom-in duration-500">
            <div className="mb-4 w-14 h-14 bg-[#E8F5E9] rounded-full flex items-center justify-center text-green-700 shadow-inner border-2 border-green-200">
              <BadgeCheck className="w-7 h-7 stroke-[2px]" />
            </div>
            <h2 className="text-[#285B4B] text-xl font-serif mb-2">{t.successTitle}</h2>
            <p className="text-[#7D8471] text-[11px] leading-relaxed mb-4">{t.successSubtitle}</p>
            <div className="flex items-center gap-2 text-[10px] text-[#B59A5B] font-medium mb-5">
              <RefreshCw className="w-3 h-3 animate-spin" />
              <span>
                {t.successRedirect}{" "}
                <span className="font-bold text-[#285B4B]">{countdown}</span>{" "}
                {t.counting}...
              </span>
            </div>
            <div className="flex flex-col items-center space-y-3 w-full border-t border-gray-50 pt-4">
              <button
                onClick={() => navigate("/login")}
                className="flex items-center gap-2 text-[9px] text-[#285B4B] hover:text-[#B59A5B] font-bold uppercase tracking-widest transition-colors"
              >
                <LogIn className="w-3 h-3" />
                <span>{t.successBack}</span>
              </button>
              <Link to="/" className="text-[8px] text-[#B8B09A] hover:text-[#285B4B] uppercase tracking-widest font-medium transition-colors">
                {t.successHome}
              </Link>
            </div>
          </div>
        )}

        {/* ── Error ── */}
        {status === "error" && currentError && (
          <div className="flex flex-col items-center w-full animate-in fade-in zoom-in duration-500">
            <div className="mb-4 w-14 h-14 bg-[#FFF3E0] rounded-full flex items-center justify-center text-orange-600 shadow-inner border-2 border-orange-200">
              <ErrorIcon type={currentError.icon} />
            </div>
            <h2 className="text-[#285B4B] text-xl font-serif mb-2">{currentError.title}</h2>
            <p className="text-[#7D8471] text-[11px] leading-relaxed mb-4">{currentError.subtitle}</p>

            {/* ── Inline Resend Form (only for expired/no_token) ── */}
            {currentError.showResend && (
              <div className="w-full mb-4">
                {resendDone ? (
                  <div className="flex items-center justify-center gap-2 text-[10px] text-green-700 bg-green-50 border border-green-100 rounded py-2 px-3">
                    <Check className="w-3 h-3" />
                    <span>{t.resendSent}</span>
                  </div>
                ) : (
                  <>
                    <div className="flex gap-2 w-full">
                      <input
                        type="email"
                        value={resendEmail}
                        onChange={(e) => { setResendEmail(e.target.value); setResendError(""); }}
                        onKeyDown={(e) => e.key === "Enter" && handleResend()}
                        placeholder={t.resendPlaceholder}
                        className="flex-1 border border-gray-200 rounded-sm px-3 py-2 text-[10px] text-[#285B4B] placeholder-gray-300 outline-none focus:border-[#B59A5B] transition-colors"
                      />
                      <button
                        onClick={handleResend}
                        disabled={resendLoading}
                        className="bg-[#285B4B] hover:bg-[#1e4437] text-white px-3 py-2 rounded-sm text-[9px] font-bold tracking-widest transition-colors flex items-center gap-1.5 disabled:opacity-60"
                      >
                        {resendLoading
                          ? <RefreshCw className="w-3 h-3 animate-spin" />
                          : <Send className="w-3 h-3" />
                        }
                      </button>
                    </div>
                    {resendError && (
                      <p className="text-[9px] text-red-400 mt-1.5 text-left">{resendError}</p>
                    )}
                  </>
                )}
              </div>
            )}

            {/* ── Actions ── */}
            <div className="flex flex-col items-center space-y-3 w-full border-t border-gray-50 pt-4">
              {currentError.actions.map((action: any, i: number) =>
                action.primary ? (
                  action.reload ? (
                    <button
                      key={i}
                      onClick={() => { hasCalled.current = false; window.location.reload(); }}
                      className="flex items-center gap-2 text-[9px] text-[#285B4B] hover:text-[#B59A5B] font-bold uppercase tracking-widest transition-colors"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>{action.label}</span>
                    </button>
                  ) : (
                    <Link key={i} to={action.to}
                      className="flex items-center gap-2 text-[9px] text-[#285B4B] hover:text-[#B59A5B] font-bold uppercase tracking-widest transition-colors"
                    >
                      <span>{action.label}</span>
                    </Link>
                  )
                ) : (
                  action.to ? (
                    <Link key={i} to={action.to}
                      className="flex items-center gap-1.5 text-[8px] text-[#B8B09A] hover:text-[#285B4B] uppercase tracking-widest font-medium transition-colors"
                    >
                      <ArrowLeft className="w-3 h-3" />
                      <span>{action.label}</span>
                    </Link>
                  ) : null
                )
              )}
            </div>
          </div>
        )}
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-[#B59A5B] via-[#285B4B] to-[#B59A5B]" />
    </div>
  );
};

export default VerifyEmail;