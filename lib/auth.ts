import NextAuth, { DefaultSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "./prisma";
import bcrypt from "bcryptjs";
import { authConfig } from "@/auth.config";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      fullName: string;
      phone?: string | null;
      avatarUrl: string | null;
    } & DefaultSession["user"];
  }

  interface User {
    role: string;
    fullName: string;
    avatarUrl: string | null;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  debug: false,
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
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
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email и пароль обязательны");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
          include: { accounts: true },
        });

        if (!user) {
          throw new Error("Неверный email или пароль");
        }

        const hasOAuthAccount = user.accounts && user.accounts.length > 0;
        if (hasOAuthAccount && !user.passwordHash) {
          const provider = user.accounts[0].provider;
          const providerName = provider === 'google' ? 'Google' : provider;
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

        return {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          phone: user.phone,
          avatarUrl: user.avatarUrl,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ user, account, profile }) {
      // Проверяем статус пользователя при входе
      if (user.email) {
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email },
        });

        if (existingUser && existingUser.status === "blocked") {
          return false;
        }

        // Если это OAuth вход и пользователь не существует, создаем его
        if (account?.provider === "google" && !existingUser) {
          await prisma.user.create({
            data: {
              email: user.email!,
              fullName: user.name || "User",
              avatarUrl: user.image || null,
              role: "customer",
              status: "active",
            },
          });
        }
      }
      return true;
    },
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.fullName = user.fullName;
        token.avatarUrl = user.avatarUrl;
      }

      // Если данных нет в токене, но есть email — загружаем из БД (только один раз)
      if (!token.role && token.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: token.email },
          select: { id: true, role: true, fullName: true, phone: true, avatarUrl: true },
        });
        if (dbUser) {
          token.id = dbUser.id;
          token.role = dbUser.role;
          token.fullName = dbUser.fullName;
          token.phone = dbUser.phone;
          token.avatarUrl = dbUser.avatarUrl;
        }
      }

      if (trigger === "update" && session) {
        token.fullName = session.fullName;
        token.phone = session.phone;
        token.avatarUrl = session.avatarUrl;
      }

      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.fullName = token.fullName as string;
        session.user.phone = token.phone as string | null;
        session.user.avatarUrl = token.avatarUrl as string | null;
      }
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
