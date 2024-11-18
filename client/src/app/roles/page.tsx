import { AuthGate } from "src/app/roles/AuthGate";

export const metadata = {
  title: "Census | Roles",
};
const RolesPage = () => {
  // render
  // --------------------
  return <AuthGate />;
};

export default RolesPage;
