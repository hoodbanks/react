// src/lib/ordersStore.js
const KEY = "vw_orders"; // localStorage key
let subscribers = [];

/* ---------- internal helpers ---------- */
function load() {
  try {
    const arr = JSON.parse(localStorage.getItem(KEY) || "[]");
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}
function save(arr) {
  localStorage.setItem(KEY, JSON.stringify(arr));
  subscribers.forEach((fn) => fn(arr));
}
function uid() {
  return (crypto?.randomUUID?.() || String(Date.now() + Math.random())).replace(/-/g, "");
}

/* ---------- public api ---------- */
export function subscribeOrders(callback) {
  subscribers.push(callback);
  callback(load());               // fire immediately with current data
  return () => { subscribers = subscribers.filter((fn) => fn !== callback); };
}

export function getOrders({ vendorId, from, to } = {}) {
  const all = load();
  return all.filter((o) =>
    (!vendorId || o.vendorId === vendorId) &&
    (!from || o.createdAt >= from) &&
    (!to || o.createdAt < to)
  );
}

export function addOrder(order) {
  const all = load();
  const rec = {
    id: order.id || uid(),
    vendorId: order.vendorId,          // e.g. "vendor123"
    code: order.code || String(Math.floor(100000 + Math.random() * 900000)),
    status: order.status || "Pending", // "Pending" | "Preparing" | "Out for delivery" | "Completed"
    createdAt: order.createdAt || Date.now(),
    items: order.items || [],          // [{title, qty, price}]
    total: order.total ?? calcTotal(order.items),
    customerName: order.customerName || "Customer",
    customerPhone: order.customerPhone || "",
    note: order.note || "",
  };
  all.unshift(rec);
  save(all);
  return rec;
}

export function updateOrder(id, patch) {
  const all = load();
  const i = all.findIndex((o) => o.id === id);
  if (i === -1) return null;
  all[i] = { ...all[i], ...patch, updatedAt: Date.now() };
  save(all);
  return all[i];
}

export function removeOrder(id) {
  const all = load().filter((o) => o.id !== id);
  save(all);
}

export function seedDemoIfEmpty(vendorId = "vendor123") {
  const cur = load();
  if (cur.length) return;

  const now = Date.now();
  const sample = [
    {
      vendorId, status: "Pending", createdAt: now - 30 * 60 * 1000,
      items: [{ title: "Jollof Rice", qty: 2, price: 1200 }, { title: "Chicken", qty: 1, price: 800 }],
      customerName: "Ada", customerPhone: "+2348000000001",
    },
    {
      vendorId, status: "Preparing", createdAt: now - 50 * 60 * 1000,
      items: [{ title: "Egusi Soup", qty: 1, price: 1500 }, { title: "Fufu", qty: 2, price: 300 }],
      customerName: "Tunde", customerPhone: "+2348000000002",
    },
    {
      vendorId, status: "Completed", createdAt: startOfToday() + 9 * 60 * 60 * 1000, // today 9:00
      items: [{ title: "Malt 33cl", qty: 3, price: 800 }],
      customerName: "Kemi", customerPhone: "+2348000000003",
    },
  ].map((o) => ({ id: uid(), code: String(Math.floor(100000 + Math.random() * 900000)), total: calcTotal(o.items), ...o }));

  save(sample);
}

export function computeStats(orders) {
  const [start, end] = todayRange();
  const today = orders.filter((o) => o.createdAt >= start && o.createdAt < end);
  const todayCount = today.length;
  const pendingCount = orders.filter((o) => o.status === "Pending").length;
  const completedCount = orders.filter((o) => o.status === "Completed").length;
  const todaysEarnings = today
    .filter((o) => o.status === "Completed")
    .reduce((s, o) => s + (o.total || 0), 0);
  return { todayCount, pendingCount, completedCount, todaysEarnings };
}

/* ---------- small utils ---------- */
function calcTotal(items = []) {
  return items.reduce((s, it) => s + (Number(it.price) || 0) * (Number(it.qty) || 0), 0);
}
function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return +d;
}
function todayRange() {
  const start = startOfToday();
  const end = start + 24 * 60 * 60 * 1000;
  return [start, end];
}
