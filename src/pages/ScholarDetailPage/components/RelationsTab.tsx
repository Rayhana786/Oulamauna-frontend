import React from "react";
import { MONO, SERIF } from "../constants";
import type { ScholarDetail, UITranslation } from "../types";
import { Icon } from "./Icon";

interface Props { scholar: ScholarDetail; t: UITranslation; }

export function RelationsTab({ scholar: s, t }: Props) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
        {([{ data: s.intellectualLineage, label: t.intellectualLineage, icon: "school", color: "#0b4335" }, { data: s.notableDisciples, label: t.notableDisciples, icon: "groups", color: "#735c00" }]).map(({ data, label, icon, color }) => (
          <div key={label} style={{ backgroundColor: "#f3f4f1", padding: "28px", borderRadius: "16px", border: "1px solid rgba(192,201,195,0.4)" }}>
            <h3 style={{ ...MONO, fontSize: "9px", color, letterSpacing: "0.15em", marginBottom: "24px", display: "flex", alignItems: "center", gap: "8px" }}><Icon name={icon} size={15} />{label}</h3>
            <div style={{ display: "flex", gap: "24px" }}>
              {data.map((p) => (
                <a key={p.name} href={p.profileUrl ?? "#"} className="person-card" style={{ display: "flex", alignItems: "center", gap: "12px", textDecoration: "none" }}>
                  <div style={{ width: "44px", height: "44px", borderRadius: "50%", backgroundColor: p.color, display: "flex", alignItems: "center", justifyContent: "center", color: p.textColor, fontSize: "13px", fontWeight: 700, flexShrink: 0 }}>{p.initials}</div>
                  <div>
                    <p className="person-name" style={{ fontSize: "13px", fontWeight: 700, color: "#191c1b", margin: "0 0 2px", transition: "color 0.15s" }}>{p.name}</p>
                    <p style={{ ...MONO, fontSize: "9px", color: "#c0c9c3", letterSpacing: "0.08em", margin: 0 }}>{p.role}</p>
                  </div>
                </a>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div>
        <h3 style={{ ...MONO, fontSize: "9px", color: "#707974", letterSpacing: "0.12em", marginBottom: "16px" }}>{t.relatedByField}</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "14px" }}>
          {s.relatedScholars.map((rs, i) => (
            <div key={i} className="card-hover" style={{ backgroundColor: "#fff", padding: "16px", borderRadius: "8px", border: "1.5px solid rgba(192,201,195,0.4)" }}>
              <p style={{ ...MONO, fontSize: "9px", color: rs.labelColor, letterSpacing: "0.08em", marginBottom: "6px" }}>{rs.label}</p>
              <p style={{ fontSize: "14px", fontWeight: 700, color: "#191c1b", marginBottom: "4px" }}>{rs.name}</p>
              <p style={{ fontSize: "12px", color: "#707974", fontStyle: "italic", margin: 0 }}>{rs.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}