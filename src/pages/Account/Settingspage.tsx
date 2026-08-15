// src/pages/Authentication/SettingsPage.tsx

import React, { useState, useRef, useEffect } from "react";
import { useLang } from "../../context/LanguageContext";
import { useAuth } from "../../context/AuthContext";
import ProfileSidebar from "../../components/ProfileSidebar";

/* ─────────────────────────────────────────────
   Oulamauna — Settings
   Personal preferences, privacy, security, account.
   Does NOT duplicate Edit Profile / Notifications / Dashboard.
───────────────────────────────────────────── */

const MONO: React.CSSProperties = { fontFamily: "'JetBrains Mono', monospace" };
const SERIF: React.CSSProperties = { fontFamily: "'Source Serif 4', serif" };
const SANS: React.CSSProperties = { fontFamily: "'Source Sans 3', sans-serif" };

const GREEN = "#0B4335";        // dark green (primary)
const GREEN_HOVER = "#285B4B";  // deep green (hover / accent)
const SOFT_GREEN = "#7DA89B";
const GOLD = "#C9A84C";
const BORDER = "rgba(192,201,195,0.4)";
const MUTED = "#707974";
const RED = "#b3261e";

/* ── Primitives ─────────────────────────────────────────── */

function Icon({ name, size = 18 }: { name: string; size?: number }) {
  return (
    <span className="material-symbols-outlined" style={{ fontSize: `${size}px`, lineHeight: 1, userSelect: "none" }}>
      {name}
    </span>
  );
}

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ border: `1.5px solid ${BORDER}`, borderRadius: "14px", backgroundColor: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.04)", ...style }}>
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

function SectionHeader({ icon, title, saved, accent }: { icon: string; title: string; saved?: boolean; accent?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px 16px", borderBottom: `1.5px solid ${BORDER}` }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        {accent && <span style={{ width: "4px", height: "18px", borderRadius: "2px", backgroundColor: accent }} />}
        <Icon name={icon} size={18} />
        <h2 style={{ ...SERIF, fontSize: "16px", fontWeight: 700, color: GREEN, margin: 0 }}>{title}</h2>
      </div>
      {saved !== undefined && <SavedBadge show={saved} />}
    </div>
  );
}

function Row({ label, desc, control, isRTL }: { label: string; desc?: string; control: React.ReactNode; isRTL: boolean }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px",
      padding: "16px 24px", borderBottom: "1px solid #f0f1ee", flexWrap: "wrap",
    }}>
      <div style={{ minWidth: "200px" }}>
        <p style={{ fontSize: "13.5px", color: "#191c1b", margin: 0, fontWeight: 600 }}>{label}</p>
        {desc && <p style={{ fontSize: "12px", color: MUTED, margin: "3px 0 0" }}>{desc}</p>}
      </div>
      <div style={{ marginInlineStart: isRTL ? 0 : "auto", marginInlineEnd: isRTL ? "auto" : 0 }}>{control}</div>
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
        backgroundColor: checked ? GREEN : "#d7dcd9", cursor: "pointer", transition: "background 0.2s", flexShrink: 0,
      }}
    >
      <span style={{
        position: "absolute", top: "3px", insetInlineStart: checked ? onX : offX,
        width: "16px", height: "16px", borderRadius: "50%", backgroundColor: "#fff",
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
      style={{
        ...MONO, fontSize: "11px", fontWeight: 700, letterSpacing: "0.04em", color: GREEN,
        border: `1.5px solid ${BORDER}`, borderRadius: "6px", padding: "7px 12px", backgroundColor: "#fff", cursor: "pointer",
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
        <label key={o.value} style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", fontSize: "12.5px", color: "#191c1b" }}>
          <input type="radio" name="radiogroup" checked={value === o.value} onChange={() => onChange(o.value)} style={{ accentColor: GREEN, width: "14px", height: "14px", cursor: "pointer" }} />
          {o.label}
        </label>
      ))}
    </div>
  );
}

function OutlineBtn({ children, onClick, danger = false, style }: { children: React.ReactNode; onClick?: () => void; danger?: boolean; style?: React.CSSProperties }) {
  const [hov, setHov] = useState(false);
  const color = danger ? RED : GREEN;
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        ...MONO, fontSize: "10px", fontWeight: 700, letterSpacing: "0.08em", padding: "8px 16px",
        border: `1.5px solid ${color}`, borderRadius: "6px",
        backgroundColor: hov ? color : "transparent", color: hov ? "#fff" : color,
        cursor: "pointer", transition: "all 0.15s", ...style,
      }}
    >
      {children}
    </button>
  );
}

