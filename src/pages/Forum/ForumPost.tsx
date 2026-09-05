// ForumPost.tsx
import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useLang } from "../../context/LanguageContext";

type Language = "EN" | "AR" | "FR";

/* ------------------------------------------------------------------ */
/*  DESIGN TOKENS — Oulamnauna Admin Palette                          */
/* ------------------------------------------------------------------ */
const colors = {
  creamLight: "#fcfaf5",
  creamMid: "#f6efdc",
  creamDark: "#e5d5a8",
  forestGreen: "#0b4335",
  amber: "#b8860b",
  red: "#8b2c2c",
};

/* ------------------------------------------------------------------ */
/*  TYPES & INTERFACES                                                */
/* ------------------------------------------------------------------ */
interface ForumCategory {
  category_id: number;
  name: string;
  color: string;
  post_count: number;
}

interface ForumPost {
  post_id: number;
  category_id: number;
  title: string;
  excerpt: string;
  author_name: string;
  latest_reply_from: string | null;
  latest_reply_at: string | null;
  views_count: number;
  comments_count: number;
  reactions_count: number;
  created_at: string;
  is_pinned?: boolean;
  participants?: string[];
}

interface Comment {
  comment_id: number;
  post_id: number;
  parent_comment_id: number | null;
  author_name: string;
  content: string;
  created_at: string;
  reactions_count: number;
}

/* ------------------------------------------------------------------ */
/*  MOCK DATA — Colors harmonized with Admin Palette                  */
/* ------------------------------------------------------------------ */
const forumCategories: ForumCategory[] = [
  { category_id: 1, name: "General Discussion", color: colors.forestGreen, post_count: 128 },
  { category_id: 2, name: "Scholar Research", color: colors.amber, post_count: 245 },
  { category_id: 3, name: "Manuscripts & Sources", color: colors.red, post_count: 97 },
  { category_id: 4, name: "Translation Help", color: "#5a7a6f", post_count: 63 },
  { category_id: 5, name: "Site Feedback", color: "#d4b87a", post_count: 41 },
  { category_id: 6, name: "Announcements", color: colors.forestGreen, post_count: 15 },
];

const forumPostsSeed: ForumPost[] = [
  {
    post_id: 1,
    category_id: 2,
    title: "Was Ibn Khaldun influenced by earlier Andalusian historians?",
    excerpt: "Reading the Muqaddimah again and I keep noticing parallels with earlier Andalusian chroniclers. Curious if there's documented influence or if this is coincidental.",
    author_name: "Yacine B.",
    latest_reply_from: "Karim D.",
    latest_reply_at: "1 hour ago",
    views_count: 342,
    comments_count: 8,
    reactions_count: 47,
    created_at: "2024-01-16T09:00:00Z",
    is_pinned: true,
    participants: ["Yacine B.", "Karim D.", "Sarah K.", "Imane Z."],
  },
  {
    post_id: 2,
    category_id: 3,
    title: "New manuscript scan added — Ibn Sina's Canon of Medicine, Book II",
    excerpt: "Just uploaded a high-resolution scan of Book II with page-level annotations. Feedback on the transcription is welcome.",
    author_name: "Oulamauna Team",
    latest_reply_from: "Sarah K.",
    latest_reply_at: "3 hours ago",
    views_count: 501,
    comments_count: 5,
    reactions_count: 63,
    created_at: "2024-01-15T12:00:00Z",
    participants: ["Oulamauna Team", "Sarah K.", "Mounir T."],
  },
  {
    post_id: 3,
    category_id: 4,
    title: "Looking for a reliable English translation of Ihya Ulum al-Din",
    excerpt: "Most translations I've found online are heavily abridged. Does anyone know of a complete, well-reviewed English edition?",
    author_name: "Sarah K.",
    latest_reply_from: "Imane Z.",
    latest_reply_at: "5 hours ago",
    views_count: 210,
    comments_count: 4,
    reactions_count: 22,
    created_at: "2024-01-14T08:20:00Z",
    participants: ["Sarah K.", "Imane Z.", "Karim D."],
  },
];

