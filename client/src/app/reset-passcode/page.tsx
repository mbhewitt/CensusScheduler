import { ResetPasscode } from "@/app/reset-passcode/ResetPasscode";
import { AuthGate } from "@/components/general/AuthGate";
import { ACCOUNT_TYPE_AUTHENTICATED } from "@/constants";

export const metadata = {
  title: "PEERS | Reset Volly Passcode",
};

// AuthGate only ensures a signed-in session here; the leadership + on-playa
// checks (and the "who can I reset" scoping) live in ResetPasscode and, for
// real security, in the /api/volunteers/manageable + passcode endpoints.
const ResetPasscodePage = () => {
  return (
    <AuthGate accountTypeToCheck={ACCOUNT_TYPE_AUTHENTICATED}>
      <ResetPasscode />
    </AuthGate>
  );
};

export default ResetPasscodePage;
