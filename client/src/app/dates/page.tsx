import { Dates } from "@/app/dates/Dates";
import { AuthGate } from "@/components/general/AuthGate";

import { ACCOUNT_TYPE_SUPER_ADMIN } from "@/constants";

export const metadata = {
  title: "Census | Dates",
};
const DatesPage = () => {
  // render
  // ------------------------------------------------------------
  return (
    <AuthGate accountTypeToCheck={ACCOUNT_TYPE_SUPER_ADMIN}>
      <Dates />
    </AuthGate>
  );
};

export default DatesPage;
