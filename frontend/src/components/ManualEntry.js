import React, { useState } from 'react';
import axios from 'axios';

export default function ManualEntry() {
  const [form, setForm] = useState({
    lab: '',
    patient_id: '',
    sex: '',
    age: '',
    specimen_type: '',
    organism: '',
    antibiotic: '',
    ast_result: '',
    test_date: ''
  });
  const [status, setStatus] = useState('');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('Saving…');
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://127.0.0.1:8000/api/manual-entry/', form, {
        headers: { Authorization: `Token ${token}` }
      });
      setStatus('✅ Lab result saved!');
      // notify others (e.g., table) to refresh
      window.dispatchEvent(new CustomEvent('lab-results-updated'));
      // optional: clear form
      setForm({
        lab: '',
        patient_id: '',
        sex: '',
        age: '',
        specimen_type: '',
        organism: '',
        antibiotic: '',
        ast_result: '',
        test_date: ''
      });
    } catch (err) {
      const msg = err?.response?.data
        ? JSON.stringify(err.response.data)
        : err.message;
      setStatus(`❌ Failed to save: ${msg}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ marginBottom: 24 }}>
      <h2>Manual Lab Result Entry</h2>

      <input name="lab" placeholder="lab" value={form.lab} onChange={handleChange} />
      <input name="patient_id" placeholder="patient_id" value={form.patient_id} onChange={handleChange} />

      <select name="sex" value={form.sex} onChange={handleChange}>
        <option value="">Select Sex</option>
        <option value="M">M</option>
        <option value="F">F</option>
      </select>

      <input name="age" placeholder="age" value={form.age} onChange={handleChange} />
      <input name="specimen_type" placeholder="specimen_type" value={form.specimen_type} onChange={handleChange} />
      <input name="organism" placeholder="organism" value={form.organism} onChange={handleChange} />
      <input name="antibiotic" placeholder="antibiotic" value={form.antibiotic} onChange={handleChange} />

      <select name="ast_result" value={form.ast_result} onChange={handleChange}>
        <option value="">Select AST Result</option>
        <option value="S">Susceptible</option>
        <option value="I">Intermediate</option>
        <option value="R">Resistant</option>
      </select>

      <input
        name="test_date"
        type="date"
        placeholder="YYYY-MM-DD"
        value={form.test_date}
        onChange={handleChange}
      />

      <button type="submit">Submit</button>
      {status && <p>{status}</p>}
    </form>
  );
}
