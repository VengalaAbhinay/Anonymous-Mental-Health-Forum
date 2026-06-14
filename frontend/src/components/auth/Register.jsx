import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { S } from "../../styles/common";

export default function Register() {
  const [form, setForm] = useState({ email: "", password: "", alias: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { register } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      await register(form.email, form.password, form.alias);
      navigate("/login", { state: { message: "Account created! Please sign in." } });
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed.");
    } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ ...S.card, width: "100%", maxWidth: 420 }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>🌿</div>
          <h1 style={{ ...S.heading, fontSize: 26, marginBottom: 6 }}>Create your space</h1>
          <p style={S.muted}>A safe, anonymous place to share and heal</p>
        </div>

        {error && (
          <div style={{ background: "var(--danger-soft)", border: "1px solid var(--crisis-border)", borderRadius: "var(--radius-sm)", padding: "10px 14px", marginBottom: 16, color: "var(--danger)", fontSize: 13 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={S.label}>Email <span style={{ color: "var(--text-light)" }}>(kept private)</span></label>
            <input
              style={S.input} type="email" placeholder="your@email.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
              onFocus={(e) => e.target.style.borderColor = "var(--accent)"}
              onBlur={(e) => e.target.style.borderColor = "var(--border)"}
            />
          </div>
          <div>
            <label style={S.label}>Display alias <span style={{ color: "var(--text-light)" }}>(shown on posts)</span></label>
            <input
              style={S.input} type="text" placeholder="e.g. QuietMountain, BlueRiver…"
              value={form.alias}
              onChange={(e) => setForm({ ...form, alias: e.target.value })}
              onFocus={(e) => e.target.style.borderColor = "var(--accent)"}
              onBlur={(e) => e.target.style.borderColor = "var(--border)"}
            />
            <p style={{ ...S.muted, marginTop: 4 }}>Leave blank to post as "Anonymous"</p>
          </div>
          <div>
            <label style={S.label}>Password</label>
            <input
              style={S.input} type="password" placeholder="At least 8 characters"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required minLength={8}
              onFocus={(e) => e.target.style.borderColor = "var(--accent)"}
              onBlur={(e) => e.target.style.borderColor = "var(--border)"}
            />
          </div>
          <button
            type="submit" disabled={loading}
            style={{ ...S.btn, ...S.btnPrimary, justifyContent: "center", padding: "11px", marginTop: 4, opacity: loading ? 0.7 : 1 }}
          >
            {loading ? "Creating account…" : "Create account"}
          </button>
        </form>

        <p style={{ textAlign: "center", marginTop: 20, fontSize: 13, color: "var(--text-muted)" }}>
          Already have an account?{" "}
          <Link to="/login" style={{ color: "var(--accent)", fontWeight: 500 }}>Sign in</Link>
        </p>

        <div style={{ marginTop: 20, padding: "12px", background: "var(--surface2)", borderRadius: "var(--radius-sm)", fontSize: 12, color: "var(--text-muted)", textAlign: "center" }}>
          🔒 Your email is never displayed. All posts appear under your alias only.
        </div>
      </div>
    </div>
  );
}
