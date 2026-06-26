import { useState, useRef, useEffect, RefObject } from "react";
import { useLang } from "../../context/LanguageContext";
import bgImage from "../../assets/bg4.png";

type Lang = "EN" | "AR" | "FR";

interface Notif {
  color: string;
  titleKey: string;
  subKey: string;
  time: string;
}

const NOTIFS: Notif[] = [
  { color: "#ba1a1a", titleKey: "navbar.notif.newScholar",    subKey: "navbar.notif.newScholarSub",    time: "2m"  },
  { color: "#C9A84C", titleKey: "navbar.notif.editProposed",  subKey: "navbar.notif.editProposedSub",  time: "18m" },
  { color: "#0b4335", titleKey: "navbar.notif.mediaUploaded", subKey: "navbar.notif.mediaUploadedSub", time: "1h"  },
  { color: "#C9A84C", titleKey: "navbar.notif.reported",      subKey: "navbar.notif.reportedSub",      time: "3h"  },
];

function useClickOutside(ref: RefObject<HTMLDivElement | null>, handler: () => void) {
  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) handler();
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, [ref, handler]);
}

interface NavbarProps {
  pageTitleKey?: string;
}

export default function AdminNavbar({ pageTitleKey }: NavbarProps) {
  const { lang, setLang, t } = useLang();
  const isRTL = lang === "AR";

  const [notifOpen,   setNotifOpen]   = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [langOpen,    setLangOpen]    = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);

  const notifRef   = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const langRef    = useRef<HTMLDivElement>(null);

  useClickOutside(notifRef,   () => setNotifOpen(false));
  useClickOutside(profileRef, () => setProfileOpen(false));
  useClickOutside(langRef,    () => setLangOpen(false));

  const title = pageTitleKey ? t(pageTitleKey) : t("navbar.dashboard");

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@500;600&family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20,300,0,0&display=swap" rel="stylesheet" />
      <style>{`
        .ms { font-family:'Material Symbols Outlined'; font-style:normal; font-size:20px;
              display:inline-flex; align-items:center; user-select:none; line-height:1; }
        .nb-btn { background:none; border:none; cursor:pointer; display:flex;
                  align-items:center; justify-content:center; border-radius:50%;
                  width:34px; height:34px;
                  transition:background .15s; position:relative; color:#6b7775; }
        .nb-btn:hover { background:rgba(11,67,53,0.07); color:#0b4335; }
        .nb-drop { position:absolute; top:calc(100% + 8px); background:#fff;
                   border:1px solid #D9DAD8; border-radius:6px;
                   box-shadow:0 8px 32px rgba(0,0,0,0.10); z-index:200; overflow:hidden; }
        .nb-row { display:flex; align-items:center; gap:10px; padding:10px 16px;
                  font-family:'Inter',sans-serif; font-size:13px; color:#404945;
                  cursor:pointer; text-decoration:none; transition:background .12s;
                  border:none; background:none; width:100%; box-sizing:border-box; }
        .nb-row:hover { background:#FAF9F6; color:#0b4335; }
        .nb-row.danger:hover { background:#fff5f5; color:#ba1a1a; }
        .nb-sep { height:1px; background:#D9DAD8; margin:2px 0; }
        .nb-input { height:36px; border:1px solid #E8E8E8;
            border-radius:8px; background:#FAFAFA;
            font-family:'Inter',sans-serif;
            font-size:13px; color:#191c1b; outline:none;
            transition:all 0.35s cubic-bezier(0.4, 0, 0.2, 1); box-sizing:border-box; }
.nb-input:hover, .nb-input:focus { border-color:#D0D0D0; background:#fff; box-shadow:0 2px 8px rgba(0,0,0,0.04); }
.nb-input::placeholder { color:#B0B0B0; font-size:13px; }
        .lang-btn { display:flex; align-items:center; gap:8px;
                    background:none; border:none; cursor:pointer;
                    color:#6b7775; padding:6px 10px; border-radius:6px;
                    font-family:'Inter',sans-serif; font-size:13px; font-weight:600;
                    transition:all .15s; }
        .lang-btn:hover { background:rgba(11,67,53,0.07); color:#0b4335; }
        .lang-opt { display:flex; align-items:center; justify-content:space-between;
                    gap:8px; padding:9px 14px; font-family:'JetBrains Mono',monospace;
                    font-size:11px; font-weight:600; color:#404945;
                    cursor:pointer; transition:background .12s; letter-spacing:0.06em; }
        .lang-opt:hover { background:#FAF9F6; color:#0b4335; }
        .lang-opt.active { color:#0b4335; background:rgba(11,67,53,0.05); }
        .profile-btn { background:none; border:none; cursor:pointer; display:flex;
                       align-items:center; gap:10px; padding:6px 10px;
                       border-radius:8px; transition:background .15s;
                       justify-content:flex-start; }
        .profile-btn:hover { background:rgba(11,67,53,0.07); }
      `}</style>

      <header
        dir={isRTL ? "rtl" : "ltr"}
        style={{
          height: 64,
         backgroundImage: `url(${bgImage})`,
  backgroundSize: "cover",
  backgroundPosition: "center",
  backgroundRepeat: "no-repeat",
  backgroundColor: "#FAF9F6",
  borderBottom: "1px solid #D9DAD8",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          
          padding: "0 32px",
          gap: 24,
          
          zIndex: 30,
        }}
      >
        {/* Left Section - Page Title */}
        <div style={{ display: "flex", alignItems: "center", gap: 24, flex: 1 }}>
          
        </div>

  {/* Center - Search Bar */}
