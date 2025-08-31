import React, { useEffect, useState } from "react";
import { api } from "../api";

export default function Debug() {
  const [counts, setCounts] = useState(null);
  const [labs, setLabs] = useState(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const c = await api.counts();
        setCounts(c);
      } catch (e) {
        setErr(String(e?.message || e));
      }
      try {
        const l = await api.lab();
        setLabs(Array.isArray(l?.results) ? l.results.slice(0, 5) : []);
      } catch (e) {
        setErr(prev => prev || String(e?.message || e));
      }
    })();
  }, []);

  const BASE = import.meta.env.VITE_API_BASE;
  const TOKEN_SET = Boolean(import.meta.env.VITE_API_TOKEN);

  return (
    <section className="card">
      <h2 className="section-title">Debug</h2>
      <div className="small">BASE: {BASE} • TOKEN set: {String(TOKEN_SET)}</div>
      {err && <div className="small" style={{color:"crimson"}}>Error: {err}</div>}
      <pre className="small">
{JSON.stringify({ counts, labs }, null, 2)}
      </pre>
    </section>
  );
}
