import type { AppLocale } from "./locale";

export function getAppBaseUrl(): string | null {
  const base =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "");
  return base || null;
}

export function buildVerificationUrl(token: string): string | null {
  const base = getAppBaseUrl();
  if (!base) return null;
  return `${base}/verify-email?token=${encodeURIComponent(token)}`;
}

/**
 * مفتاح Resend بعد تجاهل القيم الوهمية (مثل re_PASTE_YOUR_KEY_HERE).
 */
export function getConfiguredResendApiKey(): string | null {
  const k = process.env.RESEND_API_KEY?.trim();
  if (!k) return null;
  if (!k.startsWith("re_")) return null;
  if (k.length < 12) return null;
  if (/paste|placeholder|your_key|xxx/i.test(k)) return null;
  return k;
}

/**
 * التحقق من البريد عند التسجيل مفعّل افتراضياً.
 * عطّله بـ REQUIRE_EMAIL_VERIFICATION=false (مثلاً بيئة تجريبية بدون بريد).
 */
export function isEmailVerificationRequired(): boolean {
  const flag = process.env.REQUIRE_EMAIL_VERIFICATION?.trim().toLowerCase();
  if (flag === "false" || flag === "0") return false;
  return true;
}

async function postResend(
  apiKey: string,
  to: string,
  subject: string,
  html: string
): Promise<{ ok: true } | { ok: false; reason: "send_failed" }> {
  const from = process.env.RESEND_FROM_EMAIL?.trim() || "onboarding@resend.dev";
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to: [to], subject, html }),
  });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    console.error("Resend error", res.status, t);
    return { ok: false, reason: "send_failed" };
  }
  return { ok: true };
}

function verificationEmailContent(link: string, locale: AppLocale): { subject: string; html: string } {
  if (locale === "en") {
    return {
      subject: "Confirm your email — Amarati",
      html: `<p>Confirm your email for Amarati:</p><p><a href="${link}">Confirm email</a></p><p>If you did not sign up, you can ignore this message.</p>`,
    };
  }
  return {
    subject: "تأكيد بريدك — عَمارتي",
    html: `<p>اضغط للتحقق من بريدك:</p><p><a href="${link}">تأكيد البريد</a></p><p>إن لم تطلب ذلك، تجاهل الرسالة.</p>`,
  };
}

/**
 * إرسال عبر Resend إن وُجد مفتاح صالح؛ وفي التطوير بدون مفتاح يُطبع الرابط في الطرفية.
 */
export async function deliverVerificationEmail(
  to: string,
  token: string,
  locale: AppLocale
): Promise<{ ok: true } | { ok: false; reason: "no_base_url" | "send_failed" | "no_sender" }> {
  const link = buildVerificationUrl(token);
  if (!link) return { ok: false, reason: "no_base_url" };

  const apiKey = getConfiguredResendApiKey();
  if (apiKey) {
    const { subject, html } = verificationEmailContent(link, locale);
    return postResend(apiKey, to, subject, html);
  }

  if (process.env.NODE_ENV === "development") {
    console.warn(
      `\n[amarati] Email verification (لا يوجد RESEND_API_KEY صالح — وضع التطوير):\n  To: ${to}\n  ${link}\n`
    );
    return { ok: true };
  }

  return { ok: false, reason: "no_sender" };
}

/** @deprecated use deliverVerificationEmail */
export async function sendVerificationEmail(to: string, token: string, locale: AppLocale = "ar") {
  return deliverVerificationEmail(to, token, locale);
}
