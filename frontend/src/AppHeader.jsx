import { useEffect, useState } from 'react'
import api from './api'

export default function AppHeader(){
  const [user, setUser] = useState(null) // { username, role }

  useEffect(()=>{
    let alive = true
    api.whoami().then(d=>{
      if (!alive) return
      if (d && d.username) setUser({ username: d.username, role: d.role || 'user' })
    }).catch(()=>{})
    return ()=>{ alive=false }
  }, [])

  return (
    <div style={{display:'flex', gap:12, alignItems:'center', padding:'8px 12px', borderBottom:'1px solid #eee'}}>
      <strong>AMR Surveillance</strong>
      <div style={{flex:1}} />
      {user
        ? <span>Signed in as <b>{user.username}</b> <span style={{marginLeft:8, padding:'2px 6px', border:'1px solid #ddd', borderRadius:999, fontSize:12}}>{user.role}</span></span>
        : <span>Not signed in</span>}
    </div>
  )
}
