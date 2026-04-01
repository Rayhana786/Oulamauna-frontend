import React, { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

type Language = "EN" | "AR" | "FR";

const ResetPassword: React.FC<{ lang?: Language }> = ({ lang = "EN" }) => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState<{ password?: string; confirm?: string }>({});
  const [submitted, setSubmitted] = useState(false);
  const [done, setDone] = useState(false);

  const content = {
    EN: {
      back: "← Back to Sign In",
      title: "Reset Password",
      subtitle: "Choose a new password for your account.",
      passwordLabel: "NEW PASSWORD",
      passwordPlaceholder: "Enter new password",
      confirmLabel: "CONFIRM PASSWORD",
      confirmPlaceholder: "Confirm new password",
      button: "RESET PASSWORD",
      errPasswordEmpty: "Please enter a new password.",
      errPasswordWeak: "Please satisfy all password requirements below.",
      errConfirmEmpty: "Please confirm your password.",
      errConfirmMatch: "Passwords do not match.",
      doneTitle: "Password Updated",
      doneSubtitle: "Your password has been reset successfully. You can now sign in.",
      doneButton: "SIGN IN",
      invalidToken: "This reset link is invalid or has expired.",
      invalidBack: "Request a new link",
      checks: {
        length: "At least 8 characters",
        upper: "One uppercase letter (A–Z)",
        number: "One number (0–9)",
        symbol: "One symbol (@, #, !, …)",
      },
    },
    AR: {
      back: "→ العودة لتسجيل الدخول",
      title: "إعادة تعيين كلمة المرور",
      subtitle: "اختر كلمة مرور جديدة لحسابك.",
      passwordLabel: "كلمة المرور الجديدة",
      passwordPlaceholder: "أدخل كلمة مرور جديدة",
      confirmLabel: "تأكيد كلمة المرور",
      confirmPlaceholder: "أعد إدخال كلمة المرور",
      button: "تعيين كلمة المرور",
      errPasswordEmpty: "الرجاء إدخال كلمة مرور جديدة.",
      errPasswordWeak: "يرجى استيفاء جميع متطلبات كلمة المرور أدناه.",
      errConfirmEmpty: "الرجاء تأكيد كلمة المرور.",
      errConfirmMatch: "كلمتا المرور غير متطابقتين.",
      doneTitle: "تم تحديث كلمة المرور",
      doneSubtitle: "تمت إعادة تعيين كلمة المرور بنجاح. يمكنك الآن تسجيل الدخول.",
      doneButton: "تسجيل الدخول",
      invalidToken: "رابط إعادة التعيين غير صالح أو منتهي الصلاحية.",
      invalidBack: "طلب رابط جديد",
      checks: {
        length: "8 أحرف على الأقل",
        upper: "حرف كبير واحد (A–Z)",
        number: "رقم واحد (0–9)",
        symbol: "رمز واحد (@، #، !، …)",
      },
    },
    FR: {
      back: "← Retour à la connexion",
      title: "Réinitialiser le mot de passe",
      subtitle: "Choisissez un nouveau mot de passe pour votre compte.",
      passwordLabel: "NOUVEAU MOT DE PASSE",
      passwordPlaceholder: "Entrez un nouveau mot de passe",
      confirmLabel: "CONFIRMER LE MOT DE PASSE",
      confirmPlaceholder: "Confirmez le mot de passe",
      button: "RÉINITIALISER",
      errPasswordEmpty: "Veuillez entrer un nouveau mot de passe.",
      errPasswordWeak: "Veuillez satisfaire toutes les exigences ci-dessous.",
      errConfirmEmpty: "Veuillez confirmer votre mot de passe.",
      errConfirmMatch: "Les mots de passe ne correspondent pas.",
      doneTitle: "Mot de passe mis à jour",
      doneSubtitle: "Votre mot de passe a été réinitialisé avec succès. Vous pouvez maintenant vous connecter.",
      doneButton: "SE CONNECTER",
      invalidToken: "Ce lien de réinitialisation est invalide ou a expiré.",
      invalidBack: "Demander un nouveau lien",
      checks: {
        length: "8 caractères minimum",
        upper: "Une majuscule (A–Z)",
        number: "Un chiffre (0–9)",
        symbol: "Un symbole (@, #, !, …)",
      },
    },
  };

  const t = content[lang];
  const isRTL = lang === "AR";

  // Strong password: min 8 chars, at least 1 uppercase, 1 number, 1 special char
  const isStrong = (val: string) =>
    val.length >= 8 &&
    /[A-Z]/.test(val) &&
    /[0-9]/.test(val) &&
    /[^A-Za-z0-9]/.test(val);

  const validate = () => {
    const newErrors: { password?: string; confirm?: string } = {};
    if (!password.trim()) {
      newErrors.password = t.errPasswordEmpty;
    } else if (!isStrong(password)) {
      newErrors.password = t.errPasswordWeak;
    }
    if (!confirm.trim()) {
      newErrors.confirm = t.errConfirmEmpty;
    } else if (password !== confirm) {
      newErrors.confirm = t.errConfirmMatch;
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    if (validate()) {
      setDone(true);
      // TODO: call your API with token + password
    }
  };

  const iconBase = "w-4 h-4 text-[#7DA89B] transition-colors duration-200 group-hover:text-[#C9A84C]";
  const inputBase = "w-full bg-[#f8fafc] border rounded-2xl pl-12 pr-12 py-3 text-sm outline-none transition-all duration-200 group-hover:border-[#C9A84C]/50 focus:border-[#C9A84C]";

  // Single eye icon used for both fields
  const EyeIcon = ({ open }: { open: boolean }) =>
    open ? (
      <svg className={iconBase} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      </svg>
    ) : (
      <svg className={iconBase} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
      </svg>
    );

  const LockIcon = () => (
    <svg className={iconBase} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  );

  const ErrorMsg = ({ msg }: { msg: string }) => (
    <p className="text-red-500 text-[11px] mt-1.5 flex items-center gap-1">
      <svg className="w-3 h-3 shrink-0" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
      </svg>
      {msg}
    </p>
  );

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

        {/* Invalid / missing token */}
        {!token ? (
          <div className="text-center">
            <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-5">
              <svg className="w-7 h-7 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
            </div>
            <p className="text-[#285B4B] text-sm font-medium mb-1">{t.invalidToken}</p>
            <Link
              to="/forgot-password"
              className="text-xs text-[#7DA89B] hover:text-[#C9A84C] transition-colors duration-200 underline underline-offset-2"
            >
              {t.invalidBack}
            </Link>
          </div>

        ) : done ? (
          /* ── SUCCESS STATE ── */
          <div className="text-center">
            <div className="w-14 h-14 rounded-2xl bg-[#285B4B]/8 flex items-center justify-center mx-auto mb-5">
              <svg className="w-7 h-7 text-[#285B4B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-3xl font-serif text-[#285B4B] mb-1">{t.doneTitle}</h2>
            <p className="text-[#B8B09A] text-sm mb-6 leading-relaxed">{t.doneSubtitle}</p>
            <Link
              to="/login"
              className="block w-full text-center bg-[#285B4B] text-white py-3 rounded-2xl text-xs font-black tracking-[0.3em] uppercase hover:bg-[#C9A84C] active:scale-[0.98] transition-all duration-300"
            >
              {t.doneButton}
            </Link>
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

              {/* New Password */}
              <div>
                <label className="text-[10px] tracking-[0.25em] text-[#B8B09A] font-bold uppercase block mb-1.5">
                  {t.passwordLabel}
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
                    <LockIcon />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={e => { setPassword(e.target.value); if (submitted) setErrors(prev => ({ ...prev, password: undefined })); }}
                    placeholder={t.passwordPlaceholder}
                    className={`${inputBase} ${errors.password ? "border-red-300 bg-red-50/30" : "border-gray-100"}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-1"
                    aria-label={showPassword ? "Hide" : "Show"}
                  >
                    <EyeIcon open={showPassword} />
                  </button>
                </div>
                {/* Live single-sentence hint */}
                {password.length > 0 && (() => {
                  const missing: string[] = [];
                  if (password.length < 8)           missing.push(lang === "AR" ? "8 أحرف" : lang === "FR" ? "8 caractères" : "8 characters");
                  if (!/[A-Z]/.test(password))        missing.push(lang === "AR" ? "حرف كبير" : lang === "FR" ? "une majuscule" : "uppercase");
                  if (!/[0-9]/.test(password))        missing.push(lang === "AR" ? "رقم" : lang === "FR" ? "un chiffre" : "a number");
                  if (!/[^A-Za-z0-9]/.test(password)) missing.push(lang === "AR" ? "رمز" : lang === "FR" ? "un symbole" : "a symbol");
                  if (missing.length === 0) return (
                    <p className="text-[#285B4B] text-[11px] mt-1.5 flex items-center gap-1">
                      <svg className="w-3 h-3 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                      {lang === "AR" ? "كلمة مرور قوية" : lang === "FR" ? "Mot de passe fort" : "Strong password"}
                    </p>
                  );
                  const prefix = lang === "AR" ? "أضف " : lang === "FR" ? "Ajoutez " : "Add ";
                  const joined = missing.join(lang === "AR" ? " و" : ", ");
                  return (
                    <p className="text-[#B8B09A] text-[11px] mt-1.5">{prefix}{joined}</p>
                  );
                })()}
                {errors.password && <ErrorMsg msg={errors.password} />}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="text-[10px] tracking-[0.25em] text-[#B8B09A] font-bold uppercase block mb-1.5">
                  {t.confirmLabel}
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
                    <LockIcon />
                  </div>
                  <input
                    type={showConfirm ? "text" : "password"}
                    value={confirm}
                    onChange={e => { setConfirm(e.target.value); if (submitted) setErrors(prev => ({ ...prev, confirm: undefined })); }}
                    placeholder={t.confirmPlaceholder}
                    className={`${inputBase} ${errors.confirm ? "border-red-300 bg-red-50/30" : "border-gray-100"}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-1"
                    aria-label={showConfirm ? "Hide" : "Show"}
                  >
                    <EyeIcon open={showConfirm} />
                  </button>
                </div>
                {errors.confirm && <ErrorMsg msg={errors.confirm} />}
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

export default ResetPassword;