import React, { useRef, useState } from "react";
import { MONO } from "../constants";
import { getFileIcon } from "../utils";
import { Icon } from "./Icon";

interface Props { file: File | null; onFile: (f: File) => void; onRemove: () => void; accept?: string; hint?: string; }

export function UploadZone({ file, onFile, onRemove, accept, hint }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  if (file) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", backgroundColor: "rgba(11,67,53,0.05)", border: "1.5px solid rgba(11,67,53,0.2)", borderRadius: "8px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
        <Icon name={getFileIcon(file.name)} size={20} />
        <span style={{ fontSize: "13px", color: "#191c1b", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{file.name}</span>
        <span style={{ ...MONO, fontSize: "9px", color: "#707974", whiteSpace: "nowrap" }}>{(file.size / 1024 / 1024).toFixed(1)} MB</span>
      </div>
      <button onClick={onRemove} style={{ background: "none", border: "none", cursor: "pointer", color: "#707974", flexShrink: 0, display: "flex", alignItems: "center" }}><Icon name="close" size={16} /></button>
    </div>
  );

  return (
    <>
      <input ref={inputRef} type="file" accept={accept} style={{ display: "none" }} onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); }} />
      <div onClick={() => inputRef.current?.click()} onDragOver={(e) => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files?.[0]; if (f) onFile(f); }}
        style={{ border: `2px dashed ${dragOver ? "#0b4335" : "rgba(192,201,195,0.7)"}`, borderRadius: "10px", padding: "28px 20px", textAlign: "center", cursor: "pointer", backgroundColor: dragOver ? "rgba(11,67,53,0.04)" : "#fafbf8", transition: "all 0.15s" }}>
        <Icon name="cloud_upload" size={32} />
        <p style={{ fontSize: "13px", color: "#404945", margin: "10px 0 4px", fontWeight: 600 }}>Drop a file here, or <span style={{ color: "#0b4335", textDecoration: "underline" }}>browse</span></p>
        <p style={{ ...MONO, fontSize: "9px", color: "#c0c9c3", margin: 0 }}>{hint ?? "PDF, Audio, Video, ePub, Word — up to 50 MB"}</p>
      </div>
    </>
  );
}