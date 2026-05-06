import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const session = await auth();
  
  return NextResponse.json({
    session,
    hasSession: !!session,
    user: session?.user || null,
    role: session?.user?.role || null,
  });
}
