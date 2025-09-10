// src/pages/ShopItems.jsx
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import BottomNav from "../pages/BottomNav.jsx";

/* ---------- OPTIONAL API BASE ----------
   - Same origin API: leave VITE_API_BASE empty (default)
   - Other domain: set VITE_API_BASE=https://your-domain.com
----------------------------------------- */
const API_BASE = import.meta.env.VITE_API_BASE || "";

/* ---------- CATEGORY SETS BY VENDOR TYPE ---------- */
const CATEGORY_SETS = {
  Shops: ["All", "Pets", "Frozen", "Electronics", "Snacks"],
  Restaurant: ["All", "Soups", "Swallow", "Rice", "Grills", "Drinks"],
  Pharmacy: ["All", "Prescription", "OTC", "Personal Care", "Vitamins", "Devices"],
};

/* ---------- FALLBACK ADD-ONS (used if product has none) ---------- */
const DEFAULT_ADDONS = [
  { id: "meat", label: "Meat", price: 500, max: 2 },
  { id: "fish", label: "Fish", price: 700, max: 2 },
  { id: "pomo", label: "Pomo", price: 400, max: 2 },
];

/* ---------- CART HELPER ---------- */
function addToCartLS(vendorId, vendorName, payload) {
  const key = "cart";
  const cart = JSON.parse(localStorage.getItem(key) || "[]");
  const idx = cart.findIndex((g) => String(g.vendorId) === String(vendorId));
  if (idx === -1) cart.push({ vendorId, vendorName, items: [payload] });
  else {
    const itIdx = cart[idx].items.findIndex(
      (i) => i.id === payload.id && JSON.stringify(i.options) === JSON.stringify(payload.options)
    );
    if (itIdx === -1) cart[idx].items.push(payload);
    else cart[idx].items[itIdx].qty += payload.qty;
  }
  localStorage.setItem(key, JSON.stringify(cart));
}

const formatNaira = (n) => `₦${Number(n || 0).toLocaleString()}`;

