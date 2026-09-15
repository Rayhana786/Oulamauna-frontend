// src/pages/ProfilePage.tsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useLang } from "../../context/LanguageContext";
import { useAuth } from "../../context/AuthContext";
import { userApi } from "../../api/userApi";

type Role = "user" | "contributor" | "admin";
type ProfileStatus = "deleted" | "banned" | "deactivated" | "private" | "registered_only";

interface Contribution { id: number; title: string; description: string; time: string; tag: string; type: string; scholarId: number | null; lang: string | null; }
interface ForumPost { id: number; title: string; excerpt: string; time: string; category: string; replies: number; }
interface ProfileData { id: string; username: string; displayName: string; fullName: string; email: string; role_id: number; role: Role; bio: string; country: string; joined: string; links: string[]; profile_picture: string | null; avatarInitial: string; contributions: Contribution[]; forumPosts: ForumPost[]; contributionsHidden: boolean; }

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

const BTN_PRIMARY: React.CSSProperties = { display: "inline-flex", alignItems: "center", gap: "6px", padding: "8px 16px", border: "2px solid #0b4335", borderRadius: "8px", backgroundColor: "transparent", color: "#0b4335", cursor: "pointer", transition: "all 0.3s", ...MONO, fontSize: "12px", fontWeight: 600, letterSpacing: "0.03em", textDecoration: "none" };

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => (typeof window !== "undefined" ? window.innerWidth < 768 : false));
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return isMobile;
}

function Icon({ name, size = 16, style }: { name: string; size?: number; style?: React.CSSProperties }) {
  return (
    <span className="material-symbols-outlined" style={{ fontSize: `${size}px`, lineHeight: 1, userSelect: "none", ...style }}>
      {name}
    </span>
  );
}

function HoverCard({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  const [hov, setHov] = useState(false);
  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} style={{ border: `1px solid rgba(11, 67, 53, 0.1)`, backgroundColor: CARD_BG, borderRadius: "12px", boxShadow: hov ? "0px 6px 24px rgba(11, 67, 53, 0.12)" : "0px 4px 20px rgba(11, 67, 53, 0.08)", transform: hov ? "translateY(-2px)" : "translateY(0)", transition: "all 0.3s ease", ...style }}>
      {children}
    </div>
  );
}

function HoverBtn({ children, onClick, style }: { children: React.ReactNode; onClick?: () => void; style?: React.CSSProperties }) {
  const [hov, setHov] = useState(false);
  return (
    <button onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} style={{ ...BTN_PRIMARY, backgroundColor: hov ? GREEN : "transparent", color: hov ? BG : GREEN, ...style }}>
      {children}
    </button>
  );
}

function RoleBadge({ role, t }: { role: Role; t: (k: string) => string }) {
  let iconName = "person";
  let label = t("profile.roleUser");
  if (role === "admin") { iconName = "admin_panel_settings"; label = t("profile.roleAdmin"); } 
  else if (role === "contributor") { iconName = "edit_document"; label = t("profile.roleContributor"); }
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "4px 10px", borderRadius: "6px", border: `1px solid ${BORDER}`, backgroundColor: "rgba(11, 67, 53, 0.04)", color: GREEN, ...MONO, fontSize: "10px", fontWeight: 700, letterSpacing: "0.05em", whiteSpace: "nowrap" }}>
      <Icon name={iconName} size={14} /> {label}
    </span>
  );
}

