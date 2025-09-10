// src/pages/VendorSettings.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LoadScript, StandaloneSearchBox } from "@react-google-maps/api";

/* ========= CONFIG =========
   In your vendor project's .env:
   VITE_API_BASE=https://getyovonow.com
============================ */
const API_BASE = import.meta.env.VITE_API_BASE || "";

/* Used for vendor card payloads */
const VENDOR_TYPE = localStorage.getItem("vendorType") || "Shops";
const VENDOR_NAME_FALLBACK = (localStorage.getItem("vendorEmail") || "vendor").split("@")[0];

const GOOGLE_MAPS_API_KEY = "AIzaSyDpTvt828_Ph_6xtI6dNzL6uMagjhFdbUY";
const LIBRARIES = ["places"];

const VENDOR_ID = localStorage.getItem("vendorId") || "vendor123";
const SETTINGS_KEY = `vendor_settings_${VENDOR_ID}`;

const DEFAULTS = {
  storeName: "",
  logoDataUrl: "",
  openingTime: "08:00",
  closingTime: "21:00",
  minOrder: 0,

  // Contact + precise location
  contactPhone: "",
  contactEmail: "",
  contactAddress: "",
  whatsapp: "",
  locationLat: null,
  locationLng: null,

  payoutBank: "",
  payoutAccountName: "",
  payoutAccountNumber: "",
};

function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return { ...DEFAULTS, ...parsed };
  } catch {
    return { ...DEFAULTS };
  }
}
function saveSettings(data) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(data));
}
function fmtNaira(n) {
  const num = Number(n || 0);
  return "₦" + num.toLocaleString();
}

// helper for "open now" including overnight hours
function isWithinHours(openingTime, closingTime, d = new Date()) {
  if (!openingTime || !closingTime) return null;
  const toMin = (hm) => {
    const [h, m] = (hm || "00:00").split(":").map((x) => parseInt(x, 10) || 0);
    return h * 60 + m;
  };
  const nowM = d.getHours() * 60 + d.getMinutes();
  const o = toMin(openingTime);
  const c = toMin(closingTime);
  if (o === c) return null;                 // invalid (same time)
  if (o < c) return nowM >= o && nowM < c;  // same-day window
  return nowM >= o || nowM < c;             // overnight window
}

