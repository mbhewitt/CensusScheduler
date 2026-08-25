import { ProvisionDevice } from "@/app/provision/ProvisionDevice";

export const metadata = {
  title: "PEERS | Provision tablet",
};

// PUBLIC page (allowlisted in middleware): the scanning tablet isn't logged in.
// The one-time token in the URL fragment is the credential.
const ProvisionPage = () => <ProvisionDevice />;

export default ProvisionPage;
