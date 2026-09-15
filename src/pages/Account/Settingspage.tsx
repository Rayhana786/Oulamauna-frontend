// src/pages/Authentication/SettingsPage.tsx
import React, { useState, useRef, useEffect } from "react";
import { useLang } from "../../context/LanguageContext";
import { useAuth } from "../../context/AuthContext";
import ProfileSidebar from "../../components/ProfileSidebar";
import settingsService, { UserSettings, UpdateSettingsPayload } from "../../api/settingsApi";

const colors = { creamLight: "#fcfaf5", creamMid: "#f6efdc", creamDark: "#e5d5a8", forestGreen: "#0b4335", amber: "#b8860b", red: "#8b2c2c" };
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

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => (typeof window !== "undefined" ? window.innerWidth < 768 : false));
  useEffect(() => {
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

function SavedBadge({ show, t }: { show: boolean; t: (k: string) => string }) {
  return (
    <span style={{
      ...MONO, fontSize: "9px", fontWeight: 700, letterSpacing: "0.06em", color: GREEN,
      opacity: show ? 1 : 0, transition: "opacity 0.4s", display: "inline-flex", alignItems: "center", gap: "4px",
    }}>
      <Icon name="check_circle" size={12} /> {t("settings.saved")}
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
      {saved !== undefined && <SavedBadge show={saved} t={(k: string) => k} />} 
      {/* Note: t is passed via closure in main component, but for simplicity we'll adjust below */}
    </div>
  );
}

function Row({ label, desc, control, isRTL, isMobile }: { label: string; desc?: string; control: React.ReactNode; isRTL: boolean; isMobile: boolean }) {
  return (
    <div style={{
      display: "flex", alignItems: isMobile ? "flex-start" : "center", justifyContent: "space-between",
      gap: isMobile ? "10px" : "16px", padding: isMobile ? "14px 18px" : "16px 24px",
      borderBottom: `1px solid rgba(11, 67, 53, 0.06)`, flexWrap: isMobile ? "nowrap" : "wrap", flexDirection: isMobile ? "column" : "row",
    }}>
      <div style={{ minWidth: isMobile ? "auto" : "200px" }}>
        <p style={{ ...SANS, fontSize: isMobile ? "13px" : "13.5px", color: GREEN, margin: 0, fontWeight: 600 }}>{label}</p>
        {desc && <p style={{ ...SANS, fontSize: "12px", color: MUTED, margin: "3px 0 0" }}>{desc}</p>}
      </div>
      <div style={{ marginInlineStart: isMobile ? 0 : (isRTL ? 0 : "auto"), marginInlineEnd: isMobile ? 0 : (isRTL ? "auto" : 0), width: isMobile ? "100%" : "auto" }}>
        {control}
      </div>
    </div>
  );
}

function Toggle({ checked, onChange, isRTL }: { checked: boolean; onChange: (v: boolean) => void; isRTL: boolean }) {
  const onX = isRTL ? "3px" : "21px";
  const offX = isRTL ? "21px" : "3px";
  return (
    <button
      role="switch" aria-checked={checked} onClick={() => onChange(!checked)}
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
      value={value} onChange={(e) => onChange(e.target.value)} className="op-select"
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
          <input type="radio" name="radiogroup_settings" checked={value === o.value} onChange={() => onChange(o.value)} style={{ accentColor: GREEN, width: "14px", height: "14px", cursor: "pointer" }} />
          {o.label}
        </label>
      ))}
    </div>
  );
}

function HoverBtn({ children, onClick, variant = "outline", danger = false, disabled = false, style }: {
  children: React.ReactNode; onClick?: () => void; variant?: "outline" | "primary"; danger?: boolean; disabled?: boolean; style?: React.CSSProperties;
}) {
  const [hov, setHov] = useState(false);
  const baseColor = danger ? RED : GREEN;
  let bg = "transparent", color = baseColor, border = `2px solid ${baseColor}`;

  if (variant === "primary") {
    bg = disabled ? "rgba(11, 67, 53, 0.25)" : baseColor; color = BG;
    if (hov && !disabled) { bg = BG; color = baseColor; }
  } else {
    if (hov && !disabled) { bg = baseColor; color = BG; }
  }

  return (
    <button
      onClick={disabled ? undefined : onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} disabled={disabled}
      style={{
        display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "6px",
        padding: "8px 16px", border, borderRadius: "8px", backgroundColor: bg, color,
        ...MONO, fontSize: "11px", fontWeight: 700, letterSpacing: "0.05em",
        cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.7 : 1, transition: "all 0.3s", ...style,
      }}
    >
      {children}
    </button>
  );
}

