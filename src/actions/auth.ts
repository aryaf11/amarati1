"use server";

/**
 * تسجيل الدخول والخروج وتحديث الملف الشخصي.
 */
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { dbOrSessionErrorHint, flattenError } from "@/lib/action-error-hints";
import { getCurrentUser } from "@/lib/current-user";
import { getLocale } from "@/lib/locale";
import { verifyPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { createSession, destroySession } from "@/lib/session";
import { ui } from "@/lib/ui-strings";

async function findUserByIdentifier(identifier: string) {
  const trimmed = identifier.trim();
  if (trimmed.includes("@")) {
    return prisma.user.findUnique({ where: { email: trimmed.toLowerCase() } });
  }
  const ph = trimmed.replace(/\s+/g, "");
  return prisma.user.findUnique({ where: { phone: ph } });
}

const loginSchema = z.object({
  identifier: z.string().min(3),
  password: z.string().min(1),
});

export async function loginAction(formData: FormData) {
  const locale = await getLocale();
  const t = ui(locale);
  const parsed = loginSchema.safeParse({
    identifier: String(
      formData.get("identifier") ?? formData.get("email") ?? "",
    ).trim(),
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
      redirect(
        "/login?error=" + encodeURIComponent(t.login.noAccountFull) + "&noAccount=1",
      );
    }
    if (!(await verifyPassword(parsed.data.password, user.passwordHash))) {
      redirect("/login?error=" + encodeURIComponent(t.login.invalidCredentials));
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
  const emailNorm = parsed.data.email === "" ? null : parsed.data.email;

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
