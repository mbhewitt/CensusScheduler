import { ShiftVolunteers } from "@/app/shifts/[timeId]/volunteers/ShiftVolunteers";

interface IShiftVolunteersPageProps {
  params: Promise<{ timeId: string }>;
}

export const metadata = {
  title: "Census | Shift Detail",
};
const ShiftVolunteersPage = async ({ params }: IShiftVolunteersPageProps) => {
  // logic
  // ------------------------------------------------------------
  const { timeId } = await params;

  // render
  // ------------------------------------------------------------
  return <ShiftVolunteers timeId={Number(timeId)} />;
};

export default ShiftVolunteersPage;
