import React, { useState, useEffect, useRef } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { useLang } from "../../context/LanguageContext";
import logo from "../../assets/tlogo2.png";
// --- Design System ---
const colors = { creamLight: "#fcfaf5", creamMid: "#f6efdc", forestGreen: "#0b4335", amber: "#b8860b", red: "#8b2c2c" };
const GREEN = colors.forestGreen; const BG = colors.creamLight; const CARD_BG = colors.creamLight; const BORDER = colors.creamMid; const MUTED = "rgba(11, 67, 53, 0.6)";
const MONO: React.CSSProperties = { fontFamily: "'JetBrains Mono', monospace" };
const SERIF: React.CSSProperties = { fontFamily: "'Hanken Grotesk', sans-serif" };
const SANS: React.CSSProperties = { fontFamily: "'Inter', sans-serif" };

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return isMobile;
}

function Icon({ name, size = 18, style }: { name: string; size?: number; style?: React.CSSProperties }) {
  return <span className="material-symbols-outlined" style={{ fontSize: `${size}px`, lineHeight: 1, userSelect: "none", ...style }}>{name}</span>;
}

function HoverCard({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  const [hov, setHov] = useState(false);
  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ border: `1px solid rgba(11, 67, 53, 0.1)`, boxShadow: hov ? "0px 6px 24px rgba(11, 67, 53, 0.12)" : "0px 4px 20px rgba(11, 67, 53, 0.08)", transform: hov ? "translateY(-2px)" : "translateY(0)", transition: "all 0.3s ease", backgroundColor: CARD_BG, borderRadius: "12px", ...style }}>
      {children}
    </div>
  );
}

function HoverBtn({ children, onClick, type = "button", variant = "outline", disabled = false, style }: any) {
  const [hov, setHov] = useState(false);
  let bg = "transparent", color = GREEN, border = `2px solid ${GREEN}`;
  if (variant === "primary") { bg = GREEN; color = BG; if (hov && !disabled) { bg = BG; color = GREEN; } }
  else { if (hov && !disabled) { bg = GREEN; color = BG; } }
  return (
    <button type={type} onClick={onClick} disabled={disabled} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "6px", padding: "10px 20px", border, borderRadius: "8px", backgroundColor: bg, color, fontSize: "11px", fontWeight: 600, letterSpacing: "0.05em", cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.6 : 1, transition: "all 0.3s", fontFamily: "'Hanken Grotesk', sans-serif", ...style }}>
      {children}
    </button>
  );
}

type ErrorType = "invalid_token" | "expired_token" | "no_token" | "network" | "server" | "unknown";

