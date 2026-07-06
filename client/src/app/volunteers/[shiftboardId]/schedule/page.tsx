import { Schedule } from "@/app/volunteers/[shiftboardId]/schedule/Schedule";
import { AuthGate } from "@/components/general/AuthGate";
import { ACCOUNT_TYPE_AUTHENTICATED } from "@/constants";

interface ISchedulePageProps {
  params: Promise<{ shiftboardId: string }>;
}

export const metadata = {
  title: "Census | My Shifts",
};
const SchedulePage = async ({ params }: ISchedulePageProps) => {
  // logic
  // ------------------------------------------------------------
  const { shiftboardId } = await params;

  // render
  // ------------------------------------------------------------
  return (
    <AuthGate accountTypeToCheck={ACCOUNT_TYPE_AUTHENTICATED}>
      <Schedule shiftboardId={Number(shiftboardId)} />
    </AuthGate>
  );
};

export default SchedulePage;
