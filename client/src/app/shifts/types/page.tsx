import { ShiftTypes } from "src/app/shifts/types/ShiftTypes";
import { AuthGate } from "src/components/general/AuthGate";
import { ACCOUNT_TYPE_SUPER_ADMIN } from "src/constants";

export const metadata = {
  title: "Census | Shift types",
};
const ShiftTypesPage = () => {
  // render
  // --------------------
  return (
    <AuthGate accountTypeToCheck={ACCOUNT_TYPE_SUPER_ADMIN}>
      <ShiftTypes />
    </AuthGate>
  );
};

export default ShiftTypesPage;
