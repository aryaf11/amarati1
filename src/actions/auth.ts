"use server";

/**
 * تسجيل الدخول/الخروج وتحديث الملف الشخصي والتحقق بالجوال.
 * الربط مع PostgreSQL: جميع دوال `prisma.user.*` وفق `schema.prisma` → model User.
 */
import { randomBytes, randomInt } from "node:crypto";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { dbOrSessionErrorHint, flattenError } from "@/lib/action-error-hints";
import { getCurrentUser } from "@/lib/current-user";
import { getLocale } from "@/lib/locale";
import { hashPassword, verifyPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { deliverVerificationEmail, isEmailVerificationRequired } from "@/lib/send-verification-email";
import { sendPhoneOtpSms } from "@/lib/sms-otp";
import { createSession, destroySession } from "@/lib/session";
import { ui } from "@/lib/ui-strings";
import { userMeetsVerificationRequirement } from "@/lib/verification-gate";

async function issuePhoneOtpForUser(
  userId: string,
  phone: string,
  locale: Awaited<ReturnType<typeof getLocale>>,
) {
  const code = String(randomInt(100000, 999999));
  await prisma.user.update({
    where: { id: userId },
    data: {
      phoneOtpCode: code,
      phoneOtpExpires: new Date(Date.now() + 10 * 60 * 1000),
    },
  });
  const sms = await sendPhoneOtpSms(phone, code, locale);
  if (!sms.ok) {
    console.info(`[Amarati] Phone OTP for ${phone} (dev): ${code}`);
  }
}

function verifyPhoneRedirect(phone: string) {
  redirect(
    `/register/verify-phone?identifier=${encodeURIComponent(phone)}`,
  );
}

async function findUserByIdentifier(identifier: string) {
  const trimmed = identifier.trim();
  if (trimmed.includes("@")) {
    return prisma.user.findUnique({ where: { email: trimmed.toLowerCase() } });
  }
  const phone = trimmed.replace(/\s+/g, "");
  return prisma.user.findUnique({ where: { phone } });
}

function verificationDeliveryUserMessage(
  t: ReturnType<typeof ui>,
  reason:
    | "no_base_url"
    | "send_failed"
    | "no_sender"
    | "resend_testing_recipient_only"
    | "resend_from_domain"
    | "resend_invalid_api_key"
    | "resend_blocked_recipient"
) {
  switch (reason) {
    case "no_base_url":
      return t.register.verifySendFailedNoUrl;
    case "no_sender":
      return t.register.verifySendFailedNoSender;
    case "resend_testing_recipient_only":
      return t.register.verifySendFailedResendTestingRecipient;
    case "resend_from_domain":
      return t.register.verifySendFailedResendFromDomain;
    case "resend_invalid_api_key":
      return t.register.verifySendFailedResendInvalidKey;
    case "resend_blocked_recipient":
      return t.register.verifySendFailedResendBlockedEmail;
    case "send_failed":
      return t.register.verifySendFailedResend;
    default:
      return t.register.verifySendFailed;
  }
}

const registerSchema = z.object({
  email: z.preprocess(
    (v) => {
      const s = String(v ?? "").trim().toLowerCase();
      return s === "" ? undefined : s;
    },
    z.union([z.undefined(), z.string().email()]),
  ),
  password: z.string().min(6),
  name: z.string().min(2),
  phone: z.string().trim().min(8).max(24),
});

export async function registerAction(formData: FormData) {
  const locale = await getLocale();
  const t = ui(locale);
  const nameRaw = String(formData.get("name") ?? "").trim();
  const passwordRaw = String(formData.get("password") ?? "");
  const phoneRaw = String(formData.get("phone") ?? "").trim();
  const parsed = registerSchema.safeParse({
    email: formData.get("email"),
    password: passwordRaw,
    name: nameRaw,
    phone: phoneRaw,
  });
  if (!parsed.success) {
    redirect("/login?error=" + encodeURIComponent(t.register.invalidForm));
  }
  const dupPhone = await prisma.user.findUnique({
    where: { phone: parsed.data.phone },
  });
  if (dupPhone) {
    redirect("/login?error=" + encodeURIComponent(t.register.phoneTaken));
  }
  if (parsed.data.email) {
    const dupEmail = await prisma.user.findUnique({
      where: { email: parsed.data.email },
    });
    if (dupEmail) {
      redirect("/login?error=" + encodeURIComponent(t.register.emailTaken));
    }
  }
  const passwordHash = await hashPassword(parsed.data.password);
  const gate = isEmailVerificationRequired();
  const verifyToken =
    gate && parsed.data.email ? randomBytes(24).toString("base64url") : null;
  const emailVerifiedAt = !gate
    ? new Date()
    : parsed.data.email
      ? null
      : new Date();
  try {
    const user = await prisma.user.create({
      data: {
        email: parsed.data.email ?? null,
        passwordHash,
        name: parsed.data.name,
        phone: parsed.data.phone,
        accountKind: "RESIDENT",
        emailVerifiedAt,
        emailVerifyToken: verifyToken,
        emailVerifyExpires:
          gate && parsed.data.email ? new Date(Date.now() + 86400000) : null,
      },
    });
    await issuePhoneOtpForUser(user.id, parsed.data.phone, locale);
    if (gate && parsed.data.email && verifyToken) {
      const sent = await deliverVerificationEmail(parsed.data.email, verifyToken, locale);
      if (!sent.ok) {
        await prisma.user.delete({ where: { id: user.id } });
        redirect(
          "/login?error=" +
            encodeURIComponent(verificationDeliveryUserMessage(t, sent.reason))
        );
      }
      redirect("/register/check-email");
    }
    await createSession(user.id);
    if (!user.phoneVerifiedAt) {
      verifyPhoneRedirect(parsed.data.phone);
    }
  } catch (e) {
    if (isRedirectError(e)) throw e;
    console.error("registerAction", flattenError(e), e);
    redirect("/login?error=" + encodeURIComponent(dbOrSessionErrorHint(e).trim()));
  }
  redirect("/dashboard");
}

const loginSchema = z.object({
  identifier: z.string().min(3),
  password: z.string().min(1),
});

export async function loginAction(formData: FormData) {
  const locale = await getLocale();
  const t = ui(locale);
  const parsed = loginSchema.safeParse({
    identifier: String(formData.get("identifier") ?? formData.get("email") ?? "").trim(),
    password: String(formData.get("password") ?? ""),
  });
  if (!parsed.success) {
    redirect("/login?error=" + encodeURIComponent(t.login.invalidForm));
  }
  try {
    const user = await findUserByIdentifier(parsed.data.identifier);

    if (!user) {
      redirect("/login?error=" + encodeURIComponent(t.login.noAccountFull) + "&noAccount=1");
    }
    if (!(await verifyPassword(parsed.data.password, user.passwordHash))) {
      redirect("/login?error=" + encodeURIComponent(t.login.invalidCredentials));
    }
    if (isEmailVerificationRequired() && !userMeetsVerificationRequirement(user)) {
      if (!user.phoneVerifiedAt) {
        await issuePhoneOtpForUser(user.id, user.phone, locale);
        await createSession(user.id);
        verifyPhoneRedirect(user.phone);
      }
      redirect("/login?error=" + encodeURIComponent(t.login.verifyEmailFirst));
    }

    if (!user.phoneVerifiedAt) {
      await issuePhoneOtpForUser(user.id, user.phone, locale);
      await createSession(user.id);
      verifyPhoneRedirect(user.phone);
    }

    await createSession(user.id);
    const next = formData.get("next");
    if (typeof next === "string" && next.startsWith("/") && !next.startsWith("//")) {
      redirect(next);
    }
    redirect("/dashboard");
  } catch (e) {
    if (isRedirectError(e)) throw e;
    console.error("loginAction", flattenError(e), e);
    redirect("/login?error=" + encodeURIComponent(dbOrSessionErrorHint(e).trim()));
  }
}

const resendSchema = z.object({
  email: z.string().email(),
});

export async function resendVerificationEmailAction(formData: FormData) {
  const locale = await getLocale();
  const t = ui(locale);
  if (!isEmailVerificationRequired()) {
    redirect("/login");
  }
  const parsed = resendSchema.safeParse({
    email: formData.get("email"),
  });
  if (!parsed.success) {
    redirect("/register/check-email?error=" + encodeURIComponent(t.registerCheckEmail.resendInvalidEmail));
  }
  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email },
  });
  if (!user) {
    redirect("/register/check-email?resent=1");
  }
  if (user.emailVerifiedAt) {
    redirect("/register/check-email?error=" + encodeURIComponent(t.registerCheckEmail.resendAlreadyVerified));
  }
  const token = randomBytes(24).toString("base64url");
  const sent = await deliverVerificationEmail(parsed.data.email, token, locale);
  if (!sent.ok) {
    redirect(
      "/register/check-email?error=" +
        encodeURIComponent(verificationDeliveryUserMessage(t, sent.reason))
    );
  }
  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerifyToken: token,
      emailVerifyExpires: new Date(Date.now() + 86400000),
    },
  });
  redirect("/register/check-email?resent=1");
}

