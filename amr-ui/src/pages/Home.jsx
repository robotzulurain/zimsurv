import React, { useEffect, useState } from 'react'
import { apiFetch } from '../api'

export default function Home(){
  const [counts,setCounts]=useState(null)
  useEffect(()=>{ apiFetch('/api/summary/counts-summary/').then(setCounts).catch(console.error) },[])
  return (
    <div className="grid">
      <section className="card">
        <h2 className="section-title">Quick snapshot</h2>
        {!counts && <div className="small">Loading…</div>}
        {counts && (
          <div className="grid grid-3">
            <div className="card kpi"><div className="t">Total records</div><div className="v">{counts.total_results}</div></div>
            <div className="card kpi"><div className="t">Unique patients</div><div className="v">{counts.unique_patients}</div></div>
            <div className="card kpi"><div className="t">Organisms</div><div className="v">{counts.organisms_count}</div></div>
          </div>
        )}
      </section>
      <section className="card">
        <h2 className="section-title">One Health context</h2>
        <p className="small">This dashboard integrates data from human, animal, and environmental sources to track antimicrobial resistance (AMR) patterns across Zimbabwe—supporting coordinated responses in healthcare, veterinary services, and water/sanitation.</p>
      </section>
    </div>
  )
}
