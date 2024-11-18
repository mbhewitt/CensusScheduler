import { AuthGate } from "src/app/shifts/positions/update/[positionId]/AuthGate";

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
  // --------------------
  const { positionId } = await params;

  // render
  // --------------------
  return <AuthGate positionId={positionId} />;
};

export default ShiftPositionsUpdatePage;
