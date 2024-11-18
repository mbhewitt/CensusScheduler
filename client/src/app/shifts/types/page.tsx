import { AuthGate } from "src/app/shifts/types/AuthGate";

export const metadata = {
  title: "Census | Shift types",
};
const ShiftTypesPage = () => {
  // render
  // --------------------
  return <AuthGate />;
};

export default ShiftTypesPage;
