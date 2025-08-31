import React, { useMemo, useState } from "react";
import { api } from "../api";

const SUGGEST = {
  sex: ["M","F"],
  specimen: ["urine","blood","stool","csf","sputum"],
  organism: ["E. coli","Klebsiella","S. aureus","Pseudomonas","Enterococcus"],
  antibiotic: ["Ciprofloxacin","Ceftriaxone","Gentamicin","Ampicillin","Meropenem"],
  ast: ["S","I","R"],
  host: ["human","animal","environment"],
};

function SmartInput({label, name, value, onChange, list=[], placeholder, type='text'}) {
  const [mode,setMode] = useState(list.length ? "pick" : "type");
  return (
    <label className="card" style={{gap:6}}>
      <div className="small" style={{display:"flex",justifyContent:"space-between"}}>
        <span>{label}</span>
        {list.length>0 && (
          <span className="small">
            <button type="button" className="subtab" onClick={()=>setMode("pick")} disabled={mode==="pick"}>Pick</button>
            <button type="button" className="subtab" onClick={()=>setMode("type")} disabled={mode==="type"}>Type</button>
          </span>
        )}
      </div>
      {mode==="pick" && (
        <select value={value} onChange={e=>onChange(name, e.target.value)}>
          <option value="">— select —</option>
          {list.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
      )}
      {mode==="type" && (
        <input type={type} value={value} placeholder={placeholder}
               onChange={e=>onChange(name, e.target.value)} />
      )}
    </label>
  );
}

export default function DataEntry(){
  const [form,setForm] = useState({
    date: "", patient_id: "", sex: "", age: "",
    specimen: "", organism: "", antibiotic: "",
    ast: "", host: "", facility: ""
  });
  const [busy,setBusy] = useState(false);
  const [msg,setMsg] = useState("");

  const canSubmit = useMemo(()=>{
    return form.date && form.patient_id && form.sex && form.specimen &&
           form.organism && form.antibiotic && form.ast && form.host && form.facility;
  }, [form]);

  function onChange(name,val){ setForm(f=>({ ...f, [name]: val })); }

  async function onSubmit(e){
    e.preventDefault();
    if (!canSubmit || busy) return;
    setBusy(true); setMsg("");
    const payload = { ...form };
    // age: send only if valid; empty -> drop
    if (payload.age === "" || payload.age === null || Number.isNaN(Number(payload.age))) {
      delete payload.age;
    } else {
      payload.age = Number(payload.age);
    }
    try{
      const res = await api.createOne(payload);
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`HTTP ${res.status} - ${txt}`);
      }
      setMsg("Saved ✔");
      setForm(f=>({ ...f, patient_id:"", facility:"" })); // keep other fields for speed
    }catch(err){
      setMsg(`Submit failed: ${String(err.message || err)}`);
    }finally{
      setBusy(false);
    }
  }

  // CSV bulk upload (very basic CSV: header names match form keys or aliases)
  async function onCsv(e){
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const lines = text.split(/\r?\n/).filter(Boolean);
    if (lines.length < 2) { setMsg("CSV has no data rows"); return; }
    const headers = lines[0].split(",").map(h=>h.trim());
    const rows = lines.slice(1).map(line=>{
      const cols = line.split(","); const row = {};
      headers.forEach((h,i)=>row[h]=cols[i]?.trim() ?? "");
      // age cleanup
      if (row.age === "" || row.age == null || Number.isNaN(Number(row.age))) delete row.age;
      else row.age = Number(row.age);
      return row;
    });

    setBusy(true); setMsg("");
    try{
      const res = await api.createBulk(rows);
      const body = await res.text();
      if (!res.ok) throw new Error(`HTTP ${res.status} - ${body}`);
      setMsg(`Bulk result: ${body}`);
    }catch(err){
      setMsg(`Bulk failed: ${String(err.message || err)}`);
    }finally{
      setBusy(false);
    }
  }

  return (
    <section className="card">
      <h2 className="section-title">Data Entry</h2>

      <form onSubmit={onSubmit} className="grid">
        <SmartInput label="Date" name="date" value={form.date} onChange={onChange} type="date" />
        <SmartInput label="Patient ID" name="patient_id" value={form.patient_id} onChange={onChange} />
        <SmartInput label="Sex" name="sex" value={form.sex} onChange={onChange} list={SUGGEST.sex} />
        <SmartInput label="Age (years)" name="age" value={form.age} onChange={onChange} type="number" />
        <SmartInput label="Specimen" name="specimen" value={form.specimen} onChange={onChange} list={SUGGEST.specimen} />
        <SmartInput label="Organism" name="organism" value={form.organism} onChange={onChange} list={SUGGEST.organism} />
        <SmartInput label="Antibiotic" name="antibiotic" value={form.antibiotic} onChange={onChange} list={SUGGEST.antibiotic} />
        <SmartInput label="AST (S/I/R)" name="ast" value={form.ast} onChange={onChange} list={SUGGEST.ast} />
        <SmartInput label="Host" name="host" value={form.host} onChange={onChange} list={SUGGEST.host} />
        <SmartInput label="Facility" name="facility" value={form.facility} onChange={onChange} />

        <div>
          <button className="button" type="submit" disabled={!canSubmit || busy}>
            {busy ? "Saving..." : "Submit"}
          </button>
          <span className="small" style={{marginLeft:12}}>{msg}</span>
        </div>
      </form>

      <div className="card" style={{marginTop:16}}>
        <div className="small">CSV upload (headers like: date,patient_id,sex,age,specimen,organism,antibiotic,ast,host,facility)</div>
        <input type="file" accept=".csv,text/csv" onChange={onCsv} />
      </div>
    </section>
  );
}
