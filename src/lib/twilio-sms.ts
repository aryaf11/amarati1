/**
 * إرسال SMS عبر Twilio (اختياري). عند غياب المتغيرات يُعاد «غير مهيأ».
 *
 * TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN
 * وإما TWILIO_FROM_NUMBER (E.164) أو TWILIO_MESSAGING_SERVICE_SID
 */

export function isTwilioSmsConfigured(): boolean {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM_NUMBER;
  const svc = process.env.TWILIO_MESSAGING_SERVICE_SID;
  return Boolean(sid && token && (from || svc));
}

export async function sendTwilioSms(
  toE164: string,
  body: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!isTwilioSmsConfigured()) {
    return { ok: false, error: "twilio_not_configured" };
  }
  const sid = process.env.TWILIO_ACCOUNT_SID!;
  const token = process.env.TWILIO_AUTH_TOKEN!;
  const auth = Buffer.from(`${sid}:${token}`).toString("base64");
  const params = new URLSearchParams();
  params.set("To", toE164);
  params.set("Body", body);
  if (process.env.TWILIO_MESSAGING_SERVICE_SID) {
    params.set("MessagingServiceSid", process.env.TWILIO_MESSAGING_SERVICE_SID);
  } else {
    params.set("From", process.env.TWILIO_FROM_NUMBER!);
  }
  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });
  if (!res.ok) {
    const text = await res.text();
    return { ok: false, error: text.slice(0, 200) };
  }
  return { ok: true };
}

/** يحوّل 05xxxxxxxx إلى +9665xxxxxxxx */
export function normalizeSaudiMsisdn(raw: string): string | null {
  const d = raw.replace(/\D/g, "");
  if (d.length === 10 && d.startsWith("05")) return `+966${d.slice(1)}`;
  if (d.length === 12 && d.startsWith("966")) return `+${d}`;
  if (d.length === 9 && d.startsWith("5")) return `+966${d}`;
  if (raw.startsWith("+") && d.length >= 10) return `+${d}`;
  return null;
}
