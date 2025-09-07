import React, { useEffect, useState } from "react";
import api from "./api";

export default function Overview() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    api.counts()
      .then(setData)
      .catch(e => setErr(e.message || "Failed to load counts"));
  }, []);

  const cards = [
    { key: "total_tests", label: "Total Tests" },
    { key: "unique_patients", label: "Unique Patients" },
    { key: "organisms", label: "Organisms" },
    { key: "antibiotics", label: "Antibiotics" },
  ];

  return (
    <section>
      <h2 className="text-xl font-bold mb-2">Overview</h2>
      <p className="text-sm text-gray-500 mb-4">
        {data?.as_of ? `As of ${data.as_of}` : "—"}
      </p>

      {err && <div className="mb-4 rounded bg-red-100 text-red-700 p-3">{err}</div>}

      <div className="grid md:grid-cols-4 gap-4">
        {cards.map(({key, label}) => (
          <div key={key} className="rounded-xl bg-white shadow p-4">
            <div className="text-sm text-gray-500">{label}</div>
            <div className="text-2xl font-semibold mt-1">
              {data ? data[key] : "—"}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
