import React, { useEffect, useState } from "react";
import { api } from "../api";

export default function Home() {
  const [counts, setCounts] = useState(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    api.counts().then(setCounts).catch(e=>setErr(String(e.message||e)));
  }, []);

  return (
    <section>
      <h2 className="section-title">Quick snapshot</h2>
      {err && <div className="error">{err}</div>}
      <div className="grid" style={{display:'grid', gap:12, gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))'}}>
        <Card title="Total records" value={counts?.total_results ?? '—'} />
        <Card title="Unique patients" value={counts?.unique_patients ?? '—'} />
        <Card title="Organisms" value={counts?.organisms_count ?? '—'} />
      </div>

      <div className="card" style={{marginTop:16}}>
        <h3 className="small">One Health context</h3>
        <p className="small">
          This dashboard integrates data from human, animal, and environmental sources to track antimicrobial resistance (AMR) patterns across Zimbabwe—supporting coordinated responses in healthcare, veterinary services, and water/sanitation.
        </p>
      </div>
    </section>
  );
}

function Card({title, value}) {
  return (
    <div className="card" style={{textAlign:'center', padding:'16px 12px'}}>
      <div className="small" style={{opacity:.75}}>{title}</div>
      <div style={{fontSize:28, fontWeight:700}}>{value}</div>
    </div>
  );
}
