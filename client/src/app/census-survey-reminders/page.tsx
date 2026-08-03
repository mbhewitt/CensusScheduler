import { CensusSurveyReminders } from "@/app/census-survey-reminders/CensusSurveyReminders";

export const metadata = {
  title: "Census | Survey reminders",
  description:
    "Add a calendar reminder to fill out the 2026 Black Rock City Census survey.",
};

const CensusSurveyRemindersPage = () => {
  return <CensusSurveyReminders />;
};

export default CensusSurveyRemindersPage;
