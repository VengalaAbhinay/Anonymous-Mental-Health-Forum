import { useEffect, useState } from "react";
import api from "../../api/axiosInstance";
import { S } from "../../styles/common";
import BackToForum from "../shared/BackToForum";
import { useAuthStore } from "../../store/authStore";

const MOODS = [
  { value: "happy", emoji: "😊", label: "Happy" },
  { value: "calm", emoji: "😌", label: "Calm" },
  { value: "neutral", emoji: "😐", label: "Neutral" },
  { value: "sad", emoji: "😔", label: "Sad" },
  { value: "anxious", emoji: "😰", label: "Anxious" },
  { value: "angry", emoji: "😡", label: "Angry" },
  { value: "stressed", emoji: "😵‍💫", label: "Stressed" },
];

export default function MoodTracker() {
  const { user } = useAuthStore();
  const [form, setForm] = useState({ mood: "neutral", intensity: 3, note: "" });
  const [entries, setEntries] = useState([]);
  const [avgIntensity, setAvgIntensity] = useState(0);
  const [message, setMessage] = useState("");

  if (user?.role !== "user") {
    return (
      <div style={S.page}>
        <p style={{ color: "var(--danger)", textAlign: "center", marginTop: 60 }}>
          The mood tracker is only available to students.
        </p>
      </div>
    );
  }
  const [loading, setLoading] = useState(true);

  const loadHistory = async () => {
    const { data } = await api.get("/mood-api/?days=14");
    setEntries(data.entries || []);
    setAvgIntensity(data.avgIntensity || 0);
  };

  useEffect(() => {
    loadHistory().finally(() => setLoading(false));
  }, []);

  const submitMood = async (e) => {
    e.preventDefault();
    setMessage("");
    const { data } = await api.post("/mood-api/", form);
    setMessage(data.message || "Mood saved.");
    setForm({ mood: form.mood, intensity: form.intensity, note: "" });
    await loadHistory();
  };

  return (
    <div style={S.page}>
      <BackToForum />
      <h1 style={{ ...S.heading, fontSize: 30, marginBottom: 8 }}>Mood Tracker</h1>
      <p style={{ ...S.muted, marginBottom: 22 }}>Track your daily mood privately. Only you can see your entries.</p>

      <form onSubmit={submitMood} style={{ ...S.card, marginBottom: 20 }}>
        <label style={S.label}>How are you feeling today?</label>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))", gap: 10, marginBottom: 16 }}>
          {MOODS.map((m) => (
            <button
              type="button"
              key={m.value}
              onClick={() => setForm({ ...form, mood: m.value })}
              style={{
                ...S.btn,
                justifyContent: "center",
                border: form.mood === m.value ? "2px solid var(--accent)" : "1px solid var(--border)",
                background: form.mood === m.value ? "var(--accent-soft)" : "var(--surface2)",
                color: "var(--text)",
              }}
            >
              <span>{m.emoji}</span> {m.label}
            </button>
          ))}
        </div>

        <label style={S.label}>Intensity: {form.intensity}/5</label>
        <input
          type="range"
          min="1"
          max="5"
          value={form.intensity}
          onChange={(e) => setForm({ ...form, intensity: Number(e.target.value) })}
          style={{ width: "100%", marginBottom: 16 }}
        />

        <label style={S.label}>Note <span style={{ color: "var(--text-light)" }}>(optional)</span></label>
        <textarea
          style={{ ...S.input, minHeight: 90, resize: "vertical", marginBottom: 16 }}
          value={form.note}
          maxLength={500}
          placeholder="What affected your mood today?"
          onChange={(e) => setForm({ ...form, note: e.target.value })}
        />

        <button type="submit" style={{ ...S.btn, ...S.btnPrimary }}>Save today's mood</button>
        {message && <span style={{ marginLeft: 12, color: "var(--success)", fontSize: 13 }}>{message}</span>}
      </form>

      <div style={S.card}>
        <h2 style={{ ...S.heading, fontSize: 20, marginBottom: 6 }}>Last 14 days</h2>
        <p style={{ ...S.muted, marginBottom: 16 }}>Entries: {entries.length} | Average intensity: {avgIntensity}/5</p>
        {loading ? (
          <p style={S.muted}>Loading…</p>
        ) : entries.length === 0 ? (
          <p style={S.muted}>No mood entries yet.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {entries.map((e) => {
              const mood = MOODS.find((m) => m.value === e.mood);
              return (
                <div key={e._id} style={{ background: "var(--surface2)", borderRadius: "var(--radius-sm)", padding: "10px 12px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                    <strong>{mood?.emoji} {mood?.label || e.mood}</strong>
                    <span style={S.muted}>{e.entryDate} • {e.intensity}/5</span>
                  </div>
                  {e.note && <p style={{ ...S.muted, marginTop: 6 }}>{e.note}</p>}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
