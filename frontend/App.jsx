import React from "react";
import { BrowserRouter, Routes, Route, Link, Navigate } from "react-router-dom";
import Overview from "./Overview";
import Trends from "./Trends";
import Antibiogram from "./Antibiogram";
import SexAge from "./SexAge";
import Geo from "./Geo";

function Shell({children}){
  const nav = [
    {to:"/", label:"Overview"},
    {to:"/trends", label:"Trends"},
    {to:"/antibiogram", label:"Antibiogram"},
    {to:"/sex-age", label:"Sex & Age"},
    {to:"/geo", label:"Geo"},
    // intentionally hiding: Data Entry, Alerts, Reports
  ];
  return (
    <div>
      <header style={{display:"flex", gap:16, padding:"10px 16px", borderBottom:"1px solid #eee", background:"#fff", position:"sticky", top:0, zIndex:5}}>
        <strong>AMR Surveillance</strong>
        {nav.map(n=><Link key={n.to} to={n.to}>{n.label}</Link>)}
      </header>
      <div>{children}</div>
    </div>
  );
}

export default function App(){
  return (
    <BrowserRouter>
      <Shell>
        <Routes>
          <Route path="/" element={<Overview/>} />
          <Route path="/trends" element={<Trends/>} />
          <Route path="/antibiogram" element={<Antibiogram/>} />
          <Route path="/sex-age" element={<SexAge/>} />
          <Route path="/geo" element={<Geo/>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Shell>
    </BrowserRouter>
  );
}
