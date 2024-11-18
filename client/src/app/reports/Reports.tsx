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
} from "@mui/material";
import Link from "next/link";

import { Hero } from "src/components/layout/Hero";

export const Reports = () => {
  const reportList = [
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

  // render
  // --------------------
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