function Modal({ open, onClose, children, width = "420px" }: { open: boolean; onClose: () => void; children: React.ReactNode; width?: string }) {
  if (!open) return null;
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, backgroundColor: "rgba(11, 67, 53, 0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: "20px" }}>
      <div onClick={(e) => e.stopPropagation()} style={{ backgroundColor: BG, borderRadius: "14px", width, maxWidth: "100%", padding: "26px", boxShadow: "0 25px 80px rgba(0,0,0,0.15)", border: `1px solid ${BORDER}` }}>
        {children}
      </div>
    </div>
  );
}

function ConfirmModal({ open, onClose, onConfirm, title, message, confirmLabel, danger = false, loading = false, t }: {
  open: boolean; onClose: () => void; onConfirm: () => void; title: string; message: string; confirmLabel: string; danger?: boolean; loading?: boolean; t: (k: string) => string;
}) {
  return (
    <Modal open={open} onClose={onClose}>
      <h3 style={{ ...SERIF, fontSize: "17px", fontWeight: 700, color: danger ? RED : GREEN, margin: "0 0 10px" }}>{title}</h3>
      <p style={{ ...SANS, fontSize: "13px", color: MUTED, lineHeight: 1.6, margin: "0 0 20px" }}>{message}</p>
      <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
        <HoverBtn onClick={onClose} disabled={loading}>{t("settings.cancel")}</HoverBtn>
        <HoverBtn variant="primary" danger={danger} onClick={onConfirm} disabled={loading}>
          {loading ? t("settings.processing") : confirmLabel}
        </HoverBtn>
      </div>
    </Modal>
  );
}

function DeleteAccountModal({ open, onClose, onConfirm, loading, t }: { open: boolean; onClose: () => void; onConfirm: () => void; loading: boolean; t: (k: string) => string }) {
  const [typed, setTyped] = useState("");
  useEffect(() => { if (open) setTyped(""); }, [open]);
  const ready = typed.trim().toUpperCase() === "DELETE";

  return (
    <Modal open={open} onClose={onClose}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
        <Icon name="warning" size={18} />
        <h3 style={{ ...SERIF, fontSize: "17px", fontWeight: 700, color: RED, margin: 0 }}>{t("settings.deleteAccount")}</h3>
      </div>
      <p style={{ ...SANS, fontSize: "13px", color: MUTED, lineHeight: 1.6, margin: "0 0 16px" }}>
        {t("settings.deleteAccountWarning")}
      </p>
      <label style={{ fontSize: "11px", ...MONO, color: MUTED, display: "block" }}>
        {t("settings.typeDeleteToConfirm")}
        <input
          value={typed} onChange={(e) => setTyped(e.target.value)} placeholder="DELETE"
          style={{
            width: "100%", padding: "10px 12px", borderRadius: "8px", border: `1.5px solid ${BORDER}`,
            fontSize: "13px", marginTop: "6px", boxSizing: "border-box", ...SANS, color: GREEN,
            backgroundColor: "rgba(11, 67, 53, 0.04)", outline: "none",
          }}
        />
      </label>
      <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "20px" }}>
        <HoverBtn onClick={onClose} disabled={loading}>{t("settings.cancel")}</HoverBtn>
        <HoverBtn variant="primary" danger disabled={!ready || loading} onClick={onConfirm}>
          {loading ? t("settings.processing") : t("settings.deleteAccountConfirm")}
        </HoverBtn>
      </div>
    </Modal>
  );
}

