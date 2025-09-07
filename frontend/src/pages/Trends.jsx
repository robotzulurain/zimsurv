import React,{useEffect,useMemo,useState} from "react";
import { fetchTimeTrend, fetchFacilities } from "../api";
import { ANTIBIOTICS, ORGANISMS, HOSTS, SEXES } from "../constants";
import FilterBar from "../components/FilterBar";
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from "recharts";

export default function Trends(){
  const [facilities,setFacilities]=useState([{label:"All",value:""}]);
  const [filters,setFilters]=useState({antibiotic:"",organism:"",host:"",facility:"",sex:""});
  const [dateFrom,setDateFrom]=useState("");
  const [dateTo,setDateTo]=useState("");
  const [rows,setRows]=useState([]);
  const [err,setErr]=useState("");

  useEffect(()=>{ fetchFacilities().then(f=>setFacilities([{label:"All",value:""},...f])); },[]);
  useEffect(()=>{
    setErr("");
    fetchTimeTrend({ ...filters, date_from:dateFrom, date_to:dateTo, period:"month" })
      .then(d=> Array.isArray(d)? setRows(d): setRows([]))
      .catch(e=>{ setErr(e.message); setRows([]); });
  },[filters,dateFrom,dateTo]);

  const data = useMemo(()=> (rows||[]).map(d=>({
    month: d.month ?? d.period ?? "",
    total: Number(d.total ?? 0),
    r_rate: Number(d.r_rate ?? d.resistance_rate ?? 0),
  })),[rows]);

  return (
    <div className="grid" style={{gap:16}}>
      <FilterBar
        items={[
          {name:"antibiotic",label:"Antibiotic",value:filters.antibiotic,options:ANTIBIOTICS},
          {name:"organism",label:"Organism",value:filters.organism,options:ORGANISMS},
          {name:"host",label:"Host Type",value:filters.host,options:HOSTS},
          {name:"facility",label:"Facility",value:filters.facility,options:facilities},
          {name:"sex",label:"Sex",value:filters.sex,options:SEXES},
        ]}
        onChange={(k,v)=>setFilters(s=>({...s,[k]:v}))}
        onDateChange={(k,v)=> k==="date_from"? setDateFrom(v): setDateTo(v)}
        dateFrom={dateFrom} dateTo={dateTo}
      />
      {err && <p style={{color:"crimson"}}>Error: {err}</p>}
      {data.length===0 ? <p>No data for current filters.</p> : (
        <>
          <div className="card" style={{height:320}}>
            <h4 style={{margin:"0 0 8px"}}>Monthly totals</h4>
            <ResponsiveContainer width="100%" height="88%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="total" name="Total" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="card" style={{height:320}}>
            <h4 style={{margin:"0 0 8px"}}>Monthly resistance rate</h4>
            <ResponsiveContainer width="100%" height="88%">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis domain={[0,1]} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="r_rate" name="R rate (0–1)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
}
