import { fetchExternalMaintenanceMl } from "./ml-inference";
import { prisma } from "./prisma";

const KEYWORDS: { k: string[]; labels: string[] }[] = [
  { k: ["مصعد", "مصاعد", "elevator", "lift"], labels: ["مصاعد", "كهرباء عامة"] },
  { k: ["سباكة", "تسريب", "ماء", "plumb"], labels: ["سباكة", "عزل مائي"] },
  { k: ["تكييف", "مكيف", "hvac"], labels: ["تكييف وتهوية"] },
  { k: ["كهرباء", "electr", "إنارة"], labels: ["كهرباء منزلية"] },
  { k: ["دهان", "بوية", "طلاء"], labels: ["دهانات وديكور"] },
];

function classify(description: string) {
  const d = description.toLowerCase();
  const hits: string[] = [];
  for (const row of KEYWORDS) {
    if (row.k.some((w) => d.includes(w.toLowerCase()))) hits.push(...row.labels);
  }
  return Array.from(new Set(hits));
}

export async function analyzeMaintenance(options: {
  description: string;
  city: string;
  buildingId?: string;
}) {
  const ext = await fetchExternalMaintenanceMl({
    description: options.description,
    city: options.city,
    buildingId: options.buildingId,
  });
  let tags = classify(options.description);
  if (ext?.tags?.length) {
    tags = Array.from(new Set([...tags, ...ext.tags]));
  }
  const localSummary = tags.length
    ? `تم تصنيف المشكلة ضمن: ${tags.join("، ")}.`
    : "لم يتم تحديد تصنيف دقيق؛ يُنصح بوصف أوضح مع صور إن وجدت.";
  const summary = ext?.summary?.trim()
    ? `${ext.summary.trim()}\n\n${localSummary}`
    : localSummary;
  const localSuggestions = tags.length
    ? `مجالات مقترحة للمتابعة مع مزوّدي الخدمة أو المشرف: ${tags.join("، ")}.`
    : "راجع الوصف مع المشرف أو الجهات المحلية المناسبة حسب نوع العطل.";
  const suggestions = ext?.suggestions?.trim()
    ? `${ext.suggestions.trim()}\n\n${localSuggestions}`
    : localSuggestions;
  return { summary, suggestions, tags };
}

function monthKey(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export async function supervisorMonthlyScore(buildingId: string) {
  const requests = await prisma.maintenanceRequest.findMany({
    where: { buildingId },
  });
  const done = requests.filter((r) => r.status === "DONE").length;
  const open = requests.filter((r) => r.status === "OPEN").length;
  const score = Math.max(
    0,
    Math.min(100, Math.round(70 + done * 3 - open * 2))
  );
  const summary = `بناءً على ${requests.length} طلبات مسجلة: ${done} مكتمل، ${open} مفتوح.`;
  await prisma.buildingHealthScore.upsert({
    where: {
      buildingId_month: { buildingId, month: monthKey() },
    },
    create: { buildingId, month: monthKey(), score, summary },
    update: { score, summary },
  });
  return { month: monthKey(), score, summary };
}

export async function addPredictiveAlerts(buildingId: string) {
  const recent = await prisma.predictiveMaintenanceAlert.count({
    where: {
      buildingId,
      createdAt: { gte: new Date(Date.now() - 1000 * 60 * 60 * 24) },
    },
  });
  if (recent >= 2) return;
  const samples = [
    {
      title: "فحص دوري للمصعد",
      detail:
        "بناءً على نمط الطلبات المجتمعية، يُنصح بجدولة فحص أمان للمصعد خلال 30 يوماً.",
      severity: "medium",
    },
    {
      title: "استباقي للسباكة المشتركة",
      detail:
        "ارتفاع طفيف في بلاغات الرطوبة في المباني المماثلة؛ راقب الشقق ذات التوصيلات المشتركة.",
      severity: "low",
    },
  ];
  for (const s of samples) {
    await prisma.predictiveMaintenanceAlert.create({
      data: { ...s, buildingId },
    });
  }
}
