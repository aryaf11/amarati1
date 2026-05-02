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
}) {
  const tags = classify(options.description);
  const companies = await prisma.maintenanceCompany.findMany({
    take: 24,
    orderBy: { name: "asc" },
  });
  const filtered = options.city
    ? companies.filter(
        (c) =>
          !c.city ||
          c.city.toLowerCase() === options.city.toLowerCase()
      )
    : companies;
  const top = filtered.slice(0, 5);
  const summary = tags.length
    ? `تم تصنيف المشكلة ضمن: ${tags.join("، ")}.`
    : "لم يتم تحديد تصنيف دقيق؛ يُنصح بوصف أوضح مع صور إن وجدت.";
  const recs = top.map(
    (c) =>
      `${c.name}${c.specialty ? ` — تخصص مذكور: ${c.specialty}` : ""}${c.city ? ` — ${c.city}` : ""}`
  );
  const suggestions =
    recs.length > 0
      ? recs.join("\n")
      : "لا توجد شركات مسجلة بعد في المنصة لنفس المدينة؛ راجع لوحة المشرف أو أضف طلباً لمراجعته.";
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
