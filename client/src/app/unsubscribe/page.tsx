import { Unsubscribe } from "@/app/unsubscribe/Unsubscribe";
import { AuthGate } from "@/components/general/AuthGate";
import { ACCOUNT_TYPE_AUTHENTICATED } from "@/constants";

export const metadata = {
  title: "PEERS | Unsubscribe",
};

const UnsubscribePage = () => {
  return (
    <AuthGate accountTypeToCheck={ACCOUNT_TYPE_AUTHENTICATED}>
      <Unsubscribe />
    </AuthGate>
  );
};

export default UnsubscribePage;
