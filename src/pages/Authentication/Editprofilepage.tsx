import React, { useState } from "react";
import {
  UserCircle,
  LayoutDashboard,
  SquarePen,
  Settings,
  LogOut,
  Pencil,
  User,
  Link as LinkIcon,
  Plus,
  X,
} from "lucide-react";
import { useLang } from "../../context/LanguageContext";

/* ─────────────────────────────────────────────
   Colors taken straight from the Oulamauna codebase
   (Login.tsx / ScholarDetailPage.tsx):
   #0b4335  primary dark green
   #285B4B  forest green
   #C9A84C  gold accent (hover)
   #D8BF86  soft gold (dividers, underline)
   #7DA89B  sage (icons, secondary links)
   #B8B09A  muted label
   #faf9f6  page background
   #f1f1f1  input background
   #c0c9c3  border / outline
   #707974 / #404945  muted text
   #ba1a1a  error red
───────────────────────────────────────────── */

type Role = "user" | "contributor";

interface LinkRow {
  id: number;
  url: string;
}

let idCounter = 1;

const MONO = { fontFamily: "'JetBrains Mono', monospace" } as React.CSSProperties;
const SERIF = { fontFamily: "'Source Serif 4', serif" } as React.CSSProperties;
const SANS = { fontFamily: "'Source Sans 3', sans-serif" } as React.CSSProperties;

interface EditProfilePageProps {
  /** Wire this up to your real auth/user state */
  role?: Role;
}

