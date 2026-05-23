import { redirect } from "next/navigation";

// /volunteers/[id]/account is the legacy URL — the canonical page is now
// /volunteers/[id]/info (the VIP page). Server-side redirect preserves
// bookmarks and external links. Per @mbhewitt 2026-05-23.

interface IAccountPageProps {
  params: Promise<{ shiftboardId: string }>;
}

const AccountPage = async ({ params }: IAccountPageProps) => {
  const { shiftboardId } = await params;
  redirect(`/volunteers/${shiftboardId}/info`);
};

export default AccountPage;