export async function logoutAction() {
  await destroySession();
  redirect("/");
}

export async function toggleVisibleInResidentsAction() {
  const me = await getCurrentUser();
  if (!me) redirect("/login?next=/profile");
  await prisma.user.update({
    where: { id: me.id },
    data: { visibleInResidents: !me.visibleInResidents },
  });
  revalidatePath("/profile");
  revalidatePath("/building", "layout");
  redirect("/profile?saved=1");
}

const profileSchema = z.object({
  name: z.string().min(2).max(120),
  phone: z.string().trim().min(8).max(40),
  newEmail: z.preprocess(
    (v) => {
      const s = String(v ?? "").trim().toLowerCase();
      return s === "" ? undefined : s;
    },
    z.union([z.undefined(), z.string().email()]),
  ),
});

export async function updateProfileAction(formData: FormData) {
  const locale = await getLocale();
  const t = ui(locale);
  const me = await getCurrentUser();
  if (!me) redirect("/login");
  const parsed = profileSchema.safeParse({
    name: String(formData.get("name") ?? "").trim(),
    phone: formData.get("phone"),
    newEmail: formData.get("newEmail"),
  });
  if (!parsed.success) {
    redirect("/profile?error=" + encodeURIComponent(t.profile.invalidForm));
  }
  try {
    const data: { name: string; phone: string; email?: string | null } = {
      name: parsed.data.name,
      phone: parsed.data.phone,
    };
    if (!me.email && parsed.data.newEmail) {
      const taken = await prisma.user.findUnique({
        where: { email: parsed.data.newEmail },
      });
      if (taken && taken.id !== me.id) {
        redirect("/profile?error=" + encodeURIComponent(t.register.emailTaken));
      }
      data.email = parsed.data.newEmail;
    }
    await prisma.user.update({
      where: { id: me.id },
      data,
    });
  } catch (e) {
    if (isRedirectError(e)) throw e;
    console.error("updateProfileAction", flattenError(e), e);
    redirect("/profile?error=" + encodeURIComponent(dbOrSessionErrorHint(e).trim()));
  }
  redirect("/profile?saved=1");
}

