import React from "react";
import { Link } from "react-router-dom";
import { useLang } from "../../context/LanguageContext";

/* ------------------------------------------------------------------ */
/*  Design tokens — Oulamnauna admin palette                          */
/* ------------------------------------------------------------------ */
const colors = {
  creamLight: "#fcfaf5",
  forestGreen: "#0b4335",
};

const fonts = {
  headline: "'Hanken Grotesk', sans-serif",
  body: "'Inter', sans-serif",
};

/* ------------------------------------------------------------------ */
/*  Icon                                                                */
/* ------------------------------------------------------------------ */
const Icon: React.FC<{ name: string; size?: number }> = ({ name, size = 16 }) => (
  <span
    className="material-symbols-outlined"
    style={{ fontSize: size, lineHeight: 1, fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}
  >
    {name}
  </span>
);

/* ------------------------------------------------------------------ */
/*  Navbar                                                              */
/* ------------------------------------------------------------------ */
type AdminNavbarProps = {
  pageTitleKey: string;
  /** Extra page-specific button(s) shown to the right of "Add Scholar",
   *  e.g. an "Export" button on a report page. Optional. */
  actions?: React.ReactNode;
};

const AdminNavbar: React.FC<AdminNavbarProps> = ({ pageTitleKey, actions }) => {
  const { t, lang } = useLang();
  const isRTL = lang === "AR";

  return (
    <header
      dir={isRTL ? "rtl" : "ltr"}
      style={{
        width: "100%",
        flexShrink: 0,
        backgroundColor: "rgba(252, 250, 245, 0.9)",
        backdropFilter: "blur(8px)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "16px 24px",
        borderBottom: `1px solid ${colors.forestGreen}`,
        gap: 16,
      }}
    >
      <h1
        style={{
          fontFamily: fonts.headline,
          fontSize: 19,
          lineHeight: "24px",
          fontWeight: 600,
          color: colors.forestGreen,
          margin: 0,
          whiteSpace: "nowrap",
        }}
      >
        {t(pageTitleKey)}
      </h1>

      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ position: "relative" }}>
          <span
            style={{
              position: "absolute",
              [isRTL ? "right" : "left"]: 11,
              top: "50%",
              transform: "translateY(-50%)",
              color: colors.forestGreen,
              display: "flex",
            }}
          >
            <Icon name="search" size={15} />
          </span>
          <input
            type="text"
            placeholder={t("navbar.search")}
            style={{
              [isRTL ? "paddingRight" : "paddingLeft"]: 32,
              [isRTL ? "paddingLeft" : "paddingRight"]: 14,
              paddingTop: 7,
              paddingBottom: 7,
              borderRadius: 8,
              backgroundColor: colors.creamLight,
              border: `1px solid ${colors.forestGreen}`,
              fontFamily: fonts.body,
              fontSize: 13,
              color: colors.forestGreen,
              outline: "none",
              width: 210,
            }}
          />
        </div>

        {actions}

        <Link
          to="/admin/scholars/new"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "7px 14px",
            backgroundColor: colors.forestGreen,
            border: `1px solid ${colors.forestGreen}`,
            borderRadius: 8,
            fontFamily: fonts.body,
            fontSize: 13,
            fontWeight: 500,
            color: colors.creamLight,
            textDecoration: "none",
            whiteSpace: "nowrap",
            transition: "opacity 0.15s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
        >
          <Icon name="add" size={16} />
          {t("navbar.addScholar")}
        </Link>
      </div>
    </header>
  );
};

export default AdminNavbar;