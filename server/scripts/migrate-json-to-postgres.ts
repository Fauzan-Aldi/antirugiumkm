import 'dotenv/config';
import fs from 'fs/promises';
import path from 'path';
import {db} from '../db';

type JsonDb = {
  users: Array<{
    id: string;
    email: string;
    password: {salt: string; hash: string; iterations: number};
    displayName: string;
    storeName: string;
    createdAt: string;
    subscriptionExpiresAt: string;
    isAdmin?: boolean;
  }>;
  sessions: Array<{
    token: string;
    userId: string;
    expiresAt: string;
    createdAt: string;
  }>;
  menuItems: Array<{
    id: string;
    userId: string;
    name: string;
    price: number;
    image?: string;
    category: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
  }>;
  sales: Array<{
    id: string;
    userId: string;
    createdAt: string;
    items: Array<{
      id: string;
      name: string;
      price: number;
      quantity: number;
      category: string;
    }>;
    subtotal: number;
    tax: number;
    total: number;
    paymentMethod: 'tunai' | 'transfer';
  }>;
};

async function main() {
  const filePath = path.join(process.cwd(), 'server', 'data', 'db.json');
  const raw = await fs.readFile(filePath, 'utf-8');
  const data = JSON.parse(raw) as JsonDb;

  const client = await db.connect();
  try {
    await client.query('begin');

    for (const u of data.users) {
      await client.query(
        `insert into users
         (id, email, password_salt, password_hash, password_iterations, display_name, store_name, created_at, subscription_expires_at, is_admin)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
         on conflict (id) do update set
           email = excluded.email,
           password_salt = excluded.password_salt,
           password_hash = excluded.password_hash,
           password_iterations = excluded.password_iterations,
           display_name = excluded.display_name,
           store_name = excluded.store_name,
           subscription_expires_at = excluded.subscription_expires_at,
           is_admin = excluded.is_admin`,
        [
          u.id,
          u.email,
          u.password.salt,
          u.password.hash,
          u.password.iterations,
          u.displayName,
          u.storeName,
          u.createdAt,
          u.subscriptionExpiresAt,
          Boolean(u.isAdmin),
        ],
      );
    }

    for (const s of data.sessions) {
      await client.query(
        `insert into sessions (token, user_id, expires_at, created_at)
         values ($1,$2,$3,$4)
         on conflict (token) do update set
           user_id = excluded.user_id,
           expires_at = excluded.expires_at`,
        [s.token, s.userId, s.expiresAt, s.createdAt],
      );
    }

    for (const m of data.menuItems) {
      await client.query(
        `insert into menu_items
         (id, user_id, name, price, image, category, is_active, created_at, updated_at)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9)
         on conflict (id) do update set
           user_id = excluded.user_id,
           name = excluded.name,
           price = excluded.price,
           image = excluded.image,
           category = excluded.category,
           is_active = excluded.is_active,
           updated_at = excluded.updated_at`,
        [m.id, m.userId, m.name, m.price, m.image ?? null, m.category, m.isActive, m.createdAt, m.updatedAt],
      );
    }

    for (const s of data.sales) {
      await client.query(
        `insert into sales
         (id, user_id, created_at, items, subtotal, tax, total, payment_method)
         values ($1,$2,$3,$4::jsonb,$5,$6,$7,$8)
         on conflict (id) do update set
           user_id = excluded.user_id,
           created_at = excluded.created_at,
           items = excluded.items,
           subtotal = excluded.subtotal,
           tax = excluded.tax,
           total = excluded.total,
           payment_method = excluded.payment_method`,
        [s.id, s.userId, s.createdAt, JSON.stringify(s.items), s.subtotal, s.tax, s.total, s.paymentMethod],
      );
    }

    await client.query('commit');
    console.log('Migration complete.');
    console.log(`Users: ${data.users.length}`);
    console.log(`Sessions: ${data.sessions.length}`);
    console.log(`Menu items: ${data.menuItems.length}`);
    console.log(`Sales: ${data.sales.length}`);
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    client.release();
    await db.end();
  }
}

main().catch((error) => {
  console.error('Migration failed:', error);
  process.exit(1);
});

