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
  // #755: older years, copied from the Census Report Archive
  // (BRC-Census/reports); see public/reports/archive/README.md.
  {
    id: "2019",
    text: "Black Rock City Census 2019 Population Analysis",
    url: "/reports/archive/2019/index.html",
  },
  {
    id: "2018",
    text: "Black Rock City Census 2018 Population Analysis",
    url: "/reports/archive/2018/index.html",
  },
  {
    id: "2017-summary",
    text: "Black Rock City Census 2017 Summary Report",
    url: "/reports/archive/2017-summary-report/index.html",
  },
  {
    id: "2017",
    text: "Black Rock City Census 2017 Population Analysis",
    url: "/reports/archive/2017/index.html",
  },
  {
    id: "2016-analysis",
    text: "Black Rock City Census 2016 Population Analysis",
    url: "/reports/archive/2016-population-analysis/index.html",
  },
  {
    id: "2016",
    text: "Black Rock City Census 2016 Weighted Results",
    url: "/reports/archive/2016/index.html",
  },
  {
    id: "2015",
    text: "Black Rock City Census 2015 Weighted Results",
    url: "/reports/archive/2015/index.html",
  },
  {
    id: "2015-annual",
    text: "Black Rock City Census 2015 Annual Report",
    url: "/reports/archive/2015-annual-report/index.html",
  },
  {
    id: "2014",
    text: "Black Rock City Census 2014 Weighted Results",
    url: "/reports/archive/2014/index.html",
  },
  {
    id: "2013",
    text: "Black Rock City Census 2013 Weighted Results",
    url: "/reports/archive/2013/index.html",
  },
  {
    id: "2012",
    text: "Black Rock City Census 2012 Weighted Results",
    url: "/reports/archive/2012/index.html",
  },
  {
    id: "2011",
    text: "Black Rock City Census 2011 After Burn Report",
    url: "/reports/archive/2011/index.html",
  },
  {
    id: "2010",
    text: "Black Rock City Census 2010 After Burn Report",
    url: "/reports/archive/2010/index.html",
  },
  {
    id: "2009",
    text: "Black Rock City Census 2009 After Burn Report",
    url: "/reports/archive/2009/index.html",
  },
  {
    id: "2008",
    text: "Black Rock City Census 2008 After Burn Report",
    url: "/reports/archive/2008/index.html",
  },
  {
    id: "2007",
    text: "Black Rock City Census 2007 After Burn Report",
    url: "/reports/archive/2007/index.html",
  },
  {
    id: "2006",
    text: "Black Rock City Census 2006 After Burn Report",
    url: "/reports/archive/2006/index.html",
  },
  {
    id: "2005",
    text: "Black Rock City Census 2005 After Burn Report",
    url: "/reports/archive/2005/index.html",
  },
  {
    id: "2001",
    text: "Black Rock City Census 2001 After Burn Report",
    url: "/reports/archive/2001/index.html",
  },
];
export const Reports = () => {
  // The report files below are bundled locally (/reports/...), so they work
  // offline on playa. The external archive link is dead offline, so hide it
  // there (#629, Chipper).
  const isOnPlaya = process.env.NEXT_PUBLIC_PIN_ENABLED !== "false";

  // Reports open IN-APP in a full-screen dialog (iframe), not a new tab. The
  // provisioned tablets block pop-ups / new tabs, so target="_blank" links did
  // nothing there (Chipper 2026-09-03). A same-tab navigation would also strip
  // the back button in the standalone PWA and trap the user — the dialog keeps
  // the app chrome and a Close button, so it works everywhere.
  const [openReport, setOpenReport] = useState<null | {
    text: string;
    url: string;
  }>(null);

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
                For every Black Rock City Census report back to 2001, visit the{" "}
                <Link
                  href="https://brc-census.github.io/reports/"
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  Census Report Archive
                </Link>
                .
              </Typography>
            )}
            <List disablePadding>
              {reportList.map(({ id, text, url }) => {
                return (
                  <ListItem disablePadding key={id}>
                    <ListItemButton
                      onClick={() => setOpenReport({ text, url })}
                    >
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
