// src/pages/ResetPassword.tsx
import React, { useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { useLang } from "../../context/LanguageContext";
import logo from "../../assets/tlogo2.png";
// --- Your Design System ---
const colors = {
  creamLight: "#fcfaf5",
  creamMid: "#f6efdc",
  creamDark: "#e5d5a8",
  forestGreen: "#0b4335",
  amber: "#b8860b",
  red: "#8b2c2c",
};

const GREEN = colors.forestGreen;
const GOLD = colors.amber;
const BG = colors.creamLight;
const CARD_BG = colors.creamLight;
const BORDER = colors.creamMid;
const MUTED = "rgba(11, 67, 53, 0.6)";
const RED = colors.red;

const MONO: React.CSSProperties = { fontFamily: "'JetBrains Mono', monospace" };
const SERIF: React.CSSProperties = { fontFamily: "'Hanken Grotesk', sans-serif" };
const SANS: React.CSSProperties = { fontFamily: "'Inter', sans-serif" };

// --- Helper Components ---
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => (typeof window !== "undefined" ? window.innerWidth < 768 : false));
  React.useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return isMobile;
}

function Icon({ name, size = 18, style }: { name: string; size?: number; style?: React.CSSProperties }) {
  return (
    <span className="material-symbols-outlined" style={{ fontSize: `${size}px`, lineHeight: 1, userSelect: "none", ...style }}>
      {name}
    </span>
  );
}

function HoverCard({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        border: `1px solid rgba(11, 67, 53, 0.1)`,
        boxShadow: hov ? "0px 6px 24px rgba(11, 67, 53, 0.12)" : "0px 4px 20px rgba(11, 67, 53, 0.08)",
        transform: hov ? "translateY(-2px)" : "translateY(0)",
        transition: "all 0.3s ease",
        backgroundColor: CARD_BG,
        borderRadius: "12px",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function HoverBtn({
  children, onClick, type = "button", variant = "outline", danger = false, disabled = false, style,
}: {
  children: React.ReactNode; onClick?: () => void; type?: "button" | "submit"; variant?: "outline" | "primary"; danger?: boolean; disabled?: boolean; style?: React.CSSProperties;
}) {
  const [hov, setHov] = useState(false);
  const baseColor = danger ? RED : GREEN;
  let bg = "transparent";
  let color = baseColor;
  let border = `2px solid ${baseColor}`;

  if (variant === "primary") {
    bg = baseColor; color = BG;
    if (hov && !disabled) { bg = BG; color = baseColor; }
  } else {
    if (hov && !disabled) { bg = baseColor; color = BG; }
  }

  return (
    <button
      type={type} onClick={onClick} disabled={disabled}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ 
        display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "6px", 
        padding: "12px 24px", border, borderRadius: "8px", backgroundColor: bg, color,
        fontSize: "12px", fontWeight: 600, letterSpacing: "0.05em", 
        cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.6 : 1,
        transition: "all 0.3s", fontFamily: "'Hanken Grotesk', sans-serif", width: "100%", ...style 
      }}
    >
      {children}
    </button>
  );
}

