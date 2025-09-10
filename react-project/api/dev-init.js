// /api/dev-init.js
import { sql } from './_db.js';
import { withCors } from './_cors.js';

async function handler(_req, res) {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS products (
        id         TEXT PRIMARY KEY,
        vendor_id  TEXT NOT NULL,
        title      TEXT NOT NULL,
        price      INTEGER NOT NULL,
        category   TEXT NOT NULL,
        image_url  TEXT,
        addons     JSONB NOT NULL DEFAULT '[]'::jsonb,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `;
    res.status(200).json({ ok: true, message: 'products table ready' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, error: String(e) });
  }
}

export default withCors(handler);
