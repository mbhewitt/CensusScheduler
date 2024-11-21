import { Volunteers } from "@/app/volunteers/Volunteers";
import { AuthGate } from "@/components/general/AuthGate";
import { ACCOUNT_TYPE_ADMIN } from "@/constants";

export const metadata = {
  title: "Census | Volunteers",
};
const VolunteersPage = () => {
  // render
  // --------------------
  return (
    <AuthGate accountTypeToCheck={ACCOUNT_TYPE_ADMIN}>
      <Volunteers />
    </AuthGate>
  );
};

export default VolunteersPage;
