import React, { useEffect, useMemo, useState } from 'react'
import { apiFetch } from '../api'

const OPTS = {
  host: ['', 'human','animal','environment'],
  organism: ['', 'E. coli','Klebsiella','S. aureus','Pseudomonas','Enterococcus'],
  antibiotic: ['', 'Ciprofloxacin','Ceftriaxone','Gentamicin','Ampicillin','Meropenem']
}

export default function SexAge(){
  const [host,setHost]=useState('')
  const [org,setOrg]=useState('')
  const [abx,setAbx]=useState('')

  const qs = useMemo(()=>{
    const p = new URLSearchParams()
    if(host) p.set('host',host)
    if(org) p.set('organism',org)
    if(abx) p.set('antibiotic',abx)
    const s = p.toString()
    return s? ('?'+s):''
  },[host,org,abx])

  const [rows,setRows]=useState(null)
  const [err,setErr]=useState(null)

  useEffect(()=>{
    setRows(null); setErr(null)
    apiFetch(`/api/summary/sex-age/${qs}`).then(setRows).catch(e=>setErr(String(e)))
  },[qs])

  return (
    <section className="column" style={{gap:12}}>
      <div className="row" style={{justifyContent:'space-between',alignItems:'center'}}>
        <h2 className="section-title">Sex & Age</h2>
        <div className="row" style={{gap:8}}>
          <Select label="Host" value={host} onChange={setHost} opts={OPTS.host} />
          <Select label="Organism" value={org} onChange={setOrg} opts={OPTS.organism} />
          <Select label="Antibiotic" value={abx} onChange={setAbx} opts={OPTS.antibiotic} />
        </div>
      </div>

      {err && <div className="error">Error: {err}</div>}
      {!rows && !err && <div className="muted">Loading…</div>}
      {rows && rows.length===0 && <div className="muted">No data</div>}

      {rows && rows.length>0 && (
        <div className="card">
          <table className="table">
            <thead>
              <tr><th>Age band</th><th>Male</th><th>Female</th><th>Unknown</th><th>Total</th></tr>
            </thead>
            <tbody>
              {rows.map(r=>(
                <tr key={r.band}>
                  <td>{r.band}</td>
                  <td>{r.M}</td>
                  <td>{r.F}</td>
                  <td>{r.U}</td>
                  <td>{r.total}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="small muted" style={{marginTop:8}}>Stacked (M/F/U)</div>
          <div className="column" style={{gap:8}}>
            {rows.map(r=>{
              const total = r.total || 1
              const wM = (r.M/total)*100
              const wF = (r.F/total)*100
              const wU = (r.U/total)*100
              return (
                <div key={r.band} className="row" style={{alignItems:'center',gap:8}}>
                  <div style={{width:56}} className="small">{r.band}</div>
                  <div style={{flex:1, height:16, display:'flex', borderRadius:6, overflow:'hidden', background:'#f3f4f6'}}>
                    <div title={`M ${r.M}`} style={{width:`${wM}%`, background:'#2563eb'}} />
                    <div title={`F ${r.F}`} style={{width:`${wF}%`, background:'#22c55e'}} />
                    <div title={`U ${r.U}`} style={{width:`${wU}%`, background:'#9ca3af'}} />
                  </div>
                  <div style={{width:40}} className="small">{r.total}</div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </section>
  )
}

function Select({label,value,onChange,opts}){
  return (
    <label className="small" style={{display:'flex',alignItems:'center',gap:6}}>
      <span>{label}</span>
      <select value={value} onChange={e=>onChange(e.target.value)}>
        {opts.map((o,i)=><option key={i} value={o}>{o||'All'}</option>)}
      </select>
    </label>
  )
}
