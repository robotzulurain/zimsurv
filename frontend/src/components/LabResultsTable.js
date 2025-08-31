import React, { useEffect, useState, useMemo, useCallback } from 'react';

export default function LabResultsTable() {
  const token = localStorage.getItem('token') || '';
  const [rows, setRows] = useState([]);
  const [count, setCount] = useState(0);
  const [next, setNext] = useState(null);
  const [prev, setPrev] = useState(null);
  const [loading, setLoading] = useState(false);

  const [organism, setOrganism] = useState('');
  const [antibiotic, setAntibiotic] = useState('');
  const [sex, setSex] = useState('');
  const [specimen, setSpecimen] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);

  const baseUrl = 'http://127.0.0.1:8000/api/lab-results/';

  const url = useMemo(() => {
    const q = new URLSearchParams();
    if (organism) q.set('organism', organism);
    if (antibiotic) q.set('antibiotic', antibiotic);
    if (sex) q.set('sex', sex);
    if (specimen) q.set('specimen_type', specimen);
    if (dateFrom) q.set('date_from', dateFrom);
    if (dateTo) q.set('date_to', dateTo);
    q.set('page', String(page));
    q.set('page_size', String(pageSize));
    return `${baseUrl}?${q.toString()}`;
  }, [organism, antibiotic, sex, specimen, dateFrom, dateTo, page, pageSize]);

  const fetchPage = useCallback(async (fetchUrl) => {
    setLoading(true);
    try {
      const res = await fetch(fetchUrl, {
        headers: { Authorization: `Token ${token}` },
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setRows(data);
        setCount(data.length);
        setNext(null);
        setPrev(null);
      } else {
        setRows(data.results || []);
        setCount(data.count || 0);
        setNext(data.next);
        setPrev(data.previous);
      }
    } catch (e) {
      console.error('Failed to fetch lab results:', e);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    setPage(1);
  }, [organism, antibiotic, sex, specimen, dateFrom, dateTo, pageSize]);

  useEffect(() => {
    fetchPage(url);
  }, [url, fetchPage]);

  // 🔔 Listen for “lab-results-updated” and refetch current page
  useEffect(() => {
    const handler = () => fetchPage(url);
    window.addEventListener('lab-results-updated', handler);
    return () => window.removeEventListener('lab-results-updated', handler);
  }, [url, fetchPage]);

  const nextPage = () => {
    if (next) {
      setPage(p => p + 1);
      fetchPage(next);
    }
  };
  const prevPage = () => {
    if (prev) {
      setPage(p => Math.max(1, p - 1));
      fetchPage(prev);
    }
  };

  const clearFilters = () => {
    setOrganism('');
    setAntibiotic('');
    setSex('');
    setSpecimen('');
    setDateFrom('');
    setDateTo('');
    setPage(1);
  };

  return (
    <div style={{ marginTop: 24 }}>
      <h2>All Lab Results</h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, minmax(140px, 1fr))', gap: 8, marginBottom: 12 }}>
        <input placeholder="Organism" value={organism} onChange={e => setOrganism(e.target.value)} />
        <input placeholder="Antibiotic" value={antibiotic} onChange={e => setAntibiotic(e.target.value)} />
        <select value={sex} onChange={e => setSex(e.target.value)}>
          <option value="">M/F</option>
          <option value="M">M</option>
          <option value="F">F</option>
        </select>
        <input placeholder="Specimen" value={specimen} onChange={e => setSpecimen(e.target.value)} />
        <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} title="From (YYYY-MM-DD)"/>
        <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} title="To (YYYY-MM-DD)"/>
      </div>

      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
        <label>
          Page size:&nbsp;
          <select value={pageSize} onChange={e => setPageSize(Number(e.target.value))}>
            {[5,10,20,50].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </label>
        <button onClick={clearFilters}>Clear filters</button>
        <span style={{ marginLeft: 'auto' }}>{loading ? 'Loading…' : `Total: ${count}`}</span>
      </div>

      <table border="1" cellPadding="5" width="100%">
        <thead>
          <tr>
            <th>Patient ID</th>
            <th>Sex</th>
            <th>Age</th>
            <th>Specimen Type</th>
            <th>Organism</th>
            <th>Antibiotic</th>
            <th>AST Result</th>
            <th>Test Date</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr><td colSpan="8" style={{ textAlign: 'center' }}>No results</td></tr>
          ) : rows.map((r) => (
            <tr key={r.id}>
              <td>{r.patient_id}</td>
              <td>{r.sex}</td>
              <td>{r.age}</td>
              <td>{r.specimen_type}</td>
              <td>{r.organism}</td>
              <td>{r.antibiotic}</td>
              <td>{r.ast_result}</td>
              <td>{r.test_date}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ marginTop: 10, display: 'flex', gap: 8, alignItems: 'center' }}>
        <button onClick={prevPage} disabled={!prev}>Prev</button>
        <span>Page {page}</span>
        <button onClick={nextPage} disabled={!next}>Next</button>
      </div>
    </div>
  );
}
