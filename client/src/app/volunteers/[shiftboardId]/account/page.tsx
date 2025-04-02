import { Account } from "@/app/volunteers/[shiftboardId]/account/Account";
import { AuthGate } from "@/components/general/AuthGate";
import { ACCOUNT_TYPE_AUTHENTICATED } from "@/constants";

interface IAccountPageProps {
  params: Promise<{ shiftboardId: string }>;
}

export const metadata = {
  title: "Census | Account",
};
const AccountPage = async ({ params }: IAccountPageProps) => {
  // logic
  // ------------------------------------------------------------
  const { shiftboardId } = await params;

  // render
  // ------------------------------------------------------------
  return (
    <AuthGate accountTypeToCheck={ACCOUNT_TYPE_AUTHENTICATED}>
      <Account shiftboardId={Number(shiftboardId)} />
    </AuthGate>
  );
};

export default AccountPage;
