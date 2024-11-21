import { Roles } from "src/app/roles/Roles";
import { AuthGate } from "src/components/general/AuthGate";
import { ACCOUNT_TYPE_ADMIN } from "src/constants";

export const metadata = {
  title: "Census | Roles",
};
const RolesPage = () => {
  // render
  // --------------------
  return (
    <AuthGate accountTypeToCheck={ACCOUNT_TYPE_ADMIN}>
      <Roles />
    </AuthGate>
  );
};

export default RolesPage;
