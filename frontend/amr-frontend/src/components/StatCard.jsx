import React from "react";
export default function StatCard({ label, value }) {
  return (
    <div className="card p-4">
      <div className="text-sm text-gray-600">{label}</div>
      <div className="mt-1 text-2xl font-semibold text-gray-900">{value}</div>
    </div>
  );
}
