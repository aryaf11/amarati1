"use server";

/** الانضمام لمبنى قائم برمز الدعوة — إنشاء مبنى جديد من التطبيق غير متاح. */
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { userLockedToOtherBuilding } from "@/lib/access";
import { getCurrentUser } from "@/lib/current-user";
import { getLocale } from "@/lib/locale";
import { prisma } from "@/lib/prisma";
import { ui } from "@/lib/ui-strings";

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
  if (await userLockedToOtherBuilding(user.id, building.id)) {
    const locale = await getLocale();
    redirect("/dashboard?error=" + encodeURIComponent(ui(locale).dashboard.alreadyInBuilding));
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
  if (existing) redirect("/dashboard");
  await prisma.membership.create({
    data: {
      userId: user.id,
      unitId: unit.id,
      kind: "OWNER",
      isSupervisor: false,
    },
  });
  revalidatePath("/dashboard");
  redirect("/dashboard");
}
