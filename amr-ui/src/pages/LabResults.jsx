import React, { useEffect, useMemo, useState } from 'react'
import { apiFetch } from '../api'
import { isArr } from '../util/isArray'

export default function LabResults(){
  const [raw, setRaw] = useState(null)
  const [err, setErr] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(()=>{
    let on=true
    setLoading(true)
    apiFetch('/api/lab-results/')
      .then(d=>{ if(on) setRaw(d) })
      .catch(e=>{ if(on) setErr(String(e)) })
      .finally(()=> on && setLoading(false))
    return ()=>{ on=false }
  },[])

  const rows = useMemo(()=>{
    if (!raw) return []
    if (Array.isArray(raw)) return raw
    if (Array.isArray(raw.results)) return raw.results
    return []
  },[raw])

  if (loading) return <div className="card">Loading…</div>
  if (err) return <div className="card error">Error: {err}</div>
  if (!isArr(rows)) return <div className="card">No data</div>

  return (
    <section>
      <h2 className="section-title">Lab Results</h2>
      <div className="card" style={{overflowX:'auto'}}>
        <table className="table">
          <thead>
            <tr>
              <th>Date</th><th>Patient</th><th>Sex</th><th>Age</th>
              <th>Specimen</th><th>Organism</th><th>Antibiotic</th><th>AST</th><th>Host</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r,i)=>(
              <tr key={i}>
                <td>{r.test_date || r.date || ''}</td>
                <td>{r.patient_id || ''}</td>
                <td>{r.sex || ''}</td>
                <td>{r.age ?? ''}</td>
                <td>{r.specimen_type || r.specimen || ''}</td>
                <td>{r.organism || ''}</td>
                <td>{r.antibiotic || ''}</td>
                <td>{r.ast_result || r.ast || ''}</td>
                <td>{r.host_type || r.host || ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