// --- Main Component ---
const ResetPassword: React.FC = () => {
  const { lang, t } = useLang();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState<{ password?: string; confirm?: string }>({});
  const [submitted, setSubmitted] = useState(false);
  const [done, setDone] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const isMobile = useIsMobile();
  const isRTL = lang === "AR"; // Adjust "AR" if your Arabic lang code is different (e.g., "ar")

  // Strong password validation
  const isStrong = (val: string) =>
    val.length >= 8 &&
    /[A-Z]/.test(val) &&
    /[0-9]/.test(val) &&
    /[^A-Za-z0-9]/.test(val);

  const validate = () => {
    const newErrors: { password?: string; confirm?: string } = {};
    if (!password.trim()) {
      newErrors.password = t("resetPassword.errPasswordEmpty");
    } else if (!isStrong(password)) {
      newErrors.password = t("resetPassword.errPasswordWeak");
    }
    if (!confirm.trim()) {
      newErrors.confirm = t("resetPassword.errConfirmEmpty");
    } else if (password !== confirm) {
      newErrors.confirm = t("resetPassword.errConfirmMatch");
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    if (!validate()) return;

    setIsLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json();
      if (!response.ok) {
        // If the backend returns an invalid/expired token error, redirect to request a new one
        const msg = (data.message || "").toLowerCase();
        if (msg.includes("invalid") || msg.includes("expired") || msg.includes("not found")) {
          navigate("/forgot-password?error=invalid_token");
        } else {
          setErrors({ password: data.message || t("resetPassword.errServer") });
        }
        return;
      }

      setDone(true);
    } catch (err) {
      console.error("Reset password error:", err);
      setErrors({ password: t("resetPassword.errServer") });
    } finally {
      setIsLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    backgroundColor: "rgba(11, 67, 53, 0.04)",
    border: `1.5px solid ${BORDER}`,
    padding: "12px 14px",
    borderRadius: "8px",
    fontSize: "14px",
    color: GREEN,
    ...SANS,
    outline: "none",
    transition: "all 0.15s",
    width: "100%",
    boxSizing: "border-box",
  };

  return (
    <div dir={isRTL ? "rtl" : "ltr"} style={{ ...SANS, backgroundColor: BG, backgroundImage: "radial-gradient(circle at 50% 0%, rgba(184, 134, 11, 0.06) 0%, transparent 60%)", minHeight: "100vh", color: GREEN, display: "flex", alignItems: "center", justifyContent: "center", padding: isMobile ? "24px 16px" : "40px" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;700&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap');
        .material-symbols-outlined { font-variation-settings: 'FILL' 0,'wght' 400,'GRAD' 0,'opsz' 24; font-family: 'Material Symbols Outlined'; display: inline-block; vertical-align: middle; }
        .op-input:focus { border-color: ${GREEN} !important; box-shadow: inset 0 0 0 1px rgba(11,67,53,0.12); background-color: ${BG} !important; }
      `}</style>

      <div style={{ width: "100%", maxWidth: "440px", display: "flex", flexDirection: "column", gap: "24px" }}>
        
       {/* Logo */}
<div style={{ textAlign: "center", marginBottom: "8px" }}>
  <img
    src={logo}
    alt="OULAMAUNA"
    style={{
      width: "56px",
      height: "56px",
      objectFit: "contain",
      margin: "0 auto 12px",
      display: "block",
    }}
  />

  <p
  style={{
    ...MONO,
    fontSize: isRTL ? "17px" : "11px",
    letterSpacing: isRTL ? "0" : "0.3em",
    color: GREEN,
    fontWeight: 700,
    margin: 0,
    textTransform: isRTL ? "none" : "uppercase",
    direction: isRTL ? "rtl" : "ltr",
  }}
>
  {isRTL ? "علماؤنا" : "OULAMAUNA"}
</p>
</div>

        {!token ? (
          /* Invalid Token State */
          <HoverCard style={{ padding: isMobile ? "24px 20px" : "32px 28px", textAlign: "center" }}>
            <div style={{ width: "64px", height: "64px", borderRadius: "50%", backgroundColor: "rgba(139, 44, 44, 0.08)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
              <Icon name="link_off" size={32} style={{ color: RED }} />
            </div>
            <p style={{ fontSize: "15px", color: RED, fontWeight: 600, margin: "0 0 16px" }}>
              {t("resetPassword.invalidToken")}
            </p>
            <Link
              to="/forgot-password"
              style={{ fontSize: "12px", color: GOLD, textDecoration: "none", fontWeight: 600, letterSpacing: "0.05em", transition: "color 0.2s" }}
            >
              {t("resetPassword.invalidBack")}
            </Link>
          </HoverCard>
        ) : done ? (
          /* Success State */
          <HoverCard style={{ padding: isMobile ? "24px 20px" : "32px 28px", textAlign: "center" }}>
            <div style={{ width: "64px", height: "64px", borderRadius: "50%", backgroundColor: "rgba(11, 67, 53, 0.08)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
              <Icon name="check_circle" size={32} style={{ color: GREEN }} />
            </div>
            <h2 style={{ ...SERIF, fontSize: "24px", fontWeight: 700, color: GREEN, margin: "0 0 8px" }}>
              {t("resetPassword.doneTitle")}
            </h2>
            <p style={{ fontSize: "14px", color: MUTED, margin: "0 0 24px", lineHeight: 1.5 }}>
              {t("resetPassword.doneSubtitle")}
            </p>
            <HoverBtn variant="primary" onClick={() => navigate("/login")}>
              {t("resetPassword.doneButton")}
            </HoverBtn>
          </HoverCard>
        ) : (
          /* Form State */
          <HoverCard style={{ padding: isMobile ? "24px 20px" : "32px 28px" }}>
            <div style={{ marginBottom: "24px" }}>
              <h2 style={{ ...SERIF, fontSize: "26px", fontWeight: 700, color: GREEN, margin: "0 0 8px" }}>
                {t("resetPassword.title")}
              </h2>
              <p style={{ fontSize: "14px", color: MUTED, margin: 0, lineHeight: 1.5 }}>
                {t("resetPassword.subtitle")}
              </p>
              <div style={{ width: "40px", height: "2px", backgroundColor: "rgba(184, 134, 11, 0.5)", marginTop: "16px" }} />
            </div>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }} noValidate>
              
              {/* Password Field */}
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <label style={{ ...MONO, fontSize: "10px", color: MUTED, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600 }}>
                  {t("resetPassword.passwordLabel")}
                </label>
                <div style={{ position: "relative" }}>
                  <div style={{ position: "absolute", top: "50%", transform: "translateY(-50%)", [isRTL ? "right" : "left"]: "14px", display: "flex", alignItems: "center", pointerEvents: "none" }}>
                    <Icon name="lock" size={18} style={{ color: MUTED }} />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); if (submitted) setErrors(prev => ({ ...prev, password: undefined })); }}
                    placeholder={t("resetPassword.passwordPlaceholder")}
                    className="op-input"
                    style={{
                      ...inputStyle,
                      [isRTL ? "paddingRight" : "paddingLeft"]: "42px",
                      borderColor: errors.password ? RED : BORDER,
                      backgroundColor: errors.password ? "rgba(139, 44, 44, 0.04)" : inputStyle.backgroundColor,
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: "absolute", top: "50%", transform: "translateY(-50%)",
                      [isRTL ? "left" : "right"]: "14px", background: "none", border: "none", cursor: "pointer",
                      color: MUTED, display: "flex", alignItems: "center", justifyContent: "center"
                    }}
                  >
                    <Icon name={showPassword ? "visibility_off" : "visibility"} size={18} />
                  </button>
                </div>
                
                {/* Live Validation Feedback (Fully Dynamic for ANY Language) */}
                {password.length > 0 && (() => {
                  const checks = [
                    { valid: password.length >= 8, key: "length" },
                    { valid: /[A-Z]/.test(password), key: "upper" },
                    { valid: /[0-9]/.test(password), key: "number" },
                    { valid: /[^A-Za-z0-9]/.test(password), key: "symbol" },
                  ];
                  const missing = checks.filter(c => !c.valid).map(c => t(`resetPassword.checks.${c.key}`));
                  
                  if (missing.length === 0) {
                    return (
                      <p style={{ fontSize: "12px", color: GREEN, margin: "4px 0 0", display: "flex", alignItems: "center", gap: "6px" }}>
                        <Icon name="check" size={14} style={{ color: GREEN }} />
                        {t("resetPassword.checks.allGood")}
                      </p>
                    );
                  }
                  return (
                    <p style={{ fontSize: "12px", color: MUTED, margin: "4px 0 0" }}>
                      {t("resetPassword.checks.add")} {missing.join(", ")}
                    </p>
                  );
                })()}
                
                {errors.password && (
                  <p style={{ fontSize: "12px", color: RED, margin: "4px 0 0", display: "flex", alignItems: "center", gap: "6px" }}>
                    <Icon name="error" size={14} />
                    {errors.password}
                  </p>
                )}
              </div>

              {/* Confirm Field */}
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <label style={{ ...MONO, fontSize: "10px", color: MUTED, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600 }}>
                  {t("resetPassword.confirmLabel")}
                </label>
                <div style={{ position: "relative" }}>
                  <div style={{ position: "absolute", top: "50%", transform: "translateY(-50%)", [isRTL ? "right" : "left"]: "14px", display: "flex", alignItems: "center", pointerEvents: "none" }}>
                    <Icon name="lock" size={18} style={{ color: MUTED }} />
                  </div>
                  <input
                    type={showConfirm ? "text" : "password"}
                    value={confirm}
                    onChange={(e) => { setConfirm(e.target.value); if (submitted) setErrors(prev => ({ ...prev, confirm: undefined })); }}
                    placeholder={t("resetPassword.confirmPlaceholder")}
                    className="op-input"
                    style={{
                      ...inputStyle,
                      [isRTL ? "paddingRight" : "paddingLeft"]: "42px",
                      borderColor: errors.confirm ? RED : BORDER,
                      backgroundColor: errors.confirm ? "rgba(139, 44, 44, 0.04)" : inputStyle.backgroundColor,
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    style={{
                      position: "absolute", top: "50%", transform: "translateY(-50%)",
                      [isRTL ? "left" : "right"]: "14px", background: "none", border: "none", cursor: "pointer",
                      color: MUTED, display: "flex", alignItems: "center", justifyContent: "center"
                    }}
                  >
                    <Icon name={showConfirm ? "visibility_off" : "visibility"} size={18} />
                  </button>
                </div>
                {errors.confirm && (
                  <p style={{ fontSize: "12px", color: RED, margin: "4px 0 0", display: "flex", alignItems: "center", gap: "6px" }}>
                    <Icon name="error" size={14} />
                    {errors.confirm}
                  </p>
                )}
              </div>

              <HoverBtn type="submit" variant="primary" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Icon name="hourglass_empty" size={14} />
                    {t("resetPassword.sending")}
                  </>
                ) : (
                  t("resetPassword.button")
                )}
              </HoverBtn>
            </form>

            <div style={{ marginTop: "24px", textAlign: "center" }}>
              <Link
                to="/login"
                style={{ fontSize: "12px", color: MUTED, textDecoration: "none", fontWeight: 600, letterSpacing: "0.05em", transition: "color 0.2s", display: "inline-flex", alignItems: "center", gap: "6px" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = GOLD)}
                onMouseLeave={(e) => (e.currentTarget.style.color = MUTED)}
              >
                <Icon name={isRTL ? "arrow_forward" : "arrow_back"} size={16} />
                {t("resetPassword.back")}
              </Link>
            </div>
          </HoverCard>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;