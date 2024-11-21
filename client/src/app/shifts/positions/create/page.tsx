import { ShiftPositionsCreate } from "src/app/shifts/positions/create/ShiftPositionsCreate";
import { AuthGate } from "src/components/general/AuthGate";
import { ACCOUNT_TYPE_SUPER_ADMIN } from "src/constants";

export const metadata = {
  title: "Census | Create shift position",
};
const ShiftPositionsCreatePage = () => {
  // render
  // --------------------
  return (
    <AuthGate accountTypeToCheck={ACCOUNT_TYPE_SUPER_ADMIN}>
      <ShiftPositionsCreate />
    </AuthGate>
  );
};

export default ShiftPositionsCreatePage;
