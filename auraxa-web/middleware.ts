import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn  = !!req.auth;

  const isProtected =
    nextUrl.pathname.startsWith("/dashboard") ||
    nextUrl.pathname.startsWith("/analyze")   ||
    nextUrl.pathname.startsWith("/results")   ||
    nextUrl.pathname.startsWith("/advisor")   ||
    nextUrl.pathname.startsWith("/timeline")  ||
    nextUrl.pathname.startsWith("/reports")   ||
    nextUrl.pathname.startsWith("/settings")  ||
    nextUrl.pathname.startsWith("/upgrade")   ||
    nextUrl.pathname.startsWith("/astrology") ||
    nextUrl.pathname.startsWith("/palm")      ||
    nextUrl.pathname.startsWith("/admin")     ||
    nextUrl.pathname.startsWith("/profile");

  const isLoginPage  = nextUrl.pathname === "/login";

  // Public routes — no auth required
  const isPublic =
    nextUrl.pathname.startsWith("/r/")             ||  // shared reports
    nextUrl.pathname.startsWith("/reset-password") ||  // password reset
    nextUrl.pathname.startsWith("/privacy")        ||  // privacy policy
    nextUrl.pathname.startsWith("/terms");              // terms of service

  if (isPublic)                   return NextResponse.next();
  if (isProtected && !isLoggedIn) return NextResponse.redirect(new URL("/login", nextUrl));
  if (isLoginPage  && isLoggedIn) return NextResponse.redirect(new URL("/dashboard", nextUrl));

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
