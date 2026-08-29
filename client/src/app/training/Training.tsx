"use client";

import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  Container,
  Stack,
  Typography,
} from "@mui/material";

import NextLink from "next/link";

import { Hero } from "@/components/layout/Hero";
import type { CourseIndexEntry } from "@/components/types/training";

interface ITrainingProps {
  courses: CourseIndexEntry[];
}

export const Training = ({ courses }: ITrainingProps) => (
  <>
    <Hero
      imageStyles={{
        backgroundImage: "url(/banners/question-seamless.jpg)",
        backgroundSize: "300px 300px",
      }}
      text="Training"
    />

    <Container component="main">
      <Box component="section" sx={{ mb: 3 }}>
        <Card>
          <CardContent>
            <Typography sx={{ mb: 1 }}>
              Census training courses, available offline at the Lab. Start with{" "}
              <strong>Census Welcome and Overview</strong>, then{" "}
              <strong>Basics</strong>, then the course for the shifts you signed
              up for. Your account page lists which ones you need.
            </Typography>
            <Typography color="text.secondary">
              Anyone can review these — no login required.{" "}
              <strong>Sign in first</strong> if a course is required for a shift
              you&apos;re doing this season, so your completion is recorded toward
              that role.
            </Typography>
          </CardContent>
        </Card>
      </Box>

      <Box component="section" sx={{ mb: 4 }}>
        <Stack spacing={2}>
          {courses.map((course) => (
            <Card key={course.slug}>
              <CardActionArea component={NextLink} href={`/training/${course.slug}`}>
                <CardContent>
                  <Typography component="h2" variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
                    {course.title}
                  </Typography>
                  {course.summary && (
                    <Typography color="text.secondary" sx={{ mb: 1 }}>
                      {course.summary}
                    </Typography>
                  )}
                  <Stack direction="row" spacing={1}>
                    <Chip size="small" label={`${course.counts.lessons} lessons`} />
                    {course.counts.quizzes > 0 && (
                      <Chip size="small" label={`${course.counts.quizzes} quizzes`} />
                    )}
                  </Stack>
                </CardContent>
              </CardActionArea>
            </Card>
          ))}
        </Stack>
      </Box>
    </Container>
  </>
);
