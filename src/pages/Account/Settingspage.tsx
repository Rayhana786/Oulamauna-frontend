// src/pages/Authentication/SettingsPage.tsx

import React, { useState, useRef, useEffect } from "react";
import { useLang } from "../../context/LanguageContext";
import { useAuth } from "../../context/AuthContext";
import ProfileSidebar from "../../components/ProfileSidebar";

/* ─────────────────────────────────────────────
   Oulamauna — Settings
   Personal preferences, privacy, security, account.
   Styled with Dashboard.tsx / Profile.tsx / EditProfile.tsx palette
   Does NOT duplicate Edit Profile / Notifications / Dashboard.
───────────────────────────────────────────── */

// ─ FORUM.TSX / DASHBOARD.TSX COLOR PALETTE ─
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

/* ── RESPONSIVE: shared mobile-detection hook (same pattern as Dashboard / Profile) ───── */
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => (typeof window !== "undefined" ? window.innerWidth < 768 : false));
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return isMobile;
}

/* ── Primitives ─────────────────────────────────────────── */

function Icon({ name, size = 18 }: { name: string; size?: number }) {
  return (
    <span className="material-symbols-outlined" style={{ fontSize: `${size}px`, lineHeight: 1, userSelect: "none" }}>
      {name}
    </span>
  );
}

function HoverCard({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
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

function SavedBadge({ show }: { show: boolean }) {
  return (
    <span style={{
      ...MONO, fontSize: "9px", fontWeight: 700, letterSpacing: "0.06em", color: GREEN,
      opacity: show ? 1 : 0, transition: "opacity 0.4s", display: "inline-flex", alignItems: "center", gap: "4px",
    }}>
      <Icon name="check_circle" size={12} /> SAVED
    </span>
  );
}

function SectionHeader({ icon, title, saved, accent, isMobile }: { icon: string; title: string; saved?: boolean; accent?: string; isMobile: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: isMobile ? "16px 18px 14px" : "20px 24px 16px", borderBottom: `1.5px solid ${BORDER}` }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        {accent && <span style={{ width: "4px", height: "18px", borderRadius: "2px", backgroundColor: accent }} />}
        <Icon name={icon} size={18} />
        <h2 style={{ ...SERIF, fontSize: isMobile ? "15px" : "16px", fontWeight: 700, color: GREEN, margin: 0 }}>{title}</h2>
      </div>
      {saved !== undefined && <SavedBadge show={saved} />}
    </div>
  );
}

function Row({ label, desc, control, isRTL, isMobile }: { label: string; desc?: string; control: React.ReactNode; isRTL: boolean; isMobile: boolean }) {
  return (
    <div style={{
      display: "flex",
      alignItems: isMobile ? "flex-start" : "center",
      justifyContent: "space-between",
      gap: isMobile ? "10px" : "16px",
      padding: isMobile ? "14px 18px" : "16px 24px",
      borderBottom: `1px solid rgba(11, 67, 53, 0.06)`,
      flexWrap: isMobile ? "nowrap" : "wrap",
      flexDirection: isMobile ? "column" : "row",
    }}>
      <div style={{ minWidth: isMobile ? "auto" : "200px" }}>
        <p style={{ ...SANS, fontSize: isMobile ? "13px" : "13.5px", color: GREEN, margin: 0, fontWeight: 600 }}>{label}</p>
        {desc && <p style={{ ...SANS, fontSize: "12px", color: MUTED, margin: "3px 0 0" }}>{desc}</p>}
      </div>
      <div style={{
        marginInlineStart: isMobile ? 0 : (isRTL ? 0 : "auto"),
        marginInlineEnd: isMobile ? 0 : (isRTL ? "auto" : 0),
        width: isMobile ? "100%" : "auto",
      }}>{control}</div>
    </div>
  );
}

function Toggle({ checked, onChange, isRTL }: { checked: boolean; onChange: (v: boolean) => void; isRTL: boolean }) {
  const onX = isRTL ? "3px" : "21px";
  const offX = isRTL ? "21px" : "3px";
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      style={{
        width: "40px", height: "22px", borderRadius: "12px", border: "none", position: "relative",
        backgroundColor: checked ? GREEN : "rgba(11, 67, 53, 0.15)", cursor: "pointer", transition: "background 0.2s", flexShrink: 0,
      }}
    >
      <span style={{
        position: "absolute", top: "3px", insetInlineStart: checked ? onX : offX,
        width: "16px", height: "16px", borderRadius: "50%", backgroundColor: BG,
        transition: "inset-inline-start 0.2s", boxShadow: "0 1px 2px rgba(0,0,0,0.2)",
      }} />
    </button>
  );
}

