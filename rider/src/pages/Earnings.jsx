import { Link } from "react-router-dom";

export default function Earnings() {
  const earnings = JSON.parse(localStorage.getItem("earnings") || "[]");

  const total = earnings.reduce((s, e) => s + Number(e.amount || 0), 0);

  return (
    <main style={{ padding: 16 }}>
      <h2>Earnings</h2>
      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 12, maxWidth: 480 }}>
        <div style={{ fontWeight: 700 }}>Total: ₦{total.toLocaleString()}</div>
        <ul>
          {earnings.map(e => (
            <li key={e.id} style={{ fontSize: 14, color: "#334155", marginTop: 6 }}>
              ₦{e.amount.toLocaleString()} • {new Date(e.when).toLocaleString()}
            </li>
          ))}
          {!earnings.length && <li style={{ color: "#64748b" }}>No earnings yet.</li>}
        </ul>
      </div>

      <p style={{ marginTop: 16 }}>
        <Link to="/dashboard">← Back</Link>
      </p>
    </main>
  );
}