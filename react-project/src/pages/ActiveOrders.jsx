// src/pages/ActiveOrders.jsx
import { useEffect, useMemo, useState } from "react";
import BottomNav from "../pages/BottomNav.jsx";

/* Keep in sync with Cart.jsx */
const ACTIVE_KEY = "activeOrders";
const COMPLETED_KEY = "completedOrders";
const VENDOR_COORDS = {
  "1": { name: "Roban Mart",  lat: 6.2239, lng: 7.1185 },
  "2": { name: "FreshMart",   lat: 6.2242, lng: 7.1190 },
  "3": { name: "PharmaPlus",  lat: 6.2234, lng: 7.1175 },
  "4": { name: "Candles",     lat: 6.2234, lng: 7.1175 },
};

const loadLS = (k, fallback = []) => {
  try { const v = JSON.parse(localStorage.getItem(k) || "null"); return Array.isArray(v) ? v : fallback; }
  catch { return fallback; }
};
const saveLS = (k, v) => localStorage.setItem(k, JSON.stringify(v));
const generateCode = () => String(Math.floor(100000 + Math.random() * 900000)); // 6-digit

/* Distance + ETA helpers */
function getDistanceKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
function etaFromDistance(distanceKm) {
  if (!Number.isFinite(distanceKm)) return "—";
  const avgSpeedKmH = 30;
  const minutes = Math.ceil((distanceKm / avgSpeedKmH) * 60);
  const minTime = Math.max(minutes - 5, 1);
  const maxTime = minutes + 5;
  return `${minTime}–${maxTime} min`;
}

/* Progress steps */
const STEPS = ["Vendor received", "Preparing", "Out for delivery", "Delivered"];
const statusToIndex = (status) => {
  const s = (status || "").toLowerCase();
  if (s.includes("vendor")) return 0;
  if (s.includes("prepar")) return 1;
  if (s.includes("out for") || s.includes("arriv")) return 2;
  if (s.includes("deliver")) return 3;
  return 1;
};

