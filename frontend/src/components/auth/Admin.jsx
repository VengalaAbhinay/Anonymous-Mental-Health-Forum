import { useEffect, useState } from "react";
import api from "../../api/axiosInstance";
import { S } from "../../styles/common";
import BackToForum from "../shared/BackToForum";

const TABS = ["users", "applications", "reports", "crisis", "flagged"];

export default function Admin() {
  const [stats, setStats] = useState(null);
  const [tab, setTab] = useState("users");
  const [users, setUsers] = useState([]);
  const [reports, setReports] = useState([]);
  const [reportFilter, setReportFilter] = useState("pending");
  const [crisis, setCrisis] = useState([]);
  const [flagged, setFlagged] = useState([]);
  const [applications, setApplications] = useState([]);

  const loadStats = () => api.get("/admin-api/stats").then(({ data }) => setStats(data));

  useEffect(() => { loadStats(); }, []);

  useEffect(() => {
    if (tab === "users") api.get("/admin-api/users").then(({ data }) => setUsers(data.users));
    if (tab === "applications") api.get("/counselor-api/applications?status=pending").then(({ data }) => setApplications(data.applications));
    if (tab === "reports") api.get(`/admin-api/reports?status=${reportFilter}`).then(({ data }) => setReports(data.reports));
    if (tab === "crisis") api.get("/admin-api/crisis").then(({ data }) => setCrisis(data.posts));
    if (tab === "flagged") api.get("/admin-api/reports?status=pending").then(({ data }) => setFlagged(data.reports));
  }, [tab, reportFilter]);

  const toggleUser = async (id) => {
    const { data } = await api.patch(`/admin-api/users/${id}/toggle`);
    setUsers((u) => u.map((x) => x._id === id ? { ...x, isActive: data.isActive } : x));
    loadStats();
  };

  const promoteToRole = async (id, role) => {
    await api.patch(`/admin-api/users/${id}/role`, { role });
    setUsers((u) => u.map((x) => x._id === id ? { ...x, role } : x));
  };

  const reviewReport = async (id, action) => {
    await api.patch(`/admin-api/reports/${id}/review`, { action });
    setReports((r) => r.filter((x) => x._id !== id));
    loadStats();
  };

  const deletePost = async (id) => {
    await api.delete(`/admin-api/posts/${id}`);
    setCrisis((c) => c.filter((p) => p._id !== id));
    loadStats();
  };

  const reviewApplication = async (id, status) => {
    await api.patch(`/counselor-api/applications/${id}`, { status });
    setApplications((apps) => apps.filter((a) => a._id !== id));
    loadStats();
  };

  return (
    <div style={S.pageWide}>
      <BackToForum />
      <h1 style={{ ...S.heading, fontSize: 28, marginBottom: 20 }}>Admin Panel</h1>

      {/* Stats */}
      {stats && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))", gap: 12, marginBottom: 28 }}>
          {[
            { label: "Total Users", value: stats.totalUsers, color: "var(--accent)" },
            { label: "Total Posts", value: stats.totalPosts, color: "var(--success)" },
            { label: "Pending Reports", value: stats.pendingReports, color: "var(--warning)" },
            { label: "Crisis Posts", value: stats.crisisPosts, color: "var(--danger)" },
            { label: "Counselor Apps", value: stats.pendingCounselorApplications || 0, color: "var(--counselor)" },
            { label: "Mood Entries", value: stats.moodEntries || 0, color: "var(--accent)" },
          ].map((s) => (
            <div key={s.label} style={{ ...S.card, textAlign: "center" }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: s.color }}>{s.value}</div>
              <div style={S.muted}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 20, background: "var(--surface2)", borderRadius: "var(--radius-sm)", padding: 4, width: "fit-content", flexWrap: "wrap" }}>
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: "7px 18px", borderRadius: "var(--radius-sm)", border: "none",
            background: tab === t ? "var(--surface)" : "transparent",
            fontWeight: tab === t ? 600 : 400, fontSize: 13, cursor: "pointer",
            boxShadow: tab === t ? "var(--shadow-sm)" : "none",
            textTransform: "capitalize",
          }}>
            {t === "reports" ? `Reports${stats?.pendingReports > 0 ? ` (${stats.pendingReports})` : ""}` : t === "applications" ? `Counselor Apps${stats?.pendingCounselorApplications > 0 ? ` (${stats.pendingCounselorApplications})` : ""}` : t === "crisis" ? `🚨 Crisis` : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* ── USERS ── */}
      {tab === "users" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {users.map((u) => (
            <div key={u._id} style={{ ...S.card, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 500 }}>{u.alias || "Anonymous"}</div>
                <div style={S.muted}>{u.email}</div>
              </div>
              <span style={{ ...S.badge, background: u.role === "admin" ? "var(--accent-soft)" : u.role === "counselor" ? "var(--counselor-soft)" : "var(--surface2)", color: u.role === "admin" ? "var(--accent)" : u.role === "counselor" ? "var(--counselor)" : "var(--text-muted)", fontSize: 11 }}>
                {u.role}
              </span>
              <span style={{ ...S.badge, background: u.isActive ? "var(--counselor-soft)" : "var(--danger-soft)", color: u.isActive ? "var(--counselor)" : "var(--danger)", fontSize: 11 }}>
                {u.isActive ? "active" : "blocked"}
              </span>
              <div style={{ display: "flex", gap: 6 }}>
                {u.role === "user" && (
                  <button onClick={() => promoteToRole(u._id, "counselor")}
                    style={{ ...S.btn, ...S.btnSuccess, fontSize: 12, padding: "5px 10px" }}>
                    Make counselor
                  </button>
                )}
                {u.role !== "admin" && (
                  <button onClick={() => toggleUser(u._id)}
                    style={{ ...S.btn, background: u.isActive ? "var(--danger-soft)" : "var(--counselor-soft)", color: u.isActive ? "var(--danger)" : "var(--counselor)", fontSize: 12, padding: "5px 10px", border: "none" }}>
                    {u.isActive ? "Block" : "Unblock"}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── COUNSELOR APPLICATIONS ── */}
      {tab === "applications" && (
        <>
          {applications.length === 0 ? (
            <div style={{ textAlign: "center", padding: 48, color: "var(--text-muted)" }}>No pending counselor applications.</div>
          ) : applications.map((a) => (
            <div key={a._id} style={{ ...S.card, marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", marginBottom: 8 }}>
                <div>
                  <h3 style={{ fontSize: 16, margin: 0 }}>{a.fullName}</h3>
                  <p style={{ ...S.muted, margin: "4px 0 0" }}>{a.user?.email} • {a.user?.alias}</p>
                </div>
                <span style={{ ...S.badge, background: "var(--warning-soft)", color: "var(--warning)", height: "fit-content" }}>pending</span>
              </div>
              <p style={{ margin: "6px 0", fontSize: 14 }}><strong>Specialization:</strong> {a.specialization}</p>
              <p style={{ margin: "6px 0", fontSize: 14 }}><strong>Qualification:</strong> {a.qualification}</p>
              <p style={{ margin: "6px 0", fontSize: 14 }}><strong>Experience:</strong> {a.experience}</p>
              {a.availability && <p style={{ margin: "6px 0", fontSize: 14 }}><strong>Availability:</strong> {a.availability}</p>}
              <p style={{ ...S.muted, lineHeight: 1.5, marginBottom: 12 }}>{a.bio}</p>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => reviewApplication(a._id, "approved")} style={{ ...S.btn, ...S.btnSuccess, fontSize: 12, padding: "5px 12px" }}>Approve</button>
                <button onClick={() => reviewApplication(a._id, "rejected")} style={{ ...S.btn, ...S.btnDanger, fontSize: 12, padding: "5px 12px" }}>Reject</button>
              </div>
            </div>
          ))}
        </>
      )}

      {/* ── REPORTS ── */}
      {tab === "reports" && (
        <>
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            {["pending", "reviewed", "dismissed"].map((s) => (
              <button key={s} onClick={() => setReportFilter(s)}
                style={{ ...S.btn, ...(reportFilter === s ? S.btnPrimary : S.btnSecondary), fontSize: 13, padding: "6px 14px", textTransform: "capitalize" }}>
                {s}
              </button>
            ))}
          </div>
          {reports.length === 0 ? (
            <div style={{ textAlign: "center", padding: 48, color: "var(--text-muted)" }}>No {reportFilter} reports.</div>
          ) : reports.map((r) => (
            <div key={r._id} style={{ ...S.card, marginBottom: 10 }}>
              <div style={{ display: "flex", gap: 8, marginBottom: 8, flexWrap: "wrap", alignItems: "center" }}>
                <span style={{ ...S.badge, background: "var(--danger-soft)", color: "var(--danger)", fontSize: 11 }}>
                  {r.targetType}
                </span>
                <span style={{ ...S.badge, background: "var(--warning-soft)", color: "var(--warning)", fontSize: 11 }}>
                  {r.reason}
                </span>
                <span style={{ ...S.muted, marginLeft: "auto" }}>
                  {new Date(r.createdAt).toLocaleDateString("en-IN")}
                </span>
              </div>
              {r.contentSnapshot && (
                <p style={{ ...S.muted, fontSize: 13, marginBottom: 10, background: "var(--surface2)", borderRadius: "var(--radius-sm)", padding: "8px 12px" }}>
                  {r.contentSnapshot}
                </p>
              )}
              {r.details && <p style={{ fontSize: 13, marginBottom: 10, color: "var(--text)" }}>"{r.details}"</p>}
              {r.status === "pending" && (
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => reviewReport(r._id, "remove_content")}
                    style={{ ...S.btn, ...S.btnDanger, fontSize: 12, padding: "5px 12px" }}>
                    Remove content
                  </button>
                  <button onClick={() => reviewReport(r._id, "dismiss")}
                    style={{ ...S.btn, ...S.btnSecondary, fontSize: 12, padding: "5px 12px" }}>
                    Dismiss
                  </button>
                </div>
              )}
              {r.reviewNote && <p style={{ ...S.muted, marginTop: 8, fontSize: 12 }}>Note: {r.reviewNote}</p>}
            </div>
          ))}
        </>
      )}

      {/* ── CRISIS ── */}
      {tab === "crisis" && (
        <>
          <div style={{ background: "var(--crisis-soft)", border: "1px solid var(--crisis-border)", borderRadius: "var(--radius)", padding: "12px 16px", marginBottom: 16, fontSize: 13, color: "var(--crisis)" }}>
            🚨 These posts triggered crisis keyword detection. Review carefully.
          </div>
          {crisis.length === 0 ? (
            <div style={{ textAlign: "center", padding: 48, color: "var(--text-muted)" }}>No crisis posts.</div>
          ) : crisis.map((p) => (
            <div key={p._id} style={{ ...S.card, marginBottom: 10, borderLeft: "3px solid var(--crisis)" }}>
              <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>{p.title}</h3>
              <p style={{ ...S.muted, fontSize: 13, marginBottom: 10 }}>{p.content.slice(0, 200)}…</p>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span style={{ ...S.badge, background: "var(--crisis-soft)", color: "var(--crisis)", fontSize: 11 }}>
                  {p.sentiment?.category || "crisis"}
                </span>
                <span style={S.muted}>{new Date(p.createdAt).toLocaleDateString("en-IN")}</span>
                <button onClick={() => deletePost(p._id)}
                  style={{ ...S.btn, ...S.btnDanger, fontSize: 12, padding: "5px 12px", marginLeft: "auto" }}>
                  Remove post
                </button>
              </div>
            </div>
          ))}
        </>
      )}

      {/* ── FLAGGED (same as reports pending, quick view) ── */}
      {tab === "flagged" && (
        <>
          <p style={{ ...S.muted, marginBottom: 16 }}>All pending reports — quick action view.</p>
          {flagged.length === 0 ? (
            <div style={{ textAlign: "center", padding: 48, color: "var(--text-muted)" }}>No pending reports.</div>
          ) : flagged.map((r) => (
            <div key={r._id} style={{ ...S.card, marginBottom: 10 }}>
              <div style={{ fontWeight: 500, marginBottom: 4 }}>{r.reason} — {r.targetType}</div>
              <p style={{ ...S.muted, fontSize: 13, marginBottom: 10 }}>{r.contentSnapshot || "(no snapshot)"}</p>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => { reviewReport(r._id, "remove_content"); setFlagged((f) => f.filter((x) => x._id !== r._id)); }}
                  style={{ ...S.btn, ...S.btnDanger, fontSize: 12, padding: "5px 12px" }}>
                  Remove & close
                </button>
                <button onClick={() => { reviewReport(r._id, "dismiss"); setFlagged((f) => f.filter((x) => x._id !== r._id)); }}
                  style={{ ...S.btn, ...S.btnSecondary, fontSize: 12, padding: "5px 12px" }}>
                  Dismiss
                </button>
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
