import { RoleVolunteers } from "src/app/roles/volunteers/[roleId]/RoleVolunteers";
import { AuthGate } from "src/components/general/AuthGate";
import { ACCOUNT_TYPE_ADMIN } from "src/constants";

interface IRoleVolunteersPageProps {
  params: Promise<{ roleId: string }>;
}

export const metadata = {
  title: "Census | Role volunteers",
};
const RoleVolunteersPage = async ({ params }: IRoleVolunteersPageProps) => {
  // logic
  // --------------------
  const { roleId } = await params;

  // render
  // --------------------
  return (
    <AuthGate accountTypeToCheck={ACCOUNT_TYPE_ADMIN}>
      <RoleVolunteers roleId={roleId} />
    </AuthGate>
  );
};

export default RoleVolunteersPage;
