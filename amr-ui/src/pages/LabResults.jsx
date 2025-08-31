import React, { useEffect, useState } from "react";
import { api } from "../api";

export default function LabResults() {
  const [results, setResults] = useState([]);

  useEffect(() => {
    api.lab().then((d) => setResults(Array.isArray(d?.results) ? d.results : []));
  }, []);

  const rows = Array.isArray(results) ? results : [];
  return (
    <section className="card">
      <h2 className="section-title">Lab Results</h2>
      {rows.length === 0 ? (
        <div className="small">No rows</div>
      ) : (
        <pre className="small">{JSON.stringify(rows.slice(0, 10), null, 2)}</pre>
      )}
    </section>
  );
}
