import { NextRequest, NextResponse } from "next/server";
import { GOOGLE_SESSION_COOKIE } from "../../../google-auth";

export async function GET(request: NextRequest) {
  const response = NextResponse.redirect(new URL("/", request.url));
  response.cookies.delete(GOOGLE_SESSION_COOKIE);
  return response;
}
