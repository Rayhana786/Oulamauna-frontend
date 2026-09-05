import React, { useState } from "react";
import { useLang } from "../context/LanguageContext";
import { Link } from "react-router-dom";

export default function Terms() {
  const { lang } = useLang();
  const isRTL = lang === "AR";

  const headingFont = lang === "AR" ? "'Amiri', serif" : "'Hanken Grotesk', sans-serif";
  const bodyFont = lang === "AR" ? "'Amiri', serif" : "'Inter', sans-serif";
  const monoFont = "'JetBrains Mono', monospace";

  const termsContent = {
    AR: {
      title: "شروط الاستخدام",
      intro: "مرحباً بكم في علماؤنا. من خلال الوصول إلى منصتنا أو استخدامها، فإنك توافق على الالتزام بشروط الاستخدام هذه. يرجى قراءتها بعناية.",
      sections: [
        { title: "1. قبول الشروط", text: "من خلال الوصول إلى علماؤنا، فإنك توافق على الالتزام بهذه الشروط والالتزام بها قانوناً. إذا كنت لا توافق، يرجى عدم استخدام منصتنا." },
        { title: "2. مسؤوليات المستخدم", text: "• يجب عليك تقديم معلومات دقيقة وصحيحة عند إنشاء حساب.\n• أنت مسؤول عن الحفاظ على سرية بيانات اعتماد حسابك.\n• توافق على عدم استخدام المنصة لأي غرض غير قانوني أو محظور." },
        { title: "3. المحتوى والمساهمات", text: "• تحتفظ بملكية المحتوى الذي تقدمه، لكنك تمنح علماؤنا ترخيصاً غير حصري وعالمي لعرضه وتوزيعه.\n• يجب عليك التأكد من أن مساهماتك لا تنتهك أي حقوق طبع ونشر أو حقوق ملكية فكرية.\n• نحتفظ بالحق في مراجعة أو تعديل أو إزالة أي تقديم ينتهك إرشاداتنا." },
        { title: "4. الملكية الفكرية", text: "جميع محتويات وتصميم ووظائف منصة علماؤنا (باستثناء المحتوى المقدم من المستخدم) مملوكة لعلماؤنا ومحمية بموجب قوانين حقوق النشر والملكية الفكرية." },
        { title: "5. تحديد المسؤولية", text: "تُقدم منصة علماؤنا 'كما هي'. نحن لا نضمن أن المنصة ستكون متاحة دون انقطاع أو خالية من الأخطاء. نحن لسنا مسؤولين عن أي أخطاء تاريخية في المحتوى المقدم من المستخدمين." },
        { title: "6. التغييرات على الشروط", text: "نحتفظ بالحق في تعديل هذه الشروط في أي وقت. يشكل الاستخدام المستمر للمنصة بعد التغييرات قبولاً للشروط الجديدة." },
        { title: "7. الاتصال", text: "للأسئلة المتعلقة بهذه الشروط، يرجى الاتصال بنا على: legal@oulamauna.com" }
      ]
    },
    EN: {
      title: "Terms of Use",
      intro: "Welcome to Oulamauna. By accessing or using our platform, you agree to be bound by these Terms of Use. Please read them carefully.",
      sections: [
        { title: "1. Acceptance of Terms", text: "By accessing Oulamauna, you agree to comply with and be legally bound by these Terms. If you do not agree, please do not use our platform." },
        { title: "2. User Responsibilities", text: "• You must provide accurate and truthful information when creating an account.\n• You are responsible for maintaining the confidentiality of your account credentials.\n• You agree not to use the platform for any unlawful or prohibited purpose." },
        { title: "3. Content and Contributions", text: "• You retain ownership of the content you submit, but you grant Oulamauna a non-exclusive, worldwide license to display and distribute it.\n• You must ensure that your contributions do not violate any copyright or intellectual property rights.\n• We reserve the right to review, edit, or remove any submission that violates our guidelines." },
        { title: "4. Intellectual Property", text: "All content, design, and functionality of the Oulamauna platform (excluding user-submitted content) are owned by Oulamauna and are protected by copyright and intellectual property laws." },
        { title: "5. Limitation of Liability", text: "Oulamauna is provided 'as is'. We do not guarantee that the platform will be uninterrupted or error-free. We are not liable for any historical inaccuracies in user-submitted content." },
        { title: "6. Changes to Terms", text: "We reserve the right to modify these Terms at any time. Continued use of the platform after changes constitutes acceptance of the new Terms." },
        { title: "7. Contact", text: "For questions regarding these Terms, please contact us at: legal@oulamauna.com" }
      ]
    },
    FR: {
      title: "Conditions d'Utilisation",
      intro: "Bienvenue sur Oulamauna. En accédant ou en utilisant notre plateforme, vous acceptez d'être lié par ces Conditions d'Utilisation. Veuillez les lire attentivement.",
      sections: [
        { title: "1. Acceptation des Conditions", text: "En accédant à Oulamauna, vous acceptez de vous conformer et d'être légalement lié par ces Conditions. Si vous n'êtes pas d'accord, veuillez ne pas utiliser notre plateforme." },
        { title: "2. Responsabilités de l'Utilisateur", text: "• Vous devez fournir des informations exactes et véridiques lors de la création d'un compte.\n• Vous êtes responsable du maintien de la confidentialité de vos identifiants de compte.\n• Vous acceptez de ne pas utiliser la plateforme à des fins illégales ou interdites." },
        { title: "3. Contenu et Contributions", text: "• Vous conservez la propriété du contenu que vous soumettez, mais vous accordez à Oulamauna une licence non exclusive et mondiale pour l'afficher et le distribuer.\n• Vous devez vous assurer que vos contributions ne violent aucun droit d'auteur ou de propriété intellectuelle.\n• Nous nous réservons le droit d'examiner, de modifier ou de supprimer toute soumission qui viole nos directives." },
        { title: "4. Propriété Intellectuelle", text: "Tout le contenu, la conception et la fonctionnalité de la plateforme Oulamauna (à l'exclusion du contenu soumis par les utilisateurs) sont la propriété d'Oulamauna et sont protégés par les lois sur le droit d'auteur et la propriété intellectuelle." },
        { title: "5. Limitation de Responsabilité", text: "Oulamauna est fourni 'tel quel'. Nous ne garantissons pas que la plateforme sera ininterrompue ou exempte d'erreurs. Nous ne sommes pas responsables des inexactitudes historiques dans le contenu soumis par les utilisateurs." },
        { title: "6. Modifications des Conditions", text: "Nous nous réservons le droit de modifier ces Conditions à tout moment. L'utilisation continue de la plateforme après les modifications constitue l'acceptation des nouvelles Conditions." },
        { title: "7. Contact", text: "Pour toute question concernant ces Conditions, veuillez nous contacter à: legal@oulamauna.com" }
      ]
    }
  };

  const t = termsContent[lang as keyof typeof termsContent] || termsContent.EN;
  
  const breadcrumbs = {
    AR: { home: "الرئيسية", current: "شروط الاستخدام" },
    EN: { home: "HOME", current: "TERMS OF USE" },
    FR: { home: "ACCUEIL", current: "CONDITIONS D'UTILISATION" }
  };
  const bc = breadcrumbs[lang as keyof typeof breadcrumbs] || breadcrumbs.EN;
  const backToTopLabel = isRTL ? "العودة للأعلى" : lang === "FR" ? "Retour en haut" : "Back to Top";

  return (
    <div dir={isRTL ? "rtl" : "ltr"} style={{ minHeight: "100vh", backgroundColor: "#fbf9f4", fontFamily: bodyFont }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Hanken+Grotesk:wght@400;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;600&display=swap');
      `}</style>

      {/* Hero / Breadcrumb */}
      <section style={{ backgroundColor: "#fbf9f4", padding: "48px 40px 32px", textAlign: "center", borderBottom: "1px solid rgba(30,77,58,0.1)" }}>
        <p style={{
          fontFamily: monoFont, fontSize: "11px", fontWeight: 700, letterSpacing: "0.2em", color: "#C9A84C",
          textTransform: "uppercase", margin: "0 0 14px 0", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
        }}>
          <BreadcrumbHomeLink label={bc.home} />
          <span style={{ color: "#1e4d3a66" }}>›</span>
          <span style={{ color: "#1e4d3a" }}>{bc.current}</span>
        </p>
        <h1 style={{
          fontFamily: headingFont, fontSize: "clamp(32px, 5vw, 48px)", fontWeight: 700, color: "#1e4d3a",
          margin: "0 0 18px 0", lineHeight: 1.15,
        }}>
          {t.title}
        </h1>
      </section>

      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "40px 24px 80px" }}>
        {/* Introduction */}
        <div style={{
          backgroundColor: "#F5F3EC", borderRadius: "16px", padding: "32px", marginBottom: "48px",
          border: "1px solid rgba(30,77,58,0.1)",
        }}>
          <p style={{ fontFamily: bodyFont, fontSize: "15px", color: "#1e4d3a99", lineHeight: 1.8, margin: 0 }}>
            {t.intro}
          </p>
        </div>

        {/* Sections */}
        <div style={{ display: "flex", flexDirection: "column", gap: "40px" }}>
          {t.sections.map((section: any, index: number) => (
            <div key={index} style={{ borderBottom: "1px solid rgba(30,77,58,0.1)", paddingBottom: "40px" }}>
              <h2 style={{ fontFamily: headingFont, fontSize: "24px", fontWeight: 700, color: "#1e4d3a", marginBottom: "16px" }}>
                {section.title}
              </h2>
              <div style={{ fontFamily: bodyFont, fontSize: "15px", color: "#1e4d3a99", lineHeight: 1.8, whiteSpace: "pre-line" }}>
                {section.text}
              </div>
            </div>
          ))}
        </div>

        {/* Back to Top Button */}
        <div style={{ marginTop: "64px", textAlign: "center" }}>
          <BackToTopButton label={backToTopLabel} />
        </div>
      </div>
    </div>
  );
}

// ── Breadcrumb Home Link ─────────────────────────────────────────────────
const BreadcrumbHomeLink: React.FC<{ label: string }> = ({ label }) => {
  const [hovered, setHovered] = useState(false);
  return (
    <Link to="/" onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{ color: hovered ? "#1e4d3a" : "#C9A84C", textDecoration: "none", transition: "color 0.2s ease" }}>
      {label}
    </Link>
  );
};

// ── Back to Top Button with Scholar-style Invert Hover ───────────────────
const BackToTopButton: React.FC<{ label: string }> = ({ label }) => {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      style={{
        display: "inline-flex", alignItems: "center", gap: "9px", padding: "11px 22px",
        backgroundColor: hovered ? "#fbf9f4" : "#1e4d3a",
        color: hovered ? "#1e4d3a" : "#fff",
        border: `2px solid #1e4d3a`,
        borderRadius: "8px", fontFamily: "'Hanken Grotesk', sans-serif", fontSize: "12px",
        fontWeight: 700, letterSpacing: "0.05em", cursor: "pointer",
        boxShadow: hovered ? "none" : "0 2px 10px rgba(30,77,58,0.18)",
        transition: "all 0.3s ease",
      }}
    >
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
        style={{ transform: hovered ? "translateY(-2px)" : "translateY(0)", transition: "transform 0.3s ease" }}>
        <path d="M12 19V5M5 12l7-7 7 7" />
      </svg>
      {label}
    </button>
  );
};