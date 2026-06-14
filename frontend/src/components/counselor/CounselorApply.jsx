import { useEffect, useState } from "react";
import api from "../../api/axiosInstance";
import { S } from "../../styles/common";
import BackToForum from "../shared/BackToForum";
import { useAuthStore } from "../../store/authStore";

export default function CounselorApply() {
  const { user } = useAuthStore();
  const [form, setForm] = useState({ fullName: "", specialization: "", experience: "", qualification: "", bio: "", availability: "" });
  const [application, setApplication] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  if (user?.role !== "user") {
    return (
      <div style={S.page}>
        <BackToForum />
        <p style={{ color: "var(--danger)", textAlign: "center", marginTop: 60 }}>
          Only students can apply to become a counselor.
        </p>
      </div>
    );
  }

  const loadStatus = async () => {
    const { data } = await api.get("/counselor-api/my-application");
    setApplication(data.application);
  };

  useEffect(() => { loadStatus(); }, []);

  const submit = async (e) => {
    e.preventDefault();
    setError(""); setMessage("");
    try {
      const { data } = await api.post("/counselor-api/apply", form);
      setMessage(data.message);
      setApplication(data.application);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to submit application.");
    }
  };

  return (
    <div style={S.page}>
      <BackToForum />
      <h1 style={{ ...S.heading, fontSize: 30, marginBottom: 8 }}>Counselor Verification</h1>
      <p style={{ ...S.muted, marginBottom: 22 }}>Apply to become a verified counselor. Admin will review your details.</p>

      {application && (
        <div style={{ ...S.card, marginBottom: 18 }}>
          <strong>Status: </strong>
          <span style={{ ...S.badge, background: application.status === "approved" ? "var(--counselor-soft)" : application.status === "rejected" ? "var(--danger-soft)" : "var(--warning-soft)", color: application.status === "approved" ? "var(--counselor)" : application.status === "rejected" ? "var(--danger)" : "var(--warning)" }}>
            {application.status}
          </span>
          {application.adminNote && <p style={{ ...S.muted, marginTop: 8 }}>Admin note: {application.adminNote}</p>}
        </div>
      )}

      {message && <div style={{ ...S.card, borderColor: "var(--success)", color: "var(--success)", marginBottom: 14 }}>{message}</div>}
      {error && <div style={{ ...S.card, borderColor: "var(--danger)", color: "var(--danger)", marginBottom: 14 }}>{error}</div>}

      <form onSubmit={submit} style={{ ...S.card, display: "flex", flexDirection: "column", gap: 14 }}>
        <div><label style={S.label}>Full name</label><input style={S.input} value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} required /></div>
        <div><label style={S.label}>Specialization</label><input style={S.input} placeholder="Anxiety, academic stress, depression..." value={form.specialization} onChange={(e) => setForm({ ...form, specialization: e.target.value })} required /></div>
        <div><label style={S.label}>Experience</label><input style={S.input} placeholder="Example: 2 years peer counseling" value={form.experience} onChange={(e) => setForm({ ...form, experience: e.target.value })} required /></div>
        <div><label style={S.label}>Qualification</label><input style={S.input} placeholder="Example: Psychology degree / certified training" value={form.qualification} onChange={(e) => setForm({ ...form, qualification: e.target.value })} required /></div>
        <div><label style={S.label}>Availability</label><input style={S.input} placeholder="Example: Mon-Fri, 6 PM to 9 PM" value={form.availability} onChange={(e) => setForm({ ...form, availability: e.target.value })} /></div>
        <div><label style={S.label}>Short bio</label><textarea style={{ ...S.input, minHeight: 120 }} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} required maxLength={800} /></div>
        <button type="submit" style={{ ...S.btn, ...S.btnPrimary, width: "fit-content" }}>Submit application</button>
      </form>
    </div>
  );
}