const verifyOtpSchema = z.object({
  identifier: z.string().min(3),
  code: z.string().regex(/^\d{6}$/),
});

/** التحقق بالجوال: يقرأ/يكتب حقول phoneOtp* و phoneVerifiedAt في جدول User (Prisma). */
export async function verifyPhoneOtpAction(formData: FormData) {
  const locale = await getLocale();
  const tv = ui(locale).verifyPhone;
  const idRaw = String(formData.get("identifier") ?? formData.get("email") ?? "").trim();
  const parsed = verifyOtpSchema.safeParse({
    identifier: idRaw,
    code: String(formData.get("code") ?? "").trim(),
  });
  if (!parsed.success) {
    redirect("/register/verify-phone?error=" + encodeURIComponent(tv.invalid));
  }
  const user = await findUserByIdentifier(parsed.data.identifier);
  if (!user) {
    redirect("/register/verify-phone?error=" + encodeURIComponent(tv.badCode));
  }
  const dev = process.env.VERIFICATION_DEV_OTP?.trim();
  const ok =
    (dev && parsed.data.code === dev) ||
    (user.phoneOtpCode === parsed.data.code &&
      user.phoneOtpExpires &&
      user.phoneOtpExpires.getTime() > Date.now());
  if (!ok) {
    const idParam =
      "identifier=" + encodeURIComponent(parsed.data.identifier);
    redirect(`/register/verify-phone?error=${encodeURIComponent(tv.badCode)}&${idParam}`);
  }
  await prisma.user.update({
    where: { id: user.id },
    data: {
      phoneVerifiedAt: new Date(),
      phoneOtpCode: null,
      phoneOtpExpires: null,
    },
  });
  const me = await getCurrentUser();
  redirect(me ? "/dashboard" : "/login");
}

/** يولّد OTP ويخزّنه في User — لاحقاً يُرسل عبر SMS (Twilio) من نفس المسار أو خدمة خارجية. */
export async function sendPhoneOtpAction() {
  const locale = await getLocale();
  const t = ui(locale).profile;
  const me = await getCurrentUser();
  if (!me) redirect("/login?next=/profile");
  if (!me.phone?.trim()) {
    redirect("/profile?error=" + encodeURIComponent(t.needPhoneForOtp));
  }
  const code = String(randomInt(100000, 999999));
  await prisma.user.update({
    where: { id: me.id },
    data: {
      phoneOtpCode: code,
      phoneOtpExpires: new Date(Date.now() + 10 * 60 * 1000),
    },
  });
  const sms = await sendPhoneOtpSms(me.phone, code, locale);
  if (!sms.ok) {
    console.info(`[Amarati] Phone OTP for ${me.phone} (dev log): ${code}`);
  }
  const idQ = me.email
    ? "email=" + encodeURIComponent(me.email)
    : "identifier=" + encodeURIComponent(me.phone);
  const errQ =
    sms.ok === false && sms.reason === "send_failed"
      ? "&error=" + encodeURIComponent(t.smsSendFailed)
      : sms.ok === false && sms.reason === "not_configured"
        ? "&error=" + encodeURIComponent(t.smsNotConfigured)
        : "";
  redirect(`/register/verify-phone?${idQ}&sent=1${errQ}`);
}
