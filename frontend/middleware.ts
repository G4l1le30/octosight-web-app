import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const protectedRoutePatterns = [
  /^\/status(?:\/.*)?$/,
  /^\/admin(?:\/.*)?$/,
  /^\/report\/.+$/,
  /^\/edu\/.+\/quiz(?:\/.*)?$/,
  /^\/edu\/.+\/result(?:\/.*)?$/,
];

const publicRoutes = [
  "/",
  "/report",
  "/check",
  "/edu",
  "/login",
  "/register",
  "/access-denied",
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (publicRoutes.includes(pathname)) {
    return NextResponse.next();
  }

  const isProtected = protectedRoutePatterns.some((pattern) =>
    pattern.test(pathname)
  );

  if (!isProtected) {
    return NextResponse.next();
  }

  const token = request.cookies.get("access_token")?.value;

  if (!token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|logo_octosight.png|api/).*)",
  ],
};
