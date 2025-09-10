// src/pages/VendorTodayOrders.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate, NavLink } from "react-router-dom";
import { markOrdersSeen } from "../lib/orderNotifications";

const VENDOR_ID = localStorage.getItem("vendorId") || "vendor123";
const ORDERS_KEY = `vendor_orders_${VENDOR_ID}`;

function isToday(iso) {
  const d = new Date(iso);
  const n = new Date();
  return (
    d.getFullYear() === n.getFullYear() &&
    d.getMonth() === n.getMonth() &&
    d.getDate() === n.getDate()
  );
}
function hhmm(iso) {
  return new Date(iso).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}
function shortCode(idOrCode) {
  if (!idOrCode) return "";
  return String(idOrCode).length >= 6
    ? String(idOrCode).slice(-6).toUpperCase()
    : String(idOrCode).toUpperCase();
}
const fmtNaira = (n) => "₦" + Number(n || 0).toLocaleString();

export default function VendorTodayOrders() {
     useEffect(() => {
            markOrdersSeen();
            }, []);
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    let list;
    try {
      list = JSON.parse(localStorage.getItem(ORDERS_KEY) || "[]");
      if (!Array.isArray(list)) list = [];
    } catch {
      list = [];
    }

    // Seed a visible example in dev if empty
    if (list.length === 0) {
      const now = Date.now();
      const mk = (minsAgo, status, items, deliveryFee = 0, total) => {
        const createdAt = new Date(now - minsAgo * 60 * 1000).toISOString();
        const itemsTotal = (items || []).reduce(
          (s, it) => s + (Number(it.price) || 0) * (Number(it.qty) || 1),
          0
        );
        const finalTotal =
          typeof total === "number" ? total : itemsTotal + (deliveryFee || 0);
        return {
          id: crypto.randomUUID?.() || String(now - minsAgo * 60000),
          code: "YV-" + Math.random().toString(36).slice(2, 8).toUpperCase(),
          createdAt,
          status,
          items,
          deliveryFee,
          total: finalTotal,
        };
      };

      list = [
        mk(
          5,
          "Preparing",
          [
            { title: "Jollof Rice & Chicken", qty: 1, price: 1800 },
            { title: "Malt 33cl", qty: 1, price: 800 },
          ],
          0
        ),
        mk(
          40,
          "Out for delivery",
          [{ title: "Ogbono Soup", qty: 2, price: 1300 }],
          500
        ),
      ];

      localStorage.setItem(ORDERS_KEY, JSON.stringify(list));
    }

    setOrders(list);
  }, []);

  const todays = useMemo(() => orders.filter((o) => isToday(o.createdAt)), [orders]);

  return (
    <main className="min-h-screen bg-[#F7F9F5]">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-screen-lg mx-auto px-4 py-4 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-xl">←</button>
          <h1 className="text-2xl font-bold text-[#1b5e20]">Today’s Orders</h1>
          <div className="ml-auto">
            <NavLink to="/orders" className="text-sm text-[#1b5e20] underline">
              All Orders
            </NavLink>
          </div>
        </div>
      </header>

      <section className="max-w-screen-lg mx-auto p-4">
        {todays.length === 0 ? (
          <p className="text-center text-gray-500 mt-6">No orders yet today.</p>
        ) : (
          <div className="space-y-3">
            {todays
              .slice()
              .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
              .map((o) => {
                const itemsTotal = (o.items || []).reduce(
                  (s, it) =>
                    s + (Number(it.price) || 0) * (Number(it.qty) || 1),
                  0
                );
                const deliveryFee = Number(o.deliveryFee) || 0;
                const total =
                  typeof o.total === "number" ? o.total : itemsTotal + deliveryFee;

                return (
                  <article
                    key={o.id}
                    className="p-4 rounded-2xl bg-white border border-gray-200 shadow-sm flex items-start justify-between gap-3"
                  >
                    <div>
                      <div className="text-sm text-gray-500">{hhmm(o.createdAt)}</div>
                      <div className="font-semibold text-[#0F3D2E]">
                        Order Code:{" "}
                        <span className="font-mono">
                          {o.code || shortCode(o.id)}
                        </span>
                      </div>

                      {/* Items list with line prices */}
                      <ul className="mt-2 list-disc pl-5 text-sm text-[#0F3D2E] space-y-0.5">
                        {(o.items || []).map((it, idx) => {
                          const line = (Number(it.price) || 0) * (Number(it.qty) || 1);
                          return (
                            <li key={idx} className="flex justify-between gap-3">
                              <span>
                                {it.title} × {it.qty}
                              </span>
                              <span className="text-[#0F3D2E]/70">
                                {fmtNaira(line)}
                              </span>
                            </li>
                          );
                        })}
                      </ul>

                      {/* Optional breakdown */}
                      <div className="mt-2 text-xs text-gray-600 space-y-0.5">
                        <div className="flex justify-between">
                          <span>Items subtotal</span>
                          <b>{fmtNaira(itemsTotal)}</b>
                        </div>
                        {deliveryFee > 0 && (
                          <div className="flex justify-between">
                            <span>Delivery</span>
                            <b>{fmtNaira(deliveryFee)}</b>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="text-right min-w-[7rem]">
                      <div className="text-xs mb-1">
                        <span className="inline-block px-2 py-1 rounded-full bg-gray-100 text-gray-700">
                          {o.status}
                        </span>
                      </div>
                      <div className="text-sm text-gray-500">Total</div>
                      <div className="text-lg font-bold text-[#1b5e20]">
                        {fmtNaira(total)}
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
