"use server";

import { randomBytes } from "node:crypto";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { redirect } from "next/navigation";
import { z } from "zod";
import { dbOrSessionErrorHint, flattenError } from "@/lib/action-error-hints";
import { getLocale } from "@/lib/locale";
import { hashPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import {
  deliverVerificationEmail,
  isEmailVerificationRequired,
} from "@/lib/send-verification-email";
import { formatSaudiNationalAddressLine } from "@/lib/saudi-address";
import { createSession } from "@/lib/session";
import { buildingPublicCode } from "@/lib/tokens";
import { ui } from "@/lib/ui-strings";

const personalSchema = z.object({
  name: z.string().trim().min(2),
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(6),
  phone: z.preprocess(
    (v) => (v == null || String(v).trim() === "" ? undefined : String(v).trim()),
    z.union([z.undefined(), z.string().min(3)]),
  ),
});

const saudiPostal = z.string().trim().regex(/^\d{5}$/);

const buildingSchema = z.object({
  buildingName: z.string().trim().min(2),
  region: z.string().trim().min(2),
  city: z.string().trim().min(2),
  district: z.string().trim().min(2),
  streetName: z.string().trim().min(2),
  buildingNumber: z.string().trim().min(1),
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
  unitLabel: z.string().trim().min(1),
});

const joinSchema = z.object({
  inviteCode: z.string().trim().min(4),
  unitLabel: z.string().trim().min(1),
});

function readPersonal(formData: FormData) {
  return personalSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    phone: formData.get("phone"),
  });
}

function backCreateError(msg: string): never {
  redirect("/signup/create?error=" + encodeURIComponent(msg));
}
function backJoinError(msg: string): never {
  redirect("/signup/join?error=" + encodeURIComponent(msg));
}

async function createUserWithVerification(
  data: z.infer<typeof personalSchema>,
  errorRedirect: (msg: string) => never,
) {
  const locale = await getLocale();
  const t = ui(locale);
  const exists = await prisma.user.findUnique({ where: { email: data.email } });
  if (exists) errorRedirect(t.register.emailTaken);
  const passwordHash = await hashPassword(data.password);
  const gate = isEmailVerificationRequired();
  const verifyToken = gate ? randomBytes(24).toString("base64url") : null;
  const user = await prisma.user.create({
    data: {
      email: data.email,
      passwordHash,
      name: data.name,
      phone: data.phone ?? null,
      accountKind: "RESIDENT",
      emailVerifiedAt: gate ? null : new Date(),
      emailVerifyToken: verifyToken,
      emailVerifyExpires: gate ? new Date(Date.now() + 86400000) : null,
    },
  });
  if (gate && verifyToken) {
    const sent = await deliverVerificationEmail(data.email, verifyToken, locale);
    if (!sent.ok) {
      await prisma.user.delete({ where: { id: user.id } });
      errorRedirect(t.register.verifySendFailed);
    }
  }
  return { user, gate };
}

export async function signupAndCreateBuildingAction(formData: FormData) {
  const locale = await getLocale();
  const t = ui(locale);
  const personal = readPersonal(formData);
  if (!personal.success) backCreateError(t.register.invalidForm);
  const building = buildingSchema.safeParse({
    buildingName: formData.get("buildingName"),
    region: formData.get("region"),
    city: formData.get("city"),
    district: formData.get("district"),
    streetName: formData.get("streetName"),
    buildingNumber: formData.get("buildingNumber"),
    additionalNumber: formData.get("additionalNumber"),
    postalCode: formData.get("postalCode"),
    shortAddressCode: formData.get("shortAddressCode"),
    latitude: formData.get("latitude"),
    longitude: formData.get("longitude"),
    unitLabel: formData.get("unitLabel"),
  });
  if (!building.success) backCreateError(t.signup.addressInvalid);
  const { latitude, longitude } = building.data;
  if (
    (latitude !== undefined && Number.isNaN(latitude)) ||
    (longitude !== undefined && Number.isNaN(longitude))
  ) {
    backCreateError(t.signup.coordsInvalid);
  }
  if (
    (latitude !== undefined && longitude === undefined) ||
    (longitude !== undefined && latitude === undefined)
  ) {
    backCreateError(t.signup.coordsBoth);
  }

  try {
    const { user, gate } = await createUserWithVerification(personal.data, backCreateError);
    const addressLine = formatSaudiNationalAddressLine({
      region: building.data.region,
      city: building.data.city,
      district: building.data.district,
      streetName: building.data.streetName,
      buildingNumber: building.data.buildingNumber,
      additionalNumber: building.data.additionalNumber,
      postalCode: building.data.postalCode,
      shortAddressCode: building.data.shortAddressCode,
    });
    const inviteCode = buildingPublicCode();
    const created = await prisma.building.create({
      data: {
        name: building.data.buildingName,
        address: addressLine,
        city: building.data.city,
        region: building.data.region,
        district: building.data.district,
        streetName: building.data.streetName,
        buildingNumber: building.data.buildingNumber,
        additionalNumber: building.data.additionalNumber,
        postalCode: building.data.postalCode,
        shortAddressCode: building.data.shortAddressCode,
        latitude,
        longitude,
        inviteCode,
        creatorId: user.id,
        units: { create: { label: building.data.unitLabel } },
      },
      include: { units: true },
    });
    const unit = created.units[0];
    await prisma.membership.create({
      data: {
        userId: user.id,
        unitId: unit.id,
        kind: "OWNER",
        isSupervisor: false,
      },
    });
    if (gate) {
      redirect("/register/check-email");
    }
    await createSession(user.id);
    redirect(`/building/${created.id}`);
  } catch (e) {
    if (isRedirectError(e)) throw e;
    console.error("signupAndCreateBuildingAction", flattenError(e), e);
    backCreateError(dbOrSessionErrorHint(e));
  }
}

export async function signupAndJoinBuildingAction(formData: FormData) {
  const locale = await getLocale();
  const t = ui(locale);
  const personal = readPersonal(formData);
  if (!personal.success) backJoinError(t.register.invalidForm);
  const join = joinSchema.safeParse({
    inviteCode: formData.get("inviteCode"),
    unitLabel: formData.get("unitLabel"),
  });
  if (!join.success) backJoinError(t.signup.inviteCodeNotFound);
  const code = join.data.inviteCode.toUpperCase();
  const building = await prisma.building.findFirst({
    where: { inviteCode: code },
    include: { units: true },
  });
  if (!building) backJoinError(t.signup.inviteCodeNotFound);

  try {
    const { user, gate } = await createUserWithVerification(personal.data, backJoinError);
    let unit = building.units.find((u) => u.label === join.data.unitLabel);
    if (!unit) {
      unit = await prisma.unit.create({
        data: { buildingId: building.id, label: join.data.unitLabel },
      });
    }
    await prisma.membership.create({
      data: {
        userId: user.id,
        unitId: unit.id,
        kind: "OWNER",
        isSupervisor: false,
      },
    });
    if (gate) {
      redirect("/register/check-email");
    }
    await createSession(user.id);
    redirect(`/building/${building.id}`);
  } catch (e) {
    if (isRedirectError(e)) throw e;
    console.error("signupAndJoinBuildingAction", flattenError(e), e);
    backJoinError(dbOrSessionErrorHint(e));
  }
}
