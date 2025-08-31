import React, { useEffect, useState } from 'react'
import { apiFetch } from '../api'

export default function DataQuality(){
  const [dq,setDq]=useState(null)
  useEffect(()=>{ apiFetch('/api/summary/data-quality/').then(setDq).catch(console.error) },[])
  return (
    <section className="card">
      <h2 className="section-title">Data Quality</h2>
      {!dq && <div className="small">Loading…</div>}
      {dq && (
        <>
          <div className="grid grid-3">
            <div className="card kpi"><div className="t">Total records</div><div className="v">{dq.total}</div></div>
            <div className="card kpi"><div className="t">Invalid AST</div><div className="v">{dq.invalid.ast_result}</div></div>
            <div className="card kpi"><div className="t">Future dates</div><div className="v">{dq.invalid.future_dates}</div></div>
          </div>
          <h3 className="section-title" style={{marginTop:12}}>By specimen</h3>
          <table className="table">
            <thead><tr><th>Specimen</th><th>Count</th></tr></thead>
            <tbody>{dq.by_specimen.map(x=><tr key={x.specimen_type}><td>{x.specimen_type}</td><td>{x.count}</td></tr>)}</tbody>
          </table>
        </>
      )}
    </section>
  )
}
