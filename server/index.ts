import express from 'express';
import type {Request, Response, NextFunction} from 'express';
import crypto from 'crypto';
import 'dotenv/config';
import {query} from './db';

const PORT = Number(process.env.PORT ?? 4000);

type SaleItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  category: string;
};

function nowIso() {
  return new Date().toISOString();
}

function randomId(prefix: string) {
  return `${prefix}_${crypto.randomBytes(8).toString('hex')}_${Date.now().toString(16)}`;
}

function validateEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function pbkdf2Hash(password: string, salt: string, iterations: number) {
  return crypto.pbkdf2Sync(password, salt, iterations, 64, 'sha512').toString('hex');
}

function getBearerToken(req: Request) {
  const auth = req.headers.authorization;
  if (!auth) return null;
  const [type, token] = auth.split(' ');
  if (type !== 'Bearer' || !token) return null;
  return token;
}

function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = getBearerToken(req);
  if (!token) return res.status(401).json({message: 'Unauthorized'});

  query<{user_id: string; expires_at: string}>(
    'select user_id, expires_at from sessions where token = $1 limit 1',
    [token],
  )
    .then((result) => {
      const session = result.rows[0];
      if (!session) return res.status(401).json({message: 'Unauthorized'});
      if (new Date(session.expires_at).getTime() <= Date.now()) return res.status(401).json({message: 'Session expired'});
      (req as any).userId = session.user_id;
      next();
    })
    .catch(() => res.status(500).json({message: 'Server error'}));
}

const app = express();
app.use(express.json());

app.get('/health', (_req, res) => res.json({ok: true}));

// Auth
app.post('/api/auth/register', async (req, res) => {
  const {email, password, fullName} = req.body as {email?: string; password?: string; fullName?: string};
  const storeName = 'Anti Rugi';

  if (!email || !password || !validateEmail(email) || typeof password !== 'string' || password.length < 6) {
    return res.status(400).json({message: 'Invalid email/password'});
  }
  const displayName = typeof fullName === 'string' ? fullName.trim() : 'Kasir';
  if (!displayName) return res.status(400).json({message: 'Full name required'});

  const salt = crypto.randomBytes(16).toString('hex');
  const iterations = 120_000;
  const passwordHash = pbkdf2Hash(password, salt, iterations);

  try {
    const existing = await query<{id: string}>('select id from users where lower(email) = lower($1) limit 1', [email]);
    if (existing.rowCount) return res.status(409).json({message: 'Email already registered'});

    const userCount = await query<{count: string}>('select count(*)::text as count from users');
    const isFirstUser = Number(userCount.rows[0]?.count ?? '0') === 0;
    const isAdmin = isFirstUser || email.toLowerCase() === 'admin@antirugi.com';

    const userId = randomId('u');
    const subscriptionExpiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 3).toISOString();

    await query(
      `insert into users
      (id, email, password_salt, password_hash, password_iterations, display_name, store_name, created_at, subscription_expires_at, is_admin)
      values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [userId, email, salt, passwordHash, iterations, displayName, storeName, nowIso(), subscriptionExpiresAt, isAdmin],
    );

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString();
    await query('insert into sessions (token, user_id, expires_at, created_at) values ($1,$2,$3,$4)', [
      token,
      userId,
      expiresAt,
      nowIso(),
    ]);

    return res.json({
      token,
      account: {displayName, storeName, subscriptionExpiresAt, isAdmin},
    });
  } catch {
    return res.status(500).json({message: 'Server error'});
  }
});

app.post('/api/auth/login', async (req, res) => {
  const {email, password} = req.body as {email?: string; password?: string};
  if (!email || !password || typeof password !== 'string' || !validateEmail(email)) {
    return res.status(400).json({message: 'Invalid email/password'});
  }

  try {
    const userRes = await query<{
      id: string;
      password_salt: string;
      password_hash: string;
      password_iterations: number;
      display_name: string;
      store_name: string;
      subscription_expires_at: string;
      is_admin: boolean;
    }>(
      `select id, password_salt, password_hash, password_iterations, display_name, store_name, subscription_expires_at, is_admin
       from users where lower(email) = lower($1) limit 1`,
      [email],
    );
    const user = userRes.rows[0];
    if (!user) return res.status(401).json({message: 'Invalid credentials'});

    const passwordHash = pbkdf2Hash(password, user.password_salt, user.password_iterations);
    if (passwordHash !== user.password_hash) return res.status(401).json({message: 'Invalid credentials'});

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString();

    await query('insert into sessions (token, user_id, expires_at, created_at) values ($1,$2,$3,$4)', [
      token,
      user.id,
      expiresAt,
      nowIso(),
    ]);

    return res.json({
      token,
      account: {
        displayName: user.display_name,
        storeName: user.store_name,
        subscriptionExpiresAt: user.subscription_expires_at,
        isAdmin: Boolean(user.is_admin),
      },
    });
  } catch {
    return res.status(500).json({message: 'Server error'});
  }
});

app.get('/api/me', requireAuth, async (req, res) => {
  const userId = (req as any).userId as string;
  try {
    const userRes = await query<{
      display_name: string;
      store_name: string;
      subscription_expires_at: string;
      is_admin: boolean;
    }>('select display_name, store_name, subscription_expires_at, is_admin from users where id = $1 limit 1', [userId]);
    const user = userRes.rows[0];
    if (!user) return res.status(404).json({message: 'User not found'});
    return res.json({
      displayName: user.display_name,
      storeName: user.store_name,
      subscriptionExpiresAt: user.subscription_expires_at,
      isAdmin: Boolean(user.is_admin),
    });
  } catch {
    return res.status(500).json({message: 'Server error'});
  }
});

// POS
app.get('/api/pos/menu', requireAuth, async (req, res) => {
  const userId = (req as any).userId as string;
  const itemsRes = await query<{
    id: string;
    user_id: string;
    name: string;
    price: string;
    image: string | null;
    category: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
  }>(
    `select id, user_id, name, price::text, image, category, is_active, created_at, updated_at
     from menu_items where user_id = $1 order by created_at asc`,
    [userId],
  );
  const items = itemsRes.rows.map((r) => ({
    id: r.id,
    userId: r.user_id,
    name: r.name,
    price: Number(r.price),
    image: r.image ?? undefined,
    category: r.category,
    isActive: r.is_active,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }));
  return res.json({items});
});

app.post('/api/pos/menu/upsert', requireAuth, async (req, res) => {
  const userId = (req as any).userId as string;
  const body = req.body as {
    id?: string;
    name: string;
    price: number;
    image?: string;
    category: string;
    isActive: boolean;
  };
  if (!body.name || !Number.isFinite(body.price)) return res.status(400).json({message: 'Invalid payload'});

  const menuId = body.id ?? randomId('m');
  const menuNow = nowIso();
  const name = body.name.trim();
  const price = Math.max(0, Number(body.price));
  const image = body.image?.trim() || null;
  const category = body.category?.trim() || 'Lainnya';
  const isActive = Boolean(body.isActive);

  const existing = await query<{id: string}>('select id from menu_items where id = $1 and user_id = $2 limit 1', [menuId, userId]);
  if (existing.rowCount) {
    await query(
      `update menu_items
       set name = $1, price = $2, image = $3, category = $4, is_active = $5, updated_at = $6
       where id = $7 and user_id = $8`,
      [name, price, image, category, isActive, menuNow, menuId, userId],
    );
  } else {
    await query(
      `insert into menu_items
       (id, user_id, name, price, image, category, is_active, created_at, updated_at)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [menuId, userId, name, price, image, category, isActive, menuNow, menuNow],
    );
  }

  return res.json({
    item: {
      id: menuId,
      userId,
      name,
      price,
      image: image ?? undefined,
      category,
      isActive,
      createdAt: menuNow,
      updatedAt: menuNow,
    },
  });
});

