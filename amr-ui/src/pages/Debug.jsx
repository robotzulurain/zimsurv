import React, { useEffect, useState } from 'react'
import { apiFetch } from '../api'

export default function Debug(){
  const [counts,setCounts]=useState(null)
  const [trend,setTrend]=useState(null)
  const [dq,setDq]=useState(null)
  const [labs,setLabs]=useState(null)
  const BASE = import.meta.env.VITE_API_BASE
  const TOKEN = Boolean(import.meta.env.VITE_API_TOKEN)

  useEffect(()=>{
    apiFetch('/api/summary/counts-summary/').then(setCounts).catch(console.error)
    apiFetch('/api/summary/resistance-time-trend/').then(setTrend).catch(console.error)
    apiFetch('/api/summary/data-quality/').then(setDq).catch(console.error)
    apiFetch('/api/lab-results/?limit=10').then(setLabs).catch(console.error)
  },[])

  return (
    <section className="card">
      <h2 className="section-title">Debug</h2>
      <div className="small">BASE: {BASE} • TOKEN set: {String(TOKEN)}</div>
      <pre>{JSON.stringify({counts,trend,dq,labs},null,2)}</pre>
    </section>
  )
}
