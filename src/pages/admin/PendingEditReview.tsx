import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useLang } from "../../context/LanguageContext";
import { adminApi } from "../../api/adminApi";
import BiographyRenderer from "../../components/BiographyRenderer";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
type FieldStatus = "pending" | "accepted" | "rejected";

interface EditField { id: string; fieldName: string; fieldLabel: string; originalValue: string; proposedValue: string; status: FieldStatus; rejectReason?: string; }
interface WorkChange { id: string; type: "added" | "modified"; original?: any; proposed: any; status: FieldStatus; }
interface MediaChange { id: string; type: "added" | "modified"; original?: any; proposed: any; status: FieldStatus; }
interface ReferenceChange { id: string; referenceId: number; type: "added" | "modified"; original?: any; proposed: any; status: FieldStatus; }
interface DisciplineChange { id: string; label: string; type: "added" | "removed"; status: FieldStatus; }

interface ScholarEdit {
  id: string; scholarId: string; scholarName: string; editor: string; editorId: number | null;
  editorAvatar: string; editDate: string; editType: string; originalContributor: string;
  languageCode: string; // ✅ Dynamic string
  changedFields: EditField[]; workChanges: WorkChange[]; mediaChanges: MediaChange[];
  referenceChanges: ReferenceChange[]; disciplineChanges: DisciplineChange[]; editorNote: string;
  currentImage?: string; proposedImage?: string; proposedImageId?: number;
}

/* ------------------------------------------------------------------ */
/*  Helper: Transform Backend Data                                    */
/* ------------------------------------------------------------------ */
const transformBackendToEdit = (item: any): ScholarEdit => {
  const proposed = item.proposed;
  const current = item.current || {};
  const changedFields: EditField[] = [];
  
  const formatScholarDate = (dateObj: any) => dateObj ? (dateObj.raw_text || (dateObj.year ? `${dateObj.year} ${dateObj.calendar}`.trim() : "")) : "";

  if (proposed.canonical_name !== current.canonical_name) changedFields.push({ id: "name", fieldName: "canonical_name", fieldLabel: "Name", originalValue: current.canonical_name || "", proposedValue: proposed.canonical_name || "", status: "pending" });
  if (proposed.biography !== current.biography) changedFields.push({ id: "bio", fieldName: "biography", fieldLabel: "Biography", originalValue: current.biography || "", proposedValue: proposed.biography || "", status: "pending" });
  if (proposed.regions?.name !== current.regions?.name) changedFields.push({ id: "region", fieldName: "region", fieldLabel: "Region", originalValue: current.regions?.name || "", proposedValue: proposed.regions?.name || "", status: "pending" });

  const currentAliases = (current.scholar_aliases || []).map((a: any) => a.alias_name).sort();
  const proposedAliases = (proposed.scholar_aliases || []).map((a: any) => a.alias_name).sort();
  if (JSON.stringify(currentAliases) !== JSON.stringify(proposedAliases)) changedFields.push({ id: "aliases", fieldName: "scholar_aliases", fieldLabel: "Aliases", originalValue: currentAliases.join(", ") || "None", proposedValue: proposedAliases.join(", ") || "None", status: "pending" });

  const currentBirth = (current.scholar_dates || []).find((d: any) => d.date_type === "birth");
  const proposedBirth = (proposed.scholar_dates || []).find((d: any) => d.date_type === "birth");
  const currentDeath = (current.scholar_dates || []).find((d: any) => d.date_type === "death");
  const proposedDeath = (proposed.scholar_dates || []).find((d: any) => d.date_type === "death");
  const currentBirthStr = formatScholarDate(currentBirth); const proposedBirthStr = formatScholarDate(proposedBirth);
  const currentDeathStr = formatScholarDate(currentDeath); const proposedDeathStr = formatScholarDate(proposedDeath);

  if (currentBirthStr !== proposedBirthStr || currentDeathStr !== proposedDeathStr) {
    changedFields.push({ id: "dates", fieldName: "scholar_dates", fieldLabel: "Birth/Death Dates", originalValue: currentBirthStr || currentDeathStr ? `Born: ${currentBirthStr || "Unknown"}, Died: ${currentDeathStr || "Unknown"}` : "No dates", proposedValue: proposedBirthStr || proposedDeathStr ? `Born: ${proposedBirthStr || "Unknown"}, Died: ${proposedDeathStr || "Unknown"}` : "No dates", status: "pending" });
  }

  const currentCentury = `${current.century_gregorian_start || ""}-${current.century_gregorian_end || ""}`.replace(/^-+|-+$/g, "");
  const proposedCentury = `${proposed.century_gregorian_start || ""}-${proposed.century_gregorian_end || ""}`.replace(/^-+|-+$/g, "");
  if (currentCentury !== proposedCentury) changedFields.push({ id: "century", fieldName: "century", fieldLabel: "Century", originalValue: currentCentury || "Unknown", proposedValue: proposedCentury || "Unknown", status: "pending" });

  const currentImg = current.image_url || current.img_versions?.find((img: any) => img.status === "approved")?.image_url;
  const proposedImg = proposed.img_versions?.[0]?.image_url || proposed.image_url;
  const proposedImgId = proposed.img_versions?.[0]?.img_version_id;
  if (currentImg !== proposedImg) changedFields.push({ id: "image", fieldName: "image", fieldLabel: "Profile Image", originalValue: currentImg ? "Image exists" : "No image", proposedValue: proposedImg ? "Image exists" : "No image", status: "pending" });

  const currentRelationships = (current.scholar_relationships_as_source || []).map((r: any) => ({ type: r.relation_type, name: r.related_scholar_version?.canonical_name }));
  const proposedRelationships = (proposed.scholar_relationships_as_source || []).map((r: any) => ({ type: r.relation_type, name: r.related_scholar_version?.canonical_name }));
  if (JSON.stringify(currentRelationships) !== JSON.stringify(proposedRelationships)) {
    const formatRel = (rels: any[]) => rels.map(r => `${r.type}: ${r.name}`).join("; ") || "None";
    changedFields.push({ id: "relationships", fieldName: "scholar_relationships", fieldLabel: "Relationships", originalValue: formatRel(currentRelationships), proposedValue: formatRel(proposedRelationships), status: "pending" });
  }

  const workChanges: WorkChange[] = [];
  const currentWorks = current.scholar_works || []; const proposedWorks = proposed.scholar_works || [];
  proposedWorks.forEach((pw: any) => {
    const cw = currentWorks.find((w: any) => w.work_id === pw.work_id);
    if (!cw) workChanges.push({ id: `w_add_${pw.work_id}`, type: "added", proposed: { id: pw.work_id.toString(), title: pw.title, year: pw.year?.toString() || "", format: pw.format, access: pw.media_url || pw.file_path }, status: "pending" });
    else if (cw.title !== pw.title || cw.year !== pw.year || cw.format !== pw.format) workChanges.push({ id: `w_mod_${pw.work_id}`, type: "modified", original: { id: cw.work_id.toString(), title: cw.title, year: cw.year?.toString() || "", format: cw.format, access: cw.media_url || cw.file_path }, proposed: { id: pw.work_id.toString(), title: pw.title, year: pw.year?.toString() || "", format: pw.format, access: pw.media_url || pw.file_path }, status: "pending" });
  });

  const mediaChanges: MediaChange[] = [];
  const currentMedia = current.media || []; const proposedMedia = proposed.media || [];
  proposedMedia.forEach((pm: any) => {
    const cm = currentMedia.find((m: any) => m.media_id === pm.media_id);
    const getIcon = (type: string) => type?.includes("video") ? "movie" : type?.includes("audio") ? "graphic_eq" : "article";
    if (!cm) mediaChanges.push({ id: `m_add_${pm.media_id}`, type: "added", proposed: { id: pm.media_id.toString(), title: pm.title || pm.file_name || "Untitled", meta: pm.file_type || "file", type: pm.source_type === "upload" ? "Upload" : "Link", icon: getIcon(pm.file_type), color: "#f6efdc", description: pm.description || "", access: pm.media_url || pm.file_path }, status: "pending" });
    else if (cm.title !== pm.title || cm.description !== pm.description) mediaChanges.push({ id: `m_mod_${pm.media_id}`, type: "modified", original: { id: cm.media_id.toString(), title: cm.title || cm.file_name || "Untitled", meta: cm.file_type || "file", type: cm.source_type === "upload" ? "Upload" : "Link", icon: getIcon(cm.file_type), color: "#f6efdc", description: cm.description || "", access: cm.media_url || cm.file_path }, proposed: { id: pm.media_id.toString(), title: pm.title || pm.file_name || "Untitled", meta: pm.file_type || "file", type: pm.source_type === "upload" ? "Upload" : "Link", icon: getIcon(pm.file_type), color: "#f6efdc", description: pm.description || "", access: pm.media_url || pm.file_path }, status: "pending" });
  });

  const referenceChanges: ReferenceChange[] = [];
  const currentRefs = current.scholar_references || []; const proposedRefs = proposed.scholar_references || [];
  proposedRefs.forEach((pr: any) => {
    const cr = currentRefs.find((r: any) => r.reference_id === pr.reference_id);
    if (!cr) referenceChanges.push({ id: `r_add_${pr.reference_id}`, referenceId: pr.reference_id, type: "added", proposed: { id: pr.reference_id.toString(), title: pr.title, citation: pr.citation, url: pr.url }, status: "pending" });
    else if (cr.title !== pr.title || cr.citation !== pr.citation || cr.url !== pr.url) referenceChanges.push({ id: `r_mod_${pr.reference_id}`, referenceId: pr.reference_id, type: "modified", original: { id: cr.reference_id.toString(), title: cr.title, citation: cr.citation, url: cr.url }, proposed: { id: pr.reference_id.toString(), title: pr.title, citation: pr.citation, url: pr.url }, status: "pending" });
  });

  const disciplineChanges: DisciplineChange[] = [];
  const currentDisciplines = (current.scholar_disciplines || []).map((d: any) => d.disciplines?.discipline_id);
  const proposedDisciplines = (proposed.scholar_disciplines || []).map((d: any) => d.disciplines?.discipline_id);
  proposedDisciplines.forEach((dId: number) => { if (!currentDisciplines.includes(dId)) { const disc = proposed.scholar_disciplines.find((d: any) => d.disciplines?.discipline_id === dId); disciplineChanges.push({ id: `d_add_${dId}`, label: disc?.disciplines?.name || "Unknown", type: "added", status: "pending" }); } });
  currentDisciplines.forEach((dId: number) => { if (!proposedDisciplines.includes(dId)) { const disc = current.scholar_disciplines.find((d: any) => d.disciplines?.discipline_id === dId); disciplineChanges.push({ id: `d_rem_${dId}`, label: disc?.disciplines?.name || "Unknown", type: "removed", status: "pending" }); } });

  return {
    id: proposed.version_id.toString(), scholarId: proposed.scholar_id.toString(), scholarName: proposed.canonical_name || current.canonical_name || "Unknown",
    editor: proposed.users?.username || "Unknown", editorId: proposed.created_by || null, editorAvatar: (proposed.users?.username || "U").substring(0, 2).toUpperCase(),
    editDate: new Date(proposed.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }), editType: "edition",
    originalContributor: current.users?.username || proposed.users?.username || "Unknown", languageCode: proposed.languages?.code || "unknown", // ✅ DYNAMIC
    changedFields, workChanges, mediaChanges, referenceChanges, disciplineChanges, editorNote: "Edit proposal submitted for review.",
    currentImage: currentImg || `https://ui-avatars.com/api/?name=${encodeURIComponent(current.canonical_name || "C")}&background=0b4335&color=fff&size=128`,
    proposedImage: proposedImg || `https://ui-avatars.com/api/?name=${encodeURIComponent(proposed.canonical_name || "P")}&background=0b4335&color=fff&size=128`, proposedImageId: proposedImgId,
  };
};

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */
export default function PendingEditReview() {
  const { id: editId } = useParams();
  const navigate = useNavigate();
  const { lang, t, dbLanguages } = useLang(); // ✅ Added dbLanguages
  const isRTL = lang === "AR" || lang === "ar";

  const [mode, setMode] = useState<"approve" | "reject" | null>(null);
  const [note, setNote] = useState(""); 
  const [approveReason, setApproveReason] = useState(""); 
  const [edit, setEdit] = useState<ScholarEdit | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showRestrictModal, setShowRestrictModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{ type: 'revoke' | 'ban' } | null>(null);
  const [rejectingFieldId, setRejectingFieldId] = useState<string | null>(null);
  const [fieldRejectReason, setFieldRejectReason] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const response = await adminApi.scholars.getPendingEdited();
        if (response.data?.success && response.data.data) {
          const editData = response.data.data.find((item: any) => item.proposed.version_id.toString() === editId);
          if (editData) setEdit(transformBackendToEdit(editData));
          else navigate("/admin/pending/edits");
        }
      } catch (error) { console.error("Failed to fetch edit details:", error); } 
      finally { setIsLoading(false); }
    };
    fetchData();
  }, [editId, navigate]);

  if (isLoading || !edit) return <div className="min-h-screen flex items-center justify-center bg-[#fbf9f4]"><span className="material-symbols-outlined text-[40px] text-[#1e4d3a]/40 animate-pulse">hourglass_empty</span></div>;

  const acceptField = (fieldId: string) => setEdit((prev) => prev ? { ...prev, changedFields: prev.changedFields.map((f) => f.id === fieldId ? { ...f, status: "accepted", rejectReason: undefined } : f) } : null);
  const rejectField = (fieldId: string, reason?: string) => { setEdit((prev) => prev ? { ...prev, changedFields: prev.changedFields.map((f) => f.id === fieldId ? { ...f, status: "rejected", rejectReason: reason } : f) } : null); setRejectingFieldId(null); setFieldRejectReason(""); };
  const acceptReference = (refId: string) => setEdit((prev) => prev ? { ...prev, referenceChanges: prev.referenceChanges.map((r) => r.id === refId ? { ...r, status: "accepted" } : r) } : null);
  const rejectReference = (refId: string) => setEdit((prev) => prev ? { ...prev, referenceChanges: prev.referenceChanges.map((r) => r.id === refId ? { ...r, status: "rejected" } : r) } : null);

  const handleConfirm = async () => {
    if (!edit) return;
    try {
      if (mode === "approve") {
        const payload: any = { reason: approveReason || "Approved" };
        const rejectedRefs = edit.referenceChanges.filter(r => r.status === "rejected").map(r => r.referenceId);
        if (rejectedRefs.length > 0) payload.reject_references = rejectedRefs;
        const imageField = edit.changedFields.find(f => f.fieldName === "image");
        if (imageField && imageField.status === "rejected" && edit.proposedImageId) payload.reject_images = [edit.proposedImageId];
        await adminApi.scholars.approve(Number(edit.id), payload);
      } else if (mode === "reject") {
        if (!note.trim()) { alert("Please provide a rejection reason"); return; }
        await adminApi.scholars.reject(Number(edit.id), note);
      }
      navigate("/admin/pending/edits");
    } catch (error) { console.error("Failed to process edit:", error); alert("Action failed. Please try again."); }
  };

  const executeRestrictionAndReject = async () => {
    if (!confirmAction || !edit) return;
    try {
      const userId = edit.editorId; const scholarId = Number(edit.id);
      if (!userId) { alert("Cannot restrict system-generated submissions."); setConfirmAction(null); setShowRestrictModal(false); return; }
      if (confirmAction.type === 'revoke') await adminApi.users.toggleContribute(userId); else await adminApi.users.ban(userId);
      const defaultReason = confirmAction.type === 'ban' ? "Contributor banned" : "Contribution access revoked";
      await adminApi.scholars.reject(scholarId, defaultReason);
      navigate("/admin/pending/edits"); setConfirmAction(null); setShowRestrictModal(false);
    } catch (err) { console.error("Action failed:", err); alert("Failed to process action. Please try again."); }
  };

  const countStatus = (items: { status: FieldStatus }[], status: FieldStatus) => items.filter((i) => i.status === status).length;
  const allChanges = [...edit.changedFields, ...edit.workChanges, ...edit.mediaChanges, ...edit.referenceChanges, ...edit.disciplineChanges];
  const acceptedCount = countStatus(allChanges, "accepted"); const rejectedCount = countStatus(allChanges, "rejected");
  const pendingCount = countStatus(allChanges, "pending"); const totalChanges = allChanges.length;

  const getLangName = (code: string) => { const found = dbLanguages.find((l: any) => l.code.toLowerCase() === code.toLowerCase()); return found ? found.name : code.toUpperCase(); };

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
        <button onClick={() => navigate("/admin/pending/edits")} className="flex items-center gap-2 px-4 py-2 rounded-[8px] border border-[#1e4d3a]/20 text-[#1e4d3a] text-[12px] font-semibold hover:bg-[#1e4d3a]/5 transition-colors mb-6 cursor-pointer">
          <span className="material-symbols-outlined text-[16px]">{isRTL ? "arrow_forward" : "arrow_back"}</span> {t("admin.pendingEdits.back") || "Back to Pending Edits"}
        </button>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { icon: "check_circle", label: t("admin.pendingEdits.stats.accepted") || "Accepted", value: acceptedCount.toString(), color: "#2f7d74" },
            { icon: "cancel", label: t("admin.pendingEdits.stats.rejected") || "Rejected", value: rejectedCount.toString(), color: "#e96d5c" },
            { icon: "pending", label: t("admin.pendingEdits.stats.pending") || "Pending", value: pendingCount.toString(), color: "#C9A84C" },
            { icon: "list_alt", label: t("admin.pendingEdits.stats.total") || "Total Changes", value: totalChanges.toString(), color: "#1e4d3a" },
          ].map((s) => (
            <div key={s.label} className="dashboard-card p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-[8px] flex items-center justify-center" style={{ backgroundColor: `${s.color}15`, border: `1px solid ${s.color}30` }}>
                <span className="material-symbols-outlined text-[20px]" style={{ color: s.color }}>{s.icon}</span>
              </div>
              <div>
                <p className="mono-label text-[9px] uppercase font-bold text-[#1e4d3a]/60">{s.label}</p>
                <p className="font-['Source_Serif_4'] text-[20px] font-semibold text-[#082f27] leading-none mt-1">{s.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Header Card */}
        <section className="dashboard-card p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
            <div className="flex gap-4 items-start">
              <div className="w-14 h-14 rounded-full bg-[#C9A84C]/10 border border-[#C9A84C]/20 flex items-center justify-center text-[#C9A84C] font-['Source_Serif_4'] font-bold text-[20px] flex-shrink-0">{edit.editorAvatar}</div>
              <div>
                <div className="flex flex-wrap items-center gap-3 mb-2">
                  <h1 className="serif-title text-[24px] font-semibold text-[#082f27]">{edit.scholarName}</h1>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#C9A84C]/10 border border-[#C9A84C]/20 mono-label text-[10px] font-bold text-[#C9A84C] uppercase tracking-wide">{t("admin.pendingEdits.badge") || "PENDING EDIT"}</span>
                </div>
                <div className="flex flex-wrap gap-4 mt-2">
                  <span className="flex items-center gap-1.5 mono-label text-[11px] text-[#1e4d3a]/60"><span className="material-symbols-outlined text-[14px]">person</span> {t("admin.pendingEdits.editor") || "Editor"}: <strong>{edit.editor}</strong></span>
                  <span className="flex items-center gap-1.5 mono-label text-[11px] text-[#1e4d3a]/60"><span className="material-symbols-outlined text-[14px]">person_outline</span> {t("admin.pendingEdits.original") || "Original"}: <strong>{edit.originalContributor}</strong></span>
                  <span className="flex items-center gap-1.5 mono-label text-[11px] text-[#1e4d3a]/60"><span className="material-symbols-outlined text-[14px]">calendar_today</span> {edit.editDate}</span>
                  <span className="flex items-center gap-1.5 mono-label text-[11px] text-[#1e4d3a]/60"><span className="material-symbols-outlined text-[14px]">translate</span> {getLangName(edit.languageCode)}</span>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <button onClick={() => setShowRestrictModal(true)} className="flex items-center gap-2 px-4 py-2 rounded-[8px] border border-[#C9A84C] text-[#C9A84C] text-[11px] font-bold uppercase tracking-wide hover:bg-[#C9A84C] hover:text-white transition-colors cursor-pointer">
                <span className="material-symbols-outlined text-[16px]">shield_person</span> {t("admin.pendingEdits.action.restrict") || "Restrict User"}
              </button>
              <button onClick={() => setMode(mode === "reject" ? null : "reject")} className="flex items-center gap-2 px-4 py-2 rounded-[8px] border border-[#e96d5c] text-[#e96d5c] text-[11px] font-bold uppercase tracking-wide hover:bg-[#e96d5c] hover:text-white transition-colors cursor-pointer">
                <span className="material-symbols-outlined text-[16px]">cancel</span> {t("admin.pendingEdits.action.rejectAll") || "Reject All"}
              </button>
              <button onClick={() => setMode(mode === "approve" ? null : "approve")} className="flex items-center gap-2 px-4 py-2 rounded-[8px] bg-[#1e4d3a] border border-[#1e4d3a] text-white text-[11px] font-bold uppercase tracking-wide hover:bg-[#1e4d3a]/90 transition-colors cursor-pointer">
                <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1, 'wght' 400" }}>check_circle</span> {t("admin.pendingEdits.action.approve") || "Approve Accepted"}
              </button>
            </div>
          </div>
        </section>

        {/* Images Side-by-Side */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="dashboard-card p-5">
            <h2 className="serif-title text-[18px] font-semibold text-[#082f27] mb-4 flex items-center gap-2"><span className="material-symbols-outlined text-[20px]">history</span> {t("admin.pendingEdits.currentVersion") || "Current Version"}</h2>
            <div className="w-full aspect-square rounded-[12px] overflow-hidden bg-[#1e4d3a]/5 border-2 border-[#1e4d3a]/10">
              {edit.currentImage ? <img alt="Current" src={edit.currentImage} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-[#1e4d3a]/30"><span className="material-symbols-outlined text-[120px]">account_circle</span></div>}
            </div>
          </div>
          <div className="dashboard-card p-5 border-2 border-[#1e4d3a]">
            <div className="flex justify-between items-center mb-4">
              <h2 className="serif-title text-[18px] font-semibold text-[#082f27] flex items-center gap-2"><span className="material-symbols-outlined text-[20px]">edit</span> {t("admin.pendingEdits.proposedVersion") || "Proposed Version"}</h2>
              <div className="flex gap-2">
                <button onClick={() => acceptField("image")} className="w-8 h-8 flex items-center justify-center rounded-[6px] border border-[#1e4d3a]/20 text-[#1e4d3a] hover:bg-[#1e4d3a] hover:text-white transition-colors cursor-pointer"><span className="material-symbols-outlined text-[18px]">check</span></button>
                <button onClick={() => setRejectingFieldId("image")} className="w-8 h-8 flex items-center justify-center rounded-[6px] border border-[#e96d5c]/20 text-[#e96d5c] hover:bg-[#e96d5c] hover:text-white transition-colors cursor-pointer"><span className="material-symbols-outlined text-[18px]">close</span></button>
              </div>
            </div>
            <div className="w-full aspect-square rounded-[12px] overflow-hidden bg-[#1e4d3a]/5 border-2 border-[#1e4d3a]">
              <img alt="Proposed" src={edit.proposedImage} className="w-full h-full object-cover" />
            </div>
            {rejectingFieldId === "image" && (
               <div className="mt-4 p-4 rounded-[8px] border border-[#e96d5c]/30 bg-[#e96d5c]/5">
                  <p className="text-[12px] font-semibold text-[#e96d5c] mb-2">{t("admin.pendingEdits.rejectReason") || "Rejection Reason"}</p>
                  <textarea value={fieldRejectReason} onChange={(e) => setFieldRejectReason(e.target.value)} placeholder={t("admin.pendingEdits.rejectPlaceholder") || "Enter reason..."} className="w-full bg-[#fbf9f4] border border-[#1e4d3a]/15 rounded-[6px] px-3 py-2 text-[12px] font-medium text-[#1e4d3a] focus:outline-none focus:ring-2 focus:ring-[#1e4d3a]/20 min-h-[60px] resize-y" />
                  <div className="flex gap-2 mt-3 justify-end">
                    <button onClick={() => { setRejectingFieldId(null); setFieldRejectReason(""); }} className="px-3 py-1.5 rounded-[6px] border border-[#1e4d3a]/20 text-[#1e4d3a] text-[11px] font-bold uppercase tracking-wide hover:bg-[#1e4d3a]/5 transition-colors cursor-pointer">{t("admin.common.cancel") || "Cancel"}</button>
                    <button onClick={() => rejectField("image", fieldRejectReason)} className="px-3 py-1.5 rounded-[6px] bg-[#e96d5c] text-white text-[11px] font-bold uppercase tracking-wide hover:bg-[#e96d5c]/90 transition-colors cursor-pointer">{t("admin.pendingEdits.confirmReject") || "Confirm Reject"}</button>
                  </div>
               </div>
            )}
          </div>
        </div>

        {/* Changed Fields & Other Sections (Visual Only - Kept identical structure but Tailwind classes) */}
        <div className="space-y-6">
          {edit.changedFields.length > 0 && (
            <div className="dashboard-card p-5">
              <h2 className="serif-title text-[18px] font-semibold text-[#082f27] mb-4 flex items-center gap-2"><span className="material-symbols-outlined text-[20px]">edit_note</span> {t("admin.pendingEdits.changedFields") || "Changed Fields"} ({edit.changedFields.length})</h2>
              {edit.changedFields.map((field) => {
                if (field.fieldName === "image") return null;
                const isBio = field.fieldName === "biography";
                return (
                  <div key={field.id} className="border border-[#1e4d3a]/10 rounded-[10px] overflow-hidden mb-4 last:mb-0">
                    <div className="bg-[#1e4d3a]/5 px-4 py-2 border-b border-[#1e4d3a]/10"><span className="text-[12px] font-semibold text-[#082f27] flex items-center gap-2"><span className="material-symbols-outlined text-[16px]">label</span> {field.fieldLabel}</span></div>
                    <div className="p-4">
                      <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 p-3 rounded-[8px] bg-[#e96d5c]/5 border border-[#e96d5c]/20 text-[#e96d5c]">
                          <div className="mono-label text-[9px] uppercase font-bold mb-2 flex items-center gap-1.5"><span className="material-symbols-outlined text-[14px]">delete</span> {t("admin.pendingEdits.original") || "Original"}</div>
                          {isBio ? <BiographyRenderer content={field.originalValue} lang={edit.languageCode.toLowerCase()} /> : <span className="text-[13px] leading-relaxed">{field.originalValue}</span>}
                        </div>
                        <div className="flex-1 p-3 rounded-[8px] bg-[#1e4d3a]/5 border border-[#1e4d3a]/20 text-[#1e4d3a]">
                          <div className="mono-label text-[9px] uppercase font-bold mb-2 flex items-center gap-1.5"><span className="material-symbols-outlined text-[14px]">add</span> {t("admin.pendingEdits.proposed") || "Proposed"}</div>
                          {isBio ? <BiographyRenderer content={field.proposedValue} lang={edit.languageCode.toLowerCase()} /> : <span className="text-[13px] leading-relaxed">{field.proposedValue}</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          
          {/* Work, Media, Reference, Discipline Changes sections remain visually identical using Tailwind equivalents of the old inline styles */}
          {edit.workChanges.length > 0 && (
            <div className="dashboard-card p-5">
              <h2 className="serif-title text-[18px] font-semibold text-[#082f27] mb-4 flex items-center gap-2"><span className="material-symbols-outlined text-[20px]">menu_book</span> {t("admin.pendingEdits.workChanges") || "Work Changes"} ({edit.workChanges.length})</h2>
              {edit.workChanges.map((work) => (
                <div key={work.id} className="border border-[#1e4d3a]/10 rounded-[10px] overflow-hidden mb-4 last:mb-0">
                  <div className="bg-[#1e4d3a]/5 px-4 py-2 border-b border-[#1e4d3a]/10">
                    <span className={`inline-block px-2 py-0.5 rounded-[4px] mono-label text-[9px] font-bold uppercase tracking-wide ${work.type === 'added' ? 'bg-[#1e4d3a]/10 text-[#1e4d3a]' : 'bg-[#3d6b96]/10 text-[#3d6b96]'}`}>
                      <span className="material-symbols-outlined text-[12px] mr-1">{work.type === 'added' ? 'add' : 'edit'}</span> {work.type}
                    </span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead><tr className="bg-[#1e4d3a]/[0.02] border-b border-[#1e4d3a]/10">
                        <th className="mono-label text-[9px] uppercase font-bold text-[#1e4d3a]/60 px-4 py-3 w-[60px]">{t("admin.pendingEdits.colType") || "Type"}</th>
                        <th className="mono-label text-[9px] uppercase font-bold text-[#1e4d3a]/60 px-4 py-3">{t("admin.pendingEdits.colTitle") || "Title"}</th>
                        <th className="mono-label text-[9px] uppercase font-bold text-[#1e4d3a]/60 px-4 py-3">{t("admin.pendingEdits.colYear") || "Year"}</th>
                        <th className="mono-label text-[9px] uppercase font-bold text-[#1e4d3a]/60 px-4 py-3">{t("admin.pendingEdits.colFormat") || "Format"}</th>
                        <th className="mono-label text-[9px] uppercase font-bold text-[#1e4d3a]/60 px-4 py-3">{t("admin.pendingEdits.colAccess") || "Access"}</th>
                      </tr></thead>
                      <tbody className="divide-y divide-[#1e4d3a]/[0.06]">
                        {work.original && (
                          <tr className="bg-[#e96d5c]/5">
                            <td className="px-4 py-3"><span className="inline-block px-2 py-0.5 rounded-[4px] bg-[#e96d5c]/10 text-[#e96d5c] mono-label text-[9px] font-bold uppercase border border-[#e96d5c]/20">Original</span></td>
                            <td className="px-4 py-3 text-[13px] font-semibold italic line-through text-[#e96d5c]">{work.original.title}</td>
                            <td className="px-4 py-3 mono-label text-[12px] text-[#1e4d3a]/70">{work.original.year}</td>
                            <td className="px-4 py-3"><span className="inline-block px-2 py-0.5 rounded-[4px] bg-[#1e4d3a]/5 border border-[#1e4d3a]/10 mono-label text-[10px] text-[#1e4d3a]/70">{work.original.format}</span></td>
                            <td className="px-4 py-3">{work.original.access ? <a href={work.original.access} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 mono-label text-[10px] font-bold text-[#1e4d3a] hover:text-[#C9A84C] underline decoration-dotted underline-offset-2"><span className="material-symbols-outlined text-[12px]">open_in_new</span> View</a> : <span className="text-[#1e4d3a]/30">—</span>}</td>
                          </tr>
                        )}
                        <tr className="bg-[#1e4d3a]/5">
                          <td className="px-4 py-3"><span className="inline-block px-2 py-0.5 rounded-[4px] bg-[#1e4d3a]/10 text-[#1e4d3a] mono-label text-[9px] font-bold uppercase border border-[#1e4d3a]/20">{work.type === 'added' ? 'New' : 'Proposed'}</span></td>
                          <td className="px-4 py-3 text-[13px] font-semibold italic text-[#082f27]">{work.proposed.title}</td>
                          <td className="px-4 py-3 mono-label text-[12px] text-[#1e4d3a]/70">{work.proposed.year}</td>
                          <td className="px-4 py-3"><span className="inline-block px-2 py-0.5 rounded-[4px] bg-[#1e4d3a]/5 border border-[#1e4d3a]/10 mono-label text-[10px] text-[#1e4d3a]/70">{work.proposed.format}</span></td>
                          <td className="px-4 py-3">{work.proposed.access ? <a href={work.proposed.access} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 mono-label text-[10px] font-bold text-[#1e4d3a] hover:text-[#C9A84C] underline decoration-dotted underline-offset-2"><span className="material-symbols-outlined text-[12px]">open_in_new</span> View</a> : <span className="text-[#1e4d3a]/30">—</span>}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          )}

          {edit.referenceChanges.length > 0 && (
            <div className="dashboard-card p-5">
              <h2 className="serif-title text-[18px] font-semibold text-[#082f27] mb-4 flex items-center gap-2"><span className="material-symbols-outlined text-[20px]">menu_book</span> {t("admin.pendingEdits.refChanges") || "Reference Changes"} ({edit.referenceChanges.length})</h2>
              {edit.referenceChanges.map((ref) => (
                <div key={ref.id} className={`border rounded-[10px] overflow-hidden mb-4 last:mb-0 ${ref.status === 'accepted' ? 'border-[#1e4d3a]' : ref.status === 'rejected' ? 'border-[#e96d5c]' : 'border-[#1e4d3a]/10'}`}>
                  <div className="bg-[#1e4d3a]/5 px-4 py-2 border-b border-[#1e4d3a]/10 flex justify-between items-center">
                    <span className={`inline-block px-2 py-0.5 rounded-[4px] mono-label text-[9px] font-bold uppercase tracking-wide ${ref.type === 'added' ? 'bg-[#1e4d3a]/10 text-[#1e4d3a]' : 'bg-[#3d6b96]/10 text-[#3d6b96]'}`}>
                      <span className="material-symbols-outlined text-[12px] mr-1">{ref.type === 'added' ? 'add' : 'edit'}</span> {ref.type}
                    </span>
                    <div className="flex gap-2">
                      {ref.status === "pending" && (<>
                        <button onClick={() => acceptReference(ref.id)} className="w-7 h-7 flex items-center justify-center rounded-[6px] border border-[#1e4d3a]/20 text-[#1e4d3a] hover:bg-[#1e4d3a] hover:text-white transition-colors cursor-pointer"><span className="material-symbols-outlined text-[16px]">check</span></button>
                        <button onClick={() => rejectReference(ref.id)} className="w-7 h-7 flex items-center justify-center rounded-[6px] border border-[#e96d5c]/20 text-[#e96d5c] hover:bg-[#e96d5c] hover:text-white transition-colors cursor-pointer"><span className="material-symbols-outlined text-[16px]">close</span></button>
                      </>)}
                      {ref.status !== "pending" && (
                        <button onClick={() => setEdit((prev) => prev ? { ...prev, referenceChanges: prev.referenceChanges.map((r) => r.id === ref.id ? { ...r, status: "pending" } : r) } : null)} className="w-7 h-7 flex items-center justify-center rounded-[6px] border border-[#1e4d3a]/20 text-[#1e4d3a] hover:bg-[#1e4d3a] hover:text-white transition-colors cursor-pointer"><span className="material-symbols-outlined text-[16px]">undo</span></button>
                      )}
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead><tr className="bg-[#1e4d3a]/[0.02] border-b border-[#1e4d3a]/10">
                        <th className="mono-label text-[9px] uppercase font-bold text-[#1e4d3a]/60 px-4 py-3 w-[60px]">{t("admin.pendingEdits.colType") || "Type"}</th>
                        <th className="mono-label text-[9px] uppercase font-bold text-[#1e4d3a]/60 px-4 py-3">{t("admin.pendingEdits.colTitle") || "Title"}</th>
                        <th className="mono-label text-[9px] uppercase font-bold text-[#1e4d3a]/60 px-4 py-3">{t("admin.pendingEdits.colCitation") || "Citation"}</th>
                        <th className="mono-label text-[9px] uppercase font-bold text-[#1e4d3a]/60 px-4 py-3">{t("admin.pendingEdits.colUrl") || "URL"}</th>
                      </tr></thead>
                      <tbody className="divide-y divide-[#1e4d3a]/[0.06]">
                        {ref.original && (
                          <tr className="bg-[#e96d5c]/5">
                            <td className="px-4 py-3"><span className="inline-block px-2 py-0.5 rounded-[4px] bg-[#e96d5c]/10 text-[#e96d5c] mono-label text-[9px] font-bold uppercase border border-[#e96d5c]/20">Original</span></td>
                            <td className="px-4 py-3 text-[13px] font-semibold italic line-through text-[#e96d5c]">{ref.original.title}</td>
                            <td className="px-4 py-3 text-[12px] text-[#1e4d3a]/70">{ref.original.citation}</td>
                            <td className="px-4 py-3">{ref.original.url ? <a href={ref.original.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 mono-label text-[10px] font-bold text-[#1e4d3a] hover:text-[#C9A84C] underline decoration-dotted underline-offset-2"><span className="material-symbols-outlined text-[12px]">open_in_new</span> View</a> : <span className="text-[#1e4d3a]/30">—</span>}</td>
                          </tr>
                        )}
                        <tr className="bg-[#1e4d3a]/5">
                          <td className="px-4 py-3"><span className="inline-block px-2 py-0.5 rounded-[4px] bg-[#1e4d3a]/10 text-[#1e4d3a] mono-label text-[9px] font-bold uppercase border border-[#1e4d3a]/20">{ref.type === 'added' ? 'New' : 'Proposed'}</span></td>
                          <td className="px-4 py-3 text-[13px] font-semibold italic text-[#082f27]">{ref.proposed.title}</td>
                          <td className="px-4 py-3 text-[12px] text-[#1e4d3a]/70">{ref.proposed.citation}</td>
                          <td className="px-4 py-3">{ref.proposed.url ? <a href={ref.proposed.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 mono-label text-[10px] font-bold text-[#1e4d3a] hover:text-[#C9A84C] underline decoration-dotted underline-offset-2"><span className="material-symbols-outlined text-[12px]">open_in_new</span> View</a> : <span className="text-[#1e4d3a]/30">—</span>}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          )}

          {edit.mediaChanges.length > 0 && (
            <div className="dashboard-card p-5">
              <h2 className="serif-title text-[18px] font-semibold text-[#082f27] mb-4 flex items-center gap-2"><span className="material-symbols-outlined text-[20px]">folder_open</span> {t("admin.pendingEdits.mediaChanges") || "Media Changes"} ({edit.mediaChanges.length})</h2>
              {edit.mediaChanges.map((media) => (
                <div key={media.id} className="border border-[#1e4d3a]/10 rounded-[10px] overflow-hidden mb-4 last:mb-0">
                  <div className="bg-[#1e4d3a]/5 px-4 py-2 border-b border-[#1e4d3a]/10">
                    <span className={`inline-block px-2 py-0.5 rounded-[4px] mono-label text-[9px] font-bold uppercase tracking-wide ${media.type === 'added' ? 'bg-[#1e4d3a]/10 text-[#1e4d3a]' : 'bg-[#3d6b96]/10 text-[#3d6b96]'}`}>
                      <span className="material-symbols-outlined text-[12px] mr-1">{media.type === 'added' ? 'add' : 'edit'}</span> {media.type}
                    </span>
                  </div>
                  <div className={`grid gap-4 p-4 ${media.original ? 'md:grid-cols-2' : ''}`}>
                    {media.original && (
                      <div className="p-3 rounded-[8px] bg-[#e96d5c]/5 border border-[#e96d5c]/20">
                        <div className="flex gap-3">
                          <div className="w-10 h-10 rounded-[8px] bg-[#e96d5c]/10 flex items-center justify-center flex-shrink-0"><span className="material-symbols-outlined text-[20px] text-[#e96d5c]">{media.original.icon}</span></div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-semibold text-[#e96d5c] truncate line-through">{media.original.title}</p>
                            <p className="text-[11px] text-[#1e4d3a]/70 mt-1 line-clamp-2">{media.original.description}</p>
                            <p className="mono-label text-[9px] text-[#1e4d3a]/50 mt-1">{media.original.meta} · {media.original.type}</p>
                          </div>
                        </div>
                      </div>
                    )}
                    <div className="p-3 rounded-[8px] bg-[#1e4d3a]/5 border border-[#1e4d3a]/20">
                      <div className="flex gap-3">
                        <div className="w-10 h-10 rounded-[8px] bg-[#1e4d3a]/10 flex items-center justify-center flex-shrink-0"><span className="material-symbols-outlined text-[20px] text-[#1e4d3a]">{media.proposed.icon}</span></div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-semibold text-[#082f27] truncate">{media.proposed.title}</p>
                          <p className="text-[11px] text-[#1e4d3a]/70 mt-1 line-clamp-2">{media.proposed.description}</p>
                          <p className="mono-label text-[9px] text-[#1e4d3a]/50 mt-1">{media.proposed.meta} · {media.proposed.type}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {edit.disciplineChanges.length > 0 && (
            <div className="dashboard-card p-5">
              <h2 className="serif-title text-[18px] font-semibold text-[#082f27] mb-4 flex items-center gap-2"><span className="material-symbols-outlined text-[20px]">category</span> {t("admin.pendingEdits.disciplineChanges") || "Discipline Changes"} ({edit.disciplineChanges.length})</h2>
              <div className="space-y-4">
                {edit.disciplineChanges.filter(d => d.type === "added").length > 0 && (
                  <div>
                    <p className="mono-label text-[9px] uppercase font-bold text-[#1e4d3a]/60 mb-2 flex items-center gap-1.5"><span className="material-symbols-outlined text-[14px]">add_circle</span> {t("admin.pendingEdits.newDisciplines") || "PROPOSED NEW DISCIPLINES"}</p>
                    <div className="flex flex-wrap gap-2">
                      {edit.disciplineChanges.filter(d => d.type === "added").map((d) => (
                        <span key={d.id} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#1e4d3a] text-white text-[11px] font-semibold"><span className="material-symbols-outlined text-[14px]">add</span> {d.label}</span>
                      ))}
                    </div>
                  </div>
                )}
                {edit.disciplineChanges.filter(d => d.type === "removed").length > 0 && (
                  <div className="border-t border-[#1e4d3a]/10 pt-4">
                    <p className="mono-label text-[9px] uppercase font-bold text-[#1e4d3a]/60 mb-2 flex items-center gap-1.5"><span className="material-symbols-outlined text-[14px]">remove_circle</span> {t("admin.pendingEdits.removedDisciplines") || "PROPOSED REMOVALS"}</p>
                    <div className="flex flex-wrap gap-2">
                      {edit.disciplineChanges.filter(d => d.type === "removed").map((d) => (
                        <span key={d.id} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#e96d5c] text-white text-[11px] font-semibold line-through"><span className="material-symbols-outlined text-[14px]">remove</span> {d.label}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── Modals (Translated) ── */}
        {showRestrictModal && !confirmAction && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#082f27]/40 backdrop-blur-sm" onClick={() => setShowRestrictModal(false)}>
            <div className="dashboard-card w-full max-w-lg p-6 relative" onClick={(e) => e.stopPropagation()}>
              <button onClick={() => setShowRestrictModal(false)} className={`absolute top-4 ${isRTL ? 'left-4' : 'right-4'} p-1.5 rounded-full hover:bg-[#1e4d3a]/10 transition-colors cursor-pointer`}><span className="material-symbols-outlined text-[20px] text-[#1e4d3a]">close</span></button>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-full bg-[#C9A84C]/10 border border-[#C9A84C]/20 flex items-center justify-center text-[#C9A84C] font-['Source_Serif_4'] font-bold text-[20px] flex-shrink-0">{edit.editorAvatar}</div>
                <div>
                  <h3 className="serif-title text-[20px] font-semibold text-[#082f27]">{t("admin.pendingEdits.modal.restrict.title") || "Restrict User"}</h3>
                  <p className="text-[12px] text-[#1e4d3a]/60 mt-1">{edit.editor} {isRTL ? "عدّل" : "edited"} "{edit.scholarName}"</p>
                </div>
              </div>
              <p className="text-[13px] text-[#1e4d3a]/80 leading-relaxed mb-6">{t("admin.pendingEdits.modal.restrict.desc") || "Choose an action. This will automatically reject this edit submission as well."}</p>
              <div className="space-y-3 mb-6">
                <button onClick={() => setConfirmAction({ type: 'revoke' })} className="w-full flex items-start gap-4 p-4 rounded-[8px] border border-[#C9A84C]/30 bg-[#C9A84C]/[0.05] hover:bg-[#C9A84C]/10 transition-colors cursor-pointer text-left">
                  <div className="w-8 h-8 rounded-full bg-[#C9A84C] text-white flex items-center justify-center flex-shrink-0 mt-0.5"><span className="material-symbols-outlined text-[18px]">person_off</span></div>
                  <div><p className="text-[13px] font-semibold text-[#082f27] mb-1">{t("admin.pendingEdits.modal.restrict.revoke") || "Revoke Contribution Access"}</p><p className="text-[11px] text-[#1e4d3a]/60 leading-relaxed">{t("admin.pendingEdits.modal.restrict.revokeDesc") || "They can still log in, but cannot submit new edits. (Recommended for low-quality edits)"}</p></div>
                </button>
                <button onClick={() => setConfirmAction({ type: 'ban' })} className="w-full flex items-start gap-4 p-4 rounded-[8px] border border-[#e96d5c]/30 bg-[#e96d5c]/[0.05] hover:bg-[#e96d5c]/10 transition-colors cursor-pointer text-left">
                  <div className="w-8 h-8 rounded-full bg-[#e96d5c] text-white flex items-center justify-center flex-shrink-0 mt-0.5"><span className="material-symbols-outlined text-[18px]">block</span></div>
                  <div><p className="text-[13px] font-semibold text-[#082f27] mb-1">{t("admin.pendingEdits.modal.restrict.ban") || "Ban Account Completely"}</p><p className="text-[11px] text-[#1e4d3a]/60 leading-relaxed">{t("admin.pendingEdits.modal.restrict.banDesc") || "They will be completely locked out of the platform. (Use for spam, abuse, or severe violations)"}</p></div>
                </button>
              </div>
              <div className="flex justify-end"><button onClick={() => setShowRestrictModal(false)} className="px-5 py-2 rounded-[6px] border border-[#1e4d3a]/20 text-[#1e4d3a] text-[12px] font-bold uppercase tracking-wide hover:bg-[#1e4d3a]/5 transition-colors cursor-pointer">{t("admin.common.cancel") || "Cancel"}</button></div>
            </div>
          </div>
        )}

        {confirmAction && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#082f27]/40 backdrop-blur-sm" onClick={() => setConfirmAction(null)}>
            <div className="dashboard-card w-full max-w-md p-6 relative" onClick={(e) => e.stopPropagation()}>
              <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-5 ${confirmAction.type === 'ban' ? 'bg-[#e96d5c] text-white' : 'bg-[#C9A84C] text-white'}`}><span className="material-symbols-outlined text-[28px]" style={{ fontVariationSettings: "'FILL' 1, 'wght' 400" }}>{confirmAction.type === 'ban' ? "block" : "person_off"}</span></div>
              <h3 className="serif-title text-[20px] font-semibold text-[#082f27] mb-3">{t("admin.pendingEdits.modal.confirm.title") || "Confirm Action"}</h3>
              <p className="text-[13px] text-[#1e4d3a]/80 leading-relaxed mb-6">
                {t("admin.pendingEdits.modal.confirm.desc") || "This will"} <strong>{confirmAction.type === 'ban' ? (t("admin.pendingEdits.modal.confirm.ban") || "BAN") : (t("admin.pendingEdits.modal.confirm.revoke") || "REVOKE CONTRIBUTION ACCESS FOR")}</strong> {edit.editor} {t("admin.pendingEdits.modal.confirm.andReject") || "and automatically REJECT the edit for"} "{edit.scholarName}".<br/><br/><strong className="text-[#e96d5c]">{t("admin.pendingEdits.modal.confirm.warning") || "This action cannot be undone from this screen."}</strong>
              </p>
              <div className="flex gap-3 justify-end">
                <button onClick={() => setConfirmAction(null)} className="px-5 py-2 rounded-[6px] border border-[#1e4d3a]/20 text-[#1e4d3a] text-[12px] font-bold uppercase tracking-wide hover:bg-[#1e4d3a]/5 transition-colors cursor-pointer">{t("admin.common.goBack") || "Go Back"}</button>
                <button onClick={executeRestrictionAndReject} className={`px-5 py-2 rounded-[6px] text-white text-[12px] font-bold uppercase tracking-wide transition-colors cursor-pointer ${confirmAction.type === 'ban' ? 'bg-[#e96d5c] hover:bg-[#e96d5c]/90' : 'bg-[#C9A84C] hover:bg-[#C9A84C]/90'}`}>{t("admin.pendingEdits.modal.confirm.button") || "Confirm & Reject"}</button>
              </div>
            </div>
          </div>
        )}

        {mode && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#082f27]/40 backdrop-blur-sm" onClick={() => { setMode(null); setNote(""); setApproveReason(""); }}>
            <div className="dashboard-card w-full max-w-lg p-6 relative" onClick={(e) => e.stopPropagation()}>
              <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-5 ${mode === 'approve' ? 'bg-[#1e4d3a] text-white' : 'bg-[#e96d5c] text-white'}`}>
                <span className="material-symbols-outlined text-[28px]" style={{ fontVariationSettings: "'FILL' 1, 'wght' 400" }}>{mode === 'approve' ? "check_circle" : "cancel"}</span>
              </div>
              <h3 className="serif-title text-[20px] font-semibold text-[#082f27] mb-3">{mode === 'approve' ? (t("admin.pendingEdits.modal.approve.title") || "Approve Accepted Changes") : (t("admin.pendingEdits.modal.reject.title") || "Reject All Changes")}</h3>
              <p className="text-[13px] text-[#1e4d3a]/80 leading-relaxed mb-6">
                {mode === 'approve' ? (t("admin.pendingEdits.modal.approve.desc") || "Are you sure you want to approve this edit? Any rejected images or references will be excluded.") : (t("admin.pendingEdits.modal.reject.desc") || "Are you sure you want to reject all changes? The editor will be notified.")}
                {mode === 'reject' && <><br /><strong className="text-[#e96d5c]">{t("admin.pendingEdits.modal.reject.warning") || "This action cannot be undone."}</strong></>}
              </p>
              {mode === "approve" && (
                <div className="mb-6">
                  <label className="mono-label text-[9px] uppercase font-bold text-[#1e4d3a]/60 mb-1.5 block">{t("admin.pendingEdits.modal.approve.notes") || "APPROVAL NOTES (Optional)"}</label>
                  <textarea value={approveReason} onChange={(e) => setApproveReason(e.target.value)} placeholder={t("admin.pendingEdits.modal.approve.notesPlaceholder") || "Add any notes about this approval..."} className="w-full bg-[#fbf9f4] border border-[#1e4d3a]/15 rounded-[6px] px-3 py-2 text-[12px] font-medium text-[#1e4d3a] focus:outline-none focus:ring-2 focus:ring-[#1e4d3a]/20 min-h-[80px] resize-y" />
                </div>
              )}
              {mode === "reject" && (
                <div className="mb-6">
                  <label className="mono-label text-[9px] uppercase font-bold text-[#1e4d3a]/60 mb-1.5 block">{t("admin.pendingEdits.modal.reject.reason") || "REJECTION REASON *"}</label>
                  <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder={t("admin.pendingEdits.modal.reject.reasonPlaceholder") || "Please provide a reason for rejection..."} className="w-full bg-[#fbf9f4] border border-[#1e4d3a]/15 rounded-[6px] px-3 py-2 text-[12px] font-medium text-[#1e4d3a] focus:outline-none focus:ring-2 focus:ring-[#1e4d3a]/20 min-h-[80px] resize-y" />
                </div>
              )}
              <div className="flex gap-3 justify-end">
                <button onClick={() => { setMode(null); setNote(""); setApproveReason(""); }} className="px-5 py-2 rounded-[6px] border border-[#1e4d3a]/20 text-[#1e4d3a] text-[12px] font-bold uppercase tracking-wide hover:bg-[#1e4d3a]/5 transition-colors cursor-pointer">{t("admin.common.cancel") || "Cancel"}</button>
                <button onClick={handleConfirm} disabled={mode === "reject" && !note.trim()} className={`px-5 py-2 rounded-[6px] text-white text-[12px] font-bold uppercase tracking-wide transition-colors ${mode === 'approve' ? 'bg-[#1e4d3a] hover:bg-[#1e4d3a]/90 cursor-pointer' : (note.trim() ? 'bg-[#e96d5c] hover:bg-[#e96d5c]/90 cursor-pointer' : 'bg-[#1e4d3a]/20 cursor-not-allowed')}`}>
                  {mode === 'approve' ? (t("admin.pendingEdits.modal.approve.confirm") || "Confirm Approve") : (t("admin.pendingEdits.modal.reject.confirm") || "Confirm Reject")}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}