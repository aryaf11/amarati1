"use server";

/**
 * طلبات الصيانة: الواجهة → هذا الملف → Prisma (`MaintenanceRequest`, `ApartmentHistoryEvent`).
 * للصيانة المجتمعية: بعد الإنشاء يُستدعى `ensureCommunityMaintenanceCompanyVote` في governance.ts
 * لإنشاء سجل `Vote` مرتبط بالطلب (انظر schema.prisma → Vote.maintenanceRequestId).
 */
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ensureCommunityMaintenanceCompanyVote } from "@/actions/governance";
import { getMembership } from "@/lib/access";
import { analyzeMaintenance } from "@/lib/ai-maintenance";
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
  const companiesJson = JSON.stringify(ai.companies);
  const req = await prisma.maintenanceRequest.create({
    data: {
      buildingId,
      unitId: scope === "PERSONAL" ? m.unitId : null,
      scope,
      title,
      description,
      aiSummary: ai.summary,
      aiSuggestions: ai.suggestions,
      aiCompaniesJson: companiesJson,
      createdById: user.id,
    },
  });
  await prisma.apartmentHistoryEvent.create({
    data: {
      unitId: m.unitId,
      title: `طلب صيانة: ${title}`,
      detail: description.slice(0, 500),
      maintenanceRequestId: req.id,
    },
  });
  if (scope === "COMMUNITY") {
    await ensureCommunityMaintenanceCompanyVote(buildingId, req.id, ai.companies);
  }
  revalidatePath(maint(buildingId));
  revalidatePath(`/building/${buildingId}/votes`);
  redirect(maint(buildingId));
}

export async function selectMaintenanceVendorAction(formData: FormData) {
  const user = await getCurrentUser();
  const buildingId = String(formData.get("buildingId") ?? "");
  const requestId = String(formData.get("requestId") ?? "");
  const vendor = String(formData.get("vendor") ?? "").trim();
  if (!user) redirect("/login");
  const back = maint(buildingId);
  if (!vendor) redirect(back + "?error=" + encodeURIComponent("اختر شركة صيانة"));
  const m = await getMembership(user.id, buildingId);
  if (!m) redirect(back + "?error=" + encodeURIComponent("لا عضوية"));
  const req = await prisma.maintenanceRequest.findUnique({ where: { id: requestId } });
  if (!req || req.buildingId !== buildingId || req.createdById !== user.id) {
    redirect(back + "?error=" + encodeURIComponent("طلب غير صالح"));
  }
  if (req.scope !== "PERSONAL") {
    redirect(back + "?error=" + encodeURIComponent("الاختيار للطلبات الشخصية فقط"));
  }
  await prisma.maintenanceRequest.update({
    where: { id: requestId },
    data: { selectedVendor: vendor },
  });
  revalidatePath(back);
  redirect(back);
}
