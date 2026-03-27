import {Pool} from 'pg';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error('DATABASE_URL is required. Set it in your environment or .env file.');
}

export const db = new Pool({
  connectionString: DATABASE_URL,
  ssl: DATABASE_URL.includes('supabase.co') ? {rejectUnauthorized: false} : false,
});

export async function query<T>(text: string, params: unknown[] = []) {
  const result = await db.query<T>(text, params);
  return result;
}

