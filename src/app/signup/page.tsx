import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/current-user";

/** اختيار التسجيل — الانضمام فقط (لا إنشاء مبنى من التطبيق). */
export default async function SignupChoicePage() {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");
  redirect("/signup/join");
}
