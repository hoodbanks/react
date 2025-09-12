// src/pages/AdminDashboard.jsx
import React from "react";
import { useNavigate } from "react-router-dom";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const email = localStorage.getItem("adminEmail") || "admin@getyovonow.com";

  const logout = () => {
    localStorage.removeItem("isAdminLoggedIn");
    localStorage.removeItem("adminEmail");
    navigate("/signin", { replace: true });
  };

  const Card = ({ title, desc, to, icon }) => (
    <button
      onClick={() => navigate(to)}
      className="group relative w-full overflow-hidden rounded-2xl bg-white/90 p-5 text-left shadow-sm ring-1 ring-slate-200 transition-all hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
    >
      <div className="pointer-events-none absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent" />
      <div className="flex items-start gap-4">
        <div className="grid h-11 w-11 place-items-center rounded-xl bg-emerald-50 ring-1 ring-emerald-100">
          {icon}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-base font-semibold text-slate-900">
              {title}
            </h3>
            <svg
              className="h-4 w-4 shrink-0 text-emerald-600 opacity-0 transition group-hover:translate-x-0.5 group-hover:opacity-100"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <path d="M9 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <p className="mt-0.5 line-clamp-2 text-sm text-slate-500">{desc}</p>
        </div>
      </div>
    </button>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-emerald-50/30 font-sans">
      <header className="sticky top-0 z-30 backdrop-blur supports-[backdrop-filter]:bg-white/70 bg-white/90 border-b border-slate-200">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
          <img src="/yov.png" alt="GetYovo" className="h-8 w-8 rounded" />
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-semibold text-slate-900">Admin</span>
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-200">
              Dashboard
            </span>
          </div>
          <span className="ml-auto hidden text-sm text-slate-600 sm:block">{email}</span>
          <button
            onClick={logout}
            className="ml-2 inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M15 3h4a2 2 0 012 2v3M21 16v3a2 2 0 01-2 2h-4M3 12h12M12 8l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Log out
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        <section className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-emerald-100/60 blur-2xl" />
          <div className="relative">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              Welcome back<span className="text-emerald-700">.</span>
            </h2>
            <p className="mt-1 text-slate-600">
              Manage your <span className="font-semibold">Vendors</span>,{" "}
              <span className="font-semibold">Riders</span>,{" "}
              <span className="font-semibold">Orders</span> and{" "}
              <span className="font-semibold">Payments</span> in one place.
            </p>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Vendors</div>
                <div className="mt-1 text-2xl font-extrabold text-slate-900">—</div>
                <div className="text-xs text-slate-500">Total (API soon)</div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Riders</div>
                <div className="mt-1 text-2xl font-extrabold text-slate-900">—</div>
                <div className="text-xs text-slate-500">Total (API soon)</div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Orders</div>
                <div className="mt-1 text-2xl font-extrabold text-slate-900">—</div>
                <div className="text-xs text-slate-500">Today (API soon)</div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(240px,1fr))]">
          <Card
            title="Vendors"
            desc="Approve, suspend, and view vendor order totals."
            to="/vendors"
            icon={
              <svg className="h-5 w-5 text-emerald-700" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M3 7h18M5 7v10a2 2 0 002 2h10a2 2 0 002-2V7M8 7l1-3h6l1 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            }
          />
          <Card
            title="Riders"
            desc="Approve riders, view status and assignment counts."
            to="/riders"
            icon={
              <svg className="h-5 w-5 text-emerald-700" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M5 18a3 3 0 116 0M13 18a3 3 0 116 0M6 12l3-3 4 4 3-3M13 6h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            }
          />
          <Card
            title="Orders"
            desc="Totals, growth charts, and recent activity."
            to="/orders"
            icon={
              <svg className="h-5 w-5 text-emerald-700" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M4 19h16M6 17V7m6 10V5m6 12V9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            }
          />
          <Card
            title="Payments"
            desc="See user payments, vendor amounts, and delivery fees."
            to="/payments"
            icon={
              <svg className="h-5 w-5 text-emerald-700" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M3 7h18M3 12h18M7 17h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            }
          />
        </section>
      </main>
    </div>
  );
}