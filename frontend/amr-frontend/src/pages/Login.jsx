import React, { useState } from 'react';
import { setToken } from '../api';

export default function Login(){
  const [username, setU] = useState('');
  const [password, setP] = useState('');
  const [msg, setMsg] = useState('');
  const submit = async (e)=>{
    e.preventDefault();
    try{
      const r = await fetch('/api/login/', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({username, password})
      });
      const j = await r.json();
      if (j.token){
        setToken(j.token);
        setMsg('Logged in ✓');
      }else{
        setMsg('Login failed: ' + JSON.stringify(j));
      }
    }catch(err){ setMsg(String(err)); }
  };
  return (
    <div style={{maxWidth:420, margin:'2rem auto'}}>
      <h2>Login</h2>
      <form onSubmit={submit} style={{display:'grid', gap:8}}>
        <input placeholder="username" value={username} onChange={e=>setU(e.target.value)} />
        <input placeholder="password" value={password} onChange={e=>setP(e.target.value)} type="password" />
        <button type="submit">Login</button>
      </form>
      <p>{msg}</p>
    </div>
  );
}
