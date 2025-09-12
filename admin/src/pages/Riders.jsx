// src/pages/Riders.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_BASE || "";
const DEMO_MODE = !API_BASE;

// ---- Robust localStorage check (warns if disabled / private mode)
const STORAGE_OK = (() => {
  try {
    const k = "__ls_test__";
    localStorage.setItem(k, "1");
    localStorage.removeItem(k);
    return true;
  } catch {
    return false;
  }
})();

/**
 * API (when ready):
 * GET    /api/admin/riders -> { ok: true, riders: [{ id,name,phone,vehicle,status,joinedAt,orderCount }] }
 * POST   /api/admin/riders/:id/approve -> { ok: true }
 * POST   /api/admin/riders/:id/suspend -> { ok: true }
 * DELETE /api/admin/riders/:id         -> { ok: true }
 */

// ---- Local demo storage keys (versioned)
const LS_RIDERS = "admin_demo_riders_v3";
const LS_ORDER_COUNTS = "admin_demo_rider_order_counts_v3";

// ---- First-run demo riders
const DEMO_RIDERS = [
  { id: "r_1001", name: "Okechukwu U.", phone: "+2348011111111", vehicle: "Bike • EN-123-ABC", status: "Pending",   joinedAt: "2025-09-10T08:42:00Z" },
  { id: "r_1002", name: "Amaka C.",     phone: "+2348022222222", vehicle: "Bike • EN-456-XYZ", status: "Approved",  joinedAt: "2025-09-09T14:10:00Z" },
  { id: "r_1003", name: "John D.",      phone: "+2348033333333", vehicle: "Bike • EN-789-JKL", status: "Suspended", joinedAt: "2025-09-06T09:05:00Z" },
  { id: "r_1004", name: "Zainab S.",    phone: "+2348044444444", vehicle: "Bike • EN-222-JJJ", status: "Approved",  joinedAt: "2025-09-01T12:30:00Z" },
  { id: "r_1005", name: "Kelechi P.",   phone: "+2348055555555", vehicle: "Bike • EN-333-KKK", status: "Pending",   joinedAt: "2025-09-10T10:22:00Z" },
  { id: "r_1006", name: "Bola A.",      phone: "+2348066666666", vehicle: "Bike • EN-444-MMM", status: "Approved",  joinedAt: "2025-09-03T16:55:00Z" },
];

// ---- Storage helpers (no-op if STORAGE_OK is false)
function loadDemoRiders() {
  if (!STORAGE_OK) return DEMO_RIDERS;
  try {
    const raw = localStorage.getItem(LS_RIDERS);
    if (raw) return JSON.parse(raw);
  } catch {}
  localStorage.setItem(LS_RIDERS, JSON.stringify(DEMO_RIDERS));
  return DEMO_RIDERS;
}
function saveDemoRiders(list) {
  if (!STORAGE_OK) return;
  try { localStorage.setItem(LS_RIDERS, JSON.stringify(list)); } catch {}
}
function loadOrderCounts(riders) {
  if (!STORAGE_OK) {
    const counts = {};
    riders.forEach((r) => (counts[r.id] = Math.floor(Math.random() * 40)));
    return counts;
  }
  try {
    const raw = localStorage.getItem(LS_ORDER_COUNTS);
    if (raw) return JSON.parse(raw);
  } catch {}
  const counts = {};
  riders.forEach((r) => (counts[r.id] = Math.floor(Math.random() * 40)));
  try { localStorage.setItem(LS_ORDER_COUNTS, JSON.stringify(counts)); } catch {}
  return counts;
}
function saveOrderCounts(map) {
  if (!STORAGE_OK) return;
  try { localStorage.setItem(LS_ORDER_COUNTS, JSON.stringify(map)); } catch {}
}

function genId() {
  return "r_" + Math.floor(100000 + Math.random() * 900000);
}

export default function Riders() {
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("pending"); // pending | approved | suspended | all
  const [query, setQuery] = useState("");
  const [rows, setRows] = useState([]);
  const [orderCounts, setOrderCounts] = useState({});
  const [selected, setSelected] = useState(null);
  const [busyId, setBusyId] = useState(null);

  // Initial load
  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        if (!DEMO_MODE) {
          const res = await fetch(`${API_BASE}/api/admin/riders`);
          const data = await res.json().catch(() => ({}));
          if (!res.ok || !data.ok) throw new Error("Load failed");
          if (!alive) return;
          const list = Array.isArray(data.riders) ? data.riders : [];
          setRows(list);
          const counts = {};
          list.forEach((r) => (counts[r.id] = r.orderCount ?? 0));
          setOrderCounts(counts);
          setLoading(false);
          return;
        }
      } catch (e) {
        console.warn("API failed; using demo.", e);
      }
      if (!alive) return;
      const demo = loadDemoRiders();
      setRows(demo);
      setOrderCounts(loadOrderCounts(demo));
      setLoading(false);
    })();
    return () => { alive = false; };
  }, []);

  // Persist on any change (demo mode only, with storage available)
  useEffect(() => { if (DEMO_MODE && STORAGE_OK) saveDemoRiders(rows); }, [rows]);
  useEffect(() => { if (DEMO_MODE && STORAGE_OK) saveOrderCounts(orderCounts); }, [orderCounts]);

  const countsByStatus = useMemo(() => {
    const c = { total: rows.length, pending: 0, approved: 0, suspended: 0 };
    rows.forEach((r) => {
      const s = (r.status || "").toLowerCase();
      if (s === "pending") c.pending++;
      else if (s === "approved") c.approved++;
      else if (s === "suspended") c.suspended++;
    });
    return c;
  }, [rows]);

  const filtered = useMemo(() => {
    const t = query.trim().toLowerCase();
    let list = rows;
    if (tab !== "all") list = list.filter((r) => (r.status || "").toLowerCase() === tab);
    if (t) {
      list = list.filter((r) =>
        [r.name, r.phone, r.vehicle, r.id].join(" ").toLowerCase().includes(t)
      );
    }
    return list.sort((a, b) => new Date(b.joinedAt) - new Date(a.joinedAt));
  }, [rows, tab, query]);

  // ---- Actions (also persist immediately in demo mode) ----
  async function approve(id) {
    setBusyId(id);
    try {
      if (!DEMO_MODE) {
        const res = await fetch(`${API_BASE}/api/admin/riders/${encodeURIComponent(id)}/approve`, { method: "POST" });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.ok) throw new Error(data.error || "Approve failed");
      }
      setRows((list) => {
        const next = list.map((r) => (r.id === id ? { ...r, status: "Approved" } : r));
        if (DEMO_MODE && STORAGE_OK) saveDemoRiders(next);
        return next;
      });
    } catch (e) {
      alert(e.message || "Could not approve rider.");
    } finally {
      setBusyId(null);
    }
  }

  async function suspend(id) {
    setBusyId(id);
    try {
      if (!DEMO_MODE) {
        const res = await fetch(`${API_BASE}/api/admin/riders/${encodeURIComponent(id)}/suspend`, { method: "POST" });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.ok) throw new Error(data.error || "Suspend failed");
      }
      setRows((list) => {
        const next = list.map((r) => (r.id === id ? { ...r, status: "Suspended" } : r));
        if (DEMO_MODE && STORAGE_OK) saveDemoRiders(next);
        return next;
      });
    } catch (e) {
      alert(e.message || "Could not suspend rider.");
    } finally {
      setBusyId(null);
    }
  }

  async function remove(id) {
    if (!confirm("Delete this rider account? This cannot be undone.")) return;
    setBusyId(id);
    try {
      if (!DEMO_MODE) {
        const res = await fetch(`${API_BASE}/api/admin/riders/${encodeURIComponent(id)}`, { method: "DELETE" });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.ok) throw new Error(data.error || "Delete failed");
      }
      setRows((list) => {
        const next = list.filter((r) => r.id !== id);
        if (DEMO_MODE && STORAGE_OK) saveDemoRiders(next);
        return next;
      });
      setOrderCounts((m) => {
        const n = { ...m };
        delete n[id];
        if (DEMO_MODE && STORAGE_OK) saveOrderCounts(n);
        return n;
      });
      if (selected?.id === id) setSelected(null);
    } catch (e) {
      alert(e.message || "Could not delete rider.");
    } finally {
      setBusyId(null);
    }
  }

  function addDemoRider() {
    const r = {
      id: genId(),
      name: "Demo Rider " + (rows.length + 1),
      phone: "+23480" + Math.floor(10000000 + Math.random() * 89999999),
      vehicle: "Bike • EN-" + Math.floor(1000 + Math.random() * 8999),
      status: "Pending",
      joinedAt: new Date().toISOString(),
    };
    const next = [r, ...rows];
    setRows(next);
    setOrderCounts((m) => {
      const n = { ...m, [r.id]: 0 };
      if (DEMO_MODE && STORAGE_OK) saveOrderCounts(n);
      return n;
    });
    if (DEMO_MODE && STORAGE_OK) saveDemoRiders(next);
  }

  function resetDemo() {
    if (!confirm("Reset demo riders to defaults?")) return;
    if (STORAGE_OK) {
      localStorage.removeItem(LS_RIDERS);
      localStorage.removeItem(LS_ORDER_COUNTS);
    }
    const demo = loadDemoRiders();
    setRows(demo);
    setOrderCounts(loadOrderCounts(demo));
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f6f7f9", fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif", display: "grid", gridTemplateRows: "auto 1fr" }}>
      <header style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", background: "#fff", borderBottom: "1px solid #e5e7eb" }}>
        <img src="/yov.png" alt="GetYovo" style={{ height: 28, width: 28 }} />
        <strong style={{ fontSize: 16 }}>Riders</strong>

        {/* Tabs */}
        <div style={{ marginLeft: 12, display: "inline-flex", background: "#eef2ef", borderRadius: 10, overflow: "hidden" }}>
          {[
            { key: "pending",   label: `Pending (${countsByStatus.pending})` },
            { key: "approved",  label: `Approved (${countsByStatus.approved})` },
            { key: "suspended", label: `Suspended (${countsByStatus.suspended})` },
            { key: "all",       label: `All (${countsByStatus.total})` },
          ].map((r) => (
            <button
              key={r.key}
              onClick={() => setTab(r.key)}
              style={{
                padding: "6px 10px",
                fontSize: 13,
                border: 0,
                cursor: "pointer",
                background: tab === r.key ? "#166534" : "transparent",
                color: tab === r.key ? "#fff" : "#111827",
                fontWeight: 600,
              }}
            >
              {r.label}
            </button>
          ))}
        </div>

        <Link to="/dashboard" style={{ marginLeft: "auto", color: "#166534", textDecoration: "none", fontWeight: 600 }}>
          ← Back to Dashboard
        </Link>
      </header>

      {/* Demo banners */}
      {DEMO_MODE && (
        <div style={{ background: "#fff8e1", color: "#7c4a03", padding: "8px 16px", fontSize: 13, borderBottom: "1px solid #fde68a" }}>
          Demo mode — changes are stored locally and should persist after refresh.
          {!STORAGE_OK && (
            <span style={{ marginLeft: 8, color: "#9a3412", fontWeight: 700 }}>
              Storage is disabled (private mode / browser setting). Changes will NOT persist.
            </span>
          )}
        </div>
      )}

      <main style={{ padding: 20, display: "grid", gap: 16 }}>
        {/* KPIs (no “All Riders” card) */}
        <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
          <KPI label="Approved Riders" value={countsByStatus.approved} sub="Increases when you approve" />
          <KPI label="Pending" value={countsByStatus.pending} sub="Awaiting approval" />
          <KPI label="Suspended" value={countsByStatus.suspended} sub="Restricted" />
        </div>

        {/* Toolbar */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, phone, vehicle, rider ID…"
            style={{ flex: 1, minWidth: 280, padding: "10px 12px", border: "1px solid #e5e7eb", borderRadius: 8, background: "#fff" }}
          />
          {DEMO_MODE && (
            <>
              <button style={btnPrimary} onClick={addDemoRider}>+ Add demo rider</button>
              <button style={btnGhost} onClick={resetDemo}>Reset demo data</button>
            </>
          )}
        </div>

        {/* Table */}
        <div style={{ background: "#fff, padding: 16, borderRadius: 10, border: '1px solid #e5e7eb'" }}>
          {loading ? (
            <div style={{ color: "#667085" }}>Loading riders…</div>
          ) : filtered.length === 0 ? (
            <div style={{ color: "#667085" }}>No riders found.</div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ textAlign: "left", fontSize: 13, color: "#64748b" }}>
                    <th style={th}>Rider</th>
                    <th style={th}>Phone</th>
                    <th style={th}>Vehicle</th>
                    <th style={th}>Status</th>
                    <th style={th}>Orders</th>
                    <th style={th}>Joined</th>
                    <th style={thRight}></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r) => (
                    <tr key={r.id} style={{ fontSize: 14 }}>
                      <td style={td}>
                        <strong>{r.name}</strong>
                        <div style={{ fontSize: 12, color: "#94a3b8" }}>{r.id}</div>
                      </td>
                      <td style={td}>{r.phone || "—"}</td>
                      <td style={td}>{r.vehicle || "—"}</td>
                      <td style={td}><StatusPill status={r.status} /></td>
                      <td style={td}><strong>{orderCounts[r.id] ?? 0}</strong></td>
                      <td style={td}>{new Date(r.joinedAt).toLocaleString()}</td>
                      <td style={tdRight}>
                        <div style={{ display: "inline-flex", gap: 6, flexWrap: "wrap" }}>
                          {r.status !== "Approved" && (
                            <button onClick={() => approve(r.id)} disabled={busyId === r.id} style={btnPrimary}>
                              {busyId === r.id ? "…" : "Approve"}
                            </button>
                          )}
                          {r.status === "Approved" && (
                            <button onClick={() => suspend(r.id)} disabled={busyId === r.id} style={btnWarn}>
                              {busyId === r.id ? "…" : "Suspend"}
                            </button>
                          )}
                          <button onClick={() => setSelected(r)} style={btnGhost}>View</button>
                          <button onClick={() => remove(r.id)} disabled={busyId === r.id} style={btnDanger}>
                            {busyId === r.id ? "…" : "Delete"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Drawer */}
      {selected && (
        <div onClick={() => setSelected(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.4)", display: "grid", placeItems: "end", zIndex: 50 }}>
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ width: "100%", maxWidth: 520, background: "#fff", borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 16, boxShadow: "0 -10px 30px rgba(0,0,0,.12)", maxHeight: "90vh", overflow: "auto" }}
          >
            <div style={{ display: "flex", alignItems: "center" }}>
              <strong style={{ fontSize: 16 }}>Rider Details</strong>
              <button onClick={() => setSelected(null)} style={{ marginLeft: "auto", background: "#eef2ef", border: 0, borderRadius: 8, padding: "6px 10px", cursor: "pointer", fontWeight: 600 }}>
                Close
              </button>
            </div>

            <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
              <InfoRow label="Name" value={selected.name} />
              <InfoRow label="Rider ID" value={selected.id} />
              <InfoRow label="Phone" value={selected.phone || "—"} />
              <InfoRow label="Vehicle" value={selected.vehicle || "—"} />
              <InfoRow label="Status" value={selected.status} />
              <InfoRow label="Joined" value={new Date(selected.joinedAt).toLocaleString()} />
              <InfoRow label="Total Orders" value={orderCounts[selected.id] ?? 0} />
            </div>

            <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
              {selected.status !== "Approved" ? (
                <button onClick={() => approve(selected.id)} style={btnPrimary}>Approve Rider</button>
              ) : (
                <button onClick={() => suspend(selected.id)} style={btnWarn}>Suspend Rider</button>
              )}
              <button onClick={() => remove(selected.id)} style={btnDanger}>Delete Rider</button>
            </div>

            <div style={{ marginTop: 12, color: "#94a3b8", fontSize: 12 }}>
              Demo only: order counts are mocked. With API, return <code>orderCount</code> per rider.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---- UI bits ---- */
function KPI({ label, value, sub }) {
  return (
    <div style={{ background: "#fff", padding: 16, borderRadius: 10, border: "1px solid #e5e7eb" }}>
      <div style={{ color: "#667085", fontSize: 13 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 800 }}>{value}</div>
      {sub && <div style={{ color: "#94a3b8", fontSize: 12 }}>{sub}</div>}
    </div>
  );
}
function InfoRow({ label, value }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "140px 1fr", gap: 10 }}>
      <div style={{ color: "#64748b", fontSize: 13 }}>{label}</div>
      <div style={{ fontWeight: 600 }}>{value}</div>
    </div>
  );
}
function StatusPill({ status }) {
  const s = (status || "").toLowerCase();
  const bg = s === "approved" ? "#dcfce7" : s === "pending" ? "#fef9c3" : "#fee2e2";
  const fg = s === "approved" ? "#166534" : s === "pending" ? "#854d0e" : "#991b1b";
  return (
    <span style={{ padding: "2px 8px", borderRadius: 999, background: bg, color: fg, fontSize: 12, fontWeight: 700 }}>
      {status}
    </span>
  );
}

const th = { padding: "10px 8px", borderBottom: "1px solid #e5e7eb" };
const thRight = { ...th, textAlign: "right" };
const td = { padding: "10px 8px", borderBottom: "1px solid #f1f5f9" };
const tdRight = { ...td, textAlign: "right" };

const btnPrimary = { padding: "6px 10px", background: "#166534", color: "#fff", border: 0, borderRadius: 8, cursor: "pointer", fontWeight: 600 };
const btnWarn    = { padding: "6px 10px", background: "#b91c1c", color: "#fff", border: 0, borderRadius: 8, cursor: "pointer", fontWeight: 600 };
const btnDanger  = { padding: "6px 10px", background: "#7f1d1d", color: "#fff", border: 0, borderRadius: 8, cursor: "pointer", fontWeight: 700 };
const btnGhost   = { padding: "6px 10px", background: "#eef2ef", color: "#111827", border: 0, borderRadius: 8, cursor: "pointer", fontWeight: 600 };