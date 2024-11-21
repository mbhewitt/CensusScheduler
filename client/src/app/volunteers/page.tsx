import { Volunteers } from "src/app/volunteers/Volunteers";
import { AuthGate } from "src/components/general/AuthGate";
import { ACCOUNT_TYPE_ADMIN } from "src/constants";

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
