import React,{useEffect,useState} from "react";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { fetchGeo, fetchFacilities } from "../api";
import { ANTIBIOTICS, ORGANISMS, HOSTS } from "../constants";
import FilterBar from "../components/FilterBar";

export default function Geo(){
  const [facilities,setFacilities]=useState([{label:"All",value:""}]);
  const [filters,setFilters]=useState({antibiotic:"",organism:"",host:"",facility:""});
  const [points,setPoints]=useState([]);
  const [err,setErr]=useState("");

  useEffect(()=>{ fetchFacilities().then(f=>setFacilities([{label:"All",value:""},...f])); },[]);
  useEffect(()=>{
    setErr("");
    fetchGeo(filters).then(d=>{
      const arr = Array.isArray(d)? d: [];
      setPoints(arr.filter(p=> Number.isFinite(p?.lat) && Number.isFinite(p?.lng)));
    }).catch(e=>{ setErr(e.message); setPoints([]); });
  },[filters]);

  const center = [-19.0, 30.9]; // roughly Zimbabwe center
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
      <div className="card" style={{height:520,padding:0,overflow:"hidden"}}>
        <MapContainer center={center} zoom={6} style={{height:"100%",width:"100%"}}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {points.map((p,i)=>{
            const rr = Number(p.resistance_rate ?? p.r_rate ?? 0);
            const radius = 6 + Math.min(24, Math.sqrt(Number(p.total ?? 0)));
            const color = rr>0.5 ? "#dc2626" : rr>0.2 ? "#f59e0b" : "#16a34a";
            return (
              <CircleMarker key={i} center={[p.lat, p.lng]} radius={radius} pathOptions={{color, fillColor:color, fillOpacity:.6}}>
                <Popup>
                  <div><b>{p.name}</b></div>
                  <div>n: {p.total ?? "-"}</div>
                  <div>R%: {Math.round(rr*100)}</div>
                </Popup>
              </CircleMarker>
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
}
