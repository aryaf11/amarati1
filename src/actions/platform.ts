"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { addPredictiveAlerts, supervisorMonthlyScore } from "@/lib/ai-maintenance";
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
  await addPredictiveAlerts(buildingId);
  revalidatePath(`/building/${buildingId}/supervisor`);
  redirect(`/building/${buildingId}/supervisor`);
}
