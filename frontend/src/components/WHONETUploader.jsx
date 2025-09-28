import React, { useState } from "react";
import * as XLSX from "xlsx";

/*
  WHONETUploader
  - Accepts .xlsx/.xls/.csv
  - Detects WHONET-like wide table and converts to narrow template:
      patient_id,sex,age,specimen_type,organism,antibiotic,ast_result,test_date,host_type,facility,patient_type,animal_species,environment_type
  - Posts converted CSV to /api/upload/csv
*/

function isWhonetHeader(headers) {
  // simple heuristics for WHONET wide layout
  const H = headers.map(h => (h || "").toString().trim().toUpperCase());
  const whonetSigns = ["LAB NO","PATIENT ID","SPECIMEN DATE","SPECIMEN","WHONET","ISOLATE"];
  if (H.some(h => whonetSigns.includes(h))) return true;
  // presence of multiple known antibiotic abbreviations (CIP, CTX, GEN, AMX etc)
  const commonDrugs = ["CIP","CTX","GEN","AMX","IMP","SXT","TMP","AMOX","PEN","CRO","VAN"];
  const found = H.filter(h => commonDrugs.includes(h));
  return found.length >= 2;
}

function toCanonicalHeader(h) {
  if (!h) return "";
  const s = h.toString().trim().toLowerCase();
  if (["lab no","lab_no","labno"].includes(s)) return "lab_no";
  if (["patient id","patient_id","patientid","patient"].includes(s)) return "patient_id";
  if (["specimen date","specimen_date","specimendate","date"].includes(s)) return "test_date";
  if (["specimen","specimen type","specimen_type"].includes(s)) return "specimen_type";
  if (["organism","isolate"].includes(s)) return "organism";
  if (["age"].includes(s)) return "age";
  if (["sex"].includes(s)) return "sex";
  if (["host type","host_type"].includes(s)) return "host_type";
  if (["facility"].includes(s)) return "facility";
  if (["patient type","patient_type"].includes(s)) return "patient_type";
  if (["animal species","animal_species"].includes(s)) return "animal_species";
  if (["environment type","environment_type"].includes(s)) return "environment_type";
  return h.toString().trim(); // antibiotic columns and notes returned as-is
}

function buildNarrowRowsFromWide(wideRows, headers) {
  // headers = original header array
  const mapped = headers.map(h => toCanonicalHeader(h));
  const narrow = [];
  for (const r of wideRows) {
    // create base meta
    const base = {
      patient_id: r[mapped.indexOf("patient_id") !== -1 ? headers[mapped.indexOf("patient_id")] : "Patient ID"] || r["Patient ID"] || r["patient_id"] || "",
      age: r[mapped.indexOf("age") !== -1 ? headers[mapped.indexOf("age")] : "Age"] || r["Age"] || r["age"] || "",
      sex: (r[mapped.indexOf("sex") !== -1 ? headers[mapped.indexOf("sex")] : "Sex"] || r["Sex"] || r["sex"] || "U"),
      specimen_type: r[mapped.indexOf("specimen_type") !== -1 ? headers[mapped.indexOf("specimen_type")] : "Specimen"] || r["Specimen"] || r["specimen_type"] || "",
      organism: r[mapped.indexOf("organism") !== -1 ? headers[mapped.indexOf("organism")] : "Organism"] || r["Organism"] || r["organism"] || "",
      test_date: (r[mapped.indexOf("test_date") !== -1 ? headers[mapped.indexOf("test_date")] : "Specimen Date"] || r["Specimen Date"] || r["test_date"] || "").toString(),
      host_type: r[mapped.indexOf("host_type") !== -1 ? headers[mapped.indexOf("host_type")] : "Host Type"] || r["Host Type"] || r["host_type"] || "",
      facility: r[mapped.indexOf("facility") !== -1 ? headers[mapped.indexOf("facility")] : "Facility"] || r["Facility"] || r["facility"] || "",
      patient_type: r[mapped.indexOf("patient_type") !== -1 ? headers[mapped.indexOf("patient_type")] : "Patient Type"] || r["Patient Type"] || r["patient_type"] || "",
      animal_species: r[mapped.indexOf("animal_species") !== -1 ? headers[mapped.indexOf("animal_species")] : "Animal Species"] || r["Animal Species"] || r["animal_species"] || "",
      environment_type: r[mapped.indexOf("environment_type") !== -1 ? headers[mapped.indexOf("environment_type")] : "Environment Type"] || r["Environment Type"] || r["environment_type"] || ""
    };
    // For each header that's not a known meta field, treat as antibiotic column
    for (let i = 0; i < headers.length; i++) {
      const h = headers[i];
      const canon = mapped[i];
      // skip known meta fields
      const metas = ["lab_no","patient_id","test_date","specimen_type","organism","age","sex","host_type","facility","patient_type","animal_species","environment_type"];
      if (metas.includes(canon)) continue;
      const val = r[h];
      if (val === undefined || val === null || (String(val).trim() === "")) continue;
      // Make a narrow row per antibiotic
      narrow.push({
        patient_id: base.patient_id || "",
        sex: base.sex || "U",
        age: base.age === "" ? 0 : base.age,
        specimen_type: base.specimen_type || "",
        organism: base.organism || "",
        antibiotic: h,                     // column header (e.g., CIP)
        ast_result: String(val).trim(),    // e.g., R / S / I
        test_date: base.test_date || "",
        host_type: base.host_type || "",
        facility: base.facility || "",
        patient_type: base.patient_type || "",
        animal_species: base.animal_species || "",
        environment_type: base.environment_type || ""
      });
    }
  }
  return narrow;
}

