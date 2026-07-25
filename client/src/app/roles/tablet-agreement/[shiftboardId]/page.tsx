import { TabletAgreement } from "@/app/roles/tablet-agreement/[shiftboardId]/TabletAgreement";

interface ITabletAgreementPageProps {
  params: Promise<{ shiftboardId: string }>;
}

export const metadata = {
  title: "PEERS | Tablet Agreement",
};
const TabletAgreementPage = async ({ params }: ITabletAgreementPageProps) => {
  const { shiftboardId } = await params;
  return <TabletAgreement shiftboardId={shiftboardId} />;
};

export default TabletAgreementPage;
