import { AccountCreate } from "@/app/volunteers/account/create/AccountCreate";
import { AuthGate } from "@/components/general/AuthGate";
import { ACCOUNT_TYPE_ADMIN } from "@/constants";

export const metadata = {
  title: "Census | Create account",
};
const AccountCreatePage = () => {
  // render
  // --------------------
  return (
    <AuthGate accountTypeToCheck={ACCOUNT_TYPE_ADMIN}>
      <AccountCreate />
    </AuthGate>
  );
};

export default AccountCreatePage;
