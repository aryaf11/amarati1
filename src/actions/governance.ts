"use server";

/**
 * تصويتات المبنى (مشرف، شركة صيانة) — تعديلات على جداول Prisma: Vote, VoteOption, VoteBallot, Membership.
 */

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getMembership } from "@/lib/access";
import { getCurrentUser } from "@/lib/current-user";
import {
  predictFailure,
  recommendServices,
  textToFeatures,
} from "@/lib/maintenance-predictor";
import { prisma } from "@/lib/prisma";

type CompanyRec = { company: string; rating: number };

/**
 * بعد إنشاء طلب صيانة مجتمعي (Prisma) يُنشأ تصويت شركات تلقائياً إن وُجدت ترشيحات.
 * الجداول: `Vote` + `VoteOption`، مرتبطة بـ `MaintenanceRequest` عبر `maintenanceRequestId`.
 */
export async function ensureCommunityMaintenanceCompanyVote(
  buildingId: string,
  requestId: string,
  companies: CompanyRec[],
) {
  if (!companies.length) return;
  const req = await prisma.maintenanceRequest.findUnique({
    where: { id: requestId },
    include: { vote: true },
  });
  if (!req || req.buildingId !== buildingId || req.scope !== "COMMUNITY" || req.vote) {
    return;
  }
  const ends = new Date(Date.now() + 1000 * 60 * 60 * 24 * 3);
  await prisma.vote.create({
    data: {
      buildingId,
      type: "MAINTENANCE_COMPANY",
      title: `اختيار شركة صيانة: ${req.title}`,
      description: req.description.slice(0, 500),
      endsAt: ends,
      maintenanceRequestId: req.id,
      options: {
        create: companies.map((r) => ({
          label: `${r.company} — ⭐ ${r.rating.toFixed(1)}`,
        })),
      },
    },
  });
}

export async function assignSupervisorAction(formData: FormData) {
  const user = await getCurrentUser();
  const buildingId = String(formData.get("buildingId") ?? "");
  if (!user) redirect("/login");
  const targetUserId = String(formData.get("targetUserId") ?? "");
  const building = await prisma.building.findUnique({ where: { id: buildingId } });
  if (!building || building.creatorId !== user.id) {
    redirect(`/building/${buildingId}?error=` + encodeURIComponent("فقط منشئ المبنى يعيّن المشرف"));
  }
  await prisma.membership.updateMany({
    where: { unit: { buildingId } },
    data: { isSupervisor: false },
  });
  const m = await prisma.membership.findFirst({
    where: { userId: targetUserId, unit: { buildingId } },
  });
  if (!m) {
    redirect(`/building/${buildingId}?error=` + encodeURIComponent("المستخدم ليس ضمن المبنى"));
  }
  await prisma.membership.update({
    where: { id: m.id },
    data: { isSupervisor: true },
  });
  revalidatePath(`/building/${buildingId}`);
  redirect(`/building/${buildingId}`);
}

export async function openSupervisorVoteAction(formData: FormData) {
  const user = await getCurrentUser();
  const buildingId = String(formData.get("buildingId") ?? "");
  if (!user) redirect("/login");
  const m = await getMembership(user.id, buildingId);
  if (!m) {
    redirect(`/building/${buildingId}/votes?error=` + encodeURIComponent("لا عضوية"));
  }
  const ends = new Date(Date.now() + 1000 * 60 * 60 * 24 * 3);
  const candidates = await prisma.membership.findMany({
    where: { unit: { buildingId }, kind: "OWNER" },
    include: { user: true },
  });
  if (candidates.length < 2) {
    redirect(`/building/${buildingId}/votes?error=` + encodeURIComponent("يحتاج مالكين على الأقل لبدء تصويت"));
  }
  await prisma.vote.create({
    data: {
      buildingId,
      type: "SUPERVISOR",
      title: "اختيار مشرف المبنى",
      description: "يصوّت الملاك على المشرف.",
      endsAt: ends,
      options: {
        create: candidates.map((c) => ({
          label: c.user.name,
          userId: c.userId,
        })),
      },
    },
  });
  revalidatePath(`/building/${buildingId}/votes`);
  redirect(`/building/${buildingId}/votes`);
}

