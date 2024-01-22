import { Card, CardContent, Container, Typography } from "@mui/material";
import Image from "next/image";

import { Hero } from "src/components/layout/Hero";

export const Reports = () => {
  return (
    <>
      <Hero
        Image={
          <Image
            alt="temple burning"
            fill
            priority
            src="/reports/hero.jpg"
            style={{
              objectFit: "cover",
            }}
          />
        }
        text="Reports"
      />
      <Container component="main" sx={{ flex: 1 }}>
        <Card>
          <CardContent>
            <Typography>
              <a href="/reports/population-analysis/index.html" target="_blank">
                Black Rock City Census: 2013-2022 Population Analysis
              </a>
            </Typography>
          </CardContent>
        </Card>
      </Container>
    </>
  );
};
