// AboutPage.tsx
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useLang } from "../context/LanguageContext";
import heroImage from "../assets/library-2.jpg";
import archiveImage from "../assets/library-2.jpg";

type Language = "EN" | "AR" | "FR";

const MONO: React.CSSProperties = { fontFamily: "'JetBrains Mono', monospace" };
const GROTESK: React.CSSProperties = { fontFamily: "'Hanken Grotesk', sans-serif" };
const INTER: React.CSSProperties = { fontFamily: "'Inter', sans-serif" };

function Icon({ name, size = 16 }: { name: string; size?: number }) {
  return (
    <span className="material-symbols-outlined" style={{ fontSize: `${size}px`, lineHeight: 1 }}>
      {name}
    </span>
  );
}

function TextLink({ children, isRTL, to = "#" }: { children: React.ReactNode; isRTL: boolean; to?: string }) {
  const [hov, setHov] = useState(false);
  return (
    <Link
      to={to}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        ...MONO, 
        fontSize: "11px", 
        fontWeight: 700, 
        letterSpacing: "0.05em", 
        color: "#1e4d3a",
        display: "inline-flex", 
        alignItems: "center", 
        gap: "6px", 
        textDecoration: "none",
        borderBottom: hov ? "2px solid #C9A84C" : "2px solid transparent", 
        paddingBottom: "2px",
        transition: "border-color 0.3s", 
        marginTop: "8px",
      }}
    >
      {children}
      <Icon name={isRTL ? "arrow_back" : "arrow_forward"} size={16} />
    </Link>
  );
}

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
    ctaLabel: "GET IN TOUCH",
    ctaTitle: "Have a correction, a scholar to suggest, or a question about the archive? We'd love to hear from you.",
    ctaButton: "CONTACT US",
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
    ctaLabel: "تواصل معنا",
    ctaTitle: "هل لديك تصحيح، أو اقتراح لإضافة عالم، أو سؤال حول الأرشيف؟ يسعدنا أن نسمع منك.",
    ctaButton: "راسلنا",
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
    ctaLabel: "RESTONS EN CONTACT",
    ctaTitle: "Une correction à signaler, un savant à suggérer, ou une question sur l'archive ? Nous serions ravis de vous lire.",
    ctaButton: "NOUS CONTACTER",
  },
};

