"use server";

import {
  issueLabel,
  looksLikeMaintenanceQuery,
  predictFailure,
  recommendServices,
  textToFeatures,
  type FailureClass,
} from "@/lib/maintenance-predictor";
import { getLocale } from "@/lib/locale";
import type { AppLocale } from "@/lib/locale";

const FAQ: Record<AppLocale, { match: (m: string) => boolean; reply: string }[]> = {
  ar: [
    {
      match: (m) => m.includes("مشرف") || m.includes("supervisor"),
      reply:
        "منشئ المبنى يعيّن مشرفاً من لوحة المبنى. إن لم يوجد مشرف، يمكن فتح تصويت للملاك من قسم «تصويت».",
    },
    {
      match: (m) => m.includes("دفع") || m.includes("payment") || m.includes("اشتراك"),
      reply:
        "قسم «المدفوعات» يعرض سجلّك داخل المبنى. الدفع الحقيقي يتطلب ربط بوابة دفع لاحقاً؛ حالياً يوجد زر تجريبي للتسجيل.",
    },
    {
      match: (m) => m.includes("تصويت") || m.includes("vote"),
      reply:
        "من قسم «تصويت» يمكنك بدء قرار جديد للمبنى، أو التصويت على القرارات المفتوحة كأحد الملّاك.",
    },
  ],
  en: [
    {
      match: (m) => m.includes("supervisor") || m.includes("manager"),
      reply:
        "The building creator assigns a supervisor from the building dashboard. If there is none, owners can start a vote in the Voting section.",
    },
    {
      match: (m) => m.includes("payment") || m.includes("fee") || m.includes("subscription"),
      reply:
        "The Payments section shows your record inside the building. Real payments will require a future gateway integration; for now there is a demo button to log a payment.",
    },
    {
      match: (m) => m.includes("vote") || m.includes("voting") || m.includes("decision"),
      reply:
        "From the Voting section you can start a new building decision, or vote on open decisions as an owner.",
    },
  ],
};

const FALLBACK: Record<AppLocale, string> = {
  ar: "أنا مساعد عَمارتي: اسأل عن الصيانة (مثل: «عندي تسريب ماء» أو «عطل كهربائي»)، المشرف، التصويت، أو المدفوعات.",
  en: "I'm the Amarati assistant. Ask me about maintenance (e.g. \"I have a water leak\" or \"electrical issue\"), supervisor, voting, or payments.",
};

function formatPrediction(
  message: string,
  locale: AppLocale,
): string {
  const features = textToFeatures(message, "");
  const issue: FailureClass = predictFailure(features);
  const recs = recommendServices(issue, 3);
  const label = issueLabel(issue, locale);

  if (locale === "en") {
    if (issue === "No_Issue") {
      return [
        `Predicted issue: ${label}.`,
        "Could you describe the symptoms more precisely (water, electricity, walls, drainage, roof)? I can suggest contractors in Makkah for each case.",
      ].join("\n");
    }
    const lines = recs
      .map((r, i) => `${i + 1}. ${r.company} — ⭐ ${r.rating.toFixed(1)}`)
      .join("\n");
    return [
      `Predicted issue (Amarati ML, RandomForest model): ${label}.`,
      "",
      "Recommended technicians in Makkah:",
      lines,
      "",
      "You can open the Maintenance section inside your building to log this request and notify the supervisor.",
    ].join("\n");
  }

  if (issue === "No_Issue") {
    return [
      `نتيجة النموذج التنبؤي: ${label}.`,
      "اوصف الأعراض بدقة أكبر (ماء، كهرباء، جدران، صرف، سقف) لأرشّح فنيّين مختصّين في مكة المكرمة.",
    ].join("\n");
  }
  const lines = recs
    .map((r, i) => `${i + 1}. ${r.company} — ⭐ ${r.rating.toFixed(1)}`)
    .join("\n");
  return [
    `نتيجة النموذج التنبؤي (نموذج عَمارتي — RandomForest): ${label}.`,
    "",
    "فنيّون موصى بهم في مكة المكرمة:",
    lines,
    "",
    "يمكنك فتح قسم «صيانة» داخل المبنى لإنشاء طلب رسمي وإبلاغ المشرف.",
  ].join("\n");
}

export async function chatbotReplyAction(message: string) {
  const locale = await getLocale();
  const m = (message || "").toLowerCase();
  if (!m.trim()) return FALLBACK[locale];

  for (const item of FAQ[locale]) {
    if (item.match(m)) return item.reply;
  }

  if (looksLikeMaintenanceQuery(m)) {
    return formatPrediction(message, locale);
  }

  return FALLBACK[locale];
}
