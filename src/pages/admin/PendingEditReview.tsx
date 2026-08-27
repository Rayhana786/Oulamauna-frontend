import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useLang } from "../../context/LanguageContext";

/* ------------------------------------------------------------------ */
/*  Design tokens — Oulamnauna admin palette                          */
/* ------------------------------------------------------------------ */
const colors = {
  creamLight: "#fcfaf5",
  creamMid: "#f8f1de",
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

/* ------------------------------------------------------------------ */
/*  Types & Mock data                                                  */
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
  type: "added" | "modified" | "deleted";
  original?: { id: string; title: string; year: string; format: "BOOK" | "MANUSCRIPT" | "ARTICLE"; access: string | null; };
  proposed: { id: string; title: string; year: string; format: "BOOK" | "MANUSCRIPT" | "ARTICLE"; access: string | null; };
  status: FieldStatus;
}

interface MediaChange {
  id: string;
  type: "added" | "modified" | "deleted";
  original?: { id: string; title: string; meta: string; type: string; icon: string; color: string; description: string; access?: string | null; };
  proposed: { id: string; title: string; meta: string; type: string; icon: string; color: string; description: string; access?: string | null; };
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
  scholarNameAr: string;
  editor: string;
  editorAvatar: string;
  editDate: string;
  editType: string;
  originalContributor: string;
  language: "EN" | "AR" | "FR";
  changedFields: EditField[];
  workChanges: WorkChange[];
  mediaChanges: MediaChange[];
  disciplineChanges: DisciplineChange[];
  editorNote: string;
}

