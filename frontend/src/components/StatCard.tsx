export function StatCard({ label, value }: { label: string; value: string | number }) {
  return <div className="card"><div className="stat">{value}</div><p>{label}</p></div>;
}
