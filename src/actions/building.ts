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
import { buildingAddressFromForm } from "@/lib/building-address";
import { buildingPublicCode } from "@/lib/tokens";
import { getLocale } from "@/lib/locale";
import { ui } from "@/lib/ui-strings";

const createBuildingSchema = z.object({
  name: z.string().min(2),
  unitLabel: z.string().min(1),
});

export async function createBuildingAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const locale = await getLocale();
  const t = ui(locale).dashboard;
  const parsed = createBuildingSchema.safeParse({
    name: formData.get("name"),
    unitLabel: formData.get("unitLabel"),
  });
  const addr = buildingAddressFromForm(formData);
  if (!parsed.success || !addr) {
    redirect("/dashboard?error=" + encodeURIComponent(t.nationalAddressInvalid));
  }
  const inviteCode = buildingPublicCode();
  const building = await prisma.building.create({
    data: {
      name: parsed.data.name.trim(),
      address: addr.address,
      city: addr.city,
      region: addr.region,
      district: addr.district,
      streetName: addr.streetName,
      buildingNumber: addr.buildingNumber,
      additionalNumber: addr.additionalNumber,
      postalCode: addr.postalCode,
      shortAddressCode: addr.shortAddressCode,
      inviteCode,
      creatorId: user.id,
      units: { create: { label: parsed.data.unitLabel.trim() } },
    },
    include: { units: true },
  });
  const unit = building.units[0];
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
