// src/pages/Dashboard.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { LoadScript, Autocomplete } from "@react-google-maps/api";
import { useNavigate } from "react-router-dom";

/* ================= CONFIG ================= */
const API_BASE = import.meta.env.VITE_API_BASE || "";
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY; // your key
const LIBRARIES = ["places"];

/* ================= HELPERS ================= */
function kmDistance(lat1, lng1, lat2, lng2) {
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
function etaFromKm(distanceKm) {
  const mins = Math.max(3, Math.round((distanceKm / 25) * 60));
  const low = Math.max(2, mins - 4);
  const high = mins + 4;
  return `${low}–${high} min`;
}
function gmapsDirectionsUrl(destLat, destLng, origin) {
  const qs = new URLSearchParams({
    api: "1",
    destination: `${destLat},${destLng}`,
    travelmode: "driving",
  });
  if (origin && typeof origin.lat === "number" && typeof origin.lng === "number") {
    qs.set("origin", `${origin.lat},${origin.lng}`);
  }
  return `https://www.google.com/maps/dir/?${qs.toString()}`;
}

/* ======== FRONTEND SANITIZER (removes price/earnings fields) ======== */
const SENSITIVE_KEY_REGEX =
  /^(payout|price|amount|fare|tip|earnings|commission|total|subTotal|subtotal|riderEarning|orderTotal)$/i;

function deepSanitize(obj) {
  if (Array.isArray(obj)) return obj.map(deepSanitize);
  if (obj && typeof obj === "object") {
    const out = {};
    for (const [k, v] of Object.entries(obj)) {
      if (SENSITIVE_KEY_REGEX.test(k)) continue; // drop sensitive keys
      out[k] = deepSanitize(v);
    }
    return out;
  }
  return obj;
}
function sanitizeOrders(list = []) {
  return deepSanitize(list);
}
function sanitizeOrder(order = {}) {
  return deepSanitize(order);
}

/* ============ FALLBACK ORDERS (demo) ============ */
const DEMO_ORDERS = [
  {
    id: "o1",
    category: "Restaurant",
    storeName: "Candles",
    storeLat: 6.2234,
    storeLng: 7.1175,
    storeAddress: "18 Ogui Rd, Enugu",
    customerName: "Ada",
    customerPhone: "+2348011111111",
    dropLat: 6.2249,
    dropLng: 7.1242,
    dropAddress: "36 Bisalla Rd, Enugu",
    items: "2x Jollof Rice, 1x Grilled Chicken",
    deliveryCode: "8421",
  },
  {
    id: "o2",
    category: "Shops",
    storeName: "Roban Mart",
    storeLat: 6.2239,
    storeLng: 7.1185,
    storeAddress: "Ogige Market",
    customerName: "Chinedu",
    customerPhone: "+2348022222222",
    dropLat: 6.2304,
    dropLng: 7.1212,
    dropAddress: "15 Zik Ave, Uwani",
    items: "Groceries (5 items)",
    deliveryCode: "5530",
  },
  {
    id: "o3",
    category: "Pharmacy",
    storeName: "PharmaPlus",
    storeLat: 6.2234,
    storeLng: 7.1175,
    storeAddress: "Independence Layout",
    customerName: "Ngozi",
    customerPhone: "+2348033333333",
    dropLat: 6.2221,
    dropLng: 7.113,
    dropAddress: "10 Chime Ave",
    items: "OTC meds (2 items)",
    deliveryCode: "1906",
  },
];

/* ================= MAIN ================= */
export default function Dashboard() {
  const navigate = useNavigate();

  const riderName =
    localStorage.getItem("riderName") ||
    localStorage.getItem("riderEmail") ||
    "Rider";

  const [tab, setTab] = useState("Available");
  const tabs = ["Available", "Active", "History", "Settings"];

  // location state
  const [address, setAddress] = useState(() => localStorage.getItem("riderAddress") || "");
  const [riderLoc, setRiderLoc] = useState(() => {
    const raw = localStorage.getItem("riderLocation");
    return raw ? JSON.parse(raw) : null;
  });
  const [mapsReady, setMapsReady] = useState(false);
  useEffect(() => localStorage.setItem("riderAddress", address), [address]);
  useEffect(() => localStorage.setItem("riderLocation", JSON.stringify(riderLoc)), [riderLoc]);

  const autocompleteRef = useRef(null);

  // availability + subscription
  const [available, setAvailable] = useState(
    localStorage.getItem("riderAvailable") === "true"
  );
  const [subMonthly, setSubMonthly] = useState(
    localStorage.getItem("riderSubMonthly") !== "false"
  );
  useEffect(() => localStorage.setItem("riderAvailable", String(available)), [available]);
  useEffect(() => localStorage.setItem("riderSubMonthly", String(subMonthly)), [subMonthly]);

  // data
  const [loading, setLoading] = useState(true);
  const [availableOrders, setAvailableOrders] = useState([]);
  // multiple active orders + persistence (sanitized)
  const [activeOrders, setActiveOrders] = useState(() => {
    const raw = localStorage.getItem("riderActiveOrders");
    return raw ? sanitizeOrders(JSON.parse(raw)) : [];
  });
  const [history, setHistory] = useState(() => {
    const raw = localStorage.getItem("riderHistory");
    return raw ? sanitizeOrders(JSON.parse(raw)) : [];
  });

  useEffect(() => localStorage.setItem("riderActiveOrders", JSON.stringify(sanitizeOrders(activeOrders))), [activeOrders]);
  useEffect(() => localStorage.setItem("riderHistory", JSON.stringify(sanitizeOrders(history))), [history]);

  // code modal (for a specific order)
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [codeTarget, setCodeTarget] = useState(null);
  const [codeInput, setCodeInput] = useState("");

  // categories
  const [availCat, setAvailCat] = useState("All");
  const availCats = ["All", "Restaurant", "Shops", "Pharmacy"];

  // load jobs
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        if (API_BASE) {
          const res = await fetch(`${API_BASE}/api/rider/orders/available`);
          const data = await res.json().catch(() => ({}));
          if (!res.ok || !data.ok) throw new Error("Failed to load jobs");
          if (alive) setAvailableOrders(sanitizeOrders(data.orders || []));
        } else {
          if (alive) setAvailableOrders(sanitizeOrders(DEMO_ORDERS));
        }
      } catch (e) {
        console.error(e);
        if (alive) setAvailableOrders(sanitizeOrders(DEMO_ORDERS));
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => (alive = false);
  }, []);

  // sort by distance
  const sortedAvailable = useMemo(() => {
    let list = [...availableOrders];
    if (availCat !== "All") list = list.filter((o) => o.category === availCat);
    if (riderLoc) {
      list.forEach((o) => {
        o._km =
          typeof o.storeLat === "number" && typeof o.storeLng === "number"
            ? kmDistance(riderLoc.lat, riderLoc.lng, o.storeLat, o.storeLng)
            : Infinity;
      });
      list.sort((a, b) => a._km - b._km);
    }
    return list;
  }, [availableOrders, riderLoc, availCat]);

  // Autocomplete place picked
  const onPlaceChanged = () => {
    const ac = autocompleteRef.current;
    if (!ac) return;
    const place = ac.getPlace();
    const addr = place?.formatted_address || place?.name || "";
    const lat = place?.geometry?.location?.lat?.();
    const lng = place?.geometry?.location?.lng?.();
    if (addr) setAddress(addr);
    if (typeof lat === "number" && typeof lng === "number") {
      setRiderLoc({ lat, lng });
    }
  };

  // Use current location
  const useCurrent = () => {
    if (!navigator.geolocation) return alert("Geolocation not supported.");
    const okDev = /^((localhost|127\.0\.0\.1)(:\d+)?)$/.test(location.host);
    if (!window.isSecureContext && !okDev) {
      return alert("Location requires HTTPS (or http://localhost in dev).");
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setRiderLoc({ lat: latitude, lng: longitude });
        if (mapsReady && window.google?.maps?.Geocoder) {
          const geo = new window.google.maps.Geocoder();
          geo.geocode({ location: { lat: latitude, lng: longitude } }, (results, status) => {
            if (status === "OK" && results?.[0]) {
              setAddress(results[0].formatted_address);
            } else {
              setAddress(`${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
            }
          });
        } else {
          setAddress(`${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
        }
      },
      (err) => {
        console.error(err);
        let msg = "Couldn't get your location.";
        if (err.code === err.PERMISSION_DENIED) msg = "Location permission denied in browser settings.";
        else if (err.code === err.POSITION_UNAVAILABLE) msg = "Location unavailable. Try again.";
        else if (err.code === err.TIMEOUT) msg = "Location timed out. Try again.";
        alert(msg);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  // accept order — add to active list (no duplicates, sanitized)
  async function acceptOrder(order) {
    let apiOk = true;
    if (API_BASE) {
      try {
        const riderId = localStorage.getItem("riderId") || "demoRider";
        const res = await fetch(`${API_BASE}/api/rider/orders/accept`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ riderId, orderId: order.id }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.ok) throw new Error(data.error || "Accept failed");
      } catch (e) {
        console.warn("Accept API failed, continuing in demo mode:", e);
        apiOk = false;
      }
    }

    const safe = sanitizeOrder(order);
    setActiveOrders((prev) => (prev.some((x) => x.id === safe.id) ? prev : [safe, ...prev]));
    setAvailableOrders((prev) => prev.filter((o) => o.id !== order.id));
    setTab("Active");
    if (!apiOk && API_BASE) alert("Backend not ready — continuing in demo mode.");
  }

  // code modal helpers
  function openCodeModal(order) {
    setCodeTarget(order);
    setCodeInput("");
    setShowCodeModal(true);
  }

  async function submitCode() {
    if (!codeTarget) return;
    const correct =
      String(codeInput || "").trim() === String(codeTarget.deliveryCode || "").trim();
    if (!correct) return alert("Incorrect code. Ask the customer again.");

    let apiOk = true;
    if (API_BASE) {
      try {
        const riderId = localStorage.getItem("riderId") || "demoRider";
        const res = await fetch(`${API_BASE}/api/rider/orders/complete`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ riderId, orderId: codeTarget.id, code: codeInput }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.ok) throw new Error(data.error || "Complete failed");
      } catch (e) {
        console.warn("Complete API failed, finishing locally:", e);
        apiOk = false;
      }
    }

    // move from active to history (sanitized)
    const safeCompleted = sanitizeOrder(codeTarget);
    setHistory((h) => [{ ...safeCompleted, completedAt: new Date().toISOString() }, ...h]);
    setActiveOrders((list) => list.filter((o) => o.id !== codeTarget.id));
    setShowCodeModal(false);
    setCodeTarget(null);
    setCodeInput("");
    setTab("Active"); // stay on Active to finish others
    if (!apiOk && API_BASE) alert("Backend not ready — delivery completed locally.");
  }

  function logout() {
    localStorage.setItem("isRiderLoggedIn", "false");
    localStorage.removeItem("riderId");
    localStorage.removeItem("riderEmail");
    localStorage.removeItem("riderName");
    localStorage.removeItem("riderPhone");
    localStorage.removeItem("riderVehicle");
    navigate("/signin", { replace: true });
  }

  return (
    <main className="min-h-screen bg-[#F7F9F5]">
      {/* NAV */}
      <header className="sticky top-0 z-30 bg-[#1b5e20] text-white shadow">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-3">
          <img src="/yov.png" alt="GetYovo" className="h-8 w-8" />
          <h1 className="text-lg font-semibold">Rider</h1>
          <div className="ml-auto flex items-center gap-2">
            <span className="hidden sm:block text-sm opacity-90">Hi, {riderName}</span>
            <button
              onClick={logout}
              className="px-3 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-sm font-medium"
            >
              Log out
            </button>
          </div>
        </div>

        {/* Location bar (Google Places + GPS) */}
        <div className="max-w-6xl mx-auto px-4 pb-4">
          <LoadScript
            googleMapsApiKey={GOOGLE_MAPS_API_KEY}
            libraries={LIBRARIES}
            onLoad={() => setMapsReady(true)}
            onError={(e) => {
              console.warn("Google Maps failed to load", e);
              setMapsReady(false);
            }}
          >
            <div className="relative flex items-center gap-2">
              <Autocomplete
                onLoad={(ac) => (autocompleteRef.current = ac)}
                onPlaceChanged={onPlaceChanged}
                options={{
                  fields: ["formatted_address", "geometry", "name"],
                  types: ["geocode"],
                }}
              >
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Enter your current location"
                  className="w-full bg-white rounded-xl px-3 py-2 outline-none ring-1 ring-black/5 text-black"
                />
              </Autocomplete>
              <button
                onClick={useCurrent}
                className="flex-none px-3 py-2 rounded-xl bg-white/15 hover:bg-white/25"
                title="Use current location"
                type="button"
              >
                📍
              </button>
            </div>
          </LoadScript>
        </div>

        {/* Tabs */}
        <div className="max-w-6xl mx-auto px-4 pb-3">
          <div className="flex gap-2 justify-evenly overflow-x-auto no-scrollbar">
            {tabs.map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-2 rounded-full text-sm ${
                  tab === t ? "bg-white text-[#1b5e20]" : "bg-white/15 text-white"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* CONTENT */}
      <div className="max-w-6xl mx-auto p-4 space-y-4">
        {tab === "Available" && (
          <section className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => setAvailable((v) => !v)}
                className={`px-4 py-2 rounded-xl text-white font-semibold ${
                  available ? "bg-emerald-600 hover:bg-emerald-700" : "bg-gray-500 hover:bg-gray-600"
                }`}
              >
                {available ? "Available" : "Offline"}
              </button>

              <div className="ml-auto flex gap-2 overflow-x-auto no-scrollbar">
                {availCats.map((c) => (
                  <button
                    key={c}
                    onClick={() => setAvailCat(c)}
                    className={`px-3 py-1.5 rounded-full text-sm ${
                      availCat === c ? "bg-[#0F3D2E] text-white" : "bg-[#EEF2EF] text-[#0F3D2E]"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <p className="text-sm text-gray-500">Loading available jobs…</p>
            ) : !available ? (
              <p className="text-sm text-gray-600">You’re offline. Go Available to receive jobs.</p>
            ) : sortedAvailable.length === 0 ? (
              <p className="text-sm text-gray-500">No jobs nearby yet.</p>
            ) : (
              <div className="space-y-3">
                {sortedAvailable.map((o) => {
                  const km =
                    riderLoc && typeof o.storeLat === "number" && typeof o.storeLng === "number"
                      ? kmDistance(riderLoc.lat, riderLoc.lng, o.storeLat, o.storeLng)
                      : null;

                  return (
                    <article
                      key={o.id}
                      className="bg-white rounded-2xl p-4 border border-[#0F3D2E]/10 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-sm text-[#0F3D2E]/70">{o.category}</div>
                          <div className="text-lg font-semibold text-[#0F3D2E]">{o.storeName}</div>
                          <div className="text-sm text-[#0F3D2E]/70">{o.storeAddress}</div>
                          <div className="mt-1 text-sm text-[#0F3D2E]">
                            Items: <span className="text-[#0F3D2E]/80">{o.items}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          {km != null ? (
                            <>
                              <div className="text-base font-medium text-[#0F3D2E]">
                                {km.toFixed(1)} km
                              </div>
                              <div className="text-xs text-[#0F3D2E]/60">{etaFromKm(km)}</div>
                            </>
                          ) : (
                            <div className="text-xs text-[#0F3D2E]/60">Set location ↑</div>
                          )}
                        </div>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        <a
                          className="px-3 py-2 rounded-lg bg-[#EEF2EF] text-[#0F3D2E] text-sm"
                          href={gmapsDirectionsUrl(o.storeLat, o.storeLng, riderLoc)}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Open Store in Maps
                        </a>
                        <button
                          onClick={() => acceptOrder(o)}
                          className="px-4 py-2 rounded-lg bg-[#1b5e20] text-white text-sm font-semibold hover:bg-[#2e7d32]"
                          disabled={!available}
                        >
                          Accept Pickup
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {tab === "Active" && (
          <section className="space-y-3">
            {!activeOrders.length ? (
              <p className="text-sm text-gray-500">No active deliveries.</p>
            ) : (
              <div className="space-y-3">
                {activeOrders.map((order) => (
                  <div
                    key={order.id}
                    className="bg-white rounded-2xl p-4 border border-[#0F3D2E]/10 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm text-[#0F3D2E]/70">{order.category}</div>
                        <h3 className="text-xl font-semibold text-[#0F3D2E]">
                          {order.storeName}
                        </h3>
                        <div className="text-sm text-[#0F3D2E]/70">{order.storeAddress}</div>
                      </div>
                    </div>

                    {typeof order.storeLat === "number" && typeof order.storeLng === "number" && (
                      <div className="mt-3 rounded-xl overflow-hidden border">
                        <iframe
                          title={`Store-${order.id}`}
                          width="100%"
                          height="200"
                          style={{ border: 0 }}
                          loading="lazy"
                          src={`https://www.google.com/maps?q=${order.storeLat},${order.storeLng}&z=15&output=embed`}
                        />
                      </div>
                    )}

                    <div className="mt-3 grid sm:grid-cols-2 gap-3">
                      <div className="bg-[#F7F9F5] rounded-xl p-3">
                        <div className="text-sm font-medium text-[#0F3D2E]">Customer</div>
                        <div className="text-sm text-[#0F3D2E]/80">{order.customerName}</div>
                        <div className="text-sm text-[#0F3D2E]/70">{order.customerPhone}</div>
                      </div>
                      <div className="bg-[#F7F9F5] rounded-xl p-3">
                        <div className="text-sm font-medium text-[#0F3D2E]">Drop-off</div>
                        <div className="text-sm text-[#0F3D2E]/80">{order.dropAddress}</div>
                        {typeof order.dropLat === "number" && typeof order.dropLng === "number" && (
                          <a
                            className="inline-block mt-1 text-sm text-[#1b5e20] underline"
                            target="_blank"
                            rel="noreferrer"
                            href={gmapsDirectionsUrl(order.dropLat, order.dropLng, riderLoc)}
                          >
                            Navigate to Drop-off
                          </a>
                        )}
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <a
                        className="px-3 py-2 rounded-lg bg-[#EEF2EF] text-[#0F3D2E] text-sm"
                        href={gmapsDirectionsUrl(order.storeLat, order.storeLng, riderLoc)}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Navigate to Store
                      </a>
                      <button
                        onClick={() => openCodeModal(order)}
                        className="px-4 py-2 rounded-lg bg-[#1b5e20] text-white text-sm font-semibold hover:bg-[#2e7d32]"
                      >
                        Enter Delivery Code
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {tab === "History" && (
          <section className="space-y-3">
            {!history.length ? (
              <p className="text-sm text-gray-500">No completed deliveries yet.</p>
            ) : (
              <div className="space-y-3">
                {history.map((h) => (
                  <article
                    key={h.id}
                    className="bg-white rounded-2xl p-4 border border-[#0F3D2E]/10 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm text-[#0F3D2E]/70">{h.category}</div>
                        <div className="text-lg font-semibold text-[#0F3D2E]">{h.storeName}</div>
                        <div className="text-sm text-[#0F3D2E]/70">{h.dropAddress}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-[#0F3D2E]/60">
                          {new Date(h.completedAt).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        {tab === "Settings" && (
          <section className="space-y-4">
            <div className="bg-white rounded-2xl p-4 border border-[#0F3D2E]/10">
              <h3 className="text-lg font-semibold text-[#0F3D2E]">Availability</h3>
              <p className="text-sm text-[#0F3D2E]/70">Toggle to receive new requests.</p>
              <button
                onClick={() => setAvailable((v) => !v)}
                className={`mt-3 px-4 py-2 rounded-lg text-white font-semibold ${
                  available ? "bg-emerald-600 hover:bg-emerald-700" : "bg-gray-500 hover:bg-gray-600"
                }`}
              >
                {available ? "Available" : "Offline"}
              </button>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-[#0F3D2E]/10">
              <h3 className="text-lg font-semibold text-[#0F3D2E]">Subscription</h3>
              <div className="mt-2 flex items-center justify-between">
                <div>
                  <div className="text-sm text-[#0F3D2E]/80">Monthly plan</div>
                  <div className="text-sm text-[#0F3D2E]/60">
                    {subMonthly ? "Active — billed monthly" : "Inactive"}
                  </div>
                </div>
                <button
                  onClick={() => setSubMonthly((s) => !s)}
                  className={`px-4 py-2 rounded-lg text-white font-semibold ${
                    subMonthly ? "bg-[#1b5e20] hover:bg-[#2e7d32]" : "bg-gray-500 hover:bg-gray-600"
                  }`}
                >
                  {subMonthly ? "Manage" : "Activate"}
                </button>
              </div>
            </div>
          </section>
        )}
      </div>

      {/* Code Modal (per-order) */}
      {showCodeModal && codeTarget && (
        <div className="fixed inset-0 z-40 bg-black/40 grid place-items-center px-4">
          <div className="w-full max-w-sm bg-white rounded-2xl p-5 shadow-2xl">
            <h4 className="text-lg font-semibold text-[#0F3D2E]">
              Enter Delivery Code — {codeTarget.storeName}
            </h4>
            <p className="text-sm text-[#0F3D2E]/70 mt-1">
              Ask the customer for their 4-digit code to confirm delivery.
            </p>
            <input
              autoFocus
              inputMode="numeric"
              maxLength={6}
              className="mt-3 w-full rounded-lg bg-gray-100 px-3 py-2 outline-none"
              value={codeInput}
              onChange={(e) => setCodeInput(e.target.value.replace(/\s/g, ""))}
              placeholder="e.g. 8421"
            />
            <div className="mt-4 flex gap-2 justify-end">
              <button
                onClick={() => { setShowCodeModal(false); setCodeTarget(null); }}
                className="px-3 py-2 rounded-lg bg-gray-100 text-[#0F3D2E]"
              >
                Cancel
              </button>
              <button
                onClick={submitCode}
                className="px-4 py-2 rounded-lg bg-[#1b5e20] text-white font-semibold hover:bg-[#2e7d32]"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </main>
  );
}