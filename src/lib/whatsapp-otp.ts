/**
 * إرسال رمز التحقق عبر WhatsApp Cloud API (Meta).
 *
 * المتغيّرات المطلوبة في .env:
 *   WHATSAPP_ACCESS_TOKEN        — Permanent token (System User) أو Temporary Token (24h)
 *   WHATSAPP_PHONE_NUMBER_ID     — معرّف رقم WhatsApp المُصدِر (من لوحة Meta)
 *
 * اختيارية للإنتاج (موصى به):
 *   WHATSAPP_OTP_TEMPLATE_NAME   — اسم Authentication Template معتمد من Meta
 *   WHATSAPP_OTP_TEMPLATE_LANG   — كود اللغة (مثال: "ar" أو "en_US"). الافتراضي يُختار من locale.
 *   WHATSAPP_API_VERSION         — افتراضياً "v21.0"
 *
 * تنبيه — قيود Meta:
 *   • وضع التطوير: يعمل النص الحرّ مع الأرقام المُضافة في قائمة Test Recipients فقط.
 *   • الإنتاج: يجب استخدام Authentication Template مُعتمَد من Meta لإرسال OTP لأي رقم.
 *     سيحوّل هذا الملف تلقائياً إلى وضع القالب إذا تم ضبط WHATSAPP_OTP_TEMPLATE_NAME.
 */

import type { AppLocale } from "@/lib/locale";

export type WhatsappSendResult =
  | { ok: true }
  | {
      ok: false;
      reason:
        | "not_configured"
        | "invalid_phone"
        | "send_failed"
        | "needs_template";
      detail?: string;
    };

export function isWhatsappOtpConfigured(): boolean {
  return Boolean(
    process.env.WHATSAPP_ACCESS_TOKEN?.trim() &&
      process.env.WHATSAPP_PHONE_NUMBER_ID?.trim(),
  );
}

/** WhatsApp Cloud API يتوقّع الرقم بدون "+" وبصيغة E.164 (مثلاً 9665XXXXXXXX). */
export function toWhatsappRecipient(toE164OrLocal: string): string | null {
  const trimmed = toE164OrLocal.trim();
  const digits = trimmed.replace(/\D/g, "");
  if (trimmed.startsWith("+") && digits.length >= 10) return digits;
  if (digits.length === 10 && digits.startsWith("05")) return `966${digits.slice(1)}`;
  if (digits.length === 12 && digits.startsWith("966")) return digits;
  if (digits.length === 9 && digits.startsWith("5")) return `966${digits}`;
  if (digits.length >= 10) return digits;
  return null;
}

function apiUrl(): string {
  const version = process.env.WHATSAPP_API_VERSION?.trim() || "v21.0";
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID!.trim();
  return `https://graph.facebook.com/${version}/${encodeURIComponent(phoneId)}/messages`;
}

function authHeaders(): Record<string, string> {
  return {
    Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN!.trim()}`,
    "Content-Type": "application/json",
  };
}

/** يرسل OTP عبر Authentication Template (الموصى به للإنتاج). */
async function sendOtpViaTemplate(
  to: string,
  code: string,
  locale: AppLocale,
): Promise<WhatsappSendResult> {
  const templateName = process.env.WHATSAPP_OTP_TEMPLATE_NAME!.trim();
  const langCode =
    process.env.WHATSAPP_OTP_TEMPLATE_LANG?.trim() ||
    (locale === "ar" ? "ar" : "en_US");
  const body = {
    messaging_product: "whatsapp",
    to,
    type: "template",
    template: {
      name: templateName,
      language: { code: langCode },
      components: [
        {
          type: "body",
          parameters: [{ type: "text", text: code }],
        },
        {
          type: "button",
          sub_type: "url",
          index: "0",
          parameters: [{ type: "text", text: code }],
        },
      ],
    },
  };
  const res = await fetch(apiUrl(), {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    return { ok: false, reason: "send_failed", detail: text.slice(0, 300) };
  }
  return { ok: true };
}

/** يرسل OTP كرسالة نصية حرّة (للتطوير فقط؛ يتطلب أن يكون الرقم ضمن Test Recipients). */
async function sendOtpViaText(
  to: string,
  code: string,
  locale: AppLocale,
): Promise<WhatsappSendResult> {
  const text =
    locale === "ar"
      ? `رمز التحقق في عَمارتي: ${code}\n(صالح 10 دقائق — لا تُشاركه مع أحد)`
      : `Your Amarati verification code: ${code}\n(valid 10 minutes — do not share)`;
  const body = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to,
    type: "text",
    text: { preview_url: false, body: text },
  };
  const res = await fetch(apiUrl(), {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const raw = await res.text();
    // الخطأ النموذجي عند استخدام نص حرّ لرقم غير ضمن Test Recipients (في الإنتاج
    // ولأي رقم لم يبدأ محادثة خلال 24 ساعة) هو 131047 / 131026 من Meta. نقترح القالب.
    if (/131047|131026|re-?engagement|outside the allowed window/i.test(raw)) {
      return {
        ok: false,
        reason: "needs_template",
        detail: raw.slice(0, 300),
      };
    }
    return { ok: false, reason: "send_failed", detail: raw.slice(0, 300) };
  }
  return { ok: true };
}

export async function sendWhatsappOtp(
  phone: string,
  code: string,
  locale: AppLocale,
): Promise<WhatsappSendResult> {
  if (!isWhatsappOtpConfigured()) return { ok: false, reason: "not_configured" };
  const to = toWhatsappRecipient(phone);
  if (!to) return { ok: false, reason: "invalid_phone" };
  try {
    if (process.env.WHATSAPP_OTP_TEMPLATE_NAME?.trim()) {
      return await sendOtpViaTemplate(to, code, locale);
    }
    return await sendOtpViaText(to, code, locale);
  } catch (e) {
    return {
      ok: false,
      reason: "send_failed",
      detail: e instanceof Error ? e.message : String(e),
    };
  }
}
