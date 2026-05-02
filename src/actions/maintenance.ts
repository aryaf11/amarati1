"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
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
  });
  const req = await prisma.maintenanceRequest.create({
    data: {
      buildingId,
      unitId: scope === "PERSONAL" ? m.unitId : null,
      scope,
      title,
      description,
      aiSummary: ai.summary,
      aiSuggestions: ai.suggestions,
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
  revalidatePath(maint(buildingId));
  redirect(maint(buildingId));
}

export async function openMaintenanceCompanyVoteAction(formData: FormData) {
  const user = await getCurrentUser();
  const buildingId = String(formData.get("buildingId") ?? "");
  if (!user) redirect("/login");
  const maintenanceRequestId = String(formData.get("maintenanceRequestId") ?? "");
  const m = await getMembership(user.id, buildingId);
  if (!m?.isSupervisor) {
    redirect(maint(buildingId) + "?error=" + encodeURIComponent("للمشرف فقط"));
  }
  const req = await prisma.maintenanceRequest.findFirst({
    where: { id: maintenanceRequestId, buildingId, scope: "COMMUNITY" },
  });
  if (!req) {
    redirect(maint(buildingId) + "?error=" + encodeURIComponent("طلب مجتمعي غير موجود"));
  }
  const existing = await prisma.vote.findUnique({
    where: { maintenanceRequestId },
  });
  if (existing) {
    redirect(maint(buildingId) + "?error=" + encodeURIComponent("تصويت موجود مسبقاً"));
  }
  const companies = await prisma.maintenanceCompany.findMany({
    take: 6,
    orderBy: { name: "asc" },
  });
  if (companies.length < 2) {
    redirect(maint(buildingId) + "?error=" + encodeURIComponent("تحتاج شركتين معتمدتين على الأقل في المنصة"));
  }
  const ends = new Date(Date.now() + 1000 * 60 * 60 * 24 * 3);
  await prisma.vote.create({
    data: {
      buildingId,
      type: "MAINTENANCE_COMPANY",
      title: `اختيار شركة لـ: ${req.title}`,
      description: "تصويت لاختيار شركة صيانة للعطل المجتمعي.",
      endsAt: ends,
      maintenanceRequestId: req.id,
      options: {
        create: companies.map((c) => ({
          label: c.name,
          companyId: c.id,
        })),
      },
    },
  });
  revalidatePath(`/building/${buildingId}/votes`);
  revalidatePath(maint(buildingId));
  redirect(maint(buildingId));
}

export async function applyCompanyWinnerAction(formData: FormData) {
  const user = await getCurrentUser();
  const voteId = String(formData.get("voteId") ?? "");
  const vote = await prisma.vote.findUnique({
    where: { id: voteId },
    include: { options: true, ballots: true },
  });
  const vBase = vote ? `/building/${vote.buildingId}/votes` : "/dashboard";
  if (!user) redirect("/login");
  if (!vote || !vote.maintenanceRequestId) {
    redirect(vBase + "?error=" + encodeURIComponent("تصويت غير مرتبط بطلب"));
  }
  const m = await getMembership(user.id, vote.buildingId);
  if (!m?.isSupervisor) {
    redirect(vBase + "?error=" + encodeURIComponent("للمشرف فقط"));
  }
  const counts = new Map<string, number>();
  for (const o of vote.options) counts.set(o.id, 0);
  for (const b of vote.ballots) {
    counts.set(b.optionId, (counts.get(b.optionId) ?? 0) + 1);
  }
  let winner = vote.options[0]?.id;
  let best = -1;
  for (const [oid, c] of counts) {
    if (c > best) {
      best = c;
      winner = oid;
    }
  }
  const opt = vote.options.find((o) => o.id === winner);
  if (!opt?.companyId) {
    redirect(vBase + "?error=" + encodeURIComponent("لا فائز"));
  }
  await prisma.$transaction([
    prisma.vote.update({
      where: { id: voteId },
      data: { status: "CLOSED" },
    }),
    prisma.maintenanceRequest.update({
      where: { id: vote.maintenanceRequestId },
      data: {
        companyId: opt.companyId,
        status: "COMPANY_SELECTED",
      },
    }),
  ]);
  revalidatePath(maint(vote.buildingId));
  redirect(vBase);
}

export async function companyUpdateRequestStatusAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user?.companyProfile) {
    redirect("/company/dashboard?error=" + encodeURIComponent("حساب شركة غير مكتمل"));
  }
  const requestId = String(formData.get("requestId") ?? "");
  const status = String(formData.get("status") ?? "") as
    | "IN_PROGRESS"
    | "DONE"
    | "CANCELLED";
  const req = await prisma.maintenanceRequest.findFirst({
    where: { id: requestId, companyId: user.companyProfile.id },
  });
  if (!req) {
    redirect("/company/dashboard?error=" + encodeURIComponent("طلب غير موجود"));
  }
  await prisma.maintenanceRequest.update({
    where: { id: requestId },
    data: { status },
  });
  if (status === "DONE" && req.unitId) {
    await prisma.apartmentHistoryEvent.create({
      data: {
        unitId: req.unitId,
        title: `إنجاز صيانة: ${req.title}`,
        detail: `شركة: ${user.companyProfile.name}`,
        maintenanceRequestId: req.id,
      },
    });
  }
  revalidatePath("/company/dashboard");
  revalidatePath(`/building/${req.buildingId}/maintenance`);
  redirect("/company/dashboard");
}
