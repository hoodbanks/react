// src/pages/Payments.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_BASE || "";

/**
 * Backend (when ready):
 * GET  /api/admin/payments?range=today|7d|30d
 *   -> { ok, payments:[{ id,orderId,createdAt,customerName,vendorName,amountPaid,deliveryFee,vendorAmount,method,status,payoutStatus,payoutPaidAt, vendorBank?, vendorAccountName?, vendorAccountNumber? }] }
 * POST /api/admin/payments/:id/mark-paid -> { ok, paidAt }
 */

// --- Demo data ---
const DEMO_CUSTOMERS = ["Ada", "Chinedu", "Ngozi", "Ifeoma", "Uche", "Tunde", "Amina", "Bola"];
const DEMO_VENDORS  = ["Candles", "Roban Mart", "PharmaPlus", "FreshMart", "ChopLife"];
const DEMO_METHODS  = ["card", "transfer"];
const DEMO_STATUS   = ["success"]; // MVP: success only

// Demo vendor bank details (for manual payout)
const DEMO_VENDOR_ACCOUNTS = {
  "Candles":    { bank: "Access Bank",  name: "Candles Ltd",    number: "0123456789" },
  "Roban Mart": { bank: "GTBank",       name: "Roban Mart Ltd", number: "0234567891" },
  "PharmaPlus": { bank: "Zenith Bank",  name: "PharmaPlus",     number: "0345678912" },
  "FreshMart":  { bank: "UBA",          name: "FreshMart Ltd",  number: "0456789123" },
  "ChopLife":   { bank: "Kuda",         name: "ChopLife",       number: "0567891234" },
};

const SEED_KEY   = "admin_demo_payments_v3_minimal";
const SEED_DAYS  = 14;
const SEED_COUNT = 30;
const ROW_LIMIT  = 50;

const moneyFmt = new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 });
const money = (n = 0) => moneyFmt.format(Math.round(n || 0));

const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];
const rint = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const uniqueId = (prefix = "id_") =>
  `${prefix}${Date.now().toString(36)}_${Math.floor(Math.random() * 1e6).toString(36)}`;

