"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getMembership } from "@/lib/access";
import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { randomTokenUrlSafe } from "@/lib/tokens";

export async function createInviteLinkAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) return { error: "غير مسجل" };
  const buildingId = String(formData.get("buildingId") ?? "");
  const kind = String(formData.get("kind") ?? "TENANT") as "OWNER" | "TENANT";
  const m = await getMembership(user.id, buildingId);
  if (!m) return { error: "لا عضوية" };
  if (kind === "OWNER" && m.kind !== "OWNER" && !m.isSupervisor) {
    return { error: "فقط المالك أو المشرف يمكنه دعوة مالك/وحدة" };
  }
  if (kind === "TENANT" && m.kind !== "OWNER" && !m.isSupervisor) {
    return { error: "فقط المالك أو المشرف يضيفون مستأجرين" };
  }
  const token = randomTokenUrlSafe(20);
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 14);
  await prisma.inviteToken.create({
    data: {
      token,
      buildingId,
      unitId: m.unitId,
      kind,
      expiresAt,
      createdById: user.id,
    },
  });
  const base =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ??
    "http://localhost:3000";
  const url = `${base}/join/${token}`;
  revalidatePath(`/building/${buildingId}/invite`);
  return { ok: true as const, url };
}

export async function acceptInviteAction(token: string) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const invite = await prisma.inviteToken.findUnique({
    where: { token },
    include: { building: true, unit: true },
  });
  if (!invite || invite.expiresAt < new Date()) {
    return { error: "الرابط منتهٍ أو غير صالح" };
  }
  const dupe = await prisma.membership.findUnique({
    where: { userId_unitId: { userId: user.id, unitId: invite.unitId } },
  });
  if (dupe) redirect(`/building/${invite.buildingId}`);
  await prisma.membership.create({
    data: {
      userId: user.id,
      unitId: invite.unitId,
      kind: invite.kind,
      isSupervisor: false,
    },
  });
  revalidatePath("/dashboard");
  redirect(`/building/${invite.buildingId}`);
}
