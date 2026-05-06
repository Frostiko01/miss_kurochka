import NextAuth, { DefaultSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma, prismaForAuth } from "./prisma";
import bcrypt from "bcryptjs";
import { authConfig } from "@/auth.config";
import type { Adapter } from "@auth/core/adapters";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      fullName: string;
      avatarUrl: string | null;
    } & DefaultSession["user"];
  }

  interface User {
    role: string;
    fullName: string;
    avatarUrl: string | null;
  }
}

// Кастомный адаптер который добавляет fullName
function CustomPrismaAdapter(p: typeof prismaForAuth): Adapter {
  const baseAdapter = PrismaAdapter(p);
  
  return {
    ...baseAdapter,
    createUser: async (data) => {
      // Убираем поля которых нет в схеме и добавляем fullName
      const { name, image, ...rest } = data;
      
      const userData = {
        ...rest,
        fullName: data.name || "User",
        avatarUrl: data.image || null,
        emailVerified: data.emailVerified || null, // Важно: сохраняем emailVerified
      };
      
      const createdUser = await p.user.create({
        data: userData as any,
      });
      
      // Возвращаем в формате AdapterUser
      return {
        ...createdUser,
        emailVerified: createdUser.createdAt, // NextAuth ожидает Date или null
      } as any;
    },
  };
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: CustomPrismaAdapter(prismaForAuth),
  basePath: "/api/auth",
  debug: process.env.NODE_ENV === "development",
  pages: {
    signIn: "/auth/signin",
    error: "/auth/signin", // Перенаправляем ошибки на страницу входа
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        console.log("🔐 Попытка входа через форму:", credentials?.email);
        
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email и пароль обязательны");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
          include: {
            accounts: true, // Включаем связанные аккаунты (Google, etc.)
          },
        });

        console.log("👤 Найден пользователь:", user?.email);
        console.log("🔗 OAuth аккаунты:", user?.accounts?.length || 0);
        console.log("🔑 Есть пароль:", !!user?.passwordHash);
        console.log("👑 Роль пользователя:", user?.role);

        if (!user) {
          throw new Error("Неверный email или пароль");
        }

        // Проверяем, есть ли у пользователя OAuth аккаунты (Google)
        const hasOAuthAccount = user.accounts && user.accounts.length > 0;
        
        if (hasOAuthAccount && !user.passwordHash) {
          // Пользователь зарегистрирован через Google и не имеет пароля
          const provider = user.accounts[0].provider;
          const providerName = provider === 'google' ? 'Google' : provider;
          console.log("⚠️ OAuth пользователь пытается войти через форму!");
          throw new Error(`Этот аккаунт зарегистрирован через ${providerName}. Пожалуйста, войдите через ${providerName}.`);
        }

        if (!user.passwordHash) {
          throw new Error("Неверный email или пароль");
        }

        if (user.status === "blocked") {
          throw new Error("Ваш аккаунт заблокирован");
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash
        );

        if (!isPasswordValid) {
          throw new Error("Неверный email или пароль");
        }

        console.log("✅ Вход успешен! Возвращаем пользователя с ролью:", user.role);
        return {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          avatarUrl: user.avatarUrl,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ user }) {
      // Проверяем статус пользователя при входе
      if (user.email) {
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email },
        });

        if (existingUser && existingUser.status === "blocked") {
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user, trigger, session }) {
      if (user) {
        console.log("🎫 JWT: Добавляем данные пользователя в токен", {
          id: user.id,
          email: user.email,
          role: user.role,
        });
        token.id = user.id;
        token.role = user.role;
        token.fullName = user.fullName;
        token.avatarUrl = user.avatarUrl;
      }

      // Если данных нет в токене, но есть email - загружаем из БД
      if (!token.role && token.email) {
        console.log("🔄 JWT: Загружаем роль из БД для", token.email);
        const dbUser = await prisma.user.findUnique({
          where: { email: token.email },
        });
        if (dbUser) {
          console.log("✅ JWT: Роль загружена из БД:", dbUser.role);
          token.id = dbUser.id;
          token.role = dbUser.role;
          token.fullName = dbUser.fullName;
          token.avatarUrl = dbUser.avatarUrl;
        }
      }

      if (trigger === "update" && session) {
        token.fullName = session.fullName;
        token.avatarUrl = session.avatarUrl;
      }

      console.log("🎫 JWT токен:", { email: token.email, role: token.role });
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.fullName = token.fullName as string;
        session.user.avatarUrl = token.avatarUrl as string | null;
      }
      console.log("👤 Сессия создана:", {
        email: session.user?.email,
        role: session.user?.role,
      });
      return session;
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 дней
  },
  secret: process.env.NEXTAUTH_SECRET,
  trustHost: true,
});
