import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });

  const isEmployerRoute = req.nextUrl.pathname.startsWith("/employer");
  const isTechnicianRoute = req.nextUrl.pathname.startsWith("/technician");
  const isProfileRoute = req.nextUrl.pathname.startsWith("/profile");
  const isNotificationsRoute = req.nextUrl.pathname.startsWith("/notifications");
  const isSupportRoute = req.nextUrl.pathname.startsWith("/support");
  const isLeaderboardRoute = req.nextUrl.pathname.startsWith("/leaderboard");

  const isProtected =
    isEmployerRoute ||
    isTechnicianRoute ||
    isProfileRoute ||
    isNotificationsRoute ||
    isSupportRoute;

  if (isProtected && !token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/employer/:path*",
    "/technician/:path*",
    "/profile/:path*",
    "/notifications/:path*",
    "/support/:path*",
  ],
};