import { Saps } from "@/app/saps/Saps";
import { AuthGate } from "@/components/general/AuthGate";
import { ACCOUNT_TYPE_SUPER_ADMIN } from "@/constants";

export const metadata = {
  title: "Census | SAPs",
};

const SapsPage = () => {
  return (
    <AuthGate accountTypeToCheck={ACCOUNT_TYPE_SUPER_ADMIN}>
      <Saps />
    </AuthGate>
  );
};

export default SapsPage;
