import React, { useState } from "react";
import { Link } from "react-router-dom";
import Hero from "../components/Hero";
import { useLang } from "../context/LanguageContext";

type Language = "EN" | "AR" | "FR";

/* ─────────────────────────────────────────────
   SHARED STYLE CONSTANTS (matches AboutPage / ContactPage / ScholarDetailPage)
───────────────────────────────────────────── */
const MONO: React.CSSProperties = { fontFamily: "'JetBrains Mono', monospace" };
const SERIF: React.CSSProperties = { fontFamily: "'Source Serif 4', serif" };
const BTN_PRIMARY: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: "6px", padding: "10px 20px",
  border: "1.5px solid #0b4335", borderRadius: "6px", backgroundColor: "transparent", color: "#0b4335",
  fontSize: "10px", fontWeight: 700, letterSpacing: "0.1em", cursor: "pointer",
  transition: "background 0.15s, color 0.15s", ...MONO,
};

function Icon({ name, size = 16, color }: { name: string; size?: number; color?: string }) {
  return (
    <span className="material-symbols-outlined" style={{ fontSize: `${size}px`, lineHeight: 1, userSelect: "none", color }}>
      {name}
    </span>
  );
}

function TextLink({ children, isRTL, to = "#" }: { children: React.ReactNode; isRTL: boolean; to?: string }) {
  const [hov, setHov] = useState(false);
  const color = "#0b4335";
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

function CtaButton({ children, to, isRTL }: { children: React.ReactNode; to: string; isRTL: boolean }) {
  const [hov, setHov] = useState(false);
  return (
    <Link
      to={to}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        ...BTN_PRIMARY,
        border: "1.5px solid rgba(255,255,255,0.7)",
        backgroundColor: hov ? "#fff" : "transparent",
        color: hov ? "#0b4335" : "#fff",
      }}
    >
      {children}
      <Icon name={isRTL ? "north_west" : "north_east"} size={14} />
    </Link>
  );
}

/* ─────────────────────────────────────────────
   TRANSLATIONS
───────────────────────────────────────────── */
interface EraItem { label: string; range: string; desc: string; }
interface ScholarItem { name: string; era: string; desc: string; }
interface StatItem { value: string; label: string; }
interface PillarItem { icon: string; label: string; desc: string; }

interface HomeContent {
  missionEyebrow: string; missionLeft: string; missionRight: string;
  pillarsLabel: string; pillars: PillarItem[];
  erasLabel: string; eras: EraItem[];
  scholarsLabel: string; scholarsSub: string; scholarsAll: string; scholars: ScholarItem[]; viewProfile: string;
  statsLabel: string; stats: StatItem[];
  collageLabel: string; collageStatValue: string; collageStatLabel: string;
  collageQuote: string; collageQuoteAuthor: string;
  ctaTitle: string; ctaBody: string; ctaButton: string;
}

