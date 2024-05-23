import { Card, CardContent, Container, Typography } from "@mui/material";

import { Hero } from "src/components/layout/Hero";

export const Reports = () => {
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
