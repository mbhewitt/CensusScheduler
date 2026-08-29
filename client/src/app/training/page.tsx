import { notFound } from "next/navigation";

import { Training } from "@/app/training/Training";
import { getCourseIndex } from "@/lib/trainingContent";

export const metadata = {
  title: "Census | Training",
};

const TrainingPage = async () => {
  // Public everywhere now (per Chipper 2026-08-29): anyone can review the
  // bundled courses, on or off playa. Only the completion step stays gated.
  const courses = await getCourseIndex();
  if (courses.length === 0) notFound();

  return <Training courses={courses} />;
};

export default TrainingPage;
