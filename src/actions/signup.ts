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
import { sendPhoneOtpSms } from "@/lib/sms-otp";
import {
  isTwilioVerifyConfigured,
  startTwilioVerification,
} from "@/lib/twilio-verify";
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

const joinSchema = z.object({
  inviteCode: z.string().trim().min(4),
  unitLabel: z.string().trim().min(1),
});

/** بيانات المبنى عند إنشائه من نموذج التسجيل. الحقول الإلزامية تطابق `model Building` في prisma. */
const buildingSchema = z.object({
  name: z.string().trim().min(2).max(120),
  addressLine: z.string().trim().min(2).max(240),
  unitLabel: z.string().trim().min(1).max(40),
  region: z.string().trim().min(1).max(80),
  city: z.string().trim().min(1).max(80),
  district: z.string().trim().min(1).max(80),
  streetName: z.string().trim().min(1).max(120),
  buildingNumber: z.string().trim().min(1).max(20),
  additionalNumber: z.preprocess(
    (v) => {
      const s = String(v ?? "").trim();
      return s === "" ? undefined : s;
    },
    z.union([z.undefined(), z.string().max(20)]),
  ),
  postalCode: z.string().trim().regex(/^\d{5}$/),
  shortAddressCode: z.preprocess(
    (v) => {
      const s = String(v ?? "").trim().toUpperCase();
      return s === "" ? undefined : s;
    },
    z.union([z.undefined(), z.string().max(8)]),
  ),
});

function readPersonal(formData: FormData) {
  return personalSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    phone: formData.get("phone"),
  });
}

function readBuilding(formData: FormData) {
  return buildingSchema.safeParse({
    name: formData.get("buildingName"),
    addressLine: formData.get("addressLine"),
    unitLabel: formData.get("unitLabel"),
    region: formData.get("region"),
    city: formData.get("city"),
    district: formData.get("district"),
    streetName: formData.get("streetName"),
    buildingNumber: formData.get("buildingNumber"),
    additionalNumber: formData.get("additionalNumber"),
    postalCode: formData.get("postalCode"),
    shortAddressCode: formData.get("shortAddressCode"),
  });
}

function backCreateError(msg: string): never {
  redirect("/signup/create?error=" + encodeURIComponent(msg));
}
function backJoinError(msg: string): never {
  redirect("/signup/join?error=" + encodeURIComponent(msg));
}

/** يولّد رمز دعوة فريداً (يتجنّب الأحرف المتشابهة I/O/0/1). */
async function ensureUniqueInviteCode(length = 6): Promise<string> {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  for (let attempt = 0; attempt < 8; attempt++) {
    let code = "";
    for (let i = 0; i < length; i++) {
      code += chars[randomInt(0, chars.length)];
    }
    const existing = await prisma.building.findUnique({
      where: { inviteCode: code },
    });
    if (!existing) return code;
  }
  throw new Error("Failed to generate a unique inviteCode after 8 attempts");
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

  // Twilio Verify يُولّد رمزه على خوادمه؛ لا نولّد رمزاً محلياً ولا نخزّنه.
  const useVerify = isTwilioVerifyConfigured();
  const localOtpCode = useVerify ? null : String(randomInt(100000, 999999));
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
      phoneOtpCode: localOtpCode,
      phoneOtpExpires: new Date(Date.now() + 10 * 60 * 1000),
    },
  });
  if (useVerify) {
    console.info(`[Amarati] Twilio Verify → start for ${data.phone}`);
    const res = await startTwilioVerification(data.phone, locale);
    if (res.ok) {
      console.info(`[Amarati] Twilio Verify → sent sid=${res.sid}`);
    } else {
      console.warn(
        `[Amarati] Twilio Verify FAILED for ${data.phone}: reason=${res.reason} code=${"code" in res ? res.code : ""} detail=${res.detail ?? ""}`,
      );
    }
  } else if (localOtpCode) {
    const sms = await sendPhoneOtpSms(data.phone, localOtpCode, locale);
    if (!sms.ok) {
      console.info(
        `[Amarati] Phone OTP for ${data.phone} (dev): ${localOtpCode}`,
      );
    }
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
  const buildingData = readBuilding(formData);
  if (!buildingData.success) backCreateError(t.signup.addressInvalid);

  try {
    const { user, gate } = await createUserWithVerification(
      personal.data,
      backCreateError,
    );
    const inviteCode = await ensureUniqueInviteCode();
    const building = await prisma.building.create({
      data: {
        name: buildingData.data.name,
        address: buildingData.data.addressLine,
        city: buildingData.data.city,
        region: buildingData.data.region,
        district: buildingData.data.district,
        streetName: buildingData.data.streetName,
        buildingNumber: buildingData.data.buildingNumber,
        additionalNumber: buildingData.data.additionalNumber ?? null,
        postalCode: buildingData.data.postalCode,
        shortAddressCode: buildingData.data.shortAddressCode ?? null,
        inviteCode,
        creatorId: user.id,
      },
    });
    const unit = await prisma.unit.create({
      data: {
        buildingId: building.id,
        label: buildingData.data.unitLabel,
      },
    });
    // مُنشئ المبنى يصبح مالكاً ومشرفاً افتراضياً.
    await prisma.membership.create({
      data: {
        userId: user.id,
        unitId: unit.id,
        kind: "OWNER",
        isSupervisor: true,
      },
    });
    if (gate) {
      redirect("/register/check-email");
    }
    await createSession(user.id);
    if (!user.phoneVerifiedAt) {
      redirect(
        `/register/verify-phone?identifier=${encodeURIComponent(personal.data.phone)}`,
      );
    }
    redirect(`/building/${building.id}`);
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
    if (!user.phoneVerifiedAt) {
      redirect(
        `/register/verify-phone?identifier=${encodeURIComponent(personal.data.phone)}`,
      );
    }
    redirect(`/building/${building.id}`);
  } catch (e) {
    if (isRedirectError(e)) throw e;
    console.error("signupAndJoinBuildingAction", flattenError(e), e);
    backJoinError(dbOrSessionErrorHint(e));
  }
}
