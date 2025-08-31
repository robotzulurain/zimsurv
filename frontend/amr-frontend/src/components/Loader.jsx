import React from "react";
export default function Loader({label="Loading…"}){
  return (
    <div style={{display:"flex", alignItems:"center", gap:10, color:"#64748b"}}>
      <div style={{
        width:14, height:14, border:"2px solid #93c5fd", borderTopColor:"#3b82f6",
        borderRadius:"50%", animation:"spin .8s linear infinite"
      }} />
      <span>{label}</span>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
