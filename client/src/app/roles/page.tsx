import { Roles } from "@/app/roles/Roles";
import { AuthGate } from "@/components/general/AuthGate";
import { ACCOUNT_TYPE_ADMIN } from "@/constants";

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
