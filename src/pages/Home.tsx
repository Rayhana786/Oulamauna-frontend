// Home.tsx
import React, { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import Hero from "../components/Hero";
import { useLang } from "../context/LanguageContext";

type Language = "EN" | "AR" | "FR";

/* ------------------------------------------------------------------ */
/*  MOCK DATA — STRICTLY MATCHING PRISMA SCHEMA                       */
/* ------------------------------------------------------------------ */
const featuredScholars = [
  {
    version_id: 1,
    canonical_name: "Ibn Khaldun",
    century_gregorian_start: 1332,
    century_gregorian_end: 1406,
    region_name: "North Africa",
    discipline_name: "History & Sociology",
    image_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop",
    biography: "Pioneer of historiography and sociology, best known for his masterpiece, the Muqaddimah.",
  },
  {
    version_id: 2,
    canonical_name: "Al-Ghazali",
    century_gregorian_start: 1058,
    century_gregorian_end: 1111,
    region_name: "Persia",
    discipline_name: "Theology & Philosophy",
    image_url: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop",
    biography: "Theologian, jurist, and philosopher whose work shaped Islamic thought for centuries.",
  },
  {
    version_id: 3,
    canonical_name: "Ibn Sina (Avicenna)",
    century_gregorian_start: 980,
    century_gregorian_end: 1037,
    region_name: "Central Asia",
    discipline_name: "Medicine & Philosophy",
    image_url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop",
    biography: "Polymath and physician, author of The Canon of Medicine, a standard medical text for centuries.",
  },
  {
    version_id: 4,
    canonical_name: "Emir Abdelkader",
    century_gregorian_start: 1808,
    century_gregorian_end: 1883,
    region_name: "Algeria",
    discipline_name: "Islamic Jurisprudence",
    image_url: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop",
    biography: "Scholar, resistance leader, and founder of modern Algeria, known for his chivalry and writings.",
  },
];

const recentScholars = [
  { version_id: 101, canonical_name: "Abdelhamid Ibn Badis", century_gregorian_start: 1889, image_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&h=300&fit=crop", created_at: "2024-01-15T10:00:00Z" },
  { version_id: 102, canonical_name: "Malik Ibn Nabi", century_gregorian_start: 1905, image_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop", created_at: "2024-01-12T14:30:00Z" },
  { version_id: 103, canonical_name: "Ibn Rushd (Averroes)", century_gregorian_start: 1126, image_url: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&h=300&fit=crop", created_at: "2024-01-10T09:15:00Z" },
  { version_id: 104, canonical_name: "Fatima al-Fihri", century_gregorian_start: 800, image_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&h=300&fit=crop", created_at: "2024-01-08T16:45:00Z" },
];

const disciplines = [
  { discipline_id: 1, name: "Theology", count: 245, icon: "auto_stories" },
  { discipline_id: 2, name: "Jurisprudence", count: 189, icon: "gavel" },
  { discipline_id: 3, name: "Philosophy", count: 156, icon: "psychology" },
  { discipline_id: 4, name: "History", count: 134, icon: "history" },
  { discipline_id: 5, name: "Medicine", count: 98, icon: "medical_services" },
  { discipline_id: 6, name: "Literature", count: 87, icon: "menu_book" },
];

const eras = [
  { name: "Classical Era", period: "7th-10th Century", scholars_count: 156, image_url: "https://images.unsplash.com/photo-1566127444979-b3d2b654e3d7?w=600&h=200&fit=crop" },
  { name: "Golden Age", period: "10th-13th Century", scholars_count: 234, image_url: "https://images.unsplash.com/photo-154203710828b-496739ed6887?w=600&h=200&fit=crop" },
  { name: "Andalusian Era", period: "11th-15th Century", scholars_count: 189, image_url: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&h=200&fit=crop" },
  { name: "Ottoman Era", period: "16th-19th Century", scholars_count: 145, image_url: "https://images.unsplash.com/photo-1564507592333-c60657eea523?w=600&h=200&fit=crop" },
  { name: "Modern Era", period: "19th Century - Present", scholars_count: 176, image_url: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&h=200&fit=crop" },
];

const featuredWorks = [
  { work_id: 1, title: "The Muqaddimah", year: 1377, format: "BOOK", media_url: "https://images.unsplash.com/photo-1535905557558-afc487cdc42d?w=400&h=300&fit=crop", description: "A pioneering work of historiography and sociology." },
  { work_id: 2, title: "The Canon of Medicine", year: 1025, format: "MANUSCRIPT", media_url: "https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=400&h=300&fit=crop", description: "An encyclopedia of medicine in five books." },
  { work_id: 3, title: "Tahafut al-Falasifa", year: 1095, format: "TREATISE", media_url: "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=400&h=300&fit=crop", description: "The Incoherence of the Philosophers, a landmark in Islamic philosophy." },
];

/* ------------------------------------------------------------------ */
/*  TRANSLATIONS                                                      */
/* ------------------------------------------------------------------ */
interface HomeContent {
  tagline: string;
  title: string;
  subtitle: string;
  searchPlaceholder: string;
  exploreButton: string;
  featuredLabel: string;
  viewAll: string;
  disciplinesLabel: string;
  erasLabel: string;
  statsLabel: string;
  ctaTitle: string;
  ctaText: string;
  ctaButton: string;
  recentLabel: string;
  worksLabel: string;
}

const content: Record<Language, HomeContent> = {
  EN: {
    tagline: "WELCOME TO OULAMAUNA",
    title: "Discover the Scholars Who Shaped Islamic Thought",
    subtitle: "Explore centuries of knowledge, from the Classical era to modern times. Verified biographies, original works, and manuscript archives — all in one place.",
    searchPlaceholder: "Search by name, discipline, or era...",
    exploreButton: "Start Exploring",
    featuredLabel: "Featured Scholars",
    viewAll: "View All Scholars",
    disciplinesLabel: "Browse by Discipline",
    erasLabel: "Explore by Era",
    statsLabel: "The Archive",
    ctaTitle: "Ready to dive deeper?",
    ctaText: "Join our community of researchers and contributors",
    ctaButton: "Become a Contributor",
    recentLabel: "Recently Added",
    worksLabel: "Featured Works & Manuscripts",
  },
  AR: {
    tagline: "مرحباً بكم في علماؤنا",
    title: "اكتشف العلماء الذين شكّلوا الفكر الإسلامي",
    subtitle: "استكشف قروناً من المعرفة، من العصر الكلاسيكي إلى العصر الحديث. سير موثقة وأعمال أصلية وأرشيف مخطوطات — كل ذلك في مكان واحد.",
    searchPlaceholder: "ابحث بالاسم أو التخصص أو الحقبة...",
    exploreButton: "ابدأ الاستكشاف",
    featuredLabel: "علماء مميزون",
    viewAll: "عرض جميع العلماء",
    disciplinesLabel: "تصفح حسب التخصص",
    erasLabel: "استكشف حسب الحقبة",
    statsLabel: "الأرشيف",
    ctaTitle: "مستعد للغوص أعمق؟",
    ctaText: "انضم إلى مجتمعنا من الباحثين والمساهمين",
    ctaButton: "كن مساهماً",
    recentLabel: "أضيف مؤخراً",
    worksLabel: "أعمال ومخطوطات مميزة",
  },
  FR: {
    tagline: "BIENVENUE SUR OULAMAUNA",
    title: "Découvrez les Savants qui ont Façonné la Pensée Islamique",
    subtitle: "Explorez des siècles de savoir, de l'époque classique aux temps modernes. Biographies vérifiées, œuvres originales et archives de manuscrits — tout en un seul endroit.",
    searchPlaceholder: "Rechercher par nom, discipline ou époque...",
    exploreButton: "Commencer l'exploration",
    featuredLabel: "Savants en Vedette",
    viewAll: "Voir Tous les Savants",
    disciplinesLabel: "Parcourir par Discipline",
    erasLabel: "Explorer par Époque",
    statsLabel: "L'Archive",
    ctaTitle: "Prêt à plonger plus profondément?",
    ctaText: "Rejoignez notre communauté de chercheurs et contributeurs",
    ctaButton: "Devenir Contributeur",
    recentLabel: "Récemment Ajouté",
    worksLabel: "Œuvres et Manuscrits en Vedette",
  },
};

/* ------------------------------------------------------------------ */
/*  "WHY OULAMAUNA" — left-column copy for the text+image+stats block */
/* ------------------------------------------------------------------ */
interface WhyContent {
  tagline: string;
  titleLine1: string;
  titleLine2: string;
  description: string;
  bullets: string[];
  ctaButton: string;
}

const whyContent: Record<Language, WhyContent> = {
  EN: {
    tagline: "WHY OULAMAUNA",
    titleLine1: "Preserving Knowledge",
    titleLine2: "With Purpose",
    description: "We believe every scholar's legacy deserves more than a footnote. Our archive pairs rigorous verification with accessible, multilingual storytelling.",
    bullets: [
      "Verified biographies and sources",
      "Multilingual access in Arabic, French & English",
      "Careful manuscript digitization",
      "Open to researchers and contributors",
    ],
    ctaButton: "About The Archive",
  },
  AR: {
    tagline: "لماذا علماؤنا",
    titleLine1: "نحافظ على المعرفة",
    titleLine2: "بهدف واضح",
    description: "نؤمن أن إرث كل عالم يستحق أكثر من مجرد حاشية عابرة. يجمع أرشيفنا بين التحقق الدقيق والسرد المتاح بعدة لغات.",
    bullets: [
      "سير ذاتية ومصادر موثّقة",
      "وصول متعدد اللغات: عربي، فرنسي، إنجليزي",
      "رقمنة دقيقة للمخطوطات",
      "مفتوح للباحثين والمساهمين",
    ],
    ctaButton: "عن الأرشيف",
  },
  FR: {
    tagline: "POURQUOI OULAMAUNA",
    titleLine1: "Préserver le Savoir",
    titleLine2: "Avec un But Précis",
    description: "Nous croyons que l'héritage de chaque savant mérite plus qu'une note de bas de page. Notre archive allie vérification rigoureuse et narration accessible et multilingue.",
    bullets: [
      "Biographies et sources vérifiées",
      "Accès multilingue en arabe, français et anglais",
      "Numérisation soignée des manuscrits",
      "Ouvert aux chercheurs et contributeurs",
    ],
    ctaButton: "À propos de l'Archive",
  },
};

/* ------------------------------------------------------------------ */
/*  STATS DATA (icon-driven, matches reference layout)                */
/* ------------------------------------------------------------------ */
const archiveStats = [
  { icon: "groups", value: "500+", labelEN: "Scholars", labelFR: "Savants", labelAR: "عالم" },
  { icon: "menu_book", value: "1,200+", labelEN: "Manuscripts", labelFR: "Manuscrits", labelAR: "مخطوطة" },
  { icon: "category", value: "6", labelEN: "Disciplines", labelFR: "Disciplines", labelAR: "تخصصات" },
  { icon: "history_edu", value: "10+", labelEN: "Centuries", labelFR: "Siècles", labelAR: "قرون" },
];

/* ------------------------------------------------------------------ */
/*  LIGHTWEIGHT SCROLL ANIMATION COMPONENT                            */
/* ------------------------------------------------------------------ */
const FadeIn: React.FC<{ children: React.ReactNode; delay?: number; className?: string }> = ({ 
  children, 
  delay = 0, 
  className = "" 
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const currentRef = ref.current;
    if (!currentRef) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(currentRef); // Stop observing once visible for max performance
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -50px 0px" }
    );

    observer.observe(currentRef);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      } ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  MAIN COMPONENT                                                    */
/* ------------------------------------------------------------------ */
const Home: React.FC = () => {
  const { lang } = useLang();
  const location = useLocation();
  const t = content[lang as Language] || content.EN;
  const w = whyContent[lang as Language] || whyContent.EN;
  const isRTL = lang === "AR";

  useEffect(() => {
    if (location.hash) {
      const element = document.getElementById(location.hash.substring(1));
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: "smooth" });
        }, 100);
      }
    }
  }, [location]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays === 1) return isRTL ? "أمس" : "Yesterday";
    if (diffDays < 7) return isRTL ? `منذ ${diffDays} أيام` : `${diffDays} days ago`;
    if (diffDays < 30) return isRTL ? `منذ ${Math.floor(diffDays / 7)} أسابيع` : `${Math.floor(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString(isRTL ? "ar-DZ" : lang === "FR" ? "fr-FR" : "en-US");
  };

  const statLabel = (stat: (typeof archiveStats)[number]) =>
    isRTL ? stat.labelAR : lang === "FR" ? stat.labelFR : stat.labelEN;

  return (
    <div className="antialiased min-h-screen selection:bg-[#C9A84C] selection:text-[#1e4d3a] flex flex-col bg-[#fbf9f4]">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&family=Source+Serif+4:wght@400;600;700&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap');
        .material-symbols-outlined { font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24; font-family: 'Material Symbols Outlined'; display: inline-block; vertical-align: middle; }
      `}</style>

      <Hero />

      <main className="flex-grow pt-16 md:pt-0" dir={isRTL ? "rtl" : "ltr"}>

               {/* 1. Feature Pillars */}
        <FadeIn>
          <section className="px-[20px] md:px-[64px] max-w-[1040px] mx-auto py-14 md:py-16">
            <div className="flex flex-col md:flex-row justify-between gap-10 md:gap-6 text-center">
              {[
                { icon: "library_books", title: "BESPOKE RESEARCH", desc: "Tailored archives that bring history to life." },
                { icon: "auto_stories", title: "TIMELESS WISDOM", desc: "Elegant narratives that stand the test of time." },
                { icon: "verified", title: "QUALITY PRESERVATION", desc: "Premium digitization by trusted artisans." },
                { icon: "explore", title: "PERSONAL JOURNEY", desc: "Collaborative exploration designed around you." },
              ].map((card, i) => (
                <FadeIn key={i} delay={100 + i * 100} className="flex-1 flex flex-col items-center gap-3 group cursor-pointer">
                  <div className="mb-0.5 transition-transform duration-300 group-hover:-translate-y-1">
                    <span className="material-symbols-outlined text-[22px] text-[#1e4d3a]" style={{ fontVariationSettings: "'FILL' 0, 'wght' 100" }}>
                      {card.icon}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-['Inter'] text-[11px] leading-[16px] text-[#1e4d3a] uppercase tracking-[0.12em] mb-1.5 font-semibold">
                      {card.title}
                    </h4>
                    <p className="font-['Inter'] text-[13px] leading-[20px] text-[#1e4d3a]/60">
                      {card.desc}
                    </p>
                  </div>
                </FadeIn>
              ))}
            </div>
          </section>
        </FadeIn>

        {/* 2. Welcome & Search Section */}
        <FadeIn>
          <section className="py-12 px-[20px] md:px-[64px] bg-[#fbf9f4] max-w-[1280px] mx-auto text-center flex flex-col items-center">
            <h2 className="font-['JetBrains_Mono'] text-[11px] leading-[16px] text-[#C9A84C] uppercase tracking-[0.2em] font-bold mb-4">
              {t.tagline}
            </h2>
            <h3 className="font-['Hanken_Grotesk'] text-4xl md:text-5xl leading-tight text-[#1e4d3a] font-bold mb-6 max-w-4xl">
              {t.title}
            </h3>
            <p className="font-['Inter'] text-[18px] leading-[1.7] text-[#1e4d3a]/80 mb-10 max-w-3xl">
              {t.subtitle}
            </p>

            <div className="w-full max-w-2xl relative mb-10">
              <input
                className="w-full px-6 py-4 rounded-xl border-2 border-[#1e4d3a] bg-[#fbf9f4] focus:border-[#C9A84C] focus:ring-1 focus:ring-[#C9A84C] transition-all font-['Inter'] text-[15px] shadow-sm outline-none text-[#1e4d3a]"
                placeholder={t.searchPlaceholder}
                type="text"
                dir={isRTL ? "rtl" : "ltr"}
              />
              <button className={`absolute ${isRTL ? "left-5" : "right-5"} top-1/2 -translate-y-1/2 text-[#1e4d3a] hover:text-[#C9A84C] transition-colors`}>
                <span className="material-symbols-outlined text-[22px]">search</span>
              </button>
            </div>

            <Link
              to="/scholars"
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-[#1e4d3a] text-[#fbf9f4] border-2 border-[#1e4d3a] rounded-lg text-[13px] font-bold tracking-[0.05em] font-['Hanken_Grotesk'] hover:bg-[#fbf9f4] hover:text-[#1e4d3a] transition-all duration-300"
            >
              {t.exploreButton}
              <span className="material-symbols-outlined text-[18px]">{isRTL ? "arrow_back" : "arrow_forward"}</span>
            </Link>
          </section>
        </FadeIn>

        {/* 3. Featured Scholars */}
        <FadeIn>
          <section className="py-20 px-[20px] md:px-[64px] max-w-[1280px] mx-auto">
            <div className="flex justify-between items-end mb-12 pb-4 border-b-2 border-[#1e4d3a]">
              <div>
                <p className="font-['JetBrains_Mono'] text-[10px] uppercase tracking-[0.15em] font-bold text-[#C9A84C] mb-2">
                  {t.featuredLabel}
                </p>
                <h2 className="font-['Hanken_Grotesk'] text-3xl font-bold text-[#1e4d3a]">
                  {isRTL ? "تعرف على العملاقة" : lang === "FR" ? "Rencontrez les Géants" : "Meet the Giants"}
                </h2>
              </div>
              <Link to="/scholars" className="font-['JetBrains_Mono'] text-[12px] font-semibold text-[#1e4d3a] hover:text-[#C9A84C] flex items-center gap-1.5 transition-colors">
                {t.viewAll}
                <span className="material-symbols-outlined text-[16px]">{isRTL ? "arrow_back" : "arrow_forward"}</span>
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {featuredScholars.map((scholar, index) => (
                <FadeIn key={scholar.version_id} delay={100 + index * 100}>
                  <Link
                    to={`/scholars/${scholar.version_id}`}
                    className="group block bg-[#F5F3EC] rounded-2xl overflow-hidden border border-[#1e4d3a]/10 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                  >
                    <div className="relative h-64 bg-[#e5d5a8]">
                      <img src={scholar.image_url} alt={scholar.canonical_name} className="w-full h-full object-cover" />
                      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#1e4d3a]/90 to-transparent">
                        <span className="font-['JetBrains_Mono'] text-[10px] text-[#C9A84C] tracking-widest uppercase">
                          {scholar.region_name}
                        </span>
                      </div>
                    </div>
                    <div className="p-6">
                      <h3 className="font-['Hanken_Grotesk'] text-xl font-bold text-[#1e4d3a] mb-2">{scholar.canonical_name}</h3>
                      <p className="font-['JetBrains_Mono'] text-[11px] text-[#C9A84C] font-semibold mb-3">
                        {scholar.century_gregorian_start}-{scholar.century_gregorian_end} • {scholar.discipline_name}
                      </p>
                      <p className="font-['Inter'] text-sm text-[#1e4d3a]/80 leading-relaxed">{scholar.biography}</p>
                    </div>
                  </Link>
                </FadeIn>
              ))}
            </div>
          </section>
        </FadeIn>

        {/* 4. Recently Added */}
        <FadeIn>
          <section className="py-20 px-[20px] md:px-[64px] bg-[#F5F3EC] border-y-2 border-[#1e4d3a]/10">
            <div className="max-w-[1280px] mx-auto">
              <div className="flex justify-between items-center mb-12">
                <h2 className="font-['Hanken_Grotesk'] text-2xl md:text-3xl font-bold text-[#1e4d3a]">
                  {t.recentLabel}
                </h2>
                <Link to="/scholars" className="font-['JetBrains_Mono'] text-[12px] font-semibold text-[#1e4d3a] hover:text-[#C9A84C] flex items-center gap-1.5 transition-colors">
                  {t.viewAll}
                  <span className="material-symbols-outlined text-[16px]">{isRTL ? "arrow_back" : "arrow_forward"}</span>
                </Link>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                {recentScholars.map((scholar, index) => (
                  <FadeIn key={scholar.version_id} delay={100 + index * 100} className="group text-center">
                    <Link to={`/scholars/${scholar.version_id}`}>
                      <div className="w-28 h-28 md:w-32 md:h-32 mx-auto rounded-full overflow-hidden border-2 border-[#1e4d3a] mb-4 bg-[#fbf9f4]">
                        <img src={scholar.image_url} alt={scholar.canonical_name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                      </div>
                      <h3 className="font-['Hanken_Grotesk'] text-base font-semibold text-[#1e4d3a] mb-1">{scholar.canonical_name}</h3>
                      <p className="font-['JetBrains_Mono'] text-[10px] text-[#C9A84C] font-semibold mb-1">{scholar.century_gregorian_start}</p>
                      <p className="font-['Inter'] text-xs text-[#1e4d3a]/60">{formatDate(scholar.created_at)}</p>
                    </Link>
                  </FadeIn>
                ))}
              </div>
            </div>
          </section>
        </FadeIn>

        {/* 5. Why Oulamauna */}
        <FadeIn>
          <section className="py-20 px-[20px] md:px-[64px] max-w-[1280px] mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.3fr_auto] gap-12 lg:gap-10 items-center">

              <FadeIn delay={100} className={isRTL ? "text-right" : "text-left"}>
                <p className="font-['JetBrains_Mono'] text-[10px] uppercase tracking-[0.15em] font-bold text-[#C9A84C] mb-4">
                  {w.tagline}
                </p>
                <h2 className="font-['Hanken_Grotesk'] text-3xl md:text-[34px] leading-tight font-bold text-[#1e4d3a] mb-5">
                  {w.titleLine1}
                  <br />
                  {w.titleLine2}
                </h2>
                <p className="font-['Inter'] text-[14px] leading-[1.7] text-[#1e4d3a]/70 mb-6">
                  {w.description}
                </p>
                <ul className="flex flex-col gap-3 mb-8">
                  {w.bullets.map((bullet, i) => (
                    <li key={i} className={`flex items-center gap-2.5 font-['Inter'] text-[13px] text-[#1e4d3a]/80 ${isRTL ? "flex-row-reverse" : ""}`}>
                      <span className="material-symbols-outlined text-[16px] text-[#C9A84C] flex-shrink-0">check_circle</span>
                      {bullet}
                    </li>
                  ))}
                </ul>
                <Link
                  to="/about"
                  className="inline-flex items-center gap-2 px-6 py-3 border-2 border-[#1e4d3a] rounded-lg text-[12px] font-bold tracking-[0.05em] font-['Hanken_Grotesk'] text-[#1e4d3a] hover:bg-[#1e4d3a] hover:text-[#fbf9f4] transition-all duration-300"
                >
                  {w.ctaButton}
                  <span className="material-symbols-outlined text-[16px]">{isRTL ? "arrow_back" : "arrow_forward"}</span>
                </Link>
              </FadeIn>

              <FadeIn delay={200} className="rounded-2xl overflow-hidden h-[360px] md:h-[420px] bg-[#F5F3EC]">
                <img
                  src="https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=800&h=1000&fit=crop"
                  alt={w.titleLine1}
                  className="w-full h-full object-cover"
                />
              </FadeIn>

              <FadeIn delay={300} className="flex flex-col gap-7 lg:pl-4">
                {archiveStats.map((stat, i) => (
                  <div key={i} className={`flex items-center gap-4 group ${isRTL ? "flex-row-reverse" : ""}`}>
                    <div className="w-11 h-11 flex-shrink-0 rounded-full border border-[#C9A84C]/50 flex items-center justify-center group-hover:border-[#C9A84C] group-hover:bg-[#f6efdc] transition-colors duration-300">
                      <span
                        className="material-symbols-outlined text-[18px] text-[#C9A84C]"
                        style={{ fontVariationSettings: "'FILL' 0, 'wght' 200" }}
                      >
                        {stat.icon}
                      </span>
                    </div>
                    <div className={isRTL ? "text-right" : "text-left"}>
                      <div className="font-['Hanken_Grotesk'] text-2xl md:text-[26px] font-bold text-[#1e4d3a] leading-tight whitespace-nowrap">
                        {stat.value}
                      </div>
                      <div className="font-['Inter'] text-[13px] text-[#1e4d3a]/60 whitespace-nowrap">
                        {statLabel(stat)}
                      </div>
                    </div>
                  </div>
                ))}
              </FadeIn>
            </div>
          </section>
        </FadeIn>

        {/* 6. Featured Works & Manuscripts */}
        <FadeIn>
          <section id="works" className="scroll-mt-32 py-20 px-[20px] md:px-[64px] max-w-[1280px] mx-auto">
            <h2 className="font-['Hanken_Grotesk'] text-3xl font-bold text-[#1e4d3a] text-center mb-12">
              {t.worksLabel}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {featuredWorks.map((work, index) => (
                <FadeIn key={work.work_id} delay={100 + index * 150}>
                  <div className="bg-[#F5F3EC] rounded-2xl overflow-hidden border border-[#1e4d3a]/10 hover:shadow-lg transition-all duration-300">
                    <img src={work.media_url} alt={work.title} className="w-full h-56 object-cover" />
                    <div className="p-6">
                      <span className="inline-block px-3 py-1 bg-[#e5d5a8]/30 border border-[#1e4d3a]/20 rounded text-[10px] font-['JetBrains_Mono'] font-bold text-[#1e4d3a] mb-3">
                        {work.format}
                      </span>
                      <h3 className="font-['Hanken_Grotesk'] text-xl font-bold text-[#1e4d3a] mb-1">{work.title}</h3>
                      <p className="font-['JetBrains_Mono'] text-[11px] text-[#C9A84C] font-semibold mb-3">{work.year}</p>
                      <p className="font-['Inter'] text-sm text-[#1e4d3a]/80 leading-relaxed">{work.description}</p>
                    </div>
                  </div>
                </FadeIn>
              ))}
            </div>
          </section>
        </FadeIn>

        {/* 7. Eras Timeline */}
        <FadeIn>
          <section className="py-20 px-[20px] md:px-[64px] bg-[#fbf9f4]">
            <div className="max-w-[1280px] mx-auto">
              <h2 className="font-['Hanken_Grotesk'] text-3xl font-bold text-[#1e4d3a] text-center mb-12">
                {t.erasLabel}
              </h2>

              <div className="flex flex-col gap-6">
                {eras.map((era, index) => (
                  <FadeIn key={era.name} delay={100 + index * 100}>
                    <Link
                      to={`/scholars?era=${era.name}`}
                      className="group flex bg-white rounded-xl overflow-hidden border border-[#1e4d3a]/10 hover:shadow-lg hover:translate-x-1 transition-all duration-300"
                    >
                      <div className="w-48 flex-shrink-0 bg-[#F5F3EC] hidden md:block">
                        <img src={era.image_url} alt={era.name} className="w-full h-full object-cover min-h-[150px]" />
                      </div>
                      <div className="flex-1 p-6 flex items-center justify-between">
                        <div>
                          <h3 className="font-['Hanken_Grotesk'] text-xl font-bold text-[#1e4d3a] mb-1">{era.name}</h3>
                          <p className="font-['JetBrains_Mono'] text-xs text-[#C9A84C] font-semibold">{era.period}</p>
                        </div>
                        <div className="text-center px-6 py-4 bg-[#1e4d3a]/80 rounded-lg backdrop-blur-sm">
                          <div className="font-['Hanken_Grotesk'] text-2xl font-bold text-[#e5d5a8]">{era.scholars_count}</div>
                          <div className="font-['JetBrains_Mono'] text-[9px] text-[#fbf9f4]/80 tracking-wider mt-1">
                            {isRTL ? "عالم" : lang === "FR" ? "SAVANTS" : "SCHOLARS"}
                          </div>
                        </div>
                      </div>
                    </Link>
                  </FadeIn>
                ))}
              </div>
            </div>
          </section>
        </FadeIn>

        {/* 8. Disciplines Grid */}
        <FadeIn>
          <section id="disciplines" className="scroll-mt-32 py-20 px-[20px] md:px-[64px] max-w-[1280px] mx-auto">
            <h2 className="font-['Hanken_Grotesk'] text-3xl font-bold text-[#1e4d3a] text-center mb-4">
              {t.disciplinesLabel}
            </h2>
            <p className="font-['Inter'] text-[15px] text-[#1e4d3a]/60 text-center mb-12 max-w-2xl mx-auto">
              {isRTL
                ? "استكشف مجالات المعرفة التي شكّلت الحضارة الإسلامية عبر القرون"
                : lang === "FR"
                  ? "Explorez les domaines du savoir qui ont façonné la civilisation islamique à travers les siècles"
                  : "Explore the fields of knowledge that shaped Islamic civilization across the centuries"}
            </p>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {disciplines.map((disc, index) => (
                <FadeIn key={disc.discipline_id} delay={50 + index * 50}>
                  <Link
                    to={`/scholars?discipline=${disc.name}`}
                    className="group block p-6 bg-[#fcfaf5] rounded-[12px] border border-[#1e4d3a] shadow-[0px_4px_20px_rgba(30,77,58,0.08)] hover:shadow-[0px_6px_24px_rgba(30,77,58,0.12)] hover:-translate-y-1 transition-all duration-300"
                    style={{ backgroundColor: '#fcfaf5' }}
                  >
                    <div className="w-7 h-7 rounded-[6px] bg-[#f6efdc] border border-[#1e4d3a] flex items-center justify-center mb-4 group-hover:bg-[#1e4d3a] group-hover:border-[#1e4d3a] transition-colors duration-300">
                      <span
                        className="material-symbols-outlined text-[16px] text-[#1e4d3a] group-hover:text-[#fcfaf5] transition-colors duration-300"
                        style={{ fontVariationSettings: "'FILL' 0, 'wght' 400" }}
                      >
                        {disc.icon}
                      </span>
                    </div>

                    <div className="font-['Hanken_Grotesk'] text-[15px] font-semibold text-[#1e4d3a] mb-2 group-hover:text-[#1e4d3a] transition-colors">
                      {disc.name}
                    </div>

                    <div className="inline-flex items-baseline gap-1.5">
                      <span className="font-['Hanken_Grotesk'] text-xl font-bold text-[#1e4d3a] group-hover:text-[#1e4d3a] transition-colors">
                        {disc.count}
                      </span>
                      <span className="font-['Inter'] text-[11px] text-[#1e4d3a]/70 group-hover:text-[#1e4d3a] transition-colors">
                        {isRTL ? "عالم" : lang === "FR" ? "savants" : "scholars"}
                      </span>
                    </div>
                  </Link>
                </FadeIn>
              ))}
            </div>
          </section>
        </FadeIn>

        {/* 9. CTA Section */}
        <FadeIn>
          <section className="py-24 px-[20px] md:px-[64px] text-center bg-[#1e4d3a] relative overflow-hidden">
            <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full border-2 border-[#C9A84C] opacity-20" />
            <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full border-2 border-[#C9A84C] opacity-10" />

            <div className="relative z-10 max-w-2xl mx-auto">
              <h2 className="font-['Hanken_Grotesk'] text-3xl md:text-4xl font-bold text-[#fbf9f4] mb-4">
                {t.ctaTitle}
              </h2>
              <p className="font-['Inter'] text-base text-[#fbf9f4]/80 mb-8 leading-relaxed">
                {t.ctaText}
              </p>
              <Link
                to="/register"
                className="inline-flex items-center gap-2 px-10 py-4 bg-[#C9A84C] text-[#1e4d3a] border-2 border-[#C9A84C] rounded-lg text-xs font-bold tracking-[0.1em] font-['JetBrains_Mono'] uppercase hover:bg-[#fbf9f4] transition-colors duration-300"
              >
                {t.ctaButton}
                <span className="material-symbols-outlined text-[18px]">{isRTL ? "arrow_back" : "arrow_forward"}</span>
              </Link>
            </div>
          </section>
        </FadeIn>

      </main>
    </div>
  );
};

export default Home;