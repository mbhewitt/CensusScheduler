import { AuthGate } from "src/app/volunteers/AuthGate";

export const metadata = {
  title: "Census | Volunteers",
};
const VolunteersPage = () => {
  // render
  // --------------------
  return <AuthGate />;
};

export default VolunteersPage;
