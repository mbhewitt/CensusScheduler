import { Settings } from "@/app/settings/Settings";
import { AuthGate } from "@/components/general/AuthGate";
import { ACCOUNT_TYPE_ADMIN } from "@/constants";

export const metadata = {
  title: "Census | Admin settings",
};
const SettingsPage = () => {
  // render
  // ------------------------------------------------------------
  return (
    <AuthGate accountTypeToCheck={ACCOUNT_TYPE_ADMIN}>
      <Settings />
    </AuthGate>
  );
};

export default SettingsPage;
