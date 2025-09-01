import React, { useEffect, useMemo, useState } from 'react'
import { apiFetch } from '../api'
import { isArr } from '../util/isArray'

const BANDS = ['0-4','5-14','15-24','25-34','35-44','45-54','55-64','65+']
const SEX_COLS = ['Male','Female','Unknown']

function bandForAge(age){
  const a = Number.isFinite(age)? age : 0
  if (a<=4) return '0-4'
  if (a<=14) return '5-14'
  if (a<=24) return '15-24'
  if (a<=34) return '25-34'
  if (a<=44) return '35-44'
  if (a<=54) return '45-54'
  if (a<=64) return '55-64'
  return '65+'
}

export default function SexAge(){
  const [rows,setRows]=useState(null)
  const [loading,setLoading]=useState(true)
  const [err,setErr]=useState(null)

  useEffect(()=>{
    let on=true
    setLoading(true)
    apiFetch('/api/lab-results/')
      .then(d=>{
        if(!on) return
        const arr = Array.isArray(d) ? d : (d.results||[])
        const acc = Object.fromEntries(BANDS.map(b=>[b,{Male:0,Female:0,Unknown:0,Total:0}]))
        for(const r of arr){
          const sex = (r.sex||'').toUpperCase()==='F' ? 'Female' : ((r.sex||'').toUpperCase()==='M' ? 'Male' : 'Unknown')
          const band = bandForAge(Number(r.age))
          acc[band][sex] += 1
          acc[band].Total += 1
        }
        setRows(BANDS.map(b=>({age_band:b, ...acc[b]})))
      })
      .catch(e=> on && setErr(String(e)))
      .finally(()=> on && setLoading(false))
    return ()=>{ on=false }
  },[])

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
                <td>{r.age_band}</td>
                {SEX_COLS.map(s=> <td key={s}>{Number(r[s])||0}</td>)}
                <td>{Number(r.Total)||0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
