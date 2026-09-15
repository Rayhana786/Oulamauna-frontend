import React, { useState } from "react";
import { useLang } from "../context/LanguageContext";
import { Link } from "react-router-dom";

export default function PrivacyPolicy() {
  const { lang } = useLang();
  const isRTL = lang === "AR";

  const headingFont = isRTL ? "'Amiri', serif" : "'Hanken Grotesk', sans-serif";
  const bodyFont = isRTL ? "'Amiri', serif" : "'Inter', sans-serif";
  const monoFont = "'JetBrains Mono', monospace";

  const translations: any = {
    EN: {
      breadcrumb: { home: "HOME", current: "PRIVACY POLICY" },
      title: "Privacy Policy",
      subtitle: "Last updated: January 2026",
      intro: "At Oulamauna, we are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, and safeguard your data when you use our platform.",
      sections: [
        {
          title: "1. Information We Collect",
          content: [
            { subtitle: "Personal Information", text: "When you create an account or contribute to our platform, we may collect:\n• Name and username\n• Email address\n• Password (encrypted)\n• Profile information\n• Biography and credentials (for contributors)\n• Submission history and contributions" },
            { subtitle: "Automatically Collected Information", text: "We automatically collect certain information when you visit our platform:\n• IP address and browser type\n• Device information\n• Pages visited and time spent\n• Referring website\n• Cookies and similar technologies" }
          ]
        },
        { title: "2. How We Use Your Information", content: [{ subtitle: "", text: "We use the information we collect to:\n• Provide and maintain our services\n• Create and manage your account\n• Process and review your contributions\n• Communicate with you about updates and changes\n• Improve our platform and user experience\n• Ensure security and prevent fraud\n• Comply with legal obligations" }] },
        { title: "3. Data Security", content: [{ subtitle: "", text: "We implement appropriate technical and organizational measures to protect your personal information:\n• Encryption of sensitive data\n• Secure servers and databases\n• Regular security audits\n• Access controls and authentication\n• Regular backups\n\nHowever, no method of transmission over the Internet is 100% secure, and we cannot guarantee absolute security." }] },
        {
          title: "4. Data Sharing and Disclosure",
          content: [
            { subtitle: "We Do Not Sell Your Data", text: "We do not sell, trade, or rent your personal information to third parties." },
            { subtitle: "When We May Share Information", text: "We may share your information in the following circumstances:\n• With your consent\n• To comply with legal obligations\n• To protect our rights and prevent fraud\n• With service providers who assist in our operations (under confidentiality agreements)\n• In connection with a merger or acquisition" }
          ]
        },
        { title: "5. Your Rights", content: [{ subtitle: "", text: "You have the following rights regarding your personal data:\n• Access: Request a copy of your data\n• Correction: Request correction of inaccurate data\n• Deletion: Request deletion of your data\n• Portability: Request transfer of your data\n• Objection: Object to processing of your data\n• Withdrawal of consent: Withdraw consent at any time\n\nTo exercise these rights, contact us at privacy@oulamauna.com" }] },
        { title: "6. Cookies", content: [{ subtitle: "", text: "We use cookies and similar technologies to:\n• Remember your preferences\n• Understand how you use our platform\n• Improve user experience\n• Analyze traffic and usage patterns\n\nYou can control cookies through your browser settings. However, disabling cookies may affect your ability to use certain features of our platform." }] },
        { title: "7. Data Retention", content: [{ subtitle: "", text: "We retain your personal information for as long as necessary to:\n• Provide our services\n• Comply with legal obligations\n• Resolve disputes\n• Enforce our agreements\n\nWhen we no longer need your data, we will securely delete or anonymize it." }] },
        { title: "8. International Data Transfers", content: [{ subtitle: "", text: "If you are accessing our platform from outside Algeria, your data may be transferred to and processed in Algeria. We ensure appropriate safeguards are in place to protect your information in accordance with this Privacy Policy." }] },
        { title: "9. Children's Privacy", content: [{ subtitle: "", text: "Our platform is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13. If we discover that we have collected data from a child under 13, we will delete it immediately." }] },
        { title: "10. Changes to This Privacy Policy", content: [{ subtitle: "", text: "We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the 'Last updated' date. We encourage you to review this Privacy Policy periodically." }] },
        { title: "11. Contact Us", content: [{ subtitle: "", text: "If you have any questions or concerns about this Privacy Policy or our data practices, please contact us at:\n\nEmail: privacy@oulamauna.com\nAddress: Algiers, Algeria\n\nWe will respond to your inquiry within 30 days." }] }
      ],
      backToTop: "Back to Top"
    },
    AR: {
      breadcrumb: { home: "الرئيسية", current: "سياسة الخصوصية" },
      title: "سياسة الخصوصية",
      intro: "في علماؤنا، نلتزم بحماية خصوصيتك وضمان أمان معلوماتك الشخصية. توضح سياسة الخصوصية هذه كيف نجمع ونستخدم ونحمي بياناتك عند استخدام منصتنا.",
      sections: [
        {
          title: "1. المعلومات التي نجمعها",
          content: [
            { subtitle: "المعلومات الشخصية", text: "عند إنشاء حساب أو المساهمة في منصتنا، قد نجمع:\n• الاسم واسم المستخدم\n• عنوان البريد الإلكتروني\n• كلمة المرور (مشفرة)\n• معلومات الملف الشخصي\n• السيرة الذاتية والمؤهلات (للمساهمين)\n• سجل المساهمات والإضافات" },
            { subtitle: "المعلومات التي تُجمع تلقائياً", text: "نجمع تلقائياً معلومات معينة عند زيارة منصتنا:\n• عنوان IP ونوع المتصفح\n• معلومات الجهاز\n• الصفحات التي تمت زيارتها والوقت المستغرق\n• الموقع الإلكتروني المرجع\n• ملفات تعريف الارتباط والتقنيات المماثلة" }
          ]
        },
        { title: "2. كيف نستخدم معلوماتك", content: [{ subtitle: "", text: "نستخدم المعلومات التي نجمعها لـ:\n• تقديم خدماتنا وصيانتها\n• إنشاء وإدارة حسابك\n• معالجة ومراجعة مساهماتك\n• التواصل معك حول التحديثات والتغييرات\n• تحسين منصتنا وتجربة المستخدم\n• ضمان الأمن ومنع الاحتيال\n• الامتثال للالتزامات القانونية" }] },
        { title: "3. أمان البيانات", content: [{ subtitle: "", text: "ننفذ تدابير تقنية وتنظيمية مناسبة لحماية معلوماتك الشخصية:\n• تشفير البيانات الحساسة\n• خوادم وقواعد بيانات آمنة\n• تدقيقات أمنية منتظمة\n• ضوابط الوصول والمصادقة\n• نسخ احتياطية منتظمة\n\nومع ذلك، لا توجد طريقة نقل عبر الإنترنت آمنة بنسبة 100٪، ولا يمكننا ضمان الأمان المطلق." }] },
        {
          title: "4. مشاركة البيانات والكشف عنها",
          content: [
            { subtitle: "نحن لا نبيع بياناتك", text: "نحن لا نبيع أو نتاجر أو نؤجر معلوماتك الشخصية لأطراف ثالثة." },
            { subtitle: "متى قد نشارك المعلومات", text: "قد نشارك معلوماتك في الظروف التالية:\n• بموافقتك\n• للامتثال للالتزامات القانونية\n• لحماية حقوقنا ومنع الاحتيال\n• مع مقدمي الخدمات الذين يساعدون في عملياتنا (بموجب اتفاقيات السرية)\n• فيما يتعلق بدمج أو استحواذ" }
          ]
        },
        { title: "5. حقوقك", content: [{ subtitle: "", text: "لديك الحقوق التالية فيما يتعلق ببياناتك الشخصية:\n• الوصول: طلب نسخة من بياناتك\n• التصحيح: طلب تصحيح البيانات غير الدقيقة\n• الحذف: طلب حذف بياناتك\n• النقل: طلب نقل بياناتك\n• الاعتراض: الاعتراض على معالجة بياناتك\n• سحب الموافقة: سحب الموافقة في أي وقت\n\nلممارسة هذه الحقوق، اتصل بنا على privacy@oulamauna.com" }] },
        { title: "6. ملفات تعريف الارتباط (Cookies)", content: [{ subtitle: "", text: "نستخدم ملفات تعريف الارتباط والتقنيات المماثلة لـ:\n• تذكر تفضيلاتك\n• فهم كيفية استخدامك لمنصتنا\n• تحسين تجربة المستخدم\n• تحليل حركة المرور وأنماط الاستخدام\n\nيمكنك التحكم في ملفات تعريف الارتباط من خلال إعدادات المتصفح. ومع ذلك، قد يؤثر تعطيل ملفات تعريف الارتباط على قدرتك على استخدام ميزات معينة من منصتنا." }] },
        { title: "7. الاحتفاظ بالبيانات", content: [{ subtitle: "", text: "نحتفظ بمعلوماتك الشخصية طالما كان ذلك ضرورياً لـ:\n• تقديم خدماتنا\n• الامتثال للالتزامات القانونية\n• حل النزاعات\n• تنفيذ اتفاقياتنا\n\nعندما لا نحتاج بعد إلى بياناتك، سنحذفها أو نجعلها مجهولة بشكل آمن." }] },
        { title: "8. نقل البيانات الدولية", content: [{ subtitle: "", text: "إذا كنت تصل إلى منصتنا من خارج الجزائر، فقد يتم نقل بياناتك ومعالجتها في الجزائر. نضمن وجود ضمانات مناسبة لحماية معلوماتك وفقاً لسياسة الخصوصية هذه." }] },
        { title: "9. خصوصية الأطفال", content: [{ subtitle: "", text: "منصتنا ليست مخصصة للأطفال دون سن 13 عاماً. نحن لا نجمع عمداً معلومات شخصية من الأطفال دون سن 13. إذا اكتشفنا أننا جمعنا بيانات من طفل دون سن 13، سنحذفها فوراً." }] },
        { title: "10. التغييرات على سياسة الخصوصية هذه", content: [{ subtitle: "", text: "قد نقوم بتحديث سياسة الخصوصية هذه من وقت لآخر. سنخطرك بأي تغييرات من خلال نشر سياسة الخصوصية الجديدة في هذه الصفحة وتحديث تاريخ 'آخر تحديث'. نشجعك على مراجعة سياسة الخصوصية هذه دورياً." }] },
        { title: "11. اتصل بنا", content: [{ subtitle: "", text: "إذا كانت لديك أي أسئلة أو مخاوف بشأن سياسة الخصوصية هذه أو ممارساتنا المتعلقة بالبيانات، يرجى الاتصال بنا على:\n\nالبريد الإلكتروني: privacy@oulamauna.com\nالعنوان: الجزائر العاصمة، الجزائر\n\nسنرد على استفسارك خلال 30 يوماً." }] }
      ],
      backToTop: "العودة للأعلى"
    },
    FR: {
      breadcrumb: { home: "ACCUEIL", current: "POLITIQUE DE CONFIDENTIALITÉ" },
      title: "Politique de Confidentialité",
      subtitle: "Dernière mise à jour: Janvier 2026",
      intro: "Chez Oulamauna, nous nous engageons à protéger votre vie privée et à assurer la sécurité de vos informations personnelles. Cette Politique de Confidentialité explique comment nous collectons, utilisons et protégeons vos données lorsque vous utilisez notre plateforme.",
      sections: [
        {
          title: "1. Informations que Nous Collectons",
          content: [
            { subtitle: "Informations Personnelles", text: "Lorsque vous créez un compte ou contribuez à notre plateforme, nous pouvons collecter:\n• Nom et nom d'utilisateur\n• Adresse e-mail\n• Mot de passe (crypté)\n• Informations de profil\n• Biographie et qualifications (pour les contributeurs)\n• Historique des soumissions et contributions" },
            { subtitle: "Informations Collectées Automatiquement", text: "Nous collectons automatiquement certaines informations lorsque vous visitez notre plateforme:\n• Adresse IP et type de navigateur\n• Informations sur l'appareil\n• Pages visitées et temps passé\n• Site web de référence\n• Cookies et technologies similaires" }
          ]
        },
        { title: "2. Comment Nous Utilisons Vos Informations", content: [{ subtitle: "", text: "Nous utilisons les informations que nous collectons pour:\n• Fournir et maintenir nos services\n• Créer et gérer votre compte\n• Traiter et examiner vos contributions\n• Communiquer avec vous sur les mises à jour et changements\n• Améliorer notre plateforme et l'expérience utilisateur\n• Assurer la sécurité et prévenir la fraude\n• Respecter les obligations légales" }] },
        { title: "3. Sécurité des Données", content: [{ subtitle: "", text: "Nous mettons en œuvre des mesures techniques et organisationnelles appropriées pour protéger vos informations personnelles:\n• Cryptage des données sensibles\n• Serveurs et bases de données sécurisés\n• Audits de sécurité réguliers\n• Contrôles d'accès et authentification\n• Sauvegardes régulières\n\nCependant, aucune méthode de transmission sur Internet n'est sûre à 100%, et nous ne pouvons garantir une sécurité absolue." }] },
        {
          title: "4. Partage et Divulgation des Données",
          content: [
            { subtitle: "Nous Ne Vendons Pas Vos Données", text: "Nous ne vendons, n'échangeons ni ne louons vos informations personnelles à des tiers." },
            { subtitle: "Quand Nous Pouvons Partager des Informations", text: "Nous pouvons partager vos informations dans les circonstances suivantes:\n• Avec votre consentement\n• Pour respecter les obligations légales\n• Pour protéger nos droits et prévenir la fraude\n• Avec des fournisseurs de services qui assistent dans nos opérations (sous accords de confidentialité)\n• Dans le cadre d'une fusion ou acquisition" }
          ]
        },
        { title: "5. Vos Droits", content: [{ subtitle: "", text: "Vous disposez des droits suivants concernant vos données personnelles:\n• Accès: Demander une copie de vos données\n• Correction: Demander la correction de données inexactes\n• Suppression: Demander la suppression de vos données\n• Portabilité: Demander le transfert de vos données\n• Opposition: Vous opposer au traitement de vos données\n• Retrait du consentement: Retirer le consentement à tout moment\n\nPour exercer ces droits, contactez-nous à privacy@oulamauna.com" }] },
        { title: "6. Cookies", content: [{ subtitle: "", text: "Nous utilisons des cookies et des technologies similaires pour:\n• Mémoriser vos préférences\n• Comprendre comment vous utilisez notre plateforme\n• Améliorer l'expérience utilisateur\n• Analyser le trafic et les modèles d'utilisation\n\nVous pouvez contrôler les cookies via les paramètres de votre navigateur. Cependant, désactiver les cookies peut affecter votre capacité à utiliser certaines fonctionnalités de notre plateforme." }] },
        { title: "7. Conservation des Données", content: [{ subtitle: "", text: "Nous conservons vos informations personnelles aussi longtemps que nécessaire pour:\n• Fournir nos services\n• Respecter les obligations légales\n• Résoudre les litiges\n• Appliquer nos accords\n\nLorsque nous n'avons plus besoin de vos données, nous les supprimerons ou les anonymiserons de manière sécurisée." }] },
        { title: "8. Transferts Internationaux de Données", content: [{ subtitle: "", text: "Si vous accédez à notre plateforme depuis l'extérieur de l'Algérie, vos données peuvent être transférées et traitées en Algérie. Nous veillons à ce que des garanties appropriées soient en place pour protéger vos informations conformément à cette Politique de Confidentialité." }] },
        { title: "9. Vie Privée des Enfants", content: [{ subtitle: "", text: "Notre plateforme n'est pas destinée aux enfants de moins de 13 ans. Nous ne collectons pas sciemment d'informations personnelles auprès d'enfants de moins de 13 ans. Si nous découvrons que nous avons collecté des données d'un enfant de moins de 13 ans, nous les supprimerons immédiatement." }] },
        { title: "10. Modifications de cette Politique de Confidentialité", content: [{ subtitle: "", text: "Nous pouvons mettre à jour cette Politique de Confidentialité de temps à autre. Nous vous informerons de tout changement en publiant la nouvelle Politique de Confidentialité sur cette page et en mettant à jour la date de 'Dernière mise à jour'. Nous vous encourageons à consulter cette Politique de Confidentialité périodiquement." }] },
        { title: "11. Nous Contacter", content: [{ subtitle: "", text: "Si vous avez des questions ou des préoccupations concernant cette Politique de Confidentialité ou nos pratiques en matière de données, veuillez nous contacter à:\n\nE-mail: privacy@oulamauna.com\nAdresse: Alger, Algérie\n\nNous répondrons à votre demande dans un délai de 30 jours." }] }
      ],
      backToTop: "Retour en haut"
    }
  };

  const t = translations[lang] || translations.EN;

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
          <BreadcrumbHomeLink label={t.breadcrumb.home} />
          <span style={{ color: "#1e4d3a66" }}>›</span>
          <span style={{ color: "#1e4d3a" }}>{t.breadcrumb.current}</span>
        </p>
        <h1 style={{
          fontFamily: headingFont, fontSize: "clamp(32px, 5vw, 48px)", fontWeight: 700, color: "#1e4d3a",
          margin: "0 0 18px 0", lineHeight: 1.15,
        }}>
          {t.title}
        </h1>
        {t.subtitle && (
          <p style={{
            fontFamily: monoFont, fontSize: "12px", color: "#1e4d3a99", margin: "8px 0 0 0"
          }}>
            {t.subtitle}
          </p>
        )}
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
              <h2 style={{ fontFamily: headingFont, fontSize: "24px", fontWeight: 700, color: "#1e4d3a", marginBottom: "24px" }}>
                {section.title}
              </h2>
              
              {Array.isArray(section.content) ? (
                section.content.map((contentItem: any, contentIndex: number) => (
                  <div key={contentIndex} style={{ marginBottom: "24px" }}>
                    {contentItem.subtitle && (
                      <h3 style={{ fontFamily: headingFont, fontSize: "18px", fontWeight: 700, color: "#1e4d3a", marginBottom: "12px" }}>
                        {contentItem.subtitle}
                      </h3>
                    )}
                    <div style={{ fontFamily: bodyFont, fontSize: "15px", color: "#1e4d3a99", lineHeight: 1.8, whiteSpace: "pre-line" }}>
                      {contentItem.text}
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ fontFamily: bodyFont, fontSize: "15px", color: "#1e4d3a99", lineHeight: 1.8, whiteSpace: "pre-line" }}>
                  {section.text}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Back to Top Button */}
        <div style={{ marginTop: "64px", textAlign: "center" }}>
          <BackToTopButton label={t.backToTop} fontFamily={headingFont} />
        </div>
      </div>
    </div>
  );
}

const BreadcrumbHomeLink: React.FC<{ label: string }> = ({ label }) => {
  const [hovered, setHovered] = useState(false);
  return (
    <Link to="/" onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{ color: hovered ? "#1e4d3a" : "#C9A84C", textDecoration: "none", transition: "color 0.2s ease" }}>
      {label}
    </Link>
  );
};

const BackToTopButton: React.FC<{ label: string; fontFamily: string }> = ({ label, fontFamily }) => {
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
        borderRadius: "8px", fontFamily: fontFamily, fontSize: "12px",
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