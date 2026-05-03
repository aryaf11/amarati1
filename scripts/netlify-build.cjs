/**
 * Netlify production build: migrate → generate → next build.
 * DATABASE_URL must be set (Neon) in Netlify env or imported via `npm run netlify:env-import`.
 */
require("dotenv").config();

const { execSync } = require("node:child_process");

function run(cmd) {
  execSync(cmd, { stdio: "inherit", env: process.env });
}

const db = process.env.DATABASE_URL && String(process.env.DATABASE_URL).trim();
if (!db) {
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

run("npx prisma migrate deploy");
run("npx prisma generate");
run("npx next build");
