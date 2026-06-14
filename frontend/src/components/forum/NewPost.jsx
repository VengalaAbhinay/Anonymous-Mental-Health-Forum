import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axiosInstance";
import { S, CATEGORIES } from "../../styles/common";
import BackToForum from "../shared/BackToForum";
import CrisisBanner from "../shared/CrisisBanner";
import { useAuthStore } from "../../store/authStore";

export default function NewPost() {
  const { user } = useAuthStore();
  const [form, setForm] = useState({ title: "", content: "", category: "general", tags: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [crisisData, setCrisisData] = useState(null);
  const navigate = useNavigate();

  if (user?.role !== "user") {
    return (
      <div style={S.page}>
        <p style={{ color: "var(--danger)", textAlign: "center", marginTop: 60 }}>
          Only students can create posts.
        </p>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const { data } = await api.post("/post-api/", {
        ...form,
        tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
      });
      if (data.crisisAlert) {
        setCrisisData(data.crisisResources);
        setTimeout(() => navigate(`/post/${data.post._id}`), 4000);
      } else {
        navigate(`/post/${data.post._id}`);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create post.");
    } finally { setLoading(false); }
  };

  return (
    <div style={S.page}>
      <BackToForum />
      <div style={{ maxWidth: 640, margin: "0 auto" }}>
        <h1 style={{ ...S.heading, fontSize: 28, marginBottom: 6 }}>Share your thoughts</h1>
        <p style={{ ...S.muted, marginBottom: 24 }}>
          Your post will appear under your alias. Your identity stays private.
        </p>

        {crisisData && <CrisisBanner resources={crisisData} />}

        {error && (
          <div style={{ background: "var(--danger-soft)", border: "1px solid var(--crisis-border)", borderRadius: "var(--radius-sm)", padding: "10px 14px", marginBottom: 16, color: "var(--danger)", fontSize: 13 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ ...S.card, display: "flex", flexDirection: "column", gap: 18 }}>
          <div>
            <label style={S.label}>Title</label>
            <input
              style={S.input} placeholder="What's on your mind?"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required maxLength={120}
              onFocus={(e) => e.target.style.borderColor = "var(--accent)"}
              onBlur={(e) => e.target.style.borderColor = "var(--border)"}
            />
          </div>
          <div>
            <label style={S.label}>Category</label>
            <select
              style={S.input}
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            >
              {CATEGORIES.filter((c) => c.value !== "all").map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={S.label}>
              Your message
              <span style={{ float: "right", fontWeight: 400, color: "var(--text-light)" }}>
                {form.content.length}/3000
              </span>
            </label>
            <textarea
              style={{ ...S.input, minHeight: 160, resize: "vertical" }}
              placeholder="Share what you're going through. This is a safe space."
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              required maxLength={3000}
              onFocus={(e) => e.target.style.borderColor = "var(--accent)"}
              onBlur={(e) => e.target.style.borderColor = "var(--border)"}
            />
          </div>
          <div>
            <label style={S.label}>Tags <span style={{ color: "var(--text-light)" }}>(optional, comma-separated)</span></label>
            <input
              style={S.input} placeholder="e.g. exams, sleep, family"
              value={form.tags}
              onChange={(e) => setForm({ ...form, tags: e.target.value })}
              onFocus={(e) => e.target.style.borderColor = "var(--accent)"}
              onBlur={(e) => e.target.style.borderColor = "var(--border)"}
            />
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button type="button" onClick={() => navigate(-1)} style={{ ...S.btn, ...S.btnSecondary }}>
              Cancel
            </button>
            <button type="submit" disabled={loading} style={{ ...S.btn, ...S.btnPrimary, opacity: loading ? 0.7 : 1 }}>
              {loading ? "Posting…" : "Post anonymously"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
