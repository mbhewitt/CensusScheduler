"use client";

import {
  Assessment as AssessmentIcon,
  Close as CloseIcon,
} from "@mui/icons-material";
import {
  AppBar,
  Box,
  Card,
  CardContent,
  Container,
  Dialog,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { useState } from "react";

import { Hero } from "@/components/layout/Hero";

export const reportList = [
  {
    id: "2025",
    text: "Black Rock City Census 2025 Population Report",
    url: "/reports/2025/index.html",
  },
  {
    id: "2024",
    text: "Black Rock City Census 2024 Population Report",
    url: "/reports/2024/index.html",
  },
  {
    id: "2023",
    text: "Black Rock City Census 2023 Population Report",
    url: "/reports/2023/index.html",
  },
  {
    id: "2022",
    text: "Black Rock City Census: 2013-2022 Population Analysis",
    url: "/reports/2013-2022/index.html",
  },
];
export const Reports = () => {
  // The report files below are bundled locally (/reports/...), so they work
  // offline on playa. The external blackrockcitycensus.org pointer is dead
  // offline, so hide it there (#629, Chipper).
  const isOnPlaya = process.env.NEXT_PUBLIC_PIN_ENABLED !== "false";

  // Reports open IN-APP in a full-screen dialog (iframe), not a new tab. The
  // provisioned tablets block pop-ups / new tabs, so target="_blank" links did
  // nothing there (Chipper 2026-09-03). A same-tab navigation would also strip
  // the back button in the standalone PWA and trap the user — the dialog keeps
  // the app chrome and a Close button, so it works everywhere.
  const [openReport, setOpenReport] = useState<
    null | { text: string; url: string }
  >(null);

  // render
  // ------------------------------------------------------------
  return (
    <>
      <Hero
        imageStyles={{
          backgroundImage: "url(/banners/dotted-seamless.avif)",
        }}
        text="Reports"
      />
      <Container component="main" sx={{ flex: 1 }}>
        <Card>
          <CardContent>
            {!isOnPlaya && (
              <Typography sx={{ mb: 2 }}>
                For the complete Black Rock City Census reports, visit{" "}
                <Link
                  href="https://blackrockcitycensus.org"
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  blackrockcitycensus.org
                </Link>
                .
              </Typography>
            )}
            <List disablePadding>
              {reportList.map(({ id, text, url }) => {
                return (
                  <ListItem disablePadding key={id}>
                    <ListItemButton onClick={() => setOpenReport({ text, url })}>
                      <ListItemIcon sx={{ pr: 1 }}>
                        <AssessmentIcon color="secondary" />
                      </ListItemIcon>
                      <ListItemText primary={text} />
                    </ListItemButton>
                  </ListItem>
                );
              })}
            </List>
          </CardContent>
        </Card>
      </Container>

      <Dialog
        fullScreen
        open={Boolean(openReport)}
        onClose={() => setOpenReport(null)}
      >
        <AppBar sx={{ position: "relative" }}>
          <Toolbar>
            <IconButton
              edge="start"
              color="inherit"
              onClick={() => setOpenReport(null)}
              aria-label="Close report"
            >
              <CloseIcon />
            </IconButton>
            <Typography sx={{ ml: 2, flex: 1 }} variant="h6" component="div">
              {openReport?.text}
            </Typography>
          </Toolbar>
        </AppBar>
        {openReport && (
          <Box
            component="iframe"
            src={openReport.url}
            title={openReport.text}
            sx={{ border: 0, flex: 1, width: "100%", height: "100%" }}
          />
        )}
      </Dialog>
    </>
  );
};
