import React, { useEffect, useState } from "react";
const API = import.meta.env.VITE_API_BASE || "http://localhost:8000";

export default function RoleBadge(){
  const [info,setInfo]=useState({authenticated:false, username:null, groups:[]});
  const token = typeof window!=="undefined" ? localStorage.getItem("amr_token") : null;

  useEffect(()=>{
    const fetchInfo = async ()=>{
      try{
        const res = await fetch(`${API}/api/auth/whoami`, {
          headers: { ...(token ? { Authorization: `Token ${token}` } : {}) }
        });
        const data = await res.json();
        setInfo(data);
      }catch{ /* ignore */ }
    };
    fetchInfo();
  }, [token]);

  if(!info.authenticated) return <span className="text-xs text-gray-500">Role: guest</span>;

  const role = info.groups.includes("lab_tech")
    ? "lab_tech"
    : (info.groups.includes("policymaker") ? "policymaker" : "user");

  return (
    <span className="text-xs px-2 py-1 rounded bg-slate-100 border">
      {info.username} · {role}
    </span>
  );
}
