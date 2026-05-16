"use server";

/**
 * إنشاء مبنٍ والانضمام برمز دعوة.
 * الربط مع PostgreSQL عبر Prisma: `prisma.building.create` + `membership.create`
 * (انظر prisma/schema.prisma → Building, Unit, Membership).
 */
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { getLocale } from "@/lib/locale";
import { ui } from "@/lib/ui-strings";

export async function createBuildingAction(_formData: FormData) {
  const locale = await getLocale();
  const t = ui(locale).dashboard;
  redirect("/dashboard?error=" + encodeURIComponent(t.createBuildingDisabled));
}

const joinSchema = z.object({
  inviteCode: z.string().min(4),
  unitLabel: z.string().min(1),
});

export async function joinBuildingPublicCodeAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const parsed = joinSchema.safeParse({
    inviteCode: formData.get("inviteCode"),
    unitLabel: formData.get("unitLabel"),
  });
  if (!parsed.success) {
    redirect("/dashboard?error=" + encodeURIComponent("رمز المبنى أو رقم الشقة غير صالح"));
  }
  const building = await prisma.building.findFirst({
    where: { inviteCode: parsed.data.inviteCode.trim().toUpperCase() },
    include: { units: true },
  });
  if (!building) {
    redirect("/dashboard?error=" + encodeURIComponent("لم يُعثر على مبنى بهذا الرمز"));
  }
  let unit = building.units.find(
    (u) => u.label === parsed.data.unitLabel.trim(),
  );
  if (!unit) {
    unit = await prisma.unit.create({
      data: {
        buildingId: building.id,
        label: parsed.data.unitLabel.trim(),
      },
    });
  }
  const existing = await prisma.membership.findUnique({
    where: { userId_unitId: { userId: user.id, unitId: unit.id } },
  });
  if (existing) redirect(`/building/${building.id}`);
  await prisma.membership.create({
    data: {
      userId: user.id,
      unitId: unit.id,
      kind: "OWNER",
      isSupervisor: false,
    },
  });
  revalidatePath("/dashboard");
  redirect(`/building/${building.id}`);
}
