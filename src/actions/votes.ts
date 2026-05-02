"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getMembership } from "@/lib/access";
import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";

export async function castVoteAction(formData: FormData) {
  const user = await getCurrentUser();
  const voteId = String(formData.get("voteId") ?? "");
  const voteRow = await prisma.vote.findUnique({ where: { id: voteId } });
  const base = voteRow ? `/building/${voteRow.buildingId}/votes` : "/dashboard";
  if (!user) redirect("/login");
  const optionId = String(formData.get("optionId") ?? "");
  const vote = await prisma.vote.findUnique({
    where: { id: voteId },
    include: { building: true, options: true },
  });
  if (!vote || vote.status === "CLOSED") {
    redirect(base + "?error=" + encodeURIComponent("تصويت غير متاح"));
  }
  if (vote.endsAt < new Date()) {
    redirect(base + "?error=" + encodeURIComponent("انتهى التصويت"));
  }
  const m = await getMembership(user.id, vote.buildingId);
  if (!m) {
    redirect(base + "?error=" + encodeURIComponent("لا عضوية بالمبنى"));
  }
  const okOption = vote.options.some((o) => o.id === optionId);
  if (!okOption) {
    redirect(base + "?error=" + encodeURIComponent("خيار غير صالح"));
  }
  await prisma.voteBallot.upsert({
    where: { voteId_userId: { voteId, userId: user.id } },
    create: { voteId, userId: user.id, optionId },
    update: { optionId },
  });
  revalidatePath(base);
  redirect(base);
}
