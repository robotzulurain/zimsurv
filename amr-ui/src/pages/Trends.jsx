import React, { useEffect, useState } from "react";
import { api } from "../api";

export default function Trends() {
  const [rows, setRows] = useState([]);
  const [err, setErr] = useState("");

  useEffect(() => {
    api.trend().then(setRows).catch(e=>setErr(String(e.message||e)));
  }, []);

  const max = Math.max(1, ...rows.map(r=>r.total||0));

  return (
    <section>
      <h2 className="section-title">Resistance trends</h2>
      {err && <div className="error">{err}</div>}
      <div className="card" style={{padding:12}}>
        {rows.length===0 && <div className="small">No data</div>}
        {rows.map(r=>{
          const w = Math.round((r.total/max)*100);
          return (
            <div key={r.month} style={{margin:'8px 0'}}>
              <div className="small" style={{display:'flex', justifyContent:'space-between'}}>
                <span>{r.month}</span>
                <span>{r.resistant}/{r.total} • {r.percent_R}% R</span>
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
