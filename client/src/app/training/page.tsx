import { notFound } from "next/navigation";

import { Training } from "@/app/training/Training";
import { isOnPlaya } from "@/lib/training";
import { getCourseIndex } from "@/lib/trainingContent";

export const metadata = {
  title: "Census | Training",
};

const TrainingPage = async () => {
  // Off-playa this route does not exist — volunteers go to Hive, which stays
  // the authoritative copy. The offline bundle is only for the Lab tablets.
  if (!isOnPlaya()) notFound();

  const courses = await getCourseIndex();
  if (courses.length === 0) notFound();

  return <Training courses={courses} />;
};

export default TrainingPage;
