const PALETTE = [
  '#2563eb', '#16a34a', '#dc2626', '#9333ea', '#ea580c',
  '#0ea5e9', '#22c55e', '#f59e0b', '#14b8a6', '#ef4444'
];

export function colorFor(key){
  // deterministic hash to index
  let h = 0;
  for (let i=0;i<key.length;i++) h = (h*31 + key.charCodeAt(i)) >>> 0;
  return PALETTE[h % PALETTE.length];
}
