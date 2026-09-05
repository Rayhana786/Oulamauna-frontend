import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useLang } from "../../context/LanguageContext"; 
import libraryImg from "../../assets/library2.jpg";
import oulamaunaLogo from '../../assets/OOLOGO.png';
import axios from "axios";

type Language = "EN" | "AR" | "FR";

const Register: React.FC = () => {
  const { lang } = useLang();
  const navigate = useNavigate();
  const { login } = useAuth();
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    confirm: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const content: Record<Language, any> = {
    EN: {
      title: "Create your account",
      subtitle: "Start your journey with Oulamauna today",
      usernameLabel: "Full Name",
      usernamePlaceholder: "Enter your full name",
      emailLabel: "Email",
      emailPlaceholder: "Enter your email",
      passwordLabel: "Password",
      passwordPlaceholder: "Create a password",
      confirmLabel: "Confirm Password",
      confirmPlaceholder: "Confirm your password",
      button: "Sign Up",
      google: "Sign up with Google",
      haveAccount: "Already have an account?",
      signIn: "Sign in",
      or: "or",
      loading: "Creating account...",
      errors: {
        usernameEmpty: "Full name is required",
        emailEmpty: "Email is required",
        emailInvalid: "Invalid email address",
        passwordEmpty: "Password is required",
        passwordWeak: "Password must be at least 8 characters with uppercase, number, and symbol",
        confirmEmpty: "Please confirm your password",
        confirmMatch: "Passwords do not match",
      },
    },
    AR: {
      title: "إنشاء حساب",
      subtitle: "ابدأ رحلتك مع علماؤنا اليوم",
      usernameLabel: "الاسم الكامل",
      usernamePlaceholder: "أدخل اسمك الكامل",
      emailLabel: "البريد الإلكتروني",
      emailPlaceholder: "أدخل بريدك الإلكتروني",
      passwordLabel: "كلمة المرور",
      passwordPlaceholder: "أنشئ كلمة مرور",
      confirmLabel: "تأكيد كلمة المرور",
      confirmPlaceholder: "أكد كلمة المرور",
      button: "إنشاء حساب",
      google: "التسجيل عبر Google",
      haveAccount: "لديك حساب بالفعل؟",
      signIn: "تسجيل الدخول",
      or: "أو",
      loading: "جاري إنشاء الحساب...",
      errors: {
        usernameEmpty: "الاسم الكامل مطلوب",
        emailEmpty: "البريد الإلكتروني مطلوب",
        emailInvalid: "عنوان بريد غير صالح",
        passwordEmpty: "كلمة المرور مطلوبة",
        passwordWeak: "كلمة المرور يجب أن تكون 8 أحرف على الأقل مع حرف كبير ورقم ورمز",
        confirmEmpty: "يرجى تأكيد كلمة المرور",
        confirmMatch: "كلمتا المرور لا تتطابقان",
      },
    },
    FR: {
      title: "Créer un compte",
      subtitle: "Commencez votre voyage avec Oulamauna aujourd'hui",
      usernameLabel: "Nom complet",
      usernamePlaceholder: "Entrez votre nom complet",
      emailLabel: "E-mail",
      emailPlaceholder: "Entrez votre e-mail",
      passwordLabel: "Mot de passe",
      passwordPlaceholder: "Créez un mot de passe",
      confirmLabel: "Confirmer le mot de passe",
      confirmPlaceholder: "Confirmez votre mot de passe",
      button: "S'inscrire",
      google: "S'inscrire avec Google",
      haveAccount: "Vous avez déjà un compte ?",
      signIn: "Se connecter",
      or: "ou",
      loading: "Création du compte...",
      errors: {
        usernameEmpty: "Nom complet requis",
        emailEmpty: "E-mail requis",
        emailInvalid: "E-mail invalide",
        passwordEmpty: "Mot de passe requis",
        passwordWeak: "Le mot de passe doit contenir au moins 8 caractères avec majuscule, chiffre et symbole",
        confirmEmpty: "Veuillez confirmer votre mot de passe",
        confirmMatch: "Les mots de passe ne correspondent pas",
      },
    },
  };

  const t = content[lang] || content.EN;
  const isRTL = lang === "AR";

  const isStrong = (val: string) =>
    val.length >= 8 && /[A-Z]/.test(val) && /[0-9]/.test(val) && /[^A-Za-z0-9\s]/.test(val);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.username.trim()) e.username = t.errors.usernameEmpty;
    if (!form.email.trim()) e.email = t.errors.emailEmpty;
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = t.errors.emailInvalid;
    if (!form.password) e.password = t.errors.passwordEmpty;
    else if (!isStrong(form.password)) e.password = t.errors.passwordWeak;
    if (!form.confirm) e.confirm = t.errors.confirmEmpty;
    else if (form.confirm !== form.password) e.confirm = t.errors.confirmMatch;
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    if (!validate()) return;

    setIsLoading(true);
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/register`, {
        username: form.username,
        email: form.email,
        password: form.password,
      });
      navigate(`/verify-email-pending?email=${encodeURIComponent(form.email)}`);
    } catch (error: any) {
      setErrors(prev => ({ ...prev, server: error.response?.data?.message || "Error" }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (submitted) setErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
  };

  return (
    <div className="min-h-screen flex bg-[#fbf9f4]" dir={isRTL ? "rtl" : "ltr"}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;600;700&family=Amiri:wght@400;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;600&display=swap');
      `}</style>

      {/* Left Side - Form */}
      <div className="flex-1 flex flex-col justify-center px-8 sm:px-12 lg:px-16 xl:px-24 py-12">
        <div className="max-w-md w-full mx-auto">
          {/* Logo */}
          <div className="mb-10">
            <Link to="/" className="inline-flex items-center">
              <img src={oulamaunaLogo} alt="Oulamauna" className="h-10 w-auto" />
            </Link>
          </div>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-[#1e4d3a] mb-2" style={{ fontFamily: "'Hanken Grotesk', sans-serif" }}>
              {t.title}
            </h1>
            <p className="text-[#1e4d3a]/60 text-sm" style={{ fontFamily: "'Inter', sans-serif" }}>
              {t.subtitle}
            </p>
          </div>

          {/* Google Sign Up */}
          <button
            type="button"
            className="w-full flex items-center justify-center gap-3 px-4 py-3.5 border border-[#1e4d3a]/30 rounded-lg bg-white text-[#1e4d3a] font-medium hover:bg-[#1e4d3a]/10 hover:border-[#1e4d3a]/50 transition-all duration-200 mb-6"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.51h5.92c-.25 1.31-.98 2.42-2.08 3.17v2.7h3.36c1.97-1.81 3.1-4.48 3.1-7.63z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.36-2.7c-.93.62-2.12 1-3.92 1-3.01 0-5.57-2.03-6.48-4.75H2.18v2.97C4.07 20.1 7.72 23 12 23z"/>
              <path fill="#FBBC05" d="M5.52 14.59C5.07 13.4 4.82 12.12 4.82 11s.25-2.4.7-3.59H2.18C1.43 9.1 1 10.02 1 11s.43 1.9 1.18 2.59z"/>
              <path fill="#EA4335" d="M12 4.75c1.7 0 3.24.59 4.45 1.73l3.32-3.32C17.46 1.4 14.88 0 12 0 7.72 0 4.07 2.9 2.18 7.09l3.34 2.97C6.43 6.78 8.99 4.75 12 4.75z"/>
            </svg>
            {t.google}
          </button>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#1e4d3a]/20"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-[#fbf9f4] text-[#1e4d3a]/60" style={{ fontFamily: "'Inter', sans-serif" }}>{t.or}</span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {errors.server && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-[#b23b3b] text-sm" style={{ fontFamily: "'Inter', sans-serif" }}>
                {errors.server}
              </div>
            )}

            <div>
              <label htmlFor="username" className="block text-sm font-semibold text-[#1e4d3a] mb-1.5" style={{ fontFamily: "'Inter', sans-serif" }}>
                {t.usernameLabel}
              </label>
              <input
                id="username"
                type="text"
                value={form.username}
                onChange={(e) => handleChange("username", e.target.value)}
                placeholder={t.usernamePlaceholder}
                className={`w-full px-5 py-3.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e4d3a]/20 focus:border-[#1e4d3a] transition-all duration-200 text-base bg-white text-[#1e4d3a] placeholder-[#1e4d3a]/40 ${errors.username ? 'border-[#b23b3b] focus:ring-[#b23b3b]/20 focus:border-[#b23b3b]' : 'border-[#1e4d3a]/25'}`}
                style={{ fontFamily: "'Inter', sans-serif" }}
              />
              {errors.username && <p className="mt-1.5 text-sm text-[#b23b3b]" style={{ fontFamily: "'Inter', sans-serif" }}>{errors.username}</p>}
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-[#1e4d3a] mb-1.5" style={{ fontFamily: "'Inter', sans-serif" }}>
                {t.emailLabel}
              </label>
              <input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => handleChange("email", e.target.value)}
                placeholder={t.emailPlaceholder}
                className={`w-full px-5 py-3.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e4d3a]/20 focus:border-[#1e4d3a] transition-all duration-200 text-base bg-white text-[#1e4d3a] placeholder-[#1e4d3a]/40 ${errors.email ? 'border-[#b23b3b] focus:ring-[#b23b3b]/20 focus:border-[#b23b3b]' : 'border-[#1e4d3a]/25'}`}
                style={{ fontFamily: "'Inter', sans-serif" }}
              />
              {errors.email && <p className="mt-1.5 text-sm text-[#b23b3b]" style={{ fontFamily: "'Inter', sans-serif" }}>{errors.email}</p>}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-[#1e4d3a] mb-1.5" style={{ fontFamily: "'Inter', sans-serif" }}>
                {t.passwordLabel}
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => handleChange("password", e.target.value)}
                  placeholder={t.passwordPlaceholder}
                  className={`w-full px-5 py-3.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e4d3a]/20 focus:border-[#1e4d3a] transition-all duration-200 text-base pr-12 bg-white text-[#1e4d3a] placeholder-[#1e4d3a]/40 ${errors.password ? 'border-[#b23b3b] focus:ring-[#b23b3b]/20 focus:border-[#b23b3b]' : 'border-[#1e4d3a]/25'}`}
                  style={{ fontFamily: "'Inter', sans-serif" }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#1e4d3a]/40 hover:text-[#1e4d3a] transition-colors"
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {errors.password && <p className="mt-1.5 text-sm text-[#b23b3b]" style={{ fontFamily: "'Inter', sans-serif" }}>{errors.password}</p>}
            </div>

            <div>
              <label htmlFor="confirm" className="block text-sm font-semibold text-[#1e4d3a] mb-1.5" style={{ fontFamily: "'Inter', sans-serif" }}>
                {t.confirmLabel}
              </label>
              <div className="relative">
                <input
                  id="confirm"
                  type={showConfirm ? "text" : "password"}
                  value={form.confirm}
                  onChange={(e) => handleChange("confirm", e.target.value)}
                  placeholder={t.confirmPlaceholder}
                  className={`w-full px-5 py-3.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e4d3a]/20 focus:border-[#1e4d3a] transition-all duration-200 text-base pr-12 bg-white text-[#1e4d3a] placeholder-[#1e4d3a]/40 ${errors.confirm ? 'border-[#b23b3b] focus:ring-[#b23b3b]/20 focus:border-[#b23b3b]' : 'border-[#1e4d3a]/25'}`}
                  style={{ fontFamily: "'Inter', sans-serif" }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#1e4d3a]/40 hover:text-[#1e4d3a] transition-colors"
                >
                  {showConfirm ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {errors.confirm && <p className="mt-1.5 text-sm text-[#b23b3b]" style={{ fontFamily: "'Inter', sans-serif" }}>{errors.confirm}</p>}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#1e4d3a] text-white py-3.5 rounded-lg font-bold hover:bg-white hover:text-[#1e4d3a] border-2 border-[#1e4d3a] focus:outline-none focus:ring-2 focus:ring-[#1e4d3a]/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-base"
              style={{ fontFamily: "'Hanken Grotesk', sans-serif", letterSpacing: "0.05em" }}
            >
              {isLoading ? t.loading : t.button}
            </button>
          </form>

          {/* Sign In Link */}
          <p className="mt-6 text-center text-sm text-[#1e4d3a]/70" style={{ fontFamily: "'Inter', sans-serif" }}>
            {t.haveAccount}{" "}
            <Link to="/login" className="font-semibold text-[#C9A84C] hover:text-[#1e4d3a] transition-colors duration-200">
              {t.signIn}
            </Link>
          </p>
        </div>
      </div>

      {/* Right Side - Wider Image Card */}
      <div className="hidden lg:flex lg:flex-1 justify-center p-1 relative">
        {/* Increased width from max-w-md to max-w-lg */}
        <div className="relative w-full max-w-lg h-full">
          {/* Main Floating Card */}
          <div className="relative bg-white rounded-3xl overflow-hidden shadow-2xl h-full" style={{ boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
            {/* Image Container */}
            <div className="relative h-full min-h-[750px]">
              <img 
                src={libraryImg} 
                alt="Library" 
                className="absolute inset-0 w-full h-full object-cover"
              />
              
              {/* Dark Overlay Gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>

              {/* Content - Minimal Padding */}
              <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: "'Hanken Grotesk', sans-serif" }}>Join Our Community</h2>
                <p className="text-white/80 text-xs leading-relaxed mb-3" style={{ fontFamily: "'Inter', sans-serif" }}>
                  Become a contributor and help preserve Islamic scholarly heritage.
                </p>
                
                {/* Badges */}
                <div className="flex gap-2 flex-wrap">
                  <div className="flex items-center gap-1 px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-full border border-white/20">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    <span className="text-[10px] font-medium" style={{ fontFamily: "'Inter', sans-serif" }}>Join 1000+ Scholars</span>
                  </div>
                  <div className="flex items-center gap-1 px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-full border border-white/20">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    <span className="text-[10px] font-medium" style={{ fontFamily: "'Inter', sans-serif" }}>Secure & Verified</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;