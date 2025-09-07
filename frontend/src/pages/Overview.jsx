import React,{useEffect,useState} from "react";
import { fetchCountsSummary } from "../api";

export default function Overview(){
  const [data,setData]=useState(null);
  const [err,setErr]=useState("");

  useEffect(()=>{ fetchCountsSummary().then(setData).catch(e=>setErr(e.message)); },[]);

  return (
    <div>
      <div className="grid autofit">
        {[
          {k:"total_records",label:"Total results"},
          {k:"unique_patients",label:"Unique patients"},
          {k:"organisms",label:"Organisms"},
          {k:"antibiotics",label:"Antibiotics"},
        ].map(c=>(
          <div key={c.k} className="card">
            <div style={{fontSize:12,color:"#6b7280"}}>{c.label}</div>
            <div style={{fontSize:28,fontWeight:700}}>{data?.[c.k] ?? "—"}</div>
          </div>
        ))}
      </div>
      {err && <p style={{color:"crimson"}}>Error: {err}</p>}
    </div>
  );
}