function SolidBtn({ children, onClick, danger = false, disabled = false, style }: { children: React.ReactNode; onClick?: () => void; danger?: boolean; disabled?: boolean; style?: React.CSSProperties }) {
  const color = danger ? RED : GREEN;
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        ...MONO, fontSize: "10px", fontWeight: 700, letterSpacing: "0.08em", padding: "9px 18px",
        border: "none", borderRadius: "6px", backgroundColor: disabled ? "#c7cdca" : color, color: "#fff",
        cursor: disabled ? "not-allowed" : "pointer", transition: "background 0.15s", ...style,
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
      style={{ position: "fixed", inset: 0, backgroundColor: "rgba(11,20,17,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: "20px" }}
    >
      <div onClick={(e) => e.stopPropagation()} style={{ backgroundColor: "#fff", borderRadius: "14px", width, maxWidth: "100%", padding: "26px", boxShadow: "0 12px 40px rgba(0,0,0,0.2)" }}>
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
    fontSize: "13px", marginTop: "4px", fontFamily: "inherit", boxSizing: "border-box",
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
      <h3 style={{ ...SERIF, fontSize: "17px", color: GREEN, margin: "0 0 16px" }}>{t("settings.security.changePassword")}</h3>
      {done ? (
        <p style={{ fontSize: "13px", color: GREEN, display: "flex", alignItems: "center", gap: "6px" }}>
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
          {error && <p style={{ color: RED, fontSize: "12px", marginTop: "10px" }}>{error}</p>}
          <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "20px" }}>
            <OutlineBtn onClick={onClose}>{t("settings.common.cancel")}</OutlineBtn>
            <SolidBtn onClick={submit} disabled={saving}>{saving ? t("settings.common.saving") : t("settings.common.save")}</SolidBtn>
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
      <h3 style={{ ...SERIF, fontSize: "17px", color: danger ? RED : GREEN, margin: "0 0 10px" }}>{title}</h3>
      <p style={{ fontSize: "13px", color: MUTED, lineHeight: 1.6, margin: "0 0 20px" }}>{message}</p>
      <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
        <OutlineBtn onClick={onClose}>Cancel</OutlineBtn>
        <SolidBtn danger={danger} onClick={onConfirm}>{confirmLabel}</SolidBtn>
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
        <h3 style={{ ...SERIF, fontSize: "17px", color: RED, margin: 0 }}>{t("settings.account.deleteTitle")}</h3>
      </div>
      <p style={{ fontSize: "13px", color: MUTED, lineHeight: 1.6, margin: "0 0 16px" }}>{t("settings.account.deleteWarning")}</p>
      <label style={{ fontSize: "11px", ...MONO, color: MUTED, display: "block" }}>
        {t("settings.account.deleteTypeConfirm")}
        <input
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          placeholder="DELETE"
          style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: `1.5px solid ${BORDER}`, fontSize: "13px", marginTop: "6px", boxSizing: "border-box", fontFamily: "inherit" }}
        />
      </label>
      <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "20px" }}>
        <OutlineBtn onClick={onClose}>{t("settings.common.cancel")}</OutlineBtn>
        <SolidBtn danger disabled={!ready} onClick={() => { /* TODO: real delete API call */ onClose(); }}>
          {t("settings.account.deleteConfirm")}
        </SolidBtn>
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

  const cardStyle: React.CSSProperties = {};

  return (
    <div
      dir={isRTL ? "rtl" : "ltr"}
      style={{ ...SANS, backgroundColor: "#faf9f6", minHeight: "100vh", color: "#191c1b" }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Source+Serif+4:ital,opsz,wght@0,8..60,200..900;1,8..60,200..900&family=Source+Sans+3:ital,wght@0,200..900;1,200..900&family=JetBrains+Mono:ital,wght@0,100..800;1,100..800&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap');
        .material-symbols-outlined { font-variation-settings: 'FILL' 0,'wght' 400,'GRAD' 0,'opsz' 24; font-family: 'Material Symbols Outlined'; display: inline-block; vertical-align: middle; }
      `}</style>

      <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "24px 32px 60px", display: "flex", gap: "32px" }}>
        <ProfileSidebar role={isContributor ? "contributor" : "user"} active="settings" />

        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: "20px" }}>
          <div>
            <h1 style={{ ...SERIF, fontSize: "24px", fontWeight: 700, color: GREEN, margin: "0 0 4px" }}>{t("settings.title")}</h1>
            <p style={{ fontSize: "13px", color: MUTED, margin: 0 }}>{t("settings.subtitle")}</p>
          </div>

          {/* ── Language & Interface ─────────────────────── */}
          <Card>
            <SectionHeader icon="translate" title={t("settings.language.title")} saved={savedSection === "language"} />
            <Row isRTL={isRTL} label={t("settings.language.language")} control={
              <Select value={lang ?? "EN"} onChange={handleLangChange} options={langOptions} />
            } />
            {/* Appearance / dark mode intentionally omitted — not implemented yet.
                Add back here once real theme support exists:
                <Row label="Appearance" control={<Select ... options={[System, Light, Dark]} />} /> */}
          </Card>

          {/* ── Notification Preferences ─────────────────── */}
          <Card>
            <SectionHeader icon="notifications_active" title={t("settings.notif.title")} saved={savedSection === "notif"} />
            <Row isRTL={isRTL} label={t("settings.notif.email")} desc={t("settings.notif.emailDesc")} control={
              <Toggle isRTL={isRTL} checked={prefs.emailNotif} onChange={(v) => set("notif", { emailNotif: v })} />
            } />
            <Row isRTL={isRTL} label={t("settings.notif.commentReply")} desc={t("settings.notif.commentReplyDesc")} control={
              <Toggle isRTL={isRTL} checked={prefs.commentReply} onChange={(v) => set("notif", { commentReply: v })} />
            } />
            <Row isRTL={isRTL} label={t("settings.notif.discussion")} desc={t("settings.notif.discussionDesc")} control={
              <Toggle isRTL={isRTL} checked={prefs.discussion} onChange={(v) => set("notif", { discussion: v })} />
            } />
            <Row isRTL={isRTL} label={t("settings.notif.system")} desc={t("settings.notif.systemDesc")} control={
              <Toggle isRTL={isRTL} checked={prefs.system} onChange={(v) => set("notif", { system: v })} />
            } />

            {isContributor && (
              <div style={{ backgroundColor: "rgba(11,67,53,0.03)" }}>
                <div style={{ padding: "14px 24px 6px", display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ width: "3px", height: "14px", borderRadius: "2px", backgroundColor: GOLD }} />
                  <p style={{ ...MONO, fontSize: "10px", fontWeight: 700, letterSpacing: "0.08em", color: GREEN, margin: 0 }}>
                    {t("settings.notif.contributorTitle")}
                  </p>
                </div>
                <Row isRTL={isRTL} label={t("settings.notif.contribApproved")} control={<Toggle isRTL={isRTL} checked={prefs.contribApproved} onChange={(v) => set("notif", { contribApproved: v })} />} />
                <Row isRTL={isRTL} label={t("settings.notif.contribRejected")} control={<Toggle isRTL={isRTL} checked={prefs.contribRejected} onChange={(v) => set("notif", { contribRejected: v })} />} />
                <Row isRTL={isRTL} label={t("settings.notif.contribChanges")} control={<Toggle isRTL={isRTL} checked={prefs.contribChanges} onChange={(v) => set("notif", { contribChanges: v })} />} />
                <Row isRTL={isRTL} label={t("settings.notif.contribTranslation")} control={<Toggle isRTL={isRTL} checked={prefs.contribTranslation} onChange={(v) => set("notif", { contribTranslation: v })} />} />
                <Row isRTL={isRTL} label={t("settings.notif.contribStatus")} control={<Toggle isRTL={isRTL} checked={prefs.contribStatus} onChange={(v) => set("notif", { contribStatus: v })} />} />
              </div>
            )}
          </Card>

          {/* ── Privacy ───────────────────────────────────── */}
          <Card>
            <SectionHeader icon="shield" title={t("settings.privacy.title")} saved={savedSection === "privacy"} />
            <Row isRTL={isRTL} label={t("settings.privacy.visibility")} control={
              <RadioGroup
                value={prefs.profileVisibility}
                onChange={(v) => set("privacy", { profileVisibility: v })}
                options={[
                  { value: "public", label: t("settings.privacy.visibilityPublic") },
                  { value: "registered", label: t("settings.privacy.visibilityRegistered") },
                ]}
              />
            } />
            <Row isRTL={isRTL} label={t("settings.privacy.showEmail")} desc={t("settings.privacy.showEmailDesc")} control={
              <Toggle isRTL={isRTL} checked={prefs.showEmail} onChange={(v) => set("privacy", { showEmail: v })} />
            } />
            <Row isRTL={isRTL} label={t("settings.privacy.showActivity")} control={
              <Toggle isRTL={isRTL} checked={prefs.showActivity} onChange={(v) => set("privacy", { showActivity: v })} />
            } />
            <Row isRTL={isRTL} label={t("settings.privacy.showContributions")} desc={isContributor ? t("settings.privacy.showContributionsDesc") : undefined} control={
              <Toggle isRTL={isRTL} checked={prefs.showContributions} onChange={(v) => set("privacy", { showContributions: v })} />
            } />
            <p style={{ fontSize: "11px", color: MUTED, fontStyle: "italic", margin: 0, padding: "12px 24px 18px" }}>
              {t("settings.privacy.adminNote")}
            </p>
          </Card>

          {/* ── Security ──────────────────────────────────── */}
          <Card>
            <SectionHeader icon="lock" title={t("settings.security.title")} />
            <Row isRTL={isRTL} label={t("settings.security.password")} control={
              <OutlineBtn onClick={() => setPwModalOpen(true)}>{t("settings.security.changePassword")}</OutlineBtn>
            } />
            <div style={{ padding: "16px 24px", borderBottom: "1px solid #f0f1ee" }}>
              <p style={{ fontSize: "13.5px", fontWeight: 600, margin: "0 0 4px" }}>{t("settings.security.emailVerification")}</p>
              <p style={{ ...MONO, fontSize: "11px", color: MUTED, margin: "0 0 8px" }}>{(user as any)?.email ?? "—"}</p>
              {emailVerified ? (
                <span style={{ ...MONO, fontSize: "10px", fontWeight: 700, color: GREEN, display: "inline-flex", alignItems: "center", gap: "4px" }}>
                  <Icon name="verified" size={13} /> {t("settings.security.verified")}
                </span>
              ) : (
                <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                  <span style={{ ...MONO, fontSize: "10px", fontWeight: 700, color: "#735c00" }}>{t("settings.security.notVerified")}</span>
                  <OutlineBtn onClick={resend} style={{ padding: "5px 12px" }}>
                    {resendState === "sent" ? t("settings.security.resendSent") : t("settings.security.resend")}
                  </OutlineBtn>
                </div>
              )}
            </div>
            {/* "Log out other sessions" intentionally omitted — no session management yet.
                Add back once implemented:
                <Row label="Log out of all other sessions" control={<OutlineBtn>...</OutlineBtn>} /> */}
          </Card>

          {/* ── Account (visually separated, danger zone) ──── */}
          <Card style={{ border: `1.5px solid rgba(179,38,30,0.25)` }}>
            <SectionHeader icon="warning" title={t("settings.account.title")} accent={RED} />
            <Row isRTL={isRTL} label={t("settings.account.deactivate")} desc={t("settings.account.deactivateDesc")} control={
              <OutlineBtn onClick={() => setDeactivateOpen(true)}>{t("settings.account.deactivate")}</OutlineBtn>
            } />
            <div style={{ padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
              <div style={{ minWidth: "200px" }}>
                <p style={{ fontSize: "13.5px", color: RED, margin: 0, fontWeight: 600 }}>{t("settings.account.deleteTitle")}</p>
                <p style={{ fontSize: "12px", color: MUTED, margin: "3px 0 0" }}>{t("settings.account.deleteDesc")}</p>
              </div>
              {/* Deliberately not a bold/filled button — spec says don't make delete visually dominant */}
              <button
                onClick={() => setDeleteOpen(true)}
                style={{ ...MONO, fontSize: "10px", fontWeight: 700, letterSpacing: "0.06em", color: RED, background: "none", border: "none", textDecoration: "underline", cursor: "pointer", padding: 0 }}
              >
                {t("settings.account.deleteTitle")}
              </button>
            </div>
          </Card>
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