function Select({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="op-select"
      style={{
        ...MONO, fontSize: "11px", fontWeight: 700, letterSpacing: "0.04em", color: GREEN,
        border: `1.5px solid ${BORDER}`, borderRadius: "6px", padding: "7px 12px",
        backgroundColor: "rgba(11, 67, 53, 0.04)", cursor: "pointer", outline: "none",
        width: "100%", boxSizing: "border-box",
      }}
    >
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

function RadioGroup({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
      {options.map((o) => (
        <label key={o.value} style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", ...SANS, fontSize: "12.5px", color: GREEN }}>
          <input type="radio" name="radiogroup" checked={value === o.value} onChange={() => onChange(o.value)} style={{ accentColor: GREEN, width: "14px", height: "14px", cursor: "pointer" }} />
          {o.label}
        </label>
      ))}
    </div>
  );
}

/* ── Shared button, same hover pattern as Dashboard/Profile HoverBtn ───── */
function HoverBtn({
  children,
  onClick,
  variant = "outline",
  danger = false,
  disabled = false,
  style,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "outline" | "primary";
  danger?: boolean;
  disabled?: boolean;
  style?: React.CSSProperties;
}) {
  const [hov, setHov] = useState(false);
  const baseColor = danger ? RED : GREEN;

  let bg = "transparent";
  let color = baseColor;
  let border = `2px solid ${baseColor}`;

  if (variant === "primary") {
    bg = disabled ? "rgba(11, 67, 53, 0.25)" : baseColor;
    color = BG;
    if (hov && !disabled) { bg = BG; color = baseColor; }
  } else {
    if (hov && !disabled) { bg = baseColor; color = BG; }
  }

  return (
    <button
      onClick={disabled ? undefined : onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      disabled={disabled}
      style={{
        display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "6px",
        padding: "8px 16px", border, borderRadius: "8px", backgroundColor: bg, color,
        ...MONO, fontSize: "11px", fontWeight: 700, letterSpacing: "0.05em",
        cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.7 : 1,
        transition: "all 0.3s",
        ...style,
      }}
    >
      {children}
    </button>
  );
}

/* ── Modal shell ────────────────────────────────────────── */
function Modal({ open, onClose, children, width = "420px" }: { open: boolean; onClose: () => void; children: React.ReactNode; width?: string }) {
  if (!open) return null;
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, backgroundColor: "rgba(11, 67, 53, 0.6)",
        backdropFilter: "blur(4px)",
        display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: "20px",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: BG, borderRadius: "14px", width, maxWidth: "100%", padding: "26px",
          boxShadow: "0 25px 80px rgba(0,0,0,0.15)", border: `1px solid ${BORDER}`,
        }}
      >
        {children}
      </div>
    </div>
  );
}

