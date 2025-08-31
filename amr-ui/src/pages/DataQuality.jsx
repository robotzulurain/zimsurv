import React, { useEffect, useState } from "react";
import { api } from "../api";

export default function DataQuality() {
  const [dq, setDq] = useState({
    completeness: {},
    duplicates: {},
    recent_activity: {},
  });

  useEffect(() => { api.quality().then(setDq); }, []);

  const comp = dq?.completeness ?? {};
  const dups = dq?.duplicates ?? {};
  const recent = dq?.recent_activity ?? {};

  return (
    <section className="card">
      <h2 className="section-title">Data Quality</h2>
      <pre className="small">{JSON.stringify({comp, dups, recent}, null, 2)}</pre>
    </section>
  );
}
