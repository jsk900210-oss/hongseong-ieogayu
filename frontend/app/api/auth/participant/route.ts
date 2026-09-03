import { NextResponse } from "next/server";
import { createGoogleSession, GOOGLE_SESSION_COOKIE } from "../../../google-auth";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const participantId = crypto.randomUUID();
  const session = await createGoogleSession({
    id: `participant:${participantId}`,
    email: `${participantId}@participant.hongseongmate.local`,
    displayName: "새 참가자",
    fullName: null,
  });
  const returnTo = url.searchParams.get("return_to");
  const destination = returnTo?.startsWith("/") && !returnTo.startsWith("//") ? returnTo : "/";
  const nextUrl = new URL(destination, url);
  nextUrl.searchParams.set("onboarding", "1");
  const response = NextResponse.redirect(nextUrl);
  response.cookies.set(GOOGLE_SESSION_COOKIE, session, {
    httpOnly: true,
    sameSite: "lax",
    secure: url.protocol === "https:",
    path: "/",
    maxAge: 60 * 60 * 24 * 14,
  });
  return response;
}
