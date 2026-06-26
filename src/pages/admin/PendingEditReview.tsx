import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useLang } from "../../context/LanguageContext";

/* ─────────────────────── Types ─────────────────────── */
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
  original?: {
    id: string;
    title: string;
    year: string;
    format: "BOOK" | "MANUSCRIPT" | "ARTICLE";
    access: string | null;
  };
  proposed: {
    id: string;
    title: string;
    year: string;
    format: "BOOK" | "MANUSCRIPT" | "ARTICLE";
    access: string | null;
  };
  status: FieldStatus;
}

interface MediaChange {
  id: string;
  type: "added" | "modified" | "deleted";
  original?: {
    id: string;
    title: string;
    meta: string;
    type: string;
    icon: string;
    color: string;
    description: string;
    access?: string | null;
  };
  proposed: {
    id: string;
    title: string;
    meta: string;
    type: string;
    icon: string;
    color: string;
    description: string;
    access?: string | null;
  };
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

/* ─────────────────────── Mock data ─────────────────────── */
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
    {
      id: "f1",
      fieldName: "bio",
      fieldLabel: "Biography",
      originalValue: "Ibn Khaldun was a 14th-century Arab historian and philosopher. He is considered one of the founding fathers of modern historiography, sociology, and economics.",
      proposedValue: "Ibn Khaldun (1332–1406) was a pioneering Arab historian, philosopher, and sociologist from Tunis. He is widely regarded as one of the founding fathers of modern historiography, sociology, and economics. His most famous work, the Muqaddimah, introduced groundbreaking concepts in social science.",
      status: "pending",
    },
    {
      id: "f2",
      fieldName: "region",
      fieldLabel: "Region",
      originalValue: "North Africa (Tunisia)",
      proposedValue: "North Africa (Tunisia) / Middle East (Egypt)",
      status: "pending",
    },
  ],
  workChanges: [
    {
      id: "w1",
      type: "added",
      proposed: {
        id: "wp1",
        title: "The Muqaddimah: An Introduction to History",
        year: "1377",
        format: "BOOK",
        access: "https://archive.org/details/muqaddimah",
      },
      status: "pending",
    },
    {
      id: "w2",
      type: "modified",
      original: {
        id: "wo2",
        title: "Kitab al-Ibar",
        year: "1375",
        format: "BOOK",
        access: null,
      },
      proposed: {
        id: "wp2",
        title: "Kitab al-Ibar (Book of Lessons)",
        year: "1375",
        format: "BOOK",
        access: "https://archive.org/details/kitab-al-ibar",
      },
      status: "pending",
    },
  ],
  mediaChanges: [
    {
      id: "m1",
      type: "added",
      proposed: {
        id: "mp1",
        title: "Manuscript of Muqaddimah",
        meta: "4.2 MB · Primary Source",
        type: "Primary Source",
        icon: "description",
        color: "#E8F0FE",
        description: "Original 14th century manuscript scan with marginalia.",
        access: "https://archive.org/details/muqaddimah-manuscript",
      },
      status: "pending",
    },
    {
      id: "m2",
      type: "modified",
      original: {
        id: "mo2",
        title: "Portrait of Ibn Khaldun",
        meta: "800 KB · Media",
        type: "Media",
        icon: "photo_library",
        color: "#FCE8E6",
        description: "Old portrait.",
        access: "https://archive.org/details/old-portrait",
      },
      proposed: {
        id: "mp2",
        title: "Portrait of Ibn Khaldun (Restored)",
        meta: "2.1 MB · Media",
        type: "Media",
        icon: "photo_library",
        color: "#FCE8E6",
        description: "High-resolution restored portrait from the Tunis National Library.",
        access: "https://archive.org/details/restored-portrait",
      },
      status: "pending",
    },
  ],
  disciplineChanges: [
    { id: "dc1", label: "Economics", type: "added", status: "pending" },
    { id: "dc2", label: "Philosophy of History", type: "added", status: "pending" },
    { id: "dc3", label: "Medieval Theology", type: "removed", status: "pending" },
  ],
  editorNote: "I've expanded the biography to include more context about his contributions to economics and philosophy. Also added his most famous work 'The Muqaddimah' which was missing from the bibliography. The region field now reflects his time in Egypt where he wrote most of his major works.",
};

/* ─────────────────────── Colors ─────────────────────── */
const C = {
  bg: "#FAF9F6",
  border: "#E0E2DF",
  primary: "#0b4335",
  forest: "#285B4B",
  gold: "#C9A84C",
  text: "#191c1b",
  muted: "#5C6360",
  subtle: "#9EAAA6",
  white: "#ffffff",
  hoverBg: "rgba(11,67,53,0.05)",
  addedBg: "rgba(40,91,75,0.08)",
  addedBorder: "rgba(40,91,75,0.3)",
  addedText: "#285B4B",
  removedBg: "rgba(186,26,26,0.06)",
  removedBorder: "rgba(186,26,26,0.25)",
  removedText: "#ba1a1a",
  acceptedBg: "rgba(40,91,75,0.12)",
  acceptedBorder: "rgba(40,91,75,0.35)",
  acceptedText: "#0b4335",
  rejectedBg: "rgba(186,26,26,0.06)",
  rejectedBorder: "rgba(186,26,26,0.25)",
  rejectedText: "#ba1a1a",
  approveBtn: "#0b4335",
  rejectBtn: "#ba1a1a",
  rejectBorder: "rgba(186,26,26,0.35)",
  rejectBg: "rgba(186,26,26,0.05)",
  stripText: "#5C6360",
  editBtn: "#9a6f1a",
  editBg: "rgba(201,168,76,0.12)",
  editBorder: "rgba(201,168,76,0.4)",
  newChipBg: "#0b4335",
  newChipText: "#ffffff",
  keptChipBg: "rgba(11,67,53,0.12)",
  keptChipBorder: "rgba(11,67,53,0.35)",
  keptChipText: "#0b4335",
};

type DecisionMode = null | "approve" | "reject" | "strip";

/* ─────────────────────── helpers ─────────────────────── */
function getMediaViewInfo(
  m: { icon: string; meta: string; type: string },
  t: (key: string) => string
): { label: string; icon: string } {
  if (m.icon === "mic" || m.meta.toLowerCase().includes("audio"))
    return { label: t("pendingEditReview.listen"), icon: "headphones" };
  if (m.icon === "play_circle" || m.meta.toLowerCase().includes("video"))
    return { label: t("pendingEditReview.watch"), icon: "play_circle" };
  if (
    m.icon === "description" ||
    m.meta.toLowerCase().includes("pdf") ||
    m.type.toLowerCase().includes("primary source")
  )
    return { label: t("pendingEditReview.viewPdf"), icon: "picture_as_pdf" };
  if (m.icon === "photo_library")
    return { label: t("pendingEditReview.viewPhotos"), icon: "image" };
  return { label: t("pendingEditReview.open"), icon: "open_in_new" };
}

/* ─────────────────────── Component ─────────────────────── */
export default function PendingEditReview() {
  const { id: _editId } = useParams();
  const navigate = useNavigate();
  const { t, lang } = useLang();
  const isRTL = lang === "AR";

  const [mode, setMode] = useState<DecisionMode>(null);
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

  /* ─── Field actions ─── */
  const acceptField = (fieldId: string) => {
    setEdit((prev) => ({
      ...prev,
      changedFields: prev.changedFields.map((f) =>
        f.id === fieldId ? { ...f, status: "accepted", rejectReason: undefined } : f
      ),
    }));
  };

  const rejectField = (fieldId: string, reason?: string) => {
    setEdit((prev) => ({
      ...prev,
      changedFields: prev.changedFields.map((f) =>
        f.id === fieldId ? { ...f, status: "rejected", rejectReason: reason } : f
      ),
    }));
    setRejectingFieldId(null);
    setFieldRejectReason("");
  };

  const resetField = (fieldId: string) => {
    setEdit((prev) => ({
      ...prev,
      changedFields: prev.changedFields.map((f) =>
        f.id === fieldId ? { ...f, status: "pending", rejectReason: undefined } : f
      ),
    }));
  };

  const startFieldEdit = (fieldId: string, currentValue: string) => {
    setEditingFieldId(fieldId);
    setEditingValue(currentValue);
  };

  const cancelFieldEdit = () => {
    setEditingFieldId(null);
    setEditingValue("");
  };

  const saveFieldEdit = () => {
    if (!editingFieldId) return;
    setEdit((prev) => ({
      ...prev,
      changedFields: prev.changedFields.map((f) =>
        f.id === editingFieldId ? { ...f, proposedValue: editingValue } : f
      ),
    }));
    setEditingFieldId(null);
    setEditingValue("");
  };

  /* ─── Work actions ─── */
  const acceptWork = (workId: string) => {
    setEdit((prev) => ({
      ...prev,
      workChanges: prev.workChanges.map((w) => (w.id === workId ? { ...w, status: "accepted" } : w)),
    }));
  };

  const rejectWork = (workId: string) => {
    setEdit((prev) => ({
      ...prev,
      workChanges: prev.workChanges.map((w) => (w.id === workId ? { ...w, status: "rejected" } : w)),
    }));
  };

  const resetWork = (workId: string) => {
    setEdit((prev) => ({
      ...prev,
      workChanges: prev.workChanges.map((w) => (w.id === workId ? { ...w, status: "pending" } : w)),
    }));
  };

  const startWorkEdit = (work: WorkChange) => {
    setEditingWorkId(work.id);
    setEditingWork({
      title: work.proposed.title,
      year: work.proposed.year,
      access: work.proposed.access || "",
    });
  };

  const cancelWorkEdit = () => {
    setEditingWorkId(null);
    setEditingWork(null);
  };

  const saveWorkEdit = () => {
    if (!editingWorkId || !editingWork) return;
    setEdit((prev) => ({
      ...prev,
      workChanges: prev.workChanges.map((w) =>
        w.id === editingWorkId
          ? {
              ...w,
              proposed: {
                ...w.proposed,
                title: editingWork.title,
                year: editingWork.year,
                access: editingWork.access || null,
              },
            }
          : w
      ),
    }));
    setEditingWorkId(null);
    setEditingWork(null);
  };

  /* ─── Media actions ─── */
  const acceptMedia = (mediaId: string) => {
    setEdit((prev) => ({
      ...prev,
      mediaChanges: prev.mediaChanges.map((m) => (m.id === mediaId ? { ...m, status: "accepted" } : m)),
    }));
  };

  const rejectMedia = (mediaId: string) => {
    setEdit((prev) => ({
      ...prev,
      mediaChanges: prev.mediaChanges.map((m) => (m.id === mediaId ? { ...m, status: "rejected" } : m)),
    }));
  };

  const resetMedia = (mediaId: string) => {
    setEdit((prev) => ({
      ...prev,
      mediaChanges: prev.mediaChanges.map((m) => (m.id === mediaId ? { ...m, status: "pending" } : m)),
    }));
  };

  const startMediaEdit = (media: MediaChange) => {
    setEditingMediaId(media.id);
    setEditingMedia({
      title: media.proposed.title,
      description: media.proposed.description,
      meta: media.proposed.meta,
    });
  };

  const cancelMediaEdit = () => {
    setEditingMediaId(null);
    setEditingMedia(null);
  };

  const saveMediaEdit = () => {
    if (!editingMediaId || !editingMedia) return;
    setEdit((prev) => ({
      ...prev,
      mediaChanges: prev.mediaChanges.map((m) =>
        m.id === editingMediaId
          ? {
              ...m,
              proposed: {
                ...m.proposed,
                title: editingMedia.title,
                description: editingMedia.description,
                meta: editingMedia.meta,
              },
            }
          : m
      ),
    }));
    setEditingMediaId(null);
    setEditingMedia(null);
  };

  /* ─── Discipline actions ─── */
  const acceptDiscipline = (id: string) => {
    setEdit((prev) => ({
      ...prev,
      disciplineChanges: prev.disciplineChanges.map((d) => (d.id === id ? { ...d, status: "accepted" } : d)),
    }));
  };

  const rejectDiscipline = (id: string) => {
    setEdit((prev) => ({
      ...prev,
      disciplineChanges: prev.disciplineChanges.map((d) => (d.id === id ? { ...d, status: "rejected" } : d)),
    }));
  };

  const resetDiscipline = (id: string) => {
    setEdit((prev) => ({
      ...prev,
      disciplineChanges: prev.disciplineChanges.map((d) => (d.id === id ? { ...d, status: "pending" } : d)),
    }));
  };

  /* ─── Final confirm ─── */
  const handleConfirm = () => {
    console.log("Edit decision:", { editId: edit.id, decision: mode, note, edit });
    navigate("/admin/pending/edits");
  };

  /* ─── Counts ─── */
  const countStatus = (items: { status: FieldStatus }[], status: FieldStatus) =>
    items.filter((i) => i.status === status).length;

  const acceptedCount =
    countStatus(edit.changedFields, "accepted") +
    countStatus(edit.workChanges, "accepted") +
    countStatus(edit.mediaChanges, "accepted") +
    countStatus(edit.disciplineChanges, "accepted");

  const rejectedCount =
    countStatus(edit.changedFields, "rejected") +
    countStatus(edit.workChanges, "rejected") +
    countStatus(edit.mediaChanges, "rejected") +
    countStatus(edit.disciplineChanges, "rejected");

  const pendingCount =
    countStatus(edit.changedFields, "pending") +
    countStatus(edit.workChanges, "pending") +
    countStatus(edit.mediaChanges, "pending") +
    countStatus(edit.disciplineChanges, "pending");

  const totalChanges =
    edit.changedFields.length +
    edit.workChanges.length +
    edit.mediaChanges.length +
    edit.disciplineChanges.length;

  const addedDisciplines = edit.disciplineChanges.filter((d) => d.type === "added");
  const removedDisciplines = edit.disciplineChanges.filter((d) => d.type === "removed");

  return (
    <div
      dir={isRTL ? "rtl" : "ltr"}
      style={{ fontFamily: "'Inter', sans-serif", color: C.text, background: C.bg, minHeight: "100vh" }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Source+Serif+4:ital,opsz,wght@0,8..60,400..700;1,8..60,400..700&family=JetBrains+Mono:wght@400;600;700&family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20,400,0,0&display=swap');

        .ms {
          font-family: 'Material Symbols Outlined';
          font-style: normal; font-size: 16px;
          display: inline-flex; align-items: center;
          user-select: none; line-height: 1; flex-shrink: 0;
        }

        .per-wrap { padding: 20px 28px 56px; }

        .per-crumbs {
          font-size: 12px; color: ${C.muted}; margin-bottom: 14px;
          display: flex; align-items: center; gap: 5px;
        }
        .per-crumbs a { color: ${C.muted}; text-decoration: none; }
        .per-crumbs a:hover { color: ${C.primary}; }
        .per-crumbs .ms { font-size: 14px; opacity: 0.5; }
        .per-crumbs b { color: ${C.text}; font-weight: 600; }

        .per-summary-bar {
          display: flex; align-items: center; justify-content: space-between;
          background: ${C.white}; border: 1px solid ${C.border};
          border-radius: 10px; padding: 16px 20px; margin-bottom: 20px;
          gap: 16px; flex-wrap: wrap;
        }
        .per-summary-stats { display: flex; gap: 20px; align-items: center; }
        .per-summary-stat { display: flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 600; }
        .per-summary-stat.accepted { color: ${C.acceptedText}; }
        .per-summary-stat.rejected { color: ${C.rejectedText}; }
        .per-summary-stat.pending { color: ${C.muted}; }
        .per-summary-stat .ms { font-size: 18px; }

        .per-hero {
          background: ${C.white}; border: 1px solid ${C.border};
          border-radius: 10px; padding: 18px 22px; margin-bottom: 20px;
          direction: ltr;
        }
        .per-hero-top { display: flex; align-items: flex-start; gap: 16px; }
        .per-avatar-initials {
          width: 56px; height: 56px; border-radius: 50%;
          background: ${C.hoverBg}; border: 2px solid rgba(11,67,53,0.12);
          display: flex; align-items: center; justify-content: center;
          font-size: 16px; font-weight: 700; color: ${C.forest}; flex-shrink: 0;
        }
        .per-hero-info { flex: 1; min-width: 0; }

        .per-hero-name {
          font-size: 17px; font-weight: 700; color: ${C.text};
          margin-bottom: 6px;
          display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
          direction: ltr;
        }
        .per-hero-name-latin { white-space: nowrap; }
        .per-hero-name-ar {
          direction: rtl; unicode-bidi: isolate;
          font-weight: 400; color: ${C.muted}; font-size: 15px;
          white-space: nowrap;
        }
        .per-badge-edit {
          font-size: 10px; font-weight: 700; letter-spacing: 0.06em;
          padding: 2px 9px; border-radius: 4px;
          background: ${C.editBg}; color: ${C.editBtn};
          text-transform: uppercase; white-space: nowrap; flex-shrink: 0;
        }

        .per-hero-meta {
          font-size: 12.5px; color: ${C.muted};
          display: flex; align-items: center; gap: 6px;
          flex-wrap: wrap; margin-bottom: 4px; direction: ltr;
        }
        .per-hero-meta .ms { font-size: 14px; color: ${C.subtle}; flex-shrink: 0; }
        .per-hero-meta strong { color: ${C.text}; white-space: nowrap; }
        .per-hero-meta-item { display: inline-flex; align-items: center; gap: 4px; white-space: nowrap; }
        .per-hero-meta-dot { color: ${C.subtle}; flex-shrink: 0; }

        .per-hero-actions {
          display: flex; align-items: center; justify-content: flex-end;
          gap: 8px; flex-wrap: wrap; margin-top: 14px; direction: ltr;
        }
        .per-hero-btn {
          display: inline-flex; align-items: center; gap: 6px;
          font-size: 12.5px; font-weight: 600; padding: 8px 14px;
          border-radius: 7px; cursor: pointer; border: 1.5px solid transparent;
          font-family: 'Inter', sans-serif; transition: opacity .15s, background .15s;
          white-space: nowrap; flex-shrink: 0;
        }
        .per-hero-btn .ms { font-size: 15px; }
        .per-hero-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .per-btn-strip  { background: ${C.white}; color: ${C.stripText}; border-color: ${C.border}; }
        .per-btn-strip:hover  { background: #F2F4F2; }
        .per-btn-reject { background: ${C.rejectBg}; color: ${C.rejectBtn}; border-color: ${C.rejectBorder}; }
        .per-btn-reject:hover { background: rgba(186,26,26,0.10); }
        .per-btn-approve { background: ${C.approveBtn}; color: #fff; border-color: transparent; }
        .per-btn-approve:hover { background: #0e5443; }
        .per-hero-actions.has-mode .per-hero-btn:not(.active-btn) { opacity: 0.35; }

        .per-modal-overlay {
          position: fixed; inset: 0; background: rgba(15,20,18,0.45);
          display: flex; align-items: center; justify-content: center;
          z-index: 50; padding: 20px;
        }
        .per-modal {
          background: #fff; border-radius: 12px; width: 100%; max-width: 420px;
          padding: 24px 26px; box-shadow: 0 12px 40px rgba(0,0,0,0.18); direction: ltr;
        }
        .per-modal-icon { width: 44px; height: 44px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-bottom: 14px; }
        .per-modal-icon .ms { font-size: 24px; }
        .per-modal-title { font-size: 16px; font-weight: 700; margin-bottom: 6px; color: ${C.text}; }
        .per-modal-sub { font-size: 13px; color: ${C.muted}; line-height: 1.55; margin-bottom: 16px; }
        .per-modal-actions { display: flex; gap: 10px; margin-top: 18px; }
        .per-modal-btn { flex: 1; font-size: 13px; font-weight: 700; padding: 10px; border-radius: 7px; cursor: pointer; border: none; font-family: 'Inter', sans-serif; }
        .per-modal-cancel { background: #F2F4F2; color: ${C.muted}; }
        .per-modal-cancel:hover { background: #E8EAE7; }

        .per-grid { display: flex; gap: 20px; align-items: flex-start; }
        .per-main { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 16px; }
        .per-sidebar { width: 272px; flex-shrink: 0; display: flex; flex-direction: column; gap: 14px; }

        .per-card { background: ${C.white}; border: 1px solid ${C.border}; border-radius: 10px; padding: 20px 22px; }
        .per-card-title {
          font-size: 10.5px; font-weight: 700; letter-spacing: 0.1em;
          text-transform: uppercase; color: ${C.muted};
          display: flex; align-items: center; gap: 7px; margin-bottom: 16px;
        }
        .per-card-title .ms { font-size: 15px; color: ${C.subtle}; }

        .per-diff-field {
          margin-bottom: 20px;
          border: 1px solid ${C.border};
          border-radius: 8px;
          overflow: hidden;
        }
        .per-diff-field.accepted { border-color: ${C.acceptedBorder}; background: ${C.acceptedBg}; }
        .per-diff-field.rejected { border-color: ${C.rejectedBorder}; background: ${C.rejectedBg}; }
        .per-diff-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 10px 14px;
          background: rgba(0,0,0,0.02);
          border-bottom: 1px solid ${C.border};
        }
        .per-diff-label {
          font-size: 12px; font-weight: 700; color: ${C.text};
          display: flex; align-items: center; gap: 6px;
        }
        .per-diff-actions { display: flex; gap: 6px; }
        .per-diff-btn {
          width: 30px; height: 30px;
          border-radius: 6px;
          cursor: pointer;
          border: 1px solid ${C.border};
          background: ${C.white};
          display: flex; align-items: center; justify-content: center;
          transition: all 0.18s;
        }
        .per-diff-btn .ms { font-size: 16px; }
        .per-diff-btn.accept { color: ${C.forest}; border-color: ${C.acceptedBorder}; }
        .per-diff-btn.accept:hover { background: ${C.acceptedBg}; }
        .per-diff-btn.reject { color: ${C.rejectBtn}; border-color: ${C.rejectedBorder}; }
        .per-diff-btn.reject:hover { background: ${C.rejectedBg}; }
        .per-diff-btn.edit { color: ${C.editBtn}; border-color: ${C.editBorder}; }
        .per-diff-btn.edit:hover { background: ${C.editBg}; }
        .per-diff-btn.reset { color: ${C.muted}; }
        .per-diff-btn.reset:hover { background: ${C.hoverBg}; }

        .per-diff-content { padding: 14px; }
        .per-diff-row { display: flex; gap: 12px; margin-bottom: 10px; }
        .per-diff-row:last-child { margin-bottom: 0; }
        .per-diff-version {
          flex: 1; padding: 10px 12px;
          border-radius: 6px;
          font-size: 13px; line-height: 1.6;
        }
        .per-diff-original {
          background: ${C.removedBg};
          border: 1px solid ${C.removedBorder};
          color: ${C.removedText};
          text-decoration: line-through;
        }
        .per-diff-proposed {
          background: ${C.addedBg};
          border: 1px solid ${C.addedBorder};
          color: ${C.addedText};
        }
        .per-diff-version-label {
          font-size: 10px; font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 6px;
          display: flex; align-items: center; gap: 4px;
        }
        .per-diff-original .per-diff-version-label { color: ${C.removedText}; }
        .per-diff-proposed .per-diff-version-label { color: ${C.addedText}; }

        .per-inline-edit {
          width: 100%; border: 1.5px dashed ${C.editBorder}; border-radius: 6px;
          padding: 10px 12px; font-family: inherit; font-size: 13.5px; line-height: 1.85;
          color: ${C.text}; background: rgba(201,168,76,0.06); box-sizing: border-box;
          resize: vertical; min-height: 100px;
        }
        .per-inline-edit:focus { outline: none; border-color: ${C.editBtn}; border-style: solid; }
        .per-inline-input {
          width: 100%; border: 1.5px dashed ${C.editBorder}; border-radius: 5px;
          padding: 6px 8px; font-family: inherit; font-size: inherit; color: inherit;
          background: rgba(201,168,76,0.06); box-sizing: border-box;
        }
        .per-inline-input:focus { outline: none; border-color: ${C.editBtn}; border-style: solid; }
        .per-inline-actions { display: flex; gap: 8px; margin-top: 8px; }
        .per-inline-btn {
          font-size: 12px; font-weight: 700; padding: 6px 12px;
          border-radius: 5px; cursor: pointer; border: none;
          font-family: 'Inter', sans-serif;
        }
        .per-inline-btn.save { background: ${C.primary}; color: white; }
        .per-inline-btn.save:hover { background: #0e5443; }
        .per-inline-btn.cancel { background: ${C.white}; color: ${C.muted}; border: 1px solid ${C.border}; }
        .per-inline-btn.cancel:hover { background: #F2F4F2; }

        .per-work-change {
          margin-bottom: 20px;
          border: 1px solid ${C.border};
          border-radius: 8px;
          overflow: hidden;
        }
        .per-work-change.accepted { border-color: ${C.acceptedBorder}; }
        .per-work-change.rejected { border-color: ${C.rejectedBorder}; opacity: 0.75; }
        .per-work-change-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 10px 14px;
          background: rgba(0,0,0,0.02);
          border-bottom: 1px solid ${C.border};
        }
        .per-change-type {
          font-size: 10px; font-weight: 700;
          padding: 3px 9px; border-radius: 4px;
          text-transform: uppercase; letter-spacing: 0.05em;
          display: inline-flex; align-items: center; gap: 4px;
        }
        .per-change-type.added { background: ${C.addedBg}; color: ${C.addedText}; }
        .per-change-type.modified { background: rgba(74,127,203,0.12); color: #4a7fcb; }
        .per-change-type.deleted { background: ${C.removedBg}; color: ${C.removedText}; }

        .per-works-table { width: 100%; border-collapse: collapse; }
        .per-works-table thead tr { background: #f3f4f1; border-bottom: 1.5px solid ${C.border}; }
        .per-works-table th {
          font-family: 'JetBrains Mono', monospace;
          padding: 10px 14px; text-align: left;
          font-size: 9px; color: ${C.muted};
          letter-spacing: 0.1em; font-weight: 700;
        }
        .per-works-table td {
          padding: 12px 14px; border-bottom: 1px solid #f0f1ee;
          font-size: 13px; vertical-align: middle;
        }
        .per-works-table tr:last-child td { border-bottom: none; }
        .per-works-table tr:hover td { background: #f9faf7; }
        .per-works-table tr.original-row td { background: ${C.removedBg}; }
        .per-works-table tr.proposed-row td { background: ${C.addedBg}; }
        .per-works-title { font-style: italic; font-weight: 600; color: ${C.text}; font-family: 'Source Serif 4', serif; }
        .per-works-title.original { text-decoration: line-through; color: ${C.removedText}; }
        .per-works-year { color: ${C.muted}; }
        .per-format-chip {
          font-family: 'JetBrains Mono', monospace;
          font-size: 9px; font-weight: 700;
          padding: 3px 9px; border-radius: 4px;
          background: rgba(11,67,53,0.07); color: ${C.primary};
        }
        .per-format-chip.manu { background: #f3f4f1; color: ${C.muted}; }
        .per-access-link {
          display: inline-flex; align-items: center; gap: 5px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px; font-weight: 700;
          color: ${C.primary}; text-decoration: none;
          padding: 4px 10px; border: 1.5px solid rgba(11,67,53,0.25);
          border-radius: 5px; transition: background .12s;
        }
        .per-access-link:hover { background: rgba(11,67,53,0.06); }
        .per-access-link .ms { font-size: 12px; }
        .per-row-label {
          font-family: 'JetBrains Mono', monospace;
          font-size: 9px; font-weight: 700;
          padding: 2px 6px; border-radius: 3px;
          text-transform: uppercase; letter-spacing: 0.05em;
        }
        .per-row-label.original { background: ${C.removedBg}; color: ${C.removedText}; border: 1px solid ${C.removedBorder}; }
        .per-row-label.proposed { background: ${C.addedBg}; color: ${C.addedText}; border: 1px solid ${C.addedBorder}; }

        .per-media-change {
          margin-bottom: 20px;
          border: 1px solid ${C.border};
          border-radius: 8px;
          overflow: hidden;
        }
        .per-media-change.accepted { border-color: ${C.acceptedBorder}; }
        .per-media-change.rejected { border-color: ${C.rejectedBorder}; opacity: 0.75; }
        .per-media-change-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 10px 14px;
          background: rgba(0,0,0,0.02);
          border-bottom: 1px solid ${C.border};
        }
        .per-media-grid {
          display: grid; grid-template-columns: 1fr 1fr; gap: 10px;
          padding: 14px;
        }
        .per-media-grid.single-col { grid-template-columns: 1fr; }
        .per-media-card {
          background: ${C.bg}; border: 1px solid ${C.border};
          border-radius: 8px; padding: 12px 14px;
          display: flex; align-items: flex-start; gap: 10px;
          direction: ltr;
        }
        .per-media-card.original {
          border-color: ${C.removedBorder};
          background: ${C.removedBg};
        }
        .per-media-card.proposed {
          border-color: ${C.addedBorder};
          background: ${C.addedBg};
        }
        .per-media-icon {
          width: 38px; height: 38px;
          border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .per-media-icon .ms { font-size: 20px; color: ${C.forest}; }
        .per-media-body {
          flex: 1; min-width: 0;
          display: flex; flex-direction: column; gap: 4px;
        }
        .per-media-title {
          font-size: 12.5px; font-weight: 600;
          color: ${C.text}; margin-bottom: 2px;
        }
        .per-media-title.original { text-decoration: line-through; color: ${C.removedText}; }
        .per-media-desc { font-size: 11px; color: ${C.muted}; line-height: 1.5; margin-bottom: 3px; }
        .per-media-meta { font-size: 10px; color: ${C.subtle}; font-family: 'JetBrains Mono', monospace; }
        .per-media-view-btn {
          display: inline-flex; align-items: center; gap: 5px; margin-top: 6px;
          font-size: 11px; font-weight: 700; color: ${C.primary};
          text-decoration: none;
          padding: 5px 10px; border: 1.5px solid rgba(11,67,53,0.25);
          border-radius: 6px;
          transition: background .12s;
          align-self: flex-start; white-space: nowrap;
        }
        .per-media-view-btn:hover { background: rgba(11,67,53,0.07); }
        .per-media-view-btn .ms { font-size: 14px; }

        .per-disciplines-section {
          display: flex; flex-direction: column; gap: 16px;
        }
        .per-disciplines-group {
          display: flex; flex-direction: column; gap: 8px;
        }
        .per-disciplines-group-label {
          font-size: 10px; font-weight: 700; letter-spacing: 0.08em;
          text-transform: uppercase; color: ${C.muted};
          display: flex; align-items: center; gap: 6px;
        }
        .per-disciplines-group-label .ms { font-size: 14px; color: ${C.subtle}; }
        .per-disciplines-chips {
          display: flex; flex-wrap: wrap; gap: 8px;
        }
        .per-discipline-chip {
          display: inline-flex; align-items: center; gap: 6px;
          font-size: 12px; font-weight: 600;
          padding: 6px 12px; border-radius: 20px;
          border: 1.5px solid;
          white-space: nowrap;
          transition: all 0.15s;
        }
        .per-discipline-chip.pending-add {
          background: ${C.newChipBg};
          border-color: ${C.newChipBg};
          color: ${C.newChipText};
        }
        .per-discipline-chip.pending-remove {
          background: ${C.removedBg};
          border-color: ${C.removedBorder};
          color: ${C.removedText};
          text-decoration: line-through;
        }
        .per-discipline-chip.accepted-add {
          background: ${C.keptChipBg};
          border-color: ${C.keptChipBorder};
          color: ${C.keptChipText};
        }
        .per-discipline-chip.accepted-remove {
          background: ${C.removedBg};
          border-color: ${C.removedBorder};
          color: ${C.removedText};
          text-decoration: line-through;
          opacity: 0.8;
        }
        .per-discipline-chip.rejected {
          background: ${C.bg};
          border-color: ${C.border};
          color: ${C.muted};
          opacity: 0.5;
        }
        .per-discipline-chip .ms { font-size: 14px; }
        .per-discipline-chip-actions {
          display: inline-flex; gap: 2px; margin-left: 4px;
        }
        .per-discipline-chip-btn {
          background: none; border: none; cursor: pointer;
          padding: 2px; border-radius: 50%;
          display: inline-flex; align-items: center;
          transition: background 0.12s;
          font-family: 'Material Symbols Outlined';
          font-style: normal; font-size: 15px; line-height: 1;
          user-select: none;
        }
        .per-discipline-chip-btn.accept {
          color: rgba(255,255,255,0.85);
        }
        .per-discipline-chip-btn.accept:hover { background: rgba(255,255,255,0.2); }
        .per-discipline-chip-btn.reject {
          color: rgba(186,26,26,0.7);
        }
        .per-discipline-chip-btn.reject:hover { background: rgba(186,26,26,0.15); color: ${C.rejectBtn}; }
        .per-discipline-chip-btn.reset {
          color: ${C.muted};
        }
        .per-discipline-chip-btn.reset:hover { background: ${C.hoverBg}; color: ${C.text}; }

        .per-editor-note {
          background: ${C.primary};
          border-radius: 8px;
          padding: 14px 16px;
        }
        .per-editor-note-title {
          font-size: 10px; font-weight: 700; letter-spacing: 0.1em;
          text-transform: uppercase; color: rgba(255,255,255,0.55);
          margin-bottom: 8px;
          display: flex; align-items: center; gap: 6px;
        }
        .per-editor-note-title .ms { font-size: 14px; color: ${C.gold}; }
        .per-editor-note-text {
          font-size: 12px; line-height: 1.7;
          color: rgba(255,255,255,0.85);
          font-style: italic;
        }

        .per-side-card {
          background: ${C.white};
          border: 1px solid ${C.border};
          border-radius: 10px;
          padding: 18px 18px 12px;
        }
        .per-side-title {
          font-size: 10px; font-weight: 700; letter-spacing: 0.1em;
          text-transform: uppercase; color: ${C.subtle};
          margin-bottom: 14px;
        }
        .per-info-table { width: 100%; border-collapse: collapse; font-size: 12.5px; }
        .per-info-table td { padding: 6px 0; border-bottom: 1px solid #F0F1EE; vertical-align: top; }
        .per-info-table td:first-child { color: ${C.muted}; width: 40%; }
        .per-info-table td:last-child { font-weight: 600; color: ${C.text}; text-align: right; }
        .per-info-table tr:last-child td { border-bottom: none; }

        .per-reject-reason {
          margin-top: 10px; padding: 10px 12px;
          border: 1px solid ${C.rejectedBorder};
          border-radius: 6px; background: ${C.rejectedBg};
        }
        .per-reject-reason-label { font-size: 11px; font-weight: 600; color: ${C.rejectBtn}; margin-bottom: 6px; }
        .per-reject-reason-input {
          width: 100%; padding: 8px 10px;
          border: 1px solid ${C.border}; border-radius: 4px;
          font-size: 12px; font-family: 'Inter', sans-serif;
          resize: vertical; min-height: 60px; box-sizing: border-box;
        }
        .per-reject-reason-input:focus { outline: none; border-color: ${C.rejectBtn}; }
        .per-reject-reason-actions { display: flex; gap: 6px; margin-top: 8px; justify-content: flex-end; }
        .per-reject-reason-btn {
          padding: 6px 12px; border-radius: 5px;
          font-size: 11px; font-weight: 600;
          cursor: pointer; border: none;
          font-family: 'Inter', sans-serif;
        }
        .per-reject-reason-btn.cancel { background: ${C.white}; color: ${C.muted}; border: 1px solid ${C.border}; }
        .per-reject-reason-btn.confirm { background: ${C.rejectBtn}; color: white; }

        .per-textarea {
          width: 100%; min-height: 80px;
          border: 1px solid ${C.border}; border-radius: 7px;
          padding: 10px 12px; font-size: 13px;
          font-family: 'Inter', sans-serif; color: ${C.text};
          resize: vertical; box-sizing: border-box; background: ${C.bg};
        }
        .per-textarea:focus { outline: none; border-color: ${C.forest}; }

        .per-rejection-reason {
          margin-top: 10px; padding: 8px 10px;
          background: ${C.rejectedBg};
          border: 1px solid ${C.rejectedBorder};
          border-radius: 4px;
          font-size: 11px; color: ${C.rejectedText};
        }

        @media (max-width: 860px) {
          .per-grid { flex-direction: column; }
          .per-sidebar { width: 100%; }
          .per-diff-row, .per-media-grid { flex-direction: column; grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="per-wrap">

        {/* Breadcrumbs */}
        <div className="per-crumbs">
          <a href="/admin">{t("navbar.dashboard")}</a>
          <span className="ms">chevron_right</span>
          <a href="/admin/pending/edits">{t("sidebar.pendingEdits")}</a>
          <span className="ms">chevron_right</span>
          <b>{edit.scholarName}</b>
        </div>

        {/* Summary bar */}
        <div className="per-summary-bar">
          <div className="per-summary-stats">
            <div className="per-summary-stat accepted">
              <span className="ms">check_circle</span>
              {acceptedCount} {t("pendingEditReview.accepted")}
            </div>
            <div className="per-summary-stat rejected">
              <span className="ms">cancel</span>
              {rejectedCount} {t("pendingEditReview.rejected")}
            </div>
            <div className="per-summary-stat pending">
              <span className="ms">pending</span>
              {pendingCount} {t("pendingEditReview.pending")}
            </div>
          </div>
          <div style={{ fontSize: 12, color: C.muted }}>
            {totalChanges} {t("pendingEditReview.totalChanges")}
          </div>
        </div>

        {/* Hero card */}
        <div className="per-hero">
          <div className="per-hero-top">
            <div className="per-avatar-initials">{edit.editorAvatar}</div>
            <div className="per-hero-info">
              <div className="per-hero-name">
                <span className="per-hero-name-latin">{edit.scholarName}</span>
                <span className="per-hero-name-ar">· {edit.scholarNameAr}</span>
                <span className="per-badge-edit">{t("pendingEditReview.pendingEdit")}</span>
              </div>
              <div className="per-hero-meta">
                <span className="per-hero-meta-item">
                  <span className="ms">person</span>
                  {t("pendingEditReview.editor")}: <strong>{edit.editor}</strong>
                </span>
                <span className="per-hero-meta-dot">·</span>
                <span className="per-hero-meta-item">
                  <span className="ms">person_outline</span>
                  {t("pendingEditReview.original")}: <strong>{edit.originalContributor}</strong>
                </span>
                <span className="per-hero-meta-dot">·</span>
                <span className="per-hero-meta-item">
                  <span className="ms">calendar_today</span>
                  {edit.editDate}
                </span>
              </div>
            </div>
          </div>

          <div className={`per-hero-actions${mode ? " has-mode" : ""}`}>
            <button
              className={`per-hero-btn per-btn-strip${mode === "strip" ? " active-btn" : ""}`}
              onClick={() => setMode(mode === "strip" ? null : "strip")}
            >
              <span className="ms">person_remove</span>
              {t("scholars.actions.strip")}
            </button>
            <button
              className={`per-hero-btn per-btn-reject${mode === "reject" ? " active-btn" : ""}`}
              onClick={() => setMode(mode === "reject" ? null : "reject")}
            >
              <span className="ms">cancel</span>
              {t("pendingEditReview.rejectAll")}
            </button>
            <button
              className={`per-hero-btn per-btn-approve${mode === "approve" ? " active-btn" : ""}`}
              onClick={() => setMode(mode === "approve" ? null : "approve")}
            >
              <span className="ms">check_circle</span>
              {t("pendingEditReview.approveAccepted").replace("{count}", String(acceptedCount))}
            </button>
          </div>
        </div>

        {/* Confirmation modal */}
        {mode && (
          <div className="per-modal-overlay" onClick={() => { setMode(null); setNote(""); }}>
            <div className="per-modal" onClick={(e) => e.stopPropagation()}>
              <div className="per-modal-icon" style={{ background: mode === "approve" ? "rgba(11,67,53,0.1)" : "rgba(186,26,26,0.08)" }}>
                <span className="ms" style={{ color: mode === "approve" ? C.primary : C.rejectBtn }}>
                  {mode === "approve" ? "check_circle" : mode === "reject" ? "cancel" : "person_remove"}
                </span>
              </div>
              <div className="per-modal-title">
                {mode === "approve" && t("pendingEditReview.modal.approveTitle")}
                {mode === "reject" && t("pendingEditReview.modal.rejectTitle")}
                {mode === "strip" && t("pendingEditReview.modal.stripTitle")}
              </div>
              <div className="per-modal-sub">
                {mode === "approve" && t("pendingEditReview.modal.approveSub").replace("{count}", String(acceptedCount)).replace("{name}", edit.scholarName)}
                {mode === "reject" && t("pendingEditReview.modal.rejectSub")}
                {mode === "strip" && t("pendingEditReview.modal.stripSub").replace("{name}", edit.editor)}
              </div>
              {mode === "reject" && (
                <textarea
                  className="per-textarea"
                  placeholder={t("pendingEditReview.modal.rejectPlaceholder")}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              )}
              <div className="per-modal-actions">
                <button className="per-modal-btn per-modal-cancel" onClick={() => { setMode(null); setNote(""); }}>
                  {t("scholars.review.cancel")}
                </button>
                <button
                  className="per-modal-btn"
                  style={{ background: mode === "approve" ? C.approveBtn : C.rejectBtn, color: "#fff" }}
                  onClick={handleConfirm}
                >
                  {mode === "approve" ? t("pendingEditReview.modal.confirmApprove") : mode === "reject" ? t("pendingEditReview.modal.confirmReject") : t("pendingEditReview.modal.confirmStrip")}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main grid */}
        <div className="per-grid">
          <div className="per-main">

            {/* ═════════════ CHANGED TEXT FIELDS ═════════════ */}
            {edit.changedFields.length > 0 && (
              <div className="per-card">
                <div className="per-card-title">
                  <span className="ms">edit_note</span>
                  {t("pendingEditReview.changedFields")} ({edit.changedFields.length})
                </div>

                {edit.changedFields.map((field) => {
                  const isEditingThis = editingFieldId === field.id;
                  return (
                    <div key={field.id} className={`per-diff-field ${field.status}`}>
                      <div className="per-diff-header">
                        <div className="per-diff-label">
                          <span className="ms" style={{ fontSize: 14 }}>label</span>
                          {field.fieldLabel}
                        </div>
                        <div className="per-diff-actions">
                          {field.status === "pending" && !isEditingThis && (
                            <>
                              <button className="per-diff-btn accept" onClick={() => acceptField(field.id)} title={t("pendingEditReview.accept")}>
                                <span className="ms">check</span>
                              </button>
                              <button className="per-diff-btn edit" onClick={() => startFieldEdit(field.id, field.proposedValue)} title={t("pendingEditReview.modify")}>
                                <span className="ms">edit</span>
                              </button>
                              <button className="per-diff-btn reject" onClick={() => setRejectingFieldId(field.id)} title={t("pendingEditReview.reject")}>
                                <span className="ms">close</span>
                              </button>
                            </>
                          )}
                          {(field.status === "accepted" || field.status === "rejected") && (
                            <button className="per-diff-btn reset" onClick={() => resetField(field.id)} title={t("pendingEditReview.reset")}>
                              <span className="ms">undo</span>
                            </button>
                          )}
                          {isEditingThis && (
                            <span style={{ fontSize: 11, fontWeight: 600, color: C.editBtn }}>
                              {t("pendingEditReview.editing")}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="per-diff-content">
                        {isEditingThis ? (
                          <>
                            <textarea
                              className="per-inline-edit"
                              value={editingValue}
                              onChange={(e) => setEditingValue(e.target.value)}
                            />
                            <div className="per-inline-actions">
                              <button className="per-inline-btn save" onClick={saveFieldEdit}>{t("pendingEditReview.saveChanges")}</button>
                              <button className="per-inline-btn cancel" onClick={cancelFieldEdit}>{t("pendingEditReview.cancel")}</button>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="per-diff-row">
                              <div className="per-diff-version per-diff-original">
                                <div className="per-diff-version-label">
                                  <span className="ms" style={{ fontSize: 12 }}>delete</span>
                                  {t("pendingEditReview.original")}
                                </div>
                                {field.originalValue}
                              </div>
                              <div className="per-diff-version per-diff-proposed">
                                <div className="per-diff-version-label">
                                  <span className="ms" style={{ fontSize: 12 }}>add</span>
                                  {t("pendingEditReview.proposed")}
                                </div>
                                {field.proposedValue}
                              </div>
                            </div>

                            {rejectingFieldId === field.id && (
                              <div className="per-reject-reason">
                                <div className="per-reject-reason-label">{t("pendingEditReview.rejectReasonLabel")}</div>
                                <textarea
                                  className="per-reject-reason-input"
                                  placeholder={t("pendingEditReview.rejectReasonPlaceholder")}
                                  value={fieldRejectReason}
                                  onChange={(e) => setFieldRejectReason(e.target.value)}
                                />
                                <div className="per-reject-reason-actions">
                                  <button className="per-reject-reason-btn cancel" onClick={() => { setRejectingFieldId(null); setFieldRejectReason(""); }}>{t("pendingEditReview.cancel")}</button>
                                  <button className="per-reject-reason-btn confirm" onClick={() => rejectField(field.id, fieldRejectReason)}>{t("pendingEditReview.confirmReject")}</button>
                                </div>
                              </div>
                            )}

                            {field.status === "rejected" && field.rejectReason && (
                              <div className="per-rejection-reason">
                                <strong>{t("pendingEditReview.rejectionReason")}:</strong> {field.rejectReason}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* ═════════════ DISCIPLINES ═════════════ */}
            {edit.disciplineChanges.length > 0 && (
              <div className="per-card">
                <div className="per-card-title">
                  <span className="ms">category</span>
                  {t("pendingEditReview.disciplineChanges")} ({edit.disciplineChanges.length})
                </div>

                <div className="per-disciplines-section">
                  {addedDisciplines.length > 0 && (
                    <div className="per-disciplines-group">
                      <div className="per-disciplines-group-label">
                        <span className="ms">add_circle</span>
                        {t("pendingEditReview.proposedNewDisciplines")}
                      </div>
                      <div className="per-disciplines-chips">
                        {addedDisciplines.map((d) => {
                          const chipClass =
                            d.status === "accepted" ? "accepted-add" :
                            d.status === "rejected" ? "rejected" :
                            "pending-add";
                          return (
                            <span key={d.id} className={`per-discipline-chip ${chipClass}`}>
                              <span className="ms">add</span>
                              {d.label}
                              {d.status === "pending" && (
                                <span className="per-discipline-chip-actions">
                                  <button className="per-discipline-chip-btn accept" onClick={() => acceptDiscipline(d.id)} title={t("pendingEditReview.accept")}>
                                    check
                                  </button>
                                  <button className="per-discipline-chip-btn reject" onClick={() => rejectDiscipline(d.id)} title={t("pendingEditReview.reject")}>
                                    close
                                  </button>
                                </span>
                              )}
                              {d.status === "accepted" && (
                                <span className="ms" style={{ fontSize: 14 }}>check_circle</span>
                              )}
                              {d.status === "rejected" && (
                                <button className="per-discipline-chip-btn reset" onClick={() => resetDiscipline(d.id)} title={t("pendingEditReview.reset")}>
                                  undo
                                </button>
                              )}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {removedDisciplines.length > 0 && (
                    <div className="per-disciplines-group">
                      <div className="per-disciplines-group-label">
                        <span className="ms">remove_circle</span>
                        {t("pendingEditReview.proposedRemovals")}
                      </div>
                      <div className="per-disciplines-chips">
                        {removedDisciplines.map((d) => {
                          const chipClass =
                            d.status === "accepted" ? "accepted-remove" :
                            d.status === "rejected" ? "rejected" :
                            "pending-remove";
                          return (
                            <span key={d.id} className={`per-discipline-chip ${chipClass}`}>
                              <span className="ms">remove</span>
                              {d.label}
                              {d.status === "pending" && (
                                <span className="per-discipline-chip-actions">
                                  <button className="per-discipline-chip-btn accept" onClick={() => acceptDiscipline(d.id)} title={t("pendingEditReview.acceptRemoval")}>
                                    check
                                  </button>
                                  <button className="per-discipline-chip-btn reject" onClick={() => rejectDiscipline(d.id)} title={t("pendingEditReview.keepDiscipline")}>
                                    close
                                  </button>
                                </span>
                              )}
                              {d.status === "accepted" && (
                                <span className="ms" style={{ fontSize: 14 }}>check_circle</span>
                              )}
                              {d.status === "rejected" && (
                                <button className="per-discipline-chip-btn reset" onClick={() => resetDiscipline(d.id)} title={t("pendingEditReview.reset")}>
                                  undo
                                </button>
                              )}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ═════════════ WORK CHANGES ═════════════ */}
            {edit.workChanges.length > 0 && (
              <div className="per-card">
                <div className="per-card-title">
                  <span className="ms">menu_book</span>
                  {t("pendingEditReview.workChanges")} ({edit.workChanges.length})
                </div>

                {edit.workChanges.map((work) => {
                  const isEditingThis = editingWorkId === work.id;
                  const workTypeLabel =
                    work.type === "added" ? t("pendingEditReview.newWork") :
                    work.type === "modified" ? t("pendingEditReview.modifiedWork") :
                    t("pendingEditReview.deletedWork");

                  return (
                    <div key={work.id} className={`per-work-change ${work.status}`}>
                      <div className="per-work-change-header">
                        <span className={`per-change-type ${work.type}`}>
                          <span className="ms" style={{ fontSize: 12 }}>
                            {work.type === "added" ? "add" : work.type === "modified" ? "edit" : "delete"}
                          </span>
                          {workTypeLabel}
                        </span>
                        <div className="per-diff-actions">
                          {work.status === "pending" && !isEditingThis && (
                            <>
                              <button className="per-diff-btn accept" onClick={() => acceptWork(work.id)} title={t("pendingEditReview.accept")}>
                                <span className="ms">check</span>
                              </button>
                              <button className="per-diff-btn edit" onClick={() => startWorkEdit(work)} title={t("pendingEditReview.modify")}>
                                <span className="ms">edit</span>
                              </button>
                              <button className="per-diff-btn reject" onClick={() => rejectWork(work.id)} title={t("pendingEditReview.reject")}>
                                <span className="ms">close</span>
                              </button>
                            </>
                          )}
                          {work.status !== "pending" && !isEditingThis && (
                            <button className="per-diff-btn reset" onClick={() => resetWork(work.id)} title={t("pendingEditReview.reset")}>
                              <span className="ms">undo</span>
                            </button>
                          )}
                          {isEditingThis && (
                            <span style={{ fontSize: 11, fontWeight: 600, color: C.editBtn }}>
                              {t("pendingEditReview.editing")}
                            </span>
                          )}
                        </div>
                      </div>

                      {isEditingThis && editingWork ? (
                        <div style={{ padding: 14, background: "rgba(201,168,76,0.04)" }}>
                          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                            <div>
                              <label style={{ fontSize: 10, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4, display: "block" }}>
                                {t("pendingEditReview.title")}
                              </label>
                              <input
                                className="per-inline-input"
                                style={{ fontStyle: "italic", fontWeight: 600, fontFamily: "'Source Serif 4', serif" }}
                                value={editingWork.title}
                                onChange={(e) => setEditingWork({ ...editingWork, title: e.target.value })}
                              />
                            </div>
                            <div style={{ display: "flex", gap: 10 }}>
                              <div style={{ flex: "0 0 100px" }}>
                                <label style={{ fontSize: 10, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4, display: "block" }}>
                                  {t("pendingEditReview.year")}
                                </label>
                                <input
                                  className="per-inline-input"
                                  value={editingWork.year}
                                  onChange={(e) => setEditingWork({ ...editingWork, year: e.target.value })}
                                />
                              </div>
                              <div style={{ flex: 1 }}>
                                <label style={{ fontSize: 10, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4, display: "block" }}>
                                  {t("pendingEditReview.accessUrl")}
                                </label>
                                <input
                                  className="per-inline-input"
                                  value={editingWork.access}
                                  onChange={(e) => setEditingWork({ ...editingWork, access: e.target.value })}
                                  placeholder="https://..."
                                />
                              </div>
                            </div>
                            <div className="per-inline-actions">
                              <button className="per-inline-btn save" onClick={saveWorkEdit}>{t("pendingEditReview.saveChanges")}</button>
                              <button className="per-inline-btn cancel" onClick={cancelWorkEdit}>{t("pendingEditReview.cancel")}</button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div style={{ border: `1px solid ${C.border}`, borderTop: "none", overflow: "hidden" }}>
                          <table className="per-works-table">
                            <thead>
                              <tr>
                                <th style={{ width: "60px" }}>{t("pendingEditReview.type")}</th>
                                <th>{t("pendingEditReview.title")}</th>
                                <th>{t("pendingEditReview.year")}</th>
                                <th>{t("pendingEditReview.format")}</th>
                                <th>{t("pendingEditReview.access")}</th>
                              </tr>
                            </thead>
                            <tbody>
                              {work.original && (
                                <tr className="original-row">
                                  <td><span className="per-row-label original">{t("pendingEditReview.origLabel")}</span></td>
                                  <td className="per-works-title original">{work.original.title}</td>
                                  <td className="per-works-year">{work.original.year}</td>
                                  <td>
                                    <span className={`per-format-chip${work.original.format !== "BOOK" ? " manu" : ""}`}>
                                      {work.original.format}
                                    </span>
                                  </td>
                                  <td>
                                    {work.original.access ? (
                                      <a href={work.original.access} target="_blank" rel="noopener noreferrer" className="per-access-link">
                                        <span className="ms">open_in_new</span>
                                        {t("pendingEditReview.view")}
                                      </a>
                                    ) : (
                                      <span style={{ fontSize: 13, color: C.subtle }}>—</span>
                                    )}
                                  </td>
                                </tr>
                              )}
                              <tr className="proposed-row">
                                <td>
                                  <span className="per-row-label proposed">
                                    {work.type === "added" ? t("pendingEditReview.newLabel") : t("pendingEditReview.editLabel")}
                                  </span>
                                </td>
                                <td className="per-works-title">{work.proposed.title}</td>
                                <td className="per-works-year">{work.proposed.year}</td>
                                <td>
                                  <span className={`per-format-chip${work.proposed.format !== "BOOK" ? " manu" : ""}`}>
                                    {work.proposed.format}
                                  </span>
                                </td>
                                <td>
                                  {work.proposed.access ? (
                                    <a href={work.proposed.access} target="_blank" rel="noopener noreferrer" className="per-access-link">
                                      <span className="ms">open_in_new</span>
                                      {t("pendingEditReview.view")}
                                    </a>
                                  ) : (
                                    <span style={{ fontSize: 13, color: C.subtle }}>—</span>
                                  )}
                                </td>
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

            {/* ═════════════ MEDIA CHANGES ═════════════ */}
            {edit.mediaChanges.length > 0 && (
              <div className="per-card">
                <div className="per-card-title">
                  <span className="ms">folder_open</span>
                  {t("pendingEditReview.mediaChanges")} ({edit.mediaChanges.length})
                </div>

                {edit.mediaChanges.map((media) => {
                  const proposedVi = getMediaViewInfo(media.proposed, t);
                  const originalVi = media.original ? getMediaViewInfo(media.original, t) : null;
                  const isEditingThis = editingMediaId === media.id;
                  const mediaTypeLabel =
                    media.type === "added" ? t("pendingEditReview.newMedia") :
                    media.type === "modified" ? t("pendingEditReview.modifiedMedia") :
                    t("pendingEditReview.deletedMedia");

                  return (
                    <div key={media.id} className={`per-media-change ${media.status}`}>
                      <div className="per-media-change-header">
                        <span className={`per-change-type ${media.type}`}>
                          <span className="ms" style={{ fontSize: 12 }}>
                            {media.type === "added" ? "add" : media.type === "modified" ? "edit" : "delete"}
                          </span>
                          {mediaTypeLabel}
                        </span>
                        <div className="per-diff-actions">
                          {media.status === "pending" && !isEditingThis && (
                            <>
                              <button className="per-diff-btn accept" onClick={() => acceptMedia(media.id)} title={t("pendingEditReview.accept")}>
                                <span className="ms">check</span>
                              </button>
                              <button className="per-diff-btn edit" onClick={() => startMediaEdit(media)} title={t("pendingEditReview.modify")}>
                                <span className="ms">edit</span>
                              </button>
                              <button className="per-diff-btn reject" onClick={() => rejectMedia(media.id)} title={t("pendingEditReview.reject")}>
                                <span className="ms">close</span>
                              </button>
                            </>
                          )}
                          {media.status !== "pending" && !isEditingThis && (
                            <button className="per-diff-btn reset" onClick={() => resetMedia(media.id)} title={t("pendingEditReview.reset")}>
                              <span className="ms">undo</span>
                            </button>
                          )}
                          {isEditingThis && (
                            <span style={{ fontSize: 11, fontWeight: 600, color: C.editBtn }}>
                              {t("pendingEditReview.editing")}
                            </span>
                          )}
                        </div>
                      </div>

                      {isEditingThis && editingMedia ? (
                        <div style={{ padding: 14, background: "rgba(201,168,76,0.04)" }}>
                          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                            <div>
                              <label style={{ fontSize: 10, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4, display: "block" }}>
                                {t("pendingEditReview.title")}
                              </label>
                              <input
                                className="per-inline-input"
                                style={{ fontWeight: 600 }}
                                value={editingMedia.title}
                                onChange={(e) => setEditingMedia({ ...editingMedia, title: e.target.value })}
                              />
                            </div>
                            <div>
                              <label style={{ fontSize: 10, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4, display: "block" }}>
                                {t("pendingEditReview.description")}
                              </label>
                              <textarea
                                className="per-inline-edit"
                                style={{ minHeight: 70 }}
                                value={editingMedia.description}
                                onChange={(e) => setEditingMedia({ ...editingMedia, description: e.target.value })}
                              />
                            </div>
                            <div>
                              <label style={{ fontSize: 10, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4, display: "block" }}>
                                {t("pendingEditReview.meta")}
                              </label>
                              <input
                                className="per-inline-input"
                                value={editingMedia.meta}
                                onChange={(e) => setEditingMedia({ ...editingMedia, meta: e.target.value })}
                              />
                            </div>
                            <div className="per-inline-actions">
                              <button className="per-inline-btn save" onClick={saveMediaEdit}>{t("pendingEditReview.saveChanges")}</button>
                              <button className="per-inline-btn cancel" onClick={cancelMediaEdit}>{t("pendingEditReview.cancel")}</button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className={`per-media-grid${media.original ? "" : " single-col"}`}>
                          {media.original && (
                            <div className="per-media-card original">
                              <div className="per-media-icon" style={{ background: media.original.color }}>
                                <span className="ms">{media.original.icon}</span>
                              </div>
                              <div className="per-media-body">
                                <div className="per-media-title original">{media.original.title}</div>
                                <div className="per-media-desc">{media.original.description}</div>
                                <div className="per-media-meta">{media.original.meta} · {media.original.type}</div>
                                {media.original.access && originalVi && (
                                  <a href={media.original.access} target="_blank" rel="noopener noreferrer" className="per-media-view-btn">
                                    <span className="ms">{originalVi.icon}</span>
                                    {originalVi.label}
                                  </a>
                                )}
                              </div>
                            </div>
                          )}

                          <div className="per-media-card proposed">
                            <div className="per-media-icon" style={{ background: media.proposed.color }}>
                              <span className="ms">{media.proposed.icon}</span>
                            </div>
                            <div className="per-media-body">
                              <div className="per-media-title">{media.proposed.title}</div>
                              <div className="per-media-desc">{media.proposed.description}</div>
                              <div className="per-media-meta">{media.proposed.meta} · {media.proposed.type}</div>
                              {media.proposed.access && (
                                <a href={media.proposed.access} target="_blank" rel="noopener noreferrer" className="per-media-view-btn">
                                  <span className="ms">{proposedVi.icon}</span>
                                  {proposedVi.label}
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

          </div>

          {/* Sidebar */}
          <div className="per-sidebar">
            <div className="per-side-card">
              <div className="per-side-title">{t("pendingEditReview.editInformation")}</div>
              <table className="per-info-table">
                <tbody>
                  <tr><td>{t("pendingEditReview.editor")}</td><td>{edit.editor}</td></tr>
                  <tr><td>{t("pendingEditReview.editDate")}</td><td>{edit.editDate}</td></tr>
                  <tr><td>{t("pendingEditReview.editType")}</td><td>{edit.editType}</td></tr>
                  <tr><td>{t("pendingEditReview.originalAuthor")}</td><td>{edit.originalContributor}</td></tr>
                  <tr><td>{t("pendingEditReview.language")}</td><td>{edit.language}</td></tr>
                </tbody>
              </table>
            </div>

            <div className="per-editor-note">
              <div className="per-editor-note-title">
                <span className="ms">format_quote</span>
                {t("pendingEditReview.editorNote")}
              </div>
              <div className="per-editor-note-text">{edit.editorNote}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}