import React from "react";
import DOMPurify from 'dompurify';

interface BiographyRendererProps {
  content: string;
  lang?: string;
}

const GREEN = "#1e4d3a";
const GREEN_DARK = "#285b4b";
const GOLD = "#C9A84C";
const BORDER = "rgba(192,201,195,0.5)";

const SERIF = "'Source Serif 4', 'Georgia', serif";
const SANS = "'Inter', system-ui, sans-serif";

const BiographyRenderer = ({
  content,
  lang = "en",
}: BiographyRendererProps) => {
  const direction = lang.toLowerCase() === "ar" ? "rtl" : "ltr";

  if (!content || !content.trim()) {
    return null;
  }

  // Sanitize the HTML
  const cleanHTML = DOMPurify.sanitize(content, {
    USE_PROFILES: { html: true },
  });

  return (
    <>
      {/* ✅ Style tag is now a SIBLING, not a child */}
      <style>{`
        .scholar-biography {
          font-family: ${SANS};
          font-size: 15px;
          line-height: 1.85;
          color: #191c1b;
          word-break: break-word;
          white-space: normal;
        }

        .scholar-biography p {
          margin: 0 0 14px 0;
        }

        .scholar-biography h1 {
          font-family: ${SERIF};
          font-size: 32px;
          line-height: 1.3;
          color: ${GREEN};
          margin: 28px 0 14px 0;
          font-weight: 700;
        }

        .scholar-biography h2 {
          font-family: ${SERIF};
          font-size: 25px;
          line-height: 1.35;
          color: ${GREEN};
          margin: 24px 0 12px 0;
          font-weight: 700;
        }

        .scholar-biography h3 {
          font-family: ${SERIF};
          font-size: 20px;
          line-height: 1.4;
          color: ${GREEN_DARK};
          margin: 20px 0 10px 0;
          font-weight: 700;
        }

        .scholar-biography strong {
          font-weight: 700;
        }

        .scholar-biography em {
          font-style: italic;
        }

        .scholar-biography u {
          text-decoration: underline;
          text-underline-offset: 2px;
        }

        .scholar-biography s {
          text-decoration: line-through;
        }

        .scholar-biography sup {
          font-size: 0.75em;
          vertical-align: super;
          color: ${GREEN};
          font-weight: 600;
        }

        .scholar-biography ul {
          list-style-type: disc !important;
          padding-inline-start: 32px !important;
          margin: 10px 0 16px 0;
        }

        .scholar-biography ol {
          list-style-type: decimal !important;
          padding-inline-start: 32px !important;
          margin: 10px 0 16px 0;
        }

        .scholar-biography li {
          display: list-item !important;
          margin: 4px 0;
        }

        .scholar-biography ul > li {
          list-style-type: disc !important;
        }

        .scholar-biography ol > li {
          list-style-type: decimal !important;
        }

        .scholar-biography li > p {
          margin: 0;
        }

        .scholar-biography li::marker {
          font-weight: 600;
          color: ${GREEN};
        }

        .scholar-biography blockquote {
  box-sizing: border-box;
  overflow: hidden;
  border-left: 4px solid ${GOLD};
  margin: 18px 0;
  padding: 12px 18px;
  background: rgba(201, 168, 76, 0.1);
  color: #404945;
  font-family: ${SERIF};
  font-style: italic;
  border-radius: 0 8px 8px 0;
}

        .scholar-biography[dir="rtl"] blockquote {
          border-left: none;
          border-right: 4px solid ${GOLD};
          border-radius: 8px 0 0 8px;
          padding-left: 0;
          padding-right: 18px;
        }

        .scholar-biography hr {
          border: none;
          border-top: 2px dashed ${BORDER};
          margin: 28px 0;
        }

        .scholar-biography a {
          color: ${GREEN};
          text-decoration: underline;
          text-decoration-thickness: 2px;
          text-underline-offset: 3px;
          cursor: pointer;
          font-weight: 600;
          transition: color 0.15s ease;
        }

        .scholar-biography a:hover {
          color: ${GOLD};
        }

        .scholar-biography mark {
          padding: 0 2px;
          border-radius: 2px;
          background: rgba(201, 168, 76, 0.3);
        }

        .scholar-biography [style*="text-align: left"] {
          text-align: left !important;
        }

        .scholar-biography [style*="text-align: center"] {
          text-align: center !important;
        }

        .scholar-biography [style*="text-align: right"] {
          text-align: right !important;
        }

        .scholar-biography [style*="text-align: justify"] {
          text-align: justify !important;
        }

        .scholar-biography [style*="direction: rtl"] {
          direction: rtl !important;
          text-align: right;
        }

        .scholar-biography [style*="direction: ltr"] {
          direction: ltr !important;
        }

        .scholar-biography img {
          max-width: 100%;
          height: auto;
          display: block;
          margin: 16px auto;
          border-radius: 8px;
        }

        .scholar-biography table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
        }

        .scholar-biography th,
        .scholar-biography td {
          border: 1px solid ${BORDER};
          padding: 8px 10px;
          text-align: left;
        }

        .scholar-biography[dir="rtl"] th,
        .scholar-biography[dir="rtl"] td {
          text-align: right;
        }
      `}</style>

      {/* ✅ Div is now self-closing with ONLY dangerouslySetInnerHTML */}
      <div
        className="scholar-biography"
        dir={direction}
        dangerouslySetInnerHTML={{ __html: cleanHTML }}
      />
    </>
  );
};

export default BiographyRenderer;