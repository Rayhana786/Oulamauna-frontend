import React, { useState } from "react";
import { MONO, SERIF, BTN_PRIMARY } from "../constants";
import type { Work, UITranslation, AccessMode } from "../types";
import { getAccessLabel, getAccessType } from "../utils";
import { Icon, HoverBtn, SharedBanner } from "./Icon";
import { UploadZone } from "./UploadZone";

interface TabProps { works: Work[]; t: UITranslation; onAdd: (w: Work) => void; }
interface ModalProps { onClose: () => void; onAdd: (w: Work) => void; }

function AddWorkModal({ onClose, onAdd }: ModalProps) {
  const [title, setTitle]   = useState("");
  const [year, setYear]     = useState("");
  const [format, setFormat] = useState<Work["format"]>("BOOK");
  const [mode, setMode]     = useState<AccessMode>("none");
  const [linkUrl, setLink]  = useState("");
  const [file, setFile]     = useState<File | null>(null);
  const [error, setError]   = useState("");

  const inp: React.CSSProperties = { width: "100%", padding: "10px 14px", border: "1.5px solid rgba(192,201,195,0.6)", borderRadius: "8px", fontSize: "13px", color: "#191c1b", backgroundColor: "#fafbf8", fontFamily: "'Source Sans 3', sans-serif", outline: "none" };
  const lbl: React.CSSProperties = { ...MONO, fontSize: "9px", color: "#707974", letterSpacing: "0.12em", display: "block", marginBottom: "6px" };
  const tab = (a: boolean): React.CSSProperties => ({ flex: 1, padding: "9px 0", textAlign: "center" as const, ...MONO, fontSize: "10px", fontWeight: 700, border: "1.5px solid", borderColor: a ? "#0b4335" : "rgba(192,201,195,0.5)", backgroundColor: a ? "#0b4335" : "transparent", color: a ? "#fff" : "#707974", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" });

  const submit = () => {
    if (!title.trim()) { setError("Title is required."); return; }
    const yr = parseInt(year, 10);
    if (!year || isNaN(yr) || yr < 600 || yr > new Date().getFullYear()) { setError("Please enter a valid year."); return; }
    if (mode === "link" && !linkUrl.trim()) { setError("Please enter a URL."); return; }
    if (mode === "upload" && !file) { setError("Please upload a file."); return; }
    let accessUrl: string | undefined, accessFileName: string | undefined, accessSource: Work["accessSource"], digitalAccess: Work["digitalAccess"] = null;
    if (mode === "link") { accessUrl = linkUrl.trim(); accessSource = "link"; const ext = accessUrl.split(".").pop()?.toLowerCase() ?? ""; digitalAccess = ["mp3","wav","ogg","m4a"].includes(ext) ? "audio" : "pdf"; }
    else if (mode === "upload" && file) { accessUrl = URL.createObjectURL(file); accessFileName = file.name; accessSource = "upload"; digitalAccess = getAccessType(file.name); }
    onAdd({ title: title.trim(), year: yr, format, digitalAccess, accessUrl, accessFileName, accessSource });
    onClose();
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, backgroundColor: "rgba(25,28,27,0.45)", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ backgroundColor: "#fff", borderRadius: "16px", padding: "36px", width: "520px", maxWidth: "calc(100vw - 32px)", boxShadow: "0 20px 60px rgba(0,0,0,0.18)", maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px" }}>
          <h2 style={{ ...SERIF, fontSize: "20px", fontWeight: 700, color: "#0b4335", margin: 0, display: "flex", alignItems: "center", gap: "10px" }}><Icon name="add_circle" size={20} />Add New Work</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#707974" }}><Icon name="close" size={20} /></button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div><label style={lbl}>TITLE *</label><input type="text" value={title} onChange={(e) => { setTitle(e.target.value); setError(""); }} placeholder="e.g. The Problem of Culture" style={inp} onFocus={(e) => (e.currentTarget.style.borderColor = "#0b4335")} onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(192,201,195,0.6)")} /></div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <div><label style={lbl}>YEAR *</label><input type="number" value={year} onChange={(e) => { setYear(e.target.value); setError(""); }} placeholder="e.g. 1959" style={inp} onFocus={(e) => (e.currentTarget.style.borderColor = "#0b4335")} onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(192,201,195,0.6)")} /></div>
            <div><label style={lbl}>FORMAT</label><select value={format} onChange={(e) => setFormat(e.target.value as Work["format"])} style={{ ...inp, cursor: "pointer" }} onFocus={(e) => (e.currentTarget.style.borderColor = "#0b4335")} onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(192,201,195,0.6)")}><option value="BOOK">Book</option><option value="MANUSCRIPT">Manuscript</option><option value="ARTICLE">Article</option></select></div>
          </div>
          <div>
            <label style={lbl}>DIGITAL ACCESS</label>
            <div style={{ display: "flex", borderRadius: "8px", overflow: "hidden", border: "1.5px solid rgba(192,201,195,0.5)", marginBottom: "16px" }}>
              <button style={tab(mode === "none")} onClick={() => { setMode("none"); setError(""); }}><Icon name="block" size={13} />None</button>
              <button style={{ ...tab(mode === "upload"), borderLeft: "1px solid rgba(192,201,195,0.5)", borderRight: "1px solid rgba(192,201,195,0.5)" }} onClick={() => { setMode("upload"); setError(""); }}><Icon name="upload_file" size={13} />Upload</button>
              <button style={tab(mode === "link")} onClick={() => { setMode("link"); setError(""); }}><Icon name="link" size={13} />Link</button>
            </div>
            {mode === "upload" && <UploadZone file={file} onFile={(f) => { setFile(f); setError(""); }} onRemove={() => setFile(null)} accept=".pdf,.mp3,.wav,.ogg,.m4a,.mp4,.webm,.epub,.doc,.docx,application/pdf,audio/*,video/*" hint="PDF, Audio, Video, ePub, Word — up to 50 MB" />}
            {mode === "link" && <div style={{ position: "relative" }}><span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#c0c9c3", display: "flex" }}><Icon name="link" size={16} /></span><input type="url" value={linkUrl} onChange={(e) => { setLink(e.target.value); setError(""); }} placeholder="https://archive.org/details/…" style={{ ...inp, paddingLeft: "36px" }} onFocus={(e) => (e.currentTarget.style.borderColor = "#0b4335")} onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(192,201,195,0.6)")} /></div>}
            {mode === "none" && <p style={{ fontSize: "12px", color: "#c0c9c3", fontStyle: "italic", margin: 0 }}>No digital file will be attached.</p>}
          </div>
          {error && <p style={{ ...MONO, fontSize: "10px", color: "#b3261e", margin: 0, display: "flex", alignItems: "center", gap: "6px" }}><Icon name="error" size={13} />{error}</p>}
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "32px", paddingTop: "24px", borderTop: "1px solid rgba(192,201,195,0.3)" }}>
          <HoverBtn onClick={onClose} style={{ borderColor: "#c0c9c3", color: "#707974" }}>Cancel</HoverBtn>
          <button onClick={submit} style={{ ...BTN_PRIMARY, backgroundColor: "#0b4335", color: "#fff", padding: "8px 20px", fontSize: "11px" }} onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#285b4b")} onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#0b4335")}><Icon name="check" size={14} />ADD WORK</button>
        </div>
      </div>
    </div>
  );
}

export function WorksTab({ works, t, onAdd }: TabProps) {
  const [showModal, setShowModal] = useState(false);
  return (
    <div>
      {showModal && <AddWorkModal onClose={() => setShowModal(false)} onAdd={onAdd} />}
      <SharedBanner t={t} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <h2 style={{ ...SERIF, fontSize: "24px", fontWeight: 700, color: "#0b4335", margin: 0 }}>{t.bibliographyTitle}</h2>
        <HoverBtn onClick={() => setShowModal(true)}><Icon name="add_circle" size={14} />{t.addWork}</HoverBtn>
      </div>
      <div style={{ border: "1px solid rgba(192,201,195,0.4)", borderRadius: "12px", overflow: "hidden", backgroundColor: "#fff" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr style={{ backgroundColor: "#f3f4f1", borderBottom: "1.5px solid rgba(192,201,195,0.4)" }}>{[t.colTitle, t.colYear, t.colFormat, t.colAccess].map((col) => (<th key={col} style={{ ...MONO, padding: "12px 16px", textAlign: "left", fontSize: "9px", color: "#707974", letterSpacing: "0.1em", fontWeight: 700 }}>{col}</th>))}</tr></thead>
          <tbody>
            {works.map((w, i) => {
              const { label, icon, color } = getAccessLabel(w);
              return (
                <tr key={i} className="row-hover" style={{ borderBottom: "1px solid #f0f1ee" }}>
                  <td style={{ ...SERIF, padding: "14px 16px", fontSize: "14px", fontWeight: 700, fontStyle: "italic", color: "#191c1b" }}>{w.title}</td>
                  <td style={{ padding: "14px 16px", fontSize: "13px", color: "#707974" }}>{w.year}</td>
                  <td style={{ padding: "14px 16px" }}><span style={{ ...MONO, fontSize: "9px", fontWeight: 700, padding: "3px 10px", borderRadius: "4px", backgroundColor: w.format === "BOOK" ? "rgba(11,67,53,0.08)" : "#f3f4f1", color: w.format === "BOOK" ? "#0b4335" : "#404945" }}>{w.format}</span></td>
                  <td style={{ padding: "14px 16px" }}>
                    {w.accessUrl ? (<a href={w.accessUrl} target="_blank" rel="noopener noreferrer" download={w.accessSource === "upload" ? (w.accessFileName ?? true) : undefined} style={{ textDecoration: "none" }}><HoverBtn style={{ fontSize: "9px", padding: "5px 12px", borderColor: color ?? "#0b4335", color: color ?? "#0b4335" }}>{icon && <Icon name={icon} size={12} />}{label}</HoverBtn></a>) : (<span style={{ fontSize: "13px", color: "#c0c9c3" }}>—</span>)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {works.length === 0 && <div style={{ padding: "48px 32px", textAlign: "center" }}><Icon name="menu_book" size={36} /><p style={{ color: "#707974", fontSize: "14px", marginTop: "12px" }}>No works added yet.</p><button className="action-link" onClick={() => setShowModal(true)} style={{ marginTop: "8px" }}>Add the first work →</button></div>}
      </div>
    </div>
  );
}