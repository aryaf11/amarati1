"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { formatSaudiNationalAddressLine } from "@/lib/saudi-address";
import { buildingPublicCode } from "@/lib/tokens";

const saudiPostal = z
  .string()
  .trim()
  .regex(/^\d{5}$/, "الرمز البريدي خمسة أرقام");

const createBuildingSchema = z.object({
  name: z.string().min(2),
  region: z.string().min(2),
  city: z.string().min(2),
  district: z.string().min(2),
  streetName: z.string().min(2),
  buildingNumber: z.string().min(1),
  additionalNumber: z.preprocess(
    (v) => (v == null || String(v).trim() === "" ? undefined : String(v).trim()),
    z.union([z.undefined(), z.string().min(1)]),
  ),
  postalCode: saudiPostal,
  shortAddressCode: z.preprocess(
    (v) => (v == null || String(v).trim() === "" ? undefined : String(v).trim().toUpperCase()),
    z.union([z.undefined(), z.string().regex(/^[A-Z0-9]{8}$/)]),
  ),
  latitude: z.preprocess(
    (v) => (v == null || String(v).trim() === "" ? undefined : Number(String(v).trim())),
    z.union([z.undefined(), z.number()]),
  ),
  longitude: z.preprocess(
    (v) => (v == null || String(v).trim() === "" ? undefined : Number(String(v).trim())),
    z.union([z.undefined(), z.number()]),
  ),
  unitLabel: z.string().min(1),
});

export async function createBuildingAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const parsed = createBuildingSchema.safeParse({
    name: formData.get("name"),
    region: formData.get("region"),
    city: formData.get("city"),
    district: formData.get("district"),
    streetName: formData.get("streetName"),
    buildingNumber: formData.get("buildingNumber"),
    additionalNumber: formData.get("additionalNumber") || undefined,
    postalCode: formData.get("postalCode"),
    shortAddressCode: formData.get("shortAddressCode") || undefined,
    latitude: formData.get("latitude"),
    longitude: formData.get("longitude"),
    unitLabel: formData.get("unitLabel"),
  });
  if (!parsed.success) {
    redirect(
      "/dashboard?error=" +
        encodeURIComponent("تحقق من العنوان الوطني والرمز البريدي (5 أرقام) وباقي الحقول")
    );
  }
  const { latitude, longitude } = parsed.data;
  if (
    (latitude !== undefined && Number.isNaN(latitude)) ||
    (longitude !== undefined && Number.isNaN(longitude))
  ) {
    redirect("/dashboard?error=" + encodeURIComponent("إحداثيات الموقع غير صالحة"));
  }
  if (latitude !== undefined && longitude === undefined) {
    redirect("/dashboard?error=" + encodeURIComponent("أدخل خط الطول والعرض معاً"));
  }
  if (longitude !== undefined && latitude === undefined) {
    redirect("/dashboard?error=" + encodeURIComponent("أدخل خط الطول والعرض معاً"));
  }
  const addressLine = formatSaudiNationalAddressLine({
    region: parsed.data.region,
    city: parsed.data.city,
    district: parsed.data.district,
    streetName: parsed.data.streetName,
    buildingNumber: parsed.data.buildingNumber,
    additionalNumber: parsed.data.additionalNumber,
    postalCode: parsed.data.postalCode,
    shortAddressCode: parsed.data.shortAddressCode,
  });
  const inviteCode = buildingPublicCode();
  const building = await prisma.building.create({
    data: {
      name: parsed.data.name,
      address: addressLine,
      city: parsed.data.city,
      region: parsed.data.region,
      district: parsed.data.district,
      streetName: parsed.data.streetName,
      buildingNumber: parsed.data.buildingNumber,
      additionalNumber: parsed.data.additionalNumber,
      postalCode: parsed.data.postalCode,
      shortAddressCode: parsed.data.shortAddressCode,
      latitude,
      longitude,
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
