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
import { useContext } from "react";

import { Hero } from "@/components/layout/Hero";
import type { CourseIndexEntry } from "@/components/types/training";
import { useIsOnPlaya } from "@/hooks/useIsOnPlaya";
import { DeveloperModeContext } from "@/state/developer-mode/context";
import { SessionContext } from "@/state/session/context";
import { checkIsAuthenticated } from "@/utils/checkIsRoleExist";

interface ITrainingProps {
  courses: CourseIndexEntry[];
}

// The welcome course was exported from the Census Community space itself.
const COMMUNITY_SLUG = "welcome";
const INTRO_SLUGS = ["welcome", "basics"];

// Off playa, Hive is the training tool (per Chipper 2026-10-30): lead with the
// Census Community and each course on Hive, and tuck the bundled copies into a
// small link row at the bottom. On playa (build flag or provisioned tablet)
// Hive doesn't load, so the bundled copies stay front and center.
export const Training = ({ courses }: ITrainingProps) => {
  const isOnPlaya = useIsOnPlaya();
  const {
    developerModeState: { accountType },
  } = useContext(DeveloperModeContext);
  const {
    sessionState: {
      settings: { isAuthenticated: isAuthenticatedSession },
    },
  } = useContext(SessionContext);
  const isAuthenticated = checkIsAuthenticated(
    accountType,
    isAuthenticatedSession
  );
  const communityUrl = courses.find((c) => c.slug === COMMUNITY_SLUG)?.hiveUrl;
  const hiveFirst = isOnPlaya === false && Boolean(communityUrl);
  // Signed out, only the intro courses are advertised; the role courses are
  // still reachable by URL (public, indexed), just not linked here.
  const offlineCourses = isAuthenticated
    ? courses
    : courses.filter((c) => INTRO_SLUGS.includes(c.slug));

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
        {/* Hold off until the tablet check resolves, so off playa doesn't
            flash the offline layout's course links first. */}
        {isOnPlaya === undefined ? null : hiveFirst ? (
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

            {/* Hive is the one call to action off playa; the course list is
                just orientation, not links (per Chipper 2026-10-30). */}
            <Box component="section" sx={{ mb: 3 }}>
              <Card>
                <CardContent>
                  <Typography component="h2" variant="h6" sx={{ mb: 1 }}>
                    Which course do I need?
                  </Typography>
                  <Stack component="ul" spacing={1} sx={{ mt: 0, pl: 3 }}>
                    {courses.map((course) => (
                      <Typography component="li" key={course.slug}>
                        <strong>{course.title}</strong>
                        {course.summary && <>: {course.summary}</>}
                      </Typography>
                    ))}
                  </Stack>
                  <Typography color="text.secondary" sx={{ mt: 1 }}>
                    Not sure which role fits you? Read about the{" "}
                    <Link component={NextLink} href="/#volunteer-roles">
                      volunteer roles
                    </Link>
                    .
                  </Typography>
                </CardContent>
              </Card>
            </Box>

            <Box component="section" sx={{ mb: 4 }}>
              <Typography color="text.secondary" variant="body2">
                On playa without internet? Offline copies:{" "}
                {offlineCourses.map((course, i) => (
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
