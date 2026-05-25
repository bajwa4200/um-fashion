import { authConfig } from "@/lib/auth.config";
import NextAuth from "next-auth";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

const publicRoutes = ["/", "/login", "/register", "/shop"];
const authRoutes = ["/login", "/register"];

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const role = req.auth?.user?.role;

  const isPublic =
    publicRoutes.some((r) => nextUrl.pathname === r) ||
    nextUrl.pathname.startsWith("/shop") ||
    nextUrl.pathname.startsWith("/shops") ||
    nextUrl.pathname.startsWith("/product") ||
    nextUrl.pathname.startsWith("/gpu-setup") ||
    nextUrl.pathname.startsWith("/api/stripe/webhook") ||
    nextUrl.pathname.startsWith("/api/auth") ||
    nextUrl.pathname.startsWith("/api/health");

  const isAuthRoute = authRoutes.includes(nextUrl.pathname);

  if (isAuthRoute && isLoggedIn) {
    return NextResponse.redirect(new URL("/", nextUrl));
  }

  if (nextUrl.pathname.startsWith("/vendor")) {
    if (!isLoggedIn) return NextResponse.redirect(new URL("/login", nextUrl));
    if (role !== "VENDOR" && role !== "SUPERADMIN") {
      return NextResponse.redirect(new URL("/", nextUrl));
    }
  }

  if (nextUrl.pathname.startsWith("/admin")) {
    if (!isLoggedIn) return NextResponse.redirect(new URL("/login", nextUrl));
    if (role !== "SUPERADMIN") {
      return NextResponse.redirect(new URL("/", nextUrl));
    }
  }

  if (
    (nextUrl.pathname.startsWith("/cart") ||
      nextUrl.pathname.startsWith("/checkout") ||
      nextUrl.pathname.startsWith("/orders")) &&
    !isLoggedIn
  ) {
    return NextResponse.redirect(new URL("/login", nextUrl));
  }

  if (!isPublic && !isLoggedIn && !nextUrl.pathname.startsWith("/api")) {
    // allow API routes to handle their own auth
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
