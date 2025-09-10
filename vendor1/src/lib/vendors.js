// api/vendors.js (users app)
import { sql } from "./_db.js";
import { withCors, readJson } from "./_cors.js";

async function ensureTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS vendors (
      id           TEXT PRIMARY KEY,
      name         TEXT NOT NULL,
      type         TEXT NOT NULL,      -- 'Restaurant' | 'Shops' | 'Pharmacy'
      image_url    TEXT NOT NULL DEFAULT '',
      opening_time TEXT NOT NULL DEFAULT '08:00',
      closing_time TEXT NOT NULL DEFAULT '21:00',
      address      TEXT NOT NULL DEFAULT '',
      lat          DOUBLE PRECISION,
      lng          DOUBLE PRECISION,
      rating       NUMERIC NOT NULL DEFAULT 4.5,
      active       BOOLEAN NOT NULL DEFAULT TRUE,
      created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
}

/* GET /api/vendors
   Optional: ?active=true (default), ?active=false */
async function listVendors(req, res) {
  await ensureTable();
  const url = new URL(req.url, `http://${req.headers.host}`);
  const active = url.searchParams.get("active");
  let rows;
  if (active === "false") {
    rows = await sql`SELECT * FROM vendors ORDER BY created_at DESC`;
  } else {
    rows = await sql`SELECT * FROM vendors WHERE active = true ORDER BY created_at DESC`;
  }
  // Convert to camelCase for frontend
  const vendors = rows.map(r => ({
    id: r.id,
    name: r.name,
    type: r.type,
    imageUrl: r.image_url,
    openingTime: r.opening_time,
    closingTime: r.closing_time,
    address: r.address,
    lat: r.lat,
    lng: r.lng,
    rating: Number(r.rating ?? 4.5),
    active: r.active,
  }));
  res.status(200).json({ ok: true, vendors });
}

/* POST /api/vendors
   Body: { id, name, type, imageUrl?, openingTime?, closingTime?, address?, lat?, lng?, rating?, active? }
   Upserts by id so you can call it on signup and later from Settings. */
async function upsertVendor(req, res) {
  await ensureTable();
  const body = await readJson(req);

  const id = String(body.id || "").trim();
  const name = String(body.name || "").trim();
  const type = String(body.type || "").trim(); // 'Restaurant' | 'Shops' | 'Pharmacy'

  if (!id || !name || !type) {
    res.status(400).json({ ok: false, error: "id, name and type are required" });
    return;
  }

  const imageUrl    = String(body.imageUrl || "");
  const openingTime = String(body.openingTime || "08:00");
  const closingTime = String(body.closingTime || "21:00");
  const address     = String(body.address || "");
  const lat         = body.lat == null ? null : Number(body.lat);
  const lng         = body.lng == null ? null : Number(body.lng);
  const rating      = body.rating == null ? 4.5 : Number(body.rating);
  const active      = body.active == null ? true : Boolean(body.active);

  const rows = await sql`
    INSERT INTO vendors (id, name, type, image_url, opening_time, closing_time, address, lat, lng, rating, active)
    VALUES (${id}, ${name}, ${type}, ${imageUrl}, ${openingTime}, ${closingTime}, ${address}, ${lat}, ${lng}, ${rating}, ${active})
    ON CONFLICT (id) DO UPDATE SET
      name=${name}, type=${type}, image_url=${imageUrl}, opening_time=${openingTime},
      closing_time=${closingTime}, address=${address}, lat=${lat}, lng=${lng},
      rating=${rating}, active=${active}
    RETURNING *
  `;

  const r = rows[0];
  res.status(200).json({
    ok: true,
    vendor: {
      id: r.id,
      name: r.name,
      type: r.type,
      imageUrl: r.image_url,
      openingTime: r.opening_time,
      closingTime: r.closing_time,
      address: r.address,
      lat: r.lat,
      lng: r.lng,
      rating: Number(r.rating ?? 4.5),
      active: r.active,
    },
  });
}

async function handler(req, res) {
  if (req.method === "GET")  return listVendors(req, res);
  if (req.method === "POST") return upsertVendor(req, res);
  res.status(405).json({ ok: false, error: "Use GET or POST" });
}

export default withCors(handler);