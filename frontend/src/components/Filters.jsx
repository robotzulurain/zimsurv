import React, { useEffect, useState } from "react";

/**
 * Adds conditional selects:
 *  - Host=ENVIRONMENT => Environment Type
 *  - Host=ANIMAL      => Animal Species
 * Nothing else changes visually.
 */
export default function Filters({ value, onChange, options }) {
  const [local, setLocal] = useState(value || {});
  useEffect(() => setLocal(value || {}), [value]);

  const setField = (k, v) => {
    const next = { ...local, [k]: v || undefined };
    if (k === "host_type") {
      if (v === "ENVIRONMENT") {
        next.animal_species = undefined;
      } else if (v === "ANIMAL") {
        next.environment_type = undefined;
      } else {
        next.environment_type = undefined;
        next.animal_species = undefined;
      }
    }
    setLocal(next);
    onChange?.(next);
  };

  const hosts        = options?.hosts || ["HUMAN","ANIMAL","ENVIRONMENT"];
  const envTypes     = options?.environment_types || [];
  const species      = options?.animal_species || [];
  const organisms    = options?.organisms || [];
  const antibiotics  = options?.antibiotics || [];
  const facilities   = options?.facilities || [];
  const patientTypes = options?.patient_types || [];

  return (
    <div className="filters flex flex-wrap items-center gap-3">
      {/* Host */}
      <div>
        <label className="block text-sm">Host</label>
        <select
          className="border rounded px-2 py-1"
          value={local.host_type || ""}
          onChange={(e) => setField("host_type", e.target.value)}
        >
          <option value="">All</option>
          {hosts.map((h) => <option key={h} value={h}>{h}</option>)}
        </select>
      </div>

      {/* Environment Type (Host=ENVIRONMENT) */}
      {local.host_type === "ENVIRONMENT" && (
        <div>
          <label className="block text-sm">Environment Type</label>
          <select
            className="border rounded px-2 py-1"
            value={local.environment_type || ""}
            onChange={(e) => setField("environment_type", e.target.value)}
          >
            <option value="">All</option>
            {envTypes.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      )}

      {/* Animal Species (Host=ANIMAL) */}
      {local.host_type === "ANIMAL" && (
        <div>
          <label className="block text-sm">Animal Species</label>
          <select
            className="border rounded px-2 py-1"
            value={local.animal_species || ""}
            onChange={(e) => setField("animal_species", e.target.value)}
          >
            <option value="">All</option>
            {species.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      )}

      {/* Organism */}
      <div>
        <label className="block text-sm">Organism</label>
        <select
          className="border rounded px-2 py-1"
          value={local.organism || ""}
          onChange={(e) => setField("organism", e.target.value)}
        >
          <option value="">All</option>
          {organisms.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      </div>

      {/* Antibiotic */}
      <div>
        <label className="block text-sm">Antibiotic</label>
        <select
          className="border rounded px-2 py-1"
          value={local.antibiotic || ""}
          onChange={(e) => setField("antibiotic", e.target.value)}
        >
          <option value="">All</option>
          {antibiotics.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
      </div>

      {/* Facility */}
      <div>
        <label className="block text-sm">Facility</label>
        <select
          className="border rounded px-2 py-1"
          value={local.facility || ""}
          onChange={(e) => setField("facility", e.target.value)}
        >
          <option value="">All</option>
          {facilities.map((f) => <option key={f} value={f}>{f}</option>)}
        </select>
      </div>

      {/* Patient Type */}
      <div>
        <label className="block text-sm">Patient Type</label>
        <select
          className="border rounded px-2 py-1"
          value={local.patient_type || ""}
          onChange={(e) => setField("patient_type", e.target.value)}
        >
          <option value="">All</option>
          {patientTypes.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>
    </div>
  );
}
