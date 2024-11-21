import { ShiftCategories } from "src/app/shifts/categories/ShiftCategories";
import { AuthGate } from "src/components/general/AuthGate";
import { ACCOUNT_TYPE_SUPER_ADMIN } from "src/constants";

export const metadata = {
  title: "Census | Shift categories",
};
const ShiftCategoriesPage = () => {
  // render
  // --------------------
  return (
    <AuthGate accountTypeToCheck={ACCOUNT_TYPE_SUPER_ADMIN}>
      <ShiftCategories />
    </AuthGate>
  );
};

export default ShiftCategoriesPage;
