import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useLang } from "../../context/LanguageContext";
import { useAuth } from "../../context/AuthContext";
import ProfileSidebar from "../../components/ProfileSidebar";

/* ─────────────────────────────────────────────────────────────
   Oulamauna — Unified Profile Page
   Styled with Dashboard.tsx palette
   v2: full-width profile header, Forum Activity separated from
   Contributions, extra top/bottom breathing room under navbar/footer
───────────────────────────────────────────────────────────── */

type Role = "user" | "contributor";

interface Contribution {
  id: number;
  title: string;
  description: string;
  time: string;
  tag: "Annotation" | "Media" | "Translation" | "Research";
}

interface ForumPost {
  id: number;
  title: string;
  excerpt: string;
  time: string;
  category: string;
  replies: number;
}

interface ProfileData {
  id: string;
  username: string;
  displayName: string;
  fullName: string;
  email: string;
  role: Role;
  bio: string;
  country: string;
  joined: string;
  links: string[];
  avatarInitial: string;
  contributions: Contribution[];
  forumPosts: ForumPost[];
}

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

const BTN_PRIMARY: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "6px",
  padding: "8px 16px",
  border: "2px solid #0b4335",
  borderRadius: "8px",
  backgroundColor: "transparent",
  color: "#0b4335",
  cursor: "pointer",
  transition: "all 0.3s",
  ...MONO,
  fontSize: "12px",
  fontWeight: 600,
  letterSpacing: "0.03em",
  textDecoration: "none",
};

/* ── RESPONSIVE: shared mobile-detection hook (same pattern as Dashboard) ───── */
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
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        border: `1px solid rgba(11, 67, 53, 0.1)`,
        backgroundColor: CARD_BG,
        borderRadius: "12px",
        boxShadow: hov ? "0px 6px 24px rgba(11, 67, 53, 0.12)" : "0px 4px 20px rgba(11, 67, 53, 0.08)",
        transform: hov ? "translateY(-2px)" : "translateY(0)",
        transition: "all 0.3s ease",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function HoverBtn({ children, onClick, style }: { children: React.ReactNode; onClick?: () => void; style?: React.CSSProperties }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        ...BTN_PRIMARY,
        backgroundColor: hov ? GREEN : "transparent",
        color: hov ? BG : GREEN,
        ...style,
      }}
    >
      {children}
    </button>
  );
}

function RoleBadge({ role }: { role: Role }) {
  const isContributor = role === "contributor";
  const iconName = isContributor ? "edit_document" : "person";

  return (
    <span style={{
      display: "inline-flex",
      alignItems: "center",
      gap: "6px",
      padding: "4px 10px",
      borderRadius: "6px",
      border: `1px solid ${BORDER}`,
      backgroundColor: "rgba(11, 67, 53, 0.04)",
      color: GREEN,
      ...MONO,
      fontSize: "10px",
      fontWeight: 700,
      letterSpacing: "0.05em",
      whiteSpace: "nowrap",
    }}>
      <Icon name={iconName} size={14} />
      {isContributor ? "Contributor" : "User"}
    </span>
  );
}

function SocialIconBtn({ href }: { href: string }) {
  const [hov, setHov] = useState(false);
  const normalized = href.startsWith("http://") || href.startsWith("https://") ? href : `https://${href}`;

  return (
    <a
      href={normalized}
      target="_blank"
      rel="noopener noreferrer"
      title={href.replace(/^https?:\/\//, "")}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        width: "34px",
        height: "34px",
        borderRadius: "50%",
        border: `1.5px solid ${hov ? GREEN : BORDER}`,
        backgroundColor: hov ? GREEN : "transparent",
        color: hov ? BG : GREEN,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        transition: "all 0.3s",
      }}
    >
      <Icon name="link" size={15} />
    </a>
  );
}

/* ── RESPONSIVE: on mobile, stats render as small square tiles (same idea as
   Dashboard's 2-col stat grid) instead of an inline row of numbers ───── */
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

