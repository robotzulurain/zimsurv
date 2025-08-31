import React, { useEffect, useState } from "react";
import { api } from "../api";

export default function Resistance() {
  const [rows, setRows] = useState([]);
  const [err, setErr] = useState("");

  useEffect(() => {
    api.trend().then(setRows).catch(e=>setErr(String(e.message||e)));
  }, []);

  return (
    <section>
      <h2 className="section-title">Resistance (monthly %R)</h2>
      {err && <div className="error">{err}</div>}
      <div className="card" style={{padding:12}}>
        <table className="table small">
          <thead><tr><th>Month</th><th>Total</th><th>Resistant</th><th>%R</th></tr></thead>
          <tbody>
            {rows.map(r=>(
              <tr key={r.month}>
                <td>{r.month}</td>
                <td>{r.total}</td>
                <td>{r.resistant}</td>
                <td>{r.percent_R}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
