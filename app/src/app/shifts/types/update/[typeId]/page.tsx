import { AuthGate } from "src/app/shifts/types/update/[typeId]/AuthGate";

interface IShiftTypesUpdatePageProps {
  params: Promise<{ typeId: string }>;
}

export const metadata = {
  title: "Census | Update shift type",
};
const ShiftTypesUpdatePage = async ({ params }: IShiftTypesUpdatePageProps) => {
  // logic
  // --------------------
  const typeId = (await params).typeId;

  // render
  // --------------------
  return <AuthGate typeId={typeId} />;
};

export default ShiftTypesUpdatePage;
