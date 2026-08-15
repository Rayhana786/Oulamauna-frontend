import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useLang } from "../context/LanguageContext";
// Drop your own images at these paths:
// - src/assets/about-hero.jpg      (wide banner under the title)
// - src/assets/about-archive.jpg   (tall image next to "Our Archive")
import heroImage from "../assets/library-2.jpg";
import archiveImage from "../assets/library-2.jpg";

type Language = "EN" | "AR" | "FR";

/* ─────────────────────────────────────────────
   SHARED STYLE CONSTANTS (matches ContactPage / ScholarDetailPage)
───────────────────────────────────────────── */
const MONO: React.CSSProperties = { fontFamily: "'JetBrains Mono', monospace" };
const SERIF: React.CSSProperties = { fontFamily: "'Source Serif 4', serif" };
const BTN_PRIMARY: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: "6px", padding: "10px 20px",
  border: "1.5px solid #0b4335", borderRadius: "6px", backgroundColor: "transparent", color: "#0b4335",
  fontSize: "10px", fontWeight: 700, letterSpacing: "0.1em", cursor: "pointer",
  transition: "background 0.15s, color 0.15s", ...MONO,
};

function Icon({ name, size = 16 }: { name: string; size?: number }) {
  return (
    <span className="material-symbols-outlined" style={{ fontSize: `${size}px`, lineHeight: 1, userSelect: "none" }}>
      {name}
    </span>
  );
}

function TextLink({ children, isRTL, dark = false, to = "#" }: { children: React.ReactNode; isRTL: boolean; dark?: boolean; to?: string }) {
  const [hov, setHov] = useState(false);
  const color = dark ? "#fff" : "#0b4335";
  return (
    <Link
      to={to}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        ...MONO, fontSize: "10px", fontWeight: 700, letterSpacing: "0.1em", color,
        display: "inline-flex", alignItems: "center", gap: "6px", textDecoration: "none",
        borderBottom: hov ? `1px solid ${color}` : "1px solid transparent", paddingBottom: "2px",
        transition: "border-color 0.15s",
      }}
    >
      {children}
      <Icon name={isRTL ? "north_west" : "north_east"} size={13} />
    </Link>
  );
}

