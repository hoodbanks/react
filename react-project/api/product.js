// api/products.js
import { sql } from './_db.js';
import { withCors, readJson } from './_cors.js';

async function ensureTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      vendor_id TEXT NOT NULL,
      title TEXT NOT NULL,
      price INTEGER NOT NULL,
      category TEXT NOT NULL,
      image_url TEXT NOT NULL DEFAULT '',
      addons JSONB NOT NULL DEFAULT '[]',
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
}

function uid() {
  return (
    globalThis.crypto?.randomUUID?.() ||
    (Math.random().toString(36).slice(2) + Date.now().toString(36))
  );
}

// GET /api/products?vendorId=abc
async function getProducts(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const vendorId = url.searchParams.get('vendorId');
  await ensureTable();
  const rows = vendorId
    ? await sql`SELECT * FROM products WHERE vendor_id = ${vendorId} ORDER BY created_at DESC`
    : await sql`SELECT * FROM products ORDER BY created_at DESC`;
  res.status(200).json({ ok: true, products: rows });
}

// POST /api/products
async function createProduct(req, res) {
  const body = await readJson(req);

  const vendorId = String(body.vendorId || '').trim();
  const title = String(body.title || '').trim();
  const category = String(body.category || '').trim();
  const price = Number(body.price || 0);
  const imageUrl = String(body.imageUrl || '');
  const addons = Array.isArray(body.addons) ? body.addons : [];

  if (!vendorId || !title || !category || !Number.isFinite(price)) {
    res.status(400).json({ ok: false, error: 'Invalid payload' });
    return;
  }

  await ensureTable();
  const id = uid();
  await sql`
    INSERT INTO products (id, vendor_id, title, price, category, image_url, addons)
    VALUES (${id}, ${vendorId}, ${title}, ${price}, ${category}, ${imageUrl}, ${JSON.stringify(addons)})
  `;
  res.status(201).json({
    ok: true,
    product: { id, vendor_id: vendorId, title, price, category, image_url: imageUrl, addons }
  });
}

async function handler(req, res) {
  if (req.method === 'GET') return getProducts(req, res);
  if (req.method === 'POST') return createProduct(req, res);
  res.status(405).json({ ok: false, message: 'GET or POST' });
}

export default withCors(handler);