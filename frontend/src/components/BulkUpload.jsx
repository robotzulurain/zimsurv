import React, { useState } from "react";
import api from "../api";

export default function BulkUpload() {
  const [file, setFile] = useState(null);
  const [msg, setMsg] = useState("");

  async function doUpload(e) {
    e.preventDefault();
    if (!file) { setMsg("Choose a file first."); return; }
    setMsg("Uploading…");
    try {
      const out = await api.upload(file); // sends field 'file' with token
      setMsg(out?.ok ? `Uploaded OK (${out?.imported || 0} rows)` : "Upload done");
    } catch (err) {
      setMsg(`Upload failed: ${err?.message || err}`);
    }
  }

  return (
    <div className="rounded-xl bg-white p-4 shadow mt-6">
      <h3 className="font-semibold mb-2">Bulk Upload (CSV / Excel)</h3>
      <p className="text-sm text-gray-600 mb-2">
        {msg || "Login required (see /login) to upload."}
      </p>
      <form onSubmit={doUpload} className="flex items-center gap-2">
        <input
          type="file"
          accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="block border rounded px-2 py-1"
        />
        <button className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700">
          Upload
        </button>
      </form>
      <div className="mt-3">
        <a
          href={`${import.meta.env.VITE_API_BASE || "http://localhost:8000"}/api/templates/csv`}
          className="text-blue-700 underline"
          target="_blank"
          rel="noreferrer"
        >
          Download CSV Template
        </a>
      </div>
    </div>
  );
}
