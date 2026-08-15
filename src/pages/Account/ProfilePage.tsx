// src/pages/Authentication/ProfilePage.tsx

import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useLang } from "../../context/LanguageContext";
import { useAuth } from "../../context/AuthContext";
import ProfileSidebar from "../../components/ProfileSidebar";

/* ─────────────────────────────────────────────────────────────
   Oulamauna — Unified Profile Page
   Restyled as a classic profile card (banner + avatar + stats)
   instead of a wiki/table-of-contents layout.
───────────────────────────────────────────────────────────── */

type Role = "user" | "contributor";

interface Contribution {
  id: number;
  title: string;
  description: string;
  time: string;
  tag: "Annotation" | "Media" | "Translation" | "Research";
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
}

/* ── Design tokens (Matched to AboutPage aesthetic) ──────── */

const COLOR = {
  primary: "#0b4335",
  primarySoft: "#e7efeb",
  accent: "#C9A84C",
  surface: "#f9faf7",
  surfaceContainer: "#ffffff",
  surfaceContainerLow: "#ffffff",
  surfaceContainerHigh: "#f4f5f3",
  surfaceContainerHighest: "#eef0ed",
  onSurface: "#191c1b",
  onSurfaceVariant: "#404945",
  outline: "#c0c9c3",
  outlineVariant: "rgba(192,201,195,0.4)",
  error: "#ba1a1a",
};

const MONO: React.CSSProperties = { fontFamily: "'JetBrains Mono', monospace" };
const SERIF: React.CSSProperties = { fontFamily: "'Source Serif 4', serif" };
const SANS: React.CSSProperties = { fontFamily: "'Source Sans 3', sans-serif" };

const HEADLINE_LG: React.CSSProperties = {
  ...SERIF,
  fontSize: "24px",
  lineHeight: 1.3,
  fontWeight: 700,
  color: COLOR.onSurface,
};

const HEADLINE_MD: React.CSSProperties = {
  ...SERIF,
  fontSize: "18px",
  lineHeight: 1.4,
  fontWeight: 700,
  color: COLOR.onSurface,
};

const BODY_LG: React.CSSProperties = {
  ...SANS,
  fontSize: "16px",
  lineHeight: 1.7,
  fontWeight: 400,
  color: COLOR.onSurface,
};

const BODY_MD: React.CSSProperties = {
  ...SANS,
  fontSize: "14px",
  lineHeight: 1.7,
  fontWeight: 400,
  color: COLOR.onSurfaceVariant,
};

const LABEL_MD: React.CSSProperties = {
  ...MONO,
  fontSize: "10px",
  lineHeight: 1,
  letterSpacing: "0.1em",
  fontWeight: 700,
  color: COLOR.onSurfaceVariant,
};

const CAPTION: React.CSSProperties = {
  ...MONO,
  fontSize: "11px",
  lineHeight: 1.4,
  fontWeight: 500,
  color: COLOR.onSurfaceVariant,
};

const BTN_PRIMARY: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "6px",
  padding: "10px 20px",
  border: "1.5px solid #0b4335",
  borderRadius: "6px",
  backgroundColor: "transparent",
  color: "#0b4335",
  cursor: "pointer",
  transition: "background 0.15s, color 0.15s",
  ...MONO,
  fontSize: "10px",
  fontWeight: 700,
  letterSpacing: "0.1em",
  textDecoration: "none",
};

// ── Single specific style for the Role Badge (outlined for both) ──
const ROLE_BADGE_BASE: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "6px",
  padding: "4px 12px",
  borderRadius: "6px",
  border: `1px solid ${COLOR.outline}`,
  backgroundColor: "transparent",
  color: COLOR.primary,
  ...MONO,
  fontSize: "10px",
  fontWeight: 700,
  letterSpacing: "0.05em",
};

/* ── Small components ─────────────────────────────────────── */

