"use client";

import { OpenInNew as OpenInNewIcon } from "@mui/icons-material";
import {
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  Container,
  Link,
  Stack,
  Typography,
} from "@mui/material";

import NextLink from "next/link";

import { Hero } from "@/components/layout/Hero";
import type { CourseIndexEntry } from "@/components/types/training";
import { useIsOnPlaya } from "@/hooks/useIsOnPlaya";

interface ITrainingProps {
  courses: CourseIndexEntry[];
}

// The welcome course was exported from the Census Community space itself.
const COMMUNITY_SLUG = "welcome";

// Off playa, Hive is the training tool (per Chipper 2026-10-30): lead with the
// Census Community and each course on Hive, and tuck the bundled copies into a
// small link row at the bottom. On playa (build flag or provisioned tablet)
// Hive doesn't load, so the bundled copies stay front and center.
export const Training = ({ courses }: ITrainingProps) => {
  const isOnPlaya = useIsOnPlaya();
  const communityUrl = courses.find((c) => c.slug === COMMUNITY_SLUG)?.hiveUrl;
  const hiveFirst = isOnPlaya === false && Boolean(communityUrl);

  return (
    <>
      <Hero
        imageStyles={{
          backgroundImage: "url(/banners/question-seamless.jpg)",
          backgroundSize: "300px 300px",
        }}
        text="Training"
      />

      <Container component="main">
        {hiveFirst ? (
          <>
            <Box component="section" sx={{ mb: 3 }}>
              <Card>
                <CardContent>
                  <Typography sx={{ mb: 2 }}>
                    Census training lives in the{" "}
                    <strong>Census Community on Burning Man Hive</strong>. Sign
                    in to Hive with your Burner Profile, start with{" "}
                    <strong>Census Welcome and Overview</strong>, then{" "}
                    <strong>Basics</strong>, then the course for the shifts you
                    signed up for. Your account checklist links to the ones you
                    need.
                  </Typography>
                  <Button
                    component="a"
                    endIcon={<OpenInNewIcon />}
                    href={communityUrl ?? ""}
                    rel="noopener noreferrer"
                    size="large"
                    target="_blank"
                    variant="contained"
                  >
                    Open the Census Community on Hive
                  </Button>
                </CardContent>
              </Card>
            </Box>

            <Box component="section" sx={{ mb: 3 }}>
              <Stack spacing={2}>
                {courses.map((course) => (
                  <Card key={course.slug}>
                    <CardActionArea
                      component="a"
                      href={course.hiveUrl ?? `/training/${course.slug}`}
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      <CardContent>
                        <Typography
                          component="h2"
                          variant="h6"
                          sx={{ fontWeight: 700, mb: 0.5 }}
                        >
                          {course.title}
                        </Typography>
                        {course.summary && (
                          <Typography color="text.secondary" sx={{ mb: 1 }}>
                            {course.summary}
                          </Typography>
                        )}
                        <Chip
                          icon={<OpenInNewIcon />}
                          label="Opens on Hive"
                          size="small"
                        />
                      </CardContent>
                    </CardActionArea>
                  </Card>
                ))}
              </Stack>
            </Box>

            <Box component="section" sx={{ mb: 4 }}>
              <Typography color="text.secondary" variant="body2">
                On playa without internet? Offline copies:{" "}
                {courses.map((course, i) => (
                  <span key={course.slug}>
                    {i > 0 && " · "}
                    <Link component={NextLink} href={`/training/${course.slug}`}>
                      {course.title}
                    </Link>
                  </span>
                ))}
              </Typography>
            </Box>
          </>
        ) : (
          <>
            <Box component="section" sx={{ mb: 3 }}>
              <Card>
                <CardContent>
                  <Typography sx={{ mb: 1 }}>
                    Offline copies of our Census training courses, for use at
                    the Census Lab where Hive doesn&apos;t load. Start with{" "}
                    <strong>Census Welcome and Overview</strong>, then{" "}
                    <strong>Basics</strong>, then the course for the shifts you
                    signed up for. Your account page lists which ones you need.
                  </Typography>
                  <Typography color="text.secondary">
                    Anyone can review these, no login required.{" "}
                    <strong>Sign in first</strong> if a course is required for a
                    shift you&apos;re doing this season, so your completion is
                    recorded toward that role.
                  </Typography>
                </CardContent>
              </Card>
            </Box>

            <Box component="section" sx={{ mb: 4 }}>
              <Stack spacing={2}>
                {courses.map((course) => (
                  <Card key={course.slug}>
                    <CardActionArea
                      component={NextLink}
                      href={`/training/${course.slug}`}
                    >
                      <CardContent>
                        <Typography
                          component="h2"
                          variant="h6"
                          sx={{ fontWeight: 700, mb: 0.5 }}
                        >
                          {course.title}
                        </Typography>
                        {course.summary && (
                          <Typography color="text.secondary" sx={{ mb: 1 }}>
                            {course.summary}
                          </Typography>
                        )}
                        <Stack direction="row" spacing={1}>
                          <Chip
                            size="small"
                            label={`${course.counts.lessons} lessons`}
                          />
                          {course.counts.quizzes > 0 && (
                            <Chip
                              size="small"
                              label={`${course.counts.quizzes} quizzes`}
                            />
                          )}
                        </Stack>
                      </CardContent>
                    </CardActionArea>
                  </Card>
                ))}
              </Stack>
            </Box>
          </>
        )}
      </Container>
    </>
  );
};
