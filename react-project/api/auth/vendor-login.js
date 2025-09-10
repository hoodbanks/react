// api/auth/vendor-login.js
import { sql } from '../_db.js';
import { withCors, readJson } from '../_cors.js';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { signVendorJWT, makeSessionCookie } from './_jwt.js';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ ok:false, message:'POST only' });
  try {
    const { email, password } = schema.parse(await readJson(req));
    const rows = await sql`SELECT * FROM vendors WHERE email = ${email} LIMIT 1`;
    if (!rows.length) return res.status(401).json({ ok:false, error:'Invalid credentials' });

    const v = rows[0];
    const ok = await bcrypt.compare(password, v.password_hash);
    if (!ok) return res.status(401).json({ ok:false, error:'Invalid credentials' });

    const vendor = { id:v.id, email:v.email, name:v.name, vendor_type:v.vendor_type, created_at:v.created_at };
    const token = signVendorJWT(vendor);
    res.setHeader('Set-Cookie', makeSessionCookie(token, req));
    res.status(200).json({ ok:true, vendor });
  } catch (e) {
    console.error(e);
    res.status(400).json({ ok:false, error:String(e) });
  }
}
export default withCors(handler);