// src/pages/VendorDashboard.jsx
import { useEffect, useMemo, useState } from "react";
import { NavLink } from "react-router-dom";
import NotificationBell from "../pages/NotificationBell.jsx";
 import RequestPushBanner from "../pages/RequestPushBanner.jsx";

import {
  subscribeOrders,
  getOrders,
  seedDemoIfEmpty,
  computeStats,
} from "../lib/ordersStore";

const fmtNaira = (n) => "₦" + Number(n || 0).toLocaleString();
const dayKey = (d) => d.toISOString().slice(0, 10); // YYYY-MM-DD
const dayShort = (d) => d.toLocaleDateString(undefined, { weekday: "short" });

export default function VendorDashboard() {
  const vendorId = localStorage.getItem("vendorId") || "vendor123";
  const vendorName = localStorage.getItem("vendorEmail") || "Vendor";

  const [orders, setOrders] = useState([]);

  // Load + live updates
  useEffect(() => {
    seedDemoIfEmpty(vendorId);
    const unsub = subscribeOrders(() => {
      setOrders(getOrders({ vendorId }));
    });
    return unsub;
  }, [vendorId]);

  // Top stats
  const stats = useMemo(() => computeStats(orders), [orders]);

  // Earnings last 7 days (completed only)
  const last7 = useMemo(() => {
    const map = new Map();
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - i);
      map.set(dayKey(d), { date: new Date(d), total: 0 });
    }
    orders
      .filter((o) => o.status === "Completed")
      .forEach((o) => {
        const d = new Date(o.createdAt);
        const k = dayKey(d);
        if (map.has(k)) map.get(k).total += o.total || 0;
      });
    return Array.from(map.values());
  }, [orders]);

  const maxDay = useMemo(
    () => Math.max(...last7.map((d) => d.total), 0),
    [last7]
  );

  return (
    <main className="min-h-screen bg-[#F7F9F5]">
      {/* Header */}
      <header className="bg-[#1b5e20] text-white sticky top-0 z-30 shadow-lg">
        <div className="max-w-screen-lg mx-auto px-4 py-4 flex items-center gap-3">
        <h1 className="text-2xl font-bold">Dashboard</h1>
         <span className="ml-auto text-sm opacity-80">Welcome, {vendorName}</span>
         <NotificationBell /> {/* ← NEW bell with badge + sound */}
       </div>
       <RequestPushBanner />
      </header>

      {/* Quick Stats */}
      <section className="max-w-screen-lg mx-auto p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Today's Orders → page */}
        <NavLink
          to="/orders/today"
          className="block bg-white p-4 rounded-2xl shadow border border-gray-100 hover:shadow-md transition"
          title="Open today's orders"
        >
          <h3 className="text-sm font-medium text-gray-500">Today's Orders</h3>
          <p className="text-2xl font-bold text-[#1b5e20] mt-1">{stats.todayCount}</p>
          <span className="inline-block mt-1 text-xs text-gray-500">Open page →</span>
        </NavLink>

        {/* Today's Earnings */}
        <div className="bg-white p-4 rounded-2xl shadow border border-gray-100 hover:shadow-md transition">
          <h3 className="text-sm font-medium text-gray-500">Today's Earnings</h3>
          <p className="text-2xl font-bold text-[#1b5e20] mt-1">
            {fmtNaira(stats.todaysEarnings)}
          </p>
          <span className="inline-block mt-1 text-xs text-gray-500">
            Completed orders only
          </span>
        </div>

        {/* Completed */}
        <div className="bg-white p-4 rounded-2xl shadow border border-gray-100 hover:shadow-md transition">
          <h3 className="text-sm font-medium text-gray-500">Completed</h3>
          <p className="text-2xl font-bold text-[#1b5e20] mt-1">{stats.completedCount}</p>
        </div>

        {/* Pending */}
        <div className="bg-white p-4 rounded-2xl shadow border border-gray-100 hover:shadow-md transition">
          <h3 className="text-sm font-medium text-gray-500">Pending</h3>
          <p className="text-2xl font-bold text-[#1b5e20] mt-1">{stats.pendingCount}</p>
        </div>
      </section>

      {/* Earnings history (last 7 days) */}
      <section className="max-w-screen-lg mx-auto px-4 pb-2">
        <div className="bg-white rounded-2xl shadow border border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-[#1b5e20]">
              Earnings (last 7 days)
            </h3>
            <NavLink to="/orders" className="text-sm text-[#1b5e20] underline" title="See orders">
              See orders
            </NavLink>
          </div>

          {/* Tiny bar chart (pure CSS) */}
          <div className="mt-4 h-28 grid grid-cols-7 gap-2 items-end">
            {last7.map((d, i) => {
              const pct = maxDay > 0 ? Math.round((d.total / maxDay) * 100) : 0;
              return (
                <div key={i} className="flex flex-col items-center gap-1">
                  <div
                    className="w-8 rounded-md bg-emerald-200"
                    style={{ height: `${Math.max(pct, 6)}%` }} // ensure visible
                    title={`${dayShort(d.date)} • ${fmtNaira(d.total)}`}
                  />
                  <span className="text-[10px] text-gray-500">{dayShort(d.date)}</span>
                </div>
              );
            })}
          </div>

          <div className="mt-3 text-sm text-gray-600 flex flex-wrap gap-x-6">
            <span>
              7-day total:{" "}
              <b>{fmtNaira(last7.reduce((s, d) => s + d.total, 0))}</b>
            </span>
            <span>
              Best day: <b>{fmtNaira(Math.max(...last7.map((d) => d.total), 0))}</b>
            </span>
          </div>
        </div>
      </section>

      {/* Quick Links */}
      <section className="max-w-screen-lg mx-auto p-4 space-y-3">
        <NavLink
          to="/products"
          className="block bg-white rounded-2xl border border-gray-200 p-5 hover:bg-gray-50 shadow"
        >
          <h3 className="text-lg font-semibold text-[#1b5e20]">Manage Products</h3>
          <p className="text-sm text-gray-500">Add, edit, or remove your items</p>
        </NavLink>

        <NavLink
          to="/orders"
          className="block bg-white rounded-2xl border border-gray-200 p-5 hover:bg-gray-50 shadow"
        >
          <h3 className="text-lg font-semibold text-[#1b5e20]">Manage Orders</h3>
          <p className="text-sm text-gray-500">Track, update, and complete customer orders</p>
        </NavLink>

        <NavLink
          to="/settings"
          className="block bg-white rounded-2xl border border-gray-200 p-5 hover:bg-gray-50 shadow"
        >
          <h3 className="text-lg font-semibold text-[#1b5e20]">Store Settings</h3>
          <p className="text-sm text-gray-500">Update store details, payout info, and more</p>
        </NavLink>
      </section>
    </main>
  );
}