const content: Record<Language, HomeContent> = {
  EN: {
    missionEyebrow: "OUR MISSION",
    missionLeft: "Oulamauna is a living archive of the scholars who shaped Islamic and Algerian thought — built so their work stays within reach, in the languages people actually read in.",
    missionRight: "Every scholar page brings together a verified biography, notable works, and available manuscripts, reviewed before publication.",
    pillarsLabel: "WHY OULAMAUNA",
    pillars: [
      { icon: "verified", label: "Verified Biographies", desc: "Every entry is reviewed against primary sources before publication." },
      { icon: "auto_stories", label: "Manuscript Archive", desc: "Original works and referenced manuscripts, catalogued by era." },
      { icon: "translate", label: "Trilingual Access", desc: "Read in Arabic, French, or English — no barrier to the knowledge." },
    ],
    erasLabel: "EXPLORE BY ERA",
    eras: [
      { label: "Classical Era", range: "7th–10th c.", desc: "The founding generation of jurists, hadith scholars, and early theologians." },
      { label: "Golden Age", range: "10th–13th c.", desc: "Philosophy, medicine, and the sciences flourish across the Islamic world." },
      { label: "Andalusian Era", range: "11th–15th c.", desc: "Scholarship in al-Andalus and the Maghreb, from Cordoba to Fes." },
      { label: "Ottoman Era", range: "16th–19th c.", desc: "Institutions, commentary literature, and reform movements take shape." },
      { label: "Modern Era", range: "19th c. – today", desc: "Reformist thinkers and the scholars of Algeria's own intellectual revival." },
    ],
    scholarsLabel: "FEATURED SCHOLARS",
    scholarsSub: "A starting point into the archive.",
    scholarsAll: "VIEW ALL SCHOLARS",
    scholars: [
      { name: "Ibn Khaldun", era: "Andalusian Era", desc: "Historian and sociologist, author of the Muqaddimah." },
      { name: "Al-Ghazali", era: "Golden Age", desc: "Theologian and philosopher whose work shaped Islamic thought for centuries." },
      { name: "Emir Abdelkader", era: "Modern Era", desc: "Scholar and resistance leader, among Algeria's most studied intellectual figures." },
      { name: "Abdelhamid Ibn Badis", era: "Modern Era", desc: "Reformist scholar and founder of the Algerian Muslim Scholars Association." },
    ],
    viewProfile: "View profile",
    statsLabel: "THE ARCHIVE IN NUMBERS",
    stats: [
      { value: "500+", label: "Scholars documented" },
      { value: "1,200+", label: "Manuscripts referenced" },
      { value: "3", label: "Languages" },
      { value: "10", label: "Centuries covered" },
    ],
    collageLabel: "FROM THE ARCHIVE",
    collageStatValue: "500+",
    collageStatLabel: "Scholars documented across 10 centuries of Islamic and Algerian thought.",
    collageQuote: "Seek knowledge from the cradle to the grave.",
    collageQuoteAuthor: "— attributed tradition",
    ctaTitle: "Start exploring the archive",
    ctaBody: "Search by name, era, or region, and follow the sources behind every entry.",
    ctaButton: "BROWSE ALL SCHOLARS",
  },
  AR: {
    missionEyebrow: "رسالتنا",
    missionLeft: "علماؤنا أرشيف حي للعلماء الذين شكّلوا الفكر الإسلامي والجزائري، أُنشئ ليبقى عملهم في متناول القارئ، باللغات التي يقرأ بها فعلاً.",
    missionRight: "تجمع كل صفحة عالم سيرة موثقة وأعماله البارزة ومخطوطاته المتاحة، وتُراجَع قبل النشر.",
    pillarsLabel: "لماذا علماؤنا",
    pillars: [
      { icon: "verified", label: "سِيَر موثقة", desc: "تُراجَع كل مادة مقابل المصادر الأولية قبل النشر." },
      { icon: "auto_stories", label: "أرشيف المخطوطات", desc: "الأعمال الأصلية والمخطوطات المرجعية، مصنفة حسب الحقبة." },
      { icon: "translate", label: "بثلاث لغات", desc: "اقرأ بالعربية أو الفرنسية أو الإنجليزية دون أي عائق." },
    ],
    erasLabel: "تصفح حسب الحقبة",
    eras: [
      { label: "العصر الكلاسيكي", range: "القرن 7-10م", desc: "الجيل التأسيسي من الفقهاء ومحدّثي الحديث وعلماء الكلام الأوائل." },
      { label: "العصر الذهبي", range: "القرن 10-13م", desc: "ازدهار الفلسفة والطب والعلوم عبر العالم الإسلامي." },
      { label: "العصر الأندلسي", range: "القرن 11-15م", desc: "العلم في الأندلس والمغرب، من قرطبة إلى فاس." },
      { label: "العصر العثماني", range: "القرن 16-19م", desc: "تشكّل المؤسسات وأدب الشروح وحركات الإصلاح." },
      { label: "العصر الحديث", range: "القرن 19م - اليوم", desc: "المفكرون الإصلاحيون وعلماء النهضة الفكرية الجزائرية." },
    ],
    scholarsLabel: "علماء مختارون",
    scholarsSub: "نقطة بداية في الأرشيف.",
    scholarsAll: "عرض جميع العلماء",
    scholars: [
      { name: "ابن خلدون", era: "العصر الأندلسي", desc: "مؤرخ وعالم اجتماع، صاحب المقدمة." },
      { name: "أبو حامد الغزالي", era: "العصر الذهبي", desc: "عالم وفيلسوف شكّل الفكر الإسلامي لقرون." },
      { name: "الأمير عبد القادر", era: "العصر الحديث", desc: "عالم وقائد مقاومة، من أكثر الشخصيات الفكرية الجزائرية دراسة." },
      { name: "عبد الحميد بن باديس", era: "العصر الحديث", desc: "عالم إصلاحي ومؤسس جمعية العلماء المسلمين الجزائريين." },
    ],
    viewProfile: "عرض الصفحة",
    statsLabel: "الأرشيف بالأرقام",
    stats: [
      { value: "+500", label: "عالِم موثّق" },
      { value: "+1,200", label: "مخطوطة مرجعية" },
      { value: "3", label: "لغات" },
      { value: "10", label: "قرون موثقة" },
    ],
    collageLabel: "من الأرشيف",
    collageStatValue: "+500",
    collageStatLabel: "عالِم موثّق عبر 10 قرون من الفكر الإسلامي والجزائري.",
    collageQuote: "اطلبوا العلم من المهد إلى اللحد.",
    collageQuoteAuthor: "— أثر منسوب",
    ctaTitle: "ابدأ استكشاف الأرشيف",
    ctaBody: "ابحث بالاسم أو الحقبة أو المنطقة، وتتبّع مصادر كل مدخل.",
    ctaButton: "تصفح جميع العلماء",
  },
  FR: {
    missionEyebrow: "NOTRE MISSION",
    missionLeft: "Oulamauna est une archive vivante des savants qui ont façonné la pensée islamique et algérienne — conçue pour que leur œuvre reste accessible, dans les langues que l'on lit réellement.",
    missionRight: "Chaque fiche réunit une biographie vérifiée, les œuvres notables et les manuscrits disponibles, relue avant publication.",
    pillarsLabel: "POURQUOI OULAMAUNA",
    pillars: [
      { icon: "verified", label: "Biographies vérifiées", desc: "Chaque fiche est relue face aux sources primaires avant publication." },
      { icon: "auto_stories", label: "Archive de manuscrits", desc: "Œuvres originales et manuscrits référencés, classés par époque." },
      { icon: "translate", label: "Accès trilingue", desc: "Lisez en arabe, en français ou en anglais, sans aucune barrière." },
    ],
    erasLabel: "PARCOURIR PAR ÉPOQUE",
    eras: [
      { label: "Époque classique", range: "VIIe–Xe s.", desc: "La génération fondatrice des juristes, traditionnistes et premiers théologiens." },
      { label: "Âge d'or", range: "Xe–XIIIe s.", desc: "La philosophie, la médecine et les sciences fleurissent dans le monde islamique." },
      { label: "Époque andalouse", range: "XIe–XVe s.", desc: "Le savoir en al-Andalus et au Maghreb, de Cordoue à Fès." },
      { label: "Époque ottomane", range: "XVIe–XIXe s.", desc: "Les institutions et les mouvements de réforme prennent forme." },
      { label: "Époque moderne", range: "XIXe s. – aujourd'hui", desc: "Les penseurs réformistes et les savants du renouveau algérien." },
    ],
    scholarsLabel: "SAVANTS À L'HONNEUR",
    scholarsSub: "Un point de départ dans l'archive.",
    scholarsAll: "VOIR TOUS LES SAVANTS",
    scholars: [
      { name: "Ibn Khaldoun", era: "Époque andalouse", desc: "Historien et sociologue, auteur de la Muqaddima." },
      { name: "Al-Ghazâlî", era: "Âge d'or", desc: "Théologien et philosophe dont l'œuvre a marqué la pensée islamique pendant des siècles." },
      { name: "L'émir Abdelkader", era: "Époque moderne", desc: "Savant et chef de résistance, l'une des figures les plus étudiées d'Algérie." },
      { name: "Abdelhamid Ibn Badis", era: "Époque moderne", desc: "Savant réformiste et fondateur de l'Association des oulémas musulmans algériens." },
    ],
    viewProfile: "Voir la fiche",
    statsLabel: "L'ARCHIVE EN CHIFFRES",
    stats: [
      { value: "500+", label: "Savants documentés" },
      { value: "1 200+", label: "Manuscrits référencés" },
      { value: "3", label: "Langues" },
      { value: "10", label: "Siècles couverts" },
    ],
    collageLabel: "DEPUIS L'ARCHIVE",
    collageStatValue: "500+",
    collageStatLabel: "Savants documentés sur 10 siècles de pensée islamique et algérienne.",
    collageQuote: "Cherche le savoir du berceau jusqu'à la tombe.",
    collageQuoteAuthor: "— tradition attribuée",
    ctaTitle: "Commencez à explorer l'archive",
    ctaBody: "Recherchez par nom, époque ou région, et suivez les sources de chaque fiche.",
    ctaButton: "PARCOURIR TOUS LES SAVANTS",
  },
};

