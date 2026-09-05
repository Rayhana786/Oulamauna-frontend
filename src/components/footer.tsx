// src/components/Footer.tsx
import { Link } from "react-router-dom";
import { useLang } from "../context/LanguageContext";

export default function Footer() {
  const { lang } = useLang();
  const isRTL = lang === "AR";

  const footerContent = {
    EN: {
      tagline: "Dedicated to Islamic Scholarly Preservation",
      quickLinks: "Quick Links",
      about: "About Us",
      scholars: "Scholars",
      works: "Works & Manuscripts",
      disciplines: "Disciplines",
      resources: "Resources",
      forum: "Forum",
      faq: "FAQ",
      privacy: "Privacy Policy",
      contact: "Contact",
      address: "Algiers, Algeria",
      email: "contact@oulamauna.com",
      phone: "+213 (0) XX XX XX XX",
      copyright: "© 2026 Oulamauna. All rights reserved.",
      terms: "Terms of Use",
      privacyLink: "Privacy",
    },
    AR: {
      tagline: "مكرس للحفاظ على التراث العلمي الإسلامي",
      quickLinks: "روابط سريعة",
      about: "من نحن",
      scholars: "العلماء",
      works: "الأعمال والمخطوطات",
      disciplines: "التخصصات",
      resources: "الموارد",
      forum: "المنتدى",
      faq: "الأسئلة الشائعة",
      privacy: "سياسة الخصوصية",
      contact: "اتصل بنا",
      address: "الجزائر العاصمة، الجزائر",
      email: "contact@oulamauna.com",
      phone: "+213 (0) XX XX XX XX",
      copyright: "© 2026 علماؤنا. جميع الحقوق محفوظة.",
      terms: "شروط الاستخدام",
      privacyLink: "الخصوصية",
    },
    FR: {
      tagline: "Dédié à la Préservation du Patrimoine Savant Islamique",
      quickLinks: "Liens Rapides",
      about: "À Propos",
      scholars: "Savants",
      works: "Œuvres et Manuscrits",
      disciplines: "Disciplines",
      resources: "Ressources",
      forum: "Forum",
      faq: "FAQ",
      privacy: "Politique de Confidentialité",
      contact: "Contact",
      address: "Alger, Algérie",
      email: "contact@oulamauna.com",
      phone: "+213 (0) XX XX XX XX",
      copyright: "© 2026 Oulamauna. Tous droits réservés.",
      terms: "Conditions d'Utilisation",
      privacyLink: "Confidentialité",
    },
  };

  const t = footerContent[lang as keyof typeof footerContent] || footerContent.EN;

  // Real SVG Icons for Social Media
  const socialIcons = {
    facebook: (
      <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
      </svg>
    ),
    twitter: (
      <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
      </svg>
    ),
    instagram: (
      <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
      </svg>
    ),
    linkedin: (
      <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
      </svg>
    ),
  };

  return (
    // ✅ Added dir={isRTL ? "rtl" : "ltr"} for proper Arabic layout alignment
    <footer className="bg-[#F5F3EC] border-t border-[#1e4d3a]/10" dir={isRTL ? "rtl" : "ltr"}>
      <div className="max-w-[1280px] mx-auto px-[20px] md:px-[64px] py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          
          {/* Brand Section */}
          <div className="md:col-span-1">
            <h3 className="font-['Hanken_Grotesk'] text-3xl font-bold text-[#1e4d3a] mb-3">
              Oulamauna
            </h3>
            <p className="font-['Inter'] text-[14px] text-[#1e4d3a]/70 leading-relaxed mb-6">
              {t.tagline}
            </p>
            
            {/* Social Media Icons - Real SVGs */}
            <div className="flex gap-3">
              {[
                { name: 'facebook', label: 'Facebook' },
                { name: 'twitter', label: 'Twitter' },
                { name: 'instagram', label: 'Instagram' },
                { name: 'linkedin', label: 'LinkedIn' },
              ].map((social) => (
                <a
                  key={social.name}
                  href={`https://${social.name}.com/oulamauna`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-11 h-11 rounded-full bg-[#1e4d3a]/10 flex items-center justify-center hover:bg-[#1e4d3a] transition-all duration-300 group"
                  aria-label={social.label}
                >
                  <div className="text-[#1e4d3a] group-hover:text-[#fbf9f4] transition-colors duration-300">
                    {socialIcons[social.name as keyof typeof socialIcons]}
                  </div>
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-['Hanken_Grotesk'] text-xl font-bold text-[#1e4d3a] mb-6">
              {t.quickLinks}
            </h4>
            <ul className="space-y-3">
              {[
                { label: t.about, path: "/about" },
                { label: t.scholars, path: "/scholars" },
                { label: t.works, path: "/#works" },
                { label: t.disciplines, path: "/#disciplines" },
              ].map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.path}
                    className="font-['Inter'] text-[15px] text-[#1e4d3a]/70 hover:text-[#1e4d3a] transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="font-['Hanken_Grotesk'] text-xl font-bold text-[#1e4d3a] mb-6">
              {t.resources}
            </h4>
            <ul className="space-y-3">
              {[
                { label: t.forum, path: "/forum" },
                { label: t.faq, path: "/faq" },
                { label: t.privacy, path: "/privacy" },
              ].map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.path}
                    className="font-['Inter'] text-[15px] text-[#1e4d3a]/70 hover:text-[#1e4d3a] transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-['Hanken_Grotesk'] text-xl font-bold text-[#1e4d3a] mb-6">
              {t.contact}
            </h4>
            <ul className="space-y-4">
              <li className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[#1e4d3a] text-2xl">location_on</span>
                <span className="font-['Inter'] text-[15px] text-[#1e4d3a]/70">
                  {t.address}
                </span>
              </li>
              <li className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[#1e4d3a] text-2xl">mail</span>
                <a href={`mailto:${t.email}`} className="font-['Inter'] text-[15px] text-[#1e4d3a]/70 hover:text-[#1e4d3a] transition-colors">
                  {t.email}
                </a>
              </li>
              <li className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[#1e4d3a] text-2xl">phone</span>
                <span className="font-['Inter'] text-[15px] text-[#1e4d3a]/70">
                  {t.phone}
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-[#1e4d3a]/10">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="font-['Inter'] text-[13px] text-[#1e4d3a]/60">
              {t.copyright}
            </p>
            <div className="flex gap-6">
              <Link to="/terms" className="font-['Inter'] text-[13px] text-[#1e4d3a]/60 hover:text-[#1e4d3a] transition-colors">
                {t.terms}
              </Link>
              <Link to="/privacy" className="font-['Inter'] text-[13px] text-[#1e4d3a]/60 hover:text-[#1e4d3a] transition-colors">
                {t.privacyLink}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}