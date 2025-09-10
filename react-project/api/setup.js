import { sql } from './_db.js';
import { withCors } from './_cors.js';

async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, message: 'Use POST' });
    return;
  }

  try {
    await sql`
      CREATE TABLE IF NOT EXISTS vendors (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        name TEXT,
        type TEXT NOT NULL CHECK (type IN ('Restaurant','Shops','Pharmacy')),
        logo_url TEXT,
        opening_time TEXT,
        closing_time TEXT,
        min_order INTEGER DEFAULT 0,
        contact_phone TEXT,
        contact_email TEXT,
        contact_address TEXT,
        whatsapp TEXT,
        location_lat DOUBLE PRECISION,
        location_lng DOUBLE PRECISION,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        vendor_id TEXT NOT NULL,
        title TEXT NOT NULL,
        price INTEGER NOT NULL,
        category TEXT NOT NULL,
        image_url TEXT,
        addons JSONB DEFAULT '[]'::jsonb,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_products_vendor ON products(vendor_id);
    `;
    res.status(200).json({ ok: true, message: 'Tables ready' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, error: String(e) });
  }
}

export default withCors(handler);
