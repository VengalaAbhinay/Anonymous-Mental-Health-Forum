import { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";

const getInitialTheme = () => {
  if (typeof window === "undefined") return "light";
  const saved = localStorage.getItem("mindspace-theme");
  if (saved === "dark" || saved === "light") return saved;
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
};

export default function Header() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const loc = useLocation();
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("mindspace-theme", theme);
  }, [theme]);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const toggleTheme = () => setTheme((current) => (current === "dark" ? "light" : "dark"));

  const navLink = (to) => ({
    color: loc.pathname === to ? "var(--accent)" : "var(--text-muted)",
    fontWeight: loc.pathname === to ? 800 : 650,
    textDecoration: "none",
    fontSize: 14,
    transition: "color 0.15s ease, background 0.15s ease, transform 0.15s ease",
    padding: "8px 12px",
    borderRadius: 999,
    background: loc.pathname === to ? "var(--accent-soft)" : "transparent",
    border: loc.pathname === to ? "1px solid var(--border)" : "1px solid transparent",
    whiteSpace: "nowrap",
  });

  const softButton = {
    background: "var(--surface-solid)",
    border: "1px solid var(--border)",
    borderRadius: 999,
    padding: "8px 13px",
    fontSize: 13,
    color: "var(--text-muted)",
    cursor: "pointer",
    fontWeight: 750,
    boxShadow: "var(--shadow-sm)",
    transition: "background 0.15s ease, color 0.15s ease, border-color 0.15s ease, transform 0.15s ease",
  };

  return (
    <header style={{
      background: "color-mix(in srgb, var(--surface) 88%, transparent)",
      backdropFilter: "blur(22px)",
      WebkitBackdropFilter: "blur(22px)",
      borderBottom: "1px solid var(--border)",
      position: "sticky", top: 0, zIndex: 100,
      boxShadow: "0 10px 30px rgba(15,23,42,0.07)",
    }}>
      <div style={{
        maxWidth: 1160, margin: "0 auto", padding: "0 18px",
        minHeight: 68, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 18,
      }}>
        <Link to="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 11, flexShrink: 0 }}>
          <span style={{
            width: 38, height: 38, borderRadius: 15, display: "grid", placeItems: "center",
            background: "linear-gradient(135deg, var(--counselor-soft), var(--accent-soft))",
            border: "1px solid var(--border)", fontSize: 21,
            boxShadow: "var(--shadow-sm)",
          }}>🌿</span>
          <span style={{ display: "grid", lineHeight: 1.05 }}>
            <span style={{ fontFamily: "var(--font-display)", fontSize: 23, color: "var(--text)", letterSpacing: "-0.035em" }}>
              MindSpace
            </span>
            <span style={{ color: "var(--text-light)", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>
              Student support
            </span>
          </span>
        </Link>

        {user && (
          <nav style={{ display: "flex", gap: 6, alignItems: "center", justifyContent: "center", flex: 1, flexWrap: "wrap" }}>
            <Link to="/" style={navLink("/")}>Forum</Link>
            <Link to="/counselors" style={navLink("/counselors")}>Counselors</Link>
            <Link to="/resources" style={navLink("/resources")}>Resources</Link>
            {user.role === "user" && <Link to="/mood" style={navLink("/mood")}>Mood</Link>}
            {user.role === "user" && <Link to="/counselor-apply" style={navLink("/counselor-apply")}>Apply Counselor</Link>}
            {user.role === "counselor" && <Link to="/chat-queue" style={navLink("/chat-queue")}>Chat Queue</Link>}
            {user.role === "admin" && <Link to="/admin" style={navLink("/admin")}>Admin</Link>}
          </nav>
        )}

        <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
          <button
            type="button"
            onClick={toggleTheme}
            title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            style={{ ...softButton, width: 42, padding: "8px 0", color: "var(--text)" }}
          >
            {theme === "dark" ? "☀️" : "🌙"}
          </button>

          {user ? (
            <>
              <Link to="/profile" style={{ textDecoration: "none" }}>
                <div style={{
                  background: "linear-gradient(135deg, var(--accent-soft), var(--surface-solid))", color: "var(--accent)",
                  border: "1px solid var(--border)",
                  borderRadius: 999, padding: "8px 15px", fontSize: 13, fontWeight: 800,
                  boxShadow: "var(--shadow-sm)",
                }}>
                  {user.alias || "Anonymous"}
                </div>
              </Link>
              <button onClick={handleLogout} style={softButton}>Sign out</button>
            </>
          ) : (
            <>
              <Link to="/login" style={{ ...softButton, textDecoration: "none" }}>Sign in</Link>
              <Link to="/register" style={{
                background: "linear-gradient(135deg, var(--accent), var(--accent-hover))", color: "#fff",
                borderRadius: 999, padding: "9px 17px", fontSize: 14, fontWeight: 800,
                textDecoration: "none", boxShadow: "0 14px 30px rgba(99,102,241,0.28)",
              }}>
                Join
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