/* ─────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────── */
const Home: React.FC = () => {
  const { lang } = useLang();
  const t = content[lang as Language] || content.EN;
  const isRTL = lang === "AR";

  return (
    <div className="relative w-full" style={{ backgroundColor: "#faf9f6" }}>
      <Hero />

      {/* Content sheet — overlaps the hero video for a deliberate, non-abrupt transition */}
      <main
        dir={isRTL ? "rtl" : "ltr"}
        className="relative z-30 -mt-16 md:-mt-20"
        style={{
          backgroundColor: "#faf9f6",
          backgroundImage: "radial-gradient(circle at 50% 0%, rgba(201,168,76,0.06) 0%, transparent 60%)",
          borderTopLeftRadius: "28px",
          borderTopRightRadius: "28px",
          boxShadow: "0 -24px 60px rgba(11,67,53,0.14)",
          fontFamily: "'Source Sans 3', sans-serif",
          color: "#191c1b",
          overflow: "hidden",
        }}
      >
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Source+Serif+4:ital,opsz,wght@0,8..60,200..900;1,8..60,200..900&family=Source+Sans+3:ital,wght@0,200..900;1,200..900&family=JetBrains+Mono:ital,wght@0,100..800;1,100..800&display=swap');
          @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap');
          .material-symbols-outlined { font-variation-settings: 'FILL' 0,'wght' 400,'GRAD' 0,'opsz' 24; font-family: 'Material Symbols Outlined'; display: inline-block; vertical-align: middle; }
          * { box-sizing: border-box; }

          .home-grid { display: grid; grid-template-columns: 1.6fr 1fr; gap: 48px; }
          .home-pillars { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0; }
          .home-pillars > div { border-left: 1px solid rgba(192,201,195,0.4); padding: 0 28px; }
          .home-pillars > div:first-child { border-left: none; padding-left: 0; }
          [dir='rtl'] .home-pillars > div { border-left: none; border-right: 1px solid rgba(192,201,195,0.4); padding: 0 28px; }
          [dir='rtl'] .home-pillars > div:first-child { border-right: none; padding-right: 0; }
          .home-eras { display: grid; grid-template-columns: repeat(5, 1fr); gap: 0; }
          .home-eras > div { border-left: 1px solid rgba(192,201,195,0.4); padding: 0 22px; }
          .home-eras > div:first-child { border-left: none; padding-left: 0; }
          [dir='rtl'] .home-eras > div { border-left: none; border-right: 1px solid rgba(192,201,195,0.4); padding: 0 22px; }
          [dir='rtl'] .home-eras > div:first-child { border-right: none; padding-right: 0; }
          .home-scholars { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; }
          .home-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 32px; }
          .home-collage { display: grid; grid-template-columns: 1fr 1.4fr; gap: 40px; align-items: center; }

          @media (max-width: 900px) {
            .home-grid { grid-template-columns: 1fr !important; gap: 24px !important; }
            .home-pillars { grid-template-columns: 1fr !important; gap: 24px !important; }
            .home-pillars > div, [dir='rtl'] .home-pillars > div { border: none !important; padding: 0 !important; }
            .home-eras { grid-template-columns: 1fr !important; gap: 20px !important; }
            .home-eras > div, [dir='rtl'] .home-eras > div { border-left: none !important; border-right: none !important; border-top: 1px solid rgba(192,201,195,0.4) !important; padding: 18px 0 0 !important; }
            .home-scholars { grid-template-columns: repeat(2, 1fr) !important; }
            .home-stats { grid-template-columns: repeat(2, 1fr) !important; }
            .home-collage { grid-template-columns: 1fr !important; }
          }
          @media (max-width: 560px) {
            .home-scholars { grid-template-columns: 1fr !important; }
          }
        `}</style>

        <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "56px 40px 0" }}>

          {/* Mission split intro */}
          <div style={{ marginBottom: "72px" }}>
            <p style={{ ...MONO, fontSize: "9px", color: "#707974", letterSpacing: "0.1em", margin: "0 0 18px 0" }}>
              {t.missionEyebrow}
            </p>
            <div className="home-grid">
              <p style={{ ...SERIF, fontSize: "20px", color: "#191c1b", lineHeight: 1.55, fontWeight: 500, margin: 0 }}>
                {t.missionLeft}
              </p>
              <p style={{ fontSize: "13px", color: "#707974", lineHeight: 1.75, margin: 0 }}>
                {t.missionRight}
              </p>
            </div>
          </div>

          {/* Why Oulamauna — pillars */}
          <div style={{ marginBottom: "72px" }}>
            <p style={{
              ...MONO, fontSize: "10px", color: "#0b4335", letterSpacing: "0.08em", fontWeight: 700,
              margin: "0 0 28px 0", textDecoration: "underline", textUnderlineOffset: "4px", textDecorationColor: "#C9A84C",
              display: "inline-block",
            }}>
              {t.pillarsLabel}
            </p>
            <div className="home-pillars">
              {t.pillars.map((p, i) => (
                <div key={i}>
                  <Icon name={p.icon} size={26} color="#C9A84C" />
                  <p style={{ ...SERIF, fontSize: "18px", fontWeight: 600, color: "#191c1b", margin: "16px 0 8px 0" }}>{p.label}</p>
                  <p style={{ fontSize: "13px", color: "#707974", lineHeight: 1.65, margin: 0 }}>{p.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Era timeline */}
          <div style={{ marginBottom: "72px" }}>
            <p style={{
              ...MONO, fontSize: "10px", color: "#0b4335", letterSpacing: "0.08em", fontWeight: 700,
              margin: "0 0 24px 0", textDecoration: "underline", textUnderlineOffset: "4px", textDecorationColor: "#C9A84C",
              display: "inline-block",
            }}>
              {t.erasLabel}
            </p>
            <div className="home-eras">
              {t.eras.map((era, i) => (
                <div key={i}>
                  <p style={{ ...MONO, fontSize: "10px", color: "#191c1b", fontWeight: 700, letterSpacing: "0.04em", margin: "0 0 4px 0" }}>
                    {era.label}
                  </p>
                  <p style={{ ...MONO, fontSize: "10px", color: "#707974", margin: "0 0 10px 0" }}>
                    {era.range}
                  </p>
                  <p style={{ fontSize: "12.5px", color: "#404945", lineHeight: 1.6, margin: 0 }}>
                    {era.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Featured scholars */}
          <div style={{ marginBottom: "72px" }}>
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: "12px", marginBottom: "28px" }}>
              <div>
                <p style={{
                  ...MONO, fontSize: "10px", color: "#0b4335", letterSpacing: "0.08em", fontWeight: 700,
                  margin: "0 0 8px 0", textDecoration: "underline", textUnderlineOffset: "4px", textDecorationColor: "#C9A84C",
                  display: "inline-block",
                }}>
                  {t.scholarsLabel}
                </p>
                <p style={{ fontSize: "13px", color: "#707974", margin: 0 }}>{t.scholarsSub}</p>
              </div>
              <TextLink isRTL={isRTL} to="/scholars">{t.scholarsAll}</TextLink>
            </div>

            <div className="home-scholars">
              {t.scholars.map((s, i) => (
                <div key={i} style={{
                  border: "1px solid rgba(192,201,195,0.4)", borderRadius: "12px", padding: "24px",
                  backgroundColor: "rgba(255,255,255,0.5)", display: "flex", flexDirection: "column", gap: "12px",
                }}>
                  <div style={{
                    width: "48px", height: "48px", borderRadius: "50%", backgroundColor: "#0b4335",
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                  }}>
                    <span style={{ ...SERIF, fontSize: "17px", color: "#fff", fontWeight: 600 }}>
                      {s.name.charAt(0)}
                    </span>
                  </div>
                  <div style={{ flexGrow: 1 }}>
                    <p style={{ ...SERIF, fontSize: "16px", fontWeight: 600, color: "#191c1b", margin: "0 0 4px 0" }}>{s.name}</p>
                    <p style={{ ...MONO, fontSize: "9px", color: "#707974", letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 10px 0" }}>{s.era}</p>
                    <p style={{ fontSize: "12.5px", color: "#404945", lineHeight: 1.6, margin: 0 }}>{s.desc}</p>
                  </div>
                  <TextLink isRTL={isRTL} to="/scholars">{t.viewProfile}</TextLink>
                </div>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div style={{ marginBottom: "72px" }}>
            <p style={{ ...MONO, fontSize: "9px", color: "#707974", letterSpacing: "0.1em", margin: "0 0 24px 0" }}>
              {t.statsLabel}
            </p>
            <div className="home-stats">
              {t.stats.map((st, i) => (
                <div key={i}>
                  <p style={{ ...SERIF, fontSize: "34px", fontWeight: 700, color: "#0b4335", margin: "0 0 6px 0" }}>{st.value}</p>
                  <p style={{ ...MONO, fontSize: "9px", color: "#707974", letterSpacing: "0.06em", textTransform: "uppercase", margin: 0 }}>{st.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Photo + stat + quote band */}
          <div style={{
            position: "relative", overflow: "hidden", borderRadius: "16px",
            padding: "48px 40px", marginBottom: "64px",
            backgroundColor: "#0b4335",
            border: "1px solid rgba(201,168,76,0.25)",
          }}>
            <div className="home-collage">
              <div>
                <p style={{ ...MONO, fontSize: "9px", color: "#C9A84C", letterSpacing: "0.1em", margin: "0 0 12px 0" }}>
                  {t.collageLabel}
                </p>
                <p style={{ ...SERIF, fontSize: "56px", fontWeight: 700, color: "#fff", margin: "0 0 12px 0" }}>
                  {t.collageStatValue}
                </p>
                <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.75)", lineHeight: 1.6, margin: 0 }}>
                  {t.collageStatLabel}
                </p>
              </div>
              <div
                style={{
                  position: "relative", borderRadius: "12px", overflow: "hidden", minHeight: "260px",
                  backgroundImage: "url('/assets/oulamauna-manuscript-collage.jpg')", backgroundSize: "cover",
                  backgroundPosition: "center", backgroundColor: "#173f33",
                }}
              >
                {/* TODO: swap the path above for a real manuscript / calligraphy photograph */}
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(0deg, rgba(11,67,53,0.65) 0%, transparent 50%)" }} />
                <div style={{ position: "absolute", left: "20px", bottom: "20px", right: "20px" }}>
                  <p style={{ ...SERIF, fontSize: "18px", fontStyle: "italic", color: "#fff", lineHeight: 1.5, margin: "0 0 6px 0" }}>
                    {t.collageQuote}
                  </p>
                  <p style={{ ...MONO, fontSize: "10px", color: "rgba(255,255,255,0.7)", margin: 0 }}>{t.collageQuoteAuthor}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Closing CTA band — bookends the dark hero */}
          <div style={{
            position: "relative", overflow: "hidden", borderRadius: "16px",
            padding: "48px 40px", marginBottom: "64px",
            backgroundColor: "#0b4335",
            border: "1px solid rgba(201,168,76,0.25)",
          }}>
            <p style={{ ...SERIF, fontSize: "26px", fontWeight: 700, color: "#fff", margin: "0 0 12px 0" }}>
              {t.ctaTitle}
            </p>
            <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.75)", lineHeight: 1.7, margin: "0 0 24px 0", maxWidth: "480px" }}>
              {t.ctaBody}
            </p>
            <CtaButton to="/scholars" isRTL={isRTL}>{t.ctaButton}</CtaButton>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Home;