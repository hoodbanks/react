// api/_cors.js
function parseAllowed() {
  const raw = process.env.ALLOWED_ORIGINS || "";
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function originAllowed(origin, allowed) {
  if (!origin) return false;
  if (allowed.includes("*")) return true;

  let oHost = "";
  try {
    oHost = new URL(origin).host; // e.g. "vendor.getyovonow.com"
  } catch {
    return false;
  }

  return allowed.some((a) => {
    // Exact origin string match (e.g. "https://vendor.getyovonow.com")
    if (a === origin) return true;

    // If 'a' is a URL, compare origin/host strictly
    try {
      const au = new URL(a);
      if (au.origin === origin) return true;
      if (au.host === oHost) return true;
      return false;
    } catch {
      // 'a' is not a full URL. Allow host or wildcard like "*.getyovonow.com"
      if (a.startsWith("*.") && oHost.endsWith(a.slice(2))) return true;
      if (a === oHost) return true;
      if (oHost.endsWith("." + a)) return true; // e.g. a="getyovonow.com"
      return false;
    }
  });
}

export function withCors(handler) {
  return async (req, res) => {
    const origin = req.headers.origin || "";
    const allowed = parseAllowed();

    const allowThisOrigin = originAllowed(origin, allowed);

    // Always advertise what we allow (helps preflight pass)
    if (allowThisOrigin) {
      res.setHeader("Access-Control-Allow-Origin", origin);
      res.setHeader("Vary", "Origin");
    }
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

    // Preflight
    if (req.method === "OPTIONS") {
      res.status(204).end();
      return;
    }

    return handler(req, res);
  };
}

export async function readJson(req) {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  const str = Buffer.concat(chunks).toString("utf8");
  try {
    return JSON.parse(str || "{}");
  } catch {
    return {};
  }
}