"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getMembership } from "@/lib/access";
import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";

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
