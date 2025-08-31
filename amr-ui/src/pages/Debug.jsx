import React, { useEffect, useState } from 'react'
import { apiFetch, getApiDebug } from '../api'

export default function Debug(){
  const [counts,setCounts]=useState(null)
  const [err,setErr]=useState(null)
  const meta = getApiDebug()
  useEffect(()=>{
    apiFetch('/api/summary/counts-summary/')
      .then(setCounts)
      .catch(e=> setErr(String(e)))
  },[])
  return (
    <section className="card">
      <h2 className="section-title">Debug</h2>
      <div className="small">BASE: {meta.BASE} • TOKEN set: {String(meta.hasTOKEN)}</div>
      {err && <div className="small" style={{color:'#b91c1c'}}>Error: {err}</div>}
      <pre>{JSON.stringify({counts}, null, 2)}</pre>
    </section>
  )
}
