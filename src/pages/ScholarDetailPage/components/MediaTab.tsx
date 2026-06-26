import React, { useState } from "react";
import { MONO, SERIF, BTN_PRIMARY } from "../constants";
import type { MediaItem, UITranslation, AccessMode } from "../types";
import { Icon, HoverBtn, SharedBanner } from "./Icon";
import { UploadZone } from "./UploadZone";

interface TabProps { media: MediaItem[]; t: UITranslation; onAdd: (m: MediaItem) => void; }
interface ModalProps { onClose: () => void; onAdd: (m: MediaItem) => void; }

function AddMediaModal({ onClose, onAdd }: ModalProps) {
  const [title, setTitle] = useState("");
  const [desc, setDesc]   = useState("");
  const [mode, setMode]   = useState<AccessMode>("none");
  const [linkUrl, setLink] = useState("");
  const [file, setFile]   = useState<File | null>(null);
  const [error, setError] = useState("");

  const inp: React.CSSProperties = { width: "100%", padding: "10px 14px", border: "1.5px solid rgba(192,201,195,0.6)", borderRadius: "8px", fontSize: "13px", color: "#191c1b", backgroundColor: "#fafbf8", fontFamily: "'Source Sans 3', sans-serif", outline: "none" };
  const lbl: React.CSSProperties = { ...MONO, fontSize: "9px", color: "#707974", letterSpacing: "0.12em", display: "block", marginBottom: "6px" };
  const tab = (a: boolean): React.CSSProperties => ({ flex: 1, padding: "9px 0", textAlign: "center" as const, ...MONO, fontSize: "10px", fontWeight: 700, border: "1.5px solid", borderColor: a ? "#0b4335" : "rgba(192,201,195,0.5)", backgroundColor: a ? "#0b4335" : "transparent", color: a ? "#fff" : "#707974", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" });

  const submit = () => {
    if (!title.trim()) { setError("Title is required."); return; }
    if (mode === "link" && !linkUrl.trim()) { setError("Please enter a URL."); return; }
    if (mode === "upload" && !file) { setError("Please upload a file."); return; }
    let type: MediaItem["type"] = "pdf", meta = "File", action = "OPEN DOCUMENT", actionIcon = "arrow_forward";
    let accessUrl: string | undefined, accessSource: MediaItem["accessSource"], accessFileName: string | undefined;
    if (mode === "upload" && file) {
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
      accessUrl = URL.createObjectURL(file); accessSource = "upload"; accessFileName = file.name;
      meta = `${(file.size / 1024 / 1024).toFixed(1)} MB`;
      if (["mp3","wav","ogg","m4a"].includes(ext)) { type = "audio"; action = "PLAY RECORDING"; actionIcon = "play_circle"; meta = `Audio • ${meta}`; }
      else if (["mp4","webm","avi","mov"].includes(ext)) { type = "video"; action = "WATCH NOW"; actionIcon = "open_in_new"; meta = `Video • ${meta}`; }
      else { meta = `PDF • ${meta}`; }
    } else if (mode === "link") {
      accessUrl = linkUrl.trim(); accessSource = "link";
      const ext = accessUrl.split(".").pop()?.toLowerCase() ?? "";
      if (["mp3","wav","ogg","m4a"].includes(ext)) { type = "audio"; action = "PLAY RECORDING"; actionIcon = "play_circle"; meta = "Audio"; }
      else if (["mp4","webm"].includes(ext) || accessUrl.includes("youtube") || accessUrl.includes("vimeo")) { type = "video"; action = "WATCH NOW"; actionIcon = "open_in_new"; meta = "Video"; }
      else { meta = "PDF"; }
    }
    onAdd({ type, title: title.trim(), description: desc.trim() || "No description.", meta, action, actionIcon, accessUrl, accessSource, accessFileName });
    onClose();
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, backgroundColor: "rgba(25,28,27,0.45)", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ backgroundColor: "#fff", borderRadius: "16px", padding: "36px", width: "520px", maxWidth: "calc(100vw - 32px)", boxShadow: "0 20px 60px rgba(0,0,0,0.18)", maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px" }}>
          <h2 style={{ ...SERIF, fontSize: "20px", fontWeight: 700, color: "#0b4335", margin: 0, display: "flex", alignItems: "center", gap: "10px" }}><Icon name="add_circle" size={20} />Add Media</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#707974" }}><Icon name="close" size={20} /></button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div><label style={lbl}>TITLE *</label><input type="text" value={title} onChange={(e) => { setTitle(e.target.value); setError(""); }} placeholder="e.g. 1972 Lecture on Colonizability" style={inp} onFocus={(e) => (e.currentTarget.style.borderColor = "#0b4335")} onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(192,201,195,0.6)")} /></div>
          <div><label style={lbl}>DESCRIPTION</label><textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={2} style={{ ...inp, resize: "vertical" }} onFocus={(e) => (e.currentTarget.style.borderColor = "#0b4335")} onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(192,201,195,0.6)")} /></div>
          <div>
            <label style={lbl}>FILE / LINK</label>
            <div style={{ display: "flex", borderRadius: "8px", overflow: "hidden", border: "1.5px solid rgba(192,201,195,0.5)", marginBottom: "16px" }}>
              <button style={tab(mode === "none")} onClick={() => { setMode("none"); setError(""); }}><Icon name="block" size={13} />None</button>
              <button style={{ ...tab(mode === "upload"), borderLeft: "1px solid rgba(192,201,195,0.5)", borderRight: "1px solid rgba(192,201,195,0.5)" }} onClick={() => { setMode("upload"); setError(""); }}><Icon name="upload_file" size={13} />Upload</button>
              <button style={tab(mode === "link")} onClick={() => { setMode("link"); setError(""); }}><Icon name="link" size={13} />Link</button>
            </div>
            {mode === "upload" && <UploadZone file={file} onFile={(f) => { setFile(f); setError(""); }} onRemove={() => setFile(null)} accept=".pdf,.mp3,.wav,.ogg,.m4a,.mp4,.webm,.avi,audio/*,video/*,application/pdf" hint="PDF, Audio, Video — up to 100 MB" />}
            {mode === "link" && <div style={{ position: "relative" }}><span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#c0c9c3", display: "flex" }}><Icon name="link" size={16} /></span><input type="url" value={linkUrl} onChange={(e) => { setLink(e.target.value); setError(""); }} placeholder="https://youtube.com/watch?v=…" style={{ ...inp, paddingLeft: "36px" }} onFocus={(e) => (e.currentTarget.style.borderColor = "#0b4335")} onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(192,201,195,0.6)")} /></div>}
            {mode === "none" && <p style={{ fontSize: "12px", color: "#c0c9c3", fontStyle: "italic", margin: 0 }}>No file will be attached.</p>}
          </div>
          {error && <p style={{ ...MONO, fontSize: "10px", color: "#b3261e", margin: 0, display: "flex", alignItems: "center", gap: "6px" }}><Icon name="error" size={13} />{error}</p>}
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "32px", paddingTop: "24px", borderTop: "1px solid rgba(192,201,195,0.3)" }}>
          <HoverBtn onClick={onClose} style={{ borderColor: "#c0c9c3", color: "#707974" }}>Cancel</HoverBtn>
          <button onClick={submit} style={{ ...BTN_PRIMARY, backgroundColor: "#0b4335", color: "#fff", padding: "8px 20px", fontSize: "11px" }} onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#285b4b")} onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#0b4335")}><Icon name="check" size={14} />ADD MEDIA</button>
        </div>
      </div>
    </div>
  );
}

export function MediaTab({ media, t, onAdd }: TabProps) {
  const [showModal, setShowModal] = useState(false);
  const iconName = (type: MediaItem["type"]) => ({ pdf: "article", audio: "mic", video: "movie" }[type]);
  return (
    <div>
      {showModal && <AddMediaModal onClose={() => setShowModal(false)} onAdd={onAdd} />}
      <SharedBanner t={t} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px" }}>
        <h2 style={{ ...SERIF, fontSize: "24px", fontWeight: 700, color: "#0b4335", margin: 0 }}>{t.mediaTitle}</h2>
        <HoverBtn onClick={() => setShowModal(true)}><Icon name="add_circle" size={14} />{t.addMedia}</HoverBtn>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "20px" }}>
        {media.map((m, i) => (
          <div key={i} className="card-hover" style={{ backgroundColor: "#fff", padding: "24px", border: "1.5px solid rgba(192,201,195,0.4)", borderRadius: "12px", display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
              <span className="material-symbols-outlined" style={{ fontSize: "32px", color: "#0b4335" }}>{iconName(m.type)}</span>
              <span style={{ ...MONO, fontSize: "9px", color: "#c0c9c3" }}>{m.meta}</span>
            </div>
            <p style={{ fontSize: "14px", fontWeight: 700, color: "#191c1b", margin: "0 0 8px" }}>{m.title}</p>
            <p style={{ fontSize: "12px", color: "#707974", lineHeight: 1.55, flex: 1, margin: "0 0 20px" }}>{m.description}</p>
            {m.accessUrl ? (<a href={m.accessUrl} target="_blank" rel="noopener noreferrer" download={m.accessSource === "upload" ? (m.accessFileName ?? true) : undefined} style={{ textDecoration: "none" }}><button className="action-link">{m.action} <Icon name={m.actionIcon} size={15} /></button></a>) : (<button className="action-link">{m.action} <Icon name={m.actionIcon} size={15} /></button>)}
          </div>
        ))}
      </div>
    </div>
  );
}