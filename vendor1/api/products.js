// /api/products.js
import { sql } from './_db.js';
import { withCors, readJson } from './_cors.js';
import { z } from 'zod';

// Ensure table exists (lightweight)
async function ensureTable() {
  await sql/*sql*/`
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      vendor_id TEXT NOT NULL,
      title TEXT NOT NULL,
      price INTEGER NOT NULL,
      category TEXT NOT NULL,
      image_url TEXT,
      image_data_url TEXT,
      addons JSONB DEFAULT '[]'::jsonb,
      created_at TIMESTAMPTZ DEFAULT now()
    )
  `;
}

const productSchema = z.object({
  vendorId: z.string().min(1),
  title: z.string().min(2),
  price: z.coerce.number().int().nonnegative(),
  category: z.string().min(1),
  imageUrl: z.string().optional().default(""), // can be http(s) or data:
  addons: z.array(
    z.object({
      id: z.string(),
      label: z.string(),
      price: z.coerce.number().int().nonnegative().optional(),
      max: z.coerce.number().int().nonnegative().optional(),
    })
  ).optional().default([]),
});

async function getProducts(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const vendorId = url.searchParams.get('vendorId');

  await ensureTable();

  try {
    const rows = vendorId
      ? await sql/*sql*/`SELECT * FROM products WHERE vendor_id = ${vendorId} ORDER BY created_at DESC`
      : await sql/*sql*/`SELECT * FROM products ORDER BY created_at DESC`;
    res.status(200).json({ ok: true, products: rows });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, error: String(e) });
  }
}

async function createProduct(req, res) {
  await ensureTable();

  try {
    const body = await readJson(req);
    const p = productSchema.parse(body);

    const id = globalThis.crypto?.randomUUID?.() || Math.random().toString(36).slice(2);

    const isDataUrl = (p.imageUrl || "").startsWith("data:");
    const image_url = isDataUrl ? null : (p.imageUrl || null);
    const image_data_url = isDataUrl ? p.imageUrl : null;

    await sql/*sql*/`
      INSERT INTO products (id, vendor_id, title, price, category, image_url, image_data_url, addons)
      VALUES (${id}, ${p.vendorId}, ${p.title}, ${p.price}, ${p.category}, ${image_url}, ${image_data_url}, ${JSON.stringify(p.addons)})
    `;

    res.status(201).json({
      ok: true,
      product: {
        id,
        vendor_id: p.vendorId,
        title: p.title,
        price: p.price,
        category: p.category,
        image_url,
        image_data_url,
        addons: p.addons,
      }
    });
  } catch (e) {
    console.error(e);
    res.status(400).json({ ok: false, error: String(e) });
  }
}

async function handler(req, res) {
  if (req.method === 'GET') return getProducts(req, res);
  if (req.method === 'POST') return createProduct(req, res);
  res.status(405).json({ ok: false, error: 'Use GET or POST' });
}

export default withCors(handler, {
  methods: ["GET", "POST", "OPTIONS"],
});