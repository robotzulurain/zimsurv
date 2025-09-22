import React, { useEffect, useState } from "react";
const API = import.meta.env.VITE_API_BASE || "http://localhost:8000";

export default function Header() {
  const [info, setInfo] = useState({ authenticated:false, username:null, groups:[] });

  async function refresh() {
    const token = localStorage.getItem("amr_token");
    const res = await fetch(`${API}/api/auth/whoami`, {
      headers: token ? { Authorization: `Token ${token}` } : {}
    });
    const data = await res.json().catch(()=>({}));
    setInfo(data || { authenticated:false, username:null, groups:[] });
  }

  useEffect(() => { refresh(); }, []);

  function logout() {
    localStorage.removeItem("amr_token");
    setInfo({ authenticated:false, username:null, groups:[] });
    alert("Logged out");
  }

  const isTech = info.groups?.includes("lab_tech");

  return (
    <header className="flex items-center justify-between p-3 bg-slate-800 text-white">
      <a href="/" className="font-semibold">AMR Dashboard</a>
      <nav className="flex items-center gap-3 text-sm">
        <a href="/overview" className="hover:underline">Overview</a>
        <a href="/trends" className="hover:underline">Trends</a>
        <a href="/antibiogram" className="hover:underline">Antibiogram</a>
        <a href="/geo" className="hover:underline">Map</a>
        <a href="/data-entry" className="hover:underline">Data Entry</a>
        <a href="/reports" className="hover:underline">Reports</a>
      </nav>
      <div className="text-xs">
        {info.authenticated ? (
          <div className="flex items-center gap-2">
            <span>Hi, <b>{info.username}</b>{isTech ? " (lab_tech)" : ""}</span>
            <button onClick={logout} className="px-2 py-1 bg-slate-700 rounded hover:bg-slate-600">Logout</button>
          </div>
        ) : (
          <a href="/login" className="px-2 py-1 bg-slate-700 rounded hover:bg-slate-600">Login</a>
        )}
      </div>
    </header>
  );
}
