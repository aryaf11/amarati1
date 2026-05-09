/**
 * منفذ TypeScript للنموذج التنبؤي وقائمة التوصيات من دفتر Colab:
 * scripts/notebooks/maintenance_predictive_recommendation.py
 *
 * النموذج الأصلي RandomForestClassifier مدرَّب على بيانات اصطناعية
 * صنّفت بالقواعد التالية بالضبط — لذا استبدالها هنا يعطي نفس النتيجة بدون بايثون.
 */

import type { AppLocale } from "./locale";

export const FEATURES = [
  "house_age",
  "humidity",
  "rainfall_level",
  "water_pressure",
  "electric_load",
  "soil_movement",
  "maintenance_count",
  "last_maintenance_days",
] as const;

export type FeatureName = (typeof FEATURES)[number];
export type FeatureRow = Record<FeatureName, number>;

export type FailureClass =
  | "Water_Leakage"
  | "Wall_Crack"
  | "Electrical_Issue"
  | "Drainage_Blockage"
  | "Roof_Leakage"
  | "No_Issue";

const ISSUE_LABELS: Record<FailureClass, { ar: string; en: string }> = {
  Water_Leakage: { ar: "تسريب مياه / سباكة", en: "Water leak / plumbing" },
  Wall_Crack: { ar: "تشققات في الجدران", en: "Wall cracks" },
  Electrical_Issue: { ar: "عطل كهربائي", en: "Electrical issue" },
  Drainage_Blockage: { ar: "انسداد تصريف", en: "Drainage blockage" },
  Roof_Leakage: { ar: "تسريب سقف", en: "Roof leakage" },
  No_Issue: {
    ar: "لا تظهر مؤشرات خطر واضحة",
    en: "No clear risk indicators",
  },
};

export function issueLabel(cls: FailureClass, locale: AppLocale) {
  return ISSUE_LABELS[cls][locale === "en" ? "en" : "ar"];
}

/** قواعد التصنيف من Colab (np.select بالترتيب — أول شرط يتحقق يُختار). */
export function predictFailure(row: FeatureRow): FailureClass {
  if (row.water_pressure > 70) return "Water_Leakage";
  if (row.humidity > 80) return "Wall_Crack";
  if (row.electric_load > 4200) return "Electrical_Issue";
  if (row.maintenance_count < 2) return "Drainage_Blockage";
  if (row.rainfall_level > 35) return "Roof_Leakage";
  return "No_Issue";
}

/** استخراج خصائص تقريبية من نص البلاغ + المدينة (مطابق لـ text_to_feature_row). */
export function textToFeatures(description: string, city = ""): FeatureRow {
  const d = (description || "").toLowerCase();
  const c = (city || "").toLowerCase();

  const base: FeatureRow = {
    house_age: 25,
    humidity: 55,
    rainfall_level: 15,
    water_pressure: 55,
    electric_load: 2500,
    soil_movement: 2,
    maintenance_count: 3,
    last_maintenance_days: 180,
  };

  const water = ["ماء", "مياه", "تسريب", "سباكة", "رطوبة", "بلل", "water", "leak", "plumb", "humid"];
  const elec = ["كهرب", "كهرباء", "electric", "fuse", "مصعد", "elevator", "إنارة", "lift"];
  const roof = ["سقف", "roof", "مطر", "أمطار", "rain"];
  const crack = ["شق", "تشقق", "جدار", "crack", "wall"];
  const drain = ["صرف", "انسداد", "drain", "block", "بالوعة"];

  const hasAny = (arr: string[]) => arr.some((w) => d.includes(w));

  if (hasAny(water)) {
    base.humidity += 18;
    base.water_pressure += 18;
    base.rainfall_level += 5;
  }
  if (hasAny(elec)) {
    base.electric_load += 2000;
  }
  if (hasAny(roof)) {
    base.rainfall_level += 22;
    base.humidity += 8;
  }
  if (hasAny(crack)) {
    base.soil_movement = Math.min(4, base.soil_movement + 1.5);
    base.humidity += 26;
  }
  if (hasAny(drain)) {
    base.maintenance_count = Math.max(0, base.maintenance_count - 2.5);
    base.rainfall_level += 8;
  }
  if (description.includes("مكة") || c.includes("makkah") || c.includes("mecca")) {
    base.house_age += 3;
  }

  base.humidity = clamp(base.humidity, 30, 95);
  base.water_pressure = clamp(base.water_pressure, 30, 85);
  base.electric_load = clamp(base.electric_load, 1000, 5500);
  base.rainfall_level = clamp(base.rainfall_level, 0, 49);
  base.soil_movement = clamp(base.soil_movement, 0, 4);
  base.maintenance_count = clamp(base.maintenance_count, 0, 9);
  base.last_maintenance_days = clamp(base.last_maintenance_days, 10, 499);
  base.house_age = clamp(base.house_age, 1, 39);
  return base;
}

function clamp(v: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, v));
}

/** قائمة الفنّيين في مكة (نفس CSV من Colab). */
export type ServiceRow = {
  service_type: FailureClass;
  company: string;
  rating: number;
  latitude: number;
  longitude: number;
};

export const MAKKAH_SERVICES: ServiceRow[] = [
  { service_type: "Electrical_Issue", company: "Makkah Electric Services", rating: 4.7, latitude: 21.3891, longitude: 39.8579 },
  { service_type: "Electrical_Issue", company: "Al Haram Electric", rating: 4.6, latitude: 21.4000, longitude: 39.8600 },
  { service_type: "Water_Leakage", company: "Zamzam Plumbing", rating: 4.8, latitude: 21.4225, longitude: 39.8262 },
  { service_type: "Water_Leakage", company: "Al Noor Plumbing", rating: 4.5, latitude: 21.4180, longitude: 39.8300 },
  { service_type: "Roof_Leakage", company: "Haram Roof Repair", rating: 4.6, latitude: 21.4300, longitude: 39.8350 },
  { service_type: "Wall_Crack", company: "Makkah Wall Repair", rating: 4.3, latitude: 21.4100, longitude: 39.8200 },
  { service_type: "Drainage_Blockage", company: "Zamzam Drain Service", rating: 4.4, latitude: 21.4230, longitude: 39.8250 },
  { service_type: "Drainage_Blockage", company: "Al Makkah Drain Fix", rating: 4.2, latitude: 21.4150, longitude: 39.8220 },
];

export function recommendServices(issue: FailureClass, limit = 3): ServiceRow[] {
  const all = [...MAKKAH_SERVICES].sort((a, b) => b.rating - a.rating);
  if (issue === "No_Issue") return all.slice(0, limit);
  const filtered = all.filter((s) => s.service_type === issue);
  return (filtered.length ? filtered : all).slice(0, limit);
}

/** كشف ما إذا كان السؤال متعلّقاً بالصيانة — يحدد متى يفعَّل المتنبئ. */
export function looksLikeMaintenanceQuery(text: string): boolean {
  const t = (text || "").toLowerCase();
  const cues = [
    "صيان",
    "تسريب",
    "ماء",
    "مياه",
    "كهرب",
    "إنارة",
    "مصعد",
    "تشقق",
    "شق",
    "جدار",
    "سقف",
    "صرف",
    "انسداد",
    "بالوعة",
    "رطوبة",
    "مطر",
    "بلل",
    "maint",
    "leak",
    "plumb",
    "electric",
    "elevator",
    "lift",
    "wall",
    "crack",
    "roof",
    "drain",
    "block",
    "humid",
    "rain",
  ];
  return cues.some((k) => t.includes(k));
}
