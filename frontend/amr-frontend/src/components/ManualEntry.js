import React, { useState } from 'react';
import { apiFetch } from '../api';

export default function ManualEntry() {
  const [form, setForm] = useState({
    patient_id:'', sex:'', age:'', specimen_type:'',
    organism:'', antibiotic:'', ast_result:'', test_date:''
  });
  const [resp, setResp] = useState(null);

  const onChange = e => setForm({...form, [e.target.name]: e.target.value});

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const j = await apiFetch('/api/manual-entry/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      setResp(j);
    } catch (err) {
      setResp({ error: String(err) });
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input name="patient_id" value={form.patient_id} onChange={onChange} placeholder="patient_id" />
      <input name="sex" value={form.sex} onChange={onChange} placeholder="M/F" />
      <input name="age" value={form.age} onChange={onChange} placeholder="age" />
      <input name="specimen_type" value={form.specimen_type} onChange={onChange} placeholder="specimen_type" />
      <input name="organism" value={form.organism} onChange={onChange} placeholder="organism" />
      <input name="antibiotic" value={form.antibiotic} onChange={onChange} placeholder="antibiotic" />
      <input name="ast_result" value={form.ast_result} onChange={onChange} placeholder="S/I/R" />
      <input type="date" name="test_date" value={form.test_date} onChange={onChange} />
      <button type="submit">Submit</button>
      {resp && <pre>{JSON.stringify(resp, null, 2)}</pre>}
    </form>
  );
}
