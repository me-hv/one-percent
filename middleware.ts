import { type NextRequest, NextResponse } from "next/server"

// ─── Route Definitions ─────────────────────────────────────────────
const PUBLIC_ROUTES = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
]

const AUTH_ROUTES = ["/login", "/register", "/forgot-password", "/reset-password"]

// ─── Session Cookie Name ──────────────────────────────────────────
const SESSION_COOKIE = "__session"

// ─── Middleware ───────────────────────────────────────────────────
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const session = request.cookies.get(SESSION_COOKIE)

  const isPublicRoute = PUBLIC_ROUTES.some((route) => pathname.startsWith(route))
  const isAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route))
  const isApiRoute = pathname.startsWith("/api")
  const isStaticAsset =
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/public") ||
    pathname.match(/\.(svg|png|jpg|jpeg|gif|ico|webp|woff|woff2)$/)

  // ─── Allow static assets and API routes ─────────────────────────
  if (isStaticAsset || isApiRoute) {
    return NextResponse.next()
  }

  // ─── Authenticated user trying to access auth pages ──────────────
  if (session && isAuthRoute) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  // ─── Unauthenticated user trying to access protected routes ──────
  if (!session && !isPublicRoute) {
    const loginUrl = new URL("/login", request.url)
    // Preserve the intended destination for post-login redirect
    loginUrl.searchParams.set("redirect", pathname)
    return NextResponse.redirect(loginUrl)
  }

  // ─── Default: Allow ───────────────────────────────────────────────
  const response = NextResponse.next()

  // ─── Security Headers (applied to all responses) ──────────────────
  response.headers.set("X-Frame-Options", "DENY")
  response.headers.set("X-Content-Type-Options", "nosniff")
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin")

  return response
}

// ─── Matcher Config ───────────────────────────────────────────────
// Run middleware on all routes except static files and Next.js internals
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
}
