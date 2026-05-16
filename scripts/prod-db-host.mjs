import dotenv from "dotenv";
import { URL } from "node:url";

dotenv.config({ path: ".env.vercel.production", override: true });
for (const key of ["DATABASE_URL", "DIRECT_URL"]) {
  const v = process.env[key];
  if (!v) {
    console.log(key, "(missing)");
    continue;
  }
  try {
    const u = new URL(v.replace(/^postgres:/, "postgresql:"));
    console.log(key, "host:", u.hostname, "port:", u.port || "5432");
  } catch {
    console.log(key, "(invalid url)");
  }
}
