import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useLang } from "../../context/LanguageContext";
import { adminApi } from "../../api/adminApi";

/* ------------------------------------------------------------------ */
/*  Design tokens — same as PendingEditReview                         */
/* ------------------------------------------------------------------ */
const colors = {
  creamLight: "#fcfaf5",
  creamMid: "#f6efdc",
  creamDark: "#e5d5a8",
  forestGreen: "#0b4335",
  amber: "#b8860b",
  red: "#8b2c2c",
};

const fonts = {
  headline: "'Hanken Grotesk', sans-serif",
  body: "'Inter', sans-serif",
  label: "'JetBrains Mono', monospace",
};

const cardStyle: React.CSSProperties = {
  backgroundColor: colors.creamLight,
  borderRadius: 12,
  boxShadow: "0px 4px 20px rgba(11, 67, 53, 0.08)",
  border: `1px solid ${colors.forestGreen}`,
};

// ASSUMPTION: languages your site supports. Adjust if wrong.
const ALL_LANGUAGES = ["EN", "AR", "FR"];

const Icon: React.FC<{ name: string; size?: number; filled?: boolean }> = ({
  name,
  size = 18,
  filled = false,
}) => (
  <span
    className="material-symbols-outlined"
    style={{
      fontSize: size,
      lineHeight: 1,
      fontVariationSettings: `'FILL' ${filled ? 1 : 0}, 'wght' 400, 'GRAD' 0, 'opsz' 24`,
    }}
  >
    {name}
  </span>
);

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
interface LangSummary {
  code: string;
  name: string;
  versionId: number;
  image: string | null;
}

interface ScholarSummary {
  scholarId: string;
  createdBy: string;
  createdAt: string;
  languages: LangSummary[];
}

const transformSummary = (item: any): ScholarSummary => ({
  scholarId: item.scholar_id.toString(),
  createdBy: item.users?.username || "Unknown",
  createdAt: item.created_at ? new Date(item.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "",
  languages: (item.scholar_versions || []).map((v: any) => ({
    code: (v.languages?.code || "EN").toUpperCase(),
    name: v.canonical_name || "Unknown",
    versionId: v.version_id,
    image: v.image_url || null,
  })),
});

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */
export default function AllScholarsAdmin() {
  const navigate = useNavigate();
  const { lang } = useLang();
  const isRTL = lang === "AR";

  const [scholars, setScholars] = useState<ScholarSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const response = await adminApi.scholars.getAllSummary();
        if (response.data?.success && response.data.data) {
          setScholars(response.data.data.map(transformSummary));
        }
      } catch (error) {
        console.error("Failed to fetch scholars:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return scholars;
    const q = search.toLowerCase();
    return scholars.filter((s) =>
      s.languages.some((l) => l.name.toLowerCase().includes(q))
    );
  }, [scholars, search]);

  if (isLoading) {
    return <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: colors.creamLight, color: colors.forestGreen }}><Icon name="hourglass_empty" size={32} /></div>;
  }

  return (
    <div dir={isRTL ? "rtl" : "ltr"} style={{ fontFamily: fonts.body, color: colors.forestGreen, backgroundColor: colors.creamLight, minHeight: "100vh", padding: 24 }}>
      <div style={{ maxWidth: 1400, margin: "0 auto" }}>

        <h1 style={{ fontFamily: fonts.headline, fontSize: 24, fontWeight: 700, color: colors.forestGreen, margin: "0 0 18px" }}>
          <Icon name="school" size={22} filled /> All Scholars
        </h1>

        <div style={{ ...cardStyle, padding: "10px 14px", marginBottom: 18, display: "flex", alignItems: "center", gap: 10 }}>
          <Icon name="search" size={18} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by canonical name (any language)..."
            style={{ flex: 1, border: "none", outline: "none", background: "transparent", fontFamily: fonts.body, fontSize: 13, color: colors.forestGreen }}
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {filtered.map((scholar) => {
            const headerLang = scholar.languages[0];

            return (
              <div key={scholar.scholarId} style={{ ...cardStyle, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, padding: 18 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{ width: 48, height: 48, borderRadius: "50%", overflow: "hidden", backgroundColor: colors.creamMid, border: `2px solid ${colors.forestGreen}`, flexShrink: 0 }}>
                    {headerLang?.image ? (
                      <img src={headerLang.image} alt={headerLang.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: colors.forestGreen }}><Icon name="account_circle" size={28} /></div>
                    )}
                  </div>
                  <div>
                    <span style={{ fontFamily: fonts.label, fontSize: 10, color: colors.forestGreen, opacity: 0.6 }}>ID: {scholar.scholarId} · added by {scholar.createdBy} · {scholar.createdAt}</span>

                    {/* ── LANGUAGES / CANONICAL NAMES — click to open full detail page ── */}
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 6 }}>
                      {ALL_LANGUAGES.map((code) => {
                        const found = scholar.languages.find((l) => l.code === code);
                        if (!found) {
                          return (
                            <span
                              key={code}
                              style={{
                                display: "inline-flex", alignItems: "center", gap: 5,
                                padding: "4px 10px", borderRadius: 6,
                                border: `1px dashed ${colors.creamDark}`,
                                fontFamily: fonts.label, fontSize: 11, fontWeight: 600,
                                color: colors.forestGreen, opacity: 0.4,
                              }}
                            >
                              {code} — missing
                            </span>
                          );
                        }
                        return (
                          <span
                            key={code}
                            onClick={() => navigate(`/admin/scholars/${scholar.scholarId}/${code.toLowerCase()}`)}
                            style={{
                              display: "inline-flex", alignItems: "center", gap: 5,
                              padding: "4px 10px", borderRadius: 6, cursor: "pointer",
                              border: `1px solid ${colors.forestGreen}`,
                              backgroundColor: "transparent",
                              color: colors.forestGreen,
                              fontFamily: fonts.body, fontSize: 12, fontWeight: 600,
                              transition: "all 0.15s",
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = colors.forestGreen; e.currentTarget.style.color = colors.creamLight; }}
                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = colors.forestGreen; }}
                          >
                            <span style={{ fontFamily: fonts.label, fontSize: 10, opacity: 0.8 }}>{code}:</span> {found.name}
                            <Icon name="arrow_forward" size={12} />
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {filtered.length === 0 && (
            <div style={{ ...cardStyle, padding: 40, textAlign: "center", color: colors.forestGreen, opacity: 0.6 }}>
              No scholars match your search.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}