export default function SettingsPage() {
  const { lang, setLang, t } = useLang();
  const { user, logout } = useAuth();
  const isRTL = lang === "AR";
  const isMobile = useIsMobile();

  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSection, setSavedSection] = useState<string | null>(null);
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [deactivateOpen, setDeactivateOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await settingsService.getMySettings();
        if (res.data.success && res.data.data) setSettings(res.data.data);
      } catch (err) {
        console.error("Failed to fetch settings", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const markSaved = (section: string) => {
    setSavedSection(section);
    if (savedTimer.current) clearTimeout(savedTimer.current);
    savedTimer.current = setTimeout(() => setSavedSection(null), 1800);
  };

  const updateSetting = async (patch: Partial<UpdateSettingsPayload>) => {
    if (!settings || saving) return;
    setSaving(true);
    try {
      const res = await settingsService.updateMySettings(patch);
      if (res.data.success && res.data.data) {
        setSettings(res.data.data);
        markSaved("settings");
      }
    } catch (err) {
      console.error("Failed to update settings", err);
      alert(t("settings.errorUpdate"));
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async () => {
    setActionLoading(true);
    try {
      const res = await settingsService.deactivateAccount();
      if (res.data.success) {
        setDeactivateOpen(false);
        await logout();
      }
    } catch (err) {
      console.error("Failed to deactivate", err);
      alert(t("settings.errorDeactivate"));
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    setActionLoading(true);
    try {
      const res = await settingsService.deleteAccount();
      if (res.data.success) {
        await logout();
      }
    } catch (err) {
      console.error("Failed to delete", err);
      alert(t("settings.errorDelete"));
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ ...SANS, backgroundColor: BG, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: GREEN }}>
        {t("settings.loading")}
      </div>
    );
  }

  if (!settings) {
    return (
      <div style={{ ...SANS, backgroundColor: BG, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: RED }}>
        {t("settings.errorLoad")}
      </div>
    );
  }

  const langOptions = [
    { value: "1", label: "العربية" },
    { value: "2", label: "English" },
    { value: "3", label: "Français" },
  ];

  const handleLangChange = async (v: string) => {
    const langId = parseInt(v, 10);
    await updateSetting({ preferred_language_id: langId });
    const langCode = langId === 1 ? "AR" : langId === 2 ? "EN" : "FR";
    setLang(langCode);
  };

  return (
    <div dir={isRTL ? "rtl" : "ltr"} style={{ ...SANS, backgroundColor: BG, backgroundImage: "radial-gradient(circle at 50% 0%, rgba(184, 134, 11, 0.06) 0%, transparent 60%)", minHeight: "100vh", color: GREEN }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;700&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap');
        .material-symbols-outlined { font-variation-settings: 'FILL' 0,'wght' 400,'GRAD' 0,'opsz' 24; font-family: 'Material Symbols Outlined'; display: inline-block; vertical-align: middle; }
        .op-select:focus { border-color: ${GREEN} !important; box-shadow: inset 0 0 0 1px rgba(11,67,53,0.12); }
      `}</style>

      <div style={{ maxWidth: "1000px", margin: "0 auto", padding: isMobile ? "32px 16px 48px" : "64px 32px 80px", display: "flex", flexDirection: isMobile ? "column" : "row", gap: isMobile ? "16px" : "32px" }}>
        {!isMobile && <ProfileSidebar role={(user as any)?.role === "contributor" ? "contributor" : "user"} active="settings" />}

        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: isMobile ? "14px" : "20px" }}>
          <div>
            {isMobile && (
              <p style={{ ...MONO, fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.08em", opacity: 0.7, margin: "0 0 6px" }}>{t("settings.title")}</p>
            )}
            <h1 style={{ ...SERIF, fontSize: isMobile ? "20px" : "24px", fontWeight: 700, color: GREEN, margin: "0 0 4px" }}>{t("settings.title")}</h1>
            <p style={{ ...SANS, fontSize: isMobile ? "12px" : "13px", color: MUTED, margin: 0 }}>{t("settings.desc")}</p>
          </div>

          <HoverCard>
            <SectionHeader icon="translate" title={t("settings.language")} saved={savedSection === "settings"} isMobile={isMobile} />
            <Row isRTL={isRTL} isMobile={isMobile} label={t("settings.preferredLanguage")} control={
              <Select value={settings.preferred_language_id?.toString() ?? "2"} onChange={handleLangChange} options={langOptions} />
            } />
          </HoverCard>

          <HoverCard>
            <SectionHeader icon="notifications_active" title={t("settings.notifications")} saved={savedSection === "settings"} isMobile={isMobile} />
            <Row isRTL={isRTL} isMobile={isMobile} label={t("settings.enableNotifications")} desc={t("settings.notificationsDesc")} control={
              <Toggle isRTL={isRTL} checked={settings.notifications_enabled} onChange={(v) => updateSetting({ notifications_enabled: v })} />
            } />
          </HoverCard>

          <HoverCard>
            <SectionHeader icon="shield" title={t("settings.privacy")} saved={savedSection === "settings"} isMobile={isMobile} />
            <Row isRTL={isRTL} isMobile={isMobile} label={t("settings.profileVisibility")} control={
              <RadioGroup
                value={settings.profile_visibility}
                onChange={(v) => updateSetting({ profile_visibility: v as any })}
                options={[
                  { value: "public", label: t("settings.visibilityPublic") },
                  { value: "registered_only", label: t("settings.visibilityRegistered") },
                  { value: "private", label: t("settings.visibilityPrivate") },
                ]}
              />
            } />
            <Row isRTL={isRTL} isMobile={isMobile} label={t("settings.showEmail")} desc={t("settings.showEmailDesc")} control={
              <Toggle isRTL={isRTL} checked={settings.show_email} onChange={(v) => updateSetting({ show_email: v })} />
            } />
            <Row isRTL={isRTL} isMobile={isMobile} label={t("settings.showContributions")} desc={t("settings.showContributionsDesc")} control={
              <Toggle isRTL={isRTL} checked={settings.show_contributions} onChange={(v) => updateSetting({ show_contributions: v })} />
            } />
          </HoverCard>

          <HoverCard style={{ border: `1.5px solid rgba(139, 44, 44, 0.25)` }}>
            <SectionHeader icon="warning" title={t("settings.accountManagement")} accent={RED} isMobile={isMobile} />
            <Row isRTL={isRTL} isMobile={isMobile} label={t("settings.deactivateAccount")} desc={t("settings.deactivateAccountDesc")} control={
              <HoverBtn onClick={() => setDeactivateOpen(true)} style={isMobile ? { width: "100%" } : undefined}>{t("settings.deactivate")}</HoverBtn>
            } />
            <div style={{ padding: isMobile ? "14px 18px" : "16px 24px", display: "flex", alignItems: isMobile ? "flex-start" : "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px", flexDirection: isMobile ? "column" : "row" }}>
              <div style={{ minWidth: isMobile ? "auto" : "200px" }}>
                <p style={{ ...SANS, fontSize: "13.5px", color: RED, margin: 0, fontWeight: 600 }}>{t("settings.deleteAccount")}</p>
                <p style={{ ...SANS, fontSize: "12px", color: MUTED, margin: "3px 0 0" }}>{t("settings.deleteAccountDesc")}</p>
              </div>
              <button
                onClick={() => setDeleteOpen(true)}
                style={{ ...MONO, fontSize: "10px", fontWeight: 700, letterSpacing: "0.06em", color: RED, background: "none", border: "none", textDecoration: "underline", cursor: "pointer", padding: 0 }}
              >
                {t("settings.deleteAccount")}
              </button>
            </div>
          </HoverCard>
        </div>
      </div>

      <ConfirmModal
        open={deactivateOpen} onClose={() => setDeactivateOpen(false)} onConfirm={handleDeactivate}
        title={t("settings.deactivateAccount")} message={t("settings.deactivateConfirmMessage")}
        confirmLabel={t("settings.deactivate")} loading={actionLoading} t={t}
      />
      
      <DeleteAccountModal 
        open={deleteOpen} onClose={() => setDeleteOpen(false)} onConfirm={handleDelete}
        loading={actionLoading} t={t}
      />
    </div>
  );
}