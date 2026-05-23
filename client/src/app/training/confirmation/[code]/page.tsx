import { TrainingConfirmation } from "@/app/training/confirmation/[code]/TrainingConfirmation";
import { AuthGate } from "@/components/general/AuthGate";
import { ACCOUNT_TYPE_AUTHENTICATED } from "@/constants";

interface ITrainingConfirmationPageProps {
  params: Promise<{ code: string }>;
}

export const metadata = {
  title: "Census | Training confirmation",
};
const TrainingConfirmationPage = async ({
  params,
}: ITrainingConfirmationPageProps) => {
  const { code } = await params;

  return (
    <AuthGate accountTypeToCheck={ACCOUNT_TYPE_AUTHENTICATED}>
      <TrainingConfirmation code={code} />
    </AuthGate>
  );
};

export default TrainingConfirmationPage;
