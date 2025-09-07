import React,{useEffect,useState} from "react";
import { fetchSexAge, fetchFacilities } from "../api";
import { ANTIBIOTICS, ORGANISMS, HOSTS } from "../constants";
import FilterBar from "../components/FilterBar";
import { BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";

export default function SexAge(){
  const [facilities,setFacilities]=useState([{label:"All",value:""}]);
  const [filters,setFilters]=useState({antibiotic:"",organism:"",host:"",facility:""});
  const [data,setData]=useState({by_sex:[],by_age:[]});
  const [err,setErr]=useState("");

  useEffect(()=>{ fetchFacilities().then(f=>setFacilities([{label:"All",value:""},...f])); },[]);
  useEffect(()=>{
    setErr("");
    fetchSexAge(filters).then(d=>{
      const by_sex = Array.isArray(d?.by_sex)? d.by_sex : [];
      const by_age = (Array.isArray(d?.by_age)? d.by_age : []).filter(a=>{
        const band = (a.age_band ?? a.band ?? "").toString().trim();
        return band !== "" && !band.startsWith("-");
      });
      setData({by_sex, by_age});
    }).catch(e=>{ setErr(e.message); setData({by_sex:[],by_age:[]}); });
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

      <div className="card" style={{height:320}}>
        <h4 style={{margin:"0 0 8px"}}>By Sex</h4>
        {data.by_sex.length===0 ? <p>No data for current filters.</p> : (
          <ResponsiveContainer width="100%" height="88%">
            <BarChart data={data.by_sex}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="sex" />
              <YAxis />
              <Tooltip /><Legend />
              <Bar dataKey="total" name="Total" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="card" style={{height:320}}>
        <h4 style={{margin:"0 0 8px"}}>By Age band</h4>
        {data.by_age.length===0 ? <p>No data for current filters.</p> : (
          <ResponsiveContainer width="100%" height="88%">
            <BarChart data={data.by_age}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={(o)=>o.age_band ?? o.band} />
              <YAxis />
              <Tooltip /><Legend />
              <Bar dataKey="total" name="Total" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
