import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function Jobs() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([
    { id: "demo1", restaurant: "Candles", pickup: "Independence Layout", dropoff: "New Haven", amount: 1200, distanceKm: 3.5 },
    { id: "demo2", restaurant: "Roban Mart", pickup: "Ogui Road", dropoff: "Thinkers Corner", amount: 1500, distanceKm: 4.2 },
  ]);

  const accept = (job) => {
    localStorage.setItem("activeJob", JSON.stringify(job));
    navigate("/active");
  };

  return (
    <main style={{ padding: 16 }}>
      <h2>Available Jobs</h2>
      <div style={{ display: "grid", gap: 12, maxWidth: 640 }}>
        {jobs.map(j => (
          <article key={j.id} style={card}>
            <div style={{ fontWeight: 700 }}>{j.restaurant}</div>
            <div style={{ fontSize: 14, color: "#475569" }}>
              Pickup: {j.pickup} • Dropoff: {j.dropoff}
            </div>
            <div style={{ fontSize: 14, color: "#334155" }}>
              ₦{j.amount.toLocaleString()} • {j.distanceKm} km
            </div>
            <div style={{ marginTop: 8 }}>
              <button onClick={() => accept(j)} style={btnPrimary}>Accept</button>
            </div>
          </article>
        ))}
      </div>

      <p style={{ marginTop: 16 }}>
        <Link to="/dashboard">← Back</Link>
      </p>
    </main>
  );
}

const card = { background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 12 };
const btnPrimary = { background: "#1b5e20", color: "#fff", border: 0, padding: "8px 12px", borderRadius: 10, cursor: "pointer" };