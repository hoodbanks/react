import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

const VENDOR_ID = localStorage.getItem("vendorId") || "vendor123";
const ORDERS_KEY = `vendor_orders_${VENDOR_ID}`;
const fmtNaira = (n) => "₦" + Number(n || 0).toLocaleString();
const hhmm = (iso) =>
  new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

export default function VendorOrderDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    try {
      const list = JSON.parse(localStorage.getItem(ORDERS_KEY) || "[]");
      setOrders(Array.isArray(list) ? list : []);
    } catch {
      setOrders([]);
    }
  }, []);

  const order = useMemo(() => orders.find((o) => o.id === id), [orders, id]);

  const save = (nextOrders) => {
    localStorage.setItem(ORDERS_KEY, JSON.stringify(nextOrders));
    setOrders(nextOrders);
  };

  const updateStatus = (status) => {
    save(orders.map((o) => (o.id === id ? { ...o, status } : o)));
  };

  const [codeInput, setCodeInput] = useState("");
  const requireCode = Boolean(order?.deliveryCode);
  const itemsTotal = (order?.items || []).reduce(
    (s, it) => s + (Number(it.price) || 0) * (Number(it.qty) || 1),
    0
  );
  const deliveryFee = Number(order?.deliveryFee) || 0;
  const total =
    typeof order?.total === "number" ? order?.total : itemsTotal + deliveryFee;

  if (!order) {
    return (
      <main className="min-h-screen bg-[#F7F9F5] grid place-items-center">
        <div className="text-center">
          <p className="mb-4">Order not found.</p>
          <button
            onClick={() => navigate("/orders")}
            className="px-4 py-2 rounded-lg bg-[#1b5e20] text-white"
          >
            Back to orders
          </button>
        </div>
      </main>
    );
  }

  const canAdvance =
    order.status === "New" ||
    order.status === "Preparing" ||
    order.status === "Out for delivery";

  const onAdvance = () => {
    if (order.status === "New") return updateStatus("Preparing");
    if (order.status === "Preparing") return updateStatus("Out for delivery");
    if (order.status === "Out for delivery") {
      if (requireCode && codeInput.trim() !== order.deliveryCode) {
        alert("Delivery code does not match.");
        return;
      }
      return updateStatus("Completed");
    }
  };

  const nextLabel =
    order.status === "New"
      ? "Start preparing"
      : order.status === "Preparing"
      ? "Mark Out for delivery"
      : order.status === "Out for delivery"
      ? "Complete"
      : null;

  return (
    <main className="min-h-screen bg-[#F7F9F5]">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-screen-lg mx-auto px-4 py-4 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-xl">←</button>
          <h1 className="text-2xl font-bold text-[#1b5e20]">Order Detail</h1>
        </div>
      </header>

      <section className="max-w-screen-lg mx-auto p-4 space-y-4">
        <article className="bg-white rounded-2xl border border-gray-200 p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-sm text-gray-500">{hhmm(order.createdAt)}</div>
              <div className="font-semibold text-[#0F3D2E]">
                {order.code} • <span className="text-[#1b5e20]">{fmtNaira(total)}</span>
              </div>
            </div>
            <div>
              <span className="inline-block px-2 py-1 rounded-full bg-gray-100 text-gray-700 text-xs">
                {order.status}
              </span>
            </div>
          </div>

          <ul className="mt-3 text-sm text-[#0F3D2E] divide-y">
            {(order.items || []).map((it, i) => {
              const line = (Number(it.price) || 0) * (Number(it.qty) || 1);
              return (
                <li key={i} className="py-2 flex justify-between">
                  <span>
                    {it.title} × {it.qty}
                  </span>
                  <span className="text-[#0F3D2E]/70">{fmtNaira(line)}</span>
                </li>
              );
            })}
          </ul>

          <div className="mt-3 text-sm text-gray-700 space-y-0.5">
            <div className="flex justify-between">
              <span>Items subtotal</span>
              <b>{fmtNaira(itemsTotal)}</b>
            </div>
            {deliveryFee > 0 && (
              <div className="flex justify-between">
                <span>Delivery</span>
                <b>{fmtNaira(deliveryFee)}</b>
              </div>
            )}
            <div className="flex justify-between pt-2 border-t">
              <span className="font-semibold">Total</span>
              <span className="font-bold text-[#1b5e20]">{fmtNaira(total)}</span>
            </div>
          </div>
        </article>

        {order.status === "Out for delivery" && requireCode && (
          <article className="bg-white rounded-2xl border border-gray-200 p-4">
            <h3 className="font-semibold text-[#0F3D2E] mb-2">Confirm delivery</h3>
            <p className="text-sm text-gray-600 mb-2">
              Ask the rider for the customer’s delivery code and enter it below to complete the order.
            </p>
            <input
              value={codeInput}
              onChange={(e) => setCodeInput(e.target.value.replace(/\D/g, ""))}
              maxLength={6}
              inputMode="numeric"
              placeholder="••••••"
              className="w-full p-3 rounded-lg bg-gray-100 outline-none"
            />
            <p className="text-xs text-gray-500 mt-2">
              (Demo note: saved code is <b>{order.deliveryCode}</b>)
            </p>
          </article>
        )}

        <div className="flex gap-2">
          <button
            onClick={() => navigate("/orders")}
            className="px-4 py-2 rounded-lg bg-white border"
          >
            Back to orders
          </button>

          {canAdvance && nextLabel && (
            <button
              onClick={onAdvance}
              className="px-4 py-2 rounded-lg bg-[#1b5e20] text-white hover:opacity-90"
            >
              {nextLabel}
            </button>
          )}

          {order.status !== "Cancelled" && order.status !== "Completed" && (
            <button
              onClick={() => updateStatus("Cancelled")}
              className="px-4 py-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 ml-auto"
            >
              Cancel
            </button>
          )}
        </div>
      </section>
    </main>
  );
}
