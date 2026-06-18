import { NextResponse, type NextRequest } from 'next/server'

// Next.js 16: proxy.ts replaces middleware.ts
// Runs on Node.js runtime (not Edge) — has access to full Node.js API
export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Protect dashboard routes — redirect to login if no session cookie
  const protectedRoutes = ['/dashboard', '/forms', '/settings', '/workspace']
  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route))

  if (isProtectedRoute) {
    const sessionToken =
      request.cookies.get('better-auth.session_token')?.value ??
      request.cookies.get('__Secure-better-auth.session_token')?.value

    if (!sessionToken) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  // Redirect logged-in users away from auth pages
  const authRoutes = ['/login', '/register']
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route))
  if (isAuthRoute) {
    const sessionToken = request.cookies.get('better-auth.session_token')?.value
    if (sessionToken) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|f/).*)'],
}
