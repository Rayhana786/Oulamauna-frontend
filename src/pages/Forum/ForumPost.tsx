import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useLang } from "../../context/LanguageContext";
import { useAuth } from "../../context/AuthContext";
import { forumApi, ForumPost as ApiForumPost, ForumComment as ApiForumComment } from "../../api/forumApi";

type Language = "EN" | "AR" | "FR";

const colors = {
  creamLight: "#fcfaf5",
  creamMid: "#f6efdc",
  creamDark: "#e5d5a8",
  forestGreen: "#0b4335",
  amber: "#b8860b",
  red: "#8b2c2c",
};

const colorPalette = [colors.forestGreen, colors.amber, colors.red, "#5a7a6f", "#d4b87a", "#8b5a2b"];
const getCategoryColor = (id: number) => colorPalette[(id - 1) % colorPalette.length];
const getUserColor = (id: number | undefined) => colorPalette[(id || 0) % colorPalette.length];

const getInitials = (name: string | null | undefined) => {
  if (!name) return "?";
  const parts = name.trim().split(" ");
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return parts[0][0].toUpperCase();
};

const UserAvatar: React.FC<{ user: any; size?: "sm" | "md" | "lg" }> = ({ user, size = "md" }) => {
  const displayName = user?.name || user?.username || "Anonymous";
  const initials = getInitials(displayName);
  const bgColor = getUserColor(user?.id);
  
  const sizeClasses = {
    sm: "w-8 h-8 text-[11px]",
    md: "w-10 h-10 md:w-12 md:h-12 text-[14px]",
    lg: "w-12 h-12 md:w-14 md:h-14 text-[16px]",
  };

  const avatarContent = user?.profile_picture ? (
    <img src={user.profile_picture} alt={displayName} className="w-full h-full rounded-full object-cover border-2" style={{ borderColor: colors.creamDark }} />
  ) : (
    <div className="w-full h-full rounded-full border-2 flex items-center justify-center font-bold text-white font-['Hanken_Grotesk']" style={{ backgroundColor: bgColor, borderColor: colors.creamDark }}>
      {initials}
    </div>
  );

  return (
    <Link to={`/profile/${user?.id || '#'}`} className="flex-shrink-0 hover:opacity-80 transition-opacity cursor-pointer" title={`View ${displayName}'s profile`}>
      <div className={sizeClasses[size]}>{avatarContent}</div>
    </Link>
  );
};

interface ForumPostContent {
  backToForum: string; postedBy: string; onDate: string; views: string; comments: string;
  commentPlaceholder: string; postComment: string; noComments: string; replyingTo: string;
  cancelReply: string; reply: string; loading: string;
  report: string; reportPost: string; reportComment: string; confirmReport: string; reportReason: string; cancel: string; submit: string;
  fullscreen: string; exitFullscreen: string; loadMoreComments: string; viewReplies: string; hideReplies: string; sortNewest: string; sortOldest: string;
  deletePost: string; deleteComment: string; confirmDeletePost: string; confirmDeleteComment: string; deletedComment: string;
}

