import { notFound } from "next/navigation";

import { TrainingCourse } from "@/app/training/TrainingCourse";
import { slugToTrainingCode } from "@/lib/training";
import { getCourse } from "@/lib/trainingContent";

interface ITrainingCoursePageProps {
  params: Promise<{ slug: string }>;
}

export const generateMetadata = async ({ params }: ITrainingCoursePageProps) => {
  const { slug } = await params;
  const course = await getCourse(slug);

  return { title: course ? `Census | ${course.title}` : "Census | Training" };
};

const TrainingCoursePage = async ({ params }: ITrainingCoursePageProps) => {
  // Public everywhere now (per Chipper 2026-08-29). The completion step
  // (/training/confirmation/[code]) stays gated to credit a signed-in volunteer.
  const { slug } = await params;
  const course = await getCourse(slug);

  if (!course) notFound();

  // Drives the "Record my completion" button at the end of the course, which
  // hands off to the existing /training/confirmation/[code] flow.
  const confirmationCode = slugToTrainingCode(slug);

  return <TrainingCourse course={course} confirmationCode={confirmationCode} />;
};

export default TrainingCoursePage;
