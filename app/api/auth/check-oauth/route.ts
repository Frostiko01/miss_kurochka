import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ hasOAuth: false });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        accounts: true,
      },
    });

    if (!user) {
      return NextResponse.json({ hasOAuth: false });
    }

    const hasOAuthAccount = user.accounts && user.accounts.length > 0;
    const hasPassword = !!user.passwordHash;

    if (hasOAuthAccount && !hasPassword) {
      const provider = user.accounts[0].provider;
      const providerName = provider === 'google' ? 'Google' : provider;
      
      return NextResponse.json({
        hasOAuth: true,
        provider: providerName,
        message: `Этот аккаунт зарегистрирован через ${providerName}. Пожалуйста, войдите через ${providerName}.`,
      });
    }

    return NextResponse.json({ hasOAuth: false });
  } catch (error) {
    console.error("Check OAuth error:", error);
    return NextResponse.json({ hasOAuth: false });
  }
}
