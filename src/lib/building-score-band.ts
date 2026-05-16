import type { AppLocale } from "./locale";

export type ScoreBandInfo = {
  rangeLabel: string;
  label: string;
  emoji: string;
  description: string;
};

const BANDS: {
  min: number;
  max: number | null;
  rangeAr: string;
  rangeEn: string;
  labelAr: string;
  labelEn: string;
  emoji: string;
  descAr: string;
  descEn: string;
}[] = [
  {
    min: 90,
    max: 100,
    rangeAr: "90 – 100",
    rangeEn: "90 – 100",
    labelAr: "ممتاز",
    labelEn: "Excellent",
    emoji: "🟢",
    descAr: "المبنى ممتاز",
    descEn: "The building is excellent",
  },
  {
    min: 80,
    max: 89,
    rangeAr: "80 – 89",
    rangeEn: "80 – 89",
    labelAr: "جيد جدًا",
    labelEn: "Very good",
    emoji: "🟢",
    descAr: "أداء قوي مع ملاحظات بسيطة",
    descEn: "Strong performance with minor notes",
  },
  {
    min: 70,
    max: 79,
    rangeAr: "70 – 79",
    rangeEn: "70 – 79",
    labelAr: "جيد",
    labelEn: "Good",
    emoji: "🟡",
    descAr: "يحتاج تحسينات طفيفة",
    descEn: "Needs minor improvements",
  },
  {
    min: 60,
    max: 69,
    rangeAr: "60 – 69",
    rangeEn: "60 – 69",
    labelAr: "متوسط",
    labelEn: "Average",
    emoji: "🟠",
    descAr: "توجد مشاكل تستدعي الانتباه",
    descEn: "Issues need attention",
  },
  {
    min: 40,
    max: 59,
    rangeAr: "40 – 59",
    rangeEn: "40 – 59",
    labelAr: "ضعيف",
    labelEn: "Weak",
    emoji: "🔴",
    descAr: "يحتاج تدخل سريع",
    descEn: "Needs quick intervention",
  },
  {
    min: 0,
    max: 39,
    rangeAr: "أقل من 40",
    rangeEn: "Below 40",
    labelAr: "حرج",
    labelEn: "Critical",
    emoji: "🚨",
    descAr: "المبنى متدهور",
    descEn: "The building is deteriorating",
  },
];

export function getScoreBand(score: number, locale: AppLocale): ScoreBandInfo {
  const n = Math.round(score);
  const row =
    BANDS.find((b) => n >= b.min && (b.max === null || n <= b.max)) ?? BANDS[BANDS.length - 1]!;
  const en = locale === "en";
  return {
    rangeLabel: en ? row.rangeEn : row.rangeAr,
    label: en ? row.labelEn : row.labelAr,
    emoji: row.emoji,
    description: en ? row.descEn : row.descAr,
  };
}

export function allScoreBands(locale: AppLocale): ScoreBandInfo[] {
  return BANDS.map((row) => {
    const en = locale === "en";
    return {
      rangeLabel: en ? row.rangeEn : row.rangeAr,
      label: en ? row.labelEn : row.labelAr,
      emoji: row.emoji,
      description: en ? row.descEn : row.descAr,
    };
  });
}
