import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  session: {
    strategy: "jwt" as const,
  },
  callbacks: {
    // Читаем роль из JWT токена и кладём в сессию
    // Этот callback вызывается в Edge Runtime (middleware) — без Prisma
    async jwt({ token, user }) {
      if (user) {
        // При первом входе user содержит роль (из authorize/Google)
        token.role = (user as any).role ?? "customer";
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = (token.role as string) ?? "customer";
        (session.user as any).id = token.sub;
      }
      return session;
    },
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const role = ((auth?.user as any)?.role as string) ?? "";
      const pathname = nextUrl.pathname;

      // API — всегда разрешён
      if (pathname.startsWith("/api")) return true;

      // ============ ADMIN ============
      if (pathname.startsWith("/admin")) {
        if (pathname === "/admin/signin") {
          if (isLoggedIn && role === "admin") {
            return Response.redirect(new URL("/admin/dashboard", nextUrl));
          }
          return true;
        }
        if (!isLoggedIn) {
          return Response.redirect(new URL("/admin/signin", nextUrl));
        }
        if (role !== "admin") {
          return Response.redirect(new URL("/", nextUrl));
        }
        return true;
      }

      // ============ BRANCH ============
      if (pathname.startsWith("/branch")) {
        if (pathname === "/branch/signin") {
          if (isLoggedIn && role === "branch") {
            return Response.redirect(new URL("/branch/dashboard", nextUrl));
          }
          return true;
        }
        if (!isLoggedIn) {
          return Response.redirect(new URL("/branch/signin", nextUrl));
        }
        if (role !== "branch") {
          return Response.redirect(new URL("/", nextUrl));
        }
        return true;
      }

      // ============ AUTH PAGES ============
      if (pathname.startsWith("/auth")) {
        if (isLoggedIn) {
          if (role === "admin") {
            return Response.redirect(new URL("/admin/dashboard", nextUrl));
          }
          if (role === "branch") {
            return Response.redirect(new URL("/branch/dashboard", nextUrl));
          }
          return Response.redirect(new URL("/home", nextUrl));
        }
        return true;
      }

      // ============ PROTECTED USER ROUTES ============
      const protectedPaths = [
        "/home",
        "/profile",
        "/cart",
        "/checkout",
        "/orders",
        "/menu",
        "/favorites",
        "/promotions",
        "/addresses",
        "/notifications",
        "/settings",
        "/support",
        "/branches",
      ];
      const isProtectedRoute = protectedPaths.some((p) => pathname.startsWith(p));
      if (isProtectedRoute) {
        if (!isLoggedIn) {
          return Response.redirect(
            new URL(
              `/auth/signin?callbackUrl=${encodeURIComponent(pathname)}`,
              nextUrl
            )
          );
        }
        if (role === "admin") {
          return Response.redirect(new URL("/admin/dashboard", nextUrl));
        }
        if (role === "branch") {
          return Response.redirect(new URL("/branch/dashboard", nextUrl));
        }
        return true;
      }

      // ============ LANDING ============
      if (pathname === "/") {
        if (isLoggedIn) {
          if (role === "branch") {
            return Response.redirect(new URL("/branch/dashboard", nextUrl));
          }
          if (role === "customer") {
            return Response.redirect(new URL("/home", nextUrl));
          }
          // admin может видеть лендинг
        }
        return true;
      }

      return true;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
