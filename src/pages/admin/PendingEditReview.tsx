import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useLang } from "../../context/LanguageContext";
import { adminApi } from "../../api/adminApi";

/* ------------------------------------------------------------------ */
/*  Design tokens — Oulamnauna admin palette                          */
/* ------------------------------------------------------------------ */
const colors = {
  creamLight: "#fcfaf5",
  creamMid: "#f6efdc",
  creamDark: "#e5d5a8",
  forestGreen: "#0b4335",
  amber: "#b8860b",
  red: "#8b2c2c",
};

const fonts = {
  headline: "'Hanken Grotesk', sans-serif",
  body: "'Inter', sans-serif",
  label: "'JetBrains Mono', monospace",
};

const cardStyle: React.CSSProperties = {
  backgroundColor: colors.creamLight,
  borderRadius: 12,
  boxShadow: "0px 4px 20px rgba(11, 67, 53, 0.08)",
  border: `1px solid ${colors.forestGreen}`,
};

/* ------------------------------------------------------------------ */
/*  Reusable UI Components                                             */
/* ------------------------------------------------------------------ */
const Icon: React.FC<{ name: string; size?: number; filled?: boolean }> = ({
  name,
  size = 18,
  filled = false,
}) => (
  <span
    className="material-symbols-outlined"
    style={{
      fontSize: size,
      lineHeight: 1,
      fontVariationSettings: `'FILL' ${filled ? 1 : 0}, 'wght' 400, 'GRAD' 0, 'opsz' 24`,
    }}
  >
    {name}
  </span>
);

const ActionButton: React.FC<{
  icon: string;
  color: string;
  hoverBg: string;
  hoverColor: string;
  onClick: () => void;
  title: string;
  filled?: boolean;
}> = ({ icon, color, hoverBg, hoverColor, onClick, title, filled }) => {
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={onClick}
      title={title}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        width: 30, height: 30, borderRadius: 6,
        border: `1px solid ${color}`,
        backgroundColor: hover ? hoverBg : (filled ? color : "transparent"),
        color: hover ? hoverColor : (filled ? colors.creamLight : color),
        cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
        transition: "all 0.15s"
      }}
    >
      <Icon name={icon} size={16} filled={filled} />
    </button>
  );
};

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
type FieldStatus = "pending" | "accepted" | "rejected";

interface EditField {
  id: string;
  fieldName: string;
  fieldLabel: string;
  originalValue: string;
  proposedValue: string;
  status: FieldStatus;
  rejectReason?: string;
}

interface WorkChange {
  id: string;
  type: "added" | "modified";
  original?: { id: string; title: string; year: string; format: string; access: string | null; };
  proposed: { id: string; title: string; year: string; format: string; access: string | null; };
  status: FieldStatus;
}

interface MediaChange {
  id: string;
  type: "added" | "modified";
  original?: { id: string; title: string; meta: string; type: string; icon: string; color: string; description: string; access?: string | null; };
  proposed: { id: string; title: string; meta: string; type: string; icon: string; color: string; description: string; access?: string | null; };
  status: FieldStatus;
}

interface ReferenceChange {
  id: string;
  referenceId: number;
  type: "added" | "modified";
  original?: { id: string; title: string; citation: string; url: string | null };
  proposed: { id: string; title: string; citation: string; url: string | null };
  status: FieldStatus;
}

interface DisciplineChange {
  id: string;
  label: string;
  type: "added" | "removed";
  status: FieldStatus;
}

interface ScholarEdit {
  id: string;
  scholarId: string;
  scholarName: string;
  editor: string;
  editorId: number | null; // ✅ ADDED: For Ban/Restrict
  editorAvatar: string;
  editDate: string;
  editType: string;
  originalContributor: string;
  language: "EN" | "AR" | "FR";
  changedFields: EditField[];
  workChanges: WorkChange[];
  mediaChanges: MediaChange[];
  referenceChanges: ReferenceChange[];
  disciplineChanges: DisciplineChange[];
  editorNote: string;
  currentImage?: string;
  proposedImage?: string;
  proposedImageId?: number;
}

