import React, { useEffect, useState } from "react";
import { api } from "../api";

export default function Geo() {
  const [geo, setGeo] = useState({ features: [] });

  useEffect(() => { api.geo().then((d) => setGeo({ features: Array.isArray(d?.features) ? d.features : [] })); }, []);

  const features = Array.isArray(geo?.features) ? geo.features : [];
  return (
    <section className="card">
      <h2 className="section-title">Geo</h2>
      {features.length === 0 ? (
        <div className="small">No locations</div>
      ) : (
        <pre className="small">{JSON.stringify(features.slice(0, 10), null, 2)}</pre>
      )}
    </section>
  );
}
