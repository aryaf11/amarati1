/**
 * ربط نموذج الصيانة/التوصيات مع دفتر Colab والتطبيق:
 *
 * - تدريب وتجربة في Colab:
 *   https://colab.research.google.com/drive/1BFWwkmam1MXkW5FBLrQR77OiDleyKLMy
 * - Next.js لا يتصل بـ Colab مباشرة؛ انشر الاستدلال كـ HTTP (Cloud Run، Railway، إلخ)
 *   أو جرّب محلياً: `python scripts/maintenance_ml_server.py` (أو `colab_ml_serve_example.py`)
 * - ثم اضبط `MAINTENANCE_ML_API_URL` (واختياريًا `MAINTENANCE_ML_API_KEY`).
 *
 * العقد: POST JSON { description, city, buildingId? }
 *         → JSON { summary?, suggestions?, tags? }
 */
export type ExternalMlMaintenanceResult = {
  summary?: string;
  suggestions?: string;
  tags?: string[];
};

/** يستدعي خدمة الاستدلال إن وُجدت `MAINTENANCE_ML_API_URL`. */
export async function fetchExternalMaintenanceMl(input: {
  description: string;
  city: string;
  buildingId?: string;
}): Promise<ExternalMlMaintenanceResult | null> {
  const url = process.env.MAINTENANCE_ML_API_URL?.trim();
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
      signal: AbortSignal.timeout(12_000),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as unknown;
    if (!data || typeof data !== "object") return null;
    const o = data as Record<string, unknown>;
    return {
      summary: typeof o.summary === "string" ? o.summary : undefined,
      suggestions: typeof o.suggestions === "string" ? o.suggestions : undefined,
      tags: Array.isArray(o.tags) ? o.tags.filter((t): t is string => typeof t === "string") : undefined,
    };
  } catch {
    return null;
  }
}
