// api/vendors.js
import { sql } from './_db.js';
import { withCors, readJson } from './_cors.js';

async function ensureTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS vendors (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      logo_url TEXT NOT NULL DEFAULT '',
      opening_time TEXT NOT NULL DEFAULT '08:00',
      closing_time TEXT NOT NULL DEFAULT '21:00',
      contact_address TEXT NOT NULL DEFAULT '',
      location_lat DOUBLE PRECISION,
      location_lng DOUBLE PRECISION,
      rating DOUBLE PRECISION DEFAULT 4.5,
      active BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
}

async function getVendors(req, res) {
  await ensureTable();
  const rows = await sql`
    SELECT id, name, type, logo_url, opening_time, closing_time,
           contact_address, location_lat, location_lng, rating, active
    FROM vendors
    WHERE active = true
    ORDER BY created_at DESC
  `;
  res.status(200).json({ ok: true, vendors: rows });
}

async function upsertVendor(req, res) {
  await ensureTable();
  const body = await readJson(req);

  const id   = String(body.id || '').trim();
  const name = String(body.name || '').trim();
  const type = String(body.type || 'Shops').trim();

  if (!id || !name) {
    res.status(400).json({ ok: false, error: 'id and name are required' });
    return;
  }

  const payload = {
    logo_url: body.logo_url || '',
    opening_time: body.opening_time || '08:00',
    closing_time: body.closing_time || '21:00',
    contact_address: body.contact_address || '',
    location_lat: body.location_lat ?? null,
    location_lng: body.location_lng ?? null,
    rating: Number.isFinite(+body.rating) ? +body.rating : 4.5,
    active: body.active !== false,
  };

  await sql`
    INSERT INTO vendors (id, name, type, logo_url, opening_time, closing_time,
                         contact_address, location_lat, location_lng, rating, active)
    VALUES (${id}, ${name}, ${type}, ${payload.logo_url}, ${payload.opening_time}, ${payload.closing_time},
            ${payload.contact_address}, ${payload.location_lat}, ${payload.location_lng}, ${payload.rating}, ${payload.active})
    ON CONFLICT (id) DO UPDATE SET
      name=${name},
      type=${type},
      logo_url=${payload.logo_url},
      opening_time=${payload.opening_time},
      closing_time=${payload.closing_time},
      contact_address=${payload.contact_address},
      location_lat=${payload.location_lat},
      location_lng=${payload.location_lng},
      rating=${payload.rating},
      active=${payload.active},
      updated_at=now()
  `;

  res.status(200).json({ ok: true, vendor: { id, name, type, ...payload } });
}

async function handler(req, res) {
  if (req.method === 'GET')  return getVendors(req, res);
  if (req.method === 'POST') return upsertVendor(req, res);
  res.status(405).json({ ok: false, message: 'GET or POST only' });
}

export default withCors(handler);