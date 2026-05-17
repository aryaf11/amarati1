/** محتوى تجريبي لمعاينة تبويبات المحادثة (مطابق لتطبيق الجوال). */
export type ChatLine = { senderLabel: string; body: string };

export const demoGroupChat: ChatLine[] = [
  { senderLabel: "سامي - 3B", body: "يا جماعة فيه أحد يعرف متى بيكون اجتماع الجاي؟" },
  {
    senderLabel: "ندى - 5A",
    body: "أعتقد يوم الجمعة الساعة 6، وصلني إشعار قبل شوي 👍",
  },
  { senderLabel: "مشعل - 4C", body: "تمام، هل في موضوع معيّن بنناقشه؟" },
  {
    senderLabel: "ندى - 5A",
    body: "صيانة المصاعد + تجديد دهانات الممرات حسب كلام المشرف",
  },
];

export const demoResidentsChat: ChatLine[] = [
  { senderLabel: "فهد - 2A", body: "السلام عليكم، هل انقطاع الماء انحل؟" },
  { senderLabel: "مشرف العمارة", body: "نعم، الشركة أكدت إصلاح الخزان اليوم." },
];

export const demoAnnouncementsChat: ChatLine[] = [
  {
    senderLabel: "إدارة المبنى",
    body: "تذكير: اجتماع السكان يوم الجمعة 6 مساءً في الصالة.",
  },
  {
    senderLabel: "إدارة المبنى",
    body: "سيتم صيانة المصاعد يوم الأحد من 9 صباحاً حتى 2 ظهراً.",
  },
];
