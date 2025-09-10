import { useMemo } from "react";
import { useNavigate, NavLink } from "react-router-dom";
import BottomNav from "../pages/BottomNav.jsx";

const COMPLETED_KEY = "completedOrders";
const CART_KEY = "cart";
const formatNaira = (n) => `₦${Number(n || 0).toLocaleString()}`;

function loadCompleted() {
  try { 
    const arr = JSON.parse(localStorage.getItem(COMPLETED_KEY) || "[]");
    return Array.isArray(arr) ? arr : [];
  } catch { return []; }
}
function loadCart() {
  try { return JSON.parse(localStorage.getItem(CART_KEY) || "[]"); }
  catch { return []; }
}
function saveCart(arr){ localStorage.setItem(CART_KEY, JSON.stringify(arr)); }
function addOrderToCart(order) {
  const cart = loadCart();
  const idx = cart.findIndex(g => String(g.vendorId) === String(order.vendorId));
  const items = (order.items || []).map(it => ({
    id: it.id, title: it.title, img: it.img,
    basePrice: it.basePrice ?? it.price, price: it.price,
    qty: it.qty || 1, options: it.options
  }));
  if (idx === -1) cart.push({ vendorId: order.vendorId, vendorName: order.vendorName, items });
  else cart[idx].items.push(...items);
  saveCart(cart);
}

export default function CompletedOrders() {
  const navigate = useNavigate();
  const orders = useMemo(() => loadCompleted().slice().reverse(), []);

  return (
    <main className="min-h-screen bg-[#F7F9F5] pb-20">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-screen-sm mx-auto px-4 py-4 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-[#0F3D2E] text-lg">←</button>
          <h1 className="text-2xl font-bold text-[#0F3D2E]">Completed Orders</h1>
        </div>
      </header>

      {!orders.length ? (
        <section className="max-w-screen-sm mx-auto p-6 text-center">
          <p className="text-[#0F3D2E]/70">No completed orders yet.</p>
          <NavLink to="/vendorlist" className="inline-block mt-4 px-4 py-2 rounded-lg bg-[#0F3D2E] text-white">
            Browse vendors
          </NavLink>
        </section>
      ) : (
        <section className="max-w-screen-sm mx-auto p-4 space-y-4">
          {orders.map((order, idx) => {
            const when = order.deliveredAt || order.paidAt || order.completedAt;
            const dateText = when ? new Date(when).toLocaleString() : "—";
            const subtotal = (order.items || []).reduce((s, it) => s + (it.price || 0) * (it.qty || 1), 0);
            const fee = order.deliveryFee || 0;
            const total = order.total || subtotal + fee;

            return (
              <article key={(order.vendorId||"v")+"-"+(order.paidAt||idx)} className="bg-white rounded-2xl border border-[#0F3D2E]/12 p-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-[#0F3D2E]">{order.vendorName || "Store"}</h3>
                  <span className="text-xs px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Delivered
                  </span>
                </div>
                <div className="mt-1 text-sm text-[#0F3D2E]/70">{dateText}</div>

                <div className="mt-3 space-y-2">
                  {(order.items || []).map((it) => (
                    <div key={it.id + (it.options ? JSON.stringify(it.options) : "")}
                         className="flex items-center justify-between gap-3 p-2 bg-[#F8FAF9] rounded-xl">
                      <div className="flex items-center gap-3 min-w-0">
                        {it.img && <img src={it.img} alt={it.title} className="h-10 w-10 rounded-lg object-cover" loading="lazy" />}
                        <div className="min-w-0">
                          <div className="font-medium text-sm text-[#0F3D2E] truncate">{it.title}</div>
                          {it.options?.addons?.length > 0 && (
                            <div className="text-xs text-[#0F3D2E]/60">
                              {it.options.addons.map(a => `${a.label}×${a.qty}`).join(", ")}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-right text-sm">
                        <div className="font-semibold">{formatNaira((it.price || 0) * (it.qty || 1))}</div>
                        <div className="text-[#0F3D2E]/60">×{it.qty || 1}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-3 grid grid-cols-2 text-sm text-[#0F3D2E]/80">
                  <span>Subtotal</span>
                  <span className="text-right font-medium">{formatNaira(subtotal)}</span>
                  <span>Delivery fee</span>
                  <span className="text-right font-medium">{formatNaira(fee)}</span>
                </div>
                <div className="mt-1 flex justify-between items-center text-lg font-bold text-[#0F3D2E]">
                  <span>Total</span>
                  <span>{formatNaira(total)}</span>
                </div>

                <button
                  onClick={() => { addOrderToCart(order); navigate("/cart"); }}
                  className="mt-4 w-full bg-[#0F3D2E] text-white p-3 rounded-xl hover:opacity-95 transition-all duration-200"
                >
                  Reorder
                </button>
              </article>
            );
          })}
        </section>
      )}

      <BottomNav />
    </main>
  );
}