export default function ActiveOrders() {
  const [orders, setOrders] = useState(() => loadLS(ACTIVE_KEY));

  // ensure each order has a deliveryCode
  useEffect(() => {
    let changed = false;
    const withCodes = (orders || []).map((o) => {
      if (!o.deliveryCode) { changed = true; return { ...o, deliveryCode: generateCode() }; }
      return o;
    });
    if (changed) {
      setOrders(withCodes);
      saveLS(ACTIVE_KEY, withCodes);
    }
  }, []);

  const refreshFromLS = () => setOrders(loadLS(ACTIVE_KEY));

  const updateOrders = (updater) => {
    setOrders((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      saveLS(ACTIVE_KEY, next);
      return next;
    });
  };

  // user location → ETA
  const userLocation = useMemo(() => {
    try { return JSON.parse(localStorage.getItem("userLocation") || "null"); }
    catch { return null; }
  }, []);

  const storeMeta = useMemo(() => {
    return (orders || []).map((o) => {
      const v = VENDOR_COORDS[String(o.vendorId)];
      let distanceKm = null;
      if (v && userLocation?.lat && userLocation?.lng) {
        distanceKm = getDistanceKm(v.lat, v.lng, userLocation.lat, userLocation.lng);
      }
      return { distanceKm, etaText: etaFromDistance(distanceKm) };
    });
  }, [orders, userLocation]);

  // Save rider phone on edit
  const onChangeRiderPhone = (idx, val) => {
    updateOrders((prev) => {
      const next = [...prev];
      if (next[idx]) next[idx] = { ...next[idx], riderPhone: val };
      return next;
    });
  };

  // simulate rider confirmation (until you wire webhooks)
  const simulateDelivered = (idx) => {
    updateOrders((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], status: "Delivered", deliveredAt: new Date().toISOString() };
      return next;
    });
  };

  // move delivered order to Completed
  const archiveDelivered = (idx) => {
    const order = orders[idx];
    if ((order?.status || "").toLowerCase().includes("deliver")) {
      const rest = [...orders];
      const [done] = rest.splice(idx, 1);
      saveLS(ACTIVE_KEY, rest);
      const completed = loadLS(COMPLETED_KEY);
      completed.push({ ...done, completedAt: new Date().toISOString(), finalStatus: "Delivered" });
      saveLS(COMPLETED_KEY, completed);
      setOrders(rest);
      alert("Moved to Completed.");
    }
  };

  if (!orders.length) {
    return (
      <main className="min-h-screen bg-[#F7F9F5] pb-20">
        <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
          <div className="max-w-screen-sm mx-auto px-4 py-3">
            <h1 className="text-2xl font-bold text-[#0F3D2E]">Active Orders</h1>
          </div>
        </header>
        <section className="max-w-screen-sm mx-auto p-6 text-center">
          <p className="text-[#0F3D2E]/70">No active orders yet.</p>
        </section>
        <BottomNav />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F7F9F5] pb-20">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-screen-sm mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-[#0F3D2E]">Active Orders</h1>
          <button
            onClick={refreshFromLS}
            className="px-3 py-2 rounded-lg text-sm font-semibold bg-[#0F3D2E] text-white hover:opacity-95"
          >
            Refresh status
          </button>
        </div>
      </header>

      <section className="max-w-screen-sm mx-auto p-4 space-y-6">
        {orders.map((o, idx) => {
          const meta = storeMeta[idx] || {};
          const current = statusToIndex(o.status);
          const paidDate = o.paidAt ? new Date(o.paidAt) : null;

          return (
            <article key={(o.paystack?.reference || "") + idx} className="p-4 bg-white rounded-2xl border border-[#0F3D2E]/12">
              {/* Store name */}
              <h2 className="font-bold text-lg text-[#0F3D2E]">{o.vendorName || "Store"}</h2>

              {/* Delivery time */}
              <div className="mt-1 text-sm text-[#0F3D2E]/70">
                ETA: <span className="font-medium text-[#0F3D2E]">{meta.etaText || "—"}</span>
                {paidDate && (
                  <span className="ml-2 text-[#0F3D2E]/50">
                    • Paid {paidDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                )}
              </div>

              {/* Vertical progress */}
              <div className="mt-4">
                <VerticalStepper steps={STEPS} current={current} />
              </div>

              {/* Rider phone (copy + call) */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-[#0F3D2E] mb-1">Rider phone number</label>
                <div className="flex gap-2">
                  <input
                    type="tel"
                    inputMode="tel"
                    placeholder="+234..."
                    value={o.riderPhone || ""}
                    onChange={(e) => onChangeRiderPhone(idx, e.target.value)}
                    className="flex-1 h-11 px-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  />
                  {/* Call */}
                  <a
                    href={o.riderPhone ? `tel:${o.riderPhone}` : "#"}
                    className={`px-3 h-11 rounded-xl border font-semibold ${
                      o.riderPhone ? "text-[#0F3D2E] border-[#0F3D2E]/30 hover:bg-[#F2F5F3]" : "text-gray-400 border-gray-200 cursor-not-allowed"
                    }`}
                    onClick={(e) => { if (!o.riderPhone) e.preventDefault(); }}
                  >
                    Call
                  </a>
                  {/* Copy */}
                  <button
                    onClick={() => o.riderPhone && navigator.clipboard.writeText(o.riderPhone)}
                    className={`px-3 h-11 rounded-xl border font-semibold ${
                      o.riderPhone ? "text-[#0F3D2E] border-[#0F3D2E]/30 hover:bg-[#F2F5F3]" : "text-gray-400 border-gray-200 cursor-not-allowed"
                    }`}
                  >
                    Copy
                  </button>
                </div>
                <p className="mt-1 text-xs text-[#0F3D2E]/60">You can edit the number if the vendor shares a different line.</p>
              </div>

              {/* Delivery code (show to rider) */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-[#0F3D2E] mb-1">Delivery code</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={o.deliveryCode || ""}
                    className="flex-1 h-11 px-3 rounded-xl border border-gray-300 bg-gray-50 text-[#0F3D2E] font-semibold tracking-widest"
                  />
                  <button
                    onClick={() => o.deliveryCode && navigator.clipboard.writeText(o.deliveryCode)}
                    className="px-4 h-11 rounded-xl bg-[#0F3D2E] text-white font-semibold hover:opacity-95"
                  >
                    Copy
                  </button>
                </div>
                <p className="mt-1 text-xs text-[#0F3D2E]/60">
                  Show this code to the rider. They will enter it on their device to confirm delivery.
                </p>
              </div>

              {/* Dev helpers until webhooks exist */}
              <div className="mt-4 flex gap-2">
                {!((o.status || "").toLowerCase().includes("deliver")) && (
                  <button
                    onClick={() => simulateDelivered(idx)}
                    className="px-4 h-11 rounded-xl border border-[#0F3D2E]/30 text-[#0F3D2E] font-semibold hover:bg-[#F2F5F3]"
                  >
                    Mark delivered (simulate)
                  </button>
                )}
                {((o.status || "").toLowerCase().includes("deliver")) && (
                  <button
                    onClick={() => archiveDelivered(idx)}
                    className="px-4 h-11 rounded-xl border border-[#0F3D2E]/30 text-[#0F3D2E] font-semibold hover:bg-[#F2F5F3]"
                  >
                    Move to Completed
                  </button>
                )}
              </div>
            </article>
          );
        })}
      </section>

      <BottomNav />
    </main>
  );
}

/* ---------- Vertical Stepper ---------- */
function VerticalStepper({ steps = [], current = 0 }) {
  return (
    <ol className="relative border-s-2 border-[#E6EBE8] ps-5">
      {steps.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <li key={label} className="mb-4 ms-1">
            <span
              className={[
                "absolute -start-3 rounded-full w-5 h-5 ring-2 ring-white",
                done ? "bg-emerald-600" : active ? "bg-[#0F3D2E]" : "bg-gray-300",
              ].join(" ")}
            />
            <div className={["text-sm", active ? "font-semibold text-[#0F3D2E]" : "text-[#0F3D2E]/70"].join(" ")}>
              {label}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
