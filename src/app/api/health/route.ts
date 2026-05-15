import { NextResponse } from "next/server";

/** للتحقق من أن نشر Vercel يشغّل Next.js (افتح /api/health) */
export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "amarati-next",
  });
}
