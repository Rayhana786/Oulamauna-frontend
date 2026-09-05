import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import libraryImg from "../../assets/library2.jpg";
import logoForBlack from '../../assets/image-removebg-preview (1).png';
import { useLang } from "../../context/LanguageContext";

type Language = "EN" | "AR" | "FR";

const Login: React.FC = () => {
  const { lang } = useLang();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});
  const [isLoading, setIsLoading] = useState(false);

  const content = {
    EN: {
      title: "Welcome back",
      subtitle: "Enter your credentials to access your account",
      emailLabel: "Email",
      emailPlaceholder: "Enter your email",
      passwordLabel: "Password",
      passwordPlaceholder: "Enter your password",
      forgot: "Forgot password?",
      button: "Sign In",
      google: "Sign in with Google",
      noAccount: "Don't have an account?",
      join: "Sign up",
      or: "or",
      errEmailEmpty: "Email is required",
      errEmailInvalid: "Invalid email address",
      errPasswordEmpty: "Password is required",
      errInvalidAuth: "Invalid email or password",
      errServer: "Server connection failed",
    },
    AR: {
      title: "مرحباً بعودتك",
      subtitle: "أدخل بياناتك للوصول إلى حسابك",
      emailLabel: "البريد الإلكتروني",
      emailPlaceholder: "أدخل بريدك الإلكتروني",
      passwordLabel: "كلمة المرور",
      passwordPlaceholder: "أدخل كلمة المرور",
      forgot: "نسيت كلمة المرور؟",
      button: "تسجيل الدخول",
      google: "تسجيل الدخول عبر Google",
      noAccount: "ليس لديك حساب؟",
      join: "إنشاء حساب",
      or: "أو",
      errEmailEmpty: "البريد الإلكتروني مطلوب",
      errEmailInvalid: "عنوان بريد غير صالح",
      errPasswordEmpty: "كلمة المرور مطلوبة",
      errInvalidAuth: "البريد الإلكتروني أو كلمة المرور غير صحيحة",
      errServer: "فشل الاتصال بالخادم",
    },
    FR: {
      title: "Bon retour",
      subtitle: "Entrez vos identifiants pour accéder à votre compte",
      emailLabel: "E-mail",
      emailPlaceholder: "Entrez votre e-mail",
      passwordLabel: "Mot de passe",
      passwordPlaceholder: "Entrez votre mot de passe",
      forgot: "Mot de passe oublié ?",
      button: "Se connecter",
      google: "Se connecter avec Google",
      noAccount: "Pas encore de compte ?",
      join: "S'inscrire",
      or: "ou",
      errEmailEmpty: "E-mail requis",
      errEmailInvalid: "E-mail invalide",
      errPasswordEmpty: "Mot de passe requis",
      errInvalidAuth: "E-mail ou mot de passe incorrect",
      errServer: "Échec de la connexion au serveur",
    },
  };

  const t = content[lang];
  const isRTL = lang === "AR";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    let newErrors: any = {};
    if (!email.trim()) newErrors.email = t.errEmailEmpty;
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = t.errEmailInvalid;
    if (!password.trim()) newErrors.password = t.errPasswordEmpty;

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: "include",
      });

      const data = await response.json();

      if (response.ok) {
        login(data.user, data.token);
        if (data.user.role_name === "admin") {
          navigate("/admin/dashboard");
        } else {
          navigate("/");
        }
      } else {
        if (data.code === "EMAIL_NOT_VERIFIED") {
          navigate(`/verify-email-pending?email=${encodeURIComponent(data.email)}`);
          return;
        }
        setErrors({ password: t.errInvalidAuth });
      }
    } catch (error) {
      setErrors({ general: t.errServer });
    } finally {
      setIsLoading(false);
    }
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
              <img src={logoForBlack} alt="Oulamauna" className="h-10 w-auto" />
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

          {/* Google Sign In - LARGER */}
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
            {errors.general && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-[#b23b3b] text-sm" style={{ fontFamily: "'Inter', sans-serif" }}>
                {errors.general}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-[#1e4d3a] mb-1.5" style={{ fontFamily: "'Inter', sans-serif" }}>
                {t.emailLabel}
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t.emailPlaceholder}
                className={`w-full px-5 py-3.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e4d3a]/20 focus:border-[#1e4d3a] transition-all duration-200 text-base bg-white text-[#1e4d3a] placeholder-[#1e4d3a]/40 ${errors.email ? 'border-[#b23b3b] focus:ring-[#b23b3b]/20 focus:border-[#b23b3b]' : 'border-[#1e4d3a]/25'}`}
                style={{ fontFamily: "'Inter', sans-serif" }}
              />
              {errors.email && <p className="mt-1.5 text-sm text-[#b23b3b]" style={{ fontFamily: "'Inter', sans-serif" }}>{errors.email}</p>}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="password" className="block text-sm font-semibold text-[#1e4d3a]" style={{ fontFamily: "'Inter', sans-serif" }}>
                  {t.passwordLabel}
                </label>
                <Link to="/forgot-password" className="text-sm text-[#C9A84C] hover:text-[#1e4d3a] transition-colors duration-200" style={{ fontFamily: "'Inter', sans-serif" }}>
                  {t.forgot}
                </Link>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#1e4d3a] text-white py-3.5 rounded-lg font-bold hover:bg-white hover:text-[#1e4d3a] border-2 border-[#1e4d3a] focus:outline-none focus:ring-2 focus:ring-[#1e4d3a]/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-base"
              style={{ fontFamily: "'Hanken Grotesk', sans-serif", letterSpacing: "0.05em" }}
            >
              {isLoading ? (isRTL ? "جاري التحميل..." : "Loading...") : t.button}
            </button>
          </form>

          {/* Sign Up Link */}
          <p className="mt-6 text-center text-sm text-[#1e4d3a]/70" style={{ fontFamily: "'Inter', sans-serif" }}>
            {t.noAccount}{" "}
            <Link to="/register" className="font-semibold text-[#C9A84C] hover:text-[#1e4d3a] transition-colors duration-200">
              {t.join}
            </Link>
          </p>
        </div>
      </div>

      {/* Right Side - Wider Image Card */}
      <div className="hidden lg:flex lg:flex-1 justify-center p-1 relative">
        {/* Floating Card Container - WIDER */}
        <div className="relative w-full max-w-lg">
          {/* Main Floating Card */}
          <div className="relative bg-white rounded-3xl overflow-hidden shadow-2xl" style={{ boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
            {/* Image Container */}
            <div className="relative h-[750px]">
              <img 
                src={libraryImg} 
                alt="Library" 
                className="absolute inset-0 w-full h-full object-cover"
              />
              
              {/* Dark Overlay Gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>

              {/* Content - Minimal Padding */}
              <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: "'Hanken Grotesk', sans-serif" }}>Preserving Islamic Scholarly Heritage</h2>
                <p className="text-white/80 text-xs leading-relaxed mb-3" style={{ fontFamily: "'Inter', sans-serif" }}>
                  Discover centuries of knowledge from renowned scholars.
                </p>
                
                {/* Badges */}
                <div className="flex gap-2 flex-wrap">
                  <div className="flex items-center gap-1 px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-full border border-white/20">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-[10px] font-medium" style={{ fontFamily: "'Inter', sans-serif" }}>Verified Sources</span>
                  </div>
                  <div className="flex items-center gap-1 px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-full border border-white/20">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    <span className="text-[10px] font-medium" style={{ fontFamily: "'Inter', sans-serif" }}>500+ Scholars</span>
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

export default Login;