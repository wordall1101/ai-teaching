import { type NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { guestRegex, isDevelopmentEnvironment } from "./lib/constants";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  /*
   * Playwright starts the dev server and requires a 200 status to
   * begin the tests, so this ensures that the tests can start
   */
  if (pathname.startsWith("/ping")) {
    return new Response("pong", { status: 200 });
  }

  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET,
    secureCookie: !isDevelopmentEnvironment,
  });

  // 首先检查是否是管理员路由访问
  if (pathname.startsWith("/admin")) {
    if (!token) {
      // 未登录，重定向到登录页，并记录要返回的URL
      const redirectUrl = encodeURIComponent(request.url);
      return NextResponse.redirect(
        new URL(`/login?redirect=${redirectUrl}`, request.url)
      );
    }

    // 已登录但不是管理员，重定向到首页或无权限页面
    if (token.role !== "admin") {
      return NextResponse.redirect(new URL("/", request.url));
    }

    // 是管理员，允许访问
    return NextResponse.next();
  }

  // 非管理员路由的逻辑
  if (!token) {
    const redirectUrl = encodeURIComponent(request.url);
    return NextResponse.redirect(
      new URL(`/api/auth/guest?redirectUrl=${redirectUrl}`, request.url)
    );
  }

  const isGuest = guestRegex.test(token?.email ?? "");

  if (token && !isGuest && ["/login", "/register"].includes(pathname)) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/chat/:id",
    "/api/:path*",
    "/login",
    "/register",
    "/admin/:path*", // 明确包含管理员路由
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
