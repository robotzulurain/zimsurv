import BulkUpload from "./BulkUpload";
import { useEffect, useMemo, useState } from "react";
import { options, createEntry, uploadCSV } from "../api";
import { useFilters, applyFilters } from "../filters";

// --- Reference lists (extend anytime) ---
const GLASS_ORGS = [
  "Escherichia coli","Klebsiella pneumoniae","Staphylococcus aureus",
  "Pseudomonas aeruginosa","Acinetobacter baumannii","Salmonella spp","Enterococcus faecalis"
];
const GLASS_ABX = [
  "Ampicillin","Amoxicillin-Clavulanate","Ciprofloxacin","Gentamicin",
  "Ceftriaxone","Ceftazidime","Meropenem","Piperacillin-Tazobactam","Trimethoprim-Sulfamethoxazole"
];
const SPECIMENS = ["Blood","Urine","Stool","Sputum","Wound","CSF"];
const HOSTS = ["HUMAN","ANIMAL","ENVIRONMENT"];
const PATIENT_TYPES = ["INPATIENT","OUTPATIENT","UNKNOWN"];
const SEX = ["M","F","Unknown"];
const AST_VALUES = ["R","I","S"];

// optional fallbacks if backend doesn't send these
const FALLBACK_ANIMALS = ["Cattle","Goats","Sheep","Poultry","Pigs","Dogs","Cats","Wild birds","Rodents"];
const FALLBACK_ENV_TYPES = ["Water","Wastewater","Soil","Food","Surface swab","Air","Drinking water"];

// simple id for table rows
const uid = () => Math.random().toString(36).slice(2, 9);

// helper: prefer non-empty form value, otherwise use filter value (if not "All")
function pick(formVal, filterVal) {
  if (formVal) return formVal;
  if (filterVal && filterVal !== "All") return filterVal;
  return formVal;
}