export default function EditProfilePage({ role = "user" }: EditProfilePageProps) {
  const { lang, setLang, t } = useLang();
  const [links, setLinks] = useState<LinkRow[]>([
    { id: idCounter++, url: "https://facebook.com/ahmed.alfarsi" },
  ]);
  const [saved, setSaved] = useState(false);

  const isRTL = lang === "AR";
  const isUser = role === "user";

  const addLink = () => setLinks((prev) => [...prev, { id: idCounter++, url: "" }]);
  const removeLink = (id: number) => setLinks((prev) => prev.filter((l) => l.id !== id));
  const updateLink = (id: number, url: string) =>
    setLinks((prev) => prev.map((l) => (l.id === id ? { ...l, url } : l)));

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const navItems = [
    { icon: UserCircle, label: t("editProfile.myProfile") },
    { icon: LayoutDashboard, label: t("editProfile.dashboard") },
    { icon: SquarePen, label: t("editProfile.editProfile"), active: true },
    { icon: Settings, label: t("editProfile.settings") },
  ];

  return (
    <div dir={isRTL ? "rtl" : "ltr"} style={{ ...SANS, minHeight: "100vh", backgroundColor: "#faf9f6", padding: "40px 24px" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,600;0,8..60,700;1,8..60,400&family=Source+Sans+3:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');
        .op-nav-item { transition: background 0.15s, color 0.15s; }
        .op-nav-item:hover:not(.op-active) { background: #f1f1f1; color: #285B4B; }
        .op-signout:hover { background: rgba(186,26,26,0.08) !important; }
        .op-btn-primary { transition: background 0.2s, transform 0.1s; }
        .op-btn-primary:hover { background: #C9A84C !important; }
        .op-btn-primary:active { transform: scale(0.98); }
        .op-btn-outline { transition: border-color 0.15s, color 0.15s, background 0.15s; }
        .op-btn-outline:hover { border-color: #C9A84C !important; color: #285B4B !important; background: #f1f1f1 !important; }
        .op-input:focus { outline: none; border-color: #285B4B !important; box-shadow: 0 0 0 1px #285B4B; }
        .op-add-link:hover { background: rgba(40,91,75,0.06) !important; }
        .op-remove-link:hover { color: #ba1a1a !important; background: rgba(186,26,26,0.08) !important; }
        .op-lang-pill:hover:not(.op-lang-active) { border-color: #C9A84C !important; color: #285B4B !important; }
        .op-upgrade-btn:hover { background: #C9A84C !important; }
        .op-avatar-edit:hover { transform: scale(1.1); }
      `}</style>

      <div style={{ maxWidth: "980px", margin: "0 auto" }}>
       

        <div style={{ display: "flex", flexDirection: isRTL ? "row-reverse" : "row", gap: "32px", alignItems: "flex-start" }}>
          {/* Sidebar */}
          <aside style={{ width: "230px", flexShrink: 0, display: "flex", flexDirection: "column", gap: "4px" }}>
            <nav style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              {navItems.map(({ icon: Icon, label, active }) => (
                <a
                  key={label}
                  href="#"
                  className={`op-nav-item${active ? " op-active" : ""}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "14px",
                    padding: "11px 16px",
                    borderRadius: "999px",
                    textDecoration: "none",
                    fontSize: "13px",
                    ...MONO,
                    letterSpacing: "0.03em",
                    color: active ? "#fff" : "#404945",
                    backgroundColor: active ? "#285B4B" : "transparent",
                    fontWeight: active ? 700 : 500,
                  }}
                >
                  <Icon size={17} strokeWidth={1.75} />
                  {label}
                </a>
              ))}
              <a
                href="#"
                className="op-signout"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "14px",
                  padding: "11px 16px",
                  borderRadius: "999px",
                  textDecoration: "none",
                  fontSize: "13px",
                  ...MONO,
                  letterSpacing: "0.03em",
                  color: "#ba1a1a",
                  marginTop: "6px",
                }}
              >
                <LogOut size={17} strokeWidth={1.75} />
                {t("editProfile.signOut")}
              </a>
            </nav>

            {/* Profile completion + Upgrade — sits under Sign Out, only for "user" role */}
            {isUser && (
              <div style={{ marginTop: "20px", display: "flex", flexDirection: "column", gap: "14px" }}>
                <div style={{ backgroundColor: "#fff", padding: "16px", borderRadius: "14px", border: "1px solid rgba(192,201,195,0.6)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                    <span style={{ ...MONO, fontSize: "10px", color: "#707974" }}>{t("editProfile.profileCompletion")}</span>
                    <span style={{ fontWeight: 700, color: "#285B4B", fontSize: "13px" }}>40%</span>
                  </div>
                  <div style={{ width: "100%", height: "6px", backgroundColor: "#e7e8e6", borderRadius: "999px", overflow: "hidden" }}>
                    <div style={{ width: "40%", height: "100%", backgroundColor: "#285B4B" }} />
                  </div>
                  <p style={{ fontSize: "10.5px", color: "#707974", marginTop: "8px", lineHeight: 1.5 }}>{t("editProfile.completeHint")}</p>
                </div>

                <div style={{ backgroundColor: "#285B4B", padding: "16px", borderRadius: "14px" }}>
                  <h4 style={{ ...SERIF, fontSize: "14px", fontWeight: 700, color: "#D8BF86", margin: "0 0 6px" }}>{t("editProfile.becomeContributor")}</h4>
                  <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.85)", margin: "0 0 12px", lineHeight: 1.5 }}>{t("editProfile.upgradeHint")}</p>
                  <button
                    className="op-upgrade-btn"
                    style={{
                      width: "100%",
                      padding: "9px",
                      backgroundColor: "#C9A84C",
                      color: "#191c1b",
                      border: "none",
                      borderRadius: "999px",
                      ...MONO,
                      fontSize: "10px",
                      fontWeight: 700,
                      letterSpacing: "0.08em",
                      cursor: "pointer",
                      transition: "background 0.15s",
                    }}
                  >
                    {t("editProfile.upgradeNow")}
                  </button>
                </div>
              </div>
            )}
          </aside>

          {/* Body */}
          <section style={{ flex: 1, backgroundColor: "#fff", border: "1px solid rgba(192,201,195,0.5)", borderRadius: "18px", padding: "28px 32px", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
            <header style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "16px", marginBottom: "24px", paddingBottom: "22px", borderBottom: "1px solid rgba(192,201,195,0.5)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                <div style={{ position: "relative" }}>
                  <div style={{ width: "62px", height: "62px", borderRadius: "50%", overflow: "hidden", backgroundColor: "#285B4B", display: "flex", alignItems: "center", justifyContent: "center", color: "#D8BF86", fontSize: "22px", fontWeight: 700, border: "2px solid #D8BF86" }}>
                    A
                  </div>
                  <button
                    className="op-avatar-edit"
                    style={{
                      position: "absolute", bottom: "-2px", right: isRTL ? "auto" : "-2px", left: isRTL ? "-2px" : "auto",
                      width: "22px", height: "22px", borderRadius: "50%",
                      backgroundColor: "#285B4B", color: "#fff", border: "2px solid #fff",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      cursor: "pointer", transition: "transform 0.15s",
                    }}
                  >
                    <Pencil size={11} />
                  </button>
                </div>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "2px" }}>
                    <h2 style={{ ...SERIF, fontSize: "19px", fontWeight: 700, color: "#0b4335", margin: 0 }}>Ahmed_21</h2>
                    <span
                      style={{
                        fontSize: "9px", padding: "2px 8px", borderRadius: "999px",
                        fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase",
                        color: "#fff", backgroundColor: isUser ? "#7DA89B" : "#0b4335",
                      }}
                    >
                      {isUser ? t("editProfile.user") : t("editProfile.contributor")}
                    </span>
                  </div>
                  <p style={{ fontSize: "12px", color: "#707974", margin: 0 }}>
                    {isUser ? t("editProfile.browsing") : t("editProfile.contributing")}
                  </p>
                </div>
              </div>
             
            </header>

            <form id="op-edit-profile-form" onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
              {/* Personal information */}
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#0b4335", marginBottom: "16px" }}>
                  <User size={16} />
                  <h3 style={{ ...SERIF, fontSize: "15px", fontWeight: 700, margin: 0 }}>{t("editProfile.personalInfo")}</h3>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <Field label={t("editProfile.displayName")} defaultValue="Ahmed" />
                  <Field label={t("editProfile.username")} defaultValue="Ahmed_21" required />
                  <Field label={t("editProfile.fullName")} defaultValue="Ahmed Al-Farsi" />
                  <Field label={t("editProfile.email")} defaultValue="user@email.com" type="email" required />
                  <div style={{ gridColumn: "1 / -1", display: "flex", flexDirection: "column", gap: "6px" }}>
                    <label style={{ ...MONO, fontSize: "10px", color: "#B8B09A", letterSpacing: "0.08em" }}>{t("editProfile.bio")}</label>
                    <textarea
                      rows={3}
                      defaultValue="Passionate academic focused on the intersection of ancient linguistics and modern digital preservation."
                      className="op-input"
                      style={{ backgroundColor: "#f1f1f1", border: "1px solid transparent", padding: "10px 14px", borderRadius: "8px", fontSize: "13px", resize: "none", ...SANS }}
                    />
                  </div>
                  <div style={{ gridColumn: "1 / -1", display: "flex", flexDirection: "column", gap: "6px" }}>
                    <label style={{ ...MONO, fontSize: "10px", color: "#B8B09A", letterSpacing: "0.08em" }}>{t("editProfile.country")}</label>
                    <select
                      defaultValue="Algeria"
                      className="op-input"
                      style={{ backgroundColor: "#f1f1f1", border: "1px solid transparent", padding: "10px 14px", borderRadius: "8px", fontSize: "13px", ...SANS }}
                    >
                      <option value="Algeria">Algeria</option>
                      <option value="Morocco">Morocco</option>
                      <option value="Tunisia">Tunisia</option>
                      <option value="Egypt">Egypt</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Links — plain URL fields, no type selector */}
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#0b4335", marginBottom: "4px" }}>
                  <LinkIcon size={16} />
                  <h3 style={{ ...SERIF, fontSize: "15px", fontWeight: 700, margin: 0 }}>{t("editProfile.links")}</h3>
                </div>
                <p style={{ fontSize: "11.5px", color: "#707974", marginBottom: "14px" }}>{t("editProfile.linksHint")}</p>

                <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "14px" }}>
                  {links.map((link) => (
                    <div key={link.id} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1, backgroundColor: "#f1f1f1", borderRadius: "8px", padding: "0 12px" }}>
                        <LinkIcon size={14} color="#7DA89B" />
                        <input
                          type="url"
                          value={link.url}
                          onChange={(e) => updateLink(link.id, e.target.value)}
                          placeholder={t("editProfile.linkPlaceholder")}
                          className="op-input"
                          style={{ flex: 1, background: "transparent", border: "1px solid transparent", padding: "10px 0", fontSize: "13px", ...SANS }}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeLink(link.id)}
                        className="op-remove-link"
                        style={{ width: "32px", height: "32px", borderRadius: "50%", border: "none", background: "transparent", color: "#707974", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "background 0.15s, color 0.15s" }}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={addLink}
                  className="op-add-link"
                  style={{
                    display: "flex", alignItems: "center", gap: "8px",
                    padding: "9px 18px", border: "1px solid #285B4B", color: "#285B4B",
                    background: "transparent", borderRadius: "999px", ...MONO,
                    fontSize: "10.5px", cursor: "pointer", transition: "background 0.15s",
                  }}
                >
                  <Plus size={14} /> {t("editProfile.addLink")}
                </button>
              </div>

              {/* Footer actions */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", paddingTop: "16px", borderTop: "1px solid rgba(192,201,195,0.5)" }}>
                <button type="button" className="op-btn-outline" style={{ padding: "10px 20px", border: "1px solid #c0c9c3", color: "#404945", background: "transparent", borderRadius: "999px", ...MONO, fontSize: "10.5px", cursor: "pointer" }}>
                  {t("editProfile.discard")}
                </button>
                <button type="submit" className="op-btn-primary" style={{ padding: "10px 22px", backgroundColor: "#285B4B", color: "#fff", border: "none", borderRadius: "999px", ...MONO, fontSize: "10.5px", cursor: "pointer" }}>
                  {saved ? t("editProfile.profileUpdated") : t("editProfile.saveProfile")}
                </button>
              </div>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  defaultValue,
  type = "text",
  required = false,
}: {
  label: string;
  defaultValue: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      <label style={{ ...MONO, fontSize: "10px", color: "#B8B09A", letterSpacing: "0.08em" }}>{label}</label>
      <input
        type={type}
        defaultValue={defaultValue}
        required={required}
        className="op-input"
        style={{ backgroundColor: "#f1f1f1", border: "1px solid transparent", padding: "10px 14px", borderRadius: "8px", fontSize: "13px", ...SANS }}
      />
    </div>
  );
}