function arrayToCsv(rows, columns) {
  const esc = v => {
    if (v === null || v === undefined) return "";
    return String(v).replace(/"/g, '""');
  };
  const lines = [];
  lines.push(columns.join(","));
  for (const r of rows) {
    const row = columns.map(c => {
      const v = r[c] !== undefined ? r[c] : "";
      // quote fields containing comma/newline/quote
      const s = String(v);
      if (/[,"\n]/.test(s)) return '"' + esc(s) + '"';
      return s;
    }).join(",");
    lines.push(row);
  }
  return lines.join("\n");
}

export default function WHONETUploader() {
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState(null);

  async function onFileChange(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    setBusy(true);
    setNote(null);

    try {
      // Read file (xlsx or csv)
      const data = await f.arrayBuffer();
      const wb = XLSX.read(data, { type: "array", cellDates: false, raw: false });
      // Use first sheet
      const firstName = wb.SheetNames[0];
      const sheet = wb.Sheets[firstName];
      // convert to JSON with original headers preserved (header: 1 returns arrays)
      const rowsArr = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
      if (!rowsArr || rowsArr.length < 1) throw new Error("Empty sheet");

      const headers = rowsArr[0].map(h => (h || "").toString().trim());
      const bodyRows = rowsArr.slice(1).map(r => {
        // produce object keyed by original header text
        const obj = {};
        for (let i = 0; i < headers.length; i++) obj[headers[i] || `col${i}`] = r[i] !== undefined ? r[i] : "";
        return obj;
      });

      // Detect WHONET style
      const whonetLike = isWhonetHeader(headers);
      let narrowRows;
      if (whonetLike) {
        narrowRows = buildNarrowRowsFromWide(bodyRows, headers);
        if (!narrowRows || narrowRows.length === 0) {
          throw new Error("Converted WHONET file produced no rows. Check input file.");
        }
      } else {
        // Not WHONET — try to treat as already narrow (expect narrow header set)
        // Map input headers to canonical narrow header names (best effort)
        const canonical = headers.map(h => toCanonicalHeader(h));
        const needed = ["patient_id","sex","age","specimen_type","organism","antibiotic","ast_result","test_date","host_type","facility","patient_type"];
        const hasAll = needed.every(k => canonical.includes(k));
        if (!hasAll) {
          throw new Error("File doesn't look like WHONET or the app template. Please use WHONET export or the app sample template.");
        }
        // convert rows into objects with narrow keys
        narrowRows = bodyRows.map(r => {
          const out = {};
          for (let i = 0; i < headers.length; i++) {
            const key = canonical[i] || headers[i];
            out[key] = r[headers[i]];
          }
          return out;
        });
      }

      // CSV columns order your backend expects:
      const cols = ["patient_id","sex","age","specimen_type","organism","antibiotic","ast_result","test_date","host_type","facility","patient_type","animal_species","environment_type"];
      const csvText = arrayToCsv(narrowRows, cols);
      // Convert csvText to Blob and upload
      const blob = new Blob([csvText], { type: "text/csv;charset=utf-8" });
      const fd = new FormData();
      fd.append("file", blob, (f.name || "upload") + ".converted.csv");

      const res = await fetch("/api/upload/csv", {
        method: "POST",
        body: fd
      });

      if (!res.ok) {
        const txt = await res.text();
        throw new Error("Upload failed: " + (txt || res.statusText));
      }
      const data = await res.json();
      if (data.status === "ok") {
        setNote({ kind: "ok", text: `Uploaded ${data.created} rows. ${data.errors?.length || 0} errors.` });
      } else {
        setNote({ kind: "error", text: data.detail || JSON.stringify(data) });
      }
    } catch (err) {
      console.error(err);
      setNote({ kind: "error", text: err.message || String(err) });
    } finally {
      setBusy(false);
      // clear input to allow re-uploading same file if needed
      if (e.target) e.target.value = "";
    }
  }

  return (
    <div className="p-2 border rounded">
      <label className="block font-medium mb-1">Bulk Upload (WHONET or Template)</label>
      <input type="file" accept=".xlsx,.xls,.csv" onChange={onFileChange} disabled={busy} />
      <div className="text-sm mt-2">
        {busy && <em>Processing & uploading...</em>}
        {!busy && note && (
          <div style={{ color: note.kind === "error" ? "crimson" : "green" }}>
            {note.text}
          </div>
        )}
      </div>
      <div className="text-xs text-gray-500 mt-1">This will convert WHONET wide tables to the app template and upload automatically.</div>
    </div>
  );
}