/* ── Section header used by both "Recent Contributions" and "Forum Activity" ─ */
function SectionHeader({ icon, title, count, isMobile }: { icon: string; title: string; count: number; isMobile: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: isMobile ? "12px" : "16px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <Icon name={icon} size={18} style={{ color: GREEN }} />
        <h2 style={{ ...SERIF, fontSize: isMobile ? "15px" : "17px", fontWeight: 700, color: GREEN, margin: 0 }}>{title}</h2>
      </div>
      <span style={{
        ...MONO, fontSize: "10px", color: MUTED, backgroundColor: "rgba(11, 67, 53, 0.06)",
        padding: "3px 9px", borderRadius: "999px", border: `1px solid ${BORDER}`,
      }}>
        {count}
      </span>
    </div>
  );
}

function ContributionCard({ item, isMobile }: { item: Contribution; isMobile: boolean }) {
  const [hov, setHov] = useState(false);

  if (isMobile) {
    // ── RESPONSIVE: compact horizontal row instead of the tall desktop card ─
    return (
      <div style={{
        display: "flex", alignItems: "flex-start", gap: "12px",
        padding: "14px", border: `1px solid ${BORDER}`, borderRadius: "10px",
        backgroundColor: CARD_BG,
      }}>
        <div style={{
          width: "36px", height: "36px", borderRadius: "8px", flexShrink: 0,
          backgroundColor: "rgba(11, 67, 53, 0.08)", display: "flex", alignItems: "center", justifyContent: "center", color: GREEN
        }}>
          <Icon name={item.tag === "Media" ? "perm_media" : item.tag === "Translation" ? "translate" : item.tag === "Research" ? "science" : "edit_note"} size={18} />
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <h3 style={{ ...SERIF, fontSize: "13px", fontWeight: 700, color: GREEN, margin: "0 0 4px" }}>{item.title}</h3>
          <p style={{ ...SANS, fontSize: "12px", color: MUTED, margin: "0 0 6px", lineHeight: 1.5 }}>{item.description}</p>
          <span style={{ ...MONO, fontSize: "10px", color: MUTED, display: "flex", alignItems: "center", gap: "4px" }}>
            <Icon name="schedule" size={12} /> {item.time}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        padding: "20px",
        border: `1px solid ${BORDER}`,
        borderRadius: "12px",
        backgroundColor: hov ? "rgba(11, 67, 53, 0.04)" : CARD_BG,
        borderColor: hov ? GREEN : BORDER,
        transition: "all 0.3s ease",
        cursor: "pointer",
        transform: hov ? "translateY(-2px)" : "translateY(0)",
        boxShadow: hov ? "0px 6px 24px rgba(11, 67, 53, 0.12)" : "0px 4px 20px rgba(11, 67, 53, 0.08)",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "8px" }}>
        <span
          style={{
            ...MONO,
            fontSize: "10px",
            padding: "4px 10px",
            borderRadius: "6px",
            backgroundColor: "rgba(11, 67, 53, 0.08)",
            border: `1px solid rgba(11, 67, 53, 0.2)`,
            color: GREEN,
            fontWeight: 700,
            letterSpacing: "0.05em",
          }}
        >
          {item.tag}
        </span>
        <Icon name="arrow_forward" size={16} style={{ color: MUTED, flexShrink: 0 }} />
      </div>

      <div>
        <h3 style={{ ...SERIF, fontSize: "15px", fontWeight: 700, color: GREEN, margin: "0 0 6px" }}>
          {item.title}
        </h3>
        <p style={{ ...SANS, fontSize: "13px", color: MUTED, margin: 0, lineHeight: 1.6 }}>
          {item.description}
        </p>
      </div>

      <span style={{ ...MONO, fontSize: "11px", color: MUTED, display: "flex", alignItems: "center", gap: "4px" }}>
        <Icon name="schedule" size={13} />
        {item.time}
      </span>
    </div>
  );
}

/* ── Forum activity card — visually distinct from ContributionCard (chat icon,
   reply count) so the two feeds never get visually confused ───── */
