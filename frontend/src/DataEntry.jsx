import UploadPanel from "./components/UploadPanel";
import React, { useState } from "react";
import ManageResults from "./components/ManageResults";

const API = import.meta.env.VITE_API_BASE || "http://localhost:8000";

export default function DataEntry() {
  const [form, setForm] = useState({
    patient_id: "",
    sex: "",
    age: "",
    specimen_type: "",
    organism: "",
    antibiotic: "",
    ast_result: "",
    test_date: "",
    facility: "",
    host_type: "",
    patient_type: "",
    animal_species: "",
  });
  const [err, setErr] = useState("");

  const token = typeof window !== "undefined" ? localStorage.getItem("amr_token") : null;

  function setField(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  }

  function validate() {
    const must = ["patient_id", "specimen_type", "organism", "antibiotic", "ast_result", "test_date"];
    for (const k of must) {
      if (!String(form[k] || "").trim()) return `Missing required field: ${k.replace("_", " ")}`;
    }
    if (form.age !== "" && Number.isFinite(Number(form.age)) && Number(form.age) < 0) {
      return "Age cannot be negative.";
    }
    if (form.host_type === "ANIMAL" && !String(form.animal_species || "").trim()) {
      return "Animal species is required when host_type is ANIMAL.";
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(form.test_date))) {
      return "Test date must be in format YYYY-MM-DD (use the date picker).";
    }
    return "";
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const v = validate();
    if (v) { setErr(v); return; }
    setErr("");

    const payload = {
      ...form,
      age: form.age === "" ? null : Number(form.age),
      animal_species: form.host_type === "ANIMAL" ? form.animal_species : "",
    };

    const res = await fetch(`${API}/api/entry`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Token ${token}` } : {}),
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok || data.ok === false) {
      setErr(data?.error || data?.detail || "Save failed");
      return;
    }

    alert("Saved!");
    setForm((f) => ({
      ...f,
      patient_id: "",
      age: "",
      organism: "",
      antibiotic: "",
      ast_result: "",
      test_date: "",
      animal_species: f.host_type === "ANIMAL" ? "" : f.animal_species,
    }));
  }

  return (
    <>
      <section className="card p-4">
        <div className="flex items-center justify-between gap-3 mb-2">
          <h2 className="text-lg font-semibold">Manual Entry (GLASS + One Health)</h2>
          <div className="flex gap-2">
            <a className="btn" href={`${API}/api/templates/csv`} target="_blank" rel="noreferrer">
              Download CSV Template
            </a>
            <a className="btn" href={`${API}/api/export/glass`} target="_blank" rel="noreferrer">
              GLASS Export (CSV)
            </a>
          </div>
        </div>

        {!token && (
          <div className="mb-3 rounded border border-amber-300 bg-amber-50 text-amber-800 px-3 py-2 text-sm">
            Login required (see <code>/login</code>) to save/delete.
          </div>
        )}

        {err && (
          <div className="mb-3 rounded border border-red-300 bg-red-50 text-red-700 px-3 py-2 text-sm">
            {err}
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-3">
          <L label="Patient ID *">
            <input
              className="w-full"
              placeholder="e.g., U12345"
              name="patient_id"
              value={form.patient_id}
              onChange={setField}
            />
          </L>

          <L label="Sex">
            <select className="w-full" name="sex" value={form.sex} onChange={setField}>
              <option value="">Select…</option>
              <option value="M">M</option>
              <option value="F">F</option>
              <option value="Unknown">Unknown</option>
            </select>
          </L>

          <L label="Age (years)">
            <input
              className="w-full"
              type="number"
              min="0"
              step="1"
              placeholder="e.g., 34"
              name="age"
              value={form.age}
              onChange={setField}
            />
          </L>

          <L label="Specimen Type *">
            <input
              className="w-full"
              placeholder="e.g., Urine, Blood, Stool"
              name="specimen_type"
              value={form.specimen_type}
              onChange={setField}
              list="specimen_presets"
            />
            <datalist id="specimen_presets">
              <option value="Urine" />
              <option value="Blood" />
              <option value="Stool" />
            </datalist>
          </L>

          <L label="Organism *">
            <input
              className="w-full"
              placeholder="e.g., Escherichia coli"
              name="organism"
              value={form.organism}
              onChange={setField}
              list="org_presets"
            />
            <datalist id="org_presets">
              <option value="Escherichia coli" />
              <option value="Klebsiella pneumoniae" />
              <option value="Staphylococcus aureus" />
              <option value="Pseudomonas aeruginosa" />
              <option value="Salmonella enterica" />
            </datalist>
          </L>

          <L label="Antibiotic *">
            <input
              className="w-full"
              placeholder="e.g., Ciprofloxacin"
              name="antibiotic"
              value={form.antibiotic}
              onChange={setField}
              list="abx_presets"
            />
            <datalist id="abx_presets">
              <option value="Amoxicillin" />
              <option value="Ceftriaxone" />
              <option value="Ciprofloxacin" />
              <option value="Gentamicin" />
              <option value="Meropenem" />
            </datalist>
          </L>

          <L label="AST Result *">
            <select className="w-full" name="ast_result" value={form.ast_result} onChange={setField}>
              <option value="">Select…</option>
              <option value="S">S</option>
              <option value="I">I</option>
              <option value="R">R</option>
            </select>
          </L>

          <L label="Test Date *">
            <input className="w-full" type="date" name="test_date" value={form.test_date} onChange={setField} />
          </L>

          <L label="Facility">
            <input
              className="w-full"
              placeholder="e.g., Harare Central Lab"
              name="facility"
              value={form.facility}
              onChange={setField}
              list="facility_presets"
            />
            <datalist id="facility_presets">
              <option value="Harare Central Lab" />
              <option value="Bulawayo Vic Lab" />
              <option value="Gweru Gen Lab" />
            </datalist>
          </L>

          <L label="Host Type">
            <select className="w-full" name="host_type" value={form.host_type} onChange={setField}>
              <option value="">Select…</option>
              <option value="HUMAN">HUMAN</option>
              <option value="ANIMAL">ANIMAL</option>
              <option value="ENVIRONMENT">ENVIRONMENT</option>
            </select>
          </L>

          {form.host_type === "ANIMAL" && (
            <L label="Animal Species (if ANIMAL)">
              <input
                className="w-full"
                placeholder="e.g., Cattle, Chicken, Dog"
                name="animal_species"
                value={form.animal_species}
                onChange={setField}
                list="species_presets"
              />
              <datalist id="species_presets">
                <option value="Cattle" />
                <option value="Goat" />
                <option value="Sheep" />
                <option value="Chicken" />
                <option value="Dog" />
                <option value="Cat" />
                <option value="Wildlife" />
              </datalist>
            </L>
          )}

          <L label="Patient Type">
            <select className="w-full" name="patient_type" value={form.patient_type} onChange={setField}>
              <option value="">Select…</option>
              <option value="Inpatient">Inpatient</option>
              <option value="Outpatient">Outpatient</option>
              <option value="Unknown">Unknown</option>
            </select>
          </L>

          <div className="md:col-span-2">
            <button type="submit" className="btn">Save Record</button>
            <span className="ml-3 text-xs text-gray-600">* Required per WHO GLASS minimums.</span>
          </div>
        </form>
      </section>

      <ManageResults />
      <UploadPanel />
    </>
  );
}

function L({ label, children }) {
  return (
    <label className="text-sm text-gray-800">
      <span className="block mb-1">{label}</span>
      {children}
    </label>
  );
}
