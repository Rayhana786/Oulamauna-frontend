import React from "react";
import { MONO, SERIF } from "../constants";
import type { ScholarDetail, UITranslation } from "../types";
import { ProfileLink } from "./Icon";

interface Props { scholar: ScholarDetail; t: UITranslation; }

export function HistoryTab({ scholar: s, t }: Props) {
  return (
    <div style={{ display: "grid" }}>
      <div>
        <h3 style={{ ...MONO, fontSize: "9px", color: "#707974", letterSpacing: "0.12em", marginBottom: "16px" }}>{t.academicReferences}</h3>
        <ol style={{ paddingLeft: "20px", margin: 0, display: "flex", flexDirection: "column", gap: "16px" }}>
          {s.academicReferences.map((r, i) => (<li key={i} style={{ ...SERIF, fontSize: "13px", color: "#404945", lineHeight: 1.65 }}>{r.text}</li>))}
        </ol>
      </div>
      
    </div>
  );
}

export function RecentRevisions({ scholar: s, t }: Props) {
  return (
    <section style={{ marginTop: "80px", paddingTop: "40px", borderTop: "1px solid rgba(192,201,195,0.4)" }}>
      <h3 style={{ ...MONO, fontSize: "9px", color: "#707974", letterSpacing: "0.12em", marginBottom: "20px" }}>{t.recentRevisions}</h3>
      <div style={{ maxWidth: "800px", display: "flex", flexDirection: "column", gap: "12px" }}>
        {s.recentRevisions.map((r, i) => (
          <div key={i} style={{ display: "flex", gap: "16px", padding: "10px 0", borderBottom: "1px solid #f0f1ee" }}>
            <span style={{ ...MONO, fontSize: "10px", color: "#c0c9c3", minWidth: "80px" }}>{r.date}</span>
            <ProfileLink name={r.author} url={r.authorUrl ?? "#"} />
            <span style={{ fontSize: "12px", color: "#404945" }}>— {r.action}</span>
          </div>
        ))}
        <button className="action-link" style={{ marginTop: "8px", alignSelf: "flex-start" }}>{t.viewAllEdits}</button>
      </div>
    </section>
  );
}