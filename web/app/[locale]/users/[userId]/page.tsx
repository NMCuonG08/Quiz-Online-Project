import PublicProfile from "@/modules/client/user-profile/PublicProfile";

export default async function PublicUserProfilePage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  return <PublicProfile userId={userId} />;
}
