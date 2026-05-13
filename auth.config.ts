import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const pathname = nextUrl.pathname;

      // Разрешаем доступ к API маршрутам всегда
      if (pathname.startsWith("/api")) {
        return true;
      }

      // Защита админских маршрутов
      if (pathname.startsWith("/admin")) {
        // Разрешаем доступ к странице входа админа
        if (pathname === "/admin/signin") {
          // Если админ уже авторизован, перенаправляем в админку
          if (isLoggedIn && auth?.user?.role === "admin") {
            return Response.redirect(new URL("/admin/dashboard", nextUrl));
          }
          return true;
        }

        // Для всех остальных админских маршрутов требуется авторизация
        if (!isLoggedIn) {
          return Response.redirect(new URL("/admin/signin", nextUrl));
        }

        // Проверяем роль админа
        if (auth?.user?.role !== "admin") {
          return Response.redirect(new URL("/", nextUrl));
        }

        return true;
      }

      // Защита маршрутов филиалов
      if (pathname.startsWith("/branch")) {
        // Разрешаем доступ к странице входа филиала
        if (pathname === "/branch/signin") {
          // Если филиал уже авторизован, перенаправляем в панель
          if (isLoggedIn && auth?.user?.role === "branch") {
            return Response.redirect(new URL("/branch/dashboard", nextUrl));
          }
          return true;
        }

        // Для всех остальных маршрутов филиала требуется авторизация
        if (!isLoggedIn) {
          return Response.redirect(new URL("/branch/signin", nextUrl));
        }

        // Проверяем роль филиала
        if (auth?.user?.role !== "branch") {
          return Response.redirect(new URL("/", nextUrl));
        }

        return true;
      }

      // Защита пользовательских маршрутов от админов и филиалов
      if (pathname.startsWith("/profile") || pathname.startsWith("/cart") || pathname.startsWith("/checkout") || pathname.startsWith("/orders")) {
        if (!isLoggedIn) {
          return Response.redirect(new URL("/auth/signin?callbackUrl=" + encodeURIComponent(pathname), nextUrl));
        }

        // Админы и филиалы не могут заходить в пользовательские маршруты
        if (auth?.user?.role === "admin") {
          return Response.redirect(new URL("/admin/dashboard", nextUrl));
        }
        if (auth?.user?.role === "branch") {
          return Response.redirect(new URL("/branch/dashboard", nextUrl));
        }

        return true;
      }

      // Главная страница - только админы перенаправляются
      if (pathname === "/") {
        if (isLoggedIn && auth?.user?.role === "admin") {
          return Response.redirect(new URL("/admin/dashboard", nextUrl));
        }
        // Убираем перенаправление для branch и customer - они остаются на главной
      }

      const isOnAuthPage = pathname.startsWith("/auth/signin") || 
                          pathname.startsWith("/auth/signup");

      // Если на странице авторизации и уже залогинен - редирект на главную
      if (isOnAuthPage && isLoggedIn) {
        if (auth?.user?.role === "admin") {
          return Response.redirect(new URL("/admin/dashboard", nextUrl));
        }
        // Обычные пользователи и филиалы идут на главную
        return Response.redirect(new URL("/", nextUrl));
      }

      return true;
    },
  },
  providers: [], // Провайдеры добавляются в lib/auth.ts
} satisfies NextAuthConfig;