function Icon({
  name,
  size = 16,
  style,
}: {
  name: string;
  size?: number;
  style?: React.CSSProperties;
}) {
  return (
    <span
      className="material-symbols-outlined"
      style={{
        fontSize: `${size}px`,
        lineHeight: 1,
        userSelect: "none",
        ...style,
      }}
    >
      {name}
    </span>
  );
}

function HoverCard({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  const [hov, setHov] = useState(false);

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        border: `1px solid ${COLOR.outlineVariant}`,
        backgroundColor: COLOR.surfaceContainer,
        borderRadius: "12px",
        boxShadow: hov ? "0 4px 12px rgba(11,67,53,0.06)" : "none",
        transition: "box-shadow 0.2s, border-color 0.2s",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function HoverBtn({
  children,
  onClick,
  style,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  style?: React.CSSProperties;
}) {
  const [hov, setHov] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        ...BTN_PRIMARY,
        backgroundColor: hov ? COLOR.primary : "transparent",
        color: hov ? "#ffffff" : COLOR.primary,
        ...style,
      }}
    >
      {children}
    </button>
  );
}

// Cleaned up: Uses one base style for both roles
function RoleBadge({ role }: { role: Role }) {
  const isContributor = role === "contributor";
  const iconName = isContributor ? "edit_document" : "person";

  return (
    <span style={ROLE_BADGE_BASE}>
      <Icon name={iconName} size={14} />
      {isContributor ? "Contributor" : "User"}
    </span>
  );
}

// Small circular icon-button used for social/external links
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
        border: `1px solid ${hov ? COLOR.primary : COLOR.outline}`,
        backgroundColor: hov ? COLOR.primary : "transparent",
        color: hov ? "#ffffff" : COLOR.primary,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        transition: "background-color 0.15s, border-color 0.15s, color 0.15s",
      }}
    >
      <Icon name="link" size={15} />
    </a>
  );
}

// One column of the stats row (Contributions / Manuscripts / Since, etc.)
function StatBlock({ value, label }: { value: string | number; label: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
      <span style={{ ...HEADLINE_MD, fontSize: "18px" }}>{value}</span>
      <span style={{ ...CAPTION, textTransform: "uppercase" }}>{label}</span>
    </div>
  );
}

function ContributionCard({ item }: { item: Contribution }) {
  const [hov, setHov] = useState(false);

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        padding: "20px",
        border: `1px solid ${COLOR.outlineVariant}`,
        borderRadius: "12px",
        backgroundColor: hov ? COLOR.surfaceContainerHigh : COLOR.surfaceContainer,
        borderColor: hov ? COLOR.outline : COLOR.outlineVariant,
        transition: "background-color 0.15s, border-color 0.15s",
        cursor: "pointer",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "8px" }}>
        <span
          style={{
            ...CAPTION,
            padding: "3px 10px",
            borderRadius: "6px",
            backgroundColor: COLOR.surfaceContainerHighest,
            border: `1px solid ${COLOR.outlineVariant}`,
            color: COLOR.primary,
          }}
        >
          {item.tag}
        </span>
        <Icon name="arrow_forward" size={16} style={{ color: COLOR.outline, flexShrink: 0 }} />
      </div>

      <div>
        <h3 style={{ ...HEADLINE_MD, fontSize: "15px", margin: "0 0 6px" }}>
          {item.title}
        </h3>
        <p style={{ ...BODY_MD, fontSize: "13px", margin: 0 }}>
          {item.description}
        </p>
      </div>

      <span style={{ ...CAPTION, display: "flex", alignItems: "center", gap: "4px" }}>
        <Icon name="schedule" size={13} />
        {item.time}
      </span>
    </div>
  );
}

/* ── MOCK DATA (no backend yet) ───────────────────────────── */

