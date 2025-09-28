import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { options } from "./api";

// Export this so other files can import it
export const ALL = "All";

export const defaultFilters = {
  host_type: ALL,
  organism: ALL,
  antibiotic: ALL,
  facility: ALL,
  patient_type: ALL,
  // one-health specifics
  animal_species: ALL,
  environment_type: ALL,
};

const FiltersContext = createContext({
  filters: defaultFilters,
  setFilters: () => {},
  lists: {},
  loading: true,
});

export function FiltersProvider({ children }) {
  const [filters, setFilters] = useState(defaultFilters);
  const [lists, setLists] = useState({
    hosts: [],
    organisms: [],
    antibiotics: [],
    facilities: [],
    patient_types: [],
    animal_species: [],
    environment_types: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ok = true;
    options({})
      .then((o) => {
        if (!ok) return;

        const toList = (x) => {
          if (!x) return [];
          if (Array.isArray(x)) return x.map(v => (typeof v === "string" ? v : v?.name ?? v?.label ?? String(v)));
          if (typeof x === "object") return Object.values(x).map(v => String(v));
          return String(x).split(",").map(s => s.trim()).filter(Boolean);
        };

        const organisms = toList(o?.organisms || o?.microbes);
        const antibiotics = toList(o?.antibiotics || o?.abx);

        // one-health lists (fallbacks if backend doesn’t provide)
        const environment_types = toList(o?.environment_types || []) || [];
        const animal_species     = toList(o?.animal_species || []) || [];
const facilities = Array.isArray(o?.facilities)
          ? o.facilities.map(f => f?.name ?? f?.label ?? String(f)).filter(Boolean)
          : toList(o?.facilities);
        const hosts = toList(o?.hosts || ["HUMAN", "ANIMAL", "ENVIRONMENT"]);
        const patient_types = toList(o?.patient_types || ["INPATIENT", "OUTPATIENT", "UNKNOWN"]);

        // one-health lists (fallbacks if backend doesn’t provide)

        setLists({
          organisms: [ALL, ...organisms],
          antibiotics: [ALL, ...antibiotics],
          facilities: [ALL, ...facilities],
          hosts: [ALL, ...hosts],
          patient_types: [ALL, ...patient_types],
          animal_species: [ALL, ...animal_species],
          environment_types: [ALL, ...environment_types],
        });
        setLoading(false);
      })
      .catch(() => setLoading(false));
    return () => {
      ok = false;
    };
  }, []);

  const value = useMemo(
    () => ({ filters, setFilters, lists, loading, ALL }),
    [filters, lists, loading]
  );
  return <FiltersContext.Provider value={value}>{children}</FiltersContext.Provider>;
}

export function useFilters() {
  return useContext(FiltersContext);
}

// Helper to pass only active filters to APIs
export function applyFilters(filters, extraParams = {}) {
  const params = { ...extraParams };
  for (const [k, v] of Object.entries(filters || {})) {
    if (v && v !== ALL) params[k] = v;
  }
  return params;
}