export default function DataEntry() {
  const { filters } = useFilters();

  // facilities & extended lists pulled from backend options()
  const [opts, setOpts] = useState({
    facilities: [],
    animal_species: FALLBACK_ANIMALS,
    environment_types: FALLBACK_ENV_TYPES,
  });

  // messages
  const [msg, setMsg]   = useState(null);
  const [err, setErr]   = useState(null);
  const [csvMsg, setCsvMsg] = useState(null);

  // top section (patient/sample + organism)
  const [meta, setMeta] = useState({
    patient_id: "", sex: "", age: "",
    specimen_type: "", host_type: "",
    facility: "", test_date: "",
    patient_type: "",
    organism: "",
    // host-specific
    animal_species: "",
    environment_type: "",
  });

  // antibiotics table rows
  const [rows, setRows] = useState([{ id: uid(), antibiotic: "", ast_result: "" }]);

  // Bulk upload format
  const [uploadFormat, setUploadFormat] = useState("AUTO"); // AUTO | GLASS | WHONET

  // load facilities + host-specific lists once
  useEffect(() => {
    options({})
      .then(o => {
        const facilities =
          Array.isArray(o?.facilities)
            ? o.facilities.map(f => f?.name ?? f?.label ?? String(f)).filter(Boolean)
            : [];

        const animal_species = toList(o?.animal_species, FALLBACK_ANIMALS);
        const environment_types = toList(o?.environment_types, FALLBACK_ENV_TYPES);

        setOpts({ facilities, animal_species, environment_types });
      })
      .catch(() => {
        setOpts({
          facilities: [],
          animal_species: FALLBACK_ANIMALS,
          environment_types: FALLBACK_ENV_TYPES,
        });
      });
  }, []);

  // When global filters change, PREFILL empty fields in the form.
  // We never overwrite what the user has already typed.
  useEffect(() => {
    setMeta(m => {
      const isAnimal = filters.host_type === "ANIMAL";
      const isEnv    = filters.host_type === "ENVIRONMENT";
      return {
        ...m,
        host_type: pick(m.host_type, filters.host_type),
        facility: pick(m.facility, filters.facility),
        organism: pick(m.organism, filters.organism),
        patient_type: pick(m.patient_type, filters.patient_type),
        animal_species: isAnimal ? pick(m.animal_species, filters.animal_species) : "",
        environment_type: isEnv ? pick(m.environment_type, filters.environment_type) : "",
      };
    });
  }, [filters]);

  // helpers
  const onMeta = (e) => setMeta(m => {
    const next = { ...m, [e.target.name]: e.target.value };
    // when host changes, clear the other host-specific field
    if (e.target.name === "host_type") {
      if (e.target.value === "ANIMAL") {
        next.environment_type = "";
      } else if (e.target.value === "ENVIRONMENT") {
        next.animal_species = "";
      } else {
        next.animal_species = "";
        next.environment_type = "";
      }
    }
    return next;
  });
  const addRow = () => setRows(r => [...r, { id: uid(), antibiotic: "", ast_result: "" }]);
  const delRow = (id) => setRows(r => (r.length > 1 ? r.filter(x => x.id !== id) : r));
  const onRow  = (id, k, v) => setRows(r => r.map(x => x.id === id ? { ...x, [k]: v } : x));

  // validations
  function validateMeta() {
    if (!meta.patient_id) return "Patient ID is required.";
    if (!SEX.includes(meta.sex)) return "Sex must be M, F or Unknown.";
    const age = Number(meta.age);
    if (!(age >= 0 && age <= 120)) return "Age must be between 0 and 120.";
    if (!meta.specimen_type) return "Specimen type is required.";
    if (!meta.organism) return "Organism is required.";
    if (!meta.host_type) return "Host type is required.";
    if (meta.host_type === "ANIMAL" && !meta.animal_species) return "For ANIMAL host, Animal Species is required.";
    if (meta.host_type === "ENVIRONMENT" && !meta.environment_type) return "For ENVIRONMENT host, Environment Type is required.";
    if (!meta.facility) return "Facility is required.";
    if (!meta.test_date) return "Test date is required.";
    const d = new Date(meta.test_date);
    const today = new Date();
    if (isNaN(d.getTime())) return "Test date is invalid.";
    if (d > new Date(today.getFullYear(), today.getMonth(), today.getDate()))
      return "Test date cannot be in the future.";
    return null;
  }
  function validateRows() {
    if (!rows.length) return "Add at least one antibiotic row.";
    for (const r of rows) {
      if (!r.antibiotic) return "Antibiotic cannot be empty.";
      if (!AST_VALUES.includes(r.ast_result))
        return "AST Result must be R, I or S.";
    }
    return null;
  }

  // submit: create one backend record per antibiotic row
  async function submit(e) {
    e.preventDefault();
    setMsg(null); setErr(null); setCsvMsg(null);

    // Merge filters into meta as defaults (in case user left those fields blank)
    const metaWithFilters = mergeMetaWithFilters(meta, filters);

    const m = validateMetaMerged(metaWithFilters);
    if (m) { setErr(m); return; }

    const r = validateRows(); if (r) { setErr(r); return; }

    try {
      const payloads = rows.map(row => ({
        patient_id: metaWithFilters.patient_id,
        sex: metaWithFilters.sex,
        age: Number(metaWithFilters.age),
        specimen_type: metaWithFilters.specimen_type,
        organism: metaWithFilters.organism,
        antibiotic: row.antibiotic,
        ast_result: row.ast_result, // "R" | "I" | "S"
        test_date: metaWithFilters.test_date,
        host_type: metaWithFilters.host_type,
        animal_species: metaWithFilters.host_type === "ANIMAL" ? metaWithFilters.animal_species : undefined,
        environment_type: metaWithFilters.host_type === "ENVIRONMENT" ? metaWithFilters.environment_type : undefined,
        facility: metaWithFilters.facility,
        patient_type: metaWithFilters.patient_type || "UNKNOWN",
      }));

      await Promise.all(payloads.map(p => createEntry(p)));

      setMsg(`Saved ${payloads.length} record(s) for ${metaWithFilters.organism}.`);
      // reset but keep facility & host (and host-specific field) for faster entry
      setRows([{ id: uid(), antibiotic: "", ast_result: "" }]);
      setMeta(m => ({
        ...m,
        patient_id: "",
        sex: "",
        age: "",
        specimen_type: "",
        organism: "",
        test_date: "",
        patient_type: "",
        // keep host/facility prefilled from filters on the next effect tick
      }));
    } catch (e2) {
      setErr(String(e2));
    }
  }

  // CSV / Excel upload — send format hint + active filters (host/animal/env etc.)
  const activeFilterParams = useMemo(() => applyFilters(filters, {}), [filters]);
  async function onCSV(e) {
    setCsvMsg(null); setErr(null);
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      // Preferred: uploadCSV can accept a second arg (metadata). If your current
      // implementation only accepts (file), this extra arg will be ignored harmlessly.
      const res = await uploadCSV(file, {
        format: uploadFormat,
        filters: activeFilterParams,
      });
      setCsvMsg(typeof res === "string" ? res : "File uploaded.");
    } catch (e2) {
      setErr(String(e2));
    } finally {
      e.target.value = "";
    }
  }

  const isAnimal = meta.host_type === "ANIMAL";
  const isEnv    = meta.host_type === "ENVIRONMENT";

  // small UI helpers
  const card = { background:"#fff", border:"1px solid #eee", borderRadius:8, padding:12 };
  const grid3 = { display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12 };
  const td = () => ({ padding:"6px 8px", borderBottom:"1px solid #eee" });
  const th = () => ({ padding:"6px 8px", textAlign:"left", borderBottom:"1px solid #ddd", fontWeight:600, fontSize:13 });

  return (
    <div>
      <h2>Data Entry</h2>
      <p>Enter a patient/sample once, then add multiple antibiotics with S/I/R results. Or upload a CSV/XLSX file.</p>

      {err && <div style={{ background:"#fee2e2", border:"1px solid #fecaca", padding:8, borderRadius:8, marginBottom:8 }}>{err}</div>}
      {msg && <div style={{ background:"#dcfce7", border:"1px solid #bbf7d0", padding:8, borderRadius:8, marginBottom:8 }}>{msg}</div>}
      {csvMsg && <div style={{ background:"#e0e7ff", border:"1px solid #c7d2fe", padding:8, borderRadius:8, marginBottom:8 }}>{csvMsg}</div>}

      {/* Patient/Sample + Organism */}
      <form onSubmit={submit} style={{ ...card, marginBottom:16 }}>
        <div style={grid3}>
          <Field label="Patient ID">
            <input name="patient_id" value={meta.patient_id} onChange={onMeta} required />
          </Field>

          <Field label="Sex">
            <select name="sex" value={meta.sex} onChange={onMeta} required>
              <option value="">Select</option>
              {SEX.map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </Field>

          <Field label="Age (years)">
            <input type="number" min="0" max="120" name="age" value={meta.age} onChange={onMeta} required />
          </Field>

          <Field label="Specimen Type">
            <input list="specimen_types" name="specimen_type" value={meta.specimen_type} onChange={onMeta} required />
            <datalist id="specimen_types">
              {SPECIMENS.map(v => <option key={v} value={v} />)}
            </datalist>
          </Field>

          <Field label="Organism">
            <input list="organisms" name="organism" value={meta.organism} onChange={onMeta} required />
            <datalist id="organisms">
              {GLASS_ORGS.map(v => <option key={v} value={v} />)}
            </datalist>
          </Field>

          <Field label="Test Date">
            <input type="date" name="test_date" value={meta.test_date} onChange={onMeta} required />
          </Field>

          <Field label="Host Type">
            <input list="host_types" name="host_type" value={meta.host_type} onChange={onMeta} required />
            <datalist id="host_types">
              {HOSTS.map(v => <option key={v} value={v} />)}
            </datalist>
          </Field>

          <Field label="Facility">
            <input list="facilities" name="facility" value={meta.facility} onChange={onMeta} required />
            <datalist id="facilities">
              {opts.facilities.map(v => <option key={v} value={v} />)}
            </datalist>
          </Field>

          <Field label="Patient Type">
            <input list="patient_types" name="patient_type" value={meta.patient_type ?? ""} onChange={onMeta} />
            <datalist id="patient_types">
              {PATIENT_TYPES.map(v => <option key={v} value={v} />)}
            </datalist>
          </Field>

          {/* Host-specific fields */}
          <Field label="Animal Species">
            <input
              list="animal_species"
              name="animal_species"
              value={meta.animal_species}
              onChange={onMeta}
              disabled={!isAnimal}
              placeholder={isAnimal ? "Type or select…" : "N/A"}
            />
            <datalist id="animal_species">
              {opts.animal_species.map(v => <option key={v} value={v} />)}
            </datalist>
          </Field>

          <Field label="Environment Type">
            <input
              list="environment_types"
              name="environment_type"
              value={meta.environment_type}
              onChange={onMeta}
              disabled={!isEnv}
              placeholder={isEnv ? "Type or select…" : "N/A"}
            />
            <datalist id="environment_types">
              {opts.environment_types.map(v => <option key={v} value={v} />)}
            </datalist>
          </Field>
        </div>

        {/* Antibiotics table */}
        <div style={{ marginTop:16 }}>
          <h3 style={{ marginBottom:8 }}>Antibiotic Results (S/I/R)</h3>
          <div style={{ overflowX:"auto" }}>
            <table style={{ width:"100%", borderCollapse:"collapse", fontSize:14 }}>
              <thead>
                <tr>
                  <th style={th()}>#</th>
                  <th style={th()}>Antibiotic</th>
                  <th style={th()}>AST Result</th>
                  <th style={th()}></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, idx) => (
                  <tr key={r.id}>
                    <td style={td()}>{idx + 1}</td>
                    <td style={td()}>
                      <input
                        list="antibiotics"
                        value={r.antibiotic}
                        onChange={e => onRow(r.id, "antibiotic", e.target.value)}
                        placeholder="Type or select…"
                        required
                        style={{ width:"100%" }}
                      />
                      <datalist id="antibiotics">
                        {GLASS_ABX.map(a => <option key={a} value={a} />)}
                      </datalist>
                    </td>
                    <td style={td()}>
                      <select
                        value={r.ast_result}
                        onChange={e => onRow(r.id, "ast_result", e.target.value)}
                        required
                        style={{ width:"100%" }}
                      >
                        <option value="">Select</option>
                        <option value="R">R (Resistant)</option>
                        <option value="I">I (Intermediate)</option>
                        <option value="S">S (Susceptible)</option>
                      </select>
                    </td>
                    <td style={td()}>
                      <button type="button" onClick={() => delRow(r.id)} disabled={rows.length === 1}>
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ marginTop:8, display:"flex", gap:8 }}>
            <button type="button" onClick={addRow}>+ Add antibiotic</button>
            <div style={{ flex:1 }} />
            <button type="submit">Save all</button>
          </div>
        </div>
      </form>

      {/* CSV/XLSX Upload */}
      <div style={card}>
        <h3>Bulk Upload (CSV/XLSX)</h3>
      <BulkUpload />
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:8 }}>
          <label style={{ display:"grid", gap:4 }}>
            <span style={{ fontSize:12, color:"#6b7280" }}>File format</span>
            <select value={uploadFormat} onChange={e=>setUploadFormat(e.target.value)}>
              <option value="AUTO">Auto-detect</option>
              <option value="GLASS">GLASS (one row per antibiotic)</option>
              <option value="WHONET">WHONET export</option>
            </select>
          </label>
          <div style={{ alignSelf:"end", fontSize:12, color:"#6b7280" }}>
            {uploadFormat === "WHONET"
              ? "Tip: Export from WHONET with patient/sample and AST results. Backend will map common WHONET fields."
              : "Expected columns: patient_id, sex, age, specimen_type, organism, antibiotic, ast_result, test_date, host_type, facility, patient_type"}
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label style={{ display:"grid", gap:4 }}>
      <span style={{ fontSize:12, color:"#6b7280" }}>{label}</span>
      {children}
    </label>
  );
}

