import { TrainingConfirmation } from "@/app/training/confirmation/[code]/TrainingConfirmation";

interface ITrainingConfirmationPageProps {
  params: Promise<{ code: string }>;
}

export const metadata = {
  title: "Census | Training confirmation",
};
const TrainingConfirmationPage = async ({
  params,
}: ITrainingConfirmationPageProps) => {
  // logic
  // ------------------------------------------------------------
  const { code } = await params;

  // render
  // ------------------------------------------------------------
  return <TrainingConfirmation code={Number(code)} />;
};

export default TrainingConfirmationPage;
