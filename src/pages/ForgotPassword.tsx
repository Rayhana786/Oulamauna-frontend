import React, { useState } from "react";
import { Link } from "react-router-dom";

type Language = "EN" | "AR" | "FR";

const ForgotPassword: React.FC<{ lang?: Language }> = ({ lang = "EN" }) => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const content = {
    EN: {
      back: "← Back to Sign In",
      title: "Forgot Password?",
      subtitle: "Enter your email and we'll send you a link to reset your password.",
      emailLabel: "EMAIL ADDRESS",
      emailPlaceholder: "scholar@oulamauna.org",
      button: "SEND RESET LINK",
      errEmpty: "Please enter your email address.",
      errInvalid: "Please enter a valid email address.",
      sentTitle: "Check your inbox",
      sentSubtitle: "We sent a reset link to",
      sentNote: "Didn't receive it? Check your spam or",
      sentRetry: "try another email",
      sentBack: "BACK TO SIGN IN",
    },
    AR: {
      back: "→ العودة لتسجيل الدخول",
      title: "نسيت كلمة المرور؟",
      subtitle: "أدخل بريدك الإلكتروني وسنرسل لك رابطاً لإعادة تعيين كلمة المرور.",
      emailLabel: "عنوان البريد الإلكتروني",
      emailPlaceholder: "scholar@oulamauna.org",
      button: "إرسال رابط الإعادة",
      errEmpty: "الرجاء إدخال عنوان بريدك الإلكتروني.",
      errInvalid: "الرجاء إدخال عنوان بريد صحيح.",
      sentTitle: "تحقق من بريدك الوارد",
      sentSubtitle: "أرسلنا رابط إعادة التعيين إلى",
      sentNote: "لم تستلمه؟ تحقق من البريد العشوائي أو",
      sentRetry: "جرّب بريداً آخر",
      sentBack: "العودة لتسجيل الدخول",
    },
    FR: {
      back: "← Retour à la connexion",
      title: "Mot de passe oublié ?",
      subtitle: "Entrez votre e-mail et nous vous enverrons un lien pour réinitialiser votre mot de passe.",
      emailLabel: "ADRESSE E-MAIL",
      emailPlaceholder: "scholar@oulamauna.org",
      button: "ENVOYER LE LIEN",
      errEmpty: "Veuillez entrer votre adresse e-mail.",
      errInvalid: "Veuillez entrer une adresse e-mail valide.",
      sentTitle: "Vérifiez votre boîte mail",
      sentSubtitle: "Nous avons envoyé un lien de réinitialisation à",
      sentNote: "Pas reçu ? Vérifiez vos spams ou",
      sentRetry: "essayez un autre e-mail",
      sentBack: "RETOUR À LA CONNEXION",
    },
  };

  const t = content[lang];
  const isRTL = lang === "AR";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) { setError(t.errEmpty); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError(t.errInvalid); return; }
    setError("");
    setSent(true);
    // TODO: call your reset API here
  };

  const iconBase = "w-4 h-4 text-[#7DA89B] transition-colors duration-200 group-hover:text-[#C9A84C]";
  const inputBase = "w-full bg-[#f8fafc] border rounded-2xl pl-12 py-3 text-sm outline-none transition-all duration-200 group-hover:border-[#C9A84C]/50 focus:border-[#C9A84C]";

  return (
    <div
      className={`min-h-screen bg-white flex flex-col items-center justify-center px-6 ${isRTL ? "text-right" : ""}`}
      dir={isRTL ? "rtl" : "ltr"}
    >
      <div className="w-full max-w-sm">

        {/* Logo placeholder */}
        <div className="mb-8 text-center">
          <div className="w-12 h-12 rounded-xl bg-[#285B4B]/8 flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-[#285B4B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <p className="text-xs tracking-[0.3em] text-[#285B4B] font-black uppercase">OULAMAUNA</p>
        </div>

        {sent ? (
          /* ── SUCCESS STATE ── */
          <div className="text-center">
            <div className="w-14 h-14 rounded-2xl bg-[#285B4B]/8 flex items-center justify-center mx-auto mb-5">
              <svg className="w-7 h-7 text-[#285B4B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-3xl font-serif text-[#285B4B] mb-1">{t.sentTitle}</h2>
            <p className="text-[#B8B09A] text-sm">{t.sentSubtitle}</p>
            <p className="text-[#285B4B] text-sm font-medium mt-0.5 mb-6">{email}</p>
            <Link
              to="/login"
              className="block w-full text-center bg-[#285B4B] text-white py-3 rounded-2xl text-xs font-black tracking-[0.3em] uppercase hover:bg-[#C9A84C] active:scale-[0.98] transition-all duration-300 mb-5"
            >
              {t.sentBack}
            </Link>
            <p className="text-[#B8B09A] text-xs">
              {t.sentNote}{" "}
              <button
                type="button"
                onClick={() => { setSent(false); setEmail(""); }}
                className="text-[#7DA89B] hover:text-[#C9A84C] transition-colors duration-200 underline underline-offset-2"
              >
                {t.sentRetry}
              </button>
            </p>
          </div>

        ) : (
          /* ── FORM STATE ── */
          <>
            <div className="mb-6">
              <h2 className="text-3xl font-serif text-[#285B4B]">{t.title}</h2>
              <p className="text-[#B8B09A] text-sm mt-1 leading-relaxed">{t.subtitle}</p>
              <div className="w-10 h-px bg-[#D8BF86]/50 mt-4" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div>
                <label className="text-[10px] tracking-[0.25em] text-[#B8B09A] font-bold uppercase block mb-1.5">
                  {t.emailLabel}
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
                    <svg className={iconBase} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={e => { setEmail(e.target.value); setError(""); }}
                    placeholder={t.emailPlaceholder}
                    className={`${inputBase} ${error ? "border-red-300 bg-red-50/30" : "border-gray-100"}`}
                  />
                </div>
                {error && (
                  <p className="text-red-500 text-[11px] mt-1.5 flex items-center gap-1">
                    <svg className="w-3 h-3 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {error}
                  </p>
                )}
              </div>

              <button
                type="submit"
                className="w-full bg-[#285B4B] text-white py-3 rounded-2xl text-xs font-black tracking-[0.3em] uppercase hover:bg-[#C9A84C] active:scale-[0.98] transition-all duration-300"
              >
                {t.button}
              </button>
            </form>

            <div className="mt-5 text-center">
              <Link
                to="/login"
                className="text-xs text-[#B8B09A] hover:text-[#C9A84C] transition-colors duration-200 tracking-widest"
              >
                {t.back}
              </Link>
            </div>
          </>
        )}

      </div>
    </div>
  );
};

export default ForgotPassword;