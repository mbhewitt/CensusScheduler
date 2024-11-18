import { AuthGate } from "src/app/shifts/categories/AuthGate";

export const metadata = {
  title: "Census | Shift categories",
};
const ShiftCategoriesPage = () => {
  // render
  // --------------------
  return <AuthGate />;
};

export default ShiftCategoriesPage;
