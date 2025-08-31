import React, { useEffect, useState } from 'react'
import { apiFetch } from '../api'

export default function LabResults(){
  const [data,setData]=useState(null)
  useEffect(()=>{ apiFetch('/api/lab-results/?limit=200').then(setData).catch(console.error) },[])
  const rows = data?.results || []
  return (
    <section className="card">
      <h2 className="section-title">Lab Results</h2>
      {!data && <div className="small">Loading…</div>}
      {rows.length>0 && (
        <div style={{overflowX:'auto'}}>
          <table className="table">
            <thead>
              <tr>
                <th>Date</th><th>Patient</th><th>Sex</th><th>Age</th><th>Specimen</th><th>Organism</th><th>Antibiotic</th><th>AST</th><th>Host</th><th>Facility</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r,i)=>(
                <tr key={i}>
                  <td>{r.date}</td><td>{r.patient_id}</td><td>{r.sex}</td><td>{r.age}</td>
                  <td>{r.specimen}</td><td>{r.organism}</td><td>{r.antibiotic}</td><td>{r.ast}</td><td>{r.host}</td><td>{r.facility}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