const EDIT_DETAIL: ScholarEdit = {
  id: "edit_001",
  scholarId: "sch_045",
  scholarName: "Ibn Khaldun",
  scholarNameAr: "ابن خلدون",
  editor: "Dr. Fatima Al-Zahra",
  editorAvatar: "FZ",
  editDate: "June 15, 2026",
  editType: "bio_modified",
  originalContributor: "Prof. Hassan",
  language: "EN",
  changedFields: [
    { id: "f1", fieldName: "bio", fieldLabel: "Biography", originalValue: "Ibn Khaldun was a 14th-century Arab historian and philosopher. He is considered one of the founding fathers of modern historiography, sociology, and economics.", proposedValue: "Ibn Khaldun (1332–1406) was a pioneering Arab historian, philosopher, and sociologist from Tunis. He is widely regarded as one of the founding fathers of modern historiography, sociology, and economics. His most famous work, the Muqaddimah, introduced groundbreaking concepts in social science.", status: "pending" },
    { id: "f2", fieldName: "region", fieldLabel: "Region", originalValue: "North Africa (Tunisia)", proposedValue: "North Africa (Tunisia) / Middle East (Egypt)", status: "pending" },
  ],
  workChanges: [
    { id: "w1", type: "added", proposed: { id: "wp1", title: "The Muqaddimah: An Introduction to History", year: "1377", format: "BOOK", access: "https://archive.org/details/muqaddimah" }, status: "pending" },
    { id: "w2", type: "modified", original: { id: "wo2", title: "Kitab al-Ibar", year: "1375", format: "BOOK", access: null }, proposed: { id: "wp2", title: "Kitab al-Ibar (Book of Lessons)", year: "1375", format: "BOOK", access: "https://archive.org/details/kitab-al-ibar" }, status: "pending" },
  ],
  mediaChanges: [
    { id: "m1", type: "added", proposed: { id: "mp1", title: "Manuscript of Muqaddimah", meta: "4.2 MB · Primary Source", type: "Primary Source", icon: "description", color: colors.creamMid, description: "Original 14th century manuscript scan with marginalia.", access: "https://archive.org/details/muqaddimah-manuscript" }, status: "pending" },
  ],
  disciplineChanges: [
    { id: "dc1", label: "Economics", type: "added", status: "pending" },
    { id: "dc2", label: "Philosophy of History", type: "added", status: "pending" },
    { id: "dc3", label: "Medieval Theology", type: "removed", status: "pending" },
  ],
  editorNote: "I've expanded the biography to include more context about his contributions to economics and philosophy. Also added his most famous work 'The Muqaddimah' which was missing from the bibliography.",
};

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */
export default function PendingEditReview() {
  const { id: _editId } = useParams();
  const navigate = useNavigate();
  const { t, lang } = useLang();
  const isRTL = lang === "AR";

  const [mode, setMode] = useState<"approve" | "reject" | "strip" | null>(null);
  const [note, setNote] = useState("");
  const [edit, setEdit] = useState<ScholarEdit>(EDIT_DETAIL);

  const [rejectingFieldId, setRejectingFieldId] = useState<string | null>(null);
  const [fieldRejectReason, setFieldRejectReason] = useState("");
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState<string>("");
  const [editingWorkId, setEditingWorkId] = useState<string | null>(null);
  const [editingWork, setEditingWork] = useState<{ title: string; year: string; access: string } | null>(null);
  const [editingMediaId, setEditingMediaId] = useState<string | null>(null);
  const [editingMedia, setEditingMedia] = useState<{ title: string; description: string; meta: string } | null>(null);

  const acceptField = (fieldId: string) => setEdit((prev) => ({ ...prev, changedFields: prev.changedFields.map((f) => f.id === fieldId ? { ...f, status: "accepted", rejectReason: undefined } : f) }));
  const rejectField = (fieldId: string, reason?: string) => { setEdit((prev) => ({ ...prev, changedFields: prev.changedFields.map((f) => f.id === fieldId ? { ...f, status: "rejected", rejectReason: reason } : f) })); setRejectingFieldId(null); setFieldRejectReason(""); };
  const resetField = (fieldId: string) => setEdit((prev) => ({ ...prev, changedFields: prev.changedFields.map((f) => f.id === fieldId ? { ...f, status: "pending", rejectReason: undefined } : f) }));
  const startFieldEdit = (fieldId: string, currentValue: string) => { setEditingFieldId(fieldId); setEditingValue(currentValue); };
  const cancelFieldEdit = () => { setEditingFieldId(null); setEditingValue(""); };
  const saveFieldEdit = () => { if (!editingFieldId) return; setEdit((prev) => ({ ...prev, changedFields: prev.changedFields.map((f) => f.id === editingFieldId ? { ...f, proposedValue: editingValue } : f) })); setEditingFieldId(null); setEditingValue(""); };

  const acceptWork = (workId: string) => setEdit((prev) => ({ ...prev, workChanges: prev.workChanges.map((w) => w.id === workId ? { ...w, status: "accepted" } : w) }));
  const rejectWork = (workId: string) => setEdit((prev) => ({ ...prev, workChanges: prev.workChanges.map((w) => w.id === workId ? { ...w, status: "rejected" } : w) }));
  const resetWork = (workId: string) => setEdit((prev) => ({ ...prev, workChanges: prev.workChanges.map((w) => w.id === workId ? { ...w, status: "pending" } : w) }));
  const startWorkEdit = (work: WorkChange) => { setEditingWorkId(work.id); setEditingWork({ title: work.proposed.title, year: work.proposed.year, access: work.proposed.access || "" }); };
  const cancelWorkEdit = () => { setEditingWorkId(null); setEditingWork(null); };
  const saveWorkEdit = () => { if (!editingWorkId || !editingWork) return; setEdit((prev) => ({ ...prev, workChanges: prev.workChanges.map((w) => w.id === editingWorkId ? { ...w, proposed: { ...w.proposed, title: editingWork.title, year: editingWork.year, access: editingWork.access || null } } : w) })); setEditingWorkId(null); setEditingWork(null); };

  const acceptMedia = (mediaId: string) => setEdit((prev) => ({ ...prev, mediaChanges: prev.mediaChanges.map((m) => m.id === mediaId ? { ...m, status: "accepted" } : m) }));
  const rejectMedia = (mediaId: string) => setEdit((prev) => ({ ...prev, mediaChanges: prev.mediaChanges.map((m) => m.id === mediaId ? { ...m, status: "rejected" } : m) }));
  const resetMedia = (mediaId: string) => setEdit((prev) => ({ ...prev, mediaChanges: prev.mediaChanges.map((m) => m.id === mediaId ? { ...m, status: "pending" } : m) }));
  const startMediaEdit = (media: MediaChange) => { setEditingMediaId(media.id); setEditingMedia({ title: media.proposed.title, description: media.proposed.description, meta: media.proposed.meta }); };
  const cancelMediaEdit = () => { setEditingMediaId(null); setEditingMedia(null); };
  const saveMediaEdit = () => { if (!editingMediaId || !editingMedia) return; setEdit((prev) => ({ ...prev, mediaChanges: prev.mediaChanges.map((m) => m.id === editingMediaId ? { ...m, proposed: { ...m.proposed, title: editingMedia.title, description: editingMedia.description, meta: editingMedia.meta } } : m) })); setEditingMediaId(null); setEditingMedia(null); };

  const acceptDiscipline = (id: string) => setEdit((prev) => ({ ...prev, disciplineChanges: prev.disciplineChanges.map((d) => d.id === id ? { ...d, status: "accepted" } : d) }));
  const rejectDiscipline = (id: string) => setEdit((prev) => ({ ...prev, disciplineChanges: prev.disciplineChanges.map((d) => d.id === id ? { ...d, status: "rejected" } : d) }));
  const resetDiscipline = (id: string) => setEdit((prev) => ({ ...prev, disciplineChanges: prev.disciplineChanges.map((d) => d.id === id ? { ...d, status: "pending" } : d) }));

  const handleConfirm = () => { console.log("Edit decision:", { editId: edit.id, decision: mode, note, edit }); navigate("/admin/pending/edits"); };

  const countStatus = (items: { status: FieldStatus }[], status: FieldStatus) => items.filter((i) => i.status === status).length;
  const acceptedCount = countStatus(edit.changedFields, "accepted") + countStatus(edit.workChanges, "accepted") + countStatus(edit.mediaChanges, "accepted") + countStatus(edit.disciplineChanges, "accepted");
  const rejectedCount = countStatus(edit.changedFields, "rejected") + countStatus(edit.workChanges, "rejected") + countStatus(edit.mediaChanges, "rejected") + countStatus(edit.disciplineChanges, "rejected");
  const pendingCount = countStatus(edit.changedFields, "pending") + countStatus(edit.workChanges, "pending") + countStatus(edit.mediaChanges, "pending") + countStatus(edit.disciplineChanges, "pending");
  const totalChanges = edit.changedFields.length + edit.workChanges.length + edit.mediaChanges.length + edit.disciplineChanges.length;

  const addedDisciplines = edit.disciplineChanges.filter((d) => d.type === "added");
  const removedDisciplines = edit.disciplineChanges.filter((d) => d.type === "removed");

  const thStyle: React.CSSProperties = { fontFamily: fonts.label, fontSize: 11, letterSpacing: "0.06em", fontWeight: 600, color: colors.forestGreen, textAlign: isRTL ? "right" : "left", padding: "10px 14px", borderBottom: `1px solid ${colors.forestGreen}`, textTransform: "uppercase", opacity: 0.8 };
  const tdStyle: React.CSSProperties = { fontFamily: fonts.body, fontSize: 13, color: colors.forestGreen, padding: "12px 14px", borderBottom: `1px solid ${colors.creamDark}`, textAlign: isRTL ? "right" : "left" };

  return (
    <div dir={isRTL ? "rtl" : "ltr"} style={{ fontFamily: fonts.body, color: colors.forestGreen, backgroundColor: colors.creamLight, minHeight: "100vh", padding: 24 }}>
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>

        {/* ── Back Navigation ── */}
        <button onClick={() => navigate("/admin/pending/edits")} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", backgroundColor: "transparent", border: `1px solid ${colors.forestGreen}`, borderRadius: 8, fontFamily: fonts.body, fontSize: 12, color: colors.forestGreen, cursor: "pointer", marginBottom: 16 }}>
          <Icon name={isRTL ? "arrow_forward" : "arrow_back"} size={14} /> {isRTL ? "العودة إلى التعديلات" : "Back to Pending Edits"}
        </button>

        {/* ── Summary Stats ── */}
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

        {/* ── Hero Card ── */}
        <section style={{ ...cardStyle, padding: 24, marginBottom: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 20, flexWrap: "wrap" }}>
            <div style={{ display: "flex", gap: 18, alignItems: "flex-start" }}>
              <div style={{ width: 56, height: 56, borderRadius: "50%", backgroundColor: colors.creamMid, border: `2px solid ${colors.forestGreen}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: fonts.headline, fontWeight: 700, fontSize: 16, color: colors.forestGreen, flexShrink: 0 }}>
                {edit.editorAvatar}
              </div>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6, flexWrap: "wrap" }}>
                  <h1 style={{ fontFamily: fonts.headline, fontSize: 22, fontWeight: 700, color: colors.forestGreen, margin: 0 }}>{edit.scholarName}</h1>
                  <span style={{ fontFamily: fonts.body, fontSize: 15, color: colors.forestGreen, opacity: 0.7 }}>· {edit.scholarNameAr}</span>
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
              <button onClick={() => setMode(mode === "strip" ? null : "strip")} title="Strip" style={{ width: "36px", height: "36px", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "transparent", border: `1px solid ${colors.forestGreen}`, borderRadius: 8, color: colors.forestGreen, cursor: "pointer" }}>
                <Icon name="person_remove" size={20} />
              </button>
              <button onClick={() => setMode(mode === "reject" ? null : "reject")} title="Reject All" style={{ width: "36px", height: "36px", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "transparent", border: `1px solid ${colors.red}`, borderRadius: 8, color: colors.red, cursor: "pointer" }}>
                <Icon name="cancel" size={20} />
              </button>
              <button onClick={() => setMode(mode === "approve" ? null : "approve")} title="Approve Accepted" style={{ width: "36px", height: "36px", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: colors.forestGreen, border: `1px solid ${colors.forestGreen}`, borderRadius: 8, color: colors.creamLight, cursor: "pointer" }}>
                <Icon name="check_circle" size={20} filled />
              </button>
            </div>
          </div>
        </section>

        {/* ── Two-Column Content ── */}
        <div style={{ display: "grid", gridTemplateColumns: isRTL ? "1fr 300px" : "1fr 300px", gap: 18 }}>
          
          {/* Left Column (Main Content) */}
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            
            {/* Changed Fields */}
            {edit.changedFields.length > 0 && (
              <div style={{ ...cardStyle, padding: 20 }}>
                <h2 style={{ fontFamily: fonts.headline, fontSize: 16, fontWeight: 600, color: colors.forestGreen, margin: "0 0 16px", display: "flex", alignItems: "center", gap: 8 }}>
                  <Icon name="edit_note" size={18} filled /> Changed Fields ({edit.changedFields.length})
                </h2>
                {edit.changedFields.map((field) => {
                  const isEditingThis = editingFieldId === field.id;
                  return (
                    <div key={field.id} style={{ ...cardStyle, marginBottom: 16, border: field.status === "accepted" ? `1px solid ${colors.forestGreen}` : field.status === "rejected" ? `1px solid ${colors.red}` : `1px solid ${colors.creamDark}`, backgroundColor: field.status === "accepted" ? "rgba(11,67,53,0.04)" : field.status === "rejected" ? "rgba(139,44,44,0.04)" : colors.creamLight }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", backgroundColor: colors.creamMid, borderBottom: `1px solid ${colors.creamDark}` }}>
                        <span style={{ fontFamily: fonts.body, fontSize: 12, fontWeight: 700, color: colors.forestGreen, display: "flex", alignItems: "center", gap: 6 }}><Icon name="label" size={14} /> {field.fieldLabel}</span>
                        <div style={{ display: "flex", gap: 6 }}>
                          {field.status === "pending" && !isEditingThis && (<>
                            <button onClick={() => acceptField(field.id)} title="Accept" style={{ width: 30, height: 30, borderRadius: 6, border: `1px solid ${colors.forestGreen}`, backgroundColor: "transparent", color: colors.forestGreen, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name="check" size={16} /></button>
                            <button onClick={() => startFieldEdit(field.id, field.proposedValue)} title="Modify" style={{ width: 30, height: 30, borderRadius: 6, border: `1px solid ${colors.amber}`, backgroundColor: "transparent", color: colors.amber, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name="edit" size={16} /></button>
                            <button onClick={() => setRejectingFieldId(field.id)} title="Reject" style={{ width: 30, height: 30, borderRadius: 6, border: `1px solid ${colors.red}`, backgroundColor: "transparent", color: colors.red, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name="close" size={16} /></button>
                          </>)}
                          {(field.status === "accepted" || field.status === "rejected") && (
                            <button onClick={() => resetField(field.id)} title="Reset" style={{ width: 30, height: 30, borderRadius: 6, border: `1px solid ${colors.forestGreen}`, backgroundColor: "transparent", color: colors.forestGreen, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name="undo" size={16} /></button>
                          )}
                        </div>
                      </div>
                      <div style={{ padding: 14 }}>
                        {isEditingThis ? (<>
                          <textarea value={editingValue} onChange={(e) => setEditingValue(e.target.value)} style={{ width: "100%", minHeight: 100, padding: 10, border: `1.5px dashed ${colors.amber}`, borderRadius: 6, fontFamily: fonts.body, fontSize: 13, color: colors.forestGreen, backgroundColor: "rgba(184,134,11,0.06)", resize: "vertical", outline: "none", boxSizing: "border-box" }} />
                          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                            <button onClick={saveFieldEdit} style={{ padding: "6px 12px", borderRadius: 5, border: "none", backgroundColor: colors.forestGreen, color: colors.creamLight, fontFamily: fonts.body, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Save</button>
                            <button onClick={cancelFieldEdit} style={{ padding: "6px 12px", borderRadius: 5, border: `1px solid ${colors.creamDark}`, backgroundColor: colors.creamLight, color: colors.forestGreen, fontFamily: fonts.body, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Cancel</button>
                          </div>
                        </>) : (<>
                          <div style={{ display: "flex", gap: 12, marginBottom: 10 }}>
                            <div style={{ flex: 1, padding: 10, borderRadius: 6, backgroundColor: "rgba(139,44,44,0.06)", border: `1px solid rgba(139,44,44,0.25)`, color: colors.red, fontSize: 13, lineHeight: 1.6, textDecoration: "line-through" }}>
                              <div style={{ fontFamily: fonts.label, fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6, display: "flex", alignItems: "center", gap: 4 }}><Icon name="delete" size={12} /> Original</div>
                              {field.originalValue}
                            </div>
                            <div style={{ flex: 1, padding: 10, borderRadius: 6, backgroundColor: "rgba(11,67,53,0.06)", border: `1px solid rgba(11,67,53,0.25)`, color: colors.forestGreen, fontSize: 13, lineHeight: 1.6 }}>
                              <div style={{ fontFamily: fonts.label, fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6, display: "flex", alignItems: "center", gap: 4 }}><Icon name="add" size={12} /> Proposed</div>
                              {field.proposedValue}
                            </div>
                          </div>
                          {rejectingFieldId === field.id && (
                            <div style={{ marginTop: 10, padding: 10, border: `1px solid rgba(139,44,44,0.25)`, borderRadius: 6, backgroundColor: "rgba(139,44,44,0.04)" }}>
                              <p style={{ fontFamily: fonts.body, fontSize: 11, fontWeight: 600, color: colors.red, margin: "0 0 6px" }}>Rejection Reason</p>
                              <textarea value={fieldRejectReason} onChange={(e) => setFieldRejectReason(e.target.value)} placeholder="Enter reason..." style={{ width: "100%", minHeight: 60, padding: 8, border: `1px solid ${colors.creamDark}`, borderRadius: 4, fontFamily: fonts.body, fontSize: 12, resize: "vertical", outline: "none", boxSizing: "border-box" }} />
                              <div style={{ display: "flex", gap: 6, marginTop: 8, justifyContent: "flex-end" }}>
                                <button onClick={() => { setRejectingFieldId(null); setFieldRejectReason(""); }} style={{ padding: "6px 12px", borderRadius: 5, border: `1px solid ${colors.creamDark}`, backgroundColor: colors.creamLight, color: colors.forestGreen, fontFamily: fonts.body, fontSize: 11, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
                                <button onClick={() => rejectField(field.id, fieldRejectReason)} style={{ padding: "6px 12px", borderRadius: 5, border: "none", backgroundColor: colors.red, color: colors.creamLight, fontFamily: fonts.body, fontSize: 11, fontWeight: 600, cursor: "pointer" }}>Confirm Reject</button>
                              </div>
                            </div>
                          )}
                          {field.status === "rejected" && field.rejectReason && (
                            <div style={{ marginTop: 10, padding: 8, backgroundColor: "rgba(139,44,44,0.06)", border: `1px solid rgba(139,44,44,0.25)`, borderRadius: 4, fontSize: 11, color: colors.red }}><strong>Reason:</strong> {field.rejectReason}</div>
                          )}
                        </>)}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Work Changes */}
            {edit.workChanges.length > 0 && (
              <div style={{ ...cardStyle, padding: 20 }}>
                <h2 style={{ fontFamily: fonts.headline, fontSize: 16, fontWeight: 600, color: colors.forestGreen, margin: "0 0 16px", display: "flex", alignItems: "center", gap: 8 }}>
                  <Icon name="menu_book" size={18} filled /> Work Changes ({edit.workChanges.length})
                </h2>
                {edit.workChanges.map((work) => {
                  const isEditingThis = editingWorkId === work.id;
                  return (
                    <div key={work.id} style={{ ...cardStyle, marginBottom: 16, border: work.status === "accepted" ? `1px solid ${colors.forestGreen}` : work.status === "rejected" ? `1px solid ${colors.red}` : `1px solid ${colors.creamDark}` }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", backgroundColor: colors.creamMid, borderBottom: `1px solid ${colors.creamDark}` }}>
                        <span style={{ fontFamily: fonts.label, fontSize: 10, fontWeight: 700, padding: "3px 9px", borderRadius: 4, backgroundColor: work.type === "added" ? "rgba(11,67,53,0.08)" : work.type === "modified" ? "rgba(74,127,203,0.12)" : "rgba(139,44,44,0.06)", color: work.type === "added" ? colors.forestGreen : work.type === "modified" ? "#4a7fcb" : colors.red, textTransform: "uppercase", letterSpacing: "0.05em", display: "inline-flex", alignItems: "center", gap: 4 }}>
                          <Icon name={work.type === "added" ? "add" : work.type === "modified" ? "edit" : "delete"} size={12} /> {work.type}
                        </span>
                        <div style={{ display: "flex", gap: 6 }}>
                          {work.status === "pending" && !isEditingThis && (<>
                            <button onClick={() => acceptWork(work.id)} title="Accept" style={{ width: 30, height: 30, borderRadius: 6, border: `1px solid ${colors.forestGreen}`, backgroundColor: "transparent", color: colors.forestGreen, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name="check" size={16} /></button>
                            <button onClick={() => startWorkEdit(work)} title="Modify" style={{ width: 30, height: 30, borderRadius: 6, border: `1px solid ${colors.amber}`, backgroundColor: "transparent", color: colors.amber, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name="edit" size={16} /></button>
                            <button onClick={() => rejectWork(work.id)} title="Reject" style={{ width: 30, height: 30, borderRadius: 6, border: `1px solid ${colors.red}`, backgroundColor: "transparent", color: colors.red, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name="close" size={16} /></button>
                          </>)}
                          {work.status !== "pending" && !isEditingThis && (
                            <button onClick={() => resetWork(work.id)} title="Reset" style={{ width: 30, height: 30, borderRadius: 6, border: `1px solid ${colors.forestGreen}`, backgroundColor: "transparent", color: colors.forestGreen, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name="undo" size={16} /></button>
                          )}
                        </div>
                      </div>
                      {isEditingThis && editingWork ? (
                        <div style={{ padding: 14, backgroundColor: "rgba(184,134,11,0.06)" }}>
                          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                            <input value={editingWork.title} onChange={(e) => setEditingWork({ ...editingWork, title: e.target.value })} placeholder="Title" style={{ width: "100%", padding: "8px 10px", border: `1.5px dashed ${colors.amber}`, borderRadius: 5, fontFamily: fonts.body, fontSize: 13, color: colors.forestGreen, backgroundColor: colors.creamLight, outline: "none", boxSizing: "border-box" }} />
                            <div style={{ display: "flex", gap: 10 }}>
                              <input value={editingWork.year} onChange={(e) => setEditingWork({ ...editingWork, year: e.target.value })} placeholder="Year" style={{ flex: "0 0 100px", padding: "8px 10px", border: `1.5px dashed ${colors.amber}`, borderRadius: 5, fontFamily: fonts.body, fontSize: 13, color: colors.forestGreen, backgroundColor: colors.creamLight, outline: "none", boxSizing: "border-box" }} />
                              <input value={editingWork.access} onChange={(e) => setEditingWork({ ...editingWork, access: e.target.value })} placeholder="Access URL" style={{ flex: 1, padding: "8px 10px", border: `1.5px dashed ${colors.amber}`, borderRadius: 5, fontFamily: fonts.body, fontSize: 13, color: colors.forestGreen, backgroundColor: colors.creamLight, outline: "none", boxSizing: "border-box" }} />
                            </div>
                            <div style={{ display: "flex", gap: 8 }}>
                              <button onClick={saveWorkEdit} style={{ padding: "6px 12px", borderRadius: 5, border: "none", backgroundColor: colors.forestGreen, color: colors.creamLight, fontFamily: fonts.body, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Save</button>
                              <button onClick={cancelWorkEdit} style={{ padding: "6px 12px", borderRadius: 5, border: `1px solid ${colors.creamDark}`, backgroundColor: colors.creamLight, color: colors.forestGreen, fontFamily: fonts.body, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Cancel</button>
                            </div>
                          </div>
                        </div>
                      ) : (
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
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Media Changes */}
            {edit.mediaChanges.length > 0 && (
              <div style={{ ...cardStyle, padding: 20 }}>
                <h2 style={{ fontFamily: fonts.headline, fontSize: 16, fontWeight: 600, color: colors.forestGreen, margin: "0 0 16px", display: "flex", alignItems: "center", gap: 8 }}>
                  <Icon name="folder_open" size={18} filled /> Media Changes ({edit.mediaChanges.length})
                </h2>
                {edit.mediaChanges.map((media) => {
                  const isEditingThis = editingMediaId === media.id;
                  return (
                    <div key={media.id} style={{ ...cardStyle, marginBottom: 16, border: media.status === "accepted" ? `1px solid ${colors.forestGreen}` : media.status === "rejected" ? `1px solid ${colors.red}` : `1px solid ${colors.creamDark}` }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", backgroundColor: colors.creamMid, borderBottom: `1px solid ${colors.creamDark}` }}>
                        <span style={{ fontFamily: fonts.label, fontSize: 10, fontWeight: 700, padding: "3px 9px", borderRadius: 4, backgroundColor: media.type === "added" ? "rgba(11,67,53,0.08)" : media.type === "modified" ? "rgba(74,127,203,0.12)" : "rgba(139,44,44,0.06)", color: media.type === "added" ? colors.forestGreen : media.type === "modified" ? "#4a7fcb" : colors.red, textTransform: "uppercase", letterSpacing: "0.05em", display: "inline-flex", alignItems: "center", gap: 4 }}>
                          <Icon name={media.type === "added" ? "add" : media.type === "modified" ? "edit" : "delete"} size={12} /> {media.type}
                        </span>
                        <div style={{ display: "flex", gap: 6 }}>
                          {media.status === "pending" && !isEditingThis && (<>
                            <button onClick={() => acceptMedia(media.id)} title="Accept" style={{ width: 30, height: 30, borderRadius: 6, border: `1px solid ${colors.forestGreen}`, backgroundColor: "transparent", color: colors.forestGreen, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name="check" size={16} /></button>
                            <button onClick={() => startMediaEdit(media)} title="Modify" style={{ width: 30, height: 30, borderRadius: 6, border: `1px solid ${colors.amber}`, backgroundColor: "transparent", color: colors.amber, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name="edit" size={16} /></button>
                            <button onClick={() => rejectMedia(media.id)} title="Reject" style={{ width: 30, height: 30, borderRadius: 6, border: `1px solid ${colors.red}`, backgroundColor: "transparent", color: colors.red, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name="close" size={16} /></button>
                          </>)}
                          {media.status !== "pending" && !isEditingThis && (
                            <button onClick={() => resetMedia(media.id)} title="Reset" style={{ width: 30, height: 30, borderRadius: 6, border: `1px solid ${colors.forestGreen}`, backgroundColor: "transparent", color: colors.forestGreen, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name="undo" size={16} /></button>
                          )}
                        </div>
                      </div>
                      {isEditingThis && editingMedia ? (
                        <div style={{ padding: 14, backgroundColor: "rgba(184,134,11,0.06)" }}>
                          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                            <input value={editingMedia.title} onChange={(e) => setEditingMedia({ ...editingMedia, title: e.target.value })} placeholder="Title" style={{ width: "100%", padding: "8px 10px", border: `1.5px dashed ${colors.amber}`, borderRadius: 5, fontFamily: fonts.body, fontSize: 13, color: colors.forestGreen, backgroundColor: colors.creamLight, outline: "none", boxSizing: "border-box" }} />
                            <textarea value={editingMedia.description} onChange={(e) => setEditingMedia({ ...editingMedia, description: e.target.value })} placeholder="Description" style={{ width: "100%", minHeight: 70, padding: "8px 10px", border: `1.5px dashed ${colors.amber}`, borderRadius: 5, fontFamily: fonts.body, fontSize: 13, color: colors.forestGreen, backgroundColor: colors.creamLight, outline: "none", boxSizing: "border-box", resize: "vertical" }} />
                            <input value={editingMedia.meta} onChange={(e) => setEditingMedia({ ...editingMedia, meta: e.target.value })} placeholder="Meta" style={{ width: "100%", padding: "8px 10px", border: `1.5px dashed ${colors.amber}`, borderRadius: 5, fontFamily: fonts.body, fontSize: 13, color: colors.forestGreen, backgroundColor: colors.creamLight, outline: "none", boxSizing: "border-box" }} />
                            <div style={{ display: "flex", gap: 8 }}>
                              <button onClick={saveMediaEdit} style={{ padding: "6px 12px", borderRadius: 5, border: "none", backgroundColor: colors.forestGreen, color: colors.creamLight, fontFamily: fonts.body, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Save</button>
                              <button onClick={cancelMediaEdit} style={{ padding: "6px 12px", borderRadius: 5, border: `1px solid ${colors.creamDark}`, backgroundColor: colors.creamLight, color: colors.forestGreen, fontFamily: fonts.body, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Cancel</button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div style={{ display: "grid", gridTemplateColumns: media.original ? "1fr 1fr" : "1fr", gap: 14, padding: 14 }}>
                          {media.original && (
                            <div style={{ ...cardStyle, padding: 12, backgroundColor: "rgba(139,44,44,0.04)", border: `1px solid rgba(139,44,44,0.25)` }}>
                              <div style={{ display: "flex", gap: 10 }}>
                                <div style={{ width: 38, height: 38, borderRadius: 8, backgroundColor: media.original.color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Icon name={media.original.icon} size={20} /></div>
                                <div style={{ flex: 1 }}>
                                  <p style={{ fontFamily: fonts.headline, fontSize: 12.5, fontWeight: 600, color: colors.red, margin: "0 0 2px", textDecoration: "line-through" }}>{media.original.title}</p>
                                  <p style={{ fontFamily: fonts.body, fontSize: 11, color: colors.forestGreen, opacity: 0.8, margin: "0 0 3px", lineHeight: 1.5 }}>{media.original.description}</p>
                                  <p style={{ fontFamily: fonts.label, fontSize: 10, color: colors.forestGreen, opacity: 0.7, margin: 0 }}>{media.original.meta} · {media.original.type}</p>
                                  {media.original.access && <a href={media.original.access} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 4, marginTop: 6, fontSize: 11, fontWeight: 700, color: colors.forestGreen, textDecoration: "none", padding: "4px 8px", border: `1px solid ${colors.forestGreen}`, borderRadius: 6 }}><Icon name="open_in_new" size={12} /> View</a>}
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
                                {media.proposed.access && <a href={media.proposed.access} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 4, marginTop: 6, fontSize: 11, fontWeight: 700, color: colors.forestGreen, textDecoration: "none", padding: "4px 8px", border: `1px solid ${colors.forestGreen}`, borderRadius: 6 }}><Icon name="open_in_new" size={12} /> View</a>}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Discipline Changes */}
            {edit.disciplineChanges.length > 0 && (
              <div style={{ ...cardStyle, padding: 20 }}>
                <h2 style={{ fontFamily: fonts.headline, fontSize: 16, fontWeight: 600, color: colors.forestGreen, margin: "0 0 16px", display: "flex", alignItems: "center", gap: 8 }}>
                  <Icon name="category" size={18} filled /> Discipline Changes ({edit.disciplineChanges.length})
                </h2>
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {addedDisciplines.length > 0 && (
                    <div>
                      <p style={{ fontFamily: fonts.label, fontSize: 10, letterSpacing: "0.06em", color: colors.forestGreen, margin: "0 0 8px", opacity: 0.7, display: "flex", alignItems: "center", gap: 6 }}><Icon name="add_circle" size={14} /> PROPOSED NEW DISCIPLINES</p>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                        {addedDisciplines.map((d) => (
                          <span key={d.id} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 20, border: `1.5px solid ${d.status === "accepted" ? colors.forestGreen : d.status === "rejected" ? colors.creamDark : colors.forestGreen}`, backgroundColor: d.status === "accepted" ? "rgba(11,67,53,0.08)" : d.status === "rejected" ? colors.creamLight : colors.forestGreen, color: d.status === "rejected" ? colors.forestGreen : colors.creamLight, fontFamily: fonts.body, fontSize: 12, fontWeight: 600, transition: "all 0.15s" }}>
                            <Icon name="add" size={14} /> {d.label}
                            {d.status === "pending" && (<>
                              <button onClick={() => acceptDiscipline(d.id)} title="Accept" style={{ background: "none", border: "none", cursor: "pointer", padding: 2, borderRadius: "50%", display: "inline-flex", alignItems: "center", color: "rgba(255,255,255,0.85)" }}><Icon name="check" size={15} /></button>
                              <button onClick={() => rejectDiscipline(d.id)} title="Reject" style={{ background: "none", border: "none", cursor: "pointer", padding: 2, borderRadius: "50%", display: "inline-flex", alignItems: "center", color: "rgba(139,44,44,0.7)" }}><Icon name="close" size={15} /></button>
                            </>)}
                            {d.status === "accepted" && <Icon name="check_circle" size={14} />}
                            {d.status === "rejected" && <button onClick={() => resetDiscipline(d.id)} title="Reset" style={{ background: "none", border: "none", cursor: "pointer", padding: 2, borderRadius: "50%", display: "inline-flex", alignItems: "center", color: colors.forestGreen }}><Icon name="undo" size={15} /></button>}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {removedDisciplines.length > 0 && (
                    <div style={{ borderTop: `1px dashed ${colors.creamDark}`, paddingTop: 16 }}>
                      <p style={{ fontFamily: fonts.label, fontSize: 10, letterSpacing: "0.06em", color: colors.forestGreen, margin: "0 0 8px", opacity: 0.7, display: "flex", alignItems: "center", gap: 6 }}><Icon name="remove_circle" size={14} /> PROPOSED REMOVALS</p>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                        {removedDisciplines.map((d) => (
                          <span key={d.id} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 20, border: `1.5px solid ${d.status === "accepted" ? colors.red : d.status === "rejected" ? colors.creamDark : colors.red}`, backgroundColor: d.status === "accepted" ? "rgba(139,44,44,0.08)" : d.status === "rejected" ? colors.creamLight : colors.red, color: d.status === "rejected" ? colors.red : colors.creamLight, fontFamily: fonts.body, fontSize: 12, fontWeight: 600, textDecoration: "line-through", transition: "all 0.15s" }}>
                            <Icon name="remove" size={14} /> {d.label}
                            {d.status === "pending" && (<>
                              <button onClick={() => acceptDiscipline(d.id)} title="Accept Removal" style={{ background: "none", border: "none", cursor: "pointer", padding: 2, borderRadius: "50%", display: "inline-flex", alignItems: "center", color: "rgba(255,255,255,0.85)" }}><Icon name="check" size={15} /></button>
                              <button onClick={() => rejectDiscipline(d.id)} title="Keep" style={{ background: "none", border: "none", cursor: "pointer", padding: 2, borderRadius: "50%", display: "inline-flex", alignItems: "center", color: "rgba(139,44,44,0.7)" }}><Icon name="close" size={15} /></button>
                            </>)}
                            {d.status === "accepted" && <Icon name="check_circle" size={14} />}
                            {d.status === "rejected" && <button onClick={() => resetDiscipline(d.id)} title="Reset" style={{ background: "none", border: "none", cursor: "pointer", padding: 2, borderRadius: "50%", display: "inline-flex", alignItems: "center", color: colors.red }}><Icon name="undo" size={15} /></button>}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>

          {/* Right Column (Sidebar) */}
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div style={{ ...cardStyle, padding: 18 }}>
              <h3 style={{ fontFamily: fonts.label, fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: colors.forestGreen, margin: "0 0 14px", opacity: 0.7 }}>Edit Information</h3>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
                <tbody>
                  <tr><td style={{ padding: "6px 0", borderBottom: `1px solid ${colors.creamDark}`, color: colors.forestGreen, opacity: 0.7, width: "40%" }}>Editor</td><td style={{ padding: "6px 0", borderBottom: `1px solid ${colors.creamDark}`, fontWeight: 600, textAlign: isRTL ? "left" : "right" }}>{edit.editor}</td></tr>
                  <tr><td style={{ padding: "6px 0", borderBottom: `1px solid ${colors.creamDark}`, color: colors.forestGreen, opacity: 0.7 }}>Date</td><td style={{ padding: "6px 0", borderBottom: `1px solid ${colors.creamDark}`, fontWeight: 600, textAlign: isRTL ? "left" : "right" }}>{edit.editDate}</td></tr>
                  <tr><td style={{ padding: "6px 0", borderBottom: `1px solid ${colors.creamDark}`, color: colors.forestGreen, opacity: 0.7 }}>Type</td><td style={{ padding: "6px 0", borderBottom: `1px solid ${colors.creamDark}`, fontWeight: 600, textAlign: isRTL ? "left" : "right" }}>{edit.editType}</td></tr>
                  <tr><td style={{ padding: "6px 0", borderBottom: `1px solid ${colors.creamDark}`, color: colors.forestGreen, opacity: 0.7 }}>Original</td><td style={{ padding: "6px 0", borderBottom: `1px solid ${colors.creamDark}`, fontWeight: 600, textAlign: isRTL ? "left" : "right" }}>{edit.originalContributor}</td></tr>
                  <tr><td style={{ padding: "6px 0", color: colors.forestGreen, opacity: 0.7 }}>Language</td><td style={{ padding: "6px 0", fontWeight: 600, textAlign: isRTL ? "left" : "right" }}>{edit.language}</td></tr>
                </tbody>
              </table>
            </div>

            <div style={{ ...cardStyle, padding: 18, backgroundColor: colors.forestGreen, color: colors.creamLight, border: `1px solid ${colors.forestGreen}` }}>
              <h3 style={{ fontFamily: fonts.label, fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: colors.creamLight, margin: "0 0 8px", opacity: 0.7, display: "flex", alignItems: "center", gap: 6 }}><Icon name="format_quote" size={14} /> Editor Note</h3>
              <p style={{ fontFamily: fonts.body, fontSize: 12, lineHeight: 1.7, color: colors.creamLight, opacity: 0.85, fontStyle: "italic", margin: 0 }}>{edit.editorNote}</p>
            </div>
          </div>

        </div>

        {/* ── Confirmation Modals ── */}
        {mode && (
          <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(11, 67, 53, 0.5)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }} onClick={() => { setMode(null); setNote(""); }}>
            <div style={{ ...cardStyle, backgroundColor: colors.creamLight, width: 440, maxWidth: "90vw", padding: 32, boxShadow: "0 20px 60px rgba(0,0,0,0.18)" }} onClick={(e) => e.stopPropagation()}>
              <div style={{ width: 56, height: 56, borderRadius: "50%", backgroundColor: mode === "approve" ? colors.forestGreen : colors.red, color: colors.creamLight, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20, border: `1px solid ${mode === "approve" ? colors.forestGreen : colors.red}` }}>
                <Icon name={mode === "approve" ? "check_circle" : mode === "reject" ? "cancel" : "person_remove"} size={28} filled />
              </div>
              <h2 style={{ fontFamily: fonts.headline, fontSize: 20, fontWeight: 700, color: colors.forestGreen, marginBottom: 12 }}>
                {mode === "approve" ? "Approve Accepted Changes" : mode === "reject" ? "Reject All Changes" : "Strip Editor"}
              </h2>
              <p style={{ fontFamily: fonts.body, fontSize: 14, color: colors.forestGreen, lineHeight: 1.6, marginBottom: 28, opacity: 0.8 }}>
                {mode === "approve" ? `Are you sure you want to approve ${acceptedCount} accepted changes for "${edit.scholarName}"?` : mode === "reject" ? "Are you sure you want to reject all changes? The editor will be notified." : `Are you sure you want to strip ${edit.editor} of this edit?`}
                {mode === "reject" && <><br /><b style={{ color: colors.red }}>This action cannot be undone.</b></>}
              </p>
              {mode === "reject" && (
                <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Enter rejection reason (optional)..." style={{ width: "100%", minHeight: 80, padding: 10, border: `1px solid ${colors.creamDark}`, borderRadius: 7, fontFamily: fonts.body, fontSize: 13, color: colors.forestGreen, resize: "vertical", outline: "none", boxSizing: "border-box", marginBottom: 18 }} />
              )}
              <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
                <button onClick={() => { setMode(null); setNote(""); }} style={{ padding: "10px 24px", borderRadius: 8, cursor: "pointer", border: `1px solid ${colors.forestGreen}`, backgroundColor: colors.creamLight, fontFamily: fonts.body, fontSize: 13, fontWeight: 600, color: colors.forestGreen }}>Cancel</button>
                <button onClick={handleConfirm} style={{ padding: "10px 24px", borderRadius: 8, cursor: "pointer", border: `1px solid ${mode === "approve" ? colors.forestGreen : colors.red}`, backgroundColor: mode === "approve" ? colors.forestGreen : colors.red, fontFamily: fonts.body, fontSize: 13, fontWeight: 700, color: colors.creamLight }}>
                  {mode === "approve" ? "Confirm Approve" : mode === "reject" ? "Confirm Reject" : "Confirm Strip"}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}