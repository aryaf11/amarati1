import { isTwilioSmsConfigured, normalizeSaudiMsisdn, sendTwilioSms } from "@/lib/twilio-sms";
import type { AppLocale } from "@/lib/locale";

export async function sendPhoneOtpSms(
  phone: string,
  code: string,
  locale: AppLocale,
): Promise<{ ok: true } | { ok: false; reason: "not_configured" | "invalid_phone" | "send_failed" }> {
  const to = normalizeSaudiMsisdn(phone);
  if (!to) return { ok: false, reason: "invalid_phone" };
  if (!isTwilioSmsConfigured()) return { ok: false, reason: "not_configured" };
  const body =
    locale === "ar"
      ? `رمز التحقق في عَمارتي: ${code} (صالح 10 دقائق)`
      : `Your Amarati verification code: ${code} (valid 10 minutes)`;
  const sent = await sendTwilioSms(to, body);
  if (!sent.ok) return { ok: false, reason: "send_failed" };
  return { ok: true };
}