function makeDemoPayments(days = 14, count = 24) {
  const out = [];
  for (let i = 0; i < count; i++) {
    const amountPaid = rint(3500, 25000);
    const deliveryFee = rint(700, 2500);
    const vendorAmount = Math.max(0, amountPaid - deliveryFee); // split
    const d = new Date();
    d.setDate(d.getDate() - rint(0, days - 1));
    d.setHours(rint(8, 22), rint(0, 59), 0, 0);
    out.push({
      id: uniqueId("pay_"),
      orderId: uniqueId("ord_"),
      createdAt: d.toISOString(),
      customerName: rand(DEMO_CUSTOMERS),
      vendorName: rand(DEMO_VENDORS),
      amountPaid,
      deliveryFee,
      vendorAmount,
      method: rand(DEMO_METHODS),
      status: rand(DEMO_STATUS),
      payoutStatus: "unpaid",
      payoutPaidAt: null,
    });
  }
  return out.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

function isSameDay(a, b) {
  const da = new Date(a), db = new Date(b);
  return da.getFullYear() === db.getFullYear() &&
         da.getMonth() === db.getMonth() &&
         da.getDate() === db.getDate();
}

// Ensure IDs are unique in demo (prevents “mark one → all change”)
function dedupeIds(dataset) {
  const seen = new Set();
  let changed = false;
  for (const p of dataset) {
    if (!p.id || seen.has(p.id)) {
      p.id = uniqueId("pay_");
      changed = true;
    }
    seen.add(p.id);
  }
  if (changed) localStorage.setItem(SEED_KEY, JSON.stringify(dataset));
  return dataset;
}

export default function Payments() {
  // minimal nav state
  const [range, setRange] = useState(() => localStorage.getItem("adm_pay_range") || "today"); // today|7d|30d
  const setRangePersist = (r) => { setRange(r); localStorage.setItem("adm_pay_range", r); };

  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [reloadKey, setReloadKey] = useState(0); // refresh after add/mark

  // Load (API -> demo)
  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        if (API_BASE) {
          const res = await fetch(`${API_BASE}/api/admin/payments?range=${range}`);
          const data = await res.json().catch(() => ({}));
          if (!res.ok || !data.ok) throw new Error("Failed to load payments");
          if (!alive) return;
          const list = (Array.isArray(data.payments) ? data.payments : [])
            .filter(p => String(p.status).toLowerCase() === "success");
          setRows(list.slice(0, ROW_LIMIT));
          setLoading(false);
          return;
        }
      } catch { /* fall to demo */ }

      // DEMO
      let dataset = JSON.parse(localStorage.getItem(SEED_KEY) || "null");
      if (!dataset) {
        dataset = makeDemoPayments(SEED_DAYS, SEED_COUNT);
        localStorage.setItem(SEED_KEY, JSON.stringify(dataset));
      }
      dataset = dedupeIds(dataset);

      const now = new Date();
      let filtered = dataset;
      if (range === "today") {
        filtered = dataset.filter((p) => isSameDay(p.createdAt, now));
      } else if (range === "7d") {
        const from = new Date(now); from.setDate(now.getDate() - 6);
        filtered = dataset.filter((p) => new Date(p.createdAt) >= from);
      } else if (range === "30d") {
        const from = new Date(now); from.setDate(now.getDate() - 29);
        filtered = dataset.filter((p) => new Date(p.createdAt) >= from);
      }

      filtered = filtered.filter(p => String(p.status).toLowerCase() === "success");

      if (!alive) return;
      setRows(filtered.slice(0, ROW_LIMIT));
      setLoading(false);
    })();
    return () => { alive = false; };
  }, [range, API_BASE, reloadKey]);

  // KPI values (range)
  const deliveryTotal = useMemo(
    () => rows.reduce((s, p) => s + (p.deliveryFee || 0), 0),
    [rows]
  );
  const paidToVendorsTotal = useMemo(
    () => rows.filter(p => p.payoutStatus === "paid").reduce((s, p) => s + (p.vendorAmount || 0), 0),
    [rows]
  );

  // Actions
  async function markPaid(id) {
    try {
      if (API_BASE) {
        const res = await fetch(
          `${API_BASE}/api/admin/payments/${encodeURIComponent(id)}/mark-paid`,
          { method: "POST" }
        );
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.ok) throw new Error(data.error || "Failed to mark paid");
      } else {
        // persist in demo (by id only — others unaffected)
        const dataset = JSON.parse(localStorage.getItem(SEED_KEY) || "[]");
        const idx = dataset.findIndex((p) => p.id === id);
        if (idx >= 0) {
          dataset[idx] = { ...dataset[idx], payoutStatus: "paid", payoutPaidAt: new Date().toISOString() };
          localStorage.setItem(SEED_KEY, JSON.stringify(dataset));
        }
      }
      // Reload from storage to reflect correctly & avoid any object aliasing
      setReloadKey((k) => k + 1);
    } catch (e) {
      alert(e.message || "Could not mark as paid.");
    }
  }

  // Add one demo payment with unique IDs
  function addDemoPayment() {
    const dataset = JSON.parse(localStorage.getItem(SEED_KEY) || "[]");
    const one = makeDemoPayments(1, 1)[0];
    one.createdAt = new Date().toISOString();
    const next = [one, ...dataset].slice(0, SEED_COUNT);
    localStorage.setItem(SEED_KEY, JSON.stringify(dedupeIds(next)));
    setReloadKey((k) => k + 1);
  }

  return (
    <div className="min-h-screen grid grid-rows-[auto_1fr] bg-gradient-to-br from-emerald-50 to-slate-50 font-sans">
      {/* NAV */}
      <header className="flex items-center gap-3 px-4 py-3 bg-white/90 backdrop-blur border-b">
        <img src="/yov.png" alt="GetYovo" className="h-7 w-7 rounded" />
        <strong className="text-base">Payments</strong>

        {/* Range pills */}
        <div className="ml-2 inline-flex rounded-full bg-emerald-100/70 p-1 ring-1 ring-emerald-200">
          {[
            { key: "today", label: "Today" },
            { key: "7d",    label: "Last 7 days" },
            { key: "30d",   label: "Last 30 days" },
          ].map((r) => (
            <button
              key={r.key}
              onClick={() => setRangePersist(r.key)}
              className={`px-3 py-1.5 text-sm font-semibold rounded-full transition ${
                range === r.key ? "bg-emerald-600 text-white" : "text-emerald-900 hover:bg-emerald-200/70"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>

        <Link to="/dashboard" className="ml-auto text-emerald-700 font-semibold hover:underline">
          ← Back to Dashboard
        </Link>
      </header>

      {/* Demo bar */}
      {!API_BASE && (
        <div className="flex items-center gap-3 border-b border-amber-200 bg-amber-50/80 px-4 py-2 text-sm text-amber-900">
          Demo mode. Click “Mark Paid” after you pay manually.
          <button
            onClick={addDemoPayment}
            className="ml-auto inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 font-semibold text-white hover:bg-emerald-700"
          >
            + Add Demo Payment
          </button>
        </div>
      )}

      {/* Content */}
      <main className="p-5 space-y-4">
        {/* KPI cards */}
        <div className="grid gap-3 sm:grid-cols-2 max-w-3xl">
          <KPI title="Delivery Fees (range)" value={money(deliveryTotal)} hint="Sum for payments shown" />
          <KPI title="Total Paid to Vendors (range)" value={money(paidToVendorsTotal)} hint="Marked as paid" />
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-2xl border bg-white/90 p-4 shadow-sm">
          {loading ? (
            <div className="text-slate-500">Loading payments…</div>
          ) : rows.length === 0 ? (
            <div className="text-slate-500">No payments found for this range.</div>
          ) : (
            <table className="w-full border-collapse">
              <thead>
                <tr className="text-left text-sm text-slate-500">
                  <Th>Time</Th>
                  <Th>Payment ID</Th>
                  <Th>Order</Th>
                  <Th>Customer</Th>
                  <Th>Vendor</Th>
                  <Th>Account</Th>
                  <Th className="text-right">Amount Paid</Th>
                  <Th className="text-right">Delivery Fee</Th>
                  <Th className="text-right">Vendor Amount</Th>
                  <Th>Method</Th>
                  <Th>Payout</Th>
                  <Th className="text-right">Action</Th>
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, ROW_LIMIT).map((p) => {
                  const acc =
                    (p.vendorBank || p.vendorAccountName || p.vendorAccountNumber)
                      ? { bank: p.vendorBank, name: p.vendorAccountName, number: p.vendorAccountNumber }
                      : DEMO_VENDOR_ACCOUNTS[p.vendorName];

                  return (
                    <tr key={p.id} className="text-sm">
                      <Td>{new Date(p.createdAt).toLocaleString()}</Td>
                      <Td><span className="font-semibold">{p.id}</span></Td>
                      <Td>{p.orderId}</Td>
                      <Td>{p.customerName}</Td>
                      <Td>{p.vendorName}</Td>
                      <Td>
                        {acc ? (
                          <div className="text-xs leading-5">
                            <div><span className="font-medium">{acc.bank}</span></div>
                            <div className="text-slate-500">{acc.name}</div>
                            <div className="font-semibold tracking-wider">{acc.number}</div>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs">—</span>
                        )}
                      </Td>
                      <Td className="text-right font-semibold">{money(p.amountPaid)}</Td>
                      <Td className="text-right">{money(p.deliveryFee)}</Td>
                      <Td className="text-right text-emerald-700 font-extrabold">{money(p.vendorAmount)}</Td>
                      <Td className="capitalize">{p.method}</Td>
                      <Td>
                        {p.payoutStatus === "paid" ? (
                          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-700 ring-1 ring-emerald-200">
                            Paid
                          </span>
                        ) : (
                          <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-bold text-amber-800 ring-1 ring-amber-200">
                            Unpaid
                          </span>
                        )}
                      </Td>
                      <Td className="text-right">
                        {p.payoutStatus !== "paid" && (
                          <button
                            onClick={() => markPaid(p.id)}
                            className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-emerald-700"
                          >
                            Mark Paid
                          </button>
                        )}
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
          <div className="mt-2 text-xs text-slate-400">Showing up to {ROW_LIMIT} rows.</div>
        </div>
      </main>
    </div>
  );
}

function KPI({ title, value, hint }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border bg-white/90 p-4 shadow-sm">
      <div className="absolute -top-10 -right-10 h-24 w-24 rounded-full bg-emerald-100" />
      <div className="text-sm text-slate-500">{title}</div>
      <div className="text-2xl font-extrabold tracking-tight">{value}</div>
      <div className="text-xs text-slate-400">{hint}</div>
    </div>
  );
}
function Th({ children, className = "" }) {
  return <th className={`border-b px-2 py-2 ${className}`}>{children}</th>;
}
function Td({ children, className = "" }) {
  return <td className={`border-b border-slate-100 px-2 py-2 ${className}`}>{children}</td>;
}