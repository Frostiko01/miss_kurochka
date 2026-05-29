import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import ProfileContent from "@/components/ProfileContent";
import MobileProfileScreen from "@/components/mobile/MobileProfileScreen";

interface ProfileUser {
  fullName: string;
  email: string;
  phone?: string | null;
  avatarUrl: string | null;
  role: string;
}

export default async function ProfilePage() {
  const session = await auth();

  if (!session) {
    redirect("/auth/signin");
  }

  // session.user уже содержит fullName, email, role и пр. (см. lib/auth.ts).
  const user = session.user as unknown as ProfileUser;

  return (
    <>
      {/* Mobile */}
      <div className="md:hidden">
        <MobileProfileScreen user={user} />
      </div>
      {/* Desktop */}
      <div className="hidden md:block">
        <ProfileContent user={user} />
      </div>
    </>
  );
}
