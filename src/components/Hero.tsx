import React from "react";
import heroVideo from "../assets/hero3.mp4";
import { ArrowRight } from "lucide-react";
import { useLang } from "../context/LanguageContext";
import "../declarations.d.ts";

type Language = "EN" | "AR" | "FR";


interface ContentItem {
  title: string;
  arabic: string;
  desc: string;
  explore: string;
  more: string;
}

const Hero: React.FC = () => {
  const { lang } = useLang();
  const content: Record<Language, ContentItem> = {
    EN: {
      title: "Oulamauna",
      arabic: "عُـلَـمَـاؤُنَـا",
      desc: "Preserving the intellectual contributions of Algerian and Islamic scholars throughout history.",
      explore: "Explore",
      more: "Learn More"
    },
    AR: {
      title: "عُـلَـمَـاؤُنَـا",
      arabic: "Oulamauna",
      desc: ".الحفاظ على المساهمات الفكرية للعلماء الجزائريين والمسلمين عبر التاريخ",
      explore: "استكشف",
      more: "اقرأ المزيد"
    },
    FR: {
      title: "Oulamauna",
      arabic: "عُـلَـمَـاؤُنَـا",
      desc: "Préserver les contributions intellectuelles des savants algériens et islamiques à travers l'histoire.",
      explore: "Explorer",
      more: "En savoir plus"
    }
  };

  const t = content[lang] || content.EN;
  const isRTL = lang === "AR";

  return (
    <div className="relative w-full h-screen overflow-hidden flex flex-col">
      {/* VIDEO BACKGROUND */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute top-0 left-0 w-full h-full object-cover"
      >
        <source src={heroVideo} type="video/mp4" />
      </video>

      {/* OVERLAY */}
      <div className="absolute inset-0 bg-black/40"></div>

     
    </div>
  );
};

export default Hero;