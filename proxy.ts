import createIntlMiddleware from "next-intl/middleware"
import { NextResponse, type NextRequest } from "next/server"

import { routing } from "@/i18n/routing"
import { updateSession } from "@/lib/supabase/proxy"

const PROTECTED_PREFIXES = [
  "/admin",
  "/clients",
  "/commissions",
  "/dashboard",
  "/documents",
  "/leads",
  "/payments",
  "/pipeline",
  "/projects",
  "/settings",
]

const intlMiddleware = createIntlMiddleware(routing)

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname.startsWith("/api")) {
    return NextResponse.next()
  }

  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p))
  const isAuth = pathname.startsWith("/auth")

  if (isProtected || isAuth) {
    return updateSession(request)
  }

  return intlMiddleware(request)
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
}
