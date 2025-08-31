import React, { useEffect, useState } from "react";
import { apiFetch } from "../api";
import HostFilter from "../components/HostFilter";

const SPECIMENS = ["Blood","Urine","Stool","CSF","Water"];
const ORGANISMS = ["E.coli","Klebsiella","Staphylococcus aureus","Pseudomonas","Salmonella","Streptococcus pneumoniae","Enterococcus faecalis"];
const ANTIBIOTICS = ["Penicillin","Ampicillin","Ceftriaxone","Ciprofloxacin","Meropenem","Vancomycin","Gentamicin","Amoxicillin"];

export default function ManualEntry(){
  const [host, setHost] = useState("human");
  const [form, setForm] = useState({ host_type:"human" });
  const [ok, setOk] = useState("");
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => { setForm(f => ({...f, host_type: host||"human"})); }, [host]);
  const setField = (k,v) => setForm(f => ({...f, [k]: v}));

  async function submit(e){
    e.preventDefault();
    setSaving(true); setOk(""); setErr("");
    try{
      const res = await apiFetch("/api/manual-entry/", {
        method:"POST", headers:{ "Content-Type":"application/json" },
        body: JSON.stringify(form)
      });
      const j = await res.json().catch(()=>({}));
      if(!res.ok){ setErr(JSON.stringify(j,null,2)); return; }
      setOk("Saved successfully."); setForm({ host_type: host||"human" });
    }catch(ex){ setErr(String(ex)); } finally{ setSaving(false); }
  }

  return (
    <>
      <h2 className="h2">Manual Data Entry</h2>
      <div className="card">
        <form className="form" onSubmit={submit}>
          <div className="row"><label className="label">Host</label><HostFilter value={host} onChange={setHost}/></div>
          <div className="row"><label className="label">Patient ID*</label><input className="input" value={form.patient_id||""} onChange={e=>setField("patient_id",e.target.value)} /></div>
          <div className="row"><label className="label">Sex*</label>
            <select className="select" value={form.sex||""} onChange={e=>setField("sex",e.target.value)}>
              <option value="">Select</option><option>Male</option><option>Female</option>
            </select>
          </div>
          <div className="row"><label className="label">Age*</label><input type="number" className="input" value={form.age||""} onChange={e=>setField("age",e.target.value)} /></div>
          <div className="row"><label className="label">Specimen*</label>
            <select className="select" value={form.specimen_type||""} onChange={e=>setField("specimen_type",e.target.value)}>
              <option value="">Select specimen</option>{SPECIMENS.map(s=><option key={s}>{s}</option>)}
            </select>
          </div>
          <div className="row"><label className="label">Organism*</label>
            <select className="select" value={form.organism||""} onChange={e=>setField("organism",e.target.value)}>
              <option value="">Select organism</option>{ORGANISMS.map(s=><option key={s}>{s}</option>)}
            </select>
          </div>
          <div className="row"><label className="label">Antibiotic*</label>
            <select className="select" value={form.antibiotic||""} onChange={e=>setField("antibiotic",e.target.value)}>
              <option value="">Select antibiotic</option>{ANTIBIOTICS.map(s=><option key={s}>{s}</option>)}
            </select>
          </div>
          <div className="row"><label className="label">AST Result*</label>
            <select className="select" value={form.ast_result||""} onChange={e=>setField("ast_result",e.target.value)}>
              <option value="">Select</option><option value="S">S (Susceptible)</option><option value="I">I (Intermediate)</option><option value="R">R (Resistant)</option>
            </select>
          </div>
          <div className="row"><label className="label">Test Date*</label><input className="input" placeholder="dd/mm/yyyy" value={form.test_date||""} onChange={e=>setField("test_date",e.target.value)} /></div>
          <div className="row"><label className="label">Facility*</label><input className="input" value={form.facility||""} onChange={e=>setField("facility",e.target.value)} /></div>
          <div className="row"><label className="label">City (optional)</label><input className="input" value={form.city||""} onChange={e=>setField("city",e.target.value)} /></div>
          <button className="btn" type="submit" disabled={saving}>{saving ? "Saving…" : "Save"}</button>
          {ok && <div className="alert-ok">{ok}</div>}
          {err && <div className="alert-err">{err}</div>}
        </form>
      </div>
    </>
  );
}
