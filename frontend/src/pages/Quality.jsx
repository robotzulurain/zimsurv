import { useEffect, useState } from "react";
import { fetchDataQuality } from "../api";

export default function Quality(){
  const [dq,setDq]=useState(null);
  const [err,setErr]=useState("");
  useEffect(()=>{ fetchDataQuality().then(setDq).catch(e=>setErr(e.message)); },[]);
  return (
    <div style={{padding:16}}>
      <h2>Data Quality</h2>
      {err && <p style={{color:"crimson"}}>{err}</p>}
      {!dq ? <p>Loading...</p> :
        <div style={{display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))", gap:12}}>
          <Card title="Invalid AST" value={dq.invalid_ast}/>
          <Card title="Future dates" value={dq.future_dates}/>
          <Card title="Missing fields" value={dq.missing_fields}/>
          <Card title="Duplicate rows" value={dq.duplicate_rows}/>
        </div>
      }
    </div>
  );
}
function Card({title,value}){
  return (
    <div style={{border:"1px solid #eee", borderRadius:14, padding:16, background:"#fff", boxShadow:"0 1px 4px rgba(0,0,0,.05)"}}>
      <div style={{fontSize:12, color:"#666"}}>{title}</div>
      <div style={{fontSize:28, fontWeight:700}}>{value ?? 0}</div>
    </div>
  );
}
