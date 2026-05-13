import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Защищенные маршруты для обычных пользователей
  const protectedRoutes = ['/cart', '/checkout', '/orders', '/profile']
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))

  if (isProtectedRoute) {
    // Проверяем наличие сессии через cookie (разные варианты названий)
    const sessionToken = request.cookies.get('next-auth.session-token') || 
                        request.cookies.get('__Secure-next-auth.session-token') ||
                        request.cookies.get('authjs.session-token') ||
                        request.cookies.get('__Secure-authjs.session-token')

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
  matcher: [
    // Только защищенные маршруты
    '/cart/:path*', 
    '/checkout/:path*', 
    '/orders/:path*', 
    '/profile/:path*'
  ]
}