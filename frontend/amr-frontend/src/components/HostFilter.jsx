import React from "react";
export default function HostFilter({ value="all", onChange }) {
  const handle = (e) => { if (typeof onChange === "function") onChange(e.target.value); };
  return (
    <select value={value} onChange={handle}>
      <option value="all">All hosts</option>
      <option value="human">Human</option>
      <option value="animal">Animal</option>
      <option value="environment">Environment</option>
    </select>
  );
}
