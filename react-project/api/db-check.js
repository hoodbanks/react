// api/db-check.js
import { sql } from './_db.js';
import { withCors } from './_cors.js';

async function handler(req, res) {
  try {
    const rows = await sql`SELECT now() as now`;
    res.status(200).json({ ok: true, now: rows[0].now });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e) });
  }
}
export default withCors(handler);