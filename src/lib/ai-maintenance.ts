import { fetchExternalMaintenanceMl } from "./ml-inference";
import {
  issueLabel,
  predictFailure,
  recommendServices,
  textToFeatures,
} from "./maintenance-predictor";
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

function localModelInsight(description: string, city: string) {
  const features = textToFeatures(description, city);
  const issue = predictFailure(features);
  const label = issueLabel(issue, "ar");
  if (issue === "No_Issue") {
    return {
      issue,
      summary: `النموذج التنبؤي (Amarati RandomForest) لم يحدد عطلاً واضحاً من الوصف الحالي (التصنيف: ${label}).`,
      suggestions: "لو وُجدت أعراض إضافية، يرجى توضيحها (ماء، كهرباء، جدران، صرف، سقف) للحصول على توصية فنّية أدق.",
      tag: label,
    };
  }
  const recs = recommendServices(issue, 3);
  const recLines = recs
    .map((r, i) => `${i + 1}. ${r.company} — ⭐ ${r.rating.toFixed(1)}`)
    .join("\n");
  return {
    issue,
    summary: `توقّع النموذج التنبؤي (Amarati RandomForest، مبني على دفتر Colab): ${label}.`,
    suggestions: `فنّيون موصى بهم (مكة المكرمة):\n${recLines}`,
    tag: label,
  };
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
  const local = localModelInsight(options.description, options.city);
  let tags = classify(options.description);
  if (local.tag) tags.push(local.tag);
  if (ext?.tags?.length) {
    tags = Array.from(new Set([...tags, ...ext.tags]));
  }
  tags = Array.from(new Set(tags));

  const localSummary = local.summary;
  const summary = ext?.summary?.trim()
    ? `${ext.summary.trim()}\n\n${localSummary}`
    : localSummary;

  const localSuggestions = local.suggestions;
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
