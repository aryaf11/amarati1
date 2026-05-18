/**
 * Twilio Verify — خدمة OTP مُدارة (Twilio يُولّد الرمز ويتحقق منه).
 *
 * المتغيّرات المطلوبة في .env:
 *   TWILIO_ACCOUNT_SID         — يبدأ بـ AC...
 *   TWILIO_AUTH_TOKEN          — 32 محرفاً
 *   TWILIO_VERIFY_SERVICE_SID  — يبدأ بـ VA...
 *
 * مزايا Verify مقابل SMS عادي:
 *   • لا يحتاج شراء رقم مُرسِل (TWILIO_FROM_NUMBER غير مطلوب).
 *   • يدير دورة حياة الرمز (التوليد، الإرسال، التحقّق، الانتهاء، إعادة المحاولة).
 *   • يعمل دولياً بدون قيود Geo Permissions الإقليمية المعتادة.
 *   • أرخص للحالات منخفضة الحجم (لا توجد كلفة شهرية للرقم).
 */

import type { AppLocale } from "@/lib/locale";
import { ui } from "@/lib/ui-strings";
import { normalizeSaudiMsisdn } from "@/lib/twilio-sms";

export type VerifySendResult =
  | { ok: true; sid: string }
  | {
      ok: false;
      reason:
        | "not_configured"
        | "invalid_phone"
        | "rate_limited"
        | "send_failed";
      code?: number;
      detail?: string;
    };

export type VerifyCheckResult =
  | { ok: true }
  | {
      ok: false;
      reason:
        | "not_configured"
        | "invalid_phone"
        | "wrong_or_expired"
        | "max_attempts"
        | "check_failed";
      code?: number;
      detail?: string;
    };

export function isTwilioVerifyConfigured(): boolean {
  return Boolean(
    process.env.TWILIO_ACCOUNT_SID?.trim() &&
      process.env.TWILIO_AUTH_TOKEN?.trim() &&
      process.env.TWILIO_VERIFY_SERVICE_SID?.trim(),
  );
}

function basicAuthHeader(): string {
  const sid = process.env.TWILIO_ACCOUNT_SID!.trim();
  const token = process.env.TWILIO_AUTH_TOKEN!.trim();
  return "Basic " + Buffer.from(`${sid}:${token}`).toString("base64");
}

function verifyBaseUrl(): string {
  const svc = process.env.TWILIO_VERIFY_SERVICE_SID!.trim();
  return `https://verify.twilio.com/v2/Services/${encodeURIComponent(svc)}`;
}

function localeCode(locale: AppLocale): string {
  return locale === "ar" ? "ar" : "en";
}

/** يبدأ إجراء التحقق ويُرسل الرمز عبر SMS من خدمة Verify. */
export async function startTwilioVerification(
  phone: string,
  locale: AppLocale,
): Promise<VerifySendResult> {
  if (!isTwilioVerifyConfigured()) return { ok: false, reason: "not_configured" };
  const to = normalizeSaudiMsisdn(phone);
  if (!to) return { ok: false, reason: "invalid_phone" };
  const params = new URLSearchParams({
    To: to,
    Channel: "sms",
    Locale: localeCode(locale),
  });
  let res: Response;
  try {
    res = await fetch(`${verifyBaseUrl()}/Verifications`, {
      method: "POST",
      headers: {
        Authorization: basicAuthHeader(),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });
  } catch (e) {
    return {
      ok: false,
      reason: "send_failed",
      detail: e instanceof Error ? e.message : String(e),
    };
  }
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as {
      code?: number;
      message?: string;
    };
    // 60203 Max send attempts reached / 60212 Too many concurrent requests
    if (body.code === 60203 || body.code === 60212 || res.status === 429) {
      return {
        ok: false,
        reason: "rate_limited",
        code: body.code,
        detail: body.message,
      };
    }
    return {
      ok: false,
      reason: "send_failed",
      code: body.code,
      detail: body.message ?? `HTTP ${res.status}`,
    };
  }
  const data = (await res.json().catch(() => ({}))) as { sid?: string };
  return { ok: true, sid: data.sid ?? "" };
}

/**
 * ترجمة فشل `startTwilioVerification` إلى نصٍ قصير يفهمها المستخدم.
 */
export function messageForVerifySendFailure(
  locale: AppLocale,
  failure: { reason: string; code?: number; detail?: string },
): string {
  const t = ui(locale).verifyPhone;
  const tp = ui(locale).profile;
  const c = failure.code;
  const d = (failure.detail ?? "").toLowerCase();

  if (failure.reason === "invalid_phone") return t.verifyErrorInvalidPhone;
  if (failure.reason === "rate_limited") return t.verifyErrorRateLimit;
  if (failure.reason === "not_configured") return tp.smsNotConfigured;

  if (c === 20003 || d.includes("authentication") || d.includes("invalid username")) {
    return t.verifyErrorAuth;
  }
  if (
    c === 21608 ||
    c === 21610 ||
    c === 21211 ||
    d.includes("unverified") ||
    (d.includes("trial") && d.includes("verify"))
  ) {
    return t.verifyErrorTrial;
  }
  if (c === 60203 || c === 60212) return t.verifyErrorRateLimit;
  if (c === 60200) return t.verifyErrorInvalidPhone;

  return t.verifyErrorGeneric;
}

/** يتحقّق من الرمز الذي أدخله المستخدم. */
export async function checkTwilioVerification(
  phone: string,
  code: string,
): Promise<VerifyCheckResult> {
  if (!isTwilioVerifyConfigured()) return { ok: false, reason: "not_configured" };
  const to = normalizeSaudiMsisdn(phone);
  if (!to) return { ok: false, reason: "invalid_phone" };
  const params = new URLSearchParams({ To: to, Code: code });
  let res: Response;
  try {
    res = await fetch(`${verifyBaseUrl()}/VerificationCheck`, {
      method: "POST",
      headers: {
        Authorization: basicAuthHeader(),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });
  } catch (e) {
    return {
      ok: false,
      reason: "check_failed",
      detail: e instanceof Error ? e.message : String(e),
    };
  }
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as {
      code?: number;
      message?: string;
    };
    // 60202 Max check attempts reached
    if (body.code === 60202) {
      return {
        ok: false,
        reason: "max_attempts",
        code: body.code,
        detail: body.message,
      };
    }
    // 20404 / 60410 Verification not found (expired/already approved/canceled)
    if (body.code === 20404 || body.code === 60410) {
      return {
        ok: false,
        reason: "wrong_or_expired",
        code: body.code,
        detail: body.message,
      };
    }
    return {
      ok: false,
      reason: "check_failed",
      code: body.code,
      detail: body.message ?? `HTTP ${res.status}`,
    };
  }
  const data = (await res.json().catch(() => ({}))) as {
    status?: string;
    valid?: boolean;
  };
  if (data.status === "approved" || data.valid === true) {
    return { ok: true };
  }
  return { ok: false, reason: "wrong_or_expired" };
}
