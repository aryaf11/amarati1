"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { buildingPublicCode } from "@/lib/tokens";

const createBuildingSchema = z.object({
  name: z.string().min(2),
  address: z.string().min(3),
  city: z.string().min(2),
  unitLabel: z.string().min(1),
});

export async function createBuildingAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const parsed = createBuildingSchema.safeParse({
    name: formData.get("name"),
    address: formData.get("address"),
    city: formData.get("city"),
    unitLabel: formData.get("unitLabel"),
  });
  if (!parsed.success) {
    redirect("/dashboard?error=" + encodeURIComponent("تحقق من حقول إنشاء المبنى"));
  }
  const inviteCode = buildingPublicCode();
  const building = await prisma.building.create({
    data: {
      name: parsed.data.name,
      address: parsed.data.address,
      city: parsed.data.city,
      inviteCode,
      creatorId: user.id,
      units: { create: { label: parsed.data.unitLabel } },
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
    (u) => u.label === parsed.data.unitLabel.trim()
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
