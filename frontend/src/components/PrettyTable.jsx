export default function PrettyTable({ columns = [], rows = [], empty = "No rows" }) {
  return (
    <div className="card">
      <table className="table">
        <thead>
          <tr>
            {columns.map((c) => <th key={c.key || c}>{c.label || c}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr><td colSpan={columns.length} className="muted">{empty}</td></tr>
          )}
          {rows.map((r, idx) => (
            <tr key={idx}>
              {columns.map((c) => {
                const key = c.key || c;
                const render = c.render;
                return <td key={key}>{render ? render(r[key], r) : r[key]}</td>;
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
