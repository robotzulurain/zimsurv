import React, { useEffect, useMemo, useState } from 'react'
import { apiFetch } from '../api'
import { isArr } from '../util/isArray'

const DEFAULT_BANDS = ['0-4','5-14','15-24','25-34','35-44','45-54','55-64','65+']
const SEX_COLS = ['Male','Female','Unknown']

export default function SexAge(){
  const [raw, setRaw] = useState(null)
  const [err, setErr] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(()=>{
    let on=true
    setLoading(true)
    apiFetch('/api/summary/data-quality/') // we’ll reuse if it includes age/sex – else fallback call below
      .then(d=>{ if(on) setRaw(d) })
      .catch(async ()=>{
        // fallback to lab-results and aggregate client-side
        try{
          const lr = await apiFetch('/api/lab-results/')
          if (on) setRaw({ lab_results: lr.results || [] })
        }catch(e2){ if(on) setErr(String(e2)) }
      })
      .finally(()=> on && setLoading(false))
    return ()=>{ on=false }
  },[])

  const rows = useMemo(()=>{
    // Accept shapes:
    // 1) { table:[{age_band, Male, Female, Unknown, Total}, ...] }
    // 2) { results:[...] } or [] of { age_band, ... }
    // 3) { lab_results:[...] } -> aggregate here
    if (!raw) return []

    if (Array.isArray(raw.table)) return raw.table
    if (Array.isArray(raw.results)) return raw.results

    if (Array.isArray(raw.lab_results)) {
      const acc = Object.fromEntries(DEFAULT_BANDS.map(b=>[b,{Male:0,Female:0,Unknown:0,Total:0}]))
      for (const r of raw.lab_results) {
        const age = Number.isFinite(r.age) ? r.age : 0
        const sex = (r.sex || '').toUpperCase()==='F' ? 'Female' : ( (r.sex || '').toUpperCase()==='M' ? 'Male' : 'Unknown')
        let band = '65+'
        if (age<=4) band='0-4'
        else if (age<=14) band='5-14'
        else if (age<=24) band='15-24'
        else if (age<=34) band='25-34'
        else if (age<=44) band='35-44'
        else if (age<=54) band='45-54'
        else if (age<=64) band='55-64'
        acc[band][sex] += 1
        acc[band].Total += 1
      }
      return DEFAULT_BANDS.map(b=>({age_band:b, ...acc[b]}))
    }

    // If raw itself is an array of rows
    if (Array.isArray(raw)) return raw

    return []
  },[raw])

  if (loading) return <div className="card">Loading…</div>
  if (err) return <div className="card error">Error: {err}</div>
  if (!isArr(rows)) return <div className="card">No data</div>

  return (
    <section>
      <h2 className="section-title">Sex & Age</h2>
      <div className="card" style={{overflowX:'auto'}}>
        <table className="table">
          <thead>
            <tr>
              <th>Age band</th>
              {SEX_COLS.map(s=> <th key={s}>{s}</th>)}
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r,i)=>(
              <tr key={i}>
                <td>{r.age_band || r.band || r.ageBand || '-'}</td>
                {SEX_COLS.map(s => <td key={s}>{Number(r[s])||0}</td>)}
                <td>{Number(r.Total)|| (SEX_COLS.reduce((a,s)=>a+(Number(r[s])||0),0))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
