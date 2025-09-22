import { useState } from 'react'
import { api, setToken } from '../api'

export default function Login({ onLogin }){
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)

  async function submit(e){
    e.preventDefault()
    setError(null)
    try {
      const data = await api.login(username, password)
      if(data?.token){
        setToken(data.token)
        onLogin && onLogin(data)
      } else {
        setError("Login failed: no token returned")
      }
    } catch (err){
      setError("Login failed: " + (err.message || "Unknown error"))
    }
  }

  return (
    <div style={{padding:20}}>
      <h3>Lab Login</h3>
      <form onSubmit={submit}>
        <div>
          <label>Username</label><br/>
          <input value={username} onChange={e=>setUsername(e.target.value)} />
        </div>
        <div>
          <label>Password</label><br/>
          <input type="password" value={password} onChange={e=>setPassword(e.target.value)} />
        </div>
        <button type="submit">Sign in</button>
      </form>
      {error && <div style={{color:'red', marginTop:10}}>{error}</div>}
    </div>
  )
}
