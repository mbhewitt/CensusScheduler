import { ProvisionTablet } from "@/app/provision-tablet/ProvisionTablet";
import { AuthGate } from "@/components/general/AuthGate";
import { ACCOUNT_TYPE_SUPER_ADMIN } from "@/constants";

export const metadata = {
  title: "PEERS | Provision tablet",
};

// Super-admin only — mints provisioning QR codes. The /api/provision/token
// endpoint enforces the same via withAuth + a super-admin role check; AuthGate
// is the client-side mirror so non-super-admins don't see the page.
const ProvisionTabletPage = () => (
  <AuthGate accountTypeToCheck={ACCOUNT_TYPE_SUPER_ADMIN}>
    <ProvisionTablet />
  </AuthGate>
);

export default ProvisionTabletPage;