/* ── Change Password Modal ─────────────────────────────── */
function ChangePasswordModal({ open, onClose, t }: { open: boolean; onClose: () => void; t: (k: string) => string }) {
  const [form, setForm] = useState({ current: "", next: "", confirm: "" });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => { if (open) { setForm({ current: "", next: "", confirm: "" }); setError(""); setDone(false); } }, [open]);

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "10px 12px", borderRadius: "8px", border: `1.5px solid ${BORDER}`,
    fontSize: "13px", marginTop: "4px", ...SANS, color: GREEN, boxSizing: "border-box",
    backgroundColor: "rgba(11, 67, 53, 0.04)", outline: "none",
  };

  const submit = () => {
    if (!form.current) return setError(t("settings.security.pwErrorCurrent"));
    if (form.next.length < 8) return setError(t("settings.security.pwErrorLength"));
    if (form.next !== form.confirm) return setError(t("settings.security.pwErrorMatch"));
    setError("");
    setSaving(true);
    // TODO: replace with real API call once backend endpoint exists
    setTimeout(() => { setSaving(false); setDone(true); setTimeout(onClose, 1100); }, 700);
  };

  return (
    <Modal open={open} onClose={onClose}>
      <h3 style={{ ...SERIF, fontSize: "17px", fontWeight: 700, color: GREEN, margin: "0 0 16px" }}>{t("settings.security.changePassword")}</h3>
      {done ? (
        <p style={{ ...SANS, fontSize: "13px", color: GREEN, display: "flex", alignItems: "center", gap: "6px" }}>
          <Icon name="check_circle" size={16} /> {t("settings.security.pwSuccess")}
        </p>
      ) : (
        <>
          <label style={{ fontSize: "11px", ...MONO, color: MUTED, display: "block" }}>{t("settings.security.pwCurrent")}
            <input type="password" style={inputStyle} value={form.current} onChange={(e) => setForm({ ...form, current: e.target.value })} />
          </label>
          <label style={{ fontSize: "11px", ...MONO, color: MUTED, display: "block", marginTop: "12px" }}>{t("settings.security.pwNew")}
            <input type="password" style={inputStyle} value={form.next} onChange={(e) => setForm({ ...form, next: e.target.value })} />
          </label>
          <label style={{ fontSize: "11px", ...MONO, color: MUTED, display: "block", marginTop: "12px" }}>{t("settings.security.pwConfirm")}
            <input type="password" style={inputStyle} value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} />
          </label>
          {error && <p style={{ ...SANS, color: RED, fontSize: "12px", marginTop: "10px" }}>{error}</p>}
          <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "20px" }}>
            <HoverBtn onClick={onClose}>{t("settings.common.cancel")}</HoverBtn>
            <HoverBtn variant="primary" onClick={submit} disabled={saving}>{saving ? t("settings.common.saving") : t("settings.common.save")}</HoverBtn>
          </div>
        </>
      )}
    </Modal>
  );
}

/* ── Confirm dialog (deactivate) ───────────────────────── */
function ConfirmModal({ open, onClose, onConfirm, title, message, confirmLabel, danger = false }: {
  open: boolean; onClose: () => void; onConfirm: () => void; title: string; message: string; confirmLabel: string; danger?: boolean;
}) {
  return (
    <Modal open={open} onClose={onClose}>
      <h3 style={{ ...SERIF, fontSize: "17px", fontWeight: 700, color: danger ? RED : GREEN, margin: "0 0 10px" }}>{title}</h3>
      <p style={{ ...SANS, fontSize: "13px", color: MUTED, lineHeight: 1.6, margin: "0 0 20px" }}>{message}</p>
      <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
        <HoverBtn onClick={onClose}>Cancel</HoverBtn>
        <HoverBtn variant="primary" danger={danger} onClick={onConfirm}>{confirmLabel}</HoverBtn>
      </div>
    </Modal>
  );
}

