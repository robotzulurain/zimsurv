import React, { useEffect, useState } from "react";
import { api } from "../api";

export default function Trends() {
  const [rows, setRows] = useState([]);
  const [err, setErr] = useState("");

  useEffect(() => {
    api.trend()
      .then(d => Array.isArray(d) ? d : [])
      .then(setRows)
      .catch(e=>setErr(String(e.message||e)));
  }, []);

  const safeRows = Array.isArray(rows) ? rows : [];
  const totals = safeRows.map(r => Number(r?.total ?? 0));
  const max = Math.max(1, ...totals);

  return (
    <section>
      <h2 className="section-title">Resistance trends</h2>
      {err && <div className="error">{err}</div>}
      <div className="card" style={{padding:12}}>
        {safeRows.length===0 && <div className="small">No data</div>}
        {safeRows.map(r=>{
          const m = r?.month ?? '—';
          const total = Number(r?.total ?? 0);
          const resistant = Number(r?.resistant ?? 0);
          const pct = Number(r?.percent_R ?? (total? (resistant/total*100) : 0)).toFixed(2);
          const w = Math.round((total/max)*100);
          return (
            <div key={m} style={{margin:'8px 0'}}>
              <div className="small" style={{display:'flex', justifyContent:'space-between'}}>
                <span>{m}</span>
                <span>{resistant}/{total} • {pct}% R</span>
              </div>
              <div style={{height:10, background:'#eee', borderRadius:6}}>
                <div style={{height:'100%', width:`${w}%`, borderRadius:6}} />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
