// api/auth/vendor-logout.js
import { withCors } from '../_cors.js';
import { clearSessionCookie } from './_jwt.js';

async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ ok:false, message:'POST only' });
  res.setHeader('Set-Cookie', clearSessionCookie(req));
  res.status(200).json({ ok:true });
}
export default withCors(handler);