const mockComments: Record<number, Comment[]> = {
  1: [
    {
      comment_id: 1,
      post_id: 1,
      parent_comment_id: null,
      author_name: "Karim D.",
      content: "Great question! I've been thinking about this too. There are definitely some parallels, especially in how they approach historical methodology. The way Ibn Khaldun structures his analysis of civilizations reminds me of earlier works.",
      created_at: "2024-01-16T10:30:00Z",
      reactions_count: 12,
    },
    {
      comment_id: 2,
      post_id: 1,
      parent_comment_id: 1,
      author_name: "Sarah K.",
      content: "I agree! The cyclical theory of civilization is particularly interesting when you compare it to Ibn al-Khatib's observations.",
      created_at: "2024-01-16T10:45:00Z",
      reactions_count: 5,
    },
    {
      comment_id: 3,
      post_id: 1,
      parent_comment_id: 1,
      author_name: "Imane Z.",
      content: "Don't forget that Ibn Khaldun spent time in Andalusia himself, so he would have had direct access to these works.",
      created_at: "2024-01-16T11:00:00Z",
      reactions_count: 8,
    },
    {
      comment_id: 4,
      post_id: 1,
      parent_comment_id: null,
      author_name: "Sarah K.",
      content: "I'd recommend checking out Ibn al-Khatib's works. He was a key Andalusian historian and there's evidence Ibn Khaldun was familiar with his writings. The intellectual networks of the time were quite interconnected.",
      created_at: "2024-01-16T11:15:00Z",
      reactions_count: 18,
    },
    {
      comment_id: 5,
      post_id: 1,
      parent_comment_id: 4,
      author_name: "Yacine B.",
      content: "Thanks for the recommendation! I'll look into that. Do you have any specific titles in mind?",
      created_at: "2024-01-16T11:30:00Z",
      reactions_count: 3,
    },
    {
      comment_id: 6,
      post_id: 1,
      parent_comment_id: null,
      author_name: "Imane Z.",
      content: "The Muqaddimah does show awareness of earlier historiographical traditions. Whether it's direct influence or just the intellectual climate of the time is debatable. What's fascinating is how he synthesizes these ideas into something entirely new.",
      created_at: "2024-01-16T14:20:00Z",
      reactions_count: 9,
    },
    {
      comment_id: 7,
      post_id: 1,
      parent_comment_id: 6,
      author_name: "Karim D.",
      content: "That's a good point about synthesis. He wasn't just copying—he was creating a new framework for understanding history.",
      created_at: "2024-01-16T14:35:00Z",
      reactions_count: 6,
    },
    {
      comment_id: 8,
      post_id: 1,
      parent_comment_id: 6,
      author_name: "Sarah K.",
      content: "Exactly! His concept of 'asabiyyah (social cohesion) is original, even if the general idea of group dynamics existed before.",
      created_at: "2024-01-16T15:00:00Z",
      reactions_count: 11,
    },
  ],
  2: [
    {
      comment_id: 9,
      post_id: 2,
      parent_comment_id: null,
      author_name: "Sarah K.",
      content: "This is amazing! Thank you for uploading this. The annotations are particularly helpful for understanding the marginalia. The clarity of the scan makes it much easier to study the text.",
      created_at: "2024-01-15T13:00:00Z",
      reactions_count: 8,
    },
    {
      comment_id: 10,
      post_id: 2,
      parent_comment_id: 9,
      author_name: "Mounir T.",
      content: "Agreed! The resolution is perfect for studying the diagrams in the pharmacology section.",
      created_at: "2024-01-15T13:30:00Z",
      reactions_count: 4,
    },
    {
      comment_id: 11,
      post_id: 2,
      parent_comment_id: null,
      author_name: "Mounir T.",
      content: "Will you be uploading the other books as well? This is a valuable resource for researchers.",
      created_at: "2024-01-15T14:00:00Z",
      reactions_count: 15,
    },
    {
      comment_id: 12,
      post_id: 2,
      parent_comment_id: 11,
      author_name: "Oulamauna Team",
      content: "Yes, we're working on Book III next. Should be ready in a few weeks!",
      created_at: "2024-01-15T14:30:00Z",
      reactions_count: 22,
    },
    {
      comment_id: 13,
      post_id: 2,
      parent_comment_id: null,
      author_name: "Yacine B.",
      content: "The transcription work looks excellent. Are you planning to add a searchable text version as well?",
      created_at: "2024-01-15T15:00:00Z",
      reactions_count: 7,
    },
  ],
  3: [
    {
      comment_id: 14,
      post_id: 3,
      parent_comment_id: null,
      author_name: "Imane Z.",
      content: "The Fons Vitae translation by Harry E. Mather is quite good, though it's only a partial translation. For a complete version, you might need to consult multiple sources.",
      created_at: "2024-01-14T09:00:00Z",
      reactions_count: 10,
    },
    {
      comment_id: 15,
      post_id: 3,
      parent_comment_id: 14,
      author_name: "Sarah K.",
      content: "Thanks! I'll check that out. Do you know if there's a French translation that's more complete?",
      created_at: "2024-01-14T09:30:00Z",
      reactions_count: 3,
    },
    {
      comment_id: 16,
      post_id: 3,
      parent_comment_id: null,
      author_name: "Karim D.",
      content: "I've been looking for this too. The Arabic original is available online, but finding a good English translation has been challenging.",
      created_at: "2024-01-14T10:00:00Z",
      reactions_count: 6,
    },
    {
      comment_id: 17,
      post_id: 3,
      parent_comment_id: 16,
      author_name: "Imane Z.",
      content: "Have you checked the Islamic Philosophy Online database? They have some translations listed.",
      created_at: "2024-01-14T10:30:00Z",
      reactions_count: 8,
    },
  ],
};