app.delete('/api/pos/menu/:id', requireAuth, async (req, res) => {
  const userId = (req as any).userId as string;
  const id = req.params.id;
  await query('delete from menu_items where id = $1 and user_id = $2', [id, userId]);
  return res.json({ok: true});
});

app.get('/api/pos/sales', requireAuth, async (req, res) => {
  const userId = (req as any).userId as string;
  const salesRes = await query<{
    id: string;
    user_id: string;
    created_at: string;
    items: SaleItem[];
    subtotal: string;
    tax: string;
    total: string;
    payment_method: 'tunai' | 'transfer';
  }>(
    `select id, user_id, created_at, items, subtotal::text, tax::text, total::text, payment_method
     from sales where user_id = $1 order by created_at desc`,
    [userId],
  );
  const sales = salesRes.rows.map((r) => ({
    id: r.id,
    userId: r.user_id,
    createdAt: r.created_at,
    items: r.items,
    subtotal: Number(r.subtotal),
    tax: Number(r.tax),
    total: Number(r.total),
    paymentMethod: r.payment_method,
  }));
  return res.json({sales});
});

app.post('/api/pos/sales', requireAuth, async (req, res) => {
  const userId = (req as any).userId as string;
  const body = req.body as {
    items: Array<{id: string; name: string; price: number; quantity: number; category: string}>;
    subtotal: number;
    tax: number;
    total: number;
    paymentMethod: 'tunai' | 'transfer';
  };
  if (!Array.isArray(body.items) || !Number.isFinite(body.subtotal)) return res.status(400).json({message: 'Invalid payload'});

  const created = {
    id: randomId('sale'),
    userId,
    createdAt: nowIso(),
    items: body.items,
    subtotal: Number(body.subtotal),
    // Tidak pakai pajak 10%: total = subtotal, tax disimpan 0
    tax: 0,
    total: Number(body.subtotal),
    paymentMethod: body.paymentMethod,
  };
  await query(
    `insert into sales (id, user_id, created_at, items, subtotal, tax, total, payment_method)
     values ($1,$2,$3,$4::jsonb,$5,$6,$7,$8)`,
    [
      created.id,
      created.userId,
      created.createdAt,
      JSON.stringify(created.items),
      created.subtotal,
      created.tax,
      created.total,
      created.paymentMethod,
    ],
  );

  return res.json({sale: created});
});

