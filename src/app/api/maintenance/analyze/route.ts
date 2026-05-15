import { NextResponse } from "next/server";
import { analyzeMaintenance } from "@/lib/ai-maintenance";
import { getCurrentUser } from "@/lib/current-user";
import {
  isMaintenanceMlConfigured,
  isMaintenanceMlReachable,
} from "@/lib/ml-inference";

/**
 * POST JSON { description, city, buildingId? }
 * → نفس نتيجة طلب الصيانة (محلي + خادم ML إن وُجد).
 * يتطلب جلسة تسجيل دخول (كوكي amarati_session).
 */
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const o = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  const description = String(o.description ?? "").trim();
  const city = String(o.city ?? "").trim();
  const buildingId =
    typeof o.buildingId === "string" ? o.buildingId.trim() : undefined;
  if (!description || description.length < 3) {
    return NextResponse.json({ error: "description required" }, { status: 400 });
  }
  const result = await analyzeMaintenance({
    description,
    city: city || "مكة",
    buildingId: buildingId || undefined,
  });
  const mlConfigured = isMaintenanceMlConfigured();
  const mlReachable = mlConfigured ? await isMaintenanceMlReachable() : false;
  return NextResponse.json({
    ...result,
    ml: { configured: mlConfigured, reachable: mlReachable },
  });
}
