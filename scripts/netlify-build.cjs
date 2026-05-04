/**
 * Netlify production build: migrate → generate → next build.
 * DATABASE_URL must be set (Neon) in Netlify env or imported via `npm run netlify:env-import`.
 */
require("dotenv").config();

const { execSync } = require("node:child_process");

function run(cmd, opts = {}) {
  execSync(cmd, { stdio: "inherit", env: process.env, ...opts });
}

const dbPooled = process.env.DATABASE_URL && String(process.env.DATABASE_URL).trim();
const dbDirect = process.env.DIRECT_URL && String(process.env.DIRECT_URL).trim();
if (!dbPooled) {
  console.error(`
[Netlify build] DATABASE_URL is not set.

Add it in the dashboard:
  Site configuration → Environment variables → DATABASE_URL (your Neon connection string)

Or from this machine (after: npx netlify login && npx netlify link):
  npm run netlify:env-import
`);
  process.exit(1);
}

if (!process.env.AUTH_SECRET || String(process.env.AUTH_SECRET).length < 16) {
  console.warn(
    "[Netlify build] Warning: AUTH_SECRET missing or shorter than 16 chars — set it in Environment variables for login/session to work."
  );
}

// الهجرات تحتاج اتصالاً مباشراً على Neon؛ التشغيل يمكنه استخدام pooler في DATABASE_URL
const migrateEnv = { ...process.env, DATABASE_URL: dbDirect || dbPooled };
run("npx prisma migrate deploy", { env: migrateEnv });
run("npx prisma generate");
run("npx next build");
