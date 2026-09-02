import { NextRequest, NextResponse } from "next/server";
import { createGoogleSession, GOOGLE_SESSION_COOKIE } from "../../../../google-auth";

type GoogleProfile = { sub: string; email: string; name?: string; email_verified?: boolean };

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const savedState = request.cookies.get("hongseong_google_state")?.value;
  if (!code || !state || state !== savedState) return NextResponse.redirect(new URL("/?auth_error=state", request.url));
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) return NextResponse.redirect(new URL("/?auth_error=config", request.url));
  const redirectUri = `${request.nextUrl.origin}/api/auth/google/callback`;
  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ code, client_id: clientId, client_secret: clientSecret, redirect_uri: redirectUri, grant_type: "authorization_code" }) });
  if (!tokenResponse.ok) return NextResponse.redirect(new URL("/?auth_error=token", request.url));
  const token = await tokenResponse.json() as { access_token: string };
  const profileResponse = await fetch("https://openidconnect.googleapis.com/v1/userinfo", { headers: { authorization: `Bearer ${token.access_token}` } });
  if (!profileResponse.ok) return NextResponse.redirect(new URL("/?auth_error=profile", request.url));
  const profile = await profileResponse.json() as GoogleProfile;
  if (!profile.sub || !profile.email || profile.email_verified === false) return NextResponse.redirect(new URL("/?auth_error=email", request.url));
  const session = await createGoogleSession({ id: `google:${profile.sub}`, email: profile.email, displayName: profile.name ?? profile.email.split("@")[0], fullName: profile.name ?? null });
  const returnTo = request.cookies.get("hongseong_auth_return")?.value ?? "/";
  const response = NextResponse.redirect(new URL(returnTo.startsWith("/") && !returnTo.startsWith("//") ? returnTo : "/", request.url));
  response.cookies.set(GOOGLE_SESSION_COOKIE, session, { httpOnly: true, sameSite: "lax", secure: request.nextUrl.protocol === "https:", path: "/", maxAge: 60 * 60 * 24 * 14 });
  response.cookies.delete("hongseong_google_state");
  response.cookies.delete("hongseong_auth_return");
  return response;
}
