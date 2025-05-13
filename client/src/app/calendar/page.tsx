import { Calendar } from "@/app/calendar/Calendar";
import { AuthGate } from "@/components/general/AuthGate";

import { ACCOUNT_TYPE_SUPER_ADMIN } from "@/constants";

export const metadata = {
  title: "Census | Calendar",
};
const CalendarPage = () => {
  // render
  // ------------------------------------------------------------
  return (
    <AuthGate accountTypeToCheck={ACCOUNT_TYPE_SUPER_ADMIN}>
      <Calendar />
    </AuthGate>
  );
};

export default CalendarPage;
