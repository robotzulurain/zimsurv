import BulkUpload from "../components/BulkUpload";
import React,{useEffect,useState} from "react";
import { uploadFile, fetchFacilities } from "../api";

export default function DataEntry(){
  const [facilities,setFacilities]=useState([]);
  const [msg,setMsg]=useState("");

  useEffect(()=>{ fetchFacilities().then(setFacilities).catch(()=>{}); },[]);

  const onFile = async (e)=>{
    const f = e.target.files?.[0];
    if(!f) return;
    setMsg("Uploading...");
    try{
      const res = await uploadFile(f);
      setMsg(`✅ Upload ok: ${JSON.stringify(res).slice(0,140)} ...`);
    }catch(err){
      setMsg(`❌ Upload failed: ${err.message}`);
    }
  };

  return (
    <div className="grid autofit">
      <div className="card">
        <h4 style={{marginTop:0}}>Upload CSV/XLSX</h4>
      <BulkUpload />
        <p>Required columns: <code>patient_id,sex,age,specimen_type,organism,antibiotic,ast_result,test_date,facility,host_type</code> (date: <b>YYYY-MM-DD</b>).</p>
        <input type="file"
          accept=".csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
          onChange={onFile} />
        <div style={{marginTop:10, fontSize:13, whiteSpace:"pre-wrap"}}>{msg}</div>
      </div>
      <div className="card">
        <h4 style={{marginTop:0}}>Facilities (read-only)</h4>
        <ul style={{margin:0,paddingLeft:16, maxHeight:220, overflow:"auto"}}>
          {facilities.map(f=><li key={f.value}>{f.label}</li>)}
        </ul>
      </div>
    </div>
  );
}
