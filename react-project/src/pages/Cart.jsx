import React, { useEffect, useMemo, useState } from "react";
import BottomNav from "../pages/BottomNav.jsx";
import { TrashIcon } from "@heroicons/react/24/outline";
import { NavLink } from "react-router-dom";

const CART_KEY = "cart";
const ACTIVE_KEY = "activeOrders";

// 🔒 Vendor coordinates registry (keep in sync with your VendorList)
const VENDOR_COORDS = {
  "1": { name: "Roban Mart",  lat: 6.2239, lng: 7.1185 },
  "2": { name: "FreshMart",   lat: 6.2242, lng: 7.1190 },
  "3": { name: "PharmaPlus",  lat: 6.2234, lng: 7.1175 },
  "4": { name: "Candles",     lat: 6.2234, lng: 7.1175 }, // update if different
};

// 📍 Haversine distance in KM
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

// 💸 Dynamic delivery fee: 8.2km → ₦2000, min ₦1300, round up to ₦50
function computeDeliveryFee(distanceKm) {
  if (!Number.isFinite(distanceKm)) return 1300;
  const ratePerKm = 2000 / 8.2; // ≈ ₦243.9/km
  const raw = distanceKm * ratePerKm;
  const roundedTo50 = Math.ceil(raw / 50) * 50;
  return Math.max(1300, roundedTo50);
}

