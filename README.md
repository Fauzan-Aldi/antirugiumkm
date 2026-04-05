<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>
hh
# Anti Rugi (Supabase Ready)

Backend now uses PostgreSQL (Supabase) instead of local JSON file.

## 1) Create Supabase schema (migration)

Open your Supabase project, then run SQL from:

- `server/migrations/001_init.sql`

This creates tables: `users`, `sessions`, `menu_items`, `sales`.

## 2) Configure environment

Create `.env` (or `.env.local`) in project root:

```env
DATABASE_URL=postgresql://postgres.<project-ref>:<password>@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
GEMINI_API_KEY=your_key_if_needed
APP_URL=http://localhost:3000
```

## 3) Install dependencies

```bashss
npm install
```

## 4) Migrate existing JSON data (optional, recommended)

If you already have data in `server/data/db.json`:

```bash
npm run migrate:data
```

## 5) Run app (frontend + backend)

Terminal 1:

```bash
npm run dev:server
```

Terminal 2:

```bash
npm run dev
```

## 6) Access app

- Frontend: `http://localhost:3000`
- Owner login: `http://localhost:3000/owner-login`

Owner credential default:

- Username: `owner`
- Password: `ownerantirugi2026`
