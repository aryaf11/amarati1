import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/** تشخيص اتصال القاعدة وأعمدة Building (لا يتطلب تسجيل دخول). */
export async function GET() {
  try {
    await prisma.$queryRaw`SELECT "region", "district", "postalCode" FROM "Building" LIMIT 1`;
    return NextResponse.json({ ok: true, buildingColumns: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
