export const S = {
  // Layout
  page: { maxWidth: 940, margin: "0 auto", padding: "38px 18px 56px" },
  pageWide: { maxWidth: 1160, margin: "0 auto", padding: "38px 18px 56px" },

  // Cards
  card: {
    background: "linear-gradient(180deg, var(--surface), var(--surface-solid))",
    backdropFilter: "blur(18px)",
    WebkitBackdropFilter: "blur(18px)",
    borderRadius: "var(--radius-lg)",
    border: "1px solid var(--border)",
    padding: "24px",
    boxShadow: "var(--shadow-sm)",
  },

  // Buttons
  btn: {
    display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
    padding: "11px 18px", borderRadius: "999px",
    fontWeight: 700, fontSize: 14, border: "none", cursor: "pointer",
    letterSpacing: "-0.01em",
    transition: "transform 0.15s ease, box-shadow 0.15s ease, background 0.15s ease, color 0.15s ease, border-color 0.15s ease, opacity 0.15s ease",
  },
  btnPrimary: {
    background: "linear-gradient(135deg, var(--accent), var(--accent-hover))", color: "#fff",
    boxShadow: "0 14px 30px rgba(99,102,241,0.28)",
  },
  btnSecondary: {
    background: "var(--surface-solid)", color: "var(--text)",
    border: "1px solid var(--border)",
    boxShadow: "var(--shadow-sm)",
  },
  btnDanger: {
    background: "linear-gradient(135deg, var(--danger), #be123c)", color: "#fff",
    boxShadow: "0 12px 26px rgba(225,29,72,0.22)",
  },
  btnSuccess: {
    background: "linear-gradient(135deg, var(--success), #047857)", color: "#fff",
    boxShadow: "0 12px 26px rgba(5,150,105,0.20)",
  },

  // Form inputs
  input: {
    width: "100%", padding: "12px 14px",
    borderRadius: "14px",
    border: "1.5px solid var(--border)",
    background: "var(--surface-solid)",
    fontSize: 14, color: "var(--text)",
    outline: "none", transition: "border 0.15s ease, box-shadow 0.15s ease, background 0.15s ease, transform 0.15s ease",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.35)",
  },
  label: { display: "block", fontWeight: 700, fontSize: 13, marginBottom: 7, color: "var(--text-muted)", letterSpacing: "-0.01em" },

  // Tags / badges
  badge: {
    display: "inline-flex", alignItems: "center", gap: 5,
    padding: "5px 12px", borderRadius: 999,
    fontSize: 12, fontWeight: 800,
    letterSpacing: "0.01em",
  },

  // Text
  heading: { fontFamily: "var(--font-display)", color: "var(--text)", lineHeight: 1.12, letterSpacing: "-0.035em" },
  muted: { color: "var(--text-muted)", fontSize: 13 },

  // Crisis banner
  crisisBanner: {
    background: "linear-gradient(135deg, var(--crisis-soft), var(--surface-solid))",
    border: "1px solid var(--crisis-border)",
    borderRadius: "var(--radius-lg)",
    padding: "18px 20px",
    marginBottom: 18,
    boxShadow: "var(--shadow-sm)",
  },
};

export const CATEGORY_COLORS = {
  stress: { bg: "var(--category-stress-bg)", text: "var(--category-stress-text)" },
  anxiety: { bg: "var(--category-anxiety-bg)", text: "var(--category-anxiety-text)" },
  depression: { bg: "var(--category-depression-bg)", text: "var(--category-depression-text)" },
  relationships: { bg: "var(--category-relationships-bg)", text: "var(--category-relationships-text)" },
  academic: { bg: "var(--category-academic-bg)", text: "var(--category-academic-text)" },
  general: { bg: "var(--category-general-bg)", text: "var(--category-general-text)" },
  "crisis-support": { bg: "var(--category-crisis-bg)", text: "var(--category-crisis-text)" },
};

export const CATEGORIES = [
  { value: "all", label: "All Topics" },
  { value: "stress", label: "Stress" },
  { value: "anxiety", label: "Anxiety" },
  { value: "depression", label: "Depression" },
  { value: "relationships", label: "Relationships" },
  { value: "academic", label: "Academic" },
  { value: "general", label: "General" },
  { value: "crisis-support", label: "Crisis Support" },
];
