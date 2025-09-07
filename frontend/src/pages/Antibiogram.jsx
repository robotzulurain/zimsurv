import React,{useEffect,useState} from "react";
import { fetchAntibiogram, fetchFacilities } from "../api";
import { ANTIBIOTICS, ORGANISMS, HOSTS } from "../constants";
import FilterBar from "../components/FilterBar";

export default function Antibiogram(){
  const [facilities,setFacilities]=useState([{label:"All",value:""}]);
  const [filters,setFilters]=useState({antibiotic:"",organism:"",host:"",facility:""});
  const [grid,setGrid]=useState([]);
  const [err,setErr]=useState("");

  useEffect(()=>{ fetchFacilities().then(f=>setFacilities([{label:"All",value:""},...f])); },[]);
  useEffect(()=>{
    setErr("");
    fetchAntibiogram(filters)
      .then(d=> Array.isArray(d)? setGrid(d): setGrid([]))
      .catch(e=>{ setErr(e.message); setGrid([]); });
  },[filters]);

  return (
    <div className="grid" style={{gap:16}}>
      <FilterBar
        items={[
          {name:"antibiotic",label:"Antibiotic",value:filters.antibiotic,options:ANTIBIOTICS},
          {name:"organism",label:"Organism",value:filters.organism,options:ORGANISMS},
          {name:"host",label:"Host Type",value:filters.host,options:HOSTS},
          {name:"facility",label:"Facility",value:filters.facility,options:facilities},
        ]}
        onChange={(k,v)=>setFilters(s=>({...s,[k]:v}))}
      />
      {err && <p style={{color:"crimson"}}>Error: {err}</p>}
      {grid.length===0 ? <p>No antibiogram data yet.</p> : (
        <div className="grid autofit">
          {grid.map((r,i)=>{
            const pct = Number(r.r_pct ?? r.r_rate ?? 0);
            const bg = `linear-gradient(90deg, rgba(220,38,38,.1) ${Math.min(100,Math.round(pct*100))}%, transparent 0)`;
            return (
              <div key={i} className="card" style={{backgroundImage:bg}}>
                <div style={{fontWeight:700}}>{r.organism} × {r.antibiotic}</div>
                <div>R%: <b>{Math.round(pct*100)}</b>   <span className="pill">n: {r.n ?? r.total ?? "-"}</span></div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
