import React, { useEffect, useState } from "react";
import { api } from "../api";

export default function FilterBar({ onChange }) {
  const [opts, setOpts] = useState(null);
  const [vals, setVals] = useState({ organism:"", antibiotic:"", facility:"", host_type:"" });

  useEffect(() => { api.options().then(setOpts).catch(console.error); }, []);

  useEffect(() => { onChange?.(vals); }, [vals]); // emit whenever any select changes

  const set = (k) => (e) => setVals(v => ({ ...v, [k]: e.target.value }));

  return (
    <div className="mb-4 flex flex-wrap gap-3 items-end">
      {!opts ? <span className="text-sm text-gray-500">Loading filters…</span> : (
        <>
          <Select id="organism" label="Organism" list={opts.organisms} value={vals.organism} onChange={set('organism')} />
          <Select id="antibiotic" label="Antibiotic" list={opts.antibiotics} value={vals.antibiotic} onChange={set('antibiotic')} />
          <Select id="facility" label="Facility" list={opts.facilities} value={vals.facility} onChange={set('facility')} />
          <Select id="host_type" label="Host Type" list={opts.host_types} value={vals.host_type} onChange={set('host_type')} />
          <button onClick={() => setVals({ organism:"",antibiotic:"",facility:"",host_type:"" })}
                  className="px-3 py-1 rounded bg-gray-200">Reset</button>
        </>
      )}
    </div>
  );
}

function Select({ id, label, list, value, onChange }) {
  return (
    <label className="text-sm">
      <span className="mr-2 text-gray-600">{label}</span>
      <select id={id} name={id} value={value} onChange={onChange}
        className="px-2 py-1 rounded border bg-white">
        <option value="">All</option>
        {list?.map(v => <option key={v} value={v}>{v}</option>)}
      </select>
    </label>
  );
}
