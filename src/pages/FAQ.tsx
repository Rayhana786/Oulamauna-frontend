import React, { useState } from "react";
import { useLang } from "../context/LanguageContext";
import { Link } from "react-router-dom";

export default function FAQ() {
  const { lang } = useLang();
  const isRTL = lang === "AR";

  const headingFont = isRTL ? "'Amiri', serif" : "'Hanken Grotesk', sans-serif";
  const bodyFont = isRTL ? "'Amiri', serif" : "'Inter', sans-serif";

  const translations: any = {
    EN: {
      title: "Frequently Asked Questions",
      subtitle: "Find answers to common questions about Oulamauna",
      sections: [
        {
          title: "General Questions",
          items: [
            { q: "What is Oulamauna?", a: "Oulamauna is a comprehensive digital platform dedicated to preserving and sharing the intellectual heritage of Islamic scholars throughout history. We provide verified biographies, original works, and manuscript archives in one accessible place." },
            { q: "Who can use Oulamauna?", a: "Oulamauna is free for everyone! Students, researchers, scholars, and anyone interested in Islamic intellectual history can browse our collection. Registered users can contribute by submitting new scholars or editing existing entries." },
            { q: "Is the content free to access?", a: "Yes! All content on Oulamauna is completely free to access. We believe knowledge should be accessible to everyone." }
          ]
        },
        {
          title: "Contributions & Submissions",
          items: [
            { q: "How can I contribute to the platform?", a: "You can contribute by:\n1. Submitting new scholar biographies\n2. Adding works and manuscripts\n3. Editing and improving existing entries\n4. Uploading historical documents and media\n\nAll contributions are reviewed by our team before publication." },
            { q: "What are the requirements for submitting a scholar?", a: "When submitting a scholar, please provide:\n• Full name and aliases\n• Birth and death dates (if known)\n• Region/country of origin\n• Main disciplines/fields of expertise\n• Biography with reliable sources\n• Any available works or manuscripts" },
            { q: "How long does the review process take?", a: "Our team typically reviews submissions within 5-7 business days. Complex submissions or those requiring additional verification may take longer." },
            { q: "Can I edit my submission after it's published?", a: "Yes! You can request edits to your submissions through your dashboard. All edits go through a review process to maintain quality and accuracy." }
          ]
        },
        {
          title: "Account & Registration",
          items: [
            { q: "Do I need an account to browse?", a: "No, you can browse all content without an account. However, creating an account allows you to contribute, save favorites, and track your submissions." },
            { q: "How do I create an account?", a: "Click the 'Register' button in the navigation menu, fill in your details, and verify your email address. Your account will be activated immediately after email verification." },
            { q: "I forgot my password. How can I reset it?", a: "Click 'Forgot Password' on the login page, enter your email address, and we'll send you a password reset link. The link is valid for 24 hours." }
          ]
        },
        {
          title: "Content & Quality",
          items: [
            { q: "How do you verify the accuracy of information?", a: "All submissions are reviewed by our team of researchers and subject matter experts. We cross-reference information with reliable historical sources and academic publications before approval." },
            { q: "What sources do you accept?", a: "We accept information from:\n• Academic publications\n• Historical manuscripts\n• Verified biographical dictionaries\n• Reputable academic institutions\n• Primary historical sources\n\nAll sources must be properly cited." },
            { q: "Can I download or share content?", a: "Yes! You can share links to our pages freely. For downloading content or using it in publications, please check the specific license for each item and provide proper attribution to Oulamauna." }
          ]
        }
      ],
      cta: {
        title: "Didn't find the answer you're looking for?",
        subtitle: "Our team is here to help. Feel free to reach out to us.",
        button: "Contact Us"
      }
    },
    AR: {
      title: "الأسئلة الشائعة",
      subtitle: "اعثر على إجابات للأسئلة الشائعة حول علماؤنا",
      sections: [
        {
          title: "أسئلة عامة",
          items: [
            { q: "ما هو موقع علماؤنا؟", a: "علماؤنا هو منصة رقمية شاملة مكرسة للحفاظ على التراث الفكري للعلماء المسلمين عبر التاريخ ومشاركته. نوفر سير ذاتية موثقة وأعمالاً أصلية وأرشيفات مخطوطات في مكان واحد سهل الوصول." },
            { q: "من يمكنه استخدام الموقع؟", a: "علماؤنا مجاني للجميع! الطلاب والباحثون والعلماء وأي شخص مهتم بالتاريخ الفكري الإسلامي يمكنه تصفح مجموعتنا. يمكن للمستخدمين المسجلين المساهمة بإضافة علماء جدد أو تعديل الإدخالات الموجودة." },
            { q: "هل المحتوى مجاني للوصول؟", a: "نعم! جميع المحتويات على علماؤنا مجانية تماماً للوصول. نؤمن بأن المعرفة يجب أن تكون متاحة للجميع." }
          ]
        },
        {
          title: "المساهمات والإضافات",
          items: [
            { q: "كيف يمكنني المساهمة في المنصة؟", a: "يمكنك المساهمة عن طريق:\n1. تقديم سير ذاتية لعلماء جدد\n2. إضافة الأعمال والمخطوطات\n3. تعديل وتحسين الإدخالات الموجودة\n4. رفع الوثائق التاريخية والوسائط\n\nتتم مراجعة جميع المساهمات من قبل فريقنا قبل النشر." },
            { q: "ما هي متطلبات إضافة عالم؟", a: "عند إضافة عالم، يرجى تقديم:\n• الاسم الكامل والأسماء المستعارة\n• تواريخ الميلاد والوفاة (إذا كانت معروفة)\n• المنطقة/بلد الأصل\n• التخصصات/المجالات الرئيسية للخبرة\n• سيرة ذاتية مع مصادر موثوقة\n• وأي أعمال أو مخطوطات متاحة" },
            { q: "كم تستغرق عملية المراجعة؟", a: "يراجع فريقنا عادةً الطلبات خلال 5-7 أيام عمل. قد تستغرق الطلبات المعقدة أو التي تتطلب تحققاً إضافياً وقتاً أطول." },
            { q: "هل يمكنني تعديل مساهمتي بعد نشرها؟", a: "نعم! يمكنك طلب تعديلات لمساهماتك من خلال لوحة التحكم الخاصة بك. جميع التعديلات تمر بعملية مراجعة للحفاظ على الجودة والدقة." }
          ]
        },
        {
          title: "الحساب والتسجيل",
          items: [
            { q: "هل أحتاج إلى حساب للتصفح؟", a: "لا، يمكنك تصفح جميع المحتويات بدون حساب. ومع ذلك، إنشاء حساب يسمح لك بالمساهمة وحفظ المفضلة وتتبع مساهماتك." },
            { q: "كيف أنشئ حساباً؟", a: "انقر على زر 'تسجيل' في قائمة التنقل، املأ بياناتك، وتحقق من عنوان بريدك الإلكتروني. سيتم تفعيل حسابك فوراً بعد التحقق من البريد الإلكتروني." },
            { q: "نسيت كلمة المرور. كيف يمكنني إعادة تعيينها؟", a: "انقر على 'نسيت كلمة المرور' في صفحة تسجيل الدخول، أدخل عنوان بريدك الإلكتروني، وسنرسل لك رابطاً لإعادة تعيين كلمة المرور. الرابط صالح لمدة 24 ساعة." }
          ]
        },
        {
          title: "المحتوى والجودة",
          items: [
            { q: "كيف تتحققون من دقة المعلومات؟", a: "تتم مراجعة جميع الطلبات من قبل فريقنا من الباحثين وخبراء الموضوع. نقوم بالرجوع إلى المعلومات مع مصادر تاريخية موثوقة ومنشورات أكاديمية قبل الموافقة." },
            { q: "ما هي المصادر التي تقبلونها؟", a: "نقبل المعلومات من:\n• المنشورات الأكاديمية\n• المخطوطات التاريخية\n• قواميس السير الموثقة\n• المؤسسات الأكاديمية الموثوقة\n• المصادر التاريخية الأولية\n\nيجب الاستشهاد بجميع المصادر بشكل صحيح." },
            { q: "هل يمكنني تنزيل أو مشاركة المحتوى؟", a: "نعم! يمكنك مشاركة روابط صفحاتنا بحرية. لتنزيل المحتوى أو استخدامه في المنشورات، يرجى التحقق من الترخيص المحدد لكل عنصر وتقديم الإسناد المناسب لعلماؤنا." }
          ]
        }
      ],
      cta: {
        title: "لم تجد الإجابة التي تبحث عنها؟",
        subtitle: "فريقنا هنا لمساعدتك. لا تتردد في التواصل معنا.",
        button: "اتصل بنا"
      }
    },
    FR: {
      title: "Questions Fréquemment Posées",
      subtitle: "Trouvez des réponses aux questions courantes sur Oulamauna",
      sections: [
        {
          title: "Questions Générales",
          items: [
            { q: "Qu'est-ce que Oulamauna?", a: "Oulamauna est une plateforme numérique complète dédiée à la préservation et au partage du patrimoine intellectuel des savants islamiques à travers l'histoire. Nous fournissons des biographies vérifiées, des œuvres originales et des archives de manuscrits en un seul endroit accessible." },
            { q: "Qui peut utiliser Oulamauna?", a: "Oulamauna est gratuit pour tous! Les étudiants, chercheurs, savants et toute personne intéressée par l'histoire intellectuelle islamique peuvent parcourir notre collection. Les utilisateurs enregistrés peuvent contribuer en soumettant de nouveaux savants ou en modifiant les entrées existantes." },
            { q: "Le contenu est-il gratuit d'accès?", a: "Oui! Tout le contenu sur Oulamauna est complètement gratuit d'accès. Nous croyons que la connaissance devrait être accessible à tous." }
          ]
        },
        {
          title: "Contributions et Soumissions",
          items: [
            { q: "Comment puis-je contribuer à la plateforme?", a: "Vous pouvez contribuer en:\n1. Soumettant de nouvelles biographies de savants\n2. Ajoutant des œuvres et manuscrits\n3. Modifiant et améliorant les entrées existantes\n4. Téléchargeant des documents historiques et médias\n\nToutes les contributions sont examinées par notre équipe avant publication." },
            { q: "Quelles sont les exigences pour soumettre un savant?", a: "Lors de la soumission d'un savant, veuillez fournir:\n• Nom complet et alias\n• Dates de naissance et de décès (si connues)\n• Région/pays d'origine\n• Principales disciplines/domaines d'expertise\n• Biographie avec sources fiables\n• Toutes œuvres ou manuscrits disponibles" },
            { q: "Combien de temps prend le processus d'examen?", a: "Notre équipe examine généralement les soumissions dans un délai de 5 à 7 jours ouvrables. Les soumissions complexes ou nécessitant une vérification supplémentaire peuvent prendre plus de temps." },
            { q: "Puis-je modifier ma soumission après publication?", a: "Oui! Vous pouvez demander des modifications à vos soumissions via votre tableau de bord. Toutes les modifications passent par un processus d'examen pour maintenir la qualité et l'exactitude." }
          ]
        },
        {
          title: "Compte et Inscription",
          items: [
            { q: "Ai-je besoin d'un compte pour parcourir?", a: "Non, vous pouvez parcourir tout le contenu sans compte. Cependant, créer un compte vous permet de contribuer, d'enregistrer des favoris et de suivre vos soumissions." },
            { q: "Comment créer un compte?", a: "Cliquez sur le bouton 'S'inscrire' dans le menu de navigation, remplissez vos informations et vérifiez votre adresse e-mail. Votre compte sera activé immédiatement après la vérification de l'e-mail." },
            { q: "J'ai oublié mon mot de passe. Comment le réinitialiser?", a: "Cliquez sur 'Mot de passe oublié' sur la page de connexion, entrez votre adresse e-mail et nous vous enverrons un lien de réinitialisation de mot de passe. Le lien est valide pendant 24 heures." }
          ]
        },
        {
          title: "Contenu et Qualité",
          items: [
            { q: "Comment vérifiez-vous l'exactitude des informations?", a: "Toutes les soumissions sont examinées par notre équipe de chercheurs et d'experts en la matière. Nous recoupons les informations avec des sources historiques fiables et des publications académiques avant approbation." },
            { q: "Quelles sources acceptez-vous?", a: "Nous acceptons les informations provenant de:\n• Publications académiques\n• Manuscrits historiques\n• Dictionnaires biographiques vérifiés\n• Institutions académiques réputées\n• Sources historiques primaires\n\nToutes les sources doivent être correctement citées." },
            { q: "Puis-je télécharger ou partager du contenu?", a: "Oui! Vous pouvez partager librement les liens vers nos pages. Pour télécharger du contenu ou l'utiliser dans des publications, veuillez vérifier la licence spécifique pour chaque élément et fournir une attribution appropriée à Oulamauna." }
          ]
        }
      ],
      cta: {
        title: "Vous n'avez pas trouvé la réponse?",
        subtitle: "Notre équipe est là pour vous aider. N'hésitez pas à nous contacter.",
        button: "Contactez-nous"
      }
    }
  };

  const t = translations[lang] || translations.EN;

  return (
    <div dir={isRTL ? "rtl" : "ltr"} style={{ minHeight: "100vh", backgroundColor: "#fbf9f4", fontFamily: bodyFont }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Hanken+Grotesk:wght@400;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;600&display=swap');
      `}</style>

      <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "48px 24px 80px" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "64px" }}>
          <h1 style={{ 
            fontFamily: headingFont, 
            fontSize: "clamp(32px, 5vw, 48px)", 
            fontWeight: 700, 
            color: "#1e4d3a", 
            marginBottom: "16px",
            lineHeight: 1.15
          }}>
            {t.title}
          </h1>
          <p style={{ 
            fontFamily: bodyFont, 
            fontSize: "16px", 
            color: "#1e4d3a99", 
            maxWidth: "600px", 
            margin: "0 auto", 
            lineHeight: 1.7 
          }}>
            {t.subtitle}
          </p>
        </div>

        {/* FAQ Sections */}
        <div style={{ display: "flex", flexDirection: "column", gap: "48px" }}>
          {t.sections.map((section: any, sectionIndex: number) => (
            <div key={sectionIndex}>
              <h2 style={{ 
                fontFamily: headingFont, 
                fontSize: "24px", 
                fontWeight: 700, 
                color: "#1e4d3a", 
                marginBottom: "24px", 
                paddingBottom: "12px", 
                borderBottom: "2px solid rgba(30,77,58,0.1)" 
              }}>
                {section.title}
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {section.items.map((faq: any, faqIndex: number) => (
                  <FAQCard 
                    key={faqIndex} 
                    q={faq.q} 
                    a={faq.a} 
                    headingFont={headingFont} 
                    bodyFont={bodyFont} 
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Contact CTA */}
        <div style={{ 
          marginTop: "64px", 
          textAlign: "center", 
          backgroundColor: "#1e4d3a", 
          borderRadius: "16px", 
          padding: "48px 24px" 
        }}>
          <h3 style={{ 
            fontFamily: headingFont, 
            fontSize: "24px", 
            fontWeight: 700, 
            color: "#fbf9f4", 
            marginBottom: "16px" 
          }}>
            {t.cta.title}
          </h3>
          <p style={{ 
            fontFamily: bodyFont, 
            fontSize: "15px", 
            color: "#fbf9f499", 
            marginBottom: "32px", 
            lineHeight: 1.7 
          }}>
            {t.cta.subtitle}
          </p>
          
          <Link to="/contact" style={{ textDecoration: "none" }}>
            <ContactButton label={t.cta.button} isRTL={isRTL} headingFont={headingFont} />
          </Link>
        </div>
      </div>
    </div>
  );
}

const FAQCard: React.FC<{ q: string; a: string; headingFont: string; bodyFont: string }> = ({ q, a, headingFont, bodyFont }) => {
  const [hovered, setHovered] = useState(false);
  
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        backgroundColor: "#F5F3EC",
        borderRadius: "16px",
        padding: "24px",
        border: `1px solid ${hovered ? "#1e4d3a" : "rgba(30,77,58,0.1)"}`,
        boxShadow: hovered
          ? "0 20px 25px -5px rgba(30,77,58,0.15), 0 8px 10px -6px rgba(30,77,58,0.08)"
          : "0 2px 12px rgba(30,77,58,0.06)",
        transform: hovered ? "translateY(-4px)" : "translateY(0)",
        transition: "all 0.3s ease",
      }}
    >
      <h3 style={{ 
        fontFamily: headingFont, 
        fontSize: "18px", 
        fontWeight: 700, 
        color: "#1e4d3a", 
        marginBottom: "12px",
        lineHeight: 1.4
      }}>
        {q}
      </h3>
      <p style={{ 
        fontFamily: bodyFont, 
        fontSize: "15px", 
        color: "#1e4d3a99", 
        lineHeight: 1.8, 
        whiteSpace: "pre-line", 
        margin: 0 
      }}>
        {a}
      </p>
    </div>
  );
};

const ContactButton: React.FC<{ label: string; isRTL: boolean; headingFont: string }> = ({ label, isRTL, headingFont }) => {
  const [hovered, setHovered] = useState(false);
  
  return (
    <button
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "inline-flex", 
        alignItems: "center", 
        gap: "9px", 
        padding: "11px 22px",
        backgroundColor: hovered ? "#fbf9f4" : "#C9A84C",
        color: "#1e4d3a",
        border: `2px solid ${hovered ? "#1e4d3a" : "#C9A84C"}`,
        borderRadius: "8px", 
        fontFamily: headingFont, 
        fontSize: "12px",
        fontWeight: 700, 
        letterSpacing: "0.05em", 
        cursor: "pointer",
        boxShadow: hovered ? "none" : "0 2px 10px rgba(201,168,76,0.3)",
        transition: "all 0.3s ease",
      }}
    >
      {label}
      <svg 
        width="13" 
        height="13" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2.5" 
        strokeLinecap="round"
        style={{ 
          transform: `${isRTL ? "rotate(180deg)" : "rotate(0deg)"} ${hovered ? (isRTL ? "translateX(-4px)" : "translateX(4px)") : "translateX(0)"}`, 
          transition: "transform 0.3s ease" 
        }}
      >
        <path d="M5 12h14M12 5l7 7-7 7" />
      </svg>
    </button>
  );
};