const formatNaira = (n) => `₦${Number(n || 0).toLocaleString()}`;
const deepClone = (o) => JSON.parse(JSON.stringify(o));
const loadCart = () => {
  try {
    const raw = localStorage.getItem(CART_KEY);
    const arr = JSON.parse(raw || "[]");
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
};
const saveCart = (arr) => localStorage.setItem(CART_KEY, JSON.stringify(arr));

export default function Cart() {
  // cart = [{ vendorId, vendorName, items: [{id,title,img,basePrice,price,qty,options}] }]
  const [stores, setStores] = useState(() => loadCart());

  // read user location saved from VendorList/VendorItems
  const userLocation = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("userLocation") || "null");
    } catch {
      return null;
    }
  }, []);

  // compute distance + delivery per store
  const storeMeta = useMemo(() => {
    return (stores || []).map((store) => {
      const sid = String(store.vendorId);
      const v = VENDOR_COORDS[sid];
      let distanceKm = null;
      if (v && userLocation?.lat && userLocation?.lng) {
        distanceKm = getDistanceKm(v.lat, v.lng, userLocation.lat, userLocation.lng);
      }
      const deliveryFee = computeDeliveryFee(distanceKm);
      return { distanceKm, deliveryFee };
    });
  }, [stores, userLocation]);

  // keep in sync with localStorage changes (optional)
  useEffect(() => {
    const onStorage = (e) => e.key === CART_KEY && setStores(loadCart());
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const updateStores = (updater) => {
    setStores((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      saveCart(next);
      return next;
    });
  };

  const handleQuantityChange = (storeIdx, itemIdx, delta) => {
    updateStores((prev) => {
      const next = deepClone(prev);
      const it = next[storeIdx].items[itemIdx];
      it.qty = Math.max(1, (it.qty || 1) + delta);
      return next;
    });
  };

  const handleRemoveProduct = (storeIdx, itemIdx) => {
    updateStores((prev) => {
      const next = deepClone(prev);
      next[storeIdx].items.splice(itemIdx, 1);
      if (!next[storeIdx].items.length) next.splice(storeIdx, 1);
      return next;
    });
  };

  const subtotalForStore = (store) =>
    store.items.reduce((sum, it) => sum + (it.price || 0) * (it.qty || 1), 0);

  const handlePay = (storeIdx) => {
    const store = stores[storeIdx];
    const subtotal = subtotalForStore(store);
    const { deliveryFee } = storeMeta[storeIdx] || { deliveryFee: 1300 };
    const total = subtotal + deliveryFee;

    if (!window.PaystackPop) {
      alert("Paystack script not loaded yet.");
      return;
    }

    const handler = window.PaystackPop.setup({
      key: "pk_live_c459831b2a87e2e5588c5afaeade06f7f8e21e6a", // your public key
      email: "customer@example.com", // real customer email here
      amount: total * 100, // kobo
      currency: "NGN",
      ref: `yovo-${Date.now()}`,
      onClose: function () {},
      callback: function (response) {
        try {
          const active = JSON.parse(localStorage.getItem(ACTIVE_KEY) || "[]");
          active.push({
            vendorId: store.vendorId,
            vendorName: store.vendorName,
            paidAt: new Date().toISOString(),
            paystack: response,
            items: store.items,
            deliveryFee,
            total,
            status: "Preparing",
          });
          localStorage.setItem(ACTIVE_KEY, JSON.stringify(active));
        } catch {}

        updateStores((prev) => prev.filter((_, i) => i !== storeIdx));
        alert("Payment successful!");
      },
    });

    handler.openIframe();
  };

  // optional grand total (across stores)
  const grandTotal = useMemo(
    () =>
      stores.reduce((sum, s, i) => {
        const fee = storeMeta[i]?.deliveryFee ?? 1300;
        return sum + subtotalForStore(s) + fee;
      }, 0),
    [stores, storeMeta]
  );

  return (
    <main className="relative min-h-screen bg-[#F7F9F5] pb-20">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30 animate-rise">
        <div className="max-w-screen-sm mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-[#0F3D2E]">Cart</h1>
          <NavLink
            to="/activeorders"
            className="text-sm font-semibold text-white bg-[#0F3D2E] px-3 py-2 rounded-lg hover:opacity-95 active:scale-[0.98] transition"
          >
            Active Orders
          </NavLink>
        </div>
      </header>

      {/* Empty state */}
      {!stores.length && (
        <section className="max-w-screen-sm mx-auto p-6 text-center animate-rise">
          <p className="text-[#0F3D2E]/70">Your cart is empty.</p>
          <NavLink
            to="/vendorlist"
            className="inline-block mt-4 px-4 py-2 rounded-lg bg-[#0F3D2E] text-white hover:opacity-95 active:scale-[0.98] transition"
          >
            Browse vendors
          </NavLink>
        </section>
      )}

      {/* Stores */}
      <section className="max-w-screen-sm mx-auto p-4 space-y-6">
        {stores.map((store, storeIdx) => {
          const subtotal = subtotalForStore(store);
          const meta = storeMeta[storeIdx] || {};
          const distanceText =
            Number.isFinite(meta.distanceKm) ? `${meta.distanceKm.toFixed(1)} km` : "—";
          const deliveryFee = meta.deliveryFee ?? 1300;

          return (
            <article
              key={store.vendorId || storeIdx}
              style={{ animationDelay: `${70 * storeIdx}ms` }}
              className="p-4 bg-white rounded-2xl border border-[#0F3D2E]/12 animate-rise-slow will-change-transform will-change-opacity"
            >
              <h2 className="font-bold text-lg text-[#0F3D2E]">
                {store.vendorName || "Store"}
              </h2>

              {/* Distance & ETA row */}
              <div className="mt-1 text-sm text-[#0F3D2E]/70">
                Distance: <span className="font-medium text-[#0F3D2E]">{distanceText}</span>
              </div>

              <div className="mt-3 space-y-2">
                {store.items.map((product, itemIdx) => (
                  <div
                    key={product.id + (product.options ? JSON.stringify(product.options) : "")}
                    className="flex items-center justify-between gap-3 p-2 bg-[#F8FAF9] rounded-xl"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {product.img ? (
                        <img
                          src={product.img}
                          alt={product.title}
                          className="h-12 w-12 rounded-lg object-cover"
                          loading="lazy"
                        />
                      ) : null}
                      <div className="min-w-0">
                        <div className="font-medium text-[#0F3D2E] truncate">
                          {product.title}
                        </div>
                        {product.options?.addons?.length ? (
                          <div className="text-xs text-[#0F3D2E]/60">
                            {product.options.addons
                              .map((a) => `${a.label}×${a.qty}`)
                              .join(", ")}
                          </div>
                        ) : null}
                        <div className="text-sm text-[#0F3D2E]/70">
                          {formatNaira(product.price)}
                          {product.basePrice && product.basePrice !== product.price ? (
                            <span className="ml-1 line-through opacity-60 text-xs">
                              {formatNaira(product.basePrice)}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleQuantityChange(storeIdx, itemIdx, -1)}
                        className="px-3 py-1.5 bg-gray-200 rounded active:scale-[0.96] transition"
                      >
                        –
                      </button>
                      <span className="w-6 text-center">{product.qty || 1}</span>
                      <button
                        onClick={() => handleQuantityChange(storeIdx, itemIdx, 1)}
                        className="px-3 py-1.5 bg-gray-200 rounded active:scale-[0.96] transition"
                      >
                        +
                      </button>
                    </div>

                    <div className="text-right">
                      <div className="font-semibold">
                        {formatNaira((product.price || 0) * (product.qty || 1))}
                      </div>
                      <button
                        onClick={() => handleRemoveProduct(storeIdx, itemIdx)}
                        title="Remove"
                        className="mt-1 inline-flex text-red-600 hover:text-red-700 active:scale-[0.96] transition"
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="mt-4 grid grid-cols-2 text-sm text-[#0F3D2E]/80">
                <span>Subtotal</span>
                <span className="text-right font-medium">{formatNaira(subtotal)}</span>
                <span>Delivery fee</span>
                <span className="text-right font-medium">{formatNaira(deliveryFee)}</span>
              </div>
              <div className="mt-2 flex justify-between items-center text-lg font-bold text-[#0F3D2E]">
                <span>Total</span>
                <span>{formatNaira(subtotal + deliveryFee)}</span>
              </div>

              <button
                onClick={() => handlePay(storeIdx)}
                className="mt-4 w-full bg-[#0F3D2E] text-white p-3 rounded-xl hover:opacity-95 active:scale-[0.98] transition"
              >
                Pay now
              </button>
            </article>
          );
        })}
      </section>

      {/* Optional grand total across stores */}
      {/* {stores.length > 1 && (
        <div className="max-w-screen-sm mx-auto px-4 pb-2 text-right text-sm text-[#0F3D2E]/70">
          Grand total (incl. per-store delivery): <span className="font-semibold">{formatNaira(grandTotal)}</span>
        </div>
      )} */}

      <BottomNav />

      {/* animations */}
      <style>{`
        @keyframes rise { 0% {opacity:0; transform: translateY(12px)} 100% {opacity:1; transform: translateY(0)} }
        @keyframes riseSlow { 0% {opacity:0; transform: translateY(14px)} 100% {opacity:1; transform: translateY(0)} }
        .animate-rise { animation: rise .5s ease-out both }
        .animate-rise-slow { animation: riseSlow .65s ease-out both }

        @media (prefers-reduced-motion: reduce) {
          * { animation: none !important; transition: none !important; }
        }
      `}</style>
    </main>
  );
}
