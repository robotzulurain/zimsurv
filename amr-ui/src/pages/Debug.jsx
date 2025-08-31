import React, { useEffect, useState } from 'react'
export default function Debug(){
  const [resp,setResp]=useState(null)
  const [err,setErr]=useState(null)
  const BASE = import.meta.env.VITE_API_BASE
  const TOKEN = import.meta.env.VITE_API_TOKEN
  useEffect(()=>{
    fetch(`${BASE}/api/summary/counts-summary/`, {
      headers: {
        'Accept':'application/json',
        'Authorization': `Token ${TOKEN || ''}`
      }
    }).then(async r=>{
      if(!r.ok) throw new Error(`HTTP ${r.status} - ${await r.text()}`)
      return r.json()
    }).then(setResp).catch(e=>setErr(String(e)))
  },[])
  return (
    <section className="card">
      <h2 className="section-title">Debug</h2>
      <div className="small">BASE: {BASE} • TOKEN set: {String(Boolean(TOKEN))}</div>
      {err && <div className="small" style={{color:'#b91c1c'}}>Fetch error: {err}</div>}
      <pre>{JSON.stringify(resp,null,2)}</pre>
    </section>
  )
}
