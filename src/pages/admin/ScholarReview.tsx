import React, { useState, useMemo, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useLang } from "../../context/LanguageContext";

/* ------------------------------------------------------------------ */
/*  Design tokens — Oulamnauna admin palette                          */
/* ------------------------------------------------------------------ */
const colors = {
  creamLight: "#fcfaf5",
  creamMid: "#f6efdc",
  creamDark: "#e5d5a8",
  forestGreen: "#0b4335",
  amber: "#b8860b",
  red: "#8b2c2c",
};

const fonts = {
  headline: "'Hanken Grotesk', sans-serif",
  body: "'Inter', sans-serif",
  label: "'JetBrains Mono', monospace",
};

const cardStyle: React.CSSProperties = {
  backgroundColor: colors.creamLight,
  borderRadius: 12,
  boxShadow: "0px 4px 20px rgba(11, 67, 53, 0.08)",
  border: `1px solid ${colors.forestGreen}`,
};

/* ------------------------------------------------------------------ */
/*  Reusable UI Components                                             */
/* ------------------------------------------------------------------ */
const Icon: React.FC<{ name: string; size?: number; filled?: boolean }> = ({
  name,
  size = 18,
  filled = false,
}) => (
  <span
    className="material-symbols-outlined"
    style={{
      fontSize: size,
      lineHeight: 1,
      fontVariationSettings: `'FILL' ${filled ? 1 : 0}, 'wght' 400, 'GRAD' 0, 'opsz' 24`,
    }}
  >
    {name}
  </span>
);

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const map: Record<string, { bg: string; color: string; dot: string }> = {
    "Pending Review": { bg: colors.creamMid, color: colors.amber, dot: colors.amber },
    "Under Review": { bg: colors.creamDark, color: colors.forestGreen, dot: colors.forestGreen },
    Approved: { bg: colors.forestGreen, color: colors.creamLight, dot: colors.creamLight },
    Rejected: { bg: colors.red, color: colors.creamLight, dot: colors.creamLight },
  };
  const s = map[status] || map["Pending Review"];
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 10px", borderRadius: 9999, backgroundColor: s.bg, color: s.color, fontFamily: fonts.label, fontSize: 11, fontWeight: 600, letterSpacing: "0.03em", border: `1px solid ${colors.forestGreen}` }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: s.dot }} />
      {status}
    </span>
  );
};

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
type Language = "EN" | "AR" | "FR";

interface Contributor { name: string; contributions: number; profileUrl?: string; }
interface Work {
  title: string; year: number; format: string;
  digitalAccess?: "pdf" | "audio" | "file" | null;
  accessUrl?: string; accessSource?: "upload" | "link";
  accessFileName?: string; uploadedBy?: string; uploadedByUrl?: string;
}
interface MediaItem {
  media_id?: number; type: "pdf" | "audio" | "video"; title: string; description: string;
  viewCount: number; likeCount: number; action: string; actionIcon: string;
  accessUrl?: string; accessSource?: "upload" | "link"; accessFileName?: string;
  uploadedBy?: string; uploadedByUrl?: string;
}
interface RelatedPerson {
  initials: string; color: string; textColor: string; name: string; role: string; profileUrl?: string;
}
interface Reference { title: string; citation: string; url: string | null; }
interface RecentRevision { date: string; author: string; action: string; authorUrl?: string; }

interface ScholarDetail {
  id: number; versionId: number; status?: string;
  name: Record<Language, string>; subtitle: Record<Language, string>;
  createdBy: string; createdByUrl: string; createdDate: string;
  image: string;
  overviewText: Record<Language, string>;
  body: Record<Language, string[]>;
  atAGlance: { fullName: string; born: string; died: string; century: string; region: string; discipline: string; };
  contributors: Contributor[]; works: Work[]; media: MediaItem[];
  intellectualLineage: RelatedPerson[]; notableDisciples: RelatedPerson[];
  academicReferences: Reference[]; recentRevisions: RecentRevision[];
}

