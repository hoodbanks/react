// src/lib/orderNotifications.js
import { useEffect, useRef, useState } from "react";

export function getVendorId() {
  return localStorage.getItem("vendorId") || "vendor123";
}
export function getOrdersKey() {
  return `vendor_orders_${getVendorId()}`;
}
export function readOrders() {
  try {
    const raw = localStorage.getItem(getOrdersKey());
    const arr = JSON.parse(raw || "[]");
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

const SEEN_KEY = () => `vendor_orders_seen_${getVendorId()}`;

/** Mark all orders as "seen" now (store timestamp) */
export function markOrdersSeen() {
  localStorage.setItem(SEEN_KEY(), String(Date.now()));
}

/** Return ms timestamp of last "seen" */
function getLastSeen() {
  return Number(localStorage.getItem(SEEN_KEY()) || 0);
}

/** Push-notification helpers */
export function pushPermission() {
  if (typeof window === "undefined" || !("Notification" in window)) return "unsupported";
  return Notification.permission; // "granted" | "denied" | "default"
}
export function canPush() {
  return pushPermission() === "granted";
}
export async function requestPushPermission() {
  if (!("Notification" in window)) return "unsupported";
  try {
    const perm = await Notification.requestPermission();
    return perm; // "granted" | "denied"
  } catch {
    return "denied";
  }
}

/** Show a push notification; returns the Notification object or null */
export function showPush({ title, body, icon = "/icon-512.png", onClick } = {}) {
  if (!canPush()) return null;
  try {
    const n = new Notification(title || "New order", { body, icon, badge: icon });
    if (onClick) {
      n.onclick = (e) => {
        e.preventDefault?.();
        try { window.focus(); } catch {}
        onClick();
        n.close?.();
      };
    }
    return n;
  } catch {
    return null;
  }
}

/** Count + list of orders newer than lastSeen */
function newOrdersSince(lastSeen, orders) {
  return orders.filter((o) => {
    const t = new Date(o.createdAt || 0).getTime();
    return Number.isFinite(t) && t > lastSeen;
  });
}

/**
 * useOrderNotifications
 * - Keeps `newCount` in sync
 * - Plays a sound when the count increases
 * - Shows a desktop push (if permission is granted)
 */
export function useOrderNotifications({ pollMs = 3000, audioRef } = {}) {
  const [newCount, setNewCount] = useState(0);
  const lastSeenRef = useRef(getLastSeen());
  const prevCountRef = useRef(0);

  const recompute = () => {
    const orders = readOrders();
    const list = newOrdersSince(lastSeenRef.current, orders);
    const c = list.length;

    // If increased → ping + push
    if (c > prevCountRef.current) {
      // Sound (allowed after any user interaction)
      audioRef?.current?.play?.().catch(() => {});
      // Push (only if permission granted)
      if (canPush() && list.length) {
        const newest = [...list].sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        )[0];
        const code = newest.code || String(newest.id || "").slice(-6).toUpperCase();
        const body =
          c === 1
            ? `New order ${code} just arrived`
            : `${c} new orders — latest: ${code}`;
        showPush({
          title: "New order received",
          body,
          onClick: () => {
            // navigate to today (simple, no router here)
            window.location.href = "/orders/today";
          },
        });
      }
    }
    prevCountRef.current = c;
    setNewCount(c);
  };

  useEffect(() => {
    // Initial compute
    recompute();

    // Polling fallback (also catches same-tab writes)
    const id = setInterval(recompute, pollMs);

    // Cross-tab/localStorage events
    const onStorage = (e) => {
      if (e.key === getOrdersKey() || e.key === SEEN_KEY()) {
        lastSeenRef.current = getLastSeen();
        recompute();
      }
    };
    window.addEventListener("storage", onStorage);

    return () => {
      clearInterval(id);
      window.removeEventListener("storage", onStorage);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const markSeen = () => {
    markOrdersSeen();
    lastSeenRef.current = getLastSeen();
    prevCountRef.current = 0;
    setNewCount(0);
  };

  return { newCount, markSeen, refresh: recompute };
}
