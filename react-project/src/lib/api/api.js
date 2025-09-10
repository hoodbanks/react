// src/lib/api.js
// If API is on the same domain as the user app, leave empty string.
// If API is on vendor subdomain, set to "https://vendor.getyovonow.com"
export const API_BASE = import.meta.env.VITE_API_BASE || "";
export async function fetchJson(path) {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}
