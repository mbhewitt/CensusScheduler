"use client";

import { Box, Card, CardContent, Container, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";

import { DeveloperMode } from "@/app/settings/DeveloperMode";
import { Hero } from "@/components/layout/Hero";

export const Settings = () => {
  // other hooks
  // ------------------------------------------------------------
  const theme = useTheme();

  // render
  // ------------------------------------------------------------
  return (
    <>
      <Hero
        imageStyles={{
          backgroundColor: theme.palette.primary.light,
          backgroundImage: `linear-gradient(${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
        }}
        text="Settings"
      />
      <Container component="main">
        <Box component="section">
          <Typography component="h2" variant="h4" sx={{ mb: 2 }}>
            Developer mode
          </Typography>
          <Card>
            <CardContent>
              <DeveloperMode />
            </CardContent>
          </Card>
        </Box>
      </Container>
    </>
  );
};
