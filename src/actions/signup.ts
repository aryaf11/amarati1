"use server";

/** تسجيل مستخدم + إنشاء مبنى أو الانضمام — يتصل بـ Prisma (`User`, `Building`, `Membership`). */

import { randomBytes, randomInt } from "node:crypto";
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
import { createSession } from "@/lib/session";
import { buildingAddressFromForm } from "@/lib/building-address";
import { sendPhoneOtpSms } from "@/lib/sms-otp";
import { buildingPublicCode } from "@/lib/tokens";
import { ui } from "@/lib/ui-strings";

const personalSchema = z.object({
  name: z.string().trim().min(2),
  email: z.preprocess(
    (v) => {
      const s = String(v ?? "").trim().toLowerCase();
      return s === "" ? undefined : s;
    },
    z.union([z.undefined(), z.string().email()]),
  ),
  password: z.string().min(6),
  phone: z.string().trim().min(8).max(24),
});

const buildingSchema = z.object({
  buildingName: z.string().trim().min(2),
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
  const byPhone = await prisma.user.findUnique({ where: { phone: data.phone } });
  if (byPhone) errorRedirect(t.register.phoneTaken);
  if (data.email) {
    const byEmail = await prisma.user.findUnique({ where: { email: data.email } });
    if (byEmail) errorRedirect(t.register.emailTaken);
  }
  const passwordHash = await hashPassword(data.password);
  const gate = isEmailVerificationRequired();
  const verifyToken = gate && data.email ? randomBytes(24).toString("base64url") : null;

  /** بلا بريد لا يوجد تحقّق بريد؛ نُحمِّل نقطة الدخول عبر الجوال أو نُعلِّم البريد مؤكَّداً. */
  const emailVerifiedAt = !gate
    ? new Date()
    : data.email
      ? null
      : new Date();

  const otpCode = String(randomInt(100000, 999999));
  const user = await prisma.user.create({
    data: {
      email: data.email ?? null,
      passwordHash,
      name: data.name,
      phone: data.phone,
      accountKind: "RESIDENT",
      emailVerifiedAt,
      emailVerifyToken: verifyToken,
      emailVerifyExpires:
        gate && data.email ? new Date(Date.now() + 86400000) : null,
      phoneOtpCode: otpCode,
      phoneOtpExpires: new Date(Date.now() + 10 * 60 * 1000),
    },
  });
  const sms = await sendPhoneOtpSms(data.phone, otpCode, locale);
  if (!sms.ok) {
    console.info(`[Amarati] Phone OTP for ${data.phone} (dev): ${otpCode}`);
  }
  if (gate && data.email && verifyToken) {
    const sent = await deliverVerificationEmail(data.email, verifyToken, locale);
    if (!sent.ok) {
      await prisma.user.delete({ where: { id: user.id } });
      errorRedirect(t.register.verifySendFailed);
    }
  }
  return { user, gate: Boolean(gate && data.email) };
}

export async function signupAndCreateBuildingAction(formData: FormData) {
  const locale = await getLocale();
  const t = ui(locale);
  const personal = readPersonal(formData);
  if (!personal.success) backCreateError(t.register.invalidForm);
  const building = buildingSchema.safeParse({
    buildingName: formData.get("buildingName"),
    unitLabel: formData.get("unitLabel"),
  });
  const addr = buildingAddressFromForm(formData);
  if (!building.success || !addr) backCreateError(t.signup.addressInvalid);
  try {
    const { user, gate } = await createUserWithVerification(personal.data, backCreateError);
    const inviteCode = buildingPublicCode();
    const created = await prisma.building.create({
      data: {
        name: building.data.buildingName,
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
