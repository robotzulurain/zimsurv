import React, { useEffect, useMemo, useState } from 'react'
import { apiFetch } from '../api'

const OPTS = {
  host: ['', 'human','animal','environment'],
  organism: ['', 'E. coli','Klebsiella','S. aureus','Pseudomonas','Enterococcus'],
  antibiotic: ['', 'Ciprofloxacin','Ceftriaxone','Gentamicin','Ampicillin','Meropenem']
}

export default function Trends(){
  const [host,setHost]=useState('')
  const [org,setOrg]=useState('')
  const [abx,setAbx]=useState('')
  const [data,setData]=useState(null)
  const [err,setErr]=useState(null)
  const qs = useMemo(()=>{
    const p = new URLSearchParams()
    if(host) p.set('host',host)
    if(org) p.set('organism',org)
    if(abx) p.set('antibiotic',abx)
    const s = p.toString()
    return s? ('?'+s):''
  },[host,org,abx])

  useEffect(()=>{
    setData(null); setErr(null)
    apiFetch(`/api/summary/resistance-time-trend/${qs}`)
      .then(setData)
      .catch(e=>setErr(String(e)))
  },[qs])

  return (
    <section className="card">
      <div className="row" style={{justifyContent:'space-between',alignItems:'center',gap:12}}>
        <h2 className="section-title">Resistance trends</h2>
        <div className="row" style={{gap:8}}>
          <Select label="Host" value={host} onChange={setHost} opts={OPTS.host} />
          <Select label="Organism" value={org} onChange={setOrg} opts={OPTS.organism} />
          <Select label="Antibiotic" value={abx} onChange={setAbx} opts={OPTS.antibiotic} />
        </div>
      </div>

      {err && <div className="error">Error: {err}</div>}
      {!data && !err && <div className="muted">Loading…</div>}
      {data && data.length===0 && <div className="muted">No data</div>}

      {data && data.length>0 && (
        <div className="card" style={{padding:'12px 16px'}}>
          <div className="small muted" style={{marginBottom:6}}>Monthly % Resistant (R)</div>
          <BarChart rows={data} />
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

function BarChart({rows}){
  // simple inline bars based on percent_R
  const max = 100
  return (
    <div className="column" style={{gap:6}}>
      {rows.map(r=>(
        <div key={r.month} className="row" style={{alignItems:'center',gap:8}}>
          <div style={{width:80}} className="small">{r.month}</div>
          <div style={{flex:1,background:'#f3f4f6',borderRadius:6,overflow:'hidden',height:16}}>
            <div style={{width:`${Math.min(r.percent_R,max)}%`,height:'100%',background:'#2563eb'}} />
          </div>
          <div style={{width:56}} className="small">{Math.round(r.percent_R)}%</div>
        </div>
      ))}
    </div>
  )
}
