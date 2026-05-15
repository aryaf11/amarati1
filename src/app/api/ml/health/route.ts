import { NextResponse } from "next/server";
import {
  isMaintenanceMlConfigured,
  isMaintenanceMlReachable,
  maintenanceMlApiUrl,
} from "@/lib/ml-inference";

/** GET — حالة ربط نموذج Colab (للتشخيص وللواجهة). */
export async function GET() {
  const configured = isMaintenanceMlConfigured();
  const reachable = configured ? await isMaintenanceMlReachable() : false;
  return NextResponse.json({
    configured,
    reachable,
    predictUrl: configured ? maintenanceMlApiUrl() : null,
  });
}