const AboutPage: React.FC = () => {
  const { lang } = useLang();
  const t = content[lang as Language];
  const isRTL = lang === "AR";

  return (
    <div
      dir={isRTL ? "rtl" : "ltr"}
      style={{
        fontFamily: "'Inter', sans-serif", 
        minHeight: "100vh", 
        backgroundColor: "#fbf9f4",
        backgroundImage: "radial-gradient(circle at 50% 0%, rgba(201,168,76,0.08) 0%, transparent 60%)",
        color: "#1e4d3a",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&family=Source+Serif+4:wght@400;600;700&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap');
        .material-symbols-outlined { font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24; font-family: 'Material Symbols Outlined'; display: inline-block; vertical-align: middle; }
        * { box-sizing: border-box; }
        @media (max-width: 900px) {
          .about-grid { grid-template-columns: 1fr !important; }
          .about-grid > * { grid-column: 1 !important; }
          .about-image { grid-row: auto !important; margin-top: 20px; }
        }
      `}</style>

      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "64px 40px 0" }}>

        {/* Hero banner */}
        <div style={{
          position: "relative", overflow: "hidden", borderRadius: "16px",
          padding: "64px 48px", marginBottom: "56px",
          border: "1px solid rgba(201,168,76,0.25)",
          backgroundImage: `url(${heroImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}>
          <div style={{
            position: "absolute", inset: 0,
            background: "linear-gradient(120deg, rgba(30,77,58,0.92) 0%, rgba(30,77,58,0.85) 45%, rgba(30,77,58,0.6) 100%)",
          }} />
          <div style={{ position: "relative", zIndex: 1 }}>
            <p style={{ ...MONO, fontSize: "11px", color: "#C9A84C", letterSpacing: "0.2em", marginBottom: "16px", fontWeight: 700 }}>
              {t.breadcrumb}
            </p>
            <h1 style={{ ...GROTESK, fontSize: "40px", fontWeight: 700, color: "#fbf9f4", margin: "0 0 20px 0", lineHeight: 1.2 }}>
              {t.title}
            </h1>
            <p style={{ ...INTER, fontSize: "18px", color: "rgba(251,249,244,0.85)", lineHeight: 1.7, maxWidth: "640px", margin: 0 }}>
              {t.heroDescription}
            </p>
          </div>
        </div>

        {/* Intro split text */}
        <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: "48px", marginBottom: "72px" }}>
          <p style={{ ...INTER, fontSize: "18px", color: "#1e4d3a", lineHeight: 1.7, margin: 0 }}>
            {t.introLeft}
          </p>
          <p style={{ ...INTER, fontSize: "15px", color: "rgba(30,77,58,0.7)", lineHeight: 1.75, margin: 0 }}>
            {t.introRight}
          </p>
        </div>

        {/* What we do / Our Archive / image — Openness / Our Contributors */}
        <div
          className="about-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "220px 1fr 320px",
            columnGap: "48px",
            rowGap: "56px",
            marginBottom: "72px",
          }}
        >
          <div style={{ gridColumn: 1, gridRow: 1 }}>
            <p style={{ ...MONO, fontSize: "11px", color: "#C9A84C", letterSpacing: "0.15em", margin: "0 0 12px 0", fontWeight: 700 }}>
              {t.whatLabel}
            </p>
            <p style={{ ...INTER, fontSize: "15px", color: "#1e4d3a", lineHeight: 1.6, margin: 0, fontWeight: 600 }}>
              {t.whatBody}
            </p>
          </div>

          <div style={{ gridColumn: 2, gridRow: 1 }}>
            <p style={{
              ...MONO, fontSize: "11px", color: "#1e4d3a", letterSpacing: "0.15em", fontWeight: 700,
              margin: "0 0 16px 0", textTransform: "uppercase",
            }}>
              {t.archiveLabel}
            </p>
            <p style={{ ...INTER, fontSize: "15px", color: "rgba(30,77,58,0.8)", lineHeight: 1.75, margin: "0 0 16px 0" }}>
              {t.archiveP1}
            </p>
            <p style={{ ...INTER, fontSize: "15px", color: "rgba(30,77,58,0.8)", lineHeight: 1.75, margin: 0 }}>
              {t.archiveP2}
            </p>
          </div>

          <div className="about-image" style={{
            gridColumn: 3, gridRow: "1 / span 2", borderRadius: "16px", overflow: "hidden",
            border: "1px solid rgba(30,77,58,0.1)", minHeight: "280px", backgroundColor: "#F5F3EC",
          }}>
            <img src={archiveImage} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
          </div>

          <div style={{ gridColumn: 1, gridRow: 2 }}>
            <p style={{ ...MONO, fontSize: "11px", color: "#C9A84C", letterSpacing: "0.15em", margin: "0 0 12px 0", fontWeight: 700 }}>
              {t.accessLabel}
            </p>
            <p style={{ ...INTER, fontSize: "15px", color: "#1e4d3a", lineHeight: 1.6, margin: 0, fontWeight: 600 }}>
              {t.accessBody}
            </p>
          </div>

          <div style={{ gridColumn: 2, gridRow: 2 }}>
            <p style={{
              ...MONO, fontSize: "11px", color: "#1e4d3a", letterSpacing: "0.15em", fontWeight: 700,
              margin: "0 0 16px 0", textTransform: "uppercase",
            }}>
              {t.teamLabel}
            </p>
            <p style={{ ...INTER, fontSize: "15px", color: "rgba(30,77,58,0.7)", lineHeight: 1.7, margin: "0 0 8px 0" }}>
              {t.accessSub}
            </p>
            <p style={{ ...INTER, fontSize: "15px", color: "rgba(30,77,58,0.8)", lineHeight: 1.75, margin: "0 0 20px 0" }}>
              {t.teamBody}
            </p>
            <TextLink isRTL={isRTL} to="/scholars">{t.exploreLink}</TextLink>
          </div>
        </div>
      </div>

      {/* Closing CTA */}
      <div style={{ backgroundColor: "#F2F1ED", padding: "80px 40px 120px", borderTop: "1px solid rgba(30,77,58,0.1)" }}>
        <div style={{ maxWidth: "520px", margin: "0 auto", textAlign: "center" }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: "8px",
            marginBottom: "24px", color: "#C9A84C",
          }}>
            <Icon name="alternate_email" size={16} />
            <span style={{ ...MONO, fontSize: "11px", letterSpacing: "0.15em", fontWeight: 700 }}>
              {t.ctaLabel}
            </span>
          </div>
          <p style={{ ...GROTESK, fontSize: "30px", fontWeight: 700, color: "#1e4d3a", lineHeight: 1.4, margin: "0 0 28px 0" }}>
            {t.ctaTitle}
          </p>
          <Link
            to="/contact"
            style={{
              display: "inline-flex", alignItems: "center", gap: "8px",
              backgroundColor: "#1e4d3a", color: "#fbf9f4", border: "2px solid #1e4d3a",
              borderRadius: "8px", padding: "14px 28px", cursor: "pointer",
              fontSize: "11px", fontWeight: 700, letterSpacing: "0.05em",
              textDecoration: "none", transition: "all 0.3s", ...GROTESK,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#fbf9f4";
              e.currentTarget.style.color = "#1e4d3a";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#1e4d3a";
              e.currentTarget.style.color = "#fbf9f4";
            }}
          >
            {t.ctaButton}
            <Icon name={isRTL ? "arrow_back" : "arrow_forward"} size={16} />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;