export async function closeVoteAndApplySupervisorAction(formData: FormData) {
  const user = await getCurrentUser();
  const voteId = String(formData.get("voteId") ?? "");
  const vote = await prisma.vote.findUnique({
    where: { id: voteId },
    include: { options: true, ballots: true, building: true },
  });
  const vbase = vote ? `/building/${vote.buildingId}/votes` : "/dashboard";
  if (!user) redirect("/login");
  if (!vote) {
    redirect(vbase + "?error=" + encodeURIComponent("تصويت غير موجود"));
  }
  const m = await getMembership(user.id, vote.buildingId);
  if (!m?.isSupervisor && vote.building.creatorId !== user.id) {
    redirect(vbase + "?error=" + encodeURIComponent("غير مخول"));
  }
  if (vote.status === "CLOSED") {
    redirect(vbase + "?error=" + encodeURIComponent("مغلق مسبقاً"));
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
  if (!opt?.userId) {
    redirect(vbase + "?error=" + encodeURIComponent("لا خيار فائز"));
  }
  await prisma.$transaction([
    prisma.vote.update({
      where: { id: voteId },
      data: { status: "CLOSED" },
    }),
    prisma.membership.updateMany({
      where: { unit: { buildingId: vote.buildingId } },
      data: { isSupervisor: false },
    }),
    prisma.membership.updateMany({
      where: {
        userId: opt.userId,
        unit: { buildingId: vote.buildingId },
      },
      data: { isSupervisor: true },
    }),
  ]);
  revalidatePath(`/building/${vote.buildingId}`);
  redirect(vbase);
}

/** يبدأ تصويتاً لاختيار شركة صيانة لطلب صيانة مجتمعي (عبر ترشيحات النموذج التنبؤي). */
export async function openMaintenanceCompanyVoteAction(formData: FormData) {
  const user = await getCurrentUser();
  const buildingId = String(formData.get("buildingId") ?? "");
  const requestId = String(formData.get("requestId") ?? "");
  if (!user) redirect("/login");
  const m = await getMembership(user.id, buildingId);
  const building = await prisma.building.findUnique({ where: { id: buildingId } });
  const back = `/building/${buildingId}/maintenance`;
  if (!m || !building) {
    redirect(back + "?error=" + encodeURIComponent("لا عضوية أو مبنى غير موجود"));
  }
  const isCreator = building.creatorId === user.id;
  if (!m.isSupervisor && !isCreator) {
    redirect(back + "?error=" + encodeURIComponent("فقط المشرف أو منشئ المبنى يفتح تصويت شركة صيانة"));
  }
  const req = await prisma.maintenanceRequest.findUnique({
    where: { id: requestId },
    include: { vote: true },
  });
  if (!req || req.buildingId !== buildingId) {
    redirect(back + "?error=" + encodeURIComponent("طلب غير صالح"));
  }
  if (req.scope !== "COMMUNITY") {
    redirect(back + "?error=" + encodeURIComponent("التصويت متاح للأعطال المجتمعية فقط"));
  }
  if (req.vote) {
    redirect(`/building/${buildingId}/votes`);
  }
  let recs = [] as ReturnType<typeof recommendServices>;
  if (req.aiCompaniesJson) {
    try {
      const parsed = JSON.parse(req.aiCompaniesJson) as CompanyRec[];
      if (Array.isArray(parsed) && parsed.length) {
        const issue = predictFailure(textToFeatures(req.description, building.city));
        recs = parsed.map((p) => ({
          service_type: issue,
          company: p.company,
          rating: p.rating,
          latitude: 0,
          longitude: 0,
        }));
      }
    } catch {
      /* ignore */
    }
  }
  if (!recs.length) {
    const features = textToFeatures(req.description, building.city);
    const issue = predictFailure(features);
    recs = recommendServices(issue, 4);
  }
  if (!recs.length) {
    redirect(back + "?error=" + encodeURIComponent("لا توصيات شركات متوفرة لهذا النوع"));
  }
  const ends = new Date(Date.now() + 1000 * 60 * 60 * 24 * 3);
  await prisma.vote.create({
    data: {
      buildingId,
      type: "MAINTENANCE_COMPANY",
      title: `اختيار شركة صيانة: ${req.title}`,
      description: req.description.slice(0, 500),
      endsAt: ends,
      maintenanceRequestId: req.id,
      options: {
        create: recs.map((r) => ({
          label: `${r.company} — ⭐ ${r.rating.toFixed(1)}`,
        })),
      },
    },
  });
  revalidatePath(`/building/${buildingId}/votes`);
  revalidatePath(back);
  redirect(`/building/${buildingId}/votes`);
}

/** يغلق تصويت شركة الصيانة ويسجّل الفائز في تاريخ الشقة. */
export async function closeMaintenanceCompanyVoteAction(formData: FormData) {
  const user = await getCurrentUser();
  const voteId = String(formData.get("voteId") ?? "");
  const vote = await prisma.vote.findUnique({
    where: { id: voteId },
    include: {
      options: true,
      ballots: true,
      building: true,
      maintenanceRequest: true,
    },
  });
  const vbase = vote ? `/building/${vote.buildingId}/votes` : "/dashboard";
  if (!user) redirect("/login");
  if (!vote) {
    redirect(vbase + "?error=" + encodeURIComponent("تصويت غير موجود"));
  }
  if (vote.type !== "MAINTENANCE_COMPANY") {
    redirect(vbase + "?error=" + encodeURIComponent("نوع تصويت غير مطابق"));
  }
  const m = await getMembership(user.id, vote.buildingId);
  if (!m?.isSupervisor && vote.building.creatorId !== user.id) {
    redirect(vbase + "?error=" + encodeURIComponent("غير مخول"));
  }
  if (vote.status === "CLOSED") {
    redirect(vbase + "?error=" + encodeURIComponent("مغلق مسبقاً"));
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
  const winnerLabel = vote.options.find((o) => o.id === winner)?.label ?? "—";
  await prisma.vote.update({
    where: { id: voteId },
    data: { status: "CLOSED" },
  });
  if (vote.maintenanceRequestId) {
    await prisma.maintenanceRequest.update({
      where: { id: vote.maintenanceRequestId },
      data: {
        aiSuggestions:
          (vote.maintenanceRequest?.aiSuggestions ?? "") +
          `\n\n[نتيجة التصويت] ${winnerLabel}`,
      },
    });
  }
  revalidatePath(`/building/${vote.buildingId}/maintenance`);
  revalidatePath(vbase);
  redirect(vbase);
}
