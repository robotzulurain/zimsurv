// Accepts things like 06/09/2025, 2025-09-06, 6-9-2025 and returns 2025-09-06
export function toYMD(v) {
  if (!v) return "";
  let s = String(v).trim();
  // If already YYYY-MM-DD, keep it
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;

  // Try DD/MM/YYYY or DD-MM-YYYY
  let m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (m) {
    const [_, d, mo, y] = m;
    const dd = String(d).padStart(2, "0");
    const mm = String(mo).padStart(2, "0");
    return `${y}-${mm}-${dd}`;
  }

  // Last resort: Date parsing
  const dt = new Date(s);
  if (!isNaN(dt)) {
    const y = dt.getFullYear();
    const mm = String(dt.getMonth() + 1).padStart(2, "0");
    const dd = String(dt.getDate()).padStart(2, "0");
    return `${y}-${mm}-${dd}`;
  }
  return s;
}
