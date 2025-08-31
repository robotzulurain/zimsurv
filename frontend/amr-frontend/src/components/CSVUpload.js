import React, { useState } from 'react';
import { apiFetch } from '../api';

export default function CSVUpload() {
  const [resp, setResp] = useState(null);
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    const file = e.target.file.files[0];
    if (!file) return;
    const form = new FormData();
    form.append('file', file);
    setBusy(true);
    try {
      const j = await apiFetch('/api/upload-csv/', { method: 'POST', body: form });
      setResp(j);
    } catch (err) {
      setResp({ ok:false, error: String(err) });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <h3>Upload Lab Results (CSV)</h3>
      <form onSubmit={onSubmit}>
        <input type="file" name="file" accept=".csv" />
        <button disabled={busy} type="submit">{busy ? 'Uploading...' : 'Upload'}</button>
      </form>
      {resp && <pre>{JSON.stringify(resp, null, 2)}</pre>}
    </div>
  );
}
