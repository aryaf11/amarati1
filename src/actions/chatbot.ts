"use server";

export async function chatbotReplyAction(message: string) {
  const m = message.toLowerCase();
  if (m.includes("صيانة") || m.includes("maintenance")) {
    return "يمكنك فتح قسم «صيانة» داخل مبناك واختيار طلب شخصي أو مجتمعي. بعد إرسال الوصف، سيظهر تحليل وتوصيات مبنية على الوصف والمدينة.";
  }
  if (m.includes("مشرف") || m.includes("supervisor")) {
    return "منشئ المبنى يعيّن مشرفاً من لوحة المبنى. إن لم يوجد مشرف، يمكن فتح تصويت للملاك من قسم «تصويت».";
  }
  if (m.includes("دفع") || m.includes("payment")) {
    return "قسم «المدفوعات» يعرض سجلّك داخل المبنى. الدفع الحقيقي يتطلب ربط بوابة دفع لاحقاً؛ حالياً يوجد زر تجريبي للتسجيل.";
  }
  return "أنا مساعد عَمارتي: اسأل عن الصيانة، المشرف، أو المدفوعات. يمكنك أيضاً زيارة صفحات المبنى من لوحة التحكم.";
}
