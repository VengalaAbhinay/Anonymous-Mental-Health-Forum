import { useState } from "react";
import api from "../../api/axiosInstance";
import { useAuthStore } from "../../store/authStore";
import { S } from "../../styles/common";
import BackToForum from "../shared/BackToForum";

export default function Profile() {
  const { user, updateAlias } = useAuthStore();
  const [alias, setAlias] = useState(user?.alias || "");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.patch("/user-api/alias", { alias });
      updateAlias(alias);
      setMsg("Alias updated successfully.");
    } catch {
      setMsg("Failed to update alias.");
    } finally { setSaving(false); }
  };

  return (
    <div style={S.page}>
      <BackToForum />
      <div style={{ maxWidth: 480, margin: "0 auto" }}>
        <h1 style={{ ...S.heading, fontSize: 26, marginBottom: 20 }}>Your Profile</h1>

        <div style={{ ...S.card, marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
            <div style={{
              width: 56, height: 56, borderRadius: "50%",
              background: "var(--accent-soft)", color: "var(--accent)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 22, fontWeight: 600,
            }}>
              {(user?.alias || "A")[0].toUpperCase()}
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 17 }}>{user?.alias || "Anonymous"}</div>
              <div style={{ ...S.muted }}>
                <span style={{ ...S.badge, background: "var(--accent-soft)", color: "var(--accent)", fontSize: 11 }}>
                  {user?.role || "user"}
                </span>
              </div>
            </div>
          </div>

          <div style={{ borderTop: "1px solid var(--border)", paddingTop: 16 }}>
            <p style={{ ...S.muted, marginBottom: 4 }}>Email (private)</p>
            <p style={{ fontWeight: 500 }}>{user?.email}</p>
          </div>
        </div>

        <div style={S.card}>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Change display alias</h2>
          <p style={{ ...S.muted, marginBottom: 16, fontSize: 13 }}>
            Your alias is the name shown on your posts. Your email is never visible to others.
          </p>
          {msg && (
            <div style={{ background: "var(--accent-soft)", color: "var(--accent)", borderRadius: "var(--radius-sm)", padding: "8px 12px", marginBottom: 12, fontSize: 13 }}>
              {msg}
            </div>
          )}
          <form onSubmit={handleSave} style={{ display: "flex", gap: 10 }}>
            <input
              style={{ ...S.input, flex: 1 }}
              placeholder="New alias"
              value={alias}
              onChange={(e) => setAlias(e.target.value)}
              maxLength={30}
              onFocus={(e) => e.target.style.borderColor = "var(--accent)"}
              onBlur={(e) => e.target.style.borderColor = "var(--border)"}
            />
            <button type="submit" disabled={saving} style={{ ...S.btn, ...S.btnPrimary, opacity: saving ? 0.7 : 1 }}>
              Save
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
