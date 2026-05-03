"use server";

import { isRedirectError } from "next/dist/client/components/redirect-error";
import { redirect } from "next/navigation";
import { z } from "zod";
import { hashPassword, verifyPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { createSession, destroySession } from "@/lib/session";

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(2),
  phone: z.string().optional(),
});

export async function registerAction(formData: FormData) {
  const parsed = registerSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    name: formData.get("name"),
    phone: formData.get("phone") || undefined,
  });
  if (!parsed.success) {
    redirect("/register?error=" + encodeURIComponent("بيانات غير صالحة"));
  }
  const exists = await prisma.user.findUnique({
    where: { email: parsed.data.email },
  });
  if (exists) {
    redirect("/register?error=" + encodeURIComponent("البريد مسجل مسبقاً"));
  }
  const passwordHash = await hashPassword(parsed.data.password);
  try {
    const user = await prisma.user.create({
      data: {
        email: parsed.data.email,
        passwordHash,
        name: parsed.data.name,
        phone: parsed.data.phone,
        accountKind: "RESIDENT",
      },
    });
    await createSession(user.id);
  } catch (e) {
    if (isRedirectError(e)) throw e;
    console.error("registerAction", e);
    const hint =
      e instanceof Error && /AUTH_SECRET|must be set/i.test(e.message)
        ? "متغير AUTH_SECRET غير مضبوط في الاستضافة (مطلوب 16 محرفاً على الأقل)."
        : "تعذّر الاتصال بقاعدة البيانات أو إكمال الجلسة. تأكد من DATABASE_URL (PostgreSQL) في Netlify.";
    redirect("/register?error=" + encodeURIComponent(hint));
  }
  redirect("/dashboard");
}

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function loginAction(formData: FormData) {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    redirect("/login?error=" + encodeURIComponent("بيانات غير صالحة"));
  }
  try {
    const user = await prisma.user.findUnique({
      where: { email: parsed.data.email },
    });
    if (!user || !(await verifyPassword(parsed.data.password, user.passwordHash))) {
      redirect("/login?error=" + encodeURIComponent("بريد أو كلمة مرور غير صحيحة"));
    }
    await createSession(user.id);
    const next = formData.get("next");
    if (typeof next === "string" && next.startsWith("/") && !next.startsWith("//")) {
      redirect(next);
    }
    redirect("/dashboard");
  } catch (e) {
    if (isRedirectError(e)) throw e;
    console.error("loginAction", e);
    redirect(
      "/login?error=" +
        encodeURIComponent(
          "خطأ في الخادم. تحقق من AUTH_SECRET و DATABASE_URL في إعدادات الاستضافة."
        )
    );
  }
}

export async function logoutAction() {
  await destroySession();
  redirect("/");
}
