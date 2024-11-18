import { AuthGate } from "src/app/roles/volunteers/[roleId]/AuthGate";

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
  return <AuthGate roleId={roleId} />;
};

export default RoleVolunteersPage;