app.put('/api/pos/account', requireAuth, async (req, res) => {
  const userId = (req as any).userId as string;
  const body = req.body as {displayName?: string; storeName?: string};
  const displayName = typeof body.displayName === 'string' ? body.displayName.trim() : '';
  const storeName = typeof body.storeName === 'string' ? body.storeName.trim() : '';
  if (!displayName || !storeName) return res.status(400).json({message: 'Invalid payload'});

  const updated = await query<{
    display_name: string;
    store_name: string;
    subscription_expires_at: string;
    is_admin: boolean;
  }>(
    `update users
     set display_name = $1, store_name = $2
     where id = $3
     returning display_name, store_name, subscription_expires_at, is_admin`,
    [displayName, storeName, userId],
  );

  if (!updated.rowCount) return res.status(404).json({message: 'User not found'});
  const user = updated.rows[0];
  return res.json({
    displayName: user.display_name,
    storeName: user.store_name,
    subscriptionExpiresAt: user.subscription_expires_at,
    isAdmin: Boolean(user.is_admin),
  });
});

// Admin endpoints
app.post('/api/admin/login', async (req, res) => {
  const {username, password} = req.body;
  
  // Owner credentials (as requested: specifically for you)
  const OWNER_USERNAME = 'owner';
  const OWNER_PASSWORD = 'ownerantirugi2026';

  if (username === OWNER_USERNAME && password === OWNER_PASSWORD) {
    const token = crypto.randomBytes(32).toString('hex');
    const now = nowIso();
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(); // 1 day session

    await query('insert into sessions (token, user_id, expires_at, created_at) values ($1,$2,$3,$4)', [
      token,
      'OWNER_ID',
      expiresAt,
      now,
    ]);

    return res.json({
      token,
      account: {
        displayName: 'Owner Anti Rugi',
        storeName: 'Sistem Pusat',
        isAdmin: true
      }
    });
  }

  return res.status(401).json({message: 'Username atau Password Owner salah'});
});

app.get('/api/admin/users', requireAuth, async (req, res) => {
  const userId = (req as any).userId as string;

  const isOwner = userId === 'OWNER_ID';
  if (!isOwner) {
    const adminRes = await query<{is_admin: boolean}>('select is_admin from users where id = $1 limit 1', [userId]);
    if (!adminRes.rowCount || !adminRes.rows[0].is_admin) return res.status(403).json({message: 'Forbidden'});
  }

  const usersRes = await query<{
    id: string;
    email: string;
    display_name: string;
    store_name: string;
    subscription_expires_at: string;
    created_at: string;
  }>('select id, email, display_name, store_name, subscription_expires_at, created_at from users order by created_at desc');
  const users = usersRes.rows.map((u) => ({
    id: u.id,
    email: u.email,
    displayName: u.display_name,
    storeName: u.store_name,
    subscriptionExpiresAt: u.subscription_expires_at,
    createdAt: u.created_at,
  }));
  return res.json({users});
});

app.post('/api/admin/extend-subscription', requireAuth, async (req, res) => {
  const adminId = (req as any).userId as string;
  const {userId, days} = req.body as {userId: string; days: number};

  if (!userId || !Number.isFinite(days)) return res.status(400).json({message: 'Invalid payload'});

  const isOwner = adminId === 'OWNER_ID';
  if (!isOwner) {
    const adminRes = await query<{is_admin: boolean}>('select is_admin from users where id = $1 limit 1', [adminId]);
    if (!adminRes.rowCount || !adminRes.rows[0].is_admin) {
      return res.status(403).json({message: 'Forbidden or user not found'});
    }
  }

  const userRes = await query<{subscription_expires_at: string}>(
    'select subscription_expires_at from users where id = $1 limit 1',
    [userId],
  );
  if (!userRes.rowCount) return res.status(403).json({message: 'Forbidden or user not found'});

  const currentExpiry = new Date(userRes.rows[0].subscription_expires_at).getTime();
  const baseDate = currentExpiry > Date.now() ? currentExpiry : Date.now();
  const nextExpiry = new Date(baseDate + 1000 * 60 * 60 * 24 * days).toISOString();

  await query('update users set subscription_expires_at = $1 where id = $2', [nextExpiry, userId]);
  return res.json({ok: true, subscriptionExpiresAt: nextExpiry});
});

app.use((req, res) => {
  res.status(404).json({message: `Not found: ${req.method} ${req.path}`});
});

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`[server] listening on http://localhost:${PORT}`);
});

