import React, { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../api";
import HostFilter from "../components/HostFilter";

function Bar({ pctR, label }){
  const p = Math.max(0, Math.min(100, pctR ?? 0));
  return (
    <div style={{margin:'6px 0'}}>
      <div style={{display:'flex', justifyContent:'space-between', fontSize:12, color:'#374151'}}>
        <span>{label}</span><span>{p.toFixed ? p.toFixed(0) : p}% R</span>
      </div>
      <div style={{height:10, background:'#e5e7eb', borderRadius:999}}>
        <div style={{width:`${p}%`, height:'100%', borderRadius:999,
          background: p>=75 ? '#ef4444' : p>=50 ? '#f59e0b' : '#22c55e'}} />
      </div>
    </div>
  );
}

export default function Compare(){
  const [host, setHost] = useState("all");
  const [rows, setRows] = useState([]);
  const [err, setErr] = useState(null);
  const [loading, setLoading] = useState(false);

  async function load(){
    setLoading(true); setErr(null);
    try{
      const p = new URLSearchParams({limit:'1000'});
      if (host && host!=='all') p.set('host_type', host);
      const j = await apiFetch(`/api/lab-results/?${p}`);
      setRows(Array.isArray(j?.results) ? j.results : []);
    }catch(e){ setErr(e.message||String(e)); }
    finally{ setLoading(false); }
  }

  useEffect(()=>{ load(); /* eslint-disable-next-line */},[]);

  const bySex = useMemo(()=>{
    const g = { M:{S:0,I:0,R:0}, F:{S:0,I:0,R:0}, U:{S:0,I:0,R:0} };
    for (const r of rows){
      const k = (r.sex||'U').toUpperCase().startsWith('M') ? 'M'
            : (r.sex||'U').toUpperCase().startsWith('F') ? 'F' : 'U';
      const ast = (r.ast_result||'').toUpperCase();
      if (ast==='S' || ast==='I' || ast==='R') g[k][ast] += 1;
    }
    const out = [];
    for (const key of ['M','F','U']){
      const t = g[key].S + g[key].I + g[key].R;
      out.push({ label: key==='M'?'Male':key==='F'?'Female':'Unknown',
        pctR: t? (g[key].R*100/t) : null, n: t });
    }
    return out;
  },[rows]);

  const byAge = useMemo(()=>{
    const bands = [[0,4],[5,14],[15,24],[25,44],[45,64],[65,120],[121,999]];
    const g = bands.map(()=>({S:0,I:0,R:0}));
    for (const r of rows){
      const age = Number.isFinite(+r.age) ? +r.age : null;
      const idx = age==null ? bands.length-1 : bands.findIndex(([a,b])=>age>=a && age<=b);
      const i = idx===-1 ? bands.length-1 : idx;
      const ast = (r.ast_result||'').toUpperCase();
      if (ast==='S' || ast==='I' || ast==='R') g[i][ast]+=1;
    }
    return g.map((c, i)=>{
      const t = c.S+c.I+c.R;
      const [a,b] = bands[i];
      const label = i===bands.length-1 ? 'Unknown/Invalid' : `${a}-${b}`;
      return { label, pctR: t? (c.R*100/t) : null, n:t };
    });
  },[rows]);

  return (
    <>
      <h1 className="pageTitle">Sex & Age</h1>
      <div className="card">
        <div className="filters">
          <HostFilter value={host} onChange={v=>{ setHost(v); setTimeout(load,0); }} />
          <button className="primary" onClick={load}>Refresh</button>
        </div>
      </div>

      {err && <div className="card" style={{borderColor:"#fecaca", background:"#fef2f2"}}>{err}</div>}
      {loading && <div className="card">Loading…</div>}

      <div className="grid cols-3">
        <div className="card">
          <div className="cardTitle">Resistance by sex (%R)</div>
          {bySex.map(s=><Bar key={s.label} pctR={s.pctR??0} label={`${s.label} (N=${s.n})`} />)}
        </div>
        <div className="card">
          <div className="cardTitle">Resistance by age band (%R)</div>
          {byAge.map(a=><Bar key={a.label} pctR={a.pctR??0} label={`${a.label} (N=${a.n})`} />)}
        </div>
        <div className="card">
          <div className="cardTitle">Legend</div>
          <div className="legend"><span className="pill ok">Low %R</span><span className="pill mid">Medium %R</span><span className="pill bad">High %R</span></div>
          <div className="help" style={{marginTop:8}}>Bars show % of isolates that are resistant (R) in each group.</div>
        </div>
      </div>
    </>
  );
}
