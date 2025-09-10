// /api/_cors.js
export function withCors(handler, {
  methods = ["GET", "POST", "OPTIONS"],
  allowedOrigins = (process.env.ALLOWED_ORIGINS || "")
    .split(",")
    .map(s => s.trim())
    .filter(Boolean),
} = {}) {
  const allowAll = allowedOrigins.length === 0; // if you don't set env, allow all (dev-friendly)

  return async (req, res) => {
    const origin = req.headers.origin || "";
    const shouldAllow = allowAll || allowedOrigins.includes(origin);

    // Set CORS headers for every response
    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Methods", methods.join(","));
    res.setHeader("Access-Control-Allow-Headers", "content-type");
    res.setHeader("Access-Control-Max-Age", "86400");
    if (shouldAllow) {
      res.setHeader("Access-Control-Allow-Origin", origin);
    } else if (allowAll) {
      res.setHeader("Access-Control-Allow-Origin", "*");
    }

    // Preflight
    if (req.method === "OPTIONS") {
      res.status(204).end();
      return;
    }

    // Method guard
    if (!methods.includes(req.method)) {
      res.status(405).json({ ok: false, error: `Method ${req.method} Not Allowed` });
      return;
    }

    try {
      await handler(req, res);
    } catch (e) {
      console.error(e);
      res.status(500).json({ ok: false, error: "Server error" });
    }
  };
}

export async function readJson(req) {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
}