// src/pages/Vendors.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_BASE || "";

/**
 * Expected backend (when ready):
 * GET    /api/admin/vendors -> {
 *   ok:true,
 *   vendors:[{
 *     id,name,owner,phone,email,address,status,joinedAt,orderCount,
 *     accountName, bankName, accountNumber
 *   }]
 * }
 * POST   /api/admin/vendors/:id/approve -> { ok:true }
 * POST   /api/admin/vendors/:id/suspend -> { ok:true }
 * DELETE /api/admin/vendors/:id         -> { ok:true }
 */

/* -------- DEMO VENDORS (used only when no API) -------- */
const DEMO_VENDORS = [
  {
    id: "v_1001",
    name: "Candles",
    owner: "Ada C.",
    phone: "+2348011111111",
    email: "candles@getyovo.test",
    address: "18 Ogui Rd, Enugu",
    status: "Pending",
    joinedAt: "2025-09-10T08:42:00Z",
    orderCount: 0,
    accountName: "Candles Enterprises",
    bankName: "GTBank",
    accountNumber: "0123456789",
  },
  {
    id: "v_1002",
    name: "Roban Mart",
    owner: "Chinedu O.",
    phone: "+2348022222222",
    email: "robanmart@getyovo.test",
    address: "Ogige Market",
    status: "Approved",
    joinedAt: "2025-09-08T11:05:00Z",
    orderCount: 34,
    accountName: "Roban Stores Ltd",
    bankName: "Access Bank",
    accountNumber: "0234567890",
  },
  {
    id: "v_1003",
    name: "PharmaPlus",
    owner: "Ngozi I.",
    phone: "+2348033333333",
    email: "pharmaplus@getyovo.test",
    address: "Independence Layout",
    status: "Suspended",
    joinedAt: "2025-09-06T15:12:00Z",
    orderCount: 0,
    accountName: "PharmaPlus Nigeria",
    bankName: "Zenith Bank",
    accountNumber: "0345678901",
  },
  {
    id: "v_1004",
    name: "FreshMart",
    owner: "Ifeoma N.",
    phone: "+2348044444444",
    email: "freshmart@getyovo.test",
    address: "36 Bisalla Rd, Enugu",
    status: "Approved",
    joinedAt: "2025-09-03T09:20:00Z",
    orderCount: 27,
    accountName: "FreshMart Foods",
    bankName: "UBA",
    accountNumber: "0456789012",
  },
  {
    id: "v_1005",
    name: "ChopLife",
    owner: "Uche K.",
    phone: "+2348055555555",
    email: "choplife@getyovo.test",
    address: "10 Chime Ave",
    status: "Pending",
    joinedAt: "2025-09-10T10:22:00Z",
    orderCount: 0,
    accountName: "ChopLife Kitchen",
    bankName: "First Bank",
    accountNumber: "0567890123",
  },
];

const DEMO_BANKS = ["GTBank", "Access Bank", "Zenith Bank", "UBA", "First Bank"];

const slug = (s = "") =>
  String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "vendor";

const ensureEmail = (v) =>
  v.email ? v : { ...v, email: `${slug(v.name)}@getyovo.test` };

/** Add payout fields if missing (for older saved demos) */
function ensurePayout(v) {
  if (v.accountName && v.bankName && v.accountNumber) return v;
  const baseName = v.name || "Vendor";
  const accountName = v.accountName || `${baseName} Enterprises`;
  const bankName = v.bankName || DEMO_BANKS[Math.floor(Math.random() * DEMO_BANKS.length)];
  const accountNumber =
    v.accountNumber || String(Math.floor(1000000000 + Math.random() * 9000000000));
  return { ...v, accountName, bankName, accountNumber };
}

/** Enforce: only Approved vendors *display* order count (>0). */
const normalizeVendors = (list = []) =>
  list.map((v) => {
    const s = String(v.status || "").toLowerCase();
    return s === "approved" ? v : { ...v, orderCount: Number(v.orderCount || 0) };
  });

const displayCount = (v) =>
  String(v.status || "").toLowerCase() === "approved" ? (v.orderCount ?? 0) : 0;

