import { AuthGate } from "src/app/shifts/types/create/AuthGate";

export const metadata = {
  title: "Census | Create shift type",
};
const ShiftTypesCreatePage = () => {
  // render
  // --------------------
  return <AuthGate />;
};

export default ShiftTypesCreatePage;
