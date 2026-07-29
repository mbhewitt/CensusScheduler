import { Printing } from "@/app/printing/Printing";
import { AuthGate } from "@/components/general/AuthGate";
import { ACCOUNT_TYPE_SUPER_ADMIN } from "@/constants";

export const metadata = {
  title: "Census | Printing",
};
const PrintingPage = () => {
  // render
  // ------------------------------------------------------------
  return (
    <AuthGate accountTypeToCheck={ACCOUNT_TYPE_SUPER_ADMIN}>
      <Printing />
    </AuthGate>
  );
};

export default PrintingPage;
