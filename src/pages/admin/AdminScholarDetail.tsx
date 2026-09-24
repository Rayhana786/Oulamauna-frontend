import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useLang } from "../../context/LanguageContext";
import { adminApi } from "../../api/adminApi";
import BiographyRenderer from "../../components/BiographyRenderer";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
interface WorkRow { 
  id: number; title: string; year: string; format: string; 
  access: string | null; accessSource: "upload" | "link"; fileName: string | null;
}
interface MediaRow { 
  id: number; title: string; meta: string; type: "Upload" | "Link"; 
  description: string; access: string | null; accessSource: "upload" | "link"; fileName: string | null;
}
interface ReferenceRow { id: number; title: string; citation: string; url: string | null; }
interface RelationshipRow { type: string; name: string; relatedScholarId: number | null; }

interface VersionDetail {
  scholarId: number; name: string; bio: string; image: string | null;
  region: string; century: string; aliases: string[]; birth: string; death: string;
  disciplines: string[]; works: WorkRow[]; media: MediaRow[]; references: ReferenceRow[];
  relationships: RelationshipRow[]; editor: string; createdAt: string; status?: string;
  languageName?: string;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */
const formatScholarDate = (d: any) => {
  if (!d) return "";
  return d.raw_text || (d.year ? `${d.year} ${d.calendar}`.trim() : "");
};

const getMediaIcon = (type: string) => type?.includes("video") ? "movie" : type?.includes("audio") ? "graphic_eq" : "article";

const getAccessType = (url: string | null | undefined): "pdf" | "audio" | "video" => {
  if (!url) return "pdf";
  const ext = url.split(".").pop()?.toLowerCase() ?? "";
  if (["mp3", "wav", "ogg", "m4a"].includes(ext)) return "audio";
  if (["mp4", "webm", "avi", "mov"].includes(ext)) return "video";
  return "pdf";
};

/* ------------------------------------------------------------------ */
/*  Unified File Actions (Dashboard Style)                             */
/* ------------------------------------------------------------------ */
function FileActions({ url, filename, mediaType, accessSource, t }: { url: string; filename: string; mediaType: "pdf" | "audio" | "video"; accessSource: "upload" | "link"; t: (key: string) => string; }) {
  const [isViewing, setIsViewing] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const contentType = mediaType === "video" ? "video/mp4" : mediaType === "audio" ? "audio/mpeg" : "application/pdf";

  const handleView = async (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (accessSource === "link") { window.open(url, "_blank"); return; }
    setIsViewing(true);
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(new Blob([blob], { type: contentType }));
      window.open(blobUrl, "_blank");
      setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
    } catch (err) { window.open(url, "_blank"); }
    finally { setIsViewing(false); }
  };

  const handleDownload = async (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (accessSource === "link") { window.open(url, "_blank"); return; }
    setIsDownloading(true);
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error('Network response was not ok');
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl; link.download = filename; 
      document.body.appendChild(link); link.click(); document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) { window.open(url, "_blank"); }
    finally { setIsDownloading(false); }
  };

  if (accessSource === "link") {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#1e4d3a]/5 text-[#1e4d3a] text-[11px] font-bold hover:bg-[#1e4d3a] hover:text-white transition-all cursor-pointer">
        <span className="material-symbols-outlined text-[14px]">open_in_new</span> {t("admin.scholarDetail.openLink")}
      </a>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <button onClick={handleView} disabled={isViewing} title={t("admin.scholarDetail.view")} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#1e4d3a]/5 text-[#1e4d3a] text-[11px] font-bold hover:bg-[#1e4d3a] hover:text-white transition-all cursor-pointer disabled:opacity-50">
        <span className="material-symbols-outlined text-[14px]">{isViewing ? "hourglass_empty" : "visibility"}</span> {t("admin.scholarDetail.view")}
      </button>
      <button onClick={handleDownload} disabled={isDownloading} title={t("admin.scholarDetail.download")} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#C9A84C]/10 text-[#8a6d3b] text-[11px] font-bold hover:bg-[#C9A84C] hover:text-white transition-all cursor-pointer disabled:opacity-50">
        <span className="material-symbols-outlined text-[14px]">{isDownloading ? "hourglass_empty" : "download"}</span> {t("admin.scholarDetail.download")}
      </button>
    </div>
  );
}

