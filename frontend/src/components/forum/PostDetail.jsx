import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../api/axiosInstance";
import { useAuthStore } from "../../store/authStore";
import { S, CATEGORY_COLORS } from "../../styles/common";
import CrisisBanner from "../shared/CrisisBanner";
import ReportModal from "../shared/ReportModal";

export default function PostDetail() {
  const { id } = useParams();
  const { user } = useAuthStore();
  const [post, setPost] = useState(null);
  const [crisisResources, setCrisisResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [commentCrisis, setCommentCrisis] = useState(null);
  const [report, setReport] = useState(null); // { targetType, targetId }
  const navigate = useNavigate();

  useEffect(() => {
    api.get(`/post-api/${id}`)
      .then(({ data }) => { setPost(data.post); setCrisisResources(data.crisisResources || []); })
      .catch(() => navigate("/"))
      .finally(() => setLoading(false));
  }, [id]);

  const handleUpvote = async () => {
    if (!user) return navigate("/login");
    const { data } = await api.patch(`/post-api/${id}/upvote`);
    setPost((p) => ({ ...p, upvotes: Array(data.upvotes).fill(null) }));
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    setSubmitting(true);
    try {
      const { data } = await api.post(`/post-api/${id}/comments`, { text: commentText });
      setPost((p) => ({ ...p, comments: [...(p.comments || []), data.comment] }));
      setCommentText("");
      if (data.crisisAlert) setCommentCrisis(data.crisisResources);
    } catch { } finally { setSubmitting(false); }
  };

  if (loading) return <div style={{ textAlign: "center", padding: 80, color: "var(--text-muted)" }}>Loading…</div>;
  if (!post) return null;

  const cat = CATEGORY_COLORS[post.category] || CATEGORY_COLORS.general;
  const timeAgo = (d) => {
    const diff = (Date.now() - new Date(d)) / 1000;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  };

  return (
    <div style={S.page}>
      {report && (
        <ReportModal
          targetType={report.targetType}
          targetId={report.targetId}
          onClose={() => setReport(null)}
        />
      )}

      <div style={{ maxWidth: 700, margin: "0 auto" }}>
        <button onClick={() => navigate(-1)} style={{ ...S.btn, ...S.btnSecondary, marginBottom: 20, fontSize: 13 }}>
          ← Back to forum
        </button>

        {crisisResources.length > 0 && <CrisisBanner resources={crisisResources} />}

        {/* Post */}
        <div style={S.card}>
          <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
            <span style={{ ...S.badge, background: cat.bg, color: cat.text }}>{post.category}</span>
            {post.tags?.map((t) => (
              <span key={t} style={{ ...S.badge, background: "var(--surface2)", color: "var(--text-muted)" }}>
                #{t}
              </span>
            ))}
          </div>

          <h1 style={{ ...S.heading, fontSize: 24, marginBottom: 14 }}>{post.title}</h1>
          <p style={{ color: "var(--text)", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{post.content}</p>

          <div style={{ display: "flex", gap: 12, marginTop: 20, color: "var(--text-muted)", fontSize: 13, borderTop: "1px solid var(--border)", paddingTop: 16, flexWrap: "wrap", alignItems: "center" }}>
            <span>👤 {post.displayAlias}</span>
            <span>{timeAgo(post.createdAt)}</span>
            <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
              {user?.role === "user" && (
                <button
                  onClick={handleUpvote}
                  style={{ ...S.btn, background: "var(--accent-soft)", color: "var(--accent)", padding: "5px 12px", fontSize: 13 }}
                >
                  ❤️ {post.upvotes?.length || 0}
                </button>
              )}
              {user?.role !== "user" && (
                <span style={{ fontSize: 13, color: "var(--text-muted)", padding: "5px 12px" }}>
                  ❤️ {post.upvotes?.length || 0}
                </span>
              )}
              {user?.role === "user" && (
                <button
                  onClick={() => setReport({ targetType: "post", targetId: post._id })}
                  style={{ ...S.btn, background: "var(--danger-soft)", color: "var(--danger)", padding: "5px 12px", fontSize: 13, border: "none" }}
                  title="Report this post"
                >
                  🚩 Report
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Comments */}
        <div style={{ marginTop: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>
            Replies ({post.comments?.length || 0})
          </h2>

          {(post.comments || []).map((c) => (
            <div key={c._id} style={{ ...S.card, marginBottom: 10 }}>
              <p style={{ color: "var(--text)", lineHeight: 1.6, marginBottom: 8 }}>{c.text}</p>
              <div style={{ fontSize: 12, color: "var(--text-muted)", display: "flex", gap: 12, alignItems: "center" }}>
                <span>👤 {c.displayAlias}</span>
                <span>{timeAgo(c.createdAt)}</span>
                {user?.role === "user" && (
                  <button
                    onClick={() => setReport({ targetType: "comment", targetId: c._id })}
                    style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-light)", fontSize: 12, padding: "2px 6px", borderRadius: 4 }}
                    title="Report this comment"
                  >
                    🚩 Report
                  </button>
                )}
              </div>
            </div>
          ))}

          {commentCrisis && <CrisisBanner resources={commentCrisis} />}

          {user?.role === "user" ? (
            <form onSubmit={handleComment} style={{ marginTop: 16 }}>
              <textarea
                style={{ ...S.input, minHeight: 90, resize: "vertical", marginBottom: 10 }}
                placeholder="Share a supportive response…"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                maxLength={1000}
                onFocus={(e) => e.target.style.borderColor = "var(--accent)"}
                onBlur={(e) => e.target.style.borderColor = "var(--border)"}
              />
              <button type="submit" disabled={submitting} style={{ ...S.btn, ...S.btnPrimary, opacity: submitting ? 0.7 : 1 }}>
                {submitting ? "Posting…" : "Post reply"}
              </button>
            </form>
          ) : user ? (
            <div style={{ ...S.card, textAlign: "center", color: "var(--text-muted)", marginTop: 16 }}>
              Replies are for students only.
            </div>
          ) : (
            <div style={{ ...S.card, textAlign: "center", color: "var(--text-muted)", marginTop: 16 }}>
              <a href="/login" style={{ color: "var(--accent)" }}>Sign in</a> to leave a supportive reply.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