function ForumPostCard({ item, isMobile }: { item: ForumPost; isMobile: boolean }) {
  const [hov, setHov] = useState(false);

  if (isMobile) {
    return (
      <div style={{
        display: "flex", alignItems: "flex-start", gap: "12px",
        padding: "14px", border: `1px solid ${BORDER}`, borderRadius: "10px",
        backgroundColor: CARD_BG,
      }}>
        <div style={{
          width: "36px", height: "36px", borderRadius: "8px", flexShrink: 0,
          backgroundColor: "rgba(184, 134, 11, 0.10)", display: "flex", alignItems: "center", justifyContent: "center", color: GOLD
        }}>
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
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        padding: "20px",
        border: `1px solid ${BORDER}`,
        borderRadius: "12px",
        backgroundColor: hov ? "rgba(184, 134, 11, 0.05)" : CARD_BG,
        borderColor: hov ? GOLD : BORDER,
        transition: "all 0.3s ease",
        cursor: "pointer",
        transform: hov ? "translateY(-2px)" : "translateY(0)",
        boxShadow: hov ? "0px 6px 24px rgba(184, 134, 11, 0.12)" : "0px 4px 20px rgba(11, 67, 53, 0.08)",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "8px" }}>
        <span
          style={{
            ...MONO,
            fontSize: "10px",
            padding: "4px 10px",
            borderRadius: "6px",
            backgroundColor: "rgba(184, 134, 11, 0.10)",
            border: `1px solid rgba(184, 134, 11, 0.25)`,
            color: GOLD,
            fontWeight: 700,
            letterSpacing: "0.05em",
          }}
        >
          {item.category}
        </span>
        <Icon name="arrow_forward" size={16} style={{ color: MUTED, flexShrink: 0 }} />
      </div>

      <div>
        <h3 style={{ ...SERIF, fontSize: "15px", fontWeight: 700, color: GREEN, margin: "0 0 6px" }}>
          {item.title}
        </h3>
        <p style={{ ...SANS, fontSize: "13px", color: MUTED, margin: 0, lineHeight: 1.6 }}>
          {item.excerpt}
        </p>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        <span style={{ ...MONO, fontSize: "11px", color: MUTED, display: "flex", alignItems: "center", gap: "4px" }}>
          <Icon name="schedule" size={13} />
          {item.time}
        </span>
        <span style={{ ...MONO, fontSize: "11px", color: MUTED, display: "flex", alignItems: "center", gap: "4px" }}>
          <Icon name="chat_bubble" size={13} />
          {item.replies} replies
        </span>
      </div>
    </div>
  );
}

/* ── MOCK DATA ───────────────────────────── */
const MOCK_PROFILES: Record<string, ProfileData> = {
  "6": {
    id: "6", username: "iuio", displayName: "iuio", fullName: "", email: "", role: "user", avatarInitial: "I", country: "", joined: "", links: [], bio: "", contributions: [], forumPosts: [],
  },
  "21": {
    id: "21", username: "Ahmed_21", displayName: "Ahmed", fullName: "Ahmed Al-Farsi", email: "ahmed.alfarsi@email.com", role: "contributor", avatarInitial: "A", country: "Algeria", joined: "Jan 2024", links: ["https://facebook.com/ahmed.alfarsi"], bio: "Independent researcher focusing on 12th-century theological manuscripts. I contribute translations and bibliographical annotations to the Oulamauna archive, specializing in texts originating from the Andalusian region.", contributions: [
      { id: 1, title: "Translation: Kitab al-Shifa", description: "Added new annotations to Chapter 3 regarding the philosophical interpretations of causation.", time: "2 days ago", tag: "Annotation" },
      { id: 2, title: "Manuscript Digitization: MS. 402", description: "Uploaded high-resolution scans of the margin notes found in the Cordoba collection.", time: "1 week ago", tag: "Media" },
      { id: 3, title: "Research Paper: Andalusian Philosophy", description: "Published comprehensive analysis of Ibn Rushd's commentaries on Aristotle's Metaphysics.", time: "2 weeks ago", tag: "Research" },
    ], forumPosts: [
      { id: 1, title: "Dating the Cordoba marginalia", excerpt: "Started a thread asking for second opinions on the estimated dating of the newly digitized margin notes.", time: "1 day ago", category: "Manuscripts", replies: 12 },
      { id: 2, title: "Best practices for transliteration", excerpt: "Shared a comparison of transliteration conventions used across the Andalusian sub-collection.", time: "4 days ago", category: "Discussion", replies: 7 },
    ],
  },
  "42": {
    id: "42", username: "Fatima_Zahra", displayName: "Fatima Zahra", fullName: "Fatima Zahra Benali", email: "fatima.benali@email.com", role: "user", avatarInitial: "F", country: "Morocco", joined: "Sep 2024", links: [], bio: "Graduate student in Islamic Studies at Al-Qarawiyyin University. Passionate about preserving and digitizing North African manuscript collections.", contributions: [
      { id: 1, title: "Translation: Letter from Granada", description: "Translated a 15th-century correspondence between scholars in Granada and Fez.", time: "3 days ago", tag: "Translation" },
      { id: 2, title: "Archive Contribution: Fez Library", description: "Added metadata for 50+ manuscripts from the Al-Qarawiyyin Library digital collection.", time: "5 days ago", tag: "Annotation" },
    ], forumPosts: [
      { id: 1, title: "Looking for co-reviewers: Fez metadata batch", excerpt: "Asked the community to help proofread the newly added Al-Qarawiyyin metadata before it goes live.", time: "2 days ago", category: "Collaboration", replies: 4 },
    ],
  },
};