const MOCK_PROFILES: Record<string, ProfileData> = {
  "6": {
    id: "6",
    username: "iuio",
    displayName: "iuio",
    fullName: "",
    email: "",
    role: "user",
    avatarInitial: "I",
    country: "",
    joined: "",
    links: [],
    bio: "",
    contributions: [],
  },
  "21": {
    id: "21",
    username: "Ahmed_21",
    displayName: "Ahmed",
    fullName: "Ahmed Al-Farsi",
    email: "ahmed.alfarsi@email.com",
    role: "contributor",
    avatarInitial: "A",
    country: "Algeria",
    joined: "Jan 2024",
    links: ["https://facebook.com/ahmed.alfarsi"],
    bio: "Independent researcher focusing on 12th-century theological manuscripts. I contribute translations and bibliographical annotations to the Oulamauna archive, specializing in texts originating from the Andalusian region.",
    contributions: [
      {
        id: 1,
        title: "Translation: Kitab al-Shifa",
        description: "Added new annotations to Chapter 3 regarding the philosophical interpretations of causation.",
        time: "2 days ago",
        tag: "Annotation",
      },
      {
        id: 2,
        title: "Manuscript Digitization: MS. 402",
        description: "Uploaded high-resolution scans of the margin notes found in the Cordoba collection.",
        time: "1 week ago",
        tag: "Media",
      },
      {
        id: 3,
        title: "Research Paper: Andalusian Philosophy",
        description: "Published comprehensive analysis of Ibn Rushd's commentaries on Aristotle's Metaphysics.",
        time: "2 weeks ago",
        tag: "Research",
      },
    ],
  },
  "42": {
    id: "42",
    username: "Fatima_Zahra",
    displayName: "Fatima Zahra",
    fullName: "Fatima Zahra Benali",
    email: "fatima.benali@email.com",
    role: "user",
    avatarInitial: "F",
    country: "Morocco",
    joined: "Sep 2024",
    links: [],
    bio: "Graduate student in Islamic Studies at Al-Qarawiyyin University. Passionate about preserving and digitizing North African manuscript collections. Currently researching female scholars in medieval Islamic scholarship.",
    contributions: [
      {
        id: 1,
        title: "Translation: Letter from Granada",
        description: "Translated a 15th-century correspondence between scholars in Granada and Fez regarding astronomical observations.",
        time: "3 days ago",
        tag: "Translation",
      },
      {
        id: 2,
        title: "Archive Contribution: Fez Library",
        description: "Added metadata for 50+ manuscripts from the Al-Qarawiyyin Library digital collection.",
        time: "5 days ago",
        tag: "Annotation",
      },
    ],
  },
};

function buildOwnProfile(user: any): ProfileData {
  const uid = String(user?.id ?? user?._id ?? "me");
  const mock = MOCK_PROFILES[uid];
  const displayName = user?.displayName ?? user?.username ?? mock?.displayName ?? "Your Profile";

  return {
    id: uid,
    username: user?.username ?? mock?.username ?? "you",
    displayName,
    fullName: user?.fullName ?? mock?.fullName ?? "",
    email: user?.email ?? mock?.email ?? "",
    role: (user?.role as Role) ?? mock?.role ?? "user",
    bio: user?.bio ?? mock?.bio ?? "",
    country: user?.country ?? mock?.country ?? "",
    joined: user?.joined ?? mock?.joined ?? "",
    links: Array.isArray(user?.links) ? user.links : mock?.links ?? [],
    avatarInitial: (displayName[0] ?? "U").toUpperCase(),
    contributions: mock?.contributions ?? [],
  };
}

function getPublicProfile(profileId: string): ProfileData | undefined {
  return MOCK_PROFILES[String(profileId)];
}