export default function ShopItems() {
  const { id: vendorId } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();

  const vendorName = state?.vendorName || "Vendor Items";
  const vendorCategory = state?.vendorCategory || "Shops";

  const TABS = CATEGORY_SETS[vendorCategory] || CATEGORY_SETS.Shops;

  const [activeTab, setActiveTab] = useState(TABS[0]);
  const [qty, setQty] = useState({});
  const [customizing, setCustomizing] = useState(null); // selected item (restaurant)
  const [addonCounts, setAddonCounts] = useState({});   // { addonId: number }
  const [allItems, setAllItems] = useState([]);         // fetched products for this vendor
  const [loading, setLoading] = useState(true);

  // On vendor type change, choose first tab (or requested prefTab)
  useEffect(() => {
    const first = (CATEGORY_SETS[vendorCategory] || CATEGORY_SETS.Shops)[0];
    const desired =
      state?.prefTab && (CATEGORY_SETS[vendorCategory] || []).includes(state.prefTab)
        ? state.prefTab
        : first;
    setActiveTab(desired);
  }, [vendorCategory, state?.prefTab]);

  // Fetch products from API for this vendor
  useEffect(() => {
    let alive = true;
    async function run() {
      try {
        setLoading(true);

        const url =
          vendorId
            ? `${API_BASE}/api/products?vendorId=${encodeURIComponent(vendorId)}`
            : `${API_BASE}/api/products`;

        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        const list = (data.products || []).map((p) => {
          // Safe parse addons (DB may return TEXT)
          let addons = [];
          if (Array.isArray(p.addons)) {
            addons = p.addons;
          } else if (typeof p.addons === "string") {
            try {
              const parsed = JSON.parse(p.addons);
              if (Array.isArray(parsed)) addons = parsed;
            } catch {
              addons = [];
            }
          }

          return {
            id: p.id,
            vendorId: String(p.vendor_id ?? p.vendorId ?? ""),
            title: p.title,
            price: Number(p.price),
            category: p.category,
            img: p.image_url || p.imageUrl || "", // prefer DB column, fallback to JSON field
            addons,
            rx: p.rx || false, // pharmacy flag if you ever store it
            oldPrice: p.old_price || null,
            badge: p.badge || null,
          };
        });

        if (alive) setAllItems(list);
      } catch (e) {
        console.error("Failed to load products:", e);
        if (alive) setAllItems([]);
      } finally {
        if (alive) setLoading(false);
      }
    }
    run();
    return () => { alive = false; };
  }, [vendorId]);

  // Visible items for current vendor + tab
  const items = useMemo(() => {
    const scoped = vendorId
      ? allItems.filter((i) => String(i.vendorId) === String(vendorId))
      : allItems;
    return activeTab === "All"
      ? scoped
      : scoped.filter((i) => (i.category || "").toLowerCase() === activeTab.toLowerCase());
  }, [allItems, vendorId, activeTab]);

  // Default qty = 1 whenever visible items change (for non-modal flows)
  useEffect(() => {
    const m = {};
    items.forEach((i) => (m[i.id] = 1));
    setQty(m);
  }, [items]);

  /* ---------- Qty helpers (non-modal) ---------- */
  const dec = (id) => setQty((q) => ({ ...q, [id]: Math.max((q[id] || 1) - 1, 1) }));
  const inc = (id) => setQty((q) => ({ ...q, [id]: (q[id] || 1) + 1 }));

  /* ---------- Modal helpers ---------- */
  const openCustomize = (item) => {
    // Only for restaurant non-Drinks
    if (vendorCategory !== "Restaurant" || (item.category || "").toLowerCase() === "drinks") return;
    setCustomizing(item);
    // Build counts map from product's own addons (fallback to defaults)
    const baseAddons = (item.addons && item.addons.length ? item.addons : DEFAULT_ADDONS);
    const init = {};
    baseAddons.forEach((a) => (init[a.id] = 0));
    setAddonCounts(init);
  };
  const closeCustomize = () => setCustomizing(null);

  const addAddon = (id, max) =>
    setAddonCounts((m) => ({ ...m, [id]: Math.min((m[id] || 0) + 1, max ?? 99) }));
  const subAddon = (id) =>
    setAddonCounts((m) => ({ ...m, [id]: Math.max((m[id] || 0) - 1, 0) }));

  // Choose the active list of addons for the modal (product-defined or defaults)
  const modalAddons = useMemo(() => {
    if (!customizing) return [];
    return customizing.addons && customizing.addons.length ? customizing.addons : DEFAULT_ADDONS;
  }, [customizing]);

  const modalTotal = useMemo(() => {
    if (!customizing) return 0;
    const base = customizing.price || 0;
    const extras = modalAddons.reduce(
      (sum, a) => sum + (addonCounts[a.id] || 0) * Number(a.price || 0),
      0
    );
    return base + extras;
  }, [customizing, addonCounts, modalAddons]);

  const addCustomizedToCart = () => {
    if (!customizing) return;

    // Build options payload from chosen add-ons
    const chosen = modalAddons
      .filter((a) => (addonCounts[a.id] || 0) > 0)
      .map((a) => ({
        id: a.id,
        label: a.label,
        qty: addonCounts[a.id],
        unitPrice: Number(a.price || 0),
      }));

    addToCartLS(vendorId, vendorName, {
      id: customizing.id,
      title: customizing.title,
      img: customizing.img,
      basePrice: customizing.price,
      price: modalTotal,     // base + add-ons
      qty: 1,                // main dish qty = 1 for this flow
      options: chosen.length ? { addons: chosen } : undefined,
    });

    closeCustomize();
  };

  const addSimpleToCart = (item) => {
    const count = qty[item.id] || 1;
    addToCartLS(vendorId, vendorName, {
      id: item.id,
      title: item.title,
      img: item.img,
      basePrice: item.price,
      price: item.price,
      qty: count,
      options: undefined,
    });
  };

  return (
    <main className="min-h-screen bg-[#F7F9F5] pb-20">
      {/* HEADER */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30 animate-rise">
        <div className="max-w-screen-sm mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-[#0F3D2E] text-lg active:scale-[0.96] transition">←</button>
          <h1 className="text-2xl font-bold text-[#0F3D2E]">{vendorName}</h1>
        </div>

        {/* TABS */}
        <div className="max-w-screen-sm mx-auto px-2">
          <div className="flex gap-6 overflow-x-auto no-scrollbar px-2">
            {(CATEGORY_SETS[vendorCategory] || CATEGORY_SETS.Shops).map((tab) => {
              const active = tab === activeTab;
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-3 text-[16px] font-semibold whitespace-nowrap border-b-2 transition ${
                    active ? "text-[#0F3D2E] border-[#0F3D2E]" : "text-[#0F3D2E]/60 border-transparent hover:text-[#0F3D2E]"
                  }`}
                >
                  {tab}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* BODY */}
      {loading ? (
        <section className="max-w-screen-sm mx-auto p-4">
          <p className="text-center text-sm text-gray-500">Loading items…</p>
        </section>
      ) : vendorCategory === "Pharmacy" ? (
        <section className="max-w-screen-sm mx-auto p-4 space-y-3">
          {items.length === 0 ? (
            <p className="text-center text-sm text-gray-500">No items yet.</p>
          ) : (
            items.map((item, idx) => (
              <article
                key={item.id}
                style={{ animationDelay: `${60 * idx}ms` }}
                className="bg-white rounded-xl border border-[#0F3D2E]/12 p-3 flex gap-3 items-center animate-rise-slow"
              >
                <img src={item.img} alt={item.title} className="h-16 w-16 object-cover rounded-md" loading="lazy" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-[#0F3D2E]">{item.title}</h3>
                    {item.rx && <span className="text-[10px] px-2 py-0.5 bg-red-500 text-white rounded-full">RX</span>}
                  </div>
                  <div className="text-sm text-[#0F3D2E]/70">{formatNaira(item.price)}</div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                    <button className="px-3 py-2 text-[18px] active:scale-[0.96]" onClick={() => dec(item.id)}>–</button>
                    <div className="w-10 text-center">{qty[item.id] || 1}</div>
                    <button className="px-3 py-2 text-[18px] active:scale-[0.96]" onClick={() => inc(item.id)}>+</button>
                  </div>
                  <button
                    onClick={() => addSimpleToCart(item)}
                    className="px-3 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 active:scale-[0.98] transition"
                  >
                    Add
                  </button>
                </div>
              </article>
            ))
          )}
        </section>
      ) : vendorCategory === "Restaurant" ? (
        <section className="max-w-screen-sm mx-auto p-4 grid grid-cols-2 gap-4">
          {items.length === 0 ? (
            <p className="col-span-2 text-center text-sm text-gray-500">No items yet.</p>
          ) : (
            items.map((item, idx) => {
              const isDrink = (item.category || "").toLowerCase() === "drinks";
              return (
                <article
                  key={item.id}
                  style={{ animationDelay: `${50 * idx}ms` }}
                  className="bg-white rounded-2xl border border-[#0F3D2E]/12 overflow-hidden animate-rise-slow"
                >
                  <div className={!isDrink ? "cursor-pointer" : ""} onClick={() => !isDrink && openCustomize(item)}>
                    <img src={item.img} alt={item.title} className="h-28 w-full object-cover" loading="lazy" />
                    <div className="p-3">
                      <h3 className="text-[16px] font-semibold text-[#0F3D2E] leading-snug">{item.title}</h3>
                      <div className="mt-1 text-[15px] font-semibold text-[#0F3D2E]">{formatNaira(item.price)}</div>
                    </div>
                  </div>

                  {isDrink ? (
                    <div className="px-3 pb-3 flex items-center gap-2">
                      <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                        <button className="px-3 py-2 text-[18px] active:scale-[0.96]" onClick={() => dec(item.id)}>–</button>
                        <div className="w-10 text-center">{qty[item.id] || 1}</div>
                        <button className="px-3 py-2 text-[18px] active:scale-[0.96]" onClick={() => inc(item.id)}>+</button>
                      </div>
                      <button
                        onClick={() => addSimpleToCart(item)}
                        className="ml-auto px-3 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 active:scale-[0.98] transition"
                      >
                        Add to Cart
                      </button>
                    </div>
                  ) : (
                    <div className="px-3 pb-3">
                      <button
                        onClick={() => openCustomize(item)}
                        className="w-full px-3 py-2 rounded-lg bg-[#0F3D2E] text-white text-sm font-semibold hover:opacity-90 active:scale-[0.98] transition"
                      >
                        Add
                      </button>
                    </div>
                  )}
                </article>
              );
            })
          )}
        </section>
      ) : (
        <section className="max-w-screen-sm mx-auto p-4 grid grid-cols-2 gap-4">
          {items.length === 0 ? (
            <p className="col-span-2 text-center text-sm text-gray-500">No items yet.</p>
          ) : (
            items.map((item, idx) => (
              <article
                key={item.id}
                style={{ animationDelay: `${50 * idx}ms` }}
                className="bg-white rounded-2xl border border-[#0F3D2E]/12 overflow-hidden animate-rise-slow"
              >
                <div className="relative">
                  <img src={item.img} alt={item.title} className="h-28 w-full object-cover" loading="lazy" />
                  {item.badge && (
                    <span className="absolute top-2 right-2 bg-red-500 text-white text-[11px] px-2 py-1 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </div>
                <div className="p-3">
                  <h3 className="text-[16px] font-semibold text-[#0F3D2E] leading-snug">{item.title}</h3>
                  <div className="mt-1">
                    {item.oldPrice && <div className="text-sm text-[#0F3D2E]/60 line-through">{formatNaira(item.oldPrice)}</div>}
                    <div className="text-[15px] font-semibold text-[#0F3D2E]">{formatNaira(item.price)}</div>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                      <button className="px-3 py-2 text-[18px] active:scale-[0.96]" onClick={() => dec(item.id)}>–</button>
                      <div className="w-10 text-center">{qty[item.id] || 1}</div>
                      <button className="px-3 py-2 text-[18px] active:scale-[0.96]" onClick={() => inc(item.id)}>+</button>
                    </div>
                    <button
                      onClick={() => addSimpleToCart(item)}
                      className="ml-auto px-3 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 active:scale-[0.98] transition"
                    >
                      Add to Cart
                    </button>
                  </div>
                </div>
              </article>
            ))
          )}
        </section>
      )}

      {/* --------- CUSTOMIZATION MODAL (Restaurant, non-Drinks) --------- */}
      {customizing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-xl relative animate-pop">
            {/* Close */}
            <button
              onClick={closeCustomize}
              className="absolute top-3 right-4 text-2xl leading-none text-gray-500"
              aria-label="Close"
            >
              ×
            </button>

            {/* Title & image */}
            <div className="px-6 pt-6 text-center">
              <h2 className="text-2xl font-bold text-[#0F3D2E]">{customizing.title}</h2>
              {customizing.img ? (
                <img
                  src={customizing.img}
                  alt={customizing.title}
                  className="mx-auto mt-3 h-28 w-48 object-cover rounded-2xl"
                />
              ) : null}
              <p className="mt-2 text-[#0F3D2E]/60">Choose add-ons</p>
            </div>

            {/* Add-ons */}
            <div className="px-6 mt-4">
              <h3 className="text-lg font-semibold text-[#0F3D2E] mb-2">Add-ons</h3>

              <div className="space-y-3">
                {modalAddons.map((a) => (
                  <div
                    key={a.id}
                    className="border border-gray-200 rounded-xl px-4 py-3 flex items-center justify-between"
                  >
                    <div>
                      <div className="text-[17px] font-semibold text-[#0F3D2E]">{a.label}</div>
                      <div className="text-[#0F3D2E]/50 -mt-0.5">{formatNaira(a.price || 0)}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => subAddon(a.id)}
                        className="h-10 w-10 rounded-lg border border-gray-300 text-xl"
                      >
                        –
                      </button>
                      <div className="w-6 text-center">{addonCounts[a.id] || 0}</div>
                      <button
                        onClick={() => addAddon(a.id, a.max)}
                        className="h-10 w-10 rounded-lg border border-gray-300 text-xl"
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))}
                {!modalAddons.length && (
                  <div className="text-sm text-gray-500">No add-ons available for this item.</div>
                )}
              </div>
            </div>

            {/* Total + CTA */}
            <div className="px-6 mt-5 mb-6 flex items-center justify-between">
              <div className="text-lg font-semibold text-[#0F3D2E]">Total</div>
              <div className="text-2xl font-bold text-[#0F3D2E]">{formatNaira(modalTotal)}</div>
            </div>

            <div className="px-6 pb-6">
              <button
                onClick={addCustomizedToCart}
                className="w-full h-12 rounded-2xl bg-[#D24A0A] text-white text-[16px] font-semibold hover:opacity-95 active:scale-[0.98] transition"
              >
                Add to Cart
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />

      {/* Utilities + animations */}
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes rise { 0% {opacity:0; transform: translateY(12px)} 100% {opacity:1; transform: translateY(0)} }
        @keyframes riseSlow { 0% {opacity:0; transform: translateY(16px)} 100% {opacity:1; transform: translateY(0)} }
        @keyframes pop { 0% {opacity:0; transform: scale(.96)} 100% {opacity:1; transform: scale(1)} }
        .animate-rise { animation: rise .5s ease-out both }
        .animate-rise-slow { animation: riseSlow .65s ease-out both }
        .animate-pop { animation: pop .2s ease-out both }
        @media (prefers-reduced-motion: reduce) {
          * { animation: none !important; transition: none !important; }
        }
      `}</style>
    </main>
  );
}