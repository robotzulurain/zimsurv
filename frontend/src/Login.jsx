import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "./api";

export default function Login({ onLogin }){
  const nav = useNavigate();
  const [username,setU]=useState("");
  const [password,setP]=useState("");
  const [msg,setMsg]=useState("");

  async function submit(e){
    e.preventDefault();
    setMsg("Authenticating…");
    try{
      const data = await api.login(username, password);
      if (data?.token){
        localStorage.setItem("amr_token", data.token);
        setMsg("Logged in");
        onLogin?.();
        nav("/entry");
      } else {
        setMsg("Login failed");
      }
    }catch(err){
      setMsg(err.message || "Login error");
    }
  }

  return (
    <div className="max-w-sm mx-auto bg-white rounded-xl shadow p-4">
      <h2 className="text-lg font-semibold mb-2">Lab Login</h2>
      <form onSubmit={submit} className="flex flex-col gap-2">
        <input className="border rounded px-2 py-1" placeholder="Username" value={username} onChange={e=>setU(e.target.value)} />
        <input className="border rounded px-2 py-1" placeholder="Password" type="password" value={password} onChange={e=>setP(e.target.value)} />
        <button className="px-3 py-1 rounded bg-blue-600 text-white">Login</button>
      </form>
      {msg && <div className="text-sm mt-2">{msg}</div>}
    </div>
  );
}
