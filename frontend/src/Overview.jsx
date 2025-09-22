import React, {useEffect, useState} from "react";
import { api } from "./api";
import { demoRows } from "./utils/fallback";

export default function Overview(){
  const [total, setTotal] = useState(0);
  useEffect(()=>{
    api.counts().then(d=>setTotal(d.total_tests||0))
      .catch(()=> setTotal(demoRows.length));
  },[]);
  return (
    <main className="p-4">
      <h1>Overview</h1>
      <div style={{display:"grid", gridTemplateColumns:"repeat(3,minmax(0,1fr))", gap:16}}>
        <KPI label="Total tests" value={total} />
        <KPI label="Facilities reporting" value={[...new Set(demoRows.map(r=>r.facility))].length} />
        <KPI label="Organisms detected" value={[...new Set(demoRows.map(r=>r.organism))].length} />
      </div>
    </main>
  );
}

function KPI({label, value}){
  return (
    <div style={{padding:16, border:"1px solid #ddd", borderRadius:12, background:"#fff"}}>
      <div style={{fontSize:12, color:"#666"}}>{label}</div>
      <div style={{fontSize:28, fontWeight:700}}>{value}</div>
    </div>
  );
}
