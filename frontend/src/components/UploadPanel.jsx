import React, { useState } from "react";
const API = import.meta.env.VITE_API_BASE || "http://localhost:8000";

export default function UploadPanel() {
  const [file, setFile] = useState(null);
  const [msg, setMsg] = useState("");
  const [detail, setDetail] = useState(null);

  const token = typeof window !== "undefined" ? localStorage.getItem("amr_token") : null;

  async function upload(e){
    e.preventDefault();
    setMsg(""); setDetail(null);
    if(!token){ setMsg("Login required (see /login)."); return; }
    if(!file){ setMsg("Choose a CSV or Excel file first."); return; }

    const fd = new FormData();
    fd.append("file", file);

    try {
      const res = await fetch(`${API}/api/upload`, {
        method: "POST",
        headers: { ...(token ? { Authorization: `Token ${token}` } : {}) },
        body: fd
      });
      const data = await res.json().catch(()=>({}));
      if (!res.ok || data.ok === false){
        setMsg(data?.error || data?.detail || "Upload failed");
        return;
      }
      setMsg(`Imported: ${data.imported ?? 0}, Errors: ${data.errors?.length ?? 0}`);
      setDetail(data);
    } catch (err){
      setMsg(err.message || "Upload error");
    }
  }

  return (
    <section className="card p-4 mt-6">
      <h3 className="text-base font-semibold mb-2">Bulk Upload (CSV / Excel)</h3>
      {!token && (
        <div className="mb-2 rounded border border-amber-300 bg-amber-50 text-amber-800 px-3 py-2 text-sm">
          Login required (see <code>/login</code>) to upload.
        </div>
      )}
      <form onSubmit={upload} className="flex flex-wrap items-center gap-3">
        <input
          type="file"
          accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
          onChange={(e)=>setFile(e.target.files?.[0] ?? null)}
          className="border rounded px-2 py-1 bg-white"
        />
        <button className="btn" type="submit">Upload</button>
        <a className="btn" href={`${API}/api/templates/csv`} target="_blank" rel="noreferrer">
          Download CSV Template
        </a>
      </form>

      {msg && <div className="mt-3 text-sm">{msg}</div>}

      {detail?.errors?.length ? (
        <div className="mt-3 text-sm text-red-700">
          <div className="font-medium">Errors:</div>
          <ul className="list-disc pl-5">
            {detail.errors.map((e,i)=><li key={i}>{e}</li>)}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
