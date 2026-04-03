import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { Link, useNavigate, useLocation } from "react-router-dom";
import libraryImg from "../assets/library.jpg";

type Language = "EN" | "AR" | "FR";

const Login: React.FC<{ lang?: Language }> = ({ lang = "EN" }) => {
  const navigate = useNavigate();
  //auth context for login function
  const { login } = useAuth();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  
  // Animation states
  const [slideDirection, setSlideDirection] = useState<"left" | "right">("right");
  const [imageVisible, setImageVisible] = useState(false);
  const [formVisible, setFormVisible] = useState(false);

  useEffect(() => {
    const prevPath = sessionStorage.getItem("lastPath");
    setSlideDirection(prevPath === "/register" ? "right" : "left");
    sessionStorage.setItem("lastPath", location.pathname);
    
    const imageTimer = setTimeout(() => setImageVisible(true), 50);
    const formTimer = setTimeout(() => setFormVisible(true), 600);
    
    return () => {
      clearTimeout(imageTimer);
      clearTimeout(formTimer);
    };
  }, [location.pathname]);

  const content = {
    EN: {
      back: "← BACK TO HOME", title: "Welcome Back", subtitle: "Sign in to continue your journey.",
      emailLabel: "EMAIL ADDRESS", emailPlaceholder: "scholar@oulamauna.org",
      passwordLabel: "PASSWORD", passwordPlaceholder: "Enter your password",
      forgot: "Forgot password?", remember: "Remember me", button: "SIGN IN",
      google: "Continue with Google", noAccount: "Don't have an account?", join: "Join as Contributor", or: "OR",
      errEmailEmpty: "Email required.", errEmailInvalid: "Invalid email address.",
      errPasswordEmpty: "Password required.",
      errInvalidAuth: "Invalid email or password.",
      errServer: "Server connection failed.",
    },
    AR: {
      back: "← العودة إلى الرئيسية", title: "مرحبا بعودتك", subtitle: "سجل الدخول لمواصلة رحلتك.",
      emailLabel: "عنوان البريد", emailPlaceholder: "scholar@oulamauna.org",
      passwordLabel: "كلمة المرور", passwordPlaceholder: "أدخل كلمة المرور",
      forgot: "نسيت كلمة المرور؟", remember: "تذكرني", button: "تسجيل الدخول",
      google: "تابع بـ Google", noAccount: "ليس لديك حساب؟", join: "انضم كمساهم", or: "أو",
      errEmailEmpty: "البريد مطلوب.", errEmailInvalid: "بريد غير صالح.",
      errPasswordEmpty: "كلمة المرور مطلوبة.",
      errInvalidAuth: "البريد الإلكتروني أو كلمة المرور غير صحيحة.",
      errServer: "فشل الاتصال بالخادم.",
    },
    FR: {
      back: "← RETOUR À L'ACCUEIL", title: "Bienvenue de retour", subtitle: "Connectez-vous pour continuer.",
      emailLabel: "ADRESSE E-MAIL", emailPlaceholder: "scholar@oulamauna.org",
      passwordLabel: "MOT DE PASSE", passwordPlaceholder: "Entrez votre mot de passe",
      forgot: "Mot de passe oublié ?", remember: "Se souvenir de moi", button: "SE CONNECTER",
      google: "Continuer with Google", noAccount: "Pas de compte ?", join: "Rejoindre en tant que contributeur", or: "OU",
      errEmailEmpty: "E-mail requis.", errEmailInvalid: "E-mail invalide.",
      errPasswordEmpty: "Mot de passe requis.",
      errInvalidAuth: "E-mail ou mot de passe incorrect.",
      errServer: "Échec de la connexion au serveur.",
    },
  };

  const t = content[lang];
  const isRTL = lang === "AR";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    // Frontend Validation
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
      const response = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
         credentials: "include",
      });

      const data = await response.json();
