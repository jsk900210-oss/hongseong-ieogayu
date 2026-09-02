import { NextResponse } from "next/server";
import { createGoogleSession, GOOGLE_SESSION_COOKIE } from "../../../google-auth";

const isLocalHost = (hostname: string) => hostname === "localhost" || hostname === "127.0.0.1";

export async function GET(request: Request) {
  const url = new URL(request.url);
  if (!isLocalHost(url.hostname)) return new NextResponse("Not found", { status: 404 });

  const session = await createGoogleSession({
    id: "demo:hongseong-friends",
    email: "demo@hongseongmate.local",
    displayName: "홍성프렌즈 체험",
    fullName: "홍성프렌즈 체험",
  });
  const returnTo = url.searchParams.get("return_to");
  const destination = returnTo?.startsWith("/") && !returnTo.startsWith("//") ? returnTo : "/";
  const response = NextResponse.redirect(new URL(destination, url));
  response.cookies.set(GOOGLE_SESSION_COOKIE, session, {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    path: "/",
    maxAge: 60 * 60 * 8,
  });
  return response;
}
