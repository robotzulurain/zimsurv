export default function ErrorNote({ error }) {
  if (!error) return null
  return <div className="small" style={{color:'var(--bad)'}}>Error: {error}</div>
}
