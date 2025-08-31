import React, { useEffect, useState } from "react";
import { apiFetch } from "../api";

export default function Heatmap(){
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(()=>{
    let dead = false;
    (async ()=>{
      try{
        const j = await apiFetch("/api/summary/antibiogram/?host_type=all");
        if(!dead) setData(j);
      }catch(e){ if(!dead) setError(e.message); }
    })();
    return ()=>{ dead=true; };
  },[]);

  if(error) return <div style={{color:"#b91c1c"}}>Error: {error}</div>;
  if(!data) return <div>Loading…</div>;
  const { organisms=[], antibiotics=[], matrix=[] } = data;

  return (
    <div>
      <h2>Antibiogram Heatmap (%R)</h2>
      <div style={{overflowX:"auto"}}>
        <table style={{borderCollapse:"collapse", minWidth:600}}>
          <thead>
            <tr>
              <th style={th}></th>
              {antibiotics.map(a => <th key={a} style={th}>{a}</th>)}
            </tr>
          </thead>
          <tbody>
            {organisms.map((org, rIdx)=>(
              <tr key={org}>
                <th style={rowHead}>{org}</th>
                {antibiotics.map((_, cIdx)=>{
                  const cell = (matrix[rIdx]||[])[cIdx] || {};
                  const pct = typeof cell.pctR === "number" ? cell.pctR : null;
                  const bg = pct==null ? "#f1f5f9"
                    : `hsl(${Math.round(120 - (pct*1.2))}, 70%, 60%)`; // green->red
                  return (
                    <td key={cIdx} title={`S:${cell.S||0} I:${cell.I||0} R:${cell.R||0} N:${cell.N||0}`}
                        style={{...td, textAlign:"center", background:bg}}>
                      {pct==null ? "—" : `${pct.toFixed(0)}%`}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const th = { padding:"8px 10px", borderBottom:"1px solid #e5e7eb", textAlign:"center", fontWeight:700, position:"sticky", top:0, background:"#fff" };
const rowHead = { padding:"8px 10px", borderRight:"1px solid #e5e7eb", textAlign:"left", fontWeight:700, position:"sticky", left:0, background:"#fff" };
const td = { padding:"8px 10px", border:"1px solid #e5e7eb" };
