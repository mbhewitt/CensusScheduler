import { ShiftPositionsCreate } from "@/app/shifts/positions/create/ShiftPositionsCreate";
import { AuthGate } from "@/components/general/AuthGate";
import { ACCOUNT_TYPE_SUPER_ADMIN } from "@/constants";

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
