import { ShiftCategories } from "@/app/shifts/categories/ShiftCategories";
import { AuthGate } from "@/components/general/AuthGate";
import { ACCOUNT_TYPE_SUPER_ADMIN } from "@/constants";

export const metadata = {
  title: "Census | Shift categories",
};
const ShiftCategoriesPage = () => {
  // render
  // ------------------------------------------------------------
  return (
    <AuthGate accountTypeToCheck={ACCOUNT_TYPE_SUPER_ADMIN}>
      <ShiftCategories />
    </AuthGate>
  );
};

export default ShiftCategoriesPage;
