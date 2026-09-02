import { NextRequest, NextResponse } from "next/server";

const safeReturnTo = (value: string | null) => value?.startsWith("/") && !value.startsWith("//") ? value : "/";

export async function GET(request: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) return NextResponse.json({ error: "GOOGLE_CLIENT_ID가 설정되지 않았습니다." }, { status: 503 });
  const state = crypto.randomUUID();
  const redirectUri = `${request.nextUrl.origin}/api/auth/google/callback`;
  const params = new URLSearchParams({ client_id: clientId, redirect_uri: redirectUri, response_type: "code", scope: "openid email profile", state, prompt: "select_account" });
  const response = NextResponse.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
  const options = { httpOnly: true, sameSite: "lax" as const, secure: request.nextUrl.protocol === "https:", path: "/", maxAge: 600 };
  response.cookies.set("hongseong_google_state", state, options);
  response.cookies.set("hongseong_auth_return", safeReturnTo(request.nextUrl.searchParams.get("return_to")), options);
  return response;
}
