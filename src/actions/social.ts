"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getMembership } from "@/lib/access";
import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";

export async function postAnnouncementAction(formData: FormData) {
  const user = await getCurrentUser();
  const buildingId = String(formData.get("buildingId") ?? "");
  if (!user) redirect("/login");
  const title = String(formData.get("title") ?? "");
  const body = String(formData.get("body") ?? "");
  const m = await getMembership(user.id, buildingId);
  if (!m) {
    redirect(`/building/${buildingId}/announcements?error=` + encodeURIComponent("لا عضوية"));
  }
  await prisma.announcement.create({
    data: { buildingId, userId: user.id, title, body },
  });
  revalidatePath(`/building/${buildingId}/announcements`);
  redirect(`/building/${buildingId}/announcements`);
}

export async function postChatAction(formData: FormData) {
  const user = await getCurrentUser();
  const buildingId = String(formData.get("buildingId") ?? "");
  if (!user) redirect("/login");
  const body = String(formData.get("body") ?? "");
  const m = await getMembership(user.id, buildingId);
  if (!m) {
    redirect(`/building/${buildingId}/chat?error=` + encodeURIComponent("لا عضوية"));
  }
  await prisma.chatMessage.create({
    data: { buildingId, userId: user.id, body },
  });
  revalidatePath(`/building/${buildingId}/chat`);
  redirect(`/building/${buildingId}/chat`);
}

export async function mockPayAction(formData: FormData) {
  const user = await getCurrentUser();
  const buildingId = String(formData.get("buildingId") ?? "");
  if (!user) redirect("/login");
  const amount = Number(formData.get("amount") ?? "0");
  const description = String(formData.get("description") ?? "دفعة");
  const maintenanceRequestId = String(
    formData.get("maintenanceRequestId") ?? ""
  );
  const m = await getMembership(user.id, buildingId);
  if (!m) {
    redirect(`/building/${buildingId}/payments?error=` + encodeURIComponent("لا عضوية"));
  }
  if (!amount || amount <= 0) {
    redirect(`/building/${buildingId}/payments?error=` + encodeURIComponent("مبلغ غير صالح"));
  }
  await prisma.payment.create({
    data: {
      userId: user.id,
      buildingId,
      maintenanceRequestId: maintenanceRequestId || undefined,
      amountCents: Math.round(amount * 100),
      description,
      status: "PAID",
      paidAt: new Date(),
    },
  });
  revalidatePath(`/building/${buildingId}/payments`);
  redirect(`/building/${buildingId}/payments`);
}
