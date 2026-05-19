"use server";

/**
 * تسجيل الدخول/الخروج وتحديث الملف الشخصي والتحقق بالجوال (OTP) عبر Twilio Verify أو رمز محلي + SMS/WhatsApp.
 */
import { randomInt } from "node:crypto";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { dbOrSessionErrorHint, flattenError } from "@/lib/action-error-hints";
import { getCurrentUser } from "@/lib/current-user";
import { getLocale } from "@/lib/locale";
import { hashPassword, verifyPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { sendPhoneOtpSms } from "@/lib/sms-otp";
import {
  checkTwilioVerification,
  isTwilioVerifyConfigured,
  messageForVerifySendFailure,
  startTwilioVerification,
} from "@/lib/twilio-verify";
import { createSession, destroySession } from "@/lib/session";
import type { VerifySendResult } from "@/lib/twilio-verify";
import type { SendOtpResult } from "@/lib/sms-otp";
import { ui } from "@/lib/ui-strings";

export async function issuePhoneOtpForUser(
  userId: string,
  phone: string,
  locale: Awaited<ReturnType<typeof getLocale>>,
): Promise<{ code: string | null; sms: VerifySendResult | SendOtpResult }> {
  if (isTwilioVerifyConfigured()) {
    await prisma.user.update({
      where: { id: userId },
      data: {
        phoneOtpCode: null,
        phoneOtpExpires: new Date(Date.now() + 10 * 60 * 1000),
      },
    });
    const res = await startTwilioVerification(phone, locale);
    if (res.ok) {
      console.info(`[Amarati] Twilio Verify → sent sid=${res.sid}`);
    } else {
      console.warn(
        `[Amarati] Twilio Verify FAILED for ${phone}: reason=${res.reason}`,
      );
    }
    return { code: null, sms: res };
  }
  console.info(
    `[Amarati] Local OTP path (Twilio Verify not configured) for ${phone}`,
  );
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
  return { code, sms };
}

function verifyRedirectQs(phone: string, next?: string) {
  const q = new URLSearchParams({ phone: phone.replace(/\s+/g, "") });
  if (next?.startsWith("/") && !next.startsWith("//")) {
    q.set("next", next);
  }
  return q.toString();
}

function verifyPhoneRedirect(phone: string, next?: string) {
  redirect(`/register/verify-phone?${verifyRedirectQs(phone, next)}`);
}

async function findUserByIdentifier(identifier: string) {
  const trimmed = identifier.trim();
  if (trimmed.includes("@")) {
    return prisma.user.findUnique({ where: { email: trimmed.toLowerCase() } });
  }
  const ph = trimmed.replace(/\s+/g, "");
  return prisma.user.findUnique({ where: { phone: ph } });
}

function normalizePhoneInput(raw: string): string {
  return raw.replace(/\s+/g, "");
}

const registerSchema = z.object({
  password: z.string().min(6),
  name: z.string().min(2),
  phone: z.string().trim().min(8).max(24),
  email: z.preprocess(
    (v) => String(v ?? "").trim().toLowerCase(),
    z.union([z.literal(""), z.string().email().max(190)]),
  ),
});

export async function registerAction(formData: FormData) {
  const locale = await getLocale();
  const t = ui(locale);
  const tc = ui(locale).signup;
  const nameRaw = String(formData.get("name") ?? "").trim();
  const passwordRaw = String(formData.get("password") ?? "");
  const phoneRaw = String(formData.get("phone") ?? "").trim();
  const emailRaw = formData.get("email");
  const parsed = registerSchema.safeParse({
    password: passwordRaw,
    name: nameRaw,
    phone: phoneRaw,
    email: emailRaw,
  });
  if (!parsed.success) {
    const fe = parsed.error.flatten().fieldErrors;
    redirect(
      "/login?error=" +
        encodeURIComponent(
          fe.email?.length ? tc.invalidEmail : t.register.invalidForm,
        ),
    );
  }
  const emailNorm =
    parsed.data.email === "" ? null : parsed.data.email;
  const dupPhone = await prisma.user.findUnique({
    where: { phone: parsed.data.phone },
  });
  if (dupPhone) {
    redirect("/login?error=" + encodeURIComponent(t.register.phoneTaken));
  }
  if (emailNorm) {
    const dupEmail = await prisma.user.findUnique({
      where: { email: emailNorm },
    });
    if (dupEmail) {
      redirect("/login?error=" + encodeURIComponent(t.register.emailTaken));
    }
  }
  const passwordHash = await hashPassword(parsed.data.password);
  try {
    const user = await prisma.user.create({
      data: {
        email: emailNorm,
        passwordHash,
        name: parsed.data.name,
        phone: parsed.data.phone,
        accountKind: "RESIDENT",
        emailVerifiedAt: emailNorm ? null : new Date(),
        phoneVerifiedAt: null,
        phoneOtpCode: null,
        phoneOtpExpires: null,
      },
    });
    await issuePhoneOtpForUser(user.id, parsed.data.phone, locale);
    await createSession(user.id);
    verifyPhoneRedirect(parsed.data.phone, "/dashboard");
  } catch (e) {
    if (isRedirectError(e)) throw e;
    console.error("registerAction", flattenError(e), e);
    redirect("/login?error=" + encodeURIComponent(dbOrSessionErrorHint(e).trim()));
  }
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
  const nextRaw = formData.get("next");
  const next =
    typeof nextRaw === "string" &&
    nextRaw.startsWith("/") &&
    !nextRaw.startsWith("//")
      ? nextRaw
      : "/dashboard";

  try {
    const user = await findUserByIdentifier(parsed.data.identifier);

    if (!user) {
      redirect("/login?error=" + encodeURIComponent(t.login.noAccountFull) + "&noAccount=1");
    }
    if (!(await verifyPassword(parsed.data.password, user.passwordHash))) {
      redirect("/login?error=" + encodeURIComponent(t.login.invalidCredentials));
    }

    if (!user.phoneVerifiedAt && user.phone?.trim()) {
      await issuePhoneOtpForUser(user.id, user.phone, locale);
      await createSession(user.id);
      verifyPhoneRedirect(user.phone, next);
    }

    await createSession(user.id);
    redirect(next);
  } catch (e) {
    if (isRedirectError(e)) throw e;
    console.error("loginAction", flattenError(e), e);
    redirect("/login?error=" + encodeURIComponent(dbOrSessionErrorHint(e).trim()));
  }
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
  email: z.preprocess(
    (v) => String(v ?? "").trim().toLowerCase(),
    z.union([z.literal(""), z.string().email().max(190)]),
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
    email: formData.get("email"),
  });
  if (!parsed.success) {
    const fe = parsed.error.flatten().fieldErrors;
    redirect(
      "/profile?error=" +
        encodeURIComponent(
          fe.email?.length ? t.profile.invalidEmail : t.profile.invalidForm,
        ),
    );
  }
  const emailNorm =
    parsed.data.email === "" ? null : parsed.data.email;
  const phoneChanged =
    normalizePhoneInput(parsed.data.phone) !== me.phone.replace(/\s+/g, "");

  try {
    if (emailNorm) {
      const taken = await prisma.user.findFirst({
        where: { email: emailNorm, NOT: { id: me.id } },
      });
      if (taken) {
        redirect(
          "/profile?error=" + encodeURIComponent(t.register.emailTaken),
        );
      }
    }
    await prisma.user.update({
      where: { id: me.id },
      data: {
        name: parsed.data.name,
        phone: parsed.data.phone,
        email: emailNorm,
        emailVerifiedAt: emailNorm ? null : new Date(),
        ...(phoneChanged
          ? {
              phoneVerifiedAt: null,
              phoneOtpCode: null,
              phoneOtpExpires: null,
            }
          : {
              phoneVerifiedAt: me.phoneVerifiedAt,
              phoneOtpCode: null,
              phoneOtpExpires: null,
            }),
      },
    });
    if (phoneChanged && parsed.data.phone.trim()) {
      await issuePhoneOtpForUser(me.id, parsed.data.phone, locale);
      verifyPhoneRedirect(parsed.data.phone, "/profile");
    }
  } catch (e) {
    if (isRedirectError(e)) throw e;
    console.error("updateProfileAction", flattenError(e), e);
    redirect("/profile?error=" + encodeURIComponent(dbOrSessionErrorHint(e).trim()));
  }
  redirect("/profile?saved=1");
}

