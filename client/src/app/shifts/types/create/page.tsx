import { ShiftTypesCreate } from "src/app/shifts/types/create/ShiftTypesCreate";
import { AuthGate } from "src/components/general/AuthGate";
import { ACCOUNT_TYPE_SUPER_ADMIN } from "src/constants";

export const metadata = {
  title: "Census | Create shift type",
};
const ShiftTypesCreatePage = () => {
  // render
  // --------------------
  return (
    <AuthGate accountTypeToCheck={ACCOUNT_TYPE_SUPER_ADMIN}>
      <ShiftTypesCreate />
    </AuthGate>
  );
};

export default ShiftTypesCreatePage;
