import { Prisma } from "@prisma/client";

/** يجمع الرسالة والأكواد من السلسلة (cause) لأخطاء Prisma/غيرها. */
export function flattenError(e: unknown): string {
  const bits: string[] = [];
  let x: unknown = e;
  const seen = new Set<unknown>();
  for (let d = 0; d < 10 && x != null && !seen.has(x); d++) {
    seen.add(x);
    if (typeof x === "string") {
      bits.push(x);
      break;
    }
    if (x instanceof Prisma.PrismaClientKnownRequestError) {
      bits.push(x.code, x.message);
      break;
    }
    if (x instanceof Prisma.PrismaClientInitializationError) {
      if (x.errorCode) bits.push(x.errorCode);
      bits.push(x.message);
      break;
    }
    if (x instanceof Prisma.PrismaClientRustPanicError) {
      bits.push(x.message);
      break;
    }
    if (x instanceof Error) {
      bits.push(x.name, x.message);
      x = x.cause;
      continue;
    }
    if (typeof x === "object") {
      const o = x as Record<string, unknown>;
      if (typeof o.name === "string") bits.push(o.name);
      if (typeof o.message === "string") bits.push(o.message);
      if (typeof o.code === "string") bits.push(o.code);
      if (typeof o.errorCode === "string") bits.push(o.errorCode);
      x = o.cause;
      continue;
    }
    bits.push(String(x));
    break;
  }
  return bits.filter(Boolean).join(" | ");
}

