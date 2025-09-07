import React, { useEffect, useMemo, useState } from "react";
import { api } from "./api";

export default function DataEntry() {
  const [opts, setOpts] = useState(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [fileMsg, setFileMsg] = useState("");
  const [fileErr, setFileErr] = useState("");
  const [hostType, setHostType] = useState("");

  useEffect(() => { api.options().then(setOpts).catch(e => setErr(e.message)); }, []);

  const onSubmit = async (e) => {
    e.preventDefault();
    setMsg(""); setErr("");
    const form = e.currentTarget; // capture before await to avoid null reset
    const fd = new FormData(form);
    const payload = Object.fromEntries(fd.entries());

    // If ANIMAL and no animal_species typed/selected -> error early
    if ((payload.host_type || "").toUpperCase() === "ANIMAL" && !(payload.animal_species || "").trim()) {
      setErr("Animal species is required when Host Type is ANIMAL.");
      return;
    }

    payload.age = (payload.age || "").trim();
    setSaving(true);
    try {
      const res = await api.createEntry(payload);
      setMsg(res.message || "Saved.");
      if (form && typeof form.reset === "function") form.reset();
      setHostType("");
    } catch (ex) {
      setErr(ex.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const onUpload = async (e) => {
    e.preventDefault();
    setFileMsg(""); setFileErr("");
    const form = e.currentTarget; // capture
    const file = form.file?.files?.[0];
    if (!file) { setFileErr("Choose a CSV or Excel file."); return; }
    try {
      const res = await api.uploadFile(file);
      const text = typeof res === "string" ? res : `${res.message} Imported: ${res.imported}, Errors: ${res.errors?.length || 0}`;
      setFileMsg(text);
      if (form && typeof form.reset === "function") form.reset();
    } catch (ex) {
      setFileErr(ex.message || "Upload failed");
    }
  };

  // Generic combo (select or type): uses <input list="..."> + <datalist>
  const Combo = ({ id, label, list = [], required = false, onChange, type="text" }) => {
    const listId = `${id}-list`;
    return (
      <label className="text-sm flex flex-col gap-1">
        <span className="text-gray-600">{label}</span>
        <input id={id} name={id} list={listId} required={required} type={type}
               onChange={onChange}
               className="px-2 py-1 rounded border bg-white" autoComplete="off" />
        <datalist id={listId}>
          {list.map(v => <option key={v} value={v} />)}
        </datalist>
      </label>
    );
  };

  const Input = ({id,label,type="text",...rest}) => (
    <label className="text-sm flex flex-col gap-1">
      <span className="text-gray-600">{label}</span>
      <input id={id} name={id} type={type} className="px-2 py-1 rounded border bg-white" {...rest}/>
    </label>
  );

  return (
    <section>
      <h2 className="text-xl font-bold mb-4">Data Entry</h2>

      {/* MANUAL ENTRY */}
      <div className="rounded-xl bg-white shadow p-4 mb-6">
        <h3 className="font-semibold mb-3">Manual Entry (GLASS + One Health)</h3>
        {msg && <div className="mb-3 rounded bg-green-100 text-green-800 p-3">{msg}</div>}
        {err && <div className="mb-3 rounded bg-red-100 text-red-700 p-3">{err}</div>}

        {!opts ? <p className="text-sm text-gray-500">Loading form options…</p> : (
          <form onSubmit={onSubmit} className="grid md:grid-cols-3 gap-4">
            <Input id="patient_id" label="Patient ID" required />
            <Combo id="sex" label="Sex" list={opts.sex} required />
            <Input id="age" label="Age (years)" type="number" min="0" max="120" required />

            <Combo id="specimen_type" label="Specimen Type" list={opts.specimen_types} required />
            <Combo id="organism" label="Organism" list={opts.organisms} required />
            <Combo id="antibiotic" label="Antibiotic" list={opts.antibiotics} required />

            <Combo id="ast_result" label="AST Result" list={opts.ast_results} required />
            {/* Native calendar picker */}
            <Input id="test_date" label="Test Date" type="date" required />

            <Combo id="facility" label="Facility" list={opts.facilities} required />
            <Combo
              id="host_type"
              label="Host Type"
              list={opts.host_types}
              required
              onChange={(e)=>setHostType((e.target.value||"").toUpperCase())}
            />
            {/* Conditional Animal Species */}
            {hostType === "ANIMAL" && (
              <Combo id="animal_species" label="Animal Species" list={opts.animal_species} required />
            )}

            <Combo id="patient_type" label="Patient Type" list={opts.patient_types} required />

            <div className="flex items-end">
              <button disabled={saving} className="px-4 py-2 rounded bg-teal-600 text-white">
                {saving ? "Saving…" : "Save Record"}
              </button>
            </div>
          </form>
        )}
        <p className="mt-3 text-xs text-gray-600">
          * WHO GLASS minimum fields retained. One Health extension: <b>host_type</b> (HUMAN/ANIMAL/ENVIRONMENT) and conditional <b>animal_species</b> for ANIMAL.
        </p>
      </div>

      {/* BULK UPLOAD */}
      <div className="rounded-xl bg-white shadow p-4">
        <h3 className="font-semibold mb-3">Bulk Upload (CSV / Excel)</h3>
        {fileMsg && <div className="mb-3 rounded bg-green-100 text-green-800 p-3">{fileMsg}</div>}
        {fileErr && <div className="mb-3 rounded bg-red-100 text-red-700 p-3">{fileErr}</div>}
        <div className="flex flex-col md:flex-row gap-3 items-start">
          <form onSubmit={onUpload} className="flex gap-3 items-center">
            <input name="file" type="file" accept=".csv,.xlsx,.xls" className="px-2 py-1 rounded border bg-white" />
            <button className="px-4 py-2 rounded bg-teal-600 text-white">Upload</button>
          </form>
          <button onClick={() => window.open((import.meta.env.VITE_API_BASE || "http://localhost:8000") + "/api/templates/csv", "_blank")}
                  className="px-4 py-2 rounded bg-gray-700 text-white">
            Download CSV Template
          </button>
        </div>
        <p className="mt-3 text-xs text-gray-600">
          Columns: patient_id, sex, age, specimen_type, organism, antibiotic, ast_result, test_date, facility, host_type, patient_type, animal_species (required if host_type=ANIMAL).
        </p>
      </div>
    </section>
  );
}
