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
        /كيف\s*استخدم|استخدام\s*التطبيق|شرح\s*التطبيق|ماذا\s*افعل|البدايه|البداية|how\s*to\s*use|getting\s*started/.test(
          m,
        ),
      reply:
        "مرحباً! عَمارتي يساعدك على إدارة عمارتك:\n\n1) **إنشاء حساب**: من تسجيل الدخول → «أنشئ حساباً» → أدخل **رمز المبنى** ورقم شقتك (أو أنشئ مبنى جديداً إن كنت المالك الأول).\n2) **الشريط السفلي**: الرئيسية (نظرة المبنى)، الصيانة، التصويتات، **الحساب**.\n3) **الرئيسية**: اختصارات للمحادثة، الإعلانات، المساعد الذكي، وجواز الشقة.\n4) **الحساب**: تعديل الاسم والجوال والبريد؛ **المظهر والإشعارات** في بطاقة «الإعدادات» فقط.\n5) **اللغة**: من أيقونة الكرة الأرضية في الشريط العلوي.\n\nاسألني عن خطوة محددة (انضمام، صيانة، تصويت، إلخ).",
    },
    {
      match: (m) =>
        /شريط|تنقل\s*سفلي|قائمة\s*سفل|bottom|navigation|تبويب/.test(m),
      reply:
        "الشريط السفلي (مثل تطبيق الجوال): **الرئيسية** = لوحة المبنى واختصاراته؛ **الصيانة** = طلباتك؛ **التصويتات** = قرارات المبنى؛ **الحساب** = بياناتك وإعدادات المظهر والإشعارات. اختر مبنى من الرئيسية إن لم تُفتح الأقسام بعد.",
    },
    {
      match: (m) =>
        /انضم|رمز\s*المبن|كود\s*المبن|دعوه|invite|join|building\s*code|تسجيل|حساب\s*جديد/.test(
          m,
        ),
      reply:
        "**إنشاء حساب والانضمام**: من صفحة تسجيل الدخول → «أنشئ حساباً» → أدخل بياناتك + **رمز المبنى** (من المالك أو المشرف) + **رقم الشقة**. إن كنت تُسجّل أول عمارة: اختر «إنشاء مبنى جديد» من نفس مسار التسجيل. بعد الدخول يمكنك أيضاً الانضمام من لوحة التحكم إن لم يكن لديك مبنى بعد.",
    },
    {
      match: (m) =>
        m.includes("مشرف") ||
        m.includes("supervisor") ||
        /تعين\s*مشرف/.test(m),
      reply:
        "منشئ المبنى يعيّن مشرفًا من قسم «تصويت» (أدوات منشئ المبنى) أو يفتح تصويتًا للمالكين لاختيار مشرف.",
    },
    {
      match: (m) =>
        /معلومات\s*شقتي|شقتي|وحدتي|unit\s*info|my\s*unit/.test(m),
      reply:
        "من **الرئيسية** داخل المبنى: اختصار **جواز الشقة** يعرض سجل صيانة وحدتك. من الشريط السفلي: **الصيانة** لطلباتك الحالية، و**الحساب** لبياناتك.",
    },
    {
      match: (m) => /عرض\s*طلبات\s*الصيانة|طلبات\s*الصيانة|maintenance\s*requests/.test(m),
      reply:
        "افتح **الصيانة** من الشريط السفلي لعرض طلباتك وتقديم طلب جديد (شخصي أو مجتمعي). من الرئيسية يمكنك أيضاً استخدام اختصار تقديم طلب صيانة.",
    },
    {
      match: (m) =>
        /موعد\s*الصيانة\s*القادم|الصيانة\s*القادمة|next\s*maintenance|next\s*visit/.test(m),
      reply:
        "لمعرفة موعد الصيانة: افتح **الصيانة** واطّلع على طلباتك المفتوحة. عند تقديم طلب جديد يمكن طلب **تحليل ذكي** يقترح نافذة زمنية تقريبية. للطلبات المجتمعية يُحدَّد الموعد بعد التصويت على شركة الصيانة.",
    },
    {
      match: (m) => /صيانه|صيانة|maintenance/.test(m) && !looksLikeMaintenanceQuery(m),
      reply:
        "من الشريط السفلي افتح **الصيانة** (أو من اختصار الرئيسية) لإنشاء طلب شخصي لشقتك أو طلبًا مجتمعيًا؛ يمكن طلب تحليل ذكي عند الإرسال.",
    },
    {
      match: (m) => /تصويت|قرار مجتمع|vote/.test(m),
      reply:
        "من **التصويتات** في الشريط السفلي: جلسات اختيار مشرف ومزوّدي صيانة للطلبات المجتمعية — صوّت قبل انتهاء المهلة.",
    },
    {
      match: (m) =>
        /اعلان|إعلان|announcement/.test(m) || /محادث|شات\s*السكان|chat/.test(m),
      reply:
        "من **الرئيسية** داخل المبنى: اختصار **محادثة السكان** أو **الإعلانات**. الإعلانات للنشر العام؛ المحادثة للنقاش اليومي.",
    },
    {
      match: (m) => /جواز|passport|سجل\s*الشقه|سجل\s*الشقة/.test(m),
      reply:
        "**جواز الشقة** يعرض سجل الصيانة لوحدتك — من اختصارات الرئيسية أو من **الحساب** → جواز الشقة.",
    },
    {
      match: (m) =>
        /الحساب|الملف|اعدادات|إعدادات|اشعار|إشعار|مظهر|ثيم|theme|profile|settings/.test(
          m,
        ),
      reply:
        "افتح **الحساب** من الشريط السفلي: عدّل الاسم والجوال والبريد في «بيانات الحساب». **المظهر (فاتح/داكن) والإشعارات** في بطاقة «الإعدادات» فقط — وليس من الشريط العلوي. **اللغة** من أيقونة الكرة الأرضية أعلى الصفحة.",
    },
    {
      match: (m) => /مساعد|شات\s*بوت|chatbot|ذكاء/.test(m),
      reply:
        "أنا مساعد عَمارتي: أشرح **كيفية استخدام التطبيق** (انضمام، صيانة، تصويت، إعلانات، الحساب). للأعطال التقنية (تسريب، كهرباء…) صِف العطل بوضوح لأقترح تحليلاً وشركات صيانة في مكة.",
    },
    {
      match: (m) =>
        /دفع|payment|اشتراك|subscription|فودافون|visa|stripe/.test(m),
      reply:
        "التطبيق يركز على الصيانة والتصويت والتواصل — لا يوجد قسم مدفوعات حاليًا.",
    },
  ],
  en: [
    {
      match: (m) =>
        /how\s*to\s*use|getting\s*started|use\s*the\s*app|what\s*can\s*i\s*do/.test(m),
      reply:
        "Welcome! Amarati helps you run your building:\n\n1) **Sign up**: Log in → Create account → enter the **building code** + unit (or create a new building if you are the first owner).\n2) **Bottom bar**: Home, Maintenance, Votes, **Account**.\n3) **Home**: shortcuts for chat, announcements, AI assistant, unit passport.\n4) **Account**: edit profile; **theme & notifications** only under Settings there.\n5) **Language**: globe icon in the top bar.\n\nAsk about any step (join, maintenance, voting, etc.).",
    },
    {
      match: (m) => /bottom\s*nav|navigation|tab\s*bar/.test(m),
      reply:
        "Bottom navigation (matches the mobile app): **Home** = building overview; **Maintenance** = requests; **Votes** = community decisions; **Account** = profile + theme/notifications settings. Pick a building from Home if other tabs are dimmed.",
    },
    {
      match: (m) => /join|invite|building code|sign\s*up|register|new\s*account/.test(m),
      reply:
        "**Sign up & join**: From log in → Create account → your details + **building code** + **unit number**. First-time owners can choose “Create a new building” from the sign-up flow. Logged-in users without a building can join from the dashboard too.",
    },
    {
      match: (m) => m.includes("supervisor") || m.includes("manager"),
      reply:
        "The creator assigns supervisors from Voting (creator-only tools), or launches an owner election when needed.",
    },
    {
      match: (m) => /unit\s*info|my\s*unit|unit\s*overview/.test(m),
      reply:
        "From **Home** inside your building: **Unit passport** shows your maintenance history. Use **Maintenance** on the bottom bar for open requests, and **Account** for profile details.",
    },
    {
      match: (m) => /view\s*maintenance\s*requests|maintenance\s*requests/.test(m),
      reply:
        "Open **Maintenance** on the bottom bar to see your tickets and submit new ones (unit or community). Home also has a maintenance shortcut.",
    },
    {
      match: (m) => /next\s*maintenance|next\s*visit|upcoming\s*maintenance/.test(m),
      reply:
        "Check **Maintenance** for open tickets and timelines. New requests can use **smart analysis** for an estimated window. Community jobs are scheduled after the maintenance-company vote.",
    },
    {
      match: (m) => /maintenance/i.test(m) && !looksLikeMaintenanceQuery(m),
      reply:
        "Open **Maintenance** on the bottom bar (or from Home shortcuts) to file unit or community tickets; optional AI analysis on submit.",
    },
    {
      match: (m) => /vote|decision/i.test(m),
      reply:
        "The **Votes** tab lists supervisor ballots and supplier votes — cast your ballot before the countdown ends.",
    },
    {
      match: (m) => /announcement|bulletin|resident chat/i.test(m),
      reply:
        "From **Home** inside your building: **Resident chat** or **Announcements** shortcuts.",
    },
    {
      match: (m) => /passport|unit history/i.test(m),
      reply:
        "The **unit passport** shows maintenance history — from Home shortcuts or **Account** → passport section.",
    },
    {
      match: (m) => /profile|account|settings|notification|theme/.test(m),
      reply:
        "Open **Account** on the bottom bar. Edit name/phone/email in account details. **Theme and browser notifications** live only in the Settings card — not the top bar. **Language** uses the globe icon.",
    },
    {
      match: (m) => /assistant|chatbot|help\s*bot/.test(m),
      reply:
        "I explain **how to use Amarati** (join, maintenance, votes, announcements, account). For technical faults, describe symptoms clearly for Makkah contractor suggestions.",
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
    "أسألني عن **استخدام التطبيق**: الانضمام برمز المبنى، الشريط السفلي (رئيسية، صيانة، تصويت، الحساب)، الصيانة، التصويت، الإعلانات، أو الإعدادات في «الحساب». للأعطال التقنية صِف العطل (ماء، كهرباء، صرف…).",
  en:
    "Ask how to use Amarati—sign up with a building code, bottom navigation, maintenance, votes, or Account settings—or describe a maintenance symptom for tips.",
};

function formatPrediction(message: string, locale: AppLocale): string {
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
      "Open Maintenance from the bottom bar to log this request.",
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
    "افتح **الصيانة** من الشريط السفلي لإنشاء طلب رسمي.",
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
