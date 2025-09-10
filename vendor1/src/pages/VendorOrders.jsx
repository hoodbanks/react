import { useEffect, useMemo, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { markOrdersSeen } from "../lib/orderNotifications";


const VENDOR_ID = localStorage.getItem("vendorId") || "vendor123";
const ORDERS_KEY = `vendor_orders_${VENDOR_ID}`;

const fmtNaira = (n) => "₦" + Number(n || 0).toLocaleString();
const hhmm = (iso) =>
  new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

function isToday(iso) {
  const d = new Date(iso), n = new Date();
  return d.getFullYear()===n.getFullYear() && d.getMonth()===n.getMonth() && d.getDate()===n.getDate();
}

export default function VendorOrders() {
    useEffect(() => {
        markOrdersSeen();
        }, []);
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [tab, setTab] = useState("All");
  const [q, setQ] = useState("");

  // Load / seed
  useEffect(() => {
    let list;
    try {
      list = JSON.parse(localStorage.getItem(ORDERS_KEY) || "[]");
      if (!Array.isArray(list)) list = [];
    } catch { list = []; }

    if (list.length === 0) {
      const now = Date.now();
      const mk = (minsAgo, status, items, deliveryFee = 0) => {
        const createdAt = new Date(now - minsAgo * 60 * 1000).toISOString();
        const itemsTotal = items.reduce((s, it) => s + it.price * it.qty, 0);
        return {
          id: crypto.randomUUID?.() || String(now - minsAgo * 60 * 1000),
          code: "YV-" + Math.random().toString(36).slice(2, 8).toUpperCase(),
          createdAt,
          status,
          items,
          deliveryFee,
          total: itemsTotal + deliveryFee,
          deliveryCode: String(Math.floor(100000 + Math.random() * 900000)),
        };
      };
      list = [
        mk(10, "Preparing", [{ title: "Jollof Rice & Chicken", qty: 1, price: 1800 }, { title: "Malt 33cl", qty: 1, price: 800 }]),
        mk(35, "Out for delivery", [{ title: "Ogbono Soup", qty: 2, price: 1300 }], 500),
        mk(70, "Completed", [{ title: "Dog Food", qty: 1, price: 1500 }]),
      ];
      localStorage.setItem(ORDERS_KEY, JSON.stringify(list));
    }

    setOrders(list);
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
    if (tab === "Out for delivery") list = list.filter((o) => o.status === "Out for delivery");
    if (tab === "Completed") list = list.filter((o) => o.status === "Completed");
    if (tab === "Cancelled") list = list.filter((o) => o.status === "Cancelled");
    const s = q.trim().toLowerCase();
    if (s) {
      list = list.filter(
        (o) =>
          (o.code || "").toLowerCase().includes(s) ||
          (o.items || []).some((it) => it.title.toLowerCase().includes(s))
      );
    }
    return list;
  }, [orders, tab, q]);

  const nextLabel = (status) =>
    status === "Preparing" ? "Mark Out for delivery"
      : status === "Out for delivery" ? "Complete"
      : status === "New" ? "Start preparing"
      : null;

  const advance = (o) => {
    if (o.status === "New") return setStatus(o.id, "Preparing");
    if (o.status === "Preparing") return setStatus(o.id, "Out for delivery");
    if (o.status === "Out for delivery") return setStatus(o.id, "Completed");
  };

  return (
    <main className="min-h-screen bg-[#F7F9F5]">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-screen-lg mx-auto px-4 py-4 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-xl">←</button>
          <h1 className="text-2xl font-bold text-[#1b5e20]">Orders</h1>
          <div className="ml-auto">
            <NavLink to="/orders/today" className="text-sm text-[#1b5e20] underline">
              Today’s Orders
            </NavLink>
          </div>
        </div>
        <div className="max-w-screen-lg mx-auto px-4 pb-4 flex flex-wrap gap-2">
          {["All","Today","Preparing","Out for delivery","Completed","Cancelled"].map((t) => {
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
              const itemsTotal = (o.items || []).reduce(
                (s, it) => s + (Number(it.price) || 0) * (Number(it.qty) || 1), 0
              );
              const deliveryFee = Number(o.deliveryFee) || 0;
              const total = typeof o.total === "number" ? o.total : itemsTotal + deliveryFee;

              return (
                <article
                  key={o.id}
                  className="p-4 rounded-2xl bg-white border border-gray-200 shadow-sm flex items-start justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="text-sm text-gray-500">{hhmm(o.createdAt)}</div>
                    <div className="font-semibold text-[#0F3D2E]">
                      {o.code} • <span className="text-[#1b5e20]">{fmtNaira(total)}</span>
                    </div>
                    <ul className="mt-1 text-sm text-[#0F3D2E]">
                      {(o.items || []).map((it, i) => (
                        <li key={i}>
                          {it.title} × {it.qty} <span className="text-[#0F3D2E]/60">({fmtNaira(it.price)})</span>
                        </li>
                      ))}
                    </ul>
                    {deliveryFee > 0 && (
                      <div className="text-xs text-gray-600 mt-1">
                        Delivery: <b>{fmtNaira(deliveryFee)}</b>
                      </div>
                    )}
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