/* ------------------------------------------------------------------ */
/*  TRANSLATIONS                                                      */
/* ------------------------------------------------------------------ */
interface ForumPostContent {
  backToForum: string;
  postedBy: string;
  onDate: string;
  views: string;
  comments: string;
  commentPlaceholder: string;
  postComment: string;
  noComments: string;
  replyingTo: string;
  cancelReply: string;
  reply: string;
}

const content: Record<Language, ForumPostContent> = {
  EN: {
    backToForum: "Back to Discussions",
    postedBy: "Posted by",
    onDate: "on",
    views: "Views",
    comments: "Comments",
    commentPlaceholder: "Share your thoughts...",
    postComment: "Post Comment",
    noComments: "No comments yet. Be the first to share your thoughts!",
    replyingTo: "Replying to",
    cancelReply: "Cancel",
    reply: "Reply",
  },
  AR: {
    backToForum: "العودة إلى النقاشات",
    postedBy: "نشر بواسطة",
    onDate: "في",
    views: "مشاهدات",
    comments: "تعليقات",
    commentPlaceholder: "شارك أفكارك...",
    postComment: "نشر التعليق",
    noComments: "لا توجد تعليقات بعد. كن أول من يشارك أفكاره!",
    replyingTo: "الرد على",
    cancelReply: "إلغاء",
    reply: "رد",
  },
  FR: {
    backToForum: "Retour aux Discussions",
    postedBy: "Publié par",
    onDate: "le",
    views: "Vues",
    comments: "Commentaires",
    commentPlaceholder: "Partagez vos pensées...",
    postComment: "Publier le Commentaire",
    noComments: "Aucun commentaire pour le moment. Soyez le premier à partager vos pensées!",
    replyingTo: "Répondre à",
    cancelReply: "Annuler",
    reply: "Répondre",
  },
};

/* ------------------------------------------------------------------ */
/*  HELPERS & UI COMPONENTS                                           */
/* ------------------------------------------------------------------ */
const getAvatarUrl = (name: string) =>
  `https://i.pravatar.cc/150?u=${encodeURIComponent(name)}`;

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
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

const getCategoryById = (categoryId: number) =>
  forumCategories.find((c) => c.category_id === categoryId);

