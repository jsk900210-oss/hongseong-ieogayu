import { NextRequest, NextResponse } from "next/server";

const safeReturnTo = (value: string | null) => value?.startsWith("/") && !value.startsWith("//") ? value : "/";

export async function GET(request: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    const fallback = new URL(safeReturnTo(request.nextUrl.searchParams.get("return_to")), request.nextUrl.origin);
    fallback.searchParams.set("auth_error", "google_config");
    return NextResponse.redirect(fallback);
  }
  const state = crypto.randomUUID();
  const redirectUri = `${request.nextUrl.origin}/api/auth/google/callback`;
  const params = new URLSearchParams({ client_id: clientId, redirect_uri: redirectUri, response_type: "code", scope: "openid email profile", state, prompt: "select_account" });
  const response = NextResponse.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
  const options = { httpOnly: true, sameSite: "lax" as const, secure: request.nextUrl.protocol === "https:", path: "/", maxAge: 600 };
  response.cookies.set("hongseong_google_state", state, options);
  response.cookies.set("hongseong_auth_return", safeReturnTo(request.nextUrl.searchParams.get("return_to")), options);
  return response;
}
