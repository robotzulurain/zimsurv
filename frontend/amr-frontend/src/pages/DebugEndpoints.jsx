import React, { useEffect, useState } from "react";
import { apiFetch } from "../api";

function Box({title, children}) {
  return (
    <div className="card" style={{minWidth:320}}>
      <div className="h2" style={{fontSize:16, margin:0, marginBottom:8}}>{title}</div>
      {children}
    </div>
  );
}

export default function DebugEndpoints(){
  const [state, setState] = useState({});

  useEffect(()=>{
    let dead=false;
    async function run(){
      const results = {};
      const endpoints = {
        "compare-resistance": "/api/summary/compare-resistance/",
        "antibiogram": "/api/summary/antibiogram/",
        "data-quality": "/api/summary/data-quality/",
        "lab-results": "/api/lab-results/",
        "facilities-geo": "/api/summary/facilities-geo/"
      };
      for (const [name, url] of Object.entries(endpoints)) {
        try {
          const j = await apiFetch(url);
          results[name] = { ok:true, data: j };
        } catch (e) {
          results[name] = { ok:false, error: String(e), status: e.status, url: e.url, body: e.body };
        }
      }
      if(!dead) setState(results);
    }
    run();
    return ()=>{dead=true};
  },[]);

  const pre = {background:"#0b1220", color:"#cbd5e1", padding:10, borderRadius:8, overflowX:"auto", maxHeight:400};

  return (
    <div className="page">
      <h2 className="h2">Debug Endpoints</h2>
      <p>This calls the same API routes used by Resistance / Heatmap / Data Quality / Lab Results and shows raw outputs or exact errors.</p>
      <div style={{display:"grid", gap:12, gridTemplateColumns:"repeat(auto-fit,minmax(320px,1fr))"}}>
        {Object.entries(state).map(([k,v])=>(
          <Box key={k} title={k}>
            {!v ? "Loading…" :
             v.ok ? <pre style={pre}>{JSON.stringify(v.data, null, 2)}</pre> :
             <div>
               <div style={{color:"#fecaca"}}>Failed: {v.error}</div>
               {v.status && <div>Status: {v.status}</div>}
               {v.url && <div>URL: {v.url}</div>}
               {v.body && <pre style={pre}>{JSON.stringify(v.body, null, 2)}</pre>}
             </div>
            }
          </Box>
        ))}
      </div>
    </div>
  );
}