if (response.ok) {
  // نمرر الـ user والـ token معاً لدالة الـ login كما يتوقع الـ Context
  login(data.user, data.token); 

  

  navigate("/");
}else {
        // عرض خطأ التوثيق تحت حقل كلمة المرور للخصوصية والأمان
        setErrors({ password: t.errInvalidAuth });
      }
    } catch (error) {
      setErrors({ general: t.errServer });
    } finally {
      setIsLoading(false);
    }
  };

  const iconBase = "w-3.5 h-3.5 text-[#7DA89B] transition-colors duration-200 group-hover:text-[#C9A84C]";
  const inputBase = "w-full bg-[#f1f1f1] border border-transparent rounded-[5px] py-2 px-4 text-xs outline-none transition-all duration-200 focus:bg-[#ebebeb]";

  const EyeIcon = ({ open }: { open: boolean }) =>
    open ? (
      <svg className={iconBase} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
    ) : (
      <svg className={iconBase} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
    );

  const Icons = {
    Email: () => <svg className={iconBase} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>,
    Lock: () => <svg className={iconBase} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>,
    Google: () => (
      <svg className="w-4 h-4" viewBox="0 0 24 24">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.51h5.92c-.25 1.31-.98 2.42-2.08 3.17v2.7h3.36c1.97-1.81 3.1-4.48 3.1-7.63z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.36-2.7c-.93.62-2.12 1-3.92 1-3.01 0-5.57-2.03-6.48-4.75H2.18v2.97C4.07 20.1 7.72 23 12 23z"/><path fill="#FBBC05" d="M5.52 14.59C5.07 13.4 4.82 12.12 4.82 11s.25-2.4.7-3.59H2.18C1.43 9.1 1 10.02 1 11s.43 1.9 1.18 2.59z"/><path fill="#EA4335" d="M12 4.75c1.7 0 3.24.59 4.45 1.73l3.32-3.32C17.46 1.4 14.88 0 12 0 7.72 0 4.07 2.9 2.18 7.09l3.34 2.97C6.43 6.78 8.99 4.75 12 4.75z"/>
      </svg>
    ),
  };

  const ErrorMsg = ({ msg }: { msg: string }) => (
    <p className="text-red-500 text-[9px] mt-0.5 flex items-start gap-1 leading-tight">
      <svg className="w-2.5 h-2.5 shrink-0 mt-px" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
      <span>{msg}</span>
    </p>
  );

  return (
    <div className={`h-screen flex flex-col lg:flex-row bg-white overflow-hidden ${isRTL ? "text-right" : ""}`} dir={isRTL ? "rtl" : "ltr"}>
      <div className={`flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-6 bg-[#faf9f6] transition-all duration-300 ease-out ${formVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
        <div className="w-full max-w-[370px] py-12">
          <div className="mb-2">
            <Link to="/" className="inline-flex items-center gap-2 text-[#B8B09A] hover:text-[#C9A84C] transition-colors duration-200 text-[10px] tracking-widest">
              {t.back}
            </Link>
          </div>

          <div className="mb-4">
            <h2 className="text-xl font-serif text-[#285B4B] mb-1">{t.title}</h2>
            <p className="text-[#B8B09A] text-[10px]">{t.subtitle}</p>
            <div className="w-10 h-px bg-[#D8BF86]/50 mt-2.5" />
          </div>

          {errors.general && <div className="mb-3 p-2 bg-red-50 border border-red-100 rounded text-red-600 text-[10px]">{errors.general}</div>}

          <form onSubmit={handleSubmit} className="space-y-1.5" noValidate>
            <div className="space-y-1">
              <label className="text-[8px] tracking-[0.2em] text-[#B8B09A] font-bold uppercase block">{t.emailLabel}</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none"><Icons.Email /></div>
                <input 
                  type="email" 
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                  placeholder={t.emailPlaceholder} 
                  className={`${inputBase} pl-10 ${errors.email ? "border-red-300 ring-1 ring-red-100" : ""}`} 
                />
              </div>
              {errors.email && <ErrorMsg msg={errors.email} />}
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-[8px] tracking-[0.2em] text-[#B8B09A] font-bold uppercase">{t.passwordLabel}</label>
                <Link to="/forgot-password" className="text-[9px] text-[#7DA89B] hover:text-[#C9A84C] transition-colors duration-200">{t.forgot}</Link>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none"><Icons.Lock /></div>
                <input 
                  type={showPassword ? "text" : "password"} 
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                  placeholder={t.passwordPlaceholder} 
                  className={`${inputBase} pl-10 pr-10 ${errors.password ? "border-red-300 ring-1 ring-red-100" : ""}`} 
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2"><EyeIcon open={showPassword} /></button>
              </div>
              {errors.password && <ErrorMsg msg={errors.password} />}
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              className={`w-full bg-[#285B4B] text-white py-2.5 rounded-[5px] text-[10px] font-black tracking-[0.25em] uppercase hover:bg-[#C9A84C] active:scale-[0.98] transition-all duration-300 shadow-md shadow-[#285B4B]/20 mt-2 font-arabic ${isLoading ? "opacity-70 cursor-not-allowed" : ""}`}
            >
              {isLoading ? (isRTL ? "جاري التحميل..." : "LOADING...") : t.button}
            </button>

            <div className="flex items-center gap-2 py-0.5">
              <div className="flex-1 h-px bg-gray-100" />
              <span className="text-[9px] text-[#B8B09A] tracking-widest font-medium">{t.or}</span>
              <div className="flex-1 h-px bg-gray-100" />
            </div>

            <button type="button" className="w-full border border-gray-200 py-2.5 rounded-[5px] flex items-center justify-center gap-2 text-[10px] text-gray-700 hover:border-[#C9A84C]/60 hover:bg-[#C9A84C]/5 active:scale-[0.98] transition-all duration-200 font-arabic">
              <Icons.Google /> {t.google}
            </button>
          </form>

          <p className="text-center mt-3 text-[10px] text-gray-600">
            {t.noAccount}{" "}
            <Link to="/register" className="text-[#285B4B] font-semibold hover:text-[#C9A84C] transition-colors duration-200">{t.join}</Link>
          </p>
        </div>
      </div>

      {/* Right Banner */}
      <div className={`hidden border overflow-hidden lg:flex lg:w-[48%] relative flex-col justify-between p-8 lg:p-10 transition-transform duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${imageVisible ? "translate-x-0" : isRTL ? (slideDirection === "right" ? "translate-x-full" : "-translate-x-full") : (slideDirection === "right" ? "-translate-x-full" : "translate-x-full")}`}>
        <img src={libraryImg} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-[#285B4B]/82" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />
        <Link to="/" className="relative z-10">
          <h1 className="text-lg font-black tracking-[0.35em] text-white uppercase">OULAMAUNA</h1>
          <span className="text-[#D8BF86] text-sm font-arabic mt-1 block">عُـلَـمَـاؤُنَـا</span>
        </Link>
        <div className="relative z-10">
          <div className="w-10 h-px bg-[#D8BF86]/50 mb-3" />
          <p className="text-white/95 text-base font-serif italic">"My Lord, increase me in knowledge"</p>
          <p className="text-[#D8BF86] text-[10px] font-arabic mt-2">رَبِّ زِدْنِي عِلْمًا</p>
        </div>
      </div>
    </div>
  );
};

export default Login;