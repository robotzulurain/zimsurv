import React, { useState } from 'react';
import axios from 'axios';

export default function CSVUpload({ token }) {
  const [file, setFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('');

  const handleFileChange = (e) => setFile(e.target.files[0]);

  const summarizeErrors = (errors) => {
    if (!Array.isArray(errors) || errors.length === 0) return '';
    const first = errors[0];
    const msgs = Object.entries(first.errors || {})
      .map(([field, arr]) => `${field}: ${Array.isArray(arr) ? arr[0] : String(arr)}`)
      .join('; ');
    return `Row ${first.row}: ${msgs}`;
  };

  const handleUpload = async () => {
    if (!file) {
      setUploadStatus('❌ Please select a CSV file before uploading.');
      return;
    }
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await axios.post('http://127.0.0.1:8000/api/upload-csv/', formData, {
        headers: {
          Authorization: `Token ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      const { saved = 0, errors = [] } = res.data || {};
      if (errors.length > 0) {
        setUploadStatus(`⚠️ Uploaded ${saved}, but ${errors.length} error(s):\n` + summarizeErrors(errors));
      } else {
        setUploadStatus(`✅ Upload successful. ${saved} record(s) saved.`);
        // notify the table to refresh
        window.dispatchEvent(new CustomEvent('lab-results-updated'));
      }
    } catch (err) {
      console.error('Upload error:', err?.response?.data || err.message);
      const detail =
        err?.response?.data?.detail ||
        err?.response?.data?.error ||
        'Upload failed. Please check the CSV format and try again.';
      setUploadStatus(`⚠️ ${detail}`);
    }
  };

  return (
    <div style={{ marginBottom: 24 }}>
      <h2>Upload Lab Results (CSV)</h2>
      <div style={{ marginBottom: 8 }}>
        <a href="/amr_template.csv" download>Need a template? Download CSV template</a>
      </div>
      <button onClick={handleUpload}>Upload</button>
      {uploadStatus && <pre style={{ whiteSpace: 'pre-wrap' }}>{uploadStatus}</pre>}
    </div>
  );
}
