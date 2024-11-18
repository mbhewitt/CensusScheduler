import { AuthGate } from "src/app/shifts/positions/AuthGate";

export const metadata = {
  title: "Census | Shift positions",
};
const ShiftPositionsPage = () => {
  // render
  // --------------------
  return <AuthGate />;
};

export default ShiftPositionsPage;
