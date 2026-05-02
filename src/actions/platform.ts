"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { randomTokenUrlSafe } from "@/lib/tokens";
import { addPredictiveAlerts, supervisorMonthlyScore } from "@/lib/ai-maintenance";
import { getCurrentUser, isPlatformAdmin } from "@/lib/current-user";
import { hashPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { getMembership } from "@/lib/access";

export async function supervisorRefreshInsightsAction(formData: FormData) {
  const user = await getCurrentUser();
  const buildingId = String(formData.get("buildingId") ?? "");
  if (!user) redirect("/login");
  const m = await getMembership(user.id, buildingId);
  if (!m?.isSupervisor) {
    redirect(`/building/${buildingId}/supervisor?error=` + encodeURIComponent("للمشرف فقط"));
  }
  await supervisorMonthlyScore(buildingId);
  await addPredictiveAlerts(buildingId);
  revalidatePath(`/building/${buildingId}/supervisor`);
  redirect(`/building/${buildingId}/supervisor`);
}

export async function submitCompanyApplicationAction(formData: FormData) {
  const user = await getCurrentUser();
  const applicantId = user?.id;
  const businessName = String(formData.get("businessName") ?? "");
  const email = String(formData.get("email") ?? "");
  const phone = String(formData.get("phone") ?? "");
  const notes = String(formData.get("notes") ?? "");
  if (businessName.length < 2 || !email.includes("@")) {
    redirect("/company/apply?error=" + encodeURIComponent("بيانات غير كافية"));
  }
  await prisma.companyApplication.create({
    data: {
      businessName,
      email,
      phone: phone || undefined,
      notes: notes || undefined,
      applicantId,
    },
  });
  revalidatePath("/company/apply");
  revalidatePath("/platform/applications");
  redirect("/company/apply?thanks=1");
}

export async function reviewCompanyApplicationAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user || !isPlatformAdmin(user.email)) {
    redirect("/platform/applications?error=" + encodeURIComponent("غير مخول لمراجعة المنصة"));
  }
  const id = String(formData.get("id") ?? "");
  const decision = String(formData.get("decision") ?? "");
  const reviewerNote = String(formData.get("reviewerNote") ?? "");
  const app = await prisma.companyApplication.findUnique({ where: { id } });
  if (!app || app.status !== "PENDING") {
    redirect("/platform/applications?error=" + encodeURIComponent("طلب غير متاح"));
  }
  if (decision === "REJECT") {
    await prisma.companyApplication.update({
      where: { id },
      data: {
        status: "REJECTED",
        reviewerNote,
        reviewedAt: new Date(),
      },
    });
    revalidatePath("/platform/applications");
    redirect("/platform/applications");
  }
  if (decision !== "APPROVE") {
    redirect("/platform/applications?error=" + encodeURIComponent("قرار غير معروف"));
  }
  const tempPassword = randomTokenUrlSafe(9);
  const passwordHash = await hashPassword(tempPassword);
  try {
    const companyUser = await prisma.user.create({
      data: {
        email: app.email,
        passwordHash,
        name: app.businessName,
        accountKind: "COMPANY",
      },
    });
    await prisma.maintenanceCompany.create({
      data: {
        name: app.businessName,
        userId: companyUser.id,
        specialty: app.notes?.slice(0, 120),
      },
    });
    const token = randomTokenUrlSafe(16);
    await prisma.companyApplication.update({
      where: { id },
      data: {
        status: "APPROVED",
        reviewerNote: `${reviewerNote}\nكلمة مرور مؤقتة للشركة: ${tempPassword}\n(يُنصح بتغييرها لاحقاً)`.trim(),
        reviewedAt: new Date(),
        inviteToken: token,
      },
    });
  } catch {
    redirect(
      "/platform/applications?error=" +
        encodeURIComponent("تعذّر إنشاء الحساب — قد يكون البريد مستخدماً.")
    );
  }
  revalidatePath("/platform/applications");
  revalidatePath("/company");
  redirect("/platform/applications");
}
