import React, { useEffect, useState } from "react";
import { api } from "../api";

export default function Resistance() {
  const [series, setSeries] = useState([]);

  useEffect(() => {
    api.trend().then((d) => {
      setSeries(Array.isArray(d?.series) ? d.series : []);
    });
  }, []);

  const rows = Array.isArray(series) ? series : [];
  return (
    <section className="card">
      <h2 className="section-title">Resistance</h2>
      {rows.length === 0 ? (
        <div className="small">No trend data</div>
      ) : (
        <pre className="small">{JSON.stringify(rows.slice(0, 10), null, 2)}</pre>
      )}
    </section>
  );
}