const fontImports = (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Source+Serif+4:ital,opsz,wght@0,8..60,200..900;1,8..60,200..900&family=Source+Sans+3:ital,wght@0,200..900;1,200..900&family=JetBrains+Mono:ital,wght@0,100..800;1,100..800&display=swap');
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
      .profile-contrib-grid { grid-template-columns: 1fr; }
      .profile-card-body { flex-direction: column !important; align-items: flex-start !important; }
      .profile-stats-row { gap: 24px !important; }
    }
  `}</style>
);

/* ═══════════════════════════════════════════════════════════════
   PROFILE CARD — the reusable "this looks like a real profile" unit
═══════════════════════════════════════════════════════════════ */

function ProfileCard({
  profile,
  showEditButton,
  onEdit,
  editLabel,
}: {
  profile: ProfileData;
  showEditButton: boolean;
  onEdit: () => void;
  editLabel: string;
}) {
  const manuscriptCount = profile.contributions.filter((c) => c.tag === "Media").length;

  return (
    <HoverCard style={{ overflow: "hidden" }}>
      <div style={{ padding: "28px" }}>
        <div
          className="profile-card-body"
          style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px" }}
        >
          <div
            style={{
              width: "88px",
              height: "88px",
              borderRadius: "50%",
              backgroundColor: COLOR.surfaceContainerHighest,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: COLOR.primary,
              ...HEADLINE_LG,
              fontSize: "32px",
              border: `1px solid ${COLOR.outlineVariant}`,
              flexShrink: 0,
            }}
          >
            {profile.avatarInitial}
          </div>

          {showEditButton && (
            <HoverBtn onClick={onEdit}>
              <Icon name="edit_square" size={14} />
              {editLabel}
            </HoverBtn>
          )}
        </div>

        <div style={{ marginTop: "16px", display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          <h1 style={{ ...HEADLINE_LG, fontSize: "22px", margin: 0 }}>{profile.displayName}</h1>
          <RoleBadge role={profile.role} />
        </div>
        <p style={{ ...BODY_MD, fontSize: "13px", margin: "4px 0 0" }}>@{profile.username}</p>

        {profile.bio && (
          <p style={{ ...BODY_LG, fontSize: "14px", margin: "16px 0 0", maxWidth: "560px" }}>
            {profile.bio}
          </p>
        )}

        {(profile.country || profile.joined) && (
          <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap", margin: "14px 0 0" }}>
            {profile.country && (
              <span style={{ ...CAPTION, display: "flex", alignItems: "center", gap: "4px" }}>
                <Icon name="location_on" size={14} style={{ color: COLOR.primary }} />
                {profile.country}
              </span>
            )}
            {profile.joined && (
              <span style={{ ...CAPTION, display: "flex", alignItems: "center", gap: "4px" }}>
                <Icon name="calendar_today" size={13} style={{ color: COLOR.primary }} />
                Joined {profile.joined}
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

        <div style={{ borderTop: `1px solid ${COLOR.outlineVariant}`, margin: "20px 0 0", paddingTop: "18px" }}>
          <div className="profile-stats-row" style={{ display: "flex", gap: "36px" }}>
            <StatBlock value={profile.contributions.length} label="Contributions" />
            <StatBlock value={manuscriptCount} label="Manuscripts" />
            <StatBlock value={profile.role === "contributor" ? "Yes" : "No"} label="Verified" />
          </div>
        </div>
      </div>
    </HoverCard>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN
═══════════════════════════════════════════════════════════════ */

export default function ProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { lang, t } = useLang();
  const { user, isLoggedIn, loading } = useAuth();
  const navigate = useNavigate();

  const isRTL = lang === "AR";

 const pageStyle: React.CSSProperties = {
  ...BODY_MD,
  backgroundColor: "#faf9f6",
  backgroundImage: "radial-gradient(circle at 50% 0%, rgba(201,168,76,0.06) 0%, transparent 60%)",
  minHeight: "100vh",
  color: COLOR.onSurface,
};

  if (loading) {
    return (
      <div dir={isRTL ? "rtl" : "ltr"} style={pageStyle}>
        {fontImports}
        <div style={{ maxWidth: "600px", margin: "0 auto", padding: "120px 32px", textAlign: "center", color: COLOR.onSurfaceVariant }}>
          Loading…
        </div>
      </div>
    );
  }

  /* ── ROUTE: /profile ─ */
  if (!id) {
    if (!isLoggedIn || !user) {
      return (
        <div dir={isRTL ? "rtl" : "ltr"} style={pageStyle}>
          {fontImports}
          <div style={{ maxWidth: "500px", margin: "0 auto", padding: "120px 32px", textAlign: "center" }}>
            <Icon name="lock" size={32} style={{ color: COLOR.outline, marginBottom: "12px" }} />
            <h1 style={{ ...HEADLINE_MD, color: COLOR.primary, margin: "0 0 8px" }}>You need to log in</h1>
            <p style={{ ...BODY_MD, fontSize: "13px", color: COLOR.onSurfaceVariant, margin: "0 0 16px" }}>
              Log in to see and manage your profile.
            </p>
            <HoverBtn onClick={() => navigate("/login")}>{t("editProfile.signIn") ?? "Log in"}</HoverBtn>
          </div>
        </div>
      );
    }

    const profile = buildOwnProfile(user);

    return (
      <div dir={isRTL ? "rtl" : "ltr"} style={pageStyle}>
        {fontImports}
        <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "48px 40px", display: "flex", gap: "32px" }}>
          <ProfileSidebar role={profile.role} active="profile" />

          <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: "28px" }}>
            <ProfileCard
              profile={profile}
              showEditButton={false}
              onEdit={() => navigate("/edit-profile")}
              editLabel={t("editProfile.editProfile") ?? "Edit profile"}
            />

            <section>
              <h2 style={{ ...HEADLINE_MD, fontSize: "16px", margin: "0 0 14px" }}>
                Recent Contributions
              </h2>
              {profile.contributions.length === 0 ? (
                <p style={{ ...BODY_MD, fontSize: "13px" }}>No contributions yet.</p>
              ) : (
                <div className="profile-contrib-grid">
                  {profile.contributions.map((c) => (
                    <ContributionCard key={c.id} item={c} />
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    );
  }

  /* ── ROUTE: /profile/:id ── */
  const profile = getPublicProfile(id);

  if (!profile) {
    return (
      <div dir={isRTL ? "rtl" : "ltr"} style={pageStyle}>
        {fontImports}
        <div style={{ maxWidth: "600px", margin: "0 auto", padding: "120px 32px", textAlign: "center" }}>
          <Icon name="person_off" size={40} style={{ color: COLOR.outline, marginBottom: "12px" }} />
          <h1 style={{ ...HEADLINE_MD, color: COLOR.primary, margin: "0 0 8px" }}>Profile not found</h1>
          <p style={{ ...BODY_MD, fontSize: "13px" }}>No profile exists for id "{id}".</p>
        </div>
      </div>
    );
  }

  const isOwner = !!user && (String(user.id) === String(profile.id) || String(user._id) === String(profile.id));

  return (
    <div dir={isRTL ? "rtl" : "ltr"} style={pageStyle}>
      {fontImports}
      <div style={{ maxWidth: "720px", margin: "0 auto", padding: "56px 32px", display: "flex", flexDirection: "column", gap: "28px" }}>
        <ProfileCard
          profile={profile}
          showEditButton={isOwner}
          onEdit={() => navigate("/edit-profile")}
          editLabel={t("editProfile.editProfile") ?? "Edit profile"}
        />

        <section>
          <h2 style={{ ...HEADLINE_MD, fontSize: "16px", margin: "0 0 14px" }}>
            Recent Contributions
          </h2>
          {profile.contributions.length === 0 ? (
            <p style={{ ...BODY_MD, fontSize: "13px" }}>No contributions yet.</p>
          ) : (
            <div className="profile-contrib-grid">
              {profile.contributions.map((c) => (
                <ContributionCard key={c.id} item={c} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}