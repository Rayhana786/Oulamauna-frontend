import React, { useState, useEffect } from "react";
import { adminApi, ContactMessage } from "../../api/adminApi";
import { useLang } from "../../context/LanguageContext";

export default function ContactUsManagement() {
  const { lang, t } = useLang();
  const isRTL = lang === "AR";

  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "replied" | "archived">("all");

  // Modal State
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [replyText, setReplyText] = useState("");
  const [adminNote, setAdminNote] = useState("");
  const [isSending, setIsSending] = useState(false);

  // ✅ Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const response = await adminApi.contactus.getAll();
      if (response.data?.success && response.data.data) {
        setMessages(response.data.data);
      }
    } catch (error) {
      console.error(t("admin.contactUs.errors.fetchFailed") || "Failed to fetch contact messages:", error);
    } finally {
      setLoading(false);
    }
  };

  // Filter logic
  const filteredMessages = messages.filter((msg) => filter === "all" || msg.status === filter);

  // ✅ Pagination Logic
  const totalPages = Math.ceil(filteredMessages.length / ITEMS_PER_PAGE);
  const paginatedMessages = filteredMessages.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Reset to page 1 when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filter]);

  // Handlers
  const handleOpenReply = (msg: ContactMessage) => {
    setSelectedMessage(msg);
    setReplyText(msg.admin_reply || "");
    setAdminNote(msg.admin_note || "");
  };

  const handleCloseModal = () => {
    setSelectedMessage(null);
    setReplyText("");
    setAdminNote("");
  };

  const handleSendReply = async () => {
    if (!selectedMessage || !replyText.trim()) return;
    setIsSending(true);
    try {
      await adminApi.contactus.reply(selectedMessage.id, {
        admin_reply: replyText.trim(),
        admin_note: adminNote.trim() || undefined,
      });
      handleCloseModal();
      fetchMessages();
    } catch (error) {
      console.error(t("admin.contactUs.errors.sendFailed") || "Failed to send reply:", error);
      alert(t("admin.contactUs.errors.sendFailed") || "Failed to send reply. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  // ✅ NEW: Archive handler (replaces delete)
  const handleArchive = async (id: number) => {
    if (!window.confirm(t("admin.contactUs.confirm.archive") || "Are you sure you want to archive this message?")) return;
    try {
      await adminApi.contactus.archive(id);
      fetchMessages();
    } catch (error) {
      console.error(t("admin.contactUs.errors.archiveFailed") || "Failed to archive message:", error);
      alert(t("admin.contactUs.errors.archiveFailed") || "Failed to archive message.");
    }
  };

  // ✅ HELPER: Translate Subject dynamically
  const getTranslatedSubject = (subject: string | undefined) => {
    if (!subject) return t("admin.contactUs.noSubject") || "No Subject";
    
    const subjectMap: Record<string, string> = {
      "General Inquiry": t("admin.contactUs.subjects.general") || "General Inquiry",
      "Technical Issue": t("admin.contactUs.subjects.technical") || "Technical Issue",
      "Partnership": t("admin.contactUs.subjects.partnership") || "Partnership",
      "Partnership / Collaboration": t("admin.contactUs.subjects.partnership") || "Partnership / Collaboration",
      "Content Correction": t("admin.contactUs.subjects.correction") || "Content Correction",
      "Other": t("admin.contactUs.subjects.other") || "Other",
    };

    return subjectMap[subject] || subject;
  };

  // Helpers
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(
      lang === "AR" ? "ar-SA" : lang === "FR" ? "fr-FR" : "en-US",
      { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" }
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#b8860b]/10 text-[#b8860b] mono-label text-[10px] font-bold">{t("admin.contactUs.status.pending") || "PENDING"}</span>;
      case "replied":
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#1e4d3a]/10 text-[#1e4d3a] mono-label text-[10px] font-bold">{t("admin.contactUs.status.replied") || "REPLIED"}</span>;
      case "archived":
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#1e4d3a]/30 text-[#1e4d3a]/60 mono-label text-[10px] font-bold">{t("admin.contactUs.status.archived") || "ARCHIVED"}</span>;
      default:
        return null;
    }
  };

  if (loading) {
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
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="serif-title text-[27px] md:text-[32px] leading-tight font-semibold text-[#082f27] flex items-center gap-3">
              <span className="material-symbols-outlined text-[32px] text-[#1e4d3a]" style={{ fontVariationSettings: "'FILL' 1" }}>mail</span>
              {t("admin.contactUs.title") || "Contact Us Management"}
            </h1>
            <p className="text-[12px] text-[#1e4d3a]/60 mt-1 ms-11">
              {t("admin.contactUs.subtitle") || "Review and reply to user inquiries."}
            </p>
          </div>
          <button 
            onClick={fetchMessages} 
            className="flex items-center gap-2 px-4 py-2 rounded-[6px] border border-[#1e4d3a] text-[#1e4d3a] text-[12px] font-bold uppercase tracking-wide hover:bg-[#1e4d3a] hover:text-white transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">refresh</span> {t("admin.contactUs.refresh") || "Refresh"}
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-6">
          {(["all", "pending", "replied", "archived"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-[6px] text-[12px] font-bold uppercase tracking-wide transition-all duration-200 cursor-pointer ${
                filter === f 
                  ? "bg-[#1e4d3a] text-white" 
                  : "bg-[#f6efdc] text-[#1e4d3a] hover:bg-[#1e4d3a]/10"
              }`}
            >
              {t(`admin.contactUs.filter.${f}`) || f} {f !== "all" && `(${messages.filter(m => m.status === f).length})`}
            </button>
          ))}
        </div>

        {/* Table Card */}
        <div className="dashboard-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#1e4d3a]/10 bg-[#1e4d3a]/[0.02]">
                  <th className={`mono-label text-[9px] uppercase font-bold text-[#1e4d3a]/60 px-5 py-3.5 ${isRTL ? "text-right" : "text-left"}`}>{t("admin.contactUs.table.date") || "Date"}</th>
                  <th className={`mono-label text-[9px] uppercase font-bold text-[#1e4d3a]/60 px-5 py-3.5 ${isRTL ? "text-right" : "text-left"}`}>{t("admin.contactUs.table.name") || "Name"}</th>
                  <th className={`mono-label text-[9px] uppercase font-bold text-[#1e4d3a]/60 px-5 py-3.5 ${isRTL ? "text-right" : "text-left"}`}>{t("admin.contactUs.table.email") || "Email"}</th>
                  <th className={`mono-label text-[9px] uppercase font-bold text-[#1e4d3a]/60 px-5 py-3.5 ${isRTL ? "text-right" : "text-left"}`}>{t("admin.contactUs.table.subject") || "Subject"}</th>
                  <th className="mono-label text-[9px] uppercase font-bold text-[#1e4d3a]/60 px-5 py-3.5 text-center">{t("admin.contactUs.table.status") || "Status"}</th>
                  <th className="mono-label text-[9px] uppercase font-bold text-[#1e4d3a]/60 px-5 py-3.5 text-right">{t("admin.contactUs.table.actions") || "Actions"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e4d3a]/[0.06]">
                {paginatedMessages.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center text-[12px] text-[#1e4d3a]/50">
                      {t("admin.contactUs.empty") || "No messages found for this filter."}
                    </td>
                  </tr>
                ) : (
                  paginatedMessages.map((msg) => (
                    <tr key={msg.id} className="hover:bg-[#1e4d3a]/[0.015] transition-colors">
                      <td className={`px-5 py-3.5 text-[13px] text-[#1e4d3a]/70 whitespace-nowrap ${isRTL ? "text-right" : "text-left"}`}>
                        {formatDate(msg.created_at)}
                      </td>
                      <td className={`px-5 py-3.5 text-[14px] font-semibold text-[#082f27] ${isRTL ? "text-right" : "text-left"}`}>
                        {msg.name}
                      </td>
                      <td className={`px-5 py-3.5 text-[13px] text-[#1e4d3a] ${isRTL ? "text-right" : "text-left"}`}>
                        {msg.email}
                      </td>
                      <td className={`px-5 py-3.5 text-[13px] text-[#1e4d3a]/80 max-w-[200px] truncate ${isRTL ? "text-right" : "text-left"}`}>
                        {getTranslatedSubject(msg.subject)}
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        {getStatusBadge(msg.status)}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => handleOpenReply(msg)} 
                            title={t("admin.contactUs.actions.viewReply") || "View & Reply"} 
                            className="w-8 h-8 flex items-center justify-center rounded-[6px] border border-[#1e4d3a]/20 text-[#1e4d3a] hover:bg-[#1e4d3a] hover:text-white transition-colors cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[18px]">{msg.status === "pending" ? "reply" : "visibility"}</span>
                          </button>
                          {/* ✅ ARCHIVE BUTTON (replaces delete) */}
                          {msg.status !== "archived" && (
                            <button 
                              onClick={() => handleArchive(msg.id)} 
                              title={t("admin.contactUs.actions.archive") || "Archive"} 
                              className="w-8 h-8 flex items-center justify-center rounded-[6px] border border-[#1e4d3a]/30 text-[#1e4d3a]/60 hover:bg-[#1e4d3a]/10 hover:text-[#1e4d3a] transition-colors cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-[18px]">archive</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* ✅ PAGINATION FOOTER */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-5 py-4 border-t border-[#1e4d3a]/10 bg-[#1e4d3a]/[0.01]">
              <div className="text-[11px] text-[#1e4d3a]/60 mono-label">
                {t("admin.common.showing") || "Showing"} {(currentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, filteredMessages.length)} {t("admin.common.of") || "of"} {filteredMessages.length}
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1} className="flex items-center justify-center w-8 h-8 rounded-[6px] border border-[#1e4d3a]/20 text-[#1e4d3a] disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#1e4d3a] hover:text-white transition-colors cursor-pointer">
                  <span className="material-symbols-outlined text-[18px]">{isRTL ? 'arrow_forward' : 'arrow_back'}</span>
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) pageNum = i + 1;
                  else if (currentPage <= 3) pageNum = i + 1;
                  else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                  else pageNum = currentPage - 2 + i;
                  return (
                    <button key={pageNum} onClick={() => setCurrentPage(pageNum)} className={`w-8 h-8 rounded-[6px] text-[11px] font-bold mono-label transition-colors cursor-pointer ${currentPage === pageNum ? 'bg-[#1e4d3a] text-white' : 'border border-[#1e4d3a]/20 text-[#1e4d3a] hover:bg-[#1e4d3a]/10'}`}>
                      {pageNum}
                    </button>
                  );
                })}
                <button onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages} className="flex items-center justify-center w-8 h-8 rounded-[6px] border border-[#1e4d3a]/20 text-[#1e4d3a] disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#1e4d3a] hover:text-white transition-colors cursor-pointer">
                  <span className="material-symbols-outlined text-[18px]">{isRTL ? 'arrow_back' : 'arrow_forward'}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ✅ REPLY MODAL */}
        {selectedMessage && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#082f27]/40 backdrop-blur-sm" onClick={handleCloseModal}>
            <div className="dashboard-card w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl rounded-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
              
              {/* Modal Header */}
              <div className={`flex justify-between items-center p-5 border-b border-[#1e4d3a]/10 bg-[#fbf9f4] flex-shrink-0 ${isRTL ? "flex-row-reverse" : ""}`}>
                <h3 className="serif-title text-[19px] font-semibold text-[#082f27]">
                  {(t("admin.contactUs.modal.title") || "Reply to {name}").replace("{name}", selectedMessage.name)}
                </h3>
                <button onClick={handleCloseModal} className="p-1.5 rounded-full hover:bg-[#1e4d3a]/10 transition-colors cursor-pointer">
                  <span className="material-symbols-outlined text-[22px] text-[#1e4d3a]">close</span>
                </button>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                {/* Original Message Preview */}
                <div className={`bg-[#f6efdc]/50 p-4 rounded-lg mb-6 border-l-4 border-[#C9A84C] ${isRTL ? "border-l-0 border-r-4" : ""}`}>
                  <p className="mono-label text-[10px] font-bold text-[#C9A84C] uppercase mb-2">
                    {t("admin.contactUs.modal.originalMessage") || "Original Message"}
                  </p>
                  <p className="text-[14px] text-[#1e4d3a]/85 leading-relaxed whitespace-pre-wrap mb-3">
                    {selectedMessage.message}
                  </p>
                  <p className="mono-label text-[11px] text-[#1e4d3a]/60 flex flex-wrap gap-2">
                    <span className="font-semibold text-[#C9A84C]">{getTranslatedSubject(selectedMessage.subject)}</span>
                    <span>•</span>
                    <span>{selectedMessage.email}</span>
                    <span>•</span>
                    <span>{formatDate(selectedMessage.created_at)}</span>
                  </p>
                </div>

                {/* Reply Form */}
                <div className="mb-5">
                  <label className="block mono-label text-[11px] font-bold text-[#1e4d3a] mb-2 uppercase">
                    {t("admin.contactUs.modal.yourReply") || "Your Reply (Sent via Email)"} *
                  </label>
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder={t("admin.contactUs.modal.replyPlaceholder") || "Type your response to the user here..."}
                    rows={5}
                    className="w-full p-3 rounded-[8px] border border-[#1e4d3a]/15 bg-[#fbf9f4] text-[14px] text-[#1e4d3a] focus:outline-none focus:ring-2 focus:ring-[#1e4d3a]/20 resize-y"
                  />
                </div>

                {/* Internal Note */}
                <div className="mb-2">
                  <label className="block mono-label text-[11px] font-bold text-[#1e4d3a]/60 mb-2 uppercase">
                    {t("admin.contactUs.modal.internalNote") || "Internal Admin Note (Optional)"}
                  </label>
                  <textarea
                    value={adminNote}
                    onChange={(e) => setAdminNote(e.target.value)}
                    placeholder={t("admin.contactUs.modal.notePlaceholder") || "Add a private note for other admins..."}
                    rows={2}
                    className="w-full p-3 rounded-[8px] border border-[#1e4d3a]/15 bg-[#1e4d3a]/[0.02] text-[14px] text-[#1e4d3a] focus:outline-none focus:ring-2 focus:ring-[#1e4d3a]/20 resize-y"
                  />
                </div>
              </div>

              {/* Modal Actions */}
              <div className={`p-5 border-t border-[#1e4d3a]/10 bg-[#f6efdc]/30 flex justify-end gap-3 flex-shrink-0 ${isRTL ? "flex-row-reverse" : ""}`}>
                <button 
                  onClick={handleCloseModal} 
                  className="px-5 py-2.5 rounded-[6px] border border-[#1e4d3a]/20 text-[#1e4d3a] text-[12px] font-bold uppercase tracking-wide hover:bg-[#1e4d3a]/5 transition-colors cursor-pointer"
                >
                  {t("admin.contactUs.modal.cancel") || "Cancel"}
                </button>
                <button 
                  onClick={handleSendReply} 
                  disabled={isSending || !replyText.trim()}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-[6px] text-white text-[12px] font-bold uppercase tracking-wide transition-colors cursor-pointer ${
                    isSending || !replyText.trim() 
                      ? "bg-[#1e4d3a]/40 cursor-not-allowed" 
                      : "bg-[#1e4d3a] hover:bg-[#1e4d3a]/90"
                  }`}
                >
                  {isSending ? (
                    <>
                      <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
                      {t("admin.contactUs.modal.sending") || "Sending..."}
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[16px]">send</span>
                      {t("admin.contactUs.modal.send") || "Send Reply"}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}