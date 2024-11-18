import { BehavioralStandards } from "src/app/roles/behavioral-standards/[shiftboardId]/BehavioralStandards";

interface IBehavioralStandardsPageProps {
  params: Promise<{ shiftboardId: string }>;
}

export const metadata = {
  title: "Census | Behavioral Standards",
};
const BehavioralStandardsPage = async ({
  params,
}: IBehavioralStandardsPageProps) => {
  // logic
  // --------------------
  const { shiftboardId } = await params;

  // render
  // --------------------
  return <BehavioralStandards shiftboardId={shiftboardId} />;
};

export default BehavioralStandardsPage;
