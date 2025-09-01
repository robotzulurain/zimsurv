import React, { useEffect, useMemo, useState } from 'react'
import { apiFetch } from '../api'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

export default function DataQuality(){
  const [dq, setDQ] = useState(null)
  const [err, setErr] = useState(null)
  const [busy, setBusy] = useState(true)

  const load = async ()=>{
    setBusy(true); setErr(null)
    try{
      const res = await apiFetch('/api/summary/data-quality/')
      setDQ(res)
    }catch(e){
      setErr(String(e))
    }finally{ setBusy(false) }
  }

  useEffect(()=>{ load() },[])

  const missingPairs = useMemo(()=>{
    if (!dq?.missing) return []
    return Object.entries(dq.missing).map(([field,count])=>({ field, count }))
  },[dq])

  const totalMissing = useMemo(()=> missingPairs.reduce((s,r)=>s+r.count,0),[missingPairs])

  return (
    <div className="grid">
      <div className="row" style={{justifyContent:'space-between', alignItems:'center'}}>
        <h3>Data Quality</h3>
        <button className="btn" onClick={load} disabled={busy}>{busy?'Loading…':'Refresh'}</button>
      </div>

      {err && <div className="card" style={{color:'var(--bad)'}}>Error: {err}</div>}

      <div className="grid" style={{gridTemplateColumns:'repeat(3, 1fr)'}}>
        <div className="card">
          <div className="small">Missing values (total)</div>
          <div className="n" style={{fontSize:32}}>{totalMissing}</div>
          <div className="small" style={{color: totalMissing===0 ? 'var(--good)' : 'var(--bad)'}}>
            {totalMissing===0 ? 'All required fields are present.' : 'Some fields are missing.'}
          </div>
        </div>
        <div className="card">
          <div className="small">Duplicate records</div>
          <div className="n" style={{fontSize:32}}>{dq?.duplicates ?? '—'}</div>
          <div className="small">Duplicates are repeated rows (e.g., same patient & test).</div>
        </div>
        <div className="card">
          <div className="small">Status</div>
          <div className="n" style={{fontSize:20}}>
            {totalMissing===0 ? '✅ Clean (no missing)' : '⚠️ Needs cleanup'}
          </div>
          <div className="small">Aim to keep missing and duplicates near zero.</div>
        </div>
      </div>

      <div className="card">
        <h4 style={{marginTop:0}}>Missing by field</h4>
        {missingPairs.length ? (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={missingPairs}>
              <XAxis dataKey="field" />
              <YAxis allowDecimals={false}/>
              <Tooltip />
              <Bar dataKey="count" name="Missing" fill="#d32f2f" />
            </BarChart>
          </ResponsiveContainer>
        ) : <div className="small">No missing values detected.</div>}
      </div>

      <div className="card">
        <h4 style={{marginTop:0}}>Plain-English summary</h4>
        <div className="small">
          {totalMissing===0
            ? <>All fields are filled in your latest dataset.</>
            : <>You have {totalMissing} missing values across {missingPairs.length} fields.</>
          }{' '}
          You also have <b>{dq?.duplicates ?? 0}</b> duplicate record(s). Duplicates can be harmless (repeat tests) or indicate data entry mistakes.
        </div>
      </div>
    </div>
  )
}