export default function VendorSettings() {
  const navigate = useNavigate();
  const [form, setForm] = useState(() => loadSettings());
  const [savedSnapshot, setSavedSnapshot] = useState(() => loadSettings());
  const [toast, setToast] = useState("");
  const [cloudBusy, setCloudBusy] = useState(false);
  const fileRef = useRef(null);
  const searchBoxRef = useRef(null);

  const dirty = useMemo(
    () => JSON.stringify(form) !== JSON.stringify(savedSnapshot),
    [form, savedSnapshot]
  );

  // VALIDATION:
  const nameValid = form.storeName.trim().length >= 2;
  const timeValid = Boolean(form.openingTime && form.closingTime && form.openingTime !== form.closingTime);
  const payoutOk =
    (!form.payoutBank && !form.payoutAccountName && !form.payoutAccountNumber) ||
    (form.payoutBank &&
      form.payoutAccountName &&
      /^\d{8,}$/.test(form.payoutAccountNumber || ""));

  const canSave = nameValid && timeValid && payoutOk;

  // Prefill storeName from vendorEmail (once)
  useEffect(() => {
    if (!form.storeName && localStorage.getItem("vendorEmail")) {
      const maybe = localStorage.getItem("vendorEmail").split("@")[0];
      setForm((f) => ({ ...f, storeName: f.storeName || maybe }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load saved settings from API (optional)
  useEffect(() => {
    let alive = true;
    (async () => {
      if (!API_BASE) return;
      try {
        setCloudBusy(true);
        const res = await fetch(
          `${API_BASE}/api/vendor-settings?vendorId=${encodeURIComponent(VENDOR_ID)}`
        );
        if (!res.ok) return;
        const data = await res.json().catch(() => ({}));
        const s = data?.settings || null;
        if (s && alive) {
          const merged = { ...DEFAULTS, ...s };
          setForm(merged);
          setSavedSnapshot(merged);
          saveSettings(merged);
        }
      } catch {
        /* keep local */
      } finally {
        if (alive) setCloudBusy(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  // Save settings to API + upsert vendor card
  async function saveToCloud(settings) {
    if (!API_BASE) return;
    try {
      setCloudBusy(true);

      // 1) Persist detailed settings
      const settingsPayload = { vendorId: VENDOR_ID, ...settings };
      {
        const res = await fetch(`${API_BASE}/api/vendor-settings`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(settingsPayload),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.ok) throw new Error(data.error || `settings HTTP ${res.status}`);
      }

      // 2) Upsert vendor card for Users app
      const cardPayload = {
        id: VENDOR_ID,
        name: settings.storeName || VENDOR_NAME_FALLBACK,
        type: VENDOR_TYPE,

        imageUrl: settings.logoDataUrl || "",
        logo_url: settings.logoDataUrl || "",

        openingTime: settings.openingTime || "",
        opening_time: settings.openingTime || "",

        closingTime: settings.closingTime || "",
        closing_time: settings.closingTime || "",

        address: settings.contactAddress || "",
        contact_address: settings.contactAddress || "",

        lat: settings.locationLat ?? null,
        location_lat: settings.locationLat ?? null,

        lng: settings.locationLng ?? null,
        location_lng: settings.locationLng ?? null,

        rating: 4.5,
        active: true,
      };

      {
        const res = await fetch(`${API_BASE}/api/vendors`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(cardPayload),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.ok) throw new Error(data.error || `vendors HTTP ${res.status}`);
      }

      setToast("Cloud saved");
      setTimeout(() => setToast(""), 1400);
    } catch (e) {
      console.error(e);
      setToast("Cloud save failed (kept locally)");
      setTimeout(() => setToast(""), 1600);
    } finally {
      setCloudBusy(false);
    }
  }

  const onChange = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  // Logo
  const handlePickLogo = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onChange("logoDataUrl", reader.result || "");
    reader.readAsDataURL(file);
  };
  const removeLogo = () => {
    onChange("logoDataUrl", "");
    if (fileRef.current) fileRef.current.value = "";
  };

  // Places search box → address + lat/lng
  const handlePlacesChanged = () => {
    if (!searchBoxRef.current) return;
    const places = searchBoxRef.current.getPlaces();
    if (!places || !places.length) return;
    const place = places[0];
    const addr = place.formatted_address || place.name || "";
    const lat = place.geometry?.location?.lat?.();
    const lng = place.geometry?.location?.lng?.();
    onChange("contactAddress", addr);
    if (typeof lat === "number" && typeof lng === "number") {
      onChange("locationLat", lat);
      onChange("locationLng", lng);
    }
  };

  // Use current location
  const useCurrentLocation = () => {
    if (!("geolocation" in navigator)) {
      alert("Your browser doesn't support location.");
      return;
    }
    if (!window.isSecureContext && !/^localhost(:\d+)?$/.test(location.hostname)) {
      alert("Location needs HTTPS (or http://localhost in dev).");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        onChange("locationLat", latitude);
        onChange("locationLng", longitude);

        const geo = window.google?.maps?.Geocoder
          ? new window.google.maps.Geocoder()
          : null;

        if (!geo) {
          setToast("Location set. Waiting for Google to load to fetch address…");
          setTimeout(() => setToast(""), 2000);
          return;
        }
        geo.geocode({ location: { lat: latitude, lng: longitude } }, (results, status) => {
          if (status === "OK" && results && results[0]) {
            onChange("contactAddress", results[0].formatted_address || "");
          } else {
            setToast("Location set, but couldn't fetch the address text.");
            console.warn("Geocoder status:", status, results);
            setTimeout(() => setToast(""), 2000);
          }
        });
      },
      (err) => {
        let msg = "Couldn't get your location.";
        if (err.code === err.PERMISSION_DENIED) msg = "Permission denied in browser settings.";
        else if (err.code === err.POSITION_UNAVAILABLE) msg = "Location unavailable. Try again.";
        else if (err.code === err.TIMEOUT) msg = "Location timed out. Try again.";
        alert(msg);
        console.error("Geolocation error:", err);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  // 🚪 LOG OUT (clears vendor auth + routes to /signin)
  const logoutVendor = () => {
    if (!confirm("Log out of vendor account?")) return;
    localStorage.removeItem("vendorId");
    localStorage.removeItem("vendorEmail");
    localStorage.removeItem("vendorType");
    localStorage.setItem("isVendorLoggedIn", "false");
    localStorage.setItem("isLoggedIn", "false");
    navigate("/signin", { replace: true });
  };

  // Save/reset
  const handleSave = async () => {
    if (!canSave) {
      setToast("Please fix validation errors before saving.");
      setTimeout(() => setToast(""), 1600);
      return;
    }
    saveSettings(form);
    setSavedSnapshot(form);
    setToast("Saved locally");
    setTimeout(() => setToast(""), 1200);
    await saveToCloud(form);
  };
  const handleReset = () => setForm(loadSettings());
  const clearAll = () => setForm({ ...DEFAULTS });

  const openNow = isWithinHours(form.openingTime, form.closingTime);

  return (
    <main className="min-h-screen bg-[#F7F9F5]">
      {/* Header */}
      <header className="bg-[#1b5e20] text-white sticky top-0 z-30 shadow-lg">
        <div className="max-w-screen-lg mx-auto px-4 py-4 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-xl">←</button>
          <h1 className="text-2xl font-bold">Store Settings</h1>

          {/* Right-side controls */}
          <div className="ml-auto flex items-center gap-2">
            {dirty && (
              <span className="text-xs px-2 py-1 rounded border border-white/40 bg-white bg-opacity-10">
                Unsaved changes
              </span>
            )}
            {cloudBusy && (
              <span className="text-xs px-2 py-1 rounded border border-white/40 bg-white bg-opacity-10">
                Syncing…
              </span>
            )}
            {/* Robust visible logout (works on older Tailwind too) */}
            <button
              type="button"
              onClick={logoutVendor}
              className="text-sm font-semibold px-3 py-2 rounded transition"
              style={{
                color: "#fff",
                backgroundColor: "rgba(255,255,255,0.2)",
                border: "1px solid rgba(255,255,255,0.35)"
              }}
              title="Log out"
            >
              Log out
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-screen-lg mx-auto p-4 grid md:grid-cols-[1fr_360px] gap-4">
        {/* LEFT */}
        <section className="space-y-4">
          {/* Store Profile */}
          <div className="bg-white rounded-2xl border border-gray-200 p-4">
            <h2 className="text-lg font-semibold text-[#1b5e20]">Store Profile</h2>
            <div className="mt-3 grid gap-3">
              <label className="grid gap-1">
                <span className="text-sm text-gray-600">Store name</span>
                <input
                  className="p-3 rounded-lg bg-gray-100 outline-none"
                  value={form.storeName}
                  onChange={(e) => onChange("storeName", e.target.value)}
                  placeholder="e.g. Candles"
                />
                {!nameValid && (
                  <span className="text-xs text-red-600">
                    Enter at least 2 characters.
                  </span>
                )}
              </label>

              <div className="grid gap-2">
                <span className="text-sm text-gray-600">Logo</span>
                <div className="flex items-center gap-3">
                  <div className="h-16 w-16 rounded-xl bg-gray-100 overflow-hidden border border-gray-200 flex items-center justify-center">
                    {form.logoDataUrl ? (
                      <img
                        src={form.logoDataUrl}
                        alt="logo preview"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-xs text-gray-400">No logo</span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/*"
                      onChange={handlePickLogo}
                      className="block text-sm"
                    />
                    {form.logoDataUrl && (
                      <button
                        type="button"
                        onClick={removeLogo}
                        className="px-3 py-2 rounded-lg bg-gray-100 text-gray-700"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Hours & Order Rules */}
          <div className="bg-white rounded-2xl border border-gray-200 p-4">
            <h2 className="text-lg font-semibold text-[#1b5e20]">
              Hours & Order Rules
            </h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label className="grid gap-1">
                <span className="text-sm text-gray-600">Opening time</span>
                <input
                  type="time"
                  className="p-3 rounded-lg bg-gray-100 outline-none"
                  value={form.openingTime}
                  onChange={(e) => onChange("openingTime", e.target.value)}
                />
              </label>
              <label className="grid gap-1">
                <span className="text-sm text-gray-600">Closing time</span>
                <input
                  type="time"
                  className="p-3 rounded-lg bg-gray-100 outline-none"
                  value={form.closingTime}
                  onChange={(e) => onChange("closingTime", e.target.value)}
                />
              </label>
            </div>
            {!timeValid && (
              <div className="mt-1 text-xs text-red-600">
                Opening and closing time cannot be the same.
              </div>
            )}

            <div className="mt-3 grid gap-1">
              <span className="text-sm text-gray-600">Minimum order amount</span>
              <input
                type="number"
                min={0}
                className="p-3 rounded-lg bg-gray-100 outline-none"
                value={form.minOrder}
                onChange={(e) => onChange("minOrder", Number(e.target.value))}
                placeholder="0"
              />
              <div className="text-xs text-gray-500">
                Shown to customers at checkout. Current:{" "}
                <b>{fmtNaira(form.minOrder)}</b>
              </div>
            </div>
          </div>

          {/* Contact + Address with Places & GPS */}
          <div className="bg-white rounded-2xl border border-gray-200 p-4">
            <h2 className="text-lg font-semibold text-[#1b5e20]">
              Contact & Address
            </h2>

            <div className="mt-3 grid gap-3">
              <LoadScript googleMapsApiKey={GOOGLE_MAPS_API_KEY} libraries={LIBRARIES}>
                <div className="grid gap-2">
                  <span className="text-sm text-gray-600">Business address</span>
                  <div className="relative flex items-center gap-2">
                    <StandaloneSearchBox
                      onLoad={(ref) => (searchBoxRef.current = ref)}
                      onPlacesChanged={handlePlacesChanged}
                    >
                      <input
                        type="text"
                        value={form.contactAddress}
                        onChange={(e) => onChange("contactAddress", e.target.value)}
                        placeholder="Type address or use current location"
                        className="flex-1 p-3 rounded-lg bg-gray-100 outline-none"
                      />
                    </StandaloneSearchBox>
                    <button
                      type="button"
                      onClick={useCurrentLocation}
                      className="px-3 py-2 rounded-lg text-white"
                      style={{ backgroundColor: "#1b5e20" }}
                      title="Use current location"
                    >
                      📍 Use current
                    </button>
                  </div>

                  {form.locationLat != null && form.locationLng != null && (
                    <div className="text-xs text-gray-500">
                      Saved coords: <b>{form.locationLat.toFixed(5)}</b>,{" "}
                      <b>{form.locationLng.toFixed(5)}</b>
                    </div>
                  )}
                </div>
              </LoadScript>

              <label className="grid gap-1">
                <span className="text-sm text-gray-600">Phone</span>
                <input
                  className="p-3 rounded-lg bg-gray-100 outline-none"
                  value={form.contactPhone}
                  onChange={(e) => onChange("contactPhone", e.target.value)}
                  placeholder="+2348012345678"
                />
              </label>
              <label className="grid gap-1">
                <span className="text-sm text-gray-600">WhatsApp</span>
                <input
                  className="p-3 rounded-lg bg-gray-100 outline-none"
                  value={form.whatsapp}
                  onChange={(e) => onChange("whatsapp", e.target.value)}
                  placeholder="+2348012345678"
                />
              </label>
              <label className="grid gap-1">
                <span className="text-sm text-gray-600">Email</span>
                <input
                  type="email"
                  className="p-3 rounded-lg bg-gray-100 outline-none"
                  value={form.contactEmail}
                  onChange={(e) => onChange("contactEmail", e.target.value)}
                  placeholder="store@email.com"
                />
              </label>
            </div>
          </div>

          {/* Payout */}
          <div className="bg-white rounded-2xl border border-gray-200 p-4">
            <h2 className="text-lg font-semibold text-[#1b5e20]">
              Payout Account
            </h2>
            <p className="text-xs text-gray-500">
              Used for settlements. Leave blank for now if not ready.
            </p>

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label className="grid gap-1">
                <span className="text-sm text-gray-600">Bank</span>
                <input
                  className="p-3 rounded-lg bg-gray-100 outline-none"
                  value={form.payoutBank}
                  onChange={(e) => onChange("payoutBank", e.target.value)}
                  placeholder="e.g. Zenith"
                />
              </label>
              <label className="grid gap-1">
                <span className="text-sm text-gray-600">Account name</span>
                <input
                  className="p-3 rounded-lg bg-gray-100 outline-none"
                  value={form.payoutAccountName}
                  onChange={(e) => onChange("payoutAccountName", e.target.value)}
                  placeholder="Registered name"
                />
              </label>
              <label className="grid gap-1 sm:col-span-2">
                <span className="text-sm text-gray-600">Account number</span>
                <input
                  className="p-3 rounded-lg bg-gray-100 outline-none"
                  value={form.payoutAccountNumber}
                  onChange={(e) =>
                    onChange("payoutAccountNumber", e.target.value.replace(/\D/g, ""))
                  }
                  placeholder="10-12 digits"
                  inputMode="numeric"
                />
              </label>
            </div>

            {!payoutOk && (
              <div className="mt-1 text-xs text-red-600">
                Enter bank, account name and a valid account number (digits only).
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleSave}
              disabled={!canSave || cloudBusy}
              className={`px-4 py-2 rounded-lg text-white font-semibold ${
                canSave && !cloudBusy ? "" : "bg-gray-400 cursor-not-allowed"
              }`}
              style={{ backgroundColor: canSave && !cloudBusy ? "#1b5e20" : undefined }}
            >
              {cloudBusy ? "Saving…" : "Save changes"}
            </button>
            <button
              onClick={handleReset}
              className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700"
            >
              Reset (reload)
            </button>
            <button
              onClick={clearAll}
              className="px-4 py-2 rounded-lg bg-red-50 text-red-700"
            >
              Clear all fields
            </button>
          </div>
        </section>

        {/* RIGHT: Preview */}
        <aside className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-200 p-4">
            <h3 className="text-sm font-semibold text-gray-600">Public preview</h3>
            <div className="mt-3 p-3 rounded-2xl border border-[#0F3D2E]/10">
              <div className="flex items-center gap-3">
                <div className="h-14 w-14 rounded-xl bg-gray-100 overflow-hidden border border-gray-200 flex items-center justify-center">
                  {form.logoDataUrl ? (
                    <img src={form.logoDataUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-xs text-gray-400">Logo</span>
                  )}
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-[#0F3D2E] truncate">
                    {form.storeName || "Your Store"}
                  </div>
                  <div className="text-xs text-[#0F3D2E]/70">
                    {form.openingTime} – {form.closingTime} •{" "}
                    <span className={openNow ? "text-emerald-600" : "text-gray-500"}>
                      {openNow ? "Open now" : "Closed"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-3 grid gap-1 text-sm text-[#0F3D2E]">
                {form.contactAddress && <div>📍 {form.contactAddress}</div>}
                {form.contactPhone && <div>📞 {form.contactPhone}</div>}
                {form.whatsapp && <div>💬 WhatsApp: {form.whatsapp}</div>}
                {form.contactEmail && <div>✉️ {form.contactEmail}</div>}
                {form.locationLat != null && form.locationLng != null && (
                  <div className="text-xs text-gray-500">
                    Coords: <b>{form.locationLat.toFixed(5)}</b>,{" "}
                    <b>{form.locationLng.toFixed(5)}</b>
                  </div>
                )}
                <div className="mt-1 text-xs text-gray-500">
                  Minimum order: <b>{fmtNaira(form.minOrder)}</b>
                </div>
              </div>
            </div>
          </div>

          {toast && (
            <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 text-sm">
              {toast}
            </div>
          )}
        </aside>
      </div>

      {form.locationLat != null && form.locationLng != null && (
        <div className="max-w-screen-lg mx-auto px-4 pb-6">
          <div className="mt-2 rounded-xl overflow-hidden border border-gray-200">
            <iframe
              title="Store map preview"
              width="100%"
              height="180"
              style={{ border: 0 }}
              loading="lazy"
              allowFullScreen
              referrerPolicy="no-referrer-when-downgrade"
              src={`https://www.google.com/maps?q=${form.locationLat},${form.locationLng}&z=15&output=embed`}
            />
          </div>
        </div>
      )}

      {/* EXTRA: a second, very visible logout (safety net) */}
      <div className="fixed bottom-4 right-4 z-40">
        <button
          onClick={logoutVendor}
          className="px-4 py-2 rounded-lg text-white shadow-lg"
          style={{ backgroundColor: "#dc2626" }}
          title="Log out"
        >
          Log out
        </button>
      </div>
    </main>
  );
}