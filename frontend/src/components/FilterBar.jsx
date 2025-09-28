import { useFilters, defaultFilters } from "../filters";

export default function FilterBar() {
  const { filters, setFilters, lists, loading, ALL } = useFilters();

  const change = (key) => (e) => setFilters({ ...filters, [key]: e.target.value });
  const reset = () => setFilters(defaultFilters);

  return (
    <div style={wrap}>
      <Field label="Host">
        <select value={filters.host_type} onChange={change("host_type")} disabled={loading}>
          {lists.hosts?.map(v => <option key={v} value={v}>{v}</option>)}
        </select>
      </Field>

      {filters.host_type === "ENVIRONMENT" && (
        <Field label="Environment Type">
          <select value={filters.environment_type || "All"} onChange={change("environment_type")} disabled={loading}>
            {lists.environment_types?.map(v => <option key={v} value={v}>{v}</option>)}
          </select>
        </Field>
      )}

      {filters.host_type === "ANIMAL" && (
        <Field label="Animal Species">
          <select value={filters.animal_species || "All"} onChange={change("animal_species")} disabled={loading}>
            {lists.animal_species?.map(v => <option key={v} value={v}>{v}</option>)}
          </select>
        </Field>
      )}

      <Field label="Organism">
        <select value={filters.organism} onChange={change("organism")} disabled={loading}>
          {lists.organisms?.map(v => <option key={v} value={v}>{v}</option>)}
        </select>
      </Field>
      <Field label="Antibiotic">
        <select value={filters.antibiotic} onChange={change("antibiotic")} disabled={loading}>
          {lists.antibiotics?.map(v => <option key={v} value={v}>{v}</option>)}
        </select>
      </Field>
      <Field label="Facility">
        <select value={filters.facility} onChange={change("facility")} disabled={loading}>
          {lists.facilities?.map(v => <option key={v} value={v}>{v}</option>)}
        </select>
      </Field>
      <Field label="Patient Type">
        <select value={filters.patient_type} onChange={change("patient_type")} disabled={loading}>
          {lists.patient_types?.map(v => <option key={v} value={v}>{v}</option>)}
        </select>
      </Field>
      <button onClick={reset} title="Reset to All" style={btn}>Reset</button>
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

const wrap = { display:"grid", gridTemplateColumns:"repeat(6,1fr)", gap:8, marginBottom:12, alignItems:"end" };
const btn = { height:36, borderRadius:8, border:"1px solid #ddd", background:"#f8fafc", cursor:"pointer" };
