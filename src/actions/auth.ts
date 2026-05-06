"use server";

import { randomBytes } from "node:crypto";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { redirect } from "next/navigation";
import { z } from "zod";
import { dbOrSessionErrorHint, flattenError } from "@/lib/action-error-hints";
import { getCurrentUser } from "@/lib/current-user";
import { getLocale } from "@/lib/locale";
import { hashPassword, verifyPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { deliverVerificationEmail, isEmailVerificationRequired } from "@/lib/send-verification-email";
import { createSession, destroySession } from "@/lib/session";
import { ui } from "@/lib/ui-strings";

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
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(2),
  phone: z.string().optional(),
});

export async function registerAction(formData: FormData) {
  const locale = await getLocale();
  const t = ui(locale);
  const emailRaw = String(formData.get("email") ?? "").trim();
  const nameRaw = String(formData.get("name") ?? "").trim();
  const passwordRaw = String(formData.get("password") ?? "");
  const phoneRaw = String(formData.get("phone") ?? "").trim();
  const parsed = registerSchema.safeParse({
    email: emailRaw,
    password: passwordRaw,
    name: nameRaw,
    phone: phoneRaw || undefined,
  });
  if (!parsed.success) {
    redirect("/login?error=" + encodeURIComponent(t.register.invalidForm));
  }
  const exists = await prisma.user.findUnique({
    where: { email: parsed.data.email },
  });
  if (exists) {
    redirect("/login?error=" + encodeURIComponent(t.register.emailTaken));
  }
  const passwordHash = await hashPassword(parsed.data.password);
  const gate = isEmailVerificationRequired();
  const verifyToken = gate ? randomBytes(24).toString("base64url") : null;
  try {
    const user = await prisma.user.create({
      data: {
        email: parsed.data.email,
        passwordHash,
        name: parsed.data.name,
        phone: parsed.data.phone?.trim() ? parsed.data.phone.trim() : null,
        accountKind: "RESIDENT",
        emailVerifiedAt: gate ? null : new Date(),
        emailVerifyToken: verifyToken,
        emailVerifyExpires: gate ? new Date(Date.now() + 86400000) : null,
      },
    });
    if (gate && verifyToken) {
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
  } catch (e) {
    if (isRedirectError(e)) throw e;
    console.error("registerAction", flattenError(e), e);
    redirect("/login?error=" + encodeURIComponent(dbOrSessionErrorHint(e)));
  }
  redirect("/dashboard");
}

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function loginAction(formData: FormData) {
  const locale = await getLocale();
  const t = ui(locale);
  const parsed = loginSchema.safeParse({
    email: String(formData.get("email") ?? "").trim(),
    password: String(formData.get("password") ?? ""),
  });
  if (!parsed.success) {
    redirect("/login?error=" + encodeURIComponent(t.login.invalidForm));
  }
  try {
    const user = await prisma.user.findUnique({
      where: { email: parsed.data.email },
    });

    if (!user) {
      redirect("/login?error=" + encodeURIComponent(t.login.noAccountFull) + "&noAccount=1");
    }
    if (!(await verifyPassword(parsed.data.password, user.passwordHash))) {
      redirect("/login?error=" + encodeURIComponent(t.login.invalidCredentials));
    }
    if (isEmailVerificationRequired() && !user.emailVerifiedAt) {
      redirect("/login?error=" + encodeURIComponent(t.login.verifyEmailFirst));
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
    redirect("/login?error=" + encodeURIComponent(dbOrSessionErrorHint(e)));
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

const profileSchema = z.object({
  name: z.string().min(2).max(120),
  phone: z
    .preprocess(
      (v) => (v == null || String(v).trim() === "" ? undefined : String(v).trim()),
      z.union([z.undefined(), z.string().max(40)]),
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
  });
  if (!parsed.success) {
    redirect("/profile?error=" + encodeURIComponent(t.profile.invalidForm));
  }
  try {
    await prisma.user.update({
      where: { id: me.id },
      data: {
        name: parsed.data.name,
        phone: parsed.data.phone ?? null,
      },
    });
  } catch (e) {
    if (isRedirectError(e)) throw e;
    console.error("updateProfileAction", flattenError(e), e);
    redirect("/profile?error=" + encodeURIComponent(dbOrSessionErrorHint(e)));
  }
  redirect("/profile?saved=1");
}
