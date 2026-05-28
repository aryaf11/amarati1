"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { userLockedToOtherBuilding } from "@/lib/access";
import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";

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
  if (await userLockedToOtherBuilding(user.id, invite.buildingId)) {
    return { error: "حسابك مرتبط بمبنى آخر. المستخدم ينتمي لمبنى واحد فقط." };
  }
  const dupe = await prisma.membership.findUnique({
    where: { userId_unitId: { userId: user.id, unitId: invite.unitId } },
  });
  if (dupe) redirect("/dashboard");
  await prisma.membership.create({
    data: {
      userId: user.id,
      unitId: invite.unitId,
      kind: invite.kind,
      isSupervisor: false,
    },
  });
  revalidatePath("/dashboard");
  redirect("/dashboard");
}
