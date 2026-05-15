"use server";

/**
 * إجراءات «لوحة المشرف» — تستدعي `supervisorMonthlyScore` في lib/ai-maintenance.ts
 * الذي يكتب في جدول Prisma `BuildingHealthScore` (لا تنبيهات تنبؤية منفصلة).
 */
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { supervisorMonthlyScore } from "@/lib/ai-maintenance";
import { getCurrentUser } from "@/lib/current-user";
import { getMembership } from "@/lib/access";

export async function supervisorRefreshInsightsAction(formData: FormData) {
  const user = await getCurrentUser();
  const buildingId = String(formData.get("buildingId") ?? "");
  if (!user) redirect("/login");
  const m = await getMembership(user.id, buildingId);
  if (!m?.isSupervisor) {
    redirect(`/building/${buildingId}/supervisor?error=` + encodeURIComponent("للمشرف فقط"));
  }
  await supervisorMonthlyScore(buildingId);
  revalidatePath(`/building/${buildingId}/supervisor`);
  revalidatePath(`/building/${buildingId}`);
  redirect(`/building/${buildingId}/supervisor`);
}
