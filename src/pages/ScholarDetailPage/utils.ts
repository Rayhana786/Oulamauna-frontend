import type { Work } from "./types";

export function getFileIcon(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  if (["mp3", "wav", "ogg", "m4a"].includes(ext)) return "graphic_eq";
  if (["mp4", "webm", "avi", "mov"].includes(ext)) return "movie";
  if (["epub"].includes(ext)) return "menu_book";
  if (["doc", "docx"].includes(ext)) return "description";
  return "article";
}

export function getAccessType(filename: string): Work["digitalAccess"] {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  if (["mp3", "wav", "ogg", "m4a"].includes(ext)) return "audio";
  if (["mp4", "webm", "avi", "mov"].includes(ext)) return "file";
  return "pdf";
}

export function getAccessLabel(work: Work): { label: string; icon: string; color?: string } {
  if (!work.accessUrl) return { label: "—", icon: "" };
  const isUpload = work.accessSource === "upload";
  if (work.digitalAccess === "audio") return { label: isUpload ? "DOWNLOAD AUDIO" : "LISTEN AUDIO", icon: isUpload ? "download" : "play_circle", color: "#735c00" };
  if (work.digitalAccess === "file") return { label: "DOWNLOAD FILE", icon: "download", color: "#735c00" };
  return { label: isUpload ? "DOWNLOAD PDF" : "VIEW PDF", icon: isUpload ? "download" : "open_in_new" };
}