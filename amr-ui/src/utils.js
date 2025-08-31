export const fmt = (n)=> (Number.isFinite(+n) ? (+n).toLocaleString() : n)
export function Spinner(){ return <span className="small">Loading…</span> }
