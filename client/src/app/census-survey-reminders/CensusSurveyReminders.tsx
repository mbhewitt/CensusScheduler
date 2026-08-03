"use client";

import {
  CalendarMonth as CalendarIcon,
  Download as DownloadIcon,
  Share as ShareIcon,
} from "@mui/icons-material";
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Divider,
  Link as MuiLink,
  Stack,
  Typography,
} from "@mui/material";
import { enqueueSnackbar } from "notistack";

import { Hero } from "@/components/layout/Hero";

const BASE = "/census-reminders/";
const RECOMMENDED = `${BASE}2026-census-reminders-recommended.ics`;
const ALL = `${BASE}2026-census-reminders-all.ics`;
const QR_PNG = `${BASE}2026-census-reminder-offline-qr.png`;
const QR_SVG = `${BASE}2026-census-reminder-offline-qr.svg`;

// Individual reminders (label -> file), in the order requested in #589.
const INDIVIDUAL: { label: string; when: string; file: string }[] = [
  { label: "Saturday night after the Man burns", when: "Sat Sep 5, 10:00 PM", file: "2026-census-reminder-saturday-after-man-burn.ics" },
  { label: "Labor Day afternoon", when: "Mon Sep 7, 2:00 PM", file: "2026-census-reminder-labor-day.ics" },
  { label: "Tuesday post-event", when: "Tue Sep 8, 12:00 PM", file: "2026-census-reminder-tuesday-noon.ics" },
  { label: "Friday afternoon", when: "Fri Sep 11, 4:00 PM", file: "2026-census-reminder-friday-afternoon.ics" },
  { label: "Sunday after decompression", when: "Sun Sep 13, 3:00 PM", file: "2026-census-reminder-sunday-decompression.ics" },
  { label: "Final October reminder", when: "Tue Oct 6, 12:00 PM", file: "2026-census-reminder-final-nudge.ics" },
];

const SHARE_TEXT =
  "Help count Black Rock City! Add a reminder to fill out the 2026 BRC Census survey:";

export const CensusSurveyReminders = () => {
  const pageUrl =
    typeof window !== "undefined"
      ? window.location.href
      : "https://volunteers.census.burningman.org/census-survey-reminders";

  const handleShare = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: "2026 BRC Census survey reminder",
          text: SHARE_TEXT,
          url: pageUrl,
        });
        return;
      } catch {
        // user canceled or share failed — fall through to copy
      }
    }
    try {
      await navigator.clipboard.writeText(`${SHARE_TEXT} ${pageUrl}`);
      enqueueSnackbar("Link copied to clipboard", { variant: "success" });
    } catch {
      enqueueSnackbar(pageUrl, { variant: "info" });
    }
  };

  return (
    <>
      <Hero
        imageStyles={{
          backgroundImage: "url(/banners/question-seamless.jpg)",
          backgroundSize: "300px 300px",
        }}
        text="Census survey reminders"
      />
      <Container component="main" sx={{ mb: 6 }}>
        <Box component="section" sx={{ mb: 3 }}>
          <Card>
            <CardContent>
              <Typography sx={{ mb: 2 }}>
                Help us count Black Rock City! Add a calendar reminder now so you
                don&apos;t forget to fill out the <strong>2026 BRC Census
                survey</strong> after the event. You can add these to any
                calendar app — no login needed — and share this page with other
                Burners.
              </Typography>

              {/* Primary CTA */}
              <Button
                component="a"
                href={RECOMMENDED}
                variant="contained"
                color="primary"
                size="large"
                startIcon={<CalendarIcon />}
                sx={{ mb: 1 }}
              >
                Add the recommended reminders
              </Button>
              <Typography color="text.secondary" variant="body2" sx={{ mb: 2 }}>
                Three well-timed nudges: Tue Sep 8 (noon), Sun Sep 13 (3 PM), and
                Tue Oct 6 (noon).
              </Typography>

              <Button
                onClick={handleShare}
                variant="outlined"
                color="secondary"
                startIcon={<ShareIcon />}
              >
                Share the Census reminder
              </Button>
            </CardContent>
          </Card>
        </Box>

        {/* Individual reminders */}
        <Box component="section" sx={{ mb: 3 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 1 }}>
                Prefer to pick your own?
              </Typography>
              <Typography color="text.secondary" variant="body2" sx={{ mb: 2 }}>
                Add any single reminder:
              </Typography>
              <Stack spacing={1}>
                {INDIVIDUAL.map((r) => (
                  <Box key={r.file}>
                    <MuiLink href={`${BASE}${r.file}`} sx={{ fontWeight: 500 }}>
                      {r.label}
                    </MuiLink>{" "}
                    <Typography component="span" color="text.secondary" variant="body2">
                      — {r.when}
                    </Typography>
                  </Box>
                ))}
              </Stack>
              <Divider sx={{ my: 2 }} />
              <MuiLink href={ALL} color="text.secondary" variant="body2">
                Add every reminder (all six)
              </MuiLink>
            </CardContent>
          </Card>
        </Box>

        {/* Offline QR */}
        <Box component="section" sx={{ mb: 3 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 1 }}>
                Add a reminder offline (QR code)
              </Typography>
              <Typography color="text.secondary" variant="body2" sx={{ mb: 2 }}>
                Scan this QR code to add a Census reminder directly to a supported
                phone. The event can be added <strong>offline</strong> — the
                survey link inside it will work once you&apos;re back online.
              </Typography>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={QR_PNG}
                alt="QR code that adds the 2026 BRC Census survey reminder to your phone's calendar (works offline)"
                width={220}
                height={220}
                style={{ maxWidth: "100%", height: "auto", display: "block" }}
              />
              <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
                <Button component="a" href={QR_PNG} download startIcon={<DownloadIcon />} size="small">
                  Download QR (PNG)
                </Button>
                <Button component="a" href={QR_SVG} download startIcon={<DownloadIcon />} size="small">
                  Print-quality QR (SVG)
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Box>

        {/* Fallback */}
        <Box component="section">
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 1 }}>
                Reminder didn&apos;t open?
              </Typography>
              <Typography color="text.secondary" variant="body2">
                Tapping a link above downloads a small <code>.ics</code> calendar
                file. On most phones it opens your calendar app automatically —
                just tap <strong>Add</strong>. If it doesn&apos;t open on its own,
                open the downloaded file from your Downloads or Files app, or try a
                different calendar app. On a computer, open the downloaded file
                with Apple Calendar, Google Calendar (import), or Outlook.
              </Typography>
            </CardContent>
          </Card>
        </Box>
      </Container>
    </>
  );
};
