/**
 * Netlify production build: migrate → generate → next build.
 * DATABASE_URL must be set for migrate. See netlify.toml comments.
 */
require("dotenv").config();

const { execSync } = require("node:child_process");

function run(cmd, opts = {}) {
  execSync(cmd, { stdio: "inherit", env: process.env, ...opts });
}

function normalizeConnectionString(raw) {
  if (raw == null) return "";
  let s = String(raw).trim();
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    s = s.slice(1, -1).trim();
  }
  return s;
}

const useFirebase =
  Boolean(process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim()) ||
  (Boolean(process.env.FIREBASE_PROJECT_ID?.trim()) &&
    Boolean(process.env.FIREBASE_CLIENT_EMAIL?.trim()) &&
    Boolean(process.env.FIREBASE_PRIVATE_KEY?.trim()));

const dbPooled = normalizeConnectionString(process.env.DATABASE_URL);
const dbDirect = normalizeConnectionString(process.env.DIRECT_URL);

const onNetlify =
  process.env.NETLIFY === "true" || Boolean(process.env.NETLIFY_BUILD_HOOK) || Boolean(process.env.DEPLOY_URL);
const buildWithoutDb =
  normalizeConnectionString(process.env.NETLIFY_BUILD_NO_DATABASE)?.toLowerCase() === "true" ||
  normalizeConnectionString(process.env.AMARATI_NETLIFY_BUILD_NO_DATABASE)?.toLowerCase() === "true";

if (useFirebase) {
  console.log("[Netlify build] Firebase mode — skipping prisma migrate deploy");
  run("npx next build");
  process.exit(0);
}

if (!dbPooled) {
  if (onNetlify && buildWithoutDb) {
    console.warn(`
[Netlify build] DATABASE_URL غير مضبوط ولكن NETLIFY_BUILD_NO_DATABASE=true
  ← لن يُشغَّل prisma migrate deploy في البناء.

  ⚠ تأكد أن DATABASE_URL مضبوط لنطاق التشغيل (Functions/Runtime) وإلا الموقع لن يتصل بقاعدة البيانات.
  ⚠ نفّذ الهجرات يدوياً من جهازك ضد قاعدة البيانات:
       npx prisma migrate deploy
`);
    run("npx prisma generate");
    run("npx next build");
    process.exit(0);
  }

  console.error(`
[Netlify build] DATABASE_URL is not set.

— في لوحة Netlify → Environment variables:
  • أضِف متغيراً اسمه DATABASE_URL بالضبط.
  • إنفعّل "Contains secret values" واختَر كل النطاقات التي تشمل عملية البناء (Build / Site builds)
    وليس تشغيل الموقع فقط (Runtime)— وإلا لن ترى المتغير أثناء npm run build:netlify.
  • مع خيار "Different value..." الصق سلسلة DATABASE_URL في خانة Production على الأقل.

— أو من هذا الجهاز (بعد ربط المشروع بـ Netlify CLI):
    npx netlify login && npx netlify link && npm run netlify:env-import

— لو تعذّر ضبط السر وقت البناء لا تزال بحاجة لقاعدة البيانات، يمكن تجاوز هذا الفحص بتعريف متغّر غير سريّ:
    NETLIFY_BUILD_NO_DATABASE=true
  ثم تشغيل migrate يدوياً كما هو موضَّح بالتحذير أعلاه.
`);
  process.exit(1);
}

if (!process.env.AUTH_SECRET || String(process.env.AUTH_SECRET).length < 16) {
  console.warn(
    "[Netlify build] Warning: AUTH_SECRET missing or shorter than 16 chars — set it in Environment variables for login/session to work."
  );
}

// للهجرات يُفضّل DIRECT_URL إن وُجد؛ وإلا يُستخدم DATABASE_URL
process.env.DATABASE_URL = dbPooled;
const migrateEnv = { ...process.env, DATABASE_URL: dbDirect || dbPooled };
run("npx prisma migrate deploy", { env: migrateEnv });
run("npx prisma generate");
run("npx next build");