/* ── Delete account (typed confirmation) ───────────────── */
function DeleteAccountModal({ open, onClose, t }: { open: boolean; onClose: () => void; t: (k: string) => string }) {
  const [typed, setTyped] = useState("");
  useEffect(() => { if (open) setTyped(""); }, [open]);
  const ready = typed.trim().toUpperCase() === "DELETE";

  return (
    <Modal open={open} onClose={onClose}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
        <Icon name="warning" size={18} />
        <h3 style={{ ...SERIF, fontSize: "17px", fontWeight: 700, color: RED, margin: 0 }}>{t("settings.account.deleteTitle")}</h3>
      </div>
      <p style={{ ...SANS, fontSize: "13px", color: MUTED, lineHeight: 1.6, margin: "0 0 16px" }}>{t("settings.account.deleteWarning")}</p>
      <label style={{ fontSize: "11px", ...MONO, color: MUTED, display: "block" }}>
        {t("settings.account.deleteTypeConfirm")}
        <input
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          placeholder="DELETE"
          style={{
            width: "100%", padding: "10px 12px", borderRadius: "8px", border: `1.5px solid ${BORDER}`,
            fontSize: "13px", marginTop: "6px", boxSizing: "border-box", ...SANS, color: GREEN,
            backgroundColor: "rgba(11, 67, 53, 0.04)", outline: "none",
          }}
        />
      </label>
      <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "20px" }}>
        <HoverBtn onClick={onClose}>{t("settings.common.cancel")}</HoverBtn>
        <HoverBtn variant="primary" danger disabled={!ready} onClick={() => { /* TODO: real delete API call */ onClose(); }}>
          {t("settings.account.deleteConfirm")}
        </HoverBtn>
      </div>
    </Modal>
  );
}

