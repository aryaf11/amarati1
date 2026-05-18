import { redirect } from "next/navigation";

/** التحقق بالجوال مُعطّل؛ نحتفظ بالمسار لروابط قديمة ونوجّه مباشرة للوحة. */
export default function RegisterVerifyPhonePage() {
  redirect("/dashboard");
}
