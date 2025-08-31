import React, { useEffect, useState } from "react";
import { api } from "../api";

export default function Resistance() {
  const [rows, setRows] = useState([]);
  const [err, setErr] = useState("");

  useEffect(() => {
    api.trend()
      .then(d => Array.isArray(d) ? d : [])
      .then(setRows)
      .catch(e=>setErr(String(e.message||e)));
  }, []);

  const safeRows = Array.isArray(rows) ? rows : [];

  return (
    <section>
      <h2 className="section-title">Resistance (monthly %R)</h2>
      {err && <div className="error">{err}</div>}
      <div className="card" style={{padding:12}}>
        {safeRows.length===0 ? (
          <div className="small">No data</div>
        ) : (
          <table className="table small">
            <thead><tr><th>Month</th><th>Total</th><th>Resistant</th><th>%R</th></tr></thead>
            <tbody>
              {safeRows.map((r,i)=>{
                const total = Number(r?.total ?? 0);
                const resistant = Number(r?.resistant ?? 0);
                const pct = Number(r?.percent_R ?? (total? (resistant/total*100) : 0)).toFixed(2);
                return (
                  <tr key={`${r?.month ?? i}`}>
                    <td>{r?.month ?? '—'}</td>
                    <td>{total}</td>
                    <td>{resistant}</td>
                    <td>{pct}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}
