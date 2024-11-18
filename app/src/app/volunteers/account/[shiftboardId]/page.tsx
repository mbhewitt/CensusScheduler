import { AuthGate } from "src/app/volunteers/account/[shiftboardId]/AuthGate";

interface IAccountPageProps {
  params: Promise<{ shiftboardId: string }>;
}

export const metadata = {
  title: "Census | Account",
};
const AccountPage = async ({ params }: IAccountPageProps) => {
  // logic
  // --------------------
  const shiftboardId = (await params).shiftboardId;

  // render
  // --------------------
  return <AuthGate shiftboardId={shiftboardId} />;
};

export default AccountPage;
