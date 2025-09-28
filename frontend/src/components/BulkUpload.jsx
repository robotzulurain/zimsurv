import React, { useRef, useState } from "react";

export default function BulkUpload() {
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState(null);

  async function onFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setNote(null);

    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload/csv", { method: "POST", body: fd });
      let data = null;
      try { data = await res.json(); } catch { /* ignore */ }

      if (!res.ok) {
        const friendly = (data && (data.detail || data.error || data.message)) ||
          "Upload failed.";
        const details = (data && data.details) ? `\nDetails: ${data.details}` : "";
        throw new Error(friendly + details);
      }

      const created = data?.created ?? 0;
      const errs = data?.errors ?? [];
      if (errs.length) {
        setNote({
          kind: "warn",
          text: `Uploaded ${created}. ${errs.length} row(s) had issues:\n- ` + errs.slice(0,10).join("\n- ")
        });
      } else {
        setNote({ kind: "ok", text: `Uploaded ${created} row(s) successfully.` });
      }
    } catch (err) {
      setNote({ kind: "error", text: String(err?.message || err) });
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="mt-2">
      <label className="block font-medium mb-1">Bulk Upload (CSV/XLSX)</label>
      <input
        ref={inputRef}
        type="file"
        accept=".csv,.xlsx,.xls"
        onChange={onFile}
        disabled={busy}
      />
      <div className="text-xs text-gray-600 mt-1">
        Parsed on the server (handles Windows/Mac newlines, quotes, embedded commas/newlines, and XLSX).
      </div>
      {note && (
        <pre
          style={{ whiteSpace: "pre-wrap" }}
          className={
            "mt-2 p-2 rounded border " +
            (note.kind === "ok" ? "bg-green-50 border-green-300"
              : note.kind === "warn" ? "bg-yellow-50 border-yellow-300"
              : "bg-red-50 border-red-300")
          }
        >{note.text}</pre>
      )}
    </div>
  );
}
