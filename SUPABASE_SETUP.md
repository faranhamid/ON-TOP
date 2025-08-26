## Supabase setup (use Supabase as backend storage)

Follow these steps to run the existing API on Supabase (Postgres-compatible):

1) Create a Supabase project
- Go to `https://app.supabase.com` → New project
- Copy your database connection info (Project settings → Database → Connection info)

2) Configure environment variables (.env)
- Required API vars:
  - `OPENAI_API_KEY=...` (if using Emma/finance endpoints)
  - `STRIPE_SECRET_KEY=...` and `STRIPE_WEBHOOK_SECRET=...` (if using paywall)
  - `JWT_SECRET=your_long_random_secret`
- Enable Postgres provider:
  - `DATABASE_PROVIDER=pg`
  - EITHER set `DATABASE_URL=` to the Supabase connection string
    - Example: `DATABASE_URL=postgres://USER:PASSWORD@HOST:5432/postgres?sslmode=require`
  - OR set individual vars:
    - `DB_HOST=YOUR_PROJECT.supabase.co`
    - `DB_NAME=postgres`
    - `DB_USER=postgres` (or the user shown in Connection info)
    - `DB_PASSWORD=...`
    - `DB_PORT=5432`
    - `DB_SSL=true` (forces SSL on all environments)
- Optional:
  - `PORT=3002` (default)
  - `NODE_ENV=production` in deployed environments

3) Install dependencies and start the server
```bash
npm install
npm run dev
# or
npm start
```

4) First run auto-creates tables
- The server auto-initializes all required tables on startup (CREATE TABLE IF NOT EXISTS)

5) Point the frontend to your API host
- Local: `http://localhost:3002`
- Production: set your real API base URL in `www/app.js`, `www/paywall.html`, and `www/auth-manager.js` (replace the placeholder `https://ontop-api.yourdomain.com`).

Notes
- You are still using this app’s JWT/Auth; swapping to Supabase Auth is optional and can be done later.
- If you use Supabase Storage, we can replace the current Google Cloud Storage calls in `database-cloud.js` in a follow-up.

### Supabase Storage

1) Create buckets
- Storage → New bucket `uploads` (Private)
- Storage → New bucket `backups` (Private)

2) Env vars
```bash
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
SUPABASE_UPLOADS_BUCKET=uploads
SUPABASE_BACKUPS_BUCKET=backups
```

3) How it works
- When the above env vars are set, the backend will use Supabase Storage for:
  - `uploadFile(userId, fileName, buffer, contentType)` → stores under `uploads/users/{userId}/{fileName}` and returns a 7‑day signed URL
  - `deleteFile(userId, fileName)` → removes the object
  - `createBackup(userId)` → writes JSON to `backups/user-backups/backup-{userId}-{timestamp}.json`

4) Client-side uploads (optional)
- If you want the browser/mobile app to upload directly to Supabase Storage, create RLS policies on `storage.objects` to restrict to paths like `uploads/users/{auth.uid()}/*`. Otherwise, upload via the backend using the Service Role key.

