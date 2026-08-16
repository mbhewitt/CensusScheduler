import { QrCodes } from "@/app/qr-codes/QrCodes";
import { AuthGate } from "@/components/general/AuthGate";
import { ACCOUNT_TYPE_SUPER_ADMIN } from "@/constants";

export const metadata = {
  title: "Census | QR Codes",
};

const QrCodesPage = () => (
  <AuthGate accountTypeToCheck={ACCOUNT_TYPE_SUPER_ADMIN}>
    <QrCodes />
  </AuthGate>
);

export default QrCodesPage;