/* ─────────────────────────────────────────────
   TRANSLATIONS
───────────────────────────────────────────── */
const content: Record<Language, any> = {
  EN: {
    breadcrumb: "HOME › ABOUT",
    title: "About Us",
    heroDescription: "A free, collaborative encyclopedia dedicated to the scholars and thinkers of the Islamic intellectual tradition.",
    introLeft: "Oulamauna was created with a clear purpose: to preserve the lives and works of the scholars who shaped Islamic thought, and to make that knowledge easy to find, read, and pass on.",
    introRight: "With years of care behind every entry, our contributors are driven by respect for scholarship and a love of the tradition they document.",
    whatLabel: "What we do?",
    whatBody: "We gather biographies, manuscripts, and academic references into one multilingual archive.",
    archiveLabel: "Our Archive",
    archiveP1: "Every entry brings together a scholar's biography, notable works, and available manuscripts in one place — in Arabic, English, and French.",
    archiveP2: "To keep entries reliable, we ask contributors to cite their sources, and every submission passes a review before it goes live.",
    accessLabel: "Openness",
    accessBody: "At Oulamauna, openness is at the heart of what we do. We believe scholarly heritage should be easy to reach and easy to understand.",
    accessSub: "That's why every entry is free to read in three languages, so no single language limits who can learn from it.",
    teamLabel: "Our Contributors",
    teamBody: "Our contributors aren't just adding names — they're researchers and readers with a deep respect for the tradition they document. Their care for sources and accuracy is what keeps the archive trustworthy.",
    exploreLink: "EXPLORE SCHOLARS",
    
  },
  AR: {
    breadcrumb: "الرئيسية › من نحن",
    title: "من نحن",
    heroDescription: "موسوعة تعاونية مجانية مخصصة لعلماء ومفكري التراث الفكري الإسلامي.",
    introLeft: "أُنشئت منصة علماؤنا بهدف واضح: حفظ سِيَر وأعمال العلماء الذين شكّلوا الفكر الإسلامي، وجعل هذه المعرفة سهلة الوصول والقراءة والنقل.",
    introRight: "بفضل سنوات من العناية وراء كل مدخل، يدفع مساهمينا احترامٌ للعلم وحبٌ للتراث الذي يوثقونه.",
    whatLabel: "ماذا نفعل؟",
    whatBody: "نجمع السِيَر والمخطوطات والمراجع الأكاديمية في أرشيف واحد متعدد اللغات.",
    archiveLabel: "أرشيفنا",
    archiveP1: "يجمع كل مدخل سيرة العالم وأعماله البارزة ومخطوطاته المتاحة في مكان واحد، بالعربية والإنجليزية والفرنسية.",
    archiveP2: "للحفاظ على موثوقية المداخل، نطلب من المساهمين الاستشهاد بمصادرهم، ويمر كل إسهام بمراجعة قبل نشره.",
    accessLabel: "الانفتاح",
    accessBody: "في علماؤنا، الانفتاح هو جوهر عملنا. نؤمن بأن التراث العلمي يجب أن يكون سهل المنال وسهل الفهم.",
    accessSub: "لهذا فإن كل مدخل متاح للقراءة مجاناً بثلاث لغات، فلا تحدّ لغة واحدة من يستطيع التعلّم منه.",
    teamLabel: "مساهمونا",
    teamBody: "مساهمونا ليسوا مجرد من يضيف أسماء — بل باحثون وقراء يكنّون احتراماً عميقاً للتراث الذي يوثقونه. عنايتهم بالمصادر والدقة هي ما يحافظ على موثوقية الأرشيف.",
    exploreLink: "تصفح العلماء",
    
  },
  FR: {
    breadcrumb: "ACCUEIL › À PROPOS",
    title: "À propos",
    heroDescription: "Une encyclopédie collaborative et gratuite consacrée aux savants et penseurs de la tradition intellectuelle islamique.",
    introLeft: "Oulamauna est né d'un objectif clair : préserver la vie et l'œuvre des savants qui ont façonné la pensée islamique, et rendre ce savoir facile à trouver, à lire et à transmettre.",
    introRight: "Portés par des années d'attention apportée à chaque fiche, nos contributeurs sont animés par le respect du savoir et l'amour de la tradition qu'ils documentent.",
    whatLabel: "Que faisons-nous ?",
    whatBody: "Nous rassemblons biographies, manuscrits et références académiques dans une seule archive multilingue.",
    archiveLabel: "Notre archive",
    archiveP1: "Chaque fiche réunit la biographie d'un savant, ses œuvres notables et les manuscrits disponibles en un seul endroit — en arabe, en anglais et en français.",
    archiveP2: "Pour garantir la fiabilité des fiches, nous demandons aux contributeurs de citer leurs sources, et chaque soumission passe par une relecture avant sa publication.",
    accessLabel: "Ouverture",
    accessBody: "Chez Oulamauna, l'ouverture est au cœur de notre démarche. Nous croyons que le patrimoine savant doit être facile d'accès et facile à comprendre.",
    accessSub: "C'est pourquoi chaque fiche se lit gratuitement en trois langues, pour qu'aucune langue ne limite l'accès au savoir.",
    teamLabel: "Nos contributeurs",
    teamBody: "Nos contributeurs ne se contentent pas d'ajouter des noms — ce sont des chercheurs et des lecteurs animés d'un profond respect pour la tradition qu'ils documentent. Leur souci des sources et de l'exactitude est ce qui garantit la fiabilité de l'archive.",
    exploreLink: "PARCOURIR LES SAVANTS",
   
  },
};

