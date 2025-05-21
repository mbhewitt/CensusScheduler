"use client";

import { Box, Container } from "@mui/material";
import { useTheme } from "@mui/material/styles";

import { Dates } from "@/app/calendar/dates/Dates";
import { Hero } from "@/components/layout/Hero";

export const Calendar = () => {
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
        text="Calendar"
      />
      <Container component="main">
        <Box component="section">
          <Dates />
        </Box>
      </Container>
    </>
  );
};
