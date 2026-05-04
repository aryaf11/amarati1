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
  let k = process.env.RESEND_API_KEY?.trim();
  if (!k) return null;
  if ((k.startsWith('"') && k.endsWith('"')) || (k.startsWith("'") && k.endsWith("'"))) {
    k = k.slice(1, -1).trim();
  }
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

/** نص للمطابقة من جسم الاستجابة (قد يكون JSON من Resend). */
function resendErrorText(body: string): string {
  const raw = body.toLowerCase();
  try {
    const j = JSON.parse(body) as { message?: string; name?: string };
    const m = (j.message ?? "").toLowerCase();
    const n = (j.name ?? "").toLowerCase();
    return `${raw} ${m} ${n}`;
  } catch {
    return raw;
  }
}

/** يطابق رسائل Resend المعروفة (انظر docs/api-reference/errors). */
function resendFailureKind(
  status: number,
  body: string
):
  | "testing_recipient_only"
  | "from_domain_unverified"
  | "invalid_key"
  | "blocked_disposable_domain"
  | "generic" {
  const b = resendErrorText(body);
  if (status === 401 || (status === 403 && b.includes("invalid api key"))) {
    return "invalid_key";
  }
  if (
    status === 403 &&
    (b.includes("only send testing emails") ||
      b.includes("your own email address") ||
      b.includes("testing emails to your own"))
  ) {
    return "testing_recipient_only";
  }
  if (status === 403 && (b.includes("domain is not verified") || b.includes("verify a domain"))) {
    return "from_domain_unverified";
  }
  if (
    status === 422 &&
    (b.includes("example.com") || b.includes("test.com") || b.includes("@example"))
  ) {
    return "blocked_disposable_domain";
  }
  return "generic";
}

async function postResend(
  apiKey: string,
  to: string,
  subject: string,
  html: string
): Promise<
  | { ok: true }
  | { ok: false; reason: "send_failed" }
  | { ok: false; reason: "resend_testing_recipient_only" }
  | { ok: false; reason: "resend_from_domain" }
  | { ok: false; reason: "resend_invalid_api_key" }
  | { ok: false; reason: "resend_blocked_recipient" }
> {
  const from = process.env.RESEND_FROM_EMAIL?.trim() || "onboarding@resend.dev";
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from, to: [to], subject, html }),
      signal: AbortSignal.timeout(25_000),
    });
    if (!res.ok) {
      const t = await res.text().catch(() => "");
      console.error("Resend error", res.status, t);
      const kind = resendFailureKind(res.status, t);
      if (kind === "testing_recipient_only") return { ok: false, reason: "resend_testing_recipient_only" };
      if (kind === "from_domain_unverified") return { ok: false, reason: "resend_from_domain" };
      if (kind === "invalid_key") return { ok: false, reason: "resend_invalid_api_key" };
      if (kind === "blocked_disposable_domain") return { ok: false, reason: "resend_blocked_recipient" };
      return { ok: false, reason: "send_failed" };
    }
    return { ok: true };
  } catch (e) {
    console.error("Resend request failed", e);
    return { ok: false, reason: "send_failed" };
  }
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
): Promise<
  | { ok: true }
  | {
      ok: false;
      reason:
        | "no_base_url"
        | "send_failed"
        | "no_sender"
        | "resend_testing_recipient_only"
        | "resend_from_domain"
        | "resend_invalid_api_key"
        | "resend_blocked_recipient";
    }
> {
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
