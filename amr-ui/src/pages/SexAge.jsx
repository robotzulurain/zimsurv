import React, { useEffect, useMemo, useState } from "react";
import { api } from "../api";

const BANDS = [
  {label:'0-4',  min:0, max:4},
  {label:'5-14', min:5, max:14},
  {label:'15-24',min:15, max:24},
  {label:'25-34',min:25, max:34},
  {label:'35-44',min:35, max:44},
  {label:'45-54',min:45, max:54},
  {label:'55-64',min:55, max:64},
  {label:'65+',  min:65, max:200}
];

export default function SexAge(){
  const [labs,setLabs] = useState([]);
  const [err,setErr] = useState("");

  useEffect(()=>{
    api.lab()
      .then(d => Array.isArray(d) ? d : (Array.isArray(d?.results)? d.results : []))
      .then(setLabs)
      .catch(e=>setErr(String(e.message||e)));
  },[]);

  const table = useMemo(()=>{
    const init = BANDS.map(b=>({band:b.label, M:0, F:0, U:0, Total:0}));
    const rows = Object.fromEntries(init.map(r=>[r.band, r]));
    const findBand = (age)=>{
      const a = Number(age ?? 0);
      const band = BANDS.find(b=>a>=b.min && a<=(b.max ?? a));
      return band?.label ?? '0-4';
    };
    for(const r of (Array.isArray(labs)? labs : [])){
      const band = findBand(r?.age);
      const s = String(r?.sex||'U').trim().toUpperCase();
      const sex = s.startsWith('M')?'M':s.startsWith('F')?'F':'U';
      rows[band][sex] += 1;
      rows[band].Total += 1;
    }
    return BANDS.map(b=>rows[b.label]);
  },[labs]);

  const maxTotal = Math.max(1, ...table.map(r=>r.Total||0));

  return (
    <section>
      <h2 className="section-title">Sex & Age</h2>
      {err && <div className="error">{err}</div>}
      <div className="card">
        <table className="table small">
          <thead><tr><th>Age band</th><th>Male</th><th>Female</th><th>Unknown</th><th>Total</th></tr></thead>
          <tbody>
            {table.map(r=>{
              const w = Math.round((Number(r.Total||0)/maxTotal)*100);
              return (
                <tr key={r.band}>
                  <td style={{whiteSpace:'nowrap'}}>{r.band}</td>
                  <td>{r.M}</td>
                  <td>{r.F}</td>
                  <td>{r.U}</td>
                  <td style={{minWidth:130}}>
                    <div className="small" style={{display:'flex', gap:8, alignItems:'center'}}>
                      <span>{r.Total}</span>
                      <div style={{flex:1, height:8, background:'#eee', borderRadius:6}}>
                        <div style={{height:'100%', width:`${w}%`, borderRadius:6}} />
                      </div>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {table.every(r=>r.Total===0) && <div className="small" style={{marginTop:8}}>No records yet.</div>}
      </div>
    </section>
  );
}
