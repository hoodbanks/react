// api/_db.js
import { neon } from '@neondatabase/serverless';

// Make sure POSTGRES_URL is set in this Vercel project (users app)
export const sql = neon(process.env.POSTGRES_URL);