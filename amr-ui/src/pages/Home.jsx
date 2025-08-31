import React, { useEffect, useState } from "react";
import { api } from "../api";

export default function Home() {
  const [counts, setCounts] = useState({
    total_results: 0,
    unique_patients: 0,
    organisms_count: 0,
  });

  useEffect(() => {
    api.counts().then(setCounts);
  }, []);

  return (
    <section className="card">
      <h2 className="section-title">Quick snapshot</h2>
      <div className="grid">
        <div className="stat">Total records<br/>{counts.total_results ?? 0}</div>
        <div className="stat">Unique patients<br/>{counts.unique_patients ?? 0}</div>
        <div className="stat">Organisms<br/>{counts.organisms_count ?? 0}</div>
      </div>
    </section>
  );
}
