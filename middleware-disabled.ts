import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Защищенные маршруты
  const protectedRoutes = ['/cart', '/checkout', '/orders']
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))

  if (isProtectedRoute) {
    // Проверяем наличие сессии через cookie
    const sessionToken = request.cookies.get('next-auth.session-token') || 
                        request.cookies.get('__Secure-next-auth.session-token')

    if (!sessionToken) {
      // Сохраняем URL для возврата после входа
      const url = new URL('/auth/signin', request.url)
      url.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(url)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/cart/:path*', '/checkout/:path*', '/orders/:path*']
}