function toList(val, fallback = []) {
  if (!val) return fallback;
  if (Array.isArray(val)) return val.map(v => (typeof v === "string" ? v : (v?.name ?? v?.label ?? String(v)))).filter(Boolean);
  if (typeof val === "object") return Object.values(val).map(v => String(v)).filter(Boolean);
  return String(val).split(",").map(s => s.trim()).filter(Boolean);
}

// Merge active filters into meta (without clobbering explicit form fields)
function mergeMetaWithFilters(meta, filters) {
  const out = { ...meta };
  if (!out.host_type && filters.host_type !== "All") out.host_type = filters.host_type;
  if (!out.facility && filters.facility !== "All") out.facility = filters.facility;
  if (!out.organism && filters.organism !== "All") out.organism = filters.organism;
  if (!out.patient_type && filters.patient_type !== "All") out.patient_type = filters.patient_type;
  if (filters.host_type === "ANIMAL" && !out.animal_species && filters.animal_species !== "All") {
    out.animal_species = filters.animal_species;
  }
  if (filters.host_type === "ENVIRONMENT" && !out.environment_type && filters.environment_type !== "All") {
    out.environment_type = filters.environment_type;
  }
  return out;
}

// Validate with merged meta (so filter-provided values count too)
function validateMetaMerged(m) {
  if (!m.patient_id) return "Patient ID is required.";
  if (!SEX.includes(m.sex)) return "Sex must be M, F or Unknown.";
  const age = Number(m.age);
  if (!(age >= 0 && age <= 120)) return "Age must be between 0 and 120.";
  if (!m.specimen_type) return "Specimen type is required.";
  if (!m.organism) return "Organism is required.";
  if (!m.host_type) return "Host type is required.";
  if (m.host_type === "ANIMAL" && !m.animal_species) return "For ANIMAL host, Animal Species is required.";
  if (m.host_type === "ENVIRONMENT" && !m.environment_type) return "For ENVIRONMENT host, Environment Type is required.";
  if (!m.facility) return "Facility is required.";
  if (!m.test_date) return "Test date is required.";
  const d = new Date(m.test_date);
  const today = new Date();
  if (isNaN(d.getTime())) return "Test date is invalid.";
  if (d > new Date(today.getFullYear(), today.getMonth(), today.getDate()))
    return "Test date cannot be in the future.";
  return null;
}
