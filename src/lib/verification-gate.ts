import { isEmailVerificationRequired } from "@/lib/send-verification-email";

/** نفس شرط «REQUIRE_EMAIL_VERIFICATION» — يعني وجوب تأكيد البريد أو الجوال قبل الدخول. */
export function isVerificationRequired() {
  return isEmailVerificationRequired();
}

export function userMeetsVerificationRequirement(user: {
  emailVerifiedAt: Date | null;
  phoneVerifiedAt?: Date | null;
}) {
  if (!isVerificationRequired()) return true;
  return Boolean(user.emailVerifiedAt || user.phoneVerifiedAt);
}
