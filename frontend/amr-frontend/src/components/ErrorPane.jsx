import React from "react";

export default function ErrorPane({ error, title="Error" }) {
  if (!error) return null;
  return (
    <div style={{
      marginTop: 12, padding: 12, borderRadius: 8,
      border: "1px solid #fecaca", background: "#fee2e2", color: "#7f1d1d"
    }}>
      <strong>{title}:</strong> {error.message || String(error)}
    </div>
  );
}
