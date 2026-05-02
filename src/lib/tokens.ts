import { randomBytes } from "crypto";

export function randomTokenUrlSafe(bytes = 18) {
  return randomBytes(bytes).toString("base64url");
}

export function buildingPublicCode() {
  return randomBytes(4).toString("hex").toUpperCase();
}
