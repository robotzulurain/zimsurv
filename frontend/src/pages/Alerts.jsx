import React,{useEffect,useState} from "react";
import { fetchAlerts, fetchFacilities } from "../api";
import { ANTIBIOTICS, ORGANISMS, HOSTS } from "../constants";
import FilterBar from "../components/FilterBar";

export default function Alerts(){
  const [facilities,setFacilities]=useState([{label:"All",value:""}]);
  const [filters,setFilters]=useState({antibiotic:"",organism:"",host:"",facility:""});
  const [data,setData]=useState({rare:[],spikes:[],clusters:[]});
  const [err,setErr]=useState("");

  useEffect(()=>{ fetchFacilities().then(f=>setFacilities([{label:"All",value:""},...f])); },[]);
  useEffect(()=>{
    setErr("");
    fetchAlerts(filters).then(d=>{
      setData({
        rare: Array.isArray(d?.rare)? d.rare: [],
        spikes: Array.isArray(d?.spikes)? d.spikes: [],
        clusters: Array.isArray(d?.clusters)? d.clusters: [],
      });
    }).catch(e=>{ setErr(e.message); setData({rare:[],spikes:[],clusters:[]}); });
  },[filters]);

  const Block = ({title, items})=>(
    <div className="card">
      <h4 style={{margin:"0 0 8px"}}>{title}</h4>
      {items.length===0 ? <p>No alerts.</p> : (
        <table><thead><tr><th>Description</th><th>Detail</th></tr></thead>
          <tbody>{items.map((a,i)=><tr key={i}><td>{a.type||"-"}</td><td>{a.detail||a.note||a.month||"-"}</td></tr>)}</tbody></table>
      )}
    </div>
  );

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
      <div className="grid autofit">
        <Block title="Rare resistance patterns" items={data.rare} />
        <Block title="Sudden spikes in resistance" items={data.spikes} />
        <Block title="Clusters (location/time)" items={data.clusters} />
      </div>
    </div>
  );
}
