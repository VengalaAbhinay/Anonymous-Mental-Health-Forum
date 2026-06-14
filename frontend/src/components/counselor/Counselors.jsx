import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axiosInstance";
import { useAuthStore } from "../../store/authStore";
import { S } from "../../styles/common";
import BackToForum from "../shared/BackToForum";

export default function Counselors() {
  const [counselors, setCounselors] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    api.get("/user-api/counselors")
      .then(({ data }) => setCounselors(data.counselors))
      .finally(() => setLoading(false));
  }, []);

  const isCounselorAvailable = (counselor) => {
    if (typeof counselor?.canChat === "boolean") return counselor.canChat;

    return Boolean(
      counselor?.counselorProfile?.isVerified === true &&
        counselor?.counselorProfile?.isAvailable !== false
    );
  };

  const availableCount = counselors.filter(isCounselorAvailable).length;

  const requestPrivateChat = (counselor) => {
    if (!user) {
      navigate("/login");
      return;
    }

    if (!isCounselorAvailable(counselor)) {
      return;
    }

    const counselorName = counselor.counselorProfile?.name || counselor.alias || "Counselor";
    navigate(`/chat?counselorId=${counselor._id}&name=${encodeURIComponent(counselorName)}`);
  };

  return (
    <div style={S.page}>
      <BackToForum />
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ ...S.heading, fontSize: 30, marginBottom: 8 }}>Professional Counselors</h1>
        <p style={S.muted}>Connect privately with a trained counselor. Sessions are confidential.</p>
        {!loading && (
          <p style={{ ...S.muted, marginTop: 8, fontSize: 13 }}>
            Showing all counselors: <b>{counselors.length}</b> | Available now: <b>{availableCount}</b>
          </p>
        )}
      </div>

      <div style={{ background: "var(--counselor-soft)", border: "1px solid var(--counselor-border)", borderRadius: "var(--radius)", padding: "16px 20px", marginBottom: 28 }}>
        <p style={{ fontWeight: 600, color: "var(--counselor)", marginBottom: 4 }}>🆘 In immediate crisis?</p>
        <p style={{ color: "var(--counselor)", fontSize: 13 }}>
          Call iCall: <strong>9152987821</strong> or Vandrevala Foundation: <strong>1860-2662-345</strong> — available 24/7.
        </p>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: 60, color: "var(--text-muted)" }}>Loading counselors…</div>
      ) : counselors.length === 0 ? (
        <div style={{ textAlign: "center", padding: 60, color: "var(--text-muted)" }}>
          No counselors available right now. Check back later.
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
          {counselors.map((c) => {
            const canChat = isCounselorAvailable(c);
            const isVerified = Boolean(c.counselorProfile?.isVerified);
            const isMarkedAvailable = Boolean(c.counselorProfile?.isAvailable);

            return (
            <div key={c._id} style={S.card}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                <div style={{
                  width: 48, height: 48, borderRadius: "50%",
                  background: "var(--counselor-soft)", color: "var(--counselor)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 20, fontWeight: 600,
                }}>
                  {(c.counselorProfile?.name || c.alias || "C")[0].toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 15 }}>
                    {c.counselorProfile?.name || c.alias} {c.counselorProfile?.isVerified && <span title="Verified counselor">✅</span>}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--counselor)" }}>
                    {c.counselorProfile?.specialization || "General Counseling"}
                  </div>
                </div>
                <span
                  style={{
                    marginLeft: "auto",
                    ...S.badge,
                    background: canChat ? "var(--counselor-soft)" : "var(--surface2)",
                    color: canChat ? "var(--counselor)" : "var(--text-muted)",
                    fontSize: 11,
                    whiteSpace: "nowrap",
                  }}
                >
                  {canChat
                    ? "● Available"
                    : !isVerified
                    ? "Not verified"
                    : !isMarkedAvailable
                    ? "Unavailable"
                    : "Unavailable"}
                </span>
              </div>
              <p style={{ ...S.muted, fontSize: 13, lineHeight: 1.5, marginBottom: 14 }}>
                {c.counselorProfile?.bio || "Trained counselor available to support students."}
              </p>
              <button
                onClick={() => requestPrivateChat(c)}
                style={{ ...S.btn, ...S.btnSuccess, width: "100%", justifyContent: "center", fontSize: 13 }}
                disabled={!canChat}
              >
                {canChat ? "Request private chat" : "Currently unavailable"}
              </button>
            </div>
          );
          })}
        </div>
      )}
    </div>
  );
}