const Icon: React.FC<{ name: string; size?: number; filled?: boolean }> = ({ name, size = 18, filled = false }) => (
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
/*  MAIN COMPONENT                                                    */
/* ------------------------------------------------------------------ */
const ForumPost: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { lang } = useLang();
  const t = content[lang as Language] || content.EN;
  const isRTL = lang === "AR";

  const [post, setPost] = useState<ForumPost | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [replyingTo, setReplyingTo] = useState<{ id: number; name: string } | null>(null);
  const commentsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const foundPost = forumPostsSeed.find((p) => p.post_id === Number(id));
    if (foundPost) {
      setPost(foundPost);
      setComments(mockComments[foundPost.post_id] || []);
    } else {
      navigate("/forum");
    }
  }, [id, navigate]);

  const category = post ? getCategoryById(post.category_id) : null;

  const handlePostComment = () => {
    if (!commentText.trim() || !post) return;

    const newComment: Comment = {
      comment_id: Date.now(),
      post_id: post.post_id,
      parent_comment_id: replyingTo ? replyingTo.id : null,
      author_name: "You",
      content: commentText.trim(),
      created_at: new Date().toISOString(),
      reactions_count: 0,
    };

    setComments((prev) => [...prev, newComment]);
    setCommentText("");
    setReplyingTo(null);

    setPost({
      ...post,
      comments_count: post.comments_count + 1,
    });

    setTimeout(() => {
      commentsEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
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

  if (!post) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: colors.creamLight, color: colors.forestGreen }}>
        <div className="font-['Inter']">Loading...</div>
      </div>
    );
  }

  const topLevelComments = comments.filter((c) => c.parent_comment_id === null);
  const getReplies = (parentId: number) =>
    comments.filter((c) => c.parent_comment_id === parentId);

  return (
    <div 
      className="fixed inset-0 z-50 flex items-start md:items-center justify-center p-0 md:p-6 overflow-y-auto" 
      style={{ backgroundColor: "rgba(11, 67, 53, 0.6)", backdropFilter: "blur(4px)" }}
      dir={isRTL ? "rtl" : "ltr"}
      onClick={() => navigate("/forum")}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap');
        .material-symbols-outlined { font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24; font-family: 'Material Symbols Outlined'; display: inline-block; vertical-align: middle; }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: rgba(11, 67, 53, 0.2); border-radius: 20px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: rgba(11, 67, 53, 0.4); }
      `}</style>

      {/* Floating Modal Container */}
      <div
        className="w-full md:max-w-4xl md:rounded-xl border flex flex-col md:max-h-[90vh]"
        style={{
          backgroundColor: colors.creamLight,
          borderColor: colors.creamDark,
          boxShadow: "0 20px 60px rgba(0,0,0,0.18)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 md:px-8 py-4 md:py-5 border-b flex-shrink-0 sticky top-0 z-10" style={{ backgroundColor: colors.creamLight, borderColor: colors.creamDark }}>
          <div className="flex items-center gap-3 min-w-0">
            {category && (
              <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: category.color }} />
            )}
            <h2 className="font-['Hanken_Grotesk'] text-lg md:text-xl font-bold truncate" style={{ color: colors.forestGreen }}>
              {post.title}
            </h2>
          </div>
          <button
            onClick={() => navigate("/forum")}
            className="w-9 h-9 flex items-center justify-center rounded-lg transition-colors flex-shrink-0"
            style={{ color: colors.forestGreen }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(11, 67, 53, 0.1)")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
            aria-label="Close"
          >
            <Icon name="close" size={22} />
          </button>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-5 md:p-8 space-y-8">
          
          {/* Post Content */}
          <div className="pb-6 border-b" style={{ borderColor: colors.creamDark }}>
            <div className="flex items-start gap-4 mb-5">
              <img
                src={getAvatarUrl(post.author_name)}
                alt={post.author_name}
                className="w-12 h-12 md:w-14 md:h-14 rounded-full object-cover border-2 flex-shrink-0"
                style={{ borderColor: colors.creamDark }}
              />
              <div className="flex-1">
                <div className="font-['Hanken_Grotesk'] text-[15px] md:text-[16px] font-bold mb-1" style={{ color: colors.forestGreen }}>
                  {post.author_name}
                </div>
                <div className="font-['Inter'] text-[12px] opacity-60" style={{ color: colors.forestGreen }}>
                  {t.postedBy} {t.onDate} {formatDate(post.created_at)}
                </div>
              </div>
            </div>

            <div className="font-['Inter'] text-[15px] md:text-[16px] leading-relaxed whitespace-pre-line mb-6 opacity-80" style={{ color: colors.forestGreen }}>
              {post.excerpt}
              {"\n\n"}
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
            </div>

            <div className="flex items-center gap-6 opacity-60" style={{ color: colors.forestGreen }}>
              <div className="flex items-center gap-2">
                <Icon name="visibility" size={18} />
                <span className="font-['Inter'] text-[13px]">{post.views_count} {t.views}</span>
              </div>
              <div className="flex items-center gap-2">
                <Icon name="thumb_up" size={18} />
                <span className="font-['Inter'] text-[13px]">{post.reactions_count}</span>
              </div>
            </div>
          </div>

          {/* Comments Section */}
          <div>
            <h3 className="font-['Hanken_Grotesk'] text-xl font-bold mb-6" style={{ color: colors.forestGreen }}>
              {t.comments} ({comments.length})
            </h3>

            {comments.length === 0 ? (
              <div className="text-center py-12">
                <Icon name="chat_bubble_outline" size={48} />
                <p className="font-['Inter'] text-[14px] mt-3 opacity-70" style={{ color: colors.forestGreen }}>{t.noComments}</p>
              </div>
            ) : (
              <div className="space-y-6">
                {topLevelComments.map((comment) => {
                  const replies = getReplies(comment.comment_id);
                  return (
                    <div key={comment.comment_id}>
                      {/* Top-level comment */}
                      <div 
                        className="flex gap-4 p-4 rounded-xl border transition-colors" 
                        style={{ backgroundColor: colors.creamLight, borderColor: colors.creamDark }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = colors.creamMid)}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = colors.creamLight)}
                      >
                        <img
                          src={getAvatarUrl(comment.author_name)}
                          alt={comment.author_name}
                          className="w-10 h-10 md:w-12 md:h-12 rounded-full object-cover border-2 flex-shrink-0"
                          style={{ borderColor: colors.creamDark }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <span className="font-['Hanken_Grotesk'] text-[14px] md:text-[15px] font-bold" style={{ color: colors.forestGreen }}>
                              {comment.author_name}
                            </span>
                            <span className="opacity-30" style={{ color: colors.forestGreen }}>•</span>
                            <span className="font-['Inter'] text-[12px] opacity-60" style={{ color: colors.forestGreen }}>
                              {formatDate(comment.created_at)}
                            </span>
                          </div>
                          <p className="font-['Inter'] text-[14px] md:text-[15px] leading-relaxed mb-3 opacity-80" style={{ color: colors.forestGreen }}>
                            {comment.content}
                          </p>
                          <div className="flex items-center gap-4">
                            <button 
                              className="flex items-center gap-1.5 transition-colors opacity-60 hover:opacity-100" 
                              style={{ color: colors.forestGreen }}
                            >
                              <Icon name="thumb_up" size={17} />
                              <span className="font-['Inter'] text-[12px]">{comment.reactions_count}</span>
                            </button>
                            <button
                              onClick={() => handleReply(comment.comment_id, comment.author_name)}
                              className="flex items-center gap-1.5 transition-colors opacity-60 hover:opacity-100"
                              style={{ color: colors.forestGreen }}
                            >
                              <Icon name="reply" size={17} />
                              <span className="font-['Inter'] text-[12px]">{t.reply}</span>
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Nested Replies */}
                      {replies.length > 0 && (
                        <div className={`mt-3 ${isRTL ? "mr-6 md:mr-10" : "ml-6 md:ml-10"} space-y-3`}>
                          {replies.map((reply) => (
                            <div key={reply.comment_id} className="flex gap-3 p-3 rounded-lg border" style={{ backgroundColor: colors.creamMid, borderColor: colors.creamDark }}>
                              <img
                                src={getAvatarUrl(reply.author_name)}
                                alt={reply.author_name}
                                className="w-8 h-8 md:w-10 md:h-10 rounded-full object-cover border-2 flex-shrink-0"
                                style={{ borderColor: colors.creamLight }}
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                  <span className="font-['Hanken_Grotesk'] text-[13px] md:text-[14px] font-bold" style={{ color: colors.forestGreen }}>
                                    {reply.author_name}
                                  </span>
                                  <span className="opacity-30" style={{ color: colors.forestGreen }}>•</span>
                                  <span className="font-['Inter'] text-[11px] md:text-[12px] opacity-60" style={{ color: colors.forestGreen }}>
                                    {formatDate(reply.created_at)}
                                  </span>
                                </div>
                                <p className="font-['Inter'] text-[13px] md:text-[14px] leading-relaxed mb-2 opacity-80" style={{ color: colors.forestGreen }}>
                                  {reply.content}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
                <div ref={commentsEndRef} />
              </div>
            )}
          </div>
        </div>

        {/* Sticky Comment Input at Bottom of Modal */}
        <div className="flex-shrink-0 border-t p-4 md:p-6 md:rounded-b-xl" style={{ borderColor: colors.creamDark, backgroundColor: colors.creamLight }}>
          {replyingTo && (
            <div className={`flex items-center justify-between mb-3 px-3 py-2 rounded-lg ${isRTL ? "flex-row-reverse" : ""}`} style={{ backgroundColor: colors.creamMid }}>
              <div className={`flex items-center gap-2 ${isRTL ? "flex-row-reverse" : ""}`}>
                <Icon name="reply" size={16} />
                <span className="font-['Inter'] text-[12px]" style={{ color: colors.forestGreen }}>
                  {t.replyingTo} <span className="font-semibold" style={{ color: colors.forestGreen }}>{replyingTo.name}</span>
                </span>
              </div>
              <button onClick={cancelReply} className="transition-opacity hover:opacity-70" style={{ color: colors.forestGreen }}>
                <Icon name="close" size={18} />
              </button>
            </div>
          )}

          <div className="flex gap-2.5 items-start">
            <img
              src={getAvatarUrl("You")}
              alt="You"
              className="w-9 h-9 md:w-10 md:h-10 rounded-full object-cover border-2 flex-shrink-0 mt-1"
              style={{ borderColor: colors.creamDark }}
            />
            <div className="flex-1 flex items-center gap-3">
              <textarea
                id="comment-input"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder={t.commentPlaceholder}
                rows={1}
                className="w-full px-4 py-3 rounded-lg border bg-[#fcfaf5] font-['Inter'] text-[14px] outline-none transition-all resize-none"
                style={{ borderColor: colors.creamDark }}
                onFocus={(e) => { e.currentTarget.style.borderColor = colors.amber; e.currentTarget.style.boxShadow = `0 0 0 1px ${colors.amber}`; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = colors.creamDark; e.currentTarget.style.boxShadow = "none"; }}
                dir={isRTL ? "rtl" : "ltr"}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                    handlePostComment();
                  }
                }}
              />
              <button
                onClick={handlePostComment}
                disabled={!commentText.trim()}
                className="flex-shrink-0 inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-[13px] font-bold tracking-[0.05em] font-['Hanken_Grotesk'] transition-all duration-200 border disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: colors.forestGreen,
                  color: colors.creamLight,
                  borderColor: colors.forestGreen,
                }}
                onMouseEnter={(e) => {
                  if (commentText.trim()) {
                    e.currentTarget.style.backgroundColor = colors.creamLight;
                    e.currentTarget.style.color = colors.forestGreen;
                  }
                }}
                onMouseLeave={(e) => {
                  if (commentText.trim()) {
                    e.currentTarget.style.backgroundColor = colors.forestGreen;
                    e.currentTarget.style.color = colors.creamLight;
                  }
                }}
              >
                <Icon name="send" size={16} filled />
                <span className="hidden sm:inline">{t.postComment}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForumPost;