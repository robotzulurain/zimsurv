import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function LabResultForm() {
  const [labId, setLabId] = useState('');
  const [specimen, setSpecimen] = useState('');
  const [organism, setOrganism] = useState('');
  const [antibiotic, setAntibiotic] = useState('');
  const [result, setResult] = useState('S');
  const [labs, setLabs] = useState([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    axios.get('/api/laboratories/').then(res => setLabs(res.data));
  }, []);

  const handleSubmit = async () => {
    try {
      await axios.post('/api/labresults/', {
        lab: labId,
        specimen, organism, antibiotic, result,
      });
      setMessage('Result submitted!');
    } catch (err) {
      setMessage('Error submitting result');
    }
  };

  return (
    <div>
      <h2>Enter Lab Result</h2>
      <select value={labId} onChange={e => setLabId(e.target.value)}>
        <option value="">Select Laboratory</option>
        {labs.map(lab => (
          <option key={lab.id} value={lab.id}>{lab.name}</option>
        ))}
      </select><br />
      <input placeholder="Specimen" value={specimen} onChange={e => setSpecimen(e.target.value)} /><br />
      <input placeholder="Organism" value={organism} onChange={e => setOrganism(e.target.value)} /><br />
      <input placeholder="Antibiotic" value={antibiotic} onChange={e => setAntibiotic(e.target.value)} /><br />
      <select value={result} onChange={e => setResult(e.target.value)}>
        <option value="S">Susceptible</option>
        <option value="I">Intermediate</option>
        <option value="R">Resistant</option>
      </select><br />
      <button onClick={handleSubmit}>Submit</button>
      <p>{message}</p>
    </div>
  );
}