/* ─────────────────────────────────────────────
   MAIN
───────────────────────────────────────────── */
export default function SettingsPage() {
  const { lang, t, setLang } = useLang() as any; // expects setLang / changeLanguage on the real context — see note below
  const { user } = useAuth();
  const isRTL = lang === "AR";
  const isMobile = useIsMobile();

  // Same test override pattern used on the Dashboard, for previewing the contributor-only block.
  const forceContributor = new URLSearchParams(window.location.search).get("asContributor");
  const isContributor: boolean =
    forceContributor !== null
      ? forceContributor === "true"
      : !!(user as any)?.allowed_to_contribute || (user as any)?.role === "contributor";

  const [prefs, setPrefs] = useState({
    emailNotif: true,
    commentReply: true,
    discussion: true,
    system: true,
    contribApproved: true,
    contribRejected: true,
    contribChanges: true,
    contribTranslation: true,
    contribStatus: true,
    profileVisibility: "public",
    showEmail: false,
    showActivity: true,
    showContributions: true,
  });

  const [savedSection, setSavedSection] = useState<string | null>(null);
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const markSaved = (section: string) => {
    setSavedSection(section);
    if (savedTimer.current) clearTimeout(savedTimer.current);
    savedTimer.current = setTimeout(() => setSavedSection(null), 1800);
  };

  const set = (section: string, patch: Partial<typeof prefs>) => {
    setPrefs((p) => ({ ...p, ...patch }));
    markSaved(section);
    // TODO: fire real API call here (debounced), scoped to the authenticated user's ID server-side
  };

  const [pwModalOpen, setPwModalOpen] = useState(false);
  const [deactivateOpen, setDeactivateOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  // Mock verification state — replace with real user.emailVerified once available
  const [emailVerified] = useState(false);
  const [resendState, setResendState] = useState<"idle" | "sent">("idle");
  const resend = () => { setResendState("sent"); setTimeout(() => setResendState("idle"), 2500); /* TODO: real resend call */ };

  const langOptions = [
    { value: "EN", label: "English" },
    { value: "AR", label: "العربية" },
    { value: "FR", label: "Français" },
  ];

  const handleLangChange = (v: string) => {
    // NOTE: if your real LanguageContext uses a different setter name
    // (e.g. changeLanguage instead of setLang), rename it in the destructure above.
    if (typeof setLang === "function") {
      setLang(v);
    } else {
      console.warn("LanguageContext has no setLang — rename to match your real setter.");
    }
    markSaved("language");
  };

  return (
    <div
      dir={isRTL ? "rtl" : "ltr"}
      style={{
        ...SANS,
        backgroundColor: BG,
        backgroundImage: "radial-gradient(circle at 50% 0%, rgba(184, 134, 11, 0.06) 0%, transparent 60%)",
        minHeight: "100vh",
        color: GREEN,
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;700&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap');
        .material-symbols-outlined { font-variation-settings: 'FILL' 0,'wght' 400,'GRAD' 0,'opsz' 24; font-family: 'Material Symbols Outlined'; display: inline-block; vertical-align: middle; }
        .op-select:focus { border-color: ${GREEN} !important; box-shadow: inset 0 0 0 1px rgba(11,67,53,0.12); }
      `}</style>

      {/* Extra top/bottom breathing room under the navbar and above the footer,
          same pattern as Dashboard / Profile / Edit Profile */}
      <div style={{
        maxWidth: "1000px", margin: "0 auto",
        padding: isMobile ? "32px 16px 48px" : "64px 32px 80px",
        display: "flex", flexDirection: isMobile ? "column" : "row",
        gap: isMobile ? "16px" : "32px",
      }}>
        {!isMobile && <ProfileSidebar role={isContributor ? "contributor" : "user"} active="settings" />}

        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: isMobile ? "14px" : "20px" }}>
          <div>
            {isMobile && (
              <p style={{ ...MONO, fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.08em", opacity: 0.7, margin: "0 0 6px" }}>SETTINGS</p>
            )}
            <h1 style={{ ...SERIF, fontSize: isMobile ? "20px" : "24px", fontWeight: 700, color: GREEN, margin: "0 0 4px" }}>{t("settings.title")}</h1>
            <p style={{ ...SANS, fontSize: isMobile ? "12px" : "13px", color: MUTED, margin: 0 }}>{t("settings.subtitle")}</p>
          </div>

          {/* ── Language & Interface ─────────────────────── */}
          <HoverCard>
            <SectionHeader icon="translate" title={t("settings.language.title")} saved={savedSection === "language"} isMobile={isMobile} />
            <Row isRTL={isRTL} isMobile={isMobile} label={t("settings.language.language")} control={
              <Select value={lang ?? "EN"} onChange={handleLangChange} options={langOptions} />
            } />
            {/* Appearance / dark mode intentionally omitted — not implemented yet.
                Add back here once real theme support exists:
                <Row label="Appearance" control={<Select ... options={[System, Light, Dark]} />} /> */}
          </HoverCard>

          {/* ── Notification Preferences ─────────────────── */}
          <HoverCard>
            <SectionHeader icon="notifications_active" title={t("settings.notif.title")} saved={savedSection === "notif"} isMobile={isMobile} />
            <Row isRTL={isRTL} isMobile={isMobile} label={t("settings.notif.email")} desc={t("settings.notif.emailDesc")} control={
              <Toggle isRTL={isRTL} checked={prefs.emailNotif} onChange={(v) => set("notif", { emailNotif: v })} />
            } />
            <Row isRTL={isRTL} isMobile={isMobile} label={t("settings.notif.commentReply")} desc={t("settings.notif.commentReplyDesc")} control={
              <Toggle isRTL={isRTL} checked={prefs.commentReply} onChange={(v) => set("notif", { commentReply: v })} />
            } />
            <Row isRTL={isRTL} isMobile={isMobile} label={t("settings.notif.discussion")} desc={t("settings.notif.discussionDesc")} control={
              <Toggle isRTL={isRTL} checked={prefs.discussion} onChange={(v) => set("notif", { discussion: v })} />
            } />
            <Row isRTL={isRTL} isMobile={isMobile} label={t("settings.notif.system")} desc={t("settings.notif.systemDesc")} control={
              <Toggle isRTL={isRTL} checked={prefs.system} onChange={(v) => set("notif", { system: v })} />
            } />

            {isContributor && (
              <div style={{ backgroundColor: "rgba(11, 67, 53, 0.03)" }}>
                <div style={{ padding: isMobile ? "12px 18px 6px" : "14px 24px 6px", display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ width: "3px", height: "14px", borderRadius: "2px", backgroundColor: GOLD }} />
                  <p style={{ ...MONO, fontSize: "10px", fontWeight: 700, letterSpacing: "0.08em", color: GREEN, margin: 0 }}>
                    {t("settings.notif.contributorTitle")}
                  </p>
                </div>
                <Row isRTL={isRTL} isMobile={isMobile} label={t("settings.notif.contribApproved")} control={<Toggle isRTL={isRTL} checked={prefs.contribApproved} onChange={(v) => set("notif", { contribApproved: v })} />} />
                <Row isRTL={isRTL} isMobile={isMobile} label={t("settings.notif.contribRejected")} control={<Toggle isRTL={isRTL} checked={prefs.contribRejected} onChange={(v) => set("notif", { contribRejected: v })} />} />
                <Row isRTL={isRTL} isMobile={isMobile} label={t("settings.notif.contribChanges")} control={<Toggle isRTL={isRTL} checked={prefs.contribChanges} onChange={(v) => set("notif", { contribChanges: v })} />} />
                <Row isRTL={isRTL} isMobile={isMobile} label={t("settings.notif.contribTranslation")} control={<Toggle isRTL={isRTL} checked={prefs.contribTranslation} onChange={(v) => set("notif", { contribTranslation: v })} />} />
                <Row isRTL={isRTL} isMobile={isMobile} label={t("settings.notif.contribStatus")} control={<Toggle isRTL={isRTL} checked={prefs.contribStatus} onChange={(v) => set("notif", { contribStatus: v })} />} />
              </div>
            )}
          </HoverCard>

          {/* ── Privacy ───────────────────────────────────── */}
          <HoverCard>
            <SectionHeader icon="shield" title={t("settings.privacy.title")} saved={savedSection === "privacy"} isMobile={isMobile} />
            <Row isRTL={isRTL} isMobile={isMobile} label={t("settings.privacy.visibility")} control={
              <RadioGroup
                value={prefs.profileVisibility}
                onChange={(v) => set("privacy", { profileVisibility: v })}
                options={[
                  { value: "public", label: t("settings.privacy.visibilityPublic") },
                  { value: "registered", label: t("settings.privacy.visibilityRegistered") },
                ]}
              />
            } />
            <Row isRTL={isRTL} isMobile={isMobile} label={t("settings.privacy.showEmail")} desc={t("settings.privacy.showEmailDesc")} control={
              <Toggle isRTL={isRTL} checked={prefs.showEmail} onChange={(v) => set("privacy", { showEmail: v })} />
            } />
            <Row isRTL={isRTL} isMobile={isMobile} label={t("settings.privacy.showActivity")} control={
              <Toggle isRTL={isRTL} checked={prefs.showActivity} onChange={(v) => set("privacy", { showActivity: v })} />
            } />
            <Row isRTL={isRTL} isMobile={isMobile} label={t("settings.privacy.showContributions")} desc={isContributor ? t("settings.privacy.showContributionsDesc") : undefined} control={
              <Toggle isRTL={isRTL} checked={prefs.showContributions} onChange={(v) => set("privacy", { showContributions: v })} />
            } />
            <p style={{ ...SANS, fontSize: "11px", color: MUTED, fontStyle: "italic", margin: 0, padding: isMobile ? "12px 18px 16px" : "12px 24px 18px" }}>
              {t("settings.privacy.adminNote")}
            </p>
          </HoverCard>

          {/* ── Security ──────────────────────────────────── */}
          <HoverCard>
            <SectionHeader icon="lock" title={t("settings.security.title")} isMobile={isMobile} />
            <Row isRTL={isRTL} isMobile={isMobile} label={t("settings.security.password")} control={
              <HoverBtn onClick={() => setPwModalOpen(true)} style={isMobile ? { width: "100%" } : undefined}>{t("settings.security.changePassword")}</HoverBtn>
            } />
            <div style={{ padding: isMobile ? "14px 18px" : "16px 24px", borderBottom: `1px solid rgba(11, 67, 53, 0.06)` }}>
              <p style={{ ...SANS, fontSize: "13.5px", fontWeight: 600, color: GREEN, margin: "0 0 4px" }}>{t("settings.security.emailVerification")}</p>
              <p style={{ ...MONO, fontSize: "11px", color: MUTED, margin: "0 0 8px" }}>{(user as any)?.email ?? "—"}</p>
              {emailVerified ? (
                <span style={{ ...MONO, fontSize: "10px", fontWeight: 700, color: GREEN, display: "inline-flex", alignItems: "center", gap: "4px" }}>
                  <Icon name="verified" size={13} /> {t("settings.security.verified")}
                </span>
              ) : (
                <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                  <span style={{ ...MONO, fontSize: "10px", fontWeight: 700, color: GOLD }}>{t("settings.security.notVerified")}</span>
                  <HoverBtn onClick={resend} style={{ padding: "5px 12px" }}>
                    {resendState === "sent" ? t("settings.security.resendSent") : t("settings.security.resend")}
                  </HoverBtn>
                </div>
              )}
            </div>
            {/* "Log out other sessions" intentionally omitted — no session management yet.
                Add back once implemented:
                <Row label="Log out of all other sessions" control={<HoverBtn>...</HoverBtn>} /> */}
          </HoverCard>

          {/* ── Account (visually separated, danger zone) ──── */}
          <HoverCard style={{ border: `1.5px solid rgba(139, 44, 44, 0.25)` }}>
            <SectionHeader icon="warning" title={t("settings.account.title")} accent={RED} isMobile={isMobile} />
            <Row isRTL={isRTL} isMobile={isMobile} label={t("settings.account.deactivate")} desc={t("settings.account.deactivateDesc")} control={
              <HoverBtn onClick={() => setDeactivateOpen(true)} style={isMobile ? { width: "100%" } : undefined}>{t("settings.account.deactivate")}</HoverBtn>
            } />
            <div style={{
              padding: isMobile ? "14px 18px" : "16px 24px",
              display: "flex", alignItems: isMobile ? "flex-start" : "center", justifyContent: "space-between",
              flexWrap: "wrap", gap: "12px", flexDirection: isMobile ? "column" : "row",
            }}>
              <div style={{ minWidth: isMobile ? "auto" : "200px" }}>
                <p style={{ ...SANS, fontSize: "13.5px", color: RED, margin: 0, fontWeight: 600 }}>{t("settings.account.deleteTitle")}</p>
                <p style={{ ...SANS, fontSize: "12px", color: MUTED, margin: "3px 0 0" }}>{t("settings.account.deleteDesc")}</p>
              </div>
              {/* Deliberately not a bold/filled button — spec says don't make delete visually dominant */}
              <button
                onClick={() => setDeleteOpen(true)}
                style={{ ...MONO, fontSize: "10px", fontWeight: 700, letterSpacing: "0.06em", color: RED, background: "none", border: "none", textDecoration: "underline", cursor: "pointer", padding: 0 }}
              >
                {t("settings.account.deleteTitle")}
              </button>
            </div>
          </HoverCard>
        </div>
      </div>

      <ChangePasswordModal open={pwModalOpen} onClose={() => setPwModalOpen(false)} t={t} />
      <ConfirmModal
        open={deactivateOpen}
        onClose={() => setDeactivateOpen(false)}
        onConfirm={() => { /* TODO: real deactivate API call */ setDeactivateOpen(false); }}
        title={t("settings.account.deactivateTitle")}
        message={t("settings.account.deactivateWarning")}
        confirmLabel={t("settings.account.deactivateConfirm")}
      />
      <DeleteAccountModal open={deleteOpen} onClose={() => setDeleteOpen(false)} t={t} />
    </div>
  );
}