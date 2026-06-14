import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth({
  pages: {
    signIn: "/",
  },
  callbacks: {
    authorized({ token, req }) {
      const { pathname } = req.nextUrl

      // Allow access to auth API routes without authentication
      if (pathname.startsWith("/api/auth/")) {
        return true
      }

      // Allow access to the root page (login/app based on session)
      if (pathname === "/") {
        return true
      }

      // For all other routes, require authentication
      return !!token
    },
  },
})

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     */
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