/* ─────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────── */
const AboutPage: React.FC = () => {
  const { lang } = useLang();
  const t = content[lang as Language];
  const isRTL = lang === "AR";

  return (
    <div
      dir={isRTL ? "rtl" : "ltr"}
     style={{
  fontFamily: "'Source Sans 3', sans-serif", minHeight: "100vh", backgroundColor: "#faf9f6",
  backgroundImage: "radial-gradient(circle at 50% 0%, rgba(201,168,76,0.06) 0%, transparent 60%)",
  color: "#191c1b",
}}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Source+Serif+4:ital,opsz,wght@0,8..60,200..900;1,8..60,200..900&family=Source+Sans+3:ital,wght@0,200..900;1,200..900&family=JetBrains+Mono:ital,wght@0,100..800;1,100..800&family=Amiri:ital,wght@0,400;0,700;1,400&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap');
        .material-symbols-outlined { font-variation-settings: 'FILL' 0,'wght' 400,'GRAD' 0,'opsz' 24; font-family: 'Material Symbols Outlined'; display: inline-block; vertical-align: middle; }
        * { box-sizing: border-box; }
        @media (max-width: 900px) {
          .about-grid { grid-template-columns: 1fr !important; }
          .about-grid > * { grid-column: 1 !important; }
          .about-image { grid-row: auto !important; margin-top: 20px; }
        }
      `}</style>

      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "64px 40px 0" }}>

        {/* Hero banner — same treatment as the Contact page */}
        <div style={{
          position: "relative", overflow: "hidden", borderRadius: "16px",
          padding: "48px 40px", marginBottom: "48px",
          border: "1px solid rgba(201,168,76,0.25)",
          backgroundImage: `url(${heroImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}>
          <div style={{
            position: "absolute", inset: 0,
            background: "linear-gradient(120deg, rgba(11,67,53,0.92) 0%, rgba(11,67,53,0.75) 45%, rgba(11,67,53,0.4) 100%)",
          }} />
          <div style={{ position: "relative", zIndex: 1 }}>
            <p style={{ ...MONO, fontSize: "11px", color: "rgba(255,255,255,0.6)", letterSpacing: "0.05em", marginBottom: "18px" }}>
              {t.breadcrumb}
            </p>
            <h1 style={{ ...SERIF, fontSize: "40px", fontWeight: 700, color: "#fff", margin: "0 0 16px 0" }}>
              {t.title}
            </h1>
           <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.8)", lineHeight: 1.75, maxWidth: "620px", margin: 0 }}>
              {t.heroDescription}
            </p>
          </div>
        </div>

        {/* Intro split text */}
        <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: "48px", marginBottom: "64px" }}>
          <p style={{ fontSize: "17px", color: "#191c1b", lineHeight: 1.6, margin: 0 }}>
            {t.introLeft}
          </p>
          <p style={{ fontSize: "13px", color: "#707974", lineHeight: 1.75, margin: 0 }}>
            {t.introRight}
          </p>
        </div>

        {/* What we do / Our Archive / image — Openness / Our Contributors */}
        <div
          className="about-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "200px 1fr 300px",
            columnGap: "40px",
            rowGap: "48px",
            marginBottom: "64px",
          }}
        >
          <div style={{ gridColumn: 1, gridRow: 1 }}>
            <p style={{ ...MONO, fontSize: "9px", color: "#707974", letterSpacing: "0.1em", margin: "0 0 10px 0" }}>
              {t.whatLabel}
            </p>
            <p style={{ fontSize: "14px", color: "#191c1b", lineHeight: 1.6, margin: 0, fontWeight: 500 }}>
              {t.whatBody}
            </p>
          </div>

          <div style={{ gridColumn: 2, gridRow: 1 }}>
            <p style={{
              ...MONO, fontSize: "10px", color: "#0b4335", letterSpacing: "0.08em", fontWeight: 700,
              margin: "0 0 14px 0", textDecoration: "underline", textUnderlineOffset: "4px", textDecorationColor: "#C9A84C",
            }}>
              {t.archiveLabel}
            </p>
            <p style={{ fontSize: "13px", color: "#404945", lineHeight: 1.75, margin: "0 0 16px 0" }}>
              {t.archiveP1}
            </p>
            <p style={{ fontSize: "13px", color: "#404945", lineHeight: 1.75, margin: 0 }}>
              {t.archiveP2}
            </p>
          </div>

          <div className="about-image" style={{
            gridColumn: 3, gridRow: "1 / span 2", borderRadius: "12px", overflow: "hidden",
            border: "1px solid rgba(192,201,195,0.4)", minHeight: "260px",
          }}>
            <img src={archiveImage} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
          </div>

          <div style={{ gridColumn: 1, gridRow: 2 }}>
            <p style={{ ...MONO, fontSize: "9px", color: "#707974", letterSpacing: "0.1em", margin: "0 0 10px 0" }}>
              {t.accessLabel}
            </p>
            <p style={{ fontSize: "14px", color: "#191c1b", lineHeight: 1.6, margin: 0, fontWeight: 500 }}>
              {t.accessBody}
            </p>
          </div>

          <div style={{ gridColumn: 2, gridRow: 2 }}>
            <p style={{
              ...MONO, fontSize: "10px", color: "#0b4335", letterSpacing: "0.08em", fontWeight: 700,
              margin: "0 0 14px 0", textDecoration: "underline", textUnderlineOffset: "4px", textDecorationColor: "#C9A84C",
            }}>
              {t.teamLabel}
            </p>
            <p style={{ fontSize: "13px", color: "#707974", lineHeight: 1.7, margin: "0 0 6px 0" }}>
              {t.accessSub}
            </p>
            <p style={{ fontSize: "13px", color: "#404945", lineHeight: 1.75, margin: "0 0 18px 0" }}>
              {t.teamBody}
            </p>
            <TextLink isRTL={isRTL} to="/scholars">{t.exploreLink}</TextLink>
          </div>
        </div>
      </div>

     
    </div>
  );
};

export default AboutPage;