import { ShiftPositions } from "@/app/shifts/positions/ShiftPositions";
import { AuthGate } from "@/components/general/AuthGate";
import { ACCOUNT_TYPE_SUPER_ADMIN } from "@/constants";

export const metadata = {
  title: "Census | Shift positions",
};
const ShiftPositionsPage = () => {
  // render
  // ------------------------------------------------------------
  return (
    <AuthGate accountTypeToCheck={ACCOUNT_TYPE_SUPER_ADMIN}>
      <ShiftPositions />
    </AuthGate>
  );
};

export default ShiftPositionsPage;
