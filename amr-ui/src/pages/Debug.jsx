import React, { useEffect, useState } from 'react'
import { apiFetch } from '../api'

export default function Debug(){
  const [health, setHealth] = useState(null)
  const [counts, setCounts] = useState(null)
  const [err, setErr] = useState(null)

  const BASE = import.meta.env.VITE_API_BASE
  const TOKEN = import.meta.env.VITE_API_TOKEN

  useEffect(()=>{
    (async ()=>{
      try {
        const h = await apiFetch('/healthz')
        setHealth(h)
        const c = await apiFetch('/api/summary/counts-summary/')
        setCounts(c)
      } catch(e){
        setErr(String(e))
      }
    })()
  },[])

  return (
    <section className="card">
      <h2 className="section-title">Debug</h2>
      <div className="small">BASE: {BASE || <em>unset</em>} • TOKEN set: {String(Boolean(TOKEN))}</div>
      {err && <div className="error" style={{marginTop:8}}>Error: {err}</div>}
      <pre className="code" style={{marginTop:12}}>healthz: {JSON.stringify(health, null, 2)}</pre>
      <pre className="code">counts: {JSON.stringify(counts, null, 2)}</pre>
    </section>
  )
}
