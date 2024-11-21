import { AccountCreate } from "src/app/volunteers/account/create/AccountCreate";
import { AuthGate } from "src/components/general/AuthGate";
import { ACCOUNT_TYPE_ADMIN } from "src/constants";

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