function buildOwnProfile(user: any): ProfileData {
  const uid = String(user?.id ?? user?._id ?? "me");
  const mock = MOCK_PROFILES[uid];
  const displayName = user?.displayName ?? user?.username ?? mock?.displayName ?? "Your Profile";
  return {
    id: uid, username: user?.username ?? mock?.username ?? "you", displayName, fullName: user?.fullName ?? mock?.fullName ?? "", email: user?.email ?? mock?.email ?? "",
    role: (user?.role as Role) ?? mock?.role ?? "user", bio: user?.bio ?? mock?.bio ?? "", country: user?.country ?? mock?.country ?? "", joined: user?.joined ?? mock?.joined ?? "",
    links: Array.isArray(user?.links) ? user.links : mock?.links ?? [], avatarInitial: (displayName[0] ?? "U").toUpperCase(),
    contributions: mock?.contributions ?? [], forumPosts: mock?.forumPosts ?? [],
  };
}

function getPublicProfile(profileId: string): ProfileData | undefined {
  return MOCK_PROFILES[String(profileId)];
}

const fontImports = (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;700&display=swap');
    @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap');
    .material-symbols-outlined {
      font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
      font-family: 'Material Symbols Outlined';
      display: inline-block;
      vertical-align: middle;
    }
    .profile-contrib-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
    }
    @media (max-width: 720px) {
      .profile-contrib-grid { grid-template-columns: 1fr; gap: 10px; }
    }
    .profile-feed-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 28px;
      align-items: start;
    }
    @media (max-width: 900px) {
      .profile-feed-grid { grid-template-columns: 1fr; gap: 28px; }
    }
  `}</style>
);

/* ── Cover band behind the avatar — gives the header real "profile page"
   presence instead of floating flat on the page background ───── */
const COVER_STYLE: React.CSSProperties = {
  height: "108px",
  width: "100%",
  background: `linear-gradient(120deg, rgba(11,67,53,0.92) 0%, rgba(11,67,53,0.75) 55%, rgba(184,134,11,0.55) 100%)`,
};

/* ── DESKTOP profile header: full-width banner, avatar overlapping the cover,
   name/bio/stats below ───── */
function DesktopProfileCard({ profile, showEditButton, onEdit, editLabel }: { profile: ProfileData; showEditButton: boolean; onEdit: () => void; editLabel: string }) {
  const manuscriptCount = profile.contributions.filter((c) => c.tag === "Media").length;

  return (
    <HoverCard style={{ overflow: "hidden", width: "100%" }}>
      <div style={COVER_STYLE} />
      <div style={{ padding: "0 32px 28px" }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: "16px", marginTop: "-40px" }}>
          <div style={{
            width: "96px", height: "96px", borderRadius: "50%", backgroundColor: CARD_BG,
            display: "flex", alignItems: "center", justifyContent: "center", color: GREEN,
            ...SERIF, fontSize: "34px", fontWeight: 700, border: `4px solid ${CARD_BG}`,
            boxShadow: "0px 4px 16px rgba(11, 67, 53, 0.18)", flexShrink: 0,
          }}>
            {profile.avatarInitial}
          </div>
          {showEditButton && (
            <div style={{ marginBottom: "6px" }}>
              <HoverBtn onClick={onEdit}>
                <Icon name="edit_square" size={14} /> {editLabel}
              </HoverBtn>
            </div>
          )}
        </div>

        <div style={{ marginTop: "16px", display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          <h1 style={{ ...SERIF, fontSize: "24px", fontWeight: 700, color: GREEN, margin: 0 }}>{profile.displayName}</h1>
          <RoleBadge role={profile.role} />
        </div>
        <p style={{ ...SANS, fontSize: "13px", color: MUTED, margin: "4px 0 0" }}>@{profile.username}</p>

        {profile.bio && (
          <p style={{ ...SANS, fontSize: "14px", lineHeight: 1.7, color: GREEN, margin: "16px 0 0", maxWidth: "680px" }}>
            {profile.bio}
          </p>
        )}

        {(profile.country || profile.joined) && (
          <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap", margin: "14px 0 0" }}>
            {profile.country && (
              <span style={{ ...MONO, fontSize: "11px", color: MUTED, display: "flex", alignItems: "center", gap: "4px" }}>
                <Icon name="location_on" size={14} style={{ color: GREEN }} /> {profile.country}
              </span>
            )}
            {profile.joined && (
              <span style={{ ...MONO, fontSize: "11px", color: MUTED, display: "flex", alignItems: "center", gap: "4px" }}>
                <Icon name="calendar_today" size={13} style={{ color: GREEN }} /> Joined {profile.joined}
              </span>
            )}
          </div>
        )}

        {profile.links.length > 0 && (
          <div style={{ display: "flex", gap: "8px", margin: "16px 0 0" }}>
            {profile.links.map((link, i) => (
              <SocialIconBtn key={`${link}-${i}`} href={link} />
            ))}
          </div>
        )}

        <div style={{ borderTop: `1px solid ${BORDER}`, margin: "20px 0 0", paddingTop: "18px" }}>
          <div style={{ display: "flex", gap: "36px" }}>
            <StatBlock value={profile.contributions.length} label="Contributions" />
            <StatBlock value={profile.forumPosts.length} label="Forum Posts" />
            <StatBlock value={manuscriptCount} label="Manuscripts" />
            <StatBlock value={profile.role === "contributor" ? "Yes" : "No"} label="Verified" />
          </div>
        </div>
      </div>
    </HoverCard>
  );
}

/* ── MOBILE profile header: cover band, centered avatar/name, stat tiles grid,
   full-width edit button pinned to the bottom of the card ───── */
function MobileProfileCard({ profile, showEditButton, onEdit, editLabel }: { profile: ProfileData; showEditButton: boolean; onEdit: () => void; editLabel: string }) {
  const manuscriptCount = profile.contributions.filter((c) => c.tag === "Media").length;

  return (
    <HoverCard style={{ overflow: "hidden", width: "100%" }}>
      <div style={{ ...COVER_STYLE, height: "72px" }} />
      <div style={{ padding: "0 20px 20px", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
        <div style={{
          width: "78px", height: "78px", borderRadius: "50%",
          backgroundColor: CARD_BG, display: "flex", alignItems: "center", justifyContent: "center",
          color: GREEN, ...SERIF, fontSize: "28px", fontWeight: 700, border: `4px solid ${CARD_BG}`,
          boxShadow: "0px 4px 16px rgba(11, 67, 53, 0.18)", flexShrink: 0, marginTop: "-38px"
        }}>
          {profile.avatarInitial}
        </div>

        <h1 style={{ ...SERIF, fontSize: "19px", fontWeight: 700, color: GREEN, margin: "12px 0 0" }}>{profile.displayName}</h1>
        <p style={{ ...SANS, fontSize: "13px", color: MUTED, margin: "3px 0 0" }}>@{profile.username}</p>
        <div style={{ marginTop: "8px" }}>
          <RoleBadge role={profile.role} />
        </div>

        {profile.bio && (
          <p style={{ ...SANS, fontSize: "13px", lineHeight: 1.6, color: GREEN, margin: "14px 0 0", textAlign: "left", alignSelf: "stretch" }}>
            {profile.bio}
          </p>
        )}

        {(profile.country || profile.joined) && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "14px", flexWrap: "wrap", margin: "12px 0 0" }}>
            {profile.country && (
              <span style={{ ...MONO, fontSize: "11px", color: MUTED, display: "flex", alignItems: "center", gap: "4px" }}>
                <Icon name="location_on" size={14} style={{ color: GREEN }} /> {profile.country}
              </span>
            )}
            {profile.joined && (
              <span style={{ ...MONO, fontSize: "11px", color: MUTED, display: "flex", alignItems: "center", gap: "4px" }}>
                <Icon name="calendar_today" size={13} style={{ color: GREEN }} /> Joined {profile.joined}
              </span>
            )}
          </div>
        )}

        {profile.links.length > 0 && (
          <div style={{ display: "flex", justifyContent: "center", gap: "8px", flexWrap: "wrap", margin: "14px 0 0" }}>
            {profile.links.map((link, i) => (
              <SocialIconBtn key={`${link}-${i}`} href={link} />
            ))}
          </div>
        )}

        {/* stat tiles — square cards in a 4-col grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px", width: "100%", marginTop: "18px" }}>
          <StatTile value={profile.contributions.length} label="Contribs" />
          <StatTile value={profile.forumPosts.length} label="Forum" />
          <StatTile value={manuscriptCount} label="Media" />
          <StatTile value={profile.role === "contributor" ? "Yes" : "No"} label="Verified" />
        </div>

        {showEditButton && (
          <button
            onClick={onEdit}
            style={{
              ...BTN_PRIMARY, marginTop: "16px", width: "100%",
              justifyContent: "center", padding: "11px 16px", fontSize: "12px",
              backgroundColor: GREEN, color: BG,
            }}
          >
            <Icon name="edit_square" size={14} /> {editLabel}
          </button>
        )}
      </div>
    </HoverCard>
  );
}

function ProfileCard(props: { profile: ProfileData; showEditButton: boolean; onEdit: () => void; editLabel: string; isMobile: boolean }) {
  return props.isMobile ? <MobileProfileCard {...props} /> : <DesktopProfileCard {...props} />;
}

/* ── Two feeds, clearly separated: Recent Contributions and Forum Activity.
   Side-by-side on wide screens, stacked (contributions first) on mobile ── */
function ActivityFeeds({ profile, isMobile }: { profile: ProfileData; isMobile: boolean }) {
  return (
    <div className="profile-feed-grid">
      <section>
        <SectionHeader icon="edit_note" title="Recent Contributions" count={profile.contributions.length} isMobile={isMobile} />
        {profile.contributions.length === 0 ? (
          <p style={{ ...SANS, fontSize: "13px", color: MUTED }}>No contributions yet.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: isMobile ? "10px" : "14px" }}>
            {profile.contributions.map((c) => <ContributionCard key={c.id} item={c} isMobile={isMobile} />)}
          </div>
        )}
      </section>

      <section>
        <SectionHeader icon="forum" title="Forum Activity" count={profile.forumPosts.length} isMobile={isMobile} />
        {profile.forumPosts.length === 0 ? (
          <p style={{ ...SANS, fontSize: "13px", color: MUTED }}>No forum activity yet.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: isMobile ? "10px" : "14px" }}>
            {profile.forumPosts.map((p) => <ForumPostCard key={p.id} item={p} isMobile={isMobile} />)}
          </div>
        )}
      </section>
    </div>
  );
}

export default function ProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { lang, t } = useLang();
  const { user, isLoggedIn, loading } = useAuth();
  const navigate = useNavigate();
  const isRTL = lang === "AR";
  const isMobile = useIsMobile();

  const pageStyle: React.CSSProperties = {
    ...SANS,
    backgroundColor: BG,
    backgroundImage: "radial-gradient(circle at 50% 0%, rgba(184, 134, 11, 0.06) 0%, transparent 60%)",
    minHeight: "100vh",
    color: GREEN,
  };

  // Extra breathing room under the navbar and above the footer.
  const outerPadding: React.CSSProperties = {
    maxWidth: "1280px",
    margin: "0 auto",
    paddingLeft: isMobile ? "16px" : "40px",
    paddingRight: isMobile ? "16px" : "40px",
    paddingTop: isMobile ? "36px" : "72px",
    paddingBottom: isMobile ? "48px" : "96px",
  };

  if (loading) {
    return (
      <div dir={isRTL ? "rtl" : "ltr"} style={pageStyle}>
        {fontImports}
        <div style={{ maxWidth: "600px", margin: "0 auto", padding: isMobile ? "80px 20px" : "140px 32px", textAlign: "center", color: MUTED }}>Loading…</div>
      </div>
    );
  }

  if (!id) {
    if (!isLoggedIn || !user) {
      return (
        <div dir={isRTL ? "rtl" : "ltr"} style={pageStyle}>
          {fontImports}
          <div style={{ maxWidth: "500px", margin: "0 auto", padding: isMobile ? "80px 20px" : "140px 32px", textAlign: "center" }}>
            <Icon name="lock" size={32} style={{ color: BORDER, marginBottom: "12px" }} />
            <h1 style={{ ...SERIF, fontSize: "18px", fontWeight: 700, color: GREEN, margin: "0 0 8px" }}>You need to log in</h1>
            <p style={{ ...SANS, fontSize: "13px", color: MUTED, margin: "0 0 16px" }}>Log in to see and manage your profile.</p>
            <HoverBtn onClick={() => navigate("/login")}>{t("editProfile.signIn") ?? "Log in"}</HoverBtn>
          </div>
        </div>
      );
    }
    const profile = buildOwnProfile(user);
    return (
      <div dir={isRTL ? "rtl" : "ltr"} style={pageStyle}>
        {fontImports}
        <div style={outerPadding}>
          {/* Profile header spans the full page width */}
          <div style={{ marginBottom: isMobile ? "20px" : "32px" }}>
            <ProfileCard profile={profile} showEditButton={false} onEdit={() => navigate("/edit-profile")} editLabel={t("editProfile.editProfile") ?? "Edit profile"} isMobile={isMobile} />
          </div>

          <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: isMobile ? "20px" : "32px" }}>
            {!isMobile && <ProfileSidebar role={profile.role} active="profile" />}

            <div style={{ flex: 1, minWidth: 0 }}>
              {isMobile && (
                <p style={{ ...MONO, fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.08em", opacity: 0.7, margin: "0 0 14px" }}>ACTIVITY</p>
              )}
              <ActivityFeeds profile={profile} isMobile={isMobile} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const profile = getPublicProfile(id);
  if (!profile) {
    return (
      <div dir={isRTL ? "rtl" : "ltr"} style={pageStyle}>
        {fontImports}
        <div style={{ maxWidth: "600px", margin: "0 auto", padding: isMobile ? "80px 20px" : "140px 32px", textAlign: "center" }}>
          <Icon name="person_off" size={40} style={{ color: BORDER, marginBottom: "12px" }} />
          <h1 style={{ ...SERIF, fontSize: "18px", fontWeight: 700, color: GREEN, margin: "0 0 8px" }}>Profile not found</h1>
          <p style={{ ...SANS, fontSize: "13px", color: MUTED }}>No profile exists for id "{id}".</p>
        </div>
      </div>
    );
  }

  const isOwner = !!user && (String(user.id) === String(profile.id) || String(user._id) === String(profile.id));

  return (
    <div dir={isRTL ? "rtl" : "ltr"} style={pageStyle}>
      {fontImports}
      <div style={outerPadding}>
        <div style={{ marginBottom: isMobile ? "20px" : "32px" }}>
          <ProfileCard profile={profile} showEditButton={isOwner} onEdit={() => navigate("/edit-profile")} editLabel={t("editProfile.editProfile") ?? "Edit profile"} isMobile={isMobile} />
        </div>

        {isMobile && (
          <p style={{ ...MONO, fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.08em", opacity: 0.7, margin: "0 0 14px" }}>ACTIVITY</p>
        )}
        <ActivityFeeds profile={profile} isMobile={isMobile} />
      </div>
    </div>
  );
}