/**
 * طبقة موحّدة لإرسال رمز التحقق إلى الجوال — تجرّب المزوّدات بالترتيب:
 *   1) WhatsApp Cloud API (إن وُجدت WHATSAPP_ACCESS_TOKEN + WHATSAPP_PHONE_NUMBER_ID)
 *   2) Twilio SMS (إن وُجدت TWILIO_ACCOUNT_SID + TWILIO_AUTH_TOKEN + FROM/MessagingService)
 *
 * يمكن تثبيت قناة محدّدة عبر OTP_CHANNEL=whatsapp أو OTP_CHANNEL=sms.
 */

import type { AppLocale } from "@/lib/locale";
import {
  isTwilioSmsConfigured,
  normalizeSaudiMsisdn,
  sendTwilioSms,
} from "@/lib/twilio-sms";
import {
  isWhatsappOtpConfigured,
  sendWhatsappOtp,
} from "@/lib/whatsapp-otp";

export type SendOtpResult =
  | { ok: true; channel: "whatsapp" | "sms" }
  | {
      ok: false;
      reason: "not_configured" | "invalid_phone" | "send_failed";
      detail?: string;
    };

function preferredChannel(): "whatsapp" | "sms" | "auto" {
  const v = process.env.OTP_CHANNEL?.trim().toLowerCase();
  if (v === "whatsapp" || v === "wa") return "whatsapp";
  if (v === "sms" || v === "twilio") return "sms";
  return "auto";
}

async function trySms(
  phone: string,
  code: string,
  locale: AppLocale,
): Promise<SendOtpResult> {
  const to = normalizeSaudiMsisdn(phone);
  if (!to) return { ok: false, reason: "invalid_phone" };
  if (!isTwilioSmsConfigured()) return { ok: false, reason: "not_configured" };
  const body =
    locale === "ar"
      ? `رمز التحقق في عَمارتي: ${code} (صالح 10 دقائق)`
      : `Your Amarati verification code: ${code} (valid 10 minutes)`;
  const sent = await sendTwilioSms(to, body);
  if (!sent.ok) return { ok: false, reason: "send_failed", detail: sent.error };
  return { ok: true, channel: "sms" };
}

async function tryWhatsapp(
  phone: string,
  code: string,
  locale: AppLocale,
): Promise<SendOtpResult> {
  const res = await sendWhatsappOtp(phone, code, locale);
  if (res.ok) return { ok: true, channel: "whatsapp" };
  // نوحّد سبب «يحتاج Template» مع «send_failed» لأنّه فشل إرسال فعلي بنظر المتصل.
  const reason =
    res.reason === "needs_template" ? "send_failed" : res.reason;
  return { ok: false, reason, detail: res.detail };
}

/**
 * إرسال رمز التحقق. اسم الدالة محفوظ للتوافق مع الاستدعاءات القائمة.
 * تختار قناة الإرسال تلقائياً: WhatsApp أولاً ثم SMS، أو حسب OTP_CHANNEL.
 */
export async function sendPhoneOtpSms(
  phone: string,
  code: string,
  locale: AppLocale,
): Promise<SendOtpResult> {
  const channel = preferredChannel();

  if (channel === "whatsapp") {
    return tryWhatsapp(phone, code, locale);
  }
  if (channel === "sms") {
    return trySms(phone, code, locale);
  }

  // auto: جرّب WhatsApp إن كان مهيأ، وإلا SMS، وإلا أعِد آخر سبب فشل.
  if (isWhatsappOtpConfigured()) {
    const wa = await tryWhatsapp(phone, code, locale);
    if (wa.ok) return wa;
    if (isTwilioSmsConfigured()) {
      const sms = await trySms(phone, code, locale);
      if (sms.ok) return sms;
    }
    return wa;
  }
  if (isTwilioSmsConfigured()) {
    return trySms(phone, code, locale);
  }
  return { ok: false, reason: "not_configured" };
}
