"use client";

import { Assessment as AssessmentIcon } from "@mui/icons-material";
import {
  Card,
  CardContent,
  Container,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Typography,
} from "@mui/material";
import Link from "next/link";

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
                    <Link
                      href={url}
                      style={{ alignItems: "center", display: "flex" }}
                      target="_blank"
                    >
                      <ListItemIcon sx={{ pr: 1 }}>
                        <AssessmentIcon color="secondary" />
                      </ListItemIcon>
                      <ListItemText primary={text} />
                    </Link>
                  </ListItem>
                );
              })}
            </List>
          </CardContent>
        </Card>
      </Container>
    </>
  );
};
