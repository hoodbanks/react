// api/auth/vendor-signup.js
import { sql } from '../_db.js';
import { withCors, readJson } from '../_cors.js';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { signVendorJWT, makeSessionCookie } from './_jwt.js';

const schema = z.object({
  email: z.string().email(),
  name: z.string().min(2),
  vendorType: z.enum(['Restaurant','Shops','Pharmacy']),
  password: z.string().min(6),
});

async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ ok:false, message:'POST only' });
  try {
    const body = schema.parse(await readJson(req));

    const exists = await sql`SELECT 1 FROM vendors WHERE email = ${body.email} LIMIT 1`;
    if (exists.length) return res.status(409).json({ ok:false, error:'Email already registered' });

    const hash = await bcrypt.hash(body.password, 10);
    const rows = await sql`
      INSERT INTO vendors (email, name, vendor_type, password_hash)
      VALUES (${body.email}, ${body.name}, ${body.vendorType}, ${hash})
      RETURNING id, email, name, vendor_type, created_at
    `;
    const vendor = rows[0];

    const token = signVendorJWT(vendor);
    res.setHeader('Set-Cookie', makeSessionCookie(token, req));
    res.status(201).json({ ok:true, vendor });
  } catch (e) {
    console.error(e);
    res.status(400).json({ ok:false, error:String(e) });
  }
}
export default withCors(handler);