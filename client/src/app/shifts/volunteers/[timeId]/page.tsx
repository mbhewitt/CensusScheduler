import { ShiftVolunteers } from "@/app/shifts/volunteers/[timeId]/ShiftVolunteers";

interface IShiftVolunteersPageProps {
  params: Promise<{ timeId: string }>;
}

export const metadata = {
  title: "Census | Shift volunteers",
};
const ShiftVolunteersPage = async ({ params }: IShiftVolunteersPageProps) => {
  // logic
  // --------------------
  const { timeId } = await params;

  // render
  // --------------------
  return <ShiftVolunteers timeId={Number(timeId)} />;
};

export default ShiftVolunteersPage;
