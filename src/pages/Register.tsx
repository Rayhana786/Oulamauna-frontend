import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import libraryImg from "../assets/library.jpg";
import axios from "axios";

type Language = "EN" | "AR" | "FR";

const Register: React.FC<{ lang?: Language }> = ({ lang = "EN" }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [imageVisible, setImageVisible] = useState(false);
  const [formVisible, setFormVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Animation state to handle opposite slide from Login
  const [slideDirection, setSlideDirection] = useState<"left" | "right">("left");

  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    confirm: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    // Determine slide direction based on previous path
    const prevPath = sessionStorage.getItem("lastPath");
    setSlideDirection(prevPath === "/login" ? "left" : "right");
    sessionStorage.setItem("lastPath", location.pathname);

    const imageTimer = setTimeout(() => setImageVisible(true), 50);
    const formTimer = setTimeout(() => setFormVisible(true), 600);
    return () => {
      clearTimeout(imageTimer);
      clearTimeout(formTimer);
    };
  }, [location.pathname]);

  const content: Record<Language, any> = {
    EN: {
      back: "← BACK TO HOME", title: "Join as Contributor", subtitle: "Create your account.",
      username: "USERNAME", usernamePlaceholder: "IbrahimAlFarsi",
      email: "EMAIL ADDRESS", emailPlaceholder: "scholar@oulamauna.org",
      password: "PASSWORD", passwordPlaceholder: "Enter password",
      confirm: "CONFIRM", confirmPlaceholder: "Confirm password",
      button: "CREATE ACCOUNT", google: "Continue with Google",
      haveAccount: "Already have an account?", signIn: "Sign In", or: "OR",
      loading: "CREATING ACCOUNT...",
      errors: {
        usernameEmpty: "Username required.", emailEmpty: "Email required.",
        emailInvalid: "Invalid email.", passwordEmpty: "Password required.",
        passwordWeak: "Password too weak.", confirmEmpty: "Required.",
        confirmMatch: "Passwords don't match.",
      },
      hintPrefix: "Add: ",
      hintParts: { length: "8 chars", upper: "upper", number: "number", symbol: "symbol" },
    },
    AR: {
      back: "← العودة إلى الرئيسية", title: "انضم كمساهم", subtitle: "أنشئ حسابك.",
      username: "اسم المستخدم", usernamePlaceholder: "IbrahimAlFarsi",
      email: "عنوان البريد", emailPlaceholder: "scholar@oulamauna.org",
      password: "كلمة المرور", passwordPlaceholder: "أدخل كلمة المرور",
      confirm: "تأكيد", confirmPlaceholder: "أعد الإدخال",
      button: "إنشاء الحساب", google: "تابع بـ Google",
      haveAccount: "لديك حساب؟", signIn: "تسجيل الدخول", or: "أو",
      loading: "جاري إنشاء الحساب...",
      errors: {
        usernameEmpty: "اسم المستخدم مطلوب.", emailEmpty: "البريد مطلوب.",
        emailInvalid: "بريد غير صالح.", passwordEmpty: "كلمة المرور مطلوبة.",
        passwordWeak: "كلمة المرور ضعيفة.", confirmEmpty: "مطلوب.",
        confirmMatch: "كلمتا المرور لا تتطابقان.",
      },
      hintPrefix: "أضف: ",
      hintParts: { length: "8 أحرف", upper: "كبير", number: "رقم", symbol: "رمز" },
    },
    FR: {
      back: "← RETOUR", title: "Rejoindre", subtitle: "Créez votre compte.",
      username: "NOM D'UTILISATEUR", usernamePlaceholder: "IbrahimAlFarsi",
      email: "ADRESSE E-MAIL", emailPlaceholder: "scholar@oulamauna.org",
      password: "MOT DE PASSE", passwordPlaceholder: "Entrer le mot de passe",
      confirm: "CONFIRMER", confirmPlaceholder: "Confirmer le mot de passe",
      button: "CRÉER UN COMPTE", google: "Continuer avec Google",
      haveAccount: "Déjà inscrit ?", signIn: "Connexion", or: "OU",
      loading: "CRÉATION...",
      errors: {
        usernameEmpty: "Requis.", emailEmpty: "E-mail requis.",
        emailInvalid: "E-mail invalide.", passwordEmpty: "Mot de passe requis.",
        passwordWeak: "Trop faible.", confirmEmpty: "Requis.",
        confirmMatch: "Erreur de match.",
      },
      hintPrefix: "Ajoutez: ",
      hintParts: { length: "8 chars", upper: "Maj", number: "Chiffre", symbol: "Symbole" },
    },
  };

  const t = content[lang] || content.EN;
  const isRTL = lang === "AR";

  const isStrong = (val: string) =>
    val.length >= 8 && /[A-Z]/.test(val) && /[0-9]/.test(val) && /[^A-Za-z0-9\s]/.test(val);

  const getPasswordHint = (val: string) => {
    if (!val || isStrong(val)) return null;
    const missing: string[] = [];
    if (val.length < 8) missing.push(t.hintParts.length);
    if (!/[A-Z]/.test(val)) missing.push(t.hintParts.upper);
    if (!/[0-9]/.test(val)) missing.push(t.hintParts.number);
    if (!/[^A-Za-z0-9\s]/.test(val)) missing.push(t.hintParts.symbol);
    return t.hintPrefix + missing.join(", ");
  };

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
      await axios.post("http://localhost:5000/api/auth/register", {
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

  const iconBase = "w-3.5 h-3.5 text-[#7DA89B] group-hover:text-[#C9A84C] transition-colors duration-200";
  const inputBase = "w-full bg-[#f1f1f1] border border-transparent rounded-[5px] py-2 px-4 text-xs outline-none transition-all duration-200 focus:bg-[#ebebeb]";

  const EyeIcon = ({ open }: { open: boolean }) =>
    open ? (
      <svg className={iconBase} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
    ) : (
      <svg className={iconBase} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
    );

  const Icons = {
    User: () => <svg className={iconBase} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>,
    Email: () => <svg className={iconBase} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>,
    Lock: () => <svg className={iconBase} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>,
  };

  return (
    <div className={`h-screen flex flex-col lg:flex-row bg-white overflow-hidden ${isRTL ? "text-right" : ""}`} dir={isRTL ? "rtl" : "ltr"}>
      
      {/* Right Banner - Animated to slide opposite of Login */}
      <div className={`hidden lg:flex lg:w-[48%] relative flex-col justify-between p-10 transition-transform duration-700 ease-[cubic-bezier(0.4,0,0.2,1)] ${imageVisible ? "translate-x-0" : isRTL ? (slideDirection === "left" ? "-translate-x-full" : "translate-x-full") : (slideDirection === "left" ? "translate-x-full" : "-translate-x-full")}`}>
        <img src={libraryImg} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-[#285B4B]/82" />
        <div className="relative z-10 text-white">
          <h1 className="text-lg font-black tracking-[0.35em]">OULAMAUNA</h1>
          <span className="text-[#D8BF86] text-sm font-arabic block mt-1">عُـلَـمَـاؤُنَـا</span>
        </div>
        <div className="relative z-10">
          <div className="w-10 h-px bg-[#D8BF86]/50 mb-3" />
          <p className="text-white/95 text-base font-serif italic">"My Lord, increase me in knowledge"</p>
          <p className="text-[#D8BF86] text-[10px] font-arabic mt-2">رَبِّ زِدْنِي عِلْمًا</p>
        </div>
      </div>

      {/* Form Section */}
      <div className={`flex-1 flex items-center justify-center px-8 bg-[#faf9f6] transition-all duration-500 ease-out ${formVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
        <div className="w-full max-w-[360px]">
          <Link to="/" className="text-[#B8B09A] text-[10px] tracking-widest mb-4 inline-block hover:text-[#C9A84C] transition-colors">{t.back}</Link>
          <h2 className="text-xl font-serif text-[#285B4B] mb-1">{t.title}</h2>
          <p className="text-[#B8B09A] text-[10px] mb-6">{t.subtitle}</p>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label className="text-[8px] font-bold text-[#B8B09A] tracking-widest uppercase block mb-1">{t.username}</label>
              <div className="relative group">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"><Icons.User /></div>
                <input type="text" value={form.username} onChange={e => handleChange("username", e.target.value)} className={`${inputBase} pl-10`} placeholder={t.usernamePlaceholder} />
              </div>
              {errors.username && <p className="text-red-500 text-[9px] mt-1">{errors.username}</p>}
            </div>

            <div>
              <label className="text-[8px] font-bold text-[#B8B09A] tracking-widest uppercase block mb-1">{t.email}</label>
              <div className="relative group">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"><Icons.Email /></div>
                <input type="email" value={form.email} onChange={e => handleChange("email", e.target.value)} className={`${inputBase} pl-10`} placeholder={t.emailPlaceholder} />
              </div>
              {errors.email && <p className="text-red-500 text-[9px] mt-1">{errors.email}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="relative group">
                <label className="text-[8px] font-bold text-[#B8B09A] tracking-widest uppercase block mb-1">{t.password}</label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"><Icons.Lock /></div>
                  <input type={showPassword ? "text" : "password"} value={form.password} onChange={e => handleChange("password", e.target.value)} className={`${inputBase} pl-10 pr-10`} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2"><EyeIcon open={showPassword} /></button>
                </div>
                {getPasswordHint(form.password) && <p className="text-[8px] text-[#B8B09A] mt-1 leading-tight">{getPasswordHint(form.password)}</p>}
                {errors.password && <p className="text-red-500 text-[9px] mt-1">{errors.password}</p>}
              </div>

              <div className="relative group">
                <label className="text-[8px] font-bold text-[#B8B09A] tracking-widest uppercase block mb-1">{t.confirm}</label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"><Icons.Lock /></div>
                  <input type={showConfirm ? "text" : "password"} value={form.confirm} onChange={e => handleChange("confirm", e.target.value)} className={`${inputBase} pl-10 pr-10`} />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2"><EyeIcon open={showConfirm} /></button>
                </div>
                {errors.confirm && <p className="text-red-500 text-[9px] mt-1">{errors.confirm}</p>}
              </div>
            </div>

            {errors.server && <p className="text-red-500 text-[9px] text-center font-medium bg-red-50 py-1 rounded">{errors.server}</p>}

            <button 
              type="submit" 
              disabled={isLoading} 
              className={`w-full bg-[#285B4B] text-white py-3 rounded-[5px] text-[10px] font-black tracking-widest uppercase hover:bg-[#C9A84C] active:scale-[0.98] transition-all shadow-md shadow-[#285B4B]/10 ${isLoading ? "opacity-70 cursor-not-allowed" : ""}`}
            >
              {isLoading ? t.loading : t.button}
            </button>
          </form>

          <p className="text-center mt-6 text-[10px] text-gray-600">
            {t.haveAccount} <Link to="/login" className="text-[#285B4B] font-bold hover:text-[#C9A84C] transition-colors ml-1">{t.signIn}</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;