const content: Record<Language, ForumPostContent> = {
  EN: {
    backToForum: "Back to Discussions", postedBy: "Posted by", onDate: "on", views: "Views", comments: "Comments",
    commentPlaceholder: "Share your thoughts...", postComment: "Post Comment", noComments: "No comments yet. Be the first to share your thoughts!",
    replyingTo: "Replying to", cancelReply: "Cancel", reply: "Reply", loading: "Loading post...",
    report: "Report", reportPost: "Report Post", reportComment: "Report Comment", confirmReport: "Are you sure you want to report this?",
    reportReason: "Reason for reporting (optional)", cancel: "Cancel", submit: "Submit",
    fullscreen: "Fullscreen", exitFullscreen: "Exit Fullscreen", loadMoreComments: "Load more comments", viewReplies: "View replies", hideReplies: "Hide replies", sortNewest: "Newest", sortOldest: "Oldest",
    deletePost: "Delete Post", deleteComment: "Delete", confirmDeletePost: "Are you sure you want to delete this post? This cannot be undone.", confirmDeleteComment: "Are you sure you want to delete this comment?", deletedComment: "[This comment was deleted]",
  },
  AR: {
    backToForum: "العودة إلى النقاشات", postedBy: "نشر بواسطة", onDate: "في", views: "مشاهدات", comments: "تعليقات",
    commentPlaceholder: "شارك أفكارك...", postComment: "نشر التعليق", noComments: "لا توجد تعليقات بعد. كن أول من يشارك أفكاره!",
    replyingTo: "الرد على", cancelReply: "إلغاء", reply: "رد", loading: "جاري تحميل المنشور...",
    report: "إبلاغ", reportPost: "الإبلاغ عن المنشور", reportComment: "الإبلاغ عن التعليق", confirmReport: "هل أنت متأكد من رغبتك في الإبلاغ عن هذا؟",
    reportReason: "سبب الإبلاغ (اختياري)", cancel: "إلغاء", submit: "إرسال",
    fullscreen: "ملء الشاشة", exitFullscreen: "خروج من ملء الشاشة", loadMoreComments: "عرض المزيد من التعليقات", viewReplies: "عرض الردود", hideReplies: "إخفاء الردود", sortNewest: "الأحدث أولاً", sortOldest: "الأقدم أولاً",
    deletePost: "حذف المنشور", deleteComment: "حذف", confirmDeletePost: "هل أنت متأكد من رغبتك في حذف هذا المنشور؟ لا يمكن التراجع عن هذا.", confirmDeleteComment: "هل أنت متأكد من رغبتك في حذف هذا التعليق؟", deletedComment: "[تم حذف هذا التعليق]",
  },
  FR: {
    backToForum: "Retour aux Discussions", postedBy: "Publié par", onDate: "le", views: "Vues", comments: "Commentaires",
    commentPlaceholder: "Partagez vos pensées...", postComment: "Publier le Commentaire", noComments: "Aucun commentaire pour le moment. Soyez le premier à partager vos pensées!",
    replyingTo: "Répondre à", cancelReply: "Annuler", reply: "Répondre", loading: "Chargement du post...",
    report: "Signaler", reportPost: "Signaler le Post", reportComment: "Signaler le Commentaire", confirmReport: "Êtes-vous sûr de vouloir signaler ceci?",
    reportReason: "Raison du signalement (optionnel)", cancel: "Annuler", submit: "Soumettre",
    fullscreen: "Plein écran", exitFullscreen: "Quitter le plein écran", loadMoreComments: "Voir plus de commentaires", viewReplies: "Voir les réponses", hideReplies: "Masquer les réponses", sortNewest: "Plus récent", sortOldest: "Plus ancien",
    deletePost: "Supprimer le Post", deleteComment: "Supprimer", confirmDeletePost: "Es-tu sûr(e) de vouloir supprimer ce post ? Cette action est irréversible.", confirmDeleteComment: "Es-tu sûr(e) de vouloir supprimer ce commentaire ?", deletedComment: "[Ce commentaire a été supprimé]",
  },
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

const Icon: React.FC<{ name: string; size?: number; filled?: boolean }> = ({ name, size = 18, filled = false }) => (
  <span className="material-symbols-outlined" style={{ fontSize: size, lineHeight: 1, fontVariationSettings: `'FILL' ${filled ? 1 : 0}, 'wght' 400, 'GRAD' 0, 'opsz' 24` }}>{name}</span>
);

const ForumPost: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { lang } = useLang();
  const { user } = useAuth();
  const t = content[lang as Language] || content.EN;
  const isRTL = lang === "AR";
  const currentLangCode = lang.toLowerCase(); 

  const [postData, setPostData] = useState<{ post: ApiForumPost; comments: ApiForumComment[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState("");
  const [replyingTo, setReplyingTo] = useState<{ id: number; name: string } | null>(null);
  const commentsEndRef = useRef<HTMLDivElement>(null);

  // ✅ How many top-level comment threads are shown; grows with "Load more"
  const [visibleCount, setVisibleCount] = useState(5);
  // ✅ Which comment threads have their replies fully expanded (by top-level comment_id)
  const [expandedReplies, setExpandedReplies] = useState<Set<number>>(new Set());
  // ✅ Sort order for top-level comments — "newest" is the default
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const sortDropdownRef = useRef<HTMLDivElement>(null);
  const [postMenuOpen, setPostMenuOpen] = useState(false);
  const postMenuRef = useRef<HTMLDivElement>(null);
  const toggleReplies = (commentId: number) => {
    setExpandedReplies((prev) => {
      const next = new Set(prev);
      if (next.has(commentId)) next.delete(commentId);
      else next.add(commentId);
      return next;
    });
  };

  // ✅ FULLSCREEN STATE
  const [isFullscreen, setIsFullscreen] = useState(false);

  // ✅ REPORT MODALS (One for Post, One for Comments)
  const [postReportModal, setPostReportModal] = useState<{ isOpen: boolean; reason: string }>({ isOpen: false, reason: "" });
  const [commentReportModal, setCommentReportModal] = useState<{ isOpen: boolean; commentId: number | null; reason: string }>({ isOpen: false, commentId: null, reason: "" });

  useEffect(() => {
    const fetchPost = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const response = await forumApi.posts.getById(Number(id));
        if (response.data.success && response.data.data) {
          setPostData(response.data.data);
        } else {
          navigate("/forum");
        }
      } catch (error) {
        console.error("Failed to fetch post:", error);
        navigate("/forum");
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
  }, [id, navigate]);

  // ✅ Close the sort dropdown when clicking outside of it
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(e.target as Node)) {
        setSortDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handlePostComment = async () => {
    if (!commentText.trim() || !postData) return;
    try {
      const response = await forumApi.comments.create(postData.post.post_id, {
        content: commentText.trim(),
        parent_comment_id: replyingTo?.id,
      });
      if (response.data.success && response.data.data) {
        const newComment = response.data.data;
        setPostData((prev) => prev ? { ...prev, comments: [...prev.comments, newComment] } : null);
        // ✅ If it's a new top-level comment, make sure it's within the visible slice
        if (!newComment.parent_comment_id) {
          setVisibleCount((c) => c + 1);
        } else {
          // ✅ New reply — find its top-level ancestor and expand that thread
          let ancestorId = newComment.parent_comment_id;
          let parent = postData.comments.find((c) => c.comment_id === ancestorId);
          while (parent?.parent_comment_id) {
            ancestorId = parent.parent_comment_id;
            parent = postData.comments.find((c) => c.comment_id === ancestorId);
          }
          setExpandedReplies((prev) => new Set(prev).add(ancestorId));
        }
        setCommentText("");
        setReplyingTo(null);
        
        // ✅ Scroll to the newly created comment/reply instead of the bottom of the page
        setTimeout(() => {
          const newCommentElement = document.getElementById(`comment-${newComment.comment_id}`);
          if (newCommentElement) {
            newCommentElement.scrollIntoView({ behavior: "smooth", block: "center" });
            // Add a temporary highlight effect so you can see where it appeared
            newCommentElement.style.transition = "background-color 1s ease";
            const originalBg = newCommentElement.style.backgroundColor;
            newCommentElement.style.backgroundColor = colors.creamMid;
            setTimeout(() => {
              newCommentElement.style.backgroundColor = originalBg;
            }, 2000);
          }
        }, 150);
      }
    } catch (error) {
      console.error("Failed to post comment:", error);
      alert("Failed to post comment. Please try again.");
    }
  };

  const handleReply = (commentId: number, authorName: string) => {
    setReplyingTo({ id: commentId, name: authorName });
    setTimeout(() => {
      const textarea = document.getElementById("comment-input");
      textarea?.focus();
    }, 50);
  };

  const cancelReply = () => {
    setReplyingTo(null);
    setCommentText("");
  };

  const handleLikePost = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const res = await forumApi.posts.toggleLike(postData!.post.post_id);
      if (res.data.success) {
        const { like_count, liked } = res.data; 
        setPostData(prev => prev ? { ...prev, post: { ...prev.post, like_count, liked } } : null);
      }
    } catch (err) {
      console.error("Failed to toggle post like", err);
    }
  };

  const handleLikeComment = async (e: React.MouseEvent, commentId: number) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const res = await forumApi.comments.toggleLike(commentId);
      if (res.data.success) {
        const { like_count, liked } = res.data;
        setPostData(prev => {
          if (!prev) return null;
          return {
            ...prev,
            comments: prev.comments.map(c => c.comment_id === commentId ? { ...c, like_count, liked } : c)
          };
        });
      }
    } catch (err) {
      console.error("Failed to toggle comment like", err);
    }
  };

  const openPostReport = () => setPostReportModal({ isOpen: true, reason: "" });
  const closePostReport = () => setPostReportModal({ isOpen: false, reason: "" });
  const handlePostReportSubmit = async () => {
    if (!postData) return;
    try {
      await forumApi.posts.report(postData.post.post_id, postReportModal.reason || "");
      alert("Report submitted successfully.");
      closePostReport();
    } catch (err) {
      console.error("Failed to submit report", err);
      alert("Failed to submit report.");
    }
  };

  const openCommentReport = (commentId: number) => setCommentReportModal({ isOpen: true, commentId, reason: "" });
  const closeCommentReport = () => setCommentReportModal({ isOpen: false, commentId: null, reason: "" });
  const handleCommentReportSubmit = async () => {
    if (!commentReportModal.commentId) return;
    try {
      await forumApi.comments.report(commentReportModal.commentId, commentReportModal.reason || "");
      alert("Report submitted successfully.");
      closeCommentReport();
    } catch (err) {
      console.error("Failed to submit report", err);
      alert("Failed to submit report.");
    }
  };

  // ✅ DELETE — post & comments (owner or admin only, mirrors backend authorization)
  const isAdmin = user?.role_name === "admin";

  const handleDeletePost = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!postData) return;
    if (!window.confirm(t.confirmDeletePost)) return;
    try {
      const res = await forumApi.posts.delete(postData.post.post_id);
      if (res.data.success) {
        navigate("/forum");
      }
    } catch (err) {
      console.error("Failed to delete post", err);
      alert("Failed to delete post.");
    }
  };

    const handleDeleteComment = async (e: React.MouseEvent, commentId: number) => {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm(t.confirmDeleteComment)) return;
    
    try {
      const res = await forumApi.comments.delete(commentId);
      if (res.data.success) {
        setPostData((prev) => {
          if (!prev) return null;

          // ✅ Helper: Recursively find ALL nested reply IDs
          const getDescendantIds = (parentId: number, allComments: ApiForumComment[]): number[] => {
            const children = allComments.filter((c) => c.parent_comment_id === parentId);
            let ids = children.map((c) => c.comment_id);
            for (const child of children) {
              ids = [...ids, ...getDescendantIds(child.comment_id, allComments)];
            }
            return ids;
          };

          // ✅ Get the main comment ID + ALL nested reply IDs
          const idsToDelete = [commentId, ...getDescendantIds(commentId, prev.comments)];

          // ✅ Filter out the ENTIRE deleted thread. 
          // NO re-parenting! They are completely removed from the UI.
          return {
            ...prev,
            comments: prev.comments.filter((c) => !idsToDelete.includes(c.comment_id)),
          };
        });
      }
    } catch (err) {
      console.error("Failed to delete comment", err);
      alert("Failed to delete comment.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: colors.creamLight, color: colors.forestGreen }}>
        <div className="font-['Inter'] flex items-center gap-2"><Icon name="hourglass_empty" size={24} /> {t.loading}</div>
      </div>
    );
  }

  if (!postData) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: colors.creamLight, color: colors.forestGreen }}>
        <div className="font-['Inter']">Post not found.</div>
      </div>
    );
  }

  const { post, comments } = postData;
  const categoryName = post.forum_categories?.translations?.[currentLangCode] || post.forum_categories?.name || "Uncategorized";
  const authorName = post.users?.name || post.users?.username || "Unknown User";
  const isPostLiked = post.liked === true;

  const topLevelComments = comments
    .filter((c) => c.parent_comment_id === null)
    .sort((a, b) => {
      const diff = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      return sortOrder === "newest" ? -diff : diff;
    });

  // ✅ FIX: recursive so replies-to-replies (any depth) are included, not just direct children
  const getReplies = (parentId: number): ApiForumComment[] => {
    const direct = comments.filter((c) => c.parent_comment_id === parentId);
    const all = direct.flatMap((c) => [c, ...getReplies(c.comment_id)]);
    return all.sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
  };

  return (
    // ✅ OUTER WRAPPER: Removes padding when fullscreen for true edge-to-edge experience
    <div 
      className={`fixed inset-0 z-50 flex items-start md:items-center justify-center overflow-y-auto transition-all duration-300 ${isFullscreen ? "p-0" : "p-0 md:p-6"}`} 
      style={{ backgroundColor: "rgba(11, 67, 53, 0.6)", backdropFilter: "blur(4px)" }} 
      dir={isRTL ? "rtl" : "ltr"} 
      onClick={() => navigate("/forum")}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap');
        .material-symbols-outlined { font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24; font-family: 'Material Symbols Outlined'; display: inline-block; vertical-align: middle; }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; } .custom-scrollbar::-webkit-scrollbar-track { background: transparent; } .custom-scrollbar::-webkit-scrollbar-thumb { background-color: rgba(11, 67, 53, 0.2); border-radius: 20px; }
      `}</style>

      {/* ✅ INNER CONTAINER: Dynamically switches between modal and fullscreen */}
      <div 
        className={`flex flex-col transition-all duration-300 ease-in-out ${
          isFullscreen 
            ? "w-full h-full md:h-screen md:max-w-none md:rounded-none border-none md:max-h-none" 
            : "w-full md:max-w-4xl md:rounded-xl border md:max-h-[90vh]"
        }`} 
        style={{ 
          backgroundColor: colors.creamLight, 
          borderColor: colors.creamDark, 
          boxShadow: isFullscreen ? "none" : "0 20px 60px rgba(0,0,0,0.18)" 
        }} 
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* ✅ MODAL HEADER */}
        <div className="flex items-center justify-between px-5 md:px-8 py-4 md:py-5 border-b flex-shrink-0 sticky top-0 z-10" style={{ backgroundColor: colors.creamLight, borderColor: colors.creamDark }}>
          <div className="flex items-center gap-3 min-w-0">
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: colors.forestGreen }} />
            <h2 className="font-['Hanken_Grotesk'] text-lg md:text-xl font-bold truncate" style={{ color: colors.forestGreen }}>{post.title}</h2>
          </div>
          <div className="flex items-center gap-2">
            
                        {/* ✅ FULLSCREEN TOGGLE BUTTON (Hidden on mobile) */}
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="hidden md:flex w-9 h-9 items-center justify-center rounded-lg transition-colors flex-shrink-0 cursor-pointer"
              style={{ color: colors.forestGreen }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(11, 67, 53, 0.1)")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
              title={isFullscreen ? t.exitFullscreen : t.fullscreen}
            >
              <Icon name={isFullscreen ? "close_fullscreen" : "open_in_full"} size={22} />
            </button>

            {/* ✅ POST MENU (3 dots) — owner or admin only, holds Delete */}
            {user && (user.id === post.user_id || isAdmin) && (
              <div ref={postMenuRef} className="relative flex-shrink-0">
                <button
                  onClick={() => setPostMenuOpen((o) => !o)}
                  className="w-9 h-9 flex items-center justify-center rounded-lg transition-colors cursor-pointer"
                  style={{ color: colors.forestGreen }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(11, 67, 53, 0.1)")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                  aria-label="More options"
                >
                  <Icon name="more_vert" size={22} />
                </button>

                {postMenuOpen && (
                  <div
                    className={`absolute z-20 mt-2 min-w-[160px] rounded-xl border overflow-hidden ${isRTL ? "left-0" : "right-0"}`}
                    style={{ backgroundColor: colors.creamLight, borderColor: colors.creamDark, boxShadow: "0 10px 30px rgba(0,0,0,0.12)" }}
                  >
                    <button
                      onClick={(e) => { setPostMenuOpen(false); handleDeletePost(e); }}
                      className={`w-full flex items-center gap-2 font-['Inter'] text-[13px] font-semibold px-4 py-2.5 transition-colors cursor-pointer ${isRTL ? "flex-row-reverse text-right" : "text-left"}`}
                      style={{ color: colors.red }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(139, 44, 44, 0.08)")}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                    >
                      <Icon name="delete" size={17} />
                      {t.deletePost}
                    </button>
                  </div>
                )}
              </div>
            )}

           {/* ✅ REPORT BUTTON — Hide if user is the post author */}
{user && user.id !== post.user_id && (
  <button
    onClick={openPostReport}
    className="w-9 h-9 flex items-center justify-center rounded-lg transition-colors flex-shrink-0 cursor-pointer"
    style={{ color: colors.red }}
    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(139, 44, 44, 0.1)")}
    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
    title={t.report}
  >
    <Icon name="flag" size={22} />
  </button>
)}

            {/* ✅ CLOSE BUTTON */}
            <button onClick={() => navigate("/forum")} className="w-9 h-9 flex items-center justify-center rounded-lg transition-colors flex-shrink-0 cursor-pointer" style={{ color: colors.forestGreen }} onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(11, 67, 53, 0.1)")} onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")} aria-label="Close">
              <Icon name="close" size={22} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-5 md:p-8 space-y-8">
          <div className="pb-6 border-b" style={{ borderColor: colors.creamDark }}>
            <div className="flex items-start gap-4 mb-5">
              <UserAvatar user={post.users} size="lg" />
              <div className="flex-1">
                <Link to={`/profile/${post.users?.id || '#'}`} className="font-['Hanken_Grotesk'] text-[15px] md:text-[16px] font-bold hover:underline mb-1 block" style={{ color: colors.forestGreen }}>
                  {authorName}
                </Link>
                <div className="font-['Inter'] text-[12px] opacity-60" style={{ color: colors.forestGreen }}>
                  {t.postedBy} {t.onDate} {formatDate(post.created_at)}
                </div>
              </div>
            </div>

            <div className="font-['Inter'] text-[15px] md:text-[16px] leading-relaxed whitespace-pre-line mb-6 opacity-80" style={{ color: colors.forestGreen }}>
              {post.content}
            </div>

            {/* ✅ BOTTOM ROW */}
            <div className={`flex items-center justify-between pt-3 border-t ${isRTL ? "flex-row-reverse" : ""}`} style={{ borderColor: colors.creamDark }}>
              <div className={`flex items-center gap-1.5 ${isRTL ? "flex-row-reverse" : ""}`}>
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: post.forum_categories ? getCategoryColor(post.forum_categories.category_id) : colors.creamDark }} />
                <span className="font-['Inter'] text-[10px] font-medium opacity-70">{categoryName}</span>
              </div>
              
              <div className={`flex items-center gap-4 md:gap-6 ${isRTL ? "flex-row-reverse" : ""}`}>
                <button
                  onClick={handleLikePost}
                  className={`flex items-center gap-1.5 font-['Inter'] text-[11px] md:text-[12px] transition-all duration-300 cursor-pointer group/btn ${isRTL ? "flex-row-reverse" : ""} ${isPostLiked ? "opacity-100" : "opacity-60 hover:opacity-100"}`}
                  style={{ color: isPostLiked ? colors.red : colors.forestGreen }}
                  title={isPostLiked ? "Unlike" : "Like"}
                >
                  <Icon name="thumb_up" size={16} filled={isPostLiked} />
                  <span className={`${isPostLiked ? "font-bold" : ""} transition-all`}>{post.like_count || 0}</span>
                </button>

                <div className={`flex items-center gap-1.5 font-['Inter'] text-[11px] md:text-[12px] opacity-60 hover:opacity-100 transition-all duration-300 cursor-pointer group/btn ${isRTL ? "flex-row-reverse" : ""}`} style={{ color: colors.forestGreen }}>
                  <Icon name="chat_bubble_outline" size={16} className="group-hover/btn:text-[#b8860b] transition-colors" />
                  <span className="group-hover/btn:text-[#b8860b] transition-colors">{comments.length}</span>
                </div>
              </div>
            </div>
          </div>

          {/* ✅ COMMENTS SECTION */}
          <div>
            <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
              <h3 className="font-['Hanken_Grotesk'] text-xl font-bold" style={{ color: colors.forestGreen }}>{t.comments} ({comments.length})</h3>

              {comments.length > 0 && (
                <div ref={sortDropdownRef} className="relative flex-shrink-0">
                  <button
                    onClick={() => setSortDropdownOpen((o) => !o)}
                    className={`flex items-center gap-1.5 rounded-full border px-4 py-2 font-['Inter'] text-[13px] font-semibold transition-colors cursor-pointer ${isRTL ? "flex-row-reverse" : ""}`}
                    style={{ borderColor: colors.creamDark, color: colors.forestGreen, backgroundColor: colors.creamLight }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = colors.creamMid)}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = colors.creamLight)}
                  >
                    <Icon name="expand_more" size={18} />
                    {sortOrder === "newest" ? t.sortNewest : t.sortOldest}
                  </button>

                  {sortDropdownOpen && (
                    <div
                      className={`absolute z-20 mt-2 min-w-[150px] rounded-xl border overflow-hidden ${isRTL ? "right-0" : "left-0"}`}
                      style={{ backgroundColor: colors.creamLight, borderColor: colors.creamDark, boxShadow: "0 10px 30px rgba(0,0,0,0.12)" }}
                    >
                      {(["newest", "oldest"] as const).map((option) => (
                        <button
                          key={option}
                          onClick={() => { setSortOrder(option); setSortDropdownOpen(false); }}
                          className="w-full text-left font-['Inter'] text-[13px] font-medium px-4 py-2.5 transition-colors cursor-pointer"
                          style={{
                            color: sortOrder === option ? colors.amber : colors.forestGreen,
                            backgroundColor: "transparent",
                            textAlign: isRTL ? "right" : "left",
                            fontWeight: sortOrder === option ? 700 : 500,
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = colors.creamMid)}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                        >
                          {option === "newest" ? t.sortNewest : t.sortOldest}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
            {comments.length === 0 ? (
              <div className="text-center py-12">
                <Icon name="chat_bubble_outline" size={48} />
                <p className="font-['Inter'] text-[14px] mt-3 opacity-70" style={{ color: colors.forestGreen }}>{t.noComments}</p>
              </div>
            ) : (
              <div className="space-y-6">
                {topLevelComments.slice(0, visibleCount).map((comment) => {
                  const replies = getReplies(comment.comment_id);
                  const isLiked = comment.liked === true;
                  const repliesExpanded = expandedReplies.has(comment.comment_id);
                  const visibleReplies = repliesExpanded ? replies : replies.slice(0, 2);
                  const hiddenRepliesCount = replies.length - visibleReplies.length;

                  return (
                    <div key={comment.comment_id} id={`comment-${comment.comment_id}`}>
                      <div className="flex gap-4 p-4 rounded-xl border transition-colors" style={{ backgroundColor: colors.creamLight, borderColor: colors.creamDark }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = colors.creamMid)}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = colors.creamLight)}>
                        
                        <UserAvatar user={comment.users} size="md" />
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <Link to={`/profile/${comment.users?.id || '#'}`} className="font-['Hanken_Grotesk'] text-[14px] md:text-[15px] font-bold hover:underline" style={{ color: colors.forestGreen }}>
                              {comment.users?.name || comment.users?.username || "Unknown User"}
                            </Link>
                            <span className="opacity-30" style={{ color: colors.forestGreen }}>•</span>
                            <span className="font-['Inter'] text-[12px] opacity-60" style={{ color: colors.forestGreen }}>{formatDate(comment.created_at)}</span>
                          </div>
                          <p className="font-['Inter'] text-[14px] md:text-[15px] leading-relaxed mb-3 opacity-80" style={{ color: colors.forestGreen }}>{comment.content}</p>
                          
                          <div className="flex items-center gap-4">
                            <button onClick={(e) => handleLikeComment(e, comment.comment_id)}
                              className={`flex items-center gap-1.5 transition-all duration-300 cursor-pointer ${isLiked ? "opacity-100" : "opacity-60 hover:opacity-100"}`}
                              style={{ color: isLiked ? colors.red : colors.forestGreen }} title={isLiked ? "Unlike" : "Like"}>
                              <Icon name="thumb_up" size={17} filled={isLiked} />
                              <span className={`${isLiked ? "font-bold" : ""} transition-all`}>{comment.like_count || 0}</span>
                            </button>
                            
                            <button onClick={() => handleReply(comment.comment_id, comment.users?.name || comment.users?.username || "Unknown User")}
                              className="flex items-center gap-1.5 opacity-60 cursor-pointer" style={{ color: colors.forestGreen }}>
                              <Icon name="reply" size={17} />
                              <span className="font-['Inter'] text-[12px]">{t.reply}</span>
                            </button>

                            {user && user.id !== comment.user_id && (
  <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); openCommentReport(comment.comment_id); }}
    className="flex items-center gap-1.5 transition-all duration-300 cursor-pointer opacity-30 hover:opacity-100" style={{ color: colors.red }} title={t.report}>
    <Icon name="flag" size={16} />
    <span className="hidden md:inline font-['Inter'] text-[12px]">{t.report}</span>
  </button>
)}

                            {user && (user.id === comment.user_id || isAdmin) && (
                              <button onClick={(e) => handleDeleteComment(e, comment.comment_id)}
                                className="flex items-center gap-1.5 transition-all duration-300 cursor-pointer opacity-30 hover:opacity-100" style={{ color: colors.red }} title={t.deleteComment}>
                                <Icon name="delete" size={16} />
                                <span className="hidden md:inline font-['Inter'] text-[12px]">{t.deleteComment}</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      {replies.length > 0 && (
                        <div className={`mt-3 ${isRTL ? "mr-6 md:mr-10" : "ml-6 md:ml-10"} space-y-3`}>
                          {visibleReplies.map((reply) => {
                            const isReplyLiked = reply.liked === true;
                            return (
                              <div key={reply.comment_id} id={`comment-${reply.comment_id}`} className="flex gap-3 p-3 rounded-lg border" style={{ backgroundColor: colors.creamLight, borderColor: colors.creamDark }}>
                                <UserAvatar user={reply.users} size="sm" />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                    <Link to={`/profile/${reply.users?.id || '#'}`} className="font-['Hanken_Grotesk'] text-[13px] md:text-[14px] font-bold hover:underline" style={{ color: colors.forestGreen }}>
                                      {reply.users?.name || reply.users?.username || "Unknown User"}
                                    </Link>
                                    <span className="opacity-30" style={{ color: colors.forestGreen }}>•</span>
                                    <span className="font-['Inter'] text-[11px] md:text-[12px] opacity-60" style={{ color: colors.forestGreen }}>{formatDate(reply.created_at)}</span>
                                  </div>
                                  <p className="font-['Inter'] text-[13px] md:text-[14px] leading-relaxed mb-2 opacity-80" style={{ color: colors.forestGreen }}>{reply.content}</p>
                                  <div className="flex items-center gap-4">
                                    <button onClick={(e) => handleLikeComment(e, reply.comment_id)}
                                      className={`flex items-center gap-1.5 transition-all duration-300 cursor-pointer ${isReplyLiked ? "opacity-100" : "opacity-60 hover:opacity-100"}`}
                                      style={{ color: isReplyLiked ? colors.red : colors.forestGreen }}>
                                      <Icon name="thumb_up" size={15} filled={isReplyLiked} />
                                      <span className={`${isReplyLiked ? "font-bold" : ""} transition-all`}>{reply.like_count || 0}</span>
                                    </button>

                                    <button onClick={() => handleReply(reply.comment_id, reply.users?.name || reply.users?.username || "Unknown User")}
                                      className="flex items-center gap-1.5 opacity-60 cursor-pointer" style={{ color: colors.forestGreen }}>
                                      <Icon name="reply" size={15} />
                                      <span className="hidden md:inline font-['Inter'] text-[12px]">{t.reply}</span>
                                    </button>

                                    {user && user.id !== reply.user_id && (
  <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); openCommentReport(reply.comment_id); }}
    className="flex items-center gap-1.5 transition-all duration-300 cursor-pointer opacity-30 hover:opacity-100" style={{ color: colors.red }}>
    <Icon name="flag" size={15} />
  </button>
)}

                                    {user && (user.id === reply.user_id || isAdmin) && (
                                      <button onClick={(e) => handleDeleteComment(e, reply.comment_id)}
                                        className="flex items-center gap-1.5 transition-all duration-300 cursor-pointer opacity-30 hover:opacity-100" style={{ color: colors.red }} title={t.deleteComment}>
                                        <Icon name="delete" size={15} />
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}

                          {replies.length > 2 && (
                            <button
                              onClick={() => toggleReplies(comment.comment_id)}
                              className="flex items-center gap-1.5 font-['Inter'] text-[12px] font-semibold opacity-70 hover:opacity-100 transition-opacity cursor-pointer"
                              style={{ color: colors.forestGreen }}
                            >
                              <Icon name={repliesExpanded ? "expand_less" : "expand_more"} size={16} />
                              {repliesExpanded ? t.hideReplies : `${t.viewReplies} (${hiddenRepliesCount})`}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}

                {visibleCount < topLevelComments.length && (
                  <div className="flex justify-center pt-2">
                    <button
                      onClick={() => setVisibleCount((c) => c + 5)}
                      className="font-['Inter'] text-[13px] font-semibold px-5 py-2.5 rounded-lg border transition-colors cursor-pointer"
                      style={{ color: colors.forestGreen, borderColor: colors.creamDark }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = colors.creamMid)}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                    >
                      {t.loadMoreComments}
                    </button>
                  </div>
                )}

                <div ref={commentsEndRef} />
              </div>
            )}
          </div>
        </div>

        {/* ✅ STICKY COMMENT INPUT */}
        <div className="flex-shrink-0 border-t p-4 md:p-6 md:rounded-b-xl" style={{ borderColor: colors.creamDark, backgroundColor: colors.creamLight }}>
          {replyingTo && (
            <div className={`flex items-center justify-between mb-3 px-3 py-2 rounded-lg ${isRTL ? "flex-row-reverse" : ""}`} style={{ backgroundColor: colors.creamMid }}>
              <div className={`flex items-center gap-2 ${isRTL ? "flex-row-reverse" : ""}`}>
                <Icon name="reply" size={16} />
                <span className="font-['Inter'] text-[12px]" style={{ color: colors.forestGreen }}>
                  {t.replyingTo} <span className="font-semibold" style={{ color: colors.forestGreen }}>{replyingTo.name}</span>
                </span>
              </div>
              <button onClick={cancelReply} className="transition-opacity hover:opacity-70 cursor-pointer" style={{ color: colors.forestGreen }}><Icon name="close" size={18} /></button>
            </div>
          )}

          <div className="flex gap-2.5 items-start">
            <UserAvatar user={{ name: "You" }} size="md" />
            <div className="flex-1 flex items-center gap-3">
              <textarea id="comment-input" value={commentText} onChange={(e) => setCommentText(e.target.value)} placeholder={t.commentPlaceholder} rows={1}
                className="w-full px-4 py-3 rounded-lg border bg-[#fcfaf5] font-['Inter'] text-[14px] outline-none transition-all resize-none cursor-text"
                style={{ borderColor: colors.creamDark }}
                onFocus={(e) => { e.currentTarget.style.borderColor = colors.amber; e.currentTarget.style.boxShadow = `0 0 0 1px ${colors.amber}`; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = colors.creamDark; e.currentTarget.style.boxShadow = "none"; }}
                dir={isRTL ? "rtl" : "ltr"}
                onKeyDown={(e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { handlePostComment(); } }}
              />
              <button onClick={handlePostComment} disabled={!commentText.trim()}
                className="flex-shrink-0 inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-[13px] font-bold tracking-[0.05em] font-['Hanken_Grotesk'] transition-all duration-200 border disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                style={{ backgroundColor: colors.forestGreen, color: colors.creamLight, borderColor: colors.forestGreen }}
                onMouseEnter={(e) => { if (commentText.trim()) { e.currentTarget.style.backgroundColor = colors.creamLight; e.currentTarget.style.color = colors.forestGreen; } }}
                onMouseLeave={(e) => { if (commentText.trim()) { e.currentTarget.style.backgroundColor = colors.forestGreen; e.currentTarget.style.color = colors.creamLight; } }}
              >
                <Icon name="send" size={16} filled />
                <span className="hidden sm:inline">{t.postComment}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ✅ POST REPORT MODAL */}
      {postReportModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(11, 67, 53, 0.6)", backdropFilter: "blur(4px)" }} onClick={closePostReport}>
          <div className="w-full max-w-md rounded-xl border p-6" style={{ backgroundColor: colors.creamLight, borderColor: colors.creamDark, boxShadow: "0 20px 60px rgba(0,0,0,0.18)" }} onClick={(e) => e.stopPropagation()} dir={isRTL ? "rtl" : "ltr"}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: colors.red + "20" }}>
                <Icon name="flag" size={24} />
              </div>
              <h3 className="font-['Hanken_Grotesk'] text-xl font-bold" style={{ color: colors.forestGreen }}>{t.reportPost}</h3>
            </div>
            <p className="font-['Inter'] text-[14px] mb-4 opacity-80" style={{ color: colors.forestGreen }}>{t.confirmReport}</p>
            <div className="mb-6">
              <label className="block font-['JetBrains_Mono'] text-[10px] uppercase tracking-[0.1em] font-bold mb-2 opacity-70">{t.reportReason}</label>
              <textarea value={postReportModal.reason} onChange={(e) => setPostReportModal({ ...postReportModal, reason: e.target.value })} placeholder={t.reportReason} rows={3}
                className="w-full px-4 py-3 rounded-lg border bg-[#fcfaf5] font-['Inter'] text-[14px] outline-none transition-all resize-none cursor-text"
                style={{ borderColor: colors.creamDark }}
                onFocus={(e) => { e.currentTarget.style.borderColor = colors.amber; e.currentTarget.style.boxShadow = `0 0 0 1px ${colors.amber}`; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = colors.creamDark; e.currentTarget.style.boxShadow = "none"; }}
              />
            </div>
            <div className={`flex items-center justify-end gap-3 ${isRTL ? "flex-row-reverse" : ""}`}>
              <button onClick={closePostReport} className="px-4 py-2.5 rounded-lg text-[13px] font-bold font-['Hanken_Grotesk'] transition-colors border cursor-pointer" style={{ color: colors.forestGreen, borderColor: colors.forestGreen }} onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = colors.creamMid)} onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}>
                {t.cancel}
              </button>
              <button onClick={handlePostReportSubmit} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-[13px] font-bold tracking-[0.05em] font-['Hanken_Grotesk'] transition-all duration-200 border cursor-pointer"
                style={{ backgroundColor: colors.red, color: colors.creamLight, borderColor: colors.red }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = colors.creamLight; e.currentTarget.style.color = colors.red; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = colors.red; e.currentTarget.style.color = colors.creamLight; }}
              >
                <Icon name="flag" size={16} filled /> {t.submit}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ✅ COMMENT REPORT MODAL */}
      {commentReportModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(11, 67, 53, 0.6)", backdropFilter: "blur(4px)" }} onClick={closeCommentReport}>
          <div className="w-full max-w-md rounded-xl border p-6" style={{ backgroundColor: colors.creamLight, borderColor: colors.creamDark, boxShadow: "0 20px 60px rgba(0,0,0,0.18)" }} onClick={(e) => e.stopPropagation()} dir={isRTL ? "rtl" : "ltr"}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: colors.red + "20" }}>
                <Icon name="flag" size={24} />
              </div>
              <h3 className="font-['Hanken_Grotesk'] text-xl font-bold" style={{ color: colors.forestGreen }}>{t.reportComment}</h3>
            </div>
            <p className="font-['Inter'] text-[14px] mb-4 opacity-80" style={{ color: colors.forestGreen }}>{t.confirmReport}</p>
            <div className="mb-6">
              <label className="block font-['JetBrains_Mono'] text-[10px] uppercase tracking-[0.1em] font-bold mb-2 opacity-70">{t.reportReason}</label>
              <textarea value={commentReportModal.reason} onChange={(e) => setCommentReportModal({ ...commentReportModal, reason: e.target.value })} placeholder={t.reportReason} rows={3}
                className="w-full px-4 py-3 rounded-lg border bg-[#fcfaf5] font-['Inter'] text-[14px] outline-none transition-all resize-none cursor-text"
                style={{ borderColor: colors.creamDark }}
                onFocus={(e) => { e.currentTarget.style.borderColor = colors.amber; e.currentTarget.style.boxShadow = `0 0 0 1px ${colors.amber}`; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = colors.creamDark; e.currentTarget.style.boxShadow = "none"; }}
              />
            </div>
            <div className={`flex items-center justify-end gap-3 ${isRTL ? "flex-row-reverse" : ""}`}>
              <button onClick={closeCommentReport} className="px-4 py-2.5 rounded-lg text-[13px] font-bold font-['Hanken_Grotesk'] transition-colors border cursor-pointer" style={{ color: colors.forestGreen, borderColor: colors.forestGreen }} onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = colors.creamMid)} onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}>
                {t.cancel}
              </button>
              <button onClick={handleCommentReportSubmit} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-[13px] font-bold tracking-[0.05em] font-['Hanken_Grotesk'] transition-all duration-200 border cursor-pointer"
                style={{ backgroundColor: colors.red, color: colors.creamLight, borderColor: colors.red }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = colors.creamLight; e.currentTarget.style.color = colors.red; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = colors.red; e.currentTarget.style.color = colors.creamLight; }}
              >
                <Icon name="flag" size={16} filled /> {t.submit}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ForumPost;