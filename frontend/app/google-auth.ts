import { cookies } from "next/headers";

export type GoogleUser = {
  id: string;
  displayName: string;
  email: string;
  fullName: string | null;
};

export const GOOGLE_SESSION_COOKIE = "hongseong_google_session";

const encoder = new TextEncoder();
const base64url = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes)).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
const fromBase64url = (value: string) => {
  const normalized = value.replaceAll("-", "+").replaceAll("_", "/");
  return normalized + "=".repeat((4 - normalized.length % 4) % 4);
};

async function signature(value: string) {
  const secret = process.env.AUTH_SECRET ?? (process.env.NODE_ENV === "development" ? "hongseong-local-demo-session-only" : undefined);
  if (!secret) return null;
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return base64url(new Uint8Array(await crypto.subtle.sign("HMAC", key, encoder.encode(value))));
}

export async function createGoogleSession(user: GoogleUser) {
  const payload = base64url(encoder.encode(JSON.stringify({ ...user, exp: Date.now() + 1000 * 60 * 60 * 24 * 14 })));
  const signed = await signature(payload);
  if (!signed) throw new Error("AUTH_SECRET is not configured");
  return `${payload}.${signed}`;
}

export async function getGoogleUser(): Promise<GoogleUser | null> {
  const value = (await cookies()).get(GOOGLE_SESSION_COOKIE)?.value;
  if (!value) return null;
  const [payload, signed] = value.split(".");
  if (!payload || !signed || await signature(payload) !== signed) return null;
  try {
    const decoded = JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(fromBase64url(payload)), (char) => char.charCodeAt(0)))) as GoogleUser & { exp: number };
    if (decoded.exp < Date.now() || !decoded.id || !decoded.email) return null;
    return { id: decoded.id, displayName: decoded.displayName, email: decoded.email, fullName: decoded.fullName };
  } catch {
    return null;
  }
}
