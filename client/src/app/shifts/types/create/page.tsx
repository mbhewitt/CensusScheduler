import { ShiftTypesCreate } from "@/app/shifts/types/create/ShiftTypesCreate";
import { AuthGate } from "@/components/general/AuthGate";
import { ACCOUNT_TYPE_SUPER_ADMIN } from "@/constants";

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
