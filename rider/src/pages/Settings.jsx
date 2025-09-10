import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function Settings() {
  const navigate = useNavigate();
  const [online, setOnline] = useState(localStorage.getItem("riderOnline") === "true");
  const [coords, setCoords] = useState(null);

  useEffect(() => {
    localStorage.setItem("riderOnline", online ? "true" : "false");
  }, [online]);

  const ping = () => {
    if (!navigator.geolocation) return alert("Geolocation not supported.");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        setCoords({ latitude, longitude, accuracy });
        localStorage.setItem("riderLastLat", String(latitude));
        localStorage.setItem("riderLastLng", String(longitude));
      },
      (err) => alert("Location error: " + err.message),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const logout = () => {
    if (!confirm("Log out?")) return;
    ["isRiderLoggedIn","riderId","riderEmail","riderName"].forEach(k => localStorage.removeItem(k));
    localStorage.setItem("isRiderLoggedIn","false");
    navigate("/signin", { replace: true });
  };

  return (
    <main style={{ padding: 16 }}>
      <h2>Settings</h2>

      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 12, maxWidth: 520 }}>
        <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <input type="checkbox" checked={online} onChange={(e) => setOnline(e.target.checked)} />
          <span>Online</span>
        </label>

        <div style={{ marginTop: 12 }}>
          <button onClick={ping} style={{ background: "#1b5e20", color: "#fff", border: 0, padding: "8px 12px", borderRadius: 10, cursor: "pointer" }}>
            Send current location
          </button>
          {coords && (
            <p style={{ fontSize: 12, color: "#475569", marginTop: 8 }}>
              lat {coords.latitude.toFixed(5)}, lng {coords.longitude.toFixed(5)} (±{Math.round(coords.accuracy)}m)
            </p>
          )}
        </div>

        <hr style={{ margin: "16px 0", borderColor: "#e5e7eb" }} />

        <button onClick={logout} style={{ background: "#fef2f2", color: "#991b1b", border: "1px solid #fecaca", padding: "8px 12px", borderRadius: 10, cursor: "pointer" }}>
          Log out
        </button>
      </div>

      <p style={{ marginTop: 16 }}>
        <Link to="/dashboard">← Back</Link>
      </p>
    </main>
  );
}