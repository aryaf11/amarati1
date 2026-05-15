import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { authSecretKeyBytes } from "@/lib/server-env-bootstrap";

const COOKIE = "amarati_session";

function secretKey() {
  return authSecretKeyBytes();
}

export async function createSession(userId: string) {
  const token = await new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("14d")
    .sign(secretKey());
  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
  });
}

export async function destroySession() {
  const jar = await cookies();
  jar.set(COOKIE, "", { path: "/", maxAge: 0 });
}

export async function readSessionUserId(): Promise<string | null> {
  try {
    const jar = await cookies();
    const token = jar.get(COOKIE)?.value;
    if (!token) return null;
    try {
      const { payload } = await jwtVerify(token, secretKey());
      const sub = payload.sub;
      return typeof sub === "string" ? sub : null;
    } catch {
      return null;
    }
  } catch {
    /** مثال: AUTH_SECRET غير مضبوط في Production — لا يُسقط الصفحة بالكامل */
    return null;
  }
}
