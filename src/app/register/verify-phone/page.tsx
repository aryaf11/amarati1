import { redirect } from "next/navigation";

/** روابط `/register/verify-phone` القديمة — لا يوجد تأكيد جوال بالرمز بعد الآن. */
export default function VerifyPhoneLegacyRedirectPage() {
  redirect("/dashboard");
}
