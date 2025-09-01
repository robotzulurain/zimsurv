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
      } catch(e){ setErr(String(e)) }
    })()
  },[])

  return (
    <section style={{padding:'1rem'}}>
      <h2>Debug</h2>
      <div>BASE: <code>{String(BASE||'(unset)')}</code></div>
      <div>TOKEN set: <code>{String(Boolean(TOKEN))}</code></div>
      {err && <pre style={{color:'crimson'}}>Error: {err}</pre>}
      <pre>healthz: {JSON.stringify(health, null, 2)}</pre>
      <pre>counts: {JSON.stringify(counts, null, 2)}</pre>
    </section>
  )
}