export default function Vendors() {
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("pending"); // pending | approved | suspended | all
  const [query, setQuery] = useState("");
  const [rows, setRows] = useState([]);
  const [selected, setSelected] = useState(null);
  const [busyId, setBusyId] = useState(null);

  // Load vendors (API -> demo fallback) and persist demo edits.
  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        if (API_BASE) {
          const res = await fetch(`${API_BASE}/api/admin/vendors`);
          const data = await res.json().catch(() => ({}));
          if (!res.ok || !data.ok) throw new Error("Failed to load vendors");
          if (!alive) return;
          const clean = normalizeVendors(
            (Array.isArray(data.vendors) ? data.vendors : []).map(ensureEmail).map(ensurePayout)
          );
          setRows(clean);
          setLoading(false);
          return;
        }
      } catch {
        // fall through
      }
      if (!alive) return;
      const saved = localStorage.getItem("admin_demo_vendors");
      const base = saved ? JSON.parse(saved) : DEMO_VENDORS;
      const clean = normalizeVendors(base.map(ensureEmail).map(ensurePayout));
      setRows(clean);
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!API_BASE) localStorage.setItem("admin_demo_vendors", JSON.stringify(rows));
  }, [rows]);

  const counts = useMemo(() => {
    const c = { total: rows.length, pending: 0, approved: 0, suspended: 0 };
    rows.forEach((v) => {
      const s = (v.status || "").toLowerCase();
      if (s === "pending") c.pending++;
      else if (s === "approved") c.approved++;
      else if (s === "suspended") c.suspended++;
    });
    return c;
  }, [rows]);

  const filtered = useMemo(() => {
    let list = rows.slice();
    if (tab !== "all") list = list.filter((v) => (v.status || "").toLowerCase() === tab);
    const t = query.trim().toLowerCase();
    if (t) {
      list = list.filter(
        (v) =>
          (v.name || "").toLowerCase().includes(t) ||
          (v.owner || "").toLowerCase().includes(t) ||
          (v.phone || "").toLowerCase().includes(t) ||
          (v.email || "").toLowerCase().includes(t) ||
          (v.address || "").toLowerCase().includes(t) ||
          (v.id || "").toLowerCase().includes(t) ||
          (v.bankName || "").toLowerCase().includes(t) ||
          (v.accountName || "").toLowerCase().includes(t) ||
          (v.accountNumber || "").toLowerCase().includes(t)
      );
    }
    return list.sort((a, b) => new Date(b.joinedAt) - new Date(a.joinedAt));
  }, [rows, tab, query]);

  /* -------- Actions -------- */
  async function approve(id) {
    setBusyId(id);
    try {
      if (API_BASE) {
        const res = await fetch(
          `${API_BASE}/api/admin/vendors/${encodeURIComponent(id)}/approve`,
          { method: "POST" }
        );
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.ok) throw new Error(data.error || "Approve failed");
      }
      setRows((list) => list.map((v) => (v.id === id ? { ...v, status: "Approved" } : v)));
      if (selected?.id === id) setSelected((s) => (s ? { ...s, status: "Approved" } : s));
    } catch (e) {
      alert(e.message || "Could not approve vendor.");
    } finally {
      setBusyId(null);
    }
  }

  async function suspend(id) {
    setBusyId(id);
    try {
      if (API_BASE) {
        const res = await fetch(
          `${API_BASE}/api/admin/vendors/${encodeURIComponent(id)}/suspend`,
          { method: "POST" }
        );
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.ok) throw new Error(data.error || "Suspend failed");
      }
      setRows((list) => list.map((v) => (v.id === id ? { ...v, status: "Suspended" } : v)));
      if (selected?.id === id) setSelected((s) => (s ? { ...s, status: "Suspended" } : s));
    } catch (e) {
      alert(e.message || "Could not suspend vendor.");
    } finally {
      setBusyId(null);
    }
  }

  async function removeVendor(id) {
    if (!confirm("Delete this vendor? This cannot be undone.")) return;
    setBusyId(id);
    try {
      if (API_BASE) {
        const res = await fetch(
          `${API_BASE}/api/admin/vendors/${encodeURIComponent(id)}`,
          { method: "DELETE" }
        );
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.ok) throw new Error(data.error || "Delete failed");
      }
      setRows((list) => list.filter((v) => v.id !== id));
      if (selected?.id === id) setSelected(null);
    } catch (e) {
      alert(e.message || "Could not delete vendor.");
    } finally {
      setBusyId(null);
    }
  }

  function addDemoVendor() {
    const nextId = "v_" + Math.floor(1000 + Math.random() * 9000);
    const base = `vendor${nextId.slice(-2)}`;
    const demo = {
      id: nextId,
      name: "New Vendor " + nextId.slice(-2),
      owner: "Owner " + String.fromCharCode(65 + Math.floor(Math.random() * 26)) + ".",
      phone: "+23480" + Math.floor(10000000 + Math.random() * 89999999),
      email: `${base}@getyovo.test`,
      address: "Address " + Math.floor(Math.random() * 50 + 1),
      status: "Pending",
      joinedAt: new Date().toISOString(),
      orderCount: 0, // pending start with 0 orders
      accountName: `Account ${nextId.slice(-2)}`,
      bankName: DEMO_BANKS[Math.floor(Math.random() * DEMO_BANKS.length)],
      accountNumber: String(Math.floor(1000000000 + Math.random() * 9000000000)),
    };
    setRows((list) => [demo, ...list]);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-slate-50 grid grid-rows-[auto_1fr] font-sans">
      {/* Header */}
      <header className="sticky top-0 z-20 flex items-center gap-3 px-4 py-3 bg-white/80 backdrop-blur border-b">
        <img src="/yov.png" alt="GetYovo" className="h-7 w-7 rounded" />
        <strong className="text-base">Vendors</strong>

        {/* Tabs */}
        <div className="ml-3 inline-flex rounded-full bg-emerald-100/60 p-1 ring-1 ring-emerald-200">
          {[
            { key: "pending", label: `Pending (${counts.pending})` },
            { key: "approved", label: `Approved (${counts.approved})` },
            { key: "suspended", label: `Suspended (${counts.suspended})` },
            { key: "all", label: `All (${counts.total})` },
          ].map((ti) => (
            <button
              key={ti.key}
              onClick={() => setTab(ti.key)}
              className={`px-3 py-1.5 text-sm font-semibold rounded-full transition ${
                tab === ti.key
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-emerald-900 hover:bg-emerald-200/60"
              }`}
            >
              {ti.label}
            </button>
          ))}
        </div>

        <Link to="/dashboard" className="ml-auto text-emerald-700 font-semibold hover:underline">
          ← Back to Dashboard
        </Link>
      </header>

      {/* Demo banner */}
      {!API_BASE && (
        <div className="bg-amber-50/80 text-amber-900 text-sm px-4 py-2 border-b border-amber-200 flex items-center gap-3">
          Demo mode: payout details are visible here for manual payments.
          <button
            onClick={addDemoVendor}
            className="ml-auto inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-700 shadow-sm"
          >
            + Add Demo Vendor
          </button>
        </div>
      )}

      {/* Content */}
      <main className="p-5 space-y-5">
        {/* KPIs */}
        <div className="grid gap-4 grid-cols-[repeat(auto-fit,minmax(220px,1fr))]">
          <KPI label="Total Vendors" value={counts.total} sub="All statuses" />
          <KPI label="Pending" value={counts.pending} sub="Awaiting approval" />
          <KPI label="Approved" value={counts.approved} sub="Active vendors" />
          <KPI label="Suspended" value={counts.suspended} sub="Restricted vendors" />
        </div>

        {/* Search */}
        <div className="rounded-2xl border bg-white/80 backdrop-blur p-4 shadow-sm">
          <div className="relative w-full">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by business, owner, phone, email, address, vendor ID, bank or account…"
              className="w-full px-4 py-2.5 rounded-xl border outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-slate-400"
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
              ⌘K
            </span>
          </div>
        </div>

        {/* Card grid */}
        <section className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(300px,1fr))]">
          {loading ? (
            <div className="col-span-full text-slate-500">Loading vendors…</div>
          ) : filtered.length === 0 ? (
            <div className="col-span-full text-slate-500">No vendors found.</div>
          ) : (
            filtered.map((v) => (
              <article
                key={v.id}
                className="group relative rounded-2xl border bg-white/80 backdrop-blur p-5 shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:shadow-md"
              >
                {/* Top */}
                <div className="flex items-start gap-3">
                  <div className="grid h-12 w-12 place-items-center rounded-xl bg-emerald-50 ring-1 ring-emerald-100 shadow-inner">
                    <span className="text-emerald-700 font-black">
                      {v.name?.slice(0, 1) || "V"}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="truncate text-lg font-semibold text-slate-900">
                        {v.name}
                      </h3>
                      <StatusPill status={v.status} />
                    </div>
                    <div className="text-xs text-slate-400">{v.id}</div>
                  </div>
                </div>

                {/* Meta */}
                <dl className="mt-4 space-y-2 text-sm">
                  <Row label="Owner" value={v.owner || "—"} />
                  <Row
                    label="Email"
                    value={
                      v.email ? (
                        <a className="text-emerald-700 hover:underline" href={`mailto:${v.email}`}>
                          {v.email}
                        </a>
                      ) : (
                        "—"
                      )
                    }
                  />
                  <Row label="Phone" value={v.phone || "—"} />
                  <Row label="Address" value={v.address || "—"} />
                  <Row label="Joined" value={new Date(v.joinedAt).toLocaleString()} />
                </dl>

                {/* Payout Account */}
                <div className="mt-4 rounded-xl border p-3 bg-emerald-50/30 ring-1 ring-emerald-100/60">
                  <div className="text-xs font-semibold text-emerald-800">Payout Account</div>
                  <div className="mt-1 text-sm text-slate-700">
                    <strong className="font-semibold">{v.accountName || "—"}</strong>
                  </div>
                  <div className="text-sm text-slate-700">{v.bankName || "—"}</div>
                  <div className="mt-1 flex items-center gap-2">
                    <code className="rounded bg-white/70 px-2 py-0.5 font-mono text-sm tracking-wide ring-1 ring-slate-200">
                      {v.accountNumber || "—"}
                    </code>
                    {v.accountNumber ? <CopyButton text={v.accountNumber} /> : null}
                  </div>
                </div>

                {/* Orders pill (0 if not approved) */}
                <div className="mt-4 flex items-center justify-between rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200/60">
                  <div className="text-sm text-slate-500">Total Orders</div>
                  <div className="text-xl font-extrabold">{displayCount(v)}</div>
                </div>

                {/* Actions */}
                <div className="mt-4 flex flex-wrap gap-2">
                  {v.status !== "Approved" ? (
                    <button
                      onClick={() => approve(v.id)}
                      disabled={busyId === v.id}
                      className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-60"
                    >
                      {busyId === v.id ? "…" : "Approve"}
                    </button>
                  ) : (
                    <button
                      onClick={() => suspend(v.id)}
                      disabled={busyId === v.id}
                      className="inline-flex items-center gap-2 rounded-lg bg-rose-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-rose-700 disabled:opacity-60"
                    >
                      {busyId === v.id ? "…" : "Suspend"}
                    </button>
                  )}
                  <button
                    onClick={() => setSelected(v)}
                    className="rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-semibold text-slate-900 hover:bg-slate-200"
                  >
                    View
                  </button>
                  <button
                    onClick={() => removeVendor(v.id)}
                    disabled={busyId === v.id}
                    className="rounded-lg bg-red-800 px-3 py-1.5 text-sm font-bold text-white hover:bg-red-900 disabled:opacity-60"
                  >
                    {busyId === v.id ? "…" : "Delete"}
                  </button>
                </div>

                {/* Accent line */}
                <div className="pointer-events-none absolute inset-x-5 -bottom-1 h-px bg-gradient-to-r from-transparent via-emerald-300/60 to-transparent opacity-0 transition group-hover:opacity-100" />
              </article>
            ))
          )}
        </section>
      </main>

      {/* Drawer */}
      {selected && (
        <div
          onClick={() => setSelected(null)}
          className="fixed inset-0 z-50 grid place-items-end bg-black/40"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-h-[90vh] w-full max-w-md overflow-auto rounded-t-2xl bg-white p-5 shadow-2xl"
          >
            <div className="flex items-center">
              <strong className="text-base">Vendor Details</strong>
              <button
                onClick={() => setSelected(null)}
                className="ml-auto rounded-lg bg-slate-100 px-3 py-1.5 font-semibold hover:bg-slate-200"
              >
                Close
              </button>
            </div>

            <div className="mt-4 grid gap-3">
              <InfoRow label="Business" value={selected.name} />
              <InfoRow label="Vendor ID" value={selected.id} />
              <InfoRow label="Owner" value={selected.owner || "—"} />
              <InfoRow
                label="Email"
                value={
                  selected.email ? (
                    <a className="text-emerald-700 hover:underline" href={`mailto:${selected.email}`}>
                      {selected.email}
                    </a>
                  ) : (
                    "—"
                  )
                }
              />
              <InfoRow label="Phone" value={selected.phone || "—"} />
              <InfoRow label="Address" value={selected.address || "—"} />
              <InfoRow label="Status" value={selected.status} />
              <InfoRow label="Joined" value={new Date(selected.joinedAt).toLocaleString()} />

              {/* Payout details */}
              <div className="mt-2 rounded-xl border p-3 bg-emerald-50/30 ring-1 ring-emerald-100/60">
                <div className="text-xs font-semibold text-emerald-800 mb-1">Payout Account</div>
                <InfoRow label="Account Name" value={selected.accountName || "—"} />
                <InfoRow label="Bank" value={selected.bankName || "—"} />
                <div className="grid grid-cols-[120px,1fr] gap-3">
                  <div className="text-sm text-slate-500">Account No.</div>
                  <div className="flex items-center gap-2">
                    <code className="rounded bg-white/70 px-2 py-0.5 font-mono text-sm tracking-wide ring-1 ring-slate-200">
                      {selected.accountNumber || "—"}
                    </code>
                    {selected.accountNumber ? (
                      <CopyButton text={selected.accountNumber} small />
                    ) : null}
                  </div>
                </div>
              </div>

              <InfoRow label="Total Orders" value={displayCount(selected)} />
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {selected.status !== "Approved" ? (
                <button
                  onClick={() => approve(selected.id)}
                  className="rounded-lg bg-emerald-600 px-3 py-1.5 font-semibold text-white hover:bg-emerald-700"
                >
                  Approve Vendor
                </button>
              ) : (
                <button
                  onClick={() => suspend(selected.id)}
                  className="rounded-lg bg-rose-600 px-3 py-1.5 font-semibold text-white hover:bg-rose-700"
                >
                  Suspend Vendor
                </button>
              )}
              <button
                onClick={() => removeVendor(selected.id)}
                className="rounded-lg bg-red-800 px-3 py-1.5 font-bold text-white hover:bg-red-900"
              >
                Delete Vendor
              </button>
            </div>

            {!API_BASE && (
              <div className="mt-3 text-xs text-slate-400">
                Demo: payout fields are for manual payments. When you connect the backend, return
                <code className="mx-1">accountName</code>, <code className="mx-1">bankName</code> and
                <code className="mx-1">accountNumber</code> with each vendor.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------- UI bits ---------------- */
function KPI({ label, value, sub }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border bg-white/80 p-4 shadow-sm">
      <div className="absolute -top-10 -right-10 h-24 w-24 rounded-full bg-emerald-100" />
      <div className="text-sm text-slate-500">{label}</div>
      <div className="text-3xl font-extrabold tracking-tight">{value}</div>
      <div className="text-xs text-slate-400">{sub}</div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="grid grid-cols-[84px,1fr] gap-2">
      <dt className="text-slate-500">{label}</dt>
      <dd className="font-medium text-slate-900">{value}</dd>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="grid grid-cols-[120px,1fr] gap-3">
      <div className="text-sm text-slate-500">{label}</div>
      <div className="font-semibold">{value}</div>
    </div>
  );
}

function StatusPill({ status }) {
  const s = (status || "").toLowerCase();
  const map = {
    approved: "bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200",
    pending: "bg-amber-100 text-amber-800 ring-1 ring-amber-200",
    suspended: "bg-rose-100 text-rose-800 ring-1 ring-rose-200",
  };
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs font-bold ${
        map[s] || "bg-slate-100 text-slate-800 ring-1 ring-slate-200"
      }`}
    >
      {status}
    </span>
  );
}

function CopyButton({ text, small = false }) {
  const [copied, setCopied] = useState(false);
  const doCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      // no-op
    }
  };
  return (
    <button
      onClick={doCopy}
      className={`rounded-lg border px-2 ${
        small ? "py-0.5 text-xs" : "py-1 text-sm"
      } font-semibold text-slate-700 hover:bg-slate-50`}
      title="Copy"
      type="button"
    >
      {copied ? "Copied" : "Copy"}
    </button>
  );
}