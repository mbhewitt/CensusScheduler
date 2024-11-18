import { AuthGate } from "src/app/shifts/positions/create/AuthGate";

export const metadata = {
  title: "Census | Create shift position",
};
const ShiftPositionsCreatePage = () => {
  // render
  // --------------------
  return <AuthGate />;
};

export default ShiftPositionsCreatePage;