<div style={{ 
  flex: "0 0 auto", 
  display: "flex", 
 justifyContent: "center"
}}>
  <div style={{ 
    position: "relative", 
    width: searchFocused ? "250px" : "200px", 
    transition: "width 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
  }}>
    <span className="ms" style={{
      position: "absolute",
      left: isRTL ? "auto" : 12,
      right: isRTL ? 12 : "auto",
      top: "50%", transform: "translateY(-50%)",
      fontSize: 18, color: "#999", pointerEvents: "none",
      zIndex: 1,
    }}>search</span>
    <input
      className="nb-input"
      type="text"
      dir={isRTL ? "rtl" : "ltr"}
      placeholder={t("navbar.searchPlaceholder")}
      onFocus={() => setSearchFocused(true)}
      onBlur={() => setSearchFocused(false)}
      onMouseEnter={() => setSearchFocused(true)}
      onMouseLeave={(e) => { if (document.activeElement !== e.target) setSearchFocused(false); }}
      style={{
        width: "100%",
        paddingLeft:  searchFocused ? (isRTL ? 16 : 40) : 40,
        paddingRight: searchFocused ? (isRTL ? 40 : 16) : 40,
        cursor: searchFocused ? "text" : "pointer",
      }}
    />
  </div>
</div>

        {/* Right Section - Controls */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
             flex: "0 0 auto",
            justifyContent: isRTL ? "flex-start" : "flex-end",
             
          }}
        >
          {/* Divider */}
          <div style={{ 
            width: 1, 
            height: 24, 
            background: "#E4E3E0", 
            margin: "0 12px",
          }} />

          {/* Language Button */}
          <div ref={langRef} style={{ position: "relative" }}>
            <button
              className="lang-btn"
              onClick={() => { setLangOpen(v => !v); setNotifOpen(false); setProfileOpen(false); }}
            >
              <span className="ms" style={{ fontSize: 20, color: "#6b7775" }}>language</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#404945" }}>{lang}</span>
            </button>

            {langOpen && (
              <div className="nb-drop" style={{
                left: isRTL ? 0 : "auto",
                right: isRTL ? "auto" : 0,
                minWidth: 130,
              }}>
                <div style={{ padding: "8px 14px 6px", fontFamily: "'JetBrains Mono',monospace",
                              fontSize: 9, fontWeight: 700, letterSpacing: "0.18em",
                              textTransform: "uppercase", color: "#c0c9c3" }}>
                  {t("navbar.language")}
                </div>
                {(["EN", "AR", "FR"] as Lang[]).map((l) => (
                  <div
                    key={l}
                    className={`lang-opt${lang === l ? " active" : ""}`}
                    onClick={() => { setLang(l); setLangOpen(false); }}
                  >
                    <span>{l === "EN" ? "English" : l === "AR" ? "العربية" : "Français"}</span>
                    {lang === l && (
                      <span className="ms" style={{ fontSize: 14, color: "#0b4335" }}>check</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Notifications */}
          <div ref={notifRef} style={{ position: "relative" }}>
            <button className="nb-btn" onClick={() => { setNotifOpen(v => !v); setProfileOpen(false); setLangOpen(false); }}>
              <span className="ms" style={{ fontSize: 21 }}>notifications</span>
              <span style={{
                position: "absolute", top: 6, right: 6,
                width: 7, height: 7, background: "#ba1a1a",
                borderRadius: "50%", border: "1.5px solid #FAF9F6",
              }} />
            </button>

            {notifOpen && (
              <div className="nb-drop" style={{
                width: 304,
                left: isRTL ? 0 : "auto",
                right: isRTL ? "auto" : 0,
              }}>
                <div style={{
                  padding: "12px 16px", borderBottom: "1px solid #D9DAD8",
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                }}>
                  <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10,
                                 fontWeight: 700, color: "#0b4335", letterSpacing: "0.14em",
                                 textTransform: "uppercase" }}>
                    {t("navbar.notifications")}
                  </span>
                  <span style={{ fontFamily: "'Inter',sans-serif", fontSize: 10, fontWeight: 700,
                                 background: "#C9A84C", color: "#fff",
                                 borderRadius: 99, padding: "1px 7px" }}>
                    {NOTIFS.length}
                  </span>
                </div>
                {NOTIFS.map((n, i) => (
                  <div key={i} className="nb-row"
                    style={{ borderBottom: i < NOTIFS.length - 1 ? "1px solid #f0efec" : "none", gap: 12 }}>
                    <div style={{ width: 7, height: 7, borderRadius: "50%",
                                  background: n.color, flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 12.5, color: "#191c1b" }}>
                        {t(n.titleKey)}
                      </div>
                      <div style={{ fontSize: 11.5, color: "#6b7775", fontStyle: "italic", marginTop: 2 }}>
                        {t(n.subKey)}
                      </div>
                    </div>
                    <div style={{ fontSize: 10, color: "#c0c9c3", flexShrink: 0 }}>{n.time}</div>
                  </div>
                ))}
                <div style={{ padding: "10px 16px", borderTop: "1px solid #D9DAD8" }}>
                  <button style={{
                    width: "100%", padding: "8px 0",
                    border: "1.5px solid #D9DAD8", borderRadius: 4,
                    background: "transparent", fontFamily: "'JetBrains Mono',monospace",
                    fontSize: 10, fontWeight: 700, letterSpacing: "0.12em",
                    textTransform: "uppercase", color: "#0b4335", cursor: "pointer",
                  }}>
                    {t("navbar.viewAll")}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Profile */}
          <div ref={profileRef} style={{ position: "relative", marginLeft: isRTL ? 0 : 4, marginRight: isRTL ? 4 : 0 }}>
            <button
              className="profile-btn"
              style={{
                flexDirection: isRTL ? "row-reverse" : "row",
              }}
              onClick={() => { setProfileOpen(v => !v); setNotifOpen(false); setLangOpen(false); }}
            >
              {/* Avatar */}
              <div style={{
                width: 36, height: 36, borderRadius: "50%",
                background: "linear-gradient(135deg, #0b4335 60%, #285B4B 100%)",
                border: "2px solid #C9A84C",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0, overflow: "hidden",
              }}>
                <span style={{
                  fontFamily: "'Inter',sans-serif",
                  fontSize: 13, fontWeight: 700,
                  color: "#C9A84C", letterSpacing: "-0.02em",
                }}>
                  {t("navbar.adminName").charAt(0).toUpperCase()}
                </span>
              </div>

              <div style={{ textAlign: isRTL ? "right" : "left" }}>
                <div style={{
                  fontFamily: "'Inter',sans-serif", fontSize: 13, fontWeight: 700,
                  color: "#191c1b", lineHeight: 1.3,
                }}>
                  {t("navbar.adminName")}
                </div>
                <div style={{
                  fontFamily: "'Inter',sans-serif", fontSize: 11,
                  color: "#6b7775", lineHeight: 1.2,
                }}>
                  {t("navbar.adminRole")}
                </div>
              </div>
            </button>

            {profileOpen && (
              <div className="nb-drop" style={{
                width: 192,
                left: isRTL ? 0 : "auto",
                right: isRTL ? "auto" : 0,
              }}>
                <a href="/admin/profile" className="nb-row">
                  <span className="ms" style={{ fontSize: 17, color: "#0b4335" }}>manage_accounts</span>
                  {t("navbar.profile")}
                </a>
                <a href="/admin/settings" className="nb-row">
                  <span className="ms" style={{ fontSize: 17, color: "#0b4335" }}>settings</span>
                  {t("navbar.settings")}
                </a>
                <div className="nb-sep" />
                <a href="/logout" className="nb-row danger">
                  <span className="ms" style={{ fontSize: 17 }}>logout</span>
                  {t("navbar.signOut")}
                </a>
              </div>
            )}
          </div>

        </div>
      </header>
    </>
  );
}