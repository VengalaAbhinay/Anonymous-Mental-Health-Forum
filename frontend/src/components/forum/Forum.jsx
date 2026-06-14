import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/axiosInstance";
import { S, CATEGORY_COLORS, CATEGORIES } from "../../styles/common";

export default function Forum() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/post-api/", { params: { page, limit: 15, category, search: search || undefined } });
      setPosts(data.posts);
      setTotalPages(data.pages);
    } catch { } finally { setLoading(false); }
  };

  useEffect(() => { fetchPosts(); }, [page, category]);
  useEffect(() => { const t = setTimeout(fetchPosts, 400); return () => clearTimeout(t); }, [search]);

  return (
    <div style={{ ...S.pageWide }}>
      {/* Hero */}
      <div style={{ textAlign: "center", padding: "32px 0 28px" }}>
        <h1 style={{ ...S.heading, fontSize: 36, marginBottom: 8 }}>You are not alone</h1>
        <p style={{ color: "var(--text-muted)", maxWidth: 480, margin: "0 auto 20px" }}>
          A safe, anonymous space for students to share, listen, and support each other.
        </p>
        <Link to="/new-post" style={{
          ...S.btn, ...S.btnPrimary, textDecoration: "none", display: "inline-flex",
        }}>
          ✏️ Share your thoughts
        </Link>
      </div>

      {/* Search + filters */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        <input
          style={{ ...S.input, flex: "1 1 220px" }}
          placeholder="Search posts…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          onFocus={(e) => e.target.style.borderColor = "var(--accent)"}
          onBlur={(e) => e.target.style.borderColor = "var(--border)"}
        />
        <select
          style={{ ...S.input, flex: "0 0 160px" }}
          value={category}
          onChange={(e) => { setCategory(e.target.value); setPage(1); }}
        >
          {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
      </div>

      {/* Posts */}
      {loading ? (
        <div style={{ textAlign: "center", padding: 60, color: "var(--text-muted)" }}>Loading…</div>
      ) : posts.length === 0 ? (
        <div style={{ textAlign: "center", padding: 60, color: "var(--text-muted)" }}>
          No posts found. Be the first to share.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {posts.map((post) => <PostCard key={post._id} post={post} />)}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 28 }}>
          <button
            style={{ ...S.btn, ...S.btnSecondary, opacity: page === 1 ? 0.5 : 1 }}
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
          >← Prev</button>
          <span style={{ padding: "9px 14px", fontSize: 13, color: "var(--text-muted)" }}>
            {page} / {totalPages}
          </span>
          <button
            style={{ ...S.btn, ...S.btnSecondary, opacity: page === totalPages ? 0.5 : 1 }}
            disabled={page === totalPages}
            onClick={() => setPage((p) => p + 1)}
          >Next →</button>
        </div>
      )}
    </div>
  );
}

function PostCard({ post }) {
  const cat = CATEGORY_COLORS[post.category] || CATEGORY_COLORS.general;
  const timeAgo = (d) => {
    const diff = (Date.now() - new Date(d)) / 1000;
    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  return (
    <Link to={`/post/${post._id}`} style={{ textDecoration: "none" }}>
      <div style={{ ...S.card, transition: "box-shadow 0.15s" }}
        onMouseEnter={(e) => e.currentTarget.style.boxShadow = "var(--shadow)"}
        onMouseLeave={(e) => e.currentTarget.style.boxShadow = "var(--shadow-sm)"}
      >
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <span style={{ ...S.badge, background: cat.bg, color: cat.text }}>{post.category}</span>
              {post.sentiment?.flagged && (
                <span style={{ ...S.badge, background: "var(--crisis-soft)", color: "var(--crisis)" }}>
                  ⚠️ flagged
                </span>
              )}
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: "var(--text)", marginBottom: 6, lineHeight: 1.4 }}>
              {post.title}
            </h3>
            <p style={{ color: "var(--text-muted)", fontSize: 13, lineHeight: 1.5 }}>
              {post.content.length > 140 ? post.content.slice(0, 140) + "…" : post.content}
            </p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 16, marginTop: 12, color: "var(--text-muted)", fontSize: 12 }}>
          <span>👤 {post.displayAlias}</span>
          <span>💬 {post.comments?.length || 0} replies</span>
          <span>❤️ {post.upvotes?.length || 0}</span>
          <span style={{ marginLeft: "auto" }}>{timeAgo(post.createdAt)}</span>
        </div>
      </div>
    </Link>
  );
}
