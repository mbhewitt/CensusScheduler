import { VolunteerInfo } from "@/app/volunteers/[shiftboardId]/info/VolunteerInfo";
import { AuthGate } from "@/components/general/AuthGate";
import { ACCOUNT_TYPE_AUTHENTICATED } from "@/constants";

interface IVolunteerInfoPageProps {
  params: Promise<{ shiftboardId: string }>;
}

export const metadata = {
  title: "Census | Volunteer Info",
};
const VolunteerInfoPage = async ({ params }: IVolunteerInfoPageProps) => {
  // logic
  // ------------------------------------------------------------
  const { shiftboardId } = await params;

  // render
  // ------------------------------------------------------------
  return (
    <AuthGate accountTypeToCheck={ACCOUNT_TYPE_AUTHENTICATED}>
      <VolunteerInfo shiftboardId={Number(shiftboardId)} />
    </AuthGate>
  );
};

export default VolunteerInfoPage;
