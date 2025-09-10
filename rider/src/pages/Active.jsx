import { Link, useNavigate } from "react-router-dom";

export default function Active() {
  const navigate = useNavigate();
  const job = JSON.parse(localStorage.getItem("activeJob") || "null");

  const complete = () => {
    if (!job) return;
    const earnings = JSON.parse(localStorage.getItem("earnings") || "[]");
    earnings.unshift({ id: job.id, amount: job.amount, when: new Date().toISOString() });
    localStorage.setItem("earnings", JSON.stringify(earnings));
    localStorage.removeItem("activeJob");
    navigate("/earnings");
  };

  if (!job) {
    return (
      <main style={{ padding: 16 }}>
        <p>No active delivery.</p>
        <Link to="/jobs">Find jobs →</Link>
      </main>
    );
  }

  return (
    <main style={{ padding: 16 }}>
      <h2>Active Delivery</h2>
      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 12 }}>
        <div style={{ fontWeight: 700 }}>{job.restaurant}</div>
        <div style={{ fontSize: 14, color: "#475569" }}>
          Pickup: {job.pickup} • Dropoff: {job.dropoff}
        </div>
        <div style={{ marginTop: 8, fontSize: 14 }}>Payout: ₦{job.amount.toLocaleString()}</div>
        <button onClick={complete} style={{ marginTop: 12, background: "#1b5e20", color: "#fff", border: 0, padding: "8px 12px", borderRadius: 10, cursor: "pointer" }}>
          Mark Delivered
        </button>
      </div>

      <p style={{ marginTop: 16 }}>
        <Link to="/dashboard">← Back</Link>
      </p>
    </main>
  );
}