const VerifyEmail: React.FC = () => {
  const { lang, t } = useLang();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const isMobile = useIsMobile();
  const isRTL = lang === "AR";

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorType, setErrorType] = useState<ErrorType>("unknown");
  const [countdown, setCountdown] = useState(3);
  const hasCalled = useRef(false);

  const [resendEmail, setResendEmail] = useState("");
  const [resendLoading, setResendLoading] = useState(false);
  const [resendDone, setResendDone] = useState(false);
  const [resendError, setResendError] = useState("");

  const detectErrorType = (message: string, httpStatus: number): ErrorType => {
    const msg = message.toLowerCase();
    if (httpStatus >= 500) return "server";
    if (msg.includes("expired")) return "expired_token";
    if (msg.includes("invalid") || msg.includes("not found") || msg.includes("no token")) return "invalid_token";
    return "unknown";
  };

  useEffect(() => {
    if (hasCalled.current) return;
    hasCalled.current = true;
    const verifyToken = async () => {
      if (!token) { setErrorType("no_token"); setStatus("error"); return; }
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/verify-email?token=${token}`, { method: "GET", headers: { "Content-Type": "application/json" } });
        const data = await response.json();
        if (response.ok) {
          setStatus("success");
          let count = 3;
          const timer = setInterval(() => { count -= 1; setCountdown(count); if (count <= 0) { clearInterval(timer); navigate("/login"); } }, 1000);
          return () => clearInterval(timer);
        } else { setErrorType(detectErrorType(data.message || "", response.status)); setStatus("error"); }
      } catch { setErrorType("network"); setStatus("error"); }
    };
    verifyToken();
  }, [token, navigate]);

  const handleResend = async () => {
    setResendError("");
    if (!resendEmail.trim()) { setResendError(t("verifyEmail.resendErrorEmpty")); return; }
    setResendLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/resend-verification`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: resendEmail.trim() }) });
      if (response.ok) setResendDone(true);
      else { const data = await response.json(); setResendError(data.message || t("verifyEmail.resendErrorFailed")); }
    } catch { setResendError(t("verifyEmail.resendErrorFailed")); } finally { setResendLoading(false); }
  };

  const getErrorIcon = (type: string) => {
    if (type === "clock") return "schedule";
    if (type === "wifi") return "signal_wifi_off";
    if (type === "mail") return "mail_off";
    return "error";
  };

  const currentErrorType = errorType;
  const inputStyle: React.CSSProperties = { backgroundColor: "rgba(11, 67, 53, 0.04)", border: `1.5px solid ${BORDER}`, padding: "10px 14px", borderRadius: "8px", fontSize: "13px", color: GREEN, ...SANS, outline: "none", width: "100%", boxSizing: "border-box" };

  return (
    <div dir={isRTL ? "rtl" : "ltr"} style={{ ...SANS, backgroundColor: BG, minHeight: "100vh", color: GREEN, display: "flex", alignItems: "center", justifyContent: "center", padding: isMobile ? "24px 16px" : "40px" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;700&display=swap');@import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap');.material-symbols-outlined{font-variation-settings:'FILL' 0,'wght' 400,'GRAD' 0,'opsz' 24;font-family:'Material Symbols Outlined';display:inline-block;vertical-align:middle;}`}</style>
      
      <div style={{ width: "100%", maxWidth: "440px", display: "flex", flexDirection: "column", gap: "24px" }}>
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

        <HoverCard style={{ padding: isMobile ? "24px 20px" : "32px 28px", textAlign: "center" }}>
          <span style={{ ...MONO, fontSize: "9px", color: colors.amber, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", display: "block", marginBottom: "16px" }}>{t("verifyEmail.category")}</span>

          {status === "loading" && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px", padding: "16px 0" }}>
              <Icon name="autorenew" size={28} style={{ color: colors.amber, animation: "spin 1s linear infinite" }} />
              <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
              <div>
                <p style={{ ...SERIF, fontSize: "18px", color: GREEN, margin: "0 0 8px" }}>{t("verifyEmail.loadingTitle")}</p>
                <p style={{ fontSize: "12px", color: MUTED, margin: 0 }}>{t("verifyEmail.loadingSubtitle")}</p>
              </div>
            </div>
          )}

          {status === "success" && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{ width: "56px", height: "56px", borderRadius: "50%", backgroundColor: "rgba(11, 67, 53, 0.08)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "16px" }}>
                <Icon name="verified" size={32} style={{ color: GREEN }} />
              </div>
              <h2 style={{ ...SERIF, fontSize: "22px", color: GREEN, margin: "0 0 8px" }}>{t("verifyEmail.successTitle")}</h2>
              <p style={{ fontSize: "13px", color: MUTED, margin: "0 0 16px", lineHeight: 1.5 }}>{t("verifyEmail.successSubtitle")}</p>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "11px", color: colors.amber, fontWeight: 600, marginBottom: "20px" }}>
                <Icon name="autorenew" size={14} style={{ animation: "spin 1s linear infinite" }} />
                {t("verifyEmail.successRedirect")} <span style={{ color: GREEN }}>{countdown}</span> {t("verifyEmail.counting")}...
              </div>
              <HoverBtn variant="primary" onClick={() => navigate("/login")} style={{ width: "100%", marginBottom: "12px" }}>{t("verifyEmail.successBack")}</HoverBtn>
              <Link to="/" style={{ fontSize: "11px", color: MUTED, textDecoration: "none" }}>{t("verifyEmail.successHome")}</Link>
            </div>
          )}

          {status === "error" && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{ width: "56px", height: "56px", borderRadius: "50%", backgroundColor: "rgba(139, 44, 44, 0.08)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "16px" }}>
                <Icon name={getErrorIcon(currentErrorType === "expired_token" ? "clock" : currentErrorType === "network" ? "wifi" : currentErrorType === "no_token" || currentErrorType === "invalid_token" ? "mail" : "error")} size={32} style={{ color: colors.red }} />
              </div>
              <h2 style={{ ...SERIF, fontSize: "20px", color: GREEN, margin: "0 0 8px" }}>{t(`verifyEmail.errors.${currentErrorType}.title`)}</h2>
              <p style={{ fontSize: "13px", color: MUTED, margin: "0 0 16px", lineHeight: 1.5 }}>{t(`verifyEmail.errors.${currentErrorType}.subtitle`)}</p>

              {(currentErrorType === "no_token" || currentErrorType === "expired_token") && (
                <div style={{ width: "100%", marginBottom: "16px" }}>
                  {resendDone ? (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", fontSize: "12px", color: GREEN, backgroundColor: "rgba(11, 67, 53, 0.05)", padding: "10px", borderRadius: "8px" }}>
                      <Icon name="check" size={16} /> {t("verifyEmail.resendSent")}
                    </div>
                  ) : (
                    <>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <input type="email" value={resendEmail} onChange={(e) => { setResendEmail(e.target.value); setResendError(""); }} placeholder={t("verifyEmail.resendPlaceholder")} style={inputStyle} />
                        <HoverBtn variant="primary" onClick={handleResend} disabled={resendLoading} style={{ padding: "10px 14px", flexShrink: 0 }}>
                          {resendLoading ? <Icon name="autorenew" size={16} style={{ animation: "spin 1s linear infinite" }} /> : <Icon name="send" size={16} />}
                        </HoverBtn>
                      </div>
                      {resendError && <p style={{ fontSize: "11px", color: colors.red, marginTop: "6px", textAlign: isRTL ? "right" : "left" }}>{resendError}</p>}
                    </>
                  )}
                </div>
              )}

              <div style={{ display: "flex", flexDirection: "column", gap: "12px", width: "100%", borderTop: `1px solid ${BORDER}`, paddingTop: "16px" }}>
                {currentErrorType === "network" || currentErrorType === "server" ? (
                  <HoverBtn variant="primary" onClick={() => { hasCalled.current = false; window.location.reload(); }} style={{ width: "100%" }}>
                    <Icon name="refresh" size={14} /> {t(`verifyEmail.errors.${currentErrorType}.tryAgain`)}
                  </HoverBtn>
                ) : currentErrorType === "invalid_token" ? (
                  <>
                    <HoverBtn variant="primary" onClick={() => navigate("/")} style={{ width: "100%" }}>{t(`verifyEmail.errors.${currentErrorType}.backHome`)}</HoverBtn>
                    <Link to="/register" style={{ fontSize: "11px", color: MUTED, textDecoration: "none" }}>{t(`verifyEmail.errors.${currentErrorType}.register`)}</Link>
                  </>
                ) : (
                  <HoverBtn variant="outline" onClick={() => navigate("/")} style={{ width: "100%" }}>{t(`verifyEmail.errors.${currentErrorType}.backHome`)}</HoverBtn>
                )}
              </div>
            </div>
          )}
        </HoverCard>
      </div>
    </div>
  );
};

export default VerifyEmail;