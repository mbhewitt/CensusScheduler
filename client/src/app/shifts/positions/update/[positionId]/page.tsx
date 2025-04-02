import { ShiftPositionsUpdate } from "@/app/shifts/positions/update/[positionId]/ShiftPositionsUpdate";
import { AuthGate } from "@/components/general/AuthGate";
import { ACCOUNT_TYPE_SUPER_ADMIN } from "@/constants";

interface IShiftPositionsUpdatePageProps {
  params: Promise<{ positionId: string }>;
}

export const metadata = {
  title: "Census | Update shift position",
};
const ShiftPositionsUpdatePage = async ({
  params,
}: IShiftPositionsUpdatePageProps) => {
  // logic
  // ------------------------------------------------------------
  const { positionId } = await params;

  // render
  // ------------------------------------------------------------
  return (
    <AuthGate accountTypeToCheck={ACCOUNT_TYPE_SUPER_ADMIN}>
      <ShiftPositionsUpdate positionId={positionId} />
    </AuthGate>
  );
};

export default ShiftPositionsUpdatePage;
