import React,{useState} from "react";
import { openReport } from "../api";
import { ANTIBIOTICS, ORGANISMS, HOSTS } from "../constants";
import FilterBar from "../components/FilterBar";

export default function Reports(){
  const [filters,setFilters]=useState({antibiotic:"",organism:"",host:"",facility:""});
  const qs = new URLSearchParams(Object.fromEntries(Object.entries(filters).filter(([,v])=>v))).toString();

  const clientPrint = (title)=>{
    const html = `
      <html><head><title>${title}</title>
      <style>body{font-family:system-ui,sans-serif;padding:24px} h1{margin:0 0 8px}</style>
      </head><body>
        <h1>${title}</h1>
        <p>Filters: ${qs || "All"}</p>
        <p>This is a print-friendly stub. If your backend exposes PDF endpoints, use the buttons below.</p>
      </body></html>`;
    const w = window.open("", "_blank"); w.document.write(html); w.document.close(); w.focus(); w.print();
  };

  return (
    <div className="grid" style={{gap:16}}>
      <FilterBar
        items={[
          {name:"antibiotic",label:"Antibiotic",value:filters.antibiotic,options:ANTIBIOTICS},
          {name:"organism",label:"Organism",value:filters.organism,options:ORGANISMS},
          {name:"host",label:"Host Type",value:filters.host,options:HOSTS},
          {name:"facility",label:"Facility",value:filters.facility,options:[{label:"All",value:""}]},
        ]}
        onChange={(k,v)=>setFilters(s=>({...s,[k]:v}))}
      />

      <div className="grid autofit">
        <div className="card">
          <h4 style={{margin:"0 0 8px"}}>Unit-Specific Antibiogram</h4>
          <div className="grid" style={{gridTemplateColumns:"auto auto", gap:8}}>
            <button className="btn" onClick={()=>clientPrint("Unit-Specific Antibiogram")}>Print now</button>
            <button className="btn primary" onClick={()=>openReport(`/reports/antibiogram?${qs}`)}>Server PDF</button>
          </div>
        </div>

        <div className="card">
          <h4 style={{margin:"0 0 8px"}}>Monthly Summary Report</h4>
          <div className="grid" style={{gridTemplateColumns:"auto auto", gap:8}}>
            <button className="btn" onClick={()=>clientPrint("Monthly Summary Report")}>Print now</button>
            <button className="btn primary" onClick={()=>openReport(`/reports/monthly?${qs}`)}>Server PDF</button>
          </div>
        </div>

        <div className="card">
          <h4 style={{margin:"0 0 8px"}}>Public Health Export</h4>
          <div className="grid" style={{gridTemplateColumns:"auto auto", gap:8}}>
            <button className="btn" onClick={()=>clientPrint("Public Health Export")}>Print now</button>
            <button className="btn primary" onClick={()=>openReport(`/reports/public-health?${qs}`)}>Server PDF</button>
          </div>
        </div>
      </div>
    </div>
  );
}
