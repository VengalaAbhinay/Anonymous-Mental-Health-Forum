import { useState } from "react";
import api from "../../api/axiosInstance";
import { S } from "../../styles/common";

const REASONS = [
  { value: "harmful", label: "🚨 Harmful content" },
  { value: "self-harm", label: "💔 Self-harm or suicide" },
  { value: "bullying", label: "😤 Bullying or harassment" },
  { value: "toxic", label: "☠️ Toxic or abusive language" },
  { value: "spam", label: "📢 Spam" },
  { value: "misinformation", label: "❌ Misinformation" },
  { value: "other", label: "🔖 Other" },
];

export default function ReportModal({ targetType, targetId, onClose }) {
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [status, setStatus] = useState("idle"); // idle | loading | success | error
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason) return;
    setStatus("loading");
    try {
      await api.post("/report-api/", { targetType, targetId, reason, details });
      setStatus("success");
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Failed to submit report.");
      setStatus("error");
    }
  };

  return (
    // Backdrop
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 1000, padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ ...S.card, width: "100%", maxWidth: 420, boxShadow: "var(--shadow-lg)" }}
      >
        {status === "success" ? (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>✅</div>
            <h3 style={{ marginBottom: 6 }}>Report submitted</h3>
            <p style={S.muted}>Our team will review it. Thank you for keeping MindSpace safe.</p>
            <button onClick={onClose} style={{ ...S.btn, ...S.btnPrimary, marginTop: 16 }}>Close</button>
          </div>
        ) : (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ fontSize: 16, fontWeight: 600 }}>Report {targetType}</h3>
              <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "var(--text-muted)" }}>×</button>
            </div>

            {status === "error" && (
              <div style={{ background: "var(--danger-soft)", color: "var(--danger)", borderRadius: "var(--radius-sm)", padding: "8px 12px", marginBottom: 12, fontSize: 13 }}>
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={S.label}>Reason *</label>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {REASONS.map((r) => (
                    <label key={r.value} style={{
                      display: "flex", alignItems: "center", gap: 10,
                      padding: "8px 12px", borderRadius: "var(--radius-sm)",
                      border: `1.5px solid ${reason === r.value ? "var(--accent)" : "var(--border)"}`,
                      background: reason === r.value ? "var(--accent-soft)" : "var(--surface)",
                      cursor: "pointer", fontSize: 13,
                    }}>
                      <input
                        type="radio" name="reason" value={r.value}
                        checked={reason === r.value}
                        onChange={() => setReason(r.value)}
                        style={{ accentColor: "var(--accent)" }}
                      />
                      {r.label}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label style={S.label}>Additional details <span style={{ color: "var(--text-light)" }}>(optional)</span></label>
                <textarea
                  style={{ ...S.input, minHeight: 70, resize: "none" }}
                  placeholder="Any extra context for the reviewer…"
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  maxLength={300}
                  onFocus={(e) => e.target.style.borderColor = "var(--accent)"}
                  onBlur={(e) => e.target.style.borderColor = "var(--border)"}
                />
              </div>

              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                <button type="button" onClick={onClose} style={{ ...S.btn, ...S.btnSecondary }}>Cancel</button>
                <button
                  type="submit"
                  disabled={!reason || status === "loading"}
                  style={{ ...S.btn, ...S.btnDanger, opacity: (!reason || status === "loading") ? 0.6 : 1 }}
                >
                  {status === "loading" ? "Submitting…" : "Submit report"}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
