import React, { useState, useEffect } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useLang } from "../../context/LanguageContext";
import logo from "../../assets/logo.png";
// --- Design System ---
const colors = { creamLight: "#fcfaf5", creamMid: "#f6efdc", forestGreen: "#0b4335", amber: "#b8860b", red: "#8b2c2c" };
const GREEN = colors.forestGreen; const GOLD = colors.amber; const BG = colors.creamLight; const CARD_BG = colors.creamLight; const BORDER = colors.creamMid; const MUTED = "rgba(11, 67, 53, 0.6)"; const RED = colors.red;
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
      style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "6px", padding: "12px 24px", border, borderRadius: "8px", backgroundColor: bg, color, fontSize: "11px", fontWeight: 600, letterSpacing: "0.05em", cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.6 : 1, transition: "all 0.3s", fontFamily: "'Hanken Grotesk', sans-serif", width: "100%", ...style }}>
      {children}
    </button>
  );
}

const VerifyEmailPending: React.FC = () => {
  const { lang, t } = useLang();
  const { user, checkUserStatus } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isMobile = useIsMobile();
  const isRTL = lang === "AR";

  const [loading, setLoading] = useState(false);
  const [resent, setResent] = useState(false);
  const [checking, setChecking] = useState(true);
  const [isVerified, setIsVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const email = (searchParams.get("email") || user?.email || "").toLowerCase();

  useEffect(() => {
    const initialCheck = async () => { setChecking(true); await checkUserStatus(); setChecking(false); };
    initialCheck();
  }, []);

  useEffect(() => {
    const pollInterval = setInterval(async () => { await checkUserStatus(); }, 3000);
    const handleStorageChange = (e: StorageEvent) => { if (e.key === "auth_event") checkUserStatus(); };
    window.addEventListener("storage", handleStorageChange);
    return () => { clearInterval(pollInterval); window.removeEventListener("storage", handleStorageChange); };
  }, []);

  useEffect(() => { if (user && (user as any).isVerified) setIsVerified(true); }, [user]);

  const handleResend = async () => {
    if (loading || resent) return;
    setLoading(true); setError(null);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/resend-verification`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
      const data = await response.json();
      if (response.ok) setResent(true);
      else {
        if (response.status === 400 && (data.message === "Email is already verified" || data.message === "User is already verified")) setIsVerified(true);
        else setError(data.message || t("verifyEmailPending.errorMessage"));
      }
    } catch { setError(t("verifyEmailPending.errorMessage")); } finally { setLoading(false); }
  };

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
          <span style={{ ...MONO, fontSize: "9px", color: GOLD, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", display: "block", marginBottom: "16px" }}>{t("verifyEmailPending.category")}</span>

          {checking ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px", padding: "16px 0" }}>
              <Icon name="autorenew" size={24} style={{ color: GOLD, animation: "spin 1s linear infinite" }} />
              <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
              <p style={{ fontSize: "12px", color: MUTED }}>{t("verifyEmailPending.checking")}</p>
            </div>
          ) : isVerified ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{ width: "56px", height: "56px", borderRadius: "50%", backgroundColor: "rgba(11, 67, 53, 0.08)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "16px" }}>
                <Icon name="verified" size={32} style={{ color: GREEN }} />
              </div>
              <h2 style={{ ...SERIF, fontSize: "22px", color: GREEN, margin: "0 0 8px" }}>{t("verifyEmailPending.alreadyVerifiedTitle")}</h2>
              <p style={{ fontSize: "13px", color: MUTED, margin: "0 0 8px", lineHeight: 1.5 }}>{t("verifyEmailPending.alreadyVerifiedSub")}</p>
              {email && <p style={{ fontSize: "12px", color: GREEN, fontWeight: 600, margin: "0 0 20px", wordBreak: "break-all" }}>{email}</p>}
              <div style={{ display: "flex", flexDirection: "column", gap: "12px", width: "100%", borderTop: `1px solid ${BORDER}`, paddingTop: "16px" }}>
                <HoverBtn variant="outline" onClick={() => (window.history.length > 1 ? window.history.back() : navigate("/"))} style={{ width: "100%" }}>
                  <Icon name={isRTL ? "arrow_forward" : "arrow_back"} size={14} /> {t("verifyEmailPending.alreadyVerifiedBack")}
                </HoverBtn>
                <Link to="/" style={{ fontSize: "11px", color: MUTED, textDecoration: "none" }}>{t("verifyEmailPending.alreadyVerifiedHome")}</Link>
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{ width: "48px", height: "48px", borderRadius: "8px", backgroundColor: "rgba(11, 67, 53, 0.05)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "16px" }}>
                <Icon name="mail" size={24} style={{ color: GREEN }} />
              </div>
              <h2 style={{ ...SERIF, fontSize: "22px", color: GREEN, margin: "0 0 8px" }}>{t("verifyEmailPending.title")}</h2>
              <div style={{ marginBottom: "20px", width: "100%" }}>
                <p style={{ fontSize: "13px", color: MUTED, margin: "0 0 8px", lineHeight: 1.5 }}>{t("verifyEmailPending.subtitle")}</p>
                {email && <p style={{ fontSize: "12px", color: GREEN, fontWeight: 600, margin: 0, wordBreak: "break-all" }}>{email}</p>}
              </div>

              {error && (
                <div style={{ display: "flex", alignItems: "center", gap: "8px", color: RED, backgroundColor: "rgba(139, 44, 44, 0.05)", padding: "10px", borderRadius: "8px", width: "100%", justifyContent: "center", marginBottom: "16px" }}>
                  <Icon name="error" size={14} />
                  <span style={{ fontSize: "12px", fontWeight: 600 }}>{error}</span>
                </div>
              )}

              <HoverBtn variant="primary" onClick={() => window.open("https://mail.google.com/mail/u/0/#search/OULAMAUNA", "_blank")} style={{ marginBottom: "16px" }}>
                {t("verifyEmailPending.cta")} <Icon name="open_in_new" size={14} />
              </HoverBtn>

              <div style={{ display: "flex", flexDirection: "column", gap: "12px", width: "100%", borderTop: `1px solid ${BORDER}`, paddingTop: "16px" }}>
                <button onClick={handleResend} disabled={loading || resent} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", background: "none", border: "none", fontSize: "11px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: resent ? GREEN : GOLD, cursor: "pointer", fontFamily: "'Hanken Grotesk', sans-serif" }}>
                  {loading ? <Icon name="autorenew" size={14} style={{ animation: "spin 1s linear infinite" }} /> : resent ? <Icon name="check" size={14} /> : <Icon name="refresh" size={14} />}
                  <span>{loading ? "..." : resent ? t("verifyEmailPending.resentSuccess") : t("verifyEmailPending.resend")}</span>
                </button>
                <Link to="/login" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", fontSize: "11px", color: MUTED, textDecoration: "none", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 600 }}>
                  <Icon name="login" size={14} /> {t("verifyEmailPending.backToLogin")}
                </Link>
              </div>
            </div>
          )}
        </HoverCard>
      </div>
    </div>
  );
};

export default VerifyEmailPending;