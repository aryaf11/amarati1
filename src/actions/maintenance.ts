"use server";

/**
 * طلبات الصيانة: الواجهة → هذا الملف → Prisma (`MaintenanceRequest`, `ApartmentHistoryEvent`).
 */
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getMembership } from "@/lib/access";
import { analyzeMaintenance } from "@/lib/ai-maintenance";
import { ensureCommunityMaintenanceCompanyVote } from "@/actions/governance";
import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";

const maint = (buildingId: string) => `/building/${buildingId}/maintenance`;

export async function createMaintenanceAction(formData: FormData) {
  const user = await getCurrentUser();
  const buildingId = String(formData.get("buildingId") ?? "");
  if (!user) redirect("/login");
  const scope = String(formData.get("scope") ?? "PERSONAL");
  const title = String(formData.get("title") ?? "");
  const description = String(formData.get("description") ?? "");
  const m = await getMembership(user.id, buildingId);
  if (!m) redirect(maint(buildingId) + "?error=" + encodeURIComponent("لا عضوية"));
  const building = await prisma.building.findUnique({ where: { id: buildingId } });
  if (!building) redirect(maint(buildingId) + "?error=" + encodeURIComponent("مبنى غير موجود"));
  const ai = await analyzeMaintenance({
    description,
    city: building.city,
    buildingId,
  });
  const aiCompaniesJson = ai.companies.length
    ? JSON.stringify(ai.companies)
    : null;
  const req = await prisma.maintenanceRequest.create({
    data: {
      buildingId,
      unitId: scope === "PERSONAL" ? m.unitId : null,
      scope,
      title,
      description,
      aiSummary: ai.summary,
      aiSuggestions: ai.suggestions,
      aiCompaniesJson,
      createdById: user.id,
    },
  });
  if (scope === "COMMUNITY") {
    await ensureCommunityMaintenanceCompanyVote(buildingId, req.id, ai.companies);
  }
  await prisma.apartmentHistoryEvent.create({
    data: {
      unitId: m.unitId,
      title: `طلب صيانة: ${title}`,
      detail: description.slice(0, 500),
      maintenanceRequestId: req.id,
    },
  });
  revalidatePath(`/building/${buildingId}/votes`);
  redirect(maint(buildingId));
}

