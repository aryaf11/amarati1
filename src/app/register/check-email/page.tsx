import { redirect } from "next/navigation";

/** التحقق بالبريد غير مستخدم — يُوجّه للصفحة الرئيسية أو تسجيل الدخول. */
export default function RegisterCheckEmailRedirect() {
  redirect("/login");
}
