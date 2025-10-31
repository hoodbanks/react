import { useEffect, useMemo, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { markOrdersSeen } from "../lib/orderNotifications";

const VENDOR_ID = localStorage.getItem("vendorId") || "vendor123";
const ORDERS_KEY = `vendor_orders_${VENDOR_ID}`;
const VERSION_KEY = `vendor_orders_version_${VENDOR_ID}`;
const SEED_VERSION = 2; // bump this to force auto-reseed

const fmtNaira = (n) => "₦" + Number(n || 0).toLocaleString();
const hhmm = (iso) =>
  new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

function isToday(iso) {
  const d = new Date(iso), n = new Date();
  return d.getFullYear()===n.getFullYear() && d.getMonth()===n.getMonth() && d.getDate()===n.getDate();
}

// ---- seed helper (10 orders, no delivery fee) ----
function buildSeed(now) {
  const mk = (minsAgo, status, items) => {
    const createdAt = new Date(now - minsAgo * 60 * 1000).toISOString();
    const itemsTotal = items.reduce((s, it) => s + it.price * it.qty, 0);
    return {
      id: (window.crypto?.randomUUID?.() || String(now - minsAgo * 60 * 1000)),
      code: "YV-" + Math.random().toString(36).slice(2, 8).toUpperCase(),
      createdAt,
      status,
      items,
      total: itemsTotal, // items only
      deliveryCode: String(Math.floor(100000 + Math.random() * 900000)),
    };
  };

  return [
    mk(3,  "New",               [{ title: "Shawarma (Chicken)", qty: 1, price: 2500 }]),
    mk(8,  "Preparing",         [
      { title: "Jollof Rice & Chicken", qty: 1, price: 1800 },
      { title: "Malt 33cl",              qty: 1, price: 800  },
    ]),
    mk(15, "Preparing",         [{ title: "Grilled Fish", qty: 1, price: 4500 }]),
    mk(22, "Out for delivery",  [
      { title: "Ogbono Soup", qty: 2, price: 1300 },
      { title: "Fufu",        qty: 2, price: 400  },
    ]),
    mk(28, "Out for delivery",  [
      { title: "Pharmacy: Paracetamol 500mg", qty: 2, price: 300 },
      { title: "Water 75cl",                  qty: 1, price: 300 },
    ]),
    mk(40, "Completed",         [
      { title: "Jollof Rice & Chicken", qty: 1, price: 1800 },
      { title: "Malt 33cl",              qty: 1, price: 800  },
    ]),
    mk(55, "Completed",         [{ title: "Cat Food 1kg", qty: 1, price: 3200 }]),
    mk(75, "Cancelled",         [{ title: "Veggie Salad Bowl", qty: 1, price: 2200 }]),
    mk(90, "Completed",         [{ title: "Yam & Egg Sauce",   qty: 1, price: 1600 }]),
    mk(180,"New",               [{ title: "Pharmacy: Vitamin C", qty: 1, price: 900 }]),
  ];
}

export default function VendorOrders() {
  useEffect(() => { markOrdersSeen(); }, []);
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [tab, setTab] = useState("All");
  const [q, setQ] = useState("");

  const resetSeed = () => {
    const seeded = buildSeed(Date.now());
    localStorage.setItem(ORDERS_KEY, JSON.stringify(seeded));
    localStorage.setItem(VERSION_KEY, String(SEED_VERSION));
    setOrders(seeded);
  };

  // Load / versioned seed (also respects ?seed=1)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const forceSeed = params.get("seed") === "1";

    let list;
    try {
      list = JSON.parse(localStorage.getItem(ORDERS_KEY) || "[]");
      if (!Array.isArray(list)) list = [];
    } catch { list = []; }

    const currentVersion = localStorage.getItem(VERSION_KEY);
    const shouldReseed = forceSeed || list.length === 0 || currentVersion !== String(SEED_VERSION);

    if (shouldReseed) {
      const seeded = buildSeed(Date.now());
      localStorage.setItem(ORDERS_KEY, JSON.stringify(seeded));
      localStorage.setItem(VERSION_KEY, String(SEED_VERSION));
      setOrders(seeded);
    } else {
      setOrders(list);
    }
  }, []);

  const save = (next) => {
    localStorage.setItem(ORDERS_KEY, JSON.stringify(next));
    setOrders(next);
  };

  const setStatus = (id, status) => {
    save(orders.map((o) => (o.id === id ? { ...o, status } : o)));
  };

  const filtered = useMemo(() => {
    let list = orders.slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    if (tab === "Today") list = list.filter((o) => isToday(o.createdAt));
    if (tab === "Preparing") list = list.filter((o) => o.status === "Preparing");
    // "Out for delivery" tab removed from nav; keep logic here in case you set it programmatically.
    if (tab === "Out for delivery") list = list.filter((o) => o.status === "Out for delivery");
    if (tab === "Completed") list = list.filter((o) => o.status === "Completed");
    if (tab === "Cancelled") list = list.filter((o) => o.status === "Cancelled");
    const s = q.trim().toLowerCase();
    if (s) {
      list = list.filter(
        (o) =>
          (o.code || "").toLowerCase().includes(s) ||
          (o.items || []).some((it) => (it.title || "").toLowerCase().includes(s))
      );
    }
    return list;
  }, [orders, tab, q]);

  // Labels unchanged; "Mark Out for delivery" still completes the order (from earlier change)
  const nextLabel = (status) =>
    status === "Preparing" ? "Mark Out for delivery"
      : status === "Out for delivery" ? "Complete"
      : status === "New" ? "Start preparing"
      : null;

  // Preparing -> Completed (skip "Out for delivery")
  const advance = (o) => {
    if (o.status === "New") return setStatus(o.id, "Preparing");
    if (o.status === "Preparing") return setStatus(o.id, "Completed");
    if (o.status === "Out for delivery") return setStatus(o.id, "Completed");
  };

  const fmtItemsTotal = (o) =>
    (o.items || []).reduce((s, it) => s + (Number(it.price) || 0) * (Number(it.qty) || 1), 0);

  return (
    <main className="min-h-screen bg-[#F7F9F5]">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-screen-lg mx-auto px-4 py-4 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-xl">←</button>
          <h1 className="text-2xl font-bold text-[#1b5e20]">Orders</h1>
          <div className="ml-auto flex items-center gap-3">
            <NavLink to="/orders/today" className="text-sm text-[#1b5e20] underline">
              Today’s Orders
            </NavLink>
            {/* Dev-only reset */}
            <button
              onClick={resetSeed}
              className="text-sm px-3 py-1 rounded-lg border bg-white hover:bg-gray-50"
              title="Reset and reseed 10 sample orders"
            >
              Reset sample orders
            </button>
          </div>
        </div>
        <div className="max-w-screen-lg mx-auto px-4 pb-4 flex flex-wrap gap-2">
          {/* ⬇️ "Out for delivery" removed from nav */}
          {["All","Today","Preparing","Completed","Cancelled"].map((t) => {
            const active = tab === t;
            return (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-3 py-1.5 rounded-full text-sm font-semibold ${
                  active ? "bg-[#1b5e20] text-white" : "bg-[#EEF2EF] text-[#1b5e20]"
                }`}
              >
                {t}
              </button>
            );
          })}
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search code or item…"
            className="ml-auto flex-1 min-w-[10rem] bg-gray-100 rounded-xl px-3 h-10 outline-none"
          />
        </div>
      </header>

      <section className="max-w-screen-lg mx-auto p-4">
        {filtered.length === 0 ? (
          <p className="text-center text-gray-500 mt-6">No orders.</p>
        ) : (
          <div className="space-y-3">
            {filtered.map((o) => {
              const total = typeof o.total === "number" ? o.total : fmtItemsTotal(o);
              return (
                <article
                  key={o.id}
                  className="p-4 rounded-2xl bg-white border border-gray-200 shadow-sm flex items-start justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="text-sm text-gray-500">{hhmm(o.createdAt)}</div>
                    <div className="font-semibold text-[#0F3D2E]">{o.code}</div>
                    <ul className="mt-1 text-sm text-[#0F3D2E]">
                      {(o.items || []).map((it, i) => (
                        <li key={i}>
                          {it.title} × {it.qty}{" "}
                          <span className="text-[#0F3D2E]/60">({fmtNaira(it.price)})</span>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-2 pt-2 border-t border-gray-100 text-sm">
                      <span className="text-gray-600">Total:</span>{" "}
                      <b className="text-[#1b5e20]">{fmtNaira(total)}</b>
                      <span className="text-gray-500 ml-2">
                        • {(o.items || []).length} item{(o.items || []).length === 1 ? "" : "s"}
                      </span>
                    </div>
                  </div>

                  <div className="text-right shrink-0 w-40">
                    <div className="mb-2">
                      <span className="inline-block px-2 py-1 rounded-full bg-gray-100 text-gray-700 text-xs">
                        {o.status}
                      </span>
                    </div>
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => navigate(`/orders/${o.id}`)}
                        className="px-3 py-2 rounded-lg bg-white border text-[#1b5e20] hover:bg-gray-50"
                      >
                        View
                      </button>
                      {nextLabel(o.status) && (
                        <button
                          onClick={() => advance(o)}
                          className="px-3 py-2 rounded-lg bg-[#1b5e20] text-white hover:opacity-90"
                        >
                          {nextLabel(o.status)}
                        </button>
                      )}
                      {o.status !== "Cancelled" && o.status !== "Completed" && (
                        <button
                          onClick={() => setStatus(o.id, "Cancelled")}
                          className="px-3 py-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}