const transformDetail = (v: any, t: (key: string) => string): VersionDetail => {
  const century = `${v.century_gregorian_start || ""}-${v.century_gregorian_end || ""}`.replace(/^-+|-+$/g, "");
  const birth = formatScholarDate((v.scholar_dates || []).find((d: any) => d.date_type === "birth"));
  const death = formatScholarDate((v.scholar_dates || []).find((d: any) => d.date_type === "death"));

  return {
    scholarId: v.scholar_id, 
    name: v.canonical_name || t("admin.scholarDetail.unknown"), 
    bio: v.biography || "", 
    image: v.image_url || null,
    region: v.regions?.name || t("admin.scholarDetail.unknown"), 
    century: century || t("admin.scholarDetail.unknown"),
    aliases: (v.scholar_aliases || []).map((a: any) => a.alias_name),
    birth: birth || t("admin.scholarDetail.unknown"), 
    death: death || t("admin.scholarDetail.unknown"),
    disciplines: (v.scholar_disciplines || []).map((d: any) => d.disciplines?.name).filter(Boolean),
    status: v.status,
    languageName: v.languages?.name || v.languages?.code || t("admin.scholarDetail.unknown"),
    works: (v.scholar_works || []).map((w: any) => ({
      id: w.work_id, title: w.title, year: w.year?.toString() || "", format: w.format,
      access: w.media_url || w.file_path, accessSource: (w.source_type === "upload" ? "upload" : "link") as "upload" | "link", fileName: w.file_name || null,
    })),
    media: (v.media || []).map((m: any) => ({
      id: m.media_id, title: m.title || t("admin.scholarDetail.untitled"), meta: m.file_type || "file",
      type: (m.source_type === "upload" ? "Upload" : "Link") as "Upload" | "Link", description: m.description || "",
      access: m.media_url || m.file_path || m.external_url, accessSource: (m.source_type === "upload" ? "upload" : "link") as "upload" | "link", fileName: m.file_name || null,
    })),
    references: (v.scholar_references || []).map((r: any) => ({ id: r.reference_id, title: r.title, citation: r.citation, url: r.url })),
    relationships: (v.scholar_relationships_as_source || []).map((r: any) => ({
      type: r.relation_type, name: r.related_scholar_version?.canonical_name || t("admin.scholarDetail.unknown"), relatedScholarId: r.related_scholar_version?.scholar_id ?? null,
    })),
    editor: v.users?.username || t("admin.scholarDetail.unknown"),
    createdAt: v.created_at ? new Date(v.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "",
  };
};

/* ------------------------------------------------------------------ */
/*  Main Component (Dashboard Style)                                   */
/* ------------------------------------------------------------------ */
export default function AdminScholarDetail() {
  const { id: versionIdStr, lang: langParam } = useParams<{ id: string; lang: string }>();
  const versionId = Number(versionIdStr);
  
  const navigate = useNavigate();
  const { lang: siteLang, t } = useLang();
  const isRTL = siteLang === "AR";

  const [detail, setDetail] = useState<VersionDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDetail = async () => {
      if (!versionIdStr || !langParam) return;
      setIsLoading(true);
      setError(null);
      try {
        const response = await adminApi.scholars.getVersionDetail(versionId, langParam);
        if (response.data?.success && response.data.data) {
          setDetail(transformDetail(response.data.data, t));
        } else {
          setError(t("admin.scholarDetail.notFound"));
        }
      } catch (err) {
        console.error("Failed to fetch scholar version detail:", err);
        setError(t("admin.scholarDetail.failedToLoad"));
      } finally {
        setIsLoading(false);
      }
    };
    fetchDetail();
  }, [versionIdStr, langParam, versionId, t]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fbf9f4]">
        <span className="material-symbols-outlined text-[40px] text-[#1e4d3a]/40 animate-pulse">hourglass_empty</span>
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="oulamauna-dashboard min-h-screen flex items-center justify-center p-6" dir={isRTL ? "rtl" : "ltr"}>
        <div className="dashboard-card p-12 text-center max-w-md w-full">
          <span className="material-symbols-outlined text-[40px] text-[#e96d5c] mb-4">person_off</span>
          <h2 className="serif-title text-[20px] font-semibold text-[#082f27] mb-2">{error || t("admin.scholarDetail.notFound")}</h2>
          <p className="text-[13px] text-[#1e4d3a]/60 mb-6">{t("admin.scholarDetail.notFoundDesc")}</p>
          <button onClick={() => navigate("/admin/scholars")} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1e4d3a] text-white text-[12px] font-bold hover:bg-[#082f27] transition-colors cursor-pointer">
            <span className="material-symbols-outlined text-[16px]">{isRTL ? "arrow_forward" : "arrow_back"}</span>
            {t("admin.scholarDetail.backToAll")}
          </button>
        </div>
      </div>
    );
  }

  const statusColor = detail.status === "approved" ? "bg-[#1e4d3a]" : detail.status === "rejected" ? "bg-[#e96d5c]" : detail.status === "superseded" ? "bg-gray-400" : "bg-[#C9A84C]";
  const statusLabel = t(`dashboard.status.${detail.status}`) || detail.status?.toUpperCase();

  return (
    <div className="oulamauna-dashboard min-h-screen text-[#1e4d3a] antialiased font-['Inter']" dir={isRTL ? "rtl" : "ltr"}>
      <style>{`
        .oulamauna-dashboard { background: radial-gradient(circle at 8% 10%, rgba(201,168,76,0.055), transparent 24%), radial-gradient(circle at 92% 16%, rgba(79,145,132,0.06), transparent 25%), #fbf9f4; }
        .oulamauna-dashboard .dashboard-card { background: rgba(251,249,244,0.96); border: 1px solid rgba(30,77,58,0.10); border-radius: 10px; box-shadow: 0 5px 18px rgba(30,77,58,0.055); transition: all 180ms ease; }
        .oulamauna-dashboard .serif-title { font-family: 'Source Serif 4', Georgia, serif; letter-spacing: -0.025em; }
        .oulamauna-dashboard .mono-label { font-family: 'JetBrains Mono', monospace; letter-spacing: 0.06em; }
      `}</style>

      <main className="max-w-[1100px] mx-auto px-3 md:px-5 xl:px-7 py-6 md:py-8">
        
        {/* Back Button */}
        <button onClick={() => navigate("/admin/scholars")} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1e4d3a]/5 text-[#1e4d3a] border border-[#1e4d3a]/10 hover:bg-[#1e4d3a] hover:text-white transition-all cursor-pointer mb-6">
          <span className="material-symbols-outlined text-[18px]">{isRTL ? "arrow_forward" : "arrow_back"}</span>
          <span className="text-[12px] font-bold uppercase tracking-wide">{t("admin.scholarDetail.backToAll")}</span>
        </button>

        {/* ── HEADER: image + core facts ── */}
        <div className="dashboard-card p-5 md:p-6 mb-6 flex flex-col md:flex-row gap-6">
          <div className="w-32 h-32 md:w-36 md:h-36 rounded-xl overflow-hidden bg-[#f6efdc] border-2 border-[#1e4d3a]/20 flex-shrink-0 flex items-center justify-center">
            {detail.image ? (
              <img src={detail.image} alt={detail.name} className="w-full h-full object-cover" />
            ) : (
              <span className="material-symbols-outlined text-[48px] text-[#1e4d3a]/30">account_circle</span>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-3 mb-3">
              <h1 className="serif-title text-[24px] md:text-[28px] font-semibold text-[#082f27] truncate">{detail.name}</h1>
              <span className="px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider text-white bg-[#1e4d3a]">
                {detail.languageName || langParam?.toUpperCase()}
              </span>
              {detail.status && (
                <span className={`px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider text-white ${statusColor}`}>
                  {statusLabel}
                </span>
              )}
            </div>

            <div className="flex flex-wrap gap-4 mb-5 mono-label text-[10px] text-[#1e4d3a]/60">
              <span className="flex items-center gap-1.5"><span className="material-symbols-outlined text-[14px]">person</span> {t("admin.scholarDetail.editor")}: <strong className="text-[#1e4d3a]">{detail.editor}</strong></span>
              <span className="flex items-center gap-1.5"><span className="material-symbols-outlined text-[14px]">calendar_today</span> {detail.createdAt}</span>
              <span className="flex items-center gap-1.5"><span className="material-symbols-outlined text-[14px]">fingerprint</span> {t("admin.scholarDetail.scholarId")}: {detail.scholarId}</span>
              <span className="flex items-center gap-1.5"><span className="material-symbols-outlined text-[14px]">tag</span> {t("admin.scholarDetail.versionId")}: {versionId}</span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div>
                <p className="mono-label text-[9px] uppercase font-bold text-[#1e4d3a]/50 mb-1">{t("admin.scholarDetail.born")}</p>
                <p className="text-[13px] font-semibold text-[#082f27]">{detail.birth}</p>
              </div>
              <div>
                <p className="mono-label text-[9px] uppercase font-bold text-[#1e4d3a]/50 mb-1">{t("admin.scholarDetail.died")}</p>
                <p className="text-[13px] font-semibold text-[#082f27]">{detail.death}</p>
              </div>
              <div>
                <p className="mono-label text-[9px] uppercase font-bold text-[#1e4d3a]/50 mb-1">{t("admin.scholarDetail.century")}</p>
                <p className="text-[13px] font-semibold text-[#082f27]">{detail.century}</p>
              </div>
              {detail.region && detail.region !== t("admin.scholarDetail.unknown") && (
                <div>
                  <p className="mono-label text-[9px] uppercase font-bold text-[#1e4d3a]/50 mb-1">{t("admin.scholarDetail.region")}</p>
                  <p className="text-[13px] font-semibold text-[#082f27]">{detail.region}</p>
                </div>
              )}
            </div>

            {detail.aliases.length > 0 && (
              <div className="mb-4">
                <p className="mono-label text-[9px] uppercase font-bold text-[#1e4d3a]/50 mb-1.5">{t("admin.scholarDetail.aliases")}</p>
                <p className="text-[13px] text-[#1e4d3a]/80">{detail.aliases.join(", ")}</p>
              </div>
            )}

            {detail.disciplines.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {detail.disciplines.map((d) => (
                  <span key={d} className="px-3 py-1 rounded-full bg-[#1e4d3a]/5 border border-[#1e4d3a]/10 text-[11px] font-bold text-[#1e4d3a]">
                    {d}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── BIOGRAPHY ── */}
        {detail.bio && (
          <div className="dashboard-card p-5 md:p-6 mb-6">
            <h2 className="serif-title text-[18px] font-semibold text-[#082f27] mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px]">menu_book</span> {t("admin.scholarDetail.biography")}
            </h2>
            <div className="text-[14px] text-[#1e4d3a]/80 leading-relaxed">
              <BiographyRenderer content={detail.bio} lang={langParam} />
            </div>
          </div>
        )}

        {/* ── RELATIONSHIPS ── */}
        {detail.relationships.length > 0 && (
          <div className="dashboard-card p-5 md:p-6 mb-6">
            <h2 className="serif-title text-[18px] font-semibold text-[#082f27] mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px]">hub</span> {t("admin.scholarDetail.relationships")} ({detail.relationships.length})
            </h2>
            <div className="flex flex-wrap gap-2">
              {detail.relationships.map((r, i) => (
                <span key={i} onClick={() => r.relatedScholarId && navigate(`/admin/scholars/${r.relatedScholarId}/${langParam}`)}
                  className="px-3 py-1.5 rounded-lg bg-[#1e4d3a]/5 border border-[#1e4d3a]/10 text-[12px] font-semibold text-[#1e4d3a] cursor-pointer hover:bg-[#1e4d3a] hover:text-white transition-colors">
                  {r.type}: <strong>{r.name}</strong>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* ── WORKS ── */}
        {detail.works.length > 0 && (
          <div className="dashboard-card p-5 md:p-6 mb-6">
            <h2 className="serif-title text-[18px] font-semibold text-[#082f27] mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px]">library_books</span> {t("admin.scholarDetail.works")} ({detail.works.length})
            </h2>
            <div className="overflow-x-auto rounded-lg border border-[#1e4d3a]/10">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-[#1e4d3a]/[0.03]">
                    <th className="mono-label text-[10px] uppercase font-bold text-[#1e4d3a]/60 text-left p-3 border-b border-[#1e4d3a]/10">{t("admin.scholarDetail.title")}</th>
                    <th className="mono-label text-[10px] uppercase font-bold text-[#1e4d3a]/60 text-left p-3 border-b border-[#1e4d3a]/10">{t("admin.scholarDetail.year")}</th>
                    <th className="mono-label text-[10px] uppercase font-bold text-[#1e4d3a]/60 text-left p-3 border-b border-[#1e4d3a]/10">{t("admin.scholarDetail.format")}</th>
                    <th className="mono-label text-[10px] uppercase font-bold text-[#1e4d3a]/60 text-left p-3 border-b border-[#1e4d3a]/10">{t("admin.scholarDetail.access")}</th>
                  </tr>
                </thead>
                <tbody>
                  {detail.works.map((w) => (
                    <tr key={w.id} className="hover:bg-[#1e4d3a]/[0.02] transition-colors">
                      <td className="text-[13px] font-semibold text-[#082f27] p-3 border-b border-[#1e4d3a]/5 italic">{w.title}</td>
                      <td className="text-[13px] text-[#1e4d3a] p-3 border-b border-[#1e4d3a]/5">{w.year}</td>
                      <td className="p-3 border-b border-[#1e4d3a]/5">
                        <span className="mono-label text-[9px] font-bold px-2 py-1 rounded bg-[#C9A84C]/10 text-[#8a6d3b]">{w.format}</span>
                      </td>
                      <td className="p-3 border-b border-[#1e4d3a]/5">
                        {w.access ? (
                          <FileActions url={w.access} filename={w.fileName || w.title || "work"} mediaType={getAccessType(w.access)} accessSource={w.accessSource} t={t} />
                        ) : <span className="text-[#1e4d3a]/30">—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── MEDIA ── */}
        {detail.media.length > 0 && (
          <div className="dashboard-card p-5 md:p-6 mb-6">
            <h2 className="serif-title text-[18px] font-semibold text-[#082f27] mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px]">folder_open</span> {t("admin.scholarDetail.media")} ({detail.media.length})
            </h2>
            <div className="space-y-3">
              {detail.media.map((m) => {
                const downloadName = m.fileName || (m.access ? m.access.split('/').pop()?.split('?')[0] || "file.pdf" : "file.pdf");
                return (
                  <div key={m.id} className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-lg bg-white border border-[#1e4d3a]/10">
                    <div className="w-10 h-10 rounded-lg bg-[#f6efdc] flex items-center justify-center flex-shrink-0">
                      <span className="material-symbols-outlined text-[#1e4d3a] text-[20px]">{getMediaIcon(m.meta)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-semibold text-[#082f27] truncate">{m.title}</p>
                      <p className="mono-label text-[10px] text-[#1e4d3a]/60 mt-0.5">{m.meta} · {m.type}{m.description ? ` · ${m.description}` : ""}</p>
                    </div>
                    {m.access && (
                      <div className="flex-shrink-0">
                        {m.type === "Upload" ? (
                          <div className="flex items-center gap-2">
                            <button onClick={async (e) => {
                                e.preventDefault(); e.stopPropagation();
                                try {
                                  const response = await fetch(m.access!);
                                  const blob = await response.blob();
                                  const typedBlob = new Blob([blob], { type: m.meta?.includes("video") ? "video/mp4" : m.meta?.includes("audio") ? "audio/mpeg" : "application/pdf" });
                                  const blobUrl = URL.createObjectURL(typedBlob);
                                  window.open(blobUrl, "_blank");
                                  setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
                                } catch (err) { window.open(m.access, "_blank"); }
                              }}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#1e4d3a]/5 text-[#1e4d3a] text-[11px] font-bold hover:bg-[#1e4d3a] hover:text-white transition-all cursor-pointer">
                              <span className="material-symbols-outlined text-[14px]">visibility</span> {t("admin.scholarDetail.view")}
                            </button>
                            <button onClick={async (e) => {
                                e.preventDefault(); e.stopPropagation();
                                try {
                                  const response = await fetch(m.access!);
                                  if (!response.ok) throw new Error('Network response was not ok');
                                  const blob = await response.blob();
                                  const blobUrl = window.URL.createObjectURL(blob);
                                  const link = document.createElement("a");
                                  link.href = blobUrl; link.download = downloadName;
                                  document.body.appendChild(link); link.click(); document.body.removeChild(link);
                                  window.URL.revokeObjectURL(blobUrl);
                                } catch (err) { window.open(m.access, "_blank"); }
                              }}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#C9A84C]/10 text-[#8a6d3b] text-[11px] font-bold hover:bg-[#C9A84C] hover:text-white transition-all cursor-pointer">
                              <span className="material-symbols-outlined text-[14px]">download</span> {t("admin.scholarDetail.download")}
                            </button>
                          </div>
                        ) : (
                          <a href={m.access} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#1e4d3a] text-white text-[11px] font-bold hover:bg-[#082f27] transition-all cursor-pointer">
                            {t("admin.scholarDetail.openLink")} <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── REFERENCES ── */}
        {detail.references.length > 0 && (
          <div className="dashboard-card p-5 md:p-6 mb-6">
            <h2 className="serif-title text-[18px] font-semibold text-[#082f27] mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px]">link</span> {t("admin.scholarDetail.references")} ({detail.references.length})
            </h2>
            <div className="overflow-x-auto rounded-lg border border-[#1e4d3a]/10">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-[#1e4d3a]/[0.03]">
                    <th className="mono-label text-[10px] uppercase font-bold text-[#1e4d3a]/60 text-left p-3 border-b border-[#1e4d3a]/10">{t("admin.scholarDetail.title")}</th>
                    <th className="mono-label text-[10px] uppercase font-bold text-[#1e4d3a]/60 text-left p-3 border-b border-[#1e4d3a]/10">{t("admin.scholarDetail.citation")}</th>
                    <th className="mono-label text-[10px] uppercase font-bold text-[#1e4d3a]/60 text-left p-3 border-b border-[#1e4d3a]/10">{t("admin.scholarDetail.url")}</th>
                  </tr>
                </thead>
                <tbody>
                  {detail.references.map((r) => (
                    <tr key={r.id} className="hover:bg-[#1e4d3a]/[0.02] transition-colors">
                      <td className="text-[13px] font-semibold text-[#082f27] p-3 border-b border-[#1e4d3a]/5 italic">{r.title}</td>
                      <td className="text-[13px] text-[#1e4d3a] p-3 border-b border-[#1e4d3a]/5">{r.citation}</td>
                      <td className="p-3 border-b border-[#1e4d3a]/5">
                        {r.url ? (
                          <a href={r.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 mono-label text-[10px] font-bold text-[#1e4d3a] hover:text-[#C9A84C] transition-colors">
                            <span className="material-symbols-outlined text-[14px]">open_in_new</span> {t("admin.scholarDetail.view")}
                          </a>
                        ) : <span className="text-[#1e4d3a]/30">—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}