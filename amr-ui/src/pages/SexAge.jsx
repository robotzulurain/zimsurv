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

  useEffect(()=>{ api.lab().then(d=>setLabs(d?.results||[])).catch(e=>setErr(String(e.message||e))); },[]);

  const table = useMemo(()=>{
    const init = BANDS.map(b=>({band:b.label, M:0, F:0, U:0, Total:0}));
    const findBand = (age)=>{
      const a = Number(age||0);
      return BANDS.find(b=>a>=b.min && a<=(b.max ?? a))?.label || '0-4';
    };
    const rows = Object.fromEntries(init.map(r=>[r.band, r]));
    for(const r of labs){
      const band = findBand(r.age);
      const sex = (r.sex||'U').toUpperCase().startsWith('M')?'M':(r.sex||'U').toUpperCase().startsWith('F')?'F':'U';
      rows[band][sex] += 1;
      rows[band].Total += 1;
    }
    return BANDS.map(b=>rows[b.label]);
  },[labs]);

  return (
    <section>
      <h2 className="section-title">Sex & Age</h2>
      {err && <div className="error">{err}</div>}
      <div className="card">
        <table className="table small">
          <thead><tr><th>Age band</th><th>Male</th><th>Female</th><th>Unknown</th><th>Total</th></tr></thead>
          <tbody>
            {table.map(r=>(
              <tr key={r.band}>
                <td>{r.band}</td><td>{r.M}</td><td>{r.F}</td><td>{r.U}</td><td>{r.Total}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
