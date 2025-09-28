import React, { useState } from 'react';
import axios from 'axios';

export default function CSVUpload({ token }) {
  const [file, setFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('');

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) {
      setUploadStatus('❌ Please select a CSV file before uploading.');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post('http://127.0.0.1:8000/api/upload-csv/', formData, {
        headers: {
          Authorization: `Token ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      const { saved, errors } = response.data;

      if (errors && errors.length > 0) {
        // Show simple summary only
        setUploadStatus(`⚠️ Uploaded ${saved}, but ${errors.length} error(s) found. Check your CSV format.`);
      } else {
        setUploadStatus(`✅ Upload successful. ${saved} record(s) saved.`);
      }
    } catch (error) {
      // Friendly error for CSV format issues
      if (error.response?.status === 400) {
        setUploadStatus('❌ Upload failed. Please check the CSV format and try again.');
      } else {
        setUploadStatus('❌ Upload failed. Something went wrong.');
      }
    }
  };

  return (
    <div>
      <h2>Upload Lab Results (CSV)</h2>
      <button onClick={handleUpload}>Upload</button>
      <p>{uploadStatus}</p>
    </div>
  );
}

