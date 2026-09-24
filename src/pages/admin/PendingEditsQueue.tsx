import React, { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useLang } from "../../context/LanguageContext";
import { adminApi } from "../../api/adminApi";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
interface ScholarSubmission {
  id: string;
  name: string;
  languageCode: string; // ✅ Dynamic string instead of hardcoded enum
  editor: string;
  editorId: number | null;
  originalContributor: string;
  date: string;
  discipline: string;
  submittedAt: Date;
}

interface BackendEditedVersion {
  proposed: {
    version_id: number;
    canonical_name: string;
    created_at: string;
    created_by: number | null;
    users?: { id: number; username: string; email: string } | null;
    languages?: { code: string; name: string } | null;
    scholar_disciplines?: Array<{ disciplines?: { name: string } }>;
  };
  current: {
    users?: { username: string } | null;
  } | null;
}

/* ------------------------------------------------------------------ */
/*  Helper: Transform Backend Data                                     */
/* ------------------------------------------------------------------ */
const transformEditedVersions = (edits: BackendEditedVersion[]): ScholarSubmission[] => {
  return edits.map((item) => {
    const v = item.proposed;
    const languageCode = v.languages?.code || "unknown";

    let disciplineNames: string[] = [];
    if (v.scholar_disciplines) {
      disciplineNames = v.scholar_disciplines
        .map((sd) => sd.disciplines?.name)
        .filter(Boolean) as string[];
    }

    return {
      id: v.version_id.toString(),
      name: v.canonical_name,
      languageCode: languageCode,
      editor: v.users?.username || "Unknown",
      editorId: v.created_by || null,
      originalContributor: item.current?.users?.username || v.users?.username || "Unknown",
      date: new Date(v.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      discipline: disciplineNames.length > 0 ? disciplineNames.join(", ") : "Pending Review",
      submittedAt: new Date(v.created_at),
    };
  });
};

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */
export default function PendingEditsQueue() {
  const navigate = useNavigate();
  const { t, lang, dbLanguages } = useLang(); // ✅ Added dbLanguages
  const isRTL = lang === "AR" || lang === "ar";

  const [filterLanguage, setFilterLanguage] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "name">("newest");
  const [rows, setRows] = useState<ScholarSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Modal States
  const [approveReason, setApproveReason] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [restrictTarget, setRestrictTarget] = useState<ScholarSubmission | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ type: 'revoke' | 'ban', target: ScholarSubmission } | null>(null);
  const [approveTarget, setApproveTarget] = useState<ScholarSubmission | null>(null);
  const [rejectTarget, setRejectTarget] = useState<ScholarSubmission | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [editsRes] = await Promise.all([adminApi.scholars.getPendingEdited()]);
        if (editsRes.data?.success && editsRes.data.data) {
          setRows(transformEditedVersions(editsRes.data.data));
        }
      } catch (error) {
        console.error("Failed to fetch pending edits:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  // ✅ Dynamic language resolution for filter dropdown
  const uniqueLanguages = useMemo(() => {
    const codes = Array.from(new Set(rows.map(r => r.languageCode).filter(Boolean)));
    return codes.map(code => {
      const found = dbLanguages.find((l: any) => l.code.toLowerCase() === code.toLowerCase());
      return { code, name: found ? found.name : code.toUpperCase() };
    });
  }, [rows, dbLanguages]);

  const filtered = useMemo(() => {
    let result = [...rows];
    if (filterLanguage !== "all") {
      result = result.filter((s) => s.languageCode.toLowerCase() === filterLanguage.toLowerCase());
    }
    
    result.sort((a, b) => {
      switch (sortBy) {
        case "newest": return b.submittedAt.getTime() - a.submittedAt.getTime();
        case "oldest": return a.submittedAt.getTime() - b.submittedAt.getTime();
        case "name":   return a.name.localeCompare(b.name);
        default:       return 0;
      }
    });
    return result;
  }, [rows, filterLanguage, sortBy]);

  const goToReview = (s: ScholarSubmission) => {
    navigate(`/admin/pending/edits/${s.id}?lang=${s.languageCode}`);
  };

  const handleApprove = async (id: string) => {
    try {
      await adminApi.scholars.approve(Number(id), { reason: approveReason || "Approved" });
      setRows((prev) => prev.filter((r) => r.id !== id));
      setApproveTarget(null);
      setApproveReason("");
    } catch (error) {
      console.error("Failed to approve:", error);
      alert("Failed to approve scholar edit. Please try again.");
    }
  };

  const handleReject = async (id: string) => {
    if (!rejectReason.trim()) { alert("Please provide a rejection reason"); return; }
    try {
      await adminApi.scholars.reject(Number(id), rejectReason);
      setRows((prev) => prev.filter((r) => r.id !== id));
      setRejectTarget(null);
      setRejectReason("");
    } catch (error) {
      console.error("Failed to reject:", error);
      alert("Failed to reject scholar edit. Please try again.");
    }
  };

  const executeRestrictionAndReject = async () => {
    if (!confirmAction) return;
    try {
      const { type, target } = confirmAction;
      const userId = target.editorId;
      const scholarId = Number(target.id);

      if (!userId) {
        alert("Cannot restrict system-generated submissions.");
        setConfirmAction(null); setRestrictTarget(null); return;
      }

      if (type === 'revoke') await adminApi.users.toggleContribute(userId);
      else await adminApi.users.ban(userId);

      const defaultReason = type === 'ban' ? "Contributor banned" : "Contribution access revoked";
      await adminApi.scholars.reject(scholarId, defaultReason);

      setRows((prev) => prev.filter((r) => r.id !== target.id));
      setConfirmAction(null); setRestrictTarget(null);
    } catch (err) {
      console.error("Action failed:", err);
      alert("Failed to process action. Please try again.");
    }
  };

  const clearFilters = () => { setFilterLanguage("all"); setSortBy("newest"); };
  const hasActiveFilters = filterLanguage !== "all";

  const getLangName = (code: string) => {
    const found = dbLanguages.find((l: any) => l.code.toLowerCase() === code.toLowerCase());
    return found ? found.name : code.toUpperCase();
  };

  const getLangColor = (code: string) => {
    const lower = code.toLowerCase();
    if (lower === 'ar') return "#C9A84C";
    if (lower === 'fr') return "#3d6b96";
    return "#1e4d3a";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fbf9f4]">
        <span className="material-symbols-outlined text-[40px] text-[#1e4d3a]/40 animate-pulse">hourglass_empty</span>
      </div>
    );
  }

  return (
    <div className="oulamauna-dashboard min-h-screen text-[#1e4d3a] antialiased font-['Inter']" dir={isRTL ? "rtl" : "ltr"}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&family=Source+Serif+4:wght@400;500;600;700&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap');
        .oulamauna-dashboard { background: radial-gradient(circle at 8% 10%, rgba(201,168,76,0.055), transparent 24%), radial-gradient(circle at 92% 16%, rgba(79,145,132,0.06), transparent 25%), #fbf9f4; }
        .oulamauna-dashboard * { box-sizing: border-box; }
        .oulamauna-dashboard .serif-title { font-family: 'Source Serif 4', Georgia, serif; letter-spacing: -0.025em; }
        .oulamauna-dashboard .mono-label { font-family: 'JetBrains Mono', monospace; letter-spacing: 0.06em; }
        .oulamauna-dashboard .dashboard-card { background: rgba(251,249,244,0.96); border: 1px solid rgba(30,77,58,0.10); border-radius: 10px; box-shadow: 0 5px 18px rgba(30,77,58,0.055); transition: box-shadow 180ms ease; }
        .oulamauna-dashboard .dashboard-card:hover { box-shadow: 0 9px 26px rgba(30,77,58,0.08); }
        .oulamauna-dashboard ::selection { background: #C9A84C; color: #1e4d3a; }
      `}</style>

      <main className="max-w-[1450px] mx-auto px-3 md:px-5 xl:px-7 py-6 md:py-8">
        <div className="mb-6">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="mono-label text-[9px] uppercase font-bold text-[#1e4d3a]/60">ADMIN / PENDING EDITS</span>
              </div>
              <h1 className="serif-title text-[27px] md:text-[32px] leading-tight font-semibold text-[#082f27]">
                {t("admin.pendingEdits.title") || "Pending Edits Queue"}
              </h1>
              <p className="text-[12px] text-[#1e4d3a]/60 mt-1">
                {t("admin.pendingEdits.subtitle") || "Review and approve scholar edit submissions."}
              </p>
            </div>
          </div>

          <div className="dashboard-card p-4 mb-6">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <div className="flex flex-1 flex-wrap gap-4">
                <div className="flex-1 min-w-[150px]">
                  <label className="mono-label text-[9px] uppercase font-bold text-[#1e4d3a]/60 mb-1.5 block">{t("admin.common.language") || "Language"}</label>
                  <select value={filterLanguage} onChange={(e) => setFilterLanguage(e.target.value)} className="w-full bg-[#fbf9f4] border border-[#1e4d3a]/15 rounded-[6px] px-3 py-2 text-[12px] font-medium text-[#1e4d3a] focus:outline-none focus:ring-2 focus:ring-[#1e4d3a]/20">
                    <option value="all">{t("admin.common.all") || "All"}</option>
                    {uniqueLanguages.map(l => <option key={l.code} value={l.code}>{l.name}</option>)}
                  </select>
                </div>
                <div className="flex-1 min-w-[150px]">
                  <label className="mono-label text-[9px] uppercase font-bold text-[#1e4d3a]/60 mb-1.5 block">{t("admin.common.sortBy") || "Sort By"}</label>
                  <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)} className="w-full bg-[#fbf9f4] border border-[#1e4d3a]/15 rounded-[6px] px-3 py-2 text-[12px] font-medium text-[#1e4d3a] focus:outline-none focus:ring-2 focus:ring-[#1e4d3a]/20">
                    <option value="newest">{t("admin.common.newestFirst") || "Newest First"}</option>
                    <option value="oldest">{t("admin.common.oldestFirst") || "Oldest First"}</option>
                    <option value="name">{t("admin.common.nameAZ") || "Name (A-Z)"}</option>
                  </select>
                </div>
              </div>
              {hasActiveFilters && (
                <button onClick={clearFilters} className="flex items-center gap-1.5 px-3 py-2 rounded-[6px] border border-[#e96d5c] text-[#e96d5c] text-[11px] font-bold uppercase tracking-wide hover:bg-[#e96d5c]/5 transition-colors mt-5 md:mt-0 self-end md:self-auto cursor-pointer">
                  <span className="material-symbols-outlined text-[14px]">close</span> {t("admin.common.clear") || "Clear"}
                </button>
              )}
            </div>
          </div>
        </div>

        <section className="dashboard-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#1e4d3a]/10 bg-[#1e4d3a]/[0.02]">
                  <th className="mono-label text-[9px] uppercase font-bold text-[#1e4d3a]/60 px-5 py-3.5">{t("admin.pendingEdits.table.scholar") || "Scholar"}</th>
                  <th className="mono-label text-[9px] uppercase font-bold text-[#1e4d3a]/60 px-5 py-3.5">{t("admin.pendingEdits.table.language") || "Language"}</th>
                  <th className="mono-label text-[9px] uppercase font-bold text-[#1e4d3a]/60 px-5 py-3.5">{t("admin.pendingEdits.table.editor") || "Editor"}</th>
                  <th className="mono-label text-[9px] uppercase font-bold text-[#1e4d3a]/60 px-5 py-3.5">{t("admin.pendingEdits.table.submitted") || "Submitted"}</th>
                  <th className="mono-label text-[9px] uppercase font-bold text-[#1e4d3a]/60 px-5 py-3.5 text-right">{t("admin.pendingEdits.table.actions") || "Actions"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e4d3a]/[0.06]">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-12 text-center text-[12px] text-[#1e4d3a]/50">
                      <span className="material-symbols-outlined text-[40px] mb-2 block mx-auto">inbox</span>
                      {t("admin.pendingEdits.noEdits") || "No edits found matching your filters."}
                    </td>
                  </tr>
                ) : (
                  filtered.map((s) => {
                    const langColor = getLangColor(s.languageCode);
                    return (
                      <tr key={s.id} className="hover:bg-[#1e4d3a]/[0.015] transition-colors cursor-pointer">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-[#1e4d3a]/[0.05] border border-[#1e4d3a]/10 flex items-center justify-center text-[#1e4d3a] font-['Source_Serif_4'] font-bold text-[14px] flex-shrink-0">
                              {s.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="text-[13px] font-semibold text-[#082f27]">{s.name}</p>
                              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#fbf9f4] border border-[#1e4d3a]/10 mt-1">
                                <span className="material-symbols-outlined text-[12px] text-[#1e4d3a]/60">person</span>
                                <span className="mono-label text-[9px] text-[#1e4d3a]/70">{s.originalContributor}</span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#1e4d3a]/5 border border-[#1e4d3a]/10">
                            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: langColor }} />
                            <span className="mono-label text-[10px] font-bold text-[#1e4d3a]/70 uppercase tracking-wide">{getLangName(s.languageCode)}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-[#C9A84C]/10 border border-[#C9A84C]/20 flex items-center justify-center text-[#C9A84C] font-['Source_Serif_4'] font-bold text-[10px] flex-shrink-0">
                              {s.editor.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase()}
                            </div>
                            <span className="text-[12px] font-medium text-[#1e4d3a]">{s.editor}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 mono-label text-[11px] text-[#1e4d3a]/70">{s.date}</td>
                        <td className="px-5 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button onClick={(e) => { e.stopPropagation(); goToReview(s); }} title="Review" className="w-8 h-8 flex items-center justify-center rounded-[6px] border border-[#1e4d3a]/20 text-[#1e4d3a] hover:bg-[#1e4d3a] hover:text-white transition-colors cursor-pointer">
                              <span className="material-symbols-outlined text-[18px]">visibility</span>
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); setApproveTarget(s); }} title="Approve" className="w-8 h-8 flex items-center justify-center rounded-[6px] bg-[#1e4d3a] border border-[#1e4d3a] text-white hover:bg-[#1e4d3a]/90 transition-colors cursor-pointer">
                              <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1, 'wght' 400" }}>check</span>
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); setRejectTarget(s); }} title="Reject" className="w-8 h-8 flex items-center justify-center rounded-[6px] border border-[#e96d5c] text-[#e96d5c] hover:bg-[#e96d5c] hover:text-white transition-colors cursor-pointer">
                              <span className="material-symbols-outlined text-[18px]">close</span>
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); setRestrictTarget(s); }} title="Restrict User" className="w-8 h-8 flex items-center justify-center rounded-[6px] border border-[#C9A84C] text-[#C9A84C] hover:bg-[#C9A84C] hover:text-white transition-colors cursor-pointer">
                              <span className="material-symbols-outlined text-[18px]">shield_person</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* ── Modals (Translated) ── */}
        {restrictTarget && !confirmAction && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#082f27]/40 backdrop-blur-sm" onClick={() => setRestrictTarget(null)}>
            <div className="dashboard-card w-full max-w-lg p-6 relative" onClick={(e) => e.stopPropagation()}>
              <button onClick={() => setRestrictTarget(null)} className={`absolute top-4 ${isRTL ? 'left-4' : 'right-4'} p-1.5 rounded-full hover:bg-[#1e4d3a]/10 transition-colors cursor-pointer`}>
                <span className="material-symbols-outlined text-[20px] text-[#1e4d3a]">close</span>
              </button>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-full bg-[#C9A84C]/10 border border-[#C9A84C]/20 flex items-center justify-center text-[#C9A84C] font-['Source_Serif_4'] font-bold text-[20px] flex-shrink-0">
                  {restrictTarget.editor.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase()}
                </div>
                <div>
                  <h3 className="serif-title text-[20px] font-semibold text-[#082f27]">{t("admin.pendingEdits.modal.restrict.title") || "Restrict User"}</h3>
                  <p className="text-[12px] text-[#1e4d3a]/60 mt-1">{restrictTarget.editor} {isRTL ? "عدّل" : "edited"} "{restrictTarget.name}"</p>
                </div>
              </div>
              <p className="text-[13px] text-[#1e4d3a]/80 leading-relaxed mb-6">
                {t("admin.pendingEdits.modal.restrict.desc") || "Choose an action. This will automatically reject this edit submission as well."}
              </p>
              <div className="space-y-3 mb-6">
                <button onClick={() => setConfirmAction({ type: 'revoke', target: restrictTarget })} className="w-full flex items-start gap-4 p-4 rounded-[8px] border border-[#C9A84C]/30 bg-[#C9A84C]/[0.05] hover:bg-[#C9A84C]/10 transition-colors cursor-pointer text-left">
                  <div className="w-8 h-8 rounded-full bg-[#C9A84C] text-white flex items-center justify-center flex-shrink-0 mt-0.5"><span className="material-symbols-outlined text-[18px]">person_off</span></div>
                  <div>
                    <p className="text-[13px] font-semibold text-[#082f27] mb-1">{t("admin.pendingEdits.modal.restrict.revoke") || "Revoke Contribution Access"}</p>
                    <p className="text-[11px] text-[#1e4d3a]/60 leading-relaxed">{t("admin.pendingEdits.modal.restrict.revokeDesc") || "They can still log in, but cannot submit new edits. (Recommended for low-quality edits)"}</p>
                  </div>
                </button>
                <button onClick={() => setConfirmAction({ type: 'ban', target: restrictTarget })} className="w-full flex items-start gap-4 p-4 rounded-[8px] border border-[#e96d5c]/30 bg-[#e96d5c]/[0.05] hover:bg-[#e96d5c]/10 transition-colors cursor-pointer text-left">
                  <div className="w-8 h-8 rounded-full bg-[#e96d5c] text-white flex items-center justify-center flex-shrink-0 mt-0.5"><span className="material-symbols-outlined text-[18px]">block</span></div>
                  <div>
                    <p className="text-[13px] font-semibold text-[#082f27] mb-1">{t("admin.pendingEdits.modal.restrict.ban") || "Ban Account Completely"}</p>
                    <p className="text-[11px] text-[#1e4d3a]/60 leading-relaxed">{t("admin.pendingEdits.modal.restrict.banDesc") || "They will be completely locked out of the platform. (Use for spam, abuse, or severe violations)"}</p>
                  </div>
                </button>
              </div>
              <div className="flex justify-end">
                <button onClick={() => setRestrictTarget(null)} className="px-5 py-2 rounded-[6px] border border-[#1e4d3a]/20 text-[#1e4d3a] text-[12px] font-bold uppercase tracking-wide hover:bg-[#1e4d3a]/5 transition-colors cursor-pointer">
                  {t("admin.common.cancel") || "Cancel"}
                </button>
              </div>
            </div>
          </div>
        )}

        {confirmAction && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#082f27]/40 backdrop-blur-sm" onClick={() => setConfirmAction(null)}>
            <div className="dashboard-card w-full max-w-md p-6 relative" onClick={(e) => e.stopPropagation()}>
              <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-5 ${confirmAction.type === 'ban' ? 'bg-[#e96d5c] text-white' : 'bg-[#C9A84C] text-white'}`}>
                <span className="material-symbols-outlined text-[28px]" style={{ fontVariationSettings: "'FILL' 1, 'wght' 400" }}>{confirmAction.type === 'ban' ? "block" : "person_off"}</span>
              </div>
              <h3 className="serif-title text-[20px] font-semibold text-[#082f27] mb-3">{t("admin.pendingEdits.modal.confirm.title") || "Confirm Action"}</h3>
              <p className="text-[13px] text-[#1e4d3a]/80 leading-relaxed mb-6">
                {t("admin.pendingEdits.modal.confirm.desc") || "This will"} <strong>{confirmAction.type === 'ban' ? (t("admin.pendingEdits.modal.confirm.ban") || "BAN") : (t("admin.pendingEdits.modal.confirm.revoke") || "REVOKE CONTRIBUTION ACCESS FOR")}</strong> {confirmAction.target.editor} {t("admin.pendingEdits.modal.confirm.andReject") || "and automatically REJECT the edit for"} "{confirmAction.target.name}".
                <br/><br/><strong className="text-[#e96d5c]">{t("admin.pendingEdits.modal.confirm.warning") || "This action cannot be undone from this screen."}</strong>
              </p>
              <div className="flex gap-3 justify-end">
                <button onClick={() => setConfirmAction(null)} className="px-5 py-2 rounded-[6px] border border-[#1e4d3a]/20 text-[#1e4d3a] text-[12px] font-bold uppercase tracking-wide hover:bg-[#1e4d3a]/5 transition-colors cursor-pointer">
                  {t("admin.common.goBack") || "Go Back"}
                </button>
                <button onClick={executeRestrictionAndReject} className={`px-5 py-2 rounded-[6px] text-white text-[12px] font-bold uppercase tracking-wide transition-colors cursor-pointer ${confirmAction.type === 'ban' ? 'bg-[#e96d5c] hover:bg-[#e96d5c]/90' : 'bg-[#C9A84C] hover:bg-[#C9A84C]/90'}`}>
                  {t("admin.pendingEdits.modal.confirm.button") || "Confirm & Reject"}
                </button>
              </div>
            </div>
          </div>
        )}

        {approveTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#082f27]/40 backdrop-blur-sm" onClick={() => { setApproveTarget(null); setApproveReason(""); }}>
            <div className="dashboard-card w-full max-w-lg p-6 relative" onClick={(e) => e.stopPropagation()}>
              <button onClick={() => { setApproveTarget(null); setApproveReason(""); }} className={`absolute top-4 ${isRTL ? 'left-4' : 'right-4'} p-1.5 rounded-full hover:bg-[#1e4d3a]/10 transition-colors cursor-pointer`}>
                <span className="material-symbols-outlined text-[20px] text-[#1e4d3a]">close</span>
              </button>
              <div className="w-14 h-14 rounded-full bg-[#1e4d3a] text-white flex items-center justify-center mb-5">
                <span className="material-symbols-outlined text-[28px]" style={{ fontVariationSettings: "'FILL' 1, 'wght' 400" }}>check_circle</span>
              </div>
              <h3 className="serif-title text-[20px] font-semibold text-[#082f27] mb-4">{t("admin.pendingEdits.modal.approve.title") || "Approve Edit?"}</h3>
              <div className="bg-[#1e4d3a]/[0.03] p-4 rounded-[8px] mb-5 space-y-2">
                <p className="text-[14px] font-semibold text-[#082f27]">{approveTarget.name}</p>
                <p className="text-[12px] text-[#1e4d3a]/70"><strong>{t("admin.common.language") || "Language"}:</strong> {getLangName(approveTarget.languageCode)}</p>
                <p className="text-[12px] text-[#1e4d3a]/70"><strong>{isRTL ? "عدّل بواسطة:" : "Edited by:"}</strong> {approveTarget.editor}</p>
                <p className="text-[12px] text-[#1e4d3a]/70"><strong>{isRTL ? "التاريخ:" : "Date:"}</strong> {approveTarget.date}</p>
                <p className="text-[12px] text-[#1e4d3a]/70"><strong>{isRTL ? "التخصص:" : "Discipline:"}</strong> {approveTarget.discipline}</p>
              </div>
              <div className="mb-6">
                <label className="mono-label text-[9px] uppercase font-bold text-[#1e4d3a]/60 mb-1.5 block">{t("admin.pendingEdits.modal.approve.notes") || "APPROVAL NOTES (Optional)"}</label>
                <textarea value={approveReason} onChange={(e) => setApproveReason(e.target.value)} placeholder={t("admin.pendingEdits.modal.approve.notesPlaceholder") || "Add any notes about this approval..."} className="w-full bg-[#fbf9f4] border border-[#1e4d3a]/15 rounded-[6px] px-3 py-2 text-[12px] font-medium text-[#1e4d3a] focus:outline-none focus:ring-2 focus:ring-[#1e4d3a]/20 min-h-[80px] resize-y" />
              </div>
              <p className="text-[13px] text-[#1e4d3a]/80 leading-relaxed mb-6">
                {t("admin.pendingEdits.modal.approve.desc") || "This will publish the edited scholar to the portal. This action cannot be undone."}
              </p>
              <div className="flex gap-3 justify-end">
                <button onClick={() => { setApproveTarget(null); setApproveReason(""); }} className="px-5 py-2 rounded-[6px] border border-[#1e4d3a]/20 text-[#1e4d3a] text-[12px] font-bold uppercase tracking-wide hover:bg-[#1e4d3a]/5 transition-colors cursor-pointer">
                  {t("admin.common.cancel") || "Cancel"}
                </button>
                <button onClick={() => handleApprove(approveTarget.id)} className="px-5 py-2 rounded-[6px] bg-[#1e4d3a] text-white text-[12px] font-bold uppercase tracking-wide hover:bg-[#1e4d3a]/90 transition-colors cursor-pointer">
                  {t("admin.pendingEdits.modal.approve.confirm") || "Confirm Approval"}
                </button>
              </div>
            </div>
          </div>
        )}

        {rejectTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#082f27]/40 backdrop-blur-sm" onClick={() => { setRejectTarget(null); setRejectReason(""); }}>
            <div className="dashboard-card w-full max-w-lg p-6 relative" onClick={(e) => e.stopPropagation()}>
              <button onClick={() => { setRejectTarget(null); setRejectReason(""); }} className={`absolute top-4 ${isRTL ? 'left-4' : 'right-4'} p-1.5 rounded-full hover:bg-[#1e4d3a]/10 transition-colors cursor-pointer`}>
                <span className="material-symbols-outlined text-[20px] text-[#1e4d3a]">close</span>
              </button>
              <div className="w-14 h-14 rounded-full bg-[#e96d5c] text-white flex items-center justify-center mb-5">
                <span className="material-symbols-outlined text-[28px]" style={{ fontVariationSettings: "'FILL' 1, 'wght' 400" }}>cancel</span>
              </div>
              <h3 className="serif-title text-[20px] font-semibold text-[#082f27] mb-4">{t("admin.pendingEdits.modal.reject.title") || "Reject Edit?"}</h3>
              <div className="bg-[#1e4d3a]/[0.03] p-4 rounded-[8px] mb-5 space-y-2">
                <p className="text-[14px] font-semibold text-[#082f27]">{rejectTarget.name}</p>
                <p className="text-[12px] text-[#1e4d3a]/70"><strong>{t("admin.common.language") || "Language"}:</strong> {getLangName(rejectTarget.languageCode)}</p>
                <p className="text-[12px] text-[#1e4d3a]/70"><strong>{isRTL ? "عدّل بواسطة:" : "Edited by:"}</strong> {rejectTarget.editor}</p>
                <p className="text-[12px] text-[#1e4d3a]/70"><strong>{isRTL ? "التاريخ:" : "Date:"}</strong> {rejectTarget.date}</p>
                <p className="text-[12px] text-[#1e4d3a]/70"><strong>{isRTL ? "التخصص:" : "Discipline:"}</strong> {rejectTarget.discipline}</p>
              </div>
              <div className="mb-6">
                <label className="mono-label text-[9px] uppercase font-bold text-[#1e4d3a]/60 mb-1.5 block">{t("admin.pendingEdits.modal.reject.reason") || "REJECTION REASON *"}</label>
                <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder={t("admin.pendingEdits.modal.reject.reasonPlaceholder") || "Please provide a reason for rejection..."} className="w-full bg-[#fbf9f4] border border-[#1e4d3a]/15 rounded-[6px] px-3 py-2 text-[12px] font-medium text-[#1e4d3a] focus:outline-none focus:ring-2 focus:ring-[#1e4d3a]/20 min-h-[80px] resize-y" />
              </div>
              <div className="flex gap-3 justify-end">
                <button onClick={() => { setRejectTarget(null); setRejectReason(""); }} className="px-5 py-2 rounded-[6px] border border-[#1e4d3a]/20 text-[#1e4d3a] text-[12px] font-bold uppercase tracking-wide hover:bg-[#1e4d3a]/5 transition-colors cursor-pointer">
                  {t("admin.common.cancel") || "Cancel"}
                </button>
                <button onClick={() => handleReject(rejectTarget.id)} disabled={!rejectReason.trim()} className={`px-5 py-2 rounded-[6px] text-white text-[12px] font-bold uppercase tracking-wide transition-colors ${rejectReason.trim() ? 'bg-[#e96d5c] hover:bg-[#e96d5c]/90 cursor-pointer' : 'bg-[#1e4d3a]/20 cursor-not-allowed'}`}>
                  {t("admin.pendingEdits.modal.reject.confirm") || "Confirm Rejection"}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}