function SocialIconBtn({ href }: { href: string }) {
  const [hov, setHov] = useState(false);
  const normalized = href.startsWith("http://") || href.startsWith("https://") ? href : `https://${href}`;
  return (
    <a href={normalized} target="_blank" rel="noopener noreferrer" title={href.replace(/^https?:\/\//, "")} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} style={{ width: "34px", height: "34px", borderRadius: "50%", border: `1.5px solid ${hov ? GREEN : BORDER}`, backgroundColor: hov ? GREEN : "transparent", color: hov ? BG : GREEN, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.3s" }}>
      <Icon name="link" size={15} />
    </a>
  );
}

function StatTile({ value, label }: { value: string | number; label: string }) {
  return (
    <HoverCard style={{ padding: "12px 10px", textAlign: "center" }}>
      <p style={{ ...SERIF, fontSize: "18px", fontWeight: 700, color: GREEN, margin: "0 0 2px" }}>{value}</p>
      <p style={{ ...MONO, fontSize: "9px", color: MUTED, letterSpacing: "0.05em", textTransform: "uppercase", margin: 0 }}>{label}</p>
    </HoverCard>
  );
}

function StatBlock({ value, label }: { value: string | number; label: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
      <span style={{ ...SERIF, fontSize: "24px", fontWeight: 700, color: GREEN }}>{value}</span>
      <span style={{ ...MONO, fontSize: "10px", color: MUTED, letterSpacing: "0.08em", textTransform: "uppercase" }}>{label}</span>
    </div>
  );
}

function SectionHeader({ icon, title, count, isMobile }: { icon: string; title: string; count: number; isMobile: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: isMobile ? "12px" : "16px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <Icon name={icon} size={18} style={{ color: GREEN }} />
        <h2 style={{ ...SERIF, fontSize: isMobile ? "15px" : "17px", fontWeight: 700, color: GREEN, margin: 0 }}>{title}</h2>
      </div>
      <span style={{ ...MONO, fontSize: "10px", color: MUTED, backgroundColor: "rgba(11, 67, 53, 0.06)", padding: "3px 9px", borderRadius: "999px", border: `1px solid ${BORDER}` }}>{count}</span>
    </div>
  );
}

function ContributionCard({ item, isMobile, onClick, t }: { item: Contribution; isMobile: boolean; onClick: () => void; t: (k: string) => string }) {
  const [hov, setHov] = useState(false);
  
  const getTagLabel = (tag: string) => {
    switch(tag) {
      case "Media": return t("profile.contributionTag.media");
      case "Translation": return t("profile.contributionTag.translation");
      case "Research": return t("profile.contributionTag.research");
      default: return t("profile.contributionTag.annotation");
    }
  };

  if (isMobile) {
    return (
      <div onClick={onClick} style={{ display: "flex", alignItems: "flex-start", gap: "12px", padding: "14px", border: `1px solid ${BORDER}`, borderRadius: "10px", backgroundColor: CARD_BG, cursor: "pointer" }}>
        <div style={{ width: "36px", height: "36px", borderRadius: "8px", flexShrink: 0, backgroundColor: "rgba(11, 67, 53, 0.08)", display: "flex", alignItems: "center", justifyContent: "center", color: GREEN }}>
          <Icon name={item.tag === "Media" ? "perm_media" : item.tag === "Translation" ? "translate" : item.tag === "Research" ? "science" : "edit_note"} size={18} />
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <h3 style={{ ...SERIF, fontSize: "13px", fontWeight: 700, color: GREEN, margin: "0 0 4px" }}>{item.title}</h3>
          <p style={{ ...SANS, fontSize: "12px", color: MUTED, margin: "0 0 6px", lineHeight: 1.5 }}>{item.description}</p>
          <span style={{ ...MONO, fontSize: "10px", color: MUTED, display: "flex", alignItems: "center", gap: "4px" }}><Icon name="schedule" size={12} /> {item.time}</span>
        </div>
      </div>
    );
  }
  return (
    <div onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} style={{ display: "flex", flexDirection: "column", gap: "12px", padding: "20px", border: `1px solid ${BORDER}`, borderRadius: "12px", backgroundColor: hov ? "rgba(11, 67, 53, 0.04)" : CARD_BG, borderColor: hov ? GREEN : BORDER, transition: "all 0.3s ease", cursor: "pointer", transform: hov ? "translateY(-2px)" : "translateY(0)", boxShadow: hov ? "0px 6px 24px rgba(11, 67, 53, 0.12)" : "0px 4px 20px rgba(11, 67, 53, 0.08)" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "8px" }}>
        <span style={{ ...MONO, fontSize: "10px", padding: "4px 10px", borderRadius: "6px", backgroundColor: "rgba(11, 67, 53, 0.08)", border: `1px solid rgba(11, 67, 53, 0.2)`, color: GREEN, fontWeight: 700, letterSpacing: "0.05em" }}>{getTagLabel(item.tag)}</span>
        <Icon name="arrow_forward" size={16} style={{ color: MUTED, flexShrink: 0 }} />
      </div>
      <div>
        <h3 style={{ ...SERIF, fontSize: "15px", fontWeight: 700, color: GREEN, margin: "0 0 6px" }}>{item.title}</h3>
        <p style={{ ...SANS, fontSize: "13px", color: MUTED, margin: 0, lineHeight: 1.6 }}>{item.description}</p>
      </div>
      <span style={{ ...MONO, fontSize: "11px", color: MUTED, display: "flex", alignItems: "center", gap: "4px" }}><Icon name="schedule" size={13} /> {item.time}</span>
    </div>
  );
}

function ForumPostCard({ item, isMobile, onClick, t }: { item: ForumPost; isMobile: boolean; onClick: () => void; t: (k: string) => string }) {
  const [hov, setHov] = useState(false);
  if (isMobile) {
    return (
      <div onClick={onClick} style={{ display: "flex", alignItems: "flex-start", gap: "12px", padding: "14px", border: `1px solid ${BORDER}`, borderRadius: "10px", backgroundColor: CARD_BG, cursor: "pointer" }}>
        <div style={{ width: "36px", height: "36px", borderRadius: "8px", flexShrink: 0, backgroundColor: "rgba(184, 134, 11, 0.10)", display: "flex", alignItems: "center", justifyContent: "center", color: GOLD }}>
          <Icon name="forum" size={18} />
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <h3 style={{ ...SERIF, fontSize: "13px", fontWeight: 700, color: GREEN, margin: "0 0 4px" }}>{item.title}</h3>
          <p style={{ ...SANS, fontSize: "12px", color: MUTED, margin: "0 0 6px", lineHeight: 1.5 }}>{item.excerpt}</p>
          <span style={{ ...MONO, fontSize: "10px", color: MUTED, display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><Icon name="schedule" size={12} /> {item.time}</span>
            <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><Icon name="chat_bubble" size={12} /> {item.replies}</span>
          </span>
        </div>
      </div>
    );
  }
  return (
    <div onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} style={{ display: "flex", flexDirection: "column", gap: "12px", padding: "20px", border: `1px solid ${BORDER}`, borderRadius: "12px", backgroundColor: hov ? "rgba(184, 134, 11, 0.05)" : CARD_BG, borderColor: hov ? GOLD : BORDER, transition: "all 0.3s ease", cursor: "pointer", transform: hov ? "translateY(-2px)" : "translateY(0)", boxShadow: hov ? "0px 6px 24px rgba(184, 134, 11, 0.12)" : "0px 4px 20px rgba(11, 67, 53, 0.08)" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "8px" }}>
        <span style={{ ...MONO, fontSize: "10px", padding: "4px 10px", borderRadius: "6px", backgroundColor: "rgba(184, 134, 11, 0.10)", border: `1px solid rgba(184, 134, 11, 0.25)`, color: GOLD, fontWeight: 700, letterSpacing: "0.05em" }}>{item.category}</span>
        <Icon name="arrow_forward" size={16} style={{ color: MUTED, flexShrink: 0 }} />
      </div>
      <div>
        <h3 style={{ ...SERIF, fontSize: "15px", fontWeight: 700, color: GREEN, margin: "0 0 6px" }}>{item.title}</h3>
        <p style={{ ...SANS, fontSize: "13px", color: MUTED, margin: 0, lineHeight: 1.6 }}>{item.excerpt}</p>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        <span style={{ ...MONO, fontSize: "11px", color: MUTED, display: "flex", alignItems: "center", gap: "4px" }}><Icon name="schedule" size={13} /> {item.time}</span>
        <span style={{ ...MONO, fontSize: "11px", color: MUTED, display: "flex", alignItems: "center", gap: "4px" }}><Icon name="chat_bubble" size={13} /> {item.replies} {item.replies === 1 ? t("profile.reply") : t("profile.replies")}</span>
      </div>
    </div>
  );
}

const fontImports = (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;700&display=swap');
    @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap');
    .material-symbols-outlined { font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24; font-family: 'Material Symbols Outlined'; display: inline-block; vertical-align: middle; }
    .profile-feed-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 28px; align-items: start; }
    @media (max-width: 900px) { .profile-feed-grid { grid-template-columns: 1fr; gap: 28px; } }
  `}</style>
);

const COVER_STYLE: React.CSSProperties = { height: "108px", width: "100%", background: `linear-gradient(120deg, rgba(11,67,53,0.92) 0%, rgba(11,67,53,0.75) 55%, rgba(184,134,11,0.55) 100%)` };

function DesktopProfileCard({ profile, showEditButton, onEdit, editLabel, openImageModal, t }: { profile: ProfileData; showEditButton: boolean; onEdit: () => void; editLabel: string; openImageModal: () => void; t: (k: string) => string }) {
  return (
    <HoverCard style={{ overflow: "hidden", width: "100%" }}>
      <div style={COVER_STYLE} />
      <div style={{ padding: "0 32px 28px" }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: "16px", marginTop: "-40px" }}>
          <div onClick={openImageModal} style={{ width: "96px", height: "96px", borderRadius: "50%", backgroundColor: CARD_BG, display: "flex", alignItems: "center", justifyContent: "center", color: GREEN, ...SERIF, fontSize: "34px", fontWeight: 700, border: `4px solid ${CARD_BG}`, boxShadow: "0px 4px 16px rgba(11, 67, 53, 0.18)", flexShrink: 0, overflow: "hidden", cursor: profile?.profile_picture ? 'pointer' : 'default', transition: 'transform 0.3s' }}
            onMouseEnter={(e) => { if (profile?.profile_picture) e.currentTarget.style.transform = 'scale(1.05)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}>
            {profile.profile_picture ? <img src={profile.profile_picture} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : profile.avatarInitial}
          </div>
          {showEditButton && <div style={{ marginBottom: "6px" }}><HoverBtn onClick={onEdit}><Icon name="edit_square" size={14} /> {editLabel}</HoverBtn></div>}
        </div>
        <div style={{ marginTop: "16px", display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          <h1 style={{ ...SERIF, fontSize: "24px", fontWeight: 700, color: GREEN, margin: 0 }}>{profile.displayName}</h1>
          <RoleBadge role={profile.role} t={t} />
        </div>
        <p style={{ ...SANS, fontSize: "13px", color: MUTED, margin: "4px 0 0" }}>@{profile.username}</p>
        {profile.email && <p style={{ ...MONO, fontSize: "12px", color: MUTED, margin: "6px 0 0", display: "flex", alignItems: "center", gap: "6px" }}><Icon name="mail" size={14} style={{ color: GREEN }} /> {profile.email}</p>}
        {profile.bio && <p style={{ ...SANS, fontSize: "14px", lineHeight: 1.7, color: GREEN, margin: "16px 0 0", maxWidth: "680px" }}>{profile.bio}</p>}
        {(profile.country || profile.joined) && (
          <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap", margin: "14px 0 0" }}>
            {profile.country && <span style={{ ...MONO, fontSize: "11px", color: MUTED, display: "flex", alignItems: "center", gap: "4px" }}><Icon name="location_on" size={14} style={{ color: GREEN }} /> {profile.country}</span>}
            {profile.joined && <span style={{ ...MONO, fontSize: "11px", color: MUTED, display: "flex", alignItems: "center", gap: "4px" }}><Icon name="calendar_today" size={13} style={{ color: GREEN }} /> {t("profile.joined")} {profile.joined}</span>}
          </div>
        )}
        {profile.links.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "flex-start", gap: "8px", margin: "16px 0 0" }}>
            {profile.links.map((link, i) => {
              let displayText = link;
              try { const url = new URL(link); displayText = url.hostname.replace('www.', ''); } catch {}
              return (
                <a key={`${link}-${i}`} href={link} target="_blank" rel="noopener noreferrer" title={link} style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "6px", padding: "6px 14px", backgroundColor: "rgba(11, 67, 53, 0.04)", border: `1px solid ${BORDER}`, borderRadius: "20px", textDecoration: "none", color: GREEN, ...SANS, fontSize: "11px", fontWeight: 500, transition: "all 0.2s", whiteSpace: "nowrap" }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = GREEN; e.currentTarget.style.color = BG; e.currentTarget.style.borderColor = GREEN; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "rgba(11, 67, 53, 0.04)"; e.currentTarget.style.color = GREEN; e.currentTarget.style.borderColor = BORDER; }}>
                  <Icon name="link" size={13} /> <span>{displayText}</span>
                </a>
              );
            })}
          </div>
        )}
        <div style={{ borderTop: `1px solid ${BORDER}`, margin: "20px 0 0", paddingTop: "18px" }}>
          <div style={{ display: "flex", gap: "36px" }}>
            <StatBlock value={profile.contributions.length} label={t("profile.stats.contributions")} />
            <StatBlock value={profile.forumPosts.length} label={t("profile.stats.forumPosts")} />
          </div>
        </div>
      </div>
    </HoverCard>
  );
}

function MobileProfileCard({ profile, showEditButton, onEdit, editLabel, openImageModal, t }: { profile: ProfileData; showEditButton: boolean; onEdit: () => void; editLabel: string; openImageModal: () => void; t: (k: string) => string }) {
  return (
    <HoverCard style={{ overflow: "hidden", width: "100%" }}>
      <div style={{ ...COVER_STYLE, height: "72px" }} />
      <div style={{ padding: "0 20px 20px", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
        <div onClick={openImageModal} style={{ width: "78px", height: "78px", borderRadius: "50%", backgroundColor: CARD_BG, display: "flex", alignItems: "center", justifyContent: "center", color: GREEN, ...SERIF, fontSize: "28px", fontWeight: 700, border: `4px solid ${CARD_BG}`, boxShadow: "0px 4px 16px rgba(11, 67, 53, 0.18)", flexShrink: 0, marginTop: "-38px", overflow: "hidden", cursor: profile?.profile_picture ? 'pointer' : 'default', transition: 'transform 0.3s' }}
          onMouseEnter={(e) => { if (profile?.profile_picture) e.currentTarget.style.transform = 'scale(1.05)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}>
          {profile.profile_picture ? <img src={profile.profile_picture} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : profile.avatarInitial}
        </div>
        <h1 style={{ ...SERIF, fontSize: "19px", fontWeight: 700, color: GREEN, margin: "12px 0 0" }}>{profile.displayName}</h1>
        <p style={{ ...SANS, fontSize: "13px", color: MUTED, margin: "3px 0 0" }}>@{profile.username}</p>
        {profile.email && <p style={{ ...MONO, fontSize: "11px", color: MUTED, margin: "4px 0 0", display: "flex", alignItems: "center", gap: "5px" }}><Icon name="mail" size={13} style={{ color: GREEN }} /> {profile.email}</p>}
        <div style={{ marginTop: "8px" }}><RoleBadge role={profile.role} t={t} /></div>
        {profile.bio && <p style={{ ...SANS, fontSize: "13px", lineHeight: 1.6, color: GREEN, margin: "14px 0 0", textAlign: "left", alignSelf: "stretch" }}>{profile.bio}</p>}
        {(profile.country || profile.joined) && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "14px", flexWrap: "wrap", margin: "12px 0 0" }}>
            {profile.country && <span style={{ ...MONO, fontSize: "11px", color: MUTED, display: "flex", alignItems: "center", gap: "4px" }}><Icon name="location_on" size={14} style={{ color: GREEN }} /> {profile.country}</span>}
            {profile.joined && <span style={{ ...MONO, fontSize: "11px", color: MUTED, display: "flex", alignItems: "center", gap: "4px" }}><Icon name="calendar_today" size={13} style={{ color: GREEN }} /> {t("profile.joined")} {profile.joined}</span>}
          </div>
        )}
        {profile.links.length > 0 && (
          <div style={{ display: "flex", justifyContent: "center", gap: "8px", flexWrap: "wrap", margin: "14px 0 0" }}>
            {profile.links.map((link, i) => <SocialIconBtn key={`${link}-${i}`} href={link} />)}
          </div>
        )}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "8px", width: "100%", marginTop: "18px" }}>
          <StatTile value={profile.contributions.length} label={t("profile.stats.contribs")} />
          <StatTile value={profile.forumPosts.length} label={t("profile.stats.forum")} />
        </div>
        {showEditButton && (
          <button onClick={onEdit} style={{ ...BTN_PRIMARY, marginTop: "16px", width: "100%", justifyContent: "center", padding: "11px 16px", fontSize: "12px", backgroundColor: GREEN, color: BG }}>
            <Icon name="edit_square" size={14} /> {editLabel}
          </button>
        )}
      </div>
    </HoverCard>
  );
}

function ProfileCard(props: { profile: ProfileData; showEditButton: boolean; onEdit: () => void; editLabel: string; isMobile: boolean; openImageModal: () => void; t: (k: string) => string }) {
  return props.isMobile ? <MobileProfileCard {...props} /> : <DesktopProfileCard {...props} />;
}

function ActivityFeeds({ profile, isMobile, onContributionClick, onPostClick, t }: { profile: ProfileData; isMobile: boolean; onContributionClick: (c: Contribution) => void; onPostClick: (p: ForumPost) => void; t: (k: string) => string }) {
  return (
    <div className="profile-feed-grid">
      <section>
        <SectionHeader icon="edit_note" title={t("profile.activity.recentContributions")} count={profile.contributions.length} isMobile={isMobile} />
        {profile.contributionsHidden ? (
          <p style={{ ...SANS, fontSize: "13px", color: MUTED, display: "flex", alignItems: "center", gap: "6px" }}><Icon name="visibility_off" size={15} style={{ color: MUTED }} /> {t("profile.activity.hiddenContributions")}</p>
        ) : profile.contributions.length === 0 ? (
          <p style={{ ...SANS, fontSize: "13px", color: MUTED }}>{t("profile.activity.noContributions")}</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: isMobile ? "10px" : "14px" }}>
            {profile.contributions.map((c) => <ContributionCard key={c.id} item={c} isMobile={isMobile} onClick={() => onContributionClick(c)} t={t} />)}
          </div>
        )}
      </section>
      <section>
        <SectionHeader icon="forum" title={t("profile.activity.forumActivity")} count={profile.forumPosts.length} isMobile={isMobile} />
        {profile.forumPosts.length === 0 ? (
          <p style={{ ...SANS, fontSize: "13px", color: MUTED }}>{t("profile.activity.noForumActivity")}</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: isMobile ? "10px" : "14px" }}>
            {profile.forumPosts.map((p) => <ForumPostCard key={p.id} item={p} isMobile={isMobile} onClick={() => onPostClick(p)} t={t} />)}
          </div>
        )}
      </section>
    </div>
  );
}

const mapRoleIdToRole = (roleId: number | undefined, contributorBadge?: boolean | null, adminBadge?: boolean | null): Role => {
  if (adminBadge === true) return "admin";
  if (contributorBadge === true) return "contributor";
  if (roleId === 1) return "admin";
  if (roleId === 2 || roleId === 3) return "contributor";
  return "user";
};

const STATUS_CONFIG: Record<ProfileStatus, { icon: string; titleKey: string }> = {
  deleted: { icon: "person_off", titleKey: "profile.status.deleted" },
  banned: { icon: "gpp_bad", titleKey: "profile.status.banned" },
  deactivated: { icon: "visibility_off", titleKey: "profile.status.deactivated" },
  private: { icon: "lock", titleKey: "profile.status.private" },
  registered_only: { icon: "person_add", titleKey: "profile.status.registeredOnly" },
};

const TAG_BY_TYPE: Record<string, string> = { scholar: "Annotation", edition: "Translation", media: "Media", work: "Research" };

async function fetchContributions(userId: number, t: (k: string) => string): Promise<Contribution[]> {
  try {
    const res = await userApi.profile.getContributions(userId);
    if (!res.data.success || !res.data.data) return [];
    return res.data.data.map((c: any) => ({
      id: c.id, 
      title: c.title || t("profile.contribution.untitled"),
      description: c.type === "media" 
        ? t("profile.contribution.mediaUpload") 
        : c.type === "edition" 
          ? `${t("profile.contribution.newEdition")}${c.lang ? ` (${c.lang.toUpperCase()})` : ""}` 
          : c.type === "work" 
            ? `${c.format ? c.format.charAt(0) + c.format.slice(1).toLowerCase() : t("profile.contribution.work")} ${t("profile.contribution.submission")}` 
            : t("profile.contribution.newScholarEntry"),
      time: c.created_at ? new Date(c.created_at).toLocaleDateString() : "", 
      tag: TAG_BY_TYPE[c.type] ?? "Annotation", 
      type: c.type, 
      scholarId: c.scholar_id, 
      lang: c.lang,
    }));
  } catch (err) { console.error("Failed to fetch contributions:", err); return []; }
}

async function fetchForumPosts(userId: number, t: (k: string) => string): Promise<ForumPost[]> {
  try {
    const res = await userApi.profile.getForumPosts(userId);
    if (!res.data.success || !res.data.data) return [];
    return res.data.data.map((p: any) => ({
      id: p.post_id, 
      title: p.title, 
      excerpt: p.excerpt, 
      time: new Date(p.created_at).toLocaleDateString(), 
      category: p.category || t("profile.forum.general"), 
      replies: p.reply_count,
    }));
  } catch (err) { console.error("Failed to fetch forum posts:", err); return []; }
}

export default function ProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { lang, t } = useLang();
  const { user, isLoggedIn, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const isRTL = lang === "AR";
  const isMobile = useIsMobile();

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [profileStatus, setProfileStatus] = useState<{ type: ProfileStatus; username?: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imageModalOpen, setImageModalOpen] = useState(false);

  const openImageModal = () => { if (profile?.profile_picture) { setImageModalOpen(true); document.body.style.overflow = 'hidden'; } };
  const closeImageModal = () => { setImageModalOpen(false); document.body.style.overflow = 'unset'; };

  const ImageModal = () => {
    if (!imageModalOpen || !profile?.profile_picture) return null;
    return (
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.9)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }} onClick={closeImageModal}>
        <button onClick={closeImageModal} style={{ position: 'absolute', top: '20px', right: '20px', background: 'rgba(255, 255, 255, 0.1)', border: 'none', color: 'white', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '24px', transition: 'all 0.3s', zIndex: 1001 }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)'; e.currentTarget.style.transform = 'rotate(90deg)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'; e.currentTarget.style.transform = 'rotate(0deg)'; }}>×</button>
        <img src={profile.profile_picture} alt="Profile" style={{ maxWidth: '90%', maxHeight: '90%', objectFit: 'contain', borderRadius: '8px', boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)' }} onClick={(e) => e.stopPropagation()} />
      </div>
    );
  };

  useEffect(() => {
    const fetchProfile = async () => {
      if (!id && (!isLoggedIn || !user)) { setIsLoading(false); return; }
      setIsLoading(true);
      setError(null);
      setProfileStatus(null);
      try {
        if (!id) {
          const response = await userApi.profile.getMyProfile();
          if (response.data.success && response.data.data) {
            const data = response.data.data;
            const resolvedId = (data as any).id ?? user?.id;
            const [contributions, forumPosts] = resolvedId ? await Promise.all([fetchContributions(resolvedId, t), fetchForumPosts(resolvedId, t)]) : [[], []];
            setProfile({
              id: String((data as any).id || user?.id || "me"), username: data.username || "user", displayName: data.name || data.username || "User", fullName: data.name || "", email: data.email || "", role_id: data.role_id || 3,
              role: mapRoleIdToRole(data.role_id, data.contributorBadge, (data as any).adminBadge), bio: data.bio || "", country: "", joined: (data as any).created_at ? new Date((data as any).created_at).toLocaleDateString() : "",
              links: (() => { if (!data.links) return []; if (typeof data.links === "string") { try { return JSON.parse(data.links); } catch { return []; } } if (Array.isArray(data.links)) return data.links; if (typeof data.links === "object") return Object.values(data.links); return []; })(),
              profile_picture: data.profile_picture || null, avatarInitial: (data.name || data.username || "U").charAt(0).toUpperCase(), contributions, forumPosts, contributionsHidden: false,
            });
          } else { setError(t("profile.error.general")); }
        } else {
          const targetId = parseInt(id);
          if (isNaN(targetId)) { setError(t("profile.error.notFound.title")); setIsLoading(false); return; }
          const response = await userApi.profile.getPublicProfile(targetId);
          if (response.data.success && response.data.data) {
            const data = response.data.data as any;
            const STUB_STATUSES = ["deleted", "banned", "deactivated", "private", "registered_only"];
            if (STUB_STATUSES.includes(data.status)) {
              setProfileStatus({ type: data.status as ProfileStatus, username: data.status === "deactivated" ? (data.username || undefined) : undefined });
              setIsLoading(false);
              return;
            }
            const [contributions, forumPosts] = await Promise.all([data.show_contributions ? fetchContributions(targetId, t) : Promise.resolve([]), fetchForumPosts(targetId, t)]);
            setProfile({
              id: id, username: data.username || "user", displayName: data.name || data.username || "User", fullName: data.name || "", email: data.email || "", role_id: data.role_id || 3,
              role: mapRoleIdToRole(data.role_id, data.contributorBadge, data.adminBadge), bio: data.bio || "", country: "", joined: "",
              links: (() => { if (!data.links) return []; if (typeof data.links === "string") { try { return JSON.parse(data.links); } catch { return []; } } if (Array.isArray(data.links)) return data.links; if (typeof data.links === "object") return Object.values(data.links); return []; })(),
              profile_picture: data.profile_picture || null, avatarInitial: (data.name || data.username || "U").charAt(0).toUpperCase(), contributions, forumPosts, contributionsHidden: !data.show_contributions,
            });
          } else { setError(t("profile.error.notFound.title")); }
        }
      } catch (err) { console.error("Failed to fetch profile:", err); setError(t("profile.error.general")); } finally { setIsLoading(false); }
    };
    fetchProfile();
  }, [id, isLoggedIn, user, t]);

  const pageStyle: React.CSSProperties = { ...SANS, backgroundColor: BG, backgroundImage: "radial-gradient(circle at 50% 0%, rgba(184, 134, 11, 0.06) 0%, transparent 60%)", minHeight: "100vh", color: GREEN };
  const outerPadding: React.CSSProperties = { maxWidth: "1280px", margin: "0 auto", paddingLeft: isMobile ? "16px" : "40px", paddingRight: isMobile ? "16px" : "40px", paddingTop: isMobile ? "36px" : "72px", paddingBottom: isMobile ? "48px" : "96px" };

  if (authLoading || isLoading) return (
    <div dir={isRTL ? "rtl" : "ltr"} style={pageStyle}>{fontImports}<div style={{ maxWidth: "600px", margin: "0 auto", padding: isMobile ? "80px 20px" : "140px 32px", textAlign: "center", color: MUTED }}>{t("profile.loading")}</div></div>
  );

  if (!id && (!isLoggedIn || !user)) return (
    <div dir={isRTL ? "rtl" : "ltr"} style={pageStyle}>{fontImports}
      <div style={{ maxWidth: "500px", margin: "0 auto", padding: isMobile ? "80px 20px" : "140px 32px", textAlign: "center" }}>
        <Icon name="lock" size={32} style={{ color: BORDER, marginBottom: "12px" }} />
        <h1 style={{ ...SERIF, fontSize: "18px", fontWeight: 700, color: GREEN, margin: "0 0 8px" }}>{t("profile.loginRequired.title")}</h1>
        <p style={{ ...SANS, fontSize: "13px", color: MUTED, margin: "0 0 16px" }}>{t("profile.loginRequired.desc")}</p>
        <HoverBtn onClick={() => navigate("/login")}>{t("profile.loginRequired.button")}</HoverBtn>
      </div>
    </div>
  );

  if (profileStatus) {
    const config = STATUS_CONFIG[profileStatus.type];
    return (
      <div dir={isRTL ? "rtl" : "ltr"} style={pageStyle}>{fontImports}
        <div style={{ maxWidth: "500px", margin: "0 auto", padding: isMobile ? "80px 20px" : "140px 32px", textAlign: "center" }}>
          <Icon name={config.icon} size={40} style={{ color: BORDER, marginBottom: "12px" }} />
          {profileStatus.type === "deactivated" && profileStatus.username && <p style={{ ...SANS, fontSize: "14px", color: MUTED, margin: "0 0 6px" }}>@{profileStatus.username}</p>}
          <h1 style={{ ...SERIF, fontSize: "18px", fontWeight: 700, color: GREEN, margin: 0 }}>{t(config.titleKey)}</h1>
          {profileStatus.type === "registered_only" && <div style={{ marginTop: "16px" }}><HoverBtn onClick={() => navigate("/login")}>{t("profile.loginRequired.button")}</HoverBtn></div>}
        </div>
      </div>
    );
  }

  if (error || !profile) return (
    <div dir={isRTL ? "rtl" : "ltr"} style={pageStyle}>{fontImports}
      <div style={{ maxWidth: "600px", margin: "0 auto", padding: isMobile ? "80px 20px" : "140px 32px", textAlign: "center" }}>
        <Icon name="person_off" size={40} style={{ color: BORDER, marginBottom: "12px" }} />
        <h1 style={{ ...SERIF, fontSize: "18px", fontWeight: 700, color: GREEN, margin: "0 0 8px" }}>{error === t("profile.error.notFound.title") ? t("profile.error.notFound.title") : t("profile.error.general")}</h1>
        <p style={{ ...SANS, fontSize: "13px", color: MUTED }}>{error === t("profile.error.notFound.title") ? t("profile.error.notFound.desc") : t("profile.error.generalDesc")}</p>
      </div>
    </div>
  );

  const isOwner = !!user && (String(user.id) === String(profile.id) || String((user as any)._id) === String(profile.id));

  return (
    <div dir={isRTL ? "rtl" : "ltr"} style={pageStyle}>
      {fontImports}
      <div style={outerPadding}>
        <div style={{ marginBottom: isMobile ? "20px" : "32px" }}>
          <ProfileCard profile={profile} showEditButton={isOwner} onEdit={() => navigate("/edit-profile")} editLabel={t("editProfile.editProfile")} isMobile={isMobile} openImageModal={openImageModal} t={t} />
        </div>
        {isMobile && <p style={{ ...MONO, fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.08em", opacity: 0.7, margin: "0 0 14px" }}>{t("profile.activityTitle")}</p>}
        <ActivityFeeds profile={profile} isMobile={isMobile} onContributionClick={(c) => {
          if (!c.scholarId) return;
          const params = new URLSearchParams();
          if (c.lang) params.set("lang", c.lang);
          if (c.type === "media") params.set("focus", `media-${c.id}`);
          if (c.type === "work") params.set("focus", `work-${c.id}`);
          const qs = params.toString();
          navigate(`/scholars/${c.scholarId}${qs ? `?${qs}` : ""}`);
        }} onPostClick={(p) => navigate(`/forum/${p.id}`)} t={t} />
      </div>
      <ImageModal />
    </div>
  );
}