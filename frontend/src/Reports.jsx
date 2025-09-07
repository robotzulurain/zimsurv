import React, { useState } from "react";
import { qsFromFilters } from "./api";
import FilterBar from "./components/FilterBar";

export default function Reports() {
  const [filters, setFilters] = useState({});

  const download = (path) => {
    const base = import.meta.env.VITE_API_BASE || "http://localhost:8000";
    const url = `${base}${path}${qsFromFilters(filters)}`;
    window.open(url, "_blank");
  };

  return (
    <section>
      <h2 className="text-xl font-bold mb-4">Reports</h2>
      <p className="text-sm text-gray-600 mb-3">
        Facility Antibiogram (PDF) · Monthly Summary (PDF) · GLASS CSV Export
      </p>
      <FilterBar onChange={setFilters} />
      <div className="mt-3 flex flex-wrap gap-3">
        <button disabled className="px-4 py-2 rounded bg-gray-300 text-gray-700" title="Coming soon">
          Facility Antibiogram (PDF)
        </button>
        <button disabled className="px-4 py-2 rounded bg-gray-300 text-gray-700" title="Coming soon">
          Monthly Summary (PDF)
        </button>
        <button onClick={() => download("/api/export/glass")} className="px-4 py-2 rounded bg-emerald-600 text-white">
          GLASS CSV Export
        </button>
      </div>
      <p className="mt-4 text-xs text-gray-600">
        GLASS CSV Export respects the same filters (organism, antibiotic, facility, host_type). Add PDF outputs next.
      </p>
    </section>
  );
}
