import React, { useEffect, useState } from "react";
import { apiFetch } from "./api";

export default function DebugPanel() {
  const [rows, setRows] = useState([]);
  const push = (label, payload) => setRows(r => [...r, {label, ...payload}]);

  useEffect(() => {
    (async () => {
      const tests = [
        ["counts-summary", "/api/summary/counts-summary/"],
        ["resistance-time-trend", "/api/summary/resistance-time-trend/"],
        ["antibiogram (host=all)", "/api/summary/antibiogram/?host_type=all"],
        ["data-quality", "/api/summary/data-quality/"],
        ["lab-results", "/api/lab-results/?"],
      ];
      for (const [label, url] of tests) {
        try {
          const json = await apiFetch(url);
          push(label, { ok: true, json });
        } catch (e) {
          push(label, { ok: false, error: String(e) });
        }
      }
    })();
  }, []);

  return (
    <div style={{padding:16,fontFamily:"system-ui, sans-serif"}}>
      <h2>API Debug</h2>
      <p>Base: <code>{process.env.REACT_APP_API_BASE || "http://127.0.0.1:8000"}</code></p>
      {rows.map((r,i)=>(
        <details key={i} open style={{margin:"12px 0",border:"1px solid #e5e7eb",borderRadius:8,padding:12}}>
          <summary style={{cursor:"pointer"}}>
            {r.label} — {r.ok ? "ok: true" : "ok: false"}
          </summary>
          <pre style={{whiteSpace:"pre-wrap",marginTop:8}}>
            {r.ok ? JSON.stringify(r.json,null,2) : r.error}
          </pre>
        </details>
      ))}
    </div>
  );
}
