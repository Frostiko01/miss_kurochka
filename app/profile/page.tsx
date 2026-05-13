import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import ProfileContent from "@/components/ProfileContent";

export default async function ProfilePage() {
  const session = await auth();

  if (!session) {
    redirect("/auth/signin");
  }

  const { user } = session;

  return <ProfileContent user={user} />;
}
