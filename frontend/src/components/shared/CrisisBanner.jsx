export default function CrisisBanner({ resources = [] }) {
  return (
    <div style={{
      background: "var(--crisis-soft)",
      border: "1.5px solid var(--crisis-border)",
      borderRadius: "var(--radius)",
      padding: "16px 20px",
      marginBottom: 20,
    }}>
      <p style={{ fontWeight: 600, color: "var(--crisis)", marginBottom: 8, fontSize: 15 }}>
        🆘 We noticed your message may express distress. You are not alone.
      </p>
      <p style={{ color: "var(--crisis)", fontSize: 13, marginBottom: 12 }}>
        If you or someone you know is in crisis, please reach out to a helpline:
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {resources.map((r) => (
          <div key={r.phone} style={{ fontSize: 13, color: "var(--crisis)" }}>
            <strong>{r.name}</strong> — 📞 {r.phone}
            {r.url && (
              <a href={r.url} target="_blank" rel="noreferrer" style={{ marginLeft: 8, color: "var(--crisis)" }}>
                Visit →
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
