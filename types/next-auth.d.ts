import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface User {
    id: string;
    email: string | null;
    fullName: string;
    avatarUrl: string | null;
    role: string;
  }

  interface Session {
    user: {
      id: string;
      email: string | null;
      fullName: string;
      avatarUrl: string | null;
      role: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    fullName: string;
    avatarUrl: string | null;
  }
}
