import React, { useMemo, useState } from 'react'
import useLabData from '../hooks/useLabData'

export default function LabResults(){
  const { rows, loading, error } = useLabData()
  const [q, setQ] = useState('')

  const filtered = useMemo(()=>{
    if (!q) return rows
    const s = q.toLowerCase()
    return rows.filter(r => JSON.stringify(r).toLowerCase().includes(s))
  }, [rows, q])

  const cols = ['id','test_date','patient_id','sex','age','specimen_type','organism','antibiotic','ast_result','host_type','facility','city']

  return (
    <div className="card">
      <h3>Lab Results</h3>
      <div className="row" style={{marginBottom:12, gap:12}}>
        <input
          placeholder="Search…"
          value={q}
          onChange={e=>setQ(e.target.value)}
          style={{padding:'8px 10px', borderRadius:8, border:'1px solid #ddd', minWidth:260}}
        />
        <div className="small">{filtered.length} / {rows.length}</div>
      </div>
      {loading && <div>Loading…</div>}
      {error && <div className="small" style={{color:'var(--bad)'}}>Error: {error}</div>}
      {!loading && (
        <div style={{overflowX:'auto'}}>
          <table className="table" style={{width:'100%', borderCollapse:'collapse'}}>
            <thead>
              <tr>
                {cols.map(c=><th key={c} style={{textTransform:'capitalize', textAlign:'left'}}>{c.replace('_',' ')}</th>)}
              </tr>
            </thead>
            <tbody>
              {filtered.map((r,i)=>(
                <tr key={r.id ?? i}>
                  {cols.map(c => <td key={c}>{r[c] ?? ''}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
