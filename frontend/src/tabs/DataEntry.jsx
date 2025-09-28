import WHONETUploader from '../components/WHONETUploader';
import BulkUpload from "../components/BulkUpload";
import React, { useEffect, useMemo, useState } from "react";
import { options, createEntry, uploadCSV } from "../api";

const Section = ({title, children}) => (
  <div style={{marginTop:16}}>
    <div style={{fontWeight:'600', marginBottom:6}}>{title}</div>
    {children}
  </div>
);

const Input = ({label, ...p}) => (
  <label style={{display:'grid', gridTemplateColumns:'160px 1fr', gap:8, alignItems:'center', marginBottom:8}}>
    <span style={{color:'#444'}}>{label}</span>
    <input {...p} style={{padding:'8px', border:'1px solid #ddd', borderRadius:8}} />
  </label>
);

const Select = ({label, children, ...p}) => (
  <label style={{display:'grid', gridTemplateColumns:'160px 1fr', gap:8, alignItems:'center', marginBottom:8}}>
    <span style={{color:'#444'}}>{label}</span>
    <select {...p} style={{padding:'8px', border:'1px solid #ddd', borderRadius:8}}>
      {children}
    </select>
  </label>
);

export default function DataEntry(){
  const [tab, setTab] = useState("manual"); // manual | bulk
  const [opts, setOpts] = useState(null);
  const [status, setStatus] = useState("");

  // manual form state
  const [f, setF] = useState({
    patient_id:"", sex:"UNKNOWN", age:"", specimen_type:"",
    organism:"", antibiotic:"", ast_result:"", test_date:"",
    facility:"", host_type:"HUMAN", patient_type:"UNKNOWN"
  });

  useEffect(()=>{
    let on = true;
    options().then(o => { if(on) setOpts(o) }).catch(e=> setStatus(String(e)));
    return ()=>{ on = false }
  },[]);

  const onChange = (k)=>(e)=> setF(s=> ({...s, [k]: e.target.value}));

  async function saveManual(){
    setStatus("Saving...");
    try{
      const payload = {
        ...f,
        age: f.age === "" ? null : Number(f.age),
      };
      const res = await createEntry(payload);
      setStatus(`Saved ✔ (id ${res.id})`);
      // clear only some fields
      setF(s=> ({...s, patient_id:"", age:"", ast_result:"", test_date:""}));
    }catch(e){
      setStatus(e.message || "Save failed");
    }
  }

  // bulk upload
  const [file, setFile] = useState(null);
  async function doUpload(){
    setStatus("Uploading...");
    try{
      const fd = new FormData();
      fd.append("file", file);
      const res = await uploadCSV(fd);
      setStatus(res.message || "Upload complete");
    }catch(e){
      setStatus(e.message || "Upload failed");
    }
  }

  const enumOpt = (arr)=> (arr||[]).map(v=> <option key={v} value={v}>{v}</option>)

  return (
    <div style={{padding:16}}>
      <div style={{display:'flex', gap:8, marginBottom:12}}>
        <button onClick={()=>setTab("manual")}
          style={{padding:'8px 12px', borderRadius:10, border:'1px solid #ddd',
                  background: tab==="manual" ? "#0ea5e9" : "#fff",
                  color: tab==="manual" ? "#fff" : "#111"}}>
          Manual Entry
        </button>
        <button onClick={()=>setTab("bulk")}
          style={{padding:'8px 12px', borderRadius:10, border:'1px solid #ddd',
                  background: tab==="bulk" ? "#0ea5e9" : "#fff",
                  color: tab==="bulk" ? "#fff" : "#111"}}>
          Bulk Upload (CSV)
      <BulkUpload />
        </button>
      </div>

      {tab === "manual" && (
        <div>
          <Section title="Patient">
            <Input label="Patient ID *" value={f.patient_id} onChange={onChange('patient_id')} />
            <Select label="Sex *" value={f.sex} onChange={onChange('sex')}>
              {enumOpt(["M","F","UNKNOWN"])}
            </Select>
            <Input label="Age (years)" type="number" min="0" max="120" value={f.age} onChange={onChange('age')} />
            <Select label="Patient Type" value={f.patient_type} onChange={onChange('patient_type')}>
              {enumOpt(["INPATIENT","OUTPATIENT","UNKNOWN"])}
            </Select>
          </Section>

          <Section title="Lab Test">
            <Input label="Specimen Type *" value={f.specimen_type} onChange={onChange('specimen_type')} placeholder="Blood / Urine / ..." />
            <Input label="Organism *" value={f.organism} onChange={onChange('organism')} placeholder="Start typing…" />
            <Input label="Antibiotic *" value={f.antibiotic} onChange={onChange('antibiotic')} placeholder="Start typing…" />
            <Select label="AST Result *" value={f.ast_result} onChange={onChange('ast_result')}>
              {enumOpt(["R","I","S"])}
            </Select>
            <Input label="Test Date *" type="date" value={f.test_date} onChange={onChange('test_date')} />
          </Section>

          <Section title="Context">
            <Select label="Host Type *" value={f.host_type} onChange={onChange('host_type')}>
              {enumOpt(["HUMAN","ANIMAL","ENVIRONMENT","FOOD","OTHER"])}
            </Select>
            <Input label="Facility *" value={f.facility} onChange={onChange('facility')} placeholder="Start typing…" />
          </Section>

          <div style={{marginTop:12}}>
            <button onClick={saveManual}
              style={{padding:'8px 14px', borderRadius:10, border:'1px solid #0ea5e9', background:'#0ea5e9', color:'#fff'}}>
              Save
            </button>
          </div>
        </div>
      )}

      {tab === "bulk" && (
        <div>
          <Section title="Upload CSV">
            <button onClick={doUpload}
              style={{marginLeft:8, padding:'8px 14px', borderRadius:10, border:'1px solid #0ea5e9', background:'#0ea5e9', color:'#fff'}}>
              Upload
            </button>
            <div style={{marginTop:8}}>
              <a href="/templates/amr_template.csv" download>Download CSV template</a>
            </div>
          </Section>
        </div>
      )}

      {status && <div style={{marginTop:12, color:'#334155'}}>{status}</div>}
    </div>
  )
}
