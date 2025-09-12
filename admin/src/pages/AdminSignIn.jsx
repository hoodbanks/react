// src/pages/AdminDashboard.jsx
import React, { useEffect, useMemo, useState } from "react";

const API_BASE = import.meta.env.VITE_API_BASE || "";

/** demo data if no backend yet */
const DEMO_RIDERS = [
  { id: "r1", name: "Chika Obi", email: "chika@example.com", phone: "+234800000001", status: "pending" },
  { id: "r2", name: "Ike Udo",  email: "ike@example.com",   phone: "+234800000002", status: "pending" },
];
const DEMO_VENDORS = [
  { id: "v1", name: "Candles Restaurant", email: "candles@example.com", status: "pending" },
];

export default function AdminDashboard() {
  const [tab, setTab] = useState("Overview"); // "Overview" | "Approvals"
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  // data buckets
  const [pendingRiders, setPendingRiders] = useState(() => {
    const raw = localStorage.getItem("admin.pendingRiders");
    return raw ? JSON.parse(raw) : DEMO_RIDERS;
  });
  const [pendingVendors, setPendingVendors] = useState(() => {
    const raw = localStorage.getItem("admin.pendingVendors");
    return raw ? JSON.parse(raw) : DEMO_VENDORS;
  });
  const [approvedRiders, setApprovedRiders] = useState(() => {
    const raw = localStorage.getItem("admin.approvedRiders");
    return raw ? JSON.parse(raw) : [];
  });
  const [approvedVendors, setApprovedVendors] = useState(() => {
    const raw = localStorage.getItem("admin.approvedVendors");
    return raw ? JSON.parse(raw) : [];
  });

  // persist to localStorage so it survives refresh
  useEffect(() => {
    localStorage.setItem("admin.pendingRiders", JSON.stringify(pendingRiders));
  }, [pendingRiders]);
  useEffect(() => {
    localStorage.setItem("admin.pendingVendors", JSON.stringify(pendingVendors));
  }, [pendingVendors]);
  useEffect(() => {
    localStorage.setItem("admin.approvedRiders", JSON.stringify(approvedRiders));
  }, [approvedRiders]);
  useEffect(() => {
    localStorage.setItem("admin.approvedVendors", JSON.stringify(approvedVendors));
  }, [approvedVendors]);

  // (Optional) Try real API when API_BASE is set
  useEffect(() => {
    let alive = true;
    (async () => {
      if (!API_BASE) return;
      try {
        setLoading(true);
        setErr("");
        const res = await fetch(`${API_BASE}/api/admin/pending`);
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.ok) throw new Error(data.error || "Failed to load pending");
        if (!alive) return;
        setPendingRiders(data.pendingRiders ?? []);
        setPendingVendors(data.pendingVendors ?? []);
      } catch (e) {
        console.warn("Pending load failed, staying on local demo:", e);
        if (alive) setErr("Could not load from server, using local demo data.");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  const metrics = useMemo(() => {
    return {
      ridersPending: pendingRiders.length,
      vendorsPending: pendingVendors.length,
      ridersApproved: approvedRiders.length,
      vendorsApproved: approvedVendors.length,
    };
  }, [pendingRiders, pendingVendors, approvedRiders, approvedVendors]);

  async function approve(type, id) {
    try {
      setLoading(true);
      setErr("");

      if (API_BASE) {
        const res = await fetch(`${API_BASE}/api/admin/approve`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type, id }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.ok) throw new Error(data.error || "Approve failed");
      }

      if (type === "rider") {
        const item = pendingRiders.find((x) => x.id === id);
        if (!item) return;
        setPendingRiders((list) => list.filter((x) => x.id !== id));
        setApprovedRiders((list) => [{ ...item, status: "approved" }, ...list]);
      } else {
        const item = pendingVendors.find((x) => x.id === id);
        if (!item) return;
        setPendingVendors((list) => list.filter((x) => x.id !== id));
        setApprovedVendors((list) => [{ ...item, status: "approved" }, ...list]);
      }
    } catch (e) {
      console.error(e);
      setErr(String(e.message || e));
    } finally {
      setLoading(false);
    }
  }

  async function reject(type, id) {
    try {
      setLoading(true);
      setErr("");

      if (API_BASE) {
        const res = await fetch(`${API_BASE}/api/admin/reject`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type, id }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.ok) throw new Error(data.error || "Reject failed");
      }

      if (type === "rider") {
        setPendingRiders((list) => list.filter((x) => x.id !== id));
      } else {
        setPendingVendors((list) => list.filter((x) => x.id !== id));
      }
    } catch (e) {
      console.error(e);
      setErr(String(e.message || e));
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    localStorage.removeItem("isAdminLoggedIn");
    localStorage.removeItem("adminEmail");
    window.location.href = "/signin";
  }

  return (
    <div style={{ minHeight: "100vh", display: "grid", gridTemplateRows: "56px 1fr", background: "#f6f7f9" }}>
      {/* Top bar */}
      <header style={{ display: "flex", alignItems: "center", gap: 12, padding: "0 16px", background: "#166534", color: "#fff" }}>
        <div style={{ fontWeight: 700 }}>Admin</div>
        <nav style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <button
            onClick={() => setTab("Overview")}
            style={btnTabStyle(tab === "Overview")}
          >
            Overview
          </button>
          <button
            onClick={() => setTab("Approvals")}
            style={btnTabStyle(tab === "Approvals")}
          >
            Approvals
          </button>
          <button onClick={logout} style={{ ...pillStyle, background: "#0b3d20" }}>Log out</button>
        </nav>
      </header>

      {/* Content */}
      <main style={{ padding: 16, maxWidth: 1100, margin: "0 auto", width: "100%" }}>
        {err && (
          <div style={{ background: "#fff7ed", border: "1px solid #fed7aa", color: "#9a3412", padding: 10, borderRadius: 8, marginBottom: 12 }}>
            {err}
          </div>
        )}

        {tab === "Overview" && (
          <section>
            <h2 style={{ margin: "6px 0 16px" }}>Overview</h2>
            <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
              <StatCard title="Riders Pending" value={metrics.ridersPending} />
              <StatCard title="Vendors Pending" value={metrics.vendorsPending} />
              <StatCard title="Riders Approved" value={metrics.ridersApproved} />
              <StatCard title="Vendors Approved" value={metrics.vendorsApproved} />
            </div>
            {loading && <p style={{ marginTop: 12, color: "#475467" }}>Loading…</p>}
          </section>
        )}

        {tab === "Approvals" && (
          <section style={{ display: "grid", gap: 20 }}>
            <h2 style={{ margin: "6px 0 0" }}>Approvals</h2>

            <div style={panelStyle}>
              <h3 style={h3Style}>Riders</h3>
              {!pendingRiders.length ? (
                <p style={{ color: "#64748b" }}>No pending riders.</p>
              ) : (
                <ul style={{ display: "grid", gap: 10, padding: 0, margin: 0, listStyle: "none" }}>
                  {pendingRiders.map((r) => (
                    <li key={r.id} style={rowStyle}>
                      <div>
                        <div style={{ fontWeight: 600 }}>{r.name}</div>
                        <div style={{ color: "#64748b", fontSize: 13 }}>{r.email} • {r.phone}</div>
                      </div>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button onClick={() => approve("rider", r.id)} disabled={loading} style={{ ...pillStyle, background: "#166534" }}>
                          Approve
                        </button>
                        <button onClick={() => reject("rider", r.id)} disabled={loading} style={{ ...pillStyle, background: "#991b1b" }}>
                          Reject
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div style={panelStyle}>
              <h3 style={h3Style}>Vendors</h3>
              {!pendingVendors.length ? (
                <p style={{ color: "#64748b" }}>No pending vendors.</p>
              ) : (
                <ul style={{ display: "grid", gap: 10, padding: 0, margin: 0, listStyle: "none" }}>
                  {pendingVendors.map((v) => (
                    <li key={v.id} style={rowStyle}>
                      <div>
                        <div style={{ fontWeight: 600 }}>{v.name}</div>
                        <div style={{ color: "#64748b", fontSize: 13 }}>{v.email}</div>
                      </div>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button onClick={() => approve("vendor", v.id)} disabled={loading} style={{ ...pillStyle, background: "#166534" }}>
                          Approve
                        </button>
                        <button onClick={() => reject("vendor", v.id)} disabled={loading} style={{ ...pillStyle, background: "#991b1b" }}>
                          Reject
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

/* small style helpers */
function StatCard({ title, value }) {
  return (
    <div style={{ background: "#fff", padding: 16, borderRadius: 12, border: "1px solid #e5e7eb", boxShadow: "0 6px 20px rgba(0,0,0,.04)" }}>
      <div style={{ color: "#64748b", fontSize: 13 }}>{title}</div>
      <div style={{ fontSize: 28, fontWeight: 800, marginTop: 6 }}>{value}</div>
    </div>
  );
}

const panelStyle = { background: "#fff", padding: 16, borderRadius: 12, border: "1px solid #e5e7eb" };
const rowStyle = { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: 10, borderRadius: 10, border: "1px solid #eef2f7" };
const h3Style = { margin: "0 0 10px", fontSize: 16 };
const pillStyle = { padding: "8px 12px", color: "#fff", border: 0, borderRadius: 8, cursor: "pointer", fontWeight: 600 };
const btnTabStyle = (active) => ({
  ...pillStyle,
  background: active ? "#0b3d20" : "transparent",
  border: "1px solid rgba(255,255,255,.4)",
});