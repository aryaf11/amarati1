import { randomBytes } from "crypto";

/** رمز URL-safe لروابط الدعوة (`/join/[token]`). */
export function randomTokenUrlSafe(bytes = 18) {
  return randomBytes(bytes).toString("base64url");
}
