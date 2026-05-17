"use server";

/** إعلانات ومحادثة المبنى — `prisma.announcement` / `prisma.chatMessage` (انظر schema.prisma). */

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
    redirect(
      `/building/${buildingId}/chat?tab=group&error=` + encodeURIComponent("لا عضوية"),
    );
  }
  await prisma.chatMessage.create({
    data: { buildingId, userId: user.id, body },
  });
  const tab = String(formData.get("tab") ?? "group");
  const safeTab =
    tab === "residents" || tab === "announcements" || tab === "group" ? tab : "group";
  revalidatePath(`/building/${buildingId}/chat`);
  redirect(`/building/${buildingId}/chat?tab=${safeTab}`);
}

export async function deleteAnnouncementAction(formData: FormData) {
  const user = await getCurrentUser();
  const buildingId = String(formData.get("buildingId") ?? "");
  const announcementId = String(formData.get("announcementId") ?? "");
  if (!user) redirect("/login");
  const m = await getMembership(user.id, buildingId);
  if (!m) {
    redirect(
      `/building/${buildingId}/announcements?error=` +
        encodeURIComponent("لا عضوية"),
    );
  }
  const row = await prisma.announcement.findFirst({
    where: { id: announcementId, buildingId },
    include: { building: true },
  });
  if (!row) {
    redirect(
      `/building/${buildingId}/announcements?error=` +
        encodeURIComponent("الإعلان غير موجود"),
    );
  }
  const mayDelete =
    row.userId === user.id ||
    row.building.creatorId === user.id ||
    m.isSupervisor;
  if (!mayDelete) {
    redirect(
      `/building/${buildingId}/announcements?error=` +
        encodeURIComponent("ليست لديك صلاحية حذف هذا الإعلان"),
    );
  }
  await prisma.announcement.delete({ where: { id: announcementId } });
  revalidatePath(`/building/${buildingId}/announcements`);
  redirect(`/building/${buildingId}/announcements`);
}