export async function verifyPhoneOtpAction(formData: FormData) {
  const locale = await getLocale();
  const tv = ui(locale).verifyPhone;
  const phoneRaw = normalizePhoneInput(
    String(formData.get("phone") ?? formData.get("identifier") ?? ""),
  );
  const rawNext = String(formData.get("next") ?? "");
  const safeNext =
    rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/dashboard";

  const parsed = z
    .object({
      phone: z.string().trim().min(8).max(24),
      code: z.string().regex(/^\d{6}$/),
    })
    .safeParse({
      phone: phoneRaw,
      code: String(formData.get("code") ?? "").trim(),
    });
  const qsBase = verifyRedirectQs(
    parsed.success ? parsed.data.phone : phoneRaw,
    safeNext,
  );
  const redirectErr = (msg: string): never =>
    redirect(
      `/register/verify-phone?${qsBase}&error=${encodeURIComponent(msg)}`,
    );

  if (!parsed.success) {
    redirectErr(tv.invalid);
  }
  const vPhone = parsed.data!.phone;
  const vCode = parsed.data!.code;
  if (vPhone.includes("@")) {
    redirectErr(tv.invalid);
  }

  const userRow = await findUserByIdentifier(vPhone);
  if (!userRow) {
    redirectErr(tv.badCode);
  }
  const user = userRow!;
  const dev = process.env.VERIFICATION_DEV_OTP?.trim();
  let ok = Boolean(dev && vCode === dev);
  if (!ok) {
    if (isTwilioVerifyConfigured() && user.phone?.trim()) {
      const check = await checkTwilioVerification(user.phone, vCode);
      ok = check.ok;
    } else {
      ok = Boolean(
        user.phoneOtpCode === vCode &&
          user.phoneOtpExpires &&
          user.phoneOtpExpires.getTime() > Date.now(),
      );
    }
  }
  if (!ok) {
    redirectErr(tv.badCode);
  }
  await prisma.user.update({
    where: { id: user.id },
    data: {
      phoneVerifiedAt: new Date(),
      phoneOtpCode: null,
      phoneOtpExpires: null,
    },
  });
  redirect(safeNext);
}