/* ------------------------------------------------------------------ */
/*  Mock Data                                                          */
/* ------------------------------------------------------------------ */
const MOCK_SCHOLAR: ScholarDetail = {
  id: 1, versionId: 101, status: "Pending Review",
  name: { EN: "Ibn al-Haytham", AR: "ابن الهيثم", FR: "Alhazen" },
  subtitle: { EN: "The Father of Modern Optics", AR: "أبو البصريات", FR: "Le Père de l'Optique Moderne" },
  createdBy: "Karim Mansouri", createdByUrl: "/profile/1", createdDate: "June 14, 2026",
  image: "https://ui-avatars.com/api/?name=Ibn+al-Haytham&background=0b4335&color=fff&size=128",
  overviewText: {
    EN: "Ibn al-Haytham was a pioneering polymath, mathematician, astronomer, and physicist of the Islamic Golden Age.",
    AR: "ابن الهيثم كان عالمًا موسوعيًا رائدًا، ورياضيًا، وفلكيًا، وفيزيائيًا في العصر الذهبي الإسلامي.",
    FR: "Ibn al-Haytham était un polymathe, mathématicien, astronome et physicien pionnier de l'âge d'or islamique."
  },
  body: {
    EN: [
      "He made significant contributions to the principles of optics, astronomy, mathematics, and the scientific method.",
      "His Book of Optics (1011-1021) laid the foundation for modern optics and influenced later European scholars like Kepler and Descartes."
    ],
    AR: [
      "قدم مساهمات كبيرة في مبادئ البصريات والفلك والرياضيات والمنهج العلمي.",
      "كتاب المناظر (1011-1021) وضع الأسس للبصريات الحديثة وأثر على علماء أوروبيين لاحقين مثل كيبلر وديكارت."
    ],
    FR: [
      "Il a apporté des contributions significatives aux principes de l'optique, de l'astronomie, des mathématiques et de la méthode scientifique.",
      "Son Livre d'optique (1011-1021) a jeté les bases de l'optique moderne et a influencé des savants européens ultérieurs comme Kepler et Descartes."
    ]
  },
  atAGlance: {
    fullName: "Abu Ali al-Hasan ibn al-Haytham",
    born: "965 CE / 354 AH",
    died: "1040 CE / 430 AH",
    century: "10th–11th century",
    region: "Basra, Iraq",
    discipline: "Optics, Mathematics, Astronomy"
  },
  contributors: [{ name: "Karim Mansouri", contributions: 1, profileUrl: "/profile/1" }],
  works: [
    { title: "Book of Optics (Kitab al-Manazir)", year: 1021, format: "BOOK", digitalAccess: "pdf", accessUrl: "#", accessSource: "upload", accessFileName: "optics.pdf", uploadedBy: "Karim Mansouri", uploadedByUrl: "/profile/1" },
    { title: "Doubts Concerning Ptolemy", year: 1028, format: "TREATISE", digitalAccess: null }
  ],
  media: [
    { media_id: 1, type: "pdf", title: "Manuscript Scan", description: "High-res scan of the 13th century manuscript", viewCount: 124, likeCount: 15, action: "DOWNLOAD FILE", actionIcon: "download", accessUrl: "#", accessSource: "upload", accessFileName: "manuscript.pdf", uploadedBy: "Karim Mansouri", uploadedByUrl: "/profile/1" },
    { media_id: 2, type: "video", title: "Lecture on Optics", description: "Modern academic lecture discussing his theories", viewCount: 89, likeCount: 8, action: "WATCH NOW", actionIcon: "open_in_new", accessUrl: "https://youtube.com", accessSource: "link" }
  ],
  intellectualLineage: [
    { initials: "BM", color: colors.forestGreen, textColor: colors.creamLight, name: "Banu Musa", role: "HISTORICAL INFLUENCE", profileUrl: "/scholars/2" }
  ],
  notableDisciples: [
    { initials: "RB", color: colors.amber, textColor: colors.forestGreen, name: "Roger Bacon", role: "DISCIPLE", profileUrl: "/scholars/3" },
    { initials: "JK", color: colors.red, textColor: colors.creamLight, name: "Johannes Kepler", role: "DISCIPLE", profileUrl: "/scholars/4" }
  ],
  academicReferences: [
    { title: "The Optics of Ibn al-Haytham", citation: "Sabra, A. I. (1989). The Optics of Ibn al-Haytham. Kuwait: National Council for Culture, Arts and Letters.", url: "https://example.com/ref1" }
  ],
  recentRevisions: [
    { date: "June 14, 2026", author: "Karim Mansouri", action: "Version 101 - Pending Review", authorUrl: "/profile/1" }
  ]
};

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */
export default function ScholarReview() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const langParam = searchParams.get("lang") as Language | null;
  const navigate = useNavigate();
  const { lang: siteLang } = useLang();
  
  const initialLang = (langParam === "EN" || langParam === "AR" || langParam === "FR") 
    ? langParam 
    : (siteLang as Language);

  const [lang, setLang] = useState<Language>(initialLang);
  const [data, setData] = useState<ScholarDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showApproveConfirm, setShowApproveConfirm] = useState(false);
  const [showRejectConfirm, setShowRejectConfirm] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setData(MOCK_SCHOLAR);
      setIsLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, [id, lang]);

  if (isLoading || !data) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: colors.creamLight, color: colors.forestGreen }}>
        <Icon name="hourglass_empty" size={32} />
      </div>
    );
  }

  const isRTL = lang === "AR";
  const thStyle: React.CSSProperties = { fontFamily: fonts.label, fontSize: 11, letterSpacing: "0.06em", fontWeight: 600, color: colors.forestGreen, textAlign: isRTL ? "right" : "left", padding: "12px 14px", borderBottom: `1px solid ${colors.forestGreen}`, textTransform: "uppercase", opacity: 0.8 };
  const tdStyle: React.CSSProperties = { fontFamily: fonts.body, fontSize: 13, color: colors.forestGreen, padding: "14px", borderBottom: `1px solid ${colors.creamDark}`, textAlign: isRTL ? "right" : "left" };

  const handleApprove = () => {
    console.log("Approved:", data.id);
    setShowApproveConfirm(false);
    navigate("/admin/pending/scholars");
  };

  const handleReject = () => {
    console.log("Rejected:", data.id);
    setShowRejectConfirm(false);
    navigate("/admin/pending/scholars");
  };

  return (
    <div dir={isRTL ? "rtl" : "ltr"} style={{ fontFamily: fonts.body, color: colors.forestGreen, backgroundColor: colors.creamLight, minHeight: "100vh", padding: 24 }}>
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>

        {/* ── Back Navigation ── */}
        <button
          onClick={() => navigate("/admin/pending/scholars")}
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", backgroundColor: "transparent", border: `1px solid ${colors.forestGreen}`, borderRadius: 8, fontFamily: fonts.body, fontSize: 12, color: colors.forestGreen, cursor: "pointer", marginBottom: 16 }}
        >
          <Icon name={isRTL ? "arrow_forward" : "arrow_back"} size={14} /> {isRTL ? "العودة إلى قائمة العلماء" : "Back to Pending Scholars"}
        </button>

        {/* ── Profile Header ── */}
        <section style={{ ...cardStyle, padding: 24, marginBottom: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 20, flexWrap: "wrap" }}>
            <div style={{ display: "flex", gap: 18, alignItems: "flex-start" }}>
              {data.image ? (
                <img src={data.image} alt={data.name[lang]} style={{ width: 72, height: 72, borderRadius: "50%", objectFit: "cover", border: `2px solid ${colors.forestGreen}`, flexShrink: 0 }} />
              ) : (
                <div style={{ width: 72, height: 72, borderRadius: "50%", backgroundColor: colors.forestGreen, color: colors.creamLight, border: `1px solid ${colors.forestGreen}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: fonts.headline, fontWeight: 700, fontSize: 28, flexShrink: 0 }}>
                  {data.name[lang].charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6, flexWrap: "wrap" }}>
                  <h1 style={{ fontFamily: fonts.headline, fontSize: 24, fontWeight: 700, color: colors.forestGreen, margin: 0 }}>
                    {data.name[lang]}
                  </h1>
                  <StatusBadge status={data.status || "Pending Review"} />
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 10px", borderRadius: 9999, backgroundColor: colors.creamMid, color: colors.forestGreen, fontFamily: fonts.label, fontSize: 11, fontWeight: 600, border: `1px solid ${colors.forestGreen}` }}>
                    {lang} {isRTL ? "نسخة" : "Version"}
                  </span>
                </div>
                <p style={{ fontFamily: fonts.body, fontSize: 13, color: colors.forestGreen, margin: "0 0 4px", fontStyle: "italic", opacity: 0.8 }}>
                  {data.subtitle[lang]}
                </p>
                <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginTop: 8 }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 4, fontFamily: fonts.label, fontSize: 11, color: colors.forestGreen, opacity: 0.8 }}>
                    <Icon name="person" size={12} /> {data.atAGlance.region}
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: 4, fontFamily: fonts.label, fontSize: 11, color: colors.forestGreen, opacity: 0.8 }}>
                    <Icon name="event" size={12} /> {isRTL ? "أرسلت" : "Submitted"}: {data.createdDate} {isRTL ? "بواسطة" : "by"} {data.createdBy}
                  </span>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button onClick={() => setShowRejectConfirm(true)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", backgroundColor: "transparent", border: `1px solid ${colors.red}`, borderRadius: 8, fontFamily: fonts.body, fontSize: 13, fontWeight: 500, color: colors.red, cursor: "pointer" }}>
                <Icon name="close" size={14} /> {isRTL ? "رفض" : "Reject"}
              </button>
              <button style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", backgroundColor: "transparent", border: `1px solid ${colors.forestGreen}`, borderRadius: 8, fontFamily: fonts.body, fontSize: 13, fontWeight: 500, color: colors.forestGreen, cursor: "pointer" }}>
                <Icon name="edit" size={14} /> {isRTL ? "طلب تعديلات" : "Request Changes"}
              </button>
              <button onClick={() => setShowApproveConfirm(true)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", backgroundColor: colors.forestGreen, border: `1px solid ${colors.forestGreen}`, borderRadius: 8, fontFamily: fonts.body, fontSize: 13, fontWeight: 500, color: colors.creamLight, cursor: "pointer" }}>
                <Icon name="check" size={14} filled /> {isRTL ? "موافقة على العالم" : "Approve Scholar"}
              </button>
            </div>
          </div>
        </section>

       

        {/* ── Two-Column Content ── */}
        <div style={{ display: "grid", gridTemplateColumns: isRTL ? "1fr 2fr" : "2fr 1fr", gap: 18 }}>
          
          {/* Left Column (Main Content) */}
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            
            {/* Biography */}
            <section style={{ ...cardStyle, padding: 20 }}>
              <h2 style={{ fontFamily: fonts.headline, fontSize: 16, fontWeight: 600, color: colors.forestGreen, margin: "0 0 12px", display: "flex", alignItems: "center", gap: 8 }}>
                <Icon name="person" size={18} filled /> {isRTL ? "السيرة الذاتية" : "Biography"}
              </h2>
              <p style={{ fontFamily: fonts.body, fontSize: 13, lineHeight: 1.6, color: colors.forestGreen, margin: "0 0 16px", fontWeight: 500 }}>
                {data.overviewText[lang]}
              </p>
              {(data.body[lang] || []).map((para, i) => (
                <p key={i} style={{ fontFamily: isRTL ? "'Amiri', serif" : fonts.body, fontSize: isRTL ? 15 : 13, lineHeight: 1.8, color: colors.forestGreen, margin: "0 0 12px", opacity: 0.85 }}>
                  {para}
                </p>
              ))}
            </section>

            {/* Works */}
            <section style={{ ...cardStyle, padding: 20, overflow: "hidden" }}>
              <h2 style={{ fontFamily: fonts.headline, fontSize: 16, fontWeight: 600, color: colors.forestGreen, margin: "0 0 14px", display: "flex", alignItems: "center", gap: 8 }}>
                <Icon name="library_books" size={18} filled /> {isRTL ? "الأعمال والمؤلفات" : "Works & Bibliography"}
              </h2>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead style={{ backgroundColor: colors.creamMid }}>
                    <tr>
                      <th style={thStyle}>{isRTL ? "العنوان" : "Title"}</th>
                      <th style={thStyle}>{isRTL ? "السنة" : "Year"}</th>
                      <th style={thStyle}>{isRTL ? "الصيغة" : "Format"}</th>
                      <th style={thStyle}>{isRTL ? "الوصول" : "Access"}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.works.map((w, i) => (
                      <tr key={i} style={{ transition: "background-color 0.15s" }} onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = colors.creamMid)} onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}>
                        <td style={tdStyle}>
                          <p style={{ margin: 0, fontWeight: 600, fontFamily: fonts.headline, fontSize: 13 }}>{w.title}</p>
                          {w.uploadedBy && <p style={{ margin: "2px 0 0", fontFamily: fonts.label, fontSize: 10, opacity: 0.7 }}>{isRTL ? "بواسطة" : "by"} {w.uploadedBy}</p>}
                        </td>
                        <td style={{ ...tdStyle, fontFamily: fonts.label, fontSize: 12 }}>{w.year}</td>
                        <td style={tdStyle}>
                          <span style={{ padding: "3px 8px", borderRadius: 6, backgroundColor: colors.creamMid, border: `1px solid ${colors.creamDark}`, fontFamily: fonts.label, fontSize: 11 }}>
                            {w.format}
                          </span>
                        </td>
                        <td style={tdStyle}>
                          {w.accessUrl ? (
                            <button style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 10px", backgroundColor: colors.creamLight, border: `1px solid ${colors.forestGreen}`, borderRadius: 6, fontFamily: fonts.label, fontSize: 11, color: colors.forestGreen, cursor: "pointer" }}>
                              <Icon name={w.accessSource === "upload" ? "download" : "open_in_new"} size={14} />
                              {w.accessSource === "upload" ? (isRTL ? "تحميل" : "Download") : (isRTL ? "عرض" : "View")}
                            </button>
                          ) : (
                            <span style={{ fontFamily: fonts.label, fontSize: 11, opacity: 0.5 }}>{isRTL ? "لا يوجد" : "None"}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Media */}
            <section style={{ ...cardStyle, padding: 20 }}>
              <h2 style={{ fontFamily: fonts.headline, fontSize: 16, fontWeight: 600, color: colors.forestGreen, margin: "0 0 14px", display: "flex", alignItems: "center", gap: 8 }}>
                <Icon name="media_link" size={18} filled /> {isRTL ? "الوسائط المتكاملة" : "Integrated Media"}
              </h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 14 }}>
                {data.media.map((m, i) => (
                  <div key={i} style={{ ...cardStyle, padding: 16, display: "flex", flexDirection: "column", gap: 10, backgroundColor: colors.creamMid, border: `1px solid ${colors.creamDark}` }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <Icon name={m.type === "video" ? "movie" : m.type === "audio" ? "graphic_eq" : "article"} size={24} />
                      <span style={{ fontFamily: fonts.label, fontSize: 10, padding: "2px 6px", borderRadius: 4, backgroundColor: colors.creamLight, border: `1px solid ${colors.creamDark}` }}>{m.type.toUpperCase()}</span>
                    </div>
                    <p style={{ fontFamily: fonts.headline, fontSize: 14, fontWeight: 600, margin: 0, lineHeight: 1.3 }}>{m.title}</p>
                    <p style={{ fontFamily: fonts.body, fontSize: 12, color: colors.forestGreen, opacity: 0.8, margin: 0, lineHeight: 1.4 }}>{m.description}</p>
                    {m.accessUrl && (
                      <a href={m.accessUrl} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none", marginTop: "auto" }}>
                        <button style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "8px", backgroundColor: colors.forestGreen, color: colors.creamLight, border: "none", borderRadius: 6, fontFamily: fonts.body, fontSize: 12, fontWeight: 500, cursor: "pointer" }}>
                          <Icon name={m.actionIcon} size={16} /> {m.action}
                        </button>
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Right Column (Sidebar) */}
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            
            {/* Relationships */}
            <section style={{ ...cardStyle, padding: 20 }}>
              <h2 style={{ fontFamily: fonts.headline, fontSize: 16, fontWeight: 600, color: colors.forestGreen, margin: "0 0 14px", display: "flex", alignItems: "center", gap: 8 }}>
                <Icon name="account_tree" size={18} filled /> {isRTL ? "العلاقات" : "Relationships"}
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                  <p style={{ fontFamily: fonts.label, fontSize: 10, letterSpacing: "0.06em", color: colors.forestGreen, margin: "0 0 8px", opacity: 0.7 }}>{isRTL ? "السلسلة الفكرية" : "INTELLECTUAL LINEAGE"}</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {data.intellectualLineage.map((p, i) => (
                      <a key={i} href={p.profileUrl} style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", padding: 8, borderRadius: 8, transition: "background 0.15s" }} onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = colors.creamMid)} onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}>
                        <div style={{ width: 32, height: 32, borderRadius: "50%", backgroundColor: p.color, color: p.textColor, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: fonts.headline, fontWeight: 700, fontSize: 12, flexShrink: 0 }}>{p.initials}</div>
                        <div>
                          <p style={{ fontFamily: fonts.body, fontSize: 13, fontWeight: 600, color: colors.forestGreen, margin: 0 }}>{p.name}</p>
                          <p style={{ fontFamily: fonts.label, fontSize: 10, color: colors.forestGreen, opacity: 0.7, margin: 0 }}>{p.role}</p>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
                <div style={{ borderTop: `1px dashed ${colors.creamDark}`, paddingTop: 16 }}>
                  <p style={{ fontFamily: fonts.label, fontSize: 10, letterSpacing: "0.06em", color: colors.forestGreen, margin: "0 0 8px", opacity: 0.7 }}>{isRTL ? "أبرز التلامذة" : "NOTABLE DISCIPLES"}</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {data.notableDisciples.map((p, i) => (
                      <a key={i} href={p.profileUrl} style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", padding: 8, borderRadius: 8, transition: "background 0.15s" }} onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = colors.creamMid)} onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}>
                        <div style={{ width: 32, height: 32, borderRadius: "50%", backgroundColor: p.color, color: p.textColor, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: fonts.headline, fontWeight: 700, fontSize: 12, flexShrink: 0 }}>{p.initials}</div>
                        <div>
                          <p style={{ fontFamily: fonts.body, fontSize: 13, fontWeight: 600, color: colors.forestGreen, margin: 0 }}>{p.name}</p>
                          <p style={{ fontFamily: fonts.label, fontSize: 10, color: colors.forestGreen, opacity: 0.7, margin: 0 }}>{p.role}</p>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* Academic References */}
            <section style={{ ...cardStyle, padding: 20 }}>
              <h2 style={{ fontFamily: fonts.headline, fontSize: 16, fontWeight: 600, color: colors.forestGreen, margin: "0 0 14px", display: "flex", alignItems: "center", gap: 8 }}>
                <Icon name="menu_book" size={18} filled /> {isRTL ? "المراجع" : "References"}
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {data.academicReferences.map((r, i) => (
                  <div key={i} style={{ padding: 12, backgroundColor: colors.creamMid, border: `1px solid ${colors.creamDark}`, borderRadius: 8 }}>
                    <p style={{ fontFamily: fonts.headline, fontSize: 13, fontWeight: 600, color: colors.forestGreen, margin: "0 0 4px" }}>{r.title}</p>
                    <p style={{ fontFamily: fonts.body, fontSize: 12, color: colors.forestGreen, opacity: 0.8, margin: "0 0 6px", lineHeight: 1.5 }}>{r.citation}</p>
                    {r.url && (
                      <a href={r.url} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 4, fontFamily: fonts.label, fontSize: 11, color: colors.forestGreen, textDecoration: "underline" }}>
                        <Icon name="link" size={12} /> {isRTL ? "عرض المصدر" : "View Source"}
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </section>

            {/* Activity Timeline */}
            <section style={{ ...cardStyle, padding: 20 }}>
              <h2 style={{ fontFamily: fonts.headline, fontSize: 16, fontWeight: 600, color: colors.forestGreen, margin: "0 0 14px", display: "flex", alignItems: "center", gap: 8 }}>
                <Icon name="history" size={18} filled /> {isRTL ? "النشاط" : "Activity"}
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {data.recentRevisions.map((a, i) => (
                  <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                    <div style={{ width: 24, height: 24, borderRadius: "50%", backgroundColor: colors.creamMid, color: colors.forestGreen, border: `1px solid ${colors.forestGreen}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Icon name="upload" size={13} />
                    </div>
                    <div>
                      <p style={{ fontFamily: fonts.body, fontSize: 12, fontWeight: 500, color: colors.forestGreen, margin: 0 }}>{a.action}</p>
                      <p style={{ fontFamily: fonts.label, fontSize: 10, color: colors.forestGreen, margin: "2px 0 0", opacity: 0.7 }}>
                        {a.date} {isRTL ? "بواسطة" : "by"} {a.author}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>

        {/* ─ Approve Confirmation Modal ── */}
        {showApproveConfirm && (
          <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(11, 67, 53, 0.5)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }} onClick={() => setShowApproveConfirm(false)}>
            <div style={{ ...cardStyle, backgroundColor: colors.creamLight, width: 440, maxWidth: "90vw", padding: 32, boxShadow: "0 20px 60px rgba(0,0,0,0.18)" }} onClick={(e) => e.stopPropagation()}>
              <div style={{ width: 56, height: 56, borderRadius: "50%", backgroundColor: colors.forestGreen, color: colors.creamLight, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20, border: `1px solid ${colors.forestGreen}` }}>
                <Icon name="check_circle" size={28} filled />
              </div>
              <h2 style={{ fontFamily: fonts.headline, fontSize: 20, fontWeight: 700, color: colors.forestGreen, marginBottom: 12 }}>{isRTL ? "موافقة على العالم" : "Approve Scholar"}</h2>
              <p style={{ fontFamily: fonts.body, fontSize: 14, color: colors.forestGreen, lineHeight: 1.6, marginBottom: 28, opacity: 0.8 }}>
                {isRTL ? `هل أنت متأكد من الموافقة على "${data.name[lang]}"؟ سيتم نشر ملف العالم على البوابة.` : `Are you sure you want to approve "${data.name[lang]}"? This will publish the scholar profile to the portal.`}
              </p>
              <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
                <button onClick={() => setShowApproveConfirm(false)} style={{ padding: "10px 24px", borderRadius: 8, cursor: "pointer", border: `1px solid ${colors.forestGreen}`, backgroundColor: colors.creamLight, fontFamily: fonts.body, fontSize: 13, fontWeight: 600, color: colors.forestGreen }}>{isRTL ? "إلغاء" : "Cancel"}</button>
                <button onClick={handleApprove} style={{ padding: "10px 24px", borderRadius: 8, cursor: "pointer", border: `1px solid ${colors.forestGreen}`, backgroundColor: colors.forestGreen, fontFamily: fonts.body, fontSize: 13, fontWeight: 700, color: colors.creamLight }}>{isRTL ? "تأكيد الموافقة" : "Confirm Approve"}</button>
              </div>
            </div>
          </div>
        )}

        {/* ── Reject Confirmation Modal ── */}
        {showRejectConfirm && (
          <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(11, 67, 53, 0.5)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }} onClick={() => setShowRejectConfirm(false)}>
            <div style={{ ...cardStyle, backgroundColor: colors.creamLight, width: 440, maxWidth: "90vw", padding: 32, boxShadow: "0 20px 60px rgba(0,0,0,0.18)" }} onClick={(e) => e.stopPropagation()}>
              <div style={{ width: 56, height: 56, borderRadius: "50%", backgroundColor: colors.red, color: colors.creamLight, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20, border: `1px solid ${colors.red}` }}>
                <Icon name="cancel" size={28} filled />
              </div>
              <h2 style={{ fontFamily: fonts.headline, fontSize: 20, fontWeight: 700, color: colors.forestGreen, marginBottom: 12 }}>{isRTL ? "رفض الطلب" : "Reject Submission"}</h2>
              <p style={{ fontFamily: fonts.body, fontSize: 14, color: colors.forestGreen, lineHeight: 1.6, marginBottom: 28, opacity: 0.8 }}>
                {isRTL ? `هل أنت متأكد من رفض "${data.name[lang]}"؟ سيتم إشعار المساهم.` : `Are you sure you want to reject "${data.name[lang]}"? The contributor will be notified.`}
                <br /><b style={{ color: colors.red }}>{isRTL ? "لا يمكن التراجع عن هذا الإجراء." : "This action cannot be undone."}</b>
              </p>
              <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
                <button onClick={() => setShowRejectConfirm(false)} style={{ padding: "10px 24px", borderRadius: 8, cursor: "pointer", border: `1px solid ${colors.forestGreen}`, backgroundColor: colors.creamLight, fontFamily: fonts.body, fontSize: 13, fontWeight: 600, color: colors.forestGreen }}>{isRTL ? "إلغاء" : "Cancel"}</button>
                <button onClick={handleReject} style={{ padding: "10px 24px", borderRadius: 8, cursor: "pointer", border: `1px solid ${colors.red}`, backgroundColor: colors.red, fontFamily: fonts.body, fontSize: 13, fontWeight: 700, color: colors.creamLight }}>{isRTL ? "تأكيد الرفض" : "Confirm Reject"}</button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}