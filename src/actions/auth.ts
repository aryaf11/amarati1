"use server";

/**
 * تسجيل الدخول/الخروج وتحديث الملف الشخصي (بدون خطوات تحقق بالجوال).
 * الربط مع PostgreSQL: جميع دوال `prisma.user.*` وفق `schema.prisma` → model User.
 */
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { dbOrSessionErrorHint, flattenError } from "@/lib/action-error-hints";
import { getCurrentUser } from "@/lib/current-user";
import { getLocale } from "@/lib/locale";
import { hashPassword, verifyPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { createSession, destroySession } from "@/lib/session";
import { ui } from "@/lib/ui-strings";

async function findUserByIdentifier(identifier: string) {
  const trimmed = identifier.trim();
  if (trimmed.includes("@")) {
    return prisma.user.findUnique({ where: { email: trimmed.toLowerCase() } });
  }
  const phone = trimmed.replace(/\s+/g, "");
  return prisma.user.findUnique({ where: { phone } });
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
        phoneVerifiedAt: new Date(),
        phoneOtpCode: null,
        phoneOtpExpires: null,
      },
    });
    await createSession(user.id);
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
        phoneVerifiedAt: new Date(),
        phoneOtpCode: null,
        phoneOtpExpires: null,
      },
    });
  } catch (e) {
    if (isRedirectError(e)) throw e;
    console.error("updateProfileAction", flattenError(e), e);
    redirect("/profile?error=" + encodeURIComponent(dbOrSessionErrorHint(e).trim()));
  }
  redirect("/profile?saved=1");
}
