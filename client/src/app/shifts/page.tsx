import { ShiftsAgenda } from "@/app/shifts/ShiftsAgenda";

export const metadata = {
  title: "Census | Shifts",
};

// Renders the agenda (see ShiftsAgenda). To revert to the old data-table,
// swap this back to `import { Shifts } ...` / `return <Shifts />` — the old
// table component is kept intact at @/app/shifts/Shifts.
const ShiftsPage = () => {
  return <ShiftsAgenda />;
};

export default ShiftsPage;
