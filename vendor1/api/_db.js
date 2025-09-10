// /api/_db.js
import { neon } from '@neondatabase/serverless';

// Use your pooled URL from Neon (or POSTGRES_URL on Vercel)
const url = process.env.POSTGRES_URL || process.env.DATABASE_URL || "";
if (!url) {
  console.warn("⚠️ POSTGRES_URL / DATABASE_URL is missing");
}

export const sql = neon(url);