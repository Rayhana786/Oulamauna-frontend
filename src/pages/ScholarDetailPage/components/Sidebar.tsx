import React, { useState } from "react";
import { MONO, SERIF } from "../constants";
import type { ScholarDetail, UITranslation } from "../types";
import { Icon, ProfileLink, HoverBtn } from "./Icon";

interface Props { scholar: ScholarDetail; t: UITranslation; }

export function Sidebar({ scholar: s, t }: Props) {
  const [imgGray, setImgGray] = useState(true);
  const [open, setOpen] = useState(true);

  return (
    <div style={{ backgroundColor: "#fff", border: "1px solid rgba(192,201,195,0.4)", borderRadius: "12px", overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", position: "sticky", top: "140px" }}>
      <div style={{ position: "relative", aspectRatio: "3/4", overflow: "hidden" }}>
        <img alt="Scholar portrait" src={s.image} onMouseEnter={() => setImgGray(false)} onMouseLeave={() => setImgGray(true)}
          style={{ width: "100%", height: "100%", objectFit: "cover", filter: imgGray ? "grayscale(100%)" : "none", transition: "filter 0.6s ease", display: "block" }} />
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "16px", background: "linear-gradient(to top, rgba(0,0,0,0.65), transparent)" }}>
          <p style={{ ...MONO, fontSize: "9px", color: "#fff", letterSpacing: "0.18em", margin: 0, opacity: 0.9 }}>OFFICIAL SCHOLAR PORTRAIT</p>
        </div>
      </div>
      <div style={{ padding: "20px 20px 24px" }}>
        <p style={{ ...MONO, fontSize: "9px", color: "#0b4335", letterSpacing: "0.2em", marginBottom: "12px", borderBottom: "1px solid rgba(11,67,53,0.1)", paddingBottom: "8px" }}>{t.atAGlance}</p>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <tbody>
            {([[ t.fullName, s.atAGlance.fullName ], [ t.born, s.atAGlance.born ], [ t.died, s.atAGlance.died ], [ t.century, s.atAGlance.century ], [ t.region, s.atAGlance.region ], [ t.discipline, s.atAGlance.discipline ], [ t.expertise, s.atAGlance.expertise ]] as [string, string][]).map(([label, value]) => (
              <tr key={label} style={{ borderBottom: "1px solid #f0f1ee" }}>
                <td style={{ ...MONO, padding: "8px 0", fontSize: "10px", color: "#707974", verticalAlign: "top" }}>{label}</td>
                <td style={{ padding: "8px 0", fontSize: "11px", fontWeight: 700, textAlign: "right", color: "#191c1b", verticalAlign: "top", paddingLeft: "8px" }}>{value}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ marginTop: "20px", paddingTop: "16px", borderTop: "1px solid rgba(11,67,53,0.1)" }}>
          <button onClick={() => setOpen(!open)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
            <span style={{ ...MONO, fontSize: "9px", color: "#0b4335", letterSpacing: "0.2em", display: "flex", alignItems: "center", gap: "4px" }}>{t.allContributors}<Icon name="expand_more" size={14} /></span>
            <span style={{ ...MONO, fontSize: "9px", color: "#0b4335", fontWeight: 700, backgroundColor: "rgba(11,67,53,0.05)", padding: "2px 8px", borderRadius: "4px" }}>{s.contributors.length} {t.contributors}</span>
          </button>
          {open && (
            <div style={{ marginTop: "12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                <span style={{ ...MONO, fontSize: "9px", color: "#c0c9c3" }}>{t.contributor}</span>
                <span style={{ ...MONO, fontSize: "9px", color: "#c0c9c3" }}>{t.contributions}</span>
              </div>
              {s.contributors.map((c) => (
                <div key={c.name} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px solid #f0f1ee" }}>
                  <ProfileLink name={c.name} url={c.profileUrl ?? "#"} />
                  <span style={{ ...MONO, fontSize: "10px", color: "#0b4335", fontWeight: 700 }}>{c.contributions}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <HoverBtn style={{ width: "100%", justifyContent: "center", marginTop: "20px", padding: "10px 16px" }}>
          <Icon name="format_quote" size={15} />{t.citePage}
        </HoverBtn>
      </div>
    </div>
  );
}