/* ------------------------------------------------------------------ */
/*  Helper: Transform Backend Data                                    */
/* ------------------------------------------------------------------ */
const transformBackendToEdit = (item: any): ScholarEdit => {
  const proposed = item.proposed;
  const current = item.current || {};

  const changedFields: EditField[] = [];
  
  const formatScholarDate = (dateObj: any) => {
    if (!dateObj) return "";
    return dateObj.raw_text || (dateObj.year ? `${dateObj.year} ${dateObj.calendar}`.trim() : "");
  };

  if (proposed.canonical_name !== current.canonical_name) {
    changedFields.push({ id: "name", fieldName: "canonical_name", fieldLabel: "Name", originalValue: current.canonical_name || "", proposedValue: proposed.canonical_name || "", status: "pending" });
  }
  if (proposed.biography !== current.biography) {
    changedFields.push({ id: "bio", fieldName: "biography", fieldLabel: "Biography", originalValue: current.biography || "", proposedValue: proposed.biography || "", status: "pending" });
  }
  if (proposed.regions?.name !== current.regions?.name) {
    changedFields.push({ id: "region", fieldName: "region", fieldLabel: "Region", originalValue: current.regions?.name || "", proposedValue: proposed.regions?.name || "", status: "pending" });
  }

  const currentAliases = (current.scholar_aliases || []).map((a: any) => a.alias_name).sort();
  const proposedAliases = (proposed.scholar_aliases || []).map((a: any) => a.alias_name).sort();
  if (JSON.stringify(currentAliases) !== JSON.stringify(proposedAliases)) {
    changedFields.push({ id: "aliases", fieldName: "scholar_aliases", fieldLabel: "Aliases", originalValue: currentAliases.join(", ") || "None", proposedValue: proposedAliases.join(", ") || "None", status: "pending" });
  }

  const currentBirth = (current.scholar_dates || []).find((d: any) => d.date_type === "birth");
  const proposedBirth = (proposed.scholar_dates || []).find((d: any) => d.date_type === "birth");
  const currentDeath = (current.scholar_dates || []).find((d: any) => d.date_type === "death");
  const proposedDeath = (proposed.scholar_dates || []).find((d: any) => d.date_type === "death");

  const currentBirthStr = formatScholarDate(currentBirth);
  const proposedBirthStr = formatScholarDate(proposedBirth);
  const currentDeathStr = formatScholarDate(currentDeath);
  const proposedDeathStr = formatScholarDate(proposedDeath);

  if (currentBirthStr !== proposedBirthStr || currentDeathStr !== proposedDeathStr) {
    changedFields.push({
      id: "dates", fieldName: "scholar_dates", fieldLabel: "Birth/Death Dates",
      originalValue: currentBirthStr || currentDeathStr ? `Born: ${currentBirthStr || "Unknown"}, Died: ${currentDeathStr || "Unknown"}` : "No dates",
      proposedValue: proposedBirthStr || proposedDeathStr ? `Born: ${proposedBirthStr || "Unknown"}, Died: ${proposedDeathStr || "Unknown"}` : "No dates",
      status: "pending"
    });
  }

  const currentCentury = `${current.century_gregorian_start || ""}-${current.century_gregorian_end || ""}`.replace(/^-+|-+$/g, "");
  const proposedCentury = `${proposed.century_gregorian_start || ""}-${proposed.century_gregorian_end || ""}`.replace(/^-+|-+$/g, "");
  if (currentCentury !== proposedCentury) {
    changedFields.push({ id: "century", fieldName: "century", fieldLabel: "Century", originalValue: currentCentury || "Unknown", proposedValue: proposedCentury || "Unknown", status: "pending" });
  }

  const currentImg = current.image_url || current.img_versions?.find((img: any) => img.status === "approved")?.image_url;
  const proposedImg = proposed.img_versions?.[0]?.image_url || proposed.image_url;
  const proposedImgId = proposed.img_versions?.[0]?.img_version_id;
  
  if (currentImg !== proposedImg) {
    changedFields.push({ id: "image", fieldName: "image", fieldLabel: "Profile Image", originalValue: currentImg ? "Image exists" : "No image", proposedValue: proposedImg ? "Image exists" : "No image", status: "pending" });
  }

  const currentRelationships = (current.scholar_relationships_as_source || []).map((r: any) => ({ type: r.relation_type, name: r.related_scholar_version?.canonical_name }));
  const proposedRelationships = (proposed.scholar_relationships_as_source || []).map((r: any) => ({ type: r.relation_type, name: r.related_scholar_version?.canonical_name }));
  if (JSON.stringify(currentRelationships) !== JSON.stringify(proposedRelationships)) {
    const formatRel = (rels: any[]) => rels.map(r => `${r.type}: ${r.name}`).join("; ") || "None";
    changedFields.push({ id: "relationships", fieldName: "scholar_relationships", fieldLabel: "Relationships", originalValue: formatRel(currentRelationships), proposedValue: formatRel(proposedRelationships), status: "pending" });
  }

  const workChanges: WorkChange[] = [];
  const currentWorks = current.scholar_works || [];
  const proposedWorks = proposed.scholar_works || [];
  proposedWorks.forEach((pw: any) => {
    const cw = currentWorks.find((w: any) => w.work_id === pw.work_id);
    if (!cw) {
      workChanges.push({ id: `w_add_${pw.work_id}`, type: "added", proposed: { id: pw.work_id.toString(), title: pw.title, year: pw.year?.toString() || "", format: pw.format, access: pw.media_url || pw.file_path }, status: "pending" });
    } else if (cw.title !== pw.title || cw.year !== pw.year || cw.format !== pw.format) {
      workChanges.push({ id: `w_mod_${pw.work_id}`, type: "modified", original: { id: cw.work_id.toString(), title: cw.title, year: cw.year?.toString() || "", format: cw.format, access: cw.media_url || cw.file_path }, proposed: { id: pw.work_id.toString(), title: pw.title, year: pw.year?.toString() || "", format: pw.format, access: pw.media_url || pw.file_path }, status: "pending" });
    }
  });

  const mediaChanges: MediaChange[] = [];
  const currentMedia = current.media || [];
  const proposedMedia = proposed.media || [];
  proposedMedia.forEach((pm: any) => {
    const cm = currentMedia.find((m: any) => m.media_id === pm.media_id);
    const getIcon = (type: string) => type?.includes("video") ? "movie" : type?.includes("audio") ? "graphic_eq" : "article";
    if (!cm) {
      mediaChanges.push({ id: `m_add_${pm.media_id}`, type: "added", proposed: { id: pm.media_id.toString(), title: pm.title || pm.file_name || "Untitled", meta: pm.file_type || "file", type: pm.source_type === "upload" ? "Upload" : "Link", icon: getIcon(pm.file_type), color: colors.creamMid, description: pm.description || "", access: pm.media_url || pm.file_path }, status: "pending" });
    } else if (cm.title !== pm.title || cm.description !== pm.description) {
      mediaChanges.push({ id: `m_mod_${pm.media_id}`, type: "modified", original: { id: cm.media_id.toString(), title: cm.title || cm.file_name || "Untitled", meta: cm.file_type || "file", type: cm.source_type === "upload" ? "Upload" : "Link", icon: getIcon(cm.file_type), color: colors.creamMid, description: cm.description || "", access: cm.media_url || cm.file_path }, proposed: { id: pm.media_id.toString(), title: pm.title || pm.file_name || "Untitled", meta: pm.file_type || "file", type: pm.source_type === "upload" ? "Upload" : "Link", icon: getIcon(pm.file_type), color: colors.creamMid, description: pm.description || "", access: pm.media_url || pm.file_path }, status: "pending" });
    }
  });

  const referenceChanges: ReferenceChange[] = [];
  const currentRefs = current.scholar_references || [];
  const proposedRefs = proposed.scholar_references || [];
  proposedRefs.forEach((pr: any) => {
    const cr = currentRefs.find((r: any) => r.reference_id === pr.reference_id);
    if (!cr) {
      referenceChanges.push({ id: `r_add_${pr.reference_id}`, referenceId: pr.reference_id, type: "added", proposed: { id: pr.reference_id.toString(), title: pr.title, citation: pr.citation, url: pr.url }, status: "pending" });
    } else if (cr.title !== pr.title || cr.citation !== pr.citation || cr.url !== pr.url) {
      referenceChanges.push({ id: `r_mod_${pr.reference_id}`, referenceId: pr.reference_id, type: "modified", original: { id: cr.reference_id.toString(), title: cr.title, citation: cr.citation, url: cr.url }, proposed: { id: pr.reference_id.toString(), title: pr.title, citation: pr.citation, url: pr.url }, status: "pending" });
    }
  });

  const disciplineChanges: DisciplineChange[] = [];
  const currentDisciplines = (current.scholar_disciplines || []).map((d: any) => d.disciplines?.discipline_id);
  const proposedDisciplines = (proposed.scholar_disciplines || []).map((d: any) => d.disciplines?.discipline_id);
  proposedDisciplines.forEach((dId: number) => {
    if (!currentDisciplines.includes(dId)) {
      const disc = proposed.scholar_disciplines.find((d: any) => d.disciplines?.discipline_id === dId);
      disciplineChanges.push({ id: `d_add_${dId}`, label: disc?.disciplines?.name || "Unknown", type: "added", status: "pending" });
    }
  });
  currentDisciplines.forEach((dId: number) => {
    if (!proposedDisciplines.includes(dId)) {
      const disc = current.scholar_disciplines.find((d: any) => d.disciplines?.discipline_id === dId);
      disciplineChanges.push({ id: `d_rem_${dId}`, label: disc?.disciplines?.name || "Unknown", type: "removed", status: "pending" });
    }
  });

  return {
    id: proposed.version_id.toString(),
    scholarId: proposed.scholar_id.toString(),
    scholarName: proposed.canonical_name || current.canonical_name || "Unknown",
    editor: proposed.users?.username || "Unknown",
    editorId: proposed.created_by || null, // ✅ ADDED
    editorAvatar: (proposed.users?.username || "U").substring(0, 2).toUpperCase(),
    editDate: new Date(proposed.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    editType: "edition",
    originalContributor: current.users?.username || proposed.users?.username || "Unknown",
    language: (proposed.languages?.code || "EN").toUpperCase() as "EN" | "AR" | "FR",
    changedFields,
    workChanges,
    mediaChanges,
    referenceChanges,
    disciplineChanges,
    editorNote: "Edit proposal submitted for review.",
    currentImage: currentImg || `https://ui-avatars.com/api/?name=${encodeURIComponent(current.canonical_name || "C")}&background=0b4335&color=fff&size=128`,
    proposedImage: proposedImg || `https://ui-avatars.com/api/?name=${encodeURIComponent(proposed.canonical_name || "P")}&background=0b4335&color=fff&size=128`,
    proposedImageId: proposedImgId,
  };
};

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */
export default function PendingEditReview() {
  const { id: editId } = useParams();
  const navigate = useNavigate();
  const { lang } = useLang();
  const isRTL = lang === "AR";

  const [mode, setMode] = useState<"approve" | "reject" | null>(null); // ✅ Removed "strip", using Restrict modal instead
  const [note, setNote] = useState(""); // Used for reject reason
  const [approveReason, setApproveReason] = useState(""); // ✅ ADDED
  const [edit, setEdit] = useState<ScholarEdit | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // ✅ NEW: Restrict User Modal States
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
      } catch (error) {
        console.error("Failed to fetch edit details:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [editId, navigate]);

  if (isLoading || !edit) {
    return <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: colors.creamLight, color: colors.forestGreen }}><Icon name="hourglass_empty" size={32} /></div>;
  }

  const acceptField = (fieldId: string) => setEdit((prev) => prev ? { ...prev, changedFields: prev.changedFields.map((f) => f.id === fieldId ? { ...f, status: "accepted", rejectReason: undefined } : f) } : null);
  const rejectField = (fieldId: string, reason?: string) => { setEdit((prev) => prev ? { ...prev, changedFields: prev.changedFields.map((f) => f.id === fieldId ? { ...f, status: "rejected", rejectReason: reason } : f) } : null); setRejectingFieldId(null); setFieldRejectReason(""); };

  const acceptReference = (refId: string) => setEdit((prev) => prev ? { ...prev, referenceChanges: prev.referenceChanges.map((r) => r.id === refId ? { ...r, status: "accepted" } : r) } : null);
  const rejectReference = (refId: string) => setEdit((prev) => prev ? { ...prev, referenceChanges: prev.referenceChanges.map((r) => r.id === refId ? { ...r, status: "rejected" } : r) } : null);

  // ✅ UPDATED: Handle Confirm (Approve/Reject)
  const handleConfirm = async () => {
    if (!edit) return;
    try {
      if (mode === "approve") {
        const payload: any = { reason: approveReason || "Approved" }; // ✅ Send internal notes

        const rejectedRefs = edit.referenceChanges.filter(r => r.status === "rejected").map(r => r.referenceId);
        if (rejectedRefs.length > 0) payload.reject_references = rejectedRefs;

        const imageField = edit.changedFields.find(f => f.fieldName === "image");
        if (imageField && imageField.status === "rejected" && edit.proposedImageId) {
          payload.reject_images = [edit.proposedImageId];
        }

        await adminApi.scholars.approve(Number(edit.id), payload);
      } else if (mode === "reject") {
        if (!note.trim()) {
          alert("Please provide a rejection reason");
          return;
        }
        await adminApi.scholars.reject(Number(edit.id), note);
      }
      navigate("/admin/pending/edits");
    } catch (error) {
      console.error("Failed to process edit:", error);
      alert("Action failed. Please try again.");
    }
  };

  // ✅ NEW: Restrict User + Auto-Reject Handler
  const executeRestrictionAndReject = async () => {
    if (!confirmAction || !edit) return;
    try {
      const userId = edit.editorId;
      const scholarId = Number(edit.id);

      if (!userId) {
        alert("Cannot restrict system-generated submissions.");
        setConfirmAction(null);
        setShowRestrictModal(false);
        return;
      }

      if (confirmAction.type === 'revoke') {
        await adminApi.users.toggleContribute(userId);
      } else {
        await adminApi.users.ban(userId);
      }

      const defaultReason = confirmAction.type === 'ban' ? "Contributor banned" : "Contribution access revoked";
      await adminApi.scholars.reject(scholarId, defaultReason);

      navigate("/admin/pending/edits");
      setConfirmAction(null);
      setShowRestrictModal(false);
    } catch (err) {
      console.error("Action failed:", err);
      alert("Failed to process action. Please try again.");
    }
  };

  const countStatus = (items: { status: FieldStatus }[], status: FieldStatus) => items.filter((i) => i.status === status).length;
  const allChanges = [...edit.changedFields, ...edit.workChanges, ...edit.mediaChanges, ...edit.referenceChanges, ...edit.disciplineChanges];
  const acceptedCount = countStatus(allChanges, "accepted");
  const rejectedCount = countStatus(allChanges, "rejected");
  const pendingCount = countStatus(allChanges, "pending");
  const totalChanges = allChanges.length;

  const thStyle: React.CSSProperties = { fontFamily: fonts.label, fontSize: 11, letterSpacing: "0.06em", fontWeight: 600, color: colors.forestGreen, textAlign: isRTL ? "right" : "left", padding: "12px 14px", borderBottom: `1px solid ${colors.forestGreen}`, textTransform: "uppercase", opacity: 0.8 };
  const tdStyle: React.CSSProperties = { fontFamily: fonts.body, fontSize: 13, color: colors.forestGreen, padding: "14px", borderBottom: `1px solid ${colors.creamDark}`, textAlign: isRTL ? "right" : "left" };

  const translations = {
    currentVersion: isRTL ? "النسخة الحالية" : "Current Version",
    proposedVersion: isRTL ? "النسخة المقترحة" : "Proposed Version",
  };

  return (
    <div dir={isRTL ? "rtl" : "ltr"} style={{ fontFamily: fonts.body, color: colors.forestGreen, backgroundColor: colors.creamLight, minHeight: "100vh", padding: 24 }}>
      <div style={{ maxWidth: 1400, margin: "0 auto" }}>

        <button onClick={() => navigate("/admin/pending/edits")} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", backgroundColor: "transparent", border: `1px solid ${colors.forestGreen}`, borderRadius: 8, fontFamily: fonts.body, fontSize: 12, color: colors.forestGreen, cursor: "pointer", marginBottom: 16 }}>
          <Icon name={isRTL ? "arrow_forward" : "arrow_back"} size={14} /> {isRTL ? "العودة إلى التعديلات" : "Back to Pending Edits"}
        </button>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 18 }}>
          {[
            { icon: "check_circle", label: "Accepted", value: acceptedCount.toString() },
            { icon: "cancel", label: "Rejected", value: rejectedCount.toString() },
            { icon: "pending", label: "Pending", value: pendingCount.toString() },
            { icon: "list_alt", label: "Total Changes", value: totalChanges.toString() },
          ].map((s) => (
            <div key={s.label} style={{ ...cardStyle, padding: 16, display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: colors.creamMid, color: colors.forestGreen, border: `1px solid ${colors.forestGreen}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon name={s.icon} size={20} />
              </div>
              <div>
                <p style={{ fontFamily: fonts.label, fontSize: 10, letterSpacing: "0.06em", color: colors.forestGreen, margin: 0, opacity: 0.7 }}>{s.label.toUpperCase()}</p>
                <p style={{ fontFamily: fonts.headline, fontSize: 20, fontWeight: 700, color: colors.forestGreen, margin: "3px 0 0", lineHeight: 1 }}>{s.value}</p>
              </div>
            </div>
          ))}
        </div>

        <section style={{ ...cardStyle, padding: 24, marginBottom: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 20, flexWrap: "wrap" }}>
            <div style={{ display: "flex", gap: 18, alignItems: "flex-start" }}>
              <div style={{ width: 56, height: 56, borderRadius: "50%", backgroundColor: colors.creamMid, border: `2px solid ${colors.forestGreen}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: fonts.headline, fontWeight: 700, fontSize: 16, color: colors.forestGreen, flexShrink: 0 }}>
                {edit.editorAvatar}
              </div>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6, flexWrap: "wrap" }}>
                  <h1 style={{ fontFamily: fonts.headline, fontSize: 22, fontWeight: 700, color: colors.forestGreen, margin: 0 }}>{edit.scholarName}</h1>
                  <span style={{ padding: "2px 9px", borderRadius: 4, backgroundColor: colors.creamMid, color: colors.forestGreen, fontFamily: fonts.label, fontSize: 10, fontWeight: 700, letterSpacing: "0.06em", border: `1px solid ${colors.forestGreen}` }}>PENDING EDIT</span>
                </div>
                <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginTop: 8 }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 4, fontFamily: fonts.label, fontSize: 11, color: colors.forestGreen, opacity: 0.8 }}><Icon name="person" size={12} /> Editor: <strong>{edit.editor}</strong></span>
                  <span style={{ display: "flex", alignItems: "center", gap: 4, fontFamily: fonts.label, fontSize: 11, color: colors.forestGreen, opacity: 0.8 }}><Icon name="person_outline" size={12} /> Original: <strong>{edit.originalContributor}</strong></span>
                  <span style={{ display: "flex", alignItems: "center", gap: 4, fontFamily: fonts.label, fontSize: 11, color: colors.forestGreen, opacity: 0.8 }}><Icon name="calendar_today" size={12} /> {edit.editDate}</span>
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {/* ✅ UPDATED: Restrict User Button */}
              <ActionButton icon="shield_person" color={colors.amber} hoverBg={colors.amber} hoverColor={colors.creamLight} onClick={() => setShowRestrictModal(true)} title="Restrict User" />
              <ActionButton icon="cancel" color={colors.red} hoverBg={colors.red} hoverColor={colors.creamLight} onClick={() => setMode(mode === "reject" ? null : "reject")} title="Reject All" />
              <ActionButton icon="check_circle" color={colors.forestGreen} hoverBg={colors.forestGreen} hoverColor={colors.creamLight} onClick={() => setMode(mode === "approve" ? null : "approve")} title="Approve Accepted" filled />
            </div>
          </div>
        </section>

        {/* ── SIDE-BY-SIDE IMAGES ONLY ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 24 }}>
          <div style={{ ...cardStyle, padding: 20 }}>
            <h2 style={{ fontFamily: fonts.headline, fontSize: 16, fontWeight: 700, color: colors.forestGreen, margin: "0 0 16px", display: "flex", alignItems: "center", gap: 8 }}>
              <Icon name="history" size={18} /> {translations.currentVersion}
            </h2>
            <div style={{ width: "100%", aspectRatio: "1/1", borderRadius: 12, overflow: "hidden", backgroundColor: colors.creamMid, border: `2px solid ${colors.creamDark}` }}>
              {edit.currentImage ? (
                <img alt="Current scholar portrait" src={edit.currentImage} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
              ) : (
                <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: colors.forestGreen }}><Icon name="account_circle" size={120} /></div>
              )}
            </div>
          </div>

          <div style={{ ...cardStyle, padding: 20, border: `2px solid ${colors.forestGreen}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h2 style={{ fontFamily: fonts.headline, fontSize: 16, fontWeight: 700, color: colors.forestGreen, margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
                <Icon name="edit" size={18} /> {translations.proposedVersion}
              </h2>
              <div style={{ display: "flex", gap: 6 }}>
                <ActionButton icon="check" color={colors.forestGreen} hoverBg={colors.forestGreen} hoverColor={colors.creamLight} onClick={() => acceptField("image")} title="Accept Image" />
                <ActionButton icon="close" color={colors.red} hoverBg={colors.red} hoverColor={colors.creamLight} onClick={() => setRejectingFieldId("image")} title="Reject Image" />
              </div>
            </div>
            <div style={{ width: "100%", aspectRatio: "1/1", borderRadius: 12, overflow: "hidden", backgroundColor: colors.creamMid, border: `2px solid ${colors.forestGreen}` }}>
              <img alt="Proposed scholar portrait" src={edit.proposedImage} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
            </div>
            {rejectingFieldId === "image" && (
               <div style={{ marginTop: 10, padding: 10, border: `1px solid rgba(139,44,44,0.25)`, borderRadius: 6, backgroundColor: "rgba(139,44,44,0.04)" }}>
                  <p style={{ fontFamily: fonts.body, fontSize: 11, fontWeight: 600, color: colors.red, margin: "0 0 6px" }}>Rejection Reason</p>
                  <textarea value={fieldRejectReason} onChange={(e) => setFieldRejectReason(e.target.value)} placeholder="Enter reason..." style={{ width: "100%", minHeight: 60, padding: 8, border: `1px solid ${colors.creamDark}`, borderRadius: 4, fontFamily: fonts.body, fontSize: 12, resize: "vertical", outline: "none", boxSizing: "border-box" }} />
                  <div style={{ display: "flex", gap: 6, marginTop: 8, justifyContent: "flex-end" }}>
                    <button onClick={() => { setRejectingFieldId(null); setFieldRejectReason(""); }} style={{ padding: "6px 12px", borderRadius: 5, border: `1px solid ${colors.creamDark}`, backgroundColor: colors.creamLight, color: colors.forestGreen, fontFamily: fonts.body, fontSize: 11, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
                    <button onClick={() => rejectField("image", fieldRejectReason)} style={{ padding: "6px 12px", borderRadius: 5, border: "none", backgroundColor: colors.red, color: colors.creamLight, fontFamily: fonts.body, fontSize: 11, fontWeight: 600, cursor: "pointer" }}>Confirm Reject</button>
                  </div>
               </div>
            )}
          </div>
        </div>

        {/* ── CHANGED FIELDS & OTHER SECTIONS ─ */}
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          
          {edit.changedFields.length > 0 && (
            <div style={{ ...cardStyle, padding: 20 }}>
              <h2 style={{ fontFamily: fonts.headline, fontSize: 16, fontWeight: 600, color: colors.forestGreen, margin: "0 0 16px", display: "flex", alignItems: "center", gap: 8 }}>
                <Icon name="edit_note" size={18} filled /> Changed Fields ({edit.changedFields.length})
              </h2>
              {edit.changedFields.map((field) => {
                if (field.fieldName === "image") return null;
                return (
                  <div key={field.id} style={{ ...cardStyle, marginBottom: 16, border: `1px solid ${colors.creamDark}` }}>
                    <div style={{ padding: "10px 14px", backgroundColor: colors.creamMid, borderBottom: `1px solid ${colors.creamDark}` }}>
                      <span style={{ fontFamily: fonts.body, fontSize: 12, fontWeight: 700, color: colors.forestGreen, display: "flex", alignItems: "center", gap: 6 }}>
                        <Icon name="label" size={14} /> {field.fieldLabel}
                      </span>
                    </div>
                    <div style={{ padding: 14 }}>
                      <div style={{ display: "flex", gap: 12, marginBottom: 10 }}>
                        <div style={{ flex: 1, padding: 10, borderRadius: 6, backgroundColor: "rgba(139,44,44,0.06)", border: `1px solid rgba(139,44,44,0.25)`, color: colors.red, fontSize: 13, lineHeight: 1.6 }}>
                          <div style={{ fontFamily: fonts.label, fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6, display: "flex", alignItems: "center", gap: 4 }}><Icon name="delete" size={12} /> Original</div>
                          {field.originalValue}
                        </div>
                        <div style={{ flex: 1, padding: 10, borderRadius: 6, backgroundColor: "rgba(11,67,53,0.06)", border: `1px solid rgba(11,67,53,0.25)`, color: colors.forestGreen, fontSize: 13, lineHeight: 1.6 }}>
                          <div style={{ fontFamily: fonts.label, fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6, display: "flex", alignItems: "center", gap: 4 }}><Icon name="add" size={12} /> Proposed</div>
                          {field.proposedValue}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Work Changes (Visual Only) */}
          {edit.workChanges.length > 0 && (
            <div style={{ ...cardStyle, padding: 20 }}>
              <h2 style={{ fontFamily: fonts.headline, fontSize: 16, fontWeight: 600, color: colors.forestGreen, margin: "0 0 16px", display: "flex", alignItems: "center", gap: 8 }}>
                <Icon name="menu_book" size={18} filled /> Work Changes ({edit.workChanges.length})
              </h2>
              {edit.workChanges.map((work) => (
                <div key={work.id} style={{ ...cardStyle, marginBottom: 16, border: `1px solid ${colors.creamDark}` }}>
                  <div style={{ padding: "10px 14px", backgroundColor: colors.creamMid, borderBottom: `1px solid ${colors.creamDark}` }}>
                    <span style={{ fontFamily: fonts.label, fontSize: 10, fontWeight: 700, padding: "3px 9px", borderRadius: 4, backgroundColor: work.type === "added" ? "rgba(11,67,53,0.08)" : "rgba(74,127,203,0.12)", color: work.type === "added" ? colors.forestGreen : "#4a7fcb", textTransform: "uppercase", letterSpacing: "0.05em", display: "inline-flex", alignItems: "center", gap: 4 }}>
                      <Icon name={work.type === "added" ? "add" : "edit"} size={12} /> {work.type}
                    </span>
                  </div>
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <thead style={{ backgroundColor: colors.creamMid }}>
                        <tr>
                          <th style={{ ...thStyle, width: "60px" }}>Type</th>
                          <th style={thStyle}>Title</th>
                          <th style={thStyle}>Year</th>
                          <th style={thStyle}>Format</th>
                          <th style={thStyle}>Access</th>
                        </tr>
                      </thead>
                      <tbody>
                        {work.original && (
                          <tr style={{ backgroundColor: "rgba(139,44,44,0.04)" }}>
                            <td style={tdStyle}><span style={{ fontFamily: fonts.label, fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 3, backgroundColor: "rgba(139,44,44,0.06)", color: colors.red, border: `1px solid rgba(139,44,44,0.25)`, textTransform: "uppercase" }}>Original</span></td>
                            <td style={{ ...tdStyle, fontFamily: fonts.headline, fontSize: 13, fontWeight: 600, fontStyle: "italic", textDecoration: "line-through", color: colors.red }}>{work.original.title}</td>
                            <td style={{ ...tdStyle, fontFamily: fonts.label, fontSize: 12 }}>{work.original.year}</td>
                            <td style={tdStyle}><span style={{ fontFamily: fonts.label, fontSize: 9, fontWeight: 700, padding: "3px 9px", borderRadius: 4, backgroundColor: colors.creamMid, color: colors.forestGreen }}>{work.original.format}</span></td>
                            <td style={tdStyle}>{work.original.access ? <a href={work.original.access} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 4, fontFamily: fonts.label, fontSize: 10, fontWeight: 700, color: colors.forestGreen, textDecoration: "none" }}><Icon name="open_in_new" size={12} /> View</a> : <span style={{ opacity: 0.5 }}>—</span>}</td>
                          </tr>
                        )}
                        <tr style={{ backgroundColor: "rgba(11,67,53,0.04)" }}>
                          <td style={tdStyle}><span style={{ fontFamily: fonts.label, fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 3, backgroundColor: "rgba(11,67,53,0.08)", color: colors.forestGreen, border: `1px solid rgba(11,67,53,0.25)`, textTransform: "uppercase" }}>{work.type === "added" ? "New" : "Proposed"}</span></td>
                          <td style={{ ...tdStyle, fontFamily: fonts.headline, fontSize: 13, fontWeight: 600, fontStyle: "italic" }}>{work.proposed.title}</td>
                          <td style={{ ...tdStyle, fontFamily: fonts.label, fontSize: 12 }}>{work.proposed.year}</td>
                          <td style={tdStyle}><span style={{ fontFamily: fonts.label, fontSize: 9, fontWeight: 700, padding: "3px 9px", borderRadius: 4, backgroundColor: colors.creamMid, color: colors.forestGreen }}>{work.proposed.format}</span></td>
                          <td style={tdStyle}>{work.proposed.access ? <a href={work.proposed.access} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 4, fontFamily: fonts.label, fontSize: 10, fontWeight: 700, color: colors.forestGreen, textDecoration: "none" }}><Icon name="open_in_new" size={12} /> View</a> : <span style={{ opacity: 0.5 }}>—</span>}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Reference Changes (WITH BUTTONS) */}
          {edit.referenceChanges.length > 0 && (
            <div style={{ ...cardStyle, padding: 20 }}>
              <h2 style={{ fontFamily: fonts.headline, fontSize: 16, fontWeight: 600, color: colors.forestGreen, margin: "0 0 16px", display: "flex", alignItems: "center", gap: 8 }}>
                <Icon name="menu_book" size={18} filled /> Reference Changes ({edit.referenceChanges.length})
              </h2>
              {edit.referenceChanges.map((ref) => (
                <div key={ref.id} style={{ ...cardStyle, marginBottom: 16, border: ref.status === "accepted" ? `1px solid ${colors.forestGreen}` : ref.status === "rejected" ? `1px solid ${colors.red}` : `1px solid ${colors.creamDark}` }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", backgroundColor: colors.creamMid, borderBottom: `1px solid ${colors.creamDark}` }}>
                    <span style={{ fontFamily: fonts.label, fontSize: 10, fontWeight: 700, padding: "3px 9px", borderRadius: 4, backgroundColor: ref.type === "added" ? "rgba(11,67,53,0.08)" : "rgba(74,127,203,0.12)", color: ref.type === "added" ? colors.forestGreen : "#4a7fcb", textTransform: "uppercase", letterSpacing: "0.05em", display: "inline-flex", alignItems: "center", gap: 4 }}>
                      <Icon name={ref.type === "added" ? "add" : "edit"} size={12} /> {ref.type}
                    </span>
                    <div style={{ display: "flex", gap: 6 }}>
                      {ref.status === "pending" && (<>
                        <ActionButton icon="check" color={colors.forestGreen} hoverBg={colors.forestGreen} hoverColor={colors.creamLight} onClick={() => acceptReference(ref.id)} title="Accept" />
                        <ActionButton icon="close" color={colors.red} hoverBg={colors.red} hoverColor={colors.creamLight} onClick={() => rejectReference(ref.id)} title="Reject" />
                      </>)}
                      {ref.status !== "pending" && (
                        <ActionButton icon="undo" color={colors.forestGreen} hoverBg={colors.forestGreen} hoverColor={colors.creamLight} onClick={() => { setEdit((prev) => prev ? { ...prev, referenceChanges: prev.referenceChanges.map((r) => r.id === ref.id ? { ...r, status: "pending" } : r) } : null); }} title="Reset" />
                      )}
                    </div>
                  </div>
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <thead style={{ backgroundColor: colors.creamMid }}>
                        <tr>
                          <th style={{ ...thStyle, width: "60px" }}>Type</th>
                          <th style={thStyle}>Title</th>
                          <th style={thStyle}>Citation</th>
                          <th style={thStyle}>URL</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ref.original && (
                          <tr style={{ backgroundColor: "rgba(139,44,44,0.04)" }}>
                            <td style={tdStyle}><span style={{ fontFamily: fonts.label, fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 3, backgroundColor: "rgba(139,44,44,0.06)", color: colors.red, border: `1px solid rgba(139,44,44,0.25)`, textTransform: "uppercase" }}>Original</span></td>
                            <td style={{ ...tdStyle, fontFamily: fonts.headline, fontSize: 13, fontWeight: 600, fontStyle: "italic", textDecoration: "line-through", color: colors.red }}>{ref.original.title}</td>
                            <td style={{ ...tdStyle, fontSize: 12 }}>{ref.original.citation}</td>
                            <td style={tdStyle}>{ref.original.url ? <a href={ref.original.url} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 4, fontFamily: fonts.label, fontSize: 10, fontWeight: 700, color: colors.forestGreen, textDecoration: "none" }}><Icon name="open_in_new" size={12} /> View</a> : <span style={{ opacity: 0.5 }}>—</span>}</td>
                          </tr>
                        )}
                        <tr style={{ backgroundColor: "rgba(11,67,53,0.04)" }}>
                          <td style={tdStyle}><span style={{ fontFamily: fonts.label, fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 3, backgroundColor: "rgba(11,67,53,0.08)", color: colors.forestGreen, border: `1px solid rgba(11,67,53,0.25)`, textTransform: "uppercase" }}>{ref.type === "added" ? "New" : "Proposed"}</span></td>
                          <td style={{ ...tdStyle, fontFamily: fonts.headline, fontSize: 13, fontWeight: 600, fontStyle: "italic" }}>{ref.proposed.title}</td>
                          <td style={{ ...tdStyle, fontSize: 12 }}>{ref.proposed.citation}</td>
                          <td style={tdStyle}>{ref.proposed.url ? <a href={ref.proposed.url} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 4, fontFamily: fonts.label, fontSize: 10, fontWeight: 700, color: colors.forestGreen, textDecoration: "none" }}><Icon name="open_in_new" size={12} /> View</a> : <span style={{ opacity: 0.5 }}>—</span>}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Media Changes (Visual Only) */}
          {edit.mediaChanges.length > 0 && (
            <div style={{ ...cardStyle, padding: 20 }}>
              <h2 style={{ fontFamily: fonts.headline, fontSize: 16, fontWeight: 600, color: colors.forestGreen, margin: "0 0 16px", display: "flex", alignItems: "center", gap: 8 }}>
                <Icon name="folder_open" size={18} filled /> Media Changes ({edit.mediaChanges.length})
              </h2>
              {edit.mediaChanges.map((media) => (
                <div key={media.id} style={{ ...cardStyle, marginBottom: 16, border: `1px solid ${colors.creamDark}` }}>
                  <div style={{ padding: "10px 14px", backgroundColor: colors.creamMid, borderBottom: `1px solid ${colors.creamDark}` }}>
                    <span style={{ fontFamily: fonts.label, fontSize: 10, fontWeight: 700, padding: "3px 9px", borderRadius: 4, backgroundColor: media.type === "added" ? "rgba(11,67,53,0.08)" : "rgba(74,127,203,0.12)", color: media.type === "added" ? colors.forestGreen : "#4a7fcb", textTransform: "uppercase", letterSpacing: "0.05em", display: "inline-flex", alignItems: "center", gap: 4 }}>
                      <Icon name={media.type === "added" ? "add" : "edit"} size={12} /> {media.type}
                    </span>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: media.original ? "1fr 1fr" : "1fr", gap: 14, padding: 14 }}>
                    {media.original && (
                      <div style={{ ...cardStyle, padding: 12, backgroundColor: "rgba(139,44,44,0.04)", border: `1px solid rgba(139,44,44,0.25)` }}>
                        <div style={{ display: "flex", gap: 10 }}>
                          <div style={{ width: 38, height: 38, borderRadius: 8, backgroundColor: media.original.color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Icon name={media.original.icon} size={20} /></div>
                          <div style={{ flex: 1 }}>
                            <p style={{ fontFamily: fonts.headline, fontSize: 12.5, fontWeight: 600, color: colors.red, margin: "0 0 2px", textDecoration: "line-through" }}>{media.original.title}</p>
                            <p style={{ fontFamily: fonts.body, fontSize: 11, color: colors.forestGreen, opacity: 0.8, margin: "0 0 3px", lineHeight: 1.5 }}>{media.original.description}</p>
                            <p style={{ fontFamily: fonts.label, fontSize: 10, color: colors.forestGreen, opacity: 0.7, margin: 0 }}>{media.original.meta} · {media.original.type}</p>
                          </div>
                        </div>
                      </div>
                    )}
                    <div style={{ ...cardStyle, padding: 12, backgroundColor: "rgba(11,67,53,0.04)", border: `1px solid rgba(11,67,53,0.25)` }}>
                      <div style={{ display: "flex", gap: 10 }}>
                        <div style={{ width: 38, height: 38, borderRadius: 8, backgroundColor: media.proposed.color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Icon name={media.proposed.icon} size={20} /></div>
                        <div style={{ flex: 1 }}>
                          <p style={{ fontFamily: fonts.headline, fontSize: 12.5, fontWeight: 600, color: colors.forestGreen, margin: "0 0 2px" }}>{media.proposed.title}</p>
                          <p style={{ fontFamily: fonts.body, fontSize: 11, color: colors.forestGreen, opacity: 0.8, margin: "0 0 3px", lineHeight: 1.5 }}>{media.proposed.description}</p>
                          <p style={{ fontFamily: fonts.label, fontSize: 10, color: colors.forestGreen, opacity: 0.7, margin: 0 }}>{media.proposed.meta} · {media.proposed.type}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Discipline Changes (Visual Only) */}
          {edit.disciplineChanges.length > 0 && (
            <div style={{ ...cardStyle, padding: 20 }}>
              <h2 style={{ fontFamily: fonts.headline, fontSize: 16, fontWeight: 600, color: colors.forestGreen, margin: "0 0 16px", display: "flex", alignItems: "center", gap: 8 }}>
                <Icon name="category" size={18} filled /> Discipline Changes ({edit.disciplineChanges.length})
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {edit.disciplineChanges.filter(d => d.type === "added").length > 0 && (
                  <div>
                    <p style={{ fontFamily: fonts.label, fontSize: 10, letterSpacing: "0.06em", color: colors.forestGreen, margin: "0 0 8px", opacity: 0.7, display: "flex", alignItems: "center", gap: 6 }}><Icon name="add_circle" size={14} /> PROPOSED NEW DISCIPLINES</p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                      {edit.disciplineChanges.filter(d => d.type === "added").map((d) => (
                        <span key={d.id} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 20, border: `1.5px solid ${colors.forestGreen}`, backgroundColor: colors.forestGreen, color: colors.creamLight, fontFamily: fonts.body, fontSize: 12, fontWeight: 600 }}>
                          <Icon name="add" size={14} /> {d.label}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {edit.disciplineChanges.filter(d => d.type === "removed").length > 0 && (
                  <div style={{ borderTop: `1px dashed ${colors.creamDark}`, paddingTop: 16 }}>
                    <p style={{ fontFamily: fonts.label, fontSize: 10, letterSpacing: "0.06em", color: colors.forestGreen, margin: "0 0 8px", opacity: 0.7, display: "flex", alignItems: "center", gap: 6 }}><Icon name="remove_circle" size={14} /> PROPOSED REMOVALS</p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                      {edit.disciplineChanges.filter(d => d.type === "removed").map((d) => (
                        <span key={d.id} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 20, border: `1.5px solid ${colors.red}`, backgroundColor: colors.red, color: colors.creamLight, fontFamily: fonts.body, fontSize: 12, fontWeight: 600, textDecoration: "line-through" }}>
                          <Icon name="remove" size={14} /> {d.label}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

        {/* ── Step 1: Choose Restrict Action Modal ── */}
        {showRestrictModal && !confirmAction && (
          <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(11, 67, 53, 0.6)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)", padding: 20 }} onClick={() => setShowRestrictModal(false)}>
            <div style={{ ...cardStyle, backgroundColor: colors.creamLight, width: 520, maxWidth: "90vw", padding: 32, boxShadow: "0 20px 60px rgba(0,0,0,0.25)" }} onClick={(e) => e.stopPropagation()}>
              <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
                <div style={{ width: 56, height: 56, borderRadius: "50%", backgroundColor: colors.creamMid, border: `2px solid ${colors.forestGreen}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: fonts.headline, fontWeight: 700, fontSize: 16, color: colors.forestGreen, flexShrink: 0 }}>
                  {edit.editorAvatar}
                </div>
                <div>
                  <h2 style={{ fontFamily: fonts.headline, fontSize: 20, fontWeight: 700, color: colors.forestGreen, margin: 0 }}>Restrict User</h2>
                  <p style={{ fontFamily: fonts.body, fontSize: 13, color: colors.forestGreen, opacity: 0.7, margin: "4px 0 0" }}>{edit.editor} edited "{edit.scholarName}"</p>
                </div>
              </div>

              <p style={{ fontFamily: fonts.body, fontSize: 14, color: colors.forestGreen, lineHeight: 1.6, marginBottom: 24 }}>
                Choose an action. This will automatically <b>reject</b> this edit submission as well.
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>
                <button onClick={() => setConfirmAction({ type: 'revoke' })} style={{ display: "flex", alignItems: "flex-start", gap: 16, padding: 16, borderRadius: 8, border: `1px solid ${colors.amber}`, backgroundColor: "rgba(184, 134, 11, 0.05)", cursor: "pointer", textAlign: "left", transition: "background 0.2s" }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "rgba(184, 134, 11, 0.1)"; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "rgba(184, 134, 11, 0.05)"; }}>
                  <div style={{ width: 32, height: 32, borderRadius: "50%", backgroundColor: colors.amber, color: colors.creamLight, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Icon name="person_off" size={18} /></div>
                  <div>
                    <p style={{ fontFamily: fonts.headline, fontSize: 14, fontWeight: 700, color: colors.forestGreen, margin: "0 0 4px" }}>Revoke Contribution Access</p>
                    <p style={{ fontFamily: fonts.body, fontSize: 12, color: colors.forestGreen, opacity: 0.7, margin: 0, lineHeight: 1.5 }}>They can still log in, but cannot submit new edits. (Recommended for low-quality edits)</p>
                  </div>
                </button>

                <button onClick={() => setConfirmAction({ type: 'ban' })} style={{ display: "flex", alignItems: "flex-start", gap: 16, padding: 16, borderRadius: 8, border: `1px solid ${colors.red}`, backgroundColor: "rgba(139, 44, 44, 0.05)", cursor: "pointer", textAlign: "left", transition: "background 0.2s" }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "rgba(139, 44, 44, 0.1)"; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "rgba(139, 44, 44, 0.05)"; }}>
                  <div style={{ width: 32, height: 32, borderRadius: "50%", backgroundColor: colors.red, color: colors.creamLight, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Icon name="block" size={18} /></div>
                  <div>
                    <p style={{ fontFamily: fonts.headline, fontSize: 14, fontWeight: 700, color: colors.forestGreen, margin: "0 0 4px" }}>Ban Account Completely</p>
                    <p style={{ fontFamily: fonts.body, fontSize: 12, color: colors.forestGreen, opacity: 0.7, margin: 0, lineHeight: 1.5 }}>They will be completely locked out of the platform. (Use for spam, abuse, or severe violations)</p>
                  </div>
                </button>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button onClick={() => setShowRestrictModal(false)} style={{ padding: "10px 24px", borderRadius: 8, cursor: "pointer", border: `1px solid ${colors.forestGreen}`, backgroundColor: colors.creamLight, fontFamily: fonts.body, fontSize: 13, fontWeight: 600, color: colors.forestGreen }}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* ── Step 2: Final Confirmation Modal ── */}
        {confirmAction && (
          <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(11, 67, 53, 0.6)", zIndex: 101, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)", padding: 20 }} onClick={() => setConfirmAction(null)}>
            <div style={{ ...cardStyle, backgroundColor: colors.creamLight, width: 440, maxWidth: "90vw", padding: 32, boxShadow: "0 20px 60px rgba(0,0,0,0.25)" }} onClick={(e) => e.stopPropagation()}>
              <div style={{ width: 56, height: 56, borderRadius: "50%", backgroundColor: confirmAction.type === 'ban' ? colors.red : colors.amber, color: colors.creamLight, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20, border: `1px solid ${confirmAction.type === 'ban' ? colors.red : colors.amber}` }}>
                <Icon name={confirmAction.type === 'ban' ? "block" : "person_off"} size={28} filled />
              </div>
              <h2 style={{ fontFamily: fonts.headline, fontSize: 20, fontWeight: 700, color: colors.forestGreen, marginBottom: 12 }}>Confirm {confirmAction.type === 'ban' ? 'Ban' : 'Revocation'}</h2>
              <p style={{ fontFamily: fonts.body, fontSize: 14, color: colors.forestGreen, lineHeight: 1.6, marginBottom: 24, opacity: 0.8 }}>
                This will <b>{confirmAction.type === 'ban' ? 'BAN' : 'REVOKE CONTRIBUTION ACCESS FOR'} {edit.editor}</b> <br/>and automatically <b>REJECT</b> the edit for "{edit.scholarName}".<br/><br/><b style={{ color: colors.red }}>This action cannot be undone from this screen.</b>
              </p>
              <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
                <button onClick={() => setConfirmAction(null)} style={{ padding: "10px 24px", borderRadius: 8, cursor: "pointer", border: `1px solid ${colors.forestGreen}`, backgroundColor: colors.creamLight, fontFamily: fonts.body, fontSize: 13, fontWeight: 600, color: colors.forestGreen }}>Go Back</button>
                <button onClick={executeRestrictionAndReject} style={{ padding: "10px 24px", borderRadius: 8, cursor: "pointer", border: "none", backgroundColor: confirmAction.type === 'ban' ? colors.red : colors.amber, color: colors.creamLight, fontFamily: fonts.body, fontSize: 13, fontWeight: 700 }}>Confirm & Reject</button>
              </div>
            </div>
          </div>
        )}

        {/* ── Main Action Modal (Approve / Reject) ── */}
        {mode && (
          <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(11, 67, 53, 0.5)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }} onClick={() => { setMode(null); setNote(""); setApproveReason(""); }}>
            <div style={{ ...cardStyle, backgroundColor: colors.creamLight, width: 500, maxWidth: "90vw", padding: 32, boxShadow: "0 20px 60px rgba(0,0,0,0.18)" }} onClick={(e) => e.stopPropagation()}>
              <div style={{ width: 56, height: 56, borderRadius: "50%", backgroundColor: mode === "approve" ? colors.forestGreen : colors.red, color: colors.creamLight, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20, border: `1px solid ${mode === "approve" ? colors.forestGreen : colors.red}` }}>
                <Icon name={mode === "approve" ? "check_circle" : "cancel"} size={28} filled />
              </div>
              <h2 style={{ fontFamily: fonts.headline, fontSize: 20, fontWeight: 700, color: colors.forestGreen, marginBottom: 12 }}>
                {mode === "approve" ? "Approve Accepted Changes" : "Reject All Changes"}
              </h2>
              <p style={{ fontFamily: fonts.body, fontSize: 14, color: colors.forestGreen, lineHeight: 1.6, marginBottom: 24, opacity: 0.8 }}>
                {mode === "approve" ? `Are you sure you want to approve this edit? Any rejected images or references will be excluded.` : "Are you sure you want to reject all changes? The editor will be notified."}
                {mode === "reject" && <><br /><b style={{ color: colors.red }}>This action cannot be undone.</b></>}
              </p>
              
              {/* ✅ ADDED: Approval Notes Field */}
              {mode === "approve" && (
                <div style={{ marginBottom: 24 }}>
                  <label style={{ fontFamily: fonts.label, fontSize: 11, letterSpacing: "0.06em", fontWeight: 600, color: colors.forestGreen, display: "block", marginBottom: 6 }}>APPROVAL NOTES (Optional)</label>
                  <textarea 
                    value={approveReason} 
                    onChange={(e) => setApproveReason(e.target.value)}
                    placeholder="Add any notes about this approval..."
                    style={{ width: "100%", padding: 12, borderRadius: 8, border: `1px solid ${colors.forestGreen}`, fontFamily: fonts.body, fontSize: 13, color: colors.forestGreen, backgroundColor: colors.creamLight, outline: "none", resize: "vertical", minHeight: 80, boxSizing: "border-box" }}
                  />
                </div>
              )}

              {/* ✅ UPDATED: Mandatory Rejection Reason */}
              {mode === "reject" && (
                <div style={{ marginBottom: 24 }}>
                  <label style={{ fontFamily: fonts.label, fontSize: 11, letterSpacing: "0.06em", fontWeight: 600, color: colors.forestGreen, display: "block", marginBottom: 6 }}>REJECTION REASON *</label>
                  <textarea 
                    value={note} 
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Please provide a reason for rejection..."
                    style={{ width: "100%", padding: 12, borderRadius: 8, border: `1px solid ${note.trim() ? colors.forestGreen : colors.creamDark}`, fontFamily: fonts.body, fontSize: 13, color: colors.forestGreen, backgroundColor: colors.creamLight, outline: "none", resize: "vertical", minHeight: 80, boxSizing: "border-box" }}
                  />
                </div>
              )}

              <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
                <button onClick={() => { setMode(null); setNote(""); setApproveReason(""); }} style={{ padding: "10px 24px", borderRadius: 8, cursor: "pointer", border: `1px solid ${colors.forestGreen}`, backgroundColor: colors.creamLight, fontFamily: fonts.body, fontSize: 13, fontWeight: 600, color: colors.forestGreen }}>Cancel</button>
                <button 
                  onClick={handleConfirm} 
                  disabled={mode === "reject" && !note.trim()}
                  style={{ 
                    padding: "10px 24px", borderRadius: 8, cursor: (mode === "reject" && !note.trim()) ? "not-allowed" : "pointer", 
                    border: `1px solid ${mode === "approve" ? colors.forestGreen : colors.red}`, 
                    backgroundColor: (mode === "reject" && !note.trim()) ? colors.creamDark : (mode === "approve" ? colors.forestGreen : colors.red), 
                    fontFamily: fonts.body, fontSize: 13, fontWeight: 700, color: colors.creamLight,
                    opacity: (mode === "reject" && !note.trim()) ? 0.6 : 1
                  }}
                >
                  {mode === "approve" ? "Confirm Approve" : "Confirm Reject"}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}