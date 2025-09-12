// src/pages/Orders.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_BASE || "";

/* ---------- Demo data (used if API not ready) ---------- */
const DEMO_VENDORS = ["Candles", "Roban Mart", "PharmaPlus", "FreshMart", "ChopLife"];
const DEMO_CUSTOMERS = ["Ada", "Chinedu", "Ngozi", "Ifeoma", "Uche", "Tunde", "Amina", "Bola"];
const DEMO_RIDERS = [null, "Okechukwu U.", "Amaka C.", "John D.", "Kelechi P.", null, "Zainab S."];
const DEMO_ADDRS = [
  "18 Ogui Rd, Enugu",
  "36 Bisalla Rd, Enugu",
  "15 Zik Ave, Uwani",
  "10 Chime Ave",
  "Independence Layout",
];

function rand(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function makeOrders(days = 30, count = 48) {
  const out = [];
  for (let i = 0; i < count; i++) {
    const vendorName = rand(DEMO_VENDORS);
    const customerName = rand(DEMO_CUSTOMERS);
    const riderName = rand(DEMO_RIDERS);
    // MVP: no "Cancelled"
    const statusPool = ["Pending", "On the way", "Delivered", "Accepted", "Processing", "Preparing"];
    const status = rand(statusPool);
    const created = new Date();
    created.setDate(created.getDate() - Math.floor(Math.random() * days));
    created.setHours(Math.floor(Math.random() * 23), Math.floor(Math.random() * 59), 0, 0);
    out.push({
      id: "ord_" + (1000 + i),
      vendorName,
      customerName,
      customerPhone: "+23480" + Math.floor(10000000 + Math.random() * 89999999),
      items: Math.random() > 0.5 ? "2x Jollof Rice, 1x Chicken" : "Groceries (5 items)",
      status,
      riderName: /^(Pending)$/i.test(status) ? null : riderName,
      pickupCode: String(1000 + Math.floor(Math.random() * 9000)),
      vendorAddress: rand(DEMO_ADDRS),
      dropAddress: rand(DEMO_ADDRS),
      createdAt: created.toISOString(),
    });
  }
  return out.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

/* ---------- Helpers ---------- */
function isSameDay(a, b) {
  const da = new Date(a), db = new Date(b);
  return da.getFullYear() === db.getFullYear() &&
         da.getMonth() === db.getMonth() &&
         da.getDate() === db.getDate();
}

const PENDING_RE = /^(pending|on the way|accepted|processing|awaiting vendor|awaiting acceptance|not accepted|unaccepted|assigned|picked up|en route|preparing|ready for pickup)$/i;
function isPendingStatus(s = "") { return PENDING_RE.test(String(s).trim()); }
function isDelivered(s = "") { return /^delivered$/i.test(String(s).trim()); }

function buildSeries(history, range) {
  if (range === "year") {
    const map = new Map();
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now);
      d.setMonth(now.getMonth() - i);
      const key = d.toISOString().slice(0, 7);
      map.set(key, 0);
    }
    history.forEach((o) => {
      const key = (o.createdAt || "").slice(0, 7);
      if (map.has(key)) map.set(key, map.get(key) + 1);
    });
    return [...map.entries()].map(([date, count]) => ({ date, count }));
  }
  const span = range === "month" ? 30 : 7;
  const byDay = {};
  const now = new Date();
  for (let i = span - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    byDay[key] = 0;
  }
  history.forEach((o) => {
    const key = (o.createdAt || "").slice(0, 10);
    if (byDay[key] != null) byDay[key] += 1;
  });
  return Object.entries(byDay).map(([date, count]) => ({ date, count }));
}

function labelForTick(date, range) { return range === "year" ? date : date.slice(5); }
function computeTotals(list) {
  const totals = { total: list.length, delivered: 0, pending: 0 };
  list.forEach((o) => {
    if (isDelivered(o.status)) totals.delivered++;
    else if (isPendingStatus(o.status)) totals.pending++;
  });
  return totals;
}

/* ---------- Page ---------- */
export default function Orders() {
  const [range, setRange] = useState("week");              // week | month | year
  const [todayMode, setTodayMode] = useState("completed"); // completed | pending
  const [loading, setLoading] = useState(true);

  const [totals, setTotals] = useState({ total: 0, delivered: 0, pending: 0 });
  const [series, setSeries] = useState([]);

  const [todayOrders, setTodayOrders] = useState([]);
  const [history, setHistory] = useState([]); // older than today (raw)

  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(null);

  // Collapsible "Other History"
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        if (API_BASE) {
          const res = await fetch(`${API_BASE}/api/admin/orders/overview?range=${range}`);
          const data = await res.json().catch(() => ({}));
          if (!res.ok || !data.ok) throw new Error("Failed to load orders");
          if (!alive) return;

          const safeTotals = {
            total: data.totals?.total ?? 0,
            delivered: data.totals?.delivered ?? 0,
            pending: data.totals?.pending ?? 0,
          };

          setTotals(safeTotals);
          setSeries(Array.isArray(data.series) ? data.series : []);
          const t = Array.isArray(data.today) ? data.today : [];
          const h = Array.isArray(data.history) ? data.history : [];
          setTodayOrders(t);
          setHistory(h);
          setLoading(false);
          return;
        }
      } catch (e) {
        console.warn("API not ready, using demo data:", e);
      }

      // DEMO
      const all = makeOrders(range === "year" ? 365 : range === "month" ? 45 : 14, 70);
      const today = all.filter((o) => isSameDay(o.createdAt, new Date()));
      const older = all.filter((o) => !isSameDay(o.createdAt, new Date())); // raw older

      if (!alive) return;
      setTotals(computeTotals(all));
      setSeries(buildSeries(older, range));
      setTodayOrders(today);
      setHistory(older);
      setLoading(false);
    })();
    return () => { alive = false; };
  }, [range]);

  // Chart sizing
  const chart = useMemo(() => {
    const values = series.map((p) => p.count);
    const max = Math.max(...values, 1);
    const barW = 28, gap = 12, chartH = 160;
    const chartW = series.length * barW + Math.max(0, series.length - 1) * gap;
    return { max, barW, gap, chartH, chartW };
  }, [series]);

  // Query filter
  function matchesQuery(o, q) {
    if (!q) return true;
    const t = q.toLowerCase();
    return (
      (o.id || "").toLowerCase().includes(t) ||
      (o.vendorName || "").toLowerCase().includes(t) ||
      (o.customerName || "").toLowerCase().includes(t) ||
      (o.riderName || "").toLowerCase().includes(t) ||
      (o.dropAddress || "").toLowerCase().includes(t) ||
      (o.vendorAddress || "").toLowerCase().includes(t)
    );
  }

  // Filtered collections
  const filteredTodayAll = useMemo(
    () => todayOrders.filter((o) => matchesQuery(o, query)),
    [todayOrders, query]
  );
  const filteredTodayCompleted = useMemo(
    () => filteredTodayAll.filter((o) => isDelivered(o.status)),
    [filteredTodayAll]
  );
  const filteredTodayPending = useMemo(
    () => filteredTodayAll.filter((o) => isPendingStatus(o.status)),
    [filteredTodayAll]
  );
  // History must EXCLUDE pending items (MVP)
  const filteredHistoryNonPending = useMemo(
    () =>
      history
        .filter((o) => !isPendingStatus(o.status))
        .filter((o) => matchesQuery(o, query)),
    [history, query]
  );

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f6f7f9",
        fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
        display: "grid",
        gridTemplateRows: "auto 1fr",
      }}
    >
      <header
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "12px 16px",
          background: "#fff",
          borderBottom: "1px solid #e5e7eb",
        }}
      >
        <img src="/yov.png" alt="GetYovo" style={{ height: 28, width: 28 }} />
        <strong style={{ fontSize: 16 }}>Orders</strong>

        {/* Range switcher */}
        <div
          style={{
            marginLeft: 16,
            display: "inline-flex",
            background: "#eef2ef",
            borderRadius: 10,
            overflow: "hidden",
          }}
        >
          {[
            { key: "week", label: "Weekly" },
            { key: "month", label: "Monthly" },
            { key: "year", label: "Yearly" },
          ].map((r) => (
            <button
              key={r.key}
              onClick={() => setRange(r.key)}
              style={{
                padding: "6px 10px",
                fontSize: 13,
                border: 0,
                cursor: "pointer",
                background: range === r.key ? "#166534" : "transparent",
                color: range === r.key ? "#fff" : "#111827",
                fontWeight: 600,
              }}
            >
              {r.label}
            </button>
          ))}
        </div>

        <Link
          to="/dashboard"
          style={{
            marginLeft: "auto",
            color: "#166534",
            textDecoration: "none",
            fontWeight: 600,
          }}
        >
          ← Back to Dashboard
        </Link>
      </header>

      <main style={{ padding: 20, display: "grid", gap: 16 }}>
        {/* KPIs + search (no Cancelled in MVP) */}
        <div
          style={{
            display: "grid",
            gap: 12,
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          }}
        >
          <KPI label="Total Orders" value={totals.total} sub="Selected range" />
          <KPI label="Delivered" value={totals.delivered} sub="Completed" />
          <KPI label="Pending" value={totals.pending} sub="Awaiting fulfillment" />
        </div>

        <div
          style={{
            display: "grid",
            gap: 12,
            gridTemplateColumns: "1fr 300px",
          }}
        >
          {/* Chart */}
          <div
            style={{
              background: "#fff",
              padding: 16,
              borderRadius: 10,
              border: "1px solid #e5e7eb",
              overflowX: "auto",
            }}
          >
            <div style={{ marginBottom: 8, fontWeight: 600 }}>
              Orders Growth ({range === "week" ? "last 7 days" : range === "month" ? "last 30 days" : "last 12 months"})
            </div>

            {loading ? (
              <div style={{ color: "#667085" }}>Loading chart…</div>
            ) : series.length ? (
              <svg width={chart.chartW} height={chart.chartH} role="img" aria-label="Orders growth chart">
                {series.map((p, i) => {
                  const h = Math.round((p.count / chart.max) * (chart.chartH - 24));
                  const x = i * (chart.barW + chart.gap);
                  const y = chart.chartH - h - 16;
                  return (
                    <g key={p.date}>
                      <rect x={x} y={y} width={chart.barW} height={h} rx="6" ry="6" fill="#166534" />
                      <text x={x + chart.barW / 2} y={chart.chartH - 4} textAnchor="middle" fontSize="10" fill="#64748b">
                        {labelForTick(p.date, range)}
                      </text>
                    </g>
                  );
                })}
              </svg>
            ) : (
              <div style={{ color: "#667085" }}>No chart data.</div>
            )}

            <div style={{ color: "#94a3b8", fontSize: 12, marginTop: 6 }}>
              Demo chart — will read from <code>/api/admin/orders/overview?range={"{"}week|month|year{"}"}</code> when backend is ready.
            </div>
          </div>

          {/* Search */}
          <div
            style={{
              background: "#fff",
              padding: 16,
              borderRadius: 10,
              border: "1px solid #e5e7eb",
              display: "grid",
              gap: 8,
              height: "fit-content",
            }}
          >
            <div style={{ fontWeight: 600 }}>Search</div>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by ID, vendor, customer, rider, address…"
              style={{
                width: "100%",
                padding: "10px 12px",
                border: "1px solid #e5e7eb",
                borderRadius: 8,
              }}
            />
            <div style={{ color: "#94a3b8", fontSize: 12 }}>
              Filters apply to all tables below.
            </div>
          </div>
        </div>

        {/* Today’s Orders — default Completed, toggle to Pending */}
        <Card
          title="Today’s Orders"
          sub={`From ${new Date().toLocaleDateString()}`}
        >
          <div style={{ marginBottom: 8, display: "inline-flex", gap: 6, background: "#eef2ef", borderRadius: 10, padding: 4 }}>
            <ToggleBtn active={todayMode === "completed"} onClick={() => setTodayMode("completed")}>Completed</ToggleBtn>
            <ToggleBtn active={todayMode === "pending"} onClick={() => setTodayMode("pending")}>Pending</ToggleBtn>
          </div>

          <OrdersTable
            rows={todayMode === "pending" ? filteredTodayPending : filteredTodayCompleted}
            emptyText={loading ? "Loading…" : "No orders for this view."}
            onView={(o) => setSelected(o)}
            showRider
          />
        </Card>

        {/* Collapsible Other History (EXCLUDES pending) */}
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10 }}>
          <button
            onClick={() => setShowHistory((v) => !v)}
            style={{
              width: "100%",
              textAlign: "left",
              padding: 16,
              background: "transparent",
              border: 0,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontWeight: 700,
            }}
            aria-expanded={showHistory}
          >
            <span>{showHistory ? "▾" : "▸"}</span> Other History
            <span style={{ marginLeft: 8, color: "#94a3b8", fontSize: 12 }}>
              Older than today (non-pending)
            </span>
          </button>

          {showHistory && (
            <div style={{ padding: 16, borderTop: "1px solid #e5e7eb" }}>
              <OrdersTable
                rows={filteredHistoryNonPending.slice(0, 50)}
                emptyText={loading ? "Loading…" : "No older orders."}
                onView={(o) => setSelected(o)}
                showRider
              />
            </div>
          )}
        </div>
      </main>

      {/* Drawer / Modal */}
      {selected && (
        <div
          onClick={() => setSelected(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,.4)",
            display: "grid",
            placeItems: "end",
            zIndex: 50,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: 520,
              background: "#fff",
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
              padding: 16,
              boxShadow: "0 -10px 30px rgba(0,0,0,.12)",
              maxHeight: "90vh",
              overflow: "auto",
            }}
          >
            <div style={{ display: "flex", alignItems: "center" }}>
              <strong style={{ fontSize: 16 }}>Order Details</strong>
              <button
                onClick={() => setSelected(null)}
                style={{
                  marginLeft: "auto",
                  background: "#eef2ef",
                  border: 0,
                  borderRadius: 8,
                  padding: "6px 10px",
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                Close
              </button>
            </div>

            <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
              <InfoRow label="Order ID" value={selected.id} />
              <InfoRow label="Status" value={selected.status} />
              <InfoRow label="Vendor" value={selected.vendorName} />
              <InfoRow label="Vendor Address" value={selected.vendorAddress} />
              <InfoRow label="Customer" value={`${selected.customerName} (${selected.customerPhone || "—"})`} />
              <InfoRow label="Drop-off" value={selected.dropAddress} />
              <InfoRow label="Rider" value={selected.riderName || "Not assigned"} />
              <InfoRow label="Pickup Code" value={selected.pickupCode || "—"} />
              <InfoRow label="Items" value={selected.items || "—"} />
              <InfoRow label="Created" value={new Date(selected.createdAt).toLocaleString()} />
            </div>

            <div style={{ marginTop: 14, color: "#94a3b8", fontSize: 12 }}>
              Tip: When a rider accepts multiple orders from the same vendor, each will still appear as a separate entry here and in the rider app.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- UI bits ---------- */
function KPI({ label, value, sub }) {
  return (
    <div style={{ background: "#fff", padding: 16, borderRadius: 10, border: "1px solid #e5e7eb" }}>
      <div style={{ color: "#667085", fontSize: 13 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 800 }}>{value}</div>
      <div style={{ color: "#94a3b8", fontSize: 12 }}>{sub}</div>
    </div>
  );
}

function Card({ title, sub, children }) {
  return (
    <div style={{ background: "#fff", padding: 16, borderRadius: 10, border: "1px solid #e5e7eb" }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 8 }}>
        <div style={{ fontWeight: 700 }}>{title}</div>
        {sub && <div style={{ color: "#94a3b8", fontSize: 12 }}>{sub}</div>}
      </div>
      {children}
    </div>
  );
}

function ToggleBtn({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "6px 10px",
        fontSize: 13,
        border: 0,
        cursor: "pointer",
        background: active ? "#166534" : "transparent",
        color: active ? "#fff" : "#111827",
        fontWeight: 700,
        borderRadius: 8,
      }}
    >
      {children}
    </button>
  );
}

function OrdersTable({ rows, emptyText, onView, showRider = false }) {
  if (!rows || rows.length === 0) {
    return <div style={{ color: "#667085" }}>{emptyText}</div>;
  }
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ textAlign: "left", fontSize: 13, color: "#64748b" }}>
            <th style={th}>Order ID</th>
            <th style={th}>Vendor</th>
            <th style={th}>Customer</th>
            {showRider && <th style={th}>Rider</th>}
            <th style={th}>Status</th>
            <th style={th}>Created</th>
            <th style={th}></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((o) => (
            <tr key={o.id} style={{ fontSize: 14 }}>
              <td style={td}>{o.id}</td>
              <td style={td}>{o.vendorName}</td>
              <td style={td}>{o.customerName}</td>
              {showRider && <td style={td}>{o.riderName || "—"}</td>}
              <td style={td}>{o.status}</td>
              <td style={td}>{new Date(o.createdAt).toLocaleString()}</td>
              <td style={tdRight}>
                <button
                  onClick={() => onView?.(o)}
                  style={{
                    padding: "6px 10px",
                    background: "#166534",
                    color: "#fff",
                    border: 0,
                    borderRadius: 8,
                    cursor: "pointer",
                    fontWeight: 600,
                  }}
                >
                  View
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const th = { padding: "10px 8px", borderBottom: "1px solid #e5e7eb" };
const td = { padding: "10px 8px", borderBottom: "1px solid #f1f5f9" };
const tdRight = { ...td, textAlign: "right" };

function InfoRow({ label, value }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "140px 1fr", gap: 10 }}>
      <div style={{ color: "#64748b", fontSize: 13 }}>{label}</div>
      <div style={{ fontWeight: 600 }}>{value}</div>
    </div>
  );
}