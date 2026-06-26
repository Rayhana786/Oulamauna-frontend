import React, { useRef, useState } from "react";
import { MONO, SERIF, LANG_LABELS } from "../constants";
import { SEED_COMMENTS } from "../data";
import type { Language, UITranslation, Comment, CommentsByLang, DraftByLang, VotedIds } from "../types";
import { Icon } from "./Icon";

function ReportDropdown({ onReport, onClose }: { onReport: (r: string) => void; onClose: () => void }) {
  const reasons = ["Spam", "Misinformation", "Off-topic", "Harassment", "Other"];
  return (
    <div style={{ position: "absolute", top: "calc(100% + 6px)", right: 0, zIndex: 100, backgroundColor: "#fff", border: "1px solid rgba(192,201,195,0.5)", borderRadius: "8px", boxShadow: "0 4px 20px rgba(0,0,0,0.12)", minWidth: "160px", overflow: "hidden" }}>
      <div style={{ padding: "8px 12px 6px", borderBottom: "1px solid #f0f1ee" }}><span style={{ ...MONO, fontSize: "9px", color: "#707974", letterSpacing: "0.1em" }}>REPORT REASON</span></div>
      {reasons.map((r) => (<button key={r} onClick={() => { onReport(r); onClose(); }} style={{ display: "block", width: "100%", textAlign: "left", padding: "8px 14px", fontSize: "12px", color: r === "Harassment" ? "#b3261e" : "#404945", background: "none", border: "none", cursor: "pointer" }} onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f3f4f1")} onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}>{r}</button>))}
    </div>
  );
}

function CommentCard({ comment: c, lang, t, votedIds, onVote, onAddReply, isReply = false }: { comment: Comment; lang: Language; t: UITranslation; votedIds: VotedIds; onVote: (id: number) => void; onAddReply: (parentId: number, text: string) => void; isReply?: boolean }) {
  const [replyOpen, setReplyOpen] = useState(false);
  const [replyDraft, setReplyDraft] = useState("");
  const [reportOpen, setReportOpen] = useState(false);
  const [reported, setReported] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);
  const sendLabel = lang === "AR" ? "إرسال" : lang === "FR" ? "ENVOYER" : "SEND";

  React.useEffect(() => {
    if (!reportOpen) return;
    const h = (e: MouseEvent) => { if (reportRef.current && !reportRef.current.contains(e.target as Node)) setReportOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [reportOpen]);

  return (
    <div style={{ backgroundColor: "#fff", border: "1.5px solid rgba(192,201,195,0.4)", borderRadius: "12px", padding: isReply ? "14px 18px" : "20px 24px", marginLeft: isReply ? "40px" : 0 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          <div style={{ width: isReply ? "28px" : "32px", height: isReply ? "28px" : "32px", borderRadius: "50%", backgroundColor: "#e7e8e6", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Icon name="person" size={isReply ? 14 : 16} /></div>
          <span style={{ fontSize: "13px", fontWeight: 700, color: "#191c1b" }}>{c.author}</span>
          {c.role && <span style={{ ...MONO, fontSize: "9px", backgroundColor: "rgba(11,67,53,0.08)", color: "#0b4335", padding: "2px 8px", borderRadius: "4px", fontWeight: 700 }}>{c.role}</span>}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ ...MONO, fontSize: "10px", color: "#c0c9c3", whiteSpace: "nowrap" }}>{c.time}</span>
          {!reported ? (
            <div ref={reportRef} style={{ position: "relative" }}>
              <button onClick={() => setReportOpen((v) => !v)} style={{ background: "none", border: "none", cursor: "pointer", color: "#c0c9c3", display: "flex", alignItems: "center", padding: "2px", borderRadius: "4px" }} onMouseEnter={(e) => (e.currentTarget.style.color = "#b3261e")} onMouseLeave={(e) => (e.currentTarget.style.color = "#c0c9c3")}><Icon name="flag" size={14} /></button>
              {reportOpen && <ReportDropdown onReport={() => setReported(true)} onClose={() => setReportOpen(false)} />}
            </div>
          ) : <span style={{ ...MONO, fontSize: "9px", color: "#b3261e", opacity: 0.7 }}>Reported</span>}
        </div>
      </div>
      <p style={{ fontSize: "13px", color: "#404945", lineHeight: 1.65, margin: "0 0 12px" }}>{c.text}</p>
      <div style={{ display: "flex", gap: "20px", alignItems: "center" }}>
        {!isReply && <button className="action-link" onClick={() => setReplyOpen((v) => !v)}><Icon name="reply" size={14} />{t.reply}</button>}
        <button className="action-link" onClick={() => onVote(c.id)} style={{ color: votedIds[c.id] ? "#0b4335" : "#707974", fontWeight: votedIds[c.id] ? 700 : 400 }}><Icon name="thumb_up" size={13} />{t.vote} ({c.votes})</button>
      </div>
      {replyOpen && !isReply && (
        <div style={{ marginTop: "14px", paddingTop: "14px", borderTop: "1px solid #f0f1ee" }}>
          <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
            <div style={{ width: "28px", height: "28px", borderRadius: "50%", flexShrink: 0, backgroundColor: "#e7e8e6", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name="person" size={14} /></div>
            <div style={{ flex: 1, border: "1.5px solid rgba(192,201,195,0.5)", borderRadius: "10px", backgroundColor: "#f9faf7", overflow: "hidden" }}>
              <textarea autoFocus value={replyDraft} onChange={(e) => setReplyDraft(e.target.value)} rows={2} style={{ width: "100%", border: "none", outline: "none", resize: "none", padding: "10px 14px", fontSize: "13px", color: "#191c1b", fontFamily: "'Source Sans 3', sans-serif", backgroundColor: "transparent" }} />
              <div style={{ display: "flex", justifyContent: "flex-end", padding: "6px 10px", borderTop: "1px solid #f0f1ee", gap: "8px" }}>
                <button onClick={() => { setReplyOpen(false); setReplyDraft(""); }} style={{ ...MONO, fontSize: "10px", color: "#707974", background: "none", border: "none", cursor: "pointer" }}>CANCEL</button>
                <button onClick={() => { if (!replyDraft.trim()) return; onAddReply(c.id, replyDraft.trim()); setReplyDraft(""); setReplyOpen(false); }} style={{ display: "flex", alignItems: "center", gap: "5px", backgroundColor: "#0b4335", color: "#fff", border: "none", borderRadius: "6px", padding: "6px 14px", cursor: "pointer", fontSize: "10px", fontWeight: 700, letterSpacing: "0.06em", fontFamily: "'JetBrains Mono', monospace" }} onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#285b4b")} onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#0b4335")}><Icon name="send" size={12} />{sendLabel}</button>
              </div>
            </div>
          </div>
        </div>
      )}
      {!isReply && c.replies && c.replies.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "14px" }}>
          {c.replies.map((r) => <CommentCard key={r.id} comment={r} lang={lang} t={t} votedIds={votedIds} onVote={onVote} onAddReply={onAddReply} isReply />)}
        </div>
      )}
    </div>
  );
}

export function Discussion({ lang, t }: { lang: Language; t: UITranslation }) {
  const [commentsByLang, setCommentsByLang] = useState<CommentsByLang>({ EN: SEED_COMMENTS.EN.map((c) => ({ ...c, replies: [] })), AR: SEED_COMMENTS.AR.map((c) => ({ ...c, replies: [] })), FR: [] });
  const [draftByLang, setDraftByLang] = useState<DraftByLang>({ EN: "", AR: "", FR: "" });
  const [votedIds, setVotedIds] = useState<VotedIds>({});
  const comments = commentsByLang[lang];
  const draft = draftByLang[lang];
  const setDraft = (val: string) => setDraftByLang((prev) => ({ ...prev, [lang]: val }));
  const sendLabel = lang === "AR" ? "إرسال" : lang === "FR" ? "ENVOYER" : "SEND";

  const submit = () => {
    if (!draft.trim()) return;
    setCommentsByLang((prev) => ({ ...prev, [lang]: [...prev[lang], { id: Date.now(), author: "You", role: null, text: draft.trim(), time: "just now", votes: 0, replies: [] }] }));
    setDraft("");
  };

  const handleVote = (id: number) => {
    if (votedIds[id]) return;
    setVotedIds((prev) => ({ ...prev, [id]: true }));
    setCommentsByLang((prev) => ({ ...prev, [lang]: prev[lang].map((c) => c.id === id ? { ...c, votes: c.votes + 1 } : { ...c, replies: (c.replies ?? []).map((r) => r.id === id ? { ...r, votes: r.votes + 1 } : r) }) }));
  };

  const handleAddReply = (parentId: number, text: string) => {
    setCommentsByLang((prev) => ({ ...prev, [lang]: prev[lang].map((c) => c.id === parentId ? { ...c, replies: [...(c.replies ?? []), { id: Date.now(), author: "You", role: null, text, time: "just now", votes: 0, replies: [] }] } : c) }));
  };

  return (
    <section style={{ marginTop: "80px", paddingTop: "40px", borderTop: "1px solid rgba(192,201,195,0.4)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px" }}>
        <h2 style={{ ...SERIF, fontSize: "22px", fontWeight: 700, color: "#0b4335", margin: 0, display: "flex", alignItems: "center", gap: "10px" }}><Icon name="forum" size={22} />{t.academicDiscussion}</h2>
        <span style={{ ...MONO, fontSize: "9px", fontWeight: 700, letterSpacing: "0.12em", padding: "4px 10px", borderRadius: "6px", backgroundColor: "rgba(11,67,53,0.08)", color: "#0b4335", border: "1px solid rgba(11,67,53,0.15)" }}>{LANG_LABELS[lang].toUpperCase()}</span>
      </div>
      <div style={{ maxWidth: "800px", display: "flex", flexDirection: "column", gap: "14px" }} dir={lang === "AR" ? "rtl" : "ltr"}>
        {comments.length === 0 && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px", padding: "48px 32px", textAlign: "center", border: "2px dashed #c0c9c3", borderRadius: "12px" }}>
            <Icon name="chat_bubble_outline" size={36} />
            <p style={{ color: "#707974", fontSize: "14px", margin: 0 }}>{t.noDiscussion}</p>
            <span style={{ ...MONO, fontSize: "10px", color: "#0b4335", fontWeight: 700, cursor: "pointer", textDecoration: "underline", textUnderlineOffset: "3px" }}>{t.startDiscussion}</span>
          </div>
        )}
        {comments.map((c) => <CommentCard key={c.id} comment={c} lang={lang} t={t} votedIds={votedIds} onVote={handleVote} onAddReply={handleAddReply} />)}
        <div style={{ display: "flex", gap: "14px", alignItems: "flex-start", marginTop: "4px" }}>
          <div style={{ width: "40px", height: "40px", borderRadius: "50%", flexShrink: 0, backgroundColor: "#e7e8e6", display: "flex", alignItems: "center", justifyContent: "center", color: "#707974", marginTop: "2px" }}><Icon name="person" size={20} /></div>
          <div style={{ flex: 1, border: "1.5px solid rgba(192,201,195,0.5)", borderRadius: "12px", backgroundColor: "#fff", overflow: "hidden" }}>
            <textarea value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={t.joinDialogue} rows={3} style={{ width: "100%", border: "none", outline: "none", resize: "none", padding: "14px 16px", fontSize: "13px", color: "#191c1b", fontFamily: "'Source Sans 3', sans-serif", backgroundColor: "transparent" }} />
            <div style={{ display: "flex", justifyContent: "flex-end", padding: "8px 12px", borderTop: "1px solid #f0f1ee" }}>
              <button onClick={submit} style={{ display: "flex", alignItems: "center", gap: "6px", backgroundColor: "#0b4335", color: "#fff", border: "none", borderRadius: "8px", padding: "8px 16px", cursor: "pointer", fontSize: "11px", fontWeight: 700, letterSpacing: "0.06em", fontFamily: "'JetBrains Mono', monospace" }} onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#285b4b")} onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#0b4335")}><Icon name="send" size={14} />{sendLabel}</button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}