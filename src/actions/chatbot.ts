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
      match: (m) =>
        /انضم|رمز\s*المبن|كود\s*المبن|دعوه|invite|join|building\s*code/.test(m),
      reply:
        "للانضمام لعمارتك التي لست منشئها: من لوحة التحكم (أو خطوة «إنشاء حساب») اختر «الانضمام برمز المبنى»، وأدخل الرمز الذي يمنحُك المنشِئ أو مشرف ثم رقم الوحدة. الرمز موجود أيضًا في بطاقة «دعوات / رمز المبنى» داخل عمارتك بعد أن تنضم لأول عمارة.",
    },
    {
      match: (m) =>
        m.includes("مشرف") ||
        m.includes("supervisor") ||
        /تعين\s*مشرف/.test(m),
      reply:
        "منشئ المبنى يعيّن مشرفًا من قسم «تصويت» (أدوات منشئ المبنى) أو يفتح تصويتًا للمالكين اختيار مشرف.",
    },
    {
      match: (m) => /صيانه|صيانة|maintenance/.test(m) && !looksLikeMaintenanceQuery(m),
      reply:
        "من صفحة المبنى افتح «صيانة» لإنشاء طلب شخصي لشقتك أو طلبًا مجتمعيًا؛ يمكن إرفاق تحليل وتوصيات من المساعد عند الطلب.",
    },
    {
      match: (m) => /تصويت|قرار مجتمع|vote/.test(m),
      reply:
        "قسم «تصويت» يعرض جلسات اختيار مشرف ومزوّدي صيانة للطلبات المجتمعية — صوّت كمالك ضمن مهلة الانتهاء الظاهرة تحت كل جلسة.",
    },
    {
      match: (m) =>
        /اعلان|إعلان|announcement/.test(m) || /محادث|شات\s*السكان|chat/.test(m),
      reply:
        "«إعلانات» لنشر رسائل موسّعة؛ «محادثة السكان» لمحادثة مختصرة داخل المبنى. كلاهما داخل عمارتك من شريط التنقل.",
    },
    {
      match: (m) => /جواز|passport|سجل\s*الشقه|سجل\s*الشقة/.test(m),
      reply:
        "«جواز الشقة» يعرض أحداث الصيانة المرتبطة بوحدتك — من الملف الشخصي أو من صفحة المبنى.",
    },
    {
      match: (m) => /الحساب|الملف|اعدادات|إعدادات|اشعار|إشعار|مظهر|ثيم|theme|profile/.test(m),
      reply:
        "من «الحساب» في الأعلى يمكنك تعديل الاسم والجوال والبريد، وتغيير المظهر والإشعارات في بطاقة الإعدادات أسفل الصفحة. لغة العرض لا تُغيَّر هنا بل من أيقونة الكرة الأرضية في الشريط العلوي.",
    },
    {
      match: (m) =>
        /دفع|payment|اشتراك|subscription|فودافون|visa|stripe/.test(m),
      reply:
        "التطبيق يركز على الصيانة والتصويت والتواصل — لا يوجد قسم مدفوعات داخل عمارتي حاليًا.",
    },
  ],
  en: [
    {
      match: (m) => /join|invite|building code/.test(m),
      reply:
        "To join someone else’s building: from the dashboard (or onboarding) choose “Join with building code”, enter the public code your organiser shared plus your unit label. Codes are also visible under Invites/share code once you belong to any building.",
    },
    {
      match: (m) => m.includes("supervisor") || m.includes("manager"),
      reply:
        "The creator assigns supervisors from Voting (creator-only tools), or launches an owner election when needed.",
    },
    {
      match: (m) => /maintenance/i.test(m) && !looksLikeMaintenanceQuery(m),
      reply:
        "Open Maintenance inside your building to file community or unit-scoped tickets; optionally attach AI analysis when submitting.",
    },
    {
      match: (m) => /vote|decision/i.test(m),
      reply:
        "The Voting tab lists supervisor ballots and supplier votes for maintenance — cast your ballot before the countdown ends.",
    },
    {
      match: (m) => /announcement|bulletin|resident chat/i.test(m),
      reply:
        "Announcements are for broadcasts; Resident chat handles lightweight discussions. Both live under your building’s navigation tabs.",
    },
    {
      match: (m) => /passport|unit history/i.test(m),
      reply:
        "The unit passport summarizes maintenance history tied to your apartment — reachable from Profile or the building Passport tab.",
    },
    {
      match: (m) => /profile|account|settings|notification|theme/i.test(m),
      reply:
        "Profile updates your name, phone, and optional email. Theme and browser notifications are configured in the settings card beneath it; language toggles lives in the top-nav globe.",
    },
    {
      match: (m) => /payment|subscription|visa|stripe/i.test(m),
      reply:
        "Amarati does not expose a billing screen yet — focus stays on votes, upkeep, and community tools.",
    },
  ],
};

const FALLBACK: Record<AppLocale, string> = {
  ar:
    "يمكنني مساعدتك على سريان العمل التطبيق: الانضمام برمز العمارة، الصيانة، التصويت، الإعلانات، جواز الوحدة، والإعدادات في «الحساب». إن كان سؤالك تقنيًا للصيانة، صِف العطل بدقة.",
  en:
    "Ask how to navigate Amarati—join flows, votes, upkeep, passports, chats—or describe a precise maintenance symptom for predictive tips.",
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
      `Predictive analysis: ${label}.`,
      "",
      "Recommended technicians in Makkah:",
      lines,
      "",
      "You can open the Maintenance section inside your building to log this request and notify the supervisor.",
    ].join("\n");
  }

  if (issue === "No_Issue") {
    return [
      `نتيجة التحليل التنبؤي: ${label}.`,
      "اوصف الأعراض بدقة أكبر (ماء، كهرباء، جدران، صرف، سقف) لأرشّح فنيّين مختصّين في مكة المكرمة.",
    ].join("\n");
  }
  const lines = recs
    .map((r, i) => `${i + 1}. ${r.company} — ⭐ ${r.rating.toFixed(1)}`)
    .join("\n");
  return [
    `نتيجة التحليل التنبؤي: ${label}.`,
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
