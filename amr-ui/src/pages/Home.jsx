import React, { useEffect, useState } from 'react'
import { apiFetch } from '../api'

export default function Home(){
  const [snap,setSnap]=useState(null)
  const [err,setErr]=useState(null)

  useEffect(()=>{
    apiFetch('/api/summary/counts-summary/')
      .then(setSnap).catch(e=>setErr(String(e)))
  },[])

  return (
    <div className="container">
      <div className="grid cols-3">
        <div className="card kpi">
          <div>
            <div className="small">Total records</div>
            <div className="n">{snap?.total_results ?? '—'}</div>
          </div>
          <span className="small">db</span>
        </div>
        <div className="card kpi">
          <div>
            <div className="small">Unique patients</div>
            <div className="n">{snap?.unique_patients ?? '—'}</div>
          </div>
          <span className="small">dedup</span>
        </div>
        <div className="card kpi">
          <div>
            <div className="small">Organisms</div>
            <div className="n">{snap?.organisms_count ?? '—'}</div>
          </div>
          <span className="small">distinct</span>
        </div>
      </div>

      <div className="card" style={{marginTop:16}}>
        <h3>One Health context</h3>
        <div className="small">
          This dashboard integrates human, animal, and environmental sources to track antimicrobial resistance patterns across Zimbabwe.
        </div>
        {err && <div className="small" style={{marginTop:8,color:'var(--bad)'}}>Error: {err}</div>}
      </div>
    </div>
  )
}
