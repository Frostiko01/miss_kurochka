import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

const { auth } = NextAuth(authConfig);

// В Next.js 16 файл переименован: middleware.ts -> proxy.ts
// Функция должна экспортироваться как `proxy` (или default).
// NextAuth `auth` возвращает обработчик с правильной сигнатурой.
export default auth;

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|logo.png|sitemap.xml|robots.txt|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico)$).*)",
  ],
};
