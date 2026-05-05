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
    return "متغير AUTH_SECRET غير مضبوط أو أقصر من 16 محرفاً. أضفه في متغيرات البيئة: على **Vercel** (Settings → Environment Variables) لبيئة **Production**؛ على **Netlify** فعّله لـ **Builds** و**Functions** و**Post processing**.";
  }
  if (
    /P1001|P1000|P1013/i.test(blob) ||
    /Can't reach database|Does not exist|ECONNREFUSED|ETIMEDOUT|ENOTFOUND|getaddrinfo/i.test(blob)
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

  const tail =
    process.env.NODE_ENV !== "production" && blob.length > 0
      ? ` (تفاصيل التطوير: ${blob.slice(0, 200)})`
      : "";
  return (
    "تعذّر الاتصال بقاعدة البيانات أو إكمال الجلسة. ضع **DATABASE_URL** و**AUTH_SECRET** (16+ محرف) في متغيرات البيئة: على **Vercel** لبيئة **Production** ثم أعد النشر؛ على **Netlify** فعّلهما لـ **Builds** و**Functions** معاً. " +
    "أعد نشر الموقع بعد آخر `git push` إذا عدّلت `binaryTargets` في Prisma. " +
    "للتشخيص: **Vercel** → Deployments → Logs / Runtime Logs؛ **Netlify** → Functions/Edge — وابحث عن `registerAction` أو `loginAction` لنص الخطأ الإنجليزي." +
    tail
  );
}
