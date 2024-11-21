import { ShiftTypesUpdate } from "src/app/shifts/types/update/[typeId]/ShiftTypesUpdate";
import { AuthGate } from "src/components/general/AuthGate";
import { ACCOUNT_TYPE_SUPER_ADMIN } from "src/constants";

interface IShiftTypesUpdatePageProps {
  params: Promise<{ typeId: string }>;
}

export const metadata = {
  title: "Census | Update shift type",
};
const ShiftTypesUpdatePage = async ({ params }: IShiftTypesUpdatePageProps) => {
  // logic
  // --------------------
  const { typeId } = await params;

  // render
  // --------------------
  return (
    <AuthGate accountTypeToCheck={ACCOUNT_TYPE_SUPER_ADMIN}>
      <ShiftTypesUpdate typeId={typeId} />
    </AuthGate>
  );
};

export default ShiftTypesUpdatePage;