/** رسالة عربية مفيدة لأخطاء التسجيل/الدخول (قاعدة البيانات أو الجلسة). */
export function dbOrSessionErrorHint(e: unknown): string {
  const blob = flattenError(e);

  if (/AUTH_SECRET|must be set \(min 16/i.test(blob)) {
    return "متغير سر الجلسة غير مضبوط أو أقصر من 16 محرفاً. أضف **AUTH_SECRET** أو **SESSION_SECRET** أو **NEXTAUTH_SECRET** (واحداً بالقدر الكافي) في متغيرات البيئة: على **Vercel** (Settings → Environment Variables) لبيئة **Production**؛ على **Netlify** فعّله لـ **Builds** و**Functions** و**Post processing**.";
  }
  if (/Firebase:|FIREBASE_|firestore|Firestore|INVALID_LOGIN_CREDENTIALS|EMAIL_EXISTS/i.test(blob)) {
    return "مشكلة في إعداد Firebase: تحقق من FIREBASE_PROJECT_ID وFIREBASE_CLIENT_EMAIL وFIREBASE_PRIVATE_KEY (أو FIREBASE_SERVICE_ACCOUNT_JSON) وFIREBASE_API_KEY في متغيرات البيئة (Netlify: Builds + Functions). فعّل Firestore وAuthentication (Email/Password) في لوحة Firebase.";
  }
  /** قبل «لا يمكن الوصول»: لا تستخدم عبارة عامة «Does not exist» — قد تشير لجدول غير مهاجر وليس لانقطاع الشبكة */
  if (
    /P2021|P2022|The table .* does not exist|relation .* does not exist|Unknown table/i.test(blob)
  ) {
    return "قاعدة الإنتاج لا تحتوي الجداول المطلوبة (الهجرات غير مطبّقة). من جهاز يصل لنفس قاعدة الإنتاج شغّل: **npx prisma migrate deploy** ثم أعد المحاولة. تأكد أن **DATABASE_URL** في الأمر يطابق متغير **Production** على Vercel.";
  }
  if (
    /P1001|P1000|P1013/i.test(blob) ||
    /Can't reach database|ECONNREFUSED|ETIMEDOUT|ENOTFOUND|getaddrinfo/i.test(blob)
  ) {
    return "لا يمكن الوصول لقاعدة البيانات. تحقق من DATABASE_URL (سلسلة PostgreSQL كاملة؛ للسحابة غالباً ?sslmode=require). على **Vercel** فعّل المتغير لبيئة **Production** (ليس Development فقط). على **Netlify** فعّله لـ **Functions** إن كان الخادم يقرأه عند التشغيل وليس أثناء البناء فقط.";
  }
  if (/P1017/i.test(blob) || /Server has closed the connection/i.test(blob)) {
    return "انقطع الاتصال بقاعدة البيانات. مع PostgreSQL المُدار: استخدم في DATABASE_URL وضع **connection pooling** إن وفره المزوّد، وأضف connect_timeout=15 إن لزم.";
  }
  if (/MaxClientsInSessionMode|too many connections/i.test(blob)) {
    return "تم تجاوز حد الاتصالات. استخدم في DATABASE_URL وضع **pooler** إن وفره المزوّد (مضيف فيه -pooler غالباً)، وليس الرابط المباشر للتطبيق فقط.";
  }
  if (/query engine|libquery_engine|binaryTargets|openssl|libssl|PRISMA_QUERY_ENGINE|Engine is not yet|ENOENT/i.test(blob)) {
    return "مشكلة في محرك Prisma على الخادم (غالباً بناء قديم). أعد نشر المشروع بعد `prisma generate`؛ المشروع يُولّد ثنائيات Linux مناسبة للاستضافة (Netlify/Vercel). إن استمر الأمر راقب سجل البناء لأخطاء Prisma.";
  }
  if (/28P01|password authentication failed|Tenant or user not found|role .* does not exist/i.test(blob)) {
    return "رفض PostgreSQL المصادقة: راجع كلمة مرور المستخدم في DATABASE_URL أو أنشئ مستخدم/قاعدة جديدة في لوحة مزوّد PostgreSQL.";
  }
  if (/invalid connection string|Invalid.*database URL|URL malformed/i.test(blob)) {
    return "صيغة DATABASE_URL غير صالحة. تأكد من نسخ الرابط كاملاً دون مسافات زائدة أو علامتي اقتباس في لوحة المتغيرات (Vercel أو Netlify).";
  }
  if (/Cookies can only be modified|cookie/i.test(blob)) {
    return "تعذّر حفظ جلسة الدخول. تأكد أن الموقع يعمل على HTTPS وأن إعدادات الاستضافة (Netlify/Vercel) محدثة لإطار Next.js.";
  }
  if (/PrismaClientValidationError|Unknown arg|Invalid value for argument|invocation in/i.test(blob)) {
    return "خطأ تحقق Prisma عند إنشاء المستخدم (غالباً عميل Prisma غير مُحدَّث أو بيانات غير متطابقة). نفّذ محلياً: npx prisma migrate deploy ثم npx prisma generate وأعد تشغيل dev. إن ظهر «Unknown arg» احذف مجلد .next وجرب مجدداً.";
  }
  if (/Dynamic server usage|cookies/i.test(blob) && /Route.*couldn't be rendered statically/i.test(blob)) {
    return "تعارض في جلسة الخادم. حدّث Next.js أو راجع إعدادات التخزين المؤقت للصفحات على منصة الاستضافة.";
  }

  const vercelEnvTip =
    process.env.VERCEL === "1"
      ? " تلميح: إذا جرّبت رابط **Preview** (نشر تجريبي) بينما المتغيرات مضبوطة لـ **Production** فقط، انسخ نفس المتغيرات لبيئة **Preview** أو افتح نطاق الإنتاج الرئيسي."
      : "";

  const tail =
    process.env.NODE_ENV !== "production" && blob.length > 0
      ? ` (تفاصيل التطوير: ${blob.slice(0, 200)})`
      : "";
    return (
    "تعذّر إتمام تسجيل الدخول (الخادم أو قاعدة البيانات أو الجلسة). هذه رسالة عامة وليست دليلاً أن المتغيرات ناقصة. إن زودت المشروع بالفعل بـ DATABASE_URL وAUTH_SECRET على **Production**: راجع **Runtime Logs** أثناء الضغط على «دخول»؛ غالباً السبب هجرات غير مطبّقة على الإنتاج أو رابط قاعدة غير صحيح أو انقطاع شبكة/SSL. " +
    "خطوات سريعة: (1) **Redeploy** لآخر كود بعد الـ push (2) من جهاز عندك مع نفس DATABASE_URL للإنتاج: **npx prisma migrate deploy** (3) تأكد أن المتغيرات مفعّلة لبيئة **Production** وليس Preview فقط. " +
    "على **Netlify** فعّل المتغيرات لـ **Builds** و**Functions** معاً. " +
    "التشخيص الدقيق: **Vercel** → آخر Deployment → **Logs** / **Runtime Logs** وابحث عن **loginAction** لقراءة الخطأ الإنجليزي الفعلي." +
    vercelEnvTip +
    tail
  );
}
