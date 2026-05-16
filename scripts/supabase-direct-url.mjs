/** يبني رابط Supabase المباشر للهجرات من DATABASE_URL */
export function supabaseDirectUrl(databaseUrl) {
  if (!databaseUrl) return databaseUrl;
  try {
    const u = new URL(databaseUrl.replace(/^postgres:/, "postgresql:"));
    let ref = u.username;
    if (ref.startsWith("postgres.")) ref = ref.slice("postgres.".length);
    if (!ref || ref === "postgres") {
      const m = u.hostname.match(/^db\.([^.]+)\.supabase\.co$/);
      if (m) ref = m[1];
    }
    if (ref && ref !== "postgres") {
      u.hostname = `db.${ref}.supabase.co`;
      u.port = "5432";
      u.username = "postgres";
    } else {
      u.hostname = u.hostname.replace(".pooler.supabase.com", ".supabase.co");
      u.port = "5432";
    }
    u.searchParams.delete("pgbouncer");
    return u.toString().replace(/^postgresql:/, "postgres:");
  } catch {
    return databaseUrl
      .replace(".pooler.supabase.com", ".supabase.co")
      .replace(":6543/", ":5432/");
  }
}
