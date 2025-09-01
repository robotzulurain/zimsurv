import React, { useEffect, useState } from 'react'
import api, { sr } from '../api'  // both default and named; either is fine

export default function Home(){
  const [snap,setSnap]=useState(null)
  const [err,setErr]=useState(null)

  useEffect(()=>{
    sr.counts()
      .then(setSnap)
      .catch(e=>setErr(String(e)))
  },[])

  return (
    <>
      <div className="grid snap">
        <div className="card kpi">
          <div>
            <div className="small">Total records</div>
            <div className="n">{snap?.total_results ?? '—'}</div>
          </div>
          <span className="badge">db</span>
        </div>
        <div className="card kpi">
          <div>
            <div className="small">Unique patients</div>
            <div className="n">{snap?.unique_patients ?? '—'}</div>
          </div>
          <span className="badge">dedup</span>
        </div>
        <div className="card kpi">
          <div>
            <div className="small">Organisms</div>
            <div className="n">{snap?.organisms_count ?? '—'}</div>
          </div>
          <span className="badge">distinct</span>
        </div>
      </div>

      <div className="card">
        <h3>One Health context</h3>
        <div className="small">
          This dashboard integrates human, animal, and environmental sources to track antimicrobial resistance patterns across Zimbabwe.
        </div>
        {err && <div className="small" style={{marginTop:8,color:'var(--bad)'}}>Error: {err}</div>}
      </div>
    </>
  )
}