const resendPhoneOtpSchema = z.object({
  phone: z.string().trim().min(8).max(24),
});

export async function resendPhoneOtpAction(formData: FormData) {
  const locale = await getLocale();
  const tv = ui(locale).verifyPhone;
  const tp = ui(locale).profile;
  const nextRaw = String(formData.get("next") ?? "");
  const nextOk =
    nextRaw.startsWith("/") && !nextRaw.startsWith("//") ? nextRaw : "";

  const phoneRaw = normalizePhoneInput(
    String(formData.get("phone") ?? formData.get("identifier") ?? ""),
  );
  const parsed = resendPhoneOtpSchema.safeParse({ phone: phoneRaw });
  if (!parsed.success || parsed.data.phone.includes("@")) {
    redirect(
      "/register/verify-phone?error=" + encodeURIComponent(tv.invalid),
    );
  }
  const idQ = verifyRedirectQs(parsed.data.phone, nextOk || undefined);
  const user = await findUserByIdentifier(parsed.data.phone);
  if (!user || !user.phone?.trim()) {
    redirect(`/register/verify-phone?${idQ}`);
  }

  if (user.phoneOtpExpires) {
    const issuedAt = user.phoneOtpExpires.getTime() - 10 * 60 * 1000;
    if (Date.now() - issuedAt < 30 * 1000) {
      redirect(`/register/verify-phone?${idQ}&throttled=1`);
    }
  }

  const { sms } = await issuePhoneOtpForUser(user.id, user.phone, locale);
  const isSms = "channel" in sms;
  const failed = sms.ok === false;
  if (failed && isSms) {
    const errMsg =
      sms.reason === "not_configured"
        ? tp.smsNotConfigured
        : sms.reason === "invalid_phone"
          ? tp.needPhoneForOtp
          : tp.smsSendFailed;
    redirect(`/register/verify-phone?${idQ}&error=` + encodeURIComponent(errMsg));
  }
  if (failed && !isSms) {
    redirect(
      `/register/verify-phone?${idQ}&error=` +
        encodeURIComponent(messageForVerifySendFailure(locale, sms)),
    );
  }
  redirect(`/register/verify-phone?${idQ}&sent=1`);
}

export async function sendPhoneOtpAction() {
  const locale = await getLocale();
  const t = ui(locale).profile;
  const me = await getCurrentUser();
  if (!me) redirect("/login?next=/profile");
  if (!me.phone?.trim()) {
    redirect("/profile?error=" + encodeURIComponent(t.needPhoneForOtp));
  }
  await issuePhoneOtpForUser(me.id, me.phone, locale);
  verifyPhoneRedirect(me.phone, "/profile");
}
