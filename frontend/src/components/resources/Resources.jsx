import { useEffect, useState } from "react";
import api from "../../api/axiosInstance";
import { S } from "../../styles/common";
import BackToForum from "../shared/BackToForum";

export default function Resources() {
  const [resources, setResources] = useState([]);
  const [crisisResources, setCrisisResources] = useState([]);

  useEffect(() => {
    api.get("/resource-api/").then(({ data }) => {
      setResources(data.resources || []);
      setCrisisResources(data.crisisResources || []);
    });
  }, []);

  return (
    <div style={S.pageWide}>
      <BackToForum />
      <h1 style={{ ...S.heading, fontSize: 30, marginBottom: 8 }}>Mental Health Resources</h1>
      <p style={{ ...S.muted, marginBottom: 24 }}>Short guides, grounding exercises, and crisis contacts for students.</p>

      <div style={{ ...S.crisisBanner, marginBottom: 24 }}>
        <h2 style={{ margin: "0 0 8px", color: "var(--crisis)", fontSize: 18 }}>Need immediate support?</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))", gap: 10 }}>
          {crisisResources.map((r) => (
            <div key={r.name} style={{ background: "var(--surface)", borderRadius: "var(--radius-sm)", padding: 10 }}>
              <strong>{r.name}</strong>
              <div style={{ fontSize: 13, color: "var(--text-muted)" }}>{r.phone}</div>
              {r.url && <a href={r.url} target="_blank" rel="noreferrer" style={{ fontSize: 13 }}>Open website</a>}
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
        {resources.map((r) => (
          <article key={r.id} style={S.card}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginBottom: 8 }}>
              <span style={{ ...S.badge, background: "var(--accent-soft)", color: "var(--accent)" }}>{r.category}</span>
              <span style={S.muted}>{r.readTime}</span>
            </div>
            <h2 style={{ ...S.heading, fontSize: 19, marginBottom: 8 }}>{r.title}</h2>
            <p style={{ ...S.muted, lineHeight: 1.5, marginBottom: 12 }}>{r.summary}</p>
            <ul style={{ margin: 0, paddingLeft: 18, color: "var(--text)", fontSize: 14, lineHeight: 1.7 }}>
              {r.tips.map((tip) => <li key={tip}>{tip}</li>)}
            </ul>
          </article>
        ))}
      </div>
    </div>
  );
}
