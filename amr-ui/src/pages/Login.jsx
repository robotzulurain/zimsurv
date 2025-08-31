import React, { useState } from 'react'
import { setAuthToken, clearAuthToken } from '../api'

const LOGIN_URL = import.meta.env.VITE_LOGIN_URL || '/api-token-auth/'

export default function Login(){
  const [username,setUsername] = useState('')
  const [password,setPassword] = useState('')
  const [error,setError] = useState('')
  const [ok,setOk] = useState(false)

  async function submit(e){
    e.preventDefault()
    setError('')
    try{
      const resp = await fetch((import.meta.env.VITE_API_BASE||'') + LOGIN_URL, {
        method:'POST',
        headers:{ 'Content-Type':'application/json' },
        body: JSON.stringify({ username, password })
      })
      const data = await resp.json().catch(()=> ({}))
      if(!resp.ok || !data.token){
        throw new Error(data.detail || 'Login failed')
      }
      setAuthToken(data.token)
      setOk(true)
    }catch(err){
      setError(String(err.message||err))
      clearAuthToken()
    }
  }

  return (
    <section className="card" style={{maxWidth:420}}>
      <h2 className="section-title">Sign in</h2>
      <p className="small">Uses DRF Token Auth. Endpoint: <code>{LOGIN_URL}</code></p>
      <form onSubmit={submit} className="grid" style={{gap:10}}>
        <input
          placeholder="Username"
          value={username}
          onChange={e=>setUsername(e.target.value)}
          style={{padding:'8px 10px', border:'1px solid #cbd5e1', borderRadius:8}}
          autoFocus
        />
        <input
          placeholder="Password"
          type="password"
          value={password}
          onChange={e=>setPassword(e.target.value)}
          style={{padding:'8px 10px', border:'1px solid #cbd5e1', borderRadius:8}}
        />
        <button className="subtab" type="submit">Sign in</button>
        {error && <div className="small" style={{color:'#b91c1c'}}>{error}</div>}
        {ok && <div className="small" style={{color:'#065f46'}}>Signed in. Navigate to any tab.</div>}
      </form>
      <div style={{marginTop:10}}>
        <button className="subtab" onClick={()=>{clearAuthToken(); alert('Signed out');}}>Sign out</button>
      </div>
    </section>
  )
}
