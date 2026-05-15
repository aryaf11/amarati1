/**
 * جسر HTTP بين Next.js وخادم استدلال Colab (scripts/maintenance_ml_server.py).
 *
 * اضبط في .env أو .env.local:
 *   MAINTENANCE_ML_API_URL=http://localhost:8080/predict
 *
 * العقد: POST { description, city, buildingId? }
 *         → { summary?, suggestions?, tags?, companies?: { company, rating }[] }
 */

export type MaintenanceCompanyRec = { company: string; rating: number };

export type ExternalMlMaintenanceResult = {
  summary?: string;
  suggestions?: string;
  tags?: string[];
  companies?: MaintenanceCompanyRec[];
};

export function maintenanceMlApiUrl(): string | null {
  const url = process.env.MAINTENANCE_ML_API_URL?.trim();
  return url || null;
}

export function maintenanceMlHealthUrl(): string | null {
  const predict = maintenanceMlApiUrl();
  if (!predict) return null;
  try {
    const u = new URL(predict);
    u.pathname = u.pathname.replace(/\/predict\/?$/, "") + "/health";
    u.search = "";
    return u.toString();
  } catch {
    return null;
  }
}

/** هل مُعرَّف رابط الاستدلال في البيئة؟ */
export function isMaintenanceMlConfigured(): boolean {
  return Boolean(maintenanceMlApiUrl());
}

/** فحص اتصال خادم ML (للواجهة أو /api/ml/health). */
export async function isMaintenanceMlReachable(): Promise<boolean> {
  const healthUrl = maintenanceMlHealthUrl();
  if (!healthUrl) return false;
  try {
    const res = await fetch(healthUrl, {
      method: "GET",
      signal: AbortSignal.timeout(4_000),
      cache: "no-store",
    });
    if (!res.ok) return false;
    const data = (await res.json()) as { ok?: boolean };
    return data.ok === true;
  } catch {
    return false;
  }
}

function parseCompanies(raw: unknown): MaintenanceCompanyRec[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const out: MaintenanceCompanyRec[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    const company = typeof o.company === "string" ? o.company.trim() : "";
    const rating = typeof o.rating === "number" ? o.rating : Number(o.rating);
    if (company && Number.isFinite(rating)) {
      out.push({ company, rating });
    }
  }
  return out.length ? out : undefined;
}

/** يستدعي خادم RandomForest عند وجود MAINTENANCE_ML_API_URL — وإلا null (يُستخدم المنطق المحلي). */
export async function fetchExternalMaintenanceMl(input: {
  description: string;
  city: string;
  buildingId?: string;
}): Promise<ExternalMlMaintenanceResult | null> {
  const url = maintenanceMlApiUrl();
  if (!url) return null;
  try {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    const key = process.env.MAINTENANCE_ML_API_KEY?.trim();
    if (key) headers.Authorization = `Bearer ${key}`;

    const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({
        description: input.description,
        city: input.city,
        buildingId: input.buildingId,
      }),
      signal: AbortSignal.timeout(15_000),
      cache: "no-store",
    });
    if (!res.ok) {
      console.warn("[Amarati ML] predict HTTP", res.status);
      return null;
    }
    const data = (await res.json()) as unknown;
    if (!data || typeof data !== "object") return null;
    const o = data as Record<string, unknown>;
    return {
      summary: typeof o.summary === "string" ? o.summary : undefined,
      suggestions: typeof o.suggestions === "string" ? o.suggestions : undefined,
      tags: Array.isArray(o.tags)
        ? o.tags.filter((t): t is string => typeof t === "string")
        : undefined,
      companies: parseCompanies(o.companies),
    };
  } catch (e) {
    console.warn("[Amarati ML] predict failed", e);